package com.bkpee.auth;

import com.bkpee.security.JwtService;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class AccountAuthService {
    private final JdbcTemplate db;
    private final JwtService jwt;
    private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder(12);
    public AccountAuthService(JdbcTemplate db, JwtService jwt) { this.db = db; this.jwt = jwt; }
    public record Account(int id, String username, String email, String firstName, String lastName, List<String> roles) {}
    public record Session(String token, Account account) {}
    private static final String SELECT = """
        SELECT a.*, CASE WHEN b.Account_ID IS NULL THEN 0 ELSE 1 END buyer,
        CASE WHEN s.Account_ID IS NULL THEN 0 ELSE 1 END seller
        FROM Account a LEFT JOIN Buyer b ON b.Account_ID=a.Account_ID
        LEFT JOIN Seller s ON s.Account_ID=a.Account_ID
        """;
    private Account account(Map<String,Object> row) {
        if (!"ACTIVE".equals(row.get("Account_Status"))) throw new ResponseStatusException(FORBIDDEN, "Tài khoản không hoạt động hoặc đã bị khóa");
        var roles = new ArrayList<String>();
        if (((Number)row.get("buyer")).intValue()==1) roles.add("BUYER");
        if (((Number)row.get("seller")).intValue()==1) roles.add("SELLER");
        if (roles.isEmpty()) throw new ResponseStatusException(FORBIDDEN, "Tài khoản chưa có vai trò Buyer/Seller");
        return new Account(((Number)row.get("Account_ID")).intValue(), (String)row.get("Username"), (String)row.get("Email"), (String)row.get("FName"), (String)row.get("LName"), roles);
    }
    public Account current(String subject) {
        int id;
        try { id = Integer.parseInt(subject); } catch (NumberFormatException e) { throw new ResponseStatusException(UNAUTHORIZED, "Phiên không hợp lệ"); }
        var rows = db.queryForList(SELECT + " WHERE a.Account_ID=?", id);
        if(rows.isEmpty()) throw new ResponseStatusException(UNAUTHORIZED, "Tài khoản không tồn tại");
        return account(rows.getFirst());
    }
    public Session login(String identity, String password) {
        var rows=db.queryForList(SELECT + " WHERE a.Username=? OR a.Email=?", identity.trim(), identity.trim());
        // Reject ambiguous username/email collisions and illustrative seed hashes.
        if(rows.size()!=1 || !passwords.matches(password, (String)rows.getFirst().get("password")))
            throw new ResponseStatusException(UNAUTHORIZED, "Thông tin đăng nhập không chính xác");
        var user=account(rows.getFirst());
        return new Session(jwt.generateToken(Integer.toString(user.id()), user.roles()), user);
    }
    @Transactional
    public Session register(String username, String email, String password, String firstName, String lastName, String phone, String cccd) {
        return create(username,email,password,firstName,lastName,phone,cccd,null,null);
    }
    /** Local opt-in provisioner only. Never exposed as a public registration endpoint. */
    @Transactional
    public Session provisionSeller(String username, String email, String password, String firstName, String lastName, String phone, String cccd, String shopName, String bankAccount) {
        if(shopName==null || shopName.isBlank() || shopName.length()>100 || bankAccount==null || bankAccount.isBlank() || bankAccount.length()>50)
            throw new ResponseStatusException(BAD_REQUEST,"Tên shop hoặc tài khoản ngân hàng không hợp lệ");
        return create(username,email,password,firstName,lastName,phone,cccd,shopName,bankAccount);
    }
    private Session create(String username, String email, String password, String firstName, String lastName, String phone, String cccd, String shopName, String bankAccount) {
        if(password==null || password.length()<8 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72
            || username==null || username.length()>50 || email==null || email.length()>100 || !email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")
            || firstName==null || firstName.length()>50 || lastName==null || lastName.length()>50 || phone==null || cccd==null)
            throw new ResponseStatusException(BAD_REQUEST,"Thông tin tài khoản không hợp lệ");
        username=username.trim(); email=email.trim().toLowerCase(Locale.ROOT); phone=phone.trim();
        if(!username.matches("[A-Za-z0-9_]{3,50}") || firstName.isBlank() || lastName.isBlank() || !phone.matches("[+0-9]{8,20}") || !cccd.matches("[0-9]{9}|[0-9]{12}"))
            throw new ResponseStatusException(BAD_REQUEST, "Username, họ tên, số điện thoại hoặc CCCD không hợp lệ");
        if(!db.queryForList("SELECT Account_ID FROM Account WITH (UPDLOCK,HOLDLOCK) WHERE Username IN (?,?) OR Email IN (?,?) OR Phone=? OR CCCD=?", username,email,username,email,phone,cccd).isEmpty())
            throw new ResponseStatusException(CONFLICT, "Username, email, số điện thoại hoặc CCCD đã được sử dụng");
        var key=new GeneratedKeyHolder();
        final String u=username, e=email, p=phone;
        db.update(connection -> {
            var statement=connection.prepareStatement("INSERT INTO Account (Username,Email,password,FName,LName,Phone,CCCD) VALUES (?,?,?,?,?,?,?)", new String[]{"Account_ID"});
            statement.setString(1,u); statement.setString(2,e); statement.setString(3,passwords.encode(password));
            statement.setString(4,firstName.trim()); statement.setString(5,lastName.trim()); statement.setString(6,p); statement.setString(7,cccd); return statement;
        },key);
        int id=Objects.requireNonNull(key.getKey()).intValue();
        db.update("INSERT INTO [User] (Account_ID) VALUES (?)",id);
        db.update("INSERT INTO Buyer (Account_ID) VALUES (?)",id);
        db.update("INSERT INTO Cart (Buyer_ID) VALUES (?)",id);
        if(shopName!=null) {
            db.update("INSERT INTO Seller (Account_ID,Shop_Name,Bank_Account_Number) VALUES (?,?,?)",id,shopName.trim(),bankAccount.trim());
        }
        var user=current(Integer.toString(id));
        return new Session(jwt.generateToken(Integer.toString(id),user.roles()),user);
    }

    @Transactional
    public Session upgradeToSeller(String subject, String shopName, String bankAccount) {
        int id;
        try { id = Integer.parseInt(subject); } catch (NumberFormatException e) { throw new ResponseStatusException(UNAUTHORIZED, "Phiên không hợp lệ"); }
        if(shopName==null || shopName.isBlank() || shopName.length()>100 || bankAccount==null || bankAccount.isBlank() || bankAccount.length()>50)
            throw new ResponseStatusException(BAD_REQUEST,"Tên shop hoặc tài khoản ngân hàng không hợp lệ");
        var existing = db.queryForList("SELECT Account_ID FROM Seller WHERE Account_ID=?", id);
        if(existing.isEmpty()) {
            db.update("INSERT INTO Seller (Account_ID,Shop_Name,Bank_Account_Number) VALUES (?,?,?)", id, shopName.trim(), bankAccount.trim());
        }
        var user = current(Integer.toString(id));
        return new Session(jwt.generateToken(Integer.toString(id), user.roles()), user);
    }
}
