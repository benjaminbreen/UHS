/**
 * constants/items/materialPalettes.ts - Color palettes for generative item icons.
 * Maps material names to a set of base, shadow, and highlight colors.
 */

export interface MaterialPalette {
    base: string;
    shadow: string;
    highlight: string;
    accent?: string;
    pattern?: 'wood_grain' | 'metal_shine' | 'fabric_weave' | 'stone_texture' | 'gem_facets';
}

export const MATERIAL_PALETTES: Record<string, MaterialPalette> = {
    // --- Metals ---
    IRON: { base: '#adb5bd', shadow: '#6c757d', highlight: '#dee2e6', accent: '#495057', pattern: 'metal_shine' },
    STEEL: { base: '#ced4da', shadow: '#868e96', highlight: '#f8f9fa', accent: '#495057', pattern: 'metal_shine' },
    GOLD: { base: '#fcc419', shadow: '#e6a100', highlight: '#ffd43b', accent: '#ffec99', pattern: 'metal_shine' },
    SILVER: { base: '#e0e0e0', shadow: '#b0b0b0', highlight: '#ffffff', accent: '#9e9e9e', pattern: 'metal_shine' },
    COPPER: { base: '#b87333', shadow: '#8c5023', highlight: '#d6894b', accent: '#5a341a', pattern: 'metal_shine' },
    BRONZE: { base: '#cd7f32', shadow: '#a66629', highlight: '#e0984f', accent: '#6d451b', pattern: 'metal_shine' },
    TIN: { base: '#d1d5db', shadow: '#9ca3af', highlight: '#f3f4f6', pattern: 'metal_shine' },
    LEAD: { base: '#4b5563', shadow: '#1f2937', highlight: '#6b7280', pattern: 'metal_shine' },

    // --- Woods ---
    WOOD: { base: '#8b5a2b', shadow: '#5d3a1b', highlight: '#a06e3e', accent: '#4e342e', pattern: 'wood_grain' },
    OAK_WOOD: { base: '#9c6644', shadow: '#654321', highlight: '#b5835a', pattern: 'wood_grain' },
    PINE_WOOD: { base: '#c68f65', shadow: '#8b5a2b', highlight: '#e0ac8a', pattern: 'wood_grain' },
    DARK_WOOD: { base: '#4e342e', shadow: '#260e04', highlight: '#6a4f4b', pattern: 'wood_grain' },

    // --- Leathers ---
    LEATHER: { base: '#795548', shadow: '#4e342e', highlight: '#8d6e63', accent: '#3e2723' },
    TANNED_LEATHER: { base: '#a1662f', shadow: '#713f12', highlight: '#c08457' },
    RAWHIDE: { base: '#eaddc7', shadow: '#d1bfa2', highlight: '#f7f2e8' },

    // --- Base Fabrics ---
    CLOTH: { base: '#a3a3a3', shadow: '#737373', highlight: '#d4d4d4', accent: '#525252', pattern: 'fabric_weave' },
    LINEN_CLOTH: { base: '#f5f5dc', shadow: '#d3d3b6', highlight: '#ffffff', accent: '#a9a98c', pattern: 'fabric_weave' },
    WOOL_CLOTH: { base: '#f5f5f5', shadow: '#dcdcdc', highlight: '#ffffff', accent: '#c0c0c0', pattern: 'fabric_weave' },
    SILK_CLOTH: { base: '#fffafa', shadow: '#f0f0f0', highlight: '#ffffff', accent: '#e6e6fa', pattern: 'fabric_weave' },
    HEMP_CLOTH: { base: '#d2b48c', shadow: '#a08a6c', highlight: '#e6cc9c', pattern: 'fabric_weave' },

    // --- Natural Dyes (to be applied over fabrics) ---
    OCHRE_RED: { base: '#b94724', shadow: '#84280b', highlight: '#d86a49' },
    WELD_YELLOW: { base: '#fde047', shadow: '#eac20a', highlight: '#feec8c' },
    INDIGO_BLUE: { base: '#312e81', shadow: '#1e1b4b', highlight: '#4f46e5' },
    MADDER_RED: { base: '#c11d1d', shadow: '#8b0000', highlight: '#dc2626' },
    WOAD_BLUE: { base: '#60a5fa', shadow: '#2563eb', highlight: '#93c5fd' },
    TYRIAN_PURPLE: { base: '#66023c', shadow: '#4c012c', highlight: '#8d0354' },
    WALNUT_BROWN: { base: '#4e342e', shadow: '#260e04', highlight: '#6a4f4b' },
    ONION_SKIN_GOLD: { base: '#ca8a04', shadow: '#854d0e', highlight: '#eab308' },

    // --- Other Materials ---
    GLASS: { base: 'rgba(200, 220, 240, 0.6)', shadow: 'rgba(150, 180, 220, 0.7)', highlight: 'rgba(230, 245, 255, 0.8)', accent: 'rgba(255, 255, 255, 0.5)' },
    PAPER: { base: '#fdf6e3', shadow: '#f5e5c5', highlight: '#fffefa', accent: '#d8c7a9' },
    CLAY_POTTERY: { base: '#b06135', shadow: '#83401d', highlight: '#d0825a' },
    STONEWARE: { base: '#a8a29e', shadow: '#78716c', highlight: '#d6d3d1', pattern: 'stone_texture' },
    BONE: { base: '#f5f5f5', shadow: '#e5e5e5', highlight: '#ffffff' },
    
    // --- Food Materials ---
    BREAD_DOUGH: { base: '#f4e4c1', shadow: '#d4c4a1', highlight: '#fff8e7', accent: '#b8956b' },
    BREAD_CRUST: { base: '#d4a574', shadow: '#b8956b', highlight: '#e8c4a0', accent: '#8b7355' },
    FRESH_MEAT: { base: '#c4616a', shadow: '#a04f56', highlight: '#d87a82', accent: '#7d3c42' },
    
    // --- Common Clothing Colors ---
    SADDLE_BROWN: { base: '#8b4513', shadow: '#654321', highlight: '#a0522d', accent: '#5d2f0a', pattern: 'fabric_weave' },
    FOREST_GREEN: { base: '#228b22', shadow: '#006400', highlight: '#32cd32', accent: '#013220', pattern: 'fabric_weave' },
    DEEP_BLUE: { base: '#191970', shadow: '#000080', highlight: '#4169e1', accent: '#0c0c50', pattern: 'fabric_weave' },
    BURGUNDY: { base: '#800020', shadow: '#4a0012', highlight: '#a0002a', accent: '#2a000a', pattern: 'fabric_weave' },
    CHARCOAL: { base: '#36454f', shadow: '#2c363f', highlight: '#4a5660', accent: '#1e252a', pattern: 'fabric_weave' },
    CREAM: { base: '#fffdd0', shadow: '#f0edc0', highlight: '#ffffff', accent: '#d0cdb0', pattern: 'fabric_weave' },
    RUST_RED: { base: '#b7410e', shadow: '#8b3208', highlight: '#d4601a', accent: '#5d1f04', pattern: 'fabric_weave' },

    // --- Gemstones ---
    GEMSTONE_RED: { base: '#e53e3e', shadow: '#9b2c2c', highlight: '#fc8181', accent: '#c53030', pattern: 'gem_facets' },
    GEMSTONE_BLUE: { base: '#4299e1', shadow: '#2b6cb0', highlight: '#90cdf4', accent: '#3182ce', pattern: 'gem_facets' },
    GEMSTONE_GREEN: { base: '#48bb78', shadow: '#2f855a', highlight: '#9ae6b4', accent: '#38a169', pattern: 'gem_facets' },

    DEFAULT: { base: '#d4a574', shadow: '#b8956b', highlight: '#e8c4a0', accent: '#8b7355' }, // Light brown fallback
};
