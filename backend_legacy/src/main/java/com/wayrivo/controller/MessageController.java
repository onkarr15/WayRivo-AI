package com.wayrivo.controller;

import com.wayrivo.dto.request.MessageDTO;
import com.wayrivo.dto.response.ApiResponse;
import com.wayrivo.entity.Message;
import com.wayrivo.security.CustomUserDetails;
import com.wayrivo.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<ApiResponse> sendMessage(
            @Valid @RequestBody MessageDTO dto,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Message message = messageService.sendMessage(dto, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Message sent", mapMessage(message)));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse> getConversations(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(messageService.getConversationList(userDetails.getId())));
    }

    @GetMapping("/conversation/{partnerId}")
    public ResponseEntity<ApiResponse> getConversation(
            @PathVariable Long partnerId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Message> messages = messageService.getConversation(userDetails.getId(), partnerId);
        messageService.markConversationAsRead(userDetails.getId(), partnerId);
        return ResponseEntity.ok(ApiResponse.ok(messages.stream().map(this::mapMessage).collect(Collectors.toList())));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse> getUnreadCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("count", messageService.getUnreadCount(userDetails.getId()))));
    }

    private Map<String, Object> mapMessage(Message m) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("senderId", m.getSender().getId());
        map.put("senderName", m.getSender().getName());
        map.put("receiverId", m.getReceiver().getId());
        map.put("receiverName", m.getReceiver().getName());
        map.put("message", m.getMessage());
        map.put("readStatus", m.getReadStatus());
        map.put("createdAt", m.getCreatedAt());
        return map;
    }
}
