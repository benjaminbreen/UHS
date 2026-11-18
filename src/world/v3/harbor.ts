import { generateCharacter } from "../../content/characters/generate";
import { proceduralName } from "../../content/geography/character";
import type { Actor } from "../../core/types";
import type { Itinerary } from "../../core/itinerary";
import type { Pack, Place, Point, WorldObject } from "../../core/types";
import { random } from "../../core/random";
import { paintedDoor } from "../../core/doors";
import { buildingModel } from "../../content/graphics/models";
import { lampFor } from "../../content/settlements/ornaments";
import { modernity } from "../../content/settlements/modernity";
import { cellKey, type SettlementPlan, type Rect, type Road } from "./types";
import { navigableHull } from "../../core/watercraft";
import { route } from "../../core/routing";
import type { Launch, QuayPier } from "./shoreline";
import type { Sample } from "./roads";

export type WharfDrain = { inlet: Point; outlet: Point };
export type WharfPlatform = Rect & { gateX: number; rise: number; finish: "slab" | "brick" | "concrete"; approach?: Rect };
export type Harbor = {
  sign: number;
  ferry: Point;
  far: Point;
  gate: Point;
  farGate: Point;
  yard: Rect[];
  platforms: WharfPlatform[];
  cartways: Road[];
  drains: WharfDrain[];
  dolphins: Point[];
  crane: Point;
  manifest: string;
  cargo: Point;
  lane: Point;
  roadstead: Point;
  shed: Point;
  rails: Point;
};
const shift = (p: Point, x: number, y: number): Point => ({
  x: p.x + x,
  y: p.y + y,
});
const between = (a: Point, b: Point, t: number) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
const smooth = (t: number) => t * t * (3 - 2 * t);
export const FERRY_PERIOD = 1200;
export function ferryAt(h: Harbor, clock: number) {
  const phase = ((clock % FERRY_PERIOD) + FERRY_PERIOD) % FERRY_PERIOD,
    back = phase >= 600,
    t = phase % 600;
  const a = back ? h.far : h.ferry,
    b = back ? h.ferry : h.far;
  return {
    ...between(a, b, t < 240 ? 0 : smooth((t - 240) / 360)),
    heading: (back ? -h.sign : h.sign) > 0 ? 2 : 6,
    moving: t >= 240,
    back,
  };
}
export function freightAt(h: Harbor, clock: number) {
  const phase = ((clock % 3600) + 3600) % 3600;
  const outward = phase < 1800,
    t = outward ? phase : 3600 - phase;
  let a = h.cargo,
    b = h.lane,
    progress = Math.max(0, (t - 780) / 240);
  if (t >= 1020) {
    a = h.lane;
    b = h.roadstead;
    progress = Math.min(1, (t - 1020) / 660);
  }
  const turn = Math.min(1, Math.max(0, (t - 915) / 230));
  const approach = h.sign < 0 ? 2 : -2;
  const upriver =
    (Math.atan2(h.roadstead.x - h.lane.x, h.lane.y - h.roadstead.y) * 4) /
    Math.PI;
  const riverHeading = outward ? upriver : (h.sign < 0 ? 4 : -4) + upriver;
  let bearing = approach + (riverHeading - approach) * smooth(turn);
  if (t >= 1680)
    bearing = upriver + (h.sign < 0 ? 4 : -4) * smooth((phase - 1680) / 240);
  return {
    ...between(a, b, smooth(Math.min(1, progress))),
    heading: ((Math.round(bearing) % 8) + 8) % 8,
    moving: t > 780 && t < 1680,
    loading: t < 780,
    phase,
  };
}

const LIFT_PERIOD = 120, RELEASE = 88;
export const WHARF_STOPS = [24,18,14];
export function freightLift(clock: number) {
  const phase=((clock%3600)+3600)%3600;
  const active=phase < 6*LIFT_PERIOD, index=active ? Math.floor(phase/LIFT_PERIOD) : 0;
  const t=active ? phase%LIFT_PERIOD : 0, target=WHARF_STOPS[index%3];
  const ease=(a:number,b:number)=>smooth(Math.max(0,Math.min(1,(t-a)/(b-a))));
  const travel=ease(38,68)-ease(98,120);
  const height=active ? 44*(1-ease(0,17)+ease(20,38)-ease(69,RELEASE)+ease(RELEASE,98)) : 44;
  return {active,index,target,travel,height,pose:Math.round(travel*target),
    attached:t>=19 && t<RELEASE,landed:Math.min(6,Math.floor((phase+LIFT_PERIOD-RELEASE)/LIFT_PERIOD))};
}

