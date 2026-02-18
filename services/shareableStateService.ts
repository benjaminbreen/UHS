/**
 * Shareable State Service
 * Handles encoding/decoding of complete game state for URL sharing
 * Ensures reproducible game scenarios from shared URLs
 */

import { HistoricalEra } from '../types';
import { CharacterSpecification } from './worldWeaverService';
import { GameMode } from '../types/eventTypes';
import { findZoneForMapArea, getDefaultZone } from './zoneDetectionService';

/**
 * Complete shareable game state
 * Contains all data needed to reproduce a game scenario
 */
export interface ShareableGameState {
  // Core game settings
  year: number;
  month: number;
  day: number;
  mapArea: string;
  zone: string;
  region?: string;
  gameMode: string;

  // Character data
  character: {
    name: string;
    profession: string;
    gender: 'male' | 'female';
    age: number;
    socialClass?: string;
    health?: string;
    disease?: string;
    birthplace?: string;
    family?: CharacterSpecification['family'];
    clothing?: CharacterSpecification['clothing'];
    classLabel?: string;
    ethnicity?: CharacterSpecification['ethnicity'];
    identitySource?: CharacterSpecification['identitySource'];
    characterDescription?: string;
    customItems?: CharacterSpecification['customItems'];
  };

  // Map generation
  mapSeed: string;
  mapArchetype?: string;
  climate?: string;

  // Scenario metadata
  scenarioType: 'procedural' | 'worldweaver' | 'custom';
  scenarioPrompt?: string; // For WorldWeaver scenarios

  // Educational settings (Phase 1)
  educationalMode?: boolean;

  // Learning objectives (Phase 2)
  learningObjectives?: string[];
  assessmentFrequency?: string;
  difficulty?: string;
  sessionLength?: string;

  // Version for compatibility
  version: string;
}

/**
 * Compressed URL-safe representation
 */
export interface EncodedGameState {
  v: number; // version
  y: number; // year
  m: number; // month
  d: number; // day
  ma: string; // mapArea (abbreviated)
  gm: string; // gameMode (abbreviated)
  cn: string; // character name
  cp: string; // character profession
  cg: string; // character gender (m/f)
  ca: number; // character age
  cs?: string; // character social class
  ch?: string; // character health
  cd?: string; // character disease
  cb?: string; // character birthplace
  cf?: CharacterSpecification['family']; // character family
  cl?: CharacterSpecification['clothing']; // character clothing
  cc?: string; // character class label
  ce?: CharacterSpecification['ethnicity']; // character ethnicity
  ci?: CharacterSpecification['identitySource']; // identity source
  cdsc?: string; // character description
  ciu?: CharacterSpecification['customItems']; // character items
  ms: string; // map seed
  st?: string; // scenario type (p/w/c)
  sp?: string; // scenario prompt (truncated)
  em?: boolean; // educational mode
  lo?: string; // learning objectives (abbreviated)
  af?: string; // assessment frequency (n/o/f)
  dl?: string; // difficulty level (f/r/h)
  sl?: string; // session length (s/e/u)
}

class ShareableStateService {
  private static instance: ShareableStateService;
  private readonly VERSION = '1.0';

