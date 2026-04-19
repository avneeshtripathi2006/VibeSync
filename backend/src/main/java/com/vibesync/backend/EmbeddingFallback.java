package com.vibesync.backend;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Same 384-dim pseudo-embedding as {@code vibe-engine/main.py} (/embed) so matches work when the
 * external engine is down or misconfigured (Render free tier friendly).
 */
public final class EmbeddingFallback {

    private static final int DIM = 384;

    private EmbeddingFallback() {
    }

    public static String vectorLiteralFromText(String text) {
        String input = text == null ? "" : text;
        byte[] raw = input.getBytes(StandardCharsets.UTF_8);
        if (raw.length > 800) {
            raw = java.util.Arrays.copyOf(raw, 800);
        }
        byte[] digest;
        try {
            digest = MessageDigest.getInstance("SHA-256").digest(raw);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
        StringBuilder sb = new StringBuilder(DIM * 8);
        sb.append('[');
        for (int i = 0; i < DIM; i++) {
            if (i > 0) {
                sb.append(',');
            }
            int idx = i % digest.length;
            int val = digest[idx] & 0xff;
            double v = (val / 255.0) * 2.0 - 1.0;
            sb.append(v);
        }
        sb.append(']');
        return sb.toString();
    }
}
