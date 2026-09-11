/** Emit every backbone map and the name it currently resolves to.
 * Step one of `npm run prepare:backbone-names`. */
import { writeFileSync, mkdirSync } from "node:fs";
import {
  mapForCoordinate,
  permanentMap,
} from "../src/world/travel/network";

const ids = new Set<string>();
for (let lat = -84; lat <= 84; lat += 1.5)
  for (let lon = -180; lon < 180; lon += 1.5) {
    const id = mapForCoordinate({ lon, lat });
    if (!id.startsWith("sea:")) ids.add(id);
  }
const rows = [...ids].sort().map((id) => {
  const m = permanentMap(id, 1400);
  // The raw geographic resolution, not m.name: that already carries a previous
  // run's override, which would make a rebuild read its own output.
  return { id, lon: m.lon, lat: m.lat, name: m.naming.name };
});
const counts = new Map<string, number>();
for (const r of rows) counts.set(r.name, (counts.get(r.name) ?? 0) + 1);
const out = rows.map((r) => ({ ...r, shared: counts.get(r.name)! > 1 }));
mkdirSync("scripts/source-cache", { recursive: true });
writeFileSync(
  "scripts/source-cache/backbone-anchors.json",
  JSON.stringify(out, null, 1),
);
console.log(
  `${out.length} backbone maps, ${out.filter((r) => r.shared).length} sharing a name`,
);
