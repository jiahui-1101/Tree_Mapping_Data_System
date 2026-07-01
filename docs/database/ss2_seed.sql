INSERT INTO ss2_rangers (id, name, zone, phone, status) VALUES
  ('R01', 'Ahmad Razif', 'Arboretum', '+60 12-334 8201', 'active'),
  ('R02', 'Siti Nurul', 'Pemuliharaan', '+60 16-220 9143', 'active'),
  ('R03', 'Faizal Harun', 'Tanaman', '+60 17-881 0192', 'active'),
  ('R04', 'Mei Ling', 'Riparian', '+60 12-778 3905', 'inactive')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  zone = VALUES(zone),
  phone = VALUES(phone),
  status = VALUES(status);

INSERT INTO ss2_field_tasks (id, title, tree_id, ranger, source, priority, status, notes) VALUES
  ('TSK-087', 'Investigate diseased tree', 'TBJ-004', 'Ahmad Razif', 'AI Diagnosis', 'urgent', 'pending', 'Suspected fungal infection. Capture a leaf close-up.'),
  ('TSK-088', 'Routine patrol - Zon Arboretum', '15 trees', 'Ahmad Razif', 'Weekly Schedule', 'normal', 'pending', 'Check health status and update records.'),
  ('TSK-089', 'Water stress monitoring', 'TBJ-002', 'Ahmad Razif', 'Predictive Alert', 'high', 'pending', 'Check soil moisture. Increase watering if needed.'),
  ('TSK-085', 'Leaf sample follow-up', 'TBJ-003', 'Siti Nurul', 'Field Report', 'normal', 'completed', 'Sample delivered to office staff.')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  tree_id = VALUES(tree_id),
  ranger = VALUES(ranger),
  source = VALUES(source),
  priority = VALUES(priority),
  status = VALUES(status),
  notes = VALUES(notes);

INSERT INTO ss2_field_reports
  (id, task_id, tree_id, tree_name, ranger, report_mode, photo_name, photo_sync_status, photo_analysis_status,
   observed_status, manual_cause, manual_treatment, ai_possibilities, selected_ai_possibility_id,
   ai_diagnosis_ref, diagnosis, confidence, treatment, notes, height_measurement, gps_label, timestamp_label, sync_status, review_status, analysis)
