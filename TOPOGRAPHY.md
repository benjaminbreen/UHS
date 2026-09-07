# Phase two: v3 Anatolia terrain preview

Use New world → Anatolia · 6500 BCE · terrain preview. The seed is `anatolia-relief-1`, internal astronomical year −6499. This is a fictional generated settlement on the Konya plain, not a surveyed reconstruction.

The opt-in `setting.terrainRevision: 1` is saved with generator 3. Omission preserves earlier v3 layouts, replay inputs and rendering. The same setting reaches the worker, restored sessions and headless generation through existing dispatch.

`src/world/v3/topography.ts` supplies seeded low-frequency terraces, a varying-width river, two water depths and moisture pockets. Three local tiers and three ecological presets (wetland, grassland, dry upland) form the initial constrained palette. The settlement planner consumes that landscape and accepts level plots. Two-cell-wide slope openings are selected from road crossings, with a ten-cell exclusion radius. Bridge decks include dry approaches. The preview uses eight households and skips distant inter-settlement road planning. Core player and NPC routes use the shared terrain crossing rule. Outdoor keyboard diagonals validate both cardinal routes around the corner, preserving water, ledge, solid-cell and ramp-axis restrictions. This adds previously rejected diagonal commands; generation inputs and successful historical cardinal commands are unchanged. Local rendering projects terrain and entities; the minimap shows shallow water and exposed ledges. Terrain fields and cells use bounded derived caches.

This first integration uses a composed valley and seeded river course, not downhill watershed routing, erosion or worldwide climate simulation. The uplands use broad, seeded lobes rather than independently quantized tile noise. Wet margins include gravel shelves and scattered boulders. Terrain sampling and contour rasterization run in a worker; the renderer retains bounded 16×16 terrain chunks and installs one completed chunk per frame. The old duplicate ground tilemap and unused legacy tile prefetch are skipped for relief worlds. See the streaming section below for current validation.

Validation: `tests/terrain-world.test.ts` covers tiers, water depths, biome coverage, limited slope counts and reachable households. Save restoration is not an early-development priority. `tests/browser/terrain-world.spec.ts` creates and renders the preset and verifies the owned-house route. Screenshot: `artifacts/anatolia-topography-v3.png`.

---

# Terrain / stage-one visual proof

Open `/terrain-lab` (or follow Terrain study from the Graphics lab). The river meadow is a fixed, fictional composition inspired by the September 7 references, not a reconstruction of Konya and not the stage-two procedural generator. The meadow uses three levels: river/floodplain, settlement terrace and one broad northeast rise. A second slopes-and-corners fixture exercises all four ramp directions, inward corners and the full four-tier range.

## Delivered

- Original 16×16 ground recipes with a shared 24-color terrain palette, deep and shallow water, wet margins, gravel channels, four directional slopes, tufts and submerged gravel bars.
- Four integer local height tiers, 0–3. These are not absolute geographic altitude. Ecology and height are independent (the contour fixture has grass on its highest tier).
- Shared material masks collapse redundant diagonals to 46 nonempty cases. The atlas has 510 generated ground, margin, channel and slope frames. Terrain relief is a connected contour raster rather than a collection of front/side/end-cap sprites.
- One pure edge-crossing rule used by fixture keyboard movement and click routing. A lower ramp tile points to its one-tier-higher neighbor; lateral ramp entry, unmarked ledges, multi-tier drops, solid footprints and deep water block movement. The bridge supplies a continuous dry crossing.
- A shared 14-pixel height projection positions tops, feet, shadows and pointer targets. Slopes interpolate elevation continuously. Logical map-row depth handles terrain and entity occlusion.
- Connected ground silhouettes are swept toward the lower surface, then given a rounded bevel and shared world-coordinate soil texture. Small 1–2 px variations follow the whole contour. Convex and concave turns have no independent caps or dark tile-ending bars. Contour textures are built once per fixture, in row layers; production chunk caching remains stage two.
- Roads are routed after terrain and footprints. The main terrace is reached through a two-cell-wide north-facing slope. Reeds and damp ground occur in pockets; the river winds and changes width. Shallow and deep river water share one surface elevation; the separate marsh pool has its own level. Water remains blocked in this review, including shallows.
- Review controls: keyboard/click walking, destination shortcuts, reset, drag-to-pan, integer scroll zoom, height overlay, and PNG export. The lab starts before save loading, writer locking, session construction and player API registration.

