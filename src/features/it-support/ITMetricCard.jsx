export default function ITMetricCard({ label, value, detail, tone = "default" }) {
  return (
    <article className={`metric-card ${tone === "default" ? "" : `metric-${tone}`}`}>
      <b>{label}</b>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
