# M1-C Predictive Maintenance Backend Prototype

This backend supports SS1 Module M1-C: Predictive Maintenance Scheduler.

It uses a lightweight Node.js HTTP server with in-memory data, so no database or AI API key is required for the prototype.

## Run

```powershell
npm run backend
```

Default URL:

```text
http://localhost:4001
```

## Endpoints

```text
GET    /api/health
GET    /api/predictive-alerts
GET    /api/predictive-alerts/:id
POST   /api/predictive-alerts/generate
PATCH  /api/predictive-alerts/:id/status
POST   /api/predictive-alerts/:id/approve
GET    /api/tasks
POST   /api/dev/reset
```

## Workflow

1. Backend stores AI-style predictive alerts.
2. Admin reviews pending alerts.
3. Admin approves, defers, or rejects the alert.
4. Approving an alert creates a ranger maintenance task.

For this prototype, AI prediction is simulated by a rule-based engine using tree health score and status.
