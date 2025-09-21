/**
 * services/workplaceGenerationService.ts
 *
 * Generates historically and culturally accurate workplace names and determines
 * which NPCs should have individual workplaces vs working at POIs.
 *
 * ENHANCED VERSION: Full cultural coverage, 200+ profession mappings, era-specific variations
 */

import { NpcEntity, HistoricalEra, Point, BiomeType } from '../types';
import { CulturalZone } from '../constants/characterData/names';

/**
 * Comprehensive profession-to-workplace mapping covering all major professions
 * from professions.ts across all eras and cultures
 */
const PROFESSION_TO_WORKPLACE: Record<string, string[]> = {
  // === CRAFT & TRADE ===
  'baker': ['bakery', 'bakehouse', 'bread_oven', 'pastry_shop'],
  'blacksmith': ['smithy', 'forge', 'metalworks', 'ironworks'],
  'carpenter': ['workshop', 'lumber_yard', 'woodworks', 'carpentry'],
  'merchant': ['shop', 'trading_post', 'store', 'emporium', 'bazaar'],
  'tailor': ['tailor_shop', 'clothier', 'garment_shop', 'clothing_store'],
  'weaver': ['weaving_shop', 'textile_workshop', 'loom_house'],
  'potter': ['pottery', 'kiln', 'ceramic_workshop'],
  'cobbler': ['shoe_shop', 'cobblery', 'boot_maker'],
  'butcher': ['butcher_shop', 'meat_market', 'slaughterhouse'],
  'brewer': ['brewery', 'alehouse', 'beer_hall'],
  'miller': ['mill', 'grinding_house', 'flour_mill'],
  'tanner': ['tannery', 'leather_works', 'hide_processor'],
  'jeweler': ['jewelry_shop', 'goldsmith', 'gem_cutter'],
  'goldsmith': ['goldsmith_shop', 'precious_metals'],
  'silversmith': ['silver_workshop', 'metal_craft'],
  'armorer': ['armory', 'armor_shop', 'weapon_forge'],
  'weaponsmith': ['weapon_forge', 'blade_works'],
  'bowyer': ['bow_shop', 'archery_workshop'],
  'fletcher': ['arrow_shop', 'fletching_workshop'],
  'chandler': ['candle_shop', 'wax_works'],
  'cooper': ['barrel_works', 'cooperage'],
  'wheelwright': ['wheel_shop', 'wagon_works'],
  'mason': ['masonry', 'stone_works', 'construction_yard'],
  'dyer': ['dye_works', 'color_house', 'fabric_dyeing'],
  'fuller': ['fullonica', 'cloth_finishing'],
  'cordwainer': ['fine_shoes', 'luxury_footwear'],
  'saddler': ['saddle_shop', 'leather_goods'],
  'furrier': ['fur_shop', 'pelt_trading'],
  'glazier': ['glass_works', 'window_shop'],
  'tinker': ['repair_shop', 'metal_repairs'],
  'cutler': ['knife_shop', 'blade_store'],
  'locksmith': ['lock_shop', 'security_works'],
  'bell_founder': ['bell_foundry', 'bronze_works'],
  'rope_maker': ['rope_walk', 'cordage_shop'],

  // === FOOD & HOSPITALITY ===
  'innkeeper': ['inn', 'tavern', 'hostel', 'guesthouse'],
  'tavern': ['tavern', 'pub', 'alehouse', 'drinking_hall'],
  'cook': ['kitchen', 'restaurant', 'eatery', 'food_stall'],
  'chef': ['restaurant', 'fine_dining', 'kitchen'],
  'fisherman': ['docks', 'wharf', 'fishing_pier', 'fish_market'],
  'fishmonger': ['fish_market', 'seafood_shop'],
  'grocer': ['grocery', 'food_store', 'provisions'],
  'vintner': ['wine_shop', 'vineyard_store'],
  'distiller': ['distillery', 'spirits_shop'],
  'confectioner': ['candy_shop', 'sweets_store'],
  'cheese': ['cheese_shop', 'dairy_store'],
  'spice': ['spice_shop', 'exotic_goods'],
  'tea': ['tea_house', 'tea_shop'],
  'coffee': ['coffee_house', 'cafe'],

  // === KNOWLEDGE & ARTS ===
  'scribe': ['scriptorium', 'writing_house', 'copy_shop'],
  'scholar': ['library', 'study', 'academy'],
  'teacher': ['school', 'academy', 'tutorial_house'],
  'tutor': ['tutorial_house', 'private_school'],
  'librarian': ['library', 'archive', 'scroll_house'],
  'bookbinder': ['bindery', 'book_workshop'],
  'illuminator': ['illumination_workshop', 'manuscript_decoration'],
  'calligrapher': ['calligraphy_studio', 'writing_workshop'],
  'artist': ['studio', 'atelier', 'art_workshop'],
  'painter': ['painting_studio', 'art_gallery'],
  'sculptor': ['sculpture_studio', 'stone_carving'],
  'musician': ['music_hall', 'performance_space'],
  'minstrel': ['performance_hall', 'entertainment_venue'],
  'bard': ['storytelling_hall', 'performance_space'],
  'playwright': ['theater', 'playhouse'],
  'actor': ['theater', 'playhouse', 'performance_venue'],
  'astrologer': ['observatory', 'divination_house'],
  'alchemist': ['laboratory', 'alchemy_workshop'],
  'philosopher': ['academy', 'philosophy_school'],

  // === MEDICAL & HEALING ===
  'healer': ['clinic', 'healing_house', 'herb_shop'],
  'physician': ['surgery', 'medical_practice', 'doctor_office'],
  'surgeon': ['surgery', 'operating_theater', 'medical_center'],
  'apothecary': ['apothecary', 'medicine_shop', 'pharmacy'],
  'herbalist': ['herb_shop', 'botanical_store'],
  'midwife': ['birthing_house', 'midwifery'],
  'nurse': ['infirmary', 'hospital', 'care_house'],
  'barber': ['barber_shop', 'grooming_parlor'],
  'barber_surgeon': ['barber_surgery', 'medical_barber'],
  'dentist': ['dental_practice', 'tooth_puller'],
  'veterinarian': ['animal_hospital', 'beast_healer'],
  'acupuncturist': ['acupuncture_clinic', 'needle_therapy'],

  // South Asian healers
  'vaidya': ['ayurvedic_clinic', 'healing_center', 'traditional_medicine'],
  'hakim': ['unani_clinic', 'medicine_shop', 'healing_house'],
  'dai': ['birthing_house', 'midwifery_clinic', 'maternity_home'],
  'jadi_booti_wala': ['herb_shop', 'botanical_store', 'medicine_market'],
  'nadi_vaidya': ['pulse_clinic', 'diagnosis_center', 'traditional_clinic'],

  // African healers
  'sangoma': ['divination_hut', 'healing_lodge', 'spirit_house'],
  'mganga': ['traditional_clinic', 'healing_center', 'medicine_hut'],
  'bone_setter': ['bone_clinic', 'orthopedic_hut', 'manipulation_center'],
  'snake_doctor': ['venom_clinic', 'antivenom_center', 'bite_treatment'],
  'birth_attendant': ['birthing_hut', 'maternity_lodge', 'midwifery'],

  // MENA healers
  'tabib': ['general_clinic', 'physician_office', 'medical_practice'],
  'jarrah': ['surgical_clinic', 'operating_room', 'surgery_center'],
  'attar': ['perfume_medicine_shop', 'aromatic_pharmacy', 'scent_apothecary'],
  'kahhal': ['eye_clinic', 'ophthalmology_center', 'vision_treatment'],

  // East Asian healers
  'kampo_practitioner': ['kampo_clinic', 'japanese_medicine', 'herbal_center'],
  'moxibustion_specialist': ['moxa_clinic', 'heat_therapy_center', 'treatment_room'],
  'pulse_diagnostician': ['pulse_clinic', 'diagnosis_center', 'medical_consultation'],
  'herbal_pharmacist': ['herbal_pharmacy', 'medicine_preparation', 'drug_store'],

  // Oceania healers
  'tohunga': ['sacred_healing_house', 'wharenui', 'maori_medicine_lodge'],
  'taulasea': ['healing_fale', 'samoan_clinic', 'traditional_medicine'],
  'clever_woman': ['spirit_healing_place', 'dreamtime_lodge', 'aboriginal_clinic'],
  'clever_man': ['spirit_healing_place', 'dreamtime_lodge', 'aboriginal_clinic'],
  'bone_singer': ['healing_circle', 'chant_house', 'song_medicine_place'],
  'bush_medicine_woman': ['bush_pharmacy', 'plant_medicine_hut', 'herbal_center'],
  'kahuna': ['healing_temple', 'hawaiian_medicine', 'sacred_clinic'],

  // Pre-Columbian healers
  'curandero': ['folk_clinic', 'healing_casa', 'traditional_medicine'],
  'curandera': ['folk_clinic', 'healing_casa', 'traditional_medicine'],
  'paqo': ['ritual_healing_temple', 'inca_medicine', 'andean_clinic'],
  'ticitl': ['aztec_clinic', 'professional_medicine', 'mesoamerican_hospital'],
  'herbatero': ['herb_workshop', 'plant_medicine_store', 'botanical_clinic'],
  'sobador': ['massage_clinic', 'manipulation_center', 'bone_adjustment'],
  'medicine_person': ['medicine_lodge', 'healing_tipi', 'sacred_healing_place'],
  'medicine_man': ['medicine_lodge', 'healing_tipi', 'sacred_healing_place'],
  'medicine_woman': ['medicine_lodge', 'healing_tipi', 'sacred_healing_place'],
  'medicine_gatherer': ['medicinal_plant_store', 'herb_collection', 'healing_supplies'],
  'shaman': ['spirit_lodge', 'shamanic_healing_center', 'ritual_clinic'],

  // === LEGAL & ADMINISTRATIVE ===
  'lawyer': ['law_office', 'legal_practice', 'advocacy'],
  'advocate': ['legal_chambers', 'court_preparation'],
  'notary': ['notary_office', 'document_house'],
  'clerk': ['clerical_office', 'records_house'],
  'judge': ['courthouse', 'justice_hall'],
  'magistrate': ['magistrate_office', 'local_court'],
  'tax_collector': ['tax_office', 'revenue_house'],
  'customs': ['customs_house', 'border_office'],
  'bailiff': ['bailiff_office', 'enforcement_bureau'],
  'scrivener': ['document_shop', 'writing_service'],
  'qadi': ['sharia_court', 'islamic_court'],

  // === TRANSPORTATION & LOGISTICS ===
  'carter': ['cart_rental', 'transport_service'],
  'wagoner': ['wagon_yard', 'transport_depot'],
  'coachman': ['coach_house', 'carriage_service'],
  'stable': ['stable', 'horse_care'],
  'groom': ['stable', 'animal_care'],
  'ferryman': ['ferry_dock', 'river_crossing'],
  'sailor': ['ship', 'dock', 'port'],
  'shipwright': ['shipyard', 'boat_building'],
  'navigator': ['navigation_office', 'chart_house'],
  'porter': ['porter_station', 'cargo_handling'],
  'teamster': ['freight_depot', 'hauling_service'],
  'muleteer': ['mule_station', 'pack_service'],
  'camel_driver': ['caravansary', 'camel_depot'],

  // === RELIGIOUS & SPIRITUAL ===
  'priest': ['church', 'temple', 'shrine'],
  'monk': ['monastery', 'abbey', 'priory'],
  'nun': ['convent', 'nunnery', 'abbey'],
  'imam': ['mosque', 'prayer_house'],
  'muezzin': ['minaret', 'mosque'],
  'rabbi': ['synagogue', 'beth_midrash'],
  'brahmin': ['temple', 'mandir'],
  'pujari': ['temple', 'shrine'],
  'shaman': ['sacred_hut', 'spirit_lodge'],
  'diviner': ['divination_house', 'oracle_chamber'],
  'fortune_teller': ['fortune_parlor', 'divination_booth'],
  'mystic': ['meditation_center', 'spiritual_retreat'],
  'sufi': ['zawiya', 'tekke', 'khanqah'],
  'griot': ['storytelling_circle', 'oral_history_center'],
  'tohunga': ['sacred_meeting_house', 'wharenui'],

  // === ENTERTAINMENT & LEISURE ===
  'prostitute': ['brothel', 'pleasure_house'],
  'courtesan': ['salon', 'entertainment_house'],
  'gambler': ['gambling_den', 'gaming_house'],
  'bathhouse': ['bathhouse', 'public_baths'],
  'masseur': ['massage_parlor', 'bath_house'],
  'dancer': ['dance_hall', 'performance_venue'],
  'acrobat': ['circus', 'performance_arena'],
  'juggler': ['entertainment_square', 'street_performance'],
  'gladiator': ['arena', 'training_grounds'],

  // === AGRICULTURE & RESOURCE ===
  'farmer': ['farmstead', 'field', 'agricultural_plot'],
  'shepherd': ['pasture', 'grazing_field'],
  'cowherd': ['cattle_pen', 'dairy_farm'],
  'beekeeper': ['apiary', 'honey_farm'],
  'gardener': ['garden', 'botanical_plot'],
  'vintner': ['vineyard', 'wine_estate'],
  'forester': ['forestry_station', 'lumber_camp'],
  'miner': ['mine_entrance', 'mining_camp'],
  'quarry': ['quarry', 'stone_extraction'],
  'hunter': ['hunting_lodge', 'game_station'],
  'trapper': ['trapping_post', 'fur_station'],
  'lumberjack': ['logging_camp', 'timber_yard'],

  // === MODERN PROFESSIONS (Industrial/Modern Era) ===
  'factory': ['factory', 'manufacturing_plant', 'industrial_complex'],
  'engineer': ['engineering_office', 'technical_bureau'],
  'mechanic': ['auto_repair', 'garage', 'machine_shop'],
  'electrician': ['electrical_shop', 'power_station'],
  'plumber': ['plumbing_service', 'pipe_works'],
  'contractor': ['construction_office', 'building_company'],
  'real_estate': ['realty_office', 'property_agency'],
  'insurance': ['insurance_office', 'underwriting_firm'],
  'bank': ['bank', 'financial_institution', 'credit_union'],
  'stock': ['stock_exchange', 'trading_floor'],
  'accountant': ['accounting_firm', 'tax_preparation'],
  'journalist': ['newspaper_office', 'media_bureau'],
  'photographer': ['photo_studio', 'camera_shop'],
  'telephone': ['telephone_exchange', 'communications_center'],
  'radio': ['radio_station', 'broadcast_center'],
  'computer': ['tech_company', 'software_firm'],
  'programmer': ['tech_startup', 'development_studio'],
  'designer': ['design_studio', 'creative_agency'],

  // === GOVERNMENT & MILITARY ===
  'guard': ['guard_post', 'watch_tower'],
  'soldier': ['barracks', 'military_camp'],
  'officer': ['command_post', 'military_headquarters'],
  'general': ['strategic_command', 'war_room'],
  'spy': ['safe_house', 'intelligence_office'],
  'diplomat': ['embassy', 'consulate'],
  'ambassador': ['embassy', 'diplomatic_mission'],
  'bureaucrat': ['government_office', 'administrative_building'],
  'censor': ['censorship_office', 'review_board'],
  'police': ['police_station', 'precinct'],
  'detective': ['detective_agency', 'investigation_bureau'],
  'sheriff': ['sheriff_office', 'law_enforcement'],

  // === CRIMINAL UNDERWORLD ===
  'thief': ['thieves_guild', 'hideout'],
  'smuggler': ['smuggling_den', 'secret_warehouse'],
  'fence': ['pawn_shop', 'stolen_goods'],
  'mobster': ['speakeasy', 'criminal_enterprise'],
  'drug_dealer': ['drug_den', 'distribution_point'],
  'pickpocket': ['criminal_hideout', 'street_gang'],
  'bandit': ['bandit_camp', 'outlaw_hideout'],
  'pirate': ['pirate_cove', 'smuggler_dock']
};

