'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfYear, endOfYear } from 'date-fns';
import { SwipeableProgress } from '@/components/progress';
import type { TimeRange } from '@/components/progress';
import { getDailyLogsRange, getAllBasketballSessions } from '@/lib/database';
import type { DailyLog, BasketballSession } from '@/types';

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [sessions, setSessions] = useState<BasketballSession[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const yearStart = format(startOfYear(today), 'yyyy-MM-dd');
      const yearEnd = format(endOfYear(today), 'yyyy-MM-dd');

      const [logsData, sessionsData] = await Promise.all([
        getDailyLogsRange(yearStart, yearEnd),
        getAllBasketballSessions(),
      ]);

      setLogs(logsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-neutral-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-6">
      <SwipeableProgress
        logs={logs}
        sessions={sessions}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
    </div>
  );
}
