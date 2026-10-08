/**
 * Shared tone of the hero's leaf shadows. Used by the WebGL background (LeafShadow.astro)
 * and exposed to CSS as --shadow-alpha (BaseLayout.astro) for the cursor's cast shadow.
 */

/** Brightness of the darkest shadow (0.82 = 82% brightness). The lightest is always white. */
export const SHADOW_DARKNESS = 0.82;

/** Black alpha that renders the darkest shadow's gray on white: 1 - SHADOW_DARKNESS. */
export const SHADOW_ALPHA = +(1 - SHADOW_DARKNESS).toFixed(3);
