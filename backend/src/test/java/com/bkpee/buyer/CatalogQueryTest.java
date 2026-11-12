package com.bkpee.buyer;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static com.bkpee.buyer.CatalogModels.Query;

class CatalogQueryTest {
    private final CatalogSettings settings = new CatalogSettings(12,48);
    @Test void configurableSizeAndZeroBasedPage() {
        assertEquals(12,Query.of("",null,null,null,0,null,settings).size());
        assertEquals(24,Query.of("",null,null,null,1,24,settings).size());
        assertEquals(5,Query.of("",null,null,null,0,null,new CatalogSettings(5,7)).size());
        assertThrows(ResponseStatusException.class,()->Query.of("",null,null,null,0,49,settings));
        assertThrows(ResponseStatusException.class,()->Query.of("",null,null,null,-1,null,settings));
    }
    @Test void normalizeBeforeValidationAndKeepVietnameseAccents() {
        assertEquals("",Query.of(" ".repeat(300),null,null,null,0,null,settings).keyword());
        assertEquals("Sách",Query.of("\u00a0 Sa\u0301ch \u00a0",null,null,null,0,null,settings).keyword());
        assertEquals("sach",Query.of("sach",null,null,null,0,null,settings).keyword());
        assertThrows(ResponseStatusException.class,()->Query.of("x".repeat(256),null,null,null,0,null,settings));
    }
    @Test void literalWildcardsAreEscaped() {
        assertEquals("%a~%~_~[~~'%",Query.of("a%_[~'",null,null,null,0,null,settings).likePattern());
    }
    @Test void priceRangeValidation() {
        assertDoesNotThrow(()->Query.of("",null,new BigDecimal("1.000"),new BigDecimal("1"),0,null,settings));
        assertThrows(ResponseStatusException.class,()->Query.of("",null,new BigDecimal("-1"),null,0,null,settings));
        assertThrows(ResponseStatusException.class,()->Query.of("",null,new BigDecimal("2"),BigDecimal.ONE,0,null,settings));
        assertThrows(ResponseStatusException.class,()->Query.of("",null,new BigDecimal("1.001"),null,0,null,settings));
    }
}
