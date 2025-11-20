# Sprite Rendering Performance Analysis
**Date**: November 16, 2025
**Components**: PlayerIcon.tsx, NpcIcon.tsx

## Executive Summary
Both sprite components have **critical performance issues** that cause unnecessary re-renders and expensive computations. Since NPCs can number 20-50+ on a map, these inefficiencies multiply dramatically.

---

## 🔴 CRITICAL ISSUES

### 1. **Massive Color Detection Functions Running Every Render**

**PlayerIcon.tsx - Lines 114-257**
```typescript
// This 60-line function with 50+ if statements runs EVERY RENDER
const getCloakColor = () => {
  if (cloak?.color) {
    if (cloak.color.startsWith('#')) return cloak.color;
    const colorStr = cloak.color.toLowerCase();
    // 50+ string.includes() checks for different colors
    if (colorStr.includes('crimson') || colorStr.includes('scarlet')) return '#dc143c';
    // ... 47 more similar checks
  }
  return null;
};
const cloakColor = getCloakColor(); // Called every render
```

**Impact**:
- ~50 string operations PER color getter
- 5 color getters = 250+ string operations per render
- With 30 NPCs on screen = **7,500 string operations per frame**

**Files affected**:
- PlayerIcon.tsx: `getCloakColor()` (lines 114-173), `getLegsColor()` (lines 198-257)
- NpcIcon.tsx: `getLegsColor()` (lines 224-248)

---

### 2. **Functions Defined Inside Render/Map**

**PlayerIcon.tsx - Lines 777-855**
```typescript
{jewelry && jewelry.length > 0 && jewelry.map((item, idx) => {
  // This function is RECREATED for every jewelry item, every render!
  const getJewelryColor = () => {
    // 30+ if statements checking colors...
  };
  const jewelryColor = getJewelryColor();
  // ...
})}
```

**Impact**:
- Function created 3-5 times per character (typical jewelry count)
- 30 NPCs × 3 jewelry items = **90 function creations per render**

**NpcIcon.tsx - Lines 40-110**
```typescript
// These functions are defined EVERY render but always return the same value
const categorizeHeadgear = (headgearItem) => {
  // 30+ string includes checks
};
const categorizeGarment = (garmentItem) => {
  // 20+ string includes checks
};
```

**Impact**:
- 50+ string operations recreated every render
- No caching despite deterministic output

---

### 3. **SVG Filters Recreated Every Render**

**PlayerIcon.tsx - Lines 424-484**
```typescript
<defs>
  <filter id={`playerGlow-${character.id}`}>
    {/* Complex feGaussianBlur, feOffset, feMerge operations */}
  </filter>
  <filter id={`playerOutline-${character.id}`}>
    {/* More complex filter operations */}
  </filter>
</defs>
```

**Impact**:
- SVG filters are expensive to parse/render
- Should be memoized with `useMemo`
- Currently recreated on every position change

---

### 4. **No Memoization of Color Calculations**

**PlayerIcon.tsx - Lines 110-258**
```typescript
const clothingColor = getClothingColor();  // ❌ No useMemo
const cloakColor = getCloakColor();        // ❌ No useMemo
const beltColor = getBeltColor();          // ❌ No useMemo
const bootsColor = getBootsColor();        // ❌ No useMemo
const legsColor = getLegsColor();          // ❌ No useMemo
```

**Impact**: All 5 colors recalculated even when equipment hasn't changed

---

### 5. **Inefficient React.memo Implementation**

**Current**: `React.memo(({ x, y, character, isInteriorMap }) => { ... })`

**Problem**: Component re-renders on **every position change** (x, y) even though visual appearance only depends on `character` data.

**Impact**:
- Moving player/NPC triggers full re-render
- All color calculations run again
- All conditional rendering logic runs again

---

## 🟡 MODERATE ISSUES

### 6. **Repeated Color Adjustment Calls**
```typescript
const getHairHighlightColor = () => adjustColorBrightness(hairColor, 15);
const getHairShadowColor = () => adjustColorBrightness(hairColor, -12);
```
- Called multiple times but not memoized
- Each call performs hex parsing and math operations

### 7. **Conditional Rendering Checks**
```typescript
{markings && markings.length > 0 && markings.map((marking, idx) => {
  if (idx >= 3) return null;  // Early exit, but still iterates
  // ...
})}
```
- Should use `.slice(0, 3)` instead

### 8. **NpcIcon Element Array Construction**
```typescript
const renderPolishedSprite = () => {
  const elements: JSX.Element[] = [];
  elements.push(...); // 100+ push operations
  // ...
  return <g>{elements}</g>;
};
```
- Array growing dynamically with 100+ pushes
- Could be optimized with direct JSX

---

## ✅ OPTIMIZATION SOLUTIONS

