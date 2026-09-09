import type { Station } from "../../core/itinerary";
import type { Pack, Point } from "../../core/types";
import {
  workplaceFor,
  type Workplace,
} from "../../content/characters/workplace";
import { resolveCharacterContext } from "../../content/characters/resolve";
import type { Sample } from "./roads";
import { random } from "../../core/random";
import { cellKey, type SettlementPlan, type WorkSite } from "./types";
/** Ordered from the evening rest, so the leftover hours of a short routine
 * lengthen the night instead of padding an errand. */
const night = (home: Point): Station => ({
  pos: home,
  activity: "rest",
  label: "At home",
  minutes: 420,
});
const store = (plan: SettlementPlan, owner: string) =>
  plan.objects.find(
    (o) =>
      o.owner === owner &&
      o.kind === "container" &&
      o.pos.space === "outside" &&
      !o.prop,
  )?.pos;
const wellAt = (plan: SettlementPlan) =>
  plan.objects.find((o) => o.kind === "well")?.pos;
const hearthAt = (plan: SettlementPlan) =>
  plan.objects.find((o) => o.kind === "fire")?.pos;
/** Doors other than this actor's own, nearest first: the errand that actually
 * carries somebody across the settlement rather than round their own yard. */
function neighbours(plan: SettlementPlan, owner: string, home: Point) {
  return [...plan.work]
    .filter(([id, w]) => id !== owner && w.gateId === undefined)
    .map(([, w]) => w.home)
    .filter((p) => Math.hypot(p.x - home.x, p.y - home.y) > 6)
    .sort(
      (a, b) =>
        Math.hypot(a.x - home.x, a.y - home.y) -
        Math.hypot(b.x - home.x, b.y - home.y),
    );
}
function farmerRoutine(
  plan: SettlementPlan,
  seed: string,
  id: string,
  owner: string,
  field: { access: Point },
): Station[] {
  const crops = plan.objects
    .filter((o) => o.kind === "crop" && o.owner === owner)
    .map((o) => ({ x: o.pos.x, y: o.pos.y }));
  // Walk the rows in a stable order so the circuit reads as a pass over the
  // field rather than a shuffle between random plants.
  crops.sort((a, b) => a.y - b.y || a.x - b.x);
  const rotate = Math.floor(random(seed, "routine", id, "row") * 4);
  const rows = crops
    .filter((_, i) => i % Math.max(1, Math.ceil(crops.length / 4)) === 0)
    .slice(0, 4);
  const picked = rows.length
    ? rows.map((_, i) => rows[(i + rotate) % rows.length])
    : [field.access];
  const water = wellAt(plan);
  const depot = store(plan, owner);
  return [
    {
      pos: nearby(plan, seed, id, field.access),
      activity: "work",
      label: "At the field",
      minutes: 15,
    },
    ...picked.map((pos, i) => ({
      pos,
      activity: "tend" as const,
      label: i % 2 ? "Weeding the rows" : "Watering the crop",
      minutes: 45,
    })),
    ...(water
      ? [
          {
            pos: nearby(plan, seed, id, water),
            activity: "draw-water" as const,
            label: "Drawing water",
            minutes: 12,
          },
        ]
      : []),
    ...(depot
      ? [
          {
            pos: nearby(plan, seed, id, depot),
            activity: "haul" as const,
            label: "Carrying the load home",
            minutes: 15,
          },
        ]
      : []),
  ];
}
function herderRoutine(
  plan: SettlementPlan,
  seed: string,
  id: string,
  gatePos: Point,
  pasture: Point | undefined,
): Station[] {
  const water = wellAt(plan);
  return [
    { pos: gatePos, activity: "work", label: "Opening the pen", minutes: 15 },
    {
      pos: pasture ?? gatePos,
      activity: "graze",
      label: "Watching the flock",
      minutes: 240,
    },
    ...(water
      ? [
          {
            pos: nearby(plan, seed, id, water),
            activity: "draw-water" as const,
            label: "Watering the flock",
            minutes: 20,
          },
        ]
      : []),
    { pos: gatePos, activity: "work", label: "Penning the flock", minutes: 20 },
  ];
}
function craftRoutine(
  plan: SettlementPlan,
  seed: string,
  id: string,
  owner: string,
  home: Point,
  work: Point,
  label: string,
): Station[] {
  const water = wellAt(plan);
  const depot = store(plan, owner);
  const doors = neighbours(plan, owner, home);
  const call =
    doors[Math.floor(random(seed, "routine", id, "call") * doors.length)];
  return [
    { pos: work, activity: "work", label, minutes: 150 },
    ...(water
      ? [
          {
            pos: nearby(plan, seed, id, water),
            activity: "draw-water" as const,
            label: "Drawing water",
            minutes: 12,
          },
        ]
      : []),
    ...(call
      ? [
          {
            pos: nearby(plan, seed, id, call),
            activity: "visit" as const,
            label: "Calling on a neighbour",
            minutes: 35,
          },
        ]
      : []),
    { pos: work, activity: "work", label, minutes: 110 },
    ...(depot
      ? [
          {
            pos: nearby(plan, seed, id, depot),
            activity: "haul" as const,
            label: "Putting the day's work away",
            minutes: 15,
          },
        ]
      : []),
  ];
}
/** Household members without a trade of their own: errands, not idling. */
export function gathererRoutine(
  plan: SettlementPlan,
  seed: string,
  id: string,
  owner: string,
  home: Point,
  child: boolean,
): Station[] {
  const water = wellAt(plan);
  const hearth = hearthAt(plan);
  const depot = store(plan, owner);
  const doors = neighbours(plan, owner, home);
  const edge = plan.plots
    .filter((p) => p.kind === "field" || p.kind === "pasture")
    .map((p) => p.access);
  const forage =
    edge[Math.floor(random(seed, "routine", id, "forage") * edge.length)];
  const call =
    doors[Math.floor(random(seed, "routine", id, "call") * doors.length)];
  if (child)
    return [
      ...(hearth
        ? [
            {
              pos: hearth,
              activity: "visit" as const,
              label: "Playing by the hearth",
              minutes: 130,
            },
          ]
        : []),
      ...(water
        ? [
            {
              pos: nearby(plan, seed, id, water),
              activity: "draw-water" as const,
              label: "Sent for water",
              minutes: 25,
            },
          ]
        : []),
      ...(call
        ? [
            {
              pos: call,
              activity: "visit" as const,
              label: "Running between houses",
              minutes: 90,
            },
          ]
        : []),
    ];
  return [
    ...(forage
      ? [
          {
            pos: nearby(plan, seed, id, forage),
            activity: "gather" as const,
            label: "Gathering at the field edge",
            minutes: 140,
          },
        ]
      : []),
    ...(depot
      ? [
          {
            pos: nearby(plan, seed, id, depot),
            activity: "haul" as const,
            label: "Bringing the load home",
            minutes: 20,
          },
        ]
      : []),
    ...(water
      ? [
          {
            pos: nearby(plan, seed, id, water),
            activity: "draw-water" as const,
            label: "Fetching water",
            minutes: 25,
          },
        ]
      : []),
    ...(hearth
      ? [
          {
            pos: nearby(plan, seed, id, hearth),
            activity: "visit" as const,
            label: "At the hearth",
            minutes: 40,
          },
        ]
      : []),
  ];
}
/** Places people actually stop to talk: a well, a corner, a stretch of street
 * away from the middle. One common at the centre of the map gathers the whole
 * settlement into a single knot; several small ones read as a town. */
