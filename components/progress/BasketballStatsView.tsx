'use client';

import { useMemo } from 'react';
import { format, startOfWeek, startOfMonth, subDays } from 'date-fns';
import { Trophy, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { SHOT_TYPES } from '@/data/shots';
import type { BasketballSession, ShotData, ShotStats } from '@/types';

interface BasketballStatsViewProps {
  sessions: BasketballSession[];
}

export function BasketballStatsView({ sessions }: BasketballStatsViewProps) {
  // Calculate best score
  const bestScore = useMemo(() => {
    if (sessions.length === 0) return null;
    const best = sessions.reduce((max, session) =>
      session.score > max.score ? session : max, sessions[0]);
    return best;
  }, [sessions]);

  // Calculate weekly average and improvement
  const weeklyStats = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const lastWeekStart = subDays(weekStart, 7);

    const thisWeekSessions = sessions.filter(s => {
      const date = new Date(s.date);
      return date >= weekStart && date <= today;
    });

    const lastWeekSessions = sessions.filter(s => {
      const date = new Date(s.date);
      return date >= lastWeekStart && date < weekStart;
    });

    const thisWeekAvg = thisWeekSessions.length > 0
      ? thisWeekSessions.reduce((sum, s) => sum + s.score, 0) / thisWeekSessions.length
      : 0;

    const lastWeekAvg = lastWeekSessions.length > 0
      ? lastWeekSessions.reduce((sum, s) => sum + s.score, 0) / lastWeekSessions.length
      : 0;

    const improvement = lastWeekAvg > 0 ? ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100 : 0;

    return {
      average: thisWeekAvg,
      improvement,
      sessionsCount: thisWeekSessions.length,
    };
  }, [sessions]);

  // Calculate monthly average and improvement
  const monthlyStats = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const lastMonthStart = startOfMonth(subDays(monthStart, 1));

    const thisMonthSessions = sessions.filter(s => {
      const date = new Date(s.date);
      return date >= monthStart && date <= today;
    });

    const lastMonthSessions = sessions.filter(s => {
      const date = new Date(s.date);
      return date >= lastMonthStart && date < monthStart;
    });

    const thisMonthAvg = thisMonthSessions.length > 0
      ? thisMonthSessions.reduce((sum, s) => sum + s.score, 0) / thisMonthSessions.length
      : 0;

    const lastMonthAvg = lastMonthSessions.length > 0
      ? lastMonthSessions.reduce((sum, s) => sum + s.score, 0) / lastMonthSessions.length
      : 0;

    const improvement = lastMonthAvg > 0 ? ((thisMonthAvg - lastMonthAvg) / lastMonthAvg) * 100 : 0;

    return {
      average: thisMonthAvg,
      improvement,
      sessionsCount: thisMonthSessions.length,
    };
  }, [sessions]);

  // Calculate shot stats (strongest to weakest)
  const shotStats = useMemo((): ShotStats[] => {
    if (sessions.length === 0) return [];

    const stats: Record<keyof ShotData, { totalMakes: number; totalAttempts: number; sessionsCount: number }> = {} as never;

    SHOT_TYPES.forEach(shot => {
      stats[shot.id] = { totalMakes: 0, totalAttempts: 0, sessionsCount: 0 };
    });

    sessions.forEach(session => {
      SHOT_TYPES.forEach(shot => {
        const makes = session.shots[shot.id];
        if (makes !== undefined && makes > 0) {
          stats[shot.id].totalMakes += makes;
          stats[shot.id].totalAttempts += shot.attempts;
          stats[shot.id].sessionsCount += 1;
        }
      });
    });

    return SHOT_TYPES
      .map(shot => {
        const s = stats[shot.id];
        const percentage = s.totalAttempts > 0 ? (s.totalMakes / s.totalAttempts) * 100 : 0;
        return {
          id: shot.id,
          name: shot.name,
          totalMakes: s.totalMakes,
          totalAttempts: s.totalAttempts,
          percentage,
          sessionsCount: s.sessionsCount,
          averagePerSession: s.sessionsCount > 0 ? s.totalMakes / s.sessionsCount : 0,
        };
      })
      .filter(s => s.sessionsCount > 0)
      .sort((a, b) => b.percentage - a.percentage);
  }, [sessions]);

  // Calculate shot progress (most improved to least)
  const shotProgress = useMemo(() => {
    if (sessions.length < 2) return [];

    const today = new Date();
    const twoWeeksAgo = subDays(today, 14);
    const fourWeeksAgo = subDays(today, 28);

    const recentSessions = sessions.filter(s => {
      const date = new Date(s.date);
      return date >= twoWeeksAgo && date <= today;
    });

    const olderSessions = sessions.filter(s => {
      const date = new Date(s.date);
      return date >= fourWeeksAgo && date < twoWeeksAgo;
    });

    if (recentSessions.length === 0 || olderSessions.length === 0) return [];

    const progress: { id: keyof ShotData; name: string; emoji: string; change: number; recentPct: number; olderPct: number }[] = [];

    SHOT_TYPES.forEach(shot => {
      let recentMakes = 0;
      let recentAttempts = 0;
      let olderMakes = 0;
      let olderAttempts = 0;

      recentSessions.forEach(s => {
        const makes = s.shots[shot.id];
        if (makes !== undefined && makes > 0) {
          recentMakes += makes;
          recentAttempts += shot.attempts;
        }
      });

      olderSessions.forEach(s => {
        const makes = s.shots[shot.id];
        if (makes !== undefined && makes > 0) {
          olderMakes += makes;
          olderAttempts += shot.attempts;
        }
      });

      if (recentAttempts > 0 && olderAttempts > 0) {
        const recentPct = (recentMakes / recentAttempts) * 100;
        const olderPct = (olderMakes / olderAttempts) * 100;
        const change = recentPct - olderPct;

        progress.push({
          id: shot.id,
          name: shot.name,
          emoji: shot.emoji,
          change,
          recentPct,
          olderPct,
        });
      }
    });

    return progress.sort((a, b) => b.change - a.change);
  }, [sessions]);

  const getScoreColor = (pct: number): string => {
    if (pct >= 70) return 'text-primary-500';
    if (pct >= 50) return 'text-accent-500';
    return 'text-danger-500';
  };

  const getScoreBg = (pct: number): string => {
    if (pct >= 70) return 'bg-primary-100 dark:bg-primary-900/30';
    if (pct >= 50) return 'bg-accent-100 dark:bg-accent-900/30';
    return 'bg-danger-100 dark:bg-danger-900/30';
  };

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
              Estadisticas de Tiro
            </h1>
            <p className="text-sm text-neutral-500">
              Analisis de tus sesiones
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-8 border border-neutral-200 dark:border-neutral-700 text-center">
          <Target className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            Sin sesiones registradas
          </h2>
          <p className="text-neutral-500">
            Completa tu primera sesion de entrenamiento para ver tus estadisticas aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
            Estadisticas de Tiro
          </h1>
          <p className="text-sm text-neutral-500">
            {sessions.length} sesion{sessions.length !== 1 ? 'es' : ''} registrada{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Best Score */}
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
                {format(new Date(bestScore.date), 'd/M/yyyy')} • {bestScore.total_makes}/{bestScore.total_attempts}
              </p>
            </div>
            <div className="text-6xl opacity-20">
              🏆
            </div>
          </div>
        </div>
      )}

      {/* Weekly & Monthly Averages */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-500 mb-1">Esta semana</p>
          <p className={`text-2xl font-bold ${getScoreColor(weeklyStats.average)}`}>
            {weeklyStats.sessionsCount > 0 ? `${Math.round(weeklyStats.average)}%` : '-'}
          </p>
          {weeklyStats.improvement !== 0 && weeklyStats.sessionsCount > 0 && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${weeklyStats.improvement > 0 ? 'text-primary-500' : 'text-danger-500'}`}>
              {weeklyStats.improvement > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(Math.round(weeklyStats.improvement))}%</span>
            </div>
          )}
          <p className="text-xs text-neutral-400 mt-1">
            {weeklyStats.sessionsCount} sesion{weeklyStats.sessionsCount !== 1 ? 'es' : ''}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-500 mb-1">Este mes</p>
          <p className={`text-2xl font-bold ${getScoreColor(monthlyStats.average)}`}>
            {monthlyStats.sessionsCount > 0 ? `${Math.round(monthlyStats.average)}%` : '-'}
          </p>
          {monthlyStats.improvement !== 0 && monthlyStats.sessionsCount > 0 && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${monthlyStats.improvement > 0 ? 'text-primary-500' : 'text-danger-500'}`}>
              {monthlyStats.improvement > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(Math.round(monthlyStats.improvement))}%</span>
            </div>
          )}
          <p className="text-xs text-neutral-400 mt-1">
            {monthlyStats.sessionsCount} sesion{monthlyStats.sessionsCount !== 1 ? 'es' : ''}
          </p>
        </div>
      </div>

      {/* Shot Ranking (Strongest to Weakest) */}
      {shotStats.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
          <h2 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
            Ranking de Tiros
          </h2>
          <div className="space-y-3">
            {shotStats.map((shot, index) => (
              <div key={shot.id} className="flex items-center gap-3">
                <span className="w-6 text-center text-sm font-medium text-neutral-500">
                  #{index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {shot.name}
                    </span>
                    <span className={`text-sm font-bold ${getScoreColor(shot.percentage)}`}>
                      {Math.round(shot.percentage)}%
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getScoreBg(shot.percentage)} transition-all duration-500`}
                      style={{ width: `${shot.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {shot.totalMakes}/{shot.totalAttempts} • {shot.sessionsCount} sesion{shot.sessionsCount !== 1 ? 'es' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress (Most to Least Improved) */}
      {shotProgress.length > 0 && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
          <h2 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
            Progreso (ultimas 2 semanas)
          </h2>
          <div className="space-y-3">
            {shotProgress.map((shot) => (
              <div key={shot.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{shot.emoji}</span>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {shot.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500">
                    {Math.round(shot.recentPct)}%
                  </span>
                  <div className={`flex items-center gap-1 text-sm ${shot.change > 0 ? 'text-primary-500' : shot.change < 0 ? 'text-danger-500' : 'text-neutral-400'}`}>
                    {shot.change > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : shot.change < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : null}
                    <span>
                      {shot.change > 0 ? '+' : ''}{Math.round(shot.change)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
        <h2 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
          Sesiones Recientes
        </h2>
        <div className="space-y-2">
          {sessions.slice(0, 5).map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0"
            >
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
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
