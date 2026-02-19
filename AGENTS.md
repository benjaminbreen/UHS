# Universal History Simulator - Agent Operating Guide

This file is the primary in-repo guide for coding agents for UNIVERSAL HISTORY SIMULATOR (or simply "History Simulator,") a project by the history professor and writer Benjamin Breen.

## 1) Non-Negotiable Identity

Universal History Simulator is a historically grounded educational simulation.

Primary goal:
- Simulate highly authentic, realistic, and historically plausible human life in specific times/places with real constraints, institutions, and tradeoffs.

Secondary goal:
- Use RPG-style mechanics/UI as delivery structure for the simulation.

Important rule:
- This is a historical simulation engine primarily intended for educational settings, like a university history class. No fantasy/supernatural framing in game behavior, UI copy, prompts, or documentation. Strict historical accuracy and realism is the goal.

General policy:
- If a behavior or narrative beat cannot be justified historically for the selected context, do not add it to core flows.

## 2) Product Priorities vs Optional Systems

Core systems:
- World/time/location generation and traversal
- Character generation, inventory/equipment, and survival pressure
- Historically constrained WorldWeaver scenario generation
- Event/mode framework
- Educational instrumentation (learning objectives and assessments)
- HistoryLens narrative interface

Optional side systems (low priority):
- Ruins/perimeter branches
- Ruins roguelike/minigame branches
- Legacy special-zone easter-egg branches

Important:
- Ruins/perimeter are optional flavor/easter-egg content, not genre-defining loops.

## 3) Runtime Topology (Canonical)

Route entrypoints (`App.tsx`):
- `/` -> `GameSplashPage`
- `/start` -> `GameSplashPage`
- `/home` -> `GameSetupScreen` (legacy)
- `/:year/*` -> main runtime

Provider order in runtime (`App.tsx`):
- `GameProvider` -> `PlayerProvider` -> `MapProvider` -> `UIProvider`

Primary surfaces (`App.tsx`, `hooks/useUIState.ts`):
- `historylens` renders `HistoryLensPanel`
- `map` renders `MapViewport`

App-level orchestration in `AppContent`:
- `useCoreLoops(...)` handles continuous simulation updates
- `useEventSystem(...)` handles mode/event lifecycle
- App-level modals include `WorldWeaverModal` and `InitialScenarioModal`

## 4) State Ownership (Respect Boundaries)

`hooks/useGameState.ts` via `GameContext`:
- Date/time, loading flags, logs/journal, narration history
- Current zone/region
- Liminal travel state
- Home anchor

`hooks/usePlayerState.ts` via `PlayerContext`:
- Player identity/stats/inventory/equipment
- Position, movement mode (`ship`/`onFoot`), icon transition state
- Interior map player state

`hooks/useMapState.ts` via `MapContext`:
- Map data/entities/cache/world coords
- Map generation entrypoints
- Adjacency/liminal map transitions
- Special map entry/exit
- Pending WorldWeaver scenario data handoff

`hooks/useUIState.ts` via `UIContext`:
- Modal/panel visibility and interaction UI state
- HistoryLens central mode + message stream
- Event bus UI bridges (including structure-entry handling)

`hooks/useEventSystem.ts`:
- Event queue/history, game mode, trigger checks, initial event flow
- Treat as event ownership boundary, not map-generation ownership

## 5) Startup Lifecycle (Implementation Detail, Low Product Priority)

This is not a roadmap focus, but agents can easily break startup if unaware of it.

Startup path summary (`App.tsx`):
- Parses pending save-load handoff from localStorage
- Parses shareable URL `?state=...` and validates/repairs scenario
- Applies generation guards to avoid double map generation
- Triggers `onStartNewWorldAtLocation(...)` or zone/region fallback

Cross-hook restoration:
- Hooks restore from temporary `savedGameData` (for example logs/journal/assessment)
- App later clears restore keys after initialization delay

Guidance:
- Keep changes here minimal and targeted unless explicitly asked to rework startup or save/load.

## 6) World Generation and Traversal

