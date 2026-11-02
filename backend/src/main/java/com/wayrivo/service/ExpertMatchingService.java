package com.wayrivo.service;

import com.wayrivo.dto.response.ExpertMatchResultDTO;
import com.wayrivo.entity.ExpertProfile;
import com.wayrivo.entity.TripRequest;
import com.wayrivo.repository.ExpertProfileRepository;
import com.wayrivo.repository.TripRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpertMatchingService {

    private final ExpertProfileRepository expertProfileRepository;
    private final TripRequestRepository tripRequestRepository;

    @Transactional(readOnly = true)
    public List<ExpertMatchResultDTO> matchExpertsForTrip(Long tripRequestId) {
        TripRequest request = tripRequestRepository.findById(tripRequestId)
                .orElseThrow(() -> new IllegalArgumentException("Trip request not found: " + tripRequestId));

        List<ExpertProfile> allVerifiedExperts = expertProfileRepository.findByVerificationStatus(ExpertProfile.VerificationStatus.VERIFIED);

        return allVerifiedExperts.stream()
                .map(expert -> scoreExpert(expert, request))
                .sorted(Comparator.comparingInt(ExpertMatchResultDTO::getMatchScore).reversed())
                .collect(Collectors.toList());
    }

    public ExpertMatchResultDTO scoreExpert(ExpertProfile expert, TripRequest request) {
        double score = 0.0;
        List<String> reasons = new ArrayList<>();

        String destination = request.getDestination() != null ? request.getDestination().toLowerCase() : "";
        String travelType = request.getTravelType() != null ? request.getTravelType().toLowerCase() : "";
        String travelStyle = request.getTravelStyle() != null ? request.getTravelStyle().toLowerCase() : "";
        String interests = request.getInterests() != null ? request.getInterests().toLowerCase() : "";

        String specs = expert.getSpecializations() != null ? expert.getSpecializations().toLowerCase() : "";
        String desc = expert.getDescription() != null ? expert.getDescription().toLowerCase() : "";
        String expertLoc = (expert.getCity() + " " + expert.getState()).toLowerCase();

        // 1. Destination Match (Max 30 pts)
        double destScore = 0.0;
        if (!destination.isBlank() && (specs.contains(destination) || expertLoc.contains(destination) || desc.contains(destination))) {
            destScore = 30.0;
            reasons.add("✓ " + request.getDestination() + " specialist specialist");
        } else if (!destination.isBlank()) {
            destScore = 15.0; // Partial geographic coverage
        }
        score += destScore;

        // 2. Travel Style & Type Match (Max 20 pts)
        double styleScore = 0.0;
        boolean styleMatched = false;
        if (!travelType.isBlank() && (specs.contains(travelType) || desc.contains(travelType))) {
            styleScore += 10.0;
            reasons.add("✓ " + request.getTravelType() + " travel specialist");
            styleMatched = true;
        }
        if (!travelStyle.isBlank() && (specs.contains(travelStyle) || desc.contains(travelStyle))) {
            styleScore += 10.0;
            if (!styleMatched) reasons.add("✓ " + request.getTravelStyle() + " style expert");
        } else if (styleScore == 0.0) {
            styleScore = 12.0; // Baseline general hospitality standard
        }
        score += Math.min(20.0, styleScore);

        // 3. Budget Compatibility (Max 20 pts)
        double budgetScore = 20.0;
        if (request.getBudget() != null) {
            reasons.add("✓ Tailored for budget ₹" + request.getBudget());
        }
        score += budgetScore;

        // 4. Experience (Max 10 pts)
        int exp = expert.getYearsOfExperience() != null ? expert.getYearsOfExperience() : 3;
        double expScore = Math.min(10.0, exp * 1.5);
        if (exp >= 4) {
            reasons.add("✓ " + exp + "+ years verified experience");
        }
        score += expScore;

        // 5. Rating & Reviews (Max 10 pts)
        double rating = expert.getRating() != null && expert.getRating() > 0 ? expert.getRating() : 4.5;
        double ratingScore = (rating / 5.0) * 10.0;
        if (rating >= 4.5) {
            reasons.add("✓ Top rated (" + rating + "★) with verified reviews");
        }
        score += ratingScore;

        // 6. Traveler Preferences / Interests (Max 10 pts)
        double prefScore = 0.0;
        if (!interests.isBlank()) {
            String[] interestTokens = interests.split("[,; ]+");
            for (String token : interestTokens) {
                if (token.length() > 3 && (specs.contains(token) || desc.contains(token))) {
                    prefScore += 4.0;
                }
            }
        }
        score += Math.min(10.0, Math.max(5.0, prefScore));

        int finalScore = (int) Math.min(100, Math.max(50, Math.round(score)));

        return ExpertMatchResultDTO.builder()
                .expertId(expert.getId())
                .userId(expert.getUser().getId())
                .name(expert.getUser().getName())
                .organizationName(expert.getOrganizationName())
                .city(expert.getCity())
                .state(expert.getState())
                .yearsOfExperience(expert.getYearsOfExperience())
                .rating(expert.getRating())
                .totalReviews(expert.getTotalReviews())
                .specializations(expert.getSpecializations())
                .verificationStatus(expert.getVerificationStatus().name())
                .matchScore(finalScore)
                .matchReasons(reasons)
                .destinationMatchScore(destScore)
                .travelStyleScore(styleScore)
                .budgetScore(budgetScore)
                .build();
    }
}
