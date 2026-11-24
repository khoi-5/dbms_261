package com.bkpee.orders;

import com.bkpee.auth.AccountAuthService;
import com.bkpee.auth.ApiErrors;
import com.bkpee.promotion.PromotionModels.CheckoutDiscountResult;
import com.bkpee.promotion.PromotionModels.DiscountPreviewResponse;
import com.bkpee.promotion.PromotionService;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.json.JsonMapper;
import static com.bkpee.orders.OrderModels.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CheckoutVoucherHttpTest {
    private static final ShippingProvider PROVIDER = new ShippingProvider(4, "QA", new BigDecimal("22000.00"));
    private static final CartLine ELIGIBLE_ITEM = new CartLine(7, 8, 9, "QA item", null, "QA shop", null,
            new BigDecimal("1000000.00"), 3, true, "ACTIVE", 1);
    private static final CartLine OTHER_ITEM = new CartLine(13, 14, 15, "Other item", null, "Other shop", null,
            new BigDecimal("50000.00"), 3, true, "ACTIVE", 1);
    private static final BigDecimal DISCOUNT = new BigDecimal("100000.00");

    @Test void previewAndCheckoutBindPromotionIdAndUseTheDiscountedAmount() throws Exception {
        var orders = new OrderStore();
        var auth = new AccountAuthService(null, null) {
            @Override public Account current(String subject) {
                assertEquals("2", subject);
                return new Account(2, "buyer", "qa@example.invalid", "QA", "Buyer", List.of("BUYER"));
            }
        };
        var promotions = new CartPromotion();
        var payments = new PaymentService(orders, new MockEnvironment());
        var checkout = new CheckoutService(orders, auth, payments, promotions, new CheckoutCheckpoint());
        var mvc = MockMvcBuilders.standaloneSetup(new OrdersApi(checkout, null))
                .setControllerAdvice(new ApiErrors())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver()).build();

        var jwt = Jwt.withTokenValue("checkout-test").header("alg", "HS256").subject("2").build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
        try {
            var json = new JsonMapper();
            String preview = mvc.perform(get("/api/buyer/checkout/preview")
                            .param("providerId", "4").param("promotionId", "11"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.promotionId").value(11))
                    .andExpect(jsonPath("$.discountAmount").value(100000.0))
                    .andExpect(jsonPath("$.total").value(994000.0))
                    .andReturn().getResponse().getContentAsString();
            assertEquals(0, promotions.consumed);

            var request = new CheckoutRequest("request-0001", json.readTree(preview).get("quoteFingerprint").asString(),
                    "QA Receiver", "0909000456", "QA Address", 4, "COD", 11);
            mvc.perform(post("/api/buyer/checkout").contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(request)))
                    .andExpect(status().isCreated()).andExpect(jsonPath("$.order.id").value(17))
                    .andExpect(jsonPath("$.order.originalTotal").value(994000.0));

            assertEquals(1, promotions.consumed);
            assertEquals(new AppliedPromotion(11, 9, DISCOUNT), orders.promotions.get(9));
            assertTrue(orders.promotions.containsKey(15));
            assertNull(orders.promotions.get(15));
            assertEquals("COD", orders.paymentMethod);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private static final class CartPromotion extends PromotionService {
        int consumed;

        CartPromotion() { super(null); }

        @Override public DiscountPreviewResponse previewDiscountForBuyer(int buyer, int promotion) {
            assertEquals(2, buyer);
            assertEquals(11, promotion);
            return new DiscountPreviewResponse(11, "COUPON", "QA shop", true, "OK",
                    ELIGIBLE_ITEM.price().add(OTHER_ITEM.price()), ELIGIBLE_ITEM.price(), BigDecimal.ZERO,
                    DISCOUNT, new BigDecimal("950000.00"), List.of(7));
        }

        @Override public CheckoutDiscountResult validateAndConsumeForCheckout(int promotion, Map<Integer, BigDecimal> subtotals) {
            assertEquals(11, promotion);
            assertEquals(Map.of(7, ELIGIBLE_ITEM.price()), subtotals);
            consumed++;
            return new CheckoutDiscountResult(11, "COUPON", ELIGIBLE_ITEM.price(), DISCOUNT);
        }
    }

    private static final class OrderStore extends OrderJdbcRepository {
        final Map<Integer, AppliedPromotion> promotions = new LinkedHashMap<>();
        BigDecimal total;
        String paymentMethod;

        OrderStore() { super(null); }

        @Override public void requireSchema() {}
        @Override public ShippingProvider provider(int id, boolean lock) { return PROVIDER; }
        @Override public void lockBuyer(int buyer) {}
        @Override public Integer cartId(int buyer) { return 16; }
        @Override public int promotionSeller(int promotion) { return 9; }
        @Override public List<CartLine> cartLines(int buyer) { return List.of(ELIGIBLE_ITEM, OTHER_ITEM); }
        @Override public CartLine lockVariant(int variant, int quantity) { return variant == 7 ? ELIGIBLE_ITEM : OTHER_ITEM; }
        @Override public StoredCheckout storedCheckout(int buyer, String key) { return null; }

        @Override public int insertOrder(int buyer, CheckoutRequest request, BigDecimal value, byte[] hash) {
            total = value;
            return 17;
        }
        @Override public int insertShop(int order, int seller, ShippingProvider provider, AppliedPromotion promo) {
            promotions.put(seller, promo);
            return 17 + promotions.size();
        }
        @Override public void insertItem(int shop, CartLine line) {}
        @Override public void deduct(int variant, int quantity) {}
        @Override public void markDeducted(int shop) {}
        @Override public void insertPayment(int order, String method, boolean simulated) { paymentMethod = method; }
        @Override public void clearCart(int cart) {}

        @Override public OrderView buyerOrder(int buyer, int order) {
            return new OrderView(order, null, total, total, DISCOUNT, "QA Receiver",
                    "0909000456", "QA Address", null, List.of());
        }
    }
}
