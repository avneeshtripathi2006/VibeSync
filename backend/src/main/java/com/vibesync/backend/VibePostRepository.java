package com.vibesync.backend;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VibePostRepository extends JpaRepository<VibePost, Long> {
    // This naming convention tells Spring exactly what SQL to write!
    List<VibePost> findAllByOrderByCreatedAtDesc();
    Page<VibePost> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<VibePost> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<VibePost> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    List<VibePost> findByUserIdInOrderByCreatedAtDesc(List<Long> userIds);
    Page<VibePost> findByUserIdInOrderByCreatedAtDesc(List<Long> userIds, Pageable pageable);
    long countByUserId(Long userId);
}