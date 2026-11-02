package com.wayrivo.controller;

import com.wayrivo.dto.response.ApiResponse;
import com.wayrivo.entity.Booking;
import com.wayrivo.entity.PaymentTransaction;
import com.wayrivo.repository.BookingRepository;
import com.wayrivo.repository.PaymentTransactionRepository;
import com.wayrivo.security.CustomUserDetails;
import com.wayrivo.service.payment.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final BookingRepository bookingRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @GetMapping("/config")
    public ResponseEntity<ApiResponse> getPaymentConfig() {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getPaymentConfig()));
    }

    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse> createOrder(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long bookingId = Long.parseLong(body.get("bookingId").toString());
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));

        if (!booking.getTraveler().getId().equals(userDetails.getId())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("You can only pay for your own bookings"));
        }

        BigDecimal amount = body.containsKey("amount") && body.get("amount") != null ?
                new BigDecimal(body.get("amount").toString()) : booking.getTotalAmount();
        String currency = body.getOrDefault("currency", "INR").toString();

        PaymentTransaction txn = paymentService.createPaymentOrder(booking, amount, currency);
        return ResponseEntity.ok(ApiResponse.ok("Payment order created", mapTransaction(txn)));
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<ApiResponse> verifyPayment(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long bookingId = Long.parseLong(body.get("bookingId").toString());
        String txnRef = body.getOrDefault("transactionReference", "").toString();
        String paymentMethod = body.getOrDefault("paymentMethod", "UPI (WayRivo Secure Escrow)").toString();
        String notes = body.getOrDefault("notes", "Escrow protected payment").toString();

        PaymentTransaction txn = paymentService.verifyAndConfirmPayment(bookingId, txnRef, paymentMethod, notes);
        return ResponseEntity.ok(ApiResponse.ok("Payment successful and verified", mapTransaction(txn)));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse> getTransactionsForBooking(@PathVariable Long bookingId) {
        List<PaymentTransaction> list = paymentTransactionRepository.findByBookingId(bookingId);
        return ResponseEntity.ok(ApiResponse.ok(list.stream().map(this::mapTransaction).collect(Collectors.toList())));
    }

    private Map<String, Object> mapTransaction(PaymentTransaction t) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", t.getId());
        map.put("bookingId", t.getBooking().getId());
        map.put("bookingReference", t.getBooking().getBookingReference());
        map.put("transactionReference", t.getTransactionReference());
        map.put("gatewayOrderId", t.getGatewayOrderId());
        map.put("gatewayPaymentId", t.getGatewayPaymentId());
        map.put("amount", t.getAmount());
        map.put("currency", t.getCurrency());
        map.put("paymentMethod", t.getPaymentMethod());
        map.put("status", t.getStatus().name());
        map.put("gatewayProvider", t.getGatewayProvider());
        map.put("notes", t.getNotes());
        map.put("createdAt", t.getCreatedAt());
        return map;
    }
}
