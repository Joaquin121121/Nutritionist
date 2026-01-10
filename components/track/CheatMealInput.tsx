'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { CheatMeal } from '@/types';

interface CheatMealInputProps {
  cheatMeals: CheatMeal[];
  onAdd: (meal: CheatMeal) => void;
  onRemove: (index: number) => void;
}

export function CheatMealInput({ cheatMeals, onAdd, onRemove }: CheatMealInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd({ name: inputValue.trim(), emoji: '🍔' });
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Agregar cheat meal..."
          className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-danger-400 focus:ring-2 focus:ring-danger-400/20"
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-4 py-3 rounded-xl bg-danger-500 text-white hover:bg-danger-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {cheatMeals.length > 0 && (
        <div className="space-y-2">
          {cheatMeals.map((meal, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{meal.emoji || '🍔'}</span>
                <span className="font-medium text-danger-700 dark:text-danger-300">
                  {meal.name}
                </span>
              </div>
              <button
                onClick={() => onRemove(index)}
                className="p-1 rounded-full hover:bg-danger-100 dark:hover:bg-danger-800 transition-colors"
              >
                <X className="w-5 h-5 text-danger-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
