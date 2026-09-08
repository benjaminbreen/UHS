# Performance and architecture review — 8 September 2026

Reviewed the shared checkout including the initial character work, before the final face/wardrobe/dynamic-shadow additions checkpointed later on September 8. Measurements and source line references below describe that earlier review snapshot. No application code was changed. This is a focused review of startup, rendering, simulation scaling, module ownership, and removal candidates, not an exhaustive correctness or security audit.

## Assessment

Keep the architecture. Plain deterministic simulation, explicit runtime orchestration, data-driven historical content, a single renderer, and pure terrain raster functions are a sound foundation. The terrain worker transfers pixel buffers and the renderer retains bounded chunks; these are useful optimizations already in place.

The main problem is expensive synchronous work around that foundation. Ordinary short samples already run near 60 FPS locally, but production world startup can freeze the page for several seconds. There are also avoidable costs on every movement step and frame, plus growing-session costs that short benchmarks hide. A focused cleanup will help more than a new framework, ECS, renderer replacement, or generic event bus.

## Measurements

Production build, local Vite preview, headless installed Chrome, 1440 × 1000, fresh browser contexts. No network or CPU throttling. These are local samples, not mobile guarantees or deployed-network measurements.

| Measurement | Result |
| --- | --- |
| Initial default world, fresh context | 1.07 s to canvas-ready |
| Anatolia revision-one preview | 2.31 s from selection to visible terrain |
| Anatolia terrain preparation metric | 1.41 s |
| Current integrated Alexandria, first sample | 10.04 s to visible terrain |
| Alexandria, two repeats without concurrent test work | 9.07 s / 9.11 s |
| Longest main-thread task in Alexandria repeats | 3.63 s / 3.66 s |
| Alexandria terrain preparation metric, repeats | 5.18 s / 5.06 s |
| Anatolia: 240-frame sample, 27 six-second wait commands | p50 16.7 ms; p95 16.8 ms; max 33.3 ms |
| Alexandria: 360-frame sample, 40 accepted movement commands | p50 16.7 ms; p95 16.8 ms; max 50 ms |
| Synchronous public command time, maximum | Anatolia 37.7 ms; Alexandria 55.5 ms |
| Blank-page comparison | p50 16.7 ms; p95 16.8 ms |
| Chunk installation metric | 5.0 ms Anatolia; 5.4–8.7 ms Alexandria |

The initial default world is the older Roman generator; it is not representative of new integrated worlds. Visible-terrain readiness excludes outstanding offscreen lookahead chunks. The Alexandria movement sample circles locally and does not establish long-distance or dense-population performance. Its first startup sample overlapped other checks; the two isolated repeats confirm the underlying delay. No page errors occurred.

Build output: entry JavaScript **2,778.80 kB / 812.99 kB gzip**, Phaser **1,208.18 kB / 332.23 kB gzip**, worker **1,966.55 kB uncompressed**. The two initial main-thread JavaScript bundles total approximately **1.15 MB gzip**, excluding assets and worker transfer. Vite preview does not establish actual production CDN compression/cache behavior.

## Prioritized findings

### 1. High: world creation blocks the main thread and repeats work in the terrain worker

`src/ui/WorldSetup.tsx:130` calls synchronous `createSettingSession`; `src/runtime/session.ts:40` constructs the settlement world before React can present it. `src/world/v3/generate.ts:1044` plans the starting settlement, searches for a spawn when necessary, and activates nearby content. The terrain worker constructs another settlement world in `src/render/terrain-worker.ts:30`.

The isolated browser runs measure a single 3.6-second task after entering Alexandria. This is real input/paint blocking, not just a loading indicator waiting on the network. Exact allocation between generation, replacement, scenery and UI work still needs a CPU profile; do not attribute the entire task to one function.

**Change:** separate serializable world preparation from the lightweight query facade; prepare the initial geography/settlement result in a worker, then install it. Let rasterization reuse geometry without constructing a second starting population. Start with explicit worker request/response types and one preparation result, not an elaborate distributed engine. Preserve deterministic inputs and ordering. Display loading progress before expensive preparation begins.

### 2. High: eager geographic data and initialization burden every entry point

`src/main.tsx:2` statically imports App and runtime before selecting a lab route. App imports Phaser, the world setup/map UI, and AudioLab. `src/world/v2/atlas.ts:1` imports roughly 1.5 MB of geographic JSON; lines 42–75 build edge indexes and a 1440 × 720 land mask at module evaluation. These dependencies are also reached from the worker bundle.

