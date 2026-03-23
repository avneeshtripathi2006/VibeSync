package com.vibesync.backend;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vibe_posts")
public class VibePost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // 🚀 THE FIX: Java needs these getters and setters to work!
    public void setContent(String content) { this.content = content; }
    public String getContent() { return content; }

    public void setUser(User user) { this.user = user; }
    public User getUser() { return user; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}