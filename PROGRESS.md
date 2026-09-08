## Restrained water animation and palette polish — September 8, 2026

The user-approved full worktree was checkpointed as `dd00761` before this pass. Added an original shared 128×96 pixel atlas with eight-frame ripple, curl, crest, plant, leaf and ring sequences. Surface motifs form, open and dissolve, with quiet intervals and at most one selection per 2×2 cell area. Rare habitat details replace that tile's surface motif. River motion follows the existing tangent; coastal wash now uses fewer, longer broken shapes with gaps. Warm sandy lips stay soft while raised rocky edges retain stronger contact shade.

Five hue-shifted depth colors, broad asymmetric seabed fields, sparse clustered surface marks and fewer grouped submerged stones enrich the water without filling it with detail. Small plants, turning leaves and expanding rings are limited to appropriate unfrozen woodland/wetland freshwater. Cultural families, world generation, collision and gameplay state are unchanged. Chunk containers own the animated images; the shared atlas is created before chunk texture ownership and survives chunk eviction. Per-frame work reuses cached active counts, and only shoreline cells produce foam geometry. See `WATER.md`.

Validation: seven focused water tests passed, including native-pixel bounds for every motif/flow, deterministic chunk parity, density limits and ecological gates. Three browser checks passed: five climates at overview and 2× zoom, pixel animation/pause stability, chunk eviction/atlas survival, preview/play lifecycle, actual bridge crossings, and a blank-page versus water cadence benchmark. Reviewed `artifacts/water-*.png`, `artifacts/water-detail-*.png` and the bridge capture. Active motif fractions were about 7–8%. An initial five-scene run measured p95 16.7–16.8 ms; a later run measured 33.4 ms, and the dedicated comparison measured the same 33.4 ms for both a blank page and animated water. Timings reflect the local browser/host conditions, not a universal frame-rate promise. Production build passed with the existing bundle-size advisory; `git diff --check` passed.

The water pass remains rendering-only. At the user’s subsequent request, the full worktree is checkpointed together, including the independently authored palm-art changes in `scripts/art/vegetation.py` (Python syntax validated). No deployment.

## Ecological water, currents and coastal waves — September 8, 2026

Added shared pixel-water rendering to topographic worlds: five continuous-field depth bands, quiet surface clusters, submerged stones, flowing river highlights and stone wakes, offshore crests, staggered shoreline wash and winter edge accents. Base ecology selects independent river/coastal colors and bank/stone materials: warm desert silt/sandstone, dark jade tropical rivers, pale aqua tropical beaches, neutral temperate shores, cooler boreal/slate and Arctic gravel. Northern shore surfaces are gravel; narrow temperate coastal margins can also be stony. Existing reeds and shoreline decoration remain ecology-driven. The “Monsoon river” study uses the existing tropical envelope rather than a new precipitation model.

Water pixels rasterize in the terrain worker and install as one composed ground page; retained, culled Graphics overlays animate at 10 Hz. World-coordinate placement and a shared clock preserve seams and pause phase across chunk loads. Bridge tiles suppress effects and foreground painter order is retained. New desert/monsoon river, tropical lagoon and Arctic shore quick studies plus Pause water make comparison straightforward. Wilderness previews now frame the nearest water directly; player placement is unchanged.

Validation: 22 focused unit tests passed across water, topography, terrain-world and regional-composition suites. Two browser checks passed, including five ecological water scenes, real pixel changes during animation, reproducible paused screenshots, unchanged simulation state, chunk pan/zoom, preview/play teardown and actual bridge crossings. Final five-scene samples measured p95 16.7–16.8 ms; sampled maximum water updates 0.4–3.4 ms and maximum chunk installs 14.5–24.8 ms. Bridge round trip measured p95 16.8 ms / maximum 50.1 ms. These are local measurements, not device-independent budgets. Production build passed with the existing bundle-size advisory. Reviewed `artifacts/water-*.png` and the bridge capture.

See `WATER.md` for ownership and limits. No fluid simulation, new river routes, collision changes, save restoration work or new cliff-coast landform. Other shared-checkout terrain/settlement edits are preserved. No commit or deployment.

## Natural landforms and terrain-led settlements — September 8, 2026

Implemented the requested stage-one/two composition pass for the experimental procedural explorer. Replaced sine-wave rivers with cached coarse routes influenced by continuous terrain, bounded lateral movement and shared reach endpoints. Warped broad forms produce irregular ridge/basin shoulders; variable shores and asymmetric floodplains carve low ground before visible tiers are assigned. Small unsupported elevation protrusions are softened. Natural two-cell passes are selected along stable contours instead of appearing at fixed coordinate intervals. River gravel banks, lake/coast margins and wet pockets use distinct surface rules.

Settlement centers favor flat dry ground near water. Organic settlements connect suitable neighborhood/court/crossing anchors before placing buildings, reuse routes and add limited cross-links. Dense and waterfront patterns no longer imply a grid; planned settlements retain one. Frontage intervals, setbacks and visible yard wear vary. Field plots are selected from fitting connected ground using moisture and proximity. Wider stone-surfaced routes and narrow dirt paths retain distinct treatment. Generation-only diagonal search still rasterizes to validated cardinal paths; player routing defaults and crossing rules are unchanged.

