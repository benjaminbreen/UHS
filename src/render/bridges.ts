import { own, renderResources, type RenderResources } from "./resources";
import type { TerrainRegion } from "./terrain-region";
import type Phaser from "phaser";
import type { LandingSteps, TopographySample } from "../core/topography";
import { TERRAIN_RISE } from "./terrain-projection";
export type BridgeSpan = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  elevation: number;
};
/** Discover whole spans across chunk boundaries so no artificial end posts appear. */
export function bridgeSpans(
  sample: TopographySample,
  width: number,
  height: number,
  unbounded = false,
): BridgeSpan[] {
  const spans: BridgeSpan[] = [];
  const visited = new Set<string>();
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      if (visited.has(key) || !sample(x, y)?.bridge) continue;
      const cells: [number, number][] = [[x, y]];
      visited.add(key);
      for (let i = 0; i < cells.length; i++)
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = cells[i][0] + dx,
            ny = cells[i][1] + dy,
            k = `${nx},${ny}`;
          if (
            (unbounded
              ? Math.abs(nx - x) > 128 || Math.abs(ny - y) > 128
              : nx < 0 || ny < 0 || nx >= width || ny >= height) ||
            visited.has(k) ||
            !sample(nx, ny)?.bridge
          )
            continue;
          visited.add(k);
          cells.push([nx, ny]);
        }
      const minX = Math.min(...cells.map((c) => c[0])),
        maxX = Math.max(...cells.map((c) => c[0])),
        minY = Math.min(...cells.map((c) => c[1])),
        maxY = Math.max(...cells.map((c) => c[1]));
      spans.push({ minX, maxX, minY, maxY, elevation: sample(x, y)!.height });
    }
  return spans;
}
/** A bridge is one timber span, not a repeating square ground tile. */
export function drawBridges(
  scene: Phaser.Scene,
  sample: TopographySample,
  width: number,
  height: number,
  region?: TerrainRegion,
  spans = bridgeSpans(sample, width, height, !!region),
  resources: RenderResources = renderResources(),
) {
  const footprints: { x: number; y: number; width: number; height: number }[] =
    [];
  for (const { minX, minY, maxX, maxY, elevation } of spans) {
    if (region && (minX < 0 || minY < 0 || minX >= width || minY >= height))
      continue;
    const mx = (minX + maxX) >> 1, my = (minY + maxY) >> 1;
    const cutEW = sample(minX - 1, my)?.waterVisual?.wideChannel || sample(maxX + 1, my)?.waterVisual?.wideChannel;
    const cutNS = sample(mx, minY - 1)?.waterVisual?.wideChannel || sample(mx, maxY + 1)?.waterVisual?.wideChannel;
    const horizontal = !!cutNS !== !!cutEW ? !!cutNS : maxX - minX >= maxY - minY;
    const left = minX * 16 - 3,
      top = minY * 16 - elevation * TERRAIN_RISE,
      w = (maxX - minX + 1) * 16 + 6,
      h = (maxY - minY + 1) * 16;
    const pier = sample(minX, minY)?.pier;
    const skirt = pier ? 14 : 6;
    footprints.push({ x: left, y: top, width: w, height: h + skirt });
    const deck = scene.add.graphics();
    const rect = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: number,
      alpha = 1,
    ) => {
      deck.fillStyle(color, alpha);
      deck.fillRect(x - left, y - top, w, h);
    };
    // Water remains visible below the suspended span and its front bearer.
    const track = sample(minX, minY)?.track;
    if (pier===true) {
      for (let px = left + 2; px < left + w - 3; px += 24) {
        rect(px, top + h + 4, 6, 9, 0x4e4035);
        rect(px + 1, top + h + 5, 3, 6, 0x906b48);
        rect(px + 1, top + h + 11, 4, 2, 0x5e5745);
      }
    } else if (!pier) {
      const shadow = own(resources, scene.add.graphics().setDepth(-2000));
      shadow.fillStyle(0x153d50, 0.55);
      shadow.fillRect(left + 3, top + h + 5, w - 2, 10);
      if (track && track.axis === "y") shadow.fillRect(left + w, top + 4, 5, h);
    }
    if (typeof pier==="object") {
      riverSteps(rect,left,top,w,h,pier);
    } else if (track) railDeck(rect, left, top, w, h, track.axis === "x", track.at);
    else {
      rect(left, top, w, h + 5, 0x533b2c);
      rect(left + 1, top + 1, w - 2, h - 1, 0x8c653f);
      const length = horizontal ? w : h;
      for (let u = 2; u < length - 1; u += 6) {
        const shade = [0xb68b53, 0xa67b47, 0xc29a60, 0xad834d][
          Math.floor(u / 6) % 4
        ];
        if (horizontal) {
          rect(left + u, top + 2, 4, h - 4, shade);
          rect(left + u, top + 2, 1, h - 4, 0xd4ae70);
          rect(
            left + u + 3,
            top + 6 + (u % 11),
            1,
            Math.max(2, h - 18 - (u % 9)),
            0x956c42,
          );
          rect(left + u + 1, top + 5, 1, 1, 0x614b34);
          rect(left + u + 1, top + h - 6, 1, 1, 0x614b34);
        } else {
          rect(left + 2, top + u, w - 4, 4, shade);
          rect(left + 2, top + u, w - 4, 1, 0xd4ae70);
          const knot = (u * 13) % Math.max(1, w - 18);
          rect(left + 5 + knot, top + u + 3, Math.min(9, w - 7 - knot), 1, 0x956c42);
          rect(left + 5, top + u + 1, 1, 1, 0x614b34);
          rect(left + w - 6, top + u + 1, 1, 1, 0x614b34);
        }
      }
      rect(left, top, w, 2, 0xe0b97c);
      rect(left, top + h - 2, w, 3, 0x6b4a32);
      rect(left, top + h + 1, w, 2, 0x9b7145);
      rect(left, top + h + 4, w, 2, 0x44362c);
    }
    // Bake once, then split by logical row so banks cannot cut holes in
    // the deck and walkers retain the same depth order as raised ground.
    const texture = `${region?.prefix ?? "contour"}-bridge-${minX}-${minY}`;
    if (scene.textures.exists(texture)) scene.textures.remove(texture);
    deck.generateTexture(texture, w, h + skirt);
    resources.textures.push(texture);
    deck.destroy();
    for (let offset = 0; offset < h; offset += 16)
      own(
        resources,
        scene.add
          .image(left, top, texture)
          .setOrigin(0)
          .setCrop(0, offset, w, offset + 16 >= h ? 16 + skirt : 16)
          .setDepth((minY + offset / 16) * 16 + 2),
      );
    if (cutEW || cutNS) {
      const rails = horizontal
        ? [top + 1, top + h - 1].map(y => ({ x: left + 4, y, w: w - 9, h: 3 }))
        : [left + 3, left + w - 6].map(x => ({ x, y: top + 1, w: 3, h: h - 1 }));
      for (const rail of rails) {
        const g = own(resources, scene.add.graphics().setDepth(rail.y + rail.h + elevation * TERRAIN_RISE + 1));
        g.fillStyle(0x694d35).fillRect(rail.x, rail.y - 9, rail.w, rail.h);
        g.fillStyle(0xc49e6a).fillRect(rail.x, rail.y - 10, horizontal ? rail.w : 1, horizontal ? 1 : rail.h);
      }
    }
    // End posts have lit caps, shaded sides and feet below the deck.
    if (!track && typeof pier!=="object")
      for (const px of [left + 2, left + w - 7])
        for (const py of [top + 1, top + h - 1]) {
          const post = own(
            resources,
            scene.add.graphics().setDepth(py + elevation * TERRAIN_RISE + 3),
          );
          const box = (
            x: number,
            y: number,
            w: number,
            h: number,
            c: number,
          ) => {
            post.fillStyle(c);
            post.fillRect(x, y, w, h);
          };
          box(px - 1, py - 12, 7, 20, 0x4e392a);
          box(px, py - 11, 5, 18, 0x9a7148);
          box(px, py - 11, 2, 16, 0xbf945b);
          box(px + 4, py - 9, 1, 17, 0x715036);
          box(px - 1, py - 13, 7, 3, 0xdbc087);
          box(px, py - 12, 5, 2, 0xe7c88c);
          if (pier) {
            box(px, py - 12, 3, 1, 0xb4895f);
            for (const y of [py - 6, py - 4]) {
              box(px - 1, y, 7, 2, 0x775239);
              box(px, y, 5, 1, 0xc3a16d);
            }
          }
        }
  }
  return footprints;
}

