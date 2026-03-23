package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // <-- Make sure this import is here
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder; // <-- It must be INSIDE the class

    @PostMapping("/signup")
    public String registerUser(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()) != null) {
            return "Error: Email already in use!";
        }

        // 🔥 NEW: Hash the password before saving!
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        userRepository.save(user);
        return "Success: User registered successfully!";
    }

    @PostMapping("/login")
    public String loginUser(@RequestBody User loginData) {
        User existingUser = userRepository.findByEmail(loginData.getEmail());

        if (existingUser != null) {
            if (passwordEncoder.matches(loginData.getPassword(), existingUser.getPassword())) {
                // 🔥 Generate the "ID Card" (Token)
                // Pass the whole 'existingUser' object, not just the email string
                String token = jwtUtil.generateToken(existingUser);
                return token; // Send the token to the Frontend
            } else {
                return "Error: Wrong password!";
            }
        }
        return "Error: User not found!";
    }
}