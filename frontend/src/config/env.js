/**
 * All deployment-specific values come from Vite env (see frontend/.env.example).
 * Local dev: copy .env.example to .env.development
 * GitHub Actions: set secrets referenced in .github/workflows/deploy-frontend.yml
 */

const trim = (s) => (typeof s === "string" ? s.trim() : "");

export const LOCAL_API_URL = trim(import.meta.env.VITE_LOCAL_API_URL) || "http://localhost:8080";

/** Primary API (after local probe fails, or sole URL in production builds) */
export const REMOTE_API_URL = trim(import.meta.env.VITE_API_URL);

export const API_TIMEOUT_MS = parseInt(import.meta.env.VITE_API_TIMEOUT || "45000", 10);

export const API_BASE = trim(import.meta.env.VITE_API_URL) || LOCAL_API_URL;

const normalizeWsUrl = (url) => {
  if (!url || !url.trim()) return null;
  let t = url.trim();
  if (/^https?:\/\//i.test(t)) {
    return t.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://");
  }
  if (/^wss?:\/\//i.test(t)) return t;
  return `wss://${t}`;
};

const defaultWs = `${API_BASE.replace(/^http/i, "ws")}/ws-vibe`;
export const WS_BASE = normalizeWsUrl(import.meta.env.VITE_WS_URL) || normalizeWsUrl(defaultWs);
