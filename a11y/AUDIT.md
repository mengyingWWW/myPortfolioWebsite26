# Accessibility audit: WCAG 2.2 Level AA

Site: Mengying's portfolio (Astro build, desktop layout). Audited 10 Oct 2026 against a production build with the sun preview enabled (`PUBLIC_SUN_PREVIEW=1`) so the hero could be checked at fixed hours.

Status: **phase 4, fixed and re-verified.** The latest `npm run a11y` reports **0 axe violations** across all 24 page states. Two criteria remain open by decision:
- 2.2.2: no pause control, accepted.
- 1.4.10: reflow, planned as a separate responsive pass.

See "Open by decision" below.

## Summary by criterion

Pass = no failures found. Fail = at least one open issue. N/A = the site has no content of that kind.

| Criterion | Level | Result | Notes |
| --- | --- | --- | --- |
| 1.1.1 Non-text Content | A | Pass | Fixed: cover images now have descriptive alt text (A3, A4, A5). |
| 1.2.1–1.2.5 Time-based media | A/AA | N/A | No audio or video is published (`VideoEmbed` exists but is unused). |
| 1.3.1 Info and Relationships | A | Pass | Fixed: card headings exposed, About fields use `<dl>` (A2, A9). |
| 1.3.2 Meaningful Sequence | A | Pass | DOM order matches visual order on every page. |
| 1.3.3 Sensory Characteristics | A | Pass | |
| 1.3.4 Orientation | AA | Pass | Not locked to an orientation. |
| 1.3.5 Identify Input Purpose | AA | N/A | No forms. |
| 1.4.1 Use of Color | A | Pass | The hero link differs by typeface and underline; the active sundial stop has an underline as well as a colour. |
| 1.4.2 Audio Control | A | N/A | |
| 1.4.3 Contrast (Minimum) | AA | Pass | Fixed: every grey is now the `--color-meta` token, `#6E6E6E` (V1). |
| 1.4.4 Resize Text | AA | Pass | At 200% text scales without clipping. The page scrolls sideways, which 1.4.4 allows, but see 1.4.10. |
| 1.4.5 Images of Text | AA | Pass | Only the logo (exempt) and product screenshots (essential). |
| 1.4.10 Reflow | AA | **Fail** | The 1200px minimum width forces sideways scrolling at 320px and at 200% zoom and above. Planned fix: lightweight responsive pass (V5). |
| 1.4.11 Non-text Contrast | AA | Pass | Fixed: the hero name's dotted underline is at least 4.12:1 over the leaf shadow (V2). |
| 1.4.12 Text Spacing | AA | Pass | No clipping or overlap with the WCAG spacing overrides. |
| 1.4.13 Content on Hover or Focus | AA | Pass | Hover hints ("move the sun", cursor labels) don't cover content and don't trap the pointer. |
| 2.1.1 Keyboard | A | Pass | Every link and button is reachable. The footer logo's sun follows the pointer only, but it's decorative and carries no information. |
| 2.1.2 No Keyboard Trap | A | Pass | |
| 2.1.4 Character Key Shortcuts | A | Pass | Only arrow keys are used, and only while a sundial button has focus (N1). |
| 2.2.1 Timing Adjustable | A | N/A | No time limits. |
| 2.2.2 Pause, Stop, Hide | A | **Fail** | Endless motion with no on-page pause control. Accepted as a known failure; it respects `prefers-reduced-motion` (V3). |
| 2.3.1 Three Flashes | A | Pass | |
| 2.4.1 Bypass Blocks | A | Pass | Fixed: skip link added (A1). |
| 2.4.2 Page Titled | A | Pass | Fixed: the 404 page is "Page not found — Mengying" (V4). |
| 2.4.3 Focus Order | A | Pass | |
| 2.4.4 Link Purpose (In Context) | A | Pass | Fixed: card, next-project and email link names (A2, A5, A10). |
| 2.4.5 Multiple Ways | AA | Pass | Nav, the Selected Work list, and "Next project" links. |
| 2.4.6 Headings and Labels | AA | Pass | |
| 2.4.7 Focus Visible | AA | Pass | Fixed: the scroll hint no longer takes focus while invisible (A6). |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Pass | When tabbing backwards, cards are up to 18% under the sticky nav, which is never fully hidden (see advisory N3). |
| 2.5.1 Pointer Gestures | A | Pass | |
| 2.5.2 Pointer Cancellation | A | Pass | Native links and buttons only. |
| 2.5.3 Label in Name | A | Pass | Every accessible name contains its visible label. |
| 2.5.4 Motion Actuation | A | N/A | |
| 2.5.7 Dragging Movements | AA | N/A | No drag interactions. |
| 2.5.8 Target Size (Minimum) | AA | Pass | Small nav and footer links pass via the spacing exception. |
| 3.1.1 Language of Page | A | Pass | Every page, including the 404, has `lang="en"` (V4). |
| 3.1.2 Language of Parts | AA | Pass | 梦嬴 is marked `lang="zh-CN"` (and is decorative). |
| 3.2.1 On Focus / 3.2.2 On Input | A | Pass | |
| 3.2.3 Consistent Navigation | AA | Pass | |
| 3.2.4 Consistent Identification | AA | Pass | |
| 3.2.6 Consistent Help | A | Pass | The contact links are in the same footer on every page. |
| 3.3.1–3.3.8 Input assistance | A/AA | N/A | No forms or authentication. |
| 4.1.2 Name, Role, Value | A | Pass | The sundial uses `aria-pressed` buttons in a labelled group. |
| 4.1.3 Status Messages | AA | Pass | Fixed: the sundial caption is announced after a visitor picks a latitude (A8). |

