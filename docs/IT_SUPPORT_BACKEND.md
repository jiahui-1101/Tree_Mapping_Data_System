# IT Support Backend

This document describes the backend implementation for IT Support operations.

## Requirement Coverage

| Area | Backend Support |
| --- | --- |
| IT Dashboard | `GET /api/it-support/dashboard` returns service watch, failed login, locked account, high-risk event, ticket, service, and user summaries. |
| System Monitoring | `GET /api/it-support/services`, `GET /api/it-support/services/:serviceId/logs`, and `POST /api/it-support/services/:serviceId/actions` support live service status, diagnostics, restart actions, and log review. |
| User & Access Control | `GET /api/it-support/users` and `PATCH /api/it-support/users/:userId/access` support lock, unlock, password reset preparation, and session invalidation. |
| Incident Tickets | `GET /api/it-support/tickets`, `POST /api/it-support/tickets`, and `PATCH /api/it-support/tickets/:ticketId` support ticket review, assignment, investigation, and resolution. |

## Runtime Configuration

```text
IT_SUPPORT_STORE_PATH=.runtime/it-support-store.json
IT_SUPPORT_STORE=json
```

For MySQL:

```powershell
mysql -u root -p < docs/database/it_support_schema.sql
```

Then set:

```text
IT_SUPPORT_STORE=mysql
DB_NAME=tree_mapping_data_system
```

If MySQL is unavailable or a write fails during demo, the backend falls back to the JSON/runtime store.

## API Summary

```http
GET   /api/it-support/dashboard
GET   /api/it-support/services
GET   /api/it-support/services/:serviceId/logs
POST  /api/it-support/services/:serviceId/actions
GET   /api/it-support/users
PATCH /api/it-support/users/:userId/access
GET   /api/it-support/tickets
POST  /api/it-support/tickets
PATCH /api/it-support/tickets/:ticketId
```

## Database Design

The production database design is documented in:

```text
docs/database/it_support_schema.sql
```

The schema covers:

- `it_system_services`
- `it_access_users`
- `it_support_tickets`
- `it_service_logs`
- `it_audit_events`
