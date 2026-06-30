# SS4 Map, QR and Interactive Visualization Backend

This document describes the backend implementation for Subsystem 4 owned by Wong Jia Hui.

## Requirement Coverage

| Module | Backend Support |
| --- | --- |
| M4-A Interactive Garden Map Interface | `GET /api/ss4/map` returns official JLN map context, zones, landmarks, stakeholder plots, role-safe tree markers, QR records, scan events, and visitor heatmap data. |
| M4-B QR Interaction & Role-Based Access Flow | `POST /api/ss4/qr-scans` validates QR labels, detects the user role, routes visitors to SS3, rangers to SS2, and staff to SS4. Invalid QR attempts create security alerts. |
| M4-C AI Spatial Planning & Simulation | `POST /api/ss4/spatial/simulate` returns rule-based suitability, canopy/root radius, cost, and reasoning. `POST /api/ss4/spatial/confirm` persists the decision and writes an audit event. |
| M4-D Multi-Layer Map Overlay & Visual Analytics | `GET /api/ss4/layers` filters map overlays by role. `GET /api/ss4/analytics/heatmap` exposes anonymous visitor heatmap aggregates. |
| M4-E Audit Log & System Security | `GET /api/ss4/audit-logs` and `GET /api/ss4/security-alerts` expose monitored events and security alerts. |

## Runtime Configuration

```text
PORT=4174
SS4_STORE_PATH=.runtime/ss4-store.json
```

Run the shared backend:

```powershell
npm.cmd run dev:backend
```

## API Summary

```http
GET  /api/ss4/map?role=admin
GET  /api/ss4/layers?role=ranger
GET  /api/ss4/qr-codes
GET  /api/ss4/qr-scans
POST /api/ss4/qr-scans
POST /api/ss4/spatial/simulate
POST /api/ss4/spatial/confirm
GET  /api/ss4/spatial/plans
GET  /api/ss4/analytics/heatmap
GET  /api/ss4/audit-logs
GET  /api/ss4/security-alerts
```

## Database Design

The production database design is documented in:

```text
docs/database/ss4_schema.sql
```

The schema covers:

- `map_zones`
- `map_landmarks`
- `trees`
- `stakeholder_plots`
- `qr_codes`
- `qr_scan_events`
- `spatial_planning_records`
- `ai_simulation_logs`
- `map_layer_config`
- `visitor_heatmap_aggregate`
- `audit_logs`
- `security_alerts`
- `rbac_permissions`

## Map Sources

The map is a conceptual operational model, not a surveyed GIS boundary. It combines:

- Official JLN Taman Botani Johor page for area, location, and zone context.
- The supplied TBJ zoning image for lake, entrance, zone, and marker orientation.
- Google Maps public location context for the Taman Botani Johor site.
- Stakeholder inventory document quantities already represented in the prototype data.

Protected rare-species coordinates are masked for visitor-facing views.
