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
    <button onClick={onToggle} disabled={disabled} className="tg-card" data-on={isSelected}>
      <span className="tg-emoji">{emoji}</span>
      <span className="tg-text">
        <span className="tg-title">{name}</span>
        <span className="tg-sub">{weeklyCount} porciones esta semana</span>
      </span>
      {showWeeklyBadge && (
        <span className="tg-badge" data-met={targetMet}>
          {weeklyCount}/{weeklyTarget}
        </span>
      )}
      <span className="tg-check" data-on={isSelected}>
        {isSelected &&
          (selectionCount > 1 ? (
            <b>{selectionCount}</b>
          ) : (
            <Check width={15} height={15} strokeWidth={2.6} />
          ))}
      </span>
    </button>
  );
}
