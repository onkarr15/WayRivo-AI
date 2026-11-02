package com.wayrivo.controller;

import com.wayrivo.dto.response.ApiResponse;
import com.wayrivo.entity.ExpertProfile;
import com.wayrivo.repository.ExpertProfileRepository;
import com.wayrivo.security.CustomUserDetails;
import com.wayrivo.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/experts")
@RequiredArgsConstructor
public class ExpertController {

    private final AdminService adminService;
    private final ExpertProfileRepository expertProfileRepository;

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse> getFeaturedExperts() {
        List<ExpertProfile> experts = adminService.getFeaturedExperts();
        return ResponseEntity.ok(ApiResponse.ok(experts.stream().map(this::mapExpert).collect(Collectors.toList())));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse> getMyProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        ExpertProfile profile = expertProfileRepository.findByUserId(userDetails.getId())
                .orElse(null);
        if (profile == null) {
            return ResponseEntity.ok(ApiResponse.error("Expert profile not found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(mapExpert(profile)));
    }

    @PutMapping("/profile")
    @Transactional
    public ResponseEntity<ApiResponse> updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> data) {
        ExpertProfile profile = expertProfileRepository.findByUserId(userDetails.getId())
                .orElse(null);
        if (profile == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Expert profile not found"));
        }

        if (data.containsKey("organizationName") && data.get("organizationName") != null) {
            profile.setOrganizationName(data.get("organizationName").toString());
        }
        if (data.containsKey("description") && data.get("description") != null) {
            profile.setDescription(data.get("description").toString());
        }
        if (data.containsKey("yearsOfExperience") && data.get("yearsOfExperience") != null) {
            profile.setYearsOfExperience(Integer.parseInt(data.get("yearsOfExperience").toString()));
        }
        if (data.containsKey("city") && data.get("city") != null) {
            profile.setCity(data.get("city").toString());
        }
        if (data.containsKey("state") && data.get("state") != null) {
            profile.setState(data.get("state").toString());
        }
        if (data.containsKey("country") && data.get("country") != null) {
            profile.setCountry(data.get("country").toString());
        }
        if (data.containsKey("website") && data.get("website") != null) {
            profile.setWebsite(data.get("website").toString());
        }
        if (data.containsKey("specializations") && data.get("specializations") != null) {
            profile.setSpecializations(data.get("specializations").toString());
        }

        profile = expertProfileRepository.save(profile);
        return ResponseEntity.ok(ApiResponse.ok("Expert profile updated successfully", mapExpert(profile)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getExpertById(@PathVariable Long id) {
        ExpertProfile profile = expertProfileRepository.findById(id).orElse(null);
        if (profile == null) {
            return ResponseEntity.ok(ApiResponse.error("Expert not found"));
        }
        return ResponseEntity.ok(ApiResponse.ok(mapExpert(profile)));
    }

    private Map<String, Object> mapExpert(ExpertProfile ep) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", ep.getId());
        map.put("userId", ep.getUser().getId());
        map.put("name", ep.getUser().getName());
        map.put("email", ep.getUser().getEmail());
        map.put("organizationName", ep.getOrganizationName());
        map.put("description", ep.getDescription());
        map.put("yearsOfExperience", ep.getYearsOfExperience());
        map.put("city", ep.getCity());
        map.put("state", ep.getState());
        map.put("country", ep.getCountry());
        map.put("website", ep.getWebsite());
        map.put("specializations", ep.getSpecializations());
        map.put("verificationStatus", ep.getVerificationStatus().name());
        map.put("rating", ep.getRating());
        map.put("totalReviews", ep.getTotalReviews());
        map.put("createdAt", ep.getCreatedAt());
        return map;
    }
}
