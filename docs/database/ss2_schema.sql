CREATE TABLE IF NOT EXISTS ss2_rangers (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  zone VARCHAR(80) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ss2_field_tasks (
  id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  tree_id VARCHAR(40) NOT NULL,
  ranger VARCHAR(120) NOT NULL,
  source VARCHAR(120) NOT NULL,
  priority ENUM('normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  status ENUM('pending', 'in-progress', 'completed', 'escalated') NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ss2_tasks_ranger_status (ranger, status),
  INDEX idx_ss2_tasks_tree (tree_id)
);

CREATE TABLE IF NOT EXISTS ss2_field_reports (
  id VARCHAR(20) PRIMARY KEY,
  task_id VARCHAR(20),
  tree_id VARCHAR(40) NOT NULL,
  tree_name VARCHAR(160) NOT NULL,
  ranger VARCHAR(120) NOT NULL,
  report_mode ENUM('manual', 'ai') NOT NULL DEFAULT 'manual',
  photo_name VARCHAR(180),
  photo_sync_status VARCHAR(40) NOT NULL DEFAULT 'none',
  photo_analysis_status VARCHAR(40) NOT NULL DEFAULT 'not-requested',
  observed_status ENUM('healthy', 'monitor', 'critical') NOT NULL DEFAULT 'monitor',
  manual_cause TEXT,
  manual_treatment TEXT,
  ai_possibilities JSON,
  selected_ai_possibility_id VARCHAR(40),
  diagnosis VARCHAR(180),
  confidence INT,
  treatment TEXT,
  notes TEXT,
  gps_label VARCHAR(180),
  timestamp_label VARCHAR(80),
  sync_status VARCHAR(40) NOT NULL DEFAULT 'synced',
  analysis JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ss2_reports_ranger (ranger),
  INDEX idx_ss2_reports_task (task_id),
  INDEX idx_ss2_reports_tree (tree_id)
);
