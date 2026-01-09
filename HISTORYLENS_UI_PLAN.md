# HistoryLens UI Simplification Plan

## Overview

This plan consolidates redundant UI elements, flattens the tab hierarchy, and creates clearer separation between "game world" (left sidebar) and "player world" (right sidebar) contexts.

---

## 1. Sidebar Conceptual Division

### Left Sidebar: "The World"
- Historical context, geography, NPCs, wildlife
- Educational reference material
- Things the player observes and learns about

### Right Sidebar: "The Player"
- Character profile, stats, health
- Inventory and equipment
- Actions and skills
- **Gamelog** (moved from left) - player's personal record
- Narrator/Map tab

---

## 2. Left Sidebar Tab Restructure

### Current Structure (problematic)
```
[History] [Map] [Gamelog]        ← Major tabs
          ↓
[Overview] [Analysis] [NPCs] [Animals]  ← Subtabs (only under Map)
```

### New Structure (flattened)
```
[History] [Overview] [Analysis*] [NPCs] [Animals]
                        ↑
            *Hidden in HistoryLens mode
```

**Changes:**
- Remove "Map" as a parent tab - its children become top-level
- Remove "Gamelog" entirely (moves to right sidebar)
- "Analysis" tab conditionally hidden when `centralMode === 'historylens'`
- Results in single row of 4-5 contextual tabs

### Implementation Details

**File: `components/LeftSidebar.tsx`**

1. Remove `MajorTab` type and `activeMajorTab` state
2. Rename `LeftSidebarTab` to include all tabs:
```typescript
type LeftSidebarTab = 'history' | 'overview' | 'analysis' | 'npcs' | 'animals';
```

3. Conditional rendering for Analysis:
```typescript
const visibleTabs = useMemo(() => {
  const base: LeftSidebarTab[] = ['history', 'overview', 'npcs', 'animals'];
  if (centralMode !== 'historylens') {
    // Insert 'analysis' after 'overview'
    base.splice(2, 0, 'analysis');
  }
  return base;
}, [centralMode]);
```

4. Remove the two-row tab rendering, use single row:
```tsx
<div className="tab-strip-flat">
  {visibleTabs.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`tab-flat ${activeTab === tab.id ? 'is-active' : ''}`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

---

## 3. Right Sidebar Tab Restructure

### Current Structure
```
[Narrator] [Inventory]          ← In map mode
[Map] [Inventory]               ← In HistoryLens mode
```

### New Structure
```
[Narrator] [Inventory] [Journal]    ← In map mode
[Map] [Inventory] [Journal]         ← In HistoryLens mode
```

**Changes:**
- Add "Journal" tab (renamed from Gamelog for clarity)
- Contains the game log entries, player notes, collected sources

### Implementation Details

**File: `components/RightSidebar.tsx`**

1. Update tab type:
```typescript
type RightSidebarTab = 'narrator' | 'inventory' | 'journal' | 'map';
```

2. Import and render GamelogPanel:
```typescript
import GamelogPanel from './GamelogPanel';

// In render:
{activeTab === 'journal' && (
  <div className="h-full animate-fadeIn">
    <GamelogPanel entries={gameLog} />
  </div>
)}
```

3. Update tab buttons to include Journal (always visible).

---

## 4. Left Sidebar Header Simplification

### Current Header Card (in HistoryLens mode - redundant)
```
┌─────────────────────────────────┐
│ Date          │ Time            │
│ Mar 9, 109 BCE│ 19:53          │
│ Spring        │ Dusk           │
├───────────────┼─────────────────┤
│ Zone          │ Climate         │
│ Southeast Asia│ Tropical        │
├───────────────┼─────────────────┤
│ Region        │ Map Area        │
│ Indochina Int.│ Chao Phraya    │
└─────────────────────────────────┘
```

### New Behavior

**In Map Mode:** Keep header card as-is (it's the primary context display)

**In HistoryLens Mode:**
- Hide or collapse the header card entirely
- Context moves to HistoryLens panel header (see Section 5)
- Left sidebar starts directly with tabs

### Implementation

```typescript
// In LeftSidebar.tsx
const { centralMode } = useUI();