**Totals:** 2 criteria fail, both by decision:
- 1.4.10 Reflow: planned lightweight responsive pass.
- 2.2.2 Pause, Stop, Hide: accepted.

Every other issue found has been fixed and re-verified. Until reflow is fixed, the site does not fully conform to WCAG 2.2 AA.

## Issues

Severity: **High** blocks or seriously hinders some users. **Medium** is a clear failure with a workaround. **Low** is a minor or edge-case failure, or polish.

### Fixed (non-visual)

| # | Page / component | WCAG | Severity | Evidence (before) | Fix | Resolved |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | All pages / `BaseLayout` | 2.4.1 | Medium | No way to skip the nav; the first Tab stop was the logo. | First element is a "Skip to content" link, shown on focus, targeting `<main id="main" tabindex="-1">`. | Yes. It's the first Tab stop on every page, paints above the nav (`elementFromPoint` check), and Enter moves focus to `main`. Screenshot: `screenshots/skip-link-focus.png`. |
| A2 | Home / `ProjectCard` | 1.3.1, 2.4.4, 2.4.6 | Medium | The title row was `aria-hidden`, so the six project titles weren't headings for screen readers. Link names were "IDEA AI Wiki Design, 2026", and the role/tool meta was hidden. | Title `<h3>` exposed. Link named "View {title} case study"; year and meta given as its description (`aria-describedby`). | Yes, see `sr-tree-home.txt`. |
| A3 | Home / `ProjectCard` | 1.1.1 | Medium | Cover screenshots had `alt=""` although they show the product. | New `coverAlt` field in the content schema; descriptive alt text written for all six projects. | Yes, see `sr-tree-home.txt`. |
| A4 | Case study / `ProjectHero` | 1.1.1 | Low | Hero image alt was "{title} cover". | Uses `coverAlt`, falling back to the old text. | Yes |
| A5 | Case study / `NextProject` | 2.4.4 | Low | The link name repeated the cover alt and read the "→" aloud. | Arrow `aria-hidden`; image `alt=""` because the link text already names the project. | Yes. "Next project" image is the only empty alt on each case-study page (`manual-results-structure.json`). |
| A6 | Home / `ScrollHint` | 2.4.7 | High | After scrolling, "View my work" faded to opacity 0 but stayed in the Tab order: focus landed on an invisible element (focus diff 0px). | It reappears while focused (`:not(:focus-visible)`). | Yes. Every Tab stop now shows a visible change (`manual-results-keyboard.json`, `notVisible: []`). |
| A7 | Home / `SunReadout` | 1.1.1, 1.3.1 | Low | Screen readers heard "SUN ALT -49° AZ 359°" and bare coordinates. | Visual readouts `aria-hidden`; an sr-only sentence says the background follows the sun in Seattle, with the local time, sun altitude and azimuth. Updated every minute. | Yes, see `sr-tree-home.txt`. |
| A8 | About / `LatitudeSundial` | 4.1.3 | Low | Picking a latitude changed the caption silently. | Caption becomes `aria-live="polite"` after the first user choice, so the autoplay stays quiet. | Yes |
| A9 | About / `AboutField`, `about.astro` | 1.3.1 | Low | Label/value pairs (Degree, Year, Skills…) were loose paragraphs. | `<dl>` with `<dt>` / `<dd>`; styling unchanged. | Yes, see `sr-tree-about.txt`. |
| A10 | All pages / `Footer` | 2.4.4 | Low | "Let's work together." didn't say it opens an email. | sr-only " (email)". | Yes |
| A11 | All pages / `Nav` | 4.1.2 | Low | Resume's name was "Resume ↗(opens in a new tab)", with no space. | Space added inside the sr-only text. | Yes |

