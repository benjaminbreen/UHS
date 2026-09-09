import { createSettingSession } from "../src/runtime/session";
import { resolveSetting } from "../src/content/geography/resolve";
import { itineraryAt } from "../src/core/itinerary";
(globalThis as Record<string, unknown>).__routineDebug = true;
const prompt = process.argv[2] ?? "A traveler in Rome, 100 CE";
const resolved = resolveSetting(prompt, "crowd-check");
if ("error" in resolved) throw Error(resolved.error);
const e = createSettingSession(resolved.setting, "crowd-check");
const humans = e.state.actors.filter((a) => a.kind === "human");
let passes = 0;
const began = performance.now();
for (; passes < 120; passes++) {
  let done = true;
  for (const a of humans) if (!e.world.itinerary?.(a.id)) done = false;
  if (done) break;
  const until = performance.now() + 105;
  while (performance.now() < until);
}
console.log(
  `  build: ${passes} passes, ${Math.round(performance.now() - began)}ms`,
);
const routed = humans.filter((a) => e.world.itinerary?.(a.id));
const missing = humans.filter((a) => !e.world.itinerary?.(a.id));
const why = new Map<string, number>();
for (const a of missing.slice(0, 400)) {
  const m = /^s(-?\d+)_(-?\d+)/.exec(a.id);
  const tag = !m ? "no site id" : "stations failed";
  why.set(tag, (why.get(tag) ?? 0) + 1);
}
console.log("  unrouted:", [...why].map(([k, n]) => `${k} x${n}`).join(", "));
console.log("  unrouted sample:", missing.slice(0, 4).map((a) => `${a.id} (${a.role})`).join(" | "));
const home = e.state.player.pos;
console.log(`${prompt}: ${humans.length} humans, ${routed.length} routed`);
const labels = new Map<string, number>();
for (const a of routed)
  for (const seg of e.world.itinerary!(a.id)!.segments)
    if (!seg.path) labels.set(seg.label, (labels.get(seg.label) ?? 0) + 1);
console.log(
  "  stations:",
  [...labels]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 12)
    .map(([l, n]) => `${l} x${n}`)
    .join(" | "),
);
for (const hour of [8, 12, 17, 21]) {
  const at = routed.map((a) => itineraryAt(e.world.itinerary!(a.id)!, hour * 3600));
  const walking = at.filter((s) => s.moving).length;
  const tiles = new Map<string, number>();
  for (const s of at) {
    const k = `${Math.round(s.x)},${Math.round(s.y)}`;
    tiles.set(k, (tiles.get(k) ?? 0) + 1);
  }
  const piles = [...tiles.values()];
  const outside = at.filter(
    (s) => Math.hypot(s.x - home.x, s.y - home.y) > 60,
  ).length;
  console.log(
    `  ${String(hour).padStart(2)}:00 walking ${String(walking).padStart(2)}/${routed.length}` +
      `  biggest pile ${Math.max(0, ...piles)}` +
      `  >60 tiles from centre ${outside}`,
  );
}
