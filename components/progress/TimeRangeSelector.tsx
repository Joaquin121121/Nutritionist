'use client';

export type TimeRange = 'week' | 'two_weeks' | 'month' | 'three_months' | 'year';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'two_weeks', label: '2 Semanas' },
  { value: 'month', label: 'Mes' },
  { value: 'three_months', label: '3 Meses' },
  { value: 'year', label: 'Año' },
];

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="seg seg-range">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={value === option.value ? 'active' : ''}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