VALUES
  (
    'FR-1021',
    'TSK-089',
    'TBJ-002',
    'Pokok Hujan-hujan',
    'Ahmad Razif',
    'manual',
    NULL,
    'none',
    'not-requested',
    'monitor',
    'Dry soil around the root zone after several hot days.',
    'Increase watering frequency and inspect again in 48 hours.',
    JSON_ARRAY(),
    NULL,
    NULL,
    NULL,
    NULL,
    'Leaf drop is visible on the lower canopy but no fungus spotted.',
    12.40,
    'Mock GPS: Arboretum patrol point',
    'Today 08:42',
    'synced',
    'Pending Review',
    JSON_OBJECT(
      'source', 'manual',
      'severity', 'Monitor',
      'summary', 'Manual ranger assessment: Dry soil around the root zone after several hot days.',
      'recommendation', 'Increase watering frequency and inspect again in 48 hours.',
      'taskSyncMessage', 'Linked task TSK-089 synced to the office dashboard.',
      'treeUpdateMessage', 'Tree status remains under monitor for follow-up.',
      'photoSyncMessage', 'No field photo upload was attached.',
      'photoAnalysisMessage', 'AI photo analysis was not requested.',
      'nextAction', 'Recheck moisture level during the next patrol.'
    )
  ),
  (
    'FR-1020',
    'TSK-087',
    'TBJ-004',
    'Pokok Nangka',
    'Ahmad Razif',
    'ai',
    'jackfruit-fungal-sample.jpg',
    'uploaded',
    'analyzed',
    'critical',
    NULL,
    NULL,
    JSON_ARRAY(
      JSON_OBJECT(
        'id', 'ai-1',
        'name', 'Leaf spot disease',
        'confidence', 89,
        'reasons', JSON_ARRAY('Dark circular leaf spots visible in the photo', 'Symptoms appear on multiple leaf clusters', 'Recent humid weather supports fungal spread'),
        'solutions', JSON_ARRAY('Remove visibly infected leaves', 'Apply copper-based spray following garden SOP', 'Monitor nearby trees for spreading spots'),
        'treatment', 'Remove infected leaves and apply a copper-based spray.'
      ),
      JSON_OBJECT(
        'id', 'ai-2',
        'name', 'Phytophthora root rot',
        'confidence', 67,
        'reasons', JSON_ARRAY('Waterlogged soil around the root zone', 'Dark lesions near the lower stem', 'Canopy decline despite routine watering'),
        'solutions', JSON_ARRAY('Improve soil drainage around the tree', 'Apply Fosetyl-Al fungicide under supervisor approval', 'Schedule root-zone inspection within 24 hours'),
        'treatment', 'Improve drainage and apply Fosetyl-Al fungicide.'
      ),
      JSON_OBJECT(
        'id', 'ai-3',
        'name', 'Nutrient stress',
        'confidence', 42,
        'reasons', JSON_ARRAY('Uneven yellowing across older leaves', 'No clear pest damage in the image', 'Symptoms match low nutrient uptake patterns'),
        'solutions', JSON_ARRAY('Perform soil nutrient test', 'Add balanced fertilizer after admin review', 'Recheck leaf color during next patrol'),
        'treatment', 'Perform a soil test and add balanced fertilizer.'
      )
    ),
    'ai-1',
    'AID-TBJ-004-SEED',
    'Leaf spot disease',
    89,
    'Remove infected leaves and apply a copper-based spray.',
    'Dark spotting on multiple leaves. AI support requested for treatment confirmation.',
    8.70,
    'Mock GPS: Tanaman fruit plot',
    'Yesterday 16:10',
    'synced',
    'Pending Review',
    JSON_OBJECT(
      'source', 'ai',
      'severity', 'Critical',
      'summary', 'AI analyzed uploaded photo: jackfruit-fungal-sample.jpg. AI-assisted diagnosis: Leaf spot disease with 89% confidence. Photo synced to admin dashboard. 3 possible diagnoses generated; primary result: Leaf spot disease.',
      'recommendation', 'Remove infected leaves and apply a copper-based spray.',
      'taskSyncMessage', 'Linked task TSK-087 synced to the office dashboard.',
      'treeUpdateMessage', 'Tree status updated to critical in the prototype map.',
      'photoSyncMessage', 'Field photo jackfruit-fungal-sample.jpg uploaded to admin dashboard.',
      'photoAnalysisMessage', 'AI photo analysis completed for jackfruit-fungal-sample.jpg.',
      'nextAction', 'Escalate to admin if symptoms spread within 24 hours.'
    )
  )
ON DUPLICATE KEY UPDATE
  task_id = VALUES(task_id),
  tree_id = VALUES(tree_id),
  tree_name = VALUES(tree_name),
  ranger = VALUES(ranger),
  report_mode = VALUES(report_mode),
  photo_name = VALUES(photo_name),
  photo_sync_status = VALUES(photo_sync_status),
  photo_analysis_status = VALUES(photo_analysis_status),
  observed_status = VALUES(observed_status),
  manual_cause = VALUES(manual_cause),
  manual_treatment = VALUES(manual_treatment),
  ai_possibilities = VALUES(ai_possibilities),
  selected_ai_possibility_id = VALUES(selected_ai_possibility_id),
  ai_diagnosis_ref = VALUES(ai_diagnosis_ref),
  diagnosis = VALUES(diagnosis),
  confidence = VALUES(confidence),
  treatment = VALUES(treatment),
  notes = VALUES(notes),
  height_measurement = VALUES(height_measurement),
  gps_label = VALUES(gps_label),
  timestamp_label = VALUES(timestamp_label),
  sync_status = VALUES(sync_status),
  review_status = VALUES(review_status),
  analysis = VALUES(analysis);
