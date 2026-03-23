package com.vibesync.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<VibeProfile, Long> {
    Optional<VibeProfile> findByUserId(Long userId);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO vibe_profiles (bio, vibe_tags, user_id, bio_vector) " +
            "VALUES (:bio, :tags, :userId, CAST(:vector AS vector)) " +
            "ON CONFLICT (user_id) DO UPDATE SET " +
            "bio = EXCLUDED.bio, vibe_tags = EXCLUDED.vibe_tags, bio_vector = EXCLUDED.bio_vector", nativeQuery = true)
    void saveWithVector(@Param("bio") String bio,
            @Param("tags") String tags,
            @Param("userId") Long userId,
            @Param("vector") String vector);

    @Query(value = "SELECT u.id as userId, u.full_name as fullName, vp.bio as bio, vp.vibe_tags as vibeTags, " + // 👈 Added u.id
               "(vp.bio_vector <=> (SELECT bio_vector FROM vibe_profiles WHERE user_id = :userId)) as distance " +
               "FROM vibe_profiles vp " +
               "JOIN users u ON vp.user_id = u.id " +
               "WHERE vp.user_id != :userId " +
               "ORDER BY distance ASC LIMIT 5", nativeQuery = true)
List<MatchProjection> findTopMatches(@Param("userId") Long userId);
}