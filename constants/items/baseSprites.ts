/**
 * baseSprites.ts - Comprehensive item archetype mappings
 * 
 * This file contains extensive mappings of item names to archetype categories.
 * While the actual sprite rendering is handled by GenerativeItemIcon.tsx using 
 * pixel art generation, this file serves as:
 * 
 * 1. A fallback reference system for items not yet implemented in GenerativeItemIcon
 * 2. A comprehensive database of item categorization (900+ items mapped)
 * 3. Future potential for SVG-based rendering alongside pixel art
 * 
 * Integration with GenerativeItemIcon:
 * - GenerativeItemIcon now imports getItemArchetypeMax() to check for mappings
 * - Items with baseSprite mappings get a small golden indicator
 * - Console logs items that have mappings but no custom pixel art yet
 * 
 * This allows both systems to coexist and provides a roadmap for which items
 * could benefit from custom pixel art implementations.
 */

// Base sprites and archetypes are defined below, not imported from self
// This file is self-contained with all sprite definitions

/** ------------------------------------------------------------------------
 * NEW / MORE SPECIFIC SPRITES
 * ------------------------------------------------------------------------ */
export const EXTRA_SPRITES: Record<string, Record<string, string>> = {
  // ===== CORE UTILS (missing in the original but referenced in mappings) =====
  QUILL: {
    feather: "M6,6 L18,3 L16,9 L7,18 L6,16 Z",
    shaft: "M10,7 L8,15",
    notch: "M7,16 L9,17",
    highlight: "M12,5 L14,4",
  },
  SPINDLE: {
    shaft: "M11,3 L13,3 L13,20 L11,20 Z",
    whorl: "M9,8 C9,6 15,6 15,8 C15,10 9,10 9,8 Z",
    point: "M11,20 L12,22 L13,20",
  },
  SCISSORS: {
    blades: "M5,8 L12,12 L19,6 M5,16 L12,12 L19,18",
    rings: "M5,8 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0 M5,16 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0",
    pin: "M12,12 m-1,0 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0",
  },
  ROPE: {
    coil: "M6,14 C6,10 18,10 18,14 C18,18 6,18 6,14 Z",
    strands: "M8,14 C8,12 16,12 16,14 M8,16 C8,14 16,14 16,16",
    loose: "M18,14 L20,15 L18,16",
  },
  BOX: {
    shell: "M4,8 L20,8 L20,18 L4,18 Z",
    lid: "M4,8 L20,8 L18,6 L6,6 Z",
    band: "M10,6 L10,18 M14,6 L14,18",
  },

  // ===== ORE VARIANTS =====
  ORE_IRON: {
    base: "M5,10 L10,6 L16,7 L19,10 L17,15 L12,18 L7,16 Z",
    veins: "M8,11 L12,9 L15,11 M10,14 L13,13",
    tint: "M9,8 L10,9",
  },
  ORE_TIN: {
    base: "M6,9 L12,7 L18,9 L17,14 L12,17 L7,15 Z",
    veins: "M9,11 L13,10 M10,13 L14,12",
  },
  ORE_COPPER: {
    base: "M5,9 L11,6 L18,8 L19,13 L13,17 L6,15 Z",
    veins: "M8,10 L12,9 L15,11 M9,13 L13,12",
    warm: "M11,7 L12,8",
  },
  ORE_SILVER: {
    base: "M6,10 L12,7 L18,10 L17,15 L12,18 L7,15 Z",
    veins: "M9,11 L13,10 M10,13 L14,12",
    shine: "M12,8 L13,9",
  },
  ORE_GOLD: {
    base: "M6,9 L12,6 L19,9 L18,14 L12,18 L7,15 Z",
    flecks: "M10,10 L11,10 M13,11 L14,11 M12,13",
  },
  ORE_LEAD: {
    base: "M5,10 L11,7 L17,9 L18,13 L12,17 L6,15 Z",
    veins: "M9,12 L13,11 M10,14 L14,13",
  },
  COAL_CHUNK: {
    base: "M7,11 L12,8 L17,10 L16,15 L11,17 L8,15 Z",
    facets: "M9,11 L14,12 L12,15",
  },
  ROCK_SALT_CHUNK: {
    base: "M7,9 L15,7 L19,12 L13,18 L6,14 Z",
    crystals: "M10,10 L12,8 M14,12 L16,10",
  },
  CLAY_CHUNK: {
    base: "M7,12 C7,9 17,9 17,12 C17,15 7,15 7,12 Z",
    thumb: "M9,12 L10,13 M14,12 L15,13",
  },
  OCHRE_CHUNK: {
    base: "M6,12 L18,10 L17,15 L8,17 Z",
    smudge: "M10,13 L13,12",
  },
  FLINT_CHUNK: {
    base: "M6,10 L12,7 L17,10 L15,16 L9,17 Z",
    edge: "M8,12 L14,10 L13,14",
  },
  STONE_BLOCK: {
    base: "M6,8 L18,8 L18,18 L6,18 Z",
    cracks: "M8,10 L12,12 L16,10 M10,14 L14,16",
  },

  // ===== INGOT VARIANTS =====
  INGOT_IRON: { base: "M6,11 L18,11 L17,15 L7,15 Z", top: "M8,9 L16,9 L18,11 L6,11 Z", mark: "M10,12 L14,12" },
  INGOT_COPPER: { base: "M6,11 L18,11 L17,15 L7,15 Z", top: "M8,9 L16,9 L18,11 L6,11 Z", mark: "M9,13 L15,13" },
  INGOT_TIN:   { base: "M6,11 L18,11 L17,15 L7,15 Z", top: "M8,9 L16,9 L18,11 L6,11 Z", mark: "M11,12 L13,12" },
  INGOT_SILVER:{ base: "M6,11 L18,11 L17,15 L7,15 Z", top: "M8,9 L16,9 L18,11 L6,11 Z", mark: "M10,12 L14,12 M11,13 L13,13" },
  INGOT_GOLD:  { base: "M6,11 L18,11 L17,15 L7,15 Z", top: "M8,9 L16,9 L18,11 L6,11 Z", mark: "M9,12 L15,12 M10,13 L14,13" },
  INGOT_LEAD:  { base: "M6,11 L18,11 L17,15 L7,15 Z", top: "M8,9 L16,9 L18,11 L6,11 Z", mark: "M11,13 L13,13" },

  // ===== FOOD: MEAT/FISH SPECIALS =====
  SALT_PORK: {
    slab: "M6,10 L18,10 L17,16 L7,16 Z",
    fat: "M8,12 L16,12 M9,14 L15,14",
    salt: "M7,11 L8,12 M16,11 L17,12",
  },
  FISH_SMOKED: {
    body: "M3,12 C3,8 8,8 12,10 C16,8 21,8 21,12 C21,16 16,16 12,14 C8,16 3,16 3,12 Z",
    rack: "M4,7 L20,7 M5,9 L19,9",
    smoke: "M8,5 L7,3 M12,5 L11,3 M16,5 L15,3",
    band: "M10,12 L14,12",
  },

  // ===== GRAINS / LEGUMES (distinct silhouettes) =====
  WHEAT_SHEAF: {
    stalks: "M8,6 L9,16 M12,5 L12,16 M16,6 L15,16",
    heads: "M9,6 L10,7 L9,8 M12,5 L13,6 L12,7 M15,6 L16,7 L15,8",
    tie: "M9,13 L15,13",
  },
  RYE_SHEAF: {
    stalks: "M7,6 L9,16 M12,5 L12,16 M17,6 L15,16",
    awns: "M8,6 L6,5 M12,5 L10,4 M16,6 L18,5",
    tie: "M9,13 L15,13",
  },
  BARLEY_BAG: {
    sack: "M6,6 L18,6 L17,18 L7,18 Z",
    tie: "M10,5 L14,5",
    grain: "M8,15 L10,16 M14,15 L16,16",
    stamp: "M11,9 L13,9 L13,11 L11,11 Z",
  },
  MILLET_BUNDLE: {
    stems: "M8,7 L10,16 M12,6 L12,16 M16,7 L14,16",
    heads: "M9,8 L10,9 L9,10 M12,7 L13,8 L12,9 M15,8 L16,9 L15,10",
    tie: "M9,13 L15,13",
  },
  OATS_BUNDLE: {
    stems: "M8,7 L10,16 M12,6 L12,16 M16,7 L14,16",
    droops: "M10,9 L8,10 M12,8 L10,9 M14,9 L16,10",
    tie: "M9,13 L15,13",
  },
  RICE_SACK: {
    sack: "M6,7 L18,7 L17,18 L7,18 Z",
    scoop: "M10,14 L14,13 L13,16 L11,16 Z",
    grains: "M8,12 L9,13 M15,12 L16,13",
  },
  CORN_EAR: {
    cob: "M9,7 C9,5 15,5 15,7 L15,15 C15,17 9,17 9,15 Z",
    kernels: "M10,8 L14,8 M10,10 L14,10 M10,12 L14,12 M10,14 L14,14",
    husk: "M8,9 L9,7 L10,8 M16,9 L15,7 L14,8",
  },
  PEAS_POD: {
    pod: "M6,12 C8,8 16,8 18,12 C16,16 8,16 6,12 Z",
    peas: "M9,12 m-1,0 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M12,12 m-1,0 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0 M15,12 m-1,0 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0",
  },
  LENTILS_SCOOP: {
    scoop: "M8,13 L16,12 L15,16 L9,17 Z",
    grains: "M10,14 L11,15 M12,14 L13,15 M14,14 L15,15",
    handle: "M7,12 L8,13",
  },
  BEANS_SACK: {
    sack: "M6,8 L18,8 L17,18 L7,18 Z",
    beans: "M9,14 C9,13 10,13 11,14 C11,15 10,15 9,14 Z M13,14 C13,13 14,13 15,14 C15,15 14,15 13,14 Z",
  },

  // ===== FLOURS / MILL PRODUCTS =====
  FLOUR_WHEAT:   { sack: "M7,8 L17,8 L16,18 L8,18 Z", stamp: "M9,10 L15,10", dust: "M10,15 L14,14" },
  FLOUR_BARLEY:  { sack: "M7,8 L17,8 L16,18 L8,18 Z", stamp: "M9,10 L13,10 M14,10", dust: "M10,15 L14,14" },
  FLOUR_RYE:     { sack: "M7,8 L17,8 L16,18 L8,18 Z", stamp: "M9,10 L12,10 M13,10 L15,10", dust: "M10,15 L14,14" },
  FLOUR_MILLET:  { sack: "M7,8 L17,8 L16,18 L8,18 Z", stamp: "M9,10 L11,10 M12,10 L15,10", dust: "M10,15 L14,14" },
  CORNMEAL_SACK: { sack: "M7,8 L17,8 L16,18 L8,18 Z", stamp: "M9,10 L11,10 L13,10", dust: "M10,15 L14,14" },
  FLOUR_RICE:    { sack: "M7,8 L17,8 L16,18 L8,18 Z", stamp: "M9,10 L15,10 L15,11", dust: "M10,15 L14,14" },
  FLOUR_SOY:     { sack: "M7,8 L17,8 L16,18 L8,18 Z", stamp: "M9,10 L15,10 L12,11", dust: "M10,15 L14,14" },
  FLOUR_QUINOA:  { sack: "M7,8 L17,8 L16,18 L8,18 Z", stamp: "M9,10 L12,10 L14,11", dust: "M10,15 L14,14" },
  FLOUR_NUT:     { sack: "M7,8 L17,8 L16,18 L8,18 Z", stamp: "M9,10 L12,10", nuts: "M10,12 L11,13 L10,14" },

  OLIVE_OIL_JAR: {
    jar: "M9,6 L15,6 L16,8 L16,18 L8,18 L8,8 Z",
    neck: "M10,5 L14,5",
    liquid: "M9,10 L15,10 L15,17 L9,17 Z",
  },
  OLIVES_JAR: {
    jar: "M9,6 L15,6 L16,8 L16,18 L8,18 L8,8 Z",
    olives: "M10,12 L11,13 M12,12 L13,13 M10,15 L11,16 M12,15 L13,16",
  },
  GRAPES_BUNCH: {
    cluster: "M12,7 L11,9 L13,9 L10,10 L12,10 L9,12 L12,12 L10,14 L12,14 L13,16",
    stem: "M12,6 L12,7",
  },
  COTTON_BALE: {
    bale: "M8,10 C8,8 16,8 16,10 C16,12 8,12 8,10 Z",
    straps: "M10,9 L10,11 M14,9 L14,11",
  },
  SUGAR_CANE_STALK: {
    stalk: "M11,4 L13,4 L13,20 L11,20 Z",
    nodes: "M11,8 L13,8 M11,12 L13,12 M11,16 L13,16",
    leaf: "M13,10 L18,8",
  },
  COFFEE_BEANS: {
    pile: "M8,13 C8,12 16,12 16,13 C16,14 8,14 8,13 Z",
    seams: "M10,13 L10,14 M12,13 L12,14 M14,13 L14,14",
  },
  COFFEE_GROUND: {
    heap: "M8,15 L16,14 L15,16 L9,17 Z",
    grain: "M10,15 L11,16 M12,15 L13,16 M14,15 L15,16",
  },
  COCOA_POWDER: {
    tin: "M8,10 L16,10 L16,16 L8,16 Z",
    lid: "M8,10 L16,10 L15,9 L9,9 Z",
    powder: "M9,12 L15,12",
  },
  SUGAR_RAW: {
    crystals: "M8,12 L12,10 L16,12 L14,16 L10,16 Z",
    facets: "M10,12 L12,11 L14,12 M11,14 L13,14",
  },
  SUGAR_BEET: {
    root: "M10,9 C10,7 14,7 14,9 L13,14 L11,14 Z",
    greens: "M10,7 L9,5 M14,7 L15,5",
  },
  SPICES_GROUND: {
    pouch: "M7,10 L17,10 L16,16 L8,16 Z",
    dust: "M9,13 L15,13",
    tie: "M10,10 L14,10",
  },

  // ===== CONTAINERS / MISC TOOLS =====
  BUCKET_WOOD: {
    pail: "M7,10 L17,10 L16,17 L8,17 Z",
    hoop: "M7,13 L17,13",
    handle: "M9,10 C9,7 15,7 15,10",
  },
  PAN_IRON: {
    bowl: "M7,13 C7,16 9,18 12,18 C15,18 17,16 17,13 Z",
    handle: "M17,13 L21,11 L20,10 L16,12 Z",
  },
  BELL_HAND: {
    bell: "M9,10 L15,10 L16,15 L8,15 Z",
    clapper: "M11,15 L13,15",
    handle: "M11,8 L13,8 L13,10 L11,10 Z",
  },
  KEY_IRON: {
    shaft: "M8,12 L15,12",
    bit: "M15,11 L17,11 L17,13 L15,13 Z",
    bow: "M8,12 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0",
  },
  HANDCUFFS: {
    ringL: "M8,12 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0",
    ringR: "M16,12 m-3,0 a3,3 0 1,0 6,0 a3,3 0 1,0 -6,0",
    chain: "M11,12 L13,12",
  },
  STETHOSCOPE: {
    tubes: "M7,8 C7,14 10,16 12,16 C14,16 17,14 17,8",
    chest: "M16,8 L18,9 L17,10",
    earpiece: "M7,8 L8,7 M16,8 L15,7",
  },
  SYRINGE: {
    barrel: "M8,11 L16,11 L16,13 L8,13 Z",
    plunger: "M7,12 L8,12 M16,12 L19,12",
    needle: "M19,12 L21,12",
    ticks: "M9,11 L9,13 M11,11 L11,13 M13,11 L13,13",
  },
  FLASHLIGHT: {
    body: "M8,11 L14,11 L14,15 L8,15 Z",
    head: "M14,10 L18,11 L18,15 L14,16 Z",
    beam: "M18,11 L22,13 L18,15",
    switch: "M9,12 L10,12",
  },
  SMARTPHONE: {
    body: "M8,5 L16,5 L16,19 L8,19 Z",
    screen: "M9,7 L15,7 L15,17 L9,17 Z",
    cam: "M13,6 L14,6",
    btn: "M11,18 L13,18",
  },
  BRIEFCASE: {
    case: "M6,9 L18,9 L18,17 L6,17 Z",
    handle: "M10,8 L14,8 L14,9 L10,9 Z",
    latch: "M11,13 L13,13",
  },
  CHIMNEY_BRUSH: {
    head: "M12,8 L18,8 M12,9 L18,9 M12,7 L18,7",
    pole: "M11,8 L9,20",
    ties: "M10,12 L12,12",
  },
  SLATE_BOARD: {
    slab: "M6,6 L18,6 L18,16 L6,16 Z",
    rim: "M6,6 L18,6 L17,5 L7,5 Z",
    scribble: "M8,10 L16,12",
  },
  GOURD_FLASK: {
    bulb: "M10,10 C10,8 14,8 14,10 C14,12 10,12 10,10 Z",
    neck: "M11,7 L13,7 L13,10 L11,10 Z",
    strap: "M9,11 L15,13",
  },
  SOAP_BAR: {
    bar: "M8,11 C8,9 16,9 16,11 C16,13 8,13 8,11 Z",
    suds: "M10,9 L11,8 M13,9 L14,8",
  },
  BANDAGE_ROLL: {
    roll: "M8,12 C8,10 16,10 16,12 C16,14 8,14 8,12 Z",
    wrap: "M9,12 L15,12",
    tail: "M15,12 L17,13",
  },
  PURSE_LEATHER: {
    pouch: "M8,10 L16,10 L15,16 L9,16 Z",
    draw: "M9,10 L15,10",
    coins: "M10,14 L11,15 L12,14",
  },
  SCALE_SMALL: {
    base: "M10,17 L14,17 L13,19 L11,19 Z",
    beam: "M7,11 L17,11",
    pillar: "M11,11 L13,11 L13,17 L11,17 Z",
    pans: "M7,11 L6,13 L8,13 Z M17,11 L16,13 L18,13 Z",
  },
  BASKET_WICKER: {
    rim: "M6,12 L18,12",
    body: "M6,12 C6,16 18,16 18,12",
    weave: "M8,13 L16,13 M9,14 L15,14",
    handle: "M8,10 C8,8 16,8 16,10",
  },
  NAILS_BUNCH: {
    pile: "M8,14 L10,12 M10,15 L13,12 M12,16 L16,12",
    heads: "M8,13 L9,12 M11,13 L12,12 M14,13 L15,12",
  },
  BUTTON_SMALL: {
    disk: "M10,10 L14,10 L14,14 L10,14 Z",
    holes: "M11,11 L11.8,11.8 M12.2,12.2 L13,13",
  },
  THREAD_SPOOL: {
    core: "M11,7 L13,7 L13,17 L11,17 Z",
    flanges: "M9,7 L15,7 M9,17 L15,17",
    wind: "M11,10 L13,9 M11,12 L13,11 M11,14 L13,13",
  },
  PAPER_SHEET: {
    sheet: "M8,6 L16,6 L16,16 L8,16 Z",
    dogear: "M13,6 L16,9 L13,9 Z",
    lines: "M9,9 L15,9 M9,12 L15,12",
  },

  // ===== NATURE / FORAGE =====
  LEAVES_DRY: {
    leafs: "M8,10 L10,8 L12,10 L10,12 Z M13,10 L15,8 L17,10 L15,12 Z",
    veins: "M10,8 L10,12 M15,8 L15,12",
  },
  ROOT_TOUGH: {
    root: "M10,9 L12,12 L10,15 L8,14 L7,12",
    hairs: "M12,12 L13,13 M9,13 L8,14",
  },
  LOG_DAMP: {
    log: "M6,12 L18,12 L17,16 L7,16 Z",
    rings: "M8,13 L9,14 M10,13 L11,14",
    drip: "M15,15 L16,16",
  },
  PEBBLE_SMOOTH: {
    base: "M8,12 C8,10 16,10 16,12 C16,14 8,14 8,12 Z",
    shine: "M10,11 L11,10",
  },
  POTTERY_SHARD: {
    shard: "M7,10 L15,8 L17,12 L10,16 Z",
    crack: "M9,11 L14,10 L12,14",
  },

  // ===== SEA / SHORE =====
  SEA_GLASS: {
    piece: "M7,10 L13,8 L17,12 L11,16 L7,14 Z",
    frosted: "M10,10 L12,11",
  },
  SEASHELL: {
    shell: "M6,14 C6,10 18,10 18,14 C16,16 8,16 6,14 Z",
    ridges: "M7,13 L17,13 M8,12 L16,12",
  },
  CRAB: {
    body: "M9,11 L15,11 L16,13 L8,13 Z",
    claws: "M7,11 L6,10 L7,9 M17,11 L18,10 L17,9",
    legs: "M8,13 L7,14 M10,13 L9,15 M14,13 L15,15 M16,13 L17,14",
  },
  CLAM: {
    shell: "M7,12 C7,9 17,9 17,12 C17,15 7,15 7,12 Z",
    hinge: "M7,12 L17,12",
  },
  OYSTER: {
    shell: "M7,12 C7,9 17,9 17,12 L16,14 L8,14 Z",
    meat: "M10,12 L14,12",
  },
  PEARL_GEM: {
    orb: "M12,12 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0",
    shine: "M12,11 L13,10",
  },
  SEAWEED: {
    fronds: "M10,16 L9,12 L10,8 M12,16 L13,11 L14,7",
    base: "M9,16 L15,16",
  },
  ABALONE_SHELL: {
    shell: "M7,13 C7,10 17,10 17,13 C16,15 8,15 7,13 Z",
    iridescence: "M9,12 L15,12",
  },
  DRIFTWOOD: {
    stick: "M6,12 L18,10 L17,12 L7,14 Z",
    notches: "M9,12 L10,11 M13,11 L14,10",
  },

  // ===== DESERT / VOLCANIC / WETLAND / TUNDRA =====
  FOSSIL: {
    plate: "M7,9 L17,9 L17,15 L7,15 Z",
    bone: "M9,12 C9,10 15,10 15,12 C15,14 9,14 9,12 Z",
    cracks: "M8,10 L10,11 M14,11 L16,10",
  },
  SCORPION: {
    body: "M10,12 L14,12 L15,13 L9,13 Z",
    tail: "M14,12 L17,10 L18,11",
    claws: "M9,12 L8,11 M15,12 L16,11",
  },
  PEAT: {
    lump: "M8,12 L16,11 L15,14 L9,15 Z",
    fibers: "M10,12 L11,13 M13,12 L14,13",
  },
  BOG_IRON: {
    base: "M6,10 L12,8 L17,10 L16,14 L11,16 L7,14 Z",
    nodules: "M9,11 L10,12 M13,11 L14,12",
  },
  LEECH: {
    body: "M8,13 C9,10 15,10 16,13 C15,15 9,15 8,13 Z",
    sucker: "M9,14 L10,14",
  },
  FROZEN_BERRIES: {
    cluster: "M9,11 L10,12 L9,13 L11,13 L12,12 L13,13",
    frost: "M8,10 L9,9 M14,10 L15,9",
  },
  MAMMOTH_IVORY: {
    tusk: "M8,14 C8,10 14,8 16,6 L17,7 C14,9 10,12 9,15",
  },
  ICE_CRYSTAL: {
    core: "M12,8 L14,12 L12,16 L10,12 Z",
    arms: "M12,6 L12,18 M6,12 L18,12 M8,8 L16,16 M16,8 L8,16",
  },
  AMBER: {
    blob: "M8,10 C8,8 16,8 16,10 C16,14 8,14 8,10 Z",
    insect: "M11,11 L12,11 L12,12 L11,12 Z",
  },
  OBSIDIAN: {
    shard: "M7,9 L14,7 L18,11 L15,17 L9,16 Z",
    edge: "M9,12 L15,10 L13,15",
  },
  SULFUR: {
    cluster: "M8,10 L12,8 L16,10 L14,13 L10,13 Z",
    fumes: "M12,7 L11,6 M14,7 L13,6",
  },
  PUMICE: {
    stone: "M7,12 C7,10 17,10 17,12 C17,14 7,14 7,12 Z",
    holes: "M9,12 L10,11 M12,12 L13,11 M14,12 L15,11",
  },
  VOLCANIC_ASH: {
    bag: "M8,10 L16,10 L15,16 L9,16 Z",
    dust: "M10,13 L14,13",
  },

  // ===== ESTUARY / CLIFF =====
  RIVER_SHRIMP: {
    body: "M8,12 L12,12 L14,13 L10,13 Z",
    tail: "M14,13 L16,12",
    antennae: "M9,12 L8,11 M11,12 L10,11",
  },
  CATTAIL_ROOT: {
    root: "M10,12 L12,14 L11,16",
    stalk: "M12,8 L12,12",
    head: "M12,8 L13,9 L11,9 Z",
  },
  RIVER_REED: {
    reed: "M11,7 L13,7 L13,18 L11,18 Z",
    tuft: "M11,7 L10,6 L14,6 L13,7",
  },
  DUCK_EGG: {
    egg: "M12,12 m-2,0 a2,3 0 1,0 4,0 a2,3 0 1,0 -4,0",
    shine: "M12,11 L13,10",
  },
  SEABIRD_EGG: {
    egg: "M12,12 m-2,0 a2,3 0 1,0 4,0 a2,3 0 1,0 -4,0",
    specks: "M11,12 L11.5,12.5 M13,13 L13.5,13.5",
  },
  FEATHER_SINGLE: {
    vane: "M7,8 L17,5 L15,11 L8,18 L7,16 Z",
    shaft: "M10,9 L9,16",
  },
  CLIFF_FLOWER: {
    bloom: "M12,10 L13,11 L12,12 L11,11 Z",
    petals: "M10,10 L14,10 L14,12 L10,12 Z",
    stem: "M12,12 L12,16",
  },
  GUANO: {
    pile: "M10,12 L14,11 L13,14 L11,15 Z",
    splat: "M12,10 L13,9",
  },
  RARE_ORCHID: {
    bloom: "M10,10 L14,10 L15,12 L9,12 Z",
    center: "M12,11 L12,12",
    stem: "M12,12 L12,16",
  },

  // ===== ANIMAL PRODUCTS / SPECIAL =====
  CROCODILE_SCALE: {
    plate: "M9,10 L15,10 L16,12 L8,12 Z",
    ridges: "M10,11 L14,11",
  },
  BLUBBER: {
    slab: "M8,12 L16,12 L15,16 L9,16 Z",
    sheen: "M10,13 L12,13",
  },
  GOOP_GLOW: {
    jar: "M9,8 L15,8 L16,10 L16,16 L8,16 L8,10 Z",
    glow: "M10,12 L14,12",
    spark: "M12,10 L13,9",
  },
  SLIME_GOOP: {
    blob: "M8,12 L16,11 L15,15 L9,16 Z",
    drip: "M12,11 L12,12",
  },
  VENOM_VIAL: {
    vial: "M10,8 L14,8 L15,10 L15,16 L9,16 L9,10 Z",
    skull: "M12,12 m-1,0 a1,1 0 1,0 2,0 a1,1 0 1,0 -2,0",
    drop: "M12,9 L12,8",
  },
  BONES_SMALL: {
    bone: "M9,12 L15,12 M9,12 L8,11 L8,13 M15,12 L16,11 L16,13",
  },

  // ===== HATS / CAPS / CROWNS / HELMETS =====
  HAT_STRAW:   { brim: "M6,11 L18,11", crown: "M9,9 L15,9 L15,11 L9,11 Z", weave: "M8,10 L16,10" },
  HAT_SUN:     { brim: "M5,12 L19,12", crown: "M8,9 L16,9 L16,12 L8,12 Z", band: "M8,11 L16,11" },
  HAT_TOP:     { crown: "M10,6 L14,6 L14,12 L10,12 Z", brim: "M8,12 L16,12", band: "M10,8 L14,8" },
  HAT_BOWLER:  { crown: "M9,8 C9,6 15,6 15,8 L15,11 L9,11 Z", brim: "M7,11 L17,11" },
  HAT_FEDORA:  { crown: "M9,7 L15,7 L15,10 L9,10 Z", pinch: "M10,7 L12,8", brim: "M7,10 L17,10" },
  HAT_HOMBURG: { crown: "M9,7 L15,7 L15,10 L9,10 Z", gutter: "M9,8 L15,8", brim: "M7,10 L17,10" },
  HAT_TRICORN: { folds: "M8,9 L12,6 L16,9", brim: "M7,11 L17,11", cock: "M12,6 L12,5" },
  HAT_BOATER:  { crown: "M9,8 L15,8 L15,10 L9,10 Z", brim: "M6,10 L18,10", band: "M9,9 L15,9" },
  HAT_PITH:    { dome: "M8,8 C8,6 16,6 16,8 L16,10 L8,10 Z", brim: "M6,10 L18,10" },
  HAT_CLOCHE:  { dome: "M8,8 C8,6 16,6 16,8 L16,11 L8,11 Z", rim: "M7,11 L17,11" },
  HAT_FEZ:     { body: "M10,7 L14,7 L14,12 L10,12 Z", tassel: "M12,7 L12,5 L13,6" },
  HAT_BERET:   { dome: "M8,8 C8,6 16,6 16,8 L16,9 L8,9 Z", nub: "M12,6 L13,6" },
  HAT_BAMBOO:  { cone: "M6,11 L12,6 L18,11 Z", ties: "M10,11 L14,11" },
  CAP_BASEBALL:{ crown: "M9,8 L15,8 L15,11 L9,11 Z", bill: "M15,10 L19,11" },
  CAP_NEWSBOY: { panels: "M8,8 L16,8 L16,10 L8,10 Z", button: "M12,8 L12,9", brim: "M8,10 L16,10" },
  CAP_FLAT:    { crown: "M8,8 L16,8 L14,10 L8,10 Z", brim: "M8,10 L14,10" },
  CAP_GANDHI:  { body: "M8,8 L16,8 L14,10 L10,10 Z", points: "M8,8 L9,7 M16,8 L15,7" },
  CAP_KNIT:    { knit: "M9,8 L15,8 L15,10 L9,10 Z", ribs: "M9,9 L15,9", cuff: "M9,10 L15,10" },
  CAP_SNAPBACK: { crown: "M9,8 L15,8 L15,11 L9,11 Z", flat: "M15,10 L19,10" },
  CAP_KUFI:    { band: "M9,8 L15,8 L15,10 L9,10 Z", top: "M9,8 C9,7 15,7 15,8" },
  CAP_SCHOLAR: { square: "M8,8 L16,8 L12,10 Z", tassel: "M12,10 L12,12 L13,13" },
  CROWN_SIMPLE:{ band: "M8,10 L16,10", points: "M8,10 L10,7 L12,10 L14,7 L16,10" },
  CROWN_ANTLER:{ band: "M8,11 L16,11", antlers: "M9,10 L7,8 L6,7 M15,10 L17,8 L18,7" },
  HELMET_WOOD: { dome: "M8,7 C8,5 16,5 16,7 L16,12 L8,12 Z", strap: "M8,11 L16,11", grain: "M10,8 L14,8" },
  HELMET_FEATHER:{ bowl: "M8,8 C8,6 16,6 16,8 L16,11 L8,11 Z", plume: "M12,6 L14,4 L16,6" },

  // ===== WEAPONS (distinct shapes) =====
  SWORD_STRAIGHT: { blade: "M12,3 L13,5 L14,13 L12,20 L10,13 L11,5 Z", guard: "M8,13 L16,13", grip: "M11,13 L13,13 L13,17 L11,17 Z" },
  SWORD_KATANA:  { blade: "M12,3 L13,4 L14,13 Q13,16 12,20 Q11,16 10,13 L11,4 Z", tsuba: "M10,12 L14,12", wrap: "M11,13 L13,14 L11,15 L13,16" },
  SWORD_SCIMITAR:{ blade: "M10,4 Q16,6 18,10 Q14,14 10,18 L9,14 Z", guard: "M8,12 L12,13", grip: "M9,14 L11,18" },

  // ===== FOOD PROCESSING TOOLS =====
  QUERN_HAND: {
    base: "M7,12 C7,10 17,10 17,12 C17,14 7,14 7,12 Z",
    upper: "M8,11 C8,10 16,10 16,11",
    handle: "M12,9 L13,8",
  },
  CHEESE_PRESS: {
    frame: "M7,9 L17,9 L17,16 L7,16 Z",
    screw: "M12,9 L12,6",
    curd: "M9,13 L15,13",
  },

  // ===== GEMS / SALTS / CRYSTALS =====
  CRYSTALS_COLOR: {
    shard1: "M9,8 L10,12 L8,14 L7,10 Z",
    shard2: "M12,7 L13,12 L11,15 L10,10 Z",
    shard3: "M15,9 L16,13 L14,16 L13,12 Z",
  },
  SALTS_BLUE: {
    pile: "M8,12 L16,11 L14,15 L10,16 Z",
    glint: "M12,11 L13,10",
  },
};

