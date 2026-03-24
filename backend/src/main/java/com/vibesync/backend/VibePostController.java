package com.vibesync.backend;

import java.util.List;
import java.io.FileWriter;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/posts")
@CrossOrigin("*")
public class VibePostController {
    
    @Autowired private VibePostRepository postRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;

    @PostMapping("/create")
    public String createPost(@RequestHeader("Authorization") String token, @RequestBody String content) {
        // #region agent log
        try (FileWriter fw = new FileWriter("C:/Users/lenovo/OneDrive/Desktop/VibeSync_Project/debug-134bb9.log", true)) { fw.write("{\"sessionId\":\"134bb9\",\"runId\":\"controller-check\",\"hypothesisId\":\"H_SEC_BLOCK\",\"id\":\""+UUID.randomUUID()+"\",\"location\":\"VibePostController.createPost\",\"message\":\"createPost entry reached\",\"data\":{\"hasAuthHeader\":"+(token != null)+"},\"timestamp\":"+System.currentTimeMillis()+"}\n"); } catch (Exception ignored) {}
        // #endregion
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
        // #region agent log
        try (FileWriter fw = new FileWriter("C:/Users/lenovo/OneDrive/Desktop/VibeSync_Project/debug-134bb9.log", true)) { fw.write("{\"sessionId\":\"134bb9\",\"runId\":\"controller-check\",\"hypothesisId\":\"H_SEC_BLOCK\",\"id\":\""+UUID.randomUUID()+"\",\"location\":\"VibePostController.getAllPosts\",\"message\":\"getAllPosts entry reached\",\"data\":{},\"timestamp\":"+System.currentTimeMillis()+"}\n"); } catch (Exception ignored) {}
        // #endregion
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/my-posts")
    public List<VibePost> getMyPosts(@RequestHeader("Authorization") String token) {
        // #region agent log
        try (FileWriter fw = new FileWriter("C:/Users/lenovo/OneDrive/Desktop/VibeSync_Project/debug-134bb9.log", true)) { fw.write("{\"sessionId\":\"134bb9\",\"runId\":\"controller-check\",\"hypothesisId\":\"H_PROFILE_POSTS_PATH\",\"id\":\""+UUID.randomUUID()+"\",\"location\":\"VibePostController.getMyPosts\",\"message\":\"getMyPosts entry reached\",\"data\":{\"hasAuthHeader\":"+(token != null)+"},\"timestamp\":"+System.currentTimeMillis()+"}\n"); } catch (Exception ignored) {}
        // #endregion
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