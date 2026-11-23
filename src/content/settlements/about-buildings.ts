import { buildingModels } from "../graphics/models";
import houses from "../graphics/regional-houses.json" with { type: "json" };

type RegionalModel = {
  label: string; wall: string; roof: string; roofMaterial: string; stories?: number;
  regionalHouse?: string; regionalProfile?: string; goldScale?: string; wealthTier?: number;
  buildingFunction?: string;
};
/**
 * What a building is, said plainly, for the focus card. The art pipeline's
 * descriptions carry notes on the evidence and on how the sprite was built;
 * those stay in models.generated.json, and the card says what the thing is.
 */
const FORM: Record<string, string> = {
  row: "A narrow {m} house in a row, sharing its side walls with its neighbours, with a yard at the back.",
  shop: "A {m} house with a shop opening onto the street on the ground floor and rooms above.",
  wide: "A broad {m} house on the street, with a yard behind.",
  tall: "A tall {m} house of several floors, squeezed onto a narrow plot.",
  cottage: "A small {m} house standing on its own plot.",
  hut: "A small one-room {m} house.",
  stall: "A little {m} booth where goods are sold to the street.",
  inn: "An inn: a {m} house where travellers eat, drink and sleep.",
  hall: "A big {m} hall on the street, used for meetings, storage or trade.",
  colonnade: "A {m} building fronted by a row of columns, with shade to trade and talk in.",
  midrise: "A block of flats several floors high.",
  office: "An office building.",
};
const WALL: [RegExp, string][] = [
  [/brick|stock|brownstone/, "brick"],
  [/glass|concrete|modern/, "concrete"],
  [/mud|earth/, "mudbrick"],
  [/plaster|stucco|whitewash|lime/, "plastered"],
  [/stone|andesite/, "stone"],
  [/timber|board|half/, "timber"],
];
const FAMILY: Record<string, string> = {
  "house-cottage-thatch-gold": "A large farmhouse under a thatched roof.",
  "house-cottage-timber-gold": "A large timber-framed house.",
  "house-early-brick-gold": "A substantial brick house with mullioned windows.",
  "house-early-stucco-gold": "A large plastered house with sash windows and a plain, formal front.",
  "house-round-gold": "A round house of wattle and daub under a tall cone of thatch.",
  "house-mudbrick-ob-gold": "A mudbrick house with a flat roof. People come and go by a ladder and a hatch, and work and sleep on the roof in summer.",
  "house-longhouse-gold": "A long timber farmhouse, its walls daubed with clay between the posts, under a deep thatched roof. People and animals may share it.",
  "house-cottage-thatch": "A cottage under a thatched roof.",
  "europe-service": "A small outbuilding: a store, a workshop or a shed.",
  "neolithic-service": "A small raised store or work shed, with bundles hung up to dry.",
  "house-dome-expanded": "A large domed house of bent saplings covered with bark or mats.",
  "house-tent-expanded": "A large tent of sewn hides over a cone of poles, with flaps at the top to let the smoke out.",
  "house-pit-expanded": "A large house dug down into the ground under a roof of reed or turf. It keeps warm in winter.",
  "house-round-stone-expanded": "A round house with drystone walls under a roof of reed or turf.",
  "house-rondavel-expanded": "A round house of daub, painted with bands of lime and ochre, under thatch.",
  "house-aegean-expanded": "A flat-roofed house of rubble stone, partly plastered.",
  "roman-domus": "A Roman house built round an open courtyard, with the rooms for guests, work and sleep opening off it.",
  "roman-insula": "A block of shops and workshops on the street, with rented rooms on the floors above.",
  "westasian-house": "A modest single-storey village house of mudbrick or stone, with timber roof beams and a flat roof terrace.",
  "westasian-courtyard": "A house turned inward round a courtyard, with blank walls to the street and a roof terrace to sleep on in the heat.",
  "eastasian-courtyard": "A walled compound of halls and rooms round an open courtyard.",
  "eastasian-row": "A long building on the street with a shop at the front, and workrooms, stores and living rooms behind and above.",
  "eastasian-service": "A small building: a store, a workshop, a gatehouse or a little shrine.",
  "southasian-house": "A modest single-storey house of earth, brick or stone, under thatch, country tiles or a flat roof.",
  "southasian-courtyard": "A town house built round a courtyard, with rooms and work space on every side and more rooms upstairs.",
  "southasian-monsoon": "A house built for heavy rain, with deep eaves and openings to let the air through.",
  "southasian-service": "A small building: a granary, a weaving or craft shed, a market pavilion or a shrine.",
  "house-cottage-timber": "A timber-framed cottage.",
  "hall-hammam": "A bath house. People come to wash, sweat in the hot rooms and talk.",
  "hall-thermae": "The public baths, with hot, warm and cold rooms. People come to wash, exercise and meet.",
  "hall-sento": "A public bath house, where the neighbourhood comes to wash and soak in hot water.",
  "hall-town-hall": "The town hall. The council meets upstairs; the market's weights and measures are kept below.",
  "hall-madrasa": "A madrasa, a school where students learn the Quran and Islamic law.",
  "hall-union-hall": "A meeting hall, hired by a trade or a society for its gatherings.",
  "hall-sweat-lodge": "A sweat lodge. Water is poured on stones heated in the fire, and people sit in the steam to pray and cleanse themselves.",
  "hall-kiva": "A kiva, a round room dug into the ground where men gather for ceremonies and councils. You climb in through the roof.",
  "hall-open-shelter": "An open-sided shelter where people sit in the shade to talk, work and settle disputes.",
  "hall-carved-gable": "The meeting house, where the community gathers and keeps its history.",
  "hall-moot-hall": "The market hall. Traders set up under the open ground floor on market days, and the town's officers meet above.",
  "hall-rathaus": "The town hall, where the council meets and the town's business is done.",
  "hall-grammar-hall": "A grammar school, where boys learn Latin.",
  "hall-charity-school": "A charity school, where poor children are taught to read and write for free.",
  "hall-stew": "A stew: a bath house where people pay to wash and sweat. Some have a bad name.",
  "hall-bagnio": "A bath house with hot baths and rooms to rest in.",
  "theatre-opera-house": "An opera house, where music and plays are performed.",
  "theatre-playhouse": "A playhouse. Crowds stand in the open yard or sit in the galleries to watch plays.",
  "theatre-noh-stage": "A Noh stage, where masked actors perform slow plays to music and chanting.",
  "theatre-kabuki": "A kabuki theatre, where actors put on plays full of song, dance and spectacle.",
  "theatre-picture-house": "A cinema, where people pay to watch films.",
  "theatre-globe": "A playhouse, open to the sky in the middle, where crowds come to watch plays.",
  "theatre-court-opera": "A court theatre, where opera and plays are staged.",
  "study-": "A house.",
  "mod-cun-tile": "A tiled concrete village house, with tinted windows, a red or steel door between couplets and a flat roof to dry grain on.",
  "mod-cun-brick": "A red-brick village house, its floors marked by concrete ring beams, under a grey tile roof.",
};
const families = Object.keys(FAMILY).sort((a, b) => b.length - a.length);
const META =
  /illustrat|reconstruct|procedural|generated|vocabulary|profile|study|dimensions|surveyed|excavat|deliberately|subordinate|selected|seeded|resolved|informed type|recipe|layout and supplies/i;

