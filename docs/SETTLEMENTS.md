# Settlements: layout, streets and towns

How the v3 planner lays out a settlement: profiles, roads, plots, fields,
town blocks, industrial and motor-age streets, signs and parked cars. Building
art is in the `building-art` skill; prop placement in
[PROPS.md](PROPS.md). Entry files: `src/world/v3/plan.ts` (the planner),
`src/world/v3/urban.ts` and `blocks.ts` (towns),
`src/content/settlements/` (data).

## How a settlement is planned

The planner builds each settlement once, before any chunk samples it: public
space and approaches, streets and crossings, plots and entrances, then
yards, fields and pens. Plots claim their ground before later features. A
failed fit is skipped; nothing overlaps to meet a quota. Plans expose
`occupied`, `access` and `clearance` claims that later layers (vegetation,
props) respect.

**Profiles.** `src/content/settlements/profiles.ts` has eight patterns:
band, encampment, farmstead, clustered, roadside, dense, planned,
waterfront. They set street arrangement, density, setbacks, commons, fields
and livestock. A setting's `settlementPattern` or `settlementLayout` (plots or
rows; `layout.ts`) can override the default.

### Planner modules

| Module | Owns |
|---|---|
| `v3/plan.ts` | Orchestration: public space, frontage, plots, entrances, work sites, rail stations |
| `v3/urban.ts` | Town parcels in blocks, walls and gates, land use, modern building choice (`preferStyle`, `FORMS`) |
| `v3/blocks.ts` | Pure geometry: gates, arterials, square, recursive blocks, the `Rail` line |
| `v3/farmland.ts` | Fields, enclosures, farm cells for the renderer |
| `v3/roads.ts` | Terrain-aware local roads and river crossings |
| `v3/trunk.ts` | Motorways and railways between towns |
| `v3/street-geometry.ts`, `street-network.ts`, `junctions.ts` | Street segments, lanes, junction approaches |
| `v3/railway.ts` | Town railway formation and the daily train working |
| `v3/sites.ts` | Roadside lots: gas, garage, motel, drive-in |
| `v3/waterfront.ts`, `worksites.ts`, `camps.ts` | Shores, workplaces, camps |
| `v3/population.ts`, `routines.ts`, `employment.ts` | Households, daily routines, jobs |
| `src/world/regional/transport.ts` | Regional routes between settlements |
| `src/core/routing.ts` | Weighted pathfinding; knows no world content |

### Roads

New worlds pin `roadRevision: 1`: regional neighbours join by a sparse graph,
routed in fixed batches so geometry does not depend on viewport order. Local
lanes and doors join real road centrelines, so junctions are continuous.
Bridges need land on both sides; open sea is never bridged. Generation
searches have explicit budgets; player routing is unchanged.

## Towns

New worlds pin `urbanRevision: 2`. `blocks.ts` partitions a town into gates,
arterials, a public square and recursively subdivided rectangular blocks; no
graph search runs. `urban.ts` fits parcels; a refused parcel leaves open
ground. Towns with a defensive circuit get walls, gatehouses and towers
(`urban.ts`, art from `build_city_walls` in `scripts/art/urban.py`).
`urbanGates` is keyed on site identity, so regional routes can aim at a gate
without composing the town.

Parameters come from `src/content/settlements/urban-form/`, one file per
region, chosen by cultural family, date and coordinates: block module, street
widths, regularity, courtyard and blind-alley shares, gate count, square
placement, wall material, storey cap. Each entry names its evidence and is
marked `inferred`. A family with no entry gets an explicitly generic fabric.
`scale.ts` turns a site's radius into a building count. `civic/` chooses
dated civic buildings; `yards.ts` and `wayside.ts` cover yards and roadside
features; `precincts.ts` courts, arenas and markets; `terraces.ts` how a town
holds up a step; `boundaries.ts` how walls and fences are built.
`lots.ts` gives ground a block left unbuilt a use from the place's facts
(gardens, fuel, drying, threshing, pens, burial ground, ruins) and lays its
props out in whatever rectangle is left.

### Industrial and motor-age cities

- `modernity.ts` dates two onsets per region: industry and mass car ownership.
- `zoning.ts` gives each block a land use after the industrial onset:
  downtown, a factory sector toward water, then housing rings dated by
  distance (`inner` before the motor onset, `outer` after), estates and
  self-built quarters. Every building carries its `landUse`. In the motor age
  `form.motor` adds districts on all sides.
- An industrial town gets a double-track railway past the old centre, a
  station block with a platform, level crossings, and a girder bridge over
  rivers up to `RAIL_BRIDGE` cells.
- `modern-buildings.ts` (`modernBuildings(setting, landUse)`) picks modern
  kits by region and land use; `preferStyle` grades them by quarter. Where it
  has none, the pack's flat-front kit (`modernFlatFrontKit` in
  `src/content/geography/pack.ts`, by region and climate) stands.

### Streets and paint

- `streets/` chooses surface by place and date (`industrial.ts`, `europe.ts`,
  `italy.ts`, `north-america.ts`), tram windows (`trams.ts`), signals and signs
  (`control.ts`), kerbs (`kerbside.ts`).
- `streets/markings.ts`: `MOTOR_SPANS` sets lane widths for motor-age
  streets, `BOULEVARD` for planted-median boulevards. Each paved cell records a
  `Lane`; `roadMarkings` picks the paint by place and date (driving side,
  centre line, crossings, parking). Streets before 1915 are unmarked.
- `src/render/carriageway.ts` draws from that alone: gutters, drains,
  manholes, wear, paint, crossings, parking ticks. Motor-age country roads are
  blacktop with a centre line (`blacktopPixel`).
- **Parked cars.** `vehicles.ts` holds a dated weighted pool per region;
  `parkingShare` sets how full the stalls are. A parked car is an inspectable,
  solid `monument`.

### Shop signs

The building art publishes where a sign may hang (`shopSigns`); lettering is
drawn at runtime by `src/render/shop-signs.ts`. `src/content/settlements/signs.ts`
picks the word by trade, language (by culture, place and date) and board
width, drops trades and words a decade has not reached (no RADIO before 1922),
and puts the owner's name on the trades that carry one. Arabic, Persian,
Hebrew, CJK, Devanagari and Bengali come from `sign-glyphs.generated.ts`
(built by `scripts/art/sign_glyphs.py` from `sign-words.json`); Latin and
Cyrillic use the 3x5 font in `sign-texture.ts`. A `band` slot letters a board
the painter drew itself, in the model's `signPaint`.

Before lettering, shops hang picture signs (`src/content/props/signage.ts`).
Once a street letters its fronts, only the marks that outlived the hanging
sign stay: inn, chemist, barber, pawnbroker, locksmith, tobacconist. A street
whose language is not written yet (Greece, Hungary, Romania, the Baltic,
Thailand and others) keeps every picture sign.

## Where to extend

Town form: an entry in `urban-form/`. Street look: `streets/`. A new
settlement feature: the planner module that owns its layer in the table above.
`plan.ts` is large; when you add to it, prefer moving a coherent piece into
its own module.

## Legacy and duplicates

Retiring or merging these is welcome; there are no saves to preserve:

- `v3/urban-v1.ts` (`urbanRevision: 1`).

## Checks

- `npm run town:sheet` before and after layout or yard changes.
- `npx tsx scripts/check-settlements.ts` and `npx tsx scripts/check-cities.ts`.
- `npm run capture:terrain -- cities` (also `streets`, `placements`).
- Tests: `settlements`, `urban`, `urban-form`, `road-network`,
  `regional-roads`, `street-rendering`, `city-panel`.
