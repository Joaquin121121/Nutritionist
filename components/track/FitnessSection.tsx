'use client';

import { Check } from 'lucide-react';
import { FITNESS_ACTIVITIES } from '@/data/fitness';
import type { FitnessActivity, FitnessActivityType } from '@/types';

interface FitnessSectionProps {
  activities: FitnessActivity[];
  onToggle: (type: FitnessActivityType) => void;
}

const SUBTITLES: Record<string, string> = {
  weightlifting: 'Tren superior · fuerza',
  basketball_pickup: 'Pista cubierta',
};

export function FitnessSection({ activities, onToggle }: FitnessSectionProps) {
  const hasActivity = (type: FitnessActivityType) =>
    activities.some((a) => a.type === type);

  return (
    <div className="stack">
      {FITNESS_ACTIVITIES.map((activity) => {
        const isSelected = hasActivity(activity.id);

        return (
          <button
            key={activity.id}
            onClick={() => onToggle(activity.id)}
            className="tg-card"
            data-on={isSelected}
          >
            <span className="tg-emoji">{activity.emoji}</span>
            <span className="tg-text">
              <span className="tg-title">{activity.name}</span>
              {SUBTITLES[activity.id] && (
                <span className="tg-sub">{SUBTITLES[activity.id]}</span>
              )}
            </span>
            <span className="tg-check" data-on={isSelected}>
              {isSelected && <Check width={15} height={15} strokeWidth={2.6} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