// Conditionally render header card
{centralMode !== 'historylens' && (
  <div className="p-4 rounded-xl surface-card mb-4 relative">
    {/* existing header card content */}
  </div>
)}
```

---

## 5. HistoryLens Header Enhancement

### Current Header (lines 320-350 of HistoryLensPanel.tsx)
```
┌─────────────────────────────────────────────────────────────────┐
│ 📜 │ HISTORY LENS              │ [Transparency] [Map]          │
│    │ Unknown location          │                               │
└─────────────────────────────────────────────────────────────────┘
```
Problems:
- Shows "Unknown location" (data not flowing correctly)
- Date/time removed in current version (was there before)
- Duplicates info that's also in left sidebar header

### New Header Design
```
┌─────────────────────────────────────────────────────────────────┐
│ 📜 HISTORY LENS                      [Transparency] [Map]       │
├─────────────────────────────────────────────────────────────────┤
│ Chao Phraya Basin, Indochina       │  March 9, 109 BCE         │
│ Southeast Asia • Tropical • Spring │  19:53 Dusk               │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Details

**File: `components/HistoryLensPanel.tsx`**

Replace lines 320-350 (current header) with enriched version that matches existing typography:

```tsx
{/* Header - using existing Avenir Next pattern */}
<div
  className="px-6 py-4 bg-[var(--surface-card-bg)]/80 backdrop-blur-md border-b border-white/5"
  style={{ fontFamily: "'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif" }}
>
  {/* Title row */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-slate-900/30 border border-white/10 flex items-center justify-center text-lg shadow-inner">
        📜
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-text-secondary">
        History Lens
      </span>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowTransparency(true)}
        className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-white/10 text-text-secondary hover:text-text-primary hover:border-white/30 transition-colors bg-slate-900/30"
      >
        Transparency
      </button>
      <button
        onClick={() => setShowMap(prev => !prev)}
        className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-white/10 text-text-secondary hover:text-text-primary hover:border-white/30 transition-colors bg-slate-900/30"
        aria-pressed={showMap}
      >
        {showMap ? 'Hide Map' : 'Map'}
      </button>
    </div>
  </div>

  {/* Context strip - two columns */}
  <div className="grid grid-cols-2 gap-6">
    {/* Location column */}
    <div>
      <p className="text-base font-semibold text-text-primary leading-tight">
        {mapData?.localArea || 'Unknown Area'}
        {currentRegion && currentRegion !== mapData?.localArea && `, ${currentRegion}`}
      </p>
      <p className="text-[11px] text-text-secondary mt-1 flex items-center gap-1.5">
        <span>{formatZoneName(currentZone)}</span>
        <span className="text-text-muted">•</span>
        <span className="capitalize">{mapData?.climate?.toLowerCase() || 'unknown'}</span>
        <span className="text-text-muted">•</span>
        <span className="capitalize">{mapData?.season?.toLowerCase() || 'unknown'}</span>
      </p>
    </div>

    {/* Date/Time column */}
    <div className="text-right">
      <p className="text-base font-semibold text-text-primary leading-tight">
        {formattedFullDate}
      </p>
      <p className="text-[11px] text-text-secondary mt-1">
        {formattedTime} <span className="capitalize">{currentTimeOfDay?.toLowerCase()}</span>
      </p>
    </div>
  </div>
</div>
```

**Add helper function and data sources:**

```tsx
// Add to component, before return:
const { currentTimeOfDay, season } = useGame();
const { localArea } = useMap();

// Helper to format zone names nicely
const formatZoneName = (zone: string | undefined) => {
  if (!zone) return 'Unknown';
  return zone
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace('Mena', 'MENA')
    .replace('Pre Columbian', 'Pre-Columbian');
};

// Format full date (add to component)
const formattedFullDate = useMemo(() => {
  if (!gameDate) return 'Unknown date';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const month = monthNames[gameDate.month - 1] || 'Unknown';
  const day = gameDate.day;
  const year = gameDate.year < 0
    ? `${Math.abs(gameDate.year)} BCE`
    : `${gameDate.year} CE`;
  return `${month} ${day}, ${year}`;
}, [gameDate]);
```

**Data flow fixes:**
- `mapData?.localArea` - already available from useMap()
- `currentZone` - from useGame() (was showing "Unknown" due to not being used)
- `currentRegion` - from useGame()
- `mapData?.climate`, `mapData?.season` - from useMap()
- `gameDate` - from useGame()
- `formattedTime` - from useGame()
- `currentTimeOfDay` - add to useGame() destructure

