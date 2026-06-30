-- Subsystem 4: Map, QR and Interactive Visualization System
-- MySQL-ready schema aligned with Progress 2 M4-A to M4-E.
-- The current Express backend uses JSON runtime persistence for demo safety,
-- but these tables map directly to the SS4 API contracts.

CREATE DATABASE IF NOT EXISTS tree_mapping_data_system;
USE tree_mapping_data_system;

CREATE TABLE IF NOT EXISTS map_zones (
  zone_id VARCHAR(30) PRIMARY KEY,
  zone_name VARCHAR(100) NOT NULL,
  short_name VARCHAR(30) NOT NULL,
  inventory_zone VARCHAR(80) NULL,
  color_hex CHAR(7) NOT NULL,
  polygon_json JSON NOT NULL,
  source_url TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS map_landmarks (
  landmark_id VARCHAR(40) PRIMARY KEY,
  landmark_name VARCHAR(120) NOT NULL,
  landmark_type VARCHAR(40) NOT NULL,
  coord_x DECIMAL(8,4) NOT NULL,
  coord_y DECIMAL(8,4) NOT NULL,
  source_note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trees (
  id VARCHAR(20) PRIMARY KEY,
  species VARCHAR(150) NOT NULL,
  common_name VARCHAR(100) NOT NULL,
  scientific_name VARCHAR(150) NOT NULL,
  zone VARCHAR(50) NOT NULL,
  age_years INT NOT NULL,
  height_m DECIMAL(5,2) NOT NULL,
  health_score INT NOT NULL,
  health_status ENUM('healthy', 'monitor', 'critical') NOT NULL DEFAULT 'healthy',
  is_rare BOOLEAN NOT NULL DEFAULT FALSE,
  coord_x DECIMAL(8,4) NOT NULL,
  coord_y DECIMAL(8,4) NOT NULL,
  description TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stakeholder_plots (
  plot_id VARCHAR(40) PRIMARY KEY,
  plot_name VARCHAR(120) NOT NULL,
  zone_id VARCHAR(30) NOT NULL,
  source_document TEXT NOT NULL,
  record_count INT NOT NULL DEFAULT 0,
  species_rows INT NOT NULL DEFAULT 0,
  coord_x DECIMAL(8,4) NOT NULL,
  coord_y DECIMAL(8,4) NOT NULL,
  representative_species_json JSON NULL,
  CONSTRAINT fk_stakeholder_plots_zone
    FOREIGN KEY (zone_id) REFERENCES map_zones(zone_id)
);

CREATE TABLE IF NOT EXISTS qr_codes (
  qr_id VARCHAR(36) PRIMARY KEY,
  tree_id VARCHAR(20) NOT NULL,
  qr_endpoint TEXT NOT NULL,
  qr_status ENUM('active', 'invalidated', 'regenerated') NOT NULL DEFAULT 'active',
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generated_by VARCHAR(40) NOT NULL,
  exported_at TIMESTAMP NULL,
  invalidated_at TIMESTAMP NULL,
  replaced_by VARCHAR(36) NULL,
  CONSTRAINT fk_qr_codes_tree
    FOREIGN KEY (tree_id) REFERENCES trees(id),
  CONSTRAINT fk_qr_codes_replacement
    FOREIGN KEY (replaced_by) REFERENCES qr_codes(qr_id)
);

CREATE TABLE IF NOT EXISTS qr_scan_events (
  scan_id VARCHAR(30) PRIMARY KEY,
  qr_id VARCHAR(36) NOT NULL,
  tree_id VARCHAR(20) NULL,
  actor_id VARCHAR(80) NULL,
  role_detected VARCHAR(30) NOT NULL,
  routed_to VARCHAR(80) NOT NULL,
  scan_result VARCHAR(30) NOT NULL,
  scanned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_qr_scan_events_qr
    FOREIGN KEY (qr_id) REFERENCES qr_codes(qr_id),
  CONSTRAINT fk_qr_scan_events_tree
    FOREIGN KEY (tree_id) REFERENCES trees(id)
);

CREATE TABLE IF NOT EXISTS spatial_planning_records (
  plan_id VARCHAR(30) PRIMARY KEY,
  created_by VARCHAR(40) NOT NULL,
  proposed_x DECIMAL(8,4) NOT NULL,
  proposed_y DECIMAL(8,4) NOT NULL,
  species VARCHAR(150) NOT NULL,
  target_zone VARCHAR(50) NOT NULL,
  suitability_label ENUM('High', 'Medium', 'Low') NOT NULL,
  suitability_score INT NOT NULL,
  ai_reasoning TEXT NOT NULL,
  canopy_radius_m DECIMAL(5,2) NOT NULL,
  root_radius_m DECIMAL(5,2) NOT NULL,
  est_cost_rm DECIMAL(10,2) NOT NULL,
  decision ENUM('draft', 'confirmed', 'discarded') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_simulation_logs (
  simulation_id VARCHAR(40) PRIMARY KEY,
  plan_id VARCHAR(30) NULL,
  request_payload JSON NOT NULL,
  response_payload JSON NOT NULL,
  provider VARCHAR(80) NOT NULL DEFAULT 'Local rule engine',
  fallback_used BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_simulation_logs_plan
    FOREIGN KEY (plan_id) REFERENCES spatial_planning_records(plan_id)
);

CREATE TABLE IF NOT EXISTS map_layer_config (
  layer_id VARCHAR(30) PRIMARY KEY,
  layer_label VARCHAR(100) NOT NULL,
  data_source VARCHAR(100) NOT NULL,
  min_role VARCHAR(20) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL
);

CREATE TABLE IF NOT EXISTS visitor_heatmap_aggregate (
  aggregate_id VARCHAR(30) PRIMARY KEY,
  zone_id VARCHAR(30) NOT NULL,
  tree_id VARCHAR(20) NULL,
  scan_count INT NOT NULL DEFAULT 0,
  unique_sessions INT NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  traffic_level ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low',
  coord_x DECIMAL(8,4) NOT NULL,
  coord_y DECIMAL(8,4) NOT NULL,
  CONSTRAINT fk_visitor_heatmap_zone
    FOREIGN KEY (zone_id) REFERENCES map_zones(zone_id),
  CONSTRAINT fk_visitor_heatmap_tree
    FOREIGN KEY (tree_id) REFERENCES trees(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id VARCHAR(30) PRIMARY KEY,
  actor_id VARCHAR(80) NULL,
  actor_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  event_type VARCHAR(30) NOT NULL,
  event_detail TEXT NOT NULL,
  affected_record VARCHAR(100) NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low',
  ip_metadata VARCHAR(100) NULL,
  logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_alerts (
  alert_id VARCHAR(30) PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status ENUM('open', 'investigating', 'resolved') NOT NULL DEFAULT 'open',
  detail TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS rbac_permissions (
  permission_id VARCHAR(40) PRIMARY KEY,
  role VARCHAR(20) NOT NULL,
  resource VARCHAR(80) NOT NULL,
  action VARCHAR(40) NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY unique_role_resource_action (role, resource, action)
);

CREATE INDEX idx_trees_zone ON trees(zone);
CREATE INDEX idx_qr_scan_events_tree ON qr_scan_events(tree_id);
CREATE INDEX idx_qr_scan_events_role ON qr_scan_events(role_detected);
CREATE INDEX idx_spatial_planning_target_zone ON spatial_planning_records(target_zone);
CREATE INDEX idx_audit_logs_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
