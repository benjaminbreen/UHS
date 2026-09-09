> Integrated geography (September 8): new worlds can have multiple named places or neighborhoods per district. Dated footprints/open-land constraints govern placement; regional transport is restored on the shared relief terrain. `src/world/regional/` supplies identities and connections to the existing local planner. See `WORLDS.md` for current coverage and extension contracts.

> **Current explorer composition:** Environment-configured worlds now use terrain-selected anchors, branching routes and variable frontage. Dense towns can be irregular; only the planned profile retains its grid. The original generator baseline described below remains relevant to other settings. See [ECOLOGY.md](ECOLOGY.md#landscape-and-settlement-composition-pass) for the implemented landscape/settlement refinement and its checks.

# Procedural settlements

New procedural and World Weaver starts use generator 3 and simulation 2. Both modes supply the same saved setting and run the same planner. The original Roman/Anatolian presets and existing generator-2 saves keep their earlier layouts and behavior.

The planner builds a settlement once, before any chunk samples it: public space and approaches, streets and crossings, household plots and entrances, then working yards, fields and pens. Plots reserve their ground before later features are placed. A failed fit is skipped; the generator does not add overlapping buildings to meet a population quota.

## What is implemented

- Six small layout profiles: farmstead, clustered village, roadside village, dense town, planned streets and waterfront. Settings choose a default; the new-world form can override it. Profiles adjust street arrangement, density, setbacks, commons, field shape and livestock. They use shared art and behavior.
- Roads respond to water and slope, connect neighboring settlement sites, and reuse existing routes. Bridges require a bounded river crossing with land on both sides; open sea is excluded. Fields and pens receive approach paths without putting a new road through their interiors.
- Buildings face their street and retain stable exterior/interior entrances. The existing art compiler produces north/east/west variants in addition to the original frames. Households have rear work access and prop pockets. A starting household belongs to the player; farmstead outbuildings share ownership.
- Farms have harvestable grain plots, narrow strips or grouped fields. Pens have collision boundaries, usable gates, troughs, owned animals and nearby pasture where it fits. These reuse existing harvesting, ownership, container and herding interactions.
- Residents travel between household, work, water and common-area destinations with staggered schedules. Farmers use field accesses; herders tend pens. Animals remain contained by closed fences/gates, graze when the gate opens, and return for the night; nearby herders secure returned animals. Work and crop varieties still come from the existing content library.
- Player click routes and new-world NPC routes use a stable heap-based weighted pathfinder. Roads are cheaper than fields and private yards. Click routes open gates through recorded interaction commands and replan if the next tile becomes blocked. NPCs check occupancy and update their route when an obstacle changes.

## Code ownership

| File | Responsibility |
| --- | --- |
| `src/content/settlements/profiles.ts` | Flat layout parameters and default selection |
| `src/world/v3/plan.ts` | Public space, frontage, buildings, plots and activity sites |
| `src/world/v3/roads.ts` | Terrain-aware routes and river crossings |
| `src/world/v3/generate.ts` | Stable district identity, regional links, chunk sampling and activation |
| `src/core/routing.ts` | Bounded weighted search; no world/content knowledge |
| `src/core/engine.ts` | Authoritative movement, gates and daily activity |
| `src/content/props/place.ts` | Existing prop kits using reserved placement pockets |

Country-road generation uses a more directed search to keep startup fast; it seeks a plausible connection rather than a mathematically shortest road. Player movement retains the ordinary admissible heuristic. Search budgets are explicit. Routing caches are derived and cleared at command boundaries; they are not hidden save state. A bounded terrain-collision cache stores only immutable terrain/building results. Dynamic gates and props are checked separately.

Chunks and the local map sample the same plan. Wider regional views simplify to landscape and settlement centers, avoiding the cost of constructing every distant household merely to draw an overview. The Earth atlas and v2 landscape composition are unchanged.

## Compatibility and checks

The manifest distinguishes generator 1/simulation 1, generator 2/simulation 1 and generator 3/simulation 2. Loading and replaying dispatch by the saved version, including the background worker and headless runner. Existing generator code and original building frames remain available.

```sh
npm test -- --maxWorkers=1
npm run build
npx tsx scripts/check-settlements.ts
npx playwright test tests/browser/settlements.spec.ts tests/browser/world-v2.spec.ts
```

The settlement tests cover all six forms, reachable entrances/work areas, plot overlap, river-versus-sea crossings, closed pens, autonomous gates, recorded player gate opening, chunk query order, save continuation and replay. The diagnostic script prints actual building/field/pen counts and unreachable destinations for six geographically different settings. Browser screenshots are in `artifacts/settlement-*.png`.

This is settlement generation with simple daily activity. It does not simulate historical urban growth, construction, farm yields over seasons, a complete supply economy or changing societies across continents. Those can extend the existing data and interactions when needed; no extra framework is introduced here.

## Shared road corridors and short access spurs — September 8, 2026

Local access routes (doors, yards, fields and pens) now start at the access point and join a nearby reachable road, stopping at the first existing road encountered. They no longer independently route back to a fixed village-center target. Candidate joins are deterministic and bounded; blocked candidates are retried at separated nearby road points. Main-road searches favor existing corridors, penalize new parallel construction nearby, and use an unweighted heuristic when a road network exists. Existing solid-footprint, width, water and bridge checks still apply.

This deliberately changes newly generated v3 settlement layouts; runtime character pathfinding is unchanged. No migration or restoration work was added. Review the refreshed Umbria/grassland screenshots in `artifacts/texture-review/`. Three focused road-network tests cover short spurs, corridor reuse, obstacles and bridge-only water crossings. The existing six-form settlement test also passed, checking building counts and reachability of doors, work areas, fields and gates. Production build passed. Concurrent performance/character work remains separate.

## Sparse roads and continuous junctions — September 8, 2026

New worlds pin `roadRevision: 1`. Regional neighbors use a sparse relative-neighborhood graph, then route in fixed ownership-cell batches, shortest connections first. Routes within each batch reuse centerlines and crossings; ownership and sorting make geometry independent of viewport request order. Authored connections retain their explicit endpoints. This is a bounded local network, not a global minimum-cost road optimizer.

Local neighborhood lanes and doors join actual road centerlines with one bounded search, rather than sorting the entire road surface and trying up to eight targets. Ordinary hamlets use three neighborhood anchors. Yard/work access remains validated but no longer creates an extra drawn road; doorstep wear is smaller and minor paths are narrower with softer shoulders. Public/city block layouts retain their existing structure.

The paired semicircle bug came from ending a lane on the painted shoulder of another road. Shared centerline endpoints now make continuous junctions. Short approaches can straighten on validated level, dry ground; their authoritative cells change with the art. Drawing unions duplicate cardinal edges, retains junctions and assigns shared segments the widest width before simplification. Regional bridge searches use unit steps to enter narrow decks reliably, and routes carry the geometry of any crossing they reuse.

Review `artifacts/roads/after.png` and `after-junction.png`; `scripts/capture-roads.ts` captures production preview and checks eight actual movement steps across the junction after entering play. `scripts/measure-roads.ts` compares the previous and new revision with the same setting and seed; results are in `artifacts/roads/comparison.json`. These are local measurements, not steady-FPS claims. Pinned worlds without the road revision keep the previous routing; regenerate to see the changes. No commit or deployment.

## Urban neighborhoods — September 8, 2026

New `urbanRevision: 1` dense/planned/waterfront neighborhoods use the shared block-and-parcel composer in `src/world/v3/urban.ts`. Streets precede parcels; civic squares, public hall ranges, market counters, footways and enclosed courts have explicit roles. Source-qualified civic content lives in `src/content/settlements/civic/`, while shared form/material recipes remain independent of culture in the renderer. See `CITY_ART.md` for generation scope, compatibility, art ownership, review captures and verification.

## Dated regional street fabric — September 8, 2026

New worlds pin `urbanRevision: 2`. Every town used to come out as the same four blocks on one 3x3 lattice, with the civic building always in the same corner and a regional road crossing the main square on whatever diagonal the neighbouring district happened to sit. Both causes were in code, not in geography: the lattice coordinates were literals in `urban.ts`, and `regional/transport.ts` routed centre to centre and took a straight-line fast path on level ground.

`src/world/v3/blocks.ts` now partitions a settlement into gates, arterials, a public square and recursively subdivided blocks. `src/content/settlements/urban-form/` supplies the parameters — block module, street-tier widths, regularity, courtyard and blind-alley shares, gate count, square placement — selected by cultural family, date and coordinates, the same lookup `civic/` and `streets/` already use. Capacity comes from the site's authored radius and its own fabric rather than a flat count, so a larger place produces a larger settlement. Through routes aim at a gate on the built edge and arrive on two cardinal legs.

Composition runs no graph search: streets are straight segments validated in place, so a settlement with two-thirds more buildings plans faster than the old one did (48-66ms against 95-152ms on the flat-ground benchmark). Terrain still refuses what will not fit, and a block whose parcels were all refused is left unpaved.

This is a bounded block grammar, not a reconstruction of cadastral plans. There are no walls, no built gate structures, no suburbs and no growth over time. Cultural families with no researched entry get an explicitly fictional generic fabric. Worlds pinned to `urbanRevision: 1` keep the earlier composition in `src/world/v3/urban-v1.ts`; no migration was added. See `CITY_ART.md` for art ownership, evidence and verification.
