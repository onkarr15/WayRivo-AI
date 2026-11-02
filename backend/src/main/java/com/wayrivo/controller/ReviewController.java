package com.wayrivo.controller;

import com.wayrivo.dto.request.ReviewDTO;
import com.wayrivo.dto.response.ApiResponse;
import com.wayrivo.entity.Review;
import com.wayrivo.security.CustomUserDetails;
import com.wayrivo.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse> createReview(
            @Valid @RequestBody ReviewDTO dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Review review = reviewService.createReview(dto, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Review submitted successfully", mapReview(review)));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse> getRecentReviews() {
        List<Review> reviews = reviewService.getRecentReviews();
        return ResponseEntity.ok(ApiResponse.ok(reviews.stream().map(this::mapReview).collect(Collectors.toList())));
    }

    @GetMapping("/expert/{expertId}")
    public ResponseEntity<ApiResponse> getReviewsForExpert(@PathVariable Long expertId) {
        List<Review> reviews = reviewService.getReviewsForExpert(expertId);
        return ResponseEntity.ok(ApiResponse.ok(reviews.stream().map(this::mapReview).collect(Collectors.toList())));
    }

    private Map<String, Object> mapReview(Review r) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("bookingId", r.getBooking().getId());
        map.put("travelerName", r.getTraveler().getName());
        map.put("expertName", r.getExpert().getUser().getName());
        map.put("organizationName", r.getExpert().getOrganizationName());
        map.put("rating", r.getRating());
        map.put("comment", r.getComment());
        map.put("createdAt", r.getCreatedAt());
        return map;
    }
}
