import Card from "../../components/common/Card.jsx";
import {
  TBJ_OFFICIAL_CONTEXT,
  TBJ_STAKEHOLDER_PLOTS,
  formatPlotQuantity,
  getStakeholderPlotsByZone,
  getStakeholderSourceGroup,
} from "../../data/gardenMap.js";

export default function StakeholderDetailsPanel({ selectedPlot, selectedZone }) {
  const zonePlots = selectedZone ? getStakeholderPlotsByZone(selectedZone.id) : [];
  const inventory = selectedPlot?.inventory;
  const sourceGroup = inventory?.groupId ? getStakeholderSourceGroup(inventory.groupId) : null;

  return (
    <div className="two-column map-stats">
      <Card title={selectedPlot ? selectedPlot.name : selectedZone ? selectedZone.name : "Stakeholder Plot Layer"} subtitle={selectedPlot ? selectedPlot.source : selectedZone ? "Official zone selected on the 3D map" : TBJ_OFFICIAL_CONTEXT.description}>
        {selectedPlot ? (
          <>
            <p><strong>Official zone:</strong> {selectedPlot.officialZone}</p>
            <p><strong>Collection count:</strong> {formatPlotQuantity(selectedPlot.id)}</p>
            {sourceGroup && <p><strong>Source group:</strong> {sourceGroup.name} · {sourceGroup.total} records</p>}
            {inventory?.zoneBreakdown && <p><strong>Breakdown:</strong> {Object.entries(inventory.zoneBreakdown).map(([key, value]) => `${key} ${value}`).join(" · ")}</p>}
            <p><strong>Representative species:</strong> {selectedPlot.examples.join(" · ")}</p>
            <p><strong>Quantity note:</strong> Stakeholder inventory records from DOCX tables, not surveyed GIS coordinates.</p>
          </>
        ) : selectedZone ? (
          <>
            <p><strong>Related stakeholder plots:</strong></p>
            <div className="zone-record-list">{zonePlots.length ? zonePlots.map((plot) => <p key={plot.id}><span>{plot.name}</span><b>{formatPlotQuantity(plot.id)}</b></p>) : <p><span>No stakeholder plot linked yet</span><b>Conceptual zone only</b></p>}</div>
          </>
        ) : (
          <div className="zone-record-list">{TBJ_STAKEHOLDER_PLOTS.slice(0, 5).map((plot) => <p key={plot.id}><span>{plot.name}</span><b>{formatPlotQuantity(plot.id)}</b></p>)}</div>
        )}
      </Card>
      <Card title="Official JLN Context" subtitle={TBJ_OFFICIAL_CONTEXT.sourceLabel}>
        <p>{TBJ_OFFICIAL_CONTEXT.description}</p>
        <p><strong>Official zones:</strong> {TBJ_OFFICIAL_CONTEXT.zones.join(" · ")}</p>
      </Card>
    </div>
  );
}
