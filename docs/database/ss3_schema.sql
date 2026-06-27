-- Subsystem 3: Visitor Engagement & Education
-- PostgreSQL-ready schema for the production version of the visitor backend.
-- The current prototype uses JSON runtime persistence, but these tables map
-- directly to the SS3 backend store and API contracts.

CREATE TABLE IF NOT EXISTS visitor_sessions (
  session_id VARCHAR(80) PRIMARY KEY,
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
