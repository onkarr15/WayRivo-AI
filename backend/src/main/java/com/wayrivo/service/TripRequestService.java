package com.wayrivo.service;

import com.wayrivo.dto.request.TripRequestDTO;
import com.wayrivo.entity.TripRequest;
import com.wayrivo.entity.User;
import com.wayrivo.exception.ResourceNotFoundException;
import com.wayrivo.exception.UnauthorizedException;
import com.wayrivo.repository.ProposalRepository;
import com.wayrivo.repository.TripRequestRepository;
import com.wayrivo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TripRequestService {

    private final TripRequestRepository tripRequestRepository;
    private final UserRepository userRepository;
    private final ProposalRepository proposalRepository;
    private final NotificationService notificationService;

    @Transactional
    public TripRequest createTripRequest(TripRequestDTO dto, Long travelerId) {
        User traveler = userRepository.findById(travelerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (traveler.getRole() != User.Role.TRAVELER) {
            throw new UnauthorizedException("Only travelers can create trip requests");
        }

        TripRequest request = TripRequest.builder()
                .traveler(traveler)
                .fromLocation(dto.getFromLocation())
                .destination(dto.getDestination())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .numberOfDays(dto.getNumberOfDays())
                .travelersCount(dto.getTravelersCount() != null ? dto.getTravelersCount() : 1)
                .budget(dto.getBudget())
                .currency(dto.getCurrency() != null ? dto.getCurrency() : "INR")
                .travelType(dto.getTravelType())
                .travelStyle(dto.getTravelStyle())
                .accommodationPreference(dto.getAccommodationPreference())
                .transportPreference(dto.getTransportPreference())
                .interests(dto.getInterests())
                .specialRequirements(dto.getSpecialRequirements())
                .status(TripRequest.TripRequestStatus.OPEN)
                .proposalCount(0)
                .build();

        request = tripRequestRepository.save(request);

        notificationService.createNotification(travelerId,
                "Trip Request Created",
                "Your trip request to " + request.getDestination() + " has been submitted successfully.",
                "TRIP_REQUEST");

        return request;
    }

    public Page<TripRequest> getMyTripRequests(Long travelerId, Pageable pageable) {
        return tripRequestRepository.findByTravelerId(travelerId, pageable);
    }

    public TripRequest getTripRequestById(Long id) {
        return tripRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trip request not found"));
    }

    public TripRequest getTripRequestForTraveler(Long id, Long travelerId) {
        TripRequest request = getTripRequestById(id);
        if (!request.getTraveler().getId().equals(travelerId)) {
            throw new UnauthorizedException("You don't have access to this trip request");
        }
        return request;
    }

    public Page<TripRequest> getOpenRequests(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return tripRequestRepository.searchOpenRequests(search, pageable);
        }
        return tripRequestRepository.findOpenRequests(pageable);
    }

    public Page<TripRequest> getAllTripRequests(Pageable pageable) {
        return tripRequestRepository.findAll(pageable);
    }

    @Transactional
    public TripRequest updateStatus(Long id, TripRequest.TripRequestStatus status) {
        TripRequest request = getTripRequestById(id);
        request.setStatus(status);
        return tripRequestRepository.save(request);
    }

    public Map<String, Object> getTravelerDashboardStats(Long travelerId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("activeRequests", tripRequestRepository.countActiveByTravelerId(travelerId));
        stats.put("totalRequests", tripRequestRepository.countByTravelerId(travelerId));
        stats.put("proposalsReceived", proposalRepository.countProposalsForTraveler(travelerId));
        return stats;
    }
}
