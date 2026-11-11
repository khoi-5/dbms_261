package com.bkpee.buyer;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/buyer/cart")
public class CartApi {
    private final BuyerCartService carts;
    public CartApi(BuyerCartService carts) { this.carts=carts; }
    public record Add(@NotNull @DecimalMin("1") @DecimalMax("2147483647") @Digits(integer=10,fraction=0) BigDecimal variantId,@NotNull @DecimalMin("1") @DecimalMax("2147483647") @Digits(integer=10,fraction=0) BigDecimal quantity) {}
    public record Quantity(@NotNull @DecimalMin("1") @DecimalMax("2147483647") @Digits(integer=10,fraction=0) BigDecimal quantity) {}
    @GetMapping public Map<String,Object> get(@AuthenticationPrincipal Jwt jwt) { return carts.get(jwt.getSubject()); }
    @PostMapping("/items") public Map<String,Object> add(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody Add r) { return carts.put(jwt.getSubject(),r.variantId().intValueExact(),r.quantity().intValueExact(),true); }
    @PutMapping("/items/{variantId}") public Map<String,Object> update(@AuthenticationPrincipal Jwt jwt,@PathVariable int variantId,@Valid @RequestBody Quantity r) { return carts.put(jwt.getSubject(),variantId,r.quantity().intValueExact(),false); }
    @DeleteMapping("/items/{variantId}") public Map<String,Object> remove(@AuthenticationPrincipal Jwt jwt,@PathVariable int variantId) { return carts.remove(jwt.getSubject(),variantId); }
}
