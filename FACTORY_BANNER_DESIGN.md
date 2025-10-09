# Factory Interior Banner - Design Document

## Philosophy

The factory interior banner should be **beautiful**, **immersive**, and **historically accurate** - creating a vivid sense of being inside the specific type of factory shown on the map. Like the farm banner, it should use:
- **Pixel art aesthetic** with crisp rendering
- **Canvas-based drawing** (not SVG) for authentic pixel art
- **Seeded RNG** for consistent layouts per factory
- **Cultural/era-specific details** (materials, architecture, clothing)
- **Atmospheric effects** (steam, smoke, sparks, dust)
- **Dynamic lighting** based on time of day
- **Factory-specific machinery** rendered with historical accuracy

The goal: When a player enters a textile mill in 1840s Manchester, they should FEEL like they're in a textile mill. When they enter a steel mill in 1880s Pittsburgh, they should FEEL the heat and danger.

---

## Technical Foundation

### Canvas vs SVG
**Use HTML5 Canvas** (like FarmBanner) instead of SVG for:
- True pixel-art rendering with `image-rendering: pixelated`
- Better performance for animated particles (steam, sparks, dust)
- More control over dithering and gradients
- Authentic retro aesthetic

### Dimensions
- **Width**: 1280px (same as FarmBanner)
- **Height**: 220px (wide banner format)
- **Pixel density**: 2x for Retina displays, scaled with CSS

### Seeded RNG
Use same RNG system as FarmBanner (xorshift32):
```typescript
class RNG {
  private s: number;
  constructor(seed: number) { this.s = (seed || 1) >>> 0; }
  next() {
    let x = this.s;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.s = x >>> 0;
    return (this.s & 0xffffffff) / 0x100000000;
  }
  int(min: number, max: number) { return Math.floor(min + this.next() * (max - min + 1)); }
  range(min: number, max: number) { return min + this.next() * (max - min); }
}
```

Seed based on: `factoryName + factoryType.id + location`

---

## Color Palette System

### Material Colors (Historical Accuracy)

#### Early Modern Era (Plantations, Pre-Industrial)
```typescript
const EARLY_MODERN_MATERIALS = {
  // Wood structures
  wood_tropical: '#6b4423',
  wood_weathered: '#5a3920',
  wood_beam: '#4d3419',

  // Stone and brick
  brick_colonial: '#8b4513',
  stone_foundation: '#6b6b6b',

  // Natural materials
  thatch: '#d4a573',
  mud_wall: '#8b7355',
  clay: '#b78c44',

  // Metal (primitive)
  iron_crude: '#4a4a4a',
  iron_rusted: '#7a4f3a',

  // Dirt and ground
  dirt_packed: '#5d4e37',
  dirt_swept: '#7a6a52'
};
```

#### Industrial Era (Textile Mills, Steel Mills, Railway Workshops)
```typescript
const INDUSTRIAL_ERA_MATERIALS = {
  // Industrial brick
  brick_red: '#a52a2a',
  brick_dark: '#8b3a3a',
  brick_soot: '#5a3a3a',

  // Cast iron and steel
  iron_cast: '#3a3a3a',
  iron_dark: '#2a2a2a',
  steel_new: '#b0b0b0',
  steel_worn: '#8a8a8a',

  // Wood (industrial)
  wood_beam: '#654321',
  wood_floor: '#7b5d3a',
  wood_crate: '#8b6f47',

  // Glass (factory windows)
  glass_dirty: '#a0b0c0',
  glass_broken: '#7a8a9a',

  // Concrete (late industrial)
  concrete_gray: '#808080',
  concrete_stained: '#6a6a6a'
};
```

#### Modern Era (Automobile, Electronics)
```typescript
const MODERN_ERA_MATERIALS = {
  // Modern materials
  concrete_smooth: '#d0d0d0',
  metal_polished: '#c0c0c0',
  metal_chrome: '#e0e0e0',
  plastic_white: '#f0f0f0',
  plastic_gray: '#a0a0a0',

  // Painted surfaces
  paint_white: '#f5f5f5',
  paint_yellow: '#ffeb3b',
  paint_safety: '#ffc107',

  // Flooring
  floor_epoxy: '#e0e0e0',
  floor_tile: '#d8d8d8',
  floor_painted: '#c8c8c8'
};
```

### Product/Output Colors (By Factory Type)

