import type { Actor, Pack, Point, Position, Terrain } from "../../core/types";
import { proceduralName } from "../../content/geography/character";
import { random } from "../../core/random";
import { buildingModel, buildingModels } from "../../content/graphics/models";
import { crossing, planRoad, roadCells, type Sample } from "./roads";
import {
  cellKey,
  eachCell,
  type Rect,
  type Road,
  type SettlementPlan,
  type Site,
} from "./types";
export function planSettlement(
  site: Site,
  pack: Pack,
  seed: string,
  sample: Sample,
  connections: Road[],
): SettlementPlan {
  const c = site.center,
    profile = site.profile,
    r = profile.radius;
  const bounds = {
    x: c.x - r - 40,
    y: c.y - r - 40,
    w: (r + 40) * 2,
    h: (r + 40) * 2,
  };
  const plan: SettlementPlan = {
    site,
    roads: [],
    plots: [],
    places: [],
    objects: [],
    actors: [],
    enclosures: [],
    surface: new Map(),
    traffic: new Set(),
    reserved: new Set(),
    solid: new Set(),
    work: new Map(),
    slots: new Map(),
    spawn: { ...c },
    diagnostics: { routeFailures: 0, rejectedBuildings: 0 },
  };
  const roads = plan.traffic,
    bridges = new Set<string>(),
    noRoad = new Set<string>();
  const rand = (...k: (string | number)[]) =>
    random(seed, "settlement-3", site.id, ...k);
  const pos = (p: Point): Position => ({ ...p, space: "outside" });
  const paint = (rect: Rect, t: Terrain, reserve = true) =>
    eachCell(rect, (x, y) => {
      plan.surface.set(cellKey(x, y), t);
      if (reserve) plan.reserved.add(cellKey(x, y));
    });
  const addRoad = (road: Road) => {
    plan.roads.push(road);
    roadCells(road, (x, y) => {
      const k = cellKey(x, y),
        f = sample(x, y);
      if (f.water < 0 && !bridges.has(k)) return;
      plan.surface.set(
        k,
        f.water < 0
          ? "bridge"
          : profile.paved && road.width > 0
            ? "paving"
            : "dirt",
      );
      roads.add(k);
      plan.reserved.add(k);
    });
  };
  const selected = crossing(`${site.id}-bridge`, c, sample, r);
  for (const bridge of [
    ...connections.filter((p) => p.kind === "bridge"),
    ...(selected ? [selected] : []),
  ]) {
    roadCells(bridge, (x, y) => bridges.add(cellKey(x, y)));
    addRoad(bridge);
  }
  for (const road of connections.filter((p) => p.kind !== "bridge"))
    addRoad(road);
  const connect = (
    a: Point,
    b: Point,
    label: string,
    width = 1,
    area = bounds,
  ) => {
    const road = planRoad(
      `${site.id}-${label}`,
      a,
      b,
      sample,
      roads,
      bridges,
      new Set([...plan.solid, ...noRoad]),
      area,
      width,
      width ? 2 : 1,
    );
    if (road) addRoad(road);
    else plan.diagnostics.routeFailures++;
    return road;
  };
  const dry = (rect: Rect, occupied = true) => {
    let lo = Infinity,
      hi = -Infinity,
      valid = true;
    eachCell(rect, (x, y) => {
      const f = sample(x, y);
      lo = Math.min(lo, f.elevation);
      hi = Math.max(hi, f.elevation);
      if (f.water < 4 || (occupied && plan.reserved.has(cellKey(x, y))))
        valid = false;
    });
    return valid && (pack.setting?.terrainRevision ? hi === lo : hi - lo < 28);
  };
  // Reserve the common first. Its water/hearth objects sit at the edge, never in the through route.
  const half = pack.setting?.terrainRevision
    ? 2
    : profile.plaza === "court"
      ? 4
      : profile.plaza === "market"
        ? 7
        : 5;
  const publicArea = {
    x: c.x - half,
    y: c.y - half,
    w: half * 2 + 1,
    h: half * 2 + 1,
  };
  eachCell(publicArea, (x, y) => {
    if (sample(x, y).water >= 0) {
      plan.surface.set(cellKey(x, y), profile.paved ? "paving" : "dirt");
      plan.reserved.add(cellKey(x, y));
      roads.add(cellKey(x, y));
    }
  });
  plan.plots.push({
    ...publicArea,
    id: `${site.id}-public`,
    kind: "public",
    access: { ...c },
  });
  const water = { x: c.x + 4, y: c.y - 3 },
    waterStand = { x: c.x + 3, y: c.y - 2 };
  plan.objects.push({
    id: `${site.id}-water`,
    name: "Shared water source",
    kind: "well",
    pos: pos(water),
    sprite: "well",
    inventory: {},
  });
  plan.objects.push({
    id: `${site.id}-hearth`,
    name: "Shared hearth",
    kind: "fire",
    pos: pos({ x: c.x - 4, y: c.y + 3 }),
    sprite: "fire",
    inventory: {},
  });
  for (const [i, dx, dy] of [
    [0, -1, 0],
    [1, 1, 0],
    [2, 0, -1],
    [3, 0, 1],
  ]) {
    if (profile.pattern === "farmstead" && i === 2) continue;
    let goal: Point | undefined;
    for (
      let distance =
        profile.pattern === "farmstead"
          ? i === 3
            ? r - 10
            : 32
          : profile.pattern === "roadside" && i > 1
            ? 32
            : r - 10;
      distance >= 18;
      distance -= 6
    ) {
      const q = { x: c.x + dx * distance, y: c.y + dy * distance };
      if (dry({ x: q.x - 2, y: q.y - 2, w: 5, h: 5 }, false)) {
        goal = q;
        break;
      }
    }
    if (goal)
      connect(
        c,
        goal,
        `approach${i}`,
        pack.setting?.settlement === "camp" ? 0 : 1,
      );
  }
  if (selected) {
    connect(c, selected.points[0], "bridge-approach-a");
    connect(c, selected.points.at(-1)!, "bridge-approach-b");
  }
  if (
    profile.pattern === "planned" ||
    profile.pattern === "dense" ||
    profile.pattern === "waterfront"
  ) {
    for (const offset of profile.pattern === "dense"
      ? [-47, -22, 19, 49]
      : [-52, -26, 26, 52])
      for (const vertical of [false, true]) {
        const bend =
          profile.pattern === "dense"
            ? Math.round(
                (rand("lane-bend", offset, Number(vertical)) - 0.5) * 12,
              )
            : 0;
        const a = {
            x: c.x + (vertical ? offset : -r + 20),
            y: c.y + (vertical ? -r + 20 : offset),
          },
          b = {
            x: c.x + (vertical ? offset + bend : r - 20),
            y: c.y + (vertical ? r - 20 : offset + bend),
          };
        if (
          !dry({ x: a.x - 1, y: a.y - 1, w: 3, h: 3 }, false) ||
          !dry({ x: b.x - 1, y: b.y - 1, w: 3, h: 3 }, false)
        )
          continue;
        const band = vertical
          ? { x: a.x - 8, y: a.y, w: 24, h: b.y - a.y }
          : { x: a.x, y: a.y - 8, w: b.x - a.x, h: 24 };
        connect(a, b, `lane-${offset}-${vertical}`, 0, band);
      }
  } else if (profile.pattern === "clustered") {
    // Small household courts create several centers instead of a single street cross.
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + rand("court-angle"),
        q = {
          x: c.x + Math.round(Math.cos(a) * 30),
          y: c.y + Math.round(Math.sin(a) * 30),
        };
      const court = { x: q.x - 3, y: q.y - 3, w: 7, h: 7 };
      if (dry(court) && connect(c, q, `court${i}`, 0)) {
        paint(court, "dirt");
        eachCell(court, (x, y) => roads.add(cellKey(x, y)));
        plan.plots.push({
          ...court,
          id: `${site.id}-court${i}`,
          kind: "public",
          access: q,
        });
      }
    }
  }
  if (profile.pattern === "waterfront") {
    let shore: Point | undefined,
      best = Infinity;
    for (let y = c.y - r; y < c.y + r; y += 2)
      for (let x = c.x - r; x < c.x + r; x += 2) {
        const f = sample(x, y),
          d = Math.hypot(x - c.x, y - c.y);
        if (f.kind === "sea" && f.water >= 4 && f.water < 8 && d < best) {
          best = d;
          shore = { x, y };
        }
      }
    if (shore && connect(c, shore, "landing")) {
      const landing = { x: shore.x - 4, y: shore.y - 3, w: 9, h: 7 };
      eachCell(landing, (x, y) => {
        if (sample(x, y).water >= 0) {
          plan.surface.set(cellKey(x, y), "paving");
          plan.reserved.add(cellKey(x, y));
        }
      });
      plan.plots.push({
        ...landing,
        id: `${site.id}-landing`,
        kind: "public",
        access: shore,
      });
    }
  }
  // Sample street frontage; fit the entire building and yard before accepting an entrance.
  const frontage: { point: Point; nx: number; ny: number }[] = [];
  for (const road of plan.roads.filter((p) => p.kind !== "bridge"))
    for (
      let j = profile.frontage;
      j < road.points.length;
      j += profile.frontage
    ) {
      const p = road.points[j],
        a = road.points[j - 1];
      if (
        Math.hypot(p.x - c.x, p.y - c.y) > r - 10 ||
        Math.hypot(p.x - c.x, p.y - c.y) < 10
      )
        continue;
      const dx = Math.sign(p.x - a.x),
        dy = Math.sign(p.y - a.y);
      if (!dx && !dy) continue;
      for (const sign of [-1, 1])
        frontage.push({ point: p, nx: -dy * sign, ny: dx * sign });
    }
  frontage.sort(
    (a, b) =>
      Math.hypot(a.point.x - c.x, a.point.y - c.y) -
        Math.hypot(b.point.x - c.x, b.point.y - c.y) ||
      a.point.x - b.point.x ||
      a.point.y - b.point.y,
  );
  const owners: string[] = [];
  for (
    let j = 0;
    j < frontage.length && plan.places.length < profile.buildings;
    j++
  ) {
    const { point, nx, ny } = frontage[j],
      i = plan.places.length;
    const base =
      pack.buildings[Math.floor(rand("building", j) * pack.buildings.length)];
    const facing =
      nx > 0 ? "west" : nx < 0 ? "east" : ny > 0 ? "north" : "south";
    const frame = buildingModels[`${base}-${facing}`]
        ? `${base}-${facing}`
        : base,
      model = buildingModel(frame),
      [w, h] = model.footprint;
    // Old assets are only used south-facing until their oriented recipes are available.
    if (frame === base && facing !== "south") continue;
    const setback = profile.paved ? 3 : 4;
    const door = { x: point.x + nx * setback, y: point.y + ny * setback };
    const rect = {
      x: door.x - model.entrance[0],
      y: door.y - model.entrance[1],
      w,
      h,
    };
    const yard = {
      x: rect.x - 1 + (nx < 0 ? -4 : 0),
      y: rect.y - 1 + (ny < 0 ? -4 : 0),
      w: w + 2 + (nx ? 4 : 0),
      h: h + 2 + (ny ? 4 : 0),
    };
    if (!dry(yard)) {
      plan.diagnostics.rejectedBuildings++;
      continue;
    }
    const id = `${site.id}-h${i}`,
      owner =
        site.home && i === 0
          ? "player"
          : profile.pattern === "farmstead" && i % 3 !== 0
            ? owners.at(-1)!
            : `${id}-person`;
    const workPoint = {
      x: rect.x + (nx > 0 ? w + 2 : nx < 0 ? -2 : Math.floor(w / 2)),
      y: rect.y + (ny > 0 ? h + 2 : ny < 0 ? -2 : Math.floor(h / 2)),
    };
    if (!connect(door, point, `door${i}`, 0)) continue;
    const entranceLabel =
      model.opening === "roof-hatch" ? "Climb inside" : "Enter";
    const role =
      owner === "player"
        ? pack.role
        : profile.fields !== "none"
          ? i % 3 === 0
            ? "Farmer"
            : i % 3 === 1
              ? "Herder"
              : pack.roles[i % pack.roles.length]
          : pack.roles[i % pack.roles.length];
    eachCell(rect, (x, y) => plan.solid.add(cellKey(x, y)));
    if (!connect(workPoint, door, `yard-access${i}`, 0)) {
      eachCell(rect, (x, y) => plan.solid.delete(cellKey(x, y)));
      continue;
    }
    plan.places.push({
      id,
      name:
        i % 4 === 1
          ? `${role}'s workshop`
          : i % 4 === 2
            ? "Household stores"
            : "Household",
      description: model.description,
      x: rect.x,
      y: rect.y,
      w,
      h,
      sprite: frame,
      entrance: door,
      access: i % 4 === 1 ? "public" : "household",
      owner,
      claim: "landscape",
      entranceLabel,
    });
    paint(yard, "dirt");

    plan.plots.push({
      ...yard,
      id: `${id}-plot`,
      kind: "household",
      owner,
      access: door,
    });
    const side = {
      x: workPoint.x + (ny ? 2 : 0),
      y: workPoint.y + (nx ? 2 : 0),
    };
    plan.slots.set(id, {
      yard: [side],
      work: [{ x: workPoint.x - (ny ? 2 : 0), y: workPoint.y - (nx ? 2 : 0) }],
    });
    if (!owners.includes(owner)) {
      owners.push(owner);
      const home = pos(door);
      const a: Actor = {
        id: owner,
        name: proceduralName(pack.setting!, seed, owner),
        role,
        kind: "human",
        pos: { ...home },
        home,
        work: pos(workPoint),
        sprite: `human-${i % 3}-${i % 6}`,
        inventory:
          role === "Farmer"
            ? { grain: 8, water: 2, tool: 1 }
            : role === "Herder"
              ? { wool: 4, water: 2 }
              : role === "Weaver"
                ? { flax: 5, wool: 3, water: 2 }
                : { [pack.trade.take]: 4, [pack.trade.give]: 3, water: 2 },
        activity: "Household work",
        fatigue: 0,
        hunger: 5,
        trust: i % 3 === 0 ? 2 : 1,
        memories: [],
        direction: 2,
      };
      if (owner !== "player") plan.actors.push(a);
      plan.work.set(owner, {
        home: door,
        work: workPoint,
        water: waterStand,
        social: { x: c.x - 2 + (i % 4), y: c.y + 1 + (Math.floor(i / 4) % 3) },
        label:
          role === "Weaver"
            ? "Weaving"
            : role === "Merchant"
              ? "Trading"
              : `${role} at work`,
        offset: Math.floor(rand(owner, "schedule") * 45),
      });
    }
    plan.objects.push(
      {
        id: `${id}-store`,
        name: "Household stores",
        kind: "container",
        pos: pos(side),
        sprite: "basket",
        inventory: { grain: 4, wood: 2 },
        owner,
      },
      {
        id: `${id}-exit`,
        name:
          model.opening === "roof-hatch" ? "Roof ladder" : "Door to the street",
        kind: "exit",
        pos: { x: 6, y: 9, space: id },
        sprite: model.opening === "roof-hatch" ? "ladder" : "door-open",
        inventory: {},
        owner,
      },
      {
        id: `${id}-bed`,
        name: "Sleeping place",
        kind: "bed",
        pos: { x: 4, y: 3, space: id },
        sprite: "bed",
        inventory: {},
        owner,
      },
      {
        id: `${id}-chest`,
        name: "Household chest",
        kind: "container",
        pos: { x: 8, y: 3, space: id },
        sprite: "basket",
        inventory: { grain: 3, wood: 2 },
        owner,
      },
    );
  }
  function landPlot(w: number, h: number, label: string): Rect | undefined {
    for (let ring = 45; ring <= r + 22; ring += 12)
      for (let i = 0; i < 20; i++) {
        const angle = (i * Math.PI) / 10 + rand(label, "angle"),
          rect = {
            x: c.x + Math.round(Math.cos(angle) * ring) - Math.floor(w / 2),
            y: c.y + Math.round(Math.sin(angle) * ring) - Math.floor(h / 2),
            w,
            h,
          };
        if (dry({ x: rect.x - 2, y: rect.y - 2, w: w + 4, h: h + 4 }))
          return rect;
      }
  }
  if (profile.fields !== "none" && owners.length)
    for (let i = 0; i < (profile.pattern === "farmstead" ? 5 : 4); i++) {
      const w =
          profile.fields === "strips"
            ? 6
            : profile.fields === "household"
              ? 9
              : 20,
        h =
          profile.fields === "strips"
            ? 24
            : profile.fields === "household"
              ? 10
              : 13;
      const field = landPlot(w, h, `field${i}`);
      if (!field) continue;
      const access = { x: field.x + Math.floor(w / 2), y: field.y + h + 1 };
      eachCell(field, (x, y) => noRoad.add(cellKey(x, y)));
      if (!connect(c, access, `field-access${i}`, 0)) {
        eachCell(field, (x, y) => noRoad.delete(cellKey(x, y)));
        continue;
      }
      const owner = owners[i % owners.length],
        id = `${site.id}-field${i}`;
      paint(field, "field");
      eachCell(field, (x, y) => noRoad.add(cellKey(x, y)));
      plan.plots.push({ ...field, id, kind: "field", owner, access });
      for (let y = field.y + 2; y < field.y + h - 2; y += 6)
        for (let x = field.x + 2; x < field.x + w - 2; x += 6)
          plan.objects.push({
            id: `${id}-crop-${x - field.x}-${y - field.y}`,
            name: "Cultivated grain",
            kind: "crop",
            pos: pos({ x, y }),
            sprite: "wheat",
            inventory: { grain: 3 },
            owner,
            claim: "landscape",
          });
      const a = plan.actors.find((a) => a.id === owner)!;
      if (a) {
        a.role = "Farmer";
        a.work = pos(access);
      }
      const work = plan.work.get(owner)!;
      work.work = access;
      work.label = "Tending the field";
    }
  const herdOwners = owners.filter((id) => id !== "player").slice(-2);
  if (profile.livestock && herdOwners.length)
    for (let i = 0; i < Math.min(2, herdOwners.length); i++) {
      const pen = landPlot(12, 11, `pen${i}`);
      if (!pen) continue;
      const gate = { x: pen.x + Math.floor(pen.w / 2), y: pen.y + pen.h - 1 },
        outside = { x: gate.x, y: gate.y + 1 };
      eachCell(pen, (x, y) => noRoad.add(cellKey(x, y)));
      if (!connect(c, outside, `pen-access${i}`, 0)) {
        eachCell(pen, (x, y) => noRoad.delete(cellKey(x, y)));
        continue;
      }
      const owner = herdOwners[i],
        id = `${site.id}-pen${i}`,
        gateId = `${id}-gate`;
      plan.enclosures.push({ ...pen, gate });
      eachCell(pen, (x, y) => {
        const k = cellKey(x, y);
        plan.reserved.add(k);
        if (
          (x === pen.x ||
            x === pen.x + pen.w - 1 ||
            y === pen.y ||
            y === pen.y + pen.h - 1) &&
          (x !== gate.x || y !== gate.y)
        )
          plan.solid.add(k);
      });
      plan.objects.push({
        id: gateId,
        name: "Livestock gate",
        kind: "gate",
        pos: pos(gate),
        sprite: "gate",
        inventory: {},
        open: false,
        owner,
      });
      plan.objects.push({
        id: `${id}-trough`,
        name: "Animal trough",
        kind: "container",
        prop: "trough",
        sprite: "study-prop-trough-0",
        inventory: { water: 4 },
        owner,
        pos: pos({ x: pen.x + 2, y: pen.y + 2 }),
      });
      const pasture = { x: gate.x - 3, y: gate.y + 3, w: 7, h: 6 };
      const hasPasture = dry(pasture);
      if (hasPasture) {
        eachCell(pasture, (x, y) => plan.reserved.add(cellKey(x, y)));
        plan.plots.push({
          ...pasture,
          id: `${id}-pasture`,
          kind: "pasture",
          owner,
          access: outside,
        });
      }
      plan.plots.push({ ...pen, id, kind: "pasture", owner, access: outside });
      const herder = plan.actors.find((a) => a.id === owner)!;
      herder.role = "Herder";
      herder.work = pos(outside);
      const hw = plan.work.get(owner)!;
      hw.work = outside;
      hw.gateId = gateId;
      hw.label = "Tending livestock";
      for (let j = 0; j < 3; j++) {
        const home = { x: pen.x + 3 + j * 2, y: pen.y + 4 },
          kind = j === 2 ? "goat" : "sheep",
          aid = `${id}-animal${j}`,
          grazing = hasPasture
            ? { x: gate.x - 2 + j * 2, y: gate.y + 5 }
            : home;
        plan.actors.push({
          id: aid,
          name: kind === "goat" ? "Goat" : "Sheep",
          kind,
          role: "Animal",
          pos: pos(home),
          home: pos(home),
          work: pos(grazing),
          sprite: kind,
          inventory: {},
          activity: "Resting in the enclosure",
          fatigue: 0,
          hunger: 0,
          trust: 0,
          owner,
          memories: [],
          direction: 2,
        });
        plan.work.set(aid, {
          home,
          work: grazing,
          pasture: grazing,
          water: home,
          social: home,
          label: "Grazing",
          gateId,
          offset: j * 7,
        });
      }
    }
  return plan;
}
