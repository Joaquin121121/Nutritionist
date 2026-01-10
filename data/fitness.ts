import type { FitnessActivityDef, FitnessActivityType } from '@/types';

export const FITNESS_ACTIVITIES: FitnessActivityDef[] = [
  { id: 'weightlifting', name: 'Pesas', emoji: '🏋️' },
  { id: 'basketball_pickup', name: 'Basquet Pickup', emoji: '🏀' },
];

export function getFitnessActivityById(id: FitnessActivityType): FitnessActivityDef | undefined {
  return FITNESS_ACTIVITIES.find((activity) => activity.id === id);
}

export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
}
