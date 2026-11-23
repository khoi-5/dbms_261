package com.bkpee.analytics;

import com.bkpee.analytics.AnalyticsModels.BuyerSpendingReport;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/buyer/analytics")
public class BuyerAnalyticsApi {

    private final AnalyticsService analytics;

    public BuyerAnalyticsApi(AnalyticsService analytics) {
        this.analytics = analytics;
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

    @GetMapping("/spending")
    public BuyerSpendingReport spending(
        @AuthenticationPrincipal Jwt jwt,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
        @RequestParam(required = false, defaultValue = "VALID") String statusScope
    ) {
        return analytics.getBuyerSpending(buyerId(jwt), fromDate, toDate, statusScope);
    }
}
