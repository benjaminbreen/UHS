import type { Point } from "../../core/types";
import type { Rect } from "./types";
import type { Sample } from "./roads";

export const shoreDirections = [
  {id:"south",x:0,y:1}, {id:"east",x:1,y:0},
  {id:"north",x:0,y:-1}, {id:"west",x:-1,y:0},
] as const;
export type ShoreDirection = (typeof shoreDirections)[number];
export type Launch = { origin: Point; direction: ShoreDirection; water: Point; lane: Rect; dry: Point[]; workingLength:number; pier?: Rect & {level:number; steps?:import("../../core/topography").LandingSteps} };

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

/** A built-up shore: the line a city has filled its ground out to, and the
 * piers run out from it. `water` is the natural signed shore distance; the
 * made shore is that field read off a coarse lattice, which straightens every
 * cove and point into runs a block long at whatever angle the coast lies.
 * Returns the made distance at a cell and what the ground there is laid with,
 * or nothing where the shore is left as it lies: beyond `radius`, on a far
 * bank the city's ground does not reach, or along a stream too narrow to
 * berth in. */
export type QuayPier = Rect & {root: Point; outward: Point};
export function bulkhead(water: (x: number, y: number) => number, c: Point, radius: number) {
  const STEP = 12, span = Math.ceil(radius / STEP);
  const SPACING = 28, LENGTH = 20, HALF = 2;
  const ci = Math.round(c.x / STEP), cj = Math.round(c.y / STEP);
  const raws = new Map<string, number>(), nodes = new Map<string, number>();
  const raw = (i: number, j: number) => {
    const k = `${i},${j}`;
    let w = raws.get(k);
    if (w === undefined) raws.set(k, (w = Math.max(-40, Math.min(40, water(i * STEP, j * STEP)))));
    return w;
  };
  const node = (i: number, j: number) => {
    const k = `${i},${j}`;
    let w = nodes.get(k);
    if (w === undefined)
      nodes.set(k, (w = (raw(i, j) * 2 + raw(i + 1, j) + raw(i - 1, j) + raw(i, j + 1) + raw(i, j - 1)) / 6));
    return w;
  };
  // Open water, or the shallows of it. A stream's nodes are neither.
  const basin = (i: number, j: number) => {
    if (node(i, j) >= 0) return false;
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) if (node(i + di, j + dj) < -5) return true;
    return false;
  };
  let made: Set<string> | undefined;
  const ground = () => {
    if (made) return made;
    made = new Set();
    if (basin(ci, cj)) return made;
    const queue = [[ci, cj]];
    made.add(`${ci},${cj}`);
    for (let n = 0; n < queue.length; n++) {
      const [i, j] = queue[n];
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj, k = `${ni},${nj}`;
        if (made.has(k) || Math.max(Math.abs(ni - ci), Math.abs(nj - cj)) > span || basin(ni, nj)) continue;
        made.add(k);
        queue.push([ni, nj]);
      }
    }
    return made;
  };
  /** The made shore's distance, and how much of the cell is the city's: 1
   * where all four lattice nodes round it are its ground or its harbour,
   * falling to nothing toward a node that is neither. */
  const shore = (x: number, y: number) => {
    const i = Math.floor(x / STEP), j = Math.floor(y / STEP);
    if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) > span + 1) return;
    const u = x / STEP - i, v = y / STEP - j;
    let share = 0;
    for (const [di, dj] of [[0, 0], [1, 0], [0, 1], [1, 1]])
      if (ground().has(`${i + di},${j + dj}`) || basin(i + di, j + dj)) share += (di ? u : 1 - u) * (dj ? v : 1 - v);
    if (share < 0.01) return;
    return { share, line: (node(i, j) * (1 - u) + node(i + 1, j) * u) * (1 - v) +
      (node(i, j + 1) * (1 - u) + node(i + 1, j + 1) * u) * v };
  };
  let built: QuayPier[] | undefined;
  // A pier leaves the shore square to the grid, along whichever axis the
  // shore faces more nearly, wherever it has its own length of water and
  // room to pass beyond its head, at full length or a short one.
  const piers = () => {
    if (built) return built;
    built = [];
    const lo = -Math.ceil(radius / SPACING), hi = -lo;
    for (const alongX of [true, false])
      for (let n = lo; n <= hi; n++)
        for (let t = -radius; t < radius; t++) {
          const line = (alongX ? c.y : c.x) + n * SPACING, at = (alongX ? c.x : c.y) + t;
          const read = (a: number, l = line) => {
            const s = alongX ? shore(a, l) : shore(l, a);
            return s && s.share > 0.99 ? s.line : undefined;
          };
          const here = read(at), next = read(at + 1);
          if (here === undefined || next === undefined || here >= 0 === next >= 0) continue;
          const dir = here >= 0 ? 1 : -1, root = here >= 0 ? at : at + 1;
          const across = (read(root, line + 1) ?? here) - (read(root, line - 1) ?? here);
          const steep = Math.abs(next - here) * 2, cross = Math.abs(across);
          if (alongX ? steep < cross : steep <= cross) continue;
          // Clear of the far bank as it lies and as it is built.
          const wet = (a: number) => Math.max(alongX ? water(a, line) : water(line, a), read(a) ?? -Infinity);
          const length = [LENGTH, LENGTH * 0.6].find((l) => wet(root + dir * l) < -l * 0.45 && wet(root + dir * (l + 5)) < -3);
          if (!length) continue;
          const from = Math.min(root - dir * 3, root + dir * length), len = length + 4;
          const pier = alongX
            ? { x: from, y: line - HALF, w: len, h: HALF * 2 + 1 }
            : { x: line - HALF, y: from, w: HALF * 2 + 1, h: len };
          if (built.every((o) => pier.x > o.x + o.w + 6 || o.x > pier.x + pier.w + 6 || pier.y > o.y + o.h + 6 || o.y > pier.y + pier.h + 6))
            built.push({...pier,root:alongX ? {x:root,y:line} : {x:line,y:root},outward:alongX ? {x:dir,y:0} : {x:0,y:dir}});
        }
    return built;
  };
  const sample = (x: number, y: number, natural: number): { water: number; laid?: "sett" | "plank" } | undefined => {
    let deck = -Infinity;
    for (const p of piers()) {
      const dx = Math.max(p.x - (x + 0.5), x + 0.5 - (p.x + p.w)), dy = Math.max(p.y - (y + 0.5), y + 0.5 - (p.y + p.h));
      deck = Math.max(deck, dx > 0 && dy > 0 ? -Math.hypot(dx, dy) : -Math.max(dx, dy));
    }
    // A pier's head may stand in water nearer the far bank than the city's.
    const own = shore(x, y), share = own?.share ?? 1;
    const line = own?.line ?? (natural < 0 && deck > -8 ? natural : undefined);
    if (line === undefined) return;
    // Water the line would bury or strand is some other water's, and stands.
    if (natural < 0 ? line > STEP / 2 : natural < line - STEP) return;
    // Out past the berths the bed is the natural one again.
    const out = natural < 0 ? Math.max(0, Math.min(1, (-line - 4) / 8)) : 0;
    const water = Math.max(line + (natural - line) * out, deck);
    // Where the city's ground gives out, its shore runs back into the natural one.
    return share > 0.99 ? { water, laid: deck > line ? "plank" : "sett" } : { water: natural + (water - natural) * share };
  };
  return Object.assign(sample,{piers});
}
