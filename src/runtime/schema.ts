import { faunaStates } from "../core/fauna";
import { treatments } from "../content/health/infections";
import { faunaTiers } from "../core/combat";
import { skillIds } from "../core/skills";
import { techniqueIds } from "../core/techniques";
import {
  hairStyles,
  eyeSizes,
  eyeShapes,
  eyelidFolds,
  eyeSpacings,
  eyeAlignments,
  browShapes,
  browConnections,
  noseShapes,
  mouthShapes,
  chinShapes,
  hairTextures,
  hairlines,
  faceDetails,
  noseBridges,
  earOrnaments,
  noseOrnaments,
  faceMarks,
  injuryScarKinds,
  markStyles,
  ornamentMetals,
  beardStyles,
  garments,
  headwear,
  leggings,
  footwear,
  motifs,
  eyewear,
  aprons,
  bags,
  wristwear,
  neckwear,
  trimPatterns,
  hairOrnaments,
  hatTrims,
  waistcoats,
  shawls,
  hoods,
  sidearms,
  neckStyles,
  headShapes,
  jawShapes,
  headSizes,
  bodyShapes,
  postures,
  sleeveStyles,
  hemStyles,
  wearSlots,
} from "../core/character";
import { materials } from "../content/characters/wardrobe/cloth";
import { z } from "zod";
import { settingSchema } from "../content/geography/types";
// A garment's cloth rides after `~` (see clothId): `garment-dress~wool.bleached.0`.
const item = z.string().regex(/^[a-z][a-z0-9-]{0,39}(~[a-z0-9.-]{1,30})?$/);
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
      type: z.literal("climb"),
      target: z.string(),
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
  z
    .object({
      type: z.literal("converse"),
      with: z.string().max(100),
      said: z.string().max(120),
      delta: z.number().min(-3).max(2),
      trespass: z.enum(["warned", "refused", "leaving"]).optional(),
      leave: z.enum(["home", "friend", "authority", "away"]).optional(),
      ask: z.enum(["made", "accepted", "declined"]).optional(),
      favour: z.object({ kind: z.enum(["bring", "talk-to", "go-to", "help"]), target: z.string().max(60), what: z.string().max(100) }).strict().optional(),
      callIn: z.enum(["work", "lend", "speak"]).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("receive"),
      from: z.string().max(100),
      item: z
        .object({
          name: z.string().min(1).max(40),
          description: z.string().max(160),
          value: z.number().min(0).max(3),
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
    })
    .strict(),
]);
const point = z.object({
  x: z.number().int().min(-1000000).max(1000000),
  y: z.number().int().min(-1000000).max(1000000),
});
const pos = point.extend({ space: z.string().max(100) });
const purchase = z.object({
  good: z.string().max(100), from: z.string().max(100),
  seller: z.string().max(100).optional(), product: z.string().max(100).optional(),
});
const pixelColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const characterAppearanceSchema = z.object({
  physique: z
    .object({
      strength: z.number().int().min(0).max(100),
      sex: z.enum(["unspecified", "male", "female"]),
      mass: z.number().min(0).max(100).optional(),
    })
    .optional(),
  face: z
    .object({
      revision: z.literal(1),
      eyeSize: z.enum(eyeSizes),
      eyeShape: z.enum(eyeShapes),
      eyelid: z.enum(eyelidFolds).optional(),
      epicanthus: z.boolean().optional(),
      eyeSpacing: z.enum(eyeSpacings),
      brows: z.enum(browShapes),
      nose: z.enum(noseShapes),
      noseBridge: z.enum(noseBridges).optional(),
      mouth: z.enum(mouthShapes),
      chin: z.enum(chinShapes),
      hairTexture: z.enum(hairTextures),
      hairline: z.enum(hairlines),
      detail: z.enum(faceDetails),
    })
    .optional(),
  injuryScar: z.object({ kind: z.enum(injuryScarKinds), side: z.union([z.literal(-1), z.literal(1)]) }).optional(),
  eyeAlignment: z.enum(eyeAlignments).optional(),
  browConnection: z.enum(browConnections).optional(),
  eyeDetail: z.object({ irisSize: z.enum(["default", "large"]), pupilSize: z.enum(["default", "large"]), lowerLashes: z.boolean() }).optional(),
  adornment: z
    .object({
      ears: z.enum(earOrnaments).optional(),
      nose: z.enum(noseOrnaments).optional(),
      marks: z.enum(faceMarks).optional(),
      markStyle: z.enum(markStyles).optional(),
      markColor: pixelColor.optional(),
      metal: z.enum(ornamentMetals).optional(),
    })
    .optional(),
  head: z.enum(headShapes).optional(),
  jaw: z.enum(jawShapes).optional(),
  headSize: z.enum(headSizes).optional(),
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
    cut: z.enum(["straight", "fitted", "full"]).optional(),
    front: z.enum(["closed", "open", "cross"]).optional(),
    garment: z.enum(garments),
    color: pixelColor,
    lowerColor: pixelColor,
    headColor: pixelColor.optional(),
    innerColor: pixelColor.optional(),
    trim: pixelColor,
    cloak: z.boolean(),
    mantle: z.boolean().optional(),
    cloakColor: pixelColor,
    headwear: z.enum(headwear),
    // Optional: saves written before legs and feet had slots.
    leggings: z.enum(leggings).optional(),
    footwear: z.enum(footwear).optional(),
    motif: z.enum(motifs).optional(),
    necklace: z.boolean(),
    neckStyle: z.enum(neckStyles).optional(),
    eyewear: z.enum(eyewear).optional(),
    earrings: z.boolean(),
    // Optional: saves written before cloth carried a material.
    material: z.enum(materials).optional(),
    quality: z.number().int().min(-1).max(3).optional(),
    apron: z.enum(aprons).optional(),
    bag: z.enum(bags).optional(),
    wrist: z.enum(wristwear).optional(),
    neckwear: z.enum(neckwear).optional(),
    trimPattern: z.enum(trimPatterns).optional(),
    hairOrnament: z.enum(hairOrnaments).optional(),
    hatTrim: z.enum(hatTrims).optional(),
    waistcoat: z.enum(waistcoats).optional(),
    shawl: z.enum(shawls).optional(),
    hood: z.enum(hoods).optional(),
    sidearm: z.enum(sidearms).optional(),
  }),
});
const actor = z.object({
  stats: stats.optional(),
  health: z.number().min(0).max(100).optional(),
  dead: z.string().optional(),
  skills: z.partialRecord(z.enum(skillIds), z.number()).optional(),
  techniques: z.array(z.enum(techniqueIds)).optional(),
  helped: z.partialRecord(z.enum(skillIds), z.number()).optional(),
  taught: z.array(z.enum(skillIds)).optional(),
  injury: z.object({ name: z.string(), until: z.number(), open: z.boolean().optional(), since: z.number().optional(), cleanUntil: z.number().optional() }).optional(),
  immune: z.record(z.string().max(40), z.number()).optional(),
  preparedFoodUntil: z.number().optional(),
  medicalStock: z.object({ antibiotic: z.number().int().nonnegative(), rehydration: z.number().int().nonnegative() }).optional(),
  identity: z.object({
    seed: z.string(),
    setting: settingSchema.optional(),
    concern: z.string(),
    household: z.object({
      size: z.number().int().nonnegative(),
      people: z.array(z.object({ id: z.string(), name: z.string(), age: z.number().optional() })),
    }).optional(),
  }).optional(),
  origin: z
    .object({
      revision: z.literal(1),
      profile: z.string(),
      community: z.string(),
      nameKit: z.string().optional(),
      nameTradition: z.string().optional(),
      nameRegion: z.string().optional(),
      sex: z.enum(["unspecified", "male", "female"]).optional(),
      standing: z.enum(["free", "unfree"]).optional(),
      /** The title as drawn: a belief-driven office resolves per person. */
      roleLabel: z.string().optional(),
      specialty: z.string().max(80).optional(),
      nameFormat: z.string().optional(),
      nameFamilies: z.array(z.string()).optional(),
      namePersonal: z.string().optional(),
      nameParentPersonal: z.string().optional(),
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
        kind: z.enum(["partner", "parent", "child", "co-resident", "servant", "apprentice", "master", "friend"]),
        reciprocal: z.enum(["partner", "parent", "child", "co-resident", "servant", "apprentice", "master", "friend"]).optional(),
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
  hungerDebt: z.number().nonnegative().optional(),
  encounterAfter: z.number().optional(),
  fatigue: z.number().min(0).max(100),
  hunger: z.number().min(0).max(100),
  trust: z.number(),
  wronged: z.number().optional(),
  shuns: z.number().optional(),
  owes: z.boolean().optional(),
  stocked: z.number().optional(),
  shop: z.object({ day: z.number().int(), stock: z.record(item, z.number().int().nonnegative()), purse: z.number().int().nonnegative() }).strict().optional(),
  word: z.array(z.object({ act: z.string().max(200), object: z.string().max(80).optional(), victim: z.string().max(100).optional(), tone: z.number(), at: z.number(), hops: z.number(), from: z.string().optional(), about: z.string().optional() }).strict()).max(8).optional(),
  owner: z.string().optional(),
  follows: z.string().optional(),
  consentUntil: z.number().optional(),
  memories: z.array(z.string()),
  held: z.string().optional(),
  heldItem: z.string().max(64).optional(),
  torchOut: z.number().optional(),
  perch: z
    .object({ on: z.string(), label: z.string(), rise: z.number(), at: point.optional(), drop: z.number().nonnegative().optional() })
    .optional(),
  direction: z.number().int().min(0).max(3),
  facing: z.number().int().min(0).max(7).optional(),
  offRoutine: z.boolean().optional(),
  terror: z.object({ until: z.number(), place: z.string(), fight: z.boolean(), staggered: z.number().optional(), strikeAfter: z.number().optional(), cause: z.enum(["assault", "anger"]).optional() }).optional(),
  lastUpdated: z.number().int().optional(),
  goal: pos.optional(),
  tends: z.object({ herd: z.string(), seat: z.number() }).optional(),
  wayfarer: z.object({ until: z.number() }).optional(),
});
const object = z.object({
  resource: z
    .object({
      item,
      capacity: z.number(),
      regrowSeconds: z.number(),
      seasons: z.array(z.string()),
      readyAt: z.number(),
      strain: z.number().optional(),
      takenAt: z.number().optional(),
    })
    .optional(),
  prop: z.string().optional(),
  carriedBy: z.literal("player").optional(),
  broken: z.boolean().optional(),
  submerged: z.boolean().optional(),
  away: z.boolean().optional(),
  damage: z.number().int().min(0).max(3).optional(),
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  placeId: z.string().optional(),
  knocked: z.number().optional(),
  kind: z.enum([
    "container",
    "gate",
    "door",
    "well",
    "fire",
    "crop",
    "tree",
    "exit",
    "bed",
    "monument",
    "item",
  ]),
  pos,
  sprite: z.string(),
  inventory,
  item: item.optional(),
  owner: z.string().optional(),
  open: z.boolean().optional(),
  depleted: z.boolean().optional(),
  claim: z.string().optional(),
  seasons: z.array(z.string()).optional(),
  tipped: z.boolean().optional(),
  size: z.tuple([z.number(), z.number()]).optional(),
});
const event = z.object({
  id: z.number().int(),
  time: z.number().int(),
  text: z.string(),
  kind: z.enum(["action", "social", "world", "system"]),
  pos: pos.optional(),
});
export const playerCommandSchema = z.discriminatedUnion("type", [
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
      run: z.boolean().optional(),
      reach: z.number().int().min(1).max(9).optional(),
      target: z.object({ x: z.number().int(), y: z.number().int() }).strict().optional(),
    })
    .strict(),
  z.object({
    type: z.literal("shoot"),
    target: z.object({ x: z.number().int(), y: z.number().int() }).strict(),
    power: z.number().min(0).max(1).optional(),
  }).strict(),
  z
    .object({
      type: z.literal("swing"),
      direction: z.number().int().min(0).max(3).optional(),
      power: z.union([z.literal(1), z.literal(2)]).optional(),
      plunge: z.boolean().optional(),
    })
    .strict(),
  z.object({ type: z.literal("stow") }).strict(),
  z.object({ type: z.literal("care"), target: z.string().max(100), treatment: z.enum(treatments) }).strict(),
  z.object({ type: z.literal("drop") }).strict(),
  z
    .object({ type: z.literal("give"), target: z.string().max(100), item })
    .strict(),
  z
    .object({ type: z.literal("hold"), item: z.string().min(1).max(64) })
    .strict(),
  z
    .object({ type: z.literal("learn"), technique: z.enum(techniqueIds) })
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
        "knock",
        "pay",
        "drink",
        "cook",
        "store",
        "work",
        "harvest",
        "gather",
        "tend-plot",
        "use-prop",
        "capture",
        "herd",
        "follow",
        "take",
        "rest",
        "sleep",
        "return",
        "pickup",
        "drop",
        "strike",
        "look",
        "climb",
        "descend",
        "launch",
        "chop",
        "dig",
        "reap",
        "mine",
        "right",
        "topple",
        "heave",
        "light",
        "burn",
        "fill",
        "douse",
      ]),
      // A dismount taken over an edge carries the side it goes off.
      dx: z.number().int().min(-1).max(1).optional(),
      dy: z.number().int().min(-1).max(1).optional(),
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
  z
    .object({
      type: z.literal("deal"),
      target: z.string(),
      give: z.record(item, z.number().int().nonnegative().max(999)),
      take: z.record(item, z.number().int().nonnegative().max(999)),
    })
    .strict(),
  z.object({ type: z.literal("use"), item }).strict(),
  z
    .object({ type: z.literal("choose"), card: z.string().max(64), choice: z.number().int().min(0).max(5) })
    .strict(),
  z.object({ type: z.literal("become"), heir: z.string().max(100) }).strict(),
  z.object({ type: z.literal("wear"), item }).strict(),
  z.object({ type: z.literal("remove"), slot: z.enum(wearSlots) }).strict(),
  z
    .object({
      type: z.literal("sleep"),
      seconds: z
        .number()
        .int()
        .min(600)
        .max(24 * 3600),
    })
    .strict(),
]);
export const commandSchema = z.discriminatedUnion("type", [
  ...playerCommandSchema.options,
  z.object({ type: z.literal("narrate"), intents: z.array(intent).max(6) }).strict(),
]);
/** What the narrator model may return. Its command is one of the ordinary
 * player commands; intents go through the same narrate path as the UI. */
