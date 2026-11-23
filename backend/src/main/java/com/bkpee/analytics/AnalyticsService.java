package com.bkpee.analytics;

import com.bkpee.analytics.AnalyticsModels.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.springframework.http.HttpStatus.*;

@Service
public class AnalyticsService {

    private final JdbcTemplate db;

    public AnalyticsService(JdbcTemplate db) {
        this.db = db;
    }

    static String normalizeScope(String statusScope) {
        if (statusScope != null && "DELIVERED".equalsIgnoreCase(statusScope.trim())) {
            return "DELIVERED";
        }
        return "VALID";
    }

    static String policyDescription(String scope) {
        if ("DELIVERED".equals(scope)) {
            return "Chỉ tính các đơn hàng con đã giao thành công (Delivery_Status = DELIVERED) theo đơn giá lịch sử lúc mua (Purchase_Price).";
        }
        return "Tính tất cả đơn hàng hợp lệ (loại trừ đơn CANCELLED, RETURNED và giao dịch REFUNDED) theo đơn giá lịch sử lúc mua (Purchase_Price).";
    }

    private String statusWhereClause(String scope) {
        if ("DELIVERED".equals(scope)) {
            return " AND so.Delivery_Status = N'DELIVERED' ";
        }
        return """
             AND so.Delivery_Status NOT IN (N'CANCELLED', N'RETURNED')
             AND NOT EXISTS (
                 SELECT 1 FROM Payment_Information pi
                 WHERE pi.Order_ID = o.Order_ID AND pi.Payment_Status = N'REFUNDED'
             )
            """;
    }

    static List<MonthlyRevenuePoint> fillTwelveMonths(Map<Integer, MonthlyRevenuePoint> byMonth) {
        List<MonthlyRevenuePoint> result = new ArrayList<>(12);
        for (int m = 1; m <= 12; m++) {
            MonthlyRevenuePoint existing = byMonth.get(m);
            if (existing != null) {
                result.add(existing);
            } else {
                result.add(new MonthlyRevenuePoint(m, "T" + m, BigDecimal.ZERO, 0L, 0L));
            }
        }
        return result;
    }

