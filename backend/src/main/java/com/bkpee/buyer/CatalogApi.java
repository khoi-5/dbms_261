package com.bkpee.buyer;

import java.math.BigDecimal;
import java.util.*;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api")
public class CatalogApi {
    private final NamedParameterJdbcTemplate db;
    public CatalogApi(NamedParameterJdbcTemplate db) { this.db=db; }
    // One row per Product. Price filters apply to the minimum saleable variant price.
    private static final String GROUPED = """
        SELECT p.Product_ID AS id,p.Product_Name AS name,c.Category_ID AS categoryId,
        c.Category_Name AS category,MIN(v.Price) AS price,COUNT(*) AS variantCount
        FROM Product p JOIN Category c ON c.Category_ID=p.Category_ID
        JOIN Product_Variant v ON v.Product_ID=p.Product_ID
        JOIN Seller s ON s.Account_ID=p.Seller_ID
        JOIN Account a ON a.Account_ID=s.Account_ID
        WHERE v.Is_Active=1 AND v.Quantity_Stock>0 AND a.Account_Status=N'ACTIVE'
        AND p.Product_Name LIKE :keyword ESCAPE '~'
        """;
    @GetMapping("/categories")
    public List<Map<String,Object>> categories() { return db.queryForList("SELECT Category_ID AS id,Category_Name AS name,Parent_Category_ID AS parentId FROM Category ORDER BY Category_Name", Map.of()); }
    @GetMapping("/products")
    public Map<String,Object> products(@RequestParam(defaultValue="") String keyword,
        @RequestParam(required=false) Integer categoryId, @RequestParam(required=false) BigDecimal minPrice,
        @RequestParam(required=false) BigDecimal maxPrice, @RequestParam(defaultValue="0") int page,
        @RequestParam(defaultValue="12") int size) {
        validatePrice(minPrice); validatePrice(maxPrice);
        if(page<0 || page>100000 || size<1 || size>48 || keyword.length()>255 || (categoryId!=null && categoryId<1) || (minPrice!=null && maxPrice!=null && minPrice.compareTo(maxPrice)>0))
            throw new ResponseStatusException(BAD_REQUEST,"Bộ lọc hoặc phân trang không hợp lệ");
        String escaped=keyword.trim().replace("~","~~").replace("%","~%").replace("_","~_").replace("[","~[");
        var args=new MapSqlParameterSource("keyword","%"+escaped+"%");
        String query=GROUPED;
        if(categoryId!=null) { query+=" AND c.Category_ID=:categoryId"; args.addValue("categoryId",categoryId); }
        query+=" GROUP BY p.Product_ID,p.Product_Name,c.Category_ID,c.Category_Name HAVING 1=1";
        if(minPrice!=null) { query+=" AND MIN(v.Price)>=:minPrice"; args.addValue("minPrice",minPrice); }
        if(maxPrice!=null) { query+=" AND MIN(v.Price)<=:maxPrice"; args.addValue("maxPrice",maxPrice); }
        long total=Objects.requireNonNull(db.queryForObject("SELECT COUNT_BIG(*) FROM ("+query+") grouped",args,Long.class));
        args.addValue("offset",(long)page*size).addValue("size",size);
        var items=db.queryForList("SELECT g.*,image.Image AS image FROM ("+query+"""
            ) g OUTER APPLY (SELECT TOP (1) v.Image FROM Product_Variant v
            WHERE v.Product_ID=g.id AND v.Is_Active=1 AND v.Quantity_Stock>0
            ORDER BY v.Price,v.Variant_ID) image
            ORDER BY g.id OFFSET :offset ROWS FETCH NEXT :size ROWS ONLY
            """,args);
        return Map.of("items",items,"page",page,"size",size,"totalElements",total,"totalPages",(total+size-1)/size);
    }
    private void validatePrice(BigDecimal price) {
        if(price!=null && (price.signum()<0 || price.scale()>2 || price.compareTo(new BigDecimal("9999999999999999.99"))>0))
            throw new ResponseStatusException(BAD_REQUEST,"Giá phải không âm, tối đa 2 chữ số thập phân và nằm trong decimal(18,2)");
    }
    @GetMapping("/products/{id}/variants")
    public List<Map<String,Object>> variants(@PathVariable int id) {
        var rows=db.queryForList("""
            SELECT v.Variant_ID AS id,v.Product_ID AS productId,v.Price AS price,
            v.Quantity_Stock AS stock,v.Image AS image FROM Product_Variant v
            JOIN Product p ON p.Product_ID=v.Product_ID JOIN Seller s ON s.Account_ID=p.Seller_ID
            JOIN Account a ON a.Account_ID=s.Account_ID
            WHERE v.Product_ID=:id AND v.Is_Active=1 AND v.Quantity_Stock>0 AND a.Account_Status=N'ACTIVE'
            ORDER BY v.Price,v.Variant_ID
            """,Map.of("id",id));
        if(rows.isEmpty()) throw new ResponseStatusException(NOT_FOUND,"Sản phẩm không còn biến thể được phép bán");
        return rows;
    }
}
