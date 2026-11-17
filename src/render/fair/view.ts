import Phaser from "phaser";
import { fairFind } from "../../content/fairs";
import { fairIndoor, fairOutdoor, FRONT, type FairLevel } from "../../world/fair";
import { washAt } from "../lighting";
import { PAD, paintFairGround } from "./ground";
import { PALACE_RISE } from "./palace";
import { paintFairDecor, paintFairThing, type FairSprite } from "./things";

export type FairFrame = { clock: number; time: number };
/** The texture a frame of the fair's building sheet is in; "__DEFAULT" while it loads. */
export type SheetOf = (frame: string) => string;

/** Matches `M` in scripts/art/front_fair.py: the frame starts this far left of the footprint. */
const MARGIN = 12;
/** Matches `LOW_EXT` there. */
const LOW_EXT = 150;
const LEGS = [[6, 4, false], [41, 4, true], [6, 26, false], [41, 26, true]] as const;

/** One area of a fair on screen: the ground, the buildings along the top, the
 * exhibits and trees, a fountain playing, and the day's light. */
export class FairView {
  readonly space: string;
  private keys: string[] = [];
  private objects: Phaser.GameObjects.GameObject[] = [];
  private pending: { frame: string; x: number; y: number; depth: number; flip: boolean; mid?: boolean }[] = [];
  private glows: Phaser.GameObjects.Image[] = [];
  private shade: Phaser.GameObjects.Rectangle;
  private banner: Phaser.GameObjects.Text;
  private spray?: Phaser.GameObjects.Graphics;
  private jets: { x: number; y: number; w: number }[] = [];
  /** Machines at work: an image, and the loop of frames it plays. */
  private working: { im: Phaser.GameObjects.Image; n: number; fps: number }[] = [];
  private born = 0;
  /** The painted world, margin included, in pixels. */
  readonly bounds: { x: number; y: number; w: number; h: number };

