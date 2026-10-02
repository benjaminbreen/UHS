# Universal History Simulator

A playable procedural history prototype with Earth-based landscapes, local place/period/role parsing, and optional model-assisted World Weaver creation. Both modes use the same deterministic TypeScript simulation and original pixel atlas. The original Roman and Neolithic settings remain available for earlier recordings. See [WORLDS.md](WORLDS.md) for world generation and World Weaver setup.

## Run

Requires Node 22.12+ and npm. No account, API key, Python, or GIS installation is required to play or build; prepared assets are included.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. `npm run build` produces `dist/`; `npm run preview` serves that production build. A Vercel configuration is included, but this project has not been deployed.

## Procedural explorer

Open `/terrain-lab` to generate local maps from eight ecologies, four landforms, water, population and settlement-pattern controls. Try the six quick studies, change the seed, inspect elevation/moisture and household relationships, then **Play this world** to enter that exact preview. It supports uninhabited regions, wandering/shepherd starts, seasonal resource stocks and household gathering/home routines. See [ECOLOGY.md](ECOLOGY.md) for scope and extension points. The existing fixed art studies remain available through its Art fixtures link.

## Play

- Arrow keys or WASD walk; clicking clear ground plans a route. Escape stops walking. Scroll or the +/− buttons change magnification.
- Select people, buildings, trees, or objects. Walk closer to use their contextual actions. Conversations can establish temporary household access. Permission to enter does not transfer ownership.
- Trade exchanges real quantities. Inventory lets you eat. Wells refill water; grain plots and fallen wood can be gathered. Legacy resources remain depleted; procedural explorer resources have explicit seasonal availability and regrowth.
- Sheep graze, react to nearby pressure, and can be guided toward an enclosure. Open its gate before bringing them in and close it afterward. Lizards can flee or be captured.
- Taking household possessions can be witnessed; ownership remains unchanged. Goods still carried can be returned. People may later discover a loss without knowing its cause.
- Space waits a minute; the Wait button waits five. The text field supports a small explicit parser, such as `wait 10`, `eat bread`, `inventory`, or `map`. It is not an LLM conversation field.
- Inventory: I. Regional map: M. Notebook: J. On narrow screens the character panel is a drawer opened by selection or its map-toolbar button.
- New world resolves a place, period, role, and seed locally, or through the optional World Weaver interpreter. Unrecognized local descriptions remain in the form with an explanation. New worlds replace the current local session; export a world to keep a separate copy.

Time advances only through commands. People follow work/home routines and attend to hunger. The active radius is 80 tiles; distant residents receive bounded schedule catch-up when approached, without moving a visible person instantaneously. This is a declared approximation, not continuous simulation of every distant actor.

## Saves, recordings, and agents

IndexedDB stores the current world. Web Locks give one browser tab write access; other tabs run independent copies and can export them. Invalid stored saves are preserved as recovery records before opening a fresh world. Settings imports and exports full worlds and command trajectories.

Settings → Replay a journey loads a trajectory. Play, pause, single-step, or scrub through it. **Continue from here** resumes ordinary play at that point without modifying the imported file. Export that world to retain the branch. Playback verifies the expected final physical state hash when the recording supplies one.

The headless runner uses the same engine:

```sh
npm run headless -- --demo --pack roman
npm run headless -- --demo --pack neolithic
npm run headless -- --replay artifacts/roman-day.json
```

Without `--demo` or `--replay`, send one JSON request per line on stdin:

```json
{"tool":"observe"}
{"tool":"inspect","target":"s0-person-0"}
{"tool":"act","request":{"actionId":"step-1","expectedRevision":0,"command":{"type":"move","dx":1,"dy":0}}}
```

Observations include visible entities, local tile semantics, and contextual affordances. Guessed private IDs do not reveal inventories. A caller is always the session's player. Action IDs deduplicate retries; stale revisions do not repeat actions.

A local MCP server is available:

```sh
npm run mcp -- --pack roman --seed tiber-100 --save artifacts/mcp-session.json
```

