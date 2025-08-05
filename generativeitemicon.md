# Roadmap: Generative Item Icon System

## 1. Vision & Core Principles

The vision is to create unique, visually informative, and aesthetically pleasing pixel art icons for every item in the game. Icons should reflect the item's type, material, rarity, and potentially its unique properties or cultural origin. The style should be high-detail 16/32-bit pixel art, consistent with the combat sprites, to create a cohesive and deeply immersive visual identity for the game world.

This moves beyond generic emojis to a system where players can visually identify an item's key characteristics at a glance.

### Core Principles:

1.  **Data-Driven:** The icon's appearance is a direct function of the `Item` object's data (`material`, `rarity`, `category`, etc.).
2.  **Modular & Layered:** Icons are assembled from a library of base shapes, material palettes, and effect overlays, rather than being hand-drawn individually.
3.  **Scalable:** The system must be easy to extend with new item types, materials, and effects without requiring a unique, hand-drawn sprite for every single item.
4.  **Aesthetically Charming:** The final result should be cohesive, readable at small sizes, and fit the game's established pixel-art style.

---

## 2. Technical Approach

The system will be built around a central React component that programmatically constructs an SVG icon based on the properties of an `Item` object.

1.  **`GenerativeItemIcon.tsx` Component:** This will be the core component that takes an `Item` object as a prop and renders a complete SVG icon. It will be responsible for selecting the correct base sprite, applying materials, and layering effects.

