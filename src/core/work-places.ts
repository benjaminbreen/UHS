import { crops } from "../content/agriculture/crops";
import type { PlaceRole } from "../content/economy/processes";
import { propDefs } from "../content/props/catalog";
import type { Engine } from "./engine";
import { random } from "./random";
import { distance, type Household, type Point, type Position, type Snapshot } from "./types";
import { waterDepthAt } from "./water-field";
import type { Railway } from "../world/v3/railway";
import type { Parcel } from "../world/v3/farmland";
import type { FaunaGroup } from "./fauna";

/** Where a recipe step is done today; `patient` for a sick call, `crop` for a field. */
export type StepPlace = { pos: Position; label: string; patient?: string; crop?: string };

type Ask = {
  state: Snapshot;
  world: Engine["world"];
  household: Household;
  day: number;
  /** The household the day's work is for. */
  client: () => Household | undefined;
  /** Whether people here bought and sold in a market at all. */
  markets: boolean;
  /** Where work is done inside the house: its bench, else its fire. */
  inside: () => Position | undefined;
};
type SitePlan = { railway?: Railway; parcels?: Parcel[]; site?: { center: Point }; fauna?: FaunaGroup[];
  waterfront?:import("../world/v3/types").SettlementPlan["waterfront"] };
type World = Ask["world"] & {
  planAt?: (x: number, y: number) => SitePlan | undefined;
  planOf?: (siteId: string) => SitePlan | undefined;
};

const outside = (p: Point): Position => ({ x: p.x, y: p.y, space: "outside" });

/** Where a step with this role is done, from what the map has, or null when
 * the map has nothing for it and the work falls back to a prop. */