export function planHarbor(
  plan: SettlementPlan,
  pack: Pack,
  piers: readonly QuayPier[],
  sample: Sample,
  pave: (r: Rect) => void,
  railbed: (x: number, y: number) => boolean,
  seed: string,
) {
  const s = pack.setting;
  if (!s || s.year<1885) return;
  const parkLorry = (spots: Point[]) => {
    if (s.year < Math.max(1910,modernity(s).motor-30)) return;
    const roll=(key:string)=>random(seed,plan.site.id,"dock-lorry",key);
    const long=roll("body")<.45 ? 1 : 0, paint=Math.floor(roll("paint")*4);
    const era=s.year<1950 ? "bonnet" : "cabover";
    for (const at of spots) {
      const cells: string[]=[];
      const half=long || era==="bonnet" ? 3 : 2;
      for (let y=at.y-1;y<=at.y;y++) for (let x=at.x-half;x<=at.x+half;x++) {
        const k=cellKey(x,y);
        if (sample(x,y).water>0 && !railbed(x,y) && !plan.solid.has(k) && !plan.traffic.has(k) &&
            !plan.objects.some(o=>o.pos.x===x && o.pos.y===y) && !plan.places.some(p=>p.entrance.x===x && p.entrance.y===y))
          cells.push(k);
      }
      if (cells.length!==(2*half+1)*2) continue;
      if (!plan.harbor) {
        const bay={x:at.x-half-1,y:at.y-3,w:half*2+3,h:6};
        plan.plots.push({...bay,kind:"public",id:plan.site.id+"-waterfront-loading-bay",access:shift(at,0,1)});
        const bays=(plan.loadingBays ??= new Map()), levels=(plan.groundLevels ??= new Map());
        const level=Math.round(sample(at.x,at.y).elevation/14);
        for (let y=bay.y;y<bay.y+bay.h;y++) for (let x=bay.x;x<bay.x+bay.w;x++) {
          const key=cellKey(x,y);
          if (sample(x,y).water<=0 || railbed(x,y) || plan.traffic.has(key)) continue;
          pave({x,y,w:1,h:1});
          bays.set(key,bay);
          levels.set(key,level);
          plan.streetSurfaces?.set(key,"concrete");
        }
      }
      for (const k of cells) plan.reserved.add(k);
      plan.objects.push({id:plan.site.id+"-port-delivery",name:"Dock delivery truck",kind:"monument",
        description:s.year<1950 ? "A canvas-covered delivery body behind a long bonnet. Freight tags hang from the tailboard." : "A short cab tips forward over the engine. The ribbed freight box has double doors at the back.",
        pos:{...at,space:"outside"},sprite:`harbor-lorry-${era}-${long}-${paint}-6`,motor:{facing:6,long:!!long},inventory:{}});
      return;
    }
  };
  const distanceToTown=(p:QuayPier)=>Math.hypot(p.root.x-plan.site.center.x,p.root.y-plan.site.center.y);
  const byTown=[...piers].sort((a,b)=>distanceToTown(a)-distanceToTown(b));
  const parkAtQuay=()=>parkLorry(byTown.flatMap(p=>[4,6,9].map(d=>shift(p.root,-p.outward.x*d,-p.outward.y*d+3))));
  if (s.year>1955 || !["north-america","britain","western-europe"].includes(modernity(s).id)) {
    parkAtQuay();
    return;
  }
  const candidates = byTown.filter(p=>p.w>=24);
  for (const ferry of candidates) {
    const sign = ferry.outward.x;
    const freight = piers.find(
      (p) =>
        p.w >= 24 &&
        p.outward.x === sign &&
        p.root.y === ferry.root.y - 28 &&
        Math.abs(p.root.x - ferry.root.x) < 22,
    );
    if (!freight) continue;
    const water = (p: Point) =>
      sample(Math.round(p.x), Math.round(p.y)).water < 0;
    const ferryPos = shift(ferry.root, sign * 13, 5),
      gate = shift(ferry.root, sign * 12, 2);
    let across = 32;
    while (across < 148 && water(shift(ferry.root, sign * across, 5))) across++;
    if (across < 53 || across === 148) continue;
    const far = shift(ferry.root, sign * (across - 11), 5),
      farGate = shift(ferry.root, sign * (across + 1), 5);
    if (
      s.playableMap &&
      Math.max(Math.abs(farGate.x), Math.abs(farGate.y)) >=
        s.playableMap.size / 2 - 2
    )
      continue;
    const cargo = shift(freight.root, sign * 13, 5),
      lane = shift(cargo, sign * 24, 0);
    let roadstead = lane;
    const clear = (p: Point, rx: number, ry: number) =>
      [-rx, 0, rx].every((x) =>
        [-ry, 0, ry].every((y) => water(shift(p, x, y))),
      );
    if (
      !Array.from(
        { length: Math.ceil(Math.abs(far.x - ferryPos.x)) + 1 },
        (_, i) => shift(ferryPos, sign * i, 0),
      ).every((p) => clear(p, 9, 2))
    )
      continue;
    if (
      !Array.from({ length: 13 }, (_, i) => between(cargo, lane, i / 12)).every(
        (p) => clear(p, 9, 2),
      )
    )
      continue;
    for (let i = 2; i <= 76; i += 2) {
      const p = shift(lane, sign * Math.round(i * 0.22), -i);
      if (!clear(p, 4, 9)) break;
      roadstead = p;
    }
    if (lane.y - roadstead.y < 12) continue;
    const at = (pier: QuayPier, inland: number, dy: number) =>
      shift(pier.root, -sign * inland, dy);
    const building = (
      pier: QuayPier,
      name: string,
      frame: string,
      inland: number,
      dy: number,
    ): Place => {
      const m = buildingModel(frame),
        [w, h] = m.footprint,
        center = at(pier, inland, dy);
      const x = center.x - (w >> 1),
        y = center.y - h + 1;
      const p: Place = {
        id: plan.site.id + "-port-" + frame,
        name,
        sprite: frame,
        x,
        y,
        w,
        h,
        entrance: { x: x + m.entrance[0], y: y + h },
        access: "public",
        owner: plan.site.id + "-community",
        claim: frame,
        entranceLabel: "Enter",
        description: frame.endsWith("shed")
          ? "Freight comes off the pier under a tally clerk’s eye. Loaded wagons stand at the warehouse doors."
          : frame.endsWith("wharf-store") ? "A tally window looks over the loading doors. Sorted cases await collection by road."
          : "The ticket windows face the river slip. Passengers gather here for the crossing.",
      };
      p.door = paintedDoor(p);
      if (p.door) p.entrance = shift(p.door, 0, 1);
      return p;
    };
    const terminal = building(
      ferry,
      "Municipal ferry house",
      "worksite-ferry-terminal",
      10,
      1,
    );
    const buildable = (p: Place) => {
      for (let y=p.y;y<=p.y+p.h;y++)
        for (let x=p.x;x<p.x+p.w;x++)
          if (sample(x,y).water<0 || railbed(x,y)) return false;
      return true;
    };
    const lots=[1,-4,-8,5].flatMap(dy=>[15,10,21,26,32].map(inland=>({dy,inland})));
    lots.sort((a,b)=>Math.abs(a.inland-15)+Math.abs(a.dy-1)-Math.abs(b.inland-15)-Math.abs(b.dy-1));
    const warehouse=lots.map(({dy,inland})=>building(freight,"Pier freight warehouse","worksite-transit-shed",inland,dy)).find(buildable);
    if (!warehouse || !buildable(terminal)) continue;
    const crane = at(freight, -13, 0),
      rails = {x: at(freight,15,0).x, y: Math.max(warehouse.y+warehouse.h+3,freight.root.y-1)};
    const court: WharfPlatform={x:terminal.x-2,y:terminal.y-1,w:terminal.w+4,h:terminal.h+5,gateX:terminal.entrance.x,rise:5,finish:"slab"};
    const harbor: Harbor = {
      sign,
      yard: [],
      dolphins: [],
      platforms: [],
      cartways: [],
      drains: [],
      manifest: plan.site.id + "-port-manifest",
      ferry: ferryPos,
      far,
      gate,
      farGate,
      crane,
      cargo,
      lane,
      roadstead,
      shed: warehouse.entrance,
      rails,
    };
    plan.harbor = harbor;
    const levels=(plan.groundLevels ??= new Map()), quayLevel=Math.round(sample(freight.root.x,freight.root.y).elevation/14);
    for (let y = Math.min(freight.root.y-10,warehouse.y-6); y <= ferry.root.y + 7; y++) {
      const t = (y - freight.root.y) / 28;
      const bank = Math.round(between(freight.root, ferry.root, t).x);
      const inland = sign < 0 ? Math.max(warehouse.x+warehouse.w+2,terminal.x+terminal.w+3)
        : Math.min(warehouse.x-3,terminal.x-3);
      const left = Math.min(bank+sign*4,inland), right = Math.max(bank+sign*4,inland);
      const width = right-left+1;
      let start: number | undefined;
      for (let xx = left; xx <= left + width; xx++) {
        const ground = sample(xx,y);
        const dry = xx < left + width && ground.water >= 0 && ground.quay !== "plank";
        if (dry && start === undefined) start = xx;
        if (!dry && start !== undefined) {
          const row = { x: start, y, w: xx - start, h: 1 };
          harbor.yard.push(row);
          pave(row);
          for (let u = start; u < xx; u++) {
            const key=cellKey(u,y);
            plan.streetSurfaces?.set(key,"sett");
            levels.set(key,quayLevel);
          }
          start = undefined;
        }
      }
    }
    const storehouse = building(
      freight,
      "Wharf dispatch office",
      "worksite-wharf-store",
      15,
      19,
    );
    const offices = [terminal, warehouse];
    if (
      buildable(storehouse) && sample(storehouse.x, storehouse.y).water > 1 &&
      sample(storehouse.x + storehouse.w, storehouse.y + storehouse.h).water > 1
    )
      offices.push(storehouse);
    const truck = shift(rails,sign*3,5);
    const bank: WharfPlatform = {x:Math.min(rails.x+sign*9,rails.x+sign), y:rails.y+4,w:9,h:3,gateX:truck.x,rise:6,finish:"brick"};
    harbor.platforms.push(bank);
    const dockMouth = at(freight,1,0), turn = at(freight,3,3);
    const dispatch = offices.includes(storehouse) ? storehouse : warehouse;
    const door = dispatch.entrance;
    if (dispatch === storehouse) harbor.platforms.push({
      x:storehouse.x-1,y:storehouse.y+storehouse.h-1,w:storehouse.w+2,h:4,gateX:door.x,rise:5,finish:"concrete",
    });
    for (const pad of harbor.platforms) {
      const front=pad.y+pad.h;
      const inlet={x:sign<0 ? pad.x+.8 : pad.x+pad.w-.8,y:front+(pad.rise+5)/16};
      const outY=front+2>=court.y ? front-1 : front+2;
      const row=harbor.yard.find(r=>r.y===outY && inlet.x>=r.x && inlet.x<r.x+r.w);
      if (row) {
        const outlet={x:sign<0 ? row.x+.65 : row.x+row.w-.65,y:row.y+.5};
        if (Math.abs(outlet.x-inlet.x)>3) harbor.drains.push({inlet,outlet});
      }
    }
    harbor.platforms.push(court);
    const walkY=court.y+court.h-4;
    const mouth=harbor.yard.find(r=>r.y===walkY && r.x<=terminal.entrance.x && r.x+r.w>terminal.entrance.x);
    if (mouth) {
      const left=sign<0 ? court.x : mouth.x;
      const right=sign<0 ? mouth.x+mouth.w : court.x+court.w;
      if (right-left>court.w+4)
        court.approach={x:left,y:walkY,w:right-left,h:court.y+court.h-walkY};
    }
    const sill = dispatch===storehouse ? shift(door,0,3) : at(ferry,18,-4);
    const riverside = {x:sill.x+sign*(dispatch.w/2+4),y:sill.y};
    const exitRow=harbor.yard.find(r=>r.y===Math.round(sill.y)+3 && sill.x>=r.x && sill.x<r.x+r.w);
    const roadEnd={x:exitRow ? (sign<0 ? exitRow.x+exitRow.w : exitRow.x) : sill.x-sign*8,y:sill.y+3};
    const junction=shift(turn,sign,10);
    const ways=[
      [dockMouth,turn,junction,shift(riverside,sign*2,-4),riverside,shift(sill,0,2),roadEnd],
      [shift(truck,0,1),shift(truck,0,4),junction],
      [shift(warehouse.entrance,0,1),shift(warehouse.entrance,0,3),at(freight,6,-3),dockMouth],
    ];
    if (dispatch===storehouse) ways.push([shift(door,0,1),sill,shift(sill,-sign*3,3),roadEnd]);
    harbor.cartways=ways.map((points,i)=>({id:plan.site.id+"-cartway-"+i,kind:"lane",cost:0,width:i===0 ? 2 : 1,points}));
    for (const p of offices) {
      plan.places.push(p);
      for (let y = p.y; y < p.y + p.h; y++)
        for (let x = p.x; x < p.x + p.w; x++) {
          const k = cellKey(x, y);
          plan.built?.add(k);
          plan.solid.add(k);
        }
      plan.solid.delete(cellKey(p.entrance.x, p.entrance.y));
      plan.plots.push({
        ...p,
        id: p.id + "-yard",
        kind: "public",
        access: p.entrance,
      });
    }
    const tracks = (plan.tracks ??= new Map());
    for (let y = 0; y < 4; y++)
      for (let x = -9; x <= 10; x++) {
        const k = cellKey(rails.x + x, rails.y + y);
        tracks.set(k, { axis: "x", at: y });
        plan.pavement?.set(k, "rail");
      }
    const object = (
      key: string,
      name: string,
      p: Point,
      sprite: string,
      kind: WorldObject["kind"] = "monument",
    ) => {
      const o: WorldObject = {
        id: plan.site.id + "-port-" + key,
        name,
        sprite,
        pos: { ...p, space: "outside" },
        inventory: {},
        kind,
      };
      plan.objects.push(o);
      return o;
    };
    object(
      "ticket",
      "Board the cross-river ferry",
      gate,
      "harbor-departures",
    ).passage = { destination: farGate, back: false };
    object("return", "Return ferry landing", farGate, "harbor-cleat").passage =
      { destination: gate, back: true };
    const sling = object(
      "manifest",
      "Inbound cargo sling",
      at(freight, -8, 1),
      "study-propb-crate-stack-0",
      "container",
    );
    sling.freight = { store: plan.site.id + "-port-store", call: -1 };
    sling.inventory.grain = 6;
    object(
      "store",
      "Pier warehouse stock",
      shift(warehouse.entrance, 4, 0),
      "study-propb-crate-stack-1",
      "container",
    );
    object(
      "wagon",
      "Freight wagon consignment",
      truck,
      "harbor-freight-truck",
      "container",
    );
    for (const pier of [ferry, freight])
      for (const u of [4, 13, 20])
        for (const y of [-2, 3]) {
          const p = at(pier, -u, y);
          object("pile-" + p.x + "-" + p.y, "Fender pile", p, "harbor-pile");
        }
    for (let y=harbor.yard[0].y;y<=ferry.root.y+7;y+=5) {
      if (Math.min(Math.abs(y-freight.root.y),Math.abs(y-ferry.root.y))<=3) continue;
      const bank=Math.round(between(freight.root,ferry.root,(y-freight.root.y)/28).x);
      for (let offset=6;offset>=-8;offset--) {
        const x=bank+sign*offset;
        const shore=sample(x,y);
        if (shore.water<.5 || shore.water>1.65 || shore.quay==="plank") continue;
        object("bollard-"+y,"Cast-iron mooring bollard",{x,y},"harbor-bollard");
        break;
      }
    }
    for (const pier of [ferry,freight]) {
      for (const u of [5,21]) {
        const p=at(pier,-u,8);
        if (water(p)) {
          harbor.dolphins.push(p);
          object("dolphin-"+p.x+"-"+p.y,"Bound mooring piles",p,"harbor-dolphin");
        }
      }
    }
    for (const [i,dy] of [1,3].entries()) {
      object("buffer-"+i,"Timber buffer stop",shift(rails,sign*9,dy),"harbor-buffer");
    }
    const barrow=object("barrow","Freight wheelbarrow",shift(door,-4,3),
      "study-propb-wheelbarrow-"+(s.year<1950 ? 0 : 2));
    barrow.prop="lotWheelbarrow";
    object(
      "sacks",
      "Sacks awaiting dispatch",
      shift(dispatch.entrance,-3,1),
      "study-propb-grain-sacks-0",
    );
    object(
      "scales",
      "Dispatch clerk’s weighed cases",
      shift(warehouse.entrance,6,1),
      "harbor-platform-scale",
    );
    const lamp = lampFor(pack);
    for (const [i, p] of [
      at(ferry, 3, 5),
      at(ferry, -4, -1),
      at(freight, 5, 7),
      at(freight, 3, -3),
      at(ferry, 16, 6),
    ].entries())
      object("lamp-" + i, lamp.label, p, lamp.sprite);
    const gateY=court.y+court.h-1;
    const booth=object("shelter","Ferry ticket booth",{x:court.gateX-3,y:gateY-2},"harbor-ticket-office");
    booth.prop="ferryTicketBooth";
    object("bench","Ferry waiting bench",{x:court.gateX+3,y:gateY-3},"study-propb-park-bench-0").prop="bench";
    for (const y of [court.y,gateY]) {
      for (let x=court.x;x<court.x+court.w;x++) {
        if (y===gateY && x===court.gateX) {
          object("passenger-gate","Ferry court gate",{x,y},"harbor-gate","gate").open=false;
          continue;
        }
        const post=(x-court.x)%4===0 || x===court.x+court.w-1;
        object("fence-"+x+"-"+y,"Passenger rail",{x,y},"harbor-fence-"+(post ? "post" : "panel"));
        plan.solid.add(cellKey(x,y));
      }
    }
    parkLorry([shift(door,4,2),shift(door,5,3),shift(door,4,5),shift(door,3,6),shift(rails,-sign*5,7)]);
    for (let i = 0; i < 3; i++)
      object(
        "goods-" + i,
        "Freight waiting for collection",
        at(freight, [-2,-4,-7][i], i===1 ? 0 : -1),
        "study-propb-crate-stack-" + (i % 3),
      );
    for (const [i,dx,dy] of [[0,-4,1],[1,-6,1],[2,-5,0]]) {
      const p=shift(warehouse.entrance,dx,dy);
      if (!railbed(p.x,p.y) && sample(p.x,p.y).water>1)
        object("door-goods-"+i,"Cases on the loading bank",p,"study-propb-crate-stack-"+i);
    }
    return;
  }
  parkAtQuay();
}

