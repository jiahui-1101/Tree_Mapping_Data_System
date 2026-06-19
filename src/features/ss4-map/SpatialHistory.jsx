export default function SpatialHistory({ records }) {
  if (!records.length) {
    return <p className="muted">No spatial simulations recorded yet.</p>;
  }

  return (
    <>
      <h3>Recent simulations</h3>
      {records.slice(0, 5).map((record) => (
        <div className="list-row" key={record.planId}>
          <span>
            <strong>{record.planId} - {record.species}</strong>
            <small>{record.targetZone} · {record.suitabilityScore}% {record.suitabilityLabel} suitability · x{record.proposedX}, y{record.proposedY}</small>
          </span>
          <b>{record.decision}</b>
        </div>
      ))}
    </>
  );
}
