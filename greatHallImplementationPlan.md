# Special Map System Comprehensive Improvement Plan

## Executive Summary
The special map system has strong bones but needs refinement in symbol consistency, cultural accuracy, and variety. This plan outlines a phased approach to elevate the special map system to AAA indie game quality with Stardew Valley/FF6-level pixel art beauty.

## Phase 1: Symbol Consistency & Polish (1-2 weeks)

### 1.1 Complete Symbol Updates
**Priority: HIGH**
- [ ] Create missing overlay symbols:
  - BrazierSymbol (fire pit with metal container)
  - CandleSymbol (simple candle on holder)
  - LanternSymbol (hanging or standing lantern)
  - RugSymbol (decorative floor covering)
  - VaseSymbol (decorative pottery)
  - CrateSymbol (storage container)
  - BarrelSymbol (liquid storage)
  - ScrollRackSymbol (for libraries)

### 1.2 Fix Remaining Perspective Issues
**Priority: HIGH**
- [ ] Update AltarSymbol to 3/4 perspective
- [ ] Update PillarSymbol with consistent shadows
- [ ] Update ChestSymbol with proper depth
- [ ] Ensure ALL symbols use 32x32 pixel base
- [ ] Standardize 45-degree shadow placement

### 1.3 Cultural Variant System
**Priority: MEDIUM**
- [ ] Implement systematic cultural variations for ALL symbols
- [ ] Create material palette system (wood types, metal types, fabric colors)
- [ ] Add era-based wear/aging effects
- [ ] Document cultural design patterns

## Original Great Hall Implementation Plan

## Viking Great Hall & Indigenous Longhouse Features

### Core Requirements
Both viking great halls and indigenous longhouses share:
- **Central fire pit/hearth** running down the center
- **Long parallel tables** along the walls
- **Bench seating** (not individual chairs)
- **Open rectangular layout** 
- **Wood material** throughout
- **Trophy/weapon displays** on walls
- **Smoke holes** in roof (implied)

### Implementation Strategy

#### 1. Create Fire Pit/Hearth Symbol (1 hour)
```typescript
// File: /components/symbols/FirePitSymbol.tsx
interface FirePitSymbolProps {
  x: number;
  y: number;
  size: number;
  type: 'pit' | 'hearth' | 'brazier';
  culturalZone: string;
  era: number;
  lit: boolean;
}

// Variations:
// - Viking: Stone-ringed fire pit
// - Indigenous: Earth pit with wooden frame
// - Medieval: Raised hearth with chimney
// - Modern: Decorative fireplace
```

#### 2. Implement Multi-Tile Tables (2 hours)
```typescript
// Files: /components/symbols/architecture/specialMap/
// - TableLeft.tsx (with leg)
// - TableCenter.tsx (extendable)
// - TableRight.tsx (with leg)

// Usage for great hall:
// [TableLeft][TableCenter][TableCenter][TableCenter][TableRight]
// Creates a 5-tile long banquet table

// Vertical stacking for perpendicular layout:
// [TableCenter]
// [TableCenter]
// [TableCenter]
```

#### 3. Add "great_hall" Layout to Estates (2 hours)
```typescript
// File: /generation/specialMap/archetypes/estatesGeneratorFixed.ts

function generateGreatHall(config: SpecialMapConfig, tiles: Tile[][]) {
  const { width, height } = config.mapSize;
  
  // Central fire pit row (3-5 pits depending on hall length)
  const centerX = Math.floor(width / 2);
  for (let y = 3; y < height - 3; y += 4) {
    tiles[y][centerX].biome = BiomeType.FIRE_PIT;
  }
  
  // Long tables parallel to walls
  // Left side tables
  for (let y = 3; y < height - 3; y++) {
    tiles[y][2].biome = BiomeType.TABLE_CENTER;
  }
  tiles[2][2].biome = BiomeType.TABLE_LEFT;
  tiles[height-3][2].biome = BiomeType.TABLE_RIGHT;
  
  // Right side tables (mirror)
  for (let y = 3; y < height - 3; y++) {
    tiles[y][width-3].biome = BiomeType.TABLE_CENTER;
  }
  tiles[2][width-3].biome = BiomeType.TABLE_LEFT;
  tiles[height-3][width-3].biome = BiomeType.TABLE_RIGHT;
  
  // Benches along tables
  for (let y = 3; y < height - 3; y += 2) {
    tiles[y][1].biome = BiomeType.BENCH;
    tiles[y][width-2].biome = BiomeType.BENCH;
  }
  
  // Chief's throne at head
  tiles[1][centerX].biome = BiomeType.THRONE;
  
  // Weapon racks on walls
  tiles[height/2][0].biome = BiomeType.WEAPON_RACK;
  tiles[height/2][width-1].biome = BiomeType.WEAPON_RACK;
}
```

### Cultural Variations

#### Viking Great Hall (Scandinavia, 800-1100 CE)
- **Material**: Dark wood (oak)
- **Fire**: Stone-ringed pits
- **Tables**: Heavy wooden trestles
- **Decorations**: Shields, axes, tapestries
- **Special**: Mead barrels, high seat

#### Indigenous Longhouse (Americas, various periods)
- **Material**: Cedar/pine wood
- **Fire**: Earth pits with smoke holes
- **Tables**: Low platforms or ground seating
- **Decorations**: Totems, woven baskets, pelts
- **Special**: Storage alcoves, ceremonial items

#### Medieval Great Hall (Europe, 1000-1500 CE)
- **Material**: Stone walls, wood roof
- **Fire**: Central hearth with hood
- **Tables**: Trestle tables with tablecloths
- **Decorations**: Banners, coat of arms
- **Special**: Raised dais for nobility

### Archetype Configuration
```typescript
// Usage example:
{
  archetype: SpecialMapArchetype.ESTATES,
  variant: 'great_hall',  // NEW FIELD
  culturalZone: 'EUROPEAN',
  era: 'MEDIEVAL',
  mapSize: 'large',  // 20x20 ideal for halls
  isRectangular: true,
  material: 'wood',
  hasLandscape: false  // Indoor space
}
```

### Testing Checklist
- [ ] Fire pit renders with animated flames
- [ ] Tables connect properly (no gaps)
- [ ] Benches align with tables
- [ ] Weapon racks show cultural variants
- [ ] Smoke effect above fire pits
- [ ] NPCs sit at benches properly
- [ ] Chief/leader at throne position

### Implementation Priority
1. **Fire pit symbol** - Core feature
2. **Multi-tile tables** - Essential for layout
3. **Great hall generator** - Brings it together
4. **Cultural decorations** - Polish

### Time Estimate
- Fire pit symbol: 1 hour
- Multi-tile tables: 2 hours
- Great hall layout: 2 hours
- Testing & polish: 1 hour
- **Total: 6 hours**

## Additional Archetype Variants Needed

### 1. Temple Inner Sanctum
- Central altar with radiating pattern
- Pillar colonnade
- Sacred fire/braziers
- Offering tables

### 2. War Council Chamber
- Central map table
- Weapon racks around walls
- Strategic positions marked
- Banner displays

### 3. Merchant Guild Hall
- Central trading floor
- Counting tables with scales
- Storage vaults
- Display cases

### 4. Scholar's Library
- Reading alcoves
- Tall bookshelves (multi-tile height)
- Central copying desks
- Scroll storage

### 5. Bathhouse/Hammam
- Central pool (multi-tile)
- Steam rooms
- Heated floors
- Bench seating

Each variant should be parameter-driven using the existing config system rather than creating new generators.