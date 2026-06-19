import Card from "../../components/common/Card.jsx";

const LEGEND_ITEMS = [
  { color: "green", label: "Healthy tree" },
  { color: "amber", label: "Monitor tree" },
  { color: "red", label: "Critical tree" },
  { color: "blue", label: "Aggregated visitor activity" },
];

export default function MapLegend() {
  return (
    <div className="two-column map-stats">
      <Card title="Layer Legend">
        <ul className="map-legend-list" aria-label="Map marker legend">
          {LEGEND_ITEMS.map((item) => (
            <li key={item.color}><span className={`legend-dot ${item.color}`} aria-hidden="true" />{item.label}</li>
          ))}
        </ul>
      </Card>
      <Card title="Official Arboretum Collections">
        <p>Plot Aroma · Plot Buluh · Plot Palma · Plot Nama Tempat · Plot Ethnobotani · Plot Herba dan Perubatan</p>
      </Card>
    </div>
  );
}
