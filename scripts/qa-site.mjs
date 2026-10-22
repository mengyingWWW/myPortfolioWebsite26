/**
 * Live-site QA: crawls the homepage, /about and every /work/* page linked from the homepage, and
 * runs checks A1–A10 at 1440×900 and 390×844. Prints a summary table plus details for every
 * failure and writes the same report to qa-reports/qa-<date>.md.
 *
 *   npm run qa                                          production
 *   npm run qa -- --base https://<preview>.vercel.app   a Vercel preview
 *   npm run qa -- --base http://localhost:4321          after `npm run build && npm run preview`
 *   npm run qa -- --allow-noindex /work/slug            noindex on that page is only a warning (repeatable;
 *                                                       adds to ALLOW_NOINDEX below)
 *
 * Exits 1 if any P1 check fails, 0 otherwise.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const REPORT_DIR = join(ROOT, 'qa-reports');
const DEFAULT_BASE = 'https://www.mengyingwang.com';
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const LINK_CONCURRENCY = 8;
const REQUEST_TIMEOUT = 15_000;

// ---------- rule config ----------

/** Pages that are noindex on purpose (drafts): A4 only warns. Add more with --allow-noindex. */
const ALLOW_NOINDEX = ['/work/colleague-ai'];
/** Hosts that block automated requests; these statuses from them are a warning, not a broken link. */
const BOT_BLOCKING = [{ host: 'linkedin.com', statuses: [999, 429] }];
/** A7: values that mean a field was never filled in (compared case-insensitively). */
const PLACEHOLDERS = ['timeline', 'role', 'tbd', 'todo', 'lorem'];
/** A7: domain tags should name a domain, not a company type. */
const NOT_A_DOMAIN = /\b(startup|company)\b/i;

const CHECKS = [
  { id: 'A1', severity: 'P1', title: 'Links and media respond 2xx/3xx' },
  { id: 'A2', severity: 'P1', title: 'Images have meaningful alt text' },
  { id: 'A3', severity: 'P2', title: 'Meta description exists, ≤160 chars' },
  { id: 'A4', severity: 'P1', title: 'No robots noindex' },
  { id: 'A5', severity: 'P1', title: 'Viewport meta; no horizontal scroll at 390px' },
  { id: 'A6', severity: 'P2', title: 'og:image exists and returns 200' },
  { id: 'A7', severity: 'P1', title: 'Card fields filled in; no placeholders; domains are domains' },
  { id: 'A8', severity: 'P2', title: 'At-a-glance has exactly 3 items (featured case studies)' },
  { id: 'A9', severity: 'P2', title: 'Case-study videos: no autoplay, poster, play control (decorative hero clip exempt)' },
  { id: 'A10', severity: 'P2', title: 'Carousel clones hidden; no infinite animation with reduced motion' },
];
const SEVERITY = Object.fromEntries(CHECKS.map((c) => [c.id, c.severity]));

// ---------- command line ----------

function parseArgs(argv) {
  const args = { base: DEFAULT_BASE, allowNoindex: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--base') args.base = argv[++i];
    else if (arg.startsWith('--base=')) args.base = arg.slice('--base='.length);
    else if (arg === '--allow-noindex') args.allowNoindex.push(...argv[++i].split(','));
    else if (arg.startsWith('--allow-noindex=')) args.allowNoindex.push(...arg.slice('--allow-noindex='.length).split(','));
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.base) throw new Error('--base needs a URL');
  args.base = args.base.replace(/\/+$/, '');
  args.allowNoindex = [...ALLOW_NOINDEX, ...args.allowNoindex].map(normalizePath);
  return args;
}

/** "/work/foo/" and "work/foo" both become "/work/foo". */
function normalizePath(path) {
  const p = ('/' + path.trim()).replace(/\/+/g, '/');
  return p.length > 1 ? p.replace(/\/$/, '') : p;
}

// ---------- results ----------

/** results[path][checkId] = { status: 'pass' | 'fail' | 'warn' | 'n/a', details: string[] } */
const results = {};

function record(path, id, status, detail) {
  results[path] ??= {};
  const entry = (results[path][id] ??= { status: 'pass', details: [] });
  const rank = { 'n/a': 0, pass: 1, warn: 2, fail: 3 };
  if (rank[status] > rank[entry.status]) entry.status = status;
  if (detail) entry.details.push(detail);
}