export function aboutBuilding(frame: string, wall: string, description: string) {
  const form = /-urban-([a-z]+)/.exec(frame)?.[1];
  const family = families.find((f) => frame.startsWith(f));
  // A modern family that names itself says more than its street form.
  if (form && FORM[form] && !family?.startsWith("mod-")) {
    const m = WALL.find(([r]) => r.test(wall))?.[1] ?? "";
    return FORM[form].replace("{m} ", m ? `${m} ` : "");
  }
  if (family) return FAMILY[family];
  const plain = description
    .replace(/ candidate\b/g, "")
    .split(/(?<=\.)\s+/)
    .filter((s) => !META.test(s))
    .join(" ");
  return plain || "A building.";
}

const SIZE: Record<string, string> = { tiny: "tiny", small: "small", large: "large", grand: "grand" };
const ROOF: Record<string, string> = {
  thatch: "thatched", "palm-thatch": "thatched", "ichu-thatch": "thatched", "pandanus-thatch": "thatched", "grass-thatch": "thatched",
  giwa: "tiled", kawara: "tiled", pantile: "tiled", terracotta: "tiled", "bengal-tile": "tiled", tile: "tiled",
  shingle: "shingled", slate: "slate-roofed",
};
const WALL_WORD: [RegExp, string][] = [[/brick/, "brick"], [/stone/, "stone"], [/mud/, "mud"], [/plaster|stucco/, "plastered"], [/timber|board/, "timber"]];
const NOUN: [RegExp, string][] = [
  [/kitchen/, "kitchen house"], [/granary|raised-store/, "granary"], [/store/, "storehouse"], [/sweat-bath|temazcal/, "sweat bath"],
  [/haveli/, "haveli"], [/insula|mixed-use/, "block of shops and rented rooms"], [/courtyard|compound|domus/, "courtyard house"],
  [/ancestral-hall/, "ancestral hall"], [/hall/, "hall"], [/farm/, "farmhouse"], [/cottage/, "cottage"],
  [/workshop|work-shed/, "workshop"], [/shop-house|merchant-house|row/, "shophouse"], [/pavilion|shed/, "shed"],
];
/** Families whose own name says what the building is better than its use does. */
const OWN_NAME = /tent|shelter|dome|lodge|longhouse|maloca|plank house|turf house|winter house|pit house/i;

