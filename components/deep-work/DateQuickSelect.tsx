"use client";

import { format, addDays } from "date-fns";

interface DateQuickSelectProps {
  value: string;
  onChange: (date: string) => void;
}

export function DateQuickSelect({ value, onChange }: DateQuickSelectProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(today)}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          value === today
            ? "bg-primary-500 text-white"
            : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
        }`}
      >
        Hoy
      </button>
      <button
        type="button"
        onClick={() => onChange(tomorrow)}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          value === tomorrow
            ? "bg-primary-500 text-white"
            : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
        }`}
      >
        Mañana
      </button>
    </div>
  );
}
