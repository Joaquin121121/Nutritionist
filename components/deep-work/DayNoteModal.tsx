'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const MAX_LENGTH = 280;

interface DayNoteModalProps {
  /** Day being edited as `yyyy-MM-dd`; null keeps the modal closed. */
  date: string | null;
  /** Human-readable day for the header, e.g. "5/10/2026". */
  title: string;
  initialNote: string;
  saving: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
}

/** Mount with `key={date}` so the draft resets when another day is opened. */
export function DayNoteModal({ date, title, initialNote, saving, onClose, onSave }: DayNoteModalProps) {
  const [draft, setDraft] = useState(initialNote);

  if (!date) return null;

  const hasExisting = initialNote.trim().length > 0;
  const unchanged = draft.trim() === initialNote.trim();

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSave = () => {
    if (saving || unchanged) return;
    onSave(draft);
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>Nota · {title}</strong>
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={handleClose}>
            <X width={20} height={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="card manual-card">
            <textarea
              className="note-input"
              autoFocus
              rows={4}
              maxLength={MAX_LENGTH}
              placeholder="¿Qué pasó este día?"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter saves; Shift+Enter keeps the newline.
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
            <p className="daily-note note-count">
              {draft.length}/{MAX_LENGTH}
            </p>
          </div>

          <button
            type="button"
            className="pill pill-accent checklist-confirm"
            disabled={saving || unchanged}
            onClick={handleSave}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          {hasExisting && (
            <button
              type="button"
              className="pill pill-ghost note-delete"
              disabled={saving}
              onClick={() => onSave('')}
            >
              Borrar nota
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
