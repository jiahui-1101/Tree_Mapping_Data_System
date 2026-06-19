import { useState } from "react";
import Card from "../../components/common/Card.jsx";
import GardenMap from "../../components/map/GardenMap.jsx";
import { ROLE } from "../../models.js";
import { evaluateSpatialPoint } from "../../services/spatialPlanningService.js";
import SpatialSuitability from "./SpatialSuitability.jsx";
import SpatialConfigForm from "./SpatialConfigForm.jsx";
import SpatialHistory from "./SpatialHistory.jsx";

export default function SpatialPage({ trees, spatialPlanningRecords = [], onConfirmSpatialPlan, showToast }) {
  const initial = { x: 53, y: 43 };
  const [point, setPoint] = useState(initial);
  const [score, setScore] = useState(() => evaluateSpatialPoint(initial).score);
  const [species, setSpecies] = useState("Pterocarpus indicus");
  const [targetZone, setTargetZone] = useState("Arboretum");
  const { tone, reasoning } = evaluateSpatialPoint({ ...point, score });

  return (
    <div className="two-column spatial-layout">
      <Card title="AI Spatial Planning Simulation" subtitle="Click the map to move the proposed planting point">
        <GardenMap role={ROLE.ADMIN} trees={trees} proposedPoint={point} onMapClick={(next) => { setPoint(next); setScore(evaluateSpatialPoint(next).score); }} compact />
        <SpatialSuitability score={score} tone={tone} reasoning={reasoning} />
        <div className="button-row">
          <button className="button" onClick={() => onConfirmSpatialPlan?.({ point, species, targetZone, score, tone, reasoning })}>Confirm Placement</button>
          <button className="button button-outline" onClick={() => { setPoint(initial); setScore(78); }}>Reset</button>
        </div>
      </Card>
      <Card title="Configure New Tree" subtitle="AI resource and space predictor">
        <SpatialConfigForm species={species} targetZone={targetZone} onSpeciesChange={setSpecies} onTargetZoneChange={setTargetZone} onAnalyze={() => showToast("Suitability analysis mock completed.")} />
        <SpatialHistory records={spatialPlanningRecords} />
      </Card>
    </div>
  );
}
