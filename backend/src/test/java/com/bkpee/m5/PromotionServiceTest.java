package com.bkpee.m5;

import com.bkpee.promotion.PromotionService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PromotionServiceTest {

    @Test
    void couponRespectsPercentAndMaxDiscountCap() {
        BigDecimal discount = PromotionService.calculateDiscountAmount(
            "COUPON",
            new BigDecimal("600000"),
            new BigDecimal("200000"),
            new BigDecimal("15.00"),
            new BigDecimal("50000"),
            null
        );
        // 15% of 600,000 = 90,000, capped at 50,000
        assertEquals(new BigDecimal("50000.00"), discount);
    }

    @Test
    void couponBelowMaxDiscountReturnsExactPercent() {
        BigDecimal discount = PromotionService.calculateDiscountAmount(
            "COUPON",
            new BigDecimal("200000"),
            new BigDecimal("200000"),
            new BigDecimal("15.00"),
            new BigDecimal("50000"),
            null
        );
        // 15% of 200,000 = 30,000
        assertEquals(new BigDecimal("30000.00"), discount);
    }

    @Test
    void returnsZeroWhenBelowMinBill() {
        BigDecimal discount = PromotionService.calculateDiscountAmount(
            "VOUCHER",
            new BigDecimal("199000"),
            new BigDecimal("300000"),
            null,
            null,
            new BigDecimal("30000")
        );
        assertEquals(BigDecimal.ZERO, discount);
    }

    @Test
    void voucherNeverExceedsEligibleSubtotal() {
        BigDecimal discount = PromotionService.calculateDiscountAmount(
            "VOUCHER",
            new BigDecimal("20000"),
            new BigDecimal("0"),
            null,
            null,
            new BigDecimal("50000")
        );
        assertEquals(new BigDecimal("20000.00"), discount);
    }
}
