package com.bkpee.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class AnalyticsModels {

    // ─── F07: Seller Revenue Analytics ────────────────────────────────────────

    public record MonthlyRevenuePoint(
        int month,
        String label,
        BigDecimal revenue,
        long orderCount,
        long itemsSold
    ) {}

    public record TopProductStat(
        int productId,
        String productName,
        String categoryName,
        long unitsSold,
        BigDecimal revenue
    ) {}

    public record StatusBreakdown(
        String deliveryStatus,
        long orderCount,
        BigDecimal revenue
    ) {}

    public record SellerRevenueReport(
        int sellerId,
        String shopName,
        int year,
        String statusScope, // VALID | DELIVERED
        String policyDescription,
        BigDecimal totalRevenue,
        long totalOrders,
        long totalItemsSold,
        BigDecimal averageOrderValue,
        List<MonthlyRevenuePoint> monthly,
        List<TopProductStat> topProducts,
        List<StatusBreakdown> statusBreakdown
    ) {}

    // ─── F13: Buyer Spending Analytics ────────────────────────────────────────

    public record CategorySpendingItem(
        int categoryId,
        String categoryName,
        String targetType,
        long orderCount,
        long itemsPurchased,
        BigDecimal totalSpent,
        double sharePercent
    ) {}

    public record TargetTypeSpendingItem(
        String targetType,
        String label,
        long orderCount,
        long itemsPurchased,
        BigDecimal totalSpent,
        double sharePercent
    ) {}

    public record MonthlySpendingPoint(
        int year,
        int month,
        String label,
        BigDecimal totalSpent,
        long orderCount
    ) {}

    public record BuyerSpendingReport(
        int buyerId,
        LocalDate fromDate,
        LocalDate toDate,
        String statusScope, // VALID | DELIVERED
        String policyDescription,
        BigDecimal totalSpent,
        long totalOrders,
        long totalItemsPurchased,
        BigDecimal averageOrderValue,
        List<CategorySpendingItem> byCategory,
        List<TargetTypeSpendingItem> byTargetType,
        List<MonthlySpendingPoint> monthlyTrend
    ) {}
}
