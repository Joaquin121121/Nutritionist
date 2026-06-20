import type { Circuit } from '@/types';

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
