# M1-C Predictive Maintenance Backend

This backend supports SS1 Module M1-C: Predictive Maintenance Scheduler.

It uses a lightweight Node.js HTTP server. By default it can run with in-memory data for quick testing. For a complete backend demo, set `BACKEND_STORE=mysql` and run it with the MySQL schema in `database/schema.sql`.

The AI prediction is simulated with rule-based backend logic using tree health score and status. A real AI service can be connected later by replacing the generate-alert logic.

## Run

```powershell
npm run backend
```

Default URL:

```text
http://localhost:4001
```

## MySQL setup

1. Create tables and seed records:

```powershell
mysql -u root < backend/database/schema.sql
```

2. Copy environment template:

```powershell
Copy-Item backend/.env.example .env
```

3. Update `.env` if your MySQL user/password is different.

4. Start backend:

```powershell
npm run backend
```

If `.env` contains `BACKEND_STORE=mysql`, the API will use MySQL. Otherwise, it falls back to memory mode.

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

## Demo requests

Use `backend/http/requests.http` in VS Code REST Client or Thunder Client.
