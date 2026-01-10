'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Target, Check } from 'lucide-react';
import { ShotSlider, SessionScore } from '@/components/basketball';
import { Button } from '@/components/ui';
import { DayNavigator } from '@/components/track';
import { SHOT_TYPES, calculateSessionScore } from '@/data/shots';
import {
  saveBasketballSession,
  getBasketballSession,
  getDailyLog,
  upsertDailyLog,
} from '@/lib/database';
import type { ShotData, FitnessActivity } from '@/types';

export default function BasketballPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shots, setShots] = useState<ShotData>({});
  const [showScore, setShowScore] = useState(false);
  const [savedScore, setSavedScore] = useState<{
    totalMakes: number;
    totalAttempts: number;
    score: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todaySession, setTodaySession] = useState<boolean>(false);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getBasketballSession(dateString);
      if (session) {
        setShots(session.shots);
        setTodaySession(true);
        setSavedScore({
          totalMakes: session.total_makes,
          totalAttempts: session.total_attempts,
          score: session.score,
        });
      } else {
        setShots({});
        setTodaySession(false);
        setSavedScore(null);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  }, [dateString]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleShotChange = (shotId: keyof ShotData, value: number) => {
    setShots((prev) => ({
      ...prev,
      [shotId]: value,
    }));
  };

  const handleCompleteSession = async () => {
    setSaving(true);
    try {
      // Save basketball session
      const session = await saveBasketballSession(dateString, shots);

      if (session) {
        // Also add basketball_training to fitness activities
        const dailyLog = await getDailyLog(dateString);
        const existingActivities = dailyLog?.fitness_activities || [];

        // Check if basketball_training already exists for today
        const hasBasketball = existingActivities.some(
          (a) => a.type === 'basketball_training'
        );

        if (!hasBasketball) {
          const newActivities: FitnessActivity[] = [
            ...existingActivities,
            { type: 'basketball_training', timestamp: new Date().toISOString() },
          ];
          await upsertDailyLog(dateString, { fitness_activities: newActivities });
        }

        const { totalMakes, totalAttempts, score } = calculateSessionScore(shots);
        setSavedScore({ totalMakes, totalAttempts, score });
        setShowScore(true);
        setTodaySession(true);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setSaving(false);
    }
  };

  const hasAnyShots = Object.values(shots).some((v) => v !== undefined && v > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-neutral-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-8">
      <DayNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
          <Target className="w-6 h-6 text-accent-600 dark:text-accent-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
            Entrenamiento de Tiros
          </h1>
          <p className="text-sm text-neutral-500">
            Registra tus tiros de la sesion
          </p>
        </div>
      </div>

      {/* Today's Session Badge */}
      {todaySession && savedScore && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 border border-accent-200 dark:border-accent-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-accent-600" />
              <span className="font-medium text-accent-800 dark:text-accent-200">
                Sesion completada hoy
              </span>
            </div>
            <button
              onClick={() => setShowScore(true)}
              className="text-sm text-accent-600 dark:text-accent-400 hover:underline"
            >
              Ver score ({Math.round(savedScore.score)}%)
            </button>
          </div>
        </div>
      )}

      {/* Shot Sliders */}
      <div className="space-y-4 mb-8">
        {SHOT_TYPES.map((shot) => (
          <ShotSlider
            key={shot.id}
            shot={shot}
            value={shots[shot.id] ?? 0}
            onChange={(value) => handleShotChange(shot.id, value)}
          />
        ))}
      </div>

      {/* Complete Session Button */}
      <Button
        onClick={handleCompleteSession}
        disabled={!hasAnyShots || saving}
        className="w-full"
        size="lg"
      >
        {saving ? 'Guardando...' : 'Completar Sesion'}
      </Button>

      {/* Session Score Modal */}
      {showScore && savedScore && (
        <SessionScore
          shots={shots}
          totalMakes={savedScore.totalMakes}
          totalAttempts={savedScore.totalAttempts}
          score={savedScore.score}
          onClose={() => setShowScore(false)}
        />
      )}
    </div>
  );
}
