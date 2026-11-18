import type { Actor, WorldModel } from "./types";

export function afloatAt(
  world: WorldModel,
  actor: Actor,
  x: number,
  y: number,
) {
  if (
    !actor.afloat ||
    actor.pos.space !== "outside" ||
    world.terrain(x, y) !== "water"
  )
    return false;
  const cell = world.topography?.(x, y);
  return !!cell && !cell.solid;
}

/** Three overlapping waterline sections leave room to come alongside a tapered bow. */
export function hullOverlap(a: {x:number;y:number}, heading:number, long:boolean,
  b:{x:number;y:number}, otherHeading:number, otherLong:boolean) {
  if(Math.abs(a.x-b.x)>13 || Math.abs(a.y-b.y)>10)return 0;
  const sections=(p:typeof a,f:number,large:boolean)=>{
    const t=f*Math.PI/4,scale=large ? 1 : .54;
    return [-3.9,0,4].map(u=>({x:p.x+u*Math.sin(t)*scale,y:p.y-u*Math.cos(t)*scale*.68,
      r:(u===0?1.6:1.15)*scale}));
  };
  const other=sections(b,otherHeading,otherLong);
  let overlap=0;
  for(const u of sections(a,heading,long))for(const v of other)
    overlap=Math.max(overlap,u.r+v.r-Math.hypot(u.x-v.x,(u.y-v.y)/.68));
  return overlap;
}

export function navigableHull(p:{x:number;y:number}, heading:number, large:boolean, wet:(x:number,y:number)=>boolean) {
  const angle=heading*Math.PI/4,dx=Math.sin(angle),dy=-Math.cos(angle),scale=large ? 1 : .54;
  for(const u of [-5.7,-2.8,0,2.8,5.7])for(const side of [-1,1]){
    const v=(Math.abs(u)>5?.45:1.35)*side;
    if(!wet(Math.round(p.x+(dx*u-dy*v)*scale),Math.round(p.y+(dy*u+dx*v)*scale*.68)))return false;
  }
  return true;
}