---

## 6. Typography & Visual Polish

### Font Strategy

**Align with HistoryLensPanel's existing pattern:**

HistoryLensPanel already uses a deliberate two-font system:
- **Narrative/Content**: `'Iowan Old Style', 'Palatino', 'Garamond', 'Times New Roman', serif`
- **UI Chrome**: `'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif`

We extend this to the left sidebar for visual consistency:

| Element | Font Stack | Weight | Size | Other |
|---------|------------|--------|------|-------|
| Left sidebar tabs | Avenir Next | 600 | 11px | uppercase, tracking-[0.15em] |
| Left sidebar section headers | Avenir Next | 700 | 11px | uppercase, tracking-[0.25em] |
| Left sidebar body text | System default | 400 | 14px | — |
| Left sidebar metadata | Avenir Next | 500 | 11px | — |
| HistoryLens narrative | Iowan Old Style | 400 | 17px | leading-[1.75] |
| HistoryLens UI | Avenir Next | 600 | 11px | (already implemented) |
| Right sidebar | Current | — | — | (unchanged) |

### Implementation

**No new fonts needed** - Avenir Next is a system font on macOS and iOS, with Trebuchet MS as Windows/Linux fallback.

**Add to `globals.css`:**

```css
/* Shared UI font variable (matches HistoryLensPanel) */
:root {
  --font-ui: 'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif;
  --font-narrative: 'Iowan Old Style', 'Palatino', 'Garamond', 'Times New Roman', serif;
}

/* Left sidebar typography alignment */
.sidebar-left {
  font-family: var(--font-ui);
}

.sidebar-left .tab-flat {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.sidebar-left .section-header {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

/* Pill-style chips (matching HistoryLens mobile chips) */
.info-chip {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.3);
  color: var(--text-secondary);
}

/* Flattened tab strip */
.tab-strip-flat {
  display: flex;
  gap: 2px;
  padding: 4px;
  background: rgba(15, 23, 42, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-flat {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.15s ease;
  border: none;
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.tab-flat:hover {
  background: var(--surface-card-bg);
  color: var(--text-primary);
}

.tab-flat.is-active {
  background: var(--surface-card-bg);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
```

**Key visual patterns from HistoryLensPanel to replicate:**

1. **Small labels**: `text-[11px] uppercase tracking-[0.25em] text-text-secondary`
2. **Primary info**: `text-base text-text-primary font-semibold`
3. **Pill buttons**: `rounded-full border border-white/10 bg-slate-900/30`
4. **Hover states**: `hover:text-text-primary hover:border-white/30 transition-colors`
5. **Backdrop blur on headers**: `bg-[var(--surface-card-bg)]/80 backdrop-blur-md`

### Visual Polish Details

**1. Tab hover states:**
- Subtle background shift (not just color change)
- Micro-animation (transform: translateY(-1px) on hover)

**2. Active tab indicator:**
- Subtle bottom border or pill background
- Slightly elevated shadow

**3. Section dividers:**
- Replace hard lines with subtle gradients:
```css
.section-divider {
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    var(--border-subtle) 20%,
    var(--border-subtle) 80%,
    transparent
  );
  margin: 16px 0;
}
```

**4. Card depth:**
- Consistent border-radius (12px for cards, 8px for nested elements)
- Subtle inner shadow on content areas:
```css
.content-well {
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.06);
}
```

**5. Spacing rhythm:**
- Use 4px base unit consistently
- Padding: 12px (small), 16px (medium), 24px (large)
- Gaps: 8px (tight), 12px (normal), 16px (loose)

---

## 7. HistoryLens Panel Layout Improvements

### Suggested actions redesign:
```tsx
<div className="suggested-actions">
  <span className="text-xs text-text-muted uppercase tracking-wide mb-2 block">
    Suggested Actions
  </span>
  <div className="flex flex-wrap gap-2">
    {suggestedActions.slice(0, 4).map((action, i) => (
      <button
        key={i}
        onClick={() => setInputValue(action)}
        className="suggested-action-btn"
      >
        <kbd className="text-[10px] opacity-60 mr-1.5">{i + 1}</kbd>
        {action}
      </button>
    ))}
  </div>
</div>
```

With keyboard shortcuts (1-4) to select suggested actions.