Primary world-start entrypoints (`hooks/useMapState.ts`):
- `onStartNewWorldWithCurrentSettings(characterSpec?)`
- `onStartNewWorldAtLocation(targetZone, targetMapArea, characterSpec?, overrideYear?)`
- `onStartNewWorldAtZoneRegion(targetZone, targetRegion, characterSpec?)`

Generation core:
- `proceduralGenerateMap(...)` in `generation/standardMap/standardMapGenerator.ts`
- Geography source of truth: `constants/gameData/geography.ts`

Transition core:
- `handleMapTransition(...)` in `hooks/useMapState.ts`
- `getNextMapArea(...)` in `utils/geographyUtils.ts`
- `ADJACENCIES` and `LIMINAL_SEQUENCES` in `constants/gameData/adjacencies.ts`

Special maps:
- `enterSpecialMap(...)` / `exitSpecialMap(...)` in `hooks/useMapState.ts`

## 7) WorldWeaver End-To-End Flow

There are two real trigger paths:
- Splash path: `components/GameSplashPage.tsx` -> `worldWeaverService.generateScenario(...)` -> encoded URL state
- In-game path: `components/TopNavBarPolished.tsx` -> `worldWeaverService.generateScenario(...)` -> `onStartNewWorldAtLocation(...)` + pending scenario modal data

Service responsibilities (`services/worldWeaverService.ts`):
- Prompt interpretation, year/map-area resolution, zone/region lookup
- Character specification enhancement
- Game mode suggestion
- Deferred quest generation APIs

Modal path:
- App renders `WorldWeaverModal` with pending scenario data at app level
- Current quest behavior is mixed/legacy: generation exists, integration is partially disabled

Agent requirements:
- Treat WorldWeaver as historical scenario generation, not fantasy storytelling.
- Space/water requests should be handled as contextual biome settings (for example astronaut/maritime/submarine contexts), not supernatural realms.

## 8) HistoryLens Architecture

Core files:
- `components/HistoryLensPanel.tsx`
- `services/historyLensService.ts`
- `services/historyLensActionRouter.ts`
- `services/historyLensEntryService.ts`
- `hooks/useUIState.ts` (event bus bridge and modal routing)

Flow:
- User text -> `generateHistoryLensResponse(...)`
- Returned actions -> `applyHistoryLensActions(...)`
- Event bus drives movement/navigation/structure entry side effects
- UI context receives events and opens the corresponding modals/interactions

Interpretation:
- HistoryLens is a first-class runtime mode, not just decorative narration.

## 9) Educational and Assessment Systems

Primary infrastructure:
- `services/learningObjectivesService.ts`
- `services/assessmentService.ts`
- Assessment/session data integrated through UI and save payloads

Guidance:
- Educational features are present but unevenly surfaced.
- Prefer integration/surfacing improvements over adding side minigames.

## 10) Optional Systems and Easter Eggs (Brief)

Ruins/perimeter:
- `components/RuinStructureModal.tsx`
- `services/perimeterEventService.ts`

Policy:
- Keep optional/easter-egg systems functional.
- Do not prioritize expansion of those branches over core historical simulation.
- Do not use them to redefine project genre.

## 11) Legacy and Deprecation Notes (Keep Brief)

1. Historical references to `CLAUDE.md` may still appear in old docs/commits, but `AGENTS.md` is the active in-repo guide.
2. `hooks/useURLGameConfig.ts` exists but is not part of the active startup path; URL config/restoration lives in `App.tsx` + `useGameState.ts`.
3. `hooks/useGame.ts` appears to be an older duplicate path; active runtime source is `hooks/useGameState.ts`.
4. Quest-related paths are mixed: generation exists, but parts of runtime quest integration are disabled/partial.
5. Special-zone naming is inconsistent (`Undersea ` trailing space, `Undersea Kingdom`, other legacy labels); normalize carefully and only when explicitly requested.

Do not perform broad cleanup rewrites unless explicitly requested.

## 12) Agent Behavior Rules for This Repo