/**
 * Culture-specific workplace name patterns by era
 * Uses actual NPC names and cultural conventions
 */
interface WorkplaceNamePattern {
  prefix?: string[];
  suffix?: string[];
  format?: (npcName: string, workType: string) => string;
  articles?: boolean; // Use articles like "The"
}

const CULTURAL_WORKPLACE_PATTERNS: Record<CulturalZone, Record<HistoricalEra, WorkplaceNamePattern>> = {
  EUROPEAN: {
    [HistoricalEra.PREHISTORY]: {
      format: (name, type) => `${name}'s Place`
    },
    [HistoricalEra.ANTIQUITY]: {
      // Roman/Greek patterns
      prefix: ['Taberna', 'Officina', 'Fabrica', 'Pistrina', 'Fullonica'],
      format: (name, type) => {
        const romanPrefixes: Record<string, string> = {
          'bakery': 'Pistrina',
          'smithy': 'Fabrica',
          'shop': 'Taberna',
          'tavern': 'Caupona',
          'pottery': 'Figulina',
          'scriptorium': 'Scriptorium',
          'mill': 'Mola'
        };
        const prefix = romanPrefixes[type] || 'Officina';
        const genitive = name.endsWith('us') ? name.slice(0, -2) + 'i' :
                        name.endsWith('a') ? name + 'e' : name;
        return `${prefix} ${genitive}`;
      }
    },
    [HistoricalEra.MEDIEVAL]: {
      articles: true,
      format: (name, type) => {
        const patterns = [
          `Master ${name}'s ${type.replace(/_/g, ' ')}`,
          `The ${type.replace(/_/g, ' ')} of ${name}`,
          `${name} & Sons ${type.replace(/_/g, ' ')}`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      articles: true,
      format: (name, type) => {
        const patterns = [
          `${name}'s Fine ${type.replace(/_/g, ' ')}`,
          `The House of ${name}`,
          `${name} & Co. ${type.replace(/_/g, ' ')}`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      format: (name, type) => {
        const patterns = [
          `${name} & Sons Ltd.`,
          `${name}'s ${type.replace(/_/g, ' ')} Works`,
          `The ${name} Manufacturing Co.`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.MODERN_ERA]: {
      format: (name, type) => {
        const patterns = [
          `${name}'s ${type.replace(/_/g, ' ')}`,
          `${type.replace(/_/g, ' ')} Plus`,
          `${name} Enterprises`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.FUTURE_ERA]: {
      format: (name, type) => `${name} Tech Solutions`
    }
  },

  MENA: {
    [HistoricalEra.PREHISTORY]: {
      format: (name, type) => `${name}'s Place`
    },
    [HistoricalEra.ANTIQUITY]: {
      // Egyptian/Mesopotamian patterns
      format: (name, type) => {
        const patterns = [
          `House of ${name}`,
          `${name}'s Workshop`,
          `Temple Workshop of ${name}`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.MEDIEVAL]: {
      // Islamic golden age patterns
      format: (name, type) => {
        const arabicPrefixes: Record<string, string> = {
          'bakery': 'Makhbaz',
          'smithy': 'Haddad',
          'shop': 'Dukkan',
          'market': 'Suq',
          'coffee_house': 'Qahwa',
          'library': 'Maktaba',
          'hospital': 'Maristan',
          'school': 'Madrasa'
        };
        const prefix = arabicPrefixes[type] || 'Dukkan';
        return `${prefix} ${name}`;
      }
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      format: (name, type) => {
        const patterns = [
          `${name} Effendi's ${type.replace(/_/g, ' ')}`,
          `Dukkan ${name}`,
          `${name}'s Bazaar`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      format: (name, type) => `${name} & Brothers Trading`
    },
    [HistoricalEra.MODERN_ERA]: {
      format: (name, type) => `${name} Commercial Center`
    },
    [HistoricalEra.FUTURE_ERA]: {
      format: (name, type) => `${name} Global Trade`
    }
  },

  EAST_ASIAN: {
    [HistoricalEra.PREHISTORY]: {
      format: (name, type) => `${name}'s Hut`
    },
    [HistoricalEra.ANTIQUITY]: {
      // Ancient Chinese patterns
      format: (name, type) => {
        const chinesePrefixes: Record<string, string> = {
          'smithy': 'Iron Workshop',
          'pottery': 'Ceramic House',
          'silk': 'Silk House',
          'tea': 'Tea House',
          'medicine': 'Medicine Hall'
        };
        const prefix = chinesePrefixes[type] || 'Workshop';
        const familyName = name.split(' ')[0];
        return `${familyName} Family ${prefix}`;
      }
    },
    [HistoricalEra.MEDIEVAL]: {
      format: (name, type) => {
        const patterns = [
          `${name.split(' ')[0]}'s ${type.replace(/_/g, ' ')}`,
          `House of ${name.split(' ')[0]}`,
          `${name.split(' ')[0]} Family Shop`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      format: (name, type) => {
        const familyName = name.split(' ')[0];
        return `${familyName} ${type.replace(/_/g, ' ')} House`;
      }
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      format: (name, type) => `${name.split(' ')[0]} Industrial Company`
    },
    [HistoricalEra.MODERN_ERA]: {
      format: (name, type) => `${name.split(' ')[0]} Corporation`
    },
    [HistoricalEra.FUTURE_ERA]: {
      format: (name, type) => `${name.split(' ')[0]} Tech Corp`
    }
  },

  SOUTH_ASIAN: {
    [HistoricalEra.PREHISTORY]: {
      format: (name, type) => `${name}'s Dwelling`
    },
    [HistoricalEra.ANTIQUITY]: {
      // Indus Valley / Vedic patterns
      format: (name, type) => `${name}'s Workshop`
    },
    [HistoricalEra.MEDIEVAL]: {
      format: (name, type) => {
        const patterns = [
          `${name} Ji's ${type.replace(/_/g, ' ')}`,
          `Shri ${name} ${type.replace(/_/g, ' ')}`,
          `${name} & Sons`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      // Mughal period
      format: (name, type) => {
        const patterns = [
          `${name} Sahib's ${type.replace(/_/g, ' ')}`,
          `${name}'s Emporium`,
          `${name} Trading House`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      format: (name, type) => `${name} & Co. Ltd.`
    },
    [HistoricalEra.MODERN_ERA]: {
      format: (name, type) => `${name} Enterprises Pvt. Ltd.`
    },
    [HistoricalEra.FUTURE_ERA]: {
      format: (name, type) => `${name} InfoTech`
    }
  },

  SUB_SAHARAN_AFRICAN: {
    [HistoricalEra.PREHISTORY]: {
      format: (name, type) => `${name}'s Place`
    },
    [HistoricalEra.ANTIQUITY]: {
      format: (name, type) => `${name}'s ${type.replace(/_/g, ' ')}`
    },
    [HistoricalEra.MEDIEVAL]: {
      // West African kingdoms period
      format: (name, type) => {
        const patterns = [
          `${name}'s ${type.replace(/_/g, ' ')}`,
          `House of ${name}`,
          `${name} Family ${type.replace(/_/g, ' ')}`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      format: (name, type) => `${name}'s Trading Post`
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      format: (name, type) => `${name} & Family Business`
    },
    [HistoricalEra.MODERN_ERA]: {
      format: (name, type) => `${name} Enterprises`
    },
    [HistoricalEra.FUTURE_ERA]: {
      format: (name, type) => `${name} Innovation Hub`
    }
  },

  NORTH_AMERICAN_PRE_COLUMBIAN: {
    [HistoricalEra.PREHISTORY]: {
      format: (name, type) => `${name}'s Lodge`
    },
    [HistoricalEra.ANTIQUITY]: {
      format: (name, type) => `${name}'s Workshop`
    },
    [HistoricalEra.MEDIEVAL]: {
      format: (name, type) => {
        const patterns = [
          `${name}'s ${type.replace(/_/g, ' ')}`,
          `Lodge of ${name}`,
          `${name}'s Craft House`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      format: (name, type) => `${name}'s Trading Lodge`
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      format: (name, type) => `${name}'s Shop`
    },
    [HistoricalEra.MODERN_ERA]: {
      format: (name, type) => `${name}'s Business`
    },
    [HistoricalEra.FUTURE_ERA]: {
      format: (name, type) => `${name} Enterprises`
    }
  },

  NORTH_AMERICAN_COLONIAL: {
    [HistoricalEra.PREHISTORY]: {
      format: (name, type) => `${name}'s Place`
    },
    [HistoricalEra.ANTIQUITY]: {
      format: (name, type) => `${name}'s Shop`
    },
    [HistoricalEra.MEDIEVAL]: {
      format: (name, type) => `${name}'s ${type.replace(/_/g, ' ')}`
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      // Colonial period
      format: (name, type) => {
        const patterns = [
          `${name}'s ${type.replace(/_/g, ' ')}`,
          `The ${name} Company`,
          `${name} & Sons`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      format: (name, type) => {
        const patterns = [
          `${name}'s ${type.replace(/_/g, ' ')}`,
          `${name} Manufacturing Co.`,
          `${name} & Co.`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.MODERN_ERA]: {
      format: (name, type) => {
        const patterns = [
          `${name}'s ${type.replace(/_/g, ' ')}`,
          `${type.replace(/_/g, ' ')} Mart`,
          `${name}'s`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.FUTURE_ERA]: {
      format: (name, type) => `${name} Corp`
    }
  },

  SOUTH_AMERICAN: {
    [HistoricalEra.PREHISTORY]: {
      format: (name, type) => `${name}'s Hut`
    },
    [HistoricalEra.ANTIQUITY]: {
      format: (name, type) => `${name}'s Workshop`
    },
    [HistoricalEra.MEDIEVAL]: {
      // Inca/Aztec period
      format: (name, type) => {
        const patterns = [
          `${name}'s ${type.replace(/_/g, ' ')}`,
          `House of ${name}`,
          `${name}'s Craft House`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      // Spanish colonial
      format: (name, type) => {
        const patterns = [
          `${name}'s ${type.replace(/_/g, ' ')}`,
          `Casa ${name}`,
          `Tienda de ${name}`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      format: (name, type) => `${name} y Hermanos`
    },
    [HistoricalEra.MODERN_ERA]: {
      format: (name, type) => `${name} S.A.`
    },
    [HistoricalEra.FUTURE_ERA]: {
      format: (name, type) => `${name} Tech`
    }
  },

  OCEANIA: {
    [HistoricalEra.PREHISTORY]: {
      format: (name, type) => `${name}'s Shelter`
    },
    [HistoricalEra.ANTIQUITY]: {
      format: (name, type) => `${name}'s Hut`
    },
    [HistoricalEra.MEDIEVAL]: {
      format: (name, type) => {
        const patterns = [
          `${name}'s ${type.replace(/_/g, ' ')}`,
          `Whare ${name}`, // Maori for house
          `${name}'s Craft House`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
      }
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      format: (name, type) => `${name}'s Trading Post`
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      format: (name, type) => `${name} & Co.`
    },
    [HistoricalEra.MODERN_ERA]: {
      format: (name, type) => `${name}'s ${type.replace(/_/g, ' ')}`
    },
    [HistoricalEra.FUTURE_ERA]: {
      format: (name, type) => `${name} Pacific Trade`
    }
  }
};

/**
 * Profession category detector - intelligently matches professions to workplace types
 * even when exact matches don't exist
 */
export function detectProfessionCategory(profession: string): string {
  const profLower = profession.toLowerCase();

  // Check for exact keyword matches first
  for (const [keyword, types] of Object.entries(PROFESSION_TO_WORKPLACE)) {
    if (profLower.includes(keyword)) {
      return types[0];
    }
  }

  // Category detection by profession patterns
  const categoryPatterns: Record<string, string[]> = {
    'workshop': ['craft', 'maker', 'wright', 'worker', 'artisan'],
    'shop': ['seller', 'vendor', 'trader', 'dealer', 'monger'],
    'smithy': ['smith', 'forge', 'metal', 'iron'],
    'temple': ['priest', 'monk', 'religious', 'holy', 'sacred', 'divine'],
    'government_office': ['official', 'minister', 'secretary', 'commissioner', 'bureaucrat'],
    'military_post': ['captain', 'sergeant', 'lieutenant', 'commander', 'warrior'],
    'farm': ['peasant', 'villager', 'agricultural', 'planter'],
    'studio': ['artist', 'creative', 'designer', 'sculptor', 'painter'],
    'medical_practice': ['doctor', 'medical', 'health', 'surgeon', 'physician'],
    'educational_institution': ['professor', 'academic', 'researcher', 'intellectual'],
    'financial_office': ['banker', 'financier', 'investor', 'treasurer'],
    'entertainment_venue': ['entertainer', 'performer', 'singer', 'dancer'],
    'construction_site': ['builder', 'constructor', 'engineer', 'architect'],
    'transportation_hub': ['driver', 'pilot', 'captain', 'conductor']
  };

  for (const [workplace, patterns] of Object.entries(categoryPatterns)) {
    for (const pattern of patterns) {
      if (profLower.includes(pattern)) {
        return workplace;
      }
    }
  }

  // Default based on social class indicators
  if (profLower.includes('lord') || profLower.includes('lady') || profLower.includes('noble')) {
    return 'estate';
  }
  if (profLower.includes('master') || profLower.includes('guild')) {
    return 'guild_hall';
  }

  // Enhanced fallback: Create profession-specific business type
  // Convert profession to snake_case and add appropriate suffix
  const professionWords = profession.toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove non-letter characters
    .trim()
    .split(/\s+/) // Split on whitespace
    .filter(word => word.length > 0);

  if (professionWords.length > 0) {
    const professionSlug = professionWords.join('_');

    // Determine appropriate suffix based on profession characteristics
    if (profLower.includes('tea') || profLower.includes('coffee') || profLower.includes('drink')) {
      return `${professionSlug}_house`;
    } else if (profLower.includes('food') || profLower.includes('cook') || profLower.includes('chef')) {
      return `${professionSlug}_kitchen`;
    } else if (profLower.includes('sell') || profLower.includes('merchant') || profLower.includes('trade')) {
      return `${professionSlug}_shop`;
    } else {
      return `${professionSlug}_workshop`;
    }
  }

  // Ultimate fallback
  return 'workshop';
}

/**
 * Determines if an NPC should have an individual workplace in an urban tile
 * vs working at a POI (palace, temple, fortress)
 */
export function shouldHaveIndividualWorkplace(
  profession: string,
  era: HistoricalEra,
  culturalZone: CulturalZone
): boolean {
  const profLower = profession.toLowerCase();

  // PREHISTORY - no formal individual workplaces
  if (era === HistoricalEra.PREHISTORY) {
    return false;
  }

  // These professions work at POIs (existing system)
  const poiProfessions = [
    'guard', 'soldier', 'warrior', 'knight', 'sentinel', 'samurai',
    'priest', 'monk', 'nun', 'cleric', 'imam', 'rabbi', 'brahmin', 'pujari',
    'courtier', 'noble', 'lord', 'lady', 'duke', 'duchess', 'baron', 'count',
    'vizier', 'chancellor', 'chamberlain', 'steward', 'minister',
    'palace', 'temple', 'fortress', 'castle', 'court',
    'king', 'queen', 'prince', 'princess', 'emperor', 'empress',
    'sultan', 'caliph', 'shah', 'maharaja', 'raja', 'daimyo', 'shogun'
  ];

  for (const poi of poiProfessions) {
    if (profLower.includes(poi)) {
      return false;
    }
  }

  // Hunter-gatherer societies - work happens in the field
  if (profLower.includes('hunter') || profLower.includes('gatherer') || profLower.includes('forager')) {
    return false;
  }

  // Nomadic professions
  if (profLower.includes('nomad') || profLower.includes('herder') || profLower.includes('tribal')) {
    return false;
  }

  // Slave/serf - work for others
  if (profLower.includes('slave') || profLower.includes('serf') || profLower.includes('servant')) {
    return false;
  }

  // Everyone else gets a workplace in urban areas
  return true;
}

/**
 * Get the business type for a profession
 */
export function getBusinessType(profession: string): string {
  return detectProfessionCategory(profession);
}

/**
 * Generate appropriate working hours based on era, culture, and profession
 */
export function generateWorkingHours(
  profession: string,
  era: HistoricalEra,
  culturalZone: CulturalZone
): [number, number] {
  const profLower = profession.toLowerCase();

  // Night workers
  if (profLower.includes('guard') || profLower.includes('watch')) {
    return [20, 6]; // Night shift
  }
  if (profLower.includes('baker')) {
    return [3, 12]; // Early morning for fresh bread
  }
  if (profLower.includes('tavern') || profLower.includes('inn') || profLower.includes('brothel')) {
    return [16, 2]; // Evening entertainment
  }

  // Era-specific patterns
  switch (era) {
    case HistoricalEra.PREHISTORY:
      return [6, 18]; // Sunrise to sunset

    case HistoricalEra.ANTIQUITY:
      if (culturalZone === 'EUROPEAN') {
        // Roman schedule - work morning, siesta, evening social
        return [6, 14];
      } else if (culturalZone === 'MENA') {
        // Hot climate - avoid midday
        return [5, 11]; // Morning work, rest during heat
      }
      return [6, 16];

    case HistoricalEra.MEDIEVAL:
      // Medieval - religious schedule
      if (culturalZone === 'MENA' && (profLower.includes('merchant') || profLower.includes('craft'))) {
        // Islamic prayer times considered
        return [7, 19]; // With breaks for prayers
      }
      return [6, 18]; // Dawn to dusk

    case HistoricalEra.RENAISSANCE_EARLY_MODERN:
      return [7, 19]; // Longer working day

    case HistoricalEra.INDUSTRIAL_ERA:
      if (profLower.includes('factory') || profLower.includes('mill')) {
        return [6, 18]; // 12-hour shift
      }
      return [8, 18]; // 10-hour day

    case HistoricalEra.MODERN_ERA:
    case HistoricalEra.FUTURE_ERA:
      if (profLower.includes('office') || profLower.includes('bank')) {
        return [9, 17]; // 9-5
      }
      if (profLower.includes('retail') || profLower.includes('shop')) {
        return [10, 20]; // Retail hours
      }
      return [9, 18]; // Standard modern

    default:
      return [8, 18];
  }
}

/**
 * Generate a historically and culturally accurate workplace name
 */
export function generateWorkplaceName(
  npc: NpcEntity,
  culturalZone: CulturalZone,
  era: HistoricalEra
): string {
  const profession = npc.profession || npc.role || 'Worker';
  const firstName = npc.name.split(' ')[0];
  const lastName = npc.name.split(' ').slice(1).join(' ');

  // Get workplace type
  const workplaceType = detectProfessionCategory(profession);

  // Get cultural pattern
  const pattern = CULTURAL_WORKPLACE_PATTERNS[culturalZone]?.[era];

  if (!pattern || !pattern.format) {
    // Fallback
    return `${firstName}'s ${workplaceType.replace(/_/g, ' ')}`;
  }

  // Apply cultural naming pattern
  let result = pattern.format(firstName, workplaceType);

  // Capitalize properly
  result = result.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  return result;
}

/**
 * Validate if a workplace type is appropriate for a biome
 */
export function isWorkplaceAppropriateForBiome(
  workplaceType: string,
  biome: BiomeType
): boolean {
  const inappropriateMatches: Record<string, BiomeType[]> = {
    'fish_market': [BiomeType.DESERT, BiomeType.MOUNTAIN, BiomeType.STEPPE],
    'shipyard': [BiomeType.DESERT, BiomeType.MOUNTAIN, BiomeType.STEPPE],
    'docks': [BiomeType.DESERT, BiomeType.MOUNTAIN, BiomeType.STEPPE],
    'mine': [BiomeType.BEACH, BiomeType.WETLANDS, BiomeType.SHALLOW_OCEAN],
    'quarry': [BiomeType.WETLANDS, BiomeType.BEACH, BiomeType.SHALLOW_OCEAN],
    'vineyard': [BiomeType.TUNDRA, BiomeType.DESERT, BiomeType.WETLANDS]
  };

  const restrictions = inappropriateMatches[workplaceType];
  if (!restrictions) {
    return true; // No restrictions
  }

  return !restrictions.includes(biome);
}

/**
 * Generate supply chain connections for a business type
 */
export function getSupplyChainConnections(businessType: string): {
  suppliers: string[];
  customers: string[];
} {
  const supplyChains: Record<string, { suppliers: string[], customers: string[] }> = {
    'bakery': {
      suppliers: ['mill', 'farm'],
      customers: ['market', 'inn', 'tavern']
    },
    'mill': {
      suppliers: ['farm'],
      customers: ['bakery', 'brewery']
    },
    'smithy': {
      suppliers: ['mine', 'charcoal_burner'],
      customers: ['armory', 'market', 'farm']
    },
    'brewery': {
      suppliers: ['farm', 'mill'],
      customers: ['tavern', 'inn']
    },
    'tannery': {
      suppliers: ['butcher', 'hunter'],
      customers: ['cobbler', 'saddler', 'armorer']
    },
    'weaving_shop': {
      suppliers: ['farm', 'shepherd'],
      customers: ['tailor', 'market']
    },
    'tailor_shop': {
      suppliers: ['weaving_shop', 'dyer'],
      customers: ['market', 'nobility']
    },
    'pottery': {
      suppliers: ['clay_pit'],
      customers: ['market', 'tavern', 'household']
    },
    'butcher_shop': {
      suppliers: ['farm', 'hunter'],
      customers: ['market', 'inn', 'tannery']
    },
    'jewelry_shop': {
      suppliers: ['goldsmith', 'mine', 'gem_cutter'],
      customers: ['nobility', 'wealthy_merchants']
    }
  };

  return supplyChains[businessType] || { suppliers: [], customers: [] };
}

/**
 * Generate business status based on tile characteristics and random factors
 */
export function generateBusinessStatus(
  culturalZone: CulturalZone,
  era: HistoricalEra,
  biome: BiomeType,
  population: number,
  sacrality?: number,
  safety?: number
): string {
  // Base probabilities for different statuses
  let baseScores = {
    'barely_scraping_by': 0.15,
    'down_on_its_luck': 0.20,
    'modest': 0.35,
    'doing_well': 0.20,
    'thriving': 0.10
  };

  // Adjust based on settlement size
  const populationFactor = Math.min(population / 10000, 1); // Normalize to 0-1
  baseScores.thriving += populationFactor * 0.15;
  baseScores.doing_well += populationFactor * 0.10;
  baseScores.barely_scraping_by -= populationFactor * 0.10;

  // Adjust based on biome type (urban areas generally more prosperous)
  if (biome === BiomeType.DENSE_CITY || biome === BiomeType.CITY_CENTER) {
    baseScores.thriving += 0.10;
    baseScores.doing_well += 0.10;
    baseScores.barely_scraping_by -= 0.15;
  } else if (biome === BiomeType.HAMLET) {
    baseScores.barely_scraping_by += 0.10;
    baseScores.down_on_its_luck += 0.05;
    baseScores.thriving -= 0.10;
  }

  // Adjust based on safety (0-1 scale)
  if (safety !== undefined) {
    const safetyBonus = (safety - 0.5) * 0.3; // -0.15 to +0.15
    baseScores.thriving += safetyBonus;
    baseScores.doing_well += safetyBonus * 0.5;
    baseScores.barely_scraping_by -= safetyBonus;
  }

  // Adjust based on sacrality (pilgrimage/trade benefits)
  if (sacrality !== undefined && sacrality > 0.5) {
    const sacralityBonus = (sacrality - 0.5) * 0.2;
    baseScores.doing_well += sacralityBonus;
    baseScores.thriving += sacralityBonus * 0.5;
  }

  // Era-specific adjustments
  if (era === HistoricalEra.INDUSTRIAL_ERA) {
    baseScores.thriving += 0.05; // Industrial boom
  } else if (era === HistoricalEra.MODERN_ERA) {
    baseScores.doing_well += 0.10; // Modern stability
    baseScores.modest += 0.05;
  }

  // Normalize scores to ensure they sum to 1
  const totalScore = Object.values(baseScores).reduce((sum, score) => sum + score, 0);
  Object.keys(baseScores).forEach(key => {
    baseScores[key as keyof typeof baseScores] /= totalScore;
  });

  // Select status based on weighted random
  const random = Math.random();
  let cumulative = 0;
  for (const [status, probability] of Object.entries(baseScores)) {
    cumulative += probability;
    if (random <= cumulative) {
      return status;
    }
  }

  return 'modest'; // Fallback
}

/**
 * Generate goods quality level based on business status, culture, and era
 */
export function generateGoodsQuality(
  businessStatus: string,
  businessType: string,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  ownerWealth: string
): string {
  // Base quality mapping from business status
  const statusQualityMapping: Record<string, string[]> = {
    'barely_scraping_by': ['poor', 'poor', 'crude', 'rough'],
    'down_on_its_luck': ['poor', 'basic', 'adequate'],
    'modest': ['basic', 'adequate', 'decent'],
    'doing_well': ['decent', 'good', 'fine'],
    'thriving': ['fine', 'excellent', 'superior', 'masterwork']
  };

  let qualityOptions = statusQualityMapping[businessStatus] || ['basic', 'adequate'];

  // Adjust based on business type (some inherently produce higher quality)
  if (businessType.includes('goldsmith') || businessType.includes('jewelry') ||
      businessType.includes('art') || businessType.includes('luxury')) {
    qualityOptions = qualityOptions.map(q => {
      const upgradeMap: Record<string, string> = {
        'poor': 'basic', 'crude': 'basic', 'rough': 'adequate',
        'basic': 'adequate', 'adequate': 'decent', 'decent': 'good',
        'good': 'fine', 'fine': 'excellent', 'excellent': 'superior',
        'superior': 'masterwork', 'masterwork': 'legendary'
      };
      return upgradeMap[q] || q;
    });
  }

  // Cultural adjustments
  if (culturalZone === 'EAST_ASIAN' && era === HistoricalEra.MEDIEVAL) {
    // Ming/Song era renowned for craftsmanship
    if (businessType.includes('potter') || businessType.includes('silk') || businessType.includes('tea')) {
      qualityOptions.push('excellent', 'masterwork');
    }
  } else if (culturalZone === 'EUROPEAN' && era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
    // Renaissance craftsmanship boom
    if (businessType.includes('artist') || businessType.includes('craft')) {
      qualityOptions.push('fine', 'excellent');
    }
  }

  // Owner wealth influence
  if (ownerWealth === 'wealthy' || ownerWealth === 'noble') {
    qualityOptions = qualityOptions.filter(q => !['poor', 'crude', 'rough'].includes(q));
    qualityOptions.push('fine', 'excellent');
  } else if (ownerWealth === 'poor') {
    qualityOptions = qualityOptions.filter(q => !['excellent', 'superior', 'masterwork'].includes(q));
  }

  // Select random quality from available options
  return qualityOptions[Math.floor(Math.random() * qualityOptions.length)] || 'adequate';
}

/**
 * Format business type for display with proper capitalization
 */
export function formatBusinessTypeForDisplay(businessType: string): string {
  return businessType
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Enhanced function to integrate with urbanTileRegistryService
 * Generates complete business information for urban tiles
 */
export function generateBusinessForUrbanTile(
  npc: NpcEntity,
  culturalZone: CulturalZone,
  era: HistoricalEra,
  biome: BiomeType,
  population: number = 1000,
  sacrality?: number,
  safety?: number
): {
  name: string;
  type: string;
  displayType: string;
  owner: string;
  ownerId: string;
  openHours: [number, number];
  employees: string[];
  maxEmployees: number;
  supplyChain: { suppliers: string[], customers: string[] };
  businessStatus: string;
  businessStatusDisplay: string;
  goodsQuality: string;
  goodsQualityDisplay: string;
  culturalDetails: {
    zone: CulturalZone;
    era: HistoricalEra;
    namePattern: string;
  };
} | null {
  // Check if this NPC should have a workplace
  if (!shouldHaveIndividualWorkplace(npc.profession || '', era, culturalZone)) {
    return null;
  }

  const businessType = detectProfessionCategory(npc.profession || '');

  // Check biome appropriateness
  if (!isWorkplaceAppropriateForBiome(businessType, biome)) {
    return null;
  }

  // Generate business status based on contextual factors
  const businessStatus = generateBusinessStatus(culturalZone, era, biome, population, sacrality, safety);

  // Determine owner wealth level
  const ownerWealth = npc.wealthLevel ||
    (npc.profession?.toLowerCase().includes('master') ? 'wealthy' :
     npc.profession?.toLowerCase().includes('guild') ? 'comfortable' : 'modest');

  // Generate goods quality
  const goodsQuality = generateGoodsQuality(businessStatus, businessType, culturalZone, era, ownerWealth);

  // Generate culturally appropriate name
  const businessName = generateWorkplaceName(npc, culturalZone, era);

  // Generate working hours
  const openHours = generateWorkingHours(npc.profession || '', era, culturalZone);

  // Get supply chain
  const supplyChain = getSupplyChainConnections(businessType);

  // Determine max employees based on business type and era
  const maxEmployees = era === HistoricalEra.INDUSTRIAL_ERA ? 20 :
                       era === HistoricalEra.MODERN_ERA ? 10 :
                       businessType === 'factory' ? 50 :
                       businessType === 'smithy' ? 3 :
                       businessType === 'bakery' ? 2 :
                       businessType === 'shop' ? 1 :
                       2;

  // Format display strings
  const displayType = formatBusinessTypeForDisplay(businessType);
  const businessStatusDisplay = businessStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const goodsQualityDisplay = goodsQuality.charAt(0).toUpperCase() + goodsQuality.slice(1);

  return {
    name: businessName,
    type: businessType,
    displayType,
    owner: npc.name,
    ownerId: npc.id,
    openHours,
    employees: [],
    maxEmployees,
    supplyChain,
    businessStatus,
    businessStatusDisplay,
    goodsQuality,
    goodsQualityDisplay,
    culturalDetails: {
      zone: culturalZone,
      era,
      namePattern: CULTURAL_WORKPLACE_PATTERNS[culturalZone]?.[era] ? 'cultural' : 'default'
    }
  };
}

// Export type definitions for use in other services
export type BusinessInfo = ReturnType<typeof generateBusinessForUrbanTile>;