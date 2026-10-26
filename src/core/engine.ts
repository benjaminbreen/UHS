import { updateRelationships } from "./bonds";
import { dangerAt, npcDanger } from "./danger";
import { afloatAt } from "./watercraft";
import { wornFromWearing } from "./wearing";
import {
  clothName,
  clothWorth,
  parseCloth,
} from "../content/characters/wardrobe/cloth";
import { waterDepthAt, wadingCost, MAX_WADING_DEPTH } from "./water-field";
import { trimCache } from "./cache";
import {
  depositSupplies,
  harvestResource,
  householdActivity,
  refreshResource,
  seasonAt,
  seasonIndex,
  grazeActivity,
} from "./livelihood";
import { skySeed, weatherAt } from "./weather";
import { propDefs } from "../content/props/catalog";
import { regionalContainer } from "../content/props/containers";
import { about } from "../content/props/about";
import { atWork, briefText, personBrief, sexOf } from "./brief";
import { placeBrief } from "./place-brief";
import { propAffordances, heldObject, lowProp } from "./props";
import {
  planShove,
  type ShovePlan,
  type ShoveRefusal,
  type ShoveWorld,
} from "./shove";
import { rollStats, statsOf } from "./stats";
import {
  energyOf,
  rollPath,
  settle,
  type Landing,
  type RollWorld,
  type SettleWorld,
} from "./settle";

/** Which pile of remains, and which arrangement of it. Three per material, so
 * a yard of broken crockery is not the same pile stamped out three times. */
function brokenSprite(id: string, material: string) {
  let hash = 7;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `prop-broken-${material}-${hash % 3}`;
}
import {
  distance,
  SIGHT,
  type Actor,
  type Affordance,
  type Decoration,
  type CommandRequest,
  type CommandResult,
  type GameEvent,
  type Household,
  type Inspection,
  type Inventory,
  type ItemDef,
  type ItemId,
  type Observation,
  type NearbyThing,
  type PlayerCommand,
  type Position,
  type Snapshot,
  type SocialRelation,
  type WorldModel,
  type WorldObject,
} from "./types";
import { canonical, random, stateHash } from "./random";
import { askLines, hear, telling, tidings } from "./word";
import { orderKeeper, type Penalty } from "../content/history/order";
import { rockFrame } from "../content/ecology/rocks";
import { BUILDING_BURN, BURN_SECONDS, oreAt, TORCH_SECONDS } from "../content/ecology/metals";
import { conditionOf, damageStructure, fabricOf, weatherStructure, type Structure } from "./time/structure";
import { regardCue } from "./regard";
import { resolveIntents, validateIntents } from "./intents";
import { findPath } from "./pathfinding";
import { addStock, dayOfWork, importShare, runEconomy, stockOf } from "./economy";
import { goodsOf } from "../content/economy/goods";
import { keepsShop, stockFor } from "./shop";
import { goodName } from "../content/economy/products";
import { carryKit } from "../content/economy/carrying";
import { processFor, type PlaceRole, type ProcessFamily, type Step } from "../content/economy/processes";
import { pieceOf, recipeFor } from "../content/economy/recipes";
import { CARDS, type CardChoice, type ChoiceCard } from "../content/cards";
import { bossTitle, cardText, oddsOf, pickCard } from "./cards";
import { fieldParcel, findPlace, waterfrontMember, type StepPlace } from "./work-places";
import { catchFate, catchOf, fishingPractice, fishingWords, preserveWords, waterOf, type Preserve } from "../content/economy/fishing";
import { dangerOf, gameOf, GIVE_UP_HOURS, huntFate, huntWeapon, huntWords, keepsTraps } from "../content/economy/hunting";
import { itineraryAt, type Itinerary, DAY_MINUTES } from "./itinerary";
import { goalDone, heldCount, pickGoals } from "./goals";
import { commissionFor } from "./agenda";
import { advanceLifeAim, ensureLifeAim } from "./life-aim";
import { endPlot, plotLine, plotTemplate, stepPlot, type PlotCard } from "./plot";
import { kinCall, kinOf } from "./kin";
import { composeIntro, introText, settlementName } from "./intro";
import { bodilyLimits, ailing, ailmentDef, healthPerson, nameFor, onsets, severity, start as startAilment, infect, exposure, diseaseTime, diseaseEvent, mealExposure, observedIllnesses, symptomsOf, updateCourse, resolvedInfection, practitioner, illnessProgress } from "./health";
import { treatments, type Treatment } from "../content/health/infections";
import { kinWord } from "./concerns";
import { GOAL_TEMPLATES } from "../content/goals/templates";
import type { SeasonId } from "./season";
import { livelihoodOf } from "../world/v3/routines";
import { buildInterior, ROOM_ORIGIN, spotsAt, type InteriorLayout, type Spot, type SpotRole } from "../world/interior";
import { buildingUse } from "../content/interiors/select";
import { vehicleAt } from "../world/v3/conveyances";
import type { DailyGoal, GoalContext } from "../content/goals/types";
import { route, type RouteResult } from "./routing";
import { terrainJump, terrainLeap, type LeapResult } from "./topography";
import { boundaryGraph } from "../render/fence-pass";
import { advanceFauna, stepAllowed } from "./fauna-sim";
import { ageDung, capDung, dungObject } from "./dung";
import { ageRemains, pruneRemains, remainsObject } from "./remains";
import { remainsOf } from "../content/fauna/remains";
import { dungOf, dungPerDay } from "../content/fauna/dung";
import { aerialStates, type FaunaGroup, type FaunaMember } from "./fauna";
import {
  ensureVitals,
  faunaName,
  maxHp,
  legendKey,
  memberAt,
  TIERS,
  missileOf,
  weaponOf,
  type CueKind,
  type Signal,
  type SignalInput,
  type CreatureHit,
  type FaunaTier,
  type Weapon,
} from "./combat";
import { faunaAt, faunaCombat, faunaProfile } from "../content/fauna";
import { pestArrival, pestNoun, pestOf, pestsFor, type CropPest } from "../content/agriculture/pests";
import { livelihoodById } from "../content/characters/livelihoods";
import { capabilitiesFor } from "../content/characters/resolve";
import { amountIn, moneyFor } from "../content/economy/money";
import { climbable, useOf } from "../content/props/uses";
import { workplaceFor } from "../content/characters/workplace";
import { propSprite } from "../content/props/place";
import {
  levelOf,
  marksmanReach,
  PER_LEVEL,
  SKILLS,
  rankOf,
  startingSkills,
  type SkillGain,
  type SkillId,
} from "./skills";
import { optionsAt, pendingPicks, technique, TIERS as TECHNIQUE_TIERS, type TechniqueId } from "./techniques";
import { faunaBlockOf, habitatScorer } from "../world/v3/fauna";
import { herdNoun, herdWords, keptSpecies } from "../content/fauna/herding";
import { crops, pickable } from "../content/agriculture/crops";
import { cropStage } from "../content/agriculture";
import type { CropId, Season } from "../content/agriculture/types";
import { gardenPlant, vegetableId } from "../content/agriculture/gardens";

/** How a crop's stage reads in a prompt that is telling you to come back. */
const STAGE_WORD: Record<string, string> = {
  bare: "not sown yet",
  sown: "only just up",
  green: "still green",
  stubble: "already cut",
  ripe: "ready",
};

/** Cells either side of the player whose animal groups stay in the save. */
const FAUNA_KEEP = 160;
/** Grain from one reaped field cell, and the parcel size an ordinary farm works. */
const GRAIN_PER_CELL = 6;
const PARCEL_CELLS = 45;
/** Clock seconds between looks for a new raid, and the odds each time. A game
 * minute is about three real seconds. */
const RAID_CHECK = 60;
const RAID_CHANCE = 0.3;
const RAID_CAP = 2;
const RAID_REACH = 22;
/** Cells a raid eats before it has had its fill, and the longest it stays. */
const RAID_FILL = 30;
const RAID_STAY = 1500;
/** Seconds before grass closes over a hole an animal dug. */
const SCRAPE_HEALS = 5 * 86400;
import {
  axeWork,
  pickWork,
  type ToolAction,
  ROCK_BLOWS,
  AXE_ROCK_BLOWS,
  STUMP_BLOWS,
  editedDecoration,
  fellingSwings,
  plantClass,
  tileKey,
  woodYield,
  isWorkedGround,
  isRock,
  LOGS_SPRITE,
  plantName,
  STUMP_SPRITE,
  type TileEdit,
} from "./tile-edits";

/** Elevation carried by one altitude step, matching the terrain renderer. */
const TERRAIN_STEP = 14;
// About a map and a half: half a map of open water is easy, two maps is not.
const SWIM_RANGE = 450;
const SWIM_WARNINGS: [number, string][] = [
  [0.5, "Your arms are growing heavy."],
  [0.75, "You are tiring badly. Make for shore."],
  [0.9, "You are swallowing water. You cannot keep this up much longer."],
];
/** Clock seconds: leaning on someone this soon after is the same collision. */
const BUMP_GAP = 2;
export type TreeFind = "nest" | "hive" | "fruit" | "cones";
const TREE_FINDS: Record<TreeFind, { loot: { item: string; n: number }[]; told: string }> = {
  nest: { loot: [{ item: "eggs", n: 3 }, { item: "feathers", n: 1 }], told: "A nest tumbles out of the branches. Three speckled eggs, unbroken!" },
  hive: { loot: [{ item: "honeycomb", n: 2 }], told: "A wild hive drops from a hollow bough, and the bees boil out of it. Honeycomb!" },
  fruit: { loot: [{ item: "fruit", n: 4 }], told: "Ripe fruit comes pattering down out of the crown." },
  cones: { loot: [{ item: "pinecone", n: 3 }, { item: "resin", n: 1 }], told: "Cones rattle down through the needles, sticky with resin." },
};
const AUTHORITY = /basilica|meeting hall|guild hall|council|palace|temple|chapel|church|shrine|mosque|synagogue/i;
/** Clock seconds: offence taken again this soon costs no more trust. */
const AFFRONT_GAP = 30;
import { facingFromStep } from "./facing";
import {
  doorAccess,
  clearDoorsteps,
  doorApproach,
  isShutBarrier,
  type DoorVerdict,
} from "./doors";

/** North, east, south, west: the order `direction` is stored in. */
const CARDINALS: [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
import {
  isSolid,
  reactionFor,
  toolClass,
  toughness,
  type Hit,
  type HitClass,
  type ToolClass,
} from "./reactions";
import type { Ask, CallIn, Favour, Place, Point, WalkOff, Word } from "./types";
const GROUND_HIT: Record<string, HitClass> = {
  water: "water",
  marsh: "marsh",
  sand: "sand",
  snow: "snow",
  dirt: "soil",
  dry: "soil",
  field: "soil",
  grass: "grass",
  rock: "stone",
  paving: "stone",
  bridge: "timber",
  floor: "timber",
};
import {
  floraRegion,
  speciesAt,
  speciesById,
  type FloraRegion,
  type Species,
} from "../content/ecology/flora";
import { bloomsAt } from "../content/ecology/blooms";
const copy = <T>(x: T): T => structuredClone(x);
const listing = (xs: string[]) =>
  xs.length < 2
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;
/** Routines built in one call to `advance`. */
const ROUTINE_BUILDS_PER_ADVANCE = 32;
/** The generated decoration function of each world, before any engine wrapped
 * it in its own tile edits. */
const grownDecoration = new WeakMap<WorldModel, WorldModel["decoration"]>();
function reverseRelation(actor: Actor, relation: SocialRelation): SocialRelation["kind"] {
  if (relation.reciprocal) return relation.reciprocal;
  switch (relation.kind) {
    case "parent": return "child";
    case "child": return "parent";
    case "servant":
    case "apprentice": return "master";
    // Older generators did not retain the reverse link.
    case "master": return actor.origin?.livelihood === "apprentice" || /^apprentice\b/i.test(actor.role)
      ? "apprentice" : "servant";
    default: return relation.kind;
  }
}
const treeName = (sprite: string) =>
  sprite
    .replace(/^(nature-understory|nature|ecology)-/, "")
    .replaceAll("-", " ")
    .replace(/^./, (c) => c.toUpperCase());
/** Saves from before wearables carry an authored look; give them the matching worn slots. */
function migrateWorn(snapshot: Snapshot): Snapshot {
  for (const actor of [snapshot.player, ...snapshot.actors])
    if (actor.kind === "human" && actor.appearance && !actor.worn)
      actor.worn = wornFromWearing(actor.appearance.wearing);
  return snapshot;
}

/** Whether an object stands on a cell. A wide prop, such as a big hearth,
 * covers the cells its `span` reaches either side of its own. */
const covers = (o: WorldObject, x: number, y: number) => {
  if (o.size) return x >= o.pos.x && x < o.pos.x + o.size[0] && y >= o.pos.y && y < o.pos.y + o.size[1];
  const span = o.prop ? propDefs[o.prop]?.span : undefined;
  return span
    ? Math.abs(o.pos.x - x) <= span[0] && Math.abs(o.pos.y - y) <= span[1]
    : o.pos.x === x && o.pos.y === y;
};
/** Where the work itself is done when the map gave the trade no tool of its own. */
const PROPLESS: Record<ProcessFamily, string> = {
  tend: "your yard",
  gather: "your yard",
  transform: "your workshop",
  carry: "your yard",
  serve: "your house",
};
/** How the player can pitch in on someone else's work. */
const HELP: { label: string; stat: keyof import("./types").Stats; odds?: number; minutes: number; fatigue: number; xp: number; bonus?: number; line: string; lost?: string }[] = [
  { label: "Keep pace with {name}", stat: "endurance", odds: 0.45, minutes: 150, fatigue: 18, xp: 6, bonus: 1,
    line: "You keep pace with {name} the whole way through. {name} says nothing, which is praise.",
    lost: "You tire long before {name} does, but between you the work gets done." },
  { label: "Do what you're shown", stat: "wit", minutes: 120, fatigue: 10, xp: 4,
    line: "You do as {name} shows you, and the work goes quicker for two." },
  { label: "Ask {name} to teach you", stat: "wit", minutes: 150, fatigue: 8, xp: 9,
    line: "{name} talks you through it as you go. You'll know how next time." },
];
const workSkill: Record<ProcessFamily, SkillId> = {
  tend: "farming",
  gather: "foraging",
  transform: "trade",
  carry: "wayfaring",
  serve: "speech",
};

export class Engine {
  state: Snapshot;
  /** Set by a chronicle to witness every command, human or agent. */
  onAct?: (request: CommandRequest, result: CommandResult) => void;
  constructor(
    readonly world: WorldModel,
    readonly items: Record<ItemId, ItemDef>,
    snapshot?: Snapshot,
  ) {
    this.state = snapshot
      ? migrateWorn(copy(snapshot))
      : {
          manifest: {
            seed: "",
            pack: world.pack.id,
            schema: world.pack.setting ? 2 : 1,
            simulation: world.generatorVersion === 3 ? 2 : 1,
            hazards: 1,
            survival: 1,
            disease: 1,
            generator: world.generatorVersion ?? (world.pack.setting ? 2 : 1),
            content: 1,
            atlas: world.pack.setting ? 2 : 1,
            ...(world.pack.setting
              ? { setting: copy(world.pack.setting) }
              : {}),
          },
          clock: 9 * 3600,
          revision: 0,
          randomCounter: 0,
          player: {
            id: "player",
            name: world.pack.characterName,
            role: world.pack.role,
            kind: "human",
            pos: copy(world.spawn),
            home: copy(world.spawn),
            work: copy(world.spawn),
            sprite: world.pack.playerSprite,
            inventory: copy(world.pack.startInventory),
            activity: world.pack.setting?.situation?.support === "raft" ? "Afloat on a raft" : "Exploring",
            ...(world.pack.setting?.situation && world.pack.setting.situation.support !== "land"
              ? { afloat: world.pack.setting.situation.support } : {}),
            fatigue: 0,
            hunger: 12,
            trust: 0,
            memories: [],
            direction: 2,
          },
          ...(world.households ? { households: copy(world.households) } : {}),
          actors: copy(world.initialActors).map((a) => ({
            ...a,
            lastUpdated: 9 * 3600,
          })),
          objects: copy(world.initialObjects),
          events: [],
          notes: [],
          visited: ["0,0"],
          receipts: {},
          log: [],
          permissions: {},
        };
    // Old snapshots copied the NPC's "master" link back onto the player.
    if (snapshot) {
      for (const relation of this.state.player.relations ?? []) {
        if (relation.kind !== "master") continue;
        const actor = this.state.actors.find((a) => a.id === relation.other);
        const back = actor?.relations?.find((r) => r.other === "player" && r.kind === "master");
        if (!actor || !back) continue;
        const original = world.initialActors.find((a) => a.id === actor.id)
          ?.relations?.find((r) => r.other === "player" && r.kind === "master");
        relation.kind = original?.reciprocal ?? reverseRelation(actor, back);
        relation.reciprocal = "master";
      }
    }
    const edited = (x: number, y: number, base: Decoration | undefined) =>
      editedDecoration(base, this.state.tiles?.[tileKey(x, y)], x, y);
    // The generator hook is what lets collision and pathing see a felled tree;
    // wrapping the public function covers worlds built without it. A world
    // outlives the engine that first wrapped it — map travel builds a new
    // engine on the same world — so wrap the original each time rather than
    // stacking one engine's edits on the last one's.
    world.overrideDecoration?.(edited);
    const grown = (grownDecoration.get(world) ??
      grownDecoration
        .set(world, world.decoration.bind(world))
        .get(world)!) as WorldModel["decoration"];
    world.decoration = (x, y) => edited(x, y, grown(x, y));
    for (const [id, structure] of Object.entries(this.state.places ?? {})) {
      const place = world.place(id);
      if (place) this.setStructure(place, structure);
    }
    clearDoorsteps(this.state.objects, world.places, (x, y) => world.blocked(x, y, "outside"));
    this.syncSeason();
  }
  /** Tells the world which season the clock is in, so its fields stand at that season's stage. */
  private syncSeason() {
    const setting = this.world.pack.setting;
    if (setting) this.world.setSeason?.(seasonAt(setting.season, this.state.clock));
  }
  /** A cell picked this season; the crop stands again the next. */
  private pickedNow(edit?: TileEdit) {
    return edit?.picked !== undefined && seasonIndex(edit.picked) === seasonIndex(this.state.clock);
  }
  initialize(seed: string) {
    this.state.manifest.seed = seed;
    if (this.world.pack.setting?.environment) {
      const season = seasonAt(this.world.pack.setting.season, this.state.clock);
      for (const o of this.state.objects)
        refreshResource(o, this.state.clock, season);
    }
    const sites = this.world.activitySites?.("player");
    if (sites) {
      this.state.player.home = { ...sites.home, space: "outside" };
      this.state.player.work = { ...sites.work, space: "outside" };
    }
    const household = this.state.households?.find((h) =>
      h.members.includes("player"),
    );
    if (household) {
      Object.assign(this.state.player, {
        householdId: household.id,
        age: this.world.pack.setting?.character?.age ?? 34,
        knownResources: [],
        relations: this.state.actors.flatMap((a) =>
          (a.relations ?? [])
            .filter((r) => r.other === "player")
            .map((r) => ({
              other: a.id,
              reciprocal: r.kind,
              kind: reverseRelation(a, r),
            })),
        ),
      });
    }
    this.event(
      this.state.player.afloat
        ? `Open water stretches to the horizon. You are ${this.state.player.afloat === "swimming" ? "swimming" : `afloat in a ${this.state.player.afloat}`}. Use the movement keys or click the water to move.`
        : this.world.pack.setting?.situation?.landform === "islet"
          ? "You stand on a small island surrounded by ocean."
          : "You arrive as the morning’s work begins. Walk, meet someone, or find your own way.",
      "system",
    );
  }
  private money?: ItemDef;
  item(id: ItemId): ItemDef | undefined {
    const known = this.items[id] ?? this.state.catalog?.[id];
    const setting = this.world.pack.setting;
    if (id === "coin" && known && setting)
      return (this.money ??= { ...known, name: moneyFor(setting).name, description: moneyFor(setting).about });
    if (known) return known;
    // A garment carries its cloth in its id. Everything a worn item does —
    // the look it adds, the slot it fills — comes from the base definition;
    // the cloth only changes what it is called and what it is worth.
    const q = parseCloth(id);
    const base = q && (this.items[q.base] ?? this.state.catalog?.[q.base]);
    if (!base) return undefined;
    return {
      ...base,
      id,
      name: clothName(base.name, q!.cloth, id, {
        year: this.world.pack.year,
        id: q!.base,
      }),
      value: Math.max(1, Math.round(base.value * clothWorth(q!.cloth))),
    };
  }
  hash() {
    const { receipts, log, notes, narration, ...physical } = this.state;
    return stateHash(physical);
  }
  snapshot() {
    return copy(this.state);
  }
  /** Bring household stocks up to the clock; also the catch-up after an absence. */
  runEconomy() {
    const s = this.state;
    const hour = Math.floor(s.clock / 3600);
    if (!s.households?.length) return;
    if (!s.economy) {
      s.economy = { hour, stock: {}, short: {} };
      return;
    }
    const yesterday = Math.floor(s.economy.hour / 24);
    const adults = new Set(
      s.actors.filter((a) => (a.age ?? 20) >= 14).map((a) => a.id),
    );
    runEconomy(
      s.households,
      s.economy,
      hour,
      (h) => h.members.filter((m) => adults.has(m)).length,
      importShare[this.world.pack.setting?.settlement ?? ""],
      // Only the crew fishes, however many grown hands the house has.
      (h, good, at) => good === "grain" ? this.harvestYield(h, at) : good === "fish"
        ? this.catchYield(h, at) * Math.min(1, (this.practices.get(h.id)?.crew ?? 1) / Math.max(1, h.members.filter((m) => adults.has(m)).length))
        : h.makes?.includes("hide") ? this.gameYield(h, at) : 1,
    );
    if (Math.floor(hour / 24) === yesterday) return;
    // At dawn, whoever buys from the player's house and went short holds it
    // against them.
    const mine = s.households.find((h) => h.members.includes("player"));
    if (!mine) return;
    for (const h of s.households) {
      const short = s.economy.short[h.id];
      const letDown = h.buys?.some(
        (b) => b.from === mine.id && short?.includes(b.good),
      );
      const head = letDown && s.actors.find((a) => a.id === h.members[0]);
      if (head) this.regard(head, -1);
    }
  }
  /** The player's trade, their household, and how far into today's work. */
  private trade() {
    const s = this.state;
    const household = s.households?.find((h) => h.members.includes("player"));
    const kit = livelihoodOf(this.world.pack, s.player);
    const setting = this.world.pack.setting;
    const w = s.economy?.work, now = Math.floor(s.clock / 86400);
    // A day's work begun and not finished carries on through the night, until
    // the next morning; its steps, places and wage stay that day's.
    const morning = Math.min(6, (kit && recipeFor(kit)?.rises) ?? 6);
    const day = w && w.day === now - 1 && !w.done && (w.stage > 0 || w.card) && s.clock < now * 86400 + morning * 3600 ? w.day : now;
    const season = (setting ? seasonAt(setting.season, day * 86400 + 43200) : "spring") as SeasonId;
    const recipe = kit && recipeFor(kit);
    const today = setting && { pick: random(s.manifest.seed, "workday", day), year: setting.year, lon: setting.lon, lat: setting.lat };
    // A farm's day goes by its own crop's calendar, not by the name of the season.
    const process = kit && processFor(kit, setting?.economyRevision,
      household && recipe && !Array.isArray(recipe.day) && !("title" in recipe.day) && recipe.skill === "farming" ? this.cropSeason(household, season) : season, today);
    if (!household || !kit || !process) return;
    const stage = w?.day === day ? w.stage : 0;
    const piece = recipe && pieceOf(recipe, season, today, random(s.manifest.seed, "piece", day));
    return { household, kit, process, day, stage, piece };
  }
  private workAt(o: WorldObject, close: boolean, t = this.trade()): Affordance[] {
    if (!t) return [];
    const { process, stage } = t;
    if (this.placeStep(t)) return [];
    const clientStore = process.steps[stage]?.client ? this.client(t)?.storeId : undefined;
    // The bench in your own house, or a tool or hearth that is no one else's.
    // The store is not a forge: work with no tool here goes to the house.
    const station = clientStore ? o.id === clientStore :
      (o.owner === "player" && o.pos.space !== "outside" && o.id === `${o.pos.space}-work`) ||
      ((!o.owner || o.owner === "player") &&
        process.stations.includes(propDefs[o.prop ?? ""]?.family ?? ""));
    if (!station) return [];
    const done = stage >= process.stages.length;
    return [
      {
        label: done ? "Today's work is done" : this.stepTask(process.steps[stage]),
        command: { type: "interact", target: o.id, action: "work" },
        enabled: close && !done,
        reason: done ? "Come back tomorrow" : close ? undefined : "Walk closer",
      },
    ];
  }
  /** The nearest station where today's work can go on, "done" once it is
   * finished, or undefined for a player with no trade or no station. */
  workStation(): WorldObject | "done" | undefined {
    const p = this.state.player.pos;
    // A station behind a door is still a station, just a long walk away.
    // An indoor trade goes to the bench in the house, past any in the yard.
    const far = (o: WorldObject) =>
      o.id === `${o.pos.space}-work` ? -1 : Math.min(distance(o.pos, p), 1e6);
    let best: WorldObject | undefined,
      done = false;
    const t = this.trade();
    if (!t) return undefined;
    for (const o of this.state.objects) {
      const work = this.workAt(o, true, t)[0];
      if (!work) continue;
      if (!work.enabled) done = true;
      else if (!best || far(o) < far(best)) best = o;
    }
    return best ?? (done ? "done" : undefined);
  }
  /** The household a call-out trade works for today: one of the nearest
   * neighbours, a different one most days. */
  private client(t: NonNullable<ReturnType<Engine["trade"]>>) {
    const near = (this.state.households ?? [])
      .filter((h) => h !== t.household && h.residence && !h.members.includes("player"))
      .sort((a, b) => distance(a.home, t.household.home) - distance(b.home, t.household.home))
      .slice(0, 8);
    return near.length ? near[Math.floor(random(this.state.manifest.seed, "client", t.day) * near.length)] : undefined;
  }
  /** Today's work for the HUD: the stages, how far along, and where the next
   * one is done, named for a person rather than by whatever prop stands there. */
  workPlan() {
    const t = this.trade();
    if (!t) return undefined;
    const work = this.state.economy?.work?.day === t.day ? this.state.economy.work : undefined;
    const steps = t.process.steps.map((st) => ({ ...st, task: this.stepTask(st) }));
    const today = {
      title: this.dayTitle(t),
      places: t.process.steps.map((st) => this.stepWhere(st, t) ?? undefined),
      quality: work?.quality ?? 0,
      pay: work?.pay ?? 0,
      lines: work?.lines ?? [],
      waiting: !!this.waitingCard(),
      boss: t.process.paid === "wage" ? bossTitle(this.world.pack.setting) : undefined,
      hours: t.process.steps.map((st) => st.hours ?? t.process.hours / t.process.stages.length),
      deadline: this.state.plot && !this.state.plot.ended ? this.state.plot.deadline : undefined,
      expect: t.process.paid === "wage" || t.process.paid === "takings"
        ? Math.max(0, (t.process.paid === "wage" ? 3 : 2) + (work?.quality ?? 0) + (work?.pay ?? 0)) : undefined,
      skill: t.process.skill,
      wiki: t.process.wiki,
    };
    const ps = this.placeStep(t);
    // Out on the water is reached by the boat, from the water's edge.
    const launch = ps?.at.board && !this.state.player.afloat ? waterfrontMember(this.world, t.household)?.launch : undefined;
    if (ps)
      return { activity: t.kit.activity, stages: t.process.stages, steps, done: t.stage, station: undefined,
        where: launch ? "your boat" : ps.at.label,
        door: launch ? { x: launch.water.x - launch.direction.x, y: launch.water.y - launch.direction.y, space: "outside" } : ps.at.pos,
        side: this.sideJob(), ...today };
    const station = this.workStation();
    const target = typeof station === "object" ? station : undefined;
    const step = t.process.steps[t.stage];
    const client = step?.client ? this.client(t) : undefined;
    const place = target && target.pos.space !== "outside" ? this.world.place(target.pos.space) : undefined;
    const host = client && this.state.actors.find((a) => client.members.includes(a.id));
    const where = !target ? undefined
      : client ? `${host?.name ?? "A neighbour"}'s house`
      : place ? place.owner === "player" ? "your house" : place.name
      : target.id === t.household.storeId ? "your yard"
      : target.owner === "player" ? "your yard" : target.name;
    return {
      activity: t.kit.activity,
      stages: t.process.stages,
      steps,
      done: t.stage,
      station: target,
      where,
      // Where to walk to from outside: the door of a house, else the spot.
      door: place ? { ...place.entrance, space: "outside" } : target?.pos,
      side: this.sideJob(),
      ...today,
    };
  }
  private dayTitle(t = this.trade()) {
    return t?.process.title && cardText(t.process.title, this.cardWords());
  }
  stepTask(step: Step) {
    return cardText(step.barter && !this.markets() ? step.barter : step.task, this.cardWords());
  }
  /** Whether people here bought and sold in a market at all. */
  private markets() {
    const setting = this.world.pack.setting;
    const can = setting ? capabilitiesFor(setting) : undefined;
    return !can || can.has("market_exchange") || can.has("coinage") || can.has("urban_settlement");
  }
  /** The words a card or step is filled with, for today's work. */
  private cardWords(name?: string) {
    const t = this.trade();
    const made = t?.process.makes[0];
    return {
      boss: bossTitle(this.world.pack.setting),
      name: name ?? "they",
      work: t?.kit.activity.toLowerCase(),
      good: made ? (t.household.products?.[made] ? goodName(made, t.household.products[made]) : goodName(made)) : "work",
      piece: t?.piece ?? "the work",
      crop: (t && this.stepPlace({ name: "field", task: "", at: "field" }, t)?.crop) ?? "crop",
      ...this.fishingWords(t),
      ...(t?.process.steps.some((st) => st.scene === "hunt") ? this.huntingWords(t.household, this.state.player) : {}),
      ...herdWords(t?.kit.activity === "Tending animals" ? this.herdSpecies(this.state.player.origin?.roleLabel ?? t.kit.label) : undefined),
    };
  }
  private fishingWords(t: ReturnType<Engine["trade"]>) {
    return t ? this.fishingWordsFor(t.household, t.process.steps) : {};
  }
  private fishingWordsFor(household: Household | undefined, steps: Step[]): Record<string, string> {
    const practice = household && steps.some((st) => st.at === "grounds") ? this.fishing(household) : undefined;
    if (!practice) return {};
    const words = fishingWords[practice.method];
    const fate = catchFate(this.world.pack.setting!);
    return {
      ready: words.ready, fishing: practice.hull && waterfrontMember(this.world, household!) ? words.fish : words.shore, gear: words.gear,
      land: fate.owed ? `Land the catch and set aside ${fate.owed.to}'s share` : fate.sold ? `Land the catch and sell it to ${fate.buyer}` : "Land the catch and share it out",
      owed: fate.owed?.to ?? "", buyer: fate.buyer,
    };
  }
  private herds = new Map<string, string | undefined>();
  private herdSpecies(trade: string) {
    const setting = this.world.pack.setting;
    if (!setting) return;
    if (!this.herds.has(trade))
      this.herds.set(trade, this.state.fauna?.find((g) => g.owner === "player")?.speciesId ?? keptSpecies(setting, this.state.manifest.seed, trade));
    return this.herds.get(trade);
  }
  private previews = new Map<string, StepPlace | null>();
  /** Where a recipe's step is done today, or null when this map has no such
   * place and the work falls back to a prop. Read from the day's fixed places
   * once the day has begun; before that, worked out from the world as it is. */
  stepPlace(step: Step, t = this.trade()) {
    if (!step.at || !t) return null;
    const fixed = this.state.workday?.day === t.day ? this.state.workday.places[step.at] : undefined;
    let found = fixed === undefined ? undefined : fixed && { ...fixed, pos: { ...fixed.pos } };
    if (found === undefined) {
      const key = `${t.day}:${step.at}:${this.state.revision}`;
      found = this.previews.get(key);
      if (found === undefined) {
        if (this.previews.size > 64) this.previews.clear();
        this.previews.set(key, (found = this.findPlace(step.at, t)));
      }
    }
    const bench = this.object(`${t.household.residence}-work`)?.name.toLowerCase() ?? "hearth";
    return found && step.label ? { ...found, label: step.label.replace("{bench}", bench) } : found;
  }
  private findPlace(role: PlaceRole, t: NonNullable<ReturnType<Engine["trade"]>>) {
    return findPlace(role, {
      state: this.state,
      world: this.world,
      household: t.household,
      day: t.day,
      client: () => this.client(t),
      markets: this.markets(),
      inside: () => {
        const space = t.household.residence;
        const room = space && this.world.place(space) ? this.interiorOf(space) : undefined;
        if (!space || !room) return;
        const bench = this.object(`${space}-work`);
        const at = bench && bench.pos.space === space ? bench.pos : room.fire[0] ?? room.workCell;
        return { x: at.x, y: at.y, space };
      },
    });
  }
  /** Fixes the day's places and people at its first command, so a replay that
   * never drew the panel finds the same patient, field and client. */
  private fixDay() {
    const t = this.trade();
    if (!t || this.state.workday?.day === t.day) return;
    const places: Record<string, StepPlace | null> = {};
    for (const role of new Set([...t.process.steps.flatMap((st) => (st.at ? [st.at] : [])), this.fallback(t)]))
      places[role] = this.findPlace(role, t);
    this.state.workday = { day: t.day, places };
  }
  /** Today's step, when it is done at a place rather than at a prop. */
  private placeStep(t = this.trade()) {
    const step = t?.process.steps[t.stage];
    const at = step && this.stepWhere(step, t!);
    return at ? { step: step!, at } : undefined;
  }
  /** Where a step is done: its place, or for work at a tool the trade has no
   * tool for here, the house or yard. Null means at the trade's own prop. */
  private stepWhere(step: Step, t: NonNullable<ReturnType<Engine["trade"]>>) {
    return this.stepPlace(step, t) ??
      (!step.at && !this.hasProp(t) ? this.stepPlace({ ...step, at: this.fallback(t), label: PROPLESS[t.process.family] }, t) : null);
  }
  /** Where work with no tool of its own goes: the yard for the land, the stock
   * and the loads, the house for the rest. */
  private fallback(t: NonNullable<ReturnType<Engine["trade"]>>): PlaceRole {
    return t.process.family === "transform" || t.process.family === "serve" ? "home" : "yard";
  }
  /** Whether the trade has its own tool or bench here: a prop of its kind that
   * is nobody's or the player's, or the bench in the player's own house. */
  private hasProp(t: NonNullable<ReturnType<Engine["trade"]>>) {
    return this.state.objects.some((o) =>
      (o.owner === "player" && o.pos.space !== "outside" && o.id === `${o.pos.space}-work`) ||
      ((!o.owner || o.owner === "player") && t.process.stations.includes(propDefs[o.prop ?? ""]?.family ?? "")));
  }
  /** The step the player can do where they stand, at a recipe's place. */
  workHere() {
    const ps = this.placeStep();
    const p = this.state.player.pos;
    // A hunt ends on a kill, or once it has gone on long enough, wherever the hunter is.
    if (ps?.step.scene === "hunt")
      return this.huntOver() && !this.waitingCard() && p.space === "outside"
        ? { label: "Give up and head home", command: { type: "interact" as const, target: Engine.tileTarget(p.x, p.y), action: "work" as const } }
        : undefined;
    if (!ps || this.waitingCard() || p.space !== ps.at.pos.space || distance(p, ps.at.pos) > 2.5) return;
    return {
      label: this.stepTask(ps.step),
      command: { type: "interact" as const, target: Engine.tileTarget(ps.at.pos.x, ps.at.pos.y), action: "work" as const },
    };
  }
  /** A grown man of another household, the same one every day for a seed and
   * a purpose: whoever the player answers to at work, or an official. Picked
   * from the generated people, so a replay finds the same man. */
  private grownMan(salt: string) {
    const mine = this.state.households?.find((h) => h.members.includes("player"));
    const men = this.world.initialActors
      .filter((a) => a.kind === "human" && a.householdId && !mine?.members.includes(a.id) &&
        (a.age ?? 0) >= 30 && (a.age ?? 0) < 62 && sexOf(a) === "male")
      .sort((a, b) => a.id.localeCompare(b.id));
    const id = men.length ? men[Math.floor(random(this.state.manifest.seed, salt) * men.length)].id : undefined;
    return this.state.actors.find((a) => a.id === id && !a.dead);
  }
  /** Who a card is said by or of: each official his own man, a neighbour
   * one of the four nearest households, varying by card and day. */
  private cardPerson(card: ChoiceCard, t = this.trade()) {
    const s = this.state, who = card.who;
    if (who === "boss") return this.grownMan("boss");
    if (who === "official") return this.grownMan(`official:${card.as ?? card.id}`);
    if (!t) return;
    const adult = (h?: Household) => s.actors.find((a) => !a.dead && (a.age ?? 0) >= 16 && !!h?.members.includes(a.id));
    if (who === "patient") {
      const id = t.process.steps.map((st) => this.stepPlace(st, t)).find((p) => p?.patient)?.patient;
      return s.actors.find((a) => a.id === id && !a.dead);
    }
    if (who === "client") return adult(this.client(t));
    if (who === "neighbour") {
      const near = (s.households ?? []).filter((o) => o !== t.household && o.residence)
        .sort((a, b) => distance(a.home, t.household.home) - distance(b.home, t.household.home))
        .filter((h) => adult(h)).slice(0, 4);
      return adult(near[Math.floor(random(s.manifest.seed, "neighbour", card.id, t.day) * near.length)]);
    }
  }
  /** Why a choice cannot be taken: something this world never had, or
   * something the player has not got. */
  private forfeitItem() {
    const p = this.state.player;
    return [...Object.keys(p.inventory).filter((id) => (p.inventory[id] ?? 0) > 0), ...(p.heldItem ? [p.heldItem] : [])]
      .filter((id) => id !== "water")
      .sort((a, b) => (this.item(b)?.value ?? 0) - (this.item(a)?.value ?? 0) || a.localeCompare(b))[0];
  }
  private choiceProblem(c: CardChoice) {
    const care = c.then.find((e) => e.type === "care");
    if (care?.type === "care") return this.careOptions(this.state.care?.who ?? "player").find((o) => o.treatment === care.treatment)?.unavailable;
    if (c.then.some((e) => e.type === "forfeit") && !this.forfeitItem()) return "You have no item to hand over.";
    for (const e of c.then)
      if (e.type === "item") {
        const def = this.item(e.item);
        if (!def) return "Nobody here has such a thing.";
        if (e.n < 0 && (this.state.player.inventory[e.item] ?? 0) < -e.n) return `You have no ${def.name.toLowerCase()}.`;
      }
  }
  private absent(c: CardChoice) {
    return c.then.some((e) => e.type === "item" && !this.item(e.item));
  }
  /** A card that can be shown here: its person exists, the society could do
   * what it asks, and at least two of its choices make sense in this world. */
  private usableCard(card: ChoiceCard, t = this.trade()) {
    const setting = this.world.pack.setting;
    return (!card.work || card.work.includes(t?.kit.activity ?? "")) &&
      (!card.who || !!this.cardPerson(card, t)) &&
      (!card.needs || (!!setting && card.needs.every((n) => capabilitiesFor(setting).has(n)))) &&
      (!card.fishing || this.fishingFits(card.fishing, t)) &&
      (!card.hunting || this.huntingFits(card.hunting, t)) &&
      card.choices.filter((c) => !this.absent(c)).length >= 2;
  }
  /** The card waiting on the current day's work; one left from a day gone by
   * lapses. */
  private waitingCard() {
    const t = this.trade(), work = this.state.economy?.work;
    return t && work?.day === t.day ? work.card : undefined;
  }
  /** Puts the card waiting on today's work back on screen. */
  reofferCard() {
    const id = this.state.encounter?.card ?? this.state.care?.card ?? this.waitingCard();
    const card = id && this.choiceCard(id);
    if (card && !this.cards.some((c) => c.choose?.card === id)) this.offerCard(card, this.state.care?.card === id ? this.state.care : undefined);
  }
  /** Puts a card on screen. A card about an illness waits apart from the
   * day's work, so it can come whenever someone falls ill. */
  private offerCard(card: ChoiceCard, care?: { who: string; ailment: string }) {
    const s = this.state, boss = bossTitle(this.world.pack.setting);
    const encounter = s.encounter?.card === card.id;
    const stats = this.stats();
    const person = care ? s.actors.find((a) => a.id === care.who) : this.cardPerson(card);
    const words = care ? this.careWords(person, care.ailment) : this.cardWords(person?.name.split(" ")[0]);
    if (care) s.care = { card: card.id, who: care.who, ailment: care.ailment, at: s.care?.card === card.id && s.care.who === care.who ? s.care.at : s.clock };
    else if (!encounter) s.economy!.work!.card = card.id;
    const drawnStep = this.trade()?.process.steps[s.economy?.work?.drawn ?? -1];
    this.cards.unshift({
      kind: "speech",
      title: encounter ? "On the road" : care ? (person ? person.name : "Unwell") : !person ? (drawnStep ? this.stepTask(drawnStep) : this.dayTitle() ?? s.player.role) : card.who === "boss" ? boss : (card.as ?? (card.who === "patient" ? "unwell" : person.role.toLowerCase())),
      text: cardText(card.text, words),
      speaker: person?.id,
      choose: {
        card: card.id,
        choices: card.choices.flatMap((c, index) => {
          if (this.absent(c)) return [];
          const careEffect = c.then.find((e) => e.type === "care");
          const careOption = careEffect?.type === "care" ? this.careOptions(care?.who).find((o) => o.treatment === careEffect.treatment) : undefined;
          // For the sick, the odds shown are of the care turning a dying illness.
          const tend = c.then.find((e) => e.type === "tend");
          const odds = c.check ? oddsOf(c.check, stats, c.check.skill ? this.skillLevel(c.check.skill) : 0) : !s.manifest.disease && tend?.type === "tend" ? tend.odds : undefined;
          const note = c.note && cardText(c.note, words);
          const minutes = careOption?.minutes ?? c.then.reduce((n, e) => n + (e.type === "minutes" || e.type === "sleep" ? e.n : 0), 0);
          const coin = careOption ? -careOption.coin : c.then.reduce((n, e) => n + (e.type === "item" && e.item === "coin" ? e.n : 0), 0);
          return [{ index, label: cardText(c.label, words), note, odds, minutes: minutes || undefined, coin: coin || undefined, unavailable: this.choiceProblem(c) }];
        }),
      },
    });
  }
  private choose(id: string, n: number) {
    if (id.startsWith("help:")) return this.helpChoose(id, n);
    const s = this.state, p = s.player;
    const care = s.care?.card === id ? s.care : undefined;
    const encounter = s.encounter?.card === id;
    const work = care || encounter ? undefined : s.economy!.work!;
    const card = this.choiceCard(id)!, c = card.choices[n];
    if (encounter) p.encounterAfter = s.clock + 86400;
    if (care) delete s.care;
    else if (encounter) delete s.encounter;
    else delete work!.card;
    const person = care ? s.actors.find((a) => a.id === care.who) : this.cardPerson(card);
    const won = !c.check || this.rng(`card:${id}`) < oddsOf(c.check, this.stats(), c.check.skill ? this.skillLevel(c.check.skill) : 0);
    const effects = won ? c.then : (c.otherwise ?? []);
    const careEffect = effects.find((e) => e.type === "care");
    const careOption = careEffect?.type === "care" ? this.careOptions(care?.who).find((o) => o.treatment === careEffect.treatment) : undefined;
    const sum = (type: string) => effects.reduce((n, e) => n + (e.type === type ? ("delta" in e ? e.delta : "n" in e ? e.n : 0) : 0), 0);
    const changes = [
      { kind: "time", delta: careOption?.minutes ?? sum("minutes") + sum("sleep") },
      { kind: "coin", delta: careOption ? -careOption.coin : effects.reduce((n, e) => n + (e.type === "item" && e.item === "coin" ? e.n : 0), 0) },
      { kind: "pay", delta: sum("pay") },
      { kind: "day", delta: sum("day") },
      { kind: "regard", delta: person ? sum("regard") : 0, who: person?.name.split(" ")[0] },
      { kind: "hurt", delta: sum("hurt") },
    ].filter((ch) => ch.delta);
    for (const e of effects)
      if (e.type === "day") { if (work) work.quality = Math.max(-2, Math.min(2, (work.quality ?? 0) + e.delta)); }
      else if (e.type === "pay") { if (work) work.pay = (work.pay ?? 0) + e.delta; }
      else if (e.type === "risk") {
        if (s.manifest.disease) exposure(s, p, e.ailment, `activity:${id}:${s.clock}`, "activity", -Math.log1p(-Math.min(0.999, e.odds)), s.clock);
        else if (this.rng(`risk:${id}`) < e.odds) this.fallIll(e.ailment);
      }
      else if (e.type === "minutes") this.advance(e.n * 60);
      else if (e.type === "sleep") { if (s.manifest.survival) this.sleep(e.n * 60); else this.advance(e.n * 60); }
      else if (e.type === "fatigue") p.fatigue = Math.max(0, Math.min(100, p.fatigue + e.n));
      else if (e.type === "item") p.inventory[e.item] = Math.max(0, (p.inventory[e.item] ?? 0) + e.n);
      else if (e.type === "forfeit") {
        const item = this.forfeitItem();
        if (item) {
          if (p.heldItem === item) delete p.heldItem;
          else p.inventory[item]!--;
          this.event(`They took your ${this.item(item)?.name.toLowerCase() ?? item}.`);
        }
      }
      else if (e.type === "hurt") this.hurt(e.n, e.cause, e.injury);
      else if (e.type === "care") this.giveCare(care?.who ?? "player", e.treatment);
      else if (e.type === "tend") {
        const who = care ? care.who : person?.id;
        const ail = who && s.ailments?.find((a) => a.who === who && !a.tended);
        if (ail) {
          ail.tended = true;
          if (ail.course === "die" && this.rng(`tend:${ail.who}`) < e.odds) ail.course = "mend";
        }
      } else if (person) this.regard(person, e.delta);
    const line = cardText(won ? c.line : (c.otherwiseLine ?? c.line), care ? this.careWords(person, care.ailment) : this.cardWords(person?.name.split(" ")[0]));
    if (work) work.lines = [...(work.lines ?? []), line];
    const record = (s.record ??= []);
    record.push({ day: work?.day ?? Math.floor(s.clock / 86400), clock: s.clock, card: id, choice: n, line });
    if (record.length > 5000) record.shift();
    this.event(line);
    this.lastChoice = { card: id, line, won: c.check ? won : undefined, changes };
    const t = this.trade();
    if (work && t && t.stage >= t.process.stages.length) this.finishWork(t);
  }
  /** The player's stats as they are today: an illness at its worst takes
   * half their strength, and an injury some more. */
  stats() {
    const s = this.state, p = s.player, base = statsOf(s.manifest.seed, p);
    const k = bodilyLimits(s);
    return { ...base, strength: base.strength * k.physical, agility: base.agility * k.physical, endurance: base.endurance * k.physical, wit: base.wit * k.mental };
  }
  private careWords(person: Actor | undefined, ailment: string) {
    const setting = this.world.pack.setting;
    return {
      ...this.cardWords(person?.name.split(" ")[0]),
      ailment: this.state.manifest.disease ? symptomsOf({ id: ailment }).join(", ") : nameFor(ailmentDef(ailment), setting),
      healer: (setting?.year ?? 0) < 1880 ? "healer" : "doctor",
    };
  }
  /** Someone falls ill: the player, of something a card risked, or anyone
   * the hour's onsets chose. The player and their own are asked what to do. */
  private fallIll(ailment: string, who: Actor = this.state.player) {
    const s = this.state, setting = this.world.pack.setting;
    if ((s.ailments ?? []).some((a) => a.who === who.id)) return;
    const ail = s.manifest.disease ? infect(s, ailment, who, setting, s.clock, "scripted event", "outside") : startAilment(s.manifest.seed, ailmentDef(ailment), who, healthPerson(who, setting), s.clock, false, true);
    (s.ailments ??= []).push(ail);
    if (ail.since <= s.clock) this.offerCare(ail);
  }
  private offerCare(ail: { who: string; id: string }) {
    const s = this.state, setting = this.world.pack.setting;
    const own = ail.who === s.player.id;
    // One at a time; one left unanswered a day lapses.
    if ((s.care && s.clock - s.care.at < 86400) || s.player.dead || (!own && !kinOf(s).some((k) => k.actor.id === ail.who))) return;
    if (s.manifest.disease) {
      s.care = { card: "care-symptoms", who: ail.who, ailment: ail.id, at: s.clock };
      this.offerCard(this.choiceCard("care-symptoms")!, s.care);
      return;
    }
    const card = pickCard(own ? "care-self" : "care-kin", setting,
      weatherAt(skySeed(s.manifest), setting?.climate ?? "temperate", setting?.season ?? "spring", s.clock), s.manifest.seed,
      Math.floor(s.clock / 86400), (c) => c.choices.filter((x) => !this.absent(x)).length >= 2, new Set());
    if (card) this.offerCard(card, { who: ail.who, ailment: ail.id });
  }

  private choiceCard(id: string): ChoiceCard | undefined {
    if (id !== "care-symptoms") return CARDS.find((c) => c.id === id);
    const who = this.state.care?.who;
    if (!who) return;
    return {
      id, slot: "care-self", evidence: "inferred", text: "Symptoms: {ailment}. Decide what care you can arrange; you can also seek help later through the body panel or by inspecting the patient.",
      choices: [...this.careOptions(who).map((o) => ({ label: o.label, note: `${o.note} · ${o.minutes} minutes${o.coin ? ` · ${o.coin} coins` : ""}`, then: [{ type: "care" as const, treatment: o.treatment }], line: o.label })),
        { label: "Decide later", note: "Care remains available", then: [], line: "You put off arranging care." }],
    };
  }

  careOptions(target = "player") {
    if (!this.state.manifest.disease) return [];
    const s = this.state, p = s.player, a = target === p.id ? p : s.actors.find((a) => a.id === target);
    const own = a === p, clock = s.clock, ill = s.ailments?.find((ail) => ail.who === target && severity(ail, clock) > 0);
    const providers = s.actors.filter(practitioner).sort((a, b) => distance(a.pos, p.pos) - distance(b.pos, p.pos) || a.id.localeCompare(b.id));
    const provider = providers.find((a) => distance(a.pos, p.pos) <= 2.5);
    const antibiotic = providers.find((a) => distance(a.pos, p.pos) <= 2.5 && (a.medicalStock?.antibiotic ?? 0) > 0);
    const fluids = providers.find((a) => distance(a.pos, p.pos) <= 2.5 && (a.medicalStock?.rehydration ?? 0) > 0);
    const home = s.households?.find((h) => h.members.includes(p.id));
    const atHome = !!home && (p.pos.space === home.residence || distance(p.pos, home.home) <= 3);
    const hearth = s.objects.some((o) => o.kind === "fire" && !o.broken && !o.depleted && distance(o.pos, p.pos) <= 3);
    const common = !a || a.dead || a.kind !== "human" ? "There is no living patient here." : !own && distance(a.pos, p.pos) > 2.5 ? "Walk within reach of the patient." : undefined;
    const options: Record<Treatment, { label: string; note: string; minutes: number; coin: number; problem?: string }> = {
      rest: { label: "Go to bed and rest", note: "Six hours of rest supports recovery; shelter matters", minutes: 360, coin: 0, problem: !own ? "You can rest yourself; nurse another patient." : undefined },
      nurse: { label: "Arrange nursing care", note: "An hour of close care; support lasts a day, and contact can expose you", minutes: 60, coin: 0, problem: own ? "Choose rest for yourself." : !ill ? "No symptoms need nursing." : undefined },
      "clean-wound": { label: "Clean and dress the wound", note: "Reduces further wound exposure for a day; does not cure an established infection", minutes: 20, coin: 0, problem: !a?.injury?.open || a.injury.until <= clock ? "There is no open wound to dress." : undefined },
      consult: { label: "Consult a local practitioner", note: provider ? `${provider.name}: an assessment and a day of supportive care` : "An assessment and supportive care", minutes: 60, coin: 2, problem: !ill ? "No symptoms to assess." : !provider ? providers[0] ? `Seek ${providers[0].name} (${providers[0].role}) first.` : "No practitioner is present on this map." : undefined },
      medicine: { label: "Seek antibiotic treatment for the wound", note: antibiotic ? `${antibiotic.name} has a course in stock; helps an infected wound, not every illness` : "Requires a practitioner with appropriate medicine in stock", minutes: 60, coin: 3, problem: ill?.id !== "wound" ? "This treatment is for an infected wound." : !antibiotic ? "No nearby practitioner has this medicine." : (ill.infection?.medicineUntil ?? 0) > clock ? "A treatment course is already under way." : undefined },
      rehydration: { label: "Arrange oral rehydration treatment", note: fluids ? `${fluids.name} has supplies; a day of prepared treatment for diarrhea` : "Requires a practitioner with prepared supplies", minutes: 30, coin: 1, problem: ill?.id !== "flux" ? "This treatment is for diarrhea." : !fluids ? "No nearby practitioner has these supplies." : (ill.infection?.fluidsUntil ?? 0) > clock ? "Treatment is already arranged for today." : undefined },
      "prepare-food": { label: "Arrange careful food and water preparation", note: "A day of safer household provisions; no drinking upkeep", minutes: 30, coin: 0, problem: !own ? "Arrange this for your own household." : !atHome && !hearth ? "Return home or find a cooking fire." : (p.preparedFoodUntil ?? 0) > clock ? "Preparation is already arranged for today." : undefined },
    };
    const year = this.world.pack.setting?.year ?? 1500;
    return treatments.filter((t) => (t !== "medicine" || year >= 1945) && (t !== "rehydration" || year >= 1970)).map((treatment) => {
      const o = options[treatment];
      return { treatment, label: o.label, note: o.note, minutes: o.minutes, coin: o.coin, practitioner: ["consult", "medicine", "rehydration"].includes(treatment) && providers[0] ? { id: providers[0].id, name: providers[0].name, pos: { ...providers[0].pos } } : undefined, unavailable: common ?? o.problem ?? ((p.inventory.coin ?? 0) < o.coin ? `You need ${o.coin} coins.` : undefined), command: { type: "care" as const, target, treatment } };
    });
  }

  private giveCare(target: string, treatment: Treatment) {
    const s = this.state, p = s.player, clock = s.clock;
    const a = target === p.id ? p : s.actors.find((a) => a.id === target)!;
    const option = this.careOptions(target).find((o) => o.treatment === treatment)!;
    const ail = s.ailments?.find((ail) => ail.who === target && severity(ail, clock) > 0), i = ail?.infection;
    if (s.care?.who === target) delete s.care;
    p.inventory.coin = Math.max(0, (p.inventory.coin ?? 0) - option.coin);
    if (treatment === "clean-wound" && a.injury) a.injury.cleanUntil = clock + 86400;
    if (treatment === "prepare-food") {
      p.preparedFoodUntil = clock + 86400;
      for (const member of s.actors) if (p.householdId && member.householdId === p.householdId) member.preparedFoodUntil = clock + 86400;
    }
    if (i) {
      if (treatment === "nurse" && ail.id === "flux")
        exposure(s, p, "flux", `${s.manifest.seed}:${a.id}:${i.exposed}`, "care", 0.06, clock);
      if (treatment === "nurse" || treatment === "consult") i.careUntil = clock + 86400;
      if (treatment === "consult") {
        const provider = s.actors.find((x) => practitioner(x) && distance(x.pos, p.pos) <= 2.5)!;
        i.assessment = { by: provider.name, at: clock, text: `The symptoms suggest ${ail.id === "wound" ? "a wound that is infected" : ail.id === "flux" ? "an illness of the bowels" : ail.id === "cough" ? "an illness of the chest" : "an illness requiring observation"}; the cause is uncertain.` };
      }
      if (treatment === "medicine" || treatment === "rehydration") {
        const key = treatment === "medicine" ? "antibiotic" : "rehydration";
        const provider = s.actors.find((x) => practitioner(x) && distance(x.pos, p.pos) <= 2.5 && (x.medicalStock?.[key] ?? 0) > 0)!;
        provider.medicalStock![key]--;
        if (treatment === "medicine") i.medicineUntil = clock + 7 * 86400;
        else i.fluidsUntil = clock + 86400;
      }
    }
    diseaseEvent(s, { clock, kind: "treatment", who: target, disease: ail?.id ?? "prevention", treatment });
    if (treatment === "rest") this.sleep(option.minutes * 60);
    else {
      const before = p.activity;
      p.activity = treatment === "nurse" ? "Caring for the sick" : "Arranging care";
      this.advance(option.minutes * 60, target === p.id ? undefined : target);
      if (!p.dead) p.activity = before;
    }
    this.event(`${option.label}${a === p ? "." : `: ${a.name}.`}`);
  }
  private today() {
    const s = this.state;
    const day = Math.floor(s.clock / 86400);
    if (s.today?.day !== day) s.today = { day, made: {}, trust: {} };
    return s.today;
  }
  /** The day's account, for the card shown on waking. */
  private evening(day: NonNullable<Snapshot["today"]> | undefined) {
    const s = this.state;
    const t = this.trade();
    const closed = day?.day ?? Math.floor(s.clock / 86400) - 1;
    const short: Record<string, number> = {};
    for (const goods of Object.values(s.economy?.short ?? {}))
      for (const g of goods) short[g] = (short[g] ?? 0) + 1;
    const setting = this.world.pack.setting;
    const w = weatherAt(
      skySeed(s.manifest),
      setting?.climate ?? "temperate",
      setting?.season ?? "spring",
      s.clock + 3 * 3600,
    );
    const plot = s.plot && !s.plot.ended && s.plot.owed && s.plot.total ? s.plot : undefined;
    s.evening = {
      day: closed,
      chain: (s.record ?? []).filter((r) => r.day === closed).map((r) => r.line),
      owing: plot && {
        title: plot.title,
        line: plot.owed === plot.total || !setting ? `Nothing paid yet of the ${plot.words.amount}.` : `Still to pay: ${amountIn(setting, plot.owed ?? 0, this.coined())}.`,
      },
      season: setting ? seasonAt(setting.season, closed * 86400 + 43200) : undefined,
      work: t && {
        activity: t.kit.activity,
        stages: t.process.stages.length,
        done: s.economy?.work?.day === closed ? s.economy.work.stage : 0,
        made: day?.made ?? {},
      },
      stock: t && s.economy ? stockOf(s.economy, t.household) : [],
      regard: Object.entries(day?.trust ?? {})
        .filter(([, delta]) => delta)
        .map(([id, delta]) => ({ id, delta })),
      pests: day?.pests,
      short,
      households: s.households?.length ?? 0,
      tomorrow: { condition: w.condition, label: w.label, tempC: w.tempC },
    };
  }
  private doWork(hunted = false) {
    const t = this.trade();
    if (!t || t.stage >= t.process.stages.length) return;
    const s = this.state;
    const { process } = t;
    const empty = process.steps[t.stage].scene === "hunt" && !hunted;
    if (empty && !this.huntOver()) return;
    if (empty) this.emptyHanded(t);
    // The pen stands open while the work is out at grass and while the herd
    // is brought back, so the herd goes out and comes home with you.
    const gate = s.objects.find((o) => o.kind === "gate" && o.owner === "player" && /-pen\d+-gate$/.test(o.id));
    const grazing = (i: number) => process.steps[i]?.at === "pasture" || process.steps[i - 1]?.at === "pasture";
    const herd = gate && s.fauna?.find((g) => g.gateId === gate.id);
    // A pen with no paddock of its own grazes wherever the day's grass is.
    if (herd && !herd.pasture && process.steps[t.stage].at === "pasture") herd.pasture = this.placeStep(t)?.at.pos;
    if (gate) gate.open = grazing(t.stage);
    if (herd) herd.fold = gate!.open && process.steps[t.stage].at !== "pasture";
    // The fish feed at dawn and dusk and run by the season: the hour the
    // boat goes out decides the catch as much as the work does.
    const setting = this.world.pack.setting, practice = process.steps[t.stage].at === "grounds" ? this.fishing(t.household) : undefined;
    const caught = practice && setting && catchOf(setting, practice, (seasonAt(setting.season, s.clock) ?? "spring") as SeasonId,
      (s.clock / 3600) % 24, random(s.manifest.seed, "catch", t.household.id, t.day));
    this.working = true;
    this.advance((process.steps[t.stage].hours ?? process.hours / process.stages.length) * 3600);
    this.working = false;
    const reaped = this.farming(t) ? this.tendFarm(t, process.steps[t.stage].name) : undefined;
    s.economy ??= { hour: Math.floor(s.clock / 3600), stock: {}, short: {} };
    const was = s.economy.work?.day === t.day ? s.economy.work : undefined;
    s.economy.work = { ...was, day: t.day, stage: t.stage + 1, ...(caught ? { catch: caught.factor } : {}),
      ...(reaped !== undefined ? { harvest: reaped } : {}),
      ...(process.steps[t.stage + 1]?.scene === "hunt" ? { since: s.clock } : {}) };
    if (caught) this.event(caught.line);
    if (gate) gate.open = grazing(t.stage + 1);
    if (herd) herd.fold = gate!.open && process.steps[t.stage + 1]?.at !== "pasture";
    // Walked here, the card came on arrival; set down here, it comes now.
    const card = this.drawCard(t, t.stage);
    if (t.stage + 1 < process.stages.length) return;
    // The wage waits for the last card's answer.
    if (!card) this.finishWork({ ...t, stage: t.stage + 1 });
  }
  /** Draws the card for a step, once: on arriving where it is done, or else
   * when it is done. */
  private drawCard(t: NonNullable<ReturnType<Engine["trade"]>>, index: number) {
    const s = this.state, step = t.process.steps[index], work = s.economy?.work;
    if (!step?.card || !work || work.day !== t.day || work.drawn === index) return;
    work.drawn = index;
    const setting = this.world.pack.setting;
    const card = pickCard(step.card, setting,
      weatherAt(skySeed(s.manifest), setting?.climate ?? "temperate", setting?.season ?? "spring", s.clock), s.manifest.seed, t.day,
      (c) => this.usableCard(c, t), new Set((s.record ?? []).map((r) => r.card)));
    if (card) this.offerCard(card);
    return card;
  }
  /** Arriving where the day's next step is done brings its card, so the
   * trouble comes before the work rather than after it. */
  private arrive() {
    const t = this.trade();
    if (!t || t.stage >= t.process.stages.length || this.waitingCard() || !t.process.steps[t.stage].card) return;
    const ps = this.placeStep(t), p = this.state.player.pos;
    const station = ps ? undefined : this.workStation();
    const at = ps ? ps.at.pos : typeof station === "object" ? station.pos : undefined;
    if (!at || at.space !== p.space || distance(p, at) > (ps ? 2.5 : 1.6)) return;
    const s = this.state;
    s.economy ??= { hour: Math.floor(s.clock / 3600), stock: {}, short: {} };
    if (s.economy.work?.day !== t.day) s.economy.work = { day: t.day, stage: t.stage };
    this.drawCard(t, t.stage);
  }
  private finishWork(t: NonNullable<ReturnType<Engine["trade"]>>) {
    const s = this.state;
    const { process, kit, household } = t;
    s.economy ??= { hour: Math.floor(s.clock / 3600), stock: {}, short: {} };
    const work = s.economy.work?.day === t.day ? s.economy.work : undefined;
    if (work) work.done = true;
    const made: Record<string, number> = kit.activity === "Looking for game" ? this.settleHunt(t) : process.paid === "wage" ? this.takings(3, (amount) => `The ${bossTitle(this.world.pack.setting)} pays you ${amount}.`)
      : process.paid === "fee" ? this.pay(t, this.patientHousehold(t))
      : process.steps.some((st) => st.client) ? this.pay(t)
      : this.farming(t) ? this.settleHarvest(t)
      : dayOfWork(s.economy, household, (1 + 0.25 * (work?.quality ?? 0)) * (work?.catch ?? 1) * (1 - this.catchOwed()));
    if (work?.catch !== undefined) Object.assign(made, this.settleCatch(t));
    if (process.paid === "takings") {
      const coin = this.takings(2, (amount) => `You took ${amount} over the day.`);
      for (const [g, n] of Object.entries(dayOfWork(s.economy, household, 1 + 0.25 * (work?.quality ?? 0)))) made[g] = n;
      Object.assign(made, coin);
    }
    // Work that makes nothing the town trades in, a forager's or a fisher's,
    // comes home in the hand instead.
    if (kit.activity !== "Looking for game" && !this.farming(t) && !Object.keys(made).length)
      for (const [item, n] of Object.entries(kit.inventory ?? {}))
        if (n && item !== "tool" && item !== "water" && this.item(item)) {
          s.player.inventory[item] = (s.player.inventory[item] ?? 0) + n;
          made[item] = n;
        }
    const today = this.today().made;
    for (const [g, n] of Object.entries(made)) today[g] = (today[g] ?? 0) + n;
    this.grantXp(process.skill ?? workSkill[process.family], 20);
    if (s.goalFlags) s.goalFlags.worked = true;
    // Money has its own line from whoever paid it; this one names what was made.
    const goods = Object.keys(made).filter((g) => g !== "coin");
    if (goods.length)
      this.event(`You made ${goods.map((g) => household.products?.[g] ? goodName(g, household.products[g]) : this.item(g)?.name.toLowerCase() ?? goodName(g)).join(" and ")}.`);
    else if (!made.coin) this.event("That is the day's work done.");
    if (advanceLifeAim(s, { type: "work" }))
      this.event("You have completed a step toward your life aim.");
    if (s.plot && !s.plot.ended) {
      s.plot.fired.push("worked");
      this.runPlot();
    }
  }
  /** Most households kept a garden beside whatever their trade was. The
   * day's turn in it, for anyone whose trade is not already the land. */
  sideJob() {
    const t = this.trade();
    if (!t || t.process.family === "tend") return;
    const cell = this.garden(t.household);
    if (!cell) return;
    return {
      task: "Weed and water the kitchen garden",
      id: `crop-${cell.x}-${cell.y}`,
      pos: { ...cell, space: "outside" } as Position,
      done: this.state.economy?.side === t.day,
    };
  }
  private gardens = new Map<string, Point | null>();
  /** The household's garden cell nearest its door, or null if it has none. */
  private garden(h: Household) {
    if (this.gardens.has(h.id)) return this.gardens.get(h.id)!;
    let best: Point | null = null,
      far = Infinity;
    for (let dy = -16; dy <= 16; dy++)
      for (let dx = -16; dx <= 16; dx++) {
        const x = h.home.x + dx,
          y = h.home.y + dy;
        const field = this.world.topography?.(x, y)?.field;
        if (!field?.garden || !field.owner || !h.members.includes(field.owner)) continue;
        const d = Math.abs(dx) + Math.abs(dy);
        if (d < far) (best = { x, y }), (far = d);
      }
    this.gardens.set(h.id, best);
    return best;
  }
  private tendGarden() {
    const t = this.trade();
    const side = this.sideJob();
    if (!t || !side || side.done) return;
    const s = this.state;
    s.economy ??= { hour: Math.floor(s.clock / 3600), stock: {}, short: {} };
    s.economy.side = t.day;
    this.advance(90 * 60);
    s.player.fatigue = Math.min(100, s.player.fatigue + 6);
    this.grantXp("farming", 10);
    const field = this.world.topography?.(side.pos.x, side.pos.y)?.field;
    const crop = field && crops[field.crop];
    const item = crop && (this.cropPlant(crop, side.pos.y).yields ?? crop.yields);
    if (item && this.item(item)) {
      s.player.inventory[item] = (s.player.inventory[item] ?? 0) + 1;
      this.today().made[item] = (this.today().made[item] ?? 0) + 1;
      this.event(`You weed and water the garden, and bring in ${this.lootName(item, 1)}.`);
    } else this.event("You weed and water the garden. It will repay the care.");
  }
  /** A wage or a day's takings in coin, moved by how the day went. */
  private takings(base: number, say: (amount: string) => string): Record<string, number> {
    const s = this.state, setting = this.world.pack.setting;
    const work = s.economy?.work;
    if (!setting || !capabilitiesFor(setting).has("coinage") || !this.item("coin")) return {};
    const n = Math.max(0, base + (work?.quality ?? 0) + (work?.pay ?? 0));
    s.player.inventory.coin = (s.player.inventory.coin ?? 0) + n;
    this.event(say(amountIn(setting, n, true)));
    return n ? { coin: n } : {};
  }
  /** The household of whoever the day's sick call was to. */
  private patientHousehold(t: NonNullable<ReturnType<Engine["trade"]>>) {
    const id = t.process.steps.map((st) => this.stepPlace(st, t)).find((p) => p?.patient)?.patient;
    return id ? this.state.households?.find((h) => h.members.includes(id)) : undefined;
  }
  /** A client settles for the day: coin where there is coinage, otherwise
   * something from their own stores. Returns what changed hands. */
  private pay(t: NonNullable<ReturnType<Engine["trade"]>>, client = this.client(t)): Record<string, number> {
    const s = this.state;
    const work = s.economy?.work?.day === t.day ? s.economy.work : undefined;
    const bonus = (work?.quality ?? 0) + (work?.pay ?? 0);
    const host = client && s.actors.find((a) => client.members.includes(a.id));
    const name = host?.name ?? "The household";
    if (host) this.regard(host, 1);
    const setting = this.world.pack.setting;
    if (setting && capabilitiesFor(setting).has("coinage") && this.item("coin")) {
      // A labourer's day, a few small coins; a better-off client pays a little more.
      const n = Math.max(0, 2 + Math.floor(this.rng("wage") * 2) + Math.round((client?.fortune ?? 0.5) * 2) + bonus);
      if (!n) return {};
      s.player.inventory.coin = (s.player.inventory.coin ?? 0) + n;
      this.event(`${name} pays you ${amountIn(setting, n, true)} for the work.`);
      return { coin: n };
    }
    const store = client && s.objects.find((o) => o.id === client.storeId);
    const kind = store && Object.entries(store.inventory ?? {}).find(([id, n]) => n && id !== "tool" && this.item(id)?.edible);
    if (!store || !kind) {
      this.event(`${name} has nothing to spare today, but will remember the work.`);
      if (host) this.regard(host, 1);
      return {};
    }
    const [item, have] = kind;
    const n = Math.min(have!, Math.max(0, 2 + Math.sign(bonus)));
    if (!n) return {};
    store.inventory![item] = have! - n;
    s.player.inventory[item] = (s.player.inventory[item] ?? 0) + n;
    this.event(`${name} pays you in ${this.item(item)!.name.toLowerCase()}.`);
    return { [item]: n };
  }
  /** Today's goals, picked at the first call of each game day. */
  dailyGoals() {
    const s = this.state,
      p = s.player,
      pack = this.world.pack;
    const today = Math.floor(s.clock / (DAY_MINUTES * 60));
    if (s.goalDay !== today) {
      const kit = livelihoodOf(pack, p);
      const context: GoalContext = {
        activity: kit?.activity ?? p.role,
        role: p.role,
        workplace: kit?.workplace,
        season: (pack.setting
          ? seasonAt(pack.setting.season, s.clock)
          : "spring") as SeasonId,
        year: pack.year,
        commodities: pack.commodities,
        currency: pack.currency,
        inventory: p.inventory,
        hunger: p.hunger,
        fatigue: p.fatigue,
        places: this.world.places
          .filter(
            (b) => distance({ ...b.entrance, space: "outside" }, p.pos) < 60,
          )
          .map((b) => ({ name: b.name, sprite: b.sprite })),
      };
      const isolated = pack.setting?.situation?.people === 0;
      const templates = isolated ? GOAL_TEMPLATES.filter(t => t.id === "eat" || t.id === "sleep") : GOAL_TEMPLATES;
      const picked = pickGoals(s.manifest.seed, today, context, templates);
      const day = isolated ? undefined : this.world.agenda?.(p, s.clock);
      const own: DailyGoal[] = (day?.items ?? []).map((item) => ({
        id: item.id,
        slot: "own",
        text: item.text,
        check: item.subject
          ? { type: "talk-to", actor: item.subject }
          : item.pos
            ? { type: "reach", x: item.pos.x, y: item.pos.y }
            : { type: "talk" },
      }));
      const feast = day?.festival;
      if (feast)
        own.unshift({
          id: feast.id,
          slot: "own",
          text: feast.text,
          check: feast.pos
            ? { type: "reach", x: feast.pos.x, y: feast.pos.y }
            : { type: "talk" },
        });
      const made = goodsOf(kit, pack.setting?.economyRevision)[0];
      const product = s.households?.find((h) => h.members.includes(p.id))?.products?.[made];
      const good = made && goodName(made, product);
      const job =
        kit && (kit.workplace === "workshop" || kit.workplace === "market")
          ? commissionFor(s.manifest.seed, today, p, s.actors, good)
          : undefined;
      // The day is its work and its occasions; hunger and company look after themselves.
      const title = this.dayTitle();
      // A trade with a day of its own is that day, whichever work template was picked.
      const work = picked.filter((g) => g.slot === "work" && !feast?.rest);
      s.goals = [
        ...(title && work.length
          ? [{ id: "day-of-work", slot: "work" as const, text: title, check: { type: "work" as const } }]
          : work.map((g) => (g.id === "day-of-work" && job ? { ...g, text: job } : g))),
        ...own,
      ].slice(0, 8);
      for (const g of s.goals)
        if (g.check.type === "gain") g.base = heldCount(p, g.check.items);
      s.goalDay = today;
      s.goalFlags = { traded: false, talked: false, visited: [], talkedTo: [] };
    }
    for (const g of s.goals ?? [])
      if (!g.done && goalDone(g, p, s.goalFlags!)) g.done = true;
    return s.goals ?? [];
  }
  private dropSpot(): Position | undefined {
    const p = this.state.player,
      dir = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ][p.direction];
    return [
      dir,
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]
      .map(([x, y]) => ({ ...p.pos, x: p.pos.x + x, y: p.pos.y + y }))
      .find(
        (pos) =>
          !this.blocked(pos.x, pos.y, pos.space) &&
          this.visible(pos) &&
          !this.state.objects.some(
            (o) => !o.carriedBy && distance(o.pos, pos) < 1,
          ) &&
          !this.state.actors.some((a) => distance(a.pos, pos) < 1) &&
          !this.world.places.some(
            (b) =>
              pos.space === "outside" &&
              distance({ ...b.entrance, space: "outside" }, pos) < 1.5,
          ),
      );
  }
  private propOwnership(o: import("./types").WorldObject, action: string) {
    const p = this.state.player;
    if (o.owner === "player" || o.owner === p.id || (!o.owner && action !== "strike")) return;
    // Smashing things inside an occupied home is a break-in however the door was opened.
    const home = action === "break" && p.pos.space !== "outside" ? this.world.place(p.pos.space) : undefined;
    if (home && this.state.households?.some((h) => h.residence === home.id && h.id !== p.householdId))
      this.breakIn(home, `Saw player smash things in ${home.name.toLowerCase()} with an axe`, "smashed things in");
    const memory = `property:${o.id}`;
    if (p.memories.includes(memory)) return;
    p.memories.push(memory);
    this.offend({
      owner: o.owner,
      at: o.pos,
      cost: (theirs) => o.owner ? (theirs ? 8 : 4) : 1,
      memory: () => `Saw player ${action} ${o.id}`,
      story: { act: ({ break: "smashed", topple: "knocked over", "pick up": "made off with" } as Record<string, string>)[action] ?? action, object: o.name.toLowerCase() },
      text: (w) => `${w.name} saw you ${action} ${o.name.toLowerCase()}.`,
    });
  }
  /** People near enough, and with a clear enough view, to have seen what the
   * player just did. */
  witnesses(radius = 7, at = this.state.player.pos) {
    return this.state.actors.filter(
      (a) =>
        a.kind === "human" && !a.dead &&
        distance(a.pos, at) <= radius &&
        this.visibleFrom(a.pos, at),
    );
  }
  /** The one place a person's trust in the player changes. How they take it
   * shows on them: losing trust angers, a real gain warms, an ordinary
   * friendly exchange is a nod. */
  regard(a: Actor, delta: number, cue?: CueKind) {
    if (!delta) return;
    updateRelationships(this.state, a);
    a.trust += delta;
    updateRelationships(this.state, a);
    if (delta < 0) a.wronged = this.state.clock;
    if (this.state.manifest.survival && delta < 0 && a.trust <= -4 && (delta <= -3 || a.trust <= -6)) this.retaliate(a);
    const t = this.today().trust;
    t[a.id] = (t[a.id] ?? 0) + delta;
    this.cue(a.id, cue ?? regardCue(delta, a.trust), this.state.player.pos);
  }
  /** Something done in front of people that they hold against the player.
   * Whoever it belonged to minds most; the rest are startled by it. */
  private offend(o: {
    owner?: string;
    radius?: number;
    at?: Position;
    cost: (theirs: boolean) => number;
    memory: (theirs: boolean) => string;
    /** What was done, for retelling: "smashed" and "cooking pot", the owner being whose. */
    story: { act: string; object?: string };
    text: (witness: Actor, theirs: boolean) => string;
    /** Named when the owner should find out later if none of theirs saw. */
    lost?: { what: string; pos: Position };
  }) {
    let seen = false;
    for (const w of this.witnesses(o.radius ?? 15, o.at)) {
      const theirs = this.minds(w, o.owner);
      seen ||= theirs;
      if (o.cost(theirs) <= 0) continue;
      this.witnessReaction(w, o.memory(theirs), o.cost(theirs));
      this.regard(w, -o.cost(theirs), theirs || !o.owner ? "anger" : "alarm");
      if (o.cost(theirs) >= 3) this.provoke(w, `${o.story.act} ${o.story.object ?? "property"}`);
      w.memories.push(o.memory(theirs));
      hear(w, { ...o.story, victim: o.owner, tone: -o.cost(theirs), at: this.state.clock, hops: 0 });
      if (theirs && o.cost(true) >= 8 && random(this.state.manifest.seed, "complain", w.id, this.state.clock) < 0.5)
        this.complain(w, { ...o.story, victim: o.owner, tone: -o.cost(true), at: this.state.clock, hops: 0 });
      this.event(o.text(w, theirs), "social");
    }
    if (seen || !o.owner || !o.lost) return;
    const p = this.state.player;
    // Anyone about, seeing or not, is someone who can say the player was there.
    const suspect = this.state.actors.some(
      (a) => a.kind === "human" && distance(a.pos, p.pos) < 25,
    );
    (this.state.losses ??= []).push({
      owner: o.owner,
      ...o.lost,
      pos: copy(o.lost.pos),
      clock: this.state.clock,
      suspect,
    });
  }
  witnessedOffense?: { id: string; at: number; situation: string; severity: number };
  private witnessReaction(w: Actor, what: string, severity: number) {
    const pending = this.witnessedOffense;
    if (pending && this.state.clock - pending.at < 10 && pending.severity > severity) return;
    this.witnessedOffense = {
      id: w.id, at: this.state.clock, severity,
      situation: `Just now: ${what}. You witnessed this yourself. React immediately to the player, in character. Let fear, anger, concern for the victim, ownership and your temperament shape your response. Demand they stop, protect what matters, call for help or back away as appropriate. Ordinary work and lawful hunting need not cause outrage. Do not greet them or continue casual small talk. Describe only your own reaction; do not invent injuries, punishment or actions by other people.`,
    };
  }
  /** A household member who comes near a loss finds it, and holds it against
   * the player if anyone had seen them about. */
  private discover(a: Actor) {
    const losses = this.state.losses;
    if (!losses?.length || a.pos.space !== "outside") return;
    for (let i = losses.length - 1; i >= 0; i--) {
      const l = losses[i];
      if (distance(a.pos, l.pos) > 6 || !this.minds(a, l.owner)) continue;
      losses.splice(i, 1);
      const h = this.household(a.householdId);
      if (h) {
        (h.history ??= []).push({
          year: this.state.manifest.setting?.year ?? 0,
          kind: "robbed",
        });
        h.fortune = Math.max(0.02, (h.fortune ?? 0.5) - 0.03);
      }
      if (!l.suspect) {
        a.memories.push(`Found ${l.what} gone, and no idea who took it`);
        continue;
      }
      a.memories.push(`Found ${l.what} gone; the player was seen about`);
      this.regard(a, -3, "anger");
      this.complain(a, { act: "stole from", object: "household", victim: a.id, tone: -6, at: this.state.clock, hops: 0 });
      this.event(
        `${a.name} has found ${l.what} gone, and has heard you were about.`,
        "social",
      );
    }
  }
  /** Asks the renderer to act something out. Cosmetic: nothing reads it back. */
  cue(who: string, cue: CueKind, toward?: Point) {
    this.signal({
      kind: "cue",
      who,
      cue,
      toward: toward && { x: toward.x, y: toward.y },
    });
  }
  rng(purpose: string) {
    return random(
      this.state.manifest.seed,
      "simulation",
      purpose,
      this.state.randomCounter++,
    );
  }
  event(text: string, kind: GameEvent["kind"] = "action", pos?: Position) {
    const e = {
      id: (this.state.events.at(-1)?.id ?? 0) + 1,
      time: this.state.clock,
      text,
      kind,
      pos: pos ? copy(pos) : undefined,
    };
    this.state.events.push(e);
    if (this.state.events.length > 160) this.state.events.shift();
  }
  private tickObstacles?: Map<string, typeof this.state.objects>;
  // Per-advance indexes. All undefined outside advance(), where the callers
  // fall back to the linear scans they replace.
  private barriersAt?: Map<string, WorldObject[]>;
  private actorsAt?: Map<string, Actor[]>;
  private actorCell?: Map<string, string>;
  private actorsById?: Map<string, Actor>;
  private objectsById?: Map<string, WorldObject>;
  private householdsById?: Map<string, Household>;
  private loads?: ReturnType<typeof carryKit>;
  private resourceObjects?: WorldObject[];
  private terrainCollision = new Map<string, boolean>();
  private interiors = new Map<string, InteriorLayout | null>();
  private wallCells?: Set<string>;
  private wallCellsFor = -1;
  /** A cell belonging to an enclosure circuit: a wall you can stand on, as
   * opposed to a building footprint or a tree. Districts push enclosures as
   * they activate, so the index is rebuilt when their number changes. */
  wallAt(x: number, y: number, space = this.state.player.pos.space) {
    if (space !== "outside") return false;
    const all = this.world.enclosures ?? [];
    if (!this.wallCells || this.wallCellsFor !== all.length) {
      this.wallCells = new Set();
      for (const e of all)
        for (const part of e.parts ?? [])
          this.wallCells.add(`${part.x},${part.y}`);
      this.wallCellsFor = all.length;
    }
    return this.wallCells.has(`${x},${y}`);
  }
  /** Past the edge of the playable map: map travel's business, not a wall to climb. */
  offMap(x: number, y: number) {
    const size = this.world.pack.setting?.playableMap?.size;
    if (size === undefined || this.state.player.pos.space !== "outside") return false;
    const half = size / 2;
    return x < -half || x >= half || y < -half || y >= half;
  }
  /** Standing on top of a wall, rather than beside it. */
  onWall() {
    const p = this.state.player.pos;
    return this.wallAt(p.x, p.y, p.space);
  }
  /** Re-files an actor in actorsAt after any write to a.pos, including ones
   * made by livelihood callbacks the engine does not own. */
  private syncActor(a: Actor) {
    if (!this.actorsAt || !this.actorCell) return;
    const key = `${a.pos.space}:${a.pos.x},${a.pos.y}`;
    const old = this.actorCell.get(a.id);
    if (old === key) return;
    if (old !== undefined) {
      const bucket = this.actorsAt.get(old);
      if (bucket) {
        const i = bucket.indexOf(a);
        if (i >= 0) bucket.splice(i, 1);
      }
    }
    const bucket = this.actorsAt.get(key);
    if (bucket) bucket.push(a);
    else this.actorsAt.set(key, [a]);
    this.actorCell.set(a.id, key);
  }
  private moveActor(a: Actor, pos: Position) {
    a.pos = pos;
    this.syncActor(a);
  }
  /** Same-cell test standing in for `actors.some(o => distance(o.pos, p) < 1)`;
   * positions are integer cells, so the two agree. */
  /** Someone in the player's path who will not step aside: anyone but the
   * player's own household, who trade places with them. */
  inPlayerWay(p: Position) {
    const home = this.state.player.householdId;
    return this.state.actors.some((o) =>
      o.pos.space === p.space && o.pos.x === p.x && o.pos.y === p.y &&
      !(home && o.householdId === home && o.id !== this.conversing));
  }
  actorAt(p: Position, excludeId: string) {
    if (this.actorsAt)
      return (
        this.actorsAt
          .get(`${p.space}:${p.x},${p.y}`)
          ?.some((o) => o.id !== excludeId) ?? false
      );
    return this.state.actors.some(
      (o) =>
        o.id !== excludeId &&
        o.pos.space === p.space &&
        o.pos.x === p.x &&
        o.pos.y === p.y,
    );
  }
  /** Take the crop off one cell. Your own ground is work and pays in skill;
   * somebody else's is theft, and the neighbours mind it. */
  private pickCrop(x: number, y: number) {
    const p = this.state.player;
    const field = this.world.topography?.(x, y)?.field;
    if (!field) return;
    const crop = crops[field.crop];
    if (!pickable(crop)) return;
    const edit = this.editAt(x, y);
    edit.picked = this.state.clock;
    this.tilesChanged();
    // A practised hand gets more off the same plant.
    const extra =
      this.rng("harvest") <
      this.skillLevel("farming") * PER_LEVEL.harvestExtra +
        (this.knows("good-seed") ? 0.25 : 0)
        ? 1
        : 0;
    const taken = 1 + extra;
    const plant = this.cropPlant(crop, y);
    const item = plant.yields ?? crop.yields;
    p.inventory[item] = (p.inventory[item] ?? 0) + taken;
    const what = this.lootName(item, taken);
    const picking = plant.name;
    if (this.worksFor(field.owner)) {
      this.grantXp("farming", 8);
      this.event(`You take ${what} off the ${picking.toLowerCase()}.`);
      this.advance(20);
      return;
    }
    this.grantXp("farming", 3);
    this.event(`You take ${what} from a crop that is not yours.`);
    p.memories.push(`theft:crop-${x}-${y}:${item}`);
    // Judged before the clock moves: whoever is standing there now is who
    // saw it, not whoever has wandered past twenty seconds later.
    this.offend({
      owner: field.owner,
      cost: (theirs) => (theirs ? 6 : 3),
      story: { act: "stole from", object: "field" },
      memory: (theirs) =>
        theirs
          ? `Saw player take my crop at ${x},${y}`
          : `Saw player take a neighbour's crop at ${x},${y}`,
      text: (w, theirs) =>
        theirs
          ? `${w.name} catches you taking from their own crop.`
          : `${w.name} sees you taking a crop that is not yours.`,
      lost: {
        what: `the ${picking.toLowerCase()} stripped`,
        pos: { x, y, space: "outside" },
      },
    });
    this.advance(20);
  }
  /** What is growing in a cell: a kitchen garden's bed is a particular
   * vegetable of its place and time, a field is its crop. */
  cropPlant(crop: (typeof crops)[keyof typeof crops], y: number) {
    const setting = this.state.manifest.setting;
    const bed = crop.id === "vegetables" && setting
      ? gardenPlant(setting, this.state.manifest.seed, y)
      : undefined;
    return {
      name: bed?.name ?? crop.plant ?? crop.label,
      latin: bed?.latin ?? crop.latin,
      yields: bed ? vegetableId(bed) : crop.yields,
    };
  }
  /** A swing through standing crops cuts them down; a ripe one is gathered
   * as it falls. Someone else's is a loss they will notice. */
  private cutCrops(hits: Hit[]) {
    const p = this.state.player;
    let cut: { name: string; x: number; y: number; owner?: string } | undefined;
    const got: Record<string, number> = {};
    for (const h of hits) {
      if (h.solid) continue;
      const { x, y } = h.at;
      const field = this.world.topography?.(x, y)?.field;
      const crop = field && crops[field.crop];
      if (!field || !pickable(crop) || (field.stage !== "green" && field.stage !== "ripe")) continue;
      const edit = this.editAt(x, y);
      if (this.pickedNow(edit)) continue;
      edit.picked = this.state.clock;
      h.damaged = true;
      const plant = this.cropPlant(crop, y);
      if (!cut || (!this.worksFor(field.owner) && this.worksFor(cut.owner)))
        cut = { name: plant.name, x, y, owner: field.owner };
      if (field.stage !== "ripe") continue;
      const item = plant.yields ?? crop.yields;
      got[item] = (got[item] ?? 0) + 1;
      h.loot = [...(h.loot ?? []), { item, n: 1 }];
    }
    if (!cut) return undefined;
    this.tilesChanged();
    for (const [item, n] of Object.entries(got))
      p.inventory[item] = (p.inventory[item] ?? 0) + n;
    const name = cut.name.toLowerCase();
    if (!this.worksFor(cut.owner)) {
      const at = cut;
      this.offend({
        owner: at.owner,
        cost: (theirs) => (theirs ? 8 : 3),
        story: { act: "cut down", object: name },
        memory: (theirs) =>
          theirs
            ? `Saw player cut down my ${name} at ${at.x},${at.y}`
            : `Saw player cut down a neighbour's ${name} at ${at.x},${at.y}`,
        text: (w, theirs) =>
          theirs
            ? `${w.name} sees you hack down their ${name}.`
            : `${w.name} sees you hack down a crop that is not yours.`,
        lost: { what: `the ${name} cut down`, pos: { x: at.x, y: at.y, space: "outside" } },
      });
    } else this.grantXp("farming", 2);
    const gathered = Object.entries(got).map(([item, n]) => this.lootName(item, n));
    return gathered.length
      ? `You cut down the ${name} and gather ${listing(gathered)}.`
      : `You cut down the ${name}, green as it is.`;
  }
  /** Whether ground held by `owner` is the player's to work: their own, their
   * household's, or nobody's. Anything else is somebody else's crop. */
  private worksFor(owner: string | undefined) {
    return !owner || owner === "player" || this.minds(this.state.player, owner);
  }
  /** Whether a loss falls on this person: they hold the thing, or they share
   * the household that does. A wife minds about her husband's cow. */
  private minds(who: Actor, owner: string | undefined) {
    if (!owner) return false;
    return (
      who.id === owner ||
      !!this.household(who.householdId)?.members.includes(owner)
    );
  }
  /** Whose a thing is, said as a person would: by the household's name. */
  belongsTo(owner: string | undefined) {
    if (!owner) return "";
    if (owner.endsWith("-community")) return "It is shared by the whole settlement.";
    if (this.minds(this.state.player, owner) || owner === "player")
      return "It is your household's.";
    const house = this.state.households?.find((h) => h.members.includes(owner));
    const head = [this.state.player, ...this.state.actors].find(
      (a) => a.id === (house?.members[0] ?? owner),
    );
    return head
      ? `It belongs to ${head.name}'s household.`
      : "It belongs to someone here.";
  }
  private household(id: string | undefined) {
    return this.householdsById
      ? id === undefined
        ? undefined
        : this.householdsById.get(id)
      : this.state.households?.find((h) => h.id === id);
  }
  private object(id: string | undefined) {
    return this.objectsById
      ? id === undefined
        ? undefined
        : this.objectsById.get(id)
      : this.state.objects.find((o) => o.id === id);
  }
  /** Rolled from the name so it follows the player across maps without being saved. */
  canSwim() {
    const p = this.state.player;
    return p.canSwim ?? (p.afloat === "swimming" || random("can-swim", p.name) < 0.5);
  }
  private deep(x: number, y: number) {
    return !!this.world.topography &&
      waterDepthAt(this.world.topography, x + 0.5, y + 0.5) > MAX_WADING_DEPTH;
  }
  /** The player as they would float: a swimmer counts as afloat in deep water. */
  private floater(deep: boolean) {
    const p = this.state.player;
    return deep && this.canSwim() && !p.afloat ? { ...p, afloat: "swimming" as const } : p;
  }
  playerCanCross(from: Point, to: Point) {
    const deep = this.deep(from.x, from.y) || this.deep(to.x, to.y);
    const p = this.floater(deep);
    if (afloatAt(this.world, p, from.x, from.y) && afloatAt(this.world, p, to.x, to.y))
      return (!((from.x !== to.x) && (from.y !== to.y)) ||
        (afloatAt(this.world, p, from.x, to.y) && afloatAt(this.world, p, to.x, from.y)));
    // Hauling out of deep water onto a bank the wading rule would refuse.
    if (p.afloat === "swimming" && afloatAt(this.world, p, from.x, from.y) &&
      (from.x === to.x || from.y === to.y) && !this.deep(to.x, to.y))
      return !this.blocked(to.x, to.y, "outside");
    return this.world.canCross?.(from, to) ?? true;
  }
  playerBlocked(x: number, y: number, space = this.state.player.pos.space) {
    if (space !== "outside" && this.interiorOf(space)?.locks.has(`${x},${y}`) && !this.welcomeIn(space)) return true;
    return space === "outside" && afloatAt(this.world, this.floater(this.deep(x, y)), x, y)
      ? false : this.blocked(x, y, space);
  }
  /** A household's private rooms open to its own, and to anyone one of them
   * trusts well: Stardew's two hearts. */
  welcomeIn(space: string) {
    const h = this.state.households?.find((g) => g.residence === space);
    if (!h || h.members.includes("player")) return true;
    return h.members.some((id) => (this.state.actors.find((a) => a.id === id)?.trust ?? 0) >= 2);
  }
  /** The generated room of a house, built the first time anyone needs it.
   * The household's bed, chest, work station and way out move onto the
   * room's own pieces, so what is drawn is what is used. */
  interiorOf(space: string): InteriorLayout | undefined {
    if (space === "outside") return undefined;
    const known = this.interiors.get(space);
    if (known !== undefined) return known ?? undefined;
    const place = this.world.place(space);
    const entrance = place?.entrance;
    const s = (entrance && this.world.geography?.packAt(entrance.x,entrance.y)?.setting) ?? this.world.pack.setting;
    const household = this.state.households?.find((h) => h.residence === space);
    if (!place || (place.access !== "household" && !household && !buildingUse(place.claim)) || !s) {
      this.interiors.set(space, null);
      return undefined;
    }
    const head = [this.state.player, ...this.state.actors].find((a) => a.id === (household?.members[0] ?? place.owner));
    const exit = this.state.objects.find((o) => o.kind === "exit" && o.pos.space === space);
    const room = buildInterior(
      place,
      {
        lon: s.lon,
        lat: s.lat,
        year: s.year,
        settlement: s.settlement,
        camp: s.settlement === "camp" || (!!s.situation && s.situation.camp !== "none"),
        roofHatch: exit?.sprite === "ladder",
        use: buildingUse(place.claim),
        frame: place.sprite,
        climate: s.climate,
      },
      { fortune: household?.fortune, activity: head && livelihoodOf(this.world.pack, head)?.activity, hour: (this.state.clock / 3600) % 24, good: household?.makes?.[0], bench: propDefs[this.object(`${space}-work`)?.prop ?? ""]?.family },
    );
    this.interiors.set(space, room);
    const move = (id: string, p: Point) => {
      const o = this.object(id);
      if (o) o.pos = { x: p.x, y: p.y, space };
    };
    move(`${space}-exit`, room.exit);
    move(`${space}-bed`, room.bedCell);
    move(`${space}-chest`, room.store);
    move(`${space}-work`, room.benchCell ?? room.workCell);
    // A room met again, from a save or a second engine, keeps the furniture it has.
    if (!this.state.objects.some((o) => o.id.startsWith(`${space}-room-`)))
      for (const f of room.furniture) {
        const key = regionalContainer(s,f.def,random(this.state.manifest.seed,"room-container",space,f.propId)) ?? f.def;
        const def = propDefs[key];
        this.state.objects.push({
          id: `${space}-room-${f.propId}`,
          name: def.name,
          kind: def.container ? "container" : "monument",
          prop: key,
          pos: { ...f.pos, space },
          sprite: def.sprite ?? "",
          inventory: {},
          owner: place.owner,
          ...(f.size[0] * f.size[1] > 1 ? { size: f.size } : {}),
        });
      }
    for (const k of [...this.terrainCollision.keys()]) if (k.startsWith(`${space}:`)) this.terrainCollision.delete(k);
    return room;
  }
  private indoorUses = new Map<string, Spot & { role: SpotRole; space: string; cooking?: boolean }>();
  /** What someone indoors is at: the bed they lie in, the seat they sit on,
   * the work or fire they stand at. Undefined for anyone just standing about. */
  indoorUse(id: string, pos: Position): (Spot & { role: SpotRole; cooking?: boolean }) | undefined {
    const room = pos.space === "outside" ? undefined : this.interiorOf(pos.space);
    if (!room) return undefined;
    const sent = this.indoorUses.get(id);
    if (sent && sent.space === pos.space && sent.x === pos.x && sent.y === pos.y) return sent;
    // Placed before this engine was: read it off where they are.
    return spotsAt(room, pos.x, pos.y)[0];
  }
  /** Where someone indoors stands: by their bed at night, at the household's
   * work while working, at the fire to cook or eat, else a seat; never on
   * top of anyone else, and facing what they are at. */
  indoorSpot(a: Actor, space: string, label = "", index = 0): Position {
    const room = this.interiorOf(space);
    if (!room) return { x: 3 + (index % 4), y: 3, space };
    const hour = (this.state.clock / 3600) % 24;
    const l = label.toLowerCase();
    const trade = livelihoodOf(this.world.pack, a)?.activity.toLowerCase().split(/\s+/)[0];
    // In a taproom the household serves while it is up, and nobody else is put to bed.
    const serving = room.params.program === "serve" || room.params.program === "shop", resident = this.household(a.householdId)?.residence === space;
    const sleeping = /sleep|night|\bbed/.test(l) || ((resident || !serving) && (hour < 5.5 || hour >= 22));
    const cooking = !sleeping && /cook|eat|meal|supper|breakfast|dinner|hearth|fire|kitchen/.test(l);
    const working = !sleeping && !cooking && ((serving && resident && (a.age ?? 30) >= 14) || (!!trade && l.includes(trade)) || /work|weav|spin|pott|writ|sew|mend|grind|count|trad|keep|craft|carv|brew|bak/.test(l));
    const order = sleeping ? [room.beds] : working ? [room.work, room.fire, room.seats] : cooking ? [room.fire, room.seats]
      : serving && !resident ? [room.seats.filter((s) => s.on), room.seats, room.fire] : [room.seats, room.fire, room.work];
    const taken = new Set(
      [this.state.player, ...this.state.actors]
        .filter((o) => o !== a && o.pos.space === space)
        .map((o) => `${o.pos.x},${o.pos.y}`),
    );
    const moved = new Set(
      room.furniture
        .filter((f) => {
          const o = this.object(`${space}-room-${f.propId}`);
          return !o || o.broken || o.tipped || o.pos.x !== f.pos.x || o.pos.y !== f.pos.y;
        })
        .map((f) => f.propId),
    );
    for (const [n, list] of order.entries()) {
      const free = list.filter((p) => !taken.has(`${p.x},${p.y}`) && !moved.has(p.propId) && (p.on || !this.blocked(p.x, p.y, space)));
      if (!free.length) continue;
      // The front of the work goes to whoever works it; seats and beds are shared out.
      const spot = n === 0 && working ? free[0] : free[index % free.length];
      a.direction = spot.facing;
      delete a.facing;
      this.indoorUses.set(a.id, { ...spot, role: list === room.beds ? "bed" : list === room.work ? "work" : list === room.fire ? "fire" : "seat", space, cooking });
      return { x: spot.x, y: spot.y, space };
    }
    const exit = `${room.exit.x},${room.exit.y}`;
    // Whoever has no bed sleeps on the floor, near the fire if there is one.
    const warm = room.fire[0] ?? room.entry;
    const floor = [...room.walk]
      .map((k) => k.split(",").map(Number))
      .filter(([x, y]) => !taken.has(`${x},${y}`) && `${x},${y}` !== exit && !this.blocked(x, y, space) && !(x === room.entry.x && y === room.entry.y))
      .sort(([ax, ay], [bx, by]) => (sleeping ? Math.hypot(ax - warm.x, ay - warm.y) - Math.hypot(bx - warm.x, by - warm.y) : 0));
    // A standing congregation fills the nave below the chancel, front rows first, facing the altar.
    const altar = room.params.program === "rows" ? room.props.find((q) => q.kind === "altar") : undefined;
    if (altar && !sleeping) {
      const head = altar.y + ROOM_ORIGIN + 3, mid = altar.x + ROOM_ORIGIN + altar.w / 2;
      const nave = floor.filter(([, y]) => y >= head).sort(([ax, ay], [bx, by]) => ay - by || Math.abs(ax + 0.5 - mid) - Math.abs(bx + 0.5 - mid));
      if (nave.length) {
        a.direction = 0;
        return { x: nave[0][0], y: nave[0][1], space };
      }
    }
    const [x, y] = floor[sleeping ? index % Math.min(3, floor.length || 1) : 0] ?? exit.split(",").map(Number);
    if (sleeping) this.indoorUses.set(a.id, { x, y, facing: 2, kind: "mat", propId: -1, on: "bed", role: "bed", space });
    return { x, y, space };
  }
  /** Walls, water and built-in pieces: what stands there whatever anyone moves. */
  private ground(x: number, y: number, space: string) {
    const key = `${space}:${x},${y}`;
    let fixed = this.terrainCollision.get(key);
    if (fixed === undefined) {
      const room = space === "outside" ? undefined : this.interiorOf(space);
      fixed = room ? !room.floor.has(`${x},${y}`) : this.world.blocked(x, y, space);
      trimCache(this.terrainCollision, 16384);
      this.terrainCollision.set(key, fixed);
    }
    return fixed;
  }
  blocked(x: number, y: number, space = this.state.player.pos.space) {
    const key = `${space}:${x},${y}`;
    return (
      this.ground(x, y, space) ||
      (
        this.tickObstacles?.get(key) ??
        (this.tickObstacles ? [] : this.state.objects)
      ).some(
        (o) =>
          (isShutBarrier(o) ||
            (!!o.prop &&
              !!propDefs[o.prop]?.solid &&
              !o.carriedBy &&
              !o.broken &&
              !o.submerged)) &&
          o.pos.space === space &&
          covers(o, x, y),
      )
    );
  }
  traversal(
    from: Position,
    dx: number,
    dy: number,
    jump?: "short" | "long",
    running?: boolean,
  ): LeapResult | { kind: "blocked"; reason: string } {
    const to = { x: from.x + dx, y: from.y + dy };
    const clear = (p: Point) => !this.blocked(p.x, p.y, from.space);
    if (jump) {
      const sample = (x: number, y: number) => {
        const cell =
          from.space === "outside" && this.world.topography
            ? this.world.topography(x, y)
            : { height: 0, surface: "grass" as const };
        if (!cell) return cell;
        const water = cell.surface === "water" && !cell.bridge;
        const blocking = this.state.objects.filter(
          (o) =>
            o.pos.space === from.space &&
            o.pos.x === x &&
            o.pos.y === y &&
            (isShutBarrier(o) ||
              (!!o.prop &&
                !!propDefs[o.prop]?.solid &&
                !o.carriedBy &&
                !o.broken)),
        );
        // A pot or a basket is cleared in the air; a loom or a well is not.
        // A hen is cleared in the air like a pot; a sheep is not.
        const beast = from.space === "outside" ? this.faunaAt(x, y) : undefined;
        const beastMass = beast
          ? faunaCombat(faunaProfile(beast.g.speciesId)!).mass
          : 0;
        // A boulder is vaulted like a pot.
        const rock =
          from.space === "outside" &&
          isRock(this.world.decoration(x, y)?.sprite);
        const fence = x === to.x && y === to.y && this.fenceAhead(dx, dy);
        const overable =
          (blocking.length > 0 || !!beast || rock || fence) &&
          blocking.every((o) => lowProp(o)) &&
          beastMass === 0;
        const obstacle = (blocking.length > 0 || !!beast) && !overable;
        return {
          ...cell,
          over: overable || undefined,
          solid:
            (cell.solid && !((rock || fence) && overable)) ||
            obstacle ||
            (!water && !overable && !clear({ x, y })),
        };
      };
      const result = terrainJump(sample, from, to, jump, running);
      if (result.kind === "blocked") return result;
      const landing = {
        x: from.x + dx * result.distance,
        y: from.y + dy * result.distance,
      };
      return clear(landing) &&
        !(from.space === "outside" && this.faunaAt(landing.x, landing.y))
        ? result
        : { kind: "blocked", reason: "Something is in the way." };
    }
    if (from.space === "outside" && this.world.topography) {
      const sample = (x: number, y: number) => this.world.topography!(x, y);
      const result = terrainLeap(sample, from, to);
      // Props and gates sit above the terrain contract and still block a landing.
      if (result.kind === "blocked") return result;
      const landing =
        result.distance === 2 ? { x: to.x + dx, y: to.y + dy } : to;
      return clear(landing) &&
        !(from.space === "outside" && this.faunaAt(landing.x, landing.y))
        ? result
        : { kind: "blocked", reason: "Something is in the way." };
    }
    if (
      clear(to) &&
      !(
        dx &&
        dy &&
        (!clear({ x: to.x, y: from.y }) || !clear({ x: from.x, y: to.y }))
      )
    )
      return {
        kind: "hop",
        distance: 1,
        seconds: 3,
        reason: "You hop forward.",
      };
    // Without a terrain contract there is no way to tell a ditch from a wall,
    // so a jump reaches open ground only.
    return { kind: "blocked", reason: "There is no way over that." };
  }
  /** A knee-high prop in the next cell: what a step bumps into and a hop
   * clears. Diagonals count the corners too, since those block the step. */
  /** Something a running jump carries the player over: a low prop or a
   * boulder in the next cell. */
  vaultAhead(dx: number, dy: number) {
    const p = this.state.player.pos;
    return (
      !!this.lowPropAhead(dx, dy) ||
      this.fenceAhead(dx, dy) ||
      (p.space === "outside" &&
        isRock(this.world.decoration(p.x + dx, p.y + dy)?.sprite))
    );
  }
  fenceAhead(dx: number, dy: number) {
    const p = this.state.player.pos;
    if (p.space !== "outside" || !this.world.topography) return false;
    const x = p.x + dx, y = p.y + dy;
    const field = (cx: number, cy: number) => this.world.topography!(cx, cy)?.field;
    const tier = (cx: number, cy: number) => this.world.topography!(cx, cy)?.height;
    return [...boundaryGraph(field, x, y, x + 1, y + 1, tier).values()].some(
      (node) => node.cx === x && node.cy === y && node.links !== 0,
    );
  }
  lowPropAhead(dx: number, dy: number) {
    const p = this.state.player.pos;
    const at = (x: number, y: number) =>
      this.state.objects.find(
        (o) =>
          o.pos.space === p.space &&
          o.pos.x === x &&
          o.pos.y === y &&
          lowProp(o),
      );
    return at(p.x + dx, p.y + dy);
  }
  /** What the player could climb from where they stand: a solid prop, a tree,
   * a building or wall, or ground one to three steps higher. Adjacent only —
   * you climb what you can reach. Ordered nearest first so the prompt is
   * predictable. A `to` cell means the climb ends standing there rather than
   * perched on top. */
  /** The cell a held tool lands on: the one the player faces. */
  facingCell(): Point {
    const p = this.state.player,
      d = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ][p.direction];
    return { x: p.pos.x + d[0], y: p.pos.y + d[1] };
  }
  heldTool() {
    return propDefs[heldObject(this.state)?.prop ?? ""]?.tool;
  }
  /** What a blow landing on this cell would find. Props first, then whoever
   * is standing there, then what grows on it, then the ground itself. */
  hitClass(
    x: number,
    y: number,
    space: string,
  ): { hit: HitClass; sprite?: string; prop?: WorldObject } {
    const prop = this.state.objects.find(
      (o) =>
        o.prop &&
        !o.carriedBy &&
        o.pos.space === space &&
        covers(o, x, y) &&
        o.id !== this.state.player.held,
    );
    if (prop) {
      const def = propDefs[prop.prop!];
      const material: Record<string, HitClass> = {
        clay: "pottery",
        glaze: "pottery",
        wood: "timber",
        metal: "metal",
        fiber: "fiber",
        plastic: "fiber",
        paper: "fiber",
      };
      const hit: HitClass = def?.fire
        ? "fire"
        : (material[def?.breakable ?? ""] ?? "timber");
      return { hit, sprite: prop.sprite, prop };
    }
    const actor = this.state.actors.find(
      (a) => a.pos.x === x && a.pos.y === y && a.pos.space === space,
    );
    if (actor) return { hit: "creature", sprite: actor.id };
    if (space === "outside") {
      if (this.faunaAt(x, y)) return { hit: "creature" };
      const plant = this.world.decoration(x, y);
      if (plant) {
        if (isRock(plant.sprite)) return { hit: "rock", sprite: plant.sprite };
        if (plant.sprite === STUMP_SPRITE || plant.sprite === LOGS_SPRITE)
          return { hit: "trunk", sprite: plant.sprite };
        const c = plantClass(plant.sprite);
        if (c === "grass") return { hit: "grass", sprite: plant.sprite };
        if (c === "shrub") return { hit: "brush", sprite: plant.sprite };
        if (c !== "none") return { hit: "tree", sprite: plant.sprite };
      }
      if (this.cropAt(x, y)) return { hit: "crop" };
    }
    return { hit: this.groundClass(x, y, space) };
  }
  /** The bare surface of a cell, with nothing standing on it. */
  groundClass(x: number, y: number, space: string): HitClass {
    return GROUND_HIT[this.world.terrain(x, y, space)] ?? "air";
  }
  /** The three cells a swing sweeps: what you face, and the corner to each
   * side of it. */
  private swingCone(direction: number, power = 0, reach = 0) {
    const p = this.state.player.pos;
    const d = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ][direction];
    // Perpendicular, for the two corners.
    const s = [-d[1], d[0]];
    // A spear: the cell faced and those beyond it, nothing to the sides.
    if (reach)
      return Array.from({ length: reach + (power ? 1 : 0) }, (_, i) => ({
        x: p.x + d[0] * (i + 1),
        y: p.y + d[1] * (i + 1),
      }));
    const front = [
      { x: p.x + d[0], y: p.y + d[1] },
      { x: p.x + d[0] - s[0], y: p.y + d[1] - s[1] },
      { x: p.x + d[0] + s[0], y: p.y + d[1] + s[1] },
    ];
    if (!power) return front;
    const sides = [
      { x: p.x - s[0], y: p.y - s[1] },
      { x: p.x + s[0], y: p.y + s[1] },
    ];
    if (power === 1) return [...front, ...sides];
    return [
      ...front,
      ...sides,
      { x: p.x - d[0], y: p.y - d[1] },
      { x: p.x - d[0] - s[0], y: p.y - d[1] - s[1] },
      { x: p.x - d[0] + s[0], y: p.y - d[1] + s[1] },
    ];
  }
  /** Frees the hand, whichever system was using it: an item goes back into
   * the inventory, a carried object down on the ground. */
  /** Empties a prop into the player's pack, for the renderer to throw out. */
  private spill(prop: WorldObject) {
    const p = this.state.player;
    const loot = Object.entries(prop.inventory)
      .filter(([, n]) => n! > 0)
      .map(([item, n]) => ({ item, n: n! }));
    for (const { item, n } of loot) {
      p.inventory[item] = (p.inventory[item] ?? 0) + n;
      prop.inventory[item] = 0;
    }
    return loot;
  }
  /** Why the rock on this tile cannot be lifted, or undefined if it can. */
  heaveProblem(target: string) {
    const at = this.tileAt(target);
    const p = this.state.player;
    if (!at || p.pos.space !== "outside") return "There is no rock there.";
    if (Math.max(Math.abs(at.x - p.pos.x), Math.abs(at.y - p.pos.y)) !== 1)
      return "Walk closer.";
    if (!isRock(this.world.decoration(at.x, at.y)?.sprite))
      return "There is no rock there.";
    return undefined;
  }
  /** Scenery rock to carried prop. Sometimes something was living under it. */
  private heave(target: string) {
    const at = this.tileAt(target)!;
    const p = this.state.player;
    this.emptyHands();
    this.editAt(at.x, at.y).stage = "clear";
    this.tilesChanged();
    const rock: WorldObject = {
      id: `stone-${at.x}-${at.y}-${this.state.clock}`,
      name: "Rock",
      kind: "monument",
      prop: "fieldStone",
      sprite: rockFrame(
        this.world.topography?.(at.x, at.y)?.habitat,
        random(this.state.manifest.seed, "rock-art", at.x, at.y),
      ),
      inventory: {},
      pos: copy(p.pos),
      carriedBy: "player",
    };
    this.state.objects.push(rock);
    p.held = rock.id;
    p.fatigue = Math.min(100, p.fatigue + 0.5);
    const loot: { item: string; n: number }[] = [];
    if (this.rng("heave") < 0.4) {
      const roll = this.rng("heave-find");
      const [item, n] =
        roll < 0.4
          ? ["pebble", 1 + Math.floor(this.rng("heave-n") * 3)]
          : roll < 0.62
            ? ["flint", 1]
            : roll < 0.8
              ? ["shell", 1]
              : roll < 0.9
                ? ["clay", 1]
                : roll < 0.97
                  ? ["obsidian", 1]
                  : ["coin", 1];
      if (this.item(item as string)) {
        p.inventory[item as string] =
          (p.inventory[item as string] ?? 0) + (n as number);
        loot.push({ item: item as string, n: n as number });
      }
    }
    this.lastHeave = { at, loot };
    this.advance(3);
    this.event(
      loot.length
        ? `You heave the rock up. Underneath: ${listing(loot.map(({ item, n }) => this.lootName(item, n)))}.`
        : "You heave the rock up over your head.",
    );
  }
  /** The last rock lifted, for the renderer's strain and spill. */
  lastHeave?: { at: Point; loot: { item: string; n: number }[] };
  private emptyHands() {
    const p = this.state.player;
    if (p.heldItem) {
      p.inventory[p.heldItem] = (p.inventory[p.heldItem] ?? 0) + 1;
      delete p.heldItem;
    }
    const carried = this.state.objects.find((o) => o.id === p.held);
    if (carried) {
      carried.pos = this.dropSpot() ?? copy(p.pos);
      delete carried.carriedBy;
    }
    delete p.held;
  }
  /** One blow's worth of damage to a prop. Returns what became of it. */
  private hurtProp(
    prop: WorldObject,
    hit: HitClass,
    blows = 1,
    push?: readonly number[],
  ): "broke" | "damaged" | "tipped" | "leaned" | undefined {
    const def = propDefs[prop.prop!];
    if (!def) return undefined;
    if (def.topples && !prop.tipped && !prop.broken) {
      const [dx, dy] = push ?? [[0, -1], [1, 0], [0, 1], [-1, 0]][this.state.player.direction];
      return this.tiltProp(prop, dx, dy);
    }
    if (def.breakable && !prop.broken) {
      this.propOwnership(prop, "break");
      prop.damage = (prop.damage ?? 0) + blows;
      if (prop.damage < (toughness(hit) ?? 2)) return "damaged";
      prop.broken = true;
      prop.open = true;
      prop.depleted = false;
      prop.sprite = brokenSprite(prop.id, def.breakable);
      return "broke";
    }
    if (def.tips && !prop.tipped) {
      this.propOwnership(prop, "break");
      prop.tipped = true;
      prop.open = true;
      return "tipped";
    }
    return undefined;
  }
  /** The last swing's hits, for the renderer. Read by serial, like a leap. */
  lastSwing?: {
    hits: Hit[];
    tool: ToolClass;
    direction: number;
    creatures: CreatureHit[];
    /** 0 a plain swing, 1 a half circle, 2 all the way round. */
    power: number;
    /** A spear goes straight in rather than round. */
    thrust: boolean;
    /** Brought down out of a jump. */
    plunge: boolean;
  };
  /** Clock until which a fight is on. The runtime keeps the world ticking
   * through it instead of letting an idle player freeze the animals. */
  combatUntil = 0;
  private rangeBonus() {
    const strength = (this.state.manifest.survival ? this.stats() : statsOf(this.state.manifest.seed, this.state.player)).strength;
    return (
      (strength >= 70 ? 2 : strength >= 45 ? 1 : 0) +
      marksmanReach(this.skillLevel("marksmanship")) +
      (this.knows("long-arm") ? 1 : 0)
    );
  }
  bowRange() {
    return (this.state.player.heldItem === "sling" ? 8 : 10) + this.rangeBonus();
  }
  /** What a bow or sling in hand would loose next. */
  ammo() {
    const p = this.state.player;
    if (p.heldItem === "bow") return p.inventory.arrow ? "arrow" : undefined;
    if (p.heldItem === "sling")
      return ["pebble", "river-rock", "flint", "obsidian"].find((i) => p.inventory[i]);
  }
  /** What is in the hand, as something to throw. */
  missile() {
    const held = heldObject(this.state);
    const missile = missileOf({
      prop: held?.prop,
      item: held ? undefined : this.state.player.heldItem,
      mass: propDefs[held?.prop ?? ""]?.shove?.mass,
    });
    return { ...missile, range: missile.range + this.rangeBonus() };
  }
  /** The cells a throw crosses, ending where it comes down: short of a wall,
   * or on the first animal in the way. The renderer aims with this too. */
  throwPath(dx: number, dy: number, reach?: number, run?: boolean) {
    const p = this.state.player.pos;
    const most = Math.min(reach ?? (run ? 6 : 3) + this.rangeBonus(), this.missile().range);
    return this.projectilePath({ x: p.x + dx * most, y: p.y + dy * most }, most);
  }
  projectilePath(target: Point, range: number) {
    const p = this.state.player.pos;
    const dx = target.x - p.x, dy = target.y - p.y;
    const distance = Math.max(Math.abs(dx), Math.abs(dy));
    if (!distance) return [];
    const scale = Math.min(1, range / distance);
    const end = { x: Math.round(p.x + dx * scale), y: Math.round(p.y + dy * scale) };
    const cells: Point[] = [];
    let x = p.x, y = p.y;
    const sx = Math.sign(end.x - x), sy = Math.sign(end.y - y);
    const ax = Math.abs(end.x - x), ay = Math.abs(end.y - y);
    let error = ax - ay;
    while (x !== end.x || y !== end.y) {
      const twice = error * 2;
      if (twice > -ay) { error -= ay; x += sx; }
      if (twice < ax) { error += ax; y += sy; }
      if (this.blocked(x, y, p.space)) break;
      cells.push({ x, y });
      if (p.space === "outside" && this.faunaAt(x, y)) break;
    }
    return cells;
  }
  /** Something within a swing's reach that a swing would do anything to. */
  swingFinds() {
    const p = this.state.player;
    const held = heldObject(this.state);
    const item = !held && p.heldItem ? this.item(p.heldItem)?.hand : undefined;
    const reach = weaponOf(held?.prop, item).reach;
    return [0, 1, 3].some((turn) =>
      this.swingCone((p.direction + turn) % 4, 0, reach).some(
        (c) =>
          !["air", "grass", "soil", "sand", "snow", "stone"].includes(
            this.hitClass(c.x, c.y, p.pos.space).hit,
          ),
      ),
    );
  }
  /** Holding something made to be swung, which is no bar to jumping. */
  armed() {
    const def = propDefs[heldObject(this.state)?.prop ?? ""];
    return !!def?.strike && !def.container;
  }
  /** Whoever is standing on a cell: a person, or an animal, or neither. The
   * renderer asks after a refused step, to know what the player walked into. */
  creatureAt(x: number, y: number, space = this.state.player.pos.space) {
    const actor = this.state.actors.find(
      (a) => a.pos.space === space && a.pos.x === x && a.pos.y === y,
    );
    if (actor) return { actor };
    const beast = space === "outside" ? this.faunaAt(x, y) : undefined;
    return beast ? { species: beast.g.speciesId } : undefined;
  }
  /** An animal standing on a cell. One in the air is out of reach. */
  private faunaAt(x: number, y: number) {
    for (const g of this.state.fauna ?? []) {
      if (Math.abs(g.pos.x - x) > 24 || Math.abs(g.pos.y - y) > 24) continue;
      if (aerialStates.has(g.state)) continue;
      const m = memberAt(g, x, y);
      if (m) return { g, m };
    }
    return undefined;
  }
  /** One blow on one animal: damage, the shove, and what the herd makes of
   * it. `share` is 1 for the cell faced and less for the corners of the arc. */
  private strikeFauna(
    g: FaunaGroup,
    m: FaunaMember,
    weapon: Weapon,
    d: readonly number[],
    share: number,
  ): CreatureHit | undefined {
    // A spear set against a charge takes the animal's own weight.
    const braced =
      !!weapon.brace && g.attack?.phase === "charge" && g.attack.n === m.n;
    const profile = faunaProfile(g.speciesId);
    if (!profile) return undefined;
    const seed = this.state.manifest.seed;
    ensureVitals(seed, g);
    const combat = faunaCombat(profile);
    const strength = (this.state.manifest.survival ? this.stats() : statsOf(this.state.manifest.seed, this.state.player)).strength;
    const crit = this.rng("combat-crit") < (this.knows("clean-kill") ? 0.2 : 0.1);
    let damage = Math.max(
      1,
      Math.round(
        weapon.damage *
          (0.7 + strength * 0.006) *
          (0.8 + this.rng("combat-roll") * 0.4) *
          share *
          (crit ? 2 : 1) *
          (braced ? weapon.brace! : 1) *
          (1 + this.skillLevel("hunting") * PER_LEVEL.huntingDamage) *
          (combat.mass >= 2 && this.knows("big-game") ? 1.33 : 1) *
          (this.injured() ? 0.7 : 1),
      ),
    );
    const reach = Math.min(
      3,
      Math.max(0, weapon.knock + 1 + (crit ? 1 : 0) - combat.mass),
    );
    const from = { x: m.x, y: m.y };
    let to = from,
      slammed = false;
    for (let i = 1; i <= reach; i++) {
      const next = { x: from.x + d[0] * i, y: from.y + d[1] * i };
      if (
        this.actorAt({ ...next, space: "outside" }, "") ||
        this.faunaAt(next.x, next.y) ||
        !stepAllowed(
          {
            blocked: (x, y) => this.blocked(x, y, "outside"),
            canCross: this.world.canCross
              ? (a, b) => this.world.canCross!(a, b)
              : undefined,
            topography: this.world.topography
              ? (x, y) => this.world.topography!(x, y)
              : undefined,
          },
          profile,
          to,
          next,
        )
      ) {
        slammed = true;
        break;
      }
      to = next;
    }
    // Thrown against a wall or another animal hurts more than the blow did.
    if (slammed) damage += Math.ceil(weapon.damage / 2);
    const clock = this.state.clock;
    const full = maxHp(g.speciesId, m.tier ?? "ordinary");
    m.hp = (m.hp ?? full) - damage;
    m.x = to.x;
    m.y = to.y;
    m.stun = clock + (weapon.stun ?? 6);
    const killed = m.hp <= 0;
    const hit: CreatureHit = {
      group: g.id,
      n: m.n!,
      species: g.speciesId,
      tier: m.tier ?? "ordinary",
      from,
      to,
      damage,
      crit,
      slammed,
      killed,
      hp: Math.max(0, m.hp),
      maxHp: full,
      feathered: profile.locomotion === "ground-and-flight",
      drops: [],
    };
    for (const o of this.state.objects) {
      const inAnimal = o.projectile?.lodgedIn;
      if (inAnimal?.group !== g.id || inAnimal.n !== m.n) continue;
      o.pos.x = to.x;
      o.pos.y = to.y;
    }
    // A fight breaking out turns heads, once, not on every blow.
    if (clock >= this.combatUntil)
      for (const w of this.witnesses(12)) this.cue(w.id, "alarm", from);
    this.combatUntil = clock + 90;
    // A blow breaks whatever it was in the middle of.
    if (g.attack?.n === m.n) {
      g.attack = { n: m.n!, phase: "recover", until: clock + 12 };
      m.pose = undefined;
    }
    this.strikeOwned(g, killed, { ...from, space: "outside" });
    // Practice is the blow that lands; the lesson is the animal brought down.
    if (!g.owner)
      this.grantXp(
        "hunting",
        Math.min(damage, full) * 0.5 +
          (killed ? full * 1.5 * TIERS[m.tier ?? "ordinary"].yield : 0),
      );
    if (killed) {
      g.members.splice(g.members.indexOf(m), 1);
      const p = this.state.player;
      for (const [item, n] of Object.entries(combat.yields)) {
        const def = this.items[item];
        const count = Math.max(
          1,
          Math.round(n * TIERS[m.tier ?? "ordinary"].yield),
        ) + (this.knows("butcher") ? 1 : 0);
        if (!def) continue;
        p.inventory[item] = (p.inventory[item] ?? 0) + count;
        hit.drops.push({ item, count, sprite: def.sprite });
      }
      const took = hit.drops
        .map((d) => `${d.count} ${this.items[d.item].name.toLowerCase()}`)
        .join(", ");
      this.event(
        `You kill ${m.name ?? `the ${faunaName(g, m)}`}.${took ? ` You take ${took}.` : ""}`,
      );
      const trade = this.trade();
      if (!g.owner && profile?.category === "wild" && combat.yields.meat && trade?.process.steps[trade.stage]?.scene === "hunt") this.doWork(true);
      const legend = this.state.legends?.[legendKey(g.id, m.n!)];
      if (legend) legend.slain = clock;
    }
    const lead = g.members[0];
    if (lead) g.pos = { x: lead.x, y: lead.y, space: "outside" };
    // An animal that fights does so until it is badly hurt or one of its own
    // is down. Everything else bolts.
    const fights = combat.temper !== "bolt" && !killed && m.hp > full * 0.3;
    if (fights) {
      g.provoked = clock + 240;
      g.hurtUntil = undefined;
    } else {
      g.provoked = undefined;
      g.attack = undefined;
      for (const o of g.members) o.pose = undefined;
      g.hurtUntil = clock + 180;
      g.panic = 1;
      g.alarm = clock;
      g.target = undefined;
      if (profile.locomotion !== "ground-and-flight" && profile.art.flee) {
        g.state = "flee";
        g.since = clock;
      }
    }
    return hit;
  }
  /** Skill gains since the UI last looked. Never saved. */
  skillGains: SkillGain[] = [];
  private gainSerial = 0;
  /** The player's skills, rolled from their occupation the first time. */
  skills() {
    const p = this.state.player;
    return (p.skills ??= startingSkills(this.state.manifest.seed, p));
  }
  skillLevel(skill: SkillId) {
    return levelOf(this.skills()[skill]);
  }
  knows(id: TechniqueId) {
    return !!this.state.player.techniques?.includes(id);
  }
  /** Milestones reached with a technique still to choose. */
  pendingPicks() {
    const known = this.state.player.techniques ?? [];
    const picks = pendingPicks(this.skills(), known);
    // What someone taught by working alongside: the first choice in that skill not yet made.
    for (const skill of this.state.player.taught ?? []) {
      if (picks.some((x) => x.skill === skill)) continue;
      for (const tier of TECHNIQUE_TIERS) {
        const all = optionsAt(skill, tier);
        if (all.some((id) => known.includes(id))) continue;
        const options = all.filter((id) => technique(id).ready !== false);
        if (options.length >= 2) picks.push({ skill, tier, options });
        break;
      }
    }
    return picks;
  }
  /** Experience for work done. The attribute behind a skill makes it come a
   * little easier or harder: 0.8 to 1.2 across the range. */
  grantXp(skill: SkillId, amount: number) {
    if (amount <= 0) return;
    const skills = this.skills();
    const aptitude =
      0.8 +
      (this.state.manifest.survival ? this.stats() : statsOf(this.state.manifest.seed, this.state.player))[SKILLS[skill].stat] *
        0.004;
    const before = skills[skill] ?? 0;
    const xp = before + amount * aptitude;
    skills[skill] = xp;
    const level = levelOf(xp);
    const rose = level > levelOf(before);
    // Small gains from walking would drown the toast; they still count.
    if (amount >= 1 || rose) {
      this.skillGains.push({
        serial: ++this.gainSerial,
        skill,
        amount,
        xp,
        level: rose ? level : undefined,
      });
      if (this.skillGains.length > 12) this.skillGains.shift();
    }
    if (rose)
      this.event(
        `${SKILLS[skill].name} ${level}: ${rankOf(level).toLowerCase()}. ${SKILLS[skill].perk(level)}.`,
      );
  }
  /** A practised hand sometimes gets two blows' work out of one. */
  private deft(skill: SkillId) {
    const twice =
      (skill === "woodcraft" && this.knows("clean-cut")) ||
      (skill === "stonework" && this.knows("heavy-hand"));
    return this.rng(`deft-${skill}`) <
      this.skillLevel(skill) * PER_LEVEL.deftBlow * (twice ? 2 : 1)
      ? 1
      : 0;
  }
  private injured() {
    const injury = this.state.player.injury;
    if (injury && injury.until <= this.state.clock) {
      delete this.state.player.injury;
      this.event(`Your ${injury.name} has mended.`);
      return false;
    }
    return !!injury;
  }
  /** How loud the player is to an animal: 1 is a person walking in plain
   * view. Running carries; standing still, and practice, do not. */
  private noise() {
    const since = this.state.clock - this.lastStep.clock;
    const gait = since > 4 ? 0.55 : this.lastStep.run ? 1.3 : 0.8;
    return (
      gait *
      (1 - this.skillLevel("hunting") * PER_LEVEL.huntingQuiet) *
      (this.knows("stalker") ? 0.7 : 1) *
      (this.knows("calm-hand") && !this.lastStep.run ? 0.8 : 1)
    );
  }
  private lastStep = { clock: -99, run: false, dx: 0, dy: 0, steps: 0 };
  lastImpact?: "collision";
  /** At a run, a lone tree, rock or post ahead is dodged a pace to one side
   * rather than slammed into, if the way beyond it is open on that side. */
  private sidestep(c: Extract<PlayerCommand, { type: "move" }>) {
    const p = this.state.player;
    if (!c.run || c.jump || c.traverse || p.perch || p.afloat || (c.dx && c.dy)) return undefined;
    const x = p.pos.x + c.dx, y = p.pos.y + c.dy;
    if (!this.playerBlocked(x, y) || this.offMap(x, y) || this.toppleTarget(c.dx, c.dy, true)) return undefined;
    if (p.pos.space === "outside" && this.treeFind(x, y)) return undefined;
    if (this.onWall() && this.wallAt(x, y, p.pos.space)) return undefined;
    const push = this.shovePlan(c.dx, c.dy);
    if (push && !("refused" in push)) return undefined;
    const sides = [{ x: c.dy, y: c.dx }, { x: -c.dy, y: -c.dx }];
    if ((x + y) & 1) sides.reverse();
    const sx = (side: Point) => p.pos.x + side.x, sy = (side: Point) => p.pos.y + side.y;
    return sides.find(
      (side) =>
        !this.playerBlocked(sx(side), sy(side)) &&
        !this.playerBlocked(sx(side) + c.dx, sy(side) + c.dy) &&
        !this.state.actors.some((a) => a.pos.space === p.pos.space && a.pos.x === sx(side) && a.pos.y === sy(side)) &&
        (!this.world.canCross || this.playerCanCross(p.pos, { x: sx(side), y: sy(side) })) &&
        !(p.pos.space === "outside" && this.world.topography &&
          waterDepthAt(this.world.topography, sx(side) + 0.5, sy(side) + 0.5) > MAX_WADING_DEPTH),
    );
  }
  private runningCollision(c: Extract<PlayerCommand, { type: "move" }>) {
    if (this.sidestep(c)) return false;
    const p = this.state.player;
    if (!this.state.manifest.hazards || !c.run || c.jump || c.traverse || p.perch ||
        p.afloat || this.lastStep.steps < 2 || this.state.clock - this.lastStep.clock > 4 ||
        c.dx !== this.lastStep.dx || c.dy !== this.lastStep.dy) return false;
    const x = p.pos.x + c.dx, y = p.pos.y + c.dy;
    if (!this.playerBlocked(x, y) || this.offMap(x, y) || this.lowPropAhead(c.dx, c.dy) ||
        this.toppleTarget(c.dx, c.dy, true) || this.onWall() && this.wallAt(x, y, p.pos.space)) return false;
    const push = this.shovePlan(c.dx, c.dy);
    if (push && !("refused" in push)) return false;
    // Let diagonal input slide along an open side without taking an impact.
    return !(c.dx && c.dy) || this.playerBlocked(x, p.pos.y) && this.playerBlocked(p.pos.x, y);
  }
  private scar(injury: string) {
    const p = this.state.player;
    if (!p.scars?.includes(injury)) p.scars = [...(p.scars ?? []), injury].slice(-4);
  }
  /** One blow of a heavy tool at a shut door. Three blows' worth and it gives:
   * it stands open for good, and the household inside is terrified. */
  private bashDoor(at: Point, space: string, blows: number) {
    if (space !== "outside") return undefined;
    const door = this.barrierAt(at, space);
    if (!door || door.kind !== "door" || door.open || door.broken) return undefined;
    door.damage = Math.min(3, (door.damage ?? 0) + blows);
    door.knocked = this.state.clock;
    const place = door.placeId ? this.world.place(door.placeId) : undefined;
    if (door.damage < 3) return "The door shudders under the blow and splinters. Someone inside screams.";
    door.broken = true;
    door.open = true;
    if (place) this.breakIn(place);
    return "THE DOOR BURSTS INWARD. Screams from inside!";
  }
  /** Everyone at home when the door comes in: the able-bodied grown come at
   * the intruder, children and the old cower and run. Nobody forgets it. */
  private breakIn(place: Place, memory = `Saw player break down the door of ${place.name.toLowerCase()} with an axe`, act = "broke down the door of") {
    const household = this.state.households?.find((h) => h.residence === place.id);
    const home = (a: Actor) => a.pos.space === place.id || (household?.members.includes(a.id) && a.pos.space === "outside" && distance(a.pos, this.state.player.pos) < 12);
    for (const a of this.state.actors) {
      if (a.kind !== "human" || !home(a) || a.terror) continue;
      const age = a.age ?? 30;
      a.terror = { until: this.state.clock + 2 * 3600, place: place.id, fight: age >= 15 && age < 65 && !a.injury };
      a.offRoutine = true;
      a.memories.push(memory);
      hear(a, { act, object: "home", victim: place.owner, tone: -10, at: this.state.clock, hops: 0 });
      this.regard(a, -4, "fury");
      this.cue(a.id, "alarm", this.state.player.pos);
    }
    const owner = this.state.actors.find((a) => a.id === place.owner);
    if (owner) this.complain(owner, { act, object: "home", victim: owner.id, tone: -10, at: this.state.clock, hops: 0 });
  }
  /** Walk into a house uninvited and whoever heads it, the owner or the eldest
   * at home, comes at you a few seconds later to order you out. */
  trespassing(a: Actor) {
    const p = this.state.player, place = this.world.place(p.pos.space);
    return !!place && p.pos.space !== "outside" && a.pos.space === p.pos.space &&
      place.access !== "public" && a.householdId !== p.householdId &&
      !!this.state.households?.some((h) => h.id === a.householdId && h.residence === place.id) &&
      (this.state.permissions[place.owner] ?? 0) <= this.state.clock;
  }
  trespassContext(a: Actor) {
    if (!this.trespassing(a)) return "";
    const warned = this.intrusion?.place === a.pos.space && this.intrusion.done;
    return warned
      ? "You have ALREADY told the player to leave your private home. They are still inside. A refusal or deliberate evasion now escalates this encounter; do not restart with a greeting."
      : "The player is inside your private home without permission. Tell them to leave; set trespass to warned when you do.";
  }
  trespassReply(a: Actor, response: "warned" | "refused" | "leaving") {
    if (!this.trespassing(a) || response === "leaving") return;
    const clock = this.state.clock, place = a.pos.space;
    if (this.intrusion?.place !== place) this.intrusion = { place, since: clock };
    const i = this.intrusion;
    i.by = a.id;
    i.done = true;
    i.warnedAt ??= clock;
    a.offRoutine = true;
    this.confronting = a.id;
    if (response === "refused") this.escalateIntrusion(a);
  }
  private escalateIntrusion(a: Actor) {
    if (!this.intrusion || this.intrusion.escalated) return;
    this.intrusion.escalated = true;
    a.memories.push("The player stayed in my home after being told to leave");
    this.regard(a, -3, "fury");
    this.provoke(a, "refused to leave my home");
  }
  standsGround(a: Actor) {
    const stats = statsOf(this.state.manifest.seed, a);
    return (a.age ?? 30) >= 16 && (a.age ?? 30) < 65 && (a.health ?? 100) > 25 &&
      !(a.injury && a.injury.until > this.state.clock) && !this.laidUp(a.id) &&
      stats.neuroticism < 65 && stats.extraversion + 100 - stats.agreeableness >= 110;
  }
  provoke(a: Actor, reason: string) {
    if (a.dead || a.kind !== "human") return;
    const story = { act: reason, victim: a.id, tone: -4, at: this.state.clock, hops: 0 };
    hear(a, story);
    this.retaliate(a, false, true);
    if (!a.terror?.fight) {
      this.complain(a, story);
      this.walkOff(a, "authority");
      this.event(`${a.name} calls for help and goes to report you.`, "social");
    }
  }
  private confront(clock: number) {
    const p = this.state.player;
    const place = p.pos.space !== "outside" ? this.world.place(p.pos.space) : undefined;
    const h = place && this.state.households?.find((x) => x.residence === place.id && x.id !== p.householdId);
    const invited = place && (this.state.permissions[place.owner] ?? 0) > clock;
    if (!place || !h || place.access === "public" || invited || p.dead) {
      const by = this.intrusion?.by && this.actorsById?.get(this.intrusion.by);
      if (by && !by.terror) by.offRoutine = false;
      this.intrusion = this.confronting = undefined;
      return;
    }
    if (this.intrusion?.place !== place.id) this.intrusion = { place: place.id, since: clock };
    const i = this.intrusion;
    if (i.done) {
      const by = this.state.actors.find((a) => a.id === i.by);
      if (by && this.trespassing(by) && clock - (i.warnedAt ?? i.since) >= 90) this.escalateIntrusion(by);
      return;
    }
    if (clock - i.since < 12) return;
    const home = this.state.actors.filter((a) => a.kind === "human" && !a.dead && a.pos.space === place.id && h.members.includes(a.id) && (a.age ?? 30) >= 15);
    // A break-in is already a fight; nobody stops to talk.
    if (!home.length || home.some((a) => a.terror)) return;
    const a = home.find((x) => x.id === place.owner) ?? home.sort((x, y) => (y.age ?? 30) - (x.age ?? 30))[0];
    i.by = a.id;
    a.offRoutine = true;
    a.direction = this.directionTo(a.pos, p.pos);
    if (Math.max(Math.abs(a.pos.x - p.pos.x), Math.abs(a.pos.y - p.pos.y)) > 1) {
      const step = findPath(a.pos, p.pos, (x, y) => this.blocked(x, y, a.pos.space) || !!this.actorAt({ ...a.pos, x, y }, a.id), 400)[0];
      if (step && !(step.x === p.pos.x && step.y === p.pos.y)) this.moveActor(a, { ...a.pos, ...step });
      return;
    }
    i.done = true;
    i.warnedAt = clock;
    this.regard(a, -2, "anger");
    a.memories.push(`Found player in ${place.name.toLowerCase()} uninvited`);
    hear(a, { act: "walked uninvited into", object: "home", victim: a.id, tone: -3, at: clock, hops: 0 });
    this.confronting = a.id;
    if (!this.conversing) this.confronter = a.id;
    this.approacher = {
      id: a.id,
      situation: "THE PLAYER IS INSIDE YOUR HOME UNINVITED and you have marched straight up to them. Yell at them to GET OUT, in CAPITALS with exclamation marks. Demand who they are. Do not ask politely.",
      until: clock + 300,
    };
  }
  private witnessAssault(person: Actor) {
    person.memories.push("The player struck me");
    this.witnessReaction(person, "The player struck you", 12);
    for (const w of this.witnesses(15, person.pos)) {
      if (w.id === person.id) continue;
      const memory = `Saw player strike ${person.name}`;
      w.memories.push(memory);
      this.witnessReaction(w, memory, 6);
      this.regard(w, -4, "alarm");
      hear(w, { act: "struck", object: person.name, victim: person.id, tone: -4, at: this.state.clock, hops: 0 });
    }
  }

  private strikePerson(person: Actor, force: number, push: readonly number[]) {
    const damage = Math.max(3, Math.round(force * (0.7 + this.stats().strength / 100) * 4));
    person.health = Math.max(0, (person.health ?? 100) - damage);
    if (this.state.manifest.disease && this.item(this.state.player.heldItem ?? "")?.hand?.edge)
      person.injury = { name: "a cut", until: this.state.clock + 3 * 86400, since: this.state.clock, open: true };
    this.witnessAssault(person);
    this.regard(person, -6, "fury");
    if (person.terror?.cause === "anger") delete person.terror;
    this.retaliate(person, true);
    this.stagger(person, push);
    this.complain(person, { act: "struck", object: person.name, victim: person.id, tone: -6, at: this.state.clock, hops: 0 });
    this.event(`You hit ${person.name}.`);
    if (person.health <= 0) this.dies(person, "of injuries after an assault");
  }

  private retaliate(a: Actor, assault = false, provoked = false) {
    if (a.terror || a.kind !== "human" || a.dead) return;
    const clock = this.state.clock, stats = statsOf(this.state.manifest.seed, a);
    const able = (a.age ?? 30) >= 16 && (a.age ?? 30) < 65 && (a.health ?? 100) > 25 && !(a.injury && a.injury.until > clock);
    const fight = able && !this.laidUp(a.id) && (assault || (stats.neuroticism < 65 && (provoked
      ? this.standsGround(a)
      : random(this.state.manifest.seed, "retaliation", a.id, clock) < Math.max(0.1, 0.35 + (50 - stats.agreeableness) / 150 + (stats.extraversion - 50) / 250))));
    if (!assault && !fight) return;
    a.terror = { until: clock + 300, place: a.pos.space, fight, strikeAfter: clock + (assault ? 12 : 90), cause: assault ? "assault" : "anger" };
    a.offRoutine = true;
    a.activity = fight ? "Threatening you" : "Backing away from you";
    this.event(`${a.name} ${fight ? "raises a hand against you. Move away before they strike." : "backs away, calling for help."}`, "social");
    if (fight) this.combatUntil = Math.max(this.combatUntil, clock + 300);
  }

  private stagger(a: Actor, push: readonly number[]) {
    const to = { ...a.pos, x: a.pos.x + push[0], y: a.pos.y + push[1] };
    if (!this.blocked(to.x, to.y, to.space) && !this.actorAt(to, a.id)) this.moveActor(a, to);
    if (a.terror) a.terror.staggered = this.state.clock;
  }
  /** Each tick of a break-in: whoever fights closes on the player and hits
   * them; whoever cannot backs away into a corner. It ends in a couple of
   * hours, or at once when the player is gone. */
  private brawl() {
    const p = this.state.player;
    for (const a of this.state.actors) {
      const t = a.terror;
      if (!t) continue;
      if (this.state.clock > t.until) {
        delete a.terror;
        a.offRoutine = false;
        continue;
      }
      if (a.pos.space !== p.pos.space || p.dead || distance(a.pos, p.pos) > 10) continue;
      const near = Math.max(Math.abs(a.pos.x - p.pos.x), Math.abs(a.pos.y - p.pos.y));
      a.activity = t.fight ? (this.state.clock >= (t.strikeAfter ?? 0) ? "Attacking you" : "Threatening you") : "Backing away";
      if (t.fight && near <= 1) {
        if (this.state.clock < (t.strikeAfter ?? 0)) continue;
        // A blow every twelve seconds, and none just after being driven back.
        if (this.state.clock % 12 !== 0 || this.state.clock - (t.staggered ?? -99) < 12) continue;
        this.struckBy(a);
        continue;
      }
      if (t.fight) {
        // Round the furniture, not just straight at you.
        const step = findPath(a.pos, p.pos, (x, y) => this.blocked(x, y, a.pos.space) || !!this.actorAt({ ...a.pos, x, y }, a.id), 400)[0];
        if (step && !(step.x === p.pos.x && step.y === p.pos.y)) this.moveActor(a, { ...a.pos, ...step });
        a.direction = Math.abs(p.pos.x - a.pos.x) > Math.abs(p.pos.y - a.pos.y) ? (p.pos.x > a.pos.x ? 1 : 3) : p.pos.y > a.pos.y ? 2 : 0;
        continue;
      }
      const toward = -1;
      const steps = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .map(([dx, dy]) => ({ ...a.pos, x: a.pos.x + dx, y: a.pos.y + dy }))
        .filter((c) => !this.blocked(c.x, c.y, c.space) && !this.actorAt(c, a.id) && !(c.x === p.pos.x && c.y === p.pos.y))
        .sort((c1, c2) => toward * (distance(c1, p.pos) - distance(c2, p.pos)));
      if (steps[0] && toward * (distance(steps[0], p.pos) - distance(a.pos, p.pos)) < 0) this.moveActor(a, steps[0]);
      a.direction = Math.abs(p.pos.x - a.pos.x) > Math.abs(p.pos.y - a.pos.y) ? (p.pos.x > a.pos.x ? 1 : 3) : p.pos.y > a.pos.y ? 2 : 0;
    }
  }
  /** A householder's blow: a fist, or whatever they are holding. It knocks
   * the player back a step; enough of them and the player goes down, to wake
   * wherever someone carries them. */
  private struckBy(a: Actor) {
    const p = this.state.player;
    const armed = !!a.heldItem;
    const damage = (armed ? 12 : 7) + Math.floor(random(this.state.manifest.seed, "blow", a.id, this.state.clock) * 5);
    const dir = { x: Math.sign(p.pos.x - a.pos.x), y: Math.sign(p.pos.y - a.pos.y) };
    const next = { ...p.pos, x: p.pos.x + dir.x, y: p.pos.y + dir.y };
    if (!this.blocked(next.x, next.y, next.space) && !this.actorAt(next, "player")) p.pos = next;
    p.health = Math.max(0, (p.health ?? 100) - damage);
    this.cue(a.id, "strike", p.pos);
    if (this.state.manifest.disease && this.item(a.heldItem ?? "")?.hand?.edge)
      p.injury = { name: "a cut", until: this.state.clock + 3 * 86400, since: this.state.clock, open: true };
    this.cue("player", "struck", a.pos);
    this.event(`${a.name.toUpperCase()} HITS YOU${armed ? ` WITH THE ${this.item(a.heldItem!)?.name.toUpperCase() ?? "WEAPON"}` : ""}! (-${damage})`);
    if (p.health <= 0) this.pendingCollapse = { by: a.name, part: "cracked ribs" };
  }
  private heal(amount: number) {
    const p = this.state.player, current = p.health ?? 100;
    const ceiling = this.state.manifest.survival ? Math.max(current, Math.round(100 - 70 * ailing(this.state, p.id, this.state.clock))) : 100;
    p.health = Math.min(ceiling, current + amount);
  }
  private hurt(damage: number, cause: string, injury?: string) {
    const p = this.state.player;
    if (p.dead || damage <= 0) return;
    p.health = Math.max(0, (p.health ?? 100) - damage);
    if (injury) p.injury = { name: injury, until: Math.max(p.injury?.until ?? 0, this.state.clock + 3 * 86400), ...(this.state.manifest.disease ? { since: this.state.clock, open: /cut|bite|bitten|scratch|gash|burn|claw|pierc|bleed/i.test(injury) } : {}) };
    // A bad fall or a burn heals to a mark that stays.
    if (injury && (damage >= 35 || injury === "burned skin")) this.scar(injury);
    if (p.health <= 0) this.die(cause);
  }
  private fall(from: Position, to: Position, extra = 0) {
    if (!this.state.manifest.hazards) return;
    const height = (q: Position) => q.space !== "outside" ? 0 :
      this.world.topography?.(q.x, q.y)?.height ?? (this.world.elevation?.(q.x, q.y) ?? 0) / TERRAIN_STEP;
    const drop = Math.max(0, height(from) + extra - height(to));
    if (drop <= 1) return;
    const ground = this.groundClass(to.x, to.y, to.space);
    const cushion = ground === "sand" || ground === "snow" ? 0.8 :
      ground === "stone" || ground === "rock" ? 1.25 : 1;
    const damage = Math.round(18 * Math.pow(drop - 1, 1.5) * cushion);
    this.hurt(damage, "a fall", damage >= 35 ? "injured leg" : damage >= 15 ? "sprained ankle" : undefined);
    this.lastStep.steps = 0;
    this.event(`You hit the ground hard and lose ${damage} health.`);
  }
  fireUntil(now = this.state.clock) {
    if (!this.state.manifest.hazards) return 0;
    const p = this.state.player;
    const at = p.perch?.at ?? p.pos;
    const fires = (this.state.fires ?? []).filter((f) => f.until > now &&
      (f.place ? p.pos.space === f.place || p.pos.space === "outside" &&
        this.buildingAt(at.x, at.y)?.id === f.place :
        p.pos.space === "outside" && f.x === at.x && f.y === at.y));
    const hearth = this.state.objects.some((o) => o.kind === "fire" && !o.carriedBy &&
      !o.broken && !o.depleted && o.pos.space === p.pos.space && covers(o, at.x, at.y));
    return hearth ? Infinity : Math.max(0, ...fires.map((f) => f.until));
  }
  private fireExposure(seconds: number, started: number) {
    const duration = Math.min(seconds, Math.max(0, this.fireUntil(started) - started));
    if (!duration) return;
    const p = this.state.player;
    const fatal = duration * 5 >= (p.health ?? 100);
    if (fatal) this.state.clock = started + Math.max(1, Math.ceil((p.health ?? 100) / 5));
    if (started - this.lastBurnNotice >= 15 || fatal) {
      this.event("The flames burn you. Get clear of the fire!");
      this.lastBurnNotice = started;
    }
    this.hurt(duration * 5, "burns", "burned skin");
  }
  private lastBurnNotice = -Infinity;
  private lastJump = -99;
  /** Striking a kept animal is striking its keeper's property. Anyone who
   * sees it thinks less of you; the keeper most of all, and they say so. */
  private strikeOwned(g: FaunaGroup, killed: boolean, at: Position) {
    if (!g.owner && g.speciesId === "dog" && g.id.endsWith("-dog"))
      g.owner = this.state.actors.find((a) => a.id === `${g.id.slice(0, -4)}-herder-0`)?.id;
    if (g.owner === "player") return;
    const p = this.state.player;
    const memory = `${killed ? "killed" : "struck"}:${g.id}`;
    if (p.memories.includes(memory)) return;
    p.memories.push(memory);
    const label = faunaProfile(g.speciesId)?.label.toLowerCase() ?? "animal";
    const did = killed ? "kill" : "strike";
    if (!g.owner) {
      for (const w of this.witnesses(15, at)) {
        const memory = `Saw player ${did} a wild ${label}`;
        w.memories.push(memory);
        this.witnessReaction(w, memory, 1);
      }
      return;
    }
    this.offend({
      owner: g.owner,
      radius: 15,
      at,
      cost: (theirs) => (theirs ? 10 : 4) * (killed ? 2 : 1),
      story: { act: killed ? "killed" : "struck", object: label },
      memory: (theirs) =>
        `Saw player ${did} ${theirs ? "my" : "a neighbour's"} ${label}`,
      text: (w, theirs) =>
        theirs
          ? `${w.name} shouts at you: that ${label} is theirs.`
          : `${w.name} saw you ${did} a ${label} that is not yours.`,
      ...(killed
        ? { lost: { what: `a ${label} dead`, pos: this.state.player.pos } }
        : {}),
    });
  }
  private directionTo(from: Point, to: Point) {
    const dx = to.x - from.x,
      dy = to.y - from.y;
    return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
  }
  /** What the renderer should play: what the animals did and how people took
   * things, in the order it happened. */
  signals: Signal[] = [];
  private combatSerial = 0;
  private signal(event: SignalInput) {
    this.signals.push({
      ...event,
      serial: ++this.combatSerial,
    } as Signal);
    if (this.signals.length > 32) this.signals.shift();
  }
  /** An animal has run the player down: the hurt, and being thrown by it. */
  private mauled(g: FaunaGroup, m: FaunaMember, dir: Point, damage: number) {
    const p = this.state.player;
    const from = { x: p.pos.x, y: p.pos.y };
    for (let i = 0; i < 2; i++) {
      const next = { ...p.pos, x: p.pos.x + dir.x, y: p.pos.y + dir.y };
      if (
        this.blocked(next.x, next.y, next.space) ||
        this.actorAt(next, "") ||
        this.faunaAt(next.x, next.y)
      )
        break;
      p.pos = next;
    }
    damage *=
      (1 - this.skillLevel("animals") * 0.02) *
      (this.knows("steady-nerve") ? 0.75 : 1);
    p.health = Math.max(0, (p.health ?? 100) - damage);
    if (this.state.manifest.disease && damage >= 8 && random(this.state.manifest.seed, "animal-wound", g.id, m.n ?? 0, this.state.clock) < 0.6)
      p.injury = { name: "an animal wound", until: this.state.clock + 3 * 86400, since: this.state.clock, open: true };
    this.signal({
      kind: "mauled",
      group: g.id,
      n: m.n!,
      damage,
      from,
      to: { x: p.pos.x, y: p.pos.y },
    });
    const name = m.name ?? `the ${faunaName(g, m)}`;
    const Name = `${name[0].toUpperCase()}${name.slice(1)}`;
    if (p.health > 0) {
      this.event(`${Name} hits you hard.`);
      return;
    }
    for (const o of this.state.fauna ?? []) {
      o.provoked = undefined;
      o.attack = undefined;
      for (const om of o.members) om.pose = undefined;
    }
    // Settled once the tick that did it has finished.
    this.pendingCollapse = {
      by: Name,
      part: g.speciesId === "gray-wolf" ? "torn arm" : "gored leg",
    };
  }
  private pendingCollapse?: { by: string; part: string };
  /** What the player reads when they come round. Never saved. */
  lastCollapse?: { serial: number; title: string; text: string };
  /** Nothing here kills the player. It costs them the day, what they were
   * carrying in their hands, some of the game in their bag, and a hurt that
   * takes days to mend. Someone near enough carries them home. */
  private collapse(by: string, part: string) {
    const p = this.state.player;
    const rescuer = this.state.actors
      .filter((a) => a.kind === "human" && a.pos.space === "outside")
      .map((a) => ({ a, d: distance(a.pos, p.pos) }))
      .filter((e) => e.d < 60)
      .sort((x, y) => x.d - y.d)[0]?.a;
    this.emptyHands();
    const lost: string[] = [];
    for (const item of ["meat", "hide", "feathers"]) {
      const n = p.inventory[item] ?? 0;
      const gone = Math.ceil(n / 2);
      if (!gone) continue;
      p.inventory[item] = n - gone;
      lost.push(`${gone} ${this.items[item]?.name.toLowerCase() ?? item}`);
    }
    if (rescuer) p.pos = copy(p.home);
    p.perch = undefined;
    p.activity = "Resting";
    if (this.state.manifest.survival) {
      p.health = rescuer ? 35 : 20;
      for (const actor of this.state.actors) if (actor.terror) { delete actor.terror; actor.offRoutine = false; }
    }
    this.advance((rescuer ? 10 : 5) * 3600);
    if (this.state.manifest.survival && p.dead) return;
    p.activity = "Exploring";
    if (!this.state.manifest.survival) p.health = rescuer ? 35 : 20;
    p.hunger = Math.min(100, p.hunger + 15);
    p.injury = { name: part, until: this.state.clock + 3 * 86400, ...(this.state.manifest.disease ? { since: this.state.clock, open: /torn|gored|cut/i.test(part) } : {}) };
    this.scar(part);
    const text = [
      `${by} put you on the ground.`,
      rescuer
        ? `${rescuer.name} found you and had you carried home. You wake ten hours later.`
        : "Nobody came. You come round where you fell, hours later, cold and alone.",
      lost.length ? `Gone from your bag: ${lost.join(", ")}.` : "",
      `Your ${part} will trouble you for three days: weaker blows, and you tire sooner.`,
    ]
      .filter(Boolean)
      .join(" ");
    this.event(text);
    this.lastCollapse = {
      serial: (this.lastCollapse?.serial ?? 0) + 1,
      title: rescuer ? "Carried home" : "Left for dead",
      text,
    };
  }
  private swimStep(depth: number) {
    const p = this.state.player;
    if (!p.afloat && depth > MAX_WADING_DEPTH && this.canSwim()) p.afloat = "swimming";
    else if (p.afloat === "swimming" && depth <= MAX_WADING_DEPTH) delete p.afloat;
    if (p.afloat !== "swimming") {
      if (p.swum) p.swum = Math.max(0, p.swum - 8) || undefined;
      return;
    }
    const before = p.swum ?? 0;
    p.swum = before + 1;
    for (const [at, text] of SWIM_WARNINGS)
      if (before < at * SWIM_RANGE && p.swum >= at * SWIM_RANGE) this.event(text);
  }
  private washAshore() {
    const p = this.state.player;
    const size = this.state.manifest.setting?.playableMap?.size ?? 400;
    let shore: Point | undefined;
    for (let r = 1; r < size && !shore; r++)
      for (let i = -r; i <= r && !shore; i++)
        for (const [x, y] of [[p.pos.x + i, p.pos.y - r], [p.pos.x + i, p.pos.y + r], [p.pos.x - r, p.pos.y + i], [p.pos.x + r, p.pos.y + i]])
          if (this.world.terrain(x, y) !== "water" && !this.deep(x, y) && !this.blocked(x, y, "outside")) {
            shore = { x, y };
            break;
          }
    if (!shore) {
      p.swum = SWIM_RANGE / 2;
      this.event("Your strength gives out, but you catch hold of drifting wood and cling to it until it returns.");
      return;
    }
    this.emptyHands();
    p.pos = { ...shore, space: "outside" };
    delete p.afloat;
    delete p.swum;
    p.activity = "Resting";
    this.advance(6 * 3600);
    if (this.state.manifest.survival && p.dead) return;
    p.activity = "Exploring";
    p.health = Math.min(p.health ?? 100, 30);
    p.hunger = Math.min(100, p.hunger + 15);
    const text =
      "Your strength gives out and the water closes over you. Hours later you wake on the shore, coughing up water, with nothing left in your hands.";
    this.event(text);
    this.lastCollapse = {
      serial: (this.lastCollapse?.serial ?? 0) + 1,
      title: "Washed ashore",
      text,
    };
  }
  /** The last thrown prop's flight, for the renderer to arc it over. */
  lastThrow?: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    sprite?: string;
    hit: Hit;
    /** An animal it struck on the way. */
    creature?: CreatureHit;
    id?: string;
    small?: boolean;
    /** Where it skipped on to after landing. */
    bounce?: Point;
    /** A spear: point first, no tumbling. */
    straight?: boolean;
    arrow?: boolean;
    sling?: boolean;
  };
  /** A tree that has just given up what it kept in its crown. */
  lastTreeFind?: { x: number; y: number; kind: TreeFind; loot: { item: string; n: number }[] };
  /** One standing tree in forty keeps something in its crown: a nest in
   * spring, fruit or cones later in the year, a wild hive in any season. */
  treeFind(x: number, y: number): TreeFind | undefined {
    const plant = this.world.decoration(x, y);
    const size = plantClass(plant?.sprite);
    if (size !== "small" && size !== "medium" && size !== "large") return undefined;
    const edit = this.state.tiles?.[tileKey(x, y)];
    if (edit?.stage || edit?.shaken) return undefined;
    const seed = this.state.manifest.seed;
    if (random(seed, "tree-find", x, y) >= 1 / 40) return undefined;
    const season = seasonAt(this.world.pack.setting?.season ?? "spring", this.state.clock) ?? "spring";
    const conifer = /pine|spruce|fir|cedar|larch|conifer|cypress|juniper/.test(plant!.sprite);
    const roll = random(seed, "tree-find-kind", x, y);
    if (roll < 0.3) return "hive";
    if (season === "winter") return undefined;
    if (season === "spring" || (season === "summer" && roll < 0.55)) return "nest";
    return conifer ? "cones" : "fruit";
  }
  /** Knocks a tree's find loose into the player's hands. */
  private shakeTree(x: number, y: number) {
    const kind = this.treeFind(x, y);
    if (!kind) return false;
    this.editAt(x, y).shaken = true;
    const loot = TREE_FINDS[kind].loot;
    const p = this.state.player;
    for (const { item, n } of loot) p.inventory[item] = (p.inventory[item] ?? 0) + n;
    this.lastTreeFind = { x, y, kind, loot };
    this.event(TREE_FINDS[kind].told);
    return true;
  }
  /** The last animal walked into, for the hop it makes out of the way.
   * `yielded` is false when it stood its ground. */
  lastJostle?: {
    group: string;
    species: string;
    n: number;
    yielded: boolean;
    small: boolean;
  };
  /** Walking into an animal. Small ones scatter from under your feet and you
   * keep going; middling ones are shouldered aside and you take the step
   * after; an ox does not move for anybody. Returns where it would go. */
  private jostle(dx: number, dy: number) {
    const p = this.state.player;
    if (p.pos.space !== "outside") return undefined;
    const at = { x: p.pos.x + dx, y: p.pos.y + dy };
    const found = this.faunaAt(at.x, at.y) ?? this.faunaCrossing(at.x, at.y);
    if (!found) return undefined;
    const { g, m } = found;
    const profile = faunaProfile(g.speciesId);
    const mass = profile ? faunaCombat(profile).mass : 3;
    const label = (profile?.label ?? "animal").replace(/ study$/, "");
    const stands = {
      found,
      label,
      small: false,
      to: undefined,
      crossing: false,
    };
    // Still clearing the cell it just left: a bump, and nothing to push.
    if (m.x !== at.x || m.y !== at.y)
      return mass === 0 ? undefined : { ...stands, crossing: true };
    // A fight is not the moment, and nor is one still reeling from a blow.
    if (mass >= 3 || g.provoked || g.attack || (m.stun ?? 0) > this.state.clock)
      return stands;
    // Onward first, then to either side of that, then square to the side.
    const side =
      dx && dy
        ? [
            [dx, 0],
            [0, dy],
          ]
        : [
            [dx + dy, dy + dx],
            [dx - dy, dy - dx],
          ];
    const square =
      dx && dy
        ? [
            [dx, -dy],
            [-dx, dy],
          ]
        : [
            [dy, dx],
            [-dy, -dx],
          ];
    // Validation asks this too, so it must not draw from the counted stream.
    const flip =
      random(this.state.manifest.seed, "jostle", g.id, m.n ?? 0, m.x, m.y) <
      0.5;
    const order = [
      [dx, dy],
      ...(flip ? side.slice().reverse() : side),
      ...(flip ? square.slice().reverse() : square),
    ];
    const world = {
      blocked: (x: number, y: number) => this.blocked(x, y, "outside"),
      canCross: this.world.canCross
        ? (a: Point, b: Point) => this.world.canCross!(a, b)
        : undefined,
      topography: this.world.topography
        ? (x: number, y: number) => this.world.topography!(x, y)
        : undefined,
    };
    const to = order
      .map(([ox, oy]) => ({ x: at.x + ox, y: at.y + oy }))
      .find(
        (c) =>
          !(c.x === p.pos.x && c.y === p.pos.y) &&
          stepAllowed(world, profile ?? {}, at, c) &&
          !this.faunaAt(c.x, c.y) &&
          !this.actorAt({ ...c, space: "outside" }, ""),
      );
    return { found, label, small: mass === 0, to, crossing: false };
  }
  /** An animal part-way out of this cell. Hens are under your feet anyway. */
  private faunaCrossing(x: number, y: number) {
    for (const g of this.state.fauna ?? []) {
      if (Math.abs(g.pos.x - x) > 24 || Math.abs(g.pos.y - y) > 24) continue;
      if (aerialStates.has(g.state)) continue;
      const m = g.members.find(
        (m) =>
          m.trail &&
          m.trail.x === x &&
          m.trail.y === y &&
          m.trail.until > this.state.clock,
      );
      if (m) return { g, m };
    }
    return undefined;
  }
  /** The last shove, for the scuff it leaves and the sound it makes. */
  lastShove?: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    ids: string[];
    ground: HitClass;
    /** Cells a rolling stone passed through, when it did more than shift. */
    path?: Point[];
    /** What it found where it stopped. */
    landing?: Landing;
    refused?: ShoveRefusal["refused"];
  };
  /** A solid prop standing on the cell, whether or not it can be moved.
   * Reads the per-tick cell index when there is one, like `blocked` does. */
  private solidPropAt(x: number, y: number, space: string) {
    const key = `${space}:${x},${y}`;
    const here =
      this.tickObstacles?.get(key) ??
      (this.tickObstacles ? [] : this.state.objects);
    return here.find(
      (o) =>
        !!o.prop &&
        !!propDefs[o.prop]?.solid &&
        !o.carriedBy &&
        !o.broken &&
        !o.submerged &&
        o.pos.space === space &&
        covers(o, x, y),
    );
  }
  private shoveWorld(): ShoveWorld {
    return {
      ground: (x, y, space) => this.ground(x, y, space),
      propAt: (x, y, space) => this.solidPropAt(x, y, space),
      actorAt: (x, y, space) =>
        this.state.actors.some(
          (a) => a.pos.space === space && a.pos.x === x && a.pos.y === y,
        ),
      crossable: (from, to, space) =>
        space !== "outside" ||
        !this.world.canCross ||
        this.world.canCross({ ...this.state.player.pos, ...from }, to),
      shoveOf: (o) => propDefs[o.prop ?? ""]?.shove,
    };
  }
  private toppleTarget(dx: number, dy: number, run = false) {
    if (this.state.player.perch || (dx !== 0 && dy !== 0)) return undefined;
    const p = this.state.player.pos;
    const o = this.solidPropAt(p.x + dx, p.y + dy, p.space);
    return o && !o.tipped && propDefs[o.prop!]?.topples && (run || o.lean) &&
      !this.ground(o.pos.x, o.pos.y, o.pos.space) ? o : undefined;
  }
  private tiltProp(o: WorldObject, dx: number, dy: number): "leaned" | "tipped" {
    this.propOwnership(o, "topple");
    if (o.lean) {
      o.tipped = true;
      o.open = true;
      delete o.lean;
      return "tipped";
    }
    o.lean = dx < 0 || (!dx && dy < 0) ? -1 : 1;
    return "leaned";
  }
  /** What a step in this direction would do to whatever is standing there.
   * Undefined when the cell holds nothing a shoulder could ever move, so the
   * ordinary blocked path still answers for walls, wells and shut gates. */
  shovePlan(dx: number, dy: number): ShovePlan | ShoveRefusal | undefined {
    const p = this.state.player;
    if (p.perch || (dx !== 0 && dy !== 0)) return undefined;
    const target = this.solidPropAt(p.pos.x + dx, p.pos.y + dy, p.pos.space);
    if (!target || !propDefs[target.prop ?? ""]?.shove) return undefined;
    return planShove(
      this.shoveWorld(),
      target,
      { dx, dy },
      (this.state.manifest.survival ? this.stats() : statsOf(this.state.manifest.seed, p)).strength,
    );
  }
  private settleWorld(): SettleWorld {
    return {
      depth: (x, y, space) =>
        space === "outside" && this.world.topography
          ? waterDepthAt(this.world.topography, x + 0.5, y + 0.5)
          : 0,
      groundHit: (x, y, space) => this.groundClass(x, y, space),
      actorAt: (x, y, space) =>
        this.state.actors.find(
          (a) => a.pos.space === space && a.pos.x === x && a.pos.y === y,
        ),
      fireAt: (x, y, space) =>
        this.state.objects.some(
          (o) =>
            o.kind === "fire" &&
            o.pos.space === space &&
            o.pos.x === x &&
            o.pos.y === y,
        ),
      cropAt: (x, y, space) => space === "outside" && !!this.cropAt(x, y),
    };
  }
  private rollWorld(space: string): RollWorld {
    return {
      elevation: (x, y) =>
        space === "outside" && this.world.elevation
          ? this.world.elevation(x, y)
          : 0,
      // A person stops a stone: the roll ends against them, and the landing
      // table is what decides whether that hurt.
      clear: (x, y) =>
        !this.ground(x, y, space) &&
        !this.solidPropAt(x, y, space) &&
        !this.state.actors.some(
          (a) => a.pos.space === space && a.pos.x === x && a.pos.y === y,
        ),
    };
  }
  /** Applies a landing to the world and reports it. A stone in deep water is
   * gone: it keeps its cell so the renderer can show it on the bed, but it
   * stops blocking and stops answering to a shoulder. */
  private land(object: WorldObject, cell: Point, energy: number): Landing {
    const space = object.pos.space;
    const def = propDefs[object.prop ?? ""];
    const result = settle(
      this.settleWorld(),
      !!def?.breakable && !object.broken,
      cell,
      space,
      energy,
    );
    if (result.kind === "sink") object.submerged = true;
    if (result.kind === "shatter" && def?.breakable) {
      this.propOwnership(object, "break");
      object.broken = true;
      object.open = true;
      object.depleted = false;
      object.sprite = brokenSprite(object.id, def.breakable);
    }
    if (result.kind === "crush" && result.victim) {
      const victim = this.state.actors.find((a) => a.id === result.victim);
      if (victim) {
        victim.health = Math.max(
          0,
          (victim.health ?? 100) - (result.damage ?? 1) * 6,
        );
        victim.memories.push(`Struck by ${object.name.toLowerCase()}`);
        this.regard(victim, -4);
        this.event(`${victim.name} is caught by ${object.name.toLowerCase()}.`);
      }
    }
    // A flattened crop is spent, not harvested: it stands there depleted.
    const crop = result.kind === "flatten" && this.cropAt(cell.x, cell.y);
    if (crop) crop.depleted = true;
    return result;
  }
  /** A stone let go on a slope runs to the foot of it and settles there. */
  private rollOn(object: WorldObject, dx: number, dy: number) {
    const space = object.pos.space;
    const run = rollPath(
      this.rollWorld(space),
      { x: object.pos.x, y: object.pos.y },
      { dx, dy },
      TERRAIN_STEP,
    );
    const end = run.path[run.path.length - 1];
    if (end) object.pos = { ...object.pos, x: end.x, y: end.y };
    const mass = propDefs[object.prop ?? ""]?.shove?.mass ?? 1;
    // What it ran into takes the blow; otherwise the ground it stopped on does.
    const target = run.against ?? end;
    const landing = target
      ? this.land(object, target, energyOf(mass, run.fell))
      : undefined;
    return { run, landing };
  }
  /** The thing a step in this direction would lean on. */
  shoveTargetId(dx: number, dy: number) {
    const p = this.state.player.pos;
    return this.solidPropAt(p.x + dx, p.y + dy, p.space)?.id;
  }
  /** Moves the pile and reports what the step should cost on top of a walk. */
  private applyShove(plan: ShovePlan, dx: number, dy: number) {
    const p = this.state.player.pos;
    const first = this.object(plan.moves[plan.moves.length - 1].id)!;
    const from = { x: first.pos.x, y: first.pos.y };
    const rolls = !!propDefs[first.prop ?? ""]?.shove?.rolls;
    for (const move of plan.moves) {
      // A roller finds its own cell: the plan only proves the first one is free.
      if (rolls && move.id === first.id) continue;
      const o = this.object(move.id);
      if (!o) continue;
      o.pos = { ...o.pos, x: move.to.x, y: move.to.y };
    }
    const rolled = rolls ? this.rollOn(first, dx, dy) : undefined;
    this.lastShove = {
      from,
      to: { x: first.pos.x, y: first.pos.y },
      ids: plan.moves.map((m) => m.id),
      ground: this.groundClass(from.x, from.y, p.space),
      ...(rolled?.run.path.length ? { path: rolled.run.path } : {}),
      ...(rolled?.landing ? { landing: rolled.landing } : {}),
    };
    const ran = rolled?.run.path.length ?? 0;
    this.event(
      rolled?.landing?.kind === "sink"
        ? `${first.name} rolls ${ran} pace${ran === 1 ? "" : "s"} and goes under the water.`
        : rolled?.landing?.kind === "crush"
          ? `${first.name} rolls away and catches someone.`
          : ran > 1
            ? `You set ${first.name.toLowerCase()} rolling. It runs ${ran} paces before it stops.`
            : plan.moves.length > 1
              ? `You shove ${first.name.toLowerCase()} along, and what is behind it with it.`
              : `You shove ${first.name.toLowerCase()} one pace.`,
    );
    return plan.seconds;
  }
  /** Aim assist: if the cone is empty but something solid stands to either
   * side, turn to it. Forgiving aim is most of what makes a swing feel good. */
  private aimAt(direction: number, reach = 0) {
    const space = this.state.player.pos.space;
    const solid = (dir: number) =>
      this.swingCone(dir, 0, reach).some(
        (c) =>
          !!this.barrierAt(c, space) || !["air", "grass", "soil", "sand", "snow"].includes(
            this.hitClass(c.x, c.y, space).hit,
          ),
      );
    if (solid(direction)) return direction;
    for (const turn of [1, 3]) {
      const dir = (direction + turn) % 4;
      if (solid(dir)) return dir;
    }
    return direction;
  }
  /** `tile:x,y`. Tool work has no object to address, only ground. */
  /** A dead log lying on the woodland floor: firewood for the taking. */
  gatherable(x: number, y: number) {
    return this.state.player.pos.space === "outside" && this.world.decoration(x, y)?.sprite === "log";
  }
  static tileTarget(x: number, y: number) {
    return `tile:${x},${y}`;
  }
  private tileAt(target: string): Point | undefined {
    const m = /^tile:(-?\d+),(-?\d+)$/.exec(target);
    return m ? { x: Number(m[1]), y: Number(m[2]) } : undefined;
  }
  private editAt(x: number, y: number): TileEdit {
    const tiles = (this.state.tiles ??= {});
    return (tiles[tileKey(x, y)] ??= {});
  }
  private floraCache?: FloraRegion;
  private get flora() {
    const a = this.world.pack.anchor;
    return (this.floraCache ??= a ? floraRegion(a.lon, a.lat) : "europe");
  }
  /** The bloom colony growing on a bare cell, unless it has been cut. */
  bloomSpecies(x: number, y: number): Species | undefined {
    const t = this.world.topography;
    const edit = this.state.tiles?.[tileKey(x, y)];
    if (!t || edit?.cut || edit?.dug || edit?.stage) return undefined;
    const spots = bloomsAt((a, b) => t(a, b), x, y, 0, 0, 0, this.flora);
    return spots.length ? speciesById.get(spots[0].kind) : undefined;
  }
  /** The named plant a decoration stands for, if it is one we name. */
  plantSpecies(sprite: string | undefined, x: number, y: number) {
    const ecology = this.world.topography?.(x, y).habitat?.ecology;
    return speciesAt(sprite, this.flora, ecology ?? "grassland", x, y);
  }
  /** A swing through low growth: grass and reeds to stubble, brush to
   * stems, blooms away. Returns the plant cut, or false if nothing was. */
  private cutGrowth(x: number, y: number, power = 0): Species | undefined | false {
    const plant = this.world.decoration(x, y);
    const c = plantClass(plant?.sprite);
    if (plant && (c === "grass" || c === "shrub")) {
      const species = this.plantSpecies(plant.sprite, x, y);
      if (c === "grass") this.editAt(x, y).cut = true;
      // A wound-up swing takes brush to the ground, not only to stems.
      else this.editAt(x, y).stage = power ? "clear" : "stems";
      return species;
    }
    if (plant) return false;
    const bloom = this.bloomSpecies(x, y);
    if (!bloom) return false;
    this.editAt(x, y).cut = true;
    return bloom;
  }
  /** Rolls what a cut plant gives up and pockets it. */
  private gather(cut: Species[]) {
    const p = this.state.player;
    const got: Record<string, number> = {};
    for (const s of cut)
      for (const [item, chance, n = 1] of s.yields)
        if (this.rng("gather") < chance + this.skillLevel("foraging") * 0.02)
          got[item] = (got[item] ?? 0) + n;
    for (const [item, n] of Object.entries(got))
      p.inventory[item] = (p.inventory[item] ?? 0) + n;
    if (cut.length) this.grantXp("foraging", Object.keys(got).length * 3 + 1);
    this.gathered = got;
    return Object.entries(got).map(([item, n]) => this.lootName(item, n));
  }
  /** The last `gather`, by item. */
  private gathered: Record<string, number> = {};
  private lootName(item: string, n: number) {
    const name = this.item(item)?.name.toLowerCase() ?? item;
    return n > 1 ? `${n} ${name}` : name;
  }
  /** A foot on a fungus leaves it squashed, and one in a pat leaves it flat. */
  private tread(x: number, y: number) {
    const pat = this.state.objects.find(
      (o) => o.dung === "pat" && !o.carriedBy && o.pos.space === "outside" && o.pos.x === x && o.pos.y === y,
    );
    if (pat && !pat.trodden) {
      pat.trodden = true;
      ageDung(pat, this.state.clock);
    }
    if (this.world.decoration(x, y)?.sprite !== "nature-understory-fungi") return;
    const edit = this.editAt(x, y);
    if (edit.trodden) return;
    edit.trodden = true;
    this.tilesChanged();
  }
  /** Scenery is cached until something tells the renderer the ground changed. */
  private tilesChanged() {
    this.state.tilesRevision = (this.state.tilesRevision ?? 0) + 1;
  }
  cropAt(x: number, y: number) {
    return this.state.objects.find(
      (o) =>
        o.kind === "crop" &&
        !o.depleted &&
        o.pos.space === "outside" &&
        o.pos.x === x &&
        o.pos.y === y,
    );
  }
  /** Why this tool cannot be used on this cell, or undefined if it can. */
  toolProblem(action: ToolAction, target: string): string | undefined {
    const tool = this.heldTool();
    const needed = {
      chop: "axe",
      dig: "spade",
      reap: "scythe",
      mine: "pick",
    }[action];
    if (tool !== needed)
      return `You need ${needed === "axe" ? "an axe" : `a ${needed}`} in hand.`;
    const at = this.tileAt(target);
    const p = this.state.player;
    if (!at) return "Aim at a patch of ground.";
    if (p.pos.space !== "outside") return "There is no ground to work indoors.";
    if (p.perch) return `Climb down from ${p.perch.label} first.`;
    const reach = Math.max(Math.abs(at.x - p.pos.x), Math.abs(at.y - p.pos.y));
    if (reach > 1) return "Stand next to it.";
    const plant = this.world.decoration(at.x, at.y);
    if (action === "chop")
      return reach === 0
        ? "Face what you mean to fell."
        : axeWork(plant?.sprite)
          ? undefined
          : "There is nothing here to fell.";
    if (action === "mine")
      return reach === 0
        ? "Face what you mean to break."
        : pickWork(plant?.sprite)
          ? undefined
          : "There is no rock here to break.";
    const edit = this.state.tiles?.[tileKey(at.x, at.y)];
    if (action === "dig") {
      if (edit?.dug && edit.scraped === undefined) return "This ground is already turned.";
      // A spade turns grass under; anything woodier has to come out first.
      if (plant && plantClass(plant.sprite) !== "grass")
        return plant.sprite === STUMP_SPRITE
          ? "A stump is rooted here."
          : `${this.plantName(plant.sprite, true)} is in the way.`;
      const surface = this.world.terrain(at.x, at.y, "outside");
      return ["grass", "dry", "dirt", "sand", "field"].includes(surface)
        ? undefined
        : `You cannot dig ${surface}.`;
    }
    if (this.cropAt(at.x, at.y)) return undefined;
    return plantClass(plant?.sprite) === "grass"
      ? undefined
      : "Nothing here to cut.";
  }
  /** The cells a tool takes in one stroke. A long shovel opens the cell you
   * face and the one beyond it; a scythe lays a two-by-two swathe. Anything
   * in the swathe that cannot be worked is simply skipped. */
  private swathe(action: ToolAction, at: Point): Point[] {
    const sweep = propDefs[heldObject(this.state)?.prop ?? ""]?.sweep ?? 1;
    if (sweep < 2) return [at];
    const p = this.state.player;
    const d = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ][p.direction];
    const beyond = { x: at.x + d[0], y: at.y + d[1] };
    if (action === "dig") return [at, beyond];
    const side = { x: -d[1], y: d[0] };
    return [
      at,
      { x: at.x + side.x, y: at.y + side.y },
      beyond,
      { x: beyond.x + side.x, y: beyond.y + side.y },
    ];
  }
  lastToolCells?: Point[];
  /** Whether a cell in the swathe beyond the aimed one can take the stroke. */
  private workable(action: ToolAction, at: Point) {
    if (this.world.blocked(at.x, at.y, "outside")) return false;
    const plant = this.world.decoration(at.x, at.y);
    if (action === "dig") {
      const edit = this.state.tiles?.[tileKey(at.x, at.y)];
      if (edit?.dug && edit.scraped === undefined) return false;
      if (plant && plantClass(plant.sprite) !== "grass") return false;
      return ["grass", "dry", "dirt", "sand", "field"].includes(
        this.world.terrain(at.x, at.y, "outside"),
      );
    }
    return !!this.cropAt(at.x, at.y) || plantClass(plant?.sprite) === "grass";
  }
  /** Axe, spade and scythe. Validation has already run on the aimed cell. */
  private useTool(action: ToolAction, target: string) {
    const at = this.tileAt(target)!;
    this.lastToolCells = [at];
    const p = this.state.player;
    const edit = this.editAt(at.x, at.y);
    if (action === "dig") {
      const cells = this.swathe(action, at).filter(
        (q) => (q.x === at.x && q.y === at.y) || this.workable(action, q),
      );
      this.lastToolCells = cells;
      for (const q of cells) {
        const turned = this.editAt(q.x, q.y);
        turned.dug = true;
        delete turned.scraped;
      }
      this.tilesChanged();
      this.advance(this.fieldPace(cells.length > 1 ? 70 : 45));
      this.grantXp("farming", 5 * cells.length);
      this.event(
        cells.length > 1
          ? "You drive the shovel through two spits of earth."
          : "You turn the earth into a furrow of broken soil.",
      );
      return;
    }
    if (action === "reap") {
      const cells = this.swathe(action, at).filter(
        (q) => (q.x === at.x && q.y === at.y) || this.workable(action, q),
      );
      this.lastToolCells = cells;
      const cut: string[] = [];
      const wild: Species[] = [];
      let stubble = false;
      for (const q of cells) {
        const crop = this.cropAt(q.x, q.y);
        if (crop) {
          harvestResource(p, crop, this.state.clock);
          crop.depleted = true;
          cut.push(crop.name.toLowerCase());
        } else {
          const species = this.cutGrowth(q.x, q.y);
          if (species === false) this.editAt(q.x, q.y).cut = true;
          else if (species) wild.push(species);
          stubble = true;
        }
      }
      if (stubble) this.tilesChanged();
      const got = this.gather(wild);
      this.advance(this.fieldPace(cut.length ? 30 : 15));
      this.grantXp("farming", cut.length * 6 + (cells.length - cut.length));
      this.event(
        cut.length > 1
          ? `You lay a swathe of ${cut[0]} and gather it.`
          : cut.length
            ? `You cut the ${cut[0]} and gather it.`
            : got.length
              ? `You cut the ${wild[0].common.toLowerCase()} and gather ${listing(got)}.`
              : "You cut the growth back to stubble.",
      );
      return;
    }
    const plant = this.world.decoration(at.x, at.y);
    if (action === "mine") return this.usePick(plant, edit, at);
    const work = axeWork(plant?.sprite);
    if (work === "buck") {
      const wood = (edit.wood ?? 1) + (this.knows("timber") ? 1 : 0);
      edit.stage = "stump";
      edit.wood = 0;
      p.inventory.wood = (p.inventory.wood ?? 0) + wood;
      this.tilesChanged();
      this.advance(60);
      this.grantXp("woodcraft", 8 + wood * 2);
      this.event(
        `You buck the fallen trunk into ${wood} firewood. A stump is left in the ground.`,
      );
      return;
    }
    if (work === "clear") {
      edit.stage = "clear";
      p.inventory.wood = (p.inventory.wood ?? 0) + 1;
      this.tilesChanged();
      this.advance(20);
      this.grantXp("woodcraft", 3);
      this.event("You clear the cut stems away. The ground is bare.");
      return;
    }
    if (work === "split") return this.splitRock(plant, edit);
    const needed = fellingSwings(plant?.sprite);
    this.shakeTree(at.x, at.y);
    edit.chops = (edit.chops ?? 0) + 1 + this.deft("woodcraft");
    this.advance(30);
    this.grantXp("woodcraft", 4);
    if (edit.chops < needed) {
      const left = needed - edit.chops;
      // Nine blows on an oak should not fill the log with nine lines: the
      // first one and the last one before it goes are the ones worth keeping.
      if (edit.chops === 1 || left === 1)
        this.event(
          `You sink the axe into ${this.plantName(plant?.sprite)}. ${left} more ${left === 1 ? "blow" : "blows"} will bring it down.`,
        );
      return;
    }
    edit.chops = 0;
    if (plantClass(plant?.sprite) === "shrub") {
      edit.stage = "stems";
      this.tilesChanged();
      this.event(`You cut ${this.plantName(plant?.sprite)} off at the root.`);
      return;
    }
    edit.stage = "logs";
    edit.wood = woodYield(plant?.sprite);
    this.grantXp("woodcraft", 6 + needed * 2);
    this.tilesChanged();
    this.event(
      `${this.plantName(plant?.sprite, true)} comes down with a crash and lies where it fell.`,
    );
  }
  /** An axe on stone. It works, in the sense that the rock does open, but it
   * takes half as long again and the edge pays for every blow. */
  private splitRock(plant: Decoration | undefined, edit: TileEdit) {
    const p = this.state.player;
    edit.chops = (edit.chops ?? 0) + 1 + this.deft("stonework");
    this.advance(45);
    this.grantXp("stonework", 5);
    const axe = heldObject(this.state);
    // The haft survives; the edge does not. A blunted axe still fells trees,
    // so this is a cost the player can feel without losing the tool outright.
    const blunted =
      axe && this.rng("blunt") < 0.45
        ? ((axe.damage = Math.min(3, (axe.damage ?? 0) + 1)), true)
        : false;
    const needed = AXE_ROCK_BLOWS;
    if (edit.chops < needed) {
      const left = needed - edit.chops;
      if (edit.chops === 1 || left === 1 || blunted)
        this.event(
          edit.chops === 1
            ? `You swing the axe at ${this.plantName(plant?.sprite)}. It is not the tool for this, and it will take ${left} more ${left === 1 ? "blow" : "blows"}.`
            : blunted
              ? "The axe rings off the stone and turns its edge."
              : `${left} more ${left === 1 ? "blow" : "blows"} will split it.`,
        );
      return;
    }
    edit.chops = 0;
    edit.stage = "rubble";
    this.grantXp("stonework", 15);
    p.inventory.stone = (p.inventory.stone ?? 0) + 2;
    this.tilesChanged();
    this.event(
      "The rock splits open at last. Broken stone lies where it stood, and the axe is the worse for it.",
    );
  }
  /** The pick: boulders open into rubble, rubble clears, stumps come out. */
  private usePick(plant: Decoration | undefined, edit: TileEdit, at: Point) {
    const p = this.state.player;
    const work = pickWork(plant?.sprite);
    const take = (item: ItemId, n: number) =>
      (p.inventory[item] = (p.inventory[item] ?? 0) + n);
    if (work === "clear") {
      edit.stage = "clear";
      edit.chops = 0;
      take("stone", 1);
      if (this.rng("flint") < 0.3) take("flint", 1);
      this.tilesChanged();
      this.advance(40);
      this.grantXp("stonework", 4);
      this.event(
        "You clear the broken stone away and pocket what is worth keeping.",
      );
      return;
    }
    const needed = work === "grub" ? STUMP_BLOWS : ROCK_BLOWS;
    const skill = work === "grub" ? "woodcraft" : "stonework";
    edit.chops = (edit.chops ?? 0) + 1 + this.deft(skill);
    this.advance(40);
    this.grantXp(skill, 5);
    if (edit.chops < needed) {
      const left = needed - edit.chops;
      if (edit.chops === 1 || left === 1)
        this.event(
          work === "grub"
            ? `You lever at the stump. ${left} more ${left === 1 ? "heave" : "heaves"} will have it out.`
            : `The pick rings off the rock. ${left} more ${left === 1 ? "blow" : "blows"} will split it.`,
        );
      return;
    }
    edit.chops = 0;
    if (work === "grub") {
      edit.stage = "clear";
      take("wood", 1);
      this.tilesChanged();
      this.event("You lever the stump out of the ground. The cell is clear.");
      return;
    }
    edit.stage = "rubble";
    take("stone", 2);
    this.grantXp("stonework", 15);
    this.tilesChanged();
    const ore = this.oreAt(at);
    if (ore) {
      take(ore.item, ore.yield + (this.knows("deep-seam") ? 1 : 0));
      this.grantXp("stonework", 10 * ore.yield);
      this.event(
        `The rock splits along the vein. You pick out ${this.lootName(ore.item, ore.yield)}.`,
      );
      return;
    }
    this.event("The rock splits open. Broken stone lies where it stood.");
  }
  /** The worked ore in a boulder, if there is a boulder and a vein in it. */
  oreAt(at: Point) {
    if (!isRock(this.world.decoration(at.x, at.y)?.sprite) && this.state.tiles?.[tileKey(at.x, at.y)]?.stage !== "rubble")
      return undefined;
    return oreAt(this.state.manifest.seed, at.x, at.y, this.world.pack.setting?.year ?? 0);
  }
  private holdingStick() {
    const p = this.state.player;
    const held = heldObject(this.state);
    return p.heldItem === "stick" || (!!held?.prop && /stick|branch/.test(held.prop));
  }
  private lightProblem(target: string) {
    const fire = this.state.objects.find((o) => o.id === target);
    if (!fire || fire.kind !== "fire") return "There is no fire there.";
    if (!this.holdingStick()) return "Hold a stick to the fire to light it.";
    if (this.state.player.torchOut !== undefined) return "You already have a torch alight.";
    const p = this.state.player;
    if (fire.pos.space !== p.pos.space || distance(fire.pos, p.pos) > 1.5) return "Stand by the fire.";
  }
  /** A stick held in the flames catches and becomes a torch. */
  private lightTorch(fire: WorldObject) {
    const p = this.state.player;
    const held = heldObject(this.state);
    if (held) {
      this.state.objects = this.state.objects.filter((o) => o.id !== held.id);
      delete p.held;
    } else p.inventory.stick = (p.inventory.stick ?? 0) - 1;
    p.inventory.torch = (p.inventory.torch ?? 0) + 1;
    p.heldItem = "torch";
    p.torchOut = this.state.clock + TORCH_SECONDS;
    this.advance(15);
    this.event(`You hold the stick in ${fire.name.toLowerCase()} until it catches. It burns as a torch.`);
  }
  private torchBurnsOut() {
    const p = this.state.player;
    delete p.torchOut;
    p.inventory.torch = Math.max(0, (p.inventory.torch ?? 0) - 1);
    if (!p.inventory.torch) delete p.inventory.torch;
    if (p.heldItem === "torch") delete p.heldItem;
    this.event("Your torch gutters and goes out.");
  }
  private burnProblem(target: string) {
    const p = this.state.player;
    if (p.heldItem !== "torch") return "You need a lit torch in hand.";
    const at = this.tileAt(target);
    if (!at || p.pos.space !== "outside") return "Aim at something outside.";
    if (Math.max(Math.abs(at.x - p.pos.x), Math.abs(at.y - p.pos.y)) > 1) return "Stand next to it.";
    if (!this.flammableAt(at.x, at.y) && !this.buildingAt(at.x, at.y)) return "There is nothing here that will burn.";
  }
  private buildingAt(x: number, y: number) {
    return this.world.places?.find(
      (q) => x >= q.x && y >= q.y && x < q.x + q.w && y < q.y + q.h,
    );
  }
  /** Vegetation that would catch, by how big it is, or undefined. */
  private flammableAt(x: number, y: number) {
    const edit = this.state.tiles?.[tileKey(x, y)];
    if (edit?.burnt || edit?.dug || edit?.stage === "clear" || edit?.stage === "rubble") return undefined;
    const sprite = this.world.decoration(x, y)?.sprite;
    if (!sprite || isRock(sprite)) return undefined;
    if (edit?.stage === "logs") return "medium";
    if (edit?.stage === "stump") return "small";
    const size = plantClass(sprite);
    return size === "none" ? undefined : size;
  }
  private burningAt(x: number, y: number, place?: string) {
    return (this.state.fires ?? []).some((f) => (place ? f.place === place : !f.place && f.x === x && f.y === y));
  }
  /** Set a cell or the building on it alight. Returns what to tell the player,
   * or undefined if nothing caught. */
  ignite(x: number, y: number): string | undefined {
    const fires = (this.state.fires ??= []);
    if (fires.length >= 120) return undefined;
    const building = this.buildingAt(x, y);
    // A building generated before structures were kept starts sound.
    if (building && !building.structure) {
      const year = this.world.pack.setting?.year ?? 0;
      this.setStructure(
        building,
        weatherStructure(this.state.manifest.seed, building.id, fabricOf(building.sprite), year, year, 1),
      );
    }
    if (building?.structure && building.structure.roof > 0.02) {
      if (this.burningAt(x, y, building.id)) return undefined;
      const seconds = BUILDING_BURN[building.structure.fabric];
      fires.push({ x, y, place: building.id, until: this.state.clock + seconds });
      this.evacuate(building);
      return building.structure.fabric === "masonry"
        ? `The roof of ${building.name.toLowerCase()} catches. The stone walls will outlast it.`
        : `Flames take hold of ${building.name.toLowerCase()}.`;
    }
    const size = this.flammableAt(x, y);
    if (!size || this.burningAt(x, y)) return undefined;
    fires.push({ x, y, until: this.state.clock + BURN_SECONDS[size] });
    this.tilesChanged();
    return `The ${plantName(this.world.decoration(x, y)?.sprite)} catches.`;
  }
  /** Every six seconds: buildings char and lose their roofs, fires reach
   * their neighbours unless the ground is wet, and spent fires leave ash. */
  private burnStep() {
    const fires = this.state.fires;
    if (!fires?.length) return;
    const now = this.state.clock;
    const kept: typeof fires = [];
    const caught: [number, number][] = [];
    for (const f of fires) {
      if (f.place) {
        const place = this.world.place(f.place);
        if (!place?.structure) continue;
        // Paced so the roof is gone about when the fire burns out; a stone
        // house keeps its walls through it, `damageStructure` sees to that.
        const next = damageStructure(place.structure, {
          kind: "fire",
          section: Math.floor(this.rng("burn") * place.structure.walls.length),
          amount: (6 / BUILDING_BURN[place.structure.fabric]) * 1.1,
        });
        const gone = next.roof <= 0.02;
        if (gone && next.abandoned === undefined) {
          const year = this.world.pack.setting?.year ?? 0;
          next.abandoned = year;
        }
        this.setStructure(place, next);
        if (gone) this.burntOut(place);
        if (now < f.until && !gone) {
          kept.push(f);
          // Sparks off a burning roof land anywhere round it.
          if (this.rng("roof-spread") < 0.02) {
            const side = Math.floor(this.rng("roof-side") * (place.w + place.h) * 2);
            const x = place.x - 1 + (side % (place.w + 2)),
              y = side < place.w + 2 ? place.y - 1 : place.y + place.h;
            caught.push([x, y]);
          }
        } else this.tilesChanged();
        continue;
      }
      if (now >= f.until) {
        this.burnOut(f.x, f.y);
        continue;
      }
      kept.push(f);
      const wet = this.world.topography?.(f.x, f.y)?.habitat?.wet ?? 0.5;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const x = f.x + dx,
          y = f.y + dy;
        const size = this.flammableAt(x, y);
        const chance = (size === "grass" ? 0.025 : size ? 0.012 : this.buildingAt(x, y) ? 0.01 : 0) * (1 - wet);
        if (chance && this.rng("spread") < chance) caught.push([x, y]);
      }
    }
    this.state.fires = kept;
    for (const [x, y] of caught) this.ignite(x, y);
  }
  private burnOut(x: number, y: number) {
    const edit = this.editAt(x, y);
    const size = plantClass(this.world.decoration(x, y)?.sprite);
    if (edit.stage === "logs" || edit.stage === "stump" || size === "shrub") edit.stage = "clear";
    else if (size === "grass") edit.cut = true;
    else edit.stage = "stump";
    edit.burnt = true;
    this.tilesChanged();
  }
  /** A pail or bucket in hand, full when it holds water. */
  private pail() {
    const held = heldObject(this.state);
    return held && (held.prop === "bucket" || held.prop === "plastic") ? held : undefined;
  }
  private fillProblem(target: string) {
    const pail = this.pail();
    if (!pail) return "You need a pail in hand.";
    if (pail.inventory.water) return "The pail is already full.";
    const p = this.state.player;
    const source = this.state.objects.find((o) => o.id === target);
    if (source)
      return propDefs[source.prop ?? ""]?.drink && source.pos.space === p.pos.space && distance(source.pos, p.pos) <= 1.5
        ? undefined
        : "There is no water there.";
    const at = this.tileAt(target);
    if (!at || p.pos.space !== "outside") return "There is no water there.";
    if (Math.max(Math.abs(at.x - p.pos.x), Math.abs(at.y - p.pos.y)) > 1) return "Stand at the water's edge.";
    return this.world.topography?.(at.x, at.y)?.surface === "water" ? undefined : "There is no water there.";
  }
  private douseProblem(target: string) {
    const pail = this.pail();
    if (!pail) return "You need a pail in hand.";
    if (!pail.inventory.water) return "The pail is empty.";
    const at = this.tileAt(target);
    const p = this.state.player;
    if (!at || p.pos.space !== "outside") return "Aim at the fire.";
    if (Math.max(Math.abs(at.x - p.pos.x), Math.abs(at.y - p.pos.y)) > 1) return "Stand next to it.";
    if (!this.fireAt(at.x, at.y)) return "Nothing is burning there.";
  }
  /** The fire on a cell: the cell's own, or the building standing on it. */
  private fireAt(x: number, y: number) {
    const place = this.buildingAt(x, y)?.id;
    return this.state.fires?.find((f) => (place ? f.place === place : !f.place && f.x === x && f.y === y));
  }
  /** One pailful. It puts out a burning plant, scorched but standing; a
   * house takes several, each one holding the fire back. */
  private douse(at: Point) {
    const pail = this.pail()!;
    delete pail.inventory.water;
    const fire = this.fireAt(at.x, at.y)!;
    this.advance(10);
    this.grantXp("wayfaring", 3);
    const now = this.state.clock;
    if (fire.place) {
      const place = this.world.place(fire.place)!;
      fire.until -= 600;
      if (fire.until > now + 60) {
        this.event(`The water hisses on ${place.name.toLowerCase()}. The fire falls back, but it still burns.`);
        return;
      }
      this.state.fires = this.state.fires!.filter((f) => f !== fire);
      this.tilesChanged();
      this.event(`You put out the fire in ${place.name.toLowerCase()}. Smoke rises from the wet thatch and timbers.`);
      return;
    }
    this.state.fires = this.state.fires!.filter((f) => f !== fire);
    this.editAt(at.x, at.y).burnt = true;
    this.tilesChanged();
    this.event(`You put out the ${plantName(this.world.decoration(at.x, at.y)?.sprite)}. It stands scorched.`);
  }
  private burningPlace(id: string | undefined) {
    return !!id && !!this.state.fires?.some((f) => f.place === id);
  }
  /** Everyone inside a burning house comes out of the door and away. */
  private evacuate(place: Place) {
    const door = { ...doorApproach(place), space: "outside" };
    let fled = 0;
    for (const a of this.state.actors) {
      if (a.pos.space !== place.id) continue;
      this.moveActor(a, { ...door, x: door.x + (fled % 3) - 1, y: door.y + 1 + Math.floor(fled / 3) });
      a.activity = "Fleeing the fire";
      a.offRoutine = true;
      fled++;
    }
    const p = this.state.player;
    if (p.pos.space === place.id) {
      p.pos = copy(door);
      this.event("Smoke fills the room. You get out through the door.");
    }
    if (fled)
      this.event(
        `${fled === 1 ? "Someone runs" : `${fled} people run`} out of ${place.name.toLowerCase()} as the fire takes hold.`,
      );
  }
  /** The roof is gone: nobody lives there now. The household keeps its
   * members and its story, and sleeps out until it finds somewhere. */
  private burntOut(place: Place) {
    for (const h of this.state.households ?? []) {
      if (h.residence !== place.id) continue;
      delete h.residence;
      h.home = { ...doorApproach(place), space: "outside" };
      (h.history ??= []).push({ year: this.world.pack.setting?.year ?? 0, kind: "fire" });
    }
  }
  /** A building the player has changed: it keeps the change across a save. */
  private setStructure(place: Place, structure: Structure) {
    place.structure = structure;
    place.condition = conditionOf(structure);
    if (structure.abandoned !== undefined && place.abandonedAt === undefined) {
      place.abandonedAt = structure.abandoned;
      place.name = `Remains of ${place.name.toLowerCase()}`;
    }
    (this.state.places ??= {})[place.id] = structure;
  }
  /** Seconds of field work, less for someone who has done a lot of it. */
  private fieldPace(seconds: number) {
    return Math.round(
      seconds *
        (1 - this.skillLevel("farming") * PER_LEVEL.farmingPace) *
        (this.knows("green-thumb") ? 0.67 : 1),
    );
  }
  private plantName(sprite: string | undefined, capital = false) {
    const name = plantName(sprite);
    return capital ? `The ${name}` : `the ${name}`;
  }
  /** The nearest prop within reach that can be used, and how. */
  usable() {
    const p = this.state.player;
    if (p.perch) return undefined;
    const object = this.state.objects
      .filter((o) => o.pos.space === p.pos.space && !o.carriedBy && !o.broken &&
        Math.max(Math.abs(o.pos.x - p.pos.x), Math.abs(o.pos.y - p.pos.y)) <= 1 &&
        !!useOf(propDefs[o.prop ?? ""]?.family) && !this.workAt(o, true).length)
      .sort((a, b) => distance(p.pos, a.pos) - distance(p.pos, b.pos))[0];
    const use = object && useOf(propDefs[object.prop!].family);
    return object && use && { id: object.id, label: `${use.verb} the ${object.name.toLowerCase()}`, ...use };
  }
  private useProp() {
    const u = this.usable();
    if (!u) return;
    const p = this.state.player;
    this.advance(u.minutes * 60);
    const name = this.state.objects.find((o) => o.id === u.id)?.name.toLowerCase() ?? "it";
    switch (u.use) {
      case "draw":
        if (this.item("water")) p.inventory.water = Math.max(p.inventory.water ?? 0, 2);
        p.fatigue = Math.min(100, p.fatigue + 1);
        this.event(`You draw water at the ${name} and fill your vessel.`);
        break;
      case "sit":
      case "warm":
        p.fatigue = Math.max(0, p.fatigue - 8);
        this.event(u.use === "sit" ? `You sit a while on the ${name} and rest your legs.` : `You warm your hands at the ${name}.`);
        break;
      case "pray":
        this.event(`You stand before the ${name} and make your prayer.`);
        break;
      default:
        p.fatigue = Math.min(100, p.fatigue + 3);
        this.event(`You ${u.verb.toLowerCase().replace(/ (at|on)$/, "")} the ${name} a while.`);
    }
  }
  climbable():
    | { id: string; label: string; rise: number; at: Point; to?: Point; drop?: number }
    | undefined {
    const p = this.state.player;
    if (p.perch || this.onWall()) return undefined;
    const near = (q: Point) =>
      Math.max(Math.abs(q.x - p.pos.x), Math.abs(q.y - p.pos.y)) <= 1;
    const object = this.state.objects
      .filter(
        (o) =>
          o.pos.space === p.pos.space &&
          near(o.pos) &&
          !o.carriedBy &&
          !o.broken &&
          !!o.prop &&
          !!propDefs[o.prop]?.solid &&
          climbable.has(propDefs[o.prop].family) &&
          !this.workAt(o, true).length,
      )
      .sort((a, b) => distance(p.pos, a.pos) - distance(p.pos, b.pos))[0];
    // object.name, not inspect(): inspect() asks this method for its climb
    // affordance, so reaching back into it recurses until the stack blows.
    if (object)
      return {
        id: object.id,
        label: object.name,
        rise: 12,
        drop: 0.75,
        at: { x: object.pos.x, y: object.pos.y },
      };
    if (p.pos.space === "outside") {
      const ring: Point[] = [];
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ])
        ring.push({ x: p.pos.x + dx, y: p.pos.y + dy });
      for (const q of ring) {
        const plant = this.world.decoration(q.x, q.y);
        if (plant?.solid && plant.sprite !== "rock")
          return {
            id: plant.id,
            label: treeName(plant.sprite),
            rise: 24,
            drop: plantClass(plant.sprite) === "large" ? 5 : plantClass(plant.sprite) === "small" ? 2 : 3,
            at: q,
          };
      }
      // A blocked cell with nothing growing on it is masonry: a house wall or
      // a town wall. Either is a scramble to the top rather than a way through.
      for (const q of ring) {
        if (!this.world.blocked(q.x, q.y, "outside")) continue;
        if (this.world.decoration(q.x, q.y)?.solid || this.offMap(q.x, q.y)) continue;
        const place = (this.world.places ?? []).find(
          (r) => q.x >= r.x && q.x < r.x + r.w && q.y >= r.y && q.y < r.y + r.h,
        );
        if (place) return { id: place.id, label: "the roof", rise: 22, at: q };
        // A wall walk is a surface, not a perch: step onto it and the wall
        // top is ground until you climb down the far side.
        if (this.wallAt(q.x, q.y, "outside"))
          return {
            id: `wall:${q.x},${q.y}`,
            label: "the wall",
            rise: 20,
            at: q,
            to: q,
          };
        return {
          id: `wall:${q.x},${q.y}`,
          label: "the wall",
          rise: 20,
          at: q,
        };
      }
    }
    const place = (this.world.places ?? []).find((q) => near(q.entrance));
    if (place)
      return {
        id: place.id,
        label: place.name,
        rise: 22,
        at: { ...place.entrance },
      };
    if (p.pos.space === "outside" && this.world.topography) {
      const here = this.world.topography(p.pos.x, p.pos.y);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const to = { x: p.pos.x + dx, y: p.pos.y + dy };
        const cell = this.world.topography(to.x, to.y);
        const rise = here && cell ? cell.height - here.height : 0;
        // A one-tier step is already a walk; only a real face needs climbing.
        if (cell && !cell.solid && rise >= 2 && rise <= 3)
          return {
            id: `ledge:${to.x},${to.y}`,
            label: "the ledge",
            rise: rise * 8,
            at: to,
            to,
          };
      }
    }
    return undefined;
  }
  /** Something tall and solid in this cell: what a jump at it meets, and can
   * kick off. The same things `climbable` offers, asked of one cell. */
  tallAt(q: Point): { label: string } | undefined {
    const p = this.state.player;
    const object = this.state.objects.find(
      (o) =>
        o.pos.space === p.pos.space &&
        o.pos.x === q.x &&
        o.pos.y === q.y &&
        !o.carriedBy &&
        !o.broken &&
        !!o.prop &&
        !!propDefs[o.prop]?.solid &&
        !lowProp(o),
    );
    if (object) return { label: object.name };
    if (p.pos.space !== "outside") return undefined;
    const plant = this.world.decoration(q.x, q.y);
    if (plant?.solid)
      return plant.sprite === "rock"
        ? undefined
        : { label: treeName(plant.sprite) };
    if (!this.world.blocked(q.x, q.y, "outside") || this.offMap(q.x, q.y)) return undefined;
    const place = (this.world.places ?? []).find(
      (r) => q.x >= r.x && q.x < r.x + r.w && q.y >= r.y && q.y < r.y + r.h,
    );
    return { label: place?.name ?? "the wall" };
  }
  /** Shared by the C key, the affordance and the narrator's climb intent. */
  perch(target: {
    id: string;
    label: string;
    rise: number;
    drop?: number;
    at?: Point;
    to?: Point;
  }) {
    const p = this.state.player;
    if (target.to) {
      p.pos = { ...target.to, space: p.pos.space };
      this.advance(40);
      this.event(`You scramble up ${target.label}.`);
      return;
    }
    p.perch = {
      on: target.id,
      label: target.label,
      rise: target.rise,
      drop: target.drop ?? (target.rise <= 12 ? 0.75 : 2),
      // Standing on the thing, not beside it: the renderer draws the player
      // over this cell while pos, and so collision, stays put.
      ...(target.at ? { at: { ...target.at } } : {}),
    };
    this.advance(40);
    this.event(`You climb ${target.label} and settle at the top.`);
  }
  /** Where a directional dismount would land, or undefined if that side is
   * shut. A perch is left from the cell climbed, not the one walked in from,
   * so a tree can be left on any side. */
  dismountCell(dx: number, dy: number) {
    const p = this.state.player;
    if (!dx && !dy) return undefined;
    const from = p.perch?.at ?? p.pos;
    const to = { x: from.x + dx, y: from.y + dy };
    if (this.blocked(to.x, to.y, p.pos.space)) return undefined;
    if (!p.perch && this.wallAt(to.x, to.y, p.pos.space)) return undefined;
    return to;
  }
  descend(dir?: { dx: number; dy: number }) {
    const p = this.state.player;
    delete this.lastLeap;
    const jump = dir && this.dismountCell(dir.dx, dir.dy);
    if (jump) {
      const label = p.perch?.label ?? "the wall";
      const height = p.perch?.rise ?? 1;
      const from = { ...p.pos, ...(p.perch?.at ?? {}) };
      const drop = p.perch?.drop ?? (p.perch ? 2 : 1.5);
      p.perch = undefined;
      p.pos = { ...jump, space: p.pos.space };
      p.direction = dir.dy < 0 ? 0 : dir.dx > 0 ? 1 : dir.dy > 0 ? 2 : 3;
      p.facing = facingFromStep(dir.dx, dir.dy, p.direction);
      this.lastLeap = {
        kind: "drop",
        distance: 1,
        seconds: 0,
        drop: height >= 10 ? 2 : 1,
        reason: `You drop clear of ${label}.`,
      };
      this.fall(from, p.pos, drop);
      this.advance(12);
      this.event(`You jump down from ${label} and land clear of it.`);
      return;
    }
    if (!p.perch && this.onWall()) {
      const down = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]
        .map(([dx, dy]) => ({ x: p.pos.x + dx, y: p.pos.y + dy }))
        .find(
          (q) =>
            !this.wallAt(q.x, q.y, "outside") &&
            !this.blocked(q.x, q.y, "outside"),
        );
      if (!down) return;
      p.pos = { ...down, space: p.pos.space };
      this.advance(20);
      this.event("You climb down off the wall.");
      return;
    }
    if (!p.perch) return;
    const label = p.perch.label;
    p.perch = undefined;
    this.advance(20);
    this.event(`You climb down from ${label}.`);
  }
  /** The door within reach, preferring the one the player faces. Deliberately
   * not the strict cardinal test buildings use: a doorstep is a place you
   * stand near, not a cell you have to land on. */
  doorNear(p: Point, direction?: number, radius = 2) {
    this.doorOf("");
    let best: WorldObject | undefined,
      bestScore = Infinity;
    const d = direction === undefined ? undefined : CARDINALS[direction];
    for (let dx = -radius; dx <= radius; dx++)
      for (let dy = -radius; dy <= radius; dy++) {
        const door = this.doorsByCell!.get(`${p.x + dx},${p.y + dy}`);
        if (!door) continue;
        const ahead = d && dx * d[0] + dy * d[1] > 0 ? 0 : 1;
        const score = ahead * 8 + Math.abs(dx) + Math.abs(dy);
        if (score < bestScore) ((bestScore = score), (best = door));
      }
    return best;
  }
  /** Stepping into an open doorway is how you go in; a shut door is solid, so
   * this can only ever fire on one somebody opened. */
  private walkThroughDoor() {
    const p = this.state.player;
    if (p.pos.space === "outside") {
      // The cell index is built with the place index; ask for one to be sure of both.
      this.doorOf("");
      const door = this.doorsByCell?.get(`${p.pos.x},${p.pos.y}`);
      if (!door?.open || !door.placeId) return;
      const place = this.world.place(door.placeId);
      if (!place) return;
      const room = this.interiorOf(place.id);
      p.pos = room ? { ...room.entry, space: place.id } : { x: 6, y: 8, space: place.id };
      p.activity = "Indoors";
      this.state.goalFlags?.visited.push(
        `${place.name} ${place.sprite}`.toLowerCase(),
      );
      this.event(
        `You ${this.world.pack.entryLabel.toLowerCase()} ${place.name.toLowerCase()}.`,
      );
      return;
    }
    // Indoors, the way out is the exit every interior is built with.
    const place = this.world.place(p.pos.space);
    if (!place) return;
    const out = this.state.objects.some(
      (o) =>
        o.kind === "exit" &&
        o.pos.space === p.pos.space &&
        o.pos.x === p.pos.x &&
        o.pos.y === p.pos.y,
    );
    if (!out) return;
    const door = this.doorOf(place.id);
    if (door) door.open = true;
    p.pos = { ...doorApproach(place), space: "outside" };
    p.activity = "Exploring";
    this.event("You step back out into the open air.");
  }
  doorOf(placeId: string) {
    if (!this.doorsByPlace) {
      this.doorsByPlace = new Map();
      this.doorsByCell = new Map();
      for (const o of this.state.objects)
        if (o.kind === "door" && o.placeId) {
          this.doorsByPlace.set(o.placeId, o);
          this.doorsByCell.set(`${o.pos.x},${o.pos.y}`, o);
        }
    }
    return this.doorsByPlace.get(placeId);
  }
  /** Doors are created with the world and never added or removed, so the
   * index only has to survive a reload. */
  private doorsByPlace?: Map<string, WorldObject>;
  private doorsByCell?: Map<string, WorldObject>;
  /** Who just answered a knock, for the UI to open the conversation on. Read
   * once and cleared; never part of the saved state. */
  doorAnswer?: string;
  /** A guard who has just barred the player's way, for the dialogue to open on. */
  challenger?: string;
  /** Someone the plot sent to the player, and what they came to say. Talking
   * to them in time opens on it. */
  approacher?: { id: string; situation: string; until: number };
  private approaching?: { id: string; line: string; until: number; title?: string; situation?: string; onArrive?: () => void };
  private working = false;
  /** Plot cards waiting to be shown, oldest first. */
  cards: PlotCard[] = [];
  /** What the last answer to a work card did, for the card to show. Never saved. */
  lastChoice?: { card: string; line: string; won?: boolean; changes: { kind: string; delta: number; who?: string }[] };
  /** Whether a door opens for this caller right now. The rules are in
   * doors.ts; the engine only supplies who is inside and who is welcome. */
  doorVerdict(place: Place, actorId: string): DoorVerdict {
    // A shop's own household still gets in after the shop shuts.
    const invited =
      place.owner === actorId ||
      (actorId === "player" &&
        this.state.manifest.simulation === 2 &&
        place.owner === this.state.player.id) ||
      !!this.state.households?.some(
        (h) =>
          h.members.includes(actorId) && h.members.includes(place.owner),
      ) ||
      (actorId === "player" &&
        (this.state.permissions[place.owner] ?? 0) > this.state.clock);
    return doorAccess({
      access: place.access,
      invited,
      occupied: this.state.actors.some((a) => a.pos.space === place.id),
      hour: (this.state.clock / 3600) % 24,
    });
  }
  barrierAt(p: Point, space = this.state.player.pos.space) {
    if (this.barriersAt)
      return this.barriersAt
        .get(`${space}:${p.x},${p.y}`)
        ?.find((o) => !o.open);
    return this.state.objects.find(
      (o) =>
        (o.kind === "gate" || o.kind === "door") &&
        !o.open &&
        o.pos.space === space &&
        o.pos.x === p.x &&
        o.pos.y === p.y,
    );
  }
  findRoute(
    start: Position,
    target: Point,
    actorId = "player",
    maxNodes = 18000,
  ): RouteResult {
    // Hoisted out of the cost callback: both were rescanning the whole actor
    // list at every explored node.
    const human =
      actorId === "player" ||
      (this.actorsById
        ? this.actorsById.get(actorId)?.kind === "human"
        : this.state.actors.some(
            (a) => a.id === actorId && a.kind === "human",
          ));
    // Inside advance the per-cell actor index answers this directly, so the
    // route callback never rebuilds a set over every actor.
    const cellOccupied = (p: Point) =>
      actorId === "player" ? this.inPlayerWay({ ...p, space: start.space }) : this.actorAt({ ...p, space: start.space }, actorId);
    const occupied = this.actorsAt ? undefined : new Set<string>();
    if (occupied && actorId !== "player")
      for (const a of this.state.actors)
        if (a.id !== actorId && a.pos.space === start.space)
          occupied.add(`${a.pos.x},${a.pos.y}`);
    return route(
      start,
      target,
      (to, from) => {
        if (
          start.space === "outside" &&
          this.world.canCross &&
          !(actorId === "player" ? this.playerCanCross(from, to) : this.world.canCross(from, to))
        )
          return Infinity;
        if (actorId === "player" ? this.playerBlocked(to.x, to.y, start.space) : this.blocked(to.x, to.y, start.space)) {
          const gate = this.barrierAt(to, start.space);
          // Humans can open a gate; animals must wait for an actual open gate.
          if (
            !gate ||
            !human ||
            (actorId !== "player" && gate.owner && gate.owner !== actorId) ||
            this.ground(to.x, to.y, start.space)
          )
            return Infinity;
          return 5;
        }
        if (
          actorId !== "player" &&
          (occupied ? occupied.has(`${to.x},${to.y}`) : cellOccupied(to))
        )
          return Infinity;
        // The player steps round anyone close by; farther off they will have moved.
        if (actorId === "player" && Math.abs(to.x - start.x) + Math.abs(to.y - start.y) <= 6 &&
          cellOccupied(to))
          return 40;
        // Round the player where that is cheap; through them, and a
        // collision, where it is the only way.
        if (actorId !== "player" && this.playerOn({ ...to, space: start.space }))
          return 12;
        if (actorId === "player" && start.space === "outside" && afloatAt(this.world, this.state.player, to.x, to.y)) return this.state.player.afloat === "swimming" ? 2.5 : 1.4;
        return start.space === "outside"
          ? (this.world.navigationCost?.(to.x, to.y, actorId) ?? 1) *
              (this.world.topography
                ? wadingCost(
                    waterDepthAt(this.world.topography, to.x + 0.5, to.y + 0.5),
                  )
                : 1)
          : 1;
      },
      {
        maxNodes,
        bounds: {
          x: Math.min(start.x, target.x) - 48,
          y: Math.min(start.y, target.y) - 48,
          w: Math.abs(start.x - target.x) + 96,
          h: Math.abs(start.y - target.y) + 96,
        },
      },
    );
  }
  private routes = new Map<string, { target: string; path: Point[] }>();
  visible(pos: Position) {
    return this.visibleFrom(this.state.player.pos, pos);
  }
  visibleFrom(
    p: Position,
    pos: Position,
    places: WorldModel["places"] = this.world.places,
  ) {
    if (distance(p, pos) > SIGHT) return false;
    if (p.space !== "outside") return true;
    const steps = Math.max(Math.abs(p.x - pos.x), Math.abs(p.y - pos.y));
    if (steps < 2) return true;
    // Only places overlapping the sight line's bounds can block it; without
    // this the whole place list is rescanned for every step of every ray.
    const minX = Math.min(p.x, pos.x),
      maxX = Math.max(p.x, pos.x),
      minY = Math.min(p.y, pos.y),
      maxY = Math.max(p.y, pos.y),
      blockers = places.filter(
        (b) =>
          b.x <= maxX && b.x + b.w > minX && b.y <= maxY && b.y + b.h > minY,
      );
    if (!blockers.length) return true;
    for (let i = 1; i < steps; i++) {
      const x = Math.round(p.x + ((pos.x - p.x) * i) / steps),
        y = Math.round(p.y + ((pos.y - p.y) * i) / steps);
      for (const b of blockers)
        if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h)
          return false;
    }
    return true;
  }
  observe(): Observation {
    const s = this.state;
    const p = s.player.pos;
    const places =
      p.space === "outside"
        ? this.world.places.filter(
            (b) =>
              b.x <= p.x + SIGHT &&
              b.x + b.w > p.x - SIGHT &&
              b.y <= p.y + SIGHT &&
              b.y + b.h > p.y - SIGHT,
          )
        : [];
    const visible = (pos: Position) => this.visibleFrom(p, pos, places);
    return copy({
      revision: s.revision,
      clock: s.clock,
      player: s.player,
      actors: s.actors
        .filter((a) => visible(a.pos))
        .map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          kind: a.kind,
          pos: a.pos,
          sprite: a.sprite,
          appearance: a.appearance,
          origin: a.origin,
          age: a.age,
          held: a.held,
          activity: a.activity,
          direction: a.direction,
        })),
      objects: s.objects
        .filter((o) => visible(o.pos))
        .map((o) => ({
          ...o,
          inventory: o.prop
            ? o.open
              ? o.inventory
              : {}
            : o.owner && o.owner !== "player"
              ? {}
              : o.inventory,
        })),
      places: this.world.places.filter((p) =>
        visible({ ...p.entrance, space: "outside" }),
      ),
      events: s.events.slice(-12),
      manifest: s.manifest,
    });
  }
  private nearbyPlants?: { key: string; items: NearbyThing[] };
  /** What stands within a few cells, nearest first, one row per kind of
   * thing. The plant scan is cached per player cell. */
  nearby(radius = 5, limit = 8): NearbyThing[] {
    const p = this.state.player.pos;
    const d = (x: number, y: number) => Math.hypot(x - p.x, y - p.y);
    const out: NearbyThing[] = [];
    for (const a of this.state.actors)
      if (
        a.id !== this.state.player.id &&
        d(a.pos.x, a.pos.y) <= radius &&
        a.pos.space === p.space &&
        this.visible(a.pos)
      )
        out.push({
          id: a.id,
          name: a.name,
          detail: a.kind === "human" ? a.role : undefined,
          kind: a.kind === "human" ? "person" : "animal",
          sprite: a.sprite,
          dist: d(a.pos.x, a.pos.y),
        });
    if (p.space === "outside")
      for (const g of this.state.fauna ?? []) {
        if (
          Math.abs(g.pos.x - p.x) > radius + 24 ||
          Math.abs(g.pos.y - p.y) > radius + 24
        )
          continue;
        for (const m of g.members)
          if (d(m.x, m.y) <= radius)
            out.push({
              name: faunaName(g, m).replace(/^./, (c) => c.toUpperCase()),
              kind: "animal",
              dist: d(m.x, m.y),
            });
      }
    for (const o of this.state.objects)
      if (
        !o.carriedBy &&
        !o.submerged &&
        o.pos.space === p.space &&
        d(o.pos.x, o.pos.y) <= radius &&
        this.visible(o.pos)
      )
        out.push({
          id: o.id,
          name: o.name,
          kind: "object",
          sprite: o.sprite,
          dist: d(o.pos.x, o.pos.y),
        });
    if (p.space === "outside") {
      for (const pl of this.world.places)
        if (d(pl.entrance.x, pl.entrance.y) <= radius)
          out.push({
            id: pl.id,
            name: pl.name,
            kind: "place",
            sprite: pl.sprite,
            dist: d(pl.entrance.x, pl.entrance.y),
          });
      const key = `${p.x},${p.y}`;
      if (this.nearbyPlants?.key !== key) {
        const items: NearbyThing[] = [];
        for (let y = p.y - radius; y <= p.y + radius; y++)
          for (let x = p.x - radius; x <= p.x + radius; x++) {
            if (d(x, y) > radius) continue;
            const plant = this.world.decoration(x, y);
            const seen = this.inspect(plant ? plant.id : `bloom-${x}-${y}`);
            if (seen)
              items.push({
                id: seen.id,
                name: seen.name,
                detail: seen.latin,
                kind: "plant",
                sprite: seen.sprite,
                dist: d(x, y),
              });
          }
        this.nearbyPlants = { key, items };
      }
      out.push(...this.nearbyPlants.items);
    }
    out.sort((a, b) => a.dist - b.dist);
    const rows = new Map<string, NearbyThing>();
    for (const t of out) {
      const k = t.kind === "person" ? t.id! : `${t.kind}:${t.name}`;
      const row = rows.get(k);
      if (row) row.count = (row.count ?? 1) + 1;
      else rows.set(k, { ...t });
    }
    return [...rows.values()].slice(0, limit);
  }
  inspect(id: string): Inspection | undefined {
    const coordinates = /^decor-(-?\d+)-(-?\d+)$/.exec(id);
    if (coordinates) {
      const x = Number(coordinates[1]),
        y = Number(coordinates[2]);
      const pos = { x, y, space: "outside" };
      if (!this.visible(pos)) return;
      const plant = this.world.decoration(x, y);
      if (!plant || plant.id !== id || plant.sprite === "rock") return;
      const worked = isWorkedGround(plant.sprite);
      const species = worked
        ? undefined
        : this.plantSpecies(plant.sprite, x, y);
      const name = worked
        ? plantName(plant.sprite).replace(/^./, (c) => c.toUpperCase())
        : (species?.common ?? treeName(plant.sprite));
      return {
        id,
        pos,
        name,
        latin: species?.latin,
        sprite: plant.sprite,
        kind: "vegetation",
        description: worked
          ? "Ground you have worked."
          : plant.solid
            ? "A tree growing in the surrounding landscape."
            : "Low vegetation growing in the surrounding landscape.",
        affordances: [],
      };
    }
    const bloom = /^bloom-(-?\d+)-(-?\d+)$/.exec(id);
    if (bloom) {
      const pos = {
        x: Number(bloom[1]),
        y: Number(bloom[2]),
        space: "outside",
      };
      const species =
        this.visible(pos) && !this.world.decoration(pos.x, pos.y)
          ? this.bloomSpecies(pos.x, pos.y)
          : undefined;
      if (!species) return;
      return {
        id,
        pos,
        name: species.common,
        latin: species.latin,
        kind: "vegetation",
        description: "Wildflowers growing in the surrounding landscape.",
        affordances: [],
      };
    }

    const planted = /^crop-(-?\d+)-(-?\d+)$/.exec(id);
    if (planted) {
      const pos = {
        x: Number(planted[1]),
        y: Number(planted[2]),
        space: "outside",
      };
      const field = this.visible(pos)
        ? this.world.topography?.(pos.x, pos.y)?.field
        : undefined;
      const sown = field && crops[field.crop];
      const side = this.sideJob();
      if (!sown || (!pickable(sown) && side?.id !== id)) return;
      const mine = this.worksFor(field.owner);
      const picked = this.pickedNow(this.state.tiles?.[tileKey(pos.x, pos.y)]);
      const near = distance(this.state.player.pos, pos) <= 1.5;
      const plant = this.cropPlant(sown, pos.y);
      const what = plant.name.toLowerCase();
      const enabled = near && field.stage === "ripe" && !picked;
      return {
        id,
        pos,
        name: plant.name,
        latin: plant.latin,
        kind: "vegetation",
        claim: field.owner && !mine ? "owned" : undefined,
        description: field.garden
          ? "Planted in a kitchen garden beside the houses."
          : "Growing in a worked field.",
        affordances: [
          ...(side && side.id === id
            ? [{
                label: side.task,
                command: { type: "interact" as const, target: id, action: "tend-plot" as const },
                enabled: near && !side.done,
                reason: side.done ? "Done for today" : near ? undefined : "Walk closer to reach it",
              }]
            : []),
          {
            label: mine
              ? `Harvest the ${what}`
              : `Take the ${what} without asking`,
            command: { type: "interact", target: id, action: "harvest" },
            enabled,
            reason: enabled
              ? undefined
              : picked
                ? "This plant has been picked"
                : field.stage !== "ripe"
                  ? `Not ready: the ${what} is ${STAGE_WORD[field.stage]}`
                  : "Walk closer to reach it",
          },
        ],
      };
    }
    // Wild animals are hovered and selected by their group: a herd on the
    // move has no standing identity beyond its species.
    const herd = this.state.fauna?.find((g) => g.id === id);
    if (herd) {
      const near = herd.members.reduce((best, m) =>
        distance(this.state.player.pos, { ...m, space: "outside" }) <
        distance(this.state.player.pos, { ...best, space: "outside" })
          ? m
          : best,
      );
      const at = { x: near.x, y: near.y, space: "outside" };
      if (!this.visible(at)) return;
      const profile = faunaProfile(herd.speciesId);
      return {
        id,
        pos: at,
        name: faunaName(herd, near).replace(/^./, (c) => c.toUpperCase()),
        latin: profile?.latin,
        kind: "animal",
        description:
          herd.members.length > 1
            ? `One of a ${
                profile?.social === "flock"
                  ? "flock"
                  : profile?.social === "pack"
                    ? "pack"
                    : "herd"
              } of ${herd.members.length}.`
            : "A wild animal going about its own business.",
        affordances: [],
      };
    }
    const actor = this.state.actors.find((a) => a.id === id);
    const object = this.state.objects.find((o) => o.id === id);
    const place = this.world.place(id);
    const pos =
      actor?.pos ??
      object?.pos ??
      (place ? { ...place.entrance, space: "outside" } : undefined);
    if (!pos || (!place && !this.visible(pos))) return;
    const close = distance(this.state.player.pos, pos) <= 2.5;
    const affordances: Affordance[] = [];
    const add = (
      label: string,
      command: PlayerCommand,
      enabled = close,
      reason = "Walk closer to interact",
    ) =>
      affordances.push({
        label,
        command,
        enabled,
        reason: enabled ? undefined : reason,
      });
    const interact = (
      action: Extract<PlayerCommand, { type: "interact" }>["action"],
      label: string,
      enabled = close,
      reason?: string,
    ) => add(label, { type: "interact", target: id, action }, enabled, reason);
    const reachable = this.climbable();
    if (reachable?.id === id) interact("climb", `Climb ${reachable.label}`);
    const use = this.usable();
    if (use?.id === id) interact("use-prop", use.label);
    if (this.state.player.perch?.on === id)
      interact("descend", "Climb down", true);
    if (actor) {
      if (actor.kind === "human") {
        interact("talk", "Talk");
        for (const o of this.careOptions(actor.id).filter((o) => ["nurse", "clean-wound", "consult", "medicine", "rehydration"].includes(o.treatment)))
          add(o.label, o.command, !o.unavailable, o.unavailable);
        if (this.state.manifest.survival) interact("strike", "Strike (may provoke a fight)", distance(this.state.player.pos, pos) <= 1.5, "Move within arm’s reach");
        const plot = this.state.plot;
        if (plot && !plot.ended && plot.cast[plotTemplate(plot)?.payee ?? "creditor"] === id && (plot.owed ?? 0) > 0)
          interact("pay", "Pay", close && this.payable().length > 0,
            close ? "You have nothing they will take" : undefined);
        interact(
          "follow",
          "Ask to accompany",
          close && actor.trust >= 0,
          actor.trust < 0 ? "They decline your company" : "Walk closer",
        );
      } else if (actor.kind === "lizard")
        interact("capture", "Attempt capture");
      else interact("herd", "Guide toward the enclosure");
      const brief =
        actor.kind === "human"
          ? personBrief(
              actor,
              (other) =>
                [this.state.player, ...this.state.actors].find(
                  (a) => a.id === other,
                )?.name,
              (item) => this.items[item]?.name.toLowerCase(),
              actor.held
                ? this.object(actor.held)?.name.toLowerCase()
                : undefined,
            )
          : undefined;
      return {
        id,
        name: actor.name,
        brief,
        description: brief
          ? `${briefText(brief)}${observedIllnesses(this.state, actor.id, this.world.pack.setting).map((a) => ` Symptoms: ${a.name}; ${a.trend ?? "ongoing"}.`).join("")}${npcDanger(actor, this.state.clock) !== "none" ? ` Danger: ${npcDanger(actor, this.state.clock)}.` : ""}`
          : `${actor.activity}. ${actor.owner ? "Part of a household’s flock." : "Moving through the landscape."}`,
        kind: actor.kind,
        pos,
        affordances,
      };
    }
    if (place) {
      const door = this.doorOf(place.id);
      const verdict = this.doorVerdict(place, "player");
      // A worn roof is still a roof; only a ruin's is not.
      if ((place.structure?.roof ?? 1) >= 0.5) interact(
        "enter",
        place.entranceLabel,
        close && !!door?.open,
        door?.open
          ? "Walk to the entrance"
          : verdict === "barred"
            ? "The door is shut against you"
            : "Open the door first",
      );
      const home = this.state.households?.find(
        (h) => h.residence === place.id,
      );
      const resident = (who: string) =>
        [this.state.player, ...this.state.actors].find((a) => a.id === who);
      const brief = placeBrief(
        place,
        this.state.manifest.setting?.year ?? 0,
        resident(place.owner),
        (home?.members ?? []).map(resident).filter((a): a is Actor => !!a),
        home,
        (id, sellerId) => {
          const supplier = this.household(id);
          const head = sellerId ?? supplier?.members[0];
          const actor = head && supplier?.members.includes(head) ? resident(head) : undefined;
          return actor && !actor.dead ? actor : undefined;
        },
        home && this.state.economy?.short[home.id],
      );
      return {
        id,
        name: place.name,
        brief,
        description: brief ? briefText(brief) : place.description,
        kind: "building",
        pos,
        claim: place.claim,
        affordances,
      };
    }
    if (!object) return;
    if (object.prop) {
      const def = propDefs[object.prop];
      return {
        id,
        name: object.broken
          ? `Broken ${object.name.toLowerCase()}`
          : object.name,
        pos,
        kind: object.kind,
        claim: object.claim,
        description: [
          object.broken
            ? "Broken remains; spilled contents can be recovered."
            : (about[object.prop] ??
              object.description ??
              (def?.drink ? "A place to get water." : def?.name ?? "")),
          !object.broken && def?.container
            ? object.open
              ? "It is open."
              : "Look inside to see what it holds."
            : "",
          object.carriedBy ? "You are holding it." : "",
          this.belongsTo(object.owner),
        ]
          .filter(Boolean)
          .join(" "),
        affordances: [
          ...propAffordances(this.state, object, close),
          ...this.workAt(object, close),
          ...(this.state.households?.some(
            (h) => h.storeId === object.id && h.members.includes("player"),
          )
            ? [
                {
                  label: "Contribute supplies",
                  command: {
                    type: "interact" as const,
                    target: object.id,
                    action: "store" as const,
                  },
                  enabled: close,
                  reason: close ? undefined : "Walk closer",
                },
              ]
            : []),
          ...(this.state.player.memories.some((m) =>
            m.startsWith(`theft:${id}:`),
          )
            ? [
                {
                  label: "Return what you took",
                  command: {
                    type: "interact" as const,
                    target: id,
                    action: "return" as const,
                  },
                  enabled: close,
                },
              ]
            : []),
        ],
        inventory: object.open ? copy(object.inventory) : undefined,
      };
    }

    if (object.kind === "item")
      interact(
        "pickup",
        this.state.player.heldItem ? "Swap for this" : "Pick up",
      );
    if (object.kind === "gate")
      interact(
        object.open ? "close" : "open",
        object.open ? "Close gate" : "Open gate",
      );
    if (object.kind === "door") {
      const place = object.placeId
        ? this.world.place(object.placeId)
        : undefined;
      const verdict = place ? this.doorVerdict(place, "player") : "open";
      if (object.broken) interact("close", "Close the door", false, "It hangs off its hinges");
      else if (object.open) interact("close", "Close the door");
      else if (verdict === "open") interact("open", "Open the door");
      // A door that will not open can still be knocked on. Whether anything
      // answers is the knock's business, not the prompt's.
      else interact("knock", "Knock and wait");
    }
    const boat = this.ownBoat(object);
    if (boat) {
      const p = this.state.player;
      interact("launch", "Take the boat out", this.atBoat(object) && !object.away && !p.afloat,
        object.away ? "It is out on the water" : p.afloat ? "You are already afloat" : "Walk down to the water's edge");
    }
    if (object.kind === "well") interact("drink", "Drink and refill water");
    if (object.kind === "fire")
      interact("rest", "Warm yourself for 20 minutes");
    if (object.kind === "bed") {
      interact("rest", "Rest for 20 minutes");
      interact("sleep", "Sleep until morning");
    }
    if (object.kind === "tree")
      interact(
        "harvest",
        object.resource
          ? `Gather ${this.items[object.resource.item].name.toLowerCase()}`
          : "Gather fallen branches",
        close && !object.depleted,
        object.depleted ? "The fallen wood has been gathered" : "Walk closer",
      );
    if (object.kind === "crop")
      interact(
        "harvest",
        "Gather grain",
        close && !object.depleted,
        object.depleted ? "Already gathered" : "Walk closer",
      );
    if (object.kind === "container" && !object.depleted)
      interact(
        "take",
        object.owner && object.owner !== "player"
          ? "Take without permission"
          : "Take",
      );
    if (
      object.kind === "container" &&
      this.state.player.memories.some((m) => m.startsWith(`theft:${id}:`))
    )
      interact("return", "Return what you took");
    if (object.kind === "exit") interact("exit", "Return outside");
    return {
      id,
      name: object.name,
      description: object.resource
        ? `${object.name}. ${object.depleted ? "Currently depleted or out of season." : `${object.inventory[object.resource.item] ?? 0} available.`} Harvest season: ${object.resource.seasons.join(", ")}.`
        : object.description
          ? object.description
          : object.kind === "tree"
            ? object.depleted
              ? "The fallen wood has been gathered. The tree remains."
              : "A little shade. Dry branches lie beneath the canopy."
            : object.depleted
              ? "The container or plot has been emptied."
              : object.kind === "door"
                ? object.open
                  ? "The door stands open."
                  : "The door is shut."
                : object.kind === "gate"
                  ? object.open
                    ? "The gate stands open."
                    : "The gate keeps animals inside."
                  : object.owner
                    ? "These possessions belong to a household. Access does not grant ownership."
                    : "A shared resource in the settlement.",
      kind: object.kind,
      pos,
      claim: object.claim,
      affordances,
      inventory: object.owner ? undefined : copy(object.inventory),
    };
  }
  act(request: CommandRequest): CommandResult {
    const payload = canonical(request.command);
    const prior = Object.hasOwn(this.state.receipts, request.actionId)
      ? this.state.receipts[request.actionId]
      : undefined;
    if (prior)
      return prior.payload === payload
        ? copy(prior.result)
        : {
            actionId: request.actionId,
            revision: this.state.revision,
            status: "rejected",
            elapsedSeconds: 0,
            events: [],
            reason: "That action ID was already used with another command.",
          };
    if (
      !/^[a-zA-Z0-9_-]{1,100}$/.test(request.actionId) ||
      ["__proto__", "constructor", "prototype"].includes(request.actionId)
    )
      return {
        actionId: request.actionId,
        revision: this.state.revision,
        status: "rejected",
        elapsedSeconds: 0,
        events: [],
        reason: "Invalid action ID.",
      };
    let result: CommandResult;
    if (request.expectedRevision !== this.state.revision) {
      result = {
        actionId: request.actionId,
        revision: this.state.revision,
        status: "rejected",
        elapsedSeconds: 0,
        events: [],
        reason:
          "The world has changed. Read the current view and try a new action.",
      };
    } else {
      const before = this.state.clock,
        lastEvent = this.state.events.at(-1)?.id ?? 0;
      const reason = this.validate(request.command);
      // An offer actually made and turned down shows on whoever turned it down.
      if (reason && (request.command.type === "trade" || request.command.type === "deal"))
        this.cue(
          request.command.target,
          /unresolved/.test(reason) ? "anger" : "refuse",
          this.state.player.pos,
        );
      if (reason)
        result = {
          actionId: request.actionId,
          revision: this.state.revision,
          status: "rejected",
          elapsedSeconds: 0,
          events: [],
          reason,
        };
      else {
        this.fixDay();
        this.execute(request.command);
        if (request.command.type === "move") this.arrive();
        const held = heldObject(this.state);
        if (held) held.pos = copy(this.state.player.pos);
        this.state.revision++;
        this.state.log.push(copy(request));
        result = {
          actionId: request.actionId,
          revision: this.state.revision,
          status: "completed",
          elapsedSeconds: this.state.clock - before,
          events: copy(this.state.events.filter((e) => e.id > lastEvent)),
        };
      }
    }
    this.state.receipts[request.actionId] = { payload, result: copy(result) };
    this.onAct?.(request, result);
    return result;
  }
  validate(c: PlayerCommand): string | undefined {
    const p = this.state.player;
    if (c.type === "become") return p.dead && this.heirs().some((a) => a.id === c.heir) ? undefined : "There is no one to go on as.";
    if (p.dead) return `You are dead from ${p.dead}. Start a new world or load an earlier save.`;
    if ((p.stocked ?? 0) > this.state.clock && c.type !== "wait" && c.type !== "sleep" && !(c.type === "interact" && c.action === "talk"))
      return "You are serving your sentence.";
    if (this.state.encounter && !(c.type === "choose" && c.card === this.state.encounter.card)) return "Answer the encounter before doing anything else.";
    if (c.type === "care") {
      const option = this.careOptions(c.target).find((o) => o.treatment === c.treatment);
      return option ? option.unavailable : "That care option is unavailable in this world.";
    }
    if (this.state.manifest.survival && c.type === "move" && c.run && p.fatigue >= 95) return "You are too exhausted to run; walk or rest.";
    if (c.type === "interact" && c.action === "descend")
      return p.perch || this.onWall() ? undefined : "You are not up anything.";
    if (
      c.type === "interact" &&
      (c.action === "chop" ||
        c.action === "dig" ||
        c.action === "reap" ||
        c.action === "mine")
    )
      return this.toolProblem(c.action, c.target);
    if (c.type === "interact" && c.action === "heave")
      return this.heaveProblem(c.target);
    if (c.type === "interact" && c.action === "enter" && this.burningPlace(c.target))
      return "It is on fire.";
    if (c.type === "interact" && c.action === "talk") {
      const a = this.actorsById?.get(c.target);
      if (a && (a.shuns ?? 0) > this.state.clock) {
        this.cue(a.id, "refuse", this.state.player.pos);
        return `${a.name} turns their back on you and will not say a word.`;
      }
    }
    if (c.type === "interact" && c.action === "fill") return this.fillProblem(c.target);
    if (c.type === "interact" && c.action === "work" && this.tileAt(c.target))
      return this.workHere()?.command.target === c.target ? undefined : "There is no work for you here.";
    if (c.type === "choose" && c.card.startsWith("help:"))
      return this.state.asks?.some((x) => `help:${x.id}` === c.card && x.offered) && HELP[c.choice] ? undefined : "There is nothing to answer.";
    if (c.type === "choose") {
      const choice = this.waitingCard() === c.card || this.state.care?.card === c.card || this.state.encounter?.card === c.card ? this.choiceCard(c.card)?.choices[c.choice] : undefined;
      return !choice ? "There is nothing to answer." : this.choiceProblem(choice);
    }
    if (c.type === "interact" && c.action === "douse") return this.douseProblem(c.target);
    if (c.type === "interact" && c.action === "light")
      return this.lightProblem(c.target);
    if (c.type === "interact" && c.action === "burn")
      return this.burnProblem(c.target);
    if (c.type === "interact" && c.action === "use-prop")
      return this.usable()?.id === c.target ? undefined : "There is nothing here to use.";
    if (c.type === "interact" && c.action === "gather") {
      const at = this.tileAt(c.target);
      if (!at || !this.gatherable(at.x, at.y)) return "There is nothing here to gather.";
      return distance(p.pos, { ...at, space: p.pos.space }) <= 1.5 ? undefined : "Walk closer to reach it.";
    }
    if (c.type === "interact" && c.action === "climb") {
      if (p.perch) return `You are already up ${p.perch.label}.`;
      return this.climbable() ? undefined : "There is nothing here to climb.";
    }
    if (c.type === "shoot") {
      if (p.heldItem !== "bow" && p.heldItem !== "sling")
        return "Take a bow or a sling in hand first.";
      if (!this.ammo())
        return p.heldItem === "bow" ? "You have no arrows." : "You have no stones to sling.";
      if (c.target.x === p.pos.x && c.target.y === p.pos.y)
        return "Aim away from yourself.";
      return undefined;
    }
    if (p.perch && (c.type === "move" || c.type === "throw"))
      return `Climb down from ${p.perch.label} first.`;
    if (c.type === "move" || c.type === "throw") {
      if (
        !Number.isInteger(c.dx) ||
        !Number.isInteger(c.dy) ||
        Math.max(Math.abs(c.dx), Math.abs(c.dy)) !== 1
      )
        return c.type === "throw"
          ? "Throw in one direction."
          : "Move one adjacent step.";
      if (c.type === "throw")
        return heldObject(this.state) || p.heldItem
          ? undefined
          : "You are not holding anything to throw.";
      // A stick or a spear goes with you; a crate does not.
      if (c.jump && heldObject(this.state) && !this.armed())
        return "Put down the held object before jumping.";
      if (c.jump && c.traverse) return "Choose one movement style.";
      if (p.afloat && (c.traverse || c.jump)) return "Paddle or swim with the movement keys while afloat.";
      if (c.traverse || c.jump) {
        const leap = this.traversal(p.pos, c.dx, c.dy, c.jump, c.run);
        if (leap.kind === "blocked") return leap.reason;
        const landing = {
          x: p.pos.x + c.dx * leap.distance,
          y: p.pos.y + c.dy * leap.distance,
        };
        const there = this.state.actors.find(
          (a) =>
            a.pos.space === p.pos.space &&
            a.pos.x === landing.x &&
            a.pos.y === landing.y,
        );
        return there ? `${there.name} is standing there.` : undefined;
      }
      if (
        !p.afloat &&
        !this.canSwim() &&
        p.pos.space === "outside" &&
        this.world.topography &&
        waterDepthAt(
          this.world.topography,
          p.pos.x + c.dx + 0.5,
          p.pos.y + c.dy + 0.5,
        ) > MAX_WADING_DEPTH
      )
        return "Too deep to wade — find a shallower crossing or a bridge.";
      if (this.runningCollision(c) || this.sidestep(c)) return;
      if (!(c.dx && c.dy) && p.pos.space === "outside" && this.treeFind(p.pos.x + c.dx, p.pos.y + c.dy)) return;
      const push = this.shovePlan(c.dx, c.dy);
      const toppling = this.toppleTarget(c.dx, c.dy, c.run);
      if (!toppling && push && "refused" in push) return push.reason;
      if (
        (p.pos.space === "outside" &&
          this.world.canCross &&
          !this.playerCanCross(p.pos, {
            x: p.pos.x + c.dx,
            y: p.pos.y + c.dy,
          })) ||
        (!push && !toppling &&
          this.playerBlocked(p.pos.x + c.dx, p.pos.y + c.dy) &&
          !(this.onWall() && this.wallAt(p.pos.x + c.dx, p.pos.y + c.dy))) ||
        (c.dx !== 0 &&
          c.dy !== 0 &&
          (this.playerBlocked(p.pos.x + c.dx, p.pos.y) ||
            this.playerBlocked(p.pos.x, p.pos.y + c.dy)))
      )
        return "The way is blocked.";
      const occupant = this.state.actors.find(
        (a) =>
          a.pos.space === p.pos.space &&
          a.pos.x === p.pos.x + c.dx &&
          a.pos.y === p.pos.y + c.dy,
      );
      if (occupant) return;
      const beast = this.jostle(c.dx, c.dy);
      if (beast && !beast.to && !beast.small && !beast.crossing)
        return `The ${beast.label.toLowerCase()} does not move for you.`;
      return;
    }
    if (c.type === "sleep")
      return Number.isInteger(c.seconds) &&
        c.seconds >= 600 &&
        c.seconds <= 24 * 3600
        ? undefined
        : "Sleep between 10 minutes and a full day.";
    if (c.type === "wait" || c.type === "pass")
      return Number.isInteger(c.seconds) && c.seconds > 0 && c.seconds <= 3600
        ? undefined
        : "Wait between 1 and 3,600 seconds.";
    if (c.type === "use")
      return this.item(c.item)?.edible && (p.inventory[c.item] ?? 0) > 0
        ? undefined
        : "You cannot eat that item.";
    if (c.type === "wear")
      return this.item(c.item)?.wear && (p.inventory[c.item] ?? 0) > 0
        ? undefined
        : "You cannot wear that item.";
    if (c.type === "remove")
      return p.worn?.[c.slot]
        ? undefined
        : "There is nothing there to take off.";
    if (c.type === "narrate") return validateIntents(this, c.intents);
    if (c.type === "swing")
      return p.perch ? `Climb down from ${p.perch.label} first.` : undefined;
    if (c.type === "learn")
      return this.pendingPicks().some((pick) =>
        pick.options.includes(c.technique),
      )
        ? undefined
        : "That technique is not yours to choose yet.";
    if (c.type === "hold") {
      const def = this.item(c.item);
      if (!def) return "That is not something you can take in hand.";
      if ((p.inventory[c.item] ?? 0) < 1) return "You have none of those.";
      return p.held && !this.dropSpot()
        ? "There is no clear place to set down what you are holding."
        : undefined;
    }
    if (c.type === "stow") {
      if (!p.held && !p.heldItem) return "Your hands are already empty.";
      return p.held && !this.dropSpot()
        ? "There is no clear adjacent place to put it down."
        : undefined;
    }
    if (c.type === "drop") {
      if (!p.heldItem) return "You are holding nothing to set down.";
      return this.dropSpot()
        ? undefined
        : "There is no clear adjacent place to set it down.";
    }
    if (c.type === "interact" && c.action === "drop" && !this.dropSpot())
      return "There is no clear adjacent place to put it down.";
    const target = this.inspect(c.target);
    if (!target) return "That target is not visible.";
    // A boat is boarded from the water's edge, not from beside its hull.
    const launch = c.type === "interact" && c.action === "launch" ? this.object(c.target) : undefined;
    if (launch ? !this.atBoat(launch) : distance(p.pos, target.pos) > 2.5) return "Move closer first.";
    if (c.type === "give") {
      const a = this.state.actors.find((a) => a.id === c.target);
      if (!a || a.kind !== "human") return "There is nobody there to take it.";
      if (p.heldItem !== c.item) return "You are not holding that.";
      // A gift is not a way around a grievance.
      if (a.trust < 0) return "They will not take anything from you yet.";
      return undefined;
    }
    if (c.type === "deal") {
      const shop = this.shopOf(c.target, true);
      if (!shop) return "You cannot trade with this target.";
      const a = shop.actor;
      if (a.trust < 0) return "They will not trade while the loss remains unresolved.";
      if (a.pos.space !== p.pos.space || distance(a.pos, p.pos) > 3) return "Walk closer to trade.";
      const lines = [...Object.entries(c.give), ...Object.entries(c.take)];
      if (!lines.some(([, n]) => (n ?? 0) > 0) || lines.some(([id, n]) => !Number.isSafeInteger(n) || (n ?? 0) < 0 || !this.item(id)))
        return "Invalid quantities or items.";
      if (Object.entries(c.give).some(([id, n]) => (p.inventory[id] ?? 0) < (n ?? 0)))
        return "You do not have the offered goods.";
      if (Object.entries(c.take).some(([id, n]) => (id === "coin" ? shop.purse : (shop.stock[id] ?? 0)) < (n ?? 0)))
        return "They do not have that to give.";
      if (this.worth(c.give, "sell") < this.worth(c.take, "buy")) return "They decline those terms.";
      return;
    }
    if (c.type === "trade") {
      const a = this.state.actors.find((a) => a.id === c.target);
      if (!a || a.kind !== "human") return "You cannot trade with this target.";
      if (a.trust < 0)
        return "They will not trade while the loss remains unresolved.";
      if (
        !Number.isSafeInteger(c.giveQuantity) ||
        !Number.isSafeInteger(c.takeQuantity) ||
        c.giveQuantity < 1 ||
        c.takeQuantity < 1 ||
        c.giveQuantity > 999 ||
        c.takeQuantity > 999 ||
        c.give === c.take
      )
        return "Invalid quantities or items.";
      const give = this.item(c.give),
        take = this.item(c.take);
      if (
        !give ||
        !take ||
        (p.inventory[c.give] ?? 0) < c.giveQuantity ||
        (a.inventory[c.take] ?? 0) < c.takeQuantity
      )
        return "One side does not have the offered goods.";
      if (
        give.value *
          c.giveQuantity *
          (1 +
            this.skillLevel("trade") * PER_LEVEL.tradeTerms +
            (this.knows("haggler") ? 0.15 : 0)) <
        take.value * c.takeQuantity
      )
        return "They decline those terms.";
      return;
    }
    const offered = target.affordances.find(
      (a) => a.command.type === "interact" && a.command.action === c.action,
    );
    if (!offered?.enabled)
      return offered?.reason ?? "That action is not available.";
  }
  private populatedDistrict = "";
  /** One line per intent from the last narrate command. */
  lastOutcomes: string[] = [];
  populateNearby() {
    if (!this.world.activate) return;
    const p = this.state.player.pos;
    if (p.space !== "outside") return;
    const key = `${Math.floor(p.x / 128)},${Math.floor(p.y / 128)}`;
    if (key === this.populatedDistrict) return;
    this.populatedDistrict = key;
    this.world.activate(p.x, p.y);
    if (this.world.households)
      for (const h of this.world.households) {
        this.state.households ??= [];
        if (!this.state.households.some((old) => old.id === h.id))
          this.state.households.push(copy(h));
      }
    const ids = new Set(
      [...this.state.actors, ...this.state.objects].map((o) => o.id),
    );
    for (const actor of this.world.initialActors)
      if (!ids.has(actor.id))
        this.state.actors.push({
          ...copy(actor),
          lastUpdated: this.state.clock,
        });
    for (const object of this.world.initialObjects)
      if (!ids.has(object.id)) {
        const next = copy(object);
        if (this.world.pack.setting?.environment)
          refreshResource(
            next,
            this.state.clock,
            seasonAt(this.world.pack.setting.season, this.state.clock),
          );
        this.state.objects.push(next);
      }
    clearDoorsteps(this.state.objects, this.world.places, (x, y) => this.world.blocked(x, y, "outside"));
    this.syncFauna();
  }
  /** Copies the animal groups near the player into the snapshot and drops the
   * ones left behind. Safe to call at any time: groups are matched by id, and
   * `world.fauna` only hands out a block it has not handed out before. */
  syncFauna() {
    if (!this.world.fauna) return;
    const p = this.state.player.pos;
    this.state.fauna ??= [];
    // Groups far behind the player are dropped and their block released, so
    // a long walk does not grow the save without bound; coming back spawns
    // the same animals from the same seed.
    const stale = new Set<string>();
    this.state.fauna = this.state.fauna.filter((g) => {
      if (
        Math.abs(g.pos.x - p.x) <= FAUNA_KEEP &&
        Math.abs(g.pos.y - p.y) <= FAUNA_KEEP
      )
        return true;
      if (g.train) return true;
      if (!g.gateId) stale.add(faunaBlockOf(g.home.x, g.home.y));
      return !!g.gateId;
    });
    for (const key of stale) this.world.forgetFauna?.(key);
    const known = new Set(this.state.fauna.map((g) => g.id));
    for (const g of this.world.fauna(p.x, p.y))
      if (!known.has(g.id)) {
        known.add(g.id);
        this.state.fauna.push(copy(g));
        this.soil(g);
      }
    for (const g of this.state.fauna) this.enrol(g);
    // A herd at grass brings its herders with it: they join the world's list
    // as the herd is made, which is after that list was last read.
    const here = new Set(this.state.actors.map((a) => a.id));
    for (const actor of this.world.initialActors)
      if (actor.tends && !here.has(actor.id))
        this.state.actors.push({
          ...copy(actor),
          lastUpdated: this.state.clock,
        });
    this.syncWayfarers(this.state.clock);
  }
  /** Lets in whoever is coming down the road and drops whoever has gone on. */
  private syncWayfarers(clock: number) {
    if (!this.world.wayfarers) return;
    this.state.actors = this.state.actors.filter((a) => !a.wayfarer || a.wayfarer.until > clock);
    this.state.fauna = this.state.fauna?.filter((g) => !g.train || g.members.length);
    const here = new Set(this.state.actors.map((a) => a.id));
    for (const actor of this.world.wayfarers(clock))
      if (!here.has(actor.id)) {
        this.state.actors.push({ ...copy(actor), lastUpdated: clock });
        const train = actor.wayfarer!.train;
        if (!train) continue;
        const g: FaunaGroup = {
          id: `${actor.id}-train`,
          speciesId: train.species,
          members: Array.from({ length: train.count }, (_, n) => ({ x: actor.pos.x, y: actor.pos.y, direction: 1, n })),
          pos: { ...actor.pos },
          home: { ...actor.pos },
          homeRadius: 4,
          state: "wander",
          nextDecisionAt: 0,
          stride: 0,
          since: clock,
          train: true,
        };
        this.enrol(g);
        this.walkTrain(g, clock);
        (this.state.fauna ??= []).push(g);
      }
  }
  /** Pack animals keep to their own day on the road, and are gone at the
   * border with the people driving them. */
  private walkTrain(g: FaunaGroup, clock: number) {
    const side = !faunaProfile(g.speciesId)?.directions;
    let moving = false;
    g.members = g.members.filter((m) => {
      const day = this.world.itinerary?.(`${g.id}-${m.n}`);
      if (!day) return false;
      if (clock / 60 < day.start) return true;
      const at = itineraryAt(day, clock);
      if (at.activity === "rest") return false;
      m.x = Math.round(at.x);
      m.y = Math.round(at.y);
      moving ||= at.moving;
      // Side-view art has no north or south: it keeps the last way it faced.
      if (at.moving && !(side && at.direction % 2 === 0)) m.direction = at.direction as FaunaMember["direction"];
      return true;
    });
    if (g.members[0]) g.pos = { x: g.members[0].x, y: g.members[0].y, space: "outside" };
    g.state = moving ? "wander" : "graze";
  }
  /** A herder's day is the herd's: keep to a place beside it, move when it
   * moves, and sit up with it at night. They eat what they carry. */
  private tendHerd(a: Actor, clock: number) {
    const herd = this.state.fauna?.find((g) => g.id === a.tends!.herd);
    a.hunger = Math.min(a.hunger, 30);
    a.offRoutine = true;
    const hour = (clock / 3600) % 24;
    const label = herd ? herdNoun(herd.speciesId) : "herd";
    a.activity =
      hour < 5 || hour >= 20
        ? `Watching the ${label} by night`
        : herd && ["flee", "chase"].includes(herd.state)
          ? `Going after the ${label}`
          : `Minding the ${label}`;
    if (!herd?.members.length) return;
    // The middle of the animals as they stand, not where the herd began.
    const cx = herd.members.reduce((s, m) => s + m.x, 0) / herd.members.length,
      cy = herd.members.reduce((s, m) => s + m.y, 0) / herd.members.length;
    const [dx, dy] = (
      [
        [3, 1],
        [-3, 2],
        [1, -3],
      ] as const
    )[a.tends!.seat % 3];
    const target = {
      x: Math.round(cx) + dx,
      y: Math.round(cy) + dy,
      space: "outside",
    };
    if (distance(a.pos, target) > 2.5) this.stepToward(a, target);
    else {
      const fx = cx - a.pos.x,
        fy = cy - a.pos.y;
      a.direction =
        Math.abs(fx) >= Math.abs(fy) ? (fx > 0 ? 1 : 3) : fy > 0 ? 2 : 0;
    }
  }
  /** Vitals for new arrivals, and the legends among them onto the register.
   * One already slain does not come back with its block. */
  private enrol(g: FaunaGroup) {
    if (g.members.every((m) => m.n !== undefined)) return;
    ensureVitals(this.state.manifest.seed, g);
    const legends = (this.state.legends ??= {});
    g.members = g.members.filter((m) => {
      if (!m.name) return true;
      const key = legendKey(g.id, m.n!);
      if (legends[key]?.slain !== undefined) return false;
      legends[key] ??= {
        name: m.name,
        species: g.speciesId,
        at: { x: g.home.x, y: g.home.y },
      };
      return true;
    });
  }
  private devSerial = 0;
  /** Dev panel: real, simulated animals in a ring round the player. */
  devSpawnFauna(speciesId: string, count: number, tier?: FaunaTier) {
    const profile = faunaProfile(speciesId);
    const at = this.state.player.pos;
    if (!profile || at.space !== "outside") return 0;
    const members: FaunaMember[] = [];
    for (let ring = 3; ring <= 9 && members.length < count; ring++)
      for (let dy = -ring; dy <= ring && members.length < count; dy++)
        for (let dx = -ring; dx <= ring && members.length < count; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          if ((dx + dy) % 2) continue;
          const x = at.x + dx,
            y = at.y + dy;
          if (this.blocked(x, y, "outside") || this.faunaAt(x, y)) continue;
          members.push({ x, y, direction: dx < 0 ? 1 : 3, tier });
        }
    if (!members.length) return 0;
    const pos = { x: members[0].x, y: members[0].y, space: "outside" };
    while (
      this.state.fauna?.some((g) => g.id === `dev-fauna-${this.devSerial}`)
    )
      this.devSerial++;
    const group: FaunaGroup = {
      id: `dev-fauna-${this.devSerial++}`,
      speciesId,
      members,
      pos,
      home: { ...pos },
      homeRadius: 10,
      state: profile.art.idle ? "idle" : profile.art.perch ? "perch" : "rest",
      nextDecisionAt: this.state.clock + 30,
      stride: 0,
      since: this.state.clock,
    };
    this.enrol(group);
    (this.state.fauna ??= []).push(group);
    this.state.revision++;
    return members.length;
  }
  devClearFauna() {
    this.state.fauna = this.state.fauna?.filter(
      (g) => !g.id.startsWith("dev-fauna-"),
    );
    this.state.revision++;
  }
  /** Dev panel: put a prop straight into the player's hands, or empty them. */
  devArm(prop?: string) {
    const p = this.state.player;
    const old = heldObject(this.state);
    if (old?.id.startsWith("dev-weapon-"))
      this.state.objects = this.state.objects.filter((o) => o !== old);
    this.emptyHands();
    const def = prop ? propDefs[prop] : undefined;
    const sprite = prop && propSprite(prop);
    if (prop && def && sprite) {
      const id = `dev-weapon-${this.devSerial++}`;
      this.state.objects.push({
        id,
        name: def.name,
        kind: "container",
        prop,
        sprite,
        inventory: {},
        pos: copy(p.pos),
        carriedBy: "player",
      });
      p.held = id;
    }
    this.state.revision++;
  }
  /** Habitat suitability per species and cell, built on first use and kept:
   * the sim asks for it several times per animal per tick. */
  private habitat?: (speciesId: string, x: number, y: number) => number;
  /** One six-second step for the animal groups near the player. Their pace
   * is their own: a wolf outruns a person, a sheep does not keep up. */
  private stepFauna(clock: number) {
    const groups = this.state.fauna;
    if (!groups?.length) return;
    const player = this.state.player;
    const focus =
      player.pos.space === "outside"
        ? player.pos
        : {
            ...(this.world.place(player.pos.space)?.entrance ?? player.pos),
            space: "outside",
          };
    for (const g of groups) if (g.train) this.walkTrain(g, clock);
    const near = groups.filter(
      (g) =>
        !g.train &&
        Math.abs(g.pos.x - focus.x) <= 80 && Math.abs(g.pos.y - focus.y) <= 80,
    );
    if (!near.length) return;
    const humans = [
      player.pos,
      ...this.state.actors
        .filter(
          (a) =>
            a.kind === "human" &&
            a.pos.space === "outside" &&
            Math.abs(a.pos.x - focus.x) <= 90 &&
            Math.abs(a.pos.y - focus.y) <= 90,
        )
        .map((a) => a.pos),
    ];
    advanceFauna(
      near,
      {
        blocked: (x, y) => this.blocked(x, y, "outside"),
        canCross: this.world.canCross
          ? (from, to) => this.world.canCross!(from, to)
          : undefined,
        topography: this.world.topography
          ? (x, y) => this.world.topography!(x, y)
          : undefined,
        // The player is not among the actors, and is as solid as they are.
        occupied: (x, y) =>
          this.actorAt({ x, y, space: "outside" }, "") ||
          (this.state.player.pos.space === "outside" &&
            this.state.player.pos.x === x &&
            this.state.player.pos.y === y),
        gateOpen: (id) => !!this.object(id)?.open,
        humans,
        rng: (purpose) => this.rng(purpose),
        hour: (clock / 3600) % 24,
        habitat: (this.habitat ??= habitatScorer(this.world)),
        noise: this.noise(),
        dodging: clock - this.lastJump <= 6,
        onMaul: (g, m, dir, damage) => this.mauled(g, m, dir, damage),
        onKill: (g, prey, at) => {
          const kind = remainsOf(prey.speciesId);
          if (!kind) return;
          const pos = { x: at.x, y: at.y, space: "outside" as const };
          this.state.objects.push(
            remainsObject(kind, prey.speciesId, g.speciesId, pos, clock, `remains-${prey.id}-${clock}`),
          );
        },
        canDig: (x, y) =>
          !this.state.tiles?.[tileKey(x, y)]?.dug &&
          !this.cropAt(x, y) &&
          this.workable("dig", { x, y }),
        // The same broken ground a spade leaves, but it grows over.
        onDig: (_, at) => {
          const edit = this.editAt(at.x, at.y);
          if (edit.dug) return;
          edit.dug = true;
          edit.scraped = clock;
          this.tilesChanged();
        },
        // A fox eats at the den; a cat leaves a mouse for the household.
        onDrop: (g, prey, at) => {
          if (g.speciesId !== "cat" || this.blocked(at.x, at.y, "outside")) return;
          const pos = { x: at.x, y: at.y, space: "outside" as const };
          this.state.objects.push(
            remainsObject("gift", prey, g.speciesId, pos, clock, `gift-${g.id}-${clock}`),
          );
        },
        emit: (event) => {
          this.signal(event);
          // The moment to be somewhere else.
          if (event.kind === "windup") {
            const g = near.find((o) => o.id === event.group);
            this.cue("player", "alarm", g?.pos);
          }
        },
      },
      clock,
    );
    for (const g of near)
      for (const m of g.members) {
        if (!m.name || Math.hypot(m.x - focus.x, m.y - focus.y) > 12) continue;
        const memory = `seen:${legendKey(g.id, m.n!)}`;
        if (player.memories.includes(memory)) continue;
        player.memories.push(memory);
        this.event(`You catch sight of ${m.name}.`);
        this.cue("player", "alarm", m);
      }
    if (near.some((g) => g.provoked !== undefined))
      this.combatUntil = Math.max(this.combatUntil, clock + 30);
    this.dropDung(near, clock);
    // A herd eaten down to nothing leaves no group behind.
    this.state.fauna = groups.filter((g) => g.members.length);
    for (const o of this.state.objects) {
      const inAnimal = o.projectile?.lodgedIn;
      if (!inAnimal) continue;
      const m = groups.find((g) => g.id === inAnimal.group)
        ?.members.find((member) => member.n === inAnimal.n);
      if (m) { o.pos.x = m.x; o.pos.y = m.y; }
      else if (clock > this.combatUntil) delete o.projectile!.lodgedIn;
    }
  }
  /** Species that could come down on a crop here, by range and date. */
  private pestSpecies?: Set<string>;
  private nextRaidCheck = 0;
  private raidSerial = 0;
  /** Pests come down on growing crops near the player, eat until someone
   * drives them off or they have had their fill, and come back another day. */
  private raidCrops(clock: number) {
    const raids = (this.state.fauna ?? []).filter((g) => g.raid);
    for (const g of raids) this.raidStep(g, clock);
    const setting = this.state.manifest.setting;
    const sample = this.world.topography;
    const p = this.state.player.pos;
    if (!setting || !sample || p.space !== "outside" || clock < this.nextRaidCheck) return;
    this.nextRaidCheck = clock + RAID_CHECK;
    if (raids.filter((g) => !g.raid!.left).length >= RAID_CAP) return;
    if (this.rng("raid") > RAID_CHANCE) return;
    const present = (this.pestSpecies ??= new Set(faunaAt(setting).map((f) => f.id)));
    const hour = (clock / 3600) % 24;
    for (let i = 0; i < 40; i++) {
      const x = p.x + Math.round((this.rng("raid-x") - 0.5) * 2 * RAID_REACH),
        y = p.y + Math.round((this.rng("raid-y") - 0.5) * 2 * RAID_REACH);
      if (Math.hypot(x - p.x, y - p.y) < 7) continue;
      const field = sample(x, y)?.field;
      const crop = field && crops[field.crop];
      if (!field || !pickable(crop) || this.pickedNow(this.state.tiles?.[tileKey(x, y)])) continue;
      const pests = pestsFor(crop, field.stage, hour, present);
      if (!pests.length) continue;
      let roll = this.rng("raid-pest") * pests.reduce((n, q) => n + q.weight, 0);
      const pest = pests.find((q) => (roll -= q.weight) < 0) ?? pests[0];
      this.startRaid(pest, { x, y }, clock);
      return;
    }
  }
  private startRaid(pest: CropPest, at: Point, clock: number) {
    const profile = faunaProfile(pest.species);
    if (!profile) return;
    const [lo, hi] = profile.groupSize;
    const count = lo + Math.floor(this.rng("raid-size") * (hi - lo + 1));
    // In from the far side, so they are seen arriving rather than appearing.
    const p = this.state.player.pos;
    const away = Math.atan2(at.y - p.y, at.x - p.x) + (this.rng("raid-angle") - 0.5) * 1.4;
    const entry = { x: at.x + Math.round(Math.cos(away) * 9), y: at.y + Math.round(Math.sin(away) * 9) };
    const members: FaunaMember[] = [];
    for (let ring = 0; ring <= 4 && members.length < count; ring++)
      for (let dy = -ring; dy <= ring && members.length < count; dy++)
        for (let dx = -ring; dx <= ring && members.length < count; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const x = entry.x + dx, y = entry.y + dy;
          if (this.blocked(x, y, "outside") || this.faunaAt(x, y)) continue;
          members.push({ x, y, direction: at.x < x ? 3 : 1 });
        }
    if (!members.length) return;
    const bird = profile.locomotion === "ground-and-flight";
    const target = { x: at.x, y: at.y, space: "outside" };
    const group: FaunaGroup = {
      id: `raid-${clock}-${this.raidSerial++}`,
      speciesId: pest.species,
      members,
      pos: { x: members[0].x, y: members[0].y, space: "outside" },
      home: { ...target },
      homeRadius: 2,
      state: bird ? "takeoff" : "wander",
      target,
      nextDecisionAt: clock + (bird ? 6 : 40),
      stride: 0,
      since: clock,
      raid: { x: at.x, y: at.y, since: clock, eaten: 0 },
    };
    this.enrol(group);
    (this.state.fauna ??= []).push(group);
    this.state.revision++;
    if (distance(p, target) > 20) return;
    const field = this.world.topography?.(at.x, at.y)?.field;
    const what = field ? this.cropPlant(crops[field.crop], at.y).name.toLowerCase() : "crop";
    this.event(`${pestArrival(pest.species)} ${what}.`);
    this.cue("player", "alarm", at);
  }
  /** One tick of a raid: feed on the crop underfoot, or, once put up, go. */
  private raidStep(g: FaunaGroup, clock: number) {
    const r = g.raid!;
    const sample = this.world.topography;
    if (r.left !== undefined) {
      const far = Math.hypot(g.pos.x - r.x, g.pos.y - r.y) > 22;
      if (far || clock - r.left > 120 || !g.members.length) {
        this.state.fauna = this.state.fauna?.filter((o) => o !== g);
        this.state.revision++;
      }
      return;
    }
    if ((g.panic ?? 0) > 0.3 || (g.hurtUntil ?? 0) > clock) return this.raidRouted(g, clock);
    const pest = sample ? pestOf(g.speciesId) : undefined;
    if (!pest || aerialStates.has(g.state) || g.state === "flee") return;
    let changed = false;
    for (const m of g.members) {
      const field = sample!(m.x, m.y)?.field;
      const crop = field && crops[field.crop];
      if (!field || !pickable(crop) || (field.stage !== "green" && field.stage !== "ripe")) continue;
      const edit = this.editAt(m.x, m.y);
      if (this.pickedNow(edit) || this.rng("raid-bite") > 0.35) continue;
      edit.nibbled = (edit.nibbled ?? 0) + 1;
      if (edit.nibbled < pest.bites) continue;
      edit.picked = clock;
      r.eaten++;
      changed = true;
      this.signal({ kind: "eaten", at: { x: m.x, y: m.y }, species: g.speciesId });
    }
    if (changed) this.tilesChanged();
    // Keep to what is left of the crop, not the patch already stripped.
    if (this.pickedNow(this.state.tiles?.[tileKey(g.home.x, g.home.y)])) {
      const next = this.uneatenNear(g.home, 4);
      if (next) g.home = { ...next, space: "outside" };
    }
    if (r.eaten >= RAID_FILL || clock - r.since > RAID_STAY) {
      r.left = clock;
      this.sendOff(g, g.home);
    }
  }
  private uneatenNear(at: Point, radius: number) {
    const sample = this.world.topography;
    for (let ring = 1; ring <= radius; ring++)
      for (let dy = -ring; dy <= ring; dy++)
        for (let dx = -ring; dx <= ring; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const x = at.x + dx, y = at.y + dy;
          const field = sample?.(x, y)?.field;
          if (field && pickable(crops[field.crop]) && !this.pickedNow(this.state.tiles?.[tileKey(x, y)]))
            return { x, y };
        }
    return undefined;
  }
  /** Off the crop and away from whoever put them up. */
  private sendOff(g: FaunaGroup, from: Point) {
    const a = Math.atan2(g.pos.y - from.y, g.pos.x - from.x) || this.rng("raid-off") * 6.28;
    g.home = { x: Math.round(g.pos.x + Math.cos(a) * 28), y: Math.round(g.pos.y + Math.sin(a) * 28), space: "outside" };
    g.homeRadius = 4;
    g.target = { ...g.home };
  }
  /** Someone has put the raid up. The player is thanked for it; someone
   * else doing it is worth a line if the player saw. */
  private raidRouted(g: FaunaGroup, clock: number) {
    const r = g.raid!;
    r.left = clock;
    const p = this.state.player;
    const chasers = this.state.actors.filter(
      (a) => a.kind === "human" && a.pos.space === "outside" && distance(a.pos, g.pos) < 7,
    );
    const player = p.pos.space === "outside" && distance(p.pos, g.pos) < 8;
    const by = player ? p.pos : chasers[0]?.pos;
    this.sendOff(g, by ?? g.pos);
    const field = this.world.topography?.(r.x, r.y)?.field;
    if (!field) return;
    const crop = this.cropPlant(crops[field.crop], r.y).name.toLowerCase();
    const pest = pestOf(g.speciesId);
    const them = pestNoun(g.speciesId);
    if (!player) {
      const a = chasers[0];
      if (a && distance(p.pos, a.pos) < 16)
        this.event(`${a.name} ${pest?.verb ?? "drives"}s the ${them} off the ${crop}.`, "social");
      return;
    }
    const mine = this.worksFor(field.owner);
    const owner = field.owner ? this.state.actors.find((a) => a.id === field.owner) : undefined;
    const day = this.today();
    day.pests = (day.pests ?? 0) + 1;
    this.grantXp("farming", 3 + g.members.length);
    const whose = mine ? "your" : owner ? `${owner.name}'s` : "the";
    const saved = r.eaten ? "" : " before they have taken any of it";
    this.event(`You ${pest?.verb ?? "drive"} the ${them} off ${whose} ${crop}${saved}.`);
    if (day.pests > 1 && [3, 5, 10].includes(day.pests))
      this.event(`That is ${day.pests} raids you have turned back today.`);
    if (mine) return;
    let thanked = false;
    for (const w of this.witnesses(14)) {
      if (!this.minds(w, field.owner)) continue;
      this.regard(w, 2, "warm");
      if (!thanked) this.event(`${w.name} calls out their thanks.`, "social");
      thanked = true;
    }
    if (!thanked && owner) {
      owner.memories.push(`The player drove the ${them} off my ${crop}`);
      this.regard(owner, 1, "nod");
    }
  }
  /** A farmer, a crop watcher or anyone whose field it is goes after a raid
   * they can see. The animals do the rest: a person coming at them is a
   * threat, and they go. */
  private shooPests(a: Actor, clock: number) {
    if (a.pos.space !== "outside" || a.age !== undefined && a.age < 7) return false;
    const raids = this.state.fauna?.filter((g) => g.raid && g.raid.left === undefined);
    if (!raids?.length) return false;
    const kit = a.origin && livelihoodById(a.origin.livelihood);
    const watcher = kit?.id === "crop-watcher";
    const farmer = watcher || (!!kit && workplaceFor(kit.activity) === "field");
    const hour = (clock / 3600) % 24;
    if (!watcher && (hour < 6 || hour >= 20)) return false;
    const reach = watcher ? 30 : 16;
    const raid = raids
      .filter((g) => {
        if (distance(a.pos, g.pos) > reach) return false;
        const owner = this.world.topography?.(g.raid!.x, g.raid!.y)?.field?.owner;
        return farmer || this.minds(a, owner) || owner === a.id;
      })
      .sort((m, n) => distance(a.pos, m.pos) - distance(a.pos, n.pos))[0];
    if (!raid) return false;
    const field = this.world.topography?.(raid.raid!.x, raid.raid!.y)?.field;
    const crop = field ? this.cropPlant(crops[field.crop], raid.raid!.y).name.toLowerCase() : "crop";
    a.offRoutine = true;
    a.activity = `Chasing the ${pestNoun(raid.speciesId)} off the ${crop}`;
    if (clock % 6 === 0)
      for (let i = 0; i < 2 && distance(a.pos, raid.pos) > 1.5; i++) this.stepToward(a, raid.pos);
    if (clock % 18 === 0 && distance(a.pos, raid.pos) < 6) this.cue(a.id, "point", raid.pos);
    return true;
  }
  /** Where a group has been living is not clean ground: a few days' dung
   * round its home, the older the further from the fold. */
  private soil(g: FaunaGroup) {
    const kind = dungOf[g.speciesId];
    if (!kind) return;
    const clock = this.state.clock;
    const n = Math.min(12, g.members.length * 2);
    for (let i = 0; i < n; i++) {
      const r = this.rng("dung-r") * Math.min(g.homeRadius, 6);
      const a = this.rng("dung-a") * Math.PI * 2;
      const x = Math.round(g.home.x + Math.cos(a) * r),
        y = Math.round(g.home.y + Math.sin(a) * r);
      if (this.blocked(x, y, "outside")) continue;
      const laid = clock - this.rng("dung-age") * 4 * 86400;
      this.state.objects.push(
        dungObject(kind, { x, y, space: "outside" }, laid, `dung-${g.id}-${i}`, g.speciesId, i % 2),
      );
    }
    this.state.objects = capDung(this.state.objects);
  }
  /** Where a dog or a wolf dug, the grass is back in five days. */
  private healScrapes(clock: number) {
    let healed = false;
    for (const [key, edit] of Object.entries(this.state.tiles ?? {}))
      if (edit.scraped !== undefined && clock - edit.scraped > SCRAPE_HEALS) {
        delete edit.dug;
        delete edit.scraped;
        if (!Object.keys(edit).length) delete this.state.tiles![key];
        healed = true;
      }
    if (healed) this.tilesChanged();
  }
  /** Animals relieve themselves where they stand, a dozen times a day for a
   * cow; each hour what lies about dries a little further. */
  private dropDung(groups: FaunaGroup[], clock: number) {
    let dropped = false;
    for (const g of groups) {
      const kind = dungOf[g.speciesId];
      if (!kind || aerialStates.has(g.state)) continue;
      const chance = (dungPerDay[kind] * 6) / 86400;
      for (const m of g.members) {
        if (this.rng("dung") >= chance) continue;
        const x = m.trail?.x ?? m.x,
          y = m.trail?.y ?? m.y;
        if (this.blocked(x, y, "outside")) continue;
        this.state.objects.push(
          dungObject(kind, { x, y, space: "outside" }, clock, `dung-${g.id}-${m.n ?? 0}-${clock}`, g.speciesId, clock % 2),
        );
        dropped = true;
      }
    }
    if (Math.floor(clock / 3600) !== Math.floor((clock - 6) / 3600)) {
      for (const o of this.state.objects) {
        if (o.dung) ageDung(o, clock);
        if (o.remains) ageRemains(o, clock);
      }
      this.state.objects = pruneRemains(this.state.objects, clock);
      this.healScrapes(clock);
      dropped = true;
    }
    if (dropped) this.state.objects = capDung(this.state.objects);
  }
  /** The traversal a move resolved to, for the renderer to animate. Cleared
   * once read, so a walked step never inherits the previous jump's arc. */
  lastLeap?: LeapResult;
  /** Tiles cleared by the last traversal; 1 for a plain step. */
  leapDistance() {
    return this.lastLeap?.distance ?? 1;
  }
  execute(c: PlayerCommand) {
    const p = this.state.player;
    if (c.type === "become") {
      this.becomeKin(c.heir);
      return;
    }
    if (p.dead) return;
    if (c.type === "care") { this.giveCare(c.target, c.treatment); return; }
    this.lastImpact = undefined;
    delete this.lastTreeFind;
    if (c.type !== "move" && c.type !== "pass") this.lastStep.steps = 0;
    if (c.type === "learn") {
      (p.techniques ??= []).push(c.technique);
      const t = technique(c.technique);
      this.event(`You learn ${t.name}: ${t.does.toLowerCase()}.`);
      return;
    }
    if (c.type === "swing") {
      const held = heldObject(this.state);
      const def = propDefs[held?.prop ?? ""];
      const inHand = p.heldItem ? this.item(p.heldItem)?.hand : undefined;
      const tool = held
        ? toolClass(def.tool, def.strike)
        : toolClass(undefined, inHand?.strike, inHand?.edge);
      const weapon = weaponOf(held?.prop, held ? undefined : inHand);
      p.direction = c.direction ?? this.aimAt(p.direction, weapon.reach);
      const swung = held?.name ?? (p.heldItem ? this.item(p.heldItem)?.name : undefined) ?? "fists";
      for (const w of this.witnesses(3))
        if (Math.max(Math.abs(w.pos.x - p.pos.x), Math.abs(w.pos.y - p.pos.y)) <= 2) {
          this.nuisance.set(w.id, { what: `swung ${tool === "bare" ? "their" : "a"} ${swung.toLowerCase()} close to you`, at: this.state.clock });
          if (tool !== "bare") this.affront(w);
        }
      const power = c.plunge ? 2 : (c.power ?? 0);
      // Coming down out of a jump, the ring lands all at once and at any reach.
      const cone = this.swingCone(p.direction, power, c.plunge ? 0 : weapon.reach);
      const hits: Hit[] = [];
      const creatures: CreatureHit[] = [];
      const force = c.plunge ? 2.5 : [1, 1.5, 2][power];
      const push = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ][p.direction];
      let told: string | undefined;
      for (const [i, at] of cone.entries()) {
        // A heavy tool takes a shut door off its hinges in a few blows.
        if ((i === 0 || power) && (tool === "blade" || tool === "blunt")) {
          const broke = this.bashDoor(at, p.pos.space, 1 + power);
          if (broke) {
            told = broke;
            continue;
          }
        }
        const person = this.state.actors.find((a) => a.kind === "human" && !a.dead && a.pos.space === p.pos.space && a.pos.x === at.x && a.pos.y === at.y);
        if (person && this.state.manifest.survival) {
          this.strikePerson(person, weapon.damage * force, push);
          told = `You strike ${person.name}.`;
          continue;
        }
        if (person) this.witnessAssault(person);
        if (person?.terror?.fight && tool !== "bare") {
          this.stagger(person, push);
          told = `You drive ${person.name} back!`;
        }
        const animal =
          p.pos.space === "outside" ? this.faunaAt(at.x, at.y) : undefined;
        const found = this.hitClass(at.x, at.y, p.pos.space);
        if (animal) {
          // A wound-up swing throws things outward from the player, not
          // along the way they happen to be facing.
          const out = power
            ? [Math.sign(at.x - p.pos.x), Math.sign(at.y - p.pos.y)]
            : push;
          const struck = this.strikeFauna(
            animal.g,
            animal.m,
            {
              ...weapon,
              damage:
                weapon.damage *
                (1 + this.skillLevel("arms") * PER_LEVEL.armsDamage) *
                (this.knows("sure-grip") ? 1.2 : 1),
              knock:
                weapon.knock +
                (power ? 1 : 0) +
                (c.plunge ? 1 : 0) +
                (this.knows("heavy-swing") ? 1 : 0),
            },
            out,
            (i === 0 || power || weapon.reach ? 1 : 0.6) * force,
          );
          if (struck) {
            creatures.push(struck);
            this.grantXp("arms", 4);
          }
        }
        if (found.prop) this.propOwnership(found.prop, "strike");
        const kind = reactionFor(found.hit, tool);
        const h: Hit = {
          at,
          hit: found.hit,
          kind,
          solid: isSolid(kind),
          sprite: found.sprite,
          id: found.prop?.id,
        };
        // The cell you face takes the blow; the corners only rattle, so a
        // plain arc never breaks three pots at once. A wound-up one breaks
        // the lot, and hard enough to do with bare hands what a tool would.
        if (
          (i === 0 || power || (weapon.reach && !hits.some((hit) => hit.solid))) &&
          found.prop &&
          (tool !== "bare" || power || found.hit === "pottery")
        ) {
          const outcome = this.hurtProp(
            found.prop,
            found.hit,
            1 + power,
            power ? [Math.sign(at.x - p.pos.x), Math.sign(at.y - p.pos.y)] : undefined,
          );
          h.damaged = !!outcome;
          const name = found.prop.name.toLowerCase();
          // What spills goes straight to the player, as it would in an
          // arcade game; the renderer throws it out and back.
          if (outcome === "broke" || outcome === "tipped") {
            const loot = this.spill(found.prop);
            if (loot.length) h.loot = loot;
          }
          const spilled = h.loot?.length
            ? ` Out comes ${listing(h.loot.map(({ item, n }) => this.lootName(item, n)))}.`
            : "";
          told =
            outcome === "broke"
              ? `You break ${name}.${spilled || " It was empty."}`
              : outcome === "tipped"
                ? `You knock ${name} over.${spilled || " Nothing in it."}`
                : outcome === "leaned"
                  ? `You loosen ${name}. It stands at a slant; another push will topple it.`
                : outcome === "damaged"
                  ? `You strike ${name}. It is damaged but still holds together.`
                  : undefined;
        }
        hits.push(h);
        if (p.pos.space === "outside" && !this.lastTreeFind) this.shakeTree(at.x, at.y);
      }
      if (p.heldItem === "torch" && p.pos.space === "outside") {
        const lit = this.ignite(cone[0].x, cone[0].y);
        if (lit) told = lit;
      }
      if (p.pos.space === "outside" && p.heldItem !== "torch") {
        const cut: Species[] = [];
        let changed = false;
        const got: string[] = [];
        for (const h of hits) {
          if (h.solid) continue;
          const species = this.cutGrowth(h.at.x, h.at.y, power);
          if (species === false) continue;
          changed = true;
          h.damaged = true;
          if (!species) continue;
          cut.push(species);
          got.push(...this.gather([species]));
          const loot = Object.entries(this.gathered).map(([item, n]) => ({
            item,
            n,
          }));
          if (loot.length) h.loot = loot;
        }
        if (changed) this.tilesChanged();
        if (got.length && !told)
          told = `You cut ${cut[0].common.toLowerCase()} and gather ${listing(got)}.`;
        const reaped = this.cutCrops(hits);
        if (reaped && !told) told = reaped;
      }
      this.lastSwing = {
        hits,
        tool,
        direction: p.direction,
        creatures,
        power,
        thrust: !!weapon.reach && !c.plunge,
        plunge: !!c.plunge,
      };
      if (power) p.fatigue = Math.min(100, p.fatigue + power * 0.6);
      if (creatures.length)
        this.state.fauna = this.state.fauna?.filter((g) => g.members.length);
      const solid = hits.find((h) => h.solid);
      if (told) this.event(told);
      else if (solid && solid.hit !== "creature")
        this.event(
          `Your swing ${solid.kind === "thwock" ? "rings off" : "thumps into"} the ${plantName(solid.sprite)}.`,
        );
      this.advance((solid ? 3 : 2) + power * 2);
      return;
    }
    if (c.type === "shoot") {
      const from = { x: p.pos.x, y: p.pos.y };
      const dx = Math.sign(c.target.x - from.x), dy = Math.sign(c.target.y - from.y);
      p.direction = Math.abs(c.target.y - from.y) > Math.abs(c.target.x - from.x)
        ? dy < 0 ? 0 : 2 : dx > 0 ? 1 : 3;
      p.facing = facingFromStep(dx, dy, p.direction);
      const path = this.projectilePath(c.target, this.bowRange());
      const to = path.at(-1) ?? from;
      const hit = this.hitClass(to.x, to.y, p.pos.space);
      const found = p.pos.space === "outside" ? this.faunaAt(to.x, to.y) : undefined;
      const shot = this.ammo()!;
      if (shot !== "arrow") {
        // A stone stuns more than it wounds, and lies where it falls.
        const creature = found && this.strikeFauna(
          found.g, found.m,
          {
            damage: 2 + 4 * (c.power ?? 1) + (this.knows("heavy-draw") ? 2 : 0),
            knock: 2,
            stun: this.knows("pinning-shot") ? 16 : 8,
          },
          [dx, dy], 1,
        );
        if (!--p.inventory[shot]!) delete p.inventory[shot];
        this.grantXp("marksmanship", creature ? 7 : 1);
        if (creature)
          this.state.fauna = this.state.fauna?.filter((g) => g.members.length);
        const def = this.item(shot)!;
        const id = `slung-${shot}-${this.state.revision}`;
        if (path.length && hit.hit !== "water")
          this.state.objects.push({
            id, name: def.name, kind: "item", item: shot, sprite: def.sprite,
            pos: { ...p.pos, x: to.x, y: to.y }, inventory: {},
          });
        const kind = creature ? "flinch" : reactionFor(hit.hit, "thrown");
        this.lastThrow = {
          from, to, sprite: def.sprite, small: true, sling: true, creature,
          id: path.length && hit.hit !== "water" ? id : undefined,
          hit: { at: to, hit: creature ? "creature" : hit.hit, kind, solid: isSolid(kind), damaged: !!creature },
        };
        this.event(creature ? "Your stone cracks home." : "You let fly a stone.");
        this.advance(2);
        return;
      }
      const creature = found && this.strikeFauna(
        found.g, found.m,
        {
          damage: 3 + 5 * (c.power ?? 1) + (this.knows("heavy-draw") ? 3 : 0),
          knock: 1,
          stun: this.knows("pinning-shot") ? 8 : 4,
        },
        [dx, dy], 1,
      );
      p.inventory.arrow!--;
      if (!p.inventory.arrow) delete p.inventory.arrow;
      this.grantXp("marksmanship", creature ? 7 : 1);
      const spentId = path.length
        ? `spent-arrow-${this.state.revision}` : undefined;
      if (spentId)
        this.state.objects.push({
          id: spentId,
          name: "Arrow",
          kind: "item",
          item: "arrow",
          sprite: "arrow",
          pos: { ...p.pos, x: creature?.to.x ?? to.x, y: creature?.to.y ?? to.y },
          inventory: {},
          projectile: {
            dx: to.x - from.x, dy: to.y - from.y,
            ...(creature
              ? { lodgedIn: { group: creature.group, n: creature.n } }
              : {}),
          },
        });
      if (creature)
        this.state.fauna = this.state.fauna?.filter((g) => g.members.length);
      const kind = creature ? "flinch" : reactionFor(hit.hit, "thrown");
      this.lastThrow = {
        from, to, sprite: "arrow", arrow: true, straight: true, creature, id: spentId,
        hit: { at: to, hit: creature ? "creature" : hit.hit, kind, solid: isSolid(kind), damaged: !!creature },
      };
      this.event(creature ? "Your arrow finds its mark." : "You loose an arrow.");
      this.advance(2);
      return;
    }
    if (c.type === "throw") {
      const item = heldObject(this.state) ? undefined : p.heldItem;
      const missile = this.missile();
      // An item leaves the hand as an object on the ground, like one set down.
      const prop =
        heldObject(this.state) ??
        (item && {
          id: `thrown-${item}-${this.state.revision}`,
          name: this.item(item)!.name,
          kind: "item" as const,
          item,
          sprite: this.item(item)!.sprite,
          pos: copy(p.pos),
          inventory: {},
        });
      if (!prop) throw Error("Throw validation failed");
      if (item) {
        this.state.objects.push(prop);
        delete p.heldItem;
      }
      p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
      p.facing = facingFromStep(c.dx, c.dy, p.direction);
      const path = c.target
        ? this.projectilePath(c.target, missile.range)
        : this.throwPath(c.dx, c.dy, c.reach, c.run);
      const landed = { ...p.pos, ...(path.at(-1) ?? p.pos) };
      const quarry =
        landed.space === "outside"
          ? this.faunaAt(landed.x, landed.y)
          : undefined;
      const distance = Math.max(
        Math.abs(landed.x - p.pos.x),
        Math.abs(landed.y - p.pos.y),
      );
      // Read the landing cell before the prop is standing in it.
      const ground = this.hitClass(landed.x, landed.y, landed.space);
      const sprite = prop.sprite;
      prop.pos = landed;
      delete prop.carriedBy;
      delete p.held;
      const def = propDefs[prop.prop ?? ""];
      // A throw carries force of its own, and a throw from a height carries
      // the drop as well. Both feed the one number the landing table reads.
      const fell =
        landed.space === "outside" && this.world.elevation
          ? Math.max(
              0,
              Math.floor(
                (this.world.elevation(p.pos.x, p.pos.y) -
                  this.world.elevation(landed.x, landed.y)) /
                  TERRAIN_STEP,
              ),
            )
          : 0;
      const landing = distance
        ? this.land(
            prop,
            landed,
            energyOf((def?.shove?.mass ?? 1) * (c.run ? 3 : 2), fell),
          )
        : undefined;
      const kind = landing?.reaction ?? reactionFor(ground.hit, "thrown");
      const bursts = landing?.kind === "shatter";
      const hurl = (at: { g: FaunaGroup; m: FaunaMember }, share: number) =>
        this.strikeFauna(
          at.g,
          at.m,
          {
            damage:
              missile.damage *
              (c.run ? 1.3 : 1) *
              (this.knows("hurler") ? 1.33 : 1),
            knock: 1,
            stun: missile.stun * (this.knows("pinning-shot") ? 2 : 1),
          },
          [c.dx, c.dy],
          share,
        );
      let struck = quarry && distance ? hurl(quarry, 1) : undefined;
      // A stone that lands clean skips on a pace, and may find something there.
      let bounce: Point | undefined;
      const rests =
        distance >= 2 &&
        !struck &&
        !bursts &&
        landing?.kind !== "sink" &&
        kind !== "splash";
      const next = { ...landed, x: landed.x + c.dx, y: landed.y + c.dy };
      if (
        rests &&
        !!item && ["pebble", "flint", "obsidian", "stone", "river-rock"].includes(item) &&
        !this.blocked(next.x, next.y, next.space)
      ) {
        bounce = { x: next.x, y: next.y };
        const beyond =
          next.space === "outside" ? this.faunaAt(next.x, next.y) : undefined;
        if (beyond) struck = hurl(beyond, 0.6);
        prop.pos = next;
      }
      if (item && landing?.kind === "sink")
        this.state.objects = this.state.objects.filter((o) => o !== prop);
      // The next stone comes to hand without asking.
      if (item && (p.inventory[item] ?? 0) > 0) {
        p.inventory[item]!--;
        if (!p.inventory[item]) delete p.inventory[item];
        p.heldItem = item;
      }
      if (distance) this.grantXp("marksmanship", struck ? 7 : 1);
      if (struck)
        this.state.fauna = this.state.fauna?.filter((g) => g.members.length);
      if ((item === "spear" || item === "stick" || prop.prop === "spear" || prop.prop === "stick") &&
          landing?.kind !== "sink" && !bursts) {
        prop.projectile = {
          dx: landed.x - p.pos.x, dy: landed.y - p.pos.y,
          ...(struck && (item === "spear" || prop.prop === "spear")
            ? { lodgedIn: { group: struck.group, n: struck.n } }
            : {}),
        };
        if (struck) {
          prop.pos.x = struck.to.x;
          prop.pos.y = struck.to.y;
        }
      }
      // A pot that bursts gives up what it held, as one broken by a swing does.
      const loot = bursts ? this.spill(prop) : [];
      const impactKind = struck ? "flinch" : kind;
      this.lastThrow = {
        creature: struck,
        id: prop.id,
        small: !!item,
        bounce,
        straight: item === "spear" || (!!prop.prop && (weaponOf(prop.prop).thrown ?? 0) > 1),
        from: { x: p.pos.x, y: p.pos.y },
        to: { x: landed.x, y: landed.y },
        sprite,
        hit: {
          at: { x: landed.x, y: landed.y },
          hit: struck ? "creature" : landing?.hit ?? ground.hit,
          kind: impactKind,
          solid: isSolid(impactKind),
          damaged: !!struck || bursts || landing?.kind === "crush",
          loot: loot.length ? loot : undefined,
        },
      };
      if (!distance)
        this.event(`You have no room to throw ${prop.name.toLowerCase()}.`);
      else if (bursts)
        this.event(
          `You hurl ${prop.name.toLowerCase()}. It shatters where it lands.`,
        );
      else if (landing?.kind === "sink")
        this.event(
          `You hurl ${prop.name.toLowerCase()}. It goes under and does not come back.`,
        );
      else if (kind === "splash")
        this.event(
          `You hurl ${prop.name.toLowerCase()}. It lands with a splash.`,
        );
      else
        this.event(
          `You ${c.run ? "fling" : "throw"} ${prop.name.toLowerCase()} ${distance} pace${distance > 1 ? "s" : ""} away.`,
        );
      this.advance(3);
      return;
    }
    if (c.type === "move") {
      delete this.lastShove;
      if (!c.jump && !c.traverse && !(c.dx && c.dy) && p.pos.space === "outside" &&
          this.shakeTree(p.pos.x + c.dx, p.pos.y + c.dy)) {
        p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
        p.facing = facingFromStep(c.dx, c.dy, p.direction);
        this.advance(2);
        return;
      }
      const dodge = this.sidestep(c);
      if (dodge) {
        this.execute({ ...c, dx: dodge.x, dy: dodge.y });
        p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
        p.facing = facingFromStep(c.dx, c.dy, p.direction);
        return;
      }
      if (this.runningCollision(c)) {
        this.lastImpact = "collision";
        delete this.lastLeap;
        delete this.lastJostle;
        const damage = 6 + Math.min(9, this.lastStep.steps * 2);
        this.lastStep.steps = 0;
        this.hurt(damage, "a collision");
        this.event(`You slam into the obstacle and lose ${damage} health.`);
        this.advance(2);
        return;
      }
      const from = { ...p.pos };
      const toppling = !c.jump && !c.traverse && this.toppleTarget(c.dx, c.dy, c.run);
      if (toppling) {
        const outcome = this.tiltProp(toppling, c.dx, c.dy);
        p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
        p.facing = facingFromStep(c.dx, c.dy, p.direction);
        this.event(outcome === "leaned"
          ? `You shoulder ${toppling.name.toLowerCase()}. It tilts and stays at a slant.`
          : `You push ${toppling.name.toLowerCase()} over.`);
        this.advance(2);
        return;
      }
      const leap =
        c.traverse || c.jump
          ? this.traversal(p.pos, c.dx, c.dy, c.jump, c.run)
          : undefined;
      if (leap && leap.kind !== "blocked") {
        this.lastLeap = leap;
        if (c.jump) this.lastJump = this.state.clock;
        p.pos.x += c.dx * leap.distance;
        p.pos.y += c.dy * leap.distance;
        p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
        p.facing = facingFromStep(c.dx, c.dy, p.direction);
        const depth =
          p.pos.space === "outside" && this.world.topography
            ? waterDepthAt(this.world.topography, p.pos.x + 0.5, p.pos.y + 0.5)
            : 0;
        p.activity = p.afloat ? p.afloat === "swimming" ? "Swimming" : "Paddling" : depth > 0 ? "Wading" : "Exploring";
        this.populateNearby();
        this.fall(from, p.pos);
        this.advance(leap.seconds);
        if (p.dead) return;
        const key = `${Math.floor(p.pos.x / 64)},${Math.floor(p.pos.y / 64)}`;
        if (!this.state.visited.includes(key)) this.state.visited.push(key);
        return;
      }
      delete this.lastLeap;
      delete this.lastJostle;
      const occupant = this.state.actors.find(
        (a) =>
          a.pos.space === p.pos.space &&
          a.pos.x === p.pos.x + c.dx &&
          a.pos.y === p.pos.y + c.dy,
      );
      if (occupant && !this.inPlayerWay(occupant.pos)) occupant.pos = { ...p.pos };
      else if (occupant) {
        p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
        p.facing = facingFromStep(c.dx, c.dy, p.direction);
        this.collide(occupant, "player", !!c.run);
        this.advance(1);
        return;
      }
      const beast = this.jostle(c.dx, c.dy);
      if (beast?.crossing) {
        // Its body is still in the way; a moment and it is gone.
        const { g, m } = beast.found;
        this.lastJostle = {
          group: g.id,
          species: g.speciesId,
          n: m.n ?? 0,
          yielded: false,
          small: false,
        };
        p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
        p.facing = facingFromStep(c.dx, c.dy, p.direction);
        this.advance(2);
        return;
      }
      if (beast) {
        const { g, m } = beast.found;
        const from = { x: m.x, y: m.y };
        // Nowhere for a hen to go: it ducks round behind you.
        const to = beast.to ?? { ...p.pos };
        m.x = to.x;
        m.y = to.y;
        // The player takes the cell it left, so that cell is not held; and it
        // does not stop one square off, it goes.
        delete m.trail;
        m.shy = { x: p.pos.x, y: p.pos.y, until: this.state.clock + 40 };
        const sx = to.x - from.x,
          sy = to.y - from.y;
        if (sx) m.direction = sx > 0 ? 1 : 3;
        else if (faunaProfile(g.speciesId)?.directions)
          m.direction = sy > 0 ? 2 : 0;
        this.lastJostle = {
          group: g.id,
          species: g.speciesId,
          n: m.n ?? 0,
          yielded: true,
          small: beast.small,
        };
        p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
        p.facing = facingFromStep(c.dx, c.dy, p.direction);
        // Shouldering something aside is the step; the next one goes through.
        if (!beast.small) {
          this.advance(1);
          return;
        }
      }
      const push = this.shovePlan(c.dx, c.dy);
      const effort =
        push && !("refused" in push) ? this.applyShove(push, c.dx, c.dy) : 0;
      p.pos.x += c.dx;
      p.pos.y += c.dy;
      p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
      p.facing = facingFromStep(c.dx, c.dy, p.direction);
      if (p.pos.space === "outside") this.tread(p.pos.x, p.pos.y);
      const depth =
        p.pos.space === "outside" && this.world.topography
          ? waterDepthAt(this.world.topography, p.pos.x + 0.5, p.pos.y + 0.5)
          : 0;
      if (p.boat && p.pos.space === "outside" && !this.wet(p.pos.x, p.pos.y)) {
        this.aboard(p, undefined, p.pos.x, p.pos.y);
        this.event("You run the boat back to its mooring and step ashore.");
      }
      if (p.pos.space === "outside") this.swimStep(depth);
      p.activity = p.afloat ? p.afloat === "swimming" ? "Swimming" : "Paddling" : depth > 0 ? "Wading" : "Exploring";
      const steps = c.run && this.lastStep.run && this.state.clock - this.lastStep.clock <= 4 &&
        c.dx === this.lastStep.dx && c.dy === this.lastStep.dy ? this.lastStep.steps + 1 : 1;
      this.lastStep = { clock: this.state.clock, run: !!c.run, dx: c.dx, dy: c.dy, steps: c.run ? steps : 0 };
      if (p.pos.space === "outside")
        this.grantXp(
          "wayfaring",
          depth > 0 ? 0.6 : 0.15,
        );
      if (
        p.pos.space === "outside" &&
        this.state.fauna?.some(
          (g) =>
            g.owner &&
            Math.max(Math.abs(g.pos.x - p.pos.x), Math.abs(g.pos.y - p.pos.y)) <= 3,
        )
      )
        this.grantXp("animals", 0.4);
      this.populateNearby();
      const rise =
        p.pos.space === "outside" && this.world.elevation
          ? this.world.elevation(p.pos.x, p.pos.y) -
            this.world.elevation(p.pos.x - c.dx, p.pos.y - c.dy)
          : 0;
      const slope = Math.abs(rise);
      // Tier changes animate even without an explicit jump.
      if (slope >= TERRAIN_STEP)
        this.lastLeap = {
          kind: rise > 0 ? "climb" : "drop",
          distance: 1,
          seconds: 0,
          reason: rise > 0 ? "You scramble up." : "You drop down.",
        };
      this.fall(from, p.pos);
      this.advance(
        Math.ceil(
          (c.run && !depth ? (c.dx && c.dy ? 2 : 1) : c.dx && c.dy ? 3 : 2) *
            (1 +
              ((p.afloat ? p.afloat === "swimming" ? 2.5 : 1.4 : wadingCost(depth)) - 1) *
                (1 - this.skillLevel("wayfaring") * PER_LEVEL.watercraftPace) *
                  (this.knows("swimmer") ? 0.67 : 1)),
        ) +
          (slope > 1 ? 1 : 0) +
          effort + (this.state.manifest.survival ? Math.floor((1 - bodilyLimits(this.state).physical) * 3) : 0),
      );
      const key = `${Math.floor(p.pos.x / 64)},${Math.floor(p.pos.y / 64)}`;
      if (!this.state.visited.includes(key)) this.state.visited.push(key);
      if (p.dead) return;
      this.walkThroughDoor();
      if ((p.swum ?? 0) >= SWIM_RANGE) this.washAshore();
      return;
    }
    if (c.type === "pass") {
      this.advance(c.seconds);
      return;
    }
    if (c.type === "wait") {
      this.advance(c.seconds);
      if (p.dead) return;
      this.event(
        `You wait ${c.seconds >= 60 ? Math.round(c.seconds / 60) + " minutes" : c.seconds + " seconds"}.`,
      );
      return;
    }
    if (c.type === "sleep") {
      this.sleep(c.seconds);
      return;
    }
    if (c.type === "use") {
      const def = this.item(c.item)!;
      p.inventory[c.item] = (p.inventory[c.item] ?? 0) - 1;
      p.hunger = Math.max(0, p.hunger - (def.edible ?? 0));
      if (def.health && def.health > 0) this.heal(def.health);
      else if (def.health && this.state.manifest.survival) this.hurt(-def.health, "something you ate");
      else if (def.health) p.health = Math.max(0, (p.health ?? 100) + def.health);
      mealExposure(this.state, p, this.state.clock);
      this.advance(60);
      this.event(
        `You eat some ${def.name.toLowerCase()}.${def.health && def.health < 0 ? " It does not sit well." : ""}`,
      );
      return;
    }
    if (c.type === "wear") {
      const def = this.item(c.item)!;
      const slot = def.wear!.slot;
      p.worn ??= {};
      const previous = p.worn[slot];
      p.inventory[c.item] = (p.inventory[c.item] ?? 0) - 1;
      if (previous) p.inventory[previous] = (p.inventory[previous] ?? 0) + 1;
      p.worn[slot] = c.item;
      this.advance(20);
      this.event(`You put on the ${def.name.toLowerCase()}.`);
      return;
    }
    if (c.type === "hold") {
      this.emptyHands();
      p.inventory[c.item] = (p.inventory[c.item] ?? 0) - 1;
      if (!p.inventory[c.item]) delete p.inventory[c.item];
      p.heldItem = c.item;
      this.advance(4);
      this.event(`You take ${this.item(c.item)!.name.toLowerCase()} in hand.`);
      return;
    }
    if (c.type === "stow") {
      const what = p.heldItem
        ? this.item(p.heldItem)!.name.toLowerCase()
        : (this.state.objects
            .find((o) => o.id === p.held)
            ?.name.toLowerCase() ?? "it");
      const wasItem = !!p.heldItem;
      this.emptyHands();
      this.advance(4);
      this.event(wasItem ? `You put ${what} away.` : `You put down ${what}.`);
      return;
    }
    if (c.type === "drop") {
      const id = p.heldItem!;
      const def = this.item(id)!;
      const spot = this.dropSpot()!;
      delete p.heldItem;
      this.state.objects.push({
        id: `dropped-${id}-${this.state.revision}`,
        name: def.name,
        kind: "item",
        item: id,
        sprite: def.sprite,
        pos: spot,
        inventory: {},
      });
      this.advance(4);
      this.event(`You set ${def.name.toLowerCase()} down.`);
      return;
    }
    if (c.type === "give") {
      const a = this.state.actors.find((a) => a.id === c.target)!;
      const def = this.item(c.item)!;
      delete p.heldItem;
      a.inventory[c.item] = (a.inventory[c.item] ?? 0) + 1;
      // Someone hungry eats what they are handed, there and then.
      if (def.edible && a.hunger > 40) {
        a.inventory[c.item]!--;
        a.hunger = Math.max(0, a.hunger - def.edible);
      }
      if (this.state.kin) this.state.kin.talked[a.id] = this.state.clock;
      this.regard(a, 1);
      a.memories.push(`You gave them ${def.name.toLowerCase()}.`);
      const ask = this.state.asks?.find((x) => x.by === a.id && (x.kind === "food" ? !!def.edible : x.item === c.item));
      if (ask) this.grant(ask, a);
      this.advance(20, a.id);
      this.event(
        `You hand ${def.name.toLowerCase()} to ${a.name}. They take it.`,
        "social",
      );
      if (advanceLifeAim(this.state, { type: "give", actor: a.id, item: c.item }))
        this.event("You have completed a step toward your life aim.");
      return;
    }
    if (c.type === "remove") {
      const id = p.worn![c.slot]!;
      delete p.worn![c.slot];
      p.inventory[id] = (p.inventory[id] ?? 0) + 1;
      this.advance(20);
      this.event(
        `You take off the ${(this.item(id)?.name ?? id).toLowerCase()}.`,
      );
      return;
    }
    if (c.type === "choose") {
      this.choose(c.card, c.choice);
      return;
    }
    if (c.type === "narrate") {
      this.grantXp("speech", 3);
      this.lastOutcomes = resolveIntents(this, c.intents);
      return;
    }
    if (c.type === "interact" && c.action === "pickup") {
      const loose = this.state.objects.find(
        (o) => o.id === c.target && o.kind === "item",
      );
      if (loose) {
        this.emptyHands();
        p.heldItem = loose.item;
        this.state.objects = this.state.objects.filter((o) => o !== loose);
        this.advance(2);
        this.event(`You pick up ${loose.name.toLowerCase()}.`);
        return;
      }
    }
    if (c.type === "interact" && c.action === "tend-plot") {
      this.tendGarden();
      return;
    }
    if (c.type === "interact" && c.action === "gather") {
      const at = this.tileAt(c.target)!;
      this.editAt(at.x, at.y).stage = "clear";
      p.inventory.wood = (p.inventory.wood ?? 0) + 2;
      p.inventory.bark = (p.inventory.bark ?? 0) + 1;
      this.tilesChanged();
      this.advance(40);
      this.grantXp("woodcraft", 2);
      this.event("You drag the fallen log free of the moss and break it into firewood, peeling a strip of bark as you go.");
      return;
    }
    if (c.type === "interact" && c.action === "harvest") {
      const at = /^crop-(-?\d+)-(-?\d+)$/.exec(c.target);
      if (at) {
        this.pickCrop(Number(at[1]), Number(at[2]));
        return;
      }
    }
    if (c.type === "interact") {
      const prop = this.state.objects.find((o) => o.id === c.target && o.prop);
      if (
        prop &&
        ["pickup", "drop", "strike", "look", "right", "topple"].includes(
          c.action,
        )
      ) {
        const def = propDefs[prop.prop!];
        if (c.action === "pickup") {
          this.emptyHands();
          delete prop.projectile;
          prop.carriedBy = "player";
          p.held = prop.id;
          prop.pos = copy(p.pos);
          this.propOwnership(prop, "pick up");
          this.event(
            `You pick up ${prop.name.toLowerCase()}. ${def.attack === "thrust" ? "F thrusts it." : def.attack === "rake" ? "F rakes with it." : def.attack === "hook" ? "F cuts with it." : def.strike ? "F swings it." : "F throws it; E puts it down."}`,
          );
        } else if (c.action === "drop") {
          const spot = this.dropSpot();
          if (!spot) throw Error("Drop validation failed");
          prop.pos = spot;
          delete prop.carriedBy;
          delete p.held;
          this.event(`You put down ${prop.name.toLowerCase()}.`);
        } else if (c.action === "look") {
          prop.open = true;
          const contents = Object.entries(prop.inventory)
            .filter(([, n]) => n! > 0)
            .map(
              ([id, n]) =>
                `${n} ${this.items[id as ItemId].name.toLowerCase()}`,
            );
          this.event(
            contents.length
              ? `Inside ${prop.name.toLowerCase()}: ${contents.join(", ")}.`
              : `${prop.name} is empty.`,
          );
        } else if (c.action === "right") {
          prop.tipped = false;
          delete prop.lean;
          this.event(`You stand ${prop.name.toLowerCase()} back up.`);
        } else if (c.action === "topple") {
          // Knocked over, not broken: it empties where it lies.
          this.propOwnership(prop, "break");
          prop.tipped = true;
          delete prop.lean;
          prop.open = true;
          this.event(
            `You knock ${prop.name.toLowerCase()} over. What it held rolls out.`,
          );
        } else if (c.action === "strike" && def.breakable) {
          this.propOwnership(prop, "break");
          prop.damage = (prop.damage ?? 0) + 1;
          const resistance =
            def.breakable === "wood" || def.breakable === "metal"
              ? 3
              : def.breakable === "fiber" || def.breakable === "plastic"
                ? 2
                : 1;
          if (prop.damage >= resistance) {
            prop.broken = true;
            prop.open = true;
            prop.depleted = false;
            prop.sprite = brokenSprite(prop.id, def.breakable);
            this.event(
              `You break ${prop.name.toLowerCase()}. Its contents spill onto the ground.`,
            );
          } else
            this.event(
              `You strike ${prop.name.toLowerCase()}. It is damaged but still holds together.`,
            );
        }
        this.advance(c.action === "strike" || c.action === "topple" ? 4 : 2);
        return;
      }
    }
    const a = this.state.actors.find((a) => a.id === c.target),
      o = this.state.objects.find((o) => o.id === c.target),
      b = this.world.place(c.target);
    if (c.type === "deal" && a) {
      const shop = this.shopOf(a.id, true)!;
      const stock = { ...shop.stock };
      let purse = shop.purse;
      for (const [id, n = 0] of Object.entries(c.give)) {
        p.inventory[id] = (p.inventory[id] ?? 0) - n;
        if (id === "coin") purse += n;
        else stock[id] = (stock[id] ?? 0) + n;
      }
      for (const [id, n = 0] of Object.entries(c.take)) {
        p.inventory[id] = (p.inventory[id] ?? 0) + n;
        if (id === "coin") purse -= n;
        else stock[id] = (stock[id] ?? 0) - n;
      }
      a.shop = { day: shop.day, stock, purse };
      if (this.state.goalFlags) this.state.goalFlags.traded = true;
      this.advance(60, a.id);
      this.regard(a, this.knows("fair-dealer") ? 2 : 1);
      this.grantXp("trade", Math.min(40, 5 + this.worth(c.take, "buy")));
      const list = (inv: Inventory) =>
        Object.entries(inv).filter(([, n]) => (n ?? 0) > 0)
          .map(([id, n]) => id === "coin" && this.world.pack.setting
            ? amountIn(this.world.pack.setting, n!, true)
            : `${n} ${this.items[id]?.name.toLowerCase() ?? this.item(id)?.name.toLowerCase() ?? id}`)
          .join(", ");
      const gave = list(c.give), got = list(c.take);
      this.event(gave && got ? `${a.name} takes ${gave} for ${got}.` : got ? `${a.name} gives you ${got}.` : `${a.name} takes ${gave}.`, "social");
      return;
    }
    if (c.type === "trade" && a) {
      if (this.state.goalFlags) this.state.goalFlags.traded = true;
      // Reserve both participants for this short exchange; commit both transfers together.
      p.inventory[c.give] = (p.inventory[c.give] ?? 0) - c.giveQuantity;
      a.inventory[c.give] = (a.inventory[c.give] ?? 0) + c.giveQuantity;
      a.inventory[c.take] = (a.inventory[c.take] ?? 0) - c.takeQuantity;
      p.inventory[c.take] = (p.inventory[c.take] ?? 0) + c.takeQuantity;
      this.advance(60, a.id);
      this.regard(a, this.knows("fair-dealer") ? 2 : 1);
      this.grantXp(
        "trade",
        Math.min(40, 5 + this.items[c.take].value * c.takeQuantity),
      );
      this.event(
        `${a.name} accepts: ${c.giveQuantity} ${this.items[c.give].name.toLowerCase()} for ${c.takeQuantity} ${this.items[c.take].name.toLowerCase()}.`,
        "social",
      );
      return;
    }
    if (c.type !== "interact") return;
    if (c.action === "strike" && a?.kind === "human" && this.state.manifest.survival) {
      const held = heldObject(this.state);
      const weapon = weaponOf(held?.prop, p.heldItem ? this.item(p.heldItem)?.hand : undefined);
      p.direction = this.directionTo(p.pos, a.pos);
      this.strikePerson(a, weapon.damage, [Math.sign(a.pos.x - p.pos.x), Math.sign(a.pos.y - p.pos.y)]);
      this.advance(4);
      return;
    }
    switch (c.action) {
      case "talk":
        if (a) {
          if (this.state.kin) this.state.kin.talked[a.id] = this.state.clock;
          const errand = this.state.asks?.find((x) => x.kind === "talk-to" && x.to === a.id);
          const sender = errand && this.state.actors.find((x) => x.id === errand.by);
          if (errand && sender) {
            a.memories.push(`The player came on behalf of ${sender.name}, who asked them to ${errand.what}`);
            this.grant(errand, sender);
          }
          const plot = this.state.plot;
          const role = plot && !plot.ended && Object.keys(plot.cast).find((r) => plot.cast[r] === a.id);
          // Talking again after the day's work counts again: that is the work brought over.
          if (role && plot.fired.lastIndexOf(`talked:${role}`) <= plot.fired.lastIndexOf("worked")) {
            plot.fired.push(`talked:${role}`);
            this.runPlot();
          }
          if (this.state.goalFlags) {
            this.state.goalFlags.talked = true;
            (this.state.goalFlags.talkedTo ??= []).push(a.id);
          }
          this.advance(90, a.id);
          // People talking look at each other.
          p.direction = this.directionTo(p.pos, a.pos);
          a.direction = this.directionTo(a.pos, p.pos);
          delete p.facing;
          delete a.facing;
          if (a.trust >= 0)
            this.regard(
              a,
              (this.rng("speech") <
              this.skillLevel("speech") *
                PER_LEVEL.speechWarmth *
                (this.knows("warm-word") ? 2 : 1)
                ? 2
                : 1) +
                (a.trust === 0 && this.knows("first-impression") ? 1 : 0),
            );
          // Still holding a loss against you: asking again does not help.
          else this.cue(a.id, "anger", p.pos);
          this.grantXp("speech", 8);
          const owner = this.world.places.find((b) => b.owner === a.id);
          if (a.trust >= 2) {
            this.state.permissions[a.id] = this.state.clock + 3600 * 3;
            this.event(
              `${a.name}: “${this.world.pack.greeting} You may visit ${owner?.name.toLowerCase() ?? "our household"} for the next few hours.”`,
              "social",
            );
          } else
            this.event(
              `${a.name}: “Something has gone missing. Return it before asking for favors.”`,
              "social",
            );
          if (a.trust >= 0 && advanceLifeAim(this.state, { type: "talk", actor: a.id }))
            this.event("You have completed a step toward your life aim.");
        }
        break;
      case "pay":
        if (a) {
          const given = this.settle(p.inventory, a, this.payable());
          this.advance(30, a.id);
          this.regard(a, 1);
          const owed = this.state.plot?.owed ?? 0;
          this.event(
            `You pay ${a.name} ${given}.${owed > 0 ? " It is not yet enough." : ""}`,
            "social",
          );
          this.runPlot();
        }
        break;
      case "follow":
        if (a) {
          this.advance(30, a.id);
          a.consentUntil = this.state.clock + 600;
          p.follows = a.id;
          this.cue(a.id, "beckon", p.pos);
          this.event(
            `${a.name} agrees to your company on the way to work. The invitation lasts ten minutes.`,
            "social",
          );
        }
        break;
      case "enter":
        if (b) {
          const errand = this.state.asks?.find((x) => x.kind === "go-to" && x.place === b.id);
          const sender = errand && this.state.actors.find((x) => x.id === errand.by);
          if (errand && sender) this.grant(errand, sender);
          this.advance(10);
          const room = this.interiorOf(b.id);
          p.pos = room ? { ...room.entry, space: b.id } : { x: 6, y: 8, space: b.id };
          p.activity = "Visiting a household";
          this.event(
            `You ${this.world.pack.entryLabel.toLowerCase()} ${b.name.toLowerCase()}.`,
          );
        }
        break;
      case "exit": {
        const home = this.world.place(p.pos.space);
        if (home) {
          // Out through the door that was drawn, not the lot's street corner.
          p.pos = { ...doorApproach(home), space: "outside" };
          const out = this.doorOf(home.id);
          if (out) out.open = true;
          this.advance(10);
          this.event("You return to the open air.");
        }
        break;
      }
      case "open":
      case "close":
        if (o?.broken) break;
        if (o) {
          o.open = c.action === "open";
          this.advance(3);
          this.event(
            o.kind === "door"
              ? `You ${c.action} the door.`
              : `You ${c.action} the gate.`,
          );
        }
        break;
      case "knock": {
        const place = o?.placeId ? this.world.place(o.placeId) : undefined;
        this.advance(30);
        if (!place || !o) break;
        // The rattle the renderer draws; cleared when the door next moves.
        o.knocked = this.state.clock;
        const inside = this.state.actors
          .filter((a) => a.pos.space === place.id && a.kind === "human")
          .sort((a, b) => (a.id < b.id ? -1 : 1));
        const hour = (this.state.clock / 3600) % 24;
        const answerer = inside[0];
        if (!answerer) {
          this.event(
            `You knock at ${place.name.toLowerCase()}. Nobody answers.`,
          );
          break;
        }
        if (hour < 6 || hour >= 22) {
          this.event(
            `A voice inside tells you to come back in daylight. The door stays shut.`,
          );
          break;
        }
        if (answerer.trust < 0) {
          this.event(
            `${answerer.name} calls through the door for you to go away.`,
          );
          break;
        }
        // Answering is standing granted, the same way a conversation grants it,
        // and it lapses the same way.
        this.state.permissions[place.owner] = this.state.clock + 3600;
        o.open = true;
        this.moveActor(answerer, { ...place.entrance, space: "outside" });
        answerer.activity = "Answering the door";
        this.doorAnswer = answerer.id;
        this.event(`${answerer.name} opens the door and looks you over.`);
        break;
      }
      case "use-prop":
        this.useProp();
        break;
      case "climb": {
        const target = this.climbable();
        if (target) this.perch(target);
        break;
      }
      case "descend":
        this.descend(c.dx || c.dy ? { dx: c.dx ?? 0, dy: c.dy ?? 0 } : undefined);
        break;
      case "drink":
        p.inventory.water = Math.max(p.inventory.water ?? 0, 2);
        if (!this.state.manifest.survival) p.fatigue = Math.max(0, p.fatigue - 2);
        this.advance(30);
        this.event("You drink cool water and refill your vessel.");
        break;
      case "sleep":
        this.sleep(this.untilMorning());
        break;
      case "rest":
        p.activity = "Resting";
        this.advance(1200);
        p.fatigue = Math.max(0, p.fatigue - (this.state.manifest.survival ? 4 : 35));
        const depth =
          p.pos.space === "outside" && this.world.topography
            ? waterDepthAt(this.world.topography, p.pos.x + 0.5, p.pos.y + 0.5)
            : 0;
        p.activity = p.afloat ? p.afloat === "swimming" ? "Swimming" : "Paddling" : depth > 0 ? "Wading" : "Exploring";
        this.event("You rest beside the household’s work. Your fatigue eases.");
        break;
      case "work":
        this.doWork();
        break;
      case "launch":
        if (o && this.atBoat(o) && !o.away && !p.afloat) {
          p.pos = { x: o.pos.x, y: o.pos.y, space: "outside" };
          this.aboard(p, o.id, o.pos.x, o.pos.y);
          p.activity = "Paddling";
          this.advance(60);
          this.event(`You push the ${o.name.toLowerCase()} off and climb in.`);
        }
        break;
      case "store":
        if (o) {
          const amount = depositSupplies(p, o);
          this.advance(30);
          this.event(
            `You contribute ${amount} supplies to the household stores.`,
          );
        }
        break;
      case "chop":
      case "dig":
      case "reap":
      case "mine":
        this.useTool(c.action, c.target);
        break;
      case "heave":
        this.heave(c.target);
        break;
      case "light":
        this.lightTorch(o!);
        break;
      case "fill": {
        this.pail()!.inventory.water = 1;
        this.advance(20);
        this.event("You fill the pail.");
        break;
      }
      case "douse":
        this.douse(this.tileAt(c.target)!);
        break;
      case "burn": {
        const at = this.tileAt(c.target)!;
        this.advance(20);
        this.event(this.ignite(at.x, at.y) ?? "It will not catch.");
        break;
      }
      case "cook":
        if (o) {
          const raw = Math.min(4, p.inventory.meat ?? 0);
          if (!raw) break;
          p.inventory.meat = (p.inventory.meat ?? 0) - raw;
          p.inventory["cooked-meat"] = (p.inventory["cooked-meat"] ?? 0) + raw;
          this.advance(240 * raw);
          this.event(
            `You cook ${raw} ${raw === 1 ? "piece" : "pieces"} of meat over ${o.name.toLowerCase()}.`,
          );
        }
        break;
      case "harvest":
        if (o) {
          if (!harvestResource(p, o, this.state.clock)) break;
          this.advance(this.knows("quick-picker") ? 90 : 180);
          if (o.resource || o.kind === "tree") {
            if (o.resource) {
              const extra =
                (this.knows("gentle-hands") ? 1 : 0) +
                (this.rng("forage") <
                this.skillLevel("foraging") *
                  PER_LEVEL.foragingExtra *
                  (this.knows("second-helping") ? 2 : 1)
                  ? 1
                  : 0);
              p.inventory[o.resource.item] =
                (p.inventory[o.resource.item] ?? 0) + extra;
            }
            this.grantXp("foraging", o.resource ? 12 : 6);
          } else this.grantXp("farming", 10);
          this.event(
            o.resource
              ? `You gather ${this.items[o.resource.item].name.toLowerCase()}. The resource is depleted until it replenishes in season.`
              : o.kind === "tree"
                ? "You gather fallen branches for firewood. The tree remains standing."
                : "You gather ripe grain. The harvested plot remains bare.",
          );
        }
        break;
      case "take":
        if (o) {
          const taken = copy(o.inventory);
          this.transfer(o.inventory, p.inventory);
          o.depleted = !o.prop;
          this.advance(6);
          this.event(`You take the contents of ${o.name.toLowerCase()}.`);
          if (o.owner && o.owner !== "player" && o.owner !== p.id) {
            p.memories.push(`theft:${o.id}:${JSON.stringify(taken)}`);
            this.offend({
              owner: o.owner,
              at: o.pos,
              lost: { what: `${o.name.toLowerCase()} emptied`, pos: o.pos },
              cost: (theirs) => (theirs ? 8 : 4),
              story: { act: "emptied", object: o.name.toLowerCase() },
              memory: () => `Saw player take ${o.id}`,
              text: (w) =>
                `${w.name} saw you take property belonging to the household.`,
            });
          }
        }
        break;
      case "return":
        if (o) {
          const key = p.memories.find((m) => m.startsWith(`theft:${o.id}:`));
          if (key) {
            const inv = JSON.parse(
              key.slice(`theft:${o.id}:`.length),
            ) as Inventory;
            for (const [k, v] of Object.entries(inv)) {
              const item = k as ItemId;
              const n = Math.min(v ?? 0, p.inventory[item] ?? 0);
              o.inventory[item] = (o.inventory[item] ?? 0) + n;
              p.inventory[item] = (p.inventory[item] ?? 0) - n;
            }
            o.depleted = !o.prop && Object.values(o.inventory).every((v) => !v);
            p.memories = p.memories.filter((m) => m !== key);
            this.advance(10);
            this.event("You return the goods you still carry.");
            for (const a of this.state.actors.filter((a) =>
              a.memories.some((m) => m.includes(o.id)),
            )) {
              this.regard(a, Math.max(0, a.trust + 2) - a.trust);
              a.memories.push(`Restitution for ${o.id}`);
            }
          }
        }
        break;
      case "capture":
        if (a) {
          const success = this.rng("capture") < 0.48;
          this.advance(12, a.id);
          if (success) {
            this.state.actors = this.state.actors.filter((e) => e.id !== a.id);
            p.inventory.lizard = (p.inventory.lizard ?? 0) + 1;
            this.event("You catch the lizard. It is now in your possession.");
          } else {
            this.stepAway(a, p.pos);
            this.stepAway(a, p.pos);
            a.activity = "Fleeing";
            this.event("The lizard slips away into cover.");
          }
        }
        break;
      case "herd":
        if (a) {
          a.goal = copy(a.home);
          a.activity = "Moving toward the enclosure";
          this.advance(12);
          this.event(
            `You guide the ${a.kind} toward its enclosure. Open the gate to let it through.`,
          );
        }
        break;
    }
  }
  private transfer(from: Inventory, to: Inventory) {
    for (const [k, n] of Object.entries(from)) {
      const id = k as ItemId;
      to[id] = (to[id] ?? 0) + (n ?? 0);
      from[id] = 0;
    }
  }
  /** How long each actor has had the player square in its way, in clock
   * seconds, and the one that has finally had enough of it. */
  private blockedSince = new Map<string, number>();
  blockComplaint?: { id: string; at: number; bumped?: boolean };
  /** Whoever the player is in conversation with stands still, facing them. */
  conversing?: string;
  /** The householder who has come to throw the player out; the UI opens the talk. */
  confronter?: string;
  /** Who is ordering the player out of their house right now; they shout. */
  confronting?: string;
  private intrusion?: { place: string; since: number; by?: string; done?: boolean; warnedAt?: number; escalated?: boolean };
  /** Clock second each actor last took offence at a collision or a swing,
   * so leaning on them or swinging again does not keep costing trust. */
  private affronts = new Map<string, number>();
  private bumpedAt = new Map<string, number>();
  /** The last small rudeness each person suffered from the player, for dialogue.
   * Not saved: it only matters for the next minute or two. */
  nuisance = new Map<string, { what: string; at: number }>();
  private collide(a: Actor, by: "player" | "actor", run = false) {
    const p = this.state.player;
    const now = this.state.clock;
    const last = this.bumpedAt.get(a.id) ?? -Infinity;
    if (now - last < BUMP_GAP) return;
    this.bumpedAt.set(a.id, now);
    this.signal({
      kind: "bump",
      who: a.id,
      dx: Math.sign(a.pos.x - p.pos.x),
      dy: Math.sign(a.pos.y - p.pos.y),
      by,
      run,
    });
    if (a.kind !== "human") return;
    if (by === "player") {
      this.nuisance.set(a.id, { what: run ? "ran full into you" : "bumped into you", at: now });
      // Bumped twice in a few game minutes, anyone turns and says something.
      if (now - last < 180 && !this.blockComplaint)
        this.blockComplaint = { id: a.id, at: now, bumped: true };
    }
    if (!run) {
      this.cue(a.id, "alarm", p.pos);
      this.event(`You collide with ${a.name}, who starts.`, "social");
      return;
    }
    this.affront(a);
    this.event(`You run full into ${a.name}, who rounds on you.`, "social");
  }
  private laid?: Map<string, string>;
  /** What keeps someone in bed today, if anything. */
  laidUp(id: string) {
    const clock = this.state.clock;
    this.laid ??= new Map((this.state.ailments ?? [])
      .filter((x) => severity(x, clock) >= 0.35)
      .map((x) => [x.who, x.infection ? `Resting with ${symptomsOf(x).join(", ")}` : ailmentDef(x.id).laid]));
    return this.laid.get(id);
  }
  /** Hourly symptoms, outcomes and new cases; travel settles courses alone. */
  healthStep(clock: number, newCases = true) {
    const s = this.state, setting = this.world.pack.setting;
    const spare = new Set(!s.manifest.disease && s.plot && !s.plot.ended ? Object.values(s.plot.cast) : []);
    const list = (s.ailments ??= []);
    for (const ail of [...list]) {
      updateCourse(ail, clock);
      if (ail.infection && !ail.infection.announced && clock >= ail.since) {
        ail.infection.announced = true;
        diseaseEvent(s, { clock, kind: "symptoms", who: ail.who, disease: ail.id });
        this.offerCare(ail);
      }
      if (!s.manifest.disease && ail.course === "die" && !ail.tended && severity(ail, clock) > 0.6 && (s.kin?.talked[ail.who] ?? -Infinity) >= ail.since) {
        ail.tended = true;
        if (random(s.manifest.seed, "tended", ail.who, ail.id) < 0.4) ail.course = "mend";
      }
      if (illnessProgress(ail, clock) < ail.days * 86400) continue;
      list.splice(list.indexOf(ail), 1);
      resolvedInfection(s, ail, ail.who === s.player.id ? s.player : s.actors.find((a) => a.id === ail.who), clock);
      if (s.care?.who === ail.who) delete s.care;
      if (ail.who === s.player.id) {
        if (ail.course === "die") this.die(this.diedOf(ail.id));
        continue;
      }
      const a = s.actors.find((x) => x.id === ail.who);
      if (a && ail.course === "die" && !spare.has(a.id)) this.dies(a, this.diedOf(ail.id));
    }
    // An illness wears the player down as it worsens.
    const p = s.player, sick = ailing(s, p.id, clock);
    if (sick) p.health = Math.min(p.health ?? 100, Math.round(100 - 70 * sick));
    if (s.manifest.survival) {
      this.injured();
      if ((p.hungerDebt ?? 0) >= 2 * 86400) {
        this.hurt(0.25, "prolonged hunger");
        if (p.hungerDebt! < 2 * 86400 + 3600) this.event("Days without enough food are damaging your health.");
      }
      if (p.dead) return;
    }
    const fresh = newCases ? onsets(s, setting, spare) : [];
    list.push(...fresh);
    for (const ail of fresh) if (ail.since <= clock) this.offerCare(ail);
    this.laid = undefined;
  }
  danger(pos: Position = this.state.player.pos) {
    const s = this.state;
    const actors = s.actors.filter((a) => a.kind === "human" && distance(a.pos, pos) <= 12 && this.visibleFrom(a.pos, s.player.pos));
    return dangerAt(this.world, { ...s, actors }, pos);
  }

  nearbyDanger() {
    const p = this.state.player.pos;
    return p.space !== "outside" ? [] : ([["north", 0, -16], ["east", 16, 0], ["south", 0, 16], ["west", -16, 0]] as const)
      .map(([bearing, dx, dy]) => ({ bearing, pos: { ...p, x: p.x + dx, y: p.y + dy }, ...this.danger({ ...p, x: p.x + dx, y: p.y + dy }) }));
  }

  private roadEncounter() {
    const s = this.state, p = s.player;
    if (!s.manifest.survival || p.dead || p.pos.space !== "outside" || p.activity === "Sleeping" || p.activity === "Resting" ||
      this.conversing || p.activity !== "Exploring" || s.encounter || s.care || this.waitingCard() || (p.encounterAfter ?? 0) > s.clock) return;
    const risk = this.danger();
    if (risk.threats.length || !risk.hourlyRisk || random(s.manifest.seed, "roadside", risk.area, Math.floor(s.clock / 300)) >= risk.hourlyRisk / 12) return;
    p.encounterAfter = s.clock + 86400;
    s.encounter = { card: "roadside-robbery", at: copy(p.pos), clock: s.clock };
    this.event("People step into your path and demand your valuables.", "world");
    this.offerCard(CARDS.find((c) => c.id === "roadside-robbery")!);
  }

  /** Those of the dead player's household who could go on as them: alive,
   * twelve or older, eldest first. */
  heirs() {
    const s = this.state, h = this.household(s.player.householdId);
    return s.actors.filter((a) => a.kind === "human" && !a.dead && (a.age ?? 0) >= 12 && !!h?.members.includes(a.id))
      .sort((a, b) => (b.age ?? 0) - (a.age ?? 0));
  }
  /** Goes on as one of the dead player's household: their name, body, place
   * and memories become the player's, and the household, plot, record and
   * year carry on. The id stays "player"; every tie to the heir is moved
   * onto it, and the dead go into the household's history. */
  becomeKin(id: string) {
    const s = this.state, dead = s.player, heir = this.heirs().find((a) => a.id === id);
    const h = this.household(dead.householdId);
    if (!dead.dead || !heir || !h) return false;
    const year = this.world.pack.setting?.year;
    if (year !== undefined) (h.history ??= []).push({ year, kind: "died", name: dead.name });
    h.members = h.members.filter((m) => m !== id);
    s.actors = s.actors.filter((a) => a.id !== id);
    for (const a of s.actors)
      a.relations = (a.relations ?? []).filter((r) => r.other !== "player").map((r) => (r.other === id ? { ...r, other: "player" } : r));
    const { dead: _d, errand: _e, ...body } = heir;
    s.player = {
      ...body,
      id: "player",
      householdId: h.id,
      relations: (heir.relations ?? []).filter((r) => r.other !== "player"),
      stats: rollStats(s.manifest.seed, heir),
      knownResources: dead.knownResources ?? [],
      health: 100,
      activity: "Exploring",
    };
    s.ailments = (s.ailments ?? []).filter((a) => a.who !== "player").map((a) => (a.who === id ? { ...a, who: "player" } : a));
    s.bonds = s.bonds?.filter((b) => b.with !== id);
    if (s.plot) for (const [role, who] of Object.entries(s.plot.cast)) if (who === id) delete s.plot.cast[role];
    s.relationships = undefined;
    s.kin = undefined;
    s.care = undefined;
    s.workday = undefined;
    if (s.economy) delete s.economy.work;
    s.goalDay = undefined;
    s.lifeAim = undefined;
    ensureLifeAim(s, this.world.pack.setting);
    this.routes.delete(id);
    this.laid = undefined;
    this.cards.length = 0;
    this.event(`You go on as ${s.player.name}.`, "system");
    return true;
  }
  /** "of the bloody flux": how an illness kills, in the place's words. */
  private diedOf(ailment: string) {
    const def = ailmentDef(ailment);
    return def.died.replace("{name}", nameFor(def, this.world.pack.setting));
  }
  /** The player dies, of an illness, a fall, the water. */
  private die(cause: string) {
    const p = this.state.player;
    if (p.dead) return;
    p.health = 0;
    p.dead = cause;
    p.activity = "Dead";
    this.pendingCollapse = undefined;
    this.event(`You die ${/^(of|from|in) /.test(cause) ? cause : `from ${cause}`}.`);
  }
  /** Someone dies of an illness: gone from the world, written into their
   * household's history, and a card if they were the player's own. */
  private dies(a: Actor, how: string) {
    const s = this.state, year = this.world.pack.setting?.year;
    const own = kinOf(s).find((k) => k.actor.id === a.id);
    const word = own && kinWord(own.kind, a);
    const h = this.household(a.householdId);
    const home = !!h?.members.includes(s.player.id);
    if (h) {
      h.members = h.members.filter((id) => id !== a.id);
      if (year !== undefined) (h.history ??= []).push({ year, kind: "died", name: a.name, ...(home && word ? { as: word } : {}) });
    }
    a.dead = how;
    s.actors = s.actors.filter((x) => x.id !== a.id);
    this.routes.delete(a.id);
    if (own || home) this.cards.push({ kind: "turn", title: "A Death", text: `${a.name}${word ? `, your ${word},` : ""} has died ${how}.` });
    else this.event(`Word goes round that ${a.name} has died ${how}.`, "social");
  }
  /** The opening card, once a life: who and where you are, and the plot. */
  private introduce() {
    const s = this.state, setting = this.world.pack.setting;
    const place = settlementName(this.world.pack.name);
    s.introduced = true;
    const intro = composeIntro(s, setting, place);
    this.cards.unshift({
      kind: "title",
      title: s.plot?.title ?? place,
      text: introText(intro),
      intro,
      aim: s.plot && !s.plot.ended ? s.plot.aim?.text ?? s.lifeAim?.text : s.lifeAim?.text,
    });
  }
  private runPlot() {
    const s = this.state, plot = s.plot!;
    for (const e of stepPlot(s)) {
      const who = "role" in e ? s.actors.find((a) => a.id === plot.cast[e.role]) : undefined;
      if (e.type === "card")
        this.cards.push({ kind: "turn", title: plot.title, text: plotLine(plot, e.line), focus: e.focus && plot.cast[e.focus] });
      else if (e.type === "approach" && who) {
        // A seizure that cleared the debt is told by the ending, not by "the rest is still owed".
        if (e.line === "seize" && (plot.owed ?? 0) <= 0) continue;
        this.approaching = { id: who.id, line: plotLine(plot, e.line), until: s.clock + 7200 };
        if (s.kin) s.kin.last = s.clock;
      }
      else if (e.type === "regard" && who) this.regard(who, e.delta);
      else if (e.type === "seize" && who) {
        const h = this.household(s.player.householdId);
        const store = h && s.objects.find((o) => o.id === h.storeId);
        if (store) {
          const before = plot.owed ?? 0;
          this.settle((store.inventory ??= {}), who, Object.keys(store.inventory));
          plot.seized = (plot.seized ?? 0) + before - (plot.owed ?? 0);
        }
      } else if (e.type === "walk-off" && who) this.walkOff(who, e.to);
      else if (e.type === "extend") plot.deadline += e.hours * 3600;
    }
    const ending = endPlot(s);
    if (ending) {
      const line = plotLine(plot, ending.id);
      this.cards.push({ kind: "ending", title: plot.title, text: line, ending: ending.id });
      (s.record ??= []).push({ day: Math.floor(s.clock / 86400), clock: s.clock, card: `plot:${ending.id}`, choice: -1, line });
    }
  }
  /** The player's own people: whether one of them has reason to come over,
   * and what it costs to leave them unanswered. */
  private kinStep(clock: number) {
    const s = this.state, p = s.player;
    const k = (s.kin ??= { since: clock, said: {}, talked: {} });
    const h = this.household(p.householdId);
    if (h && (p.pos.space === h.residence || (p.pos.space === "outside" && distance(p.pos, h.home) < 8))) k.home = clock;
    const wait = k.waiting;
    if (wait && clock - wait.at >= 3600) {
      const a = s.actors.find((x) => x.id === wait.id);
      if (a && (k.talked[wait.id] ?? -1) < wait.at) {
        this.regard(a, -1, "refuse");
        a.memories.push("Went to the player and was not answered");
      }
      k.waiting = undefined;
    }
    const hour = Math.floor(clock / 3600) % 24;
    const since = clock - (k.last ?? -Infinity);
    if (this.approaching || p.dead || hour < 6 || hour >= 21 || since < 5400) return;
    const morning = Math.floor((clock - 6 * 3600) / 86400) * 86400 + 6 * 3600;
    const today = Object.entries(k.said).filter(([key, at]) => at >= morning && !key.endsWith(":plot")).length;
    // Past three calls a day, three hours apart, or with work in hand, only
    // hunger and the plot bring anyone over.
    const urgent = today >= 3 || since < 3 * 3600 || this.working || !!this.waitingCard();
    const store = h && s.objects.find((o) => o.id === h.storeId);
    const food = Object.entries(store?.inventory ?? {}).reduce((n, [id, c]) => n + (this.item(id)?.edible ? c ?? 0 : 0), 0);
    const call = kinCall(s, k, clock, food, (id) => !!this.laidUp(id), urgent);
    if (!call) return;
    k.said[`${call.id}:${call.need}`] = clock;
    k.last = clock;
    k.waiting = { id: call.id, need: call.need, at: clock };
    this.approaching = { id: call.id, line: call.line, until: clock + 3600 };
  }
  /** What the player can hand over toward a debt: money where there is
   * coinage, food where there is not. */
  /** Someone's goods for sale today: a shopkeeper's, a craftsperson's at
   * their work, a merchant's on the road, or, with `anyone`, whatever a
   * person agreed in conversation to sell. */
  shopOf(id: string, anyone = false) {
    const a = this.state.actors.find((a) => a.id === id && a.kind === "human" && !a.dead);
    if (!a || (!anyone && !keepsShop(this.world.pack, a))) return undefined;
    const day = Math.floor(this.state.clock / (DAY_MINUTES * 60));
    const coined = this.coined();
    const shop = a.shop?.day === day ? a.shop
      : stockFor(this.world.pack, this.state.manifest.seed, a, day, coined, (i) => this.item(i));
    return { actor: a, coined, ...shop };
  }
  private terms() {
    return 1 + this.skillLevel("trade") * PER_LEVEL.tradeTerms + (this.knows("haggler") ? 0.15 : 0);
  }
  /** What one costs from a seller, in coin or, where nobody uses coin, in worth. */
  buyPrice(id: ItemId) {
    const v = this.item(id)?.value ?? 0;
    return id === "coin" ? 1 : v <= 0 ? 0 : Math.max(1, Math.ceil(v / this.terms()));
  }
  /** What a seller pays for one. A shop pays half; bartered goods go at their worth. */
  sellPrice(id: ItemId) {
    const v = this.item(id)?.value ?? 0;
    if (id === "coin") return 1;
    if (v <= 0) return 0;
    return this.coined() ? Math.max(1, Math.min(this.buyPrice(id), Math.floor((v * this.terms()) / 2))) : v;
  }
  worth(inv: Inventory, side: "buy" | "sell") {
    return Object.entries(inv).reduce((sum, [id, n]) => sum + (n ?? 0) * (side === "buy" ? this.buyPrice(id) : this.sellPrice(id)), 0);
  }
  private coined() {
    const setting = this.world.pack.setting;
    const credit = this.state.households?.find((h) => h.members.includes(this.state.player.id))?.credit;
    return credit ? credit.repayment === "money" : !!setting && capabilitiesFor(setting).has("coinage");
  }
  private payable() {
    const coined = this.coined();
    return Object.keys(this.state.player.inventory).filter((id) =>
      (this.state.player.inventory[id] ?? 0) > 0 && (this.item(id)?.value ?? 0) > 0 &&
      (coined ? id === "coin" : !!this.item(id)?.edible));
  }
  /** Moves goods from `from` to `to` until the plot's debt is met, money first
   * and then the dearest. Returns what changed hands, for the line. */
  private settle(from: Inventory, to: Actor, ids: ItemId[]) {
    const plot = this.state.plot!;
    const handed: string[] = [];
    const order = [...ids].sort((a, b) =>
      Number(b === "coin") - Number(a === "coin") || (this.item(b)?.value ?? 0) - (this.item(a)?.value ?? 0));
    for (const id of order) {
      const value = this.item(id)?.value ?? 0;
      let n = 0;
      while ((plot.owed ?? 0) > 0 && (from[id] ?? 0) > 0 && value > 0) {
        from[id]!--;
        to.inventory[id] = (to.inventory[id] ?? 0) + 1;
        plot.owed = (plot.owed ?? 0) - value;
        n++;
      }
      if (n) handed.push(`${n} ${this.item(id)!.name.toLowerCase()}`);
    }
    const credit = this.state.households?.find((h) => h.members.includes(this.state.player.id))?.credit;
    if (credit?.seller === to.id) credit.amount = Math.max(0, plot.owed ?? 0);
    return handed.join(", ") || "nothing";
  }
  /** The plot's messenger walks over and says their piece. */
  private approach(clock: number) {
    const ap = this.approaching!, p = this.state.player;
    const a = this.actorsById?.get(ap.id);
    if (!a || a.dead || clock > ap.until) {
      this.approaching = undefined;
      return;
    }
    if (p.dead || this.conversing) return;
    if (a.pos.space === p.pos.space && distance(a.pos, p.pos) <= 1.6) {
      this.approaching = undefined;
      a.errand = { to: copy(a.pos), label: "Waiting for an answer", until: clock + 120 };
      a.direction = this.directionTo(a.pos, p.pos);
      delete a.facing;
      this.cue(a.id, "beckon", p.pos);
      this.cards.push({ kind: "speech", title: ap.title ?? this.state.plot?.title ?? "", text: ap.line, speaker: a.id });
      this.approacher = {
        id: a.id,
        situation: ap.situation ?? `You have just walked up to the player and said: “${ap.line}” You want an answer.`,
        until: clock + 300,
      };
      ap.onArrive?.();
      return;
    }
    const inside = p.pos.space !== "outside" ? this.world.place(p.pos.space) : undefined;
    const to: Position = inside ? { ...doorApproach(inside), space: "outside" } : p.pos;
    const from = a.pos.space !== to.space && this.world.place(a.pos.space);
    if (from) this.moveActor(a, { ...doorApproach(from), space: "outside" });
    // Beyond the simulated ring nobody walks; they have come most of the way unseen.
    const d = distance(a.pos, to);
    if (a.pos.space === to.space && d > 60)
      for (const r of [30, 34, 38, 42]) {
        const q = {
          x: Math.round(to.x + ((a.pos.x - to.x) / d) * r),
          y: Math.round(to.y + ((a.pos.y - to.y) / d) * r),
          space: to.space,
        };
        if (this.blocked(q.x, q.y, q.space) || this.visible(q)) continue;
        this.moveActor(a, q);
        break;
      }
    a.errand = { to: copy(to), label: "Coming to find you", until: clock + 60 };
  }
  /** Stories move about an hour per hop of company, and a household pools
   * what it heard each evening. Each retelling is half as strong; one about
   * the player shifts the listener's opinion by half that again. */
  private spreadWord(clock: number) {
    const s = this.state, seed = s.manifest.seed;
    if (clock % 86400 === 7 * 3600) this.seedTidings(clock);
    for (const a of s.actors) {
      if (a.kind !== "human" || a.dead || !a.word?.length || (a.age ?? 30) < 8 || this.world.dormant?.(a.id)) continue;
      const chance = (0.5 + statsOf(seed, a).extraversion / 100) / 6;
      for (const b of s.actors)
        if (b !== a && b.kind === "human" && !b.dead && b.pos.space === a.pos.space && distance(a.pos, b.pos) <= 3 && random(seed, "word", a.id, b.id, clock) < chance)
          this.pass(a, b, clock);
    }
    if (clock % 86400 !== 20 * 3600) return;
    for (const h of s.households ?? []) {
      const home = h.members.map((id) => this.actorsById?.get(id)).filter((a): a is Actor => !!a && !a.dead);
      for (const a of home) for (const b of home) if (a !== b) this.pass(a, b, clock, true);
    }
  }
  /** Each morning, a neighbour of every household with news from the last
   * year or so has heard it, and so has someone near a household in debt. */
  private seedTidings(clock: number) {
    const s = this.state, seed = s.manifest.seed, year = this.world.pack.setting?.year;
    if (year === undefined) return;
    for (const h of s.households ?? []) {
      const head = h.members.map((id) => s.actors.find((a) => a.id === id)).find((a) => a && !a.dead && a.kind === "human");
      if (!head || h.members.includes(s.player.id)) continue;
      const near = s.actors.filter((o) => o.kind === "human" && !o.dead && (o.age ?? 30) >= 13 && o.householdId && o.householdId !== h.id && distance(o.home, h.home) < 25);
      const tell = (what: string, tone: number, key: string) => {
        const o = near[Math.floor(random(seed, "tiding", h.id, key) * near.length)];
        if (o) hear(o, { act: what, tone, at: clock, hops: 1, about: head.id });
      };
      for (const e of (h.history ?? []).filter((e) => year - e.year <= 1).slice(-2)) {
        const t = tidings[e.kind];
        if (t) tell(t[0](head.name, e), t[1], `${e.kind}${e.year}`);
      }
      const lender = h.credit && s.households?.find((x) => x.id === h.credit!.from);
      const creditor = lender && s.actors.find((a) => a.id === lender.members[0]);
      if (creditor) tell(`${head.name}'s household owes ${creditor.name} and cannot pay`, -3, "debt");
    }
  }
  private pass(a: Actor, b: Actor, clock: number, all = false) {
    const told = all ? a.word ?? [] : [a.word![Math.floor(random(this.state.manifest.seed, "tell", a.id, clock) * a.word!.length)]];
    for (const w of [...told]) {
      const tone = w.tone / 2;
      if (Math.abs(tone) < 0.5 || w.from === b.id) continue;
      // Nobody tells a family its own scandal.
      if (w.about && (w.about === b.id || this.state.actors.find((x) => x.id === w.about)?.householdId === b.householdId)) continue;
      if (hear(b, { ...w, tone, at: clock, hops: w.hops + 1, from: a.id }) && !w.about) {
        updateRelationships(this.state, b);
        b.trust += tone / 2;
        updateRelationships(this.state, b);
      }
    }
  }
  /** A favour this person could fairly ask of the player when the model does
   * not offer one of its own. */
  askFor(a: Actor): Omit<Ask, "id" | "at" | "until"> | undefined {
    const s = this.state;
    if (a.kind !== "human" || a.dead || (a.age ?? 30) < 12 || a.householdId === s.player.householdId) return;
    if (a.hunger > 60) return { by: a.id, kind: "food", what: "bring something to eat" };
    const good = s.economy?.short[a.householdId ?? ""]?.find((g) => this.item(g));
    if (good) return { by: a.id, kind: "bring", item: good, what: `bring some ${this.item(good)!.name.toLowerCase()}` };
    const kin = (a.relations ?? [])
      .map((r) => this.actorsById?.get(r.other))
      .find((o) => o && !o.dead && o.kind === "human" && o.householdId !== a.householdId);
    if (kin && random(s.manifest.seed, "message", a.id, Math.floor(s.clock / 86400)) < 0.4)
      return { by: a.id, kind: "talk-to", to: kin.id, what: `carry word to ${kin.name}` };
  }
  /** Who and what a favour could name, for the model to choose among. */
  favourTargets(a: Actor) {
    const s = this.state;
    const people = [
      ...(a.relations ?? []).map((r) => this.actorsById?.get(r.other)),
      ...s.actors.filter((o) => o.kind === "human" && o.householdId !== a.householdId && distance(o.home, a.home) < 30),
    ].filter((o): o is Actor => !!o && !o.dead && o.kind === "human" && o.id !== a.id && o.householdId !== s.player.householdId);
    const goods = new Set<string>();
    for (const g of s.economy?.short[a.householdId ?? ""] ?? []) if (this.item(g)) goods.add(this.item(g)!.name.toLowerCase());
    for (const o of s.objects) for (const id of Object.keys(o.inventory ?? {})) if (goods.size < 12 && this.item(id)) goods.add(this.item(id)!.name.toLowerCase());
    return {
      people: [...new Map(people.map((o) => [o.id, `${o.name} (${o.role.toLowerCase()})`])).values()].slice(0, 8),
      // "Household" and "Household stores" name nowhere in particular.
      places: [...new Set(this.world.places.filter((p) => p.owner !== s.player.id && !/^(household|remains)\b/i.test(p.name)).map((p) => p.name))].slice(0, 10),
      goods: [...goods],
    };
  }
  /** The model's favour, if it names someone, somewhere or something real. */
  private resolveFavour(a: Actor, f: Favour): Omit<Ask, "id" | "at" | "until"> | undefined {
    const name = f.target.trim().toLowerCase().replace(/\s*\(.*\)$/, "").replace(/^the /, "");
    const what = f.what.trim().replace(/^(to|please|could you|would you)\s+/i, "").replace(/[.?!]+$/, "");
    if (!name || !what) return;
    if (f.kind === "talk-to") {
      const people = this.state.actors.filter((o) => o.kind === "human" && !o.dead && o.id !== a.id);
      const to = people.find((o) => o.name.toLowerCase() === name) ??
        people.find((o) => o.name.toLowerCase().split(" ")[0] === name.split(" ")[0] && (a.relations?.some((r) => r.other === o.id) || distance(o.home, a.home) < 30));
      return to && { by: a.id, kind: "talk-to", to: to.id, what };
    }
    if (f.kind === "help") return this.helpWith(a, what);
    if (f.kind === "go-to") {
      const place = this.world.places.find((p) => p.name.toLowerCase().replace(/^the /, "") === name) ??
        this.world.places.find((p) => p.name.toLowerCase().includes(name));
      return place && { by: a.id, kind: "go-to", place: place.id, what };
    }
    const defs = [...Object.values(this.items), ...Object.values(this.state.catalog ?? {})];
    const item = defs.find((d) => d.name.toLowerCase() === name) ??
      defs.filter((d) => name.includes(d.name.toLowerCase())).sort((x, y) => y.name.length - x.name.length)[0];
    return item && { by: a.id, kind: "bring", item: item.id, what };
  }
  /** Help with this person's own day's work: the step of it the model named,
   * or its main step, done where they work. Nothing if they have no trade. */
  private helpWith(a: Actor, what: string): Omit<Ask, "id" | "at" | "until"> | undefined {
    const setting = this.world.pack.setting, kit = livelihoodOf(this.world.pack, a);
    const season = (setting ? seasonAt(setting.season, this.state.clock) : "spring") as SeasonId;
    const process = kit && processFor(kit, setting?.economyRevision, season);
    const steps = process?.steps.filter((st) => !st.client);
    if (!steps?.length) return;
    const words = what.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const step = steps.find((st) => words.some((w) => st.task.toLowerCase().includes(w))) ?? steps[Math.min(1, steps.length - 1)];
    const household = this.household(a.householdId);
    return { by: a.id, kind: "help", what, meet: { ...a.work }, task: cardText(step.task, { ...this.fishingWordsFor(household, steps),
      ...(steps.some((st) => st.scene === "hunt") ? this.huntingWords(household, a) : {}) }) };
  }
  /** Someone the player has promised to help sets off for their work, and
   * waits there. */
  private leadTo(a: Actor, ask: Ask) {
    if (!ask.meet || distance(a.pos, ask.meet) < 2 || a.errand) return;
    a.errand = { to: { ...ask.meet }, label: `Going to ${ask.task?.toLowerCase() ?? "work"}`, until: this.state.clock + 7200 };
  }
  /** Once the player has followed them there, the work itself, in their words. */
  private offerHelp(ask: Ask, a: Actor) {
    ask.offered = true;
    const first = this.state.player.name.split(" ")[0], skill = this.helpSkill(a);
    const stats = this.stats(), level = this.skillLevel(skill);
    this.cards.unshift({
      kind: "speech",
      title: a.role.toLowerCase(),
      text: `Here we are. ${ask.task}: watch how I do it, ${first}, then take the other end.`,
      speaker: a.id,
      choose: {
        card: `help:${ask.id}`,
        choices: HELP.map((c, index) => ({
          index,
          label: c.label.replace("{name}", a.name.split(" ")[0]),
          odds: c.odds ? oddsOf({ stat: c.stat, skill, odds: c.odds }, stats, level) : undefined,
          minutes: c.minutes,
        })),
      },
    });
    this.event(`You reach ${a.name}'s work.`, "social");
  }
  private helpSkill(a: Actor): SkillId {
    const kit = livelihoodOf(this.world.pack, a), process = kit && processFor(kit, this.world.pack.setting?.economyRevision);
    return process?.skill ?? (process ? workSkill[process.family] : "farming");
  }
  private helpChoose(id: string, n: number) {
    const s = this.state, p = s.player, ask = s.asks?.find((x) => `help:${x.id}` === id);
    const a = ask && s.actors.find((x) => x.id === ask.by);
    const c = HELP[n];
    if (!ask || !a || !c) return;
    const skill = this.helpSkill(a), first = a.name.split(" ")[0];
    const won = !c.odds || this.rng(id) < oddsOf({ stat: c.stat, skill, odds: c.odds }, this.stats(), this.skillLevel(skill));
    this.advance(c.minutes * 60);
    p.fatigue = Math.min(100, p.fatigue + c.fatigue);
    this.grantXp(skill, c.xp);
    this.grant(ask, a);
    a.owes = true;
    const helped = (p.helped ??= {});
    helped[skill] = (helped[skill] ?? 0) + 1;
    let taught = helped[skill] === 3 && !p.taught?.includes(skill);
    if (taught) {
      const before = this.pendingPicks().some((x) => x.skill === skill);
      (p.taught ??= []).push(skill);
      taught = !before && this.pendingPicks().some((x) => x.skill === skill);
    }
    if (won && c.bonus) this.regard(a, c.bonus, "warm");
    // A share of what the work makes, where it makes something you can carry.
    const kit = livelihoodOf(this.world.pack, a);
    const share = kit && processFor(kit, this.world.pack.setting?.economyRevision)?.makes.find((m) => this.item(m));
    if (share) p.inventory[share] = (p.inventory[share] ?? 0) + 1;
    const line = (won ? c.line : c.lost!).replaceAll("{name}", first) +
      (share ? ` ${first} sends you off with some ${this.item(share)!.name.toLowerCase()}.` : "");
    this.event(line);
    if (taught) this.event(`You have worked beside people at this enough to choose a ${skill} technique of your own.`);
    this.lastChoice = {
      card: id, line, won: c.odds ? won : undefined,
      changes: [
        { kind: "time", delta: c.minutes },
        { kind: "regard", delta: 3 + (won ? c.bonus ?? 0 : 0), who: first },
      ],
    };
  }
  /** What the player said to a favour, as the conversation settled it. */
  answerAsk(a: Actor, how: "made" | "accepted" | "declined", favour?: Favour) {
    const asks = (this.state.asks ??= []), clock = this.state.clock;
    let ask = asks.find((x) => x.by === a.id);
    if (!ask && how !== "declined") {
      // A favour the engine could not see done is only talk.
      const want = favour ? this.resolveFavour(a, favour) : this.askFor(a);
      if (!want || asks.length >= 3) return;
      ask = { ...want, id: `ask-${a.id}-${clock}`, at: clock, until: clock + 86400 };
      asks.push(ask);
    }
    if (!ask) return;
    if (how === "accepted") {
      ask.accepted = true;
      if (ask.kind === "help") {
        this.leadTo(a, ask);
        this.event(`${a.name} sets off. Follow them to help.`, "social");
      }
    }
    if (how === "declined") {
      asks.splice(asks.indexOf(ask), 1);
      this.regard(a, -1, "refuse");
    }
  }
  private grant(ask: Ask, a: Actor) {
    this.state.asks!.splice(this.state.asks!.indexOf(ask), 1);
    this.regard(a, 3, "warm");
    a.memories.push(`The player did what I asked: ${ask.what}`);
    hear(a, { act: "did a favour for", victim: a.id, tone: 4, at: this.state.clock, hops: 0 });
    this.event(`${a.name} is grateful.`, "social");
  }
  /** What a person who owes the player could do for them now, and why not where they can't. */
  callInProblem(a: Actor, kind: CallIn) {
    if (!a.owes) return `${a.name} owes you nothing.`;
    if (kind === "work") {
      const t = this.trade();
      return !t || t.stage >= t.process.stages.length ? "You have no work today for anyone to help with." : undefined;
    }
    if (kind === "lend") return this.lendable(a) ? undefined : `${a.name}'s household has nothing to spare.`;
    return this.state.complaints?.some((c) => c.by !== a.id && !c.spokenFor) ? undefined : "Nobody has complained about you.";
  }
  private lendable(a: Actor) {
    const h = this.state.households?.find((x) => x.id === a.householdId);
    const store = h && this.state.objects.find((o) => o.id === h.storeId);
    const id = store && Object.entries(store.inventory ?? {}).find(([id, n]) => (n ?? 0) > 0 && id !== "coin" && this.item(id))?.[0];
    return id && store ? { store, id } : undefined;
  }
  /** The player calls in the day's help they gave. */
  callIn(a: Actor, kind: CallIn) {
    const problem = this.callInProblem(a, kind);
    if (problem) return problem;
    const s = this.state, first = a.name.split(" ")[0];
    if (a.trust < 0) {
      delete a.owes;
      this.regard(a, -1, "refuse");
      const near = s.actors.filter((o) => o.kind === "human" && !o.dead && o.householdId !== a.householdId && o.pos.space === a.pos.space && distance(o.pos, a.pos) < 12);
      for (const o of near.slice(0, 3)) hear(o, { act: `${a.name} would not pay back help they were given`, tone: -3, at: s.clock, hops: 1, about: a.id });
      const line = `${first} won't hear of it. Whatever they owed you, they mean to forget it.`;
      this.event(line, "social");
      return line;
    }
    let line: string;
    if (kind === "work") {
      const w = s.economy!.work!;
      w.quality = Math.min(2, (w.quality ?? 0) + 1);
      a.errand = { to: { ...s.player.pos }, label: "Helping with your work", until: s.clock + 3600 };
      line = `${first} comes to work beside you. Today's work will go better for it.`;
    } else if (kind === "lend") {
      const { store, id } = this.lendable(a)!;
      const n = Math.min(2, store.inventory![id] ?? 0);
      store.inventory![id]! -= n;
      s.player.inventory[id] = (s.player.inventory[id] ?? 0) + n;
      line = `${first} gives you ${n === 1 ? "some" : n} ${this.item(id)!.name.toLowerCase()} from their stores.`;
    } else {
      const c = s.complaints!.find((x) => x.by !== a.id && !x.spokenFor)!;
      c.spokenFor = a.id;
      line = `${first} will speak for you when the complaint is heard.`;
    }
    delete a.owes;
    this.regard(a, 1);
    a.memories.push("I paid back the help the player gave me");
    hear(a, { act: "was owed help and asked for it fairly", tone: 1, at: s.clock, hops: 0 });
    this.event(line, "social");
    return line;
  }
  /** Someone the player promised to help waits at their work until the player turns up. */
  private helpStep() {
    const s = this.state, p = s.player;
    for (const ask of s.asks ?? []) {
      const a = ask.kind === "help" && ask.accepted && !ask.offered ? s.actors.find((x) => x.id === ask.by) : undefined;
      if (!a || !ask.meet) continue;
      this.leadTo(a, ask);
      if (!this.conversing && a.pos.space === p.pos.space && distance(a.pos, ask.meet) < 3 && distance(a.pos, p.pos) < 4) this.offerHelp(ask, a);
    }
  }
  /** Promises run out, and now and then someone nearby who likes the player
   * comes over to ask a favour. */
  private askStep(clock: number) {
    const s = this.state, p = s.player;
    for (const ask of [...(s.asks ?? [])]) {
      if (clock <= ask.until) continue;
      s.asks!.splice(s.asks!.indexOf(ask), 1);
      const a = this.actorsById?.get(ask.by);
      if (!ask.accepted || !a) continue;
      this.regard(a, -2, "anger");
      a.memories.push(`The player promised to ${ask.what} and never did`);
      hear(a, { act: "broke a promise to", victim: a.id, tone: -3, at: clock, hops: 0 });
    }
    const hour = Math.floor(clock / 3600) % 24;
    const morning = Math.floor(clock / 86400) * 86400;
    const today = (s.asks ?? []).filter((x) => x.at >= morning).length;
    if (this.approaching || this.conversing || p.dead || hour < 8 || hour >= 19 || today >= 2 || (s.asks?.length ?? 0) >= 3) return;
    if (clock - (this.lastAsk ?? -Infinity) < 3 * 3600 || random(s.manifest.seed, "ask", clock) > 0.25) return;
    const a = s.actors.find((x) => x.trust >= 1 && x.pos.space === p.pos.space && distance(x.pos, p.pos) < 30 && !this.world.dormant?.(x.id) && !x.terror && !s.asks?.some((k) => k.by === x.id) && this.askFor(x));
    if (!a) return;
    this.answerAsk(a, "made");
    const ask = s.asks?.find((x) => x.by === a.id);
    if (!ask) return;
    this.lastAsk = clock;
    this.approaching = { id: a.id, line: askLines[ask.kind](ask.what), until: clock + 1800, title: a.name };
  }
  private lastAsk?: number;
  /** Whoever keeps order here: someone whose role says so, or else the
   * eldest head of a household in their prime. */
  keeper(): Actor | undefined {
    const s = this.state;
    if (this.keeperId) {
      const known = s.actors.find((a) => a.id === this.keeperId);
      if (known && !known.dead) return known;
    }
    const able = s.actors.filter((a) => a.kind === "human" && !a.dead && (a.age ?? 30) >= 25 && (a.age ?? 30) < 72 && a.householdId !== s.player.householdId);
    const heads = new Set((s.households ?? []).map((h) => h.members[0]));
    const k = able.find((a) => /headman|chief|elder|sheriff|constable|reeve|magistrat|official|alcalde|curaca|steward|bailiff|watchman|police|judge|qadi|kadi|podest|archon|headwoman/i.test(a.role)) ??
      able.filter((a) => heads.has(a.id)).sort((x, y) => (y.age ?? 30) - (x.age ?? 30) || x.id.localeCompare(y.id))[0];
    this.keeperId = k?.id;
    return k;
  }
  private keeperId?: string;
  /** Someone takes a grievance against the player to whoever keeps order. */
  complain(a: Actor, story: Word) {
    const list = (this.state.complaints ??= []);
    if (list.some((c) => c.by === a.id) || list.length >= 4) return;
    list.push({ by: a.id, story: { ...story, hops: 0 }, at: this.state.clock });
  }
  /** An hour or so after a complaint, the keeper of order finds the player
   * and gives judgement: a warning, a fine paid to whoever was wronged, or
   * the rest of the day in the stocks. */
  private keeperStep(clock: number) {
    const s = this.state, p = s.player, c = s.complaints?.[0];
    if (!c || clock - c.at < 3600 || this.approaching || this.conversing || p.dead || (p.stocked ?? 0) > clock) return;
    const hour = Math.floor(clock / 3600) % 24;
    if (hour < 7 || hour >= 20) return;
    s.complaints!.shift();
    const keeper = this.keeper(), by = s.actors.find((a) => a.id === c.by);
    if (!keeper || !by || by.dead || keeper.id === by.id) return;
    const law = orderKeeper(this.world.pack.setting), office = law.who;
    const charge = telling({ ...c.story, hops: 1 }, (id) => s.actors.find((a) => a.id === id)?.name);
    const voucher = c.spokenFor ? s.actors.find((a) => a.id === c.spokenFor && !a.dead) : undefined;
    const severity = Math.abs(c.story.tone) - Math.max(0, keeper.trust) - (voucher ? 4 : 0);
    const amount = Math.max(1, Math.round(severity / 2));
    const worth = Object.entries(p.inventory).reduce((n, [id, k]) => n + (this.item(id)?.value ?? 0) * (k ?? 0), 0);
    const pays = (k: Penalty) => k === "compensation" || k === "fine";
    // Light wrongs get the lightest penalty, heavy ones the heaviest; what
    // the player cannot pay becomes the next thing they can be made to suffer.
    let penalty: Penalty | undefined = severity < 4 ? undefined : severity < 8 ? law.penalties[0] : law.penalties.at(-1);
    if (penalty && pays(penalty) && worth < amount) penalty = law.penalties.find((k) => !pays(k)) ?? "exile";
    const days = severity >= 10 ? 3 : 1;
    const money = this.item("coin")?.name.toLowerCase() ?? "coin";
    const shame = law.shaming ?? "the stocks", blows = law.beating ?? "a beating";
    const sentence = !penalty ? "I'll not hear of it again." : {
      compensation: `You'll make it good to ${by.name}, ${amount} ${money}'s worth, here and now.`,
      fine: `You'll pay a fine of ${amount} ${money}'s worth.`,
      shaming: `You'll be put in ${shame} till evening, where everyone can see you.`,
      beating: `You'll take ${blows}, here and now.`,
      labour: "You'll work off the wrong for a day, at whatever you're set to.",
      confinement: "You'll be locked up until tomorrow.",
      exile: `You're not wanted here. Nobody will speak to you or deal with you for ${days === 1 ? "a day" : `${days} days`}.`,
    }[penalty];
    const line = `${by.name} came to me. They say you ${charge}.${voucher ? ` ${voucher.name} spoke for you, and I've weighed that.` : ""} ${sentence}`;
    const told = (act: string) => { for (const w of this.witnesses(12)) hear(w, { act, tone: -4, at: clock, hops: 0 }); };
    const hold = (until: number, activity: string) => {
      p.stocked = until;
      p.activity = activity;
    };
    this.approaching = {
      id: keeper.id,
      line,
      title: `${keeper.name}, ${office}`,
      until: clock + 3600,
      situation: `You keep order here, as ${office}. ${by.name} complained to you that the player ${charge}. You have found the player and given your judgement: “${line}” Hold to it; you may hear them out, but you do not take it back.`,
      onArrive: () => {
        by.memories.push(`Took my complaint to ${keeper.name}, who dealt with the player`);
        this.regard(by, penalty ? 2 : 1);
        if (penalty === "compensation" || penalty === "fine") {
          const handed = this.handOver(penalty === "fine" ? keeper : by, amount);
          this.event(`You hand over ${handed}.`);
        } else if (penalty === "shaming") {
          hold(Math.max(clock + 3 * 3600, Math.floor(clock / 86400) * 86400 + 19 * 3600), `In ${shame}`);
          told(`was put in ${shame}`);
          this.event(`You are put in ${shame}. People stop to look.`);
        } else if (penalty === "beating") {
          this.hurt(Math.min(30, (p.health ?? 100) - 10), "beating", "welts from a beating");
          told(`was given ${blows}`);
          this.event(`You are given ${blows}.`);
        } else if (penalty === "labour") {
          hold(clock + 10 * 3600, "Working off a sentence");
          p.fatigue = Math.min(100, p.fatigue + 40);
          told("was put to forced labour");
          this.event("You are set to work under watch until evening.");
        } else if (penalty === "confinement") {
          hold(clock + 20 * 3600, "Locked up");
          told("was locked up");
          this.event("You are locked up.");
        } else if (penalty === "exile") {
          for (const a of s.actors) if (a.kind === "human" && a.householdId !== p.householdId) a.shuns = clock + days * 86400;
          told("was cast out");
          this.event("People turn their backs on you. You are cast out.");
        }
      },
    };
  }
  /** Goods worth `amount` from the player to `to`, money first. */
  private handOver(to: Actor, amount: number) {
    const p = this.state.player, given: string[] = [];
    const order = Object.keys(p.inventory)
      .filter((id) => (this.item(id)?.value ?? 0) > 0)
      .sort((a, b) => Number(b === "coin") - Number(a === "coin") || (this.item(b)?.value ?? 0) - (this.item(a)?.value ?? 0));
    for (const id of order) {
      let n = 0;
      while (amount > 0 && (p.inventory[id] ?? 0) > 0) {
        p.inventory[id]!--;
        to.inventory[id] = (to.inventory[id] ?? 0) + 1;
        amount -= this.item(id)!.value;
        n++;
      }
      if (n) given.push(`${n} ${this.item(id)!.name.toLowerCase()}`);
    }
    return given.join(", ") || "nothing";
  }
  /** Someone who has had enough of the player goes elsewhere for an hour. */
  walkOff(a: Actor, where: WalkOff) {
    if (a.terror?.cause) { delete a.terror; a.offRoutine = false; }
    const clock = this.state.clock;
    if (a.trust < -10) a.shuns = clock + 3600;
    const inside = a.pos.space !== "outside" ? this.world.place(a.pos.space) : undefined;
    if (inside) this.moveActor(a, { ...doorApproach(inside), space: "outside" });
    let to: Position | undefined;
    let label = "";
    if (where === "friend") {
      const kin = (a.relations ?? [])
        .map((r) => this.state.actors.find((o) => o.id === r.other))
        .find((o) => o?.pos.space === "outside" && o.householdId !== a.householdId);
      const friend =
        kin ??
        this.state.actors
          .filter((o) => o.kind === "human" && o.id !== a.id && o.pos.space === "outside" && o.householdId !== a.householdId && (o.age ?? 30) >= 13)
          .sort((x, y) => distance(x.pos, a.pos) - distance(y.pos, a.pos))[0];
      if (friend) {
        to = copy(friend.pos);
        label = `Off to talk it over with ${friend.name}`;
        this.pass(a, friend, clock, true);
      }
    } else if (where === "authority") {
      const office = orderKeeper(this.world.pack.setting), keeper = this.keeper();
      const hall = this.world.places.find((p) => office.hall?.test(p.name)) ?? this.world.places.find((p) => AUTHORITY.test(p.name));
      if (keeper?.pos.space === "outside") to = copy(keeper.pos);
      else if (hall) to = { ...doorApproach(hall), space: "outside" };
      if (to) label = `Going to complain to ${keeper ? `${keeper.name}, ` : ""}${office.who}`;
      const grudge = a.word?.find((w) => !w.about && w.tone < 0 && !w.hops) ?? a.word?.find((w) => !w.about && w.tone < 0);
      if (grudge) this.complain(a, grudge);
    } else if (where === "away") {
      const p = this.state.player.pos;
      const d = Math.hypot(a.pos.x - p.x, a.pos.y - p.y) || 1;
      to = {
        x: Math.round(a.pos.x + ((a.pos.x - p.x) / d) * 40),
        y: Math.round(a.pos.y + ((a.pos.y - p.y) / d) * 40),
        space: "outside",
      };
      label = "Walking it off";
    }
    if (!to) {
      to = copy(a.home);
      label = "Gone home in a temper";
    }
    a.errand = { to, label, until: clock + 3600 };
    a.activity = label;
    a.offRoutine = true;
    this.routes.delete(a.id);
  }
  /** The full fit, and trust lost once per `AFFRONT_GAP`. */
  private affront(a: Actor) {
    const now = this.state.clock;
    if (now - (this.affronts.get(a.id) ?? -Infinity) < AFFRONT_GAP)
      return this.cue(a.id, "fury", this.state.player.pos);
    this.affronts.set(a.id, now);
    this.regard(a, -1, "fury");
  }
  private playerOn(p: Position) {
    const at = this.state.player.pos;
    return at.space === p.space && at.x === p.x && at.y === p.y;
  }
  /** Returns true once an actor has been stuck behind the player for a second. */
  private blockedByPlayer(a: Actor, step: { x: number; y: number }) {
    const p = this.state.player;
    if (
      p.pos.space !== a.pos.space ||
      p.pos.x !== step.x ||
      p.pos.y !== step.y
    ) {
      this.blockedSince.delete(a.id);
      return;
    }
    const since = this.blockedSince.get(a.id) ?? this.state.clock;
    this.blockedSince.set(a.id, since);
    if (this.state.clock - since < 1 || this.blockComplaint) return;
    this.blockedSince.delete(a.id);
    this.blockComplaint = { id: a.id, at: this.state.clock };
    this.cue(a.id, "anger");
  }
  private stepToward(a: Actor, target: Position) {
    // Livelihood callbacks write a.pos behind the engine's back.
    this.syncActor(a);
    if (a.pos.space !== target.space) return;
    if (this.state.manifest.simulation === 2) {
      if (a.pos.x === target.x && a.pos.y === target.y) return;
      if (
        (a.householdId &&
          this.blocked(target.x, target.y, target.space) &&
          !this.barrierAt(target, target.space)) ||
        this.actorAt(target, a.id)
      ) {
        const alternative = [
          [0, 1],
          [1, 0],
          [0, -1],
          [-1, 0],
        ]
          .map(([x, y]) => ({ ...target, x: target.x + x, y: target.y + y }))
          .find(
            (p) => !this.blocked(p.x, p.y, p.space) && !this.actorAt(p, a.id),
          );
        if (!alternative) return;
        target = alternative;
      }
      const key = `${target.space}:${target.x},${target.y}`;
      let cached = this.routes.get(a.id);
      if (
        !cached ||
        cached.target !== key ||
        (!cached.path.length && !a.householdId) ||
        (cached.path[0] &&
          this.blocked(cached.path[0].x, cached.path[0].y, a.pos.space) &&
          !this.barrierAt(cached.path[0], a.pos.space))
      ) {
        cached = {
          target: key,
          path: this.findRoute(a.pos, target, a.id, 5000).path,
        };
        this.routes.set(a.id, cached);
      }
      const step = cached.path[0];
      if (!step) return;
      const gate = this.barrierAt(step, a.pos.space);
      if (gate && a.kind === "human" && (!gate.owner || gate.owner === a.id)) {
        gate.open = true;
        return;
      }
      if (this.blocked(step.x, step.y, a.pos.space)) {
        this.routes.delete(a.id);
        return;
      }
      if (this.playerOn({ ...step, space: a.pos.space })) {
        this.collide(a, "actor");
        if (a.kind === "human") this.blockedByPlayer(a, step);
        this.routes.delete(a.id);
        return;
      }
      if (this.actorAt({ ...step, space: a.pos.space }, a.id)) {
        this.routes.delete(a.id);
        return;
      }
      cached.path.shift();
      a.direction =
        step.y < a.pos.y ? 0 : step.x > a.pos.x ? 1 : step.y > a.pos.y ? 2 : 3;
      this.moveActor(a, { ...step, space: a.pos.space });
      return;
    }
    const dx = Math.sign(target.x - a.pos.x),
      dy = Math.sign(target.y - a.pos.y);
    const steps =
      Math.abs(target.x - a.pos.x) > Math.abs(target.y - a.pos.y)
        ? [
            [dx, 0],
            [0, dy],
          ]
        : [
            [0, dy],
            [dx, 0],
          ];
    for (const [x, y] of steps) {
      if (!x && !y) continue;
      const to = { x: a.pos.x + x, y: a.pos.y + y, space: a.pos.space };
      if (this.playerOn(to)) {
        this.collide(a, "actor");
        return;
      }
      if (!this.blocked(to.x, to.y, a.pos.space)) {
        a.pos.x += x;
        a.pos.y += y;
        a.direction = y < 0 ? 0 : x > 0 ? 1 : y > 0 ? 2 : 3;
        this.syncActor(a);
        return;
      }
    }
    const step = findPath(
      a.pos,
      target,
      (x, y) => this.blocked(x, y, a.pos.space),
      800,
    )[0];
    if (step && !this.playerOn({ ...step, space: a.pos.space })) {
      a.pos.x = step.x;
      a.pos.y = step.y;
      this.syncActor(a);
    }
  }
  private stepAway(a: Actor, p: Position) {
    const dx = Math.sign(a.pos.x - p.x) || 1,
      dy = Math.sign(a.pos.y - p.y);
    this.stepToward(a, {
      x: a.pos.x + dx * 3,
      y: a.pos.y + dy * 3,
      space: a.pos.space,
    });
  }
  /** Eats one edible from the actor's own bag, else from the household store.
   * Returns false when there is nothing to eat. */
  private feed(a: Actor, household?: Household) {
    const store = household ? this.object(household.storeId) : undefined;
    for (const bag of [a.inventory, store?.inventory]) {
      if (!bag) continue;
      const food = (Object.keys(bag) as ItemId[]).find(
        (k) => this.items[k].edible && (bag[k] ?? 0) > 0,
      );
      if (!food) continue;
      bag[food] = (bag[food] ?? 0) - 1;
      a.hunger = Math.max(0, a.hunger - (this.items[food].edible ?? 0));
      return true;
    }
    return false;
  }
  /** Places an actor from their precomputed day. Sleeping moves them inside
   * the house, so nobody stands at the door overnight. */
  private followRoutine(a: Actor, routine: Itinerary, clock: number) {
    const at = itineraryAt(routine, clock);
    this.aboard(a, at.boat, Math.round(at.x), Math.round(at.y));
    const household = this.household(a.householdId);
    a.offRoutine = false;
    if (at.carry) a.heldItem = at.carry;
    else delete a.heldItem;
    const sites = this.world.activitySites?.(a.id);
    const gateId = sites?.gateId;
    if (gateId) {
      const gate = this.object(gateId);
      if (gate) gate.open = at.activity !== "rest";
    }
    // The catch hangs while the household is up. The routine puts them at the
    // rack at both ends of the day, so the change happens where you can see it.
    if (sites?.rackId) {
      const rack = this.object(sites.rackId);
      if (rack) rack.open = at.activity !== "rest";
    }
    const indoorPlace = at.placeId && this.world.place(at.placeId);
    const homeRest = at.activity === "rest" && !at.placeId;
    const room = indoorPlace && !this.burningPlace(indoorPlace.id)
      ? indoorPlace.id
      : homeRest && household?.residence && !this.burningPlace(household.residence)
        ? household.residence
        : undefined;
    if (at.activity === "rest" && room) {
      const index = Math.max(0, household?.members.indexOf(a.id) ?? 0);
      if (a.pos.space !== room || a.activity !== at.label) this.moveActor(a, this.indoorSpot(a, room, at.label, index));
      a.activity = at.label;
      if (homeRest) a.fatigue = Math.max(0, a.fatigue - 0.1);
      // Eating at home is what keeps a resident under the hunger gate below and
      // so on their routine at all. Without it the whole settlement drifts onto
      // the pathfinding fallback over a long session.
      // High enough that one meal covers the night's ~16 points of hunger:
      // followRoutine runs every 12 seconds, and a lower gate empties the
      // household store in a few days.
      if (homeRest && household && a.hunger > 35) this.feed(a, household);
      // Indoors the routine's outdoor coordinates mean nothing: let the drawn
      // position fall back to the simulated one.
      a.offRoutine = true;
      return;
    }
    this.moveActor(a, {
      x: Math.round(at.x),
      y: Math.round(at.y),
      space: "outside",
    });
    a.direction = at.direction;
    a.activity = at.label;
  }
  /** The player's household's place on the waterfront, if this is its boat. */
  private ownBoat(o: WorldObject) {
    const h = this.state.households?.find((x) => x.members.includes("player"));
    const m = h && waterfrontMember(this.world, h);
    return m && m.boatId === o.id ? m : undefined;
  }
  private atBoat(o: WorldObject) {
    const boat = this.ownBoat(o), p = this.state.player.pos;
    return !!boat && Math.min(distance(p, o.pos), distance(p, { ...boat.launch.water, space: "outside" })) <= 2.5;
  }
  private fishingFits(want: NonNullable<ChoiceCard["fishing"]>, t = this.trade()) {
    const setting = this.world.pack.setting;
    if (!t || !setting || !t.process.steps.some((st) => st.at === "grounds")) return false;
    const fate = catchFate(setting), member = waterfrontMember(this.world, t.household);
    return (want.boat === undefined || want.boat === !!member?.practice?.hull) &&
      (want.owed === undefined || want.owed === !!fate.owed) &&
      (want.sold === undefined || want.sold === fate.sold);
  }
  /** A day on the household's own field: its grain comes from the harvest, not the day. */
  private farming(t: NonNullable<ReturnType<Engine["trade"]>>) {
    return t.process.skill === "farming" && t.process.steps.some((st) => st.at === "field");
  }
  /** Notes the sowing and weeding the harvest will repay; on the reaping step,
   * cuts the parcel's standing ripe crop and returns how many cells it was. */
  private tendFarm(t: NonNullable<ReturnType<Engine["trade"]>>, step: string) {
    const s = this.state, now = seasonIndex(s.clock);
    const farm = ((s.economy ??= { hour: Math.floor(s.clock / 3600), stock: {}, short: {} }).farm ??= {});
    if (step === "sow" || step === "plant") farm.sown = now;
    if (step === "weed") farm.weeded = now;
    if (step !== "reap" && step !== "cut") return;
    const parcel = fieldParcel(this.world, t.household);
    if (!parcel) return 0;
    let cells = 0;
    for (let y = parcel.rect.y; y < parcel.rect.y + parcel.rect.h; y++)
      for (let x = parcel.rect.x; x < parcel.rect.x + parcel.rect.w; x++) {
        const f = this.world.topography?.(x, y)?.field;
        if (!f || f.parcel !== parcel.id || f.stage !== "ripe") continue;
        const edit = this.editAt(x, y);
        if (this.pickedNow(edit)) continue;
        edit.picked = s.clock;
        cells++;
      }
    if (cells) this.tilesChanged();
    return cells;
  }
  /** The harvest into the granary: what was standing to reap, how well it
   * was sown and weeded, the year's weather, less the landlord's share. */
  private settleHarvest(t: NonNullable<ReturnType<Engine["trade"]>>): Record<string, number> {
    const s = this.state, setting = this.world.pack.setting, work = s.economy?.work;
    const cells = work?.harvest;
    if (cells === undefined || !s.economy) return {};
    if (!cells) {
      this.event("There was nothing left standing to reap.");
      return {};
    }
    const now = seasonIndex(s.clock), farm = s.economy.farm ?? {};
    const sown = farm.sown !== undefined && now - farm.sown <= 3, weeded = farm.weeded !== undefined && now - farm.weeded <= 2;
    const tended = 0.6 + (sown ? 0.25 : 0) + (weeded ? 0.15 : 0);
    const luck = this.harvestLuck(now);
    const owed = setting ? catchFate(setting).owed : undefined;
    const grain = cells * GRAIN_PER_CELL * tended * luck * (1 + 0.25 * (work.quality ?? 0)) * (1 - (owed?.share ?? 0));
    const kept = addStock(s.economy, t.household, "grain", grain);
    const weeks = Math.round(kept / Math.max(1, t.household.members.length) / 7);
    const crop = crops[fieldParcel(this.world, t.household)?.crop as CropId]?.label.toLowerCase() ?? "grain";
    this.event(`${luck < 0.85 ? "A poor year." : luck > 1.2 ? "A good year." : "An ordinary year."} You bring in ${cells} rows of ${crop}: enough to feed the house for about ${weeks} weeks.`);
    if (owed) this.event(`${owed.share >= 0.25 ? "A quarter" : "A tenth"} of it went to ${owed.to}.`);
    if (!sown) this.event("The field was never properly sown this year, and it shows.");
    else if (!weeded) this.event("The weeds took their share.");
    return kept ? { grain: kept } : {};
  }
  private parcels = new Map<string, ReturnType<typeof fieldParcel>>();
  /** A farm's making this hour against an ordinary hour's: the grain comes in
   * when its crop is ripe, by the size of its field and the year it was. */
  harvestYield(h: Household, hour: number) {
    const setting = this.world.pack.setting;
    if (!setting) return 1;
    if (!this.parcels.has(h.id)) this.parcels.set(h.id, fieldParcel(this.world, h));
    const parcel = this.parcels.get(h.id), crop = parcel && crops[parcel.crop as CropId];
    const ripe = crop ? Object.values(crop.calendar).filter((st) => st === "ripe").length : 0;
    if (!parcel || !ripe) return 1;
    const clock = hour * 3600;
    if (cropStage(parcel.crop as CropId, seasonAt(setting.season, clock) as Season, setting.lat) !== "ripe") return 0;
    return (4 / ripe) * this.harvestLuck(seasonIndex(clock)) * Math.min(1.5, Math.max(0.5, parcel.cells / PARCEL_CELLS));
  }
  /** One year's harvest weather for the whole country, from poor to good. */
  private harvestLuck(season: number) {
    return 0.6 + 0.8 * random(this.state.manifest.seed, "harvest-year", Math.floor(season / 4));
  }
  /** The farm day a crop's stage this season calls for: sowing, weeding,
   * harvest, or the slack season when the field is bare. */
  private cropSeason(household: Household, season: SeasonId): SeasonId {
    const crop = fieldParcel(this.world, household)?.crop;
    if (!crop || !crops[crop]) return season;
    const stage = cropStage(crop as CropId, season, this.world.pack.setting?.lat ?? 0);
    return stage === "sown" ? "spring" : stage === "green" ? "summer" : stage === "ripe" ? "autumn" : "winter";
  }
  /** The share of a catch that goes to whoever holds the water, as a fraction. */
  private catchOwed() {
    const setting = this.world.pack.setting;
    return this.state.economy?.work?.catch !== undefined && setting ? catchFate(setting).owed?.share ?? 0 : 0;
  }
  /** The catch handed over, sold or shared out at the end of a day's fishing. */
  private settleCatch(t: NonNullable<ReturnType<Engine["trade"]>>): Record<string, number> {
    const setting = this.world.pack.setting;
    if (!setting) return {};
    const fate = catchFate(setting), preserve = waterfrontMember(this.world, t.household) && this.preserve(t.household);
    if (fate.owed) this.event(`${fate.owed.share >= 0.25 ? "A quarter" : "A tenth"} of the catch goes to ${fate.owed.to}.`);
    if (preserve && preserve !== "fresh") this.event(`The rest is put by: ${preserveWords[preserve].doing.toLowerCase()}.`);
    if (fate.sold) {
      const coin = this.takings(2, (amount) => `${fate.buyer.replace(/^./, (c) => c.toUpperCase())} pays you ${amount} for the fish.`);
      if (!coin.coin) this.event("You trade the fish at the market for what the house needs.");
      return coin;
    }
    const kin = this.state.player.relations
      ?.map((r) => this.state.actors.find((a) => a.id === r.other && !a.dead && !t.household.members.includes(a.id)))
      .find((a) => a && a.kind === "human");
    if (kin) this.regard(kin, 1, "warm");
    this.event(kin ? `You share out the catch. ${kin.name.split(" ")[0]}'s family gets a good part of it.` : "You share out the catch with the neighbours.");
    return {};
  }
  private preserve(household: Household) {
    const h = household.residence?.includes("-waterfront-") ? household.residence.split("-waterfront-")[0] : undefined;
    const plan = h ? (this.world as { planOf?: (id: string) => { waterfront?: { preserve?: Preserve } } | undefined }).planOf?.(h) : undefined;
    return plan?.waterfront?.preserve;
  }
  private practices = new Map<string, ReturnType<Engine["fishing"]>>();
  /** A fishing household's catch this hour against an ordinary one, by the
   * same season, hour and daily luck as the player's own day on the water. */
  catchYield(h: Household, hour: number) {
    const setting = this.world.pack.setting;
    if (!setting) return 1;
    if (!this.practices.has(h.id)) this.practices.set(h.id, this.fishing(h));
    const practice = this.practices.get(h.id);
    if (!practice) return 1;
    const day = Math.floor(hour / 24);
    return catchOf(setting, practice, (seasonAt(setting.season, hour * 3600) ?? "spring") as SeasonId,
      hour % 24, random(this.state.manifest.seed, "catch", h.id, day)).factor;
  }
  /** A hunting household's game this hour against an ordinary one, by season, hour and daily luck. */
  gameYield(h: Household, hour: number) {
    const setting = this.world.pack.setting;
    return setting ? gameOf(setting, (seasonAt(setting.season, hour * 3600) ?? "spring") as SeasonId, hour % 24,
      random(this.state.manifest.seed, "game", h.id, Math.floor(hour / 24))).factor : 1;
  }
  /** The words for a hunter's day: their weapon, their snares, and where the kill goes. */
  private huntingWords(household: Household | undefined, a: Actor): Record<string, string> {
    const setting = this.world.pack.setting;
    if (!setting) return {};
    const seed = this.state.manifest.seed, salt = household?.id ?? a.id;
    const weapon = huntWeapon(setting, random(seed, "weapon", salt), a.inventory.bow ? "bow" : a.inventory.spear ? "spear" : undefined);
    const fate = huntFate(setting);
    return {
      ready: huntWords[weapon].ready, weapon: huntWords[weapon].weapon, danger: dangerOf(setting), lord: fate.owed?.to ?? "the lord",
      hunt: keepsTraps(setting, random(seed, "traps", salt), a.origin?.roleLabel ?? a.role) ? "Check the snares, then track game" : "Track and hunt wild game",
      home: fate.owed ? `Bring the kill home and set aside ${fate.owed.to}'s share` : fate.sold ? `Bring the kill home and sell the meat to ${fate.buyer}` : "Bring the kill home and share it out",
    };
  }
  private huntingFits(want: NonNullable<ChoiceCard["hunting"]>, t = this.trade()) {
    const setting = this.world.pack.setting;
    if (!t || !setting || !t.process.steps.some((st) => st.scene === "hunt")) return false;
    const fate = huntFate(setting);
    return (want.owed === undefined || want.owed === !!fate.owed) &&
      (want.sold === undefined || want.sold === fate.sold) &&
      // A kill worth a card is a big one, not a snared hare.
      (want.kill === undefined || want.kill === (this.state.player.inventory.meat ?? 0) >= 3);
  }
  /** Whether today's hunt has gone on long enough to give up. */
  huntOver() {
    const t = this.trade(), work = this.state.economy?.work;
    return !!t && t.process.steps[t.stage]?.scene === "hunt" && work?.day === t.day && work.since !== undefined &&
      this.state.clock - work.since >= GIVE_UP_HOURS * 3600;
  }
  /** A hunt given up: why the game was not there, and whatever the snares held. */
  private emptyHanded(t: NonNullable<ReturnType<Engine["trade"]>>) {
    const s = this.state, p = s.player, setting = this.world.pack.setting;
    if (!setting) return;
    const game = gameOf(setting, (seasonAt(setting.season, s.clock) ?? "spring") as SeasonId, (s.clock / 3600) % 24,
      random(s.manifest.seed, "game", t.household.id, t.day));
    const snared = keepsTraps(setting, random(s.manifest.seed, "traps", t.household.id), p.origin?.roleLabel ?? p.role) &&
      random(s.manifest.seed, "snare", t.household.id, t.day) < game.factor / 2;
    if (snared) {
      p.inventory.meat = (p.inventory.meat ?? 0) + 1;
      p.inventory.hide = (p.inventory.hide ?? 0) + 1;
    }
    this.event(`${snared ? "You give up on bigger game, but the snares held something small." : "You give up and head home empty-handed."} ${game.lean ? game.why : "The tracks you found were old ones."}`);
  }
  /** The day's meat and hides, out of the bag and into the house's store:
   * a share to whoever held the game, then sold or shared round the kin. */
  private settleHunt(t: NonNullable<ReturnType<Engine["trade"]>>): Record<string, number> {
    const s = this.state, p = s.player, setting = this.world.pack.setting;
    const meat = p.inventory.meat ?? 0, hide = p.inventory.hide ?? 0;
    if (!setting || (!meat && !hide)) return {};
    delete p.inventory.meat;
    delete p.inventory.hide;
    const fate = huntFate(setting);
    const made = { meat: Math.round(meat * (1 - (fate.owed?.share ?? 0))), hide };
    if (fate.owed && meat) this.event(`A quarter of the meat goes to ${fate.owed.to}.`);
    const stock = (s.economy!.stock[t.household.id] ??= {});
    for (const [g, n] of Object.entries(made)) if (n) stock[g] = (stock[g] ?? 0) + n;
    if (fate.sold) {
      const coin = this.takings(Math.max(1, Math.round(made.meat / 3)), (amount) => `${fate.buyer.replace(/^./, (c) => c.toUpperCase())} pays you ${amount} for the meat.`);
      if (!coin.coin) this.event("You trade the meat at the market for what the house needs.");
      return { ...made, ...coin };
    }
    const kin = p.relations
      ?.map((r) => s.actors.find((a) => a.id === r.other && !a.dead && !t.household.members.includes(a.id)))
      .find((a) => a && a.kind === "human");
    if (kin) this.regard(kin, 1, "warm");
    this.event(kin ? `You share out the meat. ${kin.name.split(" ")[0]}'s family gets a good part of it.` : "You share out the meat with the neighbours.");
    return made;
  }
  /** How the player's household fishes: its waterfront practice, else from the bank. */
  private fishing(household: Household) {
    const setting = this.world.pack.setting;
    const water = setting && waterOf(setting);
    return waterfrontMember(this.world, household)?.practice ??
      (setting ? fishingPractice(setting, water ?? "river", `${this.state.manifest.seed}:${household.id}`, 0) : undefined);
  }
  /** In the boat while over water with it, and the boat gone from its
   * mooring meanwhile; back at the mooring once ashore. */
  private aboard(a: Actor, boat: string | undefined, x: number, y: number) {
    const on = !!boat && this.wet(x, y);
    if (a.boat && (!on || a.boat !== boat)) {
      const moored = this.object(a.boat);
      if (moored) delete moored.away;
      delete a.boat;
      if (a.afloat === "boat") delete a.afloat;
    }
    if (!on) return;
    a.boat = boat;
    a.afloat = "boat";
    const out = this.object(boat!);
    if (out) out.away = true;
  }
  private wet(x: number, y: number) {
    return this.world.topography
      ? waterDepthAt(this.world.topography, x + 0.5, y + 0.5) > 0.2
      : this.world.terrain(x, y) === "water";
  }
  /** A guard's watch over warded ground. A stranger coming close to it, or
   * going in, brings them down off their vehicle -- all but the driver, who
   * keeps the team -- and across: to bar the way outside, or in through the
   * gate after them. One who stays after the warning is walked out through the
   * gate. With the ground clear again they go back and climb aboard. */
  private keepWatch(a: Actor, clock: number) {
    const guard = a.guard!;
    const ward = this.world.ward?.(guard.ward);
    if (!ward) return;
    const p = this.state.player.pos;
    const r = ward.rect;
    const inside = p.space === ward.placeId;
    const near = p.space === "outside" && p.x >= r.x - 3 && p.x < r.x + r.w + 3 && p.y >= r.y - 3 && p.y < r.y + r.h + 3;
    if (inside || near) guard.since = clock;
    const alarmed = guard.since !== undefined && clock - guard.since < 90;
    const mount = a.mount ?? a.dismounted;
    const v = mount && this.world.vehicle?.(mount.vehicle);
    const gate = { x: ward.gate.x, y: ward.gate.y, space: "outside" };
    if (alarmed && a.mount) {
      const to = inside ? gate : p;
      if (Math.hypot(a.pos.x - to.x, a.pos.y - to.y) > 40) return;
      if (a.mount.place === 0 && v && v.crew.length > 1) return;
      a.dismounted = a.mount;
      delete a.mount;
      const step = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1]]
        .map(([dx, dy]) => ({ x: a.pos.x + dx, y: a.pos.y + dy }))
        .find((q) => !this.blocked(q.x, q.y, "outside"));
      if (step) this.moveActor(a, { ...step, space: "outside" });
      this.event(`${a.name} leaps down from the ${(v?.label ?? "cart").toLowerCase()} and comes striding toward you.`);
      this.cue(a.id, "alarm", to);
      return;
    }
    if (alarmed && !a.mount) {
      // Following in: from the gate, through it, to the stranger's side.
      if (inside && a.pos.space === "outside" && Math.hypot(a.pos.x - gate.x, a.pos.y - gate.y) <= 1.6) {
        const beside = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          .map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
          .find((q) => !this.blocked(q.x, q.y, ward.placeId)) ?? { x: p.x, y: p.y + 1 };
        this.moveActor(a, { ...beside, space: ward.placeId });
        this.event(`${a.name} comes in through the gate after you.`);
      }
      const here = a.pos.space === p.space;
      const to = here ? p : gate;
      a.errand = { to: { ...to }, label: "Coming to turn a stranger back", until: clock + 120 };
      a.offRoutine = true;
      if (here && Math.hypot(a.pos.x - p.x, a.pos.y - p.y) <= 1.6) {
        if (guard.warned === undefined || clock - guard.warned > 300) {
          guard.warned = clock;
          this.challenger = a.id;
          this.cue(a.id, "point", p);
          this.event(
            inside
              ? `${a.name} bars your way. "This is the god's house. Out, the way you came."`
              : `${a.name} steps across your path. "Keep back from the god's gate, stranger."`,
          );
        } else if (inside && clock - guard.warned > 45) {
          guard.warned = clock;
          // Out past the ground they watch, so a stranger who walks on is let be.
          const out = { x: ward.gate.x, y: ward.gate.y + 4, space: "outside" as const };
          if (!this.blocked(out.x, out.y, "outside")) this.moveActor(this.state.player, out);
          this.moveActor(a, { x: ward.gate.x + 1, y: ward.gate.y + 1, space: "outside" });
          this.cue(a.id, "anger", out);
          this.event(`${a.name} takes you hard by the arm and marches you out through the gate.`);
        }
      }
      return;
    }
    if (!alarmed && a.dismounted && v) {
      // Out of a precinct first, then back to the vehicle.
      if (a.pos.space !== "outside") {
        this.moveActor(a, { x: ward.gate.x, y: ward.gate.y + 1, space: "outside" });
        return;
      }
      const at = vehicleAt(v, clock);
      const to = { x: Math.round(at.x), y: Math.round(at.y), space: "outside" as const };
      if (Math.hypot(a.pos.x - to.x, a.pos.y - to.y) <= 2.2) {
        a.mount = a.dismounted;
        delete a.dismounted;
        delete a.errand;
        a.offRoutine = false;
      } else {
        a.errand = { to, label: `Going back to the ${v.label.toLowerCase()}`, until: clock + 120 };
        a.offRoutine = true;
      }
    }
  }
  /** Keeps a dormant resident indoors at their household, or at their door
   * when the house has no interior. */
  private park(a: Actor) {
    const household = this.household(a.householdId);
    const room = this.regularsAt()?.get(a.id);
    if (room) {
      a.offRoutine = true;
      if (a.pos.space !== room.space || a.activity !== room.label) {
        a.activity = room.label;
        this.moveActor(a, this.indoorSpot(a, room.space, room.label, room.index));
      }
      return;
    }
    a.offRoutine = true;
    a.activity = "At home";
    a.hunger = Math.min(a.hunger, 30);
    a.fatigue = Math.max(0, a.fatigue - 0.1);
    if (household?.residence && !this.burningPlace(household.residence)) {
      const index = Math.max(0, household.members.indexOf(a.id));
      if (a.pos.space !== household.residence) this.moveActor(a, this.indoorSpot(a, household.residence, a.activity, index));
    } else if (a.pos.space === "outside" && distance(a.pos, a.home) > 0) {
      this.moveActor(a, copy(a.home));
    }
  }
  private regulars?: { key: string; seated?: Map<string, { space: string; label: string; index: number }> };
  /** Who is in the communal room the player stands in, beyond those whose
   * day is simulated: grown neighbours off the routine budget, a fresh draw
   * each day and hour, enough to fill the room's share of seats. Only while
   * the player is inside, since nobody else sees the room. */
  private regularsAt() {
    const space = this.state.player.pos.space, hour = Math.floor((this.state.clock / 3600) % 24);
    const key = `${space}:${Math.floor(this.state.clock / 3600)}`;
    if (this.regulars?.key === key) return this.regulars.seated;
    this.regulars = { key };
    const room = space === "outside" ? undefined : this.interiorOf(space);
    const place = room?.regulars && this.world.place(space);
    if (!room?.regulars || !place) return;
    const [from, to] = room.regulars.hours;
    if (from <= to ? hour < from || hour >= to : hour < from && hour >= to) return;
    const day = Math.floor(this.state.clock / 86400);
    const near = this.state.actors
      .filter((a) => a.kind === "human" && (a.age ?? 30) >= 16 && !a.terror && this.world.dormant?.(a.id) &&
        this.household(a.householdId)?.residence !== space && Math.hypot(a.home.x - place.entrance.x, a.home.y - place.entrance.y) <= 60)
      .sort((a, b) => random(this.state.manifest.seed, "regular", a.id, day) - random(this.state.manifest.seed, "regular", b.id, day));
    const label = `At ${place.name.replace(/^The /, "the ")}`;
    // Where people stand, as in a medieval nave or a playhouse pit, the floor sets the count.
    const places = Math.max(room.seats.length, Math.floor(room.walk.size / 6));
    this.regulars.seated = new Map(near.slice(0, Math.round(places * room.regulars.fill)).map((a, index) => [a.id, { space, label, index }]));
    return this.regulars.seated;
  }
  /** Seconds from now until the next morning, for a night's sleep. */
  /** The hour the player's day starts: their trade's, or six. */
  rises() {
    return this.trade()?.process.rises ?? 6;
  }
  untilMorning(hour = this.rises()) {
    const now = this.state.clock;
    const target = Math.floor(now / 86400) * 86400 + hour * 3600;
    return Math.max(600, (target > now ? target : target + 86400) - now);
  }

  /** Where the player would lie down: their own bed, any bed in reach, or the
   * ground. */
  shelter() {
    const p = this.state.player;
    const bed = this.state.objects.find(
      (o) =>
        o.kind === "bed" &&
        o.pos.space === p.pos.space &&
        distance(o.pos, p.pos) <= 2.5,
    );
    const household = this.state.households?.find((h) =>
      h.members.includes("player"),
    );
    const own =
      !!bed &&
      (!bed.owner ||
        bed.owner === "player" ||
        (!!household && household.residence === p.pos.space));
    return {
      bed,
      own,
      indoors: p.pos.space !== "outside",
      /** Under a roof of some kind, whether or not it is yours. */
      covered: p.pos.space !== "outside" || !!bed,
    };
  }

  /**
   * Sleep or long rest. One step of the clock, then the night's account:
   * shelter decides how much good it did, and a night in the open can cost
   * something. Every roll is seeded, so a replay spends the same night.
   */
  sleep(seconds: number) {
    const p = this.state.player;
    if (p.dead) return;
    const started = this.state.clock;
    const { bed, own, indoors, covered } = this.shelter();
    const setting = this.world.pack.setting;
    const seed = this.state.manifest.seed;
    const before = p.activity;
    const day = this.state.today;
    p.activity = "Sleeping";
    this.advance(seconds);
    if (p.dead) return;
    p.activity = before === "Sleeping" ? "Exploring" : before;

    const hours = seconds / 3600;
    // A bed of your own is worth roughly twice the bare ground.
    const quality = own ? 1 : bed ? 0.85 : indoors ? 0.7 : 0.45;
    p.fatigue = Math.max(0, p.fatigue - hours * 14 * quality);

    // The same fallbacks the scene shows, so a night in the visible rain is a
    // night in the rain.
    const weather = weatherAt(
      skySeed(this.state.manifest),
      setting?.climate ?? "temperate",
      setting?.season ?? "spring",
      started + seconds / 2,
    );
    const roll = (key: string) => random(seed, "sleep", started, key);
    const cold = weather.tempC < 8;
    const wet = /rain|storm|snow|sleet/i.test(weather.label);
    const rough = !covered && hours >= 3;

    const startHour = Math.floor(started / 3600) % 24;
    const overnight = hours >= 5 && (startHour >= 18 || startHour < 4);
    this.event(
      hours >= 5
        ? `You sleep ${own ? "in your own bed" : bed ? "on a bed not your own" : indoors ? "under a roof" : "on the ground"}.`
        : `You lie down and rest ${Math.round(hours)} hour${hours >= 2 ? "s" : ""}.`,
    );

    // A proper night is the one thing that mends you; nothing else restores
    // health but food.
    const canMend = !this.state.manifest.survival || p.hunger < 75;
    if (covered && hours >= 5 && canMend)
      this.heal(own ? 6 : 4);
    else if (covered && hours >= 5 && !canMend) this.event("You rest, but need a meal before your body can mend.");

    if (rough && (cold || wet)) {
      const harm = Math.round(4 + (cold ? 4 : 0) + (wet ? 3 : 0));
      if (this.state.manifest.survival) this.hurt(harm, "exposure");
      else p.health = Math.max(0, Math.min(100, (p.health ?? 100) - harm));
      if (p.dead) return;
      this.event(
        `You wake stiff and ${cold ? "cold" : "soaked"} from ${
          overnight ? "a night in the open" : "lying out unsheltered"
        }.`,
      );
      if (!this.state.manifest.disease && roll("illness") < 0.18) {
        if (this.state.manifest.survival) this.fallIll("cough");
        else p.health = Math.max(0, (p.health ?? 100) - 12);
        this.event("Something has settled in your chest.");
      }
    }
    if (rough && roll("theft") < 0.14) {
      const worth = Object.entries(p.inventory)
        .filter(([, n]) => (n ?? 0) > 0)
        .sort(
          (a, b) =>
            (this.item(b[0])?.value ?? 0) - (this.item(a[0])?.value ?? 0),
        )[0];
      if (worth && (this.item(worth[0])?.value ?? 0) > 0) {
        p.inventory[worth[0]] = (p.inventory[worth[0]] ?? 0) - 1;
        this.event(
          `Someone went through your things while you slept. Your ${(
            this.item(worth[0])?.name ?? worth[0]
          ).toLowerCase()} is gone.`,
        );
      }
    }
    // Any long sleep that wakes into a morning closes the day, whenever it began.
    const woke = Math.floor(this.state.clock / 3600) % 24;
    if (hours >= 5 && woke >= 2 && woke < 12) this.evening(day);
  }

  advance(seconds: number, heldActor?: string) {
    if (this.state.player.dead) return;
    this.syncSeason();
    // Derived paths never survive a command boundary: saves and replays need no hidden routing state.
    this.routes.clear();
    this.tickObstacles = new Map();
    this.barriersAt = new Map();
    this.objectsById = new Map();
    this.resourceObjects = [];
    for (const o of this.state.objects) {
      if (!this.objectsById.has(o.id)) this.objectsById.set(o.id, o);
      if (o.resource) this.resourceObjects.push(o);
      if (o.kind !== "gate" && o.kind !== "door" && !o.prop) continue;
      const key = `${o.pos.space}:${o.pos.x},${o.pos.y}`;
      const [sx, sy] = (o.prop && propDefs[o.prop]?.span) || [0, 0];
      const [w, d] = o.size ?? [sx + 1, sy + 1];
      for (let dy = o.size ? 0 : -sy; dy < d; dy++)
        for (let dx = o.size ? 0 : -sx; dx < w; dx++) {
          const k =
            dx || dy ? `${o.pos.space}:${o.pos.x + dx},${o.pos.y + dy}` : key;
          const at = this.tickObstacles.get(k) ?? [];
          at.push(o);
          this.tickObstacles.set(k, at);
        }
      if (o.kind === "gate" || o.kind === "door") {
        const gates = this.barriersAt.get(key) ?? [];
        gates.push(o);
        this.barriersAt.set(key, gates);
      }
    }
    this.householdsById = new Map();
    for (const h of this.state.households ?? [])
      if (!this.householdsById.has(h.id)) this.householdsById.set(h.id, h);
    this.actorsById = new Map();
    this.actorsAt = new Map();
    this.actorCell = new Map();
    for (const a of this.state.actors) {
      if (!this.actorsById.has(a.id)) this.actorsById.set(a.id, a);
      this.syncActor(a);
    }
    const actors = [...this.state.actors].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    );
    updateRelationships(this.state);
    const end = this.state.clock + seconds;
    const player = this.state.player;
    // Building a routine costs a path search per station, and a city has a
    // couple of hundred residents wanting one at once. Capped per advance and
    // spent in the actors' fixed order, so a cold city fills in over a few
    // ticks and every replay spends the budget on the same people.
    let routineBuilds = 0;
    while (this.state.clock < end) {
      const next = Math.min(end, (Math.floor(this.state.clock / 6) + 1) * 6),
        elapsed = next - this.state.clock;
      this.state.clock = next;
      diseaseTime(this.state, elapsed, next - elapsed);
      this.fireExposure(elapsed, next - elapsed);
      if (player.dead) break;
      player.hunger = Math.min(100, player.hunger + elapsed / 1800);
      if (this.state.manifest.survival)
        player.hungerDebt = Math.max(0, (player.hungerDebt ?? 0) + elapsed * (player.hunger >= 100 ? 1 : -3));
      player.fatigue = Math.min(
        100,
        player.fatigue +
          (this.state.manifest.survival && (player.activity === "Resting" || player.activity === "Sleeping") ? 0 : elapsed) /
            (player.activity === "Resting" || player.activity === "Sleeping"
              ? 100000
              : ((this.state.manifest.survival ? 1200 : 2400) / (player.injury && (!this.state.manifest.survival || player.injury.until > next) ? 1.5 : 1)) *
                (1 +
                  levelOf(player.skills?.wayfaring) *
                    PER_LEVEL.wayfaringStamina) *
                (this.knows("long-stride") ? 1.25 : 1)),
      );
      if (next % 6 !== 0) continue;
      if (!this.state.introduced) this.introduce();
      if (next % 3600 === 0) this.healthStep(next);
      if (player.dead) break;
      if (next % 60 === 0 && this.state.plot && !this.state.plot.ended) this.runPlot();
      if (this.state.asks?.length) this.helpStep();
      if (next % 600 === 0) {
        this.kinStep(next);
        this.spreadWord(next);
        this.askStep(next);
        this.keeperStep(next);
      }
      if (this.approaching) this.approach(next);
      if (next % 300 === 0) this.syncWayfarers(next);
      this.burnStep();
      this.brawl();
      this.confront(next);
      if (next % 300 === 0) this.roadEncounter();
      if (this.state.encounter) break;
      if (player.torchOut !== undefined && next >= player.torchOut) this.torchBurnsOut();
      if (next % 3600 === 0) {
        this.world.rotateRoutines?.(next);
        this.runEconomy();
      }
      if (this.world.pack.setting?.environment) {
        const season = seasonAt(this.world.pack.setting.season, next);
        for (const o of this.resourceObjects) refreshResource(o, next, season);
      }
      const partner = this.conversing ? actors.find((a) => a.id === this.conversing) : undefined;
      if (partner && partner.pos.space === player.pos.space) player.direction = this.directionTo(player.pos, partner.pos);
      for (const a of actors) {
        if (a.id === heldActor) continue;
        if (a.id === this.conversing && a.pos.space === player.pos.space) {
          a.direction = this.directionTo(a.pos, player.pos);
          delete a.facing;
          continue;
        }
        const focus =
          this.state.manifest.simulation === 2 && player.pos.space !== "outside"
            ? {
                ...(this.world.place(player.pos.space)?.entrance ?? player.pos),
                space: "outside",
              }
            : player.pos;
        if (
          distance(
            a.pos.space === "outside"
              ? a.pos
              : (this.household(a.householdId)?.home ??
                  // Inside a building not their own: where its door is.
                  (this.world.place(a.pos.space)
                    ? { ...this.world.place(a.pos.space)!.entrance, space: "outside" }
                    : a.pos)),
            focus,
          ) > (this.state.manifest.simulation === 2 ? 220 : 80)
        )
          continue;
        const gap = next - (a.lastUpdated ?? next - 6);
        a.lastUpdated = next;
        a.hunger = Math.min(100, a.hunger + gap / 1800);
        // Catch up returning distant residents before either endpoint becomes visible.
        if (
          this.state.manifest.simulation === 1 &&
          gap > 600 &&
          a.kind === "human"
        ) {
          const hour = (next / 3600) % 24,
            target = hour < 7 || hour > 18 ? a.home : a.work;
          if (
            !this.visible(a.pos) &&
            !this.visible(target) &&
            distance(a.pos, target) * 18 < gap &&
            !this.blocked(target.x, target.y, target.space)
          )
            this.moveActor(a, copy(target));
        }
        if (this.state.manifest.survival && a.terror && a.terror.until >= next) continue;
        if (a.kind === "human" && next % 60 === 0) this.discover(a);
        if (a.kind === "human" && a.guard) this.keepWatch(a, next);
        if (a.kind === "human" && a.mount) {
          const v = this.world.vehicle?.(a.mount.vehicle);
          if (v) {
            const at = vehicleAt(v, next);
            const x = Math.round(at.x),
              y = Math.round(at.y);
            if (a.pos.x !== x || a.pos.y !== y || a.pos.space !== "outside")
              this.moveActor(a, { x, y, space: "outside" });
            a.activity = v.doing;
            a.offRoutine = false;
          }
          continue;
        }
        if (a.kind === "human" && a.tends) {
          if (next % 12 === 0) this.tendHerd(a, next);
          continue;
        }
        if (a.kind === "human" && this.shooPests(a, next)) continue;
        if (a.kind === "human" && a.errand) {
          if (next < a.errand.until) {
            a.activity = a.errand.label;
            a.offRoutine = true;
            // A brisk walk, not the one step an idle resident takes per tick.
            for (let i = 0; i < 3 && distance(a.pos, a.errand.to) >= 1.5; i++)
              this.stepToward(a, a.errand.to);
            continue;
          }
          delete a.errand;
        }
        const laid = a.kind === "human" && a.id !== player.id ? this.laidUp(a.id) : undefined;
        if (laid) {
          this.park(a);
          a.activity = laid;
          continue;
        }
        if (a.kind === "human") {
          // Past the routine budget a resident is furniture: home, fed, and
          // never routed. The budget rotates them back in over the days.
          if (this.world.dormant?.(a.id)) {
            this.park(a);
            continue;
          }
          if (this.world.routinePending?.(a.id)) {
            if (routineBuilds >= ROUTINE_BUILDS_PER_ADVANCE) continue;
            routineBuilds++;
          }
          // A resident on their routine costs a binary search, not a path
          // search. Needs pull them off it; everything else is the day's round.
          const routine = this.world.itinerary?.(a.id);
          if (routine && a.hunger <= 45 && !a.task) {
            if (next % 12 === 0) this.followRoutine(a, routine, next);
            continue;
          }
          if (next % 18 !== 0) continue;
          a.offRoutine = true;
          const hour = (next / 3600) % 24;
          const dutyGate =
            a.origin && a.role === "Herder"
              ? this.world.activitySites?.(a.id)?.gateId
              : undefined;
          const penDuty =
            dutyGate &&
            a.hunger <= 55 &&
            ((hour >= 7 && hour < 17) ||
              this.state.objects.some((o) => o.id === dutyGate && o.open));
          const busy =
            !penDuty &&
            householdActivity(
              a,
              this.state,
              this.items,
              (target) => this.stepToward(a, target),
              (target) =>
                this.findRoute(a.pos, target, a.id, 1500).status === "found",
              (this.loads ??= carryKit(this.world.pack)),
              (who, residence, index) => this.indoorSpot(who, residence, "Sleeping at home", index),
            );
          // householdActivity moves residents indoors itself.
          this.syncActor(a);
          if (busy) continue;
          if (a.hunger > 55) {
            a.activity = "Finding something to eat";
            this.stepToward(a, a.home);
            if (
              distance(a.pos, a.home) < 2 &&
              this.feed(a, this.household(a.householdId))
            )
              a.activity = "Eating at home";
          } else if (this.world.activitySites?.(a.id)) {
            const sites = this.world.activitySites(a.id)!;
            const minute = (next / 60 + sites.offset) % 1440;
            const resting = minute < 420 || minute >= 1080;
            const fetching = minute >= 660 && minute < 700;
            const social = minute >= 1020 && minute < 1080;
            const target = resting
              ? sites.home
              : fetching
                ? sites.water
                : social
                  ? sites.social
                  : sites.work;
            a.activity = resting
              ? "Returning to the household"
              : fetching
                ? "Fetching water"
                : social
                  ? "At the common"
                  : sites.label;
            if (sites.gateId) {
              const gate = this.object(sites.gateId);
              if (gate && distance(a.pos, gate.pos) < 2.5) {
                if (!resting && !social) gate.open = true;
                const animals = this.state.actors.filter(
                  (b) => b.owner === a.id && b.kind !== "human",
                );
                const herds = (this.state.fauna ?? []).filter(
                  (g) => g.owner === a.id,
                );
                if (
                  resting &&
                  animals.every((b) => distance(b.pos, b.home) < 2) &&
                  herds.every((g) =>
                    g.members.every(
                      (m) => Math.hypot(m.x - g.home.x, m.y - g.home.y) < 3.5,
                    ),
                  )
                )
                  gate.open = false;
              }
              // Check the pen before returning home for the night.
              if (resting && gate?.open) {
                this.stepToward(a, { ...sites.work, space: "outside" });
                continue;
              }
            }
            this.stepToward(a, { ...target, space: "outside" });
            if (resting && distance(a.pos, a.home) < 1)
              a.activity = "Resting at home";
          } else if (hour < 7 || hour > 18) {
            a.activity = "Returning to the household";
            this.stepToward(a, a.home);
          } else {
            a.activity =
              distance(a.pos, a.work) > 2 ? "Walking to work" : atWork(a.role);
            if (distance(a.pos, a.work) > 2) this.stepToward(a, a.work);
            else if (next % 90 === 0) {
              const dx = Math.floor(this.rng("routine") * 3) - 1,
                dy = Math.floor(this.rng("routine") * 3) - 1;
              this.stepToward(a, {
                ...a.pos,
                x: a.pos.x + dx,
                y: a.pos.y + dy,
              });
            }
          }
          if (next % 1800 === 0)
            for (const o of this.state.objects.filter(
              (o) =>
                o.owner === a.id && o.depleted && distance(o.pos, a.pos) < 3,
            )) {
              const memory = `Found missing contents: ${o.id}`;
              if (!a.memories.includes(memory)) {
                a.memories.push(memory);
                if (this.visible(a.pos))
                  this.event(
                    `${a.name} notices missing household supplies. They do not know who took them.`,
                    "social",
                  );
              }
            }
        } else if (a.goal) {
          this.stepToward(a, a.goal);
          if (distance(a.pos, a.goal) < 1) {
            a.goal = undefined;
            a.activity = "Grazing inside the enclosure";
          }
        } else if (
          grazeActivity(a, this.state, (target) => this.stepToward(a, target))
        ) {
          // Food comes from finite, replenishing pasture patches.
        } else if (this.world.activitySites?.(a.id)) {
          const sites = this.world.activitySites(a.id)!;
          const gate = this.object(sites.gateId);
          const hour = (next / 3600) % 24;
          const grazing = hour >= 8 && hour < 17 && gate?.open;
          const target = grazing ? sites.work : sites.home;
          a.activity = grazing
            ? "Grazing in the pasture"
            : "Returning to the enclosure";
          if (next % 18 === 0)
            this.stepToward(a, { ...target, space: "outside" });
          if (distance(a.pos, { ...target, space: "outside" }) < 1)
            a.activity = grazing ? "Grazing" : "Resting in the enclosure";
        } else if (
          (a.kind === "lizard" || a.kind === "sheep" || a.kind === "goat") &&
          distance(a.pos, player.pos) < 2
        ) {
          this.stepAway(a, player.pos);
          a.activity = "Fleeing";
        } else if (next % 30 === 0 && this.rng("graze") < 0.5) {
          const dx = Math.floor(this.rng("animal-x") * 3) - 1,
            dy = Math.floor(this.rng("animal-y") * 3) - 1;
          this.stepToward(a, { ...a.pos, x: a.pos.x + dx, y: a.pos.y + dy });
        }
      }
      this.stepFauna(next);
      this.raidCrops(next);
    }
    // Commands can end between routine ticks; collision must use the same
    // itinerary time that the renderer draws after the command.
    for (const a of actors) {
      if (
        a.kind !== "human" || a.offRoutine || a.task || a.tends || a.errand ||
        a.hunger > 45 || this.world.routinePending?.(a.id)
      )
        continue;
      const routine = this.world.itinerary?.(a.id);
      if (routine) this.followRoutine(a, routine, this.state.clock);
    }
    updateRelationships(this.state);
    this.tickObstacles = undefined;
    this.barriersAt = undefined;
    this.actorsAt = undefined;
    this.actorCell = undefined;
    this.actorsById = undefined;
    this.objectsById = undefined;
    this.householdsById = undefined;
    this.resourceObjects = undefined;
    const fallen = this.pendingCollapse;
    if (fallen) {
      this.pendingCollapse = undefined;
      this.collapse(fallen.by, fallen.part);
    }
  }
}
