package com.bkpee.buyer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public record CatalogSettings(int defaultPageSize, int maxPageSize) {
    public CatalogSettings(@Value("${app.catalog.default-page-size}") int defaultPageSize,
                           @Value("${app.catalog.max-page-size}") int maxPageSize) {
        if (defaultPageSize < 1 || maxPageSize < defaultPageSize)
            throw new IllegalArgumentException("Invalid catalog page-size configuration");
        this.defaultPageSize = defaultPageSize;
        this.maxPageSize = maxPageSize;
    }
}
