import { expect, it } from "vitest";
import { resolveSetting } from "../src/content/geography/resolve";
import { integratedSetting } from "../src/content/geography/defaults";
import { packForSetting } from "../src/content/geography/pack";
import { settlementProfile } from "../src/content/settlements/profiles";
import { planSettlement } from "../src/world/v3/plan";
import { DAY, platformDoors, stopAt, timetable, trainLength, trainsAt, type Railway } from "../src/world/v3/railway";
import { isVisitor, railDay } from "../src/world/v3/rail-travellers";
import type { Point } from "../src/core/types";

const resolved = resolveSetting("Manchester 1888");
if ("error" in resolved) throw Error(resolved.error);
const setting = integratedSetting(resolved.setting);
const pack = packForSetting(setting);
const flat = () => ({ elevation: 0, moisture: 0.5, water: 100, kind: "river" as const, snow: false });
const town = (seed: string) =>
  planSettlement(
    { id: "town", cx: 0, cy: 0, home: true, center: { x: 0, y: 0 }, profile: settlementProfile(setting) },
    pack,
    seed,
    flat,
    [],
  );
// Straight legs: the test is of the timing, not of the route finder.
const leg = (a: Point, b: Point) => {
  const out: Point[] = [];
  let { x, y } = a;
  while (x !== b.x || y !== b.y) {
    if (x !== b.x) x += Math.sign(b.x - x);
    else y += Math.sign(b.y - y);
    out.push({ x, y });
  }
  return out;
};

it("keeps the platform road and the far road each to one train at a time", () => {
  const line: Railway = {
    axis: "x", level: 0, lo: -120, hi: 120, span: 4,
    station: { door: { x: 0, y: -6 }, platform: { x: -8, y: -2, w: 16, h: 2 }, side: -1 },
  };
  for (const year of [1845, 1888, 1935, 1975, 2010]) {
    const runs = timetable("rail", "town", { ...setting, year }, line);
    expect(runs).toEqual(timetable("rail", "town", { ...setting, year }, line));
    for (const track of [0, 1] as const) {
      // Sample the day: never two trains on one road where they could meet.
      for (let t = 0; t < DAY; t += 20) {
        const on = trainsAt(line, runs, t).filter((s) => s.run.track === track);
        expect(on.length, `${year} track ${track} at ${t}`).toBeLessThanOrEqual(1);
      }
    }
    for (const run of runs.filter((r) => r.dwell)) {
      const [standing] = trainsAt(line, runs, run.at + 5).filter((s) => s.run === run);
      expect(standing.standing).toBe(true);
      expect(standing.head).toBeCloseTo(stopAt(line, run));
      // The coaches stand along the platform, and have doors on it.
      expect(platformDoors(line, run).length).toBeGreaterThan(0);
      expect(trainLength(run)).toBeGreaterThan(8);
    }
  }
});

it("fits travellers' days to trains that are standing at the platform", () => {
  const plan = town("rail-days");
  const line = plan.railway!;
  expect(line?.station).toBeTruthy();
  const runs = timetable("rail-days", plan.site.id, setting, line);
  const visitors = plan.actors.filter((a) => isVisitor(a.id));
  expect(visitors.length).toBeGreaterThanOrEqual(2);
  const days = [
    ...visitors.map((a) => railDay(plan, "rail-days", pack, a.id, plan.work.get(a.id)!.home, leg)),
    railDay(plan, "rail-days", pack, "town-resident", plan.gatherings?.[0] ?? line.station!.door, leg),
  ];
  expect(days.filter(Boolean).length).toBeGreaterThanOrEqual(2);
  for (const day of days) {
    if (!day) continue;
    expect(day.segments[day.segments.length - 1].to).toBeCloseTo(1440);
    const waits = day.segments.filter((s) => s.label.startsWith("Waiting for"));
    expect(waits).toHaveLength(1);
    // Aboard while it stands: a stopping train is at the platform at the end
    // of the wait, with a door where they were waiting.
    const t = waits[0].to * 60;
    const here = trainsAt(line, runs, t).find((s) => s.standing);
    expect(here).toBeTruthy();
    expect(platformDoors(line, here!.run)).toContainEqual(waits[0].pos);
    // And off one: a visitor's first walk, or a commuter's walk home, starts
    // from a door of a train standing then.
    const off =
      day.segments.find((s) => s.path && s.label === "Walking home from the station") ??
      day.segments.find((s) => s.path)!;
    const arriving = trainsAt(line, runs, off.from * 60).find((s) => s.standing);
    expect(arriving).toBeTruthy();
    expect(platformDoors(line, arriving!.run)).toContainEqual(off.pos);
  }
});

