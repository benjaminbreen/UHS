/**
 * services/npcDescriptionService.ts - Procedural description generator for NPCs.
 */
import { NpcEntity, HistoricalEra, WealthLevel } from '../types';

const ageAdjectives: { [key in 'young' | 'adult' | 'old']: string[] } = {
    young: ['young', 'youthful', 'fresh-faced'],
    adult: ['adult', 'middle-aged', 'in their prime'],
    old: ['old', 'elderly', 'weathered', 'wizened']
};

function getRandomFromList(list: any[]): any {
    if (!list || list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
}

function cmToFeetAndInches(cm: number): string {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}' ${inches}"`;
}

export function generateNpcDescriptions(npc: NpcEntity): { short: string; long: string } {
    const ageCategory = npc.age > 55 ? 'old' : npc.age > 25 ? 'adult' : 'young';
    const ageAdj = getRandomFromList(ageAdjectives[ageCategory]);
    
    // Short description for UI lists
    const shortDesc = `A ${ageAdj} ${npc.gender.toLowerCase()} ${npc.role}.`;

    // Long, narrative description for modals, built from the unified profile
    const sentences: string[] = [];
    
    const heightStr = cmToFeetAndInches(npc.appearance.height);
    const professionDesc = `You see a ${ageAdj} ${npc.gender.toLowerCase()} of about ${npc.age} years old who appears to be a ${npc.role.toLowerCase()}. They stand about ${heightStr} tall with a ${npc.appearance.build} frame.`;
    sentences.push(professionDesc);
    
    const garmentDesc = npc.appearance.garment?.name.toLowerCase().replace(/_/g, ' ') || 'simple clothes';
    const clothingDesc = `They are dressed in a ${garmentDesc} and sturdy ${npc.appearance.footwear?.name.toLowerCase().replace(/_/g, ' ')}, suitable for their station.`;
    sentences.push(clothingDesc);
    
    // Add accessory description if present
    if (npc.equippedItems?.accessory) {
        const accessory = npc.equippedItems.accessory;
        const name = accessory.name.toLowerCase();
        const specialType = (accessory as any).specialType;
        
        let accessoryDesc = '';
        if (specialType === 'tattoo') {
            accessoryDesc = `Their skin bears ${accessory.name.toLowerCase()}, telling a story of identity and heritage.`;
        } else if (specialType === 'scarification') {
            accessoryDesc = `Ritual scars mark their skin - ${accessory.name.toLowerCase()} - indicating important life transitions.`;
        } else if (specialType === 'face_paint') {
            const duration = (accessory as any).duration;
            const freshness = duration && duration > 12 ? 'fresh' : duration && duration > 6 ? 'fading' : 'nearly faded';
            accessoryDesc = `${freshness.charAt(0).toUpperCase() + freshness.slice(1)} ${accessory.name.toLowerCase()} adorns their face in traditional patterns.`;
        } else if (specialType === 'henna') {
            const duration = (accessory as any).duration;
            const condition = duration && duration > 48 ? 'intricate' : duration && duration > 24 ? 'detailed' : 'fading';
            accessoryDesc = `${condition.charAt(0).toUpperCase() + condition.slice(1)} ${accessory.name.toLowerCase()} decorates their hands and arms.`;
        } else if (name.includes('earring') || name.includes('ear')) {
            accessoryDesc = `${accessory.name} glint from their ears.`;
        } else if (name.includes('nose')) {
            accessoryDesc = `A ${accessory.name.toLowerCase()} adorns their nose.`;
        } else if (name.includes('bindi') || name.includes('tilak') || name.includes('tikka')) {
            accessoryDesc = `A ${accessory.name.toLowerCase()} marks their forehead, indicating their cultural heritage.`;
        } else {
            accessoryDesc = `They wear ${accessory.name.toLowerCase()}, a mark of their cultural identity.`;
        }
        
        if (accessoryDesc) {
            sentences.push(accessoryDesc);
        }
    }
    
    let demeanorDesc = `They have a ${npc.appearance.affect} demeanor, `;
    if (npc.personality.neuroticism > 0.75) {
        demeanorDesc += `seeming anxious and avoiding direct eye contact.`;
    } else if (npc.personality.agreeableness < 0.25) {
        demeanorDesc += `with a stern, unapproachable expression fixed on their face.`;
    } else if (npc.personality.extraversion > 0.75) {
        demeanorDesc += `with a friendly and open expression, as if ready for conversation.`;
    } else {
        demeanorDesc += `carrying themselves with a quiet, unassuming presence.`;
    }
    sentences.push(demeanorDesc);

    const longDescription = [...new Set(sentences)].join(' ');

    return { short: shortDesc, long: longDescription };
}
