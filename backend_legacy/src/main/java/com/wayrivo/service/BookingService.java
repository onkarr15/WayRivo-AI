package com.wayrivo.service;

import com.wayrivo.entity.Booking;
import com.wayrivo.entity.ExpertProfile;
import com.wayrivo.exception.BadRequestException;
import com.wayrivo.exception.ResourceNotFoundException;
import com.wayrivo.exception.UnauthorizedException;
import com.wayrivo.repository.BookingRepository;
import com.wayrivo.repository.ExpertProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ExpertProfileRepository expertProfileRepository;
    private final NotificationService notificationService;

    public Page<Booking> getTravelerBookings(Long travelerId, Pageable pageable) {
        return bookingRepository.findByTravelerId(travelerId, pageable);
    }

    public Page<Booking> getExpertBookings(Long userId, Pageable pageable) {
        ExpertProfile expert = expertProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Expert profile not found"));
        return bookingRepository.findByExpertId(expert.getId(), pageable);
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }

    public Page<Booking> getAllBookings(Pageable pageable) {
        return bookingRepository.findAll(pageable);
    }

    @Transactional
    public Booking updateBookingStatus(Long id, String status, Long userId) {
        Booking booking = getBookingById(id);

        // Verify ownership
        boolean isTraveler = booking.getTraveler().getId().equals(userId);
        boolean isExpert = booking.getProposal().getExpert().getUser().getId().equals(userId);

        if (!isTraveler && !isExpert) {
            throw new UnauthorizedException("You don't have permission to update this booking");
        }

        Booking.BookingStatus newStatus;
        try {
            newStatus = Booking.BookingStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid booking status");
        }

        // Validate transitions
        validateStatusTransition(booking.getStatus(), newStatus);

        booking.setStatus(newStatus);
        booking = bookingRepository.save(booking);

        // Notify the other party
        Long notifyUserId = isTraveler ?
            booking.getProposal().getExpert().getUser().getId() :
            booking.getTraveler().getId();

        notificationService.createNotification(notifyUserId,
            "Booking Updated",
            "Booking " + booking.getBookingReference() + " status changed to " + newStatus,
            "BOOKING");

        return booking;
    }

    private void validateStatusTransition(Booking.BookingStatus current, Booking.BookingStatus target) {
        switch (current) {
            case PENDING:
                if (target != Booking.BookingStatus.CONFIRMED && target != Booking.BookingStatus.CANCELLED) {
                    throw new BadRequestException("Pending booking can only be confirmed or cancelled");
                }
                break;
            case CONFIRMED:
                if (target != Booking.BookingStatus.COMPLETED && target != Booking.BookingStatus.CANCELLED) {
                    throw new BadRequestException("Confirmed booking can only be completed or cancelled");
                }
                break;
            case COMPLETED:
            case CANCELLED:
                throw new BadRequestException("Cannot change status of a " + current + " booking");
            default:
                throw new BadRequestException("Invalid current status");
        }
    }

    public long countTravelerBookings(Long travelerId) {
        return bookingRepository.countByTravelerId(travelerId);
    }

    public long countCompletedBookings(Long travelerId) {
        return bookingRepository.countByTravelerIdAndStatus(travelerId, Booking.BookingStatus.COMPLETED);
    }
}
