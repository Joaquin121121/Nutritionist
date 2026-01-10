'use client';

import { Check } from 'lucide-react';

interface GroceryItemProps {
  name: string;
  quantity: string;
  checked: boolean;
  onToggle: () => void;
}

export function GroceryItem({ name, quantity, checked, onToggle }: GroceryItemProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
        checked
          ? 'bg-neutral-100 dark:bg-neutral-800'
          : 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          checked
            ? 'bg-primary-500 border-primary-500'
            : 'border-neutral-300 dark:border-neutral-600'
        }`}
      >
        {checked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={`block font-medium transition-all duration-200 ${
            checked
              ? 'line-through text-neutral-400 dark:text-neutral-500'
              : 'text-neutral-800 dark:text-neutral-200'
          }`}
        >
          {name}
        </span>
        <span
          className={`text-sm ${
            checked
              ? 'text-neutral-400 dark:text-neutral-600'
              : 'text-neutral-500 dark:text-neutral-400'
          }`}
        >
          {quantity}
        </span>
      </div>
    </button>
  );
}
