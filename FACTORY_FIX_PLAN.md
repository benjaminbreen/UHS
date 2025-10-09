# Factory Labor System - Fix Plan

## Issues Identified

### 1. UI Structure Problem ❌
**Current**: Factory panel uses z-50 and covers top nav + character profile
**Expected**: Should match farm panel - show top nav and character profile card in upper right

### 2. Missing Tabbed Navigation ❌
**Current**: Factory panel has no tabs
**Expected**: Tabs like farm panel (Overview, Work, People, etc.)

### 3. Data Wiring Broken ❌
**Current**: Factory shows wrong tasks (railroad factory showing sugar cane cutting)
**Root Cause**: Multiple sources of truth for factory type
- `factoryTypes.ts` has factory definitions with IDs
- `TerrainStructure.factorySubtype` might have different ID
- `useFactoryShift.ts` hardcodes tasks for only 3 types
- No validation that factory type matches task set

## Fix Strategy

### Phase 1: Establish Single Source of Truth

**File**: `services/factoryDataService.ts` (NEW)

```typescript
import { FACTORY_TYPES, FactoryType } from '../constants/gameData/factoryTypes';
import { FactoryTask } from '../components/factory/FactoryTaskCard';

/**
 * Get factory type from terrain structure
 * This is the SINGLE SOURCE OF TRUTH for factory identification
 */
export function getFactoryTypeFromStructure(
  structure: TerrainStructure,
  mapData: MapData
): FactoryType | null {
  // Priority 1: Use structure.factorySubtype if it exists
  if (structure.factorySubtype && FACTORY_TYPES[structure.factorySubtype]) {
    return FACTORY_TYPES[structure.factorySubtype];
  }

  // Priority 2: Use structure.name to infer type
  const nameLower = structure.name.toLowerCase();
  for (const [id, type] of Object.entries(FACTORY_TYPES)) {
    if (nameLower.includes(type.name.toLowerCase())) {
      return type;
    }
  }

  // Priority 3: Use getFactoryType based on era/zone/region
  return getFactoryType(mapData.era, mapData.culturalZone, mapData.region);
}

/**
 * Get tasks for a specific factory type
 * Returns tasks that match the factory's actual industry
 */
export function getTasksForFactoryType(factoryType: FactoryType): FactoryTask[] {
  const taskMap: Record<string, FactoryTask[]> = {
    // Plantations
    'sugar_plantation': SUGAR_PLANTATION_TASKS,
    'coffee_plantation': COFFEE_PLANTATION_TASKS,
    'tobacco_plantation': TOBACCO_PLANTATION_TASKS,
    'cotton_plantation': COTTON_PLANTATION_TASKS,

    // Industrial Era
    'textile_mill': TEXTILE_MILL_TASKS,
    'steel_mill': STEEL_MILL_TASKS,
    'railway_workshop': RAILWAY_WORKSHOP_TASKS,
    'coal_mine': COAL_MINE_TASKS,

    // Modern Era
    'automobile_factory': AUTOMOBILE_FACTORY_TASKS,
    'electronics_factory': ELECTRONICS_FACTORY_TASKS,
  };

  return taskMap[factoryType.id] || DEFAULT_FACTORY_TASKS;
}

/**
 * Get events for a specific factory type
 */
export function getEventsForFactoryType(factoryType: FactoryType): FactoryEvent[] {
  // Similar pattern...
}
```

### Phase 2: Fix UI Structure to Match Farm Panel

**Current Farm Panel Structure**:
```
App.tsx (z-0)
  ├── TopNavBarPolished (z-60)
  ├── LeftSidebar (hidden when farm open)
  ├── MapViewport
  └── RightSidebar (hidden when farm open)

ModalHub (z-50+)
  └── FarmPanelContainer (z-50, fixed inset-0)
      ├── FarmBanner (top)
      ├── Tabs
      ├── Tab Content (center)
      └── FarmRightSidebar (right)
```

**Fix**: Ensure TopNav has higher z-index than factory panel

**File**: `components/TopNavBarPolished.tsx`
- Check current z-index
- If < 60, increase to z-60 or z-70

**File**: `components/factory/FactoryLaborPanel.tsx`
- Keep z-50 (same as farm)
- Ensure it's `fixed inset-0` but with padding-top for top nav

### Phase 3: Add Tabbed Navigation

