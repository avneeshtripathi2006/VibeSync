package com.vibesync.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.List;

@Service
public class AiService {

    private final RestClient restClient;

    public AiService(@Value("${AI_SERVICE_URL:http://localhost:8000}") String aiServiceUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(aiServiceUrl.endsWith("/") ? aiServiceUrl.substring(0, aiServiceUrl.length() - 1) : aiServiceUrl)
                .build();
    }

    record EmbedRequest(String text) {}
    record EmbedResponse(List<Double> embedding) {}

    public String getEmbedding(String text) {
        try {
            EmbedResponse response = restClient.post()
                    .uri("/embed")
                    .body(new EmbedRequest(text != null ? text : ""))
                    .retrieve()
                    .body(EmbedResponse.class);

            if (response == null || response.embedding() == null || response.embedding().isEmpty()) {
                return null;
            }

            return response.embedding().toString(); // Java lists natively output [x, y, z] format

        } catch (Exception e) {
            // Use a proper logger like SLF4J (log.error(...)) instead of System.err
            System.err.println("AI Embedding Failed: " + e.getMessage());
            return null;
        }
    }
}
