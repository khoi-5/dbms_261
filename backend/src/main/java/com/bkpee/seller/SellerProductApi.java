package com.bkpee.seller;

import com.bkpee.seller.SellerProductModels.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/seller/products")
public class SellerProductApi {

    private final SellerProductService service;

    public SellerProductApi(SellerProductService service) {
        this.service = service;
    }

    private int getSellerId(Jwt jwt) {
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
    public List<SellerProduct> list(
        @AuthenticationPrincipal Jwt jwt,
        @RequestParam(required = false) String keyword
    ) {
        return service.list(getSellerId(jwt), keyword);
    }

    @PostMapping("/upload")
    public java.util.Map<String, String> uploadImage(
        @AuthenticationPrincipal Jwt jwt,
        @RequestParam("file") org.springframework.web.multipart.MultipartFile file
    ) {
        getSellerId(jwt);
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ảnh không được để trống");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ chấp nhận file định dạng hình ảnh (PNG, JPG, WEBP, GIF)");
        }
        try {
            java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads", "products").toAbsolutePath().normalize();
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }
            String originalFilename = file.getOriginalFilename();
            String extension = ".jpg";
            if (originalFilename != null && originalFilename.lastIndexOf('.') > 0) {
                extension = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase();
            }
            String safeFilename = java.util.UUID.randomUUID().toString() + extension;
            java.nio.file.Path targetFile = uploadPath.resolve(safeFilename);
            file.transferTo(targetFile);

            String fileUrl = "/uploads/products/" + safeFilename;
            return java.util.Map.of("url", fileUrl);
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu file ảnh: " + e.getMessage());
        }
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SellerProduct create(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody CreateProductRequest request
    ) {
        return service.create(getSellerId(jwt), request);
    }

    @PutMapping("/variants/{variantId}")
    public void quickUpdateVariant(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable int variantId,
        @RequestBody(required = false) QuickUpdateVariantRequest body,
        @RequestParam(required = false) BigDecimal price,
        @RequestParam(required = false) Integer stock
    ) {
        BigDecimal finalPrice = body != null ? body.price() : price;
        Integer finalStock = body != null ? body.stock() : stock;

        if (finalPrice == null || finalStock == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cần cung cấp giá và số lượng tồn kho mới");
        }
        service.quickUpdateVariant(getSellerId(jwt), variantId, finalPrice, finalStock);
    }

    @PutMapping("/{productId}")
    public SellerProduct update(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable int productId,
        @Valid @RequestBody UpdateProductRequest request
    ) {
        return service.update(getSellerId(jwt), productId, request);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable int productId
    ) {
        service.delete(getSellerId(jwt), productId);
    }

    // ── Variant endpoints ───────────────────────────────────────────────────────

    /** Lấy toàn bộ variants của 1 sản phẩm */
    @GetMapping("/{productId}/variants")
    public List<SellerProductModels.VariantDetail> listVariants(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable int productId
    ) {
        return service.listVariants(getSellerId(jwt), productId);
    }

    /** Thêm phân loại mới vào sản phẩm đã có */
    @PostMapping("/{productId}/variants")
    @ResponseStatus(HttpStatus.CREATED)
    public SellerProductModels.VariantDetail addVariant(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable int productId,
        @Valid @RequestBody SellerProductModels.AddVariantRequest req
    ) {
        return service.addVariant(getSellerId(jwt), productId, req);
    }

    /** Bật / Tắt Is_Active của 1 variant */
    @PatchMapping("/variants/{variantId}/toggle")
    public SellerProductModels.VariantDetail toggleVariant(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable int variantId
    ) {
        return service.toggleVariant(getSellerId(jwt), variantId);
    }

    /** Điều chỉnh tồn kho (delta +/-) */
    @PatchMapping("/variants/{variantId}/stock")
    public SellerProductModels.VariantDetail adjustStock(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable int variantId,
        @RequestBody SellerProductModels.StockDeltaRequest body
    ) {
        return service.adjustStock(getSellerId(jwt), variantId, body.delta());
    }
}