The regional planner shares bounded deterministic reach data with the existing production generation path. Road searches use explicit budgets and cached ground preferences. Natural pass planning is only triggered at relevant contours. Wilderness previews now frame nearby water without changing the player start. Existing explorer seeds intentionally generate the new composition; `de1e0bc` is the preceding checkpoint. Original Anatolia revision-one composition and earlier generator behavior remain unchanged.

Validation: 26 focused tests passed, including positive/negative reach boundaries, cache-order/eviction independence, continuous water, margin variation, and reachable household entrances for rolling, dense plain, ridge and basin worlds. Two browser checks passed, covering all six explorer presets, three uninhabited geography views, preview/play identity, overlays and a dense-town runtime command. Latest dense-town five-minute command: approximately 576 ms in Chrome locally; generation and simulation timings vary with load. Production build passed with the existing bundle-size advisory. Reviewed `artifacts/procedural-*.png` and `artifacts/regional-*.png`. No commit or deployment in this task.

This remains bounded procedural composition, not watershed/tributary simulation, erosion or historical urban growth. See `ECOLOGY.md` and `SETTLEMENTS.md` for ownership and limits.

## General environments, household livelihoods and procedural explorer — September 7, 2026

Added opt-in v3 terrain revision 2 with eight ecological envelopes, four independent landforms, river/lake/coast/no-water configurations, sparse/settled/uninhabited population and resident/visitor/wanderer/shepherd starts. Local habitat pockets influence vegetation, resources, materials and minimap ground. Sand and winter snow extend the shared terrain atlas; existing three-tier contours, two water depths, timber bridges, collision and chunk rendering are reused. No settlement or valley is mandatory. The original Anatolia shortcut remains a revision-one test.

Generated households now have residences, shared stores, ages and reciprocal family/co-resident links. Finite fruit, berries, branches, reeds, grain and grazing stock connect ecology to activity. Adults discover and gather reachable supplies, return them to household stores, eat/refill household water and return indoors at night; children stay near home. Player members can contribute supplies to the same store. Sheep/goats consume grazing patches. These are bounded prototype activity rules and generic ecological categories, not a complete demographic simulation or historically certified species catalogue.

`/terrain-lab` now opens a procedural explorer with six contrasting quick studies, seed/reseed, ecology, landform, water, population, settlement pattern, starting role, household composition, season/date, height/moisture overlays and household/stock inspection. Local previews use the production renderer; Play this world opens the exact same Runtime. Preview camera focus is independent of the player, with settlement/player centering. The fixed art fixtures remain under `?study=meadow` and `?study=contours`. Fixed scene teardown so repeated preview/play switches dispose subscriptions and terrain workers.

Validation: 20 focused unit tests passed (ecology/household/resource simulation, terrain, crossing and contour seams), along with all three relevant browser checks. The new browser check renders all six presets, verifies preview/play hash identity, checks settlement-free and shepherd starts, switches overlays and advances the dense town through the playable runtime. Production build passed with the existing bundle-size advisory. Visually reviewed woodland, coast, desert camp, tropical waterfront, snowy tundra and dense-town previews. Local woodland 30-minute simulation measured about 290 ms in isolation / 670 ms alongside build/tests; the dense-town five-minute runtime command measured 562 ms in Chrome. These are local measurements, not universal budgets.

See `ECOLOGY.md` for module ownership, assumptions and remaining scope. Industrial production, species/date/region research, demographic change and climate-driven hydrology remain future work. No commit or deployment in this task.

## Terrain streaming and diagonal movement repair — September 7, 2026

Fixed the outdoor diagonal regression: the shared crossing rule now checks all four cardinal edges around a diagonal; clear level ground permits it, while water, solids, ledges and ramp side entry remain blocked. Removed the unconditional diagonal rejection in the relief world adapter. This is additive command support; world generation inputs and prior successful cardinal commands are unchanged.

Replaced synchronous whole-view topography rebuilding with retained 16×16 chunks. Terrain sampling (including neighboring settlement preparation) and contour rasterization run in the existing world-worker bundle. The main thread installs at most one completed chunk per frame, prioritizes visible terrain, prepares a fringe ahead of movement and evicts distant chunks/textures. Zoom and lighting retain geometry. Scenery refreshes independently over a smaller region. Relief sessions skip the unused legacy tile prefetch. Ground variation uses world coordinates; pixel/row ownership and neighbor sampling preserve contour seams, and bridge discovery preserves whole spans across chunk edges. Existing bridge/ground artwork from the shared worktree is retained.

Validation: 21 focused unit tests passed, including outdoor diagonal commands, corner restrictions, contour pixel/depth parity across positive/negative chunk seams, bridge span identity and settlement coverage. Four browser checks passed: ordinary input/animation, the terrain study, bridge crossing and a 190-step outdoor round trip which builds new chunks and checks zoom/lighting reuse. Latest long-walk measurements: p95 16.8 ms, maximum frame 100 ms, 53 chunks built, 61 retained, maximum chunk installation 4.8 ms and zero frames missing visible terrain. The bridge round trip peaked at 50 ms. Previous reviewed whole-view rebuilds took 928–1,381 ms on the main thread.

