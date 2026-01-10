'use client';

import { Check } from 'lucide-react';
import { FITNESS_ACTIVITIES } from '@/data/fitness';
import type { FitnessActivity, FitnessActivityType } from '@/types';

interface FitnessSectionProps {
  activities: FitnessActivity[];
  onToggle: (type: FitnessActivityType) => void;
}

export function FitnessSection({ activities, onToggle }: FitnessSectionProps) {
  const hasActivity = (type: FitnessActivityType) =>
    activities.some((a) => a.type === type);

  return (
    <div className="space-y-3">
      {FITNESS_ACTIVITIES.map((activity) => {
        const isSelected = hasActivity(activity.id);

        return (
          <button
            key={activity.id}
            onClick={() => onToggle(activity.id)}
            className={`relative w-full p-4 rounded-xl border-2 transition-all duration-200 text-left active:scale-[0.98] ${
              isSelected
                ? 'bg-accent-50 dark:bg-accent-900/20 border-accent-500 shadow-sm'
                : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-accent-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activity.emoji}</span>
              <span
                className={`flex-1 font-medium ${
                  isSelected
                    ? 'text-accent-700 dark:text-accent-300'
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {activity.name}
              </span>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