A visual diff of full-page screenshots (Home at 13:00, About, a case study) before and after these fixes showed no layout or colour change. The only differences were leaf-shadow and logo animation frames, and a lazily loaded image caught mid-load.

### Visual fixes (approved and applied)

Every grey below now uses one token, `--color-meta: #6E6E6E` in `src/styles/global.css` (`text-meta` in Tailwind). That is 5.10:1 on white.

| # | Page / component | WCAG | Severity | Evidence (before) | Fix | Resolved |
| --- | --- | --- | --- | --- | --- | --- |
| V1a | Home / `ProjectCard` meta and year, `SelectedWork` year range | 1.4.3 | High | `#8A8A8A` on white = **3.45:1** (needs 4.5). axe `color-contrast`, all 4 homepage runs. | `text-meta` | Yes, axe passes. |
| V1b | About / section `<h2>`s, field labels, dates | 1.4.3 | High | `#8A8A8A` = 3.45:1 (axe). | `text-meta` | Yes, axe passes. |
| V1c | About / job roles | 1.4.3 | Medium | `#777` = **4.47:1** (axe). | `text-meta` | Yes, axe passes. |
| V1d | About / `LatitudeSundial` unpressed buttons | 1.4.3 | High | `#B0B0B0` = **2.16:1** (manual; axe skips them mid-transition). | `text-meta`. The pressed button stays `#111` and keeps its underline. | Yes (`screenshots/after-sundial-buttons.png`). |
| V1e | About / sundial "sun" hint (SVG text) | 1.4.3 | Medium | `fill="#8A8A8A"` = 3.45:1 (manual). | `fill: var(--color-meta)` | Yes. Computed fill is `rgb(110, 110, 110)`. |
| V1f | All pages / footer copyright line | 1.4.3 | High | `#B0B0B0` = 2.16:1 (axe, every page). | `text-meta` | Yes, axe passes (`screenshots/after-footer.png`). |
| V1g | All pages / footer logo "move the sun" hint | 1.4.3 | Medium | `#B0B0B0` = 2.16:1 (manual; appears on hover). | `text-meta` | Yes |
| V1h | Home / nav link hover (only without the custom cursor: no JS, touch, or coarse pointer) | 1.4.3 | Low | `hover:text-muted` (`#6B6B6B`) over the darkest leaf shadow = **3.30–3.99:1** across the four hours (pixel sampling). White pages passed at 5.33:1. | The link stays ink-coloured; an underline is the hover cue. With the custom cursor, hover is unchanged (the glass lens). | Yes. Without the custom cursor, hover is `rgb(10, 10, 10)` plus an underline. |
| V1i | `CoverPlaceholder` (currently unused) | 1.4.3 | Low | `#8A8A8A` on `#F2F2F2` = 3.08:1. | `text-meta` (4.55:1 on `#F2F2F2`). | Yes, by calculation (not rendered anywhere yet). |
| V2 | Home / `Hero` "Mengying" link underline | 1.4.11 | Medium | 2px dotted `#BDBDBD` ≈ **1.88:1** on white, and lower over shadow. It is the cue that the word is a link. | `border-bottom: 2px dotted var(--color-meta)` | Yes. Against the darkest pixel under the underline: 4.15 / 4.16 / 4.63 / 4.12:1 at 0:00 / 7:00 / 13:00 / 18:30 (needs 3). See `screenshots/after-hero-underline.png`. |
| V4 | Missing pages | 2.4.2, 3.1.1 | Medium | `/this-page-does-not-exist` showed the host's bare "Not found" page: axe `document-title`, `html-has-lang`. | New `src/pages/404.astro` on `BaseLayout`: nav, "404" label, `<h1>` "This page is in the shade.", links home and to the work, footer. | Yes. Status 404, title "Page not found — Mengying", `lang="en"`, axe passes (`screenshots/after-404.png`). |

