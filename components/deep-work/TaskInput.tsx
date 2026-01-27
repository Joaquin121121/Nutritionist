'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface TaskInputProps {
  onAdd: (title: string) => void;
}

export function TaskInput({ onAdd }: TaskInputProps) {
  const [title, setTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsAdding(true);
    await onAdd(title.trim());
    setTitle('');
    setIsAdding(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Agregar tarea..."
        disabled={isAdding}
        className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!title.trim() || isAdding}
        className="px-4 py-3 bg-primary-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
      >
        <Plus className="w-5 h-5" />
      </button>
    </form>
  );
}
