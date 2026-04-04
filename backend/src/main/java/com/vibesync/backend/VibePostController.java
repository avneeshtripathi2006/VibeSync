package com.vibesync.backend;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/posts")
public class VibePostController {
    
    @Autowired private VibePostRepository postRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;

    @PostMapping("/create")
    public String createPost(@RequestHeader("Authorization") String token, @RequestBody String content) {
        if (token == null || !token.startsWith("Bearer ")) {
            return "Error: Unauthorized";
        }
        String email = jwtUtil.extractEmail(token.substring(7));
        User user = userRepository.findByEmail(email);
        
        VibePost post = new VibePost();
        post.setContent(content);
        post.setUser(user);
        postRepository.save(post);
        return "Vibe Posted! 🚀";
    }

    @GetMapping("/all")
    public List<VibePost> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/my-posts")
    public List<VibePost> getMyPosts(@RequestHeader("Authorization") String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            return List.of();
        }
        String email = jwtUtil.extractEmail(token.substring(7));
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return List.of();
        }
        return postRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }
}