/** One lighter-load of sacked grain per hourly call. A player working the sling can finish a lift early. */
export function serviceFreight(
  sling: WorldObject,
  store: WorldObject,
  wagon: WorldObject,
  clock: number,
  roadStock?: WorldObject,
) {
  const manifest = sling.freight!;
  const call = Math.floor(clock / 3600),
    phase = clock - call * 3600;
  if (manifest.call !== call) {
    if (manifest.call >= 0) {
      store.inventory.grain = 0;
      wagon.inventory.grain = 0;
    }
    manifest.call = call;
    sling.inventory.grain = 6;
  }
  const left = sling.inventory.grain ?? 0,
    waiting = 6 - freightLift(clock).landed;
  const moved = Math.max(0, left - waiting);
  sling.inventory.grain = left - moved;
  store.inventory.grain = (store.inventory.grain ?? 0) + moved;
  if (phase >= 1320) {
    wagon.inventory.grain =
      (wagon.inventory.grain ?? 0) + (store.inventory.grain ?? 0);
    store.inventory.grain = 0;
  }
  if (phase >= 1800) {
    if(roadStock && wagon.inventory.grain) {
      roadStock.inventory.grain=(roadStock.inventory.grain??0)+Math.min(3,wagon.inventory.grain);
      roadStock.depleted=false;
    }
    wagon.inventory.grain = 0;
  }
  wagon.sprite = wagon.inventory.grain ? "harbor-freight-truck-laden" : "harbor-freight-truck";
}

