import StatusPill from "../../components/common/StatusPill.jsx";

export default function ServiceHealthCard({ service }) {
  return (
    <article className={`it-service-card it-service-${service.status}`}>
      <span>
        <strong>{service.name}</strong>
        <StatusPill status={service.status} />
      </span>
      <p>{service.dependency}</p>
      <small>{service.latency} latency · {service.lastChecked}</small>
    </article>
  );
}
