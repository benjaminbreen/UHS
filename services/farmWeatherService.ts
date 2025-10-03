/**
 * services/farmWeatherService.ts
 * Phase 4.2: Weather events for realistic farm simulation
 */

import { Season } from '../types';

export type WeatherEvent = 'none' | 'drought' | 'heavy_rain' | 'early_frost' | 'heatwave' | 'hailstorm';

export interface WeatherCondition {
  event: WeatherEvent;
  severity: number; // 1-10
  description: string;
  fieldEffects: string; // Describe effects on fields
  duration: number; // Days
}

/**
 * Generate random weather event based on season and day
 */
export function generateWeatherEvent(
  season: Season,
  month: number,
  gameDay: number,
  climate: string
): WeatherCondition | null {
  // Weather events are rare (5% chance per day)
  const random = (gameDay * 13 + month * 7) % 100; // Deterministic random
  if (random > 5) return null;

  const eventType = random % 5;

  // Drought (more common in summer)
  if (eventType === 0 && (season === 'Summer' || season === 'Spring')) {
    return {
      event: 'drought',
      severity: 3 + (random % 5),
      description: 'No rain for days. The sun beats down mercilessly, cracking the dry earth.',
      fieldEffects: 'All field moisture drops by 2 levels. Crops lose 10% health per day without watering.',
      duration: 5 + (random % 10),
    };
  }

  // Heavy Rain (more common in spring/fall)
  if (eventType === 1 && (season === 'Spring' || season === 'Fall')) {
    return {
      event: 'heavy_rain',
      severity: 4 + (random % 4),
      description: 'Dark clouds unleash torrential rain. Water pools in low-lying fields.',
      fieldEffects: 'All fields become flooded. Rice thrives, but wheat/barley drown.',
      duration: 2 + (random % 3),
    };
  }

  // Early Frost (only in fall/early winter)
  if (eventType === 2 && (season === 'Fall' || month <= 2)) {
    return {
      event: 'early_frost',
      severity: 6 + (random % 4),
      description: 'Frost comes early, coating the fields in icy crystals overnight.',
      fieldEffects: 'Tender crops (vegetables, late-season grains) take 30-50% health damage. Root crops protected underground.',
      duration: 1,
    };
  }

  // Heatwave (summer only)
  if (eventType === 3 && season === 'Summer') {
    return {
      event: 'heatwave',
      severity: 5 + (random % 5),
      description: 'The temperature soars to dangerous levels. Even the shade offers no relief.',
      fieldEffects: 'Crops need 2x watering. Workers suffer heat exhaustion (fatigue +50%). Moisture depletes 2x faster.',
      duration: 3 + (random % 5),
    };
  }

  // Hailstorm (rare, devastating)
  if (eventType === 4) {
    return {
      event: 'hailstorm',
      severity: 8 + (random % 2),
      description: 'Ice the size of walnuts falls from the sky, battering the crops.',
      fieldEffects: 'All crops lose 40-60% health. Grain stalks broken, leaves shredded. Immediate harvest needed or crops ruined.',
      duration: 1,
    };
  }

  return null;
}

/**
 * Get weather description for LLM context
 */
export function getWeatherContext(
  weather: WeatherCondition | null,
  season: Season
): string {
  if (!weather) {
    // Normal weather
    const seasonalWeather: Record<Season, string> = {
      Spring: 'Mild spring weather with occasional showers',
      Summer: 'Warm summer days with clear skies',
      Fall: 'Cool autumn weather, harvest season',
      Winter: 'Cold winter, fields mostly dormant',
    };
    return seasonalWeather[season];
  }

  return `⚠️ WEATHER EVENT (Day ${weather.duration} remaining): ${weather.description}\n${weather.fieldEffects}`;
}
