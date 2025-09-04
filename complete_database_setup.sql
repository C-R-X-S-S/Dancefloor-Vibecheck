-- ===== COMPLETE DATABASE SETUP FOR REECORDS VIBECHECK =====
-- This script will completely drop and recreate both your player_events and leaderboard tables.
-- It ensures all columns, indexes, RLS policies, and helper functions are correctly set up.

-- WARNING: This will DELETE ALL DATA in your existing 'player_events' and 'leaderboard' tables.
-- If you have data you wish to preserve, please back it up before running this script.

-- Drop existing tables completely (CASCADE ensures dependent objects like indexes are also dropped)
DROP TABLE IF EXISTS player_events CASCADE;
DROP TABLE IF EXISTS leaderboard CASCADE;

-- ===== PLAYER EVENTS TABLE =====
-- This table stores all comprehensive game analytics and player event data.
CREATE TABLE player_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  player_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Device information (JSONB for flexible device data)
  device_info JSONB,
  
  -- Session and player data
  is_first_time BOOLEAN,
  duration_ms INTEGER,
  final_score INTEGER,
  highest_score INTEGER,
  
  -- Game state data
  game_state TEXT,
  current_score INTEGER,
  dancers_left INTEGER,
  
  -- Event-specific data (JSONB for flexible event data)
  data JSONB,
  
  -- Engagement and performance data
  action TEXT,
  context JSONB,
  metric TEXT,
  value NUMERIC,
  
  -- Milestone and progression data
  milestone TEXT,
  milestones JSONB,
  days_since_first_seen INTEGER,
  
  -- URL tracking
  url TEXT,
  
  -- Score tracking
  score INTEGER,
  
  -- Engagement heartbeat
  active_gameplay_time_ms INTEGER,
  
  -- Game start data
  autopilot_mode BOOLEAN,
  
  -- Dancer events
  dancer_id INTEGER,
  exit_direction TEXT,
  dancers_remaining INTEGER,
  dancer_state TEXT,
  record_type TEXT,
  collision_position JSONB,
  
  -- Emoji events
  emoji_type TEXT,
  throw_position JSONB,
  velocity JSONB,
  click_position JSONB,
  records_count INTEGER,
  
  -- Dancer leaving
  total_dancers_left INTEGER,
  
  -- Device info specific fields
  device_type TEXT,
  platform TEXT,
  browser TEXT,
  os TEXT,
  screen_size TEXT,
  viewport_size TEXT,
  pixel_ratio NUMERIC,
  is_touch BOOLEAN
);

-- ===== LEADERBOARD TABLE =====
-- This table stores player high scores for the in-game leaderboard display.
CREATE TABLE leaderboard (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT,
  player_email TEXT,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== ALL INDEXES FOR PERFORMANCE =====
-- These indexes will speed up your queries on the player_events table.
CREATE INDEX idx_player_events_player_id ON player_events(player_id);
CREATE INDEX idx_player_events_session_id ON player_events(session_id);
CREATE INDEX idx_player_events_event_type ON player_events(event_type);
CREATE INDEX idx_player_events_timestamp ON player_events(timestamp);
CREATE INDEX idx_player_events_created_at ON player_events(created_at);

-- GIN indexes for JSONB columns (for efficient querying of JSONB content)
CREATE INDEX idx_player_events_device_info ON player_events USING GIN (device_info);
CREATE INDEX idx_player_events_data ON player_events USING GIN (data);
CREATE INDEX idx_player_events_context ON player_events USING GIN (context);
CREATE INDEX idx_player_events_milestones ON player_events USING GIN (milestones);
CREATE INDEX idx_player_events_collision_position ON player_events USING GIN (collision_position);
CREATE INDEX idx_player_events_throw_position ON player_events USING GIN (throw_position);
CREATE INDEX idx_player_events_velocity ON player_events USING GIN (velocity);
CREATE INDEX idx_player_events_click_position ON player_events USING GIN (click_position);

-- Indexes for leaderboard table
CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX idx_leaderboard_created_at ON leaderboard(created_at);

-- ===== ROW LEVEL SECURITY (RLS) POLICIES =====
-- RLS ensures that data access is controlled and secure.

-- Enable RLS on both tables
ALTER TABLE player_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy for player_events: Allow anonymous users to insert and read all analytics events
CREATE POLICY "Allow all operations on player_events" 
ON player_events FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- Policies for leaderboard: Allow anonymous users to submit and read scores
CREATE POLICY "Allow anonymous score submissions" 
ON leaderboard FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Allow anonymous score reading" 
ON leaderboard FOR SELECT 
TO anon 
USING (true);

-- ===== HELPER FUNCTIONS (for easier analytics queries) =====

-- Function to get device statistics from player_events
CREATE OR REPLACE FUNCTION get_device_stats()
RETURNS TABLE (
  device_type TEXT,
  platform TEXT,
  browser TEXT,
  os TEXT,
  event_count BIGINT,
  unique_players BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.device_type,
    pe.platform,
    pe.browser,
    pe.os,
    COUNT(*) as event_count,
    COUNT(DISTINCT pe.player_id) as unique_players
  FROM player_events pe
  WHERE pe.device_type IS NOT NULL
  GROUP BY 
    pe.device_type,
    pe.platform,
    pe.browser,
    pe.os
  ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get a summary of analytics for a specific player
CREATE OR REPLACE FUNCTION get_player_analytics(player_id_param TEXT)
RETURNS TABLE (
  total_sessions BIGINT,
  total_events BIGINT,
  first_seen TIMESTAMP WITH TIME ZONE,
  last_active TIMESTAMP WITH TIME ZONE,
  total_playtime_ms BIGINT,
  highest_score_achieved INTEGER,
  device_types TEXT[],
  platforms TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT pe.session_id) as total_sessions,
    COUNT(*) as total_events,
    MIN(pe.created_at) as first_seen,
    MAX(pe.created_at) as last_active,
    COALESCE(SUM(pe.active_gameplay_time_ms), 0) as total_playtime_ms,
    MAX(pe.highest_score) as highest_score_achieved,
    ARRAY_AGG(DISTINCT pe.device_type) FILTER (WHERE pe.device_type IS NOT NULL) as device_types,
    ARRAY_AGG(DISTINCT pe.platform) FILTER (WHERE pe.platform IS NOT NULL) as platforms
  FROM player_events pe
  WHERE pe.player_id = player_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get game performance metrics
CREATE OR REPLACE FUNCTION get_game_performance_metrics()
RETURNS TABLE (
  total_games BIGINT,
  average_score NUMERIC,
  highest_score INTEGER,
  total_playtime_hours NUMERIC,
  most_common_event TEXT,
  event_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT pe.session_id) as total_games,
    AVG(pe.final_score) as average_score,
    MAX(pe.highest_score) as highest_score,
    SUM(pe.active_gameplay_time_ms) / 3600000.0 as total_playtime_hours,
    pe.event_type as most_common_event,
    COUNT(*) as event_count
  FROM player_events pe
  WHERE pe.event_type = 'game_over'
  GROUP BY pe.event_type
  ORDER BY event_count DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ===== VERIFICATION QUERY =====
-- This will confirm that both tables were created successfully.
SELECT 
  'Tables created successfully!' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_name IN ('player_events', 'leaderboard')
AND table_schema = 'public';
