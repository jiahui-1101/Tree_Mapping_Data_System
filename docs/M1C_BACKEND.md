# M1-C Predictive Maintenance Backend

This backend module runs inside the shared Express server at `src/backend/server.js`.

## Purpose

M1-C manages predictive maintenance alerts and converts approved alerts into ranger maintenance tasks.

## Run

```powershell
npm run dev:backend
```

The old alias also works:

```powershell
npm run backend
```

Default URL:

```text
http://localhost:4174
```

## Endpoints

```text
GET    /api/health
GET    /api/predictive-alerts
GET    /api/predictive-alerts/:alertId
POST   /api/predictive-alerts/generate
PATCH  /api/predictive-alerts/:alertId/status
POST   /api/predictive-alerts/:alertId/approve
GET    /api/tasks
POST   /api/dev/reset
```

## Database

The shared MySQL database is:

```text
tree_mapping_data_system
```

The reusable maintenance tables are:

```text
predictive_alerts
maintenance_tasks
```

Schema file:

```text
docs/database/maintenance_schema.sql
```

For a quick demo, keep `M1C_MAINTENANCE_STORE=memory`. For MySQL demo, set:

```text
M1C_MAINTENANCE_STORE=mysql
DB_NAME=tree_mapping_data_system
```
