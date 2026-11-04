/**
 * Pencil marks for SVG, in the About page's sketch style (SketchSundial.astro): a jittered double
 * stroke in graphite, a grain filter, and diagonal hatching. The values match that component's; keep
 * them in step if its style changes.
 *
 * createPen(svg, prefix) binds the helpers to one <svg>; call pen.defs() after clearing it, before drawing.
 * prefix scopes the filter and pattern ids (default "hd"), so two drawings on one page don't share ids.
 * Hatching fills reference url(#<prefix>-hatch) and url(#<prefix>-hatch-x).
 */

const NS = 'http://www.w3.org/2000/svg';

/** Near: main lines. Far: the distant-mountain grey, for echoes and crumbs. Widths as in the About sketch. */
export const NEAR = '#151515', FAR = '#8E8E8E', HATCH = '#2A2A2A';
export const W_NORMAL = 1.8, W_THIN = 1.15, W_LIGHT = 1;
/** Light comes from the upper left: a cast shadow sits this far right and down per unit of offset. */
export const CAST = [1, .8];

export function clamp(x) { return Math.max(0, Math.min(1, x)); }
export function easeIO(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
/** Seeded random, so each word's mark is the same drawing every time. */
export function rng(s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
export function el(tag, a) { var e = document.createElementNS(NS, tag); for (var k in a) e.setAttribute(k, a[k]); return e; }
export function jit(pts, r, a) { return pts.map(function (p) { return [p[0] + (r() - .5) * a, p[1] + (r() - .5) * a]; }); }

/** Catmull-Rom through the points, as a cubic Bézier path. */
export function smooth(pts, closed) {
  var P = closed ? [pts[pts.length - 1]].concat(pts, [pts[0], pts[1]]) : [pts[0]].concat(pts, [pts[pts.length - 1]]), d = 'M' + P[1][0].toFixed(1) + ' ' + P[1][1].toFixed(1);
  for (var i = 1; i < P.length - 2; i++) { var p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1); }
  return d + (closed ? ' Z' : ''); }
/** Corners of a rectangle with chamfered corners of size c. */
export function rrect(x, y, w, h, c) { return [[x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c], [x + w - c, y + h], [x + c, y + h], [x, y + h - c], [x, y + c]]; }

export function createPen(svg, prefix) {
  var pfx = prefix || 'hd', inkId = pfx + '-ink', hatchInkId = pfx + '-hatch-ink', hatchId = pfx + '-hatch', hatchXId = pfx + '-hatch-x';
  /** The pencil grain filter and the hatch patterns (About: sks-ink, sks-hatch, sks-hatch-ink). */
  function defs() { var d = el('defs', {});
    var f = el('filter', { id: inkId, x: '-5%', y: '-5%', width: '110%', height: '110%' });
    f.appendChild(el('feTurbulence', { type: 'fractalNoise', baseFrequency: '1.1', numOctaves: '2', seed: '4', result: 'n' }));
    f.appendChild(el('feDisplacementMap', { 'in': 'SourceGraphic', in2: 'n', scale: '1.4' })); d.appendChild(f);
    var fh = el('filter', { id: hatchInkId, x: '-5%', y: '-20%', width: '110%', height: '140%' });
    fh.appendChild(el('feTurbulence', { type: 'fractalNoise', baseFrequency: '.9', numOctaves: '2', seed: '9', result: 'n' }));
    fh.appendChild(el('feDisplacementMap', { 'in': 'SourceGraphic', in2: 'n', scale: '2.2' })); d.appendChild(fh);
    [[hatchId, -38], [hatchXId, 52]].forEach(function (h) {
      var pt = el('pattern', { id: h[0], width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(' + h[1] + ')' });
      pt.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: 5, stroke: HATCH, 'stroke-width': 1.2 })); d.appendChild(pt); });
    svg.appendChild(d); }
  /** A path's outline as runs of points (split where it jumps), every 1.2px. */
  function samplePath(d) {
    var p = el('path', { d: d }); svg.appendChild(p);
    var L = p.getTotalLength(), runs = [], run = [], prev = null;
    for (var t = 0; t <= L; t += 1.2) { var q = p.getPointAtLength(t), pt = [q.x, q.y];
      if (prev && Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) > 6) { if (run.length > 1) runs.push(run); run = []; }
      run.push(pt); prev = pt; }
    if (run.length > 1) runs.push(run); p.remove(); return runs; }
  /** The About sketch's hand line: a full pass and a lighter, finer pass, each with its own slight wobble. */
  function handLine(runs, col, w, R) {
    var out = [];
    for (var pass = 0; pass < 2; pass++) {
      var ph1 = R() * 6.28, ph2 = R() * 6.28, amp = pass ? .9 : .55, f = .03 + R() * .03, d = '';
      runs.forEach(function (s) { var acc = 0;
        s.forEach(function (q, i) { var n = s[Math.min(s.length - 1, i + 1)], pv = s[Math.max(0, i - 1)], nx = -(n[1] - pv[1]), ny = n[0] - pv[0], l = Math.hypot(nx, ny) || 1;
          nx /= l; ny /= l; if (i) acc += Math.hypot(q[0] - s[i - 1][0], q[1] - s[i - 1][1]);
          var o = amp * (Math.sin(acc * f * 6.28 + ph1) * .7 + Math.sin(acc * f * 2.3 * 6.28 + ph2) * .3) + (pass ? .5 : 0);
          d += (i ? 'L' : 'M') + (q[0] + nx * o).toFixed(1) + ' ' + (q[1] + ny * o).toFixed(1) + ' '; }); });
      out.push(el('path', { d: d, fill: 'none', stroke: col, 'stroke-width': pass ? w * .55 : w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: pass ? .45 : .92 }));
    }
    return out; }
  /** A finished pencil line along path d, grained like the About sketch. */
  function pencil(parent, d, col, w, R) { var g = el('g', { filter: 'url(#' + inkId + ')' }); handLine(samplePath(d), col, w, R).forEach(function (p) { g.appendChild(p); }); parent.appendChild(g); return g; }
  /** A pencil line drawn on over ms, after delay; the finer pass trails slightly, as on the About page. */
  function drawPencil(parent, d, col, w, R, ms, delay) { var g = pencil(parent, d, col, w, R), ps = [].slice.call(g.children), t0 = performance.now() + (delay || 0);
    ps.forEach(function (p) { p.setAttribute('pathLength', 1); p.setAttribute('stroke-dasharray', 1); p.setAttribute('stroke-dashoffset', 1); });
    (function step(now) { var done = true;
      ps.forEach(function (p, i) { var t = (now - t0 - i * ms * .15) / ms; if (t < 1) done = false; p.setAttribute('stroke-dashoffset', (1 - easeIO(clamp(t))).toFixed(3)); });
      if (!done && g.isConnected) requestAnimationFrame(step); })(performance.now());
    return g; }
  /** A region of hatching, roughened like the About sketch's shadows. */
  function hatch(parent, d, opacity, cross) { var g = el('g', { filter: 'url(#' + hatchInkId + ')', opacity: opacity == null ? .7 : opacity });
    g.appendChild(el('path', { d: d, fill: 'url(#' + hatchId + ')' })); if (cross) g.appendChild(el('path', { d: d, fill: 'url(#' + hatchXId + ')' }));
    parent.appendChild(g); return g; }
  function fadeIn(node, ms, delay) { var to = +(node.getAttribute('opacity') || 1); node.setAttribute('opacity', 0); var t0 = performance.now() + delay;
    (function step(now) { var t = (now - t0) / ms; if (t >= 0) node.setAttribute('opacity', (to * clamp(t)).toFixed(2)); if (t < 1 && node.isConnected) requestAnimationFrame(step); })(performance.now()); }
  return { defs: defs, pencil: pencil, drawPencil: drawPencil, hatch: hatch, fadeIn: fadeIn };
}
