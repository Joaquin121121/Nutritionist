'use client';

import { useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui';

interface ResetButtonProps {
  onReset: () => void;
}

export function ResetButton({ onReset }: ResetButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    onReset();
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-in">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
            Reiniciar lista?
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Se desmarcaran todos los items de la lista de compras.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowConfirm(false)}
            >
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleReset}>
              Reiniciar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      onClick={() => setShowConfirm(true)}
      className="w-full flex items-center justify-center gap-2"
    >
      <RotateCcw className="w-5 h-5" />
      Nueva lista de compras
    </Button>
  );
}
