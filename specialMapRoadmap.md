# Special Map System Roadmap v3.0 - Simplified Architecture

*Last Updated: December 2024*

## Executive Summary

Complete architectural redesign focusing on **modular, parameter-driven generation** rather than culture-specific logic. Special maps are now smaller (4x8 to 25x25), faster, and use a universal material system for cultural variation. The system creates a three-layer hierarchy: Standard Map → Special Map → Interior Map, with elite access restrictions reinforcing social dynamics.

## Core Design Principles

### 1. Era Drives Complexity, Culture Drives Materials
- **Procedural generation** is era-based (prehistoric = simple, modern = complex)
- **Cultural variation** comes from 6 universal materials applied to standard objects
- **No more culture-specific generation functions** - one generator per archetype

### 2. Dramatically Smaller Maps
- Previous: 40x30 to 60x60 tiles (laggy, complex)
- **New: 4x8 to 25x25 tiles** (fast, focused, intimate)
- Performance target: <100ms generation, 60fps rendering

### 3. Multi-Tile Architectural Objects
- **Pillars**: 2-4 tiles tall (base + middle(s) + top)
- **Tables**: 3+ tiles wide (left + middle(s) + right)
- **Light sources**: 2 tiles (fixture + glow above)
- Creates convincing architecture vs single-tile "stickers"

## 1. Map Size Tiers

| Size | Dimensions | Primary Use | Examples |
|------|------------|-------------|----------|
| **XS** | 8×8 | Small buildings, vessels, prehistoric | Chief's hut, canoe, painted cave |
| **Small** | 10×10 | Temporary spaces | Campsite, inn, small temple |
| **Medium** | 16×16 | Standard buildings | Medieval castle, market |
| **Large** | 20×20 | Major complexes | Palace, university |
| **XL** | 25×25 | Massive sites | Versailles, Forbidden City |

### Era-Based Sizing
```typescript
const ERA_SIZE_RULES = {
  prehistoric: { default: 'xs', max: 'small' },
  antiquity: { default: 'small', max: 'large' },
  medieval: { default: 'medium', max: 'large' },
  earlyModern: { default: 'large', max: 'xl' },
  industrial: { default: 'large', max: 'xl' },
  modern: { default: 'large', max: 'xl' }
}
```

## 2. Simplified Archetype System (10 Total)

### Final Archetype List

| # | Archetype | Description | Size Range | Interior Access |
|---|-----------|-------------|------------|-----------------|
| 1 | **Estates** | Royal or religious leader residences | XS→XL | Throne room (private) |
| 2 | **Government Complex** | Bureaucratic centers | L→XL | Council chamber (restricted) |
| 3 | **Arena/Theater** | Entertainment venues | S→L | Backstage (restricted) |
| 4 | **University/Monastery** | Learning centers | S→L | Archives (restricted) |
| 5 | **Exhibition/Fair/Market** | Commerce & display | S→XL | Guild hall (members only) |
| 6 | **Open Field** | Flexible outdoor space, could be anything from battleground to holy grove to polo field | XS→XL | Cave/shrine (varies) |
| 7 | **Campground** 🆕 | Temporary settlements | XS→M | Tent interior (private) |
| 8 | **Restaurant/Inn** 🆕 | Hospitality venues | S→M | Private room (paid) |
| 9 | **Vessel** 🆕 | Ships & vehicles | XS→M | Captain's quarters (restricted) |
| 10 | **Player Home** 🆕 | Personal residence | XS→L | Bedroom (private) |

*Note: Palaces (the stadnardmap symbol) and holy sites remain as direct interior maps on standard map*

### Archetype Parameters
```typescript
interface ArchetypeConfig {
  // Core
  archetype: ArchetypeType;
  size: 'xs' | 'small' | 'medium' | 'large' | 'xl';
  era: EraType;
  cultureZone: CultureZone;
  
  // Layout modifiers
  isCircular?: boolean;        // For round structures (applies to all sizes)
  isRectangular?: boolean;     // For vessels and other constrained spaces
  hasLandscape?: boolean;       // Climate-appropriate border (always available)
  landscapeClimate?: 'arid' | 'temperate' | 'cold' | 'semitropical' | 'tropical' | 'ocean';
  density?: 'sparse' | 'normal' | 'dense';
  
  // Materials (overrides culture default)
  floorMaterial?: MaterialType;
  wallMaterial?: MaterialType;
  furnitureMaterial?: MaterialType;
  
  // Interior portal
  innerMapType?: 'throne_room' | 'council_chamber' | 'captain_quarters' | 'bedroom' | 'cave' | 'vault';
  innerMapName?: string;        // Custom name like "Westminster Hall"
  isPrivate?: boolean;          // Requires elite status
}
```

