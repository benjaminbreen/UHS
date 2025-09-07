# Interior Symbols Design Document
## SNES RPG Pixel Art Style Guide for Special Map Symbols

*Instructions for creating high-quality, culturally and historically accurate symbols that match the aesthetic of Stardew Valley, FF6, and classic SNES RPGs*

---

## 🎮 CRITICAL: Visual Style Reference

### Target Aesthetic (MUST MATCH)
- **Resolution**: TRUE 32x32 pixel grid (not just "32x32 style")
- **Perspective**: Classic SNES 3/4 view - You see the FRONT and TOP of objects
- **Depth**: Objects appear to have volume, not flat
- **Shadows**: STRONG, CONSISTENT shadows at 45° down-right
- **Color Depth**: Limited palette per object (3-5 colors max)
- **Fill Rate**: Overlays should fill 75-90% of tile space
- **Edges**: Clean, pixel-perfect edges (no anti-aliasing)

### Visual Hierarchy
```
Back Wall (top 2/3 of tile)
    ↓
Floor Tiles (full tile)
    ↓
Overlay Objects (75-90% of tile)
    ↓
NPCs/Player (on top)
```

---

## 🏗️ Back Wall System Implementation

### Wall Takes Top 2/3 of Tile
```typescript
// Back walls create room depth illusion
const BackWallSymbol = () => {
  return (
    <g>
      {/* Wall occupies top 66.7% of tile */}
      <rect x={0} y={0} width={size} height={size * 0.667} fill={wallColor} />
      
      {/* Windows/doors carved into wall */}
      {variant === 'window' && renderWindow()}
      
      {/* Bottom shadow where wall meets floor */}
      <rect x={0} y={size * 0.667 - 2} width={size} height={2} fill={shadowColor} />
    </g>
  );
};
```

### Window Implementation (Like Screenshots)
- Windows are CARVED INTO the wall, not placed on top
- Glass has slight transparency (opacity 0.7-0.8)
- Window frames are darker than wall
- Cross-beams divide window into 4 panes

---

## 📐 Pixel-Perfect SVG Implementation

### CRITICAL: Use Pixel Units
```typescript
// CORRECT - Pixel-perfect alignment
const pixelSize = size / 32;  // Convert to pixel grid

// All measurements in pixel units
<rect x={4 * pixelSize} y={8 * pixelSize} 
      width={24 * pixelSize} height={16 * pixelSize} />

// WRONG - Fractional positioning
<rect x={size * 0.125} y={size * 0.25} />  // Creates blurry edges!
```

### Standard Object Template
```tsx
const PixelPerfectSymbol: React.FC<Props> = ({ x, y, size = 32 }) => {
  const px = size / 32; // Pixel unit
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* 1. SHADOW - Strong and defined */}
      <ellipse cx={18 * px} cy={28 * px} 
               rx={10 * px} ry={4 * px} 
               fill="#000000" opacity={0.3} />
      
      {/* 2. BACK/BOTTOM LAYER */}
      <rect x={4 * px} y={12 * px} 
            width={24 * px} height={16 * px} 
            fill={baseColor} />
      
      {/* 3. TOP SURFACE (3/4 perspective) */}
      <path d={`M ${4 * px} ${12 * px} 
                L ${28 * px} ${12 * px}
                L ${26 * px} ${10 * px}
                L ${6 * px} ${10 * px} Z`}
            fill={topColor} />
      
      {/* 4. FRONT FACE */}
      <rect x={6 * px} y={10 * px} 
            width={20 * px} height={18 * px} 
            fill={frontColor} />
      
      {/* 5. EDGE HIGHLIGHTS (1-2px wide) */}
      <rect x={6 * px} y={10 * px} 
            width={1 * px} height={18 * px} 
            fill={highlightColor} />
      
      {/* 6. EDGE SHADOWS (1-2px wide) */}
      <rect x={25 * px} y={10 * px} 
            width={1 * px} height={18 * px} 
            fill={shadowColor} />
    </g>
  );
};
```

---

## 🎨 Color Palette Rules

### Maximum 5 Colors Per Object
1. **Base Color**: Main material color
2. **Highlight**: 20-30% lighter than base
3. **Shadow**: 30-40% darker than base
4. **Accent**: Detail color (handles, decorations)
5. **Deep Shadow**: For strong shadows (nearly black)

