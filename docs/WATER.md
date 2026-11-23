# Water

Where water comes from, how regional water (deltas, ice, reefs, tides) is
chosen, and the two renderers that draw it. Entry files:
`src/world/v3/environment.ts` (geometry), `src/content/geography/waterscapes.ts`
(regional water), `src/render/living-water/` (the default renderer),
`src/core/water-field.ts` (`waterDepthAt`).

## Geometry

`nativeWater` in `v3/environment.ts` follows the Earth atlas's coasts and
rivers at the map's real coordinates, warped into meanders, coves and bars.
`boundaryWater` (`boundary-water.ts`) matches water across map edges, and
`wet-features.ts` shapes river banks; streams come from
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
  ice, polar ones floes; glacier coasts carry icebergs. `Waterscape.frost`
  (0 to 1) says how hard: a mild temperate winter (0.36, or 0.5 in the Little
  Ice Age) skins still water and leaves rivers a shelf along each bank with
  an open channel; boreal and polar winters (0.75 and up) bear nearly
  everywhere. See "Ice underfoot" below.
- **Reefs.** Atolls and tropical reef coasts get lagoons, crests and coral heads.
- **Tides.** `tideAt` runs a 12.42-hour cycle in three steps; macrotidal
  coasts, river deltas and coastal marshes/mangroves carry an intertidal
  mudflat shelf that stands bare at low water, while ordinary mesotidal beaches
  keep wet sand.
- **Works.** Polder ditches and dikes, chinampas in the Valley of Mexico,
  qanat shaft lines. Castle grounds can carry a flooded moat or a dry
  defensive ditch. Adjacent cut cells share one bed and banks. The approach
  crosses on a timber deck.

The engine calls `world.setSeason(season, tideAt(...))` on every advance; a
change of season or tide step restyles the terrain stream.

## Ice underfoot

`iceStrength` in `src/core/ice.ts` is the one answer to how well frozen water
bears at a point: the frost, less the current in mid-river and the swell at
the edge of sea ice, in slow patches. The raster draws from it and the engine
walks on it, so what looks dangerous is. Under `ICE_OPEN` the water is open;
under `ICE_THIN` the ice is drawn as a dark outlined pool.

- **Walking.** `waterDepthAt` is 0 on ice that bears (`iceAt`). A turn made in
  motion often does not take and the player slides on a cell
  (`iceCarry`); a slide or a run can end in a fall with an injury from
  `health/injuries.ts`. NPCs and animals walk the same ice and never break it.
- **Thin ice** cracks once as a warning (not for a runner or a rider), then
  goes. Over wadable water that is a cold soaking; over deep water it is the
  `through-ice` card (`cards/hazards.ts`), answered until the player is out
  or dead. The hole stays open eight hours (`engine.iceBreaks`).
- **Skating.** The `skate` station activity sends residents to
  `plan.outdoors.ice` on winter days where the record has skating
  (`day.skate.*` in `days/general.ts`) and the frost is 0.5 or more. The
  scene glides them in figures of eight on sound ice (`skating` in
  `WorldScene.ts`).
- **One shoreline.** The water raster, the ground raster and the living-water
  mask each measure the shore differently (raw, scalloped per cell in the
  worker's paint cells, scalloped per pixel). Ice is cut from `iceDistance`
  (`core/water-field.ts`) in all three, and bank cells (`sheeted` in
  `render/ice-sheet.ts`, read from `waterVisual.frost`) paint the part of
  the sheet that reaches into them. A painter that measures its own way
  leaves cell-sized blocks of summer water along the edge.
- **Look and sound.** The sheet is `iceSheet` in `render/ice-sheet.ts`: a flat
  body, a snow lip in round lobes with a blue line under it, ovals, sparkles
  and snow pillows placed on lattices rather than cut from noise. Glints,
  blade scratches, cracks and holes are `render/ice-effects.ts`; the sounds
  are `ice` in `audio/sfx.ts`, listed in the Audio studio.

## Rendering

- Mapped lakes and sea inlets carry their signed shoreline distance onto the dry bank. The sand, shallows and waterline follow the same polygon between cell centres.
- **Quays.** Cells beside a city's bulkhead or pier carry
  `waterVisual.quay` (`"sett"` or `"plank"`). `quayPixel` in
  `material-edges.ts` draws individual coping stones, the wet foot of the masonry,
  timber edge beams and the laid apron. South-facing edges expose more wall.
  Ground and water tiles follow the same shoreline distance field. The
  living-water mask leaves those pixels alone, takes no scallop there, and
  reads the water as dredged (`quayWater` in `core/water-field.ts`): six
  cells deeper at the wall, easing to the natural bed eight cells out.
  Nobody wades off a quay.

- **Living water (default).** `WorldScene` sets `waterRenderer ??= "living"`.
  `src/render/living-water/` draws WebGL colour forms, caustics, waves and
  foam over worker-prepared shoreline and rock-displacement textures
  (`game.ts`, `mask.ts`, `coast.ts`, `banks.ts`, `polish.ts`, `shader.ts`).
  Tuned values are in `living-water/defaults.json`, shared with the lab.
  Palette by ecology and kind is in `living-water/profile.ts`: lowland rivers
  and ponds are olive `murky`, creeks and temperate lakes `green`, boreal
  water `blue`, tundra `polar`; seas keep their own colours, and a
  waterscape tint (silt, loess, clear, reef) overrides all of it. The
  minimap and the fishing view read the same palettes. Decorative water rocks,
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

- The legacy CPU water path, once a Canvas fallback is decided.

## Lab and checks

- `/water-experiments` tunes living water and exports JSON; `?context=map`
  embeds a real map, `?context=coast` starts on a coast.
- `npm run capture:terrain -- waters` shoots the waterscapes in season pairs.
- Tests: `water-rendering`, `living-water`, `water-crossings`, `terrain-banks`.