export function findPlace(role: PlaceRole, ask: Ask): StepPlace | null {
  const { state: s, household } = ask, world = ask.world as World;
  const home = household.home, seed = s.manifest.seed;
  const district=household.residence?.includes("-waterfront-")
    ? world.planOf?.(household.residence.split("-waterfront-")[0]) : world.planAt?.(home.x,home.y);
  const fishing=district?.waterfront?.members.find(m=>household.members.includes(m.owner));
  if(fishing && role==="shore")return {pos:outside(fishing.landing),label:"your household's fishing landing"};
  if(fishing && role==="yard")return {pos:outside(fishing.sorting),label:"your catch-sorting table"};
  const doorOf = (h: Household) => {
    const place = h.residence ? world.place(h.residence) : undefined;
    return outside(place ? place.entrance : h.home);
  };
  const atClient = () => {
    const h = ask.client();
    const host = h && s.actors.find((a) => h.members.includes(a.id) && !a.dead && (a.age ?? 0) >= 16);
    return h ? { pos: doorOf(h), label: host ? `${host.name.split(" ")[0]}'s house` : "a neighbour's house" } : null;
  };
  if (role === "workplace") {
    const pos = s.player.work;
    const place = pos.space !== "outside" ? world.place(pos.space) : world.places.find((p) => p.access === "public" && Math.hypot(p.entrance.x - pos.x, p.entrance.y - pos.y) < 2);
    return { pos: { ...pos }, label: place?.name ?? "your workplace" };
  }
  if (role === "door") return { pos: doorOf(household), label: "your door" };
  if (role === "home") {
    const inside = ask.inside();
    return inside ? { pos: inside, label: "your house" } : { pos: doorOf(household), label: "your house" };
  }
  const mine = (owner?: string) => !!owner && household.members.includes(owner);
  if (role === "yard") {
    // A household with stock works at its pen.
    const gate = s.objects.find((o) => o.kind === "gate" && mine(o.owner) && /-pen\d+-gate$/.test(o.id));
    if (gate) return { pos: outside({ x: gate.pos.x, y: gate.pos.y + 1 }), label: "your pen" };
    const store = s.objects.find((o) => o.id === household.storeId && o.pos.space === "outside");
    return { pos: store ? { ...store.pos } : doorOf(household), label: "your yard" };
  }
  if (role === "client") return atClient();
  if (role === "sick") {
    const others = (s.households ?? []).filter((h) => h !== household && h.residence)
      .sort((a, b) => distance(a.home, home) - distance(b.home, home));
    const ill = (s.ailments ?? []).flatMap((a) => {
      const h = others.find((o) => o.members.includes(a.who));
      return h && s.actors.some((x) => x.id === a.who && !x.dead) ? [{ h, who: a.who }] : [];
    }).sort((a, b) => distance(a.h.home, home) - distance(b.h.home, home))[0];
    // Nobody down with anything: the nearest house sends for you over an old ache.
    const h = ill?.h ?? others[0];
    if (!h) return null;
    const patient = ill?.who ?? s.actors.filter((a) => !a.dead && h.members.includes(a.id))
      .sort((a, b) => (b.age ?? 0) - (a.age ?? 0))[0]?.id;
    const name = s.actors.find((a) => a.id === patient)?.name.split(" ")[0];
    return { pos: doorOf(h), label: name ? `${name}'s house` : "a neighbour's house", patient };
  }
  // A farmstead's house can stand just over its site's district line, where
  // the cell's own plan is another's; the house's own site knows its fields.
  const plan = (household.residence && world.planOf?.(household.residence.replace(/-h\d+$/, ""))) ||
    world.planAt?.(Math.round(home.x), Math.round(home.y));
  if (role === "pasture") {
    const herd = plan?.fauna?.find((g) => mine(g.owner) && g.gateId);
    if (herd?.pasture) return { pos: { ...herd.pasture }, label: "the pasture" };
    // A pen with no paddock grazes the open grass outside its gate.
    const gate = herd && s.objects.find((o) => o.id === herd.gateId);
    const grass = gate && [4, 5, 6, 3].map((d) => ({ x: gate.pos.x, y: gate.pos.y + d })).find((c) => !world.blocked(c.x, c.y, "outside"));
    if (grass) return { pos: outside(grass), label: "the grass by your pen" };
    // Pasture, else the fallow (stock grazed it in open-field farming), else
    // open ground out past the houses.
    const near = (crop: string) => (plan?.parcels ?? []).filter((p) => p.crop === crop && p.state !== "abandoned")
      .sort((a, b) => distance(outside(a.access), home) - distance(outside(b.access), home))[0];
    const grazing = near("pasture") ?? near("fallow");
    if (grazing) return { pos: outside(grazing.access), label: grazing.crop === "pasture" ? "the pasture" : "the fallow" };
    const open = openGround(ask, "grazing");
    return open ? { pos: open, label: "the open grazing" } : null;
  }
  if (role === "wild") {
    const open = openGround(ask, `wild-${ask.day}`);
    return open ? { pos: open, label: "out beyond the houses" } : null;
  }
  if (role === "well") {
    const WELLS = ["well", "town-well", "framed-well", "pump"];
    const well = s.objects
      .filter((o) => o.pos.space === "outside" && (o.kind === "well" || WELLS.includes(propDefs[o.prop ?? ""]?.family ?? "")))
      .sort((a, b) => distance(a.pos, home) - distance(b.pos, home))[0];
    if (well) return { pos: { ...well.pos }, label: propDefs[well.prop ?? ""]?.family === "pump" ? "the pump" : "the well" };
    const bank = bankNear(ask, home, 100);
    return bank ? { pos: bank, label: "the water" } : null;
  }
  if (role === "shore") {
    const bank = bankNear(ask, home, 100);
    return bank ? { pos: bank, label: "the water" } : null;
  }
  if (role === "market") {
    // Where nobody bought and sold in a market, goods went from hand to hand.
    if (!ask.markets) return atClient();
    const stall = s.objects
      .filter((o) => o.pos.space === "outside" && propDefs[o.prop ?? ""]?.family === "market-counter")
      .sort((a, b) => distance(a.pos, home) - distance(b.pos, home))[0];
    if (stall) return { pos: { ...stall.pos }, label: "the market" };
    const square = plan?.site?.center;
    const spot = square && [...Array(9)].flatMap((_, r) => [[r, 0], [-r, 0], [0, r], [0, -r]])
      .map(([dx, dy]) => ({ x: square.x + dx, y: square.y + dy }))
      .find((c) => !world.blocked(c.x, c.y, "outside"));
    if (spot) return { pos: outside(spot), label: "the square" };
    // A town with no stalls and no square sells through its shops.
    const shop = world.places
      .filter((p) => p.access === "public" && !/house|home|cottage/i.test(p.name))
      .sort((a, b) => distance(outside(a.entrance), home) - distance(outside(b.entrance), home))[0];
    return shop ? { pos: outside(shop.entrance), label: `the ${shop.name.toLowerCase()}` } : null;
  }
  if (role === "field" || role === "water") {
    // A household's own parcel first, however far out, and grain before
    // garden stuff; the nearest field else.
    const mine = (p: Parcel) => !!p.owner && household.members.includes(p.owner);
    const grain = (p: Parcel) => crops[p.crop]?.kind === "grain";
    const parcel = (plan?.parcels ?? [])
      .filter((p) => p.state !== "abandoned" && p.crop !== "pasture")
      .sort((a, b) => Number(mine(b)) - Number(mine(a)) || Number(grain(b)) - Number(grain(a)) ||
        distance(outside(a.access), home) - distance(outside(b.access), home))[0];
    if (!parcel) {
      // Land the planner laid no parcels on: a plot on the open ground.
      const open = openGround(ask, "plot");
      return open ? { pos: open, label: "your plot" } : null;
    }
    const paddy = parcel.crop === "rice";
    const crop = paddy ? "rice" : crops[parcel.crop]?.label.toLowerCase();
    const field = { pos: outside(parcel.access), label: `${mine(parcel) ? "your" : "the"} ${paddy ? "paddy" : "field"}`, crop };
    if (role === "field") return field;
    const bank = bankNear(ask, parcel.access, 24);
    return bank ? { pos: bank, label: paddy ? "the channel" : "the water" } : field;
  }
  const line = plan?.railway;
  const hall = world.places
    .filter((p) => /station/i.test(p.name))
    .sort((a, b) => distance(outside(a.entrance), home) - distance(outside(b.entrance), home))[0];
  if (role === "station" && hall) return { pos: outside(hall.entrance), label: `the ${hall.name.toLowerCase()}` };
  if (!line) {
    // A house outside the town's plan still has the town's station; the
    // line runs out from it.
    if (!hall) return null;
    for (let r = 12; r <= 30; r += 3)
      for (let k = 0; k < 8; k++) {
        const x = Math.round(hall.entrance.x + Math.cos((k * Math.PI) / 4) * r), y = Math.round(hall.entrance.y + Math.sin((k * Math.PI) / 4) * r);
        if (!world.blocked(x, y, "outside")) return { pos: outside({ x, y }), label: "the line" };
      }
    return null;
  }
  // The cess, beside the track on the side away from the platform, a
  // different stretch each day.
  const door = line.station?.door;
  const mid = door ? (line.axis === "x" ? door.x : door.y) : (line.lo + line.hi) >> 1;
  const away = role === "line"
    ? (12 + Math.floor(random(seed, "line", ask.day) * 10)) * (random(seed, "line-side", ask.day) < 0.5 ? -1 : 1)
    : 0;
  const across = (line.station?.side ?? -1) < 0 ? line.level + line.span : line.level - 1;
  for (let i = 0; i < 40; i++) {
    const along = Math.min(line.hi - 2, Math.max(line.lo + 2, mid + away + (i % 2 ? -1 : 1) * (i >> 1)));
    const x = line.axis === "x" ? along : across, y = line.axis === "x" ? across : along;
    if (!world.blocked(x, y, "outside")) return { pos: outside({ x, y }), label: role === "line" ? "the line" : "the railway" };
  }
  return null;
}

