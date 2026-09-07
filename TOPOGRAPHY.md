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

## Stage two boundary

Procedural connected landforms, sampled moisture patches, settlement grading, production player/NPC routing, worker/chunk integration, minimap relief and new-world generator versioning remain stage two. The fixture deliberately does not change existing worlds, replays or simulation rules. Its bounded BFS is a review control, not a new production pathfinding system. Integrate the shared crossing contract into production routing when the new generator is introduced.

Seasonal ecology, worldwide biome presets, erosion and dynamic hydrology are not part of this visual proof.
