/**
 * constants/gameData/cities.ts - A database of historical cities for procedural generation.
 */

export interface CityDefinition {
  name: string;
  isHistorical: boolean;
  foundingYear: number;
  declineYear?: number;
  description: string; // A short, one-sentence description for the UI.
  allegianceHistory: {
    [startYear: number]: string; // Maps a start year to a faction name. e.g., { 1545: 'Spanish Empire', 1825: 'Bolivia' }
  };
  urbanDensity: 'small' | 'moderate' | 'large' | 'massive';
  eraSpecificDensity?: {
    [era: string]: 'small' | 'moderate' | 'large' | 'massive';
  };
  populationPeak?: number;
  economicFocus?: string[];
}

// Keyed by the `name` property from a MapAreaDefinition in geography.ts
export const CITIES_DATA: { [mapAreaName: string]: CityDefinition[] } = {
  "Potosí Region": [
    {
      name: "Potosí",
      isHistorical: true,
      foundingYear: 1545,
      description: "A legendary silver mining city, once one of the largest and richest in the Americas.",
      allegianceHistory: {
        1545: "Spanish Empire",
        1825: "Republic of Bolivia",
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'small'
      },
      populationPeak: 160000,
      economicFocus: ['mining', 'silver', 'trade']
    }
  ],
  "London": [
    {
      name: "Londinium",
      isHistorical: true,
      foundingYear: 47,
      declineYear: 410,
      description: "A major commercial center of Roman Britain, established after the conquest of 43 AD.",
      allegianceHistory: {
        47: "Roman Empire"
      },
      urbanDensity: 'moderate',
      populationPeak: 60000,
      economicFocus: ['trade', 'administration', 'military']
    },
    {
        name: "London",
        isHistorical: true,
        foundingYear: 411,
        description: "A resilient metropolis that has been a center of trade, finance, and culture for centuries.",
        allegianceHistory: {
            411: "Anglo-Saxons",
            1066: "Kingdom of England",
            1707: "British Empire"
        },
        urbanDensity: 'large',
        eraSpecificDensity: {
          'prehistoric': 'small',
          'ancient': 'small',
          'medieval': 'moderate',
          'early_modern': 'large',
          'modern': 'massive'
        },
        populationPeak: 8900000,
        economicFocus: ['finance', 'trade', 'manufacturing', 'government']
    }
  ],
  "Edinburgh": [
    {
      name: "Edinburgh",
      isHistorical: true,
      foundingYear: 1124,
      description: "The historic capital of Scotland, dominated by its ancient castle on a volcanic crag.",
      allegianceHistory: {
        1124: "Kingdom of Scotland",
        1707: "Kingdom of Great Britain",
        1900: "United Kingdom"
      }
    }
  ],
  "Dublin": [
    {
      name: "Dyflin",
      isHistorical: true,
      foundingYear: 841,
      declineYear: 1171,
      description: "A major Viking longphort and center of the Norse Kingdom of Dublin.",
      allegianceHistory: {
        841: "Norse Kingdom of Dublin"
      }
    },
    {
      name: "Dublin",
      isHistorical: true,
      foundingYear: 1172,
      description: "The center of English and later British power in Ireland for centuries.",
      allegianceHistory: {
        1172: "Lordship of Ireland (English rule)",
        1542: "Kingdom of Ireland",
        1801: "United Kingdom"
      }
    }
  ],
   "Paris Basin": [
    {
      name: "Lutetia Parisiorum",
      isHistorical: true,
      foundingYear: -52, // 52 BC
      declineYear: 360,
      description: "A Gallo-Roman town on the Seine, later to become the capital of France.",
      allegianceHistory: {
        [-52]: "Roman Empire"
      }
    },
    {
      name: "Paris",
      isHistorical: true,
      foundingYear: 361,
      description: "The political and cultural heart of France, a center of arts, philosophy, and revolution.",
      allegianceHistory: {
        361: "Franks",
        987: "Kingdom of France",
        1792: "French Republic"
      }
    }
  ],
  "Marseille Coast": [
    {
      name: "Massalia",
      isHistorical: true,
      foundingYear: -600,
      declineYear: 49,
      description: "An ancient Greek colony and major trading port on the Mediterranean coast of Gaul.",
      allegianceHistory: {
        [-600]: "Greek Colony of Phocaea",
        [-49]: "Roman Republic"
      }
    },
    {
      name: "Marseille",
      isHistorical: true,
      foundingYear: 50,
      description: "France's oldest city and a vital port connecting Europe to North Africa and the Levant.",
      allegianceHistory: {
        50: "Roman Empire",
        481: "Kingdom of the Franks",
        1481: "Kingdom of France"
      }
    }
  ],
  "Lisbon Coast": [
    {
      name: "Olisipo",
      isHistorical: true,
      foundingYear: -205,
      declineYear: 711,
      description: "A major Roman city in Lusitania, prized for its excellent harbor at the mouth of the Tagus.",
      allegianceHistory: {
        [-205]: "Roman Republic",
        [-27]: "Roman Empire",
        409: "Suebi Kingdom",
        585: "Visigothic Kingdom"
      }
    },
    {
      name: "Lisbon",
      isHistorical: true,
      foundingYear: 1147,
      description: "The capital of Portugal and the heart of a vast global empire during the Age of Discovery.",
      allegianceHistory: {
        1147: "Kingdom of Portugal"
      }
    }
  ],
  "Andalusian Plain": [
    {
      name: "Córdoba",
      isHistorical: true,
      foundingYear: 169,
      description: "The brilliant capital of the Caliphate of Córdoba, once the largest city in Europe.",
      allegianceHistory: {
        169: "Roman Empire",
        711: "Umayyad Caliphate",
        929: "Caliphate of Córdoba",
        1236: "Kingdom of Castile"
      }
    }
  ],
  "Toledo Plateau": [
    {
      name: "Toledo",
      isHistorical: true,
      foundingYear: -192,
      description: "The ancient city of three cultures, where Christian, Muslim, and Jewish traditions flourished together.",
      allegianceHistory: {
        [-192]: "Roman Republic",
        418: "Visigothic Kingdom",
        711: "Umayyad Caliphate",
        1085: "Kingdom of Castile"
      }
    }
  ],
  "Roman Campagna": [
    {
      name: "Rome",
      isHistorical: true,
      foundingYear: -753,
      description: "The Eternal City, capital of a vast empire and the heart of Western civilization.",
      allegianceHistory: {
        [-753]: "Roman Kingdom",
        [-509]: "Roman Republic",
        [-27]: "Roman Empire",
        756: "Papal States",
        1871: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'prehistoric': 'small',
        'ancient': 'massive',
        'medieval': 'moderate',
        'early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 1000000,
      economicFocus: ['government', 'trade', 'religion', 'military']
    }
  ],
  "Venetian Lagoon": [
    {
      name: "Venice",
      isHistorical: true,
      foundingYear: 421,
      declineYear: 1797,
      description: "A serene and powerful maritime republic built on islands, dominating trade in the Mediterranean.",
      allegianceHistory: {
        421: "Republic of Venice"
      }
    },
     {
      name: "Venice",
      isHistorical: true,
      foundingYear: 1798,
      description: "A city of breathtaking beauty, grappling with its lost imperial power and new place in a unified Italy.",
      allegianceHistory: {
        1798: "Habsburg Monarchy",
        1866: "Kingdom of Italy"
      }
    }
  ],
  "Florence Hills": [
    {
      name: "Florence",
      isHistorical: true,
      foundingYear: 59,
      description: "The birthplace of the Renaissance, where art and banking created a new vision of human possibility.",
      allegianceHistory: {
        59: "Roman Empire",
        1115: "Republic of Florence",
        1532: "Duchy of Florence",
        1569: "Grand Duchy of Tuscany"
      }
    }
  ],
  "Bay of Naples": [
    {
      name: "Naples",
      isHistorical: true,
      foundingYear: -600,
      description: "A magnificent southern port, heir to Greek Neapolis and gateway to the Mediterranean.",
      allegianceHistory: {
        [-600]: "Greek Colony",
        [-326]: "Roman Republic",
        1139: "Kingdom of Sicily",
        1442: "Kingdom of Naples"
      }
    }
  ],
  "Rhine Valley": [
     {
      name: "Colonia Claudia Ara Agrippinensium",
      isHistorical: true,
      foundingYear: 50,
      declineYear: 462,
      description: "A major Roman provincial capital on the Rhine frontier, a center of trade and military power.",
      allegianceHistory: {
        50: "Roman Empire"
      }
    },
    {
      name: "Cologne",
      isHistorical: true,
      foundingYear: 463,
      description: "A powerful medieval archbishopric and a free imperial city, a key node in the Hanseatic League.",
      allegianceHistory: {
        463: "Frankish Kingdom",
        953: "Holy Roman Empire",
        1815: "Kingdom of Prussia"
      }
    }
  ],
  "Danube Bend": [
    {
      name: "Budapest",
      isHistorical: true,
      foundingYear: 896,
      description: "The pearl of the Danube, uniting Buda and Pest as the magnificent capital of Hungary.",
      allegianceHistory: {
        896: "Magyar Tribes",
        1000: "Kingdom of Hungary",
        1541: "Ottoman Empire",
        1686: "Habsburg Monarchy"
      }
    }
  ],
  "Vienna Basin": [
    {
      name: "Vienna",
      isHistorical: true,
      foundingYear: 15,
      description: "The imperial city on the Danube, bastion of Christendom and heart of the Habsburg domains.",
      allegianceHistory: {
        15: "Roman Empire",
        976: "Margraviate of Austria",
        1156: "Duchy of Austria",
        1438: "Habsburg Monarchy"
      }
    }
  ],
  "Bohemian Plateau": [
    {
      name: "Prague",
      isHistorical: true,
      foundingYear: 885,
      description: "The golden city of a hundred spires, seat of Holy Roman Emperors and heart of Bohemia.",
      allegianceHistory: {
        885: "Duchy of Bohemia",
        1198: "Kingdom of Bohemia",
        1526: "Habsburg Monarchy"
      }
    }
  ],
   "Bosporus": [
    {
      name: "Byzantium",
      isHistorical: true,
      foundingYear: -657,
      declineYear: 329,
      description: "An ancient Greek colony strategically located on the strait separating Europe and Asia.",
      allegianceHistory: {
        [-657]: "Greek Colony of Megara"
      }
    },
    {
      name: "Constantinople",
      isHistorical: true,
      foundingYear: 330,
      declineYear: 1453,
      description: "The magnificent capital of the Eastern Roman (Byzantine) Empire for over a thousand years.",
      allegianceHistory: {
        330: "Roman Empire",
        395: "Byzantine Empire"
      }
    },
    {
        name: "Istanbul",
        isHistorical: true,
        foundingYear: 1454,
        description: "The imperial capital of the powerful Ottoman Empire, a bridge between civilizations.",
        allegianceHistory: {
            1454: "Ottoman Empire",
            1923: "Republic of Turkey"
        }
    }
  ],
  "Thracian Plain": [
    {
      name: "Adrianople",
      isHistorical: true,
      foundingYear: 125,
      description: "A strategic fortress city commanding the approaches to Constantinople.",
      allegianceHistory: {
        125: "Roman Empire",
        395: "Byzantine Empire",
        1362: "Ottoman Empire"
      }
    }
  ],
  "Athens Basin": [
    {
      name: "Athens",
      isHistorical: true,
      foundingYear: -3000,
      description: "The cradle of democracy and philosophy, where Western civilization found its voice.",
      allegianceHistory: {
        [-800]: "Greek City-State",
        [-146]: "Roman Republic",
        1204: "Latin Empire",
        1261: "Byzantine Empire",
        1458: "Ottoman Empire"
      }
    }
  ],
  "Crete": [
    {
      name: "Knossos",
      isHistorical: true,
      foundingYear: -2000,
      declineYear: -1100,
      description: "The legendary palace-city of the Minoan civilization, Europe's first great urban culture.",
      allegianceHistory: {
        [-2000]: "Minoan Civilization"
      }
    }
  ],
  "Moscow Basin": [
      {
        name: "Moscow",
        isHistorical: true,
        foundingYear: 1147,
        description: "A small settlement that grew into the center of the Grand Duchy of Moscow and the heart of the Russian Empire.",
        allegianceHistory: {
            1147: "Principality of Vladimir-Suzdal",
            1283: "Grand Duchy of Moscow",
            1547: "Tsardom of Russia",
            1721: "Russian Empire"
        }
      }
  ],
  "Dnieper River Valley": [
    {
      name: "Kiev",
      isHistorical: true,
      foundingYear: 482,
      description: "The mother of Russian cities, first capital of the Rus and gateway between Scandinavia and Byzantium.",
      allegianceHistory: {
        482: "Slavic Tribes",
        882: "Kievan Rus",
        1240: "Mongol Empire",
        1362: "Grand Duchy of Lithuania"
      }
    }
  ],
  "Volga Bend": [
    {
      name: "Kazan",
      isHistorical: true,
      foundingYear: 1005,
      description: "The capital of the Tatar Khanate, a powerful successor state to the Golden Horde.",
      allegianceHistory: {
        1005: "Volga Bulgaria",
        1438: "Kazan Khanate",
        1552: "Tsardom of Russia"
      }
    }
  ],
  "Rhine–Meuse Delta": [
    {
      name: "Amsterdam",
      isHistorical: true,
      foundingYear: 1275,
      description: "The merchant capital of the Dutch Golden Age, built on trade, tolerance, and the conquest of the sea.",
      allegianceHistory: {
        1275: "County of Holland",
        1581: "Dutch Republic",
        1806: "Kingdom of Holland",
        1815: "Kingdom of the Netherlands"
      }
    }
  ],
  "Valley of Mexico": [
    {
        name: "Tenochtitlan",
        isHistorical: true,
        foundingYear: 1325,
        declineYear: 1521,
        description: "The magnificent island capital of the Aztec Empire, a vast metropolis of canals and pyramids.",
        allegianceHistory: {
            1325: "Aztec Empire"
        },
        urbanDensity: 'massive',
        populationPeak: 200000,
        economicFocus: ['government', 'trade', 'religion', 'military', 'agriculture']
    },
    {
        name: "Mexico City",
        isHistorical: true,
        foundingYear: 1522,
        description: "Built on the ruins of the Aztec capital, it became the center of the vast Viceroyalty of New Spain.",
        allegianceHistory: {
            1522: "Spanish Empire",
            1821: "Mexican Empire",
            1823: "United Mexican States"
        },
        urbanDensity: 'large',
        eraSpecificDensity: {
          'early_modern': 'large',
          'modern': 'massive'
        },
        populationPeak: 21500000,
        economicFocus: ['government', 'trade', 'manufacturing', 'services']
    }
  ],
  "Yucatán Peninsula": [
    {
      name: "Chichen Itza",
      isHistorical: true,
      foundingYear: 600,
      declineYear: 1200,
      description: "A magnificent Maya city dominated by the great pyramid of Kukulkan, center of learning and ritual.",
      allegianceHistory: {
        600: "Maya City-States"
      }
    }
  ],
  "Oaxaca Highlands": [
    {
      name: "Monte Albán",
      isHistorical: true,
      foundingYear: -500,
      declineYear: 750,
      description: "The mountain capital of the Zapotec civilization, commanding the valley with its terraced temples.",
      allegianceHistory: {
        [-500]: "Zapotec Civilization"
      }
    }
  ],
  "Cahokia Mounds": [
    {
      name: "Cahokia",
      isHistorical: true,
      foundingYear: 1050,
      declineYear: 1350,
      description: "The largest pre-Columbian settlement north of Mexico, a Mississippian metropolis of earthen mounds.",
      allegianceHistory: {
        1050: "Mississippian Culture"
      }
    }
  ],
  "Hudson River Valley": [
    {
      name: "New Amsterdam",
      isHistorical: true,
      foundingYear: 1624,
      declineYear: 1664,
      description: "The Dutch trading post that would become the greatest city of the New World.",
      allegianceHistory: {
        1624: "Dutch Empire"
      }
    },
    {
      name: "New York",
      isHistorical: true,
      foundingYear: 1665,
      description: "The bustling commercial heart of British America, gateway to the continent's riches.",
      allegianceHistory: {
        1665: "British Empire",
        1776: "United States"
      }
    }
  ],
  "Chesapeake Bay": [
    {
      name: "Jamestown",
      isHistorical: true,
      foundingYear: 1607,
      description: "The first permanent English settlement in America, birthplace of colonial Virginia.",
      allegianceHistory: {
        1607: "British Empire",
        1776: "United States"
      }
    }
  ],
  "Cuzco Valley": [
    {
        name: "Cusco",
        isHistorical: true,
        foundingYear: 1100,
        description: "The sacred and political capital of the vast Inca Empire, nestled high in the Andes.",
        allegianceHistory: {
            1100: "Kingdom of Cusco",
            1438: "Inca Empire",
            1533: "Spanish Empire",
            1821: "Peru"
        }
    }
  ],
  "Lake Titicaca Basin": [
    {
      name: "Tiwanaku",
      isHistorical: true,
      foundingYear: 300,
      declineYear: 1000,
      description: "The spiritual and administrative center of a great Andean empire, master of high-altitude agriculture.",
      allegianceHistory: {
        300: "Tiwanaku Empire"
      }
    }
  ],
  "Rio de Janeiro Bay": [
    {
      name: "Rio de Janeiro",
      isHistorical: true,
      foundingYear: 1565,
      description: "The marvelous city between mountains and sea, jewel of Portuguese America.",
      allegianceHistory: {
        1565: "Portuguese Empire",
        1822: "Empire of Brazil",
        1889: "Republic of Brazil"
      }
    }
  ],
  "São Paulo Plateau": [
    {
      name: "São Paulo",
      isHistorical: true,
      foundingYear: 1554,
      description: "A Jesuit mission that grew into the industrial powerhouse of South America.",
      allegianceHistory: {
        1554: "Portuguese Empire",
        1822: "Empire of Brazil"
      }
    }
  ],
  "Pampas Grasslands": [
    {
      name: "Buenos Aires",
      isHistorical: true,
      foundingYear: 1536,
      description: "The port of good winds, gateway to the riches of the Río de la Plata.",
      allegianceHistory: {
        1536: "Spanish Empire",
        1810: "United Provinces of the Río de la Plata",
        1861: "Argentine Republic"
      }
    }
  ],
  "Nile Delta": [
    {
        name: "Alexandria",
        isHistorical: true,
        foundingYear: -331,
        description: "Founded by Alexander the Great, a legendary center of Hellenistic learning and trade, home to the Great Library.",
        allegianceHistory: {
            [-331]: "Ptolemaic Kingdom",
            [-30]: "Roman Empire",
            641: "Rashidun Caliphate",
            1517: "Ottoman Empire"
        }
    }
  ],
  "Thebes Valley": [
    {
      name: "Thebes",
      isHistorical: true,
      foundingYear: -3200,
      description: "The magnificent capital of the New Kingdom, city of a hundred gates and the Valley of the Kings.",
      allegianceHistory: {
        [-3200]: "Ancient Egypt",
        [-30]: "Roman Empire",
        641: "Rashidun Caliphate"
      }
    }
  ],
  "Jerusalem Hills": [
    {
      name: "Jerusalem",
      isHistorical: true,
      foundingYear: -1000,
      description: "The holy city of three faiths, eternal focus of pilgrimage and prayer.",
      allegianceHistory: {
        [-1000]: "Kingdom of Israel",
        [-586]: "Babylonian Empire",
        [-332]: "Macedonian Empire",
        [-63]: "Roman Republic",
        638: "Rashidun Caliphate",
        1099: "Crusader States",
        1187: "Ayyubid Dynasty"
      }
    }
  ],
  "Tigris–Euphrates Confluence": [
    {
      name: "Baghdad",
      isHistorical: true,
      foundingYear: 762,
      description: "The round city of peace, capital of the Abbasid Caliphate and center of the Islamic Golden Age.",
      allegianceHistory: {
        762: "Abbasid Caliphate",
        1258: "Mongol Empire",
        1534: "Ottoman Empire"
      }
    }
  ],
  "Babylon Region": [
    {
      name: "Babylon",
      isHistorical: true,
      foundingYear: -2300,
      declineYear: 141,
      description: "The great city of Hammurabi and Nebuchadnezzar, where the Hanging Gardens amazed the ancient world.",
      allegianceHistory: {
        [-2300]: "Babylonian Empire",
        [-539]: "Persian Empire",
        [-331]: "Macedonian Empire",
        [-141]: "Parthian Empire"
      }
    }
  ],
  "Isfahan Basin": [
    {
      name: "Isfahan",
      isHistorical: true,
      foundingYear: 1598,
      description: "Half the world, as the Persians say - the magnificent Safavid capital of gardens and mosques.",
      allegianceHistory: {
        1598: "Safavid Empire",
        1722: "Afghan Invasion",
        1729: "Afsharid Dynasty"
      }
    }
  ],
  "Fez Plateau": [
    {
      name: "Fez",
      isHistorical: true,
      foundingYear: 789,
      description: "The ancient capital of Morocco, center of Islamic learning and the world's oldest university.",
      allegianceHistory: {
        789: "Idrisid Dynasty",
        1040: "Almoravid Dynasty",
        1121: "Almohad Dynasty",
        1244: "Marinid Dynasty"
      }
    }
  ],
  "Timbuktu Basin": [
    {
      name: "Timbuktu",
      isHistorical: true,
      foundingYear: 1100,
      description: "The mysterious city at the edge of the world, where salt meets gold and learning flourishes in the desert.",
      allegianceHistory: {
        1100: "Ghana Empire",
        1325: "Mali Empire",
        1468: "Songhai Empire",
        1591: "Moroccan Sultanate"
      }
    }
  ],
  "Niger Bend": [
    {
      name: "Gao",
      isHistorical: true,
      foundingYear: 700,
      description: "The imperial capital of the Songhai Empire, controlling the great bend of the Niger River.",
      allegianceHistory: {
        700: "Local Kingdoms",
        1009: "Kingdom of Gao",
        1464: "Songhai Empire",
        1591: "Moroccan Sultanate"
      }
    }
  ],
  "Ashanti Forest": [
    {
      name: "Kumasi",
      isHistorical: true,
      foundingYear: 1695,
      description: "The golden stool capital of the mighty Ashanti Empire, center of West African power and wealth.",
      allegianceHistory: {
        1695: "Ashanti Empire",
        1896: "British Empire"
      }
    }
  ],
  "Ibo Plateau": [
    {
      name: "Benin City",
      isHistorical: true,
      foundingYear: 1180,
      description: "The great walled city of the Benin Empire, famed for its bronze artistry and powerful Oba.",
      allegianceHistory: {
        1180: "Kingdom of Benin",
        1897: "British Empire"
      }
    }
  ],
  "Ethiopian Highlands": [
    {
      name: "Aksum",
      isHistorical: true,
      foundingYear: 100,
      declineYear: 960,
      description: "The ancient trading empire of towering stelae, bridge between Africa and the wider world.",
      allegianceHistory: {
        100: "Kingdom of Aksum"
      }
    }
  ],
  "Lake Victoria Basin": [
    {
      name: "Buganda",
      isHistorical: true,
      foundingYear: 1300,
      description: "The powerful kingdom on the shores of the great lake, master of banana cultivation and lakeside trade.",
      allegianceHistory: {
        1300: "Kingdom of Buganda",
        1894: "British Empire"
      }
    }
  ],
  "Cape Coast": [
    {
      name: "Cape Town",
      isHistorical: true,
      foundingYear: 1652,
      description: "The tavern of the seas, Dutch settlement at the southern tip of Africa.",
      allegianceHistory: {
        1652: "Dutch Empire",
        1795: "British Empire"
      }
    }
  ],
  "Harappa Basin": [
      {
        name: "Harappa",
        isHistorical: true,
        foundingYear: -2600,
        declineYear: -1900,
        description: "A major urban center of the Indus Valley Civilization, one of the world's earliest and most advanced civilizations.",
        allegianceHistory: {
            [-2600]: "Indus Valley Civilization"
        }
      }
  ],
  "Varanasi Basin": [
    {
      name: "Varanasi",
      isHistorical: true,
      foundingYear: -1200,
      description: "The eternal city on the Ganges, holiest of Hindu cities where pilgrims seek liberation.",
      allegianceHistory: {
        [-1200]: "Vedic Kingdoms",
        321: "Maurya Empire",
        320: "Gupta Empire",
        1194: "Delhi Sultanate",
        1526: "Mughal Empire"
      }
    }
  ],
  "Delhi Region": [
    {
      name: "Delhi",
      isHistorical: true,
      foundingYear: -1000,
      description: "The seat of empires, where the fate of India has been decided for a thousand years.",
      allegianceHistory: {
        [-1000]: "Indraprastha",
        1206: "Delhi Sultanate",
        1526: "Mughal Empire",
        1803: "British Empire"
      }
    }
  ],
  "Kandy Plateau": [
    {
      name: "Kandy",
      isHistorical: true,
      foundingYear: 1592,
      description: "The mountain capital of the last independent Sinhalese kingdom, guardian of the sacred tooth relic.",
      allegianceHistory: {
        1592: "Kingdom of Kandy",
        1815: "British Empire"
      }
    }
  ],
  "Yellow River Valley": [
      {
        name: "Yinxu",
        isHistorical: true,
        foundingYear: -1300,
        declineYear: -1046,
        description: "The last capital of the Shang dynasty, where the earliest known Chinese writing was discovered.",
        allegianceHistory: {
            [-1300]: "Shang Dynasty"
        }
      },
       {
        name: "Chang'an",
        isHistorical: true,
        foundingYear: -202,
        description: "The magnificent capital of several Chinese dynasties, including the Han and Tang, once the largest city in the world.",
        allegianceHistory: {
            [-202]: "Han Dynasty",
            581: "Sui Dynasty",
            618: "Tang Dynasty"
        }
      }
  ],
  "Beijing Basin": [
    {
      name: "Beijing",
      isHistorical: true,
      foundingYear: 1045,
      description: "The northern capital, seat of the Forbidden City and center of the Middle Kingdom.",
      allegianceHistory: {
        1045: "Zhou Dynasty",
        1153: "Jin Dynasty",
        1272: "Yuan Dynasty",
        1368: "Ming Dynasty",
        1644: "Qing Dynasty"
      }
    }
  ],
  "Pearl River Delta": [
    {
      name: "Canton",
      isHistorical: true,
      foundingYear: -214,
      description: "The great southern port, window to the world and gateway of Chinese trade.",
      allegianceHistory: {
        [-214]: "Qin Dynasty",
        [-206]: "Han Dynasty",
        618: "Tang Dynasty",
        960: "Song Dynasty",
        1368: "Ming Dynasty"
      }
    }
  ],
  "Kyoto Basin": [
    {
      name: "Kyoto",
      isHistorical: true,
      foundingYear: 794,
      description: "The imperial capital of a thousand years, heart of Japanese culture and the way of the court.",
      allegianceHistory: {
        794: "Imperial Court",
        1185: "Kamakura Shogunate",
        1333: "Ashikaga Shogunate",
        1603: "Tokugawa Shogunate"
      }
    }
  ],
  "Edo Plain": [
    {
      name: "Edo",
      isHistorical: true,
      foundingYear: 1457,
      description: "The shogun's city that became the largest in the world, center of the great peace.",
      allegianceHistory: {
        1457: "Ota Clan",
        1590: "Tokugawa Clan",
        1603: "Tokugawa Shogunate",
        1868: "Meiji Restoration"
      }
    }
  ],
  "Han River Valley": [
    {
      name: "Seoul",
      isHistorical: true,
      foundingYear: 1394,
      description: "The capital of the Hermit Kingdom, seat of Confucian learning and royal authority.",
      allegianceHistory: {
        1394: "Joseon Dynasty",
        1897: "Korean Empire",
        1910: "Japanese Empire"
      }
    }
  ],
  "Sydney Basin": [
    {
      name: "Sydney",
      isHistorical: true,
      foundingYear: 1788,
      description: "The first European settlement in Australia, built around one of the world's most beautiful harbors.",
      allegianceHistory: {
        1788: "British Empire",
        1901: "Commonwealth of Australia"
      }
    }
  ],
  "Canterbury Plains": [
    {
      name: "Christchurch",
      isHistorical: true,
      foundingYear: 1850,
      description: "The English city of the South Pacific, cathedral town on the Canterbury Plains.",
      allegianceHistory: {
        1850: "British Empire",
        1907: "Dominion of New Zealand"
      }
    }
  ],
  "Society Islands": [
    {
      name: "Tahiti",
      isHistorical: true,
      foundingYear: 300,
      description: "The queen of Polynesian islands, center of Pacific navigation and spiritual power.",
      allegianceHistory: {
        300: "Polynesian Chiefdoms",
        1880: "French Empire"
      }
    }
  ],
  "Big Island Highlands": [
    {
      name: "Honolulu",
      isHistorical: true,
      foundingYear: 1795,
      description: "The sheltered harbor that became capital of the unified Hawaiian Kingdom.",
      allegianceHistory: {
        1795: "Kingdom of Hawaii",
        1898: "United States"
      }
    }
  ],
  "Gobi Desert": [
    {
      name: "Karakorum",
      isHistorical: true,
      foundingYear: 1220,
      declineYear: 1267,
      description: "The legendary capital of the Mongol Empire, where Genghis Khan's successors ruled the world.",
      allegianceHistory: {
        1220: "Mongol Empire"
      }
    }
  ],

  // === MISSING NORTH AMERICAN CITIES ===
  "Great Lakes Shoreline": [
    {
      name: "Detroit",
      isHistorical: true,
      foundingYear: 1701,
      description: "A French fur trading post that became the motor city of America.",
      allegianceHistory: {
        1701: "New France",
        1760: "British Empire",
        1796: "United States"
      }
    }
  ],
  "Puget Sound": [
    {
      name: "Seattle",
      isHistorical: true,
      foundingYear: 1851,
      description: "A timber and fishing town that grew into the Pacific Northwest's major port.",
      allegianceHistory: {
        1851: "United States"
      }
    }
  ],
  "Colorado Plateau": [
    {
      name: "Mesa Verde",
      isHistorical: true,
      foundingYear: 600,
      declineYear: 1300,
      description: "Ancient Puebloan cliff dwellings, a marvel of indigenous architecture.",
      allegianceHistory: {
        600: "Ancestral Puebloans"
      }
    }
  ],
  "Platte River Basin": [
    {
      name: "Fort Laramie",
      isHistorical: true,
      foundingYear: 1834,
      description: "A crucial way station on the Oregon, California, and Mormon trails west.",
      allegianceHistory: {
        1834: "United States"
      }
    }
  ],

  // === MISSING CENTRAL ASIAN CITIES ===
  "Kazakh Steppes": [
    {
      name: "Almaty",
      isHistorical: true,
      foundingYear: 1854,
      description: "Founded as a Russian frontier fort, it became the major city of Kazakhstan.",
      allegianceHistory: {
        1854: "Russian Empire",
        1991: "Kazakhstan"
      }
    }
  ],
  "Altai Mountains": [
    {
      name: "Gorno-Altaysk",
      isHistorical: true,
      foundingYear: 1824,
      description: "A small mountain town serving as gateway to the Altai wilderness.",
      allegianceHistory: {
        1824: "Russian Empire",
        1991: "Russia"
      }
    }
  ],
  "Mongolian Steppes": [
    {
      name: "Ulaanbaatar",
      isHistorical: true,
      foundingYear: 1639,
      description: "The red hero city, ancient center of Mongolian Buddhism and modern capital.",
      allegianceHistory: {
        1639: "Mongol Tribes",
        1691: "Qing Dynasty",
        1921: "Mongolia"
      }
    }
  ],

  // === MISSING AFRICAN CITIES ===
  "Serengeti Plain": [
    {
      name: "Olduvai",
      isHistorical: true,
      foundingYear: -2000000,
      description: "The cradle of mankind, where early hominids first walked upright.",
      allegianceHistory: {
        [-2000000]: "Early Hominids"
      }
    }
  ],
  "Kalahari Basin": [
    {
      name: "Ghanzi",
      isHistorical: true,
      foundingYear: 1898,
      description: "A small outpost in the vast Kalahari, center of cattle ranching.",
      allegianceHistory: {
        1898: "British Empire",
        1966: "Botswana"
      }
    }
  ],
  "Congo River Bend": [
    {
      name: "Kinshasa",
      isHistorical: true,
      foundingYear: 1881,
      description: "Leopold's trading post that became the sprawling capital of the Congo.",
      allegianceHistory: {
        1881: "Congo Free State",
        1908: "Belgian Congo",
        1960: "Democratic Republic of Congo"
      }
    }
  ],

  // === MISSING OCEANIAN CITIES ===
  "Sydney Basin": [
    {
      name: "Sydney",
      isHistorical: true,
      foundingYear: 1788,
      description: "The first European settlement in Australia, built around one of the world's most beautiful harbors.",
      allegianceHistory: {
        1788: "British Empire",
        1901: "Commonwealth of Australia"
      }
    }
  ],
  "Canterbury Plains": [
    {
      name: "Christchurch",
      isHistorical: true,
      foundingYear: 1850,
      description: "The English city of the South Pacific, cathedral town on the Canterbury Plains.",
      allegianceHistory: {
        1850: "British Empire",
        1907: "Dominion of New Zealand"
      }
    }
  ],
  "Sepik River Basin": [
    {
      name: "Wewak",
      isHistorical: true,
      foundingYear: 1885,
      description: "A German colonial outpost that became Papua New Guinea's northern port.",
      allegianceHistory: {
        1885: "German Empire",
        1914: "British Empire",
        1975: "Papua New Guinea"
      }
    }
  ],

  // === MISSING SOUTH AMERICAN CITIES ===
  "Manaus Region": [
    {
      name: "Manaus",
      isHistorical: true,
      foundingYear: 1669,
      description: "The rubber boom capital deep in the Amazon rainforest.",
      allegianceHistory: {
        1669: "Portuguese Empire",
        1822: "Empire of Brazil",
        1889: "Republic of Brazil"
      }
    }
  ],
  "Orinoco Delta": [
    {
      name: "Ciudad Guayana",
      isHistorical: true,
      foundingYear: 1961,
      description: "A planned industrial city at the confluence of great rivers.",
      allegianceHistory: {
        1961: "Venezuela"
      }
    }
  ],

  // === MISSING ASIAN CITIES ===
  "Western Siberia": [
    {
      name: "Novosibirsk",
      isHistorical: true,
      foundingYear: 1893,
      description: "The Chicago of Siberia, built where the Trans-Siberian Railway crosses the Ob.",
      allegianceHistory: {
        1893: "Russian Empire",
        1991: "Russia"
      }
    }
  ],
  "Yellow River Valley": [
    {
      name: "Yinxu",
      isHistorical: true,
      foundingYear: -1300,
      declineYear: -1046,
      description: "The last capital of the Shang dynasty, where the earliest known Chinese writing was discovered.",
      allegianceHistory: {
        [-1300]: "Shang Dynasty"
      }
    },
    {
      name: "Chang'an",
      isHistorical: true,
      foundingYear: -202,
      description: "The magnificent capital of several Chinese dynasties, including the Han and Tang, once the largest city in the world.",
      allegianceHistory: {
        [-202]: "Han Dynasty",
        581: "Sui Dynasty",
        618: "Tang Dynasty"
      }
    }
  ],
  "Beijing Basin": [
    {
      name: "Beijing",
      isHistorical: true,
      foundingYear: 1045,
      description: "The northern capital, seat of the Forbidden City and center of the Middle Kingdom.",
      allegianceHistory: {
        1045: "Zhou Dynasty",
        1153: "Jin Dynasty",
        1272: "Yuan Dynasty",
        1368: "Ming Dynasty",
        1644: "Qing Dynasty"
      }
    }
  ],
  "Pearl River Delta": [
    {
      name: "Canton",
      isHistorical: true,
      foundingYear: -214,
      description: "The great southern port, window to the world and gateway of Chinese trade.",
      allegianceHistory: {
        [-214]: "Qin Dynasty",
        [-206]: "Han Dynasty",
        618: "Tang Dynasty",
        960: "Song Dynasty",
        1368: "Ming Dynasty"
      }
    }
  ],

  // === MORE MISSING REGIONS ===
  "Empty Quarter": [
    {
      name: "Rub' al Khali Oasis",
      isHistorical: false,
      foundingYear: 400,
      description: "A rare oasis in the world's largest continuous sand desert.",
      allegianceHistory: {
        400: "Bedouin Tribes",
        1932: "Saudi Arabia"
      }
    }
  ],
  "Sahara Desert": [
    {
      name: "Taghaza",
      isHistorical: true,
      foundingYear: 1200,
      description: "The salt mines that made the trans-Saharan trade possible.",
      allegianceHistory: {
        1200: "Ghana Empire",
        1325: "Mali Empire",
        1591: "Moroccan Sultanate"
      }
    }
  ]
};
