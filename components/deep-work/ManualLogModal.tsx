'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const QUICK_ADD_MINUTES = [15, 30, 45, 60, 90];
/** A single manual entry can never exceed one full day. */
const MAX_MINUTES = 24 * 60;

interface ManualLogModalProps {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
}

/** Digits only; anything else (empty field included) counts as zero. */
function toNumber(value: string): number {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function sanitize(value: string): string {
  return value.replace(/\D/g, '').slice(0, 3);
}

function formatTotal(total: number): string {
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours > 0 && mins > 0) return `${hours} h ${mins} min`;
  if (hours > 0) return `${hours} h`;
  return `${mins} min`;
}

export function ManualLogModal({ open, saving, onClose, onConfirm }: ManualLogModalProps) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  if (!open) return null;

  const total = toNumber(hours) * 60 + toNumber(minutes);
  const isOverMax = total > MAX_MINUTES;
  const isValid = total > 0 && !isOverMax;

  const reset = () => {
    setHours('');
    setMinutes('');
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!isValid || saving) return;
    onConfirm(total);
    reset();
  };

  /** Chips accumulate so tapping +30 twice logs an hour. */
  const quickAdd = (amount: number) => {
    const next = Math.min(total + amount, MAX_MINUTES);
    const nextHours = Math.floor(next / 60);
    const nextMinutes = next % 60;
    setHours(nextHours > 0 ? String(nextHours) : '');
    setMinutes(nextMinutes > 0 ? String(nextMinutes) : '');
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>Registrar tiempo</strong>
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={handleClose}>
            <X width={20} height={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="card manual-card">
            <div className="manual-fields">
              <label className="manual-field">
                <span className="eyebrow">Horas</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  placeholder="0"
                  value={hours}
                  onChange={(e) => setHours(sanitize(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                />
              </label>
              <label className="manual-field">
                <span className="eyebrow">Minutos</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={minutes}
                  onChange={(e) => setMinutes(sanitize(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                />
              </label>
            </div>

            <div className="intv-row manual-quick">
              {QUICK_ADD_MINUTES.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className="intv-chip"
                  disabled={saving}
                  onClick={() => quickAdd(amount)}
                >
                  +{amount}m
                </button>
              ))}
            </div>

            <p className="daily-note manual-summary">
              {isOverMax
                ? 'Máximo 24 h por registro.'
                : total > 0
                  ? `Se sumarán ${formatTotal(total)} al total de hoy.`
                  : 'Ingresá cuánto tiempo trabajaste sin el temporizador.'}
            </p>
          </div>

          <button
            type="button"
            className="pill pill-accent checklist-confirm"
            disabled={!isValid || saving}
            onClick={handleConfirm}
          >
            {saving ? 'Guardando…' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
