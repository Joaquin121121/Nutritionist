'use client';

import { useCallback, useEffect, useState } from 'react';
import { argentinaToday } from './time';

const STORAGE_KEY = 'tracking-enabled';
const PAUSED_SINCE_KEY = 'tracking-paused-since';
const EVENT_NAME = 'tracking-enabled-change';

/** Read the current tracking setting. Defaults to true when unset. */
export function isTrackingEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const value = localStorage.getItem(STORAGE_KEY);
  return value === null ? true : value === 'true';
}

/**
 * The Argentina date (`yyyy-MM-dd`) on which tracking was last paused, or null
 * when tracking is active. Every day from this date through "today" is treated
 * as an ignored (rest) day until tracking is resumed.
 */
export function getPausedSince(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PAUSED_SINCE_KEY);
}

/** Persist the tracking setting and notify listeners in this window. */
export function setTrackingEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  const wasEnabled = isTrackingEnabled();
  localStorage.setItem(STORAGE_KEY, String(enabled));
  if (!enabled && wasEnabled) {
    // Just paused — remember the Argentina day the pause began so the whole
    // span (including days the app isn't opened) can be ignored.
    localStorage.setItem(PAUSED_SINCE_KEY, argentinaToday());
  } else if (enabled) {
    localStorage.removeItem(PAUSED_SINCE_KEY);
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: enabled }));
}

/**
 * React hook for the global "tracking" switch.
 * When disabled, the app should stop recording any new progress data.
 */
export function useTrackingEnabled(): [boolean, (value: boolean) => void] {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isTrackingEnabled());

    const handler = () => setEnabled(isTrackingEnabled());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const update = useCallback((value: boolean) => {
    setTrackingEnabled(value);
    setEnabled(value);
  }, []);

  return [enabled, update];
}
