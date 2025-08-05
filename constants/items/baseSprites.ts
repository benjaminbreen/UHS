/**
 * constants/items/baseSprites.ts - SVG path data for generative item icons.
 * Each key represents an item type, and the value is an object of SVG path strings for each layer.
 * All paths are designed for a 24x24 viewBox.
 */

export const BASE_SPRITES: Record<string, Record<string, string>> = {
    // --- Weapons ---
    SWORD: {
        blade: "M12,2 L14,15 L12,22 L10,15 Z",
        guard: "M8,14 L16,14 L16,16 L8,16 Z",
        hilt: "M11,16 L13,16 L13,20 L11,20 Z",
        pommel: "M10.5,20 L13.5,20 L13.5,21 L10.5,21 Z",
    },
    AXE: {
        head: "M12,2 L20,4 L20,10 L12,12 Z",
        haft: "M11,8 L13,8 L13,22 L11,22 Z",
    },
    SHIELD: {
        base: "M4,4 C4,2 8,2 12,2 C16,2 20,2 20,4 L20,16 C20,22 12,22 12,22 C12,22 4,22 4,16 Z",
        trim: "M4,4 C4,2 8,2 12,2 C16,2 20,2 20,4 L20,16 C20,22 12,22 12,22 C12,22 4,22 4,16 Z",
        boss: "M12,12 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0",
    },
    // --- Clothing ---
    HELMET: {
        main: "M4,10 C4,4 20,4 20,10 L20,16 L4,16 Z",
        visor: "M8,10 L16,10 L16,12 L8,12 Z",
        trim: "M4,15 L20,15 L20,16 L4,16 Z",
    },
    CHEST_ARMOR: {
        main: "M4,6 L20,6 L18,20 L6,20 Z",
        straps: "M8,4 L10,6 M16,4 L14,6",
        trim: "M4,6 L20,6 L20,8 L4,8 Z",
    },
    BOOTS: {
        main: "M6,8 L18,8 L16,20 L8,20 Z",
        sole: "M6,19 L18,19 L18,21 L6,21 Z",
        trim: "M6,8 L18,8 L18,10 L6,10 Z",
    },
    TUNIC: {
        base: "M5,6 L19,6 L21,14 L18,21 L6,21 L3,14 Z",
        trim: "M9,6 L15,6 L15,8 L9,8 Z M3,14 L5,16 M21,14 L19,16",
        shadow: "M12,7 L12,20"
    },
    HOOD: {
        base: "M6,8 C6,2 18,2 18,8 L16,18 L8,18 Z",
        trim: "M8,17 L16,17 L15,19 L9,19 Z",
        shadow: "M12,3 L12,17"
    },
    PANTS: {
        base: "M6,4 L10,4 L12,12 L14,4 L18,4 L16,22 L13,22 L13,14 L11,14 L11,22 L8,22 Z",
        belt: "M6,4 L18,4 L18,6 L6,6 Z"
    },
    SANDALS: {
        straps: "M8,16 L10,14 L14,14 L16,16 M10,14 L10,18 M14,14 L14,18",
        sole: "M6,18 C8,22 16,22 18,18 L16,17 L8,17 Z"
    },
    // --- Consumables & Documents ---
    POTION: {
        liquid: "M8,10 C8,6 16,6 16,10 L16,20 C16,22 14,22 12,22 C10,22 8,22 8,20 Z",
        bottle: "M7,9 C7,4 17,4 17,9 L17,21 C17,23 15,23 12,23 C9,23 7,23 7,21 Z",
        cork: "M10,2 L14,2 L14,5 L10,5 Z",
    },
    SCROLL: {
        paper: "M6,4 C2,4 2,20 6,20 L18,20 C22,20 22,4 18,4 Z",
        tie: "M11,3 L13,3 L13,21 L11,21 Z",
    },
    BOOK: {
        cover: "M4,4 L20,2 L20,20 L4,22 Z",
        pages: "M6,4 L19,2.5 L19,19.5 L6,21 Z",
        binding: "M4,4 L4,22",
    },
    // --- Jewelry ---
    RING: {
        band: "M12,18 C8,18 6,16 6,12 C6,8 8,6 12,6 C16,6 18,8 18,12 C18,16 16,18 12,18 Z M12,16 C9,16 8,15 8,12 C8,9 9,8 12,8 C15,8 16,9 16,12 C16,15 15,16 12,16 Z",
        gem: "M10,4 L14,4 L12,8 Z",
    },
    AMULET: {
        chain: "M12,2 C6,2 6,12 12,12 C18,12 18,2 12,2",
        pendant: "M10,12 L14,12 L12,18 Z",
    },
    // --- Common Goods ---
    BOWL: {
        base: "M4,12 C4,18 20,18 20,12 L18,10 L6,10 Z",
        inner_shadow: "M6,11 C6,15 18,15 18,11",
        highlight: "M7,10.5 L12,10.5"
    },
    CLAY_LAMP: {
        base: "M6,12 C2,12 4,18 10,18 L18,18 C20,18 22,14 18,12 Z",
        wick_holder: "M18,12 L21,10 L20,13 Z",
        flame: "M20,9 C22,7 20,5 20,5 C20,5 18,7 20,9 Z"
    },
    HAMMER: {
        head: "M4,6 L8,4 L10,6 L10,10 L8,12 L4,10 Z M14,4 L18,6 L18,10 L14,12 Z",
        haft: "M11,8 L13,8 L13,20 L11,20 Z"
    },
    FOOD: {
        main: "M6,14 C4,12 6,8 10,8 C14,8 18,10 18,14 C20,18 16,20 12,20 C8,20 4,18 6,14 Z",
        bone: "M10,10 L14,14",
    }
};
