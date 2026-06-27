const PHOTO_LIBRARY = {
  "TBJ-001": {
    url: new URL("../assets/visitor-trees/angsana.jpg", import.meta.url).href,
    credit: "Wikimedia Commons representative species photo",
    source: "https://commons.wikimedia.org/wiki/File:Pterocarpus_indicus,_Burmese_rose_wood_tree_in_the_Penang_Botanic_Garden.jpg",
  },
  "TBJ-002": {
    url: new URL("../assets/visitor-trees/rain-tree.jpg", import.meta.url).href,
    credit: "Wikimedia Commons representative species photo",
    source: "https://commons.wikimedia.org/wiki/File:Leaning_Samanea_saman_-_Rain_tree_-_on_the_bank_of_an_island_at_golden_hour_in_Si_Phan_Don_Laos.jpg",
  },
  "TBJ-003": {
    url: new URL("../assets/visitor-trees/cempaka.jpg", import.meta.url).href,
    credit: "Wikimedia Commons representative species photo",
    source: "https://commons.wikimedia.org/wiki/File:Starr_070320-5724_Michelia_x_alba.jpg",
  },
  "TBJ-004": {
    url: new URL("../assets/visitor-trees/jackfruit.jpg", import.meta.url).href,
    credit: "Wikimedia Commons representative species photo",
    source: "https://commons.wikimedia.org/wiki/File:JackfruitTree.jpg",
  },
  "TBJ-005": {
    url: new URL("../assets/visitor-trees/meranti.jpg", import.meta.url).href,
    credit: "Wikimedia Commons representative species photo",
    source: "https://commons.wikimedia.org/wiki/File:Shorea_leprosula.jpg",
  },
  "TBJ-006": {
    url: new URL("../assets/visitor-trees/oil-palm.jpg", import.meta.url).href,
    credit: "Wikimedia Commons representative species photo",
    source: "https://commons.wikimedia.org/wiki/File:Elaeis_guineensis_(4631161284).jpg",
  },
  "TBJ-007": {
    url: new URL("../assets/visitor-trees/ficus.jpg", import.meta.url).href,
    credit: "Wikimedia Commons representative species photo",
    source: "https://commons.wikimedia.org/wiki/File:Ficus_benjamina-weeping_fig-benjamin_fig_04.jpg",
  },
  "TBJ-008": {
    url: new URL("../assets/visitor-trees/bunga-tanjung.jpg", import.meta.url).href,
    credit: "Wikimedia Commons representative species photo",
    source: "https://commons.wikimedia.org/wiki/File:Mimusops_elengi_flower.jpg",
  },
  "TBJ-009": {
    url: new URL("../assets/visitor-trees/bamboo.jpg", import.meta.url).href,
    credit: "Wikimedia Commons representative species photo",
    source: "https://commons.wikimedia.org/wiki/File:Bambusa_vulgaris_(533070367).jpg",
  },
  "TBJ-010": {
    url: new URL("../assets/visitor-trees/hibiscus.jpg", import.meta.url).href,
    credit: "Wikimedia Commons representative species photo",
    source: "https://commons.wikimedia.org/wiki/File:Hibiscus_Rosa-sinensis.jpg",
  },
};

