# Next Priorities & Bug Review - October 16, 2025

## Executive Summary

After completing the work offer system fixes, here's a comprehensive review of what needs attention next.

---

## 🔴 CRITICAL: TypeScript Errors (191 total)

The codebase has **191 TypeScript compilation errors** that need fixing. These fall into several categories:

### **Category 1: Health Type Confusion (Most Common)**
**Problem:** `health` property is sometimes `number`, sometimes `CharacterHealth` object
**Impact:** Type errors throughout combat system
**Files Affected:**
- `components/CombatModal.tsx` - 20+ errors
- Multiple NPC/character files

**Example Error:**
```typescript
Type 'number' is not assignable to type 'CharacterHealth'.
```

**Recommendation:**
1. Audit all `health` usages to standardize on ONE type
2. If `CharacterHealth` is the standard, create conversion utilities
3. Update type definitions to match actual usage

**Estimated Fix Time:** 4-6 hours

---

### **Category 2: Missing PlayerCharacter Properties**
**Problem:** Properties used but not defined in type
**Location:** `App.tsx` lines 1185-1190

**Missing Properties:**
- `distanceTraveled: number`
- `questsCompleted: number`
- `npcsMetTotal: number`
- `achievements: any[]`

**Example Error:**
```typescript
App.tsx(1185,51): error TS2339: Property 'distanceTraveled' does not exist on type 'PlayerCharacter'.
```

**Recommendation:**
1. Add properties to `PlayerCharacter` type definition
2. Initialize in character generation
3. Update tracking logic

**Estimated Fix Time:** 1-2 hours

---

### **Category 3: String vs Enum Type Mismatches**
**Problem:** Enums expected but strings passed
**Files Affected:**
- `components/BottomPanel.tsx`
- `components/CampModal.tsx`
- `components/CityModal.tsx`

**Example Errors:**
```typescript
Argument of type 'string' is not assignable to parameter of type 'CulturalZone'.
Argument of type 'string' is not assignable to parameter of type 'TimeOfDay'.
```

**Recommendation:**
1. Add type assertions: `as CulturalZone`
2. OR validate/parse strings before passing
3. OR update function signatures to accept `string`

**Estimated Fix Time:** 2-3 hours

---

### **Category 4: Missing StatusEffect Types**
**Problem:** `StatusEffectType` enum missing values used in code
**Location:** `components/CombatModal.tsx:306`

**Missing Values:**
- `feeling_cold`
- `feeling_hot`
- `feeling_wet`

**Example Error:**
```typescript
Type '{ poison: string; burn: string; ... }' is missing the following properties from type 'Record<StatusEffectType, string>': feeling_cold, feeling_hot, feeling_wet
```

**Recommendation:**
1. Add missing status effects to enum
2. Add corresponding display strings
3. Implement effect logic if needed

**Estimated Fix Time:** 30 minutes - 1 hour

---

### **Category 5: JSX in <style> Tags**
**Problem:** React doesn't support `jsx` prop on `<style>` elements
**Files Affected:**
- `components/CelestialBodies.tsx`
- `components/CloudSystem.tsx`

**Example Error:**
```typescript
Property 'jsx' does not exist on type 'DetailedHTMLProps<StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>'.
```

**Recommendation:**
Remove `jsx` prop from all `<style>` tags:
```typescript
// BEFORE
<style jsx>{`...`}</style>

// AFTER
<style>{`...`}</style>
```

**Estimated Fix Time:** 15 minutes

---

## 🟡 MEDIUM: Features Mentioned in TODOs

### **1. Quest Unlocking System**
**Location:** `services/questService.ts:1678`
```typescript
// TODO: Implement quest unlocking system
```

**Status:** Not implemented
**Description:** System for progressive quest unlocking based on completion
**Priority:** Medium
**Estimated Work:** 6-8 hours

---

### **2. Follow-up Quests**
**Location:** `services/questService.ts:1426`
```typescript
// TODO: Generate and add follow-up quests
```

**Status:** Not implemented
**Description:** Auto-generate quests that follow completed quests
**Priority:** Medium
**Estimated Work:** 4-6 hours

---

### **3. LLM NPC Generation in Roguelike**
**Location:** `components/RoguelikeDisplayEnhanced.tsx:2717`
```typescript
// TODO: Add async LLM NPC generation in separate effect
```

**Status:** Not implemented
**Description:** Procedural NPC generation for mining roguelike
**Priority:** Low
**Estimated Work:** 3-4 hours