## 3. Universal Material System

### Six Base Materials (Cover All Cultures/Eras)

| Material | Visual Style | Cultural Associations | Era Range |
|----------|--------------|----------------------|-----------|
| **White Marble** | Grey veins, bright, polished | Mediterranean, Classical, Neoclassical | Antiquity→Modern |
| **Grey Stone** | Rough texture, fortress-like | Northern Europe, Castles, Brutalism | All eras |
| **Red Lacquer** | Glossy, rich, ornate | East Asia, Imperial China/Japan | Medieval→Modern |
| **Sandstone** | Tan-red, weathered, warm | MENA, Africa, Southwestern Americas | All eras |
| **Wood** | Brown grain, natural | Universal vernacular, common buildings | All eras |
| **Steel** | Grey metallic, industrial | Modern global, military, tech | Industrial→Modern |

### Culture-to-Material Mapping
```typescript
const CULTURE_MATERIALS = {
  EUROPEAN: {
    prehistoric: 'wood',
    antiquity: 'white_marble',
    medieval: 'grey_stone',
    earlyModern: 'white_marble',
    modern: 'steel'
  },
  EAST_ASIAN: {
    prehistoric: 'wood',
    antiquity: 'wood',
    medieval: 'red_lacquer',
    earlyModern: 'red_lacquer',
    modern: 'steel'
  },
  MENA: {
    prehistoric: 'sandstone',
    antiquity: 'sandstone',
    medieval: 'sandstone',
    earlyModern: 'white_marble',
    modern: 'steel'
  },
  AFRICAN: {
    prehistoric: 'wood',
    antiquity: 'sandstone',
    medieval: 'sandstone',
    earlyModern: 'sandstone',
    modern: 'steel'
  },
  AMERICAS: {
    prehistoric: 'wood',
    antiquity: 'sandstone',
    medieval: 'wood',
    earlyModern: 'wood',
    modern: 'steel'
  },
  OCEANIA: {
    prehistoric: 'wood',
    antiquity: 'wood',
    medieval: 'wood',
    earlyModern: 'wood',
    modern: 'steel'
  }
}
```

## 4. Multi-Tile Object System

### Object Scaling Rules

#### Pillars (Vertical)
```typescript
interface Pillar {
  tiles: TileStack;  // Always vertical stack
  material: MaterialType;
  height: number;    // Era-dependent
}

const PILLAR_HEIGHTS = {
  prehistoric: 2,   // base + top only
  medieval: 3,      // base + middle + top
  modern: 4         // base + 2 middles + top
}
```

#### Tables/Furniture (Horizontal)
```typescript
interface HorizontalFurniture {
  tiles: TileRow;    // Always horizontal row
  material: MaterialType;
  width: number;     // Map-size dependent
}

const TABLE_WIDTHS = {
  xs: 3,        // left + right (no middle)
  small: 3,     // left + middle + right
  medium: 5,    // left + 3 middles + right
  large: 7      // left + 5 middles + right
}
```

#### Light Sources (Paired)
```typescript
interface LightSource {
  fixture: TileType;    // Bottom tile (torch holder, lamp post)
  light: TileType;      // Top tile (flame, glow)
  era: EraType;
}

const LIGHT_EVOLUTION = {
  prehistoric: { fixture: 'stick', light: 'ember' },
  antiquity: { fixture: 'bronze_stand', light: 'oil_flame' },
  medieval: { fixture: 'iron_sconce', light: 'torch_flame' },
  earlyModern: { fixture: 'brass_lamp', light: 'gas_flame' },
  industrial: { fixture: 'ornate_post', light: 'gas_bright' },
  modern: { fixture: 'steel_fixture', light: 'electric_bulb' }
}
```

### Multi-Tile Benefits
- **Visual Weight**: Objects feel substantial, not flat
- **Era Progression**: Height/width naturally scales with time period
- **Material Consistency**: One material swap changes entire object
- **Performance**: Can batch-render connected tiles

## 5. Landscape System

### Climate-Based Landscapes
When `hasLandscape: true`, border tiles are filled with climate-appropriate terrain:

| Climate | Landscape Tiles | Visual Style |
|---------|----------------|--------------|
| **Arid** | Sand, rocks, cacti | Desert surroundings |
| **Temperate** | Grass, trees, flowers | Green gardens/fields |
| **Cold** | Snow, ice, bare trees | Winter landscape |
| **Semitropical** | Lush grass, palms | Humid greenery |
| **Tropical** | Dense vegetation, vines | Jungle surroundings |
| **Ocean** | Water tiles | Ship in water |