  private encodeUtf8Base64(value: string): string {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  private decodeUtf8Base64(value: string): string {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  
  // Abbreviation maps for common values
  private readonly gameModeAbbr: Record<string, string> = {
    'survival': 'surv',
    'exploration': 'expl',
    'commerce': 'comm',
    'scholarship': 'scho',
    'leadership': 'lead',
    'livelihood': 'live',
    'diplomacy': 'dipl',
    'legal': 'lega'
  };
  
  private readonly reverseGameModeAbbr: Record<string, string> = {};
  
  constructor() {
    // Build reverse lookup
    Object.entries(this.gameModeAbbr).forEach(([full, abbr]) => {
      this.reverseGameModeAbbr[abbr] = full;
    });
  }
  
  public static getInstance(): ShareableStateService {
    if (!ShareableStateService.instance) {
      ShareableStateService.instance = new ShareableStateService();
    }
    return ShareableStateService.instance;
  }
  
  /**
   * Encode full game state to shareable format
   */
  public encodeGameState(state: ShareableGameState): string {
    try {
      const encoded: EncodedGameState = {
        v: 1,
        y: state.year,
        m: state.month,
        d: state.day,
        ma: this.abbreviateMapArea(state.mapArea),
        gm: this.gameModeAbbr[state.gameMode] || state.gameMode.substring(0, 4),
        cn: state.character.name, // Don't truncate - handle in decoding if needed
        cp: state.character.profession, // Don't truncate - handle in decoding if needed
        cg: state.character.gender === 'male' ? 'm' : 'f',
        ca: state.character.age,
        ms: state.mapSeed.substring(0, 8),
        st: state.scenarioType === 'worldweaver' ? 'w' : state.scenarioType === 'custom' ? 'c' : 'p'
      };

      if (state.character.socialClass) encoded.cs = state.character.socialClass;
      if (state.character.health) encoded.ch = state.character.health;
      if (state.character.disease) encoded.cd = state.character.disease;
      if (state.character.birthplace) encoded.cb = state.character.birthplace;
      if (state.character.family) encoded.cf = state.character.family;
      if (state.character.clothing) encoded.cl = state.character.clothing;
      if (state.character.classLabel) encoded.cc = state.character.classLabel;
      if (state.character.ethnicity) encoded.ce = state.character.ethnicity;
      if (state.character.identitySource) encoded.ci = state.character.identitySource;
      if (state.character.characterDescription) encoded.cdsc = state.character.characterDescription;
      if (state.character.customItems) encoded.ciu = state.character.customItems;

      if (state.scenarioPrompt) {
        encoded.sp = state.scenarioPrompt.substring(0, 50);
      }

      if (state.educationalMode) {
        encoded.em = state.educationalMode;
      }

      // Phase 2: Add learning objectives and assessment settings
      if (state.learningObjectives && state.learningObjectives.length > 0) {
        // Abbreviate learning objectives
        encoded.lo = state.learningObjectives.map(obj => {
          switch(obj) {
            case 'historical-thinking': return 'ht';
            case 'cultural-comparison': return 'cc';
            case 'economic-systems': return 'es';
            case 'social-structures': return 'ss';
            case 'primary-sources': return 'ps';
            case 'geographic-impact': return 'gi';
            default: return obj.substring(0, 2);
          }
        }).join(',');
      }

      if (state.assessmentFrequency) {
        encoded.af = state.assessmentFrequency === 'none' ? 'n' :
                     state.assessmentFrequency === 'occasional' ? 'o' : 'f';
      }

      if (state.difficulty) {
        encoded.dl = state.difficulty === 'forgiving' ? 'f' :
                     state.difficulty === 'realistic' ? 'r' : 'h';
      }

      if (state.sessionLength) {
        encoded.sl = state.sessionLength === 'short' ? 's' :
                     state.sessionLength === 'extended' ? 'e' : 'u';
      }
      
      // Convert to JSON and base64
      const json = JSON.stringify(encoded);
      // Make URL-safe base64
      const base64 = this.encodeUtf8Base64(json)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      return base64;
    } catch (error) {
      console.error('[ShareableState] Encoding error:', error);
      // Return a fallback simple seed
      return state.mapSeed.substring(0, 8);
    }
  }
  
  /**
   * Decode shareable format to full game state
   */
  public decodeGameState(encoded: string): ShareableGameState | null {
    try {
      // Handle old-style 8-character seeds
      if (encoded.length <= 8 && /^[A-Z0-9]+$/i.test(encoded)) {
        console.log('[ShareableState] Old-style seed detected, using as map seed only');
        return null;
      }
      
      // Restore URL-safe base64
      let base64 = encoded
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      // Add padding if needed
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      
      const json = this.decodeUtf8Base64(base64);
      const decoded: EncodedGameState = JSON.parse(json);
      
      // Validate version
      if (decoded.v !== 1) {
        console.warn('[ShareableState] Unknown version:', decoded.v);
      }
      
      const state: ShareableGameState = {
        year: decoded.y,
        month: decoded.m || 1,
        day: decoded.d || 1,
        mapArea: this.expandMapArea(decoded.ma),
        zone: '', // Will be determined from mapArea
        gameMode: this.reverseGameModeAbbr[decoded.gm] || decoded.gm,
        character: {
          name: decoded.cn,
          profession: decoded.cp,
          gender: decoded.cg === 'm' ? 'male' : 'female',
          age: decoded.ca,
          socialClass: decoded.cs,
          health: decoded.ch,
          disease: decoded.cd,
          birthplace: decoded.cb,
          family: decoded.cf,
          clothing: decoded.cl,
          classLabel: decoded.cc,
          ethnicity: decoded.ce,
          identitySource: decoded.ci,
          characterDescription: decoded.cdsc,
          customItems: decoded.ciu
        },
        mapSeed: decoded.ms,
        scenarioType: decoded.st === 'w' ? 'worldweaver' : decoded.st === 'c' ? 'custom' : 'procedural',
        scenarioPrompt: decoded.sp,
        educationalMode: decoded.em || false,
        version: this.VERSION
      };

      // Phase 2: Decode learning objectives and assessment settings
      if (decoded.lo) {
        state.learningObjectives = decoded.lo.split(',').map(abbr => {
          switch(abbr) {
            case 'ht': return 'historical-thinking';
            case 'cc': return 'cultural-comparison';
            case 'es': return 'economic-systems';
            case 'ss': return 'social-structures';
            case 'ps': return 'primary-sources';
            case 'gi': return 'geographic-impact';
            default: return abbr;
          }
        });
      }

      if (decoded.af) {
        state.assessmentFrequency = decoded.af === 'n' ? 'none' :
                                    decoded.af === 'o' ? 'occasional' : 'frequent';
      }

      if (decoded.dl) {
        state.difficulty = decoded.dl === 'f' ? 'forgiving' :
                          decoded.dl === 'r' ? 'realistic' : 'hardcore';
      }

      if (decoded.sl) {
        state.sessionLength = decoded.sl === 's' ? 'short' :
                             decoded.sl === 'e' ? 'extended' : 'unlimited';
      }
      
      return state;
    } catch (error) {
      console.error('[ShareableState] Decoding error:', error);
      return null;
    }
  }
  
  /**
   * Generate a shareable URL from current game state
   */
  public generateShareableURL(state: ShareableGameState): string {
    const encoded = this.encodeGameState(state);
    
    // Create human-readable URL path
    const year = state.year;
    const location = this.slugify(state.mapArea);
    const mode = state.gameMode;
    
    // Use query parameters for the encoded state
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${year}/${location}/${mode}?state=${encoded}`;
    
    console.log('[ShareableState] Generated URL with state:', {
      mapArea: state.mapArea,
      character: state.character.name,
      gameMode: state.gameMode,
      encoded: encoded.substring(0, 50) + '...'
    });
    
    return url;
  }
  
  /**
   * Parse URL to extract game state
   */
  public parseShareableURL(url: string): ShareableGameState | null {
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Check for state query parameter (new format)
      const stateParam = urlObj.searchParams.get('state');
      if (stateParam) {
        return this.decodeGameState(stateParam);
      }
      
      // Fall back to parsing path segments (old format)
      const pathSegments = urlObj.pathname.split('/').filter(s => s);
      if (pathSegments.length >= 4) {
        const [yearStr, location, mode, seed] = pathSegments;
        
        // Try to decode if seed looks like encoded state
        if (seed && seed.length > 8) {
          return this.decodeGameState(seed);
        }
        
        // Otherwise return basic state from URL segments
        return {
          year: parseInt(yearStr) || 1500,
          month: 1,
          day: 1,
          mapArea: this.unslugify(location),
          zone: '',
          gameMode: mode,
          character: {
            name: 'Wanderer',
            profession: 'traveler',
            gender: 'male',
            age: 25
          },
          mapSeed: seed || 'ABCD1234',
          scenarioType: 'procedural',
          version: this.VERSION
        };
      }
      
      return null;
    } catch (error) {
      console.error('[ShareableState] URL parsing error:', error);
      return null;
    }
  }
  
  /**
   * Abbreviate map area names for compact encoding
   */
  private abbreviateMapArea(mapArea: string): string {
    // Common abbreviations
    const abbreviations: Record<string, string> = {
      'North China Plain': 'NCP',
      'Lower Nile Valley': 'LNV',
      'Upper Nile Valley': 'UNV',
      'Thames Estuary': 'TE',
      'Hudson Valley': 'HV',
      'Paris Basin': 'PB',
      'Roman Campagna': 'RC',
      'Tokyo Bay': 'TB',
      'Pearl River Delta': 'PRD',
      'Ganges Valley': 'GV',
      'Rhine Valley': 'RV',
      'Danube Bend': 'DB',
      'Ancestral Puebloan Lands': 'APL',
      'Thar Desert Margin': 'TDM',
      'Indus Valley': 'IV',
      'Yellow River': 'YR',
      'Yangtze River': 'YZR',
      'Great Lakes': 'GL',
      'Mississippi Delta': 'MD',
      'Amazon Basin': 'AB',
      // Historical figures map areas
      'Tigris–Euphrates Confluence': 'TEC',
      'Cappadocian Highlands': 'CH',
      'Nile Delta': 'ND',
      'Thebes Valley': 'TV',
      'Athens Basin': 'ATB',
      'Delos Archipelago': 'DA',
      'Yellow River Valley': 'YRV',
      'Patna Lowlands': 'PL',
      'Tunisian Sahel': 'TS',
      'Babylon Region': 'BR'
    };
    
    // If no abbreviation exists, use the full name (don't truncate)
    return abbreviations[mapArea] || mapArea;
  }
  
  /**
   * Expand abbreviated map area names
   */
  private expandMapArea(abbr: string): string {
    const expansions: Record<string, string> = {
      'NCP': 'North China Plain',
      'LNV': 'Lower Nile Valley',
      'UNV': 'Upper Nile Valley',
      'TE': 'Thames Estuary',
      'HV': 'Hudson Valley',
      'PB': 'Paris Basin',
      'RC': 'Roman Campagna',
      'TB': 'Tokyo Bay',
      'PRD': 'Pearl River Delta',
      'GV': 'Ganges Valley',
      'RV': 'Rhine Valley',
      'DB': 'Danube Bend',
      'APL': 'Ancestral Puebloan Lands',
      'TDM': 'Thar Desert Margin',
      'IV': 'Indus Valley',
      'YR': 'Yellow River',
      'YZR': 'Yangtze River',
      'GL': 'Great Lakes',
      'MD': 'Mississippi Delta',
      'AB': 'Amazon Basin',
      // Historical figures map areas
      'TEC': 'Tigris–Euphrates Confluence',
      'CH': 'Cappadocian Highlands',
      'ND': 'Nile Delta',
      'TV': 'Thebes Valley',
      'ATB': 'Athens Basin',
      'DA': 'Delos Archipelago',
      'YRV': 'Yellow River Valley',
      'PL': 'Patna Lowlands',
      'TS': 'Tunisian Sahel',
      'BR': 'Babylon Region'
    };
    
    // If it's not an abbreviation, assume it's the full name
    return expansions[abbr] || abbr;
  }
  
  /**
   * Convert string to URL-safe slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  /**
   * Convert slug back to readable text
   */
  private unslugify(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  /**
   * Store state in localStorage for recovery
   */
  public saveStateToLocal(state: ShareableGameState): void {
    try {
      localStorage.setItem('lastGameState', JSON.stringify(state));
      localStorage.setItem('lastGameStateTime', Date.now().toString());
    } catch (error) {
      console.error('[ShareableState] Failed to save to localStorage:', error);
    }
  }

  /**
   * PHASE 3: Unified game mode restoration
   * Single source of truth for game mode restoration from URLs
   */
  public setGameModeForRestoration(mode: string): void {
    try {
      localStorage.setItem('__restoration_gameMode', mode);
      console.log('[Restoration] Game mode queued for restoration:', mode);
    } catch (error) {
      console.error('[Restoration] Failed to queue game mode:', error);
    }
  }

  public getGameModeForRestoration(): string | null {
    try {
      const mode = localStorage.getItem('__restoration_gameMode');
      if (mode) {
        localStorage.removeItem('__restoration_gameMode'); // One-time use, auto-clean
        console.log('[Restoration] Game mode retrieved and cleared:', mode);
        return mode;
      }
      return null;
    } catch (error) {
      console.error('[Restoration] Failed to retrieve game mode:', error);
      return null;
    }
  }

  public clearGameModeRestoration(): void {
    try {
      localStorage.removeItem('__restoration_gameMode');
      console.log('[Restoration] Game mode restoration cleared');
    } catch (error) {
      console.error('[Restoration] Failed to clear game mode:', error);
    }
  }
  
  /**
   * Retrieve state from localStorage
   */
  public loadStateFromLocal(): ShareableGameState | null {
    try {
      const stateStr = localStorage.getItem('lastGameState');
      if (!stateStr) return null;
      
      const state = JSON.parse(stateStr);
      const saveTime = parseInt(localStorage.getItem('lastGameStateTime') || '0');
      
      // Check if save is recent (within 24 hours)
      const dayInMs = 24 * 60 * 60 * 1000;
      if (Date.now() - saveTime > dayInMs) {
        console.log('[ShareableState] Saved state is too old, ignoring');
        return null;
      }
      
      return state;
    } catch (error) {
      console.error('[ShareableState] Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Validate and repair incomplete or invalid game state
   * Ensures all required fields are present and valid
   */
  public validateAndRepairState(state: Partial<ShareableGameState>): ShareableGameState {
    console.log('[ShareableState] Validating and repairing state:', state);
    
    // Validate and repair zone
    let zone = state.zone || '';
    let region = state.region || '';
    
    if (!zone || zone === '' || zone === '...') {
      console.log('[ShareableState] Zone is invalid, attempting detection from map area:', state.mapArea);
      
      if (state.mapArea) {
        const detected = findZoneForMapArea(state.mapArea);
        if (detected) {
          zone = detected.zone;
          region = detected.region;
          console.log('[ShareableState] Detected zone:', zone, 'region:', region);
        } else {
          console.warn('[ShareableState] Could not detect zone from map area, using default');
          zone = getDefaultZone();
        }
      } else {
        zone = getDefaultZone();
      }
    }
    
    // Validate and repair seed
    let mapSeed = state.mapSeed || '';
    if (!mapSeed || mapSeed.length < 8) {
      // Generate a new 8-character seed
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      mapSeed = '';
      for (let i = 0; i < 8; i++) {
        mapSeed += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      console.log('[ShareableState] Generated new seed:', mapSeed);
    }
    
    // Validate and repair game mode
    let gameMode = state.gameMode || '';
    const validGameModes = ['survival', 'exploration', 'commerce', 'scholarship', 'leadership', 'livelihood', 'diplomacy', 'legal'];
    
    if (!gameMode || !validGameModes.includes(gameMode)) {
      // Try to get from localStorage as fallback
      const storedMode = localStorage.getItem('selectedGameMode') || 
                        localStorage.getItem('gameMode') ||
                        localStorage.getItem('currentGameMode');
      
      if (storedMode && validGameModes.includes(storedMode)) {
        gameMode = storedMode;
        console.log('[ShareableState] Retrieved game mode from localStorage:', gameMode);
      } else {
        gameMode = 'survival'; // Default fallback
        console.log('[ShareableState] Using default game mode:', gameMode);
      }
    }
    
    // Validate and repair character data
    const character = state.character || {};
    const repairedCharacter = {
      name: character.name || 'Wanderer',
      profession: character.profession || 'traveler',
      gender: (character.gender === 'male' || character.gender === 'female') ? character.gender : 'male',
      age: character.age || 25,
      socialClass: character.socialClass,
      health: character.health,
      disease: character.disease,
      birthplace: character.birthplace,
      family: character.family,
      clothing: character.clothing,
      classLabel: character.classLabel,
      ethnicity: character.ethnicity,
      identitySource: character.identitySource,
      characterDescription: character.characterDescription,
      customItems: character.customItems
    };
    
    // Validate date
    const year = state.year || 1500;
    const month = state.month || 1;
    const day = state.day || 1;
    
    // Validate map area
    const mapArea = state.mapArea || 'Unknown Region';
    
    // Build repaired state
    const repairedState: ShareableGameState = {
      year,
      month,
      day,
      mapArea,
      zone,
      region,
      gameMode,
      character: repairedCharacter,
      mapSeed,
      mapArchetype: state.mapArchetype,
      climate: state.climate,
      scenarioType: state.scenarioType || 'procedural',
      scenarioPrompt: state.scenarioPrompt,
      version: this.VERSION
    };
    
    console.log('[ShareableState] Repaired state:', repairedState);
    return repairedState;
  }
}

// Export singleton instance
export const shareableStateService = ShareableStateService.getInstance();
