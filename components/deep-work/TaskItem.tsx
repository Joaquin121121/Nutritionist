'use client';

import { useState } from 'react';
import { Trash2, Circle, CheckCircle2, Pencil, Check, X } from 'lucide-react';
import { DateQuickSelect } from './DateQuickSelect';
import type { DeepWorkTask } from '@/types';

interface TaskItemProps {
  task: DeepWorkTask;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: { title?: string; date?: string }) => void;
}

export function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDate, setEditDate] = useState(task.date);

  const handleToggle = () => {
    onToggle(task.id, !task.completed);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(task.id);
  };

  const handleStartEdit = () => {
    setEditTitle(task.title);
    setEditDate(task.date);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(task.title);
    setEditDate(task.date);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    const updates: { title?: string; date?: string } = {};
    if (editTitle.trim() !== task.title) {
      updates.title = editTitle.trim();
    }
    if (editDate !== task.date) {
      updates.date = editDate;
    }
    if (Object.keys(updates).length > 0) {
      onEdit(task.id, updates);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl border border-primary-300 dark:border-primary-600 space-y-3">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          autoFocus
        />
        <DateQuickSelect value={editDate} onChange={setEditDate} />
        <div className="flex gap-2">
          <button
            onClick={handleSaveEdit}
            disabled={!editTitle.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            <Check className="w-4 h-4" />
            Guardar
          </button>
          <button
            onClick={handleCancelEdit}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </div>
    );
  }

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
        onClick={handleStartEdit}
        disabled={isDeleting}
        className="flex-shrink-0 p-2 text-neutral-400 hover:text-primary-500 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
      >
        <Pencil className="w-4 h-4" />
      </button>

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
