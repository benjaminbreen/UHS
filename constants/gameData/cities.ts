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
        [-400]: "Quraysh Tribe",
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
        [-500]: "Local Tribes",
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
  "Thames Estuary": [
  {
    name: "Londinium",
    isHistorical: true,
    foundingYear: 47,
    declineYear: 410,
    description: "A major commercial center of Roman Britain, established after the conquest of 43 AD.",
    allegianceHistory: {
      47: "Roman Empire"
    },
    urbanDensity: "moderate",
    populationPeak: 60000,
    economicFocus: ["grain_trade", "pottery", "administration", "military_supplies"]
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
    urbanDensity: "large",
    eraSpecificDensity: {
      "prehistoric": "small",
      "ancient": "small",
      "medieval": "moderate",
      "early_modern": "large",
      "modern": "massive"
    },
    populationPeak: 7900000,
    economicFocus: ["finance", "textiles", "shipping", "government"]
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
  "Leinster Plain": [
  {
    name: "Dyflin",
    isHistorical: true,
    foundingYear: 841,
    declineYear: 1171,
    description: "A major Viking longphort and center of the Norse Kingdom of Dublin.",
    allegianceHistory: {
      841: "Norse Kingdom of Dublin"
    },
    urbanDensity: "small",
    populationPeak: 10000,
    economicFocus: ["slave_trade", "furs", "fish", "timber"]
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
    },
    urbanDensity: "moderate",
    populationPeak: 200000,
    economicFocus: ["textiles", "beer_brewing", "government", "shipping"]
  }
],
  "Oxfordshire": [
    {
      name: "Oxford",
      isHistorical: true,
      foundingYear: 912,
      description: "A Saxon town that grew into one of the world's most prestigious centers of learning.",
      allegianceHistory: {
        912: "Kingdom of Wessex",
        1066: "Kingdom of England",
        1707: "United Kingdom"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'medieval': 'moderate',
        'modern': 'moderate'
      },
      economicFocus: ['education', 'religion', 'publishing', 'trade']
    }
  ],
  "Boston Harbor": [
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
      eraSpecificDensity: { 'modern': 'large' },
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
      eraSpecificDensity: { 'early_modern': 'large' },
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
  "Great Lakes Shoreline": [
    {
      name: "Chicago",
      isHistorical: true,
      foundingYear: 1833,
      description: "A frontier fort that became the great industrial and transportation hub of the American Midwest.",
      allegianceHistory: {
        1833: "United States"
      },
      urbanDensity: 'small',
      eraSpecificDensity: { 'modern': 'massive' },
      economicFocus: ['railways', 'meatpacking', 'industry', 'finance']
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
  "St. Lawrence River": [
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
        eraSpecificDensity: { 'modern': 'moderate' },
        economicFocus: ['fur_trade', 'military', 'government']
    }
  ],
  "Brandenburg Plain": [
    {
      name: "Berlin",
      isHistorical: true,
      foundingYear: 1237,
      description: "A trading town that became the capital of Prussia and a unified German Empire.",
      allegianceHistory: {
        1237: "Margraviate of Brandenburg",
        1415: "Electorate of Brandenburg",
        1701: "Kingdom of Prussia",
        1871: "German Empire"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: { 'modern': 'massive' },
      economicFocus: ['government', 'military', 'industry', 'science']
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
        eraSpecificDensity: { 'modern': 'large' },
        economicFocus: ['trade', 'shipping', 'brewing']
    }
  ],
  "Novgorod Woods": [
    {
        name: "St. Petersburg",
        isHistorical: true,
        foundingYear: 1703,
        description: "Tsar Peter's window to the West, the magnificent imperial capital built on a swamp.",
        allegianceHistory: {
            1703: "Tsardom of Russia",
            1721: "Russian Empire"
        },
        urbanDensity: 'large',
        economicFocus: ['government', 'navy', 'enlightenment', 'architecture']
    },
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
      populationPeak: 140000,
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

  // MESOAMERICA AND SOUTH AMERICA
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

  // NORTH AMERICA
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

// AFRICA
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
            [-814]: "Carthaginian Republic",
            [-146]: "Roman Republic",
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
        [-3000]: "Ancient Semitic Peoples",
        [-64]: "Roman Empire",
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
            [-300]: "Seleucid Empire",
            [-64]: "Roman Empire",
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
        [-222]: "Roman Republic",
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
        [-209]: "Roman Republic",
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
  "Yangtze Delta": [
    {
        name: "Shanghai",
        isHistorical: true,
        foundingYear: 960,
        populationPeak: 230000, // Modern Shanghai metropolitan area
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
        name: "Suzhou",
        isHistorical: true,
        foundingYear: [-514],
        populationPeak: 100000,
        description: "The Venice of the East, famous for its canals, gardens, and silk production.",
        allegianceHistory: {
            [-514]: "State of Wu",
            [-222]: "Qin Dynasty",
            589: "Sui Dynasty",
            960: "Song Dynasty",
            1368: "Ming Dynasty",
            1644: "Qing Dynasty"
        },
        urbanDensity: 'large',
        economicFocus: ['silk', 'textiles', 'gardens', 'canals']
    },
    {
        name: "Hangzhou",
        isHistorical: true,
        foundingYear: [-222],
        populationPeak: 98000,
        description: "Heaven on Earth, former capital of Southern Song and terminus of the Grand Canal.",
        allegianceHistory: {
            [-222]: "Qin Dynasty",
            589: "Sui Dynasty",
            907: "Wuyue Kingdom",
            1127: "Southern Song Capital",
            1368: "Ming Dynasty",
            1644: "Qing Dynasty"
        },
        urbanDensity: 'large',
        economicFocus: ['silk', 'tea', 'porcelain', 'printing']
    },
    {
        name: "Nanjing",
        isHistorical: true,
        foundingYear: [-495],
        populationPeak: 85000,
        description: "The great southern capital of several Chinese dynasties, rivaling Beijing for preeminence.",
        allegianceHistory: {
            229: "Kingdom of Wu",
            1368: "Ming Dynasty",
            1912: "Republic of China"
        },
        urbanDensity: 'large',
        economicFocus: ['government', 'trade', 'textiles', 'shipbuilding']
    }
  ],
  "Yangtze Gorges": [
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
            [-329]: "Macedonian Empire",
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
 "Khuzestan Plain": [
  {
    name: "Susa",
    isHistorical: true,
    foundingYear: -4200,
    declineYear: 935,
    description: "An ancient Elamite and later Achaemenid capital, famed for its palaces and administrative role.",
    allegianceHistory: {
      [-4200]: "Elamite Civilization",
      [-539]: "Achaemenid Empire",
      [-331]: "Macedonian Empire",
      638: "Rashidun Caliphate"
    },
    urbanDensity: "moderate",
    populationPeak: 50000,
    economicFocus: ["grain", "administration", "textiles", "ceramics"]
  }
],

"Shiraz Valley": [
  {
    name: "Persepolis",
    isHistorical: true,
    foundingYear: -518,
    declineYear: -330,
    description: "The ceremonial capital of the Achaemenid Empire, built by Darius the Great.",
    allegianceHistory: {
      [-518]: "Achaemenid Empire",
      [-330]: "Macedonian Empire"
    },
    urbanDensity: "large",
    populationPeak: 40000,
    economicFocus: ["administration", "monumental_architecture", "stone_carving"]
  },
  {
    name: "Shiraz",
    isHistorical: true,
    foundingYear: 693,
    description: "A cultural capital of Persia, celebrated for its poets, gardens, and wine.",
    allegianceHistory: {
      693: "Umayyad Caliphate",
      819: "Saffarid Dynasty",
      1055: "Seljuk Empire",
      1501: "Safavid Empire"
    },
    urbanDensity: "large",
    populationPeak: 200000,
    economicFocus: ["wine", "poetry", "gardens", "ceramics"]
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
        [-180]: "Roman Republic",
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
        [-315]: "Kingdom of Macedon",
        [-148]: "Roman Empire",
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

  // === SOUTH AND CENTRAL ASIA ===
  "Ferghana Valley": [
    {
        name: "Merv",
        isHistorical: true,
        foundingYear: -500,
        declineYear: 1221,
        description: "An ancient oasis city on the Silk Road, once one of the largest and most brilliant cities in the world.",
        allegianceHistory: {
            [-500]: "Achaemenid Empire",
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



  // === MENA & MAGHREB ===

  "Rif Coast": [
  {
    name: "Tangier",
    isHistorical: true,
    foundingYear: -500,
    description: "A strategic port at the Strait of Gibraltar, fought over by many empires.",
    allegianceHistory: {
      [-500]: "Carthaginian Empire",
      [-146]: "Roman Empire",
      711: "Umayyad Caliphate",
      1471: "Portuguese Empire",
      1661: "English Crown",
      1684: "Alaouite Dynasty"
    },
    urbanDensity: "moderate",
    populationPeak: 80000,
    economicFocus: ["shipping", "grain", "salt", "smuggling"]
  }
],

"Tunisian Sahel": [
  {
    name: "Carthage",
    isHistorical: true,
    foundingYear: -814,
    declineYear: -146,
    description: "The great Punic capital, rival of Rome, destroyed in the Third Punic War.",
    allegianceHistory: {
      [-814]: "Carthaginian Empire",
      [-146]: "Roman Republic"
    },
    urbanDensity: "large",
    populationPeak: 400000,
    economicFocus: ["grain", "purple_dye", "shipping", "mercenaries"]
  },
  {
    name: "Tunis",
    isHistorical: true,
    foundingYear: 698,
    description: "A medieval and modern capital of Tunisia, rising after Carthage’s fall.",
    allegianceHistory: {
      698: "Umayyad Caliphate",
      1229: "Hafsid Dynasty",
      1574: "Ottoman Empire",
      1881: "French Protectorate"
    },
    urbanDensity: "large",
    populationPeak: 300000,
    economicFocus: ["olive_oil", "grain", "ceramics", "trade"]
  }
],

  "Diyala Valley": [
  {
    name: "Ctesiphon",
    isHistorical: true,
    foundingYear: 120,
    declineYear: 637,
    description: "Capital of the Parthian and Sassanian Empires, famous for its vaulted palace arch.",
    allegianceHistory: {
      120: "Parthian Empire",
      224: "Sassanian Empire",
      637: "Rashidun Caliphate"
    },
    urbanDensity: "large",
    populationPeak: 500000,
    economicFocus: ["administration", "luxury_trade", "stone_architecture"]
  }
],


"Babylon Region": [
  {
    name: "Babylon",
    isHistorical: true,
    foundingYear: -2300,
    description: "One of the most iconic cities of Mesopotamia, famed for its walls, ziggurats, and the legendary Hanging Gardens.",
    allegianceHistory: {
      [-1792]: "Babylonian Empire",
      [-539]: "Achaemenid Empire",
      [-331]: "Macedonian Empire",
      650: "Sassanian Empire"
    },
    urbanDensity: 'large',
    populationPeak: 200000,
    economicFocus: ['WHEAT', 'DATES', 'TEXTILES', 'BRICK_CONSTRUCTION']
  }
],
"Nineveh Plain": [
  {
    name: "Nineveh",
    isHistorical: true,
    foundingYear: -6000,
    declineYear: -612,
    description: "The last great capital of the Assyrian Empire, with monumental walls and palaces on the Tigris River.",
    allegianceHistory: {
      [-6000]: "Assyrian Settlements",
      [-700]: "Neo-Assyrian Empire",
      [-612]: "Medes & Babylonians"
    },
    urbanDensity: 'large',
    populationPeak: 150000,
    economicFocus: ['IRON_TOOLS', 'LINEN_TEXTILES', 'STONE_BLOCK', 'HORSES']
  }
],
"Jerusalem Hills": [
  {
    name: "Jerusalem",
    isHistorical: true,
    foundingYear: -2000,
    description: "A sacred and contested city, central to Judaism, Christianity, and Islam.",
    allegianceHistory: {
      [-1000]: "Kingdom of Judah",
      [-586]: "Neo-Babylonian Empire",
      [-63]: "Roman Republic",
      638: "Rashidun Caliphate",
      1099: "Crusader Kingdom of Jerusalem",
      1187: "Ayyubid Sultanate",
      1517: "Ottoman Empire"
    },
    urbanDensity: 'large',
    populationPeak: 1000000,
    economicFocus: ['WINE', 'OLIVE_OIL', 'STONEWORK', 'PILGRIMAGE_GOODS']
  }
],
"Mount Lebanon Range": [
  {
    name: "Tyre",
    isHistorical: true,
    foundingYear: -2750,
    description: "The great island-fortress of Phoenicia, a mercantile powerhouse that founded colonies across the Mediterranean.",
    allegianceHistory: {
      [-2750]: "Phoenician City-State",
      [-332]: "Macedonian Empire",
      [-64]: "Roman Empire",
      638: "Rashidun Caliphate"
    },
    urbanDensity: 'moderate',
    populationPeak: 50000,
    economicFocus: ['PURPLE_DYE', 'CEDAR_TIMBER', 'GLASSWARE', 'OLIVE_OIL']
  }
],
"Tunisian Sahel": [
  {
    name: "Carthage",
    isHistorical: true,
    foundingYear: -814,
    declineYear: -146,
    description: "The Phoenician-founded metropolis, a dominant naval and commercial power of the western Mediterranean until its destruction by Rome.",
    allegianceHistory: {
      [-814]: "Phoenician (Tyre)",
      [-575]: "Carthaginian Republic",
      [-146]: "Roman Republic"
    },
    urbanDensity: 'large',
    populationPeak: 400000,
    economicFocus: ['WHEAT', 'OLIVE_OIL', 'POTTERY', 'NAVAL_SHIPS']
  }
],
"Fez Plateau": [
  {
    name: "Fez",
    isHistorical: true,
    foundingYear: 789,
    description: "A spiritual and cultural capital of Morocco, home to one of the world’s oldest universities.",
    allegianceHistory: {
      789: "Idrisid Dynasty",
      1040: "Almoravid Dynasty",
      1147: "Almohad Caliphate",
      1271: "Marinid Dynasty",
      1666: "Alaouite Dynasty"
    },
    urbanDensity: 'large',
    populationPeak: 400000,
    economicFocus: ['BOOK_MANUSCRIPTS', 'LEATHERWORK', 'CERAMICS', 'CARPETS']
  }
],
"Tripolitania": [
  {
    name: "Tripoli",
    isHistorical: true,
    foundingYear: -700,
    description: "A key Mediterranean port in modern Libya, contested across Phoenician, Roman, Ottoman, and Italian rule.",
    allegianceHistory: {
      [-700]: "Phoenician Colonies",
      [-146]: "Roman Empire",
      642: "Rashidun Caliphate",
      1551: "Ottoman Empire",
      1911: "Italian Empire"
    },
    urbanDensity: 'moderate',
    populationPeak: 100000,
    economicFocus: ['OLIVE_OIL', 'SPICES', 'SLAVE_TRADE', 'SHIPBUILDING']
  }
],
"Cyrenaica Coast": [
  {
    name: "Cyrene",
    isHistorical: true,
    foundingYear: -630,
    declineYear: 365,
    description: "A prosperous Greek colony in Cyrenaica, later an important Roman city until devastated by an earthquake.",
    allegianceHistory: {
      [-630]: "Greek Colonists (Thera)",
      [-323]: "Ptolemaic Kingdom",
      [-96]: "Roman Republic",
      365: "Roman Empire (destroyed by earthquake)"
    },
    urbanDensity: 'moderate',
    populationPeak: 100000,
    economicFocus: ['BARLEY', 'WINE', 'PHILOSOPHY_SCHOOLS', 'STATUARY']
  }
],
"Atlas Mountains": [
  {
    name: "Marrakesh",
    isHistorical: true,
    foundingYear: 1070,
    description: "The red city of Morocco, an imperial capital and a hub for trade, religion, and politics.",
    allegianceHistory: {
      1070: "Almoravid Dynasty",
      1147: "Almohad Caliphate",
      1269: "Marinid Dynasty",
      1549: "Saadian Dynasty",
      1666: "Alaouite Dynasty"
    },
    urbanDensity: 'large',
    populationPeak: 900000,
    economicFocus: ['CARPETS', 'SPICE_TRADE', 'ARCHITECTURE', 'METALWORK']
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
        [-3100]: "Ancient Egypt (Old Kingdom)",
        [-332]: "Ptolemaic Kingdom",
        [-30]: "Roman Empire"
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
        [-400]: "Maya City-States",
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
  
  "Zuiderzee Coast": [
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
  
  "Athens Basin": [
    {
      name: "Athens",
      isHistorical: true,
      foundingYear: -3000,
      description: "The cradle of democracy and Western philosophy.",
      allegianceHistory: {
        [-3000]: "Mycenaean Greeks",
        [-508]: "Athenian Democracy",
        [-338]: "Macedonian Empire",
        [-146]: "Roman Republic",
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
        [-315]: "Macedonian Kingdom",
        [-146]: "Roman Republic",
        395: "Byzantine Empire",
        1430: "Ottoman Empire",
        1912: "Kingdom of Greece"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'silk', 'jewish_commerce', 'byzantine_culture']
    }
  ],
  
  // North America additions
  "Pacific Coast Ranges": [
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
  
  "San Francisco Bay": [
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
    }
  ],

  "Monterey Bay": [

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
  
  "Los Angeles Basin": [
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
    }
  ],

  "San Diego Bay": [
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
        [-600]: "Maya City-States"
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
        [-800]: "Kingdom of Kush"
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
  ],

  "Sundarbans Delta": [
    {
      name: "Kolkata",
      isHistorical: true,
      foundingYear: 1690,
      description: "Major colonial port city and capital of British India until 1911.",
      allegianceHistory: {
        1690: "British East India Company",
        1858: "British Raj",
        1947: "Republic of India"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'industrial': 'massive',
        'modern': 'massive'
      },
      populationPeak: 14850000,
      economicFocus: ['trade', 'jute', 'industry', 'finance']
    },
    {
      name: "Dhaka",
      isHistorical: true,
      foundingYear: 1608,
      description: "Historic Mughal capital and center of muslin textile production.",
      allegianceHistory: {
        1608: "Mughal Empire",
        1765: "British East India Company",
        1858: "British Raj",
        1947: "Pakistan",
        1971: "Bangladesh"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 21000000,
      economicFocus: ['textiles', 'muslin', 'jute', 'commerce']
    },
    {
      name: "Khulna",
      isHistorical: true,
      foundingYear: 1882,
      description: "Major industrial port city in southwestern Bangladesh.",
      allegianceHistory: {
        1882: "British Raj",
        1947: "Pakistan",
        1971: "Bangladesh"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 1500000,
      economicFocus: ['jute', 'shipbuilding', 'fishing', 'shrimp']
    }
  ],

  "Chao Phraya Basin": [
    {
      name: "Bangkok",
      isHistorical: true,
      foundingYear: 1782,
      description: "Capital of Siam founded after the fall of Ayutthaya.",
      allegianceHistory: {
        1782: "Kingdom of Siam"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 10700000,
      economicFocus: ['trade', 'rice', 'manufacturing', 'services']
    },
    {
      name: "Ayutthaya",
      isHistorical: true,
      foundingYear: 1350,
      declineYear: 1767,
      description: "Former capital of the Ayutthaya Kingdom, major trading hub.",
      allegianceHistory: {
        1350: "Ayutthaya Kingdom",
        1767: "Destroyed by Burma"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'renaissance': 'massive'
      },
      populationPeak: 1000000,
      economicFocus: ['trade', 'ceramics', 'rice', 'diplomacy']
    },
    {
      name: "Nakhon Pathom",
      isHistorical: true,
      foundingYear: 500,
      description: "Ancient Mon-Dvaravati city with important Buddhist sites.",
      allegianceHistory: {
        500: "Dvaravati",
        1100: "Khmer Empire",
        1238: "Sukhothai Kingdom",
        1438: "Ayutthaya Kingdom",
        1782: "Kingdom of Siam"
      },
      urbanDensity: 'small',
      economicFocus: ['religion', 'agriculture', 'crafts']
    }
  ],

  "Tonle Sap Basin": [
    {
      name: "Angkor",
      isHistorical: true,
      foundingYear: 802,
      declineYear: 1431,
      description: "Capital of the Khmer Empire, largest pre-industrial city in the world.",
      allegianceHistory: {
        802: "Khmer Empire",
        1431: "Abandoned"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'medieval': 'massive'
      },
      populationPeak: 1000000,
      economicFocus: ['religion', 'hydraulic engineering', 'rice', 'administration']
    },
    {
      name: "Phnom Penh",
      isHistorical: true,
      foundingYear: 1372,
      description: "Capital founded after the fall of Angkor, at the confluence of rivers.",
      allegianceHistory: {
        1372: "Khmer Kingdom",
        1863: "French Protectorate",
        1953: "Kingdom of Cambodia"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 2200000,
      economicFocus: ['trade', 'administration', 'crafts', 'fishing']
    },
    {
      name: "Battambang",
      isHistorical: true,
      foundingYear: 1100,
      description: "Historic trading post and rice-growing center.",
      allegianceHistory: {
        1100: "Khmer Empire",
        1795: "Siam",
        1907: "French Protectorate",
        1953: "Kingdom of Cambodia"
      },
      urbanDensity: 'small',
      economicFocus: ['rice', 'trade', 'agriculture']
    }
  ],

  "West Java Coast": [
    {
      name: "Jakarta",
      isHistorical: true,
      foundingYear: 397,
      description: "Major port city, known as Sunda Kelapa, then Jayakarta, then Batavia.",
      allegianceHistory: {
        397: "Kingdom of Tarumanagara",
        669: "Sunda Kingdom",
        1527: "Sultanate of Banten",
        1619: "Dutch East Indies",
        1942: "Japanese Occupation",
        1945: "Republic of Indonesia"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 10600000,
      economicFocus: ['trade', 'spices', 'administration', 'manufacturing']
    },
    {
      name: "Bandung",
      isHistorical: true,
      foundingYear: 1810,
      description: "Highland city founded as a Dutch colonial retreat and plantation center.",
      allegianceHistory: {
        1810: "Dutch East Indies",
        1942: "Japanese Occupation",
        1945: "Republic of Indonesia"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 2500000,
      economicFocus: ['textiles', 'tea', 'quinine', 'education']
    },
    {
      name: "Banten",
      isHistorical: true,
      foundingYear: 1526,
      declineYear: 1832,
      description: "Major sultanate and pepper trading port before Dutch conquest.",
      allegianceHistory: {
        1526: "Sultanate of Banten",
        1682: "Dutch East Indies"
      },
      urbanDensity: 'moderate',
      economicFocus: ['pepper', 'trade', 'Islam', 'shipbuilding']
    }
  ],

  "East Java Coast": [
    {
      name: "Surabaya",
      isHistorical: true,
      foundingYear: 1293,
      description: "Major port city and naval base, second largest city in Indonesia.",
      allegianceHistory: {
        1293: "Majapahit Empire",
        1500: "Demak Sultanate",
        1625: "Mataram Sultanate",
        1743: "Dutch East Indies",
        1942: "Japanese Occupation",
        1945: "Republic of Indonesia"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 2900000,
      economicFocus: ['trade', 'shipbuilding', 'sugar', 'manufacturing']
    },
    {
      name: "Malang",
      isHistorical: true,
      foundingYear: 760,
      description: "Highland city with ancient Hindu-Buddhist kingdom heritage.",
      allegianceHistory: {
        760: "Kingdom of Kanjuruhan",
        1222: "Singhasari Kingdom",
        1293: "Majapahit Empire",
        1500: "Demak Sultanate",
        1767: "Dutch East Indies",
        1942: "Japanese Occupation",
        1945: "Republic of Indonesia"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'moderate'
      },
      populationPeak: 850000,
      economicFocus: ['agriculture', 'coffee', 'education', 'tourism']
    },
    {
      name: "Gresik",
      isHistorical: true,
      foundingYear: 1100,
      description: "Historic Islamic port and center of early Islamic propagation in Java.",
      allegianceHistory: {
        1100: "Independent port city",
        1487: "Demak Sultanate",
        1680: "Dutch East Indies",
        1942: "Japanese Occupation",
        1945: "Republic of Indonesia"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'Islam', 'shipbuilding', 'fishing']
    }
  ],

  "Lagos Coastal Belt": [
    {
      name: "Lagos",
      isHistorical: true,
      foundingYear: 1472,
      description: "Major Atlantic port founded by Portuguese, later British colonial capital.",
      allegianceHistory: {
        1472: "Kingdom of Awori",
        1730: "Kingdom of Benin",
        1861: "British Colony",
        1960: "Nigeria"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 21000000,
      economicFocus: ['trade', 'palm oil', 'finance', 'entertainment']
    },
    {
      name: "Benin City",
      isHistorical: true,
      foundingYear: 1180,
      description: "Capital of the Benin Empire, famous for bronze casting and walls.",
      allegianceHistory: {
        1180: "Benin Empire",
        1897: "British Protectorate",
        1960: "Nigeria"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'renaissance': 'large'
      },
      populationPeak: 1500000,
      economicFocus: ['bronze', 'ivory', 'administration', 'trade']
    },
    {
      name: "Porto-Novo",
      isHistorical: true,
      foundingYear: 1688,
      description: "Capital of Dahomey kingdom and later French colonial Benin.",
      allegianceHistory: {
        1688: "Kingdom of Porto-Novo",
        1883: "French Protectorate",
        1960: "Republic of Dahomey",
        1975: "Benin"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'palm oil', 'administration']
    }
  ],

  "Ivory Coast": [
    {
      name: "Abidjan",
      isHistorical: true,
      foundingYear: 1898,
      description: "Major port city developed during French colonial period.",
      allegianceHistory: {
        1898: "French West Africa",
        1960: "Ivory Coast"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 5000000,
      economicFocus: ['cocoa', 'coffee', 'timber', 'finance']
    },
    {
      name: "Grand-Bassam",
      isHistorical: true,
      foundingYear: 1842,
      declineYear: 1896,
      description: "First French colonial capital, abandoned due to yellow fever.",
      allegianceHistory: {
        1842: "French Trading Post",
        1893: "French West Africa",
        1960: "Ivory Coast"
      },
      urbanDensity: 'small',
      economicFocus: ['trade', 'ivory', 'palm oil', 'rubber']
    },
    {
      name: "Kong",
      isHistorical: true,
      foundingYear: 1100,
      declineYear: 1895,
      description: "Major Islamic scholarly and trading center in West Africa.",
      allegianceHistory: {
        1100: "Kong Empire",
        1710: "Independent city-state",
        1895: "Destroyed by Samory Touré"
      },
      urbanDensity: 'moderate',
      economicFocus: ['trade', 'Islamic scholarship', 'kola nuts', 'gold']
    }
  ],

  "Amazon Delta": [
    {
      name: "Belém",
      isHistorical: true,
      foundingYear: 1616,
      description: "Gateway to the Amazon, major rubber boom port city.",
      allegianceHistory: {
        1616: "Portuguese Brazil",
        1822: "Empire of Brazil",
        1889: "Republic of Brazil"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'industrial': 'moderate',
        'modern': 'large'
      },
      populationPeak: 2500000,
      economicFocus: ['rubber', 'brazil nuts', 'timber', 'fishing']
    },
    {
      name: "Macapá",
      isHistorical: true,
      foundingYear: 1758,
      description: "Strategic fortress city at the Amazon mouth on the equator.",
      allegianceHistory: {
        1758: "Portuguese Brazil",
        1822: "Empire of Brazil",
        1889: "Republic of Brazil"
      },
      urbanDensity: 'small',
      populationPeak: 500000,
      economicFocus: ['defense', 'fishing', 'minerals', 'timber']
    },
    {
      name: "Santarém",
      isHistorical: true,
      foundingYear: 1661,
      description: "River confluence city, center of pre-Columbian Tapajós culture.",
      allegianceHistory: {
        [-1000]: "Tapajós culture",
        1661: "Portuguese Brazil",
        1822: "Empire of Brazil",
        1889: "Republic of Brazil"
      },
      urbanDensity: 'small',
      populationPeak: 300000,
      economicFocus: ['rubber', 'agriculture', 'fishing', 'soybeans']
    }
  ],

  "Iceland": [
    {
      name: "Reykjavik",
      isHistorical: true,
      foundingYear: 874,
      description: "Nordic settlement that became Iceland's capital and largest city.",
      allegianceHistory: {
        874: "Norse Commonwealth",
        1262: "Kingdom of Norway",
        1380: "Kalmar Union",
        1814: "Kingdom of Denmark",
        1918: "Kingdom of Iceland",
        1944: "Republic of Iceland"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'moderate'
      },
      populationPeak: 140000,
      economicFocus: ['fishing', 'trade', 'government']
    },
    {
      name: "Thingvellir",
      isHistorical: true,
      foundingYear: 930,
      declineYear: 1798,
      description: "Site of the Althing, one of the world's oldest parliaments.",
      allegianceHistory: {
        930: "Norse Commonwealth",
        1262: "Kingdom of Norway"
      },
      urbanDensity: 'small',
      economicFocus: ['government', 'law', 'assembly']
    },
    {
      name: "Akureyri",
      isHistorical: true,
      foundingYear: 1602,
      description: "Northern Iceland's main trading port and fishing center.",
      allegianceHistory: {
        1602: "Kingdom of Denmark",
        1918: "Kingdom of Iceland",
        1944: "Republic of Iceland"
      },
      urbanDensity: 'small',
      populationPeak: 20000,
      economicFocus: ['fishing', 'whaling', 'trade']
    }
  ],

  "Kashmir Valley": [
    {
      name: "Srinagar",
      isHistorical: true,
      foundingYear: [-250],
      description: "Ancient city on Dal Lake, summer capital of Kashmir.",
      allegianceHistory: {
        [-250]: "Mauryan Empire",
        320: "Gupta Empire",
        700: "Karkota Dynasty",
        1339: "Kashmir Sultanate",
        1586: "Mughal Empire",
        1752: "Durrani Empire",
        1819: "Sikh Empire",
        1846: "Dogra Dynasty",
        1947: "Disputed Territory"
      },
      urbanDensity: 'moderate',
      populationPeak: 1500000,
      economicFocus: ['handicrafts', 'tourism', 'horticulture', 'silk']
    },
    {
      name: "Anantnag",
      isHistorical: true,
      foundingYear: [-250],
      description: "Ancient pilgrimage center with sacred springs.",
      allegianceHistory: {
        [-250]: "Local Kingdom",
        700: "Kashmir Kingdom",
        1586: "Mughal Empire",
        1846: "Dogra Dynasty",
        1947: "Disputed Territory"
      },
      urbanDensity: 'small',
      economicFocus: ['pilgrimage', 'agriculture', 'handicrafts']
    }
  ],

  "Manchurian Plain": [
    {
      name: "Shenyang",
      isHistorical: true,
      foundingYear: [-300],
      description: "Ancient city that became the Manchu capital before conquering China.",
      allegianceHistory: {
        [-300]: "Yan State",
        1625: "Later Jin",
        1636: "Qing Dynasty",
        1912: "Republic of China",
        1931: "Manchukuo",
        1945: "Republic of China",
        1949: "People's Republic of China"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 9000000,
      economicFocus: ['industry', 'machinery', 'military']
    },
    {
      name: "Harbin",
      isHistorical: true,
      foundingYear: 1898,
      description: "Russian-built railway city, the 'Moscow of the East'.",
      allegianceHistory: {
        1898: "Russian Empire",
        1917: "Russian Civil War",
        1932: "Manchukuo",
        1945: "Soviet Occupation",
        1946: "Republic of China",
        1949: "People's Republic of China"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 10000000,
      economicFocus: ['railways', 'industry', 'trade']
    },
    {
      name: "Changchun",
      isHistorical: true,
      foundingYear: 1800,
      description: "Former capital of Manchukuo, major industrial center.",
      allegianceHistory: {
        1800: "Qing Dynasty",
        1932: "Manchukuo",
        1945: "Republic of China",
        1949: "People's Republic of China"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 8000000,
      economicFocus: ['automobiles', 'film', 'railways']
    }
  ],

  "Jerusalem Hills": [
    {
      name: "Jerusalem",
      isHistorical: true,
      foundingYear: [-3000],
      description: "Holy city sacred to Judaism, Christianity, and Islam.",
      allegianceHistory: {
        [-3000]: "Canaanite City",
        [-1000]: "Kingdom of Israel",
        [-586]: "Babylonian Empire",
        [-538]: "Persian Empire",
        [-332]: "Macedonian Empire",
        [-63]: "Roman Empire",
        638: "Rashidun Caliphate",
        1099: "Kingdom of Jerusalem",
        1187: "Ayyubid Dynasty",
        1517: "Ottoman Empire",
        1917: "British Mandate",
        1948: "Divided City",
        1967: "Israeli Control"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 1000000,
      economicFocus: ['pilgrimage', 'tourism', 'government', 'technology']
    },
    {
      name: "Bethlehem",
      isHistorical: true,
      foundingYear: [-1350],
      description: "Birthplace of Jesus Christ, major Christian pilgrimage site.",
      allegianceHistory: {
        [-1350]: "Canaanite Settlement",
        [-1000]: "Kingdom of Judah",
        638: "Rashidun Caliphate",
        1099: "Kingdom of Jerusalem",
        1187: "Ayyubid Dynasty",
        1517: "Ottoman Empire",
        1917: "British Mandate",
        1948: "Jordanian Control",
        1967: "Israeli Occupation",
        1995: "Palestinian Authority"
      },
      urbanDensity: 'small',
      populationPeak: 30000,
      economicFocus: ['pilgrimage', 'tourism', 'olive wood', 'mother-of-pearl']
    },
    {
      name: "Hebron",
      isHistorical: true,
      foundingYear: [-3500],
      description: "Ancient city with the Tomb of the Patriarchs, sacred to Jews and Muslims.",
      allegianceHistory: {
        [-3500]: "Canaanite City",
        [-1000]: "Kingdom of Judah",
        638: "Rashidun Caliphate",
        1099: "Kingdom of Jerusalem",
        1187: "Ayyubid Dynasty",
        1517: "Ottoman Empire",
        1917: "British Mandate",
        1948: "Jordanian Control",
        1967: "Israeli Occupation"
      },
      urbanDensity: 'moderate',
      populationPeak: 250000,
      economicFocus: ['glass', 'pottery', 'leather', 'grapes']
    }
  ],

  "Orinoco Delta": [
    {
      name: "Ciudad Guayana",
      isHistorical: false,
      foundingYear: 1961,
      description: "Modern planned industrial city at the Orinoco-Caroni confluence.",
      allegianceHistory: {
        1961: "Venezuela"
      },
      urbanDensity: 'moderate',
      populationPeak: 900000,
      economicFocus: ['steel', 'aluminum', 'hydropower', 'mining']
    },
    {
      name: "Tucupita",
      isHistorical: true,
      foundingYear: 1848,
      description: "Capital of Delta Amacuro state, gateway to the Orinoco Delta.",
      allegianceHistory: {
        1848: "Venezuela"
      },
      urbanDensity: 'small',
      populationPeak: 100000,
      economicFocus: ['fishing', 'agriculture', 'oil', 'indigenous crafts']
    }
  ],

  "Guyana Highlands": [
    {
      name: "Georgetown",
      isHistorical: true,
      foundingYear: 1781,
      description: "Capital built by the Dutch below sea level, the 'Garden City of the Caribbean'.",
      allegianceHistory: {
        1781: "Dutch Colony",
        1814: "British Guiana",
        1966: "Guyana"
      },
      urbanDensity: 'moderate',
      populationPeak: 240000,
      economicFocus: ['sugar', 'rice', 'bauxite', 'gold']
    },
    {
      name: "Ciudad Bolivar",
      isHistorical: true,
      foundingYear: 1764,
      description: "Historic river port on the Orinoco, gateway to Venezuelan Guayana.",
      allegianceHistory: {
        1764: "Spanish Empire",
        1817: "Gran Colombia",
        1830: "Venezuela"
      },
      urbanDensity: 'moderate',
      populationPeak: 500000,
      economicFocus: ['river trade', 'cattle', 'gold', 'diamonds']
    }
  ],

  "Tierra del Fuego": [
    {
      name: "Ushuaia",
      isHistorical: true,
      foundingYear: 1884,
      description: "Southernmost city in the world, gateway to Antarctica.",
      allegianceHistory: {
        1884: "Argentina"
      },
      urbanDensity: 'small',
      populationPeak: 80000,
      economicFocus: ['tourism', 'fishing', 'electronics', 'prison']
    },
    {
      name: "Rio Grande",
      isHistorical: true,
      foundingYear: 1893,
      description: "Sheep ranching center on the Atlantic coast.",
      allegianceHistory: {
        1893: "Argentina"
      },
      urbanDensity: 'small',
      populationPeak: 100000,
      economicFocus: ['sheep', 'oil', 'gas', 'manufacturing']
    }
  ],

  "Norwegian Fjords": [
    {
      name: "Bergen",
      isHistorical: true,
      foundingYear: 1070,
      description: "Historic Hanseatic trading city, gateway to the fjords.",
      allegianceHistory: {
        1070: "Kingdom of Norway",
        1380: "Kalmar Union",
        1814: "Sweden-Norway Union",
        1905: "Kingdom of Norway",
        1940: "German Occupation",
        1945: "Kingdom of Norway"
      },
      urbanDensity: 'moderate',
      populationPeak: 300000,
      economicFocus: ['fish trade', 'shipping', 'oil', 'tourism']
    },
    {
      name: "Trondheim",
      isHistorical: true,
      foundingYear: 997,
      description: "Medieval capital and pilgrimage center with Nidaros Cathedral.",
      allegianceHistory: {
        997: "Kingdom of Norway",
        1380: "Kalmar Union",
        1814: "Sweden-Norway Union",
        1905: "Kingdom of Norway"
      },
      urbanDensity: 'moderate',
      populationPeak: 200000,
      economicFocus: ['pilgrimage', 'trade', 'education', 'technology']
    },
    {
      name: "Tromsø",
      isHistorical: true,
      foundingYear: 1794,
      description: "Arctic city, the 'Paris of the North' and gateway to polar exploration.",
      allegianceHistory: {
        1794: "Denmark-Norway",
        1814: "Sweden-Norway Union",
        1905: "Kingdom of Norway"
      },
      urbanDensity: 'small',
      populationPeak: 80000,
      economicFocus: ['arctic trade', 'whaling', 'fishing', 'research']
    }
  ],

  "Azores": [
    {
      name: "Ponta Delgada",
      isHistorical: true,
      foundingYear: 1450,
      description: "Capital of the Azores, strategic Atlantic waystation.",
      allegianceHistory: {
        1450: "Kingdom of Portugal",
        1580: "Iberian Union",
        1640: "Kingdom of Portugal",
        1910: "Portuguese Republic"
      },
      urbanDensity: 'small',
      populationPeak: 70000,
      economicFocus: ['whaling', 'agriculture', 'tourism', 'shipping']
    },
    {
      name: "Angra do Heroísmo",
      isHistorical: true,
      foundingYear: 1478,
      description: "Historic port city, crucial stop for treasure fleets from the Americas.",
      allegianceHistory: {
        1478: "Kingdom of Portugal",
        1580: "Iberian Union",
        1640: "Kingdom of Portugal",
        1910: "Portuguese Republic"
      },
      urbanDensity: 'small',
      populationPeak: 35000,
      economicFocus: ['naval base', 'trade', 'agriculture']
    }
  ],

  "Korean Peninsula": [
    {
      name: "Seoul",
      isHistorical: true,
      foundingYear: [-18],
      description: "Capital of Korea for over 600 years, from Joseon to modern megacity.",
      allegianceHistory: {
        [-18]: "Baekje Kingdom",
        475: "Goguryeo Kingdom",
        553: "Silla Kingdom",
        918: "Goryeo Dynasty",
        1394: "Joseon Dynasty",
        1910: "Japanese Colony",
        1945: "US Occupation",
        1948: "Republic of Korea"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 10000000,
      economicFocus: ['government', 'technology', 'finance', 'entertainment']
    },
    {
      name: "Pyongyang",
      isHistorical: true,
      foundingYear: [-2333],
      description: "Ancient capital of Goguryeo, now capital of North Korea.",
      allegianceHistory: {
        [-2333]: "Gojoseon",
        [-108]: "Han Commandery",
        427: "Goguryeo Capital",
        668: "Tang Dynasty",
        918: "Goryeo Dynasty",
        1394: "Joseon Dynasty",
        1910: "Japanese Colony",
        1945: "Soviet Occupation",
        1948: "Democratic People's Republic of Korea"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 3200000,
      economicFocus: ['government', 'heavy industry', 'military']
    },
    {
      name: "Busan",
      isHistorical: true,
      foundingYear: [-100],
      description: "Major port city, Korea's gateway to the sea.",
      allegianceHistory: {
        [-100]: "Geumgwan Gaya",
        532: "Silla Kingdom",
        918: "Goryeo Dynasty",
        1394: "Joseon Dynasty",
        1910: "Japanese Colony",
        1948: "Republic of Korea"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 3500000,
      economicFocus: ['shipping', 'shipbuilding', 'fishing', 'trade']
    }
  ],

  "Kyushu Island": [
    {
      name: "Fukuoka",
      isHistorical: true,
      foundingYear: [-100],
      description: "Ancient gateway between Japan and Asia, major commercial center.",
      allegianceHistory: {
        [-100]: "Na Kingdom",
        300: "Yamato State",
        1185: "Kamakura Shogunate",
        1333: "Ashikaga Shogunate",
        1600: "Tokugawa Shogunate",
        1868: "Empire of Japan",
        1945: "Occupied Japan",
        1952: "Japan"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 1600000,
      economicFocus: ['trade', 'commerce', 'technology', 'culture']
    },
    {
      name: "Nagasaki",
      isHistorical: true,
      foundingYear: 1571,
      description: "Historic port, Japan's window to the West during isolation.",
      allegianceHistory: {
        1571: "Portuguese Trading Post",
        1600: "Tokugawa Shogunate",
        1868: "Empire of Japan",
        1945: "Atomic Bombing",
        1952: "Japan"
      },
      urbanDensity: 'moderate',
      populationPeak: 450000,
      economicFocus: ['international trade', 'shipbuilding', 'Christianity', 'tourism']
    },
    {
      name: "Kumamoto",
      isHistorical: true,
      foundingYear: 1607,
      description: "Castle town with one of Japan's most impressive fortresses.",
      allegianceHistory: {
        1607: "Hosokawa Domain",
        1868: "Empire of Japan",
        1945: "Occupied Japan",
        1952: "Japan"
      },
      urbanDensity: 'moderate',
      populationPeak: 750000,
      economicFocus: ['military', 'agriculture', 'education', 'electronics']
    }
  ],

  "Cyprus": [
    {
      name: "Nicosia",
      isHistorical: true,
      foundingYear: [-280],
      description: "Last divided capital in Europe, contested between Greeks and Turks.",
      allegianceHistory: {
        [-280]: "Ptolemaic Kingdom",
        58: "Roman Empire",
        395: "Byzantine Empire",
        1191: "Kingdom of Cyprus",
        1489: "Republic of Venice",
        1571: "Ottoman Empire",
        1878: "British Administration",
        1960: "Republic of Cyprus",
        1974: "Divided City"
      },
      urbanDensity: 'moderate',
      populationPeak: 350000,
      economicFocus: ['government', 'finance', 'trade', 'services']
    },
    {
      name: "Famagusta",
      isHistorical: true,
      foundingYear: [-300],
      description: "Medieval port city with Venetian walls, ghost town since 1974.",
      allegianceHistory: {
        [-300]: "Ptolemaic Kingdom",
        1191: "Kingdom of Cyprus",
        1489: "Republic of Venice",
        1571: "Ottoman Empire",
        1878: "British Administration",
        1960: "Republic of Cyprus",
        1974: "Turkish Occupation"
      },
      urbanDensity: 'small',
      declineYear: 1974,
      populationPeak: 40000,
      economicFocus: ['trade', 'tourism', 'port']
    },
    {
      name: "Paphos",
      isHistorical: true,
      foundingYear: [-1400],
      description: "Mythical birthplace of Aphrodite, ancient capital with Roman mosaics.",
      allegianceHistory: {
        [-1400]: "Mycenaean Settlement",
        [-800]: "Cypriot Kingdoms",
        58: "Roman Empire",
        395: "Byzantine Empire",
        1191: "Kingdom of Cyprus",
        1489: "Republic of Venice",
        1571: "Ottoman Empire",
        1878: "British Administration",
        1960: "Republic of Cyprus"
      },
      urbanDensity: 'small',
      populationPeak: 35000,
      economicFocus: ['tourism', 'archaeology', 'agriculture']
    }
  ],

  "Crete": [
    {
      name: "Heraklion",
      isHistorical: true,
      foundingYear: [-2000],
      description: "Capital near ancient Knossos, center of Minoan civilization.",
      allegianceHistory: {
        [-2000]: "Minoan Civilization",
        [-1100]: "Mycenaean Greeks",
        [-67]: "Roman Empire",
        395: "Byzantine Empire",
        824: "Emirate of Crete",
        961: "Byzantine Empire",
        1204: "Republic of Venice",
        1669: "Ottoman Empire",
        1898: "Cretan State",
        1913: "Kingdom of Greece"
      },
      urbanDensity: 'moderate',
      populationPeak: 180000,
      economicFocus: ['tourism', 'archaeology', 'shipping', 'agriculture']
    },
    {
      name: "Chania",
      isHistorical: true,
      foundingYear: [-1500],
      description: "Venetian harbor city, one of the Mediterranean's most beautiful ports.",
      allegianceHistory: {
        [-1500]: "Minoan Settlement",
        [-500]: "Greek City-State",
        [-67]: "Roman Empire",
        395: "Byzantine Empire",
        1252: "Republic of Venice",
        1645: "Ottoman Empire",
        1898: "Cretan State",
        1913: "Kingdom of Greece"
      },
      urbanDensity: 'small',
      populationPeak: 110000,
      economicFocus: ['tourism', 'olive oil', 'shipping', 'crafts']
    }
  ],

  "Rhodes": [
    {
      name: "Rhodes City",
      isHistorical: true,
      foundingYear: [-408],
      description: "Medieval city of the Knights Hospitaller, site of the Colossus.",
      allegianceHistory: {
        [-408]: "Rhodes City-State",
        [-164]: "Roman Republic",
        395: "Byzantine Empire",
        1309: "Knights Hospitaller",
        1523: "Ottoman Empire",
        1912: "Kingdom of Italy",
        1947: "Kingdom of Greece"
      },
      urbanDensity: 'moderate',
      populationPeak: 120000,
      economicFocus: ['tourism', 'shipping', 'sponge diving', 'wine']
    },
    {
      name: "Lindos",
      isHistorical: true,
      foundingYear: [-1000],
      description: "Ancient acropolis town with Temple of Athena.",
      allegianceHistory: {
        [-1000]: "Dorian Settlement",
        [-408]: "Rhodes City-State",
        [-164]: "Roman Republic",
        395: "Byzantine Empire",
        1309: "Knights Hospitaller",
        1523: "Ottoman Empire",
        1947: "Kingdom of Greece"
      },
      urbanDensity: 'small',
      populationPeak: 4000,
      economicFocus: ['tourism', 'fishing', 'crafts']
    }
  ],

  "Yucatan Peninsula": [
    {
      name: "Mérida",
      isHistorical: true,
      foundingYear: 1542,
      description: "Spanish colonial city built atop Maya T'ho, the 'White City'.",
      allegianceHistory: {
        [-600]: "Maya City of T'ho",
        1542: "Spanish Empire",
        1821: "Mexican Empire",
        1823: "Republic of Yucatan",
        1848: "Mexico"
      },
      urbanDensity: 'moderate',
      populationPeak: 1000000,
      economicFocus: ['henequen', 'tourism', 'commerce', 'culture']
    },
    {
      name: "Chichen Itza",
      isHistorical: true,
      foundingYear: 600,
      declineYear: 1200,
      description: "Major Maya city with the famous pyramid of Kukulkan.",
      allegianceHistory: {
        600: "Maya City-State",
        900: "Toltec-Maya Fusion",
        1200: "Abandoned"
      },
      urbanDensity: 'large',
      populationPeak: 50000,
      economicFocus: ['pilgrimage', 'trade', 'astronomy', 'ball game']
    },
    {
      name: "Cancún",
      isHistorical: false,
      foundingYear: 1970,
      description: "Modern resort city built from scratch on Caribbean coast.",
      allegianceHistory: {
        1970: "Mexico"
      },
      urbanDensity: 'moderate',
      populationPeak: 900000,
      economicFocus: ['tourism', 'hospitality', 'entertainment']
    }
  ],

  "Cuba": [
    {
      name: "Havana",
      isHistorical: true,
      foundingYear: 1519,
      description: "Pearl of the Caribbean, frozen in time by revolution and embargo.",
      allegianceHistory: {
        1519: "Spanish Empire",
        1762: "British Occupation",
        1763: "Spanish Empire",
        1898: "US Occupation",
        1902: "Republic of Cuba",
        1959: "Revolutionary Cuba"
      },
      urbanDensity: 'large',
      populationPeak: 2200000,
      economicFocus: ['tourism', 'cigars', 'rum', 'culture']
    },
    {
      name: "Santiago de Cuba",
      isHistorical: true,
      foundingYear: 1515,
      description: "Cradle of the Revolution and Afro-Cuban culture.",
      allegianceHistory: {
        1515: "Spanish Empire",
        1898: "US Occupation",
        1902: "Republic of Cuba",
        1959: "Revolutionary Cuba"
      },
      urbanDensity: 'moderate',
      populationPeak: 500000,
      economicFocus: ['port', 'mining', 'music', 'revolution']
    },
    {
      name: "Trinidad",
      isHistorical: true,
      foundingYear: 1514,
      description: "Perfectly preserved colonial city built on sugar wealth.",
      allegianceHistory: {
        1514: "Spanish Empire",
        1898: "US Occupation",
        1902: "Republic of Cuba",
        1959: "Revolutionary Cuba"
      },
      urbanDensity: 'small',
      populationPeak: 75000,
      economicFocus: ['sugar', 'tourism', 'crafts', 'music']
    }
  ],

  "Hispaniola": [
    {
      name: "Santo Domingo",
      isHistorical: true,
      foundingYear: 1496,
      description: "First European city in the Americas, Columbus's base.",
      allegianceHistory: {
        1496: "Spanish Empire",
        1795: "French Colony",
        1809: "Spanish Empire",
        1821: "Republic of Spanish Haiti",
        1822: "Unified Hispaniola",
        1844: "Dominican Republic"
      },
      urbanDensity: 'large',
      populationPeak: 3000000,
      economicFocus: ['government', 'tourism', 'manufacturing', 'services']
    },
    {
      name: "Port-au-Prince",
      isHistorical: true,
      foundingYear: 1749,
      description: "Capital of the first Black republic after successful slave revolution.",
      allegianceHistory: {
        1749: "French Saint-Domingue",
        1804: "Empire of Haiti",
        1806: "Republic of Haiti"
      },
      urbanDensity: 'large',
      populationPeak: 2800000,
      economicFocus: ['government', 'commerce', 'manufacturing', 'NGOs']
    },
    {
      name: "Cap-Haïtien",
      isHistorical: true,
      foundingYear: 1670,
      description: "The 'Paris of the Antilles' before the revolution.",
      allegianceHistory: {
        1670: "French Saint-Domingue",
        1804: "Kingdom of Haiti",
        1820: "Republic of Haiti"
      },
      urbanDensity: 'moderate',
      populationPeak: 280000,
      economicFocus: ['tourism', 'port', 'history', 'voodoo']
    }
  ],

  "Jamaica": [
    {
      name: "Kingston",
      isHistorical: true,
      foundingYear: 1693,
      description: "Capital built after Port Royal's earthquake, birthplace of reggae.",
      allegianceHistory: {
        1693: "British Colony",
        1962: "Jamaica"
      },
      urbanDensity: 'moderate',
      populationPeak: 700000,
      economicFocus: ['shipping', 'tourism', 'music', 'bauxite']
    },
    {
      name: "Port Royal",
      isHistorical: true,
      foundingYear: 1518,
      declineYear: 1692,
      description: "The 'wickedest city on Earth', pirate haven destroyed by earthquake.",
      allegianceHistory: {
        1518: "Spanish Empire",
        1655: "British Colony",
        1692: "Destroyed"
      },
      urbanDensity: 'large',
      populationPeak: 8000,
      economicFocus: ['piracy', 'privateering', 'trade', 'vice']
    },
    {
      name: "Montego Bay",
      isHistorical: true,
      foundingYear: 1510,
      description: "Major tourist resort and cruise ship destination.",
      allegianceHistory: {
        1510: "Spanish Empire",
        1655: "British Colony",
        1962: "Jamaica"
      },
      urbanDensity: 'moderate',
      populationPeak: 120000,
      economicFocus: ['tourism', 'sugar', 'bananas', 'cruise ships']
    }
  ],

  "New Guinea Highlands": [
    {
      name: "Mount Hagen",
      isHistorical: true,
      foundingYear: 1934,
      description: "Highland town discovered by Australian gold prospectors.",
      allegianceHistory: {
        1934: "Australian Territory",
        1975: "Papua New Guinea"
      },
      urbanDensity: 'small',
      populationPeak: 50000,
      economicFocus: ['coffee', 'vegetables', 'traditional markets', 'tourism']
    },
    {
      name: "Goroka",
      isHistorical: true,
      foundingYear: 1926,
      description: "Coffee capital and site of famous tribal gathering shows.",
      allegianceHistory: {
        1926: "Australian Territory",
        1975: "Papua New Guinea"
      },
      urbanDensity: 'small',
      populationPeak: 20000,
      economicFocus: ['coffee', 'cultural festivals', 'education']
    },
    {
      name: "Wabag",
      isHistorical: true,
      foundingYear: 1938,
      description: "Remote highland center of Enga Province.",
      allegianceHistory: {
        1938: "Australian Territory",
        1975: "Papua New Guinea"
      },
      urbanDensity: 'small',
      populationPeak: 5000,
      economicFocus: ['gold mining', 'subsistence agriculture', 'administration']
    }
  ],

  "Fiji Islands": [
    {
      name: "Suva",
      isHistorical: true,
      foundingYear: 1882,
      description: "Colonial capital and largest city in the South Pacific islands.",
      allegianceHistory: {
        1882: "British Colony",
        1970: "Dominion of Fiji",
        1987: "Republic of Fiji"
      },
      urbanDensity: 'moderate',
      populationPeak: 180000,
      economicFocus: ['government', 'shipping', 'education', 'regional headquarters']
    },
    {
      name: "Levuka",
      isHistorical: true,
      foundingYear: 1820,
      declineYear: 1882,
      description: "First modern town in Fiji, former capital with wild colonial history.",
      allegianceHistory: {
        1820: "Beachcomber Settlement",
        1874: "British Colony",
        1970: "Fiji"
      },
      urbanDensity: 'small',
      populationPeak: 1000,
      economicFocus: ['whaling', 'copra', 'historical tourism']
    },
    {
      name: "Nadi",
      isHistorical: false,
      foundingYear: 1947,
      description: "Tourism gateway with international airport.",
      allegianceHistory: {
        1947: "British Colony",
        1970: "Fiji"
      },
      urbanDensity: 'moderate',
      populationPeak: 50000,
      economicFocus: ['tourism', 'sugar', 'aviation']
    }
  ],

  // === MAJOR MISSING CITIES ADDED ===

  "Nile Delta": [
    {
      name: "Cairo",
      isHistorical: true,
      foundingYear: 969,
      description: "The largest city in the Islamic world and Egypt's capital, center of Islamic learning.",
      allegianceHistory: {
        969: "Fatimid Caliphate",
        1171: "Ayyubid Sultanate",
        1250: "Mamluk Sultanate",
        1517: "Ottoman Empire",
        1805: "Ottoman Egypt",
        1914: "British Protectorate",
        1922: "Kingdom of Egypt"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'massive',
        'early_modern': 'massive',
        'modern': 'massive'
      },
      populationPeak: 500000,
      economicFocus: ['trade', 'textiles', 'islamic_scholarship', 'spices', 'administration']
    }
  ],

  "Delhi Region": [
    {
      name: "Delhi",
      isHistorical: true,
      foundingYear: 1052,
      description: "Capital of multiple Indian empires, seat of Mughal power.",
      allegianceHistory: {
        1052: "Tomara Dynasty",
        1180: "Chauhan Dynasty",
        1206: "Delhi Sultanate",
        1526: "Mughal Empire",
        1803: "British East India Company",
        1858: "British Raj",
        1947: "India"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'early_modern': 'massive',
        'modern': 'massive'
      },
      populationPeak: 400000,
      economicFocus: ['government', 'textiles', 'metalwork', 'ivory', 'administration']
    },
    {
      name: "Agra",
      isHistorical: true,
      foundingYear: 1504,
      description: "Mughal capital and home of the Taj Mahal, center of Indo-Islamic architecture.",
      allegianceHistory: {
        1504: "Mughal Empire",
        1803: "British East India Company",
        1858: "British Raj",
        1947: "India"
      },
      urbanDensity: 'large',
      populationPeak: 200000,
      economicFocus: ['architecture', 'marble', 'textiles', 'crafts', 'government']
    }
  ],

  "Malabar Coast": [
    {
      name: "Mumbai",
      isHistorical: true,
      foundingYear: 1507,
      description: "Major port city and commercial center, gateway to western India.",
      allegianceHistory: {
        1507: "Portuguese Empire",
        1661: "British Empire",
        1947: "India"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 300000,
      economicFocus: ['trade', 'textiles', 'shipping', 'cotton', 'finance']
    }
  ],

  "Gangetic Plain": [
    {
      name: "Calcutta",
      isHistorical: true,
      foundingYear: 1690,
      description: "Capital of British India and major Bengali commercial center.",
      allegianceHistory: {
        1690: "British East India Company",
        1858: "British Raj",
        1947: "India"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'early_modern': 'massive',
        'modern': 'massive'
      },
      populationPeak: 400000,
      economicFocus: ['trade', 'textiles', 'jute', 'administration', 'education']
    }
  ],

  "Punjab Plains": [
    {
      name: "Lahore",
      isHistorical: true,
      foundingYear: 1000,
      description: "Cultural capital of Punjab and major Mughal city.",
      allegianceHistory: {
        1000: "Ghaznavid Empire",
        1186: "Ghurid Dynasty",
        1206: "Delhi Sultanate",
        1524: "Mughal Empire",
        1799: "Sikh Empire",
        1849: "British Raj",
        1947: "Pakistan"
      },
      urbanDensity: 'large',
      populationPeak: 150000,
      economicFocus: ['textiles', 'trade', 'crafts', 'education', 'agriculture']
    }
  ],

  "Sundarbans Delta": [
    {
      name: "Dhaka",
      isHistorical: true,
      foundingYear: 1608,
      description: "Capital of Bengal and major center of muslin textile production.",
      allegianceHistory: {
        1608: "Mughal Empire",
        1765: "British East India Company",
        1858: "British Raj",
        1947: "Pakistan",
        1971: "Bangladesh"
      },
      urbanDensity: 'large',
      populationPeak: 200000,
      economicFocus: ['textiles', 'muslin', 'trade', 'river_transport', 'administration']
    }
  ],

  "Luzon Highlands": [
    {
      name: "Manila",
      isHistorical: true,
      foundingYear: 1571,
      description: "Spanish colonial capital and terminus of the Manila-Acapulco galleon trade.",
      allegianceHistory: {
        1571: "Spanish Empire",
        1898: "United States",
        1946: "Philippines"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 100000,
      economicFocus: ['trade', 'galleon_trade', 'silver', 'spices', 'administration']
    }
  ],

  "Red River Delta": [
    {
      name: "Hanoi",
      isHistorical: true,
      foundingYear: 1010,
      description: "Capital of Vietnam and center of Vietnamese civilization.",
      allegianceHistory: {
        1010: "Ly Dynasty",
        1225: "Tran Dynasty",
        1428: "Le Dynasty",
        1802: "Nguyen Dynasty",
        1883: "French Indochina",
        1945: "Vietnam"
      },
      urbanDensity: 'moderate',
      populationPeak: 100000,
      economicFocus: ['administration', 'rice', 'crafts', 'trade', 'education']
    }
  ],

  "Strait of Malacca": [
    {
      name: "Singapore",
      isHistorical: true,
      foundingYear: 1819,
      description: "Strategic trading port controlling the Strait of Malacca.",
      allegianceHistory: {
        1819: "British Empire",
        1963: "Malaysia",
        1965: "Singapore"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 50000,
      economicFocus: ['trade', 'shipping', 'finance', 'entrepot', 'rubber']
    }
  ],

  "Tunisian Sahel": [
    {
      name: "Tunis",
      isHistorical: true,
      foundingYear: 698,
      description: "Major North African port and center of Islamic scholarship.",
      allegianceHistory: {
        698: "Umayyad Caliphate",
        800: "Aghlabid Emirate",
        909: "Fatimid Caliphate",
        1159: "Almohad Caliphate",
        1574: "Ottoman Empire",
        1881: "French Protectorate",
        1956: "Tunisia"
      },
      urbanDensity: 'moderate',
      populationPeak: 100000,
      economicFocus: ['trade', 'textiles', 'olive_oil', 'scholarship', 'piracy']
    }
  ],

  // === SECOND BATCH OF MAJOR MISSING CITIES ===

  "Vienna Basin": [
    {
      name: "Vienna",
      isHistorical: true,
      foundingYear: 500,
      description: "Habsburg capital and imperial seat, gateway between East and West.",
      allegianceHistory: {
        500: "Germanic Tribes",
        976: "Margraviate of Austria",
        1156: "Duchy of Austria",
        1278: "Habsburg Dynasty",
        1804: "Austrian Empire",
        1867: "Austro-Hungarian Empire",
        1918: "Austria"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'moderate',
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 400000,
      economicFocus: ['government', 'banking', 'arts', 'music', 'imperial_administration']
    }
  ],

  "Bohemian Plateau": [
    {
      name: "Prague",
      isHistorical: true,
      foundingYear: 885,
      description: "Capital of Bohemia and Holy Roman Empire, city of a hundred spires.",
      allegianceHistory: {
        885: "Great Moravian Empire",
        1212: "Kingdom of Bohemia",
        1526: "Habsburg Monarchy",
        1804: "Austrian Empire",
        1867: "Austro-Hungarian Empire",
        1918: "Czechoslovakia",
        1993: "Czech Republic"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'early_modern': 'large',
        'modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['government', 'brewing', 'crafts', 'silver_mining', 'glass']
    }
  ],

  "Danube Bend": [
    {
      name: "Budapest",
      isHistorical: true,
      foundingYear: 1873,
      description: "Twin cities of Buda and Pest, capital of Hungary and Danube trade center.",
      allegianceHistory: {
        106: "Roman Empire",
        896: "Hungarian Principality",
        1000: "Kingdom of Hungary",
        1541: "Ottoman Empire",
        1686: "Habsburg Monarchy",
        1867: "Austro-Hungarian Empire",
        1918: "Hungary"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 300000,
      economicFocus: ['trade', 'government', 'milling', 'textiles', 'river_transport']
    }
  ],

  "Bay of Naples": [
    {
      name: "Naples",
      isHistorical: true,
      foundingYear: -600,
      description: "Major Italian kingdom capital and Mediterranean trading power.",
      allegianceHistory: {
        "-600": "Greek Colonies",
        326: "Roman Republic",
        1139: "Kingdom of Sicily",
        1282: "Kingdom of Naples",
        1503: "Spanish Empire",
        1734: "Kingdom of the Two Sicilies",
        1861: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'early_modern': 'massive',
        'modern': 'massive'
      },
      populationPeak: 450000,
      economicFocus: ['trade', 'silk', 'government', 'arts', 'maritime']
    }
  ],

  "Ligurian Coast": [
    {
      name: "Genoa",
      isHistorical: true,
      foundingYear: 937,
      description: "Maritime republic and Mediterranean trading powerhouse.",
      allegianceHistory: {
        937: "Republic of Genoa",
        1396: "French Occupation",
        1421: "Duchy of Milan",
        1528: "Republic of Genoa",
        1805: "French Empire",
        1815: "Kingdom of Sardinia",
        1861: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      populationPeak: 200000,
      economicFocus: ['maritime_trade', 'banking', 'silk', 'spices', 'shipbuilding']
    }
  ],

  "Isfahan Basin": [
    {
      name: "Tehran",
      isHistorical: true,
      foundingYear: 1200,
      description: "Persian capital and major center of Iranian civilization.",
      allegianceHistory: {
        1200: "Khwarezmid Empire",
        1220: "Mongol Empire",
        1501: "Safavid Empire",
        1736: "Afsharid Dynasty",
        1785: "Zand Dynasty",
        1794: "Qajar Dynasty",
        1925: "Pahlavi Dynasty",
        1979: "Islamic Republic of Iran"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 250000,
      economicFocus: ['government', 'carpets', 'silk', 'trade', 'crafts']
    }
  ],

  "Sindh River Delta": [
    {
      name: "Karachi",
      isHistorical: true,
      foundingYear: 1729,
      description: "Major port city and gateway to the Indian subcontinent.",
      allegianceHistory: {
        1729: "Kalhora Dynasty",
        1843: "British Empire",
        1947: "Pakistan"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 150000,
      economicFocus: ['trade', 'shipping', 'cotton', 'textiles', 'salt']
    }
  ],

  "Coromandel Coast": [
    {
      name: "Madras",
      isHistorical: true,
      foundingYear: 1639,
      description: "British colonial center and major South Indian port city.",
      allegianceHistory: {
        1639: "British East India Company",
        1858: "British Raj",
        1947: "India"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 300000,
      economicFocus: ['trade', 'textiles', 'administration', 'education', 'cotton']
    }
  ],

  "West Java Coast": [
    {
      name: "Jakarta",
      isHistorical: true,
      foundingYear: 1619,
      description: "Dutch colonial capital of the East Indies and major Southeast Asian port.",
      allegianceHistory: {
        1527: "Sultanate of Demak",
        1619: "Dutch East India Company",
        1800: "Dutch East Indies",
        1942: "Japanese Empire",
        1945: "Indonesia"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 200000,
      economicFocus: ['trade', 'spices', 'administration', 'shipping', 'sugar']
    }
  ],

  "Irrawaddy Valley": [
    {
      name: "Yangon",
      isHistorical: true,
      foundingYear: 1755,
      description: "Colonial capital of Burma and major Southeast Asian trading port.",
      allegianceHistory: {
        1755: "Konbaung Dynasty",
        1824: "British Empire",
        1948: "Burma",
        1989: "Myanmar"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 150000,
      economicFocus: ['trade', 'rice', 'teak', 'gems', 'shipping']
    }
  ],

  "Andalusian Plain": [
    {
      name: "Seville",
      isHistorical: true,
      foundingYear: -800,
      description: "Gateway to the Americas during the Spanish colonial era and major Andalusian city.",
      allegianceHistory: {
        "-800": "Phoenician Colonies",
        "-206": "Roman Republic",
        412: "Visigothic Kingdom",
        712: "Umayyad Caliphate",
        1248: "Kingdom of Castile",
        1516: "Spanish Empire"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 150000,
      economicFocus: ['trade', 'shipbuilding', 'colonial administration', 'textiles', 'agriculture']
    }
  ],

  "Po Valley": [
    {
      name: "Milan",
      isHistorical: true,
      foundingYear: -600,
      description: "Major commercial and financial center of northern Italy.",
      allegianceHistory: {
        "-600": "Celtic Tribes",
        "-222": "Roman Republic",
        286: "Western Roman Empire",
        774: "Frankish Kingdom",
        1162: "Holy Roman Empire",
        1395: "Duchy of Milan",
        1796: "Cisalpine Republic",
        1815: "Austrian Empire",
        1861: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 200000,
      economicFocus: ['banking', 'textiles', 'metalworking', 'trade', 'silk']
    }
  ],

  "Øresund Strait": [
    {
      name: "Copenhagen",
      isHistorical: true,
      foundingYear: 1167,
      description: "Capital of Denmark and major Baltic Sea trading port.",
      allegianceHistory: {
        1167: "Kingdom of Denmark",
        1397: "Kalmar Union",
        1523: "Kingdom of Denmark-Norway",
        1814: "Kingdom of Denmark"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'small',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 150000,
      economicFocus: ['trade', 'shipping', 'brewing', 'administration', 'fish']
    }
  ],

  "Vistula River": [
    {
      name: "Warsaw",
      isHistorical: true,
      foundingYear: 1300,
      description: "Capital of Poland and major Eastern European city.",
      allegianceHistory: {
        1300: "Duchy of Masovia",
        1526: "Kingdom of Poland",
        1569: "Polish-Lithuanian Commonwealth",
        1795: "Kingdom of Prussia",
        1807: "Duchy of Warsaw",
        1815: "Congress Poland",
        1918: "Poland"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'small',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 250000,
      economicFocus: ['trade', 'administration', 'textiles', 'education', 'crafts']
    }
  ],

  "Dnieper River Valley": [
    {
      name: "Kiev",
      isHistorical: true,
      foundingYear: 482,
      description: "Mother of Russian cities and ancient capital of Kievan Rus.",
      allegianceHistory: {
        482: "Slavic Tribes",
        882: "Kievan Rus",
        1240: "Golden Horde",
        1362: "Grand Duchy of Lithuania",
        1569: "Polish-Lithuanian Commonwealth",
        1654: "Tsardom of Russia",
        1917: "Ukrainian People's Republic",
        1922: "Soviet Union",
        1991: "Ukraine"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['trade', 'religion', 'crafts', 'agriculture', 'education']
    }
  ],

  "Alexandria Coast": [
    {
      name: "Alexandria",
      isHistorical: true,
      foundingYear: -331,
      description: "Ancient center of learning and major Mediterranean port city.",
      allegianceHistory: {
        "-331": "Ptolemaic Kingdom",
        "-30": "Roman Empire",
        641: "Rashidun Caliphate",
        969: "Fatimid Caliphate",
        1171: "Ayyubid Dynasty",
        1250: "Mamluk Sultanate",
        1517: "Ottoman Empire",
        1882: "British Protectorate",
        1952: "Egypt"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'antiquity': 'massive',
        'medieval': 'moderate',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 600000,
      economicFocus: ['trade', 'education', 'shipping', 'textiles', 'grain']
    }
  ],

  "Babylon Region": [
    {
      name: "Babylon",
      isHistorical: true,
      foundingYear: -2300,
      description: "Ancient capital of Mesopotamia and center of the Babylonian Empire.",
      allegianceHistory: {
        "-2300": "Akkadian Empire",
        "-1894": "First Babylonian Dynasty",
        "-1595": "Kassite Dynasty",
        "-626": "Neo-Babylonian Empire",
        "-539": "Achaemenid Empire",
        "-331": "Macedonian Empire",
        "-141": "Parthian Empire",
        224: "Sassanid Empire",
        637: "Rashidun Caliphate"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'antiquity': 'massive'
      },
      populationPeak: 200000,
      economicFocus: ['administration', 'religion', 'trade', 'agriculture', 'astronomy'],
      declineYear: 650  // City largely abandoned by 7th century CE
    }
  ],

  "Fars Province": [
    {
      name: "Persepolis",
      isHistorical: true,
      foundingYear: -515,
      description: "Ceremonial capital of the Persian Achaemenid Empire.",
      allegianceHistory: {
        "-515": "Achaemenid Empire"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'antiquity': 'moderate'
      },
      populationPeak: 30000,
      economicFocus: ['administration', 'religion', 'crafts', 'ceremonial center'],
      declineYear: -330  // Destroyed by Alexander the Great in 330 BCE
    }
  ],

  "Samarkand Region": [
    {
      name: "Samarkand",
      isHistorical: true,
      foundingYear: -700,
      description: "Pearl of the Silk Road and Timurid cultural capital.",
      allegianceHistory: {
        "-700": "Sogdian City-States",
        "-329": "Macedonian Empire",
        "-250": "Greco-Bactrian Kingdom",
        710: "Umayyad Caliphate",
        819: "Samanid Empire",
        1220: "Mongol Empire",
        1370: "Timurid Empire",
        1500: "Shaybanid Dynasty",
        1785: "Emirate of Bukhara",
        1868: "Russian Empire",
        1924: "Soviet Union",
        1991: "Uzbekistan"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 150000,
      economicFocus: ['trade', 'crafts', 'education', 'silk', 'astronomy']
    }
  ],

  "Chao Phraya Basin": [
    {
      name: "Bangkok",
      isHistorical: true,
      foundingYear: 1782,
      description: "Capital of Thailand and major Southeast Asian metropolis.",
      allegianceHistory: {
        1782: "Kingdom of Siam",
        1932: "Kingdom of Thailand"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'massive'
      },
      populationPeak: 300000,
      economicFocus: ['trade', 'administration', 'rice', 'shipping', 'temples']
    }
  ],

  "Flanders Fields": [
    {
      name: "Brussels",
      isHistorical: true,
      foundingYear: 979,
      description: "Capital of the Spanish Netherlands and later Belgium.",
      allegianceHistory: {
        979: "Duchy of Lower Lorraine",
        1430: "Duchy of Burgundy",
        1482: "Habsburg Netherlands",
        1556: "Spanish Netherlands",
        1714: "Austrian Netherlands",
        1795: "French Republic",
        1815: "United Kingdom of the Netherlands",
        1830: "Belgium"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'small',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['trade', 'textiles', 'administration', 'brewing', 'crafts']
    },
    {
      name: "Antwerp",
      isHistorical: true,
      foundingYear: 1200,
      description: "Northern Europe's greatest trading port during the 16th century.",
      allegianceHistory: {
        1200: "Duchy of Brabant",
        1430: "Duchy of Burgundy",
        1482: "Habsburg Netherlands",
        1556: "Spanish Netherlands",
        1714: "Austrian Netherlands",
        1795: "French Republic",
        1815: "United Kingdom of the Netherlands",
        1830: "Belgium"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'moderate',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 125000,
      economicFocus: ['trade', 'banking', 'textiles', 'spices', 'diamonds']
    }
  ],

  "Lisbon Coast": [
    {
      name: "Lisbon",
      isHistorical: true,
      foundingYear: -1200,
      description: "Atlantic gateway and capital of the Portuguese maritime empire.",
      allegianceHistory: {
        "-1200": "Phoenician Colonies",
        "-205": "Roman Republic",
        711: "Umayyad Caliphate",
        1147: "Kingdom of Portugal",
        1580: "Iberian Union",
        1640: "Kingdom of Portugal"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'moderate',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['trade', 'navigation', 'spices', 'gold', 'shipbuilding']
    }
  ],

  "Stockholm Archipelago": [
    {
      name: "Stockholm",
      isHistorical: true,
      foundingYear: 1252,
      description: "Capital of Sweden and major Baltic trading center.",
      allegianceHistory: {
        1252: "Kingdom of Sweden",
        1397: "Kalmar Union",
        1523: "Kingdom of Sweden"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'small',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 150000,
      economicFocus: ['trade', 'iron', 'administration', 'shipping', 'timber']
    }
  ],

  "Irish Sea": [
    {
      name: "Dublin",
      isHistorical: true,
      foundingYear: 841,
      description: "Viking trading post that became the capital of Ireland.",
      allegianceHistory: {
        841: "Viking Dublin",
        1170: "Anglo-Norman Ireland",
        1542: "Kingdom of Ireland",
        1800: "United Kingdom",
        1922: "Irish Free State"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'small',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 180000,
      economicFocus: ['trade', 'administration', 'brewing', 'textiles', 'shipping']
    }
  ],

  "Kyoto Basin": [
    {
      name: "Kyoto",
      isHistorical: true,
      foundingYear: 794,
      description: "Ancient capital of Japan and center of imperial culture.",
      allegianceHistory: {
        794: "Heian Imperial Court",
        1185: "Kamakura Shogunate",
        1333: "Ashikaga Shogunate",
        1600: "Tokugawa Shogunate",
        1868: "Empire of Japan"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 350000,
      economicFocus: ['crafts', 'silk', 'religion', 'education', 'administration']
    }
  ],

  "Han River Valley": [
    {
      name: "Seoul",
      isHistorical: true,
      foundingYear: 1394,
      description: "Capital of the Joseon Dynasty and Korea.",
      allegianceHistory: {
        1394: "Joseon Dynasty",
        1910: "Japanese Korea",
        1945: "Republic of Korea"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'renaissance_early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 200000,
      economicFocus: ['administration', 'education', 'crafts', 'ceramics', 'trade']
    }
  ],

  "Punjab Plains": [
    {
      name: "Lahore",
      isHistorical: true,
      foundingYear: 1000,
      description: "Jewel of the Mughal Empire and major center of Indo-Islamic culture.",
      allegianceHistory: {
        1000: "Ghaznavid Empire",
        1186: "Ghurid Dynasty",
        1206: "Delhi Sultanate",
        1524: "Mughal Empire",
        1747: "Durrani Empire",
        1799: "Sikh Empire",
        1849: "British Punjab",
        1947: "Pakistan"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'moderate',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 300000,
      economicFocus: ['trade', 'textiles', 'administration', 'crafts', 'gardens']
    }
  ],

  "Transoxiana": [
    {
      name: "Bukhara",
      isHistorical: true,
      foundingYear: -500,
      description: "Noble Bukhara, center of Islamic learning and Silk Road oasis.",
      allegianceHistory: {
        "-500": "Sogdian City-States",
        709: "Umayyad Caliphate",
        819: "Samanid Empire",
        999: "Karakhanid Khanate",
        1220: "Mongol Empire",
        1370: "Timurid Empire",
        1500: "Shaybanid Dynasty",
        1785: "Emirate of Bukhara",
        1920: "Soviet Union",
        1991: "Uzbekistan"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['education', 'trade', 'textiles', 'religion', 'manuscripts']
    }
  ],

  "Bay of Naples": [
    {
      name: "Palermo",
      isHistorical: true,
      foundingYear: -734,
      description: "Crossroads of Norman, Arab, and Byzantine cultures in the Mediterranean.",
      allegianceHistory: {
        "-734": "Phoenician Colonies",
        "-254": "Roman Republic",
        535: "Byzantine Empire",
        831: "Emirate of Sicily",
        1072: "County of Sicily",
        1130: "Kingdom of Sicily",
        1282: "Kingdom of Sicily (Aragonese)",
        1816: "Kingdom of Two Sicilies",
        1861: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'moderate'
      },
      populationPeak: 250000,
      economicFocus: ['trade', 'administration', 'textiles', 'agriculture', 'crafts']
    }
  ],

  "Andalusian Plain": [
    {
      name: "Cordoba",
      isHistorical: true,
      foundingYear: -169,
      description: "Capital of the Umayyad Caliphate of Córdoba and jewel of medieval Europe.",
      allegianceHistory: {
        "-169": "Roman Republic",
        711: "Umayyad Caliphate",
        1031: "Taifa of Córdoba",
        1236: "Kingdom of Castile"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'massive',
        'renaissance_early_modern': 'moderate'
      },
      populationPeak: 450000,
      economicFocus: ['education', 'philosophy', 'crafts', 'agriculture', 'trade']
    }
  ],

  "Athens Basin": [
    {
      name: "Athens",
      isHistorical: true,
      foundingYear: -3000,
      description: "Birthplace of democracy and center of ancient Greek civilization.",
      allegianceHistory: {
        "-3000": "Mycenaean Civilization",
        "-1200": "Dark Age Greece",
        "-800": "Archaic Athens",
        "-508": "Athenian Democracy",
        "-146": "Roman Province of Achaea",
        395: "Byzantine Empire",
        1458: "Ottoman Empire",
        1833: "Kingdom of Greece"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'large',
        'medieval': 'moderate',
        'renaissance_early_modern': 'moderate'
      },
      populationPeak: 250000,
      economicFocus: ['philosophy', 'trade', 'education', 'crafts', 'democracy']
    }
  ],

  "Peloponnesian Hills": [
    {
      name: "Sparta",
      isHistorical: true,
      foundingYear: -900,
      description: "Military powerhouse of ancient Greece and rival to Athens.",
      allegianceHistory: {
        "-900": "Dorian Sparta",
        "-146": "Roman Province of Achaea",
        395: "Byzantine Empire",
        1460: "Ottoman Empire",
        1833: "Kingdom of Greece"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'antiquity': 'moderate'
      },
      populationPeak: 100000,
      economicFocus: ['military', 'agriculture', 'slavery', 'training'],
      declineYear: 200  // Lost power after Roman conquest
    }
  ],

  "Bosporus Straits": [
    {
      name: "Troy",
      isHistorical: true,
      foundingYear: -3000,
      description: "Legendary city of the Trojan War and important Bronze Age center.",
      allegianceHistory: {
        "-3000": "Troy I-VI",
        "-1250": "Troy VII (Trojan War)",
        "-700": "Greek Ilion",
        "-133": "Roman Ilium"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'antiquity': 'moderate'
      },
      populationPeak: 50000,
      economicFocus: ['trade', 'crafts', 'agriculture', 'fortification'],
      declineYear: -1180  // Destroyed in Trojan War period
    }
  ],

  "Tunisian Sahel": [
    {
      name: "Carthage",
      isHistorical: true,
      foundingYear: -814,
      description: "Phoenician trading empire and Rome's greatest rival.",
      allegianceHistory: {
        "-814": "Phoenician Carthage",
        "-146": "Roman Africa"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'antiquity': 'massive'
      },
      populationPeak: 400000,
      economicFocus: ['trade', 'navigation', 'silver', 'purple dye', 'military'],
      declineYear: -146  // Destroyed by Rome in Third Punic War
    }
  ],

  "Hejaz Interior": [
    {
      name: "Mecca",
      isHistorical: true,
      foundingYear: 400,
      description: "Holy city of Islam and center of pilgrimage for Muslims worldwide.",
      allegianceHistory: {
        400: "Quraysh Tribe",
        630: "Rashidun Caliphate",
        661: "Umayyad Caliphate",
        750: "Abbasid Caliphate",
        969: "Fatimid Caliphate",
        1174: "Ayyubid Dynasty",
        1517: "Ottoman Empire",
        1924: "Kingdom of Saudi Arabia"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'moderate',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 100000,
      economicFocus: ['pilgrimage', 'trade', 'religion', 'textiles', 'incense']
    }
  ],

  "Jerusalem Hills": [
    {
      name: "Jerusalem",
      isHistorical: true,
      foundingYear: -1000,
      description: "Holy city sacred to Judaism, Christianity, and Islam.",
      allegianceHistory: {
        "-1000": "Kingdom of Israel",
        "-586": "Babylonian Empire",
        "-539": "Achaemenid Empire",
        "-332": "Macedonian Empire",
        "-63": "Roman Republic",
        638: "Rashidun Caliphate",
        1099: "Crusader Kingdom of Jerusalem",
        1187: "Ayyubid Dynasty",
        1517: "Ottoman Empire",
        1917: "British Mandate",
        1948: "Jordan/Israel"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'moderate',
        'modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['religion', 'pilgrimage', 'trade', 'crafts', 'administration']
    }
  ],

  "Varanasi Basin": [
    {
      name: "Varanasi",
      isHistorical: true,
      foundingYear: -1200,
      description: "One of the world's oldest cities and holiest site in Hinduism.",
      allegianceHistory: {
        "-1200": "Vedic Kingdoms",
        "-600": "Mahajanapadas",
        321: "Mauryan Empire",
        320: "Gupta Empire",
        1194: "Delhi Sultanate",
        1526: "Mughal Empire",
        1775: "British East India Company",
        1947: "India"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 200000,
      economicFocus: ['religion', 'education', 'textiles', 'crafts', 'pilgrimage']
    }
  ],

  "St. Lawrence River": [
    {
      name: "Montreal",
      isHistorical: true,
      foundingYear: 1642,
      description: "French colonial trading post and gateway to the North American interior.",
      allegianceHistory: {
        1642: "New France",
        1760: "British North America",
        1867: "Dominion of Canada"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'renaissance_early_modern': 'small',
        'modern': 'large'
      },
      populationPeak: 100000,
      economicFocus: ['fur trade', 'shipping', 'administration', 'crafts', 'agriculture']
    }
  ],

  "Sydney Basin": [
    {
      name: "Sydney",
      isHistorical: true,
      foundingYear: 1788,
      description: "First British colonial settlement in Australia and major Pacific port.",
      allegianceHistory: {
        1788: "British Colony of New South Wales",
        1901: "Commonwealth of Australia"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['shipping', 'wool', 'gold', 'administration', 'trade']
    }
  ],

  "Timbuktu Basin": [
    {
      name: "Timbuktu",
      isHistorical: true,
      foundingYear: 1100,
      description: "Legendary center of trans-Saharan trade and Islamic learning.",
      allegianceHistory: {
        1100: "Tuareg Tribes",
        1324: "Mali Empire",
        1468: "Songhai Empire",
        1591: "Moroccan Pashalik",
        1893: "French Sudan",
        1960: "Mali"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'moderate'
      },
      populationPeak: 100000,
      economicFocus: ['trade', 'salt', 'gold', 'education', 'manuscripts']
    }
  ],

  "Venetian Lagoon": [
    {
      name: "Venice",
      isHistorical: true,
      foundingYear: 421,
      description: "Maritime republic and trading empire connecting Europe with the Orient.",
      allegianceHistory: {
        421: "Byzantine Empire",
        697: "Republic of Venice",
        1797: "Austrian Empire",
        1805: "Kingdom of Italy (Napoleonic)",
        1815: "Austrian Empire",
        1866: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 180000,
      economicFocus: ['trade', 'navigation', 'glass', 'silk', 'spices']
    }
  ],

  "Rhine–Meuse Delta": [
    {
      name: "Amsterdam",
      isHistorical: true,
      foundingYear: 1275,
      description: "Capital of the Dutch Golden Age and center of global commerce.",
      allegianceHistory: {
        1275: "County of Holland",
        1506: "Habsburg Netherlands",
        1581: "Dutch Republic",
        1795: "Batavian Republic",
        1815: "Kingdom of the Netherlands"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'small',
        'renaissance_early_modern': 'large',
        'modern': 'large'
      },
      populationPeak: 220000,
      economicFocus: ['trade', 'banking', 'shipbuilding', 'diamonds', 'brewing']
    }
  ],

  "Vistula River": [
    {
      name: "Krakow",
      isHistorical: true,
      foundingYear: 965,
      description: "Ancient capital of Poland and center of Polish culture and learning.",
      allegianceHistory: {
        965: "Duchy of Poland",
        1025: "Kingdom of Poland",
        1569: "Polish-Lithuanian Commonwealth",
        1795: "Austrian Empire",
        1807: "Duchy of Warsaw",
        1815: "Free City of Kraków",
        1846: "Austrian Empire",
        1918: "Poland"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 100000,
      economicFocus: ['education', 'religion', 'crafts', 'trade', 'salt']
    }
  ],

  "Yangtze Delta": [
    {
      name: "Nanjing",
      isHistorical: true,
      foundingYear: -472,
      description: "Ancient Chinese capital and southern center of imperial power.",
      allegianceHistory: {
        "-472": "Wu Kingdom",
        "-333": "Chu Kingdom",
        "-221": "Qin Dynasty",
        1368: "Ming Dynasty",
        1644: "Qing Dynasty",
        1853: "Taiping Heavenly Kingdom",
        1864: "Qing Dynasty",
        1912: "Republic of China",
        1949: "People's Republic of China"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'massive',
        'modern': 'massive'
      },
      populationPeak: 1000000,
      economicFocus: ['administration', 'textiles', 'education', 'crafts', 'porcelain']
    }
  ],

  "Inland Sea Coast": [
    {
      name: "Osaka",
      isHistorical: true,
      foundingYear: 1496,
      description: "Major commercial center of Japan and gateway to the Inland Sea.",
      allegianceHistory: {
        1496: "Sengoku Period",
        1583: "Toyotomi Clan",
        1600: "Tokugawa Shogunate",
        1868: "Empire of Japan"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'renaissance_early_modern': 'large',
        'modern': 'massive'
      },
      populationPeak: 400000,
      economicFocus: ['trade', 'crafts', 'textiles', 'sake', 'rice']
    }
  ],

  "Isfahan Basin": [
    {
      name: "Isfahan",
      isHistorical: true,
      foundingYear: -500,
      description: "Jewel of the Safavid Empire and architectural marvel of Persia.",
      allegianceHistory: {
        "-500": "Achaemenid Empire",
        642: "Rashidun Caliphate",
        1051: "Seljuk Empire",
        1501: "Safavid Empire",
        1722: "Afghan Hotaki Dynasty",
        1729: "Safavid Restoration",
        1785: "Zand Dynasty",
        1794: "Qajar Dynasty"
      },
      urbanDensity: 'massive',
      eraSpecificDensity: {
        'antiquity': 'moderate',
        'medieval': 'large',
        'renaissance_early_modern': 'massive'
      },
      populationPeak: 600000,
      economicFocus: ['crafts', 'carpets', 'textiles', 'trade', 'architecture']
    }
  ],

  "Greater Antilles": [
    {
      name: "Havana",
      isHistorical: true,
      foundingYear: 1519,
      description: "Key to the New World and treasure fleet terminus of the Spanish Empire.",
      allegianceHistory: {
        1519: "Spanish Empire",
        1762: "British Empire",
        1763: "Spanish Empire",
        1898: "United States",
        1902: "Republic of Cuba",
        1959: "Revolutionary Cuba"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'renaissance_early_modern': 'large',
        'modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['trade', 'sugar', 'tobacco', 'shipping', 'fortification']
    }
  ],

  "Cape Coast": [
    {
      name: "Cape Town",
      isHistorical: true,
      foundingYear: 1652,
      description: "Dutch refreshment station and gateway to the Indian Ocean trade.",
      allegianceHistory: {
        1652: "Dutch East India Company",
        1795: "British Empire",
        1803: "Batavian Republic",
        1806: "British Empire",
        1910: "Union of South Africa",
        1994: "South Africa"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'renaissance_early_modern': 'small',
        'modern': 'large'
      },
      populationPeak: 100000,
      economicFocus: ['trade', 'shipping', 'wine', 'agriculture', 'provisions']
    }
  ],

  "Shiraz Valley": [
    {
      name: "Shiraz",
      isHistorical: true,
      foundingYear: 693,
      description: "City of poets, gardens, and wine, cultural heart of Persian civilization.",
      allegianceHistory: {
        693: "Umayyad Caliphate",
        819: "Saffarid Dynasty",
        1051: "Seljuk Empire",
        1501: "Safavid Empire",
        1747: "Zand Dynasty",
        1794: "Qajar Dynasty",
        1925: "Pahlavi Dynasty",
        1979: "Islamic Republic of Iran"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'large'
      },
      populationPeak: 200000,
      economicFocus: ['wine', 'poetry', 'gardens', 'textiles', 'crafts']
    }
  ],

  // === NEWLY ADDED REGIONS (December 2024) ===

  "Cuba": [
    {
      name: "Havana",
      isHistorical: true,
      foundingYear: 1519,
      description: "The key to the New World, Spain's heavily fortified treasure fleet port and Caribbean capital.",
      allegianceHistory: {
        1519: "Spanish Empire",
        1898: "United States (Military Occupation)",
        1902: "Republic of Cuba",
        1959: "Revolutionary Cuba"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'renaissance_early_modern': 'moderate',
        'industrial': 'large',
        'modern': 'massive'
      },
      populationPeak: 2100000,
      economicFocus: ['shipping', 'sugar', 'tobacco', 'military', 'rum']
    },
    {
      name: "Santiago de Cuba",
      isHistorical: true,
      foundingYear: 1515,
      description: "Cuba's second city and first capital, gateway to the Caribbean and coffee heartland.",
      allegianceHistory: {
        1515: "Spanish Empire",
        1898: "United States (Military Occupation)",
        1902: "Republic of Cuba"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'renaissance_early_modern': 'small',
        'industrial': 'moderate',
        'modern': 'large'
      },
      economicFocus: ['copper', 'coffee', 'sugar', 'military']
    }
  ],

  "Hispaniola": [
    {
      name: "Santo Domingo",
      isHistorical: true,
      foundingYear: 1496,
      description: "The first European city in the Americas, seat of Spain's earliest colonial government.",
      allegianceHistory: {
        1496: "Spanish Empire",
        1795: "French Republic",
        1809: "Spanish Empire",
        1821: "Republic of Spanish Haiti",
        1822: "Republic of Haiti",
        1844: "Dominican Republic"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'renaissance_early_modern': 'small',
        'modern': 'large'
      },
      populationPeak: 965000,
      economicFocus: ['government', 'sugar', 'trade', 'military']
    },
    {
      name: "Port-au-Prince",
      isHistorical: true,
      foundingYear: 1749,
      description: "Capital of Haiti, birthplace of the world's first successful slave revolution.",
      allegianceHistory: {
        1749: "French Empire (Saint-Domingue)",
        1804: "Republic of Haiti"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'industrial': 'moderate',
        'modern': 'large'
      },
      populationPeak: 987000,
      economicFocus: ['sugar', 'coffee', 'government', 'trade']
    },
    {
      name: "Cap-Haïtien",
      isHistorical: true,
      foundingYear: 1670,
      description: "The Paris of the Antilles, wealthy capital of French Saint-Domingue before the revolution.",
      allegianceHistory: {
        1670: "French Empire (Saint-Domingue)",
        1804: "Republic of Haiti"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'renaissance_early_modern': 'moderate',
        'industrial': 'moderate'
      },
      economicFocus: ['sugar', 'coffee', 'indigo', 'trade']
    }
  ],

  "Jamaica": [
    {
      name: "Port Royal",
      isHistorical: true,
      foundingYear: 1518,
      declineYear: 1692,
      description: "The wickedest city on Earth, notorious pirate haven destroyed by earthquake and tsunami.",
      allegianceHistory: {
        1518: "Spanish Empire",
        1655: "English Commonwealth",
        1660: "Kingdom of England"
      },
      urbanDensity: 'moderate',
      economicFocus: ['piracy', 'privateering', 'trade', 'sugar', 'slavery']
    },
    {
      name: "Kingston",
      isHistorical: true,
      foundingYear: 1693,
      description: "Jamaica's capital, built after Port Royal's destruction to become the Caribbean's largest English city.",
      allegianceHistory: {
        1693: "Kingdom of England",
        1707: "Kingdom of Great Britain",
        1801: "United Kingdom",
        1962: "Jamaica"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'industrial': 'moderate',
        'modern': 'large'
      },
      populationPeak: 670000,
      economicFocus: ['sugar', 'rum', 'shipping', 'coffee', 'music']
    }
  ],

  "Sicily": [
    {
      name: "Palermo",
      isHistorical: true,
      foundingYear: -734,
      description: "Crossroads of civilizations, where Norman, Arab, and Greek cultures created Europe's most cosmopolitan medieval court.",
      allegianceHistory: {
        [-734]: "Phoenician Carthage",
        [-254]: "Roman Republic",
        535: "Byzantine Empire",
        831: "Aghlabid Emirate",
        1072: "Norman Kingdom of Sicily",
        1194: "Holy Roman Empire",
        1282: "Aragonese Sicily",
        1516: "Spanish Empire",
        1713: "Kingdom of Savoy",
        1720: "Austrian Empire",
        1735: "Spanish Bourbon Kingdom",
        1816: "Kingdom of the Two Sicilies",
        1860: "Kingdom of Italy"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'large',
        'modern': 'large'
      },
      populationPeak: 677000,
      economicFocus: ['trade', 'grain', 'wine', 'citrus', 'tuna', 'sulfur']
    },
    {
      name: "Syracuse",
      isHistorical: true,
      foundingYear: -734,
      description: "Once the greatest Greek city in the world, home to Archimedes and rival to Athens.",
      allegianceHistory: {
        [-734]: "Greek Corinth",
        [-212]: "Roman Republic",
        878: "Aghlabid Emirate",
        1086: "Norman Sicily"
      },
      urbanDensity: 'large',
      eraSpecificDensity: {
        'antiquity': 'massive',
        'medieval': 'moderate',
        'modern': 'moderate'
      },
      populationPeak: 120000,
      economicFocus: ['philosophy', 'mathematics', 'naval power', 'trade']
    }
  ],

  "Cyprus": [
    {
      name: "Nicosia",
      isHistorical: true,
      foundingYear: 965,
      description: "The last divided capital in Europe, seat of Lusignan crusader kings and Venetian governors.",
      allegianceHistory: {
        965: "Byzantine Empire",
        1191: "Kingdom of Cyprus (Lusignan)",
        1489: "Republic of Venice",
        1571: "Ottoman Empire",
        1878: "British Empire",
        1960: "Republic of Cyprus"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'moderate',
        'renaissance_early_modern': 'moderate',
        'modern': 'moderate'
      },
      populationPeak: 116000,
      economicFocus: ['copper', 'trade', 'wine', 'lace', 'government']
    },
    {
      name: "Famagusta",
      isHistorical: true,
      foundingYear: -285,
      description: "The richest city in Christendom during the Lusignan era, protected by massive Venetian walls.",
      allegianceHistory: {
        [-285]: "Ptolemaic Egypt",
        1291: "Kingdom of Cyprus (Lusignan)",
        1489: "Republic of Venice",
        1571: "Ottoman Empire"
      },
      urbanDensity: 'moderate',
      eraSpecificDensity: {
        'medieval': 'large',
        'renaissance_early_modern': 'moderate'
      },
      economicFocus: ['trade', 'shipping', 'crusades', 'luxury goods']
    }
  ],

  "Bali": [
    {
      name: "Denpasar",
      isHistorical: true,
      foundingYear: 1788,
      description: "Capital of Bali's last independent Hindu kingdom, preserving Javanese culture after Islam's spread.",
      allegianceHistory: {
        1788: "Kingdom of Badung",
        1906: "Dutch East Indies",
        1949: "Republic of Indonesia"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'large'
      },
      populationPeak: 897000,
      economicFocus: ['rice', 'arts', 'crafts', 'tourism', 'Hindu temples']
    },
    {
      name: "Ubud",
      isHistorical: true,
      foundingYear: 1300,
      description: "Sacred cultural heart of Bali, center of traditional dance, gamelan music, and Hindu-Buddhist arts.",
      allegianceHistory: {
        1300: "Balinese Hindu Kingdoms",
        1906: "Dutch East Indies",
        1949: "Republic of Indonesia"
      },
      urbanDensity: 'small',
      economicFocus: ['arts', 'dance', 'painting', 'woodcarving', 'rice terraces']
    }
  ],

  "Maldives": [
    {
      name: "Malé",
      isHistorical: true,
      foundingYear: 1153,
      description: "Capital of the Maldive Sultanate, pearl of the Indian Ocean and guardian of vital trade routes.",
      allegianceHistory: {
        1153: "Maldive Sultanate",
        1558: "Portuguese Empire",
        1573: "Maldive Sultanate",
        1887: "British Empire (Protectorate)",
        1965: "Republic of Maldives"
      },
      urbanDensity: 'small',
      eraSpecificDensity: {
        'modern': 'moderate'
      },
      populationPeak: 133000,
      economicFocus: ['fishing', 'trade', 'coconuts', 'cowrie shells', 'coral']
    }
  ]

};
