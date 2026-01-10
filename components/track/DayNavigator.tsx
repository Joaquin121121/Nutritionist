'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isToday, isYesterday, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface DayNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DayNavigator({ selectedDate, onDateChange }: DayNavigatorProps) {
  const formatDateLabel = (date: Date): string => {
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    return format(date, "EEEE d 'de' MMMM", { locale: es });
  };

  const goToPreviousDay = () => onDateChange(subDays(selectedDate, 1));
  const goToNextDay = () => onDateChange(addDays(selectedDate, 1));
  const goToToday = () => onDateChange(new Date());

  const canGoForward = !isToday(selectedDate);

  return (
    <div className="flex items-center justify-between py-4 px-2">
      <button
        onClick={goToPreviousDay}
        className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        aria-label="Dia anterior"
      >
        <ChevronLeft className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
      </button>

      <div className="flex flex-col items-center">
        <span className="text-lg font-semibold capitalize text-neutral-800 dark:text-neutral-200">
          {formatDateLabel(selectedDate)}
        </span>
        {!isToday(selectedDate) && (
          <button
            onClick={goToToday}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-1"
          >
            Ir a hoy
          </button>
        )}
      </div>

      <button
        onClick={goToNextDay}
        disabled={!canGoForward}
        className={`p-2 rounded-full transition-colors ${
          canGoForward
            ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
            : 'opacity-30 cursor-not-allowed'
        }`}
        aria-label="Dia siguiente"
      >
        <ChevronRight className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
      </button>
    </div>
  );
}
