package com.wayrivo.repository;

import com.wayrivo.entity.Proposal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProposalRepository extends JpaRepository<Proposal, Long> {
    List<Proposal> findByTripRequestId(Long tripRequestId);
    Page<Proposal> findByExpertId(Long expertId, Pageable pageable);
    long countByTripRequestId(Long tripRequestId);
    long countByExpertId(Long expertId);
    boolean existsByTripRequestIdAndExpertIdAndStatusNot(Long tripRequestId, Long expertId, Proposal.ProposalStatus status);

    @Query("SELECT COUNT(p) FROM Proposal p WHERE p.expert.id = :expertId AND p.status = :status")
    long countByExpertIdAndStatus(@Param("expertId") Long expertId, @Param("status") Proposal.ProposalStatus status);

    @Modifying
    @Query("UPDATE Proposal p SET p.status = com.wayrivo.entity.Proposal.ProposalStatus.REJECTED, p.updatedAt = CURRENT_TIMESTAMP WHERE p.tripRequest.id = :requestId AND p.id <> :selectedId AND p.status = com.wayrivo.entity.Proposal.ProposalStatus.SUBMITTED")
    void rejectOtherProposals(@Param("requestId") Long requestId, @Param("selectedId") Long selectedId);

    @Query("SELECT COUNT(p) FROM Proposal p JOIN p.tripRequest t WHERE t.traveler.id = :travelerId")
    long countProposalsForTraveler(@Param("travelerId") Long travelerId);
}
