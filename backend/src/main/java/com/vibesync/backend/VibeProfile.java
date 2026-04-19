package com.vibesync.backend;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

@Entity
@Table(name = "vibe_profiles")
public class VibeProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", unique = true, nullable = false)
    private User user;
    
    private String bio;

    @Column(name = "bio_vector", columnDefinition = "TEXT")
    private String bioVector;

    private String vibeTags;

    @Column(columnDefinition = "TEXT")
    private String profilePicUrl;

    // NEW: Aggregated comprehensive interests vector for enhanced matching
    @Column(columnDefinition = "TEXT")
    private String comprehensiveInterestsVector; // Embedding of all interests combined

    // NEW: Enriched text combining all matchable fields
    @Column(columnDefinition = "TEXT")
    private String enrichedMatchingText; // Bio + tags + interests + hobbies + YouTube channels

    // NEW: Hobby/interest keywords (manually curated or extracted)
    @Column(columnDefinition = "TEXT")
    private String hobbies; // Comma-separated: "Photography,Gaming,Reading,Cooking"

    // NEW: Music taste summary (extracted from Spotify)
    @Column(columnDefinition = "TEXT")
    private String musicTaste; // "Indie,Electronic,HipHop,Jazz"

    // NEW: Learning interests/goals
    @Column(columnDefinition = "TEXT")
    private String learningGoals; // "Python,WebDevelopment,UIDesign,DataScience"

    // NEW: Match metadata
    private Integer matchScore; // Cached match score for sorting
    private Long lastUpdated; // Timestamp for cache invalidation

    public VibeProfile() {
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getVibeTags() { return vibeTags; }
    public void setVibeTags(String vibeTags) { this.vibeTags = vibeTags; }

    public String getProfilePicUrl() { return profilePicUrl; }
    public void setProfilePicUrl(String profilePicUrl) { this.profilePicUrl = profilePicUrl; }

    public String getBioVector() { return bioVector; }
    public void setBioVector(String bioVector) { this.bioVector = bioVector; }

    public String getComprehensiveInterestsVector() { return comprehensiveInterestsVector; }
    public void setComprehensiveInterestsVector(String comprehensiveInterestsVector) { this.comprehensiveInterestsVector = comprehensiveInterestsVector; }

    public String getEnrichedMatchingText() { return enrichedMatchingText; }
    public void setEnrichedMatchingText(String enrichedMatchingText) { this.enrichedMatchingText = enrichedMatchingText; }

    public String getHobbies() { return hobbies; }
    public void setHobbies(String hobbies) { this.hobbies = hobbies; }

    public String getMusicTaste() { return musicTaste; }
    public void setMusicTaste(String musicTaste) { this.musicTaste = musicTaste; }

    public String getLearningGoals() { return learningGoals; }
    public void setLearningGoals(String learningGoals) { this.learningGoals = learningGoals; }

    public Integer getMatchScore() { return matchScore; }
    public void setMatchScore(Integer matchScore) { this.matchScore = matchScore; }

    public Long getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Long lastUpdated) { this.lastUpdated = lastUpdated; }
}