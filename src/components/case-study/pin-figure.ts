/**
 * Shared behavior for screenshots with numbered pins that open a card (ShippedShot, AnnotatedShot).
 *
 * Markup, by data attribute:
 *   [data-pin-figure]   the figure; gets [data-open] while one of its cards is open
 *   [data-pin-stage]    positioning box for the cards and the tip (the image's wrapper)
 *   [data-pin]          a pin button; aria-controls names its card. Optional data-box="x,y,w,h" (% of
 *                       the stage) is the area the card sits beside and [data-pin-hl] outlines;
 *                       without it the card sits beside the pin itself. data-tip is its hover tip.
 *   [data-pin-hl]       optional highlight box     [data-pin-tip]  optional hover tip
 *   [data-pin-row]      optional row (aria-controls) that opens the same card
 *   [data-pin-item]     optional plain-list item per pin, shown instead of the pins at 900px and below
 *   Inside a card (PinCard.astro): [data-pin-close], [data-pin-step="-1|1"], and [data-pin-link] for
 *   links that close the card when followed.
 *
 * A pin opens its card; Prev / Next (or ← / →) step through the figure's pins. Each figure opens its
 * first card once when it scrolls into view, and again each time it is shown after being hidden
 * (e.g. its tab panel reselected). Only one card is open on the page at a time. A link to a pin's id
 * from anywhere scrolls its figure into view and opens that card (or, with pins hidden, scrolls to
 * its list item).
 */

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const pinsShown = matchMedia('(min-width: 901px)');
const scrollBehavior = (): ScrollBehavior => (reduceMotion.matches ? 'auto' : 'smooth');

/** Announced by a figure when it opens a card, so any other figure closes its own. */
const OPEN_EVENT = 'pin-figure:open';
const AUTO_THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

type Box = [number, number, number, number];

// The card sits beside the box, in order of preference: to the right, then the left (narrowing to
// the room it has, down to 240px), running down from the box's top edge or up from its bottom edge;
// then below or above it. It takes the first of these that covers none of the `avoid` boxes (the
// figure's other pins), else the one covering fewest. With no room anywhere it overlaps the edge of
// the roomier side. It always stays `inset` inside the stage.
function place(stage: HTMLElement, pop: HTMLElement, [x, y, w, h]: Box, avoid: Box[] = []) {
  const sw = stage.clientWidth;
  const sh = stage.clientHeight;
  const gap = 12;
  const inset = 12;
  const maxW = Math.min(340, sw - 2 * inset);
  const minW = Math.min(240, maxW);
  const heightAt = (pw: number) => {
    pop.style.width = `${pw}px`;
    return pop.offsetHeight;
  };
  const roomRight = sw - inset - (x + w + gap);
  const roomLeft = x - gap - inset;

  /** [left, top, width, height], clamped inside the stage. */
  const spots: Box[] = [];
  const add = (left: number, top: number, pw: number, ph: number) =>
    spots.push([clamp(left, inset, sw - inset - pw), clamp(top, inset, sh - inset - ph), pw, ph]);
  for (const room of [roomRight, roomLeft]) {
    if (room < minW) continue;
    const pw = Math.min(maxW, room);
    const ph = heightAt(pw);
    const left = room === roomRight ? x + w + gap : x - gap - pw;
    add(left, y, pw, ph);
    add(left, y + h - ph, pw, ph);
  }
  const ph = heightAt(maxW);
  for (const top of [y + h + gap, y - gap - ph]) {
    if (top < inset || top + ph > sh - inset) continue;
    add(x, top, maxW, ph);
    add(x + w - maxW, top, maxW, ph);
  }
  if (!spots.length) {
    const ph = heightAt(minW);
    add(roomRight >= roomLeft ? sw - inset - minW : inset, y + ph <= sh - inset ? y : y + h - ph, minW, ph);
  }

  const covered = ([l, t, pw, ph]: Box) =>
    avoid.filter(([ax, ay, aw, ah]) => ax < l + pw && ax + aw > l && ay < t + ph && ay + ah > t).length;
  let best = spots[0];
  let fewest = covered(best);
  for (const spot of spots.slice(1)) {
    if (fewest === 0) break;
    const n = covered(spot);
    if (n < fewest) [best, fewest] = [spot, n];
  }
  pop.style.width = `${best[2]}px`;
  pop.style.left = `${best[0]}px`;
  pop.style.top = `${best[1]}px`;
}