export function harborStaff(plan: SettlementPlan, pack: Pack, seed: string) {
  const h = plan.harbor,
    s = pack.setting;
  if ((!h && !plan.anchorage) || !s) return;
  for (const [i, role] of (h ? [
    "Longshoreman",
    "Freight tally clerk",
    "Railway porter",
    "Shop clerk",
    "Seamstress",
    "Bookkeeper",
    "Messenger",
  ] : ["Porter","Sailor","Boatman"]).entries()) {
    const id = plan.site.id + (h ? "-wharfhand-" + i : ["-lighter-porter","-dhow-pilot","-lighter-pilot"][i]),
      home = !h ? plan.anchorage!.landing : i < 3 ? h.shed : shift(h.gate, -h.sign * (8 + i), i % 2);
    const pos = { ...home, space: "outside" as const };
    const a: Actor = {
      id,
      kind: "human",
      name: proceduralName(s, seed, id),
      role,
      pos,
      home: pos,
      work: pos,
      sprite: "human-0-2",
      inventory: { water: 1 },
      activity: i < 3 ? "Working the pier" : "Waiting for the ferry",
      fatigue: 0,
      hunger: 4,
      trust: 1,
      memories: [],
      direction: 2,
    };
    Object.assign(a, generateCharacter(s, seed, id, 24 + i * 4, role));
    if(!h && i){
      const ship=plan.objects.find(o=>o.vessel?.skipper===id)!;
      a.boat=ship.id;a.afloat="boat";a.pos={...ship.pos};a.activity="At the tiller";
    }
    a.role = role;
    plan.actors.push(a);
    plan.work.set(id, {
      home,
      work: home,
      water: home,
      social: home,
      label: a.activity,
      offset: 0,
    });
  }
}

