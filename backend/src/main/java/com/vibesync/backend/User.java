package com.vibesync.backend;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String email;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private LocalDateTime createdAt = LocalDateTime.now();

    // New editable profile fields for enhanced matching
    private LocalDate dateOfBirth;

    private String phone;

    private String location; // City, Country

    @Column(columnDefinition = "TEXT")
    private String interests; // Comma-separated interests extracted from various sources

    @Column(columnDefinition = "TEXT")
    private String youtubeSubscriptions; // Comma-separated YouTube channel subscriptions

    @Column(columnDefinition = "TEXT")
    private String spotifyArtists; // Comma-separated top Spotify artists

    @Column(columnDefinition = "TEXT")
    private String linkedProviders; // Track which OAuth providers are linked (google,github,spotify)

    // Standard empty constructor
    public User() {}

    // Getters and Setters
    public Long getId() { return id; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getInterests() { return interests; }
    public void setInterests(String interests) { this.interests = interests; }
    
    public String getYoutubeSubscriptions() { return youtubeSubscriptions; }
    public void setYoutubeSubscriptions(String youtubeSubscriptions) { this.youtubeSubscriptions = youtubeSubscriptions; }
    
    public String getSpotifyArtists() { return spotifyArtists; }
    public void setSpotifyArtists(String spotifyArtists) { this.spotifyArtists = spotifyArtists; }
    
    public String getLinkedProviders() { return linkedProviders; }
    public void setLinkedProviders(String linkedProviders) { this.linkedProviders = linkedProviders; }
}