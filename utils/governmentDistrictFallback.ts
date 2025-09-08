/**
 * utils/governmentDistrictFallback.ts
 * Provides intelligent fallback logic for missing government district data
 */

import { HistoricalEra, CulturalZone } from '../types';
import { GovernmentDistrictType } from '../constants/gameData/governmentDistricts';
import { REGION_SPECIFIC_DISTRICTS, CULTURAL_ZONE_DISTRICTS } from '../constants/gameData/governmentDistricts';
import { SpecialMapArchetype } from '../types/specialMapTypes';

/**
 * Era progression for fallback logic
 */
const ERA_PROGRESSION: HistoricalEra[] = [
  HistoricalEra.PREHISTORY,
  HistoricalEra.ANTIQUITY,
  HistoricalEra.MEDIEVAL,
  HistoricalEra.RENAISSANCE_EARLY_MODERN,
  HistoricalEra.INDUSTRIAL_ERA,
  HistoricalEra.MODERN_ERA
];

/**
 * Get the closest era to the target era
 */
function getClosestEras(targetEra: HistoricalEra): HistoricalEra[] {
  const targetIndex = ERA_PROGRESSION.indexOf(targetEra);
  if (targetIndex === -1) return ERA_PROGRESSION;
  
  const result: HistoricalEra[] = [targetEra];
  let distance = 1;
  
  // Add eras at increasing distances until we have all
  while (result.length < ERA_PROGRESSION.length) {
    // Check era before
    if (targetIndex - distance >= 0) {
      result.push(ERA_PROGRESSION[targetIndex - distance]);
    }
    // Check era after
    if (targetIndex + distance < ERA_PROGRESSION.length) {
      result.push(ERA_PROGRESSION[targetIndex + distance]);
    }
    distance++;
  }
  
  return result;
}

/**
 * Get era-appropriate fallback name for a palace/government building
 */
