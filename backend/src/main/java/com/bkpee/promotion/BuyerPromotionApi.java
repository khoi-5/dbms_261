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
@RequestMapping("/api/buyer/promotions")
public class BuyerPromotionApi {

    private final PromotionService promotions;

    public BuyerPromotionApi(PromotionService promotions) {
        this.promotions = promotions;
    }

    private int buyerId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập");
        }
        try {
            return Integer.parseInt(jwt.getSubject());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mã người dùng không hợp lệ");
        }
    }

    /**
     * F06 (Subquery EXISTS): Browse all currently active promoted product variants.
     */
    @GetMapping("/eligible-products")
    public List<EligibleProductItem> eligibleProducts(
        @RequestParam(required = false) Integer promotionId
    ) {
        return promotions.findEligibleProducts(null, promotionId);
    }

    /**
     * F06 (Subquery IN): List active promotions matching items in the current buyer's cart.
     */
    @GetMapping("/available")
    public List<CartPromotionOffer> availableForCart(@AuthenticationPrincipal Jwt jwt) {
        return promotions.listAvailablePromotionsForBuyer(buyerId(jwt));
    }

    /**
     * F06: Preview discount calculation for a chosen promotion against the current buyer's cart.
     */
    @PostMapping("/preview")
    public DiscountPreviewResponse preview(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody DiscountPreviewRequest req
    ) {
        return promotions.previewDiscountForBuyer(buyerId(jwt), req.promotionId());
    }
}
