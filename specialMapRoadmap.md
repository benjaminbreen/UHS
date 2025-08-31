# Special Map System Roadmap v4.0 - Major Progress Edition

*Last Updated: August 31, 2025*

## ✅ MAJOR ACHIEVEMENTS - Current Session (August 31, 2025)

### COMPLETED Phase 1: Cleanup & Organization
1. **Deleted ALL duplicate generator files** ✅
   - Removed: estatesGenerator.ts, governmentForum2D.ts, palaceGeneratorEnhanced.ts, etc.
   - Cleaned up imports in specialMapGenerator.ts
   - No more duplicate/unused files

### COMPLETED Phase 2: Multi-Tile Pillar System 
2. **Fully Implemented Multi-Tile Objects** ✅
   - Created `MultiTilePillar.tsx` component with full material rendering
   - Created `PillarBase.tsx` for base tile rendering
   - Built `multiTileObjectService.ts` with placement logic
   - Integrated with government forum generator
   - Added dedicated rendering layer in MapDisplayOptimized
   - Pillars now span 2-4 tiles based on era

### COMPLETED Phase 3: Material System Connection
3. **Material System Fully Connected** ✅
   - Created `materialMappingService.ts` bridging augmentation and rendering
   - Defined all 6 material styles (white_marble, grey_stone, red_lacquer, sandstone, wood, steel)
   - Materials determined by cultural zone and era
   - Multi-tile pillars use correct materials

### COMPLETED Phase 4: Size Scaling Fixes
4. **All Generators Now Scale Properly** ✅
   - University: Proportional scaling for all rooms
   - Arena: Dynamic tier counts and dimensions
   - Theater: Already fixed in previous session
   - Market: Already fixed in previous session
   - Vessel: Already properly constrained
   - Government Forum: Fully adaptive layouts

## 📢 Previous Session Progress (December 31)

### What Got Done:
1. **Size Scaling System**: 
   - ✅ Added `determineMapSize()` function that sets size based on era
   - ✅ Government forums scale from XS to XL properly
   - ✅ Market generator now handles all sizes (added `generateSimpleMarket()` for XS)
   - ✅ Theater generator now handles all sizes (added `generateSimpleTheater()` for XS)

2. **Fixed Pink Tiles**:
   - ✅ Added DAIS, BENCH, PILLAR, CABINET to BIOME_COLORS
   - ✅ All biome types now render (no more magenta)

3. **Honest Documentation**:
   - ✅ Rewrote roadmap to reflect ACTUAL state vs claims
   - ✅ Added implementation advice for future developers
   - ✅ Documented all gaps and missing features

