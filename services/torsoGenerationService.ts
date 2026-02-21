import { HistoricalEra, CulturalZone, SocialClass } from '../types/characterData';
import { ClimateType } from '../types/biomes/base';

const torsoByEraAndCulture: Record<HistoricalEra, Record<CulturalZone, Record<string, string[]>>> = {
  PREHISTORY: {
    EUROPEAN: {
      default: ['BARK_CLOTH_WRAP', 'SIMPLE_TUNIC'],
      hunter: ['BARK_CLOTH_WRAP'],
      gatherer: ['BARK_CLOTH_WRAP'],
      shaman: ['SIMPLE_ROBE']
    },
    EAST_ASIAN: {
      default: ['BARK_CLOTH_WRAP', 'SIMPLE_TUNIC'],
      hunter: ['BARK_CLOTH_WRAP'],
      gatherer: ['BARK_CLOTH_WRAP'],
      shaman: ['SIMPLE_ROBE']
    },
    MENA: {
      default: ['BARK_CLOTH_WRAP', 'SIMPLE_TUNIC'],
      hunter: ['BARK_CLOTH_WRAP'],
      gatherer: ['BARK_CLOTH_WRAP'],
      shaman: ['SIMPLE_ROBE']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['BARK_CLOTH_WRAP'],
      hunter: ['BARK_CLOTH_WRAP'],
      gatherer: ['BARK_CLOTH_WRAP'],
      shaman: ['BARK_CLOTH_WRAP']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['BARK_CLOTH_WRAP', 'SIMPLE_TUNIC'],
      hunter: ['BARK_CLOTH_WRAP'],
      gatherer: ['BARK_CLOTH_WRAP'],
      shaman: ['SIMPLE_ROBE']
    },
    OCEANIA: {
      default: ['BARK_CLOTH_WRAP', 'WORK_WRAP'],
      hunter: ['BARK_CLOTH_WRAP'],
      gatherer: ['BARK_CLOTH_WRAP'],
      shaman: ['CEREMONIAL_WRAP']
    },
    SOUTH_ASIAN: {
      default: ['BARK_CLOTH_WRAP', 'SIMPLE_TUNIC'],
      hunter: ['BARK_CLOTH_WRAP'],
      gatherer: ['BARK_CLOTH_WRAP'],
      shaman: ['SIMPLE_ROBE']
    },
    SOUTH_AMERICAN: {
      default: ['BARK_CLOTH_WRAP'],
      hunter: ['BARK_CLOTH_WRAP'],
      gatherer: ['BARK_CLOTH_WRAP'],
      shaman: ['BARK_CLOTH_WRAP']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['BARK_CLOTH_WRAP'],
      hunter: ['BARK_CLOTH_WRAP'],
      gatherer: ['BARK_CLOTH_WRAP'],
      shaman: ['BARK_CLOTH_WRAP']
    }
  },
  ANTIQUITY: {
    EUROPEAN: {
      default: ['CHITON', 'SIMPLE_TUNIC', 'PEASANT_TUNIC'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['CITIZEN_TOGA', 'FINE_CLOTHES'],
      aristocrat: ['CITIZEN_TOGA', 'SILK_ROBE'],
      scholar: ['SIMPLE_ROBE', 'CITIZEN_TOGA'],
      craftsman: ['LEATHER_APRON', 'CRAFTSMAN_TUNIC'],
      slave: ['SLAVE_TUNIC']
    },
    EAST_ASIAN: {
      default: ['SIMPLE_TUNIC', 'SIMPLE_ROBE'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['SILK_ROBE', 'FINE_CLOTHES'],
      aristocrat: ['SILK_ROBE', 'BROCADE_GOWN'],
      scholar: ['SILK_ROBE'],
      craftsman: ['CRAFTSMAN_TUNIC', 'LEATHER_APRON']
    },
    MENA: {
      default: ['SIMPLE_TUNIC', 'ABAYA'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['CAFTAN', 'FINE_CLOTHES'],
      aristocrat: ['CAFTAN', 'SILK_ROBE'],
      scholar: ['SIMPLE_ROBE', 'CAFTAN'],
      craftsman: ['LEATHER_APRON', 'CRAFTSMAN_TUNIC']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['SIMPLE_TUNIC', 'BARK_CLOTH_WRAP'],
      warrior: ['LEATHER_TUNIC'],
      trader: ['SIMPLE_TUNIC'],
      chief: ['CEREMONIAL_WRAP'],
      shaman: ['CEREMONIAL_WRAP']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['SIMPLE_TUNIC', 'PEASANT_TUNIC'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['FINE_CLOTHES'],
      aristocrat: ['SILK_ROBE']
    },
    OCEANIA: {
      default: ['BARK_CLOTH_WRAP', 'WORK_WRAP'],
      warrior: ['CEREMONIAL_WRAP'],
      trader: ['WORK_WRAP'],
      chief: ['CEREMONIAL_WRAP'],
      navigator: ['WORK_WRAP']
    },
    SOUTH_ASIAN: {
      default: ['KURTA', 'SIMPLE_TUNIC'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['ANARKALI', 'FINE_CLOTHES'],
      aristocrat: ['SILK_ROBE', 'ANARKALI'],
      scholar: ['KURTA', 'SIMPLE_ROBE'],
      craftsman: ['CRAFTSMAN_TUNIC', 'LEATHER_APRON']
    },
    SOUTH_AMERICAN: {
      default: ['INCA_TUNIC', 'SIMPLE_TUNIC'],
      warrior: ['LEATHER_TUNIC'],
      trader: ['INCA_TUNIC'],
      noble: ['NOBLE_TUNIC', 'CHIEFLY_ROBE'],
      priest: ['CEREMONIAL_WRAP', 'NOBLE_TUNIC']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['DASHIKI', 'SIMPLE_TUNIC'],
      warrior: ['LEATHER_TUNIC'],
      trader: ['BOUBOU', 'DASHIKI'],
      chief: ['BOUBOU', 'CHIEFLY_ROBE'],
      griot: ['DASHIKI', 'BOUBOU']
    }
  },
  MEDIEVAL: {
    EUROPEAN: {
      default: ['PEASANT_TUNIC', 'ROUGH_TUNIC', 'SERF_TUNIC'],
      knight: ['LEATHER_TUNIC'],
      merchant: ['FINE_CLOTHES', 'CRAFTSMAN_TUNIC'],
      aristocrat: ['COTEHARDIE', 'BROCADE_GOWN', 'FINE_CLOTHES'],
      scholar: ['SIMPLE_ROBE'],
      serf: ['SERF_TUNIC', 'ROUGH_TUNIC'],
      monk: ['SIMPLE_ROBE']
    },
    EAST_ASIAN: {
      default: ['SIMPLE_TUNIC', 'KURTA'],
      samurai: ['LEATHER_TUNIC'],
      merchant: ['SILK_ROBE', 'FINE_CLOTHES'],
      daimyo: ['SILK_ROBE', 'BROCADE_GOWN'],
      scholar: ['SILK_ROBE'],
      peasant: ['PEASANT_TUNIC', 'SIMPLE_TUNIC']
    },
    MENA: {
      default: ['ABAYA', 'SIMPLE_TUNIC'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['CAFTAN', 'FINE_CLOTHES'],
      emir: ['CAFTAN', 'SILK_ROBE', 'BROCADE_GOWN'],
      scholar: ['CAFTAN', 'SIMPLE_ROBE'],
      peasant: ['PEASANT_TUNIC', 'ABAYA']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['SIMPLE_TUNIC', 'BARK_CLOTH_WRAP'],
      warrior: ['LEATHER_TUNIC'],
      trader: ['SIMPLE_TUNIC'],
      chief: ['CEREMONIAL_WRAP', 'CHIEFLY_ROBE'],
      shaman: ['CEREMONIAL_WRAP']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['PEASANT_TUNIC', 'SIMPLE_TUNIC'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['FINE_CLOTHES', 'CRAFTSMAN_TUNIC'],
      aristocrat: ['FINE_CLOTHES', 'SILK_ROBE']
    },
    OCEANIA: {
      default: ['BARK_CLOTH_WRAP', 'WORK_WRAP'],
      warrior: ['CEREMONIAL_WRAP'],
      trader: ['HYBRID_SHIRT', 'WORK_WRAP'],
      chief: ['CEREMONIAL_WRAP', 'CHIEFLY_ROBE'],
      navigator: ['WORK_WRAP', 'HYBRID_SHIRT']
    },
    SOUTH_ASIAN: {
      default: ['KURTA', 'SIMPLE_TUNIC'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['ANARKALI', 'FINE_CLOTHES'],
      raja: ['SILK_ROBE', 'ANARKALI', 'BROCADE_GOWN'],
      scholar: ['KURTA', 'SIMPLE_ROBE'],
      peasant: ['PEASANT_TUNIC', 'KURTA']
    },
    SOUTH_AMERICAN: {
      default: ['INCA_TUNIC', 'SIMPLE_TUNIC'],
      warrior: ['LEATHER_TUNIC'],
      trader: ['INCA_TUNIC'],
      noble: ['NOBLE_TUNIC', 'CHIEFLY_ROBE'],
      priest: ['CEREMONIAL_WRAP', 'NOBLE_TUNIC']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['DASHIKI', 'SIMPLE_TUNIC'],
      warrior: ['LEATHER_TUNIC'],
      trader: ['BOUBOU', 'DASHIKI'],
      king: ['BOUBOU', 'CHIEFLY_ROBE', 'BROCADE_GOWN'],
      griot: ['DASHIKI', 'BOUBOU']
    }
  },
  RENAISSANCE_EARLY_MODERN: {
    EUROPEAN: {
      default: ['PEASANT_SHIRT', 'COTTON_SHIRT', 'SIMPLE_TUNIC'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['FINE_CLOTHES', 'BOURGEOIS_DRESS'],
      aristocrat: ['COURT_GOWN', 'BROCADE_GOWN', 'FINE_CLOTHES'],
      scholar: ['SIMPLE_ROBE', 'FINE_CLOTHES'],
      artisan: ['CRAFTSMAN_TUNIC', 'LEATHER_APRON'],
      peasant: ['PEASANT_SHIRT', 'PEASANT_TUNIC']
    },
    EAST_ASIAN: {
      default: ['SIMPLE_TUNIC', 'KURTA', 'COTTON_SHIRT'],
      samurai: ['LEATHER_TUNIC'],
      merchant: ['SILK_ROBE', 'FINE_CLOTHES'],
      daimyo: ['SILK_ROBE', 'BROCADE_GOWN', 'COURT_GOWN'],
      scholar: ['SILK_ROBE'],
      peasant: ['PEASANT_TUNIC', 'COTTON_SHIRT']
    },
    MENA: {
      default: ['ABAYA', 'COTTON_SHIRT'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['CAFTAN', 'FINE_CLOTHES'],
      pasha: ['CAFTAN', 'SILK_ROBE', 'COURT_GOWN'],
      scholar: ['CAFTAN', 'SIMPLE_ROBE'],
      peasant: ['PEASANT_SHIRT', 'ABAYA']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['SIMPLE_TUNIC', 'COTTON_SHIRT'],
      warrior: ['LEATHER_TUNIC'],
      trader: ['HYBRID_SHIRT', 'COTTON_SHIRT'],
      chief: ['CEREMONIAL_WRAP', 'CHIEFLY_ROBE']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['COLONIAL_DRESS', 'COTTON_SHIRT', 'PLANTATION_SHIRT'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['FINE_CLOTHES', 'BOURGEOIS_DRESS'],
      planter: ['FINE_CLOTHES', 'COURT_GOWN'],
      slave: ['PLANTATION_SHIRT', 'SLAVE_TUNIC']
    },
    OCEANIA: {
      default: ['HYBRID_SHIRT', 'WORK_WRAP', 'COTTON_SHIRT'],
      warrior: ['CEREMONIAL_WRAP'],
      trader: ['HYBRID_SHIRT', 'COTTON_SHIRT'],
      chief: ['CEREMONIAL_WRAP', 'CHIEFLY_ROBE']
    },
    SOUTH_ASIAN: {
      default: ['KURTA', 'COTTON_SHIRT'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['ANARKALI', 'FINE_CLOTHES'],
      nawab: ['SILK_ROBE', 'COURT_GOWN', 'BROCADE_GOWN'],
      scholar: ['KURTA', 'SIMPLE_ROBE'],
      peasant: ['PEASANT_SHIRT', 'KURTA']
    },
    SOUTH_AMERICAN: {
      default: ['COLONIAL_DRESS', 'COTTON_SHIRT', 'PLANTATION_SHIRT'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['FINE_CLOTHES', 'BOURGEOIS_DRESS'],
      hacienda_owner: ['FINE_CLOTHES', 'COURT_GOWN'],
      slave: ['PLANTATION_SHIRT', 'SLAVE_TUNIC'],
      indigenous: ['INCA_TUNIC', 'SIMPLE_TUNIC']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['DASHIKI', 'COTTON_SHIRT'],
      warrior: ['LEATHER_TUNIC'],
      trader: ['BOUBOU', 'DASHIKI', 'HYBRID_SHIRT'],
      king: ['BOUBOU', 'CHIEFLY_ROBE', 'COURT_GOWN'],
      griot: ['DASHIKI', 'BOUBOU']
    }
  },
  INDUSTRIAL_ERA: {
    EUROPEAN: {
      default: ['FACTORY_SHIRT', 'WORK_SHIRT', 'COTTON_SHIRT', 'FROCK_COAT'],
      soldier: ['LEATHER_TUNIC'],
      industrialist: ['FROCK_COAT', 'MORNING_COAT', 'FORMAL_SHIRT', 'FINE_CLOTHES'],
      aristocrat: ['MORNING_COAT', 'COURT_GOWN', 'BALL_GOWN', 'CORSET'],
      worker: ['FACTORY_SHIRT', 'MILL_SHIRT', 'WORK_SHIRT'],
      clerk: ['FORMAL_SHIRT', 'FROCK_COAT', 'COTTON_SHIRT'],
      merchant: ['FROCK_COAT', 'FORMAL_SHIRT', 'FINE_CLOTHES'],
      lady: ['VICTORIAN_BLOUSE', 'CORSET', 'AFTERNOON_GOWN', 'BUSTLE_DRESS'],
      servant: ['COTTON_SHIRT', 'WORK_SHIRT', 'FACTORY_DRESS']
    },
    EAST_ASIAN: {
      default: ['COTTON_SHIRT', 'WORK_SHIRT'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['FORMAL_SHIRT', 'SILK_ROBE'],
      official: ['SILK_ROBE', 'FORMAL_SHIRT', 'FROCK_COAT'],
      worker: ['FACTORY_SHIRT', 'WORK_SHIRT'],
      peasant: ['PEASANT_SHIRT', 'COTTON_SHIRT']
    },
    MENA: {
      default: ['ABAYA', 'COTTON_SHIRT', 'WORK_SHIRT'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['CAFTAN', 'FORMAL_SHIRT', 'FROCK_COAT'],
      official: ['CAFTAN', 'FORMAL_SHIRT', 'FROCK_COAT'],
      worker: ['WORK_SHIRT', 'COTTON_SHIRT']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['COTTON_SHIRT', 'WORK_SHIRT'],
      warrior: ['LEATHER_TUNIC'],
      trader: ['HYBRID_SHIRT', 'COTTON_SHIRT']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['WORK_SHIRT', 'COTTON_SHIRT', 'FACTORY_SHIRT', 'FROCK_COAT'],
      soldier: ['LEATHER_TUNIC'],
      businessman: ['FROCK_COAT', 'MORNING_COAT', 'FORMAL_SHIRT', 'FINE_CLOTHES'],
      industrialist: ['FROCK_COAT', 'MORNING_COAT', 'FORMAL_SHIRT'],
      lady: ['VICTORIAN_BLOUSE', 'CORSET', 'AFTERNOON_GOWN'],
      worker: ['FACTORY_SHIRT', 'MILL_SHIRT', 'WORK_SHIRT'],
      clerk: ['FORMAL_SHIRT', 'FROCK_COAT']
    },
    OCEANIA: {
      default: ['HYBRID_SHIRT', 'COTTON_SHIRT', 'WORK_SHIRT'],
      warrior: ['CEREMONIAL_WRAP'],
      trader: ['HYBRID_SHIRT', 'FORMAL_SHIRT'],
      official: ['FORMAL_SHIRT', 'COLONIAL_DRESS', 'FROCK_COAT']
    },
    SOUTH_ASIAN: {
      default: ['KURTA', 'COTTON_SHIRT', 'WORK_SHIRT'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['ANARKALI', 'FORMAL_SHIRT'],
      official: ['FORMAL_SHIRT', 'SILK_ROBE', 'FROCK_COAT'],
      worker: ['FACTORY_SHIRT', 'MILL_SHIRT', 'WORK_SHIRT'],
      peasant: ['PEASANT_SHIRT', 'KURTA']
    },
    SOUTH_AMERICAN: {
      default: ['COTTON_SHIRT', 'WORK_SHIRT'],
      soldier: ['LEATHER_TUNIC'],
      merchant: ['FORMAL_SHIRT', 'BOURGEOIS_DRESS', 'FROCK_COAT'],
      landowner: ['FROCK_COAT', 'MORNING_COAT', 'FORMAL_SHIRT', 'AFTERNOON_GOWN'],
      worker: ['PLANTATION_SHIRT', 'WORK_SHIRT']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['DASHIKI', 'COTTON_SHIRT', 'WORK_SHIRT'],
      warrior: ['LEATHER_TUNIC'],
      trader: ['BOUBOU', 'FORMAL_SHIRT'],
      official: ['FORMAL_SHIRT', 'COLONIAL_DRESS', 'FROCK_COAT'],
      worker: ['WORK_SHIRT', 'COTTON_SHIRT']
    }
  },
  MODERN_ERA: {
    EUROPEAN: {
      default: ['T_SHIRT', 'POLO_SHIRT', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'BLOUSE'],
      executive: ['FORMAL_SHIRT', 'COCKTAIL_DRESS'],
      worker: ['WORK_SHIRT', 'T_SHIRT'],
      artist: ['T_SHIRT', 'CARDIGAN']
    },
    EAST_ASIAN: {
      default: ['T_SHIRT', 'POLO_SHIRT', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'BLOUSE'],
      executive: ['FORMAL_SHIRT', 'A_LINE_DRESS'],
      worker: ['WORK_SHIRT', 'T_SHIRT']
    },
    MENA: {
      default: ['T_SHIRT', 'COTTON_SHIRT', 'ABAYA'],
      professional: ['FORMAL_SHIRT', 'ABAYA'],
      executive: ['FORMAL_SHIRT', 'CAFTAN'],
      worker: ['WORK_SHIRT', 'T_SHIRT']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['T_SHIRT', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT'],
      traditional: ['CEREMONIAL_WRAP', 'DASHIKI']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['T_SHIRT', 'POLO_SHIRT', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'BLOUSE'],
      executive: ['FORMAL_SHIRT', 'COCKTAIL_DRESS'],
      worker: ['WORK_SHIRT', 'T_SHIRT']
    },
    OCEANIA: {
      default: ['T_SHIRT', 'TANK_TOP', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'A_LINE_DRESS'],
      traditional: ['CEREMONIAL_WRAP', 'HYBRID_SHIRT']
    },
    SOUTH_ASIAN: {
      default: ['T_SHIRT', 'KURTA', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'ANARKALI'],
      executive: ['FORMAL_SHIRT', 'SILK_ROBE'],
      worker: ['WORK_SHIRT', 'T_SHIRT']
    },
    SOUTH_AMERICAN: {
      default: ['T_SHIRT', 'POLO_SHIRT', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'A_LINE_DRESS'],
      executive: ['FORMAL_SHIRT', 'COCKTAIL_DRESS'],
      worker: ['WORK_SHIRT', 'T_SHIRT']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['T_SHIRT', 'DASHIKI', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'BOUBOU'],
      executive: ['FORMAL_SHIRT', 'COCKTAIL_DRESS'],
      worker: ['WORK_SHIRT', 'T_SHIRT']
    }
  },
  FUTURE_ERA: {
    EUROPEAN: {
      default: ['T_SHIRT', 'POLO_SHIRT', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'BLOUSE', 'A_LINE_DRESS'],
      executive: ['FORMAL_SHIRT', 'COCKTAIL_DRESS', 'COUTURE_GOWN'],
      tech_worker: ['T_SHIRT', 'POLO_SHIRT'],
      artist: ['T_SHIRT', 'CARDIGAN']
    },
    EAST_ASIAN: {
      default: ['T_SHIRT', 'POLO_SHIRT', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'BLOUSE', 'A_LINE_DRESS'],
      executive: ['FORMAL_SHIRT', 'COCKTAIL_DRESS'],
      tech_worker: ['T_SHIRT', 'POLO_SHIRT']
    },
    MENA: {
      default: ['T_SHIRT', 'COTTON_SHIRT', 'ABAYA'],
      professional: ['FORMAL_SHIRT', 'ABAYA'],
      executive: ['FORMAL_SHIRT', 'CAFTAN', 'COCKTAIL_DRESS'],
      tech_worker: ['T_SHIRT', 'POLO_SHIRT']
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
      default: ['T_SHIRT', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT'],
      traditional: ['CEREMONIAL_WRAP', 'DASHIKI']
    },
    NORTH_AMERICAN_COLONIAL: {
      default: ['T_SHIRT', 'POLO_SHIRT', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'BLOUSE', 'A_LINE_DRESS'],
      executive: ['FORMAL_SHIRT', 'COCKTAIL_DRESS', 'COUTURE_GOWN'],
      tech_worker: ['T_SHIRT', 'POLO_SHIRT']
    },
    OCEANIA: {
      default: ['T_SHIRT', 'TANK_TOP', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'A_LINE_DRESS'],
      tech_worker: ['T_SHIRT', 'POLO_SHIRT']
    },
    SOUTH_ASIAN: {
      default: ['T_SHIRT', 'KURTA', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'ANARKALI'],
      executive: ['FORMAL_SHIRT', 'SILK_ROBE', 'COCKTAIL_DRESS'],
      tech_worker: ['T_SHIRT', 'POLO_SHIRT']
    },
    SOUTH_AMERICAN: {
      default: ['T_SHIRT', 'POLO_SHIRT', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'A_LINE_DRESS'],
      executive: ['FORMAL_SHIRT', 'COCKTAIL_DRESS'],
      tech_worker: ['T_SHIRT', 'POLO_SHIRT']
    },
    SUB_SAHARAN_AFRICAN: {
      default: ['T_SHIRT', 'DASHIKI', 'COTTON_SHIRT'],
      professional: ['FORMAL_SHIRT', 'BOUBOU', 'A_LINE_DRESS'],
      executive: ['FORMAL_SHIRT', 'COCKTAIL_DRESS'],
      tech_worker: ['T_SHIRT', 'POLO_SHIRT']
    }
  }
};

const climateModifiers: Record<ClimateType, string[]> = {
  tropical: ['TANK_TOP', 'T_SHIRT', 'COTTON_SHIRT', 'DASHIKI', 'ABAYA'],
  arid: ['ABAYA', 'CAFTAN', 'COTTON_SHIRT', 'TANK_TOP'],
  temperate: ['COTTON_SHIRT', 'WOOL_TUNIC', 'CARDIGAN', 'BLOUSE'],
  continental: ['WOOL_TUNIC', 'CARDIGAN', 'LEATHER_TUNIC'],
  polar: ['WOOL_TUNIC', 'LEATHER_TUNIC', 'CARDIGAN']
};

const socialClassModifiers: Record<SocialClass, string[]> = {
  slave: ['SLAVE_TUNIC', 'PLANTATION_SHIRT', 'ROUGH_TUNIC'],
  serf: ['SERF_TUNIC', 'PEASANT_TUNIC', 'ROUGH_TUNIC'],
  peasant: ['PEASANT_TUNIC', 'PEASANT_SHIRT', 'ROUGH_TUNIC', 'SIMPLE_TUNIC'],
  commoner: ['SIMPLE_TUNIC', 'COTTON_SHIRT', 'WORK_SHIRT', 'CRAFTSMAN_TUNIC'],
  merchant: ['FINE_CLOTHES', 'BOURGEOIS_DRESS', 'FORMAL_SHIRT', 'SILK_ROBE'],
  noble: ['COURT_GOWN', 'BROCADE_GOWN', 'SILK_ROBE', 'FINE_CLOTHES'],
  royalty: ['COURT_GOWN', 'BALL_GOWN', 'COUTURE_GOWN', 'CHIEFLY_ROBE']
};

export function generateContextualTorso(
  profession: string,
  options: {
    era?: HistoricalEra;
    culture?: CulturalZone;
    socialClass?: SocialClass;
    climate?: ClimateType;
    privilege?: number;
  } = {}
): string | null {
  const era = options.era || 'MEDIEVAL';
  const culture = options.culture || 'EUROPEAN';
  const socialClass = options.socialClass || 'commoner';
  
  const eraTorso = torsoByEraAndCulture[era]?.[culture];
  if (!eraTorso) {
    return 'SIMPLE_TUNIC';
  }

  const normalizedProfession = profession.toLowerCase();
  
  let candidates: string[] = [];
  
  for (const [key, items] of Object.entries(eraTorso)) {
    if (normalizedProfession.includes(key) || key === 'default') {
      candidates.push(...items);
    }
  }
  
  if (options.socialClass && socialClassModifiers[options.socialClass]) {
    const classItems = socialClassModifiers[options.socialClass];
    candidates = candidates.filter(item => 
      classItems.some(classItem => item === classItem)
    ).concat(classItems);
  }
  
  if (options.climate && climateModifiers[options.climate]) {
    const climateItems = climateModifiers[options.climate];
    const climateSuitable = candidates.filter(item => 
      climateItems.includes(item)
    );
    if (climateSuitable.length > 0) {
      candidates = climateSuitable;
    }
  }
  
  if (candidates.length === 0) {
    candidates = eraTorso.default || ['SIMPLE_TUNIC'];
  }
  
  const uniqueCandidates = [...new Set(candidates)];
  
  if (options.privilege !== undefined) {
    const sortedByValue = uniqueCandidates.sort((a, b) => {
      const aValue = getTorsoValue(a);
      const bValue = getTorsoValue(b);
      return options.privilege! > 50 ? bValue - aValue : aValue - bValue;
    });
    return sortedByValue[0] || 'SIMPLE_TUNIC';
  }
  
  return uniqueCandidates[Math.floor(Math.random() * uniqueCandidates.length)] || 'SIMPLE_TUNIC';
}

function getTorsoValue(torsoId: string): number {
  const valueMap: Record<string, number> = {
    'COUTURE_GOWN': 600,
    'COURT_GOWN': 150,
    'CHIEFLY_ROBE': 120,
    'BALL_GOWN': 90,
    'BROCADE_GOWN': 75,
    'NOBLE_TUNIC': 70,
    'SILK_ROBE': 40,
    'COCKTAIL_DRESS': 40,
    'AFTERNOON_GOWN': 35,
    'FINE_CLOTHES': 35,
    'BOURGEOIS_DRESS': 30,
    'ANARKALI': 25,
    'COTEHARDIE': 25,
    'LEATHER_TUNIC': 25,
    'CAFTAN': 20,
    'INCA_TUNIC': 20,
    'DASHIKI': 18,
    'CITIZEN_TOGA': 18,
    'BOUBOU': 16,
    'COLONIAL_DRESS': 15,
    'CEREMONIAL_WRAP': 15,
    'A_LINE_DRESS': 12,
    'HYBRID_SHIRT': 12,
    'CARDIGAN': 12,
    'VICTORIAN_BLOUSE': 22,
    'FROCK_COAT': 30,
    'MORNING_COAT': 40,
    'CORSET': 18,
    'BUSTLE_DRESS': 30,
    'FACTORY_DRESS': 2,
    'FORMAL_SHIRT': 9,
    'POLO_SHIRT': 10,
    'CRAFTSMAN_TUNIC': 10,
    'KURTA': 8,
    'ABAYA': 9,
    'CHITON': 7,
    'BLOUSE': 6,
    'COTTON_SHIRT': 5,
    'WOOL_TUNIC': 5,
    'WORK_SHIRT': 4,
    'SIMPLE_ROBE': 4,
    'T_SHIRT': 4,
    'TANK_TOP': 3,
    'SIMPLE_TUNIC': 3,
    'MILL_SHIRT': 3,
    'FACTORY_SHIRT': 2,
    'PEASANT_SHIRT': 2,
    'PEASANT_TUNIC': 2,
    'ROUGH_TUNIC': 1,
    'SERF_TUNIC': 1,
    'SLAVE_TUNIC': 1,
    'PLANTATION_SHIRT': 1,
    'BARK_CLOTH_WRAP': 1,
    'WORK_WRAP': 1
  };
  
  return valueMap[torsoId] || 3;
}

export const GENERIC_TORSO_ITEMS = [
  'SIMPLE_TUNIC',
  'WOOL_TUNIC', 
  'SIMPLE_ROBE',
  'LEATHER_APRON',
  'PEASANT_TUNIC',
  'ROUGH_TUNIC'
];