package com.vibesync.backend;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
public class VibePostController {
    private static final long IDENTITY_UNLOCK_MESSAGE_THRESHOLD = 50L;

    @Autowired private VibePostRepository postRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private PostLikeRepository postLikeRepository;
    @Autowired private CommentRepository commentRepository;
    @Autowired private FriendRequestRepository friendRequestRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private JwtUtil jwtUtil;

    @PostMapping("/create")
    public ResponseEntity<String> createPost(@RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody Map<String, String> requestBody) {
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error: Unauthorized");
        }

        String tokenValue = token.substring(7).trim();
        if (tokenValue.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error: Unauthorized");
        }

        String email = jwtUtil.extractEmail(tokenValue);
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error: Invalid token.");
        }

        String content = requestBody.get("content");
        String musicUri = requestBody.get("musicUri");
        String musicTitle = requestBody.get("musicTitle");
        String musicArtist = requestBody.get("musicArtist");
        String musicPreview = requestBody.get("musicPreview");
        String musicAlbumCover = requestBody.get("musicAlbumCover");

        VibePost post = new VibePost();
        post.setContent(content);
        post.setMusicUri(musicUri);
        post.setMusicTitle(musicTitle);
        post.setMusicArtist(musicArtist);
        post.setMusicPreview(musicPreview);
        post.setMusicAlbumCover(musicAlbumCover);
        post.setUser(user);
        postRepository.save(post);
        return ResponseEntity.ok("Vibe Posted! 🚀");
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(@PathVariable Long postId,
            @RequestHeader("Authorization") String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        String email = jwtUtil.extractEmail(token.substring(7));
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token."));
        }

        VibePost post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Post not found."));
        }

        PostLike existingLike = postLikeRepository.findByUserIdAndPostId(user.getId(), postId).orElse(null);
        boolean liked;
        if (existingLike != null) {
            postLikeRepository.delete(existingLike);
            liked = false;
        } else {
            PostLike postLike = new PostLike();
            postLike.setUser(user);
            postLike.setPost(post);
            postLikeRepository.save(postLike);
            liked = true;
        }

        long likeCount = postLikeRepository.countByPostId(postId);
        Map<String, Object> response = new HashMap<>();
        response.put("liked", liked);
        response.put("likeCount", likeCount);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{postId}/comment")
    public ResponseEntity<?> addComment(@PathVariable Long postId,
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> body) {
        if (token == null || !token.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        String content = body.getOrDefault("content", "").trim();
        if (content.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Comment cannot be empty."));
        }

        String email = jwtUtil.extractEmail(token.substring(7));
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token."));
        }

        VibePost post = postRepository.findById(postId).orElse(null);
        if (post == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Post not found."));
        }

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setContent(content);
        commentRepository.save(comment);

        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping("/{postId}/comments")
    public List<Map<String, Object>> getPostComments(
            @PathVariable Long postId,
            @RequestHeader(value = "Authorization", required = false) String token) {
        User currentUser = getUserFromToken(token);
        Long currentUserId = currentUser != null ? currentUser.getId() : null;

        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream().map(comment -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", comment.getId());
            dto.put("content", comment.getContent());
            dto.put("createdAt", comment.getCreatedAt());

            User author = comment.getUser();
            Map<String, Object> userObj = new HashMap<>();
            if (author != null) {
                Long authorId = author.getId();
                boolean isSelf = currentUserId != null && currentUserId.equals(authorId);
                boolean unlocked = isSelf || isIdentityUnlocked(currentUserId, authorId);
                VibeProfile authorProfile = profileRepository.findByUserId(authorId).orElse(null);

                userObj.put("id", authorId);
                userObj.put("fullName", unlocked ? author.getFullName() : "Anonymous");
                userObj.put("profilePicUrl", unlocked && authorProfile != null ? authorProfile.getProfilePicUrl() : null);
                userObj.put("identityUnlocked", unlocked);
                userObj.put("defaultAvatarSeed", String.valueOf(authorId));
            }
            dto.put("user", userObj);
            return dto;
        }).toList();
    }

    @GetMapping("/all")
        public ResponseEntity<?> getAllPosts(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam(value = "limit", required = false, defaultValue = "5") Integer limit,
            @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset) {
        try {
            if (token == null || token.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing authorization header"));
            }
            
            if (!token.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token format"));
            }
            
            String tokenValue = token.substring(7).trim();
            if (tokenValue.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Empty token"));
            }
            
            String email = jwtUtil.extractEmail(tokenValue);
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token"));
            }
            
            User currentUser = userRepository.findByEmail(email);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }

            // Get friends
            List<FriendRequest> friendRequests = friendRequestRepository.findAllFriends(currentUser.getId());
            List<Long> friendIds = friendRequests.stream()
                .map(fr -> fr.getSender().getId().equals(currentUser.getId()) ? fr.getReceiver().getId() : fr.getSender().getId())
                .toList();

            // Create mutable list and add self
            List<Long> allUserIds = new ArrayList<>(friendIds);
            allUserIds.add(currentUser.getId());

            Pageable pageable = buildPageable(limit, offset);
            List<VibePost> posts = postRepository.findByUserIdInOrderByCreatedAtDesc(allUserIds, pageable).getContent();
            final Long currentUserId = currentUser.getId();

            return ResponseEntity.ok(posts.stream().map(post -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", post.getId());
                dto.put("content", post.getContent());
                dto.put("musicUri", post.getMusicUri());
                dto.put("musicTitle", post.getMusicTitle());
                dto.put("musicArtist", post.getMusicArtist());
                dto.put("musicPreview", post.getMusicPreview());
                dto.put("musicAlbumCover", post.getMusicAlbumCover());
                dto.put("createdAt", post.getCreatedAt());
                dto.put("likeCount", postLikeRepository.countByPostId(post.getId()));
                dto.put("likedByCurrentUser", postLikeRepository.existsByUserIdAndPostId(currentUserId, post.getId()));
                dto.put("commentCount", commentRepository.countByPostId(post.getId()));
                if (post.getUser() != null) {
                    Long postUserId = post.getUser().getId();
                    boolean isSelfPost = currentUserId.equals(postUserId);
                    long messageCount = isSelfPost ? IDENTITY_UNLOCK_MESSAGE_THRESHOLD : messageRepository.countMessagesBetween(currentUserId, postUserId);
                    boolean identityUnlocked = isSelfPost || messageCount >= IDENTITY_UNLOCK_MESSAGE_THRESHOLD;
                    VibeProfile profile = profileRepository.findByUserId(postUserId).orElse(null);
                    Map<String, Object> userObj = new HashMap<>();
                    userObj.put("id", postUserId);
                    String displayName = identityUnlocked ? post.getUser().getFullName() : "Anonymous";
                    userObj.put("fullName", displayName);
                    userObj.put("profilePicUrl", identityUnlocked && profile != null ? profile.getProfilePicUrl() : null);
                    userObj.put("identityUnlocked", identityUnlocked);
                    userObj.put("defaultAvatarSeed", String.valueOf(postUserId));
                    dto.put("user", userObj);
                    dto.put("messageCount", messageCount);
                }
                return dto;
            }).toList());
        } catch (Exception e) {
            System.err.println("Error fetching posts: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/explore")
        public ResponseEntity<?> getExplorePosts(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam(value = "limit", required = false, defaultValue = "5") Integer limit,
            @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset) {
        try {
            User currentUser = null;
            if (token != null && !token.isBlank() && token.startsWith("Bearer ")) {
                String tokenValue = token.substring(7).trim();
                String email = jwtUtil.extractEmail(tokenValue);
                if (email != null && !email.isBlank()) {
                    currentUser = userRepository.findByEmail(email);
                }
            }

            Pageable pageable = buildPageable(limit, offset);
            List<VibePost> posts = postRepository.findAllByOrderByCreatedAtDesc(pageable).getContent();
            
            // Build the accepted connection set once for the current user
            final Long currentUserId = currentUser != null ? currentUser.getId() : null;
            final Set<Long> acceptedFriendIds = new HashSet<>();
            if (currentUserId != null) {
                List<FriendRequest> acceptedConnections = friendRequestRepository.findAllFriends(currentUserId);
                for (FriendRequest fr : acceptedConnections) {
                    Long friendId = fr.getSender().getId().equals(currentUserId) ? fr.getReceiver().getId() : fr.getSender().getId();
                    acceptedFriendIds.add(friendId);
                }
            }

            return ResponseEntity.ok(posts.stream().map(post -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", post.getId());
                dto.put("content", post.getContent());
                dto.put("musicUri", post.getMusicUri());
                dto.put("musicTitle", post.getMusicTitle());
                dto.put("musicArtist", post.getMusicArtist());
                dto.put("musicPreview", post.getMusicPreview());
                dto.put("musicAlbumCover", post.getMusicAlbumCover());
                dto.put("createdAt", post.getCreatedAt());
                dto.put("likeCount", postLikeRepository.countByPostId(post.getId()));
                dto.put("likedByCurrentUser", currentUserId != null && postLikeRepository.existsByUserIdAndPostId(currentUserId, post.getId()));
                dto.put("commentCount", commentRepository.countByPostId(post.getId()));
                if (post.getUser() != null) {
                    Long postUserId = post.getUser().getId();
                    boolean isSelfPost = currentUserId != null && currentUserId.equals(postUserId);
                    boolean isConnected = currentUserId != null && acceptedFriendIds.contains(postUserId);
                    long messageCount = (currentUserId != null && (isSelfPost || isConnected))
                            ? messageRepository.countMessagesBetween(currentUserId, postUserId)
                            : 0;
                    boolean identityUnlocked = isSelfPost || (isConnected && messageCount >= IDENTITY_UNLOCK_MESSAGE_THRESHOLD);
                    VibeProfile profile = profileRepository.findByUserId(postUserId).orElse(null);
                    Map<String, Object> userObj = new HashMap<>();
                    userObj.put("id", postUserId);
                    String displayName = identityUnlocked ? post.getUser().getFullName() : "Anonymous";
                    userObj.put("fullName", displayName);
                    userObj.put("profilePicUrl", identityUnlocked && profile != null ? profile.getProfilePicUrl() : null);
                    userObj.put("identityUnlocked", identityUnlocked);
                    userObj.put("defaultAvatarSeed", String.valueOf(postUserId));
                    dto.put("user", userObj);
                    dto.put("messageCount", messageCount);
                }
                return dto;
            }).toList());
        } catch (Exception e) {
            System.err.println("Error fetching explore posts: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/activity")
    public ResponseEntity<?> getActivity(@RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || token.isBlank() || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing or invalid authorization header"));
            }
            String tokenValue = token.substring(7).trim();
            String email = jwtUtil.extractEmail(tokenValue);
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token"));
            }
            User currentUser = userRepository.findByEmail(email);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }

            List<Map<String, Object>> activities = new ArrayList<>();
            Long currentUserId = currentUser.getId();

            List<FriendRequest> pendingRequests = friendRequestRepository.findByReceiverIdAndStatus(currentUser.getId(), FriendRequest.FriendRequestStatus.PENDING);
            for (FriendRequest fr : pendingRequests) {
                Long senderId = fr.getSender().getId();
                boolean isSelfActor = currentUserId.equals(senderId);
                boolean isConnectedActor = !isSelfActor && isConnected(currentUserId, senderId);
                long messageCount = (isSelfActor || isConnectedActor) ? messageRepository.countMessagesBetween(currentUserId, senderId) : 0;
                boolean isMatchedActor = !isSelfActor && isConnectedActor && messageCount >= IDENTITY_UNLOCK_MESSAGE_THRESHOLD;
                boolean identityUnlocked = isSelfActor || isMatchedActor;
                VibeProfile senderProfile = profileRepository.findByUserId(senderId).orElse(null);
                Map<String, Object> item = new HashMap<>();
                item.put("type", "friend_request");
                item.put("requestId", fr.getId());
                item.put("senderId", senderId);
                item.put("userId", senderId);
                item.put("isSelf", isSelfActor);
                item.put("userName", identityUnlocked ? fr.getSender().getFullName() : "Anonymous");
                item.put("identityUnlocked", identityUnlocked);
                item.put("isMatched", isMatchedActor);
                item.put("defaultAvatarSeed", String.valueOf(senderId));
                item.put("profilePicUrl", identityUnlocked && senderProfile != null ? senderProfile.getProfilePicUrl() : null);
                item.put("action", "sent you a connection request");
                item.put("confirmable", true);
                item.put("createdAt", fr.getCreatedAt());
                activities.add(item);
            }

            List<Comment> recentComments = commentRepository.findTop5ByPostUserIdOrderByCreatedAtDesc(currentUser.getId());
            for (Comment comment : recentComments) {
                Long actorId = comment.getUser().getId();
                boolean isSelfActor = currentUserId.equals(actorId);
                boolean isConnectedActor = !isSelfActor && isConnected(currentUserId, actorId);
                long messageCount = (isSelfActor || isConnectedActor) ? messageRepository.countMessagesBetween(currentUserId, actorId) : 0;
                boolean isMatchedActor = !isSelfActor && isConnectedActor && messageCount >= IDENTITY_UNLOCK_MESSAGE_THRESHOLD;
                boolean identityUnlocked = isSelfActor || isMatchedActor;
                VibeProfile actorProfile = profileRepository.findByUserId(actorId).orElse(null);
                Map<String, Object> item = new HashMap<>();
                item.put("type", "comment");
                item.put("userId", actorId);
                item.put("isSelf", isSelfActor);
                item.put("userName", identityUnlocked ? comment.getUser().getFullName() : "Anonymous");
                item.put("identityUnlocked", identityUnlocked);
                item.put("isMatched", isMatchedActor);
                item.put("defaultAvatarSeed", String.valueOf(actorId));
                item.put("profilePicUrl", identityUnlocked && actorProfile != null ? actorProfile.getProfilePicUrl() : null);
                item.put("action", "commented on your vibe");
                item.put("createdAt", comment.getCreatedAt());
                activities.add(item);
            }

            List<PostLike> recentLikes = postLikeRepository.findTop5ByPostUserIdOrderByCreatedAtDesc(currentUser.getId());
            for (PostLike like : recentLikes) {
                Long actorId = like.getUser().getId();
                boolean isSelfActor = currentUserId.equals(actorId);
                boolean isConnectedActor = !isSelfActor && isConnected(currentUserId, actorId);
                long messageCount = (isSelfActor || isConnectedActor) ? messageRepository.countMessagesBetween(currentUserId, actorId) : 0;
                boolean isMatchedActor = !isSelfActor && isConnectedActor && messageCount >= IDENTITY_UNLOCK_MESSAGE_THRESHOLD;
                boolean identityUnlocked = isSelfActor || isMatchedActor;
                VibeProfile actorProfile = profileRepository.findByUserId(actorId).orElse(null);
                Map<String, Object> item = new HashMap<>();
                item.put("type", "like");
                item.put("userId", actorId);
                item.put("isSelf", isSelfActor);
                item.put("userName", identityUnlocked ? like.getUser().getFullName() : "Anonymous");
                item.put("identityUnlocked", identityUnlocked);
                item.put("isMatched", isMatchedActor);
                item.put("defaultAvatarSeed", String.valueOf(actorId));
                item.put("profilePicUrl", identityUnlocked && actorProfile != null ? actorProfile.getProfilePicUrl() : null);
                item.put("action", "liked your vibe");
                item.put("createdAt", like.getCreatedAt());
                activities.add(item);
            }

            activities.sort((a, b) -> {
                OffsetDateTime aCreated = convertToOffsetDateTime(a.get("createdAt"));
                OffsetDateTime bCreated = convertToOffsetDateTime(b.get("createdAt"));
                return bCreated.compareTo(aCreated);
            });

            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    private OffsetDateTime convertToOffsetDateTime(Object value) {
        if (value instanceof OffsetDateTime odt) {
            return odt;
        }
        if (value instanceof LocalDateTime ldt) {
            return ldt.atOffset(ZoneOffset.UTC);
        }
        return OffsetDateTime.now(ZoneOffset.UTC);
    }

    @GetMapping("/my-posts")
        public List<Map<String, Object>> getMyPosts(
            @RequestHeader("Authorization") String token,
            @RequestParam(value = "limit", required = false, defaultValue = "5") Integer limit,
            @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset) {
        if (token == null || !token.startsWith("Bearer ")) {
            return List.of();
        }
        String email = jwtUtil.extractEmail(token.substring(7));
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return List.of();
        }
        Pageable pageable = buildPageable(limit, offset);
        return postRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable).getContent().stream().map(post -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", post.getId());
            dto.put("content", post.getContent());
            dto.put("musicUri", post.getMusicUri());
            dto.put("musicTitle", post.getMusicTitle());
            dto.put("musicArtist", post.getMusicArtist());
            dto.put("musicPreview", post.getMusicPreview());
            dto.put("musicAlbumCover", post.getMusicAlbumCover());
            dto.put("createdAt", post.getCreatedAt());
            dto.put("userId", user.getId());
            dto.put("userName", user.getFullName());
            return dto;
        }).toList();
    }

    @GetMapping("/my-posts/count")
    public Map<String, Object> getMyPostCount(@RequestHeader("Authorization") String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return Map.of("count", 0);
        }
        String email = jwtUtil.extractEmail(token.substring(7));
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return Map.of("count", 0);
        }
        return Map.of("count", postRepository.countByUserId(user.getId()));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getPostsForUser(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam(value = "limit", required = false, defaultValue = "5") Integer limit,
            @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset) {
        User targetUser = userRepository.findById(userId).orElse(null);
        if (targetUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        User viewer = getUserFromToken(token);
        Long viewerId = viewer != null ? viewer.getId() : null;

        boolean isSelf = viewerId != null && viewerId.equals(userId);
        boolean isMatched = viewerId != null && buildMatchedUserIds(viewerId).contains(userId);

        // Only self and matched users can view posts on profile modal.
        if (!isSelf && !isMatched) {
            return ResponseEntity.ok(List.of());
        }

        boolean isConnected = isConnected(viewerId, userId);
        long messageCount = (viewerId != null && (isSelf || isConnected))
                ? messageRepository.countMessagesBetween(viewerId, userId)
                : 0;
        boolean identityUnlocked = isSelf || isMatched || (isConnected && messageCount >= IDENTITY_UNLOCK_MESSAGE_THRESHOLD);
        VibeProfile profile = profileRepository.findByUserId(userId).orElse(null);

        Pageable pageable = buildPageable(limit, offset);
        List<Map<String, Object>> posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).getContent().stream().map(post -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", post.getId());
            dto.put("content", post.getContent());
            dto.put("musicUri", post.getMusicUri());
            dto.put("musicTitle", post.getMusicTitle());
            dto.put("musicArtist", post.getMusicArtist());
            dto.put("musicPreview", post.getMusicPreview());
            dto.put("musicAlbumCover", post.getMusicAlbumCover());
            dto.put("createdAt", post.getCreatedAt());

            Map<String, Object> userObj = new HashMap<>();
            userObj.put("id", userId);
            userObj.put("fullName", identityUnlocked ? targetUser.getFullName() : "Anonymous");
            userObj.put("profilePicUrl", identityUnlocked && profile != null ? profile.getProfilePicUrl() : null);
            userObj.put("identityUnlocked", identityUnlocked);
            userObj.put("defaultAvatarSeed", String.valueOf(userId));

            dto.put("user", userObj);
            dto.put("messageCount", messageCount);
            return dto;
        }).toList();

        return ResponseEntity.ok(posts);
    }

    private User getUserFromToken(String token) {
        if (token == null || token.isBlank() || !token.startsWith("Bearer ")) {
            return null;
        }
        String tokenValue = token.substring(7).trim();
        if (tokenValue.isBlank()) {
            return null;
        }
        String email = jwtUtil.extractEmail(tokenValue);
        if (email == null || email.isBlank()) {
            return null;
        }
        return userRepository.findByEmail(email);
    }

    private Pageable buildPageable(Integer requestedLimit, Integer requestedOffset) {
        int limit = requestedLimit == null ? 5 : Math.max(1, Math.min(requestedLimit, 25));
        int offset = requestedOffset == null ? 0 : Math.max(0, requestedOffset);
        int page = offset / limit;
        return PageRequest.of(page, limit);
    }

    private boolean isIdentityUnlocked(Long currentUserId, Long otherUserId) {
        if (currentUserId == null || otherUserId == null) {
            return false;
        }
        if (currentUserId.equals(otherUserId)) {
            return true;
        }
        Optional<FriendRequest> friendship = friendRequestRepository.findBetweenUsers(currentUserId, otherUserId);
        if (friendship.isEmpty() || !friendship.get().getStatus().equals(FriendRequest.FriendRequestStatus.ACCEPTED)) {
            return false;
        }
        long messageCount = messageRepository.countMessagesBetween(currentUserId, otherUserId);
        return messageCount >= IDENTITY_UNLOCK_MESSAGE_THRESHOLD;
    }

    private boolean isConnected(Long currentUserId, Long otherUserId) {
        if (currentUserId == null || otherUserId == null || currentUserId.equals(otherUserId)) {
            return false;
        }
        Optional<FriendRequest> friendship = friendRequestRepository.findBetweenUsers(currentUserId, otherUserId);
        return friendship.isPresent() && friendship.get().getStatus().equals(FriendRequest.FriendRequestStatus.ACCEPTED);
    }

    private Set<Long> buildMatchedUserIds(Long currentUserId) {
        Set<Long> matchedUserIds = new HashSet<>();
        if (currentUserId == null) {
            return matchedUserIds;
        }
        try {
            for (MatchProjection match : profileRepository.findTopMatchesHybrid(currentUserId)) {
                if (match.getUserId() != null) {
                    matchedUserIds.add(match.getUserId());
                }
            }
        } catch (Exception ignored) {
            // Fallback match sources below.
        }
        if (matchedUserIds.isEmpty()) {
            try {
                for (MatchProjection match : profileRepository.findTopMatches(currentUserId)) {
                    if (match.getUserId() != null) {
                        matchedUserIds.add(match.getUserId());
                    }
                }
            } catch (Exception ignored) {
                // Continue to the final fallback.
            }
        }
        if (matchedUserIds.isEmpty()) {
            try {
                for (MatchProjection match : profileRepository.findTopMatchesWithoutVectors(currentUserId)) {
                    if (match.getUserId() != null) {
                        matchedUserIds.add(match.getUserId());
                    }
                }
            } catch (Exception ignored) {
                // Return whatever we collected.
            }
        }
        return matchedUserIds;
    }
}