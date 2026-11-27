import { isDockworker } from "../../content/characters/city-work";
import { generateCharacter } from "../../content/characters/generate";
import { proceduralName } from "../../content/geography/character";
import type { Actor } from "../../core/types";
import type { Itinerary } from "../../core/itinerary";
import type { Pack, Place, Point, WorldObject } from "../../core/types";
import { random } from "../../core/random";
import { paintedDoor } from "../../core/doors";
import { buildingModel } from "../../content/graphics/models";
import { lampFor } from "../../content/settlements/ornaments";
import { industrialized, modernity } from "../../content/settlements/modernity";
import { cellKey, type SettlementPlan, type Rect, type Road } from "./types";
import { navigableHull } from "../../core/watercraft";
import { route } from "../../core/routing";
import type { Launch, QuayPier } from "./shoreline";
import type { Sample } from "./roads";

export type TerminalDistrict = Point & {name:string; automated:boolean; steel?:boolean};
export type ContainerTerminal = TerminalDistrict & {yard:Rect; manifest:string; store:string};
export type WharfDrain = { inlet: Point; outlet: Point };
export type WharfPlatform = Rect & { gateX: number; rise: number; finish: "slab" | "brick" | "concrete"; approach?: Rect };
export type FerryCrossing = {
  sign: number; ferry: Point; far: Point; gate: Point; farGate: Point;
};
export type Harbor = {
  sign: number;
  crossing?: FerryCrossing;
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
  rails?: Point;
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
export function ferryAt(h: FerryCrossing, clock: number) {
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

/** Crane and carrier share a clock. Each numbered slot corresponds to one lift. */
export function containerMove(clock:number) {
  const phase=((clock%3600)+3600)%3600, index=Math.min(2,Math.floor(phase/240));
  const t=Math.min(240,phase-index*240), ease=(a:number,b:number)=>smooth(Math.max(0,Math.min(1,(t-a)/(b-a))));
  const picked=index+Number(t>=32),onChassis=index+Number(t>=98),delivered=index+Number(t>=196);
  const travel=ease(54,82)-ease(112,144);
  const lift=1-ease(8,32)+ease(32,53)-ease(82,98)+ease(99,112);
  const carrier=ease(100,164)-ease(201,238);
  const voyage=Math.max(0,Math.min(1,(phase-840)/2640));
  const angle=2*Math.PI*smooth(voyage);
  const ship={x:32*Math.sin(angle),y:-13*(1-Math.cos(angle)),
    heading:(8+Math.round(Math.atan2(32*Math.cos(angle),13*Math.sin(angle))*4/Math.PI))%8};
  const slot=-44+58*index, nextSlot=index===2 ? -44 : slot+58;
  const gx=slot+(nextSlot-slot)*Math.max(0,Math.min(1,(t-211)/29));
  const rackX=235, carrierX=gx+103+(rackX-gx-103)*carrier;
  return {phase,index,t,picked,onChassis,delivered,travel,lift,gx,rackX,carrierX,ship};
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
  district?: TerminalDistrict,
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
      if (!plan.harbor && !plan.terminal) {
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
  const building = (
    center: Point,
    name: string,
    frame: string,
  ): Place => {
    const m = buildingModel(frame),
      [w, h] = m.footprint;
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
  const install = (p:Place) => {
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
  };
  if (district) {
    const {x,y,automated,steel}=district, prefix=plan.site.id+"-port-";
    const yard={x:x-22,y,w:45,h:21};
    const object=(key:string,name:string,dx:number,dy:number,sprite:string):WorldObject=>{
      const o:WorldObject={id:prefix+key,kind:"monument",name,pos:{x:x+dx,y:y+dy,space:"outside"},sprite,inventory:{}};
      plan.objects.push(o);return o;
    };
    const store=object("store",steel ? "Steel coil receiving rack" : "Row B · bonded grain consignment",14,5,"harbor-yard-sign");
    const sling=object("manifest",district.name+" · vessel manifest",-4,6,"harbor-yard-desk");
    sling.freight={store:store.id,call:-1,...(steel && {good:"steel-coil" as const}),boxes:{picked:0,landed:0,hook:0,delivered:0,inbound:-1}};
    const feeder=object("feeder",steel ? "Great Lakes freight ship" : "Coastal container feeder",0,-3,steel ? "harbor-feeder-2-0" : "harbor-feeder-2-3");
    feeder.terminalVehicle="feeder";feeder.inventory[steel ? "steel-coil" : "grain"]=steel ? 3 : 9;
    object("wagon",automated ? "Electric lift AGV" : "Terminal tractor and skeletal trailer",4,3,
      "harbor-chassis-"+(automated ? "auto" : "manual")).terminalVehicle="carrier";
    plan.terminal={...district,yard,manifest:sling.id,store:store.id};
    plan.plots.push({...yard,kind:"public",id:prefix+"terminal",access:shift(district,4,7)});
    pave(yard);
    for(let j=y;j<y+yard.h;j++) for(let i=yard.x;i<yard.x+yard.w;i++){
      const key=cellKey(i,j);
      plan.streetSurfaces?.set(key,"concrete");
      (plan.groundLevels ??= new Map()).set(key,0);
    }
    for(let j=0;j<2;j++) for(let i=0;i<5;i++){
      if (!j && i===0)continue;
      const px=-16+i*7,py=12+j*7;
      const colour= Math.floor(random(seed,"box",i,j)*5);
      const count=automated ? 3+(i+j)%2 : 1+(i+2*j)%3;
      object("stack-"+i+"-"+j,"Stack "+String.fromCharCode(65+j)+(i+1),px,py,steel ? "harbor-coil-yard" : "harbor-stack-"+colour+"-"+count);
      for(let v=py-1;v<=py;v++)for(let u=px-2;u<=px+2;u++)plan.solid.add(cellKey(x+u,y+v));
    }
    object("light-west","Quay floodlights",-21,3,"harbor-flood-"+(automated?"auto":"manual"));
    object("light-east","Yard floodlights",21,10,"harbor-flood-"+(automated?"auto":"manual"));
    if(automated) {
      object("reefer","Refrigerated container power points",8,12,"harbor-reefer-pedestal");
      for(let i=-9;i<=9;i++){
        const gate=i===0;
        const o=object("lane-fence-"+i,gate ? "Pedestrian gate" : "Transfer lane fence",i,8,
          gate ? "harbor-gate" : "harbor-fence-"+(Math.abs(i)%4===1 ? "post" : "panel"));
        if(gate)o.kind="gate";else plan.solid.add(cellKey(o.pos.x,o.pos.y));
      }
    }
    for(let i=-20;i<=20;i+=5)object("bollard-"+i,"Quay bollard",i,0,"harbor-bollard");
    const depot=building(shift(district,-17,8),"Freight dispatch warehouse","worksite-wharf-store");
    const fits=(p:Place)=>{
      for(let j=p.y;j<=p.y+p.h;j++)for(let i=p.x;i<p.x+p.w;i++)
        if(sample(i,j).water<=0 || railbed(i,j) || plan.solid.has(cellKey(i,j)))return false;
      return true;
    };
    if (fits(depot)) install(depot);
    if (isDockworker(pack.role)) {
      const room=[-30,32,-38,40].map(dx=>building(shift(district,dx,20),"Dockworker’s flat","mod-slab-0-urban-row")).find(fits);
      if(room){
        room.owner="player";room.access="household";room.claim="residence";
        room.description="A rented flat on the road to the freight yard.";
        install(room);
        const home=room.entrance,work=shift(district,-4,7);
        const chest=object("house-store","Household store",home.x-x+2,home.y-y+1,"chest");
        chest.kind="container";chest.owner="player";
        plan.work.set("player",{home,work,water:home,social:home,role:pack.role,label:"Checking the vessel manifest",offset:0});
      }
    }
    parkLorry([shift(district,18,15),shift(district,10,16),shift(district,0,16)]);
    return;
  }
  const distanceToTown=(p:QuayPier)=>Math.hypot(p.root.x-plan.site.center.x,p.root.y-plan.site.center.y);
  const byTown=[...piers].sort((a,b)=>distanceToTown(a)-distanceToTown(b));
  const parkAtQuay=()=>parkLorry(byTown.flatMap(p=>[4,6,9].map(d=>shift(p.root,-p.outward.x*d,-p.outward.y*d+3))));
  if (!industrialized(s)) { parkAtQuay(); return; }
  const candidates = byTown.filter(p=>p.w>=24);
  const water = (p: Point) => sample(Math.round(p.x), Math.round(p.y)).water < 0;
  const limit=(s.playableMap?.size ?? Infinity)/2;
  const clear = (p: Point, rx: number, ry: number) =>
    Math.abs(p.x)+rx<limit && Math.abs(p.y)+ry<limit && [-rx,0,rx].every(x=>[-ry,0,ry].every(y=>water(shift(p,x,y))));
  const pairs: { freight: QuayPier; ferry?: QuayPier }[] = [];
  if (s.year<=1955) for (const ferry of candidates) {
    const freight=candidates.find(p=>p.outward.x===ferry.outward.x && p.root.y===ferry.root.y-28 && Math.abs(p.root.x-ferry.root.x)<22);
    if (freight) pairs.push({freight,ferry});
  }
  for (const freight of candidates) pairs.push({freight});
  for (const {freight,ferry} of pairs) {
    const sign=freight.outward.x;
    let crossing: FerryCrossing | undefined;
    if (ferry) {
      const slip=shift(ferry.root,sign*13,5);
      let across=32;
      while (across<148 && water(shift(ferry.root,sign*across,5))) across++;
      if (across<53 || across===148) continue;
      const far=shift(ferry.root,sign*(across-11),5), farGate=shift(ferry.root,sign*(across+1),5);
      if (s.playableMap && Math.max(Math.abs(farGate.x),Math.abs(farGate.y))>=s.playableMap.size/2-2) continue;
      if (!Array.from({length:Math.abs(far.x-slip.x)+1},(_,i)=>shift(slip,sign*i,0)).every(p=>clear(p,9,2))) continue;
      crossing={sign,ferry:slip,gate:shift(ferry.root,sign*12,2),far,farGate};
    }
    const cargo=shift(freight.root,sign*13,5),lane=shift(cargo,sign*24,0);
    let roadstead=lane;
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
    const terminal = ferry && building(
      at(ferry,10,1),
      "Municipal ferry house",
      "worksite-ferry-terminal",
    );
    const buildable = (p: Place) => {
      for (let y=p.y;y<=p.y+p.h;y++)
        for (let x=p.x;x<p.x+p.w;x++)
          if (Math.abs(x)>=limit || Math.abs(y)>=limit || sample(x,y).water<0 || railbed(x,y) || !ferry && plan.solid.has(cellKey(x,y))) return false;
      return true;
    };
    const lots=[1,-4,-8,5].flatMap(dy=>[15,10,21,26,32].map(inland=>({dy,inland})));
    lots.sort((a,b)=>Math.abs(a.inland-15)+Math.abs(a.dy-1)-Math.abs(b.inland-15)-Math.abs(b.dy-1));
    const warehouse=lots.map(({dy,inland})=>building(at(freight,inland,dy),"Pier freight warehouse","worksite-transit-shed")).find(buildable);
    if (!warehouse || terminal && !buildable(terminal)) continue;
    const crane = at(freight, -13, 0),
      rails = {x: at(freight,15,0).x, y: Math.max(warehouse.y+warehouse.h+3,freight.root.y-1)};
    const harbor: Harbor = {
      sign,
      yard: [],
      dolphins: [],
      platforms: [],
      cartways: [],
      drains: [],
      manifest: plan.site.id + "-port-manifest",
      crossing,
      crane,
      cargo,
      lane,
      roadstead,
      shed: warehouse.entrance,
      rails: ferry ? rails : undefined,
    };
    plan.harbor = harbor;
    const levels=(plan.groundLevels ??= new Map()), quayLevel=Math.round(sample(freight.root.x,freight.root.y).elevation/14);
    for (let y = Math.min(freight.root.y-10,warehouse.y-6); y <= (ferry ?? freight).root.y + 7; y++) {
      const t = (y - freight.root.y) / 28;
      const bank = Math.round(between(freight.root, (ferry ?? freight).root, t).x);
      const inland = sign < 0 ? Math.max(warehouse.x+warehouse.w+2,terminal ? terminal.x+terminal.w+3 : warehouse.x+warehouse.w+2)
        : Math.min(warehouse.x-3,(terminal ?? warehouse).x-3);
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
    if (!ferry || !terminal || !crossing) {
      warehouse.description="The crane lands cases on the pier. A tally clerk weighs the grain before it goes to local buyers.";
      install(warehouse);
      sling.freight.local = true;
      const buyer=object("wagon","Grain factor’s stock",shift(warehouse.entrance,-2,1),"study-propb-grain-sacks-0","container");
      buyer.inventory.coin=30;
      const hand=shift(warehouse.entrance,0,2);
      harbor.cartways.push({id:plan.site.id+"-freight-way",kind:"lane",cost:0,width:2,
        points:[at(freight,1,1),{x:at(freight,1,1).x,y:hand.y},hand]});
      for (const u of [4,13,20]) for (const y of [-2,3])
        object("pile-"+u+"-"+y,"Fender pile",at(freight,-u,y),"harbor-pile");
      const mooring=at(freight,-18,8);
      if (water(mooring)) {
        harbor.dolphins.push(mooring);
        object("dolphin","Bound mooring piles",mooring,"harbor-dolphin");
      }
      object("scales","Receiving scales",shift(warehouse.entrance,3,1),"harbor-platform-scale");
      parkLorry([shift(hand,5,1),shift(hand,-5,2),shift(hand,4,5)]);
      return;
    }
    const {gate,farGate}=crossing;
    const court: WharfPlatform={x:terminal.x-2,y:terminal.y-1,w:terminal.w+4,h:terminal.h+5,gateX:terminal.entrance.x,rise:5,finish:"slab"};
    const storehouse = building(
      at(freight,15,19),
      "Wharf dispatch office",
      "worksite-wharf-store",
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
    offices.forEach(install);
    const tracks = (plan.tracks ??= new Map());
    for (let y = 0; y < 4; y++)
      for (let x = -9; x <= 10; x++) {
        const k = cellKey(rails.x + x, rails.y + y);
        tracks.set(k, { axis: "x", at: y });
        plan.pavement?.set(k, "rail");
      }
    object(
      "ticket",
      "Board the cross-river ferry",
      gate,
      "harbor-departures",
    ).passage = { destination: farGate, back: false };
    object("return", "Return ferry landing", farGate, "harbor-cleat").passage =
      { destination: gate, back: true };
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

export function releasePortStock(store: WorldObject, roadStock: WorldObject, good="grain") {
  const units = store.inventory[good] ?? 0;
  if (units > 0) {
    roadStock.inventory[good] = (roadStock.inventory[good] ?? 0) + units;
    roadStock.depleted = false;
    store.inventory[good] = 0;
  }
  return units;
}

export function serviceFreight(
  sling: WorldObject,
  store: WorldObject,
  wagon: WorldObject,
  clock: number,
  roadStock?: WorldObject,
  feeder?: WorldObject,
) {
  const manifest = sling.freight!;
  const call = Math.floor(clock / 3600),
    phase = clock - call * 3600;
  if (manifest.boxes) {
    if(!feeder)return;
    const boxes=manifest.boxes, move=containerMove(clock), good=manifest.good ?? "grain", units=manifest.good ? 1 : 3;
    const x=sling.pos.x+4,y=sling.pos.y-6;
    feeder.pos.x=x+Math.round(move.ship.x);feeder.pos.y=y+Math.round(move.ship.y-55/16);
    wagon.pos.x=x+Math.round(move.carrierX/16);wagon.pos.y=y+3;
    if (manifest.call!==call) {
      manifest.call=call;boxes.picked=0;boxes.landed=0;boxes.hook=0;boxes.delivered=0;
      if(boxes.inbound!==call){boxes.inbound=call;feeder.inventory[good]=3*units;}
    }
    const lifted=Math.min(feeder.inventory[good]??0,units*Math.max(0,move.picked-boxes.picked));
    feeder.inventory[good]=(feeder.inventory[good]??0)-lifted;
    boxes.hook+=lifted;boxes.picked=move.picked;
    const landed=Math.min(boxes.hook,units*Math.max(0,move.onChassis-boxes.landed));
    wagon.inventory[good]=(wagon.inventory[good]??0)+landed;
    boxes.hook-=landed;boxes.landed=move.onChassis;
    const received=Math.max(0,move.delivered-boxes.delivered);
    const unloaded=Math.min(wagon.inventory[good],received*units);
    wagon.inventory[good]-=unloaded;store.inventory[good]=(store.inventory[good]??0)+unloaded;
    boxes.delivered+=received;
    if(phase>=2160 && boxes.inbound===call){boxes.inbound=call+1;feeder.inventory[good]=3*units;}
    if (phase>=1320 && roadStock) releasePortStock(store,roadStock,good);
    return;
  }
  if (manifest.call !== call) {
    if (manifest.call >= 0 && !manifest.local) {
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
  if (manifest.local) {
    if (phase>=1320) {
      const stock=store.inventory.grain ?? 0;
      const road=roadStock ? Math.floor(stock/2) : 0;
      if (roadStock && road) { roadStock.inventory.grain=(roadStock.inventory.grain??0)+road; roadStock.depleted=false; }
      wagon.inventory.grain=(wagon.inventory.grain??0)+stock-road;
      store.inventory.grain=0;
    }
    return;
  }
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
  const terminal=plan.terminal;
  if ((!h && !terminal && !plan.anchorage) || !s) return;
  const shops=plan.objects.filter(o=>o.shopSupply);
  for (const [i, old] of (h && !h.crossing ? ["Longshoreman","Freight tally clerk","Grain factor"] : h ? [
    "Longshoreman",
    "Freight tally clerk",
    "Railway porter",
    "Shop clerk",
    "Seamstress",
    "Bookkeeper",
    "Messenger",
  ] : terminal ? [terminal.automated ? "Remote crane operator" : "Crane operator","Freight tally clerk"] : ["Porter","Sailor","Boatman",plan.anchorage?.cargo==="grain" ? "Grain factor" : "Cloth merchant",...shops.map(o=>o.shopSupply!.item==="bread" ? "Baker" : "Grocer")]).entries()) {
    const role = s.year < 1950 ? old : ({ "Grain factor": "Grain trader", "Freight tally clerk": "Shipping clerk", "Railway porter": "Freight handler", Seamstress: "Customs officer", Messenger: "Courier" }[old] ?? old);
    const shop=shops[i-4];
    const id = shop ? shop.id+"-seller" : plan.site.id + (terminal ? "-terminal-hand-"+i : h ? "-wharfhand-" + i : ["-lighter-porter","-merchant-pilot","-lighter-pilot","-quay-merchant"][i]),
      home = shop ? shift(shop.pos,1,0) : terminal ? shift(terminal,i ? 14 : -4,7) : !h ? (i===3 ? shift(plan.anchorage!.store,2,1) : plan.anchorage!.landing) : !h.crossing && i===2 ? shift(h.shed,-2,2) : i < 3 ? h.shed : shift(h.crossing!.gate, -h.sign * (8 + i), i % 2);
    const pos = { ...home, space: "outside" as const };
    const a: Actor = {
      id,
      kind: "human",
      name: proceduralName(s, seed, id),
      role,
      age: 24 + i * 4,
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
    if(shop){
      a.stockroom=shop.id;a.activity=role==="Baker" ? "Selling bread at the bakery" : "Measuring pepper at the counter";
    } else if(h && !h.crossing && i===2){
      a.stockroom=plan.site.id+"-port-wagon";a.activity="Buying grain at the warehouse";
    } else if(terminal){
      a.activity=i ? "Checking the seals at row B" : "Supervising the quay crane";
    } else if(!h && i===3){
      a.stockroom=plan.objects.find(o=>o.lighterage?.site===plan.site.id)!.lighterage!.store;
      a.activity=plan.anchorage?.cargo==="grain" ? "Weighing the Baltic grain" : "Measuring cloth at the counter";
    } else if(!h && i){
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
  if (!h.crossing && i===2) {
    leg(period,shift(h.shed,-2,2),"Buying grain at the warehouse");
  } else if (i < 3) {
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
  } else if (h.crossing) {
    const crossing=h.crossing;
    const side = (i < 5 ? -0.58 : 0.58),
      offset = (i % 2 ? -1 : 1) * (7.8 + (i < 5 ? 0.45 : 0)),
      deck = shift(crossing.ferry, -h.sign * offset, side),
      away = shift(crossing.far, h.sign * 8.25, side);
    const stand = shift(crossing.gate, -h.sign * (2 + (i % 3)), Math.sign(side));
    leg(1, deck, "Walking down the gangway", [shift(deck,0,1.2-side),shift(crossing.ferry,-h.sign*8,1.2),crossing.gate,stand]);
    leg(1.5, stand, "Waiting for the cross-river ferry");
    leg(3, stand, "Boarding the ferry", [crossing.gate, shift(crossing.ferry,-h.sign*8,1.2),shift(deck,0,1.2-side),deck]);
    leg(4, deck, "On the forward deck");
    const cross = (from: Point, to: Point, back: boolean) => {
      const path = Array.from({ length: 24 }, (_, j) => {
        const f = ferryAt(crossing, (back ? 840 : 240) + (j + 1) * 15);
        return shift(f, from.x - (back ? crossing.far : crossing.ferry).x, side);
      });
      path[23] = to;
      return path;
    };
    const landed = shift(crossing.far, -h.sign * offset, side),
      returnDeck = deck;
    leg(10, deck, "Crossing the river", cross(deck, landed, false));
    leg(11, landed, "Leaving the ferry", [away, crossing.farGate]);
    leg(12, crossing.farGate, "At the far landing");
    leg(14, crossing.farGate, "Boarding the return ferry", [away, landed]);
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
  site: string; cargo: "grain" | "cloth";
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
  const quaySide=(a.anchor.x-a.shore.x)*(a.anchor.y-a.shore.y)>=0 ? 1 : 3;
  const merchant=!a.radius ? {...a.anchor,heading:quaySide+(n.x<0 || n.y<0 ? 4 : 0),moving:false} : {...approachPoint(a,angle),heading:bearing8(headingOf(n.x*dx-n.y*dy,n.y*dx+n.x*dy)),
    moving:p>0 && p<1};
  const alongside=lighterBerth(a);
  const outward=headingOf(alongside.x-a.shore.x,alongside.y-a.shore.y);
  const travel=smooth(unit((t-720)/360))-smooth(unit((t-1320)/360));
  const turn=smooth(unit((t-1080)/240))-smooth(unit((t-1680)/240));
  const berthTurn=!a.radius ? 2*(1-smooth(unit((t-720)/60))+smooth(unit((t-1620)/60))) : 0;
  const lighter={...between(a.shore,alongside,travel),heading:bearing8(outward+4*turn+berthTurn),
    moving:t>720 && t<1080 || t>1320 && t<1680};
  return {merchant,lighter};
}

export function planAnchorage(plan: SettlementPlan, launch: Launch, store: Point, sample: Sample, limit: number, cargo: Anchorage["cargo"], moored = cargo === "grain") {
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
      if(bank && wet(p,moored ? 3 : 1.5) && [0,2,4,6].every(f=>navigableHull(p,f,false,shallows))) {shore=p;break;}
    }
    if(!bank || !shore || plan.solid.has(cellKey(bank.x,bank.y))) continue;
    for(const [offshore,radius,span] of (moored ? [[7,0,0],[9,0,0],[6,0,0]] : [[15,9.9,18],[12,6,11],[10,3,14],[21,8,16]])) for(const sign of [1,-1]) {
      const reach=span*sign;
      const a:Anchorage={site:plan.site.id,cargo,anchor:at(offshore,side+sign*(moored ? 6 : 3)),outward:{x:n.x,y:n.y},shore,landing:bank,store,
        radius,reach,porterPath:[]};
      let clear=true;
      if(moored){
        const ship=anchorageAt(a,0).merchant;
        clear=navigableHull(ship,ship.heading,true,water) && Math.abs(ship.x-bank.x)<=11 && ship.y-bank.y>=-5 && ship.y-bank.y<=10;
      } else for(let i=0;i<=64 && clear;i++){
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
      return a;
    }
  }
}

const shipload=(cargo:Anchorage["cargo"])=>cargo==="grain" ? 72 : 3;

export function installAnchorage(plan:SettlementPlan,a:Anchorage,facing:string,id:string,s:NonNullable<Pack["setting"]>,seed:string,sample:Sample,
  paint:(r:Rect,t:"dirt"|"paving",reserve?:boolean)=>void, form: "fluyt"|"dhow" = "dhow", spice = false) {
  plan.anchorage=a;
  const grain=a.cargo==="grain";
  for(const p of a.porterPath) {
    plan.traffic.add(cellKey(p.x,p.y));
    if((grain || sample(p.x,p.y).water>3) && !plan.surface.has(cellKey(p.x,p.y)))paint({...p,w:1,h:1},grain ? "paving" : "dirt",false);
  }
  const fleet=anchorageAt(a,0);
  const canvas=Math.floor(3*(random(seed,id,"sailcloth-lot")<.65 ?
    random(s.culture,Math.floor(s.year/100),"sailcloth") : random(seed,id,"sailcloth")));
  for(const kind of ["merchant","lighter"] as const) {
    const ship=kind==="merchant", type=ship ? form : kind, point=fleet[kind];
    const finish=Math.floor(random(seed,id,type,"finish")*3);
    plan.objects.push({id:a.site+"-"+kind,name:ship ? form==="fluyt" ? grain ? "Baltic grain fluyt" : "Cloth-laden fluyt" : "Lateen trading dhow" : "Harbour lighter",
      kind:"monument",pos:{x:Math.round(point.x),y:Math.round(point.y),space:"outside"},sprite:`harbor-${type}-${finish}-${point.heading}`,
      inventory:ship ? {[a.cargo]:shipload(a.cargo)} : {},vessel:{form:kind,finish,canvas,heading:point.heading,site:a.site,skipper:a.site+"-"+kind+"-pilot"},
      description:ship ? form==="fluyt" ? "Three masts carry furled canvas while the lighter comes alongside." :
        "A trading vessel with a lateen yard and a deep cargo hold." : "An open boat ferrying cargo between ship and quay."});
  }
  const store=id+"-store-stock";
  plan.objects.push({id:store,name:grain ? "Grain warehouse hoist" : "Cloth landing counter",kind:"monument",
    prop:grain ? "grainHoist" : "clothCounter",sprite:grain ? "harbor-grain-hoist" : "harbor-cloth-counter-0",
    pos:{...a.store,space:"outside"},inventory:grain ? {coin:18,grain:4,...(spice && {pepper:4})} : {coin:18},
    ...(spice && {consignment:{item:"pepper",days:4,units:8}}),
    description:grain ? "The porter hooks each sack onto the rope. The warehouse crew hauls it up to the loft." :
      "Porters leave tied bales beside the timber store. The merchant opens them here and measures out cloth for sale."},
    {id:id+"-lighter-landing",name:grain ? "Grain lighter landing" : "Lighter landing",kind:"monument",
      sprite:`harbor-${grain ? "grain-" : ""}landing-${facing}-0`,pos:{...a.landing,space:"outside"},
      inventory:!a.radius ? {[a.cargo]:1} : {},lighterage:{cargo:a.cargo,store,porter:a.site+"-lighter-porter",site:a.site,lift:-1},
      description:grain ? "Grain sacks from the lighter wait on the timber skids. Carry a sack to the warehouse hoist for a fee." :
        "The lighter brings bales ashore. Carry one to the shaded store to earn a porter's fee."});
}

export function porterRoutine(a: Anchorage): Itinerary {
  return {period:60,start:0,segments:[
    {from:0,to:28,pos:a.landing,activity:"work",label:"Waiting for the lighter"},
    {from:28,to:30,pos:a.landing,activity:"work",label:a.cargo==="grain" ? "Sorting the grain sacks" : "Sorting the landed bales"},
    {from:30,to:36,pos:a.landing,path:a.porterPath.slice(1),activity:"haul",label:"Going to the shore store"},
    {from:36,to:45,pos:a.store,activity:"work",label:"Stacking the consignment"},
    {from:45,to:51,pos:a.store,path:a.porterPath.slice(0,-1).reverse(),activity:"haul",label:"Walking back to the landing"},
    {from:51,to:60,pos:a.landing,activity:"work",label:"Checking the landing ropes"},
  ]};
}

export function transferCargo(from:WorldObject,to:WorldObject,good:Anchorage["cargo"],limit:number) {
  const n=Math.min(from.inventory[good]??0,Math.max(0,limit));
  from.inventory[good]=(from.inventory[good]??0)-n;
  to.inventory[good]=(to.inventory[good]??0)+n;
  return n;
}

export function openClothBale(store: WorldObject) {
  if ((store.inventory.cloth ?? 0) < 1) return false;
  store.inventory.cloth!--;
  store.inventory["cloth-bolt"] = (store.inventory["cloth-bolt"] ?? 0) + 3;
  return true;
}

export function serviceAnchorage(pile: WorldObject, store: WorldObject, merchant: WorldObject, lighter: WorldObject, clock: number, porter: Pick<Actor,"pos"|"dead"|"deliveryLoad"> | undefined) {
  const job=pile.lighterage!,good=job.cargo,call=Math.floor(clock/3600),phase=clock-call*3600;
  const deep=merchant.vessel!,skiff=lighter.vessel!;
  const supply=good==="grain" ? Math.floor(clock/86400) : call;
  if(deep.loadCall!==supply && !deep.manual && (phase<720 || phase>=3240)){
    deep.loadCall=supply;merchant.inventory[good]=shipload(good);
  }
  if(!skiff.manual && !deep.manual && phase>=1290 && phase<1326 && skiff.loadCall!==call &&
      Math.hypot(merchant.pos.x-lighter.pos.x,merchant.pos.y-lighter.pos.y)<=6){
    transferCargo(merchant,lighter,good,3-(lighter.inventory[good]??0));skiff.loadCall=call;
  }
  if(!skiff.manual && phase>=1680 && phase<2160) transferCargo(lighter,pile,good,3);
  if(!porter || porter.dead || porter.pos.space!=="outside")return;
  if(phase>=1800 && phase<2160 && job.lift<call && !porter.deliveryLoad && (pile.inventory[good]??0)>0 &&
      Math.hypot(porter.pos.x-pile.pos.x,porter.pos.y-pile.pos.y)<=2.5){
    job.lift=call;porter.deliveryLoad=store.id;pile.inventory[good]!--;
  }
  if(porter.deliveryLoad===store.id && Math.hypot(porter.pos.x-store.pos.x,porter.pos.y-store.pos.y)<=2.5){
    delete porter.deliveryLoad;store.inventory[good]=(store.inventory[good]??0)+1;
    if(good==="grain")store.hoistedAt=clock;
  }
}