```typescript
const PRODUCT_COLORS = {
  // Textiles
  cotton_white: '#f5f5f5',
  cotton_natural: '#faf0e6',
  thread_spool: '#dda520',
  cloth_bolt: '#f0e68c',

  // Metals
  steel_ingot: '#b0c4de',
  iron_molten: '#ff6347',
  iron_glow: '#ff8c00',
  slag: '#696969',

  // Wood products
  lumber_pine: '#deb887',
  lumber_oak: '#8b7355',

  // Agricultural
  sugar_raw: '#f5deb3',
  sugar_refined: '#fffaf0',
  cotton_boll: '#ffffff',
  cane_juice: '#d2691e',

  // Modern manufacturing
  car_body_blue: '#4169e1',
  car_body_red: '#dc143c',
  circuit_board_green: '#2e8b57',
  plastic_molded: '#4682b4'
};
```

---

## Factory-Specific Layouts & Machinery

### 1. Sugar Plantation (Early Modern)

**Architecture**:
- Open-sided boiling house with thatched/shingled roof
- Stone or brick foundation
- Large copper cauldrons (3-5 in a row)
- Wooden press structure
- Dirt or rough wood floor

**Machinery**:
```typescript
// Boiling house layout
{
  cauldrons: [
    { x: 200, y: 140, size: 40, heat: 'high' },   // First boil
    { x: 280, y: 140, size: 38, heat: 'medium' }, // Second boil
    { x: 360, y: 140, size: 36, heat: 'low' },    // Cooling
  ],

  canePress: {
    x: 100, y: 120,
    width: 80, height: 100,
    rollers: 3, // Vertical rollers
    material: 'wood_and_iron'
  },

  furnace: {
    x: 250, y: 180,
    width: 300, height: 40,
    flames: true, // Orange glow underneath cauldrons
    smoke: true   // Rising smoke particles
  }
}
```

**Workers**:
- 6-12 workers (era-dependent)
- Clothing: Simple shirts, trousers, head wraps
- Poses: Stirring cauldrons, feeding cane into press, carrying bundles
- Cultural variations: African, Caribbean, South American styles

**Atmospheric Effects**:
- **Steam**: Heavy white steam rising from boiling cauldrons
- **Heat shimmer**: Distortion effect above furnace
- **Firelight glow**: Orange flickering on workers' faces
- **Sweat**: Visible on workers (small droplets)

### 2. Cotton Plantation (Early Modern)

**Architecture**:
- Wooden gin house with shuttered windows
- Raised platform for cotton sorting
- Large cotton press
- Storage area with cotton bales

**Machinery**:
```typescript
{
  cottonGin: {
    x: 400, y: 100,
    width: 200, height: 120,
    type: era === 'RENAISSANCE_EARLY_MODERN' ? 'whitney_gin' : 'manual_roller',
    cylinders: 2,
    hopper: { seeds: true, lint: true }
  },

  balePress: {
    x: 800, y: 120,
    width: 100, height: 140,
    screw: true,  // Large wooden screw
    bale: { compressed: 0.6 } // Animation state
  },

  sortingTable: {
    x: 100, y: 140,
    width: 250, height: 60,
    cotton_piles: 4
  }
}
```

**Workers**:
- 8-15 workers
- Clothing: Light cotton clothing, sun hats
- Poses: Feeding cotton into gin, packing bales, sorting lint

**Atmospheric Effects**:
- **Cotton lint**: White fluff floating in air
- **Dust**: Fine dust particles in sunbeams (if daytime)
- **Seeds falling**: From gin separator

### 3. Textile Mill (Industrial Era)

**Architecture**:
- Brick walls with large multi-pane windows
- Cast iron columns supporting upper floors
- Wooden plank floor (stained with oil)
- Gas lamps or early electric lights

**Machinery**:
```typescript
{
  powerLooms: [
    { x: 150, y: 100, width: 120, height: 80, running: true },
    { x: 300, y: 100, width: 120, height: 80, running: true },
    { x: 450, y: 100, width: 120, height: 80, running: false },
    { x: 600, y: 100, width: 120, height: 80, running: true },
  ],

  // Overhead power transmission
  lineShaft: {
    y: 60,
    length: 800,
    diameter: 8,
    rotating: true // Animated rotation
  },

  belts: [
    { from: [lineShaftX, 60], to: [loom1X, loom1Y], width: 4, moving: true },
    { from: [lineShaftX, 60], to: [loom2X, loom2Y], width: 4, moving: true },
    // ...
  ],

  spools: [
    { x: 50, y: 140, count: 20, color: 'cotton_white' },
    { x: 800, y: 140, count: 15, color: 'thread_spool' }
  ]
}
```

