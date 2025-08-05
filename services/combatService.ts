/**
 * services/combatService.ts - Logic for combat calculations and procedural item stats.
 */
import { Item, ItemDefinition, EquipmentSlot } from '../types';
import { ITEM_DEFINITIONS } from '../constants/index';

export interface ProceduralStats {
    attack: number;
    defense: number;
    equipmentSlot: EquipmentSlot | undefined;
}

export function getProceduralItemStats(item: Item): ProceduralStats {
    // Start with any explicit stats from the item definition.
    let attack = item.attack || 0;
    let defense = item.defense || 0;
    let equipmentSlot = item.equipmentSlot;

    const lowerName = item.name.toLowerCase();
    const rarityMap: Record<Item['rarity'], number> = { 'Junk': 0, 'Common': 0, 'Uncommon': 1, 'Rare': 2, 'Ultra-rare': 3, 'Unique': 4 };

    // Infer the equipment slot if it's not explicitly defined.
    if (!equipmentSlot) {
        if (item.wieldable) {
            equipmentSlot = 'main_hand';
        } else if (item.wearable) {
            // Infer armor slot based on name
            const torsoWords = ['hide', 'pelt', 'leather', 'jerkin', 'robe', 'tunic', 'cloak', 'plate', 'chain', 'wrap', 'shirt', 'dress', 'apron', 'doublet', 'kirtle', 'bodice', 'surcoat', 'houppelande', 'stola', 'peplos', 'palla', 'chiton', 'hanfu', 'agbada', 'dashiki', 'boubou', 'kaftan', 'sherwani', 'kurta', 'blouse', 'qipao', 'suit', 'jacket', 'vest', 'mantle', 'shawl', 'kimono', 'jerkin', 'surcoat'];
            const headWords = ['cap', 'helmet', 'hood', 'turban', 'hat', 'wimple', 'coif', 'diadem', 'crown', 'headdress', 'veil', 'circlet'];
            const feetWords = ['boots', 'shoes', 'sandals', 'clogs', 'slippers', 'moccasins'];
            const legsWords = ['hose', 'trousers', 'breeches', 'pants', 'skirt', 'leggings'];
            const beltWords = ['belt', 'cord', 'sash', 'girdle'];
            const amuletWords = ['comb', 'necklace', 'pendant', 'amulet', 'chain', 'hairpin', 'ornament', 'brooch'];
            const ringWords = ['ring'];
            const offHandWords = ['shield'];
            const mainHandWords = ['sword', 'axe', 'mace', 'dagger', 'staff', 'club', 'spear'];

            if (torsoWords.some(word => lowerName.includes(word))) {
                equipmentSlot = 'torso';
            } else if (headWords.some(word => lowerName.includes(word))) {
                equipmentSlot = 'head';
            } else if (feetWords.some(word => lowerName.includes(word))) {
                equipmentSlot = 'feet';
            } else if (legsWords.some(word => lowerName.includes(word))) {
                equipmentSlot = 'legs';
            } else if (offHandWords.some(word => lowerName.includes(word))) {
                equipmentSlot = 'off_hand';
            } else if (beltWords.some(word => lowerName.includes(word))) {
                equipmentSlot = 'belt';
            } else if (amuletWords.some(word => lowerName.includes(word))) {
                equipmentSlot = 'amulet';
            } else if (ringWords.some(word => lowerName.includes(word))) {
                equipmentSlot = 'ring1';
            } else if (mainHandWords.some(word => lowerName.includes(word))) {
                equipmentSlot = 'main_hand';
            }
        }
    }


    // If stats are zero after checking explicit values, calculate procedural stats.
    // This is for items that are wieldable/wearable but have no stats defined (e.g., a rock).
    if (item.attack === 0 && item.defense === 0) {
        if (equipmentSlot === 'main_hand') {
            attack = 1; // Base for any wieldable item
            if (lowerName.includes('stick') || lowerName.includes('club') || lowerName.includes('staff') || lowerName.includes('pole')) attack += 1;
            if (lowerName.includes('hammer')) attack += 3;
            if (lowerName.includes('stone') || lowerName.includes('rock')) attack += 1;
            if (lowerName.includes('blade') || lowerName.includes('axe') || lowerName.includes('dagger') || lowerName.includes('comb')) attack += 4;
            if (item.category === 'Tool') attack += 1;
            
            // Bonus from weight and crafting value
            attack += Math.floor(item.weight * 1.2) + Math.floor(item.craftingValue / 2.5);
            
            // Rarity bonus
            attack += rarityMap[item.rarity] || 0;

            // Material bonus for attack
            const material = item.material?.toLowerCase();
            if (material?.includes('iron') || material?.includes('steel')) attack += 3;
            if (material?.includes('stone')) attack += 2;
            if (material?.includes('wood')) attack += 1;
            if (material?.includes('copper')) attack += 2;
        } else if (equipmentSlot) { // Inferred it's some kind of armor
            defense = 1; // Base for any wearable item
            
            // Bonus from weight and crafting value
            defense += Math.floor(item.weight / 1.5) + Math.floor(item.craftingValue / 3);

            // Rarity bonus for defense
            defense += rarityMap[item.rarity] || 0;

            // Bonus from material
            const material = item.material?.toLowerCase();
            if(material?.includes('iron')) defense += 3;
            if(material?.includes('steel')) defense += 4;
            if(material?.includes('hide')) defense += 2;
            if(material?.includes('leather')) defense += 2;
            if(material?.includes('wool')) defense += 1;
            if(material?.includes('copper')) defense += 2;
            if(material?.includes('silk')) defense += 1;

            if (equipmentSlot === 'off_hand') defense += 2; // Extra bonus for shields
        }
    }

    return {
        attack: Math.max(0, attack),
        defense: Math.max(0, defense),
        equipmentSlot,
    };
}