function riverSteps(
  rect:(x:number,y:number,w:number,h:number,color:number,alpha?:number)=>void,
  left:number,top:number,w:number,h:number,{material,facing,variant}:LandingSteps,
) {
  const brick=material==="brick", across=facing==="west" || facing==="east";
  const length=across?w:h, breadth=across?h:w;
  const stone=brick
    ? [0xefc28d,0xd4a577,0xc08e65,0xad7d58,0x91674e,0x745342,0x58463e]
    : [0xf0e3bf,0xdaccaa,0xc3b595,0xa99c80,0x8c806b,0x716957,0x57574e];
  const wood=[0xd8b884,0xb18b60,0x936d4b,0x77573f,0x574239,0x47443b];
  // u runs from the bank to the boat. Height always projects up the screen.
  const point=(u:number,v:number)=>{
    if(facing==="west")return [w-1-u,h-1-v];
    if(facing==="north")return [v,h-1-u];
    return facing==="south"?[w-1-v,u]:[u,v];
  };
  const slabs:{x:number;y:number;w:number;d:number;z:number;timber:boolean;index:number}[]=[];
  function block(u:number,v:number,du:number,dv:number,z:number,timber:boolean,index:number) {
    if(du<=0 || dv<=0)return;
    const [x,y]=point(u,v),[b,c]=point(u+du-1,v+dv-1);
    slabs.push({x:Math.min(x,b),y:Math.min(y,c),w:Math.abs(x-b)+1,d:Math.abs(y-c)+1,z,timber,index});
  }
  const head=Math.floor(length*.25),toe=length-16, courses=4+variant;
  block(0,1,head,breadth-2,10,false,1);
  for(let i=0;i<courses;i++){
    const start=head+Math.floor((toe-head)*i/courses),end=head+Math.floor((toe-head)*(i+1)/courses);
    const inset=3+Math.floor(i/2),z=9-Math.round(i*7/(courses-1));
    block(start,inset,end-start,breadth-2*inset,z,false,i+2);
    // The cheek stones stop above the wettest tread.
    if(i<courses-1)for(const v of [1,breadth-inset])
      block(start,v,end-start,inset-1,z+3,false,i+8);
  }
  for(let i=0;i<4;i++)block(toe+4*i,3,4,breadth-6,2,true,i);
  const put=(x:number,y:number,dx:number,dy:number,c:number,a=1)=>rect(left+x,top+y,dx,dy,c,a);
  for(const b of slabs.sort((a,b)=>(a.y+a.d)-(b.y+b.d) || a.y-b.y || a.z-b.z)){
    const {x,y,w:bw,d,z,timber,index}=b;
    const base=y+8, surface=base-z, front=surface+d-1;
    const p=timber?wood:stone, value=timber?2:index===1?2:2+(index%4===0?1:0);
    put(x,front+1,bw,z+2,p[timber?4:5]);
    put(x,front+1,bw-1,Math.max(1,z-1),p[timber?3:4]);
    if(z>5 && bw>8){
      put(x,front+Math.ceil(z*.55),bw,1,p[5]);
      for(let i=6+index%5;i<bw;i+=brick?11:17)put(x+i,front+2,1,Math.max(1,(z>>1)-1),p[5]);
    }
    put(x,surface,bw,d,p[value]);
    if(bw>6 && d>3){
      put(x+1,surface,bw-2,1,p[value-1]);
      put(x+bw-1,surface,1,d,p[value+1]);
      for(let cut=7+(index*11)%9;cut<bw-2;cut+=brick?13:22){
        put(x+cut,surface+1,1,Math.min(d-1,3+index%5),p[value+1]);
        if(d>7)put(x+cut-2,surface+Math.floor(d/2),2,1,p[value+1]);
      }
    } else if(d>6){
      for(let cut=6+index%5;cut<d-2;cut+=timber?17:brick?12:19)put(x,surface+cut,Math.max(1,bw-1),1,p[value+1]);
      put(x,surface,1,d-1,p[value-1]);
    }
    put(x+1,front,Math.max(1,bw-2),1,p[timber?1:Math.max(1,value-1)]);
    if(bw>13)put(x+4+index%4,front,3+index%5,1,p[value]);
    if(timber)put(x+Math.floor(bw/2),surface+Math.floor(d/2),1,1,wood[4]);
  }
  function rail(u0:number,u1:number,v:number) {
    const [ax,ay]=point(u0,v),[bx,by]=point(u1,v);
    const za=18, zb=13;
    const count=Math.max(1,Math.abs(bx-ax),Math.abs((by-zb)-(ay-za)));
    for(let i=0;i<=count;i++){
      const t=i/count, x=Math.round(ax+(bx-ax)*t),y=Math.round(ay+(by-ay)*t);
      put(x+2,y+2,2,2,wood[4],.26);
      const top=y-Math.round(za+(zb-za)*t)+8;
      put(x,top,2,2,wood[2]);put(x,top-1,1,1,wood[0]);
    }
    for(const [x,y,z] of [[ax,ay,za],[bx,by,zb]]){
      put(x-1,y+6-z,4,z-4,wood[4]);put(x-1,y+6-z,2,z-6,wood[2]);
      put(x-2,y+6-z,5,2,wood[1]);put(x-1,y+10-z,4,1,wood[0]);
    }
  }
  rail(4,toe-4,3);
  if(variant===2)rail(4,head+5,breadth-4);
  const [coilX,coilY]=point(Math.floor(head/2),breadth-12);
  const cord=["   ++==   "," +=.  .== ","+= .++= .=.","+ .+  =. =.","+ .=+++. =."," =.  ..== .","  =====. +.","         ++"];
  for(const [j,row] of cord.entries())for(let i=0;i<row.length;i++){
    const tone=row[i]==="+"?0:row[i]==="="?2:row[i]==="."?4:-1;
    if(tone>=0)put(coilX+i-5,coilY+j-6,1,1,wood[tone]);
  }
  // Rope turns and end-grain on the two fenders mark the outer landing.
  for(const v of [5,breadth-6]){
    const [x,y]=point(length-3,v), foot=y+10;
    put(x-2,foot-14,5,17,wood[4]);put(x-1,foot-13,3,14,wood[2]);
    put(x-2,foot-12,1,9,wood[1]);put(x-2,foot-1,5,3,wood[5]);
    put(x-2,foot-15,4,2,wood[1]);put(x-1,foot-15,2,1,wood[0]);
    for(const k of [8,10]){put(x-3,foot-k,6,1,wood[0]);put(x-2,foot-k+1,5,1,wood[3]);}
  }
}

