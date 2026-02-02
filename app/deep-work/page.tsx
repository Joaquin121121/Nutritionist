'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Brain } from 'lucide-react';
import {
  TargetSelector,
  ProgressBar,
  Timer,
  DeepWorkHistory,
} from '@/components/deep-work';
import type { TimerMode } from '@/components/deep-work/Timer';
import {
  getDeepWorkSession,
  createDeepWorkSession,
  addLoggedMinutes,
} from '@/lib/database';
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

  // Timer state
  const [mode, setMode] = useState<TimerMode>('work');
  const [intervalMinutes, setIntervalMinutes] = useState<WorkIntervalMinutes>(90);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedElapsed, setPausedElapsed] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Load session on mount
  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      try {
        const data = await getDeepWorkSession(today);
        setSession(data);
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [today]);

  // Restore timer state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const state: StoredTimerState = JSON.parse(stored);
        if (state.date === today) {
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
  }, [today]);

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
          if (updated) setSession(updated);
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
  }, [session]);

  const handleSelectTarget = async (target: DeepWorkTargetMinutes) => {
    try {
      const newSession = await createDeepWorkSession(today, target);
      if (newSession) setSession(newSession);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleModeChange = (newMode: TimerMode) => {
    if (!isRunning) {
      setMode(newMode);
      setElapsedSeconds(0);
      setPausedElapsed(0);
    }
  };

  const handleStart = () => {
    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);

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
          if (updated) setSession(updated);
        } catch (error) {
          console.error('Error logging minutes:', error);
        }
      }
    }

    setIsRunning(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setPausedElapsed(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleIntervalChange = (interval: WorkIntervalMinutes) => {
    setIntervalMinutes(interval);
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-neutral-500">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Audio element */}
      <audio ref={audioRef} src="/brd.mp3" preload="auto" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
            Deep Work
          </h1>
          <p className="text-sm text-neutral-500">
            {format(new Date(), 'EEEE, d MMMM')}
          </p>
        </div>
      </div>

      {/* Target Selector / Locked Display */}
      <TargetSelector
        selectedTarget={session?.target_minutes ?? null}
        isLocked={session !== null}
        onSelect={handleSelectTarget}
      />

      {/* Show timer components only if session exists */}
      {session && (
        <>
          {/* Progress Bar */}
          <ProgressBar
            loggedMinutes={session.logged_minutes}
            targetMinutes={session.target_minutes}
          />

          {/* Unified Timer */}
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

          {/* History */}
          <DeepWorkHistory />
        </>
      )}
    </div>
  );
}
