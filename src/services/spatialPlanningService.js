export function evaluateSpatialPoint(point) {
  const constrained = point.x > 76 || point.y < 15;
  const score = constrained ? 41 : 78;
  const tone = score >= 70 ? "High" : score >= 45 ? "Medium" : "Low";
  const reasoning = tone === "Low"
    ? "Move the marker farther from existing trees and facilities."
    : "No significant canopy conflict detected.";

  return { score, tone, reasoning };
}
