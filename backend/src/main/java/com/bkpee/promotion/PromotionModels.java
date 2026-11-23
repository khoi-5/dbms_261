package com.bkpee.promotion;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PromotionModels {

    public record AppliedVariant(
        int variantId,
        int productId,
        String productName,
        String variantName,
        BigDecimal price,
        int stock,
        boolean active,
        String image
    ) {}

    public record SellerVariantOption(
        int variantId,
        int productId,
        String productName,
        String variantName,
        String categoryName,
        BigDecimal price,
        int stock,
        boolean active,
        String image
    ) {}

    public record PromotionItem(
        int promotionId,
        int sellerId,
        String shopName,
        String type, // COUPON | VOUCHER
        int quantity,
        LocalDateTime startDate,
        LocalDateTime expirationDate,
        BigDecimal minBill,
        BigDecimal percentDiscount,
        BigDecimal maxDiscount,
        BigDecimal voucherValue,
        String status, // ACTIVE | UPCOMING | EXPIRED | OUT_OF_STOCK
        int appliedVariantCount,
        List<AppliedVariant> appliedVariants
    ) {}

    public record CreatePromotionRequest(
        @NotBlank String type, // COUPON | VOUCHER
        @NotNull @Min(0) Integer quantity,
        @NotNull LocalDateTime startDate,
        @NotNull LocalDateTime expirationDate,
        @NotNull @DecimalMin("0.0") BigDecimal minBill,
        @DecimalMin("0.01") @DecimalMax("100.0") BigDecimal percentDiscount,
        @DecimalMin("0.0") BigDecimal maxDiscount,
        @DecimalMin("0.01") BigDecimal voucherValue,
        @NotEmpty List<Integer> variantIds
    ) {}

    public record UpdatePromotionRequest(
        @NotBlank String type,
        @NotNull @Min(0) Integer quantity,
        @NotNull LocalDateTime startDate,
        @NotNull LocalDateTime expirationDate,
        @NotNull @DecimalMin("0.0") BigDecimal minBill,
        @DecimalMin("0.01") @DecimalMax("100.0") BigDecimal percentDiscount,
        @DecimalMin("0.0") BigDecimal maxDiscount,
        @DecimalMin("0.01") BigDecimal voucherValue,
        @NotEmpty List<Integer> variantIds
    ) {}

    public record EligibleProductItem(
        int variantId,
        int productId,
        String productName,
        String variantName,
        int categoryId,
        String categoryName,
        int sellerId,
        String shopName,
        BigDecimal price,
        int stock,
        String image,
        int activePromotionCount
    ) {}

    public record CartPromotionOffer(
        int promotionId,
        int sellerId,
        String shopName,
        String type,
        int quantity,
        LocalDateTime startDate,
        LocalDateTime expirationDate,
        BigDecimal minBill,
        BigDecimal percentDiscount,
        BigDecimal maxDiscount,
        BigDecimal voucherValue,
        BigDecimal eligibleSubtotal,
        BigDecimal estimatedDiscount,
        boolean eligible,
        String reason,
        List<Integer> matchedVariantIds
    ) {}

    public record DiscountPreviewRequest(
        @NotNull @Min(1) Integer promotionId
    ) {}

    public record DiscountPreviewResponse(
        int promotionId,
        String type,
        String shopName,
        boolean eligible,
        String reason,
        BigDecimal cartTotal,
        BigDecimal eligibleSubtotal,
        BigDecimal minBill,
        BigDecimal discountAmount,
        BigDecimal finalTotal,
        List<Integer> matchedVariantIds
    ) {}

    public record CheckoutDiscountResult(
        int promotionId,
        String type,
        BigDecimal eligibleSubtotal,
        BigDecimal discountAmount
    ) {}
}
