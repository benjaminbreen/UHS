import { situationSchema } from "./situation";
import {
  ecologies,
  landforms,
  populations,
  starts,
  householdForms,
  colorways,
} from "../ecology/profiles";
import { z } from "zod";
import { patterns } from "../settlements/profiles";
import { cultures } from "../history/types";
export const climates = [
  "temperate",
  "mediterranean",
  "tropical",
  "monsoon",
  "arid",
  "boreal",
  "tundra",
] as const;
export const forms = ["village", "city", "port", "farm", "camp"] as const;
export const architectures = [
  "classical",
  "timber",
  "mudbrick",
  "courtyard",
  "board",
  "shelter",
] as const;
export const waters = [
  "none",
  "river-ew",
  "river-ns",
  "coast-n",
  "coast-e",
  "coast-s",
  "coast-w",
  "lake",
  "island",
  "ocean",
] as const;
export type AtlasPlace = {
  id: string;
  name: string;
  aliases: string[];
  lon: number;
  lat: number;
  climate: (typeof climates)[number];
  relief: number;
  water: (typeof waters)[number];
  culture: (typeof cultures)[number][0];
  year: number;
  settlement: (typeof forms)[number];
  architecture: (typeof architectures)[number];
  /** Modern gazetteer population used only to size a procedural footprint. */
  population?: number;
  /** Nearest atlas coastline, in tiles, and the compass direction to it. */
  coast?: WaterNeighbour;
  /** Nearest atlas river; bearing is the direction to it, not its flow. */
  river?: WaterNeighbour;
};
export const bearings = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
export type WaterNeighbour = {
  distance: number;
  bearing: (typeof bearings)[number];
};
/** Both interpreters produce this same immutable input. No model text is executable. */
const sexSchema = z.enum(["male", "female"]);
/** What World Weaver settled about the person beyond place and trade: who
 * they are if they are someone, their people, their aim and the day's news.
 * `documented` keeps the record apart from what was filled in. */
/** Where a staged opening is set: the player's house, the nearest building of that kind, or where they stand. */
export const momentRooms = ["home", "hall", "temple", "tavern", "bath", "school", "theatre", "outside"] as const;
export const startBriefSchema = z
  .object({
    figure: z.string().min(1).max(120).optional(),
    work: z.string().min(1).max(60).optional(),
    sex: sexSchema.optional(),
    hook: z.string().min(1).max(500).optional(),
    aim: z
      .object({ text: z.string().min(1).max(240), reason: z.string().min(1).max(240), means: z.string().min(1).max(240) })
      .strict()
      .optional(),
    kin: z
      .array(z.object({ name: z.string().min(1).max(80), relation: z.enum(["parent", "partner", "child", "sibling"]), sex: sexSchema, documented: z.boolean() }).strict())
      .max(6)
      .optional(),
    figures: z
      .array(z.object({ name: z.string().min(1).max(80), role: z.string().min(1).max(100), sex: sexSchema, documented: z.boolean(),
        age: z.number().int().min(1).max(110).optional(),
        /** What they are to the player, as it reads after "your": "husband", "oldest friend". */
        tie: z.string().min(1).max(60).optional(),
        /** Who they are and what they want today, in a sentence or two. */
        about: z.string().min(1).max(300).optional() }).strict())
      .max(6)
      .optional(),
    tidings: z
      .array(z.object({ text: z.string().min(1).max(300), documented: z.boolean() }).strict())
      .max(3)
      .optional(),
    /** The opening staged: the room, who of `kin` and `figures` is there, and what they are all doing. */
    moment: z
      .object({ where: z.enum(momentRooms), with: z.array(z.string().min(1).max(80)).max(6), doing: z.string().min(1).max(80),
        /** The hour it opens, when the story is not a morning's. */
        hour: z.number().int().min(5).max(21).optional() })
      .strict()
      .optional(),
  })
  .strict();
