/** Routine-building benchmark: how long residents' daily routes take to search
 * in a city, and how many stops they lose to failed searches.
 * Usage: tsx scripts/routine-benchmark.ts [place=london] [year=1850] [seed]
 *   --unboxed   re-run each failed bounded search unbounded, to count stops a
 *               wider search would have reached (slow)
 *   --order     build a second session asking for residents in reverse order
 *               and report any routine that differs
 * Routine count per part is the generator's ROUTINE_BUDGET. */
import { registerHooks } from "node:module";

type Status = "found" | "unreachable" | "budget";
const stats = {
  calls: 0,
  ms: 0,
  visited: 0,
  status: { found: 0, unreachable: 0, budget: 0 } as Record<Status, number>,
  failedBoxed: 0,
  reachableUnboxed: 0,
};
(globalThis as Record<string, unknown>).__routeBench = stats;
const flags = process.argv.slice(2).filter((a) => a.startsWith("--"));
const [place = "london", year = "1850", seed = "routine-bench"] = process.argv
  .slice(2)
  .filter((a) => !a.startsWith("--"));
const unboxed = flags.includes("--unboxed");

// Every importer of core/routing gets a wrapper that times the real `route`.
const real = new URL("../src/core/routing.ts", import.meta.url).href;
const wrapper =
  "data:text/javascript," +
  encodeURIComponent(`import { route as real } from ${JSON.stringify(real + "?real")};
const s = globalThis.__routeBench, unboxed = ${unboxed};
export function route(start, goal, cost, options = {}) {
  const t = performance.now(), r = real(start, goal, cost, options);
  s.ms += performance.now() - t; s.calls++; s.visited += r.visited; s.status[r.status]++;
  if (unboxed && r.status !== "found" && options.bounds) {
    s.failedBoxed++;
    const wide = real(start, goal, cost, { ...options, bounds: undefined, maxNodes: 400000 });
    if (wide.status === "found") s.reachableUnboxed++;
  }
  return r;
}`);
registerHooks({
  resolve(spec, ctx, next) {
    const out = next(spec, ctx);
    return out.url === real ? { ...out, url: wrapper, shortCircuit: true } : out;
  },
});

const { createSettingSession } = await import("../src/runtime/session");
const { panelSetting } = await import("./review/panel");

const snap = () => ({ ...stats, status: { ...stats.status } });
const pct = (xs: number[], p: number) =>
  xs.length ? [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * p))] : 0;
const ms = (x: number) => `${x.toFixed(1)} ms`;

function build(reverse: boolean) {
  const setting = { ...panelSetting(place, +year), settlement: "city" } as ReturnType<typeof panelSetting>;
  const before = snap();
  const t0 = performance.now();
  const engine = createSettingSession(setting, seed);
  const createMs = performance.now() - t0;
  const world = engine.world as typeof engine.world & { planAt(x: number, y: number): any };
  const site = world.settlements?.find((s) => s.id.endsWith(`~${place}`));
  if (!site) throw Error(`No generated settlement for ${place}`);
  const plan = world.planAt(site.x, site.y);
  const warm = { ms: createMs, searches: stats.calls - before.calls, searchMs: stats.ms - before.ms };
  const humans = [...plan.stations.keys()] as string[];
  // A part is the middle home of each eighth of the residents taken by angle
  // round the centre, so the eight windows of residents barely overlap.
  const c = plan.site.center as { x: number; y: number };
  const homes = humans
    .map((id: string) => world.activitySites?.(id)?.home)
    .filter((p): p is { x: number; y: number } => !!p)
    .sort((p, q) => Math.atan2(p.y - c.y, p.x - c.x) - Math.atan2(q.y - c.y, q.x - c.x));
  const parts = Array.from({ length: 8 }, (_, i) => homes[Math.floor(((i + 0.5) * homes.length) / 8)]);
  if (reverse) parts.reverse();
  const times: number[] = [];
  const drops0 = plan.diagnostics.routineDrops ?? 0;
  const s0 = snap();
  const routines = new Map<string, string>();
  let jumps = 0, blocked = 0, footway = 0, lane = 0;
  for (const p of parts) {
    world.focusRoutines?.(p.x, p.y, engine.state.clock);
    for (const id of reverse ? [...humans].reverse() : humans) {
      const n = stats.calls,
        t = performance.now();
      const it = world.itinerary?.(id);
      if (stats.calls > n) times.push(performance.now() - t);
      if (it) routines.set(id, JSON.stringify(it));
      for (const seg of it?.segments ?? [])
        (seg.path ?? []).forEach((q, i, path) => {
          const p = path[i - 1];
          if (p && Math.abs(p.x - q.x) + Math.abs(p.y - q.y) !== 1) jumps++;
          if (world.blocked(q.x, q.y, "outside") && world.terrain(q.x, q.y, "outside") !== "water") blocked++;
          const role = plan.pavement?.get(`${q.x},${q.y}`);
          if (role === "footway") footway++;
          else if (plan.lanes?.has(`${q.x},${q.y}`)) lane++;
        });
    }
  }
  return {
    warm,
    humans: humans.length,
    times,
    jumps,
    blocked,
    footway: footway / Math.max(1, footway + lane),
    drops: (plan.diagnostics.routineDrops ?? 0) - drops0,
    searches: { calls: stats.calls - s0.calls, ms: stats.ms - s0.ms, visited: stats.visited - s0.visited,
      found: stats.status.found - s0.status.found,
      unreachable: stats.status.unreachable - s0.status.unreachable,
      budget: stats.status.budget - s0.status.budget },
    routines,
  };
}

const a = build(false);
const total = a.times.reduce((s, x) => s + x, 0);
console.log(`${place} ${year} seed ${seed}: ${a.humans} residents in the city`);
console.log(`cold start: session ${ms(a.warm.ms)}, ${a.warm.searches} searches in ${ms(a.warm.searchMs)}`);
console.log(`eight parts: ${a.times.length} routines built, ${ms(total)} in all`);
console.log(`  per routine: mean ${ms(total / Math.max(1, a.times.length))}, median ${ms(pct(a.times, 0.5))}, slowest 1% ${ms(pct(a.times, 0.99))}`);
console.log(`  searches: ${a.searches.calls} (found ${a.searches.found}, unreachable ${a.searches.unreachable}, budget ${a.searches.budget}), ${ms(a.searches.ms)} = ${((100 * a.searches.ms) / Math.max(1, total)).toFixed(0)}% of build time, ${(a.searches.visited / Math.max(1, a.times.length) / 1000).toFixed(1)}k cells visited per routine`);
console.log(`  stops dropped: ${a.drops}; steps that jump ${a.jumps}, onto blocked cells ${a.blocked}; ${(100 * a.footway).toFixed(0)}% of street steps on the footway rather than the carriageway`);
if (unboxed) console.log(`  failed bounded searches: ${stats.failedBoxed}, reachable unbounded: ${stats.reachableUnboxed}`);
if (flags.includes("--order")) {
  const b = build(true);
  let differ = 0;
  for (const [id, it] of a.routines) if (b.routines.has(id) && b.routines.get(id) !== it) differ++;
  const shared = [...a.routines.keys()].filter((id) => b.routines.has(id)).length;
  console.log(`order check: ${shared} routines in both runs, ${differ} differ`);
}
