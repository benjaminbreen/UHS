import {
  distance,
  SIGHT,
  type Actor,
  type Affordance,
  type CommandRequest,
  type CommandResult,
  type GameEvent,
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
const copy = <T>(x: T): T => structuredClone(x);
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
            schema: 1,
            simulation: 1,
            generator: 1,
            content: 1,
            atlas: 1,
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
  blocked(x: number, y: number, space = this.state.player.pos.space) {
    return (
      this.world.blocked(x, y, space) ||
      this.state.objects.some(
        (o) =>
          o.kind === "gate" &&
          !o.open &&
          o.pos.space === space &&
          o.pos.x === x &&
          o.pos.y === y,
      )
    );
  }
  visible(pos: Position) {
    return this.visibleFrom(this.state.player.pos, pos);
  }
  private visibleFrom(p: Position, pos: Position) {
    if (distance(p, pos) > SIGHT) return false;
    const steps = Math.max(Math.abs(p.x - pos.x), Math.abs(p.y - pos.y));
    for (let i = 1; i < steps; i++) {
      const x = Math.round(p.x + ((pos.x - p.x) * i) / steps),
        y = Math.round(p.y + ((pos.y - p.y) * i) / steps);
      if (
        this.world.places.some(
          (b) =>
            p.space === "outside" &&
            x >= b.x &&
            x < b.x + b.w &&
            y >= b.y &&
            y < b.y + b.h,
        )
      )
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
          activity: a.activity,
          direction: a.direction,
        })),
      objects: s.objects
        .filter((o) => this.visible(o.pos))
        .map((o) => ({
          ...o,
          inventory: o.owner && o.owner !== "player" ? {} : o.inventory,
        })),
      places: this.world.places.filter((p) =>
        this.visible({ ...p.entrance, space: "outside" }),
      ),
      events: s.events.slice(-12),
      manifest: s.manifest,
    });
  }
  inspect(id: string): Inspection | undefined {
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
            ? `${actor.role}. ${actor.activity}. ${actor.trust < 0 ? "They seem wary of you." : "They notice your approach."}`
            : `${actor.activity}. ${actor.owner ? "Part of a household’s flock." : "Moving through the landscape."}`,
        kind: actor.kind,
        pos,
        affordances,
      };
    }
    if (place) {
      const allowed =
        place.access === "public" ||
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
        "Gather fallen branches",
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
      description:
        object.kind === "tree"
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
        Math.abs(c.dx) + Math.abs(c.dy) !== 1
      )
        return "Move one cardinal step.";
      if (this.blocked(p.pos.x + c.dx, p.pos.y + c.dy))
        return "The way is blocked.";
      return;
    }
    if (c.type === "wait")
      return Number.isInteger(c.seconds) && c.seconds > 0 && c.seconds <= 3600
        ? undefined
        : "Wait between 1 and 3,600 seconds.";
    if (c.type === "use")
      return this.items[c.item]?.edible && (p.inventory[c.item] ?? 0) > 0
        ? undefined
        : "You cannot eat that item.";
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
  private execute(c: PlayerCommand) {
    const p = this.state.player;
    if (c.type === "move") {
      p.pos.x += c.dx;
      p.pos.y += c.dy;
      p.direction = c.dy < 0 ? 0 : c.dx > 0 ? 1 : c.dy > 0 ? 2 : 3;
      p.activity = "Exploring";
      this.advance(2);
      const key = `${Math.floor(p.pos.x / 64)},${Math.floor(p.pos.y / 64)}`;
      if (!this.state.visited.includes(key)) this.state.visited.push(key);
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
        p.inventory.water = 2;
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
      case "harvest":
        if (o) {
          this.transfer(o.inventory, p.inventory);
          o.depleted = true;
          this.advance(180);
          this.event(
            o.kind === "tree"
              ? "You gather fallen branches for firewood. The tree remains standing."
              : "You gather ripe grain. The harvested plot remains bare.",
          );
        }
        break;
      case "take":
        if (o) {
          const taken = copy(o.inventory);
          this.transfer(o.inventory, p.inventory);
          o.depleted = true;
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
            o.depleted = Object.values(o.inventory).every((v) => !v);
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
  private advance(seconds: number, heldActor?: string) {
    const end = this.state.clock + seconds;
    const player = this.state.player;
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
      for (const a of [...this.state.actors].sort((a, b) =>
        a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
      )) {
        if (a.id === heldActor) continue;
        if (distance(a.pos, player.pos) > 80) continue; // Same active radius in browser and Node.
        const gap = next - (a.lastUpdated ?? next - 6);
        a.lastUpdated = next;
        a.hunger = Math.min(100, a.hunger + gap / 1800);
        // Catch up returning distant residents before either endpoint becomes visible.
        if (gap > 600 && a.kind === "human") {
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
          if (next % 18 !== 0) continue;
          const hour = (next / 3600) % 24;
          if (a.hunger > 55) {
            a.activity = "Finding something to eat";
            this.stepToward(a, a.home);
            if (distance(a.pos, a.home) < 2) {
              const food = (Object.keys(a.inventory) as ItemId[]).find(
                (k) => this.items[k].edible && (a.inventory[k] ?? 0) > 0,
              );
              if (food) {
                a.inventory[food] = (a.inventory[food] ?? 0) - 1;
                a.hunger = Math.max(
                  0,
                  a.hunger - (this.items[food].edible ?? 0),
                );
                a.activity = "Eating at home";
              }
            }
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
  }
}
