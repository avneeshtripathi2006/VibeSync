package com.vibesync.backend;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users") // This tells Postgres to create a table named 'users'
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String email;
    private String password;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Standard empty constructor
    public User() {}

    // Getters and Setters (This allows us to read/write data)
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}