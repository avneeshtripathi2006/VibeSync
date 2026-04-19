package com.vibesync.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);
    List<Comment> findTop5ByPostUserIdOrderByCreatedAtDesc(Long userId);
    long countByPostId(Long postId);
}
