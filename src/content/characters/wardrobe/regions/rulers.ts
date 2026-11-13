import type { GarmentKit, Option, WardrobeSlot } from "../types";

/**
 * Regalia and court dress. Three tiers per court: the ruler (a brief's
 * `ruler`, or a title such as king or sultan in the role), the court
 * (statesmen, courtiers, envoys, nobles by title) with high priests beside
 * them, and the gentry (landowners, magistrates, bankers and the like) in
 * the court's dress. Everyone else falls through to the street.
 *
 * Each culture region has a wide floor, so a Korean noble with no kit of his
 * own wears the Chinese official's robe and a Hungarian duke the European
 * nobleman's: the nearest court, not a random draw. Narrower kits (by bounds,
 * then by span) beat the floor where the record is better.
 */
type Val<K extends WardrobeSlot> = NonNullable<GarmentKit[K]>[number]["value"];
type Slots = { [K in WardrobeSlot]?: readonly (Val<K> | Option<Val<K>>)[] };

const gates = {
  ruler: [["ruler"], ["monarch"]],
  court: [["statesman", "courtier", "envoy"], ["official", "aristocrat"]],
  priest: [["high-priest"], ["high-priest"]],
  // Rich and placed but holding no office: they dressed after the court where the law let them.
  gentry: [["landowner", "magistrate", "lawyer", "army-officer", "scholar-official", "planter", "mill-owner", "banker", "shipowner", "comprador",
    "guild-master", "tax-collector"], ["gentleman"]],
} as const;
function gated(slots: Slots | undefined, [livelihoods, roles]: (typeof gates)[keyof typeof gates]) {
  const out: Record<string, Option<unknown>[]> = {};
  for (const [key, options] of Object.entries(slots ?? {}))
    out[key] = (options as readonly unknown[]).flatMap((o) => {
      const opt = (typeof o === "object" && o !== null ? o : { value: o }) as Option<unknown>;
      return [{ ...opt, livelihoods }, { ...opt, roles }];
    });
  return out;
}
function court(c: { id: string; label: string; scope: GarmentKit["scope"]; ruler?: Slots; court?: Slots; priest?: Slots }): GarmentKit[] {
  const kits: GarmentKit[] = [];
  // Above the street and guard sets: only the named stations reach these.
  if (c.ruler) kits.push({ id: c.id, label: c.label, scope: c.scope, priority: 5, ...gated(c.ruler, gates.ruler) });
  if (c.court || c.priest) {
    const merged: Record<string, Option<unknown>[]> = gated(c.court, gates.court);
    for (const [k, v] of Object.entries(gated(c.priest, gates.priest))) merged[k] = [...(merged[k] ?? []), ...v];
    kits.push({ id: `${c.id}-court`, label: `${c.label} (court)`, scope: c.scope, priority: 4.5, ...merged });
  }
  // Below the court, above the street and guards; the gate names its jobs, so clergy keep their own dress.
  if (c.court) kits.push({ id: `${c.id}-gentry`, label: `${c.label} (gentry)`, scope: c.scope, priority: 3.5, ...gated(c.court, gates.gentry) });
  return kits;
}
const M = ["male"] as const, F = ["female"] as const;
const man = <T,>(value: T, weight?: number) => ({ value, sex: M, weight });
const woman = <T,>(value: T, weight?: number) => ({ value, sex: F, weight });

/** The Tang-to-Qing court, shared with Đại Việt. */
const chineseCourt: { ruler: Slots; court: Slots } = {
  ruler: { garment: ["robe"], sleeves: ["loose"], headwear: [man("mian", 2), man("official-cap")], belt: ["sash"], footwear: ["boots"], material: ["silk"],
    dye: ["saffron"], trimPattern: ["cloud"] },
  court: { garment: ["robe"], sleeves: ["loose"], headwear: [man("official-cap"), woman("none")], hairOrnament: [woman("pins")], belt: ["sash"], footwear: ["boots"],
    material: ["silk"], dye: ["lac", "murasaki", "indigo"], trimPattern: ["cloud"] },
};