/** Share of an element's height inside the viewport. */
const visibleRatio = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.height ? Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / r.height : 0;
};

const headerBottom = () => document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;

const ensureInView = (stage: HTMLElement) => {
  const r = stage.getBoundingClientRect();
  if (r.top < headerBottom() || r.bottom > innerHeight) stage.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
};

/** Scrolls so an element's top sits just under the sticky header. */
const scrollToTop = (el: Element) =>
  scrollTo({ top: el.getBoundingClientRect().top + scrollY - headerBottom() - 16, behavior: scrollBehavior() });

interface Figure {
  root: HTMLElement;
  pins: HTMLButtonElement[];
  items: (HTMLElement | null)[];
  open: (i: number, byUser: boolean) => void;
}
const byPin = new Map<Element, { figure: Figure; i: number }>();
/** Until then a link is scrolling to a card, so figures passed on the way don't auto-open over it. */
let navigatingUntil = 0;

function setup(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('[data-pin-stage]')!;
  const hl = stage.querySelector<HTMLElement>('[data-pin-hl]');
  const tip = stage.querySelector<HTMLElement>('[data-pin-tip]');
  const pins = [...stage.querySelectorAll<HTMLButtonElement>('[data-pin]')];
  const pops = pins.map((pin) => document.getElementById(pin.getAttribute('aria-controls')!)!);
  const rows = pops.map((pop) => root.querySelector<HTMLButtonElement>(`[data-pin-row][aria-controls="${pop.id}"]`));
  const items = [...root.querySelectorAll<HTMLElement>('[data-pin-item]')];
  const boxes = pins.map((pin) => pin.dataset.box?.split(',').map(Number) ?? null);

  /** The area a card sits beside, in px of the stage: its data-box, or the pin itself. */
  function boxOf(i: number): Box {
    const b = boxes[i];
    if (b) {
      const [sw, sh] = [stage.clientWidth, stage.clientHeight];
      return [(b[0] * sw) / 100, (b[1] * sh) / 100, (b[2] * sw) / 100, (b[3] * sh) / 100];
    }
    return pinBox(i);
  }
  function pinBox(i: number, pad = 0): Box {
    const s = stage.getBoundingClientRect();
    const p = pins[i].getBoundingClientRect();
    return [p.left - s.left - pad, p.top - s.top - pad, p.width + 2 * pad, p.height + 2 * pad];
  }
  /** Places card i beside its box, clear of the other pins where it can be. */
  const placeCard = (i: number) =>
    place(stage, pops[i], boxOf(i), pins.flatMap((_, j) => (j === i ? [] : [pinBox(j, 6)])));

  let openIndex: number | null = null;
  /** Whether the open card came from the user (pin, row, Prev / Next, a link) rather than the auto-open. */
  let openedByUser = false;
  let hasAutoOpened = false;
  let userClosed = false;

  function close() {
    if (openIndex === null) return;
    pins[openIndex].setAttribute('aria-expanded', 'false');
    rows[openIndex]?.setAttribute('aria-expanded', 'false');
    pops[openIndex].classList.remove('is-on');
    hl?.classList.remove('is-on');
    root.removeAttribute('data-open');
    openIndex = null;
  }

  function open(i: number, byUser: boolean) {
    close();
    document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: root }));
    const b = boxes[i];
    if (hl && b) {
      hl.style.left = `${b[0]}%`;
      hl.style.top = `${b[1]}%`;
      hl.style.width = `${b[2]}%`;
      hl.style.height = `${b[3]}%`;
      hl.classList.add('is-on');
    }
    placeCard(i);
    tip?.classList.remove('is-on');
    pins[i].classList.add('is-visited');
    pins[i].setAttribute('aria-expanded', 'true');
    rows[i]?.setAttribute('aria-expanded', 'true');
    pops[i].classList.add('is-on');
    root.setAttribute('data-open', '');
    openIndex = i;
    openedByUser = byUser;
  }

  /** The user closing the card (×, Esc, a click outside, its pin or row again). */
  function dismiss() {
    if (openIndex === null) return;
    const pin = pins[openIndex];
    const interacting = openedByUser || pops[openIndex].contains(document.activeElement);
    userClosed = true;
    close();
    if (interacting) pin.focus({ preventScroll: true });
  }

  function step(dir: number) {
    if (openIndex === null) return;
    const next = openIndex + dir;
    if (next < 0 || next >= pins.length) return;
    const active = document.activeElement as HTMLElement | null;
    const fromCard = !!active && pops[openIndex].contains(active);
    const fromPin = active === pins[openIndex];
    open(next, true);
    // Keep focus on the same control in the new card, or on the pin if it was there.
    if (fromCard) pops[next].querySelector<HTMLElement>(`[data-pin-step="${active!.dataset.pinStep}"]`)?.focus({ preventScroll: true });
    else if (fromPin) pins[next].focus({ preventScroll: true });
  }

  function showTip(pin: HTMLElement) {
    if (!tip || !pin.dataset.tip || (openIndex !== null && pins[openIndex] === pin)) return;
    tip.textContent = pin.dataset.tip;
    tip.classList.add('is-on');
    const s = stage.getBoundingClientRect();
    const p = pin.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = p.right - s.left + 10;
    if (left + tw > s.width - 8) left = p.left - s.left - 10 - tw;
    tip.style.left = `${clamp(left, 8, s.width - 8 - tw)}px`;
    tip.style.top = `${p.top - s.top + p.height / 2 - th / 2}px`;
  }
  const hideTip = () => tip?.classList.remove('is-on');

  pins.forEach((pin, i) => {
    const row = rows[i];
    const pop = pops[i];

    pin.addEventListener('click', () => (openIndex === i ? dismiss() : open(i, true)));
    pin.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') showTip(pin);
      row?.classList.add('is-linked');
    });
    pin.addEventListener('pointerleave', () => {
      hideTip();
      row?.classList.remove('is-linked');
    });
    pin.addEventListener('focus', () => {
      if (pin.matches(':focus-visible')) showTip(pin);
    });
    pin.addEventListener('blur', hideTip);

    if (row) {
      row.addEventListener('click', () => {
        if (openIndex === i) {
          dismiss();
          return;
        }
        open(i, true);
        ensureInView(stage);
      });
      const link = (on: boolean) => () => pin.classList.toggle('is-linked', on);
      row.addEventListener('pointerenter', link(true));
      row.addEventListener('pointerleave', link(false));
      row.addEventListener('focus', link(true));
      row.addEventListener('blur', link(false));
    }

    pop.querySelector('[data-pin-close]')!.addEventListener('click', dismiss);
    pop.querySelectorAll('[data-pin-link]').forEach((a) => a.addEventListener('click', close));
    pop.querySelectorAll<HTMLElement>('[data-pin-step]').forEach((button) => {
      button.addEventListener('click', () => step(Number(button.dataset.pinStep)));
    });
  });

  document.addEventListener(OPEN_EVENT, (e) => {
    if ((e as CustomEvent).detail !== root) close();
  });

  document.addEventListener('keydown', (e) => {
    if (openIndex === null || e.defaultPrevented) return;
    if (e.key === 'Escape') {
      dismiss();
    } else if (
      (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
      !(e.target as Element).closest('input, textarea, select, [contenteditable], [role="tablist"]')
    ) {
      e.preventDefault();
      step(e.key === 'ArrowLeft' ? -1 : 1);
    }
  });

  document.addEventListener('click', (e) => {
    if (openIndex === null) return;
    if (root.contains(e.target as Node) && (e.target as Element).closest('[data-pin], [data-pin-pop], [data-pin-row]')) return;
    dismiss();
  });

  window.addEventListener('resize', () => {
    if (openIndex !== null) placeCard(openIndex);
  });

  const figure: Figure = { root, pins, items: pins.map((_, i) => items[i] ?? null), open };
  pins.forEach((pin, i) => byPin.set(pin, { figure, i }));

  // Opens the first card once, the first time the figure is half in view, without moving focus or
  // scrolling. While another figure's card is open and that figure is still half in view, this one
  // waits (rechecking on scroll), so figures that come into view together open one after another.
  if (reduceMotion.matches) return;
  let observer: IntersectionObserver;
  let watching = false;
  const stop = () => {
    observer.disconnect();
    removeEventListener('scroll', onScroll);
  };
  const tryAutoOpen = () => {
    if (hasAutoOpened || userClosed || openIndex !== null) return stop();
    if (!pinsShown.matches || visibleRatio(root) < 0.5 || performance.now() < navigatingUntil) return;
    const other = document.querySelector('[data-pin-figure][data-open]');
    if (other && other !== root && visibleRatio(other) >= 0.5) return;
    hasAutoOpened = true;
    stop();
    open(0, false);
  };
  function onScroll() {
    if (watching) return;
    watching = true;
    requestAnimationFrame(() => {
      watching = false;
      tryAutoOpen();
    });
  }
  observer = new IntersectionObserver(
    (entries) => {
      const ratio = entries[entries.length - 1].intersectionRatio;
      if (ratio >= 0.5) {
        addEventListener('scroll', onScroll, { passive: true });
        tryAutoOpen();
      } else {
        removeEventListener('scroll', onScroll);
      }
    },
    { threshold: AUTO_THRESHOLDS },
  );
  observer.observe(root);

  // Shown again after being hidden (e.g. its tab panel reselected): open the first card again.
  let wasHidden = false;
  new ResizeObserver(([entry]) => {
    const hidden = entry.contentRect.width === 0 && entry.contentRect.height === 0;
    if (wasHidden && !hidden) {
      hasAutoOpened = false;
      userClosed = false;
      stop();
      observer.observe(root);
    }
    wasHidden = hidden;
  }).observe(root);
}

