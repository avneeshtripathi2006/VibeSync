package com.vibesync.backend.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/**
 * Loads backend/.env (or ./.env when running from backend dir) into the environment before
 * {@code application.properties} are bound. Ignored if no file is present (e.g. Render/Railway).
 */
public class DotEnvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String SOURCE_NAME = "dotenvFile";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Avoid loading developer .env during Maven Surefire (would override test H2 settings)
        if (System.getProperty("surefire.test.class.path") != null) {
            return;
        }
        Path envFile = resolveEnvFile();
        if (envFile == null || !Files.isRegularFile(envFile)) {
            return;
        }
        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory(envFile.getParent().toString())
                    .filename(envFile.getFileName().toString())
                    .ignoreIfMalformed()
                    .load();
            Map<String, Object> map = new HashMap<>();
            dotenv.entries().forEach(e -> {
                String k = e.getKey();
                if (k != null && !k.isBlank() && !map.containsKey(k)) {
                    map.put(k, e.getValue());
                }
            });
            if (!map.isEmpty()) {
                environment.getPropertySources().addFirst(new MapPropertySource(SOURCE_NAME, map));
            }
        } catch (Exception ignored) {
            // .env optional; invalid file should not block startup
        }
    }

    private static Path resolveEnvFile() {
        Path cwd = Path.of(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        if (Files.isRegularFile(cwd.resolve("pom.xml")) && Files.isRegularFile(cwd.resolve(".env"))) {
            return cwd.resolve(".env");
        }
        Path inBackend = cwd.resolve("backend").resolve(".env");
        if (Files.isRegularFile(inBackend)) {
            return inBackend;
        }
        Path parent = cwd.getParent();
        if (parent != null && Files.isRegularFile(parent.resolve("backend").resolve(".env"))) {
            return parent.resolve("backend").resolve(".env");
        }
        return null;
    }
}
