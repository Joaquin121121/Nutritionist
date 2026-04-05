import type { ShotType, ShotData } from '@/types';

export const SHOT_TYPES: ShotType[] = [
  { id: 'midrange_pullup', name: 'Midrange Pullup', attempts: 15, emoji: '⬆️' },
  { id: 'triple_cs_1', name: 'Triple C&S', attempts: 50, emoji: '3️⃣' },
  { id: 'flotadora', name: 'Flotadora', attempts: 25, emoji: '🌊' },
  { id: 'bandeja_izq', name: 'Bandeja Izquierda', attempts: 25, emoji: '👈' },
  { id: 'bandeja_der', name: 'Bandeja Derecha', attempts: 25, emoji: '👉' },
  { id: 'triples_cs', name: 'Triples C&S', attempts: 50, emoji: '🔥' },
  { id: 'libres', name: 'Tiros Libres', attempts: 30, emoji: '⭐' },
];

export const TOTAL_ATTEMPTS = SHOT_TYPES.reduce((sum, shot) => sum + shot.attempts, 0);

export const DEFAULT_SHOT_DATA: ShotData = {};

export function calculateSessionScore(shots: ShotData): {
  totalMakes: number;
  totalAttempts: number;
  score: number;
} {
  let totalMakes = 0;
  let totalAttempts = 0;

  SHOT_TYPES.forEach((shotType) => {
    const makes = shots[shotType.id];
    if (makes !== undefined && makes > 0) {
      totalMakes += makes;
      totalAttempts += shotType.attempts;
    }
  });

  const score = totalAttempts > 0 ? (totalMakes / totalAttempts) * 100 : 0;

  return { totalMakes, totalAttempts, score };
}

export function getShotTypeById(id: keyof ShotData): ShotType | undefined {
  return SHOT_TYPES.find((shot) => shot.id === id);
}
