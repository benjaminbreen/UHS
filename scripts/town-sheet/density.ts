/** How built-up a generated city is, over the whole playable map. No browser.
 *
 *   npx tsx scripts/town-sheet/density.ts "New York 1930" "Chicago 1950"
 *
 * One line per setting: sites, the home site's radius, buildings, those of
 * three storeys or more, towers, strip-kit shops, and the commonest
 * building families.
 */
import { resolveSetting } from "../../src/content/geography/resolve";
import { createSettingSession } from "../../src/runtime/session";
import { towerStyleFor } from "../../src/content/towers";
import { buildingModels } from "../../src/content/graphics/models";

for (const q of process.argv.slice(2)) {
  const r = resolveSetting(q) as any;
  if (r.error) { console.log(q, r.error); continue; }
  const e = createSettingSession(r.setting, "panel") as any;
  const from = e.state.player.pos, plans = new Set<any>();
  for (let dy = -192; dy <= 192; dy += 4)
    for (let dx = -192; dx <= 192; dx += 4) {
      const x = Math.round(from.x) + dx, y = Math.round(from.y) + dy;
      const p = e.world.planAt(x, y);
      if (p) plans.add(p);
    }
  let n = 0, tower = 0, strip = 0, tall = 0, home: any;
  const families: Record<string, number> = {};
  for (const p of plans) {
    if (!home || p.site.profile.radius > home.site.profile.radius) home = p;
    for (const b of p.places) {
      const f: string = b.sprite ?? "", m = buildingModels[f] as any;
      if (!m || b.claim?.startsWith("yard")) continue;
      n++;
      if (towerStyleFor(f)) tower++;
      if (f.startsWith("candidate-")) strip++;
      // The anchor is the wall's foot in sprite pixels: over 200 is three storeys.
      if (m.anchor[1] > 200) tall++;
      const k = f.replace(/-(north|east|west)$/, "").replace(/-urban.*$/, "").replace(/-\d+$/, "").replace(/^candidate-modern-.*/, "strip-kit");
      families[k] = (families[k] ?? 0) + 1;
    }
  }
  const top = Object.entries(families).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}:${v}`).join(" ");
  console.log(`${q.padEnd(18)} sites ${String(plans.size).padStart(2)} homeR ${home?.site.profile.radius} bld ${String(n).padStart(4)} tall ${String(tall).padStart(4)} towers ${String(tower).padStart(3)} strip ${String(strip).padStart(3)} | ${top}`);
}
