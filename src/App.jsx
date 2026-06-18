import { useCallback, useState } from "react";
import AppShell from "./components/layout/AppShell.jsx";
import Toast from "./components/common/Toast.jsx";
import QRScanner from "./components/qr/QRScanner.jsx";
import QRPage from "./components/qr/QRPage.jsx";
import LoginPage from "./features/auth/LoginPage.jsx";
import DashboardPage from "./features/ss1-health/DashboardPage.jsx";
import InventoryPage from "./features/ss1-health/InventoryPage.jsx";
import MaintenancePage from "./features/ss1-health/MaintenancePage.jsx";
import RangerManagementPage from "./features/ss2-field/RangerManagementPage.jsx";
import RangerTasksPage from "./features/ss2-field/RangerTasksPage.jsx";
import SchedulePage from "./features/ss2-field/SchedulePage.jsx";
import TaskTrackerPage from "./features/ss2-field/TaskTrackerPage.jsx";
import ChatPage, { ChatFloatingButton } from "./features/ss3-visitor/ChatPage.jsx";
import CollectionPage from "./features/ss3-visitor/CollectionPage.jsx";
import ExplorePage from "./features/ss3-visitor/ExplorePage.jsx";
import ProfilesPage from "./features/ss3-visitor/ProfilesPage.jsx";
import TreeIdCardModal from "./features/ss3-visitor/TreeIdCardModal.jsx";
import ITDashboardPage from "./features/it-support/ITDashboardPage.jsx";
import IncidentTicketsPage from "./features/it-support/IncidentTicketsPage.jsx";
import SystemMonitoringPage from "./features/it-support/SystemMonitoringPage.jsx";
import UserAccessPage from "./features/it-support/UserAccessPage.jsx";
import RangerReportsPage from "./features/ss2-field/RangerReportsPage.jsx";
import AuditPage from "./features/ss4-map/AuditPage.jsx";
import MapPage from "./features/ss4-map/MapPage.jsx";
import SpatialPage from "./features/ss4-map/SpatialPage.jsx";
import { DEFAULT_PAGE } from "./config/navigation.js";
import { AUDIT_LOGS } from "./data/auditLogs.js";
import { INITIAL_FIELD_REPORTS } from "./data/fieldReports.js";
import { QRCODES, QR_SCAN_EVENTS, SPATIAL_PLANNING_RECORDS, VISITOR_HEATMAP_AGGREGATES } from "./data/ss4Operations.js";
import { INITIAL_TASKS } from "./data/tasks.js";
import { TREES } from "./data/trees.js";
import { ROLE } from "./models.js";
import { canAccessPage } from "./services/mockAuthService.js";
import { nextTaskId, updateTreeRecord } from "./services/adminService.js";
import { createFieldReport } from "./services/rangerService.js";
import { addCollectedTreeWithStatus, loadCollection, loadLanguage, saveLanguage } from "./services/storageService.js";
import { visitorText } from "./services/visitorI18n.js";

const PAGES = [
  { id: "map", label: "Garden Map" },
  { id: "audit", label: "Audit Log" },
  { id: "spatial", label: "Spatial Planning" },
];

export default function App() {
  const [page, setPage] = useState("map");
  const [toast, setToast] = useState("");
  const [spatialRecords, setSpatialRecords] = useState(SPATIAL_PLANNING_RECORDS);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  return (
    <main className="ss4-app">
      <header className="ss4-header">
        <div>
          <span className="eyebrow">Subsystem 4</span>
          <h1>Mapping Operations</h1>
        </div>
        <nav className="ss4-tabs" aria-label="Subsystem 4 pages">
          {PAGES.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="ss4-content">
        {page === "map" && (
          <MapPage
            role={ROLE.ADMIN}
            trees={TREES}
            qrCodes={QRCODES}
            qrScanEvents={QR_SCAN_EVENTS}
            visitorHeatmapAggregates={VISITOR_HEATMAP_AGGREGATES}
            onOpenScanner={() => showToast("QR scanner integration will be connected by its owning module.")}
          />
        )}
        {page === "audit" && <AuditPage qrScanEvents={QR_SCAN_EVENTS} showToast={showToast} />}
        {page === "spatial" && (
          <SpatialPage
            trees={TREES}
            spatialPlanningRecords={spatialRecords}
            showToast={showToast}
            onConfirmSpatialPlan={(plan) => {
              setSpatialRecords((records) => [
                {
                  planId: `SPR-${Date.now()}`,
                  species: plan.species,
                  targetZone: plan.targetZone,
                  proposedX: plan.point.x,
                  proposedY: plan.point.y,
                  suitabilityScore: plan.score,
                  suitabilityLabel: plan.tone,
                  decision: "confirmed",
                },
                ...records,
              ]);
              showToast("Spatial plan confirmed.");
            }}
          />
        )}
      </section>

      {toast && <div className="ss4-toast">{toast}</div>}
    </main>
  );
}