2.  **Base Sprite Library (`constants/items/baseSprites.ts`):**
    -   This file will contain an object mapping item categories or specific base IDs to SVG path data for the item's fundamental shape.
    -   Examples: TUNIC_BASE, SHOES_BASE, SANDALS_BASE, CAP_BASE
    -   Each base sprite will be designed with distinct layers that can be colored separately (e.g., a sword's blade, hilt, and pommel).

3.  **Material Palette Library (`constants/items/materialPalettes.ts`):**
    -   This file will map material names (e.g., 'Iron', 'Wood', 'Gold', 'Leather', 'Linen') to a set of colors.
    -   Each palette will include shades for `base`, `shadow`, and `highlight`, allowing for 3D-like shading on the 2D sprite.

4.  **Rarity & Effect Overlays:**
    -   **Rarity:** This will be implemented using SVG filters and simple layered paths to provide visual cues.
        -   `Uncommon`: A subtle green border glow.
        -   `Rare`: A more prominent blue glow.
        -   `Ultra-rare`: A pulsing purple aura.
        -   `Unique`: An animated golden glint effect.
    -   **Effects:** For items with status effects (e.g., a fire sword), an animated SVG filter or an additional layered path can be applied to create visual effects like flames, frost, or a venomous drip.

### Example Workflow for a "Rare Iron Sword":

1.  `GenerativeItemIcon` receives the `Item` object.
2.  It looks up the `SWORD_BASE` sprite from the library.
3.  It looks up the `IRON` palette (`base: '#8d99ae'`, `shadow: '#6b7280'`, `highlight: '#adb5bd'`).
4.  It applies the iron palette to the different layers of the sword sprite (e.g., `blade` layer gets the iron colors, `hilt` layer gets a `WOOD` or `LEATHER` palette).
5.  Because the item's `rarity` is 'Rare', it wraps the final SVG group in a filter that applies a blue `feDropShadow` and `feGaussianBlur` to create a glow effect.

---

## 3. Phased Implementation Plan

### Phase 1: Foundation (Weapons & Armor) - COMPLETE
-   **Goal:** Replace the most common emojis with a functional generative system.
-   **Tasks:**
    1.  Create the initial `GenerativeItemIcon.tsx` component structure.
    2.  Define base sprites in `constants/items/baseSprites.ts` for: Sword, Axe, Shield, Helmet, Chest Armor, Boots.
    3.  Define material palettes in `constants/items/materialPalettes.ts` for: Iron, Wood, Leather, Cloth.
    4.  Integrate the new component into the `InventoryPanel` and `EquipmentPanel`, replacing the existing emoji rendering for the specified item types.
    5.  Implement basic shading by coloring the different path layers of the base sprites.

### Phase 2: Expansion (Tools, Consumables & Rarity)
-   **Goal:** Expand the system to cover most item types and add visual feedback for rarity.
-   **Tasks:**
    1.  Add base sprites for: Accessories, Books, Food, Tools (Pickaxe, Hammer), Rings, Amulets.
    2.  Expand material palettes to include: Glass, Paper, Gold, Silver, Gemstones.
    3.  Implement the rarity glow/glint effects using SVG filters. The glow color should correspond to the rarity color scheme already used in the UI.

### Phase 3: Advanced Features & Polish
-   **Goal:** Add dynamic effects and cultural variations to make items feel truly unique.
-   **Tasks:**
    1.  Add support for magical effect overlays (e.g., animated `feTurbulence` for fire, a subtle blue pulse for ice, a green drip for poison).
    2.  Introduce cultural variations for base sprites (e.g., a `SCIMITAR_BASE` for MENA swords, a `KATANA_BASE` for East Asian swords). The `GenerativeItemIcon` will select the appropriate base sprite based on the item's (future) cultural origin property.
    3.  Develop a simple caching system (e.g., using `React.memo` and memoized props) to store generated SVG data strings and prevent re-rendering of identical items, ensuring high performance in large inventories.

### Phase 4: Integration with Procedural Generation
-   **Goal:** Fully integrate the icon system with procedurally generated items.
-   **Tasks:**
    1.  Ensure that `generateProceduralItemDefinition` in `inventoryUtils.ts` assigns appropriate base sprite keys and materials.
    2.  Create a fallback system within `GenerativeItemIcon.tsx` for items that might lack specific data, ensuring a visually appealing default icon is always rendered.



    # LLM Instructions: Expanding the Generative Item Icon System

## Vision & Goal

The primary goal is to create a library of SVG base shapes and material color palettes for a **realistic, educational history simulation game**. The visual style should be high-detail 16/32-bit pixel art.

**Crucially, this is NOT a fantasy RPG.** Avoid generic fantasy tropes. Instead of "Magic Sword" and "Health Potion," focus on the mundane, everyday items that define a historical period: different types of clothing, tools, and materials. The icons must be **data-driven** and visually reflect an item's properties.

---

## Instructions for `baseSprites.ts`

This file contains the fundamental shapes of items. Each icon is built from layered SVG paths within a **24x24 pixel art grid**.

### 1. File Structure

The `BASE_SPRITES` constant is an object where each key is an uppercase item identifier (e.g., `TUNIC`) and its value is another object containing SVG path data for its layers.

```typescript
export const BASE_SPRITES: Record<string, Record<string, string>> = {
    TUNIC: {
        base: "M6,8 L18,8 L20,20 L4,20 Z",
        trim: "M6,8 L18,8 L18,9 L6,9 Z"
    },
    // ... more items
};
```

### 2. SVG Path Data

-   All paths must be valid SVG `d` attribute strings.
-   All coordinates must be within a **24x24 viewBox**.
-   Paths should be simple and use straight lines (`M`, `L`, `Z`) or simple curves (`C`, `Q`) to maintain a pixel-art feel. Avoid complex splines.
-   Use integer coordinates where possible for crispness.

### 3. Layering System

Layers are key to creating a 3D effect through color. Use the following layer names to ensure the rendering component can apply materials correctly:

-   `base`: The main body of the item.
-   `shadow`: A separate path for the main shadow area.
-   `highlight`: A path for the main highlight.
-   `trim`: For edges, collars, cuffs, or decorative borders.
-   `detail`: For small, specific features (e.g., the wick of a lamp).
-   `haft` / `hilt`: For the handle of a tool or weapon.
-   `head` / `blade`: For the functional part of a tool or weapon.

**Example Breakdown (Tunic):**
-   `base`: The main torso and sleeve shape.
-   `trim`: A thin path around the collar and sleeve cuffs.
-   This allows the main tunic to be one color (e.g., from `LINEN_CLOTH`) and the trim to be another (e.g., from `OCHRE_RED` dye).

### 4. Required Item Sprites

Focus on adding historically plausible, everyday items. Prioritize the following:

-   **Clothing:** `TUNIC`, `HOOD`, `PANTS` (or `HOSE`), `DRESS`, `ROBE`, `CAP`, `SANDALS`, `BOOTS`. These are essential.
-   **Tools:** `HAMMER`, `KNIFE`, `PICKAXE`, `AXE`.
-   **Household Goods:** `BOWL`, `CLAY_LAMP`, `POT`, `CUP`.
-   **Materials:** A generic `INGOT` shape, a `LOG` shape, a bolt of `CLOTH`.

---

## Instructions for `materialPalettes.ts`

This file defines the color schemes that are applied to the layers of the base sprites. It is crucial to expand this beyond generic categories.

### 1. File Structure

The `MATERIAL_PALETTES` constant is an object where each key is an uppercase material identifier (e.g., `OAK_WOOD`) and its value is a `MaterialPalette` object.

```typescript
export interface MaterialPalette {
    base: string;
    shadow: string;
    highlight: string;
    accent?: string; // Optional, for details or trims
}

export const MATERIAL_PALETTES: Record<string, MaterialPalette> = {
    OAK_WOOD: {
        base: '#8b5a2b',
        shadow: '#5d3a1b',
        highlight: '#a06e3e',
    },
    // ... more materials
};
```

### 2. Color Selection

-   All colors must be in **6-digit hex format** (e.g., `#RRGGBB`).
-   Colors should be realistic and earthy. Avoid overly saturated, cartoony colors.
-   `shadow`: Should be a darker, often slightly less saturated version of `base`.
-   `highlight`: Should be a lighter version of `base`.
-   `accent`: Can be a complementary color or a much darker/brighter version for sharp details.

### 3. Required Material Palettes

Expand the palettes to match the materials used in the game's procedural generation (`clothing.ts`, `itemDefinitions.ts`).

-   **Fabrics (Crucial):** Don't just use "CLOTH". Create specific palettes for:
    -   `LINEN_CLOTH` (off-white, beige tones)
    -   `WOOL_CLOTH` (creamy, yellowish-white tones)
    -   `SILK_CLOTH` (brighter, more vibrant base colors)
    -   `HEMP_CLOTH` (rougher, brownish-beige tones)

-   **Natural Dyes (Very Important):** Create palettes for historical dyes that can be applied to fabrics.
    -   `OCHRE_RED` (earthy, brick red)
    -   `WELD_YELLOW` (bright, clear yellow)
    -   `INDIGO_BLUE` (deep, rich blue)
    -   `MADDER_RED` (a vibrant, slightly orange-red)
    -   `WOAD_BLUE` (a softer, grayer blue than indigo)
    -   `TYRIAN_PURPLE` (a deep, reddish-purple)
    -   `WALNUT_BROWN` (a dark, rich brown)

-   **Woods:**
    -   `OAK_WOOD` (standard mid-brown)
    -   `PINE_WOOD` (lighter, yellowish wood)
    -   `DARK_WOOD` (e.g., walnut, ebony)

-   **Leathers:**
    -   `TANNED_LEATHER` (rich, warm brown)
    -   `RAWHIDE` (pale, yellowish-tan)

-   **Metals:**
    -   `BRONZE` (dull, brownish-gold)
    -   `COPPER` (reddish-brown)
    -   `TIN` (dull silver)
    -   `LEAD` (dark, bluish-gray)

-   **Other Materials:**
    -   `CLAY_POTTERY` (terracotta/earthenware colors)
    -   `STONEWARE` (grayish, stony colors)
    -   `BONE` (ivory, off-white)

---

## Final Checklist

1.  **Is the new sprite for a historically plausible item?**
2.  **Does the sprite use a layered SVG path structure?**
3.  **Are all coordinates within the 24x24 grid?**
4.  **Is the new material palette realistic and specific?**
5.  **Does the palette include `base`, `shadow`, and `highlight` colors?**
6.  **Do the new palettes correspond to materials actually used in the game's procedural generation?**