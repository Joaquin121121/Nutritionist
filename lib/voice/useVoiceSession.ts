'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CIRCUITS } from '@/data/circuits';
import type { ShotOutcome } from '@/types';
import { CircuitSession, type SessionEvent, type SessionSnapshot } from './circuitEngine';
import { VoiceRecognizer, recognizePcm } from './recognizer';
import { Speaker, phraseForEvent, startCirclePhrase } from './speech';

export type VoiceStatus =
  | 'idle'
  | 'loading'
  | 'listening'
  | 'paused'
  | 'finished'
  | 'error';

export interface LastShot {
  outcome: ShotOutcome;
  id: number;
}

export interface UseVoiceSession {
  status: VoiceStatus;
  snapshot: SessionSnapshot;
  partial: string;
  feedback: string;
  lastShot: LastShot | null;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
  /** Dev/dogfood: drive the whole pipeline from a recorded clip (no mic). */
  simulateFromClip: (url?: string) => Promise<void>;
}

function freshSnapshot(): SessionSnapshot {
  return new CircuitSession(CIRCUITS).snapshot();
}

export function useVoiceSession(): UseVoiceSession {
  const sessionRef = useRef<CircuitSession | null>(null);
  const speakerRef = useRef<Speaker | null>(null);
  const recognizerRef = useRef<VoiceRecognizer | null>(null);
  const shotIdRef = useRef(0);

  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(freshSnapshot);
  const [partial, setPartial] = useState('');
  const [feedback, setFeedback] = useState('');
  const [lastShot, setLastShot] = useState<LastShot | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preload the model + speech voices once mounted.
  useEffect(() => {
    VoiceRecognizer.preload();
    if (!speakerRef.current) speakerRef.current = new Speaker();
    return () => {
      recognizerRef.current?.stop();
      speakerRef.current?.cancel();
    };
  }, []);

  const handleEvents = useCallback((events: SessionEvent[]) => {
    const speaker = speakerRef.current;
    for (const ev of events) {
      if (ev.type === 'shot') {
        shotIdRef.current += 1;
        setLastShot({ outcome: ev.outcome, id: shotIdRef.current });
      }
      const phrase = phraseForEvent(ev);
      if (phrase) {
        setFeedback(phrase);
        speaker?.say(phrase);
      }
      if (ev.type === 'session-complete') {
        setStatus('finished');
        recognizerRef.current?.stop();
      }
    }
  }, []);

  const onWord = useCallback(
    (outcome: ShotOutcome) => {
      const session = sessionRef.current;
      if (!session || session.isFinished) return;
      const events = session.record(outcome);
      setSnapshot(session.snapshot());
      handleEvents(events);
    },
    [handleEvents]
  );

  const ensureSession = useCallback(() => {
    if (!sessionRef.current || sessionRef.current.isFinished) {
      sessionRef.current = new CircuitSession(CIRCUITS);
      setSnapshot(sessionRef.current.snapshot());
    }
    return sessionRef.current;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!speakerRef.current) speakerRef.current = new Speaker();
    const session = ensureSession();

    // resume from pause: just restart the recognizer
    setStatus('loading');
    try {
      const recognizer = new VoiceRecognizer({
        onWord,
        onPartial: (t) => setPartial(t),
        onError: () => {},
      });
      recognizerRef.current = recognizer;
      await recognizer.start();
      setStatus('listening');
      // announce the current circuit
      const phrase = startCirclePhrase(session.circuits[session.snapshot().circuitIndex]);
      setFeedback(phrase);
      speakerRef.current?.say(phrase);
    } catch (err) {
      setError(
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Microphone permission denied.'
          : String(err)
      );
      setStatus('error');
    }
  }, [ensureSession, onWord]);

  const stop = useCallback(async () => {
    await recognizerRef.current?.stop();
    recognizerRef.current = null;
    setStatus((s) => (s === 'finished' ? s : 'paused'));
    speakerRef.current?.cancel();
  }, []);

  const reset = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    speakerRef.current?.cancel();
    sessionRef.current = new CircuitSession(CIRCUITS);
    setSnapshot(sessionRef.current.snapshot());
    setStatus('idle');
    setFeedback('');
    setPartial('');
    setLastShot(null);
    setError(null);
  }, []);

  const simulateFromClip = useCallback(
    async (url = '/test/voice-sample.m4a', repeat = 1) => {
      setError(null);
      if (!speakerRef.current) speakerRef.current = new Speaker();
      // mute speech during fast simulation to avoid a queue pileup
      const speaker = speakerRef.current;
      const prevEnabled = speaker.enabled;
      speaker.enabled = false;
      sessionRef.current = new CircuitSession(CIRCUITS);
      setSnapshot(sessionRef.current.snapshot());
      setStatus('listening');
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ac = new AC();
        const decoded = await ac.decodeAudioData(buf.slice(0));
        const ch = decoded.numberOfChannels;
        const len = decoded.length;
        const mono = new Float32Array(len);
        for (let c = 0; c < ch; c++) {
          const d = decoded.getChannelData(c);
          for (let i = 0; i < len; i++) mono[i] += d[i] / ch;
        }
        const srcRate = decoded.sampleRate;
        let pcm = mono;
        if (srcRate !== 16000) {
          const dstLen = Math.floor((len * 16000) / srcRate);
          const out = new Float32Array(dstLen);
          const ratio = srcRate / 16000;
          for (let i = 0; i < dstLen; i++) {
            const pos = i * ratio;
            const i0 = Math.floor(pos);
            const i1 = Math.min(i0 + 1, len - 1);
            out[i] = mono[i0] * (1 - (pos - i0)) + mono[i1] * (pos - i0);
          }
          pcm = out;
        }
        for (let r = 0; r < repeat; r++) {
          if (sessionRef.current?.isFinished) break;
          await recognizePcm(pcm, 16000, (outcome) => onWord(outcome));
        }
      } catch (err) {
        setError(String(err));
        setStatus('error');
      } finally {
        speaker.enabled = prevEnabled;
        setStatus((s) => (s === 'error' ? s : sessionRef.current?.isFinished ? 'finished' : 'paused'));
      }
    },
    [onWord]
  );

  return {
    status,
    snapshot,
    partial,
    feedback,
    lastShot,
    error,
    start,
    stop,
    reset,
    simulateFromClip,
  };
}