it("staffs the station: a stationmaster and porters working the platform", () => {
  const plan = town("rail-days");
  const staff = plan.actors.filter((a) => a.id.includes("-railstaff-"));
  expect(staff.map((a) => a.role)).toContain("Stationmaster");
  expect(staff.some((a) => a.role === "Porter")).toBe(true);
  const p = plan.railway!.station!.platform;
  for (const a of staff) {
    const stations = plan.stations.get(a.id)!;
    expect(stations.at(-1)!.activity).toBe("rest");
    // Their work is on the platform or at the station's door.
    expect(stations.slice(0, -1).some((s) => s.pos.x >= p.x && s.pos.x < p.x + p.w && s.pos.y >= p.y && s.pos.y < p.y + p.h)).toBe(true);
  }
});

it("lays the line clear of every building, not through one", () => {
  for (const name of ["Manchester 1888", "London 1880"]) {
    const r = resolveSetting(name);
    if ("error" in r) throw Error(r.error);
    const s = integratedSetting(r.setting);
    for (const seed of ["a", "b", "c", "d"]) {
      const plan = planSettlement(
        { id: "town", cx: 0, cy: 0, home: true, center: { x: 0, y: 0 }, profile: settlementProfile(s) },
        packForSetting(s),
        seed,
        flat,
        [],
      );
      const rail = plan.railway;
      if (!rail) continue;
      const across = (p: { x: number; y: number; w: number; h: number }) =>
        rail.axis === "x"
          ? p.y < rail.level + rail.span && p.y + p.h > rail.level && p.x <= rail.hi && p.x + p.w > rail.lo
          : p.x < rail.level + rail.span && p.x + p.w > rail.level && p.y <= rail.hi && p.y + p.h > rail.lo;
      expect(plan.places.filter(across).map((p) => `${name} ${seed} ${p.sprite}`)).toEqual([]);
    }
  }
});

