# Roguelike Ruins Refactor Plan

## Vision
- Deliver a historically grounded, replayable ruins expedition that looks stunning, plays smoothly, and advances the game’s core mission: a simulator capable of any time/place with LLM-assisted roleplay anchored to authentic sources.
- Preserve standout elements (Ruin Banner atmospherics, translation puzzles, archival terminal aesthetic) while replacing ad‑hoc systems with a maintainable, fully implemented pipeline.
- Treat the refactor as a cross-team initiative spanning data, gameplay, UI, and tooling so that future content authors can extend ruins without fear of breakage.

## Current-State Findings (Audit Highlights)
- **Monolithic implementation** – `components/RoguelikeDisplayEnhanced.tsx` (~6k LOC) intermixes rendering, state, generation, LLM calls, and input handling, making correctness and testing difficult.
- **Data silos & randomness** – Historical context relies on mixed sources (`public/sources/metadata`, `services/ruinSourcesService.ts`, `services/contextualManuscriptService.ts`) plus procedural guesses (e.g., scripted languages like “Pottery symbols”), creating contradictory discoveries.
- **LLM contracts are loose** – `generateHistoricalDiscovery` and related prompts accept broad context but return free-form prose without schema validation or fallback visibility when Gemini fails.
- **Gameplay pacing** – Discovery tiles trigger passive text walls; translation mini-games and encounters are siloed modals that interrupt flow rather than integrate with exploration/strategy.
- **Integration gaps** – Ruin progress, quests, and knowledge systems share little data; primary sources unlocked in ruins don’t inform the broader simulation or player progression.

## Guiding Principles
1. **Historical Fidelity** – Every output is traceable to curated data or validated LLM snippets; no “fantasy filler.”
2. **Player Agency** – Discoveries are earned through meaningful choices (survey, excavate, interpret) that feed into a knowledge economy.
3. **Modularity & Testability** – Core systems (map engine, content pipeline, UI shells) are isolated, typed, and unit-tested.
4. **Author-First Tooling** – Designers can add ruins, artifacts, scripts, and encounters via schema-validated JSON and preview tools without touching React internals.
5. **Performant & Resilient** – Precomputed dossiers, cached LLM returns, and optimistic UIs keep runs responsive even when offline.

## Target Architecture Overview
| Layer | Responsibilities | Implementation Notes |
|-------|------------------|----------------------|
| `historical-content` services | Load curated datasets, resolve LLM prompts with schema enforcement, cache results | New folder (e.g., `services/historical`) with data accessors, Zod schema guards, IndexedDB/localStorage caching |
| `dungeon-engine` | Pure map generation, entity AI, combat, interaction hooks | Extract from `RoguelikeDisplayEnhanced` into `engine/ruins` with reducer/state machine + tests |
| `gameplay-systems` | Expedition deck, knowledge meter, quest hooks, loot tables | Lives in `services/ruinsGameplay`, interacts with engine via events |
| `ui-shell` | React presentation components (map renderer, overlays, HUD, terminals) | Split `components/RoguelikeDisplayEnhanced` into `RoguelikeScreen`, `DiscoveryTerminal`, `TranslationModal`, etc. |
| `integration` | Sync with `ruinProgressService`, global quest system, journals, audio, achievements | Encapsulated in controllers, no direct fetch/LLM in UI |

## Historical Data & LLM Pipeline Overhaul
1. **Roguelike data bridge**
   - Create `services/ruinsDataBridge` that reads existing language tables and primary source shards in read-only mode, adding roguelike-specific helpers (script display labels, artifact templates) stored locally under `generation/ruins/data/`.
   - Supplemental JSON only augments roguelike needs and never mutates or replaces shared assets, ensuring the rest of the game remains untouched.
