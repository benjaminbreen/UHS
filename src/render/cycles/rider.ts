import type Phaser from "phaser";
import { CYCLE_SEATS, CYCLE_SPECS, type CycleLook, type CyclePose, type CycleTrick } from "../../core/cycles";
import type { WorldObject } from "../../core/types";
import { CYCLE_GROUND, CYCLE_H } from "./paint";
import { CycleSprites } from "./sprites";

type Image = Phaser.GameObjects.Image;

// The wheels stand two pixels up from the bottom edge of the cell.
const ORIGIN_Y = (CYCLE_GROUND + 3) / CYCLE_H;
// Round from north by eighths; the three westward headings are the eastward ones mirrored.
const VIEWS = ["back", "quarter-back", "side", "quarter", "front", "quarter", "side", "quarter-back"] as const;
export const WHEELIE_MS = 720;

export interface CycleDraw {
  /** Eighths round from north: 2 east, 4 south. */
  dir8: number;
  time: number;
  delta: number;
  moving: boolean;
  /** The player's machine: driven by the held keys, with tricks and wheelies. */
  player: boolean;
  /** Progress through a jump, 0 to 1, or -1 on the ground. */
  air: number;
  /** Up off the saddle for a sprint. */
  standing: boolean;
  lit: boolean;
  tint: number;
  /** The rider's doll texture for a pose, frame and heading. */
  riderTexture: (pose: CyclePose, frame: number, dir8: number) => string | undefined;
}

/** Draws cycles: the ones standing about, and the ones being ridden, as a
 * layer behind the rider, the rider, and a layer in front. Holds the player's
 * momentum and whatever trick is in the air. */
export class CycleRider {
  readonly sprites: CycleSprites;
  /** Cells per second. */
  speed = 0;
  dir?: readonly [number, number];
  pedalling = false;
  /** Degrees of lean into a turn or a skid; the scene tweens it. */
  lean = 0;
  wheelieUntil = 0;
  chain = 0;
  chainUntil = 0;
  style = 0;
  private pedal = 0;
  private spin = 0;
  private trick?: { t: CycleTrick; from: number; done: number };
  private landed: CycleTrick[] = [];
  private under = new Map<string, Image>();
  private over = new Map<string, Image>();
  private parked = new Map<string, Image>();

  constructor(private scene: Phaser.Scene) {
    this.sprites = new CycleSprites(scene);
  }

  halt() {
    this.speed = 0;
    this.dir = undefined;
    this.pedalling = false;
  }

  /** A trick asked for at `air` through the jump; one at a time. */
  tryTrick(t: CycleTrick, air: number) {
    if (this.trick || air < 0 || air > 0.8) return false;
    this.trick = { t, from: air, done: 0 };
    return true;
  }

  /** Wheels down: the tricks finished in the air, and whether one was still going. */
  touchdown() {
    // Near enough round counts; a flip caught half way does not.
    if (this.trick && this.trick.done >= 0.8) this.landed.push(this.trick.t);
    const out = { tricks: this.landed, bail: !!this.trick && this.trick.done < 0.8 && this.trick.t.move !== "whip" };
    this.landed = [];
    this.trick = undefined;
    return out;
  }

  /** A machine standing or lying where it was left. */
  drawParked(o: WorldObject, x: number, y: number, depth: number, tint: number, fresh: (im: Image) => void) {
    const f = this.sprites.frame(o.cycle!, "side", { crank: 1, parked: !o.tipped, fallen: !!o.tipped, shadow: true });
    let im = this.parked.get(o.id);
    if (!im) {
      im = this.scene.add.image(x, y, f.under).setOrigin(0.5, ORIGIN_Y);
      this.parked.set(o.id, im);
      fresh(im);
    }
    let h = 0;
    for (let i = 0; i < o.id.length; i++) h = (h * 31 + o.id.charCodeAt(i)) | 0;
    if (im.texture.key !== f.under) im.setTexture(f.under);
    im.setPosition(x, y).setDepth(depth).setFlipX(!!(h & 4));
    if (im.tintTopLeft !== tint) im.setTint(tint);
    return im;
  }

  sweepParked(seen: Set<string>) {
    for (const [id, im] of this.parked)
      if (!seen.has(id)) {
        im.destroy();
        this.parked.delete(id);
      }
  }

  drop(id: string) {
    this.under.get(id)?.destroy();
    this.over.get(id)?.destroy();
    this.under.delete(id);
    this.over.delete(id);
  }

  hide(id: string) {
    this.under.get(id)?.setVisible(false);
    this.over.get(id)?.setVisible(false);
  }

