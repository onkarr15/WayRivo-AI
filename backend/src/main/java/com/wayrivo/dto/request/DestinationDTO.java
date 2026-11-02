package com.wayrivo.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DestinationDTO {
    private String name;
    private String country;
    private String state;
    private String description;
    private String imageUrl;
    private String bestTimeToVisit;
    private BigDecimal averageBudget;
    private String currency;
}
