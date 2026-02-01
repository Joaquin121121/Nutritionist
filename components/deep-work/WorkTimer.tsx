'use client';

import { useState } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import type { WorkIntervalMinutes } from '@/types';

interface WorkTimerProps {
  intervalMinutes: WorkIntervalMinutes;
  elapsedSeconds: number;
  isRunning: boolean;
  disabled: boolean;
  onIntervalChange: (interval: WorkIntervalMinutes) => void;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

const INTERVAL_OPTIONS: WorkIntervalMinutes[] = [90, 60, 45, 30];

function formatTimeDisplay(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function WorkTimer({
  intervalMinutes,
  elapsedSeconds,
  isRunning,
  disabled,
  onIntervalChange,
  onStart,
  onPause,
  onStop,
}: WorkTimerProps) {
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);

  const totalSeconds = intervalMinutes * 60;
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
  const progress = (elapsedSeconds / totalSeconds) * 100;

  // Calculate circle properties
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
      {/* Header with interval selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Trabajo profundo
          </span>
        </div>

        {!isRunning && elapsedSeconds === 0 && (
          <div className="relative">
            <button
              onClick={() => setShowIntervalPicker(!showIntervalPicker)}
              disabled={disabled}
              className="px-3 py-1 text-sm font-medium rounded-lg
                bg-neutral-100 dark:bg-neutral-700
                text-neutral-700 dark:text-neutral-300
                hover:bg-neutral-200 dark:hover:bg-neutral-600
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {intervalMinutes} min
            </button>

            {showIntervalPicker && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-10">
                {INTERVAL_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      onIntervalChange(opt);
                      setShowIntervalPicker(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm
                      hover:bg-neutral-100 dark:hover:bg-neutral-700
                      ${opt === intervalMinutes
                        ? 'text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-neutral-700 dark:text-neutral-300'
                      }
                      first:rounded-t-lg last:rounded-b-lg`}
                  >
                    {opt} min
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Circular timer display */}
      <div className="flex justify-center my-6">
        <div className="relative w-52 h-52">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-neutral-200 dark:text-neutral-700"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-primary-500 dark:text-primary-400 transition-all duration-1000 ease-linear"
            />
          </svg>
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
              {formatTimeDisplay(remainingSeconds)}
            </span>
            <span className="text-xs text-neutral-500 mt-1">
              restante
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!isRunning ? (
          <button
            onClick={onStart}
            disabled={disabled}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium
              bg-primary-500 text-white
              hover:bg-primary-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all active:scale-95"
          >
            <Play className="w-5 h-5" />
            {elapsedSeconds > 0 ? 'Continuar' : 'Iniciar'}
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium
              bg-amber-500 text-white
              hover:bg-amber-600
              transition-all active:scale-95"
          >
            <Pause className="w-5 h-5" />
            Pausar
          </button>
        )}

        {(isRunning || elapsedSeconds > 0) && (
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium
              bg-red-500 text-white
              hover:bg-red-600
              transition-all active:scale-95"
          >
            <Square className="w-5 h-5" />
            Detener
          </button>
        )}
      </div>

      {elapsedSeconds > 0 && !isRunning && (
        <p className="text-center text-sm text-neutral-500 mt-4">
          {Math.floor(elapsedSeconds / 60)} min acumulados
        </p>
      )}
    </div>
  );
}
