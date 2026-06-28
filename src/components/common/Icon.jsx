const ICONS = {
  badge: "🏅",
  calendar: "▦",
  chart: "▥",
  chat: "●",
  check: "✓",
  leaf: "♣",
  lock: "▣",
  map: "▧",
  people: "●●",
  route: "⌁",
  scan: "▣",
  spark: "✦",
  target: "◎",
  tree: "♠",
};

export default function Icon({ name, className = "" }) {
  return <span className={`icon ${className}`}>{ICONS[name] || name}</span>;
}