Production build and production-browser smoke check passed; the existing large-bundle advisory remains. Production preview reached visible-terrain readiness in 1.93 s after selection (1.44 s terrain preparation), with maximum chunk installation 4.8 ms and no page errors. Measurements are local, not cross-device guarantees. New screenshots: `artifacts/terrain-stream-overview.png`, `artifacts/terrain-stream-bridge.png`, `artifacts/terrain-stream-production.png`. Existing unrelated screenshots and worktree edits were preserved; no commit or deployment.

## Timber bridges and crossing performance — September 7, 2026

Checkpointed the complete approved terrain worktree as `7691fe6`. Relief bridges now render as connected timber spans with long shaded planks, pegs, capped end posts, front bearers and cast shadows over water. Deck rows participate in elevation-aware painter order; bank bevels are clipped beneath the span so they cannot cut holes in its abutments. The shared renderer serves the meadow study and the playable Anatolia preview.

Static ground and material blends are now composed into 512px canvas pages, eliminating thousands of persistent ground sprites. The visible terrain patch has a 32-tile movement allowance instead of rebuilding at every 16-tile boundary. This is bounded viewport reuse, not streaming terrain: longer journeys, zoom or lighting changes can still rebuild the patch. The larger overscan trades some initial draw time for smooth local travel.

Validation: eight terrain unit tests and both focused browser checks passed, including a real-time bridge crossing in both directions and visual inspection with the player on the deck. Latest local round-trip measurement: p95 16.8 ms, maximum 66.7 ms, zero terrain rebuilds; preview ready about 2.2 seconds. These measurements are device/load dependent. Screenshot: `artifacts/bridge-closeup.png`.

## Terrain composition and loading correction — September 7, 2026

User explicitly deprioritized save restoration; current work and tests focus on graphics, generation, movement and speed. Replaced per-cell ramp spawning with separated paired road openings; broad northern/southern uplands expose substantial front faces. Buildings require level plots rather than overwriting the land with rectangular grading patches. Bridge decks include their dry approaches. The test settlement uses eight households, narrower visible paths and smaller bare yards. Gravel beaches, shoreline boulders, irregular shallows, turf shading and warmer earth planes distinguish river margins from uplands.

Performance: the initial preview no longer builds distant inter-settlement roads or samples the full Earth atlas per local cell. Contour rasterization works on exposed-edge spans with typed height lookup; production no longer builds an invisible duplicate tilemap. Measured local generation about 350 ms, browser preview ready about 1.3 seconds and static terrain render about 620 ms. These are local measurements, not device-independent budgets. Terrain tests check slope counts and household access; no save-restoration work was performed.

## V3 Anatolia terrain preview — September 7, 2026

Checkpointed the full prior worktree as `7eb4d94`. Added an opt-in saved terrain revision to v3, with seeded three-tier relief, wetland/grassland/dry-upland ecology, shallow/deep river water, graded settlement plots and slope-aware player/NPC routing. Playable rendering now projects terrain, objects and actors; minimap ledges and water depths share the same sample. New-world shortcut creates the 6500 BCE Konya preview (`anatolia-relief-1`). Earlier worlds omit the revision and retain their behavior. Details and deliberate hydrology/art limitations are in `TOPOGRAPHY.md`.

Validation: 30 focused terrain, settlement and legacy core tests passed; production build passed with existing bundle advisory; the new browser preview check passed. Reviewed `artifacts/anatolia-topography-v3.png`. An initial in-app browser crash prompted tighter contour textures and reduced offscreen rendering. The optimized preview then loaded successfully in a fresh in-app tab and was visually reviewed. All three terrain browser checks pass.

## Terrain border repair — September 7, 2026

Removed the independent rectangular contact-shadow strips and aligned contour coverage with the underlying ground. Small outward turf variations preserve coverage; faces now use warm vertical soil planes and tapered recesses instead of block noise. Ground surfaces render before contour walls so the next tile row cannot clip their connecting edges. Movement and height data are unchanged. Browser screenshots were reviewed; this remains a terrain-lab art study, with further visual distance from the reference mockup.

## Terrain relief and continuous banks — September 7, 2026

Revised the stage-one study following the user's comparison images: three readable meadow tiers, one broad northeast rise, two-wide slope, terrain-routed roads, winding two-depth river, pocketed marsh/reeds, and shared 14px projection for tops, actors, shadows and picking. Replaced disconnected side/front caps with a continuous contour silhouette and bevel; world-coordinate texture and subtle pixel variation now carry through bank turns. Retired the unused cap/face atlas pieces. The four-tier diagnostic scene remains. This is still an isolated review fixture, not production procedural hydrology or a world-generation migration.

Validation: seven terrain tests pass, including pixel connectivity around a stepped bank, plateau connectivity, water depths and ramp projection. Two browser tests pass, including elevated clicking, movement, pan/zoom, export and save isolation. Production build passes with the existing bundle advisory. See `TOPOGRAPHY.md`; screenshots are `artifacts/topography-*.png`. Unrelated worktree edits are preserved; no commit or deployment.

