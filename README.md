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

## Module to Frontend Script Mapping

The links below provide a direct index from each functional module to its main
frontend implementation files.

### Shared Backbone and QR

| Module | Frontend Script |
| --- | --- |
| Application entry and routing | [App.jsx](src/App.jsx) |
| Authentication and role login | [LoginPage.jsx](src/features/auth/LoginPage.jsx), [demoUsers.js](src/config/demoUsers.js) |
| Application shell | [AppShell.jsx](src/components/layout/AppShell.jsx) |
| Desktop navigation | [Sidebar.jsx](src/components/layout/Sidebar.jsx), [Topbar.jsx](src/components/layout/Topbar.jsx) |
| Mobile navigation | [MobileNav.jsx](src/components/layout/MobileNav.jsx) |
| Role navigation configuration | [navigation.js](src/config/navigation.js) |
| Shared notification and modal UI | [Toast.jsx](src/components/common/Toast.jsx), [Modal.jsx](src/components/common/Modal.jsx) |
| QR interaction page | [QRPage.jsx](src/components/qr/QRPage.jsx) |
| Role-aware QR scanner | [QRScanner.jsx](src/components/qr/QRScanner.jsx) |
| Printable tree QR label | [TreeQrLabel.jsx](src/components/qr/TreeQrLabel.jsx) |

### Subsystem 1 - Tree Health

| Module | Frontend Script |
| --- | --- |
| Tree health dashboard | [DashboardPage.jsx](src/features/ss1-health/DashboardPage.jsx) |
| Tree inventory management | [InventoryPage.jsx](src/features/ss1-health/InventoryPage.jsx) |
| Predictive maintenance | [MaintenancePage.jsx](src/features/ss1-health/MaintenancePage.jsx) |

### Subsystem 2 - Ranger and Field Operations

| Module | Frontend Script |
| --- | --- |
| Workforce schedule | [SchedulePage.jsx](src/features/ss2-field/SchedulePage.jsx) |
| Ranger management | [RangerManagementPage.jsx](src/features/ss2-field/RangerManagementPage.jsx) |
| Administrative task tracker | [TaskTrackerPage.jsx](src/features/ss2-field/TaskTrackerPage.jsx) |
| Ranger task workflow | [RangerTasksPage.jsx](src/features/ss2-field/RangerTasksPage.jsx) |
| Ranger field reports | [RangerReportsPage.jsx](src/features/ss2-field/RangerReportsPage.jsx) |

### Subsystem 3 - Visitor Experience

| Module | Frontend Script |
| --- | --- |
| Garden exploration and route | [ExplorePage.jsx](src/features/ss3-visitor/ExplorePage.jsx) |
| Tree profiles | [ProfilesPage.jsx](src/features/ss3-visitor/ProfilesPage.jsx) |
| Visitor collection | [CollectionPage.jsx](src/features/ss3-visitor/CollectionPage.jsx) |
| Botanical assistant | [ChatPage.jsx](src/features/ss3-visitor/ChatPage.jsx) |
| Tree identification card | [TreeIdCardModal.jsx](src/features/ss3-visitor/TreeIdCardModal.jsx) |

### Subsystem 4 - Mapping Operations

| Module | Frontend Script |
| --- | --- |
| 3D garden map page | [MapPage.jsx](src/features/ss4-map/MapPage.jsx) |
| Interactive map renderer | [GardenMap.jsx](src/components/map/GardenMap.jsx), [ThreeGardenScene.jsx](src/components/map/ThreeGardenScene.jsx) |
| Map layer selection and metrics | [MapLayerSelector.jsx](src/features/ss4-map/MapLayerSelector.jsx), [MapOperationsSummary.jsx](src/features/ss4-map/MapOperationsSummary.jsx) |
| Zone and stakeholder details | [ZoneInventorySummary.jsx](src/features/ss4-map/ZoneInventorySummary.jsx), [StakeholderDetailsPanel.jsx](src/features/ss4-map/StakeholderDetailsPanel.jsx) |
| Spatial planning | [SpatialPage.jsx](src/features/ss4-map/SpatialPage.jsx), [SpatialConfigForm.jsx](src/features/ss4-map/SpatialConfigForm.jsx), [SpatialSuitability.jsx](src/features/ss4-map/SpatialSuitability.jsx) |
| Audit operations | [AuditPage.jsx](src/features/ss4-map/AuditPage.jsx), [AuditFilters.jsx](src/features/ss4-map/AuditFilters.jsx), [AuditLogList.jsx](src/features/ss4-map/AuditLogList.jsx) |

### IT Support Operations

| Module | Frontend Script |
| --- | --- |
| IT support workspace | [ITSupportShell.jsx](src/features/it-support/ITSupportShell.jsx) |
| IT operations dashboard | [ITDashboardPage.jsx](src/features/it-support/ITDashboardPage.jsx) |
| System monitoring and logs | [SystemMonitoringPage.jsx](src/features/it-support/SystemMonitoringPage.jsx), [ServiceLogViewer.jsx](src/features/it-support/ServiceLogViewer.jsx) |
| Incident ticket management | [IncidentTicketsPage.jsx](src/features/it-support/IncidentTicketsPage.jsx), [TicketFilters.jsx](src/features/it-support/TicketFilters.jsx) |
| User and access control | [UserAccessPage.jsx](src/features/it-support/UserAccessPage.jsx), [AccessFilters.jsx](src/features/it-support/AccessFilters.jsx) |

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
