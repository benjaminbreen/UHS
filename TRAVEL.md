# Geographic travel review

The `/geography-lab` panel is the first integration of a shared travel foundation. It is linked from Settings → Developer. It does not change movement, world generation, saves, or rendering in ordinary games.

## Implemented

- Global H3 resolution-4 geographic identities and reciprocal adjacency, including polar addresses. The dependency is pinned. `src/world/travel/` owns routing independently of the React panel.
- Land/sea classification from the existing quarter-degree Natural Earth atlas mask. Edges sample the intervening mask at approximately 8 km intervals. A* uses geographic distance and a modest penalty from the existing relief sampler. Mixed land–sea queries share that graph, allowing an edge across one sampled coastline and charging a 75 km-equivalent transfer penalty to discourage repeated embarkation. This is a routing preference, not elapsed time or historical transport cost. There is no distance or expansion-count cutoff; searches exhaust the finite graph if necessary. Queries execute in a worker. Canonical endpoint ordering makes reversed searches use the same path.
- Geographic anchors assembled from the existing catalog plus compact regional travel files. IDs are independent of display names. The catalog's `year` and modern population are not used as historical founding/size evidence.
- Explicit settlement scenario windows for the two review corridors. These are **inferred coverage intervals**, not founding or abandonment dates. Outside coverage the geographic location remains, its landscape name is shown, and the panel does not assert a named town. Missing evidence is not evidence of an uninhabited landscape.
- Stop selection preserves requested waypoints, scoped anchors encountered on the path, and persistent changes in the existing broad climate estimate. It adds representative landscapes according to adjustable geographic spacing. Local suggested widths are 384, 512, or 640 tiles; nominal traversal assumes the existing 140 ms walking cadence.
- Short geographic names live in regional content files. Generic landscape names are descriptive fallbacks, not fictional ancient toponyms. Duplicate broad names can occur in distinct cells; cell IDs and coordinates disambiguate them.
- A pan/zoom Earth map, optional routing-cell overlay, clickable proposed stops and adjacent cells, arbitrary catalog endpoints, editable via locations, year and spacing, combined land–sea mode by default, optional walking-only/sea-only restrictions, reversal, and shareable URL state.
- Mixed journeys preserve both sides of every land/water transition during compression. Coastal stops mark boarding and landfall; water sections are blue and require a boat. The nominal walking estimate excludes water maps; sailing duration is not modeled. Named settlement endpoints snap to land in mixed mode. Coastal transfer points are approximate, not surveyed harbours, and boat gameplay is not implemented.
- Changing either endpoint clears prior waypoints; endpoint URLs without explicit waypoints do not inherit preset waypoints. Failed queries clear old results and finish loading; all statistics hide while recalculating. Existing explicit mode URLs and preset restrictions remain respected.
- A lazily loaded local preview uses the existing preparation worker, `Runtime`, and `WorldScene`. Its gold rectangle is an adjustable boundary overlay. The preview uses the geographic anchor where available, not the snapped routing cell center. It does not enforce movement bounds or install exits.

The British preset requests London, Western Thames valley, Oxford, and Edinburgh. The Morocco–India preset supplies major waypoints through Cairo and western/central Asia. These are query examples, not stored adjacency tables. The latter is an illustrative medieval corridor, **not Ibn Battuta's literal itinerary**. The Iceland example demonstrates sea routing, not a playable vessel mechanic.

## Ocean compression and regional names

Open-water gaps use basin-specific spacing independent of the land slider: Atlantic 2,200 km, Pacific 1,300 km, Indian and Southern 1,600 km, Arctic 1,000 km. Marginal seas use shorter spacing. These are gameplay tuning values, not sailing speeds. Distances along the actual routed cells accumulate against this spacing; requested locations and coastal transfers remain pinned. Islands encountered by a path are retained, but the planner does not invent island detours. Typical crossing counts are targets, not hard basin-wide caps.

