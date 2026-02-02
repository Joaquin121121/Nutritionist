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
  const TARGET_PERCENTAGE = 80;
  const percentage = (loggedMinutes / targetMinutes) * 100;
  const displayPercentage = Math.min(percentage, 100);
  const isComplete = loggedMinutes >= targetMinutes;
  const hasReachedTarget = percentage >= TARGET_PERCENTAGE;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Progreso
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${
            hasReachedTarget
              ? 'text-green-600 dark:text-green-400'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}>
            {Math.round(percentage)}% / {TARGET_PERCENTAGE}%
          </span>
          <span className={`text-sm ${
            isComplete
              ? 'text-green-600 dark:text-green-400'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}>
            {formatTime(loggedMinutes)} / {formatTime(targetMinutes)}
          </span>
        </div>
      </div>

      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden relative">
        {/* 80% target marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-neutral-400 dark:bg-neutral-500 z-10"
          style={{ left: `${TARGET_PERCENTAGE}%` }}
        />
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            hasReachedTarget
              ? 'bg-green-500 dark:bg-green-400'
              : 'bg-primary-500 dark:bg-primary-400'
          }`}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>

      {hasReachedTarget && (
        <p className="text-center text-sm text-green-600 dark:text-green-400 font-medium mt-2">
          {isComplete ? 'Meta completada!' : 'Meta de 80% alcanzada!'}
        </p>
      )}
    </div>
  );
}
