'use client';

interface CompoundScoreProps {
  score: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-primary-500';
  if (score >= 60) return 'text-accent-500';
  return 'text-danger-500';
}

function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-primary-500/20 to-primary-500/5';
  if (score >= 60) return 'from-accent-500/20 to-accent-500/5';
  return 'from-danger-500/20 to-danger-500/5';
}

export function CompoundScore({ score }: CompoundScoreProps) {
  const colorClass = getScoreColor(score);
  const gradientClass = getScoreGradient(score);

  return (
    <div className={`bg-gradient-to-b ${gradientClass} rounded-2xl p-6 text-center`}>
      <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
        Puntuacion General
      </div>
      <div className={`text-6xl font-bold ${colorClass}`}>
        {Math.round(score)}
      </div>
      <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
        de 100
      </div>
    </div>
  );
}
