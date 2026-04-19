package com.vibesync.backend;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> registerUser(@RequestBody User user) {
        Map<String, String> response = new HashMap<>();

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            response.put("error", "Email is required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        if (user.getPassword() == null || user.getPassword().length() < 6) {
            response.put("error", "Password must be at least 6 characters.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        if (userRepository.findByEmail(user.getEmail()) != null) {
            response.put("error", "Email already in use!");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getFullName() == null || user.getFullName().isBlank()) {
            user.setFullName(user.getEmail().split("@")[0]);
        }
        userRepository.save(user);

        response.put("message", "User registered successfully!");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> loginUser(@RequestBody User loginData) {
        Map<String, String> response = new HashMap<>();

        try {
            if (loginData.getEmail() == null || loginData.getEmail().isBlank()) {
                response.put("error", "Email is required.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            if (loginData.getPassword() == null || loginData.getPassword().isBlank()) {
                response.put("error", "Password is required.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            User existingUser = userRepository.findByEmail(loginData.getEmail());

            if (existingUser != null) {
                if (passwordEncoder.matches(loginData.getPassword(), existingUser.getPassword())) {
                    String token = jwtUtil.generateToken(existingUser);
                    response.put("token", token);
                    return ResponseEntity.ok(response);
                } else {
                    response.put("error", "Invalid email or password.");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
                }
            }

            response.put("error", "User not found. Please sign up first.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("error", "An internal server error occurred.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // OAuth2 endpoints
    @GetMapping("/oauth2/google")
    public RedirectView googleLogin() {
        return new RedirectView("/oauth2/authorization/google");
    }

    @GetMapping("/oauth2/github")
    public RedirectView githubLogin() {
        return new RedirectView("/oauth2/authorization/github");
    }

    @GetMapping("/oauth2/spotify")
    public RedirectView spotifyLogin() {
        return new RedirectView("/oauth2/authorization/spotify");
    }

    @GetMapping("/test")
    public String test() {
        return "Backend is working! ✅";
    }

    @GetMapping("/test-db")
    public String testDatabase() {
        try {
            long count = userRepository.count();
            return "Database connected! ✅ Total users: " + count;
        } catch (Exception e) {
            return "Database ERROR: " + e.getMessage();
        }
    }
}