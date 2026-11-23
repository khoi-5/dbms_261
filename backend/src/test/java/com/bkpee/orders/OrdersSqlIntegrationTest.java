package com.bkpee.orders;

import com.bkpee.auth.AccountAuthService;
import com.bkpee.buyer.BuyerCartService;
import com.bkpee.security.JwtService;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.*;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static com.bkpee.orders.OrderModels.*;

@EnabledIfEnvironmentVariable(named="RUN_SQL_INTEGRATION",matches="true")
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={
        "ORDERS_DEMO_PAYMENTS_ENABLED=true",
        "app.jwt.secret=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
        "logging.level.root=WARN"
})
@Import(OrdersSqlIntegrationTest.FailureConfig.class)
class OrdersSqlIntegrationTest {
    @Autowired JdbcTemplate db;
    @Autowired AccountAuthService auth;
    @Autowired BuyerCartService cart;
    @Autowired CheckoutService checkout;
    @Autowired OrderService orders;
    @Autowired OrderJdbcRepository repository;
    @Autowired JwtService tokens;
    @Autowired TestCheckpoint checkpoint;
    @LocalServerPort int port;
    private AccountAuthService.Session buyerA,buyerB,seller;
    private int category,provider,normal,last;
    private String suffix;

    static class TestCheckpoint extends CheckoutCheckpoint {
        final AtomicReference<String> failAt=new AtomicReference<>();
        private void check(String phase) {
            if(failAt.compareAndSet(phase,null)) throw new IllegalStateException("Injected SQL transaction failure: "+phase);
        }
        @Override public void beforePayment() { check("payment"); }
        @Override public void beforeCommit() { check("commit"); }
    }
    @TestConfiguration(proxyBeanMethods=false)
    static class FailureConfig {
        @Bean @Primary TestCheckpoint testCheckpoint() { return new TestCheckpoint(); }
    }
    @BeforeEach void fixture() {
        String name=db.queryForObject("SELECT DB_NAME()",String.class);
        assertTrue(name!=null && name.startsWith("BKPEE_TEST_"),"Write tests require a dedicated BKPEE_TEST_ database");
        repository.requireSchema();
        checkpoint.failAt.set(null);
        suffix=UUID.randomUUID().toString().replace("-","").substring(0,12);
        buyerA=account(false,"a"); buyerB=account(false,"b"); seller=account(true,"s");
        category=insert("INSERT INTO Category(Category_Name) VALUES (?)","Category_ID","F11 QA "+suffix);
        provider=insert("INSERT INTO Shipping_Provider(Provider_Name,Phone,Base_Shipping_Fee) VALUES (?,?,?)",
                "Provider_ID","F11 QA "+suffix,"0909000456",new BigDecimal("22000.00"));
        normal=product(seller.account().id(),"Normal",new BigDecimal("100000.00"),5);
        last=product(seller.account().id(),"Last",new BigDecimal("150000.00"),1);
    }
    private AccountAuthService.Session account(boolean isSeller,String tag) {
        String unique=suffix+tag;
        String digits=Long.toString(100000000000L+new java.security.SecureRandom().nextLong(900000000000L));
        String user="of_"+unique,email=user+"@example.invalid",password=UUID.randomUUID().toString();
        return isSeller ? auth.provisionSeller(user,email,password,"QA","Orders","07"+digits,digits,
                "Orders QA "+unique,"QA Bank","QA Account","9704"+digits,null)
                : auth.register(user,email,password,"QA","Orders","07"+digits,digits);
    }
    private int insert(String sql,String column,Object...args) {
        var key=new GeneratedKeyHolder();
        db.update(c->{
            var s=c.prepareStatement(sql,new String[]{column});
            for(int i=0;i<args.length;i++) s.setObject(i+1,args[i]);
            return s;
        },key);
        return Objects.requireNonNull(key.getKey()).intValue();
    }
    private int product(int sellerId,String label,BigDecimal price,int stock) {
        int product=insert("INSERT INTO Product(Seller_ID,Category_ID,Product_Name) VALUES (?,?,?)",
                "Product_ID",sellerId,category,"Orders QA "+label+" "+suffix);
        return insert("INSERT INTO Product_Variant(Product_ID,Variant_Name,Price,Quantity_Stock) VALUES (?,?,?,?)",
                "Variant_ID",product,label+" variant",price,stock);
    }
    private String subject(AccountAuthService.Session user) { return Integer.toString(user.account().id()); }
    private void add(AccountAuthService.Session user,int variant,int quantity) { cart.put(subject(user),variant,quantity,true); }
    private CheckoutRequest request(AccountAuthService.Session user,String method,String key) {
        var preview=checkout.preview(subject(user),provider);
        return new CheckoutRequest(key,preview.quoteFingerprint(),"QA Receiver","0909000456","QA Address",provider,method);
    }
    private CheckoutRequest request(AccountAuthService.Session user,String method) {
        return request(user,method,UUID.randomUUID().toString());
    }
    private int stock(int variant) { return db.queryForObject("SELECT Quantity_Stock FROM Product_Variant WHERE Variant_ID=?",Integer.class,variant); }
    private long countKey(AccountAuthService.Session user,String key) {
        return db.queryForObject("SELECT COUNT_BIG(*) FROM [Order] WHERE Buyer_ID=? AND Checkout_Key=?",Long.class,user.account().id(),key);
    }
    private int resultStatus(Callable<?> task) throws Exception {
        try { task.call(); return 200; } catch(ResponseStatusException e) { return e.getStatusCode().value(); }
    }
    private <T> List<T> parallel(Callable<T> a,Callable<T> b) throws Exception {
        var start=new CountDownLatch(1);
        try(var pool=Executors.newFixedThreadPool(2)) {
            var first=pool.submit(()->{ start.await(); return a.call(); });
            var second=pool.submit(()->{ start.await(); return b.call(); });
            start.countDown();
            return List.of(first.get(30,TimeUnit.SECONDS),second.get(30,TimeUnit.SECONDS));
        }
    }
    private void status(int expected,ExecutableRequest action) {
        var error=assertThrows(ResponseStatusException.class,action::run);
        assertEquals(expected,error.getStatusCode().value());
    }
    @FunctionalInterface interface ExecutableRequest { void run(); }

