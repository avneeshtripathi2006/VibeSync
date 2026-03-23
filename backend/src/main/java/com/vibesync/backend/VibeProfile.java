package com.vibesync.backend;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "vibe_profiles")
public class VibeProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // This links the profile to a specific User by their ID
    @JsonIgnore // 👈 Add this (you might need to import
                // com.fasterxml.jackson.annotation.JsonIgnore)
    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;
    private String bio;

    //@JdbcTypeCode(SqlTypes.VARBINARY) // Try VARBINARY if ARRAY failed
    @Column(name = "bio_vector", columnDefinition = "vector(384)")
    private String bioVector; // 👈 Change double[] to String

    private String vibeTags; // We'll store these as "Music,Coding,Gym"
    private String profilePicUrl;

    public VibeProfile() {
    }

    // Getters and Setters (The "Remote Control" for this data)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getVibeTags() {
        return vibeTags;
    }

    public void setVibeTags(String vibeTags) {
        this.vibeTags = vibeTags;
    }

    public String getProfilePicUrl() {
        return profilePicUrl;
    }

    public void setProfilePicUrl(String profilePicUrl) {
        this.profilePicUrl = profilePicUrl;
    }

    public String getBioVector() {
        return bioVector;
    }

    public void setBioVector(String bioVector) {
        this.bioVector = bioVector;
    }
}