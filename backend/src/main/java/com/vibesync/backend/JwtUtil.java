package com.vibesync.backend;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String SECRET_KEY;

    private Key key; // 👈 Remove 'final' and don't initialize it here

    // This method runs automatically after the SECRET_KEY is injected
    @PostConstruct
    public void init() {
        if (SECRET_KEY == null || SECRET_KEY.isBlank()) {
            throw new IllegalStateException("JWT_SECRET must be configured and non-empty");
        }
        if (SECRET_KEY.length() < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 characters for HS256");
        }
        this.key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
    }

    // 1. Generate a Token for a user
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId()); // 👈 THIS IS THE MISSING PIECE

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail()) // email still goes in 'sub'
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(key)
                .compact();
    }

    // 2. Extract email from a Token
    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // 3. Validate Token
    public Boolean validateToken(String token, org.springframework.security.core.userdetails.UserDetails userDetails) {
        final String email = extractEmail(token);
        return (email.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    // 4. Check if token is expired
    private Boolean isTokenExpired(String token) {
        final Date expiration = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
        return expiration.before(new Date());
    }
}