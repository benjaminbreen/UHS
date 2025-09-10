/**
 * utils/cityDetectionUtils.ts - Centralized city detection for map generation
 */
import { HistoricalEra } from '../types';
import { CITIES_DATA } from '../constants/gameData/cities';
import { PROCEDURAL_CITY_DATA } from '../constants/gameData/proceduralCityData';

export interface CityInfo {
    name: string;
    description?: string;
    urbanDensity?: 'small' | 'moderate' | 'large' | 'massive';
    foundingYear?: number;
    declineYear?: number;
    eras?: HistoricalEra[];
    populationPeak?: number;
}

export interface CityDetectionResult {
    hasCities: boolean;
    activeCities: CityInfo[];
    cityDensity?: 'small' | 'moderate' | 'large' | 'massive';
    source: 'cities.ts' | 'procedural' | 'none';
    checkedAreas: string[];
}

/**
 * Detects cities for a given area, checking both historical and procedural city data
 */
export function detectCitiesForArea(
    localAreaName: string | undefined,
    regionName: string | undefined,
    year: number,
    era: HistoricalEra,
    verbose: boolean = true
): CityDetectionResult {
    const result: CityDetectionResult = {
        hasCities: false,
        activeCities: [],
        source: 'none',
        checkedAreas: []
    };

    // Collect area names to check
    const areaNames = [localAreaName, regionName].filter(n => n) as string[];
    result.checkedAreas = areaNames;

    if (verbose) {
        console.log(`[CityDetection] Starting city detection for areas: ${areaNames.join(', ')}, year: ${year}, era: ${era}`);
    }

    if (areaNames.length === 0) {
        if (verbose) {
            console.log('[CityDetection] No area names provided, skipping city detection');
        }
        return result;
    }

    // First check CITIES_DATA (historical cities)
    for (const areaName of areaNames) {
        try {
            const areaCities = CITIES_DATA[areaName] || [];
            
            if (verbose && areaCities.length > 0) {
                // console.log(`[CityDetection] Found ${areaCities.length} total cities in cities.ts for "${areaName}"`);
            }
            
            const activeCities = areaCities.filter((city: any) => 
                year >= city.foundingYear && (!city.declineYear || year <= city.declineYear)
            );
            
            if (activeCities.length > 0) {
                result.hasCities = true;
                result.activeCities = activeCities;
                result.source = 'cities.ts';
                
                // Get city density from the first city
                result.cityDensity = activeCities[0].urbanDensity;
                
                // Check for era-specific density
                if (activeCities[0].eraSpecificDensity) {
                    // Use the actual HistoricalEra enum value
                    const eraKey = era;
                    
                    result.cityDensity = activeCities[0].eraSpecificDensity[eraKey] || result.cityDensity;
                }
                
                if (verbose) {
                    console.log(`[CityDetection] ✓ Found ${activeCities.length} active historical cities in "${areaName}" with density: ${result.cityDensity}`);
                }
                return result; // Found cities, stop searching
            } else if (verbose && areaCities.length > 0) {
                // console.log(`[CityDetection] Found cities in "${areaName}" but none active for year ${year}`);
            }
        } catch (error) {
            console.error(`[CityDetection] Error checking cities.ts for "${areaName}":`, error);
        }
    }

    // If no historical cities found, check PROCEDURAL_CITY_DATA
    for (const areaName of areaNames) {
        try {
            const proceduralCities = PROCEDURAL_CITY_DATA[areaName] || [];
            
            if (verbose && proceduralCities.length > 0) {
                console.log(`[CityDetection] Found ${proceduralCities.length} procedural cities for "${areaName}"`);
            }
            
            if (proceduralCities.length > 0) {
                // Filter by era if eras are specified
                const validCities = proceduralCities.filter((city: any) => {
                    const hasEras = city.eras && city.eras.length > 0;
                    const matchesEra = !hasEras || city.eras.includes(era);
                    
                    if (verbose && hasEras) {
                        console.log(`[CityDetection]   - ${city.name}: eras=${JSON.stringify(city.eras)}, current era=${era}, matches=${matchesEra}`);
                    }
                    
                    return matchesEra;
                });
                
                if (validCities.length > 0) {
                    result.hasCities = true;
                    result.activeCities = validCities;
                    result.source = 'procedural';
                    result.cityDensity = 'small'; // Default for procedural cities
                    
                    if (verbose) {
                        console.log(`[CityDetection] ✓ Found ${validCities.length} active procedural cities in "${areaName}" for era ${era}`);
                        console.log(`[CityDetection]   Cities: ${validCities.map((c: any) => c.name).join(', ')}`);
                    }
                    return result; // Found cities, stop searching
                } else if (verbose) {
                    console.log(`[CityDetection] Found procedural cities in "${areaName}" but none match era ${era}`);
                }
            }
        } catch (error) {
            console.error(`[CityDetection] Error checking proceduralCityData for "${areaName}":`, error);
        }
    }

    if (verbose) {
        console.log(`[CityDetection] ✗ No cities found for areas: ${areaNames.join(', ')}`);
    }
    
    return result;
}