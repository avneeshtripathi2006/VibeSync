package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.CorsFilter;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private Environment environment;

    @Autowired
    private OAuth2AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Do not run the OAuth2/security filter chain on the posts API. Those endpoints use
     * app JWTs in {@code Authorization}, not Spring OAuth2 bearer tokens; on some setups
     * the chain was returning 401 before the controller ran.
     */
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().requestMatchers(
                "/api/posts/**",
                "/api/chat/**",
                "/api/profile/**",
                "/ws-vibe/**");
    }

    /**
     * Ignored paths skip the Spring Security filter chain (including its CORS filter). SockJS uses XHR to
     * /ws-vibe/info — without this, GitHub Pages sees missing Access-Control-Allow-Origin and 403-style failures.
     */
    @Bean
    public FilterRegistrationBean<CorsFilter> globalCorsFilter(CorsConfigurationSource corsConfigurationSource) {
        FilterRegistrationBean<CorsFilter> reg = new FilterRegistrationBean<>(new CorsFilter(corsConfigurationSource));
        reg.setOrder(Ordered.HIGHEST_PRECEDENCE);
        reg.addUrlPatterns("/*");
        return reg;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
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
                        .authenticationEntryPoint((request, response, authException) -> response.sendError(401))
                        .accessDeniedHandler((request, response, accessDeniedException) -> response.sendError(403)))
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Build allowed origins from environment variables or defaults
        List<String> allowedOrigins = new ArrayList<>();
        allowedOrigins.add("http://localhost:*");
        allowedOrigins.add("http://127.0.0.1:*");
        allowedOrigins.add("http://localhost:5173");
        
        // Add GitHub Pages URL if GITHUB_USERNAME is set
        String githubUsername = environment.getProperty("GITHUB_USERNAME");
        if (githubUsername != null && !githubUsername.isEmpty()) {
            allowedOrigins.add("https://" + githubUsername + ".github.io");
        } else {
            allowedOrigins.add("https://*.github.io");
        }

        String renderBackendDomain = environment.getProperty("RENDER_BACKEND_DOMAIN");
        if (renderBackendDomain != null && !renderBackendDomain.isEmpty()) {
            allowedOrigins.add("https://" + renderBackendDomain);
        }

        String customFrontendUrl = environment.getProperty("CUSTOM_FRONTEND_URL");
        if (customFrontendUrl != null && !customFrontendUrl.isEmpty()) {
            allowedOrigins.add(customFrontendUrl);
        }

        String frontendUrl = environment.getProperty("FRONTEND_URL");
        if (frontendUrl != null && !frontendUrl.isEmpty()) {
            allowedOrigins.add(frontendUrl);
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