## Terrain stage 1 — September 7, 2026

Added isolated `/terrain-lab`: composed river meadow plus all-direction slope/corner fixture, four local height tiers, shared 24-color/16px terrain recipes, grass/damp/dry surfaces, gravel channels/bars, banks, ledges, ramps, and existing building/vegetation sprites. Shared pure crossing rules govern keyboard and click-route movement; controls include height overlay, pan/zoom, reset and PNG export. New optional core/render modules are not consumed by existing generators. See `TOPOGRAPHY.md` for ownership and the stage-two boundary. Existing saves, playable atlases and other worktree edits are preserved.

Validation: three focused terrain tests and two browser checks pass, including traversal, blocked ledges, all-tier reachability, mobile layout, export and save isolation. Production build passes with the existing bundle-size advisory. Reviewed desktop meadow, contour and mobile screenshots. Work remains uncommitted.

## Shared prop pixel grid — September 6, 2026

Removed fractional per-definition sprite/shadow scaling. Sixteen small/medium families now use smaller hand-authored silhouettes on the same world pixel grid, plus a compact runtime stick. Prop Lab and the forty-family contact sheet show actual relative sizes at a common integer zoom. Source canvases remain 48×48 transparent storage; occupied art determines size. Rebuilt all material variants and dynamic silhouette shadows. Collision, saved identities, placement and era/culture rules are unchanged. Validation: production build, eight prop unit tests and six browser checks pass (gallery, keyboard interactions, water and collision).

## Settlement generator 3 — September 6, 2026

Implemented the approved settlement work for new procedural/World Weaver starts: six layout profiles, shared terrain-aware streets and river crossings, oriented buildings with accessible household/work plots, player-owned housing, fields, gated pens/troughs/pasture, and daily household/work/water/common-area activity. Weighted player/NPC routing uses the same collision rules; player gate opening is a recorded command. Generator 1 and 2 worlds retain their earlier generation and simulation. See [SETTLEMENTS.md](SETTLEMENTS.md) for the implementation and extension points.

New-world controls include a settlement-layout override. Florence has a city anchor; Neolithic defaults now generate villages rather than camps. Regional named-content and ecology expansion remain separate work. Browser checks cover six forms, walking into owned houses, pens, free/LLM routing, old journeys, save/replay, movement, props and lighting. The full 60-test suite and production build pass; all eight settlement tests also pass after the final visual changes. The existing large-bundle advisory remains. The legacy full-day test is substantially faster after indexing obstacles during simulation updates; this optimization preserves its hashes.

Screenshots: `artifacts/settlement-*.png`. `scripts/check-settlements.ts` checks six sample settings and reports reachable destinations and layout counts. No provider calls or deployment were needed. Shared unrelated edits remain preserved.

## Prop size and collision correction

Replaced blanket half-size portable rendering with per-definition scale (barrels 1×, chests/crates 0.9×, smaller vessels 0.6–0.75×); shadows match. Intact solid props now block their ground tile through the shared engine query for players, pathfinding and NPCs. Pickup/break clears collision and dropping restores it. Loose sticks/remains stay walkable; empty intact containers remain solid. See `PROPS.md` for replay implications.

## Movement polish — September 6, 2026

Player/NPC sprites retain active interpolation across UI/worker redraws; destinations are tracked independently from displayed positions. Keyboard and click-route steps share a 140 ms presentation cadence, with distance-adjusted diagonal timing, fractional camera following, motion-driven walking frames, moving depth and selection markers. Arrows/WASD combine axes; opposite directions cancel, short taps are buffered, and focus loss clears input/stops routes. Diagonals validate both adjacent cardinal cells to prevent corner cutting and cost three integer simulation seconds (plus the existing slope cost). Cardinal costs, NPC decisions, pathfinding, generation and saved state shape are unchanged. This is additive command support: old successful command logs contain no diagonals; legacy checkpoint hashes still pass. NPC time remains action-driven, as designed.

Validation: 50 existing unit/integration tests plus the new eight-direction/collision test pass; production build passes. Focused browser coverage verifies held arrows/WASD, key release, player/NPC intermediate positions and redraw preservation. Six existing journey browser tests pass, including input focus and browser/Node parity. One existing journey assertion expects Space to wait 60 seconds; the previously implemented prop controls perform a two-second pickup instead. Left untouched as unrelated prop-test maintenance. Visual check: `artifacts/movement-polish.png`. Shared unrelated work remains uncommitted and preserved.

## World Weaver routing clarification

World Weaver is the general LLM-enabled mode, not a classroom-only product. Clear place/culture-zone + period requests resolve locally even in LLM-enabled mode; incomplete or unrecognized requests use World Weaver. Procedural mode never calls a model and shows its fallback choice. Periods/centuries, names and existing starting hunger/fatigue fields now vary by seed; exact dates and saved results remain fixed. Existing settings without generated character fields retain their previous startup state for replay. The endpoint uses `UHS_WORLD_WEAVER_ACCESS_CODE`; earlier classroom-named configuration remains compatible. Prop work in the shared checkout is independent of this change. Validation: production build, 11 focused unit/replay tests and six world-creation browser tests pass; the browser regression verifies zero requests for Renaissance Florence and one mocked interpretation for “ancient shaman guy”. No real model calls were made.

