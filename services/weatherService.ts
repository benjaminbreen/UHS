/**
 * services/weatherService.ts - Dynamic weather simulation system
 * Calculates realistic weather conditions based on climate, season, altitude, and time
 */

import { ClimateType, BiomeType, Season, TimeOfDay } from '../types';

export interface WeatherState {
  temperature: number; // Celsius
  feelsLike: number; // Apparent temperature with wind chill/heat index
  humidity: number; // 0-100%
  precipitation: 'none' | 'rain' | 'snow' | 'sleet' | 'drizzle';
  intensity: number; // 0-1 (precipitation intensity)
  windSpeed: number; // km/h
  windDirection: number; // degrees (0=N, 90=E, 180=S, 270=W)
  windGust: number; // km/h max gusts
  cloudCover: number; // 0-1
  visibility: number; // 0-1 (1 = clear, 0 = zero visibility)
  pressure: number; // millibars
  special: 'rainbow' | 'fog' | 'mist' | 'frost' | 'heatwave' | null;
  description: string; // Human-readable weather description
  condition: 'cold' | 'hot' | 'humid' | 'comfortable' | null; // Temperature/humidity status
}

// Base temperature ranges by climate (Celsius)
const CLIMATE_TEMPS: Record<ClimateType, { summer: [number, number], winter: [number, number] }> = {
  [ClimateType.TROPICAL]: { summer: [25, 35], winter: [22, 30] },
  [ClimateType.SEMITROPICAL]: { summer: [22, 32], winter: [12, 22] },
  [ClimateType.MEDITERRANEAN]: { summer: [20, 30], winter: [8, 18] },
  [ClimateType.TEMPERATE]: { summer: [15, 28], winter: [-5, 10] },
  [ClimateType.COLD]: { summer: [5, 20], winter: [-25, -5] },
  [ClimateType.ARID]: { summer: [25, 45], winter: [5, 25] }
};

// Time of day temperature modifiers (Celsius)
const TIME_TEMP_MODIFIERS: Record<TimeOfDay, number> = {
  Dawn: -3,
  Day: 2,
  Midday: 4,
  Dusk: -1,
  Night: -5
};

// Biome microclimate adjustments
const BIOME_MODIFIERS = {
  temperature: {
    [BiomeType.DESERT]: 5,
    [BiomeType.SNOW]: -10,
    [BiomeType.MOUNTAIN]: -8,
    [BiomeType.HIGH_PEAK]: -12,
    [BiomeType.BEACH]: 2,
    [BiomeType.FOREST]: -2,
    [BiomeType.DENSE_FOREST]: -3,
    [BiomeType.JUNGLE]: 3,
    [BiomeType.WETLANDS]: 1,
    [BiomeType.TUNDRA]: -8,
    [BiomeType.URBAN]: 2, // Urban heat island
    [BiomeType.DENSE_CITY]: 3,
    [BiomeType.FRESHWATER_LAKE]: -1
  },
  humidity: {
    [BiomeType.DESERT]: -30,
    [BiomeType.WETLANDS]: 20,
    [BiomeType.BEACH]: 15,
    [BiomeType.RIVER]: 10,
    [BiomeType.MAJOR_RIVER]: 15,
    [BiomeType.FRESHWATER_LAKE]: 20,
    [BiomeType.JUNGLE]: 25,
    [BiomeType.DENSE_FOREST]: 15,
    [BiomeType.MANGROVE]: 25,
    [BiomeType.ESTUARY]: 20
  }
};

