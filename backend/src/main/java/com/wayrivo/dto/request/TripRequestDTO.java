package com.wayrivo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TripRequestDTO {
    private String fromLocation;

    @NotBlank(message = "Destination is required")
    private String destination;

    private LocalDate startDate;
    private LocalDate endDate;
    private Integer numberOfDays;
    private Integer travelersCount;

    @NotNull(message = "Budget is required")
    private BigDecimal budget;

    private String currency;
    private String travelType;
    private String travelStyle;
    private String accommodationPreference;
    private String transportPreference;
    private String interests;
    private String specialRequirements;
}
