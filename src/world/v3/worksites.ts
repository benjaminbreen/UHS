import { propSprite } from "../../content/props/place";
import { random } from "../../core/random";
import type { Pack, Place, Point, Terrain } from "../../core/types";
import { paintedDoor } from "../../core/doors";
import { buildingModel, buildingRoofCells } from "../../content/graphics/models";
import { worksitesFor } from "../../content/settlements/worksites";
import type { Rect, SettlementPlan } from "./types";
import type { Sample } from "./roads";
import { launchAt, shoreDirections, type Launch } from "./shoreline";
import { fishingWaterfront } from "../../content/settlements/waterfronts";

const key = (x: number, y: number) => `${x},${y}`;
const cells = (r: Rect, f: (x: number, y: number) => void) => {
  for (let y = r.y; y < r.y + r.h; y++)
    for (let x = r.x; x < r.x + r.w; x++) f(x, y);
};
export function planWorksites(
  plan: SettlementPlan, pack: Pack, seed: string, sample: Sample,
  dry: (r: Rect, occupied?: boolean, core?: Rect, hinterland?: boolean) => boolean,
  paint: (r: Rect, t: Terrain, reserve?: boolean) => void,
  grade: (r: Rect) => void,
  connect: (a: Point, b: Point, label: string, width?: number, area?: Rect) => unknown,
  reserve: (r: Rect) => void,
) {
  const s = pack.setting;
  if (!s?.worksiteRevision) return;
  const { center: c, profile: { radius } } = plan.site;
  const placed = new Set<string>();
  let processingCount = 0;
  const role = s.role?.toLowerCase().replace(/ /g,"-");
  const priority=(p:ReturnType<typeof worksitesFor>[number])=>p.roles?.includes(role??"") || p.kind==="boatyard" && !!fishingWaterfront(s);
  const profiles = worksitesFor(s).sort((a,b) =>
    Number(!!a.revision)-Number(!!b.revision) ||
    (a.revision && b.revision ? Number(!priority(a))-Number(!priority(b)) ||
    random(seed,"worksite-order",a.id)-random(seed,"worksite-order",b.id) : 0));
  for (const profile of profiles) {
    if (profile.revision && processingCount >= 2) continue;
    if (placed.has(profile.kind)) continue;
    const main = buildingModel(profile.frame), store = buildingModel(profile.outbuilding.frame);
    const [mw, mh] = main.footprint, [sw, sh] = store.footprint;
    const pad = 2 + Math.ceil(Math.max(0, main.anchor[0]-mw*8, main.bounds[2]-main.anchor[0]-mw*8)/16);
    const top = 2 + Math.ceil(Math.max(0,main.bounds[3]-mh*16)/16);
    const gap = 4 + Math.ceil(Math.max(0,store.bounds[3]-sh*16)/16);
    const w = Math.max(mw, sw) + pad*2, h = top + mh + gap + sh + 3;
    const fringe = profile.siting !== "urban";
    const fit = (r: Rect, occupied = true, core = r) => dry(r,occupied,core,fringe);
    const area = {x:c.x-radius-110,y:c.y-radius-110,w:(radius+110)*2,h:(radius+110)*2};
    const first = profile.siting === "fringe" ? radius + Math.ceil(Math.hypot(w,h)/2) + 8 :
      profile.siting === "waterside" ? Math.max(30,Math.floor(radius*.65)) :
      profile.revision ? Math.max(42,Math.ceil(Math.hypot(w,h)/2)+24) : 30;
    const install = (r: Rect, launch?: Launch) => {
      const id = `${plan.site.id}-worksite-${profile.id}`;
      const place = (suffix: string, frame: string, name: string, x: number, y: number): Place => {
        const m = buildingModel(frame), [w,h] = m.footprint;
        const p: Place = { id: `${id}${suffix}`, name, sprite: frame, x,y,w,h,
          entrance: {x:x+m.entrance[0],y:y+m.entrance[1]}, owner: `${plan.site.id}-community`,
          access: "public", claim: `worksite-${profile.id}${suffix}`, entranceLabel: "Enter",
          description: `${profile.note} Basis: ${profile.basis}.` };
        const door = paintedDoor(p);
        if (door) { p.door = door; p.entrance = {x:door.x,y:door.y+1}; }
        return p;
      };
      const buildings = [place("",profile.frame,profile.label,r.x+pad,r.y+top),
        place("-store",profile.outbuilding.frame,profile.outbuilding.label,r.x+pad,r.y+top+mh+gap)];
      const offset=launch && Math.floor(launch.workingLength/2);
      const boat = launch && {x:launch.origin.x+launch.direction.x*offset!,y:launch.origin.y+launch.direction.y*offset!};
      const footprint=launch && buildingModel(`${profile.launch!.frame}-${launch.direction.id}`).footprint;
      const hull=boat && {x:boat.x-Math.floor(footprint![0]/2),y:boat.y-Math.floor(footprint![1]/2),w:footprint![0],h:footprint![1]};
      if(hull) cells(hull,(x,y)=>plan.solid.add(key(x,y)));
      buildings[0].institution = profile.kind;
      buildings[0].workCapacity = profile.capacity;
      buildings[0].workRoles = profile.roles;
      for (const p of buildings) {
        cells(p,(x,y)=>plan.solid.add(key(x,y)));
        // Equipment can project in front of a workshop door, leaving an aisle to it.
        if (profile.revision) for(let y=p.entrance.y;y<p.y+p.h;y++)
          plan.solid.delete(key(p.entrance.x,y));
      }
      const gate = launch ? {x:Math.max(r.x+1,Math.min(r.x+w-2,launch.origin.x)),
        y:Math.max(r.y+1,Math.min(r.y+h-2,launch.origin.y))} : {x:r.x+w-2,y:r.y+h-1};
      const workingAccess=launch && {x:launch.origin.x-launch.direction.x*2,y:launch.origin.y-launch.direction.y*2};
      if (!connect(gate,c,`worksite-${profile.id}`,0,area) ||
          workingAccess && !connect(workingAccess,gate,`worksite-${profile.id}-launch`,0,area)) {
        for (const p of buildings) cells(p,(x,y)=>plan.solid.delete(key(x,y)));
        if(hull) cells(hull,(x,y)=>plan.solid.delete(key(x,y)));
        return false;
      }
      placed.add(profile.kind);
      if (profile.revision) processingCount++;
      if(!launch) {paint(r,"dirt");grade(r);}
      cells(r,(x,y)=>{
        plan.reserved.add(key(x,y));
        if(!launch) plan.pavement?.set(key(x,y),"yard");
      });
      for (const p of buildings) {
        if(launch) {
          const apron={x:p.x-1,y:p.y,w:p.w+2,h:p.h+3};
          paint(apron,"dirt");
          cells(apron,(x,y)=>plan.pavement?.set(key(x,y),"yard"));
        }
        grade(p);
        cells(p,(x,y)=>plan.built?.add(key(x,y)));
        for (const at of buildingRoofCells(p.sprite,p)) plan.placement.clearance.add(key(at.x,at.y));
        connect(p.entrance,gate,`worksite-${profile.id}${p.id.endsWith("-store")?"-store":"-door"}`,0,area);
        plan.places.push(p);
        plan.objects.push({id:`${p.id}-exit`,name:"Return to the work yard",kind:"exit",pos:{x:6,y:9,space:p.id},sprite:"door-open",inventory:{}});
      }
      reserve(r);
      plan.plots.push({...r,id:`${id}-yard`,kind:"public",owner:`${plan.site.id}-community`,access:gate});
      if (launch && profile.launch) {
        const {origin,direction,lane}=launch;
        cells(lane,(x,y)=>plan.reserved.add(key(x,y)));
        reserve(lane);
        (plan.launches??=[]).push(launch);
        for(const p of launch.dry) paint({...p,w:1,h:1},"dirt");
        if(profile.launch.wayFrame) {
          const length=Math.abs(launch.water.x-origin.x)+Math.abs(launch.water.y-origin.y);
          for(let d=profile.launch.dryLength;d<length-1;d+=2) {
            const at={x:origin.x+direction.x*d,y:origin.y+direction.y*d};
            plan.objects.push({id:`${id}-way-${d}`,kind:"monument",name:"Timber launching way",
              sprite:`${profile.launch.wayFrame}-${direction.x ? "east" : "north"}`,
              pos:{...at,space:"outside"},inventory:{},owner:buildings[0].owner});
          }
        }
        plan.objects.push({id:`${id}-boat`,kind:"monument",name:"Clinker-built boat on stocks",
          description:"Overlapping planks, curved frames and a keel supported on timber stocks. The clear ground ahead leads to launching water.",
          sprite:`${profile.launch.frame}-${direction.id}`,pos:{...boat!,space:"outside"},inventory:{},owner:buildings[0].owner});
        plan.plots.push({...lane,id:`${id}-launch`,kind:"public",owner:buildings[0].owner,access:origin});
      }
      const supplies = profile.supplies ?? (profile.kind === "mill" ?
        [{prop:"grainSacks",label:"Stored grain"},{prop:"crate",label:"Mill supplies"}] :
        profile.kind === "mine" ? [{prop:"fieldStone",label:"Waste rock"},{prop:"pick",label:"Mining pick"},{prop:"bench",label:"Ore-sorting bench"}] :
        [{prop:"liddedBasket",label:"Linen store"}]);
      for (const [i,{prop,label}] of supplies.entries()) {
        const at = {x:r.x+Math.min(r.w-3,pad+2+i*4),y:r.y+top+mh+2};
        if (plan.solid.has(key(at.x,at.y)) || plan.traffic.has(key(at.x,at.y))) continue;
        plan.objects.push({id:`${id}-supplies-${i}`,name:label,prop,kind:"container",pos:{...at,space:"outside"},
          sprite:prop==="fieldStone" ? "rock" : propSprite(prop)!,inventory:prop==="grainSacks" ? {grain:12} : {},owner:buildings[0].owner});
      }
      return true;
    };
    let chosen: Rect | undefined, tries = 0;
    const failures: Point[] = [];
    const bearing = random(seed,"worksite",plan.site.id,profile.id)*Math.PI*2;
    if(profile.launch) {
      for(let ring=first;ring<=radius+90 && !chosen && tries<4;ring+=12)
        for(let i=0;i<32 && !chosen && tries<4;i++) {
          const a=((i*7)%32)*Math.PI/16+bearing;
          const origin={x:Math.round(c.x+Math.cos(a)*ring),y:Math.round(c.y+Math.sin(a)*ring)};
          for(const direction of shoreDirections) {
            if(tries>=4) break;
            const launch=launchAt(origin,direction,sample,(x,y)=>plan.reserved.has(key(x,y)),profile.launch);
            if(!launch || (s.worksiteRevision??1)>=5 && !launch.dry.every(p=>fit({...p,w:1,h:1}))) continue;
            for(const sign of [1,-1]) {
              if(tries>=4) break;
              const side=(direction.x ? h/2+5 : w/2+5)*sign;
              const r={x:Math.round(origin.x-direction.y*side+direction.x*4-w/2),
                y:Math.round(origin.y+direction.x*side+direction.y*4-h/2),w,h};
              const half=s.playableMap && s.playableMap.size/2;
              if(half && [r,launch.lane].some(p=>p.x< -half+4 || p.y< -half+4 || p.x+p.w>half-4 || p.y+p.h>half-4)) continue;
              if(!fit(r,true,r)) continue;
              tries++;
              if(install(r,launch)) {chosen=r;break;}
            }
            if(chosen) break;
          }
        }
      continue;
    }
    for (let ring = first; ring <= radius + 90 && !chosen && tries < 4; ring += 12)
      for (let i = 0; i < 32 && !chosen && tries < 4; i++) {
        const a = ((i*7)%32) * Math.PI / 16 + bearing;
        const r = { x: Math.round(c.x + Math.cos(a)*ring-w/2), y: Math.round(c.y + Math.sin(a)*ring-h/2), w, h };
        const half = s.playableMap && s.playableMap.size/2;
        if (half && (r.x < -half+4 || r.y < -half+4 || r.x+w > half-4 || r.y+h > half-4)) continue;
        if (profile.waterSupply) {
          let fresh = false;
          for (let dy = -24; dy <= r.h+24 && !fresh; dy += 4)
            for (let dx = -24; dx <= r.w+24; dx += 4) {
              const f = sample(r.x+dx,r.y+dy);
              if (f.kind === "river" && f.water < 4) { fresh = true; break; }
            }
          if (!fresh) continue;
        }
        if (profile.power === "water") {
          let flowing = false;
          for (let y = r.y+top+mh-4; y < r.y+top+mh+1 && !flowing; y++)
            for (let x = r.x+pad+mw; x <= r.x+pad+mw+7; x++) {
              const f = sample(x,y);
              if (f.kind === "river" && f.water < 4) { flowing = true; break; }
            }
          if (!flowing) continue;
        }
        if (!fit({x:r.x,y:r.y,w:1,h:1}) || !fit({x:r.x+r.w-1,y:r.y+r.h-1,w:1,h:1}) ||
          !fit(r,true,fringe ? {...r,w:1,h:1} : r) ||
          !fit({x:r.x+pad,y:r.y+top,w:mw,h:mh}) ||
          !fit({x:r.x+pad,y:r.y+top+mh+gap,w:sw,h:sh})) continue;
        if (failures.some(p=>Math.hypot(p.x-r.x,p.y-r.y)<12)) continue;
        tries++;
        if (install(r)) chosen = r;
        else failures.push(r);
      }
  }
}
