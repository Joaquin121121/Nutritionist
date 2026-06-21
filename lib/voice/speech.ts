'use client';

/**
 * Voice feedback via the Web Speech Synthesis API, plus phrase builders that
 * turn circuit-session events into spoken cues.
 */
import type { Circuit } from '@/types';
import type { SessionEvent } from './circuitEngine';

export class Speaker {
  private synth: SpeechSynthesis | null;
  private voice: SpeechSynthesisVoice | null = null;
  enabled = true;

  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.pickVoice();
    // voices can load asynchronously
    if (this.synth && 'onvoiceschanged' in this.synth) {
      this.synth.onvoiceschanged = () => this.pickVoice();
    }
  }

  private pickVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (!voices.length) return;
    this.voice =
      voices.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|zira|google/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0];
  }

  /** Speak immediately, cancelling anything mid-sentence (cues are short). */
  say(text: string, { interrupt = true }: { interrupt?: boolean } = {}) {
    if (!this.enabled || !this.synth) return;
    if (interrupt) this.synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (this.voice) u.voice = this.voice;
    u.rate = 1.05;
    u.pitch = 1;
    u.volume = 1;
    this.synth.speak(u);
  }

  cancel() {
    this.synth?.cancel();
  }
}

function pct(n: number): number {
  return Math.round(n);
}

/** Build the spoken cue for a session event (or null if it shouldn't speak). */
export function phraseForEvent(ev: SessionEvent): string | null {
  switch (ev.type) {
    case 'spot-complete':
      return `Next spot. Spot ${ev.nextSpotIndex + 1}.`;
    case 'circuit-complete':
      if (ev.nextCircuit) {
        return `Circuit finished: ${ev.makes} of ${ev.attempts} shots, ${pct(
          ev.pct
        )} percent. Get ready for the next circuit: ${ev.nextCircuit.name}.`;
      }
      // last circuit: the session-complete event speaks instead
      return null;
    case 'session-complete':
      return `Session finished! ${ev.totalMakes} of ${ev.totalAttempts} shots, ${pct(
        ev.pct
      )} percent. Great work.`;
    case 'time-expired':
      return `Time's up! Twenty-five minute workout complete. ${ev.totalMakes} of ${
        ev.totalAttempts
      } shots, ${pct(ev.pct)} percent. Great work.`;
    default:
      return null;
  }
}

/** Spoken cue when a circuit begins (used at session start). */
export function startCirclePhrase(circuit: Circuit): string {
  return `Starting ${circuit.name}. ${circuit.shotsPerSpot} shots per spot, ${circuit.spots} ${
    circuit.spots === 1 ? 'spot' : 'spots'
  }. Spot 1.`;
}
