import { MAP_LAYERS } from "../../config/mapLayers.js";

export default function MapLayerSelector({ activeLayer, onChange }) {
  return (
    <div className="layer-buttons" role="group" aria-label="Map layer">
      {MAP_LAYERS.map((item) => (
        <button
          key={item.id}
          className={activeLayer === item.id ? "active" : ""}
          aria-pressed={activeLayer === item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
