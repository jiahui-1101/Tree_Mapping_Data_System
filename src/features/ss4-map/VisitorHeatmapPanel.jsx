import Card from "../../components/common/Card.jsx";

export default function VisitorHeatmapPanel({ aggregates, summary }) {
  return (
    <Card title="Visitor Activity Heatmap" subtitle="VisitorHeatmapAggregate records shown on the map layer">
      <div className="zone-record-list">
        <p><span>Total anonymous scans</span><b>{summary.totalVisitorScans}</b></p>
        <p><span>Highest traffic point</span><b>{summary.topTrafficPoint ? `${summary.topTrafficPoint.treeId} · ${summary.topTrafficPoint.trafficLevel}` : "No visitor aggregate"}</b></p>
        {aggregates.map((aggregate) => (
          <p key={aggregate.aggregateId}>
            <span>{aggregate.treeId} · {aggregate.zoneId}</span>
            <b>{aggregate.scanCount} scans · {aggregate.uniqueSessions} sessions</b>
          </p>
        ))}
      </div>
    </Card>
  );
}
