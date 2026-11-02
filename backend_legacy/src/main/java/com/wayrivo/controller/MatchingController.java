package com.wayrivo.controller;

import com.wayrivo.dto.response.ApiResponse;
import com.wayrivo.dto.response.ExpertMatchResultDTO;
import com.wayrivo.security.CustomUserDetails;
import com.wayrivo.service.ExpertMatchingService;
import com.wayrivo.service.ai.AITripAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MatchingController {

    private final ExpertMatchingService expertMatchingService;
    private final AITripAssistantService aiTripAssistantService;

    @GetMapping("/trip-requests/{id}/matched-experts")
    public ResponseEntity<ApiResponse> getMatchedExperts(@PathVariable Long id) {
        List<ExpertMatchResultDTO> matches = expertMatchingService.matchExpertsForTrip(id);
        return ResponseEntity.ok(ApiResponse.ok(matches));
    }

    @GetMapping("/public/ai-insights")
    public ResponseEntity<ApiResponse> getAiTripInsights(
            @RequestParam(defaultValue = "Kerala") String destination,
            @RequestParam(required = false) String style,
            @RequestParam(defaultValue = "5") Integer days) {
        Map<String, Object> insights = aiTripAssistantService.generateTripInsights(destination, style, days);
        return ResponseEntity.ok(ApiResponse.ok(insights));
    }

    @GetMapping("/public/recommendations")
    public ResponseEntity<ApiResponse> getRecommendations(@AuthenticationPrincipal CustomUserDetails userDetails) {
        // Personalized recommendation logic based on role / history
        Map<String, Object> recommendations = Map.of(
            "trendingDestinations", List.of("Kerala", "Rajasthan", "Goa", "Ladakh", "Meghalaya"),
            "recommendedStyles", List.of("Family Nature Retreats", "Luxury Heritage Palace Tours", "Backwater & Wellness Getaways"),
            "travelerReason", userDetails != null ? "Curated for " + userDetails.getName() + " based on popular traveler trends" : "Curated travel inspirations"
        );
        return ResponseEntity.ok(ApiResponse.ok(recommendations));
    }
}
