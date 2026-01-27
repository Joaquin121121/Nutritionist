'use client';

import { useState, useEffect } from 'react';
import { MessageSquarePlus, Trash2 } from 'lucide-react';

interface NotesSectionProps {
  storageKey: string;
}

export function NotesSection({ storageKey }: NotesSectionProps) {
  const [note, setNote] = useState<string>('');
  const [showInput, setShowInput] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const savedNote = localStorage.getItem(storageKey);
    setNote(savedNote || '');
    setShowInput(false);
    setDraft('');
  }, [storageKey]);

  const handleSave = () => {
    if (draft.trim()) {
      localStorage.setItem(storageKey, draft.trim());
      setNote(draft.trim());
    }
    setShowInput(false);
    setDraft('');
  };

  const handleDelete = () => {
    localStorage.removeItem(storageKey);
    setNote('');
  };

  const handleCancel = () => {
    setShowInput(false);
    setDraft('');
  };

  const startEditing = () => {
    setDraft(note);
    setShowInput(true);
  };

  if (showInput) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe una nota..."
          className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          rows={3}
          autoFocus
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSave}
            disabled={!draft.trim()}
            className="flex-1 py-2 px-4 bg-primary-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
          >
            Guardar
          </button>
          <button
            onClick={handleCancel}
            className="py-2 px-4 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (note) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={startEditing}
            className="flex-1 text-left text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap"
          >
            {note}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-neutral-400 hover:text-danger-500 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="w-full flex items-center gap-2 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-500 hover:border-primary-400 hover:text-primary-500 transition-colors"
    >
      <MessageSquarePlus className="w-5 h-5" />
      <span className="text-sm font-medium">Agregar nota</span>
    </button>
  );
}
