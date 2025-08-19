/**
 * constants/gameData/proceduralCityData.ts - A database of plausible, procedurally-used city/settlement names.
 * This serves as a fallback when a map area in geography.ts does not have a corresponding historical city in cities.ts for a given era.
 */
import { HistoricalEra } from '../../types';

export interface ProceduralCityEntry {
  name: string;
  description: string; // A short, generic description
  eras: HistoricalEra[]; // An array of eras this name is valid for
}

// Keyed by the `name` property from a MapAreaDefinition in geography.ts
export const PROCEDURAL_CITY_DATA: Record<string, ProceduralCityEntry[]> = {
  // === Europe ===
  
  // British Isles
  "London": [
    { name: "Londinium", description: "A Roman settlement on the Thames.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Lundenwic", description: "An Anglo-Saxon trading port.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Edinburgh": [
    { name: "Dun Eidyn", description: "A Pictish hill fort.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Dublin": [
    { name: "Dubh Linn", description: "A Gaelic settlement by the black pool.", eras: [HistoricalEra.MEDIEVAL] },
    { name: "Dyflinn", description: "A Norse trading town.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "York": [
    { name: "Eboracum", description: "A Roman legionary fortress.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Jorvik", description: "A Viking settlement and trading center.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Hadrian's Wall": [
    { name: "Housesteads Fort", description: "A Roman frontier fort along the wall.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Border Keep", description: "A fortified settlement on the ancient frontier.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Thames Estuary": [
    { name: "Cantiaci Settlement", description: "A settlement of the Cantiaci tribe.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Saxon Shore Fort", description: "A coastal defense settlement.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Oxfordshire": [
    { name: "Oxenaforda", description: "A Saxon settlement at the ox ford.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // France
  "Paris Basin": [
    { name: "Lutetia", description: "A Gallic settlement of the Parisii tribe.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Civitas Parisiorum", description: "A Frankish administrative center.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Loire Valley": [
    { name: "Caesarodunum", description: "A Roman city of the Turones.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Val de Loire", description: "A Frankish settlement along the great river.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Marseille Coast": [
    { name: "Massalia", description: "An ancient Greek colony and trading port.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Massilia", description: "A Roman provincial port city.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Pyrenees Foothills": [
    { name: "Vascones Settlement", description: "A settlement of the Basque people.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Normandy": [
    { name: "Rotomagus", description: "A Roman settlement of the Veliocasses.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Norse Settlement", description: "A Viking settlement in the northern lands.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Languedoc": [
    { name: "Nemausus", description: "A Roman colony with a famous amphitheater.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Occitan Village", description: "A settlement where the langue d'oc is spoken.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Iberian Peninsula
  "Andalusian Plain": [
    { name: "Corduba", description: "A Roman provincial capital on the Guadalquivir.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Qurtuba", description: "The western capital of the Umayyad Caliphate.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Lisbon Coast": [
    { name: "Olissipo", description: "A Roman port city on the Atlantic.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "al-Ushbuna", description: "A Moorish coastal fortress and port.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Ebro Valley": [
    { name: "Caesaraugusta", description: "A Roman colony on the Ebro River.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Saraqusta", description: "A Moorish administrative center.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Toledo Plateau": [
    { name: "Toletum", description: "A Roman hilltop city overlooking the Tagus.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Tulaytula", description: "A Visigothic and later Moorish capital.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Strait of Gibraltar": [
    { name: "Calpe", description: "A settlement near the Pillars of Hercules.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Jabal Tariq", description: "The rock of Tariq, a Moorish stronghold.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Catalonian Hills": [
    { name: "Barcino", description: "A small Roman coastal settlement.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Barshiluna", description: "A Frankish march settlement.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Italy
  "Roman Campagna": [
    { name: "Latin Settlement", description: "A settlement of the Latin peoples.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Papal Village", description: "A village in the patrimony of St. Peter.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Venetian Lagoon": [
    { name: "Rivus Altus", description: "A settlement on the high bank of the lagoon.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Rivoalto", description: "A merchant settlement in the lagoon.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Bay of Naples": [
    { name: "Neapolis", description: "The new city founded by Greek colonists.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Ducatus Neapolitanus", description: "A Byzantine duchy in southern Italy.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Florence Hills": [
    { name: "Florentia", description: "A Roman settlement by the Arno River.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Fiorenza", description: "A Tuscan commune among the hills.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Po Valley": [
    { name: "Mediolanum", description: "An important Roman city in Cisalpine Gaul.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Lombard Settlement", description: "A Lombard administrative center.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Germanic Lands
  "Rhine Valley": [
    { name: "Colonia Agrippina", description: "A Roman colony on the Rhine frontier.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Frankish Burg", description: "A Frankish fortified settlement by the great river.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Black Forest": [
    { name: "Waldsiedlung", description: "A settlement deep within the dark woods.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Brandenburg Plain": [
    { name: "Semnones Settlement", description: "A settlement of the Semnones tribe.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Slavic Burg", description: "A Slavic fortified settlement on the plain.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Hamburg Coast": [
    { name: "Saxon Shore Settlement", description: "A Saxon settlement by the North Sea.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Bavarian Highlands": [
    { name: "Boiohaemum", description: "A settlement of the Boii in the southern hills.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Bajuwaren Village", description: "A Bavarian settlement in the alpine foothills.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Saxon Uplands": [
    { name: "Cherusci Settlement", description: "A settlement of the Cherusci tribe.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Saxon Fortress", description: "A Saxon stronghold in the central uplands.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Central Europe
  "Danube Bend": [
    { name: "Aquincum", description: "A Roman frontier settlement on the Danube.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Magyar Settlement", description: "A Hungarian settlement at the river bend.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Bohemian Plateau": [
    { name: "Boiohaemum", description: "The homeland of the Boii people.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Czech Settlement", description: "A Slavic settlement in the Bohemian basin.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Carpathian Foothills": [
    { name: "Vlădești", description: "A village nestled in the shadow of the mountains.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Vienna Basin": [
    { name: "Vindobona", description: "A Roman fort at the crossing of the Danube.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Ostmark Settlement", description: "A settlement in the eastern march.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Moravian Gate": [
    { name: "Great Moravian Town", description: "A settlement of the Great Moravian Empire.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Tatra Mountains": [
    { name: "Goral Village", description: "A highland village of the mountain folk.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Balkans
  "Dinaric Alps": [
    { name: "Illyrian Settlement", description: "A fortified settlement of the Illyrian tribes.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Serb Župa", description: "A Serbian administrative settlement.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Bosporus": [
    { name: "Byzantion", description: "An ancient Greek city controlling the straits.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Konstantinoupolis", description: "The New Rome, capital of the Eastern Empire.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Pindus Mountains": [
    { name: "Epirote Settlement", description: "A mountain settlement of the Epirotes.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Vlach Village", description: "A settlement of the mountain Vlachs.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Thracian Plain": [
    { name: "Thracian Polis", description: "A city of the Thracian tribes.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Bulgarian Settlement", description: "A settlement of the First Bulgarian Empire.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Dalmatian Coast": [
    { name: "Ragusan Outpost", description: "A trading outpost of the maritime republic.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Vardar Valley": [
    { name: "Paeonian Settlement", description: "A settlement of the Paeonian people.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Macedonian Theme", description: "A Byzantine administrative center.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Scandinavia
  "Stockholm Archipelago": [
    { name: "Svear Settlement", description: "A settlement of the Svear people among the islands.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Norwegian Fjords": [
    { name: "Norse Settlement", description: "A village deep within the dramatic fjords.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Jutland Peninsula": [
    { name: "Viking Camp", description: "A seasonal camp for Norse raiders and traders.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Lapland": [
    { name: "Sami Camp", description: "A seasonal camp of the reindeer-herding Sami.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Gotland": [
    { name: "Gutar Settlement", description: "A trading settlement of the Gutar people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Øresund Strait": [
    { name: "Danish Shore Fort", description: "A coastal settlement controlling the strait.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Eastern Europe
  "Moscow Basin": [
    { name: "Finno-Ugric Settlement", description: "A settlement of the Finno-Ugric peoples.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Muscovite Village", description: "A village in the principality of Moscow.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Dnieper River Valley": [
    { name: "Scythian Settlement", description: "A settlement of the Scythian peoples.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Kievan Settlement", description: "A settlement of the Kievan Rus.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Volga Bend": [
    { name: "Bulgar Settlement", description: "A trading settlement of the Volga Bulgars.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Carpathian Ridge": [
    { name: "Dacian Settlement", description: "A fortified settlement of the Dacians.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Wallachian Village", description: "A village in the Wallachian principality.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Steppe Borderlands": [
    { name: "Scythian Kurgan", description: "A settlement near the burial mounds of Scythian warriors.", eras: [HistoricalEra.ANTIQUITY] }
  ],
  "Novgorod Woods": [
    { name: "Volkhov Settlement", description: "A fur trapping outpost near the great lake.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Low Countries
  "Rhine–Meuse Delta": [
    { name: "Trecht", description: "A small settlement on the Rhine, a key river crossing.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Flanders Fields": [
    { name: "Weversdorp", description: "A weaver's village known for its fine cloth.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Zuiderzee Coast": [
    { name: "Frisian Settlement", description: "A coastal settlement of the Frisian people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Brabant Highlands": [
    { name: "Brabantian Village", description: "A village in the duchy of Brabant.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Ardennes Forest": [
    { name: "Frankish Clearing", description: "A forest clearing settled by the Franks.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Scheldt Basin": [
    { name: "Flemish Port", description: "A river port in the Flemish lowlands.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Greece and Aegean
  "Athens Basin": [
    { name: "Athenai", description: "The ancient city-state dedicated to Athena.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Athinai", description: "A Byzantine theme capital in Hellas.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Peloponnesian Hills": [
    { name: "Lacedaemon", description: "The ancient city of the Spartans.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Morea Village", description: "A settlement in the Despotate of Morea.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Crete": [
    { name: "Knossos", description: "The ancient Minoan palace-city.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Candia", description: "A Venetian colonial stronghold.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Delos Archipelago": [
    { name: "Sacred Delos", description: "The sacred island of Apollo.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Cycladic Settlement", description: "A small island settlement in the Cyclades.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Mount Olympus": [
    { name: "Dion", description: "A sacred city at the foot of the gods' mountain.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Macedonian Village", description: "A village in the shadow of Olympus.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Thessalian Plain": [
    { name: "Larissa", description: "An ancient city in the fertile Thessalian plain.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Thessalian Settlement", description: "A farming settlement in the great plain.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // === North America ===

  // Pacific Coast
  "Columbia River Valley": [
    { name: "Chinook Village", description: "A salmon-fishing village of the Chinook people.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Puget Sound": [
    { name: "Lushootseed Village", description: "A village of the Coast Salish peoples.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "San Francisco Bay": [
    { name: "Ohlone Village", description: "A village of the Ohlone people by the great bay.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Santa Barbara Channel": [
    { name: "Chumash Village", description: "A coastal village of the Chumash people.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Olympic Peninsula": [
    { name: "Salish Fishing Village", description: "A village sustained by the bounty of the sea and rivers.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Redwood Coast": [
    { name: "Yurok Village", description: "A village of the Yurok people among the giant trees.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Southwest
  "Sonoran Desert": [
    { name: "Hohokam Village", description: "An ancient village of the Hohokam people.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Chaco Canyon": [
    { name: "Chacoan Great House", description: "A ceremonial center of the Ancestral Puebloans.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Rio Grande Valley": [
    { name: "Pueblo Settlement", description: "A multi-story pueblo of the Rio Grande peoples.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Colorado Plateau": [
    { name: "Ancestral Puebloan Village", description: "A cliff dwelling of the ancient ones.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Ancestral Puebloan Lands": [
    { name: "Mesa Verde Settlement", description: "A cliff palace settlement in the mesa country.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Mogollon Rim": [
    { name: "Mogollon Village", description: "A mountain village of the Mogollon culture.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Great Plains
  "Black Hills": [
    { name: "Lakota Winter Camp", description: "A sheltered winter camp for a Lakota band.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA] }
  ],
  "Platte River Basin": [
    { name: "Pawnee Village", description: "An earth lodge village of the Pawnee people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Flint Hills": [
    { name: "Kansa Village", description: "A village of the Kansa people in the tallgrass prairie.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Badlands": [
    { name: "Sioux Camp", description: "A seasonal camp in the weathered landscape.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Tallgrass Prairie": [
    { name: "Wichita Village", description: "A grass house village of the Wichita people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Missouri Breaks": [
    { name: "Mandan Village", description: "An earth lodge village overlooking the Missouri.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Mississippi Valley
  "Cahokia Mounds": [
    { name: "Mississippian Center", description: "A great ceremonial center with massive earthen mounds.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Lower Mississippi Delta": [
    { name: "Plaquemine Settlement", description: "A settlement of the Plaquemine culture.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Ozark Plateau": [
    { name: "Osage Village", description: "A semi-permanent settlement of the Osage people.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Natchez Bluffs": [
    { name: "Natchez Grand Village", description: "The ceremonial center of the Natchez people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Illinois River Valley": [
    { name: "Illini Village", description: "A village confederation site of the Illinois peoples.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Driftless Area": [
    { name: "Oneota Settlement", description: "A settlement of the Oneota cultural tradition.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Northeast Woodlands
  "Hudson River Valley": [
    { name: "Mohican Village", description: "A village of the Mohican people by the great river.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Great Lakes Shoreline": [
    { name: "Ojibwe Village", description: "A village of the Ojibwe people by the great water.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Adirondacks": [
    { name: "Algonquian Camp", description: "A seasonal hunting camp in the mountain wilderness.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Finger Lakes": [
    { name: "Haudenosaunee Village", description: "A longhouse village of the Iroquois confederacy.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Champlain Valley": [
    { name: "Abenaki Settlement", description: "A settlement of the Abenaki people by the lake.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Mohawk River": [
    { name: "Kanienʼkehá꞉ka Village", description: "A Mohawk village along the river valley.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Southeast
  "Smoky Mountains": [
    { name: "Cherokee Village", description: "A village of the Cherokee people in the misty mountains.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Okefenokee Swamp": [
    { name: "Seminole Camp", description: "A hidden settlement in the great swamp.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Piedmont Uplands": [
    { name: "Catawba Village", description: "A village of the Catawba people in the rolling hills.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Everglades": [
    { name: "Calusa Settlement", description: "A shell mound settlement of the Calusa people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Mississippi Bayou": [
    { name: "Choctaw Village", description: "A village of the Choctaw people in the wetlands.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Blue Ridge Foothills": [
    { name: "Tuscarora Village", description: "A village of the Tuscarora people in the foothills.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Arctic and Subarctic
  "Hudson Bay Lowlands": [
    { name: "Cree Camp", description: "A seasonal camp of the Cree people by the great bay.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Bering Strait": [
    { name: "Inupiat Village", description: "A whaling village of the Inupiat people.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Yukon River Valley": [
    { name: "Athabascan Camp", description: "A fishing camp of the Athabascan peoples.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Labrador Coast": [
    { name: "Innu Camp", description: "A seasonal camp of the Innu people.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Mackenzie Delta": [
    { name: "Gwich'in Settlement", description: "A settlement of the Gwich'in people in the delta.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Aleutian Islands": [
    { name: "Unangan Village", description: "A village of the Unangan people on the windswept islands.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Mexico and Central Highlands
  "Valley of Mexico": [
    { name: "Teotihuacan", description: "The ancient city of the gods.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Oaxaca Highlands": [
    { name: "Monte Alban", description: "The ancient Zapotec ceremonial center.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] },
    { name: "Zapotec Village", description: "A village of the Zapotec people in the highland valleys.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Yucatán Peninsula": [
    { name: "Chichen Itza", description: "A great Maya ceremonial center.", eras: [HistoricalEra.MEDIEVAL] },
    { name: "Maya City-State", description: "A Maya city-state in the jungle lowlands.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Sierra Madre Oriental": [
    { name: "Huastec Village", description: "A village of the Huastec people in the mountains.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Isthmus of Tehuantepec": [
    { name: "Zapotec Trading Post", description: "A Zapotec trading settlement on the narrow isthmus.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Lake Texcoco Basin": [
    { name: "Aztec Chinampa Village", description: "A floating garden settlement in the lake.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Northern Rockies
  "Bitterroot Range": [
    { name: "Salish Camp", description: "A seasonal camp of the Salish people in the mountains.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Yellowstone Basin": [
    { name: "Shoshone Camp", description: "A hunting camp of the Shoshone people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Snake River Plain": [
    { name: "Northern Shoshone Village", description: "A village of the Northern Shoshone on the plain.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Glacier Foothills": [
    { name: "Blackfeet Camp", description: "A camp of the Blackfeet people near the glaciers.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Salmon River Canyons": [
    { name: "Nez Perce Village", description: "A village of the Nez Perce in the river canyons.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Absaroka Range": [
    { name: "Apsáalooke Camp", description: "A seasonal camp of the Crow people, moving with the herds.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA] }
  ],

  // Atlantic Coast
  "Chesapeake Bay": [
    { name: "Powhatan Village", description: "A village of the Powhatan confederacy by the great bay.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Cape Cod": [
    { name: "Wampanoag Village", description: "A village of the Wampanoag people on the cape.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Pine Barrens": [
    { name: "Lenape Encampment", description: "A settlement of the Lenape people, masters of this woodland.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Outer Banks": [
    { name: "Algonquian Village", description: "A fishing village on the barrier islands.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Delaware River Valley": [
    { name: "Lenape Settlement", description: "A settlement of the Lenape along the river.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Tidewater Region": [
    { name: "Algonquian Settlement", description: "A settlement in the tidal river country.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // === South America ===

  // Andes North
  "Quito Plateau": [
    { name: "Quitu Village", description: "A village of the Quitu people on the highland plateau.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Cajamarca Highlands": [
    { name: "Inca Administrative Center", description: "An Inca provincial center in the highlands.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Lake Titicaca Basin": [
    { name: "Tiwanaku", description: "The ancient ceremonial center by the sacred lake.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] },
    { name: "Aymara Village", description: "A village of the Aymara people by the high lake.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Chimborazo Slopes": [
    { name: "Puruhá Settlement", description: "A settlement of the Puruhá people on the mountain slopes.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Cordillera Blanca": [
    { name: "Chavin Settlement", description: "A settlement influenced by the Chavin culture.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Inca Outpost", description: "A high-altitude outpost of the Inca Empire.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Chachapoyas Forest": [
    { name: "Chachapoya Citadel", description: "A cloud forest citadel of the Chachapoya people.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Andes South
  "Cuzco Valley": [
    { name: "Qosqo", description: "The sacred capital of the Inca Empire.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Altiplano": [
    { name: "Aymara Ayllu", description: "An Aymara community on the high plateau.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Atacama Desert": [
    { name: "Chinchorro Settlement", description: "A coastal settlement of the Chinchorro people.", eras: [HistoricalEra.PREHISTORY] }
  ],
  "Mendoza Foothills": [
    { name: "Huarpe Village", description: "A village of the Huarpe people in the foothills.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Aconcagua Range": [
    { name: "Inca Waystation", description: "A high-altitude waystation on the Inca road.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Mapuche Territory": [
    { name: "Mapuche Ruka", description: "A traditional settlement of the Mapuche people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Amazon Basin
  "Amazon Basin": [
    { name: "Tupi Aldeia", description: "A village of the Tupi people, built near the great river.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Manaus Region": [
    { name: "Amazonian Village", description: "A riverside village in the heart of the Amazon.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Rio Negro Junction": [
    { name: "Yanomami Shabono", description: "A communal house of the Yanomami people.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Xingu Headwaters": [
    { name: "Kayapo Village", description: "A village of the Kayapo people in the upper Xingu.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Acre Rainforest": [
    { name: "Cashibo Settlement", description: "A settlement of the Cashibo people in the rainforest.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Varzea Floodplains": [
    { name: "Marajoara Settlement", description: "A settlement on raised ground in the floodplains.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Tapajós Basin": [
    { name: "Tapajó Village", description: "A village of the Tapajó people by the river.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Gran Chaco and Pampas
  "Pampas Grasslands": [
    { name: "Querandí Camp", description: "A seasonal camp of the Querandí people on the grasslands.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Paraná Delta": [
    { name: "Charrúa Settlement", description: "A settlement of the Charrúa people in the delta.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Santa Fe Floodplain": [
    { name: "Mocoví Village", description: "A village of the Mocoví people on the floodplain.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Gran Chaco": [
    { name: "Guaycuru Camp", description: "A camp of nomadic Guaycuru warriors.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Córdoba Hills": [
    { name: "Comechingón Village", description: "A village of the Comechingón people in the hills.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Uruguay River Valley": [
    { name: "Chaná Settlement", description: "A settlement of the Chaná people by the river.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Atlantic Coast
  "Rio de Janeiro Bay": [
    { name: "Tupinambá Village", description: "A village of the Tupinambá people by the beautiful bay.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Bahia Coast": [
    { name: "Tupiniquim Settlement", description: "A coastal settlement of the Tupiniquim people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Pernambuco Highlands": [
    { name: "Tabajara Village", description: "A village of the Tabajara people in the highlands.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "São Paulo Plateau": [
    { name: "Tupi Village", description: "A village of the Tupi people on the plateau.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Recôncavo Basin": [
    { name: "Aimoré Settlement", description: "A settlement of the Aimoré people in the basin.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Espírito Santo Shore": [
    { name: "Goitacá Village", description: "A coastal village of the Goitacá people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Guiana Shield
  "Orinoco Delta": [
    { name: "Warao Village", description: "A stilt village of the Warao people in the delta.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Guiana Highlands": [
    { name: "Pemon Village", description: "A village of the Pemon people in the ancient highlands.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Essequibo Valley": [
    { name: "Arawak Settlement", description: "A settlement of the Arawak people by the river.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Maroni Basin": [
    { name: "Kalina Village", description: "A village of the Kalina people in the river basin.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Rupununi Savannah": [
    { name: "Makushi Settlement", description: "A settlement of the Makushi people on the savannah.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Kaieteur Plateau": [
    { name: "Patamona Village", description: "A village of the Patamona people on the plateau.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Patagonia
  "Patagonia": [
    { name: "Tehuelche Encampment", description: "A temporary camp of the nomadic Tehuelche hunters.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Valdés Peninsula": [
    { name: "Tehuelche Seasonal Camp", description: "A seasonal camp near the whale-watching grounds.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Andean Foothills": [
    { name: "Aonikenk Camp", description: "A camp of the Aonikenk people in the foothills.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Magellanic Steppe": [
    { name: "Selk'nam Camp", description: "A hunting camp of the Selk'nam people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Tierra del Fuego": [
    { name: "Yaghan Settlement", description: "A settlement of the Yaghan people at the end of the world.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Strait of Magellan": [
    { name: "Kawésqar Camp", description: "A nomadic camp of the Kawésqar sea people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Southern Ice Fields": [
    { name: "Glacier Camp", description: "A temporary shelter near the ice fields.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Southern Highlands
  "Potosí Region": [
    { name: "Inca Mining Settlement", description: "A high-altitude mining settlement of the Inca.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Tarija Valley": [
    { name: "Churumata Village", description: "A village of the Churumata people in the valley.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Cochabamba Basin": [
    { name: "Quechua Settlement", description: "A Quechua settlement in the fertile basin.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Santa Cruz Lowlands": [
    { name: "Guana Village", description: "A village of the Guana people in the lowlands.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Sucre Uplands": [
    { name: "Yampara Settlement", description: "A settlement of the Yampara people in the uplands.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Yungas Slopes": [
    { name: "Yunga Village", description: "A village on the cloud forest slopes.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Llanos and Orinoco
  "Apure Plains": [
    { name: "Yaruro Camp", description: "A seasonal camp of the Yaruro people on the plains.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Meta River Basin": [
    { name: "Guahibo Settlement", description: "A settlement of the Guahibo people by the river.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Llanos Floodplain": [
    { name: "Achagua Village", description: "A village of the Achagua people on the floodplain.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Villavicencio Foothills": [
    { name: "Muisca Settlement", description: "A settlement of the Muisca people in the foothills.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Arauca Borderlands": [
    { name: "Caquetio Village", description: "A village of the Caquetio people on the borderlands.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Orinoco Rapids": [
    { name: "Maipure Settlement", description: "A settlement of the Maipure people by the rapids.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // === MENA (Middle East & North Africa) ===

  // Nile Valley
  "Thebes Valley": [
    { name: "Waset", description: "The ancient Egyptian capital in Upper Egypt.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "al-Uqsur", description: "A settlement among the ancient monuments.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Nile Delta": [
    { name: "Per-Ramesses", description: "The delta capital of the Ramesside pharaohs.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "al-Fustat", description: "The first Islamic capital of Egypt.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Aswan Cataracts": [
    { name: "Syene", description: "The frontier town at the first cataract.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Aswan", description: "A Nubian trading settlement.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Faiyum Oasis": [
    { name: "Crocodilopolis", description: "The ancient city sacred to Sobek.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Fayyum", description: "An oasis settlement in the western desert.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Eastern Desert Wadis": [
    { name: "Mons Claudianus", description: "A Roman quarrying settlement.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Bedouin Camp", description: "A nomadic camp in the desert wadis.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Alexandria Coast": [
    { name: "Rhakotis", description: "The Egyptian settlement before Alexander.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "al-Iskandariyya", description: "The great port city of the Mediterranean.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Levant
  "Jerusalem Hills": [
    { name: "Yerushalayim", description: "The holy city of the Israelites.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "al-Quds", description: "The holy city sacred to three faiths.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Bekaa Valley": [
    { name: "Heliopolis", description: "The Roman temple city dedicated to Jupiter.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Baalbek", description: "A settlement among the ancient ruins.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Dead Sea Shore": [
    { name: "Qumran", description: "A secluded community by the salt sea.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Sodom", description: "A legendary settlement by the dead waters.", eras: [HistoricalEra.ANTIQUITY] }
  ],
  "Golan Heights": [
    { name: "Gamla", description: "A fortified settlement on the rocky plateau.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Druze Village", description: "A village of the Druze people on the heights.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Galilee Basin": [
    { name: "Tiberias", description: "A Roman city by the Sea of Galilee.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Tabariyyah", description: "A scholarly center by the sacred lake.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Mount Lebanon Range": [
    { name: "Phoenician City", description: "A mountain stronghold of the Phoenicians.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Maronite Monastery", description: "A Christian monastery in the mountains.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Anatolia
  "Cappadocian Highlands": [
    { name: "Çatalhöyük", description: "A Neolithic settlement with decorated houses.", eras: [HistoricalEra.PREHISTORY] },
    { name: "Caesarea", description: "A Roman provincial capital in the highlands.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Kayseriyyah", description: "A Byzantine theme capital.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Pontic Coast": [
    { name: "Neolithic Coastal Camp", description: "An early fishing settlement on the Black Sea coast.", eras: [HistoricalEra.PREHISTORY] },
    { name: "Sinope", description: "An ancient Greek colony on the Black Sea.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Sinub", description: "A port city on the northern coast.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Cilician Plain": [
    { name: "Tell Tayinat", description: "A prehistoric mound settlement.", eras: [HistoricalEra.PREHISTORY] },
    { name: "Tarsus", description: "The birthplace of the Apostle Paul.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Adana", description: "A settlement on the fertile plain.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Tarsus Foothills": [
    { name: "Cilician Gates", description: "A mountain pass settlement.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Central Plateau": [
    { name: "Aşıklı Höyük", description: "A Pre-Pottery Neolithic settlement.", eras: [HistoricalEra.PREHISTORY] },
    { name: "Ancyra", description: "A Galatian settlement on the plateau.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Ankara", description: "A Byzantine fortress town.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Bosporus Straits": [
    { name: "Byzantion", description: "An ancient Greek city controlling the straits.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Konstantinoupolis", description: "The New Rome, capital of the Eastern Empire.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Mesopotamia
  "Tigris–Euphrates Confluence": [
    { name: "Babylon", description: "The ancient capital of Babylonia.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Baghdad", description: "The Round City of the Abbasid Caliphate.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Nineveh Plain": [
    { name: "Nineveh", description: "The great capital of the Assyrian Empire.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "al-Mawsil", description: "A settlement across from the ancient ruins.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Marsh Arab Wetlands": [
    { name: "Sumerian City", description: "An ancient Sumerian city-state in the marshes.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Marsh Arab Village", description: "A village of reed houses in the wetlands.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Babylon Region": [
    { name: "Bab-ilim", description: "The Gate of the Gods, heart of Babylonia.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Hillah", description: "A settlement near the ancient ruins.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Zagros Foothills": [
    { name: "Ecbatana", description: "The summer capital of the Persian Empire.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Hamadan", description: "A settlement in the Zagros foothills.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Diyala Valley": [
    { name: "Eshnunna", description: "An ancient Mesopotamian city-state.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Diyala Settlement", description: "A village in the river valley.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Maghreb
  "Atlas Mountains": [
    { name: "Berber Village", description: "A mountain village of the Berber people.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Fez Plateau": [
    { name: "Volubilis", description: "A Roman city in the Moroccan interior.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Fas", description: "The spiritual capital of Morocco.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Tunisian Sahel": [
    { name: "Carthage", description: "The great rival of Rome.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Tunis", description: "The successor to ancient Carthage.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Rif Coast": [
    { name: "Tingis", description: "A Berber port city on the Atlantic.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Tanja", description: "A port controlling the strait crossing.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Draa Valley": [
    { name: "Sijilmasa", description: "A great trading city of the trans-Saharan routes.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Tripolitania": [
    { name: "Leptis Magna", description: "A great Roman city on the African coast.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Tarabulus", description: "A port city on the Barbary Coast.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Arabian Peninsula
  "Hijaz Mountains": [
    { name: "Makkah", description: "The sacred city of the Kaaba.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] },
    { name: "Yathrib", description: "The oasis city that became Medina.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Empty Quarter": [
    { name: "Bedouin Encampment", description: "A nomadic camp in the vast desert.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Hadhramaut Valley": [
    { name: "Shabwa", description: "The ancient capital of the Hadramaut kingdom.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Hadramawt Settlement", description: "A settlement in the frankincense lands.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Dhofar Hills": [
    { name: "Sumhuram", description: "An ancient frankincense trading port.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Zafar", description: "A settlement in the frankincense mountains.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Najd Plateau": [
    { name: "Diriyah", description: "An oasis settlement on the plateau.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Red Sea Coast": [
    { name: "Jeddah", description: "The gateway to the holy cities.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Persian Plateau
  "Isfahan Basin": [
    { name: "Spahan", description: "An ancient settlement in the central basin.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Isfahan", description: "Half the world, jewel of Persia.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Zagros Highlands": [
    { name: "Persepolis", description: "The ceremonial capital of the Persian Empire.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Takht-e Jamshid", description: "The ruins of the ancient Persian capital.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Caspian Foothills": [
    { name: "Hyrcanian Settlement", description: "A settlement in the forested foothills.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Mazanderani Village", description: "A village of the Mazandaran people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Dasht-e Kavir": [
    { name: "Salt Desert Caravanserai", description: "A waystation in the salt desert.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Shiraz Valley": [
    { name: "Cyrus Tomb", description: "A settlement near the tomb of Cyrus the Great.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Shiraz", description: "The city of poets and gardens.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Alborz Mountains": [
    { name: "Alamut", description: "The mountain fortress of the Assassins.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Caucasus
  "Tbilisi Valley": [
    { name: "Kartli Settlement", description: "A settlement of the Georgian Kartli kingdom.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Tbilisi", description: "The warm springs city of the Georgians.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Mount Ararat": [
    { name: "Armenian Monastery", description: "A monastery in the shadow of the sacred mountain.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Kura River Basin": [
    { name: "Iberian Settlement", description: "A settlement of the ancient Iberian kingdom.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Georgian Village", description: "A Georgian village in the river basin.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Chechen Highlands": [
    { name: "Nakh Settlement", description: "A mountain settlement of the Nakh peoples.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Black Sea Foothills": [
    { name: "Colchian Settlement", description: "A settlement in the land of the Golden Fleece.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Mingrelian Village", description: "A village of the Mingrelian people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Caspian Depression": [
    { name: "Khazar Settlement", description: "A settlement of the Khazar people.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Eastern Desert and Red Sea
  "Eastern Desert Highlands": [
    { name: "Blemmye Camp", description: "A nomadic camp of the Blemmye people.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Beja Settlement", description: "A settlement of the Beja people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Wadi Hammamat": [
    { name: "Quarry Settlement", description: "A settlement serving the ancient quarries.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Berenice Hinterland": [
    { name: "Berenice", description: "A Red Sea port for Indian Ocean trade.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Berenik", description: "A port settlement on the Red Sea.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Suez Isthmus": [
    { name: "Clysma", description: "A Roman port at the head of the Red Sea.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "al-Qulzum", description: "A port connecting the Red Sea and Mediterranean.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Gebel Elba Region": [
    { name: "Nubian Settlement", description: "A settlement of the Nubian people.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],

  // === Sub-Saharan Africa ===

  // Sahel
  "Sahel": [
    { name: "Tuareg Encampment", description: "A nomadic camp of the Tuareg people, masters of the desert.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Timbuktu Basin": [
    { name: "Timbuktu", description: "The legendary city of gold and learning.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Lake Chad": [
    { name: "Sao Settlement", description: "A settlement of the ancient Sao people.", eras: [HistoricalEra.MEDIEVAL] },
    { name: "Kanem Capital", description: "A capital of the Kanem Empire.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Niger Bend": [
    { name: "Gao", description: "The capital of the Songhai Empire.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Gao Region": [
    { name: "Songhai Settlement", description: "A settlement of the great Songhai Empire.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Sahelian Scrublands": [
    { name: "Fulani Camp", description: "A nomadic camp of the cattle-herding Fulani.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Dogon Plateau": [
    { name: "Dogon Village", description: "A cliffside village of the Dogon people.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Upper Guinea
  "Fouta Djallon Highlands": [
    { name: "Fulani Settlement", description: "A highland settlement of the Fulani people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Sierra Leone Coast": [
    { name: "Temne Village", description: "A coastal village of the Temne people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Gambia River Basin": [
    { name: "Mandinka Settlement", description: "A river settlement of the Mandinka people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Ashanti Forest": [
    { name: "Ashanti Village", description: "A forest village of the Ashanti people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Bissagos Islands": [
    { name: "Bijagó Settlement", description: "An island settlement of the Bijagó people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Gold Coast Savanna": [
    { name: "Akan Village", description: "A gold-trading village of the Akan people.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Lower Guinea and Congo Basin
  "Cross River Delta": [
    { name: "Efik Settlement", description: "A trading settlement of the Efik people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Bantu Uplands": [
    { name: "Bantu Village", description: "A village of the Bantu-speaking peoples.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Kinshasa Hinterland": [
    { name: "Kongo Settlement", description: "A settlement of the Kingdom of Kongo.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Ituri Rainforest": [
    { name: "Mbuti Camp", description: "A hunter-gatherer camp deep within the Ituri forest.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Congo River Bend": [
    { name: "Teke Village", description: "A river village of the Teke people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Kongo Coast": [
    { name: "Loango Port", description: "A port city of the Loango Kingdom.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Horn of Africa
  "Ethiopian Highlands": [
    { name: "Aksum", description: "The ancient capital of the Aksumite Empire.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] },
    { name: "Lalibela", description: "The new Jerusalem of Ethiopian Christianity.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Danakil Depression": [
    { name: "Afar Settlement", description: "A settlement of the Afar people in the depression.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Rift Valley Lakes": [
    { name: "Oromo Village", description: "A village of the Oromo people by the rift lakes.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Harar Plateau": [
    { name: "Harar", description: "The fourth holy city of Islam in Africa.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Red Sea Shore": [
    { name: "Adulis", description: "The ancient port of the Aksumite Empire.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Massawa", description: "A Red Sea port city.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Somali Steppe": [
    { name: "Somali Settlement", description: "A nomadic settlement of the Somali people.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // East African Rift
  "Serengeti Plain": [
    { name: "Maasai Kraal", description: "A protected enclosure for the cattle and people of the Maasai.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA] }
  ],
  "Mount Kilimanjaro Foothills": [
    { name: "Chagga Village", description: "A village of the Chagga people on the mountain slopes.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Lake Victoria Basin": [
    { name: "Buganda Capital", description: "A capital of the Buganda kingdom.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Great Rift Escarpment": [
    { name: "Kikuyu Settlement", description: "A settlement of the Kikuyu people on the escarpment.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Olduvai Gorge": [
    { name: "Ancient Settlement", description: "One of humanity's earliest settlement sites.", eras: [HistoricalEra.PREHISTORY] }
  ],
  "Mara River Valley": [
    { name: "Kalenjin Village", description: "A village of the Kalenjin people in the valley.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Southern Africa
  "Drakensberg Mountains": [
    { name: "Nguni Kraal", description: "A fortified homestead of an Nguni clan.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Kalahari Basin": [
    { name: "San Camp", description: "A camp of the San people, deeply connected to the desert lands.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Karoo Plateau": [
    { name: "Khoi Settlement", description: "A settlement of the Khoi pastoralists.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Cape Coast": [
    { name: "Khoi-San Camp", description: "A settlement of the Khoi-San peoples at the cape.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Limpopo Valley": [
    { name: "Mapungubwe", description: "The golden rhinoceros kingdom of southern Africa.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Zambezi Floodplain": [
    { name: "Lozi Village", description: "A village of the Lozi people on the floodplain.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Central Africa
  "Ubangi Basin": [
    { name: "Azande Settlement", description: "A settlement of the Azande people in the basin.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Equatorial Rainforest": [
    { name: "Pygmy Camp", description: "A forest camp of the Pygmy peoples.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Bangui Highlands": [
    { name: "Banda Village", description: "A village of the Banda people in the highlands.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN, HistoricalEra.INDUSTRIAL_ERA, HistoricalEra.MODERN_ERA] }
  ],
  "Lake Tanganyika Shore": [
    { name: "Ujiji", description: "A trading town on the shores of Tanganyika.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Bateke Plateau": [
    { name: "Teke Settlement", description: "A settlement of the Teke people on the plateau.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Lualaba Headwaters": [
    { name: "Luba Settlement", description: "A settlement of the Luba Empire.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // West African Forests
  "Ibo Plateau": [
    { name: "Igbo Village", description: "A village of the Igbo people on the plateau.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Niger Delta": [
    { name: "Ijaw Settlement", description: "A water settlement of the Ijaw people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Benin Lowlands": [
    { name: "Benin City", description: "The great city of the Benin Empire.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Oyo Hinterland": [
    { name: "Yoruba City", description: "A city-state of the Yoruba people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Jos Plateau": [
    { name: "Nok Settlement", description: "A settlement of the ancient Nok culture.", eras: [HistoricalEra.ANTIQUITY] }
  ],
  "Ogun River Basin": [
    { name: "Egba Settlement", description: "A settlement of the Egba people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Madagascar and Islands
  "Highlands of Madagascar": [
    { name: "Merina Village", description: "A highland village of the Merina people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Antananarivo Region": [
    { name: "Malagasy Settlement", description: "A settlement of the Malagasy people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Mozambique Channel Coast": [
    { name: "Sakalava Port", description: "A port settlement of the Sakalava people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Comoros Archipelago": [
    { name: "Swahili Settlement", description: "A Swahili trading settlement in the islands.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Mascarene Islands": [
    { name: "Dodo Island Settlement", description: "A settlement on the islands of the dodo.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Mahafaly Plateau": [
    { name: "Mahafaly Village", description: "A village of the Mahafaly people on the plateau.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // === South Asia ===

  // Indus Valley
  "Indus Valley": [
    { name: "Gandharan Stupa", description: "A small settlement around a Buddhist shrine.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Harappa Basin": [
    { name: "Harappa", description: "A great city of the Indus Valley Civilization.", eras: [HistoricalEra.ANTIQUITY] }
  ],
  "Punjab Plains": [
    { name: "Taxila", description: "A center of learning in ancient Gandhara.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Lahore", description: "A city of gardens and culture.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Thar Desert Margin": [
    { name: "Rajput Fort", description: "A desert fortress of the Rajput warriors.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Sindh River Delta": [
    { name: "Barbarikon", description: "An ancient port at the mouth of the Indus.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Debal", description: "The first Islamic conquest in the subcontinent.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Salt Range Foothills": [
    { name: "Kallar Kahar", description: "A settlement in the salt hills.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Rann of Kutch": [
    { name: "Kutch Settlement", description: "A settlement in the seasonal salt marsh.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Gangetic Plain
  "Varanasi Basin": [
    { name: "Kashi", description: "The eternal city, older than history.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Allahabad Confluence": [
    { name: "Prayaga", description: "The sacred confluence of three rivers.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Patna Lowlands": [
    { name: "Pataliputra", description: "The great capital of the Mauryan Empire.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Patna", description: "A trading city on the Ganges.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Delhi Region": [
    { name: "Indraprastha", description: "The legendary city of the Pandavas.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Shahjahanabad", description: "The new city of the Mughal emperor.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Awadh Plains": [
    { name: "Ayodhya", description: "The sacred city of Lord Rama.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Bengal Delta": [
    { name: "Gauda", description: "An ancient capital of Bengal.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Dhaka", description: "The city of mosques in the delta.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Deccan Plateau
  "Hyderabad Highlands": [
    { name: "Golconda", description: "The fortress city of diamonds.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Western Ghats": [
    { name: "Shivaji Fort", description: "A mountain fortress of the Maratha empire.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Malabar Coast": [
    { name: "Muziris", description: "The ancient spice port of Kerala.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Calicut", description: "The city of spices where Vasco da Gama landed.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Coromandel Coast": [
    { name: "Pulicat", description: "A Dutch trading settlement on the coast.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Karnataka Plateau": [
    { name: "Hampi", description: "The ruined capital of the Vijayanagara Empire.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Eastern Ghats": [
    { name: "Tribal Settlement", description: "A settlement of the hill tribes.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Himalayas and Northeast
  "Kashmir Valley": [
    { name: "Srinagar", description: "The summer capital in the vale of Kashmir.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Sikkim Highlands": [
    { name: "Lepcha Village", description: "A village of the Lepcha people in the mountains.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Brahmaputra Valley": [
    { name: "Pragjyotishpura", description: "The ancient capital of Kamarupa.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Guwahati", description: "The gateway to the northeast.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Darjeeling Hills": [
    { name: "Lepcha Settlement", description: "A mountain settlement of the Lepcha people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Assam Plains": [
    { name: "Ahom Capital", description: "A capital of the Ahom kingdom.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Naga Hills": [
    { name: "Naga Village", description: "A village of the Naga tribes in the hills.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Central India
  "Malwa Plateau": [
    { name: "Ujjain", description: "One of the seven sacred cities of Hinduism.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Vindhya Range": [
    { name: "Gond Settlement", description: "A settlement of the Gond people in the hills.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Chota Nagpur Plateau": [
    { name: "Tribal Village", description: "A village of the plateau tribes.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Narmada Valley": [
    { name: "Maheshwar", description: "A sacred city on the Narmada River.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Gondwana Forests": [
    { name: "Gond Fort", description: "A forest fort of the Gond kingdoms.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Satpura Range": [
    { name: "Bhil Settlement", description: "A settlement of the Bhil people in the hills.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Sri Lanka
  "Central Highlands": [
    { name: "Kandy", description: "The last capital of the Sinhalese kings.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Jaffna Peninsula": [
    { name: "Jaffna", description: "The cultural capital of the Tamil north.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Anuradhapura Basin": [
    { name: "Anuradhapura", description: "The ancient capital of Sinhalese civilization.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Kandy Plateau": [
    { name: "Temple of the Tooth", description: "The sacred city housing Buddha's tooth.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Galle Coast": [
    { name: "Galle", description: "A fortified port city on the southern coast.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Trincomalee Harbor": [
    { name: "Trincomalee", description: "One of the finest natural harbors in the world.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],

  // === East Asia ===

  // North China Plain
  "Yellow River Valley": [
    { name: "Luoyang", description: "The ancient capital of multiple Chinese dynasties.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Shandong Peninsula": [
    { name: "Qufu", description: "The hometown of Confucius.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Loess Plateau": [
    { name: "Xirong Settlement", description: "A settlement of the Xirong people on the fringes of Chinese civilization.", eras: [HistoricalEra.ANTIQUITY] }
  ],
  "Beijing Basin": [
    { name: "Zhongdu", description: "The Jurchen capital in the northern plain.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Taihang Mountains": [
    { name: "Mountain Monastery", description: "A Buddhist monastery in the mountains.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Hebei Plain": [
    { name: "Zhao Settlement", description: "A settlement of the ancient Zhao state.", eras: [HistoricalEra.ANTIQUITY] }
  ],

  // South China
  "Pearl River Delta": [
    { name: "Guangzhou", description: "The southern trading port of the empire.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Fujian Coast": [
    { name: "Quanzhou", description: "The great port of the Song dynasty.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Guangxi Highlands": [
    { name: "Zhuang Settlement", description: "A settlement of the Zhuang people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Yangtze Gorges": [
    { name: "Ba Settlement", description: "A settlement of the ancient Ba people.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "River Town", description: "A town clinging to the gorge walls.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Hainan Island": [
    { name: "Li Village", description: "A village of the Li people on the tropical island.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Wuyi Mountains": [
    { name: "Tea Village", description: "A village known for its fine tea.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // West China and Tibet
  "Sichuan Basin": [
    { name: "Chengdu", description: "The land of abundance in the western basin.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Yunnan Plateau": [
    { name: "Dian Kingdom Outpost", description: "An outpost of the Dian people, known for their bronze work.", eras: [HistoricalEra.ANTIQUITY] }
  ],
  "Tibetan Plateau": [
    { name: "Lhasa", description: "The sacred city on the roof of the world.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Himalayan Slopes": [
    { name: "Tibetan Monastery", description: "A Buddhist monastery in the high mountains.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Kailash Region": [
    { name: "Sacred Mountain Settlement", description: "A settlement near the sacred mountain.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Eastern Plateau Slopes": [
    { name: "Kham Settlement", description: "A settlement of the Kham people.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Japan
  "Kyoto Basin": [
    { name: "Heian-kyo", description: "The capital of peace and tranquility.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Edo Plain": [
    { name: "Edo", description: "The eastern capital of the Tokugawa.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Inland Sea Coast": [
    { name: "Hiroshima", description: "A castle town by the inland sea.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Mount Fuji Region": [
    { name: "Fuji Village", description: "A village in the shadow of the sacred mountain.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Tohoku Hills": [
    { name: "Emishi Settlement", description: "A settlement of the Emishi people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Nara Uplands": [
    { name: "Nara", description: "The ancient capital of deer and temples.", eras: [HistoricalEra.MEDIEVAL] }
  ],

  // Korea
  "Han River Valley": [
    { name: "Hanseong", description: "The fortress by the Han River.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Kaesong Foothills": [
    { name: "Kaesong", description: "The ancient capital of Goryeo.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Gyeongju Basin": [
    { name: "Seorabeol", description: "The golden capital of Silla.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] }
  ],
  "Jeolla Highlands": [
    { name: "Baekje Settlement", description: "A settlement of the Baekje kingdom.", eras: [HistoricalEra.ANTIQUITY] }
  ],
  "Baekdu Mountain Zone": [
    { name: "Goguryeo Fortress", description: "A mountain fortress of Goguryeo.", eras: [HistoricalEra.ANTIQUITY] }
  ],
  "Busan Coast": [
    { name: "Gimhae", description: "The ancient port of the Gaya confederacy.", eras: [HistoricalEra.ANTIQUITY] }
  ],

  // Taiwan and Ryukyu
  "Central Mountains": [
    { name: "Indigenous Village", description: "A village of the indigenous Formosan peoples.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Taipei Basin": [
    { name: "Ketagalan Settlement", description: "A settlement of the Ketagalan people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "East Coast Rift": [
    { name: "Amis Village", description: "A village of the Amis people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Ryukyu Islands": [
    { name: "Shuri", description: "The capital of the Ryukyu Kingdom.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Kenting Peninsula": [
    { name: "Paiwan Village", description: "A village of the Paiwan people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Taitung Highlands": [
    { name: "Puyuma Settlement", description: "A settlement of the Puyuma people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // === Oceania ===

  // Australia – Southeast
  "Sydney Basin": [
    { name: "Eora Camp", description: "A camp of the Eora people by the harbor.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Blue Mountains": [
    { name: "Darug Settlement", description: "A settlement of the Darug people in the mountains.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Gippsland": [
    { name: "Gunai Camp", description: "A seasonal camp of the Gunai people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Murray River Valley": [
    { name: "Yorta Yorta Village", description: "A river village of the Yorta Yorta people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Victorian Alps": [
    { name: "Alpine Camp", description: "A seasonal camp in the high country.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Snowy Mountains": [
    { name: "Bogong Gathering", description: "A seasonal gathering for bogong moths.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Australia – Outback and Center
  "Alice Springs Basin": [
    { name: "Arrernte Camp", description: "A camp of the Arrernte people in the heart of Australia.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "MacDonnell Ranges": [
    { name: "Tjoritja", description: "The sacred site of the MacDonnell Ranges.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Lake Eyre Basin": [
    { name: "Arabana Camp", description: "A camp of the Arabana people by the salt lake.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Simpson Desert": [
    { name: "Wangkangurru Camp", description: "A desert camp of the Wangkangurru people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Uluru Region": [
    { name: "Anangu Sacred Site", description: "The sacred heart of the continent.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Barkly Tableland": [
    { name: "Warumungu Camp", description: "A camp of the Warumungu people on the tableland.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Australia – North and Queensland
  "Cape York Peninsula": [
    { name: "Wik Village", description: "A village of the Wik people at the northern tip.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Great Barrier Reef Coast": [
    { name: "Yidinji Settlement", description: "A coastal settlement of the Yidinji people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Daintree Rainforest": [
    { name: "Kuku Yalanji Camp", description: "A rainforest camp of the Kuku Yalanji people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Gulf of Carpentaria": [
    { name: "Yanyuwa Camp", description: "A coastal camp of the Yanyuwa people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Arnhem Land": [
    { name: "Yolngu Settlement", description: "A settlement of the Yolngu people in the north.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Torres Strait": [
    { name: "Torres Strait Islander Village", description: "An island village of the Torres Strait peoples.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Australia – West and Desert
  "Pilbara": [
    { name: "Yindjibarndi Camp", description: "A camp of the Yindjibarndi people in the iron country.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Kimberley": [
    { name: "Worrorra Rock Shelter", description: "A shelter adorned with ancient rock art.", eras: [HistoricalEra.PREHISTORY, HistoricalEra.ANTIQUITY] }
  ],
  "Great Sandy Desert": [
    { name: "Pintupi Camp", description: "A camp near a waterhole, used by the Pintupi people.", eras: [HistoricalEra.MEDIEVAL] }
  ],
  "Nullarbor Plain": [
    { name: "Mirning Camp", description: "A camp of the Mirning people on the treeless plain.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Swan Coastal Plain": [
    { name: "Noongar Settlement", description: "A settlement of the Noongar people by the swan river.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Goldfields Region": [
    { name: "Ngalia Camp", description: "A camp of the Ngalia people in the goldfields.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // New Zealand
  "Canterbury Plains": [
    { name: "Ngāi Tahu Settlement", description: "A settlement of the Ngāi Tahu people on the plains.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Southern Alps": [
    { name: "Māori Pounamu Route", description: "A route through the mountains for greenstone.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Rotorua Volcanic Zone": [
    { name: "Te Arawa Settlement", description: "A settlement of the Te Arawa people in the thermal region.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Hawke's Bay": [
    { name: "Ngāti Kahungunu Pā", description: "A fortified settlement of Ngāti Kahungunu.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Otago Highlands": [
    { name: "Ngāi Tahu Kāika", description: "A seasonal settlement in the southern highlands.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Wellington Coast": [
    { name: "Te Ati Awa Pā", description: "A coastal fortification of Te Ati Awa.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // New Guinea and Melanesia
  "Sepik River Basin": [
    { name: "Iatmul Village", description: "A river village of the Iatmul people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Highlands of Papua": [
    { name: "Dani Hamlet", description: "A small collection of huts in a highland valley.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Bismarck Archipelago": [
    { name: "Tolai Village", description: "A village of the Tolai people in the islands.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Solomon Islands Chain": [
    { name: "Melanesian Village", description: "A village of the Melanesian peoples.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Coral Sea Coast": [
    { name: "Coastal Trading Post", description: "A trading settlement on the coral sea.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Kokoda Plateau": [
    { name: "Highland Village", description: "A village on the highland plateau.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Polynesia
  "Society Islands": [
    { name: "Ancient Marae", description: "An early ceremonial center.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Tahitian Marae", description: "A sacred ceremonial site in the Society Islands.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Marquesas": [
    { name: "Early Settlement", description: "One of the first Polynesian settlements.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Marquesan Village", description: "A village in the remote Marquesas.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Tuamotu Atolls": [
    { name: "Atoll Settlement", description: "A settlement on a coral atoll.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Samoa Archipelago": [
    { name: "Lapita Settlement", description: "An ancient Polynesian settlement.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Coastal Village", description: "A traditional coastal fishing village.", eras: [HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL] },
    { name: "Samoan Village", description: "A traditional village in Samoa.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Tonga Ridge": [
    { name: "Tu'i Tonga Settlement", description: "An early seat of Polynesian power.", eras: [HistoricalEra.ANTIQUITY] },
    { name: "Tongan Village", description: "A traditional Tongan village.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Rapa Nui": [
    { name: "Easter Island Settlement", description: "The settlement that built the moai.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Micronesia
  "Caroline Islands": [
    { name: "Carolinian Village", description: "A village in the Caroline Islands.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Marshall Islands": [
    { name: "Marshallese Atoll Settlement", description: "A settlement on a Marshallese atoll.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Northern Mariana Chain": [
    { name: "Chamorro Village", description: "A village of the Chamorro people.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Palau": [
    { name: "Palauan Village", description: "A village in the rock islands of Palau.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Yap Plateau": [
    { name: "Yapese Village", description: "A village famous for its stone money.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Guam and Surroundings": [
    { name: "Ancient Chamorro Site", description: "An ancient settlement of the Chamorro people.", eras: [HistoricalEra.MEDIEVAL, HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // Hawaii and Central Pacific
  "Big Island Highlands": [
    { name: "Hawaiian Village", description: "A village on the big island of Hawaii.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Maui Slopes": [
    { name: "Haleakalā Settlement", description: "A settlement on the slopes of the great volcano.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Oahu Basin": [
    { name: "Honolulu Harbor", description: "The protected harbor of Oahu.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Volcanoes National Park": [
    { name: "Sacred Volcano Site", description: "A sacred site near the active volcanoes.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Kauai Valleys": [
    { name: "Na Pali Settlement", description: "A settlement in the dramatic valleys of Kauai.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],
  "Molokai Channel": [
    { name: "Island Settlement", description: "A settlement overlooking the channel.", eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN] }
  ],

  // === Northern Steppe and Siberia ===

  "Siberian Steppe": [
    { name: "Saka Encampment", description: "A camp of Saka horsemen on the vast steppe.", eras: [HistoricalEra.ANTIQUITY] }
  ],
  "Gobi Desert": [
    { name: "Xiongnu Camp", description: "A nomadic camp of the Xiongnu confederation.", eras: [HistoricalEra.ANTIQUITY] }
  ]
};