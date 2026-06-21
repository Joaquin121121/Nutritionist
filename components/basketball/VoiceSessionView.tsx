'use client';

import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Mic, MicOff, Check, Trophy, RotateCcw, Volume2, Timer } from 'lucide-react';
import { CIRCUITS } from '@/data/circuits';
import { useVoiceSession } from '@/lib/voice/useVoiceSession';
import { circuitsTotals, saveBasketballSession, getDailyLog, upsertDailyLog } from '@/lib/database';
import type { FitnessActivity } from '@/types';

function pctColor(pct: number): string {
  if (pct >= 70) return 'text-primary-600';
  if (pct >= 50) return 'text-accent-600';
  return 'text-danger-600';
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoiceSessionView() {
  const {
    status,
    snapshot,
    partial,
    feedback,
    lastShot,
    error,
    remainingSec,
    start,
    stop,
    reset,
    simulateFromClip,
  } = useVoiceSession();
  const [saved, setSaved] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const savedRef = useRef(false);
  const [showTest, setShowTest] = useState(false);

  // Client-only: reveal the dev simulation control (avoids SSR hydration drift).
  useEffect(() => {
    setShowTest(
      process.env.NODE_ENV !== 'production' ||
        new URLSearchParams(window.location.search).has('test')
    );
  }, []);

  const circuit = CIRCUITS[snapshot.circuitIndex];
  const result = snapshot.results[snapshot.circuitIndex];
  const currentSpot = result?.spots[snapshot.spotIndex];
  const totals = circuitsTotals(snapshot.results);

  // Persist once the session is finished.
  useEffect(() => {
    if (status !== 'finished' || savedRef.current) return;
    savedRef.current = true;
    setSaved('saving');
    const date = format(new Date(), 'yyyy-MM-dd');
    (async () => {
      try {
        await saveBasketballSession(date, snapshot.results);
        // mark a basketball training fitness activity for the day
        const log = await getDailyLog(date);
        const existing = log?.fitness_activities ?? [];
        if (!existing.some((a) => a.type === 'basketball_training')) {
          const next: FitnessActivity[] = [
            ...existing,
            { type: 'basketball_training', timestamp: new Date().toISOString() },
          ];
          await upsertDailyLog(date, { fitness_activities: next });
        }
        setSaved('done');
      } catch (e) {
        console.error('save session failed', e);
        setSaved('error');
      }
    })();
  }, [status, snapshot.results]);

  // Dev/test bridge: expose live state + simulation to Playwright.
  useEffect(() => {
    if (!showTest) return;
    (window as unknown as { __bb?: unknown }).__bb = {
      status,
      snapshot,
      totals,
      feedback,
      saved,
      simulate: simulateFromClip,
    };
  }, [status, snapshot, totals, feedback, saved, simulateFromClip]);

  const isLive = status === 'listening';
  const isLoading = status === 'loading';

  return (
    <div className="app-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pt-1">
        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
          <Mic className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <span className="eyebrow">Voz en vivo</span>
          <h1 className="text-xl font-bold text-neutral-800 leading-tight">Entrenamiento por Voz</h1>
        </div>
      </div>

      {/* Workout countdown (25-minute cap) */}
      {(status === 'listening' || status === 'paused') && (
        <div
          className={`card p-3 mb-5 flex items-center justify-between ${
            remainingSec <= 60 ? 'bg-danger-50 border-danger-200' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <Timer
              className={`w-4 h-4 ${remainingSec <= 60 ? 'text-danger-600' : 'text-neutral-500'}`}
            />
            <span className="text-sm text-neutral-600">Tiempo restante</span>
          </div>
          <span
            className={`text-lg font-bold tabular-nums ${
              remainingSec <= 60 ? 'text-danger-600' : 'text-neutral-800'
            }`}
          >
            {fmtTime(remainingSec)}
          </span>
        </div>
      )}

      {/* Last-shot flash + mic control */}
      <div className="card p-5 mb-5 flex flex-col items-center text-center">
        {status === 'finished' ? (
          <FinishedBlock totals={totals} saved={saved} />
        ) : (
          <>
            <ShotFlash lastShot={lastShot} listening={isLive} />
            <div className="flex items-center gap-3 mt-5">
              {isLive ? (
                <button onClick={stop} className="pill pill-ghost" aria-label="Pausar microfono">
                  <MicOff className="w-4 h-4" /> Pausar
                </button>
              ) : (
                <button
                  onClick={start}
                  disabled={isLoading}
                  className="pill pill-accent"
                  aria-label="Activar microfono"
                >
                  <Mic className="w-4 h-4" />
                  {isLoading ? 'Cargando modelo…' : status === 'paused' ? 'Reanudar' : 'Empezar a escuchar'}
                </button>
              )}
              {(status === 'paused' || status === 'listening') && (
                <button onClick={reset} className="pill pill-ghost" aria-label="Reiniciar sesion">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
            {partial && isLive && (
              <p className="text-xs text-neutral-400 mt-3">
                escuchando: <span className="font-medium text-neutral-500">{partial || '…'}</span>
              </p>
            )}
            {error && <p className="text-sm text-danger-600 mt-3">{error}</p>}
          </>
        )}
      </div>

      {/* Spoken feedback banner */}
      {feedback && status !== 'finished' && (
        <div className="card p-3 mb-5 flex items-start gap-2 bg-primary-50 border-primary-200">
          <Volume2 className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
          <p className="text-sm text-neutral-700">{feedback}</p>
        </div>
      )}

      {/* Current circuit + spots */}
      {status !== 'finished' && circuit && result && (
        <div className="card p-5 mb-5">
          <div className="flex items-center justify-between mb-1">
            <span className="eyebrow">
              Circuito {snapshot.circuitIndex + 1} de {CIRCUITS.length}
            </span>
            <span className="text-sm font-semibold text-neutral-500 tabular-nums">
              {result.makes}/{result.attempts}
            </span>
          </div>
          <h2 className="text-lg font-bold text-neutral-800 mb-4">
            {circuit.emoji} {circuit.name}
          </h2>

          {/* spots */}
          <div className="flex gap-2 mb-4">
            {result.spots.map((spot, i) => {
              const isCurrent = i === snapshot.spotIndex;
              const done = spot.attempts >= circuit.shotsPerSpot;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-[13px] border p-2 text-center transition-colors ${
                    isCurrent
                      ? 'border-primary-500 bg-primary-50'
                      : done
                        ? 'border-success-400 bg-success-400/10'
                        : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-neutral-500 mb-1">
                    {done && <Check className="w-3 h-3 text-success-500" />}
                    Spot {i + 1}
                  </div>
                  <div className="text-sm font-bold text-neutral-800 tabular-nums">
                    {spot.makes}/{spot.attempts}
                  </div>
                  <div className="text-[10px] text-neutral-400 tabular-nums">de {circuit.shotsPerSpot}</div>
                </div>
              );
            })}
          </div>

          {/* current spot progress bar */}
          {currentSpot && (
            <div>
              <div className="flex justify-between text-xs text-neutral-500 mb-1">
                <span>Spot {snapshot.spotIndex + 1} en curso</span>
                <span className="tabular-nums">
                  {currentSpot.attempts}/{circuit.shotsPerSpot} tiros
                </span>
              </div>
              <div className="bar">
                <i style={{ width: `${(currentSpot.attempts / circuit.shotsPerSpot) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session total + circuit overview */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="eyebrow">Sesion completa</span>
          <span className={`text-lg font-bold tabular-nums ${pctColor(totals.score)}`}>
            {totals.totalAttempts > 0 ? `${Math.round(totals.score)}%` : '—'}
          </span>
        </div>
        <div className="space-y-2">
          {snapshot.results.map((r, i) => {
            const cfg = CIRCUITS[i];
            const total = cfg.spots * cfg.shotsPerSpot;
            const isCurrent = i === snapshot.circuitIndex && status !== 'finished';
            const pct = r.attempts > 0 ? (r.makes / r.attempts) * 100 : 0;
            return (
              <div key={r.id} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{cfg.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${isCurrent ? 'font-bold text-primary-600' : 'font-medium text-neutral-700'}`}
                    >
                      {cfg.name}
                    </span>
                    <span className="text-xs text-neutral-500 tabular-nums">
                      {r.attempts}/{total}
                      {r.attempts > 0 && (
                        <span className={`ml-2 font-semibold ${pctColor(pct)}`}>{Math.round(pct)}%</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showTest && (
        <button
          onClick={() => simulateFromClip()}
          className="pill pill-ghost mt-5 w-full justify-center"
        >
          ▶ Simular con clip de prueba
        </button>
      )}
    </div>
  );
}

function ShotFlash({
  lastShot,
  listening,
}: {
  lastShot: { outcome: 'make' | 'miss'; id: number } | null;
  listening: boolean;
}) {
  if (!lastShot) {
    return (
      <div className="flex flex-col items-center">
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center ${
            listening ? 'bg-primary-100 animate-pulse' : 'bg-neutral-100'
          }`}
        >
          <Mic className={`w-10 h-10 ${listening ? 'text-primary-600' : 'text-neutral-400'}`} />
        </div>
        <p className="text-sm text-neutral-500 mt-3">
          {listening ? 'Escuchando… di “make” o “miss”' : 'Pulsa para empezar'}
        </p>
      </div>
    );
  }
  const isMake = lastShot.outcome === 'make';
  return (
    <div className="flex flex-col items-center">
      <div
        key={lastShot.id}
        className={`w-24 h-24 rounded-full flex items-center justify-center animate-pulse-scale ${
          isMake ? 'bg-success-400/20' : 'bg-danger-400/20'
        }`}
      >
        <span className={`text-2xl font-extrabold ${isMake ? 'text-success-600' : 'text-danger-600'}`}>
          {isMake ? 'MAKE' : 'MISS'}
        </span>
      </div>
      <p className="text-sm text-neutral-500 mt-3">{listening ? 'Escuchando…' : 'En pausa'}</p>
    </div>
  );
}

function FinishedBlock({
  totals,
  saved,
}: {
  totals: { totalMakes: number; totalAttempts: number; score: number };
  saved: 'idle' | 'saving' | 'done' | 'error';
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mb-3">
        <span className="text-3xl font-extrabold text-white">{Math.round(totals.score)}%</span>
      </div>
      <div className="flex items-center gap-2 text-primary-600 mb-1">
        <Trophy className="w-5 h-5" />
        <span className="font-bold">Sesion completada!</span>
      </div>
      <p className="text-sm text-neutral-500">
        {totals.totalMakes} de {totals.totalAttempts} tiros
      </p>
      <p className="text-xs text-neutral-400 mt-2">
        {saved === 'saving' && 'Guardando…'}
        {saved === 'done' && '✓ Guardado'}
        {saved === 'error' && 'No se pudo guardar'}
      </p>
    </div>
  );
}
