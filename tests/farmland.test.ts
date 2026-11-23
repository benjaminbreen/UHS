import { describe, expect, it } from "vitest";
import { panelCity, panelSetting } from "../scripts/review/panel";
import { cropStage } from "../src/content/agriculture";
import { crops, pickable } from "../src/content/agriculture/crops";
import { packs } from "../src/content/packs";
import { settlementProfile } from "../src/content/settlements/profiles";
import { createSettingSession } from "../src/runtime/session";
import type { SettlementWorld } from "../src/world/v3/generate";
import { vehicleAt, vehicleSchedule } from "../src/world/v3/conveyances";
import { planFarmland } from "../src/world/v3/farmland";
import { smallSession } from "./fixtures";
import { resolveSetting } from "../src/content/geography/resolve";
import { Autopilot } from "../src/runtime/autopilot";
import { cellJobs } from "../src/core/work-places";

function londonFarmSession(season?: "autumn") {
  const start = resolveSetting("Farmer near London 1350", "strip");
  if ("error" in start) throw new Error(start.error);
  return createSettingSession(season ? { ...start.setting, season } : start.setting, "strip");
}

function londonGrainCart() {
  const e = londonFarmSession();
  const p = e.state.player, plan = (e.world as SettlementWorld).planAt(p.pos.x, p.pos.y)!;
  const cart = plan.vehicles!.find(v => v.model === "farm-cart-pony" && v.farmOwner)!;
  expect(cart, "a pony cart connects a grain farm to the market").toBeDefined();
  const driver = e.state.actors.find(a => a.id === cart.crew[0])!;
  const farm = e.state.households!.find(h => h.members.includes(cart.farmOwner!))!;
  const buyer = {
    id: "market-baker", members: [], storeId: "market-baker-store",
    home: { ...cart.path[0], space: "outside" }, makes: ["bread"],
  };
  e.state.households!.push(buyer);
  return { e, cart, driver, farm, buyer };
}

/** Farmland round a town: parcels exist, keep off the built ground, reach
 * a lane, and carry the system the culture and date imply. */