// ---------- page loading ----------

async function openPage(context, url) {
  const page = await context.newPage();
  const response = await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
  // Scroll through the page so lazy images, videos and scroll-triggered scripts get a chance to run.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  return { page, status: response?.status() ?? 0 };
}

// ---------- URL checking (A1, A6) ----------

/** One request per URL for the whole run. */
const urlCache = new Map();

function checkUrl(request, url) {
  if (!urlCache.has(url)) urlCache.set(url, fetchStatus(request, url));
  return urlCache.get(url);
}

/** HEAD first; if that errors or isn't 2xx/3xx, retry with GET (many servers mishandle HEAD). */
async function fetchStatus(request, url) {
  const ok = (s) => s >= 200 && s < 400;
  let headResult;
  try {
    const res = await request.head(url, { timeout: REQUEST_TIMEOUT, maxRedirects: 10 });
    headResult = { status: res.status(), method: 'HEAD' };
    if (ok(res.status())) return headResult;
  } catch (error) {
    headResult = { status: 0, method: 'HEAD', error: shortError(error) };
  }
  try {
    const res = await request.get(url, { timeout: REQUEST_TIMEOUT, maxRedirects: 10 });
    return { status: res.status(), method: 'GET' };
  } catch (error) {
    return { status: 0, method: 'GET', error: shortError(error) || headResult.error };
  }
}

function shortError(error) {
  return String(error?.message ?? error).split('\n')[0].slice(0, 120);
}

/** Run async jobs with at most `limit` in flight. */
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

// ---------- in-page collectors (these run inside the browser) ----------

/** Every URL a page references: links, images, videos, sources and posters. */
function collectUrls() {
  const urls = [];
  const add = (raw, kind) => {
    if (!raw) return;
    const value = raw.trim();
    if (!value || /^(mailto:|tel:|javascript:|data:|blob:)/i.test(value)) return;
    if (value.startsWith('#')) return;
    let url;
    try {
      url = new URL(value, document.baseURI);
    } catch {
      urls.push({ url: value, kind, invalid: true });
      return;
    }
    if (!/^https?:$/.test(url.protocol)) return;
    url.hash = '';
    urls.push({ url: url.href, kind });
  };
  document.querySelectorAll('a[href]').forEach((a) => add(a.getAttribute('href'), 'link'));
  document.querySelectorAll('img').forEach((img) => {
    add(img.getAttribute('src'), 'img');
    if (img.currentSrc) add(img.currentSrc, 'img');
  });
  document.querySelectorAll('video').forEach((v) => {
    add(v.getAttribute('src'), 'video');
    add(v.getAttribute('poster'), 'poster');
    // Lazy clips (CoverVideo) keep their real URLs here until they load.
    add(v.dataset.src, 'video');
    add(v.dataset.poster, 'poster');
  });
  document.querySelectorAll('video source[src]').forEach((s) => add(s.getAttribute('src'), 'video'));
  return urls;
}

/**
 * Images with a missing, filename or generic alt (fail), or an empty alt (warn: fine if decorative).
 * Images without a src yet (e.g. a dialog that fills it on open) are skipped.
 */
function collectBadAlts() {
  const GENERIC = new Set(['image', 'img', 'screenshot']);
  const bad = [];
  for (const img of document.querySelectorAll('img')) {
    const role = (img.getAttribute('role') || '').toLowerCase();
    if (role === 'presentation' || role === 'none') continue;
    if (img.closest('[aria-hidden="true"]')) continue;
    const src = (img.getAttribute('src') || '').trim();
    if (!src) continue;
    const alt = img.getAttribute('alt');
    let problem = null;
    let status = 'fail';
    if (alt === null) problem = 'missing alt';
    else if (/\.(png|jpe?g|webp|gif|avif|svg)\b/i.test(alt)) problem = 'alt is a filename';
    else if (GENERIC.has(alt.trim().toLowerCase())) problem = `generic alt "${alt.trim()}"`;
    else if (!alt.trim()) [problem, status] = ['empty alt (OK if decorative)', 'warn'];
    if (problem) bad.push({ src, alt, problem, status });
  }
  return bad;
}

