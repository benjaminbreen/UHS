import { rngOf, walkable, LEDGE, type SewerLevel } from "../world/sewer";
import type { Point } from "./types";
import type { SewerHost } from "./sewer";

export type PerilKind = "fall" | "tub" | "afterdamp" | "inrush";
/** Something going wrong down a mine, played out where the player stands.
 * A fall's cells start with its centre; a tub's are the rails it runs in
 * order; afterdamp and an inrush spread from their one cell. */
export type Peril = { kind: PerilKind; space: string; start: number; cells: number[]; size?: number; last?: number; near?: boolean; hit?: number };
export type Trapped = { since: number; rescue: number; knocks?: number };

// Game seconds. Walking spends about two a step, so a fall gives a dozen steps' warning.
export const FALL_WARN = 26;
export const TUB_CELL = 1.4;
const DAMP_SPEED = 0.35, FLOOD_SPEED = 0.9, FLOOD_SPRAY = 8, FLOOD_REACH = 20;
const DAMP_LINGER = 1500, FLOOD_HOLD = 400;

const cheb = (a: Point, b: Point) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

const fields = new Map<string, Int16Array>();
/** Steps from a peril's source over open ground, -1 where it cannot reach. */
export function perilField(level: SewerLevel, from: number, solid: ReadonlySet<number>) {
  const key = `${level.space}:${from}:${solid.size}`;
  const known = fields.get(key);
  if (known) return known;
  const { w, h, cells } = level, dist = new Int16Array(w * h).fill(-1), queue = [from];
  dist[from] = 0;
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q], x = i % w, y = (i - x) / w;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, n = ny * w + nx;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || dist[n] >= 0 || !walkable(cells[n]) || solid.has(n)) continue;
      dist[n] = dist[i] + 1;
      queue.push(n);
    }
  }
  if (fields.size > 24) fields.clear();
  fields.set(key, dist);
  return dist;
}
/** How far a spreading peril has come, in steps from its source. */
export function perilReach(p: Peril, clock: number) {
  const t = clock - p.start;
  return p.kind === "afterdamp" ? t * DAMP_SPEED : p.kind === "inrush" ? Math.min(FLOOD_REACH, Math.max(0, t - FLOOD_SPRAY) * FLOOD_SPEED) : 0;
}
/** When a peril is over and the level is itself again. */
function perilEnd(p: Peril) {
  return p.kind === "fall" ? p.start + FALL_WARN
    : p.kind === "tub" ? p.start + p.cells.length * TUB_CELL
      : p.kind === "inrush" ? p.start + FLOOD_SPRAY + FLOOD_REACH / FLOOD_SPEED + FLOOD_HOLD
        : p.start + 120 / DAMP_SPEED + DAMP_LINGER;
}

/** The ways out of a level a trapped miner would need: ladders up and down, the cage. */
function exits(level: SewerLevel) {
  return [...level.shafts.map((s) => s.y * level.w + s.x), ...(level.down ? [level.down.y * level.w + level.down.x] : [])];
}

/** How likely something goes wrong in each two minutes spent in this part of the mine. */
function hazard(level: SewerLevel, year: number) {
  const base = level.depth === 1 ? 0.006 : level.depth === 2 ? 0.012 : 0.02;
  return base * (year >= 1950 ? 0.4 : year < 1850 ? 1.3 : 1);
}

/** Starts something going wrong round the player, or false when this kind
 * cannot happen here. Nothing starts while another is under way. */
