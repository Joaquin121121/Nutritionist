-- ============================================
-- Meal Tracker - Supabase Database Setup
-- ============================================
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Create daily_logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  variable_meals JSONB DEFAULT '[]',
  fixed_meals JSONB DEFAULT '{}',
  cheat_meals JSONB DEFAULT '[]',
  fitness_activities JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);

-- 2. Create grocery_items table
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key VARCHAR(100) NOT NULL UNIQUE,
  checked BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMPTZ
);

-- 3. Create streaks table (without fitness columns initially for compatibility)
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_clean_day DATE
);

-- 4. Create basketball_sessions table
CREATE TABLE IF NOT EXISTS basketball_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  shots JSONB NOT NULL,
  total_makes INTEGER NOT NULL,
  total_attempts INTEGER DEFAULT 290,
  score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_basketball_sessions_date ON basketball_sessions(date);

-- 5. Disable Row Level Security (single-user app)
ALTER TABLE daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE basketball_sessions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- MIGRATIONS: Add columns if they don't exist
-- ============================================

-- Add fitness_activities column to daily_logs if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'daily_logs' AND column_name = 'fitness_activities') THEN
    ALTER TABLE daily_logs ADD COLUMN fitness_activities JSONB DEFAULT '[]';
  END IF;
END $$;

-- Add fitness columns to streaks if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'streaks' AND column_name = 'fitness_streak') THEN
    ALTER TABLE streaks ADD COLUMN fitness_streak INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'streaks' AND column_name = 'longest_fitness_streak') THEN
    ALTER TABLE streaks ADD COLUMN longest_fitness_streak INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'streaks' AND column_name = 'last_fitness_day') THEN
    ALTER TABLE streaks ADD COLUMN last_fitness_day DATE;
  END IF;
END $$;

-- ============================================
-- SEED DATA: Initialize with default values
-- ============================================

-- Initialize streaks with a single row (after columns are added)
INSERT INTO streaks (id, current_streak, longest_streak, fitness_streak, longest_fitness_streak)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Seed grocery items
INSERT INTO grocery_items (item_key, checked) VALUES
  ('pechuga_pollo', false),
  ('atun', false),
  ('bife', false),
  ('huevos', false),
  ('macarrones', false),
  ('arroz', false),
  ('lentejas', false),
  ('pan', false),
  ('avena', false),
  ('broccoli', false),
  ('espinaca', false),
  ('zanahorias', false),
  ('bananas', false),
  ('manzanas', false),
  ('frutillas', false),
  ('yogur_griego', false),
  ('queso_rallado', false),
  ('queso_cremoso', false),
  ('leche', false),
  ('salsa_soja', false),
  ('cacao', false),
  ('pasta_mani', false),
  ('creatina', false),
  ('barras_zafran', false)
ON CONFLICT (item_key) DO NOTHING;

-- Done! Your database is ready.
