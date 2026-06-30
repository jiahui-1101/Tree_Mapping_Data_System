export const TBJ_OFFICIAL_SOURCE_URL = "https://www.jln.gov.my/index.php/pages/view/504";
export const TBJ_GOOGLE_MAPS_URL = "https://www.google.com/maps/place/taman+botani+johor+batu+pahat/data=!4m2!3m1!1s0x31d04f095e7739ad:0x2db8371ec9f0cc60";

export const TBJ_MAP_FACTS = {
  areaAcres: 245.04,
  originalGardenAcres: 194.09,
  nurseryAcres: 50.95,
  location: "East of Pekan Sri Medan, along Jalan Utama Yong Peng - Sri Medan",
  googleMapCenter: "1.9794013, 102.9604839",
  crossCheck: "Lake, entrance, and zone orientation cross-checked against the public Google Maps view and the supplied TBJ zoning image.",
  mapNote: "Conceptual 3D interpretation based on public official zone information, Google Maps location context, and the supplied map reference. It is not a surveyed GIS boundary.",
  markerNote: "Tree markers are rendered from the prototype Trees.coord_x/coord_y records; cyan/green dots on the reference map are represented as clickable tree pins.",
};

export const TBJ_OFFICIAL_CONTEXT = {
  sourceLabel: "Official JLN Taman Botani Johor page",
  sourceUrl: TBJ_OFFICIAL_SOURCE_URL,
  description: "Official JLN context confirms the 245.04 acre total area, the Jalan Utama Yong Peng - Sri Medan boundary, and the six main garden zones used by this conceptual map.",
  zones: ["Pentadbiran", "Arboretum", "Pemuliharaan/Hutan Sekunder", "Tapak Semaian", "Riparian/Habitat", "Tanaman Buah-buahan"],
};

export const MAP_ZONES = [
  {
    id: "pentadbiran",
    name: "Pentadbiran",
    shortName: "Pentadbiran",
    inventoryZone: null,
    color: 0xb88b62,
    label: [-33, -1],
    polygon: [[-43, -12], [-25, -12], [-20, 4], [-43, 9]],
  },
  {
    id: "arboretum",
    name: "Arboretum",
    shortName: "Arboretum",
    inventoryZone: "Arboretum",
    color: 0x73ae68,
    label: [-23, -23],
    polygon: [[-43, -34], [-5, -34], [-4, -22], [-15, -10], [-43, -13]],
  },
  {
    id: "pemuliharaan",
    name: "Pemuliharaan / Hutan Sekunder",
    shortName: "Hutan Sekunder",
    inventoryZone: "Pemuliharaan",
    color: 0x4d8956,
    label: [24, -19],
    polygon: [[-2, -34], [43, -34], [43, -4], [20, 2], [-4, -12]],
  },
  {
    id: "tapak-semaian",
    name: "Tapak Semaian",
    shortName: "Tapak Semaian",
    inventoryZone: "Tapak Semaian",
    color: 0x91bd68,
    label: [32, 23],
    polygon: [[28, 3], [43, -2], [43, 35], [20, 35], [16, 24]],
  },
  {
    id: "riparian",
    name: "Riparian / Habitat",
    shortName: "Riparian",
    inventoryZone: "Riparian",
    color: 0x6fac81,
    label: [8, 28],
    polygon: [[0, 2], [28, 3], [16, 24], [-10, 25], [-17, 11]],
  },
  {
    id: "tanaman-buah",
    name: "Tanaman Buah-buahan",
    shortName: "Buah-buahan",
    inventoryZone: "Tanaman",
    color: 0xb7b660,
    label: [-27, 24],
    polygon: [[-43, 10], [-20, 6], [-12, 12], [-10, 27], [-25, 35], [-43, 35]],
  },
];

export const MAP_LANDMARKS = [
  { id: "jalan-seri-medan", name: "Jln Seri Medan", type: "road", x: -44, z: -24 },
  { id: "main-marker", name: "Main", type: "entrance", x: -42, z: -2 },
  { id: "entrance", name: "Pintu Masuk", type: "entrance", x: -41, z: 0 },
  { id: "admin", name: "Pentadbiran", type: "building", x: -35, z: -4 },
  { id: "herbarium", name: "Herbarium", type: "building", x: -28, z: -6 },
  { id: "cafe", name: "Garden Cafe", type: "building", x: -34, z: 5 },
  { id: "bukit-besi", name: "Tasik Bukit Besi", type: "lake", x: 8, z: -10 },
  { id: "bukit-belah", name: "Tasik Bukit Belah", type: "lake", x: 8, z: 17 },
  { id: "jetty", name: "Jeti & Boardwalk", type: "jetty", x: -1, z: -5 },
  { id: "nursery-house", name: "Tapak Semaian", type: "building", x: 34, z: 23 },
  { id: "fruit-plot", name: "Zon Tanaman", type: "plot", x: -30, z: 29 },
];

