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

    @Query(value = "SELECT u.id as userId, u.full_name as fullName, vp.bio as bio, vp.vibe_tags as vibeTags, " +
               "(vp.bio_vector <=> me.bio_vector) as distance " +
               "FROM vibe_profiles vp " +
               "JOIN users u ON vp.user_id = u.id " +
               "CROSS JOIN (SELECT bio_vector FROM vibe_profiles WHERE user_id = :userId) me " +
               "WHERE vp.user_id != :userId " +
               "AND vp.bio_vector IS NOT NULL AND me.bio_vector IS NOT NULL " +
               "ORDER BY distance ASC LIMIT 5", nativeQuery = true)
    List<MatchProjection> findTopMatches(@Param("userId") Long userId);

    /** When no embeddings exist yet — still surface people to chat with (distance null → UI shows "—"). */
    @Query(value = "SELECT u.id as userId, u.full_name as fullName, vp.bio as bio, vp.vibe_tags as vibeTags, " +
               "CAST(NULL AS double precision) as distance " +
               "FROM vibe_profiles vp " +
               "JOIN users u ON vp.user_id = u.id " +
               "WHERE vp.user_id != :userId " +
               "ORDER BY u.id ASC LIMIT 5", nativeQuery = true)
    List<MatchProjection> findTopMatchesWithoutVectors(@Param("userId") Long userId);
}