**Workers**:
- 10-20 workers (mostly women and children in historical context)
- Clothing: Plain dresses, aprons, head scarves (women); shirts and suspenders (men)
- Poses: Threading shuttles, watching looms, tying broken threads, carrying cloth bolts
- Cultural variations: European (Manchester, Lyon), American (Lowell), Japanese (Osaka)

**Atmospheric Effects**:
- **Cotton lint**: Thick in the air (haziness)
- **Belt movement**: Animated leather belts connecting to shaft
- **Loom vibration**: Subtle shake of loom frames
- **Light rays**: Dusty sunbeams through windows (if daytime)
- **Oil stains**: Dark patches on floor

### 4. Steel Mill (Industrial Era)

**Architecture**:
- Dark brick or metal walls (soot-stained)
- Very high ceiling (implied by perspective)
- Metal grating catwalks
- Minimal windows (glowing openings)

**Machinery**:
```typescript
{
  blastFurnace: {
    x: 200, y: 50,
    width: 150, height: 170,
    tappingHole: { x: 250, y: 180, glowing: true },
    chimney: { x: 275, y: 0, height: 50, smoke: 'heavy' }
  },

  ladles: [
    { x: 400, y: 140, size: 60, moltenMetal: true, glow: '#ff6347', suspended: true },
    { x: 600, y: 160, size: 60, moltenMetal: false }
  ],

  anvil: {
    x: 800, y: 150,
    width: 60, height: 40,
    sparks: true
  },

  crucibles: [
    { x: 100, y: 170, glowing: true, heat: 'extreme' },
    { x: 500, y: 170, glowing: false }
  ]
}
```

**Workers**:
- 8-15 workers (all adult men)
- Clothing: Heavy leather aprons, thick gloves, soot-stained
- Poses: Pouring ladles, hammering, shoveling coal, inspecting molds
- **Safety note**: NO protective gear in historical context (dangerous reality)

**Atmospheric Effects**:
- **Intense glow**: Orange/red from molten metal and furnace
- **Sparks**: Yellow/white sparks flying from hammering
- **Thick smoke**: Dark smoke rising from furnace
- **Heat shimmer**: Heavy distortion near furnace
- **Ash particles**: Dark particles floating down
- **Dramatic lighting**: High contrast (very dark shadows, very bright highlights)

### 5. Railway Workshop (Industrial Era)

**Architecture**:
- Large open hall with metal truss roof
- Brick walls with tall arched windows
- Multiple railway tracks on floor
- Overhead crane system

**Machinery**:
```typescript
{
  locomotiveFrame: {
    x: 400, y: 80,
    width: 300, height: 140,
    wheels: 4,
    boiler: { assembled: 0.7 }, // Partially assembled
    smokestack: { attached: false }
  },

  crane: {
    x: 300, y: 0,
    height: 60,
    hook: { x: 350, y: 100, load: 'boiler_section' }
  },

  workbenches: [
    { x: 50, y: 140, tools: ['hammer', 'rivet_gun'] },
    { x: 900, y: 140, tools: ['wrench', 'file'] }
  ],

  forges: [
    { x: 100, y: 120, size: 40, fire: true },
    { x: 850, y: 120, size: 40, fire: true }
  ]
}
```

**Workers**:
- 12-20 skilled workers
- Clothing: Leather aprons, flat caps, work boots
- Poses: Riveting, hammering, measuring, welding (late era)
- Tools: Hammers, wrenches, rivet guns

**Atmospheric Effects**:
- **Steam**: From testing boiler systems
- **Sparks**: From riveting and grinding
- **Coal smoke**: From forges
- **Oil smell**: Implied by oil cans and stains
- **Metal debris**: Shavings and cutoffs on floor

### 6. Automobile Factory (Modern Era)

**Architecture**:
- Clean white/gray walls
- Bright fluorescent lighting
- Painted floor markings (yellow safety lines)
- Large glass windows

