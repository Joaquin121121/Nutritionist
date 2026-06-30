'use client';

import { useMemo } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isAfter,
  startOfDay,
} from 'date-fns';
import type { DailyLog } from '@/types';

export type ContributionMode = 'nutrition' | 'physical';

interface ContributionMapProps {
  logs: DailyLog[];
  mode: ContributionMode;
  start: Date;
  end: Date;
}

const VARIABLE_MEALS_DAILY_TARGET = 2;
const FIXED_MEALS_DAILY_TARGET = 5;

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const EMPTY = '#ededed';
// Rest/paused days that are excluded from scoring — a clearly darker gray than
// EMPTY ("sin dato") so the two read as distinct on the map.
const IGNORED = '#9ca3af';

interface DaySquare {
  key: string;
  color: string;
  label: string;
  inRange: boolean;
}

function nutritionColor(log: DailyLog | undefined): { color: string; label: string } {
  const variableCount = log?.variable_meals?.length ?? 0;
  const fixedCount = log?.fixed_meals
    ? Object.values(log.fixed_meals).filter(Boolean).length
    : 0;
  const cheatCount = log?.cheat_meals?.length ?? 0;

  const variableAchieved = variableCount >= VARIABLE_MEALS_DAILY_TARGET;
  const fixedAchieved = fixedCount >= FIXED_MEALS_DAILY_TARGET;
  const achieved = (variableAchieved ? 1 : 0) + (fixedAchieved ? 1 : 0);
  const hasCheat = cheatCount > 0;

  if (hasCheat) {
    return achieved >= 1
      ? { color: 'var(--amber)', label: 'Cheat + meta lograda' }
      : { color: 'var(--red)', label: 'Cheat sin metas' };
  }

  if (achieved === 2) return { color: 'var(--green)', label: 'Ambas metas logradas' };
  if (achieved === 1) return { color: 'var(--green-line)', label: 'Una meta lograda' };
  return { color: EMPTY, label: 'Sin metas' };
}

function physicalColor(log: DailyLog | undefined): { color: string; label: string } {
  const activities = log?.fitness_activities ?? [];
  const lifting = activities.some((a) => a.type === 'weightlifting');
  const pickup = activities.some((a) => a.type === 'basketball_pickup');

  if (lifting && pickup) return { color: 'var(--blue)', label: 'Pesas + basquet' };
  if (lifting) return { color: 'var(--green)', label: 'Pesas' };
  if (pickup) return { color: '#e08a3e', label: 'Basquet pickup' };
  return { color: EMPTY, label: 'Sin actividad' };
}

export function ContributionMap({ logs, mode, start, end }: ContributionMapProps) {
  const logsByDate = useMemo(() => {
    const map = new Map<string, DailyLog>();
    logs.forEach((log) => map.set(log.date, log));
    return map;
  }, [logs]);

  const cells = useMemo(() => {
    const gridStart = startOfWeek(start, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(end, { weekStartsOn: 1 });
    const today = startOfDay(new Date());

    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    return days.map((date): DaySquare => {
      const key = format(date, 'yyyy-MM-dd');
      const inRange =
        !isAfter(date, today) &&
        !isAfter(startOfDay(start), date) &&
        !isAfter(date, startOfDay(end));

      if (!inRange) {
        return { key, color: 'transparent', label: '', inRange: false };
      }

      const log = logsByDate.get(key);

      // Ignored (rest/paused) days are gray regardless of mode.
      if (log?.ignored) {
        return { key, color: IGNORED, label: `${format(date, 'd/M')} — Día ignorado`, inRange: true };
      }

      const { color, label } =
        mode === 'nutrition' ? nutritionColor(log) : physicalColor(log);

      return { key, color, label: `${format(date, 'd/M')} — ${label}`, inRange: true };
    });
  }, [logsByDate, mode, start, end]);

  const legend =
    mode === 'nutrition'
      ? [
          ['Completo', 'var(--green)'],
          ['Parcial', 'var(--green-line)'],
          ['Sin dato', EMPTY],
          ['Cheat', 'var(--amber)'],
          ['Fallado', 'var(--red)'],
          ['Ignorado', IGNORED],
        ]
      : [
          ['Pesas', 'var(--green)'],
          ['Basquet', '#e08a3e'],
          ['Ambos', 'var(--blue)'],
          ['Sin actividad', EMPTY],
          ['Ignorado', IGNORED],
        ];

  return (
    <div className="card heat-card">
      <div className="heat-cols">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
      <div className="heat-grid">
        {cells.map((cell) => (
          <span
            key={cell.key}
            title={cell.label}
            className="heat-cell"
            style={{ background: cell.color }}
          />
        ))}
      </div>
      <hr className="hair" style={{ margin: '14px 0' }} />
      <div className="heat-legend">
        {legend.map(([label, color]) => (
          <span key={label} className="legend-item">
            <i style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
