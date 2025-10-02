# FarmPanel Refactoring Implementation Plan

## Executive Summary
Refactor `FarmPanelImproved.tsx` (3,239 lines) into **7 focused components** + **4 custom hooks** + **1 shared types file**. This will improve maintainability, reduce cognitive load, enable better testing, and eliminate the current proxy revocation issues.

---

## Current Architecture Issues

### State Management Problems
- **40+ useState declarations** scattered throughout component
- **23 useMemo/useCallback hooks** with complex dependencies
- **Proxy revocation errors** (lines 1378-1395) from unstable state access
- **Memory leak patterns** requiring `isUnmountingRef` workarounds
- **Duplicate time tracking** (global `gameTimeHours` vs local `currentFarmTime`)

### Component Complexity
- **3,239 lines** in single file (target: <400 lines per component)
- **5 tab systems** mixed in single render tree
- **LLM integration scattered** across multiple callbacks
- **NPCToast overlap** causing UI layering issues

### Code Smells
- Lines 1370-1404: **Duplicate null checks**
- Lines 196-337: **140-line combat NPC conversion** in main component
- Lines 2466-2493: **Inline useCallback** in JSX map
- Inconsistent farm work tab visibility (code exists but not in UI)

---

## Refactoring Strategy

### Phase 1: Extract Shared Types & Interfaces (1 file)
**File**: `components/farm/types.ts`

```typescript
// Shared types used across all farm components
export interface FarmPanelProps {
  tile: Tile;
  mapData: MapData;
  playerCharacter: PlayerCharacter;
  npcs: NpcEntity[];
  onClose: () => void;
  onBuy: (itemBaseId: string, price: number) => void;
  onSell: (item: Item, price: number) => void;
  season: Season;
  gameTimeHours: number;
  onProgressTime?: (months: number) => void;
  onShowEvent?: (event: any) => void;
  currentGameDay: number;
  useLlm?: boolean;
  gameDate: any;
  onInitiateEncounter?: (target: any) => void;
  onPlayerStateChange?: (changes: PlayerStateChanges) => void;
}

export interface PlayerStateChanges {
  health?: number;
  fatigue?: number;
  statusEffects?: StatusEffect[];
  inventory?: { add?: Item[]; remove?: string[] };
}

export type TabType = 'overview' | 'fields' | 'family' | 'trade' | 'advisor';

export interface FarmContextValue {
  farmState: FarmState;
  setFarmState: (state: FarmState) => void;
  culturalZone: CulturalZone;
  era: HistoricalEra;
  year: number;
  season: Season;
  timeOfDay: TimeOfDay;
  currentFarmTime: number;
  headFarmer: FarmFamilyMember | null;
  primaryCrop: string;
  dynamicFarmName: string;
  validCrops: string[];
  harvestLedger: Record<string, number>;
  addHarvestToLedger: (crop: string, qty: number) => void;
  persistFields: (fields: FarmState['fields']) => void;
}

export interface FieldPlan {
  action: 'plant' | 'water' | 'harvest' | 'manure' | 'fallow';
  crop?: string;
  resourcesAllocated?: { water?: number; manure?: number };
}

export interface ResourceAllocation {
  water: { available: number; allocated: Map<number, number> };
  manure: { available: number; allocated: Map<number, number> };
  seeds: string[];
}
```

**Lines Saved**: ~100 (type definitions consolidated)

---

### Phase 2: Create Custom Hooks (4 files)

#### 2.1 `hooks/useFarmState.ts` (~200 lines)
**Purpose**: Centralize farm state management and persistence

**Responsibilities**:
- Load initial farm state from `getFarmState()`
- Handle farm state updates with `updateFarmState()`
- Manage sidebar collapse/restore logic (lines 369-393)
- Compute derived values (era, year, cultural zone, timeOfDay)
- Handle proxy revocation gracefully

**State Managed**:
```typescript
export function useFarmState(tile: Tile, mapData: MapData, gameTimeHours: number) {
  const [farmState, setFarmState] = useState<FarmState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [centerWidth, setCenterWidth] = useState(1200);

  // Derived values with defensive access
  const culturalZone = useMemo(/* ... */);
  const { era, year } = useMemo(/* ... */);
  const timeOfDay = useMemo(/* ... */);

  // Sidebar management
  const { manageSidebars } = useSidebarManagement();

  // Window resize handler
  useEffect(/* handleResize logic */);

  // Farm state initialization
  useEffect(() => {
    const loadFarmState = async () => {
      try {
        const state = await getFarmState(/* ... */);
        setFarmState(state);
      } catch (error) {
        console.error('Failed to load farm state:', error);
      }
    };
    loadFarmState();
  }, [tile.id, currentGameDay]);

  return {
    farmState,
    setFarmState,
    isTransitioning,
    setIsTransitioning,
    centerWidth,
    culturalZone,
    era,
    year,
    timeOfDay,
  };
}
```

**Lines Extracted**: ~150 from main component

---

#### 2.2 `hooks/useFarmFields.ts` (~250 lines)
**Purpose**: Handle field operations (plant/water/harvest)

**Responsibilities**:
- Field selection and crop selection state
- Plant/water/harvest actions (lines 675-725)
- Field work command parsing (lines 1060-1170)
- Resource allocation (lines 1202-1222)
- Worker planning and assessment (lines 1223-1370)
- Harvest ledger management

