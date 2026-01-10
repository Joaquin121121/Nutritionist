'use client';

import { Target, Check } from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
  completed: boolean;
}

interface WeeklyGoalsProps {
  goals: Goal[];
}

export function WeeklyGoals({ goals }: WeeklyGoalsProps) {
  if (goals.length === 0) return null;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary-500" />
        <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">
          Metas semanales
        </h3>
      </div>
      <div className="space-y-4">
        {goals.map((goal) => {
          const percentage = Math.min((goal.current / goal.target) * 100, 100);

          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {goal.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {goal.current}/{goal.target}
                  </span>
                  {goal.completed && (
                    <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
              <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    goal.completed ? 'bg-primary-500' : 'bg-primary-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