**Machinery**:
```typescript
{
  assemblyLine: {
    y: 140,
    length: 1000,
    speed: 2, // pixels per second
    vehicles: [
      { x: 200, stage: 'chassis' },
      { x: 500, stage: 'engine_mounted' },
      { x: 800, stage: 'body_painted' }
    ]
  },

  robotArms: [
    { x: 300, y: 80, task: 'welding', sparks: true },
    { x: 600, y: 80, task: 'lifting', suspended: 'engine_block' }
  ],

  paintBooth: {
    x: 900, y: 60,
    width: 200, height: 140,
    mist: true,
    color: 'car_body_blue'
  }
}
```

**Workers**:
- 6-12 workers (mix of humans and robots in modern context)
- Clothing: Blue/gray jumpsuits, safety helmets, goggles
- Poses: Operating controls, inspecting welds, checking quality

**Atmospheric Effects**:
- **Welding sparks**: Bright blue/white from robot welders
- **Paint mist**: In paint booth
- **Bright lighting**: Clean, even illumination
- **Minimal dust**: Clean environment

### 7. Electronics Factory (Modern Era)

**Architecture**:
- Extremely clean white walls (cleanroom aesthetic)
- Bright white LED lighting
- Anti-static flooring
- Glass partitions

**Machinery**:
```typescript
{
  pcbAssembly: {
    x: 300, y: 100,
    width: 400, height: 80,
    conveyor: true,
    boards: [
      { x: 320, stage: 'bare' },
      { x: 450, stage: 'components_placed' },
      { x: 580, stage: 'soldered' }
    ]
  },

  solderingStation: {
    x: 500, y: 100,
    tip: { glowing: true, temperature: 'high' }
  },

  testingRig: {
    x: 800, y: 120,
    width: 150, height: 100,
    screen: { color: 'circuit_board_green', pattern: 'trace_lines' },
    leds: [
      { x: 850, y: 140, color: 'green', lit: true },
      { x: 860, y: 140, color: 'red', lit: false }
    ]
  }
}
```

**Workers**:
- 4-8 workers
- Clothing: White cleanroom suits, hairnets, gloves, masks
- Poses: Operating microscopes, programming, inspecting boards

**Atmospheric Effects**:
- **Minimal**: Very clean environment
- **LED indicators**: Blinking lights on equipment
- **Screen glow**: From monitors and testing rigs

---

## Animation System

### Frame-Based Animation
Use `requestAnimationFrame` for smooth 60fps animation:

```typescript
const [frame, setFrame] = useState(0);

useEffect(() => {
  let animationId: number;
  const animate = () => {
    setFrame(f => f + 1);
    animationId = requestAnimationFrame(animate);
  };
  animationId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationId);
}, []);
```

### Animated Elements

#### 1. Machinery Movement
```typescript
// Rotating wheels, gears, belts
const wheelRotation = (frame * 2) % 360;
const beltOffset = (frame * 0.5) % 40; // Moves 0-40px then loops

// Draw rotating gear
ctx.save();
ctx.translate(gearX, gearY);
ctx.rotate(wheelRotation * Math.PI / 180);
drawGear(ctx, 0, 0, radius, teeth);
ctx.restore();
```

#### 2. Particle Systems

**Steam**:
```typescript
class SteamParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy -= 0.1; // Rises
    this.vx += (Math.random() - 0.5) * 0.1; // Drifts
    this.life--;
    this.size *= 1.02; // Grows as it rises
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.life / this.maxLife;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
    ctx.filter = 'blur(4px)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = 'none';
  }
}
```

**Sparks** (for steel mills, welding):
```typescript
class SparkParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string; // '#ffaa00' to '#ff4400'

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life--;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), 2, 2); // 2x2 pixel
  }
}
```

**Smoke**:
```typescript
class SmokeParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  size: number;
  darkness: number; // 0.0 (light gray) to 0.8 (dark gray)

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy -= 0.05; // Rises slowly
    this.life--;
    this.size *= 1.01; // Grows
    this.darkness *= 0.98; // Fades to lighter
  }
}
```

**Cotton Lint / Dust**:
```typescript
class LintParticle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    // Gentle floating motion
    this.vx += (Math.random() - 0.5) * 0.05;
    this.vy += (Math.random() - 0.5) * 0.05;
  }
}
```

#### 3. Worker Animation

