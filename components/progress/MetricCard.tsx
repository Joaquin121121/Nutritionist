'use client';

interface MetricCardProps {
  title: string;
  emoji: string;
  percentage: number;
  target: number;
  numerator: number;
  denominator: number;
  unit: string;
  isInverse?: boolean;
}

export function MetricCard({
  title,
  emoji,
  percentage,
  target,
  numerator,
  denominator,
  isInverse = false,
}: MetricCardProps) {
  const color = isInverse ? 'var(--amber)' : 'var(--accent)';

  // Fill is scaled so the target marker sits at a meaningful spot.
  // Inverse metrics chart against 2× target; positive against the target.
  const scale = isInverse ? target * 2 : target;
  const fillWidth = Math.min(100, scale > 0 ? (percentage / scale) * 100 : 0);
  const targetLeft = isInverse ? 50 : 100;

  return (
    <div className="metric-card">
      <div className="mc-emoji">{emoji}</div>
      <div className="mc-title">{title}</div>
      <div className="mc-pct" style={{ color }}>
        {Math.round(percentage)}
        <small>%</small>
      </div>
      <div className="mc-bar">
        <span className="mc-fill" style={{ width: `${fillWidth}%`, background: color }} />
        <span className="mc-target" style={{ left: `${targetLeft}%` }} />
      </div>
      <div className="mc-sub">
        {numerator}
        <i>/{denominator}</i> {isInverse ? 'permitidos' : 'logrados'}
      </div>
    </div>
  );
}
