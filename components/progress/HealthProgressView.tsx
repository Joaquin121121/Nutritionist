'use client';

import { useMemo, useState } from 'react';
import {
  format,
  startOfWeek,
  startOfMonth,
  startOfYear,
  startOfDay,
  subWeeks,
  subMonths,
  subDays,
  eachDayOfInterval,
} from 'date-fns';
import {
  TimeRangeSelector,
  MetricCard,
  CompoundScore,
} from '@/components/progress';
import type { TimeRange } from '@/components/progress';
import { ContributionMap } from './ContributionMap';
import type { ContributionMode } from './ContributionMap';
import { useTrackingEnabled } from '@/lib/tracking';
import type { DailyLog } from '@/types';

interface MetricsData {
  variableMeals: { count: number; total: number; percentage: number };
  fixedMeals: { count: number; total: number; percentage: number };
  weightlifting: { count: number; total: number; percentage: number };
  basketball: { count: number; total: number; percentage: number };
  cheatMeals: { count: number; total: number; percentage: number };
}

const TARGETS = {
  variableMeals: 85,
  fixedMeals: 85,
  weightlifting: 57.1,
  basketball: 57.1,
  cheatMeals: 21.4,
};

function hasAnyActivity(log: DailyLog | undefined): boolean {
  if (!log) return false;
  return (
    (log.variable_meals?.length ?? 0) > 0 ||
    Object.values(log.fixed_meals ?? {}).some(Boolean) ||
    (log.fitness_activities?.length ?? 0) > 0
  );
}

function getDateRange(range: TimeRange, today: Date, logs: DailyLog[]): { start: Date; end: Date } {
  const normalizedToday = startOfDay(today);
  const todayStr = format(normalizedToday, 'yyyy-MM-dd');
  const todayLog = logs.find(log => log.date === todayStr);
  const hasTodayActivity = hasAnyActivity(todayLog);

  const endDate = hasTodayActivity
    ? normalizedToday
    : startOfDay(subDays(normalizedToday, 1));

  switch (range) {
    case 'week':
      return { start: startOfWeek(normalizedToday, { weekStartsOn: 1 }), end: endDate };
    case 'two_weeks':
      return { start: startOfWeek(subWeeks(normalizedToday, 1), { weekStartsOn: 1 }), end: endDate };
    case 'month':
      return { start: startOfMonth(normalizedToday), end: endDate };
    case 'three_months':
      return { start: startOfMonth(subMonths(normalizedToday, 2)), end: endDate };
    case 'year':
      return { start: startOfYear(normalizedToday), end: endDate };
  }
}

function calculateMetrics(logs: DailyLog[], totalDays: number): MetricsData {
  let variableMealsCount = 0;
  logs.forEach((log) => {
    variableMealsCount += log.variable_meals?.length || 0;
  });
  const variableMealsTarget = totalDays * 2;

  let fixedMealsCount = 0;
  logs.forEach((log) => {
    if (log.fixed_meals) {
      fixedMealsCount += Object.values(log.fixed_meals).filter(Boolean).length;
    }
  });
  const fixedMealsTarget = totalDays * 5;

  const weightliftingDays = new Set<string>();
  logs.forEach((log) => {
    log.fitness_activities?.forEach((activity) => {
      if (activity.type === 'weightlifting') {
        weightliftingDays.add(log.date);
      }
    });
  });

  const basketballDays = new Set<string>();
  logs.forEach((log) => {
    log.fitness_activities?.forEach((activity) => {
      if (activity.type === 'basketball_pickup') {
        basketballDays.add(log.date);
      }
    });
  });

  let cheatMealsCount = 0;
  logs.forEach((log) => {
    cheatMealsCount += log.cheat_meals?.length || 0;
  });
  const cheatMealsTarget = totalDays * 2;

  return {
    variableMeals: {
      count: variableMealsCount,
      total: variableMealsTarget,
      percentage: variableMealsTarget > 0 ? (variableMealsCount / variableMealsTarget) * 100 : 0,
    },
    fixedMeals: {
      count: fixedMealsCount,
      total: fixedMealsTarget,
      percentage: fixedMealsTarget > 0 ? (fixedMealsCount / fixedMealsTarget) * 100 : 0,
    },
    weightlifting: {
      count: weightliftingDays.size,
      total: totalDays,
      percentage: totalDays > 0 ? (weightliftingDays.size / totalDays) * 100 : 0,
    },
    basketball: {
      count: basketballDays.size,
      total: totalDays,
      percentage: totalDays > 0 ? (basketballDays.size / totalDays) * 100 : 0,
    },
    cheatMeals: {
      count: cheatMealsCount,
      total: cheatMealsTarget,
      percentage: cheatMealsTarget > 0 ? (cheatMealsCount / cheatMealsTarget) * 100 : 0,
    },
  };
}

