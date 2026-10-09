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
/** Leaves room for the longest shadow and the sun on either side. */
export const LIVE_VIEWBOX = '-125 80 765 340';

const round = (v: number) => Math.round(v * 10) / 10;

export const toPath = (points: readonly Point[]) =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${round(x)},${round(y)}`).join(' ');

export type ShadowState = {
  /** +1 casts the shadow to the right (sun on the left, morning), -1 to the left. */
  dir: number;
  /** Shadow length per unit of height. */
  k: number;
};

/** Both letters projected onto the ground, as one path so the shared stroke isn't darkened twice. */
export function shadowPath({ dir, k }: ShadowState) {
  const cast = (points: readonly Point[]) =>
    points.map(([x, y]): Point => {
      const h = GROUND - y;
      return [x + dir * h * k, GROUND + h * k * 0.28];
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
    k: Math.min(1.1, Math.max(0.2, k)),
    night: altitude < 0,
  };
}

/** Rendered on the server before the real sun is known: morning sun on the left. */
export const DEFAULT_SHADOW: ShadowState = { dir: 1, k: 0.45 };
