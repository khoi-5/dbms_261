package com.bkpee.security;

import java.util.Base64;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SecurityFilterChainTest {
    private AnnotationConfigWebApplicationContext context;
    private FilterChainProxy filters;
    private JwtService tokens;

    @Configuration(proxyBeanMethods = false)
    @EnableWebSecurity
    @Import({SecurityConfig.class, JwtConfig.class, JwtService.class})
    static class SecurityOnlyConfiguration { }

    @BeforeEach
    void startSecurityWithoutDatabase() {
        byte[] key = new byte[32];
        new java.security.SecureRandom().nextBytes(key);
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("test", Map.of(
            "app.jwt.secret", Base64.getEncoder().encodeToString(key),
            "app.jwt.expiration-minutes", "120",
            "app.cors.allowed-origins", "http://localhost:5173,http://127.0.0.1:5173")));
        context.register(SecurityOnlyConfiguration.class);
        context.refresh();
        filters = context.getBean(FilterChainProxy.class);
        tokens = context.getBean(JwtService.class);
    }

    @AfterEach
    void closeContext() {
        if (context != null) context.close();
    }

    @Test
    void enforcesAuthenticationAndBuyerSellerRoles() throws Exception {
        assertEquals(204, request("/api/health", null).getStatus());
        assertEquals(401, request("/api/seller/products", null).getStatus());
        String buyer = tokens.generateToken("42", "BUYER");
        String seller = tokens.generateToken("43", "SELLER");
        assertEquals(403, request("/api/seller/products", buyer).getStatus());
        assertEquals(204, request("/api/buyer/orders", buyer).getStatus());
        assertEquals(204, request("/api/seller/products", seller).getStatus());
        assertEquals(403, request("/api/buyer/orders", seller).getStatus());
        assertEquals(401, request("/api/seller/products", "invalid-token").getStatus());
    }

    @Test
    void allowsVitePreflightAndRejectsOtherOrigins() throws Exception {
        for (String origin : new String[]{"http://localhost:5173", "http://127.0.0.1:5173"}) {
            MockHttpServletResponse response = preflight(origin);
            assertEquals(200, response.getStatus());
            assertEquals(origin, response.getHeader("Access-Control-Allow-Origin"));
        }
        assertEquals(403, preflight("https://untrusted.example").getStatus());
    }

    private MockHttpServletResponse request(String path, String token) throws Exception {
        var request = new MockHttpServletRequest("GET", path);
        request.setServletPath(path);
        if (token != null) request.addHeader("Authorization", "Bearer " + token);
        var response = new MockHttpServletResponse();
        // A terminal stub, not a business controller or a database connection.
        filters.doFilter(request, response, (req, res) -> response.setStatus(204));
        return response;
    }

    private MockHttpServletResponse preflight(String origin) throws Exception {
        var request = new MockHttpServletRequest("OPTIONS", "/api/seller/products");
        request.setServletPath("/api/seller/products");
        request.addHeader("Origin", origin);
        request.addHeader("Access-Control-Request-Method", "POST");
        request.addHeader("Access-Control-Request-Headers", "authorization,content-type");
        var response = new MockHttpServletResponse();
        filters.doFilter(request, response, (req, res) -> response.setStatus(204));
        return response;
    }
}
