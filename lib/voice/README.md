# Voice-tracked basketball sessions

Turn on the mic during a training session and call out **"make"** or **"miss"**
after each shot. The app tracks circuits → spots → shots live and gives spoken
feedback.

## How it works

```
mic (getUserMedia)                     recorded clip (decodeAudioData)
        │                                        │
        └──────────► 16 kHz PCM ◄────────────────┘
                          │
                  recognizer.ts  (vosk-browser, Kaldi WASM, offline)
                  grammar locked to ["make", "miss"]
                          │  emits "make" / "miss"
                          ▼
                  circuitEngine.ts  (pure state machine)
                   ├─ spot done   → "Next spot. Spot N."
                   ├─ circuit done→ "Circuit finished: a of b shots, c%. Next: <name>."
                   └─ session done→ "Session finished! ..."
                          │
                  speech.ts (SpeechSynthesis)  +  React UI  +  Supabase save
```

- **`recognizer.ts`** — wraps [`vosk-browser`]. The grammar is just two words, so
  recognition is fast and robust even for non-native pronunciation. `[unk]` is
  deliberately omitted: it greedily absorbs real words and tanks recall (verified
  against the test clip). Non-speech (ball bounces) lands on a silence endpoint and
  yields an empty result instead of a phantom word.
  - Live: `VoiceRecognizer` (mic → ScriptProcessor → `acceptWaveform`).
  - Offline/test: `recognizePcm()` (`acceptWaveformFloat`), same decoder.
- **`circuitEngine.ts`** — pure, framework-agnostic. Feed outcomes, get events.
- **`keepAwake.ts`** — holds a Screen Wake Lock while listening. Phones lock the
  screen after ~20s without touch input, which suspends the page and cuts mic
  capture; a hands-free session is dead without this. The lock is re-taken on
  every `visibilitychange`, since the browser drops it whenever the page hides.
- **`speech.ts`** — turns events into spoken cues.
- **`useVoiceSession.ts`** — React hook wiring recognizer + engine + speech, plus
  `simulateFromClip()` which drives the whole pipeline from a recorded clip (used
  for dogfooding and the dev "Simular con clip" button).

Circuits are defined in `data/circuits.ts`.

## Model

`public/models/vosk-model-small-en-us-0.15.tar.gz` (~41 MB, committed). It is the
standard small English Vosk model, repackaged from the official `.zip` into the
`.tar.gz` that `vosk-browser` expects.

## Testing

`/basketball/voicetest` decodes an audio file in-browser and reports the detected
outcome sequence vs. the expected one (edit distance). The reference clip lives at
`public/test/voice-sample.m4a` (gitignored — dev only). Against it the recognizer
reproduces the 27-word reference sequence with **edit distance 0**.

## Notes

- Mic capture needs a user gesture (the Start button) and a secure context.
  `localhost` is fine; to use it from a phone, serve over HTTPS.
- Screen Wake Lock needs the same secure context (Chrome/Android 84+, Safari iOS
  16.4+). Where it is unavailable or rejected, the UI says so and asks the user to
  raise the auto-lock timeout — better than going quietly deaf. If the phone does
  get locked anyway, the session detects the stall (no mic frames for 3s), shows a
  warning and resumes the suspended AudioContext when the page comes back.
- Everything runs offline in the browser — no audio leaves the device.
