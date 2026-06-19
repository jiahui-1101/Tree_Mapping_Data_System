import { useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import { AUDIT_LOGS } from "../../data/auditLogs.js";
import { filterAuditLogs } from "../../services/mockTreeService.js";
import { summarizeAuditOperations } from "../../services/auditOperationsService.js";
import AuditSummary from "./AuditSummary.jsx";

export default function AuditPage({ auditLogs = AUDIT_LOGS, qrScanEvents = [], showToast }) {
  const [type, setType] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [query, setQuery] = useState("");
  const logs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return filterAuditLogs(auditLogs, type, severity).filter((log) => {
      if (!needle) return true;
      return `${log.time} ${log.type} ${log.actor} ${log.role} ${log.event} ${log.severity}`.toLowerCase().includes(needle);
    });
  }, [auditLogs, query, type, severity]);
  const summary = summarizeAuditOperations(auditLogs, qrScanEvents);
  return (
    <Card title="System Audit Log" subtitle="All monitored events, logins, modifications and security alerts" actions={<button className="button button-small" onClick={() => showToast("Demo export prepared for the filtered audit log CSV.")}>Export Log</button>}>
      <div className="inline-warning">Rare Species Data Protection: GPS coordinates for all protected species are masked from unauthorized public roles.</div>
      <div className="inline-warning">SecurityAlerts demo: high severity events, failed login attempts, and invalid QR scans are counted for IT/Admin review.</div>
      <AuditSummary summary={summary} />
      <div className="page-toolbar audit-toolbar">
        <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search audit keyword, actor, role, event..." />
        <select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All event types</option><option value="login">Login</option><option value="edit">Edit</option><option value="qr_scan">QR Scan</option><option value="alert">Alert</option><option value="error">Error</option><option value="security">Security</option></select>
        <select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="all">All severity</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
      </div>
      <div className="audit-list">{logs.map((log, index) => <article key={`${log.time}-${index}`}><small>{log.time}</small><b className={`audit-${log.type}`}>{log.type}</b><span><strong>{log.actor}</strong><small>{log.role}</small>{log.event}</span><em>{log.severity}</em></article>)}</div>
    </Card>
  );
}
