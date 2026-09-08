> New-world integration (September 8): ordinary creation and the explorer now use geography revision 1 through the same terrain pipeline. Earth geography supplies broad constraints; explorer environment controls apply to a bounded starting area. Regional land use and coordinate-based content are described in `WORLDS.md`. The revision-two notes below also document the earlier configured-world baseline.

# Procedural environments and household livelihoods

Implemented September 7, 2026. Open `/terrain-lab` for the procedural explorer. It generates a normal v3 world with `terrainRevision: 2` and an explicit `environment` configuration, renders it with `WorldScene`, and hands the **same Runtime** to the playable UI. This is a testing entry point for shared systems, not a second preview generator. Ordinary New world and the original Anatolia revision-one shortcut retain their existing defaults.

## Independent controls

- Eight ecological envelopes: grassland, temperate woodland, boreal woodland, tropical woodland, wetland, dry scrubland, desert and tundra.
- Four landforms: plain, rolling ground, ridge and basin. All use three local elevation tiers; the tiers are relative relief, not geographic metres. A valley is not required.
- Water: none, either river orientation, lake, or any of four coast orientations. Water has shallow and deep visual zones. Beaches are shoreline surfaces, independent of the dominant ecology.
- Population: none, sparse or settled. Existing farmstead, hamlet, clustered, planned, waterfront and dense settlement patterns remain shared planner inputs; the explorer also exposes camps through the existing shelter/camp configuration.
- Starts: resident, visitor, wanderer or shepherd. A region without settlement does not assign housing or a household; a resident selection there becomes a wanderer. Shepherd starts attempt to place a small flock on nearby free tiles.
- Household composition: mixed, extended or shared. These are explicit prototype templates, not culturally universal family models.

The explorer has six quick studies, seed/reseed controls, date and season inputs, height/moisture overlays, drag/zoom, settlement/player centering and a household/stock inspector. URL parameters retain the generation recipe. Changing controls requires Generate; quick studies generate immediately. Play this world begins at the generated player position, regardless of preview camera panning. Returning to the explorer retains the played state until another generation.

## Terrain and ecology ownership

`src/content/ecology/profiles.ts` owns the small ecology palette and resource availability categories. `src/world/v3/landforms.ts` owns warped broad relief and cached, terrain-guided river reaches. `src/world/v3/environment.ts` carves variable floodplains, derives moisture and shoreline materials, then assigns three visible tiers independently of settlement placement. Woodland clearings, wet margins and dry-region waterside grass add local habitat variation. `generate.ts` passes the resulting terrain to the existing settlement planner, crossing rules and renderer. Level plots, road slopes and sparse natural slope openings allow settlement and wilderness traversal. The renderer has no culture-specific ecology branches.

Sand and snow extend the shared ground/material atlas to 610 frames and 28 colours. Winter snow currently follows the initial setting for boreal/tundra studies. Existing continuous banks, timber bridges, two water depths, contour projection and worker-rendered terrain chunks are reused. Resource art is code-authored in `scripts/build_ecology.py`; fruit trees and berry bushes reuse the established tree silhouettes. The atlas contains no reference-image pixels.

This is a constrained compositional generator. Rivers use a bounded coarse route through the heightfield, shared reach endpoints, variable banks and a descending longitudinal bed model. It is not a watershed/tributary network, fluid simulation or erosion solver. Coasts are warped boundaries; lakes combine distorted basins. Small unsupported elevation protrusions are softened before floodplain carving. The three visible heights are quantized broad forms; there is no global climate synthesis, glacier model or absolute-altitude simulation. Seasonal resource stocks advance, but terrain snow does not yet change as time passes. A dense 1850 study exercises the settlement planner and existing period assets; it is not an industrial economy or a new industrial art set.

## Households and actual resource transfers

`src/world/v3/population.ts` attaches stable household IDs, residence entrances, shared store IDs, ages and reciprocal partner/parent/child/co-resident links to generated actors. Mixed households include single occupants, unrelated co-residents and families; extended households include an older generation. Parent/child ages are constrained. Visitors and wanderers are not silently adopted into the first house.

Wild fruit, berries, fallen branches, reeds and grazing patches have real finite inventories. Availability derives from local habitat, with seeded placement excluding protected plots and paths. Cultivated grain uses the same resource contract in revision-two worlds. Fruit and berries are generic ecological categories: they are not evidence that apples or a particular species existed at every selected place and date. Tropical availability and a 28-day season are explicit simplified model assumptions.

