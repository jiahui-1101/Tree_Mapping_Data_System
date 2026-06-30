-- IT Support Operations schema
-- MySQL-ready schema for service monitoring, access control, incidents, logs,
-- and audit events used by the IT Support dashboard.

CREATE DATABASE IF NOT EXISTS tree_mapping_data_system;
USE tree_mapping_data_system;

CREATE TABLE IF NOT EXISTS it_system_services (
  service_id VARCHAR(40) PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL,
  dependency VARCHAR(160) NOT NULL,
  status ENUM('online', 'degraded', 'offline') NOT NULL DEFAULT 'online',
  uptime VARCHAR(20) NOT NULL,
  latency VARCHAR(20) NOT NULL,
  last_checked VARCHAR(40) NOT NULL,
  note TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS it_access_users (
  user_id VARCHAR(80) PRIMARY KEY,
  display_name VARCHAR(120) NOT NULL,
  role VARCHAR(40) NOT NULL,
  status ENUM('active', 'inactive', 'locked') NOT NULL DEFAULT 'active',
  session_state VARCHAR(160) NOT NULL,
  last_login VARCHAR(60) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS it_support_tickets (
  ticket_id VARCHAR(30) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  category ENUM('QR', 'Security', 'Map', 'AI') NOT NULL,
  priority ENUM('urgent', 'high', 'normal') NOT NULL DEFAULT 'normal',
  status ENUM('open', 'investigating', 'resolved') NOT NULL DEFAULT 'open',
  owner VARCHAR(120) NOT NULL DEFAULT 'Unassigned',
  source VARCHAR(120) NOT NULL,
  detail TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS it_service_logs (
  log_id VARCHAR(30) PRIMARY KEY,
  service_id VARCHAR(40) NOT NULL,
  logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  level ENUM('info', 'warning', 'error') NOT NULL DEFAULT 'info',
  source VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  CONSTRAINT fk_it_service_logs_service
    FOREIGN KEY (service_id) REFERENCES it_system_services(service_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS it_audit_events (
  audit_id VARCHAR(30) PRIMARY KEY,
  logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  event_type VARCHAR(30) NOT NULL,
  actor_name VARCHAR(120) NOT NULL,
  role VARCHAR(40) NOT NULL,
  event_detail TEXT NOT NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low'
);

CREATE INDEX idx_it_services_status ON it_system_services(status);
CREATE INDEX idx_it_users_status ON it_access_users(status);
CREATE INDEX idx_it_tickets_status ON it_support_tickets(status);
CREATE INDEX idx_it_tickets_priority ON it_support_tickets(priority);
CREATE INDEX idx_it_logs_service ON it_service_logs(service_id);
CREATE INDEX idx_it_audit_events_type ON it_audit_events(event_type);
