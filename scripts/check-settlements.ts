import { createSettingSession } from "../src/runtime/session";
import { resolveSetting } from "../src/content/geography/resolve";
import type { SettlementWorld } from "../src/world/v3/generate";
for (const query of [
  "medieval Normandy",
  "Renaissance Florence weaver",
  "Hellenistic Alexandria",
  "Neolithic Anatolia",
  "19th century Haiti farmer",
  "paleolithic shaman Siberia",
]) {
  const s = resolveSetting(query);
  if ("error" in s) throw Error(s.error);
  const t = performance.now(),
    e = createSettingSession(s.setting, "settlements"),
    w = e.world as SettlementWorld,
    p = w.planAt(w.spawn.x, w.spawn.y)!;
  const bad = [
    ...p.places.map((b) => ({ name: b.id, p: b.entrance })),
    ...p.work.entries(),
  ]
    .map((v) => (Array.isArray(v) ? { name: v[0], p: v[1].work } : v))
    .filter((v) => e.findRoute(e.state.player.pos, v.p).status !== "found");
  console.log(
    JSON.stringify({
      query,
      ms: Math.round(performance.now() - t),
      pattern: p.site.profile.pattern,
      buildings: p.places.length,
      roads: p.roads.length,
      fields: p.plots.filter((p) => p.kind === "field").length,
      pens: p.enclosures.length,
      diagnostics: p.diagnostics,
      bad: bad.map((b) => b.name),
    }),
  );
}