export function harborRoutine(h: Harbor, i: number): Itinerary {
  const segments: Itinerary["segments"] = [],
    period = i < 3 ? 12 : 20;
  let last = 0;
  const leg = (
    to: number,
    pos: Point,
    label: string,
    path?: Point[],
    carry?: string,
  ) => {
    segments.push({
      from: last,
      to,
      pos,
      label,
      activity: i < 3 ? (carry ? "haul" : "work") : "visit",
      path,
      carry,
      ...(i >= 3 && { boat: "harbor-ferry" }),
    });
    last = to;
  };
  if (i < 3) {
    const hook = shift(h.crane, -h.sign * (1 + i), 1),
      at = shift(h.shed, 2 + i, 1);
    const turn = shift(h.crane, -h.sign * 17, 1),
      doorAisle = { x: turn.x, y: at.y };
    leg(2, hook, "Making fast the cargo sling");
    leg(
      5,
      hook,
      "Carrying freight to the warehouse",
      [turn, doorAisle, at],
      "grain",
    );
    leg(
      8,
      at,
      i === 1
        ? "Checking the freight tally"
        : "Stacking cases at the freight doors",
    );
    leg(12, at, "Returning to the crane", [doorAisle, turn, hook]);
  } else {
    const side = (i < 5 ? -0.58 : 0.58),
      offset = (i % 2 ? -1 : 1) * (7.8 + (i < 5 ? 0.45 : 0)),
      deck = shift(h.ferry, -h.sign * offset, side),
      away = shift(h.far, h.sign * 8.25, side);
    const stand = shift(h.gate, -h.sign * (2 + (i % 3)), Math.sign(side));
    leg(1, deck, "Walking down the gangway", [shift(deck,0,1.2-side),shift(h.ferry,-h.sign*8,1.2),h.gate,stand]);
    leg(1.5, stand, "Waiting for the cross-river ferry");
    leg(3, stand, "Boarding the ferry", [h.gate, shift(h.ferry,-h.sign*8,1.2),shift(deck,0,1.2-side),deck]);
    leg(4, deck, "On the forward deck");
    const cross = (from: Point, to: Point, back: boolean) => {
      const path = Array.from({ length: 24 }, (_, j) => {
        const f = ferryAt(h, (back ? 840 : 240) + (j + 1) * 15);
        return shift(f, from.x - (back ? h.far : h.ferry).x, side);
      });
      path[23] = to;
      return path;
    };
    const landed = shift(h.far, -h.sign * offset, side),
      returnDeck = deck;
    leg(10, deck, "Crossing the river", cross(deck, landed, false));
    leg(11, landed, "Leaving the ferry", [away, h.farGate]);
    leg(12, h.farGate, "At the far landing");
    leg(14, h.farGate, "Boarding the return ferry", [away, landed]);
    leg(
      20,
      landed,
      "Returning across the river",
      cross(landed, returnDeck, true),
    );
  }
  return { start: i < 3 ? i * 3 : 0, period, segments };
}

