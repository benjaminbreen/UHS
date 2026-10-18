import type { Point } from "../../core/types";
import type { Rect } from "./types";
import type { Sample } from "./roads";

export const shoreDirections = [
  {id:"south",x:0,y:1}, {id:"east",x:1,y:0},
  {id:"north",x:0,y:-1}, {id:"west",x:-1,y:0},
] as const;
export type ShoreDirection = (typeof shoreDirections)[number];
export type Launch = { origin: Point; direction: ShoreDirection; water: Point; lane: Rect; dry: Point[]; workingLength:number };

/** A launch needs a continuous approach and open water beyond it, not just a nearby wet cell. */
export function launchAt(
  origin: Point, direction: ShoreDirection, sample: Sample,
  occupied: (x:number,y:number)=>boolean,
  spec: {width:number; dryLength:number; reach:number; waterLength:number},
): Launch | undefined {
  const {x:dx,y:dy}=direction, half=Math.floor(spec.width/2);
  const at=(along:number,across=0)=>({x:origin.x+dx*along-dy*across,y:origin.y+dy*along+dx*across});
  if(sample(origin.x,origin.y).water<4) return;
  let bank=0;
  for(let d=spec.dryLength;d<=spec.reach;d++) {
    const p=at(d);
    if(sample(p.x,p.y).water<0) {bank=d;break;}
  }
  if(!bank) return;
  let lo=Infinity,hi=-Infinity,waterLo=Infinity,waterHi=-Infinity;
  const dry:Point[]=[];
  for(let across=-half;across<=half;across++) {
    let wet=false;
    for(let along=0;along<bank+spec.waterLength;along++) {
      const p=at(along,across),f=sample(p.x,p.y);
      if(f.fall || occupied(p.x,p.y) || (along<spec.dryLength && f.water<4)) return;
      if(f.water<0) {
        wet=true;waterLo=Math.min(waterLo,f.elevation);waterHi=Math.max(waterHi,f.elevation);
      }
      else if(wet || along>=bank+2) return;
      if(f.water>=4) {
        lo=Math.min(lo,f.elevation);hi=Math.max(hi,f.elevation);dry.push(p);
      }
      if(along>=bank+2 && (f.water>=0 || Math.abs(f.elevation-hi)>14)) return;
      if(along===bank+spec.waterLength-1 && f.water> -3) return;
    }
  }
  if(hi-lo>14 || waterHi-waterLo>7) return;
  const a=at(0,-half),b=at(bank+spec.waterLength-1,half);
  return {origin,direction,water:at(bank),dry,workingLength:spec.dryLength,
    lane:{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x)+1,h:Math.abs(b.y-a.y)+1}};
}
