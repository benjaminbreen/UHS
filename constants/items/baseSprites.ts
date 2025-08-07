/**
 * constants/items/baseSprites.ts - SVG path data for generative item icons.
 * Enhanced pixel-art style sprites with detailed layers for each item archetype.
 * All paths are designed for a 24x24 viewBox with proper material support.
 */

export const BASE_SPRITES: Record<string, Record<string, string>> = {
    // --- FOOD ITEMS ---
    BREAD: {
        base: "M4,8 C4,6 6,6 12,6 C18,6 20,6 20,8 L19,16 C19,18 17,18 12,18 C7,18 5,18 5,16 Z",
        crust: "M4,8 C4,6 6,6 12,6 C18,6 20,6 20,8 L20,10 L4,10 Z",
        texture: "M6,10 L7,11 M9,12 L10,13 M13,11 L14,12 M16,13 L17,14",
        shadow: "M5,16 C5,17 7,18 12,18 C17,18 19,17 19,16"
    },
    
    FISH: {
        body: "M3,12 C3,8 8,8 12,10 C16,8 21,8 21,12 C21,16 16,16 12,14 C8,16 3,16 3,12 Z",
        head: "M18,12 C19,11 20,11 21,12 C20,13 19,13 18,12",
        eye: "M19,11.5 C19.5,11.5 19.5,12.5 19,12.5",
        fins: "M12,8 L14,6 L16,8 M12,16 L14,18 L16,16",
        scales: "M6,10 L7,11 L6,12 L7,13 M9,9 L10,10 L9,11 L10,12 M12,10 L13,11 L12,12"
    },

    APPLE: {
        base: "M8,6 C6,8 6,14 8,16 C10,18 14,18 16,16 C18,14 18,8 16,6 C14,4 10,4 8,6 Z",
        highlight: "M9,8 C9,7 10,7 11,8 C11,9 10,10 9,9 Z",
        stem: "M12,4 L12,6 M11,4 C11,3 13,3 13,4"
    },

    MEAT: {
        base: "M6,8 C4,8 4,12 6,14 L10,16 C12,17 16,15 18,13 C20,11 18,9 16,8 L12,6 C10,7 8,8 6,8 Z",
        fat: "M8,10 L9,11 L8,12 M14,9 L15,10 L14,11",
        bone: "M10,16 L12,18 L14,16 M11,17 L13,17"
    },

    // --- JEWELRY & ACCESSORIES ---
    RING: {
        band: "M12,12 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0",
        inner: "M12,12 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0",
        gem: "M12,9 L13,10 L12,11 L11,10 Z",
        highlight: "M10,10 C10,9 11,9 11,10"
    },

    AMULET: {
        chain: "M12,4 L12,10 M10,5 L14,5 M9,6 L15,6",
        pendant: "M9,10 L15,10 L14,16 L10,16 Z",
        gem: "M12,12 C13,11 13,13 12,14 C11,13 11,11 12,12",
        detail: "M10,11 L14,11 M10,15 L14,15"
    },

    // --- WEAPONS ---
    SWORD: {
        blade: "M12,2 L13,4 L14,14 L12,20 L10,14 L11,4 Z",
        fuller: "M12,4 L12,16",
        guard: "M8,14 L16,14 L15,15 L9,15 Z",
        grip: "M11,15 L13,15 L13,18 L11,18 Z",
        pommel: "M10,18 L14,18 L13,19 L11,19 Z",
        highlight: "M11,4 L11,14"
    },

    AXE: {
        head: "M10,4 C8,4 6,6 8,8 L12,10 L20,6 C22,4 20,2 18,4 L12,6 Z",
        edge: "M8,8 L12,10 L20,6 C21,5 20,4 19,5 Z",
        haft: "M11,8 L13,8 L13,20 L11,20 Z",
        grip: "M11,16 L13,16 M11,18 L13,18",
        shadow: "M12,8 L12,20"
    },

    PICKAXE: {
        head: "M4,8 L10,6 L12,8 L14,6 L20,8 L18,10 L12,12 L6,10 Z",
        spike: "M2,9 L6,10 L4,11 Z M18,10 L22,9 L20,11 Z",
        haft: "M11,10 L13,10 L13,22 L11,22 Z",
        binding: "M11,12 L13,12 M11,14 L13,14"
    },

    // --- ARMOR & CLOTHING ---
    TUNIC: {
        body: "M6,8 L18,8 L17,20 L7,20 Z",
        sleeves: "M4,10 L6,8 L8,12 L6,14 Z M16,12 L18,8 L20,10 L18,14 Z",
        neckline: "M10,8 L14,8 L13,10 L11,10 Z",
        hem: "M7,18 L17,18 L17,20 L7,20 Z",
        seams: "M6,8 L7,20 M17,20 L18,8"
    },

    CLOAK: {
        body: "M3,6 C3,4 12,4 21,4 C21,6 21,16 18,20 L6,20 C3,16 3,6 3,6 Z",
        hood: "M6,4 C6,2 12,2 18,2 C18,4 15,6 12,6 C9,6 6,4 6,4 Z",
        clasp: "M11,6 L13,6 L13,8 L11,8 Z",
        folds: "M6,10 L8,12 L6,14 M16,12 L18,10 L18,14"
    },

    BOOTS: {
        base: "M6,10 L18,10 L17,18 L16,20 L8,20 L7,18 Z",
        sole: "M6,18 L18,18 L17,20 L7,20 Z",
        laces: "M10,10 L10,16 M14,10 L14,16 M9,12 L11,12 M13,12 L15,12",
        toe: "M14,18 L17,18 L16,20 L15,20 Z",
        heel: "M7,18 L9,20 L8,20 Z"
    },

    HELMET: {
        dome: "M6,6 C6,2 18,2 18,6 L18,14 L6,14 Z",
        brim: "M4,14 L20,14 L19,16 L5,16 Z",
        visor: "M8,10 L16,10 L16,12 L8,12 Z",
        crest: "M11,2 L13,2 L12,6 Z",
        rivets: "M8,8 m0,-1 a1,1 0 1,0 0,2 a1,1 0 1,0 0,-2 M16,8 m0,-1 a1,1 0 1,0 0,2 a1,1 0 1,0 0,-2"
    },

    // --- TOOLS & IMPLEMENTS ---
    STICK: {
        shaft: "M4,8 L20,16 L19,17 L3,9 Z",
        bark: "M6,9 L7,8 M10,10 L11,11 M14,12 L15,13",
        tip: "M19,16 L21,17 L20,18 Z",
        knots: "M8,9 L9,10 M12,11 L13,12"
    },

    // --- MATERIALS ---
    INGOT: {
        base: "M6,10 L18,10 L17,14 L7,14 Z",
        top: "M6,10 L18,10 L16,8 L8,8 Z",
        side: "M17,10 L17,14 L16,12 L16,8 Z",
        mark: "M10,11 L14,11 M11,12 L13,12"
    },

    ORE: {
        base: "M4,8 C4,4 8,6 12,4 C16,6 20,4 20,8 C20,12 16,14 12,16 C8,14 4,12 4,8 Z",
        veins: "M8,8 L10,10 L8,12 M14,8 L16,10 L14,12",
        crystal: "M12,6 L13,8 L12,10 L11,8 Z",
        rough: "M6,9 L7,8 L6,10 M18,9 L17,8 L18,10"
    },

    STONE: {
        base: "M5,6 C3,8 5,12 7,14 C9,16 15,16 17,14 C19,12 21,8 19,6 C17,4 15,6 12,5 C9,6 7,4 5,6 Z",
        texture: "M8,8 L9,9 M11,7 L12,8 M15,9 L16,10 M13,12 L14,13",
        crack: "M10,6 L11,10 L10,14"
    },

    // --- DOCUMENTS & BOOKS ---
    BOOK: {
        cover: "M6,4 L18,4 L18,20 L6,20 Z",
        spine: "M6,4 L6,20 L7,19 L7,5 Z",
        pages: "M8,6 L16,6 L16,18 L8,18 Z",
        binding: "M6,8 L7,8 M6,12 L7,12 M6,16 L7,16",
        text: "M10,8 L14,8 M9,10 L15,10 M10,12 L13,12"
    },

    SCROLL: {
        base: "M4,8 L20,8 L20,16 L4,16 Z",
        rod_left: "M3,7 L5,7 L5,17 L3,17 Z",
        rod_right: "M19,7 L21,7 L21,17 L19,17 Z",
        text: "M6,10 L18,10 M7,12 L17,12 M8,14 L16,14",
        seal: "M16,14 C17,14 17,15 16,15 C15,15 15,14 16,14"
    },

    // --- POTIONS & CONSUMABLES ---
    POTION: {
        bottle: "M8,4 L16,4 L17,8 L17,16 C17,18 15,20 12,20 C9,20 7,18 7,16 L7,8 Z",
        neck: "M10,2 L14,2 L14,4 L10,4 Z",
        cork: "M9,2 L15,2 L15,3 L9,3 Z",
        liquid: "M8,8 L16,8 L16,16 C16,17 14,18 12,18 C10,18 8,17 8,16 Z",
        bubble: "M10,10 m0,-1 a1,1 0 1,0 0,2 a1,1 0 1,0 0,-2 M13,14 m0,-0.5 a0.5,0.5 0 1,0 0,1 a0.5,0.5 0 1,0 0,-1",
        highlight: "M9,6 L10,7 L9,8"
    },

    // --- CONTAINERS ---
    BAG: {
        base: "M6,10 L18,10 L17,18 L7,18 Z",
        flap: "M6,8 L18,8 L17,10 L7,10 Z",
        straps: "M4,8 L6,10 M18,10 L20,8",
        buckle: "M11,9 L13,9 L13,10 L11,10 Z",
        texture: "M8,12 L9,13 M15,14 L16,15"
    },

    // --- ADDITIONAL TOOLS & IMPLEMENTS ---
    LAMP: {
        base: "M8,12 L16,12 L15,18 L9,18 Z",
        spout: "M16,14 L20,13 L19,15 L15,16 Z",
        handle: "M6,14 C5,14 5,16 6,16 L8,16",
        flame: "M17,11 L18,9 L19,11",
        wick: "M17,12 L17,13"
    },

    BOWL: {
        base: "M6,12 C6,16 8,18 12,18 C16,18 18,16 18,12 L18,14 C18,16 16,17 12,17 C8,17 6,16 6,14 Z",
        rim: "M6,12 C6,10 8,10 12,10 C16,10 18,10 18,12",
        interior: "M7,13 C7,15 9,16 12,16 C15,16 17,15 17,13",
        grain: "M8,14 L9,15 M14,13 L15,14"
    },

    // --- STONES & MINERALS ---
    PEBBLE: {
        base: "M8,10 C6,10 6,14 8,16 C10,18 14,18 16,16 C18,14 18,10 16,10 C14,8 10,8 8,10 Z",
        highlight: "M9,11 C10,10 11,10 12,11",
        texture: "M10,13 L11,14 M14,12 L15,13",
        shadow: "M9,15 C11,16 13,16 15,15"
    },

    ROUGH_STONE: {
        base: "M6,8 L10,6 L14,7 L18,9 L17,13 L15,16 L11,17 L7,15 L5,11 Z",
        facets: "M8,9 L12,8 L16,10 M7,12 L11,14 M13,15 L16,13",
        cracks: "M9,10 L11,12 L9,14 M14,9 L15,11",
        rough: "M7,10 L8,9 M15,12 L16,11 M10,15 L11,16"
    },

    // --- PRECISION TOOLS ---
    BALANCE: {
        base: "M10,18 L14,18 L13,20 L11,20 Z",
        column: "M11,10 L13,10 L13,18 L11,18 Z",
        beam: "M6,10 L18,10",
        pan1: "M4,8 C4,10 6,12 8,12 C10,12 12,10 12,8",
        pan2: "M12,8 C12,10 14,12 16,12 C18,12 20,10 20,8",
        chains: "M6,8 L8,10 M12,8 L12,10 M14,8 L16,10 M18,8 L18,10"
    },

    CHISEL: {
        blade: "M10,4 L14,4 L13,16 L11,16 Z",
        edge: "M10,4 L14,4 L13,6 L11,6 Z",
        handle: "M11,16 L13,16 L13,20 L11,20 Z",
        grip: "M11,18 L13,18",
        ferrule: "M11,15 L13,15 L13,17 L11,17 Z"
    },

    BELLOWS_TOOL: {
        base: "M4,10 L20,10 L18,16 L6,16 Z",
        top: "M4,10 L20,10 L16,6 L8,6 Z",
        nozzle: "M20,12 L22,13 L22,14 L20,14 Z",
        handle: "M6,8 L10,8 L10,6 L6,6 Z",
        folds: "M8,12 L12,12 M14,12 L18,12"
    },

    // --- MEDIEVAL CRAFT TOOLS ---
    ANVIL: {
        base: "M6,14 L18,14 L17,16 L7,16 Z",
        horn: "M18,14 L22,12 L21,15 L18,16 Z",
        face: "M6,12 L18,12 L18,14 L6,14 Z",
        hardy: "M11,12 L13,12 L13,10 L11,10 Z",
        legs: "M8,16 L8,20 L10,20 L10,16 M14,16 L14,20 L16,20 L16,16"
    },

    FORGE: {
        base: "M4,12 L20,12 L18,18 L6,18 Z",
        fire: "M8,8 L12,6 L16,8 L14,10 L10,10 Z",
        coals: "M6,12 L18,12 L16,10 L8,10 Z",
        bellows: "M2,14 L6,12 L6,16 L2,16 Z",
        smoke: "M12,6 L11,4 L13,2 L12,4"
    },

    MILLSTONE: {
        base: "M4,8 C4,4 8,4 12,4 C16,4 20,4 20,8 C20,12 16,16 12,16 C8,16 4,12 4,8 Z",
        center: "M10,8 C10,6 12,6 14,6 C14,8 14,10 12,10 C10,10 10,8 10,8 Z",
        grooves: "M6,8 L10,8 M14,8 L18,8 M8,6 L8,10 M16,6 L16,10",
        rim: "M4,8 C4,4 8,4 12,4 C16,4 20,4 20,8"
    },

    // --- RELIGIOUS & SCHOLARLY ---
    CANDLE: {
        base: "M11,8 L13,8 L13,18 L11,18 Z",
        wick: "M11,6 L13,6 L13,8 L11,8 Z",
        flame: "M12,4 L13,6 L11,6 Z",
        wax_drip: "M10,12 L11,14 M13,10 L14,12",
        base_holder: "M9,18 L15,18 L14,20 L10,20 Z"
    },

    INKWELL: {
        base: "M8,12 L16,12 L15,18 L9,18 Z",
        opening: "M8,12 C8,10 10,10 12,10 C14,10 16,10 16,12",
        ink: "M9,14 L15,14 L14,17 L10,17 Z",
        quill_rest: "M6,12 L8,10 L10,12"
    },

    SCRIPTORIUM_DESK: {
        top: "M4,10 L20,10 L20,12 L4,12 Z",
        legs: "M6,12 L6,20 M18,12 L18,20",
        manuscript: "M8,8 L16,8 L16,10 L8,10 Z",
        books: "M4,6 L7,6 L7,10 L4,10 Z M17,4 L20,4 L20,10 L17,10 Z"
    },

    // --- HOUSEHOLD & DOMESTIC ---
    LOOM: {
        frame: "M4,4 L4,20 L6,20 L6,4 Z M18,4 L18,20 L20,20 L20,4 Z",
        crossbeam: "M4,8 L20,8 M4,16 L20,16",
        warp: "M6,8 L18,8 M6,10 L18,10 M6,12 L18,12 M6,14 L18,14",
        shuttle: "M8,11 L16,11 L15,13 L9,13 Z",
        threads: "M6,8 L6,16 M8,8 L8,16 M10,8 L10,16"
    },

    SPINNING_WHEEL: {
        wheel: "M8,8 C6,8 6,12 8,14 C10,16 14,16 16,14 C18,12 18,8 16,8 C14,6 10,6 8,8 Z",
        spokes: "M8,8 L16,14 M16,8 L8,14 M12,6 L12,16 M6,11 L18,11",
        spindle: "M18,10 L22,10 L22,12 L18,12 Z",
        drive_band: "M16,8 Q18,10 16,12 Q14,14 12,12 Q10,10 12,8",
        base: "M4,16 L20,16 L19,18 L5,18 Z"
    },

    BUTTER_CHURN: {
        barrel: "M8,8 L16,8 L15,18 L9,18 Z",
        lid: "M7,8 L17,8 L16,6 L8,6 Z",
        plunger: "M11,4 L13,4 L13,12 L11,12 Z",
        handle: "M13,6 L15,6 L15,8 L13,8 Z",
        bands: "M8,10 L16,10 M8,14 L16,14"
    },

    // --- AGRICULTURAL TOOLS ---
    PLOW: {
        share: "M4,16 L8,12 L12,16 L8,20 Z",
        moldboard: "M8,12 L16,10 L18,14 L12,16 Z",
        beam: "M12,14 L22,14 L22,16 L12,16 Z",
        handles: "M18,12 L20,8 M20,12 L22,8",
        coulter: "M10,8 L12,12 L10,16"
    },

    SCYTHE: {
        blade: "M4,12 C2,12 2,16 4,16 L16,14 C18,14 18,12 16,12 Z",
        snath: "M16,13 L22,8 L24,10 L18,15 Z",
        grip: "M20,10 L18,6 L20,6 L22,10 Z",
        heel: "M16,14 L16,16 L14,16",
        edge: "M4,12 L16,12"
    },

    SICKLE: {
        blade: "M8,8 C6,8 4,10 4,12 C4,14 6,16 8,16 L14,14 C16,14 18,12 18,10",
        handle: "M14,14 L16,18 L18,16 L16,12",
        tang: "M14,12 L14,16",
        edge: "M8,8 L14,12"
    },

    // --- TRADE & COMMERCE ---
    MERCHANT_STALL: {
        canopy: "M2,4 L22,4 L20,8 L4,8 Z",
        posts: "M4,8 L4,20 M20,8 L20,20",
        counter: "M4,12 L20,12 L20,14 L4,14 Z",
        goods: "M6,10 L8,10 L8,12 L6,12 Z M16,8 L18,8 L18,12 L16,12 Z",
        rope: "M4,4 L4,8 M20,4 L20,8"
    },

    SCALES_BALANCE: {
        beam: "M4,10 L20,10",
        fulcrum: "M11,8 L13,8 L13,12 L11,12 Z",
        pan_left: "M2,8 C2,6 4,6 6,6 C8,6 10,6 10,8 L8,10 L4,10 Z",
        pan_right: "M14,8 C14,6 16,6 18,6 C20,6 22,6 22,8 L20,10 L16,10 Z",
        chains: "M4,8 L6,10 M8,8 L8,10 M16,8 L18,10 M20,8 L20,10",
        base: "M10,12 L14,12 L13,16 L11,16 Z"
    },

    // --- WEAPONSMITHING ---
    GRINDSTONE: {
        stone: "M8,8 C6,8 6,12 8,14 C10,16 14,16 16,14 C18,12 18,8 16,8 C14,6 10,6 8,8 Z",
        axle: "M6,11 L18,11 L18,13 L6,13 Z",
        frame: "M4,8 L4,16 L6,16 L6,8 Z M18,8 L18,16 L20,16 L20,8 Z",
        treadle: "M8,18 L16,18 L15,20 L9,20 Z",
        sparks: "M16,8 L18,6 L17,8 M18,10 L20,8 L19,10"
    },

    SWORD_RACK: {
        frame: "M6,4 L18,4 L18,6 L6,6 Z M6,18 L18,18 L18,20 L6,20 Z",
        posts: "M6,4 L6,20 M18,4 L18,20",
        sword1: "M8,8 L10,8 L10,16 L8,16 Z M9,6 L9,8",
        sword2: "M12,10 L14,10 L14,18 L12,18 Z M13,8 L13,10",
        sword3: "M16,6 L18,6 L18,14 L16,14 Z M17,4 L17,6"
    },

    // === NEW COMPREHENSIVE ARCHETYPE SPRITES ===
    
    GRAIN: {
        base: "M4,10 C4,8 6,6 12,6 C18,6 20,8 20,10 L18,16 C18,18 16,18 12,18 C8,18 6,18 6,16 Z",
        kernels: "M8,8 L9,9 M10,8 L11,9 M12,8 L13,9 M14,8 L15,9 M8,12 L9,13 M14,12 L15,13",
        chaff: "M6,8 L7,9 M17,8 L18,9 M6,16 L7,17 M17,16 L18,17",
        texture: "M7,10 L8,11 M15,10 L16,11 M9,14 L10,15 M13,14 L14,15"
    },

    GRAIN_BAG: {
        base: "M6,6 L18,6 L17,18 L7,18 Z",
        tie: "M10,4 L14,4 L13,6 L11,6 Z",
        rope: "M11,4 L13,4 M12,2 L12,4",
        bulge: "M6,8 C5,8 5,12 6,14 M18,8 C19,8 19,12 18,14",
        grain_spill: "M7,16 L8,18 M9,17 L10,19 M14,17 L15,19 M16,16 L17,18"
    },

    WORM: {
        body: "M6,12 C8,10 10,14 12,12 C14,10 16,14 18,12",
        segments: "M7,12 L7,13 M9,12 L9,13 M11,12 L11,13 M13,12 L13,13 M15,12 L15,13 M17,12 L17,13",
        head: "M18,12 C19,11 19,13 18,12",
        texture: "M8,12.5 L8.5,12.5 M12,12.5 L12.5,12.5 M16,12.5 L16.5,12.5"
    },

    TONGS: {
        jaw1: "M6,8 L8,12 L6,16 L4,12 Z",
        jaw2: "M18,8 L20,12 L18,16 L16,12 Z",
        hinge: "M8,12 L16,12",
        handle1: "M8,12 L10,20 L8,22 L6,20 Z",
        handle2: "M16,12 L18,20 L16,22 L14,20 Z"
    }
};