export type Anchorage = {
  site: string;
  anchor: Point; outward: Point; shore: Point; landing: Point; store: Point;
  radius: number; reach: number; porterPath: Point[];
};

const approachPoint = (a: Anchorage, angle: number) => {
  const along = a.reach*Math.sin(angle), depth = a.radius*(1-Math.cos(angle)) + along*.48;
  return shift(a.anchor,a.outward.x*depth-a.outward.y*along,a.outward.y*depth+a.outward.x*along);
};
const lighterBerth=(a:Anchorage)=>shift(a.anchor,-a.outward.x*4.5-a.outward.y*2,a.outward.x*2-a.outward.y*4.5);
const headingOf = (dx: number, dy: number) => (Math.atan2(dx,-dy)*4/Math.PI+8)%8;
const bearing8 = (n: number) => (Math.round(n)+8)%8;
const unit = (n:number) => Math.max(0,Math.min(1,n));

export function anchorageAt(a: Anchorage, clock: number) {
  const t=((clock%3600)+3600)%3600;
  const sailing=(t+3600-2160)%3600;
  const p=unit(sailing/2160), angle=2*Math.PI*smooth(p);
  const dy=a.reach*Math.cos(angle),dx=a.radius*Math.sin(angle)+dy*.48,n=a.outward;
  const dhow={...approachPoint(a,angle),heading:bearing8(headingOf(n.x*dx-n.y*dy,n.y*dx+n.x*dy)),
    moving:p>0 && p<1};
  const alongside=lighterBerth(a);
  const outward=headingOf(alongside.x-a.shore.x,alongside.y-a.shore.y);
  const travel=smooth(unit((t-720)/360))-smooth(unit((t-1320)/360));
  const turn=smooth(unit((t-1080)/240))-smooth(unit((t-1680)/240));
  const lighter={...between(a.shore,alongside,travel),heading:bearing8(outward+4*turn),
    moving:t>720 && t<1080 || t>1320 && t<1680};
  return {dhow,lighter};
}