export function perilStart(h: SewerHost, kind: PerilKind, level: SewerLevel, solid: ReadonlySet<number>): boolean {
  const run = h.state.sewer!, p = h.state.player.pos, clock = h.state.clock, { w, cells } = level;
  if (run.peril || run.trapped) return false;
  const rng = rngOf(h.state.manifest.seed, "peril", level.space, clock);
  const here = p.y * w + p.x;
  const start = (peril: Omit<Peril, "space" | "start">, text: string) => {
    run.peril = { ...peril, space: level.space, start: clock };
    h.event(text, "world");
    return true;
  };
  if (kind === "fall") {
    const keep = new Set(exits(level));
    const c = { x: p.x + Math.round(rng() * 2 - 1), y: p.y + Math.round(rng() * 2 - 1) };
    const size = 1.6 + rng() * 0.9, hit: number[] = [];
    for (let y = Math.floor(c.y - size); y <= c.y + size; y++)
      for (let x = Math.floor(c.x - size); x <= c.x + size; x++) {
        const i = y * w + x;
        if (x >= 0 && y >= 0 && x < w && y < level.h && walkable(cells[i]) && !keep.has(i) && Math.hypot(x - c.x, y - c.y) <= size) hit.push(i);
      }
    if (hit.length < 3) return false;
    return start({ kind, cells: [c.y * w + c.x, ...hit], size, near: Math.hypot(p.x - c.x, p.y - c.y) <= size + 0.5 },
      level.kind === "salt"
        ? "A sharp crack runs across the salt over your head, and grains start to sift down. The roof is going. Run!"
        : "The roof over you cracks like a gunshot and dust starts pouring down. The roof is coming in. Run!");
  }
  if (kind === "tub") {
    if (h.world.pack.setting && h.world.pack.setting.year < 1750) return false;
    let at: Point | undefined;
    for (let r = 0; r <= 3 && !at; r++)
      for (let dy = -r; dy <= r && !at; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && cells[(p.y + dy) * w + p.x + dx] === LEDGE && !solid.has((p.y + dy) * w + p.x + dx)) {
            at = { x: p.x + dx, y: p.y + dy };
            break;
          }
    if (!at) return false;
    const rail = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < level.h && cells[y * w + x] === LEDGE && !solid.has(y * w + x);
    const across = rail(at.x - 1, at.y) || rail(at.x + 1, at.y);
    const [dx, dy] = across ? [1, 0] : [0, 1];
    const line = (s: number) => {
      const out: number[] = [];
      for (let k = 1; rail(at!.x + dx * k * s, at!.y + dy * k * s); k++) out.push((at!.y + dy * k * s) * w + at!.x + dx * k * s);
      return out;
    };
    const a = line(-1), b = line(1), [from, to] = a.length >= b.length ? [a, b] : [b, a];
    if (from.length < 10) return false;
    // Loosed about two dozen tubs' lengths off: four or five seconds of warning.
    return start({ kind, cells: [...from.slice(0, 24).reverse(), at.y * w + at.x, ...to], last: -1, near: cheb(at, p) <= 1 },
      "Somewhere up the road a man yells “Runaway!” A loaded tub has broken loose and is coming down the rails. Get off the rails!");
  }
  if (kind === "afterdamp" || kind === "inrush") {
    const rooms = level.rooms.filter((r) => r.use === "face" || r.use === "stope" || r.use === "chamber");
    if (!rooms.length) return false;
    const mid = (r: (typeof rooms)[number]) => (r.y + Math.floor(r.h / 2)) * w + r.x + Math.floor(r.w / 2);
    const from = perilField(level, here, solid);
    const reachable = rooms.map(mid).filter((i) => from[i] >= 0);
    if (!reachable.length) return false;
    if (kind === "inrush") {
      // The water breaks in at the face nearest the player.
      const src = reachable.sort((a, b) => from[a] - from[b])[0];
      return start({ kind, cells: [src] },
        from[src] < 8
          ? "The face in front of you starts to hiss and spit water through the cracks, ice cold. There are old flooded workings behind it, and they are coming through. Get out, now!"
          : "Far off, men are shouting and there is a roar like a river in flood. Water has broken into the workings. Get to higher ground and the ladders!");
    }
    const src = reachable.sort((a, b) => from[b] - from[a])[0];
    return start({ kind, cells: [src] },
      "A heavy thump comes through the rock, more felt than heard. The air stops dead, then rushes past you full of dust. Gas has fired somewhere in the workings, and the afterdamp will come after it. Get to the shaft!");
  }
  return false;
}

/** The peril playing out, and the small chance of one starting. Runs on the
 * mine's own clock with the rest of `sewerTime`. */
