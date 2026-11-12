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
        return db.query("SELECT Category_ID,Category_Name,Parent_Category_ID FROM Category ORDER BY Category_Name",
            Map.of(), (rs, n) -> new Category(rs.getInt(1), rs.getString(2), rs.getObject(3, Integer.class)));
    }
    public Page search(Query filter) {
        String query = """
            SELECT p.Product_ID AS id,p.Product_Name AS name,c.Category_ID AS categoryId,
                   c.Category_Name AS category,MIN(v.Price) AS price,COUNT(*) AS variantCount
            FROM Product p JOIN Category c ON c.Category_ID=p.Category_ID
            JOIN Product_Variant v ON v.Product_ID=p.Product_ID
            JOIN Seller s ON s.Account_ID=p.Seller_ID JOIN Account a ON a.Account_ID=s.Account_ID
            WHERE v.Is_Active=1 AND v.Quantity_Stock>0 AND a.Account_Status=N'ACTIVE'
            """;
        var args = new MapSqlParameterSource();
        if (!filter.keyword().isEmpty()) {
            query += " AND p.Product_Name LIKE :keyword ESCAPE '~'";
            args.addValue("keyword", filter.likePattern());
        }
        if (filter.categoryId() != null) {
            query += " AND c.Category_ID=:categoryId"; args.addValue("categoryId", filter.categoryId());
        }
        query += " GROUP BY p.Product_ID,p.Product_Name,c.Category_ID,c.Category_Name HAVING 1=1";
        if (filter.minPrice() != null) { query += " AND MIN(v.Price)>=:minPrice"; args.addValue("minPrice", filter.minPrice()); }
        if (filter.maxPrice() != null) { query += " AND MIN(v.Price)<=:maxPrice"; args.addValue("maxPrice", filter.maxPrice()); }
        long total = Objects.requireNonNull(db.queryForObject("SELECT COUNT_BIG(*) FROM (" + query + ") grouped", args, Long.class));
        args.addValue("offset", (long) filter.page() * filter.size()).addValue("size", filter.size());
        var items = db.query("SELECT g.*,image.Image AS image FROM (" + query + """
            ) g OUTER APPLY (SELECT TOP (1) v.Image FROM Product_Variant v
            WHERE v.Product_ID=g.id AND v.Is_Active=1 AND v.Quantity_Stock>0
            ORDER BY v.Price,v.Variant_ID) image
            ORDER BY g.id OFFSET :offset ROWS FETCH NEXT :size ROWS ONLY
            """, args, (rs, n) -> new Product(rs.getInt("id"), rs.getString("name"), rs.getInt("categoryId"),
                rs.getString("category"), rs.getBigDecimal("price"), rs.getInt("variantCount"), rs.getString("image")));
        return new Page(items, filter.page(), filter.size(), total, (total + filter.size() - 1) / filter.size());
    }
    public List<Variant> variants(int productId) {
        return db.query("""
            SELECT v.Variant_ID,v.Product_ID,v.Price,v.Quantity_Stock,v.Image FROM Product_Variant v
            JOIN Product p ON p.Product_ID=v.Product_ID JOIN Seller s ON s.Account_ID=p.Seller_ID
            JOIN Account a ON a.Account_ID=s.Account_ID
            WHERE v.Product_ID=:id AND v.Is_Active=1 AND v.Quantity_Stock>0 AND a.Account_Status=N'ACTIVE'
            ORDER BY v.Price,v.Variant_ID
            """, Map.of("id", productId), (rs, n) -> new Variant(rs.getInt(1),rs.getInt(2),rs.getBigDecimal(3),rs.getInt(4),rs.getString(5)));
    }
}
