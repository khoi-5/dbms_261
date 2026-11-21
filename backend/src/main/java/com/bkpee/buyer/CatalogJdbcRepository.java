package com.bkpee.buyer;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Repository;
import static com.bkpee.buyer.CatalogModels.*;

@Repository
public class CatalogJdbcRepository {
    private final NamedParameterJdbcTemplate db;
    public CatalogJdbcRepository(NamedParameterJdbcTemplate db) { this.db = db; }

    public List<Category> categories() {
        return db.query("SELECT Category_ID,Category_Name,Parent_Category_ID,Target_Type FROM Category ORDER BY Category_Name",
            Map.of(), (rs, n) -> new Category(rs.getInt(1), rs.getString(2), rs.getObject(3, Integer.class), rs.getString(4)));
    }

    public Page search(Query filter) {
        String query = """
            SELECT p.Product_ID AS id,p.Product_Name AS name,c.Category_ID AS categoryId,
                   c.Category_Name AS category,MIN(v.Price) AS price,MAX(v.Price) AS maxPrice,COUNT(*) AS variantCount,
                   CASE 
                       WHEN bk.Product_ID IS NOT NULL THEN 'BOOK'
                       WHEN cl.Product_ID IS NOT NULL THEN 'CLOTHES'
                       WHEN el.Product_ID IS NOT NULL THEN 'ELECTRONICS'
                       ELSE 'OTHER'
                   END AS productType
            FROM Product p 
            JOIN Category c ON c.Category_ID=p.Category_ID
            JOIN Product_Variant v ON v.Product_ID=p.Product_ID
            JOIN Seller s ON s.Account_ID=p.Seller_ID 
            JOIN Account a ON a.Account_ID=s.Account_ID
            LEFT JOIN Books bk ON bk.Product_ID=p.Product_ID
            LEFT JOIN Clothes cl ON cl.Product_ID=p.Product_ID
            LEFT JOIN Electronics el ON el.Product_ID=p.Product_ID
            WHERE v.Is_Active=1 AND v.Quantity_Stock>0 AND a.Account_Status=N'ACTIVE'
            """;
        var args = new MapSqlParameterSource();
        if (!filter.keyword().isEmpty()) {
            query += " AND p.Product_Name LIKE :keyword ESCAPE '~'";
            args.addValue("keyword", filter.likePattern());
        }
        if (filter.categoryId() != null) {
            query += " AND c.Category_ID=:categoryId"; 
            args.addValue("categoryId", filter.categoryId());
        }
        if (filter.format() != null) {
            switch (filter.format()) {
                case "BOOK" -> query += " AND bk.Product_ID IS NOT NULL\n";
                case "CLOTHES" -> query += " AND cl.Product_ID IS NOT NULL\n";
                case "ELECTRONICS" -> query += " AND el.Product_ID IS NOT NULL\n";
            }
        }
        query += """

            GROUP BY p.Product_ID,p.Product_Name,c.Category_ID,c.Category_Name,
                     bk.Product_ID,cl.Product_ID,el.Product_ID 
            HAVING 1=1
            """;
        if (filter.minPrice() != null) { 
            query += " AND MIN(v.Price)>=:minPrice"; 
            args.addValue("minPrice", filter.minPrice()); 
        }
        if (filter.maxPrice() != null) { 
            query += " AND MIN(v.Price)<=:maxPrice"; 
            args.addValue("maxPrice", filter.maxPrice()); 
        }

        long total = Objects.requireNonNull(db.queryForObject("SELECT COUNT_BIG(*) FROM (" + query + ") grouped", args, Long.class));
        args.addValue("offset", (long) filter.page() * filter.size()).addValue("size", filter.size());
        var items = db.query("SELECT g.*,image.Image AS image FROM (" + query + """
            ) g OUTER APPLY (SELECT TOP (1) v.Image FROM Product_Variant v
            WHERE v.Product_ID=g.id AND v.Is_Active=1 AND v.Quantity_Stock>0
            ORDER BY v.Price,v.Variant_ID) image
            ORDER BY g.id OFFSET :offset ROWS FETCH NEXT :size ROWS ONLY
            """, args, (rs, n) -> new Product(
                rs.getInt("id"), rs.getString("name"), rs.getInt("categoryId"),
                rs.getString("category"), rs.getBigDecimal("price"), rs.getBigDecimal("maxPrice"), 
                rs.getInt("variantCount"), rs.getString("image"), rs.getString("productType")
            ));
        return new Page(items, filter.page(), filter.size(), total, (total + filter.size() - 1) / filter.size());
    }

    public List<Variant> variants(int productId) {
        return db.query("""
            SELECT v.Variant_ID,v.Product_ID,v.Price,v.Quantity_Stock,v.Image,v.Variant_Name FROM Product_Variant v
            JOIN Product p ON p.Product_ID=v.Product_ID JOIN Seller s ON s.Account_ID=p.Seller_ID
            JOIN Account a ON a.Account_ID=s.Account_ID
            WHERE v.Product_ID=:id AND v.Is_Active=1 AND v.Quantity_Stock>0 AND a.Account_Status=N'ACTIVE'
            ORDER BY v.Price,v.Variant_ID
            """, Map.of("id", productId), (rs, n) -> new Variant(rs.getInt(1),rs.getInt(2),rs.getBigDecimal(3),rs.getInt(4),rs.getString(5),rs.getString(6)));
    }

    public ProductDetail findDetail(int productId) {
        var rows = db.query("""
            SELECT p.Product_ID, p.Product_Name, p.Description, p.Manufacturer,
                   c.Category_ID, c.Category_Name, s.Account_ID AS Seller_ID, s.Shop_Name,
                   bk.Publisher,
                   cl.Material,
                   el.Warranty_ID, el.Warranty_Time,
                   CASE 
                       WHEN bk.Product_ID IS NOT NULL THEN 'BOOK'
                       WHEN cl.Product_ID IS NOT NULL THEN 'CLOTHES'
                       WHEN el.Product_ID IS NOT NULL THEN 'ELECTRONICS'
                       ELSE 'OTHER'
                   END AS productType
            FROM Product p
            JOIN Category c ON c.Category_ID=p.Category_ID
            JOIN Seller s ON s.Account_ID=p.Seller_ID
            JOIN Account a ON a.Account_ID=s.Account_ID
            LEFT JOIN Books bk ON bk.Product_ID=p.Product_ID
            LEFT JOIN Clothes cl ON cl.Product_ID=p.Product_ID
            LEFT JOIN Electronics el ON el.Product_ID=p.Product_ID
            WHERE p.Product_ID=:id AND a.Account_Status=N'ACTIVE'
            """, Map.of("id", productId), (rs, n) -> {
                String type = rs.getString("productType");
                List<String> authors = List.of();
                if ("BOOK".equals(type)) {
                    authors = db.queryForList(
                        "SELECT Author_Name FROM Book_Author WHERE Product_ID=:id",
                        Map.of("id", productId),
                        String.class
                    );
                }
                var vList = variants(productId);
                return new ProductDetail(
                    rs.getInt("Product_ID"),
                    rs.getString("Product_Name"),
                    rs.getString("Description"),
                    rs.getString("Manufacturer"),
                    rs.getInt("Category_ID"),
                    rs.getString("Category_Name"),
                    rs.getInt("Seller_ID"),
                    rs.getString("Shop_Name"),
                    type,
                    rs.getString("Publisher"),
                    authors,
                    rs.getString("Material"),
                    rs.getString("Warranty_ID"),
                    rs.getString("Warranty_Time"),
                    vList
                );
            });
        return rows.isEmpty() ? null : rows.getFirst();
    }
}
