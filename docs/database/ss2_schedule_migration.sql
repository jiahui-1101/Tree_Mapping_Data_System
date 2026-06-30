ALTER TABLE ss2_field_tasks
  ADD COLUMN schedule_assignment_id INT NULL AFTER id,
  ADD COLUMN task_type ENUM('Patrol', 'Maintenance', 'Inspection', 'Urgent') NOT NULL DEFAULT 'Inspection' AFTER ranger,
  ADD COLUMN dispatched_at TIMESTAMP NULL AFTER notes,
  ADD COLUMN started_at TIMESTAMP NULL AFTER dispatched_at,
  ADD COLUMN completed_at TIMESTAMP NULL AFTER started_at;

CREATE INDEX idx_ss2_tasks_assignment ON ss2_field_tasks(schedule_assignment_id);

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