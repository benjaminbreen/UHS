import type { Station } from "../../core/itinerary";
import type { Actor, Pack, Point } from "../../core/types";
import type { Livelihood } from "../../content/characters/context-types";
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
/** Era bands for the errands people run when they are not at a trade. */
const era = (year: number) =>
  year < 1750 ? "premodern" : year < 1900 ? "industrial" : "modern";
/** Somebody else's door a real walk away, or the square if there is none. */
function farDoor(plan: SettlementPlan, seed: string, id: string, home: Point) {
  const doors = neighbours(plan, id, home);
  const far = doors.slice(Math.floor(doors.length / 2));
  return (
    far[Math.floor(random(seed, "routine", id, "far") * far.length)] ??
    doors[0] ??
    plan.gatherings?.[0]
  );
}
/** The building an indoor activity belongs in. Rites go to the sanctuary
 * where the town has one and to the hall otherwise; records and watches to
 * the hall; machine work to a workshop. */
function doorFor(
  plan: SettlementPlan,
  seed: string,
  id: string,
  activity: string,
  home: Point,
): Point | undefined {
  const hall = plan.places.find((p) => p.claim.startsWith("civic-"));
  const sanctuary = plan.places.find((p) => p.claim.startsWith("religious-"));
  const shops = plan.places
    .filter(
      (p) =>
        p.owner !== id &&
        p.access === "public" &&
        !p.claim.startsWith("civic-") &&
        /shop|workshop/i.test(p.name),
    )
    .map((p) => p.entrance);
  const pickShop = () =>
    shops.length
      ? shops[Math.floor(random(seed, "routine", id, "shop") * shops.length)]
      : undefined;
  if (/rite/i.test(activity)) return (sanctuary ?? hall)?.entrance;
  if (/record|watch|sick/i.test(activity)) return hall?.entrance;
  if (/machine|line|building|roof/i.test(activity))
    return pickShop() ?? hall?.entrance;
  return pickShop() ?? farDoor(plan, seed, id, home);
}
/** Indoors somewhere that is not home: drawn walking there and back, hidden
 * while inside. The same rule that hides a resident at rest hides them at
 * the office, the school or the shop floor. */
const inside = (pos: Point, label: string, minutes: number): Station => ({
  pos,
  activity: "rest",
  label,
  minutes,
});
/** Residents whose day is spent under a roof: their own house, or the house
 * they keep for someone else. One short errand outside, chosen by era, and
 * the rest of the day indoors where nobody is drawn. */
