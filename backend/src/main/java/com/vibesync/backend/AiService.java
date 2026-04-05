package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {
    private static final RestTemplate restTemplate = new RestTemplate();

    private final String aiServiceUrl;

    public AiService(@Value("${AI_SERVICE_URL:http://localhost:8000}") String aiServiceUrl) {
        this.aiServiceUrl = aiServiceUrl;
    }

    public String getEmbedding(String text) {
        try {
            Map<String, String> body = new HashMap<>();
            body.put("text", text != null ? text : "");
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            Map<String, Object> response = restTemplate.postForObject(aiServiceUrl + "/embed", entity, Map.class);
            if (response == null) {
                return null;
            }
            @SuppressWarnings("unchecked")
            List<Double> list = (List<Double>) response.get("embedding");
            if (list == null || list.isEmpty()) {
                return null;
            }
            String vectorLiteral = list.stream()
                    .map(String::valueOf)
                    .collect(java.util.stream.Collectors.joining(","));
            return "[" + vectorLiteral + "]";
        } catch (Exception e) {
            System.err.println("AI Embedding Failed: " + e.getMessage());
            return null;
        }
    }
}