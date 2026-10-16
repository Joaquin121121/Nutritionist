/**
 * Time helpers anchored to Argentina (America/Argentina/Buenos_Aires).
 *
 * The progress "ignore" mechanism must decide which calendar day a moment
 * belongs to using Argentine local time — e.g. toggling tracking off late at
 * night should ignore *that* day, not the next UTC day.
 */

const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';
const HOUR_MS = 60 * 60 * 1000;

// `en-CA` formats dates as `YYYY-MM-DD`, matching the keys used across the app.
const argentinaDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: ARGENTINA_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The Argentine calendar date of a moment, as `yyyy-MM-dd`. */
function argentinaDate(ms: number): string {
  return argentinaDateFormat.format(new Date(ms));
}

/** Today's date as `yyyy-MM-dd` in Argentina time. */
export function argentinaToday(): string {
  return argentinaDate(Date.now());
}

/**
 * Focus (deep work) days run from 06:00 to 03:00 Argentina time the next
 * morning, so late-night work after midnight still counts for the day before.
 */
const FOCUS_DAY_START_HOUR = 6;
const FOCUS_DAY_END_HOUR = 3;

/**
 * The focus day (`yyyy-MM-dd`) a moment belongs to. The previous day closes
 * at 03:00, so from then on the new day is already the current one.
 */
export function focusDay(now: number = Date.now()): string {
  return argentinaDate(now - FOCUS_DAY_END_HOUR * HOUR_MS);
}

/**
 * Whether a timer started on focus day `day` can still be resumed: it's the
 * current focus day, or the previous one while still before 06:00 — a session
 * started before 03:00 keeps counting for the day it started on.
 */
export function isResumableFocusDay(day: string, now: number = Date.now()): boolean {
  return day === focusDay(now) || day === argentinaDate(now - FOCUS_DAY_START_HOUR * HOUR_MS);
}
