import { useEffect, useState } from "react";
import Card from "../../components/common/Card.jsx";
import GardenMap from "../../components/map/GardenMap.jsx";
import { ROLE } from "../../models.js";
import { confirmSs4SpatialPlanBackend, fetchSs4SpatialPlansBackend, simulateSs4SpatialPlanBackend } from "../../services/ss4ApiService.js";

export default function SpatialPage({ user, trees, spatialPlanningRecords = [], onConfirmSpatialPlan, showToast }) {
  const initial = { x: 53, y: 43 };
  const [point, setPoint] = useState(initial);
  const [score, setScore] = useState(78);
  const [species, setSpecies] = useState("Pterocarpus indicus");
  const [targetZone, setTargetZone] = useState("Arboretum");
  const [backendRecords, setBackendRecords] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const tone = score >= 70 ? "High" : score >= 45 ? "Medium" : "Low";
  const reasoning = analysis?.aiReasoning || (tone === "Low" ? "Move the marker farther from existing trees and facilities." : "No significant canopy conflict detected.");
  const records = backendRecords || spatialPlanningRecords;

  useEffect(() => {
    let mounted = true;
    fetchSs4SpatialPlansBackend().then((payload) => {
      if (mounted && payload?.ok) setBackendRecords(payload.data || []);
    });
    return () => { mounted = false; };
  }, []);

  const runAnalysis = async (nextPoint = point) => {
    setLoading(true);
    const payload = await simulateSs4SpatialPlanBackend({
      point: nextPoint,
      species,
      targetZone,
      createdBy: user?.id || "admin001",
    });
    setLoading(false);
    if (payload?.ok) {
      setAnalysis(payload);
      setScore(payload.suitabilityScore);
      showToast?.("SS4 spatial backend returned suitability analysis.");
      return payload;
    }
    const fallbackScore = nextPoint.x > 76 || nextPoint.y < 15 ? 41 : 78;
    setScore(fallbackScore);
    setAnalysis(null);
    showToast?.("Spatial analysis refreshed in local fallback mode.");
    return null;
  };

  const confirmPlacement = async () => {
    const payload = await confirmSs4SpatialPlanBackend({
      point,
      species,
      targetZone,
      createdBy: user?.id || "admin001",
    });
    if (payload?.record) {
      setBackendRecords((current) => [payload.record, ...(current || records)]);
      showToast?.(`${payload.record.planId} saved through SS4 backend.`);
      return;
    }
    onConfirmSpatialPlan?.({ point, species, targetZone, score, tone, reasoning });
  };

  return (
    <div className="two-column spatial-layout">
      <Card title="AI Spatial Planning Simulation" subtitle="Click the map to move the proposed planting point">
        <GardenMap role={ROLE.ADMIN} trees={trees} proposedPoint={point} onMapClick={(next) => { setPoint(next); void runAnalysis(next); }} compact />
        <div className={`suitability suitability-${tone.toLowerCase()}`}>
          <strong>AI Suitability: {score}% - {tone}</strong>
          <p>Canopy and root-radius overlay. {reasoning}</p>
          <small>Estimated planting cost: RM {analysis?.estCostRm || 450} · canopy radius {analysis?.canopyRadiusM || 7}m · root radius {analysis?.rootRadiusM || 5}m</small>
        </div>
        <div className="button-row">
          <button className="button" onClick={confirmPlacement}>Confirm Placement</button>
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
        <button className="button button-block" disabled={loading} onClick={() => runAnalysis()}>{loading ? "Analyzing..." : "Run AI Suitability Check"}</button>
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
      </Card>
    </div>
  );
}