## Interactive prop MVP

Validation: full suite passed at 45 tests before the final two prop tests were added; all 7 prop tests and the 25-test core/world/prop group pass, as do the 5 prop/gallery browser checks. Legacy replay hashes pass. Build passed after implementation, but the final build encountered a concurrently added `src/content/geography/character.ts` referencing a `WorldSetting.character` field not yet in its schema; that unrelated work was left untouched. The interactive implementation remains uncommitted after the requested baseline checkpoint.

Baseline committed as `120f870`. New content-version-2 worlds select shared props by era/culture/context and place them beside buildings; historical resolver exclusions win over defaults. Space picks up or strikes with a held stick, E looks inside/drinks, G puts down. Contents, identity, ownership and damage persist; broken remains expose existing goods. Old save/replay content stays version 1. See `PROPS.md` for scope and known provisional content.

## Ten additional prop redraws

Redrew storage jar, water jug, amphora, glazed jar, lidded basket, barrel, crate, pail, trough and roofed well, including 30 material variants. Updated Prop Lab and added `artifacts/prop-next-ten.png` contact sheet. Reused palettes, revised mouth construction and well masonry; ground shadows remain separate. All 30 variants pass dimensions/alpha/determinism checks; atlas and sheet regenerate identically. Work remains uncommitted.

## Prop proof geometry correction

Revised the six review sprites: aligned ellipse rims, deeper well interior, finer wrapped basket courses, folded sack mouth, and front-facing overhead chest. Contact sheet now has no static ground shadows; existing time-of-day masks remain independent. No gameplay changes or commit.

# Current: shared procedural Earth / World Weaver creation

The user authorized full implementation of the simplified geographic foundation with both local and optional LLM interpretation. `WORLDS.md` is the current geography/creation handoff, superseding the older regional-GIS proposal below. Both modes produce one saved `WorldSetting` and use generator v2; v1 worlds and recordings retain their generator and inputs.

Implemented: bundled Earth coastlines and major rivers, simple relief/climate fields, local coast/river composition, deterministic settlement districts and crossings, local/regional/Earth views, place/period/role parsing, keyword examples, and a server-only optional Gemini interpreter. The place catalog reuses original UHS descriptions only where named coordinates were matched; the old adjacency graph is retired. No historical certification gate was added. Added compact shelters and a thatched-house option using the existing art pipeline.

The classroom endpoint defaults to disabled and needs the environment values in `.env.example`. No real provider calls or deployment were performed. Content remains the early simulation's shared asset/occupation libraries: more local clothing, ecology, professions and economies are future content work. Global society transitions, sea-level history, long-distance travel and persistent-entity eviction remain future work. Prop gameplay approval is unchanged.

Verification includes offline creation without model requests, both endpoint outcomes with injected responses, same-seed world switching, negative chunk coordinates, shoreline/river orientation, valid catalog settings, doors, save/reload/replay, and legacy recording hashes. Completed validation: 40 unit tests, 12 journey/world-creation browser tests, production build, v2 headless replay parity, and visual inspection of London, Alexandria, Siberia and Haiti. After final layout changes, the five world-v2 unit tests and five world-v2 browser tests were rerun successfully. The build retains the bundle-size advisory for the atlas/Phaser assets.

---

## Prop review gallery — September 6, 2026

User-authorized, uncommitted review gallery: Command+2 / Ctrl+2 and `/prop-lab`, 40 families / 117 original code-authored pixel studies. Separate catalog, modular recipes and atlas; existing silhouette lighting reused. Search, category filters, variants, integer zoom, character scale, backgrounds and PNG exports. No prop gameplay or historical eligibility integration yet. Validation: production build and all three gallery browser tests pass; art outputs regenerate byte-identically. A broader test run encountered audio/world-v2 timeouts and a world-v2 save/replay hash mismatch in concurrent work outside this gallery.

# Implementation status — 6 September 2026

## Current summary