export function perilTime(h: SewerHost, level: SewerLevel, solid: Set<number>) {
  const run = h.state.sewer!, clock = h.state.clock, pos = h.state.player.pos, { w } = level;
  const peril = run.peril;
  if (peril && peril.space !== level.space) {
    if (clock >= perilEnd(peril)) delete run.peril;
    return;
  }
  if (peril && clock >= perilEnd(peril) && peril.kind !== "fall" && peril.kind !== "tub") delete run.peril;
  if (run.trapped) return rescue(h, level, solid);
  const here = pos.y * w + pos.x;
  if (!run.peril) {
    const year = h.world.pack.setting?.year ?? 1900;
    const slot = Math.floor(clock / 120);
    if (h.busy() || clock < (run.calm ?? 0) || slot === run.rolled) return;
    run.rolled = slot;
    const rng = rngOf(h.state.manifest.seed, "peril-roll", level.space, slot);
    if (rng() >= hazard(level, year)) return;
    const coal = level.kind === "coal", options: [PerilKind, number][] = [
      ["fall", level.depth === 3 ? 5 : 3], ["tub", level.depth === 1 ? 6 : level.depth === 2 ? 3 : 0],
      ["afterdamp", coal && level.depth === 2 && year >= 1700 ? 1 : 0], ["inrush", level.depth === 2 ? 1 : 0],
    ];
    let roll = rng() * options.reduce((n, o) => n + o[1], 0);
    const kind = options.find((o) => (roll -= o[1]) < 0)?.[0] ?? "fall";
    if (perilStart(h, kind, level, solid) || perilStart(h, "fall", level, solid)) run.calm = clock + 900;
    return;
  }
  const p = run.peril!;
  if (p.kind === "fall") {
    if (clock < p.start + FALL_WARN) return;
    delete run.peril;
    const c = p.cells[0], cx = c % w, cy = (c - cx) / w, size = p.size ?? 2;
    const fallen = p.cells.slice(1).filter((i) => Math.hypot((i % w) - cx, Math.floor(i / w) - cy) <= size - 0.6);
    const falls = ((h.state.mineFalls ??= {})[level.space] ??= []);
    for (const i of fallen) {
      if (falls.includes(i)) continue;
      falls.push(i);
      solid.add(i);
      h.unblock(level.space, i % w, Math.floor(i / w));
    }
    const d = Math.hypot(pos.x - cx, pos.y - cy);
    if (fallen.includes(here)) {
      const free = perilField(level, here, new Set(fallen.filter((i) => i !== here)));
      let out = -1;
      for (let i = 0; i < free.length; i++) if (free[i] > 0 && !solid.has(i) && (out < 0 || free[i] < free[out])) out = i;
      if (out >= 0) pos.x = out % w, pos.y = Math.floor(out / w);
      h.hurt(38, "a fall of roof", "crushed leg");
      h.event("The roof comes down on you in a roar of stone and dust. You drag yourself out from under it, your leg on fire.", "world");
      h.remember("The roof came down on you.");
    } else if (d <= size + 0.6) {
      h.hurt(10, "falling stone", "cut scalp");
      h.event("The roof comes down beside you with a roar, and a stone the size of a fist opens your scalp. Blood runs into your eyes, but you are clear.", "world");
      h.remember("The roof came down beside you, and a stone cut your head open.");
    } else if (p.near) {
      h.event("Behind you the roof comes down with a roar that you feel in your teeth. The dust rolls past, and then it is quiet. That was close.", "world");
      h.remember("You outran a fall of roof.");
    } else h.event("Somewhere close the roof comes down with a long roar, and the dust rolls through.", "world");
    if (!h.state.player.dead) trapCheck(h, level, solid);
    return;
  }
  if (p.kind === "tub") {
    const now = Math.min(p.cells.length - 1, Math.floor((clock - p.start) / TUB_CELL));
    for (let k = (p.last ?? -1) + 1; k <= now && p.hit === undefined; k++)
      if (p.cells[k] === here) {
        p.hit = k;
        h.hurt(28, "a runaway tub", "cracked ribs");
        h.event("The tub hits you square and throws you against the side like a rag. You lie there, trying to breathe round your ribs.", "world");
        h.remember("A runaway tub hit you.");
      }
    p.last = now;
    if (clock < perilEnd(p)) return;
    delete run.peril;
    if (p.hit !== undefined) return;
    h.event(p.near
      ? "It thunders past an arm's length away and jumps the rails at the end of the road with a crash of coal. Your heart is going like a hammer."
      : "Down the road the runaway jumps the rails with a crash, and the men start shouting for the deputy.", "world");
    if (p.near) h.remember("A runaway tub missed you by an arm's length.");
    return;
  }
  const reach = perilReach(p, clock), dist = perilField(level, p.cells[0], solid);
  const at = dist[here];
  if (at < 0 || at > reach) return;
  const since = clock - (p.hit ?? -1e9);
  if (p.kind === "afterdamp") {
    if ((h.state.player.inventory["self-rescuer"] ?? 0) > 0) {
      if (p.hit === undefined) h.event("The air goes thick and sweet. You bite on the mouthpiece of your self-rescuer, and the air through it comes hot but breathable. Get to the shaft.", "world");
      p.hit = clock;
      return;
    }
    if (since < 12) return;
    if (p.hit === undefined) {
      h.event("The air goes thick and sweet and your legs turn to water. Afterdamp. Keep moving, keep low, get to the shaft.", "world");
      h.remember("You breathed afterdamp after the explosion.");
    }
    p.hit = clock;
    h.hurt(7, "afterdamp");
    return;
  }
  if (clock - p.start > FLOOD_SPRAY + FLOOD_REACH / FLOOD_SPEED || since < 10) return;
  if (p.hit === undefined) {
    h.hurt(14, "an inrush of water");
    h.event("The water hits you at the knees, then the waist, black and freezing, and nearly takes your feet. Keep going!", "world");
    h.remember("You were caught in an inrush of water.");
  } else h.hurt(5, "an inrush of water");
  p.hit = clock;
}

