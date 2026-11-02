package com.wayrivo.controller;

import com.wayrivo.dto.response.ApiResponse;
import com.wayrivo.entity.*;
import com.wayrivo.security.CustomUserDetails;
import com.wayrivo.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final TripRequestService tripRequestService;
    private final BookingService bookingService;
    private final ReviewService reviewService;
    private final AuditLogService auditLogService;

    @GetMapping("/dashboard-stats")
    public ResponseEntity<ApiResponse> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getDashboardStats()));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse> getAnalytics() {
        Map<String, Object> stats = adminService.getDashboardStats();
        long totalTrips = Long.parseLong(stats.getOrDefault("totalTripRequests", "0").toString());
        long totalProposals = Long.parseLong(stats.getOrDefault("totalProposals", "0").toString());
        long totalBookings = Long.parseLong(stats.getOrDefault("totalBookings", "0").toString());
        BigDecimal totalRev = stats.get("totalRevenue") instanceof BigDecimal ? (BigDecimal) stats.get("totalRevenue") : BigDecimal.ZERO;

        double avgProposalsPerTrip = totalTrips > 0 ? (double) totalProposals / totalTrips : 0.0;
        double conversionRate = totalTrips > 0 ? ((double) totalBookings / totalTrips) * 100.0 : 0.0;
        BigDecimal avgBookingValue = totalBookings > 0 ? totalRev.divide(BigDecimal.valueOf(totalBookings), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        Map<String, Object> analytics = new HashMap<>(stats);
        analytics.put("avgProposalsPerTrip", Math.round(avgProposalsPerTrip * 10.0) / 10.0);
        analytics.put("conversionRate", Math.round(conversionRate * 10.0) / 10.0);
        analytics.put("avgBookingValue", avgBookingValue);
        analytics.put("platformHealth", "OPTIMAL");

        return ResponseEntity.ok(ApiResponse.ok(analytics));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AuditLog> logs = auditLogService.getAuditLogs(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<User> users = adminService.getUsers(search, role, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok(users.map(this::mapUser)));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = adminService.updateUserStatus(id, status);
        auditLogService.logAction(userDetails.getId(), userDetails.getName(), "UPDATE_STATUS", "USER", id, "Changed status to " + status, "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("User status updated", mapUser(user)));
    }

    @GetMapping("/experts")
    public ResponseEntity<ApiResponse> getExperts(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ExpertProfile> experts = adminService.getExperts(status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(experts.map(this::mapExpert)));
    }

    @PatchMapping("/experts/{id}/verification")
    public ResponseEntity<ApiResponse> updateExpertVerification(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ExpertProfile expert = adminService.updateExpertVerification(id, status);
        auditLogService.logAction(userDetails.getId(), userDetails.getName(), "UPDATE_VERIFICATION", "EXPERT", id, "Verification status set to " + status, "127.0.0.1");
        return ResponseEntity.ok(ApiResponse.ok("Expert verification updated", mapExpert(expert)));
    }

    @GetMapping("/trip-requests")
    public ResponseEntity<ApiResponse> getAllTripRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<TripRequest> requests = tripRequestService.getAllTripRequests(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok(requests.map(this::mapTripRequest)));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Booking> bookings = bookingService.getAllBookings(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok(bookings.map(this::mapBooking)));
    }

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Review> reviews = reviewService.getAllReviews(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(reviews.map(this::mapReview)));
    }

    private Map<String, Object> mapUser(User u) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", u.getId());
        map.put("name", u.getName());
        map.put("email", u.getEmail());
        map.put("phone", u.getPhone());
        map.put("role", u.getRole().name());
        map.put("status", u.getStatus().name());
        map.put("createdAt", u.getCreatedAt());
        return map;
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
        map.put("specializations", ep.getSpecializations());
        map.put("verificationStatus", ep.getVerificationStatus().name());
        map.put("rating", ep.getRating());
        map.put("totalReviews", ep.getTotalReviews());
        map.put("createdAt", ep.getCreatedAt());
        return map;
    }

    private Map<String, Object> mapBooking(Booking b) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", b.getId());
        map.put("bookingReference", b.getBookingReference());
        map.put("travelerId", b.getTraveler().getId());
        map.put("travelerName", b.getTraveler().getName());
        map.put("proposalId", b.getProposal().getId());
        map.put("proposalTitle", b.getProposal().getTitle());
        map.put("expertName", b.getProposal().getExpert().getUser().getName());
        map.put("organizationName", b.getProposal().getExpert().getOrganizationName());
        map.put("destination", b.getProposal().getTripRequest().getDestination());
        map.put("travelersCount", b.getTravelersCount());
        map.put("totalAmount", b.getTotalAmount());
        map.put("bookingDate", b.getBookingDate());
        map.put("travelStartDate", b.getTravelStartDate());
        map.put("travelEndDate", b.getTravelEndDate());
        map.put("status", b.getStatus().name());
        map.put("paymentStatus", b.getPaymentStatus().name());
        map.put("createdAt", b.getCreatedAt());
        return map;
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
        return map;
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
