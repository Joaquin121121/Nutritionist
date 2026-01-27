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

function getStatusColor(percentage: number, target: number, isInverse: boolean): string {
  if (isInverse) {
    // For inverse metrics (like cheat meals), lower is better
    if (percentage <= target) return 'text-primary-500';
    if (percentage <= target * 1.5) return 'text-accent-500';
    return 'text-danger-500';
  } else {
    // For positive metrics, higher is better
    if (percentage >= target) return 'text-primary-500';
    if (percentage >= target * 0.7) return 'text-accent-500';
    return 'text-danger-500';
  }
}

function getProgressBarColor(percentage: number, target: number, isInverse: boolean): string {
  if (isInverse) {
    if (percentage <= target) return 'bg-primary-500';
    if (percentage <= target * 1.5) return 'bg-accent-500';
    return 'bg-danger-500';
  } else {
    if (percentage >= target) return 'bg-primary-500';
    if (percentage >= target * 0.7) return 'bg-accent-500';
    return 'bg-danger-500';
  }
}

export function MetricCard({
  title,
  emoji,
  percentage,
  target,
  numerator,
  denominator,
  unit,
  isInverse = false,
}: MetricCardProps) {
  const statusColor = getStatusColor(percentage, target, isInverse);
  const progressBarColor = getProgressBarColor(percentage, target, isInverse);

  // Calculate progress bar width
  // For inverse metrics, show how far over target (capped at 100%)
  // For positive metrics, show progress toward target (can exceed 100%)
  const progressWidth = isInverse
    ? Math.min(100, (percentage / (target * 2)) * 100)
    : Math.min(100, (percentage / target) * 100);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">{title}</span>
        </div>
        <span className={`text-2xl font-bold ${statusColor}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>

      <div className="relative h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-2">
        <div
          className={`absolute left-0 top-0 h-full ${progressBarColor} rounded-full transition-all duration-300`}
          style={{ width: `${progressWidth}%` }}
        />
        {/* Target marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-neutral-400 dark:bg-neutral-500"
          style={{ left: isInverse ? `${(target / (target * 2)) * 100}%` : '100%' }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
        <span>{numerator}/{denominator} {unit}</span>
        <span>Meta: {isInverse ? '<' : ''}{target}%</span>
      </div>
    </div>
  );
}
