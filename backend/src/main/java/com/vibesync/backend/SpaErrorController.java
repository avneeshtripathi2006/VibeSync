package com.vibesync.backend;

import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Custom Error Controller for SPA Routing.
 * 
 * Handles 404 errors by forwarding to /index.html so React Router can take over.
 * This allows client-side routing to work properly on refresh or direct URL access.
 * 
 * For other errors (5xx, etc.), returns a JSON error response.
 */
@Controller
public class SpaErrorController implements ErrorController {

    /**
     * Handle all errors by checking the status code.
     * If 404, forward to index.html so React can route the request.
     * Otherwise, return JSON error response.
     */
    @RequestMapping("/error")
    public Object handleError(HttpServletRequest request) {
        Integer statusCode = (Integer) request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        
        if (statusCode != null && statusCode == HttpStatus.NOT_FOUND.value()) {
            // 404 errors: forward to React app so client-side routing can handle it
            return "forward:/index.html";
        }
        
        // For other errors, return a JSON error response
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", true);
        errorResponse.put("status", statusCode != null ? statusCode : 500);
        errorResponse.put("message", "An error occurred. Please try again.");
        
        HttpStatus status = statusCode != null ? HttpStatus.resolve(statusCode) : HttpStatus.INTERNAL_SERVER_ERROR;
        return ResponseEntity.status(status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
