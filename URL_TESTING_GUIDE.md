# URL Sharing System - Testing Guide

## Phase 2 Implementation Complete ✅

The URL parsing system has been enhanced to properly handle map area names in addition to cultural zones.

---

## What Was Fixed

### 1. **Map Area Recognition**
- ✅ URLs with map area names now work: `/1473/north-china-plain/survival`
- ✅ Zone detection from map area names
- ✅ Fuzzy matching for similar/misspelled map areas
- ✅ Backward compatible with old zone-based URLs: `/1473/europe/survival`

### 2. **Enhanced Game Mode Support**
- ✅ All 8 game modes supported: `survival`, `exploration`, `commerce`, `scholarship`, `leadership`, `livelihood`, `diplomacy`, `legal`
- ✅ Legacy aliases mapped: `empire` → `leadership`, `cultural` → `scholarship`, etc.

### 3. **Improved URL Config**
- ✅ New `mapArea` field in URLGameConfig
- ✅ Automatic zone detection when only map area is provided
- ✅ Better logging for debugging URL issues

---

## URL Formats Supported

### Format 1: New Query-Based (Recommended) ✅
```
/1473/north-china-plain/survival?state=eyJ2IjoxLCJ5IjoxNDczLC4uLg==
```
**Contains**: Complete game state (character, date, location, mode, seed)

### Format 2: Old Path-Based with Map Area (Now Fixed!) ✅
```
/1473/north-china-plain/survival
```
**Contains**: Year, map area (zone auto-detected), game mode

### Format 3: Old Path-Based with Zone ✅
```
/1473/europe/survival
```
**Contains**: Year, cultural zone, game mode

### Format 4: Zone.Region Format ✅
```
/1473/europe.iberia/exploration
```
**Contains**: Year, zone, specific region, game mode

### Format 5: With Seed ✅
```
/1473/europe/survival/ABC12345
```
**Contains**: Year, zone, game mode, map seed

---

## Test Cases

### Test 1: Map Area URL
```bash
# Navigate to:
http://localhost:5173/1473/north-china-plain/survival

# Expected behavior:
- ✅ Year set to 1473
- ✅ Map area detected as "North China Plain"
- ✅ Zone auto-detected as "East Asia"
- ✅ Game mode set to "survival"
- ✅ Character generated for that location/era
```

### Test 2: Cultural Zone URL (Backward Compatibility)
```bash
# Navigate to:
http://localhost:5173/1500/mena/exploration

# Expected behavior:
- ✅ Year set to 1500
- ✅ Zone set to MENA
- ✅ Game mode set to "exploration"
- ✅ Random map area in MENA region
```

### Test 3: Case Insensitive Map Area
```bash
# Navigate to:
http://localhost:5173/1600/thames-estuary/commerce

# Expected behavior:
- ✅ Detects "Thames Estuary" (case insensitive)
- ✅ Zone auto-detected as "Europe"
- ✅ Game mode set to "commerce"
```

### Test 4: Share Button Generated URL
```bash
# Steps:
1. Start a game
2. Open Initial Scenario Modal
3. Click "Share This Scenario"
4. Copy the generated URL
5. Open in new tab/window

# Expected behavior:
- ✅ Exact same character appears
- ✅ Exact same location
- ✅ Exact same date
- ✅ Exact same game mode
- ✅ Same map seed (identical world)
```

### Test 5: Legacy Game Mode Alias
```bash
# Navigate to:
http://localhost:5173/1800/europe/empire

# Expected behavior:
- ✅ "empire" mapped to "leadership" mode
- ✅ Game starts in leadership mode
```

### Test 6: Fuzzy Map Area Matching
```bash
# Navigate to:
http://localhost:5173/1492/paris/scholarship

# Expected behavior:
- ✅ "paris" fuzzy matched to "Paris Basin"
- ✅ Zone detected as "Europe"
- ✅ Game mode set to "scholarship"
```

---

## How to Test

