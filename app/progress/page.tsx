'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  format,
  startOfWeek,
  startOfMonth,
  startOfYear,
  startOfDay,
  subWeeks,
  subMonths,
  eachDayOfInterval,
  endOfYear,
} from 'date-fns';
import {
  TimeRangeSelector,
  MetricCard,
  CompoundScore,
} from '@/components/progress';
import type { TimeRange } from '@/components/progress';
import { getDailyLogsRange } from '@/lib/database';
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
  weightlifting: 42,
  basketball: 28,
  cheatMeals: 21.4,
};

function getDateRange(range: TimeRange, today: Date): { start: Date; end: Date } {
  const normalizedToday = startOfDay(today);
  switch (range) {
    case 'week':
      return { start: startOfWeek(normalizedToday, { weekStartsOn: 1 }), end: normalizedToday };
    case 'two_weeks':
      return { start: startOfWeek(subWeeks(normalizedToday, 1), { weekStartsOn: 1 }), end: normalizedToday };
    case 'month':
      return { start: startOfMonth(normalizedToday), end: normalizedToday };
    case 'three_months':
      return { start: startOfMonth(subMonths(normalizedToday, 2)), end: normalizedToday };
    case 'year':
      return { start: startOfYear(normalizedToday), end: normalizedToday };
  }
}

function calculateMetrics(logs: DailyLog[], totalDays: number): MetricsData {
  // Create a map of logs by date
  const logsByDate = new Map<string, DailyLog>();
  logs.forEach((log) => logsByDate.set(log.date, log));

  // Variable meals: count all variable meals logged
  let variableMealsCount = 0;
  logs.forEach((log) => {
    variableMealsCount += log.variable_meals?.length || 0;
  });
  const variableMealsTarget = totalDays * 2;

  // Fixed meals: count completed fixed meals (5 per day)
  let fixedMealsCount = 0;
  logs.forEach((log) => {
    if (log.fixed_meals) {
      fixedMealsCount += Object.values(log.fixed_meals).filter(Boolean).length;
    }
  });
  const fixedMealsTarget = totalDays * 5;

  // Weightlifting: count unique days with weightlifting
  const weightliftingDays = new Set<string>();
  logs.forEach((log) => {
    log.fitness_activities?.forEach((activity) => {
      if (activity.type === 'weightlifting') {
        weightliftingDays.add(log.date);
      }
    });
  });

  // Basketball: count unique days with basketball training
  const basketballDays = new Set<string>();
  logs.forEach((log) => {
    log.fitness_activities?.forEach((activity) => {
      if (activity.type === 'basketball_training') {
        basketballDays.add(log.date);
      }
    });
  });

  // Cheat meals: count all cheat meals
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
  // Calculate individual scores (0-100)
  const variableMealsScore = Math.min(100, (metrics.variableMeals.percentage / TARGETS.variableMeals) * 100);
  const fixedMealsScore = Math.min(100, (metrics.fixedMeals.percentage / TARGETS.fixedMeals) * 100);
  const weightliftingScore = Math.min(100, (metrics.weightlifting.percentage / TARGETS.weightlifting) * 100);
  const basketballScore = Math.min(100, (metrics.basketball.percentage / TARGETS.basketball) * 100);

  // Cheat meals inverse scoring: 0% cheat = 100 score, at target = 50 score
  const cheatMealsScore = Math.max(0, 100 - (metrics.cheatMeals.percentage / TARGETS.cheatMeals) * 50);

  // Weighted average
  const compoundScore =
    variableMealsScore * 0.25 +
    fixedMealsScore * 0.25 +
    weightliftingScore * 0.20 +
    basketballScore * 0.15 +
    cheatMealsScore * 0.15;

  return compoundScore;
}

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all logs for the year (to cover all time ranges)
      const yearStart = format(startOfYear(today), 'yyyy-MM-dd');
      const yearEnd = format(endOfYear(today), 'yyyy-MM-dd');
      const logsData = await getDailyLogsRange(yearStart, yearEnd);
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { filteredLogs, totalDays, metrics, compoundScore } = useMemo(() => {
    const { start, end } = getDateRange(timeRange, today);
    const daysInRange = eachDayOfInterval({ start, end }).length;

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    const filtered = logs.filter((log) => {
      return log.date >= startStr && log.date <= endStr;
    });

    const metricsData = calculateMetrics(filtered, daysInRange);
    const score = calculateCompoundScore(metricsData);

    return {
      filteredLogs: filtered,
      totalDays: daysInRange,
      metrics: metricsData,
      compoundScore: score,
    };
  }, [logs, timeRange, today]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-neutral-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

      <CompoundScore score={compoundScore} />

      <div className="space-y-3">
        <MetricCard
          title="Variable Meals"
          emoji="🍽️"
          percentage={metrics.variableMeals.percentage}
          target={TARGETS.variableMeals}
          numerator={metrics.variableMeals.count}
          denominator={metrics.variableMeals.total}
          unit="meals"
        />
        <MetricCard
          title="Fixed Meals"
          emoji="🥗"
          percentage={metrics.fixedMeals.percentage}
          target={TARGETS.fixedMeals}
          numerator={metrics.fixedMeals.count}
          denominator={metrics.fixedMeals.total}
          unit="meals"
        />
        <MetricCard
          title="Weightlifting"
          emoji="🏋️"
          percentage={metrics.weightlifting.percentage}
          target={TARGETS.weightlifting}
          numerator={metrics.weightlifting.count}
          denominator={metrics.weightlifting.total}
          unit="days"
        />
        <MetricCard
          title="Basketball"
          emoji="🏀"
          percentage={metrics.basketball.percentage}
          target={TARGETS.basketball}
          numerator={metrics.basketball.count}
          denominator={metrics.basketball.total}
          unit="days"
        />
        <MetricCard
          title="Cheat Meals"
          emoji="🍕"
          percentage={metrics.cheatMeals.percentage}
          target={TARGETS.cheatMeals}
          numerator={metrics.cheatMeals.count}
          denominator={metrics.cheatMeals.total}
          unit="meals"
          isInverse
        />
      </div>
    </div>
  );
}
