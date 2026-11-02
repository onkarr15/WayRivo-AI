package com.wayrivo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TripRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traveler_id", nullable = false)
    private User traveler;

    @Column(name = "from_location", length = 200)
    private String fromLocation;

    @Column(nullable = false, length = 200)
    private String destination;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "number_of_days")
    private Integer numberOfDays;

    @Column(name = "travelers_count")
    @Builder.Default
    private Integer travelersCount = 1;

    private BigDecimal budget;

    @Column(length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "travel_type", length = 50)
    private String travelType;

    @Column(name = "travel_style", length = 50)
    private String travelStyle;

    @Column(name = "accommodation_preference", length = 50)
    private String accommodationPreference;

    @Column(name = "transport_preference", length = 100)
    private String transportPreference;

    @Column(length = 500)
    private String interests;

    @Column(name = "special_requirements", columnDefinition = "TEXT")
    private String specialRequirements;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private TripRequestStatus status = TripRequestStatus.OPEN;

    @Column(name = "proposal_count")
    @Builder.Default
    private Integer proposalCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum TripRequestStatus {
        DRAFT, SUBMITTED, OPEN, PROPOSALS_RECEIVED, PROPOSAL_SELECTED, BOOKED, COMPLETED, CANCELLED
    }
}