### Example Palettes
```typescript
// Wood Furniture (European Medieval)
const woodPalette = {
  base: '#8B6341',      // Medium brown
  highlight: '#A57C5A',  // Light brown
  shadow: '#6B4A31',     // Dark brown
  accent: '#4A3426',     // Very dark brown
  deepShadow: '#2A1F16'  // Nearly black
};

// Stone (MENA Ancient)
const stonePalette = {
  base: '#D4C4A0',      // Sandstone
  highlight: '#E8D8B4',  // Light sandstone
  shadow: '#B0A080',     // Dark sandstone
  accent: '#8C7860',     // Deep sandstone
  deepShadow: '#4A3E30'  // Shadow
};
```

---

## 🏠 Furniture Sizing Guidelines

### Overlay Objects MUST BE BIG
- **Minimum Coverage**: 75% of tile area
- **Maximum Coverage**: 90% of tile area
- **Never**: Small objects floating in center
- **Always**: Objects that nearly fill the tile

### Size Reference Chart
```typescript
// Object sizes in pixel units (out of 32)
const OBJECT_SIZES = {
  // Furniture
  TABLE: { width: 28, height: 20 },      // Nearly full width
  CHAIR: { width: 20, height: 24 },      // Tall and substantial
  CHEST: { width: 24, height: 20 },      // Wide and deep
  BED: { width: 30, height: 28 },        // Almost full tile
  BOOKSHELF: { width: 28, height: 30 },  // Tall, against wall
  
  // Decorative
  STATUE: { width: 16, height: 28 },     // Tall and narrow
  VASE: { width: 12, height: 16 },       // Smaller but centered
  BRAZIER: { width: 20, height: 24 },    // Substantial
  
  // Wall-mounted (on back walls)
  TORCH: { width: 8, height: 16 },       // Mounted high
  WINDOW: { width: 16, height: 14 },     // Cut into wall
  BANNER: { width: 20, height: 24 }      // Hanging down
};
```

---

## 🌍 Cultural Implementation

### Grouping Strategy
```typescript
// Cultures that can share base shapes (vary colors/details)
const CULTURAL_GROUPS = {
  WESTERN: ['EUROPEAN', 'MEDITERRANEAN', 'SLAVIC', 'NORDIC'],
  MIDDLE_EASTERN: ['MENA', 'OTTOMAN', 'PERSIAN', 'NORTH_AFRICAN'],
  EAST_ASIAN: ['CHINESE', 'JAPANESE', 'KOREAN', 'MONGOL'],
  SOUTH_ASIAN: ['INDIAN', 'TIBETAN', 'SOUTHEAST_ASIAN'],
  AFRICAN: ['SUB_SAHARAN', 'WEST_AFRICAN', 'EAST_AFRICAN'],
  AMERICAN: ['MESOAMERICAN', 'ANDEAN', 'NORTH_AMERICAN']
};

// Example: Chair variations
const getChairPixels = (culture: string) => {
  const group = getCulturalGroup(culture);
  
  switch(group) {
    case 'WESTERN':
      return renderHighBackChair();  // Tall wooden chair
    case 'EAST_ASIAN':
      return renderFloorCushion();   // Low seating
    case 'MIDDLE_EASTERN':
      return renderOttoman();         // Cushioned seat
    default:
      return renderStool();           // Simple stool
  }
};
```

---

## 🔧 Common Implementation Patterns

### Pattern 1: Wooden Furniture
```tsx
const WoodenTable = ({ x, y, size = 32 }) => {
  const px = size / 32;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow - elongated ellipse */}
      <ellipse cx={16 * px} cy={28 * px} rx={12 * px} ry={3 * px} 
               fill="#000" opacity={0.35} />
      
      {/* Table legs (back ones first) */}
      <rect x={6 * px} y={18 * px} width={2 * px} height={10 * px} fill="#6B4A31" />
      <rect x={24 * px} y={18 * px} width={2 * px} height={10 * px} fill="#6B4A31" />
      
      {/* Table top (3/4 view) */}
      <path d={`M ${4 * px} ${16 * px} 
                L ${28 * px} ${16 * px}
                L ${26 * px} ${14 * px}
                L ${6 * px} ${14 * px} Z`}
            fill="#A57C5A" />
      
      {/* Table front */}
      <rect x={4 * px} y={16 * px} width={24 * px} height={2 * px} fill="#8B6341" />
      
      {/* Front legs */}
      <rect x={5 * px} y={18 * px} width={2 * px} height={10 * px} fill="#8B6341" />
      <rect x={25 * px} y={18 * px} width={2 * px} height={10 * px} fill="#8B6341" />
      
      {/* Wood grain detail (subtle) */}
      <line x1={8 * px} y1={15 * px} x2={24 * px} y2={15 * px} 
            stroke="#6B4A31" strokeWidth={0.5} opacity={0.5} />
    </g>
  );
};
```

