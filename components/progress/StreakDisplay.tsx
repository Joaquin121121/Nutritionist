'use client';

import { Flame, Trophy } from 'lucide-react';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  const isPersonalBest = currentStreak > 0 && currentStreak >= longestStreak;

  return (
    <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-8 h-8" />
            <span className="text-5xl font-bold">{currentStreak}</span>
          </div>
          <span className="text-accent-100 font-medium">
            {currentStreak === 1 ? 'dia sin cheats' : 'dias sin cheats'}
          </span>
        </div>

        {isPersonalBest && currentStreak > 0 && (
          <div className="flex flex-col items-center">
            <Trophy className="w-6 h-6 text-accent-200 mb-1" />
            <span className="text-xs text-accent-200 font-medium">
              Record!
            </span>
          </div>
        )}
      </div>

      {longestStreak > 0 && !isPersonalBest && (
        <div className="mt-4 pt-4 border-t border-accent-400/30">
          <div className="flex items-center gap-2 text-accent-100">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">
              Record personal: {longestStreak} dias
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