Water names describe fixed geographic sectors and selected marginal seas in `oceans.ts`. All five oceans have coverage, including longitude wraparound. Labels are simplified geographic interpretations; there is no current, sea ice, seasonal navigability or historical navigation model. Ocean convention reference: [NOAA](https://oceanservice.noaa.gov/facts/howmanyoceans.html).

`north-american-landscapes.ts` contains compact polygons with stable region IDs. Names and approximate extents are interpreted from [USGS physiographic regions](https://pubs.usgs.gov/gip/70039236/report.pdf) and [regional descriptions](https://pubs.usgs.gov/ha/ha730/ch_f/F-text1.html), not imported survey boundaries. More specific areas precede broad ones. The existing generator is unchanged: these polygons name travel cells and preserve sustained region transitions, not terrain-generation inputs. Coverage currently emphasizes the contiguous US; global land naming remains incomplete. Add regional content rather than route-specific names or adjacencies.

London–El Paso at land spacing 180 km now yields roughly 28 stops, with about five water stops including coastal approaches. The US sequence includes named coastal plains, Mississippi landscapes, Piney Woods, Texas prairies, Edwards Plateau and Chihuahuan Desert. Other routes and spacing settings produce different counts. Tests exercise Atlantic, Pacific, Indian, Arctic and Southern ocean passages, independence from land spacing, and naming coverage on this journey.

## Global landscape naming

The naming resolver now uses imported global data rather than nearest-place names or route-specific lists:

- Natural Earth physical region and marine polygons: 1,332 compiled records, split into nine generated regional files. Source revision and SHA-256 checksums are pinned. Detailed features must contain the center and most samples of a nominal 2 km geographic footprint; holes are excluded. Large islands and continents provide broader context. Boundaries are approximate, as Natural Earth documents, and are simplified further for this inspector.
- RESOLVE Ecoregions 2017: global terrestrial regional fallback, rasterized at quarter-degree cell centers. The importer preserves full source labels and uses shortened display labels. Ecological-region labels describe the modern source classification; they are **not historical vegetation, climate, language or polity assertions** and do not change the existing terrain generator. The generic Rock and Ice category is excluded from names. Labels that cannot be shortened safely fall through to broader geography.
- Existing compact US polygons remain explicit refinements. Scoped authored stops and known dated settlements retain their display names. Unresearched catalog settlements now display resolved geography rather than a fabricated `City area` label; their catalog IDs and requested endpoints remain unchanged.

The H3 map identity and geographic routing are independent of these names. The new global label IDs are metadata, not new map IDs or a replacement adjacency graph. Natural Earth reuses a source ID for two distant Flores islands; IDs are qualified by source region, preserving the original ID separately. Multipart records within a source region are merged. Source links and naming confidence are visible in the inspector.

`Geographic naming coverage` shows route label counts and runs an on-demand audit in the existing worker. It combines 2,048 equal-area globe samples with catalog anchors, deduplicated by routing cell. Green points have specific feature/refinement labels, gold points broader regional names, and red points missing coverage; clicking a point inspects it. This is a reproducible sample audit, not proof of complete global or historical coverage. Remaining gaps generally expose coastline/resolution disagreement and are left explicit rather than borrowing a distant name.

Rebuild with `npm run prepare:travel-names`. Natural Earth preparation uses Python's standard library. Ecoregion preparation requires `.venv/bin/python -m pip install -r scripts/travel-names-requirements.txt`. Original downloads are cached under ignored `scripts/source-cache`; only the roughly 4 MB compiled naming data ships. The 149 MB ecoregion source archive is not bundled. No runtime network or model calls are required.

Sources: [Natural Earth physical labels](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-physical-labels/) and [public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/); [RESOLVE Ecoregions 2017](https://ecoregions.appspot.com/), Dinerstein et al. (2017), [doi:10.1093/biosci/bix014](https://doi.org/10.1093/biosci/bix014), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Changes: polygon simplification, merged source parts, shortened names and a coarse regional raster. Download URLs/checksums and attribution are embedded in generated metadata.

## Deliberate limits before live-game integration

The H3 grid is the stable shared geographic graph. **Compression currently proposes stops for the selected route. It is not yet the finalized, globally shared network of playable maps and exits.** Reviewing that policy is the purpose of this panel. Distinct itineraries can retain different subsets of the same geographic cells. No route-specific worlds are instantiated.

The coarse mask can omit small islands, narrow waterways or land bridges. Anchors snap to nearby accessible cell centers; long offsets are flagged and drawn dashed. A failed search reports failure rather than substituting a straight-line connection. This resolution does not distinguish every pair of close locations. Historical shoreline change, researched road networks, and dated transport access are not modeled.

Climate and cultural-library labels are the current broad generation estimates. They are not historical climate reconstructions, ethnic borders, language maps, or political borders. Their visible inaccuracies are review findings. The current local generator still determines preview settlement placement and environmental detail; travel scenario coverage is not a replacement for its inputs or historical resolver.

Full polar geography can be inspected, but the existing local setting schema remains limited to ±85°. Sea and out-of-range local previews are disabled. No renderer or terrain system was changed to work around these limits.

Next integration decisions: freeze the shared compression/stop policy; connect dated settlement resolution consistently to generation; define crossing and arrival records; then install actual boundaries and preserve return visits. The panel and travel module should remain the production inspector and foundation, not be copied into another implementation.

## Verification

`npx vitest run tests/travel.test.ts` covers identity, date-independent geography, reciprocal land edges and return paths, compression, waypoint preservation, island disconnection, sea routing, polar cells, and invalid input.

`TRAVEL_BASE_URL=http://127.0.0.1:5186 npx playwright test tests/browser/geography-lab.spec.ts` checks the production review UI, dates, compression, cell inspection, share state, mobile width, and the existing local renderer/boundary overlay. Run a production preview on that port first; without the environment variable the tests use the standard development server on 5173.

## Reviewed default

User testing selected 500 km as the default land spacing. New preset journeys use 500 km; explicit shared URL settings remain respected, and ocean spacing stays independent. This changes geographic compression, not local map size or walking speed.

## Proposed next phase: permanent playable maps

First make compressed stops and their connections independent of a requested destination. A map must expose the same exits regardless of arrival direction, route query, or generation order. Use the shared geographic graph and stable geographic anchors, with roughly 500 km land spacing as a density target, retaining necessary nearby cities, islands, passes and coastal transfers. Each compressed connection must retain its underlying geographic path and reciprocal arrival mapping. This is the remaining architectural step before live boundary crossing; the current route-specific review selection is not sufficient.

The first review milestone is destination-free exploration in this same panel: select any map, inspect its exits, follow an exit, and return. Check loops, intersecting journeys, later catalog additions and globally distributed areas. Once those connections are consistent, feed a map's anchor and bounded footprint into the existing terrain/hinterland preparation, preserving its visual scale and sampler. Small, medium and large local bounds remain independent of geographic travel distance.

Then connect on-foot boundary crossing to the existing runtime: prepare the destination, place the player at the paired entrance, and preserve visited map state within the running session. Sea exits declare a boat requirement for future vessel gameplay. Save-system expansion remains secondary to playable terrain, transitions and performance. The first live acceptance check is walking between generated maps and returning to the same changed place, using globally generated connections rather than a bespoke corridor.

## Shared preview environment

`resolveMapEnvironment` is now the common input resolver for travel-cell inspection and terrain previews. It samples the same 128-tile ambient blocks and climate rule as the existing regional generator, applies dated regional/place defaults, and resolves fine Earth coastline/river distances at the actual map anchor. Requested/catalog stops use their actual coordinates even when their coarse routing cell is offset. Climate, ecology and relief in the panel therefore describe the input used to prepare that preview.

`settingForTravelStop` builds explicit generator inputs rather than spreading a nearby catalog place. Culture and architecture can still use a disclosed nearest-catalog fallback when regional coverage is absent, but climate, relief and water layout do not. Earth mode keeps actual coastlines; the local `water` recipe is only populated from matching regional defaults. The same existing climate expression was extracted into a pure helper without changing ordinary regional-generation behavior.

Fine shoreline classification is separate from the coarse routing mask and is shown in the inspector. This allows inspection of a land anchor on a small island even if the routing cell is ocean. It does not yet solve tiny-island connectivity in the global graph. Polar metadata remains inspectable; local preparation still respects its existing ±85° latitude limit.

A 640-tile Jersey sampling check has dry central land and water along all four boundaries using the existing terrain generator. Arid examples near Dulan, Ashgabat, central Australia and the Sahara remain in the desert envelope at the start and beyond it. Naming ecoregions remain labels only; they are not silently promoted into historical climate inputs. The broad climate sampler itself is still an approximation.

## Implementation stages after ecological review

1. **Permanent map network.** Turn the existing geographic graph into a destination-independent playable network. Map records have stable geographic IDs, anchors, local sizes and paired exits; names and dated settlement states remain separate. Use 500 km as the land density target, existing ocean compression, and explicit retention of nearby named anchors, islands and geographic bottlenecks. Connections retain traversable underlying paths. The geography panel must let a user pick any map, follow exits without selecting a destination, and return through the same connection. Different queries and generation orders must find the same network. Catalog additions enrich or locally subdivide it without renaming existing maps. This is the next implementation milestone, not another route-specific demo.
2. **Bounded generation.** Feed those records into the existing Earth sampler, terrain renderer, settlement and hinterland composer. Apply small/medium/large footprints, keep local features and dated habitation consistent, and place reachable paired entrances at the boundary. Preview full islands and uninhabited maps as well as cities. Do not scale real geographic distance into local walking distance.
3. **Live crossing and return visits.** Walking through an exit prepares the connected map, transfers the player to its paired entrance, and retains changes to visited maps within the current session. Prevent immediate accidental return crossings. Sea edges expose their boat requirement; vessel gameplay is separate.
4. **Preparation and performance.** Bound generation work to the playable footprint and needed margins, prepare nearby exits, release distant render resources, and test repeated crossings on large settlements and coastlines. Keep one production path shared with the inspector.
5. **Global and historical refinement.** Expand small-island/polar support and sparse geographic coverage, improve transitions and dated settlement/cultural inputs, then add transport behavior and richer historical layers. Language, religion and polity remain independent of permanent map identity. Save-system expansion remains deferred until requested.

Acceptance routes include Britain and Morocco–India, alongside arbitrary island, ocean and southern-hemisphere cases. These are checks of shared rules, not hand-authored exceptions. The network's topology must be reviewed before installing live boundary crossings.

## Stages 1–2 implementation

The new Permanent maps section uses src/world/travel/network.ts, independently of itinerary selection. Land grouping is a deterministic maximal spaced set on the existing atlas mask, targeting roughly 500 km rather than enforcing an exact distance; geography can retain closer cells. Ocean grouping remains coarser. Catalog records retain their own IDs and attach locally; adding a place can change nearby connections but never existing backbone IDs. Graph rules are deterministic, not saved per query. Fine shoreline checks correct the coarse mask at anchors. Connections are reciprocal and their geographic paths are resolved canonically by the existing router when followed.

The earlier journey planner remains a spacing study. Its compressed stops are not substituted for permanent nodes. The next integration step is to route journey selection through the permanent network as live travel is connected; the destination-free inspector already follows that network.

Local sizes are now 384 by default and 512 for dated cities. Large is reserved and not offered in generation. The playableMap setting is an opt-in generation contract: existing unbounded inputs remain unchanged. Regional sites must fit within the footprint; unseen districts outside it are not planned. Rendering keeps an apron while the playable area is bounded. Shared preparation records reachable entrances and approach paths; blocked boundaries remain visible review findings rather than invented roads through impassable terrain. Existing terrain geometry, coastline sampling and settlement construction are reused.

The small-island atlas/routing discrepancy is still a data-resolution constraint: boat access can attach a fine island anchor to an ocean backbone node, while local land rendering uses the fine anchor. Ocean-only local scenes and local polar settings beyond 85 degrees remain deferred. Stage 3 will implement crossing, paired arrival, and within-session return state using these same records.
