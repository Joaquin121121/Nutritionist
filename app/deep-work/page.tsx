'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfYear, endOfYear } from 'date-fns';
import { Brain } from 'lucide-react';
import { DayNavigator } from '@/components/track/DayNavigator';
import {
  NotesSection,
  TaskList,
  DeepWorkStats,
} from '@/components/deep-work';
import {
  getDeepWorkTasks,
  getDeepWorkTasksRange,
  createDeepWorkTask,
  updateDeepWorkTask,
  deleteDeepWorkTask,
} from '@/lib/database';
import type { DeepWorkTask } from '@/types';

export default function DeepWorkPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<DeepWorkTask[]>([]);
  const [allTasks, setAllTasks] = useState<DeepWorkTask[]>([]);
  const [loading, setLoading] = useState(true);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const noteKey = `deep-work-note-${dateString}`;

  const today = useMemo(() => new Date(), []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const yearStart = format(startOfYear(today), 'yyyy-MM-dd');
      const yearEnd = format(endOfYear(today), 'yyyy-MM-dd');

      const [dayTasks, yearTasks] = await Promise.all([
        getDeepWorkTasks(dateString),
        getDeepWorkTasksRange(yearStart, yearEnd),
      ]);

      setTasks(dayTasks);
      setAllTasks(yearTasks);
    } catch (error) {
      console.error('Error loading deep work tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [dateString, today]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAddTask = async (title: string, date: string) => {
    try {
      const newTask = await createDeepWorkTask(date, title);
      if (newTask) {
        if (date === dateString) {
          setTasks((prev) => [...prev, newTask]);
        }
        setAllTasks((prev) => [...prev, newTask]);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleToggleTask = async (id: string, completed: boolean) => {
    try {
      const updatedTask = await updateDeepWorkTask(id, { completed });
      if (updatedTask) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? updatedTask : t))
        );
        setAllTasks((prev) =>
          prev.map((t) => (t.id === id ? updatedTask : t))
        );
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteDeepWorkTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setAllTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTask = async (id: string, updates: { title?: string; date?: string }) => {
    try {
      const updatedTask = await updateDeepWorkTask(id, updates);
      if (updatedTask) {
        // If date changed, remove from current view if it no longer belongs
        if (updates.date && updates.date !== dateString) {
          setTasks((prev) => prev.filter((t) => t.id !== id));
        } else {
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? updatedTask : t))
          );
        }
        setAllTasks((prev) =>
          prev.map((t) => (t.id === id ? updatedTask : t))
        );
      }
    } catch (error) {
      console.error('Error editing task:', error);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
            Deep Work
          </h1>
          <p className="text-sm text-neutral-500">
            Enfoque y productividad
          </p>
        </div>
      </div>

      {/* Notes Section */}
      <NotesSection storageKey={noteKey} />

      {/* Day Navigator */}
      <DayNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-neutral-500">Cargando...</div>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onAdd={handleAddTask}
          onToggle={handleToggleTask}
          onDelete={handleDeleteTask}
          onEdit={handleEditTask}
          defaultDate={dateString}
        />
      )}

      {/* Stats Section */}
      <DeepWorkStats tasks={allTasks} />
    </div>
  );
}