### 1. Test Share Button
1. Start the dev server: `npm start`
2. Generate a new game
3. In the Initial Scenario Modal, click **"Share This Scenario"**
4. Click **"Copy"** to copy the URL
5. Open the URL in a new browser tab
6. Verify all details match (character, location, date, mode)

### 2. Test Old URL Format
1. Manually construct a URL: `/1473/north-china-plain/survival`
2. Navigate to it in your browser
3. Check console logs for:
   ```
   [URLConfig] Attempting to parse as map area: North China Plain
   [URLConfig] Found zone for map area: { zone: 'East Asia', region: '...' }
   [App] Legacy URL world generation - Zone: East Asia, MapArea: North China Plain
   ```

### 3. Test Game Mode Restoration
1. Use URL: `/1500/europe/commerce`
2. Start game
3. Check that game mode shows "Commerce" in top nav bar
4. Verify initial event/scenario matches commerce mode

---

## Console Debugging

The system logs extensively for debugging. Look for these log patterns:

```javascript
// URL parsing
[URLConfig] Attempting to parse as map area: North China Plain
[URLConfig] Found zone for map area: { zone: 'East Asia', region: 'North China' }

// Zone detection
[ZoneDetection] Searching for map area: North China Plain
[ZoneDetection] Found "North China Plain" in zone "East Asia", region "North China"

// App restoration
[App] Legacy URL world generation - Zone: East Asia, MapArea: North China Plain
[App] Using map area from URL: North China Plain

// State restoration
[URL_RESTORE] Step 1: STATE DECODED & VALIDATED
[URL_RESTORE] Year: 1473
[URL_RESTORE] Map Area: North China Plain
```

---

## Known Edge Cases

### Edge Case 1: Invalid Map Area
```
URL: /1473/invalid-location/survival
Result: Falls back to Europe (default zone)
```

### Edge Case 2: Seed in URL
```
URL: /1473/europe/survival/ABC12345
Current: Seed may not initialize properly
Fix: Use query-based format instead
```

### Edge Case 3: Very Long URLs
```
Query-based URLs with full state can exceed 2000 characters
Solution: State parameter uses base64 compression
```

---

## Implementation Files Changed

1. **`services/urlConfigService.ts`**
   - Added `unslugify()` helper function
   - Enhanced `parseGeography()` to detect map areas
   - Updated `parseGameMode()` with all 8 modes + aliases
   - Extended `URLGameConfig` interface with `mapArea` field

2. **`App.tsx`**
   - Added zone detection when only map area provided
   - Route to `onStartNewWorldAtLocation` when map area available
   - Better logging for URL restoration debugging

3. **`components/InitialScenarioModal.tsx`**
   - Added share button UI
   - Copy to clipboard functionality
   - Visual feedback ("Copied!")

---

## Next Steps (Future Phases)

- **Phase 3**: Consolidate game mode restoration (single localStorage key)
- **Phase 4**: Auto-upgrade old URLs to new format
- **Phase 5**: Enhanced state validation & checksums
- **Phase 6**: Debug tools & URL inspector

---

## Quick Reference

### All Supported Game Modes:
- `survival` - Survive harsh conditions
- `exploration` - Discover new territories
- `commerce` - Trade and prosper
- `scholarship` - Pursue knowledge
- `leadership` - Build influence and power
- `livelihood` - Support yourself and family
- `diplomacy` - Navigate political relationships
- `legal` - Navigate justice systems

### Example Map Areas (partial list):
- `north-china-plain`
- `thames-estuary`
- `paris-basin`
- `roman-campagna`
- `lower-nile-valley`
- `ganges-valley`
- `tokyo-bay`
- `pearl-river-delta`

### URL Structure:
```
/:year/:geography/:gameMode[/:seed][?state=encoded]
```

Where `geography` can be:
- Cultural zone: `europe`, `mena`, `eastasia`
- Map area: `north-china-plain`, `thames-estuary`
- Zone.region: `europe.iberia`, `eastasia.japan`