**State Managed**:
```typescript
export function useFarmFields(
  farmState: FarmState | null,
  setFarmState: (state: FarmState) => void,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  season: Season
) {
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [harvestLedger, setHarvestLedger] = useState<Record<string, number>>({});
  const [fieldPlans, setFieldPlans] = useState<Map<number, FieldPlan>>(new Map());
  const [resources, setResources] = useState<ResourceAllocation>(/* ... */);
  const [workQualityScore, setWorkQualityScore] = useState<number | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [inspectedField, setInspectedField] = useState<number | null>(null);

  // Valid crops based on cultural zone, era, season
  const validCrops = useMemo(() => getValidCrops(/* ... */), [/* ... */]);

  // Field actions
  const plantAll = useCallback(/* ... */);
  const waterAll = useCallback(/* ... */);
  const harvestAll = useCallback(/* ... */);
  const handleFieldAction = useCallback(/* ... */);
  const handleResourceAllocation = useCallback(/* ... */);
  const handleFieldWork = useCallback(/* ... */);

  // Worker planning
  const handleWorkerSubmit = useCallback(/* ... */);

  // Harvest management
  const addHarvestToLedger = useCallback(/* ... */);
  const persistFields = useCallback(/* ... */);

  return {
    selectedField,
    setSelectedField,
    selectedCrop,
    setSelectedCrop,
    harvestLedger,
    setHarvestLedger,
    validCrops,
    plantAll,
    waterAll,
    harvestAll,
    handleFieldAction,
    handleResourceAllocation,
    handleFieldWork,
    addHarvestToLedger,
    persistFields,
    fieldPlans,
    setFieldPlans,
    resources,
    setResources,
    workQualityScore,
    isAssessing,
    handleWorkerSubmit,
    inspectedField,
    setInspectedField,
  };
}
```

**Lines Extracted**: ~250 from main component

---

#### 2.3 `hooks/useFarmLLM.ts` (~300 lines)
**Purpose**: Centralize all LLM/AI interactions

**Responsibilities**:
- Family chat with dialogue generation (lines 886-958)
- Advisor summary generation (lines 959-981)
- Advisor chat (lines 982-1021)
- Farm flavor refresh (lines 1022-1059)
- Farm work simulation (lines 1060-1170)
- Worker quality assessment

**State Managed**:
```typescript
export function useFarmLLM(
  farmState: FarmState | null,
  playerCharacter: PlayerCharacter,
  mapData: MapData,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  season: Season,
  useLlm: boolean
) {
  // Family chat
  const [selectedMember, setSelectedMember] = useState<FarmFamilyMember | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<DialogueEntry[]>([]);
  const [useHistoricalLanguage, setUseHistoricalLanguage] = useState(false);

  // Advisor
  const [advisorSummary, setAdvisorSummary] = useState('');
  const [advisorChat, setAdvisorChat] = useState('');
  const [advisorLog, setAdvisorLog] = useState<string[]>([]);
  const [isAdvisorBusy, setIsAdvisorBusy] = useState(false);

  // Farm flavor
  const [isRefreshingFlavor, setIsRefreshingFlavor] = useState(false);

  // Farmer message/toast
  const [farmerMessage, setFarmerMessage] = useState('');
  const [farmerToast, setFarmerToast] = useState<FarmerToast | null>(null);

  // Farm work adventure
  const [farmWorkHistory, setFarmWorkHistory] = useState<WorkHistoryEntry[]>([]);
  const [farmWorkInput, setFarmWorkInput] = useState('');
  const [isFarmWorkProcessing, setIsFarmWorkProcessing] = useState(false);

  // LLM functions
  const handleFarmerChat = useCallback(async () => {
    if (!useLlm) return;
    setIsChatting(true);
    try {
      const response = await generateEncounterDialogue(/* ... */);
      setChatHistory(prev => [...prev, /* ... */]);
    } finally {
      setIsChatting(false);
    }
  }, [/* ... */]);

  const runAdvisorSummary = useCallback(async () => {/* ... */});
  const runAdvisorChat = useCallback(async () => {/* ... */});
  const refreshFarmFlavor = useCallback(async () => {/* ... */});
  const handleFarmWorkCommand = useCallback(async (command: string) => {/* ... */});

  const generateFarmerMessage = useCallback(() => {/* ... */});

  return {
    // Family chat
    selectedMember,
    setSelectedMember,
    chatInput,
    setChatInput,
    isChatting,
    chatHistory,
    useHistoricalLanguage,
    setUseHistoricalLanguage,
    handleFarmerChat,

    // Advisor
    advisorSummary,
    advisorChat,
    setAdvisorChat,
    advisorLog,
    isAdvisorBusy,
    runAdvisorSummary,
    runAdvisorChat,

    // Flavor
    isRefreshingFlavor,
    refreshFarmFlavor,

    // Farmer messages
    farmerMessage,
    farmerToast,
    setFarmerToast,
    generateFarmerMessage,

    // Farm work
    farmWorkHistory,
    farmWorkInput,
    setFarmWorkInput,
    isFarmWorkProcessing,
    handleFarmWorkCommand,
  };
}
```

**Lines Extracted**: ~300 from main component

---

#### 2.4 `hooks/useFarmCombat.ts` (~150 lines)
**Purpose**: Handle farm NPC to combat entity conversion

