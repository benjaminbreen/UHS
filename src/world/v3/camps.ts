import { propSprite } from "../../content/props/place";
import type { Pack, Place, Position } from "../../core/types";
import { makeDoor } from "../../core/doors";
import {
  buildingModel,
  buildingRoofCells,
} from "../../content/graphics/models";
import { generateCharacter } from "../../content/characters/generate";
import { campKit } from "../../content/settlements/camps";
import { cellKey, eachCell, type SettlementPlan } from "./types";

export function planCamp(plan: SettlementPlan, pack: Pack, seed: string) {
  const setting = pack.setting!,
    situation = setting.situation!;
  const kit = campKit(setting),
    c = plan.site.center;
  const pos = (x: number, y: number): Position => ({
    x: c.x + x,
    y: c.y + y,
    space: "outside",
  });
  const offsets =
    kit.formation === "rows"
      ? [
          [-16, -17],
          [-7, -17],
          [6, -17],
          [15, -17],
          [-16, -6],
          [-7, -6],
          [6, -6],
          [15, -6],
        ]
      : kit.formation === "clusters"
        ? [
            [-13, -13],
            [-3, -17],
            [9, -12],
            [-15, 0],
            [11, 1],
            [-4, 10],
          ]
        : [
            [-13, -12],
            [-3, -17],
            [9, -12],
            [-15, 1],
            [11, 1],
            [-4, 11],
          ];
  const path = (x: number, y: number) => {
    const k = cellKey(x, y);
    if (plan.solid.has(k)) return;
    plan.traffic.add(k);
    plan.reserved.add(k);
    if (setting.climate !== "tundra") plan.surface.set(k, "dirt");
  };
  offsets.forEach(([x, y], i) => {
    const sprite = `camp-${kit.style}-${i % 2}`,
      model = buildingModel(sprite);
    const [w, h] = model.footprint,
      p = pos(x, y);
    const entrance = { x: p.x + model.entrance[0], y: p.y + model.entrance[1] };
    const place: Place = {
      id: `${plan.site.id}-camp-${i}`,
      name: `${kit.label} ${i + 1}`,
      description: kit.description,
      x: p.x,
      y: p.y,
      w,
      h,
      sprite,
      entrance,
      access: "public",
      owner: "",
      claim: "Shared camp",
      entranceLabel: "Tent opening",
    };
    plan.places.push(place);
    eachCell(place, (xx, yy) => {
      const k = cellKey(xx, yy);
      plan.solid.add(k);
      plan.reserved.add(k);
      plan.built?.add(k);
    });
    for (const cell of buildingRoofCells(sprite, place))
      plan.reserved.add(cellKey(cell.x, cell.y));
    plan.objects.push(makeDoor(place));
    for (
      let xx = Math.min(entrance.x, c.x);
      xx <= Math.max(entrance.x, c.x);
      xx++
    )
      path(xx, entrance.y);
    for (
      let yy = Math.min(entrance.y, c.y + 4);
      yy <= Math.max(entrance.y, c.y + 4);
      yy++
    )
      path(c.x, yy);
  });
  if (kit.formation === "rows") {
    const parts: { x: number; y: number; frame: string }[] = [];
    for (let i = -23; i <= 23; i++)
      for (const [x, y] of [
        [i, -24],
        [i, 21],
        [-23, i - 2],
        [23, i - 2],
      ]) {
        if (x === 0 || y === 0 || (Math.abs(x) < 2 && (y === -24 || y === 21)))
          continue;
        const p = pos(x, y),
          k = cellKey(p.x, p.y);
        if (plan.solid.has(k)) continue;
        parts.push({ ...p, frame: "fence" });
        plan.solid.add(k);
        plan.reserved.add(k);
      }
    plan.enclosures.push({
      x: c.x - 23,
      y: c.y - 24,
      w: 47,
      h: 46,
      gate: { x: c.x, y: c.y + 21 },
      parts,
    });
    for (let yy = -24; yy <= 22; yy++)
      for (let xx = -1; xx <= 1; xx++) path(c.x + xx, c.y + yy);
  }
  for (const [i, x, y, sprite, name] of [
    [0, 3, 3, "fire", "Camp hearth"],
    [1, 6, 3, "crate", kit.supplies],
    [2, 7, 3, "jug", "Drinking water"],
    [3, 2, 5, "bench", "Camp seat"],
    [4, 5, 5, "bench", "Camp seat"],
  ] as const) {
    plan.objects.push({
      id: `${plan.site.id}-camp-supply-${i}`,
      name,
      kind: sprite === "fire" ? "fire" : "container",
      pos: pos(x, y),
      prop: sprite === "fire" ? "campHearth" : sprite,
      sprite: propSprite(sprite === "fire" ? "campHearth" : sprite),
      inventory:
        sprite === "crate"
          ? { bread: 12 }
          : sprite === "jug"
            ? { water: 20 }
            : {},
      claim: "Shared camp",
    });
    plan.reserved.add(cellKey(c.x + x, c.y + y));
  }
  for (let i = 0; i < situation.people; i++) {
    const tent = plan.places[i % plan.places.length],
      home = { ...tent.entrance, space: "outside" };
    const at = pos(-6 + (i % 6) * 2, 7 + Math.floor(i / 6) * 2),
      id = `${plan.site.id}-camper-${i}`;
    plan.actors.push({
      ...generateCharacter(setting, seed, id, 25 + (i % 25), kit.role),
      id,
      kind: "human",
      pos: at,
      home,
      work: at,
      sprite: `human-${i % 3}-${i % 6}`,
      inventory: { water: 2, bread: 2 },
      activity: kit.activity,
      fatigue: 0,
      hunger: 5,
      trust: 1,
      memories: [],
      direction: 2,
    });
    plan.reserved.add(cellKey(at.x, at.y));
  }
  if (situation.camp === "pastoral")
    for (let i = 0; i < 6; i++) {
      const at = pos(18 + (i % 3), 7 + Math.floor(i / 3)),
        id = `${plan.site.id}-flock-${i}`;
      plan.actors.push({
        id,
        name: "Sheep",
        role: "Flock animal",
        kind: "sheep",
        pos: at,
        home: at,
        work: at,
        sprite: "sheep0",
        inventory: {},
        activity: "Grazing",
        fatigue: 0,
        hunger: 0,
        trust: 0,
        memories: [],
        direction: 2,
      });
    }
  plan.spawn = { x: c.x, y: c.y + 5 };
  plan.gatherings = [{ x: c.x + 3, y: c.y + 5 }];
  return plan;
}
