package com.vibesync.backend.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;

/**
 * Tries databases in order: local Postgres (when configured), then Supabase (when configured),
 * then a single {@code SPRING_DATASOURCE_URL} (typical for Render), then a dev default.
 */
@Configuration
@Profile("!test")
public class FlexibleDataSourceConfiguration {

    private static final Logger log = LoggerFactory.getLogger(FlexibleDataSourceConfiguration.class);

    @Bean
    public DataSource dataSource(Environment env) {
        List<DbTarget> targets = buildTargets(env);
        Exception last = null;
        for (DbTarget t : targets) {
            HikariDataSource ds = createDataSource(t);
            boolean useThis = false;
            try {
                useThis = ping(ds);
                if (useThis) {
                    log.info("Using {} database ({})", t.label(), maskUrl(t.jdbcUrl()));
                    return ds;
                }
            } catch (Exception e) {
                last = e;
                log.debug("Database '{}' unreachable: {}", t.label(), e.getMessage());
            } finally {
                if (!useThis) {
                    try {
                        ds.close();
                    } catch (Exception ignored) {
                    }
                }
            }
        }
        String msg = "Could not connect to any configured database. Check DB_LOCAL_*, DB_SUPABASE_*, or SPRING_DATASOURCE_* in .env / host environment.";
        if (last != null) {
            throw new IllegalStateException(msg, last);
        }
        throw new IllegalStateException(msg);
    }

    private static List<DbTarget> buildTargets(Environment env) {
        List<DbTarget> list = new ArrayList<>();
        String localUrl = env.getProperty("DB_LOCAL_JDBC_URL");
        if (localUrl != null && !localUrl.isBlank()) {
            list.add(new DbTarget(
                    "local",
                    localUrl.trim(),
                    env.getProperty("DB_LOCAL_USERNAME", "postgres"),
                    env.getProperty("DB_LOCAL_PASSWORD", "")
            ));
        }
        String supaUrl = env.getProperty("DB_SUPABASE_JDBC_URL");
        if (supaUrl != null && !supaUrl.isBlank()) {
            list.add(new DbTarget(
                    "supabase",
                    supaUrl.trim(),
                    env.getProperty("DB_SUPABASE_USERNAME", "postgres"),
                    env.getProperty("DB_SUPABASE_PASSWORD", "")
            ));
        }
        if (list.isEmpty()) {
            String single = env.getProperty("SPRING_DATASOURCE_URL");
            if (single != null && !single.isBlank()) {
                list.add(new DbTarget(
                        "primary",
                        single.trim(),
                        env.getProperty("SPRING_DATASOURCE_USERNAME", "postgres"),
                        env.getProperty("SPRING_DATASOURCE_PASSWORD", "")
                ));
            }
        }
        if (list.isEmpty()) {
            list.add(new DbTarget(
                    "default-local",
                    "jdbc:postgresql://localhost:5432/vibesync_db",
                    env.getProperty("SPRING_DATASOURCE_USERNAME", "postgres"),
                    env.getProperty("SPRING_DATASOURCE_PASSWORD", "postgres")
            ));
        }
        return list;
    }

    private static HikariDataSource createDataSource(DbTarget t) {
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(augmentPostgresUrl(t.jdbcUrl()));
        cfg.setUsername(t.username());
        cfg.setPassword(t.password() != null ? t.password() : "");
        cfg.setDriverClassName("org.postgresql.Driver");
        cfg.setMaximumPoolSize(10);
        cfg.setConnectionTimeout(5_000);
        cfg.setValidationTimeout(3_000);
        return new HikariDataSource(cfg);
    }

    private static String augmentPostgresUrl(String jdbcUrl) {
        if (jdbcUrl == null || !jdbcUrl.startsWith("jdbc:postgresql://")) {
            return jdbcUrl;
        }
        if (jdbcUrl.contains("prepareThreshold=") || jdbcUrl.contains("preferQueryMode=")) {
            return jdbcUrl;
        }
        String separator = jdbcUrl.contains("?") ? "&" : "?";
        return jdbcUrl + separator + "prepareThreshold=0&preferQueryMode=simple";
    }

    private static boolean ping(HikariDataSource ds) {
        try (Connection c = ds.getConnection()) {
            return c.isValid(3);
        } catch (Exception e) {
            return false;
        }
    }

    private static String maskUrl(String jdbcUrl) {
        if (jdbcUrl == null) {
            return "";
        }
        int at = jdbcUrl.lastIndexOf('@');
        if (at > 0 && jdbcUrl.contains("://")) {
            return jdbcUrl.substring(0, jdbcUrl.indexOf("://") + 3) + "…" + jdbcUrl.substring(at);
        }
        return jdbcUrl;
    }

    private record DbTarget(String label, String jdbcUrl, String username, String password) {}
}