export function memberRoutine(
  plan: SettlementPlan,
  seed: string,
  id: string,
  home: Point,
  year: number,
  child: boolean,
): Station[] {
  const when = era(year);
  const water = wellAt(plan);
  const doors = neighbours(plan, id, home);
  const call =
    doors[Math.floor(random(seed, "routine", id, "call") * doors.length)];
  const square = plan.plots.find((p) => p.kind === "public");
  const shop = square
    ? { x: square.x + Math.floor(square.w / 2), y: square.y + square.h - 1 }
    : call;
  const pick = random(seed, "routine", id, "errand");
  const rest = (share: number): Station => ({ ...night(home), share });
  if (child) {
    // Children run: a short circuit of doorsteps and corners with almost no
    // dwell, so they are seen moving rather than standing. Water is the one
    // errand they are sent on before piped supply.
    const run: Station = { ...night(home), share: 0.3, pace: 0.18 };
    const spots = [
      ...doors.slice(0, 3),
      ...(plan.gatherings ?? []).slice(0, 2),
    ];
    const played = circuit(
      plan,
      seed,
      id,
      spots,
      "Running between houses",
      "play",
    );
    const played2 = circuit(
      plan,
      seed,
      `${id}-b`,
      [home, ...spots],
      "Playing in the street",
      "play",
    );
    const played3 = circuit(
      plan,
      seed,
      `${id}-c`,
      [...spots].reverse(),
      "Chasing the others",
      "play",
    );
    if (when === "modern") {
      const school = farDoor(plan, seed, id, home);
      return [
        ...(school ? [inside(school, "At school", 200)] : []),
        ...played,
        ...played2,
        ...played3,
        run,
      ];
    }
    return [
      ...played,
      ...(water
        ? [
            {
              pos: nearby(plan, seed, id, water),
              activity: "draw-water" as const,
              label: "Sent for water",
              minutes: 8,
            },
          ]
        : []),
      ...played2,
      ...played3,
      run,
    ];
  }
  // One errand a day. Water before there is piped water; then the shop or
  // the market; a neighbour when the settlement has neither; the nearest
  // corner as a last resort, so the routine always has its three stations.
  const corner = plan.gatherings?.[0];
  const errand: Station | undefined =
    when === "premodern" && water && pick < 0.5
      ? {
          pos: nearby(plan, seed, id, water),
          activity: "draw-water",
          label: "Fetching water",
          minutes: 20,
        }
      : shop && pick < 0.8
        ? {
            pos: nearby(plan, seed, id, shop),
            activity: "visit",
            label:
              when === "modern"
                ? "Going to the shop"
                : when === "industrial"
                  ? "At the market"
                  : "Trading at the square",
            minutes: 30,
          }
        : call
          ? {
              pos: nearby(plan, seed, id, call),
              activity: "visit",
              label: "Calling on a neighbour",
              minutes: 35,
            }
          : corner
            ? {
                pos: nearby(plan, seed, id, corner),
                activity: "visit",
                label: "Out for air",
                minutes: 20,
              }
            : undefined;
  return [
    ...(errand ? [errand] : []),
    socialStop(plan, seed, id, home),
    ...(errand
      ? []
      : [
          {
            pos: nearby(plan, seed, `${id}-step`, home),
            activity: "visit" as const,
            label: "On the doorstep",
            minutes: 10,
          },
        ]),
    rest(0.07),
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
type Outdoors = NonNullable<SettlementPlan["outdoors"]>;
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
  plan.outdoors = outdoorSites(plan, seed, sample);
  for (const [id, site] of plan.work) {
    const actor = plan.actors.find((a) => a.id === id);
    if (site.gateId && actor?.kind !== "human") continue;
    plan.stations.set(id, routineFor(plan, seed, pack, id, site, actor));
  }
}
const kitsFor = new WeakMap<Pack, Map<string, Livelihood>>();
/** The livelihood kit an actor was generated with, if the setting has them. */
export function livelihoodOf(pack: Pack, actor?: Actor) {
  if (!pack.setting?.characterRevision || !actor?.origin?.livelihood)
    return undefined;
  let kits = kitsFor.get(pack);
  if (!kits) {
    kits = new Map(
      resolveCharacterContext(pack.setting).livelihoods.map((l) => [l.id, l]),
    );
    kitsFor.set(pack, kits);
  }
  return kits.get(actor.origin.livelihood);
}
/** One resident's day, from what the plan gave them and what their
 * livelihood does. Used for owners at planning time and for household
 * members added afterwards. */
export function routineFor(
  plan: SettlementPlan,
  seed: string,
  pack: Pack,
  id: string,
  site: WorkSite,
  actor?: Actor,
): Station[] {
  const outdoors = plan.outdoors ?? { wild: [] };
  const home = site.home;
  const kit = livelihoodOf(pack, actor);
  const label = kit?.activity ?? site.label;
  const field = plan.plots.find((p) => p.kind === "field" && p.owner === id);
  const gate = plan.objects.find((o) => o.id === site.gateId);
  const pasture = plan.plots.find(
    (p) => p.kind === "pasture" && p.owner === id && p.id.endsWith("-pasture"),
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
    pack.year,
    field,
    pasture,
  );
  if (errands.length && errands[errands.length - 1].activity === "rest")
    return errands;
  return [
    ...(errands.length
      ? errands
      : craftRoutine(plan, seed, id, id, home, site.work, label)),
    socialStop(plan, seed, id, home),
    night(home),
  ];
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
  year: number,
  field?: { access: Point },
  pasture?: { x: number; y: number; w: number; h: number },
): Station[] {
  const depot = store(plan, id);
  // From the factory age on, most trades happen under somebody else's roof:
  // walk there, vanish inside, walk home. Before that the yard is the shop.
  const indoorWork = era(year) !== "premodern";
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
    case "carrying": {
      if (label === "Running errands") {
        const doors = neighbours(plan, id, home);
        const stops =
          doors.length >= 3 ? doors : [...doors, ...(plan.gatherings ?? [])];
        return circuit(plan, seed, id, stops.slice(0, 6), label, "visit");
      }
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
    }
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
      const roof = doorFor(plan, seed, id, label, home) ?? site2;
      if (indoorWork && roof)
        return [
          inside(roof, label, 300),
          socialStop(plan, seed, id, home),
          { ...night(home), share: 0.1 },
        ];
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
      return memberRoutine(plan, seed, id, home, year, false);
    default: {
      const bench = indoorWork
        ? doorFor(plan, seed, id, label, home)
        : undefined;
      if (bench)
        return [
          inside(bench, label, 300),
          socialStop(plan, seed, id, home),
          { ...night(home), share: 0.1 },
        ];
      return craftRoutine(plan, seed, id, id, home, site.work, label);
    }
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
