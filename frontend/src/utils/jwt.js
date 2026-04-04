/**
 * JWT payload uses base64url; atob() alone often fails on "-" / "_" and breaks messaging randomly.
 */
export function parseJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Numeric user id from our backend claims (OAuth + password both use JwtUtil). */
export function getMyUserIdFromToken(token) {
  const p = parseJwtPayload(token);
  if (!p) return null;
  const raw = p.userId ?? p.user_id;
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}
