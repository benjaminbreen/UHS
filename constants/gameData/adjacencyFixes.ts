/**
 * adjacencyFixes.ts - Major adjacency fixes and additions for water bodies
 * These will be merged into the main adjacencies.ts file
 */

import type { AdjacencyData } from '../../types';

// New adjacencies for water bodies and fixed regions
export const WATER_BODY_ADJACENCIES: Record<string, AdjacencyData> = {
  // === EUROPEAN SEAS ===
  "Irish Sea": { 
    N: "Edinburgh", 
    S: "Dublin", 
    E: "York", 
    W: "LIMINAL_ATLANTIC_TO_AMERICAS" 
  },
  
  "North Sea": { 
    N: "Norwegian Fjords", 
    S: "English Channel", 
    E: "Hamburg Coast", 
    W: "Thames Estuary" 
  },
  
  "Baltic Sea": { 
    N: "Stockholm Archipelago", 
    S: "Brandenburg Plain", 
    E: "St. Petersburg Outskirts", 
    W: "Hamburg Coast" 
  },
  
  "Bay of Biscay": { 
    N: "Normandy", 
    S: "Catalonian Hills", 
    E: "Loire Valley", 
    W: "LIMINAL_ATLANTIC_TO_AMERICAS" 
  },
  
  "English Channel": { 
    N: "Thames Estuary", 
    S: "Normandy", 
    E: "Rhine–Meuse Delta", 
    W: "Bay of Biscay" 
  },
  
  // === MEDITERRANEAN ===
  "Western Mediterranean": { 
    N: "Marseille Coast", 
    S: "Tunisian Sahel", 
    E: "Tyrrhenian Sea", 
    W: "Strait of Gibraltar" 
  },
  
  "Eastern Mediterranean": { 
    N: "Aegean Sea", 
    S: "Nile Delta", 
    E: "Levantine Coast", 
    W: "Tyrrhenian Sea" 
  },
  
  "Aegean Sea": { 
    N: "Thracian Plain", 
    S: "Eastern Mediterranean", 
    E: "Anatolia", 
    W: "Athens Basin" 
  },
  
  "Adriatic Sea": { 
    N: "Venetian Lagoon", 
    S: "Athens Basin", 
    E: "Dalmatian Coast", 
    W: "Bay of Naples" 
  },
  
  "Tyrrhenian Sea": { 
    N: "Roman Campagna", 
    S: "Western Mediterranean", 
    E: "Bay of Naples", 
    W: "Marseille Coast" 
  },
  
  // === MIDDLE EASTERN WATERS ===
  "Black Sea": { 
    N: "Dnieper River Valley", 
    S: "Anatolia", 
    E: "Caucasus Mountains", 
    W: "Thracian Plain" 
  },
  
  "Caspian Sea": { 
    N: "Volga River Valley", 
    S: "Isfahan Basin", 
    E: "Samarkand Region", 
    W: "Caucasus Mountains" 
  },
  
  "Red Sea": { 
    N: "Levantine Coast", 
    S: "Empty Quarter", 
    E: "Hejaz Mountains", 
    W: "Thebes" 
  },
  
  "Persian Gulf": { 
    N: "Tigris Headwaters", 
    S: "Empty Quarter", 
    E: "Isfahan Basin", 
    W: "Babylonian Plain" 
  },
  
  "Arabian Sea": { 
    N: "Persian Gulf", 
    S: "LIMINAL_INDIAN_OCEAN_TO_ASIA", 
    E: "Karachi Delta", 
    W: "Empty Quarter" 
  },
  
  // === ASIAN WATERS ===
  "Yellow Sea": { 
    N: "Beijing Basin", 
    S: "East China Sea", 
    E: "Han River Valley", 
    W: "Shandong Peninsula" 
  },
  
  "Sea of Japan": { 
    N: "Sakhalin Island", 
    S: "Kyoto Basin", 
    E: "LIMINAL_PACIFIC_TO_AMERICAS", 
    W: "Han River Valley" 
  },
  
  "East China Sea": { 
    N: "Yellow Sea", 
    S: "South China Sea", 
    E: "Kyoto Basin", 
    W: "Yangtze Delta" 
  },
  
  "South China Sea": { 
    N: "East China Sea", 
    S: "Java Sea", 
    E: "Manila Bay", 
    W: "Pearl River Delta" 
  },
  
  "Bay of Bengal": { 
    N: "Bengal Delta", 
    S: "LIMINAL_INDIAN_OCEAN_TO_ASIA", 
    E: "Strait of Malacca", 
    W: "Malabar Coast" 
  },
  
  // === AMERICAN WATERS ===
  "Gulf of Mexico": { 
    N: "Mississippi Delta", 
    S: "Caribbean Sea", 
    E: "Florida Everglades", 
    W: "Gulf Coast Texas" 
  },
  
  "Caribbean Sea": { 
    N: "Gulf of Mexico", 
    S: "Panama Isthmus", 
    E: "LIMINAL_ATLANTIC_TO_EUROPE", 
    W: "Valley of Mexico" 
  },
  
  "Hudson Bay": { 
    N: "LIMINAL_ARCTIC_OCEAN_TO_NORTH_AMERICA", 
    S: "Hudson Bay Lowlands", 
    E: "Labrador Coast", 
    W: "Saskatchewan Prairie" 
  },
  
  // === SAHARAN INTERIOR ===
  "Central Sahara": { 
    N: "Atlas Mountains", 
    S: "Hoggar Mountains", 
    E: "Tibesti Mountains", 
    W: "Sahara Desert" 
  },
  
  "Hoggar Mountains": { 
    N: "Central Sahara", 
    S: "Timbuktu Basin", 
    E: "Tibesti Mountains", 
    W: "Sahara Desert" 
  },
  
  "Tibesti Mountains": { 
    N: "Tripolitania", 
    S: "Lake Chad", 
    E: "Nubian Desert", 
    W: "Central Sahara" 
  },
  
  // === CRITICAL PASSAGES ===
  "Darien Swamp": { 
    N: "Panama Isthmus", 
    S: "Quito Plateau", 
    E: "Caribbean Sea", 
    W: "LIMINAL_PACIFIC_TO_OCEANIA" 
  },
  
  "Sinaloa Coast": { 
    N: "Baja California", 
    S: "Valley of Mexico", 
    E: "Chihuahuan Desert", 
    W: "LIMINAL_PACIFIC_TO_OCEANIA" 
  }
};