/**
 * "A small, well-kept thatched house": what this one building is, from the
 * frame's own size, roof and use rather than its family's whole range. Only
 * the regional families, the city forms and the gold masters carry those;
 * others return undefined.
 */
export function buildingPhrase(frame: string, condition: string) {
  const a = /^[aeiou]/.test(condition) ? "An" : "A";
  // The first clause of a written sentence, with the condition put in front.
  const lead = (sentence: string) => `${a} ${condition} ${sentence.replace(/^An? /, "").split(/[,.:]/)[0]}`;
  const form = /-urban-([a-z]+)/.exec(frame)?.[1];
  const family = families.find((f) => frame.startsWith(f));
  if (form && FORM[form] && !family?.startsWith("mod-")) {
    const m = WALL.find(([r]) => r.test(buildingModels[frame]?.wall ?? ""))?.[1] ?? "";
    return lead(FORM[form].replace("{m} ", m ? `${m} ` : ""));
  }
  if (family && /^An? /.test(FAMILY[family])) return lead(FAMILY[family]);
  const model = buildingModels[frame] as RegionalModel | undefined;
  if (!model?.regionalHouse || !model.goldScale) return undefined;
  const label = model.label.split(" · ")[0];
  const fn = model.buildingFunction ?? "";
  const own = OWN_NAME.exec(label)?.[0];
  const noun = own
    ? own.toLowerCase()
    : model.goldScale === "tiny" || fn === "widow-household" ? "hut"
    : fn === "elite-hall" || fn === "official-hall" ? "hall on a raised terrace"
    : NOUN.find(([r]) => r.test(fn))?.[1] ?? "house";
  const material = own ? undefined : roofWord(model) ?? WALL_WORD.find(([r]) => r.test(model.wall))?.[1];
  const size = [noun === "hut" ? undefined : SIZE[model.goldScale], condition].filter(Boolean).join(", ");
  const phrase = [size, material, noun].filter(Boolean).join(" ");
  return `${/^[aeiou]/.test(phrase) ? "An" : "A"} ${phrase}`;
}
/** Only a roof the painter is sure to have drawn: some families pick thatch
 * or tile per variant, and an upper floor often trades thatch for tile. */
function roofWord(model: RegionalModel) {
  const sino = (houses.profiles as Record<string, { sino?: { roofByTier?: string[][] } }>)[model.regionalProfile ?? ""]?.sino;
  const tiers = sino?.roofByTier?.[model.wealthTier ?? 0];
  if (tiers) return tiers.length === 1 ? ROOF[tiers[0]] : undefined;
  if (model.roof === "flat") return "flat-roofed";
  if ((model.stories ?? 1) > 1 && model.roofMaterial === "thatch") return undefined;
  return ROOF[model.roofMaterial];
}
