/**
 * Utilities for mapping geographic locations to cultural styles and building types
 */

import { HistoricalEra } from '../types';

export interface CulturalMapping {
  primaryCulture: string;
  secondaryCulture?: string;
  mixRatio?: number; // 0-1, how much secondary culture to mix in

}

/**
 * Maps a specific location and year to the appropriate cultural style(s)
 */
export function getLocationCulturalStyle(location: string, year: number): CulturalMapping {
  const lowerLoc = location.toLowerCase();
  
  // First check for cultural zone fallbacks - these are broader matches
  // This ensures we fail gracefully with appropriate regional defaults
  
  // Check for Europe first (most specific regions)
  if (lowerLoc.includes('europe') || lowerLoc.includes('european')) {
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // Check for MENA (Middle East & North Africa)
  if (lowerLoc.includes('mena') || lowerLoc.includes('middle east') || lowerLoc.includes('north africa')) {
    return { primaryCulture: 'MENA' };
  }
  
  // Check for general African regions
  if (lowerLoc.includes('sub saharan') || lowerLoc.includes('sub-saharan')) {
    return { primaryCulture: 'SUB_SAHARAN_AFRICAN' };
  }
  
  // Check for South Asia
  if (lowerLoc.includes('south asia')) {
    return { primaryCulture: 'SOUTH_ASIAN' };
  }
  
  // Check for East Asia
  if (lowerLoc.includes('east asia')) {
    return { primaryCulture: 'EAST_ASIAN' };
  }
  
  // Check for Oceania
  if (lowerLoc.includes('oceania')) {
    return { primaryCulture: 'OCEANIA' };
  }
  
  // Check for generic American regions
  if (lowerLoc.includes('north america')) {
    if (year < 1492) {
      return { primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN' };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  if (lowerLoc.includes('south america')) {
    if (year < 1500) {
      return { primaryCulture: 'SOUTH_AMERICAN' };
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // North American regions - Check specific area names first
  // Mississippi Valley regions
  if (lowerLoc.includes('cahokia') || lowerLoc.includes('ozark') || lowerLoc.includes('mississippi') ||
      lowerLoc.includes('natchez') || lowerLoc.includes('illinois river') || lowerLoc.includes('driftless')) {
    if (year < 1492) {
      return { 
        primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN', 
      
      };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // Pacific Coast - European contact much later here
  if (lowerLoc.includes('columbia river') || lowerLoc.includes('puget') || lowerLoc.includes('olympic') ||
      lowerLoc.includes('redwood') || lowerLoc.includes('shasta') || lowerLoc.includes('cascade') ||
      lowerLoc.includes('pacific coast') || lowerLoc.includes('pacific northwest') || 
      lowerLoc.includes('oregon coast') || lowerLoc.includes('washington coast')) {
    if (year < 1790) {  // First sustained European contact in Pacific Northwest
      return { 
        primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN', 
      
      };
    } else if (year < 1850) {
      // Transitional period with both cultures
      return { 
        primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN',
        secondaryCulture: 'EUROPEAN',
        mixRatio: 0.3
      };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // Southwest
  if (lowerLoc.includes('sonoran') || lowerLoc.includes('chihuahuan') || lowerLoc.includes('mojave') ||
      lowerLoc.includes('rio grande') || lowerLoc.includes('sedona') || lowerLoc.includes('pueblo')) {
    if (year < 1492) {
      return { 
        primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN', 
      
      };
    }
    return { primaryCulture: 'MEDITERRANEAN' }; // Spanish colonial
  }
  
  // Great Plains
  if (lowerLoc.includes('badlands') || lowerLoc.includes('black hills') || lowerLoc.includes('high plains') ||
      lowerLoc.includes('platte river') || lowerLoc.includes('tornado alley') || lowerLoc.includes('prairie')) {
    if (year < 1492) {
      return { 
        primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN', 
      
      };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // Northeast Woodlands
  if (lowerLoc.includes('hudson') || lowerLoc.includes('great lakes') || lowerLoc.includes('adirondack') ||
      lowerLoc.includes('finger lakes') || lowerLoc.includes('champlain') || lowerLoc.includes('mohawk') ||
      lowerLoc.includes('long island') || lowerLoc.includes('cape cod') || lowerLoc.includes('connecticut river')) {
    if (year < 1492) {
      return { 
        primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN', 
      
      };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // Atlantic South
  if (lowerLoc.includes('chesapeake') || lowerLoc.includes('piedmont') || lowerLoc.includes('pine barrens') || lowerLoc.includes('everglades') ||
      lowerLoc.includes('bayou') || lowerLoc.includes('blue ridge') || lowerLoc.includes('outer banks')) {
    if (year < 1492) {
      return { 
        primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN', 
      
      };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // Arctic and Subarctic
  if (lowerLoc.includes('hudson bay') || lowerLoc.includes('bering') || lowerLoc.includes('yukon') ||
      lowerLoc.includes('labrador') || lowerLoc.includes('mackenzie') || lowerLoc.includes('aleutian') ||
      lowerLoc.includes('newfoundland') || lowerLoc.includes('superior basin')) {
    if (year < 1492) {
      return { 
        primaryCulture: 'ARCTIC', 
      
      };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // California regions
  if (lowerLoc.includes('san francisco') || lowerLoc.includes('marin') || lowerLoc.includes('sacramento') ||
      lowerLoc.includes('sierra nevada') || lowerLoc.includes('napa') || lowerLoc.includes('central california') ||
      lowerLoc.includes('mojave') || lowerLoc.includes('san diego') || lowerLoc.includes('los angeles')) {
    if (year < 1769) {
      return { 
        primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN', 
      
      };
    }
    return { primaryCulture: 'MEDITERRANEAN' }; // Spanish colonial
  }
  
  // EUROPEAN REGIONS - Detailed mapping
  
  // Scandinavia and Nordic regions
  if (lowerLoc.includes('norway') || lowerLoc.includes('sweden') || lowerLoc.includes('denmark') || 
      lowerLoc.includes('iceland') || lowerLoc.includes('scandinavia') || lowerLoc.includes('norse') ||
      lowerLoc.includes('stockholm') || lowerLoc.includes('norwegian fjords') || lowerLoc.includes('jutland') ||
      lowerLoc.includes('lapland') || lowerLoc.includes('gotland') || lowerLoc.includes('øresund')) {
    if (year >= 800 && year <= 1100) {
      return { primaryCulture: 'VIKING' };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // British Isles
  if (lowerLoc.includes('britain') || lowerLoc.includes('british') || lowerLoc.includes('england') ||
      lowerLoc.includes('scotland') || lowerLoc.includes('wales') || lowerLoc.includes('ireland') ||
      lowerLoc.includes('london') || lowerLoc.includes('edinburgh') || lowerLoc.includes('dublin') ||
      lowerLoc.includes('york') || lowerLoc.includes("hadrian's wall") || lowerLoc.includes('thames') ||
      lowerLoc.includes('oxfordshire')) {
    if (year >= 800 && year <= 1100 && lowerLoc.includes('york')) {
      return { primaryCulture: 'VIKING', secondaryCulture: 'EUROPEAN', mixRatio: 0.1 };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // France and Low Countries
  if (lowerLoc.includes('france') || lowerLoc.includes('french') || lowerLoc.includes('paris') ||
      lowerLoc.includes('loire') || lowerLoc.includes('marseille') || lowerLoc.includes('pyrenees') ||
      lowerLoc.includes('normandy') || lowerLoc.includes('languedoc') || lowerLoc.includes('flanders') ||
      lowerLoc.includes('brabant') || lowerLoc.includes('ardennes') || lowerLoc.includes('scheldt') ||
      lowerLoc.includes('rhine–meuse') || lowerLoc.includes('zuiderzee')) {
    if (lowerLoc.includes('normandy') && year >= 900 && year <= 1100) {
      return { primaryCulture: 'VIKING', secondaryCulture: 'EUROPEAN', mixRatio: 0.1 };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // Germanic Lands and Central Europe
  if (lowerLoc.includes('german') || lowerLoc.includes('rhine') || lowerLoc.includes('black forest') ||
      lowerLoc.includes('brandenburg') || lowerLoc.includes('hamburg') || lowerLoc.includes('bavarian') ||
      lowerLoc.includes('saxon') || lowerLoc.includes('danube') || lowerLoc.includes('bohemian') ||
      lowerLoc.includes('carpathian') || lowerLoc.includes('vienna') || lowerLoc.includes('moravian') ||
      lowerLoc.includes('tatra')) {
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // Eastern Europe and Russia
  if (lowerLoc.includes('moscow') || lowerLoc.includes('dnieper') || lowerLoc.includes('volga') ||
      lowerLoc.includes('steppe borderlands') || lowerLoc.includes('novgorod') || lowerLoc.includes('ural') ||
      lowerLoc.includes('white sea')) {
    if (year >= 800 && year <= 1200 && lowerLoc.includes('novgorod')) {
      return { primaryCulture: 'VIKING', secondaryCulture: 'SLAVIC', mixRatio: 0.3 };
    }
    return { primaryCulture: 'SLAVIC' };
  }
  
  // Balkans and Southeast Europe
  if (lowerLoc.includes('balkan') || lowerLoc.includes('dinaric') || lowerLoc.includes('bosporus') ||
      lowerLoc.includes('pindus') || lowerLoc.includes('thracian') || lowerLoc.includes('dalmatian') ||
      lowerLoc.includes('vardar') || lowerLoc.includes('croatia') || lowerLoc.includes('transylvania') ||
      lowerLoc.includes('dobruja')) {
    if (year >= 1453 && (lowerLoc.includes('bosporus') || lowerLoc.includes('thracian'))) {
      return { primaryCulture: 'MENA', secondaryCulture: 'EUROPEAN', mixRatio: 0.3 };
    }
    if (year >= 1500 && year <= 1700) {
      return { primaryCulture: 'EUROPEAN' };
    }
    if (year >= 1700 && year <= 1800) {
      return { primaryCulture: 'EUROPEAN' };
    }
    if (year >= 1800 && year <= 1900) {
      return { primaryCulture: 'EUROPEAN' };
    }
    if (year >= 1900) {
      return { primaryCulture: 'EUROPEAN' };
    }
    if (year >= 800 && year <= 1500) {
      return { primaryCulture: 'EUROPEAN' };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // Mediterranean Europe
  if (lowerLoc.includes('italy') || lowerLoc.includes('florence') || lowerLoc.includes('rome') ||
      lowerLoc.includes('venice') || lowerLoc.includes('naples') || lowerLoc.includes('sicily')) {
    if (year >= 1400 && year <= 1600) {
      return { primaryCulture: 'MEDITERRANEAN' };
    }
    if (year >= -500 && year <= 500) {
      return { primaryCulture: 'ROMAN' };
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // Greece
  if (lowerLoc.includes('greece') || lowerLoc.includes('athens') || lowerLoc.includes('sparta') ||
      lowerLoc.includes('crete') || lowerLoc.includes('aegean')) {
    if (year >= -800 && year <= -300) {
      return { primaryCulture: 'CLASSICAL_GREEK' };
    }
 if (year >= 1700 && year <= 1800) {
      return { primaryCulture: 'MEDITERRANEAN' };
    }
    if (year >= 1800 && year <= 1900) {
      return { primaryCulture: 'MEDITERRANEAN' };
    }
    if (year >= 1900) {
      return { primaryCulture: 'MEDITERRANEAN' };
    }
    if (year >= 800 && year <= 1400) {
      return { primaryCulture: 'MEDITERRANEAN' };
    }
    if (year >= 1500 && year <= 1700) {
      return { primaryCulture: 'MEDITERRANEAN' };
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // Spain/Portugal
  if (lowerLoc.includes('spain') || lowerLoc.includes('portugal') || lowerLoc.includes('iberia') ||
      lowerLoc.includes('madrid') || lowerLoc.includes('barcelona') || lowerLoc.includes('lisbon')) {
    if (year >= 711 && year <= 1492) {
      return { 
        primaryCulture: 'MEDITERRANEAN', 
        secondaryCulture: 'MENA',
        mixRatio: 0.2,
      
      };
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // MENA REGIONS - Detailed mapping
  
  // Egypt and Nile Valley
  if (lowerLoc.includes('egypt') || lowerLoc.includes('nile') || lowerLoc.includes('cairo') ||
      lowerLoc.includes('alexandria') || lowerLoc.includes('thebes') || lowerLoc.includes('aswan') ||
      lowerLoc.includes('faiyum') || lowerLoc.includes('eastern desert')) {
    if (year <= -500) {
      return { 
        primaryCulture: 'ANCIENT_EGYPTIAN',
        secondaryCulture: 'PREHISTORIC',
        mixRatio: 0.1,
      
      };
    }
    if (year >= 640) {
      return { primaryCulture: 'MENA' };
    }
    return { primaryCulture: 'SUB_SAHARAN_AFRICAN', secondaryCulture: 'MENA', mixRatio: 0.2 };
  }
  
  // Nubian Corridor
  if (lowerLoc.includes('nubia') || lowerLoc.includes('bayuda')) {
    if (year < 0) {
      return { primaryCulture: 'ANCIENT_EGYPTIAN', secondaryCulture: 'SUB_SAHARAN_AFRICAN', mixRatio: 0.2 };
    }
    return { primaryCulture: 'SUB_SAHARAN_AFRICAN', secondaryCulture: 'MENA', mixRatio: 0.2 };
  }
  
  // Levant
  if (lowerLoc.includes('jerusalem') || lowerLoc.includes('bekaa') || lowerLoc.includes('dead sea') ||
      lowerLoc.includes('golan') || lowerLoc.includes('galilee') || lowerLoc.includes('lebanon') ||
      lowerLoc.includes('levant') || lowerLoc.includes('palestine') || lowerLoc.includes('israel')) {
    if (year >= -1000 && year <= 70) {
      return { primaryCulture: 'ANCIENT_MESOPOTAMIAN', secondaryCulture: 'MEDITERRANEAN', mixRatio: 0.2 };
    }
    return { primaryCulture: 'MENA' };
  }
  
  // Anatolia (Turkey)
  if (lowerLoc.includes('anatolia') || lowerLoc.includes('cappadocia') || lowerLoc.includes('pontic') ||
      lowerLoc.includes('cilician') || lowerLoc.includes('tarsus') || lowerLoc.includes('central plateau')) {
    if (year >= 1453) {
      return { primaryCulture: 'MENA' };
    }
    if (year >= 330 && year < 1453) {
      return { primaryCulture: 'BYZANTINE', secondaryCulture: 'MEDITERRANEAN', mixRatio: 0.5 };
    }
    return { primaryCulture: 'CLASSICAL_GREEK' };
  }
  
  // Mesopotamia
  if (lowerLoc.includes('mesopotamia') || lowerLoc.includes('tigris') || lowerLoc.includes('euphrates') ||
      lowerLoc.includes('nineveh') || lowerLoc.includes('babylon') || lowerLoc.includes('zagros') ||
      lowerLoc.includes('diyala') || lowerLoc.includes('marsh arab')) {
    if (year <= -2000) {
      return {
        primaryCulture: 'ANCIENT_MESOPOTAMIAN',
        secondaryCulture: 'PREHISTORIC',
        mixRatio: 0.15,
      
      };
    }
    return { primaryCulture: 'MENA' };
  }
  
  // Maghreb (North Africa)
  if (lowerLoc.includes('maghreb') || lowerLoc.includes('atlas') || lowerLoc.includes('fez') ||
      lowerLoc.includes('tunisian') || lowerLoc.includes('rif coast') || lowerLoc.includes('draa') ||
      lowerLoc.includes('tripolitania') || lowerLoc.includes('morocco') || lowerLoc.includes('algeria') ||
      lowerLoc.includes('tunisia') || lowerLoc.includes('libya')) {
    if (year >= 711 && year <= 1492) {
      return { primaryCulture: 'MENA', secondaryCulture: 'MEDITERRANEAN', mixRatio: 0.2 };
    }
    return { primaryCulture: 'MENA' };
  }
  
  // Arabian Peninsula
  if (lowerLoc.includes('arabia') || lowerLoc.includes('hijaz') || lowerLoc.includes('empty quarter') ||
      lowerLoc.includes('hadhramaut') || lowerLoc.includes('dhofar') || lowerLoc.includes('najd') ||
      lowerLoc.includes('red sea') || lowerLoc.includes('hejaz') || lowerLoc.includes('yemen') ||
      lowerLoc.includes('oman') || lowerLoc.includes('saudi')) {
    return { primaryCulture: 'MENA' };
  }
  
  // Persian Plateau (Iran)
  if (lowerLoc.includes('persia') || lowerLoc.includes('isfahan') || lowerLoc.includes('zagros') ||
      lowerLoc.includes('caspian foothills') || lowerLoc.includes('dasht-e kavir') || lowerLoc.includes('shiraz') ||
      lowerLoc.includes('alborz') || lowerLoc.includes('khuzestan') || lowerLoc.includes('iran')) {
    if (year <= 650) {
      // Ancient Persian empires (Achaemenid, Parthian, Sassanid) until Islamic conquest
      return { primaryCulture: 'ANCIENT_MESOPOTAMIAN', secondaryCulture: 'MENA', mixRatio: 0.3 };
    }
    return { primaryCulture: 'MENA' };
  }
  
  // Caucasus and Black Sea region
  if (lowerLoc.includes('caucasus') || lowerLoc.includes('tbilisi') || lowerLoc.includes('ararat') ||
      lowerLoc.includes('kura river') || lowerLoc.includes('chechen') || lowerLoc.includes('georgia') ||
      lowerLoc.includes('armenia') || lowerLoc.includes('azerbaijan') || lowerLoc.includes('black sea')) {
    if (year >= 640) {
      return { primaryCulture: 'MENA', secondaryCulture: 'SLAVIC', mixRatio: 0.3 };
    }
    return { primaryCulture: 'BYZANTINE' };
  }
  
  // Madagascar and related islands - check for all variations including the region names from geography.ts
  if (lowerLoc.includes('madagascar') || lowerLoc.includes('malagasy') || 
      lowerLoc.includes('antananarivo') || lowerLoc.includes('highlands of madagascar') ||
      lowerLoc.includes('antananarivo region') || lowerLoc.includes('mozambique channel') ||
      lowerLoc.includes('comoros') || lowerLoc.includes('mascarene') || lowerLoc.includes('mahafaly')) {
    // Madagascar has unique mix of African and Austronesian (Oceanic) influences
    if (year < 1500) {
      return {
        primaryCulture: 'SUB_SAHARAN_AFRICAN',
        secondaryCulture: 'OCEANIA',
        mixRatio: 0.2,
      
      };
    }
    // Post-1500 still primarily African with some European influence
    return { 
      primaryCulture: 'SUB_SAHARAN_AFRICAN',
      secondaryCulture: 'EUROPEAN',
      mixRatio: 0.1,
    
    };
  }
  
  // Sub-Saharan Africa - including all regions from geography.ts
  if (lowerLoc.includes('ethiopia') || lowerLoc.includes('mali') || lowerLoc.includes('zimbabwe') ||
      lowerLoc.includes('congo') || lowerLoc.includes('kenya') || lowerLoc.includes('tanzania') ||
      lowerLoc.includes('mozambique') || lowerLoc.includes('angola') || lowerLoc.includes('nigeria') ||
      lowerLoc.includes('ghana') || lowerLoc.includes('senegal') || lowerLoc.includes('uganda') ||
      // Lower Guinea and Congo Basin regions
      lowerLoc.includes('katanga') || lowerLoc.includes('kasai') || lowerLoc.includes('kongo') ||
      // Horn of Africa regions
      lowerLoc.includes('ethiopian highlands') || lowerLoc.includes('danakil') || lowerLoc.includes('rift valley') ||
      lowerLoc.includes('harar') || lowerLoc.includes('somali steppe') ||
      // East African Rift regions
      lowerLoc.includes('serengeti') || lowerLoc.includes('kilimanjaro') || lowerLoc.includes('lake victoria') ||
      lowerLoc.includes('olduvai') || lowerLoc.includes('mara river') || lowerLoc.includes('swahili coast') ||
      // Southern Africa regions
      lowerLoc.includes('drakensberg') || lowerLoc.includes('kalahari') || lowerLoc.includes('karoo') ||
      lowerLoc.includes('cape coast') || lowerLoc.includes('limpopo') || lowerLoc.includes('zambezi') ||
      // Central Africa regions
      lowerLoc.includes('ubangi') || lowerLoc.includes('equatorial rainforest') || lowerLoc.includes('bangui') ||
      lowerLoc.includes('tanganyika') || lowerLoc.includes('bateke') || lowerLoc.includes('lualaba') ||
      lowerLoc.includes('rwanda') || lowerLoc.includes('burundi') || lowerLoc.includes('okavango') ||
      // West African Forests regions
      lowerLoc.includes('ibo plateau') || lowerLoc.includes('niger delta') || lowerLoc.includes('benin') ||
      lowerLoc.includes('oyo') || lowerLoc.includes('jos plateau') || lowerLoc.includes('ogun river') ||
      // General Africa check (excluding North Africa and South Africa the country)
      (lowerLoc.includes('africa') && !lowerLoc.includes('north') && !lowerLoc.includes('south africa'))) {
    if (year < 0) {
      return {
        primaryCulture: 'SUB_SAHARAN_AFRICAN',
        secondaryCulture: 'PREHISTORIC',
        mixRatio: 0.3,
      
      };
    }
    return { primaryCulture: 'SUB_SAHARAN_AFRICAN' };
  }
  
  // Middle East/North Africa
  if (lowerLoc.includes('arabia') || lowerLoc.includes('persia') || lowerLoc.includes('mesopotamia') ||
      lowerLoc.includes('babylon') || lowerLoc.includes('syria') || lowerLoc.includes('lebanon') ||
      lowerLoc.includes('morocco') || lowerLoc.includes('tunisia') || lowerLoc.includes('algeria')) {
    if (year <= -2000 && lowerLoc.includes('mesopotamia')) {
      return {
        primaryCulture: 'ANCIENT_MESOPOTAMIAN',
        secondaryCulture: 'PREHISTORIC',
        mixRatio: 0.15,
      
      };
    }
    return { primaryCulture: 'MENA' };
  }
  
  // Turkey/Anatolia
  if (lowerLoc.includes('turkey') || lowerLoc.includes('anatolia') || lowerLoc.includes('istanbul') ||
      lowerLoc.includes('constantinople') || lowerLoc.includes('byzantium')) {
    if (year >= 1453) {
      return { primaryCulture: 'MENA' };
    }
    if (year >= 330 && year < 1453) {
      return { primaryCulture: 'BYZANTINE', secondaryCulture: 'MEDITERRANEAN', mixRatio: 0.5 };
    }
    return { primaryCulture: 'CLASSICAL_GREEK' };
  }
  
  // SOUTH ASIAN REGIONS - Detailed mapping
  
  // India/South Asia main regions
  if (lowerLoc.includes('india') || lowerLoc.includes('pakistan') || lowerLoc.includes('bangladesh') ||
      lowerLoc.includes('delhi') || lowerLoc.includes('mumbai') || lowerLoc.includes('bengal') ||
      // Indus Valley
      lowerLoc.includes('harappa') || lowerLoc.includes('punjab') || lowerLoc.includes('thar desert') ||
      lowerLoc.includes('sindh') || lowerLoc.includes('salt range') || lowerLoc.includes('rann of kutch') ||
      // Gangetic Plain
      lowerLoc.includes('varanasi') || lowerLoc.includes('allahabad') || lowerLoc.includes('patna') ||
      lowerLoc.includes('awadh') || lowerLoc.includes('ganges') || lowerLoc.includes('ganga') ||
      // Deccan Plateau
      lowerLoc.includes('hyderabad') || lowerLoc.includes('western ghats') || lowerLoc.includes('malabar') ||
      lowerLoc.includes('coromandel') || lowerLoc.includes('karnataka') || lowerLoc.includes('eastern ghats') ||
      // Central India
      lowerLoc.includes('malwa') || lowerLoc.includes('vindhya') || lowerLoc.includes('chota nagpur') ||
      lowerLoc.includes('narmada') || lowerLoc.includes('gondwana') || lowerLoc.includes('satpura')) {
    if (year >= 1526 && year <= 1857) {
      return { 
        primaryCulture: 'SOUTH_ASIAN',
        secondaryCulture: 'MENA',
        mixRatio: 0.2,
      
      };
    }
    return { primaryCulture: 'SOUTH_ASIAN' };
  }
  
  // Himalayas and Northeast India
  if (lowerLoc.includes('kashmir') || lowerLoc.includes('sikkim') || lowerLoc.includes('brahmaputra') ||
      lowerLoc.includes('darjeeling') || lowerLoc.includes('assam') || lowerLoc.includes('naga hills') ||
      lowerLoc.includes('bhutan') || lowerLoc.includes('nepal')) {
    if (lowerLoc.includes('bhutan') || lowerLoc.includes('sikkim')) {
      return { primaryCulture: 'EAST_ASIAN', secondaryCulture: 'SOUTH_ASIAN', mixRatio: 0.3 };
    }
    return { primaryCulture: 'SOUTH_ASIAN' };
  }
  
  // Sri Lanka
  if (lowerLoc.includes('sri lanka') || lowerLoc.includes('ceylon') || lowerLoc.includes('kandy') ||
      lowerLoc.includes('jaffna') || lowerLoc.includes('anuradhapura') || lowerLoc.includes('galle') ||
      lowerLoc.includes('trincomalee')) {
    return { primaryCulture: 'SOUTH_ASIAN' };
  }
  
  // EAST ASIAN REGIONS - Detailed mapping
  
  // China - all regions
  if (lowerLoc.includes('china') || lowerLoc.includes('beijing') || lowerLoc.includes('shanghai') ||
      lowerLoc.includes('canton') || lowerLoc.includes('yellow river') || lowerLoc.includes('yangtze') ||
      // North China
      lowerLoc.includes('shandong') || lowerLoc.includes('loess plateau') || lowerLoc.includes('taihang') ||
      lowerLoc.includes('hebei') ||
      // South China
      lowerLoc.includes('pearl river') || lowerLoc.includes('fujian') || lowerLoc.includes('guangxi') ||
      lowerLoc.includes('hainan') || lowerLoc.includes('wuyi') ||
      // West China
      lowerLoc.includes('sichuan') || lowerLoc.includes('yunnan') || lowerLoc.includes('tibet') ||
      lowerLoc.includes('himalayan slopes') || lowerLoc.includes('kailash')) {
    return { primaryCulture: 'EAST_ASIAN' };
  }
  
  // Japan
  if (lowerLoc.includes('japan') || lowerLoc.includes('tokyo') || lowerLoc.includes('kyoto') ||
      lowerLoc.includes('osaka') || lowerLoc.includes('honshu') || lowerLoc.includes('edo') ||
      lowerLoc.includes('inland sea') || lowerLoc.includes('mount fuji') || lowerLoc.includes('tohoku') ||
      lowerLoc.includes('nara') || lowerLoc.includes('hokkaido')) {
    return { primaryCulture: 'EAST_ASIAN' };
  }
  
  // Korea
  if (lowerLoc.includes('korea') || lowerLoc.includes('seoul') || lowerLoc.includes('pyongyang') ||
      lowerLoc.includes('han river valley') || lowerLoc.includes('kaesong') || lowerLoc.includes('gyeongju') ||
      lowerLoc.includes('jeolla') || lowerLoc.includes('baekdu') || lowerLoc.includes('busan')) {
    return { primaryCulture: 'EAST_ASIAN' };
  }
  
  // Siberia
  if (lowerLoc.includes('siberia') || lowerLoc.includes('kamchatka') || lowerLoc.includes('sakhalin')) {
    if (year < 1600) {
      return { primaryCulture: 'MONGOLIAN' };
    }
    return { primaryCulture: 'SLAVIC' };
  }
  
  // Central Asia (Kazakhstan, Uzbekistan, etc.)
  if (lowerLoc.includes('kazakh') || lowerLoc.includes('altai') || lowerLoc.includes('aral sea') ||
      lowerLoc.includes('tian shan') || lowerLoc.includes('dzungarian') || lowerLoc.includes('khorasan') ||
      lowerLoc.includes('transoxiana') || lowerLoc.includes('kyzylkum') || lowerLoc.includes('ferghana') ||
      lowerLoc.includes('samarkand') || lowerLoc.includes('balkh') || lowerLoc.includes('pamir') ||
      lowerLoc.includes('hindu kush')) {
    if (year >= 1200 && year <= 1500) {
      return { primaryCulture: 'MONGOLIAN', secondaryCulture: 'MENA', mixRatio: 0.3 };
    }
    return { primaryCulture: 'MENA' };
  }
  
  // Xinjiang
  if (lowerLoc.includes('xinjiang') || lowerLoc.includes('tarim basin') || lowerLoc.includes('kunlun') ||
      lowerLoc.includes('qaidam')) {
    if (year < 1750) {
      return { primaryCulture: 'MONGOLIAN', secondaryCulture: 'EAST_ASIAN', mixRatio: 0.3 };
    }
    return { primaryCulture: 'EAST_ASIAN' };
  }
  
  // Mongolia and Manchuria
  if (lowerLoc.includes('mongolia') || lowerLoc.includes('gobi') || lowerLoc.includes('manchuria') ||
      lowerLoc.includes('mongolian steppes') || lowerLoc.includes('manchurian plain')) {
    if (year >= 1200 && year <= 1400) {
      return { primaryCulture: 'MONGOLIAN' };
    }
    if (lowerLoc.includes('manchuria') && year >= 1600) {
      return { primaryCulture: 'EAST_ASIAN' };
    }
    return { primaryCulture: 'MONGOLIAN' };
  }
  
  // SOUTHEAST ASIAN REGIONS - Detailed mapping
  
  // Mainland Southeast Asia
  if (lowerLoc.includes('vietnam') || lowerLoc.includes('thailand') || lowerLoc.includes('cambodia') ||
      lowerLoc.includes('laos') || lowerLoc.includes('myanmar') || lowerLoc.includes('burma') ||
      lowerLoc.includes('irrawaddy') || lowerLoc.includes('mekong') || lowerLoc.includes('red river delta') ||
      lowerLoc.includes('annam') || lowerLoc.includes('tenasserim') || lowerLoc.includes('malay peninsula') ||
      lowerLoc.includes('shan plateau') || lowerLoc.includes('annamite')) {
    if (year < 1000) {
      return {
        primaryCulture: 'SOUTHEAST_ASIAN',
        secondaryCulture: 'SOUTH_ASIAN',
        mixRatio: 0.3,
      
      };
    }
    return { primaryCulture: 'SOUTHEAST_ASIAN' };
  }
  
  // Maritime Southeast Asia
  if (lowerLoc.includes('strait of malacca') || lowerLoc.includes('sumatra') || lowerLoc.includes('java') ||
      lowerLoc.includes('sunda strait') || lowerLoc.includes('celebes') || lowerLoc.includes('banda sea') ||
      lowerLoc.includes('timor sea') || lowerLoc.includes('makassar') || lowerLoc.includes('spice islands')) {
    return { 
      primaryCulture: 'SOUTHEAST_ASIAN',
      secondaryCulture: 'OCEANIA',
      mixRatio: 0.2,
    
    };
  }
  
  // Indonesia specific
  if (lowerLoc.includes('indonesia') || lowerLoc.includes('borneo') || lowerLoc.includes('sulawesi')) {
    return { 
      primaryCulture: 'SOUTHEAST_ASIAN',
      secondaryCulture: 'OCEANIA',
      mixRatio: 0.2,
    
    };
  }
  
  // Malaysia
  if (lowerLoc.includes('malaysia')) {
    if (year >= 1400 && year <= 1900) {
      return { 
        primaryCulture: 'SOUTHEAST_ASIAN',
        secondaryCulture: 'MENA',
        mixRatio: 0.2,
      
      };
    }
    return { primaryCulture: 'SOUTHEAST_ASIAN' };
  }
  
  // Philippines
  if (lowerLoc.includes('philippines') || lowerLoc.includes('manila') || lowerLoc.includes('luzon') ||
      lowerLoc.includes('visayan') || lowerLoc.includes('mindanao') || lowerLoc.includes('palawan') ||
      lowerLoc.includes('sulu sea')) {
    if (year >= 1565 && year <= 1898) {
      return {
        primaryCulture: 'SOUTHEAST_ASIAN',
        secondaryCulture: 'MEDITERRANEAN',
        mixRatio: 0.3,
      
      };
    }
    return { primaryCulture: 'SOUTHEAST_ASIAN' };
  }
  
  // Taiwan and Ryukyu
  if (lowerLoc.includes('taiwan') || lowerLoc.includes('formosa') || lowerLoc.includes('taipei') ||
      lowerLoc.includes('ryukyu') || lowerLoc.includes('kenting') || lowerLoc.includes('taitung')) {
    if (year < 1600) {
      return {
        primaryCulture: 'OCEANIA',
        secondaryCulture: 'EAST_ASIAN',
        mixRatio: 0.3,
      
      };
    }
    if (year >= 1895 && year <= 1945) {
      return { primaryCulture: 'EAST_ASIAN' };
    }
    return { primaryCulture: 'EAST_ASIAN' };
  }
  
  // OCEANIA REGIONS - Detailed mapping
  
  // Australia - all regions
  if (lowerLoc.includes('australia') || lowerLoc.includes('aboriginal') || 
      lowerLoc.includes('outback') || lowerLoc.includes('sydney') || lowerLoc.includes('melbourne') ||
      lowerLoc.includes('queensland') || lowerLoc.includes('tasmania') ||
      // Specific Australian regions
      lowerLoc.includes('blue mountains') || lowerLoc.includes('gippsland') || lowerLoc.includes('murray river') ||
      lowerLoc.includes('victorian alps') || lowerLoc.includes('snowy mountains') ||
      lowerLoc.includes('alice springs') || lowerLoc.includes('macdonnell') || lowerLoc.includes('lake eyre') ||
      lowerLoc.includes('simpson desert') || lowerLoc.includes('uluru') || lowerLoc.includes('barkly') ||
      lowerLoc.includes('cape york') || lowerLoc.includes('great barrier reef') || lowerLoc.includes('daintree') ||
      lowerLoc.includes('carpentaria') || lowerLoc.includes('arnhem') || lowerLoc.includes('torres strait') ||
      lowerLoc.includes('pilbara') || lowerLoc.includes('kimberley') || lowerLoc.includes('great sandy') ||
      lowerLoc.includes('nullarbor') || lowerLoc.includes('swan coastal') || lowerLoc.includes('goldfields')) {
    
    // Northern Australia has more Oceanic influence
    if (lowerLoc.includes('north') || lowerLoc.includes('darwin') || lowerLoc.includes('arnhem') || 
        lowerLoc.includes('kimberley') || lowerLoc.includes('cape york') || lowerLoc.includes('torres')) {
      if (year < 1788) {
        return {
          primaryCulture: 'ABORIGINAL_AUSTRALIAN',
          secondaryCulture: 'OCEANIA',
          mixRatio: 0.15,
        
        };
      }
    } else {
      // Southern and Central Australia
      if (year < 1788) {
        return { primaryCulture: 'ABORIGINAL_AUSTRALIAN' };
      }
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // New Zealand
  if (lowerLoc.includes('zealand') || lowerLoc.includes('aotearoa') || lowerLoc.includes('canterbury') ||
      lowerLoc.includes('southern alps') || lowerLoc.includes('rotorua') || lowerLoc.includes("hawke's bay") ||
      lowerLoc.includes('otago') || lowerLoc.includes('wellington')) {
    if (year < 1840) {
      return { primaryCulture: 'OCEANIA' };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // New Guinea and Melanesia
  if (lowerLoc.includes('papua') || lowerLoc.includes('new guinea') || lowerLoc.includes('sepik') ||
      lowerLoc.includes('bismarck') || lowerLoc.includes('solomon') || lowerLoc.includes('coral sea') ||
      lowerLoc.includes('kokoda') || lowerLoc.includes('vanuatu') || lowerLoc.includes('new caledonia')) {
    return { primaryCulture: 'OCEANIA' };
  }
  
  // Polynesia
  if (lowerLoc.includes('polynesia') || lowerLoc.includes('society islands') || lowerLoc.includes('marquesas') ||
      lowerLoc.includes('tuamotu') || lowerLoc.includes('samoa') || lowerLoc.includes('tonga') ||
      lowerLoc.includes('rapa nui') || lowerLoc.includes('easter island')) {
    return { primaryCulture: 'OCEANIA' };
  }
  
  // Micronesia
  if (lowerLoc.includes('micronesia') || lowerLoc.includes('caroline islands') || lowerLoc.includes('marshall') ||
      lowerLoc.includes('mariana') || lowerLoc.includes('palau') || lowerLoc.includes('yap') ||
      lowerLoc.includes('guam')) {
    return { primaryCulture: 'OCEANIA' };
  }
  
  // Hawaii
  if (lowerLoc.includes('hawaii') || lowerLoc.includes('big island') || lowerLoc.includes('maui') ||
      lowerLoc.includes('oahu') || lowerLoc.includes('volcanoes national') || lowerLoc.includes('kauai') ||
      lowerLoc.includes('molokai')) {
    if (year < 1893) {
      return { primaryCulture: 'OCEANIA' };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // General Pacific Islands
  if (lowerLoc.includes('tahiti') || lowerLoc.includes('fiji') || lowerLoc.includes('pacific')) {
    return { primaryCulture: 'OCEANIA' };
  }
  
  // Indonesian and Melanesian Islands (special region in Oceania)
  if (lowerLoc.includes('andaman') || lowerLoc.includes('laccadive')) {
    return { primaryCulture: 'SOUTH_ASIAN', secondaryCulture: 'OCEANIA', mixRatio: 0.2 };
  }
  
  // Generic North America fallback - Pre-Columbian
  if ((lowerLoc.includes('america') || lowerLoc.includes('north america')) && year < 1492) {
    // Arctic
    if (lowerLoc.includes('alaska') || lowerLoc.includes('arctic') || lowerLoc.includes('inuit')) {
      return { primaryCulture: 'ARCTIC' };
    }
    // Southwest
    if (lowerLoc.includes('arizona') || lowerLoc.includes('new mexico') || lowerLoc.includes('pueblo')) {
      return { primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN' };
    }
    // Plains
    if (lowerLoc.includes('plains') || lowerLoc.includes('dakota') || lowerLoc.includes('kansas')) {
      return { primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN' };
    }
    // Pacific Northwest
    if (lowerLoc.includes('pacific') || lowerLoc.includes('northwest') || lowerLoc.includes('washington')) {
      return { primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN' };
    }
    // Eastern Woodlands default
    return { primaryCulture: 'NORTH_AMERICAN_PRE_COLUMBIAN' };
  }
  
  // SOUTH AMERICAN REGIONS - Detailed mapping
  
  // Mexico and Central America
  if (lowerLoc.includes('mexico') || lowerLoc.includes('aztec') || lowerLoc.includes('maya') ||
      lowerLoc.includes('valley of mexico') || lowerLoc.includes('oaxaca') || lowerLoc.includes('yucatán') ||
      lowerLoc.includes('sierra madre') || lowerLoc.includes('tehuantepec') || lowerLoc.includes('texcoco') ||
      lowerLoc.includes('baja california') || lowerLoc.includes('mayan lowlands') || lowerLoc.includes('mosquito coast') ||
      lowerLoc.includes('panama isthmus')) {
    if (year < 1519) {
      return { primaryCulture: 'MESOAMERICAN' };
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // Caribbean
  if (lowerLoc.includes('caribbean') || lowerLoc.includes('antilles') || lowerLoc.includes('cuba') ||
      lowerLoc.includes('jamaica') || lowerLoc.includes('hispaniola') || lowerLoc.includes('puerto rico')) {
    if (year < 1492) {
      return { primaryCulture: 'SOUTH_AMERICAN' };
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // Andean regions
  if (lowerLoc.includes('peru') || lowerLoc.includes('inca') || lowerLoc.includes('andes') ||
      lowerLoc.includes('quito') || lowerLoc.includes('cajamarca') || lowerLoc.includes('titicaca') ||
      lowerLoc.includes('chimborazo') || lowerLoc.includes('cordillera') || lowerLoc.includes('chachapoyas') ||
      lowerLoc.includes('cuzco') || lowerLoc.includes('altiplano') || lowerLoc.includes('atacama') ||
      lowerLoc.includes('mendoza') || lowerLoc.includes('aconcagua') || lowerLoc.includes('mapuche') ||
      lowerLoc.includes('potosí') || lowerLoc.includes('tarija') || lowerLoc.includes('cochabamba') ||
      lowerLoc.includes('sucre') || lowerLoc.includes('yungas')) {
    if (year < 1532) {
      return { primaryCulture: 'ANDEAN' };
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // Amazon Basin
  if (lowerLoc.includes('amazon') || lowerLoc.includes('manaus') || lowerLoc.includes('rio negro') ||
      lowerLoc.includes('xingu') || lowerLoc.includes('acre') || lowerLoc.includes('varzea') ||
      lowerLoc.includes('tapajós')) {
    if (year < 1500) {
      return { primaryCulture: 'SOUTH_AMERICAN' };
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // Pampas and Southern Cone
  if (lowerLoc.includes('pampas') || lowerLoc.includes('argentina') || lowerLoc.includes('uruguay') ||
      lowerLoc.includes('paraná') || lowerLoc.includes('santa fe') || lowerLoc.includes('gran chaco') ||
      lowerLoc.includes('pantanal') || lowerLoc.includes('córdoba') || lowerLoc.includes('uruguay river')) {
    if (year < 1500) {
      return { primaryCulture: 'SOUTH_AMERICAN' };
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // Brazilian Coast
  if (lowerLoc.includes('brazil') || lowerLoc.includes('rio de janeiro') || lowerLoc.includes('bahia') ||
      lowerLoc.includes('pernambuco') || lowerLoc.includes('são paulo') || lowerLoc.includes('recôncavo') ||
      lowerLoc.includes('espírito santo')) {
    if (year < 1500) {
      return { primaryCulture: 'SOUTH_AMERICAN' };
    }
    if (year >= 1500 && year <= 1822) {
      return { primaryCulture: 'MEDITERRANEAN' }; // Portuguese colonial
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // Guiana Shield
  if (lowerLoc.includes('orinoco') || lowerLoc.includes('guiana') || lowerLoc.includes('essequibo') ||
      lowerLoc.includes('maroni') || lowerLoc.includes('rupununi') || lowerLoc.includes('kaieteur') ||
      lowerLoc.includes('guyana') || lowerLoc.includes('venezuela') || lowerLoc.includes('maracaibo')) {
    if (year < 1500) {
      return { primaryCulture: 'SOUTH_AMERICAN' };
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // Patagonia
  if (lowerLoc.includes('patagonia') || lowerLoc.includes('valdés') || lowerLoc.includes('magellanic') ||
      lowerLoc.includes('tierra del fuego') || lowerLoc.includes('strait of magellan') || lowerLoc.includes('ice fields')) {
    if (year < 1520) {
      return { primaryCulture: 'SOUTH_AMERICAN' };
    }
    return { primaryCulture: 'EUROPEAN' };
  }
  
  // Llanos and Orinoco
  if (lowerLoc.includes('llanos') || lowerLoc.includes('apure') || lowerLoc.includes('meta river') ||
      lowerLoc.includes('villavicencio') || lowerLoc.includes('arauca') || lowerLoc.includes('orinoco rapids')) {
    if (year < 1500) {
      return { primaryCulture: 'SOUTH_AMERICAN' };
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // General South America
  if (lowerLoc.includes('colombia') || lowerLoc.includes('ecuador') || lowerLoc.includes('bolivia') ||
      lowerLoc.includes('chile') || lowerLoc.includes('paraguay')) {
    if (year < 1500) {
      return { primaryCulture: 'SOUTH_AMERICAN' };
    }
    return { primaryCulture: 'MEDITERRANEAN' };
  }
  
  // FINAL FALLBACK - Try to guess based on any remaining keywords
  
  // Check for any generic continent or region names we might have missed
  if (lowerLoc.includes('arctic') || lowerLoc.includes('polar')) {
    return { primaryCulture: 'ARCTIC' };
  }
  
  if (lowerLoc.includes('desert') && year < 1500) {
    return { primaryCulture: 'MENA' };
  }
  
  if (lowerLoc.includes('steppe') || lowerLoc.includes('nomad')) {
    return { primaryCulture: 'MONGOLIAN' };
  }
  
  if (lowerLoc.includes('tropical') || lowerLoc.includes('jungle') || lowerLoc.includes('rainforest')) {
    if (year < 1500) {
      return { primaryCulture: 'SOUTH_AMERICAN' };
    }
  }
  
  // Default to European as the most generic fallback
  // This ensures we never return undefined and always have some building type
  console.warn(`[CulturalMapping] No specific mapping found for location: "${location}", defaulting to European`);
  return { primaryCulture: 'EUROPEAN' };
}

/**
 * Determines if prehistoric buildings should be mixed in based on era and development level
 */
export function shouldIncludePrehistoricBuildings(
  year: number, 
  biomeType: string,
  culturalMapping: CulturalMapping
): boolean {
  // Always include in prehistory
  if (year < -3000) return true;
  
  // Include in hamlets and rural areas for ancient civilizations
  if (year < 0 && (biomeType === 'HAMLET' || biomeType === 'LOW_DENSITY_CITY')) {
    return true;
  }
  
  // For prehistoric era, always include prehistoric shelters
  // This check is now handled by the unified building selection system
  
  return false;
}

/**
 * Maps cultural style strings to building selection logic
 */
export function getCulturalBuildingStyle(culturalStyle: string): string {
  const styleMap: Record<string, string> = {
    'VIKING': 'VIKING',
    'MEDITERRANEAN': 'MEDITERRANEAN', 
    'ROMAN': 'ROMAN',
    'CLASSICAL_GREEK': 'GREEK',
    'ANCIENT_EGYPTIAN': 'EGYPTIAN',
    'ANCIENT_MESOPOTAMIAN': 'MESOPOTAMIAN',
    'BYZANTINE': 'BYZANTINE',
    'SLAVIC': 'SLAVIC',
    'ARCTIC': 'ARCTIC',
    'MESOAMERICAN': 'MESOAMERICAN',
    'ANDEAN': 'ANDEAN',
    'MONGOLIAN': 'MONGOLIAN',
    'SOUTHEAST_ASIAN': 'SOUTHEAST_ASIAN',
    'ABORIGINAL_AUSTRALIAN': 'ABORIGINAL_AUSTRALIAN',
    'OCEANIA': 'OCEANIA',
    'EAST_ASIAN': 'EAST_ASIAN',
    'SOUTH_ASIAN': 'SOUTH_ASIAN',
    'SUB_SAHARAN_AFRICAN': 'SUB_SAHARAN_AFRICAN',
    'MENA': 'MENA',
    'NORTH_AMERICAN_PRE_COLUMBIAN': 'NORTH_AMERICAN_PRE_COLUMBIAN',
    'SOUTH_AMERICAN': 'SOUTH_AMERICAN',
    'EUROPEAN': 'EUROPEAN',
    'PREHISTORIC': 'PREHISTORIC'
  };
  
  return styleMap[culturalStyle] || 'EUROPEAN';
}