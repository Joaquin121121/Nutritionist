'use client';

/**
 * Short confirmation sounds for each registered shot: a rising chime on a make,
 * a low thud on a miss. They are the immediate "I heard you" feedback — with the
 * phone lying on the floor you can't watch the screen, and the spoken cues only
 * fire on spot/circuit transitions.
 *
 * Files live in `public/sounds/`. Kept ~300 ms so they never overlap the next
 * shot call or the spoken transition cue.
 *
 * Mobile browsers won't play audio until a user gesture has unlocked it, and the
 * mic-start button is the only gesture in a hands-free session — hence
 * `unlock()`, which must be called synchronously from that handler (an `await`
 * before it loses the gesture on iOS).
 */
import type { ShotOutcome } from '@/types';

const SRC: Record<ShotOutcome, string> = {
  make: '/sounds/make.mp3',
  miss: '/sounds/miss.mp3',
};

export class Sfx {
  enabled = true;
  private els: Partial<Record<ShotOutcome, HTMLAudioElement>> = {};

  constructor() {
    if (typeof Audio === 'undefined') return;
    for (const name of Object.keys(SRC) as ShotOutcome[]) {
      const el = new Audio(SRC[name]);
      el.preload = 'auto';
      this.els[name] = el;
    }
  }

  /**
   * Prime playback from inside a user gesture. Starting each clip muted and
   * immediately rewinding it satisfies the autoplay policy without any audible
   * blip, so later `play()` calls from a timer or recognizer callback work.
   */
  unlock(): void {
    for (const el of Object.values(this.els)) {
      if (!el) continue;
      el.muted = true;
      const done = () => {
        el.pause();
        el.currentTime = 0;
        el.muted = false;
      };
      el.play().then(done, done);
    }
  }

  play(name: ShotOutcome): void {
    if (!this.enabled) return;
    const el = this.els[name];
    if (!el) return;
    try {
      el.currentTime = 0;
    } catch {
      // not seekable yet; play from wherever it is
    }
    // Rejects when the clip is still loading or playback is blocked — a missed
    // beep must never break shot tracking.
    void el.play().catch(() => {});
  }
}
