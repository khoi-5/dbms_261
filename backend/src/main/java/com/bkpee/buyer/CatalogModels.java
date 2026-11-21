package com.bkpee.buyer;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.List;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

public final class CatalogModels {
    private CatalogModels() {}
    public record Category(int id, String name, Integer parentId, String targetType) {
        public Category(int id, String name, Integer parentId) {
            this(id, name, parentId, "GENERAL");
        }
    }
    public record Product(int id, String name, int categoryId, String category,
                          BigDecimal price, BigDecimal maxPrice, int variantCount, String image, String productType) {}
    public record Variant(int id, int productId, BigDecimal price, int stock, String image, String variantName) {}
    public record Page(List<Product> items, int page, int size, long totalElements, long totalPages) {}

    public record ProductDetail(
        int id, String name, String description, String manufacturer,
        int categoryId, String categoryName, int sellerId, String shopName,
        String productType, // "BOOK", "CLOTHES", "ELECTRONICS", "OTHER"
        String publisher, List<String> authors, // Books
        String material, // Clothes
        String warrantyId, String warrantyTime, // Electronics
        List<Variant> variants
    ) {}

    public record Query(String keyword, Integer categoryId, String format, BigDecimal minPrice, BigDecimal maxPrice,
                        int page, int size) {
        public static Query of(String keyword, Integer categoryId, BigDecimal minPrice, BigDecimal maxPrice,
                               int page, Integer size, CatalogSettings settings) {
            return of(keyword, categoryId, null, minPrice, maxPrice, page, size, settings);
        }

        public static Query of(String keyword, Integer categoryId, String format, BigDecimal minPrice, BigDecimal maxPrice,
                               int page, Integer size, CatalogSettings settings) {
            String normalized = Normalizer.normalize(keyword == null ? "" : keyword.replaceAll("(?U)^\\s+|\\s+$", ""), Normalizer.Form.NFC);
            int requestedSize = size == null ? settings.defaultPageSize() : size;
            if (normalized.length() > 255 || page < 0 || page > 100000 || requestedSize < 1
                    || requestedSize > settings.maxPageSize() || (categoryId != null && categoryId < 1))
                throw new ResponseStatusException(BAD_REQUEST, "Bộ lọc hoặc phân trang không hợp lệ");
            validatePrice(minPrice); validatePrice(maxPrice);
            if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0)
                throw new ResponseStatusException(BAD_REQUEST, "Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa");
            String fmt = format == null || format.isBlank() ? null : format.trim().toUpperCase();
            return new Query(normalized, categoryId, fmt, minPrice, maxPrice, page, requestedSize);
        }
        private static void validatePrice(BigDecimal price) {
            if (price != null && (price.signum() < 0 || price.stripTrailingZeros().scale() > 2
                    || price.compareTo(new BigDecimal("9999999999999999.99")) > 0))
                throw new ResponseStatusException(BAD_REQUEST, "Giá phải không âm, tối đa 2 chữ số thập phân và nằm trong decimal(18,2)");
        }
        public String likePattern() {
            return "%" + keyword.replace("~", "~~").replace("%", "~%").replace("_", "~_").replace("[", "~[") + "%";
        }
    }
}
