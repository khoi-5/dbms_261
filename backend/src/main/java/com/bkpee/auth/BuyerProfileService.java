package com.bkpee.auth;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;
import static com.bkpee.auth.BuyerProfileApi.*;

@Service
public class BuyerProfileService {
    private final JdbcTemplate db;
    private final AccountAuthService auth;
    private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder(12);
    public BuyerProfileService(JdbcTemplate db, AccountAuthService auth) { this.db=db; this.auth=auth; }
    private int buyer(String subject) {
        var user=auth.current(subject);
        if (!user.roles().contains("BUYER")) throw new ResponseStatusException(FORBIDDEN,"Hồ sơ này dành cho Buyer");
        return user.id();
    }
    public Profile get(String subject) { return read(buyer(subject)); }
    private Profile read(int id) {
        return db.queryForObject("SELECT FName,LName,Address,Gender,avatar FROM Account WHERE Account_ID=?",
            (rs,n) -> new Profile(rs.getString(1),rs.getString(2),rs.getString(3),rs.getString(4),rs.getString(5)),id);
    }
    private String optional(String value) { return value==null || value.isBlank() ? null : value.strip(); }
    @Transactional
    public Profile update(String subject, Update request) {
        int id=buyer(subject);
        String gender=optional(request.gender()), avatar=optional(request.avatar());
        if(gender!=null && !Set.of("Nam","Nữ","Nu","Male","Female","Other","Khác").contains(gender))
            throw new ResponseStatusException(BAD_REQUEST,"Giới tính không hợp lệ");
        if(avatar!=null) {
            try {
                URI uri=URI.create(avatar);
                if(uri.getScheme()==null || !Set.of("http","https").contains(uri.getScheme()) || uri.getHost()==null || uri.getUserInfo()!=null)
                    throw new IllegalArgumentException();
            } catch (IllegalArgumentException e) { throw new ResponseStatusException(BAD_REQUEST,"Avatar phải là URL HTTP/HTTPS hợp lệ"); }
        }
        // Explicit whitelist. No email/phone/CCCD/role/status/ID comes from this request.
        db.update("UPDATE Account SET FName=?,LName=?,Address=?,Gender=?,avatar=?,Updated_At=SYSDATETIME(),Updated_By=? WHERE Account_ID=?",
            request.firstName().strip(),request.lastName().strip(),optional(request.address()),gender,avatar,id,id);
        return read(id);
    }
    @Transactional
    public void changePassword(String subject, Password request) {
        int id=buyer(subject);
        if(!request.newPassword().equals(request.confirmPassword()))
            throw new ResponseStatusException(BAD_REQUEST,"Xác nhận mật khẩu mới không khớp");
        if(request.newPassword().getBytes(StandardCharsets.UTF_8).length>72
                || request.currentPassword().getBytes(StandardCharsets.UTF_8).length>72)
            throw new ResponseStatusException(BAD_REQUEST,"Mật khẩu tối đa 72 byte UTF-8");
        String hash=db.queryForObject("SELECT password FROM Account WITH (UPDLOCK,HOLDLOCK) WHERE Account_ID=?",String.class,id);
        if(!passwords.matches(request.currentPassword(),hash))
            throw new ResponseStatusException(BAD_REQUEST,"Mật khẩu hiện tại không chính xác");
        db.update("UPDATE Account SET password=?,Updated_At=SYSDATETIME(),Updated_By=? WHERE Account_ID=?",
            passwords.encode(request.newPassword()),id,id);
        // JWT is stateless. Previously issued tokens are NOT revoked by changing the hash.
    }
}
