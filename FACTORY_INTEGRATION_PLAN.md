# Factory Labor Integration Plan

## Goal
Replace "Commission Crafting" button in factory POI toast with "Ask for work" that triggers NPC contract negotiation, similar to farm system.

## Implementation Steps

### 1. Modify POIToastModal.tsx

Replace the "Commission Crafting" button (line ~1220-1240) with "Ask for work" button that:
- Finds factory manager NPC from nearby NPCs
- Opens NPCToast with factory context
- Shows binary choice flow: "Ask for contract?" → "Agree to contract?"

### 2. Extend NPCToast.tsx

Add factory context support (similar to `isFarmContext`):
- Add `isFactoryContext` prop
- Add `onRequestFactoryWork` callback
- Add `onAcceptFactoryContract` callback
- Use similar LLM decision flow with factory-specific prompts

### 3. Add Factory Panel State

In UIContext or appropriate state manager:
- Add `showFactoryPanel` boolean state
- Add `activeFactoryData` state (factory type, structure, contract)
- Add methods to open/close factory panel

### 4. Render FactoryLaborPanel

When `showFactoryPanel` is true:
- Hide left sidebar
- Show FactoryLaborPanel (like FarmPanelContainer)
- Pass factory data, contract, NPCs
- Handle shift completion and wages

## Code Changes

### A. POIToastModal.tsx (~line 1220)

**BEFORE:**
```typescript
<button
  onClick={() => {
    setCurrentView('processing');
    setProcessingType('factory');
  }}
  disabled={!hasInventoryItem('raw_materials')}
  className={...}
>
  <div>🔨 Commission Crafting</div>
  <div>Have tools and goods crafted from materials</div>
</button>
```

**AFTER:**
```typescript
<button
  onClick={() => {
    // Find factory manager NPC
    const nearbyNpcs = getNearbyNPCs(); // Implement this
    const factoryManager = nearbyNpcs.find(npc =>
      npc.occupation === 'overseer' ||
      npc.occupation === 'factory_manager' ||
      npc.occupation === 'foreman'
    ) || nearbyNpcs[0];

    if (factoryManager) {
      // Show NPC toast with factory contract flow
      setFactoryNegotiationData({
        npc: factoryManager,
        factoryType: poiToastData.structure.factorySubtype,
        factoryName: poiToastData.structure.name
      });
    }
  }}
  className="w-full p-3 rounded-lg transition-all text-left bg-amber-700/50 hover:bg-amber-600/60 border border-amber-600"
>
  <div className="text-white font-medium text-sm mb-1">
    💼 Ask for Work
  </div>
  <div className="text-gray-400 text-xs leading-tight">
    Negotiate a labor contract with the factory overseer
  </div>
</button>
```

### B. Add Factory Contract Flow to NPCToast.tsx

Add new props:
```typescript
interface NPCToastProps {
  // ... existing props
  isFactoryContext?: boolean;
  factoryType?: FactoryType;
  factoryName?: string;
  onRequestFactoryWork?: () => void;
  onAcceptFactoryContract?: (contract: FactoryContract) => void;
}
```

Add factory decision generation (similar to farmer):
```typescript
if (isFactoryContext) {
  // Use generateOverseerDecision (new LLM function)
  const overseerResponse = await generateOverseerDecision(
    overseerNpc,
    input,
    {
      timeOfDay: gameTimeHours,
      playerReputation: playerCharacter?.reputation || 50,
      playerSkills: playerCharacter?.stats,
      factoryType: factoryType,
      workersNeeded: factoryType.workersNeeded,
      dangerLevel: factoryType.workingConditions.dangerLevel
    }
  );

  // Show contract offer
  if (overseerResponse.decisions.offerContract) {
    setContractOffer({
      hourlyWage: overseerResponse.contractTerms.hourlyWage,
      shiftLength: overseerResponse.contractTerms.shiftLength,
      quota: overseerResponse.contractTerms.quota
    });
  }
}
```

### C. Add Factory Panel Rendering

In App.tsx or ModalHub.tsx:
```typescript
import FactoryLaborPanel from './components/factory/FactoryLaborPanel';

// ... in render:
{showFactoryPanel && activeFactoryData && (
  <div className="fixed inset-0 z-50">
    {/* Overlay to hide main game UI */}
    <div className="absolute inset-0 bg-black/50" />

    <FactoryLaborPanel
      factoryType={activeFactoryData.factoryType}
      factoryName={activeFactoryData.factoryName}
      playerCharacter={playerCharacter}
      mapData={mapData}
      nearbyNpcs={activeFactoryData.npcs}
      onClose={() => {
        setShowFactoryPanel(false);
        setActiveFactoryData(null);
      }}
      onWagesEarned={(amount) => {
        // Add coins to inventory
        onCharacterUpdate({
          inventory: {
            ...playerCharacter.inventory,
            coins: (playerCharacter.inventory?.coins || 0) + amount
          }
        });
      }}
      onPlayerStateChange={(changes) => {
        onCharacterUpdate(changes);
      }}
      onTimeAdvance={(hours) => {
        setGameTimeHours(gameTimeHours + hours);
      }}
    />
  </div>
)}
```

### D. UIContext State Additions

Add to UIContext:
```typescript
const [showFactoryPanel, setShowFactoryPanel] = useState(false);
const [activeFactoryData, setActiveFactoryData] = useState<{
  factoryType: FactoryType;
  factoryName: string;
  factoryStructure: TerrainStructure;
  npcs: NpcEntity[];
  contract: FactoryContract | null;
} | null>(null);
```

## Testing Checklist

- [ ] "Ask for work" button appears on factory POI toast
- [ ] Clicking button shows NPCToast with factory manager
- [ ] First choice: "Would you like to ask for work?" (Yes/No)
- [ ] Second choice: "Accept contract terms?" (Yes/No)
- [ ] If accepted, FactoryLaborPanel opens
- [ ] Left sidebar hidden, factory panel full screen
- [ ] Can complete shift and earn wages
- [ ] Wages added to inventory
- [ ] Health/fatigue changes persist
- [ ] Can close factory panel and return to map

## Notes

- Farm system already has similar flow in NPCToast - use as reference
- Factory manager NPCs should spawn automatically with factory structures
- Contract terms should be based on factory type and player reputation
- Consider adding factory manager portrait generation

## Next Steps After Integration

1. Add more factory types (currently only 3)
2. Add more random events per factory type
3. Add LLM text input moments (optional custom actions)
4. Add multi-shift progression (work multiple days)
5. Add achievement system (shift records, safety streaks)
6. Add sound effects (machinery, whistles)
