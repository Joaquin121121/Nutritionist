'use client';

import { useMemo } from 'react';
import { format, startOfWeek, startOfMonth, subDays } from 'date-fns';
import { Trophy, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { CIRCUITS } from '@/data/circuits';
import type { BasketballSession } from '@/types';

interface BasketballStatsViewProps {
  sessions: BasketballSession[];
}

export function BasketballStatsView({ sessions }: BasketballStatsViewProps) {
  const bestScore = useMemo(() => {
    if (sessions.length === 0) return null;
    return sessions.reduce((max, s) => (s.score > max.score ? s : max), sessions[0]);
  }, [sessions]);

  const periodAvg = (start: Date, end: Date, prevStart: Date, prevEnd: Date) => {
    const inRange = (d: Date, a: Date, b: Date) => d >= a && d <= b;
    const cur = sessions.filter((s) => inRange(new Date(s.date), start, end));
    const prev = sessions.filter((s) => inRange(new Date(s.date), prevStart, prevEnd));
    const avg = (arr: BasketballSession[]) =>
      arr.length ? arr.reduce((sum, s) => sum + s.score, 0) / arr.length : 0;
    const curAvg = avg(cur);
    const prevAvg = avg(prev);
    const improvement = prevAvg > 0 ? ((curAvg - prevAvg) / prevAvg) * 100 : 0;
    return { average: curAvg, improvement, sessionsCount: cur.length };
  };

  const weeklyStats = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    return periodAvg(weekStart, today, subDays(weekStart, 7), subDays(weekStart, 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  const monthlyStats = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const lastMonthStart = startOfMonth(subDays(monthStart, 1));
    return periodAvg(monthStart, today, lastMonthStart, subDays(monthStart, 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  // Aggregate per-circuit makes/attempts across all sessions.
  const circuitStats = useMemo(() => {
    const agg = new Map<string, { name: string; emoji: string; makes: number; attempts: number }>();
    for (const c of CIRCUITS) agg.set(c.id, { name: c.name, emoji: c.emoji, makes: 0, attempts: 0 });
    for (const session of sessions) {
      for (const cr of session.circuits ?? []) {
        const a = agg.get(cr.id);
        if (a) {
          a.makes += cr.makes;
          a.attempts += cr.attempts;
        }
      }
    }
    return [...agg.values()]
      .filter((a) => a.attempts > 0)
      .map((a) => ({ ...a, pct: (a.makes / a.attempts) * 100 }))
      .sort((a, b) => b.pct - a.pct);
  }, [sessions]);

  const getScoreColor = (pct: number): string => {
    if (pct >= 70) return 'text-primary-500';
    if (pct >= 50) return 'text-accent-500';
    return 'text-danger-500';
  };
  const getScoreBg = (pct: number): string => {
    if (pct >= 70) return 'bg-primary-500';
    if (pct >= 50) return 'bg-accent-500';
    return 'bg-danger-500';
  };

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-800">Estadisticas de Tiro</h1>
            <p className="text-sm text-neutral-500">Analisis de tus sesiones</p>
          </div>
        </div>
        <div className="card p-8 text-center">
          <Target className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">Sin sesiones registradas</h2>
          <p className="text-neutral-500">Completa tu primera sesion para ver tus estadisticas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Estadisticas de Tiro</h1>
          <p className="text-sm text-neutral-500">
            {sessions.length} sesion{sessions.length !== 1 ? 'es' : ''} registrada
            {sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {bestScore && (
        <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-6 h-6" />
                <span className="text-sm font-medium text-accent-100">Mejor Score</span>
              </div>
              <span className="text-4xl font-bold">{Math.round(bestScore.score)}%</span>
              <p className="text-accent-100 text-sm mt-1">
                {format(new Date(bestScore.date), 'd/M/yyyy')} • {bestScore.total_makes}/
                {bestScore.total_attempts}
              </p>
            </div>
            <div className="text-6xl opacity-20">🏆</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Esta semana', s: weeklyStats },
          { label: 'Este mes', s: monthlyStats },
        ].map(({ label, s }) => (
          <div key={label} className="card p-4">
            <p className="text-sm text-neutral-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${getScoreColor(s.average)}`}>
              {s.sessionsCount > 0 ? `${Math.round(s.average)}%` : '-'}
            </p>
            {s.improvement !== 0 && s.sessionsCount > 0 && (
              <div
                className={`flex items-center gap-1 mt-1 text-sm ${
                  s.improvement > 0 ? 'text-primary-500' : 'text-danger-500'
                }`}
              >
                {s.improvement > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(Math.round(s.improvement))}%</span>
              </div>
            )}
            <p className="text-xs text-neutral-400 mt-1">
              {s.sessionsCount} sesion{s.sessionsCount !== 1 ? 'es' : ''}
            </p>
          </div>
        ))}
      </div>

      {circuitStats.length > 0 && (
        <div className="card p-4">
          <h2 className="font-semibold text-neutral-800 mb-4">Ranking por Circuito</h2>
          <div className="space-y-3">
            {circuitStats.map((c, index) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="w-6 text-center text-sm font-medium text-neutral-500">
                  #{index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-700">
                      {c.emoji} {c.name}
                    </span>
                    <span className={`text-sm font-bold ${getScoreColor(c.pct)}`}>
                      {Math.round(c.pct)}%
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getScoreBg(c.pct)} transition-all duration-500`}
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {c.makes}/{c.attempts}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4">
        <h2 className="font-semibold text-neutral-800 mb-4">Sesiones Recientes</h2>
        <div className="space-y-2">
          {sessions.slice(0, 5).map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
            >
              <span className="text-sm text-neutral-600">
                {format(new Date(session.date), 'd/M/yyyy')}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-500">
                  {session.total_makes}/{session.total_attempts}
                </span>
                <span className={`text-sm font-bold ${getScoreColor(session.score)}`}>
                  {Math.round(session.score)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
