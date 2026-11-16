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

`blocks.ts` partitions a town into gates,
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
props out in whatever rectangle is left. A European city from 1850 makes
most such ground a railed garden square (lawn, a gravel walk, planes, benches,
a statue) and keeps no kitchen plots, pens or threshing floors.

### Industrial and motor-age cities

- **Street-wall cores.** Once a region has industrialised (`modernity.ts`) and
  the town is not plotted, `siteForm` sets `streetWall` and the town is laid
  block first (`layRows` in `blocks.ts`). Doors only ever face south, so a
  block is one row of houses. Each piece of ground between the main streets
  is cut, from its south street up, into a main row, then either a street
  and another main row or an alley and the low row of mews, workshops or
  back houses that fronts it (`alleys` on the fabric is the share of row
  streets that are alleys). A row is as deep as its ring's houses are drawn
  plus their back yards (`rowDepth` in `urban.ts`, `backs` on the fabric);
  lanes join one row street to the next. A new street is laid only where it
  meets another at both ends, or at one end as a close that serves a row.
  The avenues stand far enough apart for a street and an alley between them.
- **The square** of a row city is a block at the corner of the two main
  streets (`cornerSquare`), not a ring road; rows bring their own streets to
  its other sides. A court or market takes one of the row blocks.
- **Square kinds.** In a city of kerbed streets `squareKind`
  (`src/content/settlements/plaza.ts`) says how the main square is built and
  meets its streets, by modernity region and date. A `place` (continental
  Europe, the Soviet square, East Asia) is paved out over the footway and
  verge to its own kerb (`reachKerb` in `plan.ts`), the street's trees
  standing on it. A `garden` is four lawns between cross walks round the
  centrepiece (`gardenSquare`): railed with a gate on each walk in Britain
  and Australasia before 1940, open with a paved walk round the lawns in
  the Americas, southern Africa and South and Southeast Asia. Elsewhere,
  and in every older town, the square is open ground running into its
  streets. What stands on it still comes from `PlazaKit`.
- **The station** takes the top of a quarter under the railway, where one is
  deep enough: its own block and street, the ground either side left open
  for the goods yard and the cab stand. Its forecourt is as wide as the
  drive needs, with two planted beds for the cabs to turn round
  (`carriageLoop` in `urban.ts`).
- **Yards and lots.** A row house holds the ground behind it to the back of
  its block as a fenced yard (`UrbanLot.garden`). Ground left over is cut
  into rectangular plots (`plots` in `plan.ts`), and each gets a use from
  what stands beside it (`planLot` with a `LotNeighbour`): a goods yard or
  cab stand by the station, a coal or timber yard by the works, a
  tradesman's yard or railed garden among shops, a drying court, allotment
  or garden square among houses, a green or waste ground where nothing is
  near. Unbuilt ground is grass, never street stone. An old core the city
  grew round keeps its lanes, and older towns are laid as before (streets
  first, blocks read off the ground).
- A row takes the land use of its ring (`ringOf`), so its houses fit its
  depth; a house whose roof would stand more than a cell over the walk
  behind is not offered to it, and a block none fit stays open ground. A
  zoned row city always has one works block, out toward its edge.
- A boulevard-age European city's venues stand a whole block behind the
  square, and from 1850 a market ground keeps a third of the town's
  half-width away from it.

- `modernity.ts` dates two onsets per region: industry and mass car ownership.
- After the industrial onset a city levels its site (`townTerraces` in
  `plan.ts`): rises and hollows go to the city's commonest level. Only a hill
  covering a sixth of the town, and the low margin along water, keep a step.
  A metropolis is several overlapping sites; `generate.ts` grades them in
  rank order (`townGrade`), largest first, so its quarters share one ground.
- **Districts.** `zoning.ts` holds each region's housing and shares;
  `landUseOf` in `urban.ts` gives every block a use from where it stands.
  The whole city is on the map, suburbs and all, so its rings are thinner
  than life (`rings`): the centre is the inner 30% of the way out, larger
  than true so the core still reads as dense, and is a downtown where the
  city is old and big enough; the housing built before cars (`inner`) takes
  what its years are of the city's industrial age, between 30% and 60% of
  the rest; beyond it is the later housing (`outer`), detached houses on
  lawns in most regions. Works take the region's share of blocks along the
  railway, nearest the edge first, or a sector toward the water where there
  is no line (`worksBlocks`). Shops follow the main streets and thin
  outward. A city of any size has a park or two, and the housing blocks
  beside one, away from the works, are `villa`. Villa and suburb blocks
  build houses in gardens (`front_homes.py`): one kind of house to a block
  in all its colours, the kind chosen by place and date in
  `street-looks.ts`, a drive's width between neighbours, and nothing else
  built into the gaps. Frontage a block's rows left over is built in the
  place's street looks too, where it has them, and the centre's blocks are
  cut to the depth of downtown buildings where the city has a downtown. Estates and self-built
  quarters come by date and share as before. A quarter standing apart from
  the middle, and the town of a suburb map, has shops but no downtown.
- A city of a million claims 184 cells of its map's 192 and is built out to
  150 cells at a million people, 180 from four (`urbanRadius`).
  Its centre stays within 16 cells of the map's middle, so it does not run
  off one side and leave the other empty. A city of street walls, like one
  of cars, is laid out on all four sides of its core and in the corners
  between (`allRound` in `blocks.ts`); an older town grows only the
  extensions its fabric lists.
  The head count is the gazetteer's, scaled to the date. The curated
  anchors (London, Paris, Rome) carry none, so theirs comes from the series
  in `city-populations.ts`; an anchor with no row there at the date is built
  as a small town.
- No trade stands more than a few times in one city (`repeats`).
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
- `src/render/street-raster.ts` draws the kerb (`kerbTone`) as a stone seen
  from above and a little from the south: its top is the footway's last four
  pixels, and on the road lie as much of its front as faces south (three
  pixels due south, none at the sides, so a corner turns smoothly), a dark
  line at its foot and its shadow to the south and east. A kerbed sett or
  brick carriageway is drawn darker than its footway, its channel is one
  course in the road's own stone, and a lane under 28 pixels wide has none.
  A square is framed with a course of kerb stones wherever a made street
  lies beyond its walk; an older square still runs into its lanes unframed.
- Block corners are quarter circles (`streetUnionDistance` in
  `street-geometry.ts`, wider where the street is marked for cars), and the
  footway, kerb and gutter are all measured from that one line, so they turn
  together. A lamp, a tree pit or a paved verge inside a street's walk is
  drawn with the street; ground that is not the street's own (a square, a
  grass verge, a garden) carries `edge` geometry and gets only the kerb's
  top where it falls there (`kerbEdgePixel`).
- A city of rows has no diagonal avenues: they ran into the square and left
  scraps on both sides.
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

## Checks

- `npm run town:sheet` before and after layout or yard changes.
  `-- --square <names>` crops each to its main square and writes them side
  by side to `artifacts/towns/squares.png`.
- `npx tsx scripts/check-settlements.ts` and `npx tsx scripts/check-cities.ts`.
- `npm run capture:terrain -- cities` (also `streets`, `placements`).
- Tests: `settlements`, `urban`, `urban-form`, `road-network`,
  `regional-roads`, `street-rendering`, `city-panel`.
