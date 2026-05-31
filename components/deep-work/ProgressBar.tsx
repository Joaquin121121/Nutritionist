'use client';

interface ProgressBarProps {
  loggedMinutes: number;
  targetMinutes: number;
}

export function ProgressBar({ loggedMinutes, targetMinutes }: ProgressBarProps) {
  const percentage = targetMinutes > 0 ? (loggedMinutes / targetMinutes) * 100 : 0;
  const displayPercentage = Math.min(percentage, 100);
  const remaining = targetMinutes - loggedMinutes;

  return (
    <div className="card daily-card">
      <div className="daily-top">
        <span className="eyebrow">Hoy</span>
        <span className="daily-val">
          <b>{loggedMinutes}</b> / {targetMinutes} min
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
