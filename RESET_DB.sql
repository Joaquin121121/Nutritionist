-- ============================================
-- Reset DB: clear all logging/progress data
-- ============================================
-- Run this in your Supabase SQL Editor

-- Clear daily logs (nutrition tracking)
TRUNCATE TABLE daily_logs;

-- Clear basketball sessions
TRUNCATE TABLE basketball_sessions;

-- Clear deep work sessions
TRUNCATE TABLE deep_work_sessions;

-- Reset streaks to zero
UPDATE streaks
SET current_streak = 0,
    longest_streak = 0,
    last_clean_day = NULL,
    fitness_streak = 0,
    longest_fitness_streak = 0,
    last_fitness_day = NULL
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Done! All progress data has been reset.
