import { resolveCharacterContext } from "../characters/resolve";
import { characterName, generateCharacter } from "../characters/generate";
import { treeMix } from "../ecology/vegetation";
import { civicProfile } from "../settlements/civic";
import { packTemplates } from "../legacy-packs";
import { landscapes } from "../graphics/landscapes";
import { formatHistoricalYear } from "../../core/calendar";
import type { Pack } from "../../core/types";
import type { WorldSetting } from "./types";
import { historyRegistry, resolveHistory } from "../history";
const namesByCulture: Partial<Record<WorldSetting["culture"], string[]>> = {
  "east-asian": ["Lin", "Mei", "Shen", "Lan", "Zhen", "Yu"],
  "southeast-asian": ["Mya", "Hla", "Min", "Aye", "Tun", "Nwe"],
  "south-asian": ["Deva", "Mira", "Ravi", "Tara", "Nanda", "Lila"],
  "north-african-west-asian": [
    "Hasan",
    "Maryam",
    "Yusuf",
    "Layla",
    "Salim",
    "Amina",
  ],
  "inner-eurasian": ["Altan", "Saran", "Batu", "Oyu", "Temur", "Nara"],
};
/** Street facades for a city of 1700 to 1899, by region and decade. These are
 * full model frames, not kit bases; the urban planner passes them through. */
export function periodBuildings(setting: WorldSetting): string[] {
  const { year, culture, lon, lat } = setting;
  if (year < 1700 || year >= 1900) return [];
  if (setting.settlement !== "city" && setting.settlement !== "port") return [];
  const victorian = year >= 1840;
  if (culture === "european" && lon < -30)
    return year < 1830
      ? [
          "federal-house",
          "georgian-townhouse",
          "georgian-shop",
          "georgian-stone-house",
        ]
      : [
          "brownstone",
          "brownstone-pair",
          "italianate-row",
          "greek-revival",
          "mansard-house",
          "victorian-shop",
          "victorian-grocer",
          ...(year >= 1860
            ? ["tenement-storefront", "tenement-walkup", "cast-iron-warehouse"]
            : []),
        ];
  if (culture === "european")
    return [
      "georgian-townhouse",
      "georgian-terrace",
      "georgian-stone-house",
      "georgian-shop",
      ...(year >= 1800 ? ["regency-terrace"] : []),
      ...(victorian
        ? [
            "victorian-shop",
            "victorian-grocer",
            "mansard-house",
            "cast-iron-warehouse",
          ]
        : []),
    ];
  if (culture === "east-asian") {
    const japan = lon > 128 && lat > 30 && lat < 46;
    const korea = !japan && lon > 124 && lon < 130.5 && lat > 33.5 && lat < 39;
    if (japan)
      return [
        "machiya",
        "machiya-shop",
        ...(year >= 1870 ? ["giyofu-house"] : []),
      ];
    if (korea) return ["hanok", "chinese-shophouse"];
    return ["chinese-shophouse", "chinese-courtyard-gate"];
  }
  if (culture === "southeast-asian")
    return year >= 1820
      ? ["straits-shophouse", "straits-shophouse-mint", "colonial-bungalow"]
      : ["chinese-shophouse", "colonial-bungalow"];
  if (culture === "south-asian")
    return year >= 1800
      ? ["colonial-bungalow", "straits-shophouse-mint", "victorian-shop"]
      : ["colonial-bungalow"];
  return [];
}

/** Street facades for a city of 1900 on. The concrete block is everywhere by
 * then, but it is not the whole street anywhere: a shophouse arcade runs
 * across monsoon Asia, a balconied walk-up around the Mediterranean and in
 * Latin America, a corrugated veranda house wherever the rain is heavy. */
export function modernBuildings(setting: WorldSetting): string[] {
  const { culture, climate, settlement } = setting;
  const wet = climate === "tropical" || climate === "monsoon";
  const asia =
    culture === "southeast-asian" ||
    culture === "east-asian" ||
    culture === "south-asian";
  const walkup =
    culture === "european" ||
    culture === "north-african-west-asian" ||
    culture === "andean" ||
    culture === "mesoamerican";
  return [
    "modern-shop",
    "modern-apartment",
    ...(asia ? ["modern-shophouse"] : []),
    ...(walkup ? ["modern-walkup"] : []),
    ...(wet ? ["modern-kampung"] : []),
    ...(settlement === "city" ? ["modern-office"] : []),
  ];
}

/** Before iron: the house a region's first farmers and herders built.
 * The round daub-and-thatch house is the fallback, because some version of
 * it stood on every inhabited continent; the rest are the forms the
 * excavated record is clearest about. Inferred and illustrative. */
