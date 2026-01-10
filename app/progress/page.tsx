'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  eachDayOfInterval,
  isWeekend,
  getDay,
} from 'date-fns';
import {
  StreakDisplay,
  StatsCard,
  CalendarView,
  WeeklyGoals,
} from '@/components/progress';
import {
  getDailyLogsRange,
  getStreakData,
  updateStreakData,
  calculateStats,
  calculateFitnessStats,
  isCleanDay,
  hasFitnessActivity,
} from '@/lib/database';
import type { DailyLog, DayStatus, StreakData } from '@/types';

export default function ProgressPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load logs for the entire year
      const yearStart = format(startOfYear(today), 'yyyy-MM-dd');
      const yearEnd = format(endOfYear(today), 'yyyy-MM-dd');
      const [logsData, streakData] = await Promise.all([
        getDailyLogsRange(yearStart, yearEnd),
        getStreakData(),
      ]);

      setLogs(logsData);
      setStreak(streakData);

      // Calculate and update streaks
      await calculateAndUpdateStreaks(logsData, streakData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateAndUpdateStreaks = async (logsData: DailyLog[], existingStreak: StreakData | null) => {
    const logsByDate = new Map<string, DailyLog>();
    logsData.forEach((log) => {
      logsByDate.set(log.date, log);
    });

    // Calculate meal streak (no cheat meals)
    let currentStreak = 0;
    let checkDate = subDays(today, 1);
    const todayLog = logsByDate.get(format(today, 'yyyy-MM-dd'));

    if (todayLog && isCleanDay(todayLog)) {
      currentStreak = 1;
      checkDate = subDays(today, 1);
    } else if (todayLog && !isCleanDay(todayLog)) {
      currentStreak = 0;
    } else {
      currentStreak = 0;
    }

    let consecutiveDate = checkDate;
    while (true) {
      const dateStr = format(consecutiveDate, 'yyyy-MM-dd');
      const log = logsByDate.get(dateStr);

      if (!log || !isCleanDay(log)) {
        break;
      }

      currentStreak++;
      consecutiveDate = subDays(consecutiveDate, 1);
    }

    // Calculate fitness streak (weekdays only)
    let fitnessStreak = 0;
    let fitnessCheckDate = today;

    // Find the most recent weekday
    while (isWeekend(fitnessCheckDate)) {
      fitnessCheckDate = subDays(fitnessCheckDate, 1);
    }

    // Check today's fitness if it's a weekday
    const dayOfWeek = getDay(today);
    const isTodayWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    if (isTodayWeekday) {
      const todayFitness = logsByDate.get(format(today, 'yyyy-MM-dd'));
      if (todayFitness && hasFitnessActivity(todayFitness)) {
        fitnessStreak = 1;
        fitnessCheckDate = subDays(today, 1);
      } else {
        // Today is weekday but no fitness, streak is 0
        fitnessStreak = 0;
        fitnessCheckDate = subDays(today, 1);
      }
    } else {
      // It's weekend, start checking from most recent weekday
      fitnessStreak = 0;
    }

    // Count backwards, skipping weekends
    let fitnessConsecutiveDate = fitnessCheckDate;
    while (true) {
      // Skip weekends
      while (isWeekend(fitnessConsecutiveDate)) {
        fitnessConsecutiveDate = subDays(fitnessConsecutiveDate, 1);
      }

      const dateStr = format(fitnessConsecutiveDate, 'yyyy-MM-dd');
      const log = logsByDate.get(dateStr);

      if (!log || !hasFitnessActivity(log)) {
        break;
      }

      fitnessStreak++;
      fitnessConsecutiveDate = subDays(fitnessConsecutiveDate, 1);
    }

    const longestStreak = Math.max(existingStreak?.longest_streak || 0, currentStreak);
    const longestFitnessStreak = Math.max(existingStreak?.longest_fitness_streak || 0, fitnessStreak);
    const lastCleanDay = currentStreak > 0 ? format(today, 'yyyy-MM-dd') : null;
    const lastFitnessDay = fitnessStreak > 0 ? format(today, 'yyyy-MM-dd') : null;

    try {
      await updateStreakData(
        currentStreak,
        longestStreak,
        lastCleanDay,
        fitnessStreak,
        longestFitnessStreak,
        lastFitnessDay
      );
      setStreak({
        id: '00000000-0000-0000-0000-000000000001',
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_clean_day: lastCleanDay,
        fitness_streak: fitnessStreak,
        longest_fitness_streak: longestFitnessStreak,
        last_fitness_day: lastFitnessDay,
      });
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate stats for different periods
  const weekStats = useMemo(() => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const weekLogs = logs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && logDate <= weekEnd;
    });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: today }).length;
    const stats = calculateStats(weekLogs);
    return { ...stats, totalDays: Math.min(stats.totalDays || daysInWeek, daysInWeek) };
  }, [logs, today]);

  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(today);
    const monthLogs = logs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= monthStart && logDate <= today;
    });
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: today }).length;
    const stats = calculateStats(monthLogs);
    return { ...stats, totalDays: Math.min(stats.totalDays || daysInMonth, daysInMonth) };
  }, [logs, today]);

  const yearStats = useMemo(() => {
    const yearStart = startOfYear(today);
    const yearLogs = logs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= yearStart && logDate <= today;
    });
    const daysInYear = eachDayOfInterval({ start: yearStart, end: today }).length;
    const stats = calculateStats(yearLogs);
    return { ...stats, totalDays: Math.min(stats.totalDays || daysInYear, daysInYear) };
  }, [logs, today]);

  // Calculate fitness stats for the week
  const weekFitnessStats = useMemo(() => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekLogs = logs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && logDate <= today;
    });
    return calculateFitnessStats(weekLogs);
  }, [logs, today]);

  // Build day statuses for calendar
  const dayStatuses = useMemo(() => {
    const statuses = new Map<string, DayStatus>();
    logs.forEach((log) => {
      statuses.set(log.date, {
        hasData: true,
        isClean: isCleanDay(log),
        variableMealsCount: log.variable_meals?.length || 0,
        fixedMealsCompleted: Object.values(log.fixed_meals || {}).filter(Boolean).length,
        cheatMealsCount: log.cheat_meals?.length || 0,
        fitnessActivitiesCount: log.fitness_activities?.length || 0,
        hasFitness: hasFitnessActivity(log),
      });
    });
    return statuses;
  }, [logs]);

  // Weekly goals
  const weeklyGoals = useMemo(() => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const daysToCheck = eachDayOfInterval({ start: weekStart, end: today });

    let cleanDays = 0;
    let fitnessDays = 0;
    let weekdaysWithFitness = 0;

    daysToCheck.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const status = dayStatuses.get(dateStr);
      const dayOfWeek = getDay(day);
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

      if (status && status.isClean) {
        cleanDays++;
      }
      if (status && status.hasFitness) {
        fitnessDays++;
        if (isWeekday) {
          weekdaysWithFitness++;
        }
      }
    });

    // Count weekdays so far this week
    const weekdaysSoFar = daysToCheck.filter((day) => {
      const dow = getDay(day);
      return dow >= 1 && dow <= 5;
    }).length;

    return [
      {
        id: 'clean_week',
        name: '6 dias sin cheat meals',
        current: cleanDays,
        target: 6,
        completed: cleanDays >= 6,
      },
      {
        id: 'fitness_weekdays',
        name: 'Fitness todos los dias laborales',
        current: weekdaysWithFitness,
        target: Math.min(weekdaysSoFar, 5),
        completed: weekdaysWithFitness >= weekdaysSoFar && weekdaysSoFar > 0,
      },
    ];
  }, [dayStatuses, today]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-neutral-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Streak Display */}
      <StreakDisplay
        currentStreak={streak?.current_streak || 0}
        longestStreak={streak?.longest_streak || 0}
        fitnessStreak={streak?.fitness_streak || 0}
        longestFitnessStreak={streak?.longest_fitness_streak || 0}
      />

      {/* Weekly Goals */}
      <WeeklyGoals goals={weeklyGoals} />

      {/* Stats Cards */}
      <div className="space-y-4">
        <StatsCard
          title="Esta semana"
          percentage={weekStats.percentage}
          cleanDays={weekStats.cleanDays}
          totalDays={weekStats.totalDays}
        />
        <StatsCard
          title="Este mes"
          percentage={monthStats.percentage}
          cleanDays={monthStats.cleanDays}
          totalDays={monthStats.totalDays}
        />
        <StatsCard
          title="Este año"
          percentage={yearStats.percentage}
          cleanDays={yearStats.cleanDays}
          totalDays={yearStats.totalDays}
        />
      </div>

      {/* Calendar */}
      <CalendarView dayStatuses={dayStatuses} />
    </div>
  );
}
