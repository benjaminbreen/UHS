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