Two historical settings are playable: the Roman Tiber lowlands and Neolithic Konya plain. Reusable building contracts, the isolated graphics lab, six-band lighting and the Audio studio are implemented. The accepted twelve-family approach is documented in [design section 20](UHS_DESIGN.md#20-cultural-content-families-and-dated-local-profiles); its resolver and fixed twelve-era registry are implemented; additional playable historical settings are not.

The entries below are implementation records. Their test totals and performance samples apply to the work described, not to an automatically refreshed project-wide certification. The historical framework pass reran the checks recorded in the current handoff below; older counts remain records of their respective milestones.

## Current handoff: review eras before props

Prop-scope clarification: the demos are test environments, not the intended coverage limit. `PROP_PLAN.md` now proposes forty shared everyday object families, one-sentence art directions and controlled material/color variation; its old C/U proposal labels have been removed. This revision is planning only, not new art or interaction implementation.

The latest user instruction takes precedence over the earlier sequencing below. Delivered the executable twelve-era framework and read-only `/history-lab`, with culture/date/place/community resolution, source-linked hypotheses, explicit exclusions and context/capability gates. Roman and Neolithic pack exports pass byte-for-byte comparison with frozen v1 inputs; existing replay checks pass. Read [HISTORY.md](HISTORY.md) for the contract and [PROP_PLAN.md](PROP_PLAN.md) for the proposed silhouettes and era/family allocations.

The user explicitly requested review before prop art or item mechanics. No pickup, equipment, opening/breakage, new prop art, generation changes or occupation production cycles were implemented. Space still waits in the playable game; the proposed empty-handed pickup behavior is reserved for the next approved slice. Settlement and landscape generation are reserved for another phase/agent.

Historical research examples: Konya's conjectural early Indo-European affiliation under the farming hypothesis (with competing models and an unclassified alternative); a deep-Eurasian macrofamily thought experiment; a day-level Moscow 1991 political transition inside a single era. These are qualified records, not recovered speech, complete political boundaries or new playable settings. All 144 culture-era queries resolve structurally; most return unresearched coverage. Existing catalog assumptions are explicitly labeled rather than recertified as historical facts.

Validation: 35 unit/integration tests passed, including both original 154-command checkpoint replays. Two new browser tests passed for date changes, evidence/exclusions, hypothetical-language display, report/link reproducibility, isolated save behavior, mobile layout and invalid inputs. Final production build passed. The seven historical-framework tests were rerun after the final isolation/determinism refinements, and all nine browser checks in history-lab + journey passed, including browser/Node equivalence and saved-journey interactions.

## Earlier recommendation: dated local content profiles (partly delivered; sequencing superseded)

**Recommendation after reviewing the design, implementation history, graphics, audio, provenance and current content code:** make the existing worlds resolve through small dated local profiles, then prove a genuinely different daily-life setting in Java. The art and audio extension points are ahead of the occupation and content-resolution systems.

Current constraints observed in code:

- `src/core/types.ts` has one flat `Pack` definition and a fixed `ItemId` union; `src/runtime/schema.ts` repeats item IDs and accepts only `roman`/`neolithic` manifests. Extend registered definitions and validation together; do not merely relax validation to arbitrary strings.
- `src/world/generate.ts` assigns role labels from pack data but gives residents a common trade-based inventory template and generic work locations. Some containers, household stores and crops remain hard-coded.
- `src/core/engine.ts` supplies a common home/work routine and role-based activity text; it does not yet simulate distinct production processes for the listed professions.
- Graphics already select reusable recipes; music already separates composition and instrumentation. Neither provides complete, authenticated cultural coverage. Audio's four 28-day seasons are provisional, and its six SFX cues are audition-only.

Recommended bounded sequence:

1. **Resolve the two existing profiles without changing their worlds.** Separate dated identity, selected component libraries, ecology/capabilities and local overrides only where current packs need them. Use a small explicit function returning resolved definitions. Validate references, exclusions and conflicts. Preserve existing manifests, IDs, random draws and generated results; do not scaffold twelve empty pack implementations.
2. **Prove behavior as well as appearance in one new setting.** Research a specific Javanese locality around 950, then deliver one small settlement and a playable work-and-exchange cycle with suitable houses, clothing, tools, inventory, a distinct NPC occupation and a musical treatment. Add only the shared mechanics that cycle needs. New mechanics or physical generation changes need explicit versioning; preserve compatibility or provide a documented migration/refusal path.
3. **Use Melbourne, 1950 as the later modern stress test.** First test its profile and asset selection; introduce transport, electrical infrastructure and modern work only when a bounded playable scene needs them. Do not represent unsupported systems with labels alone.

Acceptance for step 1: both existing 154-command checkpoint journeys still produce their recorded hashes; saves import and round-trip; browser/Node commands agree; unsupported place/date combinations fail clearly; renderer and UI acquire no cultural-family branches. Add focused resolver tests for local overrides and excluded content.

Acceptance for step 2: the player can recognize the setting through everyday buildings, clothing and objects without reading the title; observe a distinct NPC work cycle with actual persistent inventory effects; participate in an exchange; save/reload and replay it through the same command interface. Manual listening/visual review must accompany functional checks. Dates, season assumptions, introduced goods and historical claims need explicit applicability.

Finish small sensory integration alongside this slice: choose appropriate sound cues for actual successful actions and give the new setting a justified seasonal mapping. Keep settlement composition improvements tied to the selected scene. Broader GIS, a universal city generator, model-enhanced dialogue and production of all twelve libraries remain separate work. Existing milestone numbering in the design is historical sequencing, not a reason to start model integration before this content proof.

## Delivered

- Design v2 records the user's original-art requirement, free-first $10 ceiling, Roman/Neolithic initial scenes, and generic-engine priority.
- Original pixel-art proof and an atlas compiled from repeatable recipes. No purchased or restricted third-party pixels ship.
- One React/Vite/Phaser application with two seeded settings, four settlements each, sparse terrain, persistent interiors, people, wildlife, and shared contextual commands.
- Deterministic core, visibility projection, needs and routines, bounded distant catch-up, trade, theft/restitution, harvesting, eating/drinking/resting, following permission, animal handling, and capture uncertainty.
- Local save/import/export with validation and single-writer handling; command recording, graphical replay, single-step/scrub, and resume-from-replay branching.
- A Node player runner, actual local MCP transport, browser player API, and optional feature-detected WebMCP registration.
- A real prepared lower-Tiber centerline. Neolithic local geography remains explicitly inferred. The broader elevation/drainage geographic gate is not marked complete.

## Verification record

Initial foundation verification: 19 core/content/rendering/MCP checks and 8 real-browser checks passed; the production build passed. A short production movement sample in Chrome 152 at 1440 × 1000 recorded a 649 ms ready time, 16.7 ms median / 16.7 ms p95 frame interval, roughly 26 MB JS heap, and no page errors. An empty-page baseline in the same run also measured 16.7 ms, so this session was limited by the browser frame cadence. This is a short local measurement, not a cross-device performance guarantee. The exact report is `artifacts/performance.json`. `artifacts/` contains the original art proof, inspected game screenshots, stitched generated maps, and actual scripted-day trajectories/snapshots. Re-run the documented commands after changing versions or rules. Recorded hashes describe only their pinned implementation.

The two actual scripted days each executed 154 accepted commands, reaching 21:00. Exact replay verified Roman hash `b6d511bc` and Neolithic hash `830dca2c`.

The browser test found and resolved missed quick keyboard taps. Visual review found and resolved a spawn/roof overlap, excessively wide parcel spacing, abrupt terrain edges, and an initially obstructive narrow-screen panel. Replay files from both the browser and the Node runner are supported.

## Deliberate limits and next work

The prototype supports two concrete content packs; free text is catalog parsing, not arbitrary simulation generation. Optional model enhancement, hosted sessions, fine-grained geography/elevation, deeper social/economic systems, and further eras are not implemented. The browser's experimental WebMCP registry was unavailable for native verification; stdio MCP is tested against a real SDK client.

The current sequence is user review of the era framework and prop plan, followed by the approved interactive-prop slice. The earlier Java proposal is deferred. Continue visual and interaction review within those slices. The geographic pipeline remains a separate measured step. Model enhancement still requires a chosen provider and explicit spending controls; no model calls or spending occurred in the recorded implementation work.

A final botanical review replaced the Anatolian pack’s acacia selection with regionally attested hackberry and added the botanical evidence record. The schematic tree artwork and individual tree locations remain inferences.

No deployment, old-repository changes, asset purchases, or external messages were made.

## Mockup-driven polish pass

Rebuilt the interface with charcoal panels, thin gold borders, locally served Baskervville type, a 54 px header, map-owned toolbar, full-height portrait sidebar, context thumbnails and functional Local/Region minimap controls. The map owns more of the viewport; mobile panels and dialogs remain usable. Inspect and map changes cost no simulation time.

At completion of the earlier UI polish, the atlas contained 297 named frames: 18 portrait color/identity variants, revised foliage and tunic contours, deeper terracotta roofs, two-storey and pilastered facade modules, awnings with shelf detail, differentiated mudbrick roof furnishings, broken stone paving, quays and modular bridge arches. Both scenes use the same authoring method. No imported tileset pixels were added.

`src/render/materials.ts` provides bounded cached cosmetic surface rules shared by the scene and minimap; no save schema, entity position, entrance, collision or simulation rule changed. The engine tests still pass, and the browser suite now also verifies Local/Region switching and inspection without time advance. Final screenshots: `artifacts/roman-first.png`, `artifacts/roman-polished-context.png`, `artifacts/neolithic-first.png`, and `artifacts/mobile-inventory.png`.

The UI is much closer to the mockup. The largest remaining visual difference is settlement composition and density: the prototype still has widely spaced parcels and a small facade vocabulary. This pass preserves those physical layouts and refines their presentation; it does not claim exact mockup fidelity.

## Target 3 world-rendering pass

Completed a separate graphics pass against `mockup target 3.png`. The world now uses exposed earth bank faces, lit lips, contact shadows and shallow water; 8-neighbor corner treatments; animated water highlights; repainted, higher-contrast mudbrick roof/wall planes and roof openings; larger world characters; clustered foliage and rock volumes; coherent projected ground shadows with per-frame foot anchors; and narrow, connected paths derived from existing entrances through static walkability. Roman scenes inherit the shared lighting, foliage, props, characters and water refinements while retaining their stone waterfront treatment.

At completion of the target-3 pass, the atlas had 1,489 named frames, mostly generated edge-mask and shadow combinations. All five game-asset files exported in that pass regenerated byte-for-byte. No imported mockup pixels, paid assets, new UI pass, save-schema changes, entity moves or collision changes were introduced.

Visual iteration corrected detached shadows, overly busy water, excess reeds, disconnected paths, and crop clumps appearing over roads. Crops now draw up to three clumps per parent patch and share selection, inventory, and depletion. The browser test walks to a field, clicks a child clump, gathers grain, and verifies the shared state transition. New render tests exercise walkable path construction across seeds, water preservation, and surface-cache order independence.

Final inspected captures: `artifacts/target-3-pass.png` (1536 × 1024), `artifacts/target-3-map.png` (map only), `artifacts/neolithic-field-detail.png`, `artifacts/neolithic-field-harvested.png`, and both initial scene captures. Both production movement samples measured 16.7 ms median/p95 with the same blank-page cadence, no page errors, and no development handle. Neolithic scene switching measured 173 ms in that sample. These are short local measurements, not cross-device guarantees.

This pass improves depth and material treatment within the existing world layout. It does not claim pixel-for-pixel reconstruction of the illustrative target or new terrain-elevation simulation.

## Modular graphics and isolated review lab — September 6

Initialized a local Git repository before editing. Baseline commit `e9966ca` is tagged `checkpoint-before-graphics-refactor`; generated assets and the complete running source are recoverable without the ignored downloaded reference packs. No remote was configured and nothing was published.

Implemented content-owned building recipes and generated contracts (physical footprint/entrance, visual bounds/anchor, height, materials, roof form and attachments). The world generator selects frame IDs from pack data; the renderer does not branch on a Roman/mud architecture enum. Reusable wall, opening, foundation, roof and attachment functions produce four classical and four mudbrick variants plus three later construction studies. Revised foliage, quieter meadow patches, contact/cast shadows, water material variants and bank corner handling. Parcel-derived districts, communal-hub footpaths and shared enclosure geometry remove several previous renderer-specific layout assumptions.

Added `/graphics-lab` and a Settings link. It uses the normal Phaser WorldScene with isolated runtimes and no save or terrain-worker connection. Court/generated-settlement modes, six family presets, separate landscape choices, light treatments, integer zoom, true square/portrait test frames, seed/camera URLs, diagnostic bounds/entrances, frozen animation and PNG export are implemented. The later-era presets are explicitly construction studies, not new historical game packs.

Validation: 22 unit/integration checks and 10 browser tests passed; the final lab frame/PNG/reproducibility checks were rerun after the last frame-layout adjustment. Both original 154-command checkpoint journeys replay to their recorded hashes (`b6d511bc`, `830dca2c`); their saved snapshots still import. The generated atlas/material/contracts reproduce byte-for-byte. Production build and a production lab launch pass with no page errors or gameplay action surface in the lab. Production Chrome movement sampling at 1440×1000 reports median 16.7 ms in both scenes, p95 16.7–16.8 ms, with no page errors (local headless measurements, not a device-wide performance guarantee).

Remaining scope is explicit in `GRAPHICS.md`: physical generator-v1 channels are preserved for save compatibility; the varied-contour court is a fixture, not a silent change to old water collision. At that stage, fixed-direction light treatments did not model a moving sun; the subsequent six-band lighting pass is recorded below. The universal settlement planner and comprehensive future-era asset families remain separate work. Artistic acceptance against the references remains a visual review, not an assertion made by these tests.

## Time-of-day lighting and silhouette correction — September 6

Replaced the fixed cast/contact shadow frames with six local-hour presets shared by the compiler, gameplay and graphics lab. Solar casts reverse from morning to afternoon, shorten at midday, and disappear at night while base contact remains. The matching optional color treatment tints terrain and world sprites and adds a restrained ambient wash. Existing painted highlights remain part of the source art; no normal-map or astronomical lighting system was introduced.

The user's tree/pot detail exposed a near-flat projection: keeping source width screen-horizontal collapsed the canopy over its trunk at low angles. Upright casters now preserve width across the cast direction. Contacts use actual base pixels rather than generic ovals. Building footprints retain their own ground-plane projection; hearth flames are excluded from casting and keep their color. All masks are generated once into one separate atlas, using native Phaser pivots. Old fixed-shadow frames and the extra anchor manifest were removed.

Validated the six presets in the browser, independent color/shadow toggles, midnight/band boundaries, game-clock transition and reload, and a pixel-mask regression check requiring a narrow tree trunk and vessel neck relative to canopy/body. Checkpoint journey replay remains unchanged. Documentation and lab URLs cover the six phases; older day/warm links still resolve. Review images are under `artifacts/lighting-*.png`.

## Audio foundation and cultural-content decision — September 6

Delivered the Audio studio (Command+1 / Ctrl+1), five original 32-bar themes, two choices per season/time slot, three orchestration previews, four stem controls, six SFX auditions, WAV export and seven rendered MP3 listening copies. Composition and instrumentation are separate, with world-clock selection and a declared provisional calendar. Cultural orchestration and live world-action SFX remain future work; see [AUDIO.md](AUDIO.md).

Recorded verification from the audio implementation session: 28 unit/integration tests passed; the focused audio and existing journey browser suites passed nine tests together; the two audio browser tests and production build were rerun after the final lifecycle adjustment. All seven preview renders were checked for non-silence and clipped samples, with results in `public/audio/previews/manifest.json`. This does not claim the entire browser suite was rerun in that session or that automated checks establish musical quality.

The subsequent documentation review recorded the accepted twelve-family approach in design section 20, distinguished planned profiles from implemented content, prioritized the resolver/Java sequence above, and corrected obsolete fixed-shadow asset references. No new historical pack or runtime feature was implemented by that documentation update.
