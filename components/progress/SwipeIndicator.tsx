'use client';

interface SwipeIndicatorProps {
  total: number;
  active: number;
}

export function SwipeIndicator({ total, active }: SwipeIndicatorProps) {
  return (
    <div className="flex justify-center gap-2 py-3">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            index === active
              ? 'bg-primary-500 scale-125'
              : 'bg-neutral-300 dark:bg-neutral-600'
          }`}
        />
      ))}
    </div>
  );
}
