package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.ArrayList;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private Environment environment;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 1. Enable a simple memory-based message broker
        config.enableSimpleBroker("/topic"); 
        // 2. Prefix for messages sent FROM client TO server
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // SockJS sends Origin; if it is not allowed here, the browser shows 403 on …/ws-vibe/info
        String allowedOriginsEnv = environment.getProperty("WEBSOCKET_ORIGINS");
        var endpoint = registry.addEndpoint("/ws-vibe");
        if (allowedOriginsEnv != null && !allowedOriginsEnv.isBlank()) {
            String[] origins = allowedOriginsEnv.split(",");
            for (int i = 0; i < origins.length; i++) {
                origins[i] = origins[i].trim();
            }
            endpoint.setAllowedOrigins(origins);
        } else {
            List<String> patterns = new ArrayList<>();
            patterns.add("http://localhost:*");
            patterns.add("http://127.0.0.1:*");
            patterns.add("https://*.github.io");
            patterns.add("https://*.onrender.com");
            String githubUsername = environment.getProperty("GITHUB_USERNAME");
            if (githubUsername != null && !githubUsername.isBlank()) {
                patterns.add("https://" + githubUsername.trim() + ".github.io");
            }
            String fe = environment.getProperty("FRONTEND_URL");
            if (fe != null && !fe.isBlank()) {
                patterns.add(fe.trim());
            }
            String custom = environment.getProperty("CUSTOM_FRONTEND_URL");
            if (custom != null && !custom.isBlank()) {
                patterns.add(custom.trim());
            }
            endpoint.setAllowedOriginPatterns(patterns.toArray(new String[0]));
        }
        endpoint.withSockJS();
    }
}