### Landscape Border Sizing
```typescript
const LANDSCAPE_BORDER_ROWS = {
  xs: 1,      // 8x8 → 6x6 usable (or 4x4 for circular)
  small: 2,   // 10x10 → 6x6 usable
  medium: 3,  // 16x16 → 10x10 usable
  large: 4,   // 20x20 → 12x12 usable
  xl: 5       // 25x25 → 15x15 usable
}
```

### Vessel Special Case
Vessels with `isRectangular: true` and `hasLandscape: true` (ocean climate):
- XS (8x8) with ocean border → 2x4 walkable deck space
- Small (10x10) with ocean border → 4x6 walkable space
- This creates realistic ship proportions

## 6. Nested Map Hierarchy

### Three-Layer Structure
```
STANDARD MAP (World)
    ↓ Click government district / city center / special location
SPECIAL MAP (Building Complex) 
    ↓ Click portal (if eligible)
INTERIOR MAP (Inner Sanctum)
```

### Access Control System

#### Public Access (Anyone)
- Special map main areas
- Market stalls, theater seats, university courtyards
- Vessel decks, campground common areas

#### Restricted Access (Conditional)
- **Class-based**: Noble/clergy only areas
- **Reputation-based**: High standing required
- **Payment-based**: Inn private rooms
- **Quest-based**: Unlocked through gameplay

#### Elite Spawn System
```typescript
const SPECIAL_SPAWNS = {
  royalFamily: {
    chance: 0.01,  // 1 in 100
    spawn: 'government_complex',
    banner: 'Royal Crest',
    startPrivilege: 8
  },
  ruler: {
    chance: 0.001, // 1 in 1000
    spawn: 'throne_room_interior',
    banner: 'Crown',
    startPrivilege: 10
  },
  religiousLeader: {
    chance: 0.002, // 1 in 500
    spawn: 'temple_sanctum_interior',
    banner: 'Holy Symbol',
    startPrivilege: 9
  }
}
```

## 6. Procedural Generation Flow

### Generation Pipeline
```typescript
function generateSpecialMap(config: ArchetypeConfig): SpecialMapData {
  // 1. Determine layout from archetype + era
  const layout = getArchetypeLayout(config.archetype, config.era);
  
  // 2. Scale to requested size
  const scaled = scaleLayout(layout, config.size);
  
  // 3. Apply materials from culture
  const materials = getMaterials(config.cultureZone, config.era);
  
  // 4. Generate multi-tile objects
  const objects = generateObjects(scaled, materials, config.era);
  
  // 5. Place interior portals
  const portals = placePortals(config.innerMapType, config.isPrivate);
  
  // 6. Spawn appropriate NPCs
  const npcs = spawnNPCs(config.archetype, config.era, config.cultureZone);
  
  return { tiles, objects, portals, npcs };
}
```

### Archetype-Specific Rules

#### Palace
- Always has central throne room
- Pillars line main hall
- Size dramatically scales with era (XS tent → XL palace)
- Interior portal to throne room (elite only)

#### Government Complex
- Multiple buildings if XL
- Offices arranged around courtyard
- Council chamber as interior map
- Bureaucrat NPCs based on era

#### Vessel
- Sprite changes with era (canoe → galleon → submarine)
- Hold size scales (XS → Small)
- Captain's quarters as interior
- Easter egg: submarine sprite for spaceships

#### Campground
- Central fire + surrounding tents
- Biome-appropriate surroundings
- Pack up / linger mechanics
- Items spawn that aren't visible on standard map

## 7. Special Features

### 7.1 Player Home System
```typescript
interface PlayerHome {
  // Standard map marker
  mapTile: 'home_marker';
  
  // Special map (house layout)
  specialMap: {
    size: 'small' | 'medium' | 'large';  // Based on wealth
    rooms: Room[];                        // Kitchen, workshop, etc.
    customizable: true;                   // Player can rearrange
  };
  
  // Interior map (bedroom)
  interiorMap: {
    bed: RestPoint;
    storage: Inventory;
    desk: JournalAccess;
    atmosphere: 'cozy' | 'grand';
  };
}
```

