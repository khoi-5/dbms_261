package com.bkpee.analytics;

import com.bkpee.analytics.AnalyticsModels.SellerRevenueReport;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/seller/analytics")
public class SellerAnalyticsApi {

    private final AnalyticsService analytics;

    public SellerAnalyticsApi(AnalyticsService analytics) {
        this.analytics = analytics;
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

    @GetMapping("/revenue")
    public SellerRevenueReport revenue(
        @AuthenticationPrincipal Jwt jwt,
        @RequestParam(required = false) Integer year,
        @RequestParam(required = false, defaultValue = "VALID") String statusScope
    ) {
        return analytics.getSellerRevenue(sellerId(jwt), year, statusScope);
    }
}
