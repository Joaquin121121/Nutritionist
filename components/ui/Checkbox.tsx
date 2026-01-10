'use client';

import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  strikethrough?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  strikethrough = false,
  className = '',
}: CheckboxProps) {
  return (
    <label
      className={`flex items-center gap-3 cursor-pointer select-none ${className}`}
    >
      <div
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
          checked
            ? 'bg-primary-500 border-primary-500'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400'
        }`}
        onClick={() => onChange(!checked)}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onChange(!checked)}
      >
        {checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
      </div>
      {label && (
        <span
          className={`text-base transition-all duration-200 ${
            checked && strikethrough
              ? 'line-through text-neutral-400 dark:text-neutral-500'
              : 'text-neutral-800 dark:text-neutral-200'
          }`}
        >
          {label}
        </span>
      )}
    </label>
  );
}
