/**
 * Geometry for the About page's sun-path progress indicator (SVG viewBox 200×70):
 * a sun on a dashed elliptical path above a ground line, a gnomon, its light ray and cast shadow.
 * Shared by the server render (first frame) and the scroll animation.
 */

export const SUN_PATH = {
  ground: 58,
  cx: 100,
  rx: 72,
  ry: 44,
  gnomonHeight: 14,
  tipMin: 22,
  tipMax: 178,
};

export type SunPathGeometry = {
  sun: { x: number; y: number };
  ray: { x1: number; y1: number; x2: number; y2: number };
  shadow: { x: number; width: number };
};

const n = (v: number) => +v.toFixed(2);

/** t ∈ [0, 1]: sunrise at the left end, noon at the top, sunset at the right end. */
export function sunPathGeometry(t: number): SunPathGeometry {
  const { ground: G, cx, rx, ry, gnomonHeight, tipMin, tipMax } = SUN_PATH;
  const top = G - gnomonHeight;

  // Never quite on the horizon at either end.
  const a = Math.PI * (0.06 + 0.88 * t);
  const sx = cx - rx * Math.cos(a);
  const sy = G - ry * Math.sin(a);

  // The ray from the sun through the gnomon's top meets the ground at the shadow tip. With the
  // sun at or below the top it never does, so the shadow runs to the far end, away from the sun.
  const rise = top - sy;
  const away = sx < cx ? tipMax : tipMin;
  const tipX =
    rise > 0 ? Math.min(tipMax, Math.max(tipMin, cx + (cx - sx) * (gnomonHeight / rise))) : sx === cx ? cx : away;

  // The ray ends where it reaches the tip's x, on the ground unless the tip was clamped.
  const s = sx === cx ? 0 : (tipX - cx) / (cx - sx);
  const rayEndY = sx === cx ? G : top + s * rise;

  return {
    sun: { x: n(sx), y: n(sy) },
    ray: { x1: n(sx), y1: n(sy), x2: n(tipX), y2: n(rayEndY) },
    shadow: { x: n(Math.min(cx, tipX)), width: n(Math.max(1.5, Math.abs(tipX - cx))) },
  };
}
