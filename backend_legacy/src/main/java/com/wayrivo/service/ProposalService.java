package com.wayrivo.service;

import com.wayrivo.dto.request.ProposalDTO;
import com.wayrivo.entity.*;
import com.wayrivo.exception.*;
import com.wayrivo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProposalService {

    private final ProposalRepository proposalRepository;
    private final TripRequestRepository tripRequestRepository;
    private final ExpertProfileRepository expertProfileRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public Proposal createProposal(ProposalDTO dto, Long userId) {
        ExpertProfile expert = expertProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Expert profile not found"));

        if (expert.getVerificationStatus() != ExpertProfile.VerificationStatus.VERIFIED) {
            throw new UnauthorizedException("Only verified experts can submit proposals");
        }

        TripRequest request = tripRequestRepository.findById(dto.getTripRequestId())
                .orElseThrow(() -> new ResourceNotFoundException("Trip request not found"));

        if (request.getStatus() != TripRequest.TripRequestStatus.OPEN &&
                request.getStatus() != TripRequest.TripRequestStatus.PROPOSALS_RECEIVED) {
            throw new BadRequestException("This trip request is no longer accepting proposals");
        }

        boolean alreadySubmitted = proposalRepository.existsByTripRequestIdAndExpertIdAndStatusNot(
                request.getId(), expert.getId(), Proposal.ProposalStatus.WITHDRAWN);
        if (alreadySubmitted) {
            throw new ConflictException("You have already submitted a proposal for this request");
        }

        Proposal proposal = Proposal.builder()
                .tripRequest(request)
                .expert(expert)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .totalPrice(dto.getTotalPrice())
                .pricePerPerson(dto.getPricePerPerson())
                .itinerary(dto.getItinerary())
                .accommodationDetails(dto.getAccommodationDetails())
                .transportationDetails(dto.getTransportationDetails())
                .activities(dto.getActivities())
                .inclusions(dto.getInclusions())
                .exclusions(dto.getExclusions())
                .cancellationPolicy(dto.getCancellationPolicy())
                .validityDate(dto.getValidityDate())
                .status(Proposal.ProposalStatus.SUBMITTED)
                .build();

        proposal = proposalRepository.save(proposal);

        request.setProposalCount(request.getProposalCount() + 1);
        if (request.getStatus() == TripRequest.TripRequestStatus.OPEN) {
            request.setStatus(TripRequest.TripRequestStatus.PROPOSALS_RECEIVED);
        }
        tripRequestRepository.save(request);

        notificationService.createNotification(request.getTraveler().getId(),
                "New Proposal Received",
                "You received a new travel proposal from " + expert.getOrganizationName() + " for your trip to "
                        + request.getDestination(),
                "PROPOSAL");

        return proposal;
    }

    public List<Proposal> getProposalsForRequest(Long tripRequestId) {
        return proposalRepository.findByTripRequestId(tripRequestId);
    }

    public Page<Proposal> getExpertProposals(Long userId, Pageable pageable) {
        ExpertProfile expert = expertProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Expert profile not found"));
        return proposalRepository.findByExpertId(expert.getId(), pageable);
    }

    public Proposal getProposalById(Long id) {
        return proposalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proposal not found"));
    }

    @Transactional
    public Booking selectProposal(Long proposalId, Long travelerId) {
        Proposal proposal = getProposalById(proposalId);
        TripRequest request = proposal.getTripRequest();

        if (!request.getTraveler().getId().equals(travelerId)) {
            throw new UnauthorizedException("You don't own this trip request");
        }

        if (request.getStatus() != TripRequest.TripRequestStatus.OPEN &&
                request.getStatus() != TripRequest.TripRequestStatus.PROPOSALS_RECEIVED) {
            throw new BadRequestException("A proposal has already been selected for this request");
        }

        if (proposal.getStatus() != Proposal.ProposalStatus.SUBMITTED) {
            throw new BadRequestException("This proposal is no longer available for selection");
        }

        // Select this proposal
        proposal.setStatus(Proposal.ProposalStatus.SELECTED);
        proposalRepository.save(proposal);

        // Reject other proposals
        proposalRepository.rejectOtherProposals(request.getId(), proposal.getId());

        // Update trip request status
        request.setStatus(TripRequest.TripRequestStatus.PROPOSAL_SELECTED);
        tripRequestRepository.save(request);

        // Create booking
        String bookingRef = generateBookingReference();
        User traveler = userRepository.findById(travelerId)
                .orElseThrow(() -> new ResourceNotFoundException("Traveler not found"));

        Booking booking = Booking.builder()
                .traveler(traveler)
                .proposal(proposal)
                .bookingReference(bookingRef)
                .travelersCount(request.getTravelersCount())
                .totalAmount(proposal.getTotalPrice())
                .bookingDate(LocalDate.now())
                .travelStartDate(request.getStartDate())
                .travelEndDate(request.getEndDate())
                .status(Booking.BookingStatus.PENDING)
                .paymentStatus(Booking.PaymentStatus.PENDING)
                .build();

        booking = bookingRepository.save(booking);

        // Update request status to booked
        request.setStatus(TripRequest.TripRequestStatus.BOOKED);
        tripRequestRepository.save(request);

        // Notify expert
        notificationService.createNotification(proposal.getExpert().getUser().getId(),
                "Proposal Selected!",
                "Your proposal '" + proposal.getTitle() + "' has been selected. Booking reference: " + bookingRef,
                "BOOKING");

        // Notify traveler
        notificationService.createNotification(travelerId,
                "Booking Created",
                "Your booking " + bookingRef + " has been created. Total: ₹" + proposal.getTotalPrice(),
                "BOOKING");

        return booking;
    }

    private String generateBookingReference() {
        int year = Year.now().getValue();
        String prefix = "WR-" + year + "-";
        try {
            int maxNum = bookingRepository.findMaxBookingNumber(prefix + "%");
            return prefix + String.format("%06d", maxNum + 1);
        } catch (Exception e) {
            return prefix + String.format("%06d", 1);
        }
    }

    public Map<String, Object> getExpertDashboardStats(Long userId) {
        ExpertProfile expert = expertProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Expert profile not found"));

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProposals", proposalRepository.countByExpertId(expert.getId()));
        stats.put("acceptedProposals",
                proposalRepository.countByExpertIdAndStatus(expert.getId(), Proposal.ProposalStatus.SELECTED));
        stats.put("activeBookings", bookingRepository.countByExpertId(expert.getId()));
        stats.put("rating", expert.getRating());
        stats.put("totalReviews", expert.getTotalReviews());
        stats.put("verificationStatus", expert.getVerificationStatus().name());
        return stats;
    }
}
