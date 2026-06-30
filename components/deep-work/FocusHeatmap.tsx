'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  subWeeks,
  isAfter,
  isSameDay,
  startOfDay,
  min as minDate,
  parseISO,
} from 'date-fns';
import { getAllDeepWorkSessions } from '@/lib/database';
import type { DeepWorkSession } from '@/types';

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEKS_BACK = 4; // fallback span (~5 weeks) when there are no sessions yet
const EMPTY = '#ededed';

interface DaySquare {
  key: string;
  color: string;
  label: string;
  isToday: boolean;
}

/** Color by % of the day's deep-work target that was completed. */
function pctColor(pct: number): { color: string; label: string } {
  if (pct >= 100) return { color: 'var(--green)', label: 'Meta lograda' };
  if (pct >= 80) return { color: 'var(--green-line)', label: '80–100%' };
  if (pct >= 50) return { color: 'var(--amber)', label: '50–80%' };
  return { color: 'var(--red)', label: 'Menos del 50%' };
}

const LEGEND: [string, string][] = [
  ['100%+', 'var(--green)'],
  ['80–100%', 'var(--green-line)'],
  ['50–80%', 'var(--amber)'],
  ['<50%', 'var(--red)'],
  ['Sin sesión', EMPTY],
];

export function FocusHeatmap() {
  const [sessions, setSessions] = useState<DeepWorkSession[]>([]);

  const loadSessions = useCallback(async () => {
    try {
      const data = await getAllDeepWorkSessions();
      setSessions(data);
    } catch (error) {
      console.error('Error loading focus heatmap:', error);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const cells = useMemo(() => {
    const sessionsByDate = new Map<string, DeepWorkSession>();
    sessions.forEach((s) => sessionsByDate.set(s.date, s));

    const today = startOfDay(new Date());

    // Grid starts at the week of the first recorded session; if there are none
    // yet, fall back to a few weeks back so the grid isn't empty.
    const fallbackStart = startOfWeek(subWeeks(today, WEEKS_BACK), { weekStartsOn: 1 });
    const earliestSession = sessions.length
      ? minDate(sessions.map((s) => parseISO(s.date)))
      : today;
    const firstDay = sessions.length ? minDate([earliestSession, today]) : fallbackStart;
    const gridStart = startOfWeek(firstDay, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(today, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date): DaySquare => {
      const key = format(date, 'yyyy-MM-dd');
      const isToday = isSameDay(date, today);

      if (isAfter(date, today)) {
        return { key, color: 'transparent', label: '', isToday: false };
      }

      const session = sessionsByDate.get(key);
      if (!session || session.target_minutes <= 0) {
        return { key, color: EMPTY, label: `${format(date, 'd/M')} — Sin sesión`, isToday };
      }

      const pct = (session.logged_minutes / session.target_minutes) * 100;
      const { color, label } = pctColor(pct);
      return { key, color, label: `${format(date, 'd/M')} — ${Math.round(pct)}% · ${label}`, isToday };
    });
  }, [sessions]);

  return (
    <section className="sec focus-heat">
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
              className={`heat-cell${cell.isToday ? ' heat-cell-today' : ''}`}
              style={cell.isToday ? undefined : { background: cell.color }}
            />
          ))}
        </div>
        <hr className="hair" style={{ margin: '14px 0' }} />
        <div className="heat-legend">
          {LEGEND.map(([label, color]) => (
            <span key={label} className="legend-item">
              <i style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
