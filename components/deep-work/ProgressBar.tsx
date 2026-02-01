'use client';

import { TrendingUp } from 'lucide-react';

interface ProgressBarProps {
  loggedMinutes: number;
  targetMinutes: number;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function ProgressBar({ loggedMinutes, targetMinutes }: ProgressBarProps) {
  const percentage = Math.min((loggedMinutes / targetMinutes) * 100, 100);
  const isComplete = loggedMinutes >= targetMinutes;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Progreso
          </span>
        </div>
        <span className={`text-sm font-semibold ${
          isComplete
            ? 'text-green-600 dark:text-green-400'
            : 'text-neutral-600 dark:text-neutral-400'
        }`}>
          {formatTime(loggedMinutes)} / {formatTime(targetMinutes)}
        </span>
      </div>

      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            isComplete
              ? 'bg-green-500 dark:bg-green-400'
              : 'bg-primary-500 dark:bg-primary-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isComplete && (
        <p className="text-center text-sm text-green-600 dark:text-green-400 font-medium mt-2">
          Meta completada!
        </p>
      )}
    </div>
  );
}