`Runtime` always constructs `ChunkCache` (`src/runtime/session.ts:164`), whose constructor starts a worker (`src/runtime/chunks.ts:14`). Relief worlds skip its prefetch, but still pay for worker startup/imports. `TerrainStream` starts its own worker. The browser resource list contains two loads of the worker URL after the default-to-relief transition; caching can save transfer, but not a second worker's independent execution and memory.

**Change:** choose the route before importing the gameplay bootstrap; lazy-load AudioLab and optional UI; create the legacy tile worker only on its first actual use. Move atlas indexing/mask preparation into the offline preparation script and load compact prepared data where needed. Separate simple coordinate conversions from the atlas data module. A separate chunk alone does not help if startup still eagerly imports it.

### 3. High: minimap movement redraws resample the world

`src/ui/components.tsx:71` reruns the minimap effect when the player coordinates change. The ordinary 256 × 148 map executes **9,472 terrain samples** per redraw, plus relief-neighbor sampling, decoration and building passes. The 520 × 350 map executes **45,500 samples**. It also creates another Image for the same atlas on each effect run. This usually reuses browser image cache, but still repeats setup and drawing.

**Change:** cache a slightly oversized terrain backing image by world and map region; redraw its background only when crossing that region or changing map scale/content. Draw the player marker independently and reuse the loaded atlas. Use the worker for background raster preparation if profiling shows it remains costly. This also reduces incidental generation triggered by map queries.

### 4. Medium: stationary entities force scene depth sorting every frame

`src/render/WorldScene.ts:834` calls `setDepth` for every entity each update, including stationary props. The installed Phaser implementation in `node_modules/phaser/src/gameobjects/components/Depth.js` queues a depth sort unconditionally in its setter, even when the new value equals the old one.

**Change:** compute/update depth only for moving entities or when elevation changes, and compare the value before setting it. Likewise avoid repeating character `setTexture`, metadata writes and DOM dataset writes when the displayed state is unchanged. Character frames are cached, which is good; cache misses still synchronously paint an 80 × 80 canvas and create a texture (`src/render/characters/world.ts:65`). Profile crowd turns and pose changes before deciding whether to pack frames into shared atlas pages or prewarm them.

### 5. Medium: command cost increases with accumulated session history

`src/runtime/session.ts:261` and `:272` clone the entire state for every accepted command when saving is enabled. `src/core/engine.ts:134` uses `structuredClone`, including the growing command log and receipt dictionary; accepted logs and all valid action-ID receipts accumulate at lines 654 and 664. `src/runtime/storage.ts:8` queues every snapshot write without coalescing.

A Node stress microbenchmark on the small Anatolia world measured snapshot median **0.12 ms initially**, versus **16.51 ms** with 10,000 deliberately rejected command receipts; the latter snapshot was about **2.04 MB**. This is a synthetic scaling demonstration, not an observed ordinary session or a save-restoration test. It establishes why short fresh-world tests miss the problem.

**Change:** emit a dirty notification and coalesce checkpoint creation/writes so superseded snapshots are not cloned or queued on every step. Keep replay/audit history separate from frequently copied physical state. Define receipt retention semantics before bounding them; silently forgetting action IDs would change retry behavior. This is hot-path work, not a request to expand save restoration scope.

### 6. Medium: repeated projections, global scans, and cache churn limit scale

`Runtime.emit` computes an observation, the scene subscriber computes another (`WorldScene.ts:592`), and public `Runtime.act` computes another for its return. Observations scan actors/objects and perform visibility rays whose blockers scan all places (`engine.ts:308`). UI-only selection and zoom notifications repeat some of this work too.

Simulation advancement sorts the actor list every six-second tick (`engine.ts:1202`), scans all resources, and household activity repeatedly searches households, stores and nearby resources (`livelihood.ts:55`). District activation accumulates persistent actors/objects; many later queries still scan these global arrays. Several terrain caches discard all entries at their thresholds (`world/v3/generate.ts`), which can produce avoidable cold-cache bursts during travel.

**Change:** publish one immutable internal observation per simulation revision and reuse it across UI and rendering; preserve defensive copies at the external API boundary. Maintain straightforward ID maps, spatial buckets, and a stable actor order. Incrementally evict derived terrain cache entries. Retain canonical state and deterministic iteration order. Profile long waits and travel before choosing further simulation scheduling changes.