export type StartBrief = z.infer<typeof startBriefSchema>;
export const settingSchema = z
  .object({
    version: z.literal(2),
    situation: situationSchema.optional(),
    brief: startBriefSchema.optional(),
    /** Where under the ground the player starts, if not in the open. */
    below: z.enum(["cave", "sewer", "mine", "ship", "fair"]).optional(),
    /** Aboard which hull, by id or kind, when the start is at sea. */
    ship: z.string().max(40).optional(),
    // 1 is the scoped hand-written kits; 2 adds the ported naming
    // traditions and the capability-gated workforce.
    characterRevision: z.union([z.literal(1), z.literal(2)]).optional(),
    worksiteRevision: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)]).optional(),
    friendshipRevision: z.literal(1).optional(),
    employmentRevision: z.literal(1).optional(),
    beliefRevision: z.literal(1).optional(),
    namingRevision: z.literal(1).optional(),
    lifeStoryRevision: z.literal(1).optional(),
    economyRevision: z.literal(1).optional(),
    characterCommunity: z
      .enum([
        "local",
        "english-colonial",
        "indigenous-local",
        "african-diaspora",
        "us-anglo",
        "us-latino",
        "us-chinese",
      ])
      .optional(),
    // Pins the integrated geography rules without changing old generation inputs.
    geographyRevision: z.literal(1).optional(),
    // New urban footprints/layouts are opt-in; old manifests retain their
    // geometry. 1 is the first fixed-lattice composition; 2 is the dated,
    // regional block grammar.
    urbanRevision: z.union([z.literal(1), z.literal(2)]).optional(),
    // How a town stands on its ground: houses in their own plots, or rows on
    // the street. Absent, `settlementLayout()` decides from place and date.
    settlementLayout: z.enum(["plots", "rows"]).optional(),
    roadRevision: z.literal(1).optional(),
    // Premodern streets are earth unless the place and date paved them.
    streetRevision: z.literal(1).optional(),
    // Towns straighten the contours under them and wall their steps.
    terraceRevision: z.literal(1).optional(),
    placementRevision: z.union([z.literal(0), z.literal(1)]).optional(),
    vegetationRevision: z
      .union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
        z.literal(6),
        z.literal(7),
        z.literal(8),
        z.literal(9),
      ])
      .optional(),
    ecologyRevision: z.union([z.literal(1), z.literal(2)]).optional(),
    hydrologyRevision: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    playableMap: z.object({ id: z.string(), name: z.string().optional(), size: z.union([z.literal(304), z.literal(384), z.literal(512)]), exits: z.array(z.object({ id: z.string(), to: z.string(), bearing: z.string(), mode: z.string(), name: z.string().optional(), settlement: z.string().optional(), waterways: z.array(z.object({ at: z.number(), width: z.number(), flow: z.number() })).optional(), peer: z.object({ side: z.enum(["N","E","S","W"]), start: z.number(), end: z.number() }).optional(), neighbor: z.object({ lon: z.number(), lat: z.number(), ecology: z.enum(ecologies), colorway: z.enum(colorways).optional(), relief: z.number(), climate: z.enum(climates), water: z.enum(waters), landform: z.enum(landforms), size: z.number(), geographyMode: z.enum(["earth","configured"]) }).optional(), seam: z.object({side:z.enum(["N","E","S","W"]), start:z.number(),end:z.number(),water:z.array(z.number()),sea:z.array(z.boolean()),height:z.array(z.number()),road:z.boolean(),roadAt:z.number(),band:z.number().optional(),walkable:z.number()}).optional() })).default([]) }).strict().optional(),
    geographyMode: z.enum(["earth", "configured"]).optional(),
    terrainRevision: z.union([z.literal(1), z.literal(2)]).optional(),
    environment: z
      .object({
        ecology: z.enum(ecologies),
        colorway: z.enum(colorways).optional(),
        vegetation: z.enum(["savanna", "steppe", "alpine"]).optional(),
        landform: z.enum(landforms),
        population: z.enum(populations),
        start: z.enum(starts),
        household: z.enum(householdForms).default("mixed"),
      })
      .strict()
      .optional(),
    placeId: z.string().min(1).max(100),
    location: z.string().min(1).max(120),
    lon: z.number().min(-180).max(180),
    lat: z.number().min(-85).max(85),
    year: z.number().int().min(-1000000).max(10000),
    culture: z.enum(cultures.map(([id]) => id)),
    climate: z.enum(climates),
    relief: z.number().min(0).max(1),
    water: z.enum(waters),
    settlement: z.enum(forms),
    settlementPattern: z.enum(patterns).optional(),
    /** Gazetteer population at this date; sizes the footprint, nothing else. */
    population: z.number().int().min(0).optional(),
    architecture: z.enum(architectures),
    role: z.string().min(1).max(100),
    characterName: z.string().min(1).max(80),
    character: z
      .object({
        appearanceSeed: z.string().max(100).optional(),
        hunger: z.number().int().min(0).max(100),
        fatigue: z.number().int().min(0).max(100),
        age: z.number().int().min(18).max(90).optional(),
      })
      .strict()
      .optional(),
    community: z.string().max(160),
    season: z.enum(["spring", "summer", "autumn", "winter"]),
  })
  .strict()
  .refine((s) => s.terrainRevision !== 2 || !!s.environment, {
    message: "Terrain revision 2 requires environment settings",
    path: ["environment"],
  })
  .refine(
    (s) => !s.geographyRevision || (s.terrainRevision === 2 && !!s.environment),
    {
      message:
        "Integrated geography requires terrain revision 2 and environment settings",
      path: ["geographyRevision"],
    },
  );
export type WorldSetting = z.infer<typeof settingSchema>;
