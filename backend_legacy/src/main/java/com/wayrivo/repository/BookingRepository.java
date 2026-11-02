package com.wayrivo.repository;

import com.wayrivo.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    Page<Booking> findByTravelerId(Long travelerId, Pageable pageable);
    Optional<Booking> findByBookingReference(String bookingReference);
    long countByTravelerId(Long travelerId);
    long countByTravelerIdAndStatus(Long travelerId, Booking.BookingStatus status);
    boolean existsByProposalId(Long proposalId);

    @Query("SELECT b FROM Booking b JOIN b.proposal p WHERE p.expert.id = :expertId")
    Page<Booking> findByExpertId(@Param("expertId") Long expertId, Pageable pageable);

    @Query("SELECT COUNT(b) FROM Booking b JOIN b.proposal p WHERE p.expert.id = :expertId")
    long countByExpertId(@Param("expertId") Long expertId);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(b.bookingReference, 9) AS int)), 0) FROM Booking b WHERE b.bookingReference LIKE :prefix")
    int findMaxBookingNumber(@Param("prefix") String prefix);
}
