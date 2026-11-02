package com.wayrivo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProposalDTO {
    @NotNull(message = "Trip request ID is required")
    private Long tripRequestId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Total price is required")
    private BigDecimal totalPrice;

    private BigDecimal pricePerPerson;
    private String itinerary;
    private String accommodationDetails;
    private String transportationDetails;
    private String activities;
    private String inclusions;
    private String exclusions;
    private String cancellationPolicy;
    private LocalDate validityDate;
}
