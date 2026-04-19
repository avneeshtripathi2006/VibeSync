package com.vibesync.backend;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Entity
@Table(name = "vibe_posts")
public class VibePost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String musicUri;

    @Column(columnDefinition = "TEXT")
    private String musicTitle;

    @Column(columnDefinition = "TEXT")
    private String musicArtist;

    @Column(columnDefinition = "TEXT")
    private String musicPreview;

    @Column(columnDefinition = "TEXT")
    private String musicAlbumCover;

    @Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")
    private OffsetDateTime createdAt = OffsetDateTime.now(ZoneId.of("Asia/Kolkata"));

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public Long getId() {
        return id;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }

    public void setMusicUri(String musicUri) {
        this.musicUri = musicUri;
    }

    public String getMusicUri() {
        return musicUri;
    }

    public String getMusicTitle() {
        return musicTitle;
    }

    public void setMusicTitle(String musicTitle) {
        this.musicTitle = musicTitle;
    }

    public String getMusicPreview() {
        return musicPreview;
    }

    public void setMusicPreview(String musicPreview) {
        this.musicPreview = musicPreview;
    }

    public String getMusicAlbumCover() {
        return musicAlbumCover;
    }

    public void setMusicAlbumCover(String musicAlbumCover) {
        this.musicAlbumCover = musicAlbumCover;
    }

    public String getMusicArtist() {
        return musicArtist;
    }

    public void setMusicArtist(String musicArtist) {
        this.musicArtist = musicArtist;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}