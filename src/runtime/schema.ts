import {
  hairStyles,
  beardStyles,
  garments,
  headwear,
  headShapes,
  jawShapes,
  bodyShapes,
  postures,
  sleeveStyles,
  hemStyles,
} from "../core/character";
import { z } from "zod";
import { settingSchema } from "../content/geography/types";
const item = z.enum([
  "fruit",
  "berries",
  "reeds",
  "fodder",
  "bread",
  "grain",
  "water",
  "coin",
  "obsidian",
  "wool",
  "wood",
  "fish",
  "tool",
  "flax",
  "lizard",
]);
const inventory = z.partialRecord(item, z.number().int().min(0).max(1000000));
const point = z.object({
  x: z.number().int().min(-1000000).max(1000000),
  y: z.number().int().min(-1000000).max(1000000),
});
const pos = point.extend({ space: z.string().max(100) });
const pixelColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const characterAppearanceSchema = z.object({
  physique: z
    .object({
      strength: z.number().int().min(0).max(100),
      sex: z.enum(["unspecified", "male", "female"]),
    })
    .optional(),
  head: z.enum(headShapes).optional(),
  jaw: z.enum(jawShapes).optional(),
  bodyShape: z.enum(bodyShapes).optional(),
  posture: z.enum(postures).optional(),
  height: z.union([
    z.literal(-2),
    z.literal(-1),
    z.literal(0),
    z.literal(1),
    z.literal(2),
  ]),
  build: z.union([z.literal(-1), z.literal(0), z.literal(1), z.literal(2)]),
  skin: pixelColor,
  hairColor: pixelColor,
  hair: z.enum(hairStyles),
  beard: z.enum(beardStyles),
  wearing: z.object({
    sleeves: z.enum(sleeveStyles).optional(),
    hem: z.enum(hemStyles).optional(),
    shoulderCloth: z.boolean().optional(),
    garment: z.enum(garments),
    color: pixelColor,
    lowerColor: pixelColor,
    trim: pixelColor,
    cloak: z.boolean(),
    cloakColor: pixelColor,
    headwear: z.enum(headwear),
    necklace: z.boolean(),
    earrings: z.boolean(),
  }),
});
const actor = z.object({
  appearance: characterAppearanceSchema.optional(),
  age: z.number().int().min(0).max(120).optional(),
  householdId: z.string().optional(),
  relations: z
    .array(
      z.object({
        other: z.string(),
        kind: z.enum(["partner", "parent", "child", "co-resident"]),
      }),
    )
    .optional(),
  knownResources: z.array(z.string()).optional(),
  task: z.object({ target: z.string(), until: z.number() }).optional(),
  id: z.string(),
  name: z.string(),
  role: z.string(),
  kind: z.enum(["human", "sheep", "goat", "lizard", "chicken"]),
  pos,
  home: pos,
  work: pos,
  sprite: z.string(),
  inventory,
  activity: z.string(),
  fatigue: z.number().min(0).max(100),
  hunger: z.number().min(0).max(100),
  trust: z.number(),
  owner: z.string().optional(),
  follows: z.string().optional(),
  consentUntil: z.number().optional(),
  memories: z.array(z.string()),
  held: z.string().optional(),
  direction: z.number().int().min(0).max(3),
  lastUpdated: z.number().int().optional(),
  goal: pos.optional(),
});
const object = z.object({
  resource: z
    .object({
      item,
      capacity: z.number(),
      regrowSeconds: z.number(),
      seasons: z.array(z.string()),
      readyAt: z.number(),
    })
    .optional(),
  prop: z.string().optional(),
  carriedBy: z.literal("player").optional(),
  broken: z.boolean().optional(),
  damage: z.number().int().min(0).max(3).optional(),
  id: z.string(),
  name: z.string(),
  kind: z.enum([
    "container",
    "gate",
    "well",
    "fire",
    "crop",
    "tree",
    "exit",
    "bed",
  ]),
  pos,
  sprite: z.string(),
  inventory,
  owner: z.string().optional(),
  open: z.boolean().optional(),
  depleted: z.boolean().optional(),
  claim: z.string().optional(),
});
const event = z.object({
  id: z.number().int(),
  time: z.number().int(),
  text: z.string(),
  kind: z.enum(["action", "social", "world", "system"]),
  pos: pos.optional(),
});
export const commandSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("move"),
      dx: z.number().int().min(-1).max(1),
      dy: z.number().int().min(-1).max(1),
    })
    .strict(),
  z
    .object({
      type: z.literal("wait"),
      seconds: z.number().int().min(1).max(3600),
    })
    .strict(),
  z
    .object({
      type: z.literal("interact"),
      target: z.string().max(100),
      action: z.enum([
        "talk",
        "enter",
        "exit",
        "open",
        "close",
        "drink",
        "store",
        "harvest",
        "capture",
        "herd",
        "follow",
        "take",
        "rest",
        "return",
        "pickup",
        "drop",
        "strike",
        "look",
      ]),
    })
    .strict(),
  z
    .object({
      type: z.literal("trade"),
      target: z.string(),
      give: item,
      giveQuantity: z.number().int().positive(),
      take: item,
      takeQuantity: z.number().int().positive(),
    })
    .strict(),
  z.object({ type: z.literal("use"), item }).strict(),
]);
const request = z.object({
  actionId: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
  expectedRevision: z.number().int(),
  command: commandSchema,
});
const result = z.object({
  actionId: z.string(),
  revision: z.number().int(),
  status: z.enum(["completed", "interrupted", "rejected"]),
  elapsedSeconds: z.number().int(),
  events: z.array(event),
  reason: z.string().optional(),
});
export const snapshotSchema = z.object({
  households: z
    .array(
      z.object({
        id: z.string(),
        members: z.array(z.string()),
        residence: z.string().optional(),
        home: pos,
        storeId: z.string(),
      }),
    )
    .optional(),
  manifest: z.discriminatedUnion("generator", [
    z
      .object({
        seed: z.string().min(1).max(100),
        pack: z.enum(["roman", "neolithic"]),
        schema: z.literal(1),
        simulation: z.literal(1),
        generator: z.literal(1),
        content: z.union([z.literal(1), z.literal(2)]),
        atlas: z.literal(1),
      })
      .strict(),
    z
      .object({
        seed: z.string().min(1).max(100),
        pack: z.literal("atlas"),
        schema: z.literal(2),
        simulation: z.literal(1),
        generator: z.literal(2),
        content: z.union([z.literal(1), z.literal(2)]),
        atlas: z.literal(2),
        setting: settingSchema,
      })
      .strict(),
    z
      .object({
        seed: z.string().min(1).max(100),
        pack: z.literal("atlas"),
        schema: z.literal(2),
        simulation: z.literal(2),
        generator: z.literal(3),
        content: z.union([z.literal(1), z.literal(2)]),
        atlas: z.literal(2),
        setting: settingSchema,
      })
      .strict(),
  ]),
  clock: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative(),
  randomCounter: z.number().int().nonnegative(),
  player: actor,
  actors: z.array(actor).max(50000),
  objects: z.array(object).max(10000),
  events: z.array(event).max(1000),
  notes: z
    .array(
      z.object({
        id: z.number(),
        text: z.string().max(4000),
        time: z.number(),
        evidence: z.string().optional(),
      }),
    )
    .max(1000),
  visited: z.array(z.string()).max(50000),
  receipts: z.record(z.string(), z.object({ payload: z.string(), result })),
  log: z.array(request).max(100000),
  permissions: z.record(z.string(), z.number()),
});