describe("farmland", () => {
  it("only puts a seasonal grain sheaf on the map while it is standing", () => {
    const e = smallSession({ ...panelSetting("london", 1400), season: "spring" });
    const pos = { x: 21, y: 41, space: "outside" };
    e.world.blocked = () => false;
    e.world.initialObjects.push({ id: "edge-sheaf", name: "Sheaf of grain", prop: "sheaf", sprite: "sheaf",
      kind: "container", pos, seasons: ["autumn"], inventory: { grain: 2 } });
    for (const [season, present] of [[2, true], [3, false], [6, true]] as const) {
      e.state.clock = 32400 + season * 28 * 86400;
      e.advance(1);
      expect(e.state.objects.filter(o => o.id === "edge-sheaf")).toHaveLength(present ? 1 : 0);
      expect(e.blocked(pos.x, pos.y, pos.space)).toBe(present);
    }
  });
  it("opens the field card away from the gate and finishes a hand-started row on autopilot", () => {
    const start = resolveSetting("Maize cultivator in Ica, 246 CE", "ica-field-review");
    if ("error" in start) throw Error(start.error);
    const e = smallSession(start.setting), s = e.state;
    const parcel = { id: 9, owner: "player", crop: "maize", cells: 12, access: { x: 21, y: 41 },
      rect: { x: 21, y: 41, w: 6, h: 2 } } as const;
    Object.assign(e.world, { planAt: () => ({ parcels: [parcel] }), blocked: () => false });
    e.world.topography = (x,y) => ({ height: 0, surface: "soil",
      ...(x >= 21 && x <= 26 && [41,42].includes(y) ? {field:{parcel:9, crop:"maize", stage:"sown",
        owner:"player", axis:"x", edges:1, boundary:"none",wet:false,fence:0}} : {}) });
    e.world.decoration = (x,y) => y === 41 && !s.tiles?.[`${x},${y}`]?.cut ?
      { id:`decor-${x}-${y}`, x,y,sprite:"grass-tuft",solid:false } : undefined;
    s.player.pos={x:26,y:44,space:"outside"};
    let i = 0;
    const act = (command: Parameters<typeof e.validate>[0]) => {
      const result=e.act({actionId:`field-${++i}`,expectedRevision:s.revision,command});
      expect(result.status,result.reason).toBe("completed");
    };
    expect(e.workHere()).toBeUndefined();
    act({type:"move",dx:0,dy:-1});
    const now=s.clock;
    act(e.workHere()!.command);
    const card=e.cards.at(-1)!.choose!;
    expect(card.choices.map(c=>c.label)).toContain("Clear the weedy edge");
    expect(card.choices.some(c=>/harvest|bring in/i.test(c.label))).toBe(false);
    act({type:"choose",card:card.card,choice:card.choices.find(c=>c.label==="Clear the weedy edge")!.index});
    expect(s.clock).toBe(now);
    act({type:"move",dx:0,dy:-1});
    act(e.workHere()!.command);
    expect(s.tiles?.["26,41"]?.cut).toBe(true);
    expect(s.workday!.field!.count).toBe(1);
    const pilot = new Autopilot({kind:"workday",workPass:card.card},e);
    let finished=false;
    for(let n=0;n<100 && !finished;n++) {
      const step=pilot.next();
      if ("route" in step) for (const q of step.route) act({type:"move",dx:q.x-s.player.pos.x,dy:q.y-s.player.pos.y});
      if ("command" in step) act(step.command);
      if ("done" in step) finished=true;
    }
    expect(finished).toBe(true);
    expect(s.workday!.field).toBeUndefined();
    expect(Object.values(s.tiles!).filter(c=>c.cut)).toHaveLength(6);
    expect(s.clock-now).toBeGreaterThanOrEqual(30*60);
    const q={x:24,y:41};
    const maizeSeason = (["spring", "summer", "autumn", "winter"] as const)
      .find(season => cropStage("maize", season, start.setting.lat) === "sown")!;
    s.tiles!["24,41"].dug = true;
    expect(cellJobs(e.world, s, q, maizeSeason, 0)).not.toContain("plant");
    expect(cellJobs(e.world, s, q, maizeSeason, 1)).toContain("plant");
    const outside = e.world.topography!;
    e.world.topography = (x, y) => x === q.x && y === q.y - 1 ? { height: 0, surface: "water", waterDepth: "shallow" } : outside(x, y);
    delete s.tiles!["24,41"].dug;
    expect(cellJobs(e.world, s, q, maizeSeason, 0)).toContain("water");
    expect(cellJobs(e.world, s, { x: 21, y: 41 }, maizeSeason, 0)).not.toContain("water");
    s.economy!.work!.stage = e.workPlan()!.steps.length;
    s.economy!.work!.done = true;
    act(e.workHere()!.command);
    const extra = e.cards.at(-1)!.choose!;
    act({ type: "choose", card: extra.card, choice: extra.choices.find(c => c.label === "Water the young crop")!.index });
    for (const to of e.findRoute(s.player.pos, { x: 24, y: 42 }).path) {
      if (e.workHere()) break;
      act({ type: "move", dx: to.x - s.player.pos.x, dy: to.y - s.player.pos.y });
    }
    act(e.workHere()!.command);
    expect(s.tiles!["24,41"].watered).toBe(Math.floor(s.clock / 86400));
    expect(s.economy!.work!.stage).toBe(3);
  });
  it("lets a player drive the pony cart, halt on the lane and return the same cart to its driver", () => {
    const { e, cart, driver, farm, buyer } = londonGrainCart();
    const p = e.state.player;
    const drive = (cart.path.length - 1) / cart.speed;
    const cycle = 2 * drive + cart.waits[0] + cart.waits[1];
    e.state.clock = Math.ceil(cycle * (1 - cart.phase) + drive + 1);
    e.advance(1);
    p.pos = { ...cart.path[cart.path.length - 1], space: "outside" };
    const act = (action: "take-reins" | "walk-on" | "halt-cart" | "return-reins") => {
      const command = { type: "interact" as const, target: driver.id, action };
      expect(e.validate(command), action).toBeUndefined();
      e.execute(command);
    };
    act("take-reins");
    act("walk-on");
    const start = { ...p.pos };
    e.advance(24);
    expect(p.pos).not.toEqual(start);
    act("halt-cart");
    const stopped = { ...p.pos }, clock = e.cartClock(cart.id, e.state.clock);
    e.advance(36);
    expect(p.pos).toEqual(stopped);
    expect(e.cartClock(cart.id, e.state.clock)).toBe(clock);
    act("walk-on");
    e.advance(12);
    act("halt-cart");
    const before = vehicleAt(cart, e.cartClock(cart.id, e.state.clock));
    act("return-reins");
    expect(p.drivingCart).toBeUndefined();
    expect(vehicleAt(cart, e.cartClock(cart.id, e.state.clock))).toEqual(before);
    e.advance(24);
    expect(driver.pos).not.toEqual(stopped);

    e.state.economy = { hour: 9, short: {}, stock: { [farm.id]: { grain: 100 } } };
    const stop = (phase: number, pos: typeof p.pos) => {
      const minute = Math.ceil((e.state.clock + 1) / 60) * 60;
      e.state.clock = minute - 1;
      p.cartOffsets = { [cart.id]: phase - cart.phase * cycle - minute };
      p.pos = pos;
      e.advance(1);
    };
    e.state.clock = 9 * 3600;
    stop(drive + 2, { ...cart.path[cart.path.length - 1], space: "outside" });
    expect(driver.freight?.grain).toBe(12);
    expect(e.state.economy.stock[farm.id].grain).toBe(88);
    expect(driver.freight?.to).toBe(buyer.id);
    const beforeDelivery = e.state.economy.stock[buyer.id]?.grain ?? 0;
    stop(2 * drive + cart.waits[0] + 2, { ...cart.path[0], space: "outside" });
    expect(driver.freight?.grain).toBe(0);
    expect(e.state.economy.stock[buyer.id].grain).toBe(beforeDelivery + 12);
  });
  it("credits a carter's workday when the player delivers the consignment by hand", () => {
    const { e, cart, driver, farm, buyer } = londonGrainCart();
    const s = e.state, p = s.player;
    p.origin!.livelihood = "carter";
    s.clock = 9 * 3600;
    s.economy = { hour: 23, short: {}, stock: { [farm.id]: { grain: 100 } } };
    const { drive, phase } = vehicleSchedule(cart, s.clock);
    p.cartOffsets = { [cart.id]: drive + 1 - phase };
    p.pos = { ...cart.path[cart.path.length - 1], space: "outside" };
    e.populateNearby();
    const work = () => {
      const card = s.economy?.work?.card;
      if (card) e.execute({ type: "choose", card, choice: 0 });
      const command = e.workHere()!.command;
      expect(e.validate(command)).toBeUndefined();
      e.execute(command);
    };
    work();
    expect(s.economy.stock[farm.id].grain).toBe(88);
    expect(driver.freight?.grain).toBe(12);
    work();
    expect(p.pos).toMatchObject(cart.path[0]);
    expect(driver.freight?.to).toBe(buyer.id);
    const before = s.economy.stock[buyer.id]?.grain ?? 0;
    const unload = { type: "interact", target: driver.id, action: "unload-cart" } as const;
    expect(e.validate(unload)).toBeUndefined();
    e.execute(unload);
    work();
    expect(s.economy.stock[buyer.id].grain).toBe(before + 12);
    expect(s.economy.work?.stage).toBe(3);
    expect(p.drivingCart).toBeUndefined();
  });

  it("hands a working ox team to the player and releases the same pair at the far headland", () => {
    const e = londonFarmSession("autumn");
    const p = e.state.player, plan = (e.world as SettlementWorld).planAt(p.pos.x, p.pos.y)!;
    const plough = plan.vehicles!.find(v => v.rowLength)!;
    const farmer = e.state.actors.find(a => a.id === plough.crew[0])!;
    e.state.clock = 7 * 3600;
    p.pos = { ...farmer.pos, x: farmer.pos.x - 1 };
    e.populateNearby();
    const team = e.state.fauna!.find(g => g.hitch === plough.id)!;
    const members = team.members.map(m => m.n);
    expect(members).toHaveLength(2);
    const interact = (action: "guide-plough" | "yoke") => {
      p.pos = { ...farmer.pos, x: farmer.pos.x - 1 };
      const command = { type: "interact" as const, action, target: farmer.id };
      expect(e.validate(command)).toBeUndefined();
      e.execute(command);
    };
    interact("yoke");
    expect(team.hitch).toBeUndefined();
    team.pos = { ...farmer.pos };
    team.members.forEach((member, i) => { member.x = farmer.pos.x; member.y = farmer.pos.y + i; });
    interact("yoke");
    expect(team.hitch).toBe(plough.id);
    interact("guide-plough");
    const path = plough.path;
    let previous = farmer.plough!.step;
    for (let i = previous + 1; i < path.length; i++) {
      const command = { type: "move" as const, dx: path[i].x - path[i - 1].x, dy: path[i].y - path[i - 1].y };
      expect(e.validate(command)).toBeUndefined();
      e.execute(command);
      expect(farmer.plough!.step).toBe(++previous);
      if (i !== plough.rowLength) expect(e.state.tiles?.[`${path[i].x},${path[i].y}`]?.furrow).toBeDefined();
    }
    expect(team.members.map(m => m.n)).toEqual(members);
    expect(team.hitch).toBeUndefined();
    expect(farmer.mount).toBeUndefined();
    expect(p.guidingPlough).toBeUndefined();

    const farm = e.state.households!.find(h => h.members.includes(farmer.id))!;
    const stock = { grain: 30 };
    e.state.economy = { hour: 34, short: {}, stock: { [farm.id]: stock } };
    e.state.clock = 34 * 3600 - 1;
    e.advance(1);
    const field = () => e.world.topography!(path[0].x, path[0].y).field!;
    expect(field()).toMatchObject({ crop: plough.seedCrop, stage: "sown", owner: farmer.id });
    expect(stock.grain).toBe(29);
    e.state.clock += 84 * 86400;
    expect(field().stage).toBe("ripe");
    e.state.economy.hour = Math.floor(e.state.clock / 3600) + 1;
    e.state.clock += 3599;
    e.advance(1);
    expect(stock.grain).toBeGreaterThan(29);
    expect(field().stage).toBe("stubble");
  });

  it("hands a Hanoi paddy back mid-pass and transplants the same puddled bed", () => {
    const e = createSettingSession({ ...panelSetting("city-hanoi", 1600), season: "spring" }, "strip");
    const p = e.state.player, plan = (e.world as SettlementWorld).planAt(p.pos.x, p.pos.y)!;
    const v = plan.vehicles!.find(v => v.conveyance === "buffalo-plough")!;
    const farmer = e.state.actors.find(a => a.id === v.crew[0])!, first = v.path[0];
    p.pos = { ...first, space: "outside" };
    e.populateNearby();
    const buffalo = e.state.fauna!.find(g => g.hitch === v.id)!;
    expect(buffalo.speciesId).toBe("water-buffalo");
    expect(buffalo.members).toHaveLength(1);
    const field = () => e.world.topography!(first.x, first.y).field!;
    expect(field()).toMatchObject({ wet: true, stage: "bare" });
    const handles = { type: "interact", action: "guide-plough", target: farmer.id } as const;
    e.execute(handles);
    const next = v.path[1];
    e.execute({ type: "move", dx: next.x - first.x, dy: next.y - first.y });
    expect(farmer.plough?.step).toBe(1);
    e.execute(handles);
    e.advance(24 * v.path.length);
    expect(farmer.plough?.step).toBe(v.path.length - 1);
    expect(buffalo.hitch).toBeUndefined();
    const bed = e.world.decoration(first.x, first.y)!;
    expect(bed.sprite).toMatch(/^vv-puddled-/);
    e.state.economy = { stock: { [farmer.householdId!]: { grain: 30 } }, hour: 6, short: {} };
    p.origin!.livelihood = "rice-farmer";
    e.state.economy.work = { day: 0, stage: 1 };
    const plant = { type: "interact", action: "sow-strip", target: bed.id } as const;
    expect(e.validate(plant)).toBeUndefined();
    e.execute(plant);
    expect(field()).toMatchObject({ wet: true, crop: "rice", stage: "sown", owner: farmer.id });
    expect(e.state.economy.stock[farmer.householdId!].grain).toBe(29);
    expect(e.state.economy.work.stage).toBe(1);
    expect(e.validate(plant)).toBeDefined();

    for (const q of v.path.slice(1)) {
      p.pos = { ...q, space: "outside" };
      const patch = e.world.decoration(q.x, q.y)!;
      const finish = { type: "interact", action: "sow-strip", target: patch.id } as const;
      expect(e.validate(finish)).toBeUndefined();
      e.execute(finish);
    }
    expect(v.path.every(q => e.world.topography!(q.x, q.y).field?.stage === "sown")).toBe(true);
    expect(e.state.economy.stock[farmer.householdId!].grain).toBe(29);
    expect(e.state.economy.work.stage).toBe(2);
  });

  it.each([
    ["city-xian", 100, "trial", "millet"],
    ["delhi", 1550, "strip", "millet"],
    ["city-aksum", 450, "strip", "barley"],
  ] as const)("works dry cereal ground near %s in %i", (place, year, seed, crop) => {
    const e = createSettingSession(panelSetting(place, year), seed);
    const world = e.world as SettlementWorld;
    const site = world.settlements!.find(s => s.id.endsWith(`~${place}`))!;
    const plan = world.planAt(site.x, site.y)!;
    const team = plan.vehicles!.find(v => v.rowLength)!;
    expect(team.seedCrop).toBe(crop);
    expect(plan.actors.find(a => a.id === team.crew[0])?.mount?.vehicle).toBe(team.id);
    expect(team.path.every(q => {
      const field = world.topography!(q.x, q.y).field;
      return field?.crop === "fallow" && !field.wet;
    })).toBe(true);
  });

  it("draws one half-step behind a lone brink and several between terrain tiers", () => {
    const setting = { ...panelSetting("london", 1650), culture: "south-asian" as const, lon: 85.88, lat: 20.47 };
    const hillside = (upper: number, slope = 0) => {
      const farm = planFarmland({
        site: { id: "brink", cx: 0, cy: 0, center: { x: 0, y: 0 }, home: true, profile: { ...settlementProfile(setting), radius: 25 } },
        pack: { ...packs.roman, setting },
        seed: "brink",
        sample: (x, y) => ({ elevation: y-slope*x < upper ? 28 : y-slope*x < -30 ? 14 : 0, water: 80, kind: "river", moisture: 0.7, snow: false }),
        urban: true,
        connections: [],
        taken: () => false,
        solid: () => false,
        foreign: () => false,
        cap: 80,
        lane: () => undefined,
        join: () => undefined,
        owners: [],
        homeOf: () => undefined,
        holding: () => 0,
        reachable: () => true,
      })!;
      return [...farm.fields];
    };
    const riserRows = (upper: number) => hillside(upper)
        .filter(([, f]) => (f.riser ?? 0) & 4)
        .map(([key]) => Number(key.split(",")[1]));
    const shelf = riserRows(-Infinity);
    expect(shelf.length).toBeGreaterThan(0);
    expect(Math.min(...shelf)).toBeGreaterThanOrEqual(-35);
    expect(Math.min(...riserRows(-46))).toBeLessThan(-40);
    for (const slope of [-1, 1]) {
      const fields = hillside(-50, slope).filter(([, f]) => f.rowSlope !== undefined);
      const diagonal = fields.filter(([, f]) => Math.sign(f.rowSlope!) === slope);
      expect(diagonal.length).toBeGreaterThan(fields.length * 0.7);
      const headings = new Map<number, Set<string>>();
      const benches = new Map(fields);
      let shared = 0;
      for (const [key, f] of fields) {
        if (!headings.has(f.parcel)) headings.set(f.parcel, new Set());
        headings.get(f.parcel)!.add(`${f.axis}/${f.rowSlope}`);
        const [x, y] = key.split(",").map(Number), next = benches.get(`${x+1},${y}`);
        if (next && next.parcel !== f.parcel) {
          expect(f.edges & 2).toBe(2);
          expect((f.margin ?? 0) & 2).toBe(0);
          shared++;
        }
      }
      expect(shared).toBeGreaterThan(0);
      expect([...headings.values()].every(h => h.size === 1)).toBe(true);
    }
  });

  it("does not wrap irrigation round the town in a diamond", () => {
    const engine = createSettingSession(
      { ...panelSetting("london", 1400), climate: "arid" },
      "canal-review",
    );
    const world = engine.world as typeof engine.world & {
      planAt(
        x: number,
        y: number,
      ): {
        canals: Set<string>;
        site: { center: { x: number; y: number } };
        territory: { inner: number };
      };
    };
    const plan = world.planAt(world.spawn.x, world.spawn.y);
    const { x: cx, y: cy } = plan.site.center;
    let diagonal = 0;
    for (const key of plan.canals) {
      const [x, y] = key.split(",").map(Number);
      const dx = Math.abs(x - cx),
        dy = Math.abs(y - cy);
      if (
        Math.abs(dx - dy) <= 2 &&
        Math.max(dx, dy) >= plan.territory.inner - 5 &&
        Math.max(dx, dy) <= plan.territory.inner + 30
      )
        diagonal++;
    }
    // Channels with no field beside them are not dug, so fewer than the grid lays.
    expect(plan.canals.size).toBeGreaterThan(50);
    expect(diagonal).toBeLessThan(10);
  });

  for (const [place, year] of [
    ["london", 1400],
    ["alexandria", -244],
  ] as const)
    it(`${place} ${year} farms its territory`, () => {
      const c = panelCity(place, year);
      const plan = c.plan;
      expect(plan.territory, "territory").toBeDefined();
      expect(plan.parcels?.length ?? 0, "parcels").toBeGreaterThanOrEqual(
        plan.territory!.slots.length,
      );
      expect(plan.territory!.spokes.length, "spokes").toBeGreaterThanOrEqual(2);
      expect(plan.territory!.slots.length, "slots").toBeGreaterThanOrEqual(2);
      // Fields keep out of the town and never sit on a building or a street.
      const r = plan.site.profile.radius,
        centre = plan.site.center;
      let inside = 0,
        farmed = 0;
      for (const [k, cell] of plan.fields!) {
        const [x, y] = k.split(",").map(Number);
        if (!cell.yard) {
          farmed++;
          if (Math.hypot(x - centre.x, y - centre.y) < r) inside++;
        }
        expect(plan.solid.has(k), `field on a building at ${k}`).toBe(false);
        expect(plan.traffic.has(k), `field on a street at ${k}`).toBe(false);
      }
      expect(
        inside / farmed,
        "share inside the built radius",
      ).toBeLessThan(0.02);
      // Every parcel's access cell touches a lane or open ground, not water.
      for (const p of plan.parcels!.slice(0, 200))
        expect(
          c.engine.world.terrain(p.access.x, p.access.y),
          `access ${p.id}`,
        ).not.toBe("water");
      for (const p of plan.parcels!.filter((p: { owner?: string }) => p.owner).slice(0, 20)) {
        expect([...plan.fields!.values()].some(cell => cell.parcel === p.id && cell.owner === p.owner)).toBe(true);
        expect(plan.objects.some((o: { id: string }) => o.id.startsWith(`${plan.site.id}-parcel${p.id}-crop-`))).toBe(false);
      }
      for (const o of plan.objects) {
        if (o.prop !== "sheaf" || !o.id.includes("-parcel")) continue;
        const f = plan.fields!.get(`${o.pos.x},${o.pos.y}`);
        expect(f && o.id.startsWith(`${plan.site.id}-parcel${f.parcel}-sheaf`), o.id).toBe(true);
      }
      // Every household whose work is the fields holds some: the walk check
      // hands a household the next parcel it can reach rather than leaving it
      // with none.
      const tilling = plan.plots
        .filter((p: { kind: string; owner?: string }) => p.kind === "field")
        .map((p: { owner?: string }) => p.owner);
      const fieldWorkers = plan.actors.filter((a: { id: string }) =>
        plan.stations
          .get(a.id)
          ?.some((s: { toward?: string }) => s.toward === "the field"),
      );
      for (const a of fieldWorkers.slice(0, 20))
        expect(tilling, `${a.id} has ground to work`).toContain(a.id);
      const cellKeys = [...plan.fields!.keys()];
      expect(
        cellKeys.some((k) => plan.fields!.get(k)!.edges !== 0),
        "boundaries",
      ).toBe(true);
      // Mediterranean terraces step down to the bench below; open fields
      // have no benches. A riser always faces another bench's field.
      let risers = 0;
      for (const [k, cell] of plan.fields!) {
        if (!cell.riser) continue;
        risers++;
        const [x, y] = k.split(",").map(Number);
        for (const [bit, dx, dy] of [[1, 0, -1], [2, 1, 0], [4, 0, 1], [8, -1, 0]])
          if (cell.riser & bit) {
            const below = plan.fields!.get(`${x + dx},${y + dy}`);
            expect(below && below.parcel !== cell.parcel, `riser at ${k}`).toBe(true);
          }
      }
      if (place === "alexandria") expect(risers, "terrace walls").toBeGreaterThan(20);
      else expect(risers, "terrace walls").toBe(0);
    });
});

