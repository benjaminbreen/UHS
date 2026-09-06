# Universal History Simulator

A playable local prototype with two generated settings: a Roman town in the lower Tiber landscape around 100 CE, and a Neolithic settlement in the Konya plain around 6500 BCE. Both use the same deterministic TypeScript simulation and original, code-authored pixel atlas.

## Run

Requires Node 22.12+ and npm. No account, API key, Python, or GIS installation is required to play or build; prepared assets are included.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. `npm run build` produces `dist/`; `npm run preview` serves that production build. A Vercel configuration is included, but this project has not been deployed.

## Play

- Arrow keys or WASD walk; clicking clear ground plans a route. Escape stops walking. Scroll or the +/− buttons change magnification.
- Select people, buildings, trees, or objects. Walk closer to use their contextual actions. Conversations can establish temporary household access. Permission to enter does not transfer ownership.
- Trade exchanges real quantities. Inventory lets you eat. Wells refill water; grain plots and fallen wood can be gathered. Harvested resources remain depleted.
- Sheep graze, react to nearby pressure, and can be guided toward an enclosure. Open its gate before bringing them in and close it afterward. Lizards can flee or be captured.
- Taking household possessions can be witnessed; ownership remains unchanged. Goods still carried can be returned. People may later discover a loss without knowing its cause.
- Space waits a minute; the Wait button waits five. The text field supports a small explicit parser, such as `wait 10`, `eat bread`, `inventory`, or `map`. It is not an LLM conversation field.
- Inventory: I. Regional map: M. Notebook: J. On narrow screens the character panel is a drawer opened by selection or its map-toolbar button.
- New world selects a pack and seed. Unsupported setting descriptions remain in the form with an explanation. New worlds replace the current local session; export a world to keep a separate copy.

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

## Extend the world

- `src/core`: plain state, action rules, time, visibility, randomness, and shared pathfinding. It does not import Phaser, browser APIs, or concrete historical content.
- `src/content/packs.ts`: setting definitions, names, goods, exchange defaults, architecture choices, ecology, and historical evidence. Both shipped packs use the same core. A new supported setting needs real definitions and usable art, not a new React page or Phaser scene.
- `src/world`: shared regional planning and semantic terrain. The worker prepares disposable chunk caches; request order cannot affect feature identity. Four settlements are instantiated per initial region, and countryside is generated sparsely inside a 16 km square.
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

The art script composes the base recipes with `scripts/art_world.py` and produces the atlas, ground tiles, shadow anchors, and `artifacts/art-proof.png`. It emits source-importable manifests under `src/render/generated/` alongside the public assets; the geography script similarly emits `src/content/generated/`. Regenerate these outputs together rather than editing the generated copies. The map exporter renders four actual generated chunks, including negative coordinates. It is a geography/composition diagnostic; its simple offline rendering omits the browser's transition overlays and selection effects.

The Roman river uses a pinned, public-domain Natural Earth centerline, projected offline to UTM 33N. It is coarse modern geography. River widths, banks, roads, settlements, people, and ancient channel positions are inferred. There is no elevation or reconstructed ancient hydrology model yet. The Neolithic landscape has a real regional anchor but an inferred local channel and settlement layout. See `ASSET_PROVENANCE.md` and the in-game evidence panel.

## Verify

```sh
npm test
npm run build
npm run test:browser
```

Browser tests expect the development server on port 5173 and installed Chrome. Set `CHROME_PATH` to an executable if needed. Tests cover deterministic generation, identity and conservation, visibility, saves, both content packs, browser/Node parity, real interface interactions, narrow screens, replay branching, and an actual MCP client.

## Current boundary

This is a working two-pack procedural foundation. It does not yet implement arbitrary eras from free prose, model-enhanced dialogue, a hosted backend, continental travel, deep economies, full roof-to-roof traversal, or a detailed GIS/elevation pipeline. NPC memories and social consequences are intentionally modest; no claim of universal historical accuracy is made. Asset quality is an initial repeatability proof, with room for richer modules and composition. The original brief's full geographic and optional-model milestones remain broader than this prototype.

### Visual polish

The compact charcoal-and-gold interface follows the Roman mockup: one header, a map-owned command bar, portrait sidebar, context thumbnails and functional Local/Region map tabs. Inspect selects a nearby visible target without advancing time. The original recipe atlas now includes portrait busts, shaded foliage, varied facade modules, stone quays and arched bridge fronts. The two packs share the same 16 px authoring language. Cosmetic surface rules are isolated in `src/render/materials.ts`; they preserve existing physical state and movement rules. Regenerate with `npm run art` after editing the pixel recipes.

The target-3 rendering pass adds exposed earth banks with corner-aware transitions, shallow-water bands and animated highlights, connected narrow settlement footpaths, cast shadows attached to the actual sprite feet, repainted mudbrick houses, and stronger foliage/character silhouettes. World character canvases are 20 × 32; terrain stays 16 px. The generated `shadows.json` must be rebuilt together with the atlas. Crop rows are multiple visual clumps of one authoritative harvest patch. Production movement reports for both settings are in `artifacts/performance.json` and `artifacts/performance-neolithic.json` (run the browser measurement script with `--neolithic` for the latter).
