'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { History, TrendingUp, Target, Calendar } from 'lucide-react';
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
      const periodConfig = PERIODS.find(p => p.value === period)!;
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

  // Calculate stats
  const totalLoggedMinutes = sessions.reduce((sum, s) => sum + s.logged_minutes, 0);
  const totalTargetMinutes = sessions.reduce((sum, s) => sum + s.target_minutes, 0);
  const overallPercentage = totalTargetMinutes > 0
    ? Math.round((totalLoggedMinutes / totalTargetMinutes) * 100)
    : 0;
  const daysWithTarget = sessions.length;
  const daysReachedTarget = sessions.filter(
    s => (s.logged_minutes / s.target_minutes) * 100 >= TARGET_PERCENTAGE
  ).length;
  const successRate = daysWithTarget > 0
    ? Math.round((daysReachedTarget / daysWithTarget) * 100)
    : 0;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700">
      {/* Header with period selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Historial
          </span>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                period === p.value
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-neutral-500 text-sm">Cargando...</div>
      ) : sessions.length === 0 ? (
        <div className="py-8 text-center text-neutral-500 text-sm">
          Sin datos en este periodo
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-700/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
              </div>
              <div className={`text-lg font-bold ${
                overallPercentage >= TARGET_PERCENTAGE
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-neutral-700 dark:text-neutral-200'
              }`}>
                {overallPercentage}%
              </div>
              <div className="text-xs text-neutral-500">promedio</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-700/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="w-3.5 h-3.5 text-green-500" />
              </div>
              <div className="text-lg font-bold text-neutral-700 dark:text-neutral-200">
                {daysReachedTarget}/{daysWithTarget}
              </div>
              <div className="text-xs text-neutral-500">dias 80%+</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-700/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-lg font-bold text-neutral-700 dark:text-neutral-200">
                {formatTime(totalLoggedMinutes)}
              </div>
              <div className="text-xs text-neutral-500">total</div>
            </div>
          </div>

          {/* Session list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sessions.map((session) => {
              const pct = Math.round((session.logged_minutes / session.target_minutes) * 100);
              const reachedTarget = pct >= TARGET_PERCENTAGE;
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-700/50"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      reachedTarget ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'
                    }`} />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {format(new Date(session.date), 'EEE d MMM', { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral-500">
                      {formatTime(session.logged_minutes)} / {formatTime(session.target_minutes)}
                    </span>
                    <span className={`text-sm font-medium min-w-[3rem] text-right ${
                      reachedTarget
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}>
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
