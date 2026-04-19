package com.vibesync.backend;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MusicService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private final RestClient restClient = RestClient.create();

    public Map<String, Object> searchTracks(String query) {
        return searchTracks(query, "youtube");
    }

    public Map<String, Object> searchTracks(String query, String source) {
        if (source == null) {
            source = "youtube";
        }

        switch (source.toLowerCase()) {
            case "apple":
                return searchITunesTracks(query);
            case "both":
                Map<String, Object> combinedResults = new HashMap<>();
                try {
                    combinedResults.put("youtubeResults", searchYouTubeTracks(query).get("results"));
                } catch (IllegalStateException e) {
                    combinedResults.put("youtubeResults", List.of());
                    combinedResults.put("youtubeError", e.getMessage());
                }
                combinedResults.put("appleResults", searchITunesTracks(query).get("results"));
                return combinedResults;
            case "youtube":
            default:
                return searchYouTubeTracks(query);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> searchYouTubeTracks(String query) {
        String encodedQuery = URLEncoder.encode(query + " bollywood song", StandardCharsets.UTF_8);

        try {
            // YouTube Data API v3 search
            String apiKey = System.getenv("YOUTUBE_API_KEY");
            if (apiKey == null || apiKey.isEmpty()) {
                throw new IllegalStateException("YouTube API key is not configured.");
            }

            String responseBody = restClient.get()
                    .uri("https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + encodedQuery + 
                         "&type=video&videoCategoryId=10&maxResults=10&key=" + apiKey)
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
                    .body(String.class);

            Map<String, Object> youtubeResponse = OBJECT_MAPPER.readValue(responseBody, Map.class);
            return convertYouTubeToITunesFormat(youtubeResponse);

        } catch (RestClientResponseException e) {
            throw new IllegalStateException("YouTube search failed: " + e.getStatusCode().value() + " " + e.getResponseBodyAsString(), e);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse music search response", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> searchITunesTracks(String query) {
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);

        try {
            String responseBody = restClient.get()
                    .uri("https://itunes.apple.com/search?term=" + encodedQuery + "&entity=song&limit=10")
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
                    .body(String.class);

            return OBJECT_MAPPER.readValue(responseBody, Map.class);
        } catch (RestClientResponseException e) {
            throw new IllegalStateException("Music search request failed: " + e.getStatusCode().value() + " " + e.getResponseBodyAsString(), e);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse music search response", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> convertYouTubeToITunesFormat(Map<String, Object> youtubeResponse) {
        List<Map<String, Object>> results = new ArrayList<>();
        
        List<Map<String, Object>> items = (List<Map<String, Object>>) youtubeResponse.get("items");
        if (items != null) {
            for (Map<String, Object> item : items) {
                Map<String, Object> snippet = (Map<String, Object>) item.get("snippet");
                if (snippet != null) {
                    Map<String, Object> track = new HashMap<>();
                    track.put("trackId", item.get("id"));
                    track.put("trackName", snippet.get("title"));
                    track.put("artistName", snippet.get("channelTitle"));
                    
                    // YouTube video URL
                    String videoId = ((Map<String, Object>) item.get("id")).get("videoId").toString();
                    track.put("trackViewUrl", "https://www.youtube.com/watch?v=" + videoId);
                    
                    // Thumbnail
                    Map<String, Object> thumbnails = (Map<String, Object>) snippet.get("thumbnails");
                    if (thumbnails != null && thumbnails.containsKey("default")) {
                        Map<String, Object> defaultThumb = (Map<String, Object>) thumbnails.get("default");
                        track.put("artworkUrl100", defaultThumb.get("url"));
                    }
                    
                    results.add(track);
                }
            }
        }
        
        Map<String, Object> converted = new HashMap<>();
        converted.put("results", results);
        return converted;
    }
}