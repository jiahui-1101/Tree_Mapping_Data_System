# Tree Mapping Data System

A modular React prototype for managing tree records and field operations at
Taman Botani Johor. The application combines tree health monitoring, ranger
workflows, visitor experiences, spatial mapping, QR interactions, and IT
support operations in one role-based interface.

## Technology

- React 19
- Vite 7
- Three.js for the interactive garden scene
- QRCode for printable tree labels
- Node's built-in test runner

## Getting started

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/jiahui-1101/Tree_Mapping_Data_System.git
cd Tree_Mapping_Data_System
npm install
npm run dev
```

Vite prints the local development address in the terminal. Open that address
in a modern browser.

## Available commands

```bash
npm run dev      # start the development server
npm run build    # create a production build
npm run preview  # preview the production build
npm test         # run service and integration tests
```

## Source layout

```text
src/
  components/    shared layout, QR, map, and UI components
  config/        navigation, roles, and demo account configuration
  data/          prototype records and fixtures
  features/      role and subsystem pages
  services/      filtering, state, and workflow helpers
  styles/        shared and subsystem-specific styles
test/            Node integration and service tests
```

## Application areas

| Area | Purpose |
| --- | --- |
| Shared backbone | Authentication, role navigation, layout, responsive UI, and notifications |
| Subsystem 1 | Tree health dashboard, inventory, and predictive maintenance |
| Subsystem 2 | Ranger scheduling, tasks, reports, and workforce management |
| Subsystem 3 | Visitor exploration, profiles, collection, QR discovery, and assistant |
| Subsystem 4 | 3D garden map, spatial planning, audit operations, and QR map metrics |
| IT Support | Service monitoring, incidents, access control, and operational diagnostics |

## Demo accounts

| Role | ID | Password |
| --- | --- | --- |
| Admin | `admin001` | `admin123` |
| Ranger | `RGR001` | `ranger123` |
| Visitor | `visitor@gmail.com` | `visitor123` |
| IT Support | `it001` | `support123` |

These credentials are frontend fixtures for demonstration only. They are not
production authentication secrets.

## Validation

Before merging a contribution, run:

```bash
npm test
npm run build
```

Keep subsystem work in focused commits. Avoid committing `node_modules`,
generated `dist` output, local environment files, or unrelated module changes.
When the shared `main` branch changes, fetch and rebase before pushing so other
members' commits remain intact.

## Data and privacy note

The repository uses prototype records for coursework demonstrations. Protected
tree coordinates are masked for visitor-safe views, and stakeholder inventory
figures are contextual sample data rather than surveyed GIS measurements.
