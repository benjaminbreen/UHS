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
    // == FALLBACK & GENERIC ROLES (Using procedural weapon selection)
    // =======================================================================
    'Wanderer': { equipment: { head: 'STRAW_HAT', legs: 'WORKER_TROUSERS', torso: 'WOOL_TUNIC',  feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'GOURD_FLASK', 'MAP'],  companions: ['DOG'] },
    'Artisan': { equipment: { torso: 'LEATHER_APRON', legs: 'WORKER_TROUSERS',  feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['HAMMER', 'KNIFE', 'ROPE'] },
    'Commoner': { equipment: { torso: 'SIMPLE_TUNIC',  legs: 'WORKER_HOSE', feet: 'SANDALS' }, inventory: ['BREAD', 'WOODEN_BOWL'] },
    'Laborer': { equipment: { torso: 'SIMPLE_TUNIC', legs: 'WORKER_TROUSERS', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'ROPE'] },
    'Peasant': { equipment: { torso: 'PEASANT_TUNIC', feet: 'SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD_CRUST', 'VEGETABLES'] },
    'Warrior': { equipment: { torso: 'LEATHER_APRON', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['MEAT', 'WHETSTONE'],  companions: ['DOG'] },
    'Caretaker': { equipment: { torso: 'SIMPLE_ROBE', main_hand: '*CONTEXTUAL*' }, inventory: ['HERB_BUNDLE', 'BREAD', 'BANDAGE'] },
    'Mother': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['BREAD', 'SIMPLE_RING', 'FRUIT'] },

    // =======================================================================
    // == HERDERS & ANIMAL-RELATED (Using procedural weapon selection)
    // =======================================================================
    'Shepherd': { equipment: { main_hand: '*CONTEXTUAL*', torso: 'WOOL_TUNIC' }, inventory: ['BREAD', 'FLUTE'], companions: ['SHEEP', 'DOG'] },
    'Farmer': { equipment: { head: 'STRAW_HAT', main_hand: '*CONTEXTUAL*', torso: 'LEATHER_APRON' }, inventory: ['BARLEY', 'WHEAT', 'GRAIN_FLAIL'], companions: ['COW'] },
    'Goat Herder': { equipment: { main_hand: '*CONTEXTUAL*', torso: 'WOOL_TUNIC' }, inventory: ['CHEESE'], companions: ['GOAT', 'GOAT', 'GOAT'] },
    'Cattle Herder': { equipment: { main_hand: '*CONTEXTUAL*', torso: 'WOOL_TUNIC' }, inventory: ['ROPE', 'BREAD'], companions: ['COW', 'COW'] },
    'Camel Herder': { equipment: { main_hand: '*CONTEXTUAL*', torso: 'DESERT_CLOAK', head: 'KEFFIYEH' }, inventory: ['DATES', 'GOURD_FLASK'], companions: ['CAMEL', 'CAMEL'] },
    'Duck Herder': { equipment: { main_hand: '*CONTEXTUAL*', torso: 'WOOL_TUNIC' }, inventory: ['BREAD'], companions: ['DUCK', 'DUCK', 'DUCK'] },
    'Llama Herder': { equipment: { head: 'CHULLO_HAT', torso: 'PONCHO', main_hand: '*CONTEXTUAL*' }, inventory: ['POTATO', 'ROPE'], companions: ['LLAMA', 'LLAMA'] },
    'Ranchero': { equipment: { head: 'WIDE_BRIM_HAT', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['SALT_PORK', 'GOURD_FLASK'], companions: ['COW', 'HORSE'] },
    'Horse Trainer': { equipment: { torso: 'LEATHER_APRON', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['ROPE', 'FRUIT'], companions: ['HORSE', 'HORSE'] },
    
    // =======================================================================
    // == EUROPEAN
    // =======================================================================

    // --- PREHISTORY (Using procedural weapon selection) ---
    'Hunter': { equipment: { torso: 'DEER_HIDE', feet: 'HIDE_BOOTS', main_hand: '*CONTEXTUAL*' }, inventory: ['FLINT_STONE', 'MEAT', 'VINE'], companions: ['DOG'] },
    'Gatherer': { equipment: { torso: 'DEER_HIDE', main_hand: '*CONTEXTUAL*' }, inventory: ['WILD_BERRIES', 'MUSHROOM', 'ROOT', 'LEATHER_BAG'] },
    'Shaman': { equipment: { head: 'WOLF_PELT', torso: 'FUR_CLOAK', main_hand: '*CONTEXTUAL*' }, inventory: ['HERB_BUNDLE', 'SMOOTH_STONE', 'BONES', 'OWL_FEATHER'] },
    'Toolmaker': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['FLINT_STONE', 'STICK', 'VINE', 'HAMMER'] },
    'Healer': { equipment: { torso: 'DEER_HIDE', main_hand: '*CONTEXTUAL*' }, inventory: ['MEDICINAL_HERBS', 'HERB_BUNDLE', 'SMOOTH_STONE'] },
    'Cave Painter': { equipment: { torso: 'DEER_HIDE', main_hand: '*CONTEXTUAL*' }, inventory: ['OCHRE_LUMP', 'COAL', 'CLAY_LUMP'] },
    'Fire Keeper': { equipment: { torso: 'DEER_HIDE', main_hand: '*CONTEXTUAL*' }, inventory: ['STICK', 'DRY_LEAVES', 'FLINT_STONE'] },
    'Skin Dresser': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['DEER_HIDE', 'FLINT_STONE', 'KNIFE'] },
    'Fisher': { equipment: { main_hand: '*CONTEXTUAL*' }, inventory: ['FISH_MEAT', 'VINE', 'EARTHWORM'] },
    'Bone Carver': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['BONES', 'FLINT_STONE', 'KNIFE'] },

    // --- ANTIQUITY (Using procedural weapon selection) ---
    'Merchant': { equipment: { torso: 'CITIZEN_TOGA', belt: 'PURSE', main_hand: '*CONTEXTUAL*' }, inventory: ['SCALE', 'COIN', 'AMPHORA', 'OLIVES'] }, // Requires AMPHORA
    'Physician': { equipment: { torso: 'SIMPLE_ROBE', main_hand: '*CONTEXTUAL*' }, inventory: ['MEDICINAL_HERBS', 'BANDAGE', 'SCROLL', 'BRONZE_PIN'] },
    'Scribe': { equipment: { torso: 'SIMPLE_ROBE', main_hand: '*CONTEXTUAL*' }, inventory: ['SCROLL', 'QUILL', 'INK_POT', 'PARCHMENT_ROLL'] },
    'Lawyer': { equipment: { torso: 'CITIZEN_TOGA', main_hand: '*CONTEXTUAL*' }, inventory: ['BOOK', 'SCROLL', 'QUILL', 'COIN'] },
    'Teacher': { equipment: { torso: 'SIMPLE_ROBE', main_hand: '*CONTEXTUAL*' }, inventory: ['BOOK', 'SCROLL', 'STICK'] },
    'Architect': { equipment: { torso: 'SIMPLE_ROBE', main_hand: '*CONTEXTUAL*' }, inventory: ['PARCHMENT_ROLL', 'SCALE', 'STONE_CHISEL'] },
    'Legionary': { equipment: { torso: 'LEATHER_APRON', feet: 'MILITARY_SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'SALT'] },
    'Auxiliary': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['SMOOTH_STONE', 'BREAD'] },
    'Centurion': { equipment: { head: 'BATTLE_HELMET', torso: 'LEATHER_APRON', feet: 'MILITARY_SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'WHETSTONE'] },
    'Sailor': { equipment: { torso: 'WOOL_TUNIC', legs: 'SAILOR_PANTS'}, inventory: ['ROPE', 'SMOKED_FISH', 'GOURD_FLASK'] },
    'Engineer': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['HAMMER', 'ROPE', 'PARCHMENT_ROLL'] },
    'Weaver': { equipment: { torso: 'PEPLOS', main_hand: 'SPINDLE' }, inventory: ['COTTON', 'WOOL_CARDERS'] },
    'Carpenter': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['HAMMER', 'NAILS', 'STICK'] },
    'Stonemason': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['STONE_CHISEL', 'STONE_BLOCK'] },
    'Glassblower': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['GLASS_BOTTLE', 'BELLOWS', 'PINE_RESIN'] },
    'Jeweler': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['SILVER_ORE', 'HAMMER', 'SIMPLE_RING'] },
    'Tanner': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['COW_HIDE', 'SALT', 'KNIFE'] },
    'Fuller': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['BUCKET', 'SOAP'] },
    'Slave': { equipment: { torso: 'SLAVE_TUNIC', main_hand: '*CONTEXTUAL*' }, inventory: [] },
    'Vintner': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['GRAPES', 'WOODEN_BOWL', 'GLASS_BOTTLE'] },
    'Miller': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['WHEAT', 'FLOUR'] },
    'Tavern Keeper': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['WOODEN_BOWL', 'BREAD', 'KEY'] },
    'Gladiator': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['BANDAGE'] },
    'Street Vendor': { equipment: { torso: 'WOOL_TUNIC' }, inventory: ['BREAD', 'FRUIT', 'PURSE'] },
    'Bathhouse Attendant': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['SOAP', 'RAG'] },
    'Priest': { equipment: { torso: 'LINEN_ROBE', main_hand: '*CONTEXTUAL*' }, inventory: ['INCENSE', 'RELIGIOUS_TEXT', 'CLAY_LAMP'] },
    'Temple Keeper': { equipment: { torso: 'SIMPLE_ROBE', main_hand: '*CONTEXTUAL*' }, inventory: ['INCENSE', 'CANDLES', 'BROOM'] },
    'Oracle': { equipment: { torso: 'SILK_ROBE', main_hand: '*CONTEXTUAL*' }, inventory: ['HERB_BUNDLE', 'BLESSED_ARTIFACT'] },

    // --- MEDIEVAL (Using procedural weapon selection) ---
    'Knight': { equipment: { torso: 'LEATHER_APRON', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*', belt: 'PURSE' }, inventory: ['SALT_PORK', 'WHETSTONE'], companions: ['HORSE'] },
    'Squire': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['WHETSTONE', 'FRUIT', 'BANDAGE'] },
    'Lady': { equipment: { head: 'VEIL', torso: 'MERCHANT_GOWN', main_hand: '*CONTEXTUAL*' }, inventory: ['SIMPLE_RING', 'BOOK', 'SILK_CLOTH'] },
    'Page': { equipment: { torso: 'CRAFTSMAN_TUNIC', main_hand: '*CONTEXTUAL*' }, inventory: ['SWORD', 'FRUIT'] },
    'Nun': { equipment: { head: 'WIMPLE', torso: 'SIMPLE_ROBE', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'RELIGIOUS_TEXT', 'PRAYER_BEADS'] },
    'Pilgrim': { equipment: { torso: 'WOOL_CLOAK', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'GOURD_FLASK', 'PRAYER_BEADS'] },
    'Friar': { equipment: { torso: 'SIMPLE_ROBE', feet: 'SANDALS', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD', 'RELIGIOUS_TEXT'] },
    'Pardoner': { equipment: { torso: 'SIMPLE_ROBE', belt: 'PURSE', main_hand: '*CONTEXTUAL*' }, inventory: ['SCROLL', 'COIN', 'BLESSED_ARTIFACT'] },
    'Hermit': { equipment: { torso: 'ROUGH_TUNIC', main_hand: '*CONTEXTUAL*' }, inventory: ['HERB_BUNDLE', 'WOODEN_BOWL'] },
    'Smelter Worker': { equipment: { torso: 'LEATHER_APRON', feet: 'WORK_BOOTS' }, inventory: ['IRON_ORE', 'COAL', 'TONGS'] },
    'Cobbler': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['LEATHER_BOOTS', 'SANDALS', 'KNIFE', 'NAILS'] },
    'Goldsmith': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['GOLD_ORE', 'HAMMER', 'SIMPLE_RING'] },
    'Illuminator': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['BOOK', 'QUILL', 'OCHRE_LUMP', 'GOLD_LEAF'] }, // Requires GOLD_LEAF
    'Bell Founder': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['COPPER_INGOT', 'TIN_INGOT', 'BELLOWS'] },
    'Chandler': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['CANDLES', 'BEESWAX', 'VINE'] },
    'Dyer': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['OCHRE_LUMP', 'BUCKET', 'WOOL_TUNIC'] },
    'Guild Master': { equipment: { torso: 'MERCHANT_GOWN', belt: 'PURSE', main_hand: '*CONTEXTUAL*' }, inventory: ['KEY', 'COIN', 'BOOK'] },
    'Wool Merchant': { equipment: { torso: 'WOOL_CLOAK', main_hand: '*CONTEXTUAL*' }, inventory: ['SCALE', 'WOOL_TUNIC', 'PURSE'] },
    'Money Changer': { equipment: { torso: 'WOOL_TUNIC', belt: 'PURSE', main_hand: '*CONTEXTUAL*' }, inventory: ['COIN', 'COIN', 'COIN', 'SCALE'] },
    'Brewer': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['BARLEY', 'BUCKET', 'WOODEN_BOWL'] },
    'Guard': { equipment: { head: 'LEATHER_CAP', torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['BREAD'] },
    'Thief': { equipment: { head: 'CLOTH_HOOD', torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS', main_hand: '*CONTEXTUAL*', belt: 'PURSE' }, inventory: ['LOCKPICK', 'ROPE', 'KNIFE'] },
    'Beggar': { equipment: { torso: 'ROUGH_TUNIC', main_hand: '*CONTEXTUAL*' }, inventory: ['WOODEN_BOWL', 'BREAD_CRUST'] },
    'Midwife': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['HERB_BUNDLE', 'BANDAGE', 'SOAP'] },
    'Peddler': { equipment: { torso: 'WOOL_CLOAK', main_hand: 'STICK' }, inventory: ['ROPE', 'WOODEN_BOWL', 'SIMPLE_RING', 'LEATHER_BAG'] },
    'Executioner': { equipment: { head: 'CLOTH_HOOD', torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['ROPE', 'WHETSTONE'] },
    'Falconer': { equipment: { torso: 'LEATHER_TUNIC', arm: 'LEATHER_BRACER', main_hand: '*CONTEXTUAL*' }, inventory: ['MEAT'], companions: ['EAGLE'] },
    'Charcoal Burner': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['COAL', 'STICK'] },
    'Woodcutter': { equipment: { torso: 'LEATHER_APRON', main_hand: '*CONTEXTUAL*' }, inventory: ['ROPE', 'STICK'] },
    'Washerwoman': { equipment: { torso: 'SIMPLE_ROBE', main_hand: '*CONTEXTUAL*' }, inventory: ['BUCKET', 'SOAP'] },
    'Wet Nurse': { equipment: { torso: 'SIMPLE_ROBE', main_hand: '*CONTEXTUAL*' }, inventory: ['MILK_BOTTLE', 'BREAD'] },

    // --- RENAISSANCE / EARLY MODERN ---
    'Banker': { equipment: { torso: 'FINE_CLOTHES', feet: 'LEATHER_SHOES', belt: 'PURSE' }, inventory: ['SIMPLE_RING', 'COIN', 'QUILL'] },
    'Painter': { equipment: { torso: 'SIMPLE_ROBE', head: 'FELT_BERET' }, inventory: ['QUILL', 'INK_POT', 'PIGMENT'] },
    'Alchemist': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['HEALING_POTION', 'MUSHROOM', 'EMPTY_VIAL', 'BOOK'] },
    'Mercenary': { equipment: { torso: 'LEATHER_APRON', feet: 'LEATHER_BOOTS', main_hand: 'SCIMITAR' }, inventory: ['WHETSTONE', 'BREAD'] },
    'Plague Doctor': { equipment: { head: 'LEATHER_CAP', torso: 'SIMPLE_ROBE' }, inventory: ['MEDICINAL_HERBS', 'REFRESHING_HERB', 'BANDAGE'] },
    'Apothecary': { equipment: { torso: 'SIMPLE_ROBE', belt: 'PURSE' }, inventory: ['MEDICINAL_HERBS', 'HERB_BUNDLE', 'SCALE'] },
    'Barber Surgeon': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['KNIFE', 'BANDAGE', 'LEECH', 'SOAP'] },
    'Instrument Maker': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['KNIFE', 'VINE', 'WOOD'] },
    'Tapestry Weaver': { equipment: { main_hand: 'SPINDLE' }, inventory: ['SILK_CLOTH', 'COTTON', 'WOOL_TUNIC'] },
    
    // --- INDUSTRIAL ERA ---
    'Factory Owner': { equipment: { torso: 'FROCK_COAT', head: 'TOP_HAT' }, inventory: ['COIN', 'KEY', 'POCKET_WATCH'] },
    'Railway Investor': { equipment: { torso: 'FINE_CLOTHES', head: 'TOP_HAT' }, inventory: ['COIN', 'POCKET_WATCH', 'MAP'] },
    'Pharmacist': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['MEDICINAL_HERBS', 'SCALE', 'GLASS_VIAL', 'SYRINGE'] },
    'Police Constable': { equipment: { torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS', main_hand: 'STICK' }, inventory: ['HANDCUFFS'] },
    'Shopkeeper': { equipment: { torso: 'LEATHER_APRON', feet: 'LEATHER_BOOTS' }, inventory: ['WOODEN_BOWL', 'KEY', 'COIN'] },
    'Docker': { equipment: { torso: 'WORK_SHIRT', feet: 'WORK_BOOTS' }, inventory: ['ROPE', 'BREAD'] },
    'Factory Worker': { equipment: { torso: 'FACTORY_SHIRT', feet: 'WORK_BOOTS' }, inventory: ['BREAD', 'RAG'] },
    'Coal Miner': { equipment: { head: 'LEATHER_CAP', torso: 'WORK_SHIRT', main_hand: 'PICKAXE' }, inventory: ['BREAD', 'CLAY_LAMP'] },
    'Journalist': { equipment: { torso: 'FROCK_COAT' }, inventory: ['QUILL', 'INK_POT', 'NOTEBOOK'] },
    'Governess': { equipment: { torso: 'DAY_DRESS' }, inventory: ['BOOK', 'SLATE_BOARD', 'PEN'] },
    'Chimney Sweep': { equipment: { head: 'FLAT_CAP', torso: 'WORK_SHIRT', main_hand: 'CHIMNEY_BRUSH' }, inventory: ['ROPE', 'SOAP'] },
    'Telegraph Operator': { equipment: { torso: 'FORMAL_SHIRT' }, inventory: ['PAPER', 'QUILL', 'TELEGRAPH_KEY'] },
    'Gas Lamp Lighter': { equipment: { torso: 'WORK_SHIRT', main_hand: 'STICK' }, inventory: ['FLINT_STONE', 'ROPE'] },
    'Rag Picker': { equipment: { torso: 'ROUGH_TUNIC' }, inventory: ['LEATHER_BAG', 'STICK'] },
    'Flower Seller': { equipment: { torso: 'SIMPLE_DRESS' }, inventory: ['FLOWER', 'FLOWER', 'BASKET'] },
    'Street Sweeper': { equipment: { main_hand: 'BROOM' }, inventory: ['BUCKET'] },
    
    // =======================================================================
    // == MENA (Middle East & North Africa)
    // =======================================================================
    // --- PREHISTORY ---
    'Brick Maker': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['CLAY_LUMP', 'WOODEN_BOWL'] },
    'Seal Carver': { equipment: {}, inventory: ['CLAY_LUMP', 'KNIFE', 'STICK'] },
    'Trader': { equipment: { torso: 'WOOL_TUNIC', belt: 'PURSE' }, inventory: ['BARLEY', 'SCALE'] },
    'Bead Maker': { equipment: {}, inventory: ['SMOOTH_STONE', 'VINE', 'SHELL'] },

    // --- ANTIQUITY (Persian context) ---
    'Local Governor': { equipment: { torso: 'SILK_ROBE', head: 'TURBAN', belt: 'PURSE' }, inventory: ['COIN', 'SCROLL'] },
    'Courier': { equipment: { feet: 'SANDALS', head: 'KEFFIYEH' }, inventory: ['SCROLL', 'GOURD_FLASK'], companions: ['HORSE'] },
    'Tax Assessor': { equipment: { torso: 'SIMPLE_ROBE', main_hand: 'SWORD' }, inventory: ['SCROLL', 'QUILL', 'SCALE'] },
    'Metalworker': { equipment: { torso: 'LEATHER_APRON', main_hand: 'HAMMER' }, inventory: ['COPPER_ORE', 'TIN_ORE'] },

    // --- MEDIEVAL (Islamic Golden Age context) ---
    'Astronomer': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN' }, inventory: ['SCROLL_OF_KNOWLEDGE', 'PARCHMENT_ROLL', 'INK_POT'] },
    'Translator': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['BOOK', 'SCROLL', 'QUILL'] },
    'Mathematician': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['BOOK', 'QUILL', 'SCALE'] },
    'Librarian': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['BOOK', 'BOOK', 'SCROLL'] },
    'Carpet Weaver': { equipment: { main_hand: 'SPINDLE' }, inventory: ['COTTON', 'SILK_CLOTH'] },
    'Date Farmer': { equipment: { main_hand: 'HARVEST_SICKLE' }, inventory: ['DATES', 'ROPE'] },
    'Imam': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN' }, inventory: ['RELIGIOUS_TEXT'] },
    'Muezzin': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['PRAYER_BEADS'] },
    'Quranic Teacher': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['RELIGIOUS_TEXT', 'BOOK'] },

    // --- RENAISSANCE / EARLY MODERN (Ottoman context) ---
    'Janissary': { equipment: { torso: 'WOOL_TUNIC', head: 'FELT_BERET', feet: 'LEATHER_BOOTS', main_hand: 'SCIMITAR' }, inventory: ['BREAD', 'WHETSTONE'] },
    'Provincial Governor': { equipment: { torso: 'KAFTAN', head: 'TURBAN' }, inventory: ['COIN', 'SCROLL'] },
    'Tax Farmer': { equipment: { torso: 'SIMPLE_ROBE', belt: 'PURSE' }, inventory: ['COIN', 'SCALE', 'BOOK'] },
    'Court Interpreter': { equipment: { torso: 'SILK_ROBE' }, inventory: ['BOOK', 'QUILL'] },
    'Coffeehouse Keeper': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['WOODEN_BOWL', 'COFFEE_BEANS', 'RAW_SUGAR'] },
    'Silk Road Trader': { equipment: { head: 'TURBAN', torso: 'DESERT_CLOAK' }, inventory: ['SILK_CLOTH', 'SPICE_POUCH', 'SCALE'], companions: ['CAMEL'] },
    'Carpet Merchant': { equipment: { torso: 'SIMPLE_ROBE', belt: 'PURSE' }, inventory: ['RUG', 'SCALE'] },
    'Tile Maker': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['CLAY_LUMP', 'OCHRE_LUMP'] },
    'Weapon Smith': { equipment: { torso: 'LEATHER_APRON', main_hand: 'HAMMER' }, inventory: ['IRON_INGOT', 'WHETSTONE'] },
    'Potter': { equipment: { torso: 'LEATHER_APRON',  }, inventory: ['CLAY_LUMP', 'KAOLIN'] },

    // --- INDUSTRIAL ERA ---
    'Oil Worker': { equipment: { head: 'LEATHER_CAP', torso: 'LEATHER_APRON' }, inventory: ['PICKAXE', 'FLASHLIGHT', 'BREAD'] },
    'Newspaper Editor': { equipment: { torso: 'FROCK_COAT', head: 'FEZ' }, inventory: ['PAPER', 'PEN', 'INK_POT'] },
    'Canal Worker': { equipment: { torso: 'WORK_SHIRT', main_hand: 'PICKAXE' }, inventory: ['BREAD', 'GOURD_FLASK'] },
    
    // =======================================================================
    // == EAST ASIAN
    // =======================================================================
    // --- PREHISTORY ---
    'Jade Carver': { equipment: {}, inventory: ['JADE_STONE', 'KNIFE', 'SMOOTH_STONE'] },
    'Bone Oracle': { equipment: { torso: 'DEER_HIDE' }, inventory: ['BONES', 'FLINT_STONE', 'COAL'] },

    // --- ANTIQUITY ---
    'County Magistrate': { equipment: { torso: 'SILK_ROBE', head: 'OFFICIAL_HAT' }, inventory: ['BOOK', 'QUILL', 'COIN'] },
    'Infantry': { equipment: { torso: 'LEATHER_APRON', main_hand: 'SWORD' }, inventory: ['RICE'] },
    'Cavalry': { equipment: { torso: 'LEATHER_APRON', main_hand: 'SWORD' }, inventory: ['RICE'], companions: ['HORSE'] },
    'Border Guard': { equipment: { torso: 'LEATHER_APRON', main_hand: 'SWORD' }, inventory: ['RICE'] },
    'Navy Sailor': { equipment: { torso: 'WOOL_TUNIC' }, inventory: ['ROPE', 'SMOKED_FISH'] },
    'Silk Farmer': { equipment: {}, inventory: ['SILK_CLOTH', 'LEAF_BUNDLE'] },
    'Tea Grower': { equipment: { head: 'BAMBOO_HAT' }, inventory: ['DRY_LEAVES', 'WOODEN_BOWL'] },
    'Vegetable Farmer': { equipment: { head: 'BAMBOO_HAT' }, inventory: ['VEGETABLES', 'WOODEN_BOWL'] },
    'Bronze Caster': { equipment: { torso: 'LEATHER_APRON', main_hand: 'HAMMER' }, inventory: ['COPPER_ORE', 'TIN_ORE', 'BELLOWS'] },
    'Porcelain Potter': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['CLAY_LUMP', 'KAOLIN'] },
    'Lacquerware Maker': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['WOODEN_BOWL', 'PINE_RESIN'] },
    'Silk Weaver': { equipment: { main_hand: 'SPINDLE' }, inventory: ['SILK_CLOTH', 'DYE'] },
    'Bamboo Worker': { equipment: { main_hand: 'KNIFE' }, inventory: ['BAMBOO', 'ROPE'] },
    'Salt Merchant': { equipment: { belt: 'PURSE', main_hand: 'KNIFE' }, inventory: ['ROCK_SALT', 'SCALE'], companions: ['OX'] },

    // --- MEDIEVAL (Japanese Context) ---
    'Ashigaru': { equipment: { head: 'LEATHER_CAP', torso: 'LEATHER_APRON', main_hand: 'STICK' }, inventory: ['RICE'] },
    'Retainer': { equipment: { torso: 'COTTON_SHIRT', main_hand: 'KATANA' }, inventory: ['RICE', 'ROPE'] },
    'Zen Master': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['BOOK', 'PRAYER_BEADS'] },
    'Temple Servant': { equipment: { torso: 'SIMPLE_ROBE', main_hand: 'BROOM' }, inventory: ['BUCKET', 'INCENSE'] },
    'Lacquerware Artisan': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['WOODEN_BOWL', 'PINE_RESIN', 'OCHRE_LUMP'] },
    'Tatami Maker': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['RICE_STRAW', 'KNIFE'] },
    'Fan Maker': { equipment: { }, inventory: ['BAMBOO', 'PAPER', 'KNIFE'] },
    'Porter': { equipment: { head: 'BAMBOO_HAT' }, inventory: ['ROPE', 'LEATHER_BAG'] },
    'Tea House Servant': { equipment: { torso: 'SILK_ROBE' }, inventory: ['TEA_LEAVES', 'WOODEN_BOWL'] },
    'Tofu Maker': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['SOYBEANS', 'BUCKET', 'WOODEN_BOWL'] },

    // --- RENAISSANCE / EARLY MODERN (Chinese Context) ---
    'Local Magistrate': { equipment: { torso: 'SILK_ROBE', head: 'OFFICIAL_HAT' }, inventory: ['BOOK', 'QUILL', 'COIN'] },
    'Census Taker': { equipment: { torso: 'WOOL_TUNIC' }, inventory: ['BOOK', 'QUILL', 'INK_POT'] },
    'Granary Keeper': { equipment: { torso: 'WOOL_TUNIC' }, inventory: ['KEY', 'RICE', 'WHEAT'] },
    'Woodblock Printer': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['PAPER', 'INK_POT', 'KNIFE'] },
    'Inkstick Maker': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['COAL', 'PINE_RESIN'] },
    'Porcelain Dealer': { equipment: { belt: 'PURSE' }, inventory: ['POTTERY_SHARD', 'SCALE', 'COIN'] },
    'Rice Merchant': { equipment: { belt: 'PURSE' }, inventory: ['RICE', 'SCALE'] },
    'Tea Picker': { equipment: { head: 'BAMBOO_HAT' }, inventory: ['TEA_LEAVES', 'BASKET'] },
    'Boatman': { equipment: { head: 'BAMBOO_HAT', main_hand: 'STICK' }, inventory: ['ROPE', 'FISH_MEAT'] },
    'Market Vendor': { equipment: { head: 'BAMBOO_HAT' }, inventory: ['VEGETABLES', 'RICE', 'PURSE'] },

    // --- INDUSTRIAL ERA ---
    'Railway Engineer': { equipment: { torso: 'WORK_SHIRT' }, inventory: ['HAMMER', 'SCALE', 'PARCHMENT_ROLL'] },
    'Fireman': { equipment: { torso: 'WORK_SHIRT', main_hand: 'AXE' }, inventory: ['BUCKET', 'ROPE'] },
    'Machinist': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['HAMMER', 'TONGS', 'IRON_INGOT'] },
    'Stevedore': { equipment: { torso: 'WORK_SHIRT' }, inventory: ['ROPE', 'BREAD'] },
    'Rickshaw Puller': { equipment: { head: 'BAMBOO_HAT' }, inventory: ['RICE', 'GOURD_FLASK'] },
    
    // =======================================================================
    // == SOUTH ASIAN
    // =======================================================================
    // --- PREHISTORY ---
    'Harappan Brick Maker': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['CLAY_LUMP', 'WOODEN_BOWL'] },
    'Harappan Seal Carver': { equipment: {}, inventory: ['CLAY_LUMP', 'KNIFE', 'STICK'] },
    'Harappan Trader': { equipment: { torso: 'WOOL_TUNIC', belt: 'PURSE' }, inventory: ['BARLEY', 'SCALE', 'BEADS'] },
    'Harappan Bead Maker': { equipment: {}, inventory: ['SMOOTH_STONE', 'VINE', 'SHELL'] },

    // --- ANTIQUITY ---
    'Brahmin Priest': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['RELIGIOUS_TEXT', 'INCENSE', 'PRAYER_BEADS'] },
    'Brahmin Scholar': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['BOOK', 'SCROLL', 'QUILL'] },
    'Kshatriya Warrior': { equipment: { torso: 'JERKIN', main_hand: 'SWORD' }, inventory: ['BREAD'] },
    'Kshatriya Chariot Driver': { equipment: { torso: 'JERKIN', main_hand: 'SWORD' }, inventory: [], companions: ['HORSE', 'HORSE'] },
    'Vaishya Merchant': { equipment: { torso: 'WOOL_TUNIC', belt: 'PURSE' }, inventory: ['SCALE', 'COIN', 'SPICE_POUCH'] },
    'Vaishya Banker': { equipment: { torso: 'WOOL_TUNIC', belt: 'PURSE' }, inventory: ['COIN', 'COIN', 'BOOK'] },
    'Shudra Farmer': { equipment: { main_hand: 'HARVEST_SICKLE' }, inventory: ['WHEAT', 'LENTILS'] },
    'Shudra Weaver': { equipment: { main_hand: 'SPINDLE' }, inventory: ['COTTON'] },
    'Shudra Potter': { equipment: { }, inventory: ['CLAY_LUMP', 'WOODEN_BOWL'] },
    'Shudra Blacksmith': { equipment: { torso: 'LEATHER_APRON', main_hand: 'HAMMER' }, inventory: ['IRON_ORE', 'COAL'] },
    'Shudra Carpenter': { equipment: { main_hand: 'AXE' }, inventory: ['HAMMER', 'NAILS'] },

    // --- MEDIEVAL ---
    'Hindu Priest': { equipment: { torso: 'DHOTI' }, inventory: ['INCENSE', 'BELL', 'RELIGIOUS_TEXT'] },
    'Ascetic': { equipment: { main_hand: 'STICK' }, inventory: ['WOODEN_BOWL'] },
    'Temple Dancer': { equipment: { torso: 'SARI' }, inventory: ['BELL', 'FLOWER'] },
    'Carpet Weaver': { equipment: { main_hand: 'SPINDLE' }, inventory: ['SILK_CLOTH', 'COTTON'] },
    'Stone Carver': { equipment: { main_hand: 'STONE_CHISEL' }, inventory: ['HAMMER', 'STONE_BLOCK'] },
    'Textile Dyer': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['INDIGO', 'BUCKET'] },
    'Incense Maker': { equipment: {}, inventory: ['PINE_RESIN', 'HERB_BUNDLE', 'STICK'] },
    'Spice Grower': { equipment: { main_hand: 'HARVEST_SICKLE' }, inventory: ['SPICE_POUCH', 'PEAS'] },
    'Cotton Farmer': { equipment: { main_hand: 'HARVEST_SICKLE' }, inventory: ['COTTON'] },
    'Cowherd': { equipment: { main_hand: 'STICK' }, inventory: [], companions: ['COW', 'COW'] },
    'Village Headman': { equipment: { torso: 'KURTA', main_hand: 'SWORD' }, inventory: ['COIN', 'STICK'] },

    // --- RENAISSANCE / EARLY MODERN (Mughal/Colonial Context) ---
    'Court Musician': { equipment: { torso: 'SILK_ROBE' }, inventory: ['FLUTE', 'SIMPLE_RING'] },
    'Court Painter': { equipment: { torso: 'SILK_ROBE' }, inventory: ['PIGMENT', 'QUILL', 'PAPER'] },
    'Sepoy': { equipment: { head: 'TURBAN', torso: 'WOOL_TUNIC', main_hand: 'SWORD' }, inventory: ['BREAD'] },
    'Interpreter': { equipment: { torso: 'WOOL_TUNIC' }, inventory: ['BOOK'] },
    'Metalworker': { equipment: { torso: 'LEATHER_APRON', main_hand: 'HAMMER' }, inventory: ['IRON_INGOT', 'COPPER_INGOT'] },

    // --- INDUSTRIAL ERA ---
    'Civil Engineer': { equipment: { torso: 'FORMAL_SHIRT', head: 'PITH_HELMET' }, inventory: ['PAPER', 'SCALE', 'PEN'] },
    'Mill Worker': { equipment: { torso: 'FACTORY_SHIRT' }, inventory: ['BREAD', 'COTTON'] },
    
    // =======================================================================
    // == SUB-SAHARAN AFRICAN
    // =======================================================================
    // --- PREHISTORY ---
    'Spirit Medium': { equipment: { head: 'FEATHER_BAND', torso: 'HIDE_WRAP' }, inventory: ['BONES', 'HERB_BUNDLE'] },
    'Rock Painter': { equipment: {}, inventory: ['OCHRE_LUMP', 'COAL'] },
    'Honey Gatherer': { equipment: {}, inventory: ['BUCKET', 'ROPE'] },

    // --- ANTIQUITY ---
    'Chief': { equipment: { head: 'FEATHER_CROWN', torso: 'LEOPARD_SKIN' }, inventory: ['STICK'] }, // Requires Leopard Skin
    'Rain Maker': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['HERB_BUNDLE', 'BONES', 'BLESSED_ARTIFACT'] },
    'War Leader': { equipment: { head: 'FEATHER_HEADDRESS', main_hand: 'STICK' }, inventory: ['OCHRE_LUMP'] },
    'Iron Smelter': { equipment: { torso: 'LEATHER_APRON', main_hand: 'HAMMER' }, inventory: ['BOG_IRON', 'BELLOWS'] },
    'Ivory Carver': { equipment: { torso: 'LEATHER_APRON', main_hand: 'KNIFE' }, inventory: ['IVORY_TUSK', 'SMOOTH_STONE'] },
    'Salt Trader': { equipment: { belt: 'PURSE' }, inventory: ['ROCK_SALT', 'SCALE'], companions: ['DONKEY'] }, // Requires Donkey
    'Cattle Herder': { equipment: { main_hand: 'STICK' }, inventory: ['ROPE'], companions: ['COW', 'COW', 'COW'] },
    'Village Elder': { equipment: { torso: 'SIMPLE_ROBE', main_hand: 'STICK' }, inventory: ['PRAYER_BEADS'] },

    // --- MEDIEVAL ---
    'King': { equipment: { head: 'CROWN', torso: 'AGBADA', main_hand: 'SWORD' }, inventory: ['GOLD_BAR'] },
    'Queen Mother': { equipment: { head: 'GELE', torso: 'BOUBOU' }, inventory: ['GOLD_RING'] },
    'Griot': { equipment: { torso: 'DASHIKI' }, inventory: ['DRUM', 'FLUTE'] },
    'Islamic Scholar': { equipment: { torso: 'SIMPLE_ROBE', head: 'TURBAN' }, inventory: ['RELIGIOUS_TEXT', 'BOOK'] },
    'Gold Trader': { equipment: { torso: 'BOUBOU', belt: 'PURSE' }, inventory: ['GOLD_ORE', 'SCALE'], companions: ['CAMEL'] },
    'Blacksmith': { equipment: { torso: 'LEATHER_APRON', main_hand: 'HAMMER' }, inventory: ['IRON_ORE', 'BELLOWS', 'TONGS'] },
    'Caravan Guide': { equipment: { torso: 'DESERT_CLOAK', head: 'KEFFIYEH', main_hand: 'SWORD' }, inventory: ['MAP', 'GOURD_FLASK'], companions: ['CAMEL'] },
    'Millet Farmer': { equipment: { main_hand: 'HARVEST_SICKLE' }, inventory: ['MILLET', 'WOODEN_BOWL'] },
    'Diviner': { equipment: { torso: 'SIMPLE_ROBE', main_hand: 'IVORY_TUSK' }, inventory: ['BONES', 'SHELL', 'PRAYER_BEADS'] },

    // --- RENAISSANCE / EARLY MODERN ---
    'Sultan': { equipment: { head: 'TURBAN', torso: 'KAFTAN' }, inventory: ['SCIMITAR', 'COIN'] },
    'Oba': { equipment: { head: 'CORAL_CROWN', torso: 'AGBADA' }, inventory: ['CORAL_BEADS'] },
    'Portuguese Factor': { equipment: { head: 'TRICORN_HAT', torso: 'FROCK_COAT' }, inventory: ['COIN', 'SCROLL'] },
    'Slave Trader': { equipment: { torso: 'LEATHER_APRON', belt: 'PURSE' }, inventory: ['HANDCUFFS', 'ROPE', 'COIN'] },
    'Brass Caster': { equipment: { torso: 'LEATHER_APRON', main_hand: 'HAMMER' }, inventory: ['COPPER_ORE', 'TIN_ORE', 'BELLOWS'] },
    'Musket Bearer': { equipment: { main_hand: 'STICK' }, inventory: ['LEAD_BAR', 'SULFUR'] }, // STICK as placeholder for Musket
    'Cowrie Counter': { equipment: { belt: 'PURSE' }, inventory: ['SHELL', 'SHELL', 'SHELL', 'SCALE'] },
    'Palm Wine Tapper': { equipment: { main_hand: 'KNIFE' }, inventory: ['GOURD_FLASK', 'ROPE'] },
    'War Captive': { equipment: {}, inventory: [] },

    // --- INDUSTRIAL ERA ---
    'Colonial Governor': { equipment: { head: 'PITH_HELMET', torso: 'SUIT' }, inventory: ['BOOK', 'POCKET_WATCH'] },
    'Paramount Chief': { equipment: { head: 'FEZ', torso: 'AGBADA' }, inventory: ['STICK', 'SIMPLE_RING'] },
    'Missionary': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['RELIGIOUS_TEXT', 'BANDAGE'] },
    'Court Interpreter': { equipment: { torso: 'FORMAL_SHIRT' }, inventory: ['BOOK', 'NOTEBOOK'] },
    'Cash Crop Farmer': { equipment: { main_hand: 'HARVEST_SICKLE' }, inventory: ['COFFEE_BEANS', 'COCOA_BEANS'] },
    'Mine Worker': { equipment: { main_hand: 'PICKAXE' }, inventory: ['BREAD', 'FLASHLIGHT'] },
    'Hut Tax Payer': { equipment: { main_hand: 'STICK' }, inventory: ['CORN'] },

    // =======================================================================
    // == OCEANIA
    // =======================================================================
    // --- PREHISTORY ---
    'Navigator': { equipment: {}, inventory: ['STICK_CHART', 'FISHING_NET', 'COCONUT'] },
    'Canoe Builder': { equipment: { main_hand: 'AXE' }, inventory: ['VINE', 'PINE_RESIN'] },

    // --- ANTIQUITY / MEDIEVAL ---
    'Master Navigator': { equipment: { amulet: 'SHELL_NECKLACE' }, inventory: ['STICK_CHART', 'SMOKED_FISH', 'COCONUT'] },
    'Tattoo Artist': { equipment: {}, inventory: ['OCHRE_LUMP', 'SHARP_BONE', 'KNIFE'] },
    'Breadfruit Cultivator': { equipment: { main_hand: 'STICK' }, inventory: ['BREADFRUIT'] },
    
    // --- RENAISSANCE / EARLY MODERN ---
    'Sandalwood Cutter': { equipment: { main_hand: 'AXE' }, inventory: ['SANDALWOOD_LOG', 'ROPE'] },
    'Beche-de-mer Diver': { equipment: {}, inventory: ['KNIFE', 'LEATHER_BAG'] },
    'Ship Provisioner': { equipment: {}, inventory: ['SALT_PORK', 'BREAD', 'FRUIT'] },
    'Whaler': { equipment: { main_hand: 'HARPOON' }, inventory: ['ROPE', 'KNIFE'] },
    
    // =======================================================================
    // == MODERN & FUTURE (SHARED)
    // =======================================================================
    'Surgeon': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['KNIFE', 'SYRINGE', 'HEALING_POTION', 'BANDAGE'] },
    'Police Officer': { equipment: { torso: 'FORMAL_SHIRT', feet: 'DRESS_BOOTS', main_hand: 'STICK' }, inventory: ['HANDCUFFS', 'FLASHLIGHT'] },
    'Electrician': { equipment: { torso: 'WORK_SHIRT', belt: 'PURSE' }, inventory: ['COPPER_INGOT', 'TONGS'] },
    'Plumber': { equipment: { torso: 'WORK_SHIRT', main_hand: 'HAMMER' }, inventory: ['LEAD_BAR', 'TONGS'] },
    'Miner': { equipment: { head: 'LEATHER_CAP', torso: 'WORK_SHIRT', feet: 'WORK_BOOTS', main_hand: 'STEEL_PICKAXE' }, inventory: ['FLASHLIGHT', 'BREAD', 'COAL'] },
    'Tech CEO': { equipment: { torso: 'DESIGNER_COAT' }, inventory: ['SMARTPHONE', 'SIMPLE_RING', 'KEY'] },
    'Investment Banker': { equipment: { torso: 'SUIT' }, inventory: ['GOLD_BAR', 'SMARTPHONE', 'COIN'] },
    'Software Developer': { equipment: { torso: 'T_SHIRT' }, inventory: ['SMARTPHONE', 'SCROLL_OF_KNOWLEDGE', 'COFFEE_BEANS'] },
    'Marketing Manager': { equipment: { torso: 'BLAZER' }, inventory: ['SMARTPHONE', 'PAPER', 'PEN'] },
    'Physical Therapist': { equipment: { torso: 'POLO_SHIRT' }, inventory: ['BANDAGE', 'MEDICINAL_HERBS'] },
    'Real Estate Agent': { equipment: { torso: 'SUIT', belt: 'PURSE' }, inventory: ['KEY', 'PAPER', 'SMARTPHONE'] },
    'Dental Hygienist': { equipment: { torso: 'BLOUSE' }, inventory: ['METAL_SCRAPER', 'POLISH'] },
    'Handyman': { equipment: { torso: 'WORK_SHIRT', main_hand: 'HAMMER' }, inventory: ['NAILS', 'ROPE', 'WRENCH'] },
    'Uber Driver': { equipment: { torso: 'T_SHIRT', main_hand: 'KATANA' }, inventory: ['SMARTPHONE', 'SYRINGE'], companions: ['CAR'] },
    'Delivery Driver': { equipment: { torso: 'T_SHIRT' }, inventory: ['LEATHER_BAG', 'SMARTPHONE'] },
    'Barista': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['WOODEN_BOWL', 'COFFEE_BEANS', 'RAW_SUGAR'] },
    'Customer Service Rep': { equipment: { torso: 'BLOUSE' }, inventory: ['HEADSET', 'PAPER'] },
    'Personal Trainer': { equipment: { torso: 'TANK_TOP' }, inventory: ['FRUIT', 'BOTTLE_OF_WATER'] },
    'Hair Stylist': { equipment: { torso: 'BLOUSE' }, inventory: ['SCISSORS', 'COMB'] },
    'Hotel Clerk': { equipment: { torso: 'FORMAL_SHIRT' }, inventory: ['KEY', 'BOOK'] },
    'Grocery Clerk': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['FRUIT', 'BREAD'] },
    'Call Center Worker': { equipment: { torso: 'T_SHIRT' }, inventory: ['HEADSET', 'PAPER'] },
    'Content Creator': { equipment: { torso: 'T_SHIRT', head: 'SNAPBACK' }, inventory: ['SMARTPHONE','SYRINGE', 'COFFEE_BEANS'] },
};