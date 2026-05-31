"use client";

import { Lock } from "lucide-react";
import type { DeepWorkTargetMinutes } from "@/types";

interface TargetSelectorProps {
  selectedTarget: DeepWorkTargetMinutes | null;
  isLocked: boolean;
  onSelect: (target: DeepWorkTargetMinutes) => void;
}

const TARGET_OPTIONS: DeepWorkTargetMinutes[] = [90, 180, 270, 360];

export function TargetSelector({
  selectedTarget,
  isLocked,
  onSelect,
}: TargetSelectorProps) {
  return (
    <section className="sec" style={{ marginTop: 20 }}>
      <div className="sec-head">
        <h3>Objetivo diario</h3>
        <span className="lock-btn" data-locked={isLocked}>
          <Lock width={13} height={13} strokeWidth={2} />
          {isLocked ? "Bloqueado" : "Sin fijar"}
        </span>
      </div>
      <div className="target-grid">
        {TARGET_OPTIONS.map((t) => (
          <button
            key={t}
            className="target-cell"
            data-on={selectedTarget === t}
            disabled={isLocked}
            onClick={() => onSelect(t)}
          >
            <b>{t}</b>
            <span>min</span>
          </button>
        ))}
      </div>
    </section>
  );
}
