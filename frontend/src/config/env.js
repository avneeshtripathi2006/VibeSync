/**
 * All deployment-specific values come from Vite env (see frontend/.env.example).
 * Local dev: copy .env.example to .env.development
 * GitHub Actions: set secrets (workflow also supplies defaults for this repo).
 */

const trim = (s) => (typeof s === "string" ? s.trim() : "");

export const LOCAL_API_URL = trim(import.meta.env.VITE_LOCAL_API_URL) || "http://localhost:8080";

export const REMOTE_API_URL = trim(import.meta.env.VITE_API_URL);

export const API_TIMEOUT_MS = parseInt(import.meta.env.VITE_API_TIMEOUT || "45000", 10);

const viteApi = trim(import.meta.env.VITE_API_URL);
/** Production GitHub Actions builds should set VITE_API_URL (or use workflow defaults). */
export const API_BASE = viteApi || LOCAL_API_URL;

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

let wsResolved =
  normalizeWsUrl(import.meta.env.VITE_WS_URL) || normalizeWsUrl(apiBaseToSockJsOrigin(API_BASE));

/**
 * Pages served over https:// cannot open ws:// (mixed content). Upgrade to wss://.
 */
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

export const WS_BASE = coerceWssOnHttpsPage(wsResolved);
