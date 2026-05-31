'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Plus, Check, MessageSquare } from 'lucide-react';
import { DayNavigator, MealCard, CheatMealInput, FitnessSection } from '@/components/track';
import { VARIABLE_MEALS, FIXED_MEALS, DEFAULT_FIXED_MEALS } from '@/data/meals';
import { getDailyLog, getDailyLogsRange, upsertDailyLog } from '@/lib/database';
import { useTrackingEnabled } from '@/lib/tracking';
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
  const [trackingEnabled] = useTrackingEnabled();

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
    } else {
      localStorage.removeItem(commentKey);
      setComment('');
    }
    setShowCommentInput(false);
    setCommentDraft('');
  };

  const openCommentEditor = () => {
    setCommentDraft(comment);
    setShowCommentInput(true);
  };

  const saveLog = async (updates: Partial<Pick<DailyLog, 'variable_meals' | 'fixed_meals' | 'cheat_meals' | 'fitness_activities'>>) => {
    try {
      await upsertDailyLog(dateString, updates);
    } catch (error) {
      console.error('Error saving daily log:', error);
    }
  };

  const handleVariableMealToggle = (mealId: string) => {
    if (!trackingEnabled) return;
    let newMeals: string[];

    if (variableMeals.length < MAX_VARIABLE_MEALS) {
      newMeals = [...variableMeals, mealId];
    } else {
      const lastIndex = variableMeals.lastIndexOf(mealId);
      if (lastIndex !== -1) {
        newMeals = [...variableMeals];
        newMeals.splice(lastIndex, 1);
      } else {
        return;
      }
    }

    setVariableMeals(newMeals);
    saveLog({ variable_meals: newMeals });
  };

  const handleFixedMealToggle = (mealId: string) => {
    if (!trackingEnabled) return;
    const newMeals = { ...fixedMeals, [mealId]: !fixedMeals[mealId] };
    setFixedMeals(newMeals);
    saveLog({ fixed_meals: newMeals });
  };

  const handleAddCheatMeal = (meal: CheatMeal) => {
    if (!trackingEnabled) return;
    const newMeals = [...cheatMeals, meal];
    setCheatMeals(newMeals);
    saveLog({ cheat_meals: newMeals });
  };

  const handleRemoveCheatMeal = (index: number) => {
    if (!trackingEnabled) return;
    const newMeals = cheatMeals.filter((_, i) => i !== index);
    setCheatMeals(newMeals);
    saveLog({ cheat_meals: newMeals });
  };

  const handleFitnessToggle = (type: FitnessActivityType) => {
    if (!trackingEnabled) return;
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
    <div className="app-screen fade-in">
      <DayNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Tracking paused banner */}
      {!trackingEnabled && (
        <div className="banner-amber fade-in">
          <span className="ba-dot" />
          <div>
            <strong>Seguimiento pausado</strong>
            <p>Reanúdalo desde la pestaña Progreso para volver a registrar tu día.</p>
          </div>
        </div>
      )}

      {/* Comment Section */}
      {showCommentInput ? (
        <div className="note-box fade-in">
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Cómo te sentiste hoy, energía, ánimo…"
            rows={3}
            autoFocus
          />
          <div className="note-actions">
            <button
              className="pill pill-ghost"
              onClick={() => {
                setShowCommentInput(false);
                setCommentDraft('');
              }}
            >
              Cancelar
            </button>
            <button className="pill pill-accent" onClick={handleSaveComment}>
              Guardar
            </button>
          </div>
        </div>
      ) : comment ? (
        <div className="note-saved">
          <MessageSquare width={15} height={15} style={{ color: 'var(--muted)', flex: '0 0 auto', marginTop: 1 }} />
          <p>{comment}</p>
          <button className="note-edit" disabled={!trackingEnabled} onClick={openCommentEditor}>
            Editar
          </button>
        </div>
      ) : (
        <button className="linkbtn comment-link" disabled={!trackingEnabled} onClick={openCommentEditor}>
          <Plus width={15} height={15} /> Agregar comentario
        </button>
      )}

      {/* Loggable sections — disabled while tracking is paused */}
      <div className="log-zone" data-dim={!trackingEnabled}>
        {/* Fitness Section */}
        <section className="sec">
          <div className="sec-head">
            <h3>Actividad física</h3>
            {fitnessActivities.length > 0 && (
              <span className="sec-count">
                <b>{fitnessActivities.length}</b> actividad{fitnessActivities.length > 1 ? 'es' : ''}
              </span>
            )}
          </div>
          <FitnessSection activities={fitnessActivities} onToggle={handleFitnessToggle} />
        </section>

        {/* Variable Meals Section */}
        <section className="sec">
          <div className="sec-head">
            <h3>Comidas variables</h3>
            <span className="sec-count">
              <b>{variableMeals.length}</b>/{MAX_VARIABLE_MEALS}
            </span>
          </div>
          <div className="stack">
            {VARIABLE_MEALS.map((meal) => {
              const selectionCount = variableMeals.filter((id) => id === meal.id).length;
              const isSelected = selectionCount > 0;
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
                  selectionCount={selectionCount}
                  weeklyCount={weeklyServings[meal.id] || 0}
                  weeklyTarget={meal.weeklyServings}
                />
              );
            })}
          </div>
        </section>

        {/* Fixed Meals Section */}
        <section className="sec">
          <div className="sec-head">
            <h3>Comidas fijas</h3>
            <span className="sec-count">
              <b>{fixedMealsCompleted}</b>/{totalFixedMeals}
            </span>
          </div>
          <div className="card list-card">
            {FIXED_MEALS.map((meal, i) => {
              const on = fixedMeals[meal.id] || false;
              return (
                <button
                  key={meal.id}
                  className="ck-row"
                  data-last={i === FIXED_MEALS.length - 1}
                  onClick={() => handleFixedMealToggle(meal.id)}
                >
                  <span className="ck-emoji">{meal.emoji}</span>
                  <span className="ck-label" data-on={on}>{meal.name}</span>
                  <span className="ck-box" data-on={on}>
                    {on && <Check width={13} height={13} strokeWidth={2.8} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Cheat Meals Section */}
        <section className="sec">
          <div className="sec-head">
            <h3>Cheat meals</h3>
            <span className="sec-count">
              <b>{cheatMeals.length}</b>
            </span>
          </div>
          <CheatMealInput
            cheatMeals={cheatMeals}
            onAdd={handleAddCheatMeal}
            onRemove={handleRemoveCheatMeal}
          />
        </section>

        {/* Daily Summary */}
        <section className="sec">
          <div className="summary-card">
            <div className="sum-head">
              <span className="eyebrow">Resumen del día</span>
            </div>
            <div className="sum-grid">
              <div>
                <b>{fitnessActivities.length}</b>
                <span>Fitness</span>
              </div>
              <div>
                <b>{variableMeals.length}<i>/{MAX_VARIABLE_MEALS}</i></b>
                <span>Variables</span>
              </div>
              <div>
                <b>{fixedMealsCompleted}<i>/{totalFixedMeals}</i></b>
                <span>Fijas</span>
              </div>
              <div>
                <b>{cheatMeals.length}</b>
                <span>Cheats</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
