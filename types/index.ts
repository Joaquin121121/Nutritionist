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

// Fitness Types
export type FitnessActivityType = 'weightlifting' | 'basketball_pickup' | 'basketball_training';

export interface FitnessActivity {
  type: FitnessActivityType;
  timestamp: string;
}

export interface FitnessActivityDef {
  id: FitnessActivityType;
  name: string;
  emoji: string;
}

export interface DailyLog {
  id: string;
  date: string;
  variable_meals: string[];
  fixed_meals: Record<string, boolean>;
  cheat_meals: CheatMeal[];
  fitness_activities: FitnessActivity[];
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
  fitness_streak: number;
  longest_fitness_streak: number;
  last_fitness_day: string | null;
}

export interface DayStatus {
  hasData: boolean;
  isClean: boolean;
  variableMealsCount: number;
  fixedMealsCompleted: number;
  cheatMealsCount: number;
  fitnessActivitiesCount: number;
  hasFitness: boolean;
}

export interface PeriodStats {
  period: 'week' | 'month' | 'year';
  cleanDays: number;
  totalDays: number;
  percentage: number;
}

// Basketball Types
export interface ShotData {
  midrange_cs?: number;
  midrange_pullup?: number;
  triple_cs_1?: number;
  flotadora?: number;
  bandeja_izq?: number;
  bandeja_der?: number;
  triples_cs?: number;
  libres?: number;
}

export interface BasketballSession {
  id: string;
  date: string;
  shots: ShotData;
  total_makes: number;
  total_attempts: number;
  score: number;
  created_at: string;
}

export interface ShotType {
  id: keyof ShotData;
  name: string;
  attempts: number;
  emoji: string;
}

export interface ShotStats {
  id: keyof ShotData;
  name: string;
  totalMakes: number;
  totalAttempts: number;
  percentage: number;
  sessionsCount: number;
  averagePerSession: number;
}

// Deep Work Types
export interface DeepWorkTask {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  sort_order: number;
}
