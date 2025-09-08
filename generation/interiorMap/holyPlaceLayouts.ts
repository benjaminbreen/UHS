/**
 * generation/interiorMap/holyPlaceLayouts.ts
 * Enhanced layouts for holy places with private/restricted areas
 */

import { CulturalZone, HistoricalEra } from '../../types';

export interface HolyPlaceRoom {
  name: string;
  type: 'public' | 'restricted' | 'private';
  requiredPermission?: 'clergy' | 'high_clergy' | 'nobility' | 'quest';
  description: string;
  features: string[];
  npcs?: string[];
}

export interface HolyPlaceLayout {
  culturalZone: CulturalZone;
  era: HistoricalEra;
  mainHall: HolyPlaceRoom;
  privateRooms: HolyPlaceRoom[];
  restrictedRooms: HolyPlaceRoom[];
}

export const HOLY_PLACE_LAYOUTS: Partial<Record<CulturalZone, Partial<Record<HistoricalEra, HolyPlaceLayout>>>> = {
  EUROPEAN: {
    Classical: {
      culturalZone: 'EUROPEAN',
      era: 'Classical',
      mainHall: {
        name: 'Cella',
        type: 'public',
        description: 'Inner chamber housing the cult statue of the deity',
        features: ['marble_statue', 'offering_altar', 'painted_friezes', 'ionic_columns'],
        npcs: ['priest', 'oracle', 'supplicant']
      },
      privateRooms: [
        {
          name: 'Adyton',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Most sacred inner chamber, forbidden to all but high priests',
          features: ['sacred_statue', 'oracle_tripod', 'sacred_spring', 'laurel_branches'],
          npcs: ['pythia', 'high_priest']
        },
        {
          name: 'Treasury',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Storage for temple offerings and sacred objects',
          features: ['bronze_tripods', 'votive_offerings', 'gold_wreaths', 'inscribed_tablets'],
          npcs: ['temple_keeper']
        }
      ],
      restrictedRooms: [
        {
          name: 'Oracle Chamber',
          type: 'restricted',
          requiredPermission: 'quest',
          description: 'Sacred space where prophecies are delivered',
          features: ['fissure', 'sacred_vapors', 'bronze_cauldron', 'prophecy_scrolls'],
          npcs: ['oracle']
        },
        {
          name: 'Sacrifice Hall',
          type: 'restricted',
          requiredPermission: 'nobility',
          description: 'Chamber for ritual sacrifices and libations',
          features: ['altar', 'sacrificial_knives', 'libation_bowls', 'sacred_fire'],
          npcs: ['hierophant']
        }
      ]
    },
    Medieval: {
      culturalZone: 'EUROPEAN',
      era: 'Medieval',
      mainHall: {
        name: 'Nave',
        type: 'public',
        description: 'The main hall where congregants gather for worship',
        features: ['pews', 'altar', 'stained_glass', 'columns'],
        npcs: ['priest', 'acolyte', 'pilgrim']
      },
      privateRooms: [
        {
          name: 'Confessor\'s Chamber',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'A small private room for hearing confessions',
          features: ['confessional_booth', 'crucifix', 'candles'],
          npcs: ['confessor']
        },
        {
          name: 'Scriptorium',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Room where monks copy and illuminate manuscripts',
          features: ['writing_desks', 'ink_pots', 'vellum', 'quills', 'manuscript_shelves'],
          npcs: ['scribe_monk', 'illuminator']
        },
        {
          name: 'Abbot\'s Study',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'The private study of the abbey\'s leader',
          features: ['desk', 'bookshelf', 'holy_texts', 'fireplace'],
          npcs: ['abbot']
        },
        {
          name: 'Sacristy',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Storage room for sacred vessels and vestments',
          features: ['vestment_chest', 'chalice_cabinet', 'holy_water_font']
        }
      ],
      restrictedRooms: [
        {
          name: 'Choir',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Elevated area for the church choir',
          features: ['choir_stalls', 'organ', 'music_stands'],
          npcs: ['choir_master']
        },
        {
          name: 'Crypt',
          type: 'restricted',
          requiredPermission: 'quest',
          description: 'Underground burial chamber of past clergy',
          features: ['tombs', 'memorial_plaques', 'ossuary'],
          npcs: ['crypt_keeper']
        },
        {
          name: 'Relic Chamber',
          type: 'restricted',
          requiredPermission: 'high_clergy',
          description: 'Secure room housing holy relics',
          features: ['reliquary', 'display_cases', 'guards']
        }
      ]
    },
    Renaissance: {
      culturalZone: 'EUROPEAN',
      era: 'Renaissance',
      mainHall: {
        name: 'Basilica Nave',
        type: 'public',
        description: 'Magnificent hall with Renaissance art and architecture',
        features: ['marble_floors', 'painted_dome', 'renaissance_sculptures', 'corinthian_columns'],
        npcs: ['cardinal', 'artist', 'patron', 'pilgrim']
      },
      privateRooms: [
        {
          name: 'Cardinal\'s Office',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Lavish office for church administration',
          features: ['ornate_desk', 'papal_documents', 'renaissance_paintings', 'globe'],
          npcs: ['cardinal', 'secretary']
        },
        {
          name: 'Artist\'s Workshop',
          type: 'private',
          requiredPermission: 'quest',
          description: 'Workshop for creating religious art',
          features: ['easels', 'paint_supplies', 'sketches', 'scaffolding', 'unfinished_frescoes'],
          npcs: ['master_artist', 'apprentice']
        }
      ],
      restrictedRooms: [
        {
          name: 'Papal Archive',
          type: 'restricted',
          requiredPermission: 'high_clergy',
          description: 'Secret archive of church documents',
          features: ['ancient_texts', 'papal_bulls', 'secret_correspondence', 'locked_cabinets'],
          npcs: ['archivist']
        },
        {
          name: 'Indulgence Office',
          type: 'restricted',
          requiredPermission: 'nobility',
          description: 'Office for purchasing indulgences',
          features: ['money_chest', 'indulgence_certificates', 'account_books'],
          npcs: ['pardoner']
        }
      ]
    },
    'Early Modern': {
      culturalZone: 'EUROPEAN',
      era: 'Early Modern',
      mainHall: {
        name: 'Cathedral Nave',
        type: 'public',
        description: 'Grand hall with baroque decoration',
        features: ['ornate_pews', 'gilded_altar', 'frescoes', 'marble_columns'],
        npcs: ['bishop', 'deacon', 'nobility']
      },
      privateRooms: [
        {
          name: 'Bishop\'s Chambers',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Luxurious private quarters of the bishop',
          features: ['four_poster_bed', 'prayer_kneeler', 'private_altar', 'tapestries'],
          npcs: ['bishop', 'servant']
        },
        {
          name: 'Chapter House',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Meeting room for cathedral clergy',
          features: ['council_table', 'record_books', 'seal_press'],
          npcs: ['canon']
        }
      ],
      restrictedRooms: [
        {
          name: 'Treasury',
          type: 'restricted',
          requiredPermission: 'high_clergy',
          description: 'Vault containing church treasures',
          features: ['gold_vessels', 'jeweled_crosses', 'donation_chest'],
          npcs: ['treasurer']
        },
        {
          name: 'Bell Tower',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Tower housing the church bells',
          features: ['bells', 'rope_mechanism', 'viewing_platform'],
          npcs: ['bell_ringer']
        }
      ]
    },
    Industrial: {
      culturalZone: 'EUROPEAN',
      era: 'Industrial',
      mainHall: {
        name: 'Victorian Chapel',
        type: 'public',
        description: 'Neo-Gothic chapel with industrial era additions',
        features: ['wooden_pews', 'stained_glass', 'gas_lamps', 'pipe_organ'],
        npcs: ['vicar', 'organist', 'congregation']
      },
      privateRooms: [
        {
          name: 'Vicarage Parlor',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Victorian parlor for receiving visitors',
          features: ['horsehair_sofa', 'tea_service', 'bible_stand', 'coal_fireplace'],
          npcs: ['vicar', 'vicar_wife']
        },
        {
          name: 'Sunday School Room',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Room for teaching children religious education',
          features: ['small_desks', 'blackboard', 'biblical_charts', 'hymn_books'],
          npcs: ['sunday_school_teacher']
        }
      ],
      restrictedRooms: [
        {
          name: 'Vestry',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Room for storing vestments and preparing for services',
          features: ['robes', 'surplices', 'parish_registers', 'communion_wine'],
          npcs: ['verger']
        }
      ]
    },
    Modern: {
      culturalZone: 'EUROPEAN',
      era: 'Modern',
      mainHall: {
        name: 'Contemporary Sanctuary',
        type: 'public',
        description: 'Modern worship space with minimalist design',
        features: ['modern_seating', 'projection_screens', 'sound_system', 'abstract_cross'],
        npcs: ['pastor', 'worship_leader', 'congregant']
      },
      privateRooms: [
        {
          name: 'Pastor\'s Office',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Modern office for pastoral counseling',
          features: ['computer', 'counseling_chairs', 'bookshelf', 'coffee_maker'],
          npcs: ['pastor']
        },
        {
          name: 'Youth Room',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Space for youth ministry activities',
          features: ['bean_bags', 'game_console', 'mini_fridge', 'guitars'],
          npcs: ['youth_pastor']
        }
      ],
      restrictedRooms: [
        {
          name: 'Media Booth',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Control room for audio and visual systems',
          features: ['mixing_board', 'computers', 'cameras', 'lighting_controls'],
          npcs: ['tech_volunteer']
        }
      ]
    }
  },
  MENA: {
    Classical: {
      culturalZone: 'MENA',
      era: 'Classical',
      mainHall: {
        name: 'Temple Sanctuary',
        type: 'public',
        description: 'Ancient Near Eastern temple with massive columns',
        features: ['cedar_pillars', 'bronze_altar', 'incense_burners', 'votive_statues'],
        npcs: ['high_priest', 'temple_servant', 'worshipper']
      },
      privateRooms: [
        {
          name: 'Holy of Holies',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Most sacred inner chamber',
          features: ['ark', 'cherubim_statues', 'mercy_seat', 'sacred_veil'],
          npcs: ['high_priest']
        },
        {
          name: 'Priest\'s Chamber',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Preparation room for priests',
          features: ['ritual_garments', 'washing_basin', 'anointing_oils', 'scrolls'],
          npcs: ['priest']
        }
      ],
      restrictedRooms: [
        {
          name: 'Treasury',
          type: 'restricted',
          requiredPermission: 'high_clergy',
          description: 'Storage for temple treasures',
          features: ['gold_vessels', 'silver_trumpets', 'offering_boxes'],
          npcs: ['temple_treasurer']
        }
      ]
    },
    Medieval: {
      culturalZone: 'MENA',
      era: 'Medieval',
      mainHall: {
        name: 'Prayer Hall',
        type: 'public',
        description: 'Main hall for communal prayer with geometric patterns',
        features: ['prayer_rugs', 'mihrab', 'minbar', 'horseshoe_arches', 'geometric_tiles'],
        npcs: ['imam', 'muezzin', 'worshipper']
      },
      privateRooms: [
        {
          name: 'Imam\'s Chamber',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Private study and meditation room',
          features: ['prayer_mat', 'quran_stand', 'bookshelf', 'cushions'],
          npcs: ['imam']
        },
        {
          name: 'Wudu Room',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Ritual washing preparation room',
          features: ['marble_fountains', 'towels', 'benches', 'ablution_pools']
        },
        {
          name: 'Caliph\'s Prayer Chamber',
          type: 'private',
          requiredPermission: 'nobility',
          description: 'Private prayer space for the ruler',
          features: ['silk_carpets', 'gold_mihrab', 'ivory_quran_stand', 'maqsura_screen'],
          npcs: ['caliph', 'royal_guard']
        }
      ],
      restrictedRooms: [
        {
          name: 'Minaret Access',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Stairs leading to the minaret',
          features: ['spiral_stairs', 'call_platform', 'muezzin_chamber'],
          npcs: ['muezzin']
        },
        {
          name: 'Madrasa Library',
          type: 'restricted',
          requiredPermission: 'quest',
          description: 'Library of religious texts and scholarly works',
          features: ['manuscript_shelves', 'reading_stands', 'calligraphy_tools', 'astrolabes'],
          npcs: ['scholar', 'librarian']
        },
        {
          name: 'Waqf Office',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Office managing religious endowments',
          features: ['ledgers', 'property_deeds', 'seal', 'money_chest'],
          npcs: ['waqf_administrator']
        }
      ]
    },
    'Early Modern': {
      culturalZone: 'MENA',
      era: 'Early Modern',
      mainHall: {
        name: 'Ottoman Mosque Hall',
        type: 'public',
        description: 'Grand mosque with Ottoman architectural elements',
        features: ['massive_dome', 'marble_mihrab', 'iznik_tiles', 'crystal_chandeliers'],
        npcs: ['sheikh', 'dervish', 'janissary', 'merchant']
      },
      privateRooms: [
        {
          name: 'Sheikh\'s Study',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Scholarly chamber of the religious leader',
          features: ['persian_rugs', 'manuscript_collection', 'writing_desk', 'celestial_globe'],
          npcs: ['sheikh_ul_islam']
        },
        {
          name: 'Sultan\'s Lodge',
          type: 'private',
          requiredPermission: 'nobility',
          description: 'Royal prayer lodge within the mosque',
          features: ['gilded_screens', 'throne', 'precious_carpets', 'mother_of_pearl_quran'],
          npcs: ['sultan', 'vizier']
        }
      ],
      restrictedRooms: [
        {
          name: 'Dervish Hall',
          type: 'restricted',
          requiredPermission: 'quest',
          description: 'Chamber for whirling dervish ceremonies',
          features: ['polished_floor', 'musical_instruments', 'sufi_robes', 'meditation_cells'],
          npcs: ['dervish_master']
        }
      ]
    },
    Modern: {
      culturalZone: 'MENA',
      era: 'Modern',
      mainHall: {
        name: 'Contemporary Mosque',
        type: 'public',
        description: 'Modern mosque with traditional elements',
        features: ['air_conditioning', 'digital_prayer_times', 'marble_floors', 'sound_system'],
        npcs: ['imam', 'community_leader', 'worshipper']
      },
      privateRooms: [
        {
          name: 'Imam\'s Office',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Modern administrative office',
          features: ['computer', 'fatwa_database', 'conference_table', 'library'],
          npcs: ['imam']
        },
        {
          name: 'Women\'s Prayer Hall',
          type: 'private',
          requiredPermission: 'quest',
          description: 'Separate prayer space for women',
          features: ['prayer_rugs', 'screens', 'children_area', 'quran_shelves'],
          npcs: ['female_teacher']
        }
      ],
      restrictedRooms: [
        {
          name: 'Islamic Center',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Community center for education and events',
          features: ['classroom', 'projector', 'halal_kitchen', 'youth_room'],
          npcs: ['youth_coordinator']
        }
      ]
    }
  },
  EAST_ASIAN: {
    Classical: {
      culturalZone: 'EAST_ASIAN',
      era: 'Classical',
      mainHall: {
        name: 'Ancestral Hall',
        type: 'public',
        description: 'Hall for venerating ancestors with ritual bronzes',
        features: ['ancestor_tablets', 'bronze_vessels', 'jade_ornaments', 'lacquered_pillars'],
        npcs: ['ritual_master', 'clan_elder', 'descendant']
      },
      privateRooms: [
        {
          name: 'Oracle Bone Chamber',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Room for divination using oracle bones',
          features: ['turtle_shells', 'ox_scapulae', 'bronze_stylus', 'divination_texts'],
          npcs: ['diviner']
        }
      ],
      restrictedRooms: [
        {
          name: 'Spirit Treasury',
          type: 'restricted',
          requiredPermission: 'nobility',
          description: 'Storage for ancestral treasures',
          features: ['ritual_bronzes', 'jade_bi_discs', 'silk_scrolls', 'gold_seals'],
          npcs: ['keeper']
        }
      ]
    },
    Medieval: {
      culturalZone: 'EAST_ASIAN',
      era: 'Medieval',
      mainHall: {
        name: 'Main Temple Hall',
        type: 'public',
        description: 'Central worship space with Buddha statue',
        features: ['buddha_statue', 'incense_burners', 'offering_table', 'meditation_mats'],
        npcs: ['monk', 'novice', 'pilgrim']
      },
      privateRooms: [
        {
          name: 'Abbot\'s Quarters',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Simple but dignified private room',
          features: ['meditation_cushion', 'tea_set', 'calligraphy_desk', 'scroll_rack'],
          npcs: ['abbot']
        },
        {
          name: 'Meditation Chamber',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Silent room for deep meditation',
          features: ['zafu_cushions', 'bell', 'incense', 'scroll_painting']
        },
        {
          name: 'Tea Ceremony Room',
          type: 'private',
          requiredPermission: 'quest',
          description: 'Tranquil space for tea ceremony',
          features: ['tatami_mats', 'tea_utensils', 'flower_arrangement', 'calligraphy_scroll'],
          npcs: ['tea_master']
        }
      ],
      restrictedRooms: [
        {
          name: 'Sutra Repository',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Library housing sacred texts',
          features: ['sutra_cabinets', 'reading_table', 'preservation_tools'],
          npcs: ['librarian_monk']
        },
        {
          name: 'Inner Sanctum',
          type: 'restricted',
          requiredPermission: 'high_clergy',
          description: 'Most sacred area with ancient relics',
          features: ['relic_shrine', 'eternal_flame', 'sacred_bell'],
          npcs: ['guardian_monk']
        }
      ]
    },
    'Early Modern': {
      culturalZone: 'EAST_ASIAN',
      era: 'Early Modern',
      mainHall: {
        name: 'Shinto Shrine Hall',
        type: 'public',
        description: 'Sacred shrine with torii gates',
        features: ['shimenawa_rope', 'offering_box', 'sacred_mirror', 'purification_fountain'],
        npcs: ['kannushi', 'miko', 'worshipper']
      },
      privateRooms: [
        {
          name: 'Kannushi\'s Chamber',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Private room of the head priest',
          features: ['ritual_robes', 'sacred_texts', 'ceremonial_objects', 'family_shrine'],
          npcs: ['kannushi']
        },
        {
          name: 'Kagura Stage',
          type: 'private',
          requiredPermission: 'quest',
          description: 'Stage for sacred dance performances',
          features: ['wooden_stage', 'musical_instruments', 'dance_masks', 'costume_chest'],
          npcs: ['miko', 'musician']
        }
      ],
      restrictedRooms: [
        {
          name: 'Honden',
          type: 'restricted',
          requiredPermission: 'high_clergy',
          description: 'Inner sanctuary housing the kami',
          features: ['sacred_object', 'mirror', 'sword', 'jewel'],
          npcs: ['high_priest']
        }
      ]
    },
    Modern: {
      culturalZone: 'EAST_ASIAN',
      era: 'Modern',
      mainHall: {
        name: 'Modern Buddhist Temple',
        type: 'public',
        description: 'Contemporary temple blending tradition and modernity',
        features: ['led_lanterns', 'digital_prayer_wheels', 'modern_altar', 'meditation_apps'],
        npcs: ['modern_monk', 'lay_practitioner', 'tourist']
      },
      privateRooms: [
        {
          name: 'Dharma Center',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Teaching center for Buddhist education',
          features: ['projector', 'meditation_cushions', 'dharma_books', 'sound_system'],
          npcs: ['dharma_teacher']
        }
      ],
      restrictedRooms: [
        {
          name: 'Retreat Center',
          type: 'restricted',
          requiredPermission: 'quest',
          description: 'Space for intensive meditation retreats',
          features: ['isolation_cells', 'communal_kitchen', 'garden', 'library'],
          npcs: ['retreat_master']
        }
      ]
    }
  },
  SOUTH_ASIAN: {
    Classical: {
      culturalZone: 'SOUTH_ASIAN',
      era: 'Classical',
      mainHall: {
        name: 'Mandapa',
        type: 'public',
        description: 'Pillared hall for congregational worship',
        features: ['ornate_pillars', 'deity_statue', 'oil_lamps', 'flower_offerings'],
        npcs: ['priest', 'devotee', 'temple_dancer']
      },
      privateRooms: [
        {
          name: 'Garbhagriha',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Inner sanctum housing the main deity',
          features: ['deity_idol', 'sacred_flame', 'offerings', 'bells'],
          npcs: ['head_priest']
        },
        {
          name: 'Priest\'s Chamber',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Living quarters for temple priests',
          features: ['simple_cot', 'prayer_items', 'sacred_texts', 'ritual_vessels'],
          npcs: ['priest']
        }
      ],
      restrictedRooms: [
        {
          name: 'Treasury Room',
          type: 'restricted',
          requiredPermission: 'high_clergy',
          description: 'Storage for temple wealth and offerings',
          features: ['treasure_chests', 'donation_records', 'jewelry_boxes'],
          npcs: ['treasurer']
        },
        {
          name: 'Ritual Preparation Room',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Room for preparing sacred rituals',
          features: ['ritual_items', 'sacred_herbs', 'holy_water', 'ceremonial_clothes']
        }
      ]
    },
    Medieval: {
      culturalZone: 'SOUTH_ASIAN',
      era: 'Medieval',
      mainHall: {
        name: 'Dravidian Temple Hall',
        type: 'public',
        description: 'Elaborate temple with gopuram towers',
        features: ['carved_pillars', 'bronze_statues', 'temple_tank', 'nandi_statue'],
        npcs: ['brahmin', 'devadasi', 'pilgrim', 'musician']
      },
      privateRooms: [
        {
          name: 'Sanctum Sanctorum',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Innermost sacred chamber',
          features: ['main_deity', 'gold_ornaments', 'sacred_lamps', 'ritual_implements'],
          npcs: ['chief_priest']
        },
        {
          name: 'Devadasi Quarters',
          type: 'private',
          requiredPermission: 'quest',
          description: 'Living space for temple dancers',
          features: ['dance_bells', 'costumes', 'musical_instruments', 'practice_mirror'],
          npcs: ['devadasi', 'dance_teacher']
        }
      ],
      restrictedRooms: [
        {
          name: 'Temple Kitchen',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Sacred kitchen for preparing prasadam',
          features: ['large_pots', 'sacred_fire', 'spice_storage', 'offering_plates'],
          npcs: ['temple_cook']
        }
      ]
    },
    'Early Modern': {
      culturalZone: 'SOUTH_ASIAN',
      era: 'Early Modern',
      mainHall: {
        name: 'Mughal-Era Temple',
        type: 'public',
        description: 'Temple showing Indo-Islamic architectural fusion',
        features: ['onion_domes', 'marble_floors', 'intricate_carvings', 'courtyard_fountain'],
        npcs: ['pandit', 'qawwali_singer', 'merchant', 'soldier']
      },
      privateRooms: [
        {
          name: 'Raja\'s Prayer Chamber',
          type: 'private',
          requiredPermission: 'nobility',
          description: 'Private worship space for royalty',
          features: ['jeweled_idol', 'silk_cushions', 'gold_vessels', 'private_shrine'],
          npcs: ['raja', 'royal_priest']
        }
      ],
      restrictedRooms: [
        {
          name: 'Temple Archives',
          type: 'restricted',
          requiredPermission: 'quest',
          description: 'Repository of ancient manuscripts',
          features: ['palm_leaf_manuscripts', 'copper_plates', 'royal_grants', 'astronomical_texts'],
          npcs: ['keeper_of_records']
        }
      ]
    },
    Modern: {
      culturalZone: 'SOUTH_ASIAN',
      era: 'Modern',
      mainHall: {
        name: 'Contemporary Mandir',
        type: 'public',
        description: 'Modern temple with traditional elements',
        features: ['marble_deities', 'led_lighting', 'speaker_system', 'air_conditioning'],
        npcs: ['pujari', 'volunteer', 'devotee']
      },
      privateRooms: [
        {
          name: 'Community Hall',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Multi-purpose hall for events',
          features: ['stage', 'folding_chairs', 'kitchen_access', 'projection_screen'],
          npcs: ['event_coordinator']
        }
      ],
      restrictedRooms: [
        {
          name: 'Donation Office',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Administrative office for temple finances',
          features: ['computer', 'safe', 'receipt_books', 'donor_records'],
          npcs: ['temple_administrator']
        }
      ]
    }
  },
  AFRICAN: {
    Classical: {
      culturalZone: 'AFRICAN',
      era: 'Classical',
      mainHall: {
        name: 'Sacred Grove',
        type: 'public',
        description: 'Open-air shrine in a sacred forest',
        features: ['ancient_trees', 'stone_altar', 'carved_totems', 'sacred_spring'],
        npcs: ['oracle_priest', 'shrine_keeper', 'supplicant']
      },
      privateRooms: [
        {
          name: 'Oracle\'s Hut',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Dwelling of the oracle priest',
          features: ['divination_bones', 'sacred_masks', 'herb_bundles', 'ancestor_shrine'],
          npcs: ['oracle']
        }
      ],
      restrictedRooms: [
        {
          name: 'Spirit Cave',
          type: 'restricted',
          requiredPermission: 'quest',
          description: 'Cave where spirits are consulted',
          features: ['cave_paintings', 'offering_bowls', 'sacred_stones', 'ritual_drums'],
          npcs: ['spirit_medium']
        }
      ]
    },
    Medieval: {
      culturalZone: 'AFRICAN',
      era: 'Medieval',
      mainHall: {
        name: 'Royal Ancestor Shrine',
        type: 'public',
        description: 'Shrine dedicated to royal ancestors',
        features: ['ancestor_stools', 'leopard_skins', 'bronze_plaques', 'ceremonial_weapons'],
        npcs: ['chief_priest', 'royal_guard', 'griots', 'elder']
      },
      privateRooms: [
        {
          name: 'King\'s Ritual Chamber',
          type: 'private',
          requiredPermission: 'nobility',
          description: 'Sacred space for royal rituals',
          features: ['golden_stool', 'royal_regalia', 'ancestral_masks', 'kola_nuts'],
          npcs: ['king', 'royal_diviner']
        },
        {
          name: 'Initiation Lodge',
          type: 'private',
          requiredPermission: 'quest',
          description: 'Secret society initiation space',
          features: ['ritual_masks', 'sacred_medicines', 'initiation_tools', 'teaching_drums'],
          npcs: ['lodge_master']
        }
      ],
      restrictedRooms: [
        {
          name: 'Medicine House',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Storage for sacred medicines and objects',
          features: ['medicine_bundles', 'healing_herbs', 'power_objects', 'protective_charms'],
          npcs: ['medicine_keeper']
        }
      ]
    },
    Modern: {
      culturalZone: 'AFRICAN',
      era: 'Modern',
      mainHall: {
        name: 'Pentecostal Church',
        type: 'public',
        description: 'Vibrant modern church with African elements',
        features: ['colorful_banners', 'drum_set', 'keyboard', 'plastic_chairs'],
        npcs: ['pastor', 'choir_leader', 'congregation']
      },
      privateRooms: [
        {
          name: 'Pastor\'s Office',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Administrative office',
          features: ['desk', 'prayer_corner', 'counseling_area', 'bookshelf'],
          npcs: ['pastor']
        }
      ],
      restrictedRooms: [
        {
          name: 'Prayer Room',
          type: 'restricted',
          requiredPermission: 'quest',
          description: 'Intensive prayer and healing room',
          features: ['prayer_mats', 'anointing_oil', 'prayer_requests', 'testimonies'],
          npcs: ['prayer_warrior']
        }
      ]
    }
  },
  OCEANIC: {
    Classical: {
      culturalZone: 'OCEANIC',
      era: 'Classical',
      mainHall: {
        name: 'Marae',
        type: 'public',
        description: 'Sacred ceremonial ground',
        features: ['stone_platform', 'tiki_statues', 'ceremonial_posts', 'sacred_stones'],
        npcs: ['kahuna', 'chief', 'navigator']
      },
      privateRooms: [
        {
          name: 'Kahuna\'s Hale',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Sacred house of the high priest',
          features: ['sacred_calabashes', 'feather_standards', 'ritual_implements', 'genealogy_chants'],
          npcs: ['high_kahuna']
        }
      ],
      restrictedRooms: [
        {
          name: 'Heiau Inner Court',
          type: 'restricted',
          requiredPermission: 'nobility',
          description: 'Most sacred area of the temple',
          features: ['oracle_tower', 'sacrifice_altar', 'sacred_drums', 'kapu_sticks'],
          npcs: ['temple_guardian']
        }
      ]
    },
    Medieval: {
      culturalZone: 'OCEANIC',
      era: 'Medieval',
      mainHall: {
        name: 'Meeting House',
        type: 'public',
        description: 'Elaborately carved communal house',
        features: ['carved_pillars', 'woven_walls', 'ancestor_figures', 'ceremonial_mats'],
        npcs: ['elder', 'storyteller', 'warrior']
      },
      privateRooms: [
        {
          name: 'Chief\'s Sacred Space',
          type: 'private',
          requiredPermission: 'nobility',
          description: 'Private area for chiefly rituals',
          features: ['war_clubs', 'feather_cloaks', 'kava_bowl', 'sacred_adze'],
          npcs: ['paramount_chief']
        }
      ],
      restrictedRooms: [
        {
          name: 'Tapu Ground',
          type: 'restricted',
          requiredPermission: 'quest',
          description: 'Forbidden sacred ground',
          features: ['burial_ground', 'ancestor_stones', 'mana_objects', 'sacred_grove'],
          npcs: ['guardian_spirit']
        }
      ]
    },
    Modern: {
      culturalZone: 'OCEANIC',
      era: 'Modern',
      mainHall: {
        name: 'Island Church',
        type: 'public',
        description: 'Christian church with Pacific elements',
        features: ['tapa_cloth_banners', 'wooden_cross', 'woven_mats', 'ceiling_fans'],
        npcs: ['minister', 'deacon', 'choir']
      },
      privateRooms: [
        {
          name: 'Minister\'s Study',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Office for church administration',
          features: ['desk', 'island_artifacts', 'bible_translations', 'community_photos'],
          npcs: ['minister']
        }
      ],
      restrictedRooms: [
        {
          name: 'Youth Center',
          type: 'restricted',
          requiredPermission: 'quest',
          description: 'Community space for youth programs',
          features: ['musical_instruments', 'sports_equipment', 'computers', 'traditional_crafts'],
          npcs: ['youth_leader']
        }
      ]
    }
  },
  INDIGENOUS_AMERICAN: {
    Classical: {
      culturalZone: 'INDIGENOUS_AMERICAN',
      era: 'Classical',
      mainHall: {
        name: 'Temple Pyramid',
        type: 'public',
        description: 'Stepped pyramid temple with ceremonial plaza',
        features: ['stone_altar', 'obsidian_mirrors', 'jade_masks', 'feathered_serpent_carving'],
        npcs: ['priest_king', 'astronomer_priest', 'noble']
      },
      privateRooms: [
        {
          name: 'Priest-King\'s Chamber',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Royal chamber atop the pyramid',
          features: ['jade_throne', 'quetzal_feathers', 'codex_library', 'bloodletting_tools'],
          npcs: ['priest_king']
        },
        {
          name: 'Calendar Chamber',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Room for astronomical calculations',
          features: ['stone_calendar', 'observation_slits', 'calculation_stones', 'star_charts'],
          npcs: ['astronomer']
        }
      ],
      restrictedRooms: [
        {
          name: 'Underworld Portal',
          type: 'restricted',
          requiredPermission: 'quest',
          description: 'Sacred cenote or cave entrance',
          features: ['sacrificial_pool', 'jade_offerings', 'skull_racks', 'copal_incense'],
          npcs: ['underworld_priest']
        }
      ]
    },
    Medieval: {
      culturalZone: 'INDIGENOUS_AMERICAN',
      era: 'Medieval',
      mainHall: {
        name: 'Great Kiva',
        type: 'public',
        description: 'Circular ceremonial chamber',
        features: ['sipapu_hole', 'fire_pit', 'bench_seating', 'roof_entrance'],
        npcs: ['pueblo_elder', 'kachina_dancer', 'clan_mother']
      },
      privateRooms: [
        {
          name: 'Shaman\'s Lodge',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Private space for the spiritual leader',
          features: ['medicine_bundle', 'spirit_masks', 'herb_storage', 'vision_quest_items'],
          npcs: ['shaman']
        },
        {
          name: 'Sacred Bundle Room',
          type: 'private',
          requiredPermission: 'high_clergy',
          description: 'Storage for the tribe\'s most sacred objects',
          features: ['sacred_bundles', 'ancestral_items', 'ceremonial_weapons']
        },
        {
          name: 'Clan Mother\'s Chamber',
          type: 'private',
          requiredPermission: 'nobility',
          description: 'Matriarchal leader\'s sacred space',
          features: ['corn_mother_figure', 'seed_storage', 'weaving_loom', 'pottery'],
          npcs: ['clan_mother']
        }
      ],
      restrictedRooms: [
        {
          name: 'Vision Quest Chamber',
          type: 'restricted',
          requiredPermission: 'quest',
          description: 'Sacred space for spiritual journeys',
          features: ['sweat_lodge_stones', 'sacred_herbs', 'dream_catchers'],
          npcs: ['spirit_guide']
        },
        {
          name: 'Ancestors\' Shrine',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Memorial space for tribal ancestors',
          features: ['ancestor_masks', 'offering_bowls', 'memorial_totems'],
          npcs: ['keeper_of_memories']
        }
      ]
    },
    'Early Modern': {
      culturalZone: 'INDIGENOUS_AMERICAN',
      era: 'Early Modern',
      mainHall: {
        name: 'Mission Church',
        type: 'public',
        description: 'Spanish colonial mission with indigenous elements',
        features: ['adobe_walls', 'wooden_cross', 'native_paintings', 'bell_tower'],
        npcs: ['franciscan_friar', 'neophyte', 'mission_indian']
      },
      privateRooms: [
        {
          name: 'Friar\'s Cell',
          type: 'private',
          requiredPermission: 'clergy',
          description: 'Simple quarters for the missionary',
          features: ['wooden_cross', 'bible', 'writing_desk', 'narrow_bed'],
          npcs: ['friar']
        },
        {
          name: 'Hidden Ceremony Room',
          type: 'private',
          requiredPermission: 'quest',
          description: 'Secret space for traditional practices',
          features: ['hidden_masks', 'sacred_herbs', 'traditional_drums', 'prayer_sticks'],
          npcs: ['secret_keeper']
        }
      ],
      restrictedRooms: [
        {
          name: 'Sacristy',
          type: 'restricted',
          requiredPermission: 'clergy',
          description: 'Storage for mission valuables',
          features: ['silver_chalices', 'vestments', 'mission_records', 'baptismal_font'],
          npcs: ['sacristan']
        }
      ]
    },
    Modern: {
      culturalZone: 'INDIGENOUS_AMERICAN',
      era: 'Modern',
      mainHall: {
        name: 'Native American Church',
        type: 'public',
        description: 'Modern ceremonial space blending traditions',
        features: ['tipi_structure', 'altar_crescent', 'prayer_fans', 'cedar_smoke'],
        npcs: ['roadman', 'cedar_chief', 'fire_keeper']
      },
      privateRooms: [
        {
          name: 'Elder\'s Council Room',
          type: 'private',
          requiredPermission: 'nobility',
          description: 'Meeting space for tribal leadership',
          features: ['council_table', 'tribal_flag', 'historical_photos', 'treaty_documents'],
          npcs: ['tribal_elder']
        },
        {
          name: 'Cultural Center',
          type: 'private',
          requiredPermission: 'quest',
          description: 'Space for preserving traditions',
          features: ['language_materials', 'traditional_crafts', 'audio_recordings', 'regalia_storage'],
          npcs: ['cultural_teacher']
        }
      ],
      restrictedRooms: [
        {
          name: 'Sacred Objects Repository',
          type: 'restricted',
          requiredPermission: 'high_clergy',
          description: 'Storage for repatriated sacred items',
          features: ['climate_control', 'sacred_bundles', 'ancestor_remains', 'ceremonial_objects'],
          npcs: ['keeper']
        }
      ]
    }
  }
};