`TerrainStream.update` also scans wanted chunks and writes dataset metrics every frame; chunk installation discovers ownership by diffing the entire scene child and texture lists. Return explicit owned objects/textures from drawing helpers, track pending work on view/completion changes, and publish diagnostics only on change or at a low rate. This simplifies lifecycle ownership as well as reducing bookkeeping.

## Architecture and removal decisions

The ownership model is working, but several modules now mix too many responsibilities: Engine is 1,388 lines, App 1,172, v3 generation 1,106, WorldScene 889 and settlement planning 828. Length is a symptom, not a reason to split files arbitrarily.

Extract cohesive responsibilities behind ordinary functions:

- Engine: command validation/execution, observation/inspection, simulation advancement. Keep one authoritative Engine coordinator.
- Renderer: input, entity presentation, static scenery. Keep the existing dedicated terrain stream and raster modules.
- App: game viewport host and individual panels/dialogs. Subscribe each to the smallest useful view.
- Generation: shared geographic sampling and settlement planning, then population activation.

The documented rule that core receives resolved content is partially breached: `core/engine.ts` and `core/props.ts` import the concrete prop catalog. Pass resolved prop definitions alongside items. The runtime's CharacterPose import is type-only, so it does not load rendering code, but a shared presentation contract would make ownership clearer. Avoid turning this into a dependency-injection framework.

**Safe cleanup candidates:**

- Remove the extra `world-art` atlas load from **WorldScene only** (`WorldScene.ts:86`): that scene already loads the same files as `atlas`, and no production renderer reference consumes the alias. TerrainScene does use `world-art`; retain its load. Recheck the browser after removing the duplicate.
- Move approximately **11 MB** of generated MP3 listening previews out of `public/audio` if those review URLs are no longer needed. Runtime music is synthesized; these files serve documented listening examples. This reduces deployment payload, not initial gameplay download: the browser sample did not request them. Update AUDIO.md and the export script together.
- Consolidate repetitive capture-script setup and move superseded screenshots to an archive while retaining approved visual baselines and deterministic reproduction recipes. `artifacts` currently occupies about 156 MB locally; not all of that is tracked or deployed.
- Update stale implementation descriptions in HISTORY.md, README.md and the long progress log. Keep current subsystem contracts concise and move old progress entries to an archive so agents need less historical context to find today's behavior.

**Do not delete wholesale:**

- `src/world/v2`: v3 actively imports its atlas, noise and landscape utilities. Move shared code to unversioned geographic/terrain modules first.
- `legacy-packs.ts`: current content resolution and geographic pack construction still depend on it.
- Generator v1: the default startup and explicit legacy world choices still use it, independently of old saves.
- Legacy pathfinding and generation dispatch: still reachable through supported versions. Retiring them requires an explicit supported-version decision, not a dead-code deletion.
- Graphics/history/terrain/prop/character labs: useful authoring and review surfaces. Isolate their loading rather than removing them indiscriminately.

A TypeScript import-reference scan found no obviously orphaned source module after checking non-TypeScript entry points: the apparently unreferenced `terrain-tile-study.ts` is loaded by an artifact HTML page. This is not a proof that every export or branch is needed, but there is no evidence for a large safe dead-directory purge.

## Suggested delivery order and checks

1. Establish a repeatable production benchmark for the **current integrated generator** with fixed seed, date, viewport and world settings. Record shell ready, visible terrain ready, main-thread long tasks, accepted command durations, frame distribution and retained resources separately. The existing `scripts/measure-browser.mjs` mainly exercises older worlds and canvas-ready rather than terrain-ready.
2. Remove duplicate atlas/idle worker work; guard depth/texture setters; cache minimap backgrounds; reuse observations. These changes are small and easy to review independently.
3. Move startup preparation off the main thread, remove redundant population construction from the raster worker, and prepare geographic indexes offline. This is the main architectural performance task.
4. Coalesce checkpoint work and add derived entity/spatial indexes as scaling measurements justify them. Retire compatibility paths only after deciding which worlds remain supported.

Treat a 16.7 ms frame budget and avoiding gameplay main-thread tasks above 50 ms as starting targets, not measured guarantees. Add long walks across several districts, zoom-out, crowded scenes, hour-long simulated waits and slower-device/CPU-throttled runs. Keep the blank-page cadence control. Validate cache changes with deterministic output comparisons and renderer changes with browser visuals.

Validation performed: production TypeScript/Vite build passed; 23 focused character, terrain-art, habitat, street and water tests passed; production browser startup and public-command samples completed without page errors. The full suite, save restoration, deployment, and a statistically broad device benchmark were not run. Existing shared edits were preserved.
