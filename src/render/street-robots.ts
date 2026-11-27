import type Phaser from "phaser";
import { robotFrames, LIVERIES, type RobotKind } from "./robot-art";
import { requirementMet } from "../content/characters/requirements";
import { kerbsideFor } from "../content/settlements/streets/kerbside";
import { modernity } from "../content/settlements/modernity";
import type { WorldSetting } from "../content/geography/types";
import type { Lane } from "../world/v3/types";
import type { Point } from "../core/types";

/** Cells a second, and seconds a stride of four frames takes. */
const PACE: Record<RobotKind, { speed: number; stride: number }> = {
  humanoid: { speed: 1.1, stride: 0.72 },
  courier: { speed: 0.9, stride: 0.5 },
  sweeper: { speed: 0.5, stride: 0.6 },
  dog: { speed: 1.7, stride: 0.44 },
};
const WAYS = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;
const key = (x: number, y: number) => `${x},${y}`;

type Bot = {
  id: number; kind: RobotKind; livery: number; carry: boolean;
  x: number; y: number; dx: number; dy: number;
  /** Fraction of the way to the next cell. */
  along: number;
  /** Seconds left standing, and why: blocked, or a stop of its own. */
  wait: number; stop?: "look" | "drop";
  clock: number;
};

/** Which robots a street of this place and year has, with how often each turns up. */
function roster(s: WorldSetting): [RobotKind, number][] {
  const out: [RobotKind, number][] = [];
  if (kerbsideFor(s).scatter.some(([sprite]) => sprite.includes("delivery-robot"))) out.push(["courier", 3]);
  if (requirementMet("robots", s)) {
    const asia = ["east-asia", "japan"].includes(modernity(s).id);
    out.push(["humanoid", 4], ["sweeper", 1], ["dog", asia ? 2 : 0.6]);
  }
  return out;
}

/** Robots going about the pavements of a projected town, near the player and
 * in real time. Like the traffic they are weather, not history: nothing saves them. */
export class StreetRobots {
  private bots: Bot[] = [];
  private images = new Map<number, { im: Phaser.GameObjects.Image; shade: Phaser.GameObjects.Ellipse }>();
  private plan?: unknown;
  private kinds: [RobotKind, number][] = [];
  private kerb: Point[] = [];
  private lanes = new Map<string, Lane>();
  private serial = 0;
  constructor(private scene: Phaser.Scene) {}

  update(o: {
    plan: { lanes?: Map<string, Lane> } | undefined; setting: WorldSetting | undefined; dt: number; still: boolean;
    player: Point; outside: boolean; view: Phaser.Geom.Rectangle; tint: number;
    blocked: (x: number, y: number) => boolean; people: Set<string>; lift: (x: number, y: number) => number;
  }) {
    if (o.plan && o.plan !== this.plan) this.reset(o.plan, o.setting);
    if (!o.outside || !this.kinds.length) return this.sweep(new Set());
    const hidden = (x: number, y: number) =>
      x * 16 < o.view.x - 40 || x * 16 > o.view.right + 40 || y * 16 < o.view.y - 40 || y * 16 > o.view.bottom + 40;
    const want = Math.min(8, Math.round(this.lanes.size / 300));
    if (!o.still && this.bots.length < want) this.spawn(o.player, hidden, o.blocked);
    const taken = new Set(this.bots.map((b) => key(b.x, b.y)));
    const free = (x: number, y: number) => this.walkable(x, y, o.blocked) && !taken.has(key(x, y));
    const seen = new Set<number>();
    this.bots = this.bots.filter((b) => {
      const far = Math.max(Math.abs(b.x - o.player.x), Math.abs(b.y - o.player.y));
      if (far > 48 && hidden(b.x, b.y)) return false;
      if (!o.still) this.step(b, o.dt, free, o.people, o.player);
      seen.add(b.id);
      this.draw(b, o.tint, o.lift);
      return true;
    });
    this.sweep(seen);
  }

  private reset(plan: { lanes?: Map<string, Lane> }, setting: WorldSetting | undefined) {
    this.sweep(new Set());
    this.bots = [];
    this.plan = plan;
    this.lanes = plan.lanes ?? new Map();
    this.kinds = setting && this.lanes.size ? roster(setting) : [];
    this.kerb = [];
    if (!this.kinds.length) return;
    // The first cell off each street's edge: where the pavement starts.
    for (const [k, l] of this.lanes) {
      if (l.junction || (l.at !== 0 && l.at !== l.span - 1)) continue;
      const [x, y] = k.split(",").map(Number), out = l.at === 0 ? -1 : 1;
      const p = l.axis === "x" ? { x, y: y + out } : { x: x + out, y };
      if (!this.lanes.has(key(p.x, p.y))) this.kerb.push(p);
    }
  }

  /** Pavement: open ground off the carriageway and no more than three cells from it. */
  private walkable(x: number, y: number, blocked: (x: number, y: number) => boolean) {
    if (this.lanes.has(key(x, y)) || blocked(x, y)) return false;
    return WAYS.some(([dx, dy]) => [1, 2, 3].some((n) => this.lanes.has(key(x + dx * n, y + dy * n))));
  }

