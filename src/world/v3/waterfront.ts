import { loavesPerSack } from "../../content/economy/goods";
import { stallFor } from "../../content/settlements/ornaments";
import { beurs } from "../../content/settlements/civic/europe";
import type { Actor, Pack, Place, Point, Terrain } from "../../core/types";
import { paintedDoor } from "../../core/doors";
import { buildingModel, buildingArtCells } from "../../content/graphics/models";
import { characterLivelihood, generateCharacter } from "../../content/characters/generate";
import { resolveCharacterContext } from "../../content/characters/resolve";
import { sailingPort, fishingWaterfront, riverMarket } from "../../content/settlements/waterfronts";
import { boatArt, fishItemId, fishOf, fishingPractice, fishingWords, hullNames, preserveOf, preserveWords, waterOf, type FishingWater, type Hull } from "../../content/economy/fishing";
import { propVisualCells } from "../../content/props/catalog";
import { propSprite } from "../../content/props/place";
import { random } from "../../core/random";
import type { Sample } from "./roads";
import type { Rect, SettlementPlan } from "./types";
import { installAnchorage, planAnchorage } from "./harbor";
import { launchAt, shoreDirections } from "./shoreline";

const key=(x:number,y:number)=>`${x},${y}`;
const cells=(r:Rect,f:(x:number,y:number)=>void)=>{
  for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)f(x,y);
};
const overlaps=(a:Rect,b:Rect)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;

