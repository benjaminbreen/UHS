# Universal History Simulator - Development Notes

## Ruins Roguelike Refactor Postmortem (October 2025)
- **Why it missed the mark**: I lost sight of the core goal—an educational ruin-wandering vignette—and layered in RPG-style cards, unlock logic, and complex UI that never surfaced cleanly in game. The result felt like a half-finished tactics system instead of a focused learning loop.
- **What was delivered**: Large-scale refactors to `RoguelikeDisplayEnhanced.tsx`, a new ruins data bridge, curated supplemental datasets (scripts, artifacts, discoveries, cards), validation tooling, and a metrics pipeline. All of it remains in the repo but the intended gameplay payoff isn’t there.
- **Key lessons**: Always keep the educational north star front and center, prototype UX in the actual game before deep refactors, and validate new mechanics with real content before expanding scope.

## ✅ Light Mode Implementation
**Status**: Fully implemented and working across all components.

Light mode is toggled via the Settings panel and uses Tailwind's dark mode utilities with proper theme detection and persistence.

## Quick Reference - Essential Types

### Core Game Enums
**GameModeType (8 total)**: survival | exploration | commerce | scholarship | leadership | livelihood | diplomacy | legal

**CulturalZone (9 total)**: EUROPEAN | EAST_ASIAN | MENA | NORTH_AMERICAN_PRE_COLUMBIAN | NORTH_AMERICAN_COLONIAL | OCEANIA | SOUTH_ASIAN | SOUTH_AMERICAN | SUB_SAHARAN_AFRICAN

**HistoricalEra (7 total)**: PREHISTORY | ANTIQUITY | MEDIEVAL | RENAISSANCE_EARLY_MODERN | INDUSTRIAL_ERA | MODERN_ERA | FUTURE_ERA

### Item System Types
**ItemCategory**: Tool | Weapon | Material | Apparel | Food | Special | Document | Consumable | Vessel
**ItemQuality**: poor | standard | good | excellent
**Rarity**: Junk | Common | Uncommon | Rare | Ultra-rare | Unique
**WealthLevel**: poor | modest | comfortable | wealthy | noble

### Disease System Types
**DiseaseType**: respiratory | gastrointestinal | vector_borne | contact | parasitic | zoonotic | traumatic | nutritional | toxic
**DiseaseSeverity**: mild | moderate | severe | critical
**DiseaseStage**: incubating | symptomatic | recovering
**TransmissionVector**: airborne | waterborne | vector | contact | zoonotic | traumatic | nutritional | foodborne

### Special Map Archetypes (Current System)
**Primary Archetypes**: ESTATES | GOVERNMENT | ARENA_THEATER | UNIVERSITY_MONASTERY | MARKET_EXHIBITION | OPEN_FIELD | CAMPGROUND | RESTAURANT_INN | VESSEL | PLAYER_HOME | FORTRESS_COMMANDER_CHAMBER | **WORKSHOP** ⭐

**Government Subtypes**: TRIBAL_COUNCIL | COURT_CHAMBER | TOWN_HALL | ASSEMBLY_HALL | ADMINISTRATIVE_COMPLEX

**Legacy Archetypes**: PALACE_COMPLEX | MARKET_BAZAAR | GOVERNMENT_FORUM | MILITARY_FORTRESS | SACRED_COMPLEX | UNIVERSITY | THEATER | ARENA | EXHIBITION

## Map Stitching System - WORKING ✅
Comprehensive multi-layered system ensuring seamless transitions between adjacent maps through edge data collection, land/water stitching, altitude continuity, and climate-aware biome transitions. Fixed Sept 21, 2024.

### Active Systems Status

**Special Map Archetypes**: 17 archetype generators + 9 cultural variant generators
**Container System**: Players can interact with containers in special maps with theft detection
**Workshop System**: WORKSHOP archetype for craftsman buildings with culture/era-specific routing

### 4. Complete BiomeType Reference (110 total)
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
- `FARMLAND`, `MARKETPLACE`, `GOVERNMENT_DISTRICT`, `PALACE`, `HOLY_SITE`, `RUINS`
- `PARK`, `PLAZA`, `ROAD`, `HARBOR_DISTRICT`, `INDUSTRIAL_DISTRICT`

**Ethereal Realm (Special zones only):**
- `AIR` (clouds/darkness/storms), `UNDERSEA` (glowing underwater realm)

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

### 6. Combat Background System (September 2025)

The game uses a sophisticated priority-based background selection system for combat scenarios that supports **weather**, **time of day**, and **cultural zone** customization.

