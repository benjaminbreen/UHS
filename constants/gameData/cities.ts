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
  // New areas
  "Long Island": [
    {
      name: "Brooklyn",
      isHistorical: true,
      foundingYear: 1634,
      description: "A Dutch colonial settlement that grew into a major urban center.",
      allegianceHistory: {
        1634: "Dutch West India Company",
        1664: "English Colony of New York",
        1776: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      economicFocus: ['trade', 'shipping', 'agriculture']
    }
  ],
  "Texas Hill Country": [
    {
      name: "San Antonio",
      isHistorical: true,
      foundingYear: 1718,
      description: "A Spanish colonial mission town that became a major frontier city.",
      allegianceHistory: {
        1718: "Spanish Empire",
        1821: "Mexican Republic",
        1836: "Republic of Texas",
        1845: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['missions', 'ranching', 'military']
    },
    {
      name: "Austin",
      isHistorical: true,
      foundingYear: 1839,
      description: "Capital of the Republic of Texas, named after Stephen F. Austin.",
      allegianceHistory: {
        1839: "Republic of Texas",
        1845: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['government', 'education', 'trade']
    }
  ],
  "Gulf Coast Texas": [
    {
      name: "Houston",
      isHistorical: true,
      foundingYear: 1836,
      description: "A port city founded after Texas independence, gateway to the interior.",
      allegianceHistory: {
        1836: "Republic of Texas",
        1845: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      economicFocus: ['shipping', 'cotton', 'oil']
    },
    {
      name: "Galveston",
      isHistorical: true,
      foundingYear: 1839,
      description: "A major port city and commercial center on the Gulf Coast.",
      allegianceHistory: {
        1839: "Republic of Texas",
        1845: "United States"
      },
      urbanDensity: 'moderate',
      economicFocus: ['shipping', 'trade', 'immigration']
    }
  ],
  "Swahili Coast": [
    {
      name: "Kilwa",
      isHistorical: true,
      foundingYear: 957,
      declineYear: 1505,
      description: "A wealthy Swahili city-state controlling the gold trade from the interior.",
      allegianceHistory: {
        957: "Kilwa Sultanate",
        1505: "Portuguese Empire"
      },
      urbanDensity: 'large',
      populationPeak: 20000,
      economicFocus: ['gold', 'ivory', 'slaves', 'trade']
    },
    {
      name: "Mogadishu",
      isHistorical: true,
      foundingYear: 900,
      description: "An ancient port city and center of Islamic learning on the Horn of Africa.",
      allegianceHistory: {
        900: "Mogadishu Sultanate",
        1892: "Italian Somaliland"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'textiles', 'islamic_scholarship']
    }
  ],
  "Hejaz Mountains": [
    {
      name: "Mecca",
      isHistorical: true,
      foundingYear: -400,
      description: "The holiest city in Islam, birthplace of the Prophet Muhammad.",
      allegianceHistory: {
        "-400": "Quraysh Tribe",
        630: "Rashidun Caliphate",
        661: "Umayyad Caliphate",
        750: "Abbasid Caliphate",
        1517: "Ottoman Empire",
        1924: "Kingdom of Saudi Arabia"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['pilgrimage', 'trade', 'religion']
    },
    {
      name: "Medina",
      isHistorical: true,
      foundingYear: -500,
      description: "The second holiest city in Islam, where Muhammad established the first Muslim community.",
      allegianceHistory: {
        "-500": "Local Tribes",
        622: "Islamic State of Medina",
        661: "Umayyad Caliphate",
        750: "Abbasid Caliphate",
        1517: "Ottoman Empire",
        1924: "Kingdom of Saudi Arabia"
      },
      urbanDensity: 'moderate',
      economicFocus: ['pilgrimage', 'agriculture', 'religion']
    }
  ],
  "Galicia": [
    {
      name: "Santiago de Compostela",
      isHistorical: true,
      foundingYear: 820,
      description: "A major Christian pilgrimage destination, endpoint of the Camino de Santiago.",
      allegianceHistory: {
        820: "Kingdom of Asturias",
        910: "Kingdom of León",
        1230: "Crown of Castile",
        1479: "Kingdom of Spain"
      },
      urbanDensity: 'moderate',
      economicFocus: ['pilgrimage', 'religion', 'education']
    }
  ],
  "Transylvania": [
    {
      name: "Cluj",
      isHistorical: true,
      foundingYear: 1213,
      description: "A major city in Transylvania, center of trade and learning.",
      allegianceHistory: {
        1213: "Kingdom of Hungary",
        1541: "Principality of Transylvania",
        1699: "Habsburg Empire",
        1867: "Austria-Hungary",
        1918: "Kingdom of Romania"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'crafts', 'education']
    }
  ],
  "Hokkaido": [
    {
      name: "Sapporo",
      isHistorical: true,
      foundingYear: 1868,
      description: "A modern planned city established during the Meiji Restoration.",
      allegianceHistory: {
        1868: "Empire of Japan"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['agriculture', 'brewing', 'administration']
    }
  ],
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
        populationPeak: 7900000,
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
        "-52": "Roman Empire"
      }
    },
    {
      name: "Paris",
      isHistorical: true,
      foundingYear: 361,
      populationPeak: 14000000,
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
          'RENAISSANCE_EARLY_MODERN': 'large',
          'INDUSTRIAL_ERA': 'large',
          'MODERN_ERA': 'massive',
          'FUTURE_ERA': 'massive'
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
      name: "New York City",
      isHistorical: true,
      foundingYear: 1665,
      description: "The bustling commercial heart of North America, gateway to the continent's riches.",
      allegianceHistory: {
        1665: "British Empire",
        1776: "United States"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'RENAISSANCE_EARLY_MODERN': 'small',
        'INDUSTRIAL_ERA': 'large',
        'MODERN_ERA': 'massive',
        'FUTURE_ERA': 'massive'
      },
      populationPeak: 12336000,
      economicFocus: ['finance', 'trade', 'shipping', 'manufacturing', 'services']
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
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'RENAISSANCE_EARLY_MODERN': 'small',
        'INDUSTRIAL_ERA': 'large',
        'MODERN_ERA': 'massive',
        'FUTURE_ERA': 'massive'
      },
      populationPeak: 6036000,
      economicFocus: ['trade', 'shipping', 'manufacturing']
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
     },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'RENAISSANCE_EARLY_MODERN': 'small',
        'INDUSTRIAL_ERA': 'large',
        'MODERN_ERA': 'massive',
        'FUTURE_ERA': 'massive'
      },
      populationPeak: 15336000,
      economicFocus: ['finance', 'trade', 'manufacturing', 'services']
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
    description: "The ancient trading empire of towering stelae, a highland hub linking Africa to the wider world.",
    allegianceHistory: {
      100: "Kingdom of Aksum"
    }
  },
  {
    name: "Gondar",
    isHistorical: true,
    foundingYear: 1635,
    description: "The fortress-capital of Ethiopia, famed for the Fasil Ghebbi palace complex and church art.",
    allegianceHistory: {
      1635: "Ethiopian Empire"
    },
    urbanDensity: "moderate",
    economicFocus: ["government", "religion", "architecture"]
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
      populationPeak: 21700000, // Modern Beijing metropolitan area
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
      populationPeak: 14000000, // Modern Guangzhou
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
      name: "Tokyo",
      isHistorical: true,
      foundingYear: 1457,
      populationPeak: 24000000,
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
  "Central Sahara": [
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
  ],
// === AFRICA ===
  "Tunisian Sahel": [
    {
        name: "Carthage",
        isHistorical: true,
        foundingYear: -814,
        declineYear: 698,
        description: "The great Phoenician rival to Rome, a maritime empire that dominated the Western Mediterranean.",
        allegianceHistory: {
            "-814": "Carthaginian Republic",
            "-146": "Roman Republic",
            439: "Vandal Kingdom",
            534: "Byzantine Empire",
            698: "Umayyad Caliphate"
        },
        urbanDensity: 'massive',
        populationPeak: 500000,
        economicFocus: ['trade', 'navy', 'mercenaries', 'agriculture']
    }
  ],
  "Bekaa Valley": [
    {
      name: "Damascus",
      isHistorical: true,
      foundingYear: -3000,
      description: "One of the oldest continuously inhabited cities, capital of the Umayyad Caliphate at its height.",
      allegianceHistory: {
        "-3000": "Ancient Semitic Peoples",
        "-64": "Roman Empire",
        661: "Umayyad Caliphate",
        750: "Abbasid Caliphate",
        1516: "Ottoman Empire"
      },
      urbanDensity: 'large',
      economicFocus: ['trade', 'steel', 'crafts', 'religion']
    }
  ],
  "Limpopo Valley": [
    {
      name: "Great Zimbabwe",
      isHistorical: true,
      foundingYear: 1100,
      declineYear: 1450,
      description: "The monumental stone capital of a vast southern African kingdom, built on the gold trade.",
      allegianceHistory: {
        1100: "Kingdom of Zimbabwe"
      },
      urbanDensity: 'moderate',
      populationPeak: 18000,
      economicFocus: ['gold', 'trade', 'cattle', 'monumental_architecture']
    },
    {
        name: "Gondar",
        isHistorical: true,
        foundingYear: 1635,
        description: "The fortress-capital of Ethiopia, famed for its unique imperial castle complex, the Fasil Ghebbi.",
        allegianceHistory: {
            1635: "Ethiopian Empire"
        },
        urbanDensity: 'moderate',
        economicFocus: ['government', 'religion', 'architecture']
    }
  ],

  // === EUROPE ===
  "Catalonian Hills": [
    {
      name: "Barcelona",
      isHistorical: true,
      foundingYear: -15,
      description: "A Roman port that grew into the capital of the powerful Crown of Aragon.",
      allegianceHistory: {
        "-15": "Roman Empire",
        801: "Carolingian Empire",
        988: "County of Barcelona",
        1162: "Crown of Aragon",
        1714: "Kingdom of Spain"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
          'modern': 'large'
      },
      economicFocus: ['trade', 'shipping', 'textiles']
    }
  ],
  "Cilician Plain": [
    {
        name: "Antioch",
        isHistorical: true,
        foundingYear: -300,
        description: "A magnificent Hellenistic city, a cradle of early Christianity and a key Crusader prize.",
        allegianceHistory: {
            "-300": "Seleucid Empire",
            "-64": "Roman Empire",
            395: "Byzantine Empire",
            1098: "Crusader States",
            1268: "Mamluk Sultanate"
        },
        urbanDensity: 'large',
        populationPeak: 500000,
        economicFocus: ['trade', 'philosophy', 'religion', 'silk']
    }
  ],
  "Champlain Valley": [
    {
        name: "Quebec City",
        isHistorical: true,
        foundingYear: 1608,
        description: "The Gibraltar of North America, the fortified capital of New France.",
        allegianceHistory: {
            1608: "New France",
            1763: "British Empire",
            1867: "Canada"
        },
        urbanDensity: 'small',
        eraSpecificDensity: {
            'modern': 'moderate'
        },
        economicFocus: ['fur_trade', 'military', 'government']
    }
  ],
  "Hamburg Coast": [
    {
        name: "Hamburg",
        isHistorical: true,
        foundingYear: 808,
        description: "A powerful free city and a leading member of the Hanseatic League, dominating North Sea trade.",
        allegianceHistory: {
            808: "Carolingian Empire",
            1189: "Holy Roman Empire (Free City)",
            1510: "Hanseatic League"
        },
        urbanDensity: 'moderate',
        eraSpecificDensity: {
            'modern': 'large'
        },
        economicFocus: ['trade', 'shipping', 'brewing']
    }
  ],
  "Loire Valley": [
    {
        name: "Lyon",
        isHistorical: true,
        foundingYear: -43,
        description: "Lugdunum, the capital of Roman Gaul and a center of silk-weaving and banking in the Renaissance.",
        allegianceHistory: {
            "-43": "Roman Empire",
            461: "Kingdom of the Burgundians",
            1312: "Kingdom of France"
        },
        urbanDensity: 'moderate',
        eraSpecificDensity: {
            'ancient': 'large',
            'modern': 'large'
        },
        economicFocus: ['administration', 'trade', 'silk', 'banking']
    }
  ],
  "Flanders Fields": [
    {
      name: "Bruges",
      isHistorical: true,
      foundingYear: 864,
      description: "A wealthy medieval metropolis, whose canals and merchants made it a center of Northern European trade.",
      allegianceHistory: {
        864: "County of Flanders",
        1384: "Duchy of Burgundy",
        1482: "Habsburg Netherlands"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'early_modern': 'moderate'
      },
      economicFocus: ['textiles', 'trade', 'banking', 'art']
    }
  ],
  "Scheldt Basin": [
    {
      name: "Antwerp",
      isHistorical: true,
      foundingYear: 900,
      description: "A bustling port that became the wealthiest city in Europe during the 16th century.",
      allegianceHistory: {
        900: "Holy Roman Empire",
        1500: "Habsburg Netherlands",
        1830: "Belgium"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'large'
      },
      economicFocus: ['trade', 'finance', 'sugar', 'diamonds']
    }
  ],
  "Po Valley": [
    {
      name: "Milan",
      isHistorical: true,
      foundingYear: -400,
      description: "The capital of the Western Roman Empire and later a powerful ducal seat and center of the Renaissance.",
      allegianceHistory: {
        "-222": "Roman Republic",
        286: "Western Roman Empire",
        1395: "Duchy of Milan",
        1535: "Spanish Empire"
      },
      urbanDensity: 'large',
      economicFocus: ['finance', 'armor', 'fashion', 'trade']
    },
    {
      name: "Genoa",
      isHistorical: true,
      foundingYear: -400,
      description: "The proud maritime republic, whose powerful navy and savvy merchants rivaled Venice for control of the seas.",
      allegianceHistory: {
        "-209": "Roman Republic",
        1005: "Republic of Genoa",
        1815: "Kingdom of Sardinia"
      },
      urbanDensity: 'moderate',
      economicFocus: ['shipping', 'banking', 'trade', 'navy']
    }
  ],
  "Norwegian Fjords": [
    {
      name: "Bergen",
      isHistorical: true,
      foundingYear: 1070,
      description: "Norway's ancient capital and a key foreign office of the Hanseatic League, built on the stockfish trade.",
      allegianceHistory: {
        1070: "Kingdom of Norway",
        1360: "Hanseatic League (Kontor)",
        1754: "Denmark-Norway"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'fishing', 'shipping']
    }
  ],
  "Carpathian Foothills": [
    {
      name: "Krakow",
      isHistorical: true,
      foundingYear: 966,
      description: "The royal capital of Poland during its Golden Age, a center of learning and culture.",
      allegianceHistory: {
        966: "Duchy of Poland",
        1038: "Kingdom of Poland",
        1795: "Habsburg Monarchy"
      },
      urbanDensity: 'moderate',
      economicFocus: ['government', 'salt', 'trade', 'education']
    }
  ],
  "Stockholm Archipelago": [
    {
        name: "Stockholm",
        isHistorical: true,
        foundingYear: 1252,
        description: "The city built on islands, capital of the Swedish Empire during its age of greatness.",
        allegianceHistory: {
            1252: "Kingdom of Sweden"
        },
        urbanDensity: 'moderate',
        eraSpecificDensity: {
            'early_modern': 'moderate',
            'modern': 'large'
        },
        economicFocus: ['government', 'trade', 'iron', 'military']
    }
  ],
  
  // === ASIA ===
  "Mekong River Basin": [
    {
        name: "Angkor",
        isHistorical: true,
        foundingYear: 802,
        declineYear: 1431,
        description: "The vast temple-city and capital of the mighty Khmer Empire, a wonder of the world.",
        allegianceHistory: {
            802: "Khmer Empire"
        },
        urbanDensity: 'massive',
        populationPeak: 750000,
        economicFocus: ['religion', 'government', 'water_management', 'rice']
    },
    {
        name: "Ayutthaya",
        isHistorical: true,
        foundingYear: 1351,
        declineYear: 1767,
        description: "The flourishing island capital of the Kingdom of Siam, a cosmopolitan center of global trade.",
        allegianceHistory: {
            1351: "Ayutthaya Kingdom"
        },
        urbanDensity: 'large',
        populationPeak: 1000000,
        economicFocus: ['trade', 'diplomacy', 'crafts']
    }
  ],
  "Strait of Malacca": [
    {
        name: "Malacca",
        isHistorical: true,
        foundingYear: 1400,
        description: "A vital strategic port controlling the strait between India and China, coveted by all empires.",
        allegianceHistory: {
            1400: "Sultanate of Malacca",
            1511: "Portuguese Empire",
            1641: "Dutch Empire",
            1824: "British Empire"
        },
        urbanDensity: 'large',
        economicFocus: ['spices', 'trade', 'shipping']
    }
  ],
  "Yangtze Gorges": [
    {
        name: "Nanjing",
        isHistorical: true,
        foundingYear: -495,
        populationPeak: 8500000, // Modern Nanjing
        description: "The great southern capital of several Chinese dynasties, rivaling Beijing for preeminence.",
        allegianceHistory: {
            229: "Kingdom of Wu",
            1368: "Ming Dynasty",
            1912: "Republic of China"
        },
        urbanDensity: 'large',
        economicFocus: ['government', 'trade', 'textiles', 'shipbuilding']
    },
    {
        name: "Shanghai",
        isHistorical: true,
        foundingYear: 960,
        populationPeak: 24300000, // Modern Shanghai metropolitan area
        description: "The Pearl of the Orient, China's largest city and global financial center.",
        allegianceHistory: {
            960: "Song Dynasty",
            1368: "Ming Dynasty",
            1644: "Qing Dynasty",
            1842: "Treaty Port",
            1949: "People's Republic of China"
        },
        urbanDensity: 'massive',
        economicFocus: ['trade', 'banking', 'manufacturing', 'shipping']
    },
    {
        name: "Hangzhou",
        isHistorical: true,
        foundingYear: 221,
        description: "A city of heavenly beauty, capital of the Southern Song and southern terminus of the Grand Canal.",
        allegianceHistory: {
            589: "Sui Dynasty",
            1132: "Southern Song Dynasty",
            1276: "Yuan Dynasty"
        },
        urbanDensity: 'large',
        eraSpecificDensity: {
            'medieval': 'massive'
        },
        economicFocus: ['trade', 'silk', 'art', 'poetry']
    }
  ],
  "Gyeongju Basin": [
    {
        name: "Gyeongju",
        isHistorical: true,
        foundingYear: -57,
        declineYear: 935,
        description: "The golden capital of the Silla Kingdom, which unified the Korean peninsula.",
        allegianceHistory: {
            "-57": "Silla Kingdom",
            668: "Unified Silla"
        },
        urbanDensity: 'large',
        economicFocus: ['government', 'buddhism', 'art', 'astronomy']
    }
  ],
  "Sumatra Highlands": [
    {
        name: "Palembang",
        isHistorical: true,
        foundingYear: 671,
        description: "The powerful capital of the Srivijayan maritime empire, controlling the seas of Southeast Asia.",
        allegianceHistory: {
            671: "Srivijaya Empire",
            1377: "Majapahit Empire"
        },
        urbanDensity: 'large',
        economicFocus: ['trade', 'navy', 'buddhism', 'tribute']
    }
  ],
  "Karnataka Plateau": [
    {
        name: "Vijayanagara",
        isHistorical: true,
        foundingYear: 1336,
        declineYear: 1565,
        description: "The City of Victory, the sprawling capital of the last great Hindu kingdom of Southern India.",
        allegianceHistory: {
            1336: "Vijayanagara Empire"
        },
        urbanDensity: 'large',
        populationPeak: 500000,
        economicFocus: ['trade', 'diamonds', 'military', 'temples']
    }
  ],
  "Samarkand Region": [
    {
        name: "Samarkand",
        isHistorical: true,
        foundingYear: -700,
        description: "The jewel of the Silk Road, made the glittering capital of a vast empire by Timur (Tamerlane).",
        allegianceHistory: {
            "-329": "Macedonian Empire",
            712: "Umayyad Caliphate",
            1370: "Timurid Empire",
            1500: "Khanate of Bukhara"
        },
        urbanDensity: 'large',
        economicFocus: ['trade', 'silk', 'paper', 'astronomy', 'architecture']
    }
  ],
  "Nara Uplands": [
    {
        name: "Nara",
        isHistorical: true,
        foundingYear: 710,
        declineYear: 784,
        description: "The first permanent imperial capital of Japan, a center of Buddhist art and learning.",
        allegianceHistory: {
            710: "Imperial Court (Nara Period)"
        },
        urbanDensity: 'moderate',
        economicFocus: ['government', 'buddhism', 'art']
    }
  ],
  "Irrawaddy Valley": [
    {
        name: "Pagan",
        isHistorical: true,
        foundingYear: 849,
        declineYear: 1297,
        description: "The city of four million pagodas, capital of the first unified Burmese empire.",
        allegianceHistory: {
            849: "Pagan Kingdom"
        },
        urbanDensity: 'large',
        economicFocus: ['religion', 'architecture', 'agriculture']
    }
  ],
  "Shiraz Valley": [
    {
        name: "Persepolis",
        isHistorical: true,
        foundingYear: -515,
        declineYear: -330,
        description: "The magnificent ceremonial capital of the Achaemenid Persian Empire, built to awe the world.",
        allegianceHistory: {
            "-515": "Achaemenid Empire"
        },
        urbanDensity: 'moderate',
        economicFocus: ['government', 'tribute', 'ceremony', 'monumental_architecture']
    }
  ],
  "Novgorod Woods": [
    {
        name: "Novgorod",
        isHistorical: true,
        foundingYear: 859,
        description: "A powerful merchant republic of the Rus, and a key eastern outpost of the Hanseatic League.",
        allegianceHistory: {
            859: "Novgorod Republic",
            1478: "Grand Duchy of Moscow"
        },
        urbanDensity: 'moderate',
        economicFocus: ['trade', 'furs', 'wax', 'republicanism']
    }
  ],
  
  // === THE AMERICAS ===
  "Quito Plateau": [
    {
        name: "Bogota",
        isHistorical: true,
        foundingYear: 1538,
        description: "The highland city of the Muisca, a center of goldwork and the legend of El Dorado.",
        allegianceHistory: {
            600: "Muisca Confederation",
            1538: "Spanish Empire",
            1819: "Gran Colombia",
            1831: "Republic of New Granada"
        },
        urbanDensity: 'moderate',
        economicFocus: ['gold', 'salt', 'trade', 'administration']
    }
  ],
  "Cape Cod": [
    {
      name: "Boston",
      isHistorical: true,
      foundingYear: 1630,
      description: "The Puritan 'City upon a Hill' that became the cradle of the American Revolution.",
      allegianceHistory: {
        1630: "Massachusetts Bay Colony (English)",
        1776: "United States"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['shipping', 'trade', 'education', 'rebellion']
    }
  ],
  "Delaware River Valley": [
    {
      name: "Philadelphia",
      isHistorical: true,
      foundingYear: 1682,
      description: "The city of brotherly love, the first capital of the United States and a center of enlightenment thought.",
      allegianceHistory: {
        1682: "Colony of Pennsylvania (English)",
        1776: "United States"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large'
      },
      economicFocus: ['government', 'trade', 'philosophy', 'medicine']
    }
  ],
  "Lower Mississippi Delta": [
    {
      name: "New Orleans",
      isHistorical: true,
      foundingYear: 1718,
      description: "A vibrant crescent city controlling the mouth of the Mississippi, a melting pot of cultures.",
      allegianceHistory: {
        1718: "New France",
        1763: "Spanish Empire",
        1803: "United States"
      },
      urbanDensity: 'moderate',
      economicFocus: ['shipping', 'trade', 'sugar', 'cotton']
    }
  ],
// === EUROPE ===
  "Iberian Peninsula": [
    {
      name: "Granada",
      isHistorical: true,
      foundingYear: -500,
      description: "The last jewel of Al-Andalus, famed for its magnificent Alhambra palace.",
      allegianceHistory: {
        756: "Emirate of Córdoba",
        1238: "Emirate of Granada (Nasrid Dynasty)",
        1492: "Kingdom of Castile"
      },
      urbanDensity: 'moderate',
      economicFocus: ['silk', 'agriculture', 'poetry', 'architecture']
    }
  ],
  "Apennine Foothills": [
    {
      name: "Pisa",
      isHistorical: true,
      foundingYear: -180,
      description: "A powerful maritime republic, whose naval prowess and architectural marvels challenged its rivals.",
      allegianceHistory: {
        "-180": "Roman Republic",
        1000: "Republic of Pisa",
        1406: "Republic of Florence"
      },
      urbanDensity: 'moderate',
      economicFocus: ['shipping', 'trade', 'architecture', 'navy']
    }
  ],
  "Brandenburg Plain": [
    {
      name: "Lübeck",
      isHistorical: true,
      foundingYear: 1143,
      description: "The queen of the Hanseatic League, a free imperial city that dominated Baltic trade for centuries.",
      allegianceHistory: {
        1143: "County of Holstein",
        1226: "Free Imperial City (Hanseatic League)",
        1871: "German Empire"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'salt', 'shipping', 'law']
    }
  ],
  "Dalmatian Coast": [
    {
      name: "Ragusa",
      isHistorical: true,
      foundingYear: 614,
      declineYear: 1808,
      description: "A wealthy and independent maritime republic on the Adriatic, a rival to Venice.",
      allegianceHistory: {
        614: "Byzantine Empire",
        1205: "Republic of Venice (Suzerainty)",
        1358: "Republic of Ragusa",
        1808: "Napoleonic Kingdom of Italy"
      },
      urbanDensity: 'moderate',
      economicFocus: ['shipping', 'diplomacy', 'trade']
    }
  ],
  "Thessalian Plain": [
    {
      name: "Thessaloniki",
      isHistorical: true,
      foundingYear: -315,
      description: "The second city of the Byzantine Empire and a major port and cultural melting pot under the Ottomans.",
      allegianceHistory: {
        "-315": "Kingdom of Macedon",
        "-148": "Roman Empire",
        395: "Byzantine Empire",
        1430: "Ottoman Empire",
        1912: "Kingdom of Greece"
      },
      urbanDensity: 'large',
      economicFocus: ['trade', 'port', 'religion', 'military']
    }
  ],
  "British Isles": [
    {
      name: "Manchester",
      isHistorical: true,
      foundingYear: 79,
      description: "The Roman fort of Mamucium that exploded into the world's first industrial city.",
      allegianceHistory: {
        79: "Roman Empire",
        1066: "Kingdom of England",
        1707: "British Empire"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'ancient': 'small',
        'modern': 'massive'
      },
      economicFocus: ['textiles', 'industry', 'trade', 'innovation']
    }
  ],

  // === ASIA & MENA ===
  "Ferghana Valley": [
    {
        name: "Merv",
        isHistorical: true,
        foundingYear: -500,
        declineYear: 1221,
        description: "An ancient oasis city on the Silk Road, once one of the largest and most brilliant cities in the world.",
        allegianceHistory: {
            "-500": "Achaemenid Empire",
            700: "Umayyad Caliphate",
            1037: "Seljuk Empire",
            1221: "Mongol Empire"
        },
        urbanDensity: 'massive',
        populationPeak: 500000,
        economicFocus: ['trade', 'silk', 'science', 'libraries']
    }
  ],
  "Malabar Coast": [
    {
      name: "Calicut",
      isHistorical: true,
      foundingYear: 1042,
      description: "The city of spices, a major trading port on the Malabar Coast and the first landing site of Vasco da Gama.",
      allegianceHistory: {
        1042: "Zamorins of Calicut",
        1766: "Kingdom of Mysore",
        1792: "British Empire"
      },
      urbanDensity: 'moderate',
      economicFocus: ['spices', 'pepper', 'trade', 'shipping']
    }
  ],
  "Western Ghats": [
    {
      name: "Goa",
      isHistorical: true,
      foundingYear: 100,
      description: "The golden capital of the Portuguese Empire in the East, a center of trade and Christian conversion.",
      allegianceHistory: {
        1370: "Vijayanagara Empire",
        1469: "Bahmani Sultanate",
        1510: "Portuguese Empire",
        1961: "India"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'spices', 'religion', 'shipping']
    }
  ],
  "Punjab Plains": [
    {
      name: "Lahore",
      isHistorical: true,
      foundingYear: 100,
      description: "A magnificent garden city and a capital of the Mughal Empire, guarding the gateway to the Indian subcontinent.",
      allegianceHistory: {
        1021: "Ghaznavid Empire",
        1524: "Mughal Empire",
        1799: "Sikh Empire",
        1849: "British Empire"
      },
      urbanDensity: 'large',
      economicFocus: ['government', 'trade', 'architecture', 'military']
    }
  ],
  "Java Sea": [
    {
      name: "Batavia",
      isHistorical: true,
      foundingYear: 1619,
      description: "The fortified headquarters of the Dutch East India Company (VOC), commanding the spice trade of the archipelago.",
      allegianceHistory: {
        1619: "Dutch East India Company",
        1799: "Dutch East Indies",
        1949: "Indonesia"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      economicFocus: ['trade', 'spices', 'shipping', 'administration']
    }
  ],
  "Tibetan Plateau": [
    {
      name: "Lhasa",
      isHistorical: true,
      foundingYear: 637,
      description: "The forbidden city on the roof of the world, the holy center of Tibetan Buddhism and home of the Dalai Lamas.",
      allegianceHistory: {
        637: "Tibetan Empire",
        1642: "Ganden Phodrang Government",
        1720: "Qing Dynasty (Protectorate)"
      },
      urbanDensity: 'small',
      economicFocus: ['religion', 'government', 'monasticism']
    }
  ],
  "Inland Sea Coast": [
    {
      name: "Osaka",
      isHistorical: true,
      foundingYear: 1496,
      description: "The commercial heart of Japan, a city of merchants, canals, and a formidable castle.",
      allegianceHistory: {
        1496: "Jodo Shinshu (Temple-City)",
        1583: "Toyotomi Hideyoshi",
        1615: "Tokugawa Shogunate"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      economicFocus: ['trade', 'rice', 'finance', 'crafts']
    }
  ],
  "Mesopotamia": [
    {
        name: "Susa",
        isHistorical: true,
        foundingYear: -4200,
        description: "An ancient capital of Elam and a favorite administrative center of the Persian Achaemenid Empire.",
        allegianceHistory: {
            "-4200": "Elamite Civilization",
            "-539": "Achaemenid Empire",
            "-331": "Macedonian Empire",
            638: "Rashidun Caliphate"
        },
        urbanDensity: 'moderate',
        economicFocus: ['administration', 'trade', 'agriculture']
    }
  ],
  "Mount Lebanon Range": [
    {
        name: "Tyre",
        isHistorical: true,
        foundingYear: -2750,
        description: "The great island-fortress of Phoenicia, a mercantile powerhouse that founded colonies across the sea.",
        allegianceHistory: {
            "-2750": "Phoenician City-State",
            "-332": "Macedonian Empire",
            "-64": "Roman Empire",
            638: "Rashidun Caliphate"
        },
        urbanDensity: 'moderate',
        economicFocus: ['trade', 'shipping', 'colonization', 'purple_dye']
    }
  ],

  // === AFRICA (CONTINUED) ===
  "Nile Valley": [
    {
      name: "Memphis",
      isHistorical: true,
      foundingYear: -3100,
      declineYear: 641,
      description: "The ancient capital of the Old Kingdom of Egypt, seat of the pharaohs who built the great pyramids.",
      allegianceHistory: {
        "-3100": "Ancient Egypt (Old Kingdom)",
        "-332": "Ptolemaic Kingdom",
        "-30": "Roman Empire"
      },
      urbanDensity: 'large',
      economicFocus: ['government', 'religion', 'monumental_architecture', 'crafts']
    }
  ],
  "Sahelian Scrublands": [
    {
      name: "Kano",
      isHistorical: true,
      foundingYear: 999,
      description: "A major hub of the trans-Saharan trade, the walled capital of a Hausa kingdom famed for its dyed cloth.",
      allegianceHistory: {
        999: "Kingdom of Kano",
        1807: "Sokoto Caliphate",
        1903: "British Empire"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'textiles', 'leatherwork', 'agriculture']
    }
  ],
  "Gold Coast Savanna": [
    {
        name: "Elmina",
        isHistorical: true,
        foundingYear: 1482,
        description: "The first European trading post in sub-Saharan Africa, a castle built for gold that became central to the slave trade.",
        allegianceHistory: {
            1482: "Portuguese Empire",
            1637: "Dutch Empire",
            1872: "British Empire"
        },
        urbanDensity: 'small',
        economicFocus: ['gold', 'slaves', 'trade']
    }
  ],
  "Zambezi Floodplain": [
    {
      name: "Sofala",
      isHistorical: true,
      foundingYear: 700,
      declineYear: 1890,
      description: "The ancient Swahili port that served as the primary outlet for the gold of Great Zimbabwe.",
      allegianceHistory: {
        700: "Swahili Coast City-States",
        1505: "Portuguese Empire"
      },
      urbanDensity: 'small',
      economicFocus: ['gold', 'trade', 'ivory']
    }
  ],
  "Highlands of Madagascar": [
    {
      name: "Antananarivo",
      isHistorical: true,
      foundingYear: 1610,
      description: "The high-altitude capital of the Merina Kingdom, which united Madagascar under its rule.",
      allegianceHistory: {
        1610: "Kingdom of Imerina",
        1817: "Kingdom of Madagascar",
        1897: "French Empire"
      },
      urbanDensity: 'moderate',
      economicFocus: ['government', 'trade', 'crafts']
    }
  ],

  // === THE AMERICAS ===
  "Greater Antilles": [
    {
      name: "Havana",
      isHistorical: true,
      foundingYear: 1519,
      description: "The key to the New World, the heavily fortified treasure port for the Spanish fleet.",
      allegianceHistory: {
        1519: "Spanish Empire",
        1898: "United States (Protectorate)",
        1902: "Republic of Cuba"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['shipping', 'sugar', 'tobacco', 'military']
    }
  ],
  "Cajamarca Highlands": [
    {
      name: "Lima",
      isHistorical: true,
      foundingYear: 1535,
      description: "The City of Kings, the proud and wealthy capital of the vast Viceroyalty of Peru.",
      allegianceHistory: {
        1535: "Spanish Empire",
        1821: "Republic of Peru"
      },
      urbanDensity: 'large',
      economicFocus: ['government', 'silver', 'trade', 'education']
    }
  ],
  "Mosquito Coast": [
    {
      name: "Cartagena",
      isHistorical: true,
      foundingYear: 1533,
      description: "A heavily fortified Spanish port on the Caribbean, a key hub for trade and defense of the Main.",
      allegianceHistory: {
        1533: "Spanish Empire",
        1821: "Gran Colombia"
      },
      urbanDensity: 'moderate',
      economicFocus: ['shipping', 'slaves', 'silver', 'fortifications']
    }
  ],
  "Mayan Lowlands": [
    {
      name: "Tikal",
      isHistorical: true,
      foundingYear: -400,
      declineYear: 900,
      description: "A dominant Maya city-state whose towering temples pierced the jungle canopy.",
      allegianceHistory: {
        "-400": "Maya City-States",
      },
      urbanDensity: 'large',
      economicFocus: ['government', 'religion', 'monumental_architecture', 'warfare']
    }
  ],

  // === OCEANIA ===
  "Murray River Valley": [
    {
      name: "Melbourne",
      isHistorical: true,
      foundingYear: 1835,
      description: "A boomtown that became the richest city in the world during the Victorian gold rush.",
      allegianceHistory: {
        1835: "British Empire",
        1901: "Commonwealth of Australia"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['gold', 'finance', 'wool', 'trade']
    }
  ],
  
  // New regions - Europe
  "Central Europe": [
    {
      name: "Frankfurt",
      isHistorical: true,
      foundingYear: 794,
      description: "Free Imperial city and financial center where German emperors were crowned.",
      allegianceHistory: {
        794: "Frankish Empire",
        962: "Holy Roman Empire",
        1806: "Confederation of the Rhine",
        1815: "German Confederation",
        1871: "German Empire",
        1945: "Allied Occupation",
        1949: "Federal Republic of Germany"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['banking', 'trade', 'imperial_elections']
    },
    {
      name: "Prague",
      isHistorical: true,
      foundingYear: 870,
      description: "The golden city of a hundred spires, capital of Bohemia.",
      allegianceHistory: {
        870: "Duchy of Bohemia",
        1198: "Kingdom of Bohemia",
        1526: "Habsburg Monarchy",
        1918: "Czechoslovakia",
        1939: "Nazi Germany",
        1945: "Czechoslovakia",
        1993: "Czech Republic"
      },
      urbanDensity: 'moderate',
      economicFocus: ['crafts', 'trade', 'learning', 'alchemy']
    }
  ],
  
  "Low Countries": [
    {
      name: "Amsterdam",
      isHistorical: true,
      foundingYear: 1275,
      description: "The Venice of the North, built on canals and commerce.",
      allegianceHistory: {
        1275: "County of Holland",
        1433: "Duchy of Burgundy",
        1482: "Habsburg Netherlands",
        1581: "Dutch Republic",
        1795: "Batavian Republic",
        1815: "Kingdom of the Netherlands"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'renaissance': 'large',
        'modern': 'large'
      },
      economicFocus: ['trade', 'banking', 'shipbuilding', 'diamonds']
    },
    {
      name: "Brussels",
      isHistorical: true,
      foundingYear: 979,
      description: "Crossroads of Europe, from medieval cloth trade to EU capital.",
      allegianceHistory: {
        979: "Lower Lorraine",
        1183: "Duchy of Brabant",
        1430: "Duchy of Burgundy",
        1482: "Habsburg Netherlands",
        1714: "Austrian Netherlands",
        1795: "French Republic",
        1815: "United Kingdom of the Netherlands",
        1830: "Kingdom of Belgium"
      },
      urbanDensity: 'moderate',
      economicFocus: ['textiles', 'lace', 'government', 'international_organizations']
    }
  ],
  
  "Greece and Aegean": [
    {
      name: "Athens",
      isHistorical: true,
      foundingYear: -3000,
      description: "The cradle of democracy and Western philosophy.",
      allegianceHistory: {
        "-3000": "Mycenaean Greeks",
        "-508": "Athenian Democracy",
        "-338": "Macedonian Empire",
        "-146": "Roman Republic",
        395: "Byzantine Empire",
        1458: "Ottoman Empire",
        1833: "Kingdom of Greece"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'antiquity': 'large',
        'modern': 'large'
      },
      economicFocus: ['philosophy', 'trade', 'naval_power', 'tourism']
    },
    {
      name: "Thessalonica",
      isHistorical: true,
      foundingYear: -315,
      description: "Byzantine Empire's second city and gateway to the Balkans.",
      allegianceHistory: {
        "-315": "Macedonian Kingdom",
        "-146": "Roman Republic",
        395: "Byzantine Empire",
        1430: "Ottoman Empire",
        1912: "Kingdom of Greece"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'silk', 'jewish_commerce', 'byzantine_culture']
    }
  ],
  
  // North America additions
  "Northern California": [
    {
      name: "Eureka",
      isHistorical: true,
      foundingYear: 1850,
      description: "Redwood lumber capital founded during the California Gold Rush.",
      allegianceHistory: {
        1850: "United States"
      },
      urbanDensity: 'small',
      economicFocus: ['lumber', 'fishing', 'gold']
    }
  ],
  
  "Central California Coast": [
    {
      name: "San Francisco",
      isHistorical: true,
      foundingYear: 1776,
      description: "From Spanish mission to Gold Rush boomtown to tech capital.",
      allegianceHistory: {
        1776: "Spanish Empire",
        1821: "Mexican Republic",
        1846: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'industrial': 'large',
        'modern': 'massive'
      },
      economicFocus: ['gold', 'shipping', 'finance', 'technology']
    },
    {
      name: "Monterey",
      isHistorical: true,
      foundingYear: 1770,
      description: "Capital of Spanish and Mexican California.",
      allegianceHistory: {
        1770: "Spanish Empire",
        1821: "Mexican Republic",
        1846: "United States"
      },
      urbanDensity: 'small',
      economicFocus: ['government', 'missions', 'fishing', 'whaling']
    }
  ],
  
  "Southern California": [
    {
      name: "Los Angeles",
      isHistorical: true,
      foundingYear: 1781,
      description: "From Spanish pueblo to sprawling metropolis of dreams.",
      allegianceHistory: {
        1781: "Spanish Empire",
        1821: "Mexican Republic",
        1848: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      economicFocus: ['ranching', 'oil', 'entertainment', 'aerospace']
    },
    {
      name: "San Diego",
      isHistorical: true,
      foundingYear: 1769,
      description: "California's first Spanish settlement and mission.",
      allegianceHistory: {
        1769: "Spanish Empire",
        1821: "Mexican Republic",
        1848: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['missions', 'military', 'naval_base', 'tourism']
    }
  ],
  
  "Central America": [
    {
      name: "Guatemala City",
      isHistorical: true,
      foundingYear: 1776,
      description: "Capital of the Captaincy General, built after earthquakes destroyed the old capital.",
      allegianceHistory: {
        1776: "Spanish Empire",
        1821: "First Mexican Empire",
        1823: "Federal Republic of Central America",
        1838: "Republic of Guatemala"
      },
      urbanDensity: 'moderate',
      economicFocus: ['government', 'trade', 'coffee', 'textiles']
    },
    {
      name: "Tikal",
      isHistorical: true,
      foundingYear: -600,
      declineYear: 900,
      description: "One of the largest Maya cities, with towering pyramids.",
      allegianceHistory: {
        "-600": "Maya City-States"
      },
      urbanDensity: 'large',
      populationPeak: 100000,
      economicFocus: ['religion', 'astronomy', 'jade_working', 'cacao']
    },
    {
      name: "Panama City",
      isHistorical: true,
      foundingYear: 1519,
      description: "Pacific gateway for Spanish treasure fleets from Peru.",
      allegianceHistory: {
        1519: "Spanish Empire",
        1821: "Gran Colombia",
        1831: "Republic of New Granada",
        1903: "Republic of Panama"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trans-isthmian_trade', 'gold_transit', 'canal']
    }
  ],
  
  "The Caribbean": [
    {
      name: "Havana",
      isHistorical: true,
      foundingYear: 1519,
      description: "The Key to the New World, where Spanish treasure fleets gathered.",
      allegianceHistory: {
        1519: "Spanish Empire",
        1762: "British Empire",  // Brief occupation
        1763: "Spanish Empire",
        1898: "United States",  // Military occupation
        1902: "Republic of Cuba"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['shipbuilding', 'tobacco', 'sugar', 'rum']
    },
    {
      name: "Santo Domingo",
      isHistorical: true,
      foundingYear: 1496,
      description: "First permanent European settlement in the Americas.",
      allegianceHistory: {
        1496: "Spanish Empire",
        1795: "French Empire",
        1809: "Spanish Empire",
        1822: "Republic of Haiti",
        1844: "Dominican Republic"
      },
      urbanDensity: 'moderate',
      economicFocus: ['government', 'sugar', 'trade', 'gold_processing']
    },
    {
      name: "Port Royal",
      isHistorical: true,
      foundingYear: 1518,
      declineYear: 1692,  // Destroyed by earthquake
      description: "The wickedest city on Earth, pirate haven until destroyed by earthquake.",
      allegianceHistory: {
        1518: "Spanish Empire",
        1655: "English Commonwealth",
        1660: "Kingdom of England"
      },
      urbanDensity: 'moderate',
      economicFocus: ['piracy', 'privateering', 'slave_trade', 'sugar']
    }
  ],
  
  "Nubian Corridor": [
    {
      name: "Meroe",
      isHistorical: true,
      foundingYear: -800,
      declineYear: 350,
      description: "Capital of the Kingdom of Kush, city of iron and pyramids.",
      allegianceHistory: {
        "-800": "Kingdom of Kush"
      },
      urbanDensity: 'moderate',
      populationPeak: 25000,
      economicFocus: ['iron_working', 'gold', 'ivory', 'incense_trade']
    },
    {
      name: "Dongola",
      isHistorical: true,
      foundingYear: 500,
      description: "Capital of Christian Nubia, resisting Islam for centuries.",
      allegianceHistory: {
        500: "Kingdom of Makuria",
        1317: "Mamluk Sultanate",
        1820: "Ottoman Egypt"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'christian_pilgrimage', 'gold', 'slaves']
    },
    {
      name: "Khartoum",
      isHistorical: true,
      foundingYear: 1821,
      description: "Founded at the confluence of the Blue and White Nile.",
      allegianceHistory: {
        1821: "Ottoman Egypt",
        1885: "Mahdist State",
        1898: "Anglo-Egyptian Sudan",
        1956: "Republic of Sudan"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['administration', 'trade', 'gum_arabic', 'cotton']
    }
  ],
  
  "Ural and Arctic Europe": [
    {
      name: "Yekaterinburg",
      isHistorical: true,
      foundingYear: 1723,
      description: "Gateway to Siberia, where the Romanovs met their end.",
      allegianceHistory: {
        1723: "Russian Empire",
        1917: "Russian Republic",
        1918: "Soviet Union",
        1991: "Russian Federation"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      economicFocus: ['mining', 'metallurgy', 'gems', 'industry']
    },
    {
      name: "Perm",
      isHistorical: true,
      foundingYear: 1723,
      description: "Major industrial center on the Kama River.",
      allegianceHistory: {
        1723: "Russian Empire",
        1917: "Soviet Union",
        1991: "Russian Federation"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'moderate'
      },
      economicFocus: ['salt', 'copper', 'munitions', 'chemicals']
    }
  ]

};
