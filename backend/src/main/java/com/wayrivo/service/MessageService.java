package com.wayrivo.service;

import com.wayrivo.dto.request.MessageDTO;
import com.wayrivo.entity.Message;
import com.wayrivo.entity.TripRequest;
import com.wayrivo.entity.User;
import com.wayrivo.exception.ResourceNotFoundException;
import com.wayrivo.repository.MessageRepository;
import com.wayrivo.repository.TripRequestRepository;
import com.wayrivo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final TripRequestRepository tripRequestRepository;
    private final NotificationService notificationService;

    @Transactional
    public Message sendMessage(MessageDTO dto, Long senderId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        User receiver = userRepository.findById(dto.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .message(dto.getMessage())
                .readStatus(false)
                .build();

        if (dto.getTripRequestId() != null) {
            TripRequest tripRequest = tripRequestRepository.findById(dto.getTripRequestId())
                    .orElse(null);
            message.setTripRequest(tripRequest);
        }

        message = messageRepository.save(message);

        notificationService.createNotification(receiver.getId(),
                "New Message",
                "You have a new message from " + sender.getName(),
                "MESSAGE");

        return message;
    }

    public List<Message> getConversation(Long userId1, Long userId2) {
        return messageRepository.findConversation(userId1, userId2);
    }

    @Transactional
    public void markConversationAsRead(Long receiverId, Long senderId) {
        messageRepository.markConversationAsRead(receiverId, senderId);
    }

    public long getUnreadCount(Long userId) {
        return messageRepository.countByReceiverIdAndReadStatus(userId, false);
    }

    public List<Map<String, Object>> getConversationList(Long userId) {
        List<Long> partnerIds = messageRepository.findConversationPartnerIds(userId);
        List<Map<String, Object>> conversations = new ArrayList<>();

        for (Long partnerId : partnerIds) {
            User partner = userRepository.findById(partnerId).orElse(null);
            if (partner == null)
                continue;

            List<Message> msgs = messageRepository.findConversation(userId, partnerId);
            Message lastMsg = msgs.isEmpty() ? null : msgs.get(msgs.size() - 1);

            Map<String, Object> conv = new HashMap<>();
            conv.put("partnerId", partner.getId());
            conv.put("partnerName", partner.getName());
            conv.put("partnerRole", partner.getRole().name());
            conv.put("lastMessage", lastMsg != null ? lastMsg.getMessage() : "");
            conv.put("lastMessageTime", lastMsg != null ? lastMsg.getCreatedAt() : null);
            conv.put("unreadCount", messageRepository.countByReceiverIdAndReadStatus(userId, false));
            conversations.add(conv);
        }

        return conversations;
    }
}
