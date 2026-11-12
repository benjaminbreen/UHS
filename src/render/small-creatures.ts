import Phaser from "phaser";
import type { TopographyCell } from "../core/topography";

type Image = Phaser.GameObjects.Image;
type Kind = "crab" | "squirrel" | "frog";
export type SmallLifeContext = {
  climate: string;
  ecology: string;
  season: string;
  tempC: number;
  day: boolean;
  coast: boolean;
  tint: number;
};

const INK: Record<string, string> = { k: "#1d1410", w: "#f8f4ea", S: "#ecdcae", P: "#e07a8a" };
// Each kind's frames share one width and height.
const ART: Record<Kind, Record<string, string[]>> = {
  crab: {
    idle: [".........", "..k...k..", "R.r...r.R", "RrRRwRRrR", ".rRRRRRr.", ".rdddddr.", "r.r...r.r"],
    step: [".........", "..k...k..", "R.r...r.R", "RrRRwRRrR", ".rRRRRRr.", "r.ddddd.r", ".r.r.r.r."],
    wave: ["RR.....RR", "R.k...k.R", "Rrr...rrR", ".rRRwRRr.", ".rRRRRRr.", ".rdddddr.", "r.r...r.r"],
    snip: [".......RR", "..k...k.R", "R.r...rrR", "RrRRwRRr.", ".rRRRRRr.", ".rdddddr.", "r.r...r.r"],
    dig: [".........", ".........", ".........", "..k...k..", "R.r...r.R", "RrRRwRRrR", "SSdddddSS"],
    sunk: [".........", ".........", ".........", ".........", ".........", "..k...k..", ".SSrRrSS."],
  },
  frog: {
    idle: ["........", ".GG..GG.", "GkwGGkwG", "gGGGGGGg", "gmmmmmmg", ".gYYYYg.", "gg.gg.gg"],
    blink: ["........", ".GG..GG.", "GggGGggG", "gGGGGGGg", "gmmmmmmg", ".gYYYYg.", "gg.gg.gg"],
    croak: ["........", ".GG..GG.", "GkwGGkwG", "gGGGGGGg", "gmmmmmmg", "gWWWWWWg", "gWWWWWWg"],
    crouch: ["........", "........", ".GG..GG.", "GkwGGkwG", "gGGGGGGg", "gmmmmmmg", "ggYYYYgg"],
    leap: [".GG..GG.", "GkwGGkwG", "gGGGGGGg", ".gYYYYg.", "..gYYg..", ".g....g.", "g......g"],
    peek: ["........", "........", "........", "........", ".GG..GG.", "GkwGGkwG", "........"],
  },
  squirrel: {
    idle: [".tt......", "tTTt..b..", "tTTt.bbb.", ".tTt.bkbn", "..tt.bbB.", "..tbbbBB.", "..bbbbBB.", "..bbbbb..", "..b..bb.."],
    flick: ["tt.......", "tTt...b..", ".tTt.bbb.", ".tTt.bkbn", "..tt.bbB.", "..tbbbBB.", "..bbbbBB.", "..bbbbb..", "..b..bb.."],
    nibble: [".tt......", "tTTt.b...", "tTTtbbb..", ".tTtbkbn.", "..ttbbBa.", "..tbbBBn.", "..bbbBB..", "..bbbbb..", "..b..bb.."],
    run0: [".........", ".........", ".........", "tt....b..", "tTt..bbb.", ".tTbbbkbn", "..tbbbBB.", ".b.....b.", "........."],
    run1: [".........", ".........", "tt.......", "tTt...b..", ".tTt.bbb.", "...tbbkbn", "...bbbBB.", "...bb.bb.", "........."],
  },
};
const PALETTES: Record<string, Record<string, string>> = {
  "crab-red": { R: "#e4482e", r: "#a82a1c", d: "#741a12" },
  "crab-ghost": { R: "#f2e6c4", r: "#9a8460", d: "#6e5c3e" },
  "frog-green": { g: "#3f7a2c", G: "#6aa640", Y: "#d8d48a", m: "#2a4a1c", W: "#f0ecc8" },
  "frog-brown": { g: "#6a5a30", G: "#9a8a4a", Y: "#e0d4a0", m: "#3e3218", W: "#f0e8c8" },
  "squirrel-red": { t: "#b4542a", T: "#dc7c3c", b: "#c0622c", B: "#f2d4a4", n: "#3a2414", a: "#8a5a2a" },
  "squirrel-grey": { t: "#8a8682", T: "#c4c0b8", b: "#86807a", B: "#ece6da", n: "#3a2e2a", a: "#8a5a2a" },
};
const SCARE: Record<Kind, number> = { crab: 30, squirrel: 42, frog: 28 };

