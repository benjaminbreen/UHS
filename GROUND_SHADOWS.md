# Ground-Plane Shadow System (JRPG Style)

## Implementation Summary

Implemented simple, performant ground-plane ellipse shadows inspired by classic JRPGs like Final Fantasy VI, Chrono Trigger, and Pokemon. These shadows sit flat on the ground beneath characters and objects, providing depth perception without the performance cost or visual issues of realistic cast shadows.

## What Was Implemented

### 1. **NPC Shadows**
- Simple ellipse beneath each NPC character
- Position: 85% down the tile (cy={TILE_SIZE_PX * 0.85})
- Size: rx={TILE_SIZE_PX * 0.25}, ry={TILE_SIZE_PX * 0.08}
- Color: rgba(0, 0, 0, 0.25)
- **Zero performance cost** - just one SVG ellipse per NPC

```typescript
<ellipse
  cx={TILE_SIZE_PX / 2}
  cy={TILE_SIZE_PX * 0.85}
  rx={TILE_SIZE_PX * 0.25}
  ry={TILE_SIZE_PX * 0.08}
  fill="rgba(0, 0, 0, 0.25)"
/>
```

### 2. **Animal Shadows**
- Ellipse beneath both wild and tamed animals
- Scales with animal size multiplier
- Reduced opacity for "Ambient" type animals (birds, butterflies)
- Position: 85% down the tile
- Size adapts to creature: rx={TILE_SIZE_PX * 0.22 * sizeMultiplier}

**Changes:**
- ✅ Removed blur filter from existing ellipses (was performance drag)
- ✅ Removed CSS drop-shadow from animal sprites (caused ugly offsets)
- ✅ Repositioned shadow to proper ground level (was at 40% + offset)

### 3. **Vegetation Shadows (Trees/Bushes)**
- Ellipse beneath all vegetation symbols
- Position: 85% down for proper trees, 90% for emoji fallbacks
- Size: rx={TILE_SIZE_PX * 0.28}, ry={TILE_SIZE_PX * 0.09}
- Slightly larger than character shadows (trees are bigger)

**Changes:**
- ✅ Removed CSS drop-shadow filter from emoji vegetation
- ✅ Added proper ground-plane ellipse for all tree types

## Visual Style

These shadows are **intentionally simple**:
- No blur (crisp edges)
- No offset (directly beneath object)
- Flat ellipse on ground plane
- Semi-transparent black (25% opacity)

This creates the classic JRPG aesthetic where objects feel "grounded" without attempting photorealism.

## Performance Benefits

### Before (Hierarchical Drop Shadows):
- SVG feGaussianBlur filters for each object
- CSS drop-shadow calculations
- Multiple render passes
- Heavy GPU load
- Looked wrong (offset behind objects, not on ground)

### After (Ground-Plane Ellipses):
- Single `<ellipse>` element per object
- No filters, no blur, no calculations
- **Near-zero performance cost**
- Perfect for tile-based games
- Looks authentic to JRPG style

## Code Locations

**File**: `/Users/benjaminbreen/code/august-6-uhs/components/MapDisplayOptimized.tsx`

**NPC Shadows**: Lines 4672-4679
**Wild Animal Shadows**: Lines 4370-4378
**Tamed Animal Shadows**: Lines 4477-4484
**Vegetation Shadows**: Lines 3278-3285, 3294-3301

## Design Rationale

### Why NOT Realistic Cast Shadows?

Realistic cast shadows (projecting onto ground plane with perspective) would require:
1. Per-object transform matrix calculations
2. Sun angle tracking
3. Ground-plane intersection math
4. Occlusion handling (shadows don't show through buildings)
5. Real-time recalculation for moving objects

**Performance**: Would tank FPS on Safari, especially with 100+ visible NPCs/animals/trees

**Visual**: Doesn't match the stylized sprite aesthetic of the game

### Why Ground-Plane Ellipses Work

✅ **Instant visual feedback**: Player knows where character is standing
✅ **Universal technique**: Used by Pokemon, Final Fantasy, Zelda, Stardew Valley
✅ **Style-consistent**: Matches 2D sprite aesthetic
✅ **Performance-free**: One ellipse = negligible cost
✅ **No maintenance**: Doesn't break with new features

## Examples from Games

**Final Fantasy VI**: Simple dark ellipses beneath all characters
**Chrono Trigger**: Soft ellipses at character feet
**Pokemon**: Dark oval shadows beneath all sprites
**Earthbound**: Simple circular shadows
**Stardew Valley**: Uses this exact technique

## What About Buildings/Mountains?

Buildings and mountains intentionally have **no shadows** because:
1. They're large structures where shadows would look wrong at this scale
2. The sprite design itself implies depth (shading built into textures)
3. Adding shadows would clutter the visual field
4. Performance: Hundreds of building tiles × shadow filters = lag

This is the same approach Pokemon uses - only moving entities get shadows.

## Parameters for Tweaking

If shadows feel too strong/weak, adjust these values:

```typescript
// Make shadows darker:
fill="rgba(0, 0, 0, 0.35)"  // was 0.25

// Make shadows lighter:
fill="rgba(0, 0, 0, 0.15)"  // was 0.25

// Make shadows wider:
rx={TILE_SIZE_PX * 0.35}    // was 0.25 (NPCs)
rx={TILE_SIZE_PX * 0.38}    // was 0.28 (vegetation)

// Make shadows taller (more circular):
ry={TILE_SIZE_PX * 0.12}    // was 0.08

// Move shadows lower (further from feet):
cy={TILE_SIZE_PX * 0.90}    // was 0.85
```

## Future Enhancements (Optional)

If desired, could add:
1. **Subtle blur** (1px) for softer shadows (minor performance cost)
2. **Dynamic opacity** based on time of day (darker at noon, lighter at dusk)
3. **Weather effects** (no shadows in heavy rain/fog)

But current implementation is perfect for JRPG aesthetic!
