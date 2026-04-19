package com.vibesync.backend;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Forward the root route to index.html for React Router.
 * Other frontend routes are handled by SpaErrorController which catches 404s.
 */
@Controller
public class FrontendController {

    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }
}