export function planAnchorage(plan: SettlementPlan, launch: Launch, store: Point, sample: Sample, limit: number) {
  const n=launch.direction;
  const at=(d:number,k:number)=>shift(launch.water,n.x*d-n.y*k,n.y*d+n.x*k);
  const wet=(p:Point,clear:number)=>Math.abs(p.x)<limit-clear && Math.abs(p.y)<limit-clear &&
    sample(Math.round(p.x),Math.round(p.y)).water < -clear;
  const water=(x:number,y:number)=>Math.abs(x)<limit && Math.abs(y)<limit && sample(x,y).water< -2;
  const shallows=(x:number,y:number)=>Math.abs(x)<limit && Math.abs(y)<limit && sample(x,y).water< -1;
  for(const side of [6,-6,10,-10]) {
    let bank:Point|undefined, shore:Point|undefined;
    for(let d=-10;d<=18;d++) {
      const p=at(d,side);
      if(sample(p.x,p.y).water>=1) bank=p;
      if(bank && wet(p,1.5) && [0,2,4,6].every(f=>navigableHull(p,f,false,shallows))) {shore=p;break;}
    }
    if(!bank || !shore || plan.solid.has(cellKey(bank.x,bank.y))) continue;
    for(const [offshore,radius,span] of [[15,9.9,18],[12,6,11],[10,3,14],[21,8,16]]) for(const sign of [1,-1]) {
      const reach=span*sign;
      const a:Anchorage={site:plan.site.id,anchor:at(offshore,side+sign*3),outward:{x:n.x,y:n.y},shore,landing:bank,store,
        radius,reach,porterPath:[]};
      let clear=true;
      for(let i=0;i<=64 && clear;i++){
        const angle=i*Math.PI/32,p=approachPoint(a,angle),next=approachPoint(a,angle+.001);
        clear=navigableHull(p,bearing8(headingOf(next.x-p.x,next.y-p.y)),true,water);
      }
      const alongside=lighterBerth(a);
      const course=bearing8(headingOf(alongside.x-shore.x,alongside.y-shore.y));
      for(let i=0;i<=24 && clear;i++)clear=navigableHull(between(shore,alongside,i/24),course,false,shallows);
      if(!clear) continue;
      const walk=route(bank,store,p=>plan.solid.has(cellKey(p.x,p.y)) || sample(p.x,p.y).water<.5 ? Infinity :
        plan.traffic.has(cellKey(p.x,p.y)) ? 1 : 1.4,{maxNodes:4500});
      if(walk.status!=="found") continue;
      a.porterPath=[bank,...walk.path];
      for(const p of a.porterPath) plan.traffic.add(cellKey(p.x,p.y));
      return a;
    }
  }
}

