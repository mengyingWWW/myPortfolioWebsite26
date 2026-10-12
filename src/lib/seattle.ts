/** Seattle's sun and clock, for the live hero shadows and footer logo. */
import { sunPosition } from './sun';

export const SEATTLE = { latitude: 47.6062, longitude: -122.3321, timeZone: 'America/Los_Angeles' };

export const seattleSun = (date: Date | number) => sunPosition(new Date(date), SEATTLE.latitude, SEATTLE.longitude);

/** Dev (and the a11y scan's build) only: ?hour=HH.H previews that Seattle local time today. */
function hourOverride(): number | null {
  if (!import.meta.env.DEV && import.meta.env.PUBLIC_SUN_PREVIEW !== '1') return null;
  const raw = new URLSearchParams(location.search).get('hour');
  if (raw === null || raw.trim() === '') return null;
  const hour = Number(raw);
  return Number.isFinite(hour) && hour >= 0 && hour < 24 ? hour : null;
}

let dateFormat: Intl.DateTimeFormat | undefined;

/** Now, or (in dev, with ?hour) that local time today in Seattle. */
export function seattleNow(): Date {
  const now = new Date();
  const hour = hourOverride();
  if (hour === null) return now;
  dateFormat ??= new Intl.DateTimeFormat('en-US', {
    timeZone: SEATTLE.timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZoneName: 'longOffset',
  });
  const parts = Object.fromEntries(dateFormat.formatToParts(now).map((p) => [p.type, p.value]));
  // "GMT-07:00" (or plain "GMT" at a zero offset).
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(parts.timeZoneName ?? '');
  const offsetMinutes = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
  const midnightUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  return new Date(midnightUtc + hour * 3_600_000 - offsetMinutes * 60_000);
}

const clockFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: SEATTLE.timeZone,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** "14:32", Seattle local time. */
export const seattleClock = (date: Date) => clockFormat.format(date);

/** Calls `fn` on every minute boundary, and when the URL changes (?hour). */
export function everyMinute(fn: () => void) {
  setTimeout(
    () => {
      fn();
      setInterval(fn, 60_000);
    },
    60_000 - (Date.now() % 60_000),
  );
  window.addEventListener('popstate', fn);
}