/** A kitchen garden is worth pointing at: the bed is big enough to read as a
 * bed, and every planted cell names its crop when the player hovers it. */
describe("kitchen gardens", () => {
  it("lays beds you can point at, and names what grows there", () => {
    const c = panelCity("london", 1400);
    const beds = [...c.plan.fields!].filter(([, f]) => f.garden);
    expect(beds.length, "garden cells").toBeGreaterThan(20);
    const widest = new Map<number, number>();
    for (const [k] of beds) {
      const [x, y] = k.split(",").map(Number);
      widest.set(y, (widest.get(y) ?? 0) + 1);
      const seen = c.engine.inspect(`crop-${x}-${y}`);
      // Only what the player can see from where they stand has a label, but
      // whatever answers names the crop rather than the ground.
      if (seen) {
        expect(seen.kind).toBe("vegetation");
        expect(seen.name.length).toBeGreaterThan(0);
      }
    }
    expect(Math.max(...widest.values()), "widest bed row").toBeGreaterThan(4);
  });
});

/** Picking a crop: your own ground is work, somebody else's is theft, and a
 * plant only gives once. Summer, so the grain is standing ripe. */
describe("harvesting a crop cell", () => {
  const harvestWorld = () => {
    const e = smallSession({ ...panelSetting("london", 1400), season: "summer" });
    const owner = e.state.households![1].members[0];
    e.world.decoration = () => undefined;
    e.world.spawn = { x: 20, y: 40, space: "outside" };
    e.world.topography = (x, y) => ({ height: 0, surface: "grass",
      ...(y === 40 && [20, 22, 24].includes(x) ? { field: {
        parcel: x, crop: "wheat", stage: x === 24 ? "sown" : "ripe",
        axis: "x", edges: 1, boundary: "baulk", wet: false, fence: 0,
        ...(x === 20 ? { owner } : {}),
      } } : {}),
    });
    return e;
  };
  const ripeCell = (e: ReturnType<typeof harvestWorld>, owned: boolean) => {
    const spawn = e.world.spawn;
    for (let y = spawn.y - 70; y < spawn.y + 70; y++)
      for (let x = spawn.x - 70; x < spawn.x + 70; x++) {
        const f = e.world.topography?.(x, y)?.field;
        if (!f || f.stage !== "ripe" || !pickable(crops[f.crop])) continue;
        if (owned ? !!f.owner && f.owner !== "player" : !f.owner)
          return { x, y, field: f };
      }
    throw Error(`no ${owned ? "owned" : "common"} ripe crop to test against`);
  };
  it("takes the crop, angers the owner, and gives nothing twice", () => {
    const e = harvestWorld();
    const at = ripeCell(e, true);
    e.state.player.pos = { x: at.x, y: at.y - 1, space: "outside" };
    const owner = e.state.actors.find((a) => a.id === at.field.owner);
    if (owner) owner.pos = { x: at.x + 1, y: at.y - 1, space: "outside" };
    const id = `crop-${at.x}-${at.y}`;
    const seen = e.inspect(id);
    expect(seen?.claim, "somebody else's crop is marked as owned").toBe(
      "owned",
    );
    const offer = seen!.affordances[0];
    expect(offer?.label, "prompt says it is not yours").toMatch(
      /without asking/,
    );
    expect(offer?.enabled, "in reach and ripe").toBe(true);
    const item = crops[at.field.crop].yields!;
    const before = e.state.player.inventory[item] ?? 0;
    const trust = owner?.trust;
    e.execute(offer!.command);
    expect(
      e.state.player.inventory[item] ?? 0,
      "the crop is in the pack",
    ).toBeGreaterThan(before);
    expect(
      e.state.player.memories.some((m) => m.startsWith(`theft:${id}:`)),
      "the player remembers taking it",
    ).toBe(true);
    if (owner && trust !== undefined)
      expect(owner.trust, "the owner minds").toBeLessThan(trust);
    // The same plant does not give a second time.
    const again = e.inspect(id)!.affordances[0];
    expect(again?.enabled).toBe(false);
    expect(again?.reason).toMatch(/picked/);
  });
  it("counts a loss against the whole household, not just the holder", () => {
    const e = harvestWorld();
    const at = ripeCell(e, true);
    const house = e.state.households?.find((h) =>
      h.members.includes(at.field.owner!),
    );
    const kin = house?.members.find((m) => m !== at.field.owner);
    const witness = e.state.actors.find((a) => a.id === kin);
    expect(witness).toBeDefined();
    e.state.player.pos = { x: at.x, y: at.y - 1, space: "outside" };
    witness!.pos = { x: at.x + 1, y: at.y - 1, space: "outside" };
    const trust = witness!.trust;
    e.execute(e.inspect(`crop-${at.x}-${at.y}`)!.affordances[0]!.command);
    expect(witness!.trust, "a co-resident minds").toBeLessThan(trust);
    expect(
      witness!.memories.some((m) => /take my crop/.test(m)),
      "and takes it personally",
    ).toBe(true);
  });
  it("lets the owner find an unwitnessed theft later, and blame whoever was about", () => {
    const e = harvestWorld();
    const at = ripeCell(e, true);
    const house = e.state.households!.find((h) =>
      h.members.includes(at.field.owner!),
    )!;
    const finder = e.state.actors.find((a) => house.members.includes(a.id));
    const bystander = e.state.actors.find(
      (a) => a.kind === "human" && !house.members.includes(a.id),
    );
    expect(finder).toBeDefined();
    expect(bystander).toBeDefined();
    for (const a of e.state.actors)
      a.pos = { x: at.x + 100, y: at.y, space: "outside" };
    // About, but too far off to see what was done.
    bystander!.pos = { x: at.x + 15, y: at.y, space: "outside" };
    e.state.player.pos = { x: at.x, y: at.y - 1, space: "outside" };
    const trust = finder!.trust;
    e.execute(e.inspect(`crop-${at.x}-${at.y}`)!.affordances[0]!.command);
    expect(e.state.losses, "the loss waits to be found").toHaveLength(1);
    expect(e.state.losses![0].suspect).toBe(true);
    expect(finder!.trust, "nobody of theirs knows yet").toBe(trust);
    finder!.pos = { x: at.x + 2, y: at.y, space: "outside" };
    e.state.clock = Math.ceil(e.state.clock / 60) * 60 + 54;
    e.advance(6);
    expect(e.state.losses, "found").toHaveLength(0);
    expect(finder!.trust, "and held against the player").toBeLessThan(trust);
    expect(house.history?.at(-1)?.kind).toBe("robbed");
  });
  it("treats unowned ground as work, not theft", () => {
    const e = harvestWorld();
    const at = ripeCell(e, false);
    e.state.player.pos = { x: at.x, y: at.y - 1, space: "outside" };
    const id = `crop-${at.x}-${at.y}`;
    const seen = e.inspect(id)!;
    expect(seen.claim, "common ground carries no claim").toBeUndefined();
    expect(seen.affordances[0]?.label).toMatch(/^Harvest/);
    e.execute(seen.affordances[0]!.command);
    expect(
      e.state.player.memories.some((m) => m.startsWith("theft:")),
      "no theft recorded",
    ).toBe(false);
  });
  it("cuts a standing crop down with a swing, and gathers it if ripe", () => {
    const e = harvestWorld();
    const at = ripeCell(e, true);
    e.state.player.pos = { x: at.x, y: at.y - 1, space: "outside" };
    e.state.player.direction = 2;
    e.state.player.heldItem = "tool";
    const before = e.state.player.inventory[crops[at.field.crop].yields!] ?? 0;
    e.execute({ type: "swing" });
    expect(e.state.tiles?.[`${at.x},${at.y}`]?.picked).toBeDefined();
    expect(e.state.player.inventory[crops[at.field.crop].yields!]).toBeGreaterThan(before);
  });
  it("will not let you pick a crop that is not ready", () => {
    const e = harvestWorld();
    const spawn = e.world.spawn;
    for (let y = spawn.y - 70; y < spawn.y + 70; y++)
      for (let x = spawn.x - 70; x < spawn.x + 70; x++) {
        const f = e.world.topography?.(x, y)?.field;
        if (!f || f.stage === "ripe" || !pickable(crops[f.crop])) continue;
        e.state.player.pos = { x, y: y - 1, space: "outside" };
        const offer = e.inspect(`crop-${x}-${y}`)?.affordances[0];
        if (!offer) continue;
        expect(offer.enabled).toBe(false);
        expect(offer.reason).toMatch(/Not ready/);
        return;
      }
    throw Error("no unripe crop to test against");
  });
});
