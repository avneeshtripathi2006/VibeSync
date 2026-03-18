package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/auth") // All APIs here will start with /auth
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/signup")
    public String registerUser(@RequestBody User user) {
        // Check if user already exists
        if (userRepository.findByEmail(user.getEmail()) != null) {
            return "Error: Email already in use!";
        }

        // Save the user to the database
        userRepository.save(user);
        return "Success: User registered successfully!";
    }

    @PostMapping("/login")
    public String loginUser(@RequestBody User loginData) {
        // 1. Search for user by email
        User existingUser = userRepository.findByEmail(loginData.getEmail());

        if (existingUser != null) {
            // 2. Check if the password matches (Simple plain text check for now)
            if (existingUser.getPassword().equals(loginData.getPassword())) {
                return "Login Success! Welcome, " + existingUser.getFullName();
            } else {
                return "Error: Wrong password!";
            }
        }

        // 3. If email is not found
        return "Error: User not found!";
    }
}