#### **File Naming Convention**
All combat background files use **underscores** (not spaces) and follow this priority pattern:

**Highest Priority (most specific):**
- `biome_weather_time_culture.png` (e.g., `dense_city_rain_night_mena.png`)
- `biome_weather_culture.png` (e.g., `dense_city_rain_mena.png`)
- `biome_time_culture.png` (e.g., `low_density_city_crepuscular_east_asian.png`)
- `biome_culture.png` (e.g., `dense_city_mena.png`)
- `biome_weather_time.png` (e.g., `wetlands_rain_crepuscular.png`)
- `biome_weather.png` (e.g., `wetlands_rain.png`)
- `biome_time.png` (e.g., `wetlands_crepuscular.png`)

**Base & Fallbacks (lowest priority):**
- `biome.png` (e.g., `wetlands.png`, `dense_city.png`, `hot_springs.png`)
- Fallback mappings (if specific biome file doesn't exist)
- Universal fallbacks: `grassland.png`, `hills.png`, `forest.png`, `desert.png`

#### **Biome Naming Convention**
The system ALWAYS checks for the exact biome name first (converted to lowercase with underscores):
- `LOW_DENSITY_CITY` → `low_density_city.png`
- `DENSE_CITY` → `dense_city.png`
- `HOT_SPRINGS` → `hot_springs.png`
- `VOLCANIC_SOIL` → `volcanic_soil.png`
- `HAMLET` → `hamlet.png`

**Urban Fallback Chain:**
- `hamlet` → `low_density_city` → `dense_city`
- `marketplace`, `plaza`, `harbor_district` → `low_density_city` → `dense_city`
- `government_district`, `palace`, `industrial_district` → `dense_city`

Every biome can have its own specific background file before falling back to alternatives.

**Cultural Fallback Chains** (related cultures check each other):
- **Asian/Eastern Sphere**: `east_asian` ↔ `south_asian` ↔ `oceania` ↔ `mena`
- **Indigenous American**: `precolumbian` ↔ `south_american`
- **Western/Colonial**: `european` ↔ `colonial`
- **African**: `african` → `mena`



### UI Components
**Modal System**: 47 modal components covering game, NPC, terrain, combat, and administrative interfaces


## Project Overview
- **Creator**: Benjamin Breen, Historian at UCSC
- **Purpose**: Educational history simulation game for both general public and history students

## Audio System Best Practices (September 2025)

### **Procedural Audio Design Philosophy**
The game uses 100% procedural Web Audio API generation - no external audio files. This approach provides:
- **Zero loading times** - sounds generate instantly
- **Infinite variety** - subtle randomization prevents repetition
- **Cultural authenticity** - sounds can be algorithmically adapted to historical contexts
- **Bandwidth efficiency** - no large audio assets to download

### **Context-Aware Audio Integration**
**Key Principle**: Audio should respond to specific game states, not just play globally.

**Implementation Pattern**:
1. **State-Driven Triggers**: Use React `useEffect` hooks to monitor specific state changes (e.g., `isGameActive`, modal opens/closes)
2. **Automatic Cleanup**: Always provide cleanup functions to stop audio when contexts change
3. **Volume Stratification**: Different audio types use different base volumes (UI clicks: 3%, ambient music: 10%, victory fanfares: 15%)
4. **Respectful Integration**: Audio respects existing mute/volume systems and doesn't interfere with other sounds

#### How Seed/URL sharing Works 

1. **Sharing a Game**:
   - Player clicks "Share" in Initial Scenario Modal
   - System encodes full game state to base64
   - Generates URL like: `/1473/north-china-plain/survival?state=eyJ2IjoxLCJ5IjoxNDczLC...`
   - URL contains all data needed to reproduce the exact scenario

2. **Loading from URL**:
   - App.tsx detects state parameter
   - Decodes full game state
   - Sets map seed, date, location
   - Stores character data
   - Character generator uses stored data to recreate exact character

#### Technical Details

**Encoded State Structure**:
```typescript
{
  v: 1,              // version
  y: 1473,           // year
  m: 11,             // month
  d: 29,             // day
  ma: "NCP",         // map area (abbreviated)
  gm: "surv",        // game mode (abbreviated)
  cn: "Min Li",      // character name
  cp: "Tea Picker",  // character profession
  cg: "f",           // character gender
  ca: 35,            // character age
  ms: "DV032DBK",    // map seed
  st: "p"            // scenario type
}
```

## Physical Feat System ✅
Narration panel detects climbing/fording/jumping actions, evaluates with AI or formulas, applies effects. Success rates: 80-95% for climbing, 85% for fording.

## Save/Load System Implementation (December 2024 - ACTUALLY IMPLEMENTED)

### Overview
Implement a localStorage-based save/load system that preserves the fresh-start-on-reload behavior while allowing intentional saves through a dedicated UI.

### Phase 1: Basic Save/Load (Core State)
- **SaveGameService**: Service to manage save/load operations
- **SavedGame Interface**: Character, map, location, date, game mode
- **SavedGamesModal**: UI for managing saved games
- **Integration**: Settings panel trigger, App.tsx restoration

### Phase 2: Complete State (NPCs, Quests, Inventory)
- Add NPCs positions and states
- Save active quests and progress
- Preserve full inventory and equipment
- Event history and reputation?

### Implementation Details

#### SavedGame Data Structure:
```typescript
interface SavedGame {
  id: string;
  name: string;
  timestamp: number;
  thumbnailEmoji: string;
  
  // Core state (Phase 1)
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  mapSeed: string;
  currentLocation: { x: number; y: number };
  year: number;
  month: number;
  day: number;
  timeOfDay: number;
  gameMode: string;
  
  // Extended state (Phase 2)
  npcs?: NpcEntity[];
  activeQuests?: Quest[];
  eventHistory?: EventHistoryEntry[];
  reputation?: number;
  
  // Metadata
  playTime: number;
  version: string;
}
```

## ✅ Workshop System - FULLY IMPLEMENTED (December 2024)

### **Overview:**
Complete workshop system for craftsman buildings (smithies, pottery shops, bakeries, weaving shops, carpentry workshops) with culture/era-specific variations.

### **Key Components:**
1. **✅ Routing (CityModal.tsx)**: Business types correctly route to WORKSHOP archetype
2. **✅ Generation (workshopGenerator.ts)**: Creates workshop layouts with appropriate equipment
3. **✅ Equipment BiomeTypes**: ANVIL, OVEN_BRICK, SPINNING_WHEEL, LOOM, WORKBENCH
4. **✅ Visual Rendering**: Detailed SVG symbols with cultural/era variations
5. **✅ NPC Generation**: Appropriate craftsmen spawn based on business type

### **Supported Workshop Types:**
- **Smithy**: Anvil, forge, metal storage → Blacksmith NPCs
- **Pottery**: Kiln, pottery wheel, clay storage → Potter NPCs
- **Weaving**: Loom, spinning wheel, thread storage → Weaver NPCs
- **Bakery**: Brick oven, work tables, flour storage → Baker NPCs
- **Carpentry**: Workbench, tool storage, lumber → Carpenter NPCs

### **Features:**
- Population-based scaling (larger settlements get more equipment)
- Era-appropriate technology (Industrial Era gets steam-powered equipment)
- Cultural material variations (Japanese vs European vs MENA styles)
- Wealth-based NPC counts (wealthy shops have apprentices/assistants)

## Disease Progression System Enhancement (September 20, 2025)

note: we need to implement a "fast forward" system to test things like this:

#### **Progression Stages & Effects**
1. **Early Stage** (0-30% severity): Minimal symptoms, no gameplay impact
2. **Moderate Stage** (30-50% severity): Visible symptoms, mild social avoidance
3. **Severe Stage** (50-70% severity): Obvious illness, weak voice, social concern
4. **Critical Stage** (70-85% severity): Severe symptoms, whispers only, active avoidance
5. **Terminal Stage** (85%+ severity): Movement severely limited (60x slower), no speech, death approaching

#### **Disease Progression Timing**
- **Updates Once Per Game Day**: Disease progression occurs when game clock reaches midnight (newHours === 0)
- **Location**: `useCoreLoops.ts` lines 305-358
- Stage changes trigger immediate notification modals to inform players

## Inventory & Item Generation System (September 2025)

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

### Roguelike System (September 2025)

### Overview
The mining system is a tile-based roguelike minigame where players explore mine shafts, dig through walls, expose ore deposits, and collect minerals. It features procedural generation, cultural theming, and immersive audio-visual effects.

### Core Components

#### Main Files:
- **`MiningRoguelikeDisplay.tsx`** - Main component with game loop, rendering, player movement, and ore collection
- **`services/gameSoundsService.ts`** - Audio system with crystal music, ore exposure sounds, and magical pickup effects

#### Key Features:

**1. Procedural Mine Generation**
- Dynamic cave systems with walls, floors, and pre-placed ore deposits
- Cultural zone theming (materials, visual styles)
- Configurable mine depth and ore types based on historical era

**2. Player Movement & Interaction**
- Arrow key navigation through mine tiles
- Digging mechanics to expose hidden ore deposits
- Space bar collection of exposed minerals

**3. Ore System**
- Hidden ore deposits become visible when adjacent walls are dug
- Glowing sparkle effects when ore is exposed (`playOreExposedSound`, `playGemExposedSound`)
- Beautiful floating notifications show collected items with quantities
- Proper inventory integration via `onInventoryAdd` callback

**4. Audio Design**
- **Crystal Music**: Catchy, rhythmic background music that fades in after 8 seconds, loops for 25 seconds, then fades out after 1-2 minutes
- **Sound Effects**: Ore exposure sounds, magical pickup sounds, ambient cave atmosphere
- **Procedural Generation**: 100% Web Audio API with no external files

**5. Visual Effects**
- Intense glowing animations on exposed ore deposits
- Floating pickup notifications with smooth CSS transitions
- Cultural theming for mine materials and colors

### Integration Points
- **Settings Panel**: Test mode accessible via dev panel with visual inventory display
- **Game State**: Integrates with player character stats (health, fatigue changes)
- **Cultural System**: Mine appearance adapts to cultural zone and historical era
- **Inventory System**: Items flow into main game inventory via callback system

### Technical Architecture
- React hooks (`useState`, `useEffect`, `useCallback`) for state management
- Tile-based coordinate system for movement and interaction
- Dynamic ore deposit creation with proper pickup item structure
- Cleanup systems for audio and visual effects on component unmount


## Maps System Clarification - IMPORTANT

### Interior Maps vs Special Maps
**Interior Maps**: Small maps (often 8x8) accessed via POI modals (POIToastModal, POIInteractionModal). Used for fortress commander chambers, small buildings, etc. Generated and handled separately from special maps.

**Special Maps**: Larger interior areas accessed via tile interactions (government districts, palaces, marketplaces, holy sites). Use the specialMapGenerator system and have their own archetype generators.

These are DIFFERENT SYSTEMS - don't confuse them when making fixes!

## Special Maps System - December 2024

### Current State of Special Maps

Special maps are interior/special area maps that players enter from the main world map. When a player enters certain structures (government districts, palaces, marketplaces, holy sites), they transition to a detailed interior map with NPCs, furniture, and cultural theming.

### ✅ Container System (August 2025)

Players can interact with containers (chests, barrels, crates, cabinets, etc.) in special maps:

**Core Components:**
- **`specialMapContainerService.ts`** - Generates culturally appropriate container contents with theft detection
- **`containerCacheService.ts`** - Caches container contents to prevent regeneration
- **`ContainerModal.tsx`** - Modern UI for container interaction with theft warnings
- **`useSpecialMapItemCollection.ts`** - Handles container detection and "Press E" toast notifications

**Player Interaction:**
- Walk onto container tile → "Press E or click to open container" toast appears
- Press E key or click container → ContainerModal opens with items
- Take items → NPCs within line-of-sight may confront player for theft
- Container contents persist via caching system

**Theft System:**
- NPCs detect item theft based on line-of-sight and item ownership
- Valuable/owned items trigger NPC confrontations
- `npcAwarenessService.ts` handles theft detection and NPC reactions

### Core Files

#### Generation Pipeline
1. **`specialMapGenerator.ts`** - Main entry point, routes to archetype generators
2. **`specialMapNpcGenerator.ts`** - Generates culturally appropriate NPCs for rooms
3. **Archetype Generators** (in `/archetypes/`):
   - `governmentGenerator.ts` - Government forums (162 uses)
   - `palaceVariantGenerator.ts` - Palace complexes (73 uses)
   - `sacredGenerator.ts` - Religious buildings (33 uses)
   - `estatesGeneratorFixed.ts` - Noble estates
   - `marketGenerator.ts` - Markets and bazaars
   - Plus 10+ other specialized generators

#### Data & Configuration
1. **`governmentDistricts.ts`** - 339 government building definitions
2. **`specialMapAugmentation.ts`** - Material systems (CULTURE_MATERIALS)
3. **`specialMapTypes.ts`** - Type definitions and enums

#### Utility Systems (Active)
- **`mapLayoutUtils.ts`** - Wall/floor placement with cultural materials
- **`culturalFlooringService.ts`** - Pattern-based flooring (Islamic geometric, etc.)
- **`advancedLightingSystem.ts`** - Torch/brazier placement
- **`directionalFurniturePlacement.ts`** - Furniture orientation
- **`storageUtilitySystem.ts`** - Chest/barrel placement
- **`culturalFurnitureSystem.ts`** - Era-appropriate furniture sets