it("works a freight pier and a cross-river ferry on one clock", async () => {
  const {planHarbor, harborRoutine, ferryAt, freightAt, freightLift, serviceFreight}=await import("../src/world/v3/harbor");
  const {itineraryAt}=await import("../src/core/itinerary");
  const plan=town("wharf");
  const piers=[0,-28].map(y=>({x:-20,y:y-2,w:24,h:5,root:{x:0,y},outward:{x:-1,y:0}}));
  const sample=(x:number,y:number)=>({...flat(),water:piers.some(p=>x>=p.x && x<p.x+p.w && y>=p.y && y<p.y+p.h)?1:Math.max(x,-90-x)});
  const railbed=(x:number,y:number)=>x>=12 && x<=16 && y < -18;
  planHarbor(plan,pack,piers,sample,()=>{},railbed,"wharf");
  for (const place of plan.places.filter(p=>p.id.includes("-port-")))
    for (let x=place.x;x<place.x+place.w;x++)
      for (let y=place.y;y<=place.y+place.h;y++) expect(railbed(x,y)).toBe(false);
  const gate=plan.objects.find(o=>o.sprite==="harbor-gate")!;
  expect(gate.kind).toBe("gate");
  expect(plan.solid.has(`${gate.pos.x},${gate.pos.y}`)).toBe(false);
  for (const dx of [-1,1]) expect(plan.solid.has(`${gate.pos.x+dx},${gate.pos.y}`)).toBe(true);
  expect(plan.objects.find(o=>o.prop==="ferryTicketBooth")?.pos.y).toBeLessThan(gate.pos.y);
  expect(plan.objects.some(o=>o.sprite.startsWith("harbor-lorry-"))).toBe(false);
  const later=planSettlement(plan.site,{...pack,setting:{...setting,year:1975}},"later-dock",sample,[],undefined,undefined,piers,railbed);
  const lorry=later.objects.find(o=>o.sprite.startsWith("harbor-lorry-cabover-"))!;
  const {buildingArtCells}=await import("../src/content/graphics/models");
  expect(later.places.flatMap(p=>buildingArtCells(p.sprite,p)).some(p=>
    Math.abs(p.x-lorry.pos.x)<=2 && Math.abs(p.y-lorry.pos.y)<=1)).toBe(false);
  expect(later.harbor).toBeUndefined();
  const h=plan.harbor!;
  expect(h).toBeDefined();
  expect(sample(h.farGate.x,h.farGate.y).water).toBeGreaterThanOrEqual(0);
  expect(ferryAt(h,600)).toMatchObject({...h.far,moving:false});
  expect(ferryAt(h,1200)).toMatchObject({...h.ferry,moving:false});
  const routine=harborRoutine(h,4);
  for(let t=270;t<600;t+=30){
    const ship=ferryAt(h,t),person=itineraryAt(routine,t);
    expect(Math.abs(ship.x-person.x)).toBeLessThan(8.75);
    expect(Math.abs(ship.y-person.y)).toBeLessThan(1);
  }
  for(let t=0;t<3600;t+=15){
    const ship=freightAt(h,t);
    expect(sample(ship.x,ship.y).water).toBeLessThan(0);
  }
  const sling=plan.objects.find(o=>o.freight)!,store=plan.objects.find(o=>o.id===sling.freight!.store)!;
  const wagon=plan.objects.find(o=>o.id.endsWith("-port-wagon"))!;
  for (let i=0;i<6;i++) {
    const before=i*120+87, release=before+1;
    expect(freightLift(before)).toMatchObject({index:i,attached:true,landed:i});
    expect(freightLift(release)).toMatchObject({attached:false,landed:i+1,height:0});
    serviceFreight(sling,store,wagon,before);
    expect(store.inventory.grain).toBe(i);
    serviceFreight(sling,store,wagon,release);
    expect(store.inventory.grain).toBe(i+1);
  }
  expect(freightLift(3599)).toMatchObject({active:false,landed:6});
  for(const clock of [721,721]){
    serviceFreight(sling,store,wagon,clock);
    expect((sling.inventory.grain??0)+(store.inventory.grain??0)).toBe(6);
  }
  serviceFreight(sling,store,wagon,1400);
  expect(wagon.inventory.grain).toBe(6);expect(store.inventory.grain).toBe(0);
  expect(wagon.sprite).toBe("harbor-freight-truck-laden");
  serviceFreight(sling,store,wagon,1801);
  expect(wagon.inventory.grain).toBe(0);
  expect(wagon.sprite).toBe("harbor-freight-truck");
});

it("operates the passenger gate and buys one ticket per paid keypress", async () => {
  const {createSession,Runtime}=await import("../src/runtime/session");
  const e=createSession("roman","ticket-window"), p=e.state.player;
  p.direction=0;
  const at={...p.pos,y:p.pos.y-1};
  const gate={id:"passenger-gate",kind:"gate" as const,name:"Passenger gate",pos:at,sprite:"harbor-gate",open:false,inventory:{}};
  const booth={id:"booth",kind:"monument" as const,name:"Ticket booth",pos:{...p.pos,x:p.pos.x+1},sprite:"harbor-ticket-office",prop:"ferryTicketBooth",inventory:{}};
  e.state.objects.push(gate,booth);
  const runtime=new Runtime(e,{cacheTerrain:false});
  try {
    expect(runtime.pressSwing()?.command?.action).toBe("open");
    expect(gate.open).toBe(true);
    expect(runtime.pressSwing()?.command?.action).toBe("close");
    expect(gate.open).toBe(false);
    p.direction=1;
    p.inventory.coin=1;
    const position={...p.pos};
    expect(runtime.pressSwing()?.command?.action).toBe("attend");
    expect(p.inventory["ferry-ticket"]).toBe(1);
    expect(p.inventory.coin).toBe(0);
    runtime.pressSwing();
    expect(p.inventory["ferry-ticket"]).toBe(1);
    expect(p.pos).toEqual(position);
  } finally {
    runtime.dispose();
  }
});