1. Preserve historical grounding and educational intent.
2. Avoid fantasy/supernatural language in prompts, UI copy, docs, and generated narration.
3. Follow ownership boundaries across Game/Player/Map/UI contexts and event system.
4. For startup/restore issues, inspect `App.tsx` first, then relevant hooks; avoid broad rewrites.
5. For navigation/map issues, start at `hooks/useMapState.ts`, `utils/geographyUtils.ts`, and adjacency data.
6. For WorldWeaver issues, inspect both entrypoints (`GameSplashPage` and `TopNavBarPolished`) plus `worldWeaverService`.
7. For HistoryLens issues, inspect `HistoryLensPanel`, `historyLensService`, and `historyLensActionRouter`.
8. Keep optional systems (ruins/perimeter/legacy easter eggs) explicitly secondary.
9. Prefer targeted fixes with file-level rationale over large refactors.

## 13) Suggested Read Order for New Agents

1. `README.md`
2. `App.tsx`
3. `contexts/GameContext.tsx`
4. `contexts/PlayerContext.tsx`
5. `contexts/MapContext.tsx`
6. `contexts/UIContext.tsx`
7. `hooks/useGameState.ts`
8. `hooks/usePlayerState.ts`
9. `hooks/useMapState.ts`
10. `hooks/useUIState.ts`
11. `hooks/useCoreLoops.ts`
12. `hooks/useEventSystem.ts`
13. `components/GameSplashPage.tsx`
14. `components/TopNavBarPolished.tsx`
15. `components/WorldWeaverModal.tsx`
16. `services/worldWeaverService.ts`
17. `components/HistoryLensPanel.tsx`
18. `services/historyLensService.ts`
19. `services/historyLensActionRouter.ts`
20. `generation/standardMap/standardMapGenerator.ts`
21. `constants/gameData/geography.ts`
22. `constants/gameData/adjacencies.ts`
23. `services/shareableStateService.ts`
24. `services/urlConfigService.ts`
25. Optional: `components/RuinStructureModal.tsx`, `services/perimeterEventService.ts`

Legacy note:
- `hooks/useURLGameConfig.ts` is currently unused in active runtime and kept for reference.

## 14) Minimal Verification Checklist for Agent Changes

1. Run `npm run build`.
2. Run `npm test` (or targeted tests when appropriate).
3. Manually verify any touched startup path:
- URL/share-state scenario load
- WorldWeaver from splash and in-game nav
- HistoryLens action execution if related files changed
4. If touching optional systems (ruins/perimeter/special zones), verify they still function but keep scope narrow.

## Quick Reference - Essential Types

### Core Game Enums
**GameModeType (9 total)**: survival | exploration | commerce | scholarship | leadership | livelihood | diplomacy | healer | legal

**CulturalZone (9 total)**: EUROPEAN | EAST_ASIAN | MENA | NORTH_AMERICAN_PRE_COLUMBIAN | NORTH_AMERICAN_COLONIAL | OCEANIA | SOUTH_ASIAN | SOUTH_AMERICAN | SUB_SAHARAN_AFRICAN

**HistoricalEra (7 total)**: PREHISTORY | ANTIQUITY | MEDIEVAL | RENAISSANCE_EARLY_MODERN | INDUSTRIAL_ERA | MODERN_ERA | FUTURE_ERA

### Item System Types
**ItemCategory**: Tool | Weapon | Material | Apparel | Food | Special | Document | Consumable | Vessel | Ammunition | Container | Currency | Armor
**ItemQuality**: poor | standard | good | excellent
**Rarity**: Junk | Common | Uncommon | Rare | Ultra-rare | Unique
**WealthLevel**: poor | modest | comfortable | wealthy | noble

### Disease System Types
**DiseaseType alias**: respiratory | gastrointestinal | vector_borne | contact | parasitic | zoonotic | traumatic
**Disease.type field**: DiseaseType | nutritional | toxic
**DiseaseSeverity**: mild | moderate | severe | critical
**DiseaseStage**: incubating | symptomatic | recovering
**TransmissionVector alias**: airborne | waterborne | vector | contact | zoonotic | traumatic
**Disease.transmissionVector field**: TransmissionVector | nutritional | foodborne

