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
  grazeActivity,
} from "./livelihood";
import { weatherAt } from "./weather";
import { propDefs } from "../content/props/catalog";
import { about } from "../content/props/about";
import { atWork, briefText, personBrief } from "./brief";
import { placeBrief } from "./place-brief";
import { propAffordances, heldObject, lowProp } from "./props";
import {
  planShove,
  type ShovePlan,
  type ShoveRefusal,
  type ShoveWorld,
} from "./shove";
import { statsOf } from "./stats";
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
  type WorldModel,
  type WorldObject,
} from "./types";
import { canonical, random, stateHash } from "./random";
import { rockFrame } from "../content/ecology/rocks";
import { BUILDING_BURN, BURN_SECONDS, oreAt, TORCH_SECONDS } from "../content/ecology/metals";
import { conditionOf, damageStructure, fabricOf, weatherStructure, type Structure } from "./time/structure";
import { regardCue } from "./regard";
import { resolveIntents, validateIntents } from "./intents";
import { findPath } from "./pathfinding";
import { dayOfWork, importShare, runEconomy, stockOf } from "./economy";
import { goods } from "../content/economy/goods";
import { carryKit } from "../content/economy/carrying";
import { processFor, type ProcessFamily } from "../content/economy/processes";
import { itineraryAt, type Itinerary, DAY_MINUTES } from "./itinerary";
import { goalDone, heldCount, pickGoals } from "./goals";
import { GOAL_TEMPLATES } from "../content/goals/templates";
import type { SeasonId } from "./season";
import { livelihoodOf } from "../world/v3/routines";
import type { GoalContext } from "../content/goals/types";
import { route, type RouteResult } from "./routing";
import { terrainJump, terrainLeap, type LeapResult } from "./topography";
import { boundaryGraph } from "../render/fence-pass";
import { advanceFauna, stepAllowed } from "./fauna-sim";
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
import { faunaCombat, faunaProfile } from "../content/fauna";
import { propSprite } from "../content/props/place";
import {
  levelOf,
  PER_LEVEL,
  SKILLS,
  rankOf,
  startingSkills,
  type SkillGain,
  type SkillId,
} from "./skills";
import { faunaBlockOf, habitatScorer } from "../world/v3/fauna";
import { herdNoun } from "../content/fauna/herding";
import { crops, pickable } from "../content/agriculture/crops";

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
const AUTHORITY = /basilica|meeting hall|guild hall|council|palace|temple|chapel|church|shrine|mosque|synagogue/i;
/** Clock seconds: offence taken again this soon costs no more trust. */
const AFFRONT_GAP = 30;
import { facingFromStep } from "./facing";
import {
  doorAccess,
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
import type { Place, Point, WalkOff } from "./types";
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
  const span = o.prop ? propDefs[o.prop]?.span : undefined;
  return span
    ? Math.abs(o.pos.x - x) <= span[0] && Math.abs(o.pos.y - y) <= span[1]
    : o.pos.x === x && o.pos.y === y;
};
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
        age: 34,
        knownResources: [],
        relations: this.state.actors.flatMap((a) =>
          (a.relations ?? [])
            .filter((r) => r.other === "player")
            .map((r) => ({
              other: a.id,
              kind:
                r.kind === "parent"
                  ? "child"
                  : r.kind === "child"
                    ? "parent"
                    : r.kind,
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
  item(id: ItemId): ItemDef | undefined {
    const known = this.items[id] ?? this.state.catalog?.[id];
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
    const process = kit && processFor(kit);
    if (!household || !kit || !process) return;
    const day = Math.floor(s.clock / 86400);
    const stage = s.economy?.work?.day === day ? s.economy.work.stage : 0;
    return { household, kit, process, day, stage };
  }
  private workAt(o: WorldObject, close: boolean): Affordance[] {
    const t = this.trade();
    if (!t) return [];
    const { process, stage } = t;
    // Your own stores always serve; a tool or hearth, only if it is no one else's.
    const station =
      o.id === t.household.storeId ||
      ((!o.owner || o.owner === "player") &&
        process.stations.includes(propDefs[o.prop ?? ""]?.family ?? ""));
    if (!station) return [];
    const done = stage >= process.stages.length;
    return [
      {
        label: done
          ? "Today's work is done"
          : `${t.kit.activity}: ${process.stages[stage]}`,
        command: { type: "interact", target: o.id, action: "work" },
        enabled: close && !done,
        reason: done ? "Come back tomorrow" : close ? undefined : "Walk closer",
      },
    ];
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
      s.manifest.seed,
      setting?.climate ?? "temperate",
      setting?.season ?? "spring",
      s.clock + 3 * 3600,
    );
    s.evening = {
      day: closed,
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
      short,
      households: s.households?.length ?? 0,
      tomorrow: { condition: w.condition, label: w.label, tempC: w.tempC },
    };
  }
  private doWork() {
    const t = this.trade();
    if (!t || t.stage >= t.process.stages.length) return;
    const s = this.state;
    const { process, kit, household } = t;
    this.advance((process.hours * 3600) / process.stages.length);
    s.economy ??= { hour: Math.floor(s.clock / 3600), stock: {}, short: {} };
    s.economy.work = { day: t.day, stage: t.stage + 1 };
    if (t.stage + 1 < process.stages.length) {
      this.event(`You ${process.stages[t.stage]}. ${kit.activity} goes on.`);
      return;
    }
    const made = dayOfWork(s.economy, household);
    // Work that makes nothing the town trades in, a forager's or a fisher's,
    // comes home in the hand instead.
    if (!Object.keys(made).length)
      for (const [item, n] of Object.entries(kit.inventory ?? {}))
        if (n && item !== "tool" && item !== "water" && this.item(item)) {
          s.player.inventory[item] = (s.player.inventory[item] ?? 0) + n;
          made[item] = n;
        }
    const today = this.today().made;
    for (const [g, n] of Object.entries(made)) today[g] = (today[g] ?? 0) + n;
    this.grantXp(workSkill[process.family], 20);
    if (s.goalFlags) s.goalFlags.worked = true;
    this.event(
      Object.keys(made).length
        ? `A full day's work done (${kit.activity.toLowerCase()}): ${Object.keys(made).map((g) => goods.find((x) => x.id === g)?.noun ?? this.item(g)?.name.toLowerCase() ?? g).join(" and ")}.`
        : `A full day's work done (${kit.activity.toLowerCase()}).`,
    );
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
      s.goals = pickGoals(s.manifest.seed, today, context, templates);
      for (const g of s.goals)
        if (g.check.type === "gain") g.base = heldCount(p, g.check.items);
      s.goalDay = today;
      s.goalFlags = { traded: false, talked: false, visited: [] };
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
    if (!o.owner || o.owner === "player") return;
    const memory = `property:${o.id}`;
    if (p.memories.includes(memory)) return;
    p.memories.push(memory);
    this.offend({
      cost: () => 3,
      memory: () => `Saw player ${action} ${o.id}`,
      text: (w) => `${w.name} saw you ${action} household property.`,
    });
  }
  /** People near enough, and with a clear enough view, to have seen what the
   * player just did. */
  witnesses(radius = 7) {
    const p = this.state.player;
    return this.state.actors.filter(
      (a) =>
        a.kind === "human" &&
        distance(a.pos, p.pos) < radius &&
        this.visibleFrom(a.pos, p.pos),
    );
  }
  /** The one place a person's trust in the player changes. How they take it
   * shows on them: losing trust angers, a real gain warms, an ordinary
   * friendly exchange is a nod. */
  regard(a: Actor, delta: number, cue?: CueKind) {
    if (!delta) return;
    a.trust += delta;
    const t = this.today().trust;
    t[a.id] = (t[a.id] ?? 0) + delta;
    this.cue(a.id, cue ?? regardCue(delta, a.trust), this.state.player.pos);
  }
  /** Something done in front of people that they hold against the player.
   * Whoever it belonged to minds most; the rest are startled by it. */
  private offend(o: {
    owner?: string;
    radius?: number;
    cost: (theirs: boolean) => number;
    memory: (theirs: boolean) => string;
    text: (witness: Actor, theirs: boolean) => string;
    /** Named when the owner should find out later if none of theirs saw. */
    lost?: { what: string; pos: Position };
  }) {
    let seen = false;
    for (const w of this.witnesses(o.radius)) {
      const theirs = this.minds(w, o.owner);
      seen ||= theirs;
      this.regard(w, -o.cost(theirs), theirs || !o.owner ? "anger" : "alarm");
      w.memories.push(o.memory(theirs));
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
  private actorAt(p: Position, excludeId: string) {
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
      this.rng("harvest") < this.skillLevel("farming") * PER_LEVEL.harvestExtra
        ? 1
        : 0;
    const taken = 1 + extra;
    p.inventory[crop.yields] = (p.inventory[crop.yields] ?? 0) + taken;
    const what = this.lootName(crop.yields, taken);
    const picking = crop.plant ?? crop.label;
    if (this.worksFor(field.owner)) {
      this.grantXp("farming", 8);
      this.event(`You take ${what} off the ${picking.toLowerCase()}.`);
      this.advance(20);
      return;
    }
    this.grantXp("farming", 3);
    this.event(`You take ${what} from a crop that is not yours.`);
    p.memories.push(`theft:crop-${x}-${y}:${crop.yields}`);
    // Judged before the clock moves: whoever is standing there now is who
    // saw it, not whoever has wandered past twenty seconds later.
    this.offend({
      owner: field.owner,
      cost: (theirs) => (theirs ? 4 : 2),
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
  private belongsTo(owner: string | undefined) {
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
    return space === "outside" && afloatAt(this.world, this.floater(this.deep(x, y)), x, y)
      ? false : this.blocked(x, y, space);
  }
  blocked(x: number, y: number, space = this.state.player.pos.space) {
    const key = `${space}:${x},${y}`;
    let fixed = this.terrainCollision.get(key);
    if (fixed === undefined) {
      fixed = this.world.blocked(x, y, space);
      trimCache(this.terrainCollision, 16384);
      this.terrainCollision.set(key, fixed);
    }
    return (
      fixed ||
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
    return [...boundaryGraph(field, x, y, x + 1, y + 1).values()].some(
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
        o.pos.x === x &&
        o.pos.y === y &&
        o.pos.space === space &&
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
  ): "broke" | "damaged" | "tipped" | undefined {
    const def = propDefs[prop.prop!];
    if (!def) return undefined;
    if (def.breakable && !prop.broken) {
      this.propOwnership(prop, "break");
      prop.damage = (prop.damage ?? 0) + 1;
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
  };
  /** Clock until which a fight is on. The runtime keeps the world ticking
   * through it instead of letting an idle player freeze the animals. */
  combatUntil = 0;
  /** What is in the hand, as something to throw. */
  missile() {
    const held = heldObject(this.state);
    return missileOf({
      prop: held?.prop,
      item: held ? undefined : this.state.player.heldItem,
      mass: propDefs[held?.prop ?? ""]?.shove?.mass,
    });
  }
  /** The cells a throw crosses, ending where it comes down: short of a wall,
   * or on the first animal in the way. The renderer aims with this too. */
  throwPath(dx: number, dy: number, reach?: number, run?: boolean) {
    const p = this.state.player.pos;
    const cells: Point[] = [];
    const most = Math.min(reach ?? (run ? 6 : 3), this.missile().range);
    for (let i = 1; i <= most; i++) {
      const x = p.x + dx * i,
        y = p.y + dy * i;
      // A thrown thing flies: a bank it could not wade across does not stop
      // it, though a wall still does.
      if (this.blocked(x, y, p.space)) break;
      cells.push({ x, y });
      if (p.space === "outside" && this.faunaAt(x, y)) break;
    }
    return cells;
  }
  /** Something within a swing's reach that a swing would do anything to. */
  swingFinds() {
    const p = this.state.player;
    return [0, 1, 3].some((turn) =>
      this.swingCone((p.direction + turn) % 4).some(
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
    const strength = statsOf(seed, this.state.player).strength;
    const crit = this.rng("combat-crit") < 0.1;
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
    // A fight breaking out turns heads, once, not on every blow.
    if (clock >= this.combatUntil)
      for (const w of this.witnesses(12)) this.cue(w.id, "alarm", from);
    this.combatUntil = clock + 90;
    // A blow breaks whatever it was in the middle of.
    if (g.attack?.n === m.n) {
      g.attack = { n: m.n!, phase: "recover", until: clock + 12 };
      m.pose = undefined;
    }
    this.strikeOwned(g, killed);
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
        );
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
  /** Experience for work done. The attribute behind a skill makes it come a
   * little easier or harder: 0.8 to 1.2 across the range. */
  grantXp(skill: SkillId, amount: number) {
    if (amount <= 0) return;
    const skills = this.skills();
    const aptitude =
      0.8 +
      statsOf(this.state.manifest.seed, this.state.player)[SKILLS[skill].stat] *
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
    return this.rng(`deft-${skill}`) <
      this.skillLevel(skill) * PER_LEVEL.deftBlow
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
    return gait * (1 - this.skillLevel("hunting") * PER_LEVEL.huntingQuiet);
  }
  private lastStep = { clock: -99, run: false };
  private lastJump = -99;
  /** Striking a kept animal is striking its keeper's property. Anyone who
   * sees it thinks less of you; the keeper most of all, and they say so. */
  private strikeOwned(g: FaunaGroup, killed: boolean) {
    if (!g.owner) return;
    const p = this.state.player;
    const memory = `${killed ? "killed" : "struck"}:${g.id}`;
    if (p.memories.includes(memory)) return;
    p.memories.push(memory);
    const label = faunaProfile(g.speciesId)?.label.toLowerCase() ?? "animal";
    const did = killed ? "kill" : "strike";
    this.offend({
      owner: g.owner,
      radius: 12,
      cost: (theirs) => (theirs ? 8 : 3) * (killed ? 2 : 1),
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
    p.health = Math.max(0, (p.health ?? 100) - damage);
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
    this.advance((rescuer ? 10 : 5) * 3600);
    p.activity = "Exploring";
    p.health = rescuer ? 35 : 20;
    p.hunger = Math.min(100, p.hunger + 15);
    p.injury = { name: part, until: this.state.clock + 3 * 86400 };
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
  };
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
        o.pos.x === x &&
        o.pos.y === y,
    );
  }
  private shoveWorld(): ShoveWorld {
    return {
      ground: (x, y, space) => this.world.blocked(x, y, space),
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
      statsOf(this.state.manifest.seed, p).strength,
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
        !this.world.blocked(x, y, space) &&
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
  private aimAt(direction: number) {
    const space = this.state.player.pos.space;
    const solid = (dir: number) =>
      this.swingCone(dir).some(
        (c) =>
          !["air", "grass", "soil", "sand", "snow"].includes(
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
  private cutGrowth(x: number, y: number): Species | undefined | false {
    const plant = this.world.decoration(x, y);
    const c = plantClass(plant?.sprite);
    if (plant && (c === "grass" || c === "shrub")) {
      const species = this.plantSpecies(plant.sprite, x, y);
      if (c === "grass") this.editAt(x, y).cut = true;
      else this.editAt(x, y).stage = "stems";
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
      if (edit?.dug) return "This ground is already turned.";
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
  /** Whether a cell in the swathe beyond the aimed one can take the stroke. */
  private workable(action: ToolAction, at: Point) {
    if (this.world.blocked(at.x, at.y, "outside")) return false;
    const plant = this.world.decoration(at.x, at.y);
    if (action === "dig") {
      if (this.state.tiles?.[tileKey(at.x, at.y)]?.dug) return false;
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
    const p = this.state.player;
    const edit = this.editAt(at.x, at.y);
    if (action === "dig") {
      const cells = this.swathe(action, at).filter(
        (q) => (q.x === at.x && q.y === at.y) || this.workable(action, q),
      );
      for (const q of cells) this.editAt(q.x, q.y).dug = true;
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
      const wood = edit.wood ?? 1;
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
    edit.chops = (edit.chops ?? 0) + 1 + this.deft("quarrying");
    this.advance(45);
    this.grantXp("quarrying", 5);
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
    this.grantXp("quarrying", 15);
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
      this.grantXp("quarrying", 4);
      this.event(
        "You clear the broken stone away and pocket what is worth keeping.",
      );
      return;
    }
    const needed = work === "grub" ? STUMP_BLOWS : ROCK_BLOWS;
    const skill = work === "grub" ? "woodcraft" : "quarrying";
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
    this.grantXp("quarrying", 15);
    this.tilesChanged();
    const ore = this.oreAt(at);
    if (ore) {
      take(ore.item, ore.yield);
      this.grantXp("quarrying", 10 * ore.yield);
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
      seconds * (1 - this.skillLevel("farming") * PER_LEVEL.farmingPace),
    );
  }
  private plantName(sprite: string | undefined, capital = false) {
    const name = plantName(sprite);
    return capital ? `The ${name}` : `the ${name}`;
  }
  climbable():
    | { id: string; label: string; rise: number; at: Point; to?: Point }
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
          !!propDefs[o.prop]?.solid,
      )
      .sort((a, b) => distance(p.pos, a.pos) - distance(p.pos, b.pos))[0];
    // object.name, not inspect(): inspect() asks this method for its climb
    // affordance, so reaching back into it recurses until the stack blows.
    if (object)
      return {
        id: object.id,
        label: object.name,
        rise: 12,
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
            at: q,
          };
      }
      // A blocked cell with nothing growing on it is masonry: a house wall or
      // a town wall. Either is a scramble to the top rather than a way through.
      for (const q of ring) {
        if (!this.world.blocked(q.x, q.y, "outside")) continue;
        if (this.world.decoration(q.x, q.y)?.solid) continue;
        const place = (this.world.places ?? []).find(
          (r) => q.x >= r.x && q.x < r.x + r.w && q.y >= r.y && q.y < r.y + r.h,
        );
        if (place) return { id: place.id, label: place.name, rise: 22, at: q };
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
    if (!this.world.blocked(q.x, q.y, "outside")) return undefined;
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
      const door = this.doorsByCell?.get(`${p.pos.x},${p.pos.y}`);
      if (!door?.open || !door.placeId) return;
      const place = this.world.place(door.placeId);
      if (!place) return;
      p.pos = { x: 6, y: 8, space: place.id };
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
  /** Whether a door opens for this caller right now. The rules are in
   * doors.ts; the engine only supplies who is inside and who is welcome. */
  doorVerdict(place: Place, actorId: string): DoorVerdict {
    const invited =
      place.access === "public"
        ? false
        : place.owner === actorId ||
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
      this.actorAt({ ...p, space: start.space }, actorId);
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
            this.world.blocked(to.x, to.y, start.space)
          )
            return Infinity;
          return 5;
        }
        if (
          actorId !== "player" &&
          (occupied ? occupied.has(`${to.x},${to.y}`) : cellOccupied(to))
        )
          return Infinity;
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
      if (!sown || !pickable(sown)) return;
      const mine = this.worksFor(field.owner);
      const picked = !!this.state.tiles?.[tileKey(pos.x, pos.y)]?.picked;
      const near = distance(this.state.player.pos, pos) <= 1.5;
      const what = (sown.plant ?? sown.label).toLowerCase();
      const enabled = near && field.stage === "ripe" && !picked;
      return {
        id,
        pos,
        name: sown.plant ?? sown.label,
        latin: sown.latin,
        kind: "vegetation",
        claim: field.owner && !mine ? "owned" : undefined,
        description: field.garden
          ? "Planted in a kitchen garden beside the houses."
          : "Growing in a worked field.",
        affordances: [
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
    if (!pos || !this.visible(pos)) return;
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
    if (this.state.player.perch?.on === id)
      interact("descend", "Climb down", true);
    if (actor) {
      if (actor.kind === "human") {
        interact("talk", "Talk");
        interact(
          "follow",
          "Ask to accompany",
          close && actor.trust >= 0,
          actor.trust < 0 ? "They decline your company" : "Walk closer",
        );
        const t = this.world.pack.trade;
        add(
          `Trade ${t.cost} ${this.items[t.give].name.toLowerCase()} for ${this.items[t.take].name.toLowerCase()}`,
          {
            type: "trade",
            target: id,
            give: t.give,
            giveQuantity: t.cost,
            take: t.take,
            takeQuantity: 1,
          },
          close && (this.state.player.inventory[t.give] ?? 0) >= t.cost,
          close ? "You do not have the offered goods" : undefined,
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
          ? briefText(brief)
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
        (id) => {
          const head = this.household(id)?.members[0];
          return head ? resident(head) : undefined;
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
      if (object.open) interact("close", "Close the door");
      else if (verdict === "open") interact("open", "Open the door");
      // A door that will not open can still be knocked on. Whether anything
      // answers is the knock's business, not the prompt's.
      else interact("knock", "Knock and wait");
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
      if (reason && request.command.type === "trade")
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
        this.execute(request.command);
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
    if (c.type === "interact" && c.action === "fill") return this.fillProblem(c.target);
    if (c.type === "interact" && c.action === "douse") return this.douseProblem(c.target);
    if (c.type === "interact" && c.action === "light")
      return this.lightProblem(c.target);
    if (c.type === "interact" && c.action === "burn")
      return this.burnProblem(c.target);
    if (c.type === "interact" && c.action === "climb") {
      if (p.perch) return `You are already up ${p.perch.label}.`;
      return this.climbable() ? undefined : "There is nothing here to climb.";
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
      const push = this.shovePlan(c.dx, c.dy);
      if (push && "refused" in push) return push.reason;
      if (
        (p.pos.space === "outside" &&
          this.world.canCross &&
          !this.playerCanCross(p.pos, {
            x: p.pos.x + c.dx,
            y: p.pos.y + c.dy,
          })) ||
        (!push &&
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
    if (distance(p.pos, target.pos) > 2.5) return "Move closer first.";
    if (c.type === "give") {
      const a = this.state.actors.find((a) => a.id === c.target);
      if (!a || a.kind !== "human") return "There is nobody there to take it.";
      if (p.heldItem !== c.item) return "You are not holding that.";
      // A gift is not a way around a grievance.
      if (a.trust < 0) return "They will not take anything from you yet.";
      return undefined;
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
          (1 + this.skillLevel("trade") * PER_LEVEL.tradeTerms) <
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
      if (!g.gateId) stale.add(faunaBlockOf(g.home.x, g.home.y));
      return !!g.gateId;
    });
    for (const key of stale) this.world.forgetFauna?.(key);
    const known = new Set(this.state.fauna.map((g) => g.id));
    for (const g of this.world.fauna(p.x, p.y))
      if (!known.has(g.id)) {
        known.add(g.id);
        this.state.fauna.push(copy(g));
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
    const near = groups.filter(
      (g) =>
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
    // A herd eaten down to nothing leaves no group behind.
    this.state.fauna = groups.filter((g) => g.members.length);
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
    if (c.type === "swing") {
      const held = heldObject(this.state);
      const def = propDefs[held?.prop ?? ""];
      const inHand = p.heldItem ? this.item(p.heldItem)?.hand : undefined;
      const tool = held
        ? toolClass(def.tool, def.strike)
        : toolClass(undefined, inHand?.strike, inHand?.edge);
      p.direction = this.aimAt(p.direction);
      const swung = held?.name ?? (p.heldItem ? this.item(p.heldItem)?.name : undefined) ?? "fists";
      for (const w of this.witnesses(3))
        if (Math.max(Math.abs(w.pos.x - p.pos.x), Math.abs(w.pos.y - p.pos.y)) <= 2) {
          this.nuisance.set(w.id, { what: `swung ${tool === "bare" ? "their" : "a"} ${swung.toLowerCase()} close to you`, at: this.state.clock });
          if (tool !== "bare") this.affront(w);
        }
      const power = c.power ?? 0;
      const weapon = weaponOf(held?.prop, held ? undefined : inHand);
      const cone = this.swingCone(p.direction, power, weapon.reach);
      const hits: Hit[] = [];
      const creatures: CreatureHit[] = [];
      const force = [1, 1.5, 2][power];
      const push = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ][p.direction];
      let told: string | undefined;
      for (const [i, at] of cone.entries()) {
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
            power ? { ...weapon, knock: weapon.knock + 1 } : weapon,
            out,
            (i === 0 || power || weapon.reach ? 1 : 0.6) * force,
          );
          if (struck) creatures.push(struck);
        }
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
        // wide arc never breaks three pots at once.
        // Bare hands still break pottery.
        if (
          i === 0 &&
          found.prop &&
          (tool !== "bare" || found.hit === "pottery")
        ) {
          const outcome = this.hurtProp(found.prop, found.hit);
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
                : outcome === "damaged"
                  ? `You strike ${name}. It is damaged but still holds together.`
                  : undefined;
        }
        hits.push(h);
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
          const species = this.cutGrowth(h.at.x, h.at.y);
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
      }
      this.lastSwing = {
        hits,
        tool,
        direction: p.direction,
        creatures,
        power,
        thrust: !!weapon.reach,
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
    if (c.type === "throw") {
      const item = heldObject(this.state) ? undefined : p.heldItem;
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
      const missile = this.missile();
      const path = this.throwPath(c.dx, c.dy, c.reach, c.run);
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
            damage: missile.damage * (c.run ? 1.3 : 1),
            knock: 1,
            stun: missile.stun,
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
        (item || (def?.shove?.mass ?? 1) <= 1) &&
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
      if (struck)
        this.state.fauna = this.state.fauna?.filter((g) => g.members.length);
      // A pot that bursts gives up what it held, as one broken by a swing does.
      const loot = bursts ? this.spill(prop) : [];
      this.lastThrow = {
        creature: struck,
        id: prop.id,
        small: !!item,
        bounce,
        straight: !!prop.prop && (weaponOf(prop.prop).thrown ?? 0) > 1,
        from: { x: p.pos.x, y: p.pos.y },
        to: { x: landed.x, y: landed.y },
        sprite,
        hit: {
          at: { x: landed.x, y: landed.y },
          hit: landing?.hit ?? ground.hit,
          kind,
          solid: isSolid(kind),
          damaged: bursts || landing?.kind === "crush",
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
        this.advance(leap.seconds);
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
      if (occupant) {
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
      const depth =
        p.pos.space === "outside" && this.world.topography
          ? waterDepthAt(this.world.topography, p.pos.x + 0.5, p.pos.y + 0.5)
          : 0;
      if (p.pos.space === "outside") this.swimStep(depth);
      p.activity = p.afloat ? p.afloat === "swimming" ? "Swimming" : "Paddling" : depth > 0 ? "Wading" : "Exploring";
      this.lastStep = { clock: this.state.clock, run: !!c.run };
      if (p.pos.space === "outside")
        this.grantXp(
          depth > 0 ? "watercraft" : "wayfaring",
          depth > 0 ? 0.6 : 0.15,
        );
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
      this.advance(
        Math.ceil(
          (c.run && !depth ? (c.dx && c.dy ? 2 : 1) : c.dx && c.dy ? 3 : 2) *
            (1 +
              ((p.afloat ? p.afloat === "swimming" ? 2.5 : 1.4 : wadingCost(depth)) - 1) *
                (1 - this.skillLevel("watercraft") * PER_LEVEL.watercraftPace)),
        ) +
          (slope > 1 ? 1 : 0) +
          effort,
      );
      const key = `${Math.floor(p.pos.x / 64)},${Math.floor(p.pos.y / 64)}`;
      if (!this.state.visited.includes(key)) this.state.visited.push(key);
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
      if (def.health)
        p.health = Math.min(100, Math.max(0, (p.health ?? 100) + def.health));
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
      this.regard(a, 1);
      a.memories.push(`You gave them ${def.name.toLowerCase()}.`);
      this.advance(20, a.id);
      this.event(
        `You hand ${def.name.toLowerCase()} to ${a.name}. They take it.`,
        "social",
      );
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
          prop.carriedBy = "player";
          p.held = prop.id;
          prop.pos = copy(p.pos);
          this.propOwnership(prop, "pick up");
          this.event(
            `You pick up ${prop.name.toLowerCase()}. ${def.strike ? "F swings it." : "F throws it; E puts it down."}`,
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
          this.event(`You stand ${prop.name.toLowerCase()} back up.`);
        } else if (c.action === "topple") {
          // Knocked over, not broken: it empties where it lies.
          this.propOwnership(prop, "break");
          prop.tipped = true;
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
    if (c.type === "trade" && a) {
      if (this.state.goalFlags) this.state.goalFlags.traded = true;
      // Reserve both participants for this short exchange; commit both transfers together.
      p.inventory[c.give] = (p.inventory[c.give] ?? 0) - c.giveQuantity;
      a.inventory[c.give] = (a.inventory[c.give] ?? 0) + c.giveQuantity;
      a.inventory[c.take] = (a.inventory[c.take] ?? 0) - c.takeQuantity;
      p.inventory[c.take] = (p.inventory[c.take] ?? 0) + c.takeQuantity;
      this.advance(60, a.id);
      this.regard(a, 1);
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
    switch (c.action) {
      case "talk":
        if (a) {
          if (this.state.goalFlags) this.state.goalFlags.talked = true;
          this.advance(90, a.id);
          // People talking look at each other.
          p.direction = this.directionTo(p.pos, a.pos);
          a.direction = this.directionTo(a.pos, p.pos);
          delete p.facing;
          delete a.facing;
          if (a.trust >= 0)
            this.regard(
              a,
              this.rng("speech") <
                this.skillLevel("speech") * PER_LEVEL.speechWarmth
                ? 2
                : 1,
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
          this.advance(10);
          p.pos = { x: 6, y: 8, space: b.id };
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
        p.fatigue = Math.max(0, p.fatigue - 2);
        this.advance(30);
        this.event("You drink cool water and refill your vessel.");
        break;
      case "sleep":
        this.sleep(this.untilMorning());
        break;
      case "rest":
        p.activity = "Resting";
        this.advance(1200);
        p.fatigue = Math.max(0, p.fatigue - 35);
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
          this.advance(180);
          if (o.resource || o.kind === "tree") {
            if (
              o.resource &&
              this.rng("forage") <
                this.skillLevel("foraging") * PER_LEVEL.foragingExtra
            )
              p.inventory[o.resource.item] =
                (p.inventory[o.resource.item] ?? 0) + 1;
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
          if (o.owner) {
            p.memories.push(`theft:${o.id}:${JSON.stringify(taken)}`);
            this.offend({
              owner: o.owner,
              lost: { what: `${o.name.toLowerCase()} emptied`, pos: o.pos },
              cost: () => 3,
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
  blockComplaint?: { id: string; at: number };
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
    if (now - (this.bumpedAt.get(a.id) ?? -Infinity) < BUMP_GAP) return;
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
    if (by === "player")
      this.nuisance.set(a.id, { what: run ? "ran full into you" : "bumped into you", at: now });
    if (!run) {
      this.cue(a.id, "alarm", p.pos);
      this.event(`You collide with ${a.name}, who starts.`, "social");
      return;
    }
    this.affront(a);
    this.event(`You run full into ${a.name}, who rounds on you.`, "social");
  }
  /** Someone who has had enough of the player goes elsewhere for an hour. */
  walkOff(a: Actor, where: WalkOff) {
    const clock = this.state.clock;
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
      }
    } else if (where === "authority") {
      const hall = this.world.places.find((p) => AUTHORITY.test(p.name));
      if (hall) {
        to = { ...doorApproach(hall), space: "outside" };
        label = `Going to complain at the ${hall.name.replace(/^the /i, "").toLowerCase()}`;
      }
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
    if (at.activity === "rest" && household?.residence && !this.burningPlace(household.residence)) {
      const index = Math.max(0, household.members.indexOf(a.id));
      this.moveActor(a, {
        x: 3 + (index % 4),
        y: 3,
        space: household.residence,
      });
      a.activity = at.label;
      a.fatigue = Math.max(0, a.fatigue - 0.1);
      // Eating at home is what keeps a resident under the hunger gate below and
      // so on their routine at all. Without it the whole settlement drifts onto
      // the pathfinding fallback over a long session.
      // High enough that one meal covers the night's ~16 points of hunger:
      // followRoutine runs every 12 seconds, and a lower gate empties the
      // household store in a few days.
      if (a.hunger > 35) this.feed(a, household);
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
  /** Keeps a dormant resident indoors at their household, or at their door
   * when the house has no interior. */
  private park(a: Actor) {
    const household = this.household(a.householdId);
    a.offRoutine = true;
    a.activity = "At home";
    a.hunger = Math.min(a.hunger, 30);
    a.fatigue = Math.max(0, a.fatigue - 0.1);
    if (household?.residence && !this.burningPlace(household.residence)) {
      const index = Math.max(0, household.members.indexOf(a.id));
      this.moveActor(a, {
        x: 3 + (index % 4),
        y: 3,
        space: household.residence,
      });
    } else if (a.pos.space === "outside" && distance(a.pos, a.home) > 0) {
      this.moveActor(a, copy(a.home));
    }
  }
  /** Seconds from now until the next morning, for a night's sleep. */
  untilMorning(hour = 6) {
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
    const started = this.state.clock;
    const { bed, own, indoors, covered } = this.shelter();
    const setting = this.world.pack.setting;
    const seed = this.state.manifest.seed;
    const before = p.activity;
    const day = this.state.today;
    p.activity = "Sleeping";
    this.advance(seconds);
    p.activity = before === "Sleeping" ? "Exploring" : before;

    const hours = seconds / 3600;
    // A bed of your own is worth roughly twice the bare ground.
    const quality = own ? 1 : bed ? 0.85 : indoors ? 0.7 : 0.45;
    p.fatigue = Math.max(0, p.fatigue - hours * 14 * quality);

    // The same fallbacks the scene shows, so a night in the visible rain is a
    // night in the rain.
    const weather = weatherAt(
      seed,
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
    if (covered && hours >= 5)
      p.health = Math.min(100, (p.health ?? 100) + (own ? 6 : 4));

    if (rough && (cold || wet)) {
      const harm = Math.round(4 + (cold ? 4 : 0) + (wet ? 3 : 0));
      p.health = Math.max(0, Math.min(100, (p.health ?? 100) - harm));
      this.event(
        `You wake stiff and ${cold ? "cold" : "soaked"} from ${
          overnight ? "a night in the open" : "lying out unsheltered"
        }.`,
      );
      if (roll("illness") < 0.18) {
        p.health = Math.max(0, (p.health ?? 100) - 12);
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
    if (hours >= 5 && woke >= 4 && woke < 12) this.evening(day);
  }

  advance(seconds: number, heldActor?: string) {
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
      for (let dy = -sy; dy <= sy; dy++)
        for (let dx = -sx; dx <= sx; dx++) {
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
      player.hunger = Math.min(100, player.hunger + elapsed / 1800);
      player.fatigue = Math.min(
        100,
        player.fatigue +
          elapsed /
            (player.activity === "Resting" || player.activity === "Sleeping"
              ? 100000
              : (2400 / (player.injury ? 1.5 : 1)) *
                (1 +
                  levelOf(player.skills?.wayfaring) *
                    PER_LEVEL.wayfaringStamina)),
      );
      if (next % 6 !== 0) continue;
      this.burnStep();
      if (player.torchOut !== undefined && next >= player.torchOut) this.torchBurnsOut();
      if (next % 3600 === 0) {
        this.world.rotateRoutines?.(next);
        this.runEconomy();
      }
      if (this.world.pack.setting?.environment) {
        const season = seasonAt(this.world.pack.setting.season, next);
        for (const o of this.resourceObjects) refreshResource(o, next, season);
      }
      for (const a of actors) {
        if (a.id === heldActor) continue;
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
              : (this.household(a.householdId)?.home ?? a.pos),
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
        if (a.kind === "human" && next % 60 === 0) this.discover(a);
        if (a.kind === "human" && a.tends) {
          if (next % 12 === 0) this.tendHerd(a, next);
          continue;
        }
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
