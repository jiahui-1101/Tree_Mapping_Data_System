-- Subsystem 3: Visitor Engagement & Education
-- PostgreSQL-ready schema for the production version of the visitor backend.
-- The current prototype uses JSON runtime persistence, but these tables map
-- directly to the SS3 backend store and API contracts.

CREATE TABLE IF NOT EXISTS visitor_sessions (
  session_id VARCHAR(80) PRIMARY KEY,
  visitor_type VARCHAR(30) NOT NULL DEFAULT 'guest',
  display_name VARCHAR(120) NOT NULL DEFAULT 'Guest Visitor',
  role VARCHAR(30) NOT NULL DEFAULT 'Visitor',
  preferred_language VARCHAR(5) NOT NULL DEFAULT 'en',
  first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tree_public_profiles (
  tree_id VARCHAR(20) PRIMARY KEY,
  local_name VARCHAR(120) NOT NULL,
  family VARCHAR(120) NOT NULL,
  origin TEXT NOT NULL,
  morphology TEXT NOT NULL,
  ecology_role TEXT NOT NULL,
  cultural_use TEXT NOT NULL,
  seasonal_interest TEXT NOT NULL,
  visitor_fact TEXT NOT NULL,
  conservation_note TEXT NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_collections (
  collection_id VARCHAR(30) PRIMARY KEY,
  session_id VARCHAR(80) NOT NULL REFERENCES visitor_sessions(session_id),
  tree_id VARCHAR(20) NOT NULL,
  source VARCHAR(30) NOT NULL DEFAULT 'qr',
  collected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, tree_id)
);

CREATE TABLE IF NOT EXISTS visitor_scan_events (
  scan_id VARCHAR(30) PRIMARY KEY,
  session_id VARCHAR(80) NOT NULL REFERENCES visitor_sessions(session_id),
  tree_id VARCHAR(20) NOT NULL,
  zone VARCHAR(80) NOT NULL,
  source VARCHAR(30) NOT NULL DEFAULT 'qr',
  role_detected VARCHAR(30) NOT NULL DEFAULT 'Visitor',
  routed_to VARCHAR(80) NOT NULL DEFAULT 'SS3-M3-A Tree ID Card',
  scan_result VARCHAR(30) NOT NULL DEFAULT 'success',
  scanned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_route_plans (
  route_id VARCHAR(30) PRIMARY KEY,
  session_id VARCHAR(80) NOT NULL REFERENCES visitor_sessions(session_id),
  selected_preferences TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  total_distance VARCHAR(20) NOT NULL,
  fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_route_stops (
  route_id VARCHAR(30) NOT NULL REFERENCES visitor_route_plans(route_id),
  tree_id VARCHAR(20) NOT NULL,
  stop_order INT NOT NULL,
  PRIMARY KEY (route_id, stop_order)
);

CREATE TABLE IF NOT EXISTS visitor_chat_logs (
  chat_id VARCHAR(30) PRIMARY KEY,
  session_id VARCHAR(80) NOT NULL REFERENCES visitor_sessions(session_id),
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  intent VARCHAR(60) NOT NULL,
  provider VARCHAR(60) NOT NULL,
  fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
  asked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visitor_scan_events_zone ON visitor_scan_events(zone);
CREATE INDEX IF NOT EXISTS idx_visitor_scan_events_tree ON visitor_scan_events(tree_id);
CREATE INDEX IF NOT EXISTS idx_visitor_collections_session ON visitor_collections(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_route_plans_session ON visitor_route_plans(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_chat_logs_session ON visitor_chat_logs(session_id);

