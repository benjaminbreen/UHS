import { random } from "../../core/random";
import type { WorldModel } from "../../core/types";
import type { FaunaGroup } from "../../core/fauna";
import {
  faunaAt,
  faunaProfile,
  type FaunaProfile,
  type HabitatTag,
} from "../../content/fauna";

/** What the cell offers an animal, read off the topography it already has. */
export function habitatTagsAt(world: WorldModel, x: number, y: number) {
  const tags = new Set<HabitatTag>();
  const cell = world.topography?.(x, y);
  if (!cell) return tags;
  const terrain = world.terrain(x, y, "outside");
  if (cell.field) tags.add(cell.field.crop === "pasture" ? "pasture" : "field");
  if (cell.feature === "paving") tags.add("settlement");
  if (
    cell.feature === "bank" ||
    (cell.waterVisual &&
      cell.waterVisual.distance >= 0 &&
      cell.waterVisual.distance < cell.waterVisual.shoreWidth)
  )
    tags.add("shore");
  if (terrain === "marsh") tags.add("wetland");
  if (terrain === "rock") tags.add("rock");
  const h = cell.habitat;
  if (h) {
    if (h.kind === "open" || h.kind === "meadow") tags.add("open-grass");
    if (h.kind === "scrub" || h.ecology === "dry-scrub") tags.add("scrub");
    if (h.kind === "woodland") tags.add("woodland");
    if (h.kind === "hollow" || h.ecology === "wetland") tags.add("wetland");
    if (h.kind === "exposed") tags.add("rock");
    // An edge is where cover changes within a few cells either way.
    const wooded = h.kind === "woodland";
    for (const [dx, dy] of [
      [3, 0],
      [-3, 0],
      [0, 3],
      [0, -3],
    ]) {
      const other = world.topography?.(x + dx, y + dy)?.habitat;
      if (other && (other.kind === "woodland") !== wooded) {
        tags.add("forest-edge");
        break;
      }
    }
  }
  if (settlementDistance(world, x, y) < 3) tags.add("settlement");
  return tags;
}

/** Cells from the edge of the nearest settlement that has been built. */
export function settlementDistance(world: WorldModel, x: number, y: number) {
  let best = Infinity;
  for (const s of world.settlements)
    best = Math.min(best, Math.hypot(s.x - x, s.y - y) - s.size);
  return best;
}

function suitability(profile: FaunaProfile, tags: Set<HabitatTag>) {
  let best = 0;
  for (const h of profile.habitats) if (tags.has(h.tag)) best = Math.max(best, h.weight);
  return best;
}

const spawned = new WeakMap<WorldModel, Set<string>>();
const ATTEMPTS = 8;

/** The 64-cell block a cell belongs to. */
export function faunaBlockOf(x: number, y: number) {
  return `${Math.floor(x / 64)},${Math.floor(y / 64)}`;
}

/** Let a block spawn again. The engine calls this when it drops the groups of
 * a block the player has walked far away from, so walking a long way does not
 * grow the save without bound and walking back still finds animals there. */
export function forgetFaunaBlock(world: WorldModel, key: string) {
  spawned.get(world)?.delete(key);
}

/** Wild and commensal groups for the 64-cell blocks round (x, y) that have
 * not been visited yet. Same seed, same block, same animals. */
