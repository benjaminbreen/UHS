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
      for (let iy = 0; iy < 4; iy++)
        for (let ix = 0; ix < 4; ix++) {
          const px =
              cx * 64 +
              ix * 16 +
              4 +
              Math.floor(random(seed, k, ix, iy, "bx") * 8),
            py =
              cy * 64 +
              iy * 16 +
              4 +
              Math.floor(random(seed, k, ix, iy, "by") * 8);
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
          // Reject non-rock candidates before sampling their footprint.
          const sample = world.topography?.(px, py);
          if (sample?.waterDepth) continue;
          const exposed = sample?.habitat?.exposed ?? 0;
          const outcrop = sample?.landscape?.kind === "outcrop" ? sample.landscape.strength : 0;
          const strong = exposed > 0.45 || outcrop > 0.2;
          const sizeRoll = random(seed, k, ix, iy, "rock-size");
          const size = strong
            ? sizeRoll < 0.18 ? "large" : sizeRoll < 0.72 ? "medium" : undefined
            : sizeRoll < 0.18 ? "medium" : undefined;
          const [width, depth] = size === "large" ? [5, 2] : size === "medium" ? [3, 1] : [1, 1];
          const left = px - (width - 1) / 2, top = py - depth + 1;
          let clear = true;
          for (let dy = 0; dy < depth && clear; dy++)
            for (let dx = 0; dx < width; dx++) {
              const x = left + dx, y = top + dy;
              if (world.terrain(x, y, "outside") !== "rock" ||
                world.blocked(x, y, "outside") || world.protectedCell?.(x, y) ||
                Math.hypot(x - world.spawn.x, y - world.spawn.y) < 6 ||
                world.topography?.(x, y)?.height !== sample?.height ||
                world.topography?.(x, y)?.waterDepth ||
                world.places.some((p) => Math.hypot(x - p.entrance.x, y - p.entrance.y) < 10) ||
                world.initialObjects.some((o) => o.pos.space === "outside" &&
                  x >= o.pos.x - 1 && x < o.pos.x + (o.size?.[0] ?? 1) + 1 &&
                  y >= o.pos.y - 1 && y < o.pos.y + (o.size?.[1] ?? 1) + 1) ||
                world.initialActors.some((a) => a.pos.space === "outside" && Math.hypot(x-a.pos.x,y-a.pos.y)<2)) {
                clear = false;
                break;
              }
            }
          if (!clear) continue;
          const id = `boulder-${px}-${py}`;
          if (world.initialObjects.some((o) => o.id === id)) continue;
          const object: WorldObject = {
            id,
            name: size === "large" ? "Large boulder" : size === "medium" ? "Rock outcrop" : "Boulder",
            kind: "monument",
            prop: size ? "outcrop" : "boulder",
            sprite: boulderFrame(
              sample?.habitat,
              random(seed, k, ix, iy, "stone"),
              size,
            ),
            inventory: {},
            pos: { x: left, y: top, space: "outside" },
            ...(size ? { size: [width, depth] as [number, number] } : {}),
          };
          world.initialObjects.push(object);
        }
    }
}