/** A plate-girder rail deck: sleepers on steel over the water, two tracks at
 * the plain line's offsets, and lattice girders along both sides. */
function railDeck(
  rect: (x: number, y: number, w: number, h: number, c: number) => void,
  left: number,
  top: number,
  w: number,
  h: number,
  alongX: boolean,
  at: number,
) {
  const STEEL = 0x4f5b56,
    LIT = 0x8e9a90,
    DARK = 0x222827,
    TIE = 0x5a4332,
    TIE_LIT = 0x7d6147,
    TIE_DARK = 0x3a2b21,
    RAIL = 0xd4d1c2;
  const length = alongX ? w : h,
    across = alongX ? h : w;
  const put = (u: number, v: number, du: number, dv: number, c: number) =>
    alongX
      ? rect(left + u, top + v, du, dv, c)
      : rect(left + v, top + u, dv, du, c);
  // Tracks sit where the plain line puts them, measured from its first cell.
  const band = -at * 16 + (alongX ? 0 : 3);
  // An open deck: the river shows between the sleepers, over cross girders.
  for (let u = 6; u < length; u += 24) put(u, 4, 3, across - 8, STEEL);
  for (const tc of [18, 46]) {
    const c = band + tc;
    if (c < 4 || c > across - 4) continue;
    put(0, c - 8, length, 2, STEEL);
    put(0, c + 7, length, 2, STEEL);
    for (let u = 1; u < length - 1; u += 5) {
      put(u, c - 10, 3, 21, TIE);
      put(u, c - 10, 1, 21, TIE_LIT);
      put(u + 2, c - 10, 1, 21, TIE_DARK);
    }
    for (const r of [c - 6, c + 6]) {
      put(0, r, length, 1, RAIL);
      put(0, r + 1, length, 1, DARK);
    }
  }
  // Side girders, riveted along the top flange.
  for (const v of [0, across - 4]) {
    put(0, v, length, 4, STEEL);
    put(0, v, length, 1, LIT);
    put(0, v + 3, length, 1, DARK);
    for (let u = 2; u < length; u += 4) put(u, v + 2, 1, 1, LIT);
  }
  if (!alongX) return;
  // The south girder's latticed web shows below the deck.
  rect(left, top + h, w, 6, STEEL);
  rect(left, top + h, w, 1, LIT);
  rect(left, top + h + 5, w, 1, DARK);
  for (let u = 0; u < w; u++) {
    const d = u % 8;
    if (d === 0) rect(left + u, top + h + 1, 1, 4, DARK);
    else {
      rect(left + u, top + h + 1 + (d >> 1), 1, 1, DARK);
      rect(left + u, top + h + 4 - (d >> 1), 1, 1, DARK);
    }
  }
}