---

### **4. Arrest Scenario Trigger**
**Location:** `components/EncounterModalUpdated.tsx:908`
```typescript
// TODO: Trigger arrest scenario
```

**Status:** Not implemented
**Description:** Player can be arrested by guards/authorities
**Priority:** Medium
**Estimated Work:** 4-6 hours

---

### **5. LLM Quest Generation**
**Location:** `services/unifiedQuestPipeline.ts:509`
```typescript
// TODO: Implement proper LLM quest generation
```

**Status:** Not implemented
**Description:** Use LLM to generate dynamic quests
**Priority:** Low (have basic quest system)
**Estimated Work:** 8-10 hours

---

### **6. Holy Site Reputation Check**
**Location:** `services/holySiteEconomyService.ts:406`
```typescript
// TODO: Check reputation when system is implemented
```

**Status:** Reputation system exists, just not integrated here
**Priority:** Low
**Estimated Work:** 1-2 hours

---

### **7. Torch/Tinderbox Check**
**Location:** `services/skillService.ts:789`
```typescript
// TODO: Later add check for torch/tinderbox in inventory
```

**Status:** Not implemented
**Description:** Fire-starting skill should require tools
**Priority:** Low
**Estimated Work:** 1-2 hours

---

### **8. Holy Place Interior Layout Fix**
**Location:** `generation/interiorMap/architecturalLayouts.ts:1052`
```typescript
// TODO: Fix holyPlaceInteriorIntegration.ts to generate valid connected layouts
```

**Status:** Known bug
**Description:** Holy place interiors may generate disconnected rooms
**Priority:** Medium
**Estimated Work:** 3-4 hours

---

## 🟢 LOW PRIORITY: Minor TODOs

### **9. Play Time Tracking**
**Location:** `components/ModalHub.tsx:184`
```typescript
playTime: 0 // TODO: Track actual play time
```

**Priority:** Low
**Estimated Work:** 30 minutes

---

### **10. Day Tracking for Events**
**Location:** `hooks/useEventSystem.ts:331`
```typescript
return false; // TODO: Implement day tracking
```

**Priority:** Low
**Estimated Work:** 1-2 hours

---

### **11. Victory Modal**
**Location:** `hooks/useEventSystem.ts:344`
```typescript
// TODO: Show victory modal
```

**Priority:** Low
**Estimated Work:** 2-3 hours

---

### **12. Pause Functionality**
**Location:** `hooks/useEventSystem.ts:196`
```typescript
// TODO: Implement pause functionality when game loop is added
```

**Priority:** Low
**Estimated Work:** 1-2 hours

---

## 📊 Priority Matrix

| Priority | Item | Impact | Effort | Status |
|----------|------|--------|--------|--------|
| 🔴 **HIGHEST** | Fix TypeScript Health errors | High | 4-6h | Not started |
| 🔴 **HIGH** | Add missing PlayerCharacter properties | Medium | 1-2h | Not started |
| 🔴 **HIGH** | Fix string vs enum type errors | Medium | 2-3h | Not started |
| 🟡 **MEDIUM** | Add missing StatusEffect types | Low | 1h | Not started |
| 🟡 **MEDIUM** | Fix holy place layout generation | Medium | 3-4h | Not started |
| 🟡 **MEDIUM** | Implement arrest scenario | Medium | 4-6h | Not started |
| 🟡 **MEDIUM** | Quest unlocking system | Low | 6-8h | Not started |
| 🟢 **LOW** | Fix JSX in style tags | Low | 15min | Not started |
| 🟢 **LOW** | All other TODOs | Varies | Varies | Not started |

---

## 🎯 Recommended Action Plan

### **Phase 1: TypeScript Stability (1-2 days)**
1. Fix health type confusion (4-6h)
2. Add missing PlayerCharacter properties (1-2h)
3. Fix string vs enum errors (2-3h)
4. Add missing StatusEffect types (1h)
5. Fix JSX style props (15min)

**Goal:** Clean TypeScript compilation

---

### **Phase 2: Known Bugs (2-3 days)**
1. Fix holy place interior layouts (3-4h)
2. Integrate reputation check in holy sites (1-2h)
3. Review and fix any other functional bugs

**Goal:** All core features working correctly

---

### **Phase 3: Feature Completion (1 week)**
1. Implement arrest scenario (4-6h)
2. Add quest unlocking system (6-8h)
3. Add follow-up quests (4-6h)
4. Add torch/tinderbox requirements (1-2h)
5. Add play time tracking (30min)