**New Tabs**:
1. **Overview** - Factory stats, production output, economics
2. **Work** - Task cards and active work (current main view)
3. **Workers** - Coworker list, relationships, profiles
4. **Conditions** - Working conditions, safety, unionization
5. **Manager** - Speak with overseer/manager

**Files to Create**:
```
components/factory/
├── FactoryOverviewTab.tsx       (stats, production)
├── FactoryWorkTab.tsx            (task cards - move from main panel)
├── FactoryWorkersTab.tsx         (coworker list)
├── FactoryConditionsTab.tsx      (safety, conditions)
└── FactoryManagerTab.tsx         (talk to overseer)
```

**Update**: `FactoryLaborPanel.tsx`
- Add tab state: `const [activeTab, setActiveTab] = useState<'overview' | 'work' | 'workers' | 'conditions' | 'manager'>('work')`
- Render tab buttons (copy from FarmPanelContainer)
- Render active tab component

### Phase 4: Wire Up Data Flow

**Flow**:
```
1. POIToastModal clicks "Ask for Work"
   ↓
2. Calls getFactoryTypeFromStructure(structure, mapData)
   ↓
3. Returns FactoryType (e.g., railway_workshop)
   ↓
4. Sets activeFactoryData with correct type
   ↓
5. FactoryLaborPanel receives factoryType
   ↓
6. useFactoryShift calls getTasksForFactoryType(factoryType)
   ↓
7. Returns railway_workshop tasks (NOT sugar plantation!)
   ↓
8. Tasks displayed match factory type
```

**Validation**:
- Log factory type ID at each step
- Assert tasks match factory outputs
- Error if mismatch detected

### Phase 5: Create Task Sets for All Factory Types

**File**: `constants/gameData/factoryTasks.ts` (NEW)

```typescript
// Sugar Plantation Tasks
export const SUGAR_PLANTATION_TASKS: FactoryTask[] = [
  {
    id: 'cut_cane',
    name: 'Cut Cane',
    description: 'Harvest sugar cane stalks',
    icon: '🌾',
    duration: 10,
    outputValue: 15,
    fatigueIncrease: 22,
    injuryRisk: 0.25,
    requiresTimedAction: true
  },
  // ... 5 more tasks
];

// Railway Workshop Tasks
export const RAILWAY_WORKSHOP_TASKS: FactoryTask[] = [
  {
    id: 'assemble_boiler',
    name: 'Assemble Boiler',
    description: 'Construct locomotive boiler',
    icon: '⚙️',
    duration: 12,
    outputValue: 20,
    fatigueIncrease: 18,
    injuryRisk: 0.15,
    requiresTimedAction: true,
    skillCheck: { attribute: 'intelligence', difficulty: 14 }
  },
  {
    id: 'rivet_plates',
    name: 'Rivet Plates',
    description: 'Secure steel plates with rivets',
    icon: '🔨',
    duration: 8,
    outputValue: 12,
    fatigueIncrease: 14,
    injuryRisk: 0.12,
    requiresTimedAction: true
  },
  {
    id: 'fit_pistons',
    name: 'Fit Pistons',
    description: 'Install piston assemblies',
    icon: '🔧',
    duration: 10,
    outputValue: 15,
    fatigueIncrease: 12,
    injuryRisk: 0.08
  },
  {
    id: 'paint_finish',
    name: 'Paint Finish',
    description: 'Apply protective paint coating',
    icon: '🎨',
    duration: 6,
    outputValue: 8,
    fatigueIncrease: 6,
    injuryRisk: 0.05
  },
  {
    id: 'test_steam',
    name: 'Test Steam System',
    description: 'Check boiler pressure and valves',
    icon: '💨',
    duration: 8,
    outputValue: 10,
    fatigueIncrease: 10,
    injuryRisk: 0.18
  },
  {
    id: 'move_parts',
    name: 'Move Heavy Parts',
    description: 'Transport components to assembly',
    icon: '📦',
    duration: 5,
    outputValue: 5,
    fatigueIncrease: 16,
    injuryRisk: 0.10
  }
];

// Textile Mill Tasks (already exist)
// Steel Mill Tasks (already exist)
// etc...
```

---

## Implementation Order

