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

- **One coordinate field.** Coarse Earth coastlines, major river lines, simplified mountain belts, and broad climate fields establish the landscape. The world is compressed to 2,048 game tiles per degree; this is a game atlas, not a distance-preserving map projection. Existing local movement timing remains game scale.
- **Local composition.** A named setting supplies climate, relief, river/coast orientation, settlement form, and architecture. Near the start these shape a readable landscape, then blend into the broader atlas. London gets an east–west river; Alexandria gets open sea to the north. Procedural valleys lower the terrain around channels. Watercourses connect to atlas rivers where available; this is not a rainfall/catchment simulation.
- **Shared features.** Deterministic districts place settlements and connecting paths. Chunks only sample this world. Looking at a neighbor first cannot alter a coast, road, building ID, or river. Nearby districts instantiate residents and objects as the player moves; saves restore those same districts.
- **One map at several scales.** Local and regional views sample the same terrain. At larger scales the map samples the landscape directly; Earth view draws its source atlas. Interiors retain their own grid and stable doors.

The important contracts are a valid start, reachable doors, continuous shared features, stable IDs, and repeatable saves. Historical content is an editable input, not a prerequisite for generating a plausible landscape. No per-marsh citations or dated GIS correction pipeline is required.

## Extending it

`src/content/geography/places.ts` contains the featured anchors and aliases. `types.ts` defines the setting contract, `resolve.ts` interprets offline text, and `pack.ts` adapts that setting to existing content and art. `src/world/v2/landscape.ts` describes terrain; `src/world/v3/` plans new settlements and samples chunks. See [SETTLEMENTS.md](SETTLEMENTS.md) for roads, plots, farms, pens and daily activity. `server/world-weaver.ts` only interprets settings.

The bundled catalog combines featured settings, Natural Earth place coordinates, and original UHS area descriptions where a named coordinate could be matched. The old UHS adjacency graph is not used. Broad regional coordinates from that graph are deliberately not treated as individual place locations. Named coordinates and default ecology are approximate and can be overridden in the featured anchor table.

```sh
npm run prepare:atlas
npm run headless -- --prompt "Elizabethan London"
npx vitest run tests/world-v2.test.ts
npx playwright test tests/browser/world-v2.spec.ts
```

Atlas preparation uses Python's standard library, caches pinned public-domain Natural Earth inputs, and records checksums. Generated files ship with the application; players do not download GIS datasets. Source details are in `ASSET_PROVENANCE.md`.

New worlds have generator version 3, simulation version 2, and atlas/schema version 2. They retain their resolved setting in the manifest. Existing generator-2 saves and the original generator-1 Roman/Neolithic presets preserve their earlier generator and simulation. Layout-affecting changes require deliberate version handling.

## Current scope

This is broad geographic generation using the existing early-build simulation. Regional art libraries, clothes, crop varieties, household inventories, and occupational behavior still need expansion; a recognized place name does not imply a bespoke city or economy. Architecture currently reuses classical, mudbrick, timber, courtyard, board, thatched-house, and simple shelter components. Prehistoric and seasonal settings affect initial terrain/content; ice sheets, sea-level histories, and an evolving hydrological simulation are not implemented.

Travel generates nearby content from the starting setting's palette; it does not yet change societies as the player crosses continents. Long-distance transport, ocean crossing, polar coverage above 85°, and dateline wrap remain outside this build. Terrain caches are bounded; explored actors and objects persist, so extremely long journeys still need entity streaming before population memory can plateau.
