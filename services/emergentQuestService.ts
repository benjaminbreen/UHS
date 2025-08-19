/**
 * Emergent Quest Service
 * Generates historically accurate, contextually appropriate quests based on the actual game world state
 */

import { Quest, QuestObjective, QuestReward } from '../types/questTypes';
import { MapData, TerrainStructure, NpcEntity, CulturalZone, HistoricalEra } from '../types';
import { getSeasonFromDate } from '../utils/dateUtils';
import { DISEASE_DATABASE } from '../constants/gameData/diseases';

interface EmergentQuestContext {
  mapData: MapData;
  playerLocation: { x: number; y: number };
  nearbyStructures: TerrainStructure[];
  nearbyNpcs: NpcEntity[];
  currentYear: number;
  culturalZone: CulturalZone;
  era: HistoricalEra;
  season: string;
  playerReputation?: number;
  playerProfession?: string;
}

interface QuestTemplate {
  id: string;
  name: string;
  requiredStructures?: string[];
  requiredConditions?: (context: EmergentQuestContext) => boolean;
  generateQuest: (context: EmergentQuestContext) => Quest | null;
  weight: number; // How likely this quest type is to be generated
  minReputation?: number;
}

export class EmergentQuestService {
  private questTemplates: QuestTemplate[] = [];
  
  constructor() {
    this.initializeQuestTemplates();
  }