/** Head meta used by A3, A4, A5 and A6. */
function collectMeta() {
  const attr = (selector, name = 'content') => document.querySelector(selector)?.getAttribute(name) ?? null;
  return {
    description: attr('meta[name="description"]'),
    robots: [...document.querySelectorAll('meta[name="robots"], meta[name="googlebot"]')].map((m) => m.content),
    viewport: attr('meta[name="viewport"]'),
    ogImage: attr('meta[property="og:image"]'),
  };
}

/** Horizontal overflow, with the elements that stick out furthest past the viewport. */
function collectOverflow() {
  const vw = document.documentElement.clientWidth;
  const scrollWidth = document.documentElement.scrollWidth;
  const offenders = [];
  if (scrollWidth > vw) {
    // An element only causes page scroll if no ancestor clips it horizontally.
    const clipped = (el) => {
      for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox !== 'visible') return true;
      }
      return false;
    };
    const describe = (el) => {
      let s = el.tagName.toLowerCase();
      if (el.id) s += `#${el.id}`;
      const cls = [...el.classList].filter((c) => !c.startsWith('astro-')).slice(0, 3);
      if (cls.length) s += '.' + cls.join('.');
      return s;
    };
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= vw + 1) continue;
      if (clipped(el)) continue;
      offenders.push({ el: describe(el), right: Math.round(r.right), width: Math.round(r.width) });
    }
    offenders.sort((a, b) => b.right - a.right);
  }
  return { viewportWidth: vw, scrollWidth, offenders: offenders.slice(0, 5) };
}

/** Homepage cards: href plus the fields from the card's screen-reader description ("year · status · domains · role · platform"). */
function collectCards() {
  return [...document.querySelectorAll('a[data-project-card]')].map((card) => {
    const describedBy = card.getAttribute('aria-describedby');
    const text = describedBy ? document.getElementById(describedBy)?.textContent?.trim() : null;
    let fields;
    if (text) {
      const [year, status, domain, role, platform] = text.split(' · ').map((s) => s.trim());
      fields = { year, status, domain, role, platform };
    } else {
      // Fallback: the visible meta row and the year under the cover.
      const items = [...card.querySelectorAll('.work-card-meta li')].map((li) => li.textContent.trim());
      const [status, domain, role, platform] = items;
      const year = [...card.querySelectorAll('p')].at(-1)?.textContent?.trim();
      fields = { year, status, domain, role, platform };
    }
    return { href: new URL(card.getAttribute('href'), document.baseURI).pathname, fields };
  });
}

/**
 * Paths of the featured case studies: cards in the homepage section headed by #work ("Selected Work").
 * Cards anywhere else on the page (e.g. a "More" list) are not featured.
 */
function collectFeatured() {
  const section = document.getElementById('work')?.closest('section');
  if (!section) return [];
  return [...section.querySelectorAll('a[data-project-card]')].map((a) =>
    new URL(a.getAttribute('href'), document.baseURI).pathname.replace(/\/$/, ''),
  );
}

/**
 * Case-study meta panel: the <dt>/<dd> pairs above the case-study body, as
 * { label: [values] } (list fields like Team keep one value per item).
 */
function collectCaseMeta() {
  const article = document.querySelector('article');
  if (!article) return null;
  const body = article.querySelector('[data-case-body]');
  const fields = {};
  for (const dt of article.querySelectorAll('dt')) {
    if (body?.contains(dt)) continue;
    const dd = dt.nextElementSibling;
    if (!dd || dd.tagName !== 'DD') continue;
    const items = [...dd.querySelectorAll('li')].map((li) => li.textContent.trim());
    fields[dt.textContent.trim()] = items.length ? items : [dd.textContent.trim()];
  }
  return { fields };
}