const ZONE_COPY = {
  Arboretum: {
    en: "Arboretum collection area with aroma, bamboo, palm, ethnobotany, herb, and medicinal interpretation plots.",
    bm: "Kawasan koleksi arboretum dengan plot aroma, buluh, palma, etnobotani, herba dan tumbuhan ubatan.",
    zh: "植物标本园收藏区，包含香气、竹类、棕榈、民族植物、草药与药用植物解说点。",
  },
  Pemuliharaan: {
    en: "Conservation and secondary forest learning zone. Exact protected-species locations stay generalized for public safety.",
    bm: "Zon pemuliharaan dan hutan sekunder. Lokasi tepat spesies dilindungi dikaburkan untuk keselamatan awam.",
    zh: "保育与次生林学习区。受保护物种的精确位置会被泛化，避免公开暴露。",
  },
  Tanaman: {
    en: "Cultivated fruit and useful plant zone for edible plant, daily-life botany, and family learning routes.",
    bm: "Zon tanaman buah dan tumbuhan berguna untuk pembelajaran makanan, botani harian dan laluan keluarga.",
    zh: "果树与实用植物区，适合学习食用植物、日常植物用途和亲子路线。",
  },
  Riparian: {
    en: "Waterside habitat zone linked to the lakes, boardwalks, shade, and biodiversity interpretation.",
    bm: "Zon habitat tepi air yang berkait dengan tasik, laluan papan, teduhan dan biodiversiti.",
    zh: "水岸栖息地区，连接湖泊、木栈道、林荫与生物多样性解说。",
  },
  "Tapak Semaian": {
    en: "Nursery and propagation area supporting future planting stock, education, and easy flowering specimens.",
    bm: "Kawasan semaian dan pembiakan yang menyokong stok tanaman masa depan, pendidikan dan spesimen berbunga.",
    zh: "苗圃与繁殖区，支持未来栽植、教育展示和容易观察的开花植物。",
  },
};

