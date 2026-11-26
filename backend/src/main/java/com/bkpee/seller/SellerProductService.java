package com.bkpee.seller;

import com.bkpee.seller.SellerProductModels.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.*;

import static org.springframework.http.HttpStatus.*;

@Service
public class SellerProductService {

    private final JdbcTemplate db;

    public SellerProductService(JdbcTemplate db) {
        this.db = db;
    }

    private void ensureSeller(int sellerId) {
        Integer count = db.queryForObject("SELECT COUNT(*) FROM Seller WHERE Account_ID = ?", Integer.class, sellerId);
        if (count == null || count == 0) {
            throw new ResponseStatusException(FORBIDDEN, "Tài khoản của bạn chưa được cấp quyền Seller");
        }
    }

    @Transactional(readOnly = true)
    public List<SellerProduct> list(int sellerId, String keyword) {
        ensureSeller(sellerId);
        String sql = """
            SELECT 
                p.Product_ID AS productId,
                p.Product_Name AS name,
                p.Category_ID AS categoryId,
                c.Category_Name AS categoryName,
                p.Description AS description,
                p.Manufacturer AS manufacturer,
                v.minVariantId AS variantId,
                v.minPrice,
                v.maxPrice,
                v.totalStock,
                v.image,
                v.active,
                CAST(CASE WHEN EXISTS (
                    SELECT 1 FROM Shop_Order_Item oi 
                    JOIN Product_Variant pv ON pv.Variant_ID = oi.Variant_ID 
                    WHERE pv.Product_ID = p.Product_ID
                ) THEN 1 ELSE 0 END AS BIT) AS hasOrders,
                CASE 
                    WHEN b.Product_ID IS NOT NULL THEN 'Books'
                    WHEN cl.Product_ID IS NOT NULL THEN 'Clothes'
                    WHEN el.Product_ID IS NOT NULL THEN 'Electronics'
                    ELSE 'General'
                END AS subType,
                b.Publisher AS publisher,
                cl.Material AS material,
                el.Warranty_ID AS warrantyId,
                el.Warranty_Time AS warrantyTime
            FROM Product p
            JOIN Category c ON c.Category_ID = p.Category_ID
            OUTER APPLY (
                SELECT 
                    MIN(Variant_ID) AS minVariantId,
                    MIN(Price) AS minPrice,
                    MAX(Price) AS maxPrice,
                    COALESCE(SUM(Quantity_Stock), 0) AS totalStock,
                    MAX(Image) AS image,
                    CAST(CASE WHEN EXISTS (SELECT 1 FROM Product_Variant WHERE Product_ID = p.Product_ID AND Is_Active = 1) THEN 1 ELSE 0 END AS BIT) AS active
                FROM Product_Variant
                WHERE Product_ID = p.Product_ID
            ) v
            LEFT JOIN Books b ON b.Product_ID = p.Product_ID
            LEFT JOIN Clothes cl ON cl.Product_ID = p.Product_ID
            LEFT JOIN Electronics el ON el.Product_ID = p.Product_ID
            WHERE p.Seller_ID = ?
        """;

        List<Object> params = new ArrayList<>();
        params.add(sellerId);

        if (keyword != null && !keyword.trim().isBlank()) {
            sql += " AND (p.Product_Name LIKE ? OR c.Category_Name LIKE ? OR p.Manufacturer LIKE ?)";
            String pattern = "%" + keyword.trim() + "%";
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }

        sql += " ORDER BY p.Product_ID DESC";

        return db.query(sql, (rs, rowNum) -> {
            int prodId = rs.getInt("productId");
            String subType = rs.getString("subType");
            List<String> authors = Collections.emptyList();
            if ("Books".equalsIgnoreCase(subType)) {
                authors = db.queryForList("SELECT Author_Name FROM Book_Author WHERE Product_ID = ?", String.class, prodId);
            }

            BigDecimal minPrice = rs.getBigDecimal("minPrice");
            if (minPrice == null) minPrice = BigDecimal.ZERO;
            BigDecimal maxPrice = rs.getBigDecimal("maxPrice");
            if (maxPrice == null) maxPrice = minPrice;

            int variantIdVal = rs.getInt("variantId");
            Integer variantId = rs.wasNull() ? null : variantIdVal;

            return new SellerProduct(
                prodId,
                rs.getString("name"),
                rs.getInt("categoryId"),
                rs.getString("categoryName"),
                rs.getString("description"),
                rs.getString("manufacturer"),
                minPrice,
                minPrice,
                maxPrice,
                rs.getInt("totalStock"),
                variantId,
                rs.getString("image"),
                rs.getBoolean("active"),
                subType,
                rs.getString("publisher"),
                authors,
                rs.getString("material"),
                rs.getString("warrantyId"),
                rs.getString("warrantyTime"),
                rs.getBoolean("hasOrders")
            );
        }, params.toArray());
    }

