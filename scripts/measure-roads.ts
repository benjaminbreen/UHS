import { readFile, writeFile } from "node:fs/promises";
import { createSettingSession } from "../src/runtime/session";
import type { SettlementWorld } from "../src/world/v3/generate";
const base = JSON.parse(
  await readFile("artifacts/roads/after.json", "utf8"),
).setting;
const results = [];
for (const revision of [undefined, 1] as const) {
  const start = performance.now();
  const s = await createSettingSession(
    { ...base, roadRevision: revision },
    "road-review",
  );
  const w = s.world as SettlementWorld,
    p = w.planAt(w.spawn.x, w.spawn.y)!;
  results.push({
    revision: revision ?? "previous",
    ms: performance.now() - start,
    households: p.places.length,
    roads: p.roads.length,
    points: p.roads.reduce((n, r) => n + r.points.length, 0),
    localSetting: p.site.pack?.setting,
    types: p.roads.map((r) => ({ id: r.id, points: r.points.length })),
  });
}
await writeFile(
  "artifacts/roads/comparison.json",
  JSON.stringify(results, null, 2),
);
console.log(results.map(({ types, localSetting, ...r }) => r));
