package com.wayrivo.repository;

import com.wayrivo.entity.ExpertProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ExpertProfileRepository extends JpaRepository<ExpertProfile, Long> {
    Optional<ExpertProfile> findByUserId(Long userId);

    Page<ExpertProfile> findByVerificationStatus(ExpertProfile.VerificationStatus status, Pageable pageable);

    List<ExpertProfile> findByVerificationStatus(ExpertProfile.VerificationStatus status);

    long countByVerificationStatus(ExpertProfile.VerificationStatus status);

    @Query("SELECT ep FROM ExpertProfile ep WHERE ep.verificationStatus = com.wayrivo.entity.ExpertProfile.VerificationStatus.VERIFIED ORDER BY ep.rating DESC")
    List<ExpertProfile> findTopRatedExperts(Pageable pageable);

    @Query("SELECT ep FROM ExpertProfile ep WHERE ep.verificationStatus = com.wayrivo.entity.ExpertProfile.VerificationStatus.VERIFIED AND " +
           "(LOWER(ep.organizationName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(ep.user.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ExpertProfile> searchVerifiedExperts(@Param("search") String search, Pageable pageable);

    @Query("SELECT ep FROM ExpertProfile ep WHERE " +
           "ep.verificationStatus = com.wayrivo.entity.ExpertProfile.VerificationStatus.VERIFIED AND " +
           "(ep.specializations IS NULL OR LOWER(ep.specializations) LIKE LOWER(CONCAT('%', :destination, '%')))")
    List<ExpertProfile> findMatchingExperts(@Param("destination") String destination);
}