  /**
   * Initialize realistic quest templates based on historical contexts
   */
  private initializeQuestTemplates() {
    // Trade and Commerce Quests
    this.questTemplates.push({
      id: 'merchant_delivery',
      name: 'Merchant Delivery',
      requiredStructures: ['marketplace'],
      weight: 3,
      generateQuest: (context) => {
        const marketplace = context.nearbyStructures.find(s => s.type === 'marketplace');
        const destination = context.nearbyStructures.find(s => 
          s.type === 'urban' && s.id !== marketplace?.id
        );
        
        if (!marketplace || !destination) return null;
        
        // Generate appropriate trade goods for the era and region
        const goods = this.getTradeGoods(context.culturalZone, context.era);
        
        return {
          id: `quest_delivery_${Date.now()}`,
          title: `Deliver ${goods} to ${destination.name || 'the city'}`,
          description: `A merchant at ${marketplace.name || 'the marketplace'} needs ${goods} delivered safely. The roads may be dangerous.`,
          category: 'commerce',
          objectives: [
            {
              id: 'pickup',
              type: 'visit_location',
              description: `Pick up ${goods} from the marketplace`,
              targetLocation: { x: marketplace.x, y: marketplace.y },
              completed: false,
              required: true
            },
            {
              id: 'deliver',
              type: 'deliver_item',
              description: `Deliver ${goods} to ${destination.name}`,
              targetLocation: { x: destination.x, y: destination.y },
              completed: false,
              required: true
            }
          ],
          currentObjectiveIndex: 0,
          rewards: [
            { type: 'gold', value: 50 + Math.floor(Math.random() * 100), guaranteed: true },
            { type: 'reputation', value: 5, guaranteed: true }
          ],
          startLocation: context.playerLocation,
          startTime: Date.now(),
          status: 'active',
          historicalContext: `Trade was vital in ${context.era} ${this.getCulturalName(context.culturalZone)}`,
          isLLMGenerated: false
        };
      }
    });

    // Medical/Healing Quests
    this.questTemplates.push({
      id: 'find_medicine',
      name: 'Find Medicine',
      weight: 2,
      requiredConditions: (context) => {
        // Check if there are sick NPCs nearby
        return context.nearbyNpcs.some(npc => 
          npc.health?.currentDiseases && npc.health.currentDiseases.length > 0
        );
      },
      generateQuest: (context) => {
        const sickNpc = context.nearbyNpcs.find(npc => 
          npc.health?.currentDiseases && npc.health.currentDiseases.length > 0
        );
        
        if (!sickNpc) return null;
        
        const disease = sickNpc.health!.currentDiseases[0].disease;
        const medicine = this.getMedicineForEra(context.era, disease.type);
        
        // Find a place to get medicine - marketplace, holy site, or urban area
        const medicineSource = context.nearbyStructures.find(s => 
          s.type === 'marketplace' || s.type === 'holy_site' || s.type === 'urban'
        );
        
        if (!medicineSource) return null;
        
        return {
          id: `quest_medicine_${Date.now()}`,
          title: `Help ${sickNpc.name} find treatment`,
          description: `${sickNpc.name} is suffering from ${disease.name}. Find ${medicine} to help them.`,
          category: 'humanitarian',
          objectives: [
            {
              id: 'find_medicine',
              type: 'collect_item',
              description: `Find ${medicine} at ${medicineSource.name || 'a nearby settlement'}`,
              targetLocation: { x: medicineSource.x, y: medicineSource.y },
              targetItem: medicine,
              completed: false,
              required: true
            },
            {
              id: 'deliver_medicine',
              type: 'talk_to_npc',
              description: `Bring the ${medicine} to ${sickNpc.name}`,
              targetNpcId: sickNpc.id,
              targetLocation: { x: sickNpc.x, y: sickNpc.y },
              completed: false,
              required: true
            }
          ],
          currentObjectiveIndex: 0,
          rewards: [
            { type: 'reputation', value: 10, guaranteed: true },
            { type: 'gold', value: 20, guaranteed: false }
          ],
          startLocation: context.playerLocation,
          startTime: Date.now(),
          status: 'active',
          historicalContext: `${disease.name} was a serious concern in ${context.era}. ${medicine} was a common treatment.`,
          isLLMGenerated: false
        };
      }
    });

    // Religious/Pilgrimage Quests
    this.questTemplates.push({
      id: 'pilgrimage',
      name: 'Religious Pilgrimage',
      requiredStructures: ['holy_site'],
      weight: 2,
      generateQuest: (context) => {
        const holySites = context.nearbyStructures.filter(s => s.type === 'holy_site');
        if (holySites.length < 2) return null;
        
        const startSite = holySites[0];
        const endSite = holySites[holySites.length - 1];
        const religion = this.getReligionForContext(context.culturalZone, context.era);
        
        return {
          id: `quest_pilgrimage_${Date.now()}`,
          title: `${religion} Pilgrimage`,
          description: `Make a pilgrimage from ${startSite.name} to ${endSite.name} to receive blessings.`,
          category: 'religious',
          objectives: [
            {
              id: 'visit_first',
              type: 'visit_location',
              description: `Pray at ${startSite.name}`,
              targetLocation: { x: startSite.x, y: startSite.y },
              completed: false,
              required: true
            },
            {
              id: 'visit_second',
              type: 'visit_location',
              description: `Complete pilgrimage at ${endSite.name}`,
              targetLocation: { x: endSite.x, y: endSite.y },
              completed: false,
              required: true
            }
          ],
          currentObjectiveIndex: 0,
          rewards: [
            { type: 'reputation', value: 15, guaranteed: true },
            { type: 'blessing', value: 1, guaranteed: true }
          ],
          startLocation: context.playerLocation,
          startTime: Date.now(),
          status: 'active',
          historicalContext: `Pilgrimage was an important religious practice in ${context.era} ${religion} tradition.`,
          isLLMGenerated: false
        };
      }
    });

    // Investigation/Mystery Quests
    this.questTemplates.push({
      id: 'investigate_ruins',
      name: 'Investigate Ruins',
      requiredStructures: ['ruins'],
      weight: 1,
      minReputation: 30,
      generateQuest: (context) => {
        const ruins = context.nearbyStructures.find(s => s.type === 'ruins');
        if (!ruins) return null;
        
        const palace = context.nearbyStructures.find(s => s.type === 'palace');
        const artifact = this.getArtifactForContext(context.culturalZone, context.era);
        
        return {
          id: `quest_ruins_${Date.now()}`,
          title: `Explore the ${ruins.name || 'Ancient Ruins'}`,
          description: palace ? 
            `The ruler at ${palace.name} seeks brave explorers to investigate ${ruins.name} and recover ${artifact}.` :
            `Local rumors speak of ${artifact} hidden in ${ruins.name || 'the ancient ruins'}.`,
          category: 'exploration',
          objectives: [
            {
              id: 'explore',
              type: 'explore_area',
              description: `Explore ${ruins.name || 'the ruins'}`,
              targetLocation: { x: ruins.x, y: ruins.y },
              radius: 3,
              completed: false,
              required: true
            },
            {
              id: 'find_artifact',
              type: 'collect_item',
              description: `Find ${artifact}`,
              targetItem: artifact,
              targetLocation: { x: ruins.x, y: ruins.y },
              completed: false,
              required: true
            }
          ],
          currentObjectiveIndex: 0,
          rewards: [
            { type: 'gold', value: 200, guaranteed: true },
            { type: 'reputation', value: 20, guaranteed: true },
            { type: 'item', itemId: artifact, value: 1, guaranteed: false }
          ],
          startLocation: context.playerLocation,
          startTime: Date.now(),
          status: 'active',
          historicalContext: `Archaeological exploration in ${context.era} often sought ${artifact} from earlier civilizations.`,
          isLLMGenerated: false
        };
      }
    });

    // Seasonal/Agricultural Quests
    this.questTemplates.push({
      id: 'harvest_help',
      name: 'Harvest Assistance',
      requiredStructures: ['farm'],
      weight: 2,
      requiredConditions: (context) => {
        const season = getSeasonFromDate({ year: context.currentYear, month: 1, day: 1 });
        return season === 'Autumn' || season === 'Summer';
      },
      generateQuest: (context) => {
        const farm = context.nearbyStructures.find(s => s.type === 'farm');
        if (!farm) return null;
        
        const crop = this.getCropForRegion(context.culturalZone, context.era);
        
        return {
          id: `quest_harvest_${Date.now()}`,
          title: `Help with ${crop} Harvest`,
          description: `The farmers at ${farm.name || 'the farm'} need help bringing in the ${crop} harvest before the weather turns.`,
          category: 'livelihood',
          objectives: [
            {
              id: 'help_harvest',
              type: 'work_location',
              description: `Help harvest ${crop} at ${farm.name || 'the farm'}`,
              targetLocation: { x: farm.x, y: farm.y },
              duration: 3, // days
              completed: false,
              required: true
            }
          ],
          currentObjectiveIndex: 0,
          rewards: [
            { type: 'gold', value: 30, guaranteed: true },
            { type: 'food', value: 10, guaranteed: true },
            { type: 'reputation', value: 5, guaranteed: true }
          ],
          startLocation: context.playerLocation,
          startTime: Date.now(),
          status: 'active',
          historicalContext: `Seasonal harvests of ${crop} were crucial for survival in ${context.era}.`,
          isLLMGenerated: false
        };
      }
    });

    // Government/Political Quests
    this.questTemplates.push({
      id: 'government_task',
      name: 'Government Commission',
      requiredStructures: ['government', 'palace'],
      weight: 1,
      minReputation: 40,
      generateQuest: (context) => {
        const govBuilding = context.nearbyStructures.find(s => 
          s.type === 'government' || s.type === 'palace'
        );
        if (!govBuilding) return null;
        
        const task = this.getGovernmentTask(context.culturalZone, context.era);
        
        return {
          id: `quest_government_${Date.now()}`,
          title: task.title,
          description: `The authorities at ${govBuilding.name} require ${task.description}`,
          category: 'political',
          objectives: task.objectives,
          currentObjectiveIndex: 0,
          rewards: [
            { type: 'gold', value: 100, guaranteed: true },
            { type: 'reputation', value: 25, guaranteed: true },
            { type: 'title', value: task.title, guaranteed: false }
          ],
          startLocation: context.playerLocation,
          startTime: Date.now(),
          status: 'active',
          historicalContext: task.historicalContext,
          isLLMGenerated: false
        };
      }
    });
  }

