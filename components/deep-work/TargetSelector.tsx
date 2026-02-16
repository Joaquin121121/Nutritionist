"use client";

import { Lock, Target } from "lucide-react";
import type { DeepWorkTargetMinutes } from "@/types";

interface TargetSelectorProps {
  selectedTarget: DeepWorkTargetMinutes | null;
  isLocked: boolean;
  onSelect: (target: DeepWorkTargetMinutes) => void;
}

const TARGET_OPTIONS: { value: DeepWorkTargetMinutes; label: string }[] = [
  { value: 90, label: "1.5h" },
  { value: 180, label: "3h" },
  { value: 270, label: "4.5h" },
  { value: 360, label: "6h" },
];

export function TargetSelector({
  selectedTarget,
  isLocked,
  onSelect,
}: TargetSelectorProps) {
  if (isLocked && selectedTarget) {
    const selected = TARGET_OPTIONS.find((o) => o.value === selectedTarget);
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Meta del dia
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {selected?.label}
            </span>
            <Lock className="w-4 h-4 text-neutral-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Meta del dia
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {TARGET_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className="py-3 px-4 rounded-lg font-semibold text-lg transition-all
              bg-neutral-100 dark:bg-neutral-700
              text-neutral-700 dark:text-neutral-300
              hover:bg-primary-100 hover:text-primary-700
              dark:hover:bg-primary-900/30 dark:hover:text-primary-400
              active:scale-95"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