### Open by decision

| # | Page / component | WCAG | Severity | Evidence | Decision | Resolved |
| --- | --- | --- | --- | --- | --- | --- |
| V3 | Home / `LeafShadow` sway and `ScrollHint` dot loop; About / sundial sun drift | 2.2.2 | Medium | All three move continuously for more than 5 s alongside other content. Pixels changed over 2 s with the page idle: Home 32, About 44; 0 with reduced motion (`manual-results-structure-cursor-motion-reflow-targets.json` → `motion`). | **Accepted as a known failure.** No on-page pause control. The motion is slow and small, and it stops completely under `prefers-reduced-motion: reduce`, which is the only way to turn it off. | No (accepted) |
| V5 | All pages / layout | 1.4.10 | High | At 320px wide, `scrollWidth` is 1200 vs `clientWidth` 320 on every page (`axe-results.json` → `reflow`; `screenshots/reflow-320-home.png`). The same happens at 200%+ zoom on a 1440px screen. | **Planned fix: lightweight responsive pass**, as a separate task after this QA is merged. Scope is below. | No (planned) |

**V5 scope: lightweight responsive pass.** The desktop design stays pixel-identical above 1024px.
- **Width:** remove the fixed 1200px width (`body` `min-width`, viewport `width=1200`). Use the existing container (max-width 1600px) with fluid side padding `clamp(20px, 4vw, 40px)`.
- **One breakpoint at 900px:**
  - **Work grid:** 2 columns become 1; the card meta row may wrap to two lines.
  - **Hero:** headline `clamp(34px, 7vw, 80px)`, subtitle `clamp(16px, 4.2vw, 21px)`. Below 600px, hide or stack the bottom readout.
  - **Nav:** keep the logo plus WORK / ABOUT / RESUME, with gaps reduced to 28px. No hamburger menu.
  - **About:** the two-act layout stacks vertically; the sundial and sun-path indicator scale to the container width.
  - **Case studies:** images full-width; text column max-width 100%.
  - **Footer:** links stack and stay centred.
- **Touch and small screens:** disable the custom cursor and hover-only effects (`(hover: none)`, `(pointer: coarse)`), and show card covers in colour by default.
- **WebGL leaf shadow:** render at a lower resolution on small screens; keep the sun logic.
- **Verify:** no horizontal scroll at 320px, or at 200% and 400% zoom on a 1280px window. Then re-run `npm run a11y`.

### Advisories (pass; noted for the record)

| # | Page / component | Note | Suggestion |
| --- | --- | --- | --- |
| N1 | About / `LatitudeSundial` | ArrowLeft/Right were captured window-wide while the sundial was in view, which blocked keyboard sideways scrolling at high zoom. | **Done.** Arrow keys now work only while a latitude button has focus, and focus moves to the newly chosen button. Verified: from `<body>` ArrowRight does nothing; on a button, Right then Left moves 0 → 1 → 2 → 1. |
| N2 | All pages | A real screen-reader pass (VoiceOver on macOS Safari) hasn't been done. The accessibility tree was checked with Playwright snapshots instead (`sr-tree-*.txt`). | Do a 10-minute VoiceOver pass: rotor headings and links on Home, About and one case study, plus the sundial buttons. |
| N3 | Home / cards | When tabbing backwards, a focused card can be 18% under the sticky nav. This passes 2.4.11 (AA) but would fail 2.4.12 (AAA). | `scroll-padding-top: 80px` on `html` would fix it, but it also moves where "View my work" lands, so it's a layout call. |
| N4 | Home / hero | 梦嬴 uses `zh-CN`, which is correct: 梦 is the simplified form, so `zh-Hant` would be wrong. It's `aria-hidden` because it's a decorative shadow of the name. | None |

