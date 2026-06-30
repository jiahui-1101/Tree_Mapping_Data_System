# SS4 Map, QR and Interactive Visualization Backend

This document describes the backend implementation for Subsystem 4 owned by Wong Jia Hui. The module supports production-style integrations with safe demo fallbacks.

## Requirement Coverage

| Module | Backend Support |
| --- | --- |
| M4-A Interactive Garden Map Interface | `GET /api/ss4/map` returns official JLN map context, zones, landmarks, stakeholder plots, role-safe tree markers, QR records, scan events, and visitor heatmap data. |
| M4-B QR Interaction & Role-Based Access Flow | `POST /api/ss4/qr-scans` validates QR labels, detects the user role, routes visitors to SS3, rangers to SS2, and staff to SS4. Invalid QR attempts create security alerts. |
| M4-C AI Spatial Planning & Simulation | `POST /api/ss4/spatial/simulate` can call Gemini/OpenAI when configured, then falls back to local suitability rules. `POST /api/ss4/spatial/confirm` persists the decision and writes an audit event. |
| M4-D Multi-Layer Map Overlay & Visual Analytics | `GET /api/ss4/layers` filters map overlays by role. `GET /api/ss4/analytics/heatmap` exposes anonymous visitor heatmap aggregates. |
| M4-E Audit Log & System Security | `GET /api/ss4/audit-logs` and `GET /api/ss4/security-alerts` expose monitored events and security alerts. |

## Runtime Configuration

```text
PORT=4174
SS4_STORE_PATH=.runtime/ss4-store.json
SS4_STORE=json
SS4_AI_PROVIDER=mock
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

For a MySQL-backed SS4 demo:

```powershell
mysql -u root -p < docs/database/ss4_schema.sql
```

Then set:

```text
SS4_STORE=mysql
DB_NAME=tree_mapping_data_system
```

If MySQL is unavailable, tables are missing, or writes fail during demo, the SS4 backend automatically falls back to the JSON/runtime store so the UI remains usable.

## AI Provider

`SS4_AI_PROVIDER` supports:

- `mock`: local rule-based suitability engine
- `gemini`: Gemini API with local fallback
- `openai`: OpenAI API with local fallback

Use the existing API key variables:

```text
GEMINI_API_KEY=
OPENAI_API_KEY=
```

If no key is configured, or the provider request fails, the backend returns the local rule-based simulation.

## QR Scanner

The QR scanner uses the browser camera through `navigator.mediaDevices.getUserMedia` and attempts live QR detection with `BarcodeDetector`. If the browser does not support live barcode detection, the scanner keeps the manual QR ID field as a fallback.

## Google Maps Reference

The SS4 map page includes a Google Maps embed panel for the public Taman Botani Johor location. It uses:

```text
VITE_GOOGLE_MAPS_EMBED_URL=https://www.google.com/maps?q=Taman%20Botani%20Johor%20Batu%20Pahat&output=embed
```

If the embed is blocked by the browser or network, the page still provides the full Google Maps link and the local 3D conceptual map.

## Map Sources

The map is a conceptual operational model, not a surveyed GIS boundary. It combines:

- Official JLN Taman Botani Johor page for area, location, and zone context.
- The supplied TBJ zoning image for lake, entrance, zone, and marker orientation.
- Google Maps public location context for the Taman Botani Johor site.
- Stakeholder inventory document quantities already represented in the prototype data.

Protected rare-species coordinates are masked for visitor-facing views.
