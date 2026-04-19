/**
 * pgvector `<=>` is cosine distance ≈ 1 - cos_sim, range [0, 2] for typical embedding rows.
 * (Do NOT use (1 - d) * 100 — that treats d as if it were already in [0,1] and breaks for real distances.)
 */
export function matchPercentFromDistance(distance) {
  if (distance == null || typeof distance !== "number" || Number.isNaN(distance)) {
    return null;
  }
  const d = Math.max(0, Math.min(2, distance));
  return Math.round(100 * (1 - d / 2));
}

export function formatMatchPercent(distance) {
  const p = matchPercentFromDistance(distance);
  if (p == null) return { label: "—", title: "Add a bio with embedding to see vibe match" };
  return { label: `${p}%`, title: "Cosine-based vibe similarity" };
}
