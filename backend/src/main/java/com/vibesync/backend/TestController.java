package com.vibesync.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/test")
    public String checkApp() {
        return "System is Online: VibeSync Engine is running! 🚀";
    }
}