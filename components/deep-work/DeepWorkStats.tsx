'use client';

import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  format,
  startOfWeek,
  startOfMonth,
  startOfYear,
  startOfDay,
  subWeeks,
  subMonths,
} from 'date-fns';
import { TimeRangeSelector } from '@/components/progress';
import type { TimeRange } from '@/components/progress';
import type { DeepWorkTask } from '@/types';

interface DeepWorkStatsProps {
  tasks: DeepWorkTask[];
}

const TARGET_PERCENTAGE = 80;

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

export function DeepWorkStats({ tasks }: DeepWorkStatsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const today = useMemo(() => new Date(), []);

  const stats = useMemo(() => {
    const { start, end } = getDateRange(timeRange, today);
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    const filteredTasks = tasks.filter((task) => {
      return task.date >= startStr && task.date <= endStr;
    });

    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter((t) => t.completed).length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      total: totalTasks,
      completed: completedTasks,
      percentage,
    };
  }, [tasks, timeRange, today]);

  const isOnTarget = stats.percentage >= TARGET_PERCENTAGE;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary-500" />
        <span className="font-medium text-neutral-800 dark:text-neutral-200">
          Estadisticas
        </span>
      </div>

      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">
            {stats.completed}/{stats.total} tareas completadas
          </span>
          <span className={`font-semibold ${isOnTarget ? 'text-primary-500' : 'text-neutral-500'}`}>
            {stats.percentage}%
          </span>
        </div>

        <div className="relative h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full transition-all duration-500 rounded-full ${
              isOnTarget ? 'bg-primary-500' : 'bg-neutral-400'
            }`}
            style={{ width: `${Math.min(stats.percentage, 100)}%` }}
          />
          {/* Target marker at 80% */}
          <div
            className="absolute top-0 h-full w-0.5 bg-accent-500"
            style={{ left: `${TARGET_PERCENTAGE}%` }}
          />
        </div>

        <div className="flex items-center justify-end text-xs text-neutral-400">
          <span>Meta: {TARGET_PERCENTAGE}%</span>
        </div>
      </div>
    </div>
  );
}
