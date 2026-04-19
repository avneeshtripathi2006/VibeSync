package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final int MAX_MESSAGE_CHARS = 2000;

    @Autowired
    private MessageRepository messageRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private FriendRequestRepository friendRequestRepository;

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            return null;
        }
        return userRepository.findByEmail(email);
    }

    @PostMapping("/send")
    public Message sendMessage(@RequestHeader("Authorization") String token, @RequestBody Message msg) {
        if (token == null || !token.startsWith("Bearer "))
            return null;

        User sender = getAuthenticatedUser();
        if (sender == null || msg == null || msg.getReceiverId() == null) {
            return null;
        }

        String content = msg.getContent();
        if (content == null || content.isBlank() || content.length() > MAX_MESSAGE_CHARS) {
            return null;
        }

        // Check if users are friends (accepted request)
        Optional<FriendRequest> friendRequest = friendRequestRepository.findBetweenUsers(sender.getId(), msg.getReceiverId());
        if (friendRequest.isEmpty() || !friendRequest.get().getStatus().equals(FriendRequest.FriendRequestStatus.ACCEPTED)) {
            return null; // Cannot send message if not friends
        }

        msg.setSenderId(sender.getId());
        msg.setIsRead(false);
        Message saved = messageRepository.save(msg);
        messagingTemplate.convertAndSend("/topic/messages/" + saved.getReceiverId(), saved);
        messagingTemplate.convertAndSend("/topic/messages/" + saved.getSenderId(), saved);
        return saved;
    }

    @GetMapping("/history/{receiverId}")
    public List<Message> getHistory(
            @RequestHeader("Authorization") String token,
            @PathVariable Long receiverId,
            @RequestParam(value = "limit", required = false, defaultValue = "30") Integer limit,
            @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset) {
        if (token == null || !token.startsWith("Bearer "))
            return null;

        User sender = getAuthenticatedUser();
        if (sender == null) {
            return null;
        }

        // Check if users are friends
        Optional<FriendRequest> friendRequest = friendRequestRepository.findBetweenUsers(sender.getId(), receiverId);
        if (friendRequest.isEmpty() || !friendRequest.get().getStatus().equals(FriendRequest.FriendRequestStatus.ACCEPTED)) {
            return null; // Cannot access chat history if not friends
        }

        int safeLimit = Math.max(1, Math.min(limit != null ? limit : 30, 100));
        int safeOffset = Math.max(offset != null ? offset : 0, 0);
        int page = safeOffset / safeLimit;
        Pageable pageable = PageRequest.of(page, safeLimit);

        List<Message> newestFirst = messageRepository.findChatHistoryPage(sender.getId(), receiverId, pageable);
        List<Message> oldestFirst = new ArrayList<>(newestFirst);
        oldestFirst.sort((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()));
        return oldestFirst;
    }

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void processMessage(@Payload Message chatMessage, Principal principal) {
        if (chatMessage == null || principal == null || principal.getName() == null || principal.getName().isBlank()) {
            return;
        }

        User sender = userRepository.findByEmail(principal.getName());
        if (sender == null || chatMessage.getReceiverId() == null) {
            return;
        }

        String content = chatMessage.getContent();
        if (content == null || content.isBlank() || content.length() > MAX_MESSAGE_CHARS) {
            return;
        }

        // Never trust senderId from the client payload.
        chatMessage.setSenderId(sender.getId());

        // Check if users are friends
        Optional<FriendRequest> friendRequest = friendRequestRepository.findBetweenUsers(sender.getId(), chatMessage.getReceiverId());
        if (friendRequest.isEmpty() || !friendRequest.get().getStatus().equals(FriendRequest.FriendRequestStatus.ACCEPTED)) {
            return; // Cannot send message if not friends
        }

        chatMessage.setIsRead(false);
        // 1. Save to Database
        Message savedMsg = messageRepository.save(chatMessage);

        // 2. Push to the specific "room" for this receiver
        messagingTemplate.convertAndSend("/topic/messages/" + savedMsg.getReceiverId(), savedMsg);

        // 3. Push back to the sender
        messagingTemplate.convertAndSend("/topic/messages/" + savedMsg.getSenderId(), savedMsg);
    }

    @GetMapping("/count/{receiverId}")
    public Long getCount(@RequestHeader("Authorization") String token, @PathVariable Long receiverId) {
        if (token == null || !token.startsWith("Bearer "))
            return 0L;
        User sender = getAuthenticatedUser();
        if (sender == null) {
            return 0L;
        }
        return messageRepository.countMessagesBetween(sender.getId(), receiverId);
    }

    // Mark messages as read
    @PostMapping("/mark-read/{senderId}")
    public Map<String, Object> markMessagesAsRead(@RequestHeader("Authorization") String token, @PathVariable Long senderId) {
        if (token == null || !token.startsWith("Bearer "))
            return Map.of("error", "Unauthorized");

        User receiver = getAuthenticatedUser();
        if (receiver == null) {
            return Map.of("error", "Unauthorized");
        }

        // Get unread messages from sender to receiver
        List<Message> unreadMessages = messageRepository.findBySenderIdAndReceiverIdAndIsReadFalse(senderId, receiver.getId());

        // Mark all as read
        LocalDateTime now = LocalDateTime.now();
        for (Message msg : unreadMessages) {
            msg.setIsRead(true);
            msg.setReadAt(now);
            messageRepository.save(msg);
        }

        // Notify sender that messages were read
        messagingTemplate.convertAndSend("/topic/messages/" + senderId, 
            Map.of(
                "type", "READ_RECEIPT",
                "readBy", receiver.getId(),
                "readAt", now
            )
        );

        return Map.of("success", true, "markedAsRead", unreadMessages.size());
    }

    // Get unread message count for a user from a specific sender
    @GetMapping("/unread/{senderId}")
    public Map<String, Object> getUnreadCount(@RequestHeader("Authorization") String token, @PathVariable Long senderId) {
        if (token == null || !token.startsWith("Bearer "))
            return Map.of("error", "Unauthorized");

        User receiver = getAuthenticatedUser();
        if (receiver == null) {
            return Map.of("error", "Unauthorized");
        }

        long unreadCount = messageRepository.countBySenderIdAndReceiverIdAndIsReadFalse(senderId, receiver.getId());
        return Map.of("unreadCount", unreadCount);
    }

    @GetMapping("/unread-total")
    public Map<String, Object> getTotalUnreadCount(@RequestHeader("Authorization") String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return Map.of("error", "Unauthorized");
        }

        User receiver = getAuthenticatedUser();
        if (receiver == null) {
            return Map.of("error", "Unauthorized");
        }

        long unreadCount = messageRepository.countByReceiverIdAndIsReadFalse(receiver.getId());
        return Map.of("unreadCount", unreadCount);
    }

    @GetMapping("/conversations-meta")
    public List<Map<String, Object>> getConversationMeta(@RequestHeader("Authorization") String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return List.of();
        }

        User currentUser = getAuthenticatedUser();
        if (currentUser == null) {
            return List.of();
        }

        Long currentUserId = currentUser.getId();
        Map<Long, LocalDateTime> latestByPartner = new HashMap<>();
        for (Object[] row : messageRepository.findLatestMessageTimestampByPartner(currentUserId)) {
            Long partnerId = (Long) row[0];
            LocalDateTime latest = (LocalDateTime) row[1];
            latestByPartner.put(partnerId, latest);
        }

        Map<Long, Long> unreadBySender = new HashMap<>();
        for (Object[] row : messageRepository.findUnreadCountsGroupedBySender(currentUserId)) {
            Long senderId = (Long) row[0];
            Long unread = (Long) row[1];
            unreadBySender.put(senderId, unread);
        }

        List<FriendRequest> friends = friendRequestRepository.findAllFriends(currentUserId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (FriendRequest fr : friends) {
            Long partnerId = fr.getSender().getId().equals(currentUserId) ? fr.getReceiver().getId() : fr.getSender().getId();
            Map<String, Object> item = new HashMap<>();
            item.put("userId", partnerId);
            item.put("lastMessageAt", latestByPartner.get(partnerId));
            item.put("unreadCount", unreadBySender.getOrDefault(partnerId, 0L));
            result.add(item);
        }
        return result;
    }
}