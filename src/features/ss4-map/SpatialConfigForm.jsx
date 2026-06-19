export default function SpatialConfigForm({ species, targetZone, onSpeciesChange, onTargetZoneChange, onAnalyze }) {
  return (
    <>
      <label className="field-label" htmlFor="spatial-species">Species</label>
      <select id="spatial-species" value={species} onChange={(event) => onSpeciesChange(event.target.value)}>
        <option value="Pterocarpus indicus">Angsana (Pterocarpus indicus)</option>
        <option value="Shorea parvifolia">Meranti Merah (Shorea parvifolia)</option>
        <option value="Samanea saman">Rain Tree (Samanea saman)</option>
      </select>
      <label className="field-label" htmlFor="spatial-zone">Target zone</label>
      <select id="spatial-zone" value={targetZone} onChange={(event) => onTargetZoneChange(event.target.value)}>
        <option>Arboretum</option>
        <option>Pemuliharaan</option>
        <option>Tanaman</option>
      </select>
      <button className="button button-block" onClick={onAnalyze}>Run AI Suitability Check</button>
    </>
  );
}