2. **Dossier generation**
   - On entering ruins, assemble a `RuinDossier` using the data bridge: construction year, plausible scripts, curated source candidates, artifact expectations, and LLM prompt payloads. Cache dossiers in a roguelike-local store (or via `ruinProgressService` metadata) so other systems keep their behavior.
   - Provide deterministic seeding so each ruin yields consistent content across sessions unless explicitly regenerated.
3. **LLM contract enforcement**
   - Wrap Gemini calls in a roguelike-scoped `historicalContentBroker` that:
     - Submits structured prompts (room type, artifacts, timeline) and expects JSON (`{ title, description, citations, followUpQuestion }`).
     - Validates output with Zod; on failure, logs and downgrades to curated fallback, showing a UI badge (“Curated note”) for transparency.
     - Stores validated responses in IndexedDB keyed by dossier hash to eliminate repeat calls.
4. **Author workflows**
   - Add `scripts/validate-ruins-data.ts` to lint supplemental roguelike data and verify joins against existing shards without modifying them.
   - Provide a Storybook/preview harness that feeds on the data bridge so authors can preview discoveries safely.

## Gameplay Loop Rework (Expanded)
1. **Expedition phases**
   - **Recon**: Players choose actions (survey, consult map, interview NPCs). Unlocks hints, reveals hazards, or awards expedition cards.
   - **Delve**: Classic roguelike movement/combat remains, but encounters, hazards, and loot are gated by expedition decisions and knowledge stats.
   - **Interpretation**: Discoveries trigger interactive challenges (matching inscriptions, reconstructing artifacts, answering timeline quizzes) rather than passive text dumps.
   - **Synthesis**: End-of-run “Field Report” summarizes finds, compares LLM narrative vs. authentic excerpts, and feeds knowledge XP/quests.
2. **Expedition deck & knowledge meter**
   - Deck contains abilities (e.g., “Ethnohistorian Insight”) linked to player skills and historical expertise; cards are earned via recon choices or prior runs.
   - Knowledge meter tracks mastery over themes (architecture, ritual, governance). High knowledge unlocks deeper rooms or alternative endings.
3. **Dynamic encounters**
   - Merge historical encounters, translation puzzles, and NPC talks into a single `EncounterSystem` where outcomes influence decks, hazards, and archival unlocks.
   - Introduce cooperative tasks (e.g., decipher mural to disable trap) that integrate translation mechanic with geography/combat.
4. **Replay incentives**
   - Procedural objectives (catalog specific artifact sets, replicate excavation diaries) and rotating challenges ensure variety while grounded in curated data.

## UI & Presentation Enhancements
- Replace the single mega-component with composable views:
  - `RoguelikeScreen` (core grid, HUD).
  - `ExpeditionPanel` (phase tracker, deck, knowledge meter).
  - `DiscoveryTerminal` (archives viewer with compare mode: LLM vs. primary source).
  - `TranslationLab` (unified mini-game UI with tactile interactions, e.g., drag glyphs).
- Upgrade map visuals using existing `RuinBanner` aesthetic as reference: consistent pixel density, lighting cues from `TimeAwareBackground`, optional shaders for depth.
- Provide contextual tooltips and breadcrumbs: which expedition actions unlocked current discovery, what real-world references underpin it.

## Maintainability & Integration
- **State management**: Adopt Zustand or Redux Toolkit slices (`ruinsEngineSlice`, `expeditionSlice`, `archivesSlice`) with selectors, tests, and DevTools integration.
- **Separation of concerns**: Engine emits events (e.g., `DISCOVERY_FOUND`, `ROOM_ENTERED`); systems subscribe and react, enabling isolated tests.
- **Game-wide hooks**:
  - Feed discoveries into the `knowledge` and `journal` systems via existing public APIs so other features remain unchanged.
  - Sync quest progress via `questService` (e.g., “Document three ritual sites”).
  - Store deterministic progress inside `ruinProgressService` using backward-compatible metadata so current consumers see no behavioral change.
- **Audio & ambiance**: Refactor `gameSoundsService` hooks so sound cues trigger based on events, not inline string comparisons.

