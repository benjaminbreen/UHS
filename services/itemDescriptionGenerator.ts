/**
 * services/itemDescriptionGenerator.ts - Procedural description generator for items.
 */
import { Item } from '../types';

const ADJECTIVES: Record<Item['rarity'], string[]> = {
    Junk: ['a shoddy', 'a damaged', 'a crude', 'a forgotten'],
    Common: ['a standard', 'a simple', 'an unremarkable', 'a common'],
    Uncommon: ['a well-made', 'a sturdy', 'a fine', 'a notable'],
    Rare: ['an exceptional', 'a rare', 'a masterwork', 'an exquisite'],
    'Ultra-rare': ['a legendary', 'a mythical', 'an unparalleled'],
    Unique: ['a one-of-a-kind', 'a unique', 'an artifact-quality']
};

const formatItemName = (name: string) => name.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

export function isGenericDescription(description: string, name: string): boolean {
    const lowerDesc = description.toLowerCase();
    const lowerName = formatItemName(name).toLowerCase();
    return lowerDesc === `a piece of clothing: ${lowerName}.` || lowerDesc === `a standard ${lowerName}.`;
}

export function generateProceduralItemDescription(item: Item): string {
    const { name, category, rarity, material, description } = item;

    // If a detailed description already exists (from LLM or definition), use it.
    if (description && !isGenericDescription(description, name)) {
        return description;
    }
    
    const formattedName = formatItemName(name).toLowerCase();
    const formattedMaterial = material?.toLowerCase() || 'an unknown material';
    const adjective = ADJECTIVES[rarity][Math.floor(Math.random() * ADJECTIVES[rarity].length)];
    const article = ['a', 'e', 'i', 'o', 'u'].includes(adjective.split(' ')[1][0]) ? 'an' : 'a';
    const fullAdjective = `${article} ${adjective.split(' ').slice(1).join(' ')}`;


    switch (category) {
        case 'Weapon':
            return `A utilitarian ${formattedName} of ${formattedMaterial}. It looks reliable, if unadorned.`;
        case 'Apparel':
            if (rarity === 'Junk') return `A tattered ${formattedName} made of worn ${formattedMaterial}.`;
            return `${fullAdjective.charAt(0).toUpperCase() + fullAdjective.slice(1)} ${formattedName} of ${formattedMaterial}, common but functional.`;
        case 'Material':
            return `A piece of ${formattedMaterial}, useful in crafting. The quality seems ${rarity.toLowerCase()}.`;
        case 'Food':
            return `An edible ${formattedName}. Looks to be of ${rarity.toLowerCase()} quality.`;
        case 'Tool':
             return `${fullAdjective.charAt(0).toUpperCase() + fullAdjective.slice(1)} ${formattedName}. It seems fit for its purpose.`;
        default:
            return `An item of note: a ${formattedName} of ${rarity.toLowerCase()} quality.`;
    }
}