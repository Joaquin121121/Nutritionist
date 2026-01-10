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
  subWeeks,
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

    // Calculate fitness streak (consecutive days with fitness, any day counts)
    // Streak resets if previous week's goals weren't met (3 weightlifting, 2 basketball)
    let fitnessStreak = 0;

    // Helper to count weekly fitness activities
    const countWeeklyFitness = (weekStart: Date, weekEnd: Date) => {
      let weightlifting = 0;
      let basketball = 0;
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      days.forEach((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const log = logsByDate.get(dateStr);
        if (log?.fitness_activities) {
          log.fitness_activities.forEach((a) => {
            if (a.type === 'weightlifting') weightlifting++;
            if (a.type === 'basketball_training') basketball++;
          });
        }
      });
      return { weightlifting, basketball };
    };

    // Check if previous week met goals
    const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
    const lastWeekFitness = countWeeklyFitness(lastWeekStart, lastWeekEnd);
    const lastWeekGoalsMet = lastWeekFitness.weightlifting >= 3 && lastWeekFitness.basketball >= 2;

    // If last week goals weren't met, streak can only count from this week
    const earliestStreakDate = lastWeekGoalsMet ? null : startOfWeek(today, { weekStartsOn: 1 });

    // Count consecutive days with fitness (backwards from today)
    const todayFitness = logsByDate.get(format(today, 'yyyy-MM-dd'));
    if (todayFitness && hasFitnessActivity(todayFitness)) {
      fitnessStreak = 1;
    }

    let fitnessConsecutiveDate = subDays(today, 1);
    while (true) {
      // Stop if we've gone past the earliest allowed date (when last week goals weren't met)
      if (earliestStreakDate && fitnessConsecutiveDate < earliestStreakDate) {
        break;
      }

      const dateStr = format(fitnessConsecutiveDate, 'yyyy-MM-dd');
      const log = logsByDate.get(dateStr);

      if (!log || !hasFitnessActivity(log)) {
        break;
      }

      fitnessStreak++;
      fitnessConsecutiveDate = subDays(fitnessConsecutiveDate, 1);

      // Check week boundaries - if entering a new week, verify that week's goals were met
      const prevWeekStart = startOfWeek(fitnessConsecutiveDate, { weekStartsOn: 1 });
      const currentWeekStart = startOfWeek(subDays(fitnessConsecutiveDate, -1), { weekStartsOn: 1 });
      if (prevWeekStart.getTime() !== currentWeekStart.getTime()) {
        const prevWeekEnd = endOfWeek(fitnessConsecutiveDate, { weekStartsOn: 1 });
        const prevWeekFitness = countWeeklyFitness(prevWeekStart, prevWeekEnd);
        if (prevWeekFitness.weightlifting < 3 || prevWeekFitness.basketball < 2) {
          break; // That week didn't meet goals, stop counting
        }
      }
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
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const daysToCheck = eachDayOfInterval({ start: weekStart, end: today });

    let cleanDays = 0;
    let weightliftingSessions = 0;
    let basketballSessions = 0;

    // Count activities from logs (need full week data, not just day statuses)
    logs.forEach((log) => {
      const logDate = new Date(log.date);
      if (logDate >= weekStart && logDate <= weekEnd) {
        log.fitness_activities?.forEach((a) => {
          if (a.type === 'weightlifting') weightliftingSessions++;
          if (a.type === 'basketball_training') basketballSessions++;
        });
      }
    });

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
        name: '6 dias sin cheat meals',
        current: cleanDays,
        target: 6,
        completed: cleanDays >= 6,
      },
      {
        id: 'weightlifting',
        name: 'Pesas (3 sesiones)',
        current: weightliftingSessions,
        target: 3,
        completed: weightliftingSessions >= 3,
      },
      {
        id: 'basketball',
        name: 'Basketball (2 sesiones)',
        current: basketballSessions,
        target: 2,
        completed: basketballSessions >= 2,
      },
    ];
  }, [logs, dayStatuses, today]);

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