**Responsibilities**:
- Convert farm family member to NPC entity (lines 196-337)
- Handle combat initiation flow
- Manage cleanup and unmounting state

**State Managed**:
```typescript
export function useFarmCombat(
  playerCharacter: PlayerCharacter,
  culturalZone: CulturalZone,
  onClose: () => void,
  onInitiateEncounter?: (target: any) => void
) {
  const isUnmountingRef = useRef(false);

  const handleInitiateEncounter = useCallback((farmCharacter: FarmFamilyMember) => {
    // Mark component as unmounting to prevent state updates
    isUnmountingRef.current = true;

    // Convert farm family member to proper NPC entity
    const npcEntity = {
      id: `farm_${farmCharacter.id || farmCharacter.name?.replace(/\s+/g, '_') || 'farmer'}`,
      name: farmCharacter.name || 'Farmer',
      type: 'human' as const,
      x: playerCharacter.x || 0,
      y: playerCharacter.y || 0,
      // ... rest of NPC entity construction (lines 203-326)
    };

    // Close farm panel first
    onClose();

    // Initiate combat after brief delay
    setTimeout(() => {
      if (onInitiateEncounter) {
        onInitiateEncounter(npcEntity);
      }
    }, 100);
  }, [onInitiateEncounter, playerCharacter, culturalZone, onClose]);

  return {
    handleInitiateEncounter,
    isUnmountingRef,
  };
}
```

**Lines Extracted**: ~140 from main component

---

### Phase 3: Create Tab Components (7 files)

#### 3.1 `components/farm/FarmPanelContainer.tsx` (~150 lines)
**Purpose**: Main orchestrator component

**Responsibilities**:
- Manage tab state
- Render tab navigation
- Render FarmBanner
- Render PlayerProfileCard sidebar
- Coordinate hooks and pass data to tab components
- Handle close button

```typescript
export const FarmPanelContainer: React.FC<FarmPanelProps> = (props) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Custom hooks
  const farmStateHook = useFarmState(props.tile, props.mapData, props.gameTimeHours);
  const farmFieldsHook = useFarmFields(farmStateHook.farmState, farmStateHook.setFarmState, /* ... */);
  const farmLLMHook = useFarmLLM(farmStateHook.farmState, props.playerCharacter, /* ... */);
  const farmCombatHook = useFarmCombat(props.playerCharacter, farmStateHook.culturalZone, props.onClose, props.onInitiateEncounter);

  // Audio on mount
  useEffect(() => {
    gameSounds.playFishingMusic();
    // ... soundscape logic
    return () => {
      // Cleanup
    };
  }, []);

  if (!farmStateHook.farmState) {
    return <LoadingFarmState />;
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      {/* Transition overlay */}
      {farmStateHook.isTransitioning && <TransitionOverlay />}

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Center panel */}
        <div className="flex-1 flex flex-col">
          {/* Banner */}
          <FarmBanner
            era={farmStateHook.era}
            culturalZone={farmStateHook.culturalZone}
            farmName={dynamicFarmName}
            farmerName={headFarmer?.name || farmStateHook.farmState.family.headOfHousehold}
            // ... other props
          />

          {/* Tab navigation */}
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentFarmTime={farmFieldsHook.currentFarmTime}
            localArea={props.mapData.localArea}
          />

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <FarmOverviewTab
                farmState={farmStateHook.farmState}
                expandedCard={expandedCard}
                setExpandedCard={setExpandedCard}
                // ... other props
              />
            )}
            {activeTab === 'fields' && (
              <FarmFieldsTab
                farmState={farmStateHook.farmState}
                fieldHooks={farmFieldsHook}
                llmHooks={farmLLMHook}
                // ... other props
              />
            )}
            {activeTab === 'family' && (
              <FarmFamilyTab
                farmState={farmStateHook.farmState}
                llmHooks={farmLLMHook}
                combatHooks={farmCombatHook}
                // ... other props
              />
            )}
            {activeTab === 'trade' && (
              <FarmTradeTab
                harvestLedger={farmFieldsHook.harvestLedger}
                validCrops={farmFieldsHook.validCrops}
                onBuy={props.onBuy}
                onSell={props.onSell}
                // ... other props
              />
            )}
            {activeTab === 'advisor' && (
              <FarmAdvisorTab
                llmHooks={farmLLMHook}
                farmState={farmStateHook.farmState}
                mapData={props.mapData}
                season={props.season}
                year={farmStateHook.year}
                useLlm={props.useLlm}
              />
            )}
          </div>
        </div>

        {/* Right sidebar - Player + Time */}
        <FarmRightSidebar
          playerCharacter={props.playerCharacter}
          season={props.season}
          year={farmStateHook.year}
          onProgressTime={props.onProgressTime}
        />
      </div>

      {/* NPCToast for head farmer */}
      {farmLLMHook.farmerToast && (
        <NPCToast
          npc={headFarmer}
          message={farmLLMHook.farmerToast.message}
          type={farmLLMHook.farmerToast.type}
          onClose={() => farmLLMHook.setFarmerToast(null)}
          // ... other props
        />
      )}
    </div>
  );
};
```

**Lines**: ~150 (orchestration only)

---

#### 3.2 `components/farm/FarmOverviewTab.tsx` (~400 lines)
**Purpose**: Overview tab content (lines 1510-1885)

