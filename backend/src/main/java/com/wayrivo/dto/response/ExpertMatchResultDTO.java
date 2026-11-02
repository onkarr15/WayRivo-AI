package com.wayrivo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpertMatchResultDTO {
    private Long expertId;
    private Long userId;
    private String name;
    private String organizationName;
    private String city;
    private String state;
    private Integer yearsOfExperience;
    private Double rating;
    private Integer totalReviews;
    private String specializations;
    private String verificationStatus;
    private int matchScore; // 0 to 100
    private List<String> matchReasons;
    private Double destinationMatchScore;
    private Double travelStyleScore;
    private Double budgetScore;
}