function collectGlance() {
  const lists = [...document.querySelectorAll('ul[aria-label="At a glance"]')];
  return lists.map((ul) => [...ul.querySelectorAll(':scope > li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim()));
}

/** Videos in the case-study article, with their autoplay / poster / play-control state. */
function collectVideos() {
  const article = document.querySelector('article');
  if (!article) return [];
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    }
    return true;
  };
  const isPlayControl = (b) =>
    /play|pause/i.test([b.getAttribute('aria-label'), b.dataset.cursorLabel, b.textContent].join(' '));
  const heroSection = article.querySelector(':scope > section');
  return [...article.querySelectorAll('video')].map((video) => {
    // A decorative hero cover clip: muted, looping, and hidden from AT or inside the hero cover.
    const inHeroCover = Boolean(video.closest('[data-cover-video]')) || Boolean(heroSection?.contains(video));
    const heroClipExempt =
      !video.closest('[data-case-body]') &&
      (video.muted || video.hasAttribute('muted')) &&
      (video.loop || video.hasAttribute('loop')) &&
      (Boolean(video.closest('[aria-hidden="true"]')) || inHeroCover);
    // Look for a play/pause button in the video's own figure (up to 6 levels up).
    let control = video.controls && visible(video) ? 'native controls' : null;
    for (let n = video.parentElement, depth = 0; !control && n && n !== article && depth < 6; n = n.parentElement, depth++) {
      const button = [...n.querySelectorAll('button')].find((b) => isPlayControl(b) && visible(b));
      if (button) control = `button "${button.getAttribute('aria-label') || button.textContent.trim()}"`;
    }
    const where = video.closest('[data-case-body]') ? 'body' : video.closest('[data-cover-video]') ? 'hero cover clip' : 'hero';
    return {
      where,
      heroClipExempt,
      label: video.getAttribute('aria-label') || '',
      src: video.getAttribute('src') || video.querySelector('source')?.getAttribute('src') || video.dataset.src || '(no src)',
      autoplay: video.hasAttribute('autoplay'),
      poster: video.getAttribute('poster') || '',
      control,
    };
  });
}

/**
 * Elements duplicated for a looping carousel that are still exposed to screen readers. Finds
 * containers whose children repeat as [A, B, C, A, B, C] (plus anything marked data-dup).
 */
function collectExposedClones() {
  const exposed = [];
  const seen = new Set();
  const hidden = (el) => Boolean(el.closest('[aria-hidden="true"]'));
  const describe = (el) => {
    const cls = [...el.classList].filter((c) => !c.startsWith('astro-')).slice(0, 2);
    return el.tagName.toLowerCase() + (cls.length ? '.' + cls.join('.') : '');
  };
  const flag = (el, why) => {
    if (seen.has(el) || hidden(el)) return;
    seen.add(el);
    const label = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    exposed.push({ el: describe(el), parent: describe(el.parentElement), label, why });
  };
  document.querySelectorAll('[data-dup]').forEach((el) => flag(el, 'marked data-dup'));
  const signature = (el) =>
    el.tagName + '|' + el.textContent.replace(/\s+/g, ' ').trim() + '|' + [...el.querySelectorAll('img')].map((i) => i.getAttribute('src')).join(',');
  for (const parent of document.body.querySelectorAll('*')) {
    if (parent.closest('svg')) continue;
    const kids = [...parent.children];
    if (kids.length < 4 || kids.length % 2) continue;
    const half = kids.length / 2;
    const sigs = kids.map(signature);
    if (sigs.slice(0, half).every((s) => s.length > 3)) {
      if (sigs.slice(0, half).every((s, i) => s === sigs[i + half])) {
        kids.slice(half).forEach((el) => flag(el, 'repeats an earlier sibling'));
      }
    }
  }
  return exposed;
}

function collectInfiniteAnimations() {
  return document
    .getAnimations()
    .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity)
    .map((a) => {
      const target = a.effect?.target;
      const cls = target ? [...target.classList].filter((c) => !c.startsWith('astro-')).slice(0, 2) : [];
      return {
        name: a.animationName || a.id || a.constructor.name,
        target: target ? target.tagName.toLowerCase() + (cls.length ? '.' + cls.join('.') : '') : '(none)',
      };
    });
}

// ---------- checks ----------

function isBotBlocked(url, status) {
  const host = new URL(url).hostname;
  return BOT_BLOCKING.some((b) => (host === b.host || host.endsWith('.' + b.host)) && b.statuses.includes(status));
}

