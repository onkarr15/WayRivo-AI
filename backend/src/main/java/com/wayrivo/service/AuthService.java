package com.wayrivo.service;

import com.wayrivo.dto.request.LoginRequest;
import com.wayrivo.dto.request.RegisterRequest;
import com.wayrivo.dto.response.AuthResponse;
import com.wayrivo.entity.ExpertProfile;
import com.wayrivo.entity.User;
import com.wayrivo.exception.BadRequestException;
import com.wayrivo.exception.ConflictException;
import com.wayrivo.repository.ExpertProfileRepository;
import com.wayrivo.repository.UserRepository;
import com.wayrivo.security.CustomUserDetails;
import com.wayrivo.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ExpertProfileRepository expertProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Email is required");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email is already registered");
        }

        if (request.getRole() == null || request.getRole().isBlank()) {
            throw new BadRequestException("Role is required. Must be TRAVELER or EXPERT");
        }

        User.Role role;
        try {
            role = User.Role.valueOf(request.getRole().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role. Must be TRAVELER or EXPERT");
        }

        if (role == User.Role.ADMIN) {
            throw new BadRequestException("Cannot register as admin");
        }

        User user = User.builder()
                .name(request.getName() != null ? request.getName().trim() : "")
                .email(normalizedEmail)
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .status(User.UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        if (role == User.Role.EXPERT) {
            String orgName = request.getOrganizationName();
            if (orgName == null || orgName.isBlank()) {
                orgName = user.getName() + " Travel Services";
            }
            ExpertProfile profile = ExpertProfile.builder()
                    .user(user)
                    .organizationName(orgName)
                    .description(request.getDescription())
                    .yearsOfExperience(request.getYearsOfExperience())
                    .city(request.getCity())
                    .state(request.getState())
                    .country(request.getCountry() != null && !request.getCountry().isBlank() ? request.getCountry() : "India")
                    .website(request.getWebsite())
                    .specializations(request.getSpecializations())
                    .verificationStatus(ExpertProfile.VerificationStatus.PENDING)
                    .rating(0.0)
                    .totalReviews(0)
                    .build();
            expertProfileRepository.save(profile);
            user.setExpertProfile(profile);
        }

        String token = tokenProvider.generateTokenFromUserId(
            user.getId(), user.getEmail(), user.getRole().name(), user.getName()
        );

        return AuthResponse.builder()
                .success(true)
                .token(token)
                .role(user.getRole().name())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .message("Registration successful")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw new BadRequestException("Email and password are required");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        return AuthResponse.builder()
                .success(true)
                .token(token)
                .role(userDetails.getRole())
                .userId(userDetails.getId())
                .name(userDetails.getName())
                .email(userDetails.getEmail())
                .message("Login successful")
                .build();
    }

    public AuthResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        return AuthResponse.builder()
                .success(true)
                .role(user.getRole().name())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public AuthResponse updateProfile(Long userId, Map<String, String> data) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (data.containsKey("name") && data.get("name") != null && !data.get("name").isBlank()) {
            user.setName(data.get("name"));
        }
        if (data.containsKey("phone") && data.get("phone") != null) {
            user.setPhone(data.get("phone"));
        }
        user = userRepository.save(user);

        return AuthResponse.builder()
                .success(true)
                .role(user.getRole().name())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .message("Profile updated successfully")
                .build();
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
