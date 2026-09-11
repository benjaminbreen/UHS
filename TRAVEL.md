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