For an MCP client, use `node` as the executable and arguments `--import`, `tsx`, `scripts/mcp-server.ts`, with this project as its working directory. Do not use a noisy npm wrapper for stdio client configuration. Tools are `observe`, `inspect`, and `act`. The optional save path belongs to that one local server process; it is not a multi-process or hosted session store. No client or model credentials are configured by this project.

The browser also exposes `window.historySim.observe()`, `.inspect(id)`, and `.act(request)`. Optional WebMCP registration is feature-detected. The experimental browser registry was not available for native verification; the actual stdio MCP transport is covered by a client integration test.

## Opt-in classroom recording

`/edumode` is a separate entry point. The ordinary `/` route does not upload play records. A student enters a name and class code, sees what is recorded, and chooses to start. Classroom sessions record submitted actions and their outcomes (including rejected actions), selected targets, submitted text, conversations and responses, notebook entries, world changes, simulation time, and wall time. Unsent events remain in that browser and retry when it reconnects. The status bar shows whether events are saved or waiting to sync. Finishing a session clears its local recording token after upload succeeds. A resumed recording starts a new game world; its earlier world remains in the session timeline.

The deployed route requires a Neon Postgres database. Run [`server/edu.sql`](server/edu.sql) in the database SQL editor, then set `DATABASE_URL`, `UHS_EDU_CLASS_CODE`, and `UHS_EDU_TEACHER_TOKEN` as server-only environment variables. Use independent, long random values for the two secrets. Without all three, classroom collection is unavailable. The teacher opens `/edumode/teacher`, enters the teacher token, and can review timelines, export JSONL/CSV, download the first world as a game replay, or delete a session. Import a replay through Settings → Replay a journey. Later world changes remain in the timeline and exports; they are not yet included in that replay file.

Names are self-entered; a shared class code does not verify an individual student's identity. The teacher token controls access to collected records and must not be distributed to students. Set a class retention policy and delete sessions when they are no longer needed. Classroom events are observational records from the student's browser, not server-authoritative proof against a modified client.

For a shared starting prompt and seed, distribute a URL such as `/edumode?start=A%20Roman%20baker%20in%20Ostia%2C%20100%20CE&seed=class-1`. The class code is entered on the page and should never be included in the URL.

## Extend the world

- `src/core`: plain state, action rules, time, visibility, randomness, and shared pathfinding. It does not import Phaser, browser APIs, or concrete historical content.
- `src/content/geography`: shared world settings, place catalog, offline interpretation, and content adaptation. `src/content/packs.ts` retains the two compatibility settings.
- `src/world/v2`: continuous atlas-based landscape and deterministic settlement districts. Workers prepare disposable chunk caches; request order cannot affect feature identity. The original `src/world/generate.ts` remains for v1 recordings.
- `src/runtime`: commands, worker bridge, validated persistence, subscriptions, and replay. Transient selection, camera, open panels, and playback state are outside simulation hashes.
- `src/render`: the Phaser observer. It draws a tile layer and sprites, manages camera and animation, and never decides trade, ownership, or NPC outcomes.
- `scripts/build_art.py`: original pixel recipes. Art dimensions are independent of collision footprints and two-metre simulation cells. Material ramps, silhouettes, and reusable construction motifs are the expansion strategy.

## Author assets and geography

Optional authoring dependencies:

```sh
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
.venv/bin/python scripts/build_art.py
.venv/bin/python scripts/prepare_geography.py
.venv/bin/python scripts/export_map.py roman
```

The art script composes the base recipes with `scripts/art_world.py` and the modules under `scripts/art/`, producing the sprite atlas, ground tiles, building contracts, six-band lighting-shadow atlas and `artifacts/art-proof.png`. It emits source-importable manifests under `src/render/generated/` alongside the public assets; the geography script similarly emits `src/content/generated/`. Regenerate these outputs together rather than editing the generated copies. The map exporter renders four actual generated chunks, including negative coordinates. It is a geography/composition diagnostic; its simple offline rendering omits the browser's transition overlays and selection effects.

In the original v1 compatibility worlds, the Roman river uses a pinned, public-domain Natural Earth centerline, projected offline to UTM 33N. It is coarse modern geography. River widths, banks, roads, settlements, people, and ancient channel positions are inferred. Those v1 worlds have no elevation model. V2 adds procedural relief and shared waterways, as described in [WORLDS.md](WORLDS.md). The Neolithic landscape has a real regional anchor but an inferred local channel and settlement layout. See `ASSET_PROVENANCE.md` and the in-game evidence panel.

