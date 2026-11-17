# Terrain: relief, ground and the render pipeline

How the land under a v3 world is generated and drawn: relief and tiers,
habitat fields, streams and other features, the cell contract, and the worker
that bakes ground chunks. Water has its own doc, [WATER.md](WATER.md); habitats
and plants are in [ECOLOGY.md](ECOLOGY.md).

Entry files: `src/world/v3/environment.ts` (the land model),
`src/core/topography.ts` (`TopographyCell` and movement rules),
`src/render/terrain-stream.ts` and `src/render/terrain-worker.ts` (drawing).

## Land models

`createSettlementWorld` in `src/world/v3/generate.ts` has one:
**`createEnvironment`** (`v3/environment.ts`). It takes Earth constraints from
`src/world/geography/`, then carves floodplains, derives moisture and shore
materials, and assigns local height tiers. Tiers are relative relief, not
metres. The setting must carry an `environment`.

Supporting v3 modules: `landforms.ts` and `terrain-forms.ts` (broad relief and
river reaches), `drainage.ts`, `boulders.ts`, `shoreline.ts`,
`land-potential.ts`.

`src/world/geography/` is shared Earth geography (`landscape.ts` holds only the
`LandSample` type now).

## Features

`src/world/v3/features.ts` places streams, arroyos, animal trails, rock
outcrops, salt pans, gravel bars, dune crests and woodland logs by
deterministic rules over the existing fields. The land sample, the generator
and the raster all consult it; nothing from it is saved. A stream walks
downhill from a spring: in green country it is a creek with falls at each tier
drop, in dry country an arroyo with a silt bed. `tributaries.ts` adds
tributaries; stream logic is split between the two files.

Trodden ground (doorsteps, trails) feeds the same path field as roads, so all
worn ground shares one treatment.

## The cell contract

`TopographyCell` in `src/core/topography.ts` is what the sampler returns and
everything else reads: tier, surface, water depth, ramps, `waterVisual`
metadata, seasonal water potentials. `terrainStep`, `terrainLeap` and
`terrainJump` there are the movement rules for player and NPC routing: ramps
climb one tier, ledges and deep water block, bridges cross.

`Runtime.inspectCell` prints a cell's envelope, colourway, habitat, tier,
surface, lat/lon and ecoregion; Cmd- or Ctrl-click a cell in play to call it.

## Drawing

- **Streaming.** `TerrainStream` (`src/render/terrain-stream.ts`) asks the
  world worker to sample and rasterise 16×16-cell chunks, then installs at most
  one finished chunk per frame. Visible chunks come first, with a fringe for
  movement and a bounded ring for backtracking. The canvas reports
  `data-terrain-*` attributes for diagnostics.
- **Relief.** `terrain-projection.ts` (height projection, pointer picking),
  `terrain-contours.ts` and `contour-surfaces.ts` (connected cliff and
  contour silhouettes), `bridges.ts` (timber spans over water).
- **Ground.** `habitat-raster.ts` paints habitat bands with per-pixel
  thresholds; `ground-motifs.ts` and `terrain-tiles.ts` supply glyphs and edge
  silhouettes; `field-raster.ts` draws farmed ground; `material-edges.ts` owns
  the path field. Path strokes are simplified in `src/world/v3/path-art.ts`
  for drawing only; routes stay authoritative.
- **Streets.** `src/content/settlements/streets/` chooses material by place
  and date; `street-raster.ts` and `carriageway.ts` draw it (see
  [SETTLEMENTS.md](SETTLEMENTS.md)).
- **Rocks.** Regional rock art is `scripts/art/rocks.py`, chosen in
  `src/content/ecology/rocks.ts`.
- **Palette.** `scripts/art/topography.py` → `scripts/build_topography.py` →
  `public/topography/` and `src/render/generated/topography-style.json`.

## Where to extend

New relief, features or ground marks go into `v3/environment.ts`,
`v3/features.ts` and the rasters above. Do not start a second land model or a
second ground raster.

## Labs and checks

- `/terrain-lab` opens the procedural explorer (`src/dev/terrain/ProceduralLab.tsx`):
  envelope, colourway (`variant=`), landform, water, population and start
  controls, then play the same world. `?study=meadow` and `?study=contours`
  open the fixed fixtures.
- `npm run capture:terrain -- <review>`: `relief`, `landforms`, `cliffs`,
  `streams`, `arroyos`, `habitats`, `edges`, `textures` and others; a wrong
  name prints the list.
- Tests: `topography`, `terrain-art`, `terrain-banks`, `landscape-features`,
  `landscape-composition`, `habitat-rendering`, `material-edges`,
  `field-raster`, `road-simplification`, `street-rendering`.
