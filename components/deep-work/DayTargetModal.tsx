'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { DeepWorkSession, DeepWorkTargetMinutes } from '@/types';
import { TARGET_OPTIONS } from './TargetSelector';

interface DayTargetModalProps {
  /** Day being edited as `yyyy-MM-dd`; null keeps the modal closed. */
  date: string | null;
  /** Human-readable day for the header, e.g. "5/10/2026". */
  title: string;
  /** The day's current session, or null when it has no target yet. */
  session: DeepWorkSession | null;
  saving: boolean;
  /** Set while a timer is running on this day, so its minutes have a target to land on. */
  deleteLockedReason?: string;
  onClose: () => void;
  onSave: (target: DeepWorkTargetMinutes) => void;
  onDelete: () => void;
}

/** Mount with `key={date}` so the draft resets when another day is opened. */
export function DayTargetModal({
  date,
  title,
  session,
  saving,
  deleteLockedReason,
  onClose,
  onSave,
  onDelete,
}: DayTargetModalProps) {
  const [draft, setDraft] = useState<DeepWorkTargetMinutes | null>(session?.target_minutes ?? null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Which action `saving` belongs to, so only that button shows progress.
  const [deleting, setDeleting] = useState(false);

  if (!date) return null;

  const unchanged = draft === (session?.target_minutes ?? null);
  const logged = session?.logged_minutes ?? 0;

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSave = () => {
    if (saving || unchanged || draft === null) return;
    setDeleting(false);
    onSave(draft);
  };

  const handleDelete = () => {
    if (saving) return;
    setDeleting(true);
    onDelete();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>Objetivo · {title}</strong>
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={handleClose}>
            <X width={20} height={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="card manual-card">
            <div className="target-grid">
              {TARGET_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="target-cell"
                  data-on={draft === t}
                  disabled={saving}
                  onClick={() => setDraft(t)}
                >
                  <b>{t}</b>
                  <span>min</span>
                </button>
              ))}
            </div>
            <p className="daily-note">
              {session
                ? `Registrado: ${logged} min · Meta actual: ${session.target_minutes} min`
                : 'Este día no tiene objetivo.'}
            </p>
          </div>

          <button
            type="button"
            className="pill pill-accent checklist-confirm"
            disabled={saving || unchanged || draft === null}
            onClick={handleSave}
          >
            {saving && !deleting ? 'Guardando…' : session ? 'Guardar' : 'Fijar objetivo'}
          </button>

          {session && !confirmingDelete && (
            <button
              type="button"
              className="pill pill-ghost note-delete"
              disabled={saving || !!deleteLockedReason}
              onClick={() => setConfirmingDelete(true)}
            >
              Borrar objetivo
            </button>
          )}
          {session && confirmingDelete && (
            <>
              <p className="daily-note target-delete-warn">
                {logged > 0
                  ? `Se borrará el objetivo junto con los ${logged} min registrados.`
                  : 'Se borrará el objetivo de este día.'}
              </p>
              <div className="target-delete-row">
                <button
                  type="button"
                  className="pill pill-ghost"
                  disabled={saving}
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="pill pill-ghost note-delete"
                  disabled={saving}
                  onClick={handleDelete}
                >
                  {saving && deleting ? 'Borrando…' : 'Sí, borrar'}
                </button>
              </div>
            </>
          )}
          {session && deleteLockedReason && <p className="daily-note">{deleteLockedReason}</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}