**Responsibilities**:
- Farm info card with name, year, season, prosperity
- Last year performance with expandable details
- Primary crop card (expandable)
- Livestock summary (expandable)
- Field status grid
- Quick actions (Plant All, Water All, Harvest All)

**Props Interface**:
```typescript
interface FarmOverviewTabProps {
  farmState: FarmState;
  dynamicFarmName: string;
  headFarmer: FarmFamilyMember | null;
  year: number;
  season: Season;
  primaryCrop: string;
  prosperityInfo: ProsperityInfo;
  expandedCard: string | null;
  setExpandedCard: (card: string | null) => void;
  plantAll: () => void;
  waterAll: () => void;
  harvestAll: () => void;
  isRefreshingFlavor: boolean;
  refreshFarmFlavor: () => void;
  useLlm: boolean;
}
```

**Component Structure**:
```typescript
export const FarmOverviewTab: React.FC<FarmOverviewTabProps> = ({
  farmState,
  dynamicFarmName,
  headFarmer,
  year,
  season,
  primaryCrop,
  prosperityInfo,
  expandedCard,
  setExpandedCard,
  plantAll,
  waterAll,
  harvestAll,
  isRefreshingFlavor,
  refreshFarmFlavor,
  useLlm,
}) => {
  const toggleCard = (cardId: string) => {
    setExpandedCard(prev => prev === cardId ? null : cardId);
  };

  return (
    <div className="animate-fadeIn space-y-3 max-w-7xl mx-auto">
      {/* Farm Info Card */}
      <FarmInfoCard
        farmName={dynamicFarmName}
        year={year}
        season={season}
        headFarmer={headFarmer}
        prosperityInfo={prosperityInfo}
        lastYearData={farmState.lastYearData}
        expandedCard={expandedCard}
        toggleCard={toggleCard}
      />

      {/* Expandable Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PrimaryCropCard
          primaryCrop={primaryCrop}
          farmState={farmState}
          expandedCard={expandedCard}
          toggleCard={toggleCard}
        />

        <LivestockCard
          livestock={farmState.livestock}
          expandedCard={expandedCard}
          toggleCard={toggleCard}
        />
      </div>

      {/* Field Status Grid */}
      <FieldStatusGrid fields={farmState.fields} />

      {/* Quick Actions */}
      <QuickActionsPanel
        plantAll={plantAll}
        waterAll={waterAll}
        harvestAll={harvestAll}
      />
    </div>
  );
};
```

**Lines**: ~400 (overview tab content + sub-components)

---

#### 3.3 `components/farm/FarmFieldsTab.tsx` (~500 lines)
**Purpose**: Fields/Farm Work tab (lines 1886-2224)

**Responsibilities**:
- Left sidebar with head farmer info, field layout, livestock, household
- Center text adventure interface for farm work
- Field action buttons (plant, water, harvest, manure)
- Worker planning modal
- Resource allocation UI
- Field inspection modal

**Props Interface**:
```typescript
interface FarmFieldsTabProps {
  farmState: FarmState;
  headFarmer: FarmFamilyMember | null;
  fieldHooks: ReturnType<typeof useFarmFields>;
  llmHooks: ReturnType<typeof useFarmLLM>;
  season: Season;
  useLlm: boolean;
  onPlayerStateChange?: (changes: PlayerStateChanges) => void;
}
```

**Component Structure**:
```typescript
export const FarmFieldsTab: React.FC<FarmFieldsTabProps> = ({
  farmState,
  headFarmer,
  fieldHooks,
  llmHooks,
  season,
  useLlm,
  onPlayerStateChange,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div className="animate-fadeIn flex gap-4 h-full">
      {/* Left Sidebar */}
      <div className="w-64 flex flex-col gap-4">
        <HeadFarmerInfo
          headFarmer={headFarmer}
          farmState={farmState}
          expanded={expandedSections.has('head_farmer')}
          onToggle={() => toggleSection('head_farmer')}
        />

        <FieldLayoutInfo
          fields={farmState.fields}
          expanded={expandedSections.has('fields')}
          onToggle={() => toggleSection('fields')}
        />

        <LivestockInfo
          livestock={farmState.livestock}
          expanded={expandedSections.has('livestock')}
          onToggle={() => toggleSection('livestock')}
        />

        <HouseholdInfo
          members={farmState.family.members}
          expanded={expandedSections.has('residents')}
          onToggle={() => toggleSection('residents')}
        />
      </div>

      {/* Center - Farm Work Text Adventure */}
      <div className="flex-1 flex flex-col">
        <FarmWorkAdventure
          farmWorkHistory={llmHooks.farmWorkHistory}
          farmWorkInput={llmHooks.farmWorkInput}
          setFarmWorkInput={llmHooks.setFarmWorkInput}
          isFarmWorkProcessing={llmHooks.isFarmWorkProcessing}
          handleFarmWorkCommand={llmHooks.handleFarmWorkCommand}
          useLlm={useLlm}
        />
      </div>

      {/* Worker Planning Modal */}
      {fieldHooks.showPlanningModal && (
        <WorkerPlanningModal
          fields={farmState.fields}
          fieldPlans={fieldHooks.fieldPlans}
          resources={fieldHooks.resources}
          onFieldAction={fieldHooks.handleFieldAction}
          onResourceAllocation={fieldHooks.handleResourceAllocation}
          onSubmit={fieldHooks.handleWorkerSubmit}
          onClose={() => fieldHooks.setShowPlanningModal(false)}
          isAssessing={fieldHooks.isAssessing}
          workQualityScore={fieldHooks.workQualityScore}
        />
      )}

      {/* Field Inspection Modal */}
      {fieldHooks.inspectedField !== null && (
        <FieldInspectionModal
          field={farmState.fields[fieldHooks.inspectedField]}
          fieldIndex={fieldHooks.inspectedField}
          onClose={() => fieldHooks.setInspectedField(null)}
        />
      )}
    </div>
  );
};
```

