import { useState } from "react";
import Card from "../../components/common/Card.jsx";
import GardenMap from "../../components/map/GardenMap.jsx";
import { ROLE } from "../../models.js";
import { evaluateSpatialPoint } from "../../services/spatialPlanningService.js";

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
        <div className={`suitability suitability-${tone.toLowerCase()}`}>
          <strong>AI Suitability: {score}% - {tone}</strong>
          <p>Canopy and root-radius overlay mock. {reasoning}</p>
          <small>Estimated planting cost: RM 450 · fertilizer: RM 80/month</small>
        </div>
        <div className="button-row">
          <button className="button" onClick={() => onConfirmSpatialPlan?.({ point, species, targetZone, score, tone, reasoning })}>Confirm Placement</button>
          <button className="button button-outline" onClick={() => { setPoint(initial); setScore(78); }}>Reset</button>
        </div>
      </Card>
      <Card title="Configure New Tree" subtitle="AI resource and space predictor">
        <label className="field-label">Species</label>
        <select value={species} onChange={(event) => setSpecies(event.target.value)}>
          <option value="Pterocarpus indicus">Angsana (Pterocarpus indicus)</option>
          <option value="Shorea parvifolia">Meranti Merah (Shorea parvifolia)</option>
          <option value="Samanea saman">Rain Tree (Samanea saman)</option>
        </select>
        <label className="field-label">Target zone</label>
        <select value={targetZone} onChange={(event) => setTargetZone(event.target.value)}>
          <option>Arboretum</option>
          <option>Pemuliharaan</option>
          <option>Tanaman</option>
        </select>
        <button className="button button-block" onClick={() => showToast("Suitability analysis mock completed.")}>Run AI Suitability Check</button>
        <h3>Recent simulations</h3>
        {spatialPlanningRecords.slice(0, 5).map((record) => (
          <div className="list-row" key={record.planId}>
            <span>
              <strong>{record.planId} - {record.species}</strong>
              <small>{record.targetZone} · {record.suitabilityScore}% {record.suitabilityLabel} suitability · x{record.proposedX}, y{record.proposedY}</small>
            </span>
            <b>{record.decision}</b>
          </div>
        ))}
      </Card>
    </div>
  );
}
