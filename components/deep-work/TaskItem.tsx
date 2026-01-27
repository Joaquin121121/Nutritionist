'use client';

import { useState } from 'react';
import { Trash2, Circle, CheckCircle2 } from 'lucide-react';
import type { DeepWorkTask } from '@/types';

interface TaskItemProps {
  task: DeepWorkTask;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = () => {
    onToggle(task.id, !task.completed);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(task.id);
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 transition-opacity ${
        isDeleting ? 'opacity-50' : ''
      }`}
    >
      <button
        onClick={handleToggle}
        className="flex-shrink-0 transition-colors"
        disabled={isDeleting}
      >
        {task.completed ? (
          <CheckCircle2 className="w-6 h-6 text-primary-500" />
        ) : (
          <Circle className="w-6 h-6 text-neutral-400 hover:text-primary-400" />
        )}
      </button>

      <span
        className={`flex-1 text-sm transition-all ${
          task.completed
            ? 'line-through text-neutral-400 dark:text-neutral-500'
            : 'text-neutral-700 dark:text-neutral-300'
        }`}
      >
        {task.title}
      </span>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex-shrink-0 p-2 text-neutral-400 hover:text-danger-500 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
