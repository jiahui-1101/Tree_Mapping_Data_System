export default function AuditSummary({ summary }) {
  return (
    <div className="it-audit-summary">
      <article><strong>{summary.highSeverity}</strong><span>High severity</span></article>
      <article><strong>{summary.failedLogins}</strong><span>Failed logins</span></article>
      <article><strong>{summary.systemErrors}</strong><span>System errors</span></article>
      <article><strong>{summary.invalidQrScans}</strong><span>Invalid QR scans</span></article>
    </div>
  );
}