function calculateCompoundScore(metrics: MetricsData): number {
  const variableMealsScore = Math.min(100, (metrics.variableMeals.percentage / TARGETS.variableMeals) * 100);
  const fixedMealsScore = Math.min(100, (metrics.fixedMeals.percentage / TARGETS.fixedMeals) * 100);
  const weightliftingScore = Math.min(100, (metrics.weightlifting.percentage / TARGETS.weightlifting) * 100);
  const basketballScore = Math.min(100, (metrics.basketball.percentage / TARGETS.basketball) * 100);
  const cheatMealsScore = Math.max(0, 100 - (metrics.cheatMeals.percentage / TARGETS.cheatMeals) * 50);

  const compoundScore =
    variableMealsScore * 0.25 +
    fixedMealsScore * 0.25 +
    weightliftingScore * 0.20 +
    basketballScore * 0.15 +
    cheatMealsScore * 0.15;

  return compoundScore;
}

interface HealthProgressViewProps {
  logs: DailyLog[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function HealthProgressView({ logs, timeRange, onTimeRangeChange }: HealthProgressViewProps) {
  const today = useMemo(() => new Date(), []);
  const [trackingEnabled, setTrackingEnabled] = useTrackingEnabled();
  const [dataMode, setDataMode] = useState<ContributionMode>('nutrition');

  const { metrics, compoundScore, range } = useMemo(() => {
    const { start, end } = getDateRange(timeRange, today, logs);
    const daysInRange = eachDayOfInterval({ start, end }).length;

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    const filtered = logs.filter((log) => {
      return log.date >= startStr && log.date <= endStr;
    });

    const metricsData = calculateMetrics(filtered, daysInRange);
    const score = calculateCompoundScore(metricsData);

    return {
      metrics: metricsData,
      compoundScore: score,
      range: { start, end },
    };
  }, [logs, timeRange, today]);

  return (
    <div className="fade-in">
      <div className="screen-title">
        <span className="eyebrow">Tu evolución</span>
        <h2>Progreso</h2>
      </div>

      {/* Tracking switch */}
      <div className="track-row card">
        <div>
          <strong>Seguimiento</strong>
          <span>{trackingEnabled ? 'Registrando tu día' : 'En pausa'}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={trackingEnabled}
          onClick={() => setTrackingEnabled(!trackingEnabled)}
          className={`switch${trackingEnabled ? ' on' : ''}`}
        >
          <i />
        </button>
      </div>

      <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />

      <CompoundScore score={compoundScore} />

      {/* Data mode selector */}
      <div className="seg seg-mode">
        <button
          type="button"
          onClick={() => setDataMode('nutrition')}
          className={dataMode === 'nutrition' ? 'active' : ''}
        >
          🥗 Nutrición
        </button>
        <button
          type="button"
          onClick={() => setDataMode('physical')}
          className={dataMode === 'physical' ? 'active' : ''}
        >
          🏋️ Actividad física
        </button>
      </div>

      {/* Horizontal metric carousel */}
      <div className="metric-scroll">
        {dataMode === 'nutrition' ? (
          <>
            <MetricCard
              title="Comidas variables"
              emoji="🥗"
              percentage={metrics.variableMeals.percentage}
              target={TARGETS.variableMeals}
              numerator={metrics.variableMeals.count}
              denominator={metrics.variableMeals.total}
              unit="meals"
            />
            <MetricCard
              title="Comidas fijas"
              emoji="🍳"
              percentage={metrics.fixedMeals.percentage}
              target={TARGETS.fixedMeals}
              numerator={metrics.fixedMeals.count}
              denominator={metrics.fixedMeals.total}
              unit="meals"
            />
            <MetricCard
              title="Cheat meals"
              emoji="🍰"
              percentage={metrics.cheatMeals.percentage}
              target={TARGETS.cheatMeals}
              numerator={metrics.cheatMeals.count}
              denominator={metrics.cheatMeals.total}
              unit="meals"
              isInverse
            />
          </>
        ) : (
          <>
            <MetricCard
              title="Pesas"
              emoji="🏋️"
              percentage={metrics.weightlifting.percentage}
              target={TARGETS.weightlifting}
              numerator={metrics.weightlifting.count}
              denominator={metrics.weightlifting.total}
              unit="days"
            />
            <MetricCard
              title="Basquet Pickup"
              emoji="🏀"
              percentage={metrics.basketball.percentage}
              target={TARGETS.basketball}
              numerator={metrics.basketball.count}
              denominator={metrics.basketball.total}
              unit="days"
            />
          </>
        )}
        <div className="metric-end" />
      </div>

      {/* GitHub-style contribution map */}
      <section className="sec">
        <div className="sec-head">
          <h3>Constancia</h3>
          <span className="sec-count">Por día</span>
        </div>
        <ContributionMap logs={logs} mode={dataMode} start={range.start} end={range.end} />
      </section>
    </div>
  );
}
