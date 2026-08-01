import type { Circuit, CircuitResult } from '@/types';

/**
 * Voice-tracked shooting circuits.
 *
 * A circuit is made of `spots` positions on the court. On each spot you take
 * `shotsPerSpot` shots. After every shot you call out "make" or "miss" and the
 * app tracks it live. When a spot's shots are done you're told to move to the
 * next spot; when a circuit is done you get a summary and the next circuit name.
 */
export const CIRCUITS: Circuit[] = [
  { id: 'layups', name: 'Layups', emoji: '🏀', spots: 2, shotsPerSpot: 10 },
  { id: 'floaters', name: 'Floaters', emoji: '🌊', spots: 3, shotsPerSpot: 5 },
  { id: 'midrange', name: 'Midrange Pull Ups', emoji: '⬆️', spots: 3, shotsPerSpot: 5 },
  { id: 'threes', name: 'Threes', emoji: '🎯', spots: 5, shotsPerSpot: 10 },
  { id: 'freethrows', name: 'Free Throws', emoji: '⭐', spots: 1, shotsPerSpot: 20 },
];

export function circuitTotalShots(circuit: Circuit): number {
  return circuit.spots * circuit.shotsPerSpot;
}

export const SESSION_TOTAL_SHOTS = CIRCUITS.reduce(
  (sum, c) => sum + circuitTotalShots(c),
  0
);

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
}

/**
 * Spread a circuit total entered by hand across its spots.
 *
 * A manual log only knows makes/attempts for the whole circuit, but a session
 * row stores per-spot numbers. Attempts fill spot by spot (you finish a spot
 * before moving on), and makes are spread proportionally so no spot reads as a
 * perfect or empty run purely because of ordering.
 */
export function distributeAcrossSpots(
  circuit: Circuit,
  makes: number,
  attempts: number
): { makes: number; attempts: number }[] {
  const totalAttempts = clamp(attempts, 0, circuitTotalShots(circuit));
  const totalMakes = clamp(makes, 0, totalAttempts);

  let left = totalAttempts;
  const spots = Array.from({ length: circuit.spots }, () => {
    const a = Math.min(circuit.shotsPerSpot, left);
    left -= a;
    return { makes: 0, attempts: a };
  });

  let leftMakes = totalMakes;
  for (const spot of spots) {
    if (leftMakes <= 0) break;
    const share = Math.round((totalMakes * spot.attempts) / totalAttempts);
    spot.makes = Math.min(spot.attempts, share, leftMakes);
    leftMakes -= spot.makes;
  }
  // Rounding can leave a shot or two unassigned; top them up in order.
  for (const spot of spots) {
    if (leftMakes <= 0) break;
    const give = Math.min(spot.attempts - spot.makes, leftMakes);
    spot.makes += give;
    leftMakes -= give;
  }

  return spots;
}

/**
 * Turn per-circuit makes/attempts typed by hand into the same `CircuitResult[]`
 * shape the voice engine produces, so both paths save identical rows.
 */
export function manualCircuitResults(
  entries: { makes: number; attempts: number }[]
): CircuitResult[] {
  return CIRCUITS.map((c, i) => {
    const entry = entries[i] ?? { makes: 0, attempts: 0 };
    const attempts = clamp(entry.attempts, 0, circuitTotalShots(c));
    const makes = clamp(entry.makes, 0, attempts);
    return {
      id: c.id,
      name: c.name,
      makes,
      attempts,
      spots: distributeAcrossSpots(c, makes, attempts),
    };
  });
}
