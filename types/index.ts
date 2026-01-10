export interface VariableMeal {
  id: string;
  name: string;
  emoji: string;
  weeklyServings: number;
}

export interface FixedMeal {
  id: string;
  name: string;
  emoji: string;
}

export interface CheatMeal {
  name: string;
  emoji?: string;
}

export interface DailyLog {
  id: string;
  date: string;
  variable_meals: string[];
  fixed_meals: Record<string, boolean>;
  cheat_meals: CheatMeal[];
  created_at: string;
  updated_at: string;
}

export interface GroceryItemData {
  key: string;
  name: string;
  quantity: string;
  category: string;
}

export interface GroceryItemDB {
  id: string;
  item_key: string;
  checked: boolean;
  checked_at: string | null;
}

export interface StreakData {
  id: string;
  current_streak: number;
  longest_streak: number;
  last_clean_day: string | null;
}

export interface DayStatus {
  hasData: boolean;
  isClean: boolean;
  variableMealsCount: number;
  fixedMealsCompleted: number;
  cheatMealsCount: number;
}

export interface PeriodStats {
  period: 'week' | 'month' | 'year';
  cleanDays: number;
  totalDays: number;
  percentage: number;
}
