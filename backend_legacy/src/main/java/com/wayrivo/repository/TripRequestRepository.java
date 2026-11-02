package com.wayrivo.repository;

import com.wayrivo.entity.TripRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TripRequestRepository extends JpaRepository<TripRequest, Long> {
    Page<TripRequest> findByTravelerId(Long travelerId, Pageable pageable);

    long countByTravelerId(Long travelerId);

    @Query("SELECT t FROM TripRequest t WHERE t.status IN (com.wayrivo.entity.TripRequest.TripRequestStatus.OPEN, com.wayrivo.entity.TripRequest.TripRequestStatus.PROPOSALS_RECEIVED)")
    Page<TripRequest> findOpenRequests(Pageable pageable);

    @Query("SELECT t FROM TripRequest t WHERE t.status IN (com.wayrivo.entity.TripRequest.TripRequestStatus.OPEN, com.wayrivo.entity.TripRequest.TripRequestStatus.PROPOSALS_RECEIVED) AND " +
           "(LOWER(t.destination) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.fromLocation) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<TripRequest> searchOpenRequests(@Param("search") String search, Pageable pageable);

    long countByTravelerIdAndStatus(Long travelerId, TripRequest.TripRequestStatus status);

    @Query("SELECT COUNT(t) FROM TripRequest t WHERE t.traveler.id = :travelerId AND t.status IN (com.wayrivo.entity.TripRequest.TripRequestStatus.OPEN, com.wayrivo.entity.TripRequest.TripRequestStatus.PROPOSALS_RECEIVED, com.wayrivo.entity.TripRequest.TripRequestStatus.SUBMITTED)")
    long countActiveByTravelerId(@Param("travelerId") Long travelerId);
}