/**
 * A link to a pin: bring its figure (with the tab bar it sits under) into view and open the card,
 * or scroll to its list item when the pins are hidden. TabGroup has already shown the right panel.
 */
function goTo(pin: Element, focus: boolean) {
  const hit = byPin.get(pin);
  if (!hit) return false;
  const { figure, i } = hit;
  if (!pinsShown.matches) {
    const item = figure.items[i];
    if (item) scrollToTop(item);
    return true;
  }
  navigatingUntil = performance.now() + 1500;
  scrollToTop(figure.root.closest('[data-tab-group]') ?? figure.root);
  figure.open(i, true);
  if (focus) figure.pins[i].focus({ preventScroll: true });
  return true;
}

const pinFromHash = (hash: string) => (hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null);

let started = false;

export function initPinFigures() {
  if (started) return;
  started = true;
  document.querySelectorAll<HTMLElement>('[data-pin-figure]').forEach(setup);

  // Registered after the figures' own click handlers, so the card a link opens isn't dismissed as
  // an outside click by the same event.
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const pin = pinFromHash(a.hash);
    if (pin && goTo(pin, true)) {
      e.preventDefault();
      history.pushState(null, '', a.hash);
    }
  });
  // Two frames: after TabGroup has shown the panel and made its own jump to the pin.
  const fromLocation = () => {
    const pin = pinFromHash(location.hash);
    if (pin) requestAnimationFrame(() => requestAnimationFrame(() => goTo(pin, false)));
  };
  addEventListener('hashchange', fromLocation);
  fromLocation();
}