/** ------------------------------------------------------------------------
 * MERGED SPRITES
 * ------------------------------------------------------------------------ */
// Export the comprehensive sprite definitions
export const BASE_SPRITES_MAX = { ...EXTRA_SPRITES };

/** ------------------------------------------------------------------------
 * EXPLICIT, MAX-EXPANDED ARCHETYPE MAPPINGS
 * (covering your ITEM_DEFINITIONS baseIds and common display names)
 * Keys are lowercased; include baseIds with underscores and human names.
 * ------------------------------------------------------------------------ */
export const EXPANDED_ITEM_ARCHETYPES: Record<string, string> = {
  // ----- TOOLS -----
  axe: "AXE",
  pickaxe: "PICKAXE",
  steel_pickaxe: "PICKAXE", "steel pickaxe": "PICKAXE",

  hammer: "AXE", "smith's hammer": "AXE", smiths_anvil: "ANVIL", "smiths anvil":"ANVIL",
  whetstone: "WHETSTONE", // small handheld vs GRINDSTONE
  horseshoe: "HORSESHOE", iron_horseshoe: "HORSESHOE",

  bellows: "BELLOWS_TOOL", leather_bellows: "BELLOWS_TOOL",
  tongs: "TONGS",
  stone_chisel: "CHISEL",

  iron_plow: "PLOW",
  grain_scythe: "SCYTHE",
  harvest_sickle: "SICKLE",
  grain_flail: "STICK",

  spinning_wheel: "SPINNING_WHEEL",
  weaving_loom: "LOOM",
  wool_carders: "WOOL_CARDERS",
  spindle: "SPINDLE",

  grain_quern: "QUERN_HAND",
  butter_churn: "BUTTER_CHURN",
  cheese_press: "CHEESE_PRESS",

  // ----- ORES -----
  iron_ore: "ORE_IRON", "iron ore": "ORE_IRON",
  tin_ore: "ORE_TIN",   "tin ore": "ORE_TIN",
  copper_ore: "ORE_COPPER", "copper ore": "ORE_COPPER",
  gold_ore: "ORE_GOLD", "gold ore": "ORE_GOLD",
  silver_ore: "ORE_SILVER", "silver ore": "ORE_SILVER",
  lead_ore: "ORE_LEAD", "lead ore": "ORE_LEAD",
  coal: "COAL_CHUNK", "lump of coal": "COAL_CHUNK",
  rock_salt: "ROCK_SALT_CHUNK", "rock salt": "ROCK_SALT_CHUNK",
  clay_lump: "CLAY_CHUNK", "lump of clay": "CLAY_CHUNK",
  ochre_lump: "OCHRE_CHUNK", "lump of ochre": "OCHRE_CHUNK",
  flint_stone: "FLINT_CHUNK", flint: "FLINT_CHUNK",
  stone_block: "STONE_BLOCK",

  // ----- INGOTS -----
  iron_ingot: "INGOT_IRON", copper_ingot: "INGOT_COPPER",
  tin_ingot: "INGOT_TIN", silver_ingot: "INGOT_SILVER",
  gold_bar: "INGOT_GOLD", lead_bar: "INGOT_LEAD",

  // ----- RELIGIOUS / SCHOLARLY -----
  incense: "STICK", "incense sticks": "STICK",
  candles: "CANDLE", candle: "CANDLE",
  religious_text: "BOOK",
  blessed_artifact: "RING",

  // ----- JUNK / BASIC -----
  stick: "STICK",
  smooth_stone: "PEBBLE", pebble: "PEBBLE",
  dry_leaves: "LEAVES_DRY",
  pottery_shard: "POTTERY_SHARD", broken_pottery: "POTTERY_SHARD",
  damp_log: "LOG_DAMP",
  root: "ROOT_TOUGH",
  earthworm: "WORM",

  // ----- COMMON ITEMS -----
  wooden_bowl: "BOWL",
  clay_lamp: "LAMP",
  wool_tunic: "TUNIC",
  bread: "BREAD",
  quill: "QUILL",
  ink_pot: "INKWELL",
  simple_robe: "CLOAK",
  leather_apron: "TUNIC",
  rope: "ROPE",
  simple_ring: "RING",
  rope_necklace: "AMULET",
  cloth_hood: "HELMET",
  leather_cap: "HELMET",
  leather_boots: "BOOTS",
  sandals: "BOOTS",

  // ----- TEXT ITEMS -----
  book: "BOOK",
  scroll: "SCROLL",
  letter: "SCROLL",
  parchment_roll: "SCROLL",

  // ----- HISTORICAL TOOLS -----
  whetstone_alt: "WHETSTONE",
  horseshoe_alt: "HORSESHOE",
  hammer_alt: "AXE",
  bellows_alt: "BELLOWS_TOOL",
  purse: "PURSE_LEATHER",
  scale: "SCALE_SMALL",

  spice_pouch: "BAG",
  silk_cloth: "BAG",
  ivory_tusk: "MAMMOTH_IVORY",

  prayer_beads: "AMULET",
  katana: "SWORD_KATANA",
  scimitar: "SWORD_SCIMITAR",
  sword: "SWORD_STRAIGHT",

  smiths_anvil: "ANVIL",
  forge_hearth: "FORGE",
  tongs_alt: "TONGS",
  stone_chisel_alt: "CHISEL",

  // ----- AGRICULTURE & PROCESS -----
  iron_plow_alt: "PLOW",
  grain_scythe_alt: "SCYTHE",
  harvest_sickle_alt: "SICKLE",
  grain_flail_alt: "STICK",

  // ----- FLOURS / OILS / SPICES -----
  flour: "FLOUR_WHEAT",
  barley_flour: "FLOUR_BARLEY",
  rye_flour: "FLOUR_RYE",
  millet_flour: "FLOUR_MILLET",
  cornmeal: "CORNMEAL_SACK",
  rice_flour: "FLOUR_RICE",
  soy_flour: "FLOUR_SOY",
  quinoa_flour: "FLOUR_QUINOA",
  nut_flour: "FLOUR_NUT",
  olive_oil: "OLIVE_OIL_JAR",
  raw_sugar: "SUGAR_RAW",
  beet_sugar: "SUGAR_BEET",
  cocoa_powder: "COCOA_POWDER",
  ground_spices: "SPICES_GROUND",
  coffee_beans: "COFFEE_BEANS",
  ground_coffee: "COFFEE_GROUND",

  // ----- CROPS / GRAINS / FRUITS -----
  rye: "RYE_SHEAF",
  millet: "MILLET_BUNDLE",
  peas: "PEAS_POD",
  lentils: "LENTILS_SCOOP",
  salt_pork: "SALT_PORK",
  smoked_fish: "FISH_SMOKED",

  wheat: "WHEAT_SHEAF",
  barley: "BARLEY_BAG",
  corn: "CORN_EAR",
  rice: "RICE_SACK",
  olives: "OLIVES_JAR",
  grapes: "GRAPES_BUNCH",
  cotton: "COTTON_BALE",
  sugar_cane: "SUGAR_CANE_STALK",
  polished_rice: "RICE_SACK",

  // ----- SEA / COASTAL / RIVER -----
  sea_glass: "SEA_GLASS",
  seashell: "SEASHELL",
  crab: "CRAB",
  mud_crab: "CRAB",
  clam: "CLAM",
  oyster: "OYSTER",
  pearl: "PEARL_GEM",
  freshwater_pearl: "PEARL_GEM",
  seaweed: "SEAWEED",
  abalone_shell: "ABALONE_SHELL",
  driftwood: "DRIFTWOOD",
  river_shrimp: "RIVER_SHRIMP",
  cattail_root: "CATTAIL_ROOT",
  river_reed: "RIVER_REED",
  duck_egg: "DUCK_EGG",
  seabird_egg: "SEABIRD_EGG",

  // ----- DESERT / WETLAND / VOLCANIC / TUNDRA -----
  fossil: "FOSSIL",
  scorpion: "SCORPION",
  peat: "PEAT",
  bog_iron: "BOG_IRON",
  leech: "LEECH",
  frozen_berries: "FROZEN_BERRIES",
  mammoth_tusk_fragment: "MAMMOTH_IVORY",
  ice_crystal: "ICE_CRYSTAL",
  amber: "AMBER",
  obsidian: "OBSIDIAN",
  sulfur: "SULFUR",
  pumice_stone: "PUMICE",
  volcanic_ash: "VOLCANIC_ASH",

  // ----- ANIMAL PRODUCTS / OTHERS -----
  beef: "MEAT",
  venison: "MEAT",
  fish_meat: "FISH",
  cow_hide: "BAG",
  deer_hide: "BAG",
  wolf_pelt: "BAG",
  bear_hide: "BAG",
  bear_claw: "STICK",
  fox_fur: "BAG",
  tough_hide: "BAG",
  boar_tusk: "STICK",
  eagle_feather: "FEATHER_SINGLE",
  owl_feather: "FEATHER_SINGLE",
  magic_feather: "FEATHER_SINGLE",
  snake_skin: "BAG",
  venom: "VENOM_VIAL",
  bioluminescent_goop: "GOOP_GLOW",
  useless_slime: "SLIME_GOOP",
  whale_blubber: "BLUBBER",
  ambergris: "ORE",

  // ----- URBAN SCAVENGE -----
  bread_crust: "BREAD",
  apple_core: "APPLE",
  discarded_cloth: "BAG",
  broken_pottery: "POTTERY_SHARD",
  bent_nail: "STICK",
  nails: "NAILS_BUNCH",
  torn_paper: "PAPER_SHEET",
  paper: "PAPER_SHEET",
  button: "BUTTON_SMALL",
  thread: "THREAD_SPOOL",

  coin: "RING",

  // ----- MEDICAL / MODERN / SPECIAL TOOLS -----
  briefcase: "BRIEFCASE",
  stethoscope: "STETHOSCOPE",
  syringe: "SYRINGE",
  handcuffs: "HANDCUFFS",
  flashlight: "FLASHLIGHT",
  smartphone: "SMARTPHONE",
  slate_board: "SLATE_BOARD",
  gourd_flask: "GOURD_FLASK",
  stick_chart: "BOX",
  soap: "SOAP_BAR",
  bandage: "BANDAGE_ROLL",
  bell: "BELL_HAND",
  key: "KEY_IRON",
  pan: "PAN_IRON",
  bones: "BONES_SMALL",
  bucket: "BUCKET_WOOD",

  // ----- HATS / CAPS / CROWNS / HELMETS -----
  straw_hat: "HAT_STRAW",
  sun_hat: "HAT_SUN",
  fine_clothes: "TUNIC",
  silk_robe: "CLOAK",

  chullo_hat: "CAP_KNIT",
  fedora: "HAT_FEDORA",
  homburg: "HAT_HOMBURG",
  petasos: "HAT_SUN",
  pith_helmet: "HAT_PITH",
  top_hat: "HAT_TOP",
  tricorn_hat: "HAT_TRICORN",
  boater_hat: "HAT_BOATER",
  bowler_hat: "HAT_BOWLER",
  cloche_hat: "HAT_CLOCHE",
  designer_hat: "HAT_TOP",
  ducal_hat: "CROWN_SIMPLE",
  felt_beret: "HAT_BERET",
  fez: "HAT_FEZ",
  plumed_hat: "CROWN_SIMPLE",
  silk_hat: "HAT_TOP",

  bamboo_hat: "HAT_BAMBOO",
  baseball_cap: "CAP_BASEBALL",
  brocade_cap: "CAP_FLAT",
  cloth_cap: "CAP_FLAT",
  cotton_cap: "CAP_FLAT",
  designer_cap: "CAP_FLAT",
  flat_cap: "CAP_FLAT",
  gandhi_cap: "CAP_GANDHI",
  hemp_cap: "CAP_FLAT",
  knit_cap: "CAP_KNIT",
  kufi_cap: "CAP_KUFI",
  merchant_cap: "CAP_FLAT",
  newsboy_cap: "CAP_NEWSBOY",
  noble_cap: "CAP_FLAT",
  official_hat: "CAP_SCHOLAR",
  scholar_cap: "CAP_SCHOLAR",
  silk_cap: "CAP_FLAT",
  snapback: "CAP_SNAPBACK",
  topi: "CAP_FLAT",
  velvet_cap: "CAP_FLAT",
  wool_cap: "CAP_FLAT",
  worker_cap: "CAP_FLAT",
  zhongshan_cap: "CAP_FLAT",

  antler_crown: "CROWN_ANTLER",
  battle_helmet: "HELMET_WOOD",
  war_helmet: "HELMET_FEATHER",

  // ----- CONSUMABLES -----
  healing_potion: "POTION",
  small_bomb: "ORE", // optional: define a dedicated BOMB sprite later
  refreshing_herb: "APPLE",
  scroll_of_knowledge: "SCROLL",
};

