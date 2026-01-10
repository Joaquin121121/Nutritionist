'use client';

import { Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { SHOT_TYPES } from '@/data/shots';
import type { ShotData } from '@/types';

interface SessionScoreProps {
  shots: ShotData;
  totalMakes: number;
  totalAttempts: number;
  score: number;
  onClose: () => void;
}

export function SessionScore({
  shots,
  totalMakes,
  totalAttempts,
  score,
  onClose,
}: SessionScoreProps) {
  const getScoreColor = (pct: number): string => {
    if (pct >= 70) return 'text-primary-500';
    if (pct >= 50) return 'text-accent-500';
    return 'text-danger-500';
  };

  const getScoreGradient = (pct: number): string => {
    if (pct >= 70) return 'from-primary-500 to-primary-600';
    if (pct >= 50) return 'from-accent-500 to-accent-600';
    return 'from-danger-500 to-danger-600';
  };

  const filledShots = SHOT_TYPES.filter(
    (shot) => shots[shot.id] !== undefined && shots[shot.id]! > 0
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-in">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
            Sesion Completada!
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Score Display */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getScoreGradient(score)} mb-4`}
          >
            <div className="text-center">
              <span className="text-4xl font-bold text-white">
                {Math.round(score)}%
              </span>
            </div>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            {totalMakes} de {totalAttempts} tiros
          </p>
          {score >= 70 && (
            <div className="flex items-center justify-center gap-2 mt-2 text-primary-600 dark:text-primary-400">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Excelente sesion!</span>
            </div>
          )}
        </div>

        {/* Shot Breakdown */}
        {filledShots.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">
              Desglose por tipo
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filledShots.map((shot) => {
                const makes = shots[shot.id] ?? 0;
                const pct = Math.round((makes / shot.attempts) * 100);
                return (
                  <div
                    key={shot.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>{shot.emoji}</span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {shot.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">
                        {makes}/{shot.attempts}
                      </span>
                      <span
                        className={`font-medium ${getScoreColor(pct)}`}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button onClick={onClose} className="w-full">
          Cerrar
        </Button>
      </div>
    </div>
  );
}