// Comprehensive archetype mapping system - 200+ categories
export const ITEM_ARCHETYPES: Record<string, string> = {
    // === FOOD CATEGORIES ===
    
    // Bread & Grain Products
    'bread': 'BREAD',
    'loaf': 'BREAD',
    'bun': 'BREAD',
    'roll': 'BREAD',
    'biscuit': 'BREAD',
    'flatbread': 'BREAD',
    'wheat bread': 'BREAD',
    'rye bread': 'BREAD',
    'barley bread': 'BREAD',
    'hardtack': 'BREAD',
    'loaf of bread': 'BREAD',
    
    // Raw Grains (use GRAIN archetype)
    'barley': 'GRAIN',
    'rye': 'GRAIN', 
    'wheat': 'GRAIN',
    'millet': 'GRAIN',
    'oats': 'GRAIN',
    'grain': 'GRAIN',
    'barley grain': 'GRAIN',
    'rye grain': 'GRAIN',
    'wheat grain': 'GRAIN',
    'sheaf': 'GRAIN',
    'sheaf of wheat': 'GRAIN',
    'millet seeds': 'GRAIN',
    'bag of barley': 'GRAIN_BAG',
    'bag of rye': 'GRAIN_BAG',
    'bag of wheat': 'GRAIN_BAG',
    'bag of grain': 'GRAIN_BAG',
    'bag of rice': 'GRAIN_BAG',
    'sack of grain': 'GRAIN_BAG',
    
    // Legumes
    'peas': 'GRAIN',
    'lentils': 'GRAIN', 
    'beans': 'GRAIN',
    'dried peas': 'GRAIN',
    'dried beans': 'GRAIN',
    'chickpeas': 'GRAIN',
    
    // Fish
    'fish': 'FISH',
    'salmon': 'FISH',
    'trout': 'FISH',
    'smoked fish': 'FISH',
    'fresh fish': 'FISH',
    'fish meat': 'FISH',
    'cod': 'FISH',
    'herring': 'FISH',
    
    // Fruits
    'apple': 'APPLE',
    'fruit': 'APPLE',
    'pear': 'APPLE',
    'peach': 'APPLE',
    'plum': 'APPLE',
    'berries': 'APPLE',
    'wild berries': 'APPLE',
    'strawberry': 'APPLE',
    'blueberry': 'APPLE',
    'grapes': 'APPLE',
    'bunch of grapes': 'APPLE',
    
    // Meat
    'meat': 'MEAT',
    'venison': 'MEAT',
    'pork': 'MEAT', 
    'salt pork': 'MEAT',
    'beef': 'MEAT',
    'chunk of meat': 'MEAT',
    'bear meat': 'MEAT',
    'boar meat': 'MEAT',
    'mutton': 'MEAT',
    'lamb': 'MEAT',
    
    // Vegetables
    'potato': 'APPLE',
    'turnip': 'APPLE',
    'carrot': 'APPLE',
    'parsnip': 'APPLE',
    'yam': 'APPLE',
    'onion': 'APPLE',
    'garlic': 'APPLE',
    'cabbage': 'APPLE',
    'lettuce': 'APPLE',
    
    // Rice & Special Grains
    'rice': 'GRAIN',
    'bowl of rice': 'GRAIN',
    'corn': 'GRAIN',
    'ear of corn': 'GRAIN',
    'maize': 'GRAIN',
    'sugar cane': 'STICK',
    'stalk of sugar cane': 'STICK',
    
    // === JEWELRY & ACCESSORIES ===
    'ring': 'RING',
    'simple ring': 'RING',
    'gold ring': 'RING',
    'silver ring': 'RING',
    'wedding ring': 'RING',
    'amulet': 'AMULET',
    'necklace': 'AMULET',
    'pendant': 'AMULET',
    'charm': 'AMULET',
    'rope necklace': 'AMULET',
    'prayer beads': 'AMULET',
    'bracelet': 'RING',
    'armband': 'RING',
    
    // === WEAPONS ===
    'sword': 'SWORD',
    'blade': 'SWORD',
    'katana': 'SWORD',
    'scimitar': 'SWORD',
    'curved scimitar': 'SWORD',
    'longsword': 'SWORD',
    'shortsword': 'SWORD',
    'axe': 'AXE',
    'hatchet': 'AXE',
    'battle axe': 'AXE',
    'war axe': 'AXE',
    'pickaxe': 'PICKAXE',
    'pick': 'PICKAXE',
    'mining pick': 'PICKAXE',
    'steel pickaxe': 'PICKAXE',
    'hammer': 'AXE',
    'war hammer': 'AXE',
    'mallet': 'AXE',
    'smiths hammer': 'AXE',
    'smith\'s hammer': 'AXE',
    'dagger': 'SWORD',
    'knife': 'SWORD',
    'stiletto': 'SWORD',
    
    // === CLOTHING & ARMOR ===
    
    // Torso
    'tunic': 'TUNIC',
    'shirt': 'TUNIC',
    'wool tunic': 'TUNIC',
    'linen shirt': 'TUNIC',
    'cloak': 'CLOAK',
    'robe': 'CLOAK',
    'simple robe': 'CLOAK',
    'hooded cloak': 'CLOAK',
    'cape': 'CLOAK',
    'apron': 'TUNIC',
    'leather apron': 'TUNIC',
    'work apron': 'TUNIC',
    
    // Footwear
    'boots': 'BOOTS',
    'shoes': 'BOOTS',
    'leather boots': 'BOOTS',
    'sandals': 'BOOTS',
    'slippers': 'BOOTS',
    'moccasins': 'BOOTS',
    
    // Headwear
    'helmet': 'HELMET',
    'hat': 'HELMET',
    'cap': 'HELMET',
    'hood': 'HELMET',
    'cloth hood': 'HELMET',
    'leather cap': 'HELMET',
    'headband': 'HELMET',
    'crown': 'HELMET',
    'circlet': 'HELMET',
    
    // === TOOLS & IMPLEMENTS ===
    
    // Basic Tools
    'stick': 'STICK',
    'rod': 'STICK',
    'staff': 'STICK',
    'sturdy stick': 'STICK',
    'wooden stick': 'STICK',
    'walking stick': 'STICK',
    'branch': 'STICK',
    'twig': 'STICK',
    
    // Household Tools
    'lamp': 'LAMP',
    'clay lamp': 'LAMP',
    'oil lamp': 'LAMP',
    'lantern': 'LAMP',
    'bowl': 'BOWL',
    'wooden bowl': 'BOWL',
    'clay bowl': 'BOWL',
    'cup': 'BOWL',
    'mug': 'BOWL',
    'goblet': 'BOWL',
    'chalice': 'BOWL',
    'pot': 'BOWL',
    'cauldron': 'BOWL',
    'kettle': 'BOWL',
    'cooking pot': 'BOWL',
    
    // Craft Tools
    'chisel': 'CHISEL',
    'stone chisel': 'CHISEL',
    'wood chisel': 'CHISEL',
    'bellows': 'BELLOWS_TOOL',
    'leather bellows': 'BELLOWS_TOOL',
    'forge bellows': 'BELLOWS_TOOL',
    'balance': 'BALANCE',
    'merchant\'s scale': 'BALANCE',
    'weighing scale': 'BALANCE',
    'anvil': 'ANVIL',
    'smith\'s anvil': 'ANVIL',
    'smiths anvil': 'ANVIL',
    'forge': 'FORGE',
    'forge hearth': 'FORGE',
    'smithy': 'FORGE',
    'tongs': 'TONGS',
    'blacksmith\'s tongs': 'TONGS',
    'pliers': 'TONGS',
    
    // Milling & Food Processing
    'millstone': 'MILLSTONE',
    'mill': 'MILLSTONE',
    'quern': 'MILLSTONE',
    'hand quern': 'MILLSTONE',
    'grain quern': 'MILLSTONE',
    'grinding stone': 'MILLSTONE',
    'mortar': 'BOWL',
    'pestle': 'STICK',
    'mortar and pestle': 'BOWL',
    
    // Agricultural Tools
    'plow': 'PLOW',
    'plough': 'PLOW',
    'iron plow': 'PLOW',
    'wooden plow': 'PLOW',
    'scythe': 'SCYTHE',
    'grain scythe': 'SCYTHE',
    'war scythe': 'SCYTHE',
    'sickle': 'SICKLE',
    'harvest sickle': 'SICKLE',
    'reaping sickle': 'SICKLE',
    'hoe': 'AXE',
    'garden hoe': 'AXE',
    'rake': 'STICK',
    'garden rake': 'STICK',
    'shovel': 'STICK',
    'spade': 'STICK',
    'flail': 'STICK',
    'grain flail': 'STICK',
    'threshing flail': 'STICK',
    
    // Sharpening Tools
    'grindstone': 'GRINDSTONE',
    'whetstone': 'GRINDSTONE',
    'sharpening stone': 'GRINDSTONE',
    'honing stone': 'GRINDSTONE',
    
    // Textile Tools
    'loom': 'LOOM',
    'weaving loom': 'LOOM',
    'hand loom': 'LOOM',
    'spinning wheel': 'SPINNING_WHEEL',
    'great wheel': 'SPINNING_WHEEL',
    'spindle': 'SPINDLE',
    'drop spindle': 'SPINDLE',
    'hand spindle': 'SPINDLE',
    'wool cards': 'WOOL_CARDERS',
    'carders': 'WOOL_CARDERS',
    'carding combs': 'WOOL_CARDERS',
    'distaff': 'STICK',
    'spinning distaff': 'STICK',
    'needle': 'STICK',
    'sewing needle': 'STICK',
    'bone needle': 'STICK',
    'thimble': 'RING',
    'scissors': 'SCISSORS',
    'shears': 'SCISSORS',
    
    // Food Processing
    'churn': 'BUTTER_CHURN',
    'butter churn': 'BUTTER_CHURN',
    'cheese press': 'BUTTER_CHURN',
    'wine press': 'BUTTER_CHURN',
    'cider press': 'BUTTER_CHURN',
    
    // Writing Tools
    'quill': 'QUILL',
    'feather': 'QUILL',
    'pen': 'QUILL',
    'goose quill': 'QUILL',
    'inkwell': 'INKWELL',
    'ink pot': 'INKWELL',
    'pot of ink': 'INKWELL',
    'ink': 'INKWELL',
    
    // Lighting
    'candle': 'CANDLE',
    'beeswax candles': 'CANDLE',
    'tallow candle': 'CANDLE',
    'torch': 'STICK',
    'burning torch': 'STICK',
    'fire torch': 'STICK',
    
    // === MATERIALS ===
    
    // Metals
    'ingot': 'INGOT',
    'bar': 'INGOT',
    'iron ingot': 'INGOT',
    'copper ingot': 'INGOT',
    'tin ingot': 'INGOT',
    'gold bar': 'INGOT',
    'silver ingot': 'INGOT',
    'lead bar': 'INGOT',
    
    // Ores & Raw Materials
    'ore': 'ORE',
    'iron ore': 'ORE',
    'copper ore': 'ORE',
    'tin ore': 'ORE',
    'gold ore': 'ORE',
    'silver ore': 'ORE',
    'lead ore': 'ORE',
    'coal': 'ORE',
    'lump of coal': 'ORE',
    'charcoal': 'ORE',
    
    // Stones
    'stone': 'ROUGH_STONE',
    'rough stone': 'ROUGH_STONE',
    'stone block': 'ROUGH_STONE',
    'smooth stone': 'PEBBLE',
    'pebble': 'PEBBLE',
    'rock': 'ROUGH_STONE',
    'boulder': 'ROUGH_STONE',
    'flint': 'ROUGH_STONE',
    'flint stone': 'ROUGH_STONE',
    'clay': 'ORE',
    'lump of clay': 'ORE',
    'clay lump': 'ORE',
    'salt': 'ORE',
    'rock salt': 'ORE',
    'sea salt': 'ORE',
    
    // Natural Materials
    'wood': 'STICK',
    'log': 'STICK',
    'damp log': 'STICK',
    'timber': 'STICK',
    'plank': 'STICK',
    'board': 'STICK',
    'leather': 'BAG',
    'hide': 'BAG',
    'pelt': 'BAG',
    'fur': 'BAG',
    'cow hide': 'BAG',
    'deer hide': 'BAG',
    'bear hide': 'BAG',
    'wolf pelt': 'BAG',
    'fox fur': 'BAG',
    'tough hide': 'BAG',
    'snake skin': 'BAG',
    
    // Textile Materials
    'thread': 'ROPE',
    'yarn': 'ROPE',
    'twine': 'ROPE',
    'string': 'ROPE',
    'rope': 'ROPE',
    'cord': 'ROPE',
    'coil of rope': 'ROPE',
    'hemp rope': 'ROPE',
    'cloth': 'BAG',
    'fabric': 'BAG',
    'linen': 'BAG',
    'wool': 'BAG',
    'cotton': 'BAG',
    'bale of cotton': 'BAG',
    'silk': 'BAG',
    'silk cloth': 'BAG',
    
    // Organic Materials
    'vine': 'ROPE',
    'tough vine': 'ROPE',
    'root': 'STICK',
    'tough root': 'STICK',
    'bark': 'STICK',
    'tree bark': 'STICK',
    'resin': 'ORE',
    'pine resin': 'ORE',
    'sap': 'ORE',
    'wax': 'ORE',
    'beeswax': 'ORE',
    'honey': 'POTION',
    'oil': 'POTION',
    'olive oil': 'POTION',
    'lamp oil': 'POTION',
    
    // Special Materials
    'bone': 'STICK',
    'antler': 'STICK',
    'horn': 'STICK',
    'ivory': 'STICK',
    'ivory tusk': 'STICK',
    'small ivory piece': 'STICK',
    'tusk': 'STICK',
    'claw': 'STICK',
    'bear claw': 'STICK',
    'boar tusk': 'STICK',
    'fang': 'STICK',
    'tooth': 'STICK',
    'scale': 'ORE',
    'shell': 'BOWL',
    'pearl': 'RING',
    
    // === DOCUMENTS & BOOKS ===
    'book': 'BOOK',
    'tome': 'BOOK',
    'volume': 'BOOK',
    'old book': 'BOOK',
    'ancient book': 'BOOK',
    'scroll': 'SCROLL',
    'parchment': 'SCROLL',
    'letter': 'SCROLL',
    'weathered scroll': 'SCROLL',
    'sealed letter': 'SCROLL',
    'parchment roll': 'SCROLL',
    'blank parchment roll': 'SCROLL',
    'manuscript': 'BOOK',
    'codex': 'BOOK',
    'religious text': 'BOOK',
    'prayer book': 'BOOK',
    'blessed artifact': 'BOOK',
    
    // === CONSUMABLES & POTIONS ===
    'potion': 'POTION',
    'elixir': 'POTION',
    'tincture': 'POTION',
    'healing potion': 'POTION',
    'health potion': 'POTION',
    'medicine': 'POTION',
    'remedy': 'POTION',
    'salve': 'POTION',
    'ointment': 'POTION',
    'balm': 'POTION',
    'vial of venom': 'POTION',
    
    // Herbs & Plants
    'herb': 'APPLE',
    'herbs': 'APPLE',
    'medicinal herbs': 'APPLE',
    'healing herb': 'APPLE',
    'herb bundle': 'APPLE',
    'refreshing herb': 'APPLE',
    'mushroom': 'APPLE',
    'edible mushroom': 'APPLE',
    'toadstool': 'APPLE',
    'moss': 'APPLE',
    'glowing moss': 'APPLE',
    'flower': 'APPLE',
    'dried flowers': 'APPLE',
    'petals': 'APPLE',
    'leaf': 'APPLE',
    'leaves': 'APPLE',
    'dry leaves': 'APPLE',
    'acorns': 'APPLE',
    'handful of acorns': 'APPLE',
    'pine cone': 'ORE',
    'cactus fruit': 'APPLE',
    'strange fruit': 'APPLE',
    'owl feather': 'QUILL',
    'eagle feather': 'QUILL',
    'magic feather': 'QUILL',
    'olives': 'APPLE',
    'jar of olives': 'APPLE',
    'spice pouch': 'BAG',
    
    // === CONTAINERS ===
    'bag': 'BAG',
    'pouch': 'BAG',
    'sack': 'BAG',
    'satchel': 'BAG',
    'knapsack': 'BAG',
    'purse': 'BAG',
    'coin purse': 'BAG',
    'leather purse': 'BAG',
    'chest': 'BOX',
    'coffer': 'BOX',
    'strongbox': 'BOX',
    'box': 'BOX',
    'crate': 'BOX',
    'barrel': 'BOWL',
    'cask': 'BOWL',
    'keg': 'BOWL',
    'jar': 'BOWL',
    'jug': 'BOWL',
    'pitcher': 'BOWL',
    'ewer': 'BOWL',
    'vial': 'POTION',
    'bottle': 'POTION',
    'flask': 'POTION',
    'waterskin': 'BAG',
    'skin': 'BAG',
    'water bottle': 'POTION',
    'wine bottle': 'POTION',
    'ale jug': 'BOWL',
    'basket': 'BAG',
    'wicker basket': 'BAG',
    'reed basket': 'BAG',
    'birds nest': 'BAG',
    'bird\'s nest': 'BAG',
    
    // === CREATURES & ANIMAL PARTS ===
    'worm': 'WORM',
    'earthworm': 'WORM',
    'grub': 'WORM',
    'maggot': 'WORM',
    'caterpillar': 'WORM',
    'insect': 'WORM',
    'bug': 'WORM',
    'beetle': 'WORM',
    'spider': 'WORM',
    'fly': 'WORM',
    'bee': 'WORM',
    'wasp': 'WORM',
    'ant': 'WORM',
    'cricket': 'WORM',
    'grasshopper': 'WORM',
    'locust': 'WORM',
    
    // === MISCELLANEOUS ===
    'coin': 'RING',
    'copper coin': 'RING',
    'silver coin': 'RING',
    'gold coin': 'RING',
    'gem': 'RING',
    'jewel': 'RING',
    'diamond': 'RING',
    'ruby': 'RING',
    'emerald': 'RING',
    'sapphire': 'RING',
    'crystal': 'ORE',
    'key': 'STICK',
    'iron key': 'STICK',
    'brass key': 'STICK',
    'lock': 'BOX',
    'padlock': 'BOX',
    'chain': 'ROPE',
    'iron chain': 'ROPE',
    'shackles': 'ROPE',
    'manacles': 'ROPE',
    'horseshoe': 'RING',
    'iron horseshoe': 'RING',
    'nail': 'STICK',
    'iron nail': 'STICK',
    'spike': 'STICK',
    'peg': 'STICK',
    'pin': 'STICK',
    'brooch': 'RING',
    'clasp': 'RING',
    'buckle': 'RING',
    'belt buckle': 'RING',
    'mirror': 'BOWL',
    'looking glass': 'BOWL',
    'comb': 'STICK',
    'bone comb': 'STICK',
    'brush': 'STICK',
    'hair brush': 'STICK',
    'broom': 'STICK',
    'besom': 'STICK',
    'mop': 'STICK',
    'incense': 'STICK',
    'incense sticks': 'STICK',
    'pottery shard': 'ORE',
    'bioluminescent goop': 'POTION',
    'whale blubber': 'MEAT',
    'ambergris': 'ORE',
    'ochre': 'ORE',
    'lump of ochre': 'ORE',
    'small bomb': 'ORE',
    'scroll of knowledge': 'SCROLL'
};

