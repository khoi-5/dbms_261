package com.bkpee.orders;

import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import static com.bkpee.orders.OrderModels.*;

@RestController
@RequestMapping("/api")
public class OrdersApi {
    private final CheckoutService checkout;
    private final OrderService orders;
    public OrdersApi(CheckoutService checkout,OrderService orders) { this.checkout=checkout; this.orders=orders; }
    @GetMapping("/buyer/checkout/options")
    public CheckoutOptions options(@AuthenticationPrincipal Jwt jwt) { return checkout.options(jwt.getSubject()); }
    @GetMapping("/buyer/checkout/preview")
    public CheckoutPreview preview(@AuthenticationPrincipal Jwt jwt,@RequestParam int providerId) {
        return checkout.preview(jwt.getSubject(),providerId);
    }
    @GetMapping("/buyer/checkout/requests/{requestKey}")
    public OrderView lookup(@AuthenticationPrincipal Jwt jwt,@PathVariable String requestKey) {
        return checkout.lookup(jwt.getSubject(),requestKey);
    }
    @PostMapping("/buyer/checkout")
    public ResponseEntity<CheckoutResult> create(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody CheckoutRequest request) {
        var result=checkout.checkout(jwt.getSubject(),request);
        return ResponseEntity.status(result.replayed()?200:201).body(result);
    }
    @GetMapping("/buyer/orders")
    public Page<OrderView> buyerOrders(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required=false) String status,
            @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size) {
        return orders.buyerOrders(jwt.getSubject(),OrderRules.filter(status,from,to,page,size));
    }
    @GetMapping("/buyer/orders/{id}")
    public OrderView buyerOrder(@AuthenticationPrincipal Jwt jwt,@PathVariable int id) {
        return orders.buyerOrder(jwt.getSubject(),id);
    }
    @PostMapping("/buyer/shop-orders/{id}/cancel")
    public ShopOrderView cancel(@AuthenticationPrincipal Jwt jwt,@PathVariable int id,@Valid @RequestBody CancelRequest request) {
        return orders.cancelBuyerShop(jwt.getSubject(),id,request);
    }
    @PostMapping("/buyer/shop-orders/{id}/confirm-received")
    public ShopOrderView confirmReceived(@AuthenticationPrincipal Jwt jwt,@PathVariable int id,
                                         @Valid @RequestBody ConfirmReceiptRequest request) {
        return orders.confirmBuyerReceipt(jwt.getSubject(),id,request);
    }
    @GetMapping("/seller/orders")
    public Page<ShopOrderView> sellerOrders(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required=false) String status,
            @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size) {
        return orders.sellerOrders(jwt.getSubject(),OrderRules.filter(status,from,to,page,size));
    }
    @GetMapping("/seller/orders/{id}")
    public ShopOrderView sellerOrder(@AuthenticationPrincipal Jwt jwt,@PathVariable int id) {
        return orders.sellerOrder(jwt.getSubject(),id);
    }
    @PatchMapping("/seller/orders/{id}/status")
    public ShopOrderView status(@AuthenticationPrincipal Jwt jwt,@PathVariable int id,@Valid @RequestBody StatusRequest request) {
        return orders.updateSellerStatus(jwt.getSubject(),id,request);
    }
}
