# Adjacency & Urban Systems Roadmap

## Overview
This document outlines the comprehensive plan to fix and enhance the game's adjacency system, liminal zones, urban density mechanics, and faction coverage. The goal is to create a seamless, historically-aware navigation and settlement system that spans all map areas and eras.

## Current System Analysis

### Adjacencies (constants/gameData/adjacencies.ts)
**Status**: Mostly complete but needs verification and gaps filled
- ✅ Core adjacency graph exists with N/S/E/W connections
- ✅ LIMINAL_SEQUENCES implemented for ocean crossings
- ❌ Some map areas lack complete adjacency coverage
- ❌ Liminal sequences need length calibration by ocean size
- ❌ Arctic liminal zones not implemented

### Cities (constants/gameData/cities.ts)
**Status**: Incomplete - covers ~30% of map areas
- ✅ Rich historical data for covered cities (founding years, allegiance changes)
- ✅ Multi-era city evolution (Roman Londinium → Medieval London)
- ❌ Many map areas completely missing city definitions
- ❌ No urban density classification system
- ❌ Missing prehistoric/ancient era coverage for most regions

### Factions (constants/gameData/factions.ts)
**Status**: Needs analysis and completion
- ❓ Coverage unknown - requires detailed review
- ❓ Generic "local tribes" fallback needed for uncovered areas

## Phase 1: Adjacency System Completion

### 1.1 Adjacency Gap Analysis & Repair
**Timeline**: 2-3 days
**Files**: `constants/gameData/adjacencies.ts`, `constants/gameData/geography.ts`

**Tasks**:
- Audit all map areas in geography.ts against adjacencies.ts
- Identify orphaned areas with missing N/S/E/W connections
- Create logical geographic connections for isolated areas
- Verify adjacency symmetry (if A connects to B east, B should connect to A west)

**Deliverables**:
- Complete adjacency coverage for all 200+ map areas
- Adjacency validation script to prevent future gaps

### 1.2 Liminal Zone System Enhancement
**Timeline**: 3-4 days
**Files**: `constants/gameData/adjacencies.ts`, new liminal generation logic

**Current Liminal Types Needed**:
- **Ocean Crossings**: Open water with no NPCs/cities, just ambient sea life
- **Arctic Zones**: Empty tundra with polar wildlife only
- **Desert Crossings**: Vast empty desert areas for large regions like Sahara
- **Mountain Passes**: High-altitude crossings for major mountain ranges

**Liminal Sequence Lengths by Geography**:
- English Channel: 1 map
- Mediterranean crossings: 1-2 maps  
- Atlantic crossings: 3-4 maps
- Pacific crossings: 5-6 maps
- Arctic passages: 2-3 maps
- Sahara interior: 2-3 maps

**Implementation**:
- Expand LIMINAL_SEQUENCES with proper lengths
- Create liminal map generator that produces empty maps with appropriate biomes
- Add liminal-specific animal spawning (only ambient ocean/arctic/desert creatures)
- Ensure liminal maps have no cities, NPCs, or detailed features

## Phase 2: Cities & Urban Density System

### 2.1 Complete Cities Database
**Timeline**: 5-7 days
**Files**: `constants/gameData/cities.ts`

**Missing Regions Requiring City Data**:
- **North America**: Most pre-Columbian areas, Western regions
- **South America**: Andean regions, Amazonia, Patagonia
- **Africa**: Central Africa, West Africa interior, East Africa highlands
- **Asia**: Central Asia, Siberia, Southeast Asia islands, Inner China
- **Europe**: Scandinavia, Eastern Europe, Balkans interior
- **Oceania**: Pacific islands beyond major settlements

**City Classification System**:
```typescript
interface CityDefinition {
  // ... existing fields ...
  urbanDensity: 'small' | 'moderate' | 'large' | 'massive';
  eraSpecificDensity?: {
    [era: string]: 'small' | 'moderate' | 'large' | 'massive';
  };
  populationPeak?: number;
  economicFocus?: string[];
}
```

**Urban Density Definitions**:
- **Small**: Default urban tile generation (current standard)
- **Moderate**: 2x urban tiles (small towns, regional centers)
- **Large**: 3x urban tiles (major cities, capitals)
- **Massive**: 5x+ urban tiles (modern megacities: London, NYC, Tokyo)

### 2.2 Era-Based Urban Evolution
**Timeline**: 3-4 days
**Files**: Urban density calculation logic, UI components

**Historical Urban Density Progression**:

**Prehistoric (pre-3000 BCE)**:
- Almost no urban areas
- Exceptions: Çatalhöyük, Jericho (moderate)

**Ancient (3000 BCE - 500 CE)**:
- Mesopotamian cities: Ur, Babylon (large)
- Egyptian centers: Memphis, Thebes (large)
- Classical cities: Athens, Rome, Alexandria (large)
- Most other areas: small or none

**Medieval (500 - 1450 CE)**:
- European cities: Paris, London, Constantinople (moderate-large)
- Islamic centers: Baghdad, Córdoba, Cairo (large)
- Asian cities: Chang'an, Kaifeng (large)
- Most regional centers: moderate