async function checkPage({ browser, request, base, path, viewport, kind, allowNoindex, featured }) {
  const label = `[${viewport.name}]`;
  const isDesktop = viewport.name === 'desktop';
  const context = await browser.newContext({ viewport, userAgent: USER_AGENT });
  const { page, status } = await openPage(context, base + path);
  if (status >= 400 || status === 0) record(path, 'A1', 'fail', `${label} page itself returned ${status}`);

  // A1: every referenced URL responds 2xx/3xx.
  const refs = await page.evaluate(collectUrls);
  const unique = [...new Map(refs.map((r) => [r.url, r])).values()];
  const checked = await pool(unique, LINK_CONCURRENCY, async (ref) =>
    ref.invalid ? { ...ref, status: 0, error: 'invalid URL' } : { ...ref, ...(await checkUrl(request, ref.url)) },
  );
  for (const r of checked) {
    if (r.status >= 200 && r.status < 400) continue;
    const why = r.status ? `${r.status} (${r.method})` : r.error || 'no response';
    const blocked = isBotBlocked(r.url, r.status);
    record(path, 'A1', blocked ? 'warn' : 'fail', `${r.kind}: ${r.url} → ${why}${blocked ? ' (host blocks bots; check by hand)' : ''}`);
  }
  record(path, 'A1', 'pass');

  // A2: meaningful alt text.
  for (const img of await page.evaluate(collectBadAlts)) {
    record(path, 'A2', img.status, `${label} ${img.problem}: ${img.src}${img.alt ? ` (alt="${img.alt}")` : ''}`);
  }
  record(path, 'A2', 'pass');

  const meta = await page.evaluate(collectMeta);

  // A5: viewport meta, and no horizontal scroll at 390px.
  if (isDesktop) {
    if (!meta.viewport) record(path, 'A5', 'fail', 'no <meta name="viewport">');
    else if (!/width\s*=\s*device-width/i.test(meta.viewport)) record(path, 'A5', 'fail', `viewport meta is "${meta.viewport}"`);
  } else {
    const o = await page.evaluate(collectOverflow);
    if (o.scrollWidth > viewport.width) {
      const list = o.offenders.length
        ? o.offenders.map((x) => `\`${x.el}\` (right edge ${x.right}px, width ${x.width}px)`).join('; ')
        : 'no single element found';
      record(path, 'A5', 'fail', `${label} scrollWidth ${o.scrollWidth}px > ${viewport.width}px. Widest: ${list}`);
    }
  }
  record(path, 'A5', 'pass');

  // A9: case-study videos.
  if (kind === 'work') {
    for (const v of await page.evaluate(collectVideos)) {
      if (v.heroClipExempt) continue;
      const problems = [];
      if (v.autoplay) problems.push('has autoplay');
      if (!v.poster) problems.push('no poster');
      if (!v.control) problems.push('no visible play control');
      if (problems.length) record(path, 'A9', 'fail', `${label} ${v.where} video ${v.src}${v.label ? ` ("${v.label}")` : ''}: ${problems.join(', ')}`);
    }
    record(path, 'A9', 'pass');
  } else {
    record(path, 'A9', 'n/a');
  }

  // Viewport-independent checks run once, at desktop.
  let caseMeta = null;
  let cards = null;
  if (isDesktop) {
    // A3: meta description.
    if (meta.description === null) record(path, 'A3', 'fail', 'no <meta name="description">');
    else if (!meta.description.trim()) record(path, 'A3', 'fail', 'meta description is empty');
    else if (meta.description.length > 160) record(path, 'A3', 'fail', `meta description is ${meta.description.length} chars (max 160): "${meta.description}"`);
    record(path, 'A3', 'pass');

    // A4: no noindex (only a warning for pages passed with --allow-noindex).
    const noindex = meta.robots.find((c) => /noindex/i.test(c));
    if (noindex) {
      const allowed = allowNoindex.includes(normalizePath(path));
      record(path, 'A4', allowed ? 'warn' : 'fail', `robots meta "${noindex}"${allowed ? ' (allowed by ALLOW_NOINDEX / --allow-noindex)' : ''}`);
    }
    record(path, 'A4', 'pass');

    // A6: og:image exists and returns 200.
    if (!meta.ogImage) {
      record(path, 'A6', 'fail', 'no <meta property="og:image">');
    } else {
      const url = new URL(meta.ogImage, base + path).href;
      const r = await checkUrl(request, url);
      if (r.status !== 200) record(path, 'A6', 'fail', `og:image ${url} → ${r.status || r.error || 'no response'}`);
    }
    record(path, 'A6', 'pass');

    // A8: at-a-glance has exactly 3 items (featured case studies only).
    if (kind === 'work' && featured.has(normalizePath(path))) {
      const glances = await page.evaluate(collectGlance);
      if (!glances.length) record(path, 'A8', 'fail', 'no at-a-glance list (ul[aria-label="At a glance"]) in the hero');
      for (const items of glances) {
        if (items.length !== 3) record(path, 'A8', 'fail', `at-a-glance has ${items.length} items: ${items.map((i) => `"${i}"`).join(', ')}`);
      }
      record(path, 'A8', 'pass');
    } else {
      record(path, 'A8', 'n/a');
    }

    // A10 (a): carousel clones are aria-hidden.
    for (const c of await page.evaluate(collectExposedClones)) {
      record(path, 'A10', 'fail', `clone not aria-hidden: \`${c.el}\` in \`${c.parent}\` (${c.why}) "${c.label}"`);
    }

    if (kind === 'work') caseMeta = await page.evaluate(collectCaseMeta);
    if (kind === 'home') cards = await page.evaluate(collectCards);
  }
  await context.close();

  // A10 (b): with reduced motion, nothing animates forever.
  const reduced = await browser.newContext({ viewport, userAgent: USER_AGENT, reducedMotion: 'reduce' });
  const { page: rmPage } = await openPage(reduced, base + path);
  const running = await rmPage.evaluate(collectInfiniteAnimations);
  for (const a of running) record(path, 'A10', 'fail', `${label} reduced motion: infinite animation "${a.name}" running on \`${a.target}\``);
  record(path, 'A10', 'pass');
  await reduced.close();

  return { caseMeta, cards };
}

