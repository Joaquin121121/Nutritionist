'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { DayStatus } from '@/types';

interface CalendarViewProps {
  dayStatuses: Map<string, DayStatus>;
  onDayClick?: (date: Date) => void;
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function CalendarView({ dayStatuses, onDayClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayStyle = (date: Date): string => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const status = dayStatuses.get(dateKey);

    if (!status || !status.hasData) {
      return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400';
    }

    if (status.cheatMealsCount > 0) {
      return 'bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400';
    }

    return 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400';
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
        <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day, index) => (
          <div
            key={index}
            className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              disabled={!isCurrentMonth}
              className={`
                aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                transition-all duration-200
                ${isCurrentMonth ? getDayStyle(day) : 'bg-transparent text-neutral-300 dark:text-neutral-600'}
                ${isTodayDate ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-neutral-800' : ''}
                ${isCurrentMonth ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-primary-100 dark:bg-primary-900/30" />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Limpio</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-danger-100 dark:bg-danger-900/30" />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Cheat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-neutral-100 dark:bg-neutral-700" />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Sin datos</span>
        </div>
      </div>
    </div>
  );
}
