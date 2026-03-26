package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.io.FileWriter;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private OAuth2AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**", "/oauth2/**", "/login/oauth2/**", "/test").permitAll()
                        .requestMatchers("/api/profile/**").permitAll()
                        .requestMatchers("/api/chat/**").permitAll()
                        .requestMatchers("/api/posts/**").permitAll()
                        // 🔓 ADD THIS LINE TO ALLOW WEBSOCKETS
                        .requestMatchers("/ws-vibe/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oauth2AuthenticationSuccessHandler)
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            // #region agent log
                            try (FileWriter fw = new FileWriter("C:/Users/lenovo/OneDrive/Desktop/VibeSync_Project/.cursor/debug-134bb9.log", true)) {
                                fw.write("{\"sessionId\":\"134bb9\",\"runId\":\"security-check\",\"hypothesisId\":\"H_SEC_DENY_REASON\",\"id\":\""+UUID.randomUUID()+"\",\"location\":\"SecurityConfig.authenticationEntryPoint\",\"message\":\"security unauthenticated\",\"data\":{\"path\":\""+request.getRequestURI()+"\",\"method\":\""+request.getMethod()+"\"},\"timestamp\":"+System.currentTimeMillis()+"}\n");
                            } catch (Exception ignored) {}
                            // #endregion
                            response.sendError(401);
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            // #region agent log
                            try (FileWriter fw = new FileWriter("C:/Users/lenovo/OneDrive/Desktop/VibeSync_Project/.cursor/debug-134bb9.log", true)) {
                                fw.write("{\"sessionId\":\"134bb9\",\"runId\":\"security-check\",\"hypothesisId\":\"H_SEC_DENY_REASON\",\"id\":\""+UUID.randomUUID()+"\",\"location\":\"SecurityConfig.accessDeniedHandler\",\"message\":\"security access denied\",\"data\":{\"path\":\""+request.getRequestURI()+"\",\"method\":\""+request.getMethod()+"\"},\"timestamp\":"+System.currentTimeMillis()+"}\n");
                            } catch (Exception ignored) {}
                            // #endregion
                            response.sendError(403);
                        }))
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Build allowed origins from environment variables or defaults
        List<String> allowedOrigins = new ArrayList<>();
        allowedOrigins.add("http://localhost:5173"); // Local development
        
        // Add GitHub Pages URL if GITHUB_USERNAME is set
        String githubUsername = System.getenv("GITHUB_USERNAME");
        if (githubUsername != null && !githubUsername.isEmpty()) {
            allowedOrigins.add("https://" + githubUsername + ".github.io");
        } else {
            // Default pattern for GitHub Pages (user will customize)
            allowedOrigins.add("https://*.github.io");
        }
        
        // Add Render backend/frontend production URL if set
        String renderBackendDomain = System.getenv("RENDER_BACKEND_DOMAIN");
        if (renderBackendDomain != null && !renderBackendDomain.isEmpty()) {
            allowedOrigins.add("https://" + renderBackendDomain);
        }
        
        // Add custom frontend URL if set
        String customFrontendUrl = System.getenv("CUSTOM_FRONTEND_URL");
        if (customFrontendUrl != null && !customFrontendUrl.isEmpty()) {
            allowedOrigins.add(customFrontendUrl);
        }
        
        configuration.setAllowedOriginPatterns(allowedOrigins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
