package com.wayrivo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MessageDTO {
    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    private Long tripRequestId;

    @NotBlank(message = "Message cannot be empty")
    private String message;
}