function gatherings(plan: SettlementPlan, seed: string) {
  const c = plan.site.center,
    r = plan.site.profile.radius;
  const roads = [...plan.traffic].map((k) => {
    const [x, y] = k.split(",");
    return { x: +x, y: +y };
  });
  if (!roads.length) return [];
  const count = Math.min(8, Math.max(3, Math.round(plan.work.size / 3)));
  const spots: Point[] = [];
  for (let i = 0; i < count; i++) {
    const angle =
      ((i + random(seed, "knot", plan.site.id, i, "angle") * 0.6) / count) *
      Math.PI *
      2;
    const reach =
      r * (0.2 + random(seed, "knot", plan.site.id, i, "reach") * 0.55);
    const want = {
      x: c.x + Math.round(Math.cos(angle) * reach),
      y: c.y + Math.round(Math.sin(angle) * reach),
    };
    // Snap onto the street network: a gathering belongs on a road, not in the
    // middle of somebody's yard.
    let best: Point | undefined,
      score = 20;
    for (const cell of roads) {
      const d = Math.hypot(cell.x - want.x, cell.y - want.y);
      if (
        d < score &&
        !spots.some((s) => Math.hypot(s.x - cell.x, s.y - cell.y) < 14)
      ) {
        score = d;
        best = cell;
      }
    }
    if (best) spots.push(best);
  }
  return spots;
}
/** Standing on the same tile as four other people is what makes a crowd read
 * as a stack. Each resident gets their own spot a step or two off the mark. */
