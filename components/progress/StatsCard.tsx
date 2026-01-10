'use client';

interface StatsCardProps {
  title: string;
  percentage: number;
  cleanDays: number;
  totalDays: number;
}

export function StatsCard({ title, percentage, cleanDays, totalDays }: StatsCardProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number): string => {
    if (pct >= 90) return 'text-primary-500';
    if (pct >= 70) return 'text-accent-500';
    if (pct >= 50) return 'text-yellow-500';
    return 'text-danger-500';
  };

  const getStrokeColor = (pct: number): string => {
    if (pct >= 90) return '#22c55e';
    if (pct >= 70) return '#f59e0b';
    if (pct >= 50) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3">
        {title}
      </h3>
      <div className="flex items-center gap-4">
        {/* Circular Progress */}
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-neutral-200 dark:text-neutral-700"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke={getStrokeColor(percentage)}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 0.5s ease',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getColor(percentage)}`}>
              {percentage}%
            </span>
          </div>
        </div>

        {/* Stats Text */}
        <div>
          <div className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            {cleanDays} de {totalDays}
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            dias limpios
          </div>
        </div>
      </div>
    </div>
  );
}