### Special Map Archetypes (Canonical enum, 27 total)
**Simplified/common runtime archetypes**: ESTATES | GOVERNMENT | ARENA_THEATER | UNIVERSITY_MONASTERY | MARKET_EXHIBITION | OPEN_FIELD | CAMPGROUND | RESTAURANT_INN | VESSEL | PLAYER_HOME | FORTRESS_COMMANDER_CHAMBER | WORKSHOP

**Government-oriented archetypes**: TRIBAL_COUNCIL | COURT_CHAMBER | TOWN_HALL | ASSEMBLY_HALL | ADMINISTRATIVE_COMPLEX | COLONIAL_ADMINISTRATION

**Compatibility/alternate labels still routed in `specialMapGenerator`**: PALACE_COMPLEX | MARKET_BAZAAR | GOVERNMENT_FORUM | MILITARY_FORTRESS | SACRED_COMPLEX | UNIVERSITY | THEATER | ARENA | EXHIBITION

## Map Stitching System
Neighbor edge data is collected from cached adjacent maps in `hooks/useMapState.ts` (`getNeighboringEdgeData`) and passed to `proceduralGenerateMap(...)`.

Generation applies multiple continuity passes:
- Coastline/river/shoreline alignment using adjacent edge data in `generation/standardMap/standardMapGenerator.ts`
- Climate transition smoothing via `applyClimateTransitions(...)`
- Biome transition logic in `utils/climateStitchingUtils.ts`

### Active Systems Status

**Special Map Archetypes**: 27 enum values; `generation/specialMap/archetypes/` currently contains 21 top-level generator files (plus 9 cultural generator modules)
**Container System**: Players can interact with containers in special maps with theft detection
**Workshop System**: WORKSHOP archetype for craftsman buildings with culture/era-specific routing

### 4. Complete BiomeType Reference (141 total)
**All BiomeType enum values from `types/biomes/base.ts`:**

**Natural Terrain:**
- `DEEP_OCEAN`, `SHALLOW_OCEAN`, `BEACH`, `CLIFF`
- `GRASSLAND`, `FOREST`, `DENSE_FOREST`, `JUNGLE`, `SCRUB`
- `HILLS`, `MOUNTAIN`, `HIGH_PEAK`, `SNOW`
- `DESERT`, `OASIS`, `TUNDRA`, `STEPPE`, `SALT_FLATS`

**NEW Transitional Biomes (Sept 21, 2025):**
- `PRAIRIE` (yellow-tinted grassland), `SAVANNA` (with acacia trees), `TAIGA` (boreal forest)
- `ALPINE_MEADOW` (high-altitude grasslands), `BADLANDS` (eroded arid terrain)

**Water Features:**
- `RIVER`, `MAJOR_RIVER`, `RIVERBANK`, `FRESHWATER_LAKE`
- `WETLANDS`, `MANGROVE`, `ESTUARY`, `REEF`, `SHOALS_TILE`

**Volcanic/Geothermal:**
- `VOLCANIC_SOIL`, `VOLCANIC_ROCK`, `ACTIVE_LAVA`, `HOT_SPRINGS`

**Urban/Settlement:**
- `HAMLET`, `LOW_DENSITY_CITY`, `DENSE_CITY`, `CITY_CENTER`, `URBAN` (Legacy)
- `FARMLAND`, `MARKETPLACE`, `GOVERNMENT_DISTRICT`, `PALACE`, `HOLY_SITE`, `RUINS`, `RAILROAD_STATION`
- `PARK`, `PLAZA`, `ROAD`, `HARBOR_DISTRICT`, `INDUSTRIAL_DISTRICT`

**Special biomes used only for edge-case WorldWeaver contexts (not fantasy realms):**
- `AIR` (aerial/space context tiles), `UNDERSEA` (underwater context tiles)
- Example prompts: "Yuri Gagarin in space", "RAF pilot floating in Atlantic waters"

