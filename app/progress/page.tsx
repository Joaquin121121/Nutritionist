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
  isCleanDay,
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

      // Calculate and update streak
      await calculateAndUpdateStreak(logsData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateAndUpdateStreak = async (logsData: DailyLog[]) => {
    const logsByDate = new Map<string, DailyLog>();
    logsData.forEach((log) => {
      logsByDate.set(log.date, log);
    });

    let currentStreak = 0;
    let checkDate = subDays(today, 1); // Start from yesterday
    const todayLog = logsByDate.get(format(today, 'yyyy-MM-dd'));

    // If today has data and is clean, include it
    if (todayLog && isCleanDay(todayLog)) {
      currentStreak = 1;
      checkDate = subDays(today, 1);
    } else if (todayLog && !isCleanDay(todayLog)) {
      // Today has a cheat meal, streak is broken
      currentStreak = 0;
    } else {
      // No data for today, start counting from yesterday
      currentStreak = 0;
    }

    // Count backwards from yesterday (or today if clean)
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

    const longestStreak = Math.max(
      streak?.longest_streak || 0,
      currentStreak
    );

    const lastCleanDay = currentStreak > 0 ? format(today, 'yyyy-MM-dd') : null;

    try {
      await updateStreakData(currentStreak, longestStreak, lastCleanDay);
      setStreak({
        id: '00000000-0000-0000-0000-000000000001',
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_clean_day: lastCleanDay,
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
      });
    });
    return statuses;
  }, [logs]);

  // Weekly goals
  const weeklyGoals = useMemo(() => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const daysToCheck = eachDayOfInterval({ start: weekStart, end: today });

    let cleanDays = 0;
    daysToCheck.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const status = dayStatuses.get(dateStr);
      if (status && status.isClean) {
        cleanDays++;
      }
    });

    return [
      {
        id: 'clean_week',
        name: '7 dias sin cheat meals',
        current: cleanDays,
        target: 7,
        completed: cleanDays >= 7,
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
          title="Este ano"
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
