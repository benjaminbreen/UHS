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
  // TOWN_DISTRICTS: the whole map as a land-use plan, without the ground raster.
  const districts = !!process.env.TOWN_DISTRICTS;
  // TOWN_AT=dx,dy looks that many cells off the centre: a suburb, the docks.
  const [ox, oy] = (process.env.TOWN_AT ?? "0,0").split(",").map(Number);
  const cx = districts ? 0 : Math.round(at.x) + ox,
    cy = districts ? 0 : Math.round(at.y) + oy;
  const R = districts ? 192 : radius ?? 40;
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
      // Overlapping sites: the cell's role is whichever plan gave it one.
      let role = p?.pavement?.get(`${x},${y}`);
      if (!role) for (const q of plans) if ((role = q.pavement?.get(`${x},${y}`))) break;
      if (role) groundRoles[`${x},${y}`] = role;
      const cell = sample(x, y);
      if (districts) {
        const green = role === "park" || role === "garden" || (role === "verge" && cell?.feature !== "paving");
        ground[(y - cy + R) * (2 * R + 1) + x - cx + R] = cell?.surface === "water" ? 7 : role === "rail" || role === "platform" ? 6
          : green ? 3 : role === "square" || role === "dais" || role === "court" ? 5 : role === "footway" || role === "verge" ? 2
          : cell?.feature === "paving" && !role ? 1 : role === "yard" || role === "apron" ? 4 : cell?.field ? 8 : 0;
        continue;
      }
      const tile = paintedGround(cell) ? rasterHabitatTile(sample, x, y, 0, 0) : rasterWaterTile(sample, x, y, 0, 0);
      if (!tile) continue;
      for (let row = 0; row < 16; row++)
        ground.set(tile.pixels.subarray(row * 64, row * 64 + 64), (((y - cy + R) * 16 + row) * side + (x - cx + R) * 16) * 4);
    }
  writeFileSync(`artifacts/towns/${name}.${districts ? "roles" : "ground"}`, districts ? ground.subarray(0, (2 * R + 1) ** 2) : ground);
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
      ...(districts && {
        precincts: [...plans].flatMap(p => p.plots).filter(q => q.precinct && near(q)),
        curtains: [...plans].flatMap(p => p.enclosures).filter(e => e.gates?.length)
          .flatMap(e => e.parts.filter((p: { frame: string; x: number; y: number }) => p.frame.startsWith("wall-") && near(p))),
      }),
      // The main square first: `compose.py --square` crops to it.
      squares: [...plans].flatMap((p) => p.plots).filter((q: any) => /-square-\d+$/.test(q.id) && near(q))
        .map((q: any) => ({ x: q.x, y: q.y, w: q.w, h: q.h })),
      places: [...plans].flatMap((p) => p.places)
        .filter(near)
        .map((b: any) => ({
          sprite: b.sprite,
          use: b.landUse,
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
