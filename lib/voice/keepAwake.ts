'use client';

/**
 * Keeps the phone screen awake while a live voice session is running.
 *
 * On mobile the screen dims and locks after a few seconds without touch input.
 * Once that happens the page is backgrounded, its AudioContext is suspended and
 * mic capture stops — the session goes deaf without any visible error. The
 * Screen Wake Lock API prevents it (Chrome/Android 84+, Safari iOS 16.4+), and
 * needs a secure context, same as the mic.
 *
 * Two details matter in practice:
 *  - the browser releases the lock whenever the page becomes hidden, so it has
 *    to be re-requested on `visibilitychange`;
 *  - `request()` rejects while the page is hidden (and on unsupported or
 *    non-secure origins), so acquiring must tolerate failure and report it —
 *    the UI tells the user to disable auto-lock instead of silently going deaf.
 */

interface WakeLockSentinelLike {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', cb: () => void): void;
}

interface WakeLockLike {
  request(type: 'screen'): Promise<WakeLockSentinelLike>;
}

function wakeLockApi(): WakeLockLike | null {
  if (typeof navigator === 'undefined') return null;
  const wl = (navigator as unknown as { wakeLock?: WakeLockLike }).wakeLock;
  return wl && typeof wl.request === 'function' ? wl : null;
}

/** Client-only: whether this browser exposes the Screen Wake Lock API. */
export function isWakeLockSupported(): boolean {
  return wakeLockApi() !== null;
}

export class KeepAwake {
  private sentinel: WakeLockSentinelLike | null = null;
  private wanted = false;
  // Bumped on every enable/disable/re-acquire so a request still in flight can
  // tell it has been superseded and release itself instead of leaking a lock.
  private generation = 0;

  private onVisibility = () => {
    if (this.wanted && !this.sentinel && document.visibilityState === 'visible') {
      void this.acquire(++this.generation);
    }
  };

  /** True while a screen lock is actually held. */
  get isHeld(): boolean {
    return this.sentinel !== null;
  }

  /** Hold the screen awake until `disable()`. Resolves to whether it worked. */
  async enable(): Promise<boolean> {
    if (this.wanted && this.sentinel) return true;
    if (!this.wanted) {
      this.wanted = true;
      document.addEventListener('visibilitychange', this.onVisibility);
    }
    return this.acquire(++this.generation);
  }

  async disable(): Promise<void> {
    this.generation += 1;
    this.wanted = false;
    document.removeEventListener('visibilitychange', this.onVisibility);
    const sentinel = this.sentinel;
    this.sentinel = null;
    try {
      await sentinel?.release();
    } catch {
      // already released by the browser
    }
  }

  private async acquire(generation: number): Promise<boolean> {
    const api = wakeLockApi();
    if (!api) return false;
    try {
      const sentinel = await api.request('screen');
      // superseded (disabled, or re-acquired) while the request was in flight
      if (generation !== this.generation || !this.wanted) {
        void sentinel.release().catch(() => {});
        return false;
      }
      this.sentinel = sentinel;
      sentinel.addEventListener('release', () => {
        if (this.sentinel === sentinel) this.sentinel = null;
      });
      return true;
    } catch {
      this.sentinel = null;
      return false;
    }
  }
}