export const ARBORETUM_PLOTS = [
  "Plot Aroma",
  "Plot Buluh",
  "Plot Palma",
  "Plot Nama Tempat",
  "Plot Ethnobotani",
  "Plot Herba dan Perubatan",
];

export const TBJ_COLLECTION_SUMMARIES = [
  {
    plotId: "jalan-tasik-utama",
    total: 249,
    speciesRows: 36,
    groupId: "jalan-rumah-tasik",
    label: "249 stakeholder inventory records in Jalan Tasik Utama; source group total 339.",
    examples: ["Samanea saman", "Mesua ferrea", "Hopea odorata", "Mimusops elengi"],
    zoneBreakdown: { "Zon A": 152, "Zon B": 66, "Zon C": 3, "Zon D": 123 },
  },
  {
    plotId: "rumah-tamu",
    total: 24,
    speciesRows: 8,
    groupId: "jalan-rumah-tasik",
    label: "24 stakeholder inventory records in Rumah Tamu; part of 339-record source group.",
    examples: ["Mangifera indica", "Nephelium mutabile", "Averrhoa carambola"],
  },
  {
    plotId: "tasik-bukit-belah",
    total: 19,
    speciesRows: 4,
    groupId: "jalan-rumah-tasik",
    label: "19 stakeholder inventory records in Tasik Bukit Belah; part of 339-record source group.",
    examples: ["Pometia pinnata", "Barringtonia racemosa", "Cocos nucifera"],
  },
  {
    plotId: "plot-buah-buahan",
    total: 154,
    speciesRows: 25,
    label: "154 records in Plot Buah-buahan inventory",
    examples: ["Mangifera indica", "Nephelium lappaceum", "Artocarpus heterophyllus"],
    zoneBreakdown: { "Blok A": 43, "Blok B": 29, "Blok C": 26, "Blok D": 56 },
  },
  {
    plotId: "arid",
    total: 168,
    speciesRows: 9,
    label: "168 records in Plot Arid collection inventory",
    examples: ["Bottlebrush", "Golden penda", "Fukugi"],
  },
  {
    plotId: "riparian",
    total: 97,
    speciesRows: 14,
    label: "97 stakeholder inventory records in Plot Riparian",
    examples: ["Ficus benjamina", "Barringtonia racemosa", "Pometia pinnata"],
  },
  {
    plotId: "ethnobotani",
    total: 185,
    speciesRows: 35,
    label: "185 records in Ethnobotani inventory group; table rows split between Ethnobotani and Plot Ethnobotani.",
    examples: ["Eugenia polyantha", "Neobalanocarpus heimii", "Aquilaria malaccensis"],
    zoneBreakdown: { "Ethnobotani rows": 90, "Plot Ethnobotani rows": 92, "Source total": 185 },
  },
  {
    plotId: "tanaman-nadir",
    total: 154,
    speciesRows: 30,
    label: "154 records in Tanaman Nadir inventory",
    examples: ["Mangifera petandra", "Gnetum gnemon", "Garcinia atroviridis"],
  },
  {
    plotId: "nama-tempat",
    total: 181,
    speciesRows: 25,
    label: "181 records in Nama Tempat inventory",
    examples: ["Place-name tree collection", "Local heritage species", "Interpretive plant records"],
  },
];

export const TBJ_INVENTORY_SOURCE_GROUPS = [
  { id: "jalan-rumah-tasik", name: "Jalan Tasik Utama / Rumah Tamu / Tasik Bukit Belah", total: 339, source: "Jalan Utama, Plot Buah-Buahan, Arid, Riparian.docx" },
  { id: "ethnobotani-group", name: "Ethnobotani / Plot Ethnobotani", total: 185, source: "Plot Ethnobotani, Tanaman Nadir, Nama Tempat...docx" },
];

