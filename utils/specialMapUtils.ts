/**
 * Utility functions for special map system
 * Minimal helper functions without architectural conflicts
 */

/**
 * Map districtType to assembly layout type for government forums
 * This is used by government generators to determine seating arrangements
 */
export const DISTRICT_TO_ASSEMBLY_TYPE: Record<string, string> = {
  'sacred_council': 'amphitheater',      // Theocracy: centered religious gathering
  'parliament': 'opposing-benches',      // Democracy: parliamentary debate style
  'military_council': 'great-hall',      // Military: hierarchical command structure
  'forum': 'hemicycle',                  // Republic: semicircular senate
  'palace': 'great-hall',                 // Monarchy: throne-focused hall
  'council': 'hemicycle',                 // Generic council
  'colonial_office': 'opposing-benches', // Colonial administration
  'administration': 'opposing-benches',  // Modern bureaucracy
  'settlement_council': 'hemicycle',     // Small settlement
  'compound': 'great-hall',               // Tribal compound
  'chiefly_court': 'amphitheater',      // Tribal chief
  'royal_temple': 'amphitheater',        // Religious monarchy
  'royal_hall': 'great-hall',            // Royal court
  'castle': 'great-hall',                 // Medieval castle
  'hillfort': 'amphitheater',           // Ancient fortification
  'sacred_assembly': 'amphitheater',     // Religious assembly
  'assembly': 'hemicycle',                // Generic assembly
};

/**
 * Normalize cultural zone names to match our generator system
 * Handles various naming conventions and aliases
 */
export function normalizeCulturalZone(zone: string | undefined): string {
  if (!zone) return 'EUROPEAN'; // Default fallback
  
  const normalized = zone.toUpperCase().replace(/-/g, '_');
  
  // Map aliases to standard names
  const mapping: Record<string, string> = {
    // Asian variations
    'CHINESE': 'EAST_ASIAN',
    'JAPANESE': 'EAST_ASIAN',
    'KOREAN': 'EAST_ASIAN',
    'MONGOLIAN': 'EAST_ASIAN',
    'TIBETAN': 'EAST_ASIAN',
    
    // Middle Eastern variations
    'ISLAMIC': 'MENA',
    'ARAB': 'MENA',
    'ARABIC': 'MENA',
    'PERSIAN': 'MENA',
    'OTTOMAN': 'MENA',
    'TURKISH': 'MENA',
    'MIDDLE_EASTERN': 'MENA',
    
    // African variations
    'AFRICAN': 'SUB_SAHARAN_AFRICAN',
    'SUB_SAHARAN': 'SUB_SAHARAN_AFRICAN',
    'WEST_AFRICAN': 'SUB_SAHARAN_AFRICAN',
    'EAST_AFRICAN': 'SUB_SAHARAN_AFRICAN',
    'CENTRAL_AFRICAN': 'SUB_SAHARAN_AFRICAN',
    
    // Native American variations
    'NATIVE_AMERICAN': 'NORTH_AMERICAN_PRE_COLUMBIAN',
    'INDIGENOUS_AMERICAN': 'NORTH_AMERICAN_PRE_COLUMBIAN',
    'NORTH_AMERICAN': 'NORTH_AMERICAN_PRE_COLUMBIAN',
    'MESOAMERICAN': 'NORTH_AMERICAN_PRE_COLUMBIAN',
    
    // European variations
    'MEDIEVAL': 'EUROPEAN',
    'FEUDAL': 'EUROPEAN',
    'CHRISTIAN': 'EUROPEAN',
    'GOTHIC': 'EUROPEAN',
    
    // Oceanic variations
    'OCEANIC': 'OCEANIA',
    'PACIFIC_ISLANDER': 'OCEANIA',
    'POLYNESIAN': 'OCEANIA',
    'MELANESIAN': 'OCEANIA',
  };
  
  return mapping[normalized] || normalized;
}

/**
 * Get appropriate map size based on era and importance
 * Simple heuristic without complex overrides
 */
export function getMapSizeForEra(year: number): 'small' | 'medium' | 'large' {
  if (year < -3000) return 'small';   // Prehistoric
  if (year < 500) return 'small';     // Ancient
  if (year < 1500) return 'medium';   // Medieval
  if (year < 1900) return 'medium';   // Early Modern
  return 'large';                     // Modern
}