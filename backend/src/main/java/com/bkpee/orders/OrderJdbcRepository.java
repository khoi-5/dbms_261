package com.bkpee.orders;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;
import static com.bkpee.orders.OrderModels.*;

@Repository
public class OrderJdbcRepository {
    private final JdbcTemplate db;
    public OrderJdbcRepository(JdbcTemplate db) { this.db=db; }

    public void requireSchema() {
        record MissingColumn(String database, String column) {}

        var missing = db.query("""
            SELECT DB_NAME() AS Database_Name,
                   CONCAT(r.Table_Name, '.', r.Column_Name) AS Missing_Column
            FROM (VALUES
                ('dbo.[Order]', 'Checkout_Key'),
                ('dbo.[Order]', 'Checkout_Request_Hash'),
                ('dbo.[Order]', 'Receiver_Name'),
                ('dbo.[Order]', 'Receiver_Phone'),
                ('dbo.Shop_Order', 'Stock_Deducted'),
                ('dbo.Shop_Order_Item', 'Product_Name_Snapshot'),
                ('dbo.Payment_Information', 'Paid_At'),
                ('dbo.Payment_Information', 'Is_Simulated'),
                ('dbo.Shop_Order', 'Buyer_Received_At'),
                ('dbo.Product_Variant', 'Variant_Name'),
                ('dbo.Shop_Order_Item', 'Variant_Name_Snapshot'),
                ('dbo.Shop_Order', 'Promotion_ID_Snapshot'),
                ('dbo.Shop_Order', 'Discount_Amount')
            ) AS r(Table_Name, Column_Name)
            WHERE COL_LENGTH(r.Table_Name, r.Column_Name) IS NULL
            ORDER BY r.Table_Name, r.Column_Name
            """, (rs, rowNum) -> new MissingColumn(rs.getString("Database_Name"), rs.getString("Missing_Column")));

        if (missing.isEmpty()) return;

        var columns = missing.stream().map(MissingColumn::column).toList();
        String action = "Kiểm tra schema V2 tại database/v2/01_schema.sql; chỉ khởi tạo sau khi xác nhận đúng database và dữ liệu cần giữ.";
        throw new ResponseStatusException(SERVICE_UNAVAILABLE,
                "CSDL " + missing.getFirst().database() + " chưa đủ schema đơn hàng. Thiếu "
                        + String.join(", ", columns) + ". " + action);
    }

