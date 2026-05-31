'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { getDeepWorkSessionsRange } from '@/lib/database';
import type { DeepWorkSession } from '@/types';

type Period = '1w' | '2w' | '1m' | '3m';

const PERIODS: { value: Period; label: string; days: number }[] = [
  { value: '1w', label: '1 sem', days: 7 },
  { value: '2w', label: '2 sem', days: 14 },
  { value: '1m', label: '1 mes', days: 30 },
  { value: '3m', label: '3 mes', days: 90 },
];

const TARGET_PERCENTAGE = 80;

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function DeepWorkHistory() {
  const [period, setPeriod] = useState<Period>('1w');
  const [sessions, setSessions] = useState<DeepWorkSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const periodConfig = PERIODS.find((p) => p.value === period)!;
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), periodConfig.days - 1), 'yyyy-MM-dd');
      const data = await getDeepWorkSessionsRange(startDate, endDate);
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const totalLoggedMinutes = sessions.reduce((sum, s) => sum + s.logged_minutes, 0);
  const totalTargetMinutes = sessions.reduce((sum, s) => sum + s.target_minutes, 0);
  const overallPercentage =
    totalTargetMinutes > 0 ? Math.round((totalLoggedMinutes / totalTargetMinutes) * 100) : 0;
  const daysWithTarget = sessions.length;
  const daysReachedTarget = sessions.filter(
    (s) => (s.logged_minutes / s.target_minutes) * 100 >= TARGET_PERCENTAGE
  ).length;

  return (
    <section className="sec">
      <div className="sec-head">
        <h3>Historial</h3>
        <span className="sec-count">{daysWithTarget} días</span>
      </div>

      <div className="seg seg-range" style={{ marginBottom: 14 }}>
        {PERIODS.map((p) => (
          <button
            key={p.value}
            className={period === p.value ? 'active' : ''}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Cargando...
        </div>
      ) : sessions.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Sin datos en este periodo
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-tile">
              <b data-good={overallPercentage >= TARGET_PERCENTAGE}>{overallPercentage}%</b>
              <span>promedio</span>
            </div>
            <div className="stat-tile">
              <b>{daysReachedTarget}/{daysWithTarget}</b>
              <span>días 80%+</span>
            </div>
            <div className="stat-tile">
              <b>{formatTime(totalLoggedMinutes)}</b>
              <span>total</span>
            </div>
          </div>

          <div className="card list-card" style={{ marginTop: 11 }}>
            {sessions.map((session, i) => {
              const pct = Math.round((session.logged_minutes / session.target_minutes) * 100);
              const reached = pct >= TARGET_PERCENTAGE;
              return (
                <div className="hist-row" key={session.id} data-last={i === sessions.length - 1}>
                  <span className="hist-ico"><Clock width={15} height={15} strokeWidth={2} /></span>
                  <span className="hist-name" style={{ textTransform: 'capitalize' }}>
                    {format(new Date(session.date), 'EEE d MMM', { locale: es })}
                  </span>
                  <span className="hist-when" style={{ width: 'auto', marginRight: 10 }}>
                    {formatTime(session.logged_minutes)}/{formatTime(session.target_minutes)}
                  </span>
                  <span className="hist-dur" style={{ color: reached ? 'var(--green)' : 'var(--muted)' }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