---

## 8. File Changes Summary

| File | Changes |
|------|---------|
| `components/LeftSidebar.tsx` | Remove major tabs, flatten to single row, hide header in HistoryLens mode, hide Analysis tab in HistoryLens mode |
| `components/RightSidebar.tsx` | Add Journal tab, import GamelogPanel |
| `components/HistoryLensPanel.tsx` | Enriched header with full context, keyboard shortcuts for suggestions |
| `styles/globals.css` | Add `.tab-strip-flat`, `.tab-flat`, typography variables |
| `contexts/UIContext.tsx` | Ensure `centralMode` is accessible where needed |

---

## 9. Implementation Order

1. **Phase 1: Structural changes**
   - Move Gamelog to right sidebar
   - Flatten left sidebar tabs
   - Conditionally hide Analysis tab

2. **Phase 2: HistoryLens header**
   - Add enriched context display
   - Hide left sidebar header card in HistoryLens mode
   - Fix location data flow

3. **Phase 3: Visual polish**
   - Apply Avenir Next font stack to left sidebar UI elements
   - Implement new `.tab-strip-flat` and `.tab-flat` styles
   - Improve suggested actions with keyboard shortcuts

4. **Phase 4: Testing**
   - Verify all data sources populate correctly
   - Test mode switching (map ↔ HistoryLens)
   - Mobile responsiveness check

---

## 10. Visual Mockup (ASCII)

### Map Mode
```
┌─────────────────────┬───────────────────────────────────┬─────────────────────┐
│ LEFT SIDEBAR        │         MAP VIEWPORT              │ RIGHT SIDEBAR       │
│                     │                                   │                     │
│ ┌─────────────────┐ │  ┌─────────────────────────────┐  │ ┌─────────────────┐ │
│ │ Date/Time/Zone  │ │  │                             │  │ │ [Portrait]      │ │
│ │ Climate/Region  │ │  │                             │  │ │ Name, Stats     │ │
│ └─────────────────┘ │  │        Map Tiles            │  │ │ Health/Fatigue  │ │
│                     │  │                             │  │ └─────────────────┘ │
│ [Hist][Ovw][Ana][NPC][Ani] │                        │  │ [Actions 1-4]       │
│ ─────────────────── │  │                             │  │                     │
│                     │  │                             │  │ [Narr][Inv][Journal]│
│ Tab content...      │  └─────────────────────────────┘  │ ───────────────────│
│                     │                                   │ Tab content...      │
└─────────────────────┴───────────────────────────────────┴─────────────────────┘
```

### HistoryLens Mode
```
┌─────────────────────┬───────────────────────────────────┬─────────────────────┐
│ LEFT SIDEBAR        │      HISTORY LENS PANEL           │ RIGHT SIDEBAR       │
│                     │                                   │                     │
│ (no header card)    │ ┌─────────────────────────────┐  │ ┌─────────────────┐ │
│                     │ │ 📜 HISTORY LENS    [Map]    │  │ │ [Portrait]      │ │
│ [Hist][Ovw][NPC][Ani] │ │ Chao Phraya │ Mar 9, 109 BCE│ │ │ Name, Stats     │ │
│ ─────────────────── │ │ SE Asia     │ 19:53 Dusk    │  │ │ Health/Fatigue  │ │
│                     │ └─────────────────────────────┘  │ └─────────────────┘ │
│ Tab content...      │                                   │ [Actions 1-4]       │
│ (History tab,       │  "The great river flows..."       │                     │
│  Overview, NPCs,    │                                   │ [Map][Inv][Journal] │
│  Animals)           │  [go east] [go west] [rest]       │ ───────────────────│
│                     │  ┌─────────────────────────┐      │ Tab content...      │
│                     │  │ Type your action...     │      │                     │
└─────────────────────┴──┴─────────────────────────┴──────┴─────────────────────┘
```

---

## Notes

- The "Analysis" tab hiding in HistoryLens mode is because terrain composition, strategic lenses, and mineral deposits are map-specific tools that don't apply to text-based play
- "Journal" rename from "Gamelog" emphasizes the player-centric, personal record nature
- Avenir Next chosen to match HistoryLensPanel's existing UI typography; it's a system font on macOS/iOS with Trebuchet MS fallback for Windows/Linux—no external font loading required