export const TBJ_STAKEHOLDER_PLOTS = [
  {
    id: "jalan-tasik-utama",
    name: "Jalan Tasik Utama",
    zoneId: "pentadbiran",
    source: "Stakeholder inventory doc: Jalan Utama, Plot Buah-Buahan, Arid, Riparian",
    x: -38,
    z: 12,
  },
  {
    id: "rumah-tamu",
    name: "Rumah Tamu",
    zoneId: "pentadbiran",
    source: "Stakeholder inventory doc: Jalan Utama, Plot Buah-Buahan, Arid, Riparian",
    x: -33,
    z: 8,
  },
  {
    id: "tasik-bukit-belah",
    name: "Tasik Bukit Belah",
    zoneId: "riparian",
    source: "Stakeholder inventory doc: Jalan Utama, Plot Buah-Buahan, Arid, Riparian",
    x: 12,
    z: 19,
  },
  {
    id: "plot-buah-buahan",
    name: "Plot Buah-buahan",
    zoneId: "tanaman-buah",
    source: "Stakeholder inventory doc: Jalan Utama, Plot Buah-Buahan, Arid, Riparian",
    x: -29,
    z: 28,
  },
  {
    id: "arid",
    name: "Arid",
    zoneId: "tapak-semaian",
    source: "Stakeholder inventory doc: Jalan Utama, Plot Buah-Buahan, Arid, Riparian",
    x: 33,
    z: 28,
  },
  {
    id: "riparian",
    name: "Riparian",
    zoneId: "riparian",
    source: "Stakeholder inventory doc: Jalan Utama, Plot Buah-Buahan, Arid, Riparian",
    x: 1,
    z: 26,
  },
  {
    id: "ethnobotani",
    name: "Ethnobotani",
    zoneId: "arboretum",
    source: "Stakeholder inventory doc: Plot Ethnobotani, Tanaman Nadir, Nama Tempat",
    x: -18,
    z: -22,
  },
  {
    id: "tanaman-nadir",
    name: "Tanaman Nadir",
    zoneId: "tanaman-buah",
    source: "Stakeholder inventory doc: Plot Ethnobotani, Tanaman Nadir, Nama Tempat",
    x: -18,
    z: 24,
  },
  {
    id: "nama-tempat",
    name: "Nama Tempat",
    zoneId: "arboretum",
    source: "Stakeholder inventory doc: Plot Ethnobotani, Tanaman Nadir, Nama Tempat",
    x: -32,
    z: -26,
  },
].map((plot) => {
  const summary = TBJ_COLLECTION_SUMMARIES.find((item) => item.plotId === plot.id);
  const zone = MAP_ZONES.find((item) => item.id === plot.zoneId);
  return { ...plot, officialZone: zone?.name || "", inventory: summary || null, total: summary?.total || 0, countLabel: summary?.label || "", examples: summary?.examples || [] };
});

