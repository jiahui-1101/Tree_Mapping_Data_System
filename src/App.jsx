import { useCallback, useEffect, useState } from "react";
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
import { QRCODES, QR_SCAN_EVENTS, SPATIAL_PLANNING_RECORDS, VISITOR_HEATMAP_AGGREGATES } from "./data/ss4Operations.js";
import { TREES } from "./data/trees.js";
import { ROLE } from "./models.js";
import { canAccessPage } from "./services/mockAuthService.js";
import { nextTaskId, updateTreeRecord } from "./services/adminService.js";
import { createFieldReport } from "./services/rangerService.js";
import { createFieldTaskBackend, fetchFieldBackendState, submitFieldReportBackend, updateFieldTaskStatusBackend } from "./services/fieldApiService.js";
import { addCollectedTreeWithStatus, loadCollection, loadLanguage, saveLanguage } from "./services/storageService.js";
import { collectVisitorTreeBackend, recordVisitorScanBackend } from "./services/visitorApiService.js";
import { visitorText } from "./services/visitorI18n.js";

const ROLE_LABEL = {
  [ROLE.ADMIN]: "Admin",
  [ROLE.RANGER]: "Ranger",
  [ROLE.VISITOR]: "Visitor",
  [ROLE.IT_SUPPORT]: "IT Support",
};
const AUTH_STORAGE_KEY = "tbj.currentUser";
const FIELD_SYNC_INTERVAL_MS = 5000;

function loadSavedUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || "null");
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function saveUserSession(user) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

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
  const [user, setUser] = useState(loadSavedUser);
  const [activePage, setActivePage] = useState(() => {
    const savedUser = loadSavedUser();
    return savedUser ? DEFAULT_PAGE[savedUser.role] : "dashboard";
  });
  const [trees, setTrees] = useState(TREES);
  const [tasks, setTasks] = useState([]);
  const [fieldReports, setFieldReports] = useState([]);
  const [rangers, setRangers] = useState([]);
  const [fieldSchedule, setFieldSchedule] = useState(null);
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

  const syncFieldBackendState = useCallback(() => {
    let active = true;
    const request = fetchFieldBackendState().then((state) => {
      if (!active || !state) return;
      setTasks(state.tasks);
      setFieldReports(state.reports);
      setRangers(state.rangers);
      setFieldSchedule(state.schedule);
    });
    return { request, cancel: () => { active = false; } };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const sync = syncFieldBackendState();
    const intervalId = window.setInterval(() => {
      syncFieldBackendState();
    }, FIELD_SYNC_INTERVAL_MS);
    return () => {
      sync.cancel();
      window.clearInterval(intervalId);
    };
  }, [syncFieldBackendState, user]);

  const handleLogin = (nextUser) => {
    saveUserSession(nextUser);
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
  };

  const handleLogout = () => {
    saveUserSession(null);
    setUser(null);
  };

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
    return <LoginPage onLogin={handleLogin} />;
  }

  const navigate = (page) => {
    if (canAccessPage(user.role, page)) setActivePage(page);
    else {
      appendAudit({ type: "security", event: `Access denied for ${page}`, severity: "high" });
      showToast("Access denied for this role.");
    }
  };

  const collect = (tree) => {
    const result = addCollectedTreeWithStatus(tree.id);
    setCollection(result.collection);
    showToast(visitorText(language, result.isNew ? "collection.unlocked" : "collection.alreadyCollected", { name: tree.name }));
    void collectVisitorTreeBackend({ tree, language });
  };

  const completeScan = (tree, message, reportDraft) => {
    if (user.role === ROLE.VISITOR) {
      collect(tree);
      void recordVisitorScanBackend({ tree, language, source: "qr" });
      setScannedTree(tree);
      return null;
    }
    if (user.role === ROLE.RANGER && reportDraft) {
      const report = createFieldReport({ draft: reportDraft, tree, rangerName: user.name, tasks, existingReports: fieldReports });
      setFieldReports((current) => [report, ...current]);
      if (report.taskId) setTasks((current) => current.map((task) => task.id === report.taskId ? { ...task, status: "completed" } : task));
      setTrees((current) => current.map((item) => item.id === report.treeId ? {
        ...item,
        status: report.observedStatus,
        health: report.observedStatus === "critical" ? 38 : report.observedStatus === "monitor" ? 68 : 94,
      } : item));
      appendAudit({
        type: "edit",
        event: `${report.id} submitted for ${report.treeId}; Trees.health_status updated to ${report.observedStatus}`,
        severity: report.observedStatus === "critical" ? "high" : "medium",
      });
      showToast(`${report.id} submitted. Report synced to admin dashboard.`);
      void submitFieldReportBackend({ treeId: tree.id, rangerName: user.name, draft: reportDraft }).then((result) => {
        if (!result?.report) return;
        setFieldReports(result.reports || ((current) => [result.report, ...current.filter((item) => item.id !== report.id)]));
        if (result.tasks) setTasks(result.tasks);
      });
      return report;
    }
    showToast(message);
    return null;
  };

  const updateTask = (id, status) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, status } : task));
    void updateFieldTaskStatusBackend({ taskId: id, status }).then((result) => {
      if (result?.tasks) setTasks(result.tasks);
    });
  };
  const syncFieldState = (payload = {}) => {
    if (payload.tasks) setTasks(payload.tasks);
    if (payload.reports) setFieldReports(payload.reports);
    if (payload.rangers) setRangers(payload.rangers);
    if (payload.schedule !== undefined) setFieldSchedule(payload.schedule);
  };
  const addTask = (taskDraft) => {
    const task = { ...taskDraft, id: taskDraft.id || nextTaskId(tasks), status: taskDraft.status || "pending" };
    setTasks((current) => [...current, task]);
    void createFieldTaskBackend(task).then((result) => {
      if (result?.tasks) setTasks(result.tasks);
    });
    return task;
  };
  const updateTree = (id, patch) => {
    setTrees((current) => updateTreeRecord(current, id, patch));
    appendAudit({ type: "edit", event: `Tree ${id} record updated by Admin`, severity: patch.status === "critical" ? "high" : "low" });
  };
  const addTree = ({ name, scientificName }) => {
    const id = `TBJ-${String(trees.length + 1).padStart(3, "0")}`;
    setTrees((current) => [...current, { id, name, scientificName, zone: "Arboretum", age: 1, height: 1, health: 100, status: "healthy", rare: false, x: 42, y: 51, description: "New tree record created in the modular UI prototype." }]);
    const qrId = `QR-${id}`;
    setQrCodes((current) => [...current, { qrId, treeId: id, qrEndpoint: `/scan/${qrId}`, qrStatus: "active", generatedAt: nowLabel(), generatedBy: user.id, exportedAt: "", invalidatedAt: "", replacedBy: "" }]);
    appendAudit({ type: "edit", event: `${qrId} generated for new tree ${id}`, severity: "low" });
    showToast(`${id} created with a mock QR label.`);
  };
  const archiveTree = (id) => {
    setTrees((current) => current.filter((tree) => tree.id !== id));
    setQrCodes((current) => current.map((qr) => qr.treeId === id && qr.qrStatus === "active" ? { ...qr, qrStatus: "invalidated", invalidatedAt: nowLabel() } : qr));
    appendAudit({ type: "security", event: `Tree ${id} archived; active QR labels invalidated`, severity: "medium" });
    showToast(`${id} archived. Its previous QR label is now invalid in the UI mock.`);
  };

  const recordQrScan = ({ rawId, qrCode, tree, scanResult }) => {
    const resolvedQr = qrCode || getQrForInput(rawId, qrCodes);
    const roleDetected = ROLE_LABEL[user.role];
    const routedTo = scanResult === "success"
      ? user.role === ROLE.RANGER ? "SS2-M2-D Field Report" : "SS3-M3-A Tree ID Card"
      : "Blocked";
    const event = {
      scanId: nextSequence("QSE", qrScanEvents, "scanId", 105),
      qrId: resolvedQr?.qrId || String(rawId || "UNKNOWN"),
      treeId: resolvedQr?.treeId || tree?.id || String(rawId || "UNKNOWN"),
      actorId: user.id,
      roleDetected,
      routedTo,
      scanResult,
      scannedAt: nowLabel(),
    };
    setQrScanEvents((current) => [event, ...current]);
    appendAudit({
      type: scanResult === "success" ? "qr_scan" : "security",
      event: `${event.qrId} scan ${scanResult} for ${event.treeId}; routed to ${routedTo}`,
      severity: scanResult === "success" ? "low" : "high",
    });
    return event;
  };

  const confirmSpatialPlan = ({ point, species, targetZone, score, tone, reasoning }) => {
    const record = {
      planId: nextSequence("SPR", spatialPlanningRecords, "planId", 204),
      createdBy: user.id,
      species,
      targetZone,
      proposedX: point.x,
      proposedY: point.y,
      suitabilityScore: score,
      suitabilityLabel: tone,
      aiReasoning: reasoning,
      decision: "confirmed",
      createdAt: nowLabel(),
    };
    setSpatialPlanningRecords((current) => [record, ...current]);
    appendAudit({ type: "edit", event: `${record.planId} confirmed for ${species} in ${targetZone}`, severity: tone === "Low" ? "medium" : "low" });
    showToast(`${record.planId} confirmed and written to SpatialPlanningRecords.`);
  };

  const changeLanguage = (next) => {
    saveLanguage(next);
    setLanguage(next);
  };

  const pageProps = { role: user.role, user, trees, tasks, fieldReports, rangers, fieldSchedule, qrCodes, qrScanEvents, spatialPlanningRecords, visitorHeatmapAggregates, auditLogs, language, showToast, onSyncFieldState: syncFieldState };
  let content;
  switch (activePage) {
    case "dashboard": content = <DashboardPage {...pageProps} onNavigate={navigate} />; break;
    case "inventory": content = <InventoryPage {...pageProps} onAddTree={addTree} onArchiveTree={archiveTree} onUpdateTree={updateTree} />; break;
    case "maintenance": content = <MaintenancePage {...pageProps} onAddTask={addTask} onNavigate={navigate} />; break;
    case "schedule": content = <SchedulePage {...pageProps} onAddTask={addTask} />; break;
    case "rangers": content = <RangerManagementPage {...pageProps} />; break;
    case "tasks": content = <TaskTrackerPage {...pageProps} onUpdateTask={updateTask} />; break;
    case "ranger-tasks": content = <RangerTasksPage {...pageProps} onUpdateTask={updateTask} onOpenScanner={() => setScannerOpen(true)} />; break;
    case "ranger-reports": content = <RangerReportsPage {...pageProps} />; break;
    case "qr": content = <QRPage role={user.role} language={language} onOpenScanner={() => setScannerOpen(true)} />; break;
    case "map": content = <MapPage {...pageProps} onOpenScanner={() => setScannerOpen(true)} />; break;
    case "spatial": content = <SpatialPage {...pageProps} onConfirmSpatialPlan={confirmSpatialPlan} />; break;
    case "audit": content = <AuditPage {...pageProps} />; break;
    case "explore": content = <ExplorePage {...pageProps} onLanguage={changeLanguage} onTreeClick={setScannedTree} onOpenScanner={() => setScannerOpen(true)} />; break;
    case "profiles": content = <ProfilesPage {...pageProps} onCollect={collect} />; break;
    case "chat": content = <ChatPage language={language} />; break;
    case "collection": content = <CollectionPage {...pageProps} collection={collection} onOpenScanner={() => setScannerOpen(true)} />; break;
    case "it-dashboard": content = <ITDashboardPage {...pageProps} onNavigate={navigate} />; break;
    case "it-monitoring": content = <SystemMonitoringPage {...pageProps} />; break;
    case "it-users": content = <UserAccessPage {...pageProps} />; break;
    case "it-tickets": content = <IncidentTicketsPage {...pageProps} />; break;
    default: content = <DashboardPage {...pageProps} onNavigate={navigate} />;
  }

  return (
    <AppShell role={user.role} user={user} activePage={activePage} language={language} onNavigate={navigate} onLogout={handleLogout}>
      {content}
      {scannerOpen && <QRScanner role={user.role} trees={trees} qrCodes={qrCodes} language={language} onClose={() => setScannerOpen(false)} onComplete={completeScan} onScanEvent={recordQrScan} />}
      {scannedTree && user.role === ROLE.VISITOR && <TreeIdCardModal tree={scannedTree} language={language} onClose={() => setScannedTree(null)} onCollect={(tree) => { collect(tree); setScannedTree(null); }} />}
      {user.role === ROLE.VISITOR && activePage !== "chat" && <ChatFloatingButton language={language} onClick={() => navigate("chat")} />}
      <Toast message={toast} onClose={() => setToast("")} />
    </AppShell>
  );
}
