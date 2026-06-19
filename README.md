# Tree Mapping Data System for Johor Botanical Garden

Frontend prototype for the Johor Botanical Garden Tree Mapping Data System, developed by **NextLevel** for SCSE2243 Application Development.

The system is designed to digitise tree inventory, field operations, visitor education, QR-based access, and map-based decision support for garden management. This repository contains the React/Vite user interface prototype with mock data, simulated AI responses, and role-based flows for demonstration.

## Project Background

Johor Botanical Garden requires a more efficient way to manage tree records, monitor tree health, assign ranger tasks, guide visitors, and visualise garden activity. The proposed Tree Mapping Data System combines four connected subsystems:

- **SS1 - Tree Health Monitoring & Diagnostics**: dashboard, inventory, health insights, and predictive maintenance UI.
- **SS2 - Scheduling & Field Task Management**: ranger accounts, workforce schedule, task tracker, and QR-based field reporting.
- **SS3 - Visitor Engagement & Education**: tree profiles, visitor route exploration, AI botanical assistant UI, multilingual content, and collection history.
- **SS4 - Map, QR & Interactive Visualization System**: garden map, QR scan routing, spatial planning simulation, overlay analytics, and audit log.

The prototype supports four user roles: **Admin**, **Ranger**, **Visitor**, and **IT Support**.

## GitHub Module Index

<table>
  <tr>
    <th>Module</th>
    <th>Frontend Script</th>
  </tr>
  <tr>
    <td>Authentication and Role Access</td>
    <td>
      <a href="src/features/auth/LoginPage.jsx">LoginPage.jsx</a><br>
      <a href="src/services/mockAuthService.js">mockAuthService.js</a>
    </td>
  </tr>
  <tr>
    <td>App Shell and Navigation</td>
    <td>
      <a href="src/App.jsx">App.jsx</a><br>
      <a href="src/config/navigation.js">navigation.js</a><br>
      <a href="src/components/layout/AppShell.jsx">AppShell.jsx</a>
    </td>
  </tr>
  <tr>
    <td>SS1 - Tree Health Monitoring and Diagnostics</td>
    <td>
      <a href="src/features/ss1-health/DashboardPage.jsx">DashboardPage.jsx</a><br>
      <a href="src/features/ss1-health/InventoryPage.jsx">InventoryPage.jsx</a><br>
      <a href="src/features/ss1-health/MaintenancePage.jsx">MaintenancePage.jsx</a>
    </td>
  </tr>
  <tr>
    <td>SS2 - Scheduling and Field Task Management</td>
    <td>
      <a href="src/features/ss2-field/SchedulePage.jsx">SchedulePage.jsx</a><br>
      <a href="src/features/ss2-field/TaskTrackerPage.jsx">TaskTrackerPage.jsx</a><br>
      <a href="src/features/ss2-field/RangerTasksPage.jsx">RangerTasksPage.jsx</a><br>
      <a href="src/features/ss2-field/RangerReportsPage.jsx">RangerReportsPage.jsx</a><br>
      <a href="src/features/ss2-field/RangerManagementPage.jsx">RangerManagementPage.jsx</a>
    </td>
  </tr>
  <tr>
    <td>SS3 - Visitor Engagement and Education</td>
    <td>
      <a href="src/features/ss3-visitor/ExplorePage.jsx">ExplorePage.jsx</a><br>
      <a href="src/features/ss3-visitor/ProfilesPage.jsx">ProfilesPage.jsx</a><br>
      <a href="src/features/ss3-visitor/ChatPage.jsx">ChatPage.jsx</a><br>
      <a href="src/features/ss3-visitor/CollectionPage.jsx">CollectionPage.jsx</a><br>
      <a href="src/features/ss3-visitor/TreeIdCardModal.jsx">TreeIdCardModal.jsx</a>
    </td>
  </tr>
  <tr>
    <td>SS4 - Map, QR and Interactive Visualization</td>
    <td>
      <a href="src/features/ss4-map/MapPage.jsx">MapPage.jsx</a><br>
      <a href="src/features/ss4-map/SpatialPage.jsx">SpatialPage.jsx</a><br>
      <a href="src/features/ss4-map/AuditPage.jsx">AuditPage.jsx</a><br>
      <a href="src/components/map/GardenMap.jsx">GardenMap.jsx</a><br>
      <a href="src/components/qr/QRPage.jsx">QRPage.jsx</a><br>
      <a href="src/components/qr/QRScanner.jsx">QRScanner.jsx</a><br>
      <a href="src/components/qr/TreeQrLabel.jsx">TreeQrLabel.jsx</a>
    </td>
  </tr>
  <tr>
    <td>IT Support Operations</td>
    <td>
      <a href="src/features/it-support/ITDashboardPage.jsx">ITDashboardPage.jsx</a><br>
      <a href="src/features/it-support/SystemMonitoringPage.jsx">SystemMonitoringPage.jsx</a><br>
      <a href="src/features/it-support/UserAccessPage.jsx">UserAccessPage.jsx</a><br>
      <a href="src/features/it-support/IncidentTicketsPage.jsx">IncidentTicketsPage.jsx</a>
    </td>
  </tr>
  <tr>
    <td>Mock Data and Services</td>
    <td>
      <a href="src/data">src/data</a><br>
      <a href="src/services">src/services</a>
    </td>
  </tr>