    @Test void multiShopCheckoutCommitsAndHistoryKeepsPurchaseSnapshot() {
        var otherSeller=account(true,"s2");
        int other=product(otherSeller.account().id(),"Other",new BigDecimal("50000.00"),7);
        add(buyerA,normal,2); add(buyerA,other,1);
        var result=checkout.checkout(subject(buyerA),request(buyerA,"COD"));
        int id=result.order().id();
        assertFalse(result.replayed());
        assertEquals(2,result.order().shops().size());
        assertEquals(new BigDecimal("294000.00"),result.order().originalTotal());
        assertEquals(3,stock(normal)); assertEquals(6,stock(other));
        assertTrue(cart.get(subject(buyerA)).items().isEmpty());
        db.update("UPDATE Product_Variant SET Price=200000.00,Variant_Name=N'Renamed' WHERE Variant_ID=?",normal);
        db.update("UPDATE Product SET Product_Name=N'Changed after purchase' WHERE Product_ID=(SELECT Product_ID FROM Product_Variant WHERE Variant_ID=?)",normal);
        var history=orders.buyerOrder(subject(buyerA),id);
        var item=history.shops().stream().flatMap(s->s.items().stream()).filter(i->i.variantId()==normal).findFirst().orElseThrow();
        assertEquals(new BigDecimal("100000.00"),item.purchasePrice());
        assertTrue(item.name().contains("Normal"));
        assertEquals("Normal variant",item.variantName());
        assertEquals("PENDING",history.payment().status());
        status(404,()->orders.buyerOrder(subject(buyerB),id));
        int ownShop=history.shops().stream().filter(s->s.sellerId()==seller.account().id()).findFirst().orElseThrow().id();
        var sellerDetail=orders.sellerOrder(subject(seller),ownShop);
        assertEquals(1,sellerDetail.items().size());
        assertEquals(buyerA.account().id(),sellerDetail.buyerId());
        assertEquals(buyerA.account().username(),sellerDetail.buyerUsername());
        assertEquals("QA Receiver",sellerDetail.receiverName());
        status(404,()->orders.sellerOrder(subject(otherSeller),ownShop));
    }
    @Test void paymentFailureRollsBackOrderItemsInventoryAndCart() {
        rollbackAt("payment");
    }
    @Test void failureAfterCartDeletionAlsoRollsBackPaymentAndCart() {
        rollbackAt("commit");
    }
    private void rollbackAt(String phase) {
        add(buyerA,normal,2);
        var request=request(buyerA,"COD");
        checkpoint.failAt.set(phase);
        assertThrows(IllegalStateException.class,()->checkout.checkout(subject(buyerA),request));
        assertEquals(5,stock(normal));
        assertEquals(0,countKey(buyerA,request.requestKey()));
        var restored=cart.get(subject(buyerA));
        assertEquals(2,restored.totalQuantity());
        assertEquals(2,restored.items().getFirst().quantity());
        // A new transaction can retry the same key after the failed transaction rolled back.
        assertNotNull(checkout.checkout(subject(buyerA),request).order());
    }
    @Test void lastUnitHasExactlyOneWinnerOnIndependentTransactions() throws Exception {
        add(buyerA,last,1); add(buyerB,last,1);
        var a=request(buyerA,"COD"); var b=request(buyerB,"COD");
        var codes=parallel(
                ()->resultStatus(()->checkout.checkout(subject(buyerA),a)),
                ()->resultStatus(()->checkout.checkout(subject(buyerB),b)));
        assertEquals(1,Collections.frequency(codes,200));
        assertEquals(1,Collections.frequency(codes,409));
        assertEquals(0,stock(last));
        assertEquals(1,countKey(buyerA,a.requestKey())+countKey(buyerB,b.requestKey()));
        assertEquals(1,cart.get(subject(buyerA)).totalQuantity()+cart.get(subject(buyerB)).totalQuantity());
    }
    @Test void simultaneousDuplicateRequestCreatesOneOrderAndOnePayment() throws Exception {
        add(buyerA,normal,2);
        var request=request(buyerA,"COD");
        var results=parallel(()->checkout.checkout(subject(buyerA),request),()->checkout.checkout(subject(buyerA),request));
        assertEquals(results.getFirst().order().id(),results.getLast().order().id());
        assertNotEquals(results.getFirst().replayed(),results.getLast().replayed());
        assertEquals(1,countKey(buyerA,request.requestKey()));
        assertEquals(3,stock(normal));
        assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM Payment_Information WHERE Order_ID=?",Integer.class,results.getFirst().order().id()));
        var changed=new CheckoutRequest(request.requestKey(),request.quoteFingerprint(),"Other Receiver",request.receiverPhone(),
                request.deliveryAddress(),request.providerId(),request.paymentMethod());
        status(409,()->checkout.checkout(subject(buyerA),changed));
    }
    @Test void staleQuoteCannotSilentlyChargeANewPrice() {
        add(buyerA,normal,2);
        var request=request(buyerA,"COD");
        db.update("UPDATE Product_Variant SET Price=150000.00 WHERE Variant_ID=?",normal);
        status(409,()->checkout.checkout(subject(buyerA),request));
        assertEquals(0,countKey(buyerA,request.requestKey()));
        assertEquals(5,stock(normal));
        assertEquals(2,cart.get(subject(buyerA)).totalQuantity());
    }
    @Test void simultaneousBuyerSellerCancellationRestoresStockExactlyOnce() throws Exception {
        add(buyerA,normal,2);
        var order=checkout.checkout(subject(buyerA),request(buyerA,"COD")).order();
        int shop=order.shops().getFirst().id();
        var results=parallel(
                ()->orders.cancelBuyerShop(subject(buyerA),shop,new CancelRequest("PENDING")),
                ()->orders.updateSellerStatus(subject(seller),shop,new StatusRequest("PENDING","CANCELLED",null)));
        assertTrue(results.stream().allMatch(s->s.status().equals("CANCELLED")));
        assertEquals(5,stock(normal));
        var current=orders.buyerOrder(subject(buyerA),order.id());
        assertEquals(0,current.payableTotal().signum());
        assertEquals("CANCELLED",current.payment().status());
        assertFalse(current.shops().getFirst().stockDeducted());
    }
    @Test void statusRaceDoesNotOverwriteAConcurrentTransition() throws Exception {
        add(buyerA,normal,2);
        int shop=checkout.checkout(subject(buyerA),request(buyerA,"COD")).order().shops().getFirst().id();
        var codes=parallel(
                ()->resultStatus(()->orders.updateSellerStatus(subject(seller),shop,new StatusRequest("PENDING","CONFIRMED",null))),
                ()->resultStatus(()->orders.updateSellerStatus(subject(seller),shop,new StatusRequest("PENDING","CANCELLED",null))));
        assertEquals(1,Collections.frequency(codes,200)); assertEquals(1,Collections.frequency(codes,409));
        var current=orders.sellerOrder(subject(seller),shop);
        assertEquals(current.status().equals("CANCELLED")?5:3,stock(normal));
    }
    @Test void demoPaymentIsExplicitAndCannotPretendToRefundOnCancellation() {
        add(buyerA,normal,1);
        var order=checkout.checkout(subject(buyerA),request(buyerA,"DEMO")).order();
        assertEquals("COMPLETED",order.payment().status());
        assertTrue(order.payment().simulated());
        assertNotNull(order.payment().paidAt());
        status(409,()->orders.cancelBuyerShop(subject(buyerA),order.shops().getFirst().id(),new CancelRequest("PENDING")));
        assertEquals(4,stock(normal));
    }
    private void deliver(AccountAuthService.Session owner,int shop) {
        orders.updateSellerStatus(subject(owner),shop,new StatusRequest("PENDING","CONFIRMED",null));
        orders.updateSellerStatus(subject(owner),shop,new StatusRequest("CONFIRMED","SHIPPING","QA-"+suffix+"-"+shop));
        orders.updateSellerStatus(subject(owner),shop,new StatusRequest("SHIPPING","DELIVERED",null));
    }
    @Test void receiptRequiresOwnerAndDeliveredStatusAndCanBeReplayed() {
        add(buyerA,normal,1);
        var order=checkout.checkout(subject(buyerA),request(buyerA,"COD")).order();
        int shop=order.shops().getFirst().id();
        var confirmation=new ConfirmReceiptRequest("DELIVERED");
        status(404,()->orders.confirmBuyerReceipt(subject(buyerB),shop,confirmation));
        status(409,()->orders.confirmBuyerReceipt(subject(buyerA),shop,confirmation));
        deliver(seller,shop);
        assertTrue(orders.buyerOrder(subject(buyerA),order.id()).shops().getFirst().buyerCanConfirmReceipt());
        var first=orders.confirmBuyerReceipt(subject(buyerA),shop,confirmation);
        var second=orders.confirmBuyerReceipt(subject(buyerA),shop,confirmation);
        assertNotNull(first.buyerReceivedAt());
        assertEquals(first.buyerReceivedAt(),second.buyerReceivedAt());
        assertEquals(first.buyerReceivedAt(),orders.sellerOrder(subject(seller),shop).buyerReceivedAt());
        assertEquals("DELIVERED",second.status());
        assertEquals(order.payment(),second.payment());
        assertEquals(order.payableTotal(),second.payableTotal());
        assertEquals(4,stock(normal));
        assertFalse(second.buyerCanConfirmReceipt());
    }
    @Test void concurrentReceiptRequestsWriteOneTimestamp() throws Exception {
        add(buyerA,normal,1);
        int shop=checkout.checkout(subject(buyerA),request(buyerA,"DEMO")).order().shops().getFirst().id();
        deliver(seller,shop);
        var confirmation=new ConfirmReceiptRequest("DELIVERED");
        var results=parallel(()->orders.confirmBuyerReceipt(subject(buyerA),shop,confirmation),
                ()->orders.confirmBuyerReceipt(subject(buyerA),shop,confirmation));
        assertNotNull(results.getFirst().buyerReceivedAt());
        assertEquals(results.getFirst().buyerReceivedAt(),results.getLast().buyerReceivedAt());
        assertTrue(results.getLast().payment().simulated());
        assertEquals("COMPLETED",results.getLast().payment().status());
        assertEquals(4,stock(normal));
    }
    @Test void receivingOneShopDoesNotConfirmAnotherShop() {
        var otherSeller=account(true,"s2");
        int other=product(otherSeller.account().id(),"Other",new BigDecimal("50000.00"),7);
        add(buyerA,normal,1); add(buyerA,other,1);
        var order=checkout.checkout(subject(buyerA),request(buyerA,"COD")).order();
        var first=order.shops().stream().filter(shop->shop.sellerId()==seller.account().id()).findFirst().orElseThrow();
        var second=order.shops().stream().filter(shop->shop.sellerId()==otherSeller.account().id()).findFirst().orElseThrow();
        deliver(seller,first.id()); deliver(otherSeller,second.id());
        orders.confirmBuyerReceipt(subject(buyerA),first.id(),new ConfirmReceiptRequest("DELIVERED"));
        var unconfirmed=orders.sellerOrder(subject(otherSeller),second.id());
        assertNull(unconfirmed.buyerReceivedAt());
        assertTrue(unconfirmed.buyerCanConfirmReceipt());
    }
    @Test void sellerCompositeFilterAndBuyerPaginationCountOrdersNotLines() {
        add(buyerA,normal,1); add(buyerA,last,1);
        var order=checkout.checkout(subject(buyerA),request(buyerA,"COD")).order();
        LocalDate day=order.orderedAt().toLocalDate();
        var sellerPage=orders.sellerOrders(subject(seller),OrderRules.filter("PENDING",day,day,0,10));
        assertEquals(1,sellerPage.totalElements());
        assertEquals(2,sellerPage.items().getFirst().items().size());
        assertEquals(0,orders.sellerOrders(subject(seller),OrderRules.filter("SHIPPING",day,day,0,10)).totalElements());
        assertEquals(0,orders.sellerOrders(subject(seller),OrderRules.filter("",day.plusDays(1),day.plusDays(1),0,10)).totalElements());
        var buyerPage=orders.buyerOrders(subject(buyerA),OrderRules.filter("",null,null,0,1));
        assertEquals(1,buyerPage.totalElements()); assertEquals(1,buyerPage.items().size());
        assertEquals(2,buyerPage.items().getFirst().shops().getFirst().items().size());
    }
    private int httpStatus(String path,String token,String method,String body) throws Exception {
        var builder=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api"+path));
        if(token!=null) builder.header("Authorization","Bearer "+token);
        if(body!=null) builder.header("Content-Type","application/json");
        builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body));
        return HttpClient.newHttpClient().send(builder.build(),HttpResponse.BodyHandlers.discarding()).statusCode();
    }
    @Test void httpRoutesEnforceRolesAndValidateCheckoutPayload() throws Exception {
        assertEquals(401,httpStatus("/buyer/checkout/options",null,"GET",null));
        assertEquals(200,httpStatus("/buyer/checkout/options",seller.token(),"GET",null));
        assertEquals(403,httpStatus("/buyer/checkout/options",tokens.generateToken(subject(seller),"SELLER"),"GET",null));
        assertEquals(403,httpStatus("/seller/orders",buyerA.token(),"GET",null));
        assertEquals(403,httpStatus("/seller/orders",tokens.generateToken(subject(buyerA),"SELLER"),"GET",null));
        assertEquals(400,httpStatus("/buyer/checkout",buyerA.token(),"POST","{}"));
        assertEquals(200,httpStatus("/buyer/orders",buyerA.token(),"GET",null));
        add(buyerA,normal,1);
        int shop=checkout.checkout(subject(buyerA),request(buyerA,"COD")).order().shops().getFirst().id();
        String receiptPath="/buyer/shop-orders/"+shop+"/confirm-received";
        String receiptBody="{\"expectedStatus\":\"DELIVERED\"}";
        assertEquals(400,httpStatus(receiptPath,buyerA.token(),"POST","{}"));
        assertEquals(404,httpStatus(receiptPath,buyerB.token(),"POST",receiptBody));
        assertEquals(409,httpStatus(receiptPath,buyerA.token(),"POST",receiptBody));
        deliver(seller,shop);
        assertEquals(200,httpStatus(receiptPath,buyerA.token(),"POST",receiptBody));
    }
}