export function getEraAppropriateName(
  archetype: SpecialMapArchetype,
  culturalZone: CulturalZone,
  era: HistoricalEra
): string {
  // Era-specific default names by archetype and culture
  const defaultNames: Record<string, Record<CulturalZone, Record<HistoricalEra, string>>> = {
    [SpecialMapArchetype.PALACE_COMPLEX]: {
      EUROPEAN: {
        [HistoricalEra.PREHISTORY]: 'Chieftain\'s Hall',
        [HistoricalEra.ANTIQUITY]: 'Imperial Palace',
        [HistoricalEra.MEDIEVAL]: 'Royal Castle',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Royal Palace',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Royal Palace',
        [HistoricalEra.MODERN_ERA]: 'Presidential Palace'
      },
      MENA: {
        [HistoricalEra.PREHISTORY]: 'Tribal Chief\'s Dwelling',
        [HistoricalEra.ANTIQUITY]: 'Royal Palace',
        [HistoricalEra.MEDIEVAL]: 'Sultan\'s Palace',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Pasha\'s Palace',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Khedive\'s Palace',
        [HistoricalEra.MODERN_ERA]: 'Presidential Palace'
      },
      EAST_ASIAN: {
        [HistoricalEra.PREHISTORY]: 'Clan Leader\'s Compound',
        [HistoricalEra.ANTIQUITY]: 'Royal Palace',
        [HistoricalEra.MEDIEVAL]: 'Imperial Palace',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Forbidden City',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Imperial Palace',
        [HistoricalEra.MODERN_ERA]: 'Government House'
      },
      SUB_SAHARAN_AFRICAN: {
        [HistoricalEra.PREHISTORY]: 'Chief\'s Compound',
        [HistoricalEra.ANTIQUITY]: 'Royal Compound',
        [HistoricalEra.MEDIEVAL]: 'King\'s Palace',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Royal Palace',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Colonial Governor\'s Mansion',
        [HistoricalEra.MODERN_ERA]: 'Presidential Palace'
      },
      SOUTH_ASIAN: {
        [HistoricalEra.PREHISTORY]: 'Tribal Chief\'s Hall',
        [HistoricalEra.ANTIQUITY]: 'Raja\'s Palace',
        [HistoricalEra.MEDIEVAL]: 'Sultan\'s Palace',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Mughal Palace',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Viceroy\'s Palace',
        [HistoricalEra.MODERN_ERA]: 'Presidential Palace'
      },
      SOUTH_AMERICAN: {
        [HistoricalEra.PREHISTORY]: 'Tribal Council Hall',
        [HistoricalEra.ANTIQUITY]: 'Temple-Palace Complex',
        [HistoricalEra.MEDIEVAL]: 'Inca Kallanka',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Viceregal Palace',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Government Palace',
        [HistoricalEra.MODERN_ERA]: 'Presidential Palace'
      },
      NORTH_AMERICAN_PRE_COLUMBIAN: {
        [HistoricalEra.PREHISTORY]: 'Council Lodge',
        [HistoricalEra.ANTIQUITY]: 'Great Lodge',
        [HistoricalEra.MEDIEVAL]: 'Council Longhouse',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Council Hall',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Tribal Council Building',
        [HistoricalEra.MODERN_ERA]: 'Tribal Government Center'
      },
      NORTH_AMERICAN_COLONIAL: {
        [HistoricalEra.PREHISTORY]: 'Meeting House',
        [HistoricalEra.ANTIQUITY]: 'Meeting House',
        [HistoricalEra.MEDIEVAL]: 'Meeting House',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Colonial Assembly',
        [HistoricalEra.INDUSTRIAL_ERA]: 'State Capitol',
        [HistoricalEra.MODERN_ERA]: 'Government Building'
      },
      NATIVE_AMERICAN: {
        [HistoricalEra.PREHISTORY]: 'Chief\'s Lodge',
        [HistoricalEra.ANTIQUITY]: 'Great Chief\'s Compound',
        [HistoricalEra.MEDIEVAL]: 'Cacique\'s Palace',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Governor\'s Palace',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Government House',
        [HistoricalEra.MODERN_ERA]: 'Presidential Palace'
      },
      OCEANIA: {
        [HistoricalEra.PREHISTORY]: 'Chief\'s Hale',
        [HistoricalEra.ANTIQUITY]: 'Ali\'i Palace',
        [HistoricalEra.MEDIEVAL]: 'Royal Compound',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Royal Palace',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Colonial Administration',
        [HistoricalEra.MODERN_ERA]: 'Government House'
      }
    },
    [SpecialMapArchetype.GOVERNMENT_FORUM]: {
      EUROPEAN: {
        [HistoricalEra.PREHISTORY]: 'Elder\'s Circle',
        [HistoricalEra.ANTIQUITY]: 'Senate House',
        [HistoricalEra.MEDIEVAL]: 'Council Chamber',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Assembly Hall',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Parliament House',
        [HistoricalEra.MODERN_ERA]: 'Parliament Building'
      },
      MENA: {
        [HistoricalEra.PREHISTORY]: 'Tribal Council',
        [HistoricalEra.ANTIQUITY]: 'Council of Elders',
        [HistoricalEra.MEDIEVAL]: 'Majlis',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Divan',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Assembly Hall',
        [HistoricalEra.MODERN_ERA]: 'Parliament'
      },
      EAST_ASIAN: {
        [HistoricalEra.PREHISTORY]: 'Elder\'s Hall',
        [HistoricalEra.ANTIQUITY]: 'Court of Ministers',
        [HistoricalEra.MEDIEVAL]: 'Imperial Court',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Mandarin Court',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Assembly Hall',
        [HistoricalEra.MODERN_ERA]: 'People\'s Congress'
      },
      SUB_SAHARAN_AFRICAN: {
        [HistoricalEra.PREHISTORY]: 'Council of Elders',
        [HistoricalEra.ANTIQUITY]: 'King\'s Court',
        [HistoricalEra.MEDIEVAL]: 'Royal Court',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Council Chamber',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Colonial Assembly',
        [HistoricalEra.MODERN_ERA]: 'Parliament'
      },
      SOUTH_ASIAN: {
        [HistoricalEra.PREHISTORY]: 'Panchayat',
        [HistoricalEra.ANTIQUITY]: 'Royal Sabha',
        [HistoricalEra.MEDIEVAL]: 'Durbar',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Mughal Court',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Legislative Council',
        [HistoricalEra.MODERN_ERA]: 'Parliament'
      },
      SOUTH_AMERICAN: {
        [HistoricalEra.PREHISTORY]: 'Council Ground',
        [HistoricalEra.ANTIQUITY]: 'Temple Council',
        [HistoricalEra.MEDIEVAL]: 'Inca Kallanka',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Cabildo',
        [HistoricalEra.INDUSTRIAL_ERA]: 'National Congress',
        [HistoricalEra.MODERN_ERA]: 'Congress Building'
      },
      NORTH_AMERICAN_PRE_COLUMBIAN: {
        [HistoricalEra.PREHISTORY]: 'Council Fire',
        [HistoricalEra.ANTIQUITY]: 'Council Lodge',
        [HistoricalEra.MEDIEVAL]: 'Grand Council',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Tribal Assembly',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Council House',
        [HistoricalEra.MODERN_ERA]: 'Tribal Council'
      },
      NORTH_AMERICAN_COLONIAL: {
        [HistoricalEra.PREHISTORY]: 'Town Meeting',
        [HistoricalEra.ANTIQUITY]: 'Town Meeting',
        [HistoricalEra.MEDIEVAL]: 'Town Meeting',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Colonial Assembly',
        [HistoricalEra.INDUSTRIAL_ERA]: 'State Legislature',
        [HistoricalEra.MODERN_ERA]: 'Capitol Building'
      },
      NATIVE_AMERICAN: {
        [HistoricalEra.PREHISTORY]: 'Council Lodge',
        [HistoricalEra.ANTIQUITY]: 'Grand Council',
        [HistoricalEra.MEDIEVAL]: 'Assembly Place',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Council House',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Government Building',
        [HistoricalEra.MODERN_ERA]: 'Congress Building'
      },
      OCEANIA: {
        [HistoricalEra.PREHISTORY]: 'Council Ground',
        [HistoricalEra.ANTIQUITY]: 'Chiefs\' Assembly',
        [HistoricalEra.MEDIEVAL]: 'Royal Council',
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'Assembly Hall',
        [HistoricalEra.INDUSTRIAL_ERA]: 'Colonial Assembly',
        [HistoricalEra.MODERN_ERA]: 'Parliament House'
      }
    }
  };

  // Try to get the name for the exact era and culture
  const archetypeNames = defaultNames[archetype];
  if (archetypeNames) {
    const cultureNames = archetypeNames[culturalZone];
    if (cultureNames && cultureNames[era]) {
      return cultureNames[era];
    }
  }

  // Fallback to generic names based on archetype
  switch (archetype) {
    case SpecialMapArchetype.PALACE_COMPLEX:
      return 'Palace Complex';
    case SpecialMapArchetype.GOVERNMENT_FORUM:
      return 'Government Building';
    case SpecialMapArchetype.MARKET_BAZAAR:
      return 'Market';
    case SpecialMapArchetype.SACRED_COMPLEX:
      return 'Temple';
    case SpecialMapArchetype.MILITARY_FORTRESS:
      return 'Fortress';
    default:
      return 'Special Building';
  }
}

