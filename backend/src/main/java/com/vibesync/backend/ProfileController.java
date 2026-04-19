package com.vibesync.backend;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private static final long IDENTITY_UNLOCK_MESSAGE_THRESHOLD = 50L;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private AiService aiService;

    // Get current authenticated user
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;
        String email = authentication.getName();
        return userRepository.findByEmail(email);
    }

    // Enhanced comprehensive profile update - ALL fields editable
    @PostMapping("/update-comprehensive")
    public ResponseEntity<Map<String, Object>> updateComprehensiveProfile(@RequestBody Map<String, Object> profileData) {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }

            // Update User fields
            if (profileData.containsKey("fullName")) {
                user.setFullName((String) profileData.get("fullName"));
            }
            if (profileData.containsKey("email")) {
                user.setEmail((String) profileData.get("email"));
            }
            if (profileData.containsKey("phone")) {
                user.setPhone((String) profileData.get("phone"));
            }
            if (profileData.containsKey("location")) {
                user.setLocation((String) profileData.get("location"));
            }
            if (profileData.containsKey("dateOfBirth")) {
                try {
                    user.setDateOfBirth(LocalDate.parse((String) profileData.get("dateOfBirth")));
                } catch (Exception e) {
                    System.out.println("Invalid DOB format: " + e.getMessage());
                }
            }
            if (profileData.containsKey("interests")) {
                user.setInterests((String) profileData.get("interests"));
            }
            if (profileData.containsKey("youtubeSubscriptions")) {
                user.setYoutubeSubscriptions((String) profileData.get("youtubeSubscriptions"));
            }
            if (profileData.containsKey("spotifyArtists")) {
                user.setSpotifyArtists((String) profileData.get("spotifyArtists"));
            } else if (profileData.containsKey("musicArtists")) {
                // Backward compatibility for older frontend payload key.
                user.setSpotifyArtists((String) profileData.get("musicArtists"));
            }

            userRepository.save(user);

            // Update VibeProfile fields
            VibeProfile profile = profileRepository.findByUserId(user.getId()).orElse(new VibeProfile());
            profile.setUser(user);

            if (profileData.containsKey("bio")) {
                String bio = (String) profileData.get("bio");
                if (bio != null && bio.length() > 4000) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Bio too long (max 4000 characters)"));
                }
                profile.setBio(bio);
            }

            if (profileData.containsKey("vibeTags")) {
                profile.setVibeTags((String) profileData.get("vibeTags"));
            }

            if (profileData.containsKey("hobbies")) {
                profile.setHobbies((String) profileData.get("hobbies"));
            }

            if (profileData.containsKey("musicTaste")) {
                profile.setMusicTaste((String) profileData.get("musicTaste"));
            }

            if (profileData.containsKey("learningGoals")) {
                profile.setLearningGoals((String) profileData.get("learningGoals"));
            }

            if (profileData.containsKey("profilePicUrl")) {
                String pic = (String) profileData.get("profilePicUrl");
                if (pic != null && !pic.isBlank()) {
                    String t = pic.trim();
                    if (t.regionMatches(true, 0, "data:", 0, 5)) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of("error", "Use direct HTTPS link, not data URLs"));
                    }
                    if (t.length() > 2048) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of("error", "Picture URL too long (max 2048 chars)"));
                    }
                }
                profile.setProfilePicUrl(pic != null ? pic.trim() : null);
            }

            // Generate embeddings for bio and comprehensive interests
            if (profileData.containsKey("bio")) {
                String bioVector = aiService.getEmbedding(profile.getBio());
                if (bioVector == null || bioVector.isBlank()) {
                    bioVector = EmbeddingFallback.vectorLiteralFromText(profile.getBio());
                }
                profile.setBioVector(bioVector);
            }

            // Create enriched matching text combining all fields
            String enrichedText = buildEnrichedMatchingText(user, profile);
            profile.setEnrichedMatchingText(enrichedText);

            // Generate comprehensive interests vector
            String interestsVector = aiService.getEmbedding(enrichedText);
            if (interestsVector == null || interestsVector.isBlank()) {
                interestsVector = EmbeddingFallback.vectorLiteralFromText(enrichedText);
            }
            profile.setComprehensiveInterestsVector(interestsVector);
            profile.setLastUpdated(System.currentTimeMillis());

            profileRepository.save(profile);

            return ResponseEntity.ok(Map.of("success", true, "message", "Profile updated completely!"));

        } catch (Exception e) {
            System.out.println("Profile update error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not update profile"));
        }
    }

    // Legacy update endpoint for backward compatibility
    @PostMapping("/update")
    public ResponseEntity<String> updateProfile(@RequestBody VibeProfile profileData) {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error: User not found.");
            }

            String bio = profileData.getBio();
            if (bio != null && bio.length() > 4000) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: Bio too long (max 4000 chars).");
            }

            String pic = profileData.getProfilePicUrl();
            if (pic != null && !pic.isBlank()) {
                String t = pic.trim();
                if (t.regionMatches(true, 0, "data:", 0, 5)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Error: Use direct HTTPS link, not data URLs.");
                }
                if (t.length() > 2048) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Error: Picture URL too long.");
                }
            }

            String vectorString = aiService.getEmbedding(bio);
            if (vectorString == null || vectorString.isBlank()) {
                vectorString = EmbeddingFallback.vectorLiteralFromText(bio);
            }

            VibeProfile profile = profileRepository.findByUserId(user.getId()).orElse(new VibeProfile());
            profile.setUser(user);
            profile.setBio(bio);
            profile.setVibeTags(profileData.getVibeTags());
            profile.setBioVector(vectorString);
            profile.setProfilePicUrl(pic != null ? pic.trim() : null);

            String enrichedText = buildEnrichedMatchingText(user, profile);
            profile.setEnrichedMatchingText(enrichedText);
            String interestsVector = aiService.getEmbedding(enrichedText);
            if (interestsVector == null || interestsVector.isBlank()) {
                interestsVector = EmbeddingFallback.vectorLiteralFromText(enrichedText);
            }
            profile.setComprehensiveInterestsVector(interestsVector);
            profile.setLastUpdated(System.currentTimeMillis());
            profileRepository.save(profile);

            return ResponseEntity.ok("Vibe Saved Successfully!");

        } catch (Exception e) {
            System.out.println("Save Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not update vibe.");
        }
    }

    // Get comprehensive profile
    @GetMapping("/my")
    public Map<String, Object> getMyProfile() {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return null;
            }

            VibeProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);

            Map<String, Object> response = new HashMap<>();
            response.put("fullName", user.getFullName());
            response.put("email", user.getEmail());
            response.put("phone", user.getPhone());
            response.put("location", user.getLocation());
            response.put("dateOfBirth", user.getDateOfBirth());
            response.put("interests", user.getInterests());
            response.put("youtubeSubscriptions", user.getYoutubeSubscriptions());
            response.put("spotifyArtists", user.getSpotifyArtists());

            if (profile != null) {
                response.put("id", profile.getId());
                response.put("bio", profile.getBio());
                response.put("vibeTags", profile.getVibeTags());
                response.put("profilePicUrl", profile.getProfilePicUrl());
                response.put("hobbies", profile.getHobbies());
                response.put("musicTaste", profile.getMusicTaste());
                response.put("learningGoals", profile.getLearningGoals());
                return response;
            } else {
                response.put("bio", null);
                response.put("vibeTags", null);
                response.put("profilePicUrl", null);
                response.put("hobbies", null);
                response.put("musicTaste", null);
                response.put("learningGoals", null);
                return response;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserProfile(@PathVariable Long userId) {
        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
            }
            if (currentUser.getId().equals(userId)) {
                return ResponseEntity.ok(getMyProfile());
            }

            User otherUser = userRepository.findById(userId).orElse(null);
            if (otherUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            boolean isConnected = isConnected(currentUser.getId(), userId);
            long messageCount = messageRepository.countMessagesBetween(currentUser.getId(), userId);
            boolean showFullProfile = isConnected && messageCount >= IDENTITY_UNLOCK_MESSAGE_THRESHOLD;

            Map<String, Object> response = new HashMap<>();
            response.put("userId", otherUser.getId());
            response.put("isConnected", isConnected);
            response.put("messageCount", messageCount);
            response.put("showFullProfile", showFullProfile);
            response.put("identityUnlocked", showFullProfile);

            VibeProfile profile = profileRepository.findByUserId(otherUser.getId()).orElse(null);
            response.put("defaultAvatarSeed", String.valueOf(otherUser.getId()));

            if (showFullProfile) {
                response.put("fullName", otherUser.getFullName());
                response.put("profilePicUrl", profile != null ? profile.getProfilePicUrl() : null);
                response.put("bio", profile != null ? profile.getBio() : null);
                response.put("vibeTags", profile != null ? profile.getVibeTags() : null);
                response.put("hobbies", profile != null ? profile.getHobbies() : null);
                response.put("musicTaste", profile != null ? profile.getMusicTaste() : null);
                response.put("learningGoals", profile != null ? profile.getLearningGoals() : null);
                response.put("interests", otherUser.getInterests());
                response.put("youtubeSubscriptions", otherUser.getYoutubeSubscriptions());
                response.put("spotifyArtists", otherUser.getSpotifyArtists());
            } else {
                response.put("fullName", "Anonymous Member");
                response.put("profilePicUrl", null);
                // Public profile data remains visible before identity unlock.
                response.put("bio", profile != null ? profile.getBio() : null);
                response.put("vibeTags", profile != null ? profile.getVibeTags() : null);
                response.put("hobbies", profile != null ? profile.getHobbies() : null);
                response.put("musicTaste", profile != null ? profile.getMusicTaste() : null);
                response.put("learningGoals", profile != null ? profile.getLearningGoals() : null);
                response.put("interests", otherUser.getInterests());
                response.put("youtubeSubscriptions", null);
                response.put("spotifyArtists", null);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Could not load user profile"));
        }
    }

    // Get matches with hybrid matching algorithm
    @GetMapping("/matches")
    public List<Map<String, Object>> getMatches() {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return List.of();
            }

            // Try hybrid matching first (bio vector + tag overlap + interest overlap)
            List<MatchProjection> matches = null;
            try {
                matches = profileRepository.findTopMatchesHybrid(user.getId());
            } catch (Exception e) {
                System.out.println("Hybrid matching failed, falling back: " + e.getMessage());
            }

            // Fallback to simple bio vector matching
            if (matches == null || matches.isEmpty()) {
                try {
                    matches = profileRepository.findTopMatches(user.getId());
                } catch (Exception e) {
                    System.out.println("Vector matching failed, falling back: " + e.getMessage());
                }
            }

            // Last fallback: return any profiles
            if (matches == null || matches.isEmpty()) {
                matches = profileRepository.findTopMatchesWithoutVectors(user.getId());
            }

            if (matches == null || matches.isEmpty()) {
                return List.of();
            }

            final Long currentUserId = user.getId();
            return matches.stream().map(match -> {
                Long otherUserId = match.getUserId();
                boolean unlocked = isIdentityUnlocked(currentUserId, otherUserId);
                boolean connected = isConnected(currentUserId, otherUserId);
                long messageCount = messageRepository.countMessagesBetween(currentUserId, otherUserId);
                VibeProfile otherProfile = profileRepository.findByUserId(otherUserId).orElse(null);

                Map<String, Object> dto = new HashMap<>();
                dto.put("userId", otherUserId);
                dto.put("fullName", unlocked ? match.getFullName() : "Anonymous");
                dto.put("bio", match.getBio());
                dto.put("vibeTags", match.getVibeTags());
                dto.put("distance", match.getDistance());
                dto.put("isConnected", connected);
                dto.put("messageCount", messageCount);
                dto.put("identityUnlocked", unlocked);
                dto.put("profilePicUrl", unlocked && otherProfile != null ? otherProfile.getProfilePicUrl() : null);
                dto.put("defaultAvatarSeed", String.valueOf(otherUserId));
                return dto;
            }).toList();
        } catch (Exception e) {
            System.out.println("Matching error: " + e.getMessage());
            e.printStackTrace();
            return List.of();
        }
    }

    private boolean isConnected(Long currentUserId, Long otherUserId) {
        Optional<FriendRequest> friendship = friendRequestRepository.findBetweenUsers(currentUserId, otherUserId);
        return friendship.isPresent() && friendship.get().getStatus().equals(FriendRequest.FriendRequestStatus.ACCEPTED);
    }

    private boolean isIdentityUnlocked(Long currentUserId, Long otherUserId) {
        if (currentUserId == null || otherUserId == null) {
            return false;
        }
        if (currentUserId.equals(otherUserId)) {
            return true;
        }
        if (!isConnected(currentUserId, otherUserId)) {
            return false;
        }
        long messageCount = messageRepository.countMessagesBetween(currentUserId, otherUserId);
        return messageCount >= IDENTITY_UNLOCK_MESSAGE_THRESHOLD;
    }

    // Helper method to build enriched matching text
    private String buildEnrichedMatchingText(User user, VibeProfile profile) {
        StringBuilder sb = new StringBuilder();

        if (user.getFullName() != null) sb.append(user.getFullName()).append(" ");
        if (user.getDateOfBirth() != null) sb.append("dob:").append(user.getDateOfBirth()).append(" ");
        if (user.getLocation() != null) sb.append(user.getLocation()).append(" ");
        if (profile.getBio() != null) sb.append(profile.getBio()).append(" ");
        if (profile.getVibeTags() != null) sb.append(profile.getVibeTags()).append(" ");
        if (profile.getHobbies() != null) sb.append(profile.getHobbies()).append(" ");
        if (profile.getMusicTaste() != null) sb.append(profile.getMusicTaste()).append(" ");
        if (profile.getLearningGoals() != null) sb.append(profile.getLearningGoals()).append(" ");
        if (user.getInterests() != null) sb.append(user.getInterests()).append(" ");
        if (user.getYoutubeSubscriptions() != null) sb.append(user.getYoutubeSubscriptions()).append(" ");
        if (user.getSpotifyArtists() != null) sb.append(user.getSpotifyArtists()).append(" ");

        return sb.toString().trim();
    }
}