export class WeatherService {
  private weatherCache: Map<string, { weather: WeatherState, timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds game time
  private weatherSeed: number = Math.random();
  
  constructor() {
    // Initialize with a random seed for weather patterns
    this.weatherSeed = Date.now();
  }

  /**
   * Calculate current weather for a specific tile
   */
  public getWeather(
    climate: ClimateType,
    biome: BiomeType,
    season: Season,
    timeOfDay: TimeOfDay,
    altitude: number = 0.5, // 0-1, where 1 is highest elevation
    dayOfYear: number = 180, // 1-365
    coordinates?: { x: number, y: number }
  ): WeatherState {
    // Check cache
    const cacheKey = `${climate}-${biome}-${season}-${timeOfDay}-${altitude}-${dayOfYear}`;
    const cached = this.weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.weather;
    }

    // Generate base weather pattern
    const baseWeather = this.generateBaseWeather(climate, season, dayOfYear);
    
    // Apply modifiers
    const weather = this.applyModifiers(baseWeather, {
      climate,
      biome,
      season,
      timeOfDay,
      altitude,
      dayOfYear
    });

    // Cache result
    this.weatherCache.set(cacheKey, { weather, timestamp: Date.now() });
    
    return weather;
  }

  private generateBaseWeather(climate: ClimateType, season: Season, dayOfYear: number): WeatherState {
    // Use pseudo-random based on day for consistent daily weather
    const dailySeed = Math.sin(dayOfYear * 0.1 + this.weatherSeed) * 10000;
    const random = (min: number = 0, max: number = 1) => {
      const x = Math.sin(dailySeed) * 10000;
      return min + (x - Math.floor(x)) * (max - min);
    };

    // Get temperature range for climate and season
    // Default to temperate if climate is undefined or not in CLIMATE_TEMPS
    let climateData = CLIMATE_TEMPS[climate];
    let actualClimate = climate;
    
    if (!climateData) {
      console.warn(`[WeatherService] Unknown climate type: ${climate}, defaulting to TEMPERATE`);
      climateData = CLIMATE_TEMPS[ClimateType.TEMPERATE];
      actualClimate = ClimateType.TEMPERATE;
    }
    
    const isWinter = season === 'winter';
    const isSummer = season === 'summer';
    const tempRange = isWinter ? climateData.winter : 
                     isSummer ? climateData.summer :
                     // Spring/Fall: average of summer and winter
                     [
                       (climateData.winter[0] + climateData.summer[0]) / 2,
                       (climateData.winter[1] + climateData.summer[1]) / 2
                     ];

    const baseTemp = random(tempRange[0], tempRange[1]);
    
    // Pressure system (affects precipitation chance)
    const pressure = random(980, 1040); // millibars
    const isLowPressure = pressure < 1010;
    
    // Climate-adjusted precipitation chances
    let precipitationChance = 0.15; // Base 15% chance of precipitation
    if (actualClimate === ClimateType.TROPICAL) precipitationChance = 0.35; // More rain in tropics
    else if (actualClimate === ClimateType.ARID) precipitationChance = 0.05; // Very rare in desert
    else if (actualClimate === ClimateType.MEDITERRANEAN) precipitationChance = season === 'winter' ? 0.30 : 0.10; // Wet winters, dry summers
    else if (actualClimate === ClimateType.COLD) precipitationChance = 0.25; // More snow/precipitation
    else if (actualClimate === ClimateType.TEMPERATE) precipitationChance = 0.20; // Moderate rain
    
    // Seasonal adjustments
    if (season === 'winter') precipitationChance *= 1.3;
    else if (season === 'summer' && actualClimate !== ClimateType.TROPICAL) precipitationChance *= 0.7;
    
    // Pressure affects precipitation chance
    if (isLowPressure) precipitationChance *= 2.0; // Double chance in low pressure
    else precipitationChance *= 0.5; // Half chance in high pressure
    
    // Determine if precipitation occurs
    const willPrecipitate = random() < precipitationChance;
    
    // Cloud cover logic - more variety
    let cloudCover: number;
    if (willPrecipitate) {
      // Precipitation requires substantial clouds
      cloudCover = random(0.6, 1.0);
    } else if (isLowPressure) {
      // Low pressure often brings clouds but not always
      const cloudRoll = random();
      if (cloudRoll < 0.3) cloudCover = random(0, 0.2); // 30% chance of mostly clear
      else if (cloudRoll < 0.7) cloudCover = random(0.3, 0.6); // 40% chance of partly cloudy
      else cloudCover = random(0.7, 0.9); // 30% chance of mostly cloudy
    } else {
      // High pressure usually means clear skies
      const cloudRoll = random();
      if (cloudRoll < 0.6) cloudCover = random(0, 0.15); // 60% chance of clear/sunny
      else if (cloudRoll < 0.9) cloudCover = random(0.2, 0.4); // 30% chance of partly cloudy
      else cloudCover = random(0.5, 0.7); // 10% chance of cloudy
    }
    
    // Precipitation logic
    let precipitation: WeatherState['precipitation'] = 'none';
    let intensity = 0;
    
    if (willPrecipitate) {
      // Determine precipitation type based on temperature and climate
      if (baseTemp < -2) {
        precipitation = 'snow';
        intensity = random(0.2, 0.8);
      } else if (baseTemp < 2) {
        // Near freezing - could be snow, sleet, or freezing rain
        const precipType = random();
        if (precipType < 0.4) {
          precipitation = 'snow';
          intensity = random(0.1, 0.6);
        } else if (precipType < 0.7) {
          precipitation = 'sleet';
          intensity = random(0.3, 0.7);
        } else {
          precipitation = 'rain'; // Freezing rain
          intensity = random(0.2, 0.5);
        }
      } else {
        // Above freezing - rain or drizzle
        if (cloudCover > 0.8 && isLowPressure) {
          // Heavy clouds and low pressure = heavier rain
          precipitation = 'rain';
          intensity = random(0.4, 0.9);
        } else if (cloudCover > 0.6) {
          // Moderate clouds = regular rain
          precipitation = 'rain';
          intensity = random(0.2, 0.6);
        } else {
          // Light clouds = drizzle
          precipitation = 'drizzle';
          intensity = random(0.1, 0.3);
        }
      }
      
      // Tropical adjustments - more intense rain
      if (actualClimate === ClimateType.TROPICAL && precipitation === 'rain') {
        intensity = Math.min(1.0, intensity * 1.5);
      }
      
      // Desert adjustments - rare but intense when it happens
      if (actualClimate === ClimateType.ARID && precipitation === 'rain') {
        intensity = Math.min(1.0, intensity * 2.0);
      }
    }
    
    // Wind based on pressure gradient
    const windSpeed = isLowPressure ? 
      random(15, 45) : 
      random(5, 20);
    
    // Humidity based on climate and precipitation
    let baseHumidity = 50;
    if (actualClimate === ClimateType.TROPICAL) baseHumidity = 75;
    else if (actualClimate === ClimateType.ARID) baseHumidity = 25;
    else if (actualClimate === ClimateType.MEDITERRANEAN) baseHumidity = 60;
    
    if (precipitation !== 'none') baseHumidity += 20;
    
    const humidity = Math.min(100, Math.max(10, baseHumidity + random(-15, 15)));
    
    // Calculate feels-like temperature
    const feelsLike = this.calculateFeelsLike(baseTemp, humidity, windSpeed);
    
    // Visibility
    let visibility = 1.0;
    if (precipitation === 'snow' || precipitation === 'sleet') visibility *= (1 - intensity * 0.5);
    if (precipitation === 'rain') visibility *= (1 - intensity * 0.3);
    
    return {
      temperature: baseTemp,
      feelsLike,
      humidity,
      precipitation,
      intensity,
      windSpeed,
      windDirection: random(0, 360),
      windGust: windSpeed * random(1.2, 1.8),
      cloudCover,
      visibility,
      pressure,
      special: null,
      description: '',
      condition: null // Will be set after modifiers
    };
  }