export const narratorReplySchema = z
  .object({
    narration: z.string().min(1).max(1200),
    intents: z.array(intent).max(6),
    verdict: z.enum(["allowed", "impossible", "anachronistic", "not-yours"]).optional(),
    command: playerCommandSchema.optional(),
    errand: z
      .object({
        kind: z.enum(["roam", "forage", "workday", "go", "seek"]),
        run: z.boolean().optional(),
        item: z.string().max(40).optional(),
        target: z.string().max(100).optional(),
        direction: z.enum(["north", "south", "east", "west"]).optional(),
      })
      .strict()
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
const faunaGroup = z
  .object({
    id: z.string(),
    speciesId: z.string(),
    members: z
      .array(
        z.object({
          x: z.number().int(),
          y: z.number().int(),
          direction: z.union([
            z.literal(0),
            z.literal(1),
            z.literal(2),
            z.literal(3),
          ]),
          n: z.number().int().optional(),
          tier: z.enum(faunaTiers).optional(),
          hp: z.number().optional(),
          stun: z.number().optional(),
          trail: z
            .object({ x: z.number(), y: z.number(), until: z.number() })
            .optional(),
          shy: z
            .object({ x: z.number(), y: z.number(), until: z.number() })
            .optional(),
          name: z.string().optional(),
          pose: z.enum(faunaStates).optional(),
        }),
      )
      .max(32),
    pos,
    home: pos,
    homeRadius: z.number(),
    state: z.enum(faunaStates),
    target: pos.optional(),
    nextDecisionAt: z.number(),
    stride: z.number(),
    since: z.number(),
    alarm: z.number().optional(),
    panic: z.number().optional(),
    hard: z.number().optional(),
    fedUntil: z.number().optional(),
    quarry: z.string().optional(),
    catching: z.object({ group: z.string(), n: z.number() }).optional(),
    carrying: z.string().optional(),
    serial: z.number().int().optional(),
    hurtUntil: z.number().optional(),
    provoked: z.number().optional(),
    attack: z
      .object({
        n: z.number().int(),
        phase: z.enum(["windup", "charge", "recover"]),
        until: z.number(),
        dir: z.object({ x: z.number(), y: z.number() }).optional(),
        from: z.object({ x: z.number(), y: z.number() }).optional(),
        ran: z.number().optional(),
      })
      .optional(),
    ring: z.number().optional(),
    owner: z.string().optional(),
    gateId: z.string().optional(),
    pasture: pos.optional(),
    fold: z.boolean().optional(),
  })
  .strict();
const lifeAim = z
  .object({
    id: z.string().max(80),
    text: z.string().max(240),
    subjects: z.array(z.string().max(100)).max(8),
    revision: z.union([z.literal(1), z.literal(2)]).optional(),
    family: z.string().max(80).optional(),
    basis: z.object({
      reason: z.string().max(400),
      means: z.string().max(400),
      obstacle: z.string().max(400).optional(),
      evidence: z.object({
        status: z.enum(["documented", "inferred", "hypothesis", "fictional"]),
        claim: z.string().max(600),
        sources: z.array(z.string().max(500)).max(12),
        limitation: z.string().max(600),
      }).strict().optional(),
    }).strict().optional(),
    step: z.discriminatedUnion("type", [
      z.object({ type: z.literal("talk"), actor: z.string().max(100), text: z.string().max(160), done: z.boolean().optional() }).strict(),
      z.object({ type: z.literal("give"), actor: z.string().max(100), items: z.array(item).max(12), text: z.string().max(160), done: z.boolean().optional() }).strict(),
      z.object({ type: z.literal("work"), target: z.number().int().min(1).max(30), progress: z.number().int().nonnegative().max(30), text: z.string().max(160) }).strict(),
    ]).optional(),
  })
  .strict();
export const snapshotSchema = z.object({
  goals: z.array(z.object({
    id: z.string().max(80),
    slot: z.enum(["work", "need", "social", "own"]).optional(),
    text: z.string().max(240),
    check: z.discriminatedUnion("type", [
      z.object({ type: z.literal("gain"), items: z.array(item).max(20), n: z.number().int().positive() }).strict(),
      z.object({ type: z.literal("trade") }).strict(),
      z.object({ type: z.literal("work") }).strict(),
      z.object({ type: z.literal("visit"), place: z.string().max(120) }).strict(),
      z.object({ type: z.literal("talk") }).strict(),
      z.object({ type: z.literal("reach"), x: z.number(), y: z.number() }).strict(),
      z.object({ type: z.literal("talk-to"), actor: z.string().max(120) }).strict(),
      z.object({ type: z.literal("eat"), below: z.number() }).strict(),
      z.object({ type: z.literal("rest"), below: z.number() }).strict(),
    ]),
    base: z.number().int().nonnegative().optional(),
    done: z.boolean().optional(),
  }).strict()).max(8).optional(),
  goalDay: z.number().int().nonnegative().optional(),
  goalFlags: z.object({
    traded: z.boolean(),
    talked: z.boolean(),
    visited: z.array(z.string().max(240)).max(1000),
    worked: z.boolean().optional(),
    talkedTo: z.array(z.string().max(120)).max(1000).optional(),
  }).strict().optional(),
  today: z
    .object({
      day: z.number().int(),
      made: z.record(z.string(), z.number()),
      trust: z.record(z.string(), z.number()),
    })
    .strict()
    .optional(),
  evening: z
    .object({
      day: z.number().int(),
      season: z.string().optional(),
      chain: z.array(z.string().max(400)).max(100).optional(),
      owing: z.object({ title: z.string().max(100), line: z.string().max(200) }).strict().optional(),
      work: z
        .object({
          activity: z.string(),
          stages: z.number().int(),
          done: z.number().int(),
          made: z.record(z.string(), z.number()),
        })
        .strict()
        .optional(),
      stock: z.array(
        z.object({ good: z.string(), n: z.number(), cap: z.number() }).strict(),
      ),
      regard: z.array(z.object({ id: z.string(), delta: z.number() }).strict()),
      short: z.record(z.string(), z.number()),
      households: z.number().int(),
      tomorrow: z
        .object({ condition: z.string(), label: z.string(), tempC: z.number() })
        .strict(),
    })
    .strict()
    .optional(),
  workday: z
    .object({
      day: z.number().int(),
      places: z.record(
        z.string(),
        z.object({ pos, label: z.string().max(100), patient: z.string().max(100).optional(), crop: z.string().max(60).optional(), board: z.string().max(200).optional() }).strict().nullable(),
      ),
    })
    .strict()
    .optional(),
  record: z
    .array(z.object({ day: z.number().int(), clock: z.number(), card: z.string().max(64), choice: z.number().int(), line: z.string().max(300) }).strict())
    .max(5000)
    .optional(),
  encounter: z.object({ card: z.string().max(64), at: pos, clock: z.number() }).strict().optional(),
  care: z.object({ card: z.string().max(64), who: z.string().max(100), ailment: z.string().max(40), at: z.number() }).strict().optional(),
  economy: z
    .object({
      hour: z.number().int(),
      stock: z.record(z.string(), z.record(z.string(), z.number())),
      short: z.record(z.string(), z.array(z.string())),
      work: z
        .object({
          day: z.number().int(),
          stage: z.number().int(),
          quality: z.number().int().optional(),
          pay: z.number().int().optional(),
          lines: z.array(z.string().max(300)).max(20).optional(),
          card: z.string().max(64).optional(),
          done: z.boolean().optional(),
          drawn: z.number().int().optional(),
          catch: z.number().optional(),
        })
        .strict()
        .optional(),
    })
    .strict()
    .optional(),
  fauna: z.array(faunaGroup).max(5000).optional(),
  legends: z
    .record(
      z.string(),
      z.object({
        name: z.string(),
        species: z.string(),
        at: z.object({ x: z.number(), y: z.number() }),
        slain: z.number().optional(),
      }),
    )
    .optional(),
  households: z
    .array(
      z.object({
        id: z.string(),
        members: z.array(z.string()),
        residence: z.string().optional(),
        home: pos,
        storeId: z.string(),
        makes: z.array(z.string().max(100)).max(100).optional(),
        producers: z.record(z.string().max(100), z.string().max(100)).optional(),
        products: z.record(z.string().max(100), z.string().max(100)).optional(),
        needs: z.array(z.string().max(100)).max(100).optional(),
        buys: z.array(purchase).max(100).optional(),
        owes: z.string().max(100).optional(),
        credit: purchase.extend({
          debtor: z.string().max(100), amount: z.number().nonnegative(),
          reason: z.enum(["household", "hardship"]), repayment: z.enum(["money", "produce"]),
        }).optional(),
        history: z.array(z.object({
          year: z.number().int(),
          kind: z.enum(["wed", "born", "died", "left", "joined", "built", "inherited", "moved", "fire", "good-year", "bad-year", "robbed"]),
          name: z.string().max(100).optional(),
          as: z.string().max(40).optional(),
        }).strict()).max(500).optional(),
        fortune: z.number().min(0).max(1).optional(),
        infants: z.number().int().nonnegative().max(100).optional(),
        familyPlans: z.array(z.object({
          kind: z.literal("seek-match"),
          subject: z.string().max(100),
        }).strict()).max(4).optional(),
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
        hazards: z.literal(1).optional(),
        survival: z.literal(1).optional(),
        disease: z.literal(1).optional(),
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
        hazards: z.literal(1).optional(),
        survival: z.literal(1).optional(),
        disease: z.literal(1).optional(),
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
        hazards: z.literal(1).optional(),
        survival: z.literal(1).optional(),
        disease: z.literal(1).optional(),
        generator: z.literal(3),
        content: z.union([z.literal(1), z.literal(2)]),
        atlas: z.literal(2),
        setting: settingSchema,
        sky: z.string().optional(),
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
  // Ground the player has worked. Without it here, zod strips the key and
  // every felled tree grows back on load.
  tiles: z
    .record(
      z.string().max(32),
      z
        .object({
          chops: z.number().int().nonnegative().max(99).optional(),
          stage: z
            .enum(["logs", "stump", "stems", "rubble", "clear"])
            .optional(),
          wood: z.number().int().nonnegative().max(99).optional(),
          cut: z.boolean().optional(),
          dug: z.boolean().optional(),
          scraped: z.number().optional(),
          picked: z.number().optional(),
          burnt: z.boolean().optional(),
        })
        .strict(),
    )
    .optional(),
  tilesRevision: z.number().int().nonnegative().optional(),
  fires: z
    .array(z.object({ x: z.number().int(), y: z.number().int(), place: z.string().max(100).optional(), until: z.number() }).strict())
    .max(400)
    .optional(),
  places: z
    .record(
      z.string().max(100),
      z
        .object({
          version: z.literal(1),
          fabric: z.enum(["masonry", "earth", "timber"]),
          built: z.number(),
          abandoned: z.number().optional(),
          roof: z.number().min(0).max(1),
          walls: z.array(z.number().min(0).max(1)).max(24),
          burial: z.number().min(0).max(1),
          vegetation: z.number().min(0).max(1),
          char: z.number().min(0).max(1),
        })
        .strict(),
    )
    .optional(),
  lifeAim: lifeAim.optional(),
  plot: z
    .object({
      id: z.string().max(40),
      title: z.string().max(80),
      wording: z.number().int().nonnegative(),
      words: z.record(z.string().max(40), z.string().max(160)),
      refs: z.record(z.string().max(40), z.string().max(100)).optional(),
      cast: z.record(z.string().max(40), z.string().max(100)),
      began: z.number(),
      deadline: z.number(),
      owed: z.number().optional(),
      total: z.number().optional(),
      seized: z.number().optional(),
      fired: z.array(z.string().max(40)).max(40),
      ended: z.string().max(40).optional(),
      aim: lifeAim.optional(),
    })
    .strict()
    .optional(),
  introduced: z.boolean().optional(),
  ailments: z
    .array(
      z.object({
        id: z.string().max(40),
        who: z.string().max(100),
        since: z.number(),
        days: z.number(),
        course: z.enum(["mend", "linger", "die"]),
        tended: z.boolean().optional(),
        infection: z.object({
          exposed: z.number(), source: z.string(), route: z.string(),
          progress: z.number().nonnegative(), rest: z.number().nonnegative(), support: z.number().nonnegative(), strain: z.number().nonnegative(),
          roll: z.number().min(0).max(1), mortality: z.number().min(0).max(1),
          careUntil: z.number().optional(), medicineUntil: z.number().optional(), fluidsUntil: z.number().optional(), announced: z.boolean().optional(),
          assessment: z.object({ by: z.string(), at: z.number(), text: z.string() }).strict().optional(),
        }).strict().optional(),
      }).strict(),
    )
    .max(2000)
    .optional(),
  disease: z.object({
    serial: z.number().int().nonnegative(),
    exposures: z.array(z.object({ who: z.string(), disease: z.string(), source: z.string(), route: z.string(), hour: z.number().int(), dose: z.number().nonnegative() }).strict()).max(20000),
    sources: z.array(z.object({ id: z.string(), household: z.string(), until: z.number() }).strict()).max(2000),
    events: z.array(z.object({ n: z.number().int(), clock: z.number(), map: z.string(), kind: z.string(), who: z.string(), disease: z.string(), source: z.string().optional(), dose: z.number().optional(), treatment: z.enum(treatments).optional(), detail: z.string().optional() }).strict()).max(2000),
  }).strict().optional(),
  relationships: z.record(z.string(), z.object({
    status: z.enum(["neutral", "friend", "best friend", "enemy"]),
    since: z.number(),
    pending: z.enum(["neutral", "friend", "best friend", "enemy"]).optional(),
    began: z.number().optional(),
  }).strict()).optional(),
  bonds: z
    .array(
      z.object({
        kind: z.enum(["beloved", "match", "rival", "estranged"]),
        with: z.string().max(100),
        mutual: z.boolean().optional(),
        secret: z.boolean().optional(),
        opposed: z.boolean().optional(),
      }).strict(),
    )
    .max(20)
    .optional(),
  complaints: z.array(z.object({ by: z.string().max(100), story: z.object({ act: z.string().max(200), object: z.string().max(80).optional(), victim: z.string().max(100).optional(), tone: z.number(), at: z.number(), hops: z.number(), from: z.string().optional(), about: z.string().optional() }).strict(), at: z.number(), spokenFor: z.string().max(100).optional() }).strict()).max(4).optional(),
  asks: z
    .array(
      z.object({
        id: z.string().max(100),
        by: z.string().max(100),
        kind: z.enum(["bring", "food", "talk-to", "go-to", "help"]),
        item: z.string().max(100).optional(),
        to: z.string().max(100).optional(),
        place: z.string().max(100).optional(),
        what: z.string().max(120),
        at: z.number(),
        until: z.number(),
        accepted: z.boolean().optional(),
        meet: z.object({ x: z.number(), y: z.number(), space: z.string().max(100) }).strict().optional(),
        task: z.string().max(120).optional(),
        offered: z.boolean().optional(),
      }).strict(),
    )
    .max(20)
    .optional(),
  kin: z
    .object({
      since: z.number(),
      said: z.record(z.string().max(160), z.number()),
      talked: z.record(z.string().max(100), z.number()),
      home: z.number().optional(),
      last: z.number().optional(),
      waiting: z.object({ id: z.string().max(100), need: z.string().max(20), at: z.number() }).strict().optional(),
    })
    .strict()
    .optional(),
});