function texture(scene: Phaser.Scene, kind: Kind, palette: string) {
  const key = `small-${palette}`;
  if (scene.textures.exists(key)) return key;
  const frames = Object.entries(ART[kind]);
  const w = frames[0][1][0].length,
    h = frames[0][1].length;
  const canvas = scene.textures.createCanvas(key, w * frames.length, h)!;
  const ctx = canvas.getContext();
  const ink = { ...INK, ...PALETTES[palette] };
  frames.forEach(([name, rows], f) => {
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (!ink[ch]) return;
        ctx.fillStyle = ink[ch];
        ctx.fillRect(f * w + x, y, 1, 1);
      }),
    );
    canvas.add(name, 0, f * w, 0, w, h);
  });
  canvas.refresh();
  return key;
}

type Point = { x: number; y: number; z: number };
type Creature = {
  kind: Kind;
  image: Image;
  shadow: Phaser.GameObjects.Ellipse;
  home: { x: number; y: number };
  x: number;
  y: number;
  /** Height above the ground: a leap, or a squirrel up its trunk. */
  z: number;
  state: "idle" | "move" | "alert" | "flee" | "hidden" | "emerge";
  until: number;
  from: Point;
  to: Point;
  start: number;
  phase: number;
  /** A squirrel's tree, a frog's pool: where it bolts to. */
  tree?: Image;
  pool?: { x: number; y: number };
  /** A fly a frog has its eye on. */
  fly?: Phaser.GameObjects.Rectangle;
  hold?: { frame: string; until: number };
};

