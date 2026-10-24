'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Brain, Plus } from 'lucide-react';
import {
  TargetSelector,
  ProgressBar,
  Timer,
  FocusHeatmap,
  ManualLogModal,
  DayTargetModal,
} from '@/components/deep-work';
import type { TimerMode } from '@/components/deep-work/Timer';
import {
  getDeepWorkSession,
  createDeepWorkSession,
  updateDeepWorkTarget,
  deleteDeepWorkSession,
  addLoggedMinutes,
} from '@/lib/database';
import { focusDay, isResumableFocusDay } from '@/lib/time';
import type { DeepWorkSession, DeepWorkTargetMinutes, WorkIntervalMinutes } from '@/types';

const STORAGE_KEY = 'deep-work-timer-state';
const REST_MINUTES = 15;

interface StoredTimerState {
  mode: TimerMode;
  startTime: number;
  intervalMinutes: WorkIntervalMinutes;
  pausedElapsed: number;
  isPaused: boolean;
  date: string;
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'deep-work-timer',
    });
  }
}

export default function DeepWorkPage() {
  const [session, setSession] = useState<DeepWorkSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Manual time upload
  const [showManualLog, setShowManualLog] = useState(false);
  const [savingManualLog, setSavingManualLog] = useState(false);
  // Bumped whenever sessions change in the DB so the heatmap re-reads them.
  const [logVersion, setLogVersion] = useState(0);

  // Target editor for any past or current day (heatmap click or today's card).
  const [editingTarget, setEditingTarget] = useState<{
    date: string;
    title: string;
    session: DeepWorkSession | null;
  } | null>(null);
  const [savingTarget, setSavingTarget] = useState(false);

  // Timer state
  const [mode, setMode] = useState<TimerMode>('work');
  const [intervalMinutes, setIntervalMinutes] = useState<WorkIntervalMinutes>(90);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedElapsed, setPausedElapsed] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Focus day the active timer was started on. While set, the page stays on
  // that day, so a session that runs past the 03:00 cutoff still counts for
  // the day it started on.
  const [timerDay, setTimerDay] = useState<string | null>(null);
  const today = timerDay ?? focusDay();

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Load the session for the current focus day
  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      setLoading(true);
      try {
        const data = await getDeepWorkSession(today);
        if (!cancelled) setSession(data);
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadSession();
    return () => {
      cancelled = true;
    };
  }, [today]);

  // Restore timer state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const state: StoredTimerState = JSON.parse(stored);
        if (isResumableFocusDay(state.date)) {
          setTimerDay(state.date);
          setMode(state.mode);
          setIntervalMinutes(state.intervalMinutes);

          if (state.isPaused) {
            setPausedElapsed(state.pausedElapsed);
            setElapsedSeconds(state.pausedElapsed);
          } else {
            const now = Date.now();
            const elapsed = Math.floor((now - state.startTime) / 1000) + state.pausedElapsed;
            // Continue running even if past target time (allows overtime)
            setStartTime(state.startTime);
            setPausedElapsed(state.pausedElapsed);
            setElapsedSeconds(elapsed);
            setIsRunning(true);
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Timer tick - continues past zero for overtime tracking (work mode only)
  useEffect(() => {
    if (isRunning && startTime) {
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000) + pausedElapsed;
        setElapsedSeconds(elapsed);

        // Auto-complete only for rest mode
        if (mode === 'rest') {
          const totalSeconds = REST_MINUTES * 60;
          if (elapsed >= totalSeconds) {
            handleTimerComplete(mode, intervalMinutes);
          }
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, startTime, pausedElapsed, mode]);

  const handleTimerComplete = useCallback(async (completedMode: TimerMode, minutes: number) => {
    setIsRunning(false);
    setStartTime(null);
    setPausedElapsed(0);
    setElapsedSeconds(0);
    localStorage.removeItem(STORAGE_KEY);

    // Play audio at 50% volume
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }

    if (completedMode === 'work') {
      // Log minutes to session
      if (session) {
        try {
          const updated = await addLoggedMinutes(session.id, minutes);
          if (updated) {
            setSession(updated);
            setLogVersion((v) => v + 1);
          }
        } catch (error) {
          console.error('Error logging minutes:', error);
        }
      }

      // Show notification and switch to rest
      showNotification('Trabajo completado!', `${minutes} minutos registrados. Tiempo de descanso!`);
      setMode('rest');
    } else {
      // Rest completed
      showNotification('Descanso completado!', 'Listo para otra sesion de trabajo!');
      setMode('work');
    }
    // Only release the day once the minutes have landed on it.
    setTimerDay(null);
  }, [session]);

  const handleSelectTarget = async (target: DeepWorkTargetMinutes) => {
    try {
      const newSession = await createDeepWorkSession(today, target);
      if (newSession) {
        setSession(newSession);
        setLogVersion((v) => v + 1);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const openTargetEditor = (date: string, title: string, daySession: DeepWorkSession | null) => {
    // Today's row lives in page state, which is fresher than the heatmap's copy.
    setEditingTarget({ date, title, session: date === today ? session : daySession });
  };

  /** Creates the day's target, or changes it if the day already has one. */
  const handleSaveTarget = async (target: DeepWorkTargetMinutes) => {
    if (!editingTarget || savingTarget) return;
    const { date, session: daySession } = editingTarget;
    setSavingTarget(true);
    try {
      const saved = daySession
        ? await updateDeepWorkTarget(daySession.id, target)
        : await createDeepWorkSession(date, target);
      if (saved && date === today) setSession(saved);
      setLogVersion((v) => v + 1);
      setEditingTarget(null);
    } catch (error) {
      console.error('Error saving target:', error);
    } finally {
      setSavingTarget(false);
    }
  };

  const handleDeleteTarget = async () => {
    if (!editingTarget?.session || savingTarget) return;
    const { date, session: daySession } = editingTarget;
    setSavingTarget(true);
    try {
      await deleteDeepWorkSession(daySession.id);
      if (date === today) setSession(null);
      setLogVersion((v) => v + 1);
      setEditingTarget(null);
    } catch (error) {
      console.error('Error deleting target:', error);
    } finally {
      setSavingTarget(false);
    }
  };

  const handleModeChange = (newMode: TimerMode) => {
    if (!isRunning) {
      setMode(newMode);
      setElapsedSeconds(0);
      setPausedElapsed(0);
      setTimerDay(null);
    }
  };

  const handleStart = () => {
    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);
    setTimerDay(today);

    const state: StoredTimerState = {
      mode,
      startTime: now,
      intervalMinutes,
      pausedElapsed,
      isPaused: false,
      date: today,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const handlePause = () => {
    if (startTime) {
      const now = Date.now();
      const currentElapsed = Math.floor((now - startTime) / 1000) + pausedElapsed;
      setPausedElapsed(currentElapsed);
      setElapsedSeconds(currentElapsed);
    }
    setIsRunning(false);
    setStartTime(null);

    const state: StoredTimerState = {
      mode,
      startTime: 0,
      intervalMinutes,
      pausedElapsed: elapsedSeconds,
      isPaused: true,
      date: today,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const handleReset = async () => {
    // If work mode and has elapsed time, log it before resetting
    if (mode === 'work') {
      const minutesWorked = Math.floor(elapsedSeconds / 60);
      if (minutesWorked > 0 && session) {
        try {
          const updated = await addLoggedMinutes(session.id, minutesWorked);
          if (updated) {
            setSession(updated);
            setLogVersion((v) => v + 1);
          }
        } catch (error) {
          console.error('Error logging minutes:', error);
        }
      }
    }

    setIsRunning(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setPausedElapsed(0);
    setTimerDay(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleIntervalChange = (interval: WorkIntervalMinutes) => {
    setIntervalMinutes(interval);
  };

  /** Manual upload: deep work done away from the timer. */
  const handleManualLog = async (minutes: number) => {
    if (!session || savingManualLog) return;
    setSavingManualLog(true);
    try {
      const updated = await addLoggedMinutes(session.id, minutes);
      if (updated) {
        setSession(updated);
        setLogVersion((v) => v + 1);
      }
      setShowManualLog(false);
    } catch (error) {
      console.error('Error logging manual minutes:', error);
    } finally {
      setSavingManualLog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-neutral-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="app-screen focus-screen fade-in">
      {/* Audio element */}
      <audio ref={audioRef} src="/brd.mp3" preload="auto" />

      {/* Header */}
      <div className="focus-head">
        <div className="focus-brain">
          <Brain width={22} height={22} />
        </div>
        <div>
          <span className="eyebrow">{format(parseISO(today), "d MMM yyyy", { locale: es })}</span>
          <h2>Deep Work</h2>
        </div>
      </div>

      {/* Target Selector — hidden once a target is locked in for the day */}
      {!session && (
        <TargetSelector
          selectedTarget={null}
          isLocked={false}
          onSelect={handleSelectTarget}
        />
      )}

      {/* Progress bar only makes sense once a target exists */}
      {session && (
        <>
          <ProgressBar
            loggedMinutes={session.logged_minutes}
            targetMinutes={session.target_minutes}
            onEditTarget={() => openTargetEditor(today, format(parseISO(today), 'd/M/yyyy'), session)}
          />
          <button
            type="button"
            className="pill pill-ghost manual-log-btn"
            onClick={() => setShowManualLog(true)}
          >
            <Plus width={16} height={16} strokeWidth={2.4} />
            Agregar tiempo manualmente
          </button>
        </>
      )}

      {/* Timer + tracker — stacked on mobile (timer first); on desktop the
          tracker sits to the LEFT and timer to the RIGHT (see CSS order).
          The heatmap is always visible, even before today's target is set. */}
      <div className="focus-main mt-8">
        {session && (
          <div className="focus-timer-col">
            <Timer
              mode={mode}
              intervalMinutes={intervalMinutes}
              elapsedSeconds={elapsedSeconds}
              isRunning={isRunning}
              disabled={false}
              onModeChange={handleModeChange}
              onIntervalChange={handleIntervalChange}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
            />
          </div>
        )}
        <FocusHeatmap today={today} refreshKey={logVersion} onEditTarget={openTargetEditor} />
      </div>

      <ManualLogModal
        open={showManualLog}
        saving={savingManualLog}
        onClose={() => setShowManualLog(false)}
        onConfirm={handleManualLog}
      />

      <DayTargetModal
        key={editingTarget?.date ?? 'closed'}
        date={editingTarget?.date ?? null}
        title={editingTarget?.title ?? ''}
        session={editingTarget?.session ?? null}
        saving={savingTarget}
        deleteLockedReason={
          editingTarget && editingTarget.date === timerDay
            ? 'Detené el timer para borrar el objetivo de este día.'
            : undefined
        }
        onClose={() => setEditingTarget(null)}
        onSave={handleSaveTarget}
        onDelete={handleDeleteTarget}
      />
    </div>
  );
}
