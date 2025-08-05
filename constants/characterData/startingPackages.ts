/**
 * constants/characterData/startingPackages.ts - Defines starting items for professions.
 * This file is expanded to cover a wide range of professions from various eras and cultures.
 */
import { EquipmentSlot } from '../../types';

type ItemBaseId = string;

export const STARTING_PACKAGES: Record<string, { equipment: Partial<Record<EquipmentSlot, ItemBaseId>>, inventory: ItemBaseId[] }> = {

    // =======================================================================
    // == FALLBACK & GENERIC ROLES
    // =======================================================================
    'Wanderer': { equipment: { head: 'CLOTH_HOOD', torso: 'WOOL_TUNIC', feet: 'SANDALS' }, inventory: ['STICK', 'BREAD'] },
    'Artisan': { equipment: { torso: 'LEATHER_APRON', feet: 'LEATHER_BOOTS' }, inventory: ['SMOOTH_STONE', 'ROPE'] },
    'Commoner': { equipment: { torso: 'WOOL_TUNIC', feet: 'SANDALS' }, inventory: ['SMOOTH_STONE', 'BREAD'] },
    'Laborer': { equipment: { torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS', main_hand: 'STICK' }, inventory: [] },
    'Peasant': { equipment: { torso: 'WOOL_TUNIC', feet: 'SANDALS' }, inventory: ['POTATO'] },
    'Warrior': { equipment: { torso: 'LEATHER_APRON', feet: 'LEATHER_BOOTS', main_hand: 'STICK' }, inventory: ['MEAT'] },
    'Caretaker': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['HERB_BUNDLE', 'BREAD'] },
    'Potter': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['CLAY_LAMP', 'WOODEN_BOWL', 'SMOOTH_STONE'] },
    'Shepherd': { equipment: { main_hand: 'STICK', torso: 'WOOL_TUNIC' }, inventory: ['BREAD'] },
    'Farmer': { equipment: { main_hand: 'STICK', torso: 'LEATHER_APRON' }, inventory: ['WHEAT', 'BREAD'] },
    'Child Watcher': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['WOODEN_BOWL', 'WILD_BERRIES'] },
    'Mother': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['BREAD', 'SIMPLE_RING'] },


    // =======================================================================
    // == EUROPEAN
    // =======================================================================
    // Prehistory
    'Hunter': { equipment: { torso: 'DEER_HIDE', feet: 'LEATHER_BOOTS', main_hand: 'STICK' }, inventory: ['SMOOTH_STONE', 'MEAT'] },
    'Gatherer': { equipment: { torso: 'DEER_HIDE', feet: 'SANDALS' }, inventory: ['WILD_BERRIES', 'MUSHROOM'] },
    'Shaman': { equipment: { head: 'CLOTH_HOOD', torso: 'SIMPLE_ROBE' }, inventory: ['HERB_BUNDLE', 'SMOOTH_STONE', 'DRY_LEAVES'] },
    'Toolmaker': { equipment: { torso: 'LEATHER_APRON', main_hand: 'STICK' }, inventory: ['SMOOTH_STONE'] },

    // Antiquity
    'Legionary': { equipment: { torso: 'LEATHER_APRON', feet: 'SANDALS', main_hand: 'STICK' }, inventory: ['BREAD'] },
    'Gladiator': { equipment: { torso: 'LEATHER_APRON', main_hand: 'STICK' }, inventory: [] },
    'Physician': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['MEDICINAL_HERBS', 'PARCHMENT_ROLL'] },
    'Oracle': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['HERB_BUNDLE', 'CLAY_LAMP'] },

    // Medieval
    'Knight': { equipment: { head: 'LEATHER_CAP', torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS', main_hand: 'STICK' }, inventory: ['BREAD'] },
    'Squire': { equipment: { torso: 'LEATHER_APRON', main_hand: 'STICK' }, inventory: [] },
    'Scribe': { equipment: { torso: 'SIMPLE_ROBE', feet: 'SANDALS' }, inventory: ['QUILL', 'INK_POT', 'PARCHMENT_ROLL'] },
    'Blacksmith': { equipment: { torso: 'LEATHER_APRON', feet: 'LEATHER_BOOTS', main_hand: 'STICK' }, inventory: ['IRON_ORE'] },
    'Merchant': { equipment: { torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS' }, inventory: ['ROPE'] },
    'Thief': { equipment: { head: 'CLOTH_HOOD', torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS' }, inventory: ['SMOOTH_STONE', 'STICK'] },
    'Innkeeper': { equipment: { torso: 'LEATHER_APRON', feet: 'LEATHER_BOOTS', main_hand: 'STICK' }, inventory: ['BREAD'] },
    'Weaver': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['VINE', 'COTTON'] },
    'Baker': { equipment: { torso: 'LEATHER_APRON', main_hand: 'STICK' }, inventory: ['BREAD', 'WHEAT'] },
    'Carpenter': { equipment: { torso: 'LEATHER_APRON', main_hand: 'STICK' }, inventory: ['ROPE'] },
    'Mason': { equipment: { torso: 'LEATHER_APRON', main_hand: 'STICK' }, inventory: ['SMOOTH_STONE'] },
    'Herbalist': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['HERB_BUNDLE', 'MUSHROOM', 'MEDICINAL_HERBS'] },
    'Monk': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['BREAD', 'PARCHMENT_ROLL', 'SIMPLE_RING'] },
    'Serf': { equipment: { torso: 'WOOL_TUNIC' }, inventory: ['POTATO', 'STICK'] },
    'Jester': { equipment: { head: 'CLOTH_HOOD', torso: 'SIMPLE_ROBE', feet: 'SANDALS' }, inventory: ['STRANGE_FRUIT'] },
    'Woodcutter': { equipment: { torso: 'LEATHER_APRON', main_hand: 'STICK' }, inventory: ['ROPE', 'STICK'] },

    // Renaissance
    'Banker': { equipment: { torso: 'SIMPLE_ROBE', feet: 'LEATHER_BOOTS' }, inventory: ['SIMPLE_RING'] },
    'Painter': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['QUILL', 'INK_POT'] },
    'Alchemist': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['HEALING_POTION', 'MUSHROOM'] },
    'Mercenary': { equipment: { torso: 'LEATHER_APRON', feet: 'LEATHER_BOOTS', main_hand: 'STICK' }, inventory: [] },
    'Plague Doctor': { equipment: { head: 'CLOTH_HOOD', torso: 'SIMPLE_ROBE' }, inventory: ['MEDICINAL_HERBS', 'REFRESHING_HERB'] },

    // Industrial
    'Police Constable': { equipment: { torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS', main_hand: 'STICK' }, inventory: [] },
    'Shopkeeper': { equipment: { torso: 'LEATHER_APRON', feet: 'LEATHER_BOOTS' }, inventory: ['WOODEN_BOWL'] },
    'Docker': { equipment: { torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS' }, inventory: ['ROPE'] },
    'Factory Worker': { equipment: { torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS' }, inventory: ['BREAD'] },
    'Coal Miner': { equipment: { head: 'LEATHER_CAP', torso: 'WOOL_TUNIC', main_hand: 'STICK' }, inventory: ['BREAD'] },
    'Journalist': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['QUILL', 'INK_POT', 'PARCHMENT_ROLL'] },

    // =======================================================================
    // == EAST ASIAN
    // =======================================================================
    'Court Scribe': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['QUILL', 'INK_POT', 'PARCHMENT_ROLL'] },
    'Samurai': { equipment: { torso: 'LEATHER_APRON', feet: 'SANDALS', main_hand: 'STICK' }, inventory: ['RICE'] },
    'Buddhist Monk': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['WOODEN_BOWL', 'RICE'] },
    'Swordsmith': { equipment: { torso: 'LEATHER_APRON', main_hand: 'STICK' }, inventory: ['IRON_ORE', 'SMOOTH_STONE'] },
    'Tea Trader': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['DRY_LEAVES'] },
    'Rickshaw Puller': { equipment: { feet: 'SANDALS' }, inventory: ['BREAD'] },

    // =======================================================================
    // == MENA (Middle East & North Africa)
    // =======================================================================
    'Nomad': { equipment: { head: 'CLOTH_HOOD', torso: 'SIMPLE_ROBE', feet: 'SANDALS', main_hand: 'STICK' }, inventory: ['DRY_LEAVES'] },
    'Spice Merchant': { equipment: { head: 'CLOTH_HOOD', torso: 'SIMPLE_ROBE' }, inventory: ['HERB_BUNDLE'] },
    'Janissary': { equipment: { torso: 'WOOL_TUNIC', feet: 'LEATHER_BOOTS', main_hand: 'STICK' }, inventory: [] },
    'Calligrapher': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['QUILL', 'INK_POT'] },
    
    // =======================================================================
    // == SUB-SAHARAN AFRICAN
    // =======================================================================
    'Iron Smelter': { equipment: { torso: 'LEATHER_APRON', main_hand: 'STICK' }, inventory: ['IRON_ORE'] },
    'Griot': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: [] },
    'Salt Miner': { equipment: { torso: 'WOOL_TUNIC', main_hand: 'STICK' }, inventory: ['SMOOTH_STONE'] },
    'Ivory Carver': { equipment: { torso: 'LEATHER_APRON' }, inventory: ['BOAR_TUSK'] }, // Tusk as placeholder for ivory

    // =======================================================================
    // == AMERICAS
    // =======================================================================
    'Obsidian Knapper': { equipment: { torso: 'WOOL_TUNIC' }, inventory: ['SMOOTH_STONE'] },
    'Featherworker': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['OWL_FEATHER'] },
    'Buffalo Hunter': { equipment: { torso: 'DEER_HIDE', main_hand: 'STICK' }, inventory: ['MEAT'] },
    'Canoe Builder': { equipment: { torso: 'LEATHER_APRON', main_hand: 'STICK' }, inventory: ['VINE'] },
    'Vaquero': { equipment: { head: 'LEATHER_CAP', feet: 'LEATHER_BOOTS' }, inventory: ['ROPE', 'MEAT'] },
    'Fur Trapper': { equipment: { head: 'LEATHER_CAP', torso: 'DEER_HIDE' }, inventory: ['STICK', 'ROPE'] },
    'Cowboy': { equipment: { head: 'LEATHER_CAP', feet: 'LEATHER_BOOTS' }, inventory: ['ROPE', 'BREAD'] },

    // =======================================================================
    // == OCEANIA
    // =======================================================================
    'Navigator': { equipment: { feet: 'SANDALS' }, inventory: ['STICK', 'FISH_MEAT'] },
    'Tapa Maker': { equipment: { torso: 'SIMPLE_ROBE' }, inventory: ['TREE_BARK'] },
    'Pearl Diver': { equipment: {}, inventory: ['SMOOTH_STONE'] },
    'Tattoo Artist': { equipment: {}, inventory: ['SMOOTH_STONE', 'INK_POT'] },
};
