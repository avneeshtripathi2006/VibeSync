package com.vibesync.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VibePostRepository extends JpaRepository<VibePost, Long> {
    // This naming convention tells Spring exactly what SQL to write!
    List<VibePost> findAllByOrderByCreatedAtDesc();
}