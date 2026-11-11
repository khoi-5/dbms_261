package com.bkpee.buyer;

import com.bkpee.auth.AccountAuthService;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class BuyerCartService {
    private final JdbcTemplate db;
    private final AccountAuthService auth;
    public BuyerCartService(JdbcTemplate db,AccountAuthService auth) { this.db=db; this.auth=auth; }
    private int cart(String subject) {
        var user=auth.current(subject);
        if(!user.roles().contains("BUYER")) throw new ResponseStatusException(FORBIDDEN,"Chỉ Buyer được sử dụng giỏ");
        // Serialize all writes for this Buyer, including lazy cart creation.
        db.queryForObject("SELECT Account_ID FROM Buyer WITH (UPDLOCK,HOLDLOCK) WHERE Account_ID=?",Integer.class,user.id());
        var ids=db.queryForList("SELECT Cart_ID FROM Cart WHERE Buyer_ID=?",Integer.class,user.id());
        if(ids.isEmpty()) { db.update("INSERT INTO Cart (Buyer_ID) VALUES (?)",user.id()); return db.queryForObject("SELECT Cart_ID FROM Cart WHERE Buyer_ID=?",Integer.class,user.id()); }
        return ids.getFirst();
    }
    @Transactional
    public Map<String,Object> get(String subject) { return response(cart(subject)); }
    private Map<String,Object> response(int cartId) {
        var items=db.queryForList("""
            SELECT v.Variant_ID AS variantId,p.Product_ID AS productId,p.Product_Name AS name,
            s.Shop_Name AS shop,v.Image AS image,v.Price AS price,v.Quantity_Stock AS stock,
            v.Is_Active AS active,a.Account_Status AS sellerStatus,ci.Quantity AS quantity,
            CAST(v.Price*ci.Quantity AS decimal(28,2)) AS subtotal
            FROM Cart_Item ci JOIN Product_Variant v ON v.Variant_ID=ci.Variant_ID
            JOIN Product p ON p.Product_ID=v.Product_ID JOIN Seller s ON s.Account_ID=p.Seller_ID
            JOIN Account a ON a.Account_ID=s.Account_ID WHERE ci.Cart_ID=? ORDER BY v.Variant_ID
            """,cartId);
        BigDecimal total=items.stream().map(i->(BigDecimal)i.get("subtotal")).reduce(BigDecimal.ZERO,BigDecimal::add);
        long quantity=items.stream().mapToLong(i->((Number)i.get("quantity")).longValue()).sum();
        return Map.of("id",cartId,"items",items,"total",total,"totalQuantity",quantity);
    }
    @Transactional
    public Map<String,Object> put(String subject,int variantId,int quantity,boolean add) {
        if(quantity<1) throw new ResponseStatusException(BAD_REQUEST,"Số lượng phải là số nguyên dương");
        int cartId=cart(subject);
        var rows=db.queryForList("""
            SELECT v.Quantity_Stock,v.Is_Active,a.Account_Status FROM Product_Variant v WITH (HOLDLOCK)
            JOIN Product p ON p.Product_ID=v.Product_ID JOIN Seller s ON s.Account_ID=p.Seller_ID
            JOIN Account a ON a.Account_ID=s.Account_ID WHERE v.Variant_ID=?
            """,variantId);
        if(rows.isEmpty()) throw new ResponseStatusException(NOT_FOUND,"Biến thể không tồn tại");
        var v=rows.getFirst();
        if(!Boolean.TRUE.equals(v.get("Is_Active")) || !"ACTIVE".equals(v.get("Account_Status"))) throw new ResponseStatusException(CONFLICT,"Sản phẩm đã ngừng bán");
        var existing=db.queryForList("SELECT Quantity FROM Cart_Item WHERE Cart_ID=? AND Variant_ID=?",Integer.class,cartId,variantId);
        if(!add && existing.isEmpty()) throw new ResponseStatusException(NOT_FOUND,"Sản phẩm không có trong giỏ");
        long next=(long)quantity+(add && !existing.isEmpty()?existing.getFirst():0);
        if(next>((Number)v.get("Quantity_Stock")).longValue()) throw new ResponseStatusException(CONFLICT,"Số lượng vượt tồn kho hiện tại");
        if(existing.isEmpty()) db.update("INSERT INTO Cart_Item (Cart_ID,Variant_ID,Quantity) VALUES (?,?,?)",cartId,variantId,(int)next);
        else db.update("UPDATE Cart_Item SET Quantity=? WHERE Cart_ID=? AND Variant_ID=?",(int)next,cartId,variantId);
        refreshCount(cartId); return response(cartId);
    }
    @Transactional
    public Map<String,Object> remove(String subject,int variantId) {
        int cartId=cart(subject);
        if(db.update("DELETE FROM Cart_Item WHERE Cart_ID=? AND Variant_ID=?",cartId,variantId)==0) throw new ResponseStatusException(NOT_FOUND,"Sản phẩm không có trong giỏ");
        refreshCount(cartId); return response(cartId);
    }
    private void refreshCount(int id) {
        db.update("UPDATE Cart SET Total_product=(SELECT COUNT(*) FROM Cart_Item WHERE Cart_ID=?),Updated_At=SYSDATETIME() WHERE Cart_ID=?",id,id);
    }
}
