package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
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

        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String provider = getProviderFromRequest(request);

        // Extract user info based on provider
        Map<String, Object> attributes = oauth2User.getAttributes();
        String email = null;
        String fullName = null;
        String providerId = null;

        switch (provider.toLowerCase()) {
            case "google":
                email = (String) attributes.get("email");
                fullName = (String) attributes.get("name");
                providerId = (String) attributes.get("sub");
                break;
            case "github":
                email = (String) attributes.get("email");
                fullName = (String) attributes.get("name");
                providerId = (String) attributes.get("id").toString();
                break;
            case "spotify":
                email = (String) attributes.get("email");
                fullName = (String) attributes.get("display_name");
                providerId = (String) attributes.get("id");
                break;
        }

        if (email != null) {
            // Check if user exists, create if not
            User user = userRepository.findByEmail(email);
            if (user == null) {
                user = new User();
                user.setEmail(email);
                user.setFullName(fullName != null ? fullName : email.split("@")[0]);
                user.setPassword(""); // OAuth users don't need passwords
                userRepository.save(user);
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(user);

            String feBase = trimTrailingSlash(frontendUrl);
            // SPA uses HashRouter: route must be in the hash (see frontend/src/App.jsx)
            String query = UriComponentsBuilder.newInstance()
                    .queryParam("token", token)
                    .queryParam("provider", provider)
                    .build()
                    .encode()
                    .getQuery();
            String redirectUrl = feBase + "/#/auth/oauth2/success" + (query != null ? "?" + query : "");

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } else {
            String feBase = trimTrailingSlash(frontendUrl);
            getRedirectStrategy().sendRedirect(request, response, feBase + "/#/?error=oauth_failed");
        }
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isEmpty()) {
            return "http://localhost:5173";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private String getProviderFromRequest(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        if (requestUri.contains("google")) return "google";
        if (requestUri.contains("github")) return "github";
        if (requestUri.contains("spotify")) return "spotify";
        return "unknown";
    }
}