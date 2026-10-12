/**
 * Accessibility scan: builds the site, serves the build, and runs axe-core (WCAG 2.0/2.1/2.2 A + AA)
 * on every page at desktop (1440×900) and reflow (320×800) sizes. The homepage is also scanned at
 * several Seattle sun times (?hour=), since its WebGL background changes with the time of day.
 *
 *   npm run a11y              build + scan; exits 1 if any page has violations
 *   npm run a11y -- --no-build  scan the existing .a11y-build
 *
 * Raw results go to a11y/axe-results.json.
 */
import { spawnSync } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { chromium, type Browser } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const ROOT = resolve(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, '.a11y-build');
const RESULTS = join(ROOT, 'a11y', 'axe-results.json');
const PORT = 4329;
const CONCURRENCY = 4;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'reflow', width: 320, height: 800 },
];
/** Seattle local hours for the homepage: night, dawn, midday, sunset. */
const HOURS = ['0', '7', '13', '18.5'];
/** Never linked, so it exercises the 404 response. */
const NOT_FOUND = '/this-page-does-not-exist';

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
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
};

function build() {
  console.log('Building into .a11y-build …');
  const result = spawnSync('npx', ['astro', 'build', '--outDir', OUT_DIR], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, PUBLIC_SUN_PREVIEW: '1', ASTRO_TELEMETRY_DISABLED: '1' },
  });
  if (result.status !== 0) throw new Error('Build failed');
}

/** Every page in the build, as a URL path ("/", "/about", "/work/x"). */
function routes(dir = OUT_DIR): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return routes(path);
    if (name !== 'index.html') return [];
    const route = '/' + relative(OUT_DIR, dir).split('\\').join('/');
    return [route === '/' ? '/' : route.replace(/\/$/, '')];
  });
}

/** Static server for the build, with a host-like 404 (the site's 404.html if it has one). */
function serve(): Promise<Server> {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    const candidates = [join(OUT_DIR, path), join(OUT_DIR, path, 'index.html'), join(OUT_DIR, `${path}.html`)];
    const file = candidates.find((f) => f.startsWith(OUT_DIR) && existsSync(f) && statSync(f).isFile());
    if (file) {
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(readFileSync(file));
      return;
    }
    const custom = join(OUT_DIR, '404.html');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(existsSync(custom) ? readFileSync(custom) : 'Not found');
  });
  return new Promise((done) => server.listen(PORT, () => done(server)));
}

async function launch(): Promise<Browser> {
  try {
    return await chromium.launch({ channel: 'chrome' });
  } catch {
    return chromium.launch();
  }
}

type Run = { route: string; url: string; viewport: string; hour?: string };

function plan(pages: string[]): Run[] {
  const runs: Run[] = [];
  for (const route of [...pages, NOT_FOUND]) {
    for (const vp of VIEWPORTS) {
      const hours = route === '/' ? HOURS : [undefined];
      for (const hour of hours) {
        const url = `http://localhost:${PORT}${route}${hour ? `?hour=${hour}` : ''}`;
        runs.push({ route, url, viewport: vp.name, hour });
      }
    }
  }
  return runs;
}

async function scan(browser: Browser, run: Run) {
  const vp = VIEWPORTS.find((v) => v.name === run.viewport)!;
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  const response = await page.goto(run.url, { waitUntil: 'networkidle' });
  // Entrance animations, the WebGL background and scroll-revealed sections: scroll through the
  // page so everything has been revealed, then come back to the top.
  await page.waitForTimeout(1500);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);

  const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  // Reflow (1.4.10): content must fit 320 CSS px without scrolling in two dimensions.
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  await context.close();

  const node = (n: (typeof axe.violations)[number]['nodes'][number]) => ({
    target: n.target.join(' '),
    html: n.html.slice(0, 300),
    summary: n.failureSummary,
  });
  return {
    ...run,
    status: response?.status(),
    violations: axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      tags: v.tags.filter((t) => t.startsWith('wcag')),
      nodes: v.nodes.map(node),
    })),
    incomplete: axe.incomplete.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.map(node) })),
    passes: axe.passes.length,
    reflow: { ...overflow, horizontalScroll: overflow.scrollWidth > overflow.clientWidth },
  };
}

async function main() {
  if (!process.argv.includes('--no-build')) build();
  const pages = routes().sort();
  const server = await serve();
  const browser = await launch();
  const runs = plan(pages);
  const results: Awaited<ReturnType<typeof scan>>[] = [];
  console.log(`Scanning ${runs.length} page states …`);
  try {
    // axe takes several seconds per page, so a few pages run at once.
    let next = 0;
    const worker = async () => {
      while (next < runs.length) {
        const run = runs[next++];
        const result = await scan(browser, run);
        results.push(result);
        const nodes = result.violations.reduce((n, v) => n + v.nodes.length, 0);
        const label = `${run.route}${run.hour ? `?hour=${run.hour}` : ''} @ ${run.viewport}`;
        const reflow = result.reflow.horizontalScroll ? `  (scrolls sideways: ${result.reflow.scrollWidth}px)` : '';
        const lines = result.violations.map((v) => `\n    ${v.impact?.padEnd(9)} ${v.id}: ${v.help} (${v.nodes.length})`);
        console.log(`${nodes ? '✗' : '✓'} ${label.padEnd(44)} ${result.violations.length} rules / ${nodes} nodes${reflow}${lines.join('')}`);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  } finally {
    await browser.close();
    server.close();
  }

  const order = (r: Run) => runs.findIndex((x) => x.url === r.url && x.viewport === r.viewport);
  results.sort((a, b) => order(a) - order(b));
  mkdirSync(join(ROOT, 'a11y'), { recursive: true });
  writeFileSync(RESULTS, JSON.stringify({ date: new Date().toISOString(), tags: TAGS, results }, null, 2));
  const failing = results.filter((r) => r.violations.length);
  console.log(`\n${results.length} scans, ${failing.length} with violations. Raw results: a11y/axe-results.json`);
  process.exitCode = failing.length ? 1 : 0;
}

await main();
