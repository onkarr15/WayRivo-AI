package com.wayrivo.controller;

import com.wayrivo.dto.response.ApiResponse;
import com.wayrivo.entity.Booking;
import com.wayrivo.security.CustomUserDetails;
import com.wayrivo.service.BookingService;
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
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping("/traveler")
    public ResponseEntity<ApiResponse> getTravelerBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Booking> bookings = bookingService.getTravelerBookings(userDetails.getId(), PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok(bookings.map(this::mapBooking)));
    }

    @GetMapping("/expert")
    public ResponseEntity<ApiResponse> getExpertBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Booking> bookings = bookingService.getExpertBookings(userDetails.getId(), PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok(bookings.map(this::mapBooking)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getBooking(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(mapBooking(bookingService.getBookingById(id))));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Booking booking = bookingService.updateBookingStatus(id, status, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Booking status updated", mapBooking(booking)));
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
}
