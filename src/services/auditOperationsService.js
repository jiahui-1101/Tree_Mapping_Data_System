export function summarizeAuditOperations(auditLogs = [], qrScanEvents = []) {
  return {
    highSeverity: auditLogs.filter((log) => log.severity === "high").length,
    failedLogins: auditLogs.filter((log) => log.event.toLowerCase().includes("failed")).length,
    systemErrors: auditLogs.filter((log) => log.type === "error").length,
    invalidQrScans: qrScanEvents.filter((event) => event.scanResult !== "success").length,
  };
}

export function searchAuditLogs(logs, query = "") {
  const needle = query.trim().toLowerCase();
  if (!needle) return logs;
  return logs.filter((log) => (
    `${log.time} ${log.type} ${log.actor} ${log.role} ${log.event} ${log.severity}`
      .toLowerCase()
      .includes(needle)
  ));
}
