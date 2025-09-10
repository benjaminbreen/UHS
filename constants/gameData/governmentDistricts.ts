/**
 * constants/gameData/governmentDistricts.ts
 * Region-specific and culturally accurate government district mappings.
 * 
 * Priority order:
 * 1. Region-specific mappings (e.g., "British Isles" within EUROPEAN)
 * 2. Cultural zone fallbacks (e.g., EUROPEAN)
 * 3. Universal fallback
 */

import { HistoricalEra, CulturalZone } from '../../types';
import { SpecialMapArchetype } from '../../types/specialMapTypes';

export interface GovernmentDistrictType {
  id: string;
  name: string;
  archetype: SpecialMapArchetype;
  description: string;
  districtType: string; // e.g., 'forum', 'palace', 'council', 'administration'
  symbolType: string; // which symbol component to render
  priority: number; // for weighted selection (higher = more likely)
}

export interface GovernmentFunction {
  name: string;
  description: string;
  icon?: string;
}

// Region-specific mappings take priority over cultural zone defaults
export const REGION_SPECIFIC_DISTRICTS: Record<string, Record<HistoricalEra, GovernmentDistrictType[]>> = {
  // OCEANIA regions
  "Australia – Southeast": {
    [HistoricalEra.PREHISTORY]: [
      {
        id: 'songline_nexus',
        name: 'Songline Nexus',
        archetype: SpecialMapArchetype.SACRED_COMPLEX,
        description: 'A sacred convergence of Dreamtime paths where elders gather to maintain the law.',
        districtType: 'sacred_council',
        symbolType: 'SonglineNexusSymbol',
        priority: 10
      },
      {
        id: 'elder_meeting_ground',
        name: "Elders' Meeting Ground",
        archetype: SpecialMapArchetype.OPEN_FIELD,
        description: 'Traditional gathering place for tribal decisions and ceremonies.',
        districtType: 'council',
        symbolType: 'OpenAirCouncilSymbol',
        priority: 8
      }
    ],
    [HistoricalEra.ANTIQUITY]: [
      {
        id: 'corroboree_ground',
        name: 'Corroboree Ground',
        archetype: SpecialMapArchetype.SACRED_COMPLEX,
        description: 'Ceremonial site where multiple clans gather for law-giving and trade.',
        districtType: 'sacred_council',
        symbolType: 'CorroboreeGroundSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      {
        id: 'protectorate_office',
        name: 'Aboriginal Protectorate Office',
        archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX,
        description: 'Colonial administration for Aboriginal affairs.',
        districtType: 'colonial_office',
        symbolType: 'ColonialOfficeSymbol',
        priority: 10
      }
    ]
  },
  
  "New Zealand": {
    [HistoricalEra.PREHISTORY]: [
      {
        id: 'maori_settlement',
        name: 'Kainga Council',
        archetype: SpecialMapArchetype.TRIBAL_COUNCIL,
        description: 'Early Māori settlement governance.',
        districtType: 'settlement_council',
        symbolType: 'TribalCouncilSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.MEDIEVAL]: [
      {
        id: 'marae_complex',
        name: 'Marae',
        archetype: SpecialMapArchetype.SACRED_COMPLEX,
        description: 'Sacred meeting ground with carved wharenui where iwi gather.',
        districtType: 'sacred_council',
        symbolType: 'MaraeSymbol',
        priority: 10
      },
      {
        id: 'pa_fortress',
        name: 'Pā Council',
        archetype: SpecialMapArchetype.MILITARY_FORTRESS,
        description: 'Fortified hilltop where chiefs hold war councils.',
        districtType: 'military_council',
        symbolType: 'PaFortressSymbol',
        priority: 7
      }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      {
        id: 'colonial_office_nz',
        name: 'Colonial Secretary Office',
        archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX,
        description: 'British colonial government in New Zealand.',
        districtType: 'colonial_office',
        symbolType: 'ColonialOfficeSymbol',
        priority: 10
      }
    ]
  },
  
  "New Guinea and Melanesia": {
    [HistoricalEra.PREHISTORY]: [
      {
        id: 'longhouse_council',
        name: 'Longhouse Council',
        archetype: SpecialMapArchetype.TRIBAL_COUNCIL,
        description: 'Great communal house where clan leaders make decisions.',
        districtType: 'council',
        symbolType: 'LonghouseSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.ANTIQUITY]: [
      {
        id: 'big_man_compound',
        name: "Big Man's Compound",
        archetype: SpecialMapArchetype.TRIBAL_COUNCIL,
        description: 'Center of traditional Melanesian leadership.',
        districtType: 'compound',
        symbolType: 'TribalCouncilSymbol',
        priority: 10
      }
    ]
  },
  
  "Polynesia": {
    [HistoricalEra.PREHISTORY]: [
      {
        id: 'chief_platform',
        name: 'Chiefly Platform',
        archetype: SpecialMapArchetype.SACRED_COMPLEX,
        description: 'Stone platform where Polynesian chiefs hold court.',
        districtType: 'chiefly_court',
        symbolType: 'ChieflyPlatformSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.MEDIEVAL]: [
      {
        id: 'royal_heiau',
        name: 'Royal Heiau',
        archetype: SpecialMapArchetype.SACRED_COMPLEX,
        description: 'Sacred temple complex for royal ceremonies and governance.',
        districtType: 'royal_temple',
        symbolType: 'HeiauSymbol',
        priority: 10
      }
    ]
  },
  
  // EUROPEAN regions
  "British Isles": {
    [HistoricalEra.PREHISTORY]: [
      {
        id: 'hillfort_council',
        name: 'Hillfort Council',
        archetype: SpecialMapArchetype.MILITARY_FORTRESS,
        description: 'Bronze Age hillfort where chieftains gather.',
        districtType: 'military_council',
        symbolType: 'HillfortSymbol',
        priority: 10
      },
      {
        id: 'stone_circle_assembly',
        name: 'Stone Circle Assembly',
        archetype: SpecialMapArchetype.SACRED_COMPLEX,
        description: 'Sacred stone circle where druids and chiefs meet.',
        districtType: 'sacred_council',
        symbolType: 'StoneCircleSymbol',
        priority: 8
      }
    ],
    [HistoricalEra.ANTIQUITY]: [
      {
        id: 'roman_forum_britannia',
        name: 'Forum Britannicum',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'Roman administrative center with basilica and temples.',
        districtType: 'forum',
        symbolType: 'RomanForumSymbol',
        priority: 10
      },
      {
        id: 'celtic_oppidum',
        name: 'Celtic Oppidum',
        archetype: SpecialMapArchetype.MILITARY_FORTRESS,
        description: 'Native British fortified town resisting Roman rule.',
        districtType: 'military_council',
        symbolType: 'CelticOppidumSymbol',
        priority: 5
      }
    ],
    [HistoricalEra.MEDIEVAL]: [
      {
        id: 'anglo_saxon_hall',
        name: 'Mead Hall',
        archetype: SpecialMapArchetype.PALACE_COMPLEX,
        description: 'Anglo-Saxon king\'s hall where warriors gather.',
        districtType: 'royal_hall',
        symbolType: 'MeadHallSymbol',
        priority: 10
      },
      {
        id: 'norman_castle',
        name: 'Norman Keep',
        archetype: SpecialMapArchetype.MILITARY_FORTRESS,
        description: 'Norman castle administering conquered territory.',
        districtType: 'castle',
        symbolType: 'NormanKeepSymbol',
        priority: 8
      }
    ]
  },
  
  "Iberia": {
    [HistoricalEra.PREHISTORY]: [
      {
        id: 'castro_council',
        name: 'Castro',
        archetype: SpecialMapArchetype.MILITARY_FORTRESS,
        description: 'Celtic hilltop settlement in Iberia.',
        districtType: 'hillfort',
        symbolType: 'CastroSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.ANTIQUITY]: [
      {
        id: 'roman_forum_hispania',
        name: 'Forum Hispaniae',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'Roman colonial forum in Hispania.',
        districtType: 'forum',
        symbolType: 'RomanForumSymbol',
        priority: 10
      },
      {
        id: 'celtiberian_castro',
        name: 'Celtiberian Castro',
        archetype: SpecialMapArchetype.MILITARY_FORTRESS,
        description: 'Fortified settlement of the Celtiberians.',
        districtType: 'military_council',
        symbolType: 'CastroSymbol',
        priority: 6
      }
    ],
    [HistoricalEra.MEDIEVAL]: [
      {
        id: 'alcazar',
        name: 'Alcázar',
        archetype: SpecialMapArchetype.PALACE_COMPLEX,
        description: 'Moorish palace-fortress serving as seat of power.',
        districtType: 'palace',
        symbolType: 'AlcazarSymbol',
        priority: 9
      },
      {
        id: 'cortes_hall',
        name: 'Cortes',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'Medieval Spanish parliament building.',
        districtType: 'parliament',
        symbolType: 'CortesHallSymbol',
        priority: 7
      }
    ]
  },
  
  "Scandinavia": {
    [HistoricalEra.PREHISTORY]: [
      {
        id: 'stone_ship_thing',
        name: 'Stone Ship Thing',
        archetype: SpecialMapArchetype.SACRED_COMPLEX,
        description: 'Sacred assembly site marked by stone ships.',
        districtType: 'sacred_assembly',
        symbolType: 'StoneShipSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.ANTIQUITY]: [
      {
        id: 'thing_mound',
        name: 'Thing Mound',
        archetype: SpecialMapArchetype.OPEN_FIELD,
        description: 'Sacred assembly mound for Germanic law-giving.',
        districtType: 'assembly',
        symbolType: 'ThingMoundSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.MEDIEVAL]: [
      {
        id: 'allthing',
        name: 'Allthing',
        archetype: SpecialMapArchetype.OPEN_FIELD,
        description: 'Open-air parliament where free men gather.',
        districtType: 'parliament',
        symbolType: 'AllthingSymbol',
        priority: 10
      },
      {
        id: 'konungsgard',
        name: 'Konungsgård',
        archetype: SpecialMapArchetype.PALACE_COMPLEX,
        description: "King's hall where royal court is held.",
        districtType: 'royal_hall',
        symbolType: 'KonungsgardSymbol',
        priority: 8
      }
    ]
  },
  
  "France": {
    [HistoricalEra.ANTIQUITY]: [
      {
        id: 'gallic_oppidum',
        name: 'Gallic Oppidum',
        archetype: SpecialMapArchetype.MILITARY_FORTRESS,
        description: 'Fortified Gallic settlement.',
        districtType: 'military_council',
        symbolType: 'GallicOppidumSymbol',
        priority: 6
      },
      {
        id: 'roman_forum_gaul',
        name: 'Forum Gallicum',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'Roman administrative center in Gaul.',
        districtType: 'forum',
        symbolType: 'RomanForumSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.MEDIEVAL]: [
      {
        id: 'frankish_palace',
        name: 'Palatium',
        archetype: SpecialMapArchetype.PALACE_COMPLEX,
        description: 'Frankish royal palace complex.',
        districtType: 'royal_palace',
        symbolType: 'FrankishPalaceSymbol',
        priority: 9
      },
      {
        id: 'medieval_commune',
        name: 'Commune Hall',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'Medieval town commune administration.',
        districtType: 'municipal',
        symbolType: 'CommuneHallSymbol',
        priority: 7
      }
    ]
  },

  "Italy": {
    [HistoricalEra.ANTIQUITY]: [
      {
        id: 'roman_forum_italia',
        name: 'Roman Forum',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'The heart of a Roman city, with the Curia for the Senate and Basilica for law courts.',
        districtType: 'forum',
        symbolType: 'RomanForumSymbol',
        priority: 10
      },
      {
        id: 'etruscan_council',
        name: 'Etruscan Council Place',
        archetype: SpecialMapArchetype.SACRED_COMPLEX,
        description: 'A sacred meeting ground where magistrates of the Etruscan League would gather.',
        districtType: 'sacred_council',
        symbolType: 'TribalCouncilSymbol',
        priority: 6
      }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      {
        id: 'signoria_palace',
        name: 'Palazzo della Signoria',
        archetype: SpecialMapArchetype.PALACE_COMPLEX,
        description: 'The fortified palace of an Italian city-state, serving as the seat of the republican government.',
        districtType: 'city_state_palace',
        symbolType: 'CityHallSymbol',
        priority: 10
      }
    ]
  },

  "Greece and Aegean": {
    [HistoricalEra.ANTIQUITY]: [
      {
        id: 'greek_agora',
        name: 'Agora',
        archetype: SpecialMapArchetype.MARKET_BAZAAR,
        description: 'The central public space in ancient Greek city-states, for assemblies, commerce, and justice.',
        districtType: 'democratic_assembly',
        symbolType: 'RomanForumSymbol',
        priority: 10
      },
       {
        id: 'acropolis_palace',
        name: 'Mycenaean Megaron',
        archetype: SpecialMapArchetype.PALACE_COMPLEX,
        description: 'The great hall within a Mycenaean palace complex, serving as the center of royal power.',
        districtType: 'royal_hall',
        symbolType: 'FeudalHallSymbol',
        priority: 8
      }
    ]
  },

  "Germanic Lands": {
    [HistoricalEra.MEDIEVAL]: [
      {
        id: 'imperial_diet',
        name: 'Imperial Diet Hall',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'A hall where the Imperial Diet of the Holy Roman Empire convenes.',
        districtType: 'parliament',
        symbolType: 'TownHallSymbol',
        priority: 7
      },
      {
        id: 'free_city_rathaus',
        name: 'Rathaus',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'The town hall of a Free Imperial City, symbolizing its self-governance.',
        districtType: 'municipal',
        symbolType: 'TownHallSymbol',
        priority: 10
      }
    ]
  },

  "Low Countries": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'terp_settlement_moot', name: 'Terp Settlement Moot', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Raised-mound community meeting ground for water management and kin arbitration.', districtType: 'assembly', symbolType: 'OpenAirCouncilSymbol', priority: 9 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'batavian_canal_forum', name: 'Canal-Side Forum', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Roman administrative forum adapted to wetlands and canals.', districtType: 'forum', symbolType: 'RomanForumSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'schepenbank', name: 'Schepenbank', archetype: SpecialMapArchetype.COURT_CHAMBER, description: 'Bench of aldermen for a chartered town; guilds and merchants nearby.', districtType: 'municipal_court', symbolType: 'TownHallSymbol', priority: 10 },
      { id: 'waterboard_hof', name: 'Water Board Hall', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Polder and dike administration (heemraadschap).', districtType: 'water_management', symbolType: 'TownHallSymbol', priority: 9 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'stadhuis', name: 'Stadhuis', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Civic town hall with carillon and market loggias.', districtType: 'municipal', symbolType: 'TownHallSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'parliament_binnenhof', name: 'Binnenhof Complex', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Parliamentary complex in a constitutional monarchy.', districtType: 'national_legislature', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'eu_council_quarter', name: 'European Council Quarter', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Intergovernmental council and commission buildings.', districtType: 'supranational_government', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'delta_resilience_hub', name: 'Delta Resilience Hub', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Climate governance center coordinating adaptive waterworks.', districtType: 'climate_governance', symbolType: 'AdminCenterSymbol', priority: 10 }
    ]
  },

  "Balkans": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'tell_hill_moot', name: 'Tell-Hill Moot', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Hilltop gathering near fortified tells for seasonal dispute settlement.', districtType: 'assembly', symbolType: 'OpenAirCouncilSymbol', priority: 8 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'polis_bouleuterion', name: 'Bouleuterion', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Council house of a Balkan polis with Roman overlays along the Via Egnatia.', districtType: 'city_council', symbolType: 'RomanForumSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'zupan_court', name: 'Župan’s Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Court of a regional lord with ecclesiastical influence.', districtType: 'feudal_court', symbolType: 'FeudalHallSymbol', priority: 8 },
      { id: 'communal_loggia', name: 'Communal Loggia', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Coastal commune hall for merchant and civic deliberations.', districtType: 'municipal', symbolType: 'TownHallSymbol', priority: 8 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'divan_kapija', name: 'Divan Kapija', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Ottoman provincial divan chamber within a fortress-town.', districtType: 'provincial_council', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'skupstina', name: 'Skupština Hall', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Constitutional assembly in a newly nationalizing state.', districtType: 'national_assembly', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'parliament_balkan', name: 'Parliament', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Modern parliamentary complex in the capital.', districtType: 'parliament', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'balkan_cooperation_forum', name: 'Regional Cooperation Forum', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Cross-border council balancing energy, migration, and heritage.', districtType: 'regional_cooperation', symbolType: 'AdminCenterSymbol', priority: 9 }
    ]
  },

  "Central Europe": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'oppidum_moot', name: 'Oppidum Moot', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'Hilltop enclosure used for seasonal councils and trade feasts.', districtType: 'tribal_assembly', symbolType: 'FeudalHallSymbol', priority: 9 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'roman_colonia_forum', name: 'Colonia Forum', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Forum-basilica complex of a Roman colonia on the Danube frontier.', districtType: 'forum', symbolType: 'RomanForumSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'burgher_rathaus', name: 'Rathaus', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Town hall of a burgher city under princely or episcopal overlordship.', districtType: 'municipal', symbolType: 'TownHallSymbol', priority: 10 },
      { id: 'princely_residenz', name: 'Residenz', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Princely residence and chancery with a court chapel.', districtType: 'princely_court', symbolType: 'FeudalHallSymbol', priority: 8 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'imperial_diet_ce', name: 'Imperial Diet Chamber', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Assembly hall used by estates of the empire.', districtType: 'diet', symbolType: 'TownHallSymbol', priority: 9 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'constitutional_parliament_ce', name: 'Constitutional Parliament', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Legislature of a constitutional monarchy or federal state.', districtType: 'parliament', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'federal_chancellery', name: 'Federal Chancellery', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Executive and parliamentary complex in a federal capital.', districtType: 'executive_legislative', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'green_transition_ministry', name: 'Green Transition Ministry', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Cabinet hub coordinating energy transition, rail and river corridors.', districtType: 'executive_policy_hub', symbolType: 'AdminCenterSymbol', priority: 9 }
    ]
  },

  "Eastern Europe": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'kurgan_assembly', name: 'Kurgan Assembly Ground', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Steppe gathering near burial mounds for seasonal treaties and exchanges.', districtType: 'assembly', symbolType: 'OpenAirCouncilSymbol', priority: 8 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'black_sea_polis_forum', name: 'Pontic Polis Agora', archetype: SpecialMapArchetype.MARKET_BAZAAR, description: 'Greek-style agora in a Black Sea port with civic stoa.', districtType: 'city_council', symbolType: 'RomanForumSymbol', priority: 8 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'veche_square', name: 'Veche Square', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Open assembly of townsmen ringing the veche bell.', districtType: 'communal_assembly', symbolType: 'TownHallSymbol', priority: 10 },
      { id: 'princely_kremlin', name: 'Princely Kremlin', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'Citadel complex with cathedral and chancery.', districtType: 'princely_court', symbolType: 'FeudalHallSymbol', priority: 9 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'hetmanate_rada', name: 'Cossack Rada', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Elective assembly of hosts and regiments.', districtType: 'military_assembly', symbolType: 'TownHallSymbol', priority: 9 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'duma_chamber', name: 'Duma Chamber', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Representative assembly hall in an imperial capital.', districtType: 'parliament', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'parliament_square_ee', name: 'Parliament Complex', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Modern legislature and government quarter.', districtType: 'legislature', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'eastern_partnership_forum', name: 'Eastern Partnership Forum', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Regional development and security council.', districtType: 'regional_forum', symbolType: 'AdminCenterSymbol', priority: 8 }
    ]
  },

  "Ural and Arctic Europe": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'taiga_camp_moot', name: 'Taiga Camp Moot', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Forest clearing for clan arbitration and trade with steppe and tundra peoples.', districtType: 'assembly', symbolType: 'OpenAirCouncilSymbol', priority: 9 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'fur_route_post', name: 'Fur Route Post', archetype: SpecialMapArchetype.MARKET_BAZAAR, description: 'Trading-post governance with shrine and weighing shed.', districtType: 'trade_admin', symbolType: 'TownHallSymbol', priority: 7 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'pogost', name: 'Pogost Court', archetype: SpecialMapArchetype.COURT_CHAMBER, description: 'Rural administrative yard with church and granary.', districtType: 'rural_admin', symbolType: 'TownHallSymbol', priority: 8 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'okrug_board', name: 'Okrug Administration', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'District board managing mines, rails, and exile colonies.', districtType: 'district_admin', symbolType: 'CityHallSymbol', priority: 9 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'arctic_oblast_center', name: 'Arctic Oblast Center', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Resource governance and indigenous affairs office.', districtType: 'regional_admin', symbolType: 'ModernParliamentSymbol', priority: 9 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'polar_council', name: 'Polar Council', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'International polar shipping & climate authority.', districtType: 'international_council', symbolType: 'AdminCenterSymbol', priority: 9 }
    ]
  },

  "Atlantic Islands": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'insular_council', name: 'Insular Council', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Local elder councils on Atlantic archipelagos.', districtType: 'council', symbolType: 'OpenAirCouncilSymbol', priority: 7 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'senao_concelho', name: 'Concelho Hall', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Municipal chamber for early colonization efforts.', districtType: 'municipal', symbolType: 'TownHallSymbol', priority: 8 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'capitania_house', name: 'Capitania House', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Captaincy administration over sugar, vines, and ports.', districtType: 'colonial_admin', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'governors_palace_ai', name: 'Governor’s Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Island governor and customs house complex.', districtType: 'colonial_government', symbolType: 'CityHallSymbol', priority: 9 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'autonomous_parliament', name: 'Autonomous Parliament', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Regional assembly within a European state.', districtType: 'regional_assembly', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'oceanic_energy_directorate', name: 'Oceanic Energy Directorate', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Marine wind, wave, and hydrogen governance hub.', districtType: 'energy_directorate', symbolType: 'AdminCenterSymbol', priority: 9 }
    ]
  },

  // == MENA REGIONS (Comprehensive) ==
  "Nile Valley": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'pharaoh_palace', name: 'Pharaonic Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The sprawling administrative and ceremonial complex of the Egyptian Pharaoh in Thebes or Memphis.', districtType: 'royal_palace', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'coptic_patriarchate', name: 'Coptic Patriarchate', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'The administrative center of the Coptic Pope, holding significant local authority.', districtType: 'religious_admin', symbolType: 'FeudalHallSymbol', priority: 6 },
      { id: 'fatimid_diwan', name: 'Fatimid Diwan', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The central administrative council hall of the Fatimid Caliphate in Cairo.', districtType: 'caliphate_admin', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'khedival_palace', name: 'Khedival Administration', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The European-style palace of the Khedive, representing semi-autonomous Egyptian rule.', districtType: 'khedival_government', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ]
  },
  "Levant": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'phoenician_council', name: 'Phoenician Council Hall', archetype: SpecialMapArchetype.TOWN_HALL, description: 'The administrative hall of a Phoenician merchant city-state like Tyre or Sidon.', districtType: 'merchant_council', symbolType: 'PhoenicianCouncilSymbol', priority: 10 },
      { id: 'herodian_palace', name: 'Herodian Palace', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'A fortified palace-complex serving as the seat of a Roman client king.', districtType: 'client_kingdom_seat', symbolType: 'RomanForumSymbol', priority: 8 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'umayyad_diwan', name: 'Umayyad Diwan', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The central government bureau of the Umayyad Caliphate in Damascus.', districtType: 'caliphate_admin', symbolType: 'CaliphCourtSymbol', priority: 10 },
      { id: 'crusader_castle_admin', name: 'Crusader High Court', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'The keep of a Crusader castle serving as the administrative center for the Kingdom of Jerusalem.', districtType: 'military_admin', symbolType: 'CrusaderCastleSymbol', priority: 8 }
    ]
  },
  "Anatolia": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'hittite_citadel', name: 'Hittite Citadel', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'The fortified royal citadel of the Hittite Empire at Hattusa.', districtType: 'imperial_fortress', symbolType: 'FeudalHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'byzantine_sacred_palace', name: 'Sacred Palace of Constantinople', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The vast imperial palace complex of the Byzantine Emperors.', districtType: 'imperial_palace', symbolType: 'FeudalHallSymbol', priority: 10 },
      { id: 'seljuk_caravanserai', name: 'Sultan\'s Caravanserai', archetype: SpecialMapArchetype.MARKET_BAZAAR, description: 'A grand, fortified caravanserai used by the Seljuk Sultan for administration and trade control.', districtType: 'trade_administration', symbolType: 'CaliphCourtSymbol', priority: 7 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'ottoman_divan_topkapi', name: 'Imperial Divan at Topkapi', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The council hall within the Topkapi Palace where the Ottoman imperial government met.', districtType: 'imperial_council', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ]
  },
  "Mesopotamia": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'uruk_temple_admin', name: 'Temple Administration Complex', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'An early Uruk-period temple complex managing city resources and labor.', districtType: 'temple_admin', symbolType: 'TempleAdminSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'babylonian_palace', name: 'Babylonian Royal Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The royal administrative and ceremonial center of the Babylonian Empire.', districtType: 'imperial_palace', symbolType: 'ZigguratSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'abbasid_round_city', name: 'Abbasid House of Wisdom', archetype: SpecialMapArchetype.UNIVERSITY, description: 'The administrative and intellectual heart of the Abbasid Caliphate in Baghdad.', districtType: 'caliphate_administration', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ]
  },
  "Arabian Peninsula": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'sabaean_temple_court', name: 'Sabaean Temple-Court', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'The temple-complex of the Mukarrib, the priest-king of the Sabaean Kingdom.', districtType: 'theocratic_council', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'rashidun_majlis', name: 'Caliph\'s Majlis', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The consultative assembly where the early Islamic Caliphs administered the state in Medina.', districtType: 'consultative_council', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ]
  },
  "Persian Plateau": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'achaemenid_apadana', name: 'Apadana at Persepolis', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The grand audience hall of the Achaemenid Persian kings, for receiving tribute and administering the empire.', districtType: 'imperial_audience_hall', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'safavid_ali_qapu', name: 'Ali Qapu Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The grand palace of the Safavid Shahs in Isfahan, used for imperial court and governance.', districtType: 'persian_court', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ]
  },

  "Nubian Corridor": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'napatan_palace', name: 'Napatan/Meroitic Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Royal court overseeing cataract trade routes.', districtType: 'royal_court', symbolType: 'FeudalHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'makurian_palace', name: 'Makurian Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Christian Nubian palace-church compound.', districtType: 'royal_admin', symbolType: 'FeudalHallSymbol', priority: 8 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'anglo_egyptian_governor', name: 'Anglo-Egyptian Governorate', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Colonial district headquarters along the Nile.', districtType: 'colonial_district', symbolType: 'ColonialOfficeSymbol', priority: 9 }
    ]
  },

  "Maghreb": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'punic_council', name: 'Punic Council House', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Council of elders in a Carthaginian or Punic town.', districtType: 'city_council', symbolType: 'RomanForumSymbol', priority: 9 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'kasbah_diwan', name: 'Kasbah Dīwān', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'Citadel quarter with administrative diwan and suq.', districtType: 'urban_admin', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'marinid_palace', name: 'Palace-Madrasa Complex', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Court with madrasa and qadi courts.', districtType: 'royal_court', symbolType: 'CaliphCourtSymbol', priority: 9 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'parliament_maghreb', name: 'Parliament/Assembly', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Post-colonial legislature and ministries.', districtType: 'parliament', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ]
  },

  "Caucasus": {
    [HistoricalEra.MEDIEVAL]: [
      { id: 'royal_court_caucasus', name: 'Royal/Ducal Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Fortified palace with council hall (darbazi).', districtType: 'royal_court', symbolType: 'FeudalHallSymbol', priority: 9 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'khans_citadel', name: 'Khan’s Citadel', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'Citadel with diwan-khana for governance.', districtType: 'khanship_admin', symbolType: 'CaliphCourtSymbol', priority: 8 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'parliament_caucasus', name: 'National Assembly', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Modern national assembly in the mountain republics.', districtType: 'parliament', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ]
  },

  "Eastern Desert and Red Sea": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'wadi_waystation_admin', name: 'Wadi Waystation Court', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'Fortified waystation overseeing miners and caravans.', districtType: 'desert_admin', symbolType: 'FeudalHallSymbol', priority: 9 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'port_customs_house', name: 'Port Customs House', archetype: SpecialMapArchetype.MARKET_BAZAAR, description: 'Harbor customs and qadi court by the Red Sea.', districtType: 'customs_court', symbolType: 'CaliphCourtSymbol', priority: 9 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'suez_authority', name: 'Canal Authority HQ', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Canal and port governance with pilotage board.', districtType: 'canal_authority', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ]
  },

  // == SOUTH ASIAN REGIONS (Comprehensive) ==
  "Indus Valley": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'mauryan_provincial_capital', name: 'Mauryan Provincial Capital', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The administrative center for a governor (Kumara) of a major province like Taxila.', districtType: 'imperial_court', symbolType: 'StepwellCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'sikh_durbar', name: 'Sikh Durbar', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'The royal court and military administration of the Sikh Empire in Lahore.', districtType: 'royal_court', symbolType: 'StepwellCourtSymbol', priority: 10 }
    ]
  },
  "Gangetic Plain": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'gupta_imperial_court', name: 'Gupta Imperial Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The imperial court of the Gupta Empire at Pataliputra, a center of arts and administration.', districtType: 'imperial_court', symbolType: 'StepwellCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'mughal_darbar_agra', name: 'Mughal Darbar at Agra', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The grand imperial court within the Red Fort of Agra, for public and private audiences with the Mughal Emperor.', districtType: 'imperial_darbar', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ]
  },
  "Deccan Plateau": {
    [HistoricalEra.MEDIEVAL]: [
      { id: 'vijayanagara_royal_center', name: 'Vijayanagara Royal Center', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The sprawling royal administrative and ceremonial heart of the Vijayanagara Empire.', districtType: 'royal_court', symbolType: 'StepwellCourtSymbol', priority: 10 },
      { id: 'bahmani_sultanate_court', name: 'Bahmani Sultanate Court', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'The fortified court of the Bahmani Sultanate, ruling from Gulbarga or Bidar.', districtType: 'sultanate_administration', symbolType: 'CaliphCourtSymbol', priority: 8 }
    ]
  },
  "Himalayas and Northeast": {
    [HistoricalEra.MEDIEVAL]: [
      { id: 'tibetan_dzong', name: 'Dzong Fortress', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'A fortress serving as the religious, military, and administrative center of a district in Tibet or Bhutan.', districtType: 'fortress_monastery', symbolType: 'MandateHallSymbol', priority: 10 }
    ]
  },
  "Sri Lanka": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'anuradhapura_palace', name: 'Anuradhapura Royal Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The royal palace complex within the sacred city of Anuradhapura, seat of early Sinhalese kings.', districtType: 'royal_court', symbolType: 'StepwellCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'kandyan_audience_hall', name: 'Kandyan Audience Hall', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The Magul Maduwa, the royal audience hall of the Kingdom of Kandy.', districtType: 'royal_court', symbolType: 'StepwellCourtSymbol', priority: 10 }
    ]
  },
  "Mainland Southeast Asia": {
    [HistoricalEra.MEDIEVAL]: [
      { id: 'khmer_royal_palace', name: 'Royal Palace at Angkor', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'The vast palace and temple complex serving as the religious and administrative heart of the Khmer Empire.', districtType: 'temple_state', symbolType: 'StepwellCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'ayutthayan_grand_palace', name: 'Ayutthayan Grand Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The administrative seat and royal residence of the Kingdom of Ayutthaya.', districtType: 'royal_court', symbolType: 'StepwellCourtSymbol', priority: 10 }
    ]
  },
  "Maritime Southeast Asia": {
    [HistoricalEra.MEDIEVAL]: [
      { id: 'majapahit_royal_compound', name: 'Majapahit Royal Compound', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The fortified royal compound (Kraton) of the Majapahit Empire.', districtType: 'royal_court', symbolType: 'IslandCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'malacca_sultanate_palace', name: 'Malacca Sultanate Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The wooden palace (Istana) of the Sultan of Malacca, a center of trade and Islamic governance.', districtType: 'sultanate_palace', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ]
  },
  "Philippines": {
    [HistoricalEra.MEDIEVAL]: [
      { id: 'datu_longhouse', name: 'Datu\'s Council Longhouse', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The communal longhouse where the local Datu holds council with village elders.', districtType: 'tribal_council', symbolType: 'LonghouseSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'spanish_cabildo', name: 'Spanish Cabildo', archetype: SpecialMapArchetype.TOWN_HALL, description: 'The municipal government hall in a Spanish colonial city like Manila.', districtType: 'colonial_municipal_hall', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ]
  },

  // == SIBERIAN REGIONS ==
  "Eastern Siberia": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'tungus_shamanic_council', name: 'Tungus Shamanic Council', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Sacred gathering place where Tungusic shamans and clan elders make decisions for the reindeer herders.', districtType: 'shamanic_council', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'even_clan_gathering', name: 'Even Clan Gathering', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Traditional assembly of Even clan leaders in the Siberian taiga.', districtType: 'clan_assembly', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'yakut_clan_assembly', name: 'Yakut Clan Assembly', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'The council ground of Sakha (Yakut) clan leaders in the Lena River valley.', districtType: 'clan_assembly', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'russian_siberian_outpost', name: 'Russian Colonial Outpost', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Remote Russian administrative post governing the indigenous peoples of Eastern Siberia.', districtType: 'colonial_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ]
  },

  "Western Siberia": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'ugric_clan_council', name: 'Ugric Clan Council', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Council house of Ugric-speaking peoples in the West Siberian taiga.', districtType: 'clan_council', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'siberian_khanate_court', name: 'Siberian Khanate Court', archetype: SpecialMapArchetype.COURT_CHAMBER, description: 'The court of the Khanate of Sibir, ruling from Qashliq over Siberian Tatars and tributaries.', districtType: 'khanate_court', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'russian_guberniya_office', name: 'Guberniya Administrative Office', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Russian provincial government office administering Western Siberia.', districtType: 'provincial_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ]
  },

  "Central Siberia": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'scythian_tribal_assembly', name: 'Scythian Tribal Assembly', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Open-air assembly ground of Scythian warriors and clan leaders.', districtType: 'nomadic_assembly', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'mongol_yam_station', name: 'Mongol Yam Station', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Administrative relay station of the Mongol postal system controlling the steppes.', districtType: 'postal_administration', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'trans_siberian_administration', name: 'Trans-Siberian Railway Administration', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Russian administrative center managing railway construction and regional development.', districtType: 'railway_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ]
  },

  // == STEPPE REGIONS ==
  "Mongolian Steppes": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'nomadic_kurultai', name: 'Nomadic Kurultai', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Traditional assembly of nomadic clan leaders on the Mongolian steppes.', districtType: 'nomadic_assembly', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'xiongnu_confederation_council', name: 'Xiongnu Confederation Council', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Council gathering of the powerful Xiongnu nomadic confederation.', districtType: 'confederation_council', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'great_kurultai', name: 'Great Kurultai', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'The supreme assembly of Mongol nobles and clan leaders choosing the Great Khan.', districtType: 'imperial_assembly', symbolType: 'TribalCouncilSymbol', priority: 10 },
      { id: 'khans_mobile_court', name: "Khan's Mobile Court", archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The traveling court of a Mongol Khan with his administrative staff and guards.', districtType: 'nomadic_court', symbolType: 'TribalCouncilSymbol', priority: 8 }
    ]
  },

  "Kazakh Steppes": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'saka_tribal_council', name: 'Saka Tribal Council', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Council of Saka warrior-nomads on the Kazakh steppes.', districtType: 'tribal_council', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'golden_horde_administration', name: 'Golden Horde Administrative Center', archetype: SpecialMapArchetype.COURT_CHAMBER, description: 'Administrative center of the Golden Horde governing the western steppes.', districtType: 'horde_administration', symbolType: 'TribalCouncilSymbol', priority: 10 },
      { id: 'kazakh_zhuz_assembly', name: 'Kazakh Zhuz Assembly', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Council of elders from the Great, Middle, or Little Horde of the Kazakhs.', districtType: 'horde_council', symbolType: 'TribalCouncilSymbol', priority: 8 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'tsarist_steppe_fort', name: 'Tsarist Steppe Fortress', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'Russian military-administrative fortress controlling the Kazakh steppes.', districtType: 'frontier_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ]
  },

  // == EAST ASIAN REGIONS (Comprehensive) ==
  "North China Plain": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'han_commandery', name: 'Commandery Headquarters', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The administrative headquarters of an imperial commandery during the Han Dynasty.', districtType: 'imperial_admin', symbolType: 'MandateHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'tang_ministry_hall', name: 'Hall of a Tang Ministry', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'A grand hall in the imperial city of Chang\'an, housing one of the Three Departments or Six Ministries.', districtType: 'imperial_ministry', symbolType: 'MandateHallSymbol', priority: 10 }
    ]
  },
  "South China": {
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'canton_hoppo_office', name: 'Hoppo\'s Office', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The office of the Qing Imperial Customs Supervisor in Canton, controlling all foreign trade.', districtType: 'trade_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ]
  },
  "West China and Tibet": {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'tibetan_kashag', name: 'Kashag Council', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The governing council of Tibet under the Dalai Lamas, located in Lhasa.', districtType: 'theocratic_council', symbolType: 'MandateHallSymbol', priority: 10 }
    ]
  },
  "Japan": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'kofun_chieftain_residence', name: 'Yamato Chieftain\'s Residence', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The palatial residence of a powerful clan chieftain during the Kofun period.', districtType: 'clan_palace', symbolType: 'MandateHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'heian_imperial_court', name: 'Heian Imperial Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The refined imperial court of the Heian period in Kyoto, a center of high culture and cloistered rule.', districtType: 'imperial_court', symbolType: 'MandateHallSymbol', priority: 10 },
      { id: 'kamakura_shogunate_hq', name: 'Kamakura Shogunate HQ', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'The military and administrative headquarters of the Kamakura Shogunate.', districtType: 'shogunate_government', symbolType: 'MandateHallSymbol', priority: 9 }
    ]
  },
  "Korea": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'silla_royal_court', name: 'Silla Royal Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The royal court of the Silla Kingdom in the capital of Gyeongju.', districtType: 'royal_court', symbolType: 'MandateHallSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'joseon_state_council', name: 'Hall of the State Council (Uijeongbu)', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The building housing the highest organ of government under the Joseon Dynasty in Seoul.', districtType: 'state_council', symbolType: 'MandateHallSymbol', priority: 10 }
    ]
  },
  "Mongolia and Manchuria": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'xiongnu_chanyus_court', name: 'Chanyu\'s Court', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'The mobile court of the Xiongnu Chanyu, center of the nomadic empire.', districtType: 'nomadic_court', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'mongol_ordu', name: 'Great Ordu', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The mobile palace-court of the Great Khan, the political and military center of the Mongol Empire.', districtType: 'imperial_court', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ]
  },
  "Central Asian Oases": {
    [HistoricalEra.MEDIEVAL]: [
      { id: 'sogdian_city_hall', name: 'Sogdian City Assembly', archetype: SpecialMapArchetype.MARKET_BAZAAR, description: 'The assembly hall for the merchant-aristocrats of a Sogdian city-state like Samarkand.', districtType: 'merchant_republic', symbolType: 'CaliphCourtSymbol', priority: 10 },
      { id: 'timurid_court', name: 'Timurid Imperial Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The magnificent court of Timur and his descendants, a center of Perso-Turkic art and power.', districtType: 'imperial_court', symbolType: 'CaliphCourtSymbol', priority: 9 }
    ]
  },
 // == SUB-SAHARAN AFRICAN REGIONS (Comprehensive & Definitive) ==
  "Sahel": {
    [HistoricalEra.ANTIQUITY]: [{ id: 'dhar_tichitt_complex', name: 'Dhar Tichitt Compound', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'The fortified compound of a local chieftain in one of the earliest West African urban centers.', districtType: 'proto_urban_center', symbolType: 'AfricanChiefdomSymbol', priority: 10 }],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'ghana_royal_court', name: 'Ghanaian Royal Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The royal court of the Ghana Empire in Koumbi Saleh, a center for the trans-Saharan gold trade.', districtType: 'royal_court', symbolType: 'AfricanChiefdomSymbol', priority: 10 },
      { id: 'mali_great_audience_hall', name: 'Mansa\'s Great Audience Hall', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The Great Audience Hall of the Mansa of Mali in Niani, where imperial justice was dispensed.', districtType: 'imperial_court', symbolType: 'AfricanChiefdomSymbol', priority: 9 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'askiyas_court', name: 'Askia\'s Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The imperial court of the Askia dynasty of the Songhai Empire in Gao.', districtType: 'imperial_court', symbolType: 'AfricanChiefdomSymbol', priority: 10 },
      { id: 'sokoto_caliphate_diwan', name: 'Sokoto Caliphate Diwan', archetype: SpecialMapArchetype.COURT_CHAMBER, description: 'The administrative council of the Sokoto Caliphate, a major Islamic state governed by Sharia.', districtType: 'caliphate_admin', symbolType: 'CaliphCourtSymbol', priority: 8 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [{ id: 'french_cercle_hq', name: 'Cercle Headquarters', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The administrative headquarters of a French colonial "Cercle" in French West Africa.', districtType: 'colonial_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 }],
    [HistoricalEra.MODERN_ERA]: [{ id: 'palais_presidentiel', name: 'Palais Présidentiel', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The presidential palace of a modern Sahelian republic.', districtType: 'presidential_palace', symbolType: 'AdminCenterSymbol', priority: 10 }],
    [HistoricalEra.FUTURE_ERA]: [{ id: 'ecowas_commission', name: 'ECOWAS Commission', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'A regional headquarters for the Economic Community of West African States.', districtType: 'regional_government', symbolType: 'AdminCenterSymbol', priority: 10 }]
  },
  "Upper Guinea": {
    [HistoricalEra.MEDIEVAL]: [{ id: 'jolof_lamanes_court', name: 'Lamanes\' Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The court of the Lamanes, the rulers of the Jolof Empire.', districtType: 'royal_court', symbolType: 'AfricanChiefdomSymbol', priority: 10 }],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [{ id: 'futa_djallon_almamy_court', name: 'Almamy\'s Court', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The court of the Almamy, the theocratic ruler of the Imamate of Futa Jallon.', districtType: 'theocratic_council', symbolType: 'CaliphCourtSymbol', priority: 10 }],
    [HistoricalEra.INDUSTRIAL_ERA]: [{ id: 'sierra_leone_governors_house', name: 'Governor\'s House, Freetown', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The seat of the British colonial Governor of Sierra Leone.', districtType: 'colonial_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 }]
  },
  "Lower Guinea and Congo Basin": {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [{ id: 'kongo_kings_court', name: 'King of Kongo\'s Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The royal court of the Manikongo of the Kingdom of Kongo, influenced by Portuguese contact.', districtType: 'royal_court', symbolType: 'AfricanChiefdomSymbol', priority: 10 }],
    [HistoricalEra.INDUSTRIAL_ERA]: [{ id: 'congo_free_state_post', name: 'Congo Free State Post', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'An administrative and military post of the brutally exploitative Congo Free State.', districtType: 'colonial_fort', symbolType: 'ColonialOfficeSymbol', priority: 10 }]
  },
  "Horn of Africa": {
    [HistoricalEra.ANTIQUITY]: [{ id: 'axumite_palace_complex', name: 'Axumite Palace Complex', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The grand multi-storied palace of the Negus of the Kingdom of Aksum, often with stone stelae.', districtType: 'royal_palace', symbolType: 'AfricanChiefdomSymbol', priority: 10 }],
    [HistoricalEra.MEDIEVAL]: [{ id: 'zagwe_rock_church_court', name: 'Zagwe Rock-Hewn Court', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'The political and religious center of the Zagwe Dynasty, based around the rock-hewn churches of Lalibela.', districtType: 'theocratic_capital', symbolType: 'AfricanChiefdomSymbol', priority: 10 }],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [{ id: 'adal_sultanate_court', name: 'Adal Sultanate Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The royal court of the Adal Sultanate, a powerful Islamic state in the Horn of Africa.', districtType: 'sultanate_palace', symbolType: 'CaliphCourtSymbol', priority: 10 }]
  },
  "East African Rift": {
    [HistoricalEra.MEDIEVAL]: [{ id: 'buganda_lukiiko_hall', name: 'Lukiiko Hall', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The parliament and council hall of the Kingdom of Buganda, where the Kabaka met with his chiefs.', districtType: 'traditional_parliament', symbolType: 'AfricanChiefdomSymbol', priority: 10 }],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [{ id: 'swahili_sultans_palace_zanzibar', name: 'Sultan\'s Palace of Zanzibar', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The coral-stone palace and administrative center of the Sultan of the Omani-Swahili empire.', districtType: 'sultanate_palace', symbolType: 'CaliphCourtSymbol', priority: 10 }],
    [HistoricalEra.INDUSTRIAL_ERA]: [{ id: 'german_east_africa_boma', name: 'German Boma', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'A fortified administrative compound of the German East Africa colonial government.', districtType: 'colonial_fort', symbolType: 'ColonialOfficeSymbol', priority: 10 }]
  },
  "Southern Africa": {
    [HistoricalEra.MEDIEVAL]: [{ id: 'mapungubwe_hill_palace', name: 'Mapungubwe Hill Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The elite palace complex atop Mapungubwe Hill, the capital of a prosperous pre-Zimbabwe kingdom.', districtType: 'royal_palace', symbolType: 'AfricanChiefdomSymbol', priority: 10 }],
    [HistoricalEra.INDUSTRIAL_ERA]: [
        { id: 'cape_parliament', name: 'Cape Parliament Building', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'The legislative building of the self-governing Cape Colony.', districtType: 'colonial_legislature', symbolType: 'CityHallSymbol', priority: 10 },
        { id: 'voortrekker_raadsaal', name: 'Volksraadsaal', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The parliament building of a Boer Republic like the Transvaal or Orange Free State.', districtType: 'republican_parliament', symbolType: 'TownHallSymbol', priority: 8 }
    ],
    [HistoricalEra.MODERN_ERA]: [{ id: 'union_buildings', name: 'Union Buildings', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The official seat of the South African government in Pretoria.', districtType: 'national_administration', symbolType: 'AdminCenterSymbol', priority: 10 }]
  },
  "Central Africa": {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [{ id: 'luba_royal_court', name: 'Luba Royal Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The sacred royal court of the Mulopwe, the emperor of the Luba Kingdom.', districtType: 'royal_court', symbolType: 'AfricanChiefdomSymbol', priority: 10 }],
    [HistoricalEra.INDUSTRIAL_ERA]: [{ id: 'belgian_congo_post', name: 'Poste Administratif', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'An administrative post for the Belgian Congo colonial authority.', districtType: 'colonial_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 }]
  },
  "West African Forests": {
    [HistoricalEra.MEDIEVAL]: [{ id: 'ife_palace_complex', name: 'Ooni of Ife\'s Palace', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'The sacred palace complex of the Ooni, the spiritual leader of the Yoruba people, in the city of Ife.', districtType: 'sacred_palace', symbolType: 'AfricanChiefdomSymbol', priority: 10 }],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [{ id: 'dahomey_royal_palaces', name: 'Royal Palaces of Abomey', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The extensive earthen palace compound of the Fon kings of Dahomey.', districtType: 'royal_palace', symbolType: 'AfricanChiefdomSymbol', priority: 10 }],
    [HistoricalEra.MODERN_ERA]: [{ id: 'regional_house_chiefs', name: 'Regional House of Chiefs', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Advisory chamber of paramount and divisional chiefs.', districtType: 'traditional_authority', symbolType: 'AdminCenterSymbol', priority: 9 }]
  },
  "Madagascar and Islands": {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [{ id: 'merina_rova_antananarivo', name: 'Rova of Antananarivo', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The royal palace complex of the Merina Kingdom, fortified on a high hill, center of an expanding empire.', districtType: 'royal_palace', symbolType: 'AfricanChiefdomSymbol', priority: 10 }],
    [HistoricalEra.INDUSTRIAL_ERA]: [{ id: 'french_residence_general', name: 'Résidence Générale', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The office and residence of the French Resident-General, the de facto colonial ruler of Madagascar.', districtType: 'colonial_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 }]
  },

  // == NORTH AMERICAN REGIONS (Comprehensive & Definitive) ==
  "Pacific Coast": {
    [HistoricalEra.MEDIEVAL]: [{ id: 'kwakwakawakw_potlatch_house', name: 'Potlatch House', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'A massive cedar longhouse where a powerful chief hosts potlatches to establish status and distribute wealth.', districtType: 'ceremonial_governance', symbolType: 'LonghouseCouncilSymbol', priority: 10 }],
    [HistoricalEra.INDUSTRIAL_ERA]: [{ id: 'russian_american_hq', name: 'Russian-American Company HQ', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The administrative headquarters of the Russian-American Company in New Archangel (Sitka).', districtType: 'colonial_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 }]
  },
  "California (North, Central, South)": { // Grouping for historical accuracy
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'spanish_mission_admin', name: 'Mission Headquarters', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'The administrative office of a Spanish mission, governing the religious and economic life of local Indigenous peoples.', districtType: 'theocratic_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 },
      { id: 'spanish_presidio', name: 'Presidio Commandancia', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'The headquarters of a Spanish military fort (Presidio), the center of colonial authority.', districtType: 'colonial_fort', symbolType: 'ColonialOfficeSymbol', priority: 9 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [{ id: 'mexican_ayuntamiento', name: 'Ayuntamiento Hall', archetype: SpecialMapArchetype.TOWN_HALL, description: 'The municipal council hall for a pueblo under Mexican rule.', districtType: 'municipal_government', symbolType: 'TownHallSymbol', priority: 10 }]
  },
  "Southwest": {
    [HistoricalEra.ANTIQUITY]: [{ id: 'chaco_great_house_pueblo_bonito', name: 'Pueblo Bonito Great House', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'The largest and best-known great house in Chaco Canyon, a major center for ceremony and administration.', districtType: 'ceremonial_center', symbolType: 'OpenAirCouncilSymbol', priority: 10 }],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [{ id: 'pueblo_council_kiva', name: 'Pueblo Council Kiva', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'A large kiva where the council of a Puebloan village meets in secret to make decisions, resisting colonial rule.', districtType: 'tribal_council', symbolType: 'OpenAirCouncilSymbol', priority: 10 }]
  },
  "Great Plains": {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [{ id: 'cheyenne_council_of_44', name: 'Council of Forty-Four Lodge', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'The central council lodge where the Council of Forty-Four, the unifying government of the Cheyenne people, convenes.', districtType: 'confederacy_council', symbolType: 'LonghouseCouncilSymbol', priority: 10 }],
    [HistoricalEra.INDUSTRIAL_ERA]: [{ id: 'bison_treaty_council_site', name: 'Treaty Council Site', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'A temporary encampment where Plains tribes meet with US government representatives to negotiate treaties.', districtType: 'diplomatic_ground', symbolType: 'OpenAirCouncilSymbol', priority: 10 }]
  },
  "Northeastern Seaboard": {
    [HistoricalEra.MEDIEVAL]: [{ id: 'haudenosaunee_council_fire_onondaga', name: 'Haudenosaunee Council Fire at Onondaga', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'The central meeting place and capital for the Grand Council of the Iroquois (Haudenosaunee) Confederacy.', districtType: 'confederacy_council', symbolType: 'LonghouseCouncilSymbol', priority: 10 }],
    [HistoricalEra.INDUSTRIAL_ERA]: [{ id: 'us_capitol_building', name: 'U.S. Capitol Building', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The seat of the United States Congress, the legislative branch of the federal government.', districtType: 'national_legislature', symbolType: 'ModernParliamentSymbol', priority: 10 }],
    [HistoricalEra.MODERN_ERA]: [{ id: 'un_headquarters', name: 'United Nations Headquarters', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The headquarters of the United Nations, an international organization for peace and cooperation.', districtType: 'international_government', symbolType: 'AdminCenterSymbol', priority: 10 }]
  },
  "Southeast": {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [{ id: 'creek_confederacy_council', name: 'Muscogee (Creek) Council House', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'The central council house of a major Muscogee town, the heart of the Creek Confederacy.', districtType: 'confederacy_council', symbolType: 'LonghouseCouncilSymbol', priority: 10 }],
    [HistoricalEra.INDUSTRIAL_ERA]: [{ id: 'confederate_capitol', name: 'Confederate States Capitol', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The capitol building of the Confederate States of America in Richmond, Virginia.', districtType: 'national_legislature', symbolType: 'CityHallSymbol', priority: 7 }]
  },
  "The Caribbean": {
    [HistoricalEra.MEDIEVAL]: [{ id: 'taino_caciques_house', name: 'Cacique\'s House (Bohio)', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The largest house in a Taíno village, serving as the residence and council chamber of the local chief (Cacique).', districtType: 'chiefly_court', symbolType: 'IslandCouncilSymbol', priority: 10 }],
    [HistoricalEra.INDUSTRIAL_ERA]: [{ id: 'haitian_national_palace', name: 'National Palace of Haiti', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The presidential palace of the Republic of Haiti, the first independent Black republic.', districtType: 'presidential_palace', symbolType: 'AdminCenterSymbol', priority: 10 }]
  },

  "Pacific Coast": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'plankhouse_council', name: 'Plankhouse Council', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Cedar plankhouse of coastal peoples for feasts, trade, and law.', districtType: 'council', symbolType: 'LonghouseCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'winter_ceremonial_hall', name: 'Winter Ceremonial Hall', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Ceremonial governance tied to potlatch economies.', districtType: 'ceremonial_admin', symbolType: 'LonghouseCouncilSymbol', priority: 9 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'confederated_village_council', name: 'Village Council House', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Regional council coordinating fisheries and peace ties.', districtType: 'intervillage_council', symbolType: 'TownHallSymbol', priority: 8 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'spanish_cabildo_pacific', name: 'Cabildo (Coastal)', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Spanish municipal council in mission-port towns.', districtType: 'colonial_municipal', symbolType: 'ColonialOfficeSymbol', priority: 8 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'city_hall_pacific', name: 'City Hall', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Council chamber of a booming port city.', districtType: 'municipal', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'state_capitol_pc', name: 'State Capitol', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Legislative and executive complex of a Pacific state.', districtType: 'state_government', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'coastal_climate_cabinet', name: 'Coastal Climate Cabinet', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Regional governance on sea-level, port logistics, and fisheries.', districtType: 'regional_cabinet', symbolType: 'AdminCenterSymbol', priority: 9 }
    ]
  },

  "Northern California": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'wintu_assembly', name: 'Assembly Grove', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Oak grove council for river, salmon, and acorn trade stewardship.', districtType: 'council', symbolType: 'OpenAirCouncilSymbol', priority: 9 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'spanish_cabildo_nc', name: 'Spanish Cabildo', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Cabildo associated with presidio/mission corridor.', districtType: 'colonial_municipal', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'california_state_capitol', name: 'California State Capitol', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Gold Rush to railroad era legislature and governor’s office.', districtType: 'state_government', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'bay_area_regional_hq', name: 'Regional Governance HQ', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Transportation, housing, and coastal management hub.', districtType: 'regional_authority', symbolType: 'ModernParliamentSymbol', priority: 9 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'water_fire_resilience_center', name: 'Water & Fire Resilience Center', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Wildfire and watershed governance integrating tribal co-management.', districtType: 'resilience_governance', symbolType: 'AdminCenterSymbol', priority: 10 }
    ]
  },

  "Central California Coast": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'chumash_council', name: 'Plaza Council House', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Plank-and-reed council space overseeing trade canoe routes.', districtType: 'council', symbolType: 'LonghouseCouncilSymbol', priority: 9 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'presidio_cabildo', name: 'Presidio Cabildo', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'Garrison administration with mission and port links.', districtType: 'colonial_admin', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'county_courthouse', name: 'County Courthouse', archetype: SpecialMapArchetype.COURT_CHAMBER, description: 'Seat for county commissioners, land deeds, and rail disputes.', districtType: 'county_admin', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'coastal_commission_office', name: 'Coastal Commission Office', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Permitting and conservation authority for shoreline use.', districtType: 'coastal_regulator', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ]
  },

  "Southern California": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'tongva_kisaraq', name: 'Village Council Area', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Village assembly near springs or river mouths.', districtType: 'council', symbolType: 'OpenAirCouncilSymbol', priority: 9 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'alcaldia', name: 'Alcaldía', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Spanish municipal hall managing ranchos and mission labor.', districtType: 'colonial_municipal', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'city_hall_sc', name: 'City Hall', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Rapidly growing metropolis with harbor board.', districtType: 'municipal', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'port_authority', name: 'Port Authority HQ', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Harbor, air, and logistics governance for a mega-region.', districtType: 'port_governance', symbolType: 'ModernParliamentSymbol', priority: 9 }
    ]
  },

  "Southwest": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'great_kiva_sw', name: 'Great Kiva', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Ceremonial-political chamber for pueblos.', districtType: 'ceremonial_council', symbolType: 'OpenAirCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'chaco_central_complex', name: 'Central Great House Court', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Great House court coordinating roads, storage, and rites.', districtType: 'regional_admin', symbolType: 'OpenAirCouncilSymbol', priority: 9 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'cabildo_southwest', name: 'Cabildo (Frontier)', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Spanish frontier municipal hall near presidios.', districtType: 'colonial_municipal', symbolType: 'ColonialOfficeSymbol', priority: 9 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'territorial_capitol', name: 'Territorial Capitol', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Capitol of a U.S. territory transitioning to statehood.', districtType: 'territorial_admin', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'tribal_nation_council', name: 'Nation Council House', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Modern elected council for a sovereign tribal nation.', districtType: 'tribal_government', symbolType: 'TownHallSymbol', priority: 10 }
    ]
  },

  "Great Plains": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'council_circle', name: 'Council Circle', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Council ring used by mobile and semi-sedentary groups.', districtType: 'council', symbolType: 'OpenAirCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'earthlodge_council', name: 'Earthlodge Council', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Sedentary village council coordinating farming and trade.', districtType: 'village_council', symbolType: 'LonghouseCouncilSymbol', priority: 9 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'territorial_courthouse', name: 'Territorial Courthouse', archetype: SpecialMapArchetype.COURT_CHAMBER, description: 'Railhead county seat and land office.', districtType: 'county_admin', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'statehouse_gp', name: 'Statehouse', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Plains state legislature and governor wing.', districtType: 'state_gov', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ]
  },

  "Mississippi Valley": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'mound_center_mv', name: 'Platform Mound Center', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Ceremonial-administrative platform and plaza.', districtType: 'mound_government', symbolType: 'PyramidGovernmentSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'cahokia_great_plaza', name: 'Great Plaza Council', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Chiefdom seat coordinating tribute and redistribution.', districtType: 'chiefdom_admin', symbolType: 'PyramidGovernmentSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'capitol_mv', name: 'River Capitol', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'State capitol on a major river port.', districtType: 'state_gov', symbolType: 'CityHallSymbol', priority: 10 }
    ]
  },

  "Northeastern Seaboard": {
    [HistoricalEra.MEDIEVAL]: [
      { id: 'longhouse_confederacy', name: 'Longhouse of a Confederacy', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Grand council longhouse for diplomacy and law.', districtType: 'confederacy_council', symbolType: 'LonghouseCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'colonial_council_chamber', name: 'Colonial Council Chamber', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Governor’s council and assembly chamber.', districtType: 'colonial_legislature', symbolType: 'ColonialOfficeSymbol', priority: 9 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'state_house_ne', name: 'State House', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Commonwealth legislature and cabinet rooms.', districtType: 'state_gov', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'city_hall_ne', name: 'Metropolitan City Hall', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Municipal government with planning commission.', districtType: 'municipal', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ]
  },

  "Southeast": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'council_house_se', name: 'Council House', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Central council of a plaza town.', districtType: 'council', symbolType: 'LonghouseCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'colonial_assembly_se', name: 'Colonial Assembly', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Elected lower house and appointed council.', districtType: 'colonial_legislature', symbolType: 'ColonialOfficeSymbol', priority: 9 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'state_capitol_se', name: 'State Capitol', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Statehouse on a hill with dome and rotunda.', districtType: 'state_gov', symbolType: 'CityHallSymbol', priority: 10 }
    ]
  },

  "Canada": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'longhouse_north', name: 'Longhouse Council', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Longhouse governance among Iroquoian and other peoples.', districtType: 'council', symbolType: 'LonghouseCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'trading_company_post', name: 'Trading Company Post', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'Fort and factor’s hall for fur trade governance.', districtType: 'chartered_company', symbolType: 'ColonialOfficeSymbol', priority: 9 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'dominion_parliament', name: 'Dominion Parliament', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Confederation-era parliament buildings.', districtType: 'national_parliament', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'provincial_legislature', name: 'Provincial Legislature', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Provincial legislative assembly and cabinet.', districtType: 'provincial_gov', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ]
  },

  "Arctic and Subarctic": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'qaggiq', name: 'Qaggiq Gathering', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Large snow/skin structure or outdoor ring used for community decisions and ceremonies.', districtType: 'assembly', symbolType: 'OpenAirCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'northern_council', name: 'Northern Council Chambers', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Regional assembly emphasizing indigenous self-government.', districtType: 'regional_assembly', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'circumpolar_forum', name: 'Circumpolar Forum', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Pan-Arctic forum for shipping lanes, fisheries, and ice monitoring.', districtType: 'international_forum', symbolType: 'AdminCenterSymbol', priority: 10 }
    ]
  },

  "Mexico and Central Highlands": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'teotihuacan_patio', name: 'Teotihuacan Council Patio', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Apartment-compound patio used by corporate groups for governance.', districtType: 'civic_compound', symbolType: 'PyramidGovernmentSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'tlatocan', name: 'Tlatocan (Council of Lords)', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Mexica council within the royal precinct near the Templo Mayor.', districtType: 'imperial_council', symbolType: 'PyramidGovernmentSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'cabildo_mexico', name: 'Ayuntamiento (Cabildo)', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Spanish municipal cabildo in the viceregal capital region.', districtType: 'colonial_municipal', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'national_palace', name: 'National Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Presidential and ministerial offices facing the main plaza.', districtType: 'executive', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'federal_congress', name: 'Federal Congress', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Bicameral legislature complex.', districtType: 'national_legislature', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ]
  },

  "Central America": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'mayan_council_palace', name: 'Council Palace (Ajawil)', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Stelae-lined court near pyramidal temples for civic-ritual governance.', districtType: 'royal_court', symbolType: 'PyramidGovernmentSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'audiencia', name: 'Real Audiencia', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'High court and administrative council of a captaincy.', districtType: 'royal_audience', symbolType: 'ColonialOfficeSymbol', priority: 9 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'central_american_parliament', name: 'Regional Parliament', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Supranational deliberative body in the isthmus.', districtType: 'regional_parliament', symbolType: 'ModernParliamentSymbol', priority: 8 }
    ]
  },

  "The Caribbean": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'ballcourt_council', name: 'Ballcourt Council Ground', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Ceremonial-municipal court among island chiefdoms.', districtType: 'ceremonial_council', symbolType: 'PyramidGovernmentSymbol', priority: 8 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'colonial_cabildo_carib', name: 'Cabildo of a Port', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Harbor cabildo regulating customs and shipping.', districtType: 'colonial_municipal', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'governors_house_carib', name: 'Governor’s House', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Executive residence with customs house and jail.', districtType: 'colonial_governor', symbolType: 'CityHallSymbol', priority: 8 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'island_parliament', name: 'Island Parliament', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Post-colonial legislature and cabinet offices.', districtType: 'parliament', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ]
  },

  "Northern Rockies": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'mountain_pass_moot', name: 'Mountain Pass Moot', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Seasonal summit council coordinating trails and trade.', districtType: 'assembly', symbolType: 'OpenAirCouncilSymbol', priority: 8 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'territorial_governor_rockies', name: 'Territorial Governor’s Office', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Railway surveys, mineral claims, and forestry.', districtType: 'territorial_admin', symbolType: 'CityHallSymbol', priority: 9 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'forest_regional_office', name: 'Forest Regional Office', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Public lands and watershed governance.', districtType: 'resource_governance', symbolType: 'ModernParliamentSymbol', priority: 9 }
    ]
  },

  "Atlantic Coast": {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'colonial_assembly_ac', name: 'Colonial Assembly Hall', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Elected assembly managing trade and militia.', districtType: 'colonial_legislature', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'municipal_hall_ac', name: 'Municipal Hall', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Harbor board, quarantine office, and customs.', districtType: 'municipal', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'statehouse_ac', name: 'Statehouse', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Atlantic state legislature and executive offices.', districtType: 'state_gov', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ]
  },


  // == SOUTH AMERICAN REGIONS (Comprehensive & Definitive) ==
 "Andes North": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'moche_huaca_court', name: 'Huaca Court', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Platform and plaza complex coordinating irrigation and craft guilds.', districtType: 'ceremonial_admin', symbolType: 'PyramidGovernmentSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'curaca_court', name: 'Curaca Court', archetype: SpecialMapArchetype.COURT_CHAMBER, description: 'Regional lord coordinating mit’a labor obligations.', districtType: 'provincial_admin', symbolType: 'PyramidGovernmentSymbol', priority: 9 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'audiencia_quito', name: 'Real Audiencia (Quito)', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'High court and viceregal chamber in the northern Andes.', districtType: 'royal_audience', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'republic_congress_andes_n', name: 'Republican Congress', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Post-independence legislature with national palace nearby.', districtType: 'legislature', symbolType: 'CityHallSymbol', priority: 10 }
    ]
  },

  "Andes South": {
    [HistoricalEra.MEDIEVAL]: [
      { id: 'inca_kallanka_as', name: 'Inca Kallanka Hall', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Large hall for state ceremonies, feasts, and musters.', districtType: 'imperial_admin', symbolType: 'PyramidGovernmentSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'cabildo_cuzco', name: 'Cabildo (High Andes)', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Spanish municipal hall regulating encomiendas and trade.', districtType: 'colonial_municipal', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'regional_governorship', name: 'Regional Governorship', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Regional government focused on mining and tourism corridors.', districtType: 'regional_admin', symbolType: 'ModernParliamentSymbol', priority: 9 }
    ]
  },

  "Amazon Basin": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'earthwork_plaza', name: 'Earthwork Plaza', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Geometric earthworks with council and ritual spheres.', districtType: 'village_council', symbolType: 'OpenAirCouncilSymbol', priority: 9 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'mission_town_council', name: 'Mission Town Council', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Jesuit or Franciscan mission town cabildo.', districtType: 'mission_municipal', symbolType: 'ColonialOfficeSymbol', priority: 9 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'basin_authority', name: 'River Basin Authority', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Trans-state governance for forests, waterways, and indigenous rights.', districtType: 'basin_governance', symbolType: 'AdminCenterSymbol', priority: 10 }
    ]
  },

  "Gran Chaco and Pampas": {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'cabildo_river_plate', name: 'Cabildo del Río de la Plata', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Municipal hall of a river-port town.', districtType: 'colonial_municipal', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'national_congress_gp', name: 'National Congress', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Constitutional legislature with federal layout.', districtType: 'national_legislature', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'provincial_casa_gobierno', name: 'Casa de Gobierno', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Provincial executive and legislative house.', districtType: 'provincial_government', symbolType: 'ModernParliamentSymbol', priority: 9 }
    ]
  },

  "Guiana Shield": {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'fortified_factory', name: 'Fortified Factory', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'Chartered company fort and administrative house.', districtType: 'chartered_company', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'departmental_prefecture', name: 'Departmental Prefecture', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Departmental government coordinating forests and spaceport or mines.', districtType: 'department_admin', symbolType: 'AdminCenterSymbol', priority: 9 }
    ]
  },

  "Patagonia": {
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'gobernacion_patagonia', name: 'Gobernación', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Territorial governorship managing sheep estancias and ports.', districtType: 'territorial_admin', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'provincial_legislature_pat', name: 'Provincial Legislature', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Provincial assembly in the far south.', districtType: 'provincial_assembly', symbolType: 'ModernParliamentSymbol', priority: 9 }
    ]
  },

  "Southern Highlands": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'tiwanaku_court', name: 'Tiwanaku Court', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Sunken plaza and palace court coordinating altiplano resources.', districtType: 'ceremonial_admin', symbolType: 'PyramidGovernmentSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'audiencia_charcas', name: 'Audiencia de Charcas', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'High court and treasury for silver highlands.', districtType: 'royal_audience', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'plurinational_assembly', name: 'Plurinational Assembly', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Assembly incorporating indigenous representation.', districtType: 'national_legislature', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ]
  },

  "Llanos and Orinoco": {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'cabildo_llanos', name: 'Cabildo Llanero', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Cabildo among cattle plains and river ports.', districtType: 'colonial_municipal', symbolType: 'ColonialOfficeSymbol', priority: 9 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'federal_capitol_llanos', name: 'Federal Capitol', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Oil and river-trade era legislature.', districtType: 'national_legislature', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'orinoco_basin_council', name: 'Orinoco Basin Council', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'Multi-state river basin governance.', districtType: 'basin_governance', symbolType: 'AdminCenterSymbol', priority: 9 }
    ]
  },

  // == ADDITIONAL PRIORITY REGIONS ==
  "Australian Outback": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'dreamtime_law_ground', name: 'Dreamtime Law Ground', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Sacred site where Aboriginal elders gather to maintain traditional law and conduct ceremonies.', districtType: 'sacred_council', symbolType: 'OpenAirCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'inter_tribal_corroboree', name: 'Inter-tribal Corroboree Ground', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Large gathering place where multiple Aboriginal groups conduct law-giving ceremonies and trade.', districtType: 'intertribal_council', symbolType: 'OpenAirCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'pastoral_station_office', name: 'Pastoral Station Office', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Colonial administrative center of a vast cattle or sheep station in the Australian interior.', districtType: 'pastoral_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ]
  },

  "Papua New Guinea Highlands": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'big_man_compound_png', name: "Big Man's Compound", archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Traditional center of Melanesian leadership where big men organize feasts and resolve disputes.', districtType: 'big_man_leadership', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'highland_alliance_council', name: 'Highland Warfare Alliance Council', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'Fortified meeting place where highland clans form alliances for warfare and trade.', districtType: 'war_alliance', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'german_colonial_station', name: 'German Colonial Station', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'German colonial administrative post in the New Guinea highlands.', districtType: 'colonial_station', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ]
  },

  "Andes Mountains": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'inca_tambo_administration', name: 'Inca Tambo', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Inca administrative and storage center along the royal road system.', districtType: 'imperial_station', symbolType: 'AfricanChiefdomSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'inca_royal_court', name: 'Inca Royal Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The court of the Sapa Inca in Cusco, center of the Inca Empire.', districtType: 'imperial_court', symbolType: 'AfricanChiefdomSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'spanish_audiencia', name: 'Spanish Audiencia', archetype: SpecialMapArchetype.COURT_CHAMBER, description: 'Spanish colonial high court and administrative body governing the Andes.', districtType: 'colonial_court', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ]
  },

  "Southeast Asian Highlands": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'hill_tribe_council_house', name: 'Hill Tribe Council House', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Traditional longhouse where hill tribe elders make decisions for the community.', districtType: 'tribal_longhouse', symbolType: 'LonghouseSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'tai_muang_administration', name: 'Tai Muang', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Administrative center of a Tai principality in the Southeast Asian highlands.', districtType: 'principality_center', symbolType: 'MandateHallSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'burmese_provincial_office', name: 'Burmese Provincial Office', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Burmese royal administration governing highland tributary states.', districtType: 'tributary_administration', symbolType: 'MandateHallSymbol', priority: 10 }
    ]
  },

  "Iranian Plateau": {
    [HistoricalEra.ANTIQUITY]: [
      { id: 'sassanid_fire_temple_court', name: 'Sassanid Fire Temple Court', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Zoroastrian fire temple complex where Sassanid administrators and priests governed.', districtType: 'theocratic_administration', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'islamic_diwan', name: 'Islamic Diwan', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Government administrative office under Islamic rule in Persia.', districtType: 'islamic_administration', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'safavid_provincial_office', name: 'Safavid Provincial Office', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Provincial administration of the Safavid Empire governing the Iranian plateau.', districtType: 'safavid_administration', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ]
  },

  "Patagonian Steppe": {
    [HistoricalEra.PREHISTORY]: [
      { id: 'tehuelche_tribal_council', name: 'Tehuelche Tribal Council', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Nomadic assembly ground of the Tehuelche people on the Patagonian steppes.', districtType: 'nomadic_council', symbolType: 'OpenAirCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'mapuche_confederation_council', name: 'Mapuche Confederation Council', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'Council of Mapuche lonkos (chiefs) organizing resistance against Inca and Spanish expansion.', districtType: 'confederation_council', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'argentine_frontier_fort', name: 'Argentine Frontier Fort', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'Military fort and administrative center during the Argentine Conquest of the Desert.', districtType: 'frontier_fort', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ]
  }
  
};

// Cultural zone fallbacks (when no specific region match)
export const CULTURAL_ZONE_DISTRICTS: Record<string, Record<HistoricalEra, GovernmentDistrictType[]>> = {
  OCEANIC: {
    [HistoricalEra.PREHISTORY]: [
      {
        id: 'tribal_meeting',
        name: 'Tribal Meeting Ground',
        archetype: SpecialMapArchetype.OPEN_FIELD,
        description: 'Traditional tribal gathering place.',
        districtType: 'tribal_assembly',
        symbolType: 'OpenAirCouncilSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.ANTIQUITY]: [
      {
        id: 'clan_ground',
        name: 'Clan Meeting Ground',
        archetype: SpecialMapArchetype.OPEN_FIELD,
        description: 'Extended clan governance center.',
        districtType: 'clan_council',
        symbolType: 'OpenAirCouncilSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'chiefly_marae_cz', name: 'Marae/Meeting Ground', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'Sacred meeting grounds with carved hall and ahu/ahu-like platforms.', districtType: 'chiefly_council', symbolType: 'MaraeSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'port_alii', name: 'Aliʻi Council House', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Paramount chiefs’ court in port towns engaging Pacific trade.', districtType: 'royal_court', symbolType: 'ChieflyPlatformSymbol', priority: 9 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'national_parliament_oce', name: 'National Parliament', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Post-colonial parliamentary complex.', districtType: 'parliament', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'climate_mobility_court', name: 'Climate Mobility Court', archetype: SpecialMapArchetype.COURT_CHAMBER, description: 'Regional venue for maritime borders and climate relocation.', districtType: 'regional_court', symbolType: 'AdminCenterSymbol', priority: 9 }
    ]
  },
  
  EUROPEAN: {
    [HistoricalEra.PREHISTORY]: [
      {
        id: 'tribal_moot',
        name: 'Tribal Moot',
        archetype: SpecialMapArchetype.OPEN_FIELD,
        description: 'Open air assembly of free tribesmen.',
        districtType: 'tribal_assembly',
        symbolType: 'OpenAirCouncilSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.ANTIQUITY]: [
      {
        id: 'roman_forum',
        name: 'Forum',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'Roman public square with basilica and curia.',
        districtType: 'forum',
        symbolType: 'RomanForumSymbol',
        priority: 10
      },
      {
        id: 'celtic_hillfort',
        name: 'Hillfort',
        archetype: SpecialMapArchetype.MILITARY_FORTRESS,
        description: 'Celtic fortified settlement with royal hall.',
        districtType: 'military_council',
        symbolType: 'FeudalHallSymbol',
        priority: 5
      }
    ],
    [HistoricalEra.MEDIEVAL]: [
      {
        id: 'feudal_hall',
        name: 'Great Hall',
        archetype: SpecialMapArchetype.PALACE_COMPLEX,
        description: 'Feudal lord\'s administrative center.',
        districtType: 'feudal_court',
        symbolType: 'FeudalHallSymbol',
        priority: 10
      },
      {
        id: 'town_hall',
        name: 'Town Hall',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'Municipal building for town governance.',
        districtType: 'municipal_center',
        symbolType: 'TownHallSymbol',
        priority: 8
      }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      {
        id: 'royal_palace',
        name: 'Royal Palace',
        archetype: SpecialMapArchetype.PALACE_COMPLEX,
        description: 'Seat of royal administration and the king\'s court.',
        districtType: 'royal_court',
        symbolType: 'TownHallSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      {
        id: 'parliament_building',
        name: 'Parliament Building',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'National legislative assembly for a rising industrial power.',
        districtType: 'national_legislature',
        symbolType: 'CityHallSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.MODERN_ERA]: [
      {
        id: 'parliament_complex',
        name: 'Parliament Complex',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'Modern democratic legislature and administrative offices.',
        districtType: 'democratic_government',
        symbolType: 'ModernParliamentSymbol',
        priority: 10
      }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      {
        id: 'parliament',
        name: 'EU Administration Office',
        archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
        description: 'A regional office of the European Union.',
        districtType: 'e-government_hub',
        symbolType: 'AdminCenterSymbol',
        priority: 10
      }
    ]
  },


    SOUTH_ASIAN: {
    [HistoricalEra.PREHISTORY]: [
      { id: 'village_panchayat', name: 'Village Panchayat', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Traditional village council under a tree.', districtType: 'village_council', symbolType: 'OpenAirCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'mauryan_court', name: 'Mauryan Court', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Imperial administrative complex.', districtType: 'imperial_court', symbolType: 'StepwellCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'durbar_hall', name: 'Durbar Hall', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Royal audience hall for public administration.', districtType: 'royal_court', symbolType: 'StepwellCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'mughal_darbar', name: 'Mughal Darbar', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Mughal imperial court.', districtType: 'imperial_darbar', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'raj_secretariat', name: 'British Secretariat', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'British Raj administrative building.', districtType: 'colonial_secretariat', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'parliament_house_sa', name: 'Parliament House', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Democratic parliament building.', districtType: 'national_parliament', symbolType: 'ModernParliamentSymbol', priority: 10 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'saarc_secretariat', name: 'SAARC Secretariat', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Headquarters for the South Asian Association for Regional Cooperation.', districtType: 'regional_cooperation', symbolType: 'AdminCenterSymbol', priority: 10 }
    ]
  },

  SUB_SAHARAN_AFRICAN: {
    [HistoricalEra.PREHISTORY]: [
      { id: 'baobab_council', name: 'Baobab Council', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'Traditional meeting under the sacred tree.', districtType: 'tree_council', symbolType: 'OpenAirCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'nubian_palace', name: 'Kushite Royal Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Kushite royal administration in Nubia.', districtType: 'royal_palace', symbolType: 'AfricanChiefdomSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'great_enclosure', name: 'Great Enclosure', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'The seat of royal power at Great Zimbabwe.', districtType: 'stone_city_government', symbolType: 'AfricanChiefdomSymbol', priority: 10 },
      { id: 'obas_palace', name: 'Oba\'s Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Benin royal administrative complex.', districtType: 'royal_court', symbolType: 'AfricanChiefdomSymbol', priority: 9 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'ashanti_palace', name: 'Ashanti Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Akan confederation center.', districtType: 'confederation_government', symbolType: 'AfricanChiefdomSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'colonial_boma', name: 'Colonial Boma', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'Colonial administrative fort.', districtType: 'colonial_fort', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'state_house', name: 'State House', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'Presidential palace and offices.', districtType: 'presidential_palace', symbolType: 'AdminCenterSymbol', priority: 10 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'au_commission_hq', name: 'African Union Commission HQ', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The administrative headquarters of the African Union.', districtType: 'continental_government', symbolType: 'AdminCenterSymbol', priority: 10 }
    ]
  },

  NORTH_AMERICAN_PRE_COLUMBIAN: {
    [HistoricalEra.PREHISTORY]: [
      { id: 'council_lodge', name: 'Council Lodge', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'A traditional meeting lodge for tribal elders.', districtType: 'tribal_council', symbolType: 'LonghouseCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'platform_mound', name: 'Platform Mound', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'A Mississippian or Hopewell ceremonial center, seat of a chiefdom.', districtType: 'mound_complex', symbolType: 'PyramidGovernmentSymbol', priority: 10 },
      { id: 'great_kiva', name: 'Great Kiva', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'An Ancestral Puebloan ceremonial chamber for spiritual and political governance.', districtType: 'ceremonial_center', symbolType: 'OpenAirCouncilSymbol', priority: 8 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'longhouse_council_ia', name: 'Confederacy Longhouse', archetype: SpecialMapArchetype.TRIBAL_COUNCIL, description: 'A grand council house, the political heart of a powerful confederacy like the Haudenosaunee.', districtType: 'confederacy_council', symbolType: 'LonghouseCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'confederacy_fire', name: 'Council Fire', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'The central diplomatic and ceremonial meeting place for an inter-tribal confederacy.', districtType: 'diplomatic_ground', symbolType: 'OpenAirCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'tribal_agency', name: 'Tribal Agency', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Bureau of Indian Affairs agency office.', districtType: 'federal_agency', symbolType: 'AdminCenterSymbol', priority: 10 },
      { id: 'reservation_council', name: 'Reservation Council Hall', archetype: SpecialMapArchetype.TOWN_HALL, description: 'Modern tribal government meeting hall.', districtType: 'tribal_government', symbolType: 'TownHallSymbol', priority: 8 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'tribal_headquarters', name: 'Tribal Headquarters', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Modern tribal government complex.', districtType: 'tribal_administration', symbolType: 'AdminCenterSymbol', priority: 10 },
      { id: 'cultural_center', name: 'Cultural Center', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Community center for tribal meetings and cultural events.', districtType: 'community_center', symbolType: 'AssemblyHallSymbol', priority: 8 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'sovereign_council', name: 'Sovereign Nation Council', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'Autonomous indigenous government assembly.', districtType: 'sovereign_assembly', symbolType: 'AssemblyHallSymbol', priority: 10 },
      { id: 'heritage_complex', name: 'Heritage Administrative Complex', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'Advanced indigenous governance center.', districtType: 'heritage_admin', symbolType: 'AdminCenterSymbol', priority: 8 }
    ]
  },

  SOUTH_AMERICAN: {
    [HistoricalEra.PREHISTORY]: [
        { id: 'village_hearth', name: 'Communal Hearth', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'A central village space for community decisions and ceremonies.', districtType: 'village_council', symbolType: 'OpenAirCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
        { id: 'ceremonial_platform_sa', name: 'Huaca Platform', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'The administrative and ceremonial platform mound of an Andean culture like the Moche.', districtType: 'ceremonial_center', symbolType: 'PyramidGovernmentSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
        { id: 'inca_kallanka', name: 'Inca Kallanka', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'A massive Inca administrative hall for state ceremonies and governance.', districtType: 'imperial_administration', symbolType: 'PyramidGovernmentSymbol', priority: 10 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
        { id: 'viceregal_palace', name: 'Palace of the Viceroy', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The seat of Spanish colonial administration for a Viceroyalty.', districtType: 'colonial_administration', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
        { id: 'republican_congress', name: 'National Congress', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'The legislative palace of a newly independent South American republic.', districtType: 'national_legislature', symbolType: 'CityHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
        { id: 'presidential_palace', name: 'Presidential Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The official office and residence of the head of state.', districtType: 'presidential_palace', symbolType: 'AdminCenterSymbol', priority: 10 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
        { id: 'mercosur_parliament', name: 'Mercosur Parliament', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'The parliamentary body for the Mercosur trade bloc, representing regional integration.', districtType: 'regional_parliament', symbolType: 'AdminCenterSymbol', priority: 10 }
    ]
  },

  MENA: {
    [HistoricalEra.PREHISTORY]: [
      { id: 'tribal_majlis', name: 'Tribal Majlis', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'A traditional desert tribal council meeting for elders and sheikhs.', districtType: 'tribal_council', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'imperial_audience_hall', name: 'Imperial Audience Hall', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'A grand, columned audience hall, in the style of Persian or Egyptian empires, for receiving tribute and administering the realm.', districtType: 'imperial_audience_hall', symbolType: 'CaliphCourtSymbol', priority: 10 },
      { id: 'temple_administration', name: 'Temple Administrative Complex', archetype: SpecialMapArchetype.SACRED_COMPLEX, description: 'The bureaucratic and religious heart of an ancient city-state, managing resources from a temple.', districtType: 'temple_administration', symbolType: 'ZigguratSymbol', priority: 8 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'diwan', name: 'Diwan', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The central administrative council hall for a Caliphate or Sultanate.', districtType: 'caliphate_admin', symbolType: 'CaliphCourtSymbol', priority: 10 },
      { id: 'citadel_command', name: 'Citadel', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'A fortified government complex, serving as the military and administrative seat of an Emir or Sultan.', districtType: 'military_government', symbolType: 'CaliphCourtSymbol', priority: 9 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'pashas_palace', name: 'Pasha\'s Palace', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The administrative seat of a provincial governor (Pasha) within a large empire like the Ottomans or Safavids.', districtType: 'provincial_administration', symbolType: 'CaliphCourtSymbol', priority: 10 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'mandate_administration_hq', name: 'Mandate Administration HQ', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'The headquarters of a European mandate authority or colonial power governing a territory.', districtType: 'colonial_mandate', symbolType: 'ColonialOfficeSymbol', priority: 10 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'ministry_building', name: 'Ministry Building', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'A modern government ministry building for a post-independence national republic or monarchy.', districtType: 'government_ministry', symbolType: 'AdminCenterSymbol', priority: 10 },
      { id: 'royal_diwan', name: 'Royal Diwan', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The administrative office and court of a modern monarch in the Middle East.', districtType: 'royal_administration', symbolType: 'AdminCenterSymbol', priority: 8 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'arab_league_hq', name: 'Regional League Headquarters', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The administrative headquarters for a supranational body like the Arab League or GCC.', districtType: 'regional_government', symbolType: 'AdminCenterSymbol', priority: 10 }
    ]
  },

  EAST_ASIAN: {
    [HistoricalEra.PREHISTORY]: [
      { id: 'clan_council_ground', name: 'Clan Council Ground', archetype: SpecialMapArchetype.OPEN_FIELD, description: 'An ancient meeting site where leaders of allied clans made decisions and performed ceremonies.', districtType: 'clan_assembly', symbolType: 'TribalCouncilSymbol', priority: 10 }
    ],
    [HistoricalEra.ANTIQUITY]: [
      { id: 'commandery_office', name: 'Commandery Office', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'An imperial administrative center for a province or commandery, based on the Han Dynasty model.', districtType: 'imperial_admin', symbolType: 'MandateHallSymbol', priority: 10 }
    ],
    [HistoricalEra.MEDIEVAL]: [
      { id: 'magistrates_yamen', name: "Magistrate's Yamen", archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'The official compound of a government magistrate, combining judicial, administrative, and residential functions.', districtType: 'magistrate_court', symbolType: 'MandateHallSymbol', priority: 10 },
      { id: 'feudal_lords_castle', name: 'Feudal Lord\'s Castle', archetype: SpecialMapArchetype.MILITARY_FORTRESS, description: 'The fortified administrative center of a regional feudal lord (e.g., a Daimyo).', districtType: 'feudal_seat', symbolType: 'MandateHallSymbol', priority: 8 }
    ],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
      { id: 'imperial_ministry_hall', name: 'Imperial Ministry Hall', archetype: SpecialMapArchetype.PALACE_COMPLEX, description: 'A grand building within an imperial capital housing one of the central government ministries (e.g., Rites, Revenue).', districtType: 'imperial_ministry', symbolType: 'MandateHallSymbol', priority: 10 },
      { id: 'shogunate_hq', name: 'Shogunate Headquarters', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The central administrative center for the military government (Shogunate).', districtType: 'shogunate_government', symbolType: 'MandateHallSymbol', priority: 9 }
    ],
    [HistoricalEra.INDUSTRIAL_ERA]: [
      { id: 'prefectural_office', name: 'Prefectural Office', archetype: SpecialMapArchetype.ADMINISTRATIVE_COMPLEX, description: 'A modernized, often Western-style, government building for regional administration.', districtType: 'modern_prefecture', symbolType: 'CityHallSymbol', priority: 10 },
      { id: 'treaty_port_concession', name: 'Foreign Concession Office', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The administrative office for a foreign concession in a treaty port, exercising extraterritorial authority.', districtType: 'colonial_administration', symbolType: 'ColonialOfficeSymbol', priority: 8 }
    ],
    [HistoricalEra.MODERN_ERA]: [
      { id: 'national_assembly_hall', name: 'National Assembly Hall', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'The central building for the national legislature, be it a Parliament, Diet, or People\'s Congress.', districtType: 'national_legislature', symbolType: 'ModernParliamentSymbol', priority: 10 },
      { id: 'party_headquarters', name: 'Ruling Party Headquarters', archetype: SpecialMapArchetype.GOVERNMENT_FORUM, description: 'The administrative and political center for a dominant or single-party state.', districtType: 'party_headquarters', symbolType: 'SovietPalaceSymbol', priority: 9 }
    ],
    [HistoricalEra.FUTURE_ERA]: [
      { id: 'asean_secretariat', name: 'Regional Economic Forum HQ', archetype: SpecialMapArchetype.ASSEMBLY_HALL, description: 'A headquarters for a major regional economic and diplomatic body like ASEAN or APEC.', districtType: 'regional_cooperation', symbolType: 'AdminCenterSymbol', priority: 10 }
    ]
  }

  
};

// Fallback leader titles for when faction courtRoles aren't available
export const FALLBACK_LEADER_TITLES: Record<string, Record<HistoricalEra, string[]>> = {
  OCEANIC: {
    [HistoricalEra.PREHISTORY]: ['Elder', 'Law Keeper', 'Senior Woman', 'Ceremony Master'],
    [HistoricalEra.ANTIQUITY]: ['Senior Elder', 'Knowledge Keeper', 'Songline Guardian'],
    [HistoricalEra.MEDIEVAL]: ['Ariki', 'Rangatira', 'Big Man', 'Chief'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Paramount Chief', 'Tohunga', 'Ali\'i'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['Governor', 'Colonial Secretary', 'Protector'],
    [HistoricalEra.MODERN_ERA]: ['Prime Minister', 'Premier', 'Minister'],
    [HistoricalEra.FUTURE_ERA]: ['Climate Commissioner', 'Regional Director']
  },
  MENA: {
    [HistoricalEra.PREHISTORY]: ['Sheikh', 'Elder', 'Tribal Leader'],
    [HistoricalEra.ANTIQUITY]: ['Satrap', 'Vizier', 'Governor', 'Nomarch'],
    [HistoricalEra.MEDIEVAL]: ['Caliph', 'Sultan', 'Emir', 'Vizier', 'Qadi'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Pasha', 'Bey', 'Shah', 'Grand Vizier'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['High Commissioner', 'Khedive', 'Colonial Governor'],
    [HistoricalEra.MODERN_ERA]: ['President', 'Prime Minister', 'King', 'Minister'],
    [HistoricalEra.FUTURE_ERA]: ['Secretary-General', 'Commissioner', 'Director']
  },

  EAST_ASIAN: {
    [HistoricalEra.PREHISTORY]: ['Clan Chief', 'Elder', 'Shaman'],
    [HistoricalEra.ANTIQUITY]: ['Magistrate', 'Prefect', 'Governor', 'Censor'],
    [HistoricalEra.MEDIEVAL]: ['Magistrate', 'Daimyo', 'Prefect', 'Mandarin'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Viceroy', 'Shogun', 'Minister', 'Governor'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['Commissioner', 'Consul', 'Governor-General', 'Prefect'],
    [HistoricalEra.MODERN_ERA]: ['Secretary', 'Premier', 'Prime Minister', 'Mayor'],
    [HistoricalEra.FUTURE_ERA]: ['Digital Secretary', 'AI Coordinator', 'Smart City Director']
  },
  
  EUROPEAN: {
    [HistoricalEra.PREHISTORY]: ['Chieftain', 'Elder', 'Druid', 'War Leader'],
    [HistoricalEra.ANTIQUITY]: ['Consul', 'Senator', 'Praetor', 'Tribune'],
    [HistoricalEra.MEDIEVAL]: ['Lord', 'Mayor', 'Burgher', 'Bailiff'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Governor', 'Magistrate', 'Chancellor'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['Prime Minister', 'Mayor', 'Governor'],
    [HistoricalEra.MODERN_ERA]: ['President', 'Prime Minister', 'Chancellor'],
    [HistoricalEra.FUTURE_ERA]: ['Digital Minister', 'AI Ethics Commissioner']
  },
  SOUTH_ASIAN: {
    [HistoricalEra.PREHISTORY]: ['Village Head', 'Panch', 'Elder'],
    [HistoricalEra.ANTIQUITY]: ['Raja', 'Maharaja', 'Minister', 'Amatya'],
    [HistoricalEra.MEDIEVAL]: ['Sultan', 'Raja', 'Nawab', 'Diwan'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Emperor', 'Peshwa', 'Maharaja', 'Subahdar'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['Viceroy', 'Governor', 'Resident', 'Maharaja'],
    [HistoricalEra.MODERN_ERA]: ['Prime Minister', 'President', 'Chief Minister', 'Governor'],
    [HistoricalEra.FUTURE_ERA]: ['Secretary-General', 'Regional Director', 'Commissioner']
  },

  SUB_SAHARAN_AFRICAN: {
    [HistoricalEra.PREHISTORY]: ['Chief', 'Elder', 'Headman'],
    [HistoricalEra.ANTIQUITY]: ['Negus', 'Kandake', 'Governor', 'Noble'],
    [HistoricalEra.MEDIEVAL]: ['Mansa', 'Oba', 'Kabaka', 'Sultan'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Asantehene', 'Inkosi', 'Queen Mother', 'Chief'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['District Commissioner', 'Colonial Governor', 'Administrator'],
    [HistoricalEra.MODERN_ERA]: ['President', 'Prime Minister', 'Speaker', 'Minister'],
    [HistoricalEra.FUTURE_ERA]: ['AU Chairperson', 'Commissioner', 'Secretary-General']
  },

  NORTH_AMERICAN_PRE_COLUMBIAN: {
    [HistoricalEra.PREHISTORY]: ['Band Chief', 'Elder', 'Shaman'],
    [HistoricalEra.ANTIQUITY]: ['Great Sun', 'Cacique', 'Peace Chief', 'War Chief'],
    [HistoricalEra.MEDIEVAL]: ['Sachem', 'Clan Mother', 'Head Chief'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Paramount Chief', 'Head Sachem', 'Keeper of the Fire'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['Tribal Chairman', 'Council Member', 'Agent'],
    [HistoricalEra.MODERN_ERA]: ['Tribal President', 'Council Chair', 'Cultural Director'],
    [HistoricalEra.FUTURE_ERA]: ['Sovereign Leader', 'Heritage Keeper', 'Nation Speaker']
  },

  SOUTH_AMERICAN: {
    [HistoricalEra.PREHISTORY]: ['Headman', 'Elder', 'Shaman'],
    [HistoricalEra.ANTIQUITY]: ['Lord', 'Priest-King', 'Chief'],
    [HistoricalEra.MEDIEVAL]: ['Sapa Inca', 'Curaca', 'Ajaw'],
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: ['Viceroy', 'Governor', 'Oidor', 'Corregidor'],
    [HistoricalEra.INDUSTRIAL_ERA]: ['President', 'General', 'Senator', 'Director'],
    [HistoricalEra.MODERN_ERA]: ['President', 'Minister', 'Deputy', 'Governor'],
    [HistoricalEra.FUTURE_ERA]: ['Regional Delegate', 'UN Ambassador', 'Director']
  },
  
  
  // Add other zones as needed...
};

/**
 * Select a government district type based on region, cultural zone, and era
 */
export function selectGovernmentType(
  region: string | undefined,
  culturalZone: CulturalZone | string,
  era: HistoricalEra,
  x: number,
  y: number,
  mapSeed: number
): GovernmentDistrictType | null {
  let availableTypes: GovernmentDistrictType[] = [];
  
  // 1. Try region-specific mapping first
  if (region && REGION_SPECIFIC_DISTRICTS[region] && REGION_SPECIFIC_DISTRICTS[region][era]) {
    availableTypes = REGION_SPECIFIC_DISTRICTS[region][era];
  }
  
  // 2. Fall back to cultural zone mapping
  if (availableTypes.length === 0) {
    const zoneConfig = CULTURAL_ZONE_DISTRICTS[culturalZone];
    if (zoneConfig && zoneConfig[era]) {
      availableTypes = zoneConfig[era];
    }
  }
  
  // 3. Universal fallback
  if (availableTypes.length === 0) {
    return {
      id: 'generic_hall',
      name: 'Administrative Hall',
      archetype: SpecialMapArchetype.GOVERNMENT_FORUM,
      description: 'A general administrative center.',
      districtType: 'administration',
      symbolType: 'AdminCenterSymbol',
      priority: 5
    };
  }
  
  // Use location coordinates + seed to deterministically pick
  const hash = ((x * 73) + (y * 113) + mapSeed) % 100;
  
  // Weight selection by priority (higher priority = more likely)
  const weighted = availableTypes.flatMap(type => 
    Array(type.priority).fill(type)
  );
  
  return weighted[hash % weighted.length] || availableTypes[0];
}

/**
 * Get fallback leader titles if courtRoles not available
 */
export function getLeaderTitles(
  culturalZone: CulturalZone | string,
  era: HistoricalEra
): string[] {
  const zoneConfig = FALLBACK_LEADER_TITLES[culturalZone];
  if (!zoneConfig || !zoneConfig[era]) {
    return ['Leader', 'Administrator', 'Official'];
  }
  
  return zoneConfig[era];
}