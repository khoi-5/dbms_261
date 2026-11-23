package com.bkpee.orders;

import com.bkpee.auth.AccountAuthService;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;
import static com.bkpee.orders.OrderModels.*;

@Service
public class OrderService {
    private final OrderJdbcRepository orders;
    private final AccountAuthService auth;
    public OrderService(OrderJdbcRepository orders,AccountAuthService auth) { this.orders=orders; this.auth=auth; }
    private int actor(String subject,String role) {
        var user=auth.current(subject);
        if(!user.roles().contains(role)) throw new ResponseStatusException(FORBIDDEN,"Tài khoản không có quyền thực hiện thao tác");
        orders.requireSchema();
        return user.id();
    }
    private static <T> Page<T> page(List<T> rows,Filter f,long total) {
        return new Page<>(rows,f.page(),f.size(),total,(total+f.size()-1)/f.size());
    }
    @Transactional(readOnly=true)
    public Page<OrderView> buyerOrders(String subject,Filter f) {
        int buyer=actor(subject,"BUYER");
        long total=orders.countBuyer(buyer,f);
        return page(orders.buyerOrders(buyer,orders.buyerIds(buyer,f)),f,total);
    }
    @Transactional(readOnly=true)
    public OrderView buyerOrder(String subject,int id) {
        int buyer=actor(subject,"BUYER");
        var order=orders.buyerOrder(buyer,id);
        if(order==null) throw new ResponseStatusException(NOT_FOUND,"Không tìm thấy đơn hàng thuộc tài khoản này");
        return order;
    }
    @Transactional(readOnly=true)
    public Page<ShopOrderView> sellerOrders(String subject,Filter f) {
        int seller=actor(subject,"SELLER");
        long total=orders.countSeller(seller,f);
        return page(orders.sellerShops(seller,orders.sellerIds(seller,f)),f,total);
    }
    @Transactional(readOnly=true)
    public ShopOrderView sellerOrder(String subject,int id) {
        int seller=actor(subject,"SELLER");
        var order=orders.sellerShop(seller,id);
        if(order==null) throw new ResponseStatusException(NOT_FOUND,"Không tìm thấy đơn shop thuộc tài khoản này");
        return order;
    }
    @Transactional(rollbackFor=Exception.class)
    public ShopOrderView updateSellerStatus(String subject,int shop,StatusRequest request) {
        int seller=actor(subject,"SELLER");
        if(request==null) throw OrderRules.bad("Thiếu dữ liệu trạng thái");
        String expected=OrderRules.text(request.expectedStatus(),50,"Trạng thái hiện tại");
        String next=OrderRules.text(request.newStatus(),50,"Trạng thái mới");
        int parent=orders.lockOwnedShop(seller,shop,true);
        var current=orders.sellerShop(seller,shop);
        if("CANCELLED".equals(next)) return cancelLocked(seller,shop,parent,expected,true,current);
        if(!current.status().equals(expected))
            throw OrderRules.conflict("Đơn hàng vừa thay đổi trạng thái. Vui lòng tải lại");
        if(!current.allowedTransitions().contains(next))
            throw OrderRules.conflict("Không được chuyển từ "+current.status()+" sang "+next);
        String tracking=null;
        if("SHIPPING".equals(next)) {
            tracking=OrderRules.text(request.trackingNumber(),100,"Mã vận đơn");
            if(!tracking.matches("[A-Za-z0-9._/-]{1,100}"))
                throw OrderRules.bad("Mã vận đơn chỉ gồm chữ không dấu, số và các dấu . _ / -");
        }
        if(orders.updateStatus(seller,shop,expected,next,tracking)!=1)
            throw OrderRules.conflict("Đơn hàng vừa được cập nhật. Vui lòng tải lại");
        return orders.sellerShop(seller,shop);
    }
    @Transactional(rollbackFor=Exception.class)
    public ShopOrderView cancelBuyerShop(String subject,int shop,CancelRequest request) {
        int buyer=actor(subject,"BUYER");
        if(request==null) throw OrderRules.bad("Thiếu trạng thái đơn hàng");
        String expected=OrderRules.text(request.expectedStatus(),50,"Trạng thái hiện tại");
        int parent=orders.lockOwnedShop(buyer,shop,false);
        return cancelLocked(buyer,shop,parent,expected,false,orders.buyerShop(buyer,shop));
    }
    @Transactional(rollbackFor=Exception.class)
    public ShopOrderView confirmBuyerReceipt(String subject,int shop,ConfirmReceiptRequest request) {
        int buyer=actor(subject,"BUYER");
        if(request==null || !"DELIVERED".equals(request.expectedStatus()))
            throw OrderRules.bad("Chỉ có thể xác nhận nhận hàng với đơn đã giao");
        orders.lockOwnedShop(buyer,shop,false);
        var current=orders.buyerShop(buyer,shop);
        if(!current.status().equals(request.expectedStatus()))
            throw OrderRules.conflict("Đơn chưa ở trạng thái đã giao. Vui lòng tải lại");
        if(current.buyerReceivedAt()!=null) return current;
        if(orders.confirmReceipt(buyer,shop,request.expectedStatus())!=1)
            throw OrderRules.conflict("Đơn vừa được cập nhật. Vui lòng tải lại");
        return orders.buyerShop(buyer,shop);
    }
    private ShopOrderView cancelLocked(int actor,int shop,int parent,String expected,boolean seller,ShopOrderView current) {
        // A repeated cancellation returns the current state without another stock restoration.
        if("CANCELLED".equals(current.status())) return current;
        if(!Set.of("PENDING","CONFIRMED").contains(expected) || !current.status().equals(expected))
            throw OrderRules.conflict("Đơn hàng vừa thay đổi hoặc đã qua thời điểm được hủy");
        if(!OrderRules.canCancel(current.status(),current.stockDeducted(),current.payment()))
            throw OrderRules.conflict("Chỉ hỗ trợ hủy đơn COD chưa thu tiền và có ghi nhận trừ kho");
        if(orders.cancel(actor,shop,expected,seller)!=1)
            throw OrderRules.conflict("Đơn hàng vừa được xử lý. Vui lòng tải lại");
        for(var item:current.items().stream().sorted(Comparator.comparingInt(LineItem::variantId)).toList())
            orders.restore(item.variantId(),item.quantity());
        orders.cancelCodPaymentIfEmpty(parent);
        return seller?orders.sellerShop(actor,shop):orders.buyerShop(actor,shop);
    }
}
