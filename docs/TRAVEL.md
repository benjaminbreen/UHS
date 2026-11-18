# Travel: maps, borders and journeys

How the playable world is cut into maps, how the player crosses from one to
the next, and how long journeys work. Entry files:
`src/world/travel/network.ts` (map identity and exits),
`src/runtime/map-travel.ts` (live crossing, `journeyPlan`,
`prepareConnectedStart`), `src/world/travel/seams.ts` (borders).

## Maps

A playable map is one 384-tile square of the Earth atlas at native scale,
`tile:i,j` (`tileId`, `parseTile`, `permanentMap` in `network.ts`; the size is
`REGION_CELL` in `src/world/regional/context.ts`). A square is about 21 km
across. It is generated about its exact centre, and `permanentExits` gives
its four neighbours. The setting carries this as `playableMap` (size 304,
384 or 512). A square of open sea keeps a drawn ocean.

A square with no town of its own inside a great city's reach is not empty.
`metropolisNear` (`environment.ts`) finds the city: the squares touching one
of 400,000 people, two out from one of two million, three from one of six
(its series in `city-populations.ts` where it has one, else the gazetteer's
figure at the date).
Once the region has industrialised the square is a suburb (`suburb` on the
map, named "Suburbs east of ..."), a town with a few per cent of the city's
people, fewer in the outer rings, and no downtown (`suburbOf` on the
setting); before that it is settled country.

Fresh starts go through `prepareConnectedStart`. `travelSetting` turns a map
and its exits into a `WorldSetting`.

## Borders

A border is the same line of Earth seen from both sides, so coasts, rivers
and relief run straight across. `sampleSeam` in `seams.ts` records each
border's profile, and `boundaryWater` (`v3/boundary-water.ts`) joins water
across it; only the outer band blends.
`waterways.ts` and `water-edges.ts` match rivers across the edge;
`entrances.ts` first searches inward from the preferred border crossings,
using bounded path searches and checking movement in the travel direction. If
a search fails, one shared flood fill finds reachable alternatives or shores.
Each land border has one road
crossing (`roadAt` on its seam, the same point from both sides), and a
playable map's regional roads run to those crossings, not to settlements
imagined beyond its edge (`crossings` in `regional/transport.ts`): a road
that leaves one map arrives in the next. Where water lies between a town
and its crossing the road bridges each stretch of it; a few crossings
behind wide water still get no road. Trunk routes (`routes.ts`) live
in atlas coordinates so both sides of a border draw the same road or rail.

`MapTravel` in `map-travel.ts` handles a crossing: it prepares the
neighbour in the worker, puts the traveller at the matching point on the far
edge, keeps visited maps in the session, and holds one prepared destination
at a time. The traveller keeps personal seed, cultural context, concern and
home household; residents and scenery use the destination's. One weather seed,
`manifest.sky`, follows the journey.

On connected maps a gathering household can send one adult out along a walkable road to a food patch near the far entrance. The two local walks meet at that crossing. The same resident picks on the neighbouring map, walks the road back with the basket, and empties it at their own store. The trip runs on the game clock.

## Journeys

Choosing a point on the Earth map calls `journeyPlan`, which prices the route
with the H3 router (`src/world/travel/routing.ts`, `h3-js`) at 25 km a day
overland and 100 km a day by sea, and the days pass at once. H3 cells now
serve only this pricing.

## Names

A square is named for a town standing in it that year, else from a prebuilt
table of physical features (river mouths and confluences, lake shores, peaks,
ranges, bays, marshes) from Natural Earth and GeoNames, never from countries
or populated places. `resolveGeographicName` in `src/world/travel/naming.ts`
resolves it. Data: `npm run prepare:tile-names` writes
`src/content/geography/travel/generated/tile-names/`; `npm run
prepare:travel-names` builds the regional and ecoregion labels. Hand-written
regional names are in `src/content/geography/travel/`. Names are modern;
dated names would be a later layer.

## Previews

`resolveMapEnvironment` and `settingForTravelStop` in
`src/world/travel/environment.ts`, with `terrain-preview.ts`, build the
inputs for previewing a map without playing it.

## Where to extend

Live crossing changes go in `MapTravel`; border matching in `seams.ts` and
`waterways.ts`; naming in `naming.ts` and its data. Boats, freight and sea
travel should build on `journeyPlan` and the geography queries in
[WORLDS.md](WORLDS.md).

## Checks

- Tests: `map-travel`, `map-seams`, `travel`, `travel-naming`,
  `travel-environment`, `permanent-maps`.
