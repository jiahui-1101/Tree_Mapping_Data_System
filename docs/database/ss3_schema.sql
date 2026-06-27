-- Subsystem 3: Visitor Engagement & Education
-- PostgreSQL-ready schema for the production version of the visitor backend.
-- The current prototype uses JSON runtime persistence, but these tables map
-- directly to the SS3 backend store and API contracts.

CREATE TABLE IF NOT EXISTS visitor_sessions (
  session_id VARCHAR(80) PRIMARY KEY,
  preferred_language VARCHAR(5) NOT NULL DEFAULT 'en',
