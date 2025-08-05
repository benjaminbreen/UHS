/**
 * services/cityNameGenerator.ts - Procedural city name generation system
 */
import { CityInfo, CulturalZone, HistoricalEra } from '../types';
import { CITIES_DATA, PROCEDURAL_CITY_DATA } from '../constants/index';
import { parseDateString } from '../utils/dateUtils';


export const generateCityInfo = (
  mapAreaName: string,
  currentYearStr: string,
  dominantPower: string,
  seed: number,
  culturalZone: CulturalZone
): CityInfo | null => {
  const currentYear = parseInt(currentYearStr, 10);
  if(isNaN(currentYear)) return null;
  
  // 1. Try to find a historical city first
  const historicalCityCandidates = CITIES_DATA[mapAreaName];
  if (historicalCityCandidates) {
    const validCities = historicalCityCandidates.filter(city => 
      currentYear >= city.foundingYear && (!city.declineYear || currentYear <= city.declineYear)
    );

    if (validCities.length > 0) {
      const cityData = validCities[0]; // Pick the first valid historical city
      let allegiance = dominantPower;
      const sortedYears = Object.keys(cityData.allegianceHistory).map(Number).sort((a,b) => b-a);
      for(const year of sortedYears) {
          if(currentYear >= year) {
              allegiance = cityData.allegianceHistory[year];
              break;
          }
      }
      const languages: string[] = ['Local Dialect'];
      if (culturalZone === 'EUROPEAN' && currentYear < 1700) { languages.push('Latin'); } 
      else if (culturalZone === 'EAST_ASIAN') { languages.push('Classical Chinese'); }
      else if (culturalZone === 'MENA' || culturalZone === 'SOUTH_ASIAN') { languages.push('Arabic or Persian'); }
      const history = `Founded around the year ${cityData.foundingYear}, ${cityData.name} has a long and storied past, evolving from a local settlement to a key center in the region under various powers.`;

      return {
        name: cityData.name,
        population: 15000, // placeholder
        allegiance: allegiance,
        description: cityData.description,
        isHistorical: cityData.isHistorical,
        languages: languages,
        founded: `circa ${cityData.foundingYear}`,
        history: history
      };
    }
  }

  // 2. Fallback to procedural data if no historical city is found
  const { era } = parseDateString(currentYearStr);
  const proceduralCandidates = PROCEDURAL_CITY_DATA[mapAreaName];
  if (proceduralCandidates) {
      const validProceduralCities = proceduralCandidates.filter(entry => entry.eras.includes(era as HistoricalEra));
      
      if (validProceduralCities.length > 0) {
          const cityData = validProceduralCities[0]; // Pick the first valid procedural entry
          const languages: string[] = ['Local Dialect'];
          if (culturalZone === 'EUROPEAN' && currentYear < 1700) { languages.push('Latin'); }

          const history = `An ancient settlement in the ${mapAreaName}, it has served as a local hub for generations under the influence of various powers, including the ${dominantPower}.`;

          return {
              name: cityData.name,
              population: 2500 + Math.floor(Math.random() * 10000), // Smaller population for procedural cities
              allegiance: dominantPower,
              description: cityData.description,
              isHistorical: false, // Mark as procedurally generated
              languages,
              founded: 'ancient times',
              history
          };
      }
  }

  // 3. If no data found at all, return null
  return null;
};