### Pattern 2: Stone/Metal Objects
```tsx
const StoneStatue = ({ x, y, size = 32 }) => {
  const px = size / 32;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Strong shadow */}
      <ellipse cx={17 * px} cy={30 * px} rx={8 * px} ry={3 * px} 
               fill="#000" opacity={0.4} />
      
      {/* Base pedestal */}
      <rect x={12 * px} y={26 * px} width={8 * px} height={4 * px} fill="#8B7355" />
      <rect x={11 * px} y={25 * px} width={10 * px} height={1 * px} fill="#9B8365" />
      
      {/* Statue body */}
      <rect x={14 * px} y={12 * px} width={4 * px} height={14 * px} fill="#A9A9A9" />
      
      {/* Statue head */}
      <rect x={13 * px} y={8 * px} width={6 * px} height={4 * px} fill="#A9A9A9" />
      
      {/* Highlights (left side) */}
      <rect x={14 * px} y={8 * px} width={1 * px} height={18 * px} fill="#C0C0C0" />
      
      {/* Shadows (right side) */}
      <rect x={17 * px} y={8 * px} width={1 * px} height={18 * px} fill="#808080" />
    </g>
  );
};
```

---

## ✅ Quality Checklist

### Visual Requirements
- [ ] **Fills 75-90% of tile** (not small centered object)
- [ ] **Pixel-aligned** (use px units, not fractions)
- [ ] **3/4 perspective** (shows front AND top)
- [ ] **Strong shadow** at 45° angle
- [ ] **Edge highlights** (1-2px on left)
- [ ] **Edge shadows** (1-2px on right)
- [ ] **3-5 colors maximum**

### Technical Requirements
- [ ] Uses pixel units (`size/32`)
- [ ] Transform at x,y position
- [ ] Returns valid JSX/SVG
- [ ] Under 150 lines of code
- [ ] Handles rotation if needed

### Cultural Accuracy
- [ ] Appropriate for culture/era
- [ ] Shares base with similar cultures
- [ ] Materials match historical period
- [ ] Details are authentic

---

## 🚫 Common Mistakes to Avoid

1. **Objects too small** - Must fill most of tile
2. **Using fractional positions** - Causes blurry edges
3. **Weak shadows** - Shadows should be strong (0.3-0.4 opacity)
4. **No perspective** - Must show 3/4 view
5. **Too many colors** - Stick to 3-5 color limit
6. **Floating objects** - Objects need strong ground connection
7. **Missing edge definition** - Always add edge highlights/shadows
8. **Overly complex** - Simple, clean shapes read better

---

## 📊 Size Reference Table

| Object Type | Width (px) | Height (px) | Notes |
|------------|------------|-------------|--------|
| Chair | 20 | 24 | Back visible, substantial |
| Table | 28 | 20 | Nearly full width |
| Chest | 24 | 20 | Wide and deep |
| Bed | 30 | 28 | Almost full tile |
| Bookshelf | 28 | 30 | Tall, against wall |
| Desk | 26 | 22 | With drawers visible |
| Statue | 16 | 28 | Tall and narrow |
| Brazier | 20 | 24 | Fire effect on top |
| Vase | 12 | 16 | Smaller decorative |
| Door | 20 | 24 | In back wall |
| Window | 16 | 14 | Cut into wall |

---

## 🎮 Testing Your Symbols

1. **Size Test**: Does it fill 75-90% of tile?
2. **Pixel Test**: Zoom to 800% - are edges clean?
3. **Shadow Test**: Is shadow strong and at 45°?
4. **Perspective Test**: Can you see front AND top?
5. **Color Test**: Count colors - should be 3-5
6. **Culture Test**: Test in 3+ cultural zones
7. **Integration Test**: Place on different floor types

---

*Remember: We're creating symbols that look like they belong in Stardew Valley or FF6 - clean, readable, pixel-perfect sprites with strong shadows and clear 3/4 perspective. Every object should be substantial and fill most of its tile.*