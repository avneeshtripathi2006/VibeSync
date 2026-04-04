/**
 * API / WS resolution:
 * 1) VITE_* baked in at build (CI or .env.development)
 * 2) Runtime: *.github.io production → public Render backend (survives stale builds / cache)
 * 3) Local dev fallback → localhost:8080
 */

const trim = (s) => (typeof s === "string" ? s.trim() : "");

/** Override via Vite if you change host: `VITE_PUBLIC_API_FALLBACK=https://...` */
const GITHUB_PAGES_API_FALLBACK =
  trim(import.meta.env.VITE_PUBLIC_API_FALLBACK) || "https://vibesync-zc9a.onrender.com";

export const LOCAL_API_URL = trim(import.meta.env.VITE_LOCAL_API_URL) || "http://localhost:8080";

export const REMOTE_API_URL = trim(import.meta.env.VITE_API_URL);

export const API_TIMEOUT_MS = parseInt(import.meta.env.VITE_API_TIMEOUT || "45000", 10);

const viteApi = trim(import.meta.env.VITE_API_URL);

function isGithubPagesHost() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "github.io" || h.endsWith(".github.io");
}

/** When the SPA is served from GitHub Pages, never use localhost as the API. */
function runtimePublicApiBase() {
  if (import.meta.env.DEV) return "";
  if (!isGithubPagesHost()) return "";
  return GITHUB_PAGES_API_FALLBACK;
}

const resolvedApiBase = viteApi || runtimePublicApiBase() || LOCAL_API_URL;

export const API_BASE = resolvedApiBase;

const normalizeWsUrl = (url) => {
  if (!url || !url.trim()) return null;
  let t = url.trim();
  if (/^https?:\/\//i.test(t)) {
    return t.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://");
  }
  if (/^wss?:\/\//i.test(t)) return t;
  return `wss://${t}`;
};

const apiBaseToSockJsOrigin = (apiBase) => {
  if (!apiBase) return null;
  const o = apiBase
    .replace(/^https:\/\//i, "wss://")
    .replace(/^http:\/\//i, "ws://")
    .replace(/\/$/, "");
  return `${o}/ws-vibe`;
};

const viteWs = trim(import.meta.env.VITE_WS_URL);
const wsFromViteOrApi =
  normalizeWsUrl(viteWs) || normalizeWsUrl(apiBaseToSockJsOrigin(resolvedApiBase));

const coerceWssOnHttpsPage = (url) => {
  if (!url || typeof window === "undefined") return url;
  try {
    if (window.location.protocol === "https:" && url.startsWith("ws://")) {
      return `wss://${url.slice(5)}`;
    }
  } catch (_) {
    /* ignore */
  }
  return url;
};

export const WS_BASE = coerceWssOnHttpsPage(wsFromViteOrApi);