/**
 * Get the appropriate holy place layout for a given culture and era
 */
export function getHolyPlaceLayout(
  culturalZone: CulturalZone, 
  era: HistoricalEra
): HolyPlaceLayout | null {
  const zoneLayouts = HOLY_PLACE_LAYOUTS[culturalZone];
  if (!zoneLayouts) {
    // Fallback to European Medieval if culture not found
    return HOLY_PLACE_LAYOUTS.EUROPEAN?.Medieval || null;
  }
  
  const layout = zoneLayouts[era];
  if (!layout) {
    // Try to find closest era
    const eras = Object.keys(zoneLayouts) as HistoricalEra[];
    if (eras.length > 0) {
      return zoneLayouts[eras[0]] || null;
    }
  }
  
  return layout || null;
}

/**
 * Check if a character has permission to enter a room
 */
export function hasRoomPermission(
  room: HolyPlaceRoom,
  characterRole?: string,
  hasQuest?: boolean,
  reputation?: number
): boolean {
  // Public rooms are always accessible
  if (room.type === 'public') return true;
  
  // Check specific permission requirements
  if (room.requiredPermission) {
    switch (room.requiredPermission) {
      case 'clergy':
        return characterRole?.toLowerCase().includes('priest') ||
               characterRole?.toLowerCase().includes('monk') ||
               characterRole?.toLowerCase().includes('imam') ||
               characterRole?.toLowerCase().includes('shaman') ||
               characterRole?.toLowerCase().includes('clergy');
               
      case 'high_clergy':
        return characterRole?.toLowerCase().includes('bishop') ||
               characterRole?.toLowerCase().includes('abbot') ||
               characterRole?.toLowerCase().includes('high priest') ||
               characterRole?.toLowerCase().includes('head priest');
               
      case 'nobility':
        return characterRole?.toLowerCase().includes('noble') ||
               characterRole?.toLowerCase().includes('lord') ||
               characterRole?.toLowerCase().includes('duke') ||
               (reputation && reputation > 75);
               
      case 'quest':
        return hasQuest === true;
        
      default:
        return false;
    }
  }
  
  // Default to restricted for non-public rooms
  return false;
}

/**
 * Generate a description for attempting to enter a restricted room
 */
export function getAccessDeniedMessage(room: HolyPlaceRoom): string {
  const messages: Record<string, string[]> = {
    clergy: [
      'A stern priest blocks your path. "This area is reserved for the clergy."',
      'You are politely but firmly turned away. "Only those ordained may enter."',
      '"I\'m sorry, but this chamber is not open to lay visitors."'
    ],
    high_clergy: [
      'Guards bar your entry. "The Bishop\'s chambers are strictly private."',
      '"None may disturb the Abbot without his express permission."',
      'The ornate door is locked, and none will open it for you.'
    ],
    nobility: [
      '"This area is reserved for those of noble birth or exceptional standing."',
      'Your common clothes mark you as unworthy to enter this space.',
      '"Perhaps when you\'ve earned greater renown, you may enter."'
    ],
    quest: [
      'You sense this place holds secrets, but you lack the knowledge to proceed.',
      'Something tells you that you\'re not yet ready to enter this chamber.',
      'Perhaps someone in the temple could tell you more about this restricted area.'
    ]
  };
  
  const messageList = messages[room.requiredPermission || 'clergy'] || messages.clergy;
  return messageList[Math.floor(Math.random() * messageList.length)];
}