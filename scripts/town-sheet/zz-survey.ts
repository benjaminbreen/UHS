import { appendFileSync } from "node:fs";
import { resolveSetting } from "../../src/content/geography/resolve";
import { createSettingSession } from "../../src/runtime/session";
import { buildingModels } from "../../src/content/graphics/models";
const out = process.argv[2];
for (const q of process.argv.slice(3)) {
  try {
    const r = resolveSetting(q) as any;
    if (r.error) { appendFileSync(out, JSON.stringify({ q, error: r.error }) + "\n"); continue; }
    const t0 = Date.now();
    const e = createSettingSession(r.setting, "panel") as any;
    const plans = new Map<string, any>();
    for (let y = -184; y <= 184; y += 8) for (let x = -184; x <= 184; x += 8) { const p = e.world.planAt(x, y); if (p) plans.set(p.site.id, p); }
    const best = [...plans.values()].sort((a, b) => b.places.length - a.places.length)[0];
    if (!best) { appendFileSync(out, JSON.stringify({ q, error: "no plan" }) + "\n"); continue; }
    const fam: Record<string, number> = {}, use: Record<string, number> = {};
    let oblique = 0;
    for (const b of best.places) {
      const f = b.sprite.replace(/-(north|east|west)$/, "").replace(/-urban-[a-z]+$/, "").replace(/(-(small|medium|large|corner-[ew]))?-\d+$/, "");
      fam[f] = (fam[f] ?? 0) + 1;
      use[b.landUse ?? "-"] = (use[b.landUse ?? "-"] ?? 0) + 1;
      if ((buildingModels[b.sprite] as any)?.oblique) oblique++;
    }
    const s = r.setting;
    appendFileSync(out, JSON.stringify({ q, place: s.placeId, settlement: s.settlement, culture: s.culture, arch: s.architecture, pop: s.population,
      site: best.site.id.split("~")[1], radius: best.site.profile.radius, places: best.places.length, oblique, sites: plans.size, ms: Date.now() - t0, use,
      fam: Object.fromEntries(Object.entries(fam).sort((a, b) => b[1] - a[1]).slice(0, 14)) }) + "\n");
  } catch (err) {
    appendFileSync(out, JSON.stringify({ q, crash: String(err).slice(0, 200) }) + "\n");
  }
}