### 7.2 Vessel Evolution System
```typescript
const VESSEL_PROGRESSION = {
  prehistoric: { sprite: 'raft', size: 'xs', hold: null },
  antiquity: { sprite: 'galley', size: 'small', hold: 'xs' },
  medieval: { sprite: 'cog', size: 'small', hold: 'xs' },
  earlyModern: { sprite: 'galleon', size: 'medium', hold: 'small' },
  industrial: { sprite: 'steamship', size: 'large', hold: 'medium' },
  modern: {
    default: { sprite: 'cargo_ship', size: 'large', hold: 'large' },
    military: { sprite: 'submarine', size: 'medium', hold: 'small' },
    space: { sprite: 'submarine', size: 'small', hold: 'xs' }  // Easter egg
  }
}
```

### 7.3 Authentic Language Gradient
```typescript
interface LanguageGradient {
  homeMap: 1.0,        // 100% comprehensible
  distance1: 0.9,      // 90% English, 10% authentic
  distance2: 0.8,      // 80% English, 20% authentic
  // ... continues
  distance10: 0.0      // 0% English, 100% authentic
}

function applyLanguageGradient(text: string, distance: number): string {
  const comprehension = Math.max(0, 1 - (distance * 0.1));
  const words = text.split(' ');
  
  return words.map(word => {
    if (Math.random() < comprehension) {
      return word;  // Keep English
    } else {
      return `[${translateWord(word)}]`;  // Show authentic in brackets
    }
  }).join(' ');
}
```

### 7.4 World Weaver Integration

World Weaver can now use universal fallback archetypes:

```typescript
const UNIVERSAL_FALLBACKS = {
  'submarine captain': { 
    archetype: 'vessel', 
    size: 'xs', 
    material: 'steel',
    innerMap: 'captain_quarters' 
  },
  'medieval inn': { 
    archetype: 'restaurant', 
    size: 'small', 
    material: 'wood',
    innerMap: 'private_room' 
  },
  'roman senate': { 
    archetype: 'government', 
    size: 'large', 
    material: 'white_marble',
    innerMap: 'council_chamber' 
  },
  // Fallback for any unmatched scenario
  'default': { 
    archetype: 'open_field', 
    size: 'medium', 
    material: 'culturally_appropriate'
  }
}
```

## 8. Implementation Phases

### Phase 1: Core Refactor (Week 1)
- [ ] Rework the current 10 archetype generators, merging some into unified variants, adding new ones
- [ ] Implement size scaling (XS through XL)
- [ ] Create material constants and mappings
- [ ] Remove all culture-specific generation logic
- [ ] Test with Palace archetype as proof of concept

### Phase 2: Multi-Tile System (Week 1-2)
- [ ] Build MultiTileObject class
- [ ] Implement pillar system (2-4 tiles based on era)
- [ ] Implement table system (3+ tiles based on size)
- [ ] Implement light pairing (fixture + glow)
- [ ] Material swapping system
- [ ] Test with Government Complex archetype

### Phase 3: New Archetypes (Week 2)
- [ ] Implement Campground (with biome integration)
- [ ] Implement Restaurant/Inn (with payment system)
- [ ] Implement Vessel (with era-based sprites)
- [ ] Implement Player Home (with customization)
- [ ] Remove redundant Military/Holy archetypes

### Phase 4: Interior Integration (Week 2-3)
- [ ] Portal placement system in special maps
- [ ] Access restriction logic (class/reputation/payment)
- [ ] Elite spawn system (1/100 royal, 1/1000 ruler)
- [ ] Transition animations between layers

### Phase 5: Polish & Testing (Week 3)
- [ ] Performance profiling (target: <100ms generation)
- [ ] Material texture refinement
- [ ] NPC behavior in smaller spaces
- [ ] World Weaver universal fallbacks
- [ ] Language gradient system

## 9. Technical Specifications

### Data Structure
```typescript
interface SpecialMapData {
  tiles: Tile[][];              // Much smaller arrays (4x8 to 25x25)
  size: { width: number, height: number };
  archetype: ArchetypeType;
  
  multiTileObjects: {
    pillars: Pillar[];
    furniture: HorizontalFurniture[];
    lights: LightSource[];
  };
  
  portals: {
    position: Point;
    targetType: InteriorMapType;
    accessLevel: 'public' | 'restricted' | 'private';
    customName?: string;
  }[];
  
  npcs: SpecialMapNPC[];
  
  metadata: {
    era: EraType;
    culture: CultureZone;
    materials: MaterialSet;
    generatedAt: number;
  };
}
```

### Performance Requirements
- Generation time: <100ms
- Render time: 60fps with 25x25 map
- Memory: <10MB per special map
- NPC limit: 10 per map
- Multi-tile batching required

