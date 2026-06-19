import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { filterServiceLogs, getServiceLogs } from "../../services/itSupportService.js";

export default function ServiceLogViewer({ service, logs, level, onLevelChange, onClose }) {
  const serviceLogs = getServiceLogs(service.id, logs);
  const visibleLogs = filterServiceLogs(serviceLogs, level);

  return (
    <Modal title={`${service.name} Logs`} onClose={onClose} wide>
      <div className="page-toolbar">
        <p className="muted">{service.dependency} · {serviceLogs.length} demo log entries</p>
        <select value={level} onChange={(event) => onLevelChange(event.target.value)}>
          <option value="all">All levels</option><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option>
        </select>
      </div>
      <div className="it-log-list">
        {visibleLogs.map((log, index) => (
          <article className={`it-log-item it-log-${log.level}`} key={`${log.serviceId}-${log.time}-${index}`}>
            <span><strong>{log.time}</strong><StatusPill status={log.level} /></span>
            <p>{log.message}</p>
            <small>{log.source}</small>
          </article>
        ))}
      </div>
    </Modal>
  );
}
