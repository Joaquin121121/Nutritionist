'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isToday, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface DayNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DayNavigator({ selectedDate, onDateChange }: DayNavigatorProps) {
  const goToPreviousDay = () => onDateChange(subDays(selectedDate, 1));
  const goToNextDay = () => onDateChange(addDays(selectedDate, 1));
  const goToToday = () => onDateChange(new Date());

  const canGoForward = !isToday(selectedDate);
  const today = isToday(selectedDate);

  const dow = format(selectedDate, 'EEEE', { locale: es });
  const full = format(selectedDate, "d MMM yyyy", { locale: es });

  return (
    <div className="daynav">
      <button onClick={goToPreviousDay} className="daynav-arrow" aria-label="Dia anterior">
        <ChevronLeft width={20} height={20} />
      </button>

      <div className="daynav-label">
        <span className="eyebrow">{today ? 'Hoy' : dow}</span>
        <strong className="capitalize">{full}</strong>
        {!today && (
          <button onClick={goToToday} className="daynav-today">
            Ir a hoy
          </button>
        )}
      </div>

      <button
        onClick={goToNextDay}
        disabled={!canGoForward}
        className="daynav-arrow"
        aria-label="Dia siguiente"
      >
        <ChevronRight width={20} height={20} />
      </button>
    </div>
  );
}
