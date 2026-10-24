'use client';

import { Pencil } from 'lucide-react';

interface ProgressBarProps {
  loggedMinutes: number;
  targetMinutes: number;
  /** Shows a pencil next to the target that opens the target editor. */
  onEditTarget?: () => void;
}

export function ProgressBar({ loggedMinutes, targetMinutes, onEditTarget }: ProgressBarProps) {
  const percentage = targetMinutes > 0 ? (loggedMinutes / targetMinutes) * 100 : 0;
  const displayPercentage = Math.min(percentage, 100);
  const remaining = targetMinutes - loggedMinutes;

  return (
    <div className="card daily-card">
      <div className="daily-top">
        <span className="eyebrow">Hoy</span>
        <span className="daily-top-end">
          <span className="daily-val">
            <b>{loggedMinutes}</b> / {targetMinutes} min
          </span>
          {onEditTarget && (
            <button
              type="button"
              className="daily-edit"
              aria-label="Editar objetivo"
              title="Editar objetivo"
              onClick={onEditTarget}
            >
              <Pencil width={13} height={13} strokeWidth={2.2} />
            </button>
          )}
        </span>
      </div>
      <div className="bar" style={{ height: 9 }}>
        <i style={{ width: `${displayPercentage}%` }} />
      </div>
      <p className="daily-note">
        {Math.round(percentage)}% del objetivo ·{' '}
        {remaining > 0 ? `${remaining} min restantes` : '¡Objetivo cumplido!'}
      </p>
    </div>
  );
}