**Goal:** Complete partially implemented features

---

### **Phase 4: Enhancement (Optional)**
1. LLM quest generation (8-10h)
2. LLM NPC generation for roguelike (3-4h)
3. Day tracking for events (1-2h)
4. Victory modal (2-3h)
5. Pause functionality (1-2h)

**Goal:** Polish and enhancements

---

## 🔍 Deep Dive: Health Type Issue

This is the **most critical** issue affecting the codebase.

### **Current Situation:**

**In `types/index.ts`:**
```typescript
export interface PlayerCharacter {
  health: CharacterHealth; // Object
  // ...
}

export interface NpcEntity {
  health: CharacterHealth; // Object
  // ...
}

export interface CharacterHealth {
  current: number;
  max: number;
  currentDiseases: ActiveDisease[];
  immunities: string[];
}
```

**But in `components/CombatModal.tsx`:**
```typescript
// Line 77
const [opponent, setOpponent] = useState<EncounterableEntity>({
  ...combatant,
  health: combatant.health as number, // ❌ Cast to number!
  statusEffects: []
});
```

### **Root Cause:**

Combat system expects `health` to be a `number`, but type system says it's `CharacterHealth` object.

### **Solutions:**

**Option A: Change Combat to Use CharacterHealth**
```typescript
// Everywhere in combat
const currentHealth = opponent.health.current; // Instead of opponent.health
const maxHealth = opponent.health.max;

// Update health
setOpponent(prev => ({
  ...prev,
  health: {
    ...prev.health,
    current: Math.max(0, prev.health.current - damage)
  }
}));
```

**Option B: Separate Combat Health from Character Health**
```typescript
// Combat uses simple number
interface CombatEntity extends EncounterableEntity {
  health: number; // Override to number
  maxHealth: number;
}

// Convert when entering combat
const combatEntity: CombatEntity = {
  ...npc,
  health: npc.health.current,
  maxHealth: npc.health.max
};

// Convert back when exiting
npc.health = {
  ...npc.health,
  current: combatEntity.health
};
```

**Option C: Update Type Definition**
```typescript
// Allow both
type Health = number | CharacterHealth;

export interface PlayerCharacter {
  health: Health; // Can be either
}
```

### **Recommendation: Option B**

Why:
- Clean separation of concerns
- Combat system doesn't need disease data
- Easier to work with in combat calculations
- Type safe

**Estimated Implementation:**
1. Create `CombatEntity` interface (30min)
2. Add conversion utilities (1h)
3. Update CombatModal (2-3h)
4. Test thoroughly (1h)

**Total: 4-5 hours**

---

## 💡 Quick Wins (Under 1 Hour)

These can be done quickly to make immediate progress:

1. **Fix JSX style props** (15 minutes)
2. **Add missing StatusEffect types** (30 minutes)
3. **Add play time tracking** (30 minutes)
4. **Integrate holy site reputation** (45 minutes)
5. **Add torch/tinderbox check** (45 minutes)

**Total Quick Wins:** 3 hours for 5 fixes

---

## 🚀 Next Steps

**Immediate (Today):**
1. Choose approach for health type issue
2. Start fixing TypeScript errors
3. Knock out quick wins

**This Week:**
1. Complete Phase 1 (TypeScript stability)
2. Start Phase 2 (known bugs)

**Next Week:**
1. Complete Phase 2
2. Start Phase 3 (feature completion)

---

## 📝 Notes

### **Production Readiness:**

**Currently Production Ready:**
- ✅ Work offer system
- ✅ Disease system
- ✅ Map generation
- ✅ NPC interactions
- ✅ Basic quest system
- ✅ Inventory system
- ✅ Crafting system

**NOT Production Ready:**
- ❌ TypeScript errors (would fail build in strict mode)
- ❌ Combat health tracking (type confusion)
- ❌ Holy place interiors (may be disconnected)

### **Overall Assessment:**

**Code Quality:** 7/10
- Good architecture
- Well-documented
- Some type safety issues

**Feature Completeness:** 8/10
- Most features implemented
- Some TODOs for enhancements
- Core gameplay functional

**Bug Severity:** 6/10
- No critical game-breaking bugs
- Many type errors (compilation issue)
- Some layout generation issues

**Recommendation:** Focus on TypeScript errors first, then polish existing features before adding new ones.

---

**Review Date:** October 16, 2025
**Reviewer:** Claude (Sonnet 4.5)
**Status:** Ready for developer review
