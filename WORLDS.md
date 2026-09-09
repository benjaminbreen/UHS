# Procedural Earth and World Weaver

Both modes produce a `WorldSetting` with the same data format; they can choose different places, dates, and characters. The same TypeScript generator, simulation, save, and replay then run it. A model never draws tiles or supplies executable rules.

**New world → Procedural** recognizes bundled place names, common period words, dates, roles, and seasons. Try Elizabethan London, Hellenistic Alexandria, a Roman legionary in Umbria, a free Black farmer in 19th-century Haiti, or a Paleolithic shaman in Siberia. The place selector also works without a prompt. Period-only input uses a visible local fallback. Requests that identify a place or culture zone and a period can resolve without a model; unrecognized details are flagged rather than silently ignored. Unknown input stays in the form so it can be revised. Periods and centuries choose a year from their range using the world seed. Exact dates are preserved and take precedence over period words. Character names and initial hunger/fatigue are also seeded and saved; these use existing simulation fields, not a new RPG statistics system. The numeric year field uses astronomical numbering: 0 is 1 BCE, −99 is 100 BCE.

The procedural path makes no model or geocoding requests. Once the application assets are loaded, play is local. Opening/reloading the website without an internet connection is not yet guaranteed: there is no service worker that installs the application offline.

**New world → World Weaver · LLM enabled** first tries the local matcher. A clear request such as “renaissance Florence weaver” makes no network request. An incomplete request such as “ancient shaman guy”, or one with unrecognized details, goes to the optional World Weaver endpoint for interpretation. It returns the same setting fields, including approximate coordinates for places outside the bundled catalog. The setting is saved in full, so continuing, exporting, importing, and replaying never requires another interpretation request. This implements model-assisted world creation; model dialogue and autonomous model-driven NPCs are separate future features.

## Optional LLM server

Copy `.env.example` to `.env.local`, then set:

```dotenv
UHS_WORLD_WEAVER_ENABLED=1
GEMINI_API_KEY=your-server-key
UHS_WORLD_WEAVER_ACCESS_CODE=your-access-code
UHS_WORLD_WEAVER_MODEL=gemini-3.5-flash-lite
```

Restart `npm run dev`. The Vite development server serves `/api/world-weaver`; `api/world-weaver.ts` provides the equivalent Vercel serverless handler. Configure the same environment variables on the hosting server. A static-only host supports procedural mode but needs a separate compatible endpoint for World Weaver. API keys must never use the `VITE_` prefix. The access code is entered only when interpretation is needed and is not saved with the world. The old `UHS_CLASSROOM_CODE` environment variable and `X-Classroom-Code` header remain compatibility aliases; World Weaver is not limited to classroom use.

The endpoint checks the access code, request size, and structured response. It has a 25-second provider timeout and two-request concurrency limit per server instance. Use provider project quotas to bound spending across server instances. The endpoint defaults to disabled. Tests inject a fake provider; no paid requests are needed for development or verification.

## How geography works

New procedural and World Weaver worlds use the shared relief/environment generator with `geographyRevision: 1`. World creation pins this input once; terrain workers consume it unchanged. The explorer uses the same pipeline with a bounded configured starting landscape, blending back to Earth beyond 192–384 tiles. The original revision-one study and older pinned settings retain their existing dispatch.

- **One coordinate field.** Earth coordinates use 2,048 game tiles per degree. Coastlines, major river lines and broad mountain/climate fields constrain local terrain. Fine relief, floodplains, banks, materials and habitats use the shared terrain implementation. This is compressed game geography, not distance-preserving surveying.
- **Dated regional constraints.** Regional files contain bounds, date ranges, reusable content defaults, named settlement points/footprints, land-use/water polygons and river/transport lines. Geographic overrides and land-use restrictions are independent: a park cannot hide the island underneath it. Known places take precedence over procedural settlement rolls. Approximate geometry is identified as inference.
- **Districts are indexes, not towns.** A 384-tile district can contain multiple named places or neighborhoods. Large footprints are subdivided into local neighborhoods; settlement IDs preserve the named parent and coordinates. Shared placement rejects protected open land and confines buildings/yards to their allocated footprint. Unresearched countryside uses terrain-suitable procedural settlements; an anchored region permits settlement only inside known footprints.
- **Continuous travel.** Loaded chunks sample the same world. Regional routes are planned before buildings, cross district boundaries and retain shared endpoints. Failed road searches remain blocked connections, not invented usable crossings. Land travel can continue beyond the starting region; ocean travel is not implemented.
- **Local content.** Settlement buildings, households, prop kits, resources and the location display resolve from coordinates and the world date. The twelve broad content families are fallback production defaults, not ethnic/political polygons. Dated regional and place defaults override them. Content libraries still require substantial historical expansion.
- **One map.** Regional overview terrain uses the same geography. Named destinations can be labeled without activating their populations. Detailed scenery remains local, avoiding household generation merely to draw a continental overview.

