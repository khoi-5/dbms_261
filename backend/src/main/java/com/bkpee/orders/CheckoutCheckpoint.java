package com.bkpee.orders;

import org.springframework.stereotype.Component;

@Component
public class CheckoutCheckpoint {
    public void beforePayment() {}
    public void beforeCommit() {}
}