/** True if a value is just its own label or a stand-in like "TBD" ("Lorem…" counts too). */
function isPlaceholder(value, label) {
  const v = String(value).trim().toLowerCase();
  return v === label.trim().toLowerCase() || PLACEHOLDERS.includes(v) || v.startsWith('lorem');
}

/**
 * A7, reported on each case study's row:
 *   (a) every homepage card field is filled in;
 *   (b) no card field or case-study meta value is its own label or a placeholder;
 *   (c) no domain tag is a company type ("Startup", "Company").
 */
function checkCardFields(cards, caseMetas) {
  for (const card of cards) {
    const path = normalizePath(card.href);
    for (const field of ['status', 'year', 'domain', 'role', 'platform']) {
      const value = (card.fields[field] ?? '').trim();
      if (!value) record(path, 'A7', 'fail', `(a) homepage card ${field} is empty`);
      else if (isPlaceholder(value, field)) record(path, 'A7', 'fail', `(b) homepage card ${field} is a placeholder: "${value}"`);
    }
    const domains = (card.fields.domain ?? '').split(',').map((d) => d.trim()).filter(Boolean);
    for (const d of domains.filter((d) => NOT_A_DOMAIN.test(d))) {
      record(path, 'A7', 'fail', `(c) homepage card domain "${d}" is a company type, not a domain`);
    }

    const cs = caseMetas.get(path);
    if (!cs) record(path, 'A7', 'fail', '(b) case study meta could not be read');
    for (const [label, values] of Object.entries(cs?.fields ?? {})) {
      for (const v of values) {
        if (!v.trim()) record(path, 'A7', 'fail', `(b) case study meta "${label}" is empty`);
        else if (isPlaceholder(v, label)) record(path, 'A7', 'fail', `(b) case study meta "${label}" is a placeholder: "${v}"`);
      }
    }
    record(path, 'A7', 'pass');
  }
}

// ---------- report ----------

