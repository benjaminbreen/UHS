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
export function packForSetting(setting: WorldSetting): Pack {
  const early = setting.year < -3499;
  const base = packTemplates[early ? "neolithic" : "roman"];
  const architecture = setting.architecture;
  const buildings =
    architecture === "shelter"
      ? ["shelter-hide", "shelter-reed"]
      : architecture === "timber" &&
          (setting.placeId === "london" ||
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
    buildings,
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
      ].map((entry) => ({
        id: `character-${entry.id}`,
        title: entry.label,
        statement: entry.evidence.claim,
        status: entry.evidence.status,
        url: entry.evidence.sources[0] ?? "",
        limitation: entry.evidence.limitation,
      })),
    );
    if (!context.names)
      pack.evidence.push({
        id: "character-names-unresearched",
        title: "Invented personal name",
        statement:
          "No researched naming tradition is available for this context.",
        status: "fictional",
        url: "",
        limitation:
          "Personal names use a shared fictional syllable set, not an attested local naming tradition or a recovered historical language.",
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
