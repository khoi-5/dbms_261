package com.bkpee.security;

import java.time.Instant;
import java.util.Base64;
import java.util.List;
import javax.crypto.SecretKey;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwsHeader;

import static org.junit.jupiter.api.Assertions.*;

class JwtConfigurationTest {
    private final JwtConfig config = new JwtConfig();
    // Test-only key generated in memory; never used by the application.
    private final SecretKey key = testKey();

    private SecretKey testKey() {
        byte[] bytes = new byte[32];
        new java.security.SecureRandom().nextBytes(bytes);
        return config.jwtSecretKey(Base64.getEncoder().encodeToString(bytes));
    }

    @Test
    void hs256RoundTripMapsBothRoles() {
        var service = new JwtService(config.jwtEncoder(key), 120);
        var decoder = config.jwtDecoder(key);
        var converter = new SecurityConfig().jwtAuthenticationConverter();
        for (String role : List.of("BUYER", "SELLER")) {
            Jwt jwt = decoder.decode(service.generateToken("42", role));
            assertEquals("42", jwt.getSubject());
            assertEquals("HS256", jwt.getHeaders().get("alg"));
            assertTrue(converter.convert(jwt).getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role)));
        }
    }

    @Test
    void rejectsWrongSignature() {
        String token = new JwtService(config.jwtEncoder(key), 120).generateToken("42", "BUYER");
        assertThrows(JwtException.class, () -> config.jwtDecoder(testKey()).decode(token));
    }

    @Test
    void rejectsExpiredTokenAndWrongIssuer() {
        Instant now = Instant.now();
        assertThrows(JwtException.class, () -> config.jwtDecoder(key).decode(
            signed("mini-ecommerce", now.minusSeconds(600), now.minusSeconds(300))));
        assertThrows(JwtException.class, () -> config.jwtDecoder(key).decode(
            signed("another-application", now, now.plusSeconds(300))));
    }

    @Test
    void rejectsInvalidSecretAndLifetime() {
        assertThrows(IllegalArgumentException.class, () -> config.jwtSecretKey("not-base64!"));
        assertThrows(IllegalArgumentException.class, () -> config.jwtSecretKey("YWJj"));
        assertThrows(IllegalArgumentException.class, () -> new JwtService(config.jwtEncoder(key), 0));
    }

    @Test
    void corsAllowsOnlyConfiguredOrigins() {
        var source = new SecurityConfig().corsConfigurationSource(
            "http://localhost:5173, http://127.0.0.1:5173");
        var configuration = ((org.springframework.web.cors.UrlBasedCorsConfigurationSource) source)
            .getCorsConfigurations().get("/**");
        assertEquals("http://localhost:5173", configuration.checkOrigin("http://localhost:5173"));
        assertNull(configuration.checkOrigin("https://untrusted.example"));
        assertTrue(configuration.getAllowedHeaders().contains("Authorization"));
    }

    private String signed(String issuer, Instant issuedAt, Instant expiresAt) {
        var claims = JwtClaimsSet.builder().issuer(issuer).subject("42")
            .issuedAt(issuedAt).expiresAt(expiresAt).build();
        return config.jwtEncoder(key).encode(JwtEncoderParameters.from(
            JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
