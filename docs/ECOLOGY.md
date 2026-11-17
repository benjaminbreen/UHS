# Ecology and vegetation

Which landscape a place gets (envelope and colourway), how local habitats are
laid out, and which trees and plants grow there. Entry files:
`src/content/ecology/profiles.ts`, `src/content/ecology/variants.ts`,
`src/world/v3/habitats.ts`, `src/content/ecology/vegetation.ts`.

## Layers

From broad to local; each layer narrows the one above it:

1. **Envelope.** Nine in `profiles.ts`: grassland, savanna, temperate,
   boreal and tropical woodland, wetland, dry scrub, desert, tundra. Each owns
   a palette and resource categories.
2. **Colourway.** `regionalEcology` in `variants.ts` reads the RESOLVE 2017
   ecoregion raster (`src/content/geography/ecoregions.ts`) and picks envelope
   plus colourway for a place on Earth: Sahara sand sea vs Sonoran cactus
   desert, papyrus vs peat bog vs mangrove wetland, prairie vs steppe, and so
   on. A colourway names a grass, soil and bank ramp, a tree mix and a
   `habitatLayout` that bends the shared fields (braided wetlands, dune ridges,
   gallery forest). Open ocean and unmapped places fall back to
   `climateEcology`. These are art and layout choices from a modern
   potential-vegetation map, not species inventories or dated reconstructions.
3. **Regional recipe.** `landscapes.ts` holds reusable landscape recipes.
4. **Habitat.** `src/world/v3/habitats.ts` lays continuous canopy, exposure
   and wetness fields over relief and drainage. `communities.ts` classifies
   each site: saturated woods are swamp, open saturated ground is marsh, wet
   boreal ground is bog, channels stay water.

`src/render/habitat-appearance.ts` resolves palettes and community colours
once for both the ground raster and the minimap.

## Gameplay queries

- `world.habitatAt(x, y)` returns the community and land use (`natural`,
  `cultivated`, `built`) for an integer cell in the playable map, the same one
  the graphics use.
- `supportsHabitatResource(site, "reeds" | "timber" | "stone")` is eligibility
  only. Abundance and search belong to whichever economy feature needs them.
- `world.geography.landPotentialAt` (computed by `landPotential` in
  `src/world/v3/land-potential.ts`) gives physical
  arable, pasture, fishing, timber and similar opportunities.

## Vegetation

- **Mixes.** `vegetation.ts` holds weighted tree and understory mixes and
  local filters (`treeMix`, `vegetationTree`, `vegetationUnderstory`,
  `vegetationPattern`). Selection reads the setting and habitat fields with
  deterministic hashes at world coordinates; it never branches on cultural
  family. Colourway tree mixes come from `variants.ts`.
- **Spacing.** `src/world/v3/vegetation-spacing.ts` gives each tree a crown
  radius and thins by local priority, so the same survivors appear whatever
  order chunks load in. Roads, fields, settlement claims and water are
  excluded; trunks collide, crowns fade over the player.
- **Placement.** `src/world/v3/generate.ts` (`eligibleTree`, `decorate`).
- **Art.** `npm run art:nature` builds `public/nature/atlas.*` and the
  precomputed `shadows*.png`. Sources include `scripts/art/world_trees.py`,
  `regional_trees.py`, `tropical_trees.py`, `shrubs.py`, `small_shrubs.py`,
  `habitat_plants.py` and `world_plants.py`. Deciduous trees have autumn,
  bare and blossom frames. Plants are inspectable by clicking their opaque
  pixels.

## Where to extend

A new region's look: a colourway in `variants.ts`. A new plant: draw it in
the nature art scripts, add it to a mix in `vegetation.ts`. Do not add a
parallel biome table.

## Legacy, do not extend

Retiring these is welcome; there are no saves to preserve:

- `ecologyRevision: 1` (climate-rule envelopes only).

## Labs and checks

- `/terrain-lab` with `variant=` shows every colourway; `/nature-lab` shows
  every plant.
- `npm run capture:terrain -- vegetation` (also `groves`, `habitats`).
- Tests: `biome-variants`, `biome-boundaries`, `ecology-sampling`,
  `habitat-communities`, `vegetation`, `vegetation-composition`.
