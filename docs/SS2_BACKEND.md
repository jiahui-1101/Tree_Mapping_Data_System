# SS2 Scheduling & Field Task Management Backend

This document describes the backend implementation for Subsystem 2 (Scheduling & Field Task Management). The module runs inside the shared Express server at `src/backend/server.js`, with logic in `src/backend/fieldBackendService.js`.

## Requirement Coverage

| Module | Backend Support |
| --- | --- |
| Ranger Account Management | `GET/POST /api/ss2/rangers` lists and upserts ranger records (name, zone, phone, status). |
| AI-Assisted Workforce Scheduling | `POST /api/ss2/schedules/generate` runs a rule-based scheduling heuristic (`buildAiSchedule`) that balances zone coverage and avoids repeating a ranger's last patrol zone. This is a deterministic rules engine, not an LLM/ML model. |
| Manual Schedule Adjustment | `PATCH /api/ss2/schedule-assignments/:assignmentId` lets an admin override an AI-generated assignment; MySQL mode logs every edit to `ss2_schedule_change_logs`. |
| Schedule Publishing & Task Dispatch | `POST /api/ss2/schedules/:scheduleId/publish` marks the schedule Published and auto-creates one Field Task per assignment, with a linked Push Notification for each ranger. |
| Field Task Tracking | `GET/POST /api/ss2/tasks`, `PATCH /api/ss2/tasks/:taskId/status`, `POST /api/ss2/tasks/:taskId/reassign` manage the ranger task lifecycle (pending → in-progress → completed/escalated). |
| Evidence-Required Task Completion | A task cannot be marked `completed` unless a Field Report with a matching `task_id` already exists (`EVIDENCE_REQUIRED` validation), enforced identically in both storage modes. |
| QR-Based Field Reporting | `POST /api/ss2/reports` creates a Field Report linked to a tree and (optionally) a task; completing the report auto-completes the linked task and syncs the tree's health status. |
| AI Photo Analysis | `POST /api/ss2/photo-analysis` returns a simulated diagnosis/confidence/treatment suggestion for a submitted photo (`analyzeFieldPhoto`). |
| Push Notifications | `GET /api/ss2/notifications` lists notifications generated automatically by schedule publishing, task creation, and task reassignment. |

## Runtime Configuration

```text
PORT=4174
SS2_FIELD_STORE=memory
DB_NAME=tree_mapping_data_system
```

Run the shared backend:

```powershell
npm run dev:backend
```

Default URL:

```text
http://localhost:4174
```

## API Summary

```http
GET   /api/ss2/dashboard
GET   /api/ss2/rangers?status=active
POST  /api/ss2/rangers
GET   /api/ss2/schedules/current
POST  /api/ss2/schedules/generate
PATCH /api/ss2/schedule-assignments/:assignmentId
POST  /api/ss2/schedules/:scheduleId/publish
GET   /api/ss2/notifications?ranger=R01
GET   /api/ss2/tasks
GET   /api/ss2/tasks/:taskId
POST  /api/ss2/tasks
PATCH /api/ss2/tasks/:taskId/status
POST  /api/ss2/tasks/:taskId/reassign
GET   /api/ss2/reports
POST  /api/ss2/reports
POST  /api/ss2/photo-analysis
```

## Storage Modes

`SS2_FIELD_STORE` selects the backend implementation in `createFieldBackend()`:

- `memory` (default): in-process arrays, reset on every server restart. No seed data is loaded automatically — Ranger Management starts empty and rangers must be added manually through the UI before scheduling will produce assignments.
- `mysql`: full implementation in `createMysqlFieldBackend`, using `mysql2/promise` with parameterized queries and explicit transactions (`beginTransaction`/`commit`/`rollback`) for every multi-table write (schedule generation, publishing, reassignment, report submission).

For a MySQL-backed demo:

```powershell
mysql -u root -p < docs/database/ss2_schema.sql
mysql -u root -p < docs/database/ss2_seed.sql
```

then set:

```text
SS2_FIELD_STORE=mysql
DB_NAME=tree_mapping_data_system
```

`ss2_seed.sql` is not run automatically — it must be applied manually before a MySQL demo, or the rangers/tasks tables will also start empty.

## Database Design

Schema files:

```text
docs/database/ss2_schema.sql
docs/database/ss2_schedule_migration.sql
docs/database/ss2_ai_diagnosis_ref_migration.sql
docs/database/ss2_seed.sql
```

Tables:

- `ss2_rangers`
- `ss2_schedule_weeks`
- `ss2_schedule_assignments`
- `ss2_schedule_change_logs`
- `ss2_field_tasks`
- `ss2_field_reports`
- `ss2_push_notifications`

## Known Limitations (Prototype Stage)

These are documented here intentionally so reviewers can see what is real backend behavior versus what is still a frontend simulation:

- **Ranger login is a frontend mock.** `LoginPage.jsx` authenticates against `mockAuthService.js` (a plain-string comparison against `config/demoUsers.js`), not against the backend. The data dictionary's `pin_hash`, `failed_attempts`, and `locked_until` fields are not yet wired to a real `/api/ss2/auth/login` endpoint.
- **GPS capture is simulated.** Field reports store a fixed string (`"Mock GPS: Ranger patrol point captured"`) rather than reading `navigator.geolocation` or validating distance against the tree's coordinates.

These items are intentionally scoped as future work and do not affect the core backend data flow described above (Schedule → Task → Notification → Report → Task completion), which is fully implemented in both storage modes.
