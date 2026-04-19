package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/friend-request")
public class FriendRequestController {

    private static final long IDENTITY_UNLOCK_MESSAGE_THRESHOLD = 50L;

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private MessageRepository messageRepository;

    // Get current logged-in user
    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String username = auth.getName();
            if (username == null || username.isBlank()) {
                return null;
            }
            User currentUser = userRepository.findByEmail(username);
            return currentUser != null ? currentUser.getId() : null;
        }
        return null;
    }

    // Send a friend request
    @PostMapping("/send/{receiverId}")
    public ResponseEntity<?> sendFriendRequest(@PathVariable Long receiverId) {
        try {
            Long senderId = getCurrentUserId();
            if (senderId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            if (senderId.equals(receiverId)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot send request to yourself"));
            }

            // Check if users exist
            Optional<User> sender = userRepository.findById(senderId);
            Optional<User> receiver = userRepository.findById(receiverId);

            if (sender.isEmpty() || receiver.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Check if there's already an active request
            if (friendRequestRepository.existsActiveFriendRequest(senderId, receiverId)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Friend request already exists"));
            }

            // Create new friend request
            FriendRequest request = new FriendRequest(sender.get(), receiver.get());
            friendRequestRepository.save(request);

            Map<String, Object> response = new HashMap<>();
            response.put("id", request.getId());
            response.put("status", request.getStatus());
            response.put("message", "Friend request sent successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Get pending friend requests (received by current user)
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRequests() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            List<FriendRequest> pendingRequests = friendRequestRepository
                    .findByReceiverIdAndStatus(userId, FriendRequest.FriendRequestStatus.PENDING);

            return ResponseEntity.ok(pendingRequests);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Get pending requests sent by current user
    @GetMapping("/sent")
    public ResponseEntity<?> getSentRequests() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            List<FriendRequest> sentRequests = friendRequestRepository
                    .findBySenderIdAndStatus(userId, FriendRequest.FriendRequestStatus.PENDING);

            return ResponseEntity.ok(sentRequests);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Accept a friend request
    @PostMapping("/{requestId}/accept")
    public ResponseEntity<?> acceptFriendRequest(@PathVariable Long requestId) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            Optional<FriendRequest> requestOpt = friendRequestRepository.findById(requestId);
            if (requestOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            FriendRequest request = requestOpt.get();

            // Verify that current user is the receiver
            if (!request.getReceiver().getId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Not authorized to accept this request"));
            }

            if (!request.getStatus().equals(FriendRequest.FriendRequestStatus.PENDING)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Request is not pending"));
            }

            request.setStatus(FriendRequest.FriendRequestStatus.ACCEPTED);
            friendRequestRepository.save(request);

            Map<String, Object> response = new HashMap<>();
            response.put("id", request.getId());
            response.put("status", request.getStatus());
            response.put("message", "Friend request accepted");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Reject a friend request
    @PostMapping("/{requestId}/reject")
    public ResponseEntity<?> rejectFriendRequest(@PathVariable Long requestId) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            Optional<FriendRequest> requestOpt = friendRequestRepository.findById(requestId);
            if (requestOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            FriendRequest request = requestOpt.get();

            // Verify that current user is the receiver
            if (!request.getReceiver().getId().equals(userId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Not authorized to reject this request"));
            }

            if (!request.getStatus().equals(FriendRequest.FriendRequestStatus.PENDING)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Request is not pending"));
            }

            request.setStatus(FriendRequest.FriendRequestStatus.REJECTED);
            friendRequestRepository.save(request);

            return ResponseEntity.ok(Map.of("message", "Friend request rejected"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Get all friends (accepted requests) for current user
    @GetMapping("/friends")
    public ResponseEntity<?> getFriends() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            List<FriendRequest> friendRequests = friendRequestRepository.findAllFriends(userId);
            List<Map<String, Object>> friends = new ArrayList<>();
            for (FriendRequest fr : friendRequests) {
                User friend = fr.getSender().getId().equals(userId) ? fr.getReceiver() : fr.getSender();
                long messageCount = messageRepository.countMessagesBetween(userId, friend.getId());
                boolean identityUnlocked = messageCount >= IDENTITY_UNLOCK_MESSAGE_THRESHOLD;
                VibeProfile profile = profileRepository.findByUserId(friend.getId()).orElse(null);
                Map<String, Object> friendData = new HashMap<>();
                friendData.put("userId", friend.getId());
                friendData.put("fullName", identityUnlocked ? friend.getFullName() : "Anonymous");
                friendData.put("email", identityUnlocked ? friend.getEmail() : null);
                friendData.put("messageCount", messageCount);
                friendData.put("identityUnlocked", identityUnlocked);
                friendData.put("profilePicUrl", identityUnlocked && profile != null ? profile.getProfilePicUrl() : null);
                friendData.put("defaultAvatarSeed", String.valueOf(friend.getId()));
                friends.add(friendData);
            }
            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Get friendship status between current user and another user
    @GetMapping("/status/{otherUserId}")
    public ResponseEntity<?> getFriendshipStatus(@PathVariable Long otherUserId) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            Optional<FriendRequest> requestOpt = friendRequestRepository.findBetweenUsers(userId, otherUserId);

            Map<String, Object> response = new HashMap<>();
            if (requestOpt.isEmpty()) {
                response.put("status", "NONE");
                response.put("canChat", false);
            } else {
                FriendRequest request = requestOpt.get();
                response.put("status", request.getStatus().toString());
                response.put("canChat", request.getStatus().equals(FriendRequest.FriendRequestStatus.ACCEPTED));

                // If accepted, check if messages unlocked (50+ messages)
                if (request.getStatus().equals(FriendRequest.FriendRequestStatus.ACCEPTED)) {
                    long messageCount = messageRepository.countMessagesBetween(userId, otherUserId);
                    response.put("messagesCount", messageCount);
                    response.put("unlocked", messageCount >= 50);
                }
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Get vibes count - accepted requests received
    @GetMapping("/count/vibes")
    public ResponseEntity<?> getVibesCount() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            long vibesCount = friendRequestRepository.countAcceptedConnections(userId);
            return ResponseEntity.ok(Map.of("vibes", vibesCount));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Get matches count - accepted requests where 50+ messages exchanged
    @GetMapping("/count/matches")
    public ResponseEntity<?> getMatchesCount() {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            List<FriendRequest> friends = friendRequestRepository.findAllFriends(userId);
            long matchesCount = friends.stream()
                    .map(fr -> fr.getSender().getId().equals(userId) ? fr.getReceiver().getId() : fr.getSender().getId())
                    .filter(friendId -> messageRepository.countMessagesBetween(userId, friendId) >= 50)
                    .count();

            return ResponseEntity.ok(Map.of("matches", matchesCount));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Check if two users can chat
    @GetMapping("/can-chat/{otherUserId}")
    public ResponseEntity<?> canChat(@PathVariable Long otherUserId) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            Optional<FriendRequest> requestOpt = friendRequestRepository.findBetweenUsers(userId, otherUserId);

            if (requestOpt.isEmpty() || !requestOpt.get().getStatus().equals(FriendRequest.FriendRequestStatus.ACCEPTED)) {
                return ResponseEntity.ok(Map.of("canChat", false, "reason", "Friend request not accepted"));
            }

            return ResponseEntity.ok(Map.of("canChat", true));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