**Lines**: ~500 (fields tab + sub-components)

---

#### 3.4 `components/farm/FarmFamilyTab.tsx` (~250 lines)
**Purpose**: Family members and chat interface (lines 2225-2403)

**Responsibilities**:
- Grid of family member cards with portraits
- Health and energy bars
- Skills and traits display
- Member selection and chat interface
- Combat initiation via family members

**Props Interface**:
```typescript
interface FarmFamilyTabProps {
  farmState: FarmState;
  llmHooks: ReturnType<typeof useFarmLLM>;
  combatHooks: ReturnType<typeof useFarmCombat>;
  useLlm: boolean;
}
```

**Component Structure**:
```typescript
export const FarmFamilyTab: React.FC<FarmFamilyTabProps> = ({
  farmState,
  llmHooks,
  combatHooks,
  useLlm,
}) => {
  return (
    <div className="animate-fadeIn space-y-6">
      {/* Family Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {farmState.family.members.map((member) => (
          <FamilyMemberCard
            key={member.id}
            member={member}
            isSelected={llmHooks.selectedMember?.id === member.id}
            onSelect={() => llmHooks.setSelectedMember(member)}
          />
        ))}
      </div>

      {/* Chat Interface */}
      {llmHooks.selectedMember && (
        <FamilyChatInterface
          selectedMember={llmHooks.selectedMember}
          chatInput={llmHooks.chatInput}
          setChatInput={llmHooks.setChatInput}
          chatHistory={llmHooks.chatHistory}
          isChatting={llmHooks.isChatting}
          useHistoricalLanguage={llmHooks.useHistoricalLanguage}
          setUseHistoricalLanguage={llmHooks.setUseHistoricalLanguage}
          handleChat={llmHooks.handleFarmerChat}
          onInitiateCombat={() => combatHooks.handleInitiateEncounter(llmHooks.selectedMember!)}
          useLlm={useLlm}
        />
      )}
    </div>
  );
};
```

**Lines**: ~250 (family tab + chat interface)

---

#### 3.5 `components/farm/FarmTradeTab.tsx` (~150 lines)
**Purpose**: Buy/sell marketplace (lines 2404-2509)

**Responsibilities**:
- Buy seeds grid (culture/era-appropriate crops)
- Sell harvest interface with harvest ledger
- Price calculations

**Props Interface**:
```typescript
interface FarmTradeTabProps {
  harvestLedger: Record<string, number>;
  setHarvestLedger: (ledger: Record<string, number>) => void;
  validCrops: string[];
  seedPriceMultiplier: number;
  onBuy: (itemBaseId: string, price: number) => void;
  onSell: (item: Item, price: number) => void;
}
```

**Component Structure**:
```typescript
export const FarmTradeTab: React.FC<FarmTradeTabProps> = ({
  harvestLedger,
  setHarvestLedger,
  validCrops,
  seedPriceMultiplier,
  onBuy,
  onSell,
}) => {
  const handleSellCrop = useCallback((crop: string, qty: number, total: number) => {
    const item: Item = {
      id: `harvest-${crop}-${Date.now()}`,
      baseId: crop.toUpperCase().replace(/\s+/g, '_'),
      name: crop,
      description: `Freshly harvested ${crop}.`,
      emoji: CROP_EMOJIS[crop] || '🌾',
      rarity: 'Common',
      value: total,
      weight: qty * 0.2,
      stackable: true,
      quantity: qty,
      category: 'Food',
      // ... other item props
    };

    onSell(item, total);

    setHarvestLedger(prev => {
      const next = { ...prev };
      delete next[crop];
      return next;
    });
  }, [onSell, setHarvestLedger]);

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60">
        <h4 className="text-amber-400 font-bold flex items-center gap-2">
          <Store className="w-4 h-4" />
          Market
        </h4>

        {/* Buy Seeds */}
        <BuySeedsSection
          validCrops={validCrops}
          seedPriceMultiplier={seedPriceMultiplier}
          onBuy={onBuy}
        />

        {/* Sell Harvest */}
        <SellHarvestSection
          harvestLedger={harvestLedger}
          onSellCrop={handleSellCrop}
        />
      </div>
    </div>
  );
};
```

**Lines**: ~150 (trade tab + sub-components)

---

#### 3.6 `components/farm/FarmAdvisorTab.tsx` (~200 lines)
**Purpose**: Historical advisor interface (lines 2510-2588)

**Responsibilities**:
- Historical summary generation button
- Advisor chat interface
- Question suggestions
- LLM integration for contextual advice

**Props Interface**:
```typescript
interface FarmAdvisorTabProps {
  llmHooks: ReturnType<typeof useFarmLLM>;
  farmState: FarmState;
  mapData: MapData;
  season: Season;
  year: number;
  useLlm: boolean;
}
```