### File Organization
```
generation/specialMap/
├── specialMapGenerator.ts       # Main generator
├── archetypeLayouts.ts         # Layout templates
├── materialSystem.ts           # Material mappings
├── multiTileGenerator.ts       # Multi-tile objects
├── portalPlacer.ts            # Interior portals
└── archetypes/                 # One file per archetype
    ├── palace.ts
    ├── government.ts
    ├── arena.ts
    ├── university.ts
    ├── market.ts
    ├── openField.ts
    ├── campground.ts
    ├── restaurant.ts
    ├── vessel.ts
    └── playerHome.ts

constants/specialMaps/
├── materials.ts                # 6 material definitions
├── layouts.ts                  # Era-based layouts
├── multiTileTemplates.ts       # Object definitions
└── cultureMappings.ts          # Culture to material

components/symbols/specialMap/
├── materials/                  # Material textures
│   ├── marble.tsx
│   ├── stone.tsx
│   ├── lacquer.tsx
│   ├── sandstone.tsx
│   ├── wood.tsx
│   └── steel.tsx
└── multiTile/                  # Multi-tile components
    ├── Pillar.tsx
    ├── Table.tsx
    ├── LightSource.tsx
    └── Portal.tsx
```

## 10. Example Configurations

### Prehistoric Chief's Hut
```typescript
{
  archetype: 'estates',
  size: 'xs',                    // 8x8 tiles
  era: 'prehistoric',
  cultureZone: 'OCEANIA',
  isCircular: true,              // Round hut
  hasLandscape: true,            // Desert surroundings
  landscapeClimate: 'arid',      // Australian outback
  floorMaterial: 'earth',        // Dirt floor
  wallMaterial: 'wood',          // Wooden posts
  furnitureMaterial: 'wood',
  innerMapType: null,            // No separate interior
  customName: "Elder's Dwelling"
}
```

### Industrial Era Parliament
```typescript
{
  archetype: 'government',
  size: 'xl',                    // 25x25 tiles
  era: 'industrial',
  cultureZone: 'EUROPEAN',
  floorMaterial: 'white_marble',
  wallMaterial: 'grey_stone',
  hasLandscape: false,           // Urban setting
  innerMapType: 'council_chamber',
  innerMapName: 'Westminster Hall',
  isPrivate: true
}
```

### Viking Longship
```typescript
{
  archetype: 'vessel',
  size: 'xs',                    // 8x8 tiles
  era: 'medieval',
  cultureZone: 'EUROPEAN',
  isRectangular: true,           // Ship shape
  hasLandscape: true,            // Ocean surroundings
  landscapeClimate: 'ocean',     // Water border
  floorMaterial: 'wood',         // Deck planks
  wallMaterial: 'wood',          // Hull
  furnitureMaterial: 'wood',
  innerMapType: null,            // No captain's quarters
  customName: "Longship"
  // Results in 2x4 walkable deck with ocean tiles around
}
```

### Player Starting Home
```typescript
{
  archetype: 'playerHome',
  size: 'small',                 // 10x10 tiles
  era: 'medieval',
  cultureZone: 'EUROPEAN',
  floorMaterial: 'wood',
  wallMaterial: 'grey_stone',
  customizable: true,
  innerMapType: 'bedroom',
  isPrivate: true               // Player only
}
```

## Success Metrics

### Performance
- [ ] All special maps generate in <100ms
- [ ] 60fps maintained on 25x25 maps
- [ ] Memory usage <10MB per map
- [ ] Smooth transitions between map layers

### Content
- [ ] 10 archetypes fully functional
- [ ] 6 materials cover all cultures
- [ ] Multi-tile objects working
- [ ] Interior portals functional
- [ ] Elite spawn system active

### Quality
- [ ] Visually coherent across cultures
- [ ] Era progression feels natural
- [ ] Social hierarchy reinforced
- [ ] World Weaver integration smooth
- [ ] Player feedback positive

## Design Philosophy

1. **Simplicity Over Specificity**: One palace generator with parameters beats 20 culture-specific generators
2. **Performance First**: Smaller maps are better - intimate and fast
3. **Materials Tell Stories**: Six materials can represent infinite variations
4. **Vertical Reinforces Hierarchy**: Multi-tile height = importance
5. **Nested Depth**: Three layers (world → building → room) creates journey
6. **Universal Fallbacks**: Any scenario can map to 10 archetypes

---

*This roadmap represents a fundamental simplification that will make the special map system more maintainable, performant, and extensible while actually increasing variety through parameterization.*
