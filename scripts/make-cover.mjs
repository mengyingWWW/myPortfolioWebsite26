/**
 * Puts a video's first frame into the device screen of a project's cover, so the still cover and
 * the CoverVideo overlay show the same screen. See README → "Matching a cover to its hero clip".
 *
 *   node scripts/make-cover.mjs <slug> <first-frame.png> [--radius <px>]
 *
 * Reads `cover` and `coverScreen` from src/content/work/<slug>.mdx. The frame is fitted exactly like
 * CoverVideo renders the clip: scaled to cover the screen rect, cropped from the bottom
 * (object-position: top), with rounded corners.
 * The untouched cover is kept as <name>-original.<ext> (created on the first run) and every run
 * composites onto that, so re-running with a new frame never stacks on an old one.
 */
import { copyFile, readFile, access } from 'node:fs/promises';
import { dirname, extname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import sharp from 'sharp';

const args = process.argv.slice(2);
const radiusFlag = args.indexOf('--radius');
const radiusArg = radiusFlag >= 0 ? Number(args.splice(radiusFlag, 2)[1]) : null;
const [slug, framePath] = args;
if (!slug || !framePath) {
  console.error('Usage: node scripts/make-cover.mjs <slug> <first-frame.png> [--radius <px>]');
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const mdxPath = join(root, 'src/content/work', `${slug}.mdx`);
const source = await readFile(mdxPath, 'utf8');
const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
if (!frontmatter) throw new Error(`No frontmatter in ${mdxPath}`);
const { cover, coverScreen } = yaml.load(frontmatter[1]);
if (!cover) throw new Error(`${slug}: no "cover" in frontmatter`);
if (!coverScreen) throw new Error(`${slug}: no "coverScreen" in frontmatter (the screen rect, in % of the cover)`);

const coverPath = join(dirname(mdxPath), cover);
const ext = extname(coverPath);
const originalPath = join(dirname(coverPath), `${basename(coverPath, ext)}-original${ext}`);
const exists = (p) => access(p).then(() => true, () => false);
if (!(await exists(originalPath))) {
  await copyFile(coverPath, originalPath);
  console.log(`Backed up the cover to ${basename(originalPath)}`);
}

const base = sharp(originalPath);
const { width: W, height: H } = await base.metadata();
const left = Math.round((coverScreen.x / 100) * W);
const top = Math.round((coverScreen.y / 100) * H);
const width = Math.round((coverScreen.w / 100) * W);
const height = Math.round((coverScreen.h / 100) * H);
// CoverVideo's 3px radius is in CSS px; the case-study hero shows the cover at most 1520px wide.
const radius = radiusArg ?? Math.round((3 * W) / 1520);

const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}"/></svg>`);
const screen = await sharp(framePath)
  .resize(width, height, { fit: 'cover', position: 'top' })
  .composite([{ input: mask, blend: 'dest-in' }])
  .png()
  .toBuffer();

await base.composite([{ input: screen, left, top }]).toFile(coverPath);
console.log(`${basename(coverPath)} (${W}×${H}): frame at ${left},${top}, ${width}×${height}, radius ${radius}px`);