**Component Structure**:
```typescript
export const FarmAdvisorTab: React.FC<FarmAdvisorTabProps> = ({
  llmHooks,
  farmState,
  mapData,
  season,
  year,
  useLlm,
}) => {
  return (
    <div className="animate-fadeIn space-y-6">
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60">
        <div className="flex items-center justify-between">
          <h4 className="text-amber-400 font-bold flex items-center gap-2">
            <ScrollText className="w-4 h-4" />
            Farm Advisor
          </h4>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CalendarClock className="w-4 h-4" />
            {season} {year} • {mapData.localArea || mapData.continent}
          </div>
        </div>

        {/* Historical Summary */}
        <AdvisorSummarySection
          advisorSummary={llmHooks.advisorSummary}
          isAdvisorBusy={llmHooks.isAdvisorBusy}
          runAdvisorSummary={llmHooks.runAdvisorSummary}
        />

        {/* Advisor Chat */}
        <AdvisorChatInterface
          advisorChat={llmHooks.advisorChat}
          setAdvisorChat={llmHooks.setAdvisorChat}
          advisorLog={llmHooks.advisorLog}
          isAdvisorBusy={llmHooks.isAdvisorBusy}
          runAdvisorChat={llmHooks.runAdvisorChat}
          useLlm={useLlm}
        />
      </div>
    </div>
  );
};
```

**Lines**: ~200 (advisor tab + sub-components)

---

#### 3.7 `components/farm/FarmRightSidebar.tsx` (~150 lines)
**Purpose**: Right sidebar with player card and time controls (lines 2592-2798)

**Responsibilities**:
- Player profile card
- Time & Seasons display
- Progress time buttons (1 month, 3 months, 6 months)
- Seasonal information

**Props Interface**:
```typescript
interface FarmRightSidebarProps {
  playerCharacter: PlayerCharacter;
  season: Season;
  year: number;
  onProgressTime?: (months: number) => void;
}
```

**Component Structure**:
```typescript
export const FarmRightSidebar: React.FC<FarmRightSidebarProps> = ({
  playerCharacter,
  season,
  year,
  onProgressTime,
}) => {
  return (
    <div
      className="keep-dark bg-gradient-to-b from-slate-950 to-black border-l border-slate-800/60 flex flex-col flex-shrink-0"
      style={{ width: 340 }}
    >
      <PlayerProfileCard playerCharacter={playerCharacter} showActions={false} />

      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mx-4" />

      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-base font-semibold text-amber-400 mb-3 flex items-center gap-2">
          <Timer className="w-4 h-4" />
          Time & Seasons
        </h3>

        <SeasonDisplayCard season={season} year={year} />

        {onProgressTime && (
          <TimeProgressButtons onProgressTime={onProgressTime} />
        )}
      </div>
    </div>
  );
};
```

**Lines**: ~150 (sidebar + time controls)

---

### Phase 4: Create Shared Sub-Components (8-10 files)

These are reusable UI components used across multiple tabs:

#### 4.1 `components/farm/shared/FarmInfoCard.tsx` (~80 lines)
- Farm name header with year/season
- Head farmer info
- Prosperity status badge
- Last year performance with expandable details

#### 4.2 `components/farm/shared/FieldStatusGrid.tsx` (~60 lines)
- Grid of field status indicators
- Crop icons and growth stages
- Health percentages

#### 4.3 `components/farm/shared/FamilyMemberCard.tsx` (~100 lines)
- Member portrait
- Health/energy bars
- Skills and traits tags
- Selection highlight

#### 4.4 `components/farm/shared/FarmWorkAdventure.tsx` (~150 lines)
- Text adventure interface
- Command input
- Work history display
- Narrator responses

#### 4.5 `components/farm/shared/WorkerPlanningModal.tsx` (~200 lines)
- Field planning grid
- Resource allocation sliders
- Strategy text input
- Quality assessment display

#### 4.6 `components/farm/shared/NPCToastFixed.tsx` (~100 lines)
- **FIX**: Integrate head farmer dialogue properly
- Remove floating overlay, add inline chat button
- Position within Overview tab, not over entire panel

---

## File Structure Summary

```
components/
├── farm/
│   ├── types.ts                           # Shared types (100 lines)
│   ├── FarmPanelContainer.tsx             # Main orchestrator (150 lines)
│   ├── FarmOverviewTab.tsx                # Overview content (400 lines)
│   ├── FarmFieldsTab.tsx                  # Fields/work content (500 lines)
│   ├── FarmFamilyTab.tsx                  # Family & chat (250 lines)
│   ├── FarmTradeTab.tsx                   # Market (150 lines)
│   ├── FarmAdvisorTab.tsx                 # Advisor (200 lines)
│   ├── FarmRightSidebar.tsx               # Player/time sidebar (150 lines)
│   └── shared/
│       ├── FarmInfoCard.tsx               # (80 lines)
│       ├── PrimaryCropCard.tsx            # (60 lines)
│       ├── LivestockCard.tsx              # (60 lines)
│       ├── FieldStatusGrid.tsx            # (60 lines)
│       ├── QuickActionsPanel.tsx          # (50 lines)
│       ├── FamilyMemberCard.tsx           # (100 lines)
│       ├── FamilyChatInterface.tsx        # (150 lines)
│       ├── FarmWorkAdventure.tsx          # (150 lines)
│       ├── WorkerPlanningModal.tsx        # (200 lines)
│       ├── FieldInspectionModal.tsx       # (80 lines)
│       ├── BuySeedsSection.tsx            # (70 lines)
│       ├── SellHarvestSection.tsx         # (70 lines)
│       ├── AdvisorSummarySection.tsx      # (60 lines)
│       ├── AdvisorChatInterface.tsx       # (80 lines)
│       ├── SeasonDisplayCard.tsx          # (50 lines)
│       ├── TimeProgressButtons.tsx        # (60 lines)
│       └── TabNavigation.tsx              # (80 lines)
│
├── hooks/
│   ├── useFarmState.ts                    # State management (200 lines)
│   ├── useFarmFields.ts                   # Field operations (250 lines)
│   ├── useFarmLLM.ts                      # LLM interactions (300 lines)
│   └── useFarmCombat.ts                   # Combat conversion (150 lines)
│
├── FarmPanel.tsx                          # Wrapper (stays same, 65 lines)
└── FarmPanelImproved.tsx                  # DELETE after migration
```