function prehistoricBuildings(setting: WorldSetting): string[] | undefined {
  const { year, culture, climate, architecture } = setting;
  if (year >= -800) return;
  const round = ["house-round-0", "house-round-1", "house-round-2"];
  const mudbrick = [
    "house-mudbrick-ob-0",
    "house-mudbrick-ob-1",
    "house-mudbrick-ob-2",
    "house-mudbrick-ob-3",
    "house-mudbrick-ob-4",
  ];
  if (culture === "north-african-west-asian") return mudbrick;
  if (architecture === "shelter") {
    if (culture === "australian-pacific") return;
    return culture === "inner-eurasian" ||
      climate === "tundra" ||
      climate === "boreal"
      ? ["house-tent-0", "house-tent-1"]
      : ["house-dome-0", "house-dome-1", "house-tent-0"];
  }
  switch (culture) {
    case "european":
      if (climate === "mediterranean")
        return year >= -3200
          ? ["house-aegean-0", "house-aegean-1", "house-round-stone-0"]
          : ["house-round-stone-0", ...round];
      // The long houses of the first farmers, then the round house.
      return year < -4000
        ? ["house-longhouse-0", "house-longhouse-1", "house-round-2"]
        : [...round, "house-round-stone-0"];
    case "east-asian":
      return ["house-pit-0", "house-pit-1", "house-round-2"];
    case "south-asian":
      return year >= -3300
        ? ["house-mudbrick-ob-0", "house-mudbrick-ob-2", "house-round-0"]
        : round;
    case "west-central-african":
    case "east-southern-african":
      return ["house-rondavel-0", "house-rondavel-1"];
    case "other-indigenous-american":
      return ["house-dome-0", "house-dome-1", "house-pit-0"];
    case "inner-eurasian":
      return ["house-tent-0", "house-tent-1", "house-pit-0"];
    default:
      // The place data calls every early setting mudbrick; believe it only
      // where nothing better is known.
      return architecture === "mudbrick" ? mudbrick : round;
  }
}