  /** The ridden machine about the entity image `im`, which only marks the place: it is hidden. */
  draw(id: string, im: Image, rider: Image, look: CycleLook, o: CycleDraw) {
    const spec = CYCLE_SPECS[look.kind];
    let pedal: number, spin: number;
    const speed = o.player ? this.speed : spec.cruise * 0.55;
    if (o.player) {
      if (o.moving) {
        this.spin += o.delta * speed * 0.026;
        if (this.pedalling) this.pedal += o.delta * (0.006 + speed * 0.0009);
      }
      [pedal, spin] = [this.pedal, this.spin];
    } else [pedal, spin] = o.moving ? [o.time / 80, o.time / 30] : [2, 0];
    const crank = spec.motor ? 0 : Math.floor(pedal) % 8;

    let dir8 = o.dir8 & 7, angle = o.player ? this.lean : 0, squash = 1, centre = false;
    const side = dir8 % 4 !== 0;
    const nose = dir8 > 4 ? 1 : -1;
    if (o.player && this.trick && o.air >= 0) {
      const { t, from } = this.trick;
      const q = Math.min(1, Math.max(0, (o.air - from) / Math.max(0.08, 0.84 - from)));
      this.trick.done = q;
      if (t.move === "spin") dir8 = (dir8 + Math.floor(q * 8)) % 8;
      else if (t.move === "whip") angle += (side ? nose * 34 : 40) * Math.sin(Math.PI * q);
      else {
        centre = true;
        const turn = (t.move === "flip-back" ? 1 : -1) * q;
        if (side) angle += nose * 360 * turn;
        else squash = Math.cos(Math.PI * 2 * q);
      }
      if (q >= 1) {
        this.landed.push(t);
        this.trick = undefined;
      }
    } else if (o.player && this.trick && o.air < 0) this.trick = undefined;
    const wheelie = o.player && o.time < this.wheelieUntil ? Math.sin(Math.PI * (1 - (this.wheelieUntil - o.time) / WHEELIE_MS)) : 0;

    const flip = dir8 > 4, view = VIEWS[dir8], s = flip ? -1 : 1;
    const along = view !== "front" && view !== "back", turn = view === "quarter" ? 1 : view === "quarter-back" ? -1 : 0;
    const fast = o.moving && speed > 12.5;
    const f = this.sprites.frame(look, view, { crank, spin: fast ? 0 : Math.floor(spin) & 14, blur: fast, lit: o.lit });
    let pose = f.pose;
    if ((o.standing || o.air >= 0 || wheelie > 0.2) && (pose === "cycle" || pose === "cycle-tuck")) pose = "cycle-stand";
    const sat = CYCLE_SEATS[f.pose], now = CYCLE_SEATS[pose];
    // A pose that sits further back moves along the machine, which on a diagonal is across and up or down.
    const shift = along ? sat.ahead - now.ahead : 0;
    const rx = along ? f.rider[0] + (turn ? (shift * 2) / 3 : shift) : 0, ry = f.rider[1] + sat.pedalUp - now.pedalUp - (turn * shift) / 3;
    const frame = pose === "moto" ? 0 : pose === "cycle-scoot" && !o.moving ? 0 : crank;
    const texture = o.riderTexture(pose, frame, dir8);

    const gx = im.x, gy = im.y - 2;
    const endLift = along ? 0 : wheelie * 4;
    if (along) angle += nose * (turn ? 28 : 36) * wheelie * (dir8 === (o.dir8 & 7) ? 1 : 0);
    // Flips turn about the middle of rider and machine; a wheelie about the back tyre.
    const px = centre ? gx : wheelie && along ? gx + s * f.contact[0] : gx;
    const py = centre ? gy - 17 : gy;
    const rad = (angle * Math.PI) / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    const place = (img: Image, ax: number, ay: number) => {
      const dx = ax - px, dy = (ay - endLift - py) * squash;
      img
        .setPosition(Math.round(px + dx * cos - dy * sin), Math.round(py + dx * sin + dy * cos))
        .setAngle(angle)
        .setScale(im.scaleX, im.scaleY * squash)
        .setTint(o.tint)
        .setVisible(true);
    };
    let under = this.under.get(id);
    if (!under) this.under.set(id, (under = this.scene.add.image(gx, gy, f.under)));
    if (under.texture.key !== f.under) under.setTexture(f.under);
    place(under.setOrigin(0.5, ORIGIN_Y).setFlipX(flip).setDepth(im.depth), gx, im.y);
    if (texture) {
      // The doll's feet stand three rows above the bottom of its frame.
      if (rider.texture.key !== texture) rider.setTexture(texture);
      place(rider.setOrigin(0.5, 1).setFlipX(false).setDepth(im.depth + 0.05), gx + s * rx, gy - ry + 3);
    } else rider.setVisible(false);
    let over = this.over.get(id);
    if (f.over) {
      if (!over) this.over.set(id, (over = this.scene.add.image(gx, gy, f.over)));
      if (over.texture.key !== f.over) over.setTexture(f.over);
      place(over.setOrigin(0.5, ORIGIN_Y).setFlipX(flip).setDepth(im.depth + 0.1), gx, im.y);
    } else over?.setVisible(false);
    im.setVisible(false);
  }
}
