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
