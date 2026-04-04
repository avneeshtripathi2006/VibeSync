package com.vibesync.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<VibeProfile, Long> {
    Optional<VibeProfile> findByUserId(Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query(value = "INSERT INTO vibe_profiles (bio, vibe_tags, user_id, bio_vector, profile_pic_url) " +
            "VALUES (:bio, :tags, :userId, " +
            "CASE WHEN :vector IS NULL OR TRIM(COALESCE(:vector, '')) = '' THEN NULL ELSE CAST(:vector AS vector) END, " +
            ":profilePicUrl) " +
            "ON CONFLICT (user_id) DO UPDATE SET " +
            "bio = EXCLUDED.bio, " +
            "vibe_tags = EXCLUDED.vibe_tags, " +
            "bio_vector = COALESCE(EXCLUDED.bio_vector, vibe_profiles.bio_vector), " +
            "profile_pic_url = EXCLUDED.profile_pic_url", nativeQuery = true)
    void saveWithVector(@Param("bio") String bio,
            @Param("tags") String tags,
            @Param("userId") Long userId,
            @Param("vector") String vector,
            @Param("profilePicUrl") String profilePicUrl);

    @Query(value = "SELECT u.id as userId, u.full_name as fullName, vp.bio as bio, vp.vibe_tags as vibeTags, " +
               "(vp.bio_vector <=> me.bio_vector) as distance " +
               "FROM vibe_profiles vp " +
               "JOIN users u ON vp.user_id = u.id " +
               "CROSS JOIN (SELECT bio_vector FROM vibe_profiles WHERE user_id = :userId) me " +
               "WHERE vp.user_id != :userId " +
               "AND vp.bio_vector IS NOT NULL AND me.bio_vector IS NOT NULL " +
               "ORDER BY distance ASC LIMIT 5", nativeQuery = true)
List<MatchProjection> findTopMatches(@Param("userId") Long userId);
}