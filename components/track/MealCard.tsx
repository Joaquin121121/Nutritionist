'use client';

import { Check } from 'lucide-react';

interface MealCardProps {
  id: string;
  name: string;
  emoji: string;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  selectionCount?: number;
  weeklyCount?: number;
  weeklyTarget?: number;
}

export function MealCard({
  name,
  emoji,
  isSelected,
  onToggle,
  disabled = false,
  selectionCount = 0,
  weeklyCount = 0,
  weeklyTarget = 0,
}: MealCardProps) {
  const showWeeklyBadge = weeklyTarget > 0;
  const targetMet = weeklyCount >= weeklyTarget;
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-full p-4 rounded-xl border-2 transition-all duration-200 text-left active:scale-[0.98] ${
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 shadow-sm'
          : disabled
          ? 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 opacity-50 cursor-not-allowed'
          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-primary-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{emoji}</span>
        <div className="flex-1 flex items-center gap-2">
          <span
            className={`font-medium ${
              isSelected
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {name}
          </span>
          {showWeeklyBadge && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                targetMet
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
              }`}
            >
              {weeklyCount}/{weeklyTarget}
            </span>
          )}
        </div>
        {isSelected && (
          <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
            {selectionCount > 1 ? (
              <span className="text-xs font-bold text-white">{selectionCount}</span>
            ) : (
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            )}
          </div>
        )}
      </div>
    </button>
  );
}
