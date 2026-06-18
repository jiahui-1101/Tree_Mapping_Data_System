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

const ROLE_LABEL = {
  [ROLE.ADMIN]: "Admin",
  [ROLE.RANGER]: "Ranger",
  [ROLE.VISITOR]: "Visitor",
  [ROLE.IT_SUPPORT]: "IT Support",
};

function nowLabel() {
  return "Just now";
}

function nextSequence(prefix, records, key, start = 1) {
  const max = records.reduce((current, record) => {
    const value = Number(String(record[key] || "").match(/(\d+)$/)?.[1] || 0);
    return Math.max(current, value);
  }, start - 1);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

function getQrForInput(rawValue, qrCodes = []) {
  const normalized = String(rawValue || "").trim().toLowerCase();
  return qrCodes.find((qr) => (
    qr.qrId.toLowerCase() === normalized ||
    qr.qrEndpoint.toLowerCase() === normalized ||
    qr.treeId.toLowerCase() === normalized
  )) || null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [trees, setTrees] = useState(TREES);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [fieldReports, setFieldReports] = useState(INITIAL_FIELD_REPORTS);
  const [qrCodes, setQrCodes] = useState(QRCODES);
  const [qrScanEvents, setQrScanEvents] = useState(QR_SCAN_EVENTS);
  const [spatialPlanningRecords, setSpatialPlanningRecords] = useState(SPATIAL_PLANNING_RECORDS);
  const [visitorHeatmapAggregates] = useState(VISITOR_HEATMAP_AGGREGATES);
  const [auditLogs, setAuditLogs] = useState(AUDIT_LOGS);
  const [collection, setCollection] = useState(loadCollection);
  const [language, setLanguage] = useState(loadLanguage);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedTree, setScannedTree] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = useCallback((message) => setToast(message), []);

  const appendAudit = useCallback((entry) => {
    setAuditLogs((current) => [{
      time: nowLabel(),
      type: entry.type || "edit",
      actor: entry.actor || user?.name || "System",
      role: entry.role || ROLE_LABEL[user?.role] || "System",
      event: entry.event,
      severity: entry.severity || "low",
    }, ...current]);
  }, [user]);

  if (!user) {
    return <LoginPage onLogin={(nextUser) => {
      setUser(nextUser);
      setActivePage(DEFAULT_PAGE[nextUser.role]);
      setAuditLogs((current) => [{
        time: nowLabel(),
        type: "login",
        actor: nextUser.name,
        role: ROLE_LABEL[nextUser.role],
        event: `Signed in as ${ROLE_LABEL[nextUser.role]}`,
        severity: "low",
      }, ...current]);
    }} />;
  }

  const navigate = (page) => {
    if (canAccessPage(user.role, page)) setActivePage(page);
    else {
      appendAudit({ type: "security", event: `Access denied for ${page}`, severity: "high" });
      showToast("Access denied for this role.");
    }
  };

  return (
    <main className="ss4-app">
      <header className="ss4-header">
        <div>
          <span className="eyebrow">Subsystem 4</span>
          <h1>Mapping Operations</h1>
        </div>
      </header>
      {toast && <div className="ss4-toast">{toast}</div>}
    </main>
  );
}