## Implementation Roadmap (Phased)
1. **Phase 0 – Foundations (1 sprint)**
   - Finalize design specs, approve data schemas, set up validation tooling.
   - Add instrumentation to current roguelike for baseline metrics (session length, error rates).
2. **Phase 1 – Data & Content Pipeline (2 sprints)**
   - Stand up the roguelike data bridge, supplemental metadata files, and validation CLI (read-only against existing shards).
   - Implement `historicalContentBroker` with schema enforcement and caching.
   - Backfill curated discoveries for major zones/eras within the supplemental data set; flag coverage gaps without altering global sources.
3. **Phase 2 – Engine & State Refactor (2–3 sprints)**
   - Extract dungeon engine to pure module with tests.
   - Introduce state slices, event bus, and deterministic saves.
   - Port existing features (combat, traps, translation) onto new architecture.
4. **Phase 3 – Gameplay Loop & UI Overhaul (3 sprints)**
   - Implement expedition phases, deck, knowledge meter, and interactive discoveries.
   - Replace monolithic UI with modular components; integrate new art/vfx.
   - Add compare mode (LLM vs. authentic sources) and field reports.
5. **Phase 4 – Integration & Polish (1–2 sprints)**
   - Hook into quests, journals, achievements.
   - Conduct balance tuning, accessibility review, localization pass.
   - Ship analytics dashboards and regression tests; run closed beta.

## Backlog Highlights by Track
- **Data/Tooling**
  - [ ] Define supplemental roguelike script metadata aligned with existing language keys (no global mutations).
  - [ ] Write read-only validator for supplemental datasets and joins.
  - [ ] Build dossier preview tooling (Storybook or CLI report).
- **Engine**
  - [ ] Extract map generation into `createRuinsDungeon(seed, dossier)`.
  - [ ] Implement event bus (`onDiscovery`, `onEncounter`, `onTrap`).
  - [ ] Add deterministic RNG utilities (seeded PRNG service).
- **Gameplay**
  - [ ] Design expedition card set + knowledge themes.
  - [ ] Build interactive discovery challenges (timeline ordering, artifact assembly).
  - [ ] Merge historical encounters & translation puzzles into unified system.
- **UI/UX**
  - [ ] Create wireframes for Expedition Panel and Discovery Terminal compare mode.
  - [ ] Implement modular overlays with suspense states and error badges.
  - [ ] Add “Field Report” summary screen with export/share options.
- **Integration**
  - [ ] Sync discoveries to `journal` entries and `knowledge` unlocks.
  - [ ] Emit quest events via `questService` when objectives met.
  - [ ] Extend `ruinProgressService` usage with optional deterministic metadata; ensure existing consumers remain unaffected.

## Testing & QA Strategy
- **Unit tests** for dossier assembly, data validators, engine reducers, and LLM schema parsing.
- **Simulation tests** that run expedition seeds to verify deterministic outcomes and absence of runtime errors.
- **Content QA pipeline**: automatically generate “playbills” listing discoveries per ruin to review historical accuracy.
- **Usability testing**: playtest new expedition phases with educators/historians to ensure learning objectives land.

## Risks & Mitigations
- **LLM dependency** – Mitigate with strong caching, curated fallbacks, and transparent UI badges when fallback used.
- **Dataset scale** – Provide authoring tools and community contribution process to populate underrepresented regions/eras.
- **Scope creep** – Lock MVP feature set per phase; maintain backlog for future expansions (co-op digs, multiplayer).
- **Performance** – Profile engine after refactor; reuse Web Workers if needed for heavy generation tasks.

## Immediate Next Actions
1. Approve the roguelike data bridge approach and supplemental metadata schema (confirm no external mutations).
2. Stand up the validation CLI to inventory existing primary sources (read-only) and highlight coverage gaps for roguelike supplements.
3. Draft UX wireframes for the Expedition Panel and Discovery Terminal compare mode to align design/art/engineering.
