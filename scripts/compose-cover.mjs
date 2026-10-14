/**
 * Builds the idea-ai-wiki cover so its iMac screen shows the first frame of the hero clip, and the
 * still and the CoverVideo overlay line up when the clip fades in.
 *
 *   node scripts/compose-cover.mjs [path/to/clip-hero-first.png]
 *
 * Base: cover-live.png (the original cover, untouched). Output: cover.png, same size.
 * The screen rect is read from coverScreen in the MDX frontmatter. The frame is fitted like the
 * overlay (object-fit: cover, object-position: top) and gets rounded corners like it.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = `${root}src/assets/work/idea-ai-wiki/`;
const frame = process.argv[2] ?? `${root}../portfolio-recorder-main/output/idea-wiki/clips/clip-hero-first.png`;
/** CoverVideo's 3px corner radius, in cover pixels at the 1600px-wide hero (cover shown at 1520 of 3200px). */
const RADIUS = 6;

const mdx = await readFile(`${root}src/content/work/idea-ai-wiki.mdx`, 'utf8');
const match = mdx.match(/^coverScreen:\s*\{([^}]*)\}/m);
if (!match) throw new Error('coverScreen not found in idea-ai-wiki.mdx');
const pct = Object.fromEntries(match[1].split(',').map((pair) => pair.split(':').map((s) => s.trim())).map(([k, v]) => [k, Number(v)]));

const base = sharp(`${dir}cover-live.png`);
const { width: W, height: H } = await base.metadata();
const left = Math.round((pct.x / 100) * W);
const top = Math.round((pct.y / 100) * H);
const width = Math.round((pct.w / 100) * W);
const height = Math.round((pct.h / 100) * H);

const mask = Buffer.from(
  `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${RADIUS}" ry="${RADIUS}"/></svg>`,
);
const screen = await sharp(frame)
  .resize(width, height, { fit: 'cover', position: 'top' })
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer();

await base.composite([{ input: screen, left, top }]).png({ compressionLevel: 9 }).toFile(`${dir}cover.png`);
console.log(`cover.png ${W}×${H}: frame placed at ${left},${top} size ${width}×${height}, radius ${RADIUS}px`);
