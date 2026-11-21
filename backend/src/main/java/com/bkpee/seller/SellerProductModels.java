package com.bkpee.seller;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public class SellerProductModels {

    public record SellerProduct(
        int id,
        String name,
        int categoryId,
        String categoryName,
        String description,
        String manufacturer,
        BigDecimal price,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        int stock,
        Integer variantId,
        String image,
        boolean active,
        String subType,
        String publisher,
        List<String> authors,
        String material,
        String warrantyId,
        String warrantyTime,
        boolean hasOrders
    ) {
        public SellerProduct(
            int id, String name, int categoryId, String categoryName, String description, String manufacturer,
            BigDecimal price, BigDecimal minPrice, BigDecimal maxPrice, int stock, Integer variantId, String image,
            boolean active, String subType, String publisher, List<String> authors, String material, String warrantyId, String warrantyTime
        ) {
            this(id, name, categoryId, categoryName, description, manufacturer, price, minPrice, maxPrice, stock, variantId, image, active, subType, publisher, authors, material, warrantyId, warrantyTime, false);
        }

        public SellerProduct(
            int id, String name, int categoryId, String categoryName, String description, String manufacturer,
            BigDecimal price, int stock, Integer variantId, String image, boolean active, String subType,
            String publisher, List<String> authors, String material, String warrantyId, String warrantyTime
        ) {
            this(id, name, categoryId, categoryName, description, manufacturer, price, price, price, stock, variantId, image, active, subType, publisher, authors, material, warrantyId, warrantyTime, false);
        }
    }

    public record VariantRequest(
        Integer variantId,
        BigDecimal price,
        Integer stock,
        String imageUrl,
        String variantName,
        Boolean active
    ) {
        public VariantRequest(BigDecimal price, Integer stock, String imageUrl, String variantName) {
            this(null, price, stock, imageUrl, variantName, true);
        }
    }

    public record CreateProductRequest(
        @NotBlank @Size(max = 255) String name,
        @NotNull Integer categoryId,
        @Size(max = 2000) String description,
        @Size(max = 100) String manufacturer,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        @NotNull @Min(0) Integer stock,
        String imageUrl,
        @NotBlank String subType, // BOOKS, CLOTHES, ELECTRONICS
        // Books specific
        @Size(max = 150) String publisher,
        List<String> authors,
        // Clothes specific
        @Size(max = 100) String material,
        // Electronics specific
        @Size(max = 50) String warrantyId,
        @Size(max = 50) String warrantyTime,
        // Optional list of additional variants
        List<VariantRequest> variants
    ) {}

    public record UpdateProductRequest(
        @NotBlank @Size(max = 255) String name,
        @NotNull Integer categoryId,
        @Size(max = 2000) String description,
        @Size(max = 100) String manufacturer,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        @NotNull @Min(0) Integer stock,
        String imageUrl,
        @NotBlank String subType,
        String publisher,
        List<String> authors,
        String material,
        String warrantyId,
        String warrantyTime,
        List<VariantRequest> variants
    ) {}

    public record QuickUpdateVariantRequest(
        @NotNull @DecimalMin("0.0") BigDecimal price,
        @NotNull @Min(0) Integer stock
    ) {}

    // Trả về 1 variant đầy đủ cho UI mở rộng
    public record VariantDetail(
        int variantId,
        String variantName,
        BigDecimal price,
        int stock,
        boolean active,
        String image,
        boolean hasOrders
    ) {
        public VariantDetail(int variantId, String variantName, BigDecimal price, int stock, boolean active, String image) {
            this(variantId, variantName, price, stock, active, image, false);
        }
    }

    // Yêu cầu chỉnh tồn kho (delta +/-)
    public record StockDeltaRequest(
        @NotNull int delta   // dương: thêm, âm: bớt
    ) {}

    // Yêu cầu thêm phân loại mới vào sản phẩm đã có
    public record AddVariantRequest(
        @NotBlank String variantName,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        @NotNull @Min(0) Integer stock,
        String imageUrl
    ) {}
}
