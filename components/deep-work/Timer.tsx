'use client';

import { useState } from 'react';
import { Play, Pause, RotateCcw, Clock, Coffee } from 'lucide-react';
import type { WorkIntervalMinutes } from '@/types';

export type TimerMode = 'work' | 'rest';

interface TimerProps {
  mode: TimerMode;
  intervalMinutes: WorkIntervalMinutes;
  elapsedSeconds: number;
  isRunning: boolean;
  disabled: boolean;
  onModeChange: (mode: TimerMode) => void;
  onIntervalChange: (interval: WorkIntervalMinutes) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const INTERVAL_OPTIONS: WorkIntervalMinutes[] = [90, 60, 45, 30];
const REST_MINUTES = 15;

function formatTimeDisplay(totalSeconds: number, isNegative: boolean = false): string {
  const absSeconds = Math.abs(totalSeconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  const prefix = isNegative ? '-' : '';
  if (hours > 0) {
    return `${prefix}${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${prefix}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function Timer({
  mode,
  intervalMinutes,
  elapsedSeconds,
  isRunning,
  disabled,
  onModeChange,
  onIntervalChange,
  onStart,
  onPause,
  onReset,
}: TimerProps) {
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);

  const totalSeconds = mode === 'work' ? intervalMinutes * 60 : REST_MINUTES * 60;
  const remainingSeconds = totalSeconds - elapsedSeconds;
  const isOvertime = remainingSeconds < 0;
  const progress = Math.min((elapsedSeconds / totalSeconds) * 100, 100);

  // Calculate circle properties
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isWork = mode === 'work';
  const accentColor = isWork ? 'primary' : 'green';

  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border-2 transition-colors ${
      isWork
        ? 'border-primary-200 dark:border-primary-800'
        : 'border-green-200 dark:border-green-800'
    }`}>
      {/* Mode tabs */}
      <div className="flex rounded-lg bg-neutral-100 dark:bg-neutral-700 p-1 mb-4">
        <button
          onClick={() => !isRunning && onModeChange('work')}
          disabled={isRunning}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all
            ${mode === 'work'
              ? 'bg-white dark:bg-neutral-800 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }
            ${isRunning ? 'cursor-not-allowed' : ''}`}
        >
          <Clock className="w-4 h-4" />
          Trabajo
        </button>
        <button
          onClick={() => !isRunning && onModeChange('rest')}
          disabled={isRunning}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all
            ${mode === 'rest'
              ? 'bg-white dark:bg-neutral-800 text-green-600 dark:text-green-400 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }
            ${isRunning ? 'cursor-not-allowed' : ''}`}
        >
          <Coffee className="w-4 h-4" />
          Descanso
        </button>
      </div>

      {/* Interval selector (only for work mode, when not running) */}
      {isWork && !isRunning && elapsedSeconds === 0 && (
        <div className="flex justify-center mb-4">
          <div className="relative">
            <button
              onClick={() => setShowIntervalPicker(!showIntervalPicker)}
              disabled={disabled}
              className="px-4 py-2 text-sm font-medium rounded-lg
                bg-neutral-100 dark:bg-neutral-700
                text-neutral-700 dark:text-neutral-300
                hover:bg-neutral-200 dark:hover:bg-neutral-600
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {intervalMinutes} minutos
            </button>

            {showIntervalPicker && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-10">
                {INTERVAL_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      onIntervalChange(opt);
                      setShowIntervalPicker(false);
                    }}
                    className={`block w-full px-6 py-2 text-center text-sm
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
        </div>
      )}

      {/* Rest mode label */}
      {!isWork && !isRunning && elapsedSeconds === 0 && (
        <div className="text-center mb-4">
          <span className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">
            15 minutos
          </span>
        </div>
      )}

      {/* Circular timer display */}
      <div className="flex justify-center my-6">
        <div className="relative w-56 h-56">
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
              className={`transition-all duration-1000 ease-linear ${
                isWork
                  ? 'text-primary-500 dark:text-primary-400'
                  : 'text-green-500 dark:text-green-400'
              }`}
            />
          </svg>
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-bold tabular-nums ${
              isOvertime
                ? 'text-red-600 dark:text-red-400'
                : 'text-neutral-800 dark:text-neutral-200'
            }`}>
              {formatTimeDisplay(Math.abs(remainingSeconds), isOvertime)}
            </span>
            {isOvertime && isWork && (
              <span className="text-sm text-red-500 dark:text-red-400 mt-1">
                Tiempo extra
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!isRunning ? (
          <button
            onClick={onStart}
            disabled={disabled}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-white
              transition-all active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isWork
                ? 'bg-primary-500 hover:bg-primary-600'
                : 'bg-green-500 hover:bg-green-600'
              }`}
          >
            <Play className="w-5 h-5" />
            {elapsedSeconds > 0 ? 'Continuar' : 'Iniciar'}
          </button>
        ) : (
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium
              bg-amber-500 text-white
              hover:bg-amber-600
              transition-all active:scale-95"
          >
            <Pause className="w-5 h-5" />
            Pausar
          </button>
        )}

        {elapsedSeconds > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium
              bg-neutral-200 dark:bg-neutral-700
              text-neutral-700 dark:text-neutral-300
              hover:bg-neutral-300 dark:hover:bg-neutral-600
              transition-all active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Elapsed info when paused */}
      {elapsedSeconds > 0 && !isRunning && isWork && (
        <p className={`text-center text-sm mt-4 ${
          isOvertime ? 'text-red-500' : 'text-neutral-500'
        }`}>
          {Math.floor(elapsedSeconds / 60)} min trabajados
          {isOvertime && ` (+${Math.floor((elapsedSeconds - totalSeconds) / 60)} extra)`}
        </p>
      )}
    </div>
  );
}