**Total Files**: 32 files
**Total Lines**: ~4,200 (from 3,239 monolithic + better organization)

---

## Migration Implementation Steps

### Step 1: Create Foundation (Days 1-2)
1. ✅ Create `components/farm/types.ts` with all shared interfaces
2. ✅ Create `hooks/useFarmState.ts` and test with existing component
3. ✅ Create `hooks/useFarmCombat.ts` and test combat flow
4. ✅ Verify no regressions in current FarmPanelImproved

### Step 2: Extract Field Logic (Days 3-4)
1. ✅ Create `hooks/useFarmFields.ts`
2. ✅ Move all field-related state and callbacks
3. ✅ Test plant/water/harvest functionality
4. ✅ Verify resource allocation works

### Step 3: Extract LLM Logic (Days 5-6)
1. ✅ Create `hooks/useFarmLLM.ts`
2. ✅ Move all chat, advisor, and flavor generation
3. ✅ Test dialogue generation
4. ✅ Test advisor chat functionality

### Step 4: Create Tab Components (Days 7-10)
1. ✅ Create `FarmOverviewTab.tsx` - test isolation
2. ✅ Create `FarmFieldsTab.tsx` - test farm work
3. ✅ Create `FarmFamilyTab.tsx` - test chat
4. ✅ Create `FarmTradeTab.tsx` - test buy/sell
5. ✅ Create `FarmAdvisorTab.tsx` - test LLM
6. ✅ Create `FarmRightSidebar.tsx` - test time progression

### Step 5: Create Shared Components (Days 11-13)
1. ✅ Extract all `shared/` components listed above
2. ✅ Test each in isolation with Storybook or dedicated test pages
3. ✅ Verify styling consistency

### Step 6: Build Container (Days 14-15)
1. ✅ Create `FarmPanelContainer.tsx`
2. ✅ Wire all hooks and tabs together
3. ✅ Test full flow end-to-end
4. ✅ Fix any integration issues

### Step 7: Integration & Testing (Days 16-18)
1. ✅ Update `FarmPanel.tsx` to use new `FarmPanelContainer`
2. ✅ Test all game modes (survival, commerce, etc.)
3. ✅ Test all cultural zones and eras
4. ✅ Verify LLM integrations work
5. ✅ Test combat flow from family members
6. ✅ Verify no memory leaks or proxy errors

### Step 8: Polish & Cleanup (Days 19-20)
1. ✅ Fix NPCToast positioning (integrate into Overview tab)
2. ✅ Add Farm Work tab to navigation (currently hidden)
3. ✅ Use crop-specific emojis from CROP_EMOJIS
4. ✅ Remove duplicate loading checks
5. ✅ Delete old `FarmPanelImproved.tsx`
6. ✅ Update documentation

---

## Benefits of Refactoring

### Code Quality
- ✅ **Single Responsibility**: Each component has one clear purpose
- ✅ **Testability**: Hooks and components can be unit tested in isolation
- ✅ **Readability**: ~200-400 lines per file vs 3,239 lines
- ✅ **Reusability**: Shared components can be used elsewhere

### Performance
- ✅ **Lazy Loading**: Tab content only renders when active
- ✅ **Memoization**: Easier to identify and optimize expensive computations
- ✅ **Reduced Re-renders**: Isolated state changes don't trigger full tree updates

### Developer Experience
- ✅ **Faster Comprehension**: New developers can understand individual files quickly
- ✅ **Parallel Work**: Multiple devs can work on different tabs simultaneously
- ✅ **Git Diffs**: Changes are localized to specific files
- ✅ **Debugging**: Easier to isolate issues to specific components

### Bug Fixes Included
- ✅ **Proxy Revocation**: Eliminated by proper state management in hooks
- ✅ **Memory Leaks**: Cleaned up with proper useEffect cleanup
- ✅ **NPCToast Overlap**: Fixed by integrating into Overview tab
- ✅ **Duplicate Checks**: Removed redundant null checks
- ✅ **Farm Work Tab**: Made visible in navigation

---

## Risk Mitigation

### Testing Strategy
1. **Unit Tests**: Test each hook independently
2. **Integration Tests**: Test tab components with mocked hooks
3. **E2E Tests**: Test full farm flow from tile interaction to harvest
4. **Visual Regression**: Screenshot tests for UI consistency

### Rollback Plan
1. Keep old `FarmPanelImproved.tsx` until full migration confirmed
2. Feature flag to switch between old and new implementation
3. Gradual rollout: Test with 10% of sessions first

