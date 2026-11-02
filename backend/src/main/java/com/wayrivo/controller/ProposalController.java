package com.wayrivo.controller;

import com.wayrivo.dto.request.ProposalDTO;
import com.wayrivo.dto.response.ApiResponse;
import com.wayrivo.entity.Booking;
import com.wayrivo.entity.Proposal;
import com.wayrivo.security.CustomUserDetails;
import com.wayrivo.service.ProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/proposals")
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService proposalService;

    @PostMapping
    public ResponseEntity<ApiResponse> createProposal(
            @Valid @RequestBody ProposalDTO dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Proposal proposal = proposalService.createProposal(dto, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Proposal submitted successfully", mapProposal(proposal)));
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<ApiResponse> getProposalsForRequest(@PathVariable Long requestId) {
        List<Proposal> proposals = proposalService.getProposalsForRequest(requestId);
        return ResponseEntity.ok(ApiResponse.ok(proposals.stream().map(this::mapProposal).collect(Collectors.toList())));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse> getMyProposals(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Proposal> proposals = proposalService.getExpertProposals(userDetails.getId(), PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok(proposals.map(this::mapProposal)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getProposal(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(mapProposal(proposalService.getProposalById(id))));
    }

    @PostMapping("/{id}/select")
    public ResponseEntity<ApiResponse> selectProposal(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Booking booking = proposalService.selectProposal(id, userDetails.getId());
        Map<String, Object> result = new HashMap<>();
        result.put("id", booking.getId());
        result.put("bookingId", booking.getId());
        result.put("bookingReference", booking.getBookingReference());
        result.put("totalAmount", booking.getTotalAmount());
        result.put("status", booking.getStatus().name());
        return ResponseEntity.ok(ApiResponse.ok("Proposal selected and booking created", result));
    }

    @GetMapping("/expert/dashboard-stats")
    public ResponseEntity<ApiResponse> getExpertDashboardStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(proposalService.getExpertDashboardStats(userDetails.getId())));
    }

    private Map<String, Object> mapProposal(Proposal p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("tripRequestId", p.getTripRequest().getId());
        map.put("destination", p.getTripRequest().getDestination());
        map.put("expertId", p.getExpert().getId());
        map.put("expertName", p.getExpert().getUser().getName());
        map.put("organizationName", p.getExpert().getOrganizationName());
        map.put("expertRating", p.getExpert().getRating());
        map.put("expertReviews", p.getExpert().getTotalReviews());
        map.put("verificationStatus", p.getExpert().getVerificationStatus().name());
        map.put("yearsOfExperience", p.getExpert().getYearsOfExperience());
        map.put("title", p.getTitle());
        map.put("description", p.getDescription());
        map.put("totalPrice", p.getTotalPrice());
        map.put("pricePerPerson", p.getPricePerPerson());
        map.put("itinerary", p.getItinerary());
        map.put("accommodationDetails", p.getAccommodationDetails());
        map.put("transportationDetails", p.getTransportationDetails());
        map.put("activities", p.getActivities());
        map.put("inclusions", p.getInclusions());
        map.put("exclusions", p.getExclusions());
        map.put("cancellationPolicy", p.getCancellationPolicy());
        map.put("validityDate", p.getValidityDate());
        map.put("status", p.getStatus().name());
        map.put("createdAt", p.getCreatedAt());
        return map;
    }
}
