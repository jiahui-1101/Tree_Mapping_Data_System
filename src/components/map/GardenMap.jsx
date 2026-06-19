import { lazy, Suspense, useMemo, useState } from "react";
import { MAP_LANDMARKS, MAP_ZONES, TBJ_STAKEHOLDER_PLOTS, countZoneRecords, formatPlotQuantity } from "../../data/gardenMap.js";
import { ROLE } from "../../models.js";
import { maskTreeForRole } from "../../services/mockTreeService.js";
import { visitorText } from "../../services/visitorI18n.js";

const ThreeGardenScene = lazy(() => import("./ThreeGardenScene.jsx"));

function clampLabelPosition(position) {
  if (!position) return undefined;
  return {
    left: `clamp(8%, ${position.left}, 92%)`,
    top: `clamp(10%, ${position.top}, 92%)`,
  };
}

export default function GardenMap({
  role,
  trees,
  layer = "health",
  visitorHeatmapAggregates = [],
  route = [],
  routePath = [],
  selectedZoneId,
  onTreeClick,
  onZoneClick,
  onPlotClick,
  proposedPoint,
  onMapClick,
  compact = false,
  language,
}) {
  const [positions, setPositions] = useState({ trees: {}, zones: {}, landmarks: {}, plots: {}, route: {}, heatmap: {} });
  const [viewMode, setViewMode] = useState("perspective");
  const [controlAction, setControlAction] = useState(null);
  const showMarkers = layer !== "visitors";
  const canSeeProtected = role === ROLE.ADMIN || role === ROLE.IT_SUPPORT;
  const visitorView = role === ROLE.VISITOR;
  const visibleTrees = useMemo(() => showMarkers ? trees
    .map((tree) => maskTreeForRole(tree, role))
    .filter((tree) => tree.x !== null || canSeeProtected)
    .filter((tree) => !visitorView || route.some((step) => step.id === tree.id)) : [], [canSeeProtected, role, route, showMarkers, trees, visitorView]);
  const markerLabel = (tree) => visitorView
    ? String(route.findIndex((step) => step.id === tree.id) + 1)
    : tree.id.replace("TBJ-", "");

  return (
    <div className={`garden-map garden-map-3d ${compact ? "garden-map-compact" : ""} layer-${layer}`}>
      <Suspense fallback={<p className="three-map-fallback">Loading 3D garden map...</p>}>
        <ThreeGardenScene
          compact={compact}
          controlAction={controlAction}
          layer={layer}
          onMapClick={onMapClick}
          onZoneClick={onZoneClick}
          onProjectedPositions={setPositions}
          proposedPoint={proposedPoint}
          role={role}
          routePath={routePath}
          selectedZoneId={selectedZoneId}
          trees={trees}
          visitorHeatmapAggregates={visitorHeatmapAggregates}
          viewMode={viewMode}
        />
      </Suspense>

      <div className="map-source-ribbon">
        <b>TBJ 3D concept map</b>
        <small>Official JLN zones · stakeholder inventory docs</small>
      </div>

      {!compact && MAP_ZONES.map((zone) => (
        <span
          className="map-zone-tag"
          key={zone.id}
          style={clampLabelPosition(positions.zones[zone.id])}
        >
          <b>{zone.shortName}</b>
          <small>{visitorView ? visitorText(language, "map.tapZone") : `${countZoneRecords(trees, zone)} demo records`}</small>
        </span>
      ))}

      {!compact && MAP_LANDMARKS.map((landmark) => (
        <span
          className={`map-landmark-tag map-landmark-${landmark.type}`}
          key={landmark.id}
          style={positions.landmarks[landmark.id]}
        >
          {landmark.name}
        </span>
      ))}

      {!compact && (layer === "stakeholder" || layer === "collections") && TBJ_STAKEHOLDER_PLOTS.map((plot) => (
        <button
          className={`map-plot-tag map-plot-${layer}`}
          key={plot.id}
          onClick={() => onPlotClick?.(plot)}
          style={clampLabelPosition(positions.plots[plot.id])}
          title={`${plot.name} - ${plot.source}`}
        >
          <b>{plot.name}</b>
          <small>{layer === "collections" ? formatPlotQuantity(plot.id).split(" · ")[0] : plot.officialZone}</small>
        </button>
      ))}

      {!compact && layer === "visitors" && visitorHeatmapAggregates.map((aggregate) => (
        <span
          className={`visitor-heatmap-tag visitor-heatmap-${aggregate.trafficLevel}`}
          key={aggregate.aggregateId}
          style={clampLabelPosition(positions.heatmap[aggregate.aggregateId])}
        >
          <b>{aggregate.scanCount}</b>
          <small>{aggregate.treeId}</small>
        </span>
      ))}

      {visibleTrees.map((tree) => {
        const inRoute = route.some((step) => step.id === tree.id);
        return (
          <button
            key={tree.id}
            className={`tree-pin tree-pin-${visitorView ? "public" : tree.status} ${inRoute ? "route-pin" : ""}`}
            style={positions.trees[tree.id]}
            onClick={() => onTreeClick?.(tree)}
            title={`${tree.name} - ${tree.id}`}
          >
            <span>{markerLabel(tree)}</span>
          </button>
        );
      })}

      {visitorView && routePath.filter((point) => point.type === "tree").map((point) => {
        const tree = route.find((step) => step.id === point.id);
        if (!tree || !positions.route[point.id]) return null;
        return (
          <button
            className="route-waypoint-button"
            key={point.id}
            onClick={() => onTreeClick?.(tree)}
            style={positions.route[point.id]}
            title={point.label}
          >
            {point.order}
          </button>
        );
      })}

      {!canSeeProtected && trees.some((tree) => tree.rare) && (
        <div className="protected-marker">{visitorView ? visitorText(language, "map.protected") : "Protected tree location hidden"}</div>
      )}

      <div className="map-view-controls">
        <button onClick={() => setControlAction({ type: "zoom-in", id: Date.now() })}>+</button>
        <button onClick={() => setControlAction({ type: "zoom-out", id: Date.now() })}>-</button>
        <button onClick={() => setControlAction({ type: "reset", id: Date.now() })}>Reset</button>
        <button className={viewMode === "perspective" ? "active" : ""} onClick={() => setViewMode("perspective")}>3D</button>
        <button className={viewMode === "top" ? "active" : ""} onClick={() => setViewMode("top")}>Top</button>
      </div>
      <div className="map-compass">N<br />▲</div>
    </div>
  );
}

