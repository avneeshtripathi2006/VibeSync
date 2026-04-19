package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                      Authentication authentication) throws IOException {

        // 1. Safely extract the token and provider directly from Spring
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        String provider = oauthToken.getAuthorizedClientRegistrationId(); // Reliably returns "google", "github", etc.
        OAuth2User oauth2User = oauthToken.getPrincipal();

        // Extract user info based on provider
        Map<String, Object> attributes = oauth2User.getAttributes();
        System.out.println("OAuth2 Success - Provider: " + provider);
        System.out.println("OAuth2 Attributes: " + attributes);

        String email = null;
        String fullName = null;
        String providerId = null;
        LocalDate dateOfBirth = null;
        String location = null;
        String interests = null;

        switch (provider.toLowerCase()) {
            case "google":
                email = (String) attributes.get("email");
                fullName = (String) attributes.get("name");
                providerId = (String) attributes.get("sub");
                
                // Try to extract DOB from Google profile
                try {
                    Object dobObj = attributes.get("birthdate");
                    if (dobObj instanceof String) {
                        dateOfBirth = LocalDate.parse((String) dobObj, DateTimeFormatter.ISO_DATE);
                    }
                } catch (Exception e) {
                    System.out.println("Could not parse Google birthdate: " + e.getMessage());
                }
                
                // Extract location from locale
                Object locale = attributes.get("locale");
                if (locale instanceof String) {
                    location = (String) locale;
                }
                break;
                
            case "github":
                email = (String) attributes.get("email");
                fullName = (String) attributes.get("name");
                providerId = (String) attributes.get("id").toString();
                
                // Extract location from GitHub profile
                location = (String) attributes.get("location");
                
                // Extract interests from bio if available
                Object bio = attributes.get("bio");
                if (bio instanceof String && !((String)bio).isBlank()) {
                    interests = (String) bio;
                }
                break;
                
            case "spotify":
                email = (String) attributes.get("email");
                fullName = (String) attributes.get("display_name");
                providerId = (String) attributes.get("id");
                
                // Extract top artists from Spotify profile if available
                // Note: Full artist list would need separate API call, but we can store a placeholder
                interests = "Spotify User";
                break;
        }

        if (providerId == null || providerId.isBlank()) {
            String feBase = trimTrailingSlash(frontendUrl);
            getRedirectStrategy().sendRedirect(request, response, feBase + "/#/?error=oauth_failed");
            return;
        }

        if (email == null || email.isBlank()) {
            email = String.format("%s_%s@vibesync.local", provider, providerId);
        }

        if (fullName == null || fullName.isBlank()) {
            fullName = provider + " user";
        }

        System.out.println("OAuth2 User Info - Email: " + email + ", FullName: " + fullName + ", ProviderId: " + providerId);

        // Find or create user
        User user = userRepository.findByEmail(email);
        if (user == null) {
            System.out.println("Creating new OAuth2 user: " + email);
            user = new User();
            user.setEmail(email);
            user.setFullName(fullName);
            user.setPassword(""); // OAuth users don't have a local password
        } else {
            System.out.println("Found existing OAuth2 user: " + email + " with ID: " + user.getId());
        }

        // Update profile data with extracted information
        if (dateOfBirth != null) {
            user.setDateOfBirth(dateOfBirth);
            System.out.println("Set DOB from OAuth: " + dateOfBirth);
        }

        if (location != null && !location.isBlank()) {
            user.setLocation(location);
            System.out.println("Set location from OAuth: " + location);
        }

        if (interests != null && !interests.isBlank()) {
            user.setInterests(interests);
            System.out.println("Set interests from OAuth: " + interests);
        }

        // Track which OAuth methods have authenticated this user
        String currentProviders = user.getLinkedProviders() != null ? user.getLinkedProviders() : "";
        if (!currentProviders.contains(provider)) {
            String updated = currentProviders.isEmpty() ? provider : currentProviders + "," + provider;
            user.setLinkedProviders(updated);
            System.out.println("Updated linked providers: " + updated);
        }

        userRepository.save(user);
        System.out.println("OAuth2 user saved with ID: " + user.getId());

        // Generate JWT token
        String token = jwtUtil.generateToken(user);
        System.out.println("Generated JWT token for user: " + user.getId());

        String feBase = trimTrailingSlash(frontendUrl);
        String query = UriComponentsBuilder.newInstance()
                .queryParam("token", token)
                .queryParam("provider", provider)
                .build()
                .encode()
                .getQuery();
        // Use HashRouter for GitHub Pages deployment
        String hashPrefix = frontendUrl.contains("github.io") ? "/#" : "";
        String redirectUrl = feBase + hashPrefix + "/auth/oauth2/success" + (query != null ? "?" + query : "");

        System.out.println("OAuth2 redirect URL: " + redirectUrl);

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isEmpty()) {
            return "http://localhost:5173";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}