**Early Modern (1450 - 1800 CE)**:
- Colonial capitals: Mexico City, Lima, Boston (moderate-large)
- Trade centers: Amsterdam, Venice, Istanbul (large)
- Emerging industrial cities: Manchester, Birmingham (moderate)

**Modern (1800+ CE)**:
- Megacities: London, New York, Paris (massive)
- Industrial centers: multiple large cities per region
- Global urban coverage: most areas have at least moderate

### 2.3 User-Configurable Urban Density
**Timeline**: 2-3 days
**Files**: Top navigation UI, map generation settings

**UI Implementation**:
- Add "Urban Density" dropdown to map generation panel
- Options: "Historical Default", "Low Urban", "High Urban", "Mega Urban"
- Override historical defaults when user specifies custom density
- Preview showing approximate urban tile multiplier

## Phase 3: Faction System Completion

### 3.1 Faction Coverage Analysis
**Timeline**: 2 days
**Files**: `constants/gameData/factions.ts`

**Tasks**:
- Audit existing faction coverage by region and era
- Identify areas lacking faction definitions
- Create faction classification system by complexity

### 3.2 Generic Faction System
**Timeline**: 3-4 days
**Files**: `constants/gameData/factions.ts`, faction generation logic

**Fallback Faction Types**:
- "Local Tribes" (default for uncovered areas)
- "Regional Chiefdoms" (areas with moderate complexity)
- "Trading Communities" (coastal/river areas)
- "Nomadic Groups" (steppe/desert areas)
- "Isolated Settlements" (remote/harsh biomes)

**Dynamic Faction Naming**:
- Generate culture-appropriate names based on geographic region
- "Saharan Tribes", "Arctic Peoples", "Mountain Clans", etc.
- Maintain historical accuracy while providing comprehensive coverage

## Phase 4: System Integration

### 4.1 Map Generation Integration
**Timeline**: 4-5 days
**Files**: Map generation logic, urban tile placement

**Implementation**:
- Wire cities.ts data to map generator
- Calculate urban tile density based on era and city classification
- Ensure urban areas cluster around defined city locations
- Handle multiple cities per map area appropriately

### 4.2 Navigation System Enhancement
**Timeline**: 2-3 days
**Files**: Map navigation logic, liminal map handling

**Tasks**:
- Implement liminal map traversal mechanics
- Add progress indication for multi-map ocean crossings
- Create appropriate transitions between normal and liminal maps
- Ensure player can't get lost in liminal sequences

### 4.3 User Interface Integration
**Timeline**: 3-4 days
**Files**: Top navigation, map settings, city information displays

**Features**:
- Urban density selection in map generation
- City information tooltips with historical data
- Era-aware urban density display
- Faction information integration with city data

## Phase 5: Testing & Validation

### 5.1 System Testing
**Timeline**: 3-4 days

**Test Coverage**:
- All map areas have valid adjacencies
- Liminal sequences work for all ocean/arctic crossings
- Urban density scales correctly by era
- No orphaned areas or broken navigation paths
- City data displays correctly across all eras

### 5.2 Historical Accuracy Review
**Timeline**: 2-3 days

**Validation**:
- City founding dates and allegiance changes historically accurate
- Urban density progression matches historical patterns
- Faction coverage appropriate for each region/era
- Liminal zone distances feel realistic for geographic scale

## Implementation Priority

### High Priority (Complete First)
1. Adjacency gap analysis and repair
2. Liminal zone length calibration
3. Complete cities database for major missing regions
4. Era-based urban density calculation

### Medium Priority
1. User-configurable urban density UI
2. Faction system completion and fallback mechanisms
3. Dynamic faction naming system

### Low Priority (Polish Phase)
1. Advanced liminal map features (weather, random events)
2. Detailed city description generation
3. Historical population data integration
4. Advanced urban clustering algorithms

## Technical Considerations

### Performance
- Large adjacency graphs may need optimization for pathfinding
- Urban tile generation should be efficient for high-density areas
- City data lookups should be indexed for fast access

### Extensibility
- System should easily accommodate new map areas
- Urban density system should scale to handle future eras
- Faction system should support custom user-defined factions

### Data Management
- Version control for large data file changes
- Data validation scripts to prevent inconsistencies
- Export/import tools for external city/faction data

## Success Metrics

### Core Functionality
- [ ] 100% adjacency coverage (no orphaned map areas)
- [ ] All major ocean/arctic crossings have appropriate liminal sequences
- [ ] 90%+ of map areas have at least one city definition by modern era
- [ ] All map areas have faction coverage (including generic fallbacks)

### User Experience
- [ ] Seamless navigation between all map areas
- [ ] Historically appropriate urban density by era
- [ ] Intuitive user controls for urban density customization
- [ ] Rich historical information available for major cities

### Historical Accuracy
- [ ] City data aligns with historical records
- [ ] Urban density progression matches historical patterns
- [ ] Faction representation appropriate for each region/time
- [ ] Liminal zone distances feel geographically reasonable

## Estimated Timeline
**Total Duration**: 6-8 weeks (30-40 development days)

This roadmap provides a comprehensive path to creating a robust, historically-aware adjacency and urban system that will significantly enhance the game's educational value and player experience.