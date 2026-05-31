'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tracking-enabled';
const EVENT_NAME = 'tracking-enabled-change';

/** Read the current tracking setting. Defaults to true when unset. */
export function isTrackingEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const value = localStorage.getItem(STORAGE_KEY);
  return value === null ? true : value === 'true';
}

/** Persist the tracking setting and notify listeners in this window. */
export function setTrackingEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, String(enabled));
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