export const VISITOR_ZONES = {
  pentadbiran: {
    routeTags: ["facilities", "photo"],
    representativeTrees: ["TBJ-001", "TBJ-002"],
    facilities: ["Main entrance", "Garden cafe", "Herbarium"],
    localized: {
      en: { name: "Administration & Arrival", summary: "Start here for facilities, orientation, and the easiest route into the garden." },
      bm: { name: "Pentadbiran & Ketibaan", summary: "Mulakan di sini untuk kemudahan, orientasi dan laluan masuk taman yang mudah." },
      zh: { name: "行政与入口区", summary: "从这里开始，可查看设施、导览方向，并进入主要园区路线。" },
    },
  },
  arboretum: {
    routeTags: ["ancient", "medicinal", "shaded"],
    representativeTrees: ["TBJ-001", "TBJ-002", "TBJ-009"],
    facilities: ["Aroma plot", "Bamboo plot", "Palm plot", "Ethnobotany plot"],
    localized: {
      en: { name: "Arboretum Collections", summary: "A learning zone for heritage trees, bamboo, palms, aromatic plants, and ethnobotanical stories." },
      bm: { name: "Koleksi Arboretum", summary: "Zon pembelajaran untuk pokok warisan, buluh, palma, tumbuhan aroma dan etnobotani." },
      zh: { name: "植物标本园收藏区", summary: "学习古树、竹类、棕榈、芳香植物与民族植物故事的区域。" },
    },
  },
  pemuliharaan: {
    routeTags: ["rare", "ancient", "shaded"],
    representativeTrees: ["TBJ-003", "TBJ-005"],
    facilities: ["Secondary forest trail", "Conservation interpretation"],
    localized: {
      en: { name: "Conservation Forest", summary: "A protected learning zone for native forest stories. Rare species are shown only at generalized public level." },
      bm: { name: "Hutan Pemuliharaan", summary: "Zon pembelajaran hutan tempatan. Spesies nadir dipaparkan secara umum sahaja." },
      zh: { name: "保育林区", summary: "本地森林学习区。珍稀物种只以泛化方式向公众展示。" },
    },
  },
  "tapak-semaian": {
    routeTags: ["butterfly", "photo"],
    representativeTrees: ["TBJ-010"],
    facilities: ["Nursery plots", "Flowering plant displays"],
    localized: {
      en: { name: "Nursery & Flowering Zone", summary: "A friendly stop for propagation, flowering plants, and quick learning wins for families." },
      bm: { name: "Zon Semaian & Bunga", summary: "Hentian mesra keluarga untuk semaian, tumbuhan berbunga dan pembelajaran mudah." },
      zh: { name: "苗圃与花卉区", summary: "适合家庭参观的繁殖与开花植物学习点。" },
    },
  },
  riparian: {
    routeTags: ["shaded", "photo"],
    representativeTrees: ["TBJ-007"],
    facilities: ["Lake edge", "Boardwalk", "Jetty"],
    localized: {
      en: { name: "Riparian Lakeside", summary: "A waterside route with lake views, shade, and biodiversity interpretation." },
      bm: { name: "Tepi Tasik Riparian", summary: "Laluan tepi air dengan pemandangan tasik, teduhan dan interpretasi biodiversiti." },
      zh: { name: "水岸湖区", summary: "拥有湖景、林荫和生物多样性解说的水岸路线。" },
    },
  },
  "tanaman-buah": {
    routeTags: ["medicinal", "photo"],
    representativeTrees: ["TBJ-004", "TBJ-006"],
    facilities: ["Fruit learning area", "Useful plant walk"],
    localized: {
      en: { name: "Fruit & Useful Plants", summary: "A cultivated plant route for edible plants, daily-life botany, and food stories." },
      bm: { name: "Buah & Tumbuhan Berguna", summary: "Laluan tanaman untuk tumbuhan makanan, botani harian dan cerita makanan." },
      zh: { name: "果树与实用植物区", summary: "认识食用植物、日常植物用途与食物故事的栽培区。" },
    },
  },
};

export function getVisitorZone(zoneId, language = "en") {
  const zone = MAP_ZONES.find((item) => item.id === zoneId);
  const visitorZone = VISITOR_ZONES[zoneId];
  if (!zone || !visitorZone) return null;
  const localized = visitorZone.localized[language] || visitorZone.localized.en;
  return { ...zone, ...visitorZone, localizedName: localized.name, summary: localized.summary };
}

export function treeToWorldPosition(tree) {
  return {
    x: (tree.x - 50) * 0.84,
    z: (tree.y - 50) * 0.68,
  };
}

export function percentToWorldPosition(point) {
  return {
    x: (point.x - 50) * 0.84,
    z: (point.y - 50) * 0.68,
  };
}

export function worldToPercentPosition(point) {
  const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
  return {
    x: clamp(point.x / 0.84 + 50),
    y: clamp(point.z / 0.68 + 50),
  };
}

export function countZoneRecords(trees, zone) {
  if (!zone.inventoryZone) return 0;
  return trees.filter((tree) => tree.zone === zone.inventoryZone).length;
}

export function getStakeholderPlotsByZone(zoneId) {
  return TBJ_STAKEHOLDER_PLOTS.filter((plot) => plot.zoneId === zoneId);
}

export function countStakeholderRecords(plotId) {
  return TBJ_COLLECTION_SUMMARIES.find((summary) => summary.plotId === plotId)?.total || 0;
}

export function getStakeholderPlotInventory(plotId) {
  return TBJ_COLLECTION_SUMMARIES.find((summary) => summary.plotId === plotId) || null;
}

export function getStakeholderSourceGroup(groupId) {
  return TBJ_INVENTORY_SOURCE_GROUPS.find((group) => group.id === groupId) || null;
}

export function formatPlotQuantity(plotId) {
  const inventory = getStakeholderPlotInventory(plotId);
  if (!inventory) return "Inventory records from stakeholder docs";
  const group = inventory.groupId ? getStakeholderSourceGroup(inventory.groupId) : null;
  return group ? `${inventory.total} records · ${inventory.speciesRows} species rows · source group ${group.total}` : `${inventory.total} records · ${inventory.speciesRows} species rows`;
}

export function getMapSourceSummary() {
  return "Official JLN zones + Google Maps location context + supplied TBJ zoning image + stakeholder DOCX inventory quantities.";
}
