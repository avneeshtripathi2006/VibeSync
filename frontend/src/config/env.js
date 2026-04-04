/**
 * API resolution + SockJS endpoint.
 * SockJS must receive http(s)://…/ws-vibe — never ws: or wss: (browser URL APIs reject them).
 */

const trim = (s) => (typeof s === "string" ? s.trim() : "");

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

function runtimePublicApiBase() {
  if (import.meta.env.DEV) return "";
  if (!isGithubPagesHost()) return "";
  return GITHUB_PAGES_API_FALLBACK;
}

const resolvedApiBase = viteApi || runtimePublicApiBase() || LOCAL_API_URL;

export const API_BASE = resolvedApiBase;

/**
 * VITE_WS_URL may be ws/wss; SockJS needs the matching http/https URL to the same host and path.
 */
function toSockJsHttpUrl(url) {
  if (!url) return null;
  let u = url.trim();
  u = u.replace(/^wss:\/\//i, "https://").replace(/^ws:\/\//i, "http://");
  if (!/\/ws-vibe\/?$/i.test(u)) {
    u = `${u.replace(/\/$/, "")}/ws-vibe`;
  }
  return u;
}

const viteWsRaw = trim(import.meta.env.VITE_WS_URL);

/** Pass this to `new SockJS(...)` only — http(s) scheme, /ws-vibe path */
export const SOCKJS_URL = toSockJsHttpUrl(viteWsRaw) || `${resolvedApiBase.replace(/\/$/, "")}/ws-vibe`;
