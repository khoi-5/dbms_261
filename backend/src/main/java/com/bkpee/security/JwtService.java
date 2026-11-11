
package com.bkpee.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtEncoder encoder;
    private final long expirationMinutes;

    public JwtService(
            JwtEncoder encoder,
            @Value("${app.jwt.expiration-minutes}")
            long expirationMinutes) {

        if (expirationMinutes <= 0) {
            throw new IllegalArgumentException("JWT expiration minutes must be positive");
        }
        this.encoder = encoder;
        this.expirationMinutes = expirationMinutes;
    }

    public String generateToken(String userId, String role) {
        return generateToken(userId, List.of(role));
    }

    public String generateToken(String userId, List<String> roles) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("mini-ecommerce")
            .subject(userId)
            .issuedAt(now)
            .expiresAt(
                now.plus(expirationMinutes, ChronoUnit.MINUTES)
            )
            .claim("roles", roles)
            .build();

        JwsHeader header = JwsHeader
            .with(MacAlgorithm.HS256)
            .build();

        return encoder.encode(
            JwtEncoderParameters.from(header, claims)
        ).getTokenValue();
    }
}