    static double sharePercent(BigDecimal part, BigDecimal total) {
        if (part == null || total == null || total.compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        return part.multiply(new BigDecimal("100"))
            .divide(total, 2, RoundingMode.HALF_UP)
            .doubleValue();
    }

    static String targetTypeLabel(String targetType) {
        if (targetType == null) return "Khác";
        return switch (targetType.toUpperCase(Locale.ROOT)) {
            case "BOOK" -> "Sách & Văn phòng phẩm";
            case "CLOTHES" -> "Thời trang & May mặc";
            case "ELECTRONICS" -> "Thiết bị điện tử";
            default -> "Khác";
        };
    }

    /**
     * F07 — Aggregate Seller Revenue by Month (SUM, COUNT(DISTINCT), GROUP BY).
     */
    @Transactional(readOnly = true)
    public SellerRevenueReport getSellerRevenue(int sellerId, Integer yearParam, String statusScopeParam) {
        String shopName = db.query(
            "SELECT Shop_Name FROM Seller WHERE Account_ID = ?",
            rs -> rs.next() ? rs.getString(1) : null,
            sellerId
        );
        if (shopName == null) {
            throw new ResponseStatusException(FORBIDDEN, "Tài khoản chưa có quyền Seller");
        }

        int year = (yearParam != null) ? yearParam : LocalDate.now().getYear();
        if (year < 2000 || year > 2100) {
            throw new ResponseStatusException(BAD_REQUEST, "Năm thống kê không hợp lệ");
        }
        String scope = normalizeScope(statusScopeParam);
        LocalDateTime startOfYear = LocalDate.of(year, 1, 1).atStartOfDay();
        LocalDateTime startOfNextYear = LocalDate.of(year + 1, 1, 1).atStartOfDay();
        String statusClause = statusWhereClause(scope);

        // 1. Monthly aggregate query (GROUP BY MONTH)
        String monthlySql = """
            SELECT
                MONTH(o.Order_Time) AS orderMonth,
                COALESCE(SUM(CAST(soi.Quantity AS DECIMAL(18,2)) * soi.Purchase_Price), 0) AS revenue,
                COUNT(DISTINCT so.Shop_Order_ID) AS orderCount,
                COALESCE(SUM(CAST(soi.Quantity AS BIGINT)), 0) AS itemsSold
            FROM Shop_Order so
            JOIN [Order] o ON o.Order_ID = so.Order_ID
            JOIN Shop_Order_Item soi ON soi.Shop_Order_ID = so.Shop_Order_ID
            WHERE so.Seller_ID = ?
              AND o.Order_Time >= ? AND o.Order_Time < ?
            """ + statusClause + """
            GROUP BY MONTH(o.Order_Time)
            ORDER BY orderMonth ASC
            """;

        Map<Integer, MonthlyRevenuePoint> byMonth = new HashMap<>();
        db.query(monthlySql, rs -> {
            int month = rs.getInt("orderMonth");
            BigDecimal rev = rs.getBigDecimal("revenue");
            long orders = rs.getLong("orderCount");
            long items = rs.getLong("itemsSold");
            byMonth.put(month, new MonthlyRevenuePoint(month, "T" + month, rev, orders, items));
        }, sellerId, Timestamp.valueOf(startOfYear), Timestamp.valueOf(startOfNextYear));

        List<MonthlyRevenuePoint> monthly = fillTwelveMonths(byMonth);

        BigDecimal totalRevenue = monthly.stream()
            .map(MonthlyRevenuePoint::revenue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalOrders = monthly.stream().mapToLong(MonthlyRevenuePoint::orderCount).sum();
        long totalItemsSold = monthly.stream().mapToLong(MonthlyRevenuePoint::itemsSold).sum();
        BigDecimal avgOrder = totalOrders > 0
            ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        // 2. Top selling products in the selected year (JOIN + GROUP BY + ORDER BY SUM DESC)
        String topProductsSql = """
            SELECT TOP 5
                p.Product_ID AS productId,
                p.Product_Name AS productName,
                c.Category_Name AS categoryName,
                COALESCE(SUM(CAST(soi.Quantity AS BIGINT)), 0) AS unitsSold,
                COALESCE(SUM(CAST(soi.Quantity AS DECIMAL(18,2)) * soi.Purchase_Price), 0) AS revenue
            FROM Shop_Order so
            JOIN [Order] o ON o.Order_ID = so.Order_ID
            JOIN Shop_Order_Item soi ON soi.Shop_Order_ID = so.Shop_Order_ID
            JOIN Product_Variant pv ON pv.Variant_ID = soi.Variant_ID
            JOIN Product p ON p.Product_ID = pv.Product_ID
            JOIN Category c ON c.Category_ID = p.Category_ID
            WHERE so.Seller_ID = ?
              AND o.Order_Time >= ? AND o.Order_Time < ?
            """ + statusClause + """
            GROUP BY p.Product_ID, p.Product_Name, c.Category_Name
            ORDER BY revenue DESC, unitsSold DESC
            """;

        List<TopProductStat> topProducts = db.query(
            topProductsSql,
            (rs, rowNum) -> new TopProductStat(
                rs.getInt("productId"),
                rs.getString("productName"),
                rs.getString("categoryName"),
                rs.getLong("unitsSold"),
                rs.getBigDecimal("revenue")
            ),
            sellerId, Timestamp.valueOf(startOfYear), Timestamp.valueOf(startOfNextYear)
        );

        // 3. Breakdown across all delivery statuses for operational transparency
        List<StatusBreakdown> statusBreakdown = db.query("""
            SELECT
                so.Delivery_Status AS deliveryStatus,
                COUNT(DISTINCT so.Shop_Order_ID) AS orderCount,
                COALESCE(SUM(CAST(soi.Quantity AS DECIMAL(18,2)) * soi.Purchase_Price), 0) AS revenue
            FROM Shop_Order so
            JOIN [Order] o ON o.Order_ID = so.Order_ID
            JOIN Shop_Order_Item soi ON soi.Shop_Order_ID = so.Shop_Order_ID
            WHERE so.Seller_ID = ?
              AND o.Order_Time >= ? AND o.Order_Time < ?
            GROUP BY so.Delivery_Status
            ORDER BY revenue DESC
            """,
            (rs, rowNum) -> new StatusBreakdown(
                rs.getString("deliveryStatus"),
                rs.getLong("orderCount"),
                rs.getBigDecimal("revenue")
            ),
            sellerId, Timestamp.valueOf(startOfYear), Timestamp.valueOf(startOfNextYear)
        );

        return new SellerRevenueReport(
            sellerId,
            shopName,
            year,
            scope,
            policyDescription(scope),
            totalRevenue,
            totalOrders,
            totalItemsSold,
            avgOrder,
            monthly,
            topProducts,
            statusBreakdown
        );
    }

    /**
     * F13 — Aggregate Buyer Personal Spending by Category, Product Target Type, and Month.
     */
    @Transactional(readOnly = true)
    public BuyerSpendingReport getBuyerSpending(
        int buyerId,
        LocalDate fromDate,
        LocalDate toDate,
        String statusScopeParam
    ) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new ResponseStatusException(BAD_REQUEST, "Ngày bắt đầu không được lớn hơn ngày kết thúc");
        }
        String scope = normalizeScope(statusScopeParam);
        String statusClause = statusWhereClause(scope);

        StringBuilder dateClause = new StringBuilder();
        List<Object> baseParams = new ArrayList<>();
        baseParams.add(buyerId);
        if (fromDate != null) {
            dateClause.append(" AND o.Order_Time >= ? ");
            baseParams.add(Timestamp.valueOf(fromDate.atStartOfDay()));
        }
        if (toDate != null) {
            dateClause.append(" AND o.Order_Time < ? ");
            baseParams.add(Timestamp.valueOf(toDate.plusDays(1).atStartOfDay()));
        }

        // 1. Summary KPIs (COUNT(DISTINCT o.Order_ID), SUM(Quantity * Purchase_Price))
        String summarySql = """
            SELECT
                COALESCE(SUM(CAST(soi.Quantity AS DECIMAL(18,2)) * soi.Purchase_Price), 0) AS totalSpent,
                COUNT(DISTINCT o.Order_ID) AS totalOrders,
                COALESCE(SUM(CAST(soi.Quantity AS BIGINT)), 0) AS totalItems
            FROM [Order] o
            JOIN Shop_Order so ON so.Order_ID = o.Order_ID
            JOIN Shop_Order_Item soi ON soi.Shop_Order_ID = so.Shop_Order_ID
            WHERE o.Buyer_ID = ?
            """ + dateClause + statusClause;

        record Summary(BigDecimal totalSpent, long totalOrders, long totalItems) {}
        Summary summary = db.queryForObject(
            summarySql,
            (rs, rowNum) -> new Summary(
                rs.getBigDecimal("totalSpent"),
                rs.getLong("totalOrders"),
                rs.getLong("totalItems")
            ),
            baseParams.toArray()
        );

        BigDecimal totalSpent = summary != null && summary.totalSpent() != null ? summary.totalSpent() : BigDecimal.ZERO;
        long totalOrders = summary != null ? summary.totalOrders() : 0L;
        long totalItems = summary != null ? summary.totalItems() : 0L;
        BigDecimal avgOrder = totalOrders > 0
            ? totalSpent.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        // 2. Spending grouped by Category (JOIN 6 tables + GROUP BY Category)
        String categorySql = """
            SELECT
                c.Category_ID AS categoryId,
                c.Category_Name AS categoryName,
                c.Target_Type AS targetType,
                COUNT(DISTINCT o.Order_ID) AS orderCount,
                COALESCE(SUM(CAST(soi.Quantity AS BIGINT)), 0) AS itemsPurchased,
                COALESCE(SUM(CAST(soi.Quantity AS DECIMAL(18,2)) * soi.Purchase_Price), 0) AS totalSpent
            FROM [Order] o
            JOIN Shop_Order so ON so.Order_ID = o.Order_ID
            JOIN Shop_Order_Item soi ON soi.Shop_Order_ID = so.Shop_Order_ID
            JOIN Product_Variant pv ON pv.Variant_ID = soi.Variant_ID
            JOIN Product p ON p.Product_ID = pv.Product_ID
            JOIN Category c ON c.Category_ID = p.Category_ID
            WHERE o.Buyer_ID = ?
            """ + dateClause + statusClause + """
            GROUP BY c.Category_ID, c.Category_Name, c.Target_Type
            ORDER BY totalSpent DESC
            """;

        List<CategorySpendingItem> byCategory = db.query(
            categorySql,
            (rs, rowNum) -> {
                BigDecimal spent = rs.getBigDecimal("totalSpent");
                return new CategorySpendingItem(
                    rs.getInt("categoryId"),
                    rs.getString("categoryName"),
                    rs.getString("targetType"),
                    rs.getLong("orderCount"),
                    rs.getLong("itemsPurchased"),
                    spent,
                    sharePercent(spent, totalSpent)
                );
            },
            baseParams.toArray()
        );

        // 3. Spending grouped by Target_Type (BOOK / CLOTHES / ELECTRONICS / GENERAL)
        String targetTypeSql = """
            SELECT
                c.Target_Type AS targetType,
                COUNT(DISTINCT o.Order_ID) AS orderCount,
                COALESCE(SUM(CAST(soi.Quantity AS BIGINT)), 0) AS itemsPurchased,
                COALESCE(SUM(CAST(soi.Quantity AS DECIMAL(18,2)) * soi.Purchase_Price), 0) AS totalSpent
            FROM [Order] o
            JOIN Shop_Order so ON so.Order_ID = o.Order_ID
            JOIN Shop_Order_Item soi ON soi.Shop_Order_ID = so.Shop_Order_ID
            JOIN Product_Variant pv ON pv.Variant_ID = soi.Variant_ID
            JOIN Product p ON p.Product_ID = pv.Product_ID
            JOIN Category c ON c.Category_ID = p.Category_ID
            WHERE o.Buyer_ID = ?
            """ + dateClause + statusClause + """
            GROUP BY c.Target_Type
            ORDER BY totalSpent DESC
            """;

        List<TargetTypeSpendingItem> byTargetType = db.query(
            targetTypeSql,
            (rs, rowNum) -> {
                String t = rs.getString("targetType");
                BigDecimal spent = rs.getBigDecimal("totalSpent");
                return new TargetTypeSpendingItem(
                    t,
                    targetTypeLabel(t),
                    rs.getLong("orderCount"),
                    rs.getLong("itemsPurchased"),
                    spent,
                    sharePercent(spent, totalSpent)
                );
            },
            baseParams.toArray()
        );

        // 4. Monthly spending trend
        String trendSql = """
            SELECT
                YEAR(o.Order_Time) AS orderYear,
                MONTH(o.Order_Time) AS orderMonth,
                COALESCE(SUM(CAST(soi.Quantity AS DECIMAL(18,2)) * soi.Purchase_Price), 0) AS totalSpent,
                COUNT(DISTINCT o.Order_ID) AS orderCount
            FROM [Order] o
            JOIN Shop_Order so ON so.Order_ID = o.Order_ID
            JOIN Shop_Order_Item soi ON soi.Shop_Order_ID = so.Shop_Order_ID
            WHERE o.Buyer_ID = ?
            """ + dateClause + statusClause + """
            GROUP BY YEAR(o.Order_Time), MONTH(o.Order_Time)
            ORDER BY orderYear ASC, orderMonth ASC
            """;

        List<MonthlySpendingPoint> monthlyTrend = db.query(
            trendSql,
            (rs, rowNum) -> {
                int y = rs.getInt("orderYear");
                int m = rs.getInt("orderMonth");
                return new MonthlySpendingPoint(
                    y,
                    m,
                    String.format("T%02d/%d", m, y),
                    rs.getBigDecimal("totalSpent"),
                    rs.getLong("orderCount")
                );
            },
            baseParams.toArray()
        );

        return new BuyerSpendingReport(
            buyerId,
            fromDate,
            toDate,
            scope,
            policyDescription(scope),
            totalSpent,
            totalOrders,
            totalItems,
            avgOrder,
            byCategory,
            byTargetType,
            monthlyTrend
        );
    }
}
