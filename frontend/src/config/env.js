/**
 * SockJS must use http(s)://…/ws-vibe (never ws:/wss:).
 * Use getApiBase() / getSockJsUrl() at request time so the first paint sees the real window.location (GitHub Pages).
 */

const trim = (s) => (typeof s === "string" ? s.trim() : "");

const GITHUB_PAGES_API_FALLBACK =
  trim(import.meta.env.VITE_PUBLIC_API_FALLBACK) || "https://vibesync-zc9a.onrender.com";

export const LOCAL_API_URL = trim(import.meta.env.VITE_LOCAL_API_URL) || "http://localhost:8080";

export const REMOTE_API_URL = trim(import.meta.env.VITE_API_URL);

export const API_TIMEOUT_MS = parseInt(import.meta.env.VITE_API_TIMEOUT || "45000", 10);

function isGithubPagesHost() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "github.io" || h.endsWith(".github.io");
}

/** Resolve at call time (not module load) — avoids first-visit races on GitHub Pages. */
export function getApiBase() {
  const viteApi = trim(import.meta.env.VITE_API_URL);
  if (viteApi) return viteApi;
  if (!import.meta.env.DEV && isGithubPagesHost()) {
    return GITHUB_PAGES_API_FALLBACK;
  }
  return LOCAL_API_URL;
}

function toSockJsHttpUrl(url) {
  if (!url) return null;
  let u = url.trim();
  u = u.replace(/^wss:\/\//i, "https://").replace(/^ws:\/\//i, "http://");
  if (!/\/ws-vibe\/?$/i.test(u)) {
    u = `${u.replace(/\/$/, "")}/ws-vibe`;
  }
  return u;
}

export function getSockJsUrl() {
  const viteWsRaw = trim(import.meta.env.VITE_WS_URL);
  const api = getApiBase();
  return toSockJsHttpUrl(viteWsRaw) || `${api.replace(/\/$/, "")}/ws-vibe`;
}
