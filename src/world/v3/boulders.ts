import type { WorldModel, WorldObject } from "../../core/types";
import { random } from "../../core/random";
import { boulderFrame } from "../../content/ecology/rocks";

const seeded = new WeakMap<WorldModel, Set<string>>();
/** The most a cell's rockiness can come to, so the roll can be culled before
 * anything expensive is asked about the cell. */
const MOST = 0.55;
export function addBoulders(
  world: WorldModel,
  seed: string,
  x: number,
  y: number,
) {
  let done = seeded.get(world);
  if (!done) seeded.set(world, (done = new Set()));
  const gx = Math.floor(x / 64),
    gy = Math.floor(y / 64);
  for (let cy = gy - 1; cy <= gy + 1; cy++)
    for (let cx = gx - 1; cx <= gx + 1; cx++) {
      const k = `${cx},${cy}`;
      if (done.has(k)) continue;
      done.add(k);
      // One candidate per 32 cells: a boulder every other block of rocky
      // ground, and none at all on soft ground.
      for (let iy = 0; iy < 2; iy++)
        for (let ix = 0; ix < 2; ix++) {
          const px =
              cx * 64 +
              ix * 32 +
              6 +
              Math.floor(random(seed, k, ix, iy, "bx") * 20),
            py =
              cy * 64 +
              iy * 32 +
              6 +
              Math.floor(random(seed, k, ix, iy, "by") * 20);
          // The roll comes first and the ground second: sampling topography
          // for every candidate forced terrain generation across the whole
          // district, which cost more than everything else here put together.
          const roll = random(seed, k, ix, iy, "boulder");
          if (roll > MOST * 0.4) continue;
          const ground = world.terrain(px, py, "outside");
          if (ground !== "rock") continue;
          if (
            world.blocked(px, py, "outside") ||
            world.protectedCell?.(px, py) ||
            world.places.some(
              (p) => Math.hypot(px - p.entrance.x, py - p.entrance.y) < 10,
            )
          )
            continue;
          // Only a cell that has earned a boulder is worth a topography read,
          // and that read is only for which stone it should be.
          const sample = world.topography?.(px, py);
          if (sample?.waterDepth) continue;
          const id = `boulder-${px}-${py}`;
          if (world.initialObjects.some((o) => o.id === id)) continue;
          const object: WorldObject = {
            id,
            name: "Boulder",
            kind: "monument",
            prop: "boulder",
            sprite: boulderFrame(
              sample?.habitat,
              random(seed, k, ix, iy, "stone"),
            ),
            inventory: {},
            pos: { x: px, y: py, space: "outside" },
          };
          world.initialObjects.push(object);
        }
    }
}
