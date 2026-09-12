import {
  hairStyles,
  eyeSizes,
  eyeShapes,
  eyeSpacings,
  browShapes,
  noseShapes,
  mouthShapes,
  chinShapes,
  hairTextures,
  hairlines,
  faceDetails,
  beardStyles,
  garments,
  headwear,
  headShapes,
  jawShapes,
  bodyShapes,
  postures,
  sleeveStyles,
  hemStyles,
  wearSlots,
} from "../core/character";
import { z } from "zod";
import { settingSchema } from "../content/geography/types";
const item = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/);
const inventory = z.record(item, z.number().int().min(0).max(1000000));
const itemDef = z
  .object({
    id: item,
    name: z.string().max(40),
    sprite: z.string().max(60),
    value: z.number().int().min(0).max(1000),
    edible: z.number().int().optional(),
    health: z.number().int().optional(),
    description: z.string().max(160).optional(),
    flammable: z.boolean().optional(),
    floats: z.boolean().optional(),
  })
  .strict();
const stat = z.number().int().min(0).max(100);
const stats = z
  .object({
    strength: stat,
    agility: stat,
    endurance: stat.optional(),
    wit: stat,
    openness: stat,
    conscientiousness: stat,
    extraversion: stat,
    agreeableness: stat,
    neuroticism: stat,
  })
  .strict()
  // Endurance postdates the earliest saves; those load with the mean of the
  // two stats it sits between rather than a fresh roll, which would move.
  .transform((s) => ({
    ...s,
    endurance: s.endurance ?? Math.round((s.strength + s.agility) / 2),
  }));
const intent = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("attempt"),
      check: z.enum(["strength", "agility", "wit"]),
      difficulty: z.number().min(1).max(5),
      success: z.string().max(600),
      failure: z.string().max(600),
      minutes: z.number().min(1).max(120).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("forage"),
      item: item.or(z.literal("")).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("invent"),
      item: z
        .object({
          name: z.string().min(1).max(40),
          description: z.string().max(160),
          value: z.number().min(0).max(1000),
          edible: z.number().min(0).max(100).optional(),
          health: z.number().min(-100).max(100).optional(),
          flammable: z.boolean().optional(),
          floats: z.boolean().optional(),
          look: z.enum([
            "rock",
            "plant",
            "food",
            "wood",
            "cloth",
            "tool",
            "vessel",
            "creature",
          ]),
        })
        .strict(),
      consumes: z
        .array(
          z
            .object({ item, quantity: z.number().int().min(1).max(99) })
            .strict(),
        )
        .max(6)
        .optional(),
    })
    .strict(),
  z
    .object({ type: z.literal("pass"), minutes: z.number().min(1).max(1440) })
    .strict(),
  z
    .object({
      type: z.literal("travel"),
      direction: z.enum(["north", "south", "east", "west"]),
    })
    .strict(),
  z
    .object({
      type: z.literal("regard"),
      delta: z.number().min(-3).max(3),
      reason: z.string().max(120),
    })
    .strict(),
  z
    .object({ type: z.literal("fact"), text: z.string().min(1).max(160) })
    .strict(),
]);
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
  face: z
    .object({
      revision: z.literal(1),
      eyeSize: z.enum(eyeSizes),
      eyeShape: z.enum(eyeShapes),
      eyeSpacing: z.enum(eyeSpacings),
      brows: z.enum(browShapes),
      nose: z.enum(noseShapes),
      mouth: z.enum(mouthShapes),
      chin: z.enum(chinShapes),
      hairTexture: z.enum(hairTextures),
      hairline: z.enum(hairlines),
      detail: z.enum(faceDetails),
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
  stats: stats.optional(),
  health: z.number().min(0).max(100).optional(),
  origin: z
    .object({
      revision: z.literal(1),
      profile: z.string(),
      community: z.string(),
      nameKit: z.string().optional(),
      nameTradition: z.string().optional(),
      nameRegion: z.string().optional(),
      sex: z.enum(["unspecified", "male", "female"]).optional(),
      nameFormat: z.string().optional(),
      nameFamilies: z.array(z.string()).optional(),
      livelihood: z.string(),
      notes: z.array(z.string()),
    })
    .optional(),
  appearance: characterAppearanceSchema.optional(),
  worn: z.partialRecord(z.enum(wearSlots), z.string().max(60)).optional(),
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
  offRoutine: z.boolean().optional(),
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
      traverse: z.boolean().optional(),
      jump: z.enum(["short", "long"]).optional(),
      run: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("throw"),
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
      type: z.literal("pass"),
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
  z.object({ type: z.literal("wear"), item }).strict(),
  z.object({ type: z.literal("remove"), slot: z.enum(wearSlots) }).strict(),
  z
    .object({ type: z.literal("narrate"), intents: z.array(intent).max(6) })
    .strict(),
]);
/** What the narrator model may return. Its command is one of the ordinary
 * player commands; intents go through the same narrate path as the UI. */
export const narratorReplySchema = z
  .object({
    narration: z.string().min(1).max(1200),
    intents: z.array(intent).max(6),
    command: z
      .discriminatedUnion("type", commandSchema.options.slice(0, -1) as never)
      .optional(),
  })
  .strict();
export type NarratorReply = z.infer<typeof narratorReplySchema>;
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
  catalog: z.record(item, itemDef).optional(),
  narration: z
    .array(
      z
        .object({
          clock: z.number(),
          input: z.string().max(600),
          text: z.string().max(2400),
        })
        .strict(),
    )
    .max(200)
    .optional(),
  ledger: z.array(z.string().max(160)).max(12).optional(),
});