it("steers an unattended truck through eight headings and parks it outside the cab", async () => {
  const {createSession,Runtime}=await import("../src/runtime/session");
  const {truckOffset}=await import("../src/world/v3/conveyances");
  const e=createSession("roman","truck-controls"), p=e.state.player;
  e.world.blocked=(x)=>x>=110;
  e.world.terrain=(_x,y)=>y<94 ? "water" : "paving";
  const truck={id:"truck",name:"Delivery truck",kind:"monument" as const,pos:{x:100,y:100,space:"outside"},
    motor:{facing:6,long:true},sprite:"harbor-lorry-bonnet-1-2-6",inventory:{grain:3}};
  e.state.objects.push(truck);
  p.pos={...truckOffset(truck.pos,6,2,2),space:"outside"};
  const runtime=new Runtime(e,{cacheTerrain:false});
  try {
    expect(runtime.pressSwing()?.command?.action).toBe("drive-vehicle");
    expect(p.drivingVehicle).toBe(truck.id);
    for(const [f,[dx,dy]] of [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]].entries()) {
      expect(runtime.move(dx,dy)?.status).toBe("completed");
      expect(truck.motor.facing).toBe(f);
      expect(truck.sprite.endsWith("-"+f)).toBe(true);
      expect(p.pos).toEqual(truck.pos);
    }
    e.world.canCross=(_from,to)=>to.y>=94;
    for(let i=0;i<10;i++)runtime.move(0,-1);
    expect(runtime.move(0,-1)?.status).toBe("rejected");
    for(let i=0;i<4;i++)runtime.move(0,1);
    for(let i=0;i<10;i++)runtime.move(1,0);
    expect(truck.pos.x).toBe(106);
    expect(runtime.move(1,0)?.status).toBe("rejected");
    expect(runtime.pressSwing()?.command?.action).toBe("leave-vehicle");
    expect(p.drivingVehicle).toBeUndefined();
    expect(p.pos).not.toEqual(truck.pos);
    expect(truck.inventory.grain).toBe(3);
    expect(e.blocked(truck.pos.x,truck.pos.y,"outside")).toBe(true);
  } finally {runtime.dispose();}
});

it.runIf(!!process.env.FULL)("delivers a Hudson cargo through the furnished waterfront to the freight wagon", async () => {
  const { prepareConnectedStart } = await import("../src/runtime/map-travel");
  const seed = "hudson-docks", resolved = resolveSetting("Dockworker in New York 1930", seed);
  if ("error" in resolved) throw Error(resolved.error);
  const engine = await prepareConnectedStart(resolved.setting, seed);
  const port = engine.world.harbor!()!;
  const sling = engine.state.objects.find(o => o.id === port.manifest)!;
  const store = engine.state.objects.find(o => o.id === sling.freight!.store)!;
  const wagon = engine.state.objects.find(o => o.id.endsWith("-port-wagon"))!;
  expect(wagon.sprite).toBe("harbor-freight-truck");
  const hour = Math.floor(engine.state.clock / 3600) * 3600;
  engine.state.clock = hour + 87;
  engine.advance(1);
  expect([sling.inventory.grain, store.inventory.grain]).toEqual([5, 1]);
  engine.state.clock = hour + 1319;
  engine.advance(1);
  expect([sling.inventory.grain, store.inventory.grain, wagon.inventory.grain]).toEqual([0, 0, 6]);
  const {vehicleSchedule,deliveryAt,truckOffset}=await import("../src/world/v3/conveyances");
  const truck=engine.state.objects.find(o=>o.motor)!, v=engine.world.vehicle!(truck.id)!;
  const job=v.delivery!, driver=engine.state.actors.find(a=>a.id===v.crew[0])!;
  const stock=engine.state.objects.find(o=>o.id===job.store)!, recipient=engine.state.objects.find(o=>o.id===job.customer)!;
  const {drive,cycle}=vehicleSchedule(v,0);
  const tick=(phase:number)=>{
    engine.state.clock=Math.ceil(cycle*Math.ceil((hour+v.phase*cycle-phase)/cycle)+phase-v.phase*cycle);
    engine.advance(1);
  };
  tick(2*drive+v.waits[0]+job.tails[0]*2+55);
  const loaded=truck.inventory.grain!;
  expect(loaded).toBeGreaterThan(0);
  const balance=stock.inventory.grain;
  engine.advance(1);
  expect(stock.inventory.grain).toBe(balance);
  tick(drive/2);
  expect(driver.pos.space).toBe("cab:"+truck.id);
  const cab=truckOffset(truck.pos,truck.motor!.facing,2,2);
  engine.state.player.pos={...cab,space:"outside"};
  expect(engine.vehicleCab(truck)).toBe(false);
  tick(drive+job.tails[1]*2+30);
  expect(driver.activity).toBe("Unloading the truck");
  expect(truck.inventory.grain).toBeGreaterThan(0);
  tick(drive+job.tails[1]*2+55);
  expect(recipient.inventory.grain).toBe(loaded);
  expect(truck.inventory.grain).toBe(0);
  tick(drive+550);
  expect(driver.pos.space).toBe(job.place);
  expect(deliveryAt(v,engine.state.clock+3000).inOffice).toBe(true);
  expect(driver.origin?.livelihood).toBe("lorry-driver");
  engine.state.player.pos={...job.walks[1][0],space:"outside"};
  const {Runtime}=await import("../src/runtime/session");
  const runtime=new Runtime(engine,{cacheTerrain:false});
  try {
    runtime.pressSwing();
    expect(engine.state.player.drivingVehicle).toBe(truck.id);
    const step=[[1,0],[-1,0],[0,1],[0,-1]].find(([dx,dy])=>!engine.validate({type:"move",dx,dy}));
    expect(step).toBeDefined();
    expect(runtime.move(step![0],step![1])?.status).toBe("completed");
    runtime.pressSwing();
    expect(engine.state.player.drivingVehicle).toBeUndefined();
    const parked={...truck.pos};
    engine.advance(6);
    expect(truck.pos).toEqual(parked);
  } finally {runtime.dispose();}
});

