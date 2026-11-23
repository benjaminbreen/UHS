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
The planner fixes a straight stretch across each gate road and joins those
stretches around the buildable edge. The same outline bounds the town’s lots.
Towers mark substantial turns and divide long runs into roughly equal bays.
Water can interrupt a run. Only the central site of a multi-quarter city gets a circuit.
The straight and diagonal runs share their materials and parapet. The material
also picks the towers and gate, from a slate-roofed masonry turret to a tiled
pavilion over grey brick or a lotus-bud tower over laterite. Mississippian mound
towns have upright-log stockades with projecting square bastions flanking open
entries. Cahokia’s early precinct is open before 1100, and Moundville’s before
1200. The timber walk and stairs are reconstructions for play.
`urbanGates` fixes each regional approach by site identity. Where its end lacks
room for both jambs, the gate moves inward along the same road. Each built
gateway records its street opening, outward direction, jambs and whether a
walk crosses overhead. Covered gates span either street axis. The night
leaves close the road below while the watch can still cross above.

Precincts take a street frontage before the surrounding lots are filled.
The amphitheatre seeks an outer street with access to its south passage,
the ballcourt takes an end entrance and markets keep a clear approach to
their aisles. A magistrate’s yamen and a Mexica tecpan can reserve a court
in front of their existing hall. The settlement tries smaller footprints
when streets, water, neighboring precincts or a change of more than one
terrain tier rule out the larger site. Each accepted plot records its street
and entrance. The district town sheet draws the approach in gold.

A castle ward takes a street frontage with room on both sides of its gate.
A secondary lane can bend around the estate. The battlements follow the
outside face around each turn, with a lower kerb facing the yard. Gatehouses,
towers and stairs share the town's wall walk. A paved cartway connects the
gate to the hall steps. Where space permits, a branch serves a courtyard
well or an enterable byre. Larger wards can have a chamfered corner.

