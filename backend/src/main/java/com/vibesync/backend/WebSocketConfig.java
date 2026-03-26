package com.vibesync.backend;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 1. Enable a simple memory-based message broker
        config.enableSimpleBroker("/topic"); 
        // 2. Prefix for messages sent FROM client TO server
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 3. The URL where React will connect
        // Get allowed origins from environment or use default
        String allowedOriginsEnv = System.getenv("WEBSOCKET_ORIGINS");
        String[] allowedOrigins;
        
        if (allowedOriginsEnv != null && !allowedOriginsEnv.isEmpty()) {
            // Support multiple origins separated by comma
            allowedOrigins = allowedOriginsEnv.split(",");
            // Trim whitespace from each origin
            for (int i = 0; i < allowedOrigins.length; i++) {
                allowedOrigins[i] = allowedOrigins[i].trim();
            }
        } else {
            // Default to localhost for local development
            allowedOrigins = new String[]{"http://localhost:5173"};
        }
        
        registry.addEndpoint("/ws-vibe")
                .setAllowedOrigins(allowedOrigins)
                .withSockJS();
    }
}