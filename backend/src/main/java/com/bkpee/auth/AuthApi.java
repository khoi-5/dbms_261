package com.bkpee.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api")
public class AuthApi {
    private final AccountAuthService auth;
    public AuthApi(AccountAuthService auth) { this.auth=auth; }
    public record Login(@NotBlank @Size(max=100) String identity, @NotBlank @Size(max=200) String password) {}
    public record Register(@NotBlank @Size(max=50) String username, @NotBlank @Email @Size(max=100) String email,
        @NotBlank @Size(min=8,max=72) String password, @NotBlank @Size(max=50) String firstName,
        @NotBlank @Size(max=50) String lastName, @NotBlank @Size(max=20) String phone, @NotBlank @Pattern(regexp="[0-9]{9}|[0-9]{12}") String cccd,
        @Size(min=8,max=72) String confirmPassword) {}

    public record RegisterSeller(
        @NotBlank @Size(max=50) String username, @NotBlank @Email @Size(max=100) String email,
        @NotBlank @Size(min=8,max=72) String password, @NotBlank @Size(max=50) String firstName,
        @NotBlank @Size(max=50) String lastName, @NotBlank @Size(max=20) String phone, @NotBlank @Pattern(regexp="[0-9]{9}|[0-9]{12}") String cccd,
        @NotBlank @Size(max=100) String shopName, @NotBlank @Size(max=50) String bankAccount,
        @Size(min=8,max=72) String confirmPassword) {}

    public record BecomeSellerRequest(
        @NotBlank @Size(max=100) String shopName,
        @NotBlank @Size(max=50) String bankAccount
    ) {}

    @PostMapping("/auth/login")
    public AccountAuthService.Session login(@Valid @RequestBody Login request) { return auth.login(request.identity(),request.password()); }
    @PostMapping("/auth/register")
    @ResponseStatus(CREATED)
    public AccountAuthService.Session register(@Valid @RequestBody Register r) {
        // Optional for existing API clients; the registration UI always requires confirmation.
        if(r.confirmPassword()!=null && !r.password().equals(r.confirmPassword()))
            throw new ResponseStatusException(BAD_REQUEST,"Xác nhận mật khẩu không khớp");
        if(r.password().getBytes(StandardCharsets.UTF_8).length>72) throw new ResponseStatusException(BAD_REQUEST,"Mật khẩu tối đa 72 byte UTF-8");
        return auth.register(r.username(),r.email(),r.password(),r.firstName(),r.lastName(),r.phone(),r.cccd());
    }

    @PostMapping("/auth/register-seller")
    @ResponseStatus(CREATED)
    public AccountAuthService.Session registerSeller(@Valid @RequestBody RegisterSeller r) {
        if(r.confirmPassword()!=null && !r.password().equals(r.confirmPassword()))
            throw new ResponseStatusException(BAD_REQUEST,"Xác nhận mật khẩu không khớp");
        if(r.password().getBytes(StandardCharsets.UTF_8).length>72) throw new ResponseStatusException(BAD_REQUEST,"Mật khẩu tối đa 72 byte UTF-8");
        return auth.provisionSeller(r.username(),r.email(),r.password(),r.firstName(),r.lastName(),r.phone(),r.cccd(),r.shopName(),r.bankAccount());
    }

    @PostMapping("/auth/become-seller")
    public AccountAuthService.Session becomeSeller(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody BecomeSellerRequest r) {
        if (jwt == null || jwt.getSubject() == null) throw new ResponseStatusException(UNAUTHORIZED, "Vui lòng đăng nhập");
        return auth.upgradeToSeller(jwt.getSubject(), r.shopName(), r.bankAccount());
    }
    @GetMapping("/accounts/me")
    public AccountAuthService.Account me(@AuthenticationPrincipal Jwt jwt) { return auth.current(jwt.getSubject()); }
}
