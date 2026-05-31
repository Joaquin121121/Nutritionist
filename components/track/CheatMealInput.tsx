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
    <div>
      <div className="cheat-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Agregar un antojo…"
        />
        <button onClick={handleAdd} disabled={!inputValue.trim()} className="cheat-add">
          <Plus width={17} height={17} strokeWidth={2.2} />
        </button>
      </div>

      {cheatMeals.length > 0 && (
        <div className="cheat-list">
          {cheatMeals.map((meal, index) => (
            <div key={index} className="cheat-pill">
              <span>{meal.name}</span>
              <button onClick={() => onRemove(index)} aria-label="Eliminar">
                <X width={13} height={13} strokeWidth={2.4} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