### What's Still Broken:
1. **Most generators still hardcode positions** (estates, university, arena, etc.)
2. **Multi-tile objects don't exist** (pillars are still 1 tile)
3. **Materials never applied** (everything uses default colors)
4. **No interior portals** (can't enter nested maps)
5. **Duplicate imports remain** (palaceGeneratorEnhanced, etc.)

### Next Session Should Start With:
1. Delete duplicate generator files (30 min)
2. Fix remaining generators for size scaling (2-3 hours)
3. START multi-tile pillar system (4 hours)
4. Connect material colors to rendering (2 hours)

---

## 🎯 NEXT SESSION IMPLEMENTATION PLAN (Priority Order)

### CRITICAL TASK 1: Multi-Tile Pillar System (4-6 hours)
**Why This First**: Most visible impact, proves the multi-tile concept works

#### Step 1: Create the Multi-Tile Types (30 min)
**File**: `/types/specialMapTypes.ts`
```typescript
// Add to BiomeType enum:
PILLAR_BASE = 'PILLAR_BASE',
PILLAR_MIDDLE = 'PILLAR_MIDDLE', 
PILLAR_TOP = 'PILLAR_TOP',
```

**File**: `/constants/mapGeneration/biomes/colors.ts`
```typescript
// Add colors:
[BiomeType.PILLAR_BASE]: '#7a7a7a',
[BiomeType.PILLAR_MIDDLE]: '#8a8a8a',
[BiomeType.PILLAR_TOP]: '#9a9a9a',
```

#### Step 2: Create Pillar Symbol Components (1 hour)
**File**: Create `/components/symbols/architecture/specialMap/PillarBase.tsx`
```typescript
export const PillarBase: React.FC<{x, y, size, material}> = ({x, y, size, material}) => {
  const colors = {
    'grey_stone': '#7a7a7a',
    'white_marble': '#e8e8e8',
    'red_lacquer': '#8b0000',
    'sandstone': '#c19a6b',
    'wood': '#8b4513',
    'steel': '#708090'
  };
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={0} y={0} width={size} height={size} fill="#8a8a8a"/> {/* Gray background */}
      <rect x={size*0.2} y={size*0.2} width={size*0.6} height={size*0.6} 
            fill={colors[material] || colors['grey_stone']}/>
      {/* Add 3D effect with darker bottom edge */}
      <rect x={size*0.2} y={size*0.7} width={size*0.6} height={size*0.1} 
            fill="#000" opacity="0.3"/>
    </g>
  );
};
```

**Repeat for**: `PillarMiddle.tsx`, `PillarTop.tsx` (with different shapes)

#### Step 3: Add to SpecialMapSymbolRenderer (30 min)
**File**: `/components/symbols/specialMap/SpecialMapSymbolRenderer.tsx`
```typescript
// Import new components
import { PillarBase, PillarMiddle, PillarTop } from '../architecture/specialMap';

// Add cases:
case BiomeType.PILLAR_BASE:
  return <PillarBase x={0} y={0} size={size} material={getMaterial(culturalZone, era)} />;
case BiomeType.PILLAR_MIDDLE:
  return <PillarMiddle x={0} y={0} size={size} material={getMaterial(culturalZone, era)} />;
case BiomeType.PILLAR_TOP:
  return <PillarTop x={0} y={0} size={size} material={getMaterial(culturalZone, era)} />;
```

#### Step 4: Create Multi-Tile Placement Function (1.5 hours)
**File**: Create `/generation/specialMap/multiTileObjects.ts`
```typescript
export function placePillar(
  tiles: Tile[][],
  x: number,
  y: number, 
  height: number,
  material: MaterialType
) {
  // Place from bottom up
  if (y - height + 1 < 0) return; // Out of bounds
  
  // Base (bottom)
  tiles[y][x].biome = BiomeType.PILLAR_BASE;
  tiles[y][x].materialSubtype = material;
  tiles[y][x].isBlocking = true;
  
  // Middle sections
  for (let i = 1; i < height - 1; i++) {
    tiles[y - i][x].biome = BiomeType.PILLAR_MIDDLE;
    tiles[y - i][x].materialSubtype = material;
    tiles[y - i][x].isBlocking = false; // Can walk behind pillar
  }
  
  // Top
  if (height > 1) {
    tiles[y - height + 1][x].biome = BiomeType.PILLAR_TOP;
    tiles[y - height + 1][x].materialSubtype = material;
    tiles[y - height + 1][x].isBlocking = false;
  }
}

// Height based on era
export function getPillarHeight(era: HistoricalEra): number {
  if (era === HistoricalEra.PREHISTORY) return 2;
  if (era === HistoricalEra.ANTIQUITY) return 3;
  if (era >= HistoricalEra.MEDIEVAL) return 4;
  return 3;
}
```

#### Step 5: Update Government Forum to Use Multi-Tile Pillars (1 hour)
**File**: `/generation/specialMap/archetypes/governmentForumFixed.ts`
```typescript
import { placePillar, getPillarHeight } from '../multiTileObjects';
import { CULTURE_MATERIALS } from '../../../constants/specialMaps/specialMapAugmentation';

// Replace single-tile pillar placement:
// OLD: tiles[y][x].biome = BiomeType.PILLAR;
// NEW:
const material = CULTURE_MATERIALS[culturalZone][eraCategory].pillar || 'grey_stone';
const pillarHeight = getPillarHeight(config.era);
placePillar(tiles, x, y, pillarHeight, material);
```

#### Step 6: TEST IT! (30 min)
- Generate government forum at each era
- Verify pillars render with correct height
- Check different cultural zones show different materials
- Screenshot before/after for documentation

---

### CRITICAL TASK 2: Connect Material System (2-3 hours)
**Why This Second**: Makes cultural variations actually visible

#### Step 1: Create Material Service (45 min)
**File**: Create `/services/specialMapMaterialService.ts`
```typescript
import { CULTURE_MATERIALS } from '../constants/specialMaps/specialMapAugmentation';

export function getMaterialForBiome(
  biomeType: BiomeType,
  culturalZone: string,
  era: HistoricalEra
): string {
  const eraCategory = getEraCategory(era);
  const materials = CULTURE_MATERIALS[culturalZone]?.[eraCategory];
  
  if (!materials) return getDefaultMaterial(biomeType);
  
  // Map biome types to material categories
  const materialMap = {
    [BiomeType.WALL]: materials.wall || materials,
    [BiomeType.FLOOR_STONE]: materials.floor || materials,
    [BiomeType.PILLAR]: materials.pillar || materials,
    [BiomeType.PILLAR_BASE]: materials.pillar || materials,
    [BiomeType.PILLAR_MIDDLE]: materials.pillar || materials,
    [BiomeType.PILLAR_TOP]: materials.pillar || materials,
    [BiomeType.TABLE]: materials.furniture || 'wood',
    [BiomeType.CHAIR]: materials.furniture || 'wood',
    [BiomeType.THRONE]: materials.accent || 'gold',
  };
  
  return materialMap[biomeType] || getDefaultMaterial(biomeType);
}
```

#### Step 2: Pass Material Through Rendering Pipeline (1 hour)
**File**: `/components/SpecialMapLocationDisplay.tsx`
```typescript
// When rendering tiles, get material:
const material = getMaterialForBiome(
  tile.biome,
  specialMapData.specialConfig.culturalZone,
  specialMapData.specialConfig.era
);

// Pass to SpecialMapSymbolRenderer:
<SpecialMapSymbolRenderer
  biome={tile.biome}
  material={material} // NEW PROP
  culturalZone={culturalZone}
  era={era}
/>
```

#### Step 3: Update Key Symbols to Use Materials (45 min)
**Priority symbols to update**:
1. `WallSymbol2D.tsx` - Most visible
2. `FloorTileSymbol2D.tsx` - Sets overall tone  
3. `TableSymbol2D.tsx` - Common furniture
4. `ChairSymbol2D.tsx` - Common furniture

**Example update for WallSymbol2D**:
```typescript
const getWallColor = (material: MaterialType) => {
  const colors = {
    'grey_stone': '#808080',
    'white_marble': '#f0f0f0', 
    'sandstone': '#d2b48c',
    'wood': '#8b4513',
    'red_lacquer': '#8b0000',
    'steel': '#708090'
  };
  return colors[material] || colors['grey_stone'];
};
```

---

### CRITICAL TASK 3: Fix Remaining Size Issues (2 hours)
**Files to fix** (in order of complexity):

1. **University Generator** (30 min)
   - File: `/generation/specialMap/archetypes/universityGenerator.ts`
   - Issue: Assumes space for multiple buildings
   - Fix: Single building for S/M, multiple only for L/XL

2. **Arena Generator** (30 min)
   - File: `/generation/specialMap/archetypes/arenaGenerator.ts`  
   - Issue: Fixed radius for circular seating
   - Fix: `const radius = Math.min(20, size.width * 0.4)`

3. **Vessel Generator** (20 min)
   - File: `/generation/specialMap/archetypes/vesselGenerator.ts`
   - Issue: Doesn't respect size constraints
   - Fix: Force to XS/Small regardless of era

4. **Restaurant Generator** (20 min)
   - File: `/generation/specialMap/archetypes/restaurantInnGenerator.ts`
   - Issue: Fixed room dimensions
   - Fix: Scale kitchen, dining, private rooms

5. **Campground Generator** (20 min)
   - File: `/generation/specialMap/archetypes/campgroundGenerator.ts`
   - Issue: Can be XL (should max at Large)
   - Fix: Clamp size in determineMapSize()

---

### QUICK WIN: Delete Duplicate Files (30 min)
**Files to DELETE**:
```bash
rm /Users/benjaminbreen/code/august-6-uhs/generation/specialMap/archetypes/palaceGeneratorEnhanced.ts
rm /Users/benjaminbreen/code/august-6-uhs/generation/specialMap/archetypes/governmentGeneratorEnhanced.ts
rm /Users/benjaminbreen/code/august-6-uhs/generation/specialMap/archetypes/governmentForum2D.ts
rm /Users/benjaminbreen/code/august-6-uhs/generation/specialMap/archetypes/castleGeneratorEnhanced.ts
```

**Update imports in**: `/generation/specialMap/specialMapGenerator.ts`
- Remove all unused imports
- Keep only the "Fixed" versions

---

### Testing Checklist After Implementation
- [ ] Generate EVERY archetype at size XS (8x8)
- [ ] Generate EVERY archetype at size XL (25x25)
- [ ] Verify pillars are multi-tile in government forum
- [ ] Check European vs MENA vs Asian materials are different
- [ ] No pink tiles anywhere
- [ ] Walls are blocking, floors are not
- [ ] Exit zones work properly

### Time Estimate for Complete Implementation
- Multi-tile pillars: 4-6 hours
- Material system: 2-3 hours  
- Fix remaining generators: 2 hours
- Delete duplicates: 30 min
- Testing: 1 hour
**Total: 10-13 hours of focused work**

### What This Will Achieve
1. **Visual Impact**: Multi-tile pillars will make spaces feel 3D
2. **Cultural Variety**: Materials will make each culture distinct
3. **Size Flexibility**: All archetypes will work at all sizes
4. **Clean Codebase**: No more duplicate files

### What Can Wait (Phase 4+)
- Interior portals (complex, needs design)
- Multi-tile tables (less critical than pillars)
- Light source pairing (nice to have)
- Player homes (needs full design)
- Camping system (gameplay feature)
- Vessel sprites (cosmetic)

## 🚨 BRUTAL HONESTY: Current State vs Vision

### What the Roadmap Claims vs Reality

| Feature | Claimed | **ACTUAL STATUS** | Gap Analysis |
|---------|---------|-------------------|-------------|
| **Size Scaling (XS-XL)** | "Implemented" | ✅ JUST added to specialMapGenerator.ts, ⚠️ Only governmentForum actually adapts | Most generators ignore size parameter |
| **Cultural Variations** | "Complete" | ❌ ONLY government forums, layout only | No material swapping, no other archetypes |
| **Multi-tile Objects** | "Core feature" | ❌ ZERO implementation | System designed but never built |
| **Material System** | "Universal" | ❌ Defined but NEVER USED | Colors still hardcoded everywhere |
| **Parameter-driven** | "Simplified" | ❌ Still using hardcoded generators | Each archetype has separate logic |
| **10 Archetypes** | "Working" | ⚠️ 9 exist, 1 missing (Player Home) | Most don't scale or customize |
| **Interior Portals** | "3-layer system" | ❌ No implementation | No nested maps at all |

### ✅ What ACTUALLY Works (as of December 2024)
1. **Pink tiles fixed**: Added DAIS, BENCH, PILLAR, CABINET to BIOME_COLORS
2. **Size determination**: `determineMapSize()` NOW sets size based on era/archetype
3. **Government forums**: NOW scale properly (XS to XL) with cultural layouts
4. **Basic generators exist**: 9/10 archetypes have generator files

### ❌ Critical Gaps That Must Be Fixed
1. **Generators don't use size**: Most assume fixed dimensions
2. **No multi-tile objects**: Pillars, tables still single-tile "stickers"
3. **Materials ignored**: Cultural material system never applied to rendering
4. **Duplicate code**: 3-4 versions of each generator still imported
5. **No interior portals**: Can't enter throne rooms, captain's quarters, etc.

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

### Current Implementation Status

| Archetype | Status | Generator File | Cultural Variations |
|-----------|--------|----------------|--------------------|
| **Estates** | ✅ Working | `estatesGeneratorFixed.ts` | Partial |
| **Government** | ✅ Fixed | `governmentForumFixed.ts` | ✅ Complete |
| **Arena/Theater** | ✅ Working | `theaterGenerator.ts` | Needs update |
| **University** | ✅ Working | `universityGenerator.ts` | Needs update |
| **Market** | ✅ Working | `marketGenerator.ts` | Needs update |
| **Open Field** | ✅ Working | `openFieldGenerator.ts` | Basic |
| **Campground** | ❌ Missing | Not implemented | - |
| **Restaurant** | ✅ Working | `restaurantInnGenerator.ts` | Basic |
| **Vessel** | ✅ Working | `vesselGenerator.ts` | Basic |
| **Player Home** | ❌ Missing | Not implemented | - |

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

## 📊 Revised Implementation Phases (December 2024)

### Phase 1: Complete Size Scaling ⚠️ 40% COMPLETE
**What's Done:**
- [x] Size determination logic in specialMapGenerator.ts
- [x] Government forum adapts to all sizes
- [x] MAP_SIZES constant defined

**What's NOT Done:**
- [ ] Estates: Uses size param but doesn't adapt layout
- [ ] Market: Hardcoded stall positions break on small maps
- [ ] Theater: Fixed stage size doesn't scale
- [ ] University: Assumes large map for multiple buildings
- [ ] Arena: Fixed circular radius
- [ ] Vessel: Doesn't constrain to small sizes
- [ ] Restaurant: Fixed room layout
- [ ] Campground: Should be XS-L only (not XL)

### Phase 2: Multi-Tile Object System ❌ 0% COMPLETE
**Required Components:**
- [ ] Create MultiTileObject base class
- [ ] Pillar system:
  - [ ] Base tile (bottom)
  - [ ] Middle tiles (0-2 based on height)
  - [ ] Capital tile (top)
  - [ ] Height based on era (2-4 tiles)
- [ ] Table system:
  - [ ] Left end piece
  - [ ] Middle pieces (1-7)
  - [ ] Right end piece
  - [ ] Width based on map size
- [ ] Light sources:
  - [ ] Fixture tile (torch holder, lamp post)
  - [ ] Light tile above (flame, bulb)
- [ ] Material application to multi-tile objects

### Phase 3: Material System Integration ❌ 0% COMPLETE
- [ ] Create material renderer service
- [ ] Apply materials to BiomeTypes in SpecialMapSymbolRenderer
- [ ] Pass material through to symbol components
- [ ] Create material-aware variants:
  - [ ] WallSymbol (stone, marble, wood, sandstone)
  - [ ] PillarSymbol (6 material variants)
  - [ ] FloorSymbol (already partial, needs completion)
  - [ ] FurnitureSymbols (wood, lacquer, etc.)

### Phase 4: Advanced Features (Future)
- [ ] Camping system (pack up/linger mechanics)
- [ ] Vessel sprite evolution (raft → galleon → submarine)
- [ ] Interior portal system
- [ ] Elite spawn mechanics

### Phase 5: Player Home (Future)
- [ ] Create playerHomeGenerator.ts
- [ ] Customization system
- [ ] Storage/inventory integration
- [ ] Size based on wealth

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

### File Organization (Current State)
```
generation/specialMap/
├── specialMapGenerator.ts       # Main generator ✅
├── landscapeService.ts          # Landscape borders ✅
└── archetypes/                  # NEEDS CONSOLIDATION
    ├── estatesGeneratorFixed.ts ✅
    ├── governmentForumFixed.ts  ✅ (with cultural variations)
    ├── theaterGenerator.ts      ✅
    ├── universityGenerator.ts   ✅
    ├── marketGenerator.ts       ✅
    ├── openFieldGenerator.ts    ✅
    ├── restaurantInnGenerator.ts ✅
    ├── vesselGenerator.ts       ✅
    ├── campgroundGenerator.ts   ✅
    └── [MANY DUPLICATES TO REMOVE]

constants/specialMaps/
├── specialMapAugmentation.ts    # ✅ Cultural patterns & materials
└── [TO ADD: materials.ts, layouts.ts]

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

## 🎯 Critical Implementation Advice for Future Developers

### Start Here - Quick Wins
1. **Fix Size Scaling First** (2-4 hours per generator)
   - Open each generator file
   - Replace hardcoded positions with proportional calculations
   - Test with XS (8x8) and XL (25x25) to find breaks
   - Example: `const x = 4` → `const x = Math.floor(size.width * 0.2)`

2. **Delete Duplicate Files** (30 minutes)
   - Keep only: estatesGeneratorFixed, governmentForumFixed, etc.
   - Delete: palaceGeneratorEnhanced, governmentGeneratorEnhanced, etc.
   - Update imports in specialMapGenerator.ts

3. **Test Each Archetype** (1 hour)
   - Force each to generate at XS, S, M, L, XL sizes
   - Document which ones break
   - Priority: Market, Theater, University (most complex)

### Common Pitfalls to Avoid
1. **Don't trust the existing code** - Most claims in comments are lies
2. **Don't assume dynamic sizing works** - Most generators hardcode dimensions
3. **Don't expect materials to work** - System exists but isn't connected
4. **Don't believe "cultural variations"** - Only government forums have them

### Code Patterns That Work
```typescript
// Good: Proportional sizing
const padding = Math.max(2, Math.floor(size.width * 0.15));
const roomWidth = size.width - (padding * 2);

// Bad: Hardcoded values
const roomX = 4;
const roomWidth = size.width - 8; // Breaks on 8x8 map!
```

### Priority Order for Fixes
1. **Size scaling** - Without this, nothing else matters
2. **Multi-tile pillars** - Most visual impact
3. **Material colors** - Makes cultural variation visible
4. **Interior portals** - Can be deferred (complex)

### Testing Checklist
- [ ] Generate each archetype at size XS (8x8)
- [ ] Generate each archetype at size XL (25x25)
- [ ] Verify no pink tiles appear
- [ ] Check walls are marked as blocking
- [ ] Verify exits are placed correctly
- [ ] Test with different cultural zones

## 🔥 ACTUAL Next Steps (Stop Pretending, Start Doing)

### TODAY: Phase 1 Completion (4-6 hours)
1. **Fix Market Generator** 
   - Make stall positions proportional
   - Scale fountain/plaza with map size
   - Test at XS and XL

2. **Fix Theater Generator**
   - Scale stage to map size
   - Adjust seating rows dynamically
   - Handle XS (single performance space)

3. **Fix University Generator**
   - Single building for S/M
   - Multiple buildings only for L/XL
   - Scale classroom sizes

### TOMORROW: Phase 2 - Multi-tile Objects (8 hours)
1. **Create MultiTileObject.ts**
```typescript
interface MultiTileObject {
  baseTile: {x: number, y: number};
  tiles: TileComponent[];
  orientation: 'vertical' | 'horizontal';
  material: MaterialType;
}
```

2. **Implement Pillar System**
   - Create PillarBase, PillarMiddle, PillarTop symbols
   - Stack based on era (2-4 tiles)
   - Apply materials

3. **Test in Government Forum**
   - Replace single-tile pillars
   - Verify rendering order
   - Check collision/blocking

### THIS WEEK: Phase 3 - Materials (4 hours)
1. **Connect Material System**
   - Add material prop to SpecialMapSymbolRenderer
   - Pass cultural material to each symbol
   - Update symbol components to use material colors

2. **Priority Symbols for Materials**
   - WallSymbol (most visible)
   - PillarSymbol (architectural focus)
   - FloorSymbol (sets tone)

### DEPRIORITIZED (Move to Phase 4-5)
- Interior portals (complex, not critical)
- Player homes (needs design work)
- Camping system (gameplay feature)
- Vessel sprites (nice-to-have)

## Design Philosophy

1. **Simplicity Over Specificity**: One palace generator with parameters beats 20 culture-specific generators
2. **Performance First**: Smaller maps are better - intimate and fast
3. **Materials Tell Stories**: Six materials can represent infinite variations
4. **Vertical Reinforces Hierarchy**: Multi-tile height = importance
5. **Nested Depth**: Three layers (world → building → room) creates journey
6. **Universal Fallbacks**: Any scenario can map to 10 archetypes

---

*This roadmap represents a fundamental simplification that will make the special map system more maintainable, performant, and extensible while actually increasing variety through parameterization.*
