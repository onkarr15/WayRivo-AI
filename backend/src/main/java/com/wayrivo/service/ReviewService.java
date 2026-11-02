package com.wayrivo.service;

import com.wayrivo.dto.request.ReviewDTO;
import com.wayrivo.entity.*;
import com.wayrivo.exception.*;
import com.wayrivo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final ExpertProfileRepository expertProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public Review createReview(ReviewDTO dto, Long travelerId) {
        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getTraveler().getId().equals(travelerId)) {
            throw new UnauthorizedException("You can only review your own bookings");
        }

        if (booking.getStatus() != Booking.BookingStatus.COMPLETED) {
            throw new BadRequestException("You can only review completed bookings");
        }

        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new ConflictException("Review already exists for this booking");
        }

        ExpertProfile expert = booking.getProposal().getExpert();
        User traveler = userRepository.findById(travelerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Review review = Review.builder()
                .booking(booking)
                .traveler(traveler)
                .expert(expert)
                .rating(dto.getRating())
                .comment(dto.getComment())
                .build();

        review = reviewRepository.save(review);

        // Update expert rating
        Double avgRating = reviewRepository.calculateAverageRating(expert.getId());
        long totalReviews = reviewRepository.countByExpertId(expert.getId());
        expert.setRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);
        expert.setTotalReviews((int) totalReviews);
        expertProfileRepository.save(expert);

        // Notify expert
        notificationService.createNotification(expert.getUser().getId(),
            "New Review Received",
            "You received a " + dto.getRating() + "-star review from " + traveler.getName(),
            "REVIEW");

        return review;
    }

    public List<Review> getReviewsForExpert(Long expertId) {
        return reviewRepository.findByExpertId(expertId);
    }

    public Page<Review> getExpertReviews(Long expertId, Pageable pageable) {
        return reviewRepository.findByExpertId(expertId, pageable);
    }

    public List<Review> getRecentReviews() {
        return reviewRepository.findRecentReviews(PageRequest.of(0, 6));
    }

    public Page<Review> getAllReviews(Pageable pageable) {
        return reviewRepository.findAll(pageable);
    }
}
