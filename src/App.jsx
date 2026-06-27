import { useCallback, useState } from "react";
import { getQrForInput, nextSequence, nowLabel, ROLE_LABEL } from "./app/appUtils.js";
import { LoginPage, renderAppPage } from "./app/pageRenderer.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import Toast from "./components/common/Toast.jsx";
import QRScanner from "./components/qr/QRScanner.jsx";
import ChatPage, { ChatFloatingButton } from "./features/ss3-visitor/ChatPage.jsx";
import TreeIdCardModal from "./features/ss3-visitor/TreeIdCardModal.jsx";
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

  const collect = (tree) => {
    const result = addCollectedTreeWithStatus(tree.id);
    setCollection(result.collection);
    showToast(visitorText(language, result.isNew ? "collection.unlocked" : "collection.alreadyCollected", { name: tree.name }));
  };

  const completeScan = (tree, message, reportDraft) => {
    if (user.role === ROLE.VISITOR) {
      collect(tree);
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
      return report;
    }
    showToast(message);
    return null;
  };

  const updateTask = (id, status) => setTasks((current) => current.map((task) => task.id === id ? { ...task, status } : task));
  const addTask = (taskDraft) => {
    const task = { ...taskDraft, id: taskDraft.id || nextTaskId(tasks), status: taskDraft.status || "pending" };
    setTasks((current) => [...current, task]);
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

  const pageProps = { role: user.role, user, trees, tasks, fieldReports, qrCodes, qrScanEvents, spatialPlanningRecords, visitorHeatmapAggregates, auditLogs, language, showToast };
  const content = renderAppPage({
    activePage,
    pageProps,
    handlers: {
      navigate,
      addTree,
      archiveTree,
      updateTree,
      addTask,
      updateTask,
      openScanner: () => setScannerOpen(true),
      confirmSpatialPlan,
      changeLanguage,
      setScannedTree,
      collect,
      collection,
      renderChatPage: () => <ChatPage language={language} />,
    },
  });

  return (
    <AppShell role={user.role} user={user} activePage={activePage} language={language} onNavigate={navigate} onLogout={() => setUser(null)}>
      {content}
      {scannerOpen && <QRScanner role={user.role} trees={trees} qrCodes={qrCodes} language={language} onClose={() => setScannerOpen(false)} onComplete={completeScan} onScanEvent={recordQrScan} />}
      {scannedTree && user.role === ROLE.VISITOR && <TreeIdCardModal tree={scannedTree} language={language} onClose={() => setScannedTree(null)} onCollect={(tree) => { collect(tree); setScannedTree(null); }} />}
      {user.role === ROLE.VISITOR && activePage !== "chat" && <ChatFloatingButton language={language} onClick={() => navigate("chat")} />}
      <Toast message={toast} onClose={() => setToast("")} />
    </AppShell>
  );
}

