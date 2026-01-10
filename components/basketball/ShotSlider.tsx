'use client';

import type { ShotType } from '@/types';

interface ShotSliderProps {
  shot: ShotType;
  value: number;
  onChange: (value: number) => void;
}

export function ShotSlider({ shot, value, onChange }: ShotSliderProps) {
  const percentage = shot.attempts > 0 ? Math.round((value / shot.attempts) * 100) : 0;

  const getPercentageColor = (pct: number): string => {
    if (pct >= 70) return 'text-primary-600 dark:text-primary-400';
    if (pct >= 50) return 'text-accent-600 dark:text-accent-400';
    return 'text-danger-600 dark:text-danger-400';
  };

  const getSliderGradient = (pct: number): string => {
    if (pct >= 70) return 'from-primary-400 to-primary-500';
    if (pct >= 50) return 'from-accent-400 to-accent-500';
    return 'from-danger-400 to-danger-500';
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{shot.emoji}</span>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {shot.name}
          </span>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
            {value}/{shot.attempts}
          </span>
          <span className={`block text-sm font-medium ${getPercentageColor(percentage)}`}>
            {percentage}%
          </span>
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min={0}
          max={shot.attempts}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-primary-500
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-primary-500
            [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--color-primary-500) 0%, var(--color-primary-500) ${(value / shot.attempts) * 100}%, var(--color-neutral-200) ${(value / shot.attempts) * 100}%, var(--color-neutral-200) 100%)`,
          }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-neutral-400">
        <span>0</span>
        <span>{shot.attempts}</span>
      </div>
    </div>
  );
}