const PUBLIC_PROFILES = {
  "TBJ-001": {
    family: "Fabaceae",
    growthModel: { baseHeight: 18, annualGrowthRate: 0.18, canopyFactor: 0.72, rootFactor: 0.42 },
    localized: {
      en: ["Angsana", "Native to Southeast Asia", "A graceful native shade tree with fragrant yellow flowers.", "Compound leaves, broad canopy, and scented yellow flower flushes.", "Provides shade, nectar, and structure for garden wildlife.", "Often planted as a heritage shade tree in tropical towns.", "Yellow flowering flushes and wide shade.", "Look up from the path: Angsana can make a natural umbrella over hot garden walks.", ["Shade tree", "Flowering", "Heritage streetscape"]],
      bm: ["Angsana", "Asal Asia Tenggara", "Pokok teduhan tempatan dengan bunga kuning yang harum.", "Daun majmuk, kanopi lebar dan gugusan bunga kuning berbau wangi.", "Memberi teduhan, nektar dan struktur habitat kepada hidupan taman.", "Sering ditanam sebagai pokok teduhan warisan di bandar tropika.", "Perhatikan bunga kuning dan teduhan kanopi yang luas.", "Dongak ke atas laluan: Angsana boleh menjadi payung semula jadi ketika cuaca panas.", ["Pokok teduhan", "Berbunga", "Warisan bandar"]],
      zh: ["安山木", "原产于东南亚", "优雅的本地遮荫树，开有芳香的黄色花朵。", "复叶、宽阔树冠，并会出现芳香的黄色花期。", "提供遮荫、花蜜和小型园区生物的栖息结构。", "常作为热带城镇的传统遮荫树种植。", "观察黄色花朵和宽大的树荫。", "在步道上抬头看，安山木像一把天然大伞。", ["遮荫树", "开花", "城市传统"]],
    },
  },
  "TBJ-002": {
    family: "Fabaceae",
    growthModel: { baseHeight: 22, annualGrowthRate: 0.2, canopyFactor: 0.95, rootFactor: 0.52 },
    localized: {
      en: ["Pokok Hujan-hujan", "Introduced tropical shade species", "Known for its broad canopy and rain-folding leaves.", "Umbrella-shaped canopy with small leaflets that fold in rain or low light.", "Creates cool microclimates and shaded rest points.", "Known as a social shade tree because people naturally gather beneath it.", "Leaflets folding with changing weather and light.", "The rain tree name comes from its rain-folding leaves and drip-like shade effect.", ["Canopy giant", "Weather cue", "Photo shade"]],
      bm: ["Pokok Hujan-hujan", "Spesies teduhan tropika yang diperkenalkan", "Dikenali kerana kanopi luas dan daun yang melipat ketika hujan.", "Kanopi seperti payung dengan anak daun kecil yang melipat dalam hujan atau cahaya rendah.", "Mewujudkan mikroiklim sejuk dan tempat rehat teduh.", "Dikenali sebagai pokok sosial kerana pengunjung mudah berkumpul di bawahnya.", "Perhatikan anak daun yang melipat apabila cuaca berubah.", "Nama hujan-hujan datang daripada daun yang melipat dan kesan teduhan seperti titisan.", ["Kanopi besar", "Petunjuk cuaca", "Teduhan foto"]],
      zh: ["雨树", "引入的热带遮荫树种", "以宽广树冠和雨天会合拢的叶片闻名。", "伞形树冠，细小叶片会在雨天或弱光时合拢。", "营造凉爽微气候和休息点。", "因树荫适合人们聚集，也常被称为社交遮荫树。", "观察天气变化时叶片合拢的样子。", "雨树名称来自叶片合拢与类似雨滴的遮荫效果。", ["巨大树冠", "天气线索", "拍照树荫"]],
    },
  },
  "TBJ-003": {
    family: "Magnoliaceae",
    growthModel: { baseHeight: 14, annualGrowthRate: 0.12, canopyFactor: 0.58, rootFactor: 0.34 },
    localized: {
      en: ["Cempaka Putih", "Cultivated across Southeast Asian gardens", "An aromatic flowering tree valued in traditional gardens.", "Glossy leaves and creamy white aromatic flowers.", "Supports pollinator and sensory garden learning.", "Fragrant flowers are associated with traditional gardens and perfume notes.", "Smell the flowers before looking for them.", "This is a quiet sensory stop: smell first, then identify.", ["Fragrant", "Sensory stop", "Traditional garden"]],
      bm: ["Cempaka Putih", "Ditanam di taman Asia Tenggara", "Pokok berbunga wangi yang dihargai dalam taman tradisional.", "Daun berkilat dan bunga putih berkrim yang harum.", "Menyokong pembelajaran pendebunga dan taman deria.", "Bunganya dikaitkan dengan taman tradisional dan wangian.", "Hidu baunya dahulu sebelum mencari bunga.", "Ini hentian deria yang tenang: bau dahulu, kemudian kenal pasti.", ["Harum", "Hentian deria", "Taman tradisional"]],
      zh: ["白玉兰", "常见于东南亚园林栽培", "传统园林中备受喜爱的芳香开花树。", "有光泽的叶片和乳白色芳香花朵。", "适合传粉者与感官花园学习。", "芳香花朵常与传统庭园和香气记忆相关。", "先闻香，再寻找花。", "这是一个安静的感官停靠点：先闻，再辨认。", ["芳香", "感官停靠点", "传统园林"]],
    },
  },
  "TBJ-004": {
    family: "Moraceae",
    growthModel: { baseHeight: 13, annualGrowthRate: 0.1, canopyFactor: 0.5, rootFactor: 0.32 },
    localized: {
      en: ["Pokok Nangka", "South and Southeast Asian cultivated fruit tree", "A visitor-friendly fruit tree for learning about edible plants and trunk-borne fruit.", "Leathery leaves and very large fruits growing from trunk or older branches.", "Useful for fruit-tree education and food-plant interpretation.", "Jackfruit is eaten fresh, cooked, and used in local dishes.", "Large fruit forms on the trunk are the easiest clue.", "Jackfruit is one of the world's largest tree-borne fruits.", ["Fruit tree", "Food plant", "Easy ID"]],
      bm: ["Pokok Nangka", "Pokok buah Asia Selatan dan Tenggara", "Pokok buah yang sesuai untuk pembelajaran tumbuhan makanan.", "Daun tebal dan buah besar yang tumbuh pada batang atau dahan tua.", "Baik untuk pendidikan pokok buah dan tumbuhan makanan.", "Nangka dimakan segar, dimasak dan digunakan dalam hidangan tempatan.", "Buah besar pada batang ialah petunjuk paling mudah.", "Nangka ialah antara buah terbesar yang tumbuh pada pokok.", ["Pokok buah", "Tumbuhan makanan", "Mudah dikenal"]],
      zh: ["菠萝蜜树", "南亚与东南亚栽培果树", "适合游客学习食用植物与干生果实的果树。", "叶片厚革质，巨大果实常长在树干或老枝上。", "适合说明果树教育与食用植物价值。", "菠萝蜜可鲜食、烹调，也用于本地料理。", "树干上的大型果实最容易辨认。", "菠萝蜜是世界上最大的树生果实之一。", ["果树", "食用植物", "易辨认"]],
    },
  },
  "TBJ-005": {
    family: "Dipterocarpaceae",
    growthModel: { baseHeight: 30, annualGrowthRate: 0.25, canopyFactor: 0.62, rootFactor: 0.48 },
    localized: {
      en: ["Meranti Merah", "Native lowland tropical forest tree", "A protected native forest species and one of the garden's tallest trees.", "Straight trunk and layered canopy typical of dipterocarp forest structure.", "Represents native forest conservation and long-term canopy habitat.", "Important in Malaysian forest education and conservation storytelling.", "Tall trunk form and forest canopy presence.", "This tree explains why exact protected-plant locations should not be public.", ["Protected", "Native forest", "Conservation story"]],
      bm: ["Meranti Merah", "Pokok hutan tanah rendah tempatan", "Spesies hutan tempatan dilindungi dan antara pokok tertinggi di taman.", "Batang lurus dan kanopi berlapis seperti struktur hutan dipterokarpa.", "Mewakili pemuliharaan hutan tempatan dan habitat kanopi jangka panjang.", "Penting dalam pendidikan hutan Malaysia dan cerita pemuliharaan.", "Perhatikan batang tinggi dan kehadiran kanopi hutan.", "Pokok ini menerangkan sebab lokasi tepat spesies dilindungi tidak patut dipaparkan umum.", ["Dilindungi", "Hutan tempatan", "Cerita pemuliharaan"]],
      zh: ["红柳桉", "本地低地热带森林树种", "受保护的本地森林树种，也是园内最高树木之一。", "笔直树干与分层树冠，展现龙脑香科森林结构。", "代表本地森林保育与长期树冠栖息地。", "适合讲述马来西亚森林教育与保育故事。", "观察高直树干和森林树冠层。", "这棵树说明为什么受保护植物的精确位置不应公开。", ["受保护", "本地森林", "保育故事"]],
    },
  },
  "TBJ-006": {
    family: "Arecaceae",
    growthModel: { baseHeight: 16, annualGrowthRate: 0.22, canopyFactor: 0.38, rootFactor: 0.28 },
    localized: {
      en: ["Kelapa Sawit", "African palm widely cultivated in Malaysia", "A palm specimen used for educational interpretation.", "Single trunk, crown of large fronds, and compact fruit bunches.", "Explains agriculture, land use, and plant-product education.", "Economically significant and useful for sustainability conversations.", "Frond shape and fruit bunches.", "A palm is not a woody branching tree, so it grows differently.", ["Palm", "Agriculture", "Plant products"]],
      bm: ["Kelapa Sawit", "Palma Afrika yang banyak ditanam di Malaysia", "Spesimen palma untuk penerangan pendidikan.", "Batang tunggal, pelepah besar dan tandan buah padat.", "Menerangkan pertanian, guna tanah dan produk tumbuhan.", "Penting dari segi ekonomi dan sesuai untuk perbualan kelestarian.", "Perhatikan bentuk pelepah dan tandan buah.", "Palma bukan pokok bercabang berkayu, jadi corak tumbuhnya berbeza.", ["Palma", "Pertanian", "Produk tumbuhan"]],
      zh: ["油棕", "原产非洲、广泛栽培于马来西亚的棕榈", "用于教育解说的棕榈植物。", "单一树干、大型羽状叶冠和紧密果串。", "适合说明农业、土地利用与植物产品。", "具有经济意义，也适合讨论可持续种植。", "观察叶片形状和果串。", "棕榈不是典型木本分枝树，因此生长方式不同。", ["棕榈", "农业", "植物产品"]],
    },
  },
  "TBJ-007": {
    family: "Moraceae",
    growthModel: { baseHeight: 15, annualGrowthRate: 0.16, canopyFactor: 0.66, rootFactor: 0.5 },
    localized: {
      en: ["Pokok Ara", "Native and cultivated across tropical Asia", "A resilient riparian fig supporting local biodiversity.", "Dense leaves, flexible branches, and aerial-root tendencies.", "Ficus species provide food and shelter for urban wildlife.", "Often planted for shade, bonsai, and habitat value.", "Small fig fruits and dense branching near water.", "Figs are quiet biodiversity engines because many animals use their fruit.", ["Riparian", "Wildlife food", "Dense canopy"]],
      bm: ["Pokok Ara", "Asal dan ditanam di Asia tropika", "Pokok ara riparian yang menyokong biodiversiti tempatan.", "Daun padat, dahan lentur dan kecenderungan akar udara.", "Spesies Ficus memberi makanan dan perlindungan kepada hidupan bandar.", "Sering ditanam untuk teduhan, bonsai dan nilai habitat.", "Buah ara kecil dan dahan padat berhampiran air.", "Pokok ara ialah enjin biodiversiti senyap kerana buahnya digunakan banyak haiwan.", ["Riparian", "Makanan hidupan", "Kanopi padat"]],
      zh: ["榕树", "热带亚洲原生及栽培", "支持本地生物多样性的水岸榕树。", "叶片密集、枝条柔韧，并可能形成气根。", "榕属植物为城市野生动物提供食物和庇护。", "常用于遮荫、盆景和栖息地营造。", "水边的小榕果和浓密枝叶。", "榕树像安静的生物多样性引擎，许多动物会利用它的果实。", ["水岸", "野生动物食物", "密集树冠"]],
    },
  },
  "TBJ-008": {
    family: "Sapotaceae",
    growthModel: { baseHeight: 10, annualGrowthRate: 0.09, canopyFactor: 0.48, rootFactor: 0.3 },
    localized: {
      en: ["Bunga Tanjung", "Native to South and Southeast Asia", "A compact flowering tree with fragrant star-shaped blooms.", "Evergreen habit with small, star-like, fragrant flowers.", "Adds nectar, shade, and sensory learning value.", "Flowers are appreciated for fragrance and ornamental use.", "Small scented flowers reward slow walking.", "This tree rewards slow walking: the flowers are small but beautifully scented.", ["Fragrant", "Small flowers", "Slow-walk stop"]],
      bm: ["Bunga Tanjung", "Asal Asia Selatan dan Tenggara", "Pokok berbunga kecil dengan bunga berbentuk bintang yang harum.", "Pokok malar hijau dengan bunga kecil berbentuk bintang dan berbau wangi.", "Menambah nektar, teduhan dan nilai pembelajaran deria.", "Bunganya dihargai kerana bau harum dan nilai hiasan.", "Bunga kecil berbau wangi sesuai untuk berjalan perlahan.", "Pokok ini memberi ganjaran kepada pengunjung yang berjalan perlahan.", ["Harum", "Bunga kecil", "Hentian santai"]],
      zh: ["丹绒花", "原产南亚与东南亚", "开有芳香星形花朵的小型常绿树。", "常绿树形，小而星状的芳香花朵。", "提供花蜜、遮荫和感官学习价值。", "花朵因香气和观赏价值而受到喜爱。", "小而芳香的花适合慢慢观察。", "这棵树奖励放慢脚步的人：花很小，但香气很美。", ["芳香", "小花", "慢行停靠点"]],
    },
  },
  "TBJ-009": {
    family: "Poaceae",
    growthModel: { baseHeight: 9, annualGrowthRate: 0.35, canopyFactor: 0.35, rootFactor: 0.62 },
    localized: {
      en: ["Buluh", "Tropical bamboo group", "A fast-growing bamboo cluster forming a sheltered walkway.", "Jointed culms, narrow leaves, and clumping growth rather than one trunk.", "Demonstrates grasses, fast growth, and sheltered microhabitats.", "Used in crafts, food, construction, and garden design.", "Culm structure and rustling leaves.", "Bamboo belongs to the grass family, not typical tree families.", ["Bamboo plot", "Fast growth", "Useful plant"]],
      bm: ["Buluh", "Kumpulan buluh tropika", "Kelompok buluh yang tumbuh pantas dan membentuk laluan teduh.", "Ruas batang, daun sempit dan pertumbuhan berumpun, bukan satu batang utama.", "Menunjukkan keluarga rumput, pertumbuhan pantas dan mikrohabitat teduh.", "Digunakan dalam kraf, makanan, pembinaan dan reka bentuk taman.", "Perhatikan ruas buluh dan bunyi daun.", "Buluh tergolong dalam keluarga rumput, bukan keluarga pokok biasa.", ["Plot buluh", "Tumbuh pantas", "Tumbuhan berguna"]],
      zh: ["竹", "热带竹类群", "快速生长并形成遮蔽步道的竹丛。", "有节的竹秆、狭长叶片，以丛生方式生长而非单一树干。", "展示禾本科、快速生长和遮蔽微栖息地。", "竹可用于工艺、食物、建筑和园林设计。", "观察竹节结构和叶片沙沙声。", "竹属于禾本科，不是典型树木家族。", ["竹类区", "快速生长", "实用植物"]],
    },
  },
  "TBJ-010": {
    family: "Malvaceae",
    growthModel: { baseHeight: 3, annualGrowthRate: 0.06, canopyFactor: 0.45, rootFactor: 0.28 },
    localized: {
      en: ["Bunga Raya", "Cultivated tropical ornamental", "Malaysia's national flower cultivated in the nursery zone.", "Shrub-like plant with large, bright, five-petaled blooms.", "Supports pollinator education and national-flower interpretation.", "Recognized as Malaysia's national flower and a familiar cultural symbol.", "Bright flowers are the main visual attraction.", "A quick win for young visitors: big flower, easy symbol, easy memory.", ["National flower", "Pollinator", "Nursery"]],
      bm: ["Bunga Raya", "Tanaman hiasan tropika", "Bunga kebangsaan Malaysia yang ditanam di zon semaian.", "Tumbuhan seperti renek dengan bunga besar, terang dan lima kelopak.", "Menyokong pendidikan pendebunga dan tafsiran bunga kebangsaan.", "Diiktiraf sebagai bunga kebangsaan Malaysia dan simbol budaya yang biasa.", "Bunga terang ialah tarikan utama.", "Mudah diingati kanak-kanak: bunga besar, simbol jelas, ingatan kuat.", ["Bunga kebangsaan", "Pendebunga", "Semaian"]],
      zh: ["大红花", "热带观赏栽培植物", "种植于苗圃区的马来西亚国花。", "灌木状植物，花朵大而鲜艳，通常五瓣。", "支持传粉者教育和国花解说。", "被视为马来西亚国花，也是熟悉的文化象征。", "鲜艳花朵是主要观赏点。", "对小朋友很友好：花大、符号清楚、容易记住。", ["国花", "传粉者", "苗圃"]],
    },
  },
};

