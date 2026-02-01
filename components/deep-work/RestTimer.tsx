'use client';

import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';

interface RestTimerProps {
  remainingSeconds: number;
  isRunning: boolean;
  isAvailable: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

function formatTimeDisplay(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function RestTimer({
  remainingSeconds,
  isRunning,
  isAvailable,
  onStart,
  onPause,
  onReset,
}: RestTimerProps) {
  const totalSeconds = 15 * 60; // 15 minutes
  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  if (!isAvailable) {
    return (
      <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2 text-neutral-400">
          <Coffee className="w-5 h-5" />
          <span className="text-sm">
            Completa un intervalo de trabajo para descansar
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Descanso
          </span>
        </div>
        <span className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
          {formatTimeDisplay(remainingSeconds)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-green-500 dark:bg-green-400 transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!isRunning ? (
          <button
            onClick={onStart}
            disabled={remainingSeconds === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              bg-green-500 text-white
              hover:bg-green-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all active:scale-95"
          >
            <Play className="w-4 h-4" />
            {remainingSeconds < totalSeconds && remainingSeconds > 0 ? 'Continuar' : 'Iniciar'}
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              bg-amber-500 text-white
              hover:bg-amber-600
              transition-all active:scale-95"
          >
            <Pause className="w-4 h-4" />
            Pausar
          </button>
        )}

        {(remainingSeconds < totalSeconds || remainingSeconds === 0) && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              bg-neutral-200 dark:bg-neutral-700
              text-neutral-700 dark:text-neutral-300
              hover:bg-neutral-300 dark:hover:bg-neutral-600
              transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar
          </button>
        )}
      </div>

      {remainingSeconds === 0 && (
        <p className="text-center text-sm text-green-600 dark:text-green-400 font-medium mt-3">
          Descanso completado!
        </p>
      )}
    </div>
  );
}
