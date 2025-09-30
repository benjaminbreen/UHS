import { EquipmentSlot } from '../../types';

type ItemBaseId = string;
type AnimalBaseId = string;

/**
 * STARTING_PACKAGES
 * ---------------------------------------------------------------------------
 * A comprehensive and historically-grounded set of starting packages for all
 * professions. Each package is tailored to the profession's cultural zone,
 * historical era, and social standing, utilizing a wide range of items for
 * maximum immersion.
 */
export const STARTING_PACKAGES: Record<string, { 
    equipment: Partial<Record<EquipmentSlot, ItemBaseId>>, 
    inventory: ItemBaseId[],
    companions?: AnimalBaseId[]
}> = {

    // =======================================================================
    // == SUB-SAHARAN AFRICAN PROFESSIONS
    // =======================================================================
    // Everyday professions (majority of population)
    'Millet Farmer': { equipment: { torso: 'WRAPPER', head: 'STRAW_HAT', feet: 'SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['MILLET', 'GOURD_FLASK'], companions: [] },
    'Yam Cultivator': { equipment: { torso: 'WRAPPER', head: 'STRAW_HAT', feet: 'SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['YAM', 'DIGGING_STICK'], companions: [] },
    'Village Potter': { equipment: { torso: 'WRAPPER', head: 'HEAD_WRAP', feet: 'SANDALS', belt: 'LEATHER_BAG' }, inventory: ['CLAY_LUMP', 'WOODEN_BOWL', 'LEATHER_APRON'], companions: [] }, // 80% female (apron worn over wrapper)
    'Mat Weaver': { equipment: { torso: 'WRAPPER', head: 'HEAD_WRAP', feet: 'SANDALS' }, inventory: ['REED_BUNDLE', 'KNIFE'], companions: [] }, // 95% female
    'Compound Builder': { equipment: { torso: 'DASHIKI', head: 'CLOTH_CAP', feet: 'SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['MUD_BRICK', 'ROPE', 'LEATHER_APRON'], companions: [] }, // 100% male
    'Water Carrier': { equipment: { torso: 'WRAPPER', head: 'HEAD_WRAP', feet: 'SANDALS' }, inventory: ['GOURD_FLASK', 'CLAY_POT'], companions: [] }, // 70% female
    'Firewood Gatherer': { equipment: { torso: 'WRAPPER', head: 'HEAD_WRAP', feet: 'SANDALS' }, inventory: ['STICK', 'ROPE'], companions: [] }, // 90% female
    'Market Woman': { equipment: { torso: 'WRAPPER', head: 'HEAD_WRAP', feet: 'SANDALS', belt: 'PURSE' }, inventory: ['BASKET', 'VEGETABLES', 'FRUIT'], companions: [] }, // 100% female
    
    // Special/elite professions
    'Griot': { equipment: { head: 'KUFI_CAP', torso: 'BOUBOU', feet: 'DECORATED_SANDALS', main_hand: '*CONTEXTUAL*', cloak: 'WOOL_CLOAK' }, inventory: ['KOLA_NUT', 'DRUM'], companions: [] },
    'Ironsmith': { equipment: { torso: 'DASHIKI', head: 'LEATHER_CAP', feet: 'LEATHER_BOOTS', belt: 'LEATHER_BAG', main_hand: '*CONTEXTUAL*' }, inventory: ['IRON_ORE', 'HAMMER', 'BELLOWS', 'LEATHER_APRON'], companions: [] },
    'Gold Trader': { equipment: { torso: 'GRAND_BOUBOU', head: 'TURBAN', feet: 'LEATHER_BOOTS', belt: 'PURSE', cloak: 'SILK_CLOAK' }, inventory: ['GOLD_DUST', 'SCALE', 'SALT'], companions: ['CAMEL'] },
    'Mask Carver': { equipment: { torso: 'DASHIKI', head: 'KUFI_CAP', feet: 'SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['WOOD', 'KNIFE', 'OCHRE_LUMP', 'LEATHER_APRON'], companions: [] },
    'Kola Merchant': { equipment: { torso: 'BOUBOU', head: 'KUFI_CAP', feet: 'LEATHER_SANDALS', belt: 'PURSE', cloak: 'DESERT_CLOAK' }, inventory: ['KOLA_NUT', 'KOLA_NUT', 'GOURD_FLASK'], companions: ['DONKEY'] },
    'Palm Wine Tapper': { equipment: { torso: 'WRAPPER', head: 'STRAW_HAT', feet: 'SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['GOURD_FLASK', 'ROPE', 'KNIFE'], companions: [] },
    'Dhow Captain': { equipment: { torso: 'BOUBOU', head: 'TURBAN', legs: 'SAILOR_PANTS', feet: 'LEATHER_BOOTS', cloak: 'WOOL_CLOAK' }, inventory: ['ROPE', 'COMPASS', 'DATES'], companions: [] },
    'Ivory Trader': { equipment: { torso: 'AGBADA', head: 'KUFI_CAP', feet: 'LEATHER_BOOTS', belt: 'PURSE', cloak: 'NOBLE_CLOAK' }, inventory: ['IVORY', 'SCALE', 'COIN'], companions: [] },
    'Tribal Hunter': { equipment: { torso: 'WRAPPER', head: 'LEATHER_CAP', feet: 'LEATHER_BOOTS', cloak: 'FUR_CLOAK', main_hand: 'SIMPLE_BOW', off_hand: 'ARROW' }, inventory: ['ARROW', 'ARROW', 'BOLAS', 'MEAT', 'ROPE'], companions: ['DOG'] }, // 95% male
    'Slinger': { equipment: { torso: 'WRAPPER', feet: 'SANDALS', main_hand: 'SLING', off_hand: 'SLING_STONE' }, inventory: ['SLING_STONE', 'SLING_STONE', 'SLING_STONE', 'LEATHER_POUCH'], companions: [] }, // 90% male
    
    // =======================================================================
    // == EAST ASIAN PROFESSIONS - JAPAN
    // =======================================================================
    // Everyday professions (vast majority)
    'Rice Farmer': { equipment: { head: 'STRAW_HAT', torso: 'KOSODE', feet: 'STRAW_SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['RICE', 'RICE', 'WOODEN_BOWL'], companions: [] }, // 70% male
    'Village Carpenter': { equipment: { torso: 'KOSODE', head: 'CLOTH_CAP', feet: 'LEATHER_BOOTS', belt: 'LEATHER_BAG', main_hand: '*CONTEXTUAL*' }, inventory: ['HAMMER', 'NAILS', 'WOOD', 'LEATHER_APRON'], companions: [] }, // 100% male
    'Miso Maker': { equipment: { torso: 'KOSODE', head: 'CLOTH_CAP', feet: 'STRAW_SANDALS', belt: 'CLOTH_SASH' }, inventory: ['MISO', 'SALT', 'WOODEN_BOWL', 'LEATHER_APRON'], companions: [] }, // 80% female
    'Tatami Weaver': { equipment: { torso: 'KOSODE', head: 'CLOTH_CAP', feet: 'STRAW_SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['REED_BUNDLE', 'ROPE', 'KNIFE'], companions: [] }, // 85% male
    'Fisherman': { equipment: { torso: 'KOSODE', head: 'STRAW_HAT', feet: 'SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['FISH_MEAT', 'ROPE', 'NET', 'STRAW_MAT', 'FLINT_AND_STEEL', 'WATERSKIN'], companions: [] }, // 95% male
    'Tofu Maker': { equipment: { torso: 'KOSODE', head: 'CLOTH_CAP', feet: 'STRAW_SANDALS' }, inventory: ['TOFU', 'SALT', 'WOODEN_BOWL', 'LEATHER_APRON'], companions: [] }, // 60% female
    'Charcoal Burner': { equipment: { torso: 'KOSODE', head: 'CLOTH_CAP', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['COAL', 'STICK', 'FLINT_STONE', 'LEAN_TO', 'TRAVEL_BLANKET', 'LEATHER_APRON'], companions: [] }, // 100% male
    'Silk Reeler': { equipment: { torso: 'KOSODE', head: 'HEAD_WRAP', feet: 'STRAW_SANDALS', belt: 'CLOTH_SASH' }, inventory: ['SILK_CLOTH', 'SPINDLE'], companions: [] }, // 95% female
    'Wet Nurse': { equipment: { torso: 'KOSODE', head: 'HEAD_WRAP', feet: 'SANDALS' }, inventory: ['MILK_BOTTLE', 'CLOTH', 'RICE'], companions: [] }, // 100% female
    
    // Special professions
    'Samurai': { equipment: { head: 'LEATHER_CAP', torso: 'LACQUERED_ARMOR', cloak: 'SAMURAI_SURCOAT', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['RICE_BALL', 'SAKE', 'WHETSTONE'], companions: ['HORSE'] }, // 100% male
    'Ronin': { equipment: { torso: 'KOSODE', feet: 'STRAW_SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['RICE_BALL', 'SAKE'], companions: [] }, // 100% male
    'Tea Master': { equipment: { torso: 'KIMONO' }, inventory: ['TEA', 'WOODEN_BOWL', 'INCENSE'], companions: [] },
    'Sake Brewer': { equipment: { torso: 'KOSODE', main_hand: '*CONTEXTUAL*' }, inventory: ['SAKE', 'RICE', 'BUCKET', 'LEATHER_APRON'], companions: [] },
    'Geisha': { equipment: { torso: 'KIMONO', feet: 'DECORATED_SANDALS' }, inventory: ['FAN', 'INCENSE', 'SAKE'], companions: [] }, // 100% female
    'Ninja': { equipment: { torso: 'KOSODE', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*', cloak: 'WOOL_CLOAK' }, inventory: ['ROPE', 'SMOKE_BOMB', 'KNIFE'], companions: [] }, // 100% male (dark clothing)
    'Sword Polisher': { equipment: { torso: 'KOSODE', main_hand: '*CONTEXTUAL*' }, inventory: ['WHETSTONE', 'OIL', 'CLOTH', 'LEATHER_APRON'], companions: [] },
    
    // =======================================================================
    // == EAST ASIAN PROFESSIONS - CHINA
    // =======================================================================
    // Everyday professions
    'Paddy Worker': { equipment: { head: 'STRAW_HAT', torso: 'CHANGSHAN', feet: 'STRAW_SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['RICE', 'VEGETABLES'], companions: [] }, // 60% male
    'Noodle Maker': { equipment: { torso: 'CHANGSHAN', head: 'CLOTH_CAP', feet: 'SANDALS', belt: 'CLOTH_SASH' }, inventory: ['FLOUR', 'SALT', 'WOODEN_BOWL', 'LEATHER_APRON'], companions: [] }, // 70% male
    'Bamboo Cutter': { equipment: { torso: 'CHANGSHAN', head: 'STRAW_HAT', feet: 'SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['BAMBOO', 'KNIFE', 'ROPE'], companions: [] }, // 100% male
    'Tea Picker': { equipment: { head: 'STRAW_HAT', torso: 'QIPAO', feet: 'SANDALS' }, inventory: ['TEA', 'BASKET'], companions: [] }, // 80% female
    'Night Soil Collector': { equipment: { torso: 'CHANGSHAN', head: 'CLOTH_CAP', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BUCKET', 'ROPE'], companions: [] }, // 100% male
    'Matchmaker': { equipment: { torso: 'QIPAO', head: 'SILK_CAP', feet: 'SILK_SLIPPERS', belt: 'SILK_SASH', cloak: 'SILK_CLOAK' }, inventory: ['SCROLL', 'INCENSE', 'COIN'], companions: [] }, // 90% female
    'Paper Maker': { equipment: { torso: 'CHANGSHAN', head: 'CLOTH_CAP', feet: 'SANDALS', belt: 'LEATHER_BAG', main_hand: '*CONTEXTUAL*' }, inventory: ['PAPER', 'BAMBOO', 'WATER', 'LEATHER_APRON'], companions: [] }, // 85% male

    // Special professions
    'Silk Merchant': { equipment: { torso: 'CHANGSHAN', head: 'SILK_CAP', feet: 'SILK_SLIPPERS', belt: 'PURSE', cloak: 'SILK_CLOAK' }, inventory: ['SILK_CLOTH', 'SCALE', 'COIN'], companions: [] },
    'Porcelain Maker': { equipment: { torso: 'CHANGSHAN', head: 'CLOTH_CAP', feet: 'SANDALS', belt: 'LEATHER_BAG' }, inventory: ['CLAY_LUMP', 'GLAZE', 'KILN_TOOLS', 'LEATHER_APRON'], companions: [] },
    'Scholar-Official': { equipment: { torso: 'CHANGSHAN', head: 'SCHOLAR_CAP', feet: 'SILK_SLIPPERS', belt: 'SILK_SASH', cloak: 'SILK_CLOAK' }, inventory: ['BOOK', 'QUILL', 'INK_POT'], companions: [] },
    'Eunuch': { equipment: { torso: 'CHANGSHAN', head: 'SILK_CAP', feet: 'SILK_SLIPPERS', cloak: 'SILK_CLOAK' }, inventory: ['SCROLL', 'SEAL', 'COIN'], companions: [] }, // 100% male (castrated)
    'Acupuncturist': { equipment: { torso: 'CHANGSHAN' }, inventory: ['NEEDLES', 'HERB_BUNDLE', 'SCROLL'], companions: [] },
    'Calligrapher': { equipment: { torso: 'CHANGSHAN', head: 'SCHOLAR_CAP' }, inventory: ['QUILL', 'INK_POT', 'PAPER'], companions: [] },
    
    // =======================================================================
    // == FALLBACK & GENERIC ROLES (Using procedural weapon selection)
    // =======================================================================
    'Wanderer': { equipment: { head: 'STRAW_HAT', torso: 'WOOL_TUNIC',  feet: 'LEATHER_BOOTS', cloak: 'WOOL_CLOAK', belt: 'LEATHER_BAG', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'GOURD_FLASK', 'MAP', 'BEDROLL', 'TRAVEL_BLANKET', 'FLINT_AND_STEEL', 'WATERSKIN'],  companions: ['DOG'] },
    'Artisan': { equipment: { head: 'CLOTH_CAP', torso: 'SIMPLE_TUNIC', legs: 'WORKER_TROUSERS', feet: 'LEATHER_BOOTS', belt: 'LEATHER_BAG', main_hand: '*CONTEXTUAL*' }, inventory: ['HAMMER', 'KNIFE', 'ROPE', 'LEATHER_APRON'] },
    'Commoner': { equipment: { torso: 'SIMPLE_TUNIC', cloak: 'WOOL_CLOAK', feet: 'SANDALS' }, inventory: ['BREAD', 'WOODEN_BOWL'] },
    'Laborer': { equipment: { head: 'CLOTH_CAP', torso: 'SIMPLE_TUNIC', feet: 'LEATHER_BOOTS', belt: 'ROPE', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'ROPE'] },
    'Peasant': { equipment: { head: 'STRAW_HAT', torso: 'PEASANT_TUNIC', feet: 'SANDALS', belt: 'ROPE', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD_CRUST', 'VEGETABLES'] },
    'Warrior': { equipment: { head: 'LEATHER_CAP', torso: 'LEATHER_VEST', cloak: 'MILITARY_CLOAK', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*', necklace: 'BRONZE_TORC' }, inventory: ['MEAT', 'WHETSTONE'],  companions: ['DOG'] },
    'Caretaker': { equipment: { torso: 'SIMPLE_ROBE', main_hand: '*CONTEXTUAL*' }, inventory: ['HERB_BUNDLE', 'BREAD', 'BANDAGE'] },
    'Mother': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['BREAD', 'SIMPLE_RING', 'FRUIT'] },

    // =======================================================================
    // == HERDERS & ANIMAL-RELATED (Using procedural weapon selection)
    // =======================================================================
    'Shepherd': { equipment: { main_hand: 'SLING', off_hand: 'SLING_STONE', cloak: 'WOOL_CLOAK', feet: 'SANDALS', belt: 'LEATHER_BAG', necklace: 'IRON_TORC' }, inventory: ['SLING_STONE', 'SLING_STONE', 'BREAD', 'FLUTE', 'LEAN_TO', 'TRAVEL_BLANKET', 'FLINT_AND_STEEL'], companions: ['SHEEP', 'DOG'] },
    'Farmer': { equipment: { head: 'STRAW_HAT', cloak: 'WOOL_CLOAK', main_hand: '*CONTEXTUAL*', torso: 'SIMPLE_TUNIC', feet: 'LEATHER_BOOTS', belt: 'LEATHER_BAG' }, inventory: ['BARLEY', 'WHEAT', 'GRAIN_FLAIL', 'LEATHER_APRON'], companions: ['COW'] },
    'Goat Herder': { equipment: { main_hand: 'SLING', off_hand: 'SLING_STONE', cloak: 'FUR_CLOAK', feet: 'SANDALS', belt: 'LEATHER_BAG' }, inventory: ['SLING_STONE', 'SLING_STONE', 'CHEESE', 'STRAW_MAT', 'TRAVEL_BLANKET'], companions: ['GOAT', 'GOAT', 'GOAT'] },
    'Cattle Herder': { equipment: { main_hand: '*CONTEXTUAL*', cloak: 'WOOL_CLOAK', feet: 'SANDALS', belt: 'LEATHER_BAG' }, inventory: ['ROPE', 'BREAD'], companions: ['COW', 'COW'] },
    'Camel Herder': { equipment: { main_hand: '*CONTEXTUAL*', cloak: 'DESERT_CLOAK', head: 'KEFFIYEH', feet: 'SANDALS', belt: 'LEATHER_BAG' }, inventory: ['DATES', 'GOURD_FLASK', 'HIDE_TENT', 'BEDROLL'], companions: ['CAMEL', 'CAMEL'] },
    'Duck Herder': { equipment: { main_hand: '*CONTEXTUAL*', torso: 'WOOL_TUNIC', feet: 'SANDALS' }, inventory: ['BREAD'], companions: ['DUCK', 'DUCK', 'DUCK'] },
    'Llama Herder': { equipment: { head: 'CHULLO_HAT', cloak: 'ALPACA_CLOAK', main_hand: '*CONTEXTUAL*', feet: 'SANDALS' }, inventory: ['POTATO', 'ROPE'], companions: ['LLAMA', 'LLAMA'] },
    'Ranchero': { equipment: { head: 'WIDE_BRIM_HAT', torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS', belt: 'LEATHER_BAG', main_hand: '*CONTEXTUAL*' }, inventory: ['SALT_PORK', 'GOURD_FLASK'], companions: ['COW', 'HORSE'] },
    'Horse Trainer': { equipment: { torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS', belt: 'LEATHER_BAG', main_hand: '*CONTEXTUAL*' }, inventory: ['ROPE', 'FRUIT', 'LEATHER_APRON'], companions: ['HORSE', 'HORSE'] },
    
    // =======================================================================
    // == EUROPEAN
    // =======================================================================

    // --- PREHISTORY (Using procedural weapon selection) ---
    'Hunter': { equipment: { torso: 'DEER_HIDE', cloak: 'FUR_CLOAK', feet: 'HIDE_BOOTS', belt: 'LEATHER_BAG', main_hand: 'HUNTING_BOW', off_hand: 'ARROW', necklace: 'BRONZE_TORC' }, inventory: ['ARROW', 'ARROW', 'ARROW', 'FLINT_STONE', 'MEAT', 'VINE'], companions: ['DOG'] },
    'Gatherer': { equipment: { torso: 'DEER_HIDE', head: 'CLOTH_HOOD', cloak: 'FUR_CLOAK', legs: 'SIMPLE_HOSE', feet: 'HIDE_BOOTS', belt: 'LEATHER_BAG', necklace: 'SHELL_NECKLACE', main_hand: '*CONTEXTUAL*' }, inventory: ['WILD_BERRIES', 'MUSHROOM', 'ROOT'] },
    'Shaman': { equipment: { head: 'WOLF_PELT', cloak: 'FUR_CLOAK', torso: 'DEER_HIDE', legs: 'HIDE_LOINCLOTH', feet: 'HIDE_BOOTS', cloak: 'FUR_CLOAK', belt: 'LEATHER_BAG', necklace: 'BONE_NECKLACE', main_hand: '*CONTEXTUAL*' }, inventory: ['HERB_BUNDLE', 'SMOOTH_STONE', 'BONES', 'OWL_FEATHER'] },
    'Toolmaker': { equipment: { torso: 'DEER_HIDE', head: 'LEATHER_CAP', feet: 'HIDE_BOOTS', belt: 'LEATHER_BAG', necklace: 'BONE_NECKLACE', main_hand: '*CONTEXTUAL*' }, inventory: ['FLINT_STONE', 'STICK', 'VINE', 'HAMMER', 'LEATHER_APRON'] },
    'Healer': { equipment: { torso: 'DEER_HIDE', head: 'CLOTH_HOOD', legs: 'SIMPLE_HOSE', feet: 'HIDE_BOOTS', cloak: 'FUR_CLOAK', belt: 'LEATHER_BAG', necklace: 'SHELL_NECKLACE', main_hand: '*CONTEXTUAL*' }, inventory: ['MEDICINAL_HERBS', 'HERB_BUNDLE', 'SMOOTH_STONE'] },
    'Cave Painter': { equipment: { torso: 'DEER_HIDE', head: 'FEATHER_CROWN', cloak: 'FUR_CLOAK', feet: 'HIDE_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['OCHRE_LUMP', 'COAL', 'CLAY_LUMP'] },
    'Fire Keeper': { equipment: { torso: 'DEER_HIDE', cloak: 'FUR_CLOAK', feet: 'HIDE_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['STICK', 'DRY_LEAVES', 'FLINT_STONE'] },
    'Skin Dresser': { equipment: { torso: 'DEER_HIDE', feet: 'HIDE_BOOTS', belt: 'LEATHER_BAG', main_hand: '*CONTEXTUAL*' }, inventory: ['DEER_HIDE', 'FLINT_STONE', 'KNIFE', 'LEATHER_APRON'] },
    'Fisher': { equipment: { torso: 'SIMPLE_TUNIC', head: 'STRAW_HAT', legs: 'WORKER_TROUSERS', feet: 'SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['FISH_MEAT', 'VINE', 'EARTHWORM'] },
    'Bone Carver': { equipment: { torso: 'DEER_HIDE', feet: 'HIDE_BOOTS', belt: 'LEATHER_BAG', main_hand: '*CONTEXTUAL*' }, inventory: ['BONES', 'FLINT_STONE', 'KNIFE', 'LEATHER_APRON'] },

    // --- HEALING PROFESSIONS (All Zones/Eras) ---
    // Sub-Saharan African Healers
    'Mganga': { equipment: { torso: 'BOUBOU', head: 'KUFI_CAP', feet: 'SANDALS', belt: 'LEATHER_BAG', cloak: 'WOOL_CLOAK', necklace: 'AMULET' }, inventory: ['HEALERS_KIT', 'MEDICINAL_HERBS', 'MORTAR_PESTLE', 'HEALING_SALVE', 'HERB_BUNDLE'], companions: [] },
    'Snake Doctor': { equipment: { torso: 'WRAPPER', cloak: 'FUR_CLOAK', head: 'FEATHER_CROWN', feet: 'LEATHER_BOOTS', belt: 'LEATHER_BAG', cloak: 'WOOL_CLOAK', necklace: 'BRONZE_TORC' }, inventory: ['ANTIDOTE_VIAL', 'TOURNIQUET', 'KNIFE', 'HEALING_SALVE', 'BANDAGE'], companions: [] },
    'Birth Attendant': { equipment: { torso: 'WRAPPER', head: 'HEAD_WRAP', feet: 'SANDALS', belt: 'CLOTH_SASH' }, inventory: ['HEALERS_KIT', 'STERILE_GAUZE', 'SOAP_BAR', 'CLOTH', 'HONEY_JAR'], companions: [] },
    'Bone Setter': { equipment: { torso: 'DASHIKI', head: 'CLOTH_CAP', feet: 'LEATHER_BOOTS', belt: 'LEATHER_BAG' }, inventory: ['SPLINT_WOOD', 'BANDAGE', 'HEALING_SALVE', 'ROPE', 'PAIN_POWDER', 'LEATHER_APRON'], companions: [] },

    // MENA Healers
    'Tabib': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN',  feet: 'BABOUCHE', belt: 'SILK_SASH', cloak: 'WOOL_CLOAK', necklace: 'SILVER_TORC' }, inventory: ['HEALERS_KIT', 'SURGICAL_TOOLS', 'MEDICINAL_HERBS', 'ALCOHOL_FLASK', 'MEDICAL_JOURNAL'], companions: [] },
    'Jarrah': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN', belt: 'LEATHER_BAG' }, inventory: ['BONE_SAW', 'CAUTERY_IRON', 'BANDAGE', 'PAIN_POWDER', 'ALCOHOL_FLASK', 'LEATHER_APRON'], companions: [] },
    'Attar': { equipment: { torso: 'SIMPLE_ROBE', head: 'KUFI_CAP', belt: 'LEATHER_BAG' }, inventory: ['MORTAR_PESTLE', 'FRANKINCENSE', 'MYRRH_RESIN', 'HEALING_SALVE', 'TINCTURE_BOTTLE'], companions: [] },
    'Kahhal': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN', belt: 'LEATHER_BAG' }, inventory: ['SURGICAL_TOOLS', 'ALCOHOL_FLASK', 'STERILE_GAUZE', 'HEALING_SALVE'], companions: [] },

    // East Asian Healers
    'Kampo Practitioner': { equipment: { torso: 'KIMONO', head: 'CLOTH_CAP', belt: 'CLOTH_SASH' }, inventory: ['HEALERS_KIT', 'GINSENG_ROOT', 'MEDICINAL_HERBS', 'MORTAR_PESTLE', 'PULSE_CHART'], companions: [] },
    'Moxibustion Specialist': { equipment: { torso: 'KOSODE', head: 'CLOTH_CAP', belt: 'CLOTH_SASH' }, inventory: ['MOXIBUSTION_STICKS', 'ACUPUNCTURE_NEEDLES', 'HEALING_SALVE', 'PULSE_CHART'], companions: [] },
    'Pulse Diagnostician': { equipment: { torso: 'KIMONO', head: 'SCHOLAR_CAP', belt: 'SILK_SASH' }, inventory: ['PULSE_CHART', 'MEDICAL_JOURNAL', 'MEDICINAL_HERBS', 'TINCTURE_BOTTLE'], companions: [] },
    'Bone Reader': { equipment: { torso: 'KOSODE', head: 'CLOTH_CAP', belt: 'CLOTH_SASH' }, inventory: ['BONES', 'INCENSE', 'MEDICINAL_HERBS', 'HEALING_SALVE'], companions: [] },

    // South Asian Healers
    'Vaidya': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN', legs: 'DHOTI', feet: 'JUTTI', belt: 'CLOTH_SASH', cloak: 'WOOL_CLOAK', necklace: 'RUDRAKSHA_BEADS' }, inventory: ['HEALERS_KIT', 'TURMERIC_ROOT', 'NEEM_LEAVES', 'MORTAR_PESTLE', 'MEDICAL_JOURNAL'], companions: [] },
    'Hakim': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN', belt: 'LEATHER_BAG', cloak: 'WOOL_CLOAK' }, inventory: ['HEALERS_KIT', 'MEDICINAL_HERBS', 'PULSE_CHART', 'TINCTURE_BOTTLE', 'MEDICAL_JOURNAL'], companions: [] },
    'Dai': { equipment: { torso: 'SARI', head: 'HEAD_WRAP', belt: 'CLOTH_SASH' }, inventory: ['HEALERS_KIT', 'STERILE_GAUZE', 'SOAP_BAR', 'TURMERIC_ROOT', 'HONEY_JAR'], companions: [] },
    'Jadi Booti Wala': { equipment: { torso: 'SIMPLE_TUNIC', head: 'TURBAN', legs: 'DHOTI', belt: 'LEATHER_BAG' }, inventory: ['MEDICINAL_HERBS', 'NEEM_LEAVES', 'TURMERIC_ROOT', 'MORTAR_PESTLE', 'HERB_BUNDLE'], companions: [] },
    'Nadi Vaidya': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN', belt: 'CLOTH_SASH' }, inventory: ['PULSE_CHART', 'MEDICAL_JOURNAL', 'MEDICINAL_HERBS', 'TINCTURE_BOTTLE'], companions: [] },

    // Oceania Healers
    'Tohunga': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['HEALERS_KIT', 'MEDICINAL_HERBS', 'PRAYER_BEADS', 'HEALING_SALVE', 'HERB_BUNDLE'], companions: [] },
    'Taulasea': { equipment: { torso: 'SIMPLE_TUNIC' }, inventory: ['MEDICINAL_HERBS', 'EUCALYPTUS_OIL', 'HEALING_SALVE', 'MORTAR_PESTLE'], companions: [] },
    'Clever Woman': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['HEALERS_KIT', 'MEDICINAL_HERBS', 'HEALING_SALVE', 'HERB_BUNDLE', 'HONEY_JAR'], companions: [] },
    'Bone Singer': { equipment: { torso: 'SIMPLE_TUNIC' }, inventory: ['SPLINT_WOOD', 'BANDAGE', 'HEALING_SALVE', 'MEDICINAL_HERBS'], companions: [] },
    'Bush Medicine Woman': { equipment: { torso: 'SIMPLE_ROBE', head: 'FEATHER_CROWN', }, inventory: ['MEDICINAL_HERBS', 'EUCALYPTUS_OIL', 'ALOE_VERA', 'MORTAR_PESTLE', 'HEALING_SALVE'], companions: [] },

    // Pre-Columbian/American Healers
    'Medicine Man': { equipment: { cloak: 'FEATHER_CLOAK', head: 'EAGLE_FEATHER', belt: 'LEATHER_BAG', necklace: 'MEDICINE_BUNDLE' }, inventory: ['HEALERS_KIT', 'MEDICINAL_HERBS', 'INCENSE', 'PRAYER_BEADS', 'HEALING_SALVE'], companions: [] },
    'Medicine Woman': { equipment: { torso: 'DEER_HIDE', cloak: 'FUR_CLOAK', head: 'HEAD_WRAP', belt: 'LEATHER_BAG', necklace: 'SHELL_NECKLACE' }, inventory: ['HEALERS_KIT', 'MEDICINAL_HERBS', 'WILLOW_BARK', 'MORTAR_PESTLE', 'HEALING_SALVE'], companions: [] },
    'Paqo': { equipment: { cloak: 'ALPACA_CLOAK', head: 'CHULLO_HAT', belt: 'CLOTH_SASH' }, inventory: ['COCA_LEAVES', 'MEDICINAL_HERBS', 'HEALING_SALVE', 'PRAYER_BEADS'], companions: [] },
    'Ticitl': { equipment: { torso: 'SIMPLE_ROBE', cloak: 'FEATHER_CLOAK', head: 'FEATHER_BAND', belt: 'LEATHER_BAG' }, inventory: ['HEALERS_KIT', 'MEDICINAL_HERBS', 'MORTAR_PESTLE', 'HEALING_SALVE', 'MEDICAL_JOURNAL'], companions: [] },
    'Curandero': { equipment: { torso: 'SIMPLE_TUNIC',  head: 'FEATHER_CROWN', belt: 'LEATHER_BAG' }, inventory: ['MEDICINAL_HERBS', 'HEALING_SALVE', 'PRAYER_BEADS', 'INCENSE', 'TINCTURE_BOTTLE'], companions: [] },
    'Curandera': { equipment: { torso: 'SIMPLE_ROBE', head: 'HEAD_WRAP', belt: 'CLOTH_SASH' }, inventory: ['MEDICINAL_HERBS', 'HEALING_SALVE', 'PRAYER_BEADS', 'INCENSE', 'TINCTURE_BOTTLE'], companions: [] },
    'Herbatero': { equipment: { torso: 'SIMPLE_TUNIC', head: 'STRAW_HAT', belt: 'LEATHER_BAG' }, inventory: ['MEDICINAL_HERBS', 'MORTAR_PESTLE', 'TINCTURE_BOTTLE', 'HEALING_SALVE'], companions: [] },
    'Sobador': { equipment: { torso: 'SIMPLE_TUNIC', belt: 'CLOTH_SASH' }, inventory: ['HEALING_SALVE', 'BANDAGE', 'SPLINT_WOOD', 'PAIN_POWDER', 'LEATHER_APRON'], companions: [] },

    // European Healers
    'Herbalist': { equipment: { torso: 'SIMPLE_ROBE', head: 'CLOTH_HOOD', cloak: 'WOOL_CLOAK', belt: 'LEATHER_BAG' }, inventory: ['HEALERS_KIT', 'MEDICINAL_HERBS', 'WILLOW_BARK', 'MORTAR_PESTLE', 'TINCTURE_BOTTLE'], companions: [] },
    'Apothecary': { equipment: { torso: 'SIMPLE_ROBE', head: 'MERCHANT_CAP', belt: 'LEATHER_BAG' }, inventory: ['MORTAR_PESTLE', 'MEDICINAL_HERBS', 'TINCTURE_BOTTLE', 'HEALING_SALVE', 'SCALE', 'LEATHER_APRON'], companions: [] },
    'Barber-Surgeon': { equipment: { torso: 'SIMPLE_TUNIC', head: 'CLOTH_CAP', belt: 'LEATHER_BAG' }, inventory: ['SURGICAL_TOOLS', 'BLEEDING_BOWL', 'LEECH', 'BANDAGE', 'ALCOHOL_FLASK', 'LEATHER_APRON'], companions: [] },
    'Plague Doctor': { equipment: { torso: 'SIMPLE_ROBE', head: 'PLAGUE_MASK', cloak: 'WOOL_CLOAK', belt: 'LEATHER_BAG' }, inventory: ['HEALERS_KIT', 'INCENSE', 'MEDICINAL_HERBS', 'VINEGAR', 'MERCURY_VIAL', 'LEATHER_APRON'], companions: [] },
    'Midwife': { equipment: { torso: 'SIMPLE_ROBE', head: 'HEAD_WRAP', belt: 'CLOTH_SASH' }, inventory: ['HEALERS_KIT', 'STERILE_GAUZE', 'SOAP_BAR', 'HONEY_JAR', 'MEDICINAL_HERBS'], companions: [] },
    'Wise Woman': { equipment: { torso: 'SIMPLE_ROBE', head: 'CLOTH_HOOD', cloak: 'WOOL_CLOAK', belt: 'LEATHER_BAG' }, inventory: ['MEDICINAL_HERBS', 'HEALING_SALVE', 'WILLOW_BARK', 'MORTAR_PESTLE', 'HERB_BUNDLE'], companions: [] },
    'Leech Collector': { equipment: { torso: 'SIMPLE_TUNIC', head: 'CLOTH_CAP', feet: 'LEATHER_BOOTS', belt: 'LEATHER_BAG' }, inventory: ['LEECH', 'LEECH', 'LEECH', 'BUCKET', 'BANDAGE'], companions: [] },
    'Hospital Orderly': { equipment: { torso: 'SIMPLE_TUNIC', head: 'CLOTH_CAP', belt: 'CLOTH_SASH' }, inventory: ['BANDAGE', 'SOAP_BAR', 'BUCKET', 'STERILE_GAUZE'], companions: [] },

    // Modern Era Healers
    'Doctor': { equipment: { torso: 'WHITE_COAT' }, inventory: ['STETHOSCOPE', 'THERMOMETER', 'SYRINGE', 'MEDICAL_JOURNAL', 'BANDAGE'], companions: [] },
    'Nurse': { equipment: { torso: 'NURSE_UNIFORM' }, inventory: ['THERMOMETER', 'BANDAGE', 'STERILE_GAUZE', 'SOAP_BAR', 'MEDICAL_JOURNAL'], companions: [] },
    'Surgeon': { equipment: { torso: 'SURGICAL_SCRUBS' }, inventory: ['SURGICAL_TOOLS', 'SUTURE_THREAD', 'ALCOHOL_FLASK', 'STERILE_GAUZE'], companions: [] },
    'Pharmacist': { equipment: { torso: 'WHITE_COAT' }, inventory: ['MORTAR_PESTLE', 'SCALE', 'MEDICAL_JOURNAL', 'MEDICINE_BOTTLE'], companions: [] },
    'Paramedic': { equipment: { torso: 'UNIFORM' }, inventory: ['HEALERS_KIT', 'TOURNIQUET', 'BANDAGE', 'SYRINGE', 'THERMOMETER'], companions: [] },

    // --- ANTIQUITY (Using procedural weapon selection) ---
    'Merchant': { equipment: { torso: 'CITIZEN_TOGA', belt: 'PURSE', main_hand: '*CONTEXTUAL*', necklace: 'BRONZE_TORC' }, inventory: ['SCALE', 'COIN', 'AMPHORA', 'OLIVES'] }, // Requires AMPHORA
    'Physician': { equipment: { torso: 'SIMPLE_ROBE', belt: 'LEATHER_BAG', main_hand: '*CONTEXTUAL*' }, inventory: ['HEALERS_KIT', 'MEDICINAL_HERBS', 'BANDAGE', 'SURGICAL_TOOLS', 'URINE_FLASK'] },
    'Scribe': { equipment: { torso: 'SIMPLE_ROBE', belt: 'LEATHER_BAG', main_hand: '*CONTEXTUAL*' }, inventory: ['SCROLL', 'QUILL', 'INK_POT', 'PARCHMENT_ROLL'] },
    'Lawyer': { equipment: { torso: 'CITIZEN_TOGA', belt: 'PURSE', main_hand: '*CONTEXTUAL*' }, inventory: ['BOOK', 'SCROLL', 'QUILL', 'COIN'] },
    'Teacher': { equipment: { torso: 'SIMPLE_ROBE', belt: 'CLOTH_SASH', main_hand: '*CONTEXTUAL*' }, inventory: ['BOOK', 'SCROLL', 'STICK'] },
    'Architect': { equipment: { torso: 'SIMPLE_ROBE', belt: 'LEATHER_BAG', main_hand: '*CONTEXTUAL*' }, inventory: ['PARCHMENT_ROLL', 'SCALE', 'STONE_CHISEL'] },
    'Sailor': { equipment: { torso: 'WOOL_TUNIC', legs: 'SAILOR_PANTS', feet: 'SANDALS', cloak: 'WOOL_CLOAK', belt: 'ROPE' }, inventory: ['ROPE', 'SMOKED_FISH', 'GOURD_FLASK'] },
    'Engineer': { equipment: { torso: 'SIMPLE_TUNIC', head: 'LEATHER_CAP', belt: 'LEATHER_BAG' }, inventory: ['HAMMER', 'ROPE', 'PARCHMENT_ROLL', 'LEATHER_APRON'] },
    'Weaver': { equipment: { torso: 'PEPLOS', head: 'HEAD_WRAP', main_hand: 'SPINDLE' }, inventory: ['COTTON', 'WOOL_CARDERS'] },
    'Carpenter': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['HAMMER', 'NAILS', 'STICK'] },
    'Stonemason': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['STONE_CHISEL', 'STONE_BLOCK'] },
    'Glassblower': { equipment: { torso: 'LEATHER_APRON', head: 'FELT_BERET', main_hand: '*CONTEXTUAL*' }, inventory: ['GLASS_BOTTLE', 'BELLOWS', 'PINE_RESIN'] },
    'Jeweler': { equipment: { torso: 'LEATHER_APRON', head: 'MERCHANT_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['SILVER_ORE', 'HAMMER', 'SIMPLE_RING'] },
    'Tanner': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['COW_HIDE', 'SALT', 'KNIFE'] },
    'Fuller': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['BUCKET', 'SOAP'] },
    'Slave': { equipment: { torso: 'SLAVE_TUNIC', main_hand: '*CONTEXTUAL*' }, inventory: [] },
    'Vintner': { equipment: { torso: 'LEATHER_APRON', head: 'STRAW_HAT', main_hand: '*CONTEXTUAL*' }, inventory: ['GRAPES', 'WOODEN_BOWL', 'GLASS_BOTTLE'] },
    'Miller': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['WHEAT', 'FLOUR'] },
    'Tavern Keeper': { equipment: { torso: 'LEATHER_APRON', cloak: 'FUR_CLOAK', head: 'MERCHANT_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['WOODEN_BOWL', 'BREAD', 'KEY'] },
    'Gladiator': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*', necklace: 'IRON_TORC' }, inventory: ['BANDAGE'] },
    'Street Vendor': { equipment: { torso: 'WOOL_TUNIC', head: 'CLOTH_CAP' }, inventory: ['BREAD', 'FRUIT', 'PURSE'] },
    'Bathhouse Attendant': { equipment: { torso: 'SIMPLE_ROBE', head: 'CLOTH_CAP' }, inventory: ['SOAP', 'RAG'] },
    'Priest': { equipment: { torso: 'LINEN_ROBE', main_hand: '*CONTEXTUAL*', necklace: 'SILVER_TORC' }, inventory: ['INCENSE', 'RELIGIOUS_TEXT', 'CLAY_LAMP'] },
    'Temple Keeper': { equipment: { torso: 'SIMPLE_ROBE', head: 'CLOTH_HOOD', main_hand: '*CONTEXTUAL*' }, inventory: ['INCENSE', 'CANDLES', 'BROOM'] },
    'Oracle': { equipment: { torso: 'SILK_ROBE', head: 'LAUREL_CROWN', main_hand: '*CONTEXTUAL*' }, inventory: ['HERB_BUNDLE', 'BLESSED_ARTIFACT'] },

    // --- MEDIEVAL (Using procedural weapon selection) ---
    
    'Lady': { equipment: { head: 'VEIL', torso: 'MERCHANT_GOWN', cloak: 'NOBLE_CLOAK', belt: 'PURSE', main_hand: '*CONTEXTUAL*' }, inventory: ['SIMPLE_RING', 'BOOK', 'SILK_CLOTH'] },
    'Page': { equipment: { torso: 'CRAFTSMAN_TUNIC', head: 'CLOTH_CAP', feet: 'LEATHER_BOOTS', belt: 'CLOTH_SASH', main_hand: '*CONTEXTUAL*' }, inventory: ['SWORD', 'FRUIT'] },
    'Nun': { equipment: { head: 'WIMPLE', torso: 'SIMPLE_ROBE', cloak: 'WOOL_CLOAK', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'RELIGIOUS_TEXT', 'PRAYER_BEADS'] },
    'Pilgrim': { equipment: { torso: 'SIMPLE_TUNIC', head: 'PILGRIM_HAT', cloak: 'WOOL_CLOAK', belt: 'PURSE', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'GOURD_FLASK', 'PRAYER_BEADS'] },
    'Friar': { equipment: { torso: 'SIMPLE_ROBE', head: 'CLOTH_HOOD', feet: 'SANDALS', cloak: 'WOOL_CLOAK', belt: 'ROPE', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'RELIGIOUS_TEXT'] },
    'Pardoner': { equipment: { torso: 'SIMPLE_ROBE', head: 'FELT_BERET', cloak: 'WOOL_CLOAK', belt: 'PURSE', main_hand: '*CONTEXTUAL*' }, inventory: ['SCROLL', 'COIN', 'BLESSED_ARTIFACT'] },
    'Hermit': { equipment: { torso: 'ROUGH_TUNIC', head: 'CLOTH_HOOD', cloak: 'WOOL_CLOAK', belt: 'ROPE', main_hand: '*CONTEXTUAL*' }, inventory: ['HERB_BUNDLE', 'WOODEN_BOWL'] },
    'Smelter Worker': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', feet: 'WORK_BOOTS' }, inventory: ['IRON_ORE', 'COAL', 'TONGS'] },
    'Cobbler': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['LEATHER_BOOTS', 'SANDALS', 'KNIFE', 'NAILS'] },
    'Goldsmith': { equipment: { torso: 'LEATHER_APRON', head: 'MERCHANT_CAP' }, inventory: ['GOLD_ORE', 'HAMMER', 'SIMPLE_RING'] },
    'Illuminator': { equipment: { torso: 'SIMPLE_ROBE', head: 'CLOTH_CAP' }, inventory: ['BOOK', 'QUILL', 'OCHRE_LUMP', 'GOLD_LEAF'] }, // Requires GOLD_LEAF
    'Bell Founder': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['COPPER_INGOT', 'TIN_INGOT', 'BELLOWS'] },
    'Chandler': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['CANDLES', 'BEESWAX', 'VINE'] },
    'Dyer': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['OCHRE_LUMP', 'BUCKET', 'WOOL_TUNIC'] },
    'Guild Master': { equipment: { torso: 'MERCHANT_GOWN', head: 'MERCHANT_CAP', belt: 'PURSE', main_hand: '*CONTEXTUAL*' }, inventory: ['KEY', 'COIN', 'BOOK'] },
    'Wool Merchant': { equipment: { torso: 'WOOL_CLOAK', head: 'MERCHANT_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['SCALE', 'WOOL_TUNIC', 'PURSE'] },
    'Money Changer': { equipment: { torso: 'WOOL_TUNIC', head: 'MERCHANT_CAP', belt: 'PURSE', main_hand: '*CONTEXTUAL*' }, inventory: ['COIN', 'COIN', 'COIN', 'SCALE'] },
    'Brewer': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['BARLEY', 'BUCKET', 'WOODEN_BOWL'] },
    'Guard': { equipment: { head: 'LEATHER_CAP', torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD'] },
    'Thief': { equipment: { head: 'CLOTH_HOOD', torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*', belt: 'PURSE' }, inventory: ['LOCKPICK', 'ROPE', 'KNIFE'] },
    'Beggar': { equipment: { torso: 'ROUGH_TUNIC', main_hand: '*CONTEXTUAL*' }, inventory: ['WOODEN_BOWL', 'BREAD_CRUST'] },
    'Midwife': { equipment: { torso: 'SIMPLE_ROBE', head: 'HEAD_WRAP' }, inventory: ['HERB_BUNDLE', 'BANDAGE', 'SOAP'] },
    'Peddler': { equipment: { torso: 'WOOL_CLOAK', main_hand: 'STICK' }, inventory: ['ROPE', 'WOODEN_BOWL', 'SIMPLE_RING', 'LEATHER_BAG', 'TENT', 'TRAVEL_BLANKET', 'FLINT_AND_STEEL', 'WATERSKIN'] },
    'Executioner': { equipment: { head: 'CLOTH_HOOD', torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['ROPE', 'WHETSTONE'] },
    'Falconer': { equipment: { torso: 'LEATHER_TUNIC', arm: 'LEATHER_BRACER', main_hand: '*CONTEXTUAL*' }, inventory: ['MEAT'], companions: ['EAGLE'] },
    'Charcoal Burner': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['COAL', 'STICK'] },
    'Woodcutter': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['ROPE', 'STICK'] },
    'Washerwoman': { equipment: { torso: 'SIMPLE_ROBE', head: 'HEAD_WRAP', main_hand: '*CONTEXTUAL*' }, inventory: ['BUCKET', 'SOAP'] },
    'Wet Nurse': { equipment: { torso: 'SIMPLE_ROBE', head: 'HEAD_WRAP', main_hand: '*CONTEXTUAL*' }, inventory: ['MILK_BOTTLE', 'BREAD'] },

    // --- RENAISSANCE / EARLY MODERN ---
    'Banker': { equipment: { torso: 'FINE_CLOTHES', head: 'MERCHANT_CAP', feet: 'LEATHER_SHOES', belt: 'PURSE' }, inventory: ['SIMPLE_RING', 'COIN', 'QUILL'] },
    'Painter': { equipment: { torso: 'SIMPLE_ROBE', head: 'FELT_BERET' }, inventory: ['QUILL', 'INK_POT', 'PIGMENT'] },
    'Alchemist': { equipment: { torso: 'SIMPLE_ROBE', head: 'SCHOLAR_HAT' }, inventory: ['HEALING_POTION', 'MUSHROOM', 'EMPTY_VIAL', 'BOOK'] },
    'Mercenary': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', feet: 'LEATHER_BOOTS', main_hand: 'SCIMITAR' }, inventory: ['WHETSTONE', 'BREAD'] },
    'Plague Doctor': { equipment: { head: 'PLAGUE_MASK', torso: 'SIMPLE_ROBE' }, inventory: ['MEDICINAL_HERBS', 'REFRESHING_HERB', 'BANDAGE'] },
    'Apothecary': { equipment: { torso: 'SIMPLE_ROBE', head: 'SCHOLAR_HAT', belt: 'PURSE' }, inventory: ['MEDICINAL_HERBS', 'HERB_BUNDLE', 'SCALE'] },
    'Barber Surgeon': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['KNIFE', 'BANDAGE', 'LEECH', 'SOAP'] },
    'Instrument Maker': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['KNIFE', 'VINE', 'WOOD'] },
    'Tapestry Weaver': { equipment: { head: 'HEAD_WRAP', main_hand: 'SPINDLE' }, inventory: ['SILK_CLOTH', 'COTTON', 'WOOL_TUNIC'] },
    
    // --- INDUSTRIAL ERA ---
    'Factory Owner': { equipment: { torso: 'FROCK_COAT', head: 'TOP_HAT' }, inventory: ['COIN', 'KEY', 'POCKET_WATCH'] },
    'Railway Investor': { equipment: { torso: 'FINE_CLOTHES', head: 'TOP_HAT' }, inventory: ['COIN', 'POCKET_WATCH', 'MAP'] },
    'Pharmacist': { equipment: { torso: 'SIMPLE_ROBE', head: 'BOWLER_HAT' }, inventory: ['MEDICINAL_HERBS', 'SCALE', 'GLASS_VIAL', 'SYRINGE'] },
    'Police Constable': { equipment: { torso: 'WOOL_TUNIC', head: 'POLICE_CAP', feet: 'LEATHER_BOOTS', main_hand: 'STICK' }, inventory: ['HANDCUFFS'] },
    'Shopkeeper': { equipment: { torso: 'LEATHER_APRON', head: 'BOWLER_HAT', feet: 'LEATHER_BOOTS' }, inventory: ['WOODEN_BOWL', 'KEY', 'COIN'] },
    'Docker': { equipment: { torso: 'WORK_SHIRT', head: 'FLAT_CAP', feet: 'WORK_BOOTS' }, inventory: ['ROPE', 'BREAD'] },
    'Factory Worker': { equipment: { torso: 'FACTORY_SHIRT', head: 'FLAT_CAP', feet: 'WORK_BOOTS' }, inventory: ['BREAD', 'RAG'] },
    'Coal Miner': { equipment: { head: 'LEATHER_CAP', torso: 'WORK_SHIRT', main_hand: 'PICKAXE' }, inventory: ['BREAD', 'CLAY_LAMP'] },
    'Journalist': { equipment: { torso: 'FROCK_COAT', head: 'BOWLER_HAT' }, inventory: ['QUILL', 'INK_POT', 'NOTEBOOK'] },
    'Governess': { equipment: { torso: 'DAY_DRESS', head: 'BONNET' }, inventory: ['BOOK', 'SLATE_BOARD', 'PEN'] },
    'Chimney Sweep': { equipment: { head: 'FLAT_CAP', torso: 'WORK_SHIRT', main_hand: 'CHIMNEY_BRUSH' }, inventory: ['ROPE', 'SOAP'] },
    'Telegraph Operator': { equipment: { torso: 'FORMAL_SHIRT', head: 'VISOR' }, inventory: ['PAPER', 'QUILL', 'TELEGRAPH_KEY'] },
    'Gas Lamp Lighter': { equipment: { torso: 'WORK_SHIRT', head: 'FLAT_CAP', main_hand: 'STICK' }, inventory: ['FLINT_STONE', 'ROPE'] },
    'Rag Picker': { equipment: { torso: 'ROUGH_TUNIC', head: 'CLOTH_CAP' }, inventory: ['LEATHER_BAG', 'STICK'] },
    'Flower Seller': { equipment: { torso: 'SIMPLE_DRESS', head: 'STRAW_HAT' }, inventory: ['FLOWER', 'FLOWER', 'BASKET'] },
    'Street Sweeper': { equipment: { head: 'FLAT_CAP', main_hand: 'BROOM' }, inventory: ['BUCKET'] },
    
    // =======================================================================
    // == MENA (Middle East & North Africa)
    // =======================================================================
    // --- PREHISTORY ---
    'Brick Maker': { equipment: { torso: 'LEATHER_APRON', head: 'HEAD_WRAP' }, inventory: ['CLAY_LUMP', 'WOODEN_BOWL'] },
    'Seal Carver': { equipment: { head: 'CLOTH_CAP' }, inventory: ['CLAY_LUMP', 'KNIFE', 'STICK'] },
    'Trader': { equipment: { torso: 'WOOL_TUNIC', head: 'KEFFIYEH', belt: 'PURSE' }, inventory: ['BARLEY', 'SCALE'] },
    'Bead Maker': { equipment: { head: 'HEAD_WRAP' }, inventory: ['SMOOTH_STONE', 'VINE', 'SHELL'] }, // 50% male
    'Reed Gatherer': { equipment: { head: 'STRAW_HAT' }, inventory: ['REED_BUNDLE', 'KNIFE'] }, // 40% male
    'Mud Brick Maker': { equipment: { head: 'HEAD_WRAP' }, inventory: ['CLAY_LUMP', 'STRAW'] }, // 80% male

    // --- ANTIQUITY (Persian context) ---
    'Local Governor': { equipment: { torso: 'SILK_ROBE', head: 'TURBAN', belt: 'PURSE', necklace: 'GOLD_TORC' }, inventory: ['COIN', 'SCROLL'] },
    'Courier': { equipment: { feet: 'SANDALS', head: 'KEFFIYEH' }, inventory: ['SCROLL', 'GOURD_FLASK'], companions: ['HORSE'] },
    'Tax Assessor': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN', main_hand: 'SWORD' }, inventory: ['SCROLL', 'QUILL', 'SCALE'] },
    'Bronze Caster': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', main_hand: 'HAMMER' }, inventory: ['COPPER_ORE', 'TIN_ORE'] },

    // --- MEDIEVAL (Islamic Golden Age context) ---
    'Astronomer': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN' }, inventory: ['SCROLL_OF_KNOWLEDGE', 'PARCHMENT_ROLL', 'INK_POT'] },
    'Translator': { equipment: { torso: 'SIMPLE_ROBE', head: 'SCHOLAR_HAT' }, inventory: ['BOOK', 'SCROLL', 'QUILL'] },
    'Mathematician': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN' }, inventory: ['BOOK', 'QUILL', 'SCALE'] },
    'Librarian': { equipment: { torso: 'SIMPLE_ROBE', head: 'SCHOLAR_HAT' }, inventory: ['BOOK', 'BOOK', 'SCROLL'] },
    'Carpet Weaver': { equipment: { head: 'HEAD_WRAP', main_hand: 'SPINDLE' }, inventory: ['COTTON', 'SILK_CLOTH'] },
    'Date Farmer': { equipment: { head: 'KEFFIYEH', main_hand: 'HARVEST_SICKLE' }, inventory: ['DATES', 'ROPE'] },
    'Imam': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN' }, inventory: ['RELIGIOUS_TEXT'] },
    'Muezzin': { equipment: { torso: 'SIMPLE_ROBE', head: 'KUFI_CAP' }, inventory: ['PRAYER_BEADS'] }, // 100% male
    'Quranic Teacher': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN' }, inventory: ['RELIGIOUS_TEXT', 'BOOK'] }, // 95% male
    'Olive Farmer': { equipment: { head: 'KEFFIYEH', main_hand: 'STICK' }, inventory: ['OLIVES', 'BUCKET'] }, // 80% male
    'Goat Herder': { equipment: { head: 'KEFFIYEH', main_hand: 'STICK' }, inventory: ['ROPE'], companions: ['GOAT', 'GOAT'] }, // 70% male
    'Wool Spinner': { equipment: { head: 'HEAD_WRAP', main_hand: 'SPINDLE' }, inventory: ['WOOL', 'THREAD'] }, // 20% male
    'Leather Tanner': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP' }, inventory: ['HIDE', 'SALT', 'BUCKET'] }, // 95% male
    'Coppersmith': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', main_hand: 'HAMMER' }, inventory: ['COPPER_ORE', 'TONGS'] }, // 100% male

    // --- RENAISSANCE / EARLY MODERN (Ottoman context) ---
    'Janissary': { equipment: { torso: 'WOOL_TUNIC', head: 'FELT_BERET', feet: 'LEATHER_BOOTS', main_hand: 'SCIMITAR' }, inventory: ['BREAD', 'WHETSTONE'] },
    'Provincial Governor': { equipment: { torso: 'KAFTAN', head: 'TURBAN' }, inventory: ['COIN', 'SCROLL'] },
    'Tax Farmer': { equipment: { torso: 'SIMPLE_ROBE', head: 'FEZ', belt: 'PURSE' }, inventory: ['COIN', 'SCALE', 'BOOK'] },
    'Court Interpreter': { equipment: { torso: 'SILK_ROBE', head: 'TURBAN' }, inventory: ['BOOK', 'QUILL'] },
    'Coffeehouse Keeper': { equipment: { torso: 'SIMPLE_ROBE', head: 'FEZ' }, inventory: ['WOODEN_BOWL', 'COFFEE_BEANS', 'RAW_SUGAR'] },
    'Silk Road Trader': { equipment: { head: 'TURBAN', torso: 'DESERT_CLOAK' }, inventory: ['SILK_CLOTH', 'SPICE_POUCH', 'SCALE', 'TENT', 'BEDROLL', 'TINDERBOX', 'WATERSKIN', 'TRAVEL_POT'], companions: ['CAMEL'] },
    'Carpet Merchant': { equipment: { torso: 'SIMPLE_ROBE', head: 'FEZ', belt: 'PURSE' }, inventory: ['RUG', 'SCALE'] },
    'Tile Maker': { equipment: { torso: 'LEATHER_APRON', head: 'HEAD_WRAP' }, inventory: ['CLAY_LUMP', 'OCHRE_LUMP'] },
    'Weapon Smith': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', main_hand: 'HAMMER' }, inventory: ['IRON_INGOT', 'WHETSTONE'] },
    'Potter': { equipment: { torso: 'LEATHER_APRON', head: 'HEAD_WRAP' }, inventory: ['CLAY_LUMP', 'KAOLIN'] }, // 90% male
    'Bread Baker': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['WHEAT', 'BREAD', 'SALT'] }, // 95% male
    'Water Seller': { equipment: { torso: 'SIMPLE_TUNIC', head: 'KEFFIYEH' }, inventory: ['GOURD_FLASK', 'BUCKET'] }, // 70% male
    'Street Vendor': { equipment: { head: 'KEFFIYEH' }, inventory: ['FRUIT', 'VEGETABLES', 'BASKET'] }, // 60% male
    'Bathhouse Keeper': { equipment: { torso: 'SIMPLE_ROBE', head: 'CLOTH_CAP' }, inventory: ['SOAP', 'BUCKET', 'RAG'] }, // 80% male
    'Henna Artist': { equipment: { head: 'HEAD_WRAP' }, inventory: ['OCHRE_LUMP', 'WOODEN_BOWL'] }, // 10% male

    // --- INDUSTRIAL ERA ---
    'Oil Worker': { equipment: { head: 'LEATHER_CAP', torso: 'LEATHER_APRON' }, inventory: ['PICKAXE', 'FLASHLIGHT', 'BREAD'] }, // 100% male
    'Newspaper Editor': { equipment: { torso: 'FROCK_COAT', head: 'FEZ' }, inventory: ['PAPER', 'PEN', 'INK_POT'] }, // 95% male
    'Canal Worker': { equipment: { torso: 'WORK_SHIRT', head: 'HEAD_WRAP', main_hand: 'PICKAXE' }, inventory: ['BREAD', 'GOURD_FLASK'] }, // 100% male
    'Cotton Ginner': { equipment: { torso: 'WORK_SHIRT', head: 'HEAD_WRAP' }, inventory: ['COTTON', 'BUCKET'] }, // 70% male
    'Telegraph Clerk': { equipment: { torso: 'FORMAL_SHIRT', head: 'FEZ' }, inventory: ['PAPER', 'PEN'] }, // 85% male
    
    // =======================================================================
    // == EAST ASIAN
    // =======================================================================
    // --- PREHISTORY ---
    'Jade Carver': { equipment: { head: 'CLOTH_CAP' }, inventory: ['JADE_STONE', 'KNIFE', 'SMOOTH_STONE'] },
    'Bone Oracle': { equipment: { torso: 'DEER_HIDE', head: 'FEATHER_BAND' }, inventory: ['BONES', 'FLINT_STONE', 'COAL'] },

    // --- ANTIQUITY ---
    'County Magistrate': { equipment: { torso: 'SILK_ROBE', head: 'OFFICIAL_HAT' }, inventory: ['BOOK', 'QUILL', 'COIN'] },
    'Infantry': { equipment: { torso: 'SCALE_ARMOR', cloak: 'MILITARY_CLOAK', head: 'LEATHER_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['RICE'] },
    'Cavalry': { equipment: { torso: 'SCALE_ARMOR', cloak: 'OFFICER_CAPE', head: 'LEATHER_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['RICE'], companions: ['HORSE'] },
    'Border Guard': { equipment: { torso: 'PADDED_ARMOR', cloak: 'MILITARY_CLOAK', head: 'LEATHER_CAP', main_hand: '*CONTEXTUAL*' }, inventory: ['RICE'] },
    'Navy Sailor': { equipment: { torso: 'WOOL_TUNIC', head: 'BAMBOO_HAT' }, inventory: ['ROPE', 'SMOKED_FISH'] },
    'Silk Farmer': { equipment: { head: 'BAMBOO_HAT', torso: 'SIMPLE_ROBE', }, inventory: ['SILK_CLOTH', 'LEAF_BUNDLE'] },
    'Tea Grower': { equipment: { head: 'BAMBOO_HAT', torso: 'LOINCLOTH', }, inventory: ['DRY_LEAVES', 'WOODEN_BOWL'] },
    'Vegetable Farmer': { equipment: { head: 'BAMBOO_HAT', legs: 'LOINCLOTH', }, inventory: ['VEGETABLES', 'WOODEN_BOWL'] },
    'Bronze Caster': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP', main_hand: 'HAMMER' }, inventory: ['COPPER_ORE', 'TIN_ORE', 'BELLOWS'] },
    'Porcelain Potter': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['CLAY_LUMP', 'KAOLIN'] },
    'Lacquerware Maker': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['WOODEN_BOWL', 'PINE_RESIN'] },
    'Silk Weaver': { equipment: { head: 'HEAD_WRAP', torso: 'SIMPLE_ROBE', main_hand: 'SPINDLE' }, inventory: ['SILK_CLOTH', 'DYE'] },
    'Bamboo Worker': { equipment: { head: 'BAMBOO_HAT', torso: 'SIMPLE_ROBE', main_hand: 'KNIFE' }, inventory: ['BAMBOO', 'ROPE'] },
    'Salt Merchant': { equipment: { head: 'MERCHANT_CAP', torso: 'SIMPLE_ROBE', belt: 'PURSE', main_hand: 'KNIFE' }, inventory: ['ROCK_SALT', 'SCALE'], companions: ['OX'] },

    // --- MEDIEVAL (Japanese Context) ---
    'Zen Master': { equipment: { torso: 'SIMPLE_ROBE', head: 'CLOTH_HOOD' }, inventory: ['BOOK', 'PRAYER_BEADS'] },
    'Temple Servant': { equipment: { torso: 'SIMPLE_ROBE', head: 'CLOTH_CAP', main_hand: 'BROOM' }, inventory: ['BUCKET', 'INCENSE'] },
    'Lacquerware Artisan': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['WOODEN_BOWL', 'PINE_RESIN', 'OCHRE_LUMP'] },
    'Tatami Maker': { equipment: { torso: 'LEATHER_APRON', head: 'BAMBOO_HAT' }, inventory: ['RICE_STRAW', 'KNIFE'] },
    'Fan Maker': { equipment: { head: 'HEAD_WRAP' }, inventory: ['BAMBOO', 'PAPER', 'KNIFE'] },
    'Porter': { equipment: { head: 'BAMBOO_HAT' }, inventory: ['ROPE', 'LEATHER_BAG'] },
    'Tea House Servant': { equipment: { torso: 'SILK_ROBE', head: 'HEAD_WRAP' }, inventory: ['TEA_LEAVES', 'WOODEN_BOWL'] },
    'Tofu Maker': { equipment: { torso: 'LEATHER_APRON', head: 'HEAD_WRAP' }, inventory: ['SOYBEANS', 'BUCKET', 'WOODEN_BOWL'] },

    // --- RENAISSANCE / EARLY MODERN (Chinese Context) ---
    'Local Magistrate': { equipment: { torso: 'SILK_ROBE', head: 'OFFICIAL_HAT' }, inventory: ['BOOK', 'QUILL', 'COIN'] },
    'Census Taker': { equipment: { torso: 'WOOL_TUNIC', head: 'SCHOLAR_HAT' }, inventory: ['BOOK', 'QUILL', 'INK_POT'] },
    'Granary Keeper': { equipment: { torso: 'WOOL_TUNIC', head: 'CLOTH_CAP' }, inventory: ['KEY', 'RICE', 'WHEAT'] },
    'Woodblock Printer': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['PAPER', 'INK_POT', 'KNIFE'] },
    'Inkstick Maker': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['COAL', 'PINE_RESIN'] },
    'Porcelain Dealer': { equipment: { head: 'MERCHANT_CAP', belt: 'PURSE' }, inventory: ['POTTERY_SHARD', 'SCALE', 'COIN'] },
    'Rice Merchant': { equipment: { head: 'MERCHANT_CAP', belt: 'PURSE' }, inventory: ['RICE', 'SCALE'] },
    'Tea Picker': { equipment: { head: 'BAMBOO_HAT' }, inventory: ['TEA_LEAVES', 'BASKET'] },
    'Boatman': { equipment: { head: 'BAMBOO_HAT', main_hand: 'STICK' }, inventory: ['ROPE', 'FISH_MEAT'] },
    'Market Vendor': { equipment: { head: 'BAMBOO_HAT' }, inventory: ['VEGETABLES', 'RICE', 'PURSE'] },

    // --- INDUSTRIAL ERA ---
    'Railway Engineer': { equipment: { torso: 'WORK_SHIRT', head: 'BOWLER_HAT' }, inventory: ['HAMMER', 'SCALE', 'PARCHMENT_ROLL'] },
    'Fireman': { equipment: { torso: 'WORK_SHIRT', head: 'LEATHER_CAP', main_hand: 'AXE' }, inventory: ['BUCKET', 'ROPE'] },
    'Machinist': { equipment: { torso: 'LEATHER_APRON', head: 'FLAT_CAP' }, inventory: ['HAMMER', 'TONGS', 'IRON_INGOT'] },
    'Stevedore': { equipment: { torso: 'WORK_SHIRT', head: 'FLAT_CAP' }, inventory: ['ROPE', 'BREAD'] },
    'Rickshaw Puller': { equipment: { head: 'BAMBOO_HAT' }, inventory: ['RICE', 'GOURD_FLASK'] },
    
    // =======================================================================
    // == SOUTH ASIAN
    // =======================================================================
    // --- PREHISTORY ---
    'Harappan Brick Maker': { equipment: { torso: 'LEATHER_APRON', head: 'HEAD_WRAP' }, inventory: ['CLAY_LUMP', 'WOODEN_BOWL'] },
    'Harappan Seal Carver': { equipment: { head: 'CLOTH_CAP' }, inventory: ['CLAY_LUMP', 'KNIFE', 'STICK'] },
    'Harappan Trader': { equipment: { torso: 'WOOL_TUNIC', head: 'TURBAN', belt: 'PURSE' }, inventory: ['BARLEY', 'SCALE', 'BEADS'] },
    'Harappan Bead Maker': { equipment: { head: 'HEAD_WRAP' }, inventory: ['SMOOTH_STONE', 'VINE', 'SHELL'] },

    // --- ANTIQUITY ---
    'Brahmin Priest': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN' }, inventory: ['RELIGIOUS_TEXT', 'INCENSE', 'PRAYER_BEADS'] },
    'Brahmin Scholar': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN' }, inventory: ['BOOK', 'SCROLL', 'QUILL'] },
    'Kshatriya Warrior': { equipment: { torso: 'JERKIN', head: 'LEATHER_CAP', main_hand: 'SWORD', necklace: 'BRONZE_TORC' }, inventory: ['BREAD'] },
    'Kshatriya Chariot Driver': { equipment: { torso: 'JERKIN', head: 'TURBAN', main_hand: 'SWORD', necklace: 'SILVER_TORC' }, inventory: [], companions: ['HORSE', 'HORSE'] },
    'Vaishya Merchant': { equipment: { torso: 'WOOL_TUNIC', head: 'MERCHANT_CAP', belt: 'PURSE' }, inventory: ['SCALE', 'COIN', 'SPICE_POUCH'] },
    'Vaishya Banker': { equipment: { torso: 'WOOL_TUNIC', head: 'TURBAN', belt: 'PURSE' }, inventory: ['COIN', 'COIN', 'BOOK'] },
    'Shudra Farmer': { equipment: { head: 'STRAW_HAT', torso: 'DHOTI', main_hand: 'HARVEST_SICKLE' }, inventory: ['WHEAT', 'LENTILS'] },
    'Shudra Weaver': { equipment: { head: 'HEAD_WRAP', torso: 'DHOTI', main_hand: 'SPINDLE' }, inventory: ['COTTON'] },
    'Shudra Potter': { equipment: { head: 'HEAD_WRAP', torso: 'DHOTI', }, inventory: ['CLAY_LUMP', 'WOODEN_BOWL'] },
    'Shudra Blacksmith': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', main_hand: 'HAMMER' }, inventory: ['IRON_ORE', 'COAL'] },
    'Shudra Carpenter': { equipment: { head: 'CLOTH_CAP', main_hand: 'AXE' }, inventory: ['HAMMER', 'NAILS'] }, // 100% male
    'Fisherwoman': { equipment: { torso: 'SIMPLE_TUNIC', head: 'HEAD_WRAP' }, inventory: ['FISHING_NET', 'BASKET'] }, // 20% male
    'Salt Worker': { equipment: { head: 'STRAW_HAT' }, inventory: ['ROCK_SALT', 'BUCKET'] }, // 50% male
    'Toddy Tapper': { equipment: { head: 'TURBAN', main_hand: 'KNIFE' }, inventory: ['GOURD_FLASK', 'ROPE'] }, // 95% male

    // --- MEDIEVAL ---
    'Hindu Priest': { equipment: { torso: 'DHOTI', head: 'TURBAN' }, inventory: ['INCENSE', 'BELL', 'RELIGIOUS_TEXT'] },
    'Ascetic': { equipment: { head: 'CLOTH_HOOD', main_hand: 'STICK' }, inventory: ['WOODEN_BOWL'] },
    'Temple Dancer': { equipment: { torso: 'SARI', head: 'FLOWER_CROWN' }, inventory: ['BELL', 'FLOWER'] },
    'Carpet Weaver': { equipment: { head: 'HEAD_WRAP', main_hand: 'SPINDLE' }, inventory: ['SILK_CLOTH', 'COTTON'] },
    'Stone Carver': { equipment: { head: 'CLOTH_CAP', main_hand: 'STONE_CHISEL' }, inventory: ['HAMMER', 'STONE_BLOCK'] },
    'Textile Dyer': { equipment: { torso: 'LEATHER_APRON', head: 'HEAD_WRAP' }, inventory: ['INDIGO', 'BUCKET'] },
    'Incense Maker': { equipment: { head: 'CLOTH_CAP' }, inventory: ['PINE_RESIN', 'HERB_BUNDLE', 'STICK'] },
    'Spice Grower': { equipment: { head: 'STRAW_HAT', main_hand: 'HARVEST_SICKLE' }, inventory: ['SPICE_POUCH', 'PEAS'] },
    'Cotton Farmer': { equipment: { head: 'STRAW_HAT', cloak: 'WOOL_CLOAK', main_hand: 'HARVEST_SICKLE' }, inventory: ['COTTON'] },
    'Cowherd': { equipment: { main_hand: 'STICK' }, inventory: [], companions: ['COW', 'COW'] },
    'Village Headman': { equipment: { head: 'TURBAN', torso: 'KURTA', cloak: 'FUR_CLOAK', main_hand: 'SWORD' }, inventory: ['COIN', 'STICK'] }, // 100% male
    'Midwife': { equipment: { torso: 'SARI' }, inventory: ['HERB_BUNDLE', 'CLOTH', 'BUCKET'] }, // 0% male
    'Village Scribe': { equipment: { head: 'TURBAN', torso: 'SIMPLE_TUNIC' }, inventory: ['QUILL', 'INK_POT', 'PAPER'] }, // 95% male
    'Brick Layer': { equipment: { torso: 'SIMPLE_TUNIC' }, inventory: ['CLAY_LUMP', 'BUCKET'] }, // 100% male
    'Basket Weaver': { equipment: {head: 'TURBAN', legs: 'LOINCLOTH'  }, inventory: ['BAMBOO', 'VINE'] }, // 30% male
    'Oil Presser': { equipment: { torso: 'LEATHER_APRON', legs: 'LOINCLOTH'  }, inventory: ['SESAME_SEEDS', 'BUCKET'] }, // 85% male

    // --- RENAISSANCE / EARLY MODERN (Mughal/Colonial Context) ---
    'Court Musician': { equipment: { torso: 'SILK_ROBE', head: 'TURBAN' }, inventory: ['FLUTE', 'SIMPLE_RING'] },
    'Court Painter': { equipment: { torso: 'SILK_ROBE', head: 'SCHOLAR_HAT' }, inventory: ['PIGMENT', 'QUILL', 'PAPER'] },
    'Sepoy': { equipment: { head: 'TURBAN', torso: 'WOOL_TUNIC', main_hand: 'SWORD' }, inventory: ['BREAD'] },
    'Interpreter': { equipment: { torso: 'DHOTI', head: 'SCHOLAR_HAT' }, inventory: ['BOOK'] },
    'Metalworker': { equipment: { torso: 'DHOTI', head: 'LEATHER_CAP', main_hand: 'HAMMER' }, inventory: ['IRON_INGOT', 'COPPER_INGOT'] }, // 95% male
    'Well Keeper': { equipment: { torso: 'DHOTI', head: 'TURBAN' }, inventory: ['GOURD_FLASK', 'BUCKET'] }, // 70% male
    'Barber': { equipment: { head: 'TURBAN', torso: 'DHOTI', main_hand: 'KNIFE' }, inventory: ['SOAP', 'RAG'] }, // 100% male
    'Village Potter': { equipment: { torso: 'LEATHER_APRON', head: 'HEAD_WRAP' }, inventory: ['CLAY_LUMP', 'WOODEN_BOWL'] }, // 80% male
    'Milk Seller': { equipment: { torso: 'SIMPLE_TUNIC', legs: 'LOINCLOTH',  head: 'TURBAN' }, inventory: ['WOODEN_BOWL', 'BUCKET'] }, // 60% male
    'Tailor': { equipment: { head: 'KUFI_CAP', legs: 'LOINCLOTH', main_hand: 'KNIFE' }, inventory: ['COTTON', 'SILK_CLOTH', 'NEEDLE'] }, // 90% male
    'Jeweler': { equipment: { torso: 'LEATHER_APRON', head: 'MERCHANT_CAP', main_hand: 'HAMMER' }, inventory: ['GOLD_ORE', 'SCALE'] }, // 100% male
    'Vegetable Seller': { equipment: { head: 'STRAW_HAT', torso: 'DHOTI' }, inventory: ['VEGETABLES', 'BASKET'] }, // 40% male
    'Flour Miller': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['WHEAT', 'WOODEN_BOWL'] }, // 90% male

    // --- INDUSTRIAL ERA ---
    'Civil Engineer': { equipment: { torso: 'FORMAL_SHIRT', head: 'PITH_HELMET' }, inventory: ['PAPER', 'SCALE', 'PEN'] }, // 95% male
    'Mill Worker': { equipment: { torso: 'FACTORY_SHIRT', head: 'CLOTH_CAP' }, inventory: ['BREAD', 'COTTON'] }, // 60% male
    'Tea Picker': { equipment: { head: 'STRAW_HAT', torso: 'WORK_SHIRT' }, inventory: ['TEA_LEAVES', 'BASKET'] }, // 40% male
    'Jute Mill Worker': { equipment: { torso: 'FACTORY_SHIRT', head: 'CLOTH_CAP' }, inventory: ['ROPE', 'BREAD'] }, // 50% male
    'Railway Porter': { equipment: { head: 'TURBAN', torso: 'WORK_SHIRT' }, inventory: ['ROPE', 'BREAD'] }, // 90% male
    'Dhobi': { equipment: { torso: 'SIMPLE_TUNIC', legs: 'WORKER_TROUSERS' }, inventory: ['SOAP', 'BUCKET'] }, // 85% male
    
    // =======================================================================
    // == SUB-SAHARAN AFRICAN
    // =======================================================================
    // --- PREHISTORY ---
    'Spirit Medium': { equipment: { head: 'FEATHER_BAND', torso: 'HIDE_WRAP' }, inventory: ['BONES', 'HERB_BUNDLE'] },
    'Rock Painter': { equipment: { head: 'FEATHER_BAND' }, inventory: ['OCHRE_LUMP', 'COAL'] },
    'Honey Gatherer': { equipment: { head: 'HEAD_WRAP' }, inventory: ['BUCKET', 'ROPE'] },

    // --- ANTIQUITY ---
    'Chief': { equipment: { head: 'FEATHER_CROWN', torso: 'LEOPARD_SKIN', necklace: 'GOLD_TORC' }, inventory: ['STICK'] }, // Requires Leopard Skin
    'Rain Maker': { equipment: { head: 'FEATHER_CROWN', cloak: 'FEATHER_CLOAK', torso: 'SIMPLE_ROBE' }, inventory: ['HERB_BUNDLE', 'BONES', 'BLESSED_ARTIFACT'] },
    'War Leader': { equipment: { head: 'FEATHER_CROWN',  cloak: 'FEATHER_CLOAK', main_hand: 'STICK' }, inventory: ['OCHRE_LUMP'] },
    'Iron Smelter': { equipment: { torso: 'LEATHER_APRON', main_hand: 'HAMMER' }, inventory: ['BOG_IRON', 'BELLOWS'] },
    'Ivory Carver': { equipment: { torso: 'LEATHER_APRON', main_hand: 'KNIFE' }, inventory: ['IVORY_TUSK', 'SMOOTH_STONE'] },
    'Salt Trader': { equipment: { belt: 'PURSE' }, inventory: ['ROCK_SALT', 'SCALE'], companions: ['DONKEY'] }, // Requires Donkey
    'Cattle Herder': { equipment: { main_hand: 'STICK' }, inventory: ['ROPE'], companions: ['COW', 'COW', 'COW'] },
    'Village Elder': { equipment: { head: 'CROWN', torso: 'SIMPLE_ROBE', cloak: 'FEATHER_CLOAK', main_hand: 'STICK' }, inventory: ['PRAYER_BEADS'] },

    // --- MEDIEVAL ---
    'King': { equipment: { head: 'CROWN', torso: 'AGBADA', main_hand: 'SWORD' }, inventory: ['GOLD_BAR'] },
    'Queen Mother': { equipment: { head: 'GELE', torso: 'BOUBOU' }, inventory: ['GOLD_RING'] },
    'Griot': { equipment: { torso: 'DASHIKI' }, inventory: ['DRUM', 'FLUTE'] },
    'Islamic Scholar': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN' }, inventory: ['RELIGIOUS_TEXT', 'BOOK'] },
    'Gold Trader': { equipment: { torso: 'BOUBOU', cloak: 'WOOL_CLOAK', belt: 'PURSE' }, inventory: ['GOLD_ORE', 'SCALE'], companions: ['CAMEL'] },
    'Blacksmith': { equipment: { torso: 'LEATHER_APRON', main_hand: 'HAMMER' }, inventory: ['IRON_ORE', 'BELLOWS', 'TONGS'] },
    'Caravan Guide': { equipment: { cloak: 'DESERT_CLOAK', head: 'KEFFIYEH', main_hand: 'SWORD' }, inventory: ['MAP', 'GOURD_FLASK', 'TENT', 'BEDROLL', 'TINDERBOX', 'WATERSKIN', 'TRAVEL_POT'], companions: ['CAMEL'] },
    'Millet Farmer': { equipment: { main_hand: 'HARVEST_SICKLE', cloak: 'WOOL_CLOAK', }, inventory: ['MILLET', 'WOODEN_BOWL'] },
    'Diviner': { equipment: { torso: 'SIMPLE_ROBE', cloak: 'FEATHER_CLOAK', main_hand: 'IVORY_TUSK' }, inventory: ['BONES', 'SHELL', 'PRAYER_BEADS'] },

    // --- RENAISSANCE / EARLY MODERN ---
    'Sultan': { equipment: { head: 'TURBAN', torso: 'KAFTAN' }, inventory: ['SCIMITAR', 'COIN'] },
    'Oba': { equipment: { head: 'CORAL_CROWN', torso: 'AGBADA' }, inventory: ['CORAL_BEADS'] },
    'Portuguese Factor': { equipment: { head: 'TRICORN_HAT', torso: 'FROCK_COAT' }, inventory: ['COIN', 'SCROLL'] },
    'Slave Trader': { equipment: { torso: 'LEATHER_APRON', cloak: 'FEATHER_CLOAK', head: 'TRICORN_HAT', belt: 'PURSE' }, inventory: ['HANDCUFFS', 'ROPE', 'COIN'] },
    'Brass Caster': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', main_hand: 'HAMMER' }, inventory: ['COPPER_ORE', 'TIN_ORE', 'BELLOWS'] },
    'Musket Bearer': { equipment: { head: 'LEATHER_CAP', main_hand: 'STICK' }, inventory: ['LEAD_BAR', 'SULFUR'] }, // STICK as placeholder for Musket
    'Cowrie Counter': { equipment: { head: 'CLOTH_CAP', belt: 'PURSE' }, inventory: ['SHELL', 'SHELL', 'SHELL', 'SCALE'] },
    'Palm Wine Tapper': { equipment: { head: 'STRAW_HAT', main_hand: 'KNIFE' }, inventory: ['GOURD_FLASK', 'ROPE'] },
    'War Captive': { equipment: {}, inventory: [] },

    // --- INDUSTRIAL ERA ---
    'Colonial Governor': { equipment: { head: 'PITH_HELMET', torso: 'SUIT' }, inventory: ['BOOK', 'POCKET_WATCH'] },
    'Paramount Chief': { equipment: { head: 'FEZ', torso: 'AGBADA' }, inventory: ['STICK', 'SIMPLE_RING'] },
    'Missionary': { equipment: { torso: 'SIMPLE_ROBE', head: 'PITH_HELMET' }, inventory: ['RELIGIOUS_TEXT', 'BANDAGE'] },
    'Court Interpreter': { equipment: { torso: 'FORMAL_SHIRT', head: 'FEZ' }, inventory: ['BOOK', 'NOTEBOOK'] },
    'Cash Crop Farmer': { equipment: { head: 'STRAW_HAT', cloak: 'WOOL_CLOAK', main_hand: 'HARVEST_SICKLE' }, inventory: ['COFFEE_BEANS', 'COCOA_BEANS'] },
    'Mine Worker': { equipment: { head: 'LEATHER_CAP', cloak: 'WOOL_CLOAK', main_hand: 'PICKAXE' }, inventory: ['BREAD', 'FLASHLIGHT'] },
    'Hut Tax Payer': { equipment: { head: 'CLOTH_CAP', cloak: 'WOOL_CLOAK',  main_hand: 'STICK' }, inventory: ['CORN'] },

    // =======================================================================
    // == OCEANIA
    // =======================================================================
    // --- PREHISTORY ---
    'Navigator': { equipment: { head: 'FEATHER_CROWN', cloak: 'FEATHER_CLOAK',}, inventory: ['STICK_CHART', 'FISHING_NET', 'COCONUT'] }, // 85% male
    'Canoe Builder': { equipment: { head: 'FEATHER_CROWN', necklace: 'SHELL_NECKLACE', main_hand: 'AXE' }, inventory: ['VINE', 'PINE_RESIN'] }, // 95% male
    'Taro Farmer': { equipment: { head: 'STRAW_HAT', necklace: 'SHELL_NECKLACE', main_hand: 'DIGGING_STICK' }, inventory: ['TARO', 'WOODEN_BOWL'] }, // 60% male
    'Net Weaver': { equipment: { head: 'HEAD_WRAP', necklace: 'SHELL_NECKLACE', }, inventory: ['FISHING_NET', 'VINE'] }, // 30% male
    'Shell Fisher': { equipment: { head: 'STRAW_HAT', necklace: 'SHELL_NECKLACE', }, inventory: ['SHELL', 'SHELL', 'BASKET'] }, // 40% male

    // --- ANTIQUITY / MEDIEVAL ---
    'Master Navigator': { equipment: { head: 'FEATHER_CROWN', necklace: 'SHELL_NECKLACE', cloak: 'FEATHER_CLOAK' }, inventory: ['STICK_CHART', 'SMOKED_FISH', 'COCONUT'] }, // 90% male
    'Tattoo Artist': { equipment: {}, inventory: ['OCHRE_LUMP', 'SHARP_BONE', 'KNIFE'] }, // 70% male
    'Breadfruit Cultivator': { equipment: { main_hand: 'STICK' }, inventory: ['BREADFRUIT'] }, // 65% male
    'Kava Grower': { equipment: { }, inventory: ['KAVA_ROOT', 'WOODEN_BOWL'] }, // 80% male
    'Tapa Cloth Maker': { equipment: { main_hand: 'STONE_BEATER' }, inventory: ['BARK', 'DYE'] }, // 10% male
    'Coconut Gatherer': { equipment: { main_hand: 'KNIFE' }, inventory: ['COCONUT', 'ROPE'] }, // 75% male
    'Fish Trap Maker': { equipment: { }, inventory: ['BAMBOO', 'VINE', 'STONE'] }, // 85% male
    'Village Fisher': { equipment: { main_hand: 'FISHING_SPEAR' }, inventory: ['FISH_MEAT', 'SALT'] }, // 70% male
    'Mat Weaver': { equipment: { }, inventory: ['PANDANUS_LEAVES', 'VINE'] }, // 15% male
    'Pig Keeper': { equipment: { main_hand: 'STICK' }, inventory: ['TARO'], companions: ['PIG'] }, // 60% male
    
    // --- RENAISSANCE / EARLY MODERN ---
    'Sandalwood Cutter': { equipment: { head: 'STRAW_HAT', main_hand: 'AXE' }, inventory: ['SANDALWOOD_LOG', 'ROPE'] }, // 95% male
    'Beche-de-mer Diver': { equipment: { head: 'HEAD_WRAP' }, inventory: ['KNIFE', 'LEATHER_BAG'] }, // 90% male
    'Ship Provisioner': { equipment: { head: 'MERCHANT_CAP', torso: 'SIMPLE_TUNIC', }, inventory: ['SALT_PORK', 'BREAD', 'FRUIT'] }, // 70% male
    'Whaler': { equipment: { head: 'KNIT_CAP', torso: 'SIMPLE_TUNIC', main_hand: 'HARPOON' }, inventory: ['ROPE', 'KNIFE'] }, // 98% male
    'Pearl Diver': { equipment: { head: 'HEAD_WRAP' }, inventory: ['PEARL', 'KNIFE', 'BASKET'] }, // 50% male
    'Copra Worker': { equipment: { head: 'STRAW_HAT', main_hand: 'KNIFE' }, inventory: ['COCONUT', 'BUCKET'] }, // 60% male
    'Mission Worker': { equipment: { torso: 'SIMPLE_TUNIC', head: 'CLOTH_CAP' }, inventory: ['RELIGIOUS_TEXT', 'BREAD'] }, // 40% male
    'Trading Post Clerk': { equipment: { torso: 'FORMAL_SHIRT', head: 'BOWLER_HAT' }, inventory: ['COIN', 'BOOK', 'SCALE'] }, // 85% male
    
    // =======================================================================
    // == NORTH_AMERICAN_PRE_COLUMBIAN
    // =======================================================================
    // --- PREHISTORY ---
    'Corn Grower': { equipment: { head: 'STRAW_HAT', main_hand: 'DIGGING_STICK' }, inventory: ['CORN', 'BEANS', 'SQUASH'] }, // 40% male
    'Three Sisters Farmer': { equipment: { head: 'STRAW_HAT', main_hand: 'STONE_HOE' }, inventory: ['CORN', 'BEANS', 'SQUASH', 'TOBACCO'] }, // 35% male
    'Hide Worker': { equipment: { head: 'HEAD_WRAP', main_hand: 'STONE_KNIFE' }, inventory: ['HIDE', 'BONE_NEEDLE', 'SINEW'] }, // 20% male
    'Flintknapper': { equipment: { head: 'LEATHER_CAP', main_hand: 'HAMMERSTONE' }, inventory: ['FLINT_STONE', 'OBSIDIAN', 'STONE_KNIFE'] }, // 90% male
    'Basket Maker': { equipment: { head: 'HEAD_WRAP' }, inventory: ['REED_BUNDLE', 'VINE'] }, // 15% male
    'Pottery Maker': { equipment: { head: 'HEAD_WRAP' }, inventory: ['CLAY_LUMP', 'WOODEN_BOWL'] }, // 25% male
    'Buffalo Hunter': { equipment: { head: 'FEATHER_BAND', main_hand: 'COMPOSITE_BOW', off_hand: 'ARROW' }, inventory: ['SLING', 'SLING_STONE', 'SINEW', 'STONE_KNIFE', 'PEMMICAN', 'HIDE_TENT', 'SLEEPING_FUR', 'FIRE_DRILL', 'WATERSKIN'] }, // 95% male
    'Deer Hunter': { equipment: { head: 'FEATHER_BAND', main_hand: 'BOW', off_hand: 'ARROW' }, inventory: ['DEER_HIDE', 'VENISON', 'ANTLER'] }, // 90% male
    'Fish Smoker': { equipment: { head: 'HEAD_WRAP' }, inventory: ['SMOKED_FISH', 'SALT', 'STICK'] }, // 30% male
    'Berry Gatherer': { equipment: { head: 'HEAD_WRAP' }, inventory: ['WILD_BERRIES', 'PINE_NUTS', 'BIRCH_BARK_BASKET'] }, // 10% male
    'Root Digger': { equipment: { head: 'HEAD_WRAP', main_hand: 'DIGGING_STICK' }, inventory: ['WILD_ONIONS', 'CAMAS_ROOT', 'WOVEN_BASKET'] }, // 20% male
    'Wild Rice Harvester': { equipment: { head: 'HEAD_WRAP', main_hand: 'RICE_KNOCKER' }, inventory: ['WILD_RICE', 'BIRCH_BARK_CONTAINER'] }, // 30% male
    
    // --- ANTIQUITY/MEDIEVAL ---
    'Clan Mother': { equipment: { head: 'FEATHER_BAND', cloak: 'FUR_CLOAK', torso: 'DEER_HIDE' }, inventory: ['CORN', 'PRAYER_BEADS'] }, // 0% male
    'War Chief': { equipment: { head: 'FEATHER_CROWN', cloak: 'FEATHER_CLOAK', main_hand: 'TOMAHAWK', necklace: 'BRONZE_TORC' }, inventory: ['OCHRE_LUMP'] }, // 100% male
    'Medicine Person': { equipment: { head: 'FEATHER_CROWN', cloak: 'FEATHER_CLOAK', torso: 'DEER_HIDE', necklace: 'MEDICINE_BUNDLE' }, inventory: ['SAGE_BUNDLE', 'SWEETGRASS', 'CEDAR_BARK', 'TOBACCO'] }, // 60% male
    'Canoe Maker': { equipment: { head: 'LEATHER_CAP', main_hand: 'AXE' }, inventory: ['PINE_RESIN', 'BARK'] }, // 90% male
    'Wampum Maker': { equipment: { head: 'HEAD_WRAP', main_hand: 'STONE_DRILL' }, inventory: ['QUAHOG_SHELL', 'WHELK_SHELL', 'SINEW'] }, // 50% male
    'Pemmican Maker': { equipment: { head: 'HEAD_WRAP' }, inventory: ['DRIED_MEAT', 'WILD_BERRIES', 'RENDERED_FAT', 'RAWHIDE_POUCH'] }, // 20% male
    'Maple Syrup Maker': { equipment: { head: 'CLOTH_CAP', main_hand: 'STONE_AXE' }, inventory: ['MAPLE_SAP', 'BIRCH_BARK_BUCKET', 'HOT_STONES'] }, // 40% male
    'Fur Trader': { equipment: { torso: 'BEAVER_PELT_COAT', head: 'FUR_HAT', belt: 'BEADED_BELT' }, inventory: ['BEAVER_PELT', 'TRADE_BEADS', 'COPPER_KETTLE', 'TENT', 'BEDROLL', 'FLINT_AND_STEEL', 'WATERSKIN'], companions: ['HORSE'] }, // 85% male
    'Scout': { equipment: { head: 'FEATHER_BAND', main_hand: 'BOW', off_hand: 'ARROW' }, inventory: ['ROPE', 'KNIFE', 'LEAN_TO', 'STRAW_MAT', 'FIRE_DRILL', 'WATERSKIN'] }, // 95% male
    'Corn Grinder': { equipment: { head: 'HEAD_WRAP' }, inventory: ['CORN', 'METATE', 'MANO'] }, // 10% male
    'Turquoise Worker': { equipment: { head: 'HEADBAND', main_hand: 'STONE_DRILL' }, inventory: ['TURQUOISE', 'SHELL', 'COPPER_ORE'] }, // 70% male
    
    // =======================================================================
    // == NORTH_AMERICAN_COLONIAL
    // =======================================================================
    // --- RENAISSANCE/EARLY MODERN (Colonial Era) ---
    'Colonial Farmer': { equipment: { head: 'STRAW_HAT', cloak: 'WOOL_CLOAK', torso: 'WORK_SHIRT', main_hand: 'HARVEST_SICKLE' }, inventory: ['WHEAT', 'CORN', 'IRON_PLOW'] }, // 80% male
    'Blacksmith': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', main_hand: 'HAMMER' }, inventory: ['IRON_INGOT', 'TONGS', 'BELLOWS', 'HORSESHOE'] }, // 100% male
    'Innkeeper': { equipment: { torso: 'LEATHER_APRON', cloak: 'WOOL_CLOAK', head: 'CLOTH_CAP' }, inventory: ['BREAD', 'ALE', 'KEY'] }, // 70% male
    'Miller': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['WHEAT', 'RYE_FLOUR', 'GRAIN_QUERN', 'SCALE'] }, // 95% male
    'Tanner': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP' }, inventory: ['DEER_HIDE', 'OAK_BARK', 'LIME', 'TANNING_KNIFE'] }, // 90% male
    'Cooper': { equipment: { head: 'CLOTH_CAP', main_hand: 'HAMMER' }, inventory: ['OAK_STAVES', 'IRON_HOOP', 'ADZE', 'PITCH'] }, // 100% male
    'Schoolteacher': { equipment: { torso: 'WOOL_TUNIC', head: 'SCHOLAR_HAT' }, inventory: ['BOOK', 'SLATE_BOARD', 'QUILL', 'INK_POT'] }, // 30% male
    'Midwife': { equipment: { torso: 'SIMPLE_DRESS', head: 'BONNET' }, inventory: ['REFRESHING_HERB', 'LINEN_CLOTH', 'BIRTHING_STOOL', 'SCISSORS'] }, // 0% male
    'Frontier Settler': { equipment: { head: 'COONSKIN_CAP', cloak: 'FUR_CLOAK', main_hand: 'AXE' }, inventory: ['WHEAT_SEEDS', 'ROPE', 'FLINTLOCK_RIFLE', 'POWDER_HORN'] }, // 60% male
    'Cobbler': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['LEATHER', 'AWL', 'SHOE_LAST', 'WAX_THREAD'] }, // 95% male
    'Chandler': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['CANDLES', 'TALLOW', 'WICK_STRING', 'MOLD'] }, // 60% male
    'Wheelwright': { equipment: { head: 'LEATHER_CAP', main_hand: 'HAMMER' }, inventory: ['OAK_PLANK', 'IRON_RIM', 'SPOKE_SHAVE', 'HUB'] }, // 100% male
    
    // --- INDUSTRIAL ERA ---
    'Railroad Worker': { equipment: { torso: 'WORK_SHIRT', head: 'FLAT_CAP', main_hand: 'HAMMER' }, inventory: ['SPIKE', 'BREAD'] }, // 95% male
    'Gold Miner': { equipment: { head: 'LEATHER_CAP', torso: 'FLANNEL_SHIRT', main_hand: 'PICKAXE' }, inventory: ['PAN', 'GOLD_ORE'] }, // 98% male
    'Cowboy': { equipment: { head: 'COWBOY_HAT', torso: 'FLANNEL_SHIRT', cloak: 'WOOL_CLOAK', main_hand: 'LASSO' }, inventory: ['ROPE', 'JERKY'], companions: ['HORSE'] }, // 95% male
    'Saloon Keeper': { equipment: { torso: 'THREE_PIECE_SUIT', head: 'BOWLER_HAT' }, inventory: ['WHISKEY', 'COIN', 'KEY'] }, // 80% male
    'Telegraph Operator': { equipment: { torso: 'FORMAL_SHIRT', head: 'VISOR' }, inventory: ['PAPER', 'PEN'] }, // 70% male
    'Seamstress': { equipment: { head: 'BONNET' }, inventory: ['NEEDLE', 'COTTON', 'SCISSORS'] }, // 5% male
    'General Store Owner': { equipment: { torso: 'THREE_PIECE_SUIT', head: 'MERCHANT_CAP' }, inventory: ['SCALE', 'COIN', 'KEY'] }, // 75% male
    'Laundress': { equipment: { torso: 'SIMPLE_DRESS', head: 'HEAD_WRAP' }, inventory: ['SOAP', 'BUCKET', 'WASHBOARD'] }, // 5% male
    'Logger': { equipment: { torso: 'FLANNEL_SHIRT', head: 'KNIT_CAP', main_hand: 'AXE' }, inventory: ['ROPE', 'BREAD'] }, // 99% male
    
    // =======================================================================
    // == MISSING ESSENTIAL PROFESSIONS (All Eras/Cultures)
    // =======================================================================
    
    // --- FOOD PROCESSING ---
    'Baker': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP' }, inventory: ['FLOUR', 'BREAD', 'YEAST'] }, // 90% male
    'Butcher': { equipment: { torso: 'LEATHER_APRON', head: 'CLOTH_CAP', main_hand: 'KNIFE' }, inventory: ['MEAT', 'SALT', 'WHETSTONE'] }, // 95% male
    'Cook': { equipment: { torso: 'SIMPLE_TUNIC', head: 'CLOTH_CAP' }, inventory: ['SPICE_POUCH', 'WOODEN_BOWL', 'WOODEN_SPOON'] }, // 40% male
    
    // --- CONSTRUCTION ---
    'Carpenter': { equipment: { torso: 'LEATHER_APRON', head: 'LEATHER_CAP', main_hand: 'AXE' }, inventory: ['STICK', 'HAMMER', 'ROPE'] }, // 100% male
    'Builder': { equipment: { torso: 'WORK_SHIRT', head: 'LEATHER_CAP', main_hand: 'HAMMER' }, inventory: ['STONE_BLOCK', 'ROPE', 'STONE_CHISEL'] }, // 95% male
    'Architect': { equipment: { torso: 'FORMAL_SHIRT', head: 'SCHOLAR_HAT' }, inventory: ['PARCHMENT_ROLL', 'QUILL', 'SCALE'] }, // 90% male
    
    // --- ADMINISTRATION & COMMERCE ---
    'Banker': { equipment: { torso: 'FINE_CLOTHES', head: 'MERCHANT_CAP', belt: 'PURSE' }, inventory: ['COIN', 'BOOK', 'SCALE'] }, // 95% male
    'Clerk': { equipment: { torso: 'SIMPLE_TUNIC', head: 'CLOTH_CAP' }, inventory: ['QUILL', 'INK_POT', 'PARCHMENT'] }, // 80% male
    'Courier': { equipment: { head: 'LEATHER_CAP', feet: 'LEATHER_BOOTS' }, inventory: ['SCROLL', 'LEATHER_BAG'], companions: ['HORSE'] }, // 90% male
    
    // --- INTELLECTUAL/RELIGIOUS ---
    'Astrologer': { equipment: { torso: 'SIMPLE_ROBE', head: 'CLOTH_HOOD' }, inventory: ['SCROLL_OF_KNOWLEDGE', 'SCROLL', 'BOOK'] }, // 85% male

    // =======================================================================
    // == MODERN & FUTURE (SHARED)
    // =======================================================================
    'Surgeon': { equipment: { torso: 'SIMPLE_ROBE', head: 'SURGICAL_CAP' }, inventory: ['KNIFE', 'SYRINGE', 'HEALING_POTION', 'BANDAGE'] },
    'Police Officer': { equipment: { torso: 'FORMAL_SHIRT', head: 'POLICE_CAP', feet: 'DRESS_BOOTS', main_hand: 'STICK' }, inventory: ['HANDCUFFS', 'FLASHLIGHT'] },
    'Electrician': { equipment: { torso: 'WORK_SHIRT', head: 'HARDHAT', belt: 'PURSE' }, inventory: ['COPPER_INGOT', 'TONGS'] },
    'Plumber': { equipment: { torso: 'WORK_SHIRT', head: 'BASEBALL_CAP', main_hand: 'HAMMER' }, inventory: ['LEAD_BAR', 'TONGS'] },
    'Miner': { equipment: { head: 'LEATHER_CAP', torso: 'WORK_SHIRT', feet: 'WORK_BOOTS', main_hand: 'STEEL_PICKAXE' }, inventory: ['FLASHLIGHT', 'BREAD', 'COAL'] },
    'Tech CEO': { equipment: { torso: 'DESIGNER_COAT', head: 'GLASSES' }, inventory: ['SMARTPHONE', 'SIMPLE_RING', 'KEY'] },
    'Investment Banker': { equipment: { torso: 'THREE_PIECE_SUIT', head: 'GLASSES' }, inventory: ['GOLD_BAR', 'SMARTPHONE', 'COIN'] },
    'Software Developer': { equipment: { torso: 'T_SHIRT', head: 'BEANIE' }, inventory: ['SMARTPHONE', 'SCROLL_OF_KNOWLEDGE', 'COFFEE_BEANS'] },
    'Marketing Manager': { equipment: { torso: 'BLAZER', head: 'GLASSES' }, inventory: ['SMARTPHONE', 'PAPER', 'PEN'] },
    'Physical Therapist': { equipment: { torso: 'POLO_SHIRT', head: 'VISOR' }, inventory: ['BANDAGE', 'MEDICINAL_HERBS'] },
    'Real Estate Agent': { equipment: { torso: 'SUIT', head: 'SUNGLASSES', belt: 'PURSE' }, inventory: ['KEY', 'PAPER', 'SMARTPHONE'] },
    'Dental Hygienist': { equipment: { torso: 'BLOUSE', head: 'SURGICAL_CAP' }, inventory: ['METAL_SCRAPER', 'POLISH'] },
    'Handyman': { equipment: { torso: 'WORK_SHIRT', head: 'BASEBALL_CAP', main_hand: 'HAMMER' }, inventory: ['NAILS', 'ROPE', 'WRENCH'] },
    'Uber Driver': { equipment: { torso: 'T_SHIRT', head: 'BASEBALL_CAP', main_hand: 'KATANA' }, inventory: ['SMARTPHONE', 'SYRINGE'], companions: ['CAR'] },
    'Delivery Driver': { equipment: { torso: 'T_SHIRT', head: 'BASEBALL_CAP' }, inventory: ['LEATHER_BAG', 'SMARTPHONE'] },
    'Barista': { equipment: { torso: 'LEATHER_APRON', head: 'VISOR' }, inventory: ['WOODEN_BOWL', 'COFFEE_BEANS', 'RAW_SUGAR'] },
    'Customer Service Rep': { equipment: { torso: 'BLOUSE', head: 'HEADSET' }, inventory: ['HEADSET', 'PAPER'] },
    'Personal Trainer': { equipment: { torso: 'TANK_TOP', head: 'SWEATBAND' }, inventory: ['FRUIT', 'BOTTLE_OF_WATER'] },
    'Hair Stylist': { equipment: { torso: 'BLOUSE', head: 'GLASSES' }, inventory: ['SCISSORS', 'COMB'] },
    'Hotel Clerk': { equipment: { torso: 'SUIT', head: 'GLASSES' }, inventory: ['KEY', 'BOOK'] },
    'Grocery Clerk': { equipment: { torso: 'LEATHER_APRON', head: 'VISOR' }, inventory: ['FRUIT', 'BREAD'] },
    'Call Center Worker': { equipment: { torso: 'SUIT', head: 'HEADSET' }, inventory: ['HEADSET', 'PAPER'] },
    'Content Creator': { equipment: { torso: 'T_SHIRT', head: 'SNAPBACK' }, inventory: ['SMARTPHONE','SYRINGE', 'COFFEE_BEANS'] },

    // =======================================================================
    // == MEDIEVAL EUROPEAN RANGED SPECIALISTS
    // =======================================================================
    'Crossbow Mercenary': { equipment: { torso: 'LEATHER_APRON', cloak: 'WOOL_CLOAK', feet: 'LEATHER_BOOTS', main_hand: 'CROSSBOW', off_hand: 'CROSSBOW_BOLT' }, inventory: ['CROSSBOW_BOLT', 'CROSSBOW_BOLT', 'CROSSBOW_BOLT', 'COIN'], companions: [] }, // 100% male
    'English Longbowman': { equipment: { torso: 'WOOL_TUNIC', cloak: 'WOOL_CLOAK', feet: 'LEATHER_BOOTS', main_hand: 'COMPOSITE_BOW', off_hand: 'ARROW' }, inventory: ['ARROW', 'ARROW', 'ARROW', 'ARROW', 'BREAD'], companions: [] }, // 100% male
    'Castle Archer': { equipment: { torso: 'LEATHER_APRON', cloak: 'WOOL_CLOAK', feet: 'LEATHER_BOOTS', main_hand: 'SIMPLE_BOW', off_hand: 'ARROW' }, inventory: ['ARROW', 'ARROW', 'ARROW', 'BREAD'], companions: [] }, // 95% male

    // =======================================================================
    // == OUTLAW & BANDIT PROFESSIONS - MEDIEVAL/RENAISSANCE
    // =======================================================================
    'Bandit': { equipment: { torso: 'LEATHER_JERKIN', feet: 'LEATHER_BOOTS', main_hand: 'SWORD', off_hand: 'THROWING_KNIFE' }, inventory: ['THROWING_KNIFE', 'BREAD', 'COIN', 'ROPE'], companions: [] }, // 95% male
    'Brigand': { equipment: { torso: 'LEATHER_JERKIN', cloak: 'WOOL_CLOAK', feet: 'LEATHER_BOOTS', main_hand: 'CLUB', off_hand: 'KNIFE' }, inventory: ['ROPE', 'BREAD', 'COIN'], companions: [] }, // 95% male
    'Cutpurse': { equipment: { torso: 'SIMPLE_TUNIC', cloak: 'WOOL_CLOAK', feet: 'LEATHER_BOOTS', main_hand: 'KNIFE' }, inventory: ['COIN', 'COIN', 'ROPE'], companions: [] },
    'Desperado': { equipment: { head: 'COWBOY_HAT', cloak: 'WOOL_CLOAK', torso: 'LEATHER_VEST', feet: 'COWBOY_BOOTS', main_hand: 'PISTOL', belt: 'GUNBELT' }, inventory: ['BULLETS', 'BULLETS', 'COIN', 'WHISKEY'], companions: ['HORSE'] }, // 100% male
    'Highwayman': { equipment: { head: 'TRICORN_HAT', cloak: 'WOOL_CLOAK', torso: 'COAT', feet: 'RIDING_BOOTS', main_hand: 'FLINTLOCK', off_hand: 'SWORD' }, inventory: ['GUNPOWDER', 'COIN', 'ROPE', 'MASK'], companions: ['HORSE'] }, // 100% male

    // =======================================================================
    // == INDUSTRIAL ERA OUTLAWS & REVOLUTIONARIES
    // =======================================================================
    'Footpad': { equipment: { head: 'FEDORA', torso: 'COAT', feet: 'WORN_BOOTS', main_hand: 'KNIFE' }, inventory: ['COIN', 'ROPE'], companions: [] },
    'Peaky Blinder': { equipment: { head: 'FLAT_CAP', torso: 'VEST', feet: 'LEATHER_BOOTS', main_hand: 'RAZOR' }, inventory: ['COIN', 'WHISKEY', 'CIGARETTES'], companions: [] },
    'Resurrectionist': { equipment: { head: 'HOMBURG', torso: 'COAT', feet: 'WORK_BOOTS', main_hand: 'SHOVEL' }, inventory: ['ROPE', 'SACK', 'LANTERN'], companions: [] },
    'Chartist': { equipment: { torso: 'WORKER_SHIRT', feet: 'WORK_BOOTS' }, inventory: ['PAMPHLET', 'QUILL', 'INK_POT'], companions: [] },
    'Luddite': { equipment: { torso: 'WORKER_SHIRT', feet: 'WORK_BOOTS', main_hand: 'HAMMER' }, inventory: ['CLOTH_MASK', 'ROPE'], companions: [] },
    'Fenian': { equipment: { torso: 'THREE_PIECE_SUIT', feet: 'LEATHER_BOOTS', main_hand: 'PISTOL' }, inventory: ['BULLETS', 'PAMPHLET', 'COIN'], companions: [] },
    'Anarchist': { equipment: { torso: 'COAT', feet: 'LEATHER_BOOTS' }, inventory: ['BOMB', 'PAMPHLET', 'MASK'], companions: [] },

    // East Asian Industrial Era
    'Ronin': { equipment: { torso: 'KIMONO', feet: 'SANDALS', main_hand: 'KATANA' }, inventory: ['RICE_BALL', 'SAKE', 'COIN'], companions: [] },
    'Yakuza': { equipment: { torso: 'KIMONO', feet: 'SANDALS', main_hand: 'TANTO' }, inventory: ['SHURIKEN', 'SHURIKEN', 'SAKE', 'COIN', 'DICE'], companions: [] },
    'Opium Smuggler': { equipment: { torso: 'SIMPLE_TUNIC', cloak: 'FLAX_CLOAK', feet: 'SANDALS' }, inventory: ['OPIUM', 'COIN', 'PIPE'], companions: ['DONKEY'] },
    'Triad Member': { equipment: { torso: 'SIMPLE_TUNIC', feet: 'SANDALS', main_hand: 'KNIFE' }, inventory: ['COIN', 'INCENSE', 'DICE'], companions: [] },
    'Boxer Rebel': { equipment: { torso: 'SIMPLE_TUNIC', feet: 'CLOTH_SHOES', main_hand: 'STICK' }, inventory: ['TALISMAN', 'RICE', 'BANDANA'], companions: [] },
    'Taiping Soldier': { equipment: { torso: 'UNIFORM', feet: 'CLOTH_SHOES', main_hand: 'SWORD' }, inventory: ['BIBLE', 'RICE', 'BANDAGE'], companions: [] },
    'Black Flag Fighter': { equipment: { torso: 'BLACK_TUNIC', feet: 'SANDALS', main_hand: 'SPEAR' }, inventory: ['FLAG', 'RICE', 'COIN'], companions: [] },

    // =======================================================================
    // == MODERN ERA (1950-2000) CRIMINALS & REVOLUTIONARIES
    // =======================================================================
    'Mobster': { equipment: { head: 'FEDORA', torso: 'THREE_PIECE_SUIT', cloak: 'WOOL_CLOAK', feet: 'DRESS_SHOES', main_hand: 'TOMMY_GUN' }, inventory: ['BULLETS', 'CIGARETTES', 'COIN', 'BRASS_KNUCKLES'], companions: ['CAR'] },
    'Drug Dealer': { equipment: { head: 'FEDORA', torso: 'TRACK_SUIT', feet: 'SNEAKERS' }, inventory: ['DRUGS', 'BURNER_PHONE', 'CASH', 'KNIFE'], companions: [] },
    'Pickpocket': { equipment: { head: 'FEDORA', torso: 'JACKET', feet: 'SNEAKERS' }, inventory: ['WALLET', 'WATCH', 'KNIFE'], companions: [] },
    'Militant': { equipment: { torso: 'LEATHER_JACKET', head: 'BERET', feet: 'BOOTS', main_hand: 'SHOTGUN' }, inventory: ['SHELLS', 'PAMPHLET', 'AFRO_PICK'], companions: [] },
    'Revolutionary': { equipment: { head: 'COMBAT_HELMET', torso: 'JACKET', feet: 'BOOTS', main_hand: 'ARMALITE' }, inventory: ['BULLETS', 'BALACLAVA', 'COIN'], companions: [] },
    'Red Brigade': { equipment: { head: 'COMBAT_HELMET', torso: 'JACKET', feet: 'BOOTS', main_hand: 'PISTOL' }, inventory: ['BULLETS', 'MANIFESTO', 'MASK'], companions: [] },
    'Guerrilla Fighter': { equipment: { head: 'COMBAT_HELMET', torso: 'CAMO_JACKET', feet: 'COMBAT_BOOTS', main_hand: 'AK47' }, inventory: ['BULLETS', 'RATIONS', 'COMPASS'], companions: [] },
    'Smuggler': { equipment: { head: 'FEDORA', torso: 'JACKET', feet: 'BOOTS' }, inventory: ['CONTRABAND', 'FAKE_ID', 'CASH', 'MAP'], companions: ['TRUCK'] },

    // =======================================================================
    // == FUTURE ERA (2000-2025) CRIMINALS & ACTIVISTS
    // =======================================================================
    'Cybercriminal': { equipment: { torso: 'HOODIE', head: 'BEANIE', feet: 'SNEAKERS' }, inventory: ['LAPTOP', 'USB_DRIVE', 'BITCOIN_WALLET', 'ENERGY_DRINK'], companions: [] },
    'Crypto Scammer': { equipment: { torso: 'DESIGNER_SHIRT', head: 'SUNGLASSES', feet: 'BOOTS' }, inventory: ['SMARTPHONE', 'FAKE_CRYPTO', 'CASH'], companions: [] },
    'Cartel Member': { equipment: { torso: 'DESIGNER_SHIRT', head: 'COWBOY_HAT', feet: 'BOOTS', main_hand: 'GOLD_PLATED_GUN' }, inventory: ['BULLETS', 'BURNER_PHONE', 'CASH', 'COCAINE'], companions: ['SUV'] },
    'Human Trafficker': { equipment: { torso: 'SUIT', head: 'SUNGLASSES', feet: 'DRESS_SHOES' }, inventory: ['FAKE_PASSPORTS', 'BURNER_PHONE', 'CASH', 'ZIP_TIES'], companions: ['VAN'] },
    'Climate Activist': { equipment: { torso: 'T_SHIRT', head: 'BEANIE', feet: 'SNEAKERS' }, inventory: ['SIGN', 'SUPERGLUE', 'SMARTPHONE', 'WATER_BOTTLE'], companions: [] },

    'Anonymous Hacker': { equipment: { torso: 'HOODIE', head: 'GUY_FAWKES_MASK', feet: 'SNEAKERS' }, inventory: ['LAPTOP', 'USB_DRIVES', 'ENCRYPTED_PHONE'], companions: [] },
    'Fentanyl Dealer': { equipment: { torso: 'HOODIE', head: 'BEANIE', feet: 'SNEAKERS' }, inventory: ['FENTANYL', 'BURNER_PHONE', 'CASH', 'NARCAN'], companions: [] },

    // =======================================================================
    // == CULTURAL ZONE SPECIFIC SLINGERS
    // =======================================================================
    'Funditor': { equipment: { torso: 'TUNIC', feet: 'SANDALS', main_hand: 'SLING', off_hand: 'SLING_STONE' }, inventory: ['SLING_STONE', 'SLING_STONE', 'SLING_STONE', 'BREAD'], companions: [] }, // Roman slinger
    'Maqla': { equipment: { torso: 'DESERT_ROBE', feet: 'SANDALS', main_hand: 'SLING', off_hand: 'SLING_STONE' }, inventory: ['SLING_STONE', 'SLING_STONE', 'DATES', 'GOURD_FLASK'], companions: [] }, // Middle Eastern slinger
    'Ishihori': { equipment: { torso: 'HIDE_TUNIC', feet: 'HIDE_BOOTS', main_hand: 'SLING', off_hand: 'SMOOTH_STONE' }, inventory: ['SMOOTH_STONE', 'SMOOTH_STONE', 'MEAT', 'ROPE'], companions: [] }, // African stone thrower

    // =======================================================================
    // == SPECIALIZED RANGED WEAPON PROFESSIONS
    // =======================================================================
    'Amazon Warrior': { equipment: { torso: 'LEATHER_JERKIN', feet: 'LEATHER_BOOTS', main_hand: 'BLOWGUN', off_hand: 'BLOWGUN_DART' }, inventory: ['BLOWGUN_DART', 'BLOWGUN_DART', 'BLOWGUN_DART', 'POISON', 'KNIFE'], companions: [] },
    'Sikh Warrior': { equipment: { head: 'TURBAN', torso: 'CHAINMAIL', feet: 'LEATHER_BOOTS', main_hand: 'SWORD' }, inventory: ['CHAKRAM', 'CHAKRAM', 'CHAKRAM', 'DAGGER'], companions: [] },
    'Ninja': { equipment: { torso: 'BLACK_TUNIC', feet: 'TABI_SOCKS', main_hand: 'NINJATO' }, inventory: ['SHURIKEN', 'SHURIKEN', 'SHURIKEN', 'SMOKE_BOMB', 'ROPE'], companions: [] },
    'Gaucho': { equipment: { head: 'WIDE_BRIMMED_HAT', torso: 'PONCHO', feet: 'LEATHER_BOOTS', main_hand: 'KNIFE' }, inventory: ['BOLAS', 'BOLAS', 'ROPE', 'MEAT'], companions: ['HORSE'] },
    'Viking Raider': { equipment: { head: 'HORNED_HELMET', torso: 'CHAINMAIL', feet: 'LEATHER_BOOTS', main_hand: 'BATTLEAXE', off_hand: 'SHIELD' }, inventory: ['THROWING_AXE', 'THROWING_AXE', 'MEAD', 'ROPE'], companions: [] },
    'Apache Scout': { equipment: { torso: 'BUCKSKIN_SHIRT', feet: 'MOCCASINS', main_hand: 'SHORTBOW', off_hand: 'ARROW' }, inventory: ['ARROW', 'ARROW', 'TOMAHAWK', 'PEMMICAN', 'HIDE_TENT', 'SLEEPING_FUR', 'FIRE_DRILL', 'WATERSKIN'], companions: ['HORSE'] },
    'Mongol Archer': { equipment: { head: 'FUR_HAT', torso: 'LEATHER_ARMOR', feet: 'LEATHER_BOOTS', main_hand: 'COMPOSITE_BOW', off_hand: 'ARROW' }, inventory: ['ARROW', 'ARROW', 'ARROW', 'KUMISS', 'DRIED_MEAT'], companions: ['HORSE'] },
    'Maori Warrior': { equipment: { cloak: 'FLAX_CLOAK', feet: 'BAREFOOT', main_hand: 'MERE' }, inventory: ['THROWING_STICK', 'JADE_PENDANT', 'SWEET_POTATO'], companions: [] },
    'Byzantine Archer': { equipment: { head: 'HELMET', torso: 'SCALE_ARMOR', feet: 'LEATHER_BOOTS', main_hand: 'CROSSBOW', off_hand: 'CROSSBOW_BOLT' }, inventory: ['CROSSBOW_BOLT', 'CROSSBOW_BOLT', 'GREEK_FIRE', 'BREAD'], companions: [] },
    'Zulu Warrior': { equipment: { head: 'LEOPARD_HEADBAND', torso: 'HIDE_TUNIC', feet: 'BAREFOOT', main_hand: 'IKLWA', off_hand: 'COW_HIDE_SHIELD' }, inventory: ['ASSEGAI', 'ASSEGAI', 'BILTONG', 'GOURD_FLASK'], companions: [] },
    'Persian Archer': { equipment: { head: 'CONICAL_HELMET', torso: 'LAMELLAR_ARMOR', feet: 'LEATHER_BOOTS', main_hand: 'COMPOSITE_BOW', off_hand: 'ARROW' }, inventory: ['ARROW', 'ARROW', 'SCIMITAR', 'DATES'], companions: [] },
    'Inca Slinger': { equipment: { head: 'WOOL_CAP', torso: 'LLAMA_WOOL_TUNIC', feet: 'SANDALS', main_hand: 'SLING', off_hand: 'LEAD_BULLET' }, inventory: ['LEAD_BULLET', 'LEAD_BULLET', 'LEAD_BULLET', 'COCA_LEAVES', 'POTATO'], companions: ['LLAMA'] },

    // =======================================================================
    // == COMPREHENSIVE MILITARY PROFESSIONS
    // =======================================================================
    // Ancient/Classical
    'Legionary': { equipment: { torso: 'SCALE_ARMOR', cloak: 'ROMAN_CLOAK', head: 'HELMET', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*', off_hand: 'WOODEN_SHIELD' }, inventory: ['BREAD', 'WATERSKIN', 'DICE'], companions: [] },
    'Centurion': { equipment: { torso: 'SCALE_ARMOR', cloak: 'OFFICER_CAPE', head: 'HELMET', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*', off_hand: 'WOODEN_SHIELD' }, inventory: ['WINE', 'WATERSKIN', 'WHETSTONE'], companions: [] },
    'Hoplite': { equipment: { torso: 'BRONZE_ARMOR', cloak: 'MILITARY_CLOAK', head: 'LEATHER_CAP', feet: 'SANDALS', main_hand: '*CONTEXTUAL*', off_hand: 'WOODEN_SHIELD' }, inventory: ['OLIVES', 'BREAD', 'WINE'], companions: [] },
    'Auxiliary': { equipment: { torso: 'LEATHER_VEST', cloak: 'MILITARY_CLOAK', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'ROPE'], companions: [] },

    // Medieval
    'Knight': { equipment: { torso: 'MAIL_SHIRT', cloak: 'KNIGHT_SURCOAT', head: 'HELMET', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*', off_hand: 'WOODEN_SHIELD' }, inventory: ['BREAD', 'WINE', 'WHETSTONE'], companions: ['HORSE'] },
    'Man-at-Arms': { equipment: { torso: 'MAIL_SHIRT', cloak: 'MILITARY_CLOAK', head: 'HELMET', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'ALE', 'ROPE'], companions: [] },
    'Crossbowman': { equipment: { torso: 'PADDED_ARMOR', cloak: 'MILITARY_CLOAK', head: 'HELMET', feet: 'LEATHER_BOOTS', main_hand: 'CROSSBOW', off_hand: 'BOLT' }, inventory: ['BOLT', 'BOLT', 'BREAD', 'KNIFE'], companions: [] },
    'Sergeant': { equipment: { torso: 'STUDDED_LEATHER', cloak: 'MILITARY_CLOAK', head: 'HELMET', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'CHEESE', 'ROPE'], companions: [] },
    'Squire': { equipment: { torso: 'STUDDED_LEATHER', cloak: 'MILITARY_CLOAK', head: 'HELMET', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'CHEESE', 'ROPE'], companions: [] },

    // Asian Military
    'Samurai': { equipment: { torso: 'LACQUERED_ARMOR', cloak: 'SAMURAI_SURCOAT', head: 'HELMET', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['RICE_BALL', 'SAKE', 'WHETSTONE'], companions: ['HORSE'] },
    'Ashigaru': { equipment: { torso: 'PADDED_ARMOR', cloak: 'MILITARY_CLOAK', head: 'LEATHER_CAP', feet: 'STRAW_SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['RICE', 'WATER'], companions: [] },
    'Retainer': { equipment: { torso: 'PADDED_ARMOR', cloak: 'MILITARY_CLOAK', head: 'LEATHER_CAP', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['RICE', 'WATER'], companions: [] },
    'Mongol Warrior': { equipment: { torso: 'LAMELLAR_ARMOR', cloak: 'FUR_MILITARY_CLOAK', head: 'FUR_HAT', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['DRIED_MEAT', 'KUMISS'], companions: ['HORSE'] },
    'Chinese Guardsman': { equipment: { torso: 'SCALE_ARMOR', cloak: 'MILITARY_CLOAK', head: 'LEATHER_CAP', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['RICE', 'TEA'], companions: [] },

    // Other Cultural Military
    'Mamluk': { equipment: { torso: 'MAIL_SHIRT', cloak: 'DESERT_MILITARY_CLOAK', head: 'TURBAN', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['DATES', 'WATERSKIN'], companions: ['HORSE'] },
    'Janissary': { equipment: { torso: 'MAIL_SHIRT', cloak: 'MILITARY_CLOAK', head: 'FELT_CAP', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'COFFEE'], companions: [] },
    'Viking Warrior': { equipment: { torso: 'MAIL_SHIRT', cloak: 'FUR_MILITARY_CLOAK', head: 'LEATHER_CAP', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*', off_hand: 'WOODEN_SHIELD' }, inventory: ['MEAT', 'MEAD'], companions: [] },
    'Aztec Warrior': { equipment: { torso: 'PADDED_ARMOR', cloak: 'FEATHER_CLOAK', feet: 'SANDALS', main_hand: '*CONTEXTUAL*', off_hand: 'WOODEN_SHIELD' }, inventory: ['MAIZE', 'CHOCOLATE'], companions: [] },

    // Guards and Watch
    'City Guard': { equipment: { torso: 'STUDDED_LEATHER', cloak: 'MILITARY_CLOAK', head: 'LEATHER_CAP', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'WHISTLE', 'ROPE'], companions: [] },
    'Palace Guard': { equipment: { torso: 'SCALE_ARMOR', cloak: 'OFFICER_CAPE', head: 'LEATHER_CAP', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'WINE'], companions: [] },
    'Mercenary': { equipment: { torso: 'LEATHER_VEST', cloak: 'CAMPAIGN_CLOAK', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'COIN', 'DICE'], companions: [] },
    'Soldier': { equipment: { torso: 'PADDED_ARMOR', cloak: 'MILITARY_CLOAK', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'WATER'], companions: [] }
};