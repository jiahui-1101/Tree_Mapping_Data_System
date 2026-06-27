CREATE DATABASE IF NOT EXISTS tree_mapping_m1c;
USE tree_mapping_m1c;

CREATE TABLE IF NOT EXISTS predictive_alerts (
  id VARCHAR(20) PRIMARY KEY,
  tree_id VARCHAR(20) NOT NULL,
  title VARCHAR(120) NOT NULL,
  zone VARCHAR(80) NOT NULL,
  confidence INT NOT NULL,
  action_window VARCHAR(80) NOT NULL,
  status ENUM('pending', 'approved', 'deferred', 'rejected') NOT NULL DEFAULT 'pending',
  detail TEXT NOT NULL,
  generated_by VARCHAR(120) NOT NULL DEFAULT 'seed data',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_tree_alert (tree_id, title)
);

CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id VARCHAR(20) PRIMARY KEY,
  alert_id VARCHAR(20) NULL,
  title VARCHAR(160) NOT NULL,
  tree_id VARCHAR(20) NOT NULL,
  ranger VARCHAR(120) NOT NULL,
  source VARCHAR(120) NOT NULL,
  priority ENUM('normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  status ENUM('pending', 'in-progress', 'completed') NOT NULL DEFAULT 'pending',
  notes TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_maintenance_tasks_alert
    FOREIGN KEY (alert_id) REFERENCES predictive_alerts(id)
    ON DELETE SET NULL
);

INSERT INTO predictive_alerts
  (id, tree_id, title, zone, confidence, action_window, status, detail, generated_by)
VALUES
  ('ALT-001', 'TBJ-004', 'Fungal infection outbreak', 'Tanaman', 92, 'Within 24 hours', 'pending', 'High humidity and recent leaf reports indicate spreading infection.', 'seed data'),
  ('ALT-002', 'TBJ-002', 'Water stress risk', 'Arboretum', 78, 'Within 3 days', 'pending', 'Unusual leaf-drop pattern and low soil moisture readings detected.', 'seed data'),
  ('ALT-003', 'TBJ-006', 'Nutrient deficiency', 'Tanaman', 69, 'Within 7 days', 'pending', 'Growth trend is below expected range for the current season.', 'seed data')
ON DUPLICATE KEY UPDATE
  confidence = VALUES(confidence),
  action_window = VALUES(action_window),
  detail = VALUES(detail);

INSERT INTO maintenance_tasks
  (id, alert_id, title, tree_id, ranger, source, priority, status, notes)
VALUES
  ('TSK-087', NULL, 'Investigate diseased tree', 'TBJ-004', 'Ahmad Razif', 'AI Diagnosis', 'urgent', 'pending', 'Suspected fungal infection. Capture a leaf close-up.'),
  ('TSK-088', NULL, 'Routine patrol - Zon Arboretum', '15 trees', 'Ahmad Razif', 'Weekly Schedule', 'normal', 'pending', 'Check health status and update records.'),
  ('TSK-089', NULL, 'Water stress monitoring', 'TBJ-002', 'Ahmad Razif', 'Predictive Alert', 'high', 'pending', 'Check soil moisture. Increase watering if needed.'),
  ('TSK-085', NULL, 'Leaf sample follow-up', 'TBJ-003', 'Siti Nurul', 'Field Report', 'normal', 'completed', 'Sample delivered to office staff.')
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  notes = VALUES(notes);
