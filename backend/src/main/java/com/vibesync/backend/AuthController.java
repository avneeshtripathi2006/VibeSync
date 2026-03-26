package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public String registerUser(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()) != null) {
            return "Error: Email already in use!";
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return "Success: User registered successfully!";
    }

    @PostMapping("/login")
    public String loginUser(@RequestBody User loginData) {
        User existingUser = userRepository.findByEmail(loginData.getEmail());

        if (existingUser != null) {
            if (passwordEncoder.matches(loginData.getPassword(), existingUser.getPassword())) {
                String token = jwtUtil.generateToken(existingUser);
                return token;
            } else {
                return "Error: Wrong password!";
            }
        }
        return "Error: User not found!";
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