  private spawn(player: Point, hidden: (x: number, y: number) => boolean, blocked: (x: number, y: number) => boolean) {
    for (let i = 0; i < 12; i++) {
      const p = this.kerb[Math.floor(Math.random() * this.kerb.length)];
      const far = p && Math.max(Math.abs(p.x - player.x), Math.abs(p.y - player.y));
      if (!p || far < 14 || far > 40 || !hidden(p.x, p.y) || !this.walkable(p.x, p.y, blocked)) continue;
      const lane = WAYS.map(([dx, dy]) => this.lanes.get(key(p.x + dx, p.y + dy))).find(Boolean);
      const along = lane?.axis === "y" ? [0, 1] : [1, 0];
      // Most set off toward the player, so the street ahead of them fills.
      const toward = Math.sign(along[0] ? player.x - p.x : player.y - p.y) || 1, sign = Math.random() < 0.75 ? toward : -toward;
      let roll = Math.random() * this.kinds.reduce((t, [, w]) => t + w, 0), kind = this.kinds[0][0];
      for (const [k, w] of this.kinds) if ((roll -= w) < 0) { kind = k; break; }
      const id = this.serial++;
      this.bots.push({
        id, kind, livery: Math.floor(Math.random() * LIVERIES.length), carry: kind === "humanoid" && Math.random() < 0.35,
        x: p.x, y: p.y, dx: along[0] * sign, dy: along[1] * sign, along: 0, wait: 0, clock: Math.random() * 10,
      });
      return;
    }
  }

  private step(b: Bot, dt: number, free: (x: number, y: number) => boolean, people: Set<string>, player: Point) {
    b.clock += dt;
    if (b.wait > 0) {
      b.wait -= dt;
      if (b.wait <= 0) b.stop = undefined;
      return;
    }
    const nx = b.x + b.dx, ny = b.y + b.dy;
    // Someone in the way: stand aside a moment, then go round or back.
    if ((nx === player.x && ny === player.y) || people.has(key(nx, ny))) {
      b.wait = 0.8 + Math.random();
      if (Math.random() < 0.4) (b.along = 0), this.turn(b, free);
      return;
    }
    b.along += PACE[b.kind].speed * dt;
    if (b.along < 1) return;
    b.along = 0;
    b.x = nx;
    b.y = ny;
    if (!free(b.x + b.dx, b.y + b.dy)) this.turn(b, free);
    // A stop of its own now and then: a humanoid looks about, a courier hands over its parcel.
    if (Math.random() < 0.04 && (b.kind === "humanoid" || b.kind === "courier")) {
      b.stop = b.kind === "courier" ? "drop" : "look";
      b.wait = 2.5 + Math.random() * 3;
      if (b.kind === "courier") [b.dx, b.dy] = Math.random() < 0.5 ? [1, 0] : [-1, 0];
    }
  }

  /** Ahead, else a side turning, else back the way it came. */
  private turn(b: Bot, free: (x: number, y: number) => boolean) {
    const sides = Math.random() < 0.5 ? [[b.dy, -b.dx], [-b.dy, b.dx]] : [[-b.dy, b.dx], [b.dy, -b.dx]];
    for (const [dx, dy] of [[b.dx, b.dy], ...sides]) if (free(b.x + dx, b.y + dy)) return void ([b.dx, b.dy] = [dx, dy]);
    [b.dx, b.dy] = [-b.dx, -b.dy];
  }

  private draw(b: Bot, tint: number, lift: (x: number, y: number) => number) {
    const facing = b.dy > 0 ? "s" : b.dy < 0 ? "n" : "e";
    const { stride } = PACE[b.kind], beat = (b.clock / stride) * 4;
    const moving = b.wait <= 0, f = Math.floor(beat) % 4;
    const frame =
      b.kind === "sweeper" ? `s-roll${f}`
        : b.kind === "courier" ? (b.stop === "drop" && facing === "e" ? `e-open${b.wait > 1.2 ? 1 : 0}` : `${facing}-roll${moving ? f : 0}`)
          : b.kind === "dog" ? `${facing}-walk${moving ? f : 0}`
            : b.carry ? `${facing}-carry-${moving ? `walk${f}` : `idle${Math.floor(beat / 6) % 2}`}`
              : `${facing}-${moving ? "walk" : "idle"}${moving ? f : Math.floor(beat / 5) % 4}`;
    const tex = this.texture(b.kind, b.livery, frame);
    const t = b.along;
    const x = (b.x + b.dx * t) * 16 + 8, gy = (b.y + b.dy * t) * 16 + 14;
    const y = gy - lift(x, gy);
    let e = this.images.get(b.id);
    if (!e) {
      e = { im: this.scene.add.image(x, y, tex).setOrigin(0.5, 1), shade: this.scene.add.ellipse(x, y, 10, 4, 0x12161a, 0.3) };
      this.images.set(b.id, e);
    } else if (e.im.texture.key !== tex) e.im.setTexture(tex);
    const w = e.im.width;
    e.im.setPosition(Math.round(x), Math.round(y)).setDepth(y + 1).setFlipX(b.dx < 0 && facing === "e").setTint(tint);
    e.shade.setPosition(Math.round(x), Math.round(y) - 1).setSize(w * 0.7, 4).setOrigin(0.5).setDepth(y - 6);
  }

  private texture(kind: RobotKind, livery: number, frame: string) {
    const id = `robot-${kind}-${livery}-${frame}`;
    if (!this.scene.textures.exists(id)) this.scene.textures.addCanvas(id, robotFrames(kind, livery)[frame].canvas());
    return id;
  }

  private sweep(seen: Set<number>) {
    for (const [id, e] of this.images)
      if (!seen.has(id)) {
        e.im.destroy();
        e.shade.destroy();
        this.images.delete(id);
      }
  }
  dispose() {
    this.bots = [];
    this.plan = undefined;
    this.sweep(new Set());
  }
}
