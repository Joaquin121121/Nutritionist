'use client';

import { Play, Pause, RotateCcw } from 'lucide-react';
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

function formatTimeDisplay(totalSeconds: number, isNegative = false): string {
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
  const totalSeconds = mode === 'work' ? intervalMinutes * 60 : REST_MINUTES * 60;
  const remainingSeconds = totalSeconds - elapsedSeconds;
  const isOvertime = remainingSeconds < 0;
  const ringProgress = Math.min(1, elapsedSeconds / totalSeconds);
  const isWork = mode === 'work';

  return (
    <section className="sec">
      <div className="card timer-card">
        {/* Mode tabs */}
        <div className="seg seg-mode" style={{ marginTop: 0 }}>
          <button
            className={isWork ? 'active' : ''}
            disabled={isRunning}
            onClick={() => !isRunning && onModeChange('work')}
          >
            Trabajo
          </button>
          <button
            className={!isWork ? 'active' : ''}
            disabled={isRunning}
            onClick={() => !isRunning && onModeChange('rest')}
          >
            Descanso
          </button>
        </div>

        {/* Interval chips (work mode) */}
        {isWork && (
          <div className="intv-row">
            {INTERVAL_OPTIONS.map((v) => (
              <button
                key={v}
                className="intv-chip"
                data-on={intervalMinutes === v}
                disabled={isRunning || disabled}
                onClick={() => !isRunning && onIntervalChange(v)}
              >
                {v}m
              </button>
            ))}
          </div>
        )}

        {/* Timer ring */}
        <div className="timer-ring" data-rest={!isWork} style={{ '--p': ringProgress } as React.CSSProperties}>
          <div className="timer-inner">
            <div className="timer-time" data-over={isOvertime && isWork}>
              {formatTimeDisplay(Math.abs(remainingSeconds), isOvertime)}
            </div>
            <div className="timer-mode">{isWork ? 'Enfoque' : 'Descanso'}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="timer-ctrls">
          <button
            className="t-btn t-ghost"
            onClick={onReset}
            aria-label="Reiniciar"
          >
            <RotateCcw width={18} height={18} strokeWidth={2} />
          </button>
          {!isRunning ? (
            <button className="t-btn t-main" data-rest={!isWork} disabled={disabled} onClick={onStart}>
              <Play width={20} height={20} fill="currentColor" />
              {elapsedSeconds > 0 ? 'Continuar' : 'Iniciar'}
            </button>
          ) : (
            <button className="t-btn t-main" data-rest={!isWork} onClick={onPause}>
              <Pause width={20} height={20} fill="currentColor" />
              Pausar
            </button>
          )}
          <div style={{ width: 46 }} />
        </div>

        {/* Overtime / elapsed note */}
        {elapsedSeconds > 0 && !isRunning && isWork && (
          <p className="daily-note" style={{ textAlign: 'center', marginTop: 12 }}>
            {Math.floor(elapsedSeconds / 60)} min trabajados
            {isOvertime && ` (+${Math.floor((elapsedSeconds - totalSeconds) / 60)} extra)`}
          </p>
        )}
      </div>
    </section>
  );
}
