const MAP_COPY = {
  "map.tapZone": "Tap a zone to explore",
  "map.protected": "Protected tree location hidden",
};

export function visitorText(_language, key) {
  return MAP_COPY[key] || key;
}

