export default function SpatialSuitability({ score, tone, reasoning }) {
  return (
    <div className={`suitability suitability-${tone.toLowerCase()}`} aria-live="polite">
      <strong>AI Suitability: {score}% - {tone}</strong>
      <p>Canopy and root-radius overlay mock. {reasoning}</p>
      <small>Estimated planting cost: RM 450 · fertilizer: RM 80/month</small>
    </div>
  );
}
