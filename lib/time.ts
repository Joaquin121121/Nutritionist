/**
 * Time helpers anchored to Argentina (America/Argentina/Buenos_Aires).
 *
 * The progress "ignore" mechanism must decide which calendar day a moment
 * belongs to using Argentine local time — e.g. toggling tracking off late at
 * night should ignore *that* day, not the next UTC day.
 */

const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';

/** Today's date as `yyyy-MM-dd` in Argentina time. */
export function argentinaToday(): string {
  // `en-CA` formats dates as `YYYY-MM-DD`, matching the keys used across the app.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
