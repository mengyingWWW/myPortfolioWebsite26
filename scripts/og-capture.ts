/**
 * Social share images (Open Graph / Twitter), 1200 × 627 PNG:
 *   public/og/home.png         the homepage hero at 13:00 Seattle time (clear midday leaf shadows)
 *   public/og/work/{slug}.png  each case study's cover, letterboxed on its grey card background
 *
 *   npm run og                 build + capture
 *   npm run og -- --no-build   capture from the existing .og-build
 *
 * Dev-only: builds with PUBLIC_SUN_PREVIEW=1 (so ?hour works) into .og-build, never into dist/.
 */
import { spawnSync } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const sharp = require('sharp') as typeof import('sharp');

const ROOT = resolve(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, '.og-build');
const OG_DIR = join(ROOT, 'public', 'og');
const WORK_DIR = join(ROOT, 'src', 'content', 'work');
const PORT = 4328;
const WIDTH = 1200;
const HEIGHT = 627;
const MAX_BYTES = 600 * 1024;
/** Space the headline block must keep from the frame's sides, and below the nav / above the bottom edge. */
const MARGIN_X = 96;
const MARGIN_Y = 40;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
};

function build() {
  console.log('Building into .og-build …');
  const result = spawnSync('npx', ['astro', 'build', '--outDir', OUT_DIR], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, PUBLIC_SUN_PREVIEW: '1', ASTRO_TELEMETRY_DISABLED: '1' },
  });
  if (result.status !== 0) throw new Error('Build failed');
}

function serve(): Promise<Server> {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    const candidates = [join(OUT_DIR, path), join(OUT_DIR, path, 'index.html'), join(OUT_DIR, `${path}.html`)];
    const file = candidates.find((f) => f.startsWith(OUT_DIR) && existsSync(f) && statSync(f).isFile());
    if (!file) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((done) => server.listen(PORT, () => done(server)));
}

/** PNG under MAX_BYTES: lossless if it fits, else a palette PNG with fewer colours until it does. */
async function writePng(input: Buffer, file: string) {
  mkdirSync(dirname(file), { recursive: true });
  let out = await sharp(input).png({ compressionLevel: 9 }).toBuffer();
  for (const colours of [256, 192, 128, 96, 64]) {
    if (out.length <= MAX_BYTES) break;
    out = await sharp(input).png({ palette: true, colours, quality: 95, dither: 1, compressionLevel: 9 }).toBuffer();
  }
  if (out.length > MAX_BYTES) throw new Error(`${file} is ${Math.round(out.length / 1024)} KB, over the limit`);
  await sharp(out).toFile(file);
  console.log(`  ${file.replace(ROOT + '/', '')}  ${Math.round(out.length / 1024)} KB`);
}

async function captureHome() {
  const server = await serve();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    await page.goto(`http://localhost:${PORT}/?hour=13`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // The WebGL leaf shadows mark themselves ready once the first frame is drawn; then let the fade-in finish.
    await page.waitForSelector('.leaf-shadow[data-ready]', { state: 'attached', timeout: 15_000 });
    await page.waitForTimeout(1500);
    await page.addStyleTag({
      content: `
        [data-custom-cursor], .hero [data-scroll-hint], .hero [data-sun-place] { visibility: hidden !important; }
        .hero [data-sun-place] { display: none !important; }
        .hero div:has(> div > [data-sun-place]) { display: none !important; }
        html { scrollbar-width: none; }
      `,
    });

    // Keep the headline block well inside the frame; scale the hero content for this capture only if it isn't.
    const fit = await page.evaluate(
      ({ mx, my, w, h }) => {
        const content = document.querySelector<HTMLElement>('[data-hero-content]')!;
        const navBottom = document.querySelector('header')!.getBoundingClientRect().bottom;
        const r = content.getBoundingClientRect();
        const scale = Math.min(1, (w - 2 * mx) / r.width, (h - navBottom - 2 * my) / r.height);
        if (scale < 1) {
          content.style.transform = `scale(${scale})`;
          content.style.transformOrigin = 'center';
        }
        const after = content.getBoundingClientRect();
        return { scale: +scale.toFixed(3), left: Math.round(after.left), right: Math.round(w - after.right), top: Math.round(after.top - navBottom), bottom: Math.round(h - after.bottom) };
      },
      { mx: MARGIN_X, my: MARGIN_Y, w: WIDTH, h: HEIGHT },
    );
    console.log(`  headline block: scale ${fit.scale}, margins left ${fit.left} / right ${fit.right} / below nav ${fit.top} / bottom ${fit.bottom} px`);
    await page.waitForTimeout(300);
    const shot = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    await writePng(shot, join(OG_DIR, 'home.png'));
  } finally {
    await browser.close();
    server.close();
  }
}

/** Frontmatter value of `key` (one line, quotes stripped). */
function field(frontmatter: string, key: string): string | undefined {
  const m = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m?.[1].trim().replace(/^["']|["']$/g, '');
}

async function captureCovers() {
  for (const file of readdirSync(WORK_DIR).filter((f) => f.endsWith('.mdx'))) {
    const frontmatter = readFileSync(join(WORK_DIR, file), 'utf8').split(/^---\s*$/m)[1] ?? '';
    const cover = field(frontmatter, 'cover');
    if (!cover) continue;
    const background = field(frontmatter, 'coverBackground') ?? '#f4f4f5';
    const multiply = field(frontmatter, 'coverBlend') === 'multiply';
    // The whole cover fits the frame (the device is never cut off); the sides are the card's grey. A multiplied
    // cover is padded with white, which the blend turns into exactly that grey.
    const fitted = await sharp(resolve(WORK_DIR, cover))
      .resize(WIDTH, HEIGHT, { fit: 'contain', background: multiply ? '#ffffff' : background })
      .png()
      .toBuffer();
    const image = await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background } })
      .composite([{ input: fitted, blend: multiply ? 'multiply' : 'over' }])
      .png()
      .toBuffer();
    await writePng(image, join(OG_DIR, 'work', file.replace(/\.mdx$/, '.png')));
  }
}

if (!process.argv.includes('--no-build')) build();
console.log('Capturing share images …');
await captureHome();
await captureCovers();