Parts of Britain and northern France can generate a hall-keep in 1100–1199
or a great hall in 1200–1499. London favors the waterside edge of the town
wall. Its early keep has a bridged ditch at the entrance. From 1280 the
London ward cuts a wet moat along the available perimeter. Conwy seeks a
rise near the water from 1287 and bridges a dry ditch. In the lower Nile
(1250–1516) and Levant (1260–1516), a citadel can enclose a flat-roofed
audience hall. A paved forecourt outside the gate leads to the stone court
and its dark border inside. London, Conwy, Cairo, Aleppo and Damascus request
their ward whenever the date fits. Other eligible large towns vary by seed.
These are regional interpretations fitted to the game map. [Historic Royal Palaces on the Tower moat](https://www.hrp.org.uk/tower-of-london/history-and-stories/9-surprising-facts-about-the-tower-of-london-moat/) · [Cadw on Conwy Castle](https://cadwpublic-api.azurewebsites.net/reports/sam/FullReport?id=3411) · [The Citadel of Aleppo](https://www.archnet.org/publications/5216)

At Versailles (1701–1789), two gallery wings join the state apartments around
an east-facing forecourt. Its marble threshold leads to a projecting entrance;
a terrace wraps around to paired pools and box parterres on the western axis.
The three public doors lead into the Guard Room and the north and south state apartments.
At Sceaux (1673–1789), detached service pavilions frame a shorter court and the
garden has flower beds. Other northern French towns can draw the country-house
form in this period. Both plans fit the available dry frontage; the seed varies
the forecourt depth, pavilion spacing and planting. These are game-scale
interpretations. [Versailles gardens](https://en.chateauversailles.fr/gardens-and-groves)
and [the historic park of Sceaux](https://domaine-de-sceaux.hauts-de-seine.fr/le-domaine/le-parc-de-sceaux/le-parc-historique).

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

Western Zhou farms and villages in the northern Yellow River region use an
inferred household layout. Thatched timber-and-earth houses open onto swept
ground with a millet mortar and a gathering basket where space permits.
Household beds grow millet or beans behind low earthen walls or wattle.

In Oaxaca and other towns using the same courtyard shop kit, the planner
favours fronts used less often by neighbouring shops of the same size. Oaxaca
has a cut-stone doorway, a taller arched doorway and a low shop with its
counter on the left.

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
  in a city with a business district rows stand closer, at most eight cells
  behind a footprint, and a tall front rises over the street behind it: it
  keeps a street's width clear at its back, and the row across the next
  street stands under its roofline. A tower counts by its footprint alone.
  Lanes join one row street to the next. A new street is laid only where it
  meets another at both ends, or at one end as a close that serves a row;
  ground against a shore or the town's edge takes a dead-end street from the
  one street it has.
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
  cut to the depth of downtown buildings where the city has a downtown.
  Looks have narrow forms for that frontage: the six-storey tenement on a
  25-foot lot and the loft building (`walkup` and `brick`, `cottage` and
  `hut`), and slim towers seven cells wide (`deco`, `bubble`, `slab`,
  `tropic`, `shop`).
- **A site short of land.** Where under 45% of a city's claim can be built
  on (an island, a point, a strip between rivers), the site is centred on
  its buildable ground (`settlements.ts`) and built tight (`landShare` in
  `urban.ts`): three-cell avenues without verges, no extra squares or
  diagonals, a smaller square, a third of the parks, no railway across it,
  a centre that is 42% of the way out and no ring of houses on lawns. If its
  fabric is a grid, its streets are one even lattice (`lattice` on the form,
  `layRows` in `blocks.ts`): avenues at the block's width, cross streets a
  row apart, each run stopping at the shore, and one row to each block.
- Manhattan is drawn a quarter wider than the atlas has it (`manhattan-land`
  in `regions/north-america.ts`), most of it taken from the Hudson, so its
  avenues fit. The local lower-Hudson water polygon from 1850 gives the working waterfront a navigable channel on its west side. The region map still shows the atlas's island.
- **Edo fishing landings.** A graded earth approach with timber edging leads to a short plank stage. The household’s wasen rides alongside on a slack line. Open bays in the gear store hold rope and sculls. Net rails and sorting trays stand on worn earth, with carrying baskets and a hooped tub where the yard has room. Fishers board from the end of the stage. Where the yard has room, a fishmonger trades named fish and salt at an indigo-curtained counter from 06:00 to 18:00. A full tray lowers the price for that species. At the open-sided reed shed, one measure of salt cures up to three fish of one species in six game hours. The fish remain on the rack until collected. Shore workers draw their own lots from household fish stocks and take the cured fish to the counter.
- **Docklands.** An industrial city of 100,000 or a waterside port of 20,000 or more (`docklands`
  in `content/settlements/waterfronts.ts`) has a built shore instead of a
  beach or fishing landing. `bulkhead` in `v3/shoreline.ts` reads the natural
  shore off a 12-cell lattice, which straightens it into runs at the coast's
  own angle, and runs timber piers out from it square to the grid, 28 cells
  apart, 20 cells long or 12 where the water is narrow. The environment takes
  that as the place's water distance, so everything downstream sees the made
  shore. It covers the city's own map, on ground joined to the centre: a far
  bank and a stream too narrow to berth in keep their natural banks. Behind
  the wall is a 3.75-cell apron of granite setts, level with the ground back
  to the first terrace; nothing is built within four cells of the water, as
  on any shore. In ports after the regional onset of industrialisation
  from 1885 through 1955, two suitable neighbouring east- or west-facing piers
  can take a working ferry house and sawtooth freight shed. Cast-iron railings
  line the front and back of the ferry court. Face the swing gate and press F
  to open or close it. At the booth, F buys a printed ferry ticket for one unit
  of local currency. The conductor takes one ticket on the outward crossing.
  The return is free. A flat-roofed dispatch store fits where the yard has room. The crossing requires
  a reachable far bank and the coaster needs room to clear the pier and turn upriver.
  A double-ended ferry calls every ten minutes, with four minutes alongside.
  Travellers board at either landing. Longshore workers carry freight between
  the crane and the warehouse. The hourly grain consignment passes from the
  cargo sling to warehouse stock and then to the freight wagon. The crane
  takes six cases per call from the open hatch, slews over the pier and lowers
  each onto the growing stack. The warehouse tally advances when the sling
  lets go. A platform truck beside the siding carries the outgoing cases until
  the wagon departs. A wheelbarrow stands by the loading doors. Where there
  is room, a delivery truck collects consignments outside dispatch. Other motor-era docks
  can have a concrete loading bay at the landward end of a pier. The pre-1950
  truck has a bonnet and canvas body. The later truck has a forward cab and
  ribbed freight box. Both vary in wheelbase and paint by seed and turn through
  eight headings. A clear route to a nearby building gives the lorry driver a
  delivery round. The driver walks from the cab to the tailboard, transfers
  grain, and spends about an hour inside the receiving building. At an
  unattended cab, F takes the truck. Movement keys steer and F parks it.
  The load stays aboard when the player takes over.
  Players can work the sling or take the crossing at the
  departures board. A double-track yard serves the warehouse. The railheads,
  tie plates and worn timber sleepers sit flush with the quay setts. Iron
  bollards stand on the coping between piers. Wheel-polished stone runs from
  the pier and siding to the dispatch doors and the street. The loading banks
  and ferry walk have raised granite curbs with lowered crossings. Stone
  channels take runoff through iron grates toward the quay. Where a nearby main line leaves room,
  a curved lead joins the yard.
  A dockworker starts on the freight apron.
- A single industrial pier can serve freight from 1885 onward. The coaster needs clear water alongside and room to turn inside the local map. A transit shed, weighing scales and mooring piles serve the berth. The crane unloads six grain cases an hour. The grain factor sells from the warehouse consignment. Where a delivery route fits, half the incoming grain goes to road collection. A suitable pair of steam-era piers can also serve the municipal ferry and rail siding.
- Southern Mesopotamian river settlements from 3000 to 1200 BCE can have a reed-shaded copper weighing bench and a beer seller by a moored boat. The beer stand occupies a curved reed shelter. Brick steps descend to timber fenders, where a boat ties broadside if the riverbed permits. On the Nile from 2055 to 1070 BCE, limestone steps serve paired grain bins and a shaded linen bench. Workshop frontage, awnings, quay setback and stair runs vary by seed. The copper balance tips on its cords and the linen seller’s hem lifts in the breeze. The stocks on the bench thin as the shop sells out. Where the aisle leaves room, the player can sit on a rush mat beside the beer jug or the linen seller’s spindle. The raised apron keeps seasonal floodwater out of the working space between the counters and the landing. Each merchant trades from their own counter during the day and collects stock from the landing on a morning round. At Ur the channel, pier and stalls are reconstructions. The copper trade is attested in [Nanni’s complaint](https://www.britishmuseum.org/collection/object/W_1953-0411-71), and the [Ur III ration accounts](https://www.metmuseum.org/art/collection/search/327069) record beer.
- A population-weighted random start can draw a waterfront neighbourhood within its original catchment. Towns try a nearby bank on 12% of draws and rural settlements on 24%. At dated freight ports the first 8% of town draws select the working terminal. Fishers, boatbuilders and dockworkers also seek a suitable bank when their profession is drawn elsewhere in the catchment. These are modelling estimates. Local water, settlement form, available work and buildable shore determine the result. Fishers share these places with households in other trades. Their boats, gear, fish species and houses follow local profiles, including freshwater landings such as Mwanza Gulf. A shore merchant can trade at a sorting table where the landing has space. Lake Victoria yields native tilapia and catfish before introduced Nile perch enter its catch in the twentieth century. [Lake Victoria fisheries survey](https://www.fao.org/4/t0336e/T0336E02.htm)
- Dated terminal districts in `content/geography/regions/ports.ts` cover Ensenada, Detroit, Elizabeth, Mumbai, Singapore, Durban, Mombasa, Hamburg, Busan, Santos and Rotterdam. Detroit uses a river berth with steel coils on timber chocks, a crewed crane and road collection.
- Rotterdam has a reconstructed section of Eemhaven from 1967 and Maasvlakte II
  from 2015. Each has a straight quay and turning basin. An eight-heading
  feeder brings three containers of bagged grain per hourly call. The crane
  transfers each load through its spreader to a tractor and chassis at
  Eemhaven or an electric guided vehicle at Maasvlakte II. Row B receives
  the boxes. A road delivery round, where a route fits, draws its stock from
  the yard. The manifest desk reports receipts. Dockworkers muster there
  and check the load at row B. The two layouts represent working districts
  at game scale. [ECT](https://www.ect.nl/en/about-us/60-years-milestones)
  and [APM Terminals](https://www.apmterminals.com/en/maasvlakte/about/our-terminal)
  document the terminal opening dates and equipment.
- `npx tsx scripts/town-sheet/density.ts "New York 1930" "Chicago 1950"`
  counts a generated city's buildings, tall buildings, towers and strip
  shops over the whole map. Run it before and after changing layout.
- Where a city of 1900 to 1960 stands in the Iberian or Italian world, its
  pack carries the older house of the place (`casaLook`) beside the modern
  kit, and its housing and shop streets are built of that house; downtown,
  estates and works take the modern buildings. The United States roadside
  kit is built only north of Mexico, and there only in a town with no
  downtown, or after 1945 in a city's outer ring.
- A Southeast Asian town before its industry is built of shop-house rows
  (`straitsHouses`, the fronts of its date); once zoned, the same looks come
  by block from `street-looks.ts`, with the Shanghai lane house for the
  treaty ports' housing. Estates and self-built
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
  solid `monument` the player can drive. Someone else's is locked: the window
  is smashed with anything held that can strike, and a car thief works the
  lock quietly. A taxi driver, chauffeur, lorry driver or mechanic starts
  beside a car of their own, a car thief beside someone else's; when none is
  parked near the door, generation parks one there.

### Hospitals, schools and civic buildings

Hospital interiors share the palace row planner. The regional worksite determines whether the entrance leads into an infirmary hall, a corridor serving wards, or a courtyard with rooms on several sides. Edo wards have sleeping mats, Sri Lankan monastic hospitals have individual patient rooms, and modern wards have wheeled beds and a clean utility room. Board schools and modern day schools use the corridor plan for classrooms and a teachers’ room. The rooms share one walkable floor behind the building’s street door.

China’s yamen, Korea’s dongheon, Japan’s town magistracy and the Mughal kotwali open onto a public court with a hearing hall or watch office, a clerks’ room and records. A covered bazaar has a shared lane, raised counters for cloth and pottery, and a goods store. These use the town square’s dated civic building. Where the regional building set has no separate hall facade, a local compound houses it. Visitors come during opening hours.

### Sacred buildings

The building’s regional and dated worship profile determines where its street door leads. A Gothic parish opens through a porch into a nave. A Maghrebi mosque has a washing court and rows facing a prayer niche. In a Sephardi synagogue the court leads to a prayer hall and a room for study. A Punjabi gurdwara has a canopied scripture and a kitchen for the shared meal. At a Buddhist stupa the player walks around the solid relic mound under the open sky.

Cities and ports can reserve street plots for one or two more congregations. The planner considers the local population shares, the worship buildings and schools attested for that place and year, and the size of the built district. Each congregation needs a plot with a street approach. A smaller community in modern London can use an adapted hall. Two temples in medieval Japan can belong to different schools. A large district can also support another parish church or neighbourhood mosque serving the same tradition. Residents choose the nearer suitable door for personal worship.

A sanctuary hires from compatible religious offices. Residents with a matching tradition can take part in its rites, and other visitors can stay quietly or share an open meal. In medieval Japan a temple’s school determines which monks can work there and whether the congregation chants the nembutsu or hears the Lotus Sutra.

Local residents gather at the times set for each building. A reader can stand at the reading desk, neighbours wash before prayer, and volunteers serve food in the community kitchen. There are fewer people between gatherings, and a building can be empty. Friday prayers, Sabbath readings and Sunday worship use the game’s weekday clock. Service hours are approximate.

Walk within earshot of a reader or singer in the same room to see their words in a dialogue toast. Short English translations follow the passage in order, with a scripture reference beside the speaker’s name. The next line comes after 10–20 seconds of real time. On Sangrand the gurdwara’s singers take their words from the stanza of Guru Nanak’s *Barah Maha* for the local solar month.

Use **E** beside a free seat to sit and listen to a nearby reading or hymn. In a standing nave you can listen from the aisle. An open place on a prayer rug lets you join an assembled mosque row. Walk away or use **E** again to leave. In a gurdwara kitchen, free your hands to serve. Passing out bowls takes five minutes and gives a diner a helping.

### A building drawn as a shop is a shop

`shopArt(frame)` (`src/content/graphics/models.ts`) says what a frame's art
shows at its street door: a business it names (a `business` in its recipe:
"cafe", "bakery", "gas station"), an unnamed "shop" (a sign board, a period
shop, a shop or stall form), or nothing for a house. The planner follows it:

- The lot is open to the public, never a household's private door.
- Its keeper is asked for by trade: `KEEPERS` (`signs.ts`) lists who keeps a
  named business, likeliest first, and takes the first the place and date
  have; an unnamed shop draws from `SHOP_TRADES`. Field and herd work is
  never drawn for one, and local work assignment leaves a keeper in their
  shop.
- A named business is called what it is ("Cafe"); an unnamed one is the
  keeper's shop ("Baker's shop"). Inns, taverns, pubs, hotels and motels
  take a proper name instead (`establishmentName`, `inn-names.ts`): an inn
  sign in the local tongue from 1100 ("The White Hart", "Zum Löwen"), a
  Roman painted sign before 500, a founder for a caravanserai or han, a yagō
  in Japan, an auspicious name for a Chinese inn, the town for a post
  station. No two in a town share a name.
- Inside, one person minds the counter from 08:00 to 18:00: the keeper if
  they are in and well, else the first grown member of the household who is.
  They sell the goods of the shop's kind (`shopKinds` in
  `content/interiors/shops.ts`) as well as their own trade's goods. The rest
  of the household stays in the rooms behind. The shop is fitted as shops
  were: stock along the back wall, clear of the windows, a long counter
  across the room with the keeper's walk behind it, and the floor in front
  left open, anything set out on it against the side walls. A few of the
  trade's goods sit on the counter. A tobacconist and an apothecary keep
  their stock in banks of drawers you can pull out, and an apothecary shows
  its globes in the window. The windows of a shop room go to the ends
  of its back wall, and stock may stand right beside a doorway. A grocer
  from 1890 and a Roman bar are fitted from hand-drawn pieces
  (`src/render/interiors/fits/`): wall units with goods stood on their
  shelves, a drawn counter with a few large things on it, and floor groups
  by the door. From 1700 a shop in a shuttered house has glazed,
  curtained windows. A North American
  tobacconist from 1840 to 1930 has a carved cigar-store Indian by the door,
  and a British one from 1720 to 1900 a snuff-taking Highlander.
- The first sign board is the keeper's own: the business the art names, else
  `keeperTrade` of the keeper's work. The other boards are neighbours. A
  ruin or a lot with nobody keeping it has none.
- A venue is not housed behind a front that names another business, and the
  player's own home is not a shop unless they keep one.

A household whose work is in the fields or with the herd keeps no workshop
at home, and a private home is named "Household", never a store.

### Inside a house

A building's rooms are planned from its profile (`content/interiors/`) and
from the building as it stands on the map: `buildInterior` passes its storeys
(the model's `stories`) and the ground it covers to `planBuilding`
(`src/render/interiors/building.ts`).

- A household's rooms are its profile's sizes and a little over (more for a
  richer household), and larger again, never smaller, in a building that
  covers more ground. Shops and public rooms keep the size their trade needs.
- Rooms stand apart. Neighbours are three columns from one another with dark
  between, joined by a short neck two rows wide with a post at each mouth.
  Rooms round a court still share a wall, as do a room and the one behind it.
- A building of two storeys or more sleeps upstairs, on the same map as the
  ground floor, three floors drawn at most. Each floor stands seven rows
  clear of the one below, straight above it, and is reached by a railed
  flight in its own neck that leaves by the back wall of the room below.
- A household's upper floor is a landing with a chamber to either side: its
  own, with the bedstead, press and rug, and a second with two single beds.
  A third floor is a garret with one plain bed and stores. An inn's upper
  floor is a gallery with its guest chambers in a row behind it, parted in
  the middle where the next flight goes up between them.
- With three or more rooms downstairs, two houses in three (by seed) of a
  profile of four rooms or more, the poorest excepted, have a passage from
  the street door with the rooms opening off either side, the kitchen and
  stores at the far end. The others keep their rooms in a row.
- A room is furnished for what it is. The household eats in its kitchen or
  hall, so only that room has the laid table; a front room has a settle, a
  rug and a writing desk; a hearth has its firewood and a seat to either
  side. Each room is planned from its own seed, so two rooms of one kind
  differ. A small piece shut in by others on every side is left out.
- Courtyard houses, temples, hospitals and the grand inns with their own
  corridor plans are not given upper floors yet.

`npm run capture:interiors -- storeys` draws the same houses and an inn in
buildings of one, two and three storeys; `-- homes` draws four European
houses room by room.

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


### Sail and lighterage

In Amsterdam from 1600 through 1799, a grain porter starts on the quay. A
three-masted fluyt lies within sight of the landing with its sails furled. An
open lighter rows alongside, takes three sacks at a time from the day’s
shipment and lands them on timber skids. The first sack is already ashore
when play begins. A paved route leads to a gabled warehouse where the porter can hook a sack onto the
hoist for one coin. The warehouse factor sells from the loft. The quayside
bakery draws a sack from that same stock to bake eight loaves. Shoppers and
local households use the bakery counter. When the grain and bread run out,
households without another supplier go short. The grocer sells pepper by the
measure from separate East Indies consignments, replenished every fourth
morning. Both shop counters open from 06:00 to 18:00.

From 1611 the Amsterdam Beurs has a public merchants’ court, freight arcade,
share desk and lenders’ arcade. Press **G** or **T** inside, or tap **Trade** on a phone.
Three brokers quote Baltic grain, black pepper and portions of Dutch East
India Company stock. Buying goods reserves them in the warehouse. Sell a
receipt back or collect its goods. Two private lenders offer different
principals and daily fees. At the freight desk, hire on to carry a sack or
book the next delivery. Five-minute price calls and small lots are gameplay
conventions. The numbered meeting places and mix of commodities, shares and
credit draw on the [Amsterdam City Archives’ account of the Beurs](https://www.amsterdam.nl/stadsarchief/canon/venster/11/).

The same lighter service lands grain at Rotterdam and Hamburg and incoming cloth
at Gdańsk and Riga from 1600 through 1799. A western Indian Ocean merchant
landing uses a lateen dhow and carries cloth in bales. At an existing dhow yard
the yard’s store receives the bales. Opening a bale adds three saleable bolts.

#### Market squares

In European towns and ports from 1650 through 1913, a public market quotes
grain by the sack and sheep and cattle by the head. A corn factor can sell
grain from their pack. Buying an animal changes ownership of the animal in
the square. A drover can sell individual animals from a flock brought within
reach. Inland markets receive weekly grain consignments. At a grain quay, the
board lists sacks from the warehouse hoist. Local grain processors and traders
draw on the same sacks. Prices, lot sizes,
working fees and the shared square layout are game-scale reconstructions.
King’s Lynn and inland Stamford are playable market towns. [West Norfolk market history](https://www.west-norfolk.gov.uk/info/20186/markets/407/history_of_markets)

In Osaka from 1730 through 1868, the Dōjima street market trades spot rice
bills redeemable for stored rice. In Surat, Muscat, Mombasa and Zanzibar from
1600 through 1849, merchants quote cotton cloth and pepper. Where the lighter
lands cloth, the brokers and shore merchant draw on the same stock. Near a
market counter, press **G** or tap **Trade** to see prices, trade or earn a fee
for weighing a consignment or counting livestock. [Japan Exchange Group on Dōjima](https://www.jpx.co.jp/dojima/en/index.html)

#### Dhow yards

A coastal dhow yard with enough clear water can support a trading dhow offshore
and an open lighter beside the launching way. The planner checks the sailing
circuit and the walk from the landing to the yard store. Both boats have a
named pilot, an inventory and eight headings. Hull finish and sheer vary by
seed. Sailcloth and its ties vary independently, with a locally common cloth
for each cultural family and century. Rigging, people and cloth bales are separate layers.

The lighter discharges onto timber skids. A footpath leads to a measuring counter
under a canvas awning beside the boatyard store. A porter carries the tied bales
inland. The cloth merchant opens a bale into three saleable bolts when the
counter runs out. Anyone at the counter can open another. The tied bundles
and open fabric on display follow its stock. Inspect the counter or merchant
from 06:00 to 18:00 to trade. Retail sales draw from the till and shelves.
The town's hourly cloth imports draw from those same bolts during trading hours.

A porter's Today card guides them to the lighter landing and then the counter.
An empty landing lets them wait for the next crewed delivery. Anyone can carry
a bale for a fee, take
the lighter out, transfer to the dhow alongside, or land the cargo themselves.
Inspect the vessel to see the available actions. Near the landing, stepping
ashore leaves the boat at its mooring.
