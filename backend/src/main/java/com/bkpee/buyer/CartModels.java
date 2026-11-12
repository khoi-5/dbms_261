package com.bkpee.buyer;

import java.math.BigDecimal;
import java.util.List;

public final class CartModels {
    private CartModels() {}
    public record Item(int variantId, int productId, String name, String shop, String image,
                       BigDecimal price, int stock, boolean active, String sellerStatus,
                       int quantity, BigDecimal subtotal) {}
    public record Cart(Integer id, List<Item> items, BigDecimal total, long totalQuantity) {
        public static Cart empty() { return new Cart(null, List.of(), BigDecimal.ZERO, 0); }
    }
}
