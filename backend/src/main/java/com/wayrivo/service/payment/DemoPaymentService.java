package com.wayrivo.service.payment;

import com.wayrivo.entity.Booking;
import com.wayrivo.entity.PaymentTransaction;
import com.wayrivo.exception.BadRequestException;
import com.wayrivo.exception.ResourceNotFoundException;
import com.wayrivo.repository.BookingRepository;
import com.wayrivo.repository.PaymentTransactionRepository;
import com.wayrivo.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DemoPaymentService implements PaymentService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public PaymentTransaction createPaymentOrder(Booking booking, BigDecimal amount, String currency) {
        String txnRef = "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String orderId = "ORDER_" + System.currentTimeMillis();

        PaymentTransaction txn = PaymentTransaction.builder()
                .booking(booking)
                .transactionReference(txnRef)
                .gatewayOrderId(orderId)
                .amount(amount != null ? amount : booking.getTotalAmount())
                .currency(currency != null ? currency : "INR")
                .status(PaymentTransaction.PaymentStatus.PENDING)
                .gatewayProvider("WAYRIVO_SECURE_ESCROW_DEMO")
                .notes("Escrow payment initialized for booking " + booking.getBookingReference())
                .build();

        return paymentTransactionRepository.save(txn);
    }

    @Override
    @Transactional
    public PaymentTransaction verifyAndConfirmPayment(Long bookingId, String transactionReference, String paymentMethod, String notes) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        PaymentTransaction txn;
        if (transactionReference != null && !transactionReference.isBlank()) {
            txn = paymentTransactionRepository.findByTransactionReference(transactionReference)
                    .orElse(null);
        } else {
            txn = null;
        }

        if (txn == null) {
            String txnRef = "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            txn = PaymentTransaction.builder()
                    .booking(booking)
                    .transactionReference(txnRef)
                    .gatewayOrderId("ORDER_" + System.currentTimeMillis())
                    .amount(booking.getTotalAmount())
                    .currency("INR")
                    .build();
        }

        txn.setPaymentMethod(paymentMethod != null ? paymentMethod : "UPI / NetBanking (Escrow Protected)");
        txn.setGatewayPaymentId("PAY_" + UUID.randomUUID().toString().substring(0, 10).toUpperCase());
        txn.setStatus(PaymentTransaction.PaymentStatus.PAID);
        txn.setNotes(notes != null ? notes : "Payment verified and held safely in WayRivo Escrow until trip completion.");
        txn = paymentTransactionRepository.save(txn);

        // Update booking statuses
        booking.setPaymentStatus(Booking.PaymentStatus.PAID);
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Send notifications
        notificationService.createNotification(
            booking.getTraveler().getId(),
            "Payment Confirmed",
            "Payment of ₹" + txn.getAmount() + " for booking " + booking.getBookingReference() + " was successful! Your trip is confirmed.",
            "PAYMENT"
        );

        notificationService.createNotification(
            booking.getProposal().getExpert().getUser().getId(),
            "Trip Booked & Paid",
            "Payment received for booking " + booking.getBookingReference() + " (₹" + txn.getAmount() + "). Please prepare the itinerary.",
            "BOOKING"
        );

        return txn;
    }

    @Override
    public Map<String, Object> getPaymentConfig() {
        return Map.of(
            "gatewayMode", "TEST_ESCROW",
            "supportedMethods", new String[]{"UPI", "Credit/Debit Card", "Net Banking", "Razorpay / Stripe Demo"},
            "escrowGuaranteed", true,
            "currency", "INR"
        );
    }
}
