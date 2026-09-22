import type { Pack, Place, Position, WorldModel, WorldObject } from "../../../core/types";
import { random } from "../../../core/random";
import { detailProps, graveAxis, muslimBurialStyle, settlementDetails } from "./index";

export type DetailPlacement = {
  free: (pos: Position, prop: string) => boolean;
  add: (object: WorldObject) => void;
  reserve: (cells: Position[]) => void;
};
const gap = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

function edgeSpots(b: Place): Position[] {
  const spots: Position[] = [];
  for (let away = 2; away <= 5; away++) {
    for (const x of [b.x - away, b.x + b.w + away])
      for (const y of [b.y + b.h - 1, b.y + b.h + 1, b.y + Math.floor(b.h / 2)])
        spots.push({ x, y, space: "outside" });
    for (const x of [b.x + 1, b.x + b.w - 2])
      spots.push({ x, y: b.y + b.h + away, space: "outside" });
  }
  return spots;
}

export function placeSettlementDetails(world: WorldModel, seed: string, placement: DetailPlacement) {
  const buildings = world.places.filter(b => !b.structure && b.w >= 2 && b.h >= 2);
  const settlements = world.settlements.length ? world.settlements : [{ id: "local", name: world.pack.name, ...world.spawn, size: 50 }];
  const groups = new Map<string, Place[]>();
  for (const b of buildings) {
    const town = settlements.reduce((a, v) => gap(b, a) <= gap(b, v) ? a : v);
    const list = groups.get(town.id) ?? []; list.push(b); groups.set(town.id, list);
  }
  const ids = new Set(world.initialObjects.map(o => o.id));
  for (const [townId, houses] of groups) {
    const town = settlements.find(t => t.id === townId)!;
    const pack: Pack = world.geography?.packAt(town.x, town.y) ?? world.pack;
    // The world pins placement; local geography supplies the dated culture.
    if (!pack.setting) continue;
    const rules = settlementDetails(pack);
    if (!rules.length && !muslimBurialStyle(pack.setting)) continue;
    for (const rule of rules) {
      const prefix = `${townId}-detail-${rule.id}-`;
      const existing = world.initialObjects.filter(o => o.id.startsWith(prefix));
      const target = Math.min(rule.limit, Math.max(1, Math.ceil(houses.length / rule.perBuildings)));
      const choices = houses.filter(b => !rule.trade || rule.trade.test(b.name))
        .sort((a, b) => random(seed, rule.id, a.id) - random(seed, rule.id, b.id) || a.id.localeCompare(b.id));
      for (const b of choices) {
        if (existing.length >= target) break;
        const id = `${prefix}${b.id}`;
        if (ids.has(id)) continue;
        const pos = edgeSpots(b).find(p => placement.free(p, rule.prop) && existing.every(o => gap(o.pos, p) >= rule.spacing));
        if (!pos) continue;
        const variant = rule.variants[Math.floor(random(seed, "street-detail-form", id) * rule.variants.length)];
        const def = detailProps[rule.prop];
        const object: WorldObject = {
          id, name: rule.name, description: rule.description, prop: rule.prop,
          kind: def.drink ? "well" : "monument", pos, inventory: {},
          sprite: `study-propb-${def.family}-${variant}`,
        };
        placement.add(object); existing.push(object); ids.add(id);
      }
    }
    const s = pack.setting;
    if (!s || s.settlement === "camp" || s.settlement === "farm") continue;
    const burial = muslimBurialStyle(s);
    const prefix = `${townId}-burial-`;
    if (!burial || world.initialObjects.some(o => o.id.startsWith(prefix))) continue;
    const axis = graveAxis(s);
    const outskirts = [...houses].sort((a, b) => gap(b, town) - gap(a, town) || a.id.localeCompare(b.id));
    let found = false;
    for (const b of outskirts) {
      if (found) break;
      for (const at of edgeSpots(b)) {
        const cells: Position[] = [];
        for (let y = -2; y <= 3; y++) for (let x = -1; x <= 5; x++) cells.push({ x: at.x + x, y: at.y + y, space: "outside" });
        if (!cells.every(p => ["grass", "dry", "sand", "dirt"].includes(world.terrain(p.x, p.y)) && placement.free(p, "burialStone"))) continue;
        const graves = [[0, 0], [3, 0], [0, 3], [3, 3]];
        graves.forEach(([dx, dy], i) => {
          const variant = (burial === "ottoman" && i === 0 ? 4 : i % 2 ? 2 : 0) + axis;
          placement.add({
            id: `${prefix}${i}`, name: "Small neighborhood burial ground",
            description: "One of four aligned graves in a small burial plot. Plain head and foot stones predominate; carved headgear is reserved for one Ottoman example. The grave axis approximates the local qibla on the tile grid.",
            prop: "burialStone", kind: "monument", inventory: {},
            pos: { x: at.x + dx, y: at.y + dy, space: "outside" },
            sprite: `study-propb-burial-stone-${variant}`,
          });
        });
        placement.reserve(cells); found = true; break;
      }
    }
  }
}
