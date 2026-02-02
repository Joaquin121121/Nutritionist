import { getSupabase } from './supabase';
import type { DailyLog, GroceryItemDB, StreakData, CheatMeal, FitnessActivity, BasketballSession, ShotData, DeepWorkTask, DeepWorkSession, DeepWorkTargetMinutes } from '@/types';
import { DEFAULT_FIXED_MEALS } from '@/data/meals';
import { calculateSessionScore } from '@/data/shots';

// ============ Daily Logs ============

export async function getDailyLog(date: string): Promise<DailyLog | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching daily log:', error);
    throw error;
  }

  return data;
}

export async function upsertDailyLog(
  date: string,
  updates: {
    variable_meals?: string[];
    fixed_meals?: Record<string, boolean>;
    cheat_meals?: CheatMeal[];
    fitness_activities?: FitnessActivity[];
  }
): Promise<DailyLog | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const existing = await getDailyLog(date);

  const payload = {
    date,
    variable_meals: updates.variable_meals ?? existing?.variable_meals ?? [],
    fixed_meals: updates.fixed_meals ?? existing?.fixed_meals ?? DEFAULT_FIXED_MEALS,
    cheat_meals: updates.cheat_meals ?? existing?.cheat_meals ?? [],
    fitness_activities: updates.fitness_activities ?? existing?.fitness_activities ?? [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('daily_logs')
    .upsert(payload, { onConflict: 'date' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting daily log:', error);
    throw error;
  }

  return data;
}

export async function getDailyLogsRange(
  startDate: string,
  endDate: string
): Promise<DailyLog[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching daily logs range:', error);
    throw error;
  }

  return data ?? [];
}

// ============ Groceries ============

export async function getGroceryItems(): Promise<GroceryItemDB[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('grocery_items')
    .select('*')
    .order('item_key');

  if (error) {
    console.error('Error fetching grocery items:', error);
    throw error;
  }

  return data ?? [];
}

export async function toggleGroceryItem(
  itemKey: string,
  checked: boolean
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('grocery_items')
    .update({
      checked,
      checked_at: checked ? new Date().toISOString() : null,
    })
    .eq('item_key', itemKey);

  if (error) {
    console.error('Error toggling grocery item:', error);
    throw error;
  }
}

export async function resetAllGroceryItems(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('grocery_items')
    .update({ checked: false, checked_at: null })
    .neq('item_key', '');

  if (error) {
    console.error('Error resetting grocery items:', error);
    throw error;
  }
}

// ============ Streaks ============

const STREAK_ID = '00000000-0000-0000-0000-000000000001';

export async function getStreakData(): Promise<StreakData | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('id', STREAK_ID)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching streak data:', error);
    throw error;
  }

  return data;
}

export async function updateStreakData(
  currentStreak: number,
  longestStreak: number,
  lastCleanDay: string | null,
  fitnessStreak?: number,
  longestFitnessStreak?: number,
  lastFitnessDay?: string | null
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const payload: Record<string, unknown> = {
    id: STREAK_ID,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_clean_day: lastCleanDay,
  };

  if (fitnessStreak !== undefined) {
    payload.fitness_streak = fitnessStreak;
  }
  if (longestFitnessStreak !== undefined) {
    payload.longest_fitness_streak = longestFitnessStreak;
  }
  if (lastFitnessDay !== undefined) {
    payload.last_fitness_day = lastFitnessDay;
  }

  const { error } = await supabase
    .from('streaks')
    .upsert(payload);

  if (error) {
    console.error('Error updating streak data:', error);
    throw error;
  }
}

// ============ Basketball Sessions ============

export async function getBasketballSession(date: string): Promise<BasketballSession | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('basketball_sessions')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching basketball session:', error);
    throw error;
  }

  return data;
}

export async function getBasketballSessionsRange(
  startDate: string,
  endDate: string
): Promise<BasketballSession[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('basketball_sessions')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching basketball sessions range:', error);
    throw error;
  }

  return data ?? [];
}

export async function getAllBasketballSessions(): Promise<BasketballSession[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('basketball_sessions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching all basketball sessions:', error);
    throw error;
  }

  return data ?? [];
}

