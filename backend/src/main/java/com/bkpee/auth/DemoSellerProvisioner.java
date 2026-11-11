package com.bkpee.auth;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/** Explicit local profile: inserts ONE new Seller, never updates an existing account. */
@Component
@Profile("demo-account")
public class DemoSellerProvisioner implements ApplicationRunner {
    private final AccountAuthService auth;
    private final Environment env;
    private final ConfigurableApplicationContext context;
    public DemoSellerProvisioner(AccountAuthService auth,Environment env,ConfigurableApplicationContext context) {
        this.auth=auth; this.env=env; this.context=context;
    }
    private String required(String name) {
        String value=env.getProperty(name);
        if(value==null || value.isBlank()) throw new IllegalArgumentException("Missing environment variable: "+name);
        return value;
    }
    @Override public void run(ApplicationArguments args) {
        var result=auth.provisionSeller(required("DEMO_USERNAME"),required("DEMO_EMAIL"),required("DEMO_PASSWORD"),
            required("DEMO_FIRST_NAME"),required("DEMO_LAST_NAME"),required("DEMO_PHONE"),required("DEMO_CCCD"),
            required("DEMO_SHOP_NAME"),required("DEMO_BANK_ACCOUNT"));
        System.out.println("Created new demo Seller: "+result.account().username()+". No existing account was changed.");
        context.close();
    }
}