The imported gazetteer does not supply founding dates. Its general named-place coverage is conservatively enabled from 1990; this cutoff is a coverage policy, not a claim about when those places existed. Earlier named coverage comes from dated regional files or the explicitly requested starting setting. Initial regional data includes approximate London (1500–1665), Iberian city anchors (1500–1899), and New York (1850–1913). These are ordinary production data, not custom generators. Sources and limitations live beside each feature.

### Shared geographic queries

`WorldModel.geography` exposes read-only `packAt`, `placesIn`, `connectionsIn` and `resourcesAt` queries. Local places include stable generated identities; wider queries retain named anchors without creating distant households. Connections carry endpoints, mode, geometry and `proposed`/`routed`/`blocked` status. `routed` means road geometry was generated; it is not a promise of verified end-to-end gameplay access. River/sea/ferry links remain unserved proposals. Resource potentials indicate habitat opportunities, not stocks, yields, production or actual trade.

Future boat traffic and economic dependencies should consume these same places, links and resource queries. Add their mutable activity to the simulation rather than inventing another geographic network. No boat agents, freight, transport schedules or economic production chains were added in this pass.

## Extending it

`src/content/geography/regions/` contains dated regional constraints; `src/world/regional/` resolves geography, settlement identities and transport. `src/content/geography/defaults.ts` upgrades new-world inputs. `src/content/geography/places.ts` contains the featured anchors and aliases. `types.ts` defines the setting contract, `resolve.ts` interprets offline text, and `pack.ts` adapts that setting to existing content and art. `src/world/v2/landscape.ts` describes terrain; `src/world/v3/` plans new settlements and samples chunks. See [SETTLEMENTS.md](SETTLEMENTS.md) for roads, plots, farms, pens and daily activity. `server/world-weaver.ts` only interprets settings.

A place's settlement rank in that catalog is Natural Earth's modern cartographic prominence, so it describes the present settlement network and no earlier one. Two tables date it down.

`src/content/settlements/urban-form/` says when towns of a given kind existed in a region. `settingFor` ranks a place as a town only from the earliest date a fabric there covers its culture family and coordinates, or from the date in `src/content/geography/onsets.ts` when the modern named-place network formed, whichever comes first. Each fabric also carries a `storeys` cap, so a single-storey fabric is never handed a three-storey building model.

`src/content/geography/onsets.ts` also holds rough regional dates for settled farming. Before it, a place is a camp with forager roles, no fields, no livestock and no paving. Somewhere that never farmed becomes a settlement when the modern network reaches it, not on a farming date it never had.

Both tables are regional, not per settlement, and the farming dates are round numbers from the general archaeological literature rather than a reviewed dataset. A culture family with no urban entry is not being described as lacking towns; its layouts have not been researched.

The bundled catalog combines featured settings, Natural Earth place coordinates, and original UHS area descriptions where a named coordinate could be matched. The old UHS adjacency graph is not used. Broad regional coordinates from that graph are deliberately not treated as individual place locations. Named coordinates and default ecology are approximate and can be overridden in the featured anchor table.

```sh
npm run prepare:atlas
npm run headless -- --prompt "Elizabethan London"
npx vitest run tests/world-v2.test.ts
npx playwright test tests/browser/world-v2.spec.ts
```

Atlas preparation uses Python's standard library, caches pinned public-domain Natural Earth inputs, and records checksums. Generated files ship with the application; players do not download GIS datasets. Source details are in `ASSET_PROVENANCE.md`.

New worlds have generator version 3, simulation version 2, atlas/schema version 2 and geography revision 1. They retain their resolved setting in the manifest. Existing generator-2 saves and the original generator-1 Roman/Neolithic presets preserve their earlier generator and simulation. Layout-affecting changes require deliberate version handling.

## Current scope

This is broad geographic generation using the existing early-build simulation. Regional art libraries, clothes, crop varieties, household inventories, and occupational behavior still need expansion; a recognized place name does not imply a bespoke city or economy. Architecture currently reuses classical, mudbrick, timber, courtyard, board, thatched-house, and simple shelter components. Prehistoric and seasonal settings affect initial terrain/content; ice sheets, sea-level histories, and an evolving hydrological simulation are not implemented.

Travel now resolves content by locality, using explicit dated coverage where supplied and broad fallback libraries elsewhere. Comprehensive historical regional profiles are not yet authored. Long-distance transport, ocean crossing, polar coverage above 85°, and dateline wrap remain outside this build. Terrain caches are bounded; explored actors and objects persist, so extremely long journeys still need entity streaming before population memory can plateau.