  /**
   * Generate contextually appropriate quests for the current game state
   */
  generateEmergentQuests(context: EmergentQuestContext): Quest[] {
    const quests: Quest[] = [];
    const maxQuests = 3; // Generate up to 3 quests
    
    // Filter templates based on requirements
    const validTemplates = this.questTemplates.filter(template => {
      // Check required structures
      if (template.requiredStructures) {
        const hasAllStructures = template.requiredStructures.every(structType =>
          context.nearbyStructures.some(s => s.type === structType)
        );
        if (!hasAllStructures) return false;
      }
      
      // Check custom conditions
      if (template.requiredConditions && !template.requiredConditions(context)) {
        return false;
      }
      
      // Check reputation requirement
      if (template.minReputation && (context.playerReputation || 0) < template.minReputation) {
        return false;
      }
      
      return true;
    });
    
    // Weight-based selection
    for (let i = 0; i < maxQuests && validTemplates.length > 0; i++) {
      const totalWeight = validTemplates.reduce((sum, t) => sum + t.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (const template of validTemplates) {
        random -= template.weight;
        if (random <= 0) {
          const quest = template.generateQuest(context);
          if (quest) {
            quests.push(quest);
            // Remove this template from consideration for next iteration
            validTemplates.splice(validTemplates.indexOf(template), 1);
          }
          break;
        }
      }
    }
    
    return quests;
  }

  /**
   * Generate a quest offer from an NPC based on their situation
   */
  generateNpcQuest(npc: NpcEntity, context: EmergentQuestContext): Quest | null {
    // Check if NPC or their family is sick
    if (npc.health?.currentDiseases && npc.health.currentDiseases.length > 0) {
      return this.generateMedicineQuest(npc, context);
    }
    
    // Check NPC profession for relevant quests
    if (npc.profession?.toLowerCase().includes('merchant') || npc.profession?.toLowerCase().includes('trader')) {
      return this.generateTradeQuest(npc, context);
    }
    
    if (npc.profession?.toLowerCase().includes('priest') || npc.profession?.toLowerCase().includes('monk')) {
      return this.generateReligiousQuest(npc, context);
    }
    
    if (npc.profession?.toLowerCase().includes('farmer')) {
      return this.generateFarmQuest(npc, context);
    }
    
    // Random personal request
    if (Math.random() < 0.3) {
      return this.generatePersonalQuest(npc, context);
    }
    
    return null;
  }

  private generateMedicineQuest(npc: NpcEntity, context: EmergentQuestContext): Quest | null {
    const disease = npc.health!.currentDiseases[0].disease;
    const medicine = this.getMedicineForEra(context.era, disease.type);
    
    return {
      id: `quest_npc_medicine_${Date.now()}`,
      title: `Help ${npc.name}`,
      description: `${npc.name} is suffering from ${disease.name} and desperately needs ${medicine}.`,
      category: 'humanitarian',
      objectives: [
        {
          id: 'find_cure',
          type: 'collect_item',
          description: `Find ${medicine} for ${npc.name}`,
          targetItem: medicine,
          completed: false,
          required: true
        },
        {
          id: 'deliver_cure',
          type: 'talk_to_npc',
          description: `Bring the ${medicine} back to ${npc.name}`,
          targetNpcId: npc.id,
          targetLocation: { x: npc.x, y: npc.y },
          completed: false,
          required: true
        }
      ],
      currentObjectiveIndex: 0,
      rewards: [
        { type: 'reputation', value: 15, guaranteed: true },
        { type: 'gold', value: npc.wealth === 'wealthy' ? 50 : 10, guaranteed: true }
      ],
      startLocation: { x: npc.x, y: npc.y },
      startTime: Date.now(),
      status: 'active',
      historicalContext: `${disease.name} was often treated with ${medicine} in this era.`,
      isLLMGenerated: false
    };
  }

  private generateTradeQuest(npc: NpcEntity, context: EmergentQuestContext): Quest | null {
    const goods = this.getTradeGoods(context.culturalZone, context.era);
    const destination = context.nearbyStructures.find(s => 
      (s.type === 'marketplace' || s.type === 'urban') && 
      Math.abs(s.x - npc.x) > 5
    );
    
    if (!destination) return null;
    
    return {
      id: `quest_npc_trade_${Date.now()}`,
      title: `Trade Mission for ${npc.name}`,
      description: `${npc.name} needs someone trustworthy to deliver ${goods} to ${destination.name}.`,
      category: 'commerce',
      objectives: [
        {
          id: 'deliver',
          type: 'deliver_item',
          description: `Deliver ${goods} to ${destination.name}`,
          targetLocation: { x: destination.x, y: destination.y },
          targetItem: goods,
          completed: false,
          required: true
        }
      ],
      currentObjectiveIndex: 0,
      rewards: [
        { type: 'gold', value: 75, guaranteed: true },
        { type: 'reputation', value: 10, guaranteed: true }
      ],
      startLocation: { x: npc.x, y: npc.y },
      startTime: Date.now(),
      status: 'active',
      historicalContext: `Trade in ${goods} was common in ${context.era}.`,
      isLLMGenerated: false
    };
  }

  private generateReligiousQuest(npc: NpcEntity, context: EmergentQuestContext): Quest | null {
    const holySite = context.nearbyStructures.find(s => s.type === 'holy_site');
    if (!holySite) return null;
    
    const religion = this.getReligionForContext(context.culturalZone, context.era);
    const offering = this.getReligiousOffering(context.culturalZone, context.era);
    
    return {
      id: `quest_npc_religious_${Date.now()}`,
      title: `Sacred Offering`,
      description: `${npc.name} asks you to deliver ${offering} to ${holySite.name} as an offering.`,
      category: 'religious',
      objectives: [
        {
          id: 'deliver_offering',
          type: 'deliver_item',
          description: `Deliver ${offering} to ${holySite.name}`,
          targetLocation: { x: holySite.x, y: holySite.y },
          targetItem: offering,
          completed: false,
          required: true
        }
      ],
      currentObjectiveIndex: 0,
      rewards: [
        { type: 'blessing', value: 1, guaranteed: true },
        { type: 'reputation', value: 20, guaranteed: true }
      ],
      startLocation: { x: npc.x, y: npc.y },
      startTime: Date.now(),
      status: 'active',
      historicalContext: `${offering} was a traditional offering in ${religion} practice.`,
      isLLMGenerated: false
    };
  }

  private generateFarmQuest(npc: NpcEntity, context: EmergentQuestContext): Quest | null {
    const season = getSeasonFromDate({ year: context.currentYear, month: 1, day: 1 });
    const task = season === 'Spring' ? 'planting' : 
                 season === 'Summer' ? 'weeding' :
                 season === 'Autumn' ? 'harvesting' : 'preparing fields';
    
    return {
      id: `quest_npc_farm_${Date.now()}`,
      title: `Help with ${task}`,
      description: `${npc.name} needs help with ${task} on their farm.`,
      category: 'livelihood',
      objectives: [
        {
          id: 'farm_work',
          type: 'work_location',
          description: `Help ${npc.name} with ${task}`,
          targetLocation: { x: npc.x, y: npc.y },
          duration: 2,
          completed: false,
          required: true
        }
      ],
      currentObjectiveIndex: 0,
      rewards: [
        { type: 'food', value: 5, guaranteed: true },
        { type: 'gold', value: 20, guaranteed: true },
        { type: 'reputation', value: 5, guaranteed: true }
      ],
      startLocation: { x: npc.x, y: npc.y },
      startTime: Date.now(),
      status: 'active',
      historicalContext: `Seasonal farm work was essential for survival in ${context.era}.`,
      isLLMGenerated: false
    };
  }

  private generatePersonalQuest(npc: NpcEntity, context: EmergentQuestContext): Quest | null {
    const quests = [
      {
        title: `Find ${npc.name}'s Lost Item`,
        description: `${npc.name} has lost a precious family heirloom nearby.`,
        objective: 'search_area'
      },
      {
        title: `Deliver Letter for ${npc.name}`,
        description: `${npc.name} needs a letter delivered to a friend in a nearby settlement.`,
        objective: 'deliver_item'
      },
      {
        title: `Gather Information for ${npc.name}`,
        description: `${npc.name} seeks news about recent events in the region.`,
        objective: 'gather_information'
      }
    ];
    
    const quest = quests[Math.floor(Math.random() * quests.length)];
    
    return {
      id: `quest_npc_personal_${Date.now()}`,
      title: quest.title,
      description: quest.description,
      category: 'personal',
      objectives: [
        {
          id: 'task',
          type: quest.objective as any,
          description: quest.description,
          targetLocation: { x: npc.x + Math.floor(Math.random() * 10 - 5), y: npc.y + Math.floor(Math.random() * 10 - 5) },
          completed: false,
          required: true
        }
      ],
      currentObjectiveIndex: 0,
      rewards: [
        { type: 'gold', value: 15, guaranteed: true },
        { type: 'reputation', value: 5, guaranteed: true }
      ],
      startLocation: { x: npc.x, y: npc.y },
      startTime: Date.now(),
      status: 'active',
      historicalContext: `Personal favors and mutual aid were important in ${context.era} communities.`,
      isLLMGenerated: false
    };
  }

  // Helper methods for generating contextually appropriate content
  private getTradeGoods(zone: CulturalZone, era: HistoricalEra): string {
    const goods: Record<CulturalZone, Record<string, string[]>> = {
      EUROPEAN: {
        MEDIEVAL: ['wool', 'wine', 'grain', 'furs', 'amber'],
        RENAISSANCE_EARLY_MODERN: ['spices', 'silk', 'sugar', 'tobacco', 'silver'],
        INDUSTRIAL_ERA: ['cotton', 'coal', 'machinery', 'textiles'],
        MODERN_ERA: ['automobiles', 'electronics', 'pharmaceuticals']
      },
      MENA: {
        MEDIEVAL: ['spices', 'incense', 'dates', 'carpets', 'glass'],
        RENAISSANCE_EARLY_MODERN: ['coffee', 'cotton', 'pearls', 'horses'],
        INDUSTRIAL_ERA: ['oil', 'cotton', 'tobacco'],
        MODERN_ERA: ['petroleum', 'natural gas', 'electronics']
      },
      EAST_ASIAN: {
        MEDIEVAL: ['silk', 'tea', 'porcelain', 'paper', 'lacquerware'],
        RENAISSANCE_EARLY_MODERN: ['tea', 'silk', 'porcelain', 'silver'],
        INDUSTRIAL_ERA: ['silk', 'tea', 'opium', 'rice'],
        MODERN_ERA: ['electronics', 'automobiles', 'steel']
      },
      SOUTH_ASIAN: {
        MEDIEVAL: ['spices', 'cotton', 'diamonds', 'indigo'],
        RENAISSANCE_EARLY_MODERN: ['textiles', 'spices', 'tea', 'opium'],
        INDUSTRIAL_ERA: ['cotton', 'jute', 'tea', 'indigo'],
        MODERN_ERA: ['textiles', 'software', 'pharmaceuticals']
      },
      SUB_SAHARAN_AFRICAN: {
        MEDIEVAL: ['gold', 'ivory', 'salt', 'slaves'],
        RENAISSANCE_EARLY_MODERN: ['gold', 'ivory', 'slaves', 'palm oil'],
        INDUSTRIAL_ERA: ['rubber', 'diamonds', 'cocoa', 'palm oil'],
        MODERN_ERA: ['oil', 'minerals', 'cocoa', 'coffee']
      },
      NORTH_AMERICAN_PRE_COLUMBIAN: {
        MEDIEVAL: ['furs', 'maize', 'tobacco', 'turquoise'],
        RENAISSANCE_EARLY_MODERN: ['furs', 'tobacco', 'sassafras'],
        INDUSTRIAL_ERA: ['cotton', 'wheat', 'cattle', 'oil'],
        MODERN_ERA: ['automobiles', 'aircraft', 'software']
      },
      SOUTH_AMERICAN: {
        MEDIEVAL: ['gold', 'silver', 'coca', 'potatoes'],
        RENAISSANCE_EARLY_MODERN: ['silver', 'sugar', 'gold', 'brazilwood'],
        INDUSTRIAL_ERA: ['rubber', 'coffee', 'nitrates', 'beef'],
        MODERN_ERA: ['oil', 'soybeans', 'copper', 'lithium']
      },
      OCEANIA: {
        MEDIEVAL: ['shells', 'feathers', 'sandalwood', 'taro'],
        RENAISSANCE_EARLY_MODERN: ['sandalwood', 'pearls', 'trepang'],
        INDUSTRIAL_ERA: ['wool', 'gold', 'wheat', 'sugar'],
        MODERN_ERA: ['minerals', 'wool', 'wine', 'tourism']
      }
    } as any;
    
    const eraGoods = goods[zone]?.[era] || goods[zone]?.MEDIEVAL || ['trade goods'];
    return eraGoods[Math.floor(Math.random() * eraGoods.length)];
  }

  private getMedicineForEra(era: HistoricalEra, diseaseType: string): string {
    const medicines: Record<string, string[]> = {
      MEDIEVAL: ['herbal remedy', 'prayer and bloodletting', 'holy water', 'medicinal herbs'],
      RENAISSANCE_EARLY_MODERN: ['apothecary tonic', 'herbal tincture', 'laudanum', 'mercury treatment'],
      INDUSTRIAL_ERA: ['patent medicine', 'carbolic acid', 'quinine', 'morphine'],
      MODERN_ERA: ['antibiotics', 'vaccines', 'antiviral drugs', 'modern medicine']
    };
    
    const eraMedicines = medicines[era] || medicines.MEDIEVAL;
    return eraMedicines[Math.floor(Math.random() * eraMedicines.length)];
  }

  private getReligionForContext(zone: CulturalZone, era: HistoricalEra): string {
    const religions: Record<CulturalZone, string[]> = {
      EUROPEAN: ['Christianity', 'Catholicism', 'Protestantism'],
      MENA: ['Islam', 'Judaism', 'Zoroastrianism'],
      EAST_ASIAN: ['Buddhism', 'Taoism', 'Confucianism', 'Shinto'],
      SOUTH_ASIAN: ['Hinduism', 'Buddhism', 'Sikhism', 'Jainism'],
      SUB_SAHARAN_AFRICAN: ['Traditional African', 'Islam', 'Christianity'],
      NORTH_AMERICAN_PRE_COLUMBIAN: ['Native Spirituality', 'Animism'],
      SOUTH_AMERICAN: ['Inca Religion', 'Catholicism', 'Native Beliefs'],
      OCEANIA: ['Aboriginal Dreamtime', 'Polynesian Religion']
    } as any;
    
    const zoneReligions = religions[zone] || ['Local Faith'];
    return zoneReligions[0]; // Return primary religion for the zone
  }

  private getCropForRegion(zone: CulturalZone, era: HistoricalEra): string {
    const crops: Record<CulturalZone, string[]> = {
      EUROPEAN: ['wheat', 'barley', 'rye', 'oats'],
      MENA: ['dates', 'wheat', 'barley', 'olives'],
      EAST_ASIAN: ['rice', 'millet', 'soybeans', 'tea'],
      SOUTH_ASIAN: ['rice', 'wheat', 'cotton', 'jute'],
      SUB_SAHARAN_AFRICAN: ['millet', 'sorghum', 'yams', 'cassava'],
      NORTH_AMERICAN_PRE_COLUMBIAN: ['maize', 'squash', 'beans'],
      SOUTH_AMERICAN: ['potatoes', 'quinoa', 'maize', 'coca'],
      OCEANIA: ['taro', 'yams', 'breadfruit', 'coconut']
    } as any;
    
    const zoneCrops = crops[zone] || ['grain'];
    return zoneCrops[Math.floor(Math.random() * zoneCrops.length)];
  }

  private getArtifactForContext(zone: CulturalZone, era: HistoricalEra): string {
    const artifacts: Record<CulturalZone, string[]> = {
      EUROPEAN: ['ancient scroll', 'Roman coin', 'medieval manuscript', 'Viking relic'],
      MENA: ['cuneiform tablet', 'Persian seal', 'Islamic manuscript', 'ancient papyrus'],
      EAST_ASIAN: ['jade seal', 'bronze vessel', 'silk scroll', 'porcelain vase'],
      SOUTH_ASIAN: ['Sanskrit text', 'Mughal miniature', 'temple statue', 'ancient coin'],
      SUB_SAHARAN_AFRICAN: ['bronze plaque', 'ivory carving', 'gold weight', 'terracotta figure'],
      NORTH_AMERICAN_PRE_COLUMBIAN: ['turquoise amulet', 'pottery shard', 'obsidian blade', 'shell gorget'],
      SOUTH_AMERICAN: ['gold figurine', 'quipu', 'ceramic vessel', 'jade mask'],
      OCEANIA: ['tiki statue', 'shell ornament', 'stone adze', 'feather cloak']
    } as any;
    
    const zoneArtifacts = artifacts[zone] || ['ancient artifact'];
    return zoneArtifacts[Math.floor(Math.random() * zoneArtifacts.length)];
  }

  private getReligiousOffering(zone: CulturalZone, era: HistoricalEra): string {
    const offerings: Record<CulturalZone, string[]> = {
      EUROPEAN: ['candles', 'incense', 'silver cross', 'holy oil'],
      MENA: ['prayer rug', 'incense', 'dates', 'rose water'],
      EAST_ASIAN: ['incense', 'rice wine', 'paper money', 'flowers'],
      SOUTH_ASIAN: ['flowers', 'ghee lamp', 'prasad', 'sandalwood'],
      SUB_SAHARAN_AFRICAN: ['kola nuts', 'palm wine', 'cowrie shells', 'libation'],
      NORTH_AMERICAN_PRE_COLUMBIAN: ['tobacco', 'corn meal', 'sage', 'turquoise'],
      SOUTH_AMERICAN: ['coca leaves', 'chicha', 'llama wool', 'gold dust'],
      OCEANIA: ['kava', 'tapa cloth', 'pig', 'yams']
    } as any;
    
    const zoneOfferings = offerings[zone] || ['sacred offering'];
    return zoneOfferings[Math.floor(Math.random() * zoneOfferings.length)];
  }

  private getGovernmentTask(zone: CulturalZone, era: HistoricalEra): any {
    const tasks = [
      {
        title: 'Tax Collection',
        description: 'assistance collecting taxes from outlying settlements',
        objectives: [
          {
            id: 'collect',
            type: 'visit_location',
            description: 'Collect taxes from three settlements',
            completed: false,
            required: true
          }
        ],
        historicalContext: `Tax collection was a crucial government function in ${era}.`
      },
      {
        title: 'Census Taking',
        description: 'help conducting a census of the region',
        objectives: [
          {
            id: 'census',
            type: 'gather_information',
            description: 'Survey population in nearby areas',
            completed: false,
            required: true
          }
        ],
        historicalContext: `Population censuses were important for administration in ${era}.`
      },
      {
        title: 'Road Survey',
        description: 'someone to survey roads and report their condition',
        objectives: [
          {
            id: 'survey',
            type: 'explore_area',
            description: 'Survey the main roads',
            radius: 10,
            completed: false,
            required: true
          }
        ],
        historicalContext: `Road maintenance was vital for trade and military movement in ${era}.`
      }
    ];
    
    return tasks[Math.floor(Math.random() * tasks.length)];
  }

  private getCulturalName(zone: CulturalZone): string {
    const names: Record<CulturalZone, string> = {
      EUROPEAN: 'Europe',
      MENA: 'Middle East',
      EAST_ASIAN: 'East Asia',
      SOUTH_ASIAN: 'South Asia',
      SUB_SAHARAN_AFRICAN: 'Africa',
      NORTH_AMERICAN_PRE_COLUMBIAN: 'North America',
      SOUTH_AMERICAN: 'South America',
      OCEANIA: 'Oceania'
    } as any;
    
    return names[zone] || 'this region';
  }
}

export const emergentQuestService = new EmergentQuestService();