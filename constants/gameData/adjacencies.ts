
import { MapArchetype } from '../../types';
import type { AdjacencyData, LiminalSequence } from '../../types';

// Complete adjacency data connecting all actual map areas directly, with liminal spaces for all oceanic crossings
export const ADJACENCIES: Record<string, AdjacencyData> = {
  // === EUROPE === 
  // British Isles
  "London": { N: "York", S: "Cliffs of Dover", E: "Thames Estuary", W: "Oxfordshire" },
  "Edinburgh": { N: "Norwegian Fjords", S: "Hadrian's Wall", E: "North Sea", W: "Irish Sea" },
  "Dublin": { N: "Irish Sea", S: "Irish Sea", E: "Irish Sea", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "York": { N: "Hadrian's Wall", S: "London", E: "Thames Estuary", W: "Irish Sea" },
  "Hadrian's Wall": { N: "Edinburgh", S: "York", E: "North Sea", W: "Irish Sea" },
  "Thames Estuary": { W: "London", E: "Rhine–Meuse Delta", S: "York" },
  "Oxfordshire": { N: "York", S: "London", E: "London", W: "Irish Sea" },
   "Cliffs of Dover": { N: "London", E: "Thames Estuary", S: "English Channel", W: "English Channel"  },
  
  // British Waters
  "Irish Sea": { N: "Edinburgh", S: "Dublin", E: "York", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "North Sea": { N: "Norwegian Fjords", S: "English Channel", E: "Hamburg Coast", W: "Thames Estuary" },
  "English Channel": { N: "Cliffs of Dover", S: "Normandy", E: "Rhine–Meuse Delta", W: "Bay of Biscay" },

  // France
  "Paris Basin": { N: "Normandy", S: "Loire Valley", E: "Rhine Valley", W: "Normandy" },
  "Loire Valley": { N: "Paris Basin", S: "Languedoc", E: "Paris Basin", W: "Bay of Biscay" },
  "Marseille Coast": { W: "Languedoc", E: "Tyrrhenian Sea", N: "Languedoc", S: "Western Mediterranean" },
  "Pyrenees Foothills": { N: "Languedoc", S: "Catalonian Hills", E: "Languedoc" },
  "Normandy": { S: "Paris Basin", N: "English Channel", E: "Paris Basin", W: "Bay of Biscay" },
  "Languedoc": { N: "Loire Valley", E: "Marseille Coast", S: "Pyrenees Foothills", W: "Pyrenees Foothills" },
  "Bay of Biscay": { N: "Normandy", S: "Catalonian Hills", E: "Loire Valley", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
    "Atlantic Ocean": { N: "Irish Sea", S: "LIMINAL_ATLANTIC_TO_AMERICAS", E: "Bay of Biscay", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },

  // Iberian Peninsula
  "Andalusian Plain": { N: "Toledo Plateau", S: "Strait of Gibraltar", E: "Toledo Plateau" },
  "Lisbon Coast": { E: "Toledo Plateau", W: "LIMINAL_ATLANTIC_TO_AMERICAS", N: "Toledo Plateau" },
  "Ebro Valley": { N: "Catalonian Hills", W: "Toledo Plateau", S: "Toledo Plateau" },
  "Toledo Plateau": { E: "Ebro Valley", S: "Andalusian Plain", W: "Lisbon Coast", N: "Loire Valley" },
  "Strait of Gibraltar": { N: "Andalusian Plain", S: "Rif Coast" },
  "Catalonian Hills": { N: "Pyrenees Foothills", S: "Ebro Valley", E: "Marseille Coast" },

  // Italy
  "Roman Campagna": { N: "Florence Hills", S: "Tyrrhenian Sea", E: "Bay of Naples", W: "Tyrrhenian Sea" },
  "Venetian Lagoon": { W: "Po Valley", E: "Adriatic Sea", S: "Adriatic Sea", N: "Po Valley" },
  "Apennine Foothills": { N: "Po Valley", S: "Florence Hills", E: "Venetian Lagoon" },
  "Bay of Naples": { N: "Roman Campagna", S: "Tyrrhenian Sea", E: "Adriatic Sea", W: "Tyrrhenian Sea" },
  "Florence Hills": { N: "Po Valley", S: "Roman Campagna", W: "Po Valley" },
  "Po Valley": { N: "Bavarian Highlands", S: "Florence Hills", E: "Venetian Lagoon", W: "Languedoc" },
  
  // Mediterranean Seas
  "Western Mediterranean": { N: "Marseille Coast", S: "Tunisian Sahel", E: "Tyrrhenian Sea", W: "Strait of Gibraltar" },
  "Eastern Mediterranean": { N: "Aegean Sea", S: "Nile Delta", E: "Levantine Coast", W: "Tyrrhenian Sea" },
  "Tyrrhenian Sea": { N: "Roman Campagna", S: "Western Mediterranean", E: "Bay of Naples", W: "Marseille Coast" },
  "Adriatic Sea": { N: "Venetian Lagoon", S: "Athens Basin", E: "Dalmatian Coast", W: "Bay of Naples" },
  "Aegean Sea": { N: "Thracian Plain", S: "Eastern Mediterranean", E: "Anatolia", W: "Athens Basin" },

  // Germanic Lands
  "Rhine Valley": { N: "Hamburg Coast", S: "Black Forest", E: "Brandenburg Plain", W: "Rhine–Meuse Delta" },
  "Black Forest": { N: "Rhine Valley", S: "Bavarian Highlands", E: "Bavarian Highlands" },
  "Brandenburg Plain": { N: "Baltic Sea", S: "Saxon Uplands", E: "Dnieper River Valley", W: "Rhine Valley" },
  "Hamburg Coast": { N: "Jutland Peninsula", S: "Rhine Valley", E: "Baltic Sea", W: "North Sea" },
  "Bavarian Highlands": { N: "Black Forest", S: "Po Valley", E: "Vienna Basin", W: "Black Forest" },
  "Saxon Uplands": { N: "Brandenburg Plain", S: "Bavarian Highlands", E: "Bohemian Plateau", W: "Hamburg Coast"},
  "Baltic Sea": { N: "Stockholm Archipelago", S: "Brandenburg Plain", E: "St. Petersburg Outskirts", W: "Hamburg Coast" },

  // Central Europe
  "Danube Bend": { N: "Vienna Basin", S: "Carpathian Foothills", E: "Thracian Plain", W: "Bavarian Highlands" },
  "Bohemian Plateau": { N: "Brandenburg Plain", S: "Vienna Basin", E: "Moravian Gate" },
  "Carpathian Foothills": { N: "Danube Bend", S: "Vardar Valley", E: "Dnieper River Valley" },
  "Vienna Basin": { N: "Bohemian Plateau", S: "Danube Bend", E: "Danube Bend" },
  "Moravian Gate": { N: "Dnieper River Valley", S: "Vardar Valley", W: "Bohemian Plateau" },
  "Tatra Mountains": { N: "Novgorod Woods", S: "Carpathian Foothills", W: "Moravian Gate", E: "Danube Bend" },

  // Balkans
  "Dinaric Alps": { N: "Vienna Basin", S: "Pindus Mountains", E: "Vardar Valley" },
  "Bosporus": { N: "Thracian Plain", S: "Bosporus Straits", E: "Bosporus Straits" },
  "Pindus Mountains": { N: "Dinaric Alps", S: "Athens Basin", E: "Thracian Plain" },
  "Thracian Plain": { N: "Dnieper River Valley", S: "Bosporus", W: "Pindus Mountains", E: "Bosporus" },
  "Dalmatian Coast": { W: "Dinaric Alps", E: "Bosporus", N: "Vienna Basin" },
  "Vardar Valley": { N: "Dinaric Alps", S: "Pindus Mountains", W: "Dinaric Alps" , E: "Bosporus"},

  // Scandinavia
  "Stockholm Archipelago": { N: "Lapland", S: "Øresund Strait", W: "Norwegian Fjords", E: "Novgorod Woods" },
  "Norwegian Fjords": { S: "Jutland Peninsula", E: "Stockholm Archipelago", N: "LIMINAL_ARCTIC_OCEAN_TO_NORTH_AMERICA", W: "Edinburgh" },
  "Jutland Peninsula": { N: "Norwegian Fjords", S: "Hamburg Coast", E: "Øresund Strait" },
  "Lapland": { S: "Stockholm Archipelago", W: "Norwegian Fjords", E: "White Sea Coast", N: "LIMINAL_ARCTIC_OCEAN_TO_NORTH_AMERICA" },
  "Gotland": { W: "Stockholm Archipelago", E: "Novgorod Woods" },
  "Øresund Strait": { N: "Stockholm Archipelago", S: "Hamburg Coast", W: "Jutland Peninsula", E: "White Sea Coast" },

  // Eastern Europe
  "Moscow Basin": { N: "Novgorod Woods", S: "Volga Bend", E: "Caspian Foothills", W: "Stockholm Archipelago" },
  "Dnieper River Valley": { N: "Novgorod Woods", S: "Steppe Borderlands", E: "Volga Bend", W: "Brandenburg Plain" },
  "Volga Bend": { N: "Moscow Basin", S: "Steppe Borderlands", W: "Dnieper River Valley", E: "Caspian Depression" },
  "Carpathian Ridge": { N: "Tatra Mountains", S: "Thracian Plain", E: "Dnieper River Valley" },
  "Steppe Borderlands": { N: "Dnieper River Valley", S: "Tbilisi Valley", E: "Volga Bend", W: "Carpathian Ridge" },
  "Novgorod Woods": { S: "Moscow Basin", E: "Ural Mountains", W: "Stockholm Archipelago", N: "White Sea Coast" },
  
  // Ural and Arctic Europe
  "Ural Mountains": { N: "LIMINAL_ARCTIC_OCEAN_TO_ASIA", S: "Kazakh Steppes", E: "Western Siberia", W: "White Sea Coast" },
  "White Sea Coast": { N: "Lapland", S: "Novgorod Woods", E: "Ural Mountains", W: "Lapland" },

  // Low Countries
  "Rhine–Meuse Delta": { S: "Scheldt Basin", E: "Rhine Valley", W: "Thames Estuary" },
  "Flanders Fields": { N: "Rhine–Meuse Delta", S: "Ardennes Forest", E: "Brabant Highlands" },
  "Zuiderzee Coast": { S: "Rhine–Meuse Delta", E: "Rhine Valley", W: "LIMINAL_NORTH_SEA_TO_BRITAIN" },
  "Brabant Highlands": { N: "Rhine–Meuse Delta", S: "Ardennes Forest", W: "Flanders Fields" },
  "Ardennes Forest": { N: "Flanders Fields", S: "Paris Basin", E: "Brabant Highlands" },
  "Scheldt Basin": { N: "Rhine–Meuse Delta", S: "Paris Basin", E: "Flanders Fields", W: "Zuiderzee Coast" },

  // Greece and Aegean
  "Athens Basin": { N: "Thessalian Plain", S: "Peloponnesian Hills", E: "Delos Archipelago", W: "Bay of Naples" },
  "Peloponnesian Hills": { N: "Athens Basin", S: "Crete", E: "Cilician Plain" },
  "Crete": { N: "Peloponnesian Hills", E: "Cilician Plain", S: "Alexandria Coast" },
  "Delos Archipelago": { W: "Athens Basin", E: "Cilician Plain", N: "Thessalian Plain" },
  "Mount Olympus": { S: "Thessalian Plain", N: "Thracian Plain" },
  "Thessalian Plain": { N: "Mount Olympus", S: "Athens Basin", E: "Delos Archipelago" },

  // === CENTRAL ASIA & SIBERIA === 
  // Western Siberia
  "Western Siberia": { S: "Kazakh Steppes", E: "Central Siberia", W: "Ural Mountains", N: "LIMINAL_ARCTIC_OCEAN_TO_NORTH_AMERICA" },
  "Central Siberia": { S: "Altai Mountains", E: "Eastern Siberia", W: "Western Siberia", N: "Arctic Siberia" },
  "Eastern Siberia": { S: "Mongolian Steppes", E: "Kamchatka Peninsula", W: "Central Siberia", N: "Arctic Siberia" },
  "Arctic Siberia": { S: "Central Siberia", E: "Bering Strait", W: "Ural Mountains", N: "LIMINAL_ARCTIC_OCEAN_TO_NORTH_AMERICA" },
  "Kamchatka Peninsula": { S: "Sakhalin Island", W: "Eastern Siberia", E: "LIMINAL_BERING_SEA_TO_NORTH_AMERICA", N: "LIMINAL_ARCTIC_OCEAN_TO_NORTH_AMERICA" },

  // Kazakhstan and Central Asian Steppes
  "Kazakh Steppes": { N: "Western Siberia", S: "Aral Sea Basin", E: "Altai Mountains", W: "Volga Bend" },
  "Altai Mountains": { N: "Central Siberia", S: "Dzungarian Basin", E: "Mongolian Steppes", W: "Kazakh Steppes" },
  "Aral Sea Basin": { N: "Kazakh Steppes", S: "Kyzylkum Desert", E: "Tian Shan Range", W: "Caspian Depression" },
  "Tian Shan Range": { N: "Dzungarian Basin", S: "Ferghana Valley", E: "Tarim Basin", W: "Aral Sea Basin" },
  "Dzungarian Basin": { N: "Altai Mountains", S: "Tian Shan Range", E: "Mongolian Steppes", W: "Aral Sea Basin" },

  // Central Asian Oases and Deserts
  "Kyzylkum Desert": { N: "Aral Sea Basin", S: "Ferghana Valley", E: "Tian Shan Range", W: "Caspian Foothills" },
  "Ferghana Valley": { N: "Kyzylkum Desert", S: "Pamir Mountains", E: "Tarim Basin", W: "Samarkand Region" },
  "Samarkand Region": { N: "Kyzylkum Desert", S: "Balkh Plains", E: "Ferghana Valley", W: "Isfahan Basin" },
  "Balkh Plains": { N: "Samarkand Region", S: "Hindu Kush", E: "Pamir Mountains", W: "Harappa Basin" },
  "Pamir Mountains": { N: "Ferghana Valley", S: "Hindu Kush", E: "Tarim Basin", W: "Balkh Plains" },
  "Hindu Kush": { N: "Balkh Plains", S: "Kashmir Valley", E: "Pamir Mountains", W: "Harappa Basin" },

  // Western China - Xinjiang
  "Tarim Basin": { N: "Tian Shan Range", S: "Kunlun Mountains", E: "Gobi Desert", W: "Pamir Mountains" },
  "Kunlun Mountains": { N: "Tarim Basin", S: "Tibetan Plateau", E: "Qaidam Basin", W: "Pamir Mountains" },
  "Qaidam Basin": { N: "Gobi Desert", S: "Tibetan Plateau", E: "Loess Plateau", W: "Kunlun Mountains" },

  // Mongolia
  "Mongolian Steppes": { N: "Eastern Siberia", S: "Gobi Desert", E: "Manchurian Plain", W: "Altai Mountains" },
  "Gobi Desert": { N: "Mongolian Steppes", S: "Beijing Basin", E: "Manchurian Plain", W: "Qaidam Basin" },
  "Manchurian Plain": { N: "Eastern Siberia", S: "Baekdu Mountain Zone", E: "Sakhalin Island", W: "Gobi Desert" },

  // Far Eastern Islands
  "Sakhalin Island": { N: "Kamchatka Peninsula", S: "Tohoku Hills", W: "Manchurian Plain", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA" },

  // === EAST ASIA - CHINA ===
  // North China Plain
  "Yellow River Valley": { N: "Beijing Basin", S: "Shandong Peninsula", E: "Shandong Peninsula", W: "Loess Plateau" },
  "Shandong Peninsula": { N: "Beijing Basin", S: "Yangtze Gorges", W: "Yellow River Valley", E: "Yellow Sea" },
  "Loess Plateau": { N: "Gobi Desert", S: "Yangtze Gorges", E: "Yellow River Valley", W: "Tarim Basin" },
  "Beijing Basin": { N: "Manchurian Plain", S: "Yellow River Valley", E: "Yellow Sea", W: "Taihang Mountains" },
  "Taihang Mountains": { N: "Manchurian Plain", S: "Yellow River Valley", E: "Beijing Basin", W: "Loess Plateau" },
  "Hebei Plain": { N: "Manchurian Plain", S: "Shandong Peninsula", W: "Beijing Basin", E: "Yellow Sea" },

  // South China
  "Pearl River Delta": { N: "Yangtze Gorges", S: "Hainan Island", E: "Fujian Coast", W: "Guangxi Highlands" },
  "Fujian Coast": { N: "Yangtze Gorges", S: "Taiwan Strait", W: "Pearl River Delta", E: "Taiwan Strait" },
  "Guangxi Highlands": { N: "Sichuan Basin", S: "Red River Delta", E: "Pearl River Delta", W: "Yunnan Plateau" },
  "Yangtze Gorges": { N: "Sichuan Basin", S: "Pearl River Delta", E: "Fujian Coast", W: "Sichuan Basin" },
  "Hainan Island": { N: "Pearl River Delta", S: "LIMINAL_SOUTH_CHINA_SEA_TO_OCEANIA", E: "LIMINAL_SOUTH_CHINA_SEA_TO_OCEANIA", W: "Red River Delta" },
  "Wuyi Mountains": { N: "Yangtze Gorges", S: "Fujian Coast", E: "Fujian Coast", W: "Guangxi Highlands" },

  // West China and Tibet
  "Sichuan Basin": { N: "Qaidam Basin", S: "Yunnan Plateau", E: "Yangtze Gorges", W: "Tibetan Plateau" },
  "Yunnan Plateau": { N: "Sichuan Basin", S: "Shan Plateau", E: "Guangxi Highlands", W: "Tibetan Plateau" },
  "Tibetan Plateau": { N: "Kunlun Mountains", S: "Himalayan Slopes", E: "Sichuan Basin", W: "Kailash Region" },
  "Himalayan Slopes": { N: "Tibetan Plateau", S: "Kashmir Valley", E: "Yunnan Plateau", W: "Kailash Region" },
  "Kailash Region": { N: "Kunlun Mountains", S: "Kashmir Valley", E: "Tibetan Plateau", W: "Pamir Mountains" },
  "Eastern Plateau Slopes": { N: "Tibetan Plateau", S: "Naga Hills", E: "Sichuan Basin", W: "Himalayan Slopes" },

  // === EAST ASIA - JAPAN ===
  "Kyoto Basin": { N: "Tohoku Hills", S: "Nara Uplands", E: "Edo Plain", W: "Sea of Japan" },
  "Edo Plain": { N: "Tohoku Hills", S: "Mount Fuji Region", W: "Kyoto Basin", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA" },
  "Inland Sea Coast": { N: "Tohoku Hills", S: "Nara Uplands", E: "Kyoto Basin", W: "East China Sea" },
  "Mount Fuji Region": { N: "Edo Plain", S: "Nara Uplands", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA", W: "Inland Sea Coast" },
  "Tohoku Hills": { N: "Sakhalin Island", S: "Kyoto Basin", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA", W: "Sea of Japan" },
  "Nara Uplands": { N: "Kyoto Basin", S: "Ryukyu Islands", E: "Mount Fuji Region", W: "Inland Sea Coast" },

  // === EAST ASIA - KOREA ===
  "Han River Valley": { N: "Baekdu Mountain Zone", S: "Busan Coast", E: "Sea of Japan", W: "Yellow Sea" },
  "Kaesong Foothills": { N: "Baekdu Mountain Zone", S: "Gyeongju Basin", E: "Han River Valley", W: "Manchurian Plain" },
  "Gyeongju Basin": { N: "Kaesong Foothills", S: "Jeolla Highlands", E: "Busan Coast", W: "Yellow Sea" },
  "Jeolla Highlands": { N: "Gyeongju Basin", S: "Busan Coast", E: "Busan Coast", W: "Yellow Sea" },
  "Baekdu Mountain Zone": { N: "Manchurian Plain", S: "Han River Valley", E: "Sea of Japan", W: "Beijing Basin" },
  "Busan Coast": { N: "Han River Valley", S: "Sea of Japan", E: "Sea of Japan", W: "Yellow Sea" },
  
  // === ASIAN SEAS ===
  "Yellow Sea": { N: "Beijing Basin", S: "East China Sea", E: "Han River Valley", W: "Shandong Peninsula" },
  "Sea of Japan": { N: "Sakhalin Island", S: "Kyoto Basin", E: "LIMINAL_PACIFIC_TO_AMERICAS", W: "Han River Valley" },
  "East China Sea": { N: "Yellow Sea", S: "South China Sea", E: "Kyoto Basin", W: "Yangtze Delta" },
  "South China Sea": { N: "East China Sea", S: "Java Sea", E: "Manila Bay", W: "Pearl River Delta" },
  "Bay of Bengal": { N: "Bengal Delta", S: "LIMINAL_INDIAN_OCEAN_TO_ASIA", E: "Strait of Malacca", W: "Malabar Coast" },

  // === EAST ASIA - TAIWAN AND RYUKYU ===
  "Central Mountains": { N: "Taipei Basin", S: "Kenting Peninsula", E: "East Coast Rift", W: "Taiwan Strait" },
  "Taipei Basin": { S: "Central Mountains", E: "East Coast Rift", W: "Taiwan Strait", N: "Ryukyu Islands" },
  "East Coast Rift": { N: "Taipei Basin", S: "Taitung Highlands", W: "Central Mountains", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA" },
  "Ryukyu Islands": { N: "Tohoku Hills", S: "Taipei Basin", E: "LIMINAL_PACIFIC_TO_OCEANIA", W: "Fujian Coast" },
  "Kenting Peninsula": { N: "Central Mountains", S: "LIMINAL_SOUTH_CHINA_SEA_TO_OCEANIA", E: "Taitung Highlands", W: "Taiwan Strait" },
  "Taitung Highlands": { N: "East Coast Rift", S: "LIMINAL_SOUTH_CHINA_SEA_TO_OCEANIA", W: "Kenting Peninsula", E: "LIMINAL_PACIFIC_TO_OCEANIA" },

  // === SOUTHEAST ASIA ===
  // Indochina Interior
  "Shan Plateau": { N: "Yunnan Plateau", S: "Tenasserim Coast", E: "Annamite Cordillera", W: "Irrawaddy Valley" },
  "Annamite Cordillera": { N: "Yunnan Plateau", S: "Mekong River Basin", E: "Red River Delta", W: "Shan Plateau" },
  
  // Mainland Southeast Asia
  "Irrawaddy Valley": { N: "Shan Plateau", S: "Tenasserim Coast", E: "Mekong Delta", W: "Bengal Delta" },
  "Mekong Delta": { N: "Annamite Cordillera", S: "Malay Peninsula", E: "Red River Delta", W: "Irrawaddy Valley" },
  "Red River Delta": { N: "Annamite Cordillera", S: "Hainan Island", E: "Hainan Island", W: "Mekong Delta" },
  "Annam Highlands": { N: "Red River Delta", S: "Mekong River Basin", E: "LIMINAL_SOUTH_CHINA_SEA_TO_OCEANIA", W: "Mekong Delta" },
  "Mekong River Basin": { N: "Annamite Cordillera", S: "Malay Peninsula", E: "LIMINAL_SOUTH_CHINA_SEA_TO_OCEANIA", W: "Mekong Delta" },
  "Tenasserim Coast": { N: "Irrawaddy Valley", S: "Malay Peninsula", E: "Mekong River Basin", W: "Bengal Delta" },
  "Malay Peninsula": { N: "Mekong River Basin", S: "Strait of Malacca", E: "LIMINAL_SOUTH_CHINA_SEA_TO_OCEANIA", W: "Tenasserim Coast" },

  // Maritime Southeast Asia
  "Strait of Malacca": { N: "Malay Peninsula", S: "Sumatra Highlands", E: "Borneo", W: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA" },
  "Sumatra Highlands": { N: "Strait of Malacca", S: "Sunda Strait", E: "Java Sea", W: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA" },
  "Java Sea": { N: "Borneo", S: "Central Java", E: "Makassar Strait", W: "Sumatra Highlands" },
  "Central Java": { N: "Java Sea", S: "LIMINAL_INDIAN_OCEAN_TO_OCEANIA", E: "Makassar Strait", W: "Sunda Strait" },
  "Sunda Strait": { N: "Sumatra Highlands", S: "LIMINAL_INDIAN_OCEAN_TO_OCEANIA", E: "Central Java", W: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA" },
  "Borneo": { N: "South China Sea", S: "Java Sea", E: "Celebes Sea", W: "Strait of Malacca" },
  "Makassar Strait": { N: "Celebes Sea", S: "Timor Sea", E: "Spice Islands", W: "Borneo" },
  "Spice Islands": { N: "Celebes Sea", S: "Banda Sea", E: "Sepik River Basin", W: "Makassar Strait" },
  "Celebes Sea": { S: "Makassar Strait", E: "Spice Islands", W: "Borneo", N: "Mindanao" },
  "Banda Sea": { N: "Spice Islands", S: "Timor Sea", E: "Torres Strait", W: "Makassar Strait" },
  "Timor Sea": { N: "Banda Sea", S: "Kimberley", E: "Torres Strait", W: "Central Java" },

  // Philippines
  // Philippines (detailed)
  "Luzon Highlands": { N: "Taiwan Strait", S: "Visayan Sea", E: "Philippine Sea", W: "South China Sea" },
  "Visayan Sea": { N: "Luzon Highlands", S: "Mindanao", E: "Philippine Sea", W: "Palawan" },
  "Mindanao": { N: "Visayan Sea", S: "Celebes Sea", E: "Philippine Sea", W: "Sulu Sea" },
  "Philippine Sea": { W: "Luzon Highlands", E: "LIMINAL_PACIFIC_TO_OCEANIA", N: "Ryukyu Islands", S: "Palau" },
  "Palawan": { E: "Visayan Sea", W: "South China Sea", S: "Sulu Sea", N: "Luzon Highlands" },
  "Sulu Sea": { N: "Palawan", S: "Celebes Sea", E: "Mindanao", W: "South China Sea" },
  
  // Taiwan and East China Sea
  "Taiwan Strait": { S: "Luzon Highlands", N: "Fujian Coast", E: "Ryukyu Islands", W: "Pearl River Delta" },


  // === NORTH AMERICA ===
  // Pacific Coast
  "Columbia River Valley": { N: "Puget Sound", S: "Cascade Range", E: "Snake River Plain", W: "LIMINAL_PACIFIC_TO_EAST_ASIA" },
  "Puget Sound": { S: "Columbia River Valley", E: "Glacier Foothills", N: "Yukon River Valley", W: "LIMINAL_PACIFIC_TO_EAST_ASIA" },
  "Olympic Peninsula": { E: "Puget Sound", S: "Columbia River Valley", W: "LIMINAL_PACIFIC_TO_EAST_ASIA" },
  "Redwood Coast": { N: "Columbia River Valley", S: "Pacific Coast Ranges", E: "Cascade Range", W: "LIMINAL_PACIFIC_TO_EAST_ASIA" },
  
  // Northern California
  "Cascade Range": { N: "Columbia River Valley", S: "Shasta Region", E: "Great Basin", W: "Redwood Coast" },
  "Shasta Region": { N: "Cascade Range", S: "Sacramento Valley", E: "Great Basin", W: "Pacific Coast Ranges" },
  "Sacramento Valley": { N: "Shasta Region", S: "San Francisco Bay", E: "Sierra Nevada", W: "Pacific Coast Ranges" },
  "Sierra Nevada": { N: "Shasta Region", S: "Central Valley", E: "Great Basin", W: "Sacramento Valley" },
  "Pacific Coast Ranges": { N: "Redwood Coast", S: "San Francisco Bay", E: "Sacramento Valley", W: "LIMINAL_PACIFIC_TO_EAST_ASIA" },
  
  // Central California Coast
  "San Francisco Bay": { N: "Sacramento Valley", S: "Monterey Bay", E: "Central Valley", W: "Pacific Coast Ranges" },
  "Monterey Bay": { N: "San Francisco Bay", S: "Big Sur Coast", E: "Santa Cruz Mountains", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  "Santa Cruz Mountains": { N: "San Francisco Bay", S: "Salinas Valley", E: "Central Valley", W: "Monterey Bay" },
  "Salinas Valley": { N: "Santa Cruz Mountains", S: "San Luis Obispo", E: "Central Valley", W: "Big Sur Coast" },
  "Big Sur Coast": { N: "Monterey Bay", S: "San Luis Obispo", E: "Salinas Valley", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  "Central Valley": { N: "Sacramento Valley", S: "San Luis Obispo", E: "Sierra Nevada", W: "Santa Cruz Mountains" },
  "San Luis Obispo": { N: "Salinas Valley", S: "Santa Barbara Channel", E: "Mojave Desert", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  
  // Southern California
  "Santa Barbara Channel": { N: "San Luis Obispo", S: "Los Angeles Basin", E: "Mojave Desert", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  "Los Angeles Basin": { N: "Santa Barbara Channel", S: "San Diego Bay", E: "Mojave Desert", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  "San Diego Bay": { N: "Los Angeles Basin", S: "Baja California", E: "Sonoran Desert", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  "Mojave Desert": { N: "Central Valley", S: "Sonoran Desert", E: "Colorado Plateau", W: "Los Angeles Basin" },
  "Channel Islands": { E: "Los Angeles Basin", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  "Baja California": { N: "San Diego Bay", S: "Sinaloa Coast", E: "Sonoran Desert", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  "Sinaloa Coast": { N: "Baja California", S: "Valley of Mexico", E: "Chihuahuan Desert", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  "Great Basin": { W: "Sierra Nevada", S: "Mojave Desert", E: "Colorado Plateau", N: "Snake River Plain" },

  // Southwest
  "Sonoran Desert": { E: "Colorado Plateau", W: "San Diego Bay", N: "Mojave Desert", S: "Valley of Mexico" },
  "Chaco Canyon": { N: "Colorado Plateau", S: "Rio Grande Valley", E: "Black Hills" },
  "Rio Grande Valley": { N: "Chaco Canyon", S: "Valley of Mexico", E: "Tallgrass Prairie", W: "Colorado Plateau" },
  "Colorado Plateau": { S: "Rio Grande Valley", W: "Sonoran Desert", E: "Black Hills", N: "Yellowstone Basin" },
  "Ancestral Puebloan Lands": { N: "Colorado Plateau", S: "Rio Grande Valley", E: "Chaco Canyon" },
  "Mogollon Rim": { N: "Colorado Plateau", S: "Sonoran Desert", E: "Rio Grande Valley" },

  // Great Plains
  "Black Hills": { N: "Glacier Foothills", S: "Platte River Basin", E: "Tallgrass Prairie", W: "Colorado Plateau" },
  "Platte River Basin": { N: "Black Hills", S: "Flint Hills", E: "Tallgrass Prairie", W: "Snake River Plain" },
  "Flint Hills": { N: "Platte River Basin", S: "Cahokia Mounds", E: "Tallgrass Prairie", W: "Platte River Basin" },
  "Badlands": { S: "Black Hills", E: "Tallgrass Prairie", W: "Yellowstone Basin" },
  "Tallgrass Prairie": { N: "Black Hills", S: "Cahokia Mounds", W: "Platte River Basin", E: "Illinois River Valley" },
  "Missouri Breaks": { S: "Black Hills", E: "Tallgrass Prairie", W: "Glacier Foothills" },

  // Mississippi Valley
  "Cahokia Mounds": { N: "Great Lakes Shoreline", S: "Lower Mississippi Delta", E: "Illinois River Valley", W: "Tallgrass Prairie" },
  "Lower Mississippi Delta": { N: "Cahokia Mounds", S: "Gulf of Mexico", E: "Mississippi Bayou", W: "Rio Grande Valley" },
  "Ozark Plateau": { N: "Cahokia Mounds", S: "Natchez Bluffs", E: "Illinois River Valley" },
  "Natchez Bluffs": { N: "Ozark Plateau", S: "Lower Mississippi Delta", E: "Mississippi Bayou" },
  "Illinois River Valley": { N: "Great Lakes Shoreline", S: "Ozark Plateau", W: "Cahokia Mounds", E: "Hudson River Valley" },
  "Driftless Area": { S: "Illinois River Valley", E: "Great Lakes Shoreline", W: "Tallgrass Prairie" },

  // Northeast Woodlands
  "Hudson River Valley": { N: "Adirondacks", S: "Chesapeake Bay", E: "Cape Cod", W: "Finger Lakes" },
  "Great Lakes Shoreline": { S: "Finger Lakes", E: "Hudson River Valley", W: "Cahokia Mounds", N: "Hudson Bay Lowlands" },
  "Adirondacks": { S: "Hudson River Valley", E: "Champlain Valley", W: "Great Lakes Shoreline" },
  "Finger Lakes": { N: "Great Lakes Shoreline", S: "Hudson River Valley", E: "Hudson River Valley", W: "Great Lakes Shoreline" },
  "Champlain Valley": { S: "Hudson River Valley", W: "Adirondacks", N: "Labrador Coast" },
  "Mohawk River": { S: "Hudson River Valley", E: "Champlain Valley", W: "Finger Lakes" },

  // Southeast
  "Smoky Mountains": { N: "Hudson River Valley", S: "Piedmont Uplands", E: "Chesapeake Bay", W: "Cahokia Mounds" },
  "Okefenokee Swamp": { N: "Piedmont Uplands", S: "Everglades", E: "Outer Banks" },
  "Piedmont Uplands": { N: "Smoky Mountains", S: "Okefenokee Swamp", E: "Tidewater Region", W: "Ozark Plateau" },
  "Everglades": { N: "Okefenokee Swamp", E: "Outer Banks", W: "Mississippi Bayou", S: "Gulf of Mexico" },
  "Mississippi Bayou": { N: "Lower Mississippi Delta", S: "Gulf of Mexico", E: "Everglades", W: "Gulf of Mexico" },
  "Blue Ridge Foothills": { N: "Smoky Mountains", S: "Smoky Mountains", E: "Chesapeake Bay" },

  // Arctic and Subarctic
  "Hudson Bay": { N: "LIMINAL_ARCTIC_OCEAN_TO_NORTH_AMERICA", S: "Hudson Bay Lowlands", E: "Labrador Coast", W: "Saskatchewan Prairie" },
  "Hudson Bay Lowlands": { N: "Hudson Bay", S: "Great Lakes Shoreline", E: "Labrador Coast", W: "Yukon River Valley" },
  "Bering Strait": { E: "Yukon River Valley", W: "Arctic Siberia" },
  "Yukon River Valley": { S: "Puget Sound", E: "Hudson Bay Lowlands", W: "Bering Strait", N: "LIMINAL_ARCTIC_OCEAN_TO_ASIA" },
  "Labrador Coast": { S: "Champlain Valley", W: "Hudson Bay Lowlands", E: "LIMINAL_NORTH_ATLANTIC_TO_EUROPE", N: "LIMINAL_ARCTIC_OCEAN_TO_EUROPE" },
  "Mackenzie Delta": { S: "Hudson Bay Lowlands", E: "Hudson Bay Lowlands", W: "Yukon River Valley", N: "LIMINAL_ARCTIC_OCEAN_TO_ASIA" },
  "Aleutian Islands": { E: "Bering Strait", W: "LIMINAL_PACIFIC_TO_OCEANIA" },

  // Mexico and Central Highlands
  "Valley of Mexico": { N: "Rio Grande Valley", S: "Oaxaca Highlands", E: "Yucatán Peninsula", W: "Sierra Madre Oriental" },
  "Oaxaca Highlands": { N: "Valley of Mexico", S: "Isthmus of Tehuantepec", E: "Yucatán Peninsula" },
  "Yucatán Peninsula": { N: "Valley of Mexico", S: "Mayan Lowlands", W: "Oaxaca Highlands", E: "Greater Antilles" },
  "Sierra Madre Oriental": { E: "Valley of Mexico", S: "Oaxaca Highlands", W: "Baja California" },
  "Isthmus of Tehuantepec": { N: "Oaxaca Highlands", S: "Mayan Lowlands" },
  "Lake Texcoco Basin": { N: "Valley of Mexico", S: "Oaxaca Highlands" },
  
  // Central America
  "Mayan Lowlands": { N: "Yucatán Peninsula", S: "Panama Isthmus", E: "Greater Antilles", W: "Isthmus of Tehuantepec" },
  "Mosquito Coast": { W: "Mayan Lowlands", E: "Lesser Antilles", S: "Panama Isthmus", N: "Greater Antilles" },
  "Panama Isthmus": { N: "Caribbean Sea", S: "Darien Swamp", E: "Caribbean Sea", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  "Darien Swamp": { N: "Panama Isthmus", S: "Quito Plateau", E: "Caribbean Sea", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  
  // The Caribbean
  "Greater Antilles": { W: "Caribbean Sea", S: "Lesser Antilles", E: "LIMINAL_ATLANTIC_TO_EUROPE", N: "Gulf of Mexico" },
  "Lesser Antilles": { N: "Greater Antilles", W: "Caribbean Sea", S: "Orinoco Delta", E: "LIMINAL_ATLANTIC_TO_AFRICA" },
  
  // === AMERICAN WATERS ===
  "Gulf of Mexico": { N: "Mississippi Bayou", S: "Caribbean Sea", E: "Everglades", W: "Gulf Coast Texas" },
  "Caribbean Sea": { N: "Gulf of Mexico", S: "Panama Isthmus", E: "LIMINAL_ATLANTIC_TO_EUROPE", W: "Valley of Mexico" },

  // Northern Rockies
  "Bitterroot Range": { N: "Glacier Foothills", S: "Yellowstone Basin", E: "Black Hills", W: "Columbia River Valley" },
  "Yellowstone Basin": { N: "Bitterroot Range", S: "Snake River Plain", E: "Black Hills" },
  "Snake River Plain": { N: "Yellowstone Basin", S: "Colorado Plateau", W: "Columbia River Valley", E: "Platte River Basin" },
  "Glacier Foothills": { S: "Bitterroot Range", N: "Yukon River Valley", W: "Puget Sound" },
  "Salmon River Canyons": { N: "Bitterroot Range", S: "Snake River Plain", E: "Yellowstone Basin" },
  "Absaroka Range": { S: "Yellowstone Basin", E: "Black Hills", W: "Bitterroot Range" },

  // Atlantic Coast
  "Chesapeake Bay": { N: "Delaware River Valley", S: "Tidewater Region", E: "LIMINAL_ATLANTIC_TO_EUROPE", W: "Smoky Mountains" },
  "Cape Cod": { S: "Delaware River Valley", W: "Hudson River Valley", E: "LIMINAL_ATLANTIC_TO_EUROPE" },
  "Pine Barrens": { N: "Delaware River Valley", S: "Chesapeake Bay", E: "LIMINAL_ATLANTIC_TO_EUROPE" },
  "Outer Banks": { N: "Chesapeake Bay", S: "Everglades", E: "LIMINAL_ATLANTIC_TO_EUROPE" },
  "Delaware River Valley": { N: "Cape Cod", S: "Pine Barrens", W: "Hudson River Valley", E: "LIMINAL_ATLANTIC_TO_EUROPE" },
  "Tidewater Region": { N: "Chesapeake Bay", S: "Virginia", E: "LIMINAL_ATLANTIC_TO_EUROPE", W: "Virginia" },
  "Virginia": { N: "Chesapeake Bay", S: "Okefenokee Swamp", E: "Tidewater Region" },

  // === SOUTH AMERICA ===
  // Andes North
  "Quito Plateau": { N: "Darien Swamp", S: "Cajamarca Highlands", E: "Manaus Region" },
  "Cajamarca Highlands": { N: "Quito Plateau", S: "Lake Titicaca Basin", E: "Manaus Region" },
  "Lake Titicaca Basin": { N: "Cajamarca Highlands", S: "Cuzco Valley", E: "Manaus Region", W: "Chimborazo Slopes" },
  "Chimborazo Slopes": { E: "Lake Titicaca Basin", S: "Cordillera Blanca", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  "Cordillera Blanca": { N: "Chimborazo Slopes", S: "Altiplano", E: "Acre Rainforest" },
  "Chachapoyas Forest": { W: "Cajamarca Highlands", E: "Manaus Region", S: "Acre Rainforest" },

  // Andes South
  "Cuzco Valley": { N: "Lake Titicaca Basin", S: "Altiplano", E: "Acre Rainforest" },
  "Altiplano": { N: "Cuzco Valley", S: "Potosí Region", E: "Gran Chaco", W: "Atacama Desert" },
  "Atacama Desert": { E: "Altiplano", S: "Mendoza Foothills", W: "LIMINAL_PACIFIC_TO_OCEANIA" },
  "Mendoza Foothills": { N: "Atacama Desert", S: "Mapuche Territory", E: "Pampas Grasslands" },
  "Aconcagua Range": { N: "Atacama Desert", S: "Mendoza Foothills", E: "Pampas Grasslands" },
  "Mapuche Territory": { N: "Mendoza Foothills", S: "Andean Foothills", E: "Pampas Grasslands" },

  // Amazon Basin
  "Manaus Region": { N: "Orinoco Delta", S: "Acre Rainforest", E: "Rio Negro Junction", W: "Cajamarca Highlands" },
  "Rio Negro Junction": { W: "Manaus Region", S: "Tapajós Basin", E: "Xingu Headwaters" },
  "Xingu Headwaters": { W: "Rio Negro Junction", S: "Tapajós Basin", E: "Bahia Coast" },
  "Acre Rainforest": { N: "Manaus Region", S: "Yungas Slopes", W: "Cuzco Valley" },
  "Varzea Floodplains": { N: "Rio Negro Junction", S: "Tapajós Basin", E: "São Paulo Plateau" },
  "Tapajós Basin": { N: "Rio Negro Junction", S: "Santa Cruz Lowlands", W: "Acre Rainforest", E: "Xingu Headwaters" },

  // Gran Chaco and Pampas
  "Pampas Grasslands": { N: "Gran Chaco", S: "Valdés Peninsula", E: "Paraná Delta", W: "Mendoza Foothills" },
  "Paraná Delta": { N: "Santa Fe Floodplain", S: "Uruguay River Valley", W: "Pampas Grasslands", E: "Rio de Janeiro Bay" },
  "Santa Fe Floodplain": { S: "Paraná Delta", E: "São Paulo Plateau", W: "Gran Chaco" },
  "Gran Chaco": { N: "Tapajós Basin", S: "Córdoba Hills", E: "Santa Fe Floodplain", W: "Altiplano" },
  "Pantanal": { N: "Tapajós Basin", S: "Gran Chaco", E: "Santa Fe Floodplain", W: "Yungas Slopes" },
  "Córdoba Hills": { N: "Gran Chaco", S: "Pampas Grasslands", E: "Paraná Delta" },
  "Uruguay River Valley": { N: "Paraná Delta", S: "Valdés Peninsula", W: "Pampas Grasslands", E: "Rio de Janeiro Bay" },

  // Atlantic Coast
  "Rio de Janeiro Bay": { N: "São Paulo Plateau", S: "Espírito Santo Shore", E: "LIMINAL_ATLANTIC_TO_AFRICA", W: "São Paulo Plateau" },
  "Bahia Coast": { N: "Espírito Santo Shore", S: "Recôncavo Basin", E: "LIMINAL_ATLANTIC_TO_AFRICA" },
  "Pernambuco Highlands": { S: "Bahia Coast", E: "LIMINAL_ATLANTIC_TO_AFRICA", W: "Xingu Headwaters" },
  "São Paulo Plateau": { N: "Varzea Floodplains", S: "Rio de Janeiro Bay", E: "Rio de Janeiro Bay", W: "Santa Fe Floodplain" },
  "Recôncavo Basin": { N: "Bahia Coast", S: "LIMINAL_ATLANTIC_TO_AFRICA", E: "LIMINAL_ATLANTIC_TO_AFRICA" },
  "Espírito Santo Shore": { N: "Pernambuco Highlands", S: "Rio de Janeiro Bay", E: "LIMINAL_ATLANTIC_TO_AFRICA" },

  // Guiana Shield
  "Orinoco Delta": { S: "Guiana Highlands", E: "LIMINAL_ATLANTIC_TO_AFRICA", W: "Apure Plains" },
  "Guiana Highlands": { N: "Orinoco Delta", S: "Manaus Region", E: "Essequibo Valley" },
  "Essequibo Valley": { W: "Guiana Highlands", S: "Manaus Region", E: "Maroni Basin" },
  "Maroni Basin": { W: "Essequibo Valley", S: "Xingu Headwaters", E: "LIMINAL_ATLANTIC_TO_AFRICA" },
  "Rupununi Savannah": { N: "Guiana Highlands", S: "Manaus Region", E: "Essequibo Valley" },
  "Kaieteur Plateau": { N: "Guiana Highlands", S: "Manaus Region", W: "Guiana Highlands" },

  // Patagonia
  "Valdés Peninsula": { N: "Pampas Grasslands", S: "Magellanic Steppe", E: "LIMINAL_ATLANTIC_TO_AFRICA" },
  "Andean Foothills": { N: "Mapuche Territory", S: "Southern Ice Fields", E: "Magellanic Steppe" },
  "Magellanic Steppe": { N: "Valdés Peninsula", S: "Tierra del Fuego", W: "Andean Foothills", E: "LIMINAL_ATLANTIC_TO_AFRICA" },
  "Tierra del Fuego": { N: "Magellanic Steppe", W: "Strait of Magellan", E: "LIMINAL_ATLANTIC_TO_AFRICA" },
  "Strait of Magellan": { E: "Tierra del Fuego", W: "LIMINAL_PACIFIC_TO_OCEANIA", N: "Southern Ice Fields" },
  "Southern Ice Fields": { N: "Andean Foothills", S: "Strait of Magellan", E: "Magellanic Steppe" },

  // Southern Highlands
  "Potosí Region": { N: "Altiplano", S: "Sucre Uplands", E: "Gran Chaco" },
  "Tarija Valley": { N: "Sucre Uplands", S: "Gran Chaco", E: "Gran Chaco" },
  "Cochabamba Basin": { N: "Potosí Region", S: "Santa Cruz Lowlands", E: "Tapajós Basin" },
  "Santa Cruz Lowlands": { N: "Cochabamba Basin", S: "Gran Chaco", E: "Tapajós Basin" },
  "Sucre Uplands": { N: "Potosí Region", S: "Tarija Valley", E: "Gran Chaco" },
  "Yungas Slopes": { N: "Cochabamba Basin", S: "Santa Cruz Lowlands", W: "Altiplano", E: "Acre Rainforest" },

  // Llanos and Orinoco
  "Apure Plains": { N: "Orinoco Delta", S: "Meta River Basin", E: "Orinoco Delta" },
  "Meta River Basin": { N: "Apure Plains", S: "Villavicencio Foothills", E: "Llanos Floodplain" },
  "Llanos Floodplain": { N: "Orinoco Delta", S: "Orinoco Rapids", W: "Meta River Basin", E: "Guiana Highlands" },
  "Villavicencio Foothills": { N: "Meta River Basin", S: "Quito Plateau", E: "Arauca Borderlands" },
  "Arauca Borderlands": { W: "Villavicencio Foothills", E: "Llanos Floodplain", S: "Orinoco Rapids" },
  "Orinoco Rapids": { N: "Llanos Floodplain", S: "Manaus Region", W: "Arauca Borderlands" },

  // === MENA ===
  // Nile Valley
  "Thebes Valley": { N: "Aswan Cataracts", S: "Nubian Desert", E: "Eastern Desert Wadis", W: "Faiyum Oasis" },
  "Nile Delta": { S: "Alexandria Coast", E: "Jerusalem Hills", W: "Alexandria Coast" },
  "Aswan Cataracts": { S: "Thebes Valley", E: "Eastern Desert Wadis", N: "Nubian Desert" },
  "Faiyum Oasis": { E: "Thebes Valley", N: "Alexandria Coast", S: "Eastern Desert Wadis" },
  "Eastern Desert Wadis": { W: "Thebes Valley", E: "Red Sea Coast", N: "Alexandria Coast" },
  "Alexandria Coast": { N: "Nile Delta", S: "Faiyum Oasis", E: "Jerusalem Hills", W: "Tripolitania" },
  
  // Nubian Corridor
  "Nubian Desert": { N: "Thebes Valley", S: "Bayuda Desert", E: "Eastern Desert Highlands", W: "Saharan Heart" },
  "Bayuda Desert": { N: "Nubian Desert", S: "Ethiopian Highlands", E: "Ethiopian Highlands", W: "Lake Chad" },

  // Levant
  "Jerusalem Hills": { N: "Galilee Basin", S: "Dead Sea Shore", E: "Tigris–Euphrates Confluence", W: "Alexandria Coast" },
  "Bekaa Valley": { S: "Jerusalem Hills", E: "Nineveh Plain", N: "Mount Lebanon Range" },
  "Dead Sea Shore": { N: "Jerusalem Hills", S: "Najd Plateau", E: "Babylon Region" },
  "Golan Heights": { S: "Galilee Basin", E: "Nineveh Plain", W: "Mount Lebanon Range", N: "Mount Lebanon Range" },
  "Galilee Basin": { N: "Golan Heights", S: "Jerusalem Hills", E: "Tigris–Euphrates Confluence", W: "Mount Lebanon Range" },
  "Mount Lebanon Range": { S: "Bekaa Valley", E: "Golan Heights", W: "Cilician Plain", N: "Cilician Plain" },

  // Anatolia
  "Cappadocian Highlands": { N: "Central Plateau", S: "Cilician Plain", E: "Tbilisi Valley", W: "Bosporus Straits" },
  "Pontic Coast": { S: "Central Plateau", E: "Tbilisi Valley", W: "Bosporus Straits", N: "LIMINAL_BLACK_SEA_TO_EUROPE" },
  "Cilician Plain": { N: "Cappadocian Highlands", S: "Mount Lebanon Range", E: "Nineveh Plain" },
  "Tarsus Foothills": { N: "Cappadocian Highlands", S: "Cilician Plain", E: "Zagros Foothills" },
  "Central Plateau": { N: "Pontic Coast", S: "Cappadocian Highlands", E: "Tbilisi Valley", W: "Bosporus Straits" },
  "Bosporus Straits": { E: "Central Plateau", W: "Bosporus", S: "Cilician Plain" },

  // Mesopotamia
  "Tigris–Euphrates Confluence": { N: "Nineveh Plain", S: "Marsh Arab Wetlands", E: "Isfahan Basin", W: "Jerusalem Hills" },
  "Nineveh Plain": { S: "Tigris–Euphrates Confluence", E: "Zagros Foothills", W: "Cilician Plain" },
  "Marsh Arab Wetlands": { N: "Tigris–Euphrates Confluence", S: "Najd Plateau", E: "Shiraz Valley" },
  "Babylon Region": { N: "Tigris–Euphrates Confluence", S: "Marsh Arab Wetlands", E: "Diyala Valley" },
  "Zagros Foothills": { W: "Nineveh Plain", S: "Diyala Valley", E: "Zagros Highlands" },
  "Diyala Valley": { N: "Zagros Foothills", W: "Babylon Region", S: "Isfahan Basin" },

  // Maghreb
  "Atlas Mountains": { N: "Fez Plateau", S: "Timbuktu Basin", E: "Tripolitania", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "Fez Plateau": { S: "Atlas Mountains", E: "Tunisian Sahel", W: "Rif Coast", N: "Rif Coast" },
  "Tunisian Sahel": { W: "Fez Plateau", E: "Bay of Naples", S: "Tripolitania" },
  "Rif Coast": { E: "Fez Plateau", N: "Strait of Gibraltar", S: "Atlas Mountains", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "Draa Valley": { N: "Atlas Mountains", S: "Timbuktu Basin", E: "Timbuktu Basin" },
  "Tripolitania": { N: "Tunisian Sahel", S: "Lake Chad", W: "Atlas Mountains", E: "Alexandria Coast" },

  // Arabian Peninsula
  "Hijaz Mountains": { N: "Dead Sea Shore", S: "Najd Plateau", E: "Najd Plateau", W: "Red Sea Coast" },
  "Empty Quarter": { N: "Najd Plateau", S: "Dhofar Hills", E: "Isfahan Basin", W: "Najd Plateau" },
  "Hadhramaut Valley": { N: "Empty Quarter", S: "LIMINAL_ARABIAN_SEA_TO_SOUTH_ASIA", E: "Shiraz Valley" },
  "Dhofar Hills": { N: "Empty Quarter", E: "Shiraz Valley", W: "Hadhramaut Valley" },
  "Najd Plateau": { N: "Hijaz Mountains", S: "Empty Quarter", E: "Marsh Arab Wetlands", W: "Hijaz Mountains" },
  "Red Sea Coast": { E: "Hijaz Mountains", N: "Eastern Desert Wadis", S: "Red Sea Shore" },

  // Persian Plateau
  "Isfahan Basin": { N: "Caspian Foothills", S: "Shiraz Valley", E: "Harappa Basin", W: "Tigris–Euphrates Confluence" },
  "Zagros Highlands": { N: "Caspian Foothills", S: "Shiraz Valley", W: "Zagros Foothills", E: "Isfahan Basin" },
  "Caspian Foothills": { S: "Isfahan Basin", E: "Harappa Basin", W: "Tbilisi Valley", N: "Volga Bend" },
  "Dasht-e Kavir": { W: "Isfahan Basin", S: "Shiraz Valley", E: "Harappa Basin" },
  "Shiraz Valley": { N: "Isfahan Basin", E: "Harappa Basin", W: "Zagros Highlands" },
  "Alborz Mountains": { S: "Caspian Foothills", E: "Harappa Basin", W: "Tbilisi Valley" },

  // Caucasus
  "Tbilisi Valley": { N: "Chechen Highlands", S: "Mount Ararat", E: "Caspian Depression", W: "Black Sea Foothills" },
  "Mount Ararat": { N: "Tbilisi Valley", S: "Central Plateau", E: "Caspian Depression" },
  "Kura River Basin": { N: "Chechen Highlands", S: "Tbilisi Valley", E: "Caspian Depression" },
  "Chechen Highlands": { S: "Tbilisi Valley", E: "Caspian Depression", W: "Black Sea Foothills", N: "Steppe Borderlands" },
  "Black Sea Foothills": { E: "Tbilisi Valley", S: "Pontic Coast", W: "Thracian Plain" },
  "Caspian Depression": { W: "Tbilisi Valley", S: "Caspian Foothills", N: "Volga Bend", E: "Aral Sea Basin" },

  // Eastern Desert and Red Sea
  "Eastern Desert Highlands": { W: "Nubian Desert", S: "Berenice Hinterland", E: "Sudanese Red Sea" },
  "Sudanese Red Sea": { W: "Eastern Desert Highlands", S: "Red Sea Shore", N: "Red Sea Coast" },
  "Wadi Hammamat": { N: "Eastern Desert Highlands", S: "Berenice Hinterland", W: "Thebes Valley" },
  "Berenice Hinterland": { N: "Eastern Desert Highlands", S: "Gebel Elba Region", E: "Sudanese Red Sea" },
  "Suez Isthmus": { N: "Alexandria Coast", S: "Eastern Desert Highlands", E: "Dead Sea Shore" },
  "Gebel Elba Region": { N: "Berenice Hinterland", S: "Ethiopian Highlands", E: "Red Sea Shore" },

  // === SUB SAHARAN AFRICA ===
  // Sahel
  "Timbuktu Basin": { N: "Atlas Mountains", S: "Niger Bend", E: "Gao Region", W: "Fouta Djallon Highlands" },
  "Lake Chad": { N: "Tripolitania", S: "Ubangi Basin", E: "Ethiopian Highlands", W: "Gao Region" },
  "Niger Bend": { N: "Timbuktu Basin", S: "Ashanti Forest", E: "Dogon Plateau", W: "Fouta Djallon Highlands" },
  "Gao Region": { N: "Tripolitania", S: "Dogon Plateau", W: "Timbuktu Basin", E: "Lake Chad" },
  "Sahelian Scrublands": { N: "Atlas Mountains", S: "Ibo Plateau", E: "Lake Chad" },
  "Dogon Plateau": { N: "Gao Region", S: "Ashanti Forest", W: "Niger Bend", E: "Sahelian Scrublands" },

  // Upper Guinea
  "Fouta Djallon Highlands": { N: "Timbuktu Basin", S: "Sierra Leone Coast", E: "Ashanti Forest", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "Sierra Leone Coast": { N: "Fouta Djallon Highlands", S: "LIMINAL_ATLANTIC_TO_AMERICAS", E: "Ashanti Forest", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "Gambia River Basin": { N: "Timbuktu Basin", S: "Fouta Djallon Highlands", E: "Gold Coast Savanna", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "Ashanti Forest": { N: "Niger Bend", S: "Cross River Delta", W: "Fouta Djallon Highlands", E: "Gold Coast Savanna" },
  "Bissagos Islands": { E: "Sierra Leone Coast", N: "Gambia River Basin", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "Gold Coast Savanna": { N: "Dogon Plateau", S: "Cross River Delta", W: "Ashanti Forest", E: "Ibo Plateau" },

  // Lower Guinea and Congo Basin
  "Cross River Delta": { N: "Gold Coast Savanna", S: "Kongo Coast", E: "Bantu Uplands", W: "Ashanti Forest" },
  "Bantu Uplands": { N: "Ubangi Basin", S: "Congo River Bend", W: "Cross River Delta", E: "Ubangi Basin" },
  "Kinshasa Hinterland": { N: "Ubangi Basin", S: "Congo River Bend", E: "Ituri Rainforest", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "Ituri Rainforest": { N: "Bangui Highlands", S: "Congo River Bend", W: "Kinshasa Hinterland", E: "Lake Tanganyika Shore" },
  "Congo River Bend": { N: "Bantu Uplands", S: "Limpopo Valley", E: "Ituri Rainforest", W: "Kongo Coast" },
  "Kongo Coast": { N: "Cross River Delta", S: "LIMINAL_ATLANTIC_TO_AMERICAS", E: "Congo River Bend", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },

  // Horn of Africa
  "Ethiopian Highlands": { N: "Bayuda Desert", S: "Rift Valley Lakes", E: "Harar Plateau", W: "Bayuda Desert" },
  "Danakil Depression": { N: "Red Sea Shore", S: "Ethiopian Highlands", E: "Somali Steppe", W: "Ethiopian Highlands" },
  "Rift Valley Lakes": { N: "Ethiopian Highlands", S: "Serengeti Plain", E: "Somali Steppe", W: "Bangui Highlands" },
  "Harar Plateau": { N: "Danakil Depression", S: "Rift Valley Lakes", W: "Ethiopian Highlands", E: "Somali Steppe" },
  "Red Sea Shore": { S: "Danakil Depression", N: "Sudanese Red Sea", E: "LIMINAL_ARABIAN_SEA_TO_MENA" },
  "Somali Steppe": { N: "Danakil Depression", S: "Serengeti Plain", W: "Harar Plateau", E: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA" },

  // East African Rift
  "Serengeti Plain": { N: "Rift Valley Lakes", S: "Great Rift Escarpment", E: "Lake Victoria Basin", W: "Bangui Highlands" },
  "Mount Kilimanjaro Foothills": { N: "Lake Victoria Basin", S: "Olduvai Gorge", E: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA", W: "Serengeti Plain" },
  "Lake Victoria Basin": { N: "Rift Valley Lakes", S: "Mount Kilimanjaro Foothills", W: "Serengeti Plain", E: "Mara River Valley" },
  "Great Rift Escarpment": { N: "Serengeti Plain", S: "Limpopo Valley", E: "Olduvai Gorge", W: "Lake Tanganyika Shore" },
  "Olduvai Gorge": { N: "Mount Kilimanjaro Foothills", S: "Limpopo Valley", W: "Great Rift Escarpment" },
  "Mara River Valley": { W: "Lake Victoria Basin", S: "Mount Kilimanjaro Foothills", E: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA" },

  // Southern Africa
  "Drakensberg Mountains": { N: "Limpopo Valley", S: "Cape Coast", E: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA", W: "Kalahari Basin" },
  "Kalahari Basin": { N: "Congo River Bend", S: "Karoo Plateau", E: "Drakensberg Mountains", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "Karoo Plateau": { N: "Kalahari Basin", S: "Cape Coast", E: "Drakensberg Mountains", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "Cape Coast": { N: "Karoo Plateau", E: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "Limpopo Valley": { N: "Great Rift Escarpment", S: "Drakensberg Mountains", E: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA" },
  "Zambezi Floodplain": { N: "Lake Tanganyika Shore", S: "Limpopo Valley", E: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA", W: "Congo River Bend" },

  // Central Africa
  "Ubangi Basin": { N: "Lake Chad", S: "Equatorial Rainforest", E: "Bangui Highlands", W: "Cross River Delta" },
  "Equatorial Rainforest": { N: "Ubangi Basin", S: "Bateke Plateau", E: "Lake Tanganyika Shore", W: "Kinshasa Hinterland" },
  "Bangui Highlands": { N: "Lake Chad", S: "Lake Tanganyika Shore", W: "Ubangi Basin", E: "Rift Valley Lakes" },
  "Lake Tanganyika Shore": { N: "Bangui Highlands", S: "Lualaba Headwaters", W: "Equatorial Rainforest", E: "Serengeti Plain" },
  "Bateke Plateau": { N: "Equatorial Rainforest", S: "Kalahari Basin", E: "Lualaba Headwaters" },
  "Lualaba Headwaters": { N: "Lake Tanganyika Shore", S: "Zambezi Floodplain", W: "Bateke Plateau" },

  // West African Forests
  "Ibo Plateau": { N: "Sahelian Scrublands", S: "Niger Delta", E: "Jos Plateau", W: "Gold Coast Savanna" },
  "Niger Delta": { N: "Ibo Plateau", S: "Cross River Delta", E: "Ogun River Basin", W: "Gold Coast Savanna" },
  "Benin Lowlands": { N: "Dogon Plateau", S: "Oyo Hinterland", E: "Jos Plateau", W: "Gold Coast Savanna" },
  "Oyo Hinterland": { N: "Benin Lowlands", S: "Ogun River Basin", E: "Jos Plateau" },
  "Jos Plateau": { N: "Sahelian Scrublands", S: "Oyo Hinterland", W: "Benin Lowlands", E: "Ubangi Basin" },
  "Ogun River Basin": { N: "Oyo Hinterland", W: "Niger Delta", S: "Cross River Delta" },

  // Madagascar and Islands
  "Highlands of Madagascar": { N: "Antananarivo Region", S: "Mahafaly Plateau", E: "Mozambique Channel Coast", W: "Zambezi Floodplain" },
  "Antananarivo Region": { S: "Highlands of Madagascar", E: "Mozambique Channel Coast", W: "Zambezi Floodplain" },
  "Mozambique Channel Coast": { W: "Highlands of Madagascar", E: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA", N: "Antananarivo Region" },
  "Comoros Archipelago": { E: "Highlands of Madagascar", W: "Zambezi Floodplain", S: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA", N: "Red Sea Shore", },
  "Mascarene Islands": { W: "Highlands of Madagascar", E: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA", N: "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA" },
  "Mahafaly Plateau": { N: "Highlands of Madagascar", E: "Mozambique Channel Coast", W: "Cape Coast" },

  // === SOUTH ASIA ===
  // Indus Valley
  "Harappa Basin": { S: "Punjab Plains", E: "Delhi Region", W: "Isfahan Basin", N: "Hindu Kush" },
  "Punjab Plains": { N: "Harappa Basin", S: "Thar Desert Margin", E: "Delhi Region", W: "Salt Range Foothills" },
  "Thar Desert Margin": { N: "Punjab Plains", S: "Rann of Kutch", E: "Malwa Plateau", W: "Shiraz Valley" },
  "Sindh River Delta": { N: "Punjab Plains", S: "LIMINAL_ARABIAN_SEA_TO_MENA", E: "Rann of Kutch", W: "LIMINAL_ARABIAN_SEA_TO_MENA" },
  "Salt Range Foothills": { E: "Punjab Plains", N: "Harappa Basin", W: "Isfahan Basin" },
  "Rann of Kutch": { N: "Thar Desert Margin", E: "Western Ghats", W: "Sindh River Delta", S: "LIMINAL_ARABIAN_SEA_TO_AFRICA" },

  // Gangetic Plain
  "Varanasi Basin": { N: "Kashmir Valley", S: "Malwa Plateau", E: "Patna Lowlands", W: "Delhi Region" },
  "Allahabad Confluence": { N: "Awadh Plains", S: "Narmada Valley", E: "Patna Lowlands", W: "Delhi Region" },
  "Patna Lowlands": { N: "Darjeeling Hills", S: "Chota Nagpur Plateau", W: "Varanasi Basin", E: "Bengal Delta" },
  "Delhi Region": { N: "Kashmir Valley", S: "Malwa Plateau", E: "Varanasi Basin", W: "Harappa Basin" },
  "Awadh Plains": { N: "Darjeeling Hills", S: "Allahabad Confluence", E: "Patna Lowlands", W: "Delhi Region" },
  "Bengal Delta": { N: "Brahmaputra Valley", S: "Eastern Ghats", W: "Patna Lowlands", E: "Irrawaddy Valley" },

  // Deccan Plateau
  "Hyderabad Highlands": { N: "Malwa Plateau", S: "Karnataka Plateau", E: "Eastern Ghats", W: "Western Ghats" },
  "Western Ghats": { N: "Malwa Plateau", S: "Malabar Coast", E: "Hyderabad Highlands", W: "Malabar Coast" },
  "Malabar Coast": { N: "Western Ghats", S: "Galle Coast", E: "Karnataka Plateau", W: "LIMINAL_ARABIAN_SEA_TO_AFRICA" },
  "Coromandel Coast": { N: "Bengal Delta", S: "Trincomalee Harbor", W: "Eastern Ghats", E: "LIMINAL_BAY_OF_BENGAL_TO_SOUTHEAST_ASIA" },
  "Karnataka Plateau": { N: "Hyderabad Highlands", S: "Malabar Coast", E: "Eastern Ghats", W: "Western Ghats" },
  "Eastern Ghats": { N: "Chota Nagpur Plateau", S: "Coromandel Coast", W: "Hyderabad Highlands", E: "Coromandel Coast" },

  // Himalayas and Northeast
  "Kashmir Valley": { S: "Delhi Region", E: "Sikkim Highlands", W: "Hindu Kush", N: "Tibetan Plateau" },
  "Sikkim Highlands": { S: "Darjeeling Hills", W: "Kashmir Valley", E: "Brahmaputra Valley", N: "Tibetan Plateau" },
  "Brahmaputra Valley": { S: "Assam Plains", W: "Sikkim Highlands", E: "Naga Hills", N: "Tibetan Plateau" },
  "Darjeeling Hills": { N: "Sikkim Highlands", S: "Patna Lowlands", E: "Assam Plains", W: "Varanasi Basin" },
  "Assam Plains": { N: "Brahmaputra Valley", S: "Chota Nagpur Plateau", W: "Darjeeling Hills", E: "Naga Hills" },
  "Naga Hills": { N: "Tibetan Plateau", S: "Chota Nagpur Plateau", W: "Brahmaputra Valley", E: "Irrawaddy Valley" },

  // Central India
  "Malwa Plateau": { N: "Delhi Region", S: "Narmada Valley", E: "Chota Nagpur Plateau", W: "Thar Desert Margin" },
  "Vindhya Range": { N: "Varanasi Basin", S: "Satpura Range", E: "Chota Nagpur Plateau", W: "Malwa Plateau" },
  "Chota Nagpur Plateau": { N: "Patna Lowlands", S: "Gondwana Forests", W: "Vindhya Range", E: "Assam Plains" },
  "Narmada Valley": { N: "Malwa Plateau", S: "Satpura Range", E: "Gondwana Forests", W: "Western Ghats" },
  "Gondwana Forests": { N: "Chota Nagpur Plateau", S: "Hyderabad Highlands", W: "Narmada Valley", E: "Eastern Ghats" },
  "Satpura Range": { N: "Vindhya Range", S: "Hyderabad Highlands", E: "Gondwana Forests", W: "Narmada Valley" },

  // Sri Lanka
  "Central Highlands": { N: "Anuradhapura Basin", S: "Galle Coast", E: "Trincomalee Harbor", W: "Kandy Plateau" },
  "Jaffna Peninsula": { S: "Anuradhapura Basin", E: "Coromandel Coast", W: "Malabar Coast" },
  "Anuradhapura Basin": { N: "Jaffna Peninsula", S: "Central Highlands", E: "Trincomalee Harbor", W: "Kandy Plateau" },
  "Kandy Plateau": { E: "Central Highlands", S: "Galle Coast", N: "Anuradhapura Basin" },
  "Galle Coast": { N: "Central Highlands", E: "Trincomalee Harbor", W: "LIMINAL_INDIAN_OCEAN_TO_AFRICA", S: "LIMINAL_INDIAN_OCEAN_TO_OCEANIA" },
  "Trincomalee Harbor": { W: "Central Highlands", S: "Galle Coast", E: "LIMINAL_BAY_OF_BENGAL_TO_SOUTHEAST_ASIA", N: "Coromandel Coast" },

  // === OCEANIA ===
  // Australia – Southeast
  "Sydney Basin": { N: "Blue Mountains", S: "Gippsland", E: "LIMINAL_TASMAN_TO_NEW_ZEALAND", W: "Murray River Valley" },
  "Blue Mountains": { S: "Sydney Basin", E: "Gippsland", W: "Murray River Valley", N: "Lake Eyre Basin" },
  "Gippsland": { N: "Sydney Basin", S: "Victorian Alps", W: "Murray River Valley", E: "LIMINAL_TASMAN_TO_NEW_ZEALAND" },
  "Murray River Valley": { E: "Sydney Basin", S: "Victorian Alps", W: "Lake Eyre Basin", N: "Lake Eyre Basin" },
  "Victorian Alps": { N: "Gippsland", S: "Snowy Mountains", E: "LIMINAL_TASMAN_TO_NEW_ZEALAND", W: "Murray River Valley" },
  "Snowy Mountains": { N: "Victorian Alps", E: "LIMINAL_TASMAN_TO_NEW_ZEALAND", W: "Murray River Valley" },

  // Australia – Outback and Center
  "Alice Springs Basin": { N: "MacDonnell Ranges", S: "Uluru Region", E: "Great Barrier Reef Coast", W: "Pilbara" },
  "MacDonnell Ranges": { S: "Alice Springs Basin", E: "Great Barrier Reef Coast", W: "Pilbara" },
  "Lake Eyre Basin": { N: "Great Barrier Reef Coast", S: "Murray River Valley", E: "Great Barrier Reef Coast", W: "Simpson Desert" },
  "Simpson Desert": { E: "Lake Eyre Basin", S: "Murray River Valley", W: "Uluru Region", N: "MacDonnell Ranges" },
  "Uluru Region": { N: "Alice Springs Basin", E: "Simpson Desert", S: "Murray River Valley", W: "Goldfields Region" },
  "Barkly Tableland": { S: "Alice Springs Basin", E: "Great Barrier Reef Coast", W: "Kimberley", N: "Great Barrier Reef Coast" },

  // Australia – North and Queensland
  "Cape York Peninsula": { S: "Great Barrier Reef Coast", E: "Torres Strait", W: "Gulf of Carpentaria", N: "Torres Strait" },
  "Great Barrier Reef Coast": { N: "Cape York Peninsula", S: "Lake Eyre Basin", W: "Arnhem Land", E: "Coral Sea Coast" },
  "Daintree Rainforest": { N: "Cape York Peninsula", S: "Great Barrier Reef Coast", E: "Coral Sea Coast", W: "Timor Sea" },
  "Gulf of Carpentaria": { E: "Cape York Peninsula", S: "Arnhem Land", W: "Kimberley" },
  "Arnhem Land": { N: "Gulf of Carpentaria", S: "Barkly Tableland", E: "Great Barrier Reef Coast", W: "Kimberley" },
  "Torres Strait": { S: "Cape York Peninsula", N: "Kokoda Plateau", E: "Coral Sea Coast", W: "Banda Sea" },

  // Australia – West and Desert
  "Pilbara": { S: "Goldfields Region", E: "Alice Springs Basin", W: "LIMINAL_INDIAN_OCEAN_TO_AFRICA", N: "Kimberley" },
  "Kimberley": { S: "Pilbara", E: "Gulf of Carpentaria", W: "LIMINAL_INDIAN_OCEAN_TO_AFRICA", N: "Timor Sea" },
  "Great Sandy Desert": { S: "Goldfields Region", E: "Uluru Region", W: "Swan Coastal Plain", N: "Pilbara" },
  "Nullarbor Plain": { N: "Goldfields Region", S: "Murray River Valley", E: "Lake Eyre Basin", W: "Swan Coastal Plain" },
  "Swan Coastal Plain": { E: "Great Sandy Desert", N: "Pilbara", S: "Nullarbor Plain", W: "LIMINAL_INDIAN_OCEAN_TO_AFRICA" },
  "Goldfields Region": { N: "Great Sandy Desert", S: "Nullarbor Plain", E: "Uluru Region", W: "Swan Coastal Plain" },

  // New Zealand
  "Canterbury Plains": { N: "Southern Alps", S: "Otago Highlands", E: "LIMINAL_TASMAN_TO_AUSTRALIA", W: "Southern Alps" },
  "Southern Alps": { S: "Canterbury Plains", E: "LIMINAL_TASMAN_TO_AUSTRALIA", W: "LIMINAL_TASMAN_TO_AUSTRALIA", N: "Rotorua Volcanic Zone" },
  "Rotorua Volcanic Zone": { S: "Southern Alps", E: "Hawke's Bay", W: "LIMINAL_TASMAN_TO_AUSTRALIA", N: "Wellington Coast" },
  "Hawke's Bay": { W: "Rotorua Volcanic Zone", S: "Canterbury Plains", N: "Wellington Coast", E: "LIMINAL_PACIFIC_TO_POLYNESIA" },
  "Otago Highlands": { N: "Canterbury Plains", E: "LIMINAL_TASMAN_TO_AUSTRALIA", W: "Southern Alps" },
  "Wellington Coast": { S: "Rotorua Volcanic Zone", E: "Hawke's Bay", W: "LIMINAL_TASMAN_TO_AUSTRALIA", N: "Society Islands" },

  // New Guinea and Melanesia
  "Sepik River Basin": { S: "Highlands of Papua", E: "Coral Sea Coast", W: "Spice Islands", N: "Caroline Islands" },
  "Highlands of Papua": { N: "Sepik River Basin", S: "Kokoda Plateau", E: "Coral Sea Coast", W: "Spice Islands" },
  "Bismarck Archipelago": { S: "Highlands of Papua", E: "Solomon Islands Chain", W: "Sepik River Basin" },
  "Solomon Islands Chain": { W: "Bismarck Archipelago", S: "Coral Sea Coast", E: "Society Islands" },
  "Coral Sea Coast": { N: "Sepik River Basin", S: "Great Barrier Reef Coast", W: "Highlands of Papua", E: "Solomon Islands Chain" },
  "Kokoda Plateau": { N: "Highlands of Papua", S: "Torres Strait", E: "Coral Sea Coast" },

  // Polynesia
  "Society Islands": { E: "Marquesas", W: "Samoa Archipelago", S: "Tuamotu Atolls", N: "Oahu Basin" },
  "Marquesas": { W: "Society Islands", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA", S: "Tuamotu Atolls" },
  "Tuamotu Atolls": { N: "Society Islands", E: "Rapa Nui", W: "Tonga Ridge", S: "Wellington Coast" },
  "Samoa Archipelago": { E: "Society Islands", W: "Tonga Ridge", N: "Caroline Islands", S: "Wellington Coast" },
  "Tonga Ridge": { E: "Samoa Archipelago", W: "Wellington Coast", N: "Caroline Islands", S: "Wellington Coast" },
  "Rapa Nui": { W: "Tuamotu Atolls", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA", S: "LIMINAL_PACIFIC_TO_SOUTH_AMERICA" },

  // Micronesia
  "Caroline Islands": { E: "Marshall Islands", W: "Palau", S: "Sepik River Basin", N: "Oahu Basin" },
  "Marshall Islands": { W: "Caroline Islands", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA", S: "Society Islands" },
  "Northern Mariana Chain": { S: "Caroline Islands", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA", W: "Ryukyu Islands" },
  "Palau": { E: "Caroline Islands", W: "Philippine Archipelago", S: "Sepik River Basin" },
  "Yap Plateau": { E: "Caroline Islands", W: "Palau", S: "Sepik River Basin" },
  "Guam and Surroundings": { N: "Northern Mariana Chain", S: "Caroline Islands", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA", W: "Ryukyu Islands" },

  // Hawaii and Central Pacific
  "Big Island Highlands": { N: "Oahu Basin", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA", W: "Marshall Islands", S: "Society Islands" },
  "Maui Slopes": { N: "Oahu Basin", S: "Big Island Highlands", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA" },
  "Oahu Basin": { S: "Big Island Highlands", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA", W: "Marshall Islands", N: "Aleutian Islands" },
  "Volcanoes National Park": { N: "Big Island Highlands", S: "Kauai Valleys", E: "LIMINAL_PACIFIC_TO_NORTH_AMERICA" },
  "Kauai Valleys": { N: "Volcanoes National Park", E: "Maui Slopes", W: "Molokai Channel" },
  "Molokai Channel": { E: "Kauai Valleys", W: "Marshall Islands", S: "Society Islands" },
  
  // === NEW AREA ADJACENCIES ===
  // New North America additions
  "Long Island": { N: "Hudson River Valley", S: "Pine Barrens", E: "Cape Cod", W: "Hudson River Valley" },
  "Connecticut River Valley": { N: "Champlain Valley", S: "Hudson River Valley", E: "Cape Cod", W: "Adirondacks" },
  "Florida Keys": { N: "Everglades", S: "Greater Antilles", E: "LIMINAL_ATLANTIC_TO_EUROPE", W: "Gulf Coast Texas" },
  "Texas Hill Country": { N: "Llano Estacado", S: "Rio Grande Valley", E: "Gulf Coast Texas", W: "Chihuahuan Desert" },
  "Llano Estacado": { N: "Platte River Basin", S: "Texas Hill Country", E: "Tallgrass Prairie", W: "Front Range" },
  "Gulf Coast Texas": { N: "Mississippi Bayou", S: "Gulf of Mexico", E: "Gulf of Mexico", W: "Texas Hill Country" },
  "Newfoundland Grand Banks": { N: "Labrador Coast", S: "Portland Coast", E: "LIMINAL_ATLANTIC_TO_EUROPE", W: "St. Lawrence River" },
  "Lake Superior Basin": { N: "Hudson Bay Lowlands", S: "Lake Michigan Shore", E: "Lake Superior Highlands", W: "Saskatchewan Prairie" },
  
  // New South America additions
  "Guyana Highlands": { N: "Orinoco Delta", S: "Manaus Region", E: "Essequibo Valley", W: "Rio Negro Junction" },
  "Pantanal Wetlands": { N: "Acre Rainforest", S: "Gran Chaco", E: "São Paulo Plateau", W: "Altiplano" },
  "Maracaibo Basin": { N: "LIMINAL_GULF_TO_CARIBBEAN", S: "Orinoco Delta", E: "Orinoco Delta", W: "Quito Plateau" },
  
  // New Africa additions
  "Swahili Coast": { N: "Somali Steppe", S: "Lake Victoria Basin", E: "LIMINAL_INDIAN_OCEAN_TO_ASIA", W: "Ethiopian Highlands" },
  "Rwanda Burundi Highlands": { N: "Lake Victoria Basin", S: "Lake Tanganyika Shore", E: "Serengeti Plain", W: "Equatorial Rainforest" },
  "Okavango Delta": { N: "Zambezi Floodplain", S: "Kalahari Basin", E: "Limpopo Valley", W: "Namibian Desert" },
  
  // New Middle East additions
  "Khuzestan Plain": { N: "Tigris Headwaters", S: "Persian Gulf Coast", E: "Isfahan Basin", W: "Babylonian Plain" },
  "Khorasan": { N: "Samarkand Region", S: "Isfahan Basin", E: "Balkh Plains", W: "Dasht-e Kavir" },
  "Hejaz Mountains": { N: "Jordan Valley", S: "Empty Quarter", E: "Nejd Highlands", W: "Red Sea Coast" },
  "Transoxiana": { N: "Ferghana Valley", S: "Balkh Plains", E: "Kyzylkum Desert", W: "Samarkand Region" },
  
  // New Europe additions
  "Galicia": { N: "Loire Valley", S: "Lisbon Coast", E: "Toledo Plateau", W: "LIMINAL_ATLANTIC_TO_AMERICAS" },
  "Transylvania": { N: "Carpathian Ridge", S: "Danube Bend", E: "Dnieper River Valley", W: "Pannonian Basin" },
  "Dobruja": { N: "Dnieper River Valley", S: "Thracian Plain", E: "Black Sea Coast", W: "Danube Bend" },
  
  // New Asia additions
  "Hokkaido": { N: "Sakhalin Island", S: "Tohoku Hills", E: "LIMINAL_PACIFIC_TO_AMERICAS", W: "LIMINAL_SEA_OF_JAPAN" },
  "Sulawesi": { N: "Mindanao", S: "Banda Sea", E: "Celebes Sea", W: "Makassar Strait" },
  "Andaman Islands": { N: "Bengal Delta", S: "Strait of Malacca", E: "LIMINAL_INDIAN_OCEAN_TO_ASIA", W: "LIMINAL_INDIAN_OCEAN_TO_ASIA" },
  "Laccadive Islands": { N: "Malabar Coast", S: "LIMINAL_INDIAN_OCEAN_TO_ASIA", E: "LIMINAL_INDIAN_OCEAN_TO_ASIA", W: "LIMINAL_INDIAN_OCEAN_TO_ASIA" },
  
  // New Oceania additions
  "Vanuatu": { N: "Solomon Islands Chain", S: "New Caledonia", E: "LIMINAL_PACIFIC_TO_AMERICAS", W: "Coral Sea Coast" },
  "New Caledonia": { N: "Vanuatu", S: "LIMINAL_PACIFIC_TO_ANTARCTICA", E: "LIMINAL_PACIFIC_TO_AMERICAS", W: "Great Barrier Reef Coast" },
  "Chatham Islands": { N: "LIMINAL_PACIFIC_TO_AMERICAS", S: "LIMINAL_PACIFIC_TO_ANTARCTICA", E: "LIMINAL_PACIFIC_TO_AMERICAS", W: "Wellington Coast" },
  "Gilbert Islands": { N: "Marshall Islands", S: "Tuamotu Atolls", E: "LIMINAL_PACIFIC_TO_AMERICAS", W: "Caroline Islands" }
};

export const LIMINAL_SEQUENCES: Record<string, LiminalSequence> = {
  // === OCEANIC CROSSINGS === 
  
  // === SMALL SEAS AND REGIONAL WATERWAYS ===
  // English Channel and North Sea (short crossings - 1 ocean map)
  "LIMINAL_CHANNEL_CROSSING": { 
    destination: "Normandy", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  "LIMINAL_NORTH_SEA_TO_BRITAIN": { 
    destination: "Thames Estuary", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  
  // Black Sea (regional sea - 1 ocean map)
  "LIMINAL_BLACK_SEA_TO_EUROPE": { 
    destination: "Thracian Plain", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  
  // Bay of Bengal (regional crossing - 1 ocean map)
  "LIMINAL_BAY_OF_BENGAL_TO_SOUTHEAST_ASIA": { 
    destination: "Irrawaddy Valley", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },

  // === MEDIUM SEAS ===
  // Arabian Sea and Red Sea (medium crossings - 2 ocean maps)
  "LIMINAL_ARABIAN_SEA_TO_MENA": { 
    destination: "Hadhramaut Valley", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  "LIMINAL_ARABIAN_SEA_TO_AFRICA": { 
    destination: "Red Sea Shore", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },

  // Tasman Sea (medium crossing - 2 ocean maps)
  "LIMINAL_TASMAN_TO_NEW_ZEALAND": { 
    destination: "Canterbury Plains", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  "LIMINAL_TASMAN_TO_AUSTRALIA": { 
    destination: "Sydney Basin", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  
  // Bering Sea (medium crossing - 2 ocean maps)
  "LIMINAL_BERING_SEA_TO_NORTH_AMERICA": { 
    destination: "Yukon River Valley", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  "LIMINAL_BERING_SEA_TO_ASIA": { 
    destination: "Kamchatka Peninsula", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },

  // === LARGE OCEAN REGIONS ===
  // South China Sea (large regional crossing - 3 ocean maps)
  "LIMINAL_SOUTH_CHINA_SEA_TO_OCEANIA": { 
    destination: "Daintree Rainforest", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },

  // North Atlantic crossings (large - 4 ocean maps)
  "LIMINAL_ATLANTIC_TO_AMERICAS": { 
    destination: "Chesapeake Bay", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  "LIMINAL_ATLANTIC_TO_EUROPE": { 
    destination: "Lisbon Coast", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  
  // North Atlantic - Arctic routes (large - 4 ocean maps)
  "LIMINAL_NORTH_ATLANTIC_TO_EUROPE": { 
    destination: "Norwegian Fjords", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  
  // Caribbean connections (medium-large - 3 ocean maps)  
  "LIMINAL_CARIBBEAN_TO_EUROPE": { 
    destination: "Lisbon Coast", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },

  // Indian Ocean crossings (medium-large - 3-4 ocean maps)
  "LIMINAL_INDIAN_OCEAN_TO_SOUTH_ASIA": { 
    destination: "Malabar Coast", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  "LIMINAL_INDIAN_OCEAN_TO_AFRICA": { 
    destination: "Cape Coast", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  "LIMINAL_INDIAN_OCEAN_TO_OCEANIA": { 
    destination: "Swan Coastal Plain", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },

  // Atlantic Africa to Americas (medium - 3 ocean maps)
  "LIMINAL_ATLANTIC_TO_AFRICA": { 
    destination: "Sierra Leone Coast", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },

  // Pacific Island connections (large - 4 ocean maps)
  "LIMINAL_PACIFIC_TO_POLYNESIA": { 
    destination: "Society Islands", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },

  // === VAST OCEAN CROSSINGS WITH ISLANDS ===
  // Pacific Ocean - largest ocean with island chains for resting
  "LIMINAL_PACIFIC_TO_EAST_ASIA": { 
    destination: "Kamchatka Peninsula", 
    sequence: [
      MapArchetype.SHOALS, 
      MapArchetype.OPEN_OCEAN, 
      MapArchetype.OPEN_OCEAN, 
      MapArchetype.ISLAND,  // Midway atoll
      MapArchetype.OPEN_OCEAN, 
      MapArchetype.OPEN_OCEAN, 
      MapArchetype.ISLAND,  // Wake Island
      MapArchetype.OPEN_OCEAN, 
      MapArchetype.SHOALS
    ] 
  },
  "LIMINAL_PACIFIC_TO_NORTH_AMERICA": { 
    destination: "Columbia River Valley", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  "LIMINAL_PACIFIC_TO_OCEANIA": { 
    destination: "Sydney Basin", 
    sequence: [
      MapArchetype.SHOALS, 
      MapArchetype.OPEN_OCEAN, 
      MapArchetype.ISLAND,  // Hawaii
      MapArchetype.OPEN_OCEAN, 
      MapArchetype.OPEN_OCEAN, 
      MapArchetype.ISLAND,  // Samoa
      MapArchetype.OPEN_OCEAN, 
      MapArchetype.ISLAND,  // Fiji
      MapArchetype.OPEN_OCEAN, 
      MapArchetype.SHOALS
    ] 
  },
  "LIMINAL_PACIFIC_TO_AMERICAS": { 
    destination: "Monterey Bay", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  "LIMINAL_PACIFIC_TO_SOUTH_AMERICA": { 
    destination: "Atacama Desert", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },

  // === ARCTIC OCEAN CROSSINGS ===
  // Arctic Ocean - vast and dangerous (7 ocean maps for trans-Arctic)
  "LIMINAL_ARCTIC_OCEAN_TO_NORTH_AMERICA": { 
    destination: "Yukon River Valley", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  "LIMINAL_ARCTIC_OCEAN_TO_ASIA": { 
    destination: "Arctic Siberia", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },
  "LIMINAL_ARCTIC_OCEAN_TO_EUROPE": { 
    destination: "Lapland", 
    sequence: [MapArchetype.SHOALS, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.OPEN_OCEAN, MapArchetype.SHOALS] 
  },

  // === ARCTIC TUNDRA CROSSINGS ===
  // Arctic land passages - empty tundra with only polar wildlife
  "LIMINAL_ARCTIC_TUNDRA_PASSAGE": { 
    destination: "Lapland", 
    sequence: [MapArchetype.DESERT, MapArchetype.DESERT, MapArchetype.ALL_LAND] 
  },
  "LIMINAL_SIBERIAN_TUNDRA": { 
    destination: "Arctic Siberia", 
    sequence: [MapArchetype.DESERT, MapArchetype.DESERT, MapArchetype.DESERT, MapArchetype.ALL_LAND] 
  },

  // === DESERT CROSSINGS WITH OASES ===
  // Sahara Desert - vast empty desert with rare oases
  "LIMINAL_SAHARA_CROSSING_NORTH_SOUTH": { 
    destination: "Timbuktu Basin", 
    sequence: [
      MapArchetype.DESERT, 
      MapArchetype.DESERT, 
      MapArchetype.OASIS,  // Critical rest point
      MapArchetype.DESERT, 
      MapArchetype.DESERT
    ] 
  },
  "LIMINAL_SAHARA_CROSSING_EAST_WEST": { 
    destination: "Lake Chad", 
    sequence: [MapArchetype.ALL_LAND, MapArchetype.DESERT, MapArchetype.DESERT, MapArchetype.ALL_LAND] 
  },
  
  // Arabian Desert crossings
  "LIMINAL_ARABIAN_DESERT": { 
    destination: "Empty Quarter", 
    sequence: [MapArchetype.DESERT, MapArchetype.DESERT] 
  },
  
  // Gobi Desert crossings
  "LIMINAL_GOBI_DESERT": { 
    destination: "Gobi Desert", 
    sequence: [MapArchetype.DESERT, MapArchetype.DESERT, MapArchetype.DESERT] 
  },
  
  // Australian Outback crossings
  "LIMINAL_OUTBACK_CROSSING": { 
    destination: "Alice Springs Basin", 
    sequence: [MapArchetype.DESERT, MapArchetype.DESERT, MapArchetype.DESERT] 
  },
  
  // American Southwest desert crossings
  "LIMINAL_SONORAN_DESERT": { 
    destination: "Colorado Plateau", 
    sequence: [MapArchetype.DESERT, MapArchetype.DESERT] 
  },
  
  // Patagonian steppe crossings
  "LIMINAL_PATAGONIAN_STEPPE": { 
    destination: "Magellanic Steppe", 
    sequence: [MapArchetype.ALL_LAND, MapArchetype.ALL_LAND] 
  },
  
  // === SOPHISTICATED MULTI-MODAL CROSSINGS ===
  // Silk Road - desert and mountain combination
  "LIMINAL_SILK_ROAD_WEST": {
    destination: "Samarkand Region",
    sequence: [
      MapArchetype.DESERT,
      MapArchetype.OASIS,
      MapArchetype.DESERT,
      MapArchetype.ALL_LAND,  // Mountain pass
      MapArchetype.RIVER_VALLEY,
      MapArchetype.ALL_LAND
    ]
  },
  
  // Trans-Siberian - forest and steppe
  "LIMINAL_TRANS_SIBERIAN": {
    destination: "Eastern Siberia",
    sequence: [
      MapArchetype.FOREST,
      MapArchetype.ALL_LAND,
      MapArchetype.FOREST,
      MapArchetype.RIVER_VALLEY,
      MapArchetype.ALL_LAND,
      MapArchetype.FOREST
    ]
  },
  
  // Cape Route around Africa - dangerous waters
  "LIMINAL_CAPE_OF_GOOD_HOPE": {
    destination: "Cape Peninsula",
    sequence: [
      MapArchetype.SHOALS,
      MapArchetype.OPEN_OCEAN,
      MapArchetype.OPEN_OCEAN,  // Rough seas
      MapArchetype.OPEN_OCEAN,  // Cape of Storms
      MapArchetype.OPEN_OCEAN,
      MapArchetype.SHOALS
    ]
  },
  
  // Northwest Passage - ice and islands
  "LIMINAL_NORTHWEST_PASSAGE": {
    destination: "Hudson Bay",
    sequence: [
      MapArchetype.SHOALS,
      MapArchetype.OPEN_OCEAN,  // Ice floes
      MapArchetype.ISLAND,  // Baffin Island
      MapArchetype.OPEN_OCEAN,  // More ice
      MapArchetype.ISLAND,  // Victoria Island
      MapArchetype.OPEN_OCEAN,
      MapArchetype.SHOALS
    ]
  },
  
  // Mediterranean island hopping
  "LIMINAL_MEDITERRANEAN_ISLANDS": {
    destination: "Athens Basin",
    sequence: [
      MapArchetype.SHOALS,
      MapArchetype.ISLAND,  // Sicily
      MapArchetype.OPEN_OCEAN,
      MapArchetype.ISLAND,  // Crete
      MapArchetype.OPEN_OCEAN,
      MapArchetype.SHOALS
    ]
  },
  
  // Amazon River journey
  "LIMINAL_AMAZON_DESCENT": {
    destination: "Amazon Delta",
    sequence: [
      MapArchetype.RIVER_VALLEY,
      MapArchetype.JUNGLE,
      MapArchetype.RIVER_VALLEY,
      MapArchetype.JUNGLE,
      MapArchetype.RIVER_VALLEY,
      MapArchetype.COASTAL_WETLAND
    ]
  },
  
  // Himalayan high passes
  "LIMINAL_HIMALAYAN_CROSSING": {
    destination: "Lhasa Basin",
    sequence: [
      MapArchetype.ALL_LAND,
      MapArchetype.ALL_LAND,  // High altitude
      MapArchetype.DESERT,  // Cold desert plateau
      MapArchetype.ALL_LAND,  // More mountains
      MapArchetype.RIVER_VALLEY  // Descent
    ]
  },
  
  // Caribbean hurricane alley
  "LIMINAL_CARIBBEAN_CROSSING": {
    destination: "Caribbean Sea",
    sequence: [
      MapArchetype.SHOALS,
      MapArchetype.OPEN_OCEAN,
      MapArchetype.ISLAND,  // Jamaica
      MapArchetype.OPEN_OCEAN,
      MapArchetype.ISLAND,  // Hispaniola
      MapArchetype.OPEN_OCEAN,
      MapArchetype.ISLAND,  // Puerto Rico
      MapArchetype.SHOALS
    ]
  }
};
