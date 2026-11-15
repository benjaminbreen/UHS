/** Dump generated settlements for scripts/town-sheet/compose.py. No browser.
 *
 *   npx tsx scripts/town-sheet/dump.ts [name ...]     # default: the whole panel
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolveSetting } from "../../src/content/geography/resolve";
import { createSettingSession } from "../../src/runtime/session";
import { rasterHabitatTile } from "../../src/render/habitat-raster";
import { rasterWaterTile } from "../../src/render/water-raster";
import { paintedGround } from "../../src/render/material-edges";
import panel from "./panel.json" with { type: "json" };

const want = process.argv.slice(2);
mkdirSync("artifacts/towns", { recursive: true });
for (const { name, query, seed, radius, settlementLayout, centre } of panel as any[]) {
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
  // "centre": "square" looks at the middle of the largest town near the
  // player, who mostly starts outside it.
  const from = e.state.player.pos;
  let at = from;
  if (centre === "square" || process.env.TOWN_CENTRE === "square") {
    let best = 0;
    for (let dy = -240; dy <= 240; dy += 12)
      for (let dx = -240; dx <= 240; dx += 12) {
        const site = e.world.planAt(Math.round(from.x) + dx, Math.round(from.y) + dy)?.site;
        if (site && site.profile.radius > best) [best, at] = [site.profile.radius, site.center];
      }
  }
  const cx = Math.round(at.x),
    cy = Math.round(at.y);
  const R = radius ?? 40;
  // A city can be several sites (its quarters), each with its own plan.
  const plans = new Set<any>();
  const groundRoles: Record<string, string> = {};
  // The game's own ground raster, laid flat: streets, kerbs, yards and fences
  // as the player sees them, without the terrain's height.
  const side = (2 * R + 1) * 16;
  const ground = new Uint8Array(side * side * 4);
  const sample = (x: number, y: number) => e.world.topography(x, y);
  for (let y = cy - R; y <= cy + R; y++)
    for (let x = cx - R; x <= cx + R; x++) {
      const p = e.world.planAt(x, y);
      if (p) plans.add(p);
      const role = p?.pavement?.get(`${x},${y}`);
      if (role) groundRoles[`${x},${y}`] = role;
      const cell = sample(x, y);
      const tile = paintedGround(cell) ? rasterHabitatTile(sample, x, y, 0, 0) : rasterWaterTile(sample, x, y, 0, 0);
      if (!tile) continue;
      for (let row = 0; row < 16; row++)
        ground.set(tile.pixels.subarray(row * 64, row * 64 + 64), (((y - cy + R) * 16 + row) * side + (x - cx + R) * 16) * 4);
    }
  writeFileSync(`artifacts/towns/${name}.ground`, ground);
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
      groundRoles,
      places: [...plans].flatMap((p) => p.places)
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
  console.log(name, setting.location, setting.year, "places", [...plans].reduce((n, p) => n + p.places.length, 0));
}
