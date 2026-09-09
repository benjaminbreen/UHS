import { trimCache } from "./cache";
import {
  depositSupplies,
  harvestResource,
  householdActivity,
  refreshResource,
  seasonAt,
  grazeActivity,
} from "./livelihood";
import { propDefs } from "../content/props/catalog";
import { propAffordances, heldObject } from "./props";
import {
  distance,
  SIGHT,
  type Actor,
  type Affordance,
  type CommandRequest,
  type CommandResult,
  type GameEvent,
  type Household,
  type Inspection,
  type Inventory,
  type ItemDef,
  type ItemId,
  type Observation,
  type PlayerCommand,
  type Position,
  type Snapshot,
  type WorldModel,
} from "./types";
import { canonical, random, stateHash } from "./random";
import { findPath } from "./pathfinding";
import { itineraryAt, type Itinerary } from "./itinerary";
import { route, type RouteResult } from "./routing";
import type { Point } from "./types";
const copy = <T>(x: T): T => structuredClone(x);
/** Routines built in one call to `advance`. */
const ROUTINE_BUILDS_PER_ADVANCE = 32;
export class Engine {
  state: Snapshot;
  constructor(
    readonly world: WorldModel,
    readonly items: Record<ItemId, ItemDef>,
    snapshot?: Snapshot,
  ) {
    this.state = snapshot
      ? copy(snapshot)
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
            activity: "Exploring",
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
      "You arrive as the morning’s work begins. Walk, meet someone, or find your own way.",
      "system",
    );
  }
  hash() {
    const { receipts, log, notes, ...physical } = this.state;
    return stateHash(physical);
  }
  snapshot() {
    return copy(this.state);
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
    for (const witness of this.state.actors.filter(
      (a) =>
        a.kind === "human" &&
        distance(a.pos, p.pos) < 7 &&
        this.visibleFrom(a.pos, p.pos),
    )) {
      witness.trust -= 3;
      witness.memories.push(`Saw player ${action} ${o.id}`);
      this.event(
        `${witness.name} saw you ${action} household property.`,
        "social",
      );
    }
  }
  private rng(purpose: string) {
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
  private terrainCollision = new Map<string, boolean>();
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
          ((o.kind === "gate" && !o.open) ||
            (!!o.prop &&
              !!propDefs[o.prop]?.solid &&
              !o.carriedBy &&
              !o.broken)) &&
          o.pos.space === space &&
          o.pos.x === x &&
          o.pos.y === y,
      )
    );
  }
  gateAt(p: Point, space = this.state.player.pos.space) {
    return this.state.objects.find(
      (o) =>
        o.kind === "gate" &&
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
      this.state.actors.some((a) => a.id === actorId && a.kind === "human");
    const occupied = new Set<string>();
    if (actorId !== "player")
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
          !this.world.canCross(from, to)
        )
          return Infinity;
        if (this.blocked(to.x, to.y, start.space)) {
          const gate = this.gateAt(to, start.space);
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
        if (actorId !== "player" && occupied.has(`${to.x},${to.y}`))
          return Infinity;
        return start.space === "outside"
          ? (this.world.navigationCost?.(to.x, to.y, actorId) ?? 1)
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
  private visibleFrom(p: Position, pos: Position) {
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
      blockers = this.world.places.filter(
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
    return copy({
      revision: s.revision,
      clock: s.clock,
      player: s.player,
      actors: s.actors
        .filter((a) => this.visible(a.pos))
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
        .filter((o) => this.visible(o.pos))
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
        this.visible({ ...p.entrance, space: "outside" }),
      ),
      events: s.events.slice(-12),
      manifest: s.manifest,
    });
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
      const name = plant.sprite
        .replace(/^(nature-understory|nature|ecology)-/, "")
        .replaceAll("-", " ")
        .replace(/^./, (c) => c.toUpperCase());
      return {
        id,
        pos,
        name,
        sprite: plant.sprite,
        kind: "vegetation",
        description: plant.solid
          ? "A tree growing in the surrounding landscape."
          : "Low vegetation growing in the surrounding landscape.",
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
      return {
        id,
        name: actor.name,
        description:
          actor.kind === "human"
            ? `${actor.role}${actor.age !== undefined ? `, age ${actor.age}` : ""}. ${actor.activity}. ${(actor.relations ?? []).map((r) => `${r.kind}: ${[this.state.player, ...this.state.actors].find((a) => a.id === r.other)?.name ?? r.other}`).join("; ")}. ${actor.trust < 0 ? "They seem wary of you." : "They notice your approach."}`
            : `${actor.activity}. ${actor.owner ? "Part of a household’s flock." : "Moving through the landscape."}`,
        kind: actor.kind,
        pos,
        affordances,
      };
    }
    if (place) {
      const allowed =
        place.access === "public" ||
        (this.state.manifest.simulation === 2 &&
          place.owner === this.state.player.id) ||
        this.state.households?.some(
          (h) =>
            h.members.includes("player") && h.members.includes(place.owner),
        ) ||
        (this.state.permissions[place.owner] ?? 0) > this.state.clock;
      interact(
        "enter",
        place.entranceLabel,
        close && allowed,
        allowed ? "Walk to the entrance" : "Speak with the household first",
      );
      return {
        id,
        name: place.name,
        description:
          place.description +
          (place.access === "household" ? " This is a household space." : ""),
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
            : def?.strike
              ? "A stout branch. Hold it to strike breakable containers."
              : def?.drink
                ? "A water source."
                : def?.container
                  ? object.open
                    ? "The contents are visible."
                    : "Look inside to discover the contents."
                  : "A household work object.",
          object.carriedBy ? "You are holding it." : "",
          object.owner && object.owner !== "player"
            ? "Household property; carrying it does not change ownership."
            : "",
        ]
          .filter(Boolean)
          .join(" "),
        affordances: [
          ...propAffordances(this.state, object, close),
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

    if (object.kind === "gate")
      interact(
        object.open ? "close" : "open",
        object.open ? "Close gate" : "Open gate",
      );
    if (object.kind === "well") interact("drink", "Drink and refill water");
    if (object.kind === "fire" || object.kind === "bed")
      interact("rest", "Rest for 20 minutes");
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
        : object.kind === "tree"
          ? object.depleted
            ? "The fallen wood has been gathered. The tree remains."
            : "A little shade. Dry branches lie beneath the canopy."
          : object.depleted
            ? "The container or plot has been emptied."
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
    return result;
  }
  private validate(c: PlayerCommand): string | undefined {
    const p = this.state.player;
    if (c.type === "move") {
      if (
        !Number.isInteger(c.dx) ||
        !Number.isInteger(c.dy) ||
        Math.max(Math.abs(c.dx), Math.abs(c.dy)) !== 1
      )
        return "Move one adjacent step.";
      if (
        (p.pos.space === "outside" &&
          this.world.canCross &&
          !this.world.canCross(p.pos, {
            x: p.pos.x + c.dx,
            y: p.pos.y + c.dy,
          })) ||
        this.blocked(p.pos.x + c.dx, p.pos.y + c.dy) ||
        (c.dx !== 0 &&
          c.dy !== 0 &&
          (this.blocked(p.pos.x + c.dx, p.pos.y) ||
            this.blocked(p.pos.x, p.pos.y + c.dy)))
      )
        return "The way is blocked.";
      const occupant = this.state.actors.find(
        (a) =>
          a.pos.space === p.pos.space &&
          a.pos.x === p.pos.x + c.dx &&
          a.pos.y === p.pos.y + c.dy,
      );
      if (occupant) return `${occupant.name} is standing there.`;
      return;
    }
    if (c.type === "wait" || c.type === "pass")
      return Number.isInteger(c.seconds) && c.seconds > 0 && c.seconds <= 3600
        ? undefined
        : "Wait between 1 and 3,600 seconds.";
    if (c.type === "use")
      return this.items[c.item]?.edible && (p.inventory[c.item] ?? 0) > 0
        ? undefined
        : "You cannot eat that item.";
    if (c.type === "interact" && c.action === "drop" && !this.dropSpot())
      return "There is no clear adjacent place to put it down.";
    const target = this.inspect(c.target);
    if (!target) return "That target is not visible.";
    if (distance(p.pos, target.pos) > 2.5) return "Move closer first.";
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
      if (
        !this.items[c.give] ||
        !this.items[c.take] ||
        (p.inventory[c.give] ?? 0) < c.giveQuantity ||
        (a.inventory[c.take] ?? 0) < c.takeQuantity
      )
        return "One side does not have the offered goods.";
      if (
        this.items[c.give].value * c.giveQuantity <
        this.items[c.take].value * c.takeQuantity
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
  private populateNearby() {
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
  }
  private execute(c: PlayerCommand) {
    const p = this.state.player;
    if (c.type === "move") {
      p.pos.x += c.dx;
      p.pos.y += c.dy;
      p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
      p.activity = "Exploring";
      this.populateNearby();
      const slope =
        p.pos.space === "outside" && this.world.elevation
          ? Math.abs(
              this.world.elevation(p.pos.x, p.pos.y) -
                this.world.elevation(p.pos.x - c.dx, p.pos.y - c.dy),
            )
          : 0;
      this.advance((c.dx && c.dy ? 3 : 2) + (slope > 1 ? 1 : 0));
      const key = `${Math.floor(p.pos.x / 64)},${Math.floor(p.pos.y / 64)}`;
      if (!this.state.visited.includes(key)) this.state.visited.push(key);
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
    if (c.type === "use") {
      p.inventory[c.item] = (p.inventory[c.item] ?? 0) - 1;
      p.hunger = Math.max(0, p.hunger - (this.items[c.item].edible ?? 0));
      this.advance(60);
      this.event(`You eat some ${this.items[c.item].name.toLowerCase()}.`);
      return;
    }
    if (c.type === "interact") {
      const prop = this.state.objects.find((o) => o.id === c.target && o.prop);
      if (prop && ["pickup", "drop", "strike", "look"].includes(c.action)) {
        const def = propDefs[prop.prop!];
        if (c.action === "pickup") {
          prop.carriedBy = "player";
          p.held = prop.id;
          prop.pos = copy(p.pos);
          this.propOwnership(prop, "pick up");
          this.event(
            `You pick up ${prop.name.toLowerCase()}. ${def.strike ? "Space strikes a nearby breakable object." : "Press E to look inside; G puts it down."}`,
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
        } else if (c.action === "strike") {
          this.propOwnership(prop, "break");
          prop.damage = (prop.damage ?? 0) + 1;
          const resistance =
            def.breakable === "wood" ? 3 : def.breakable === "fiber" ? 2 : 1;
          if (prop.damage >= resistance) {
            prop.broken = true;
            prop.open = true;
            prop.depleted = false;
            prop.sprite = `prop-broken-${def.breakable}`;
            this.event(
              `You break ${prop.name.toLowerCase()}. Its contents spill onto the ground.`,
            );
          } else
            this.event(
              `You strike ${prop.name.toLowerCase()}. It is damaged but still holds together.`,
            );
        }
        this.advance(c.action === "strike" ? 4 : 2);
        return;
      }
    }
    const a = this.state.actors.find((a) => a.id === c.target),
      o = this.state.objects.find((o) => o.id === c.target),
      b = this.world.place(c.target);
    if (c.type === "trade" && a) {
      // Reserve both participants for this short exchange; commit both transfers together.
      p.inventory[c.give] = (p.inventory[c.give] ?? 0) - c.giveQuantity;
      a.inventory[c.give] = (a.inventory[c.give] ?? 0) + c.giveQuantity;
      a.inventory[c.take] = (a.inventory[c.take] ?? 0) - c.takeQuantity;
      p.inventory[c.take] = (p.inventory[c.take] ?? 0) + c.takeQuantity;
      this.advance(60, a.id);
      a.trust++;
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
          this.advance(90, a.id);
          if (a.trust >= 0) a.trust++;
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
          p.pos = { ...home.entrance, space: "outside" };
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
          this.event(`You ${c.action} the gate.`);
        }
        break;
      case "drink":
        p.inventory.water = Math.max(p.inventory.water ?? 0, 2);
        p.fatigue = Math.max(0, p.fatigue - 2);
        this.advance(30);
        this.event("You drink cool water and refill your vessel.");
        break;
      case "rest":
        p.activity = "Resting";
        this.advance(1200);
        p.fatigue = Math.max(0, p.fatigue - 35);
        p.activity = "Exploring";
        this.event("You rest beside the household’s work. Your fatigue eases.");
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
      case "harvest":
        if (o) {
          if (!harvestResource(p, o, this.state.clock)) break;
          this.advance(180);
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
            for (const witness of this.state.actors.filter(
              (a) =>
                a.kind === "human" &&
                distance(a.pos, p.pos) < 7 &&
                this.visibleFrom(a.pos, p.pos),
            )) {
              witness.trust -= 3;
              witness.memories.push(`Saw player take ${o.id}`);
              this.event(
                `${witness.name} saw you take property belonging to the household.`,
                "social",
              );
            }
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
              const n = Math.min(v, p.inventory[item] ?? 0);
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
              a.trust = Math.max(0, a.trust + 2);
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
      to[id] = (to[id] ?? 0) + n;
      from[id] = 0;
    }
  }
  private stepToward(a: Actor, target: Position) {
    if (a.pos.space !== target.space) return;
    if (this.state.manifest.simulation === 2) {
      if (a.pos.x === target.x && a.pos.y === target.y) return;
      if (
        (a.householdId &&
          this.blocked(target.x, target.y, target.space) &&
          !this.gateAt(target, target.space)) ||
        this.state.actors.some(
          (other) => other.id !== a.id && distance(other.pos, target) < 1,
        )
      ) {
        const alternative = [
          [0, 1],
          [1, 0],
          [0, -1],
          [-1, 0],
        ]
          .map(([x, y]) => ({ ...target, x: target.x + x, y: target.y + y }))
          .find(
            (p) =>
              !this.blocked(p.x, p.y, p.space) &&
              !this.state.actors.some(
                (other) => other.id !== a.id && distance(other.pos, p) < 1,
              ),
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
          !this.gateAt(cached.path[0], a.pos.space))
      ) {
        cached = {
          target: key,
          path: this.findRoute(a.pos, target, a.id, 5000).path,
        };
        this.routes.set(a.id, cached);
      }
      const step = cached.path[0];
      if (!step) return;
      const gate = this.gateAt(step, a.pos.space);
      if (gate && a.kind === "human" && (!gate.owner || gate.owner === a.id)) {
        gate.open = true;
        return;
      }
      if (this.blocked(step.x, step.y, a.pos.space)) {
        this.routes.delete(a.id);
        return;
      }
      if (
        this.state.actors.some(
          (other) =>
            other.id !== a.id &&
            other.pos.space === a.pos.space &&
            other.pos.x === step.x &&
            other.pos.y === step.y,
        )
      ) {
        this.routes.delete(a.id);
        return;
      }
      cached.path.shift();
      a.direction =
        step.y < a.pos.y ? 0 : step.x > a.pos.x ? 1 : step.y > a.pos.y ? 2 : 3;
      a.pos = { ...step, space: a.pos.space };
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
      if ((x || y) && !this.blocked(a.pos.x + x, a.pos.y + y, a.pos.space)) {
        a.pos.x += x;
        a.pos.y += y;
        a.direction = y < 0 ? 0 : x > 0 ? 1 : y > 0 ? 2 : 3;
        return;
      }
    }
    const step = findPath(
      a.pos,
      target,
      (x, y) => this.blocked(x, y, a.pos.space),
      800,
    )[0];
    if (step) {
      a.pos.x = step.x;
      a.pos.y = step.y;
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
    const store = household
      ? this.state.objects.find((o) => o.id === household.storeId)
      : undefined;
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
    const household = this.state.households?.find(
      (h) => h.id === a.householdId,
    );
    a.offRoutine = false;
    const gateId = this.world.activitySites?.(a.id)?.gateId;
    if (gateId) {
      const gate = this.state.objects.find((o) => o.id === gateId);
      if (gate) gate.open = at.activity !== "rest";
    }
    if (at.activity === "rest" && household?.residence) {
      const index = Math.max(0, household.members.indexOf(a.id));
      a.pos = { x: 3 + (index % 4), y: 3, space: household.residence };
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
    a.pos = {
      x: Math.round(at.x),
      y: Math.round(at.y),
      space: "outside",
    };
    a.direction = at.direction;
    a.activity = at.label;
  }
  private advance(seconds: number, heldActor?: string) {
    // Derived paths never survive a command boundary: saves and replays need no hidden routing state.
    this.routes.clear();
    this.tickObstacles = new Map();
    for (const o of this.state.objects) {
      if (o.kind !== "gate" && !o.prop) continue;
      const key = `${o.pos.space}:${o.pos.x},${o.pos.y}`;
      const at = this.tickObstacles.get(key) ?? [];
      at.push(o);
      this.tickObstacles.set(key, at);
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
          elapsed / (player.activity === "Resting" ? 100000 : 2400),
      );
      if (next % 6 !== 0) continue;
      if (this.world.pack.setting?.environment) {
        const season = seasonAt(this.world.pack.setting.season, next);
        for (const o of this.state.objects) refreshResource(o, next, season);
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
              : (this.state.households?.find((h) => h.id === a.householdId)
                  ?.home ?? a.pos),
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
            a.pos = copy(target);
        }
        if (a.kind === "human") {
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
          if (
            !penDuty &&
            householdActivity(
              a,
              this.state,
              this.items,
              (target) => this.stepToward(a, target),
              (target) =>
                this.findRoute(a.pos, target, a.id, 1500).status === "found",
            )
          )
            continue;
          if (a.hunger > 55) {
            a.activity = "Finding something to eat";
            this.stepToward(a, a.home);
            if (
              distance(a.pos, a.home) < 2 &&
              this.feed(
                a,
                this.state.households?.find((h) => h.id === a.householdId),
              )
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
              const gate = this.state.objects.find(
                (o) => o.id === sites.gateId,
              );
              if (gate && distance(a.pos, gate.pos) < 2.5) {
                if (!resting && !social) gate.open = true;
                const animals = this.state.actors.filter(
                  (b) => b.owner === a.id && b.kind !== "human",
                );
                if (
                  resting &&
                  animals.every((b) => distance(b.pos, b.home) < 2)
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
              distance(a.pos, a.work) > 2
                ? "Walking to work"
                : `${a.role} at work`;
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
          const gate = this.state.objects.find((o) => o.id === sites.gateId);
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
    }
    this.tickObstacles = undefined;
  }
}