  private applyModifiers(
    weather: WeatherState,
    params: {
      climate: ClimateType,
      biome: BiomeType,
      season: Season,
      timeOfDay: TimeOfDay,
      altitude: number,
      dayOfYear: number
    }
  ): WeatherState {
    const modified = { ...weather };
    
    // Time of day temperature adjustment
    modified.temperature += TIME_TEMP_MODIFIERS[params.timeOfDay] || 0;
    
    // Biome microclimate
    if (BIOME_MODIFIERS.temperature[params.biome]) {
      modified.temperature += BIOME_MODIFIERS.temperature[params.biome];
    }
    if (BIOME_MODIFIERS.humidity[params.biome]) {
      modified.humidity = Math.min(100, Math.max(0, 
        modified.humidity + BIOME_MODIFIERS.humidity[params.biome]
      ));
    }
    
    // Altitude adjustment (-6.5°C per 1000m, assuming 0-1 altitude = 0-3000m)
    const altitudeMeters = params.altitude * 3000;
    modified.temperature -= (altitudeMeters / 1000) * 6.5;
    
    // Higher altitude = stronger winds
    modified.windSpeed *= (1 + params.altitude * 0.5);
    modified.windGust *= (1 + params.altitude * 0.5);
    
    // Recalculate precipitation type if temperature changed
    if (modified.precipitation !== 'none') {
      if (modified.temperature < 0 && modified.precipitation === 'rain') {
        modified.precipitation = 'snow';
      } else if (modified.temperature > 3 && modified.precipitation === 'snow') {
        modified.precipitation = 'rain';
      }
    }
    
    // Special conditions
    modified.special = this.determineSpecialConditions(modified, params);
    
    // Update feels-like with new values
    modified.feelsLike = this.calculateFeelsLike(
      modified.temperature, 
      modified.humidity, 
      modified.windSpeed
    );
    
    // Determine weather condition (hot/cold/humid/comfortable)
    modified.condition = this.determineWeatherCondition(modified);
    
    // Generate description
    modified.description = this.generateDescription(modified);
    
    return modified;
  }