const hash = (x: number, y: number, s: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
const FRESH = (n?: TopographyCell) => n?.surface === "water" && n.waterVisual?.kind !== "sea";

/** Crabs on a warm beach, frogs at the edge of fresh water, squirrels round
 * the trunks. Each minds its own business, warns as the player nears, bolts
 * and hides, and comes back later. Standing still calms them; running
 * frightens them from further off. */
export class SmallCreatures {
  private creatures = new Map<string, Creature>();
  private context?: SmallLifeContext;
  private scanAt = 0;
  private last?: { x: number; y: number; t: number };
  private pace = 0;

  constructor(
    private scene: Phaser.Scene,
    private view: {
      cell: (x: number, y: number) => TopographyCell | undefined;
      player: () => Image | undefined;
      plants: () => Map<string, Image[]>;
      seed: () => number;
    },
  ) {}

  set(context: SmallLifeContext | undefined) {
    const was = this.context;
    this.context = context;
    if (!context || !was || context.season !== was.season || context.day !== was.day || context.climate !== was.climate) {
      this.clear();
      this.scanAt = 0;
    }
  }

  clear() {
    for (const c of this.creatures.values()) this.remove(c);
    this.creatures.clear();
  }

  private remove(c: Creature) {
    c.image.destroy();
    c.shadow.destroy();
    c.fly?.destroy();
  }

  private kindAt(cx: number, cy: number): Kind | undefined {
    const ctx = this.context!;
    const cell = this.view.cell(cx, cy);
    if (!cell || cell.feature === "paving" || (cell.tended ?? 0) > 0.4) return;
    const h = hash(cx, cy, this.view.seed());
    const tropical = ["tropical", "monsoon"].includes(ctx.climate);
    if (cell.surface === "sand" && ctx.coast && ctx.tempC > 12 && h < (tropical ? 0.08 : 0.03)) return "crab";
    if (ctx.tempC < 10 || ctx.season === "winter") return;
    const shallow = FRESH(cell) && cell.waterDepth !== "deep";
    const bank =
      cell.surface !== "water" &&
      [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => FRESH(this.view.cell(cx + dx, cy + dy)));
    if ((shallow || bank) && h < 0.07) return "frog";
  }

  private spawn(key: string, kind: Kind, x: number, y: number, tree?: Image) {
    const ctx = this.context!;
    const h = hash(x, y, this.view.seed() + 3);
    const palette =
      kind === "crab"
        ? ["tropical", "monsoon"].includes(ctx.climate) ? "crab-red" : "crab-ghost"
        : kind === "frog"
          ? h < 0.7 ? "frog-green" : "frog-brown"
          : hash(this.view.seed(), 1, 1) < 0.5 ? "squirrel-red" : "squirrel-grey";
    const image = this.scene.add
      .image(x, y, texture(this.scene, kind, palette), "idle")
      .setOrigin(0.5, 1)
      .setTint(ctx.tint)
      .setFlipX(h < 0.5);
    const shadow = this.scene.add.ellipse(x, y, image.width - 2, 2, 0x1d2230, 0.25);
    let pool: Creature["pool"];
    if (kind === "frog") {
      const cx = Math.floor(x / 16),
        cy = Math.floor(y / 16);
      const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => FRESH(this.view.cell(cx + dx, cy + dy)));
      if (near) pool = { x: x + near[0] * 14, y: y + near[1] * 14 };
    }
    const at = { x, y, z: 0 };
    this.creatures.set(key, {
      kind, image, shadow, home: { x, y }, x, y, z: 0,
      state: "idle", until: 0, from: at, to: at, start: 0,
      phase: h * 10, tree, pool,
    });
  }

  private scan() {
    const ctx = this.context;
    if (!ctx) return;
    const view = this.scene.cameras.main.worldView;
    const pad = 64,
      cap = 18;
    const inside = (x: number, y: number) =>
      x > view.x - pad && x < view.right + pad && y > view.y - pad && y < view.bottom + pad;
    for (const [key, c] of this.creatures)
      if (!inside(c.home.x, c.home.y) || (c.tree && !c.tree.active)) {
        this.remove(c);
        this.creatures.delete(key);
      }
    const x0 = Math.floor((view.x - pad) / 16),
      y0 = Math.floor((view.y - pad) / 16);
    const x1 = Math.ceil((view.right + pad) / 16),
      y1 = Math.ceil((view.bottom + pad) / 16);
    for (let cy = y0; cy <= y1 && this.creatures.size < cap; cy++)
      for (let cx = x0; cx <= x1 && this.creatures.size < cap; cx++) {
        const key = `${cx},${cy}`;
        if (this.creatures.has(key)) continue;
        const kind = this.kindAt(cx, cy);
        if (kind) this.spawn(key, kind, cx * 16 + 4 + hash(cx, cy, 5) * 8, cy * 16 + 6 + hash(cx, cy, 6) * 8);
      }
    this.count();
    const squirrels =
      ctx.day &&
      ctx.tempC > -10 &&
      ["temperate", "continental", "mediterranean", "subarctic", "highland"].includes(ctx.climate) &&
      !["desert", "tundra", "dry-scrub", "savanna"].includes(ctx.ecology);
    if (!squirrels) return;
    for (const [key, images] of this.view.plants()) {
      if (this.creatures.size >= cap) break;
      if (this.creatures.has(`t${key}`) || !images.length) continue;
      const tree = images.reduce((a, b) => (b.displayHeight > a.displayHeight ? b : a));
      if (tree.displayHeight < 40 || !inside(tree.x, tree.y)) continue;
      const [x, y] = key.split(",").map(Number);
      if (hash(x, y, this.view.seed() + 9) > 0.16) continue;
      this.spawn(`t${key}`, "squirrel", tree.x + (hash(x, y, 1) < 0.5 ? -10 : 10), tree.y + 3, tree);
    }
    this.count();
  }

  private count() {
    const n = { crab: 0, frog: 0, squirrel: 0 };
    for (const c of this.creatures.values()) n[c.kind]++;
    this.scene.game.canvas.dataset.smallLife = `crab:${n.crab} frog:${n.frog} squirrel:${n.squirrel}`;
  }

  update(time: number) {
    if (!this.context) return;
    if (time > this.scanAt) {
      this.scanAt = time + 1500;
      this.scan();
    }
    const player = this.view.player();
    if (player) {
      if (this.last && time > this.last.t) {
        const v = Math.hypot(player.x - this.last.x, player.y - this.last.y) / ((time - this.last.t) / 1000);
        this.pace += (v - this.pace) * 0.1;
      }
      this.last = { x: player.x, y: player.y, t: time };
    }
    // A still figure is let come close; a running one scatters them early.
    const wary = this.pace < 4 ? 0.65 : this.pace > 70 ? 1.5 : 1;
    for (const c of this.creatures.values()) this.step(c, time, wary, player);
  }

  private go(c: Creature, time: number, state: Creature["state"], to: Point, speed: number) {
    c.state = state;
    c.from = { x: c.x, y: c.y, z: c.z };
    c.to = to;
    c.start = time;
    c.until = time + (Math.hypot(to.x - c.x, to.y - c.y, to.z - c.z) / speed) * 1000 + 1;
    if (Math.abs(to.x - c.x) > 0.5 && c.kind !== "crab") c.image.setFlipX(to.x < c.x);
  }

  private step(c: Creature, time: number, wary: number, player?: Image) {
    const k = c.kind;
    const d = player ? Math.hypot(player.x - c.x, player.y - (c.y - c.z)) : 1e9;
    const scare = SCARE[k] * wary;
    const r = (n: number) => hash(c.phase, Math.floor(time / 997), n);
    let frame = "idle";

    if (c.state === "hidden") {
      c.image.setVisible(false);
      c.shadow.setVisible(false);
      if (time < c.until || d < SCARE[k] * 2.5) return;
      c.x = c.home.x;
      c.y = c.home.y;
      c.z = 0;
      c.state = "emerge";
      c.start = time;
      c.until = time + (k === "squirrel" ? 0 : 1600);
      if (k === "squirrel" && c.tree) {
        // Comes back down the trunk head first.
        c.z = c.tree.displayHeight * 0.55;
        c.x = c.tree.x + (c.image.flipX ? 2 : -2);
        c.y = c.tree.y + 1;
        this.go(c, time, "move", { x: c.x, y: c.y, z: 0 }, 30);
      }
    }
    c.image.setVisible(true);
    c.shadow.setVisible(true);

    if (c.state !== "flee" && d < scare) this.flee(c, time, player!);
    else if ((c.state === "idle" || c.state === "move") && d < scare * 1.7 && c.z < 2) {
      c.state = "alert";
      c.until = time + 900;
      if (k === "squirrel" && player) c.image.setFlipX(player.x < c.x);
    }

    const t = Math.min(1, (time - c.start) / Math.max(1, c.until - c.start));
    if (c.state === "emerge") {
      // Eyes first: a crab out of its hole, a frog surfacing in the pool.
      frame = k === "crab" ? (t < 0.5 ? "sunk" : "dig") : "peek";
      if (k === "frog" && c.pool) {
        c.x = c.pool.x;
        c.y = c.pool.y;
      }
      if (t >= 1) {
        if (k === "frog") this.go(c, time, "move", { x: c.home.x, y: c.home.y, z: 0 }, 50);
        else {
          c.state = "idle";
          c.until = time + 1500;
        }
      }
    } else if (c.state === "move" || c.state === "flee") {
      c.x = c.from.x + (c.to.x - c.from.x) * t;
      c.y = c.from.y + (c.to.y - c.from.y) * t;
      c.z = c.from.z + (c.to.z - c.from.z) * t;
      if (k === "frog") {
        c.z = Math.sin(t * Math.PI) * (c.state === "flee" ? 9 : 5);
        frame = t < 0.08 || t > 0.92 ? "crouch" : "leap";
      } else if (k === "squirrel") {
        frame = Math.floor(time / 65) % 2 ? "run0" : "run1";
        // Bounding along the ground, a lope up the bark.
        if (c.to.z === 0 && c.from.z === 0) c.z = Math.abs(Math.sin(t * Math.PI * 4)) * 2;
      } else frame = c.state === "flee" && t > 0.75 ? "dig" : Math.floor(time / 55) % 2 ? "step" : "idle";
      if (t >= 1) {
        if (c.state === "flee") {
          c.state = "hidden";
          c.until = time + 7000 + r(2) * 9000;
          if (k === "frog") this.splash(c.x, c.y);
          if (k === "crab") this.puff(c.x, c.y);
          if (k === "squirrel" && c.tree) this.rustle(c.tree);
        } else {
          c.state = "idle";
          c.until = time + 1500 + r(3) * 4000;
        }
      }
    } else if (c.state === "alert") {
      if (k === "crab") frame = Math.floor(time / 160) % 2 ? "wave" : "snip";
      else if (k === "squirrel") frame = Math.floor(time / 110) % 2 ? "flick" : "idle";
      else frame = "crouch";
      if (time > c.until && d >= scare * 1.7) {
        c.state = "idle";
        c.until = time + 800;
      }
    } else {
      frame = this.idleFrame(c, time);
      if (k === "frog") this.hunt(c, time);
      if (time > c.until && !c.fly) this.wander(c, time);
    }
    if (c.hold && time < c.hold.until) frame = c.hold.frame;

    const climbing = k === "squirrel" && c.z > 3;
    const tint = this.context!.tint;
    c.image
      .setFrame(frame)
      .setAngle(climbing ? (c.to.z > c.from.z ? -90 : 90) * (c.image.flipX ? -1 : 1) : 0)
      .setPosition(Math.round(c.x), Math.round(c.y - c.z))
      .setDepth(climbing && c.tree ? c.tree.depth + 0.05 : c.y + 0.5)
      .setTint(tint);
    c.shadow
      .setPosition(Math.round(c.x), Math.round(c.y))
      .setDepth(c.y + 0.4)
      .setVisible(!climbing && c.state !== "emerge")
      .setScale(1 - Math.min(0.5, c.z / 20));
  }

  private idleFrame(c: Creature, time: number) {
    const beat = Math.floor(time / 240 + c.phase * 7);
    if (c.kind === "crab") return beat % 26 < 2 ? "wave" : beat % 26 === 13 ? "snip" : "idle";
    if (c.kind === "squirrel") return beat % 14 < 5 ? "nibble" : beat % 14 === 7 || beat % 14 === 9 ? "flick" : "idle";
    // A frog sits and blinks, and now and then its throat swells.
    const croak = beat % 30;
    if (croak >= 20 && croak < 26) return croak % 2 ? "croak" : "idle";
    return beat % 17 === 0 ? "blink" : "idle";
  }

  private wander(c: Creature, time: number) {
    const r = (n: number) => hash(c.phase, time, n);
    if (c.kind === "squirrel" && c.tree && r(1) < 0.3) {
      // Up the trunk for a look round, then down again.
      const x = c.tree.x + (c.image.flipX ? 2 : -2);
      this.go(c, time, "move", { x, y: c.tree.y + 1, z: 0 }, 50);
      this.queue(c, { x, y: c.tree.y + 1, z: 10 + r(2) * 16 }, 40);
      return;
    }
    if (c.z > 3) return this.go(c, time, "move", { x: c.x, y: c.y, z: 0 }, 35);
    const roam = { crab: 26, squirrel: 22, frog: 12 }[c.kind];
    let dx = (r(4) - 0.5) * 2 * roam,
      dy = (r(5) - 0.5) * roam * (c.kind === "crab" ? 0.35 : 0.8);
    if (Math.hypot(c.x + dx - c.home.x, c.y + dy - c.home.y) > roam * 1.4) {
      dx = (c.home.x - c.x) * 0.8;
      dy = (c.home.y - c.y) * 0.8;
    }
    const cell = this.view.cell(Math.floor((c.x + dx) / 16), Math.floor((c.y + dy) / 16));
    const ok = c.kind === "frog" ? !!cell && cell.waterDepth !== "deep" : !!cell && cell.surface !== "water";
    if (!ok) return void (c.until = time + 800);
    const pace = { crab: 30, squirrel: 55, frog: 28 }[c.kind];
    this.go(c, time, "move", { x: c.x + dx, y: c.y + dy, z: 0 }, pace);
  }

  /** A second leg begun when the first ends. */
  private queue(c: Creature, to: Point, speed: number) {
    const ends = c.until;
    this.scene.time.delayedCall(Math.max(0, ends - this.scene.time.now) + 30, () => {
      if (c.state === "idle" && c.image.active) this.go(c, this.scene.time.now, "move", to, speed);
    });
  }

  private flee(c: Creature, time: number, player: Image) {
    const k = c.kind;
    const away = Math.sign(c.x - player.x) || 1;
    c.fly?.destroy();
    c.fly = undefined;
    if (k === "squirrel" && c.tree) {
      // Round the trunk and up into the crown, scolding all the way.
      const top = c.tree.displayHeight * 0.6;
      c.image.setFlipX(away < 0);
      this.go(c, time, "flee", { x: c.tree.x + away * 2, y: c.tree.y + 1, z: top }, 110);
      this.chatter(c.tree.x, c.tree.y - top - 4);
      return;
    }
    if (k === "frog") {
      const to = c.pool ?? { x: c.x + away * 18, y: c.y };
      c.hold = { frame: "crouch", until: time + 120 };
      return this.go(c, time, "flee", { ...to, z: 0 }, 75);
    }
    // A crab bolts sideways for its burrow, digs in and is gone.
    this.go(c, time, "flee", { x: c.x + away * 22, y: c.y + (hash(c.phase, time, 8) - 0.5) * 6, z: 0 }, 75);
  }

  /** Now and then a fly drifts by a sitting frog, and the tongue takes it. */
  private hunt(c: Creature, time: number) {
    if (!c.fly) {
      if (Math.random() > 0.002 || (c.hold && time < c.hold.until)) return;
      c.fly = this.scene.add.rectangle(c.x, c.y - 14, 1, 1, 0x1d1410).setDepth(c.y + 1);
      c.fly.setData("born", time);
      c.until = time + 6000;
      return;
    }
    const age = time - (c.fly.getData("born") as number);
    const side = c.image.flipX ? -1 : 1;
    const fx = c.x + side * (10 + Math.sin(age / 180) * 5),
      fy = c.y - 12 + Math.cos(age / 130) * 3;
    c.fly.setPosition(Math.round(fx), Math.round(fy));
    if (age < 1800) return;
    const mouth = { x: c.x, y: c.y - 3 };
    const tongue = this.scene.add
      .line(0, 0, mouth.x, mouth.y, fx, fy, 0xe07a8a)
      .setOrigin(0)
      .setLineWidth(1)
      .setDepth(c.y + 0.6);
    this.scene.time.delayedCall(110, () => tongue.destroy());
    c.fly.destroy();
    c.fly = undefined;
    c.hold = { frame: "blink", until: time + 450 };
    c.until = time + 2500;
  }

  private splash(x: number, y: number) {
    for (let i = 0; i < 2; i++) {
      const ring = this.scene.add.ellipse(x, y, 4, 2).setStrokeStyle(1, 0xdcecf0, 0.85).setDepth(y + 0.6);
      this.scene.tweens.add({ targets: ring, scale: 3.5 + i, alpha: 0, delay: i * 180, duration: 750, onComplete: () => ring.destroy() });
    }
    for (let i = 0; i < 4; i++) {
      const drop = this.scene.add.rectangle(x, y - 1, 1, 1, 0xe8f4f4).setDepth(y + 0.7);
      this.scene.tweens.add({
        targets: drop,
        x: x + (i - 1.5) * 4,
        y: { from: y - 1, to: y - 6 },
        yoyo: true,
        duration: 160,
        onComplete: () => drop.destroy(),
      });
    }
  }

  private puff(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      const grain = this.scene.add.rectangle(x, y - 1, 1, 1, 0xecdcae).setDepth(y + 0.6);
      this.scene.tweens.add({
        targets: grain,
        x: x + (i - 1.5) * 5,
        y: y - 3 - (i % 2) * 2,
        alpha: 0,
        duration: 380,
        onComplete: () => grain.destroy(),
      });
    }
  }

  private rustle(tree: Image) {
    this.scene.tweens.add({ targets: tree, angle: { from: -1.2, to: 1.2 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => tree.setAngle(0) });
  }

  /** A few short marks over the crown: the scolding you hear from a tree. */
  private chatter(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      const mark = this.scene.add
        .rectangle(x + (i - 1) * 4, y, 1, 2 + (i % 2), 0xf8f4ea)
        .setDepth(y + 4000)
        .setAlpha(0)
        .setAngle((i - 1) * 25);
      this.scene.tweens.add({ targets: mark, alpha: { from: 0.9, to: 0 }, y: y - 6, delay: i * 140, duration: 500, onComplete: () => mark.destroy() });
    }
  }
}