function nearby(plan: SettlementPlan, seed: string, id: string, at: Point) {
  for (let i = 0; i < 8; i++) {
    const angle = random(seed, "spot", id, i, "angle") * Math.PI * 2;
    const reach = 1 + Math.floor(random(seed, "spot", id, i, "reach") * 3);
    const p = {
      x: at.x + Math.round(Math.cos(angle) * reach),
      y: at.y + Math.round(Math.sin(angle) * reach),
    };
    if (!plan.solid.has(`${p.x},${p.y}`)) return p;
  }
  return at;
}
/** A pitch on the rim of the common. Half the trades work here rather than in
 * their own yard, so the square has traffic and the walk there is visible. */
function stall(plan: SettlementPlan, seed: string, id: string) {
  const pub = plan.plots.find((p) => p.kind === "public");
  if (!pub || pub.w < 5 || pub.h < 5) return undefined;
  const rim = Math.floor(
    random(seed, "routine", id, "stall-slot") * (pub.w - 2) * 2,
  );
  return rim < pub.w - 2
    ? { x: pub.x + 1 + rim, y: pub.y + 1 }
    : { x: pub.x + 1 + (rim - (pub.w - 2)), y: pub.y + pub.h - 2 };
}
/** Places outside the built area: the woods people forage and cut in, the
 * shore, the quarry, the road out of town. Without these every livelihood ends
 * up circling the market square. */
function outdoorSites(plan: SettlementPlan, seed: string, sample: Sample) {
  const c = plan.site.center,
    r = plan.site.profile.radius;
  const dry = (x: number, y: number) =>
    sample(x, y).water >= 4 &&
    !plan.solid.has(cellKey(x, y)) &&
    !plan.reserved.has(cellKey(x, y)) &&
    (!plan.site.accepts || plan.site.accepts(x, y));
  const outward = (key: string, near: number, far: number, tries = 14) => {
    for (let i = 0; i < tries; i++) {
      const angle =
        random(seed, "out", plan.site.id, key, i, "a") * Math.PI * 2;
      const reach =
        r *
        (near + random(seed, "out", plan.site.id, key, i, "r") * (far - near));
      const p = {
        x: c.x + Math.round(Math.cos(angle) * reach),
        y: c.y + Math.round(Math.sin(angle) * reach),
      };
      if (dry(p.x, p.y)) return p;
    }
    return undefined;
  };
  const wild: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const p = outward(`wild${i}`, 1.1, 2.1);
    if (p) wild.push(p);
  }
  // A shore is worth a wider search than a clearing: there may not be one.
  let shore: Point | undefined;
  for (let ring = 20; ring < r * 2.4 && !shore; ring += 10)
    for (let i = 0; i < 24 && !shore; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const x = c.x + Math.round(Math.cos(angle) * ring),
        y = c.y + Math.round(Math.sin(angle) * ring);
      if (sample(x, y).water >= 4) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        if (!shore && dry(x + dx, y + dy)) shore = { x: x + dx, y: y + dy };
    }
  const quarry = outward("quarry", 1.2, 1.8);
  // The far end of the longest road: where a carter's load is going.
  let roadOut: Point | undefined,
    best = r * 0.9;
  for (const road of plan.roads)
    for (const p of [road.points[0], road.points[road.points.length - 1]]) {
      const d = p && Math.hypot(p.x - c.x, p.y - c.y);
      if (p && d && d > best && dry(p.x, p.y)) {
        best = d;
        roadOut = p;
      }
    }
  return { wild, shore, quarry, roadOut };
}
type Outdoors = ReturnType<typeof outdoorSites>;
/** Three spots in the same stretch of country, walked in a stable order: the
 * tree-to-tree circuit rather than a wander. */
function circuit(
  plan: SettlementPlan,
  seed: string,
  id: string,
  spots: Point[],
  label: string,
  activity: Station["activity"],
): Station[] {
  if (!spots.length) return [];
  const first = Math.floor(random(seed, "circuit", id) * spots.length);
  return [0, 1, 2].map((i) => ({
    pos: nearby(plan, seed, `${id}-${i}`, spots[(first + i) % spots.length]),
    activity,
    label,
    minutes: 20,
  }));
}
/** One routine per resident, built from the features the plan placed and the
 * country around it, chosen by what the livelihood actually does. */