### Step 1: Create Single Source of Truth (30 min)
- [ ] Create `services/factoryDataService.ts`
- [ ] Implement `getFactoryTypeFromStructure()`
- [ ] Implement `getTasksForFactoryType()`
- [ ] Create `constants/gameData/factoryTasks.ts`
- [ ] Define railway_workshop tasks
- [ ] Define other missing factory tasks

### Step 2: Fix Data Wiring (15 min)
- [ ] Update POIToastModal to use `getFactoryTypeFromStructure()`
- [ ] Update useFactoryShift to use `getTasksForFactoryType()`
- [ ] Add validation logging
- [ ] Test that tasks match factory type

### Step 3: Fix UI Structure (20 min)
- [ ] Check TopNavBarPolished z-index
- [ ] If needed, increase to z-60
- [ ] Ensure factory panel stays at z-50
- [ ] Test that top nav visible when factory open

### Step 4: Add Character Profile Card (15 min)
- [ ] Check where RightSidebar renders character card
- [ ] Option A: Don't hide RightSidebar when factory open
- [ ] Option B: Render character card inside FactoryLaborPanel
- [ ] Match farm panel approach

### Step 5: Add Tabs (45 min)
- [ ] Create FactoryOverviewTab.tsx
- [ ] Create FactoryWorkTab.tsx (move task cards here)
- [ ] Create FactoryWorkersTab.tsx
- [ ] Create FactoryConditionsTab.tsx
- [ ] Create FactoryManagerTab.tsx
- [ ] Update FactoryLaborPanel with tab navigation
- [ ] Test tab switching

### Step 6: Polish & Test (30 min)
- [ ] Test all factory types show correct tasks
- [ ] Test tabs work correctly
- [ ] Test top nav visible
- [ ] Test character card visible
- [ ] Fix any styling issues

**Total Time**: ~3 hours

---

## Testing Plan

### Test Case 1: Railway Workshop
1. Find railway workshop on map
2. Click "Ask for Work"
3. **Verify**: Contract modal says "Railway Workshop"
4. Accept contract
5. **Verify**: Tasks are railway-related (assemble boiler, rivet plates, etc.)
6. **Verify**: NO sugar cane cutting tasks
7. **Verify**: Top nav visible
8. **Verify**: Character card visible in upper right

### Test Case 2: Textile Mill
1. Find textile mill
2. **Verify**: Tasks are textile-related (operate loom, thread bobbin, etc.)

### Test Case 3: Sugar Plantation
1. Find sugar plantation
2. **Verify**: Tasks are plantation-related (cut cane, boil juice, etc.)

### Test Case 4: Tab Navigation
1. Open any factory
2. Click "Overview" tab → See production stats
3. Click "Work" tab → See task cards
4. Click "Workers" tab → See coworker list
5. Click "Conditions" tab → See safety info
6. Click "Manager" tab → Chat with overseer

---

## Quick Fix (If Time Limited)

If you want just the data wiring fixed ASAP:

**File**: `hooks/useFactoryShift.ts` line ~54-150

**Change**:
```typescript
const availableTasks = useMemo((): FactoryTask[] => {
  // Factory-specific tasks
  const taskTemplates: Record<string, FactoryTask[]> = {
    'textile_mill': [ /* ... */ ],
    'steel_mill': [ /* ... */ ],
    'sugar_plantation': [ /* ... */ ]
  };

  return taskTemplates[factoryType.id] || defaultTasks;
}, [factoryType.id]);  // <-- ADD factoryType.id DEPENDENCY
```

**Add**:
```typescript
'railway_workshop': [
  {
    id: 'assemble_boiler',
    name: 'Assemble Boiler',
    description: 'Construct locomotive boiler',
    icon: '⚙️',
    duration: 12,
    outputValue: 20,
    fatigueIncrease: 18,
    injuryRisk: 0.15,
    requiresTimedAction: true
  },
  // ... 5 more railway tasks
],
```

This at least ensures railway workshop gets railway tasks.

---

## Commit Message Template

```
fix(factory): Establish single source of truth for factory types

- Create factoryDataService.ts with getFactoryTypeFromStructure()
- Create factoryTasks.ts with task definitions for all factory types
- Fix useFactoryShift to use factory type ID for task lookup
- Add railway_workshop, automobile_factory, electronics_factory tasks
- Add validation logging to catch type mismatches
- Fixes issue where railway workshop showed sugar cane tasks

Resolves data wiring bug reported in user testing
```

---

Want me to implement these fixes now?