export const rulerDress: readonly GarmentKit[] = [
  // ---- Europe
  ...court({
    // Iron Age and Migration-period chiefs: the torc, the pinned cloak, the sword.
    id: "europe-chief",
    label: "Europe · torc and cloak",
    scope: { years: [-1500, 500], cultures: ["european"] },
    ruler: { headwear: ["fillet"], neck: ["chain"], over: ["cloak"], sidearm: [man("sword")], motif: ["band"], dye: [{ value: "madder", weight: 2 }, "woad", "kermes"] },
    court: { neck: ["chain"], over: ["cloak"], sidearm: [man("sword")], motif: ["band"], dye: ["madder", "woad", "weld"] },
  }),
  ...court({
    // The crowned king of the manuscripts and seals; the noble in a long robe
    // and mantle, the lady veiled.
    id: "europe-crown",
    label: "Europe · crown and mantle",
    scope: { years: [500, 1650], cultures: ["european"] },
    ruler: { garment: [man("robe"), woman("dress")], headwear: ["crown"], over: ["cloak"], belt: ["leather"], footwear: ["shoes"], material: ["silk"],
      dye: [{ value: "kermes", weight: 3 }, "tyrian", "woad"], motif: ["band"] },
    court: { garment: [man("robe"), woman("dress")], headwear: [man("cap"), man("none", 2), woman("veil")], over: ["cloak"], sidearm: [man("sword")],
      footwear: ["shoes"], dye: ["kermes", "woad", "madder"], motif: ["band"] },
  }),
  ...court({
    // Black silk and the ruff in Madrid, Vienna and Kraków; the plumed hat, the rapier.
    id: "europe-renaissance-court",
    label: "Europe · doublet, ruff and plume",
    scope: { years: [1500, 1650], cultures: ["european"] },
    court: { garment: [man("coat"), woman("gown")], front: [man("closed")], leggings: [man("hose")], headwear: [man("brimmed"), woman("none")],
      hatTrim: [man("feather")], neckwear: [{ value: "ruff", weight: 2 }, "none"], over: [man("cloak")], sidearm: [man("sword")], footwear: ["shoes"],
      material: ["silk"], dye: [{ value: "soot", weight: 3 }, "kermes", "woad"] },
  }),
  ...court({
    // The stemma, the purple chlamys pinned at the right shoulder, silk banded with gold.
    id: "byzantine-emperor",
    label: "Byzantium · stemma and chlamys",
    scope: { years: [300, 1453], bounds: [19, 34.5, 30.5, 42.2] },
    ruler: { garment: [man("robe"), woman("dress")], headwear: ["crown"], over: ["cloak"], neck: ["beads"], footwear: ["shoes"], material: ["silk"],
      dye: [{ value: "tyrian", weight: 3 }, "goldthread"], motif: ["band"], trimPattern: ["diamond"] },
    court: { garment: [man("robe"), woman("dress")], over: ["cloak"], material: ["silk"], dye: ["kermes", "woad", "goldthread"], motif: ["band"], trimPattern: ["diamond"] },
  }),

  // ---- North Africa and West Asia
  ...court({
    // Bare-chested in the pleated linen kilt (shendyt), the broad collar and
    // the striped nemes with the uraeus; officials in long linen; priests
    // shaven, with the leopard skin over the shoulder.
    id: "egypt-pharaoh",
    label: "Egypt · nemes and broad collar",
    scope: { years: [-3100, -30], bounds: [24, 21, 36, 32] },
    ruler: { garment: [man("none"), woman("dress")], leggings: ["none"], headwear: ["nemes"], neck: ["beads"], wrist: ["bangles"], belt: ["sash"],
      footwear: ["sandals"], material: ["linen"], dye: [{ value: "bleached", weight: 9 }, "undyed"] },
    court: { garment: ["long-tunic"], leggings: ["none"], neck: ["beads"], belt: ["sash"], footwear: ["sandals"], material: ["linen"], dye: ["bleached"] },
    priest: { garment: ["long-tunic"], headwear: ["none"], over: ["shoulder-cloth"], footwear: ["sandals"], material: ["linen"], dye: ["bleached"] },
  }),
  ...court({
    // The ancient Near East from Ur to Persepolis: a long robe, a tall crown, purple.
    id: "near-east-crown",
    label: "Near East · the crown and the long robe",
    scope: { years: [-3000, 650], cultures: ["north-african-west-asian"] },
    ruler: { garment: ["robe"], headwear: ["crown"], belt: ["sash"], footwear: ["shoes"], material: ["wool"], dye: ["tyrian", "kermes"], trimPattern: ["meander"] },
    court: { garment: ["robe"], headwear: [man("cap"), woman("veil")], belt: ["sash"], footwear: ["shoes"], dye: ["madder", "woad", "weld"] },
  }),
  ...court({
    id: "persia-king",
    label: "Persia · the crown and the purple robe",
    scope: { years: [-550, -330], bounds: [44, 25, 65, 40] },
    ruler: { garment: ["robe"], headwear: ["crown"], belt: ["sash"], footwear: ["shoes"], material: ["wool"], dye: ["tyrian"] },
  }),
  ...court({
    // Sasanian coins and rock reliefs: a winged crown, trousers, ribbons and pearls.
    id: "persia-sasanian-king",
    label: "Persia · the Sasanian crown",
    scope: { years: [224, 651], bounds: [44, 25, 65, 40] },
    ruler: { garment: ["long-tunic"], leggings: ["wide"], headwear: ["crown"], neck: ["beads"], belt: ["sash"], footwear: ["boots"], material: ["silk"], dye: ["kermes", "tyrian"] },
    court: { garment: ["long-tunic"], leggings: ["wide"], belt: ["sash"], footwear: ["boots"], material: ["silk"], dye: ["madder", "woad"] },
  }),
  ...court({
    // Caliphs, sultans and shahs: a silk kaftan, the turban with its plume, the sword.
    id: "islamic-court",
    label: "West Asia · kaftan and turban",
    scope: { years: [650, 1922], cultures: ["north-african-west-asian"] },
    ruler: { garment: [man("open-robe"), woman("dress")], headwear: [man("turban"), woman("veil")], hatTrim: [man("feather")], belt: ["sash"], sidearm: [man("sword")],
      footwear: ["boots"], material: ["silk"], dye: ["goldthread", "kermes", "bleached"] },
    court: { garment: [man("open-robe"), woman("dress")], headwear: [man("turban"), woman("veil")], belt: ["sash"], footwear: ["boots"], material: ["silk"],
      dye: ["kermes", "woad", "bleached"] },
  }),
  ...court({
    // The sultan's gold-shot kaftan and great plumed turban.
    id: "ottoman-court",
    label: "Ottoman court · kaftan and turban",
    scope: { years: [1300, 1829], bounds: [19, 30, 45, 43] },
    ruler: { garment: [man("open-robe")], headwear: [man("turban")], hatTrim: [man("feather")], belt: ["sash"], footwear: ["boots"], material: ["silk"],
      dye: ["goldthread", "kermes"] },
  }),

  // ---- Inner Eurasia
  ...court({
    // Khans in a gold-shot silk deel, the cap with its plume, boots; their
    // nobles in the deel and sabre.
    id: "steppe-khan",
    label: "Steppe · the khan's deel",
    scope: { years: [-1000, 1900], cultures: ["inner-eurasian"] },
    ruler: { garment: ["robe"], headwear: ["cap"], hatTrim: ["feather"], belt: ["sash"], footwear: ["boots"], material: ["silk"], dye: ["goldthread", "bleached"] },
    court: { garment: ["robe"], headwear: ["cap"], belt: ["sash"], sidearm: [man("sabre")], footwear: ["boots"], material: ["silk"], dye: ["woad", "kermes", "weld"] },
  }),

  // ---- South and Southeast Asia
  ...court({
    // The raja of the temple sculpture: bare above the waist, the dhoti, the
    // tall crown (mukuta), necklaces and armlets.
    id: "india-raja",
    label: "India · mukuta and dhoti",
    scope: { years: [-1500, 1526], cultures: ["south-asian"] },
    ruler: { garment: [man("none"), woman("dress")], leggings: ["sarong"], headwear: ["crown"], neck: ["beads"], wrist: ["bangles"], over: ["shoulder-cloth"],
      material: ["silk"], dye: ["saffron", "turmeric"] },
    court: { garment: [man("none"), woman("dress")], leggings: ["sarong"], headwear: [man("turban")], neck: ["beads"], wrist: ["bangles"], over: ["shoulder-cloth"],
      material: ["cotton", "silk"], dye: ["bleached", "turmeric", "madder"] },
  }),
  ...court({
    // The jama and the sash, a turban with a jewelled plume (sarpech), pearls, the katar.
    id: "india-jama",
    label: "India · jama and sarpech",
    scope: { years: [1526, 1950], cultures: ["south-asian"] },
    ruler: { garment: [man("robe"), woman("dress")], leggings: ["hose"], headwear: [man("turban")], hatTrim: [man("feather")], neck: ["beads"], belt: ["sash"],
      sidearm: [man("dagger")], material: ["silk", "cotton"], dye: [{ value: "bleached", weight: 2 }, "saffron"] },
    court: { garment: [man("robe"), woman("dress")], leggings: ["hose"], headwear: [man("turban")], belt: ["sash"], sidearm: [man("dagger")],
      material: ["cotton"], dye: ["bleached", "saffron", "madder"] },
  }),
  ...court({
    // Angkor, Ayutthaya, Majapahit: the tall pointed crown, bare above a silk
    // sarong, jewelled collars and armlets.
    id: "southeast-asian-king",
    label: "Southeast Asia · the pointed crown and silk sarong",
    scope: { years: [-500, 1950], cultures: ["southeast-asian"] },
    ruler: { garment: [man("none"), woman("dress")], leggings: ["sarong"], headwear: ["crown"], neck: ["beads"], wrist: ["bangles"], over: ["shoulder-cloth"],
      material: ["silk"], dye: ["goldthread", "saffron"] },
    court: { garment: [man("none"), woman("dress")], leggings: ["sarong"], headwear: [man("wrap")], neck: ["beads"], over: ["shoulder-cloth"],
      material: ["silk"], dye: ["madder", "indigo", "turmeric"] },
  }),

  // ---- East Asia
  ...court({
    // Han court dress: the emperor in black with the mian; officials in the
    // tall jinxian cap. Wide, so it dresses any early East Asian court.
    id: "china-han",
    label: "China · the mian and the black robe",
    scope: { years: [-1600, 600], cultures: ["east-asian"] },
    ruler: { garment: ["robe"], sleeves: ["loose"], headwear: [man("mian")], belt: ["sash"], material: ["silk"], dye: ["soot"], trimPattern: ["cloud"] },
    court: { garment: ["robe"], sleeves: ["loose"], headwear: [man("cap")], belt: ["sash"], material: ["silk"], dye: ["soot", "lac"] },
  }),
  ...court({
    // Yellow became the emperor's colour under the Tang. Officials wore the
    // winged black cap and robes coloured by grade, as Korea and Vietnam did after them.
    ...chineseCourt,
    id: "china-imperial",
    label: "China · the yellow robe and the winged cap",
    scope: { years: [600, 1912], cultures: ["east-asian"] },
  }),
  // Đại Việt's court took the Chinese forms, though the street around it is Southeast Asian.
  ...court({ ...chineseCourt, id: "vietnam-court", label: "Đại Việt · the yellow robe and the winged cap", scope: { years: [939, 1945], bounds: [102, 8, 110, 23.5] } }),
  ...court({
    // The Joseon king's red dragon robe and the winged ikseon cap.
    id: "korea-king",
    label: "Korea · the red dragon robe",
    scope: { years: [918, 1910], bounds: [124, 33, 131, 43.5] },
    ruler: { garment: ["robe"], sleeves: ["loose"], headwear: [man("official-cap")], belt: ["sash"], material: ["silk"], dye: ["lac"], trimPattern: ["cloud"] },
  }),
  ...court({
    // Heian court dress and after: the layered robe over wide trousers, the
    // black lacquered kanmuri, black for the high ranks.
    id: "japan-court",
    label: "Japan · the kanmuri and the court robe",
    scope: { years: [794, 1868], bounds: [129, 30, 146, 46] },
    ruler: { garment: ["robe"], sleeves: ["loose"], leggings: ["wide"], headwear: [man("kanmuri")], material: ["silk"], dye: ["pomegranate"] },
    court: { garment: ["robe"], sleeves: ["loose"], leggings: ["wide"], headwear: [man("kanmuri"), woman("none")], material: ["silk"],
      dye: [{ value: "soot", weight: 3 }, "murasaki"] },
  }),

  // ---- Africa
  ...court({
    // Placeholder for the forest and savanna kingdoms: a wide robe, a cap, gold and beads.
    id: "west-african-court",
    label: "West Africa · the wide robe and gold",
    scope: { years: [800, 1900], cultures: ["west-central-african"] },
    ruler: { garment: [man("open-robe"), woman("dress")], headwear: [man("cap")], neck: ["chain"], wrist: ["bangles"], footwear: ["sandals"], material: ["cotton"],
      dye: ["indigo", "bleached"], trimPattern: ["strip"] },
    court: { garment: [man("open-robe"), woman("dress")], headwear: [man("cap")], neck: ["beads"], footwear: ["sandals"], material: ["cotton"], dye: ["indigo", "bleached"] },
  }),
  ...court({
    // Mali and Songhay: the turban, and the gold the chroniclers could not stop describing.
    id: "sahel-mansa",
    label: "Sahel · the mansa's robe and gold",
    scope: { years: [1200, 1600], bounds: [-17, 9, 16, 17] },
    ruler: { garment: [man("open-robe")], headwear: [man("turban")], neck: ["chain"], wrist: ["bangles"], footwear: ["sandals"], material: ["cotton"], dye: ["indigo", "bleached"] },
    court: { garment: [man("open-robe")], headwear: [man("turban")], footwear: ["sandals"], material: ["cotton"], dye: ["bleached"] },
  }),
  ...court({
    // Placeholder for Great Zimbabwe, Buganda, the Zulu kings: the leopard
    // cloak, the feathered band, beads and copper.
    id: "east-african-court",
    label: "East and southern Africa · leopard cloak and plumes",
    scope: { years: [1000, 1900], cultures: ["east-southern-african"] },
    ruler: { garment: ["wrap"], over: ["mantle"], headwear: ["band"], hatTrim: ["feather"], neck: ["beads"], wrist: ["bangles"], dye: ["ochre", "umber"] },
    court: { garment: ["wrap"], over: ["mantle"], neck: ["beads"], wrist: ["bangles"], dye: ["ochre", "umber"] },
  }),
  ...court({
    // The Solomonic kings: a silk robe and cloak, and the crown.
    id: "ethiopia-negus",
    label: "Ethiopia · crown and silk",
    scope: { years: [300, 1950], bounds: [35, 6, 42.5, 15.5] },
    ruler: { garment: ["robe"], headwear: ["crown"], over: ["cloak"], material: ["silk"], dye: ["kermes", "goldthread"] },
    court: { garment: ["robe"], over: ["shoulder-cloth"], material: ["cotton"], dye: ["bleached"] },
  }),

  // ---- The Americas and the Pacific
  ...court({
    // The tlatoani: the maxtlatl, a cloak of turquoise blue only he might
    // wear, plumes, jade. The lords in cotton mantles and jade.
    id: "mesoamerican-court",
    label: "Mesoamerica · the turquoise cloak",
    scope: { years: [-1500, 1550], cultures: ["mesoamerican"] },
    // The loincloth undyed; the cloak takes the second colour.
    ruler: { garment: [man("loincloth"), woman("dress")], headwear: ["plume"], over: ["cloak"], neck: ["beads"], wrist: ["bangles"], footwear: ["sandals"],
      material: ["cotton"], dye: [{ value: "undyed", weight: 9 }, "mayablue"] },
    court: { garment: [man("loincloth"), woman("dress")], over: ["cloak"], neck: ["beads"], footwear: ["sandals"], material: ["cotton"],
      dye: [{ value: "undyed", weight: 9 }, "achiote", "mayablue"] },
  }),
  ...court({
    // A Maya ajaw of the stelae: the hip cloth, a jaguar-skin cape, plumes, jade.
    id: "maya-ajaw",
    label: "Maya · the ajaw's plumes and jade",
    scope: { years: [-250, 1550], bounds: [-92.5, 13.5, -86.5, 21.7] },
    ruler: { garment: [man("loincloth")], headwear: ["plume"], over: ["mantle"], neck: ["beads"], wrist: ["bangles"], footwear: ["sandals"], material: ["cotton"],
      dye: [{ value: "undyed", weight: 9 }, "ochre"] },
  }),
  ...court({
    // The Sapa Inca: a tunic of fine cumbi worked in tocapu, the llautu
    // headband with its fringe and feathers, a cloak; lords the tocapu tunic.
    id: "andean-court",
    label: "Andes · the tocapu tunic and the llautu",
    scope: { years: [-1000, 1572], cultures: ["andean"] },
    ruler: { garment: [man("tunic"), woman("dress")], headwear: ["band"], hatTrim: ["feather"], over: ["cloak"], trimPattern: ["step"], footwear: ["sandals"],
      material: ["wool"], dye: ["cochineal", "relbunium"] },
    court: { garment: [man("tunic"), woman("dress")], trimPattern: ["step"], footwear: ["sandals"], material: ["wool"], dye: ["relbunium", "qolle", "chilca"] },
  }),
  ...court({
    // Sachems and chiefs: the feathered headdress, a painted robe, shell and bead.
    id: "american-chief",
    label: "North America · feathers and the painted robe",
    scope: { years: [-10000, 1890], cultures: ["other-indigenous-american"] },
    ruler: { headwear: ["plume"], over: ["mantle"], neck: ["beads"] },
    court: { over: ["mantle"], neck: ["beads"] },
  }),
  ...[["polynesia-east", [-180, -48, -120, 30]], ["polynesia-west", [155, -48, 180, 30]]].flatMap(([id, bounds]) => court({
    // Ali'i and ariki: the red and yellow feather cloak and crested headdress.
    id: `${id}-alii`,
    label: "Polynesia · the feather cloak",
    scope: { years: [-1000, 1900], bounds: bounds as [number, number, number, number] },
    ruler: { garment: [man("loincloth"), woman("wrap")], headwear: ["plume"], over: ["cloak"], neck: ["beads"], dye: [{ value: "undyed", weight: 9 }, "safflower"] },
    court: { over: ["shoulder-cloth"], neck: ["beads"] },
  })),
];
