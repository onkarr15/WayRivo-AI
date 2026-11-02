package com.wayrivo.controller;

import com.wayrivo.dto.request.LoginRequest;
import com.wayrivo.dto.request.RegisterRequest;
import com.wayrivo.dto.response.ApiResponse;
import com.wayrivo.dto.response.AuthResponse;
import com.wayrivo.security.CustomUserDetails;
import com.wayrivo.service.AuthService;
import com.wayrivo.exception.UnauthorizedException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(authService.getCurrentUser(userDetails.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> data) {
        if (userDetails == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        return ResponseEntity.ok(authService.updateProfile(userDetails.getId(), data));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> data) {
        if (userDetails == null) {
            throw new UnauthorizedException("User is not authenticated");
        }
        String currentPassword = data.get("currentPassword");
        String newPassword = data.get("newPassword");
        authService.changePassword(userDetails.getId(), currentPassword, newPassword);
        return ResponseEntity.ok(ApiResponse.ok("Password updated successfully"));
    }
}
