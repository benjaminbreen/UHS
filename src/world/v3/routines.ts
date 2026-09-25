import { carryKit, withLoads } from "../../content/economy/carrying";
import { goodsOf } from "../../content/economy/goods";
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
import { outlookOf } from "../../core/outlook";
import { standingOf } from "../../core/standing";
import { venuesFor, type Venue } from "../../content/venues";
import type { Rank } from "../../content/characters/context-types";
import type { StanceTag } from "../../content/outlook/types";
import type { WorldSetting } from "../../content/geography/types";
import { cellKey, type SettlementPlan, type WorkSite } from "./types";
import { propVisualCells } from "../../content/props/catalog";
import { buildingRoofCells } from "../../content/graphics/models";
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
/** How far from the fire a household still cooks and sits at it. A village
 * gathers whole; in a city only the quarter round the hearth does. */
const HEARTH_REACH = 30;
function hearthFor(plan: SettlementPlan, home: Point, year: number) {
  const fire = hearthAt(plan);
  if (!fire || era(year) === "modern") return undefined;
  return Math.hypot(fire.x - home.x, fire.y - home.y) <= HEARTH_REACH
    ? fire
    : undefined;
}
/** Sat round the shared fire at the end of the day, before going in. */
function fireside(
  plan: SettlementPlan,
  seed: string,
  id: string,
  home: Point,
  year: number,
): Station[] {
  const fire = hearthFor(plan, home, year);
  return fire
    ? [
        {
          pos: nearby(plan, seed, `${id}-fire`, fire),
          activity: "warm",
          label: "Sitting by the fire",
          minutes: 40,
        },
      ]
    : [];
}
/** The morning pot at the shared fire, for the household's cook. */
function cooking(
  plan: SettlementPlan,
  seed: string,
  id: string,
  home: Point,
  year: number,
): Station[] {
  const fire = hearthFor(plan, home, year);
  return fire
    ? [
        {
          pos: nearby(plan, seed, `${id}-cook`, fire),
          activity: "cook",
          label: "Cooking at the hearth",
          minutes: 30,
        },
      ]
    : [];
}
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
  const grown = plan.objects.filter(
    (o) => o.kind === "crop" && o.owner === owner,
  );
  const crops = grown.map((o) => ({ x: o.pos.x, y: o.pos.y }));
  const load = grown.find((o) => o.resource)?.resource?.item;
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
      toward: "the field",
      minutes: 15,
      carry: "tool" as const,
    },
    ...picked.map((pos, i) => ({
      pos,
      activity: "tend" as const,
      label: i % 2 ? "Weeding the rows" : "Watering the crop",
      minutes: 45,
      carry: "tool" as const,
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
            ...(load ? { carry: load } : {}),
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
    {
      pos: gatePos,
      activity: "work",
      label: "Opening the pen",
      toward: "the pen",
      minutes: 15,
    },
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
    {
      pos: gatePos,
      activity: "work",
      label: "Penning the flock",
      toward: "the pen",
      minutes: 20,
    },
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
  /** The shop the household buys from, where it has one. */
  market?: { pos: Point; label: string },
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
    // The fire is the first gathering, so it is already on the circuit.
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
      : market && pick < 0.8
        ? {
            pos: nearby(plan, seed, id, market.pos),
            activity: "visit",
            label: market.label,
            minutes: 25,
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
            toward: when === "premodern" ? "the square" : "the market",
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
    ...cooking(plan, seed, id, home, year),
    ...(errand ? [errand] : []),
    socialStop(plan, seed, id, home),
    ...(errand
      ? []
      : [
          {
            pos: nearby(plan, seed, `${id}-step`, home),
            activity: "visit" as const,
            label: "On the doorstep",
            toward: "their own door",
            minutes: 10,
          },
        ]),
    ...fireside(plan, seed, id, home, year),
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
  // The shared fire is the first knot; the others keep their distance.
  const fire = hearthAt(plan);
  const spots: Point[] = fire ? [fire] : [];
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
/** A household that works the water keeps a drying rack in its yard. Placed
 * here rather than by the prop overlay because a routine has to be able to
 * walk to it, and the overlay runs after the plan is closed. */
function attachRack(
  plan: SettlementPlan,
  seed: string,
  pack: Pack,
  id: string,
  site: WorkSite,
) {
  if (site.rackId) return;
  // Open-air racks belong to a waterside that still cures its own catch. A
  // modern city buys its fish already dried.
  const form = pack.setting?.settlement;
  if (
    pack.year >= 1900 &&
    form !== "port" &&
    form !== "farm" &&
    form !== "village"
  )
    return;
  const taken = new Set(
    plan.objects.flatMap((o) =>
      o.prop
        ? propVisualCells(o.prop, o.pos).map((p) => cellKey(p.x, p.y))
        : [cellKey(o.pos.x, o.pos.y)],
    ),
  );
  for (const place of plan.places)
    for (const p of buildingRoofCells(place.sprite, place))
      taken.add(cellKey(p.x, p.y));
  const free = (p: Point) => {
    const anchor = cellKey(p.x, p.y);
    if (plan.reserved.has(anchor)) return false;
    return propVisualCells("dryingRack", p).every((q) => {
      const k = cellKey(q.x, q.y);
      return !plan.solid.has(k) && !plan.traffic.has(k) && !taken.has(k);
    });
  };
  // A yard if the household has one. A dense quarter has none, so fall back to
  // the ground beside their work, then to the waterside itself.
  const ring = (centre: Point) => {
    const out: Point[] = [];
    for (let r = 1; r <= 3; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r)
            out.push({ x: centre.x + dx, y: centre.y + dy });
    return out;
  };
  const spot = [
    ...(plan.slots.get(id)?.yard ?? []),
    ...ring(site.work),
    ...(plan.outdoors?.shore ? ring(plan.outdoors.shore) : []),
  ].find(free);
  if (!spot) return;
  const rackId = `${id}-rack`;
  site.rackId = rackId;
  plan.solid.add(cellKey(spot.x, spot.y));
  plan.objects.push({
    id: rackId,
    name: "Drying rack",
    kind: "container",
    prop: "dryingRack",
    pos: { ...spot, space: "outside" },
    sprite: `study-propb-drying-rack-${Math.floor(random(seed, "rack-art", id) * 3)}`,
    inventory: {},
    open: true,
    owner: id,
    claim: "landscape",
  });
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
  attachOpenVenues(plan, pack);
  for (const [id, site] of plan.work) {
    const actor = plan.actors.find((a) => a.id === id);
    if (site.gateId && actor?.kind !== "human") continue;
    const kit = livelihoodOf(pack, actor);
    if (kit && workplaceFor(kit.activity) === "water")
      attachRack(plan, seed, pack, id, site);
    plan.stations.set(
      id,
      withLoads(
        routineFor(plan, seed, pack, id, site, actor),
        carryKit(pack),
        undefined,
        goodsOf(livelihoodOf(pack, actor))[0],
      ),
    );
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
  const kit = kits.get(actor.origin.livelihood);
  if (kit?.id !== "apprentice")
    return kit;
  const specialty = actor.origin.roleLabel?.startsWith("Apprentice ")
    ? actor.origin.roleLabel.slice("Apprentice ".length).toLowerCase()
    : undefined;
  const trade = kits.get(actor.origin.specialty ?? "") ??
    [...kits.values()].find((l) => l.label.toLowerCase() === specialty);
  return trade
    ? { ...kit, label: actor.origin.roleLabel ?? kit.label, activity: trade.activity, workplace: trade.workplace }
    : kit;
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
    socialStop(plan, seed, id, home, actor, pack.setting),
    ...fireside(plan, seed, id, home, pack.year),
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
    case "water": {
      // Yesterday's catch comes down before the boat goes out, and today's
      // goes up on the way home. The rack itself shows which it is.
      const rack = plan.objects.find((o) => o.id === site.rackId);
      const atRack = (
        label: string,
        minutes: number,
        activity: Station["activity"] = "tend",
      ) =>
        rack
          ? [
              {
                pos: nearby(plan, seed, `${id}-rack`, rack.pos),
                activity,
                label,
                minutes,
              },
            ]
          : [];
      const water = outdoors.shore
        ? circuit(plan, seed, id, [outdoors.shore], label, "work")
        : [];
      // A waterside household with neither shore nor rack has no day here;
      // leave it to the craft fallback rather than inventing one.
      if (!water.length && !rack) return [];
      return [
        ...atRack("Taking down the dry fish", 12),
        ...water,
        ...atRack("Hanging the catch", 18, "haul-catch"),
        ...haul,
      ];
    }
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
              toward: "the road out of town",
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
/**
 * The venues with no building of their own — the crossroads, the market
 * ground, the wrestling pitch — take a gathering point each, so every
 * settlement has somewhere to go even where nothing is authored for it.
 */
function attachOpenVenues(plan: SettlementPlan, pack: Pack) {
  const spots = plan.gatherings ?? [];
  if (!spots.length) return;
  plan.venues ??= [];
  const open = venuesFor(pack.setting, plan.places.length).filter(
    (v) => v.open && !plan.venues!.some((held) => held.venue.id === v.id),
  );
  open.forEach((venue, i) => {
    const pos = spots[i % spots.length];
    const marked = venue.marker && markOpenVenue(plan, venue, pos);
    plan.venues!.push({ venue, pos: marked || pos });
  });
}
/** Stands an open venue's marker on free ground off the street, out towards
 * the edge of the settlement: a grove is not in the lane. */
function markOpenVenue(plan: SettlementPlan, venue: Venue, from: Point) {
  const c = plan.site.center,
    r = plan.site.profile.radius;
  const d = Math.hypot(from.x - c.x, from.y - c.y) || 1;
  const want = {
    x: Math.round(c.x + ((from.x - c.x) / d) * r * 0.85),
    y: Math.round(c.y + ((from.y - c.y) / d) * r * 0.85),
  };
  const taken = new Set(plan.objects.map((o) => cellKey(o.pos.x, o.pos.y)));
  const free = (x: number, y: number) =>
    [0, 1].every((dy) =>
      [-1, 0, 1].every((dx) => {
        const k = cellKey(x + dx, y + dy);
        return (
          !plan.solid.has(k) &&
          !plan.traffic.has(k) &&
          !plan.reserved.has(k) &&
          !taken.has(k)
        );
      }),
    );
  for (let ring = 0; ring <= 12; ring++)
    for (let dy = -ring; dy <= ring; dy++)
      for (let dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const x = want.x + dx,
          y = want.y + dy;
        if (!free(x, y)) continue;
        plan.solid.add(cellKey(x, y));
        plan.objects.push({
          id: `${venue.id}-marker`,
          name: venue.marker!.name,
          description: venue.marker!.description,
          kind: "monument",
          pos: { x, y, space: "outside" },
          sprite: `study-propb-sacred-marker-${venue.marker!.variant}`,
          inventory: {},
          claim: "landscape",
        });
        // Visitors stand in front of it, not on it.
        return { x, y: y + 1 };
      }
  return undefined;
}
/**
 * How strongly a venue draws this person. Admission is a gate; everything else
 * is a nudge, and the seeded draw in `socialStop` does the rest. Deliberately
 * crude: the interest is meant to come from the content, not from the scoring.
 */
function venueScore(
  venue: Venue,
  rank: Rank | undefined,
  tags: Set<StanceTag>,
  livelihood: string | undefined,
): number {
  if (venue.ranks && (!rank || !venue.ranks.includes(rank))) return 0;
  if (
    venue.livelihoods &&
    (!livelihood || !venue.livelihoods.includes(livelihood))
  )
    return 0;
  const shared = (venue.tags ?? []).filter((t) => tags.has(t)).length;
  return venue.weight + shared * 6;
}
export function socialStop(
  plan: SettlementPlan,
  seed: string,
  id: string,
  home: Point,
  actor?: Actor,
  setting?: WorldSetting,
): Station {
  const drawn =
    actor && setting ? venueFor(plan, seed, actor, setting) : undefined;
  if (drawn)
    return {
      pos: nearby(plan, seed, id, drawn.pos),
      activity: drawn.venue.activity,
      label: `At ${drawn.venue.label.replace(/^The /, "the ")}`,
      toward: drawn.venue.label.replace(/^The /, "the "),
      minutes: drawn.venue.minutes,
    };
  return legacySocialStop(plan, seed, id, home);
}
/** Which venue draws this person tonight, if any does. */
function venueFor(
  plan: SettlementPlan,
  seed: string,
  actor: Actor,
  setting: WorldSetting,
) {
  const built = plan.venues ?? [];
  if (!built.length) return undefined;
  const outlook = outlookOf(seed, actor, setting);
  const rank = standingOf(seed, actor)?.rank;
  const scored = built
    .map((entry) => ({
      ...entry,
      score: venueScore(
        entry.venue,
        rank,
        outlook.tags,
        actor.origin?.livelihood,
      ),
    }))
    .filter((entry) => entry.score > 0);
  if (!scored.length) return undefined;
  const total = scored.reduce((n, entry) => n + entry.score, 0);
  let roll = random(seed, "venue", actor.id) * total;
  return scored.find((entry) => (roll -= entry.score) < 0) ?? scored[0];
}
function legacySocialStop(
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
    toward: "a corner where people stop to talk",
    minutes: 40,
  };
}
