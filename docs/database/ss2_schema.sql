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
  schedule_assignment_id INT,
  title VARCHAR(180) NOT NULL,
  tree_id VARCHAR(40) NOT NULL,
  ranger VARCHAR(120) NOT NULL,
  task_type ENUM('Patrol', 'Maintenance', 'Inspection', 'Urgent') NOT NULL DEFAULT 'Inspection',
  source VARCHAR(120) NOT NULL,
  priority ENUM('normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  status ENUM('pending', 'in-progress', 'completed', 'escalated') NOT NULL DEFAULT 'pending',
  notes TEXT,
  dispatched_at TIMESTAMP NULL,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ss2_tasks_assignment (schedule_assignment_id),
  INDEX idx_ss2_tasks_ranger_status (ranger, status),
  INDEX idx_ss2_tasks_tree (tree_id)
);

CREATE TABLE IF NOT EXISTS ss2_schedule_weeks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_by VARCHAR(120) NOT NULL,
  week_label VARCHAR(80) NOT NULL,
  status ENUM('Draft', 'Approved', 'Published') NOT NULL DEFAULT 'Draft',
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  ai_reasoning_summary TEXT,
  UNIQUE KEY uq_ss2_schedule_week_label (week_label)
);

CREATE TABLE IF NOT EXISTS ss2_schedule_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_week_id INT NOT NULL,
  ranger_id VARCHAR(20) NOT NULL,
  ranger_name VARCHAR(120) NOT NULL,
  zone VARCHAR(80) NOT NULL,
  shift_date DATE NOT NULL,
  shift_day VARCHAR(12) NOT NULL,
  shift_start TIME NOT NULL DEFAULT '08:00:00',
  shift_end TIME NOT NULL DEFAULT '12:00:00',
  priority_flag ENUM('Normal', 'High', 'Critical') NOT NULL DEFAULT 'Normal',
  ai_reasoning_note TEXT,
  manual_override BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by VARCHAR(120),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (schedule_week_id) REFERENCES ss2_schedule_weeks(id) ON DELETE CASCADE,
  INDEX idx_ss2_assignments_week (schedule_week_id),
  INDEX idx_ss2_assignments_ranger_date (ranger_id, shift_date),
  INDEX idx_ss2_assignments_zone (zone)
);

CREATE TABLE IF NOT EXISTS ss2_schedule_change_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  schedule_week_id INT NOT NULL,
  old_ranger_id VARCHAR(20),
  old_ranger_name VARCHAR(120),
  old_zone VARCHAR(80),
  new_ranger_id VARCHAR(20),
  new_ranger_name VARCHAR(120),
  new_zone VARCHAR(80),
  edited_by VARCHAR(120) NOT NULL,
  edit_reason TEXT,
  edited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES ss2_schedule_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_week_id) REFERENCES ss2_schedule_weeks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ss2_push_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ranger_id VARCHAR(20) NOT NULL,
  ranger_name VARCHAR(120) NOT NULL,
  task_id VARCHAR(20) NOT NULL,
  payload_summary TEXT NOT NULL,
  delivery_status ENUM('Sent', 'Delivered', 'Failed', 'Pending_Retry') NOT NULL DEFAULT 'Sent',
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  INDEX idx_ss2_notifications_ranger (ranger_id, read_at),
  INDEX idx_ss2_notifications_task (task_id)
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
  ai_diagnosis_ref VARCHAR(80),
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
