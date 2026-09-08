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

`src/content/ecology/profiles.ts` owns the small ecology palette and resource availability categories. `src/world/v3/environment.ts` samples seeded broad relief, water margins and moisture independently of settlement placement. Woodland clearings, wet margins and dry-region waterside grass add local habitat variation. `generate.ts` passes the resulting terrain to the existing settlement planner, crossing rules and renderer. Level plots, road slopes and sparse natural slope openings allow settlement and wilderness traversal. The renderer has no culture-specific ecology branches.

Sand and snow extend the shared ground/material atlas to 610 frames and 28 colours. Winter snow currently follows the initial setting for boreal/tundra studies. Existing continuous banks, timber bridges, two water depths, contour projection and worker-rendered terrain chunks are reused. Resource art is code-authored in `scripts/build_ecology.py`; fruit trees and berry bushes reuse the established tree silhouettes. The atlas contains no reference-image pixels.

This is a constrained compositional generator. Rivers/coasts are seeded distance fields, not downhill drainage or erosion. The three visible heights are quantized broad forms; there is no global climate synthesis, glacier model or absolute-altitude simulation. Seasonal resource stocks advance, but terrain snow does not yet change as time passes. A dense 1850 study exercises the settlement planner and existing period assets; it is not an industrial economy or a new industrial art set.

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
