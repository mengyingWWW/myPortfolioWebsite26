/**
 * Geometry for the About page's latitude sundial (SVG viewBox 1000×400).
 * Shared by the server render (first frame) and the client animation.
 */

/** y of the ground line. */
export const GROUND_Y = 330;
/** x the objects are centered on. */
export const OBJECT_X = 400;
/** How far down the ground plane the shadow is pushed per unit of length (fake perspective). */
const SHADOW_SKEW = 0.15;
/** Distance of the sun from the shadow tip, along the ray. */
const SUN_DISTANCE = 330;
/** Highest the sun may sit above the ground, so it stays clear of the text above. */
const SUN_MAX_RISE = 250;
/** Radius of the angle arc at the shadow tip. */
const ARC_RADIUS = 46;
/** y of the floating object's underside, where its detached shadow is cast from. */
const FLOAT_BASE_Y = 205;
/** Radius of the "me" dot, a scale figure placed in each scene. */
export const ME_DOT_R = 2.5;

export type SundialGeometry = {
  shadowTransform: string;
  ray: { x1: number; y1: number; x2: number; y2: number };
  sun: string;
  arc: string;
  label: { x: number; y: number; text: string };
  /** cx of the detached ground shadow under a floating object. */
  floatShadowX: number;
};

const n = (v: number) => +v.toFixed(2);

export function sundialGeometry(altitudeDeg: number, height: number): SundialGeometry {
  const G = GROUND_Y;
  const a = (altitudeDeg * Math.PI) / 180;
  const r = 1 / Math.tan(a);

  // A point at height y = G - Y lands at (X + r·y, G + skew·r·y).
  const shadowTransform = `matrix(1 0 ${n(-r)} ${n(-SHADOW_SKEW * r)} ${n(r * G)} ${n(G * (1 + SHADOW_SKEW * r))})`;

  // The ray grazes the top of the object and meets the ground at the shadow tip.
  const tipX = OBJECT_X + height * r;
  const sunDistance = Math.min(SUN_DISTANCE, SUN_MAX_RISE / Math.sin(a));
  const sunX = tipX - sunDistance * Math.cos(a);
  const sunY = G - sunDistance * Math.sin(a);

  const R = ARC_RADIUS;
  const arcEndX = tipX - R * Math.cos(a);
  const arcEndY = G - R * Math.sin(a);

  return {
    shadowTransform,
    ray: { x1: n(sunX), y1: n(sunY), x2: n(tipX), y2: G },
    sun: `translate(${n(sunX)} ${n(sunY)})`,
    arc: `M ${n(tipX - R)} ${G} A ${R} ${R} 0 0 1 ${n(arcEndX)} ${n(arcEndY)}`,
    // Right of the shadow tip, clear of the object.
    label: { x: n(tipX + 10), y: G - 8, text: `${altitudeDeg.toFixed(1)}°` },
    floatShadowX: n(OBJECT_X + r * (G - FLOAT_BASE_Y)),
  };
}