function buildReport({ base, pages, startedAt, seconds }) {
  const icon = { pass: 'pass', fail: 'FAIL', warn: 'warn', 'n/a': '—' };
  const lines = [];
  lines.push(`# Site QA — ${startedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`, '');
  lines.push(`Base: ${base}  `);
  lines.push(`Pages: ${pages.length} · Viewports: ${VIEWPORTS.map((v) => `${v.width}×${v.height}`).join(', ')} · URLs checked: ${urlCache.size} · ${seconds}s`, '');

  lines.push('## Summary', '');
  lines.push(`| Page | ${CHECKS.map((c) => `${c.id} (${c.severity})`).join(' | ')} |`);
  lines.push(`| --- | ${CHECKS.map(() => ':---:').join(' | ')} |`);
  for (const { path } of pages) {
    lines.push(`| ${path} | ${CHECKS.map((c) => icon[results[path]?.[c.id]?.status ?? 'n/a']).join(' | ')} |`);
  }
  lines.push('', 'Checks:', '');
  for (const c of CHECKS) lines.push(`- **${c.id}** (${c.severity}) ${c.title}`);

  const p1 = [];
  const failing = [];
  for (const { path } of pages) {
    for (const c of CHECKS) {
      const r = results[path]?.[c.id];
      if (r && (r.status === 'fail' || r.status === 'warn')) failing.push({ path, check: c, r });
      if (r?.status === 'fail' && c.severity === 'P1') p1.push(`${path} ${c.id}`);
    }
  }
  lines.push('', `**Result:** ${p1.length ? `${p1.length} P1 failure(s) → exit 1` : 'no P1 failures → exit 0'}`, '');

  lines.push('## Details', '');
  if (!failing.length) lines.push('Nothing failed.');
  for (const { path, check, r } of failing) {
    lines.push(`### ${path} · ${check.id} (${check.severity}) · ${r.status.toUpperCase()}`, '');
    lines.push(`${check.title}`, '');
    for (const d of [...new Set(r.details)]) lines.push(d.includes('\n') ? d : `- ${d}`);
    lines.push('');
  }
  return { text: lines.join('\n'), hasP1: p1.length > 0 };
}

// ---------- main ----------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date();
  const browser = await chromium.launch();
  const requestContext = await browser.newContext({ userAgent: USER_AGENT, ignoreHTTPSErrors: false });
  const request = requestContext.request;

  try {
    // Discover case studies from the homepage's links.
    const discovery = await browser.newContext({ viewport: VIEWPORTS[0], userAgent: USER_AGENT });
    const { page: home } = await openPage(discovery, args.base + '/');
    const origin = new URL(args.base).origin;
    const workPaths = await home.evaluate((origin) => {
      const paths = new Set();
      for (const a of document.querySelectorAll('a[href]')) {
        const url = new URL(a.getAttribute('href'), document.baseURI);
        if (url.origin === origin && /^\/work\/[^/]+\/?$/.test(url.pathname)) paths.add(url.pathname.replace(/\/$/, ''));
      }
      return [...paths];
    }, origin);
    const featured = new Set(await home.evaluate(collectFeatured));
    await discovery.close();
    if (!workPaths.length) console.warn('No /work/* links found on the homepage.');

    const pages = [
      { path: '/', kind: 'home' },
      { path: '/about', kind: 'about' },
      ...workPaths.map((path) => ({ path, kind: 'work' })),
    ];

    let cards = [];
    const caseMetas = new Map();
    for (const { path, kind } of pages) {
      for (const viewport of VIEWPORTS) {
        process.stderr.write(`Checking ${path} at ${viewport.width}×${viewport.height}…\n`);
        try {
          const out = await checkPage({ browser, request, base: args.base, path, viewport, kind, allowNoindex: args.allowNoindex, featured });
          if (out.cards) cards = out.cards;
          if (out.caseMeta) caseMetas.set(path, out.caseMeta);
        } catch (error) {
          record(path, 'A1', 'fail', `[${viewport.name}] page could not be checked: ${shortError(error)}`);
        }
      }
      if (kind !== 'work') record(path, 'A7', 'n/a');
    }
    checkCardFields(cards, caseMetas);

    const seconds = Math.round((Date.now() - startedAt) / 1000);
    const { text, hasP1 } = buildReport({ base: args.base, pages, startedAt, seconds });
    console.log('\n' + text);

    mkdirSync(REPORT_DIR, { recursive: true });
    const d = startedAt;
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const file = join(REPORT_DIR, `qa-${date}.md`);
    writeFileSync(file, text + '\n');
    console.log(`Report written to ${file}`);
    process.exitCode = hasP1 ? 1 : 0;
  } finally {
    await requestContext.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
