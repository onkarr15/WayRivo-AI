package com.wayrivo.service;

import com.wayrivo.entity.ExpertProfile;
import com.wayrivo.entity.User;
import com.wayrivo.exception.BadRequestException;
import com.wayrivo.exception.ResourceNotFoundException;
import com.wayrivo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ExpertProfileRepository expertProfileRepository;
    private final TripRequestRepository tripRequestRepository;
    private final ProposalRepository proposalRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final DestinationRepository destinationRepository;
    private final NotificationService notificationService;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalTravelers", userRepository.countByRole(User.Role.TRAVELER));
        stats.put("totalExperts", userRepository.countByRole(User.Role.EXPERT));
        stats.put("verifiedExperts", expertProfileRepository.countByVerificationStatus(ExpertProfile.VerificationStatus.VERIFIED));
        stats.put("pendingExperts", expertProfileRepository.countByVerificationStatus(ExpertProfile.VerificationStatus.PENDING));
        stats.put("totalTripRequests", tripRequestRepository.count());
        stats.put("totalProposals", proposalRepository.count());
        stats.put("totalBookings", bookingRepository.count());
        stats.put("totalReviews", reviewRepository.count());
        stats.put("totalDestinations", destinationRepository.count());
        java.math.BigDecimal totalRevenue = bookingRepository.findAll().stream()
                .map(com.wayrivo.entity.Booking::getTotalAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        stats.put("totalRevenue", totalRevenue);
        return stats;
    }

    public Map<String, Object> getPublicStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("verifiedExperts", expertProfileRepository.countByVerificationStatus(ExpertProfile.VerificationStatus.VERIFIED));
        stats.put("tripsCreated", tripRequestRepository.count());
        stats.put("proposalsSubmitted", proposalRepository.count());
        stats.put("travelersServed", userRepository.countByRole(User.Role.TRAVELER));
        return stats;
    }

    public Page<User> getUsers(String search, String role, Pageable pageable) {
        if (search != null && !search.isBlank() && role != null && !role.isBlank()) {
            return userRepository.searchUsersByRole(search, User.Role.valueOf(role.toUpperCase()), pageable);
        }
        if (search != null && !search.isBlank()) {
            return userRepository.searchUsers(search, pageable);
        }
        if (role != null && !role.isBlank()) {
            return userRepository.findByRole(User.Role.valueOf(role.toUpperCase()), pageable);
        }
        return userRepository.findAll(pageable);
    }

    @Transactional
    public User updateUserStatus(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        try {
            user.setStatus(User.UserStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status");
        }
        return userRepository.save(user);
    }

    public Page<ExpertProfile> getExperts(String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            return expertProfileRepository.findByVerificationStatus(
                ExpertProfile.VerificationStatus.valueOf(status.toUpperCase()), pageable);
        }
        return expertProfileRepository.findAll(pageable);
    }

    @Transactional
    public ExpertProfile updateExpertVerification(Long expertId, String status) {
        ExpertProfile expert = expertProfileRepository.findById(expertId)
                .orElseThrow(() -> new ResourceNotFoundException("Expert not found"));
        try {
            expert.setVerificationStatus(ExpertProfile.VerificationStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid verification status");
        }
        expert = expertProfileRepository.save(expert);

        String notifTitle = status.equalsIgnoreCase("VERIFIED") ?
            "Verification Approved!" : "Verification Update";
        String notifMsg = status.equalsIgnoreCase("VERIFIED") ?
            "Congratulations! Your expert profile has been verified. You can now submit proposals." :
            "Your verification status has been updated to: " + status;

        notificationService.createNotification(expert.getUser().getId(), notifTitle, notifMsg, "VERIFICATION");

        return expert;
    }

    public List<ExpertProfile> getFeaturedExperts() {
        return expertProfileRepository.findTopRatedExperts(PageRequest.of(0, 6));
    }
}