  private calculateFeelsLike(temp: number, humidity: number, windSpeed: number): number {
    // Wind chill for cold temps
    if (temp < 10 && windSpeed > 5) {
      const windKmh = windSpeed;
      return 13.12 + 0.6215 * temp - 11.37 * Math.pow(windKmh, 0.16) + 
             0.3965 * temp * Math.pow(windKmh, 0.16);
    }
    
    // Heat index for hot temps
    if (temp > 27 && humidity > 40) {
      const c1 = -8.78469475556;
      const c2 = 1.61139411;
      const c3 = 2.33854883889;
      const c4 = -0.14611605;
      const c5 = -0.012308094;
      const c6 = -0.0164248277778;
      const c7 = 0.002211732;
      const c8 = 0.00072546;
      const c9 = -0.000003582;
      
      return c1 + c2*temp + c3*humidity + c4*temp*humidity + c5*temp*temp + 
             c6*humidity*humidity + c7*temp*temp*humidity + c8*temp*humidity*humidity + 
             c9*temp*temp*humidity*humidity;
    }
    
    return temp;
  }

  private determineSpecialConditions(
    weather: WeatherState,
    params: { timeOfDay: TimeOfDay, season: Season }
  ): WeatherState['special'] {
    // Rainbow: rain ending + sun at dawn/dusk
    if (weather.precipitation === 'drizzle' && 
        weather.intensity < 0.3 && 
        weather.cloudCover < 0.7 &&
        (params.timeOfDay === 'Dawn' || params.timeOfDay === 'Dusk')) {
      return 'rainbow';
    }
    
    // Fog: high humidity + cool temps + calm winds
    if (weather.humidity > 85 && 
        weather.temperature < 15 && 
        weather.windSpeed < 10 &&
        (params.timeOfDay === 'Dawn' || params.timeOfDay === 'Night')) {
      weather.visibility = Math.min(weather.visibility, 0.3);
      return 'fog';
    }
    
    // Mist: lighter fog conditions
    if (weather.humidity > 75 && 
        weather.temperature < 20 && 
        weather.windSpeed < 15) {
      weather.visibility = Math.min(weather.visibility, 0.6);
      return 'mist';
    }
    
    // Frost: cold + clear + calm
    if (weather.temperature < 3 && 
        weather.cloudCover < 0.3 && 
        weather.windSpeed < 10 &&
        params.season === 'winter') {
      return 'frost';
    }
    
    // Heatwave: very hot temps
    if (weather.temperature > 35) {
      return 'heatwave';
    }
    
    return null;
  }

