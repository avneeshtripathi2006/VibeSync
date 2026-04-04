package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.List;

@Service
public class AiService {
    private static final RestTemplate restTemplate = new RestTemplate();

    private final String aiServiceUrl;

    public AiService(@Value("${AI_SERVICE_URL:http://localhost:8000}") String aiServiceUrl) {
        this.aiServiceUrl = aiServiceUrl;
    }

    public String getEmbedding(String text) {
        try {
            Map<String, String> request = Map.of("text", text);
            Map<String, Object> response = restTemplate.postForObject(aiServiceUrl + "/embed", request, Map.class);

            List<Double> list = (List<Double>) response.get("embedding");
            // This converts the list [1, 2] into the string "[1, 2]"
            return list.toString();
        } catch (Exception e) {
            System.err.println("AI Embedding Failed: " + e.getMessage()); // 👈 Senior's log
            return null;
        }
    }
}