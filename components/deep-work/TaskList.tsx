'use client';

import { TaskItem } from './TaskItem';
import { TaskInput } from './TaskInput';
import type { DeepWorkTask } from '@/types';

interface TaskListProps {
  tasks: DeepWorkTask[];
  onAdd: (title: string, date: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: { title?: string; date?: string }) => void;
  defaultDate: string;
}

export function TaskList({ tasks, onAdd, onToggle, onDelete, onEdit, defaultDate }: TaskListProps) {
  // Sort: incomplete tasks first, then completed
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return a.sort_order - b.sort_order;
  });

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {sortedTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

      <TaskInput onAdd={onAdd} defaultDate={defaultDate} />
    </div>
  );
}
