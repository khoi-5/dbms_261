package com.bkpee.orders;

import com.bkpee.auth.AccountAuthService;
import com.bkpee.promotion.PromotionService;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;
import static com.bkpee.orders.OrderModels.*;

@Service
public class CheckoutService {
    private final OrderJdbcRepository orders;
    private final AccountAuthService auth;
    private final PaymentService payments;
    private final PromotionService promotions;
    private final CheckoutCheckpoint checkpoint;
    public CheckoutService(OrderJdbcRepository orders,AccountAuthService auth,
                           PaymentService payments,PromotionService promotions,CheckoutCheckpoint checkpoint) {
        this.orders=orders; this.auth=auth; this.payments=payments; this.promotions=promotions; this.checkpoint=checkpoint;
    }
    private int buyer(String subject) {
        var user=auth.current(subject);
        if(!user.roles().contains("BUYER")) throw new ResponseStatusException(FORBIDDEN,"Chỉ Buyer được đặt hàng");
        orders.requireSchema();
        return user.id();
    }
    @Transactional(readOnly=true)
    public CheckoutOptions options(String subject) {
        int buyer=buyer(subject);
        return new CheckoutOptions(orders.receiver(buyer),orders.providers(),payments.methods());
    }
    @Transactional(readOnly=true)
    public CheckoutPreview preview(String subject,int providerId) {
        return preview(subject,providerId,null);
    }
    @Transactional(readOnly=true)
    public CheckoutPreview preview(String subject,int providerId,Integer promotionId) {
        int buyer=buyer(subject);
        var provider=orders.provider(providerId,false);
        var lines=orders.cartLines(buyer);
        BigDecimal subtotal=OrderRules.itemsTotal(lines);
        int shops=OrderRules.shopCount(lines);
        BigDecimal shipping=OrderRules.money(provider.fee().multiply(BigDecimal.valueOf(shops)));
        var promotion=previewPromotion(buyer,promotionId,lines);
        BigDecimal discount=promotion==null?BigDecimal.ZERO:promotion.discountAmount();
        var items=lines.stream().map(l->new PreviewItem(l.variantId(),l.name(),l.variantName(),l.shop(),l.image(),
                l.price(),l.stock(),l.quantity(),l.subtotal(),l.available())).toList();
        return new CheckoutPreview(items,subtotal,shipping,promotionId,discount,
                OrderRules.money(subtotal.subtract(discount).add(shipping)),
                shops,OrderRules.quote(buyer,provider,lines,promotion),!lines.isEmpty() && lines.stream().allMatch(CartLine::available));
    }
    private Map<Integer,BigDecimal> sellerSubtotals(List<CartLine> lines,int seller) {
        return lines.stream().filter(line->line.sellerId()==seller)
                .collect(Collectors.toMap(CartLine::variantId,CartLine::subtotal));
    }
    private AppliedPromotion previewPromotion(int buyer,Integer promotionId,List<CartLine> lines) {
        if(promotionId==null) return null;
        if(promotionId<1) throw OrderRules.bad("Mã khuyến mãi không hợp lệ");
        int seller=orders.promotionSeller(promotionId);
        var offer=promotions.previewDiscountForBuyer(buyer,promotionId);
        if(!offer.eligible()) throw OrderRules.conflict(offer.reason());
        var subtotals=sellerSubtotals(lines,seller);
        if(!subtotals.keySet().containsAll(offer.matchedVariantIds()))
            throw OrderRules.conflict("Ưu đãi không khớp sản phẩm của shop trong giỏ hàng");
        var eligible=offer.matchedVariantIds().stream().map(subtotals::get).reduce(BigDecimal.ZERO,BigDecimal::add);
        if(eligible.compareTo(offer.eligibleSubtotal())!=0)
            throw OrderRules.conflict("Giỏ hàng đã thay đổi. Vui lòng tải lại tổng tiền");
        return appliedPromotion(promotionId,seller,offer.discountAmount());
    }
    private AppliedPromotion consumePromotion(Integer promotionId,List<CartLine> lines) {
        if(promotionId==null) return null;
        int seller=orders.promotionSeller(promotionId);
        var result=promotions.validateAndConsumeForCheckout(promotionId,sellerSubtotals(lines,seller));
        return appliedPromotion(promotionId,seller,result.discountAmount());
    }
    private AppliedPromotion appliedPromotion(int id,int seller,BigDecimal discount) {
        if(discount.signum()<=0) throw OrderRules.conflict("Ưu đãi không giảm giá cho đơn này");
        return new AppliedPromotion(id,seller,OrderRules.money(discount));
    }
    @Transactional(readOnly=true)
    public OrderView lookup(String subject,String key) {
        int buyer=buyer(subject);
        if(key==null || !key.matches("[A-Za-z0-9_-]{8,64}")) throw OrderRules.bad("Khóa yêu cầu không hợp lệ");
        var stored=orders.storedCheckout(buyer,key);
        if(stored==null) throw new ResponseStatusException(NOT_FOUND,"Chưa tìm thấy đơn cho yêu cầu này");
        return orders.buyerOrder(buyer,stored.orderId());
    }

