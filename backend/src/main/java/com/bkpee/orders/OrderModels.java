package com.bkpee.orders;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class OrderModels {
    private OrderModels() {}

    public record CheckoutRequest(
            @NotBlank @Pattern(regexp="[A-Za-z0-9_-]{8,64}") String requestKey,
            @NotBlank @Pattern(regexp="[a-fA-F0-9]{64}") String quoteFingerprint,
            @NotBlank @Size(max=100) String receiverName,
            @NotBlank @Pattern(regexp="[+0-9]{8,20}") String receiverPhone,
            @NotBlank @Size(max=255) String deliveryAddress,
            @NotNull @Positive Integer providerId,
            @NotBlank @Pattern(regexp="COD|DEMO") String paymentMethod,
            @Positive Integer promotionId) {
        public CheckoutRequest(String requestKey, String quoteFingerprint, String receiverName, String receiverPhone,
                               String deliveryAddress, Integer providerId, String paymentMethod) {
            this(requestKey,quoteFingerprint,receiverName,receiverPhone,deliveryAddress,providerId,paymentMethod,null);
        }
    }

    public record StatusRequest(
            @NotBlank String expectedStatus, @NotBlank String newStatus,
            @Size(max=100) String trackingNumber) {}
    public record CancelRequest(@NotBlank String expectedStatus) {}
    public record ConfirmReceiptRequest(@NotBlank @Pattern(regexp="DELIVERED") String expectedStatus) {}
    public record Receiver(String name, String phone, String address) {}
    public record ShippingProvider(int id, String name, BigDecimal fee) {}
    public record PaymentOption(String code, String label, boolean simulated) {}
    public record CheckoutOptions(Receiver receiver, List<ShippingProvider> providers,
                                  List<PaymentOption> paymentMethods) {}

    public record CartLine(int variantId, int productId, int sellerId, String name, String variantName,
                           String shop, String image, BigDecimal price, int stock,
                           boolean active, String sellerStatus, int quantity) {
        public BigDecimal subtotal() { return price.multiply(BigDecimal.valueOf(quantity)); }
        public boolean available() {
            return active && "ACTIVE".equals(sellerStatus) && stock >= quantity && quantity > 0;
        }
    }
    public record PreviewItem(int variantId, String name, String variantName, String shop, String image,
                              BigDecimal price, int stock, int quantity,
                              BigDecimal subtotal, boolean available) {}
    public record AppliedPromotion(int id, int sellerId, BigDecimal discountAmount) {}
    public record CheckoutPreview(List<PreviewItem> items, BigDecimal subtotal,
                                  BigDecimal shippingTotal, Integer promotionId, BigDecimal discountAmount, BigDecimal total,
                                  int shopCount, String quoteFingerprint, boolean available) {}
    public record PaymentView(String method, String status, boolean simulated, LocalDateTime paidAt) {}
    public record LineItem(int variantId, String name, String variantName, String image, int quantity,
                           BigDecimal purchasePrice, BigDecimal subtotal) {}
    public record ShopOrderView(int id, int orderId, LocalDateTime orderedAt,
                                int sellerId, String shopName, int buyerId, String buyerName, String buyerUsername,
                                String receiverName, String receiverPhone, String deliveryAddress,
                                int providerId, String providerName, String trackingNumber,
                                String status, BigDecimal shippingFee, BigDecimal subtotal,
                                Integer promotionId, BigDecimal discountAmount,
                                BigDecimal total, BigDecimal payableTotal, boolean stockDeducted,
                                PaymentView payment, LocalDateTime shippedAt, LocalDateTime deliveredAt,
                                LocalDateTime buyerReceivedAt,
                                List<LineItem> items, List<String> allowedTransitions,
                                boolean buyerCanCancel, boolean buyerCanConfirmReceipt) {}
    public record OrderView(int id, LocalDateTime orderedAt, BigDecimal originalTotal,
                            BigDecimal payableTotal, BigDecimal discountAmount, String receiverName, String receiverPhone,
                            String deliveryAddress, PaymentView payment, List<ShopOrderView> shops) {}
    public record CheckoutResult(OrderView order, boolean replayed) {}
    public record Page<T>(List<T> items, int page, int size, long totalElements, long totalPages) {}
    public record Filter(String status, LocalDate from, LocalDate to, int page, int size) {}
    public record StoredCheckout(int orderId, byte[] requestHash) {}
}
