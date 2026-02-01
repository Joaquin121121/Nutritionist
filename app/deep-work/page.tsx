'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Brain } from 'lucide-react';
import {
  TargetSelector,
  ProgressBar,
  WorkTimer,
  RestTimer,
} from '@/components/deep-work';
import {
  getDeepWorkSession,
  createDeepWorkSession,
  addLoggedMinutes,
} from '@/lib/database';
import type { DeepWorkSession, DeepWorkTargetMinutes, WorkIntervalMinutes } from '@/types';

const STORAGE_KEY = 'deep-work-timer-state';
const REST_STORAGE_KEY = 'deep-work-rest-timer-state';

interface StoredTimerState {
  startTime: number;
  intervalMinutes: WorkIntervalMinutes;
  pausedElapsed: number; // seconds elapsed when paused
  isPaused: boolean;
  date: string;
}

interface StoredRestState {
  startTime: number;
  pausedRemaining: number; // seconds remaining when paused
  isPaused: boolean;
  date: string;
}

export default function DeepWorkPage() {
  const [session, setSession] = useState<DeepWorkSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Work timer state
  const [intervalMinutes, setIntervalMinutes] = useState<WorkIntervalMinutes>(90);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedElapsed, setPausedElapsed] = useState(0);

  // Rest timer state
  const [restAvailable, setRestAvailable] = useState(false);
  const [restRunning, setRestRunning] = useState(false);
  const [restRemaining, setRestRemaining] = useState(15 * 60);
  const [restStartTime, setRestStartTime] = useState<number | null>(null);
  const [restPausedRemaining, setRestPausedRemaining] = useState(15 * 60);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const workTimerRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

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
        // Only restore if it's from today
        if (state.date === today) {
          setIntervalMinutes(state.intervalMinutes);
          if (state.isPaused) {
            // Was paused - restore elapsed time
            setPausedElapsed(state.pausedElapsed);
            setElapsedSeconds(state.pausedElapsed);
          } else {
            // Was running - calculate elapsed from start time
            const now = Date.now();
            const elapsed = Math.floor((now - state.startTime) / 1000) + state.pausedElapsed;
            const totalSeconds = state.intervalMinutes * 60;

            if (elapsed >= totalSeconds) {
              // Timer completed while away
              handleWorkComplete(state.intervalMinutes);
              localStorage.removeItem(STORAGE_KEY);
            } else {
              setStartTime(state.startTime);
              setPausedElapsed(state.pausedElapsed);
              setElapsedSeconds(elapsed);
              setIsRunning(true);
            }
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Restore rest timer state
    const restStored = localStorage.getItem(REST_STORAGE_KEY);
    if (restStored) {
      try {
        const state: StoredRestState = JSON.parse(restStored);
        if (state.date === today) {
          setRestAvailable(true);
          if (state.isPaused) {
            setRestRemaining(state.pausedRemaining);
            setRestPausedRemaining(state.pausedRemaining);
          } else {
            const now = Date.now();
            const elapsed = Math.floor((now - state.startTime) / 1000);
            const remaining = Math.max(state.pausedRemaining - elapsed, 0);

            if (remaining <= 0) {
              setRestRemaining(0);
              localStorage.removeItem(REST_STORAGE_KEY);
            } else {
              setRestStartTime(state.startTime);
              setRestPausedRemaining(state.pausedRemaining);
              setRestRemaining(remaining);
              setRestRunning(true);
            }
          }
        } else {
          localStorage.removeItem(REST_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(REST_STORAGE_KEY);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  // Work timer tick
  useEffect(() => {
    if (isRunning && startTime) {
      workTimerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000) + pausedElapsed;
        const totalSeconds = intervalMinutes * 60;

        if (elapsed >= totalSeconds) {
          handleWorkComplete(intervalMinutes);
        } else {
          setElapsedSeconds(elapsed);
        }
      }, 1000);
    }

    return () => {
      if (workTimerRef.current) {
        clearInterval(workTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, startTime, pausedElapsed, intervalMinutes]);

  // Rest timer tick
  useEffect(() => {
    if (restRunning && restStartTime) {
      restTimerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - restStartTime) / 1000);
        const remaining = Math.max(restPausedRemaining - elapsed, 0);

        if (remaining <= 0) {
          setRestRemaining(0);
          setRestRunning(false);
          localStorage.removeItem(REST_STORAGE_KEY);
        } else {
          setRestRemaining(remaining);
        }
      }, 1000);
    }

    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
    };
  }, [restRunning, restStartTime, restPausedRemaining]);

  const handleWorkComplete = useCallback(async (minutes: number) => {
    setIsRunning(false);
    setElapsedSeconds(minutes * 60);
    setStartTime(null);
    setPausedElapsed(0);
    localStorage.removeItem(STORAGE_KEY);

    // Play audio
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }

    // Log minutes to session
    if (session) {
      try {
        const updated = await addLoggedMinutes(session.id, minutes);
        if (updated) setSession(updated);
      } catch (error) {
        console.error('Error logging minutes:', error);
      }
    }

    // Enable rest timer
    setRestAvailable(true);
    setRestRemaining(15 * 60);
    setRestPausedRemaining(15 * 60);
  }, [session]);

  const handleSelectTarget = async (target: DeepWorkTargetMinutes) => {
    try {
      const newSession = await createDeepWorkSession(today, target);
      if (newSession) setSession(newSession);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleStartWork = () => {
    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);

    // Save state to localStorage
    const state: StoredTimerState = {
      startTime: now,
      intervalMinutes,
      pausedElapsed,
      isPaused: false,
      date: today,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const handlePauseWork = () => {
    if (startTime) {
      const now = Date.now();
      const currentElapsed = Math.floor((now - startTime) / 1000) + pausedElapsed;
      setPausedElapsed(currentElapsed);
      setElapsedSeconds(currentElapsed);
    }
    setIsRunning(false);
    setStartTime(null);

    // Save paused state
    const state: StoredTimerState = {
      startTime: 0,
      intervalMinutes,
      pausedElapsed: elapsedSeconds,
      isPaused: true,
      date: today,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const handleStopWork = async () => {
    // Log elapsed time
    const minutesWorked = Math.floor(elapsedSeconds / 60);

    if (minutesWorked > 0 && session) {
      try {
        const updated = await addLoggedMinutes(session.id, minutesWorked);
        if (updated) setSession(updated);
      } catch (error) {
        console.error('Error logging minutes:', error);
      }
    }

    // Reset timer
    setIsRunning(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setPausedElapsed(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleIntervalChange = (interval: WorkIntervalMinutes) => {
    setIntervalMinutes(interval);
  };

  const handleStartRest = () => {
    const now = Date.now();
    setRestStartTime(now);
    setRestRunning(true);

    const state: StoredRestState = {
      startTime: now,
      pausedRemaining: restPausedRemaining,
      isPaused: false,
      date: today,
    };
    localStorage.setItem(REST_STORAGE_KEY, JSON.stringify(state));
  };

  const handlePauseRest = () => {
    if (restStartTime) {
      const now = Date.now();
      const elapsed = Math.floor((now - restStartTime) / 1000);
      const remaining = Math.max(restPausedRemaining - elapsed, 0);
      setRestPausedRemaining(remaining);
      setRestRemaining(remaining);
    }
    setRestRunning(false);
    setRestStartTime(null);

    const state: StoredRestState = {
      startTime: 0,
      pausedRemaining: restRemaining,
      isPaused: true,
      date: today,
    };
    localStorage.setItem(REST_STORAGE_KEY, JSON.stringify(state));
  };

  const handleResetRest = () => {
    setRestRemaining(15 * 60);
    setRestPausedRemaining(15 * 60);
    setRestRunning(false);
    setRestStartTime(null);
    localStorage.removeItem(REST_STORAGE_KEY);
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

          {/* Work Timer */}
          <WorkTimer
            intervalMinutes={intervalMinutes}
            elapsedSeconds={elapsedSeconds}
            isRunning={isRunning}
            disabled={false}
            onIntervalChange={handleIntervalChange}
            onStart={handleStartWork}
            onPause={handlePauseWork}
            onStop={handleStopWork}
          />

          {/* Rest Timer */}
          <RestTimer
            remainingSeconds={restRemaining}
            isRunning={restRunning}
            isAvailable={restAvailable}
            onStart={handleStartRest}
            onPause={handlePauseRest}
            onReset={handleResetRest}
          />
        </>
      )}
    </div>
  );
}
