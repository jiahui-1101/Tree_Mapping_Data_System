# SS3 Visitor Engagement Backend

This document describes the backend implementation for Subsystem 3: Visitor Engagement & Education.

## Requirement Coverage

| Module | Backend Support |
| --- | --- |
| M3-A Digital Tree ID Card | `GET /api/visitor/trees/:treeId` returns visitor-safe public tree profile data, localized education content, and AI-style growth projection. |
| M3-B AI Plant Chatbot | `POST /api/visitor/chat` supports multilingual botanical Q&A with optional Gemini/OpenAI provider and local fallback. |
| M3-C Exploration Collection System | `GET/POST /api/visitor/collection` stores collected tree badges by visitor session. |
| M3-D AI Preference Route Recommender | `POST /api/visitor/routes/recommend` validates visitor interests and returns a route with safe waypoints. |
| M3-E Multilingual Interface | All visitor endpoints accept `language` values `en`, `bm`, or `zh`, with English fallback. |

## Privacy Rules

Visitor-facing responses must not expose:

- operational health score or status
- ranger-only task/report information
- exact protected rare-species coordinates
- staff-only audit/security information

Rare species are still included for education, but exact locations are generalized or masked.

## Runtime Configuration

Copy `.env.example` when running the backend locally.

```text
PORT=4174
SS3_VISITOR_STORE_PATH=.runtime/ss3-visitor-store.json
SS3_AI_PROVIDER=mock
SS3_AI_TIMEOUT_MS=8000
GEMINI_API_KEY=
OPENAI_API_KEY=
```

`SS3_AI_PROVIDER` supports:

- `mock`: local rule-based backend for coursework demo reliability
- `gemini`: Gemini API call with fallback to local rules
- `openai`: OpenAI chat completion call with fallback to local rules

The fallback path is intentional so the demo remains usable when there is no API key or network.

## Persistence

Visitor collection, QR scan analytics, chat logs, and route plans are stored in a JSON file through `visitorStore.js`.

Default path:

```text
.runtime/ss3-visitor-store.json
```

The `.runtime/` folder is ignored by Git because it contains local runtime data.

## Database Design

The production database design is documented in:

```text
docs/database/ss3_schema.sql
```

The schema covers the SS3-owned entities from Progress 2:

- `visitor_sessions`
- `tree_public_profiles`
- `visitor_collections`
- `visitor_scan_events`
- `visitor_route_plans`
- `visitor_route_stops`
- `visitor_chat_logs`

The prototype keeps using JSON persistence so it can run without PostgreSQL, but the table names and fields are aligned with the backend API contracts.

## Validation

The Express API validates SS3 visitor requests before they reach the business service:

- `treeId` path values must match `TBJ-001` style identifiers.
- route preferences must be an array.
- chat, collection, and scan writes require the relevant JSON body fields.
- validation failures return `{ ok: false, error: "VALIDATION_ERROR" }`.