    public boolean isTestDatabase() {
        return Objects.requireNonNull(db.queryForObject("SELECT DB_NAME()",String.class)).startsWith("BKPEE_TEST_");
    }
    public Receiver receiver(int id) {
        return db.queryForObject("SELECT FName,LName,Phone,Address FROM Account WHERE Account_ID=?",
                (rs,n)->new Receiver((rs.getString("LName")+" "+rs.getString("FName")).strip(),
                        rs.getString("Phone"),rs.getString("Address")),id);
    }
    public List<ShippingProvider> providers() {
        return db.query("SELECT Provider_ID,Provider_Name,Base_Shipping_Fee FROM Shipping_Provider ORDER BY Provider_ID",
                (rs,n)->new ShippingProvider(rs.getInt(1),rs.getString(2),rs.getBigDecimal(3)));
    }
    public ShippingProvider provider(int id, boolean lock) {
        var rows=db.query("SELECT Provider_ID,Provider_Name,Base_Shipping_Fee FROM Shipping_Provider "
                +(lock?"WITH (HOLDLOCK) ":"")+"WHERE Provider_ID=?",
                (rs,n)->new ShippingProvider(rs.getInt(1),rs.getString(2),rs.getBigDecimal(3)),id);
        if(rows.isEmpty()) throw OrderRules.bad("Đơn vị vận chuyển không tồn tại");
        return rows.getFirst();
    }
    public void lockBuyer(int id) {
        var rows=db.queryForList("SELECT Account_ID FROM Buyer WITH (UPDLOCK,HOLDLOCK) WHERE Account_ID=?",Integer.class,id);
        if(rows.isEmpty()) throw new ResponseStatusException(FORBIDDEN,"Tài khoản không còn vai trò Buyer");
    }
    public Integer cartId(int buyerId) {
        var ids=db.queryForList("SELECT Cart_ID FROM Cart WHERE Buyer_ID=?",Integer.class,buyerId);
        return ids.isEmpty()?null:ids.getFirst();
    }
    public int promotionSeller(int promotionId) {
        var sellers=db.queryForList("SELECT Seller_ID FROM Promotion WHERE Promotion_ID=?",Integer.class,promotionId);
        if(sellers.isEmpty()) throw OrderRules.conflict("Khuyến mãi không còn áp dụng");
        return sellers.getFirst();
    }
    private static CartLine cartLine(ResultSet rs, int quantity) throws SQLException {
        return new CartLine(rs.getInt("Variant_ID"),rs.getInt("Product_ID"),rs.getInt("Seller_ID"),
                rs.getString("Product_Name"),rs.getString("Variant_Name"),rs.getString("Shop_Name"),rs.getString("Image"),
                rs.getBigDecimal("Price"),rs.getInt("Quantity_Stock"),rs.getBoolean("Is_Active"),
                rs.getString("Account_Status"),quantity);
    }
    public List<CartLine> cartLines(int buyerId) {
        return db.query("""
            SELECT v.*,p.Seller_ID,p.Product_Name,s.Shop_Name,a.Account_Status,ci.Quantity
            FROM Cart c JOIN Cart_Item ci ON ci.Cart_ID=c.Cart_ID
            JOIN Product_Variant v ON v.Variant_ID=ci.Variant_ID
            JOIN Product p ON p.Product_ID=v.Product_ID JOIN Seller s ON s.Account_ID=p.Seller_ID
            JOIN Account a ON a.Account_ID=s.Account_ID
            WHERE c.Buyer_ID=? ORDER BY v.Variant_ID
            """,(rs,n)->cartLine(rs,rs.getInt("Quantity")),buyerId);
    }
    public CartLine lockVariant(int id, int quantity) {
        var rows=db.query("""
            SELECT v.*,p.Seller_ID,p.Product_Name,s.Shop_Name,a.Account_Status
            FROM Product_Variant v WITH (UPDLOCK,HOLDLOCK)
            JOIN Product p WITH (HOLDLOCK) ON p.Product_ID=v.Product_ID
            JOIN Seller s ON s.Account_ID=p.Seller_ID
            JOIN Account a WITH (HOLDLOCK) ON a.Account_ID=s.Account_ID
            WHERE v.Variant_ID=?
            """,(rs,n)->cartLine(rs,quantity),id);
        if(rows.isEmpty()) throw OrderRules.conflict("Biến thể không còn tồn tại. Vui lòng tải lại giỏ");
        return rows.getFirst();
    }
    public StoredCheckout storedCheckout(int buyerId,String key) {
        var rows=db.query("SELECT Order_ID,Checkout_Request_Hash FROM [Order] WHERE Buyer_ID=? AND Checkout_Key=?",
                (rs,n)->new StoredCheckout(rs.getInt(1),rs.getBytes(2)),buyerId,key);
        return rows.isEmpty()?null:rows.getFirst();
    }
    private int insertId(String sql,String column,Object... args) {
        var keys=new GeneratedKeyHolder();
        db.update(connection->{
            var statement=connection.prepareStatement(sql,new String[]{column});
            for(int i=0;i<args.length;i++) statement.setObject(i+1,args[i]);
            return statement;
        },keys);
        return Objects.requireNonNull(keys.getKey()).intValue();
    }
    public int insertOrder(int buyer,CheckoutRequest r,BigDecimal total,byte[] hash) {
        return insertId("""
            INSERT INTO [Order](Buyer_ID,Total_Price,Delivery_Address,Receiver_Name,Receiver_Phone,
                Checkout_Key,Checkout_Request_Hash,Created_By,Updated_By)
            VALUES (?,?,?,?,?,?,?,?,?)
            ""","Order_ID",buyer,total,r.deliveryAddress(),r.receiverName(),r.receiverPhone(),
                r.requestKey(),hash,buyer,buyer);
    }
    public int insertShop(int order,int seller,ShippingProvider provider,AppliedPromotion promotion) {
        return insertId("""
            INSERT INTO Shop_Order(Order_ID,Seller_ID,Provider_ID,Shipping_Fee,Delivery_Status,Stock_Deducted,
                Promotion_ID_Snapshot,Discount_Amount)
            VALUES (?,?,?,?,N'PENDING',0,?,?)
            ""","Shop_Order_ID",order,seller,provider.id(),provider.fee(),promotion==null?null:promotion.id(),
                promotion==null?BigDecimal.ZERO:promotion.discountAmount());
    }
    public void insertItem(int shop,CartLine line) {
        db.update("""
            INSERT INTO Shop_Order_Item(Shop_Order_ID,Variant_ID,Quantity,Purchase_Price,Product_Name_Snapshot,Variant_Name_Snapshot)
            VALUES (?,?,?,?,?,?)
            """,shop,line.variantId(),line.quantity(),line.price(),line.name(),line.variantName());
    }
    public void deduct(int variant,int quantity) {
        int changed=db.update("""
            UPDATE Product_Variant SET Quantity_Stock=Quantity_Stock-?
            WHERE Variant_ID=? AND Is_Active=1 AND Quantity_Stock>=?
            """,quantity,variant,quantity);
        if(changed!=1) throw OrderRules.conflict("Sản phẩm không còn đủ tồn kho");
    }
    public void markDeducted(int shop) { db.update("UPDATE Shop_Order SET Stock_Deducted=1 WHERE Shop_Order_ID=?",shop); }
    public void insertPayment(int order,String method,boolean simulated) {
        db.update("""
            INSERT INTO Payment_Information(Order_ID,Transaction_Code,Payment_Method,Payment_Status,Is_Simulated,Paid_At)
            VALUES (?,?,?,?,?,CASE WHEN ?=1 THEN SYSDATETIME() ELSE NULL END)
            """,order,"BKPEE-"+UUID.randomUUID(),method,simulated?"COMPLETED":"PENDING",simulated,simulated?1:0);
    }
    public void clearCart(int id) {
        db.update("DELETE FROM Cart_Item WHERE Cart_ID=?",id);
        db.update("UPDATE Cart SET Total_product=0,Updated_At=SYSDATETIME() WHERE Cart_ID=?",id);
    }

