import {
  ecologies,
  landforms,
  populations,
  starts,
  householdForms,
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
};
/** Both interpreters produce this same immutable input. No model text is executable. */
export const settingSchema = z
  .object({
    version: z.literal(2),
    // Pins the integrated geography rules without changing old generation inputs.
    geographyRevision: z.literal(1).optional(),
    // New urban footprints/layouts are opt-in; old manifests retain their geometry.
    urbanRevision: z.literal(1).optional(),
    roadRevision: z.literal(1).optional(),
    geographyMode: z.enum(["earth", "configured"]).optional(),
    terrainRevision: z.union([z.literal(1), z.literal(2)]).optional(),
    environment: z
      .object({
        ecology: z.enum(ecologies),
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
    architecture: z.enum(architectures),
    role: z.string().min(1).max(100),
    characterName: z.string().min(1).max(80),
    character: z
      .object({
        hunger: z.number().int().min(0).max(100),
        fatigue: z.number().int().min(0).max(100),
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
