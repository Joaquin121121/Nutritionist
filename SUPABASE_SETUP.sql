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

-- 3. Create streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_clean_day DATE
);

-- 4. Disable Row Level Security (single-user app)
ALTER TABLE daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE streaks DISABLE ROW LEVEL SECURITY;

-- 5. Initialize streaks with a single row
INSERT INTO streaks (id, current_streak, longest_streak)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 6. Seed grocery items
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
