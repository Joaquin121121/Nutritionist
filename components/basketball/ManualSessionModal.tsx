'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Eraser, ListChecks } from 'lucide-react';
import { CIRCUITS, circuitTotalShots } from '@/data/circuits';

export interface ManualCircuitEntry {
  makes: number;
  attempts: number;
}

interface ManualSessionModalProps {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onConfirm: (entries: ManualCircuitEntry[]) => void;
}

function emptyEntries(): ManualCircuitEntry[] {
  return CIRCUITS.map(() => ({ makes: 0, attempts: 0 }));
}

function fullEntries(): ManualCircuitEntry[] {
  return CIRCUITS.map((c) => ({ makes: 0, attempts: circuitTotalShots(c) }));
}

function pctClass(pct: number): string {
  if (pct >= 70) return 'text-primary-600';
  if (pct >= 50) return 'text-accent-600';
  return 'text-danger-600';
}

export function ManualSessionModal({ open, saving, onClose, onConfirm }: ManualSessionModalProps) {
  const [entries, setEntries] = useState<ManualCircuitEntry[]>(emptyEntries);

  if (!open) return null;

  const totalMakes = entries.reduce((sum, e) => sum + e.makes, 0);
  const totalAttempts = entries.reduce((sum, e) => sum + e.attempts, 0);
  const score = totalAttempts > 0 ? (totalMakes / totalAttempts) * 100 : 0;
  const isValid = totalAttempts > 0;

  const reset = () => setEntries(emptyEntries());

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!isValid || saving) return;
    onConfirm(entries);
    reset();
  };

  /** Attempts is the ceiling for makes, so lowering it drags makes down too. */
  const setAttempts = (index: number, value: number) =>
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { attempts: value, makes: Math.min(e.makes, value) } : e))
    );

  const setMakes = (index: number, value: number) =>
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, makes: Math.min(value, e.attempts) } : e))
    );

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>Registrar sesion manual</strong>
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={handleClose}>
            <X width={20} height={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="daily-note manual-session-intro">
            Movi los sliders para cargar los tiros de una sesion que hiciste sin el microfono.
          </p>

          <div className="intv-row manual-session-actions">
            <button
              type="button"
              className="intv-chip"
              disabled={saving}
              onClick={() => setEntries(fullEntries())}
            >
              <ListChecks width={14} height={14} /> Circuitos completos
            </button>
            <button
              type="button"
              className="intv-chip"
              disabled={saving || totalAttempts === 0}
              onClick={reset}
            >
              <Eraser width={14} height={14} /> Limpiar
            </button>
          </div>

          {CIRCUITS.map((circuit, i) => {
            const entry = entries[i];
            const max = circuitTotalShots(circuit);
            const pct = entry.attempts > 0 ? (entry.makes / entry.attempts) * 100 : 0;
            return (
              <div key={circuit.id} className="card manual-session-card">
                <div className="manual-session-title">
                  <span>
                    {circuit.emoji} {circuit.name}
                  </span>
                  <span className="manual-session-score tabular-nums">
                    {entry.makes}/{entry.attempts}
                    {entry.attempts > 0 && (
                      <b className={pctClass(pct)}> {Math.round(pct)}%</b>
                    )}
                  </span>
                </div>

                <SliderRow
                  label="Intentos"
                  value={entry.attempts}
                  max={max}
                  disabled={saving}
                  onChange={(v) => setAttempts(i, v)}
                />
                <SliderRow
                  label="Aciertos"
                  value={entry.makes}
                  max={entry.attempts}
                  disabled={saving || entry.attempts === 0}
                  tone="make"
                  onChange={(v) => setMakes(i, v)}
                />
              </div>
            );
          })}

          <div className="card manual-session-total">
            <div>
              <span className="eyebrow">Sesion completa</span>
              <p className="manual-session-total-line tabular-nums">
                {totalMakes} de {totalAttempts} tiros
              </p>
            </div>
            <span className={`manual-session-total-pct tabular-nums ${pctClass(score)}`}>
              {totalAttempts > 0 ? `${Math.round(score)}%` : '—'}
            </span>
          </div>

          <p className="daily-note manual-summary">
            {isValid
              ? 'Se guardara como una sesion de hoy.'
              : 'Cargá al menos un intento para poder guardar.'}
          </p>

          <button
            type="button"
            className="pill pill-accent checklist-confirm"
            disabled={!isValid || saving}
            onClick={handleConfirm}
          >
            {saving ? 'Guardando…' : 'Guardar sesion'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SliderRow({
  label,
  value,
  max,
  disabled,
  tone = 'attempt',
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  disabled: boolean;
  tone?: 'attempt' | 'make';
  onChange: (value: number) => void;
}) {
  // A zero-length range would divide by zero; keep the track empty instead.
  const fill = max > 0 ? (value / max) * 100 : 0;
  return (
    <label className="slider-row">
      <span className="slider-label">{label}</span>
      <input
        type="range"
        className="slider"
        data-tone={tone}
        min={0}
        max={Math.max(max, 1)}
        step={1}
        value={value}
        disabled={disabled}
        aria-label={label}
        style={{ '--fill': `${fill}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="slider-value tabular-nums">{value}</span>
    </label>
  );
}
