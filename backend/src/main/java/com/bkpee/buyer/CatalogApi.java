package com.bkpee.buyer;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static com.bkpee.buyer.CatalogModels.*;

@RestController
@RequestMapping("/api")
public class CatalogApi {
    private final CatalogJdbcRepository catalog;
    private final CatalogSettings settings;
    public CatalogApi(CatalogJdbcRepository catalog, CatalogSettings settings) {
        this.catalog = catalog; this.settings = settings;
    }
    @GetMapping("/categories") public List<Category> categories() { return catalog.categories(); }
    @GetMapping("/products")
    public Page products(@RequestParam(defaultValue="") String keyword,
                         @RequestParam(required=false) Integer categoryId,
                         @RequestParam(required=false) BigDecimal minPrice,
                         @RequestParam(required=false) BigDecimal maxPrice,
                         @RequestParam(defaultValue="0") int page,
                         @RequestParam(required=false) Integer size) {
        return catalog.search(Query.of(keyword, categoryId, minPrice, maxPrice, page, size, settings));
    }
    @GetMapping("/products/{id}/variants") public List<Variant> variants(@PathVariable int id) {
        var rows = catalog.variants(id);
        if (rows.isEmpty()) throw new ResponseStatusException(NOT_FOUND, "Sản phẩm không còn biến thể được phép bán");
        return rows;
    }
}