**Architectural - Walls & Doors:**
- `WALL`, `WALL_GATE`, `WALL_WINDOW`, `WALL_BACK`, `WALL_BACK_WINDOW`, `WALL_BACK_DOOR`
- `DOOR`, `DOOR_LOCKED`, `ARCHWAY`, `ENTRANCE_PORTAL`, `PATH`

**Architectural - Floors:**
- Basic: `FLOOR_STONE`, `FLOOR_WOOD`, `FLOOR_MARBLE`, `FLOOR_TILE`, `FLOOR_CARPET`
- Decorative: `FLOOR_MOSAIC`, `FLOOR_MOSAIC_CENTER`, `FLOOR_MOSAIC_BORDER`, `FLOOR_PATTERN`, `FLOOR_CHECKERED`
- Ground: `GRASS_GROUND`, `DIRT_GROUND`, `STONE_GROUND`, `FLOOR_DIRT`, `DIRT`, `DIRT_PATH`

**Furniture - Seating & Tables:**
- `TABLE`, `TABLE_LEFT`, `TABLE_CENTER`, `TABLE_RIGHT`, `CHAIR`, `BENCH`, `THRONE`, `DESK`, `PODIUM`

**Furniture - Storage & Containers:**
- `BOOKSHELF`, `CABINET`, `CHEST`, `SHELF`, `COAT_RACK`, `FILING_CABINET`, `PANTRY`, `BARREL`

**Furniture - Features & Decorative:**
- `COLUMN`, `FOUNTAIN`, `STATUE`, `PAVILION`, `ALTAR`, `STAGE`, `PLANTER`, `RUG`, `CARPET`
- `DOCUMENT_TABLE`, `SCROLL_RACK`, `SEAL_STAND`, `SHRINE`, `TREE`

**Furniture - Functional:**
- Kitchen: `KITCHEN_STOVE`, `KITCHEN_COUNTER`, `KITCHEN_SINK`
- Bathroom: `TOILET`, `BASIN`, `BATH`, `MIRROR`
- Security: `GUARD_POST`, `WEAPON_RACK`, `ARMOR_STAND`
- Utility: `WORKSHOP`, `CELL`, `TREASURY`, `STAIRS_UP`, `STAIRS_DOWN`
- Workshop Equipment: `ANVIL`, `OVEN_BRICK`, `SPINNING_WHEEL`, `LOOM`, `WORKBENCH`

**Lighting & Heating:**
- `FIRE_PIT`, `HEARTH`, `BRAZIER`, `TORCH`, `LANTERN`

**Sleeping & Misc:**
- `BED`, `PILLAR`, `WALL_LOW`

### 6. Combat Background System

The game uses a priority-based background selection system for combat scenarios with **weather**, **time of day**, **culture**, and **climate/season** variants.

#### **File Naming Convention**
All combat background files use **underscores** (not spaces). `backgroundSelectionService` checks these patterns in priority order:

**Highest Priority (most specific):**
- `biome_climate_weather_time_culture.png`
- `biome_climate_weather_culture.png`
- `biome_climate_time_culture.png`
- `biome_climate_culture.png`
- `biome_weather_time_culture.png`
- `biome_weather_culture.png`
- `biome_time_culture.png`
- `biome_culture.png`
- `biome_climate_weather_time.png`
- `biome_climate_weather.png`
- `biome_climate_time.png`
- `biome_climate.png`
- `biome_weather_time.png`
- `biome_weather.png`
- `biome_time.png`
- `biome.png` (e.g., `wetlands.png`, `dense_city.png`, `hot_springs.png`)
- Universal fallbacks: `grassland.png`, `hills.png`, `forest.png`, `desert.png`

**Climate suffix behavior (`getClimateSuffix`)**:
- `COLD` -> `snow`
- `ARID` -> `arid`
- `TROPICAL` -> `tropical`
- `MEDITERRANEAN` -> `arid` only in `SUMMER`/`FALL`
- `TEMPERATE` -> `snow` only in `WINTER`

