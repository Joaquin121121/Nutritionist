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
  min as minDate,
  parseISO,
} from 'date-fns';
import { getAllDeepWorkSessions, getAllDayNotes, saveDayNote } from '@/lib/database';
import type { DeepWorkSession } from '@/types';
import { DayNoteModal } from './DayNoteModal';

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEKS_BACK = 4; // fallback span (~5 weeks) when there are no sessions yet
const EMPTY = '#ededed';

interface DaySquare {
  key: string;
  color: string;
  isToday: boolean;
  /** Tooltip lines; null for future days (no tooltip, no notes). */
  tip: { title: string; lines: string[]; note?: string } | null;
}

/** Formats minutes as e.g. "3h", "2h 15m", "45m". */
function fmtMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
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

interface FocusHeatmapProps {
  /** Current focus day (`yyyy-MM-dd`); later days render as future. */
  today: string;
  /** Change this to force a re-read after minutes are logged. */
  refreshKey?: number;
}

export function FocusHeatmap({ today: todayKey, refreshKey = 0 }: FocusHeatmapProps) {
  const [sessions, setSessions] = useState<DeepWorkSession[]>([]);
  // Day notes keyed by `yyyy-MM-dd`.
  const [notes, setNotes] = useState<Map<string, string>>(new Map());
  const [editing, setEditing] = useState<{ key: string; title: string } | null>(null);
  const [savingNote, setSavingNote] = useState(false);

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
  }, [loadSessions, refreshKey]);

  // Loaded separately so a notes failure never blanks the heatmap itself.
  useEffect(() => {
    getAllDayNotes()
      .then((data) => setNotes(new Map(data.map((n) => [n.date, n.note]))))
      .catch((error) => console.error('Error loading day notes:', error));
  }, []);

  const handleSaveNote = async (note: string) => {
    if (!editing || savingNote) return;
    const { key } = editing;
    setSavingNote(true);
    try {
      const saved = await saveDayNote(key, note);
      setNotes((prev) => {
        const next = new Map(prev);
        if (saved) next.set(key, saved.note);
        else next.delete(key);
        return next;
      });
      setEditing(null);
    } catch (error) {
      console.error('Error saving day note:', error);
    } finally {
      setSavingNote(false);
    }
  };

  const cells = useMemo(() => {
    const sessionsByDate = new Map<string, DeepWorkSession>();
    sessions.forEach((s) => sessionsByDate.set(s.date, s));

    const today = parseISO(todayKey);

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
        return { key, color: 'transparent', isToday: false, tip: null };
      }

      const title = format(date, 'd/M/yyyy');
      const note = notes.get(key);
      const session = sessionsByDate.get(key);
      if (!session || session.target_minutes <= 0) {
        return { key, color: EMPTY, isToday, tip: { title, lines: ['Sin sesión'], note } };
      }

      const pct = (session.logged_minutes / session.target_minutes) * 100;
      const { color } = pctColor(pct);
      return {
        key,
        color,
        isToday,
        tip: {
          title,
          lines: [
            `Meta: ${fmtMinutes(session.target_minutes)}`,
            `Foco: ${fmtMinutes(session.logged_minutes)}`,
            `Completado: ${Math.round(pct)}%`,
          ],
          note,
        },
      };
    });
  }, [sessions, notes, todayKey]);

  return (
    <section className="sec focus-heat">
      <div className="card heat-card">
        <div className="heat-cols">
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
        <div className="heat-grid">
          {cells.map((cell, index) => {
            // Anchor edge-column tooltips inward so they don't overflow the card.
            const col = index % 7;
            const align = col <= 1 ? ' heat-tip-left' : col >= 5 ? ' heat-tip-right' : '';
            const tip = cell.tip;
            return (
              <span
                key={cell.key}
                tabIndex={tip ? 0 : undefined}
                className={`heat-cell${cell.isToday ? ' heat-cell-today' : ''}${tip?.note ? ' heat-cell-noted' : ''}`}
                style={cell.isToday ? undefined : { background: cell.color }}
                onContextMenu={
                  tip
                    ? (e) => {
                        e.preventDefault();
                        setEditing({ key: cell.key, title: tip.title });
                      }
                    : undefined
                }
              >
                {tip && (
                  <span
                    className={`heat-tip${align}${tip.note ? ' heat-tip-has-note' : ''}`}
                    role="tooltip"
                  >
                    <strong>{tip.title}</strong>
                    {tip.lines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                    {tip.note && <span className="heat-tip-note">{tip.note}</span>}
                  </span>
                )}
              </span>
            );
          })}
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
        <p className="heat-hint">Clic derecho en un día para agregar una nota.</p>
      </div>

      <DayNoteModal
        key={editing?.key ?? 'closed'}
        date={editing?.key ?? null}
        title={editing?.title ?? ''}
        initialNote={editing ? notes.get(editing.key) ?? '' : ''}
        saving={savingNote}
        onClose={() => setEditing(null)}
        onSave={handleSaveNote}
      />
    </section>
  );
}