</table>

## Features

- Role-based login and navigation for Admin, Ranger, Visitor, and IT Support users.
- Admin dashboard for tree health summaries, AI-style alerts, task progress, and inventory updates.
- Ranger workflow for assigned tasks, QR tree scanning, and field report submission.
- Visitor portal with route exploration, tree profiles, collection history, multilingual UI text, and botanical chat interface.
- Interactive garden map with tree markers, health status overlays, QR workflows, spatial planning records, and audit visibility.
- IT support area for system monitoring, user access review, support tickets, and protected operational views.

## Tech Stack

- **React** for the frontend interface.
- **Vite** for local development and production build tooling.
- **Three.js** for the 3D garden scene.
- **qrcode** for QR label generation.
- **Node.js test runner** for service-level tests.
- Local mock data and browser `localStorage` for prototype state.

## Run Locally

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/jiahui-1101/Tree_Mapping_Data_System.git
cd Tree_Mapping_Data_System
npm install
npm run dev
```

Vite prints the local development address in the terminal. Open that address in
a modern browser.

### Available Commands

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run preview  # Preview the production build
npm test         # Run service and integration tests
```

## Demo Accounts

| Role | ID | Password |
| --- | --- | --- |
| Admin | `admin001` | `admin123` |
| Ranger | `RGR001` | `ranger123` |
| Visitor | `visitor@gmail.com` | `visitor123` |
| IT Support | `it001` | `support123` |

Visitors can also continue as guests. Visitor collection history and selected language are stored in browser `localStorage`.

## Prototype Notes

This repository is a frontend UI prototype. The following items are represented by mock data, simulated UI states, or local browser storage only:

- Backend authentication and user session persistence.
- Database synchronization and server-side storage.
- Real AI model/API calls for diagnosis, route recommendation, chatbot responses, or spatial planning.
- QR endpoint generation and production scan routing.
- GPS validation, push notifications, and offline mobile synchronization.
- Server-side audit log persistence and security enforcement.

## Project Structure

```text
src/
  components/       Shared layout, common UI, map, and QR components
  config/           Navigation and page metadata
  data/             Mock records for trees, tasks, reports, audits, and operations
  features/         Role and subsystem feature pages
  services/         Mock business logic, auth, storage, ranger, admin, and visitor helpers
  styles/           Global styles, responsive rules, tokens, and component styles
test/               Service and integration tests
```

## Validation and Contributions

Before merging a contribution, run:

```bash
npm test
npm run build
```

Keep subsystem work in focused commits. Do not commit `node_modules`, generated
`dist` output, local environment files, or unrelated module changes. Fetch and
integrate the latest shared `main` branch before pushing.

## Data and Privacy Note

This repository uses prototype records for coursework demonstrations. Protected
tree coordinates are masked in visitor-facing views, and operational records are
sample data rather than production or surveyed GIS data.