    @Transactional
    public SellerProduct create(int sellerId, CreateProductRequest req) {
        ensureSeller(sellerId);

        // Verify category exists
        Integer catCount = db.queryForObject("SELECT COUNT(*) FROM Category WHERE Category_ID = ?", Integer.class, req.categoryId());
        if (catCount == null || catCount == 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Danh mục không tồn tại: " + req.categoryId());
        }

        // 1. Insert into Product
        GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();
        db.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO Product (Seller_ID, Category_ID, Product_Name, Description, Manufacturer) VALUES (?, ?, ?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS
            );
            ps.setInt(1, sellerId);
            ps.setInt(2, req.categoryId());
            ps.setString(3, req.name().trim());
            ps.setString(4, req.description());
            ps.setString(5, req.manufacturer());
            return ps;
        }, keyHolder);

        Number generatedKey = keyHolder.getKey();
        if (generatedKey == null) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Không lấy được Product_ID vừa tạo");
        }
        int productId = generatedKey.intValue();

        // 2. Insert into subtype table
        String normalizedType = req.subType() != null ? req.subType().trim().toUpperCase(Locale.ROOT) : "GENERAL";
        String actualType = "General";

        if ("BOOKS".equals(normalizedType) || normalizedType.contains("BOOK") || normalizedType.contains("SÁCH")) {
            actualType = "Books";
            String pub = (req.publisher() != null && !req.publisher().isBlank()) ? req.publisher().trim() : "NXB Tri Thức";
            db.update("INSERT INTO Books (Product_ID, Publisher) VALUES (?, ?)", productId, pub);

            if (req.authors() != null && !req.authors().isEmpty()) {
                for (String author : req.authors()) {
                    if (author != null && !author.isBlank()) {
                        db.update("INSERT INTO Book_Author (Product_ID, Author_Name) VALUES (?, ?)", productId, author.trim());
                    }
                }
            } else {
                db.update("INSERT INTO Book_Author (Product_ID, Author_Name) VALUES (?, ?)", productId, "Đang cập nhật");
            }
        } else if ("CLOTHES".equals(normalizedType) || normalizedType.contains("CLOTH") || normalizedType.contains("THỜI TRANG")) {
            actualType = "Clothes";
            String mat = (req.material() != null && !req.material().isBlank()) ? req.material().trim() : "100% Cotton";
            db.update("INSERT INTO Clothes (Product_ID, Material) VALUES (?, ?)", productId, mat);
        } else if ("ELECTRONICS".equals(normalizedType) || normalizedType.contains("ELECT") || normalizedType.contains("ĐIỆN TỬ")) {
            actualType = "Electronics";
            String wId = (req.warrantyId() != null && !req.warrantyId().isBlank()) ? req.warrantyId().trim() : "BH-" + productId;
            String wTime = (req.warrantyTime() != null && !req.warrantyTime().isBlank()) ? req.warrantyTime().trim() : "12 tháng";
            db.update("INSERT INTO Electronics (Product_ID, Warranty_ID, Warranty_Time) VALUES (?, ?, ?)", productId, wId, wTime);
        }

        // 3. Insert Variants (Hỗ trợ nhiều biến thể theo chuẩn CSDL Product_Variant)
        Integer variantId = null;
        if (req.variants() != null && !req.variants().isEmpty()) {
            for (VariantRequest v : req.variants()) {
                if (v.price() != null && v.stock() != null) {
                    GeneratedKeyHolder vkHolder = new GeneratedKeyHolder();
                    boolean isActive = v.active() == null || v.active();
                    db.update(connection -> {
                        PreparedStatement ps = connection.prepareStatement(
                            "INSERT INTO Product_Variant (Product_ID, Price, Is_Active, Quantity_Stock, Image, Variant_Name) VALUES (?, ?, ?, ?, ?, ?)",
                            Statement.RETURN_GENERATED_KEYS
                        );
                        ps.setInt(1, productId);
                        ps.setBigDecimal(2, v.price());
                        ps.setInt(3, isActive ? 1 : 0);
                        ps.setInt(4, v.stock());
                        ps.setString(5, v.imageUrl() != null && !v.imageUrl().isBlank() ? v.imageUrl().trim() : req.imageUrl());
                        ps.setString(6, v.variantName() != null && !v.variantName().isBlank() ? v.variantName().trim() : "Mặc định");
                        return ps;
                    }, vkHolder);
                    if (variantId == null && vkHolder.getKey() != null) {
                        variantId = vkHolder.getKey().intValue();
                    }
                }
            }
        }

        if (variantId == null) {
            GeneratedKeyHolder variantKeyHolder = new GeneratedKeyHolder();
            db.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO Product_Variant (Product_ID, Price, Is_Active, Quantity_Stock, Image, Variant_Name) VALUES (?, ?, 1, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
                );
                ps.setInt(1, productId);
                ps.setBigDecimal(2, req.price());
                ps.setInt(3, req.stock());
                ps.setString(4, req.imageUrl());
                ps.setString(5, "Mặc định");
                return ps;
            }, variantKeyHolder);
            Number vKey = variantKeyHolder.getKey();
            variantId = vKey != null ? vKey.intValue() : null;
        }

        String categoryName = db.queryForObject("SELECT Category_Name FROM Category WHERE Category_ID = ?", String.class, req.categoryId());

        List<String> authors = Collections.emptyList();
        if ("Books".equals(actualType)) {
            authors = db.queryForList("SELECT Author_Name FROM Book_Author WHERE Product_ID = ?", String.class, productId);
        }

        Map<String, Object> summary = db.queryForMap(
            "SELECT MIN(Price) AS minPrice, MAX(Price) AS maxPrice, COALESCE(SUM(Quantity_Stock), 0) AS totalStock, " +
            "MIN(Variant_ID) AS variantId " +
            "FROM Product_Variant WHERE Product_ID = ?",
            productId
        );
        BigDecimal minPrice = summary.get("minPrice") != null ? new BigDecimal(summary.get("minPrice").toString()) : req.price();
        BigDecimal maxPrice = summary.get("maxPrice") != null ? new BigDecimal(summary.get("maxPrice").toString()) : minPrice;
        int totalStock = summary.get("totalStock") != null ? ((Number) summary.get("totalStock")).intValue() : 0;
        Integer firstVariantId = summary.get("variantId") != null ? ((Number) summary.get("variantId")).intValue() : variantId;

        String returnPublisher = "Books".equals(actualType) ? ((req.publisher() != null && !req.publisher().isBlank()) ? req.publisher().trim() : "NXB Tri Thức") : null;
        String returnMaterial = "Clothes".equals(actualType) ? ((req.material() != null && !req.material().isBlank()) ? req.material().trim() : "100% Cotton") : null;
        String returnWarrantyId = "Electronics".equals(actualType) ? ((req.warrantyId() != null && !req.warrantyId().isBlank()) ? req.warrantyId().trim() : "BH-" + productId) : null;
        String returnWarrantyTime = "Electronics".equals(actualType) ? ((req.warrantyTime() != null && !req.warrantyTime().isBlank()) ? req.warrantyTime().trim() : "12 tháng") : null;

        return new SellerProduct(
            productId,
            req.name().trim(),
            req.categoryId(),
            categoryName,
            req.description(),
            req.manufacturer(),
            minPrice,
            minPrice,
            maxPrice,
            totalStock,
            firstVariantId,
            req.imageUrl(),
            true,
            actualType,
            returnPublisher,
            authors,
            returnMaterial,
            returnWarrantyId,
            returnWarrantyTime,
            false
        );
    }

    @Transactional
    public void quickUpdateVariant(int sellerId, int variantId, BigDecimal price, int stock) {
        ensureSeller(sellerId);
        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Giá bán không hợp lệ");
        }
        if (stock < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Số lượng tồn kho không được âm");
        }

        // Check ownership
        Integer productId = db.queryForObject(
            "SELECT p.Product_ID FROM Product_Variant v JOIN Product p ON p.Product_ID = v.Product_ID WHERE v.Variant_ID = ? AND p.Seller_ID = ?",
            (rs, rowNum) -> rs.getInt(1),
            variantId, sellerId
        );

        if (productId == null) {
            throw new ResponseStatusException(NOT_FOUND, "Không tìm thấy biến thể hoặc bạn không có quyền sửa");
        }

        int updated = db.update("UPDATE Product_Variant SET Price = ?, Quantity_Stock = ? WHERE Variant_ID = ?", price, stock, variantId);
        if (updated == 0) {
            throw new ResponseStatusException(NOT_FOUND, "Cập nhật biến thể thất bại");
        }
        db.update("UPDATE Product SET Updated_At = GETDATE() WHERE Product_ID = ?", productId);
    }

    @Transactional
    public SellerProduct update(int sellerId, int productId, UpdateProductRequest req) {
        ensureSeller(sellerId);

        // Verify product ownership
        Integer exists = db.queryForObject(
            "SELECT COUNT(*) FROM Product WHERE Product_ID = ? AND Seller_ID = ?",
            Integer.class,
            productId, sellerId
        );
        if (exists == null || exists == 0) {
            throw new ResponseStatusException(NOT_FOUND, "Sản phẩm không tồn tại hoặc không thuộc quyền sở hữu của bạn");
        }

        // 1. Update Product general info
        db.update(
            "UPDATE Product SET Product_Name = ?, Category_ID = ?, Description = ?, Manufacturer = ?, Updated_At = GETDATE() WHERE Product_ID = ?",
            req.name().trim(), req.categoryId(), req.description(), req.manufacturer(), productId
        );

        // 2. Synchronize variants (Thêm / Sửa / Ngừng bán an toàn)
        if (req.variants() != null && !req.variants().isEmpty()) {
            List<Integer> existingVariantIds = db.queryForList(
                "SELECT Variant_ID FROM Product_Variant WHERE Product_ID = ?", Integer.class, productId
            );
            Set<Integer> keptVariantIds = new HashSet<>();

            for (VariantRequest v : req.variants()) {
                if (v.price() == null || v.stock() == null) continue;
                String vName = (v.variantName() != null && !v.variantName().isBlank()) ? v.variantName().trim() : "Mặc định";
                String vImg = (v.imageUrl() != null && !v.imageUrl().isBlank()) ? v.imageUrl().trim() : req.imageUrl();
                boolean isActive = v.active() == null || v.active();

                if (v.variantId() != null && existingVariantIds.contains(v.variantId())) {
                    // Cập nhật variant đã có
                    db.update(
                        "UPDATE Product_Variant SET Variant_Name = ?, Price = ?, Quantity_Stock = ?, Image = ?, Is_Active = ? WHERE Variant_ID = ?",
                        vName, v.price(), v.stock(), vImg, isActive ? 1 : 0, v.variantId()
                    );
                    keptVariantIds.add(v.variantId());
                } else {
                    // Thêm variant mới
                    GeneratedKeyHolder vkHolder = new GeneratedKeyHolder();
                    db.update(connection -> {
                        PreparedStatement ps = connection.prepareStatement(
                            "INSERT INTO Product_Variant (Product_ID, Price, Is_Active, Quantity_Stock, Image, Variant_Name) VALUES (?, ?, ?, ?, ?, ?)",
                            Statement.RETURN_GENERATED_KEYS
                        );
                        ps.setInt(1, productId);
                        ps.setBigDecimal(2, v.price());
                        ps.setInt(3, isActive ? 1 : 0);
                        ps.setInt(4, v.stock());
                        ps.setString(5, vImg);
                        ps.setString(6, vName);
                        return ps;
                    }, vkHolder);
                    if (vkHolder.getKey() != null) {
                        keptVariantIds.add(vkHolder.getKey().intValue());
                    }
                }
            }

            // Xử lý các variant bị xóa khỏi form
            for (Integer oldId : existingVariantIds) {
                if (!keptVariantIds.contains(oldId)) {
                    Integer ordersCount = db.queryForObject(
                        "SELECT COUNT(*) FROM Shop_Order_Item WHERE Variant_ID = ?", Integer.class, oldId
                    );
                    if (ordersCount != null && ordersCount > 0) {
                        // Phân loại đã phát sinh đơn hàng: chuyển sang ngừng bán (Is_Active = 0) để bảo toàn dữ liệu lịch sử
                        db.update("UPDATE Product_Variant SET Is_Active = 0 WHERE Variant_ID = ?", oldId);
                    } else {
                        // Chưa có đơn hàng: xóa sạch khỏi Cart_Item và Product_Variant
                        deleteCartItemsAndRefresh("Variant_ID = ?", oldId);
                        db.update("DELETE FROM Product_Variant WHERE Variant_ID = ?", oldId);
                    }
                }
            }
        } else {
            // Fallback nếu không truyền danh sách variants
            db.update(
                "UPDATE Product_Variant SET Price = ?, Quantity_Stock = ?, Image = ? WHERE Product_ID = ?",
                req.price(), req.stock(), req.imageUrl(), productId
            );
        }

        // 3. Update subtype
        String normalizedType = req.subType() != null ? req.subType().trim().toUpperCase(Locale.ROOT) : "GENERAL";
        db.update("DELETE FROM Book_Author WHERE Product_ID = ?", productId);
        db.update("DELETE FROM Books WHERE Product_ID = ?", productId);
        db.update("DELETE FROM Clothes WHERE Product_ID = ?", productId);
        db.update("DELETE FROM Electronics WHERE Product_ID = ?", productId);

        String actualType = "General";
        if ("BOOKS".equals(normalizedType) || normalizedType.contains("BOOK")) {
            actualType = "Books";
            String pub = (req.publisher() != null && !req.publisher().isBlank()) ? req.publisher().trim() : "NXB Tri Thức";
            db.update("INSERT INTO Books (Product_ID, Publisher) VALUES (?, ?)", productId, pub);
            if (req.authors() != null && !req.authors().isEmpty()) {
                for (String author : req.authors()) {
                    if (author != null && !author.isBlank()) {
                        db.update("INSERT INTO Book_Author (Product_ID, Author_Name) VALUES (?, ?)", productId, author.trim());
                    }
                }
            } else {
                db.update("INSERT INTO Book_Author (Product_ID, Author_Name) VALUES (?, ?)", productId, "Đang cập nhật");
            }
        } else if ("CLOTHES".equals(normalizedType) || normalizedType.contains("CLOTH")) {
            actualType = "Clothes";
            String mat = (req.material() != null && !req.material().isBlank()) ? req.material().trim() : "100% Cotton";
            db.update("INSERT INTO Clothes (Product_ID, Material) VALUES (?, ?)", productId, mat);
        } else if ("ELECTRONICS".equals(normalizedType) || normalizedType.contains("ELECT")) {
            actualType = "Electronics";
            String wId = (req.warrantyId() != null && !req.warrantyId().isBlank()) ? req.warrantyId().trim() : "BH-" + productId;
            String wTime = (req.warrantyTime() != null && !req.warrantyTime().isBlank()) ? req.warrantyTime().trim() : "12 tháng";
            db.update("INSERT INTO Electronics (Product_ID, Warranty_ID, Warranty_Time) VALUES (?, ?, ?)", productId, wId, wTime);
        }

        String categoryName = db.queryForObject("SELECT Category_Name FROM Category WHERE Category_ID = ?", String.class, req.categoryId());

        List<String> authors = Collections.emptyList();
        if ("Books".equals(actualType)) {
            authors = db.queryForList("SELECT Author_Name FROM Book_Author WHERE Product_ID = ?", String.class, productId);
        }

        Map<String, Object> summary = db.queryForMap(
            "SELECT MIN(Price) AS minPrice, MAX(Price) AS maxPrice, COALESCE(SUM(Quantity_Stock), 0) AS totalStock, " +
            "MIN(Variant_ID) AS variantId, MAX(Image) AS image, " +
            "CAST(CASE WHEN EXISTS (SELECT 1 FROM Product_Variant WHERE Product_ID = ? AND Is_Active = 1) THEN 1 ELSE 0 END AS BIT) AS active " +
            "FROM Product_Variant WHERE Product_ID = ?",
            productId, productId
        );

        BigDecimal minPrice = summary.get("minPrice") != null ? new BigDecimal(summary.get("minPrice").toString()) : req.price();
        BigDecimal maxPrice = summary.get("maxPrice") != null ? new BigDecimal(summary.get("maxPrice").toString()) : minPrice;
        int totalStock = summary.get("totalStock") != null ? ((Number) summary.get("totalStock")).intValue() : 0;
        Integer variantId = summary.get("variantId") != null ? ((Number) summary.get("variantId")).intValue() : null;
        boolean active = Boolean.TRUE.equals(summary.get("active"));
        String image = (String) summary.get("image");
        if (image == null) image = req.imageUrl();

        String returnPublisher = "Books".equals(actualType) ? ((req.publisher() != null && !req.publisher().isBlank()) ? req.publisher().trim() : "NXB Tri Thức") : null;
        String returnMaterial = "Clothes".equals(actualType) ? ((req.material() != null && !req.material().isBlank()) ? req.material().trim() : "100% Cotton") : null;
        String returnWarrantyId = "Electronics".equals(actualType) ? ((req.warrantyId() != null && !req.warrantyId().isBlank()) ? req.warrantyId().trim() : "BH-" + productId) : null;
        String returnWarrantyTime = "Electronics".equals(actualType) ? ((req.warrantyTime() != null && !req.warrantyTime().isBlank()) ? req.warrantyTime().trim() : "12 tháng") : null;

        boolean hasOrders = Boolean.TRUE.equals(db.queryForObject(
            "SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM Shop_Order_Item oi JOIN Product_Variant pv ON pv.Variant_ID = oi.Variant_ID WHERE pv.Product_ID = ?) THEN 1 ELSE 0 END AS BIT)",
            Boolean.class, productId
        ));

        return new SellerProduct(
            productId,
            req.name().trim(),
            req.categoryId(),
            categoryName,
            req.description(),
            req.manufacturer(),
            minPrice,
            minPrice,
            maxPrice,
            totalStock,
            variantId,
            image,
            active,
            actualType,
            returnPublisher,
            authors,
            returnMaterial,
            returnWarrantyId,
            returnWarrantyTime,
            hasOrders
        );
    }

    @Transactional
    public void delete(int sellerId, int productId) {
        ensureSeller(sellerId);

        Integer exists = db.queryForObject(
            "SELECT COUNT(*) FROM Product WHERE Product_ID = ? AND Seller_ID = ?",
            Integer.class,
            productId, sellerId
        );
        if (exists == null || exists == 0) {
            throw new ResponseStatusException(NOT_FOUND, "Sản phẩm không tồn tại hoặc không thuộc quyền sở hữu của bạn");
        }

        // Check if any variant is in Shop_Order_Item
        Integer orderItemsCount = db.queryForObject(
            "SELECT COUNT(*) FROM Shop_Order_Item WHERE Variant_ID IN (SELECT Variant_ID FROM Product_Variant WHERE Product_ID = ?)",
            Integer.class,
            productId
        );

        if (orderItemsCount != null && orderItemsCount > 0) {
            throw new ResponseStatusException(
                CONFLICT,
                "Không thể xóa sản phẩm đã có lịch sử đơn hàng của người mua. Vui lòng cập nhật số lượng tồn kho về 0 để ngừng bán."
            );
        }

        // Clean from Cart_Item first
        deleteCartItemsAndRefresh("Variant_ID IN (SELECT Variant_ID FROM Product_Variant WHERE Product_ID = ?)", productId);

        // Delete Product (Cascades to Books, Clothes, Electronics, Book_Author, and Product_Variant)
        db.update("DELETE FROM Product WHERE Product_ID = ? AND Seller_ID = ?", productId, sellerId);
    }

    private void deleteCartItemsAndRefresh(String condition, int id) {
        db.update("""
            DECLARE @AffectedCarts TABLE (Cart_ID INT NOT NULL);
            DELETE FROM Cart_Item OUTPUT deleted.Cart_ID INTO @AffectedCarts WHERE
            """ + condition + """
            ;
            UPDATE c SET Total_product = (
                SELECT COALESCE(SUM(CONVERT(BIGINT, ci.Quantity)), 0)
                FROM Cart_Item ci WHERE ci.Cart_ID = c.Cart_ID
            ), Updated_At = SYSDATETIME()
            FROM Cart c WHERE EXISTS (SELECT 1 FROM @AffectedCarts a WHERE a.Cart_ID = c.Cart_ID);
            """, id);
    }

    // ── Variant management ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SellerProductModels.VariantDetail> listVariants(int sellerId, int productId) {
        ensureSeller(sellerId);
        // Verify ownership
        Integer exists = db.queryForObject(
            "SELECT COUNT(*) FROM Product WHERE Product_ID = ? AND Seller_ID = ?",
            Integer.class, productId, sellerId
        );
        if (exists == null || exists == 0) {
            throw new ResponseStatusException(NOT_FOUND, "Sản phẩm không tồn tại hoặc không thuộc quyền sở hữu của bạn");
        }
        return db.query(
            "SELECT v.Variant_ID, v.Variant_Name, v.Price, v.Quantity_Stock, v.Is_Active, v.Image, " +
            "CASE WHEN EXISTS (SELECT 1 FROM Shop_Order_Item WHERE Variant_ID = v.Variant_ID) THEN 1 ELSE 0 END AS hasOrders " +
            "FROM Product_Variant v WHERE v.Product_ID = ? ORDER BY v.Variant_ID ASC",
            (rs, rowNum) -> new SellerProductModels.VariantDetail(
                rs.getInt("Variant_ID"),
                rs.getString("Variant_Name"),
                rs.getBigDecimal("Price"),
                rs.getInt("Quantity_Stock"),
                rs.getBoolean("Is_Active"),
                rs.getString("Image"),
                rs.getInt("hasOrders") == 1
            ),
            productId
        );
    }

    @Transactional
    public SellerProductModels.VariantDetail toggleVariant(int sellerId, int variantId) {
        ensureSeller(sellerId);
        // Verify ownership via product
        Integer productId = db.queryForObject(
            "SELECT p.Product_ID FROM Product_Variant v JOIN Product p ON p.Product_ID = v.Product_ID " +
            "WHERE v.Variant_ID = ? AND p.Seller_ID = ?",
            Integer.class, variantId, sellerId
        );
        if (productId == null) {
            throw new ResponseStatusException(NOT_FOUND, "Không tìm thấy phân loại hoặc bạn không có quyền sửa");
        }
        db.update("UPDATE Product_Variant SET Is_Active = 1 - Is_Active WHERE Variant_ID = ?", variantId);
        return db.queryForObject(
            "SELECT Variant_ID, Variant_Name, Price, Quantity_Stock, Is_Active, Image FROM Product_Variant WHERE Variant_ID = ?",
            (rs, rowNum) -> new SellerProductModels.VariantDetail(
                rs.getInt("Variant_ID"),
                rs.getString("Variant_Name"),
                rs.getBigDecimal("Price"),
                rs.getInt("Quantity_Stock"),
                rs.getBoolean("Is_Active"),
                rs.getString("Image")
            ),
            variantId
        );
    }

    @Transactional
    public SellerProductModels.VariantDetail adjustStock(int sellerId, int variantId, int delta) {
        ensureSeller(sellerId);
        Integer productId = db.queryForObject(
            "SELECT p.Product_ID FROM Product_Variant v JOIN Product p ON p.Product_ID = v.Product_ID " +
            "WHERE v.Variant_ID = ? AND p.Seller_ID = ?",
            Integer.class, variantId, sellerId
        );
        if (productId == null) {
            throw new ResponseStatusException(NOT_FOUND, "Không tìm thấy phân loại hoặc bạn không có quyền sửa");
        }
        // Prevent negative stock
        Integer currentStock = db.queryForObject(
            "SELECT Quantity_Stock FROM Product_Variant WHERE Variant_ID = ?", Integer.class, variantId
        );
        if (currentStock == null) throw new ResponseStatusException(NOT_FOUND, "Phân loại không tồn tại");
        int newStock = currentStock + delta;
        if (newStock < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Số lượng tồn kho không thể âm (hiện tại: " + currentStock + ")");
        }
        db.update("UPDATE Product_Variant SET Quantity_Stock = ? WHERE Variant_ID = ?", newStock, variantId);
        return db.queryForObject(
            "SELECT Variant_ID, Variant_Name, Price, Quantity_Stock, Is_Active, Image FROM Product_Variant WHERE Variant_ID = ?",
            (rs, rowNum) -> new SellerProductModels.VariantDetail(
                rs.getInt("Variant_ID"),
                rs.getString("Variant_Name"),
                rs.getBigDecimal("Price"),
                rs.getInt("Quantity_Stock"),
                rs.getBoolean("Is_Active"),
                rs.getString("Image")
            ),
            variantId
        );
    }

    @Transactional
    public SellerProductModels.VariantDetail addVariant(int sellerId, int productId, SellerProductModels.AddVariantRequest req) {
        ensureSeller(sellerId);
        Integer exists = db.queryForObject(
            "SELECT COUNT(*) FROM Product WHERE Product_ID = ? AND Seller_ID = ?",
            Integer.class, productId, sellerId
        );
        if (exists == null || exists == 0) {
            throw new ResponseStatusException(NOT_FOUND, "Sản phẩm không tồn tại hoặc không thuộc quyền sở hữu của bạn");
        }
        GeneratedKeyHolder kh = new GeneratedKeyHolder();
        db.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                "INSERT INTO Product_Variant (Product_ID, Price, Is_Active, Quantity_Stock, Image, Variant_Name) VALUES (?, ?, 1, ?, ?, ?)",
                Statement.RETURN_GENERATED_KEYS
            );
            ps.setInt(1, productId);
            ps.setBigDecimal(2, req.price());
            ps.setInt(3, req.stock());
            ps.setString(4, req.imageUrl());
            ps.setString(5, req.variantName().trim());
            return ps;
        }, kh);
        int newId = kh.getKey().intValue();
        return db.queryForObject(
            "SELECT Variant_ID, Variant_Name, Price, Quantity_Stock, Is_Active, Image FROM Product_Variant WHERE Variant_ID = ?",
            (rs, rowNum) -> new SellerProductModels.VariantDetail(
                rs.getInt("Variant_ID"),
                rs.getString("Variant_Name"),
                rs.getBigDecimal("Price"),
                rs.getInt("Quantity_Stock"),
                rs.getBoolean("Is_Active"),
                rs.getString("Image")
            ),
            newId
        );
    }
}
