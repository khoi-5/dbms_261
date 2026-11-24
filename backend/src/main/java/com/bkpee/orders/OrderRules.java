package com.bkpee.orders;

import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;
import static com.bkpee.orders.OrderModels.*;

public final class OrderRules {
    private OrderRules() {}
    public static final BigDecimal MAX_MONEY = new BigDecimal("9999999999999999.99");
    private static final Set<String> STATUSES =
            Set.of("PENDING","CONFIRMED","SHIPPING","DELIVERED","CANCELLED","RETURNED");

    public static CheckoutRequest normalize(CheckoutRequest r) {
        if (r == null) throw bad("Thiếu dữ liệu đặt hàng");
        String key = text(r.requestKey(),64,"Khóa yêu cầu");
        String fingerprint = text(r.quoteFingerprint(),64,"Mã giỏ hàng").toLowerCase(Locale.ROOT);
        String receiver = text(r.receiverName(),100,"Tên người nhận");
        String phone = text(r.receiverPhone(),20,"Điện thoại");
        String address = text(r.deliveryAddress(),255,"Địa chỉ");
        String method = text(r.paymentMethod(),10,"Phương thức thanh toán");
        if (!key.matches("[A-Za-z0-9_-]{8,64}") || !fingerprint.matches("[a-f0-9]{64}")
                || !phone.matches("[+0-9]{8,20}") || r.providerId()==null || r.providerId()<1
                || (r.promotionId()!=null && r.promotionId()<1)
                || !Set.of("COD","DEMO").contains(method)) throw bad("Dữ liệu đặt hàng không hợp lệ");
        return new CheckoutRequest(key,fingerprint,receiver,phone,address,r.providerId(),method,r.promotionId());
    }

    public static String text(String value, int max, String label) {
        String s = value==null ? "" : value.strip();
        if (s.isEmpty() || s.length()>max) throw bad(label+" không hợp lệ");
        return s;
    }
    public static Filter filter(String status, LocalDate from, LocalDate to, int page, int size) {
        String s = status==null ? "" : status.strip();
        if ((!s.isEmpty() && !STATUSES.contains(s)) || page<0 || page>100000 || size<1 || size>50
                || invalidDate(from) || invalidDate(to) || (from!=null && to!=null && from.isAfter(to)))
            throw bad("Trạng thái, khoảng ngày hoặc phân trang không hợp lệ");
        return new Filter(s,from,to,page,size);
    }
    private static boolean invalidDate(LocalDate d) { return d!=null && (d.getYear()<1 || d.getYear()>9998); }
    public static BigDecimal money(BigDecimal amount) {
        if (amount==null || amount.signum()<0 || amount.compareTo(MAX_MONEY)>0
                || amount.stripTrailingZeros().scale()>2)
            throw new ResponseStatusException(CONFLICT,"Số tiền vượt giới hạn của đơn hàng");
        return amount.setScale(2);
    }
    public static BigDecimal itemsTotal(List<CartLine> lines) {
        return money(lines.stream().map(CartLine::subtotal).reduce(BigDecimal.ZERO,BigDecimal::add));
    }
    public static int shopCount(List<CartLine> lines) {
        return (int)lines.stream().map(CartLine::sellerId).distinct().count();
    }
    public static String quote(int buyerId, ShippingProvider provider, List<CartLine> lines) {
        return quote(buyerId,provider,lines,null);
    }
    public static String quote(int buyerId, ShippingProvider provider, List<CartLine> lines,
                               AppliedPromotion promotion) {
        var fields = new ArrayList<String>();
        fields.add(Integer.toString(buyerId)); fields.add(Integer.toString(provider.id()));
        fields.add(provider.fee().setScale(2).toPlainString());
        lines.stream().sorted(Comparator.comparingInt(CartLine::variantId)).forEach(line -> {
            fields.add(Integer.toString(line.variantId())); fields.add(Integer.toString(line.productId()));
            fields.add(Integer.toString(line.sellerId())); fields.add(Integer.toString(line.quantity()));
            fields.add(line.price().setScale(2).toPlainString()); fields.add(line.name()); fields.add(line.shop());
            fields.add(Objects.toString(line.variantName(),""));
            fields.add(Boolean.toString(line.active())); fields.add(line.sellerStatus());
        });
        if (promotion!=null) {
            fields.add(Integer.toString(promotion.id()));
            fields.add(Integer.toString(promotion.sellerId()));
            fields.add(promotion.discountAmount().setScale(2).toPlainString());
        }
        return HexFormat.of().formatHex(hash(fields));
    }
    public static byte[] requestHash(CheckoutRequest r) {
        var fields = new ArrayList<>(List.of(r.quoteFingerprint(),r.receiverName(),r.receiverPhone(),
                r.deliveryAddress(),r.providerId().toString(),r.paymentMethod()));
        if (r.promotionId()!=null) fields.add(r.promotionId().toString());
        return hash(fields);
    }
    private static byte[] hash(List<String> fields) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            for (String s:fields) {
                byte[] bytes=s.getBytes(StandardCharsets.UTF_8);
                md.update(ByteBuffer.allocate(4).putInt(bytes.length).array()); md.update(bytes);
            }
            return md.digest();
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    public static boolean canCancel(String status, boolean deducted, PaymentView payment) {
        return deducted && Set.of("PENDING","CONFIRMED").contains(status)
                && "COD".equals(payment.method()) && "PENDING".equals(payment.status());
    }
    public static boolean canConfirmReceipt(String status, LocalDateTime receivedAt) {
        return "DELIVERED".equals(status) && receivedAt==null;
    }
    public static List<String> transitions(String status, boolean deducted, PaymentView payment) {
        var next = new ArrayList<String>();
        switch (status) {
            case "PENDING" -> next.add("CONFIRMED");
            case "CONFIRMED" -> next.add("SHIPPING");
            case "SHIPPING" -> next.add("DELIVERED");
            default -> { }
        }
        if (canCancel(status,deducted,payment)) next.add("CANCELLED");
        return List.copyOf(next);
    }
    public static ResponseStatusException bad(String message) { return new ResponseStatusException(BAD_REQUEST,message); }
    public static ResponseStatusException conflict(String message) { return new ResponseStatusException(CONFLICT,message); }
}
