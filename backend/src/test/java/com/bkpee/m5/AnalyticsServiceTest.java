package com.bkpee.m5;

import com.bkpee.analytics.AnalyticsModels.MonthlyRevenuePoint;
import com.bkpee.analytics.AnalyticsService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AnalyticsServiceTest {

    @Test
    void fillTwelveMonthsPreservesActiveMonthsAndPadsZeros() throws Exception {
        var method = AnalyticsService.class.getDeclaredMethod("fillTwelveMonths", Map.class);
        method.setAccessible(true);

        Map<Integer, MonthlyRevenuePoint> sparse = Map.of(
            10, new MonthlyRevenuePoint(10, "T10", new BigDecimal("120000.00"), 1L, 1L)
        );
        @SuppressWarnings("unchecked")
        var filled = (java.util.List<MonthlyRevenuePoint>) method.invoke(null, sparse);

        assertEquals(12, filled.size());
        assertEquals(BigDecimal.ZERO, filled.get(0).revenue());
        assertEquals("T1", filled.get(0).label());
        assertEquals(new BigDecimal("120000.00"), filled.get(9).revenue());
        assertEquals(1L, filled.get(9).orderCount());
    }

    @Test
    void sharePercentComputesTwoDecimalShareAndHandlesZeroTotal() throws Exception {
        var method = AnalyticsService.class.getDeclaredMethod("sharePercent", BigDecimal.class, BigDecimal.class);
        method.setAccessible(true);

        double pct = (double) method.invoke(null, new BigDecimal("120000"), new BigDecimal("518000"));
        assertEquals(23.17, pct, 0.01);

        double zero = (double) method.invoke(null, new BigDecimal("120000"), BigDecimal.ZERO);
        assertEquals(0.0, zero);
    }
}