export async function saveBasketballSession(
  date: string,
  shots: ShotData
): Promise<BasketballSession | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { totalMakes, totalAttempts, score } = calculateSessionScore(shots);

  const { data, error } = await supabase
    .from('basketball_sessions')
    .insert({
      date,
      shots,
      total_makes: totalMakes,
      total_attempts: totalAttempts,
      score: Math.round(score * 100) / 100,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving basketball session:', error);
    throw error;
  }

  return data;
}

// ============ Stats Helpers ============

export function isCleanDay(log: DailyLog | null): boolean {
  if (!log) return false;
  return log.cheat_meals.length === 0;
}

export function hasFitnessActivity(log: DailyLog | null): boolean {
  if (!log) return false;
  return (log.fitness_activities?.length ?? 0) > 0;
}

export function calculateStats(logs: DailyLog[]): {
  cleanDays: number;
  totalDays: number;
  percentage: number;
} {
  const totalDays = logs.length;
  const cleanDays = logs.filter((log) => isCleanDay(log)).length;
  const percentage = totalDays > 0 ? Math.round((cleanDays / totalDays) * 100) : 0;

  return { cleanDays, totalDays, percentage };
}

export function calculateFitnessStats(logs: DailyLog[]): {
  fitnessDays: number;
  totalDays: number;
  percentage: number;
} {
  const totalDays = logs.length;
  const fitnessDays = logs.filter((log) => hasFitnessActivity(log)).length;
  const percentage = totalDays > 0 ? Math.round((fitnessDays / totalDays) * 100) : 0;

  return { fitnessDays, totalDays, percentage };
}

// ============ Deep Work Tasks ============

export async function getDeepWorkTasks(date: string): Promise<DeepWorkTask[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('deep_work_tasks')
    .select('*')
    .eq('date', date)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching deep work tasks:', error);
    throw error;
  }

  return data ?? [];
}

export async function getDeepWorkTasksRange(
  startDate: string,
  endDate: string
): Promise<DeepWorkTask[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('deep_work_tasks')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching deep work tasks range:', error);
    throw error;
  }

  return data ?? [];
}

export async function createDeepWorkTask(
  date: string,
  title: string
): Promise<DeepWorkTask | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  // Get max sort_order for this date
  const existingTasks = await getDeepWorkTasks(date);
  const maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.sort_order), -1);

  const { data, error } = await supabase
    .from('deep_work_tasks')
    .insert({
      date,
      title,
      completed: false,
      sort_order: maxOrder + 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating deep work task:', error);
    throw error;
  }

  return data;
}

export async function updateDeepWorkTask(
  id: string,
  updates: { title?: string; completed?: boolean; sort_order?: number; date?: string }
): Promise<DeepWorkTask | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const payload: Record<string, unknown> = { ...updates };
  if (updates.completed !== undefined) {
    payload.completed_at = updates.completed ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from('deep_work_tasks')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating deep work task:', error);
    throw error;
  }

  return data;
}

export async function deleteDeepWorkTask(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('deep_work_tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting deep work task:', error);
    throw error;
  }
}

// ============ Deep Work Sessions (Timer-based) ============

export async function getDeepWorkSession(date: string): Promise<DeepWorkSession | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('deep_work_sessions')
    .select('*')
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching deep work session:', error);
    throw error;
  }

  return data;
}

export async function createDeepWorkSession(
  date: string,
  targetMinutes: DeepWorkTargetMinutes
): Promise<DeepWorkSession | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('deep_work_sessions')
    .insert({
      date,
      target_minutes: targetMinutes,
      logged_minutes: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating deep work session:', error);
    throw error;
  }

  return data;
}

export async function addLoggedMinutes(
  sessionId: string,
  minutes: number
): Promise<DeepWorkSession | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  // First get current logged_minutes
  const { data: current, error: fetchError } = await supabase
    .from('deep_work_sessions')
    .select('logged_minutes')
    .eq('id', sessionId)
    .single();

  if (fetchError) {
    console.error('Error fetching session:', fetchError);
    throw fetchError;
  }

  const newTotal = (current?.logged_minutes ?? 0) + minutes;

  const { data, error } = await supabase
    .from('deep_work_sessions')
    .update({ logged_minutes: newTotal })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Error adding logged minutes:', error);
    throw error;
  }

  return data;
}

export async function getDeepWorkSessionsRange(
  startDate: string,
  endDate: string
): Promise<DeepWorkSession[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('deep_work_sessions')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching deep work sessions range:', error);
    throw error;
  }

  return data ?? [];
}
