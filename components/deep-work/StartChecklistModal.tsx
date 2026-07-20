'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

interface ChecklistItem {
  id: string;
  emoji: string;
  label: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'water', emoji: '💧', label: 'Agua llena' },
  { id: 'phone', emoji: '📵', label: 'Celular en otra habitación' },
  { id: 'desk', emoji: '🧹', label: 'Escritorio despejado' },
];

interface StartChecklistModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function StartChecklistModal({ open, onClose, onConfirm }: StartChecklistModalProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (!open) return null;

  const allChecked = CHECKLIST_ITEMS.every((item) => checked[item.id]);

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClose = () => {
    setChecked({});
    onClose();
  };

  const handleConfirm = () => {
    if (!allChecked) return;
    setChecked({});
    onConfirm();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>Antes de empezar</strong>
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={handleClose}>
            <X width={20} height={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="card list-card">
            {CHECKLIST_ITEMS.map((item, i) => {
              const on = checked[item.id] || false;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="ck-row"
                  data-last={i === CHECKLIST_ITEMS.length - 1}
                  onClick={() => toggle(item.id)}
                >
                  <span className="ck-emoji">{item.emoji}</span>
                  <span className="ck-label" data-on={on}>{item.label}</span>
                  <span className="ck-box" data-on={on}>
                    {on && <Check width={13} height={13} strokeWidth={2.8} />}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="pill pill-accent checklist-confirm"
            disabled={!allChecked}
            onClick={handleConfirm}
          >
            Comenzar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
