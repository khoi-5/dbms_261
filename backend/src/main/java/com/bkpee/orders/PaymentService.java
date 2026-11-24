package com.bkpee.orders;

import java.util.ArrayList;
import java.util.List;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.bkpee.orders.OrderModels.PaymentOption;

import static com.bkpee.orders.OrderModels.*;

@Service
public class PaymentService {
    private final OrderJdbcRepository orders;
    private final Environment env;
    public PaymentService(OrderJdbcRepository orders,Environment env) { this.orders=orders; this.env=env; }
    public boolean demoEnabled() {
        return env.getProperty("ORDERS_DEMO_PAYMENTS_ENABLED", Boolean.class, false);
    }
    public List<PaymentOption> methods() {
        var methods=new ArrayList<PaymentOption>();
        methods.add(new PaymentOption("COD","Thanh toán khi nhận hàng",false));
        if(demoEnabled()) methods.add(new PaymentOption("DEMO","Mock Payment (mô phỏng, không thu tiền thật)",true));
        return List.copyOf(methods);
    }
    public void validateMethod(String method) {
        if(!"COD".equals(method) && !("DEMO".equals(method) && demoEnabled()))
            throw OrderRules.bad("Phương thức thanh toán này chưa được bật");
    }
    @Transactional(propagation=Propagation.MANDATORY)
    public void createForOrder(int order,String method) {
        validateMethod(method);
        orders.insertPayment(order,"DEMO".equals(method)?"BANKING":"COD","DEMO".equals(method));
    }
}