export function planRoutines(
  plan: SettlementPlan,
  seed: string,
  pack: Pack,
  sample: Sample,
) {
  plan.gatherings = gatherings(plan, seed);
  const outdoors = outdoorSites(plan, seed, sample);
  const context = pack.setting?.characterRevision
    ? resolveCharacterContext(pack.setting)
    : undefined;
  const kits = new Map(context?.livelihoods.map((l) => [l.id, l]) ?? []);
  for (const [id, site] of plan.work) {
    const actor = plan.actors.find((a) => a.id === id);
    if (site.gateId && actor?.kind !== "human") continue;
    const home = site.home;
    const kit = actor?.origin?.livelihood
      ? kits.get(actor.origin.livelihood)
      : undefined;
    const label = kit?.activity ?? site.label;
    const field = plan.plots.find((p) => p.kind === "field" && p.owner === id);
    const gate = plan.objects.find((o) => o.id === site.gateId);
    const pasture = plan.plots.find(
      (p) =>
        p.kind === "pasture" && p.owner === id && p.id.endsWith("-pasture"),
    );
    // What the plan actually gave this person outranks the livelihood label: a
    // field or a pen is a real place, the keyword is only a hint.
    const place = field
      ? "field"
      : gate
        ? "pasture"
        : kit
          ? workplaceFor(kit.activity)
          : "workshop";
    const errands = workdayFor(
      place,
      plan,
      seed,
      id,
      home,
      site,
      label,
      outdoors,
      field,
      pasture,
    );
    plan.stations.set(id, [
      ...(errands.length
        ? errands
        : craftRoutine(plan, seed, id, id, home, site.work, label)),
      socialStop(plan, seed, id, home),
      night(home),
    ]);
  }
}
function workdayFor(
  place: Workplace,
  plan: SettlementPlan,
  seed: string,
  id: string,
  home: Point,
  site: WorkSite,
  label: string,
  outdoors: Outdoors,
  field?: { access: Point },
  pasture?: { x: number; y: number; w: number; h: number },
): Station[] {
  const depot = store(plan, id);
  const haul = depot
    ? [
        {
          pos: nearby(plan, seed, id, depot),
          activity: "haul" as const,
          label: "Bringing the load home",
          minutes: 12,
        },
      ]
    : [];
  switch (place) {
    case "field":
      return field ? farmerRoutine(plan, seed, id, id, field) : [];
    case "pasture":
      return herderRoutine(
        plan,
        seed,
        id,
        site.work,
        pasture
          ? {
              x: pasture.x + Math.floor(pasture.w / 2),
              y: pasture.y + Math.floor(pasture.h / 2),
            }
          : site.pasture,
      );
    case "wild":
      return [
        ...circuit(plan, seed, id, outdoors.wild, label, "gather"),
        ...haul,
      ];
    case "extraction":
      return outdoors.quarry
        ? [
            ...circuit(plan, seed, id, [outdoors.quarry], label, "work"),
            ...haul,
          ]
        : [];
    case "water":
      return outdoors.shore
        ? [...circuit(plan, seed, id, [outdoors.shore], label, "work"), ...haul]
        : [];
    case "carrying":
      return outdoors.roadOut
        ? [
            {
              pos: nearby(plan, seed, id, outdoors.roadOut),
              activity: "haul",
              label: "On the road out of town",
              minutes: 25,
            },
            ...haul,
          ]
        : [];
    case "market": {
      const pitch = stall(plan, seed, id);
      return pitch
        ? [
            { pos: pitch, activity: "work", label, minutes: 45 },
            ...craftRoutine(plan, seed, id, id, home, pitch, label).slice(1),
          ]
        : [];
    }
    case "civic": {
      const doors = neighbours(plan, id, home);
      const site2 =
        doors[Math.floor(random(seed, "civic", id) * doors.length)] ??
        plan.gatherings?.[0];
      return site2
        ? [
            {
              pos: nearby(plan, seed, id, site2),
              activity: "work",
              label,
              minutes: 45,
            },
            ...haul,
          ]
        : [];
    }
    case "household":
      return gathererRoutine(plan, seed, id, id, home, false);
    default:
      return craftRoutine(plan, seed, id, id, home, site.work, label);
  }
}
/** The knot this resident drinks and gossips at: the nearest of the scattered
 * spots most of the time, a further one now and then, so the groups mix. */
export function socialStop(
  plan: SettlementPlan,
  seed: string,
  id: string,
  home: Point,
): Station {
  const spots = plan.gatherings ?? [];
  const ranked = [...spots].sort(
    (a, b) =>
      Math.hypot(a.x - home.x, a.y - home.y) -
      Math.hypot(b.x - home.x, b.y - home.y),
  );
  const pick =
    ranked[
      random(seed, "knot-pick", id) < 0.7
        ? 0
        : Math.floor(random(seed, "knot-far", id) * ranked.length)
    ];
  return {
    pos: pick ? nearby(plan, seed, id, pick) : home,
    activity: "visit",
    label: "Stopping to talk",
    minutes: 40,
  };
}
