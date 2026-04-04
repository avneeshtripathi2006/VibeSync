package com.vibesync.backend;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AiService aiService; // 👈 Inject the new service

    @PostMapping("/update")
    public ResponseEntity<String> updateProfile(@RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody VibeProfile profileData) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error: Not authorized.");
            }
            String jwt = token.substring(7);
            String email = jwtUtil.extractEmail(jwt);
            User user = userRepository.findByEmail(email);

            String vectorString = aiService.getEmbedding(profileData.getBio());

            profileRepository.saveWithVector(
                    profileData.getBio(),
                    profileData.getVibeTags(),
                    user.getId(),
                    vectorString,
                    profileData.getProfilePicUrl());

            return ResponseEntity.ok("Vibe Saved Successfully!");

        } catch (Exception e) {
            System.out.println("Save Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not update vibe. Try logging out and in.");
        }
    }

    @CrossOrigin(origins = "http://localhost:5173") // 👈 Add this here too
    @GetMapping("/my")
    public Map<String, Object> getMyProfile(@RequestHeader("Authorization") String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                System.out.println("Blocked: No valid token header found.");
                return null;
            }
            String jwt = token.substring(7);
            String email = jwtUtil.extractEmail(jwt);
            User user = userRepository.findByEmail(email);

            System.out.println("Searching profile for User: " + email); // 👈 Debug 1

            VibeProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);

            Map<String, Object> response = new java.util.HashMap<>();
            response.put("fullName", user.getFullName());

            if (profile != null) {
                System.out.println("Found Bio: " + profile.getBio()); // 👈 Debug 2
                response.put("id", profile.getId());
                response.put("bio", profile.getBio());
                response.put("vibeTags", profile.getVibeTags());
                response.put("profilePicUrl", profile.getProfilePicUrl());
                return response;
            } else {
                System.out.println("No profile found in DB for this user!"); // 👈 Debug 3
                response.put("bio", null);
                response.put("vibeTags", null);
                response.put("profilePicUrl", null);
                return response;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @GetMapping("/matches")
    public List<MatchProjection> getMatches(@RequestHeader("Authorization") String token) {

        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return null; // or throw a custom "Unauthorized" error
            }
            String jwt = token.substring(7);
            String email = jwtUtil.extractEmail(jwt);
            User user = userRepository.findByEmail(email);

            return profileRepository.findTopMatches(user.getId());
        } catch (Exception e) {
            return null;
        }
    }
}