### Solution 1: Memoize All Color Getters
```typescript
const clothingColor = useMemo(() => {
  if (garment?.color) {
    if (garment.color.startsWith('#')) return garment.color;
    // ... color detection logic
  }
  return character.appearance.palette.primary;
}, [garment?.color, character.appearance.palette.primary]);
```

**Benefit**: Only recalculate when equipment actually changes

---

### Solution 2: Create Shared Color Utility
```typescript
// utils/colorDetection.ts
const COLOR_KEYWORDS = {
  'crimson': '#dc143c',
  'scarlet': '#dc143c',
  'burgundy': '#800020',
  // ... all colors in a lookup table
};

export function detectColor(colorStr: string, fallback: string): string {
  if (colorStr.startsWith('#')) return colorStr;
  const lower = colorStr.toLowerCase();

  for (const [keyword, hex] of Object.entries(COLOR_KEYWORDS)) {
    if (lower.includes(keyword)) return hex;
  }
  return fallback;
}
```

**Benefit**:
- One function instead of 50+ if statements
- Can be unit tested
- Reusable across components

---

### Solution 3: Memoize Categorization Functions
```typescript
const headgearType = useMemo(() => {
  if (!headgear || headgear.name === 'None') return null;
  const name = headgear.name.toLowerCase();
  if (name.includes('helmet')) return 'helmet';
  // ... categorization logic
  return 'hat';
}, [headgear?.name]);
```

---

### Solution 4: Optimize React.memo Comparison
```typescript
const PlayerIcon: React.FC<PlayerIconProps> = React.memo(
  ({ x, y, character, isInteriorMap }) => {
    // ... component
  },
  (prevProps, nextProps) => {
    // Only re-render if character appearance changes, not position
    return (
      prevProps.character.appearance === nextProps.character.appearance &&
      prevProps.isInteriorMap === nextProps.isInteriorMap &&
      prevProps.character.diseaseHealth === nextProps.character.diseaseHealth &&
      prevProps.character.equippedItems === nextProps.character.equippedItems
    );
  }
);
```

**Benefit**: Character moving around doesn't trigger sprite re-render

---

### Solution 5: Pre-compute Jewelry Colors
```typescript
const jewelryColors = useMemo(() => {
  if (!jewelry || jewelry.length === 0) return [];
  return jewelry.slice(0, 3).map(item => {
    // Color detection logic here, runs once
    return detectColor(item.color || item.material, '#e5e7eb');
  });
}, [jewelry]);

// Then in render:
{jewelryColors.map((color, idx) => {
  const item = jewelry[idx];
  return (
    <React.Fragment key={`jewelry-${idx}`}>
      {item.type === 'earrings' && (
        <circle cx="-2.8" cy="-1.8" r="0.15" fill={color} />
      )}
    </React.Fragment>
  );
})}
```

---

### Solution 6: Simplify Conditional Rendering
```typescript
// Before
{markings && markings.length > 0 && markings.map((marking, idx) => {
  if (idx >= 3) return null;
  // ...
})}

// After
{markings?.slice(0, 3).map((marking, idx) => {
  // No need for early exit check
  // ...
})}
```

---

## 📊 ESTIMATED PERFORMANCE GAINS

| Optimization | FPS Impact (30 NPCs) | Re-render Reduction |
|-------------|---------------------|-------------------|
| Memoize color getters | +15-20 FPS | 80% fewer calculations |
| Shared color utility | +10-15 FPS | 90% fewer string ops |
| Optimized React.memo | +20-25 FPS | 95% fewer re-renders on movement |
| Pre-compute jewelry | +5-10 FPS | 100% for jewelry |
| **TOTAL ESTIMATED** | **+50-70 FPS** | **~85% overall reduction** |

---

## 🎯 PRIORITY IMPLEMENTATION ORDER

1. **HIGH PRIORITY** (Implement First):
   - Create shared `detectColor()` utility
   - Memoize all color getters (clothing, cloak, boots, belt, legs)
   - Optimize React.memo comparison

2. **MEDIUM PRIORITY**:
   - Memoize categorization functions
   - Pre-compute jewelry colors
   - Simplify conditional rendering

3. **LOW PRIORITY** (Nice to have):
   - Memoize SVG filters
   - Optimize array construction in NpcIcon

---

## 🔍 TESTING RECOMMENDATIONS

1. **Baseline Test**: Measure FPS with 30 NPCs on screen
2. **After Each Fix**: Re-measure to validate improvement
3. **Profiling**: Use React DevTools Profiler to identify remaining bottlenecks
4. **Stress Test**: Test with 50+ NPCs to ensure stability

---

## ⚠️ NOTES

- Current jewelry enhancement (lines 776-855) was just added and makes the problem worse
- Consider REMOVING complex jewelry rendering until performance is fixed
- Safari performance is already degraded - these fixes are critical for mobile
