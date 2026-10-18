import type { Actor, Pack, Place, Point, Terrain } from "../../core/types";
import { paintedDoor } from "../../core/doors";
import { buildingModel, buildingRoofCells } from "../../content/graphics/models";
import { characterLivelihood, generateCharacter } from "../../content/characters/generate";
import { resolveCharacterContext } from "../../content/characters/resolve";
import { waterfrontFor } from "../../content/settlements/waterfronts";
import { propVisualCells } from "../../content/props/catalog";
import { random } from "../../core/random";
import type { Sample } from "./roads";
import type { Rect, SettlementPlan } from "./types";
import { launchAt, shoreDirections } from "./shoreline";

const key=(x:number,y:number)=>`${x},${y}`;
const cells=(r:Rect,f:(x:number,y:number)=>void)=>{
  for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)f(x,y);
};
const overlaps=(a:Rect,b:Rect)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;

export function planWaterfront(
  plan:SettlementPlan,pack:Pack,seed:string,sample:Sample,
  dry:(r:Rect,occupied?:boolean,core?:Rect,hinterland?:boolean)=>boolean,
  paint:(r:Rect,t:Terrain,reserve?:boolean)=>void,grade:(r:Rect)=>void,
  connect:(a:Point,b:Point,label:string,width?:number,area?:Rect,preview?:boolean)=>unknown,reserve:(r:Rect)=>void,
) {
  const s=pack.setting,profile=s && waterfrontFor(s);
  if(!s || !profile)return;
  const revised=(s.worksiteRevision??1)>=5,practice=profile.practice;
  const c=plan.site.center,radius=plan.site.profile.radius;
  const repair=plan.places.find(p=>p.institution==="boatyard");
  const anchor=repair && plan.launches?.[0];
  const id=`${plan.site.id}-waterfront-${profile.id}`;
  const district:NonNullable<SettlementPlan["waterfront"]>={id,profile:profile.id,repairYardId:repair?.id,landingId:`${id}-landing`,members:[]};
  const well=plan.objects.find(o=>o.kind==="well" && o.pos.space==="outside");
  const drinkingWater=well ? {x:well.pos.x-1,y:well.pos.y+1} : c;
  const context=resolveCharacterContext(s,undefined,new Set(["water"]));
  const job=characterLivelihood(s,seed,"player",pack.role,context);
  const requested=/\bfisher(man|woman)?\b/i.test(pack.role) || (s.worksiteRevision??1)>=6 && job.id==="fisher" && job.label.toLowerCase()===pack.role.toLowerCase();
  const count=profile.households[0]+Math.floor(random(seed,id,"households")*(profile.households[1]-profile.households[0]+1));
  const area={x:c.x-radius-160,y:c.y-radius-160,w:(radius+160)*2,h:(radius+160)*2};
  const bases:Point[]=anchor ? [36,-36,72,-72,108,-108].map(d=>({
    x:anchor.origin.x-anchor.direction.y*d,y:anchor.origin.y+anchor.direction.x*d})) : [];
  for(let ring=32;ring<radius+90;ring+=revised ? 8 : 16)for(let i=0;i<(revised ? 48 : 24);i++) {
    const a=i*Math.PI/(revised ? 24 : 12)+random(seed,id,"bearing")*Math.PI*2;
    bases.push({x:Math.round(c.x+Math.cos(a)*ring),y:Math.round(c.y+Math.sin(a)*ring)});
  }
  const singleFallbackAt=bases.length;
  if(revised)bases.push(...bases);
  const claim=(r:Rect)=>{cells(r,(x,y)=>plan.reserved.add(key(x,y)));reserve(r);};
  for(let bi=0;bi<bases.length;bi++) {
    const candidate=bases[bi],first=district.members[0]?.launch;
    if(district.members.length>=count)break;
    const directions=anchor ? [anchor.direction,...shoreDirections.filter(d=>d!==anchor.direction)] : shoreDirections;
    for(const {direction,setback} of directions.flatMap(direction=>[10,18,28,36].map(setback=>({direction,setback})))) {
      const {x:dx,y:dy}=direction,tx=-dy,ty=dx;
      let base=candidate;
      let launch=launchAt(base,direction,sample,(x,y)=>plan.reserved.has(key(x,y)),{width:7,dryLength:6,reach:36,waterLength:12});
      if(!launch)continue;
      const advance=Math.max(0,Math.abs(launch.water.x-base.x)+Math.abs(launch.water.y-base.y)-setback);
      base={x:base.x+dx*advance,y:base.y+dy*advance};
      launch=launchAt(base,direction,sample,(x,y)=>plan.reserved.has(key(x,y)),{width:7,dryLength:6,reach:36,waterLength:12});
      if(!launch || first && Math.hypot(base.x-first.origin.x,base.y-first.origin.y)>(revised ? 80 : 64))continue;
      const n=district.members.length;
      const owner=requested && plan.site.home && s.environment?.start==="resident" && n===0 ? "player" : `${id}-fisher-${n}`;
      const place=(suffix:string,frame:string,name:string,along:number,across:number):Place=>{
        const m=buildingModel(frame),[w,h]=m.footprint;
        const x=Math.round(base.x+dx*along+tx*across-w/2),y=Math.round(base.y+dy*along+ty*across-h/2);
        const p:Place={id:`${id}-${n}-${suffix}`,name,description:suffix==="home" ? practice?.homeDescription ?? "A fishing family’s shore house, beside its boat landing and gear store." : practice?.gearDescription ?? "A dry store for nets, lines, oars and repair timber.",x,y,w,h,sprite:frame,
          entrance:{x:x+m.entrance[0],y:y+m.entrance[1]},owner,access:"household",
          claim:suffix==="home" ? "waterfront-home" : "waterfront-gear",entranceLabel:"Enter"};
        const door=paintedDoor(p);if(door){p.door=door;p.entrance={x:door.x,y:door.y+1};}
        return p;
      };
      const home=place("home",profile.home,"Fishing household",revised && setback<36 ? -6 : -14,revised && dx!==0 ? -16 : -9);
      const gear=place("gear",profile.gear,"Fishing gear store",revised && setback<36 ? -2 : -14,revised && dx!==0 ? 16 : 9);
      const envelope=(p:Place):Rect=>{
        const m=buildingModel(p.sprite),top=Math.ceil(Math.max(0,m.bounds[3]-p.h*16)/16)+1;
        return {x:p.x-2,y:p.y-top,w:p.w+4,h:p.h+top+3};
      };
      const yards=[envelope(home),envelope(gear)];
      const boatFrame=`${profile.boat}-${direction.id}`;
      const [bw,bh]=buildingModel(boatFrame).footprint;
      const mooring=revised ? Math.floor((dx ? bw : bh)/2) : 5;
      const boat={x:launch.water.x+dx*mooring,y:launch.water.y+dy*mooring};
      if(profile.waters && !profile.waters.some(k=>k===sample(boat.x,boat.y).kind))continue;
      const berth={x:boat.x-Math.floor(bw/2),y:boat.y-Math.floor(bh/2),w:bw,h:bh};
      let afloat=true;
      cells(berth,(x,y)=>{if(sample(x,y).water>=0 || plan.reserved.has(key(x,y)))afloat=false;});
      const half=s.playableMap && s.playableMap.size/2;
      if(!afloat || overlaps(yards[0],yards[1]) || yards.some(y=>overlaps(y,launch.lane) ||
        !dry(y,true,y,true)) || half && [...yards,launch.lane,berth].some(p=>p.x< -half+4 || p.y< -half+4 || p.x+p.w>half-4 || p.y+p.h>half-4))continue;
      if(revised && n===0 && bi<singleFallbackAt) {
        let companion=false;
        for(const t of [dx ? 44 : 32,dx ? -44 : -32,56,-56,72,-72])for(const d of [0,12,-12]) {
          if(companion)continue;
          const origin={x:base.x+tx*t+dx*d,y:base.y+ty*t+dy*d};
          const other=launchAt(origin,direction,sample,(x,y)=>plan.reserved.has(key(x,y)) ||
            [...yards,launch!.lane].some(r=>x>=r.x && x<r.x+r.w && y>=r.y && y<r.y+r.h),
            {width:7,dryLength:6,reach:36,waterLength:12});
          if(!other)continue;
          const shift=Math.max(0,Math.abs(other.water.x-origin.x)+Math.abs(other.water.y-origin.y)-setback);
          const sx=origin.x+dx*shift-base.x,sy=origin.y+dy*shift-base.y;
          const parcels=yards.map(r=>({...r,x:r.x+sx,y:r.y+sy}));
          if(parcels.every(r=>dry(r,true,r,true) && ![...yards,launch!.lane].some(y=>overlaps(r,y))))companion=true;
        }
        if(!companion)continue;
      }
      const distance=Math.abs(launch.water.x-base.x)+Math.abs(launch.water.y-base.y);
      let inland=distance-1;
      while(inland>0 && sample(base.x+dx*inland,base.y+dy*inland).water<4)inland--;
      const landing={x:base.x+dx*inland,y:base.y+dy*inland};
      for(const p of [home,gear]) {
        cells(p,(x,y)=>plan.solid.add(key(x,y)));
        for(let y=p.entrance.y;y<=p.y+p.h;y++)plan.solid.delete(key(p.entrance.x,y));
      }
      if(!revised && (!connect(landing,c,`worksite-${id}-${n}-shore`,0,area) ||
          !connect(home.entrance,c,`worksite-${id}-${n}-home`,0,area) ||
          !connect(gear.entrance,home.entrance,`worksite-${id}-${n}-gear`,0,area))) {
        for(const p of [home,gear])cells(p,(x,y)=>plan.solid.delete(key(x,y)));
        continue;
      }
      const equipment=(p:Place,w:number,h:number)=>{
        for(let row=3;row<=7;row++)for(const offset of [0,-3,3]) {
          const at={x:p.x+Math.floor(p.w/2)+offset,y:p.y+p.h+row};
          const patch={x:at.x-Math.floor(w/2),y:at.y,w,h};
          let clear=dry(patch,true,patch,true);
          cells(patch,(x,y)=>{if(plan.traffic.has(key(x,y)) || plan.solid.has(key(x,y)))clear=false;});
          if(clear)return {at,patch};
        }
      };
      let sortSite=equipment(home,5,3);
      if(revised) {
        sortSite=undefined;
        for(const along of [4,8,12,16])for(const across of [-7,7,-10,10]) {
          const at={x:landing.x-dx*along+tx*across,y:landing.y-dy*along+ty*across};
          const patch={x:at.x-3,y:at.y-3,w:7,h:6};
          let clear=dry(patch,true,patch,true);
          cells(patch,(x,y)=>{if(plan.solid.has(key(x,y)) || plan.traffic.has(key(x,y)))clear=false;});
          if(clear && !sortSite)sortSite={at,patch};
        }
      }
      const netSite=equipment(gear,7,4);
      if(!netSite || !sortSite) {
        for(const p of [home,gear])cells(p,(x,y)=>plan.solid.delete(key(x,y)));
        continue;
      }
      const sortingAt=sortSite.at,netsAt=netSite.at;
      const sorting={x:sortingAt.x,y:sortingAt.y+1},nets={x:netsAt.x,y:netsAt.y+2};
      const bodies=[{x:sortingAt.x-2,y:sortingAt.y,w:5,h:1},{x:netsAt.x-3,y:netsAt.y,w:7,h:1}];
      const paths:[Point,Point,string][] = revised ? [
        [landing,district.members[0]?.landing ?? c,"shore"],
        [sorting,landing,"catch"],[home.entrance,sorting,"home"],
        [gear.entrance,sorting,"gear"],[nets,gear.entrance,"nets"],
      ] : [[landing,c,"shore"],[home.entrance,c,"home"],[gear.entrance,home.entrance,"gear"]];
      if(revised)for(const body of bodies)cells(body,(x,y)=>plan.solid.add(key(x,y)));
      const link=(preview:boolean)=>paths.every(([a,b,label])=>connect(a,b,`worksite-${id}-${n}-${label}`,0,area,preview));
      if(revised && (!link(true) || !link(false))) {
        for(const p of [home,gear,...(revised ? bodies : [])])cells(p,(x,y)=>plan.solid.delete(key(x,y)));
        continue;
      }
      for(const [i,p] of [home,gear].entries()) {
        claim(yards[i]);grade(p);
        paint({x:p.x-1,y:p.y+p.h,w:p.w+2,h:2},"dirt");
        cells(p,(x,y)=>plan.built?.add(key(x,y)));
        for(const q of buildingRoofCells(p.sprite,p))plan.placement.clearance.add(key(q.x,q.y));
        plan.places.push(p);
        plan.objects.push({id:`${p.id}-exit`,kind:"exit",name:"Return to the waterfront",sprite:"door-open",pos:{x:6,y:9,space:p.id},inventory:{},owner});
      }
      claim(launch.lane);claim(berth);
      (plan.launches??=[]).push(launch);
      for(const p of launch.dry)paint({...p,w:1,h:1},"dirt");
      for(const patch of [netSite.patch,sortSite.patch])claim(patch);
      const boatId=`${id}-${n}-boat`,netsId=`${id}-${n}-nets`,catchId=`${id}-${n}-catch`;
      plan.objects.push(
        {id:boatId,name:practice?.boat ?? "Household fishing boat",kind:"monument",sprite:boatFrame,pos:{...boat,space:"outside"},inventory:{},owner,
          description:practice?.boatDescription ?? "An open clinker-built rowing boat with thwarts and stored oars, moored at its household's landing."},
        {id:catchId,name:practice?.catch ?? "Catch-sorting table",kind:"container",sprite:profile.sorting,pos:{...sortingAt,space:"outside"},inventory:{fish:4,water:2},owner},
        {id:netsId,name:practice?.nets ?? "Lines and nets being repaired",kind:"container",sprite:profile.nets,pos:{...netsAt,space:"outside"},inventory:{tool:1},owner},
        {id:`${gear.id}-stock`,name:"Stored fishing gear",kind:"container",sprite:"crate",pos:{x:6,y:5,space:gear.id},inventory:{tool:1,wood:2},owner},
      );
      for(const body of bodies)cells(body,(x,y)=>plan.solid.add(key(x,y)));
      const patches=[...yards,netSite.patch,sortSite.patch];
      const left=Math.min(...patches.map(p=>p.x)),top=Math.min(...patches.map(p=>p.y));
      const workingYard={x:left,y:top,w:Math.max(...patches.map(p=>p.x+p.w))-left,h:Math.max(...patches.map(p=>p.y+p.h))-top};
      if(revised) {
        plan.plots.push({...workingYard,id:`${id}-${n}-working-front`,kind:"public",owner:`${plan.site.id}-community`,access:landing});
        plan.plots.push({...yards[0],id:`${home.id}-plot`,kind:"household",owner,access:home.entrance});
      } else {
        claim(workingYard);
        plan.plots.push({...workingYard,id:`${home.id}-plot`,kind:"household",owner,access:home.entrance});
      }
      plan.work.set(owner,{home:home.entrance,work:landing,water:drinkingWater,social:district.members[0]?.landing ?? landing,
        label:"Working near water",role:"Fisher",offset:Math.floor(random(seed,owner,"schedule")*120)});
      if(owner!=="player") {
        const a={id:owner,kind:"human",...generateCharacter(s,seed,owner,30+Math.floor(random(seed,owner,"age")*20),"Fisher",undefined,undefined,undefined,undefined,undefined,context),
          pos:{...home.entrance,space:"outside"},home:{...home.entrance,space:"outside"},work:{...landing,space:"outside"},
          sprite:`human-${n%3}-${n%6}`,activity:"Household work",fatigue:0,hunger:5,trust:1,memories:[],direction:2} as Actor;
        plan.actors.push(a);
      }
      let handling:NonNullable<SettlementPlan["waterfront"]>["members"][number]["handling"];
      if(revised) {
        const basketId=`${id}-${n}-landing-baskets`;
        const pockets=(s.worksiteRevision??1)>=6 ? [[3,2],[-3,2],[3,-1],[-3,-1]] : [[3,2]];
        const basket=pockets.map(([x,y])=>({x:sortingAt.x+x,y:sortingAt.y+y})).find(at=>
          propVisualCells("basket",at).every(p=>sample(p.x,p.y).water>=4 && !plan.solid.has(key(p.x,p.y)) && !plan.traffic.has(key(p.x,p.y))));
        const sale={x:sortingAt.x+2,y:sortingAt.y+1};
        if(basket) {
          plan.objects.push({id:basketId,name:"Baskets for the fresh catch",kind:"container",prop:"basket",
            sprite:"study-propb-open-basket-0",pos:{...basket,space:"outside"},owner,inventory:{}});
          for(const p of propVisualCells("basket",basket))claim({...p,w:1,h:1});
        }
        claim(sortSite.patch);paint(sortSite.patch,"dirt");
        let lo=Infinity,hi=-Infinity;
        for(const p of launch.dry){const h=Math.round(sample(p.x,p.y).elevation/14);lo=Math.min(lo,h);hi=Math.max(hi,h);}
        handling={kind:hi>lo ? "timber-steps" : "beach",yard:sortSite.patch,sale,basketId:basket ? basketId : undefined,gear:gear.entrance};
      }
      district.members.push({owner,homeId:home.id,gearId:gear.id,boatId,netsId,catchId,landing,launch,nets,sorting,...(handling ? {handling} : {})});
      if(n===0) {
        const across=revised ? (dx ? [44,-44,48,-48,56,-56,64,-64,72,-72] : [32,-32,36,-36,44,-44,52,-52,64,-64]) : [36,-36,44,-44,52,-52];
        const along=revised ? [0,8,-8,16,-16,24,-24] : [0,8,-8];
        bases.splice(bi+1,0,...across.flatMap(t=>along.map(d=>({x:base.x+tx*t+dx*d,y:base.y+ty*t+dy*d}))));
      }
      break;
    }
  }
  if(!district.members.length)return;
  plan.waterfront=district;
  const landing=district.members[0].landing;
  plan.plots.push({id:district.landingId,kind:"public",owner:`${plan.site.id}-community`,access:landing,
    x:landing.x-2,y:landing.y-2,w:5,h:5});
}