  constructor(private scene: Phaser.Scene, readonly level: FairLevel, private sheet: SheetOf) {
    this.space = level.space;
    const W = level.w * 16, H = level.h * 16, seed = level.space.length * 131 + level.w;
    halo(scene);
    const tex = (key: string, canvas: HTMLCanvasElement) => {
      const k = `fair-${level.space}-${key}`;
      if (scene.textures.exists(k)) scene.textures.remove(k);
      scene.textures.addCanvas(k, canvas);
      this.keys.push(k);
      return k;
    };
    const outdoor = fairOutdoor(level.kind);
    this.objects.push(scene.add.rectangle(-800, -600, W + 1600, H + 1200, outdoor ? 0x41692c : level.kind === "platform" ? 0x9ab0c4 : 0x2a2226).setOrigin(0, 0).setDepth(-99993));
    // A gallery among other galleries fills the view: its roof behind, its front wall below, little of the lawn round it.
    const palace = level.look === "palace";
    const m = palace ? { x: 1, top: PALACE_RISE / 16, bottom: 1 } : level.kind === "gallery" ? { x: 1, top: 4, bottom: 3 } : PAD;
    this.bounds = { x: -m.x * 16, y: -m.top * 16, w: W + m.x * 32, h: H + (m.top + m.bottom) * 16 };
    this.objects.push(scene.add.image(-PAD.x * 16, -PAD.top * 16, tex("ground", paintFairGround(level, seed).canvas())).setOrigin(0, 0).setDepth(-99990));
    const put = (s: FairSprite, x: number, y: number, key: string, depth: number, dx = 0, dy = 0) => {
      if (s.frames) {
        // The frames side by side, eight to a row.
        const fw = s.r.w, fh = s.r.h, n = s.frames.length, sheet = document.createElement("canvas");
        sheet.width = fw * Math.min(8, n);
        sheet.height = fh * Math.ceil(n / 8);
        s.frames.forEach((f, i) => f.put(sheet.getContext("2d")!, (i % 8) * fw, Math.floor(i / 8) * fh));
        const k = tex(key, sheet), texture = scene.textures.get(k);
        for (let i = 0; i < n; i++) texture.add(i, 0, (i % 8) * fw, Math.floor(i / 8) * fh, fw, fh);
        const im = scene.add.image(x * 16 - s.ox + dx, y * 16 - s.oy + dy, k, 0).setOrigin(0, 0).setDepth(depth);
        this.objects.push(im);
        this.working.push({ im, n, fps: s.fps ?? 10 });
      } else this.objects.push(scene.add.image(x * 16 - s.ox + dx, y * 16 - s.oy + dy, tex(key, s.r.canvas())).setOrigin(0, 0).setDepth(depth));
      for (const g of s.glow ?? []) this.glow(x * 16 - s.ox + dx + g.x, y * 16 - s.oy + dy + g.y);
    };
    for (const t of level.things) {
      const f = fairFind(t.find), s = f && paintFairThing(t.art, t.w ?? 1, t.h ?? 1, (t.x * 7 + t.y) % 10 / 10, f.tint, level.palace?.order !== "timber");
      // On a palace wall a hung thing has a bay to itself: in the middle of it, at eye height.
      if (s) put(s, t.x, t.y, t.id, t.wall ? -99980 : (t.y + (t.h ?? 1) - 1) * 16 + 13, t.wall && palace ? (3 - (t.w ?? 1)) * 8 : 0, t.wall && palace ? -30 : 0);
    }
    const indoor = fairIndoor(level.kind);
    const decor = [...level.decor];
    // Outside a pavilion: trees along the lawn round it, lamps either side of the steps.
    if (indoor && level.kind !== "gallery") {
      const door = (level.w >> 1) - 1;
      for (let x = -6; x < level.w + 6; x += 4) for (const y of [-1, level.h + 4]) if (x < -3 || x > level.w + 2 || y > level.h) if (Math.abs(x - door) > 4 || y < 0) decor.push({ type: "tree", x, y, solid: false, v: ((x * 7 + y * 3) & 15) / 16 });
      for (let y = 2; y < level.h + 3; y += 4) for (const x of [-4, level.w + 3]) decor.push({ type: y % 8 === 2 ? "tree" : "shrub", x, y, solid: false, v: ((x + y * 5) & 15) / 16 });
      for (const x of [door - 3, door + 4]) decor.push({ type: "lamp", x, y: level.h + 1, solid: false, v: 0 }, { type: "urn", x, y: level.h + 3, solid: false, v: x / 10 });
    }
    // Round open grounds: trees behind the pavilions and down the sides, on the turf the edge runs on into.
    if (level.kind === "grounds" || level.kind === "court") {
      const turf = (x: number, y: number) => level.cells[Math.max(0, Math.min(level.h - 1, y)) * level.w + Math.max(0, Math.min(level.w - 1, x))] === 2;
      for (let x = -7; x < level.w + 7; x += 3) for (const y of [-6, -2, level.h + 2, level.h + 5]) if (turf(x, y)) decor.push({ type: "tree", x: x + (y & 1), y, solid: false, v: ((x * 5 + y) & 15) / 16 });
      for (let y = 0; y < level.h + 2; y += 3) for (const x of [-6, -3, level.w + 2, level.w + 5]) if (turf(x, y)) decor.push({ type: "tree", x, y: y + (x & 1), solid: false, v: ((x + y * 3) & 15) / 16 });
    }
    // Round a yard the map's own trees stand, which are broader than the park's: fewer of them, and none across a way out.
    if (level.rustic) for (const d of decor) if (d.type === "tree") d.type = (d.x * 3 + d.y) % 3 || level.exits.some((e) => Math.abs(e.x + e.w / 2 - d.x) < 5 && Math.abs(e.y + e.h / 2 - d.y) < 8) ? "none" : `atlas:nature-${["broadleaf-mature", "beech", "broadleaf-young"][Math.floor(d.v * 3)]}:1`;
    decor.forEach((d, i) => {
      if (d.type === "jet") return void this.jets.push({ x: d.x * 16, y: d.y * 16, w: d.v * 16 });
      // A frame from the game's own prop and tree sheets, standing in the middle of its cells.
      if (d.type.startsWith("atlas:")) { const [, frame, wide] = d.type.split(":"); return void this.pending.push({ frame, x: (d.x + Number(wide) / 2) * 16, y: d.y * 16 + 15, depth: d.y * 16 + 13, flip: false, mid: true }); }
      const s = paintFairDecor(d.type, d.v, level.palace);
      if (s) put(s, d.x, d.y, `decor-${i}`, d.y * 16 + 13);
    });
    const lift = paintFairThing("lift", 1, 1, 0);
    level.lifts.forEach((l, i) => lift && put(lift, l.x, l.y, `lift-${i}`, l.y * 16 + 13));
    for (const b of level.buildings) this.pending.push({ frame: `fair-${b.id}`, x: b.x * 16 - MARGIN, y: (FRONT + 1) * 16, depth: FRONT * 16 + 14, flip: false });
    // A right-hand foot is the left one mirrored: anchor it by its outer (right) edge.
    // The far feet lean in under the arch; the near ones lean out, their frame running LOW_EXT further that way.
    if (level.tower) for (const [x, y, flip] of LEGS) {
      const low = y > 20, out = MARGIN + (low ? LOW_EXT : 0);
      this.pending.push({ frame: low ? "fair-tower-leg-low" : "fair-tower-leg", x: flip ? (x + 9) * 16 + out : x * 16 - out, y: (y + 8) * 16, depth: (y + 7) * 16 + 14, flip });
    }
    if (level.fountain) this.spray = scene.add.graphics().setDepth((level.fountain.y + level.fountain.h) * 16);
    if (!this.spray && this.jets.length) this.spray = scene.add.graphics().setDepth(this.jets[0].y + 40);
    if (this.spray) this.objects.push(this.spray);
    this.shade = scene.add.rectangle(-800, -600, W + 1600, H + 1200, 0xffffff).setOrigin(0, 0).setDepth(3000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    const font = { fontFamily: "Silkscreen, monospace", fontSize: "8px", color: "#fff2d8", stroke: "#10141c", strokeThickness: 3 };
    for (const e of level.exits) {
      if (!e.name) continue;
      const x = (e.x + e.w / 2) * 16, y = (e.y + e.h / 2) * 16;
      const into = e.w === 1 && e.h === 1;
      const label = scene.add.text(x, into ? y + 22 : e.y === 0 ? (palace ? -18 : y + 14) : e.y === level.h - 1 ? y - 6 : y, into ? e.name : `${e.x === 0 ? "◂ " : ""}${e.name}${e.x === level.w - 1 ? " ▸" : ""}`, font)
        .setOrigin(e.x === 0 && e.w === 1 && !into ? 0 : e.x === level.w - 1 && !into ? 1 : 0.5, 0.5).setDepth(1e6).setAlpha(0.85);
      this.objects.push(label);
    }
    this.banner = scene.add.text(0, 0, level.name[0].toUpperCase() + level.name.slice(1), { ...font, fontSize: "16px", strokeThickness: 4 }).setDepth(1e7).setOrigin(0.5, 0.5).setAlpha(0);
    this.objects.push(this.shade, this.banner);
    this.place();
  }

  /** Buildings come from a sheet that may still be loading. */
  private place() {
    this.pending = this.pending.filter((p) => {
      const key = this.sheet(p.frame);
      if (key === "__DEFAULT") return true;
      if (!this.scene.textures.get(key).has(p.frame)) return false;
      this.objects.push(this.scene.add.image(p.x, p.y, key, p.frame).setOrigin(p.mid ? 0.5 : p.flip ? 1 : 0, 1).setDepth(p.depth).setFlipX(p.flip));
      return false;
    });
  }

  private glow(x: number, y: number) {
    const im = this.scene.add.image(x, y, "fair-halo").setBlendMode(Phaser.BlendModes.ADD).setDepth(3001).setTint(0xffd890).setAlpha(0);
    this.glows.push(im);
    this.objects.push(im);
  }

  update(f: FairFrame) {
    if (this.pending.length) this.place();
    if (!this.born) this.born = f.time;
    const t = f.time / 1000, wash = washAt(f.clock);
    const indoor = fairIndoor(this.level.kind);
    // A hall has no windows: dimmer, and its fires and torches count for more.
    const dim = this.level.palace?.order === "timber";
    if (indoor) this.shade.setFillStyle(dim ? 0xd6c2aa : 0xf2e8dc);
    else {
      const c = Phaser.Display.Color.IntegerToColor(wash.color), a = wash.alpha;
      this.shade.setFillStyle(Phaser.Display.Color.GetColor(255 - (255 - c.red) * a, 255 - (255 - c.green) * a, 255 - (255 - c.blue) * a));
    }
    // The fair was lit by electricity after dark: every lamp at once.
    for (const g of this.glows) g.setAlpha((dim ? 0.5 : indoor ? 0.15 : 0.7 * wash.lamps) * (0.94 + 0.06 * Math.sin(t * 3 + g.x)));
    for (const m of this.working) m.im.setFrame(Math.floor(t * m.fps) % m.n);
    const fo = this.level.fountain;
    this.spray?.clear();
    for (const j of this.jets) {
      const g = this.spray!, cx = j.x + j.w / 2, cy = j.y + 16;
      for (let k = 0; k < 18; k++) {
        const p = (t * 0.8 + k / 18) % 1, a = (k * 2.4) % (Math.PI * 2);
        g.fillStyle(0xf4fbff, 0.95 - p * 0.6).fillRect(Math.round(cx + Math.cos(a) * p * j.w * 0.3), Math.round(cy - 26 * Math.sin(p * Math.PI) + p * 6), p < 0.2 ? 1 : 2, 2);
      }
      g.fillStyle(0xffffff, 0.9).fillRect(Math.round(cx), cy - 24, 1, 22);
    }
    if (fo && this.spray) {
      const g = this.spray, cx = (fo.x + fo.w / 2) * 16, cy = (fo.y + fo.h / 2) * 16;
      const jets = fo.kind === "coutan" ? 9 : 0;
      for (let j = 0; j < jets; j++) {
        const ang = (j / jets) * Math.PI * 2, rx = fo.kind === "coutan" ? fo.w * 5 : 0, ry = fo.kind === "coutan" ? fo.h * 4 : 0;
        const x0 = cx + Math.cos(ang) * rx, y0 = cy + Math.sin(ang) * ry, tall = fo.kind === "coutan" && j === 0 ? 0 : 18;
        for (let k = 0; k < 14; k++) {
          const p = ((t * 0.9 + k / 14 + j * 0.37) % 1);
          const x = x0 + (cx - x0) * p * 0.5, y = y0 - Math.sin(p * Math.PI) * (tall + 12);
          g.fillStyle(0xeaf6ff, 0.85 - p * 0.4).fillRect(Math.round(x), Math.round(y), 2, 2);
        }
      }
      // The tazza's jet: a column up, an umbrella falling into the upper bowl, and
      // sheets running off the lower bowl's rim into the basin.
      const top = cy - 32, H = fo.kind === "coutan" ? 30 : 24;
      g.fillStyle(0xffffff, 0.9).fillRect(Math.round(cx), Math.round(top - H * 0.85), 1, Math.round(H * 0.85));
      for (let k = 0; k < 36; k++) {
        const p = (t * 0.9 + k / 36) % 1, side = k % 2 ? 1 : -1, spread = 5 + (k % 6) * 1.6;
        const x = cx + side * spread * p, y = top - H * 4 * p * (1 - p) * 0.85 + 10 * p;
        g.fillStyle(0xeef8ff, 0.95 - p * 0.5).fillRect(Math.round(x), Math.round(y), 1, 2);
      }
      for (let k = 0; k < 28; k++) {
        const p = (t * 1.3 + k / 28) % 1, a = (k / 28) * Math.PI * 2, rim = fo.kind === "coutan" ? 26 : 19;
        const x = cx + Math.cos(a) * (rim + p * 3), y = cy - 10 + Math.sin(a) * rim * 0.36 + p * p * 16;
        g.fillStyle(0xdff2ff, 0.8 - p * 0.5).fillRect(Math.round(x), Math.round(y), 1, 2);
      }
    }
    const cam = this.scene.cameras.main, v = cam.worldView, age = f.time - this.born;
    this.banner.setPosition(v.centerX, v.y + v.height * 0.2).setAlpha(age < 500 ? age / 500 : age < 2400 ? 1 : Math.max(0, 1 - (age - 2400) / 800));
  }

  destroy() {
    for (const o of this.objects) o.destroy();
    for (const k of this.keys) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
  }
}

function halo(scene: Phaser.Scene) {
  if (scene.textures.exists("fair-halo")) return;
  const t = scene.textures.createCanvas("fair-halo", 48, 48)!;
  const gr = t.context.createRadialGradient(24, 24, 0, 24, 24, 24);
  gr.addColorStop(0, "rgba(255,255,255,0.7)");
  gr.addColorStop(0.35, "rgba(255,255,255,0.25)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  t.context.fillStyle = gr;
  t.context.fillRect(0, 0, 48, 48);
  t.refresh();
}