export function porterRoutine(a: Anchorage): Itinerary {
  return {period:60,start:0,segments:[
    {from:0,to:28,pos:a.landing,activity:"work",label:"Waiting for the lighter"},
    {from:28,to:30,pos:a.landing,activity:"work",label:"Sorting the landed bales"},
    {from:30,to:36,pos:a.landing,path:a.porterPath.slice(1),activity:"haul",label:"Going to the shore store"},
    {from:36,to:45,pos:a.store,activity:"work",label:"Stacking the consignment"},
    {from:45,to:51,pos:a.store,path:a.porterPath.slice(0,-1).reverse(),activity:"haul",label:"Walking back to the landing"},
    {from:51,to:60,pos:a.landing,activity:"work",label:"Checking the landing ropes"},
  ]};
}

export function transferCloth(from:WorldObject,to:WorldObject,limit:number) {
  const n=Math.min(from.inventory.cloth??0,Math.max(0,limit));
  from.inventory.cloth=(from.inventory.cloth??0)-n;
  to.inventory.cloth=(to.inventory.cloth??0)+n;
  return n;
}

export function serviceAnchorage(pile: WorldObject, store: WorldObject, dhow: WorldObject, lighter: WorldObject, clock: number, porter: Pick<Actor,"pos"|"dead"|"deliveryBale"> | undefined) {
  const job=pile.lighterage!,call=Math.floor(clock/3600),phase=clock-call*3600;
  const deep=dhow.vessel!,skiff=lighter.vessel!;
  if(deep.loadCall!==call && !deep.manual && (phase<720 || phase>=3240)){
    deep.loadCall=call;dhow.inventory.cloth=3;
  }
  if(!skiff.manual && !deep.manual && phase>=1290 && phase<1326 && skiff.loadCall!==call &&
      Math.hypot(dhow.pos.x-lighter.pos.x,dhow.pos.y-lighter.pos.y)<=6){
    transferCloth(dhow,lighter,3-(lighter.inventory.cloth??0));skiff.loadCall=call;
  }
  if(!skiff.manual && phase>=1680 && phase<2160) transferCloth(lighter,pile,3);
  if(!porter || porter.dead || porter.pos.space!=="outside")return;
  if(phase>=1800 && phase<2160 && job.lift<call && !porter.deliveryBale && (pile.inventory.cloth??0)>0 &&
      Math.hypot(porter.pos.x-pile.pos.x,porter.pos.y-pile.pos.y)<=2.5){
    job.lift=call;porter.deliveryBale=store.id;pile.inventory.cloth!--;
  }
  if(porter.deliveryBale===store.id && Math.hypot(porter.pos.x-store.pos.x,porter.pos.y-store.pos.y)<=2.5){
    delete porter.deliveryBale;store.inventory.cloth=(store.inventory.cloth??0)+1;
  }
}