## Verify

See the Verifying section of [CLAUDE.md](CLAUDE.md); `npm run check` is the gate.

## Current boundary

World generation now supports bundled named locations and eras, plus optional model interpretation. Existing art, professions, and economies remain early-build content shared across settings. See [WORLDS.md](WORLDS.md#current-scope) for current geographic and content limits.

### Visual polish

The compact charcoal-and-gold interface follows the Roman mockup: one header, a map-owned command bar, portrait sidebar, context thumbnails and functional Local/Region map tabs. Inspect selects a nearby visible target without advancing time. The original recipe atlas now includes portrait busts, shaded foliage, varied facade modules, stone quays and arched bridge fronts. The two packs share the same 16 px authoring language. Cosmetic surface rules are isolated in `src/render/materials.ts`; they preserve existing physical state and movement rules. Regenerate with `npm run art` after editing the pixel recipes.

The target-3 rendering pass adds exposed earth banks with corner-aware transitions, shallow-water bands and animated highlights, connected narrow settlement footpaths, cast shadows attached to the actual sprite feet, repainted mudbrick houses, and stronger foliage/character silhouettes. World character canvases are 20 × 32; terrain stays 16 px. The current `lighting-shadows.png/json` atlas must be rebuilt together with the sprite atlas and building contracts; it replaces the earlier fixed-shadow frames and `shadows.json`. Crop rows are multiple visual clumps of one authoritative harvest patch. Production movement reports for both settings are in `artifacts/performance.json` and `artifacts/performance-neolithic.json` (run the browser measurement script with `--neolithic` for the latter).

## Graphics development

**Settings → Graphics lab** opens an isolated review mode at `/graphics-lab`. Compare classical and mudbrick recipes, construction studies for later settings, landscape materials, lighting, integer pixel scales and viewport formats. Fixture URLs include camera/settings; frozen previews and PNG export make comparisons repeatable. The lab uses the production `WorldScene` and cannot overwrite the playable save.

See [GRAPHICS.md](GRAPHICS.md) for module ownership, recipe authoring, current limits, verification and the pre-refactor Git restore point.

## Music and sound development

**Command+1 / Ctrl+1** or the header’s music-note button opens the Audio studio. Click **Listen** for original seasonal overworld music; close the panel to keep listening on the map. Five themes support two track choices in each season/time slot, with pastoral, chamber and electronic arrangement previews, stem mixing, SFX auditions and WAV export. [AUDIO.md](AUDIO.md) documents the compositions, provisional season calendar, cultural/era extension points, seven rendered listening copies and verification.

## Cultural content and next work

[Design section 20](UHS_DESIGN.md#20-cultural-content-families-and-dated-local-profiles) records the twelve reusable content families and required place/date/community profiles. These are production groupings, not twelve interchangeable cultural identities. Technology, institutions, ecology and seasons remain separate dimensions. The resolver and twelve fixed eras are implemented; only the Roman and Neolithic packs are playable.

The two worlds now pass through validated profiles. World creation now uses the shared v2 setting pipeline; prop gameplay remains a separate approval and implementation slice. Java and Melbourne remain later stress-test candidates. See the top of [PROGRESS.md](PROGRESS.md) for current priorities.

### History and content inspection

Open `/history-lab` from Settings or Graphics lab. Choose a culture family, local profile, fixed era and exact date; inspect selected/excluded definitions, existing art, sources, alternative hypotheses and coverage. It does not load or modify your saved journey. Copy its URL or export JSON for review.

The twelve eras are settled in [HISTORY.md](HISTORY.md); this is a central content-selection framework, not new world-generation coverage. Current research records include the two compatibility profiles and diagnostic prehistoric-language/Moscow-transition studies. See [PROP_PLAN.md](PROP_PLAN.md) for the next proposed art/interaction phase, which is awaiting user review. Space still waits; pickup/equipment are not implemented yet.

### Prop art review

See [GRAPHICS.md](GRAPHICS.md#prop-art-review) for `/prop-lab`.