export function packForSetting(setting: WorldSetting): Pack {
  const early = setting.year < -3499;
  const base = packTemplates[early ? "neolithic" : "roman"];
  const architecture = setting.architecture;
  const modernCity =
    setting.year >= 1900 &&
    (setting.settlement === "city" || setting.settlement === "port");
  const period = periodBuildings(setting).map((b) => `period-${b}`);
  const prehistoric = prehistoricBuildings(setting);
  const buildings = prehistoric
    ? prehistoric
    : modernCity
      ? modernBuildings(setting)
      : architecture === "shelter"
        ? ["shelter-hide", "shelter-reed"]
        : architecture === "classical" && setting.year < 700
          ? [
              "house-roman-ob-0",
              "house-roman-ob-1",
              "house-roman-ob-2",
              "house-roman-ob-3",
            ]
          : setting.culture === "european" &&
              setting.climate === "mediterranean" &&
              setting.year >= 700 &&
              setting.year < 1800
            ? ["house-med-0", "house-med-1", "house-med-2", "house-med-3"]
            : architecture === "timber" &&
                setting.culture === "european" &&
                setting.year >= 1500 &&
                setting.year < 1800
              ? [
                  "house-early-brick-0",
                  "house-early-brick-1",
                  "house-early-timber-0",
                  "house-early-stone-0",
                  "house-early-stucco-0",
                  "house-cottage-thatch-0",
                ]
              : architecture === "timber" &&
                  setting.culture === "european" &&
                  setting.year >= 400 &&
                  setting.year < 1500
                ? [
                    "house-cottage-thatch-0",
                    "house-cottage-thatch-1",
                    "house-cottage-timber-0",
                    "house-cottage-timber-1",
                  ]
                : architecture === "timber" &&
                    // Thatch is the ordinary roof over a timber frame until early
                    // modern slate and tile reach the countryside, and stays the rule
                    // in the wet tropics after. It also has oriented recipes, so a
                    // village built from it faces four ways instead of one.
                    (setting.year < 1500 ||
                      setting.placeId === "london" ||
                      setting.climate === "monsoon" ||
                      setting.climate === "tropical")
                  ? ["house-thatch"]
                  : architecture === "classical"
                    ? packTemplates.roman.buildings
                    : architecture === "mudbrick"
                      ? packTemplates.neolithic.buildings
                      : [
                          `study-${architecture === "board" ? "board" : architecture === "courtyard" ? "courtyard" : "timber"}`,
                        ];
  const trees =
    setting.climate === "arid"
      ? ["acacia"]
      : setting.climate === "mediterranean"
        ? ["olive", "cypress", "oak"]
        : setting.climate === "boreal" || setting.climate === "tundra"
          ? ["cypress", "oak"]
          : ["hackberry", "oak"];
  const pack: Pack = {
    ...base,
    id: "atlas",
    name: setting.location,
    region: setting.location,
    date: formatHistoricalYear(setting.year),
    year: setting.year,
    subtitle: setting.location,
    characterName: setting.characterName,
    role: setting.role,
    concern: `A ${setting.role.toLowerCase()}'s day in ${setting.location}.`,
    description: `${setting.climate} ${setting.settlement}`,
    defaultSeed: "earth-2",
    anchor: { lon: setting.lon, lat: setting.lat, label: setting.location },
    geography: undefined,
    setting,
    ground: setting.climate === "arid" ? "dry" : "grass",
    road: "dirt",
    // Period facades lead; the kit base stays for civic halls and infill forms.
    buildings: period.length ? [...period, ...buildings] : buildings,
    trees,
    landscape:
      setting.settlement === "city" || setting.settlement === "port"
        ? { ...landscapes.riverTown, bankReach: 6 }
        : { ...landscapes.meadow },
    layout: setting.settlement === "city" ? "streets" : "clusters",
    buildingNames: [
      "Household",
      "Workshop",
      "Stores",
      "Lodging",
      "Meeting house",
      "Farmhouse",
    ],
    names:
      setting.terrainRevision && early
        ? base.names
        : architecture === "classical"
          ? packTemplates.roman.names
          : setting.placeId === "haiti"
            ? ["Marie", "Jean", "Rose", "Pierre", "Louise", "Joseph"]
            : (namesByCulture[setting.culture] ?? base.names),
    settlementNames: [
      setting.location,
      "Riverside settlement",
      "Upper village",
      "Roadside hamlet",
    ],
    roles: early
      ? ["Forager", "Hunter", "Toolmaker"]
      : ["Farmer", "Weaver", "Fisher", "Merchant", "Carpenter"],
    species: early ? ["lizard"] : ["sheep", "chicken"],
    greeting: setting.community
      ? `Welcome. This is a ${setting.community.toLowerCase()}.`
      : "Welcome, traveler.",
    buildingClaim: "landscape",
    entryLabel: "Enter",
    evidence: [
      {
        id: "landscape",
        title: "Procedural Earth atlas",
        statement:
          "Broad Earth geography with generated local landscapes and settlements.",
        status: "inferred",
        url: "https://www.naturalearthdata.com/",
        limitation:
          "Game-scale geography and reusable art. Local layouts are generated.",
      },
    ],
  };
  // Use existing runnable selections when the researched place maps directly; reference-only
  // definitions remain in the history inspector until their actual assets/mechanics exist.
  const historicalPlace = historyRegistry.places.find(
    (p) => p.id === setting.placeId && p.culture === setting.culture,
  );
  if (historicalPlace) {
    const resolved = resolveHistory(historyRegistry, {
      place: historicalPlace.id,
      culture: setting.culture,
      date: { year: setting.year },
    });
    const ids = (category: string) =>
      resolved.entries
        .filter(
          (e) =>
            e.status === "included" &&
            e.definition.category === category &&
            e.definition.runtimeId,
        )
        .map((e) => e.definition.runtimeId!);
    if (ids("plant").length) pack.trees = ids("plant");
    if (ids("occupation").length) pack.roles = ids("occupation");
  }
  if (setting.characterRevision) {
    const context = resolveCharacterContext(setting);
    const character = generateCharacter(
      setting,
      setting.character?.appearanceSeed ?? "earth-2",
      "player",
      34,
      setting.role,
      setting.characterName,
    );
    pack.names = Array.from({ length: 24 }, (_, i) =>
      characterName(
        setting,
        setting.character?.appearanceSeed ?? "earth-2",
        `pack-person-${i}`,
        context,
      ),
    );
    pack.roles = context.livelihoods.map((l) => l.label);
    pack.role = character.role;
    pack.startInventory = character.inventory;
    pack.currency = undefined;
    pack.trade = { give: "wood", take: "fruit", cost: 1 };
    pack.commodities = [...context.profile.allowedItems];
    pack.evidence.push(
      ...[
        context.profile,
        context.appearance,
        ...(context.names ? [context.names] : []),
      ]
        .filter((entry) => entry.note || entry.sources.length)
        .map((entry) => ({
          id: `character-${entry.id}`,
          title: entry.label,
          statement: entry.note ?? "",
          url: entry.sources[0] ?? "",
        })),
    );
    if (!context.names)
      pack.evidence.push({
        id: "character-names-unresearched",
        title: "Invented personal name",
        statement:
          "No naming tradition covers this place and date yet, so names are drawn from a shared invented syllable set.",
        url: "",
      });
  }
  if (
    setting.urbanRevision &&
    (setting.settlement === "city" || setting.settlement === "port")
  ) {
    const civic = civicProfile(setting);
    pack.evidence.push({
      id: `civic-${civic.id}`,
      title: civic.label,
      statement: civic.evidence.note,
      status: civic.evidence.status,
      url: civic.evidence.sources[0] ?? "",
      limitation: civic.evidence.note,
    });
  }
  if (setting.vegetationRevision)
    pack.trees = treeMix(setting).map(([id]) => id);
  // Tree-free ecologies still need a harmless court-art fallback. Wild density stays zero.
  if (!pack.trees.length) pack.trees = ["bush"];
  return pack;
}
