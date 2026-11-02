package com.wayrivo.repository;

import com.wayrivo.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByBookingId(Long bookingId);
    boolean existsByBookingId(Long bookingId);
    Page<Review> findByExpertId(Long expertId, Pageable pageable);
    List<Review> findByExpertId(Long expertId);
    long countByExpertId(Long expertId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.expert.id = :expertId")
    Double calculateAverageRating(@Param("expertId") Long expertId);

    @Query("SELECT r FROM Review r ORDER BY r.createdAt DESC")
    List<Review> findRecentReviews(Pageable pageable);
}
