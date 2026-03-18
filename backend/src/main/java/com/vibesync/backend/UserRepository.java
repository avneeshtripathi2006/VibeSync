package com.vibesync.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // This magic line lets us search for users by email later
    User findByEmail(String email);
}