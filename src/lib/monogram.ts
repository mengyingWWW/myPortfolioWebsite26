/**
 * Geometry of the MW monogram on a 512 × 512 grid: two strokes sharing one vertical line,
 * plus the cast shadow and sun used by the live variant (MWLogo.astro).
 */
import type { SunPosition } from './sun';

const DEG = Math.PI / 180;

type Point = readonly [number, number];

/** Baseline of both letters; the shadow is cast onto this ground line. */
export const GROUND = 345;
export const STROKE = 18;
export const SUN_R = 17;

export const M_POINTS: Point[] = [[90, 345], [90, 165], [172, 290], [258, 165], [258, 345]];
export const W_POINTS: Point[] = [[258, 165], [258, 345], [342, 222], [422, 345], [422, 165]];

/** Tight box around the strokes (caps included), for the mark-only variant. */
export const MARK_VIEWBOX = '81 156 350 198';
/**
 * Room for the longest shadow and the sun on either side. The bottom edge is where the letters
 * stand (stroke bottoms), so a ground line placed right under the SVG touches them; the shadow
 * spills below it (the SVG doesn't clip).
 */
export const LIVE_VIEWBOX = `-125 80 765 ${GROUND + STROKE / 2 - 80}`;

const round = (v: number) => Math.round(v * 10) / 10;

export const toPath = (points: readonly Point[]) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${round(x)},${round(y)}`).join(' ');

export type ShadowState = {
  /** +1 casts the shadow to the right (sun on the left, morning), -1 to the left. */
  dir: number;
  /** Shadow length per unit of height. */
  k: number;
};

/** Longest shadow from the real sun (the hover scrub can stretch it further sideways). */
const MAX_K = 1.1;
const SCRUB_MAX_K = 1.6;

/** Both letters projected onto the ground, as one path so the shared stroke isn't darkened twice. */
export function shadowPath({ dir, k }: ShadowState) {
  // The depth stops growing at MAX_K so the longest shadows stay clear of whatever sits below the ground line.
  const drop = Math.min(k, MAX_K) * 0.28;
  const cast = (points: readonly Point[]) =>
    points.map(([x, y]): Point => {
      const h = GROUND - y;
      return [x + dir * h * k, GROUND + h * drop];
    });
  return `${toPath(cast(M_POINTS))} ${toPath(cast(W_POINTS))}`;
}

/**
 * On an arc over the monogram: beside it (y = 150) when the sun is due east or west, rising
 * over the top towards noon. The arc stays clear of the strokes at every point.
 */
export function sunSpot(dir: number) {
  return { x: 256 - dir * 240, y: 150 - 44 * Math.sqrt(Math.max(0, 1 - dir * dir)) };
}

/** The sun's east-west component (east = left of the drawing) sets the side; altitude sets the length. */
export function shadowFromSun({ altitude, azimuth }: SunPosition): ShadowState & { night: boolean } {
  const k = 0.5 / Math.tan(Math.max(altitude, 0.1) * DEG);
  return {
    dir: Math.sin(azimuth * DEG),
    k: Math.min(MAX_K, Math.max(0.2, k)),
    night: altitude < 0,
  };
}

/** Where the letters stand (stroke bottoms); the sun path sits on it. */
export const GROUND_LINE = GROUND + STROKE / 2;
const CENTER_X = 256;
/** 1.3 × the monogram's width. */
export const SUN_PATH_R = 455;

/** The hover sun path: a semicircle on the ground line, from the left horizon to the right. */
export const SUN_PATH_D = `M${CENTER_X - SUN_PATH_R},${GROUND_LINE} A${SUN_PATH_R},${SUN_PATH_R} 0 0 1 ${CENTER_X + SUN_PATH_R},${GROUND_LINE}`;

/** Sun on the hover path at angle θ (radians): 0 = left horizon, π/2 = overhead, π = right horizon. */
export function sunOnPath(theta: number) {
  return { x: CENTER_X - SUN_PATH_R * Math.cos(theta), y: GROUND_LINE - SUN_PATH_R * Math.sin(theta) };
}

/** Shadow for the sun at θ on the hover path: opposite the sun, longest near the horizons. */
export function shadowFromAngle(theta: number): ShadowState {
  const elevation = Math.max(0.01, Math.min(theta, Math.PI - theta));
  return {
    dir: Math.cos(theta),
    k: Math.min(SCRUB_MAX_K, Math.max(0.2, 0.5 / Math.tan(elevation))),
  };
}

/** Rendered on the server before the real sun is known: morning sun on the left. */
export const DEFAULT_SHADOW: ShadowState = { dir: 1, k: 0.45 };