## Method and evidence

All files referenced are in `a11y/`.

**Automated (phase 1).** `npm run a11y` (`scripts/a11y-scan.ts`) builds the site to `.a11y-build/` and serves it. It runs axe-core 4.13 (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) on every route plus a missing URL. Each route runs at 1440×900 and 320×800, and Home also at `?hour=0`, `7`, `13`, `18.5`: 24 runs in total. Each page is scrolled top to bottom first, so lazy content and scroll-driven states are rendered. Raw output is in `axe-results.json`.
- First run: 316 violation nodes, all `color-contrast` (V1) except `document-title` and `html-has-lang` on the 404 (V4).
- Latest run, after all fixes: **0 violations** in all 24 scans. The reflow runs still record sideways scrolling (V5).

**Manual (phase 2).** These checks are scripted in Playwright with Chrome; results are in `manual-results-*.json` and `screenshots/`.

1. **Text over the WebGL hero.** axe can't see through a canvas, so each hero and nav text box was measured against the darkest pixel behind it, with the text hidden, at all four hours. Minimums: body text 14.1:1, subtitle emphasis `#555` 6.24:1, "View my work" 10.2:1, sun readout `#5C5C5C` 4.91:1. Screenshots: `screenshots/hero-text-hidden-{0,7,13,18.5}.png`.
2. **Keyboard.** Every page was tabbed through forwards and backwards. The order is logical, there are no traps, and every stop changes visibly on focus (`manual-results-keyboard.json`). Card focus also turns the cover to colour (`screenshots/keyboard-card-focus.png`).
3. **Focus not obscured.** Checked by overlap with the sticky header. When tabbing backwards, the worst case is 18% (N3). A reported 100% for the hero link was a measuring artefact; in the real flow it sits at y=324 (`screenshots/backtab-hero-link.png`). The skip link's reported overlap is the same kind of artefact: it is z-index 50 above the nav and verified topmost.
4. **Bypass blocks.** The skip link was missing (A1), and is now verified.
5. **Custom cursor.** It only starts on fine pointers with hover. Without JS the native cursor stays (`cursor: auto`), and touch devices never get the custom cursor. Every hover effect also has a `:focus-visible` equivalent.
6. **Motion.** With `prefers-reduced-motion: reduce` the pages are static (0px change; `screenshots/about-sundial-reduced-motion.png`). Without it, motion is endless and there's no on-page control (V3, accepted).
7. **Target size.** All links and buttons meet 24×24 or the spacing exception.
8. **Text spacing.** The 1.4.12 overrides cause no clipping (`screenshots/text-spacing-home.png`).
9. **Zoom and reflow.** At 200% and 320px the page scrolls sideways (V5, planned; `screenshots/reflow-320-home.png`).
10. **Structure and language.** Each page has one `<h1>`, header/nav/main/footer landmarks, a unique `<title>` and `lang="en"`, and no hidden headings (`manual-results-structure.json`).
11. **Screen-reader proxy.** Accessibility-tree snapshots of Home, About and IDEA Mapping are in `sr-tree-*.txt`. They led to A2, A5, A7 and A9. A real VoiceOver pass is still needed (N2).

**Contrast reference (on white):** `#5C5C5C` 6.70 (sun readout), `#6B6B6B` 5.33 (`--color-muted`), `#6E6E6E` 5.10 (`--color-meta`). Replaced greys: `#777` 4.47, `#8A8A8A` 3.45, `#B0B0B0` 2.16, `#BDBDBD` 1.88.
