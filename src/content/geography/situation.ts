import { z } from "zod";
import type { AtlasPlace, WorldSetting } from "./types";

export const situationSchema = z
  .object({
    landform: z.enum(["local", "islet", "open-ocean"]).default("local"),
    width: z.number().int().min(4).max(120).default(10),
    depth: z.number().int().min(4).max(120).default(5),
    support: z.enum(["land", "raft", "boat", "swimming"]).default("land"),
    camp: z
      .enum(["none", "military", "expedition", "pastoral", "gathering"])
      .default("none"),
    people: z.number().int().min(0).max(48).default(0),
    palms: z.number().int().min(0).max(6).default(0),
  })
  .strict();
export type Situation = z.infer<typeof situationSchema>;

export function situationFromPrompt(
  input: string,
): { situation: Situation; place: AtlasPlace; role: string } | undefined {
  const q = input.toLowerCase();
  const island =
    /(?:tiny|small|desert|deserted|uninhabited) island|\bislet\b/.test(q);
  const afloat =
    /\b(?:adrift|floating|downed|shipwreck|castaway|raft|lifeboat|open ocean|swimming)\b/.test(
      q,
    ) && !island;
  const camp = /(?:military|roman|legionary|army|marching) camp/.test(q)
    ? "military"
    : /(?:base camp|expedition camp|everest)/.test(q)
      ? "expedition"
      : /(?:pastoral|herder|nomad|caravan) (?:camp|encampment|halt)/.test(q)
        ? "pastoral"
        : /(?:tribal|forest|seasonal) gathering|gathering in (?:the )?forest/.test(
              q,
            )
          ? "gathering"
          : "none";
  if (!island && !afloat && camp === "none") return;
  const dimensions = /\b(\d{1,3})\s*[x×]\s*(\d{1,3})\b/.exec(q);
  const situation = situationSchema.parse({
    landform: island ? "islet" : afloat ? "open-ocean" : "local",
    ...(dimensions ? { width: +dimensions[1], depth: +dimensions[2] } : {}),
    support: afloat
      ? /\bswimming\b/.test(q)
        ? "swimming"
        : /\b(?:boat|lifeboat)\b/.test(q)
          ? "boat"
          : "raft"
      : "land",
    camp,
    people: camp === "none" ? 0 : camp === "military" ? 16 : 8,
    palms: island && !/no (?:palm|tree)|treeless|bare rock/.test(q) ? 1 : 0,
  });
  const alpine =
    camp === "expedition" && /everest|mountain|alpine|himalaya|polar/.test(q);
  const roman = /roman|legionary/.test(q);
  const wartime = /ww2|world war (?:ii|2|two)/.test(q);
  return {
    situation,
    role: afloat
      ? /pilot|ww2|world war/.test(q)
        ? "Pilot"
        : "Castaway"
      : camp === "military"
        ? roman
          ? "Legionary"
          : "Soldier"
        : alpine
          ? "Mountaineer"
          : camp === "pastoral"
            ? "Shepherd"
            : camp === "gathering"
              ? "Gatherer"
              : "Castaway",
    place: {
      id: "custom",
      aliases: [],
      name: island
        ? "Tiny desert island"
        : afloat
          ? "North Atlantic"
          : alpine
            ? "Everest base camp"
            : camp === "military"
              ? roman
                ? "Roman military camp"
                : "Military camp"
              : camp === "pastoral"
                ? "Pastoral camp"
                : camp === "expedition"
                  ? "Expedition camp"
                  : "Forest gathering",
      lon: island
        ? 55.5
        : afloat
          ? -30
          : alpine
            ? 86.85
            : camp === "military"
              ? 12.5
              : 10,
      lat: island ? -4.6 : afloat ? 48 : alpine ? 28 : 45,
      year:
        wartime || (afloat && /pilot/.test(q))
          ? 1944
          : alpine
            ? 1953
            : roman
              ? 100
              : camp === "gathering"
                ? -1999
                : 2026,
      climate: island ? "tropical" : alpine ? "tundra" : "temperate",
      relief: alpine ? 0.9 : 0.05,
      water: island ? "island" : afloat ? "ocean" : "none",
      culture: alpine ? "south-asian" : island ? "southeast-asian" : "european",
      settlement: "camp",
      architecture: "shelter",
    },
  };
}

export function applySituation(
  setting: WorldSetting,
  situation: Situation,
): WorldSetting {
  if (situation.landform === "open-ocean" && situation.support === "land")
    throw Error("An open-ocean start needs a raft, boat or swimming support.");
  if (situation.camp !== "none" && situation.landform !== "local")
    throw Error(
      "Place camps on local land; a tiny island or open-ocean start cannot contain a camp.",
    );
  if (situation.support !== "land" && situation.landform !== "open-ocean")
    throw Error("A floating start needs open-ocean terrain.");
  const alpine =
    situation.camp === "expedition" &&
    (setting.relief > 0.6 || /everest|mountain|polar/i.test(setting.location));
  return {
    ...setting,
    situation,
    geographyMode: "configured",
    terrainRevision: 2,
    settlement: "camp",
    architecture: "shelter",
    water:
      situation.landform === "islet"
        ? "island"
        : situation.landform === "open-ocean"
          ? "ocean"
          : "none",
    relief: alpine ? 0.9 : situation.landform === "local" ? 0.15 : 0,
    ...(alpine
      ? { climate: "tundra" as const, season: "spring" as const }
      : {}),
    environment: {
      ecology: alpine
        ? "tundra"
        : situation.camp === "gathering"
          ? "temperate-woodland"
          : situation.landform === "islet"
            ? "dry-scrub"
            : "grassland",
      ...(alpine
        ? { colorway: "alpine" as const, vegetation: "alpine" as const }
        : {}),
      landform: alpine ? "ridge" : "plain",
      population: situation.camp === "none" ? "none" : "sparse",
      start: situation.camp === "none" ? "wanderer" : "resident",
      household: "shared",
    },
  };
}