## Ownership

- `scripts/art/topography.py`: palette, tile/edge/overlay recipes.
- `scripts/build_topography.py`: isolated atlas build, shared shelf packer, review sheet.
- `public/topography/`: generated atlas; does not replace playable terrain assets.
- `src/core/topography.ts`: opt-in cell and crossing contract. Existing generators do not import it.
- `src/render/topography.ts`: Phaser ground/material composition.
- `src/render/terrain-contours.ts`: connected contour silhouette, bevel and soil raster; Phaser row layers.
- `src/render/terrain-projection.ts`: shared elevation projection and visible-surface picking.
- `src/render/generated/topography-style.json`: palette and rise generated from the art source.
- `src/dev/terrain/`: fixed composition, bounded review routing and scene controls.
- `src/dev/TerrainLab.tsx`: review page.

The composed buildings and vegetation reuse current atlas sprites. All terrain pixels are drawn from source recipes; no generated reference-image pixels are embedded.

## Verify

```sh
python3 scripts/build_topography.py
npx vitest run tests/topography.test.ts
npx playwright test tests/browser/terrain-lab.spec.ts
npm run build
```

Browser tests expect the ordinary local Vite server on port 5173. They cover traversal, blocked ledges, elevated-ground pointer targeting, scene switching, export, narrow-screen pan/zoom and saved-journey isolation. Unit tests also cover connected plateau area, dual water depths, continuous ramp projection and pixel connectivity around a stepped bank corner. Review PNGs are under `artifacts/topography-*.png`.

## Original stage-two boundary (historical)

Procedural connected landforms, sampled moisture patches, settlement grading, production player/NPC routing, worker/chunk integration, minimap relief and new-world generator versioning remain stage two. The fixture deliberately does not change existing worlds, replays or simulation rules. Its bounded BFS is a review control, not a new production pathfinding system. Integrate the shared crossing contract into production routing when the new generator is introduced.

Seasonal ecology, worldwide biome presets, erosion and dynamic hydrology are not part of this visual proof.

## Bridge rendering and local travel cache

`src/render/bridges.ts` groups connected bridge cells into a timber span. A baked plank deck is split into logical map rows for actor depth ordering; posts remain separately ordered and the bearer casts a water shadow. Contours omit pixels under the deck footprint, including the small overlap onto the bank. Bridge cells render water below the suspended deck. The generated movement footprint is unchanged.

The former oversized viewport rebuild has been replaced by `src/render/terrain-stream.ts`. A worker generates deterministic terrain samples and rasterizes contours for 16×16 chunks. It uses the existing world-worker entry point, so production does not download a second copy of the geography/generator bundle. Only completed ground/contour textures are installed on the main thread, at most one chunk per animation frame. Visible chunks have priority, a one-chunk fringe prepares future movement, and a bounded extra ring supports backtracking. World replacement, interiors and scene shutdown dispose the worker and chunk textures; zoom and lighting reuse retained geometry. Scenery has an independent, smaller refresh region.

Ground pages are 256px in streamed worlds (512px in the isolated study). Texture variation is anchored in world coordinates; each contour pixel/row has a single chunk owner with neighbor sampling across seams. Whole bridge spans are discovered across chunk boundaries so internal seams do not acquire end posts. The worker returns bridge geometry and clips bank contours beneath the same deck footprint.

Canvas diagnostics separate `data-scenery-draw-ms`/`data-scenery-draw-count` from `data-terrain-ready`, `data-terrain-load-ms`, `data-terrain-pending`, `data-terrain-chunks-built`, `data-terrain-chunk-count` and `data-terrain-install-max-ms`. Browser coverage includes outdoor combined keys, a 190-step round trip to x=75 and back through new terrain, bounded retention, no missing visible chunks during normal walking, zoom/lighting reuse, and bridge close-ups. Unit coverage compares contour pixels and logical depths across positive/negative chunk seams and bridge spans discovered from either side. Performance numbers are local measurements rather than universal device budgets.
