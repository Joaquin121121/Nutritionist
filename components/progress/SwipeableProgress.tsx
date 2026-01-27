'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SwipeIndicator } from './SwipeIndicator';
import { HealthProgressView } from './HealthProgressView';
import { BasketballStatsView } from './BasketballStatsView';
import type { TimeRange } from './TimeRangeSelector';
import type { DailyLog, BasketballSession } from '@/types';

interface SwipeableProgressProps {
  logs: DailyLog[];
  sessions: BasketballSession[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function SwipeableProgress({
  logs,
  sessions,
  timeRange,
  onTimeRangeChange
}: SwipeableProgressProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;
    const width = containerRef.current.clientWidth;
    const newIndex = Math.round(scrollLeft / width);
    setActiveIndex(newIndex);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="flex flex-col min-h-0">
      <SwipeIndicator total={2} active={activeIndex} />

      <div
        ref={containerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          className="w-full flex-shrink-0 px-4 pb-6"
          style={{ scrollSnapAlign: 'start' }}
        >
          <HealthProgressView
            logs={logs}
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
          />
        </div>

        <div
          className="w-full flex-shrink-0 px-4 pb-6"
          style={{ scrollSnapAlign: 'start' }}
        >
          <BasketballStatsView sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