function toLocalizedProfile(tree, language = "en") {
  const profile = PUBLIC_PROFILES[tree.id] || PUBLIC_PROFILES["TBJ-001"];
  const selected = profile.localized[language] || profile.localized.en;
  const [localName, origin, description, morphology, ecologyRole, culturalUse, seasonalInterest, visitorFact, badges] = selected;
  const photo = PHOTO_LIBRARY[tree.id] || PHOTO_LIBRARY["TBJ-001"];
  const zoneContext = ZONE_COPY[tree.zone]?.[language] || ZONE_COPY[tree.zone]?.en || "Visitor-facing botanical learning zone.";
  return {
    localized: profile.localized,
    localName,
    commonNames: [localName, tree.name],
    family: profile.family,
    origin,
    description,
    zoneContext,
    morphology,
    ecologyRole,
    culturalUse,
    conservationNote: tree.rare
      ? {
        en: "Protected-species location is intentionally generalized for visitor safety.",
        bm: "Lokasi spesies dilindungi sengaja digeneralisasi untuk keselamatan pelawat.",
        zh: "受保护物种的位置会刻意泛化，以保障公共安全。",
      }[language]
      : {
        en: "Public learning profile. Operational health data is not shown to visitors.",
        bm: "Profil pembelajaran awam. Data kesihatan operasi tidak dipaparkan kepada pelawat.",
        zh: "公开学习资料。运营健康数据不会向访客显示。",
      }[language],
    seasonalInterest,
    visitorFact,
    badges,
    photoUrl: photo.url,
    photoCredit: photo.credit,
    photoSourceUrl: photo.source,
    photoAlt: {
      en: `${localName} representative demo photo`,
      bm: `Foto demo wakil ${localName}`,
      zh: `${localName} 代表性演示照片`,
    }[language] || `${localName} representative demo photo`,
    growthModel: {
      ...profile.growthModel,
      milestones: {
        5: {
          en: "Young canopy fills nearby shade gaps.",
          bm: "Kanopi muda mula mengisi ruang teduhan berhampiran.",
          zh: "年轻树冠开始补足附近的遮荫空间。",
        }[language],
        10: {
          en: "Branch structure becomes clearer for visitor identification.",
          bm: "Struktur dahan semakin jelas untuk dikenal pasti pelawat.",
          zh: "枝条结构更明显，游客更容易辨认。",
        }[language],
        25: {
          en: "Canopy begins to define the microclimate around the route.",
          bm: "Kanopi mula membentuk mikroiklim di sekitar laluan.",
          zh: "树冠开始影响路线周围的微气候。",
        }[language],
        50: {
          en: "Mature form supports long-term shade, habitat, and education value.",
          bm: "Bentuk matang menyokong teduhan, habitat dan nilai pendidikan jangka panjang.",
          zh: "成熟树形带来长期遮荫、栖息地与教育价值。",
        }[language],
      },
    },
  };
}

export function getVisitorTreeProfile(tree, language = "en") {
  return toLocalizedProfile(tree, language);
}

export function getPublicTreeCard(tree, language = "en") {
  const profile = getVisitorTreeProfile(tree, language);
  return {
    id: tree.id,
    name: profile.localName || tree.name,
    scientificName: tree.scientificName,
    zone: tree.zone,
    age: tree.age,
    height: tree.height,
    rare: tree.rare,
    ...profile,
  };
}

export function projectGrowth(profile, years) {
  const value = Number(years);
  const projectedHeight = Number((profile.growthModel.baseHeight + profile.growthModel.annualGrowthRate * value).toFixed(1));
  return {
    years: value,
    height: projectedHeight,
    canopy: Number((projectedHeight * profile.growthModel.canopyFactor).toFixed(1)),
    root: Number((projectedHeight * profile.growthModel.rootFactor).toFixed(1)),
    milestone: profile.growthModel.milestones[value] || profile.growthModel.milestones[10],
  };
}

