package com.vibesync.backend;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173")

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
    public String updateProfile(@RequestHeader("Authorization") String token, @RequestBody VibeProfile profileData) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return null; // or throw a custom "Unauthorized" error
            }
            String jwt = token.substring(7);
            String email = jwtUtil.extractEmail(jwt);
            User user = userRepository.findByEmail(email);

            // 1. Check if profile exists
            VibeProfile profile = profileRepository.findByUserId(user.getId()).orElse(new VibeProfile());

            // 2. Update basic info
            profile.setBio(profileData.getBio());
            profile.setVibeTags(profileData.getVibeTags());
            profile.setUser(user);

            // 3. Generate NEW AI Vector
            String vectorString = aiService.getEmbedding(profileData.getBio());

            // if (vectorString != null) {
            // profile.setBioVector(vectorString); // 👈 Java handles this as a String now
            // }

            // // 4. Save (This will now handle both New and Existing rows)
            // profileRepository.save(profile);

            // return "Vibe Updated Successfully!";
            profileRepository.saveWithVector(
                    profileData.getBio(),
                    profileData.getVibeTags(),
                    user.getId(),
                    vectorString);

            return "Vibe Saved Successfully!";

        } catch (Exception e) {
            // This is important: if it fails, we need to know WHY
            System.out.println("Save Error: " + e.getMessage());
            return "Error: Could not update vibe. Try logging out and in.";
        }
    }

    @CrossOrigin(origins = "http://localhost:5173") // 👈 Add this here too
    @GetMapping("/my")
    public VibeProfile getMyProfile(@RequestHeader("Authorization") String token) {
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

            if (profile != null) {
                System.out.println("Found Bio: " + profile.getBio()); // 👈 Debug 2
                return profile;
            } else {
                System.out.println("No profile found in DB for this user!"); // 👈 Debug 3
                return new VibeProfile(); // Return empty object instead of null
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
