'use client';

/**
 * Dev-only harness to verify the make/miss recognizer against a recorded clip.
 * Decodes an audio file in-browser to 16 kHz PCM and runs the exact same
 * recognizer used live, then reports the detected outcome sequence.
 *
 * Playwright reads window.__VOICE_TEST__ after running.
 */
import { useCallback, useState } from 'react';
import { recognizePcm } from '@/lib/voice/recognizer';
import type { ShotOutcome } from '@/types';

const EXPECTED =
  'make miss miss make make miss make make miss miss make make make make make miss miss miss make make make miss miss miss miss make miss'.split(
    ' '
  ) as ShotOutcome[];

declare global {
  interface Window {
    __VOICE_TEST__?: {
      done: boolean;
      detected: string[];
      expected: string[];
      editDistance: number;
      error?: string;
    };
    runVoiceTest?: (url: string) => Promise<void>;
    __VOICE_GRAMMAR__?: string;
  }
}

function editDistance(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

async function decodeTo16k(url: string): Promise<Float32Array> {
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
  const dstRate = 16000;
  if (srcRate === dstRate) return mono;
  const dstLen = Math.floor((len * dstRate) / srcRate);
  const out = new Float32Array(dstLen);
  const ratio = srcRate / dstRate;
  for (let i = 0; i < dstLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, len - 1);
    const frac = pos - i0;
    out[i] = mono[i0] * (1 - frac) + mono[i1] * frac;
  }
  return out;
}

export default function VoiceTestPage() {
  const [status, setStatus] = useState('idle');
  const [detected, setDetected] = useState<string[]>([]);
  const [dist, setDist] = useState<number | null>(null);

  const run = useCallback(async (url = '/test/voice-sample.m4a') => {
    setStatus('decoding');
    window.__VOICE_TEST__ = { done: false, detected: [], expected: EXPECTED, editDistance: -1 };
    try {
      const pcm = await decodeTo16k(url);
      setStatus(`recognizing (${(pcm.length / 16000).toFixed(1)}s)`);
      const grammar = window.__VOICE_GRAMMAR__ ?? '["make", "miss"]';
      const words = await recognizePcm(pcm, 16000, undefined, grammar);
      const d = editDistance(EXPECTED, words);
      setDetected(words);
      setDist(d);
      setStatus('done');
      window.__VOICE_TEST__ = { done: true, detected: words, expected: EXPECTED, editDistance: d };
    } catch (err) {
      setStatus('error');
      window.__VOICE_TEST__ = {
        done: true,
        detected: [],
        expected: EXPECTED,
        editDistance: -1,
        error: String(err),
      };
    }
  }, []);

  if (typeof window !== 'undefined') window.runVoiceTest = run;

  const matches = detected.filter((w, i) => w === EXPECTED[i]).length;

  return (
    <div className="app-screen" style={{ fontFamily: 'monospace', fontSize: 13 }}>
      <h2>Voice recognizer test</h2>
      <button className="pill pill-accent" onClick={() => run()}>
        Run on test clip
      </button>
      <p>status: {status}</p>
      {dist !== null && (
        <>
          <p>
            count: {detected.length}/{EXPECTED.length} | edit distance: {dist} | positional:{' '}
            {matches}/{EXPECTED.length}
          </p>
          <p style={{ wordBreak: 'break-word' }}>exp: {EXPECTED.join(' ')}</p>
          <p style={{ wordBreak: 'break-word' }}>got: {detected.join(' ')}</p>
          <p style={{ wordBreak: 'break-word' }}>
            {detected.map((w, i) => (w === EXPECTED[i] ? '·' : 'X')).join('')}
          </p>
        </>
      )}
    </div>
  );
}
