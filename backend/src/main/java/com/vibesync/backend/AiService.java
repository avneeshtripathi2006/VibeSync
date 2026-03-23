package com.vibesync.backend;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.List;

@Service
public class AiService {
    // Reuse the same "Worker" for every request
    private static final RestTemplate restTemplate = new RestTemplate(); 
    private final String PYTHON_URL = "http://localhost:8000/embed";

    public String getEmbedding(String text) {
        try {
            Map<String, String> request = Map.of("text", text);
            Map<String, Object> response = restTemplate.postForObject(PYTHON_URL, request, Map.class);

            List<Double> list = (List<Double>) response.get("embedding");
            // This converts the list [1, 2] into the string "[1, 2]"
            return list.toString();
        } catch (Exception e) {
            System.err.println("AI Embedding Failed: " + e.getMessage()); // 👈 Senior's log
            return null;
        }
    }
}