/** Open ground 25 to 60 cells from the house: no building, no field, no water. */
function openGround(ask: Ask, salt: string): Position | undefined {
  const home = ask.household.home, world = ask.world;
  const turn = random(ask.state.manifest.seed, salt, ask.household.id) * Math.PI * 2;
  for (let r = 25; r <= 60; r += 5)
    for (let k = 0; k < 16; k++) {
      const a = turn + (k * Math.PI) / 8;
      const x = Math.round(home.x + Math.cos(a) * r), y = Math.round(home.y + Math.sin(a) * r);
      if (!world.blocked(x, y, "outside") && world.terrain(x, y, "outside") !== "water" && !world.topography?.(x, y)?.field)
        return outside({ x, y });
    }
}

/** The nearest dry, open cell beside water, within `reach` of a point. */
function bankNear(ask: Ask, from: Point, reach: number): Position | undefined {
  const world = ask.world, topo = world.topography;
  // Relief maps keep their rivers as depth, not as a terrain kind.
  const wet = (x: number, y: number) =>
    topo ? waterDepthAt(topo, x + 0.5, y + 0.5) > 0.2 : world.terrain(x, y, "outside") === "water";
  for (let r = 1; r <= reach; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = Math.round(from.x) + dx, y = Math.round(from.y) + dy;
        if (!wet(x, y)) continue;
        const bank = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([ax, ay]) => ({ x: x + ax, y: y + ay }))
          .find((c) => !wet(c.x, c.y) && !world.blocked(c.x, c.y, "outside"));
        if (bank) return outside(bank);
      }
}