export function planWaterfront(
  plan:SettlementPlan,pack:Pack,seed:string,sample:Sample,
  dry:(r:Rect,occupied?:boolean,core?:Rect,hinterland?:boolean)=>boolean,
  paint:(r:Rect,t:Terrain,reserve?:boolean,rank?:number,role?:"yard"|"lane")=>void,grade:(r:Rect)=>void,
  connect:(a:Point,b:Point,label:string,width?:number,area?:Rect,preview?:boolean)=>unknown,reserve:(r:Rect)=>void,
) {
  const s=pack.setting,profile=s && fishingWaterfront(s);
  if(!s || plan.terminal || plan.harbor || plan.anchorage)return;
  const market=riverMarket(s);
  const place=plan.site.namedId ?? (plan.site.home ? s.placeId : undefined), port=sailingPort(place,s.year);
  const amsterdam=place==="city-amsterdam";
  if(market || port) {
    const center=plan.site.center, radius=plan.site.profile.radius+72, limit=(s.playableMap?.size ?? Infinity)/2-6;
    const area={x:center.x-radius-12,y:center.y-radius-12,w:2*radius+24,h:2*radius+24};
    search: for(let ring=12;ring<=radius;ring+=6) for(let j=0;j<24;j++) {
      const angle=j*Math.PI/12;
      const base={x:center.x+Math.round(ring*Math.cos(angle)),y:center.y+Math.round(ring*Math.sin(angle))};
      if(sample(base.x,base.y).water<4 || sample(base.x,base.y).water>20)continue;
      for(const direction of shoreDirections) {
        const launch=launchAt(base,direction,sample,(x,y)=>Math.abs(x)>=limit || Math.abs(y)>=limit || plan.reserved.has(key(x,y)),
          {width:3,dryLength:3,reach:24,waterLength:7});
        if(!launch || !port && market && sample(launch.water.x,launch.water.y).kind!=="river")continue;
        const {x:dx,y:dy}=direction;
        const shore={x:launch.water.x-8*dx,y:launch.water.y-8*dy};
        if(port){
          const grain=port.cargo==="grain";
          const id=plan.site.id+(grain ? "-grain-warehouse" : "-cloth-warehouse");
          const sprite=amsterdam ? "euro-amsterdam-"+Math.floor(random(seed,id)*3)+"-urban-cottage" : profile?.gear ?? (port.hull==="dhow" ? "worksite-reed-gear-shelter" : "worksite-plank-fishing-store");
          const m=buildingModel(sprite), [w,h]=m.footprint;
          for(const side of [-6,6,-12,12]){
            const store={x:shore.x-dx*3-dy*side,y:shore.y-dy*3+dx*side};
            const r={x:store.x-Math.floor(w/2),y:store.y-h-1,w,h};
            const yard={x:r.x-1,y:r.y-1,w:w+2,h:h+4};
            if(!dry(yard,true,yard,true) || yard.x<=-limit || yard.y<=-limit || yard.x+yard.w>=limit || yard.y+yard.h>=limit)continue;
            if(!connect(store,center,id+"-lane",0,area,true))continue;
            cells(r,(x,y)=>plan.solid.add(key(x,y)));
            const a=planAnchorage(plan,launch,store,sample,limit,port.cargo,true);
            if(!a || a.porterPath.some(p=>plan.reserved.has(key(p.x,p.y)) && !plan.traffic.has(key(p.x,p.y)))){
              cells(r,(x,y)=>plan.solid.delete(key(x,y)));continue;
            }
            const p:Place={...r,id,name:grain ? "Baltic grain warehouse" : "Cloth warehouse",sprite,access:"public",claim:grain ? "grain-warehouse" : "cloth-warehouse",owner:plan.site.id+"-quay-merchant",
              entrance:{x:r.x+m.entrance[0],y:r.y+h},entranceLabel:"Enter",description:grain ? "Baltic grain comes ashore in sacks. A hoist under the gable lifts each delivery to the dry loft." : "Bales come ashore by lighter. Porters carry them inland to be opened and measured."};
            p.door=paintedDoor(p);
            if(p.door)p.entrance={x:p.door.x,y:p.door.y+1};
            const quayExit=(place:Place)=>plan.objects.push({id:place.id+"-exit",kind:"exit",name:"Return to the quay",sprite:"door-open",
              pos:{x:6,y:9,space:place.id},inventory:{}});
            plan.places.push(p);quayExit(p);
            plan.objects.push({id:id+"-chest",name:"Warehousekeeper’s household chest",kind:"container",sprite:"chest",owner:p.owner,
              pos:{x:r.x+1,y:r.y+h,space:"outside"},inventory:{}});
            plan.plots.push({...yard,id:id+"-waterfront-loading-bay",kind:"public",access:store});
            connect(store,center,id+"-lane",0,area);
            grade(yard);paint(yard,"paving",true,4,"yard");reserve(yard);
            for(const t of buildingArtCells(sprite,p))plan.placement.clearance.add(key(t.x,t.y));
            cells(r,(x,y)=>plan.built?.add(key(x,y)));
            for(const t of a.porterPath){
              for(let u=-2;u<=2;u++)for(let v=-1;v<=1;v++){
                const x=t.x+u,y=t.y+v;
                if(sample(x,y).water>0 && !plan.solid.has(key(x,y)))paint({x,y,w:1,h:1},"paving",true,4,"yard");
              }
            }
            const landing=a.landing, tip={x:a.shore.x-3*dx,y:a.shore.y-3*dy};
            const deck={x:Math.min(landing.x,tip.x)-2*Math.abs(dy),y:Math.min(landing.y,tip.y)-2*Math.abs(dx),
              w:Math.abs(tip.x-landing.x)+1+4*Math.abs(dy),h:Math.abs(tip.y-landing.y)+1+4*Math.abs(dx),
              level:Math.round(sample(landing.x,landing.y).elevation/14)};
            (plan.launches??=[]).push({...launch,origin:landing,water:a.shore,lane:deck,dry:[],pier:deck});
            cells(deck,(x,y)=>{plan.surface.set(key(x,y),"bridge");plan.reserved.add(key(x,y));});
            installAnchorage(plan,a,direction.id,id,s,seed,sample,paint,port.hull,amsterdam);
            if(!amsterdam)break search;
            const businesses=[
              ...(s.year>=beurs.from ? [{kind:"beurs",name:beurs.label,frame:"hall",about:beurs.about}] : []),
              {kind:"bakery",name:"Quayside bakery",frame:"shop",about:"The baker buys Baltic grain from the warehouse and bakes bread for the neighbourhood."},
              {kind:"grocer",name:"Pepper grocer",frame:"shop",about:"The grocer buys pepper from the East Indies consignments at the warehouse and sells it by measure."},
            ];
            for(const business of businesses){
              const placeId=plan.site.id+"-"+business.kind;
              const frame="euro-amsterdam-"+(business.frame==="hall" ? 0 : Math.floor(random(seed,placeId)*3))+"-urban-"+business.frame;
              const model=buildingModel(frame),[wide,deep]=model.footprint;
              searchLot: for(let d=10;d<=72;d+=4)for(let j=0;j<24;j++){
                const angle=j*Math.PI/12, x=store.x+Math.round(Math.cos(angle)*d), y=store.y+Math.round(Math.sin(angle)*d);
                const rect={x:x-Math.floor(wide/2),y:y-deep,w:wide,h:deep};
                const apron={x:rect.x-1,y:rect.y-1,w:wide+2,h:deep+5};
                if(apron.x <= -limit || apron.y <= -limit || apron.x+apron.w>=limit || apron.y+apron.h>=limit ||
                  !dry(apron,true,apron,true) || plan.places.some(p=>overlaps(apron,p)))continue;
                const b:Place={...rect,id:placeId,owner:plan.site.id+"-community",name:business.name,description:business.about,sprite:frame,
                  claim:business.kind==="beurs" ? "civic-"+beurs.id : business.kind,access:"public",entrance:{x:rect.x+model.entrance[0],y},entranceLabel:"Enter"};
                b.door=paintedDoor(b);
                if(b.door)b.entrance={x:b.door.x,y:b.door.y+1};
                cells(rect,(x,y)=>plan.solid.add(key(x,y)));
                if(!connect(b.entrance,store,placeId+"-lane",0,area,true)){cells(rect,(x,y)=>plan.solid.delete(key(x,y)));continue;}
                plan.places.push(b);quayExit(b);
                plan.plots.push({...apron,id:placeId+"-waterfront-loading-bay",kind:"public",access:b.entrance});
                connect(b.entrance,store,placeId+"-lane",0,area);
                grade(apron);paint(apron,"paving",true,4,"yard");reserve(apron);
                for(const t of buildingArtCells(frame,b))plan.placement.clearance.add(key(t.x,t.y));
                cells(rect,(x,y)=>plan.built?.add(key(x,y)));
                if(business.kind!=="beurs"){
                  const bread=business.kind==="bakery",item=bread ? "bread" : "pepper";
                  plan.objects.push({id:placeId+"-counter",name:bread ? "Bread counter" : "Grocer’s pepper counter",
                    pos:{x:rect.x+1,y:y+2,space:"outside"},kind:"monument",prop:"marketCounter",owner:placeId+"-counter-seller",sprite:stallFor(pack,0,bread ? 0 : 6).sprite,
                    inventory:{coin:25,[item]:bread ? 3 : 2},shopSupply:{source:id+"-store-stock",input:bread ? "grain" : "pepper",item,yield:bread ? loavesPerSack : 1,limit:bread ? 16 : 6}});
                }
                break searchLot;
              }
            }
            break search;
          }
          continue;
        }
        if(!market)continue;
        const id=plan.site.id+"-river-market";
        const spread=4+Math.floor(random(seed,id,"frontage")*3);
        const sites=[-spread,spread].map((k,i)=>{
          const setback=Math.floor(random(seed,id,"bank",i)*3);
          return {x:shore.x-dy*k-dx*setback,y:shore.y+dx*k-dy*setback};
        });
        const floors=sites.map(at=>({x:at.x-2,y:at.y-3,w:5,h:6}));
        if(floors.some(r=>!dry(r,true,r,true) || r.x<=-limit || r.y<=-limit || r.x+r.w>=limit || r.y+r.h>=limit))continue;
        const doors=sites.map((p,i)=>({x:p.x+(i===0?1:-1),y:p.y+1}));
        const links=[{a:base,b:center},...doors.map(b=>({a:base,b}))];
        if(!links.every(({a,b},i)=>connect(a,b,id+"-lane-"+i,0,area,true)))continue;
        links.forEach(({a,b},i)=>connect(a,b,id+"-lane-"+i,0,area));
        const landing={x:launch.water.x-dx*2,y:launch.water.y-dy*2};
        const tip={x:launch.water.x+dx,y:launch.water.y+dy};
        launch.pier={steps:{material:market.material,facing:direction.id,variant:Math.floor(random(seed,id,"steps")*3)},x:Math.min(landing.x,tip.x)-Math.abs(dy),y:Math.min(landing.y,tip.y)-Math.abs(dx),
          w:1+3*Math.abs(dx)+2*Math.abs(dy),h:1+3*Math.abs(dy)+2*Math.abs(dx),level:Math.round(sample(landing.x,landing.y).elevation/14)};
        (plan.launches??=[]).push(launch);
        for(const p of launch.dry)paint({...p,w:1,h:1},"dirt",true,4,"lane");
        cells(launch.pier,(x,y)=>{plan.surface.set(key(x,y),"bridge");plan.reserved.add(key(x,y));});
        cells(launch.lane,(x,y)=>plan.reserved.add(key(x,y)));
        const boat={x:tip.x+dx*2,y:tip.y+dy*2,space:"outside" as const};
        const alongside=[-3,-2,-1,0,1,2,3].every(n=>
          sample(boat.x-dy*n-dx,boat.y+dx*n-dy).water<0 && sample(boat.x-dy*n+dx,boat.y+dx*n+dy).water<0);
        const facing=alongside ? shoreDirections.find(d=>d.x===-dy && d.y===dx)! : direction;
        if(!alongside){boat.x+=dx;boat.y+=dy;}
        const mooring=alongside ? {x:tip.x-dy,y:tip.y+dx} : tip;
        plan.objects.push({id:id+"-boat",name:"Moored river boat",kind:"monument",pos:boat,mooring,
          sprite:facing.id==="south" ? "worksite-reed-skiff" : "worksite-reed-skiff-"+facing.id,inventory:{},description:"The crew has tied the boat alongside the landing to bring goods ashore."});
        const skids={x:landing.x-2*dx-2*dy,y:landing.y-2*dy+2*dx,space:"outside" as const};
        plan.objects.push({id:id+"-receiving",name:"Inbound river cargo",kind:"container",open:true,pos:skids,
          sprite:"harbor-quay-lot-"+market.stalls[0].art+"-"+direction.id+"-3",quayGoods:market.stalls.map(stall=>stall.item),
          inventory:Object.fromEntries(market.stalls.map(stall=>[stall.item,8]))});
        plan.reserved.add(key(skids.x,skids.y));
        const apron={x:Math.min(sites[0].x,sites[1].x,skids.x)-3,y:Math.min(sites[0].y,sites[1].y,skids.y)-2,
          w:Math.max(sites[0].x,sites[1].x,skids.x)-Math.min(sites[0].x,sites[1].x,skids.x)+7,
          h:Math.max(sites[0].y,sites[1].y,skids.y)-Math.min(sites[0].y,sites[1].y,skids.y)+7};
        plan.tradingApron=apron;
        plan.plots.push({...apron,id,kind:"public",access:shore});
        const apronLevel=launch.pier.level;
        plan.groundLevels??=new Map();
        cells(apron,(x,y)=>{
          if(sample(x,y).water<1 || plan.surface.get(key(x,y))==="bridge")return;
          if(plan.solid.has(key(x,y)))return;
          plan.groundLevels!.set(key(x,y),apronLevel);
          plan.placement.clearance.add(key(x,y));
          paint({x,y,w:1,h:1},"dirt",true,4,"yard");
        });
        for(const [i,stall] of market.stalls.entries()){
          const at=sites[i],floor=floors[i],pos={...doors[i],space:"outside" as const};
          const counter=id+"-"+stall.art,seller=counter+"-merchant";
          paint(floor,"dirt",true,4,"yard"); reserve({...at,w:1,h:1}); plan.solid.add(key(at.x,at.y));
          plan.objects.push({id:counter,kind:"monument",prop:"marketCounter",name:stall.name,description:stall.description,
            pos:{...at,space:"outside"},sprite:`harbor-river-${stall.art}-${Math.floor(random(seed,counter,"shelter")*3)}-1`,quayStock:{item:stall.item,source:id+"-receiving",received:0,collected:-1},owner:seller,inventory:{[stall.item]:4+Math.floor(random(seed,counter)*5),coin:24}});
          const trader=generateCharacter(s,seed,seller,38,"Merchant");
          plan.actors.push({id:seller,kind:"human",...trader,role:stall.role,pos,home:{...center,space:"outside"},work:pos,stockroom:counter,
            sprite:"human-1-2",activity:stall.role,fatigue:0,hunger:4,trust:1,memories:[],direction:2});
          plan.work.set(seller,{home:center,work:pos,water:base,social:base,label:stall.role,role:stall.role,offset:0});
        }
        const seat=sites[1], trade=market.stalls[1].art;
        const mat=[[-3,2],[3,2],[-2,3],[2,3]].map(([x,y])=>({x:seat.x+x,y:seat.y+y})).find(at=>
          propVisualCells("seatMat",at).every(p=>p.x>=apron.x && p.x<apron.x+apron.w && p.y>=apron.y && p.y<apron.y+apron.h &&
            sample(p.x,p.y).water>=2 && !plan.solid.has(key(p.x,p.y)) && !plan.traffic.has(key(p.x,p.y)) &&
            plan.objects.every(o=>o.pos.space!=="outside" || Math.abs(o.pos.x-p.x)>1 || Math.abs(o.pos.y-p.y)>1)));
        if(mat)plan.objects.push({id:id+"-mat",prop:"seatMat",kind:"monument",name:trade==="beer"?"Beer drinkers’ mat":"Spinning mat",
          pos:{...mat,space:"outside"},inventory:{},sprite:`harbor-quay-mat-${trade}-${Math.floor(random(seed,id,"mat")*3)}`});
        break search;
      }
    }
  }
  if(!profile)return;
  const revised=(s.worksiteRevision??1)>=5,practice=profile.practice,general=profile.id==="fishing-landing";
  const authoredHull:Hull|undefined=profile.craft==="papyrus" ? "reed" : profile.craft ? "plank" : undefined;
  const c=plan.site.center,radius=plan.site.profile.radius;
  const repair=plan.places.find(p=>p.institution==="boatyard");
  const anchor=repair && plan.launches?.[0];
  const id=`${plan.site.id}-waterfront-${profile.id}`;
  const fishMarket=profile.id==="edo-inshore-fishing";
  const preserve=fishMarket ? "wind-dry" : preserveOf(s,waterOf(s) ?? "river",`${seed}:${plan.site.id}`),keeping=preserveWords[preserve];
  const district:NonNullable<SettlementPlan["waterfront"]>={id,profile:profile.id,repairYardId:repair?.id,landingId:`${id}-landing`,preserve,members:[]};
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
  const half=s.playableMap && s.playableMap.size/2;
  // Deeper water a little way out, reachable afloat from the boat: the spots
  // the household's days rotate through.
  const groundsFrom=(from:Point):Point[]=>{
    const seen=new Set([key(from.x,from.y)]),queue=[{...from,d:0}],found:{p:Point;d:number;depth:number}[]=[];
    for(let i=0;i<queue.length && i<8000;i++) {
      const q=queue[i];
      if(q.d>=8)found.push({p:{x:q.x,y:q.y},d:q.d,depth:-sample(q.x,q.y).water});
      if(q.d>=36)continue;
      for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const x=q.x+ax,y=q.y+ay,k=key(x,y);
        if(seen.has(k))continue;
        seen.add(k);
        if(sample(x,y).water>=0 || half && (Math.abs(x)>half-6 || Math.abs(y)>half-6))continue;
        queue.push({x,y,d:q.d+1});
      }
    }
    found.sort((a,b)=>b.depth-a.depth || a.d-b.d);
    const out:Point[]=[];
    for(const f of found)if(out.length<3 && out.every(o=>Math.hypot(o.x-f.p.x,o.y-f.p.y)>=8))out.push(f.p);
    return out;
  };
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
      const salt=`${seed}:${id}-${n}`;
      const drawn=fishingPractice(s,sample(launch.water.x,launch.water.y).kind as FishingWater,salt,1);
      const hull=authoredHull ?? drawn.hull;
      const facing=profile.pier ? shoreDirections.find(d=>d.x===tx && d.y===ty)! : direction;
      const boatFrame=`${general ? boatArt(hull,s) : profile.boat}-${facing.id}`;
      // Hulls drawn only from the boat atlas moor on the plank skiff's footprint.
      const [bw,bh]=buildingModel(boatFrame.startsWith("boat-moored-") ? `worksite-plank-skiff-${direction.id}` : boatFrame).footprint;
      const mooring=revised ? Math.floor((dx ? bw : bh)/2) : 5;
      const bank={...launch.water};
      if(profile.pier)launch.water={x:bank.x+2*dx,y:bank.y+2*dy};
      const alongside=profile.pier ? Math.ceil((dx ? bh : bw)/2) : 0;
      const boat={x:launch.water.x+dx*mooring+tx*alongside,y:launch.water.y+dy*mooring+ty*alongside};
      const water=sample(boat.x,boat.y).kind as FishingWater;
      if(profile.waters && !profile.waters.some(k=>k===water))continue;
      const berth={x:boat.x-Math.floor(bw/2),y:boat.y-Math.floor(bh/2),w:bw,h:bh};
      let afloat=true;
      cells(berth,(x,y)=>{if(sample(x,y).water>=0 || plan.reserved.has(key(x,y)))afloat=false;});
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
      let netSite=equipment(gear,7,4);
      if(profile.pier && sortSite) {
        for(const side of [1,-1]) {
          const at={x:landing.x+tx*7*side-dx*2,y:landing.y+ty*7*side-dy*2};
          const patch={x:at.x-3,y:at.y-2,w:7,h:5};
          if(!overlaps(patch,sortSite.patch) && yards.every(y=>!overlaps(y,patch)) && dry(patch,true,patch,true)) {
            netSite={at,patch};break;
          }
        }
      }
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
        paint({x:p.x-1,y:p.y+p.h,w:p.w+2,h:2},"dirt",true,3,profile.pier ? "yard" : undefined);
        cells(p,(x,y)=>plan.built?.add(key(x,y)));
        for(const q of buildingArtCells(p.sprite,p))plan.placement.clearance.add(key(q.x,q.y));
        plan.places.push(p);
        plan.objects.push({id:`${p.id}-exit`,kind:"exit",name:"Return to the waterfront",sprite:"door-open",pos:{x:6,y:9,space:p.id},inventory:{},owner});
      }
      claim(launch.lane);claim(berth);
      (plan.launches??=[]).push(launch);
      if(profile.pier) {
        const root={x:bank.x-3*dx,y:bank.y-3*dy};
        const level=Math.round(sample(root.x,root.y).elevation/14);
        const tip={x:launch.water.x-dx,y:launch.water.y-dy};
        launch.pier={x:Math.min(root.x,tip.x)-Math.abs(tx),y:Math.min(root.y,tip.y)-Math.abs(ty),
          w:1+4*Math.abs(dx)+2*Math.abs(tx),h:1+4*Math.abs(dy)+2*Math.abs(ty),level};
        const length=(root.x-base.x)*dx+(root.y-base.y)*dy;
        const start=Math.max(0,length-7);
        const high=Math.round(sample(base.x+start*dx,base.y+start*dy).elevation/14);
        plan.groundLevels??=new Map();
        launch.dry=[];
        for(let i=0;i<length;i++)for(let j=-1;j<=1;j++) {
          const x=base.x+i*dx+j*tx,y=base.y+i*dy+j*ty;
          paint({x,y,w:1,h:1},"dirt",true,4,"lane");
          if(i>=start)plan.groundLevels.set(key(x,y),Math.round(high+(level-high)*(i-start+1)/(length-start)));
          launch.dry.push({x,y});
        }
        cells(launch.pier,(x,y)=>{plan.surface.set(key(x,y),"bridge");plan.reserved.add(key(x,y));});
      } else for(const p of launch.dry)paint({...p,w:1,h:1},"dirt");
      for(const patch of [netSite.patch,sortSite.patch])claim(patch);
      const boatId=`${id}-${n}-boat`,netsId=`${id}-${n}-nets`,catchId=`${id}-${n}-catch`;
      const fishing={...fishingPractice(s,water,salt,1),...(hull ? {hull} : {}),...(profile.method ? {method:profile.method} : {})};
      const craft=general && hull ? hullNames[hull] : undefined;
      plan.objects.push(
        {id:boatId,name:craft?.name ?? practice?.boat ?? "Household fishing boat",kind:"monument",sprite:boatFrame,...(launch.pier && {mooring:{x:launch.water.x-dx+tx,y:launch.water.y-dy+ty}}),pos:{...boat,space:"outside"},inventory:{},owner,
          description:craft?.description ?? practice?.boatDescription ?? "An open clinker-built rowing boat with thwarts and stored oars, moored at its household's landing."},
        {id:catchId,name:practice?.catch ?? (general ? "Catch-sorting place" : "Catch-sorting table"),kind:"container",sprite:profile.sorting,pos:{...sortingAt,space:"outside"},inventory:fishMarket ? {water:2} : {fish:4,water:2},owner},
        {id:netsId,name:practice?.nets ?? (general ? `${fishingWords[fishing.method].gear.replace(/^the /,"").replace(/^./,c=>c.toUpperCase())}, being mended` : "Lines and nets being repaired"),kind:"container",
          sprite:general && fishing.method==="seine" ? "worksite-seine-pegs" : profile.nets,pos:{...netsAt,space:"outside"},inventory:{tool:1},owner},
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
      let process:{id:string; pos:Point}|undefined;
      if(revised) {
        const basketId=`${id}-${n}-landing-baskets`;
        const pockets=(s.worksiteRevision??1)>=6 ? [[3,2],[-3,2],[3,-1],[-3,-1]] : [[3,2]];
        const basket=pockets.map(([x,y])=>({x:sortingAt.x+x,y:sortingAt.y+y})).find(at=>
          propVisualCells("basket",at).every(p=>sample(p.x,p.y).water>=4 && !plan.solid.has(key(p.x,p.y)) && !plan.traffic.has(key(p.x,p.y))));
        let sale={x:sortingAt.x+2,y:sortingAt.y+1};
        if(basket) {
          plan.objects.push({id:basketId,name:"Baskets for the fresh catch",kind:"container",prop:"basket",
            sprite:"study-propb-open-basket-0",pos:{...basket,space:"outside"},owner,inventory:{}});
          for(const p of propVisualCells("basket",basket))claim({...p,w:1,h:1});
        }
        // Where the catch is kept: a rack to dry or smoke it, a barrel or jar to salt it.
        // Coopered barrels were Celtic and Roman Europe's, and everyone's by 1500; jars before and elsewhere.
        const barrels=(s.culture==="european" || s.culture==="inner-eurasian") && s.year>=-300 || s.year>=1500;
        const prop=fishMarket ? "fishCuringShed" : keeping.prop==="barrel" && !barrels ? "jar" : keeping.prop;
        const pocketsAt=(prop:string)=>[...(fishMarket ? [[-dx*6,-dy*6],[-dx*6+tx*5,-dy*6+ty*5],[-dx*6-tx*5,-dy*6-ty*5]] : []),[6,0],[-6,0],[6,3],[-6,3],[0,5],[5,-4],[-5,-4],
          ...(fishMarket ? [7,-7,10,-10,0].flatMap(x=>[6,-5,1,9,-8].map(y=>[x,y])) : [])].map(([x,y])=>({x:sortingAt.x+x,y:sortingAt.y+y})).find(at=>
          propVisualCells(prop,at).every(p=>sample(p.x,p.y).water>=4 && !plan.solid.has(key(p.x,p.y)) && !plan.traffic.has(key(p.x,p.y)) && !plan.reserved.has(key(p.x,p.y))) &&
          (!fishMarket || Math.abs(sample(at.x,at.y).elevation-sample(at.x,at.y+1).elevation)<12 && connect({x:at.x,y:at.y+1},sorting,`worksite-${id}-fish-yard`,0,area,true)));
        const keepAt=prop && pocketsAt(prop);
        if(prop && keepAt) {
          const kind=prop==="dryingRack" ? "drying-rack" : prop==="barrel" ? "barrel" : "storage-jar";
          process={id:`${id}-${n}-keeping`,pos:keepAt};
          plan.objects.push(fishMarket ? {id:process.id,name:"Fish curing shed",kind:"monument",prop,
            sprite:"harbor-fish-shed-0",pos:{...keepAt,space:"outside"},owner,inventory:{salt:3},curing:{counter:`${catchId}-counter`}} : {id:process.id,name:keeping.name,kind:"container",prop,open:true,
            sprite:`study-propb-${kind}-${Math.floor(random(seed,id,n,"keeping")*3)}`,pos:{...keepAt,space:"outside"},owner,inventory:{fish:2}});
          for(const p of propVisualCells(prop,keepAt))claim({...p,w:1,h:1});
          plan.solid.add(key(keepAt.x,keepAt.y));
          if(prop==="dryingRack" || fishMarket)plan.work.get(owner)!.rackId=process.id;
          if(fishMarket) {
            const floor={x:keepAt.x-2,y:keepAt.y-1,w:5,h:3};
            grade(floor); paint(floor,"dirt",true,4,"yard");
            connect({x:keepAt.x,y:keepAt.y+1},sorting,`worksite-${id}-curing`,0,area);
          }
        }
        const market=fishMarket || n===0 && context.capabilities.has("market_exchange") && (s.settlement==="port" || s.settlementPattern==="waterfront");
        const stall=market && pocketsAt("fishCounter");
        if(stall) {
          const counter=`${catchId}-counter`,seller=`${id}-${n}-fishmonger`;
          sale={x:stall.x,y:stall.y+1};
          const stock=fishOf(s,water).filter(k=>!k.rarity && !k.trap);
          plan.objects.push({id:counter,name:"Fish seller’s counter",kind:"monument",prop:"fishCounter",sprite:fishMarket ? "harbor-fish-counter-1" : profile.sorting,
            pos:{...stall,space:"outside"},owner:seller,inventory:{coin:24,...Object.fromEntries(stock.slice(0,2).map((fish,i)=>[fishItemId(fish),3-i])),salt:4}});
          for(const p of propVisualCells("fishCounter",stall))claim({...p,w:1,h:1});
          plan.solid.add(key(stall.x,stall.y));
          const floor={x:stall.x-2,y:stall.y-1,w:5,h:3};
          grade(floor); paint(floor,"dirt",true,4,"yard");
          connect(sale,sorting,`worksite-${id}-fish-market`,0,area);
          const pos={...sale,space:"outside" as const};
          const trader=generateCharacter(s,seed,seller,38,"Market Seller",undefined,undefined,undefined,undefined,undefined,context);
          plan.actors.push({id:seller,kind:"human",...trader,role:"Fishmonger",age:38,
            pos,home:{...home.entrance,space:"outside"},work:pos,stockroom:counter,sprite:"human-1-2",activity:"Selling the morning catch",fatigue:0,hunger:4,trust:1,memories:[],direction:2});
          plan.work.set(seller,{home:home.entrance,work:sale,water:drinkingWater,social:sale,label:"Selling fish",role:"Fishmonger",offset:0});
        }
        if(profile.containers) {
          const occupied=new Set(plan.objects.filter(o=>o.pos.space==="outside").flatMap(o=>
            (o.prop ? propVisualCells(o.prop,o.pos,o.sprite) : [o.pos]).map(p=>key(p.x,p.y))));
          for(const [i,{prop,name,fish}] of profile.containers.entries()) {
            const sprite=propSprite(prop);
            const at=[[3,-1],[-3,-1],[3,2],[-3,2]].map(([x,y])=>({x:sortingAt.x+x,y:sortingAt.y+y})).find(q=>
              propVisualCells(prop,q,sprite).every(p=>sample(p.x,p.y).water>=0 && !plan.solid.has(key(p.x,p.y)) &&
                !plan.traffic.has(key(p.x,p.y)) && !occupied.has(key(p.x,p.y))));
            if(!at)continue;
            plan.objects.push({id:`${id}-${n}-gear-${i}`,name,kind:"container",
              prop,sprite,owner,pos:{...at,space:"outside"},inventory:fish ? {fish} : {}});
            for(const p of propVisualCells(prop,at,sprite)){occupied.add(key(p.x,p.y));claim({...p,w:1,h:1});}
          }
        }
        claim(sortSite.patch);
        if(profile.pier) {
          for(const patch of [sortSite.patch,netSite.patch]) {
            grade(patch);
            for(let j=0;j<patch.h;j++) {
              const inset=j===0 || j===patch.h-1 ? 1 : 0;
              paint({x:patch.x+inset,y:patch.y+j,w:patch.w-2*inset,h:1},"dirt",true,4,"yard");
            }
          }
        } else paint(sortSite.patch,"dirt");
        let lo=Infinity,hi=-Infinity;
        for(const p of launch.dry){const h=Math.round(sample(p.x,p.y).elevation/14);lo=Math.min(lo,h);hi=Math.max(hi,h);}
        handling={kind:launch.pier ? "earth-ramp" : hi>lo ? "timber-steps" : "beach",yard:sortSite.patch,sale,basketId:basket ? basketId : undefined,gear:gear.entrance};
      }
      district.members.push({owner,homeId:home.id,gearId:gear.id,boatId,netsId,catchId,landing,launch,nets,sorting,
        practice:fishing,grounds:groundsFrom(boat),...(process ? {process} : {}),...(handling ? {handling} : {})});
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
