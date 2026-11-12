package com.bkpee.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/buyer/profile")
public class BuyerProfileApi {
    private final BuyerProfileService profiles;
    public BuyerProfileApi(BuyerProfileService profiles) { this.profiles = profiles; }
    public record Profile(String firstName, String lastName, String address, String gender, String avatar) {}
    public record Update(@NotBlank @Size(max=50) String firstName, @NotBlank @Size(max=50) String lastName,
                         @Size(max=255) String address, @Size(max=10) String gender, @Size(max=500) String avatar) {}
    public record Password(@NotBlank @Size(max=200) String currentPassword,
                           @NotBlank @Size(min=8,max=72) String newPassword,
                           @NotBlank @Size(min=8,max=72) String confirmPassword) {}
    @GetMapping public Profile get(@AuthenticationPrincipal Jwt jwt) { return profiles.get(jwt.getSubject()); }
    @PutMapping public Profile update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody Update request) {
        return profiles.update(jwt.getSubject(), request);
    }
    @PostMapping("/password") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void password(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody Password request) {
        profiles.changePassword(jwt.getSubject(), request);
    }
}
