import Card from "../../components/common/Card.jsx";
import {
  MAP_ZONES,
  TBJ_GOOGLE_MAPS_URL,
  TBJ_MAP_FACTS,
  TBJ_OFFICIAL_SOURCE_URL,
  countZoneRecords,
  getMapSourceSummary,
} from "../../data/gardenMap.js";

export default function ZoneInventorySummary({ trees }) {
  return (
    <div className="two-column map-stats">
      <Card title="Demo Inventory Records by Official Zone" subtitle="Counts below come from loaded prototype records, not official tree totals.">
        <div className="zone-record-list">
          {MAP_ZONES.map((zone) => <p key={zone.id}><span>{zone.name}</span><b>{countZoneRecords(trees, zone)}</b></p>)}
        </div>
      </Card>
      <Card title="Map Basis & Privacy">
        <p>{TBJ_MAP_FACTS.mapNote}</p>
        <p>{TBJ_MAP_FACTS.crossCheck} Google Maps center: {TBJ_MAP_FACTS.googleMapCenter}.</p>
        <p>{getMapSourceSummary()}</p>
        <p>Exact coordinates for protected rare species are hidden from visitor-safe public views. Admin and IT Support retain the operational view.</p>
        <div className="map-source-links">
          <a href={TBJ_OFFICIAL_SOURCE_URL} target="_blank" rel="noreferrer">Official JLN information ↗</a>
          <a href={TBJ_GOOGLE_MAPS_URL} target="_blank" rel="noreferrer">Open Google Maps ↗</a>
        </div>
      </Card>
    </div>
  );
}
