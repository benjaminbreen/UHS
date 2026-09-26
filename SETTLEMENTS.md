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

## Modern cities are not one city

`modernBuildings` in `src/content/geography/pack.ts` picks the kit by region:
shophouse arcades across East, Southeast and South Asia, a balconied walk-up
around the Mediterranean and in Latin America, a corrugated veranda house
wherever the rain is heavy, concrete everywhere.

Inside the plan, `preferStyle` in `src/world/v3/urban.ts` sorts them by
quarter — concrete in the centre, arcades on the trading streets, sheet-metal
houses at the edge. That gradient is the whole difference between a street in
Java and a street in Ohio.

The `candidate-modern-*` infill kit is mid-century American (DINER, DONUTS, RX,
a gas station) and is now gated to US cities. Everywhere else the gaps are
filled from the city's own small forms, thinned toward the edge the way an
older town is — without that thinning, 3x2 stalls stand shoulder to shoulder
from the square to the boundary.

## Industrial-age cities grow in rings

`src/content/settlements/modernity.ts` dates two onsets per region: when mills
and railways began to shape towns, and when mass car ownership did. Nothing
else in this section applies before the first.

After it, `src/content/settlements/zoning.ts` gives each block of a city a land
use: the old centre is rebuilt as a downtown a set number of years after the
onset; one sector, toward the water or the bridge, is factories and yards; the
rest is housing in the idiom of the date its ring was laid out: `inner` before
the motor onset (terraces, tenements), `outer` after it (suburbs), with a share
of estates and, where the region had them, self-built quarters at the edge. The
ring's date comes from its distance from the centre and from which of the
fabric's districts it lies in, since `districts` are listed oldest first.
Every placed building carries its `landUse`.

In the motor age a city also sprawls: `form.motor` adds districts on all four
sides and in the corners between them, so a metropolis fills its map rather
than making a cross. Open-air market precincts give way to shops at the
industrial onset (one market) and disappear at the motor onset.

A gazetteer village of three thousand or more in an industrialised region is
ranked a town (`settingFor`), and a travel tile takes the population of the
gazetteer place standing on it, so a tile named for a suburb is built as part of
its city. Until the modern buildings are redrawn, each land use builds from the
existing kit forms listed in `FORMS` in `src/world/v3/urban.ts`.

## Carriageways and their paint

A motor-age city lays its streets at `MOTOR_SPANS` in
`src/content/settlements/streets/markings.ts` (ten cells for an arterial: a
two-cell parking lane each side of two travel lanes), wide enough for a car.
Each paved cell of a straight composed street records a `Lane`: its axis, its
place across the road, the road's width, whether it is a junction, and within
three cells of one which way the junction lies. `roadMarkings` chooses the
paint by place and date: driving side, centre line, crossing type, gutter and
whether the outer lanes are for parking. Streets before 1915, or where no rule
applies, are guttered but unmarked.

`src/render/carriageway.ts` draws from that alone, pixel by pixel in world
coordinates: gutter pans or sett channels with drain grates, manholes centred
in a lane, wheel-polished tracks and oil down the middle, flaking paint,
crossings and stop lines on the approach side for the driving side, parking
ticks. Country roads in the motor age are asphalt with a painted centre line
(`blacktopPixel`); farm lanes stay earth.

Cars park one to a `STALL` in the parking lanes, facing the way traffic runs
on their side, chosen from `src/content/settlements/vehicles.ts`: a weighted
pool per region whose models come and go with their dates and linger a decade
and a half after. `parkingShare` fills a few stalls in the first motoring
years and most of them after the motor onset. A parked car is an inspectable
`monument` whose cells are solid.

## Shop signs

The word over a shop door is drawn at runtime, not baked into the atlas. The
building art paints the board and publishes its rect and its paint colour as
`signBand` and `signPaint`; `src/render/sign-texture.ts` draws the lettering
into a canvas texture cached by word and ink, and `WorldScene.addBuildingSign`
hangs it on the facade the way the roof fan is hung.

That split is the whole point: baking the text meant one sprite was one word
for ever, so the entire game had twelve of them.

- **The word** comes from `src/content/settlements/signs.ts`: the trade, in the
  language the street writes in, shortest form first, and the caller takes the
  first that fits its board. A narrow frontage says PAIN where a wide one says
  BOULANGER.
- **The name** is the owner's, for the trades a family puts its own name over —
  a tailor is a person, a gas station is a brand. Generation already decides
  whether a culture and century give people family names, so a one-word name
  simply yields nothing.
- **The language** comes from culture, place and date. Turkish signs start in
  1928 because that is when the alphabet changed. Scripts the 3x5 font cannot
  draw — Chinese, Arabic, Devanagari, Thai — get no lettering at all; those
  streets hang their own painted boards from the prop kit, which is the right
  answer there anyway.
- **The ink** is black or cream by the luminance of the board it sits on. A
  dark ink on a dark board is the one failure that makes a sign unreadable.

`npx tsx scripts/capture-signs.ts` shoots three cities against the dev server
for review.
