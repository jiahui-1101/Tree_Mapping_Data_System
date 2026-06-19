import { useState } from "react";
import Card from "../../components/common/Card.jsx";
import GardenMap from "../../components/map/GardenMap.jsx";
import { MAP_ZONES, TBJ_MAP_FACTS, TBJ_STAKEHOLDER_PLOTS } from "../../data/gardenMap.js";
import { DEFAULT_MAP_LAYER } from "../../config/mapLayers.js";
import MapLayerSelector from "./MapLayerSelector.jsx";
import MapOperationsSummary from "./MapOperationsSummary.jsx";
import { summarizeMapOperations } from "../../services/mapOperationsService.js";
import VisitorHeatmapPanel from "./VisitorHeatmapPanel.jsx";
import ZoneInventorySummary from "./ZoneInventorySummary.jsx";
import StakeholderDetailsPanel from "./StakeholderDetailsPanel.jsx";
import TreeMapDetailsModal from "./TreeMapDetailsModal.jsx";

export default function MapPage({ role, trees, qrCodes = [], qrScanEvents = [], visitorHeatmapAggregates = [], onOpenScanner }) {
  const [layer, setLayer] = useState(DEFAULT_MAP_LAYER);
  const [selected, setSelected] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);
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
      <StakeholderDetailsPanel selectedPlot={selectedPlot} selectedZone={selectedZone} />
      <div className="two-column map-stats"><Card title="Layer Legend"><p><span className="legend-dot green" /> Healthy tree</p><p><span className="legend-dot amber" /> Monitor tree</p><p><span className="legend-dot red" /> Critical tree</p><p><span className="legend-dot blue" /> Aggregated visitor activity</p></Card><Card title="Official Arboretum Collections"><p>Plot Aroma · Plot Buluh · Plot Palma · Plot Nama Tempat · Plot Ethnobotani · Plot Herba dan Perubatan</p></Card></div>
      <TreeMapDetailsModal tree={selected} onClose={() => setSelected(null)} onOpenScanner={onOpenScanner} />
    </>
  );
}
