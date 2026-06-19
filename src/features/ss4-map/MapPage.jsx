import { useState } from "react";
import Card from "../../components/common/Card.jsx";
import GardenMap from "../../components/map/GardenMap.jsx";
import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { MAP_ZONES, TBJ_MAP_FACTS, TBJ_OFFICIAL_CONTEXT, TBJ_STAKEHOLDER_PLOTS, formatPlotQuantity, getStakeholderPlotsByZone, getStakeholderSourceGroup } from "../../data/gardenMap.js";
import { DEFAULT_MAP_LAYER } from "../../config/mapLayers.js";
import MapLayerSelector from "./MapLayerSelector.jsx";
import MapOperationsSummary from "./MapOperationsSummary.jsx";
import { summarizeMapOperations } from "../../services/mapOperationsService.js";
import VisitorHeatmapPanel from "./VisitorHeatmapPanel.jsx";
import ZoneInventorySummary from "./ZoneInventorySummary.jsx";

export default function MapPage({ role, trees, qrCodes = [], qrScanEvents = [], visitorHeatmapAggregates = [], onOpenScanner }) {
  const [layer, setLayer] = useState(DEFAULT_MAP_LAYER);
  const [selected, setSelected] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const activeZonePlots = selectedZone ? getStakeholderPlotsByZone(selectedZone.id) : [];
  const selectedInventory = selectedPlot?.inventory;
  const selectedGroup = selectedInventory?.groupId ? getStakeholderSourceGroup(selectedInventory.groupId) : null;
  const operationsSummary = summarizeMapOperations({ qrCodes, qrScanEvents, visitorHeatmapAggregates });
  return (
    <>
      <Card title="Taman Botani Johor 3D Map" subtitle="Official JLN zones combined with stakeholder plant inventory docs" actions={<MapLayerSelector activeLayer={layer} onChange={setLayer} />}>
        <GardenMap
          role={role}
          trees={trees}
          layer={layer}
          visitorHeatmapAggregates={visitorHeatmapAggregates}
          onTreeClick={setSelected}
          onZoneClick={(zone) => { setSelectedZone(zone); setSelectedPlot(null); }}
          onPlotClick={(plot) => { setSelectedPlot(plot); setSelectedZone(null); }}
        />
      </Card>
      <MapOperationsSummary
        areaAcres={TBJ_MAP_FACTS.areaAcres}
        zoneCount={MAP_ZONES.length}
        stakeholderPlotCount={TBJ_STAKEHOLDER_PLOTS.length}
        summary={operationsSummary}
      />
      {layer === "visitors" && (
        <VisitorHeatmapPanel aggregates={visitorHeatmapAggregates} summary={operationsSummary} />
      )}
      <ZoneInventorySummary trees={trees} />
      <div className="two-column map-stats">
        <Card title={selectedPlot ? selectedPlot.name : selectedZone ? selectedZone.name : "Stakeholder Plot Layer"} subtitle={selectedPlot ? selectedPlot.source : selectedZone ? "Official zone selected on the 3D map" : TBJ_OFFICIAL_CONTEXT.description}>
          {selectedPlot ? (
            <>
              <p><strong>Official zone:</strong> {selectedPlot.officialZone}</p>
              <p><strong>Collection count:</strong> {formatPlotQuantity(selectedPlot.id)}</p>
              {selectedGroup && <p><strong>Source group:</strong> {selectedGroup.name} · {selectedGroup.total} records</p>}
              {selectedInventory?.zoneBreakdown && <p><strong>Breakdown:</strong> {Object.entries(selectedInventory.zoneBreakdown).map(([key, value]) => `${key} ${value}`).join(" · ")}</p>}
              <p><strong>Representative species:</strong> {selectedPlot.examples.join(" · ")}</p>
              <p><strong>Quantity note:</strong> Stakeholder inventory records from DOCX tables, not surveyed GIS coordinates.</p>
            </>
          ) : selectedZone ? (
            <>
              <p><strong>Related stakeholder plots:</strong></p>
              <div className="zone-record-list">{activeZonePlots.length ? activeZonePlots.map((plot) => <p key={plot.id}><span>{plot.name}</span><b>{formatPlotQuantity(plot.id)}</b></p>) : <p><span>No stakeholder plot linked yet</span><b>Conceptual zone only</b></p>}</div>
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
      <div className="two-column map-stats"><Card title="Layer Legend"><p><span className="legend-dot green" /> Healthy tree</p><p><span className="legend-dot amber" /> Monitor tree</p><p><span className="legend-dot red" /> Critical tree</p><p><span className="legend-dot blue" /> Aggregated visitor activity</p></Card><Card title="Official Arboretum Collections"><p>Plot Aroma · Plot Buluh · Plot Palma · Plot Nama Tempat · Plot Ethnobotani · Plot Herba dan Perubatan</p></Card></div>
      {selected && <Modal title={`${selected.name} - ${selected.id}`} onClose={() => setSelected(null)}>
        <StatusPill status={selected.status} /><p>{selected.description}</p><p>Zon {selected.zone} · Health {selected.health}%</p>{selected.coordinateLabel && <p className="inline-warning">{selected.coordinateLabel}</p>}<button className="button button-block" onClick={onOpenScanner}>Open QR Interaction</button>
      </Modal>}
    </>
  );
}