// Fixed adjacencies for existing regions
export const ADJACENCY_FIXES: Record<string, AdjacencyData> = {
  // Fix Arctic Siberia connection
  "Arctic Siberia": { 
    N: "LIMINAL_ARCTIC_OCEAN_TO_NORTH_AMERICA",
    S: "Central Siberia", 
    E: "Bering Strait", 
    W: "Central Siberia" // Goes through Central Siberia, not directly to Urals
  },
  
  // Fix Baja California
  "Baja California": { 
    N: "San Diego Region", 
    S: "Sinaloa Coast", // Now goes through new intermediate region
    E: "Sonoran Desert", 
    W: "LIMINAL_PACIFIC_TO_OCEANIA" 
  },
  
  // Fix China-Korea connections (now go through Yellow Sea)
  "Shandong Peninsula": { 
    N: "Beijing Basin", 
    S: "Yangtze Gorges", 
    W: "Yellow River Valley", 
    E: "Yellow Sea" // Changed from direct to Korea
  },
  
  "Han River Valley": { 
    N: "Baekdu Mountain Zone", 
    S: "Busan Coast", 
    E: "Sea of Japan", 
    W: "Yellow Sea" // Changed from direct to China
  },
  
  "Jeolla Highlands": { 
    N: "Gyeongju Basin", 
    S: "Busan Coast", 
    E: "Busan Coast", 
    W: "Yellow Sea" // Changed from Yangtze Gorges
  },
  
  "Busan Coast": { 
    N: "Han River Valley", 
    S: "Sea of Japan", // Changed to sea connection
    E: "Sea of Japan", 
    W: "Yellow Sea" // Changed from Pearl River Delta
  },
  
  // Fix Trans-Saharan connections
  "Atlas Mountains": { 
    N: "Andalusian Plain", 
    S: "Central Sahara", // Now goes through Central Sahara
    E: "Tripolitania", 
    W: "Rif Coast" 
  },
  
  "Tripolitania": { 
    N: "Bay of Naples", 
    S: "Tibesti Mountains", // Goes through Tibesti
    E: "Nile Delta", 
    W: "Atlas Mountains" 
  },
  
  "Timbuktu Basin": { 
    N: "Hoggar Mountains", // Must go through Hoggar
    S: "Niger Delta", 
    E: "Lake Chad", 
    W: "Ghana Gold Coast" 
  },
  
  // Fix Panama connection
  "Panama Isthmus": { 
    N: "Caribbean Sea",
    S: "Darien Swamp", // Now goes through difficult Darien Swamp
    E: "Caribbean Sea", 
    W: "LIMINAL_PACIFIC_TO_OCEANIA" 
  },
  
  // Fix British Isles connections
  "Edinburgh": { 
    N: "Norwegian Fjords", 
    S: "Hadrian's Wall", 
    E: "North Sea", 
    W: "Irish Sea" // Now goes through Irish Sea
  },
  
  "Dublin": { 
    N: "Irish Sea", 
    S: "Irish Sea", 
    E: "Irish Sea", 
    W: "LIMINAL_ATLANTIC_TO_AMERICAS" 
  },
  
  "Hadrian's Wall": { 
    N: "Edinburgh", 
    S: "York", 
    E: "North Sea", 
    W: "Irish Sea" // Goes through Irish Sea to Dublin
  },
  
  "London": { 
    N: "York", 
    S: "English Channel", // Goes to English Channel
    E: "Thames Estuary", 
    W: "Oxfordshire" 
  },
  
  "Oxfordshire": { 
    N: "York", 
    S: "English Channel", 
    E: "London", 
    W: "Irish Sea" // Goes through Irish Sea to Dublin
  }
};