    @Transactional(rollbackFor=Exception.class)
    public CheckoutResult checkout(String subject,CheckoutRequest input) {
        int buyer=buyer(subject);
        CheckoutRequest r=OrderRules.normalize(input);
        byte[] hash=OrderRules.requestHash(r);

        // Same protocol as the existing BuyerCartService: all writes for one Buyer serialize.
        orders.lockBuyer(buyer);
        var existing=orders.storedCheckout(buyer,r.requestKey());
        if(existing!=null) {
            if(existing.requestHash()==null || !MessageDigest.isEqual(hash,existing.requestHash()))
                throw OrderRules.conflict("Khóa yêu cầu đã được dùng với thông tin đặt hàng khác");
            return new CheckoutResult(orders.buyerOrder(buyer,existing.orderId()),true);
        }
        payments.validateMethod(r.paymentMethod());
        Integer cartId=orders.cartId(buyer);
        var wanted=orders.cartLines(buyer);
        if(cartId==null || wanted.isEmpty()) throw OrderRules.conflict("Giỏ hàng đang trống");

        // Lock one variant at a time in a stable order; retain current prices until commit.
        var locked=new ArrayList<CartLine>();
        for(var line:wanted.stream().sorted(Comparator.comparingInt(CartLine::variantId)).toList()) {
            var current=orders.lockVariant(line.variantId(),line.quantity());
            if(!current.available())
                throw OrderRules.conflict("Sản phẩm "+current.name()+" không còn bán hoặc không đủ tồn kho");
            locked.add(current);
        }
        ShippingProvider provider=orders.provider(r.providerId(),true);
        var promotion=consumePromotion(r.promotionId(),locked);
        if(!OrderRules.quote(buyer,provider,locked,promotion).equals(r.quoteFingerprint()))
            throw OrderRules.conflict("Giỏ hàng, giá, phí vận chuyển hoặc khuyến mãi đã thay đổi. Vui lòng tải lại và xác nhận lại");

        BigDecimal subtotal=OrderRules.itemsTotal(locked);
        BigDecimal shipping=OrderRules.money(provider.fee().multiply(BigDecimal.valueOf(OrderRules.shopCount(locked))));
        BigDecimal discount=promotion==null?BigDecimal.ZERO:promotion.discountAmount();
        BigDecimal total=OrderRules.money(subtotal.subtract(discount).add(shipping));
        int order=orders.insertOrder(buyer,r,total,hash);
        var shopIds=new LinkedHashMap<Integer,Integer>();
        for(var line:locked) {
            int shop=shopIds.computeIfAbsent(line.sellerId(),seller->orders.insertShop(order,seller,provider,
                    promotion!=null && promotion.sellerId()==seller?promotion:null));
            orders.insertItem(shop,line);
            orders.deduct(line.variantId(),line.quantity());
        }
        for(int shop:shopIds.values()) orders.markDeducted(shop);
        checkpoint.beforePayment();
        payments.createForOrder(order,r.paymentMethod());
        orders.clearCart(cartId);
        checkpoint.beforeCommit();
        return new CheckoutResult(orders.buyerOrder(buyer,order),false);
    }
}
