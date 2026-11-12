package com.bkpee.integration;

import com.bkpee.auth.AccountAuthService;
import com.bkpee.security.JwtService;
import java.net.URI;
import java.net.http.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import static org.junit.jupiter.api.Assertions.*;

/** Opt-in: uses configured SQL database; creates only one new QA Buyer. No seed reset. */
@EnabledIfEnvironmentVariable(named="RUN_SQL_INTEGRATION",matches="true")
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"debug=false","logging.level.root=WARN"})
class BuyerSqlIntegrationTest {
    @LocalServerPort int port;
    @Autowired AccountAuthService auth;
    @Autowired JwtService tokens;
    @Autowired JwtEncoder encoder;
    @Autowired JdbcTemplate db;
    @org.junit.jupiter.api.BeforeEach void refuseWebsiteDatabase() {
        assertTrue(db.queryForObject("SELECT DB_NAME()",String.class).startsWith("BKPEE_TEST_"),
            "SQL write tests require a separate BKPEE_TEST_ database");
    }
    private int status(String path,String token) throws Exception {
        var builder=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api"+path)).GET();
        if(token!=null) builder.header("Authorization","Bearer "+token);
        return HttpClient.newHttpClient().send(builder.build(),HttpResponse.BodyHandlers.discarding()).statusCode();
    }
    @Test void realAccountHashRolesLockedStatusAndExpiredJwt() throws Exception {
        String suffix=UUID.randomUUID().toString().replace("-","").substring(0,12);
        String password=UUID.randomUUID().toString();
        String digits=Long.toString(100000000000L+new java.security.SecureRandom().nextLong(900000000000L));
        var session=auth.register("qa_"+suffix,"qa_"+suffix+"@example.invalid",password,"QA","Buyer","07"+digits,digits);
        int id=session.account().id();
        String hash=db.queryForObject("SELECT password FROM Account WHERE Account_ID=?",String.class,id);
        assertNotEquals(password,hash);
        assertTrue(new BCryptPasswordEncoder().matches(password,hash));
        assertEquals(200,status("/accounts/me",session.token()));
        assertEquals(403,status("/seller/products",session.token()));
        db.update("UPDATE Account SET Account_Status=N'LOCKED' WHERE Account_ID=?",id);
        try {
            assertThrows(org.springframework.web.server.ResponseStatusException.class,()->auth.login(session.account().username(),password));
            assertEquals(403,status("/accounts/me",session.token()));
            assertEquals(403,status("/buyer/cart",session.token()));
        } finally { db.update("UPDATE Account SET Account_Status=N'ACTIVE' WHERE Account_ID=?",id); }
        var claims=JwtClaimsSet.builder().issuer("mini-ecommerce").subject(Integer.toString(id))
            .issuedAt(Instant.now().minusSeconds(600)).expiresAt(Instant.now().minusSeconds(300)).claim("roles",List.of("BUYER")).build();
        String expired=encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),claims)).getTokenValue();
        assertEquals(401,status("/buyer/cart",expired));
        assertEquals(401,status("/buyer/cart","invalid"));
        String sellerDigits=Long.toString(100000000000L+new java.security.SecureRandom().nextLong(900000000000L));
        var sellerSession=auth.provisionSeller("qs_"+suffix,"qs_"+suffix+"@example.invalid",password,"QA","Seller","06"+sellerDigits,sellerDigits,"QA Shop "+suffix,"QA-"+suffix);
        String seller=Integer.toString(sellerSession.account().id());
        assertEquals(List.of("SELLER"),auth.login(sellerSession.account().email(),password).account().roles());
        assertTrue(auth.current(seller).roles().contains("SELLER"));
        assertEquals(403,status("/buyer/cart",sellerSession.token()));
        // Even a signed BUYER claim cannot substitute for a real Buyer DB profile.
        assertEquals(403,status("/buyer/cart",tokens.generateToken(seller,"BUYER")));
        System.out.println("SQL integration: BCrypt, locked account, expired token, DB role checks PASS; QA account="+session.account().username());
    }
}