    private record Query(String condition,List<Object> args) {}
    private Query filters(String prefix, int actor, Filter f, boolean seller) {
        var sql=new StringBuilder(prefix);
        var args=new ArrayList<Object>(); args.add(actor);
        if(!f.status().isEmpty()) {
            sql.append(seller?" AND so.Delivery_Status=?":
                    " AND EXISTS(SELECT 1 FROM Shop_Order fs WHERE fs.Order_ID=o.Order_ID AND fs.Delivery_Status=?)");
            args.add(f.status());
        }
        if(f.from()!=null) { sql.append(" AND o.Order_Time>=?"); args.add(Timestamp.valueOf(f.from().atStartOfDay())); }
        if(f.to()!=null) { sql.append(" AND o.Order_Time<?"); args.add(Timestamp.valueOf(f.to().plusDays(1).atStartOfDay())); }
        return new Query(sql.toString(),args);
    }
    public long countBuyer(int buyer, Filter f) {
        var q=filters(" FROM [Order] o WHERE o.Buyer_ID=?",buyer,f,false);
        return Objects.requireNonNull(db.queryForObject("SELECT COUNT_BIG(*)"+q.condition(),Long.class,q.args().toArray()));
    }
    public List<Integer> buyerIds(int buyer, Filter f) {
        var q=filters(" FROM [Order] o WHERE o.Buyer_ID=?",buyer,f,false);
        var args=new ArrayList<>(q.args()); args.add((long)f.page()*f.size()); args.add(f.size());
        return db.queryForList("SELECT o.Order_ID"+q.condition()+
                " ORDER BY o.Order_Time DESC,o.Order_ID DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
                Integer.class,args.toArray());
    }
    public long countSeller(int seller, Filter f) {
        var q=filters(" FROM Shop_Order so JOIN [Order] o ON o.Order_ID=so.Order_ID WHERE so.Seller_ID=?",seller,f,true);
        return Objects.requireNonNull(db.queryForObject("SELECT COUNT_BIG(*)"+q.condition(),Long.class,q.args().toArray()));
    }
    public List<Integer> sellerIds(int seller, Filter f) {
        var q=filters(" FROM Shop_Order so JOIN [Order] o ON o.Order_ID=so.Order_ID WHERE so.Seller_ID=?",seller,f,true);
        var args=new ArrayList<>(q.args()); args.add((long)f.page()*f.size()); args.add(f.size());
        return db.queryForList("SELECT so.Shop_Order_ID"+q.condition()+
                " ORDER BY o.Order_Time DESC,so.Shop_Order_ID DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
                Integer.class,args.toArray());
    }
    private static String placeholders(int count) { return String.join(",",Collections.nCopies(count,"?")); }
    private static Object[] argsWithIds(int actor,List<Integer> ids) {
        var args=new ArrayList<Object>(); args.add(actor); args.addAll(ids); return args.toArray();
    }
    private static LocalDateTime time(ResultSet rs,String name) throws SQLException {
        Timestamp value=rs.getTimestamp(name); return value==null?null:value.toLocalDateTime();
    }
    private static PaymentView payment(ResultSet rs) throws SQLException {
        boolean simulated=rs.getBoolean("Is_Simulated");
        return new PaymentView(simulated?"DEMO":Objects.toString(rs.getString("Payment_Method"),"UNKNOWN"),
                Objects.toString(rs.getString("Payment_Status"),"UNKNOWN"),simulated,time(rs,"Paid_At"));
    }
    private record Header(int id,LocalDateTime at,BigDecimal total,String name,String phone,String address,PaymentView payment) {}
    public List<OrderView> buyerOrders(int buyer,List<Integer> ids) {
        if(ids.isEmpty()) return List.of();
        var headers=db.query("""
            SELECT o.*,pi.Payment_Method,pi.Payment_Status,pi.Is_Simulated,pi.Paid_At
            FROM [Order] o LEFT JOIN Payment_Information pi ON pi.Order_ID=o.Order_ID
            WHERE o.Buyer_ID=? AND o.Order_ID IN (
            """+placeholders(ids.size())+") ORDER BY o.Order_Time DESC,o.Order_ID DESC",
                (rs,n)->new Header(rs.getInt("Order_ID"),time(rs,"Order_Time"),rs.getBigDecimal("Total_Price"),
                        rs.getString("Receiver_Name"),rs.getString("Receiver_Phone"),rs.getString("Delivery_Address"),payment(rs)),
                argsWithIds(buyer,ids));
        if(headers.isEmpty()) return List.of();
        var authorizedIds=headers.stream().map(Header::id).toList();
        var shops=shopViews("o.Buyer_ID=? AND so.Order_ID IN ("+placeholders(authorizedIds.size())+")",
                argsWithIds(buyer,authorizedIds));
        return headers.stream().map(h->{
            var children=shops.stream().filter(s->s.orderId()==h.id()).toList();
            var payable=children.stream().map(ShopOrderView::payableTotal).reduce(BigDecimal.ZERO,BigDecimal::add);
            var discount=children.stream().map(ShopOrderView::discountAmount).reduce(BigDecimal.ZERO,BigDecimal::add);
            return new OrderView(h.id(),h.at(),h.total(),payable,discount,h.name(),h.phone(),h.address(),h.payment(),children);
        }).toList();
    }
    public OrderView buyerOrder(int buyer,int order) {
        var rows=buyerOrders(buyer,List.of(order)); return rows.isEmpty()?null:rows.getFirst();
    }
    public List<ShopOrderView> sellerShops(int seller,List<Integer> ids) {
        return ids.isEmpty()?List.of():shopViews("so.Seller_ID=? AND so.Shop_Order_ID IN ("+placeholders(ids.size())+")",
                argsWithIds(seller,ids));
    }
    public ShopOrderView sellerShop(int seller,int shop) {
        var rows=sellerShops(seller,List.of(shop)); return rows.isEmpty()?null:rows.getFirst();
    }
    public ShopOrderView buyerShop(int buyer,int shop) {
        var rows=shopViews("o.Buyer_ID=? AND so.Shop_Order_ID=?",new Object[]{buyer,shop});
        return rows.isEmpty()?null:rows.getFirst();
    }
    private record ShopRow(int id,int order,LocalDateTime at,int seller,String shop,int buyerId,String buyer,String username,
                           String receiver,String phone,String address,int provider,String providerName,
                           String tracking,String status,BigDecimal fee,Integer promotionId,BigDecimal discount,
                           boolean deducted,PaymentView payment,
                           LocalDateTime shipped,LocalDateTime delivered,LocalDateTime received) {}
    private record ItemRow(int shop,LineItem item) {}
    private List<ShopOrderView> shopViews(String condition,Object[] args) {
        var rows=db.query("""
            SELECT so.*,o.Order_Time,o.Buyer_ID,o.Receiver_Name,o.Receiver_Phone,o.Delivery_Address,
                s.Shop_Name,(a.LName+N' '+a.FName) AS Buyer_Name,a.Username AS Buyer_Username,sp.Provider_Name,
                pi.Payment_Method,pi.Payment_Status,pi.Is_Simulated,pi.Paid_At
            FROM Shop_Order so JOIN [Order] o ON o.Order_ID=so.Order_ID
            JOIN Seller s ON s.Account_ID=so.Seller_ID JOIN Account a ON a.Account_ID=o.Buyer_ID
            JOIN Shipping_Provider sp ON sp.Provider_ID=so.Provider_ID
            LEFT JOIN Payment_Information pi ON pi.Order_ID=o.Order_ID
            WHERE
            """+condition+" ORDER BY o.Order_Time DESC,so.Shop_Order_ID DESC",(rs,n)->new ShopRow(
                rs.getInt("Shop_Order_ID"),rs.getInt("Order_ID"),time(rs,"Order_Time"),rs.getInt("Seller_ID"),
                rs.getString("Shop_Name"),rs.getInt("Buyer_ID"),rs.getString("Buyer_Name"),rs.getString("Buyer_Username"),
                rs.getString("Receiver_Name"),rs.getString("Receiver_Phone"),
                rs.getString("Delivery_Address"),rs.getInt("Provider_ID"),rs.getString("Provider_Name"),rs.getString("Tracking_Number"),
                rs.getString("Delivery_Status"),rs.getBigDecimal("Shipping_Fee"),
                rs.getObject("Promotion_ID_Snapshot",Integer.class),rs.getBigDecimal("Discount_Amount"),
                rs.getBoolean("Stock_Deducted"),payment(rs),
                time(rs,"Shipped_At"),time(rs,"Delivered_At"),time(rs,"Buyer_Received_At")),args);
        if(rows.isEmpty()) return List.of();
        var shopIds=rows.stream().map(ShopRow::id).toList();
        var items=new ArrayList<ItemRow>();
        // Keep IN lists well below SQL Server's 2100-parameter limit for multi-shop pages.
        for(int offset=0;offset<shopIds.size();offset+=500) {
            var chunk=shopIds.subList(offset,Math.min(offset+500,shopIds.size()));
            items.addAll(db.query("""
            SELECT i.*,COALESCE(i.Product_Name_Snapshot,p.Product_Name) AS Item_Name,v.Image
            FROM Shop_Order_Item i JOIN Product_Variant v ON v.Variant_ID=i.Variant_ID
            JOIN Product p ON p.Product_ID=v.Product_ID
            WHERE i.Shop_Order_ID IN (
            """+placeholders(chunk.size())+") ORDER BY i.Shop_Order_ID,i.Variant_ID",(rs,n)->{
                BigDecimal price=rs.getBigDecimal("Purchase_Price");
                int quantity=rs.getInt("Quantity");
                return new ItemRow(rs.getInt("Shop_Order_ID"),new LineItem(rs.getInt("Variant_ID"),rs.getString("Item_Name"),
                        rs.getString("Variant_Name_Snapshot"),rs.getString("Image"),quantity,price,
                        price.multiply(BigDecimal.valueOf(quantity))));
            },chunk.toArray()));
        }
        var grouped=new HashMap<Integer,List<LineItem>>();
        for(var item:items) grouped.computeIfAbsent(item.shop(),k->new ArrayList<>()).add(item.item());
        return rows.stream().map(r->{
            var lines=List.copyOf(grouped.getOrDefault(r.id(),List.of()));
            BigDecimal subtotal=lines.stream().map(LineItem::subtotal).reduce(BigDecimal.ZERO,BigDecimal::add);
            BigDecimal total=subtotal.subtract(r.discount()).add(r.fee());
            return new ShopOrderView(r.id(),r.order(),r.at(),r.seller(),r.shop(),r.buyerId(),r.buyer(),r.username(),
                    r.receiver(),r.phone(),r.address(),
                    r.provider(),r.providerName(),r.tracking(),r.status(),r.fee(),subtotal,r.promotionId(),r.discount(),total,
                    "CANCELLED".equals(r.status())?BigDecimal.ZERO:total,r.deducted(),r.payment(),r.shipped(),r.delivered(),r.received(),
                    lines,OrderRules.transitions(r.status(),r.deducted(),r.payment()),
                    OrderRules.canCancel(r.status(),r.deducted(),r.payment()),
                    OrderRules.canConfirmReceipt(r.status(),r.received()));
        }).toList();
    }

