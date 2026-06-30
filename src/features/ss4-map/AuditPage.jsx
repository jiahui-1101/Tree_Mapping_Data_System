import { useEffect, useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import { AUDIT_LOGS } from "../../data/auditLogs.js";
import { filterAuditLogs } from "../../services/mockTreeService.js";
import { fetchSs4AuditLogsBackend, fetchSs4SecurityAlertsBackend } from "../../services/ss4ApiService.js";

export default function AuditPage({ auditLogs = AUDIT_LOGS, qrScanEvents = [], showToast }) {
  const [type, setType] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [query, setQuery] = useState("");
  const [backendLogs, setBackendLogs] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const sourceLogs = backendLogs || auditLogs;
  useEffect(() => {
    let mounted = true;
    Promise.all([fetchSs4AuditLogsBackend(), fetchSs4SecurityAlertsBackend()]).then(([logPayload, alertPayload]) => {
      if (!mounted) return;
      if (logPayload?.ok) setBackendLogs(logPayload.data || []);
      if (alertPayload?.ok) setSecurityAlerts(alertPayload.data || []);
    });
    return () => { mounted = false; };
  }, []);
  const logs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return filterAuditLogs(sourceLogs, type, severity).filter((log) => {
      if (!needle) return true;
      return `${log.time} ${log.type} ${log.actor} ${log.role} ${log.event} ${log.severity}`.toLowerCase().includes(needle);
    });
  }, [sourceLogs, query, type, severity]);
  const highSeverity = sourceLogs.filter((log) => log.severity === "high").length;
  const failedLogins = sourceLogs.filter((log) => log.event.toLowerCase().includes("failed")).length;
  const systemErrors = sourceLogs.filter((log) => log.type === "error").length;
  const invalidQrScans = qrScanEvents.filter((event) => event.scanResult !== "success").length;
  return (
    <Card title="System Audit Log" subtitle={`All monitored events, logins, modifications and security alerts · ${backendLogs ? "SS4 backend API" : "local fallback"}`} actions={<button className="button button-small" onClick={() => showToast("Demo export prepared for the filtered audit log CSV.")}>Export Log</button>}>
      <div className="inline-warning">Rare Species Data Protection: GPS coordinates for all protected species are masked from unauthorized public roles.</div>
      <div className="inline-warning">SecurityAlerts demo: high severity events, failed login attempts, and invalid QR scans are counted for IT/Admin review.</div>
      <div className="it-audit-summary">
        <article><strong>{highSeverity}</strong><span>High severity</span></article>
        <article><strong>{failedLogins}</strong><span>Failed logins</span></article>
        <article><strong>{systemErrors}</strong><span>System errors</span></article>
        <article><strong>{Math.max(invalidQrScans, securityAlerts.length)}</strong><span>Security alerts</span></article>
      </div>
      <div className="page-toolbar audit-toolbar">
        <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search audit keyword, actor, role, event..." />
        <select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All event types</option><option value="login">Login</option><option value="edit">Edit</option><option value="qr_scan">QR Scan</option><option value="alert">Alert</option><option value="error">Error</option><option value="security">Security</option></select>
        <select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="all">All severity</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
      </div>
      <div className="audit-list">{logs.map((log, index) => <article key={`${log.time}-${index}`}><small>{log.time}</small><b className={`audit-${log.type}`}>{log.type}</b><span><strong>{log.actor}</strong><small>{log.role}</small>{log.event}</span><em>{log.severity}</em></article>)}</div>
    </Card>
  );
}

