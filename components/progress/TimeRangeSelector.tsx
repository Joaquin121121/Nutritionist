'use client';

export type TimeRange = 'week' | 'two_weeks' | 'month' | 'three_months' | 'year';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'week', label: '1W' },
  { value: 'two_weeks', label: '2W' },
  { value: 'month', label: '1M' },
  { value: 'three_months', label: '3M' },
  { value: 'year', label: '1Y' },
];

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            value === option.value
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