**Walking cycles** (8-frame cycle):
```typescript
const walkCycle = [
  { legOffset: 0, armSwing: 0 },
  { legOffset: 2, armSwing: 1 },
  { legOffset: 4, armSwing: 2 },
  { legOffset: 6, armSwing: 3 },
  { legOffset: 4, armSwing: 2 },
  { legOffset: 2, armSwing: 1 },
  { legOffset: 0, armSwing: 0 },
  { legOffset: -2, armSwing: -1 }
];

const cycleIndex = Math.floor(frame / 8) % 8;
drawWorker(x, y, walkCycle[cycleIndex]);
```

**Work animations**:
- **Hammering**: Arm raises and strikes (4-frame cycle)
- **Stirring**: Circular motion (8-frame cycle)
- **Carrying**: Bobbing up/down slightly while walking
- **Operating machine**: Standing still with arm at control

#### 4. Lighting Effects

**Flickering fire/furnace**:
```typescript
const fireGlow = 0.8 + Math.sin(frame * 0.1) * 0.2; // 0.6 to 1.0
const fireRadius = baseRadius * fireGlow;
```

**Molten metal glow** (pulsing):
```typescript
const glowIntensity = 0.7 + Math.sin(frame * 0.05) * 0.3;
const glowColor = `rgba(255, 99, 71, ${glowIntensity})`;
```

**Gas lamps** (gentle flicker):
```typescript
const lampFlicker = 0.9 + Math.random() * 0.1; // 90-100% brightness
```

---

## Cultural Variations

### European (Manchester, Lyon, Berlin)
- **Architecture**: Red brick, tall arched windows, ornate ironwork
- **Workers**: European clothing styles, flat caps, long dresses
- **Aesthetic**: Dark, industrial, Victorian

### East Asian (Osaka, Shanghai)
- **Architecture**: Mix of traditional and industrial, sliding panels, paper screens in office areas
- **Workers**: Traditional work clothing (happi coats in Japan, queue hairstyles in Qing China)
- **Aesthetic**: Cleaner, more organized, specific cultural details

### MENA (Cairo, Istanbul)
- **Architecture**: Stone walls, arched doorways, latticed windows
- **Workers**: Head coverings, loose-fitting garments
- **Aesthetic**: Earth tones, decorative tilework (even in industrial contexts)

### South Asian (Bombay, Calcutta)
- **Architecture**: Colonial industrial style, whitewashed walls, high ceilings
- **Workers**: Dhotis, turbans, saris
- **Aesthetic**: British colonial industrial aesthetic mixed with local elements

### Sub-Saharan African
- **Architecture**: Adapted colonial structures, local materials
- **Workers**: Traditional and colonial-era work clothing
- **Aesthetic**: Lighter colors to combat heat

### North American Colonial
- **Architecture**: Wooden structures (early), brick (later), utilitarian
- **Workers**: Simple work clothes, diverse ethnic backgrounds (enslaved people in plantations)
- **Aesthetic**: Functional, minimal decoration

### South American
- **Architecture**: Mix of Spanish colonial and industrial
- **Workers**: Mixed indigenous and European styles
- **Aesthetic**: Brighter colors, tropical materials

---

## Rendering Pipeline

### Setup Phase (useMemo)
```typescript
const layout = useMemo(() => {
  const rng = new RNG(seed);
  return generateFactoryLayout(factoryType, era, culturalZone, rng);
}, [factoryType, era, culturalZone, seed]);
```

### Drawing Order (back to front)
1. **Background**: Sky/upper wall (if windows visible)
2. **Windows**: Light coming through
3. **Architecture**: Walls, columns, structural elements
4. **Floor**: Ground level with stains, markings
5. **Far machinery**: Equipment in background
6. **Far workers**: Workers behind machinery
7. **Particle effects (background)**: Smoke rising behind machines
8. **Near machinery**: Equipment in foreground
9. **Near workers**: Workers in foreground
10. **Particle effects (foreground)**: Sparks, steam in front
11. **Lighting overlay**: Ambient lighting, shadows
12. **UI elements**: Factory name, shift status

### Canvas Drawing
```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set pixel-perfect rendering
  ctx.imageSmoothingEnabled = false;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw layers
  drawBackground(ctx, layout, timeOfDay);
  drawArchitecture(ctx, layout, culturalZone, era);
  drawFloor(ctx, layout);
  drawMachinery(ctx, layout, frame, shiftActive);
  drawWorkers(ctx, layout, frame, shiftActive);
  drawParticles(ctx, particles);
  drawLighting(ctx, timeOfDay);
  drawUI(ctx, factoryName, shiftActive);

}, [frame, layout, timeOfDay, shiftActive]);
```

