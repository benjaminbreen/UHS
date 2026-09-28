import type Phaser from "phaser";
import { route } from "../core/routing";
import { random } from "../core/random";
import { modernity } from "../content/settlements/modernity";
import type { WorldSetting } from "../content/geography/types";
import type { Point } from "../core/types";
import type { SettlementPlan } from "../world/v3/types";

/** Tiles per game second at a cab's trot, and a stride in tiles. */
const SPEED = 0.18;
const STRIDE = 2;
/** Where the hansom plied: from Hansom's patent to the motor taxi. */
const REGIONS = new Set(["britain", "western-europe", "north-america", "eastern-europe", "australasia"]);

type Cab = { path: Point[]; phase: number; wait: [number, number] };

/** Hansom cabs working a railway-age town: each waits on the rank by the
 * station, trots out to somewhere in town, waits there for a fare, and trots
 * back. Where one is is a function of the drawn clock alone. */
export class CabLayer {
  private cabs = new Map<string, Cab[]>();
  private images = new Map<string, Phaser.GameObjects.Image>();
  constructor(
    private scene: Phaser.Scene,
    private texture: (frame: string) => string,
  ) {}

  update(plan: SettlementPlan | undefined, setting: WorldSetting | undefined, seed: string, clock: number,
    view: Phaser.Geom.Rectangle, tint: number) {
    const seen = new Set<string>();
    if (plan && setting && setting.year >= 1834 && setting.year < 1925 && REGIONS.has(modernity(setting).id))
      for (const [i, cab] of this.fleet(plan, seed).entries()) {
        const at = where(cab, clock);
        if (!at) continue;
        const x = at.x * 16 + 8,
          y = at.y * 16 + 12;
        if (x < view.x - 100 || x > view.right + 100 || y < view.y - 60 || y > view.bottom + 140) continue;
        const id = `${plan.site.id}-cab-${i}`;
        seen.add(id);
        const frame = at.moving
          ? `vcab-hansom-trot-${at.facing}-${Math.floor(at.along / (STRIDE / 8)) % 8}`
          : `vcab-hansom-walk-${at.facing}-0`;
        let image = this.images.get(id);
        if (!image) {
          image = this.scene.add.image(x, y, this.texture(frame), frame).setOrigin(0.5, 112 / 148);
          this.images.set(id, image);
        } else if (image.frame.name !== frame || image.texture.key === "__DEFAULT") image.setTexture(this.texture(frame), frame);
        image.setPosition(Math.round(x), Math.round(y)).setDepth(y + 2).setTint(tint);
      }
    for (const [id, image] of this.images)
      if (!seen.has(id)) {
        image.destroy();
        this.images.delete(id);
      }
  }

  private fleet(plan: SettlementPlan, seed: string) {
    let fleet = this.cabs.get(plan.site.id);
    if (fleet) return fleet;
    fleet = [];
    const roads = [...plan.traffic].map((k) => {
      const [x, y] = k.split(",").map(Number);
      return { x, y };
    });
    const on = (p: Point) => plan.traffic.has(`${p.x},${p.y}`);
    const near = (p: Point) =>
      roads.reduce((best, q) => (Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y) ? q : best), roads[0]);
    const stand = plan.railway?.station?.door ?? plan.gatherings?.[0];
    if (!stand || roads.length < 50) return (this.cabs.set(plan.site.id, fleet), fleet);
    const rank = near(stand);
    const n = Math.max(2, Math.min(6, Math.round(roads.length / 600)));
    for (let i = 0; i < n * 3 && fleet.length < n; i++) {
      const roll = (k: string) => random(seed, "cab", plan.site.id, i, k);
      const far = roads.filter((q) => {
        const d = Math.hypot(q.x - rank.x, q.y - rank.y);
        return d > 25 && d < 80;
      });
      const to = far[Math.floor(roll("to") * far.length)];
      if (!to) break;
      // The streets by preference; a forecourt or a yard where it must, never
      // through a building.
      const found = route(rank, to, (p) => (on(p) ? 1 : plan.solid.has(`${p.x},${p.y}`) ? Infinity : 4),
        { diagonal: true, maxNodes: 20000 });
      if (found.status !== "found" || found.path.length < 10) continue;
      fleet.push({ path: [rank, ...found.path], phase: roll("phase"), wait: [60 + roll("out") * 120, 120 + roll("rank") * 360] });
    }
    this.cabs.set(plan.site.id, fleet);
    return fleet;
  }

  dispose() {
    for (const image of this.images.values()) image.destroy();
    this.images.clear();
    this.cabs.clear();
  }
}

/** Out along the path, a wait for a fare, back, a wait on the rank. */
function where(cab: Cab, clock: number) {
  const L = cab.path.length - 1;
  const drive = L / SPEED;
  const cycle = 2 * drive + cab.wait[0] + cab.wait[1];
  let t = (clock + cab.phase * cycle) % cycle;
  let along: number,
    back = false,
    moving = true;
  if (t < drive) along = t * SPEED;
  else if ((t -= drive) < cab.wait[0]) (along = L), (moving = false);
  else if ((t -= cab.wait[0]) < drive) (along = L - t * SPEED), (back = true);
  else (along = 0), (moving = false), (back = true);
  const i = Math.min(L - 1, Math.floor(along)),
    f = along - i;
  const a = cab.path[i],
    b = cab.path[i + 1];
  // Heading from a few cells on, so a staircase reads as a diagonal street.
  const ahead = cab.path[Math.min(L, i + 3)],
    behind = cab.path[Math.max(0, i - 2)];
  const [dx, dy] = back ? [behind.x - a.x, behind.y - a.y] : [ahead.x - a.x, ahead.y - a.y];
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    // The nearest of the eight facings, 0 north and clockwise.
    facing: dx || dy ? ((Math.round(Math.atan2(dx, -dy) / (Math.PI / 4)) % 8) + 8) % 8 : 4,
    moving,
    along: back ? 2 * L - along : along,
  };
}