/**
 * Find the best available government district with intelligent fallback
 */
export function findBestGovernmentDistrict(
  region: string | undefined,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  preferredArchetype?: SpecialMapArchetype
): GovernmentDistrictType | null {
  // 1. Try exact region and era match
  if (region && REGION_SPECIFIC_DISTRICTS[region]) {
    const regionDistricts = REGION_SPECIFIC_DISTRICTS[region][era];
    if (regionDistricts && regionDistricts.length > 0) {
      if (preferredArchetype) {
        const match = regionDistricts.find(d => d.archetype === preferredArchetype);
        if (match) return match;
      }
      return regionDistricts[0];
    }
    
    // 2. Try same region, different era (closest first)
    const closestEras = getClosestEras(era);
    for (const fallbackEra of closestEras) {
      const fallbackDistricts = REGION_SPECIFIC_DISTRICTS[region][fallbackEra];
      if (fallbackDistricts && fallbackDistricts.length > 0) {
        if (preferredArchetype) {
          const match = fallbackDistricts.find(d => d.archetype === preferredArchetype);
          if (match) {
            // Clone and update the name to be era-appropriate
            return {
              ...match,
              name: getEraAppropriateName(match.archetype, culturalZone, era)
            };
          }
        }
        // Clone the first available and update name
        return {
          ...fallbackDistricts[0],
          name: getEraAppropriateName(fallbackDistricts[0].archetype, culturalZone, era)
        };
      }
    }
  }
  
  // 3. Try cultural zone with exact era
  const zoneDistricts = CULTURAL_ZONE_DISTRICTS[culturalZone];
  if (zoneDistricts) {
    const eraDistricts = zoneDistricts[era];
    if (eraDistricts && eraDistricts.length > 0) {
      if (preferredArchetype) {
        const match = eraDistricts.find(d => d.archetype === preferredArchetype);
        if (match) return match;
      }
      return eraDistricts[0];
    }
    
    // 4. Try cultural zone with different era (closest first)
    const closestEras = getClosestEras(era);
    for (const fallbackEra of closestEras) {
      const fallbackDistricts = zoneDistricts[fallbackEra];
      if (fallbackDistricts && fallbackDistricts.length > 0) {
        if (preferredArchetype) {
          const match = fallbackDistricts.find(d => d.archetype === preferredArchetype);
          if (match) {
            // Clone and update the name to be era-appropriate
            return {
              ...match,
              name: getEraAppropriateName(match.archetype, culturalZone, era)
            };
          }
        }
        // Clone the first available and update name
        return {
          ...fallbackDistricts[0],
          name: getEraAppropriateName(fallbackDistricts[0].archetype, culturalZone, era)
        };
      }
    }
  }
  
  // 5. Final fallback - create a generic one with era-appropriate name
  const fallbackArchetype = preferredArchetype || SpecialMapArchetype.GOVERNMENT_FORUM;
  return {
    id: 'fallback_building',
    name: getEraAppropriateName(fallbackArchetype, culturalZone, era),
    archetype: fallbackArchetype,
    description: 'Administrative center',
    districtType: 'administration',
    symbolType: 'AdminCenterSymbol',
    priority: 5
  };
}

/**
 * Ensure a government district has an era-appropriate name
 */
export function ensureEraAppropriateName(
  district: GovernmentDistrictType,
  culturalZone: CulturalZone,
  era: HistoricalEra
): GovernmentDistrictType {
  // If the district already has a good name, keep it
  if (district.name && !district.name.includes('Generic') && !district.name.includes('Administrative')) {
    return district;
  }
  
  // Otherwise, generate an era-appropriate name
  return {
    ...district,
    name: getEraAppropriateName(district.archetype, culturalZone, era)
  };
}