---

## Component Structure

### File Organization
```
components/factory/
├── FactoryInteriorBanner.tsx          (Main component)
├── factoryBannerRenderers/
│   ├── sugarPlantationRenderer.ts     (Sugar plantation specifics)
│   ├── textileMillRenderer.ts         (Textile mill specifics)
│   ├── steelMillRenderer.ts           (Steel mill specifics)
│   ├── railwayWorkshopRenderer.ts     (Railway workshop specifics)
│   ├── automobileFactoryRenderer.ts   (Automobile factory specifics)
│   └── electronicsFactoryRenderer.ts  (Electronics factory specifics)
├── factoryBannerParticles.ts          (Particle system classes)
├── factoryBannerColors.ts             (Color palettes)
└── factoryBannerUtils.ts              (Utility functions)
```

### Props Interface
```typescript
interface FactoryInteriorBannerProps {
  factoryType: FactoryType;
  era: HistoricalEra;
  culturalZone: CulturalZone;
  factoryName: string;
  width?: number;     // Default 1280
  height?: number;    // Default 220
  timeOfDay?: number; // 0-24 (default 12)
  shiftActive?: boolean; // Whether factory is running
  seed?: number;      // For consistent layout (default: hash of factoryName)
}
```

---

## Implementation Phases

### Phase 1: Canvas Foundation
- [ ] Convert from SVG to Canvas rendering
- [ ] Implement pixel-perfect rendering
- [ ] Set up animation loop with requestAnimationFrame
- [ ] Port RNG system from FarmBanner

### Phase 2: Color Palettes
- [ ] Define material colors for each era
- [ ] Define product colors for each factory type
- [ ] Create cultural color variations
- [ ] Implement color mixing utilities (shade, mix)

### Phase 3: Basic Factory Layouts
- [ ] Create renderer for sugar plantation
- [ ] Create renderer for textile mill
- [ ] Create renderer for steel mill
- [ ] Test layouts with different seeds

### Phase 4: Machinery Details
- [ ] Implement factory-specific machinery for each type
- [ ] Add mechanical animations (rotating wheels, moving belts)
- [ ] Add product/output rendering
- [ ] Add machinery state (running vs idle)

### Phase 5: Worker System
- [ ] Generate worker positions based on factory type and shift status
- [ ] Implement worker rendering (pixel art style)
- [ ] Add walking and work animation cycles
- [ ] Add cultural variations in worker appearance

### Phase 6: Particle Systems
- [ ] Implement steam particle system
- [ ] Implement spark particle system
- [ ] Implement smoke particle system
- [ ] Implement dust/lint particle system
- [ ] Add particle spawning logic based on machinery state

### Phase 7: Lighting & Atmosphere
- [ ] Dynamic lighting based on time of day
- [ ] Furnace/fire glow effects
- [ ] Window light rays (if daytime)
- [ ] Shadows and ambient occlusion
- [ ] Heat shimmer effects (for hot industries)

### Phase 8: Cultural Variants
- [ ] Implement European style variations
- [ ] Implement East Asian style variations
- [ ] Implement MENA style variations
- [ ] Implement South Asian style variations
- [ ] Implement other cultural zones

### Phase 9: Remaining Factory Types
- [ ] Create renderer for railway workshop
- [ ] Create renderer for automobile factory
- [ ] Create renderer for electronics factory
- [ ] Create renderer for cotton plantation

### Phase 10: Polish & Optimization
- [ ] Performance optimization (particle pooling, culling)
- [ ] Add subtle details (oil stains, wear patterns, debris)
- [ ] Fine-tune animations
- [ ] Test across all factory types and eras

---

## Why This Design Works

1. **Historical Authenticity**: Each factory type shows accurate machinery and processes for its era
2. **Visual Immersion**: Pixel art style with detailed rendering creates atmosphere
3. **Cultural Sensitivity**: Respects historical realities while showing diverse cultural contexts
4. **Dynamic Interest**: Animated machinery and particles keep the scene alive
5. **Consistent Quality**: Matches the high standard set by FarmBanner
6. **Educational Value**: Players learn what different factories actually looked like and how they operated

The factory interior banner becomes a beautiful, functional window into industrial history.
