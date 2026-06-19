import { useMemo, useState } from "react";
import Card from "../../components/common/Card.jsx";
import { AUDIT_LOGS } from "../../data/auditLogs.js";
import { filterAuditLogs } from "../../services/mockTreeService.js";
import { searchAuditLogs, summarizeAuditOperations } from "../../services/auditOperationsService.js";
import AuditSummary from "./AuditSummary.jsx";
import AuditFilters from "./AuditFilters.jsx";
import AuditLogList from "./AuditLogList.jsx";

export default function AuditPage({ auditLogs = AUDIT_LOGS, qrScanEvents = [], showToast }) {
  const [type, setType] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [query, setQuery] = useState("");
  const logs = useMemo(() => {
    return searchAuditLogs(filterAuditLogs(auditLogs, type, severity), query);
  }, [auditLogs, query, type, severity]);
  const summary = summarizeAuditOperations(auditLogs, qrScanEvents);
  return (
    <Card title="System Audit Log" subtitle="All monitored events, logins, modifications and security alerts" actions={<button className="button button-small" onClick={() => showToast("Demo export prepared for the filtered audit log CSV.")}>Export Log</button>}>
      <div className="inline-warning">Rare Species Data Protection: GPS coordinates for all protected species are masked from unauthorized public roles.</div>
      <div className="inline-warning">SecurityAlerts demo: high severity events, failed login attempts, and invalid QR scans are counted for IT/Admin review.</div>
      <AuditSummary summary={summary} />
      <AuditFilters query={query} type={type} severity={severity} onQueryChange={setQuery} onTypeChange={setType} onSeverityChange={setSeverity} />
      <AuditLogList logs={logs} />
    </Card>
  );
}
