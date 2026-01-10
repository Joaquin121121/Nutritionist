'use client';

import { Flame, Trophy, Dumbbell } from 'lucide-react';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  fitnessStreak?: number;
  longestFitnessStreak?: number;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  fitnessStreak = 0,
  longestFitnessStreak = 0,
}: StreakDisplayProps) {
  const isMealRecord = currentStreak > 0 && currentStreak >= longestStreak;
  const isFitnessRecord = fitnessStreak > 0 && fitnessStreak >= longestFitnessStreak;

  return (
    <div className="space-y-4">
      {/* Meal Streak */}
      <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-7 h-7" />
              <span className="text-4xl font-bold">{currentStreak}</span>
            </div>
            <span className="text-accent-100 font-medium text-sm">
              {currentStreak === 1 ? 'dia sin cheats' : 'dias sin cheats'}
            </span>
          </div>

          {isMealRecord && currentStreak > 0 ? (
            <div className="flex flex-col items-center">
              <Trophy className="w-5 h-5 text-accent-200 mb-1" />
              <span className="text-xs text-accent-200 font-medium">Record!</span>
            </div>
          ) : longestStreak > 0 ? (
            <div className="flex flex-col items-end text-accent-100">
              <span className="text-xs">Record</span>
              <span className="text-lg font-semibold">{longestStreak}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Fitness Streak */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-7 h-7" />
              <span className="text-4xl font-bold">{fitnessStreak}</span>
            </div>
            <span className="text-primary-100 font-medium text-sm">
              {fitnessStreak === 1 ? 'dia activo' : 'dias activos'}
            </span>
          </div>

          {isFitnessRecord && fitnessStreak > 0 ? (
            <div className="flex flex-col items-center">
              <Trophy className="w-5 h-5 text-primary-200 mb-1" />
              <span className="text-xs text-primary-200 font-medium">Record!</span>
            </div>
          ) : longestFitnessStreak > 0 ? (
            <div className="flex flex-col items-end text-primary-100">
              <span className="text-xs">Record</span>
              <span className="text-lg font-semibold">{longestFitnessStreak}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
