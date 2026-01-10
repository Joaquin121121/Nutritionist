import { getSupabase } from './supabase';
import type { DailyLog, GroceryItemDB, StreakData, CheatMeal } from '@/types';
import { DEFAULT_FIXED_MEALS } from '@/data/meals';

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
  lastCleanDay: string | null
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('streaks')
    .upsert({
      id: STREAK_ID,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_clean_day: lastCleanDay,
    });

  if (error) {
    console.error('Error updating streak data:', error);
    throw error;
  }
}

// ============ Stats Helpers ============

export function isCleanDay(log: DailyLog | null): boolean {
  if (!log) return false;
  return log.cheat_meals.length === 0;
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
