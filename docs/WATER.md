# Water

Where water comes from, how regional water (deltas, ice, reefs, tides) is
chosen, and the two renderers that draw it. Entry files:
`src/world/v3/environment.ts` (geometry), `src/content/geography/waterscapes.ts`
(regional water), `src/render/living-water/` (the default renderer),
`src/core/water-field.ts` (`waterDepthAt`).

## Geometry

New worlds use `hydrologyRevision: 3`: `nativeWater` in `v3/environment.ts`
follows the Earth atlas's coasts and rivers at the map's real coordinates,
warped into meanders, coves and bars. `boundaryWater` (`boundary-water.ts`)
matches water across map edges, and `wet-features.ts` supplies small marsh
basins; streams come from
`features.ts` and `tributaries.ts` (see [TERRAIN.md](TERRAIN.md)).

Gameplay reads shallow/deep from the cell (`TopographyCell.waterDepth`);
`waterDepthAt` resolves it with season and tide, so ice and bare tidal mud are
walkable only while they are drawn.

## Regional water

`waterscape()` in `src/content/geography/waterscapes.ts` reads lon/lat, year
and season into a `Waterscape`. Region boxes are broad and editable in that
file; nothing is saved.

- **Deltas and floods.** Delta places get distributaries; flood stage follows
  each river's regime by season (the Aswan dams end the Nile's). Flooded
  valley floor is wadable; `nile-flood-basins` fields stand under it.
- **Tint.** Silt, loess and clear karst water override the ecology palette.
- **Ice.** Cold winters freeze lakes and rivers; subpolar coasts add shore-fast
  ice, polar ones floes; glacier coasts carry icebergs.
- **Reefs.** Atolls and tropical reef coasts get lagoons, crests and coral heads.
- **Tides.** `tideAt` runs a 12.42-hour cycle in three steps; the intertidal
  shelf scales with tidal range and is bare mud at low water.
- **Works.** Polder ditches and dikes, chinampas in the Valley of Mexico,
  qanat shaft lines.

The engine calls `world.setSeason(season, tideAt(...))` on every advance; a
change of season or tide step restyles the terrain stream.

## Rendering

- **Living water (default).** `WorldScene` sets `waterRenderer ??= "living"`.
  `src/render/living-water/` draws WebGL colour forms, caustics, waves and
  foam over worker-prepared shoreline and rock-displacement textures
  (`game.ts`, `mask.ts`, `coast.ts`, `banks.ts`, `polish.ts`, `shader.ts`).
  Tuned values are in `living-water/defaults.json`, shared with the lab.
  Palette by ecology is in `living-water/profile.ts`. Decorative water rocks,
  reeds and weed are cosmetic, with no collision.
- **Legacy CPU raster (fallback).** `water-raster.ts`, `water-motifs.ts` and
  `water.ts` draw water when the renderer is Canvas or
  `waterRenderer: "legacy"`. `terrain-worker.ts` still calls `rasterWaterTile`.
- `src/render/water-style.ts` holds the ecology water palettes. It also
  exports `waterHash` and `waterNoise`, which dozens of unrelated rasters
  use as generic noise. That is a misplaced utility; move it to a neutral
  module when you next touch it.

## Where to extend

Regional water goes in `waterscapes.ts`. New water drawing goes in
`living-water/`. Do not add a third renderer.

## Legacy, do not extend

Retiring these is welcome; there are no saves to preserve:

- `hydrologyRevision` 1 and 2 branches (`mainWater`, the rev-2 swamp, rev <3 marsh basins).
- The legacy CPU water path, once a Canvas fallback is decided.

## Lab and checks

- `/water-experiments` tunes living water and exports JSON; `?context=map`
  embeds a real map, `?context=coast` starts on a coast.
- `npm run capture:terrain -- waters` shoots the waterscapes in season pairs.
- Tests: `water-rendering`, `living-water`, `water-crossings`, `terrain-banks`.
