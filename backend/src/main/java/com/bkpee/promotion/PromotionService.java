package com.bkpee.promotion;

import com.bkpee.promotion.PromotionModels.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

import static org.springframework.http.HttpStatus.*;

@Service
public class PromotionService {

    private final JdbcTemplate db;

    public PromotionService(JdbcTemplate db) {
        this.db = db;
    }

    private void ensureSeller(int sellerId) {
        Integer count = db.queryForObject(
            "SELECT COUNT(*) FROM Seller WHERE Account_ID = ?",
            Integer.class,
            sellerId
        );
        if (count == null || count == 0) {
            throw new ResponseStatusException(FORBIDDEN, "Tài khoản chưa có quyền Seller");
        }
    }

    private void validatePromotionInput(
        String rawType,
        Integer quantity,
        LocalDateTime startDate,
        LocalDateTime expirationDate,
        BigDecimal minBill,
        BigDecimal percentDiscount,
        BigDecimal maxDiscount,
        BigDecimal voucherValue,
        List<Integer> variantIds
    ) {
        if (rawType == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Loại khuyến mãi không được để trống");
        }
        String type = rawType.trim().toUpperCase(Locale.ROOT);
        if (!"COUPON".equals(type) && !"VOUCHER".equals(type)) {
            throw new ResponseStatusException(BAD_REQUEST, "Loại khuyến mãi phải là COUPON hoặc VOUCHER");
        }
        if (quantity == null || quantity < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Số lượt sử dụng phải lớn hơn hoặc bằng 0");
        }
        if (startDate == null || expirationDate == null || expirationDate.isBefore(startDate)) {
            throw new ResponseStatusException(BAD_REQUEST, "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
        }
        if (minBill == null || minBill.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Đơn tối thiểu phải lớn hơn hoặc bằng 0");
        }
        if ("COUPON".equals(type)) {
            if (percentDiscount == null
                || percentDiscount.compareTo(BigDecimal.ZERO) <= 0
                || percentDiscount.compareTo(new BigDecimal("100")) > 0) {
                throw new ResponseStatusException(BAD_REQUEST, "Phần trăm giảm giá phải trong khoảng (0, 100]");
            }
            if (maxDiscount != null && maxDiscount.compareTo(BigDecimal.ZERO) < 0) {
                throw new ResponseStatusException(BAD_REQUEST, "Mức giảm tối đa không được âm");
            }
        } else {
            if (voucherValue == null || voucherValue.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(BAD_REQUEST, "Giá trị voucher phải lớn hơn 0");
            }
        }
        if (variantIds == null || variantIds.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Vui lòng chọn ít nhất một biến thể sản phẩm áp dụng");
        }
    }

    private List<Integer> validateSellerVariants(int sellerId, List<Integer> variantIds) {
        List<Integer> uniqueIds = variantIds.stream().filter(Objects::nonNull).distinct().toList();
        if (uniqueIds.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Danh sách biến thể áp dụng không hợp lệ");
        }
        String placeholders = String.join(",", Collections.nCopies(uniqueIds.size(), "?"));
        String sql = """
            SELECT pv.Variant_ID
            FROM Product_Variant pv
            JOIN Product p ON p.Product_ID = pv.Product_ID
            WHERE p.Seller_ID = ? AND pv.Variant_ID IN (""" + placeholders + ")";

        List<Object> params = new ArrayList<>();
        params.add(sellerId);
        params.addAll(uniqueIds);

        List<Integer> owned = db.queryForList(sql, Integer.class, params.toArray());
        if (owned.size() != uniqueIds.size()) {
            throw new ResponseStatusException(
                FORBIDDEN,
                "Một hoặc nhiều biến thể sản phẩm không tồn tại hoặc không thuộc gian hàng của bạn"
            );
        }
        return uniqueIds;
    }

    static String computeStatus(int quantity, LocalDateTime startDate, LocalDateTime expirationDate, LocalDateTime now) {
        if (quantity <= 0) return "OUT_OF_STOCK";
        if (now.isBefore(startDate)) return "UPCOMING";
        if (now.isAfter(expirationDate)) return "EXPIRED";
        return "ACTIVE";
    }

    /**
     * Pure discount calculation shared between Buyer preview and Checkout execution.
     */
    public static BigDecimal calculateDiscountAmount(
        String type,
        BigDecimal eligibleSubtotal,
        BigDecimal minBill,
        BigDecimal percentDiscount,
        BigDecimal maxDiscount,
        BigDecimal voucherValue
    ) {
        if (eligibleSubtotal == null || eligibleSubtotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        if (minBill != null && eligibleSubtotal.compareTo(minBill) < 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal discount;
        if ("COUPON".equalsIgnoreCase(type)) {
            if (percentDiscount == null || percentDiscount.compareTo(BigDecimal.ZERO) <= 0) {
                return BigDecimal.ZERO;
            }
            discount = eligibleSubtotal
                .multiply(percentDiscount)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            if (maxDiscount != null && maxDiscount.compareTo(BigDecimal.ZERO) > 0 && discount.compareTo(maxDiscount) > 0) {
                discount = maxDiscount;
            }
        } else {
            discount = voucherValue == null ? BigDecimal.ZERO : voucherValue;
        }
        if (discount.compareTo(eligibleSubtotal) > 0) {
            discount = eligibleSubtotal;
        }
        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional(readOnly = true)
    public List<SellerVariantOption> listSellerVariants(int sellerId) {
        ensureSeller(sellerId);
        return db.query("""
            SELECT
                pv.Variant_ID AS variantId,
                p.Product_ID AS productId,
                p.Product_Name AS productName,
                pv.Variant_Name AS variantName,
                c.Category_Name AS categoryName,
                pv.Price AS price,
                pv.Quantity_Stock AS stock,
                pv.Is_Active AS active,
                pv.Image AS image
            FROM Product_Variant pv
            JOIN Product p ON p.Product_ID = pv.Product_ID
            JOIN Category c ON c.Category_ID = p.Category_ID
            WHERE p.Seller_ID = ?
            ORDER BY p.Product_ID DESC, pv.Variant_ID ASC
            """,
            (rs, rowNum) -> new SellerVariantOption(
                rs.getInt("variantId"),
                rs.getInt("productId"),
                rs.getString("productName"),
                rs.getString("variantName"),
                rs.getString("categoryName"),
                rs.getBigDecimal("price"),
                rs.getInt("stock"),
                rs.getBoolean("active"),
                rs.getString("image")
            ),
            sellerId
        );
    }

    @Transactional(readOnly = true)
    public List<PromotionItem> listSellerPromotions(int sellerId, String statusFilter) {
        ensureSeller(sellerId);
        LocalDateTime now = LocalDateTime.now();

        List<PromotionItem> raw = db.query("""
            SELECT
                pr.Promotion_ID AS promotionId,
                pr.Seller_ID AS sellerId,
                s.Shop_Name AS shopName,
                pr.Type AS type,
                pr.Quantity AS quantity,
                pr.Start_Date AS startDate,
                pr.Expiration_Date AS expirationDate,
                pr.Min_Bill AS minBill,
                cp.percent_discount AS percentDiscount,
                cp.max_discount AS maxDiscount,
                vc.voucher_value AS voucherValue
            FROM Promotion pr
            JOIN Seller s ON s.Account_ID = pr.Seller_ID
            LEFT JOIN Coupon cp ON cp.Promotion_ID = pr.Promotion_ID
            LEFT JOIN Voucher vc ON vc.Promotion_ID = pr.Promotion_ID
            WHERE pr.Seller_ID = ?
            ORDER BY pr.Promotion_ID DESC
            """,
            (rs, rowNum) -> {
                int promoId = rs.getInt("promotionId");
                LocalDateTime start = rs.getTimestamp("startDate").toLocalDateTime();
                LocalDateTime end = rs.getTimestamp("expirationDate").toLocalDateTime();
                int qty = rs.getInt("quantity");
                List<AppliedVariant> variants = loadAppliedVariants(promoId);
                return new PromotionItem(
                    promoId,
                    rs.getInt("sellerId"),
                    rs.getString("shopName"),
                    rs.getString("type"),
                    qty,
                    start,
                    end,
                    rs.getBigDecimal("minBill"),
                    rs.getBigDecimal("percentDiscount"),
                    rs.getBigDecimal("maxDiscount"),
                    rs.getBigDecimal("voucherValue"),
                    computeStatus(qty, start, end, now),
                    variants.size(),
                    variants
                );
            },
            sellerId
        );

        if (statusFilter == null || statusFilter.isBlank() || "ALL".equalsIgnoreCase(statusFilter)) {
            return raw;
        }
        String normalized = statusFilter.trim().toUpperCase(Locale.ROOT);
        return raw.stream().filter(p -> p.status().equalsIgnoreCase(normalized)).toList();
    }

    private List<AppliedVariant> loadAppliedVariants(int promotionId) {
        return db.query("""
            SELECT
                pv.Variant_ID AS variantId,
                p.Product_ID AS productId,
                p.Product_Name AS productName,
                pv.Variant_Name AS variantName,
                pv.Price AS price,
                pv.Quantity_Stock AS stock,
                pv.Is_Active AS active,
                pv.Image AS image
            FROM Promotion_Apply pa
            JOIN Product_Variant pv ON pv.Variant_ID = pa.Variant_ID
            JOIN Product p ON p.Product_ID = pv.Product_ID
            WHERE pa.Promotion_ID = ?
            ORDER BY p.Product_ID, pv.Variant_ID
            """,
            (rs, rowNum) -> new AppliedVariant(
                rs.getInt("variantId"),
                rs.getInt("productId"),
                rs.getString("productName"),
                rs.getString("variantName"),
                rs.getBigDecimal("price"),
                rs.getInt("stock"),
                rs.getBoolean("active"),
                rs.getString("image")
            ),
            promotionId
        );
    }

    @Transactional
    public PromotionItem createPromotion(int sellerId, CreatePromotionRequest req) {
        ensureSeller(sellerId);
        validatePromotionInput(
            req.type(), req.quantity(), req.startDate(), req.expirationDate(),
            req.minBill(), req.percentDiscount(), req.maxDiscount(), req.voucherValue(), req.variantIds()
        );
        String type = req.type().trim().toUpperCase(Locale.ROOT);
        List<Integer> variantIds = validateSellerVariants(sellerId, req.variantIds());

        GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();
        db.update(conn -> {
            PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO Promotion (
                    Quantity, Start_Date, Expiration_Date, Min_Bill, Type, Seller_ID,
                    Created_At, Created_By, Updated_At, Updated_By
                ) VALUES (?, ?, ?, ?, ?, ?, SYSDATETIME(), ?, SYSDATETIME(), ?)
                """, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, req.quantity());
            ps.setTimestamp(2, Timestamp.valueOf(req.startDate()));
            ps.setTimestamp(3, Timestamp.valueOf(req.expirationDate()));
            ps.setBigDecimal(4, req.minBill());
            ps.setString(5, type);
            ps.setInt(6, sellerId);
            ps.setInt(7, sellerId);
            ps.setInt(8, sellerId);
            return ps;
        }, keyHolder);

        Number generatedKey = keyHolder.getKey();
        if (generatedKey == null) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Không thể tạo khuyến mãi");
        }
        int promotionId = generatedKey.intValue();

        if ("COUPON".equals(type)) {
            db.update(
                "INSERT INTO Coupon (Promotion_ID, percent_discount, max_discount) VALUES (?, ?, ?)",
                promotionId, req.percentDiscount(), req.maxDiscount()
            );
        } else {
            db.update(
                "INSERT INTO Voucher (Promotion_ID, voucher_value) VALUES (?, ?)",
                promotionId, req.voucherValue()
            );
        }

        for (Integer variantId : variantIds) {
            db.update(
                "INSERT INTO Promotion_Apply (Variant_ID, Promotion_ID) VALUES (?, ?)",
                variantId, promotionId
            );
        }

        return getPromotionForSeller(sellerId, promotionId);
    }

    @Transactional
    public PromotionItem updatePromotion(int sellerId, int promotionId, UpdatePromotionRequest req) {
        ensureSeller(sellerId);
        Integer ownerId = db.query(
            "SELECT Seller_ID FROM Promotion WHERE Promotion_ID = ?",
            rs -> rs.next() ? rs.getInt(1) : null,
            promotionId
        );
        if (ownerId == null) {
            throw new ResponseStatusException(NOT_FOUND, "Không tìm thấy chương trình khuyến mãi");
        }
        if (ownerId != sellerId) {
            throw new ResponseStatusException(FORBIDDEN, "Bạn không có quyền chỉnh sửa khuyến mãi này");
        }

        validatePromotionInput(
            req.type(), req.quantity(), req.startDate(), req.expirationDate(),
            req.minBill(), req.percentDiscount(), req.maxDiscount(), req.voucherValue(), req.variantIds()
        );
        String type = req.type().trim().toUpperCase(Locale.ROOT);
        List<Integer> variantIds = validateSellerVariants(sellerId, req.variantIds());

        db.update("""
            UPDATE Promotion
            SET Quantity = ?, Start_Date = ?, Expiration_Date = ?, Min_Bill = ?, Type = ?,
                Updated_At = SYSDATETIME(), Updated_By = ?
            WHERE Promotion_ID = ?
            """,
            req.quantity(),
            Timestamp.valueOf(req.startDate()),
            Timestamp.valueOf(req.expirationDate()),
            req.minBill(),
            type,
            sellerId,
            promotionId
        );

        db.update("DELETE FROM Coupon WHERE Promotion_ID = ?", promotionId);
        db.update("DELETE FROM Voucher WHERE Promotion_ID = ?", promotionId);
        if ("COUPON".equals(type)) {
            db.update(
                "INSERT INTO Coupon (Promotion_ID, percent_discount, max_discount) VALUES (?, ?, ?)",
                promotionId, req.percentDiscount(), req.maxDiscount()
            );
        } else {
            db.update(
                "INSERT INTO Voucher (Promotion_ID, voucher_value) VALUES (?, ?)",
                promotionId, req.voucherValue()
            );
        }

        db.update("DELETE FROM Promotion_Apply WHERE Promotion_ID = ?", promotionId);
        for (Integer variantId : variantIds) {
            db.update(
                "INSERT INTO Promotion_Apply (Variant_ID, Promotion_ID) VALUES (?, ?)",
                variantId, promotionId
            );
        }

        return getPromotionForSeller(sellerId, promotionId);
    }

    @Transactional
    public void deletePromotion(int sellerId, int promotionId) {
        ensureSeller(sellerId);
        Integer ownerId = db.query(
            "SELECT Seller_ID FROM Promotion WHERE Promotion_ID = ?",
            rs -> rs.next() ? rs.getInt(1) : null,
            promotionId
        );
        if (ownerId == null) {
            throw new ResponseStatusException(NOT_FOUND, "Không tìm thấy chương trình khuyến mãi");
        }
        if (ownerId != sellerId) {
            throw new ResponseStatusException(FORBIDDEN, "Bạn không có quyền xóa khuyến mãi này");
        }
        // Coupon, Voucher, Promotion_Apply all have ON DELETE CASCADE
        db.update("DELETE FROM Promotion WHERE Promotion_ID = ?", promotionId);
    }

    private PromotionItem getPromotionForSeller(int sellerId, int promotionId) {
        return listSellerPromotions(sellerId, "ALL").stream()
            .filter(p -> p.promotionId() == promotionId)
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Không tìm thấy khuyến mãi"));
    }

    /**
     * F06 — Criterion (g): Query with a Subquery (EXISTS).
     * Finds active, in-stock product variants eligible for either a specific promotion
     * or any currently active promotion (when promotionId is null).
     */
    @Transactional(readOnly = true)
    public List<EligibleProductItem> findEligibleProducts(Integer sellerId, Integer promotionId) {
        if (sellerId != null) {
            ensureSeller(sellerId);
        }
        StringBuilder sql = new StringBuilder("""
            SELECT
                pv.Variant_ID AS variantId,
                p.Product_ID AS productId,
                p.Product_Name AS productName,
                pv.Variant_Name AS variantName,
                c.Category_ID AS categoryId,
                c.Category_Name AS categoryName,
                p.Seller_ID AS sellerId,
                s.Shop_Name AS shopName,
                pv.Price AS price,
                pv.Quantity_Stock AS stock,
                pv.Image AS image,
                (
                    SELECT COUNT(*)
                    FROM Promotion_Apply pa2
                    JOIN Promotion pr2 ON pr2.Promotion_ID = pa2.Promotion_ID
                    WHERE pa2.Variant_ID = pv.Variant_ID
                      AND pr2.Quantity > 0
                      AND SYSDATETIME() BETWEEN pr2.Start_Date AND pr2.Expiration_Date
                ) AS activePromotionCount
            FROM Product_Variant pv
            JOIN Product p ON p.Product_ID = pv.Product_ID
            JOIN Category c ON c.Category_ID = p.Category_ID
            JOIN Seller s ON s.Account_ID = p.Seller_ID
            JOIN Account a ON a.Account_ID = s.Account_ID
            WHERE pv.Is_Active = 1
              AND pv.Quantity_Stock > 0
              AND a.Account_Status = N'ACTIVE'
              AND EXISTS (
                  SELECT 1
                  FROM Promotion_Apply pa
                  JOIN Promotion pr ON pr.Promotion_ID = pa.Promotion_ID
                  WHERE pa.Variant_ID = pv.Variant_ID
                    AND pr.Quantity > 0
                    AND SYSDATETIME() BETWEEN pr.Start_Date AND pr.Expiration_Date
            """);

        List<Object> params = new ArrayList<>();
        if (promotionId != null) {
            sql.append(" AND pr.Promotion_ID = ?");
            params.add(promotionId);
        }
        sql.append(")");
        if (sellerId != null) {
            sql.append(" AND p.Seller_ID = ?");
            params.add(sellerId);
        }
        sql.append(" ORDER BY pv.Variant_ID ASC");

        return db.query(sql.toString(), (rs, rowNum) -> new EligibleProductItem(
            rs.getInt("variantId"),
            rs.getInt("productId"),
            rs.getString("productName"),
            rs.getString("variantName"),
            rs.getInt("categoryId"),
            rs.getString("categoryName"),
            rs.getInt("sellerId"),
            rs.getString("shopName"),
            rs.getBigDecimal("price"),
            rs.getInt("stock"),
            rs.getString("image"),
            rs.getInt("activePromotionCount")
        ), params.toArray());
    }

    /**
     * F06 — Buyer discovers promotions applicable to items currently in their cart
     * using an IN Subquery over Cart_Item & Promotion_Apply.
     */
    @Transactional(readOnly = true)
    public List<CartPromotionOffer> listAvailablePromotionsForBuyer(int buyerId) {
        Map<Integer, BigDecimal> cartSubtotals = loadBuyerCartSubtotals(buyerId);
        if (cartSubtotals.isEmpty()) {
            return List.of();
        }

        // Subquery (IN): select active promotions matching at least one variant in the buyer's cart
        List<CartPromotionOffer> offers = db.query("""
            SELECT
                pr.Promotion_ID AS promotionId,
                pr.Seller_ID AS sellerId,
                s.Shop_Name AS shopName,
                pr.Type AS type,
                pr.Quantity AS quantity,
                pr.Start_Date AS startDate,
                pr.Expiration_Date AS expirationDate,
                pr.Min_Bill AS minBill,
                cp.percent_discount AS percentDiscount,
                cp.max_discount AS maxDiscount,
                vc.voucher_value AS voucherValue
            FROM Promotion pr
            JOIN Seller s ON s.Account_ID = pr.Seller_ID
            LEFT JOIN Coupon cp ON cp.Promotion_ID = pr.Promotion_ID
            LEFT JOIN Voucher vc ON vc.Promotion_ID = pr.Promotion_ID
            WHERE pr.Quantity > 0
              AND SYSDATETIME() BETWEEN pr.Start_Date AND pr.Expiration_Date
              AND pr.Promotion_ID IN (
                  SELECT pa.Promotion_ID
                  FROM Promotion_Apply pa
                  JOIN Cart_Item ci ON ci.Variant_ID = pa.Variant_ID
                  JOIN Cart c ON c.Cart_ID = ci.Cart_ID
                  WHERE c.Buyer_ID = ?
              )
            ORDER BY pr.Expiration_Date ASC, pr.Promotion_ID ASC
            """,
            (rs, rowNum) -> {
                int promoId = rs.getInt("promotionId");
                String type = rs.getString("type");
                BigDecimal minBill = rs.getBigDecimal("minBill");
                BigDecimal pct = rs.getBigDecimal("percentDiscount");
                BigDecimal maxD = rs.getBigDecimal("maxDiscount");
                BigDecimal val = rs.getBigDecimal("voucherValue");

                List<Integer> appliedIds = db.queryForList(
                    "SELECT Variant_ID FROM Promotion_Apply WHERE Promotion_ID = ?",
                    Integer.class, promoId
                );
                List<Integer> matched = appliedIds.stream()
                    .filter(cartSubtotals::containsKey)
                    .toList();
                BigDecimal eligibleSubtotal = matched.stream()
                    .map(cartSubtotals::get)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                boolean meetsMin = eligibleSubtotal.compareTo(minBill) >= 0;
                BigDecimal discount = meetsMin
                    ? calculateDiscountAmount(type, eligibleSubtotal, minBill, pct, maxD, val)
                    : BigDecimal.ZERO;
                String reason = meetsMin
                    ? "Đủ điều kiện áp dụng"
                    : "Cần mua thêm " + minBill.subtract(eligibleSubtotal).setScale(0, RoundingMode.CEILING) + " đ sản phẩm thuộc chương trình";

                return new CartPromotionOffer(
                    promoId,
                    rs.getInt("sellerId"),
                    rs.getString("shopName"),
                    type,
                    rs.getInt("quantity"),
                    rs.getTimestamp("startDate").toLocalDateTime(),
                    rs.getTimestamp("expirationDate").toLocalDateTime(),
                    minBill,
                    pct,
                    maxD,
                    val,
                    eligibleSubtotal,
                    discount,
                    meetsMin && discount.compareTo(BigDecimal.ZERO) > 0,
                    reason,
                    matched
                );
            },
            buyerId
        );
        return offers;
    }

    /**
     * F06 — Preview discount for a specific promotionId against the buyer's current cart.
     */
    @Transactional(readOnly = true)
    public DiscountPreviewResponse previewDiscountForBuyer(int buyerId, int promotionId) {
        Map<Integer, BigDecimal> cartSubtotals = loadBuyerCartSubtotals(buyerId);
        BigDecimal cartTotal = cartSubtotals.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);

        var rows = db.queryForList("""
            SELECT
                pr.Promotion_ID, pr.Type, pr.Quantity, pr.Start_Date, pr.Expiration_Date, pr.Min_Bill,
                s.Shop_Name, cp.percent_discount, cp.max_discount, vc.voucher_value
            FROM Promotion pr
            JOIN Seller s ON s.Account_ID = pr.Seller_ID
            LEFT JOIN Coupon cp ON cp.Promotion_ID = pr.Promotion_ID
            LEFT JOIN Voucher vc ON vc.Promotion_ID = pr.Promotion_ID
            WHERE pr.Promotion_ID = ?
            """, promotionId);

        if (rows.isEmpty()) {
            throw new ResponseStatusException(NOT_FOUND, "Không tìm thấy mã khuyến mãi #" + promotionId);
        }
        Map<String, Object> row = rows.getFirst();
        String type = (String) row.get("Type");
        String shopName = (String) row.get("Shop_Name");
        int qty = ((Number) row.get("Quantity")).intValue();
        LocalDateTime start = ((Timestamp) row.get("Start_Date")).toLocalDateTime();
        LocalDateTime end = ((Timestamp) row.get("Expiration_Date")).toLocalDateTime();
        BigDecimal minBill = (BigDecimal) row.get("Min_Bill");
        BigDecimal pct = (BigDecimal) row.get("percent_discount");
        BigDecimal maxD = (BigDecimal) row.get("max_discount");
        BigDecimal val = (BigDecimal) row.get("voucher_value");

        List<Integer> appliedIds = db.queryForList(
            "SELECT Variant_ID FROM Promotion_Apply WHERE Promotion_ID = ?",
            Integer.class, promotionId
        );
        List<Integer> matched = appliedIds.stream().filter(cartSubtotals::containsKey).toList();
        BigDecimal eligibleSubtotal = matched.stream()
            .map(cartSubtotals::get)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDateTime now = LocalDateTime.now();
        String reason = "Áp dụng thành công";
        boolean eligible = true;

        if (cartSubtotals.isEmpty()) {
            eligible = false;
            reason = "Giỏ hàng đang trống";
        } else if (qty <= 0) {
            eligible = false;
            reason = "Chương trình khuyến mãi đã hết lượt sử dụng";
        } else if (now.isBefore(start) || now.isAfter(end)) {
            eligible = false;
            reason = "Chương trình khuyến mãi không nằm trong thời gian áp dụng";
        } else if (matched.isEmpty()) {
            eligible = false;
            reason = "Không có sản phẩm nào trong giỏ hàng thuộc phạm vi khuyến mãi này";
        } else if (eligibleSubtotal.compareTo(minBill) < 0) {
            eligible = false;
            reason = "Giá trị sản phẩm đủ điều kiện chưa đạt mức đơn tối thiểu";
        }

        BigDecimal discount = eligible
            ? calculateDiscountAmount(type, eligibleSubtotal, minBill, pct, maxD, val)
            : BigDecimal.ZERO;
        BigDecimal finalTotal = cartTotal.subtract(discount).max(BigDecimal.ZERO);

        return new DiscountPreviewResponse(
            promotionId, type, shopName, eligible, reason,
            cartTotal, eligibleSubtotal, minBill, discount, finalTotal, matched
        );
    }

    /**
     * Reusable hook for M3 (CheckoutService) to atomically validate and consume a promotion
     * inside the checkout transaction. Rolls back automatically if checkout fails later.
     */
    @Transactional
    public CheckoutDiscountResult validateAndConsumeForCheckout(
        int promotionId,
        Map<Integer, BigDecimal> variantSubtotals
    ) {
        if (variantSubtotals == null || variantSubtotals.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Không có sản phẩm để áp dụng khuyến mãi");
        }
        int updated = db.update("""
            UPDATE Promotion
            SET Quantity = Quantity - 1, Updated_At = SYSDATETIME()
            WHERE Promotion_ID = ?
              AND Quantity > 0
              AND SYSDATETIME() BETWEEN Start_Date AND Expiration_Date
            """, promotionId);
        if (updated == 0) {
            throw new ResponseStatusException(CONFLICT, "Khuyến mãi đã hết lượt sử dụng hoặc hết hạn");
        }

        var rows = db.queryForList("""
            SELECT pr.Type, pr.Min_Bill, cp.percent_discount, cp.max_discount, vc.voucher_value
            FROM Promotion pr
            LEFT JOIN Coupon cp ON cp.Promotion_ID = pr.Promotion_ID
            LEFT JOIN Voucher vc ON vc.Promotion_ID = pr.Promotion_ID
            WHERE pr.Promotion_ID = ?
            """, promotionId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(NOT_FOUND, "Không tìm thấy khuyến mãi");
        }
        Map<String, Object> row = rows.getFirst();
        String type = (String) row.get("Type");
        BigDecimal minBill = (BigDecimal) row.get("Min_Bill");
        BigDecimal pct = (BigDecimal) row.get("percent_discount");
        BigDecimal maxD = (BigDecimal) row.get("max_discount");
        BigDecimal val = (BigDecimal) row.get("voucher_value");

        List<Integer> appliedIds = db.queryForList(
            "SELECT Variant_ID FROM Promotion_Apply WHERE Promotion_ID = ?",
            Integer.class, promotionId
        );
        BigDecimal eligibleSubtotal = appliedIds.stream()
            .filter(variantSubtotals::containsKey)
            .map(variantSubtotals::get)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (eligibleSubtotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Đơn hàng không chứa sản phẩm thuộc khuyến mãi");
        }
        if (eligibleSubtotal.compareTo(minBill) < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Chưa đạt giá trị đơn tối thiểu của khuyến mãi");
        }

        BigDecimal discount = calculateDiscountAmount(type, eligibleSubtotal, minBill, pct, maxD, val);
        return new CheckoutDiscountResult(promotionId, type, eligibleSubtotal, discount);
    }

    private Map<Integer, BigDecimal> loadBuyerCartSubtotals(int buyerId) {
        Map<Integer, BigDecimal> map = new LinkedHashMap<>();
        db.query("""
            SELECT ci.Variant_ID, CAST(pv.Price * ci.Quantity AS DECIMAL(18,2)) AS subtotal
            FROM Cart c
            JOIN Cart_Item ci ON ci.Cart_ID = c.Cart_ID
            JOIN Product_Variant pv ON pv.Variant_ID = ci.Variant_ID
            WHERE c.Buyer_ID = ? AND pv.Is_Active = 1
            """,
            rs -> {
                map.put(rs.getInt("Variant_ID"), rs.getBigDecimal("subtotal"));
            },
            buyerId
        );
        return map;
    }
}
