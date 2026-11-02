package com.wayrivo.controller;

import com.wayrivo.dto.request.TripRequestDTO;
import com.wayrivo.dto.response.ApiResponse;
import com.wayrivo.entity.TripRequest;
import com.wayrivo.security.CustomUserDetails;
import com.wayrivo.service.TripRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/trip-requests")
@RequiredArgsConstructor
public class TripRequestController {

    private final TripRequestService tripRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse> createTripRequest(
            @Valid @RequestBody TripRequestDTO dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        TripRequest request = tripRequestService.createTripRequest(dto, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Trip request created successfully", mapTripRequest(request)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse> getMyTripRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Page<TripRequest> requests = tripRequestService.getMyTripRequests(userDetails.getId(), PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.ok(requests.map(this::mapTripRequest)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getTripRequest(@PathVariable Long id) {
        TripRequest request = tripRequestService.getTripRequestById(id);
        return ResponseEntity.ok(ApiResponse.ok(mapTripRequest(request)));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse> cancelTripRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        TripRequest request = tripRequestService.getTripRequestById(id);
        if (!request.getTraveler().getId().equals(userDetails.getId()) && !userDetails.getRole().equals("ADMIN")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("You can only cancel your own trip requests"));
        }
        request = tripRequestService.updateStatus(id, TripRequest.TripRequestStatus.CANCELLED);
        return ResponseEntity.ok(ApiResponse.ok("Trip request cancelled successfully", mapTripRequest(request)));
    }

    @GetMapping("/open")
    public ResponseEntity<ApiResponse> getOpenRequests(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<TripRequest> requests = tripRequestService.getOpenRequests(search, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok(requests.map(this::mapTripRequest)));
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<ApiResponse> getDashboardStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(tripRequestService.getTravelerDashboardStats(userDetails.getId())));
    }

    private Map<String, Object> mapTripRequest(TripRequest r) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("travelerId", r.getTraveler().getId());
        map.put("travelerName", r.getTraveler().getName());
        map.put("fromLocation", r.getFromLocation());
        map.put("destination", r.getDestination());
        map.put("startDate", r.getStartDate());
        map.put("endDate", r.getEndDate());
        map.put("numberOfDays", r.getNumberOfDays());
        map.put("travelersCount", r.getTravelersCount());
        map.put("budget", r.getBudget());
        map.put("currency", r.getCurrency());
        map.put("travelType", r.getTravelType());
        map.put("travelStyle", r.getTravelStyle());
        map.put("accommodationPreference", r.getAccommodationPreference());
        map.put("transportPreference", r.getTransportPreference());
        map.put("interests", r.getInterests());
        map.put("specialRequirements", r.getSpecialRequirements());
        map.put("status", r.getStatus().name());
        map.put("proposalCount", r.getProposalCount());
        map.put("createdAt", r.getCreatedAt());
        map.put("updatedAt", r.getUpdatedAt());
        return map;
    }
}