`src/core/livelihood.ts` supplies bounded shared rules:

1. Adults learn resource locations encountered within sight, select reachable unowned or household-owned supplies, walk there, spend work time and harvest real stock.
2. Carried supplies return to the household container. Members eat from it and fetch water from nearby wells. Player members can use **Contribute supplies** on that same container; tools and valuables are retained.
3. At night members return through their residence entrance and rest inside; morning activity takes them outside. Children stay near home. When supplies suffice, existing occupational routines resume.
4. Sheep and goats consume finite grazing stock. Resource depletion, timed regrowth and seasonal availability use the same objects for players and NPCs.

These are foundations for grounded activities, not a complete demographic or social simulation. Kinship does not yet cause marriage, inheritance, births, care obligations, conversation choices or inter-household exchange. There is no general job planner, species catalogue or industrial production chain. Water fetching uses the existing inexhaustible well convention. Distant actors retain the existing bounded activation/catch-up approximation.

## Verification and performance

`tests/livelihood.test.ts` checks all eight ecological envelopes, settlement-free starts, deterministic landform/water variation, reciprocal families and age gaps, finite seasonal harvest, household work/home transitions, player contributions, grazing and an ordinary populated simulation command. `tests/browser/procedural-lab.spec.ts` renders all six quick studies, checks the no-settlement/flock cases, switches overlays, and verifies an unchanged engine hash when entering play.

Terrain sampling uses a bounded cache; worker contour rendering retains bounded 16×16 chunks and installs at most one chunk per frame. Family membership adds actors, so populated simulation is more expensive than a wilderness scene. On the local development machine, the woodland example advanced 30 simulated minutes in roughly 290 ms in isolation (about 670 ms alongside build/tests); the dense-town five-minute command including browser runtime redraw took 562 ms. Measurements vary with machine and load. No save restoration feature or migration work is part of this delivery.


## Landscape and settlement composition pass

The September 8 stage-one/two pass replaces the experimental explorer's sine-wave river and fixed street templates. Existing explorer seeds intentionally produce the new composition; commit `de1e0bc` records the preceding baseline. The original Anatolia revision-one preset and earlier generators retain their composition.

River plans cover 384-cell reaches at 12-cell intervals, choose lateral courses using height/corridor/turn costs, and share deterministic endpoints. Reach caching is bounded to 24; height samples to 65,536. Positive and negative reach boundaries and cache eviction are covered by tests. Separate shore and floodplain widths vary along each bank. Coast beaches, lake margins, gravel riverbanks and wet pockets share the existing material palette. Stable two-cell wilderness passes are selected from actual contours, with at most one opening per height transition per 32-cell planning area. Road crossings retain their own access openings. This is local cleanup/access planning, not a guarantee that every land component in an infinite world is reachable.

Settlement sites favor level dry ground with reasonable water proximity. The organic planner connects a handful of suitable neighborhood/court/crossing anchors, reuses existing roads, adds a few cross-links for dense/waterfront layouts and fits buildings to variable frontage intervals and setbacks. Planned settlements retain their explicit grid. Density and regularity are independent. Household yards reserve usable space while exposing localized wear; field placement chooses among fitting connected plots using moisture and distance. Stone-surfaced major routes use continuous gravel artwork, distinct from narrow dirt paths and the existing dry-channel overlay.

Generation-only road searches support diagonal steps with four-connected rasterization and full footprint validation. They use a bounded 5,000-node weighted search and memoized ground preferences; ordinary runtime routing defaults are unchanged. Expensive reach/pass results are cached. Renderer chunk ownership and worker dispatch remain shared with playable worlds. Wilderness previews frame nearby water and offer player centering without changing the start position.

`tests/regional-composition.test.ts` verifies reach continuity/order/eviction, connected water and varied margins, and reachable household entrances for rolling, dense plain, ridge and basin worlds. `tests/browser/regional-composition.spec.ts` supplies uninhabited geography review images alongside the six populated/ecological presets in the existing browser check.

## Habitat and edge art — September 8, 2026

Configured terrain now includes connected local habitat fields, ecological ground palettes, original pixel transition silhouettes, clustered grass glyphs and less regular tree placement. Continuous path art follows simplified route strokes while movement uses the generated route. Dated street profiles select shared paving materials. See `TERRAIN_ART.md` for implementation, scope, review captures and known checks.