    /** Mutations lock parent order first, then shop, then variants in ascending ID order. */
    public int lockOwnedShop(int actor,int shop,boolean seller) {
        var ids=db.queryForList("""
            SELECT so.Order_ID FROM Shop_Order so JOIN [Order] o ON o.Order_ID=so.Order_ID
            WHERE so.Shop_Order_ID=? AND
            """+(seller?"so.Seller_ID=?":"o.Buyer_ID=?"),Integer.class,shop,actor);
        if(ids.isEmpty()) throw new ResponseStatusException(NOT_FOUND,"Không tìm thấy đơn hàng thuộc tài khoản này");
        int order=ids.getFirst();
        db.queryForObject("SELECT Order_ID FROM [Order] WITH (UPDLOCK,HOLDLOCK) WHERE Order_ID=?",Integer.class,order);
        db.queryForObject("SELECT Shop_Order_ID FROM Shop_Order WITH (UPDLOCK,HOLDLOCK) WHERE Shop_Order_ID=?",Integer.class,shop);
        return order;
    }
    public int updateStatus(int seller,int shop,String expected,String next,String tracking) {
        return db.update("""
            UPDATE Shop_Order SET Delivery_Status=?,
              Tracking_Number=CASE WHEN ?=N'SHIPPING' THEN ? ELSE Tracking_Number END,
              Shipped_At=CASE WHEN ?=N'SHIPPING' THEN SYSDATETIME() ELSE Shipped_At END,
              Delivered_At=CASE WHEN ?=N'DELIVERED' THEN SYSDATETIME() ELSE Delivered_At END
            WHERE Shop_Order_ID=? AND Seller_ID=? AND Delivery_Status=?
            """,next,next,tracking,next,next,shop,seller,expected);
    }
    public int cancel(int actor,int shop,String expected,boolean seller) {
        return db.update("""
            UPDATE Shop_Order SET Delivery_Status=N'CANCELLED',Stock_Deducted=0
            WHERE Shop_Order_ID=? AND Delivery_Status=? AND Stock_Deducted=1 AND
            """+(seller?"Seller_ID=?":"Order_ID IN (SELECT Order_ID FROM [Order] WHERE Buyer_ID=?)"),shop,expected,actor);
    }
    public int confirmReceipt(int buyer,int shop,String expected) {
        return db.update("""
            UPDATE so SET Buyer_Received_At=SYSDATETIME()
            FROM Shop_Order so JOIN [Order] o ON o.Order_ID=so.Order_ID
            WHERE so.Shop_Order_ID=? AND o.Buyer_ID=? AND so.Delivery_Status=? AND so.Buyer_Received_At IS NULL
            """,shop,buyer,expected);
    }
    public void restore(int variant,int quantity) {
        int changed=db.update("""
            UPDATE Product_Variant SET Quantity_Stock=Quantity_Stock+?
            WHERE Variant_ID=? AND Quantity_Stock<=?
            """,quantity,variant,Integer.MAX_VALUE-quantity);
        if(changed!=1) throw OrderRules.conflict("Không thể hoàn kho vì số lượng vượt giới hạn");
    }
    public void cancelCodPaymentIfEmpty(int order) {
        db.update("""
            UPDATE Payment_Information SET Payment_Status=N'CANCELLED'
            WHERE Order_ID=? AND Payment_Method=N'COD' AND Payment_Status=N'PENDING'
              AND NOT EXISTS(SELECT 1 FROM Shop_Order WHERE Order_ID=? AND Delivery_Status<>N'CANCELLED')
            """,order,order);
    }
}
