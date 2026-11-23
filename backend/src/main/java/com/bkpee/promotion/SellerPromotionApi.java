package com.bkpee.promotion;

import com.bkpee.promotion.PromotionModels.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/seller/promotions")
public class SellerPromotionApi {

    private final PromotionService promotions;

    public SellerPromotionApi(PromotionService promotions) {
        this.promotions = promotions;
    }

    private int sellerId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập");
        }
        try {
            return Integer.parseInt(jwt.getSubject());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mã người dùng không hợp lệ");
        }
    }

    @GetMapping
    public List<PromotionItem> list(
        @AuthenticationPrincipal Jwt jwt,
        @RequestParam(required = false, defaultValue = "ALL") String status
    ) {
        return promotions.listSellerPromotions(sellerId(jwt), status);
    }

    @GetMapping("/variants")
    public List<SellerVariantOption> listVariants(@AuthenticationPrincipal Jwt jwt) {
        return promotions.listSellerVariants(sellerId(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PromotionItem create(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody CreatePromotionRequest req
    ) {
        return promotions.createPromotion(sellerId(jwt), req);
    }

    @PutMapping("/{promotionId}")
    public PromotionItem update(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable int promotionId,
        @Valid @RequestBody UpdatePromotionRequest req
    ) {
        return promotions.updatePromotion(sellerId(jwt), promotionId, req);
    }

    @DeleteMapping("/{promotionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable int promotionId
    ) {
        promotions.deletePromotion(sellerId(jwt), promotionId);
    }

    @GetMapping("/{promotionId}/eligible-products")
    public List<EligibleProductItem> eligibleProducts(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable int promotionId
    ) {
        return promotions.findEligibleProducts(sellerId(jwt), promotionId);
    }
}