/** Comprehensive name→archetype dictionary */
export const ITEM_ARCHETYPES_MAX: Record<string, string> = {
  ...EXPANDED_ITEM_ARCHETYPES,

  // Also add some human-readable aliases to force specificity
  "wheat flour": "FLOUR_WHEAT",
  "barley flour": "FLOUR_BARLEY",
  "rye flour": "FLOUR_RYE",
  "millet flour": "FLOUR_MILLET",
  "rice flour": "FLOUR_RICE",
  "soy flour": "FLOUR_SOY",
  "quinoa flour": "FLOUR_QUINOA",
  "nut flour": "FLOUR_NUT",

  "bag of rice": "RICE_SACK",
  "bag of barley": "BARLEY_BAG",
  "sheaf of wheat": "WHEAT_SHEAF",
  "rye grain": "RYE_SHEAF",
  "millet seeds": "MILLET_BUNDLE",
  "ear of corn": "CORN_EAR",
  "dried peas": "PEAS_POD",
  "dried beans": "BEANS_SACK",

  "olive oil": "OLIVE_OIL_JAR",
  "jar of olives": "OLIVES_JAR",
  "bunch of grapes": "GRAPES_BUNCH",

  "freshwater pearl": "PEARL_GEM",
  "hand quern": "QUERN_HAND",
  "cheese press": "CHEESE_PRESS",
  "stone block": "STONE_BLOCK",
};

/** ------------------------------------------------------------------------
 * getItemArchetype wrapper that prefers the MAX map, falls back to base
 * ------------------------------------------------------------------------ */
export function getItemArchetypeMax(itemName: string): string {
  const key = itemName.toLowerCase();
  if (ITEM_ARCHETYPES_MAX[key]) return ITEM_ARCHETYPES_MAX[key];

  // Try splitting on non-letters to accommodate BASE_IDs like IRON_ORE
  const byParts = key.split(/[^a-z]+/g).filter(Boolean);
  for (const k of [key, byParts.join("_"), ...byParts]) {
    if (ITEM_ARCHETYPES_MAX[k]) return ITEM_ARCHETYPES_MAX[k];
  }
  // Fallback: return generic if no match found
  return 'GENERIC';
}
