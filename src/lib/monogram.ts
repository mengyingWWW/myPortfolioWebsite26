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

/** Longest shadow from the real sun (the pointer sun can stretch it further sideways). */
const MAX_K = 1.1;

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

/** Where the letters stand (stroke bottoms): the visible ground line. */
export const GROUND_LINE = GROUND + STROKE / 2;
const CENTER_X = 256;
/** Lowest sun the pointer casts from; anything flatter would throw the shadow off the page. */
const MIN_ALTITUDE = 6 * DEG;

/**
 * Sunlight from a sun at (x, y) in the drawing. The shadow falls away from the sun, and its
 * length per unit of height is 1 / tan(altitude), the altitude being the sun's angle above the
 * ground line seen from the base center.
 */
export function shadowFromPoint(x: number, y: number): ShadowState {
  const dx = x - CENTER_X;
  const altitude = Math.max(MIN_ALTITUDE, Math.atan2(GROUND_LINE - y, Math.abs(dx)));
  return { dir: dx < 0 ? 1 : -1, k: 1 / Math.tan(altitude) };
}

/** Longest shadow (as k) cast towards `dir` that still ends between minX and maxX. */
export function maxShadowK(dir: number, minX: number, maxX: number) {
  let k = Infinity;
  for (const [x, y] of [...M_POINTS, ...W_POINTS]) {
    const h = GROUND - y;
    if (h > 0) k = Math.min(k, (dir > 0 ? maxX - x : x - minX) / h);
  }
  return Math.max(0, k);
}

/** Rendered on the server before the real sun is known: morning sun on the left. */
export const DEFAULT_SHADOW: ShadowState = { dir: 1, k: 0.45 };