/** After a fall: shut in, with no way back to a ladder or the cage. */
function trapCheck(h: SewerHost, level: SewerLevel, solid: Set<number>) {
  const pos = h.state.player.pos, run = h.state.sewer!;
  const dist = perilField(level, pos.y * level.w + pos.x, solid);
  if (exits(level).some((i) => dist[i] >= 0)) return;
  const clock = h.state.clock;
  const hours = 1.5 + rngOf(h.state.manifest.seed, "rescue", level.space, clock)() * 2.5;
  run.trapped = { since: clock, rescue: clock + Math.round(hours * 3600) };
  h.event("The dust settles. You hold up your light. The road back is gone, packed solid with fallen stone from floor to roof. You are shut in. Up top they will know: your check is still on the board. Knock on the rails so they know where to dig.", "world");
  h.remember("A fall shut you in.");
}

/** Knocking on the rails: the rescuers hear where to dig and come faster. */
export function knock(h: SewerHost) {
  const run = h.state.sewer;
  const t = run?.trapped;
  if (!t) return;
  h.advance(600);
  if (!run.trapped) return;
  t.knocks = (t.knocks ?? 0) + 1;
  t.rescue = Math.max(h.state.clock + 120, t.rescue - 900);
  const left = t.rescue - h.state.clock;
  h.event(left < 1200 ? "You knock, and picks answer you, close now, and a voice through the stone: “Hold on, we’re nearly through!”"
    : t.knocks === 1 ? "You knock three times on the rail and listen. Nothing. Then, very faint, three knocks come back. They know you are here."
      : "You knock again. The answering knocks are closer, and you can hear picks.", "world");
}

function rescue(h: SewerHost, level: SewerLevel, solid: Set<number>) {
  const run = h.state.sewer!, t = run.trapped!;
  if (h.state.clock < t.rescue) return;
  delete run.trapped;
  for (const i of h.state.mineFalls?.[level.space] ?? []) {
    solid.delete(i);
    h.unblock(level.space, i % level.w, Math.floor(i / level.w));
  }
  delete h.state.mineFalls![level.space];
  const year = h.world.pack.setting?.year ?? 1900;
  h.state.player.health = Math.min(100, (h.state.player.health ?? 100) + 10);
  const hours = Math.max(1, Math.round((h.state.clock - t.since) / 3600));
  h.event(`A pick breaks through, then lamps, then hands. ${year >= 1910 ? "The rescue team, in breathing sets," : "The deputy and a dozen men from the next district"} clear the gap and pull you out into the road. Someone gives you water. You were shut in ${hours === 1 ? "an hour" : `${hours} hours`}.`, "world");
  h.remember(`You were dug out after ${hours === 1 ? "an hour" : `${hours} hours`} shut in.`);
}
