/** Dump generated settlements for scripts/town-sheet/compose.py. No browser.
 *
 *   npx tsx scripts/town-sheet/dump.ts [name ...]     # default: the whole panel
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolveSetting } from "../../src/content/geography/resolve";
import { createSettingSession } from "../../src/runtime/session";
import panel from "./panel.json";

const want = process.argv.slice(2);
mkdirSync("artifacts/towns", { recursive: true });
for (const { name, query, seed, radius, settlementLayout } of panel as any[]) {
  if (want.length && !want.includes(name)) continue;
  const r = resolveSetting(query) as any;
  if (r.error) {
    console.error(name, r.error);
    continue;
  }
  const setting = settlementLayout
    ? { ...r.setting, settlementLayout }
    : r.setting;
  const e = createSettingSession(setting, seed ?? "panel") as any;
  const cx = Math.round(e.state.player.pos.x),
    cy = Math.round(e.state.player.pos.y);
  const p = e.world.planAt(cx, cy) ?? e.world.planAt(0, 0);
  const R = radius ?? 40;
  const surface: Record<string, string> = {};
  for (let y = cy - R; y <= cy + R; y++)
    for (let x = cx - R; x <= cx + R; x++) {
      const k = `${x},${y}`,
        t = p.surface.get(k);
      if (t) surface[k] = t === "paving" && !p.traffic.has(k) ? `kerb` : t;
    }
  const fields: Record<string, unknown> = {};
  for (const [k, f] of p.fields ?? []) {
    const [x, y] = k.split(",").map(Number);
    if (Math.abs(x - cx) <= R && Math.abs(y - cy) <= R)
      fields[k] = { crop: f.crop, fence: f.fence, boundary: f.boundary };
  }
  const near = (o: { x: number; y: number }) =>
    Math.abs(o.x - cx) <= R + 8 && Math.abs(o.y - cy) <= R + 8;
  writeFileSync(
    `artifacts/towns/${name}.json`,
    JSON.stringify({
      name,
      label: `${setting.location}, ${setting.year}`,
      cx,
      cy,
      R,
      surface,
      fields,
      places: p.places
        .filter(near)
        .map((b: any) => ({
          sprite: b.sprite,
          x: b.x,
          y: b.y,
          w: b.w,
          h: b.h,
        })),
      objects: e.state.objects
        .filter((o: any) => o.pos.space === "outside" && near(o.pos))
        .map((o: any) => ({
          id: o.id,
          prop: o.prop,
          sprite: o.sprite,
          kind: o.kind,
          x: o.pos.x,
          y: o.pos.y,
        })),
      actors: e.state.actors
        .filter((a: any) => a.pos.space === "outside" && near(a.pos))
        .map((a: any) => ({
          kind: a.kind,
          sprite: a.sprite,
          x: Math.round(a.pos.x),
          y: Math.round(a.pos.y),
        })),
    }),
  );
  console.log(name, setting.location, setting.year, "places", p.places.length);
}