export function spawnFauna(
  world: WorldModel,
  seed: string,
  x: number,
  y: number,
) {
  let done = spawned.get(world);
  if (!done) spawned.set(world, (done = new Set()));
  const groups: FaunaGroup[] = [];
  const gx = Math.floor(x / 64),
    gy = Math.floor(y / 64);
  for (let cy = gy - 1; cy <= gy + 1; cy++)
    for (let cx = gx - 1; cx <= gx + 1; cx++) {
      const k = `${cx},${cy}`;
      if (done.has(k)) continue;
      done.add(k);
      const setting = (
        world.geography?.packAt(cx * 64 + 32, cy * 64 + 32) ?? world.pack
      ).setting;
      if (!setting?.environment) continue;
      for (const p of faunaAt(setting)) {
        if (p.density <= 0) continue;
        for (let i = 0; i < ATTEMPTS; i++) {
          const px = cx * 64 + 4 + Math.floor(random(seed, "fauna", k, p.id, i, "x") * 56),
            py = cy * 64 + 4 + Math.floor(random(seed, "fauna", k, p.id, i, "y") * 56);
          if (world.blocked(px, py, "outside") || world.protectedCell?.(px, py))
            continue;
          const d = settlementDistance(world, px, py);
          if (d < p.minimumSettlementDistance) continue;
          let chance = (p.density / ATTEMPTS) * suitability(p, habitatTagsAt(world, px, py));
          // Town birds keep to the town: far from one they are a rare stray.
          if (p.category === "commensal" && d > 6) chance *= 0.15;
          if (random(seed, "fauna", k, p.id, i, "present") >= chance) continue;
          const members = placeMembers(world, seed, `${k}:${p.id}:${i}`, p, px, py);
          if (!members.length) continue;
          const bird = p.locomotion === "ground-and-flight";
          groups.push({
            id: `fauna-${p.id}-${cx}-${cy}-${i}`,
            speciesId: p.id,
            members,
            pos: { x: px, y: py, space: "outside" },
            home: { x: px, y: py, space: "outside" },
            homeRadius: bird ? 10 : p.cohesionRadius * 3,
            state: bird ? "perch" : "idle",
            nextDecisionAt: 0,
            stride: 0,
            since: 0,
          });
          // Young keep to the adults: a colony of kits with no doe is wrong.
          const young = p.young && faunaProfile(p.young.id);
          if (
            young &&
            random(seed, "fauna", k, p.id, i, "young") < p.young!.chance
          ) {
            const yx = px + 2,
              yy = py + 1;
            const kits = placeMembers(
              world,
              seed,
              `${k}:${young.id}:${i}`,
              young,
              yx,
              yy,
            );
            if (kits.length)
              groups.push({
                id: `fauna-${young.id}-${cx}-${cy}-${i}`,
                speciesId: young.id,
                members: kits,
                pos: { x: yx, y: yy, space: "outside" },
                home: { x: px, y: py, space: "outside" },
                homeRadius: young.cohesionRadius * 2,
                state: "idle",
                nextDecisionAt: 0,
                stride: 0,
                since: 0,
              });
          }
        }
      }
    }
  return groups;
}

/** The group's animals on free cells of the anchor's level, leader first. */
export function placeMembers(
  world: WorldModel,
  seed: string,
  key: string,
  p: FaunaProfile,
  x: number,
  y: number,
) {
  const count =
    p.groupSize[0] +
    Math.floor(random(seed, "fauna", key, "count") * (p.groupSize[1] - p.groupSize[0] + 1));
  const level = world.topography?.(x, y).height;
  const members: FaunaGroup["members"][number][] = [
    { x, y, direction: random(seed, "fauna", key, "face") < 0.5 ? 1 : 3 },
  ];
  const used = new Set([`${x},${y}`]);
  for (let ring = 1; ring <= p.cohesionRadius && members.length < count; ring++)
    for (let dy = -ring; dy <= ring && members.length < count; dy++)
      for (let dx = -ring; dx <= ring && members.length < count; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        if (random(seed, "fauna", key, dx, dy) > 0.45) continue;
        const cx = x + dx,
          cy = y + dy,
          ck = `${cx},${cy}`;
        if (used.has(ck) || world.blocked(cx, cy, "outside")) continue;
        if (level !== undefined && world.topography?.(cx, cy).height !== level)
          continue;
        used.add(ck);
        members.push({
          x: cx,
          y: cy,
          direction: random(seed, "fauna", key, dx, dy, "face") < 0.5 ? 1 : 3,
        });
      }
  return members;
}
