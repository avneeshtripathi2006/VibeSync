package com.vibesync.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<VibeProfile, Long> {
    Optional<VibeProfile> findByUserId(Long userId);

    @Query(value = "SELECT u.id AS \"userId\", u.full_name AS \"fullName\", vp.bio AS \"bio\", vp.vibe_tags AS \"vibeTags\", " +
           "(CAST(vp.bio_vector AS vector) <=> CAST(me.bio_vector AS vector)) AS \"distance\" " +
           "FROM vibe_profiles vp " +
           "JOIN users u ON vp.user_id = u.id " +
           "CROSS JOIN (SELECT bio_vector FROM vibe_profiles WHERE user_id = :userId) me " +
           "WHERE vp.user_id != :userId " +
           "AND vp.bio_vector IS NOT NULL AND me.bio_vector IS NOT NULL " +
           "ORDER BY \"distance\" ASC LIMIT 5", nativeQuery = true)
List<MatchProjection> findTopMatches(@Param("userId") Long userId);

    /** When no embeddings exist yet — still surface people to chat with (distance null → UI shows "—"). */
    @Query(value = "SELECT u.id as userId, u.full_name as fullName, vp.bio as bio, vp.vibe_tags as vibeTags, " +
               "CAST(NULL AS double precision) as distance " +
               "FROM vibe_profiles vp " +
               "JOIN users u ON vp.user_id = u.id " +
               "WHERE vp.user_id != :userId " +
               "ORDER BY u.id ASC LIMIT 5", nativeQuery = true)
    List<MatchProjection> findTopMatchesWithoutVectors(@Param("userId") Long userId);

    /**
     * Hybrid matching returns a true distance in [0,2] (lower is better):
     * - 60% semantic distance from comprehensive vector (fallback bio vector)
     * - 25% tag Jaccard distance (vibe tags + hobbies + music + learning)
     * - 15% interest Jaccard distance (interests + YouTube + Spotify)
     */
    @Query(value = """
        SELECT 
            u.id as userId, 
            u.full_name as fullName, 
            vp.bio as bio, 
            vp.vibe_tags as vibeTags,
            LEAST(
                GREATEST(
                    2.0 * (
                        0.60 * (
                            CASE
                                WHEN my_profile.comprehensive_interests_vector IS NOT NULL AND vp.comprehensive_interests_vector IS NOT NULL
                                    THEN LEAST((CAST(my_profile.comprehensive_interests_vector AS vector) <=> CAST(vp.comprehensive_interests_vector AS vector)), 2.0) / 2.0
                                WHEN my_profile.bio_vector IS NOT NULL AND vp.bio_vector IS NOT NULL
                                    THEN LEAST((CAST(my_profile.bio_vector AS vector) <=> CAST(vp.bio_vector AS vector)), 2.0) / 2.0
                                ELSE 1.0
                            END
                        )
                        + 0.25 * (
                            CASE
                                WHEN (
                                    SELECT COUNT(*) FROM (
                                        SELECT DISTINCT TRIM(LOWER(tag)) AS token
                                        FROM unnest(regexp_split_to_array(CONCAT_WS(',', COALESCE(vp.vibe_tags, ''), COALESCE(vp.hobbies, ''), COALESCE(vp.music_taste, ''), COALESCE(vp.learning_goals, '')), '\\s*,\\s*')) AS tag
                                        WHERE TRIM(tag) <> ''
                                        UNION
                                        SELECT DISTINCT TRIM(LOWER(tag)) AS token
                                        FROM unnest(regexp_split_to_array(CONCAT_WS(',', COALESCE(my_tags.vibe_tags, ''), COALESCE(my_tags.hobbies, ''), COALESCE(my_tags.music_taste, ''), COALESCE(my_tags.learning_goals, '')), '\\s*,\\s*')) AS tag
                                        WHERE TRIM(tag) <> ''
                                    ) all_tags
                                ) = 0 THEN 1.0
                                ELSE 1.0 - (
                                    (
                                        SELECT COUNT(*) FROM (
                                            SELECT DISTINCT TRIM(LOWER(tag)) AS token
                                            FROM unnest(regexp_split_to_array(CONCAT_WS(',', COALESCE(vp.vibe_tags, ''), COALESCE(vp.hobbies, ''), COALESCE(vp.music_taste, ''), COALESCE(vp.learning_goals, '')), '\\s*,\\s*')) AS tag
                                            WHERE TRIM(tag) <> ''
                                            INTERSECT
                                            SELECT DISTINCT TRIM(LOWER(tag)) AS token
                                            FROM unnest(regexp_split_to_array(CONCAT_WS(',', COALESCE(my_tags.vibe_tags, ''), COALESCE(my_tags.hobbies, ''), COALESCE(my_tags.music_taste, ''), COALESCE(my_tags.learning_goals, '')), '\\s*,\\s*')) AS tag
                                            WHERE TRIM(tag) <> ''
                                        ) common_tags
                                    )::double precision
                                    /
                                    (
                                        SELECT COUNT(*) FROM (
                                            SELECT DISTINCT TRIM(LOWER(tag)) AS token
                                            FROM unnest(regexp_split_to_array(CONCAT_WS(',', COALESCE(vp.vibe_tags, ''), COALESCE(vp.hobbies, ''), COALESCE(vp.music_taste, ''), COALESCE(vp.learning_goals, '')), '\\s*,\\s*')) AS tag
                                            WHERE TRIM(tag) <> ''
                                            UNION
                                            SELECT DISTINCT TRIM(LOWER(tag)) AS token
                                            FROM unnest(regexp_split_to_array(CONCAT_WS(',', COALESCE(my_tags.vibe_tags, ''), COALESCE(my_tags.hobbies, ''), COALESCE(my_tags.music_taste, ''), COALESCE(my_tags.learning_goals, '')), '\\s*,\\s*')) AS tag
                                            WHERE TRIM(tag) <> ''
                                        ) all_tags
                                    )::double precision
                                )
                            END
                        )
                        + 0.15 * (
                            CASE
                                WHEN (
                                    SELECT COUNT(*) FROM (
                                        SELECT DISTINCT TRIM(LOWER(tag)) AS token
                                        FROM unnest(regexp_split_to_array(CONCAT_WS(',', COALESCE(u.interests, ''), COALESCE(u.youtube_subscriptions, ''), COALESCE(u.spotify_artists, '')), '\\s*,\\s*')) AS tag
                                        WHERE TRIM(tag) <> ''
                                        UNION
                                        SELECT DISTINCT TRIM(LOWER(tag)) AS token
                                        FROM unnest(regexp_split_to_array(CONCAT_WS(',', COALESCE(my_user.interests, ''), COALESCE(my_user.youtube_subscriptions, ''), COALESCE(my_user.spotify_artists, '')), '\\s*,\\s*')) AS tag
                                        WHERE TRIM(tag) <> ''
                                    ) all_tags
                                ) = 0 THEN 1.0
                                ELSE 1.0 - (
                                    (
                                        SELECT COUNT(*) FROM (
                                            SELECT DISTINCT TRIM(LOWER(tag)) AS token
                                            FROM unnest(regexp_split_to_array(CONCAT_WS(',', COALESCE(u.interests, ''), COALESCE(u.youtube_subscriptions, ''), COALESCE(u.spotify_artists, '')), '\\s*,\\s*')) AS tag
                                            WHERE TRIM(tag) <> ''
                                            INTERSECT
                                            SELECT DISTINCT TRIM(LOWER(tag)) AS token
                                            FROM unnest(regexp_split_to_array(CONCAT_WS(',', COALESCE(my_user.interests, ''), COALESCE(my_user.youtube_subscriptions, ''), COALESCE(my_user.spotify_artists, '')), '\\s*,\\s*')) AS tag
                                            WHERE TRIM(tag) <> ''
                                        ) common_tags
                                    )::double precision
                                    /
                                    (
                                        SELECT COUNT(*) FROM (
                                            SELECT DISTINCT TRIM(LOWER(tag)) AS token
                                            FROM unnest(regexp_split_to_array(CONCAT_WS(',', COALESCE(u.interests, ''), COALESCE(u.youtube_subscriptions, ''), COALESCE(u.spotify_artists, '')), '\\s*,\\s*')) AS tag
                                            WHERE TRIM(tag) <> ''
                                            UNION
                                            SELECT DISTINCT TRIM(LOWER(tag)) AS token
                                            FROM unnest(regexp_split_to_array(CONCAT_WS(',', COALESCE(my_user.interests, ''), COALESCE(my_user.youtube_subscriptions, ''), COALESCE(my_user.spotify_artists, '')), '\\s*,\\s*')) AS tag
                                            WHERE TRIM(tag) <> ''
                                        ) all_tags
                                    )::double precision
                                )
                            END
                        )
                    ),
                    0.0
                ),
                2.0
            ) as distance
        FROM vibe_profiles vp
        JOIN users u ON vp.user_id = u.id
        CROSS JOIN (SELECT vibe_tags, hobbies, music_taste, learning_goals FROM vibe_profiles WHERE user_id = :userId) my_tags
        CROSS JOIN (SELECT interests, youtube_subscriptions, spotify_artists FROM users WHERE id = :userId) my_user
        CROSS JOIN (SELECT bio_vector, comprehensive_interests_vector FROM vibe_profiles WHERE user_id = :userId) my_profile
        WHERE vp.user_id != :userId
        ORDER BY distance ASC LIMIT 10
        """, nativeQuery = true)
    List<MatchProjection> findTopMatchesHybrid(@Param("userId") Long userId);
}