#### **Biome Naming Convention**
The system ALWAYS checks for the exact biome name first (converted to lowercase with underscores):
- `LOW_DENSITY_CITY` → `low_density_city.png`
- `DENSE_CITY` → `dense_city.png`
- `HOT_SPRINGS` → `hot_springs.png`
- `VOLCANIC_SOIL` → `volcanic_soil.png`
- `HAMLET` → `hamlet.png`

**Urban Fallback Chain:**
- `hamlet` -> `low_density_city` -> `dense_city`
- `urban` -> `dense_city`
- `marketplace`, `plaza`, `harbor_district` -> `low_density_city` -> `dense_city`
- `government_district`, `palace`, `city_center`, `industrial_district`, `holy_site` -> `dense_city`

Every biome can have its own specific background file before falling back to alternatives.

**Cultural Fallback Chains** (related cultures check each other):
- **Asian/Eastern Sphere**: `east_asian` ↔ `south_asian` ↔ `oceania` ↔ `mena`
- **Indigenous American**: `precolumbian` ↔ `south_american`
- **Western/Colonial**: `european` ↔ `colonial`
- **African**: `african` → `mena`



### UI Components
**Modal System**: 67 `*Modal.tsx` components currently in `components/` (gameplay, NPC, terrain, combat, settings/admin, and educational flows)


### Implementation Details

#### SavedGame Data Structure:
```typescript
interface SavedGame {
  // Metadata
  id: string;
  name: string;
  timestamp: number;
  thumbnailEmoji: string;
  version: string;
  playTime: number; // minutes played
  
  // Core state
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  mapSeed: string;
  currentLocation: { x: number; y: number };
  year: number;
  month: number;
  day: number;
  timeOfDay: number;
  gameMode: string;
  zone: string;
  region: string;
  mapArea: string;
  homeAnchor?: HomeAnchor | null;
  
  // Extended state
  npcs?: NpcEntity[];
  activeQuests?: Quest[];
  completedQuests?: Quest[];
  eventHistory?: EventHistoryEntry[];
  reputation?: number;
  mapReputation?: number;
  
  // Assessment and educational data
  gameLog?: GameLogEntry[];
  playerJournal?: PlayerJournalEntry[];
  assessmentSession?: AssessmentSession | null;
  assessmentLogs?: AssessmentLogState;
  llmAnalysis?: AssessmentLLMResult | null;
  learningProgress?: any[];
  journalQuotes?: JournalQuote[];

  // Additional runtime context
  isInSpecialMap?: boolean;
  specialMapData?: any;
  weatherState?: any;
  ambianceState?: any;
}
```



### How the Procedural Item System Works

The game uses a sophisticated procedural item generation system (`itemGenerationService.ts`) that creates unique variations of base items:

1. **Base Items** (`itemDefinitions.ts`): ~1000+ predefined items with base stats
2. **Procedural Generation** (`generateProceduralItem()`):
   - **Quality Tiers**: poor → standard → good → excellent
   - **Material Variations**: Era and culture-appropriate materials
   - **Condition System**: Items age and degrade (0-100% condition)
   - **Cultural Styles**: Items get culture-specific naming (e.g., "Damascus Steel", "Tang Dynasty")
   - **Color Assignment**: Based on material type or cultural clothing palettes

3. **Era Gating**: Items available based on historical period:
   - Prehistory: Stone, bone, hide materials only
   - Antiquity: Bronze, copper, early iron
   - Medieval: Iron, steel, advanced textiles
   - Industrial: Mass production, synthetic materials
   - Modern: Plastics, composites, electronics

4. **Context-Aware Generation**:
   - NPCs get profession-appropriate items (guards → weapons, merchants → trade goods)
   - Social class affects quality (nobles get "excellent", peasants get "poor")
   - Geographic zone influences materials and styles

## Project Overview
- **Creator**: Benjamin Breen, Historian at UCSC
- **Purpose**: Educational history simulation game for both general public and history students
