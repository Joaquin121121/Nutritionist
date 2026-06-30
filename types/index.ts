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
export type FitnessActivityType =
  | "weightlifting"
  | "basketball_pickup"
  | "basketball_training";

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
  /** When true the day is a rest/paused day: excluded from score and totals. */
  ignored?: boolean;
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
  period: "week" | "month" | "year";
  cleanDays: number;
  totalDays: number;
  percentage: number;
}

// Basketball Voice-Circuit Types
export interface Circuit {
  id: string;
  name: string;
  emoji: string;
  spots: number;
  shotsPerSpot: number;
}

/** Per-circuit result captured during a live session. */
export interface CircuitResult {
  id: string;
  name: string;
  makes: number;
  attempts: number;
  /** makes/attempts per spot, in order */
  spots: { makes: number; attempts: number }[];
}

export type ShotOutcome = 'make' | 'miss';

export interface BasketballSession {
  id: string;
  date: string;
  circuits: CircuitResult[];
  total_makes: number;
  total_attempts: number;
  score: number;
  created_at: string;
}

// Deep Work Types (legacy - kept for compatibility)
export interface DeepWorkTask {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  sort_order: number;
}

// Deep Work Session Types (new timer-based system)
export type DeepWorkTargetMinutes = 90 | 180 | 270 | 360;
export type WorkIntervalMinutes = 90 | 60 | 45 | 30;

export interface DeepWorkSession {
  id: string;
  date: string;
  target_minutes: DeepWorkTargetMinutes;
  logged_minutes: number;
  created_at: string;
}

export interface TimerState {
  isRunning: boolean;
  startTime: number | null; // timestamp when timer started
  intervalMinutes: WorkIntervalMinutes;
  elapsedSeconds: number; // for display purposes
}
