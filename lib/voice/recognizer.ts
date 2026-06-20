'use client';

/**
 * make / miss speech recognizer built on vosk-browser (offline Kaldi WASM ASR).
 *
 * The recognizer is locked to a tiny grammar — just "make" and "miss" plus an
 * "[unk]" garbage word that absorbs court noise, claps, ball bounces, etc. With
 * the search space reduced to two words, recognition is fast and very robust,
 * even for non-native pronunciation.
 *
 * It is source-agnostic: feed it live mic frames (AudioBuffer) or a decoded
 * file's PCM (Float32Array). Both go through the same Kaldi decoder, so what we
 * verify against the test clip is exactly what runs live.
 */
import type { Model, KaldiRecognizer } from 'vosk-browser';
import type {
  ServerMessageResult,
  ServerMessagePartialResult,
} from 'vosk-browser/dist/interfaces';
import type { ShotOutcome } from '@/types';

export const MODEL_URL = '/models/vosk-model-small-en-us-0.15.tar.gz';
// Locked to exactly two words. Restricting the search space this hard makes
// recognition fast and accurate even for non-native pronunciation; non-speech
// (ball bounces, etc.) lands on a silence endpoint and yields empty results
// rather than a phantom word. (Adding "[unk]" greedily absorbs real words and
// destroys recall — verified against the test clip.)
const GRAMMAR = '["make", "miss"]';

export interface RecognizerEvents {
  onWord: (outcome: ShotOutcome) => void;
  onPartial?: (text: string) => void;
  onError?: (err: unknown) => void;
}

type VoskModule = typeof import('vosk-browser');

let cachedModelPromise: Promise<Model> | null = null;

async function loadModel(): Promise<Model> {
  if (!cachedModelPromise) {
    cachedModelPromise = (async () => {
      const vosk: VoskModule = await import('vosk-browser');
      return vosk.createModel(MODEL_URL);
    })();
  }
  return cachedModelPromise;
}

function extractWords(text: string): ShotOutcome[] {
  if (!text) return [];
  const out: ShotOutcome[] = [];
  for (const tok of text.trim().split(/\s+/)) {
    if (tok === 'make') out.push('make');
    else if (tok === 'miss') out.push('miss');
  }
  return out;
}

/**
 * Live recognizer: owns a mic stream + AudioContext and streams outcomes.
 */
export class VoiceRecognizer {
  private model: Model | null = null;
  private recognizer: KaldiRecognizer | null = null;
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private events: RecognizerEvents;
  private running = false;

  constructor(events: RecognizerEvents) {
    this.events = events;
  }

  /** Preload the model so the first "start" is instant. */
  static preload(): Promise<unknown> {
    return loadModel().catch(() => null);
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    this.model = await loadModel();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });

    const AC: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioContext = new AC();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const recognizer = new this.model.KaldiRecognizer(this.audioContext.sampleRate, GRAMMAR);
    recognizer.setWords(true);
    recognizer.on('result', (msg) => {
      const text = (msg as ServerMessageResult).result?.text ?? '';
      for (const w of extractWords(text)) this.events.onWord(w);
    });
    if (this.events.onPartial) {
      recognizer.on('partialresult', (msg) => {
        this.events.onPartial?.((msg as ServerMessagePartialResult).result?.partial ?? '');
      });
    }
    this.recognizer = recognizer;

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.node = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.node.onaudioprocess = (event) => {
      if (!this.recognizer) return;
      try {
        this.recognizer.acceptWaveform(event.inputBuffer);
      } catch (err) {
        this.events.onError?.(err);
      }
    };
    this.source.connect(this.node);
    this.node.connect(this.audioContext.destination);
  }

  async stop(): Promise<void> {
    this.running = false;
    try {
      this.node?.disconnect();
      this.source?.disconnect();
      this.stream?.getTracks().forEach((t) => t.stop());
      this.recognizer?.remove();
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
      }
    } catch {
      // ignore teardown errors
    }
    this.node = null;
    this.source = null;
    this.stream = null;
    this.recognizer = null;
    this.audioContext = null;
  }

  get isRunning(): boolean {
    return this.running;
  }
}

/**
 * Offline helper used by tests and dogfooding: run the recognizer over a fully
 * decoded 16 kHz PCM buffer and return the ordered list of outcomes.
 */
export async function recognizePcm(
  pcm: Float32Array,
  sampleRate = 16000,
  onWord?: (o: ShotOutcome) => void,
  grammar: string = GRAMMAR
): Promise<ShotOutcome[]> {
  const model = await loadModel();
  const recognizer = new model.KaldiRecognizer(sampleRate, grammar);
  recognizer.setWords(true);
  const results: ShotOutcome[] = [];
  let lastEventAt = Date.now();
  recognizer.on('result', (msg) => {
    lastEventAt = Date.now();
    const text = (msg as ServerMessageResult).result?.text ?? '';
    for (const w of extractWords(text)) {
      results.push(w);
      onWord?.(w);
    }
  });

  // Feed real Float32 copies (subarray views can mis-transfer to the worker),
  // paced so the decoder worker keeps up rather than getting flooded.
  const chunk = 3200; // 0.2s at 16k
  for (let i = 0; i < pcm.length; i += chunk) {
    const slice = pcm.slice(i, i + chunk);
    recognizer.acceptWaveformFloat(slice, sampleRate);
    await new Promise((r) => setTimeout(r, 12));
  }
  recognizer.retrieveFinalResult();
  // Wait for the worker to drain: stop once no new result has arrived for 1.5s,
  // or after a hard cap.
  const start = Date.now();
  while (Date.now() - start < 15000) {
    await new Promise((r) => setTimeout(r, 250));
    if (Date.now() - lastEventAt > 1500 && Date.now() - start > 2000) break;
  }
  recognizer.remove();
  return results;
}
