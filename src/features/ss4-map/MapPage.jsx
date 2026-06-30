import { useEffect, useState } from "react";
import Card from "../../components/common/Card.jsx";
import GardenMap from "../../components/map/GardenMap.jsx";
import Modal from "../../components/common/Modal.jsx";
import StatusPill from "../../components/common/StatusPill.jsx";
import { MAP_ZONES, TBJ_GOOGLE_MAPS_URL, TBJ_MAP_FACTS, TBJ_OFFICIAL_CONTEXT, TBJ_OFFICIAL_SOURCE_URL, TBJ_STAKEHOLDER_PLOTS, countZoneRecords, formatPlotQuantity, getMapSourceSummary, getStakeholderPlotsByZone, getStakeholderSourceGroup } from "../../data/gardenMap.js";
import { fetchSs4MapBackend } from "../../services/ss4ApiService.js";

const MAP_LAYERS = [
  { id: "health", label: "health" },
  { id: "tasks", label: "tasks" },
  { id: "stakeholder", label: "stakeholder plots" },
  { id: "collections", label: "plant collections" },
  { id: "visitors", label: "visitor activity" },
];

export default function MapPage({ role, trees, qrCodes = [], qrScanEvents = [], visitorHeatmapAggregates = [], onOpenScanner }) {
  const [layer, setLayer] = useState("health");
  const [selected, setSelected] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [backendMap, setBackendMap] = useState(null);
  useEffect(() => {
    let mounted = true;
    fetchSs4MapBackend({ role }).then((payload) => {
      if (mounted && payload?.ok) setBackendMap(payload);
    });
    return () => { mounted = false; };
  }, [role]);
  const availableLayers = backendMap?.layerConfig?.length
    ? backendMap.layerConfig.map((item) => ({ id: item.layerId, label: item.layerLabel.toLowerCase() }))
    : MAP_LAYERS;
  const renderedTrees = backendMap?.trees || trees;
  const renderedQrCodes = backendMap?.qrCodes || qrCodes;
  const renderedQrScanEvents = backendMap?.qrScanEvents || qrScanEvents;
  const renderedHeatmap = backendMap?.visitorHeatmapAggregates || visitorHeatmapAggregates;
  const activeZonePlots = selectedZone ? getStakeholderPlotsByZone(selectedZone.id) : [];
  const selectedInventory = selectedPlot?.inventory;
  const selectedGroup = selectedInventory?.groupId ? getStakeholderSourceGroup(selectedInventory.groupId) : null;
  const activeQr = renderedQrCodes.filter((qr) => qr.qrStatus === "active").length;
  const invalidatedQr = renderedQrCodes.filter((qr) => qr.qrStatus === "invalidated").length;
  const successfulScans = renderedQrScanEvents.filter((event) => event.scanResult === "success").length;
  const totalVisitorScans = renderedHeatmap.reduce((total, aggregate) => total + aggregate.scanCount, 0);
  const topTrafficPoint = renderedHeatmap.slice().sort((a, b) => b.scanCount - a.scanCount)[0];
  return (
    <>
      <Card title="Taman Botani Johor 3D Map" subtitle={`Official JLN zones combined with stakeholder plant inventory docs · ${backendMap ? "SS4 backend API" : "local fallback"}`} actions={<div className="layer-buttons">{availableLayers.map((item) => <button key={item.id} className={layer === item.id ? "active" : ""} onClick={() => setLayer(item.id)}>{item.label}</button>)}</div>}>
        <GardenMap
          role={role}
          trees={renderedTrees}
          layer={layer}
          visitorHeatmapAggregates={renderedHeatmap}
          onTreeClick={setSelected}
          onZoneClick={(zone) => { setSelectedZone(zone); setSelectedPlot(null); }}
          onPlotClick={(plot) => { setSelectedPlot(plot); setSelectedZone(null); }}
        />
      </Card>
      <div className="map-fact-grid">
        <article><strong>{TBJ_MAP_FACTS.areaAcres}</strong><span>total acres</span><small>Official JLN area including active nursery lots</small></article>
        <article><strong>6</strong><span>official main zones</span><small>Mapped as conceptual 3D operational areas</small></article>
        <article><strong>{TBJ_STAKEHOLDER_PLOTS.length}</strong><span>stakeholder plots</span><small>Added from plant inventory documents</small></article>
      </div>
      <div className="map-fact-grid">
        <article><strong>{activeQr}</strong><span>active QR labels</span><small>QRCodes.qr_status = active</small></article>
        <article><strong>{invalidatedQr}</strong><span>invalidated QR</span><small>Archived tree labels blocked at scan time</small></article>
        <article><strong>{successfulScans}</strong><span>scan ledger events</span><small>QRScanEvents routed by detected role</small></article>
      </div>
      {layer === "visitors" && (
        <Card title="Visitor Activity Heatmap" subtitle="VisitorHeatmapAggregate records shown on the map layer">
          <div className="zone-record-list">
            <p><span>Total anonymous scans</span><b>{totalVisitorScans}</b></p>
            <p><span>Highest traffic point</span><b>{topTrafficPoint ? `${topTrafficPoint.treeId} · ${topTrafficPoint.trafficLevel}` : "No visitor aggregate"}</b></p>
            {renderedHeatmap.map((aggregate) => (
              <p key={aggregate.aggregateId}>
                <span>{aggregate.treeId} · {aggregate.zoneId}</span>
                <b>{aggregate.scanCount} scans · {aggregate.uniqueSessions} sessions</b>
              </p>
            ))}
          </div>
        </Card>
      )}
      <div className="two-column map-stats">
        <Card title="Demo Inventory Records by Official Zone" subtitle="Counts below come from loaded prototype records, not official tree totals.">
          <div className="zone-record-list">{MAP_ZONES.map((zone) => <p key={zone.id}><span>{zone.name}</span><b>{countZoneRecords(renderedTrees, zone)}</b></p>)}</div>
        </Card>
        <Card title="Map Basis & Privacy">
          <p>{TBJ_MAP_FACTS.mapNote}</p>
          <p>{TBJ_MAP_FACTS.markerNote}</p>
          <p>{TBJ_MAP_FACTS.crossCheck} Google Maps center: {TBJ_MAP_FACTS.googleMapCenter}.</p>
          <p>{getMapSourceSummary()}</p>
          <p>Exact coordinates for protected rare species are hidden from visitor-safe public views. Admin and IT Support retain the operational view.</p>
          <div className="map-source-links">
            <a href={TBJ_OFFICIAL_SOURCE_URL} target="_blank" rel="noreferrer">Official JLN information ↗</a>
            <a href={TBJ_GOOGLE_MAPS_URL} target="_blank" rel="noreferrer">Open Google Maps ↗</a>
          </div>
        </Card>
      </div>
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

