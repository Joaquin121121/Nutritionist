'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { DayNavigator, MealCard, CheatMealInput, FitnessSection } from '@/components/track';
import { Checkbox } from '@/components/ui';
import { VARIABLE_MEALS, FIXED_MEALS, DEFAULT_FIXED_MEALS } from '@/data/meals';
import { getDailyLog, getDailyLogsRange, upsertDailyLog } from '@/lib/database';
import type { DailyLog, CheatMeal, FitnessActivity, FitnessActivityType } from '@/types';

const MAX_VARIABLE_MEALS = 2;

export default function TrackPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [variableMeals, setVariableMeals] = useState<string[]>([]);
  const [fixedMeals, setFixedMeals] = useState<Record<string, boolean>>(DEFAULT_FIXED_MEALS);
  const [cheatMeals, setCheatMeals] = useState<CheatMeal[]>([]);
  const [fitnessActivities, setFitnessActivities] = useState<FitnessActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState<string>('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [weeklyServings, setWeeklyServings] = useState<Record<string, number>>({});

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const commentKey = `track-comment-${dateString}`;

  const loadDailyLog = useCallback(async () => {
    setLoading(true);
    try {
      const log = await getDailyLog(dateString);
      if (log) {
        setVariableMeals(log.variable_meals || []);
        setFixedMeals(log.fixed_meals || DEFAULT_FIXED_MEALS);
        setCheatMeals(log.cheat_meals || []);
        setFitnessActivities(log.fitness_activities || []);
      } else {
        setVariableMeals([]);
        setFixedMeals(DEFAULT_FIXED_MEALS);
        setCheatMeals([]);
        setFitnessActivities([]);
      }
    } catch (error) {
      console.error('Error loading daily log:', error);
    } finally {
      setLoading(false);
    }
  }, [dateString]);

  const loadWeeklyServings = useCallback(async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const logs = await getDailyLogsRange(
      format(weekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd')
    );
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      (log.variable_meals || []).forEach(mealId => {
        counts[mealId] = (counts[mealId] || 0) + 1;
      });
    });
    setWeeklyServings(counts);
  }, []);

  useEffect(() => {
    loadDailyLog();
    loadWeeklyServings();
  }, [loadDailyLog, loadWeeklyServings]);

  // Load comment from localStorage when date changes
  useEffect(() => {
    const savedComment = localStorage.getItem(commentKey);
    setComment(savedComment || '');
    setShowCommentInput(false);
    setCommentDraft('');
  }, [commentKey]);

  const handleSaveComment = () => {
    if (commentDraft.trim()) {
      localStorage.setItem(commentKey, commentDraft.trim());
      setComment(commentDraft.trim());
    }
    setShowCommentInput(false);
    setCommentDraft('');
  };

  const handleDeleteComment = () => {
    localStorage.removeItem(commentKey);
    setComment('');
  };

  const saveLog = async (updates: Partial<Pick<DailyLog, 'variable_meals' | 'fixed_meals' | 'cheat_meals' | 'fitness_activities'>>) => {
    try {
      await upsertDailyLog(dateString, updates);
    } catch (error) {
      console.error('Error saving daily log:', error);
    }
  };

  const handleVariableMealToggle = (mealId: string) => {
    const isSelected = variableMeals.includes(mealId);
    let newMeals: string[];

    if (isSelected) {
      newMeals = variableMeals.filter((id) => id !== mealId);
    } else if (variableMeals.length < MAX_VARIABLE_MEALS) {
      newMeals = [...variableMeals, mealId];
    } else {
      return;
    }

    setVariableMeals(newMeals);
    saveLog({ variable_meals: newMeals });
  };

  const handleFixedMealToggle = (mealId: string) => {
    const newMeals = { ...fixedMeals, [mealId]: !fixedMeals[mealId] };
    setFixedMeals(newMeals);
    saveLog({ fixed_meals: newMeals });
  };

  const handleAddCheatMeal = (meal: CheatMeal) => {
    const newMeals = [...cheatMeals, meal];
    setCheatMeals(newMeals);
    saveLog({ cheat_meals: newMeals });
  };

  const handleRemoveCheatMeal = (index: number) => {
    const newMeals = cheatMeals.filter((_, i) => i !== index);
    setCheatMeals(newMeals);
    saveLog({ cheat_meals: newMeals });
  };

  const handleFitnessToggle = (type: FitnessActivityType) => {
    const exists = fitnessActivities.some((a) => a.type === type);
    let newActivities: FitnessActivity[];

    if (exists) {
      newActivities = fitnessActivities.filter((a) => a.type !== type);
    } else {
      newActivities = [
        ...fitnessActivities,
        { type, timestamp: new Date().toISOString() },
      ];
    }

    setFitnessActivities(newActivities);
    saveLog({ fitness_activities: newActivities });
  };

  const fixedMealsCompleted = Object.values(fixedMeals).filter(Boolean).length;
  const totalFixedMeals = FIXED_MEALS.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-neutral-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4">
      <DayNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Comment Section */}
      <div className="mb-6">
        {comment ? (
          <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-neutral-700 dark:text-neutral-300 flex-1">
                {comment}
              </p>
              <button
                onClick={handleDeleteComment}
                className="p-1 text-neutral-400 hover:text-danger-500 transition-colors"
                aria-label="Eliminar comentario"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : showCommentInput ? (
          <div className="space-y-2">
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Escribe un comentario sobre el dia..."
              className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveComment}
                disabled={!commentDraft.trim()}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setShowCommentInput(false);
                  setCommentDraft('');
                }}
                className="px-3 py-1.5 text-sm font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCommentInput(true)}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Agregar comentario
          </button>
        )}
      </div>

      {/* Fitness Section */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            Actividad fisica
          </h2>
          {fitnessActivities.length > 0 && (
            <span className="text-sm font-medium text-accent-600 dark:text-accent-400">
              {fitnessActivities.length} actividad{fitnessActivities.length > 1 ? 'es' : ''}
            </span>
          )}
        </div>
        <FitnessSection
          activities={fitnessActivities}
          onToggle={handleFitnessToggle}
        />
      </section>

      {/* Variable Meals Section */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            Comidas variables
          </h2>
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
            {variableMeals.length}/{MAX_VARIABLE_MEALS}
          </span>
        </div>
        <div className="space-y-3">
          {VARIABLE_MEALS.map((meal) => {
            const isSelected = variableMeals.includes(meal.id);
            const isDisabled = !isSelected && variableMeals.length >= MAX_VARIABLE_MEALS;

            return (
              <MealCard
                key={meal.id}
                id={meal.id}
                name={meal.name}
                emoji={meal.emoji}
                isSelected={isSelected}
                onToggle={() => handleVariableMealToggle(meal.id)}
                disabled={isDisabled}
                weeklyCount={weeklyServings[meal.id] || 0}
                weeklyTarget={meal.weeklyServings}
              />
            );
          })}
        </div>
      </section>

      {/* Fixed Meals Section */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            Comidas fijas
          </h2>
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
            {fixedMealsCompleted}/{totalFixedMeals}
          </span>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
          {FIXED_MEALS.map((meal) => (
            <div key={meal.id} className="flex items-center gap-3">
              <span className="text-2xl">{meal.emoji}</span>
              <Checkbox
                checked={fixedMeals[meal.id] || false}
                onChange={() => handleFixedMealToggle(meal.id)}
                label={meal.name}
                strikethrough
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Cheat Meals Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
          Cheat meals
        </h2>
        <CheatMealInput
          cheatMeals={cheatMeals}
          onAdd={handleAddCheatMeal}
          onRemove={handleRemoveCheatMeal}
        />
      </section>

      {/* Daily Summary */}
      <section className="mb-8 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800">
        <h3 className="font-semibold text-primary-800 dark:text-primary-200 mb-2">
          Resumen del dia
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-700 dark:text-primary-300">
          {fitnessActivities.length > 0 && (
            <>
              <span className="text-accent-600 dark:text-accent-400">
                {fitnessActivities.length} fitness
              </span>
              <span>•</span>
            </>
          )}
          <span>{variableMeals.length} comidas variables</span>
          <span>•</span>
          <span>{fixedMealsCompleted}/{totalFixedMeals} fijas</span>
          {cheatMeals.length > 0 && (
            <>
              <span>•</span>
              <span className="text-danger-600 dark:text-danger-400">
                {cheatMeals.length} cheat{cheatMeals.length > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
