package com.bkpee.orders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static com.bkpee.orders.OrderModels.*;

class OrderRulesTest {
    private CartLine line(int variant,int seller,String price,int stock,int quantity) {
        return line(variant,seller,price,stock,quantity,null);
    }
    private CartLine line(int variant,int seller,String price,int stock,int quantity,String variantName) {
        return new CartLine(variant,variant,seller,"Product "+variant,variantName,"Shop "+seller,null,
                new BigDecimal(price),stock,true,"ACTIVE",quantity);
    }
    private final ShippingProvider provider=new ShippingProvider(1,"Demo",new BigDecimal("22000.00"));
    @Test void quoteIsStableAcrossRowOrderAndIncidentalStockChanges() {
        var a=line(1,1,"100000.00",5,2);
        var b=line(2,2,"50000.00",4,1);
        assertEquals(OrderRules.quote(7,provider,List.of(a,b)),OrderRules.quote(7,provider,List.of(b,a)));
        assertEquals(OrderRules.quote(7,provider,List.of(a)),OrderRules.quote(7,provider,List.of(line(1,1,"100000.00",3,2))));
    }
    @Test void quoteDetectsPriceQuantityOwnershipAndShippingChanges() {
        var original=OrderRules.quote(7,provider,List.of(line(1,1,"100000.00",5,2)));
        assertNotEquals(original,OrderRules.quote(7,provider,List.of(line(1,1,"100001.00",5,2))));
        assertNotEquals(original,OrderRules.quote(7,provider,List.of(line(1,1,"100000.00",5,1))));
        assertNotEquals(original,OrderRules.quote(7,provider,List.of(line(1,1,"100000.00",5,2,"Mẫu mới"))));
        assertNotEquals(original,OrderRules.quote(8,provider,List.of(line(1,1,"100000.00",5,2))));
        assertNotEquals(original,OrderRules.quote(7,new ShippingProvider(1,"Demo",new BigDecimal("23000.00")),
                List.of(line(1,1,"100000.00",5,2))));
    }
    @Test void moneyUsesDecimalArithmeticAndRejectsSqlOverflow() {
        assertEquals(new BigDecimal("0.30"),OrderRules.itemsTotal(List.of(line(1,1,"0.10",5,3))));
        assertEquals(2,OrderRules.shopCount(List.of(line(1,1,"1.00",5,1),line(2,1,"1.00",5,1),line(3,2,"1.00",5,1))));
        assertThrows(ResponseStatusException.class,()->OrderRules.money(OrderRules.MAX_MONEY.add(new BigDecimal("0.01"))));
    }
    @Test void cancellationAndTransitionsRespectPaymentAndShipment() {
        var cod=new PaymentView("COD","PENDING",false,null);
        var paid=new PaymentView("DEMO","COMPLETED",true,null);
        assertTrue(OrderRules.canCancel("PENDING",true,cod));
        assertTrue(OrderRules.canCancel("CONFIRMED",true,cod));
        assertFalse(OrderRules.canCancel("SHIPPING",true,cod));
        assertFalse(OrderRules.canCancel("PENDING",false,cod));
        assertFalse(OrderRules.canCancel("PENDING",true,paid));
        assertEquals(List.of("CONFIRMED","CANCELLED"),OrderRules.transitions("PENDING",true,cod));
        assertEquals(List.of("CONFIRMED"),OrderRules.transitions("PENDING",true,paid));
        assertEquals(List.of(),OrderRules.transitions("DELIVERED",true,cod));
    }
    @Test void datesValidateAndIncludeTheWholeEndDate() {
        var date=LocalDate.of(2026,11,16);
        assertEquals(date,OrderRules.filter("PENDING",date,date,0,10).to());
        assertThrows(ResponseStatusException.class,()->OrderRules.filter("",date,date.minusDays(1),0,10));
        assertThrows(ResponseStatusException.class,()->OrderRules.filter("INVALID",null,null,0,10));
        assertThrows(ResponseStatusException.class,()->OrderRules.filter("",null,null,0,51));
    }
    @Test void receiptRequiresDeliveryAndAnEmptyTimestamp() {
        assertTrue(OrderRules.canConfirmReceipt("DELIVERED",null));
        assertFalse(OrderRules.canConfirmReceipt("SHIPPING",null));
        assertFalse(OrderRules.canConfirmReceipt("CANCELLED",null));
        assertFalse(OrderRules.canConfirmReceipt("DELIVERED",LocalDateTime.of(2026,11,22,8,0)));
    }
    @Test void normalizedRequestHashChangesWhenReceiverChanges() {
        String quote="a".repeat(64);
        var a=OrderRules.normalize(new CheckoutRequest("request-0001",quote," Buyer ","0909000123"," Address ",1,"COD"));
        var b=OrderRules.normalize(new CheckoutRequest("request-0001",quote,"Buyer","0909000123","Address",1,"COD"));
        assertArrayEquals(OrderRules.requestHash(a),OrderRules.requestHash(b));
        var changed=new CheckoutRequest("request-0001",quote,"Other","0909000123","Address",1,"COD");
        assertFalse(java.security.MessageDigest.isEqual(OrderRules.requestHash(a),OrderRules.requestHash(changed)));
    }
    @Test void checkoutQuoteAndRequestBindThePromotionAndDiscount() {
        var provider=new ShippingProvider(4,"QA",new BigDecimal("22000.00"));
        var line=new CartLine(7,8,9,"QA product",null,"QA shop",null,
                new BigDecimal("100000.00"),3,true,"ACTIVE",1);
        var items=List.of(line);
        var promotion=new AppliedPromotion(11,9,new BigDecimal("10000.00"));
        String quote=OrderRules.quote(2,provider,items,promotion);
        assertNotEquals(OrderRules.quote(2,provider,items),quote);
        assertNotEquals(quote,OrderRules.quote(2,provider,items,
                new AppliedPromotion(12,9,promotion.discountAmount())));
        assertNotEquals(quote,OrderRules.quote(2,provider,items,
                new AppliedPromotion(11,9,new BigDecimal("20000.00"))));

        var original=new CheckoutRequest("request-0001",quote,"Buyer","0909000123","Address",4,"COD",11);
        var changed=new CheckoutRequest("request-0001",quote,"Buyer","0909000123","Address",4,"COD",12);
        assertEquals(11,OrderRules.normalize(original).promotionId());
        assertFalse(java.security.MessageDigest.isEqual(OrderRules.requestHash(original),OrderRules.requestHash(changed)));
    }
}
