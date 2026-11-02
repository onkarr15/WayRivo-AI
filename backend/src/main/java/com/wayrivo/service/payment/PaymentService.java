package com.wayrivo.service.payment;

import com.wayrivo.entity.Booking;
import com.wayrivo.entity.PaymentTransaction;
import java.math.BigDecimal;
import java.util.Map;

public interface PaymentService {
    PaymentTransaction createPaymentOrder(Booking booking, BigDecimal amount, String currency);
    PaymentTransaction verifyAndConfirmPayment(Long bookingId, String transactionReference, String paymentMethod, String notes);
    Map<String, Object> getPaymentConfig();
}