it("sails an eight-heading circuit and transfers the same cloth through lighter, landing and store",async()=>{
  const {anchorageAt,planAnchorage,serviceAnchorage}=await import("../src/world/v3/harbor");
  const {launchAt,shoreDirections}=await import("../src/world/v3/shoreline");
  const water=(x:number,_y:number)=>({...flat(),kind:"sea" as const,water:40-x});
  const slip=launchAt({x:20,y:0},shoreDirections[1],water,()=>false,{width:5,dryLength:14,reach:36,waterLength:8})!;
  const plan={site:{id:"port"},solid:new Set<string>(),traffic:new Set<string>()} as Parameters<typeof planAnchorage>[0];
  const a=planAnchorage(plan,slip,{x:22,y:12},water,100)!;
  const headings=new Set<number>();
  for(let t=0;t<3600;t+=10){
    const {dhow,lighter}=anchorageAt(a,t);
    expect(water(dhow.x,dhow.y).water).toBeLessThan(-6);
    expect(water(lighter.x,lighter.y).water).toBeLessThan(-2);
    headings.add(dhow.heading);
  }
  expect(headings.size).toBe(8);
  expect(planAnchorage(plan,slip,{x:22,y:12},(x,y)=>({...water(x,y),water:x>49 ? 1 : 40-x}),100)).toBeUndefined();
  const object=(id:string):import("../src/core/types").WorldObject=>({id,kind:"monument",name:id,sprite:id,pos:{x:0,y:0,space:"outside"},inventory:{}});
  const pile=object("landing"),store=object("store"),dhow=object("dhow"),lighter=object("lighter");
  pile.lighterage={site:"port",store:store.id,porter:"porter",lift:-1};
  for(const [o,form] of [[dhow,"dhow"],[lighter,"lighter"]] as const)o.vessel={form,site:"port",skipper:"pilot",finish:0,heading:0};
  pile.pos={...a.landing,space:"outside"};store.pos={...a.store,space:"outside"};
  const porter={pos:pile.pos};
  const tick=(t:number)=>{
    const ships=anchorageAt(a,t);
    for(const o of [dhow,lighter])Object.assign(o.pos,ships[o.vessel!.form]);
    serviceAnchorage(pile,store,dhow,lighter,t,porter);
    return [dhow,lighter,pile,store].map(o=>o.inventory.cloth??0);
  };
  expect(tick(1)).toEqual([3,0,0,0]);
  expect(tick(1290)).toEqual([0,3,0,0]);
  expect(tick(1291)).toEqual([0,3,0,0]);
  lighter.vessel!.manual=true;
  expect(tick(1680)).toEqual([0,3,0,0]);
  lighter.vessel!.manual=false;
  expect(tick(1686)).toEqual([0,0,3,0]);
  expect(tick(1800)).toEqual([0,0,2,0]);
  expect(tick(2159)).toEqual([0,0,2,0]);
  porter.pos=store.pos;
  expect(tick(2160)).toEqual([0,0,2,1]);
  expect(tick(2166)).toEqual([0,0,2,1]);
});