// Helper function to get archetype for any item name
export function getItemArchetype(itemName: string): string {
    const lowercaseName = itemName.toLowerCase();
    
    // Direct match first
    if (ITEM_ARCHETYPES[lowercaseName]) {
        return ITEM_ARCHETYPES[lowercaseName];
    }
    
    // Fuzzy matching for compound names
    const words = lowercaseName.split(/\s+/);
    for (const word of words) {
        if (ITEM_ARCHETYPES[word]) {
            return ITEM_ARCHETYPES[word];
        }
    }
    
    // Pattern matching for common formats
    for (const [pattern, archetype] of Object.entries(ITEM_ARCHETYPES)) {
        if (lowercaseName.includes(pattern) || pattern.includes(lowercaseName.split(' ').slice(-1)[0])) {
            return archetype;
        }
    }
    
    // Default fallback based on common endings
    if (lowercaseName.includes('bag') || lowercaseName.includes('sack')) return 'GRAIN_BAG';
    if (lowercaseName.includes('grain') || lowercaseName.includes('seed')) return 'GRAIN';
    if (lowercaseName.includes('meat') || lowercaseName.includes('flesh')) return 'MEAT';
    if (lowercaseName.includes('fish')) return 'FISH';
    if (lowercaseName.includes('bread') || lowercaseName.includes('loaf')) return 'BREAD';
    if (lowercaseName.includes('stone') || lowercaseName.includes('rock')) return 'ROUGH_STONE';
    if (lowercaseName.includes('stick') || lowercaseName.includes('rod')) return 'STICK';
    if (lowercaseName.includes('worm') || lowercaseName.includes('grub')) return 'WORM';
    if (lowercaseName.includes('herb') || lowercaseName.includes('plant')) return 'APPLE';
    if (lowercaseName.includes('potion') || lowercaseName.includes('elixir')) return 'POTION';
    
    // Ultimate fallback
    return 'ROUGH_STONE';
}