  private determineWeatherCondition(weather: WeatherState): WeatherState['condition'] {
    // Convert temperature to Fahrenheit for thresholds
    const tempF = weather.temperature * 9/5 + 32;
    
    // Cold: Below 20°F (-6.7°C)
    if (tempF < 20) {
      return 'cold';
    }
    
    // Hot: Above 75°F (23.9°C) 
    if (tempF > 75) {
      return 'hot';
    }
    
    // Humid: Humidity above 70%
    if (weather.humidity > 70) {
      return 'humid';
    }
    
    // Otherwise comfortable
    return 'comfortable';
  }

  private generateDescription(weather: WeatherState): string {
    const parts: string[] = [];
    
    // Add condition status first if it's notable
    if (weather.condition === 'cold') {
      parts.push('Cold');
    } else if (weather.condition === 'hot') {
      parts.push('Hot');
    } else if (weather.condition === 'humid') {
      parts.push('Humid');
    }
    
    // Sky conditions
    if (weather.cloudCover < 0.2) parts.push('Clear');
    else if (weather.cloudCover < 0.5) parts.push('Partly cloudy');
    else if (weather.cloudCover < 0.8) parts.push('Mostly cloudy');
    else parts.push('Overcast');
    
    // Precipitation
    if (weather.precipitation !== 'none') {
      const intensityWord = weather.intensity < 0.3 ? 'Light' :
                           weather.intensity < 0.7 ? 'Moderate' : 'Heavy';
      parts.push(`${intensityWord} ${weather.precipitation}`);
    }
    
    // Special conditions
    if (weather.special === 'fog') parts.push('Foggy');
    else if (weather.special === 'mist') parts.push('Misty');
    else if (weather.special === 'rainbow') parts.push('Rainbow visible');
    else if (weather.special === 'frost') parts.push('Frosty');
    else if (weather.special === 'heatwave') parts.push('Heatwave');
    
    // Wind
    if (weather.windSpeed > 30) parts.push('Windy');
    else if (weather.windSpeed > 50) parts.push('Very windy');
    
    return parts.join(', ') || 'Fair';
  }

  /**
   * Format weather for display in UI
   */
  public formatWeatherDisplay(weather: WeatherState): string {
    const temp = Math.round(weather.temperature);
    const wind = Math.round(weather.windSpeed);
    
    // Get wind direction as compass point
    const windDir = this.getCompassDirection(weather.windDirection);
    
    // Build display string
    const parts: string[] = [`${temp}°C`];
    
    if (weather.precipitation !== 'none') {
      const intensity = weather.intensity < 0.3 ? 'Light' :
                       weather.intensity < 0.7 ? '' : 'Heavy';
      parts.push(`${intensity} ${weather.precipitation}`.trim());
    } else if (weather.special === 'fog' || weather.special === 'mist') {
      parts.push(weather.special.charAt(0).toUpperCase() + weather.special.slice(1));
    } else if (weather.cloudCover < 0.2) {
      parts.push('Clear');
    } else if (weather.cloudCover > 0.8) {
      parts.push('Overcast');
    }
    
    if (wind > 10) {
      parts.push(`${windDir} wind ${wind} km/h`);
    }
    
    return parts.join(' • ');
  }

  private getCompassDirection(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((degrees % 360) / 45)) % 8;
    return directions[index];
  }
}

// Singleton instance
export const weatherService = new WeatherService();