### Migration Checklist
- [ ] All hooks tested independently
- [ ] All tab components render correctly
- [ ] Container orchestrates all pieces
- [ ] LLM integrations working
- [ ] Combat flow functional
- [ ] Time progression works
- [ ] Buy/sell operations work
- [ ] Farm state persists correctly
- [ ] No console errors
- [ ] No memory leaks
- [ ] Performance metrics acceptable

---

## Timeline: 20 Working Days (4 Weeks)

**Week 1**: Foundation + Field/Combat hooks
**Week 2**: LLM hooks + First 3 tab components
**Week 3**: Remaining tabs + Shared components
**Week 4**: Container integration + Testing + Polish

**Estimated Effort**: 1 senior developer @ 6-8 hours/day

---

## Success Metrics

### Before Refactor
- ❌ 3,239 lines in single file
- ❌ 40+ useState declarations
- ❌ Proxy revocation errors
- ❌ Memory leak workarounds
- ❌ Impossible to unit test

### After Refactor
- ✅ 32 focused files (~100-400 lines each)
- ✅ 4 reusable custom hooks
- ✅ Stable state management (no proxy errors)
- ✅ Clean component lifecycle
- ✅ 100% unit test coverage possible
- ✅ NPCToast positioning fixed
- ✅ Farm Work tab visible
- ✅ Crop-specific emojis used

---

## Appendix A: Component Dependency Graph

```
FarmPanel (wrapper)
  └── FarmPanelContainer (orchestrator)
      ├── useFarmState()
      ├── useFarmFields(farmState)
      ├── useFarmLLM(farmState, playerCharacter, mapData)
      ├── useFarmCombat(playerCharacter, onClose)
      │
      ├── FarmBanner
      ├── TabNavigation
      │
      ├── FarmOverviewTab
      │   ├── FarmInfoCard
      │   ├── PrimaryCropCard
      │   ├── LivestockCard
      │   ├── FieldStatusGrid
      │   └── QuickActionsPanel
      │
      ├── FarmFieldsTab
      │   ├── HeadFarmerInfo
      │   ├── FieldLayoutInfo
      │   ├── LivestockInfo
      │   ├── HouseholdInfo
      │   ├── FarmWorkAdventure
      │   ├── WorkerPlanningModal
      │   └── FieldInspectionModal
      │
      ├── FarmFamilyTab
      │   ├── FamilyMemberCard (x N)
      │   └── FamilyChatInterface
      │
      ├── FarmTradeTab
      │   ├── BuySeedsSection
      │   └── SellHarvestSection
      │
      ├── FarmAdvisorTab
      │   ├── AdvisorSummarySection
      │   └── AdvisorChatInterface
      │
      ├── FarmRightSidebar
      │   ├── PlayerProfileCard
      │   ├── SeasonDisplayCard
      │   └── TimeProgressButtons
      │
      └── NPCToast (conditional)
```

---

## Appendix B: Hook Responsibilities Matrix

| Hook | State Variables | Computed Values | Side Effects | Dependencies |
|------|----------------|-----------------|--------------|--------------|
| **useFarmState** | farmState, isTransitioning, centerWidth, sidebar states | culturalZone, era, year, timeOfDay | Load farm state, manage sidebars, window resize | tile.id, mapData, gameTimeHours |
| **useFarmFields** | selectedField, selectedCrop, harvestLedger, fieldPlans, resources, workQuality | validCrops, fieldActions | Persist fields, update farm state | farmState, culturalZone, era, season |
| **useFarmLLM** | chat states, advisor states, farmWork states, flavor states | - | LLM API calls, dialogue generation | farmState, playerCharacter, mapData, useLlm |
| **useFarmCombat** | isUnmountingRef | - | Close panel, initiate encounter | playerCharacter, culturalZone, onClose |

---

## Appendix C: Props Flow Diagram

```
App.tsx
  │
  ├─> FarmPanel (wrapper)
  │     Props: tile, mapData, playerCharacter, npcs, onClose, onBuy, onSell,
  │            season, gameTimeHours, onProgressTime, onShowEvent, useLlm,
  │            gameDate, onInitiateEncounter, onPlayerStateChange
  │
  └─> FarmPanelContainer
        │
        ├─> Hooks (internal state management)
        │     - useFarmState → farmState, era, year, culturalZone, timeOfDay
        │     - useFarmFields → field operations, harvest ledger
        │     - useFarmLLM → chat, advisor, flavor generation
        │     - useFarmCombat → combat conversion
        │
        ├─> FarmOverviewTab
        │     Props: farmState, year, season, prosperityInfo, quickActions
        │
        ├─> FarmFieldsTab
        │     Props: farmState, fieldHooks, llmHooks, season
        │
        ├─> FarmFamilyTab
        │     Props: farmState, llmHooks, combatHooks
        │
        ├─> FarmTradeTab
        │     Props: harvestLedger, validCrops, onBuy, onSell
        │
        ├─> FarmAdvisorTab
        │     Props: llmHooks, farmState, mapData, season, year
        │
        └─> FarmRightSidebar
              Props: playerCharacter, season, year, onProgressTime
```

---

This plan provides a complete roadmap for refactoring the FarmPanel system into a maintainable, testable, and performant architecture. Each step is designed to be incremental and reversible, with clear success criteria and testing checkpoints.
