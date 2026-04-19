package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

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

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * No WebSecurityCustomizer is used for API paths. Those are permitted explicitly in the
     * SecurityFilterChain so CORS and other filters continue to run normally.
     */

    @Bean
    public FilterRegistrationBean<CorsFilter> globalCorsFilter(CorsConfigurationSource corsConfigurationSource) {
        FilterRegistrationBean<CorsFilter> reg = new FilterRegistrationBean<>(new CorsFilter(corsConfigurationSource));
        reg.setOrder(Ordered.HIGHEST_PRECEDENCE);
        reg.addUrlPatterns("/*");
        return reg;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, ClientRegistrationRepository clientRegistrationRepository) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Frontend routes and static assets
                        .requestMatchers("/", "/index.html", "/assets/**", "/*.js", "/*.css", "/*.svg").permitAll()
                        .requestMatchers("/home", "/explore", "/chat", "/profile", "/auth/oauth2/success").permitAll()
                        // Auth endpoints
                        .requestMatchers("/auth/**", "/oauth2/**", "/login/oauth2/**", "/test").permitAll()
                        // Error handling - prevent Whitelabel error page from blocking JSON responses
                        .requestMatchers("/error").permitAll()
                        // API endpoints (require authentication)
                        .requestMatchers("/api/profile/**").authenticated()
                        .requestMatchers("/api/chat/**").authenticated()
                        .requestMatchers("/api/posts/**").authenticated()
                        .requestMatchers("/api/spotify/**").permitAll()
                        .requestMatchers("/ws-vibe/**").authenticated()
                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(authorization -> authorization.authorizationRequestResolver(
                                authorizationRequestResolver(clientRegistrationRepository)
                        ))
                        .successHandler(oauth2AuthenticationSuccessHandler)
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> response.sendError(401))
                        .accessDeniedHandler((request, response, accessDeniedException) -> response.sendError(403)))
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable());

        return http.build();
    }

    @Bean
    public OAuth2AuthorizationRequestResolver authorizationRequestResolver(
            ClientRegistrationRepository clientRegistrationRepository) {
        DefaultOAuth2AuthorizationRequestResolver resolver = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository, "/oauth2/authorization");
        resolver.setAuthorizationRequestCustomizer(builder -> builder.additionalParameters(
                params -> params.put("prompt", "select_account")
        ));
        return resolver;
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
