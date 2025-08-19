/**
 * Quest Chain Service
 * Manages quest chains, progression, and dynamic quest generation
 */

import { Quest, QuestChain, QuestObjective, QuestReward } from '../types/questTypes';
import { questService } from './questService';
import { lootService } from './lootService';
import { eventService } from './eventService';
import { HistoricalEra } from '../types';

interface QuestChainTemplate {
  id: string;
  name: string;
  description: string;
  culturalVariants: Record<string, any>;
  questTemplates: QuestStageTemplate[];
  finalRewards: QuestReward[];
}

interface QuestStageTemplate {
  stageNumber: number;
  titleTemplate: string;
  descriptionTemplate: string;
  objectiveTypes: string[];
  difficultyModifier: number;
  unlockConditions?: string[];
  narrativeHooks?: string[];
}

export class QuestChainService {
  private activeChains: Map<string, QuestChain> = new Map();
  private chainTemplates: Map<string, QuestChainTemplate> = new Map();
  private completedChains: Set<string> = new Set();
  private questProgressListeners: Set<(quest: Quest) => void> = new Set();

  constructor() {
    this.initializeChainTemplates();
    this.loadSavedChains();
  }

  /**
   * Initialize quest chain templates
   */
  private initializeChainTemplates(): void {
    // The Lost Expedition Chain
    this.addChainTemplate({
      id: 'lost_expedition',
      name: 'The Lost Expedition',
      description: 'Follow the trail of a missing expedition through increasingly dangerous territory',
      culturalVariants: {
        'EUROPEAN': { theme: 'crusader knights', artifact: 'holy grail' },
        'MENA': { theme: 'desert caravan', artifact: 'djinn lamp' },
        'EAST_ASIAN': { theme: 'imperial envoys', artifact: 'jade seal' },
        'SOUTH_AMERICAN': { theme: 'conquistadors', artifact: 'golden idol' }
      },
      questTemplates: [
        {
          stageNumber: 1,
          titleTemplate: 'Missing {group}',
          descriptionTemplate: 'A {group} has gone missing. Find clues about their last known location.',
          objectiveTypes: ['gather_information', 'visit_location'],
          difficultyModifier: 1.0,
          narrativeHooks: ['mysterious map fragment', 'cryptic journal entry', 'witness testimony']
        },
        {
          stageNumber: 2,
          titleTemplate: 'Following the Trail',
          descriptionTemplate: 'The trail leads deeper into dangerous territory. Track the {group} through hostile lands.',
          objectiveTypes: ['explore_area', 'survive_duration', 'defeat_entity'],
          difficultyModifier: 1.5,
          narrativeHooks: ['abandoned campsite', 'signs of struggle', 'local warnings']
        },
        {
          stageNumber: 3,
          titleTemplate: 'The Final Discovery',
          descriptionTemplate: 'Uncover the fate of the {group} and recover the {artifact}.',
          objectiveTypes: ['solve_puzzle', 'make_choice', 'defeat_entity'],
          difficultyModifier: 2.0,
          narrativeHooks: ['ancient guardian', 'moral dilemma', 'unexpected survivors']
        }
      ],
      finalRewards: [
        {
          type: 'item',
          itemId: 'legendary_artifact',
          value: 1000,
          description: 'The legendary artifact',
          guaranteed: true
        },
        {
          type: 'reputation',
          value: 100,
          description: 'Fame as an explorer',
          guaranteed: true
        },
        {
          type: 'quest_unlock',
          value: 'legendary_quests',
          description: 'Access to legendary quests',
          guaranteed: true
        }
      ]
    });

    // The Trade Empire Chain
    this.addChainTemplate({
      id: 'trade_empire',
      name: 'Building a Trade Empire',
      description: 'Establish and expand a trading network across the region',
      culturalVariants: {
        'EUROPEAN': { goods: 'wool and wine', rival: 'Hanseatic League' },
        'MENA': { goods: 'spices and silk', rival: 'merchant princes' },
        'EAST_ASIAN': { goods: 'tea and porcelain', rival: 'zaibatsu' },
        'SUB_SAHARAN_AFRICAN': { goods: 'gold and ivory', rival: 'coastal traders' }
      },
      questTemplates: [
        {
          stageNumber: 1,
          titleTemplate: 'First Contacts',
          descriptionTemplate: 'Establish initial trade relationships and secure your first contracts.',
          objectiveTypes: ['talk_to_npc', 'deliver_item', 'visit_location'],
          difficultyModifier: 1.0,
          narrativeHooks: ['merchant guild invitation', 'rare goods opportunity', 'trade route discovery']
        },
        {
          stageNumber: 2,
          titleTemplate: 'Expanding Operations',
          descriptionTemplate: 'Expand your network while dealing with {rival} competition.',
          objectiveTypes: ['escort_npc', 'collect_item', 'reach_destination'],
          difficultyModifier: 1.3,
          narrativeHooks: ['sabotage attempts', 'exclusive contracts', 'new markets']
        },
        {
          stageNumber: 3,
          titleTemplate: 'Trade Monopoly',
          descriptionTemplate: 'Secure a monopoly on {goods} trade in the region.',
          objectiveTypes: ['make_choice', 'defeat_entity', 'gather_information'],
          difficultyModifier: 1.8,
          narrativeHooks: ['hostile takeover', 'political intrigue', 'economic warfare']
        },
        {
          stageNumber: 4,
          titleTemplate: 'Master Merchant',
          descriptionTemplate: 'Become the most influential trader in the known world.',
          objectiveTypes: ['reach_destination', 'talk_to_npc', 'make_choice'],
          difficultyModifier: 2.5,
          narrativeHooks: ['international recognition', 'legacy building', 'succession planning']
        }
      ],
      finalRewards: [
        {
          type: 'money',
          value: 10000,
          description: 'Vast trading wealth',
          guaranteed: true
        },
        {
          type: 'title',
          value: 'Master Merchant',
          description: 'Title: Master Merchant',
          guaranteed: true
        },
        {
          type: 'special_ability',
          value: 'trade_mastery',
          description: 'Trade at 50% better prices',
          guaranteed: true
        }
      ]
    });

    // The Ancient Mystery Chain
    this.addChainTemplate({
      id: 'ancient_mystery',
      name: 'Unraveling the Ancient Mystery',
      description: 'Decode ancient prophecies and prevent a catastrophe',
      culturalVariants: {
        'EUROPEAN': { prophecy: 'Arthurian legend', threat: 'eternal winter' },
        'MENA': { prophecy: 'tablet of destinies', threat: 'eternal sandstorm' },
        'EAST_ASIAN': { prophecy: 'celestial alignment', threat: 'dragon awakening' },
        'OCEANIA': { prophecy: 'ancestral dreamtime', threat: 'sea swallowing land' }
      },
      questTemplates: [
        {
          stageNumber: 1,
          titleTemplate: 'The First Sign',
          descriptionTemplate: 'Strange omens appear. Investigate the connection to {prophecy}.',
          objectiveTypes: ['gather_information', 'visit_location', 'talk_to_npc'],
          difficultyModifier: 1.0,
          narrativeHooks: ['celestial event', 'ancient text discovered', 'prophetic dreams']
        },
        {
          stageNumber: 2,
          titleTemplate: 'Gathering Knowledge',
          descriptionTemplate: 'Collect fragments of the prophecy from sacred sites.',
          objectiveTypes: ['explore_area', 'solve_puzzle', 'survive_duration'],
          difficultyModifier: 1.4,
          narrativeHooks: ['hidden libraries', 'wise hermits', 'forbidden knowledge']
        },
        {
          stageNumber: 3,
          titleTemplate: 'Race Against Time',
          descriptionTemplate: 'The {threat} approaches. Find the key to prevention.',
          objectiveTypes: ['defeat_entity', 'collect_item', 'reach_destination'],
          difficultyModifier: 2.0,
          narrativeHooks: ['cult interference', 'natural disasters', 'ancient guardians']
        },
        {
          stageNumber: 4,
          titleTemplate: 'The Final Hour',
          descriptionTemplate: 'Perform the ritual to prevent the {threat}.',
          objectiveTypes: ['solve_puzzle', 'make_choice', 'survive_duration'],
          difficultyModifier: 3.0,
          narrativeHooks: ['moral sacrifice', 'ultimate test', 'world-changing decision']
        }
      ],
      finalRewards: [
        {
          type: 'knowledge',
          value: 10,
          description: 'Ultimate wisdom',
          guaranteed: true
        },
        {
          type: 'blessing',
          value: 'divine_protection',
          description: 'Divine protection',
          guaranteed: true
        },
        {
          type: 'map_reveal',
          value: { radius: 50 },
          description: 'Reveal all hidden locations',
          guaranteed: true
        }
      ]
    });
  }

  /**
   * Add a chain template
   */
  private addChainTemplate(template: QuestChainTemplate): void {
    this.chainTemplates.set(template.id, template);
  }

  /**
   * Start a new quest chain
   */
  startQuestChain(
    chainId: string,
    playerLocation: { x: number; y: number },
    culturalZone: string,
    era: HistoricalEra
  ): QuestChain | null {
    const template = this.chainTemplates.get(chainId);
    if (!template) {
      console.warn(`[QuestChainService] Chain template not found: ${chainId}`);
      return null;
    }

    // Check if chain already active or completed
    if (this.activeChains.has(chainId) || this.completedChains.has(chainId)) {
      console.log(`[QuestChainService] Chain already active or completed: ${chainId}`);
      return null;
    }

    // Get cultural variant
    const variant = template.culturalVariants[culturalZone] || template.culturalVariants['EUROPEAN'];

    // Generate first quest in chain
    const firstQuest = this.generateChainQuest(
      template,
      template.questTemplates[0],
      variant,
      playerLocation,
      culturalZone,
      era,
      chainId,
      0
    );

    if (!firstQuest) {
      console.error(`[QuestChainService] Failed to generate first quest for chain: ${chainId}`);
      return null;
    }

    // Create quest chain
    const chain: QuestChain = {
      id: chainId,
      name: template.name,
      description: template.description,
      quests: [firstQuest],
      currentQuestIndex: 0,
      completed: false
    };

    // Save and activate chain
    this.activeChains.set(chainId, chain);
    this.saveChains();

    // Add first quest to quest service
    questService.addQuest(firstQuest);

    console.log(`[QuestChainService] Started quest chain: ${template.name}`);
    return chain;
  }

  /**
   * Generate a quest for a chain stage
   */
  private generateChainQuest(
    chainTemplate: QuestChainTemplate,
    stageTemplate: QuestStageTemplate,
    variant: any,
    playerLocation: { x: number; y: number },
    culturalZone: string,
    era: HistoricalEra,
    chainId: string,
    stageIndex: number
  ): Quest | null {
    // Replace template variables with variant values
    const title = this.replaceTemplateVars(stageTemplate.titleTemplate, variant);
    const description = this.replaceTemplateVars(stageTemplate.descriptionTemplate, variant);

    // Generate objectives based on template
    const objectives: QuestObjective[] = stageTemplate.objectiveTypes.map((type, index) => ({
      id: `obj_${chainId}_${stageIndex}_${index}`,
      type: type as any,
      description: this.generateObjectiveDescription(type, variant),
      completed: false,
      hidden: index > 0, // Hide later objectives initially
      optional: index >= stageTemplate.objectiveTypes.length - 1 && stageIndex > 0 // Last objective is optional except for first stage
    }));

    // Calculate difficulty
    const baseDifficulty = stageIndex === 0 ? 'easy' : stageIndex === 1 ? 'medium' : stageIndex === 2 ? 'hard' : 'legendary';
    
    // Generate stage-appropriate rewards
    const rewards = this.generateStageRewards(stageIndex, stageTemplate.difficultyModifier);

    // Add narrative hook to description
    const hook = stageTemplate.narrativeHooks?.[Math.floor(Math.random() * stageTemplate.narrativeHooks.length)];
    const fullDescription = hook ? `${description} Clue: ${hook}.` : description;

    const quest: Quest = {
      id: `quest_chain_${chainId}_stage_${stageIndex}`,
      title,
      description: fullDescription,
      category: 'main',
      objectives,
      currentObjectiveIndex: 0,
      rewards,
      bonusRewards: stageIndex === chainTemplate.questTemplates.length - 1 ? chainTemplate.finalRewards : undefined,
      startLocation: playerLocation,
      startTime: Date.now(),
      status: 'active',
      chainId,
      difficulty: baseDifficulty as any,
      culturalZone,
      era: era.toString() as any,
      followUpQuests: stageIndex < chainTemplate.questTemplates.length - 1 
        ? [`quest_chain_${chainId}_stage_${stageIndex + 1}`] 
        : undefined
    };

    return quest;
  }

  /**
   * Replace template variables
   */
  private replaceTemplateVars(template: string, vars: any): string {
    let result = template;
    Object.keys(vars).forEach(key => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), vars[key]);
    });
    return result;
  }

  /**
   * Generate objective description based on type
   */
  private generateObjectiveDescription(type: string, variant: any): string {
    const descriptions: Record<string, string[]> = {
      'gather_information': [
        'Question locals about recent events',
        'Search for clues in the archives',
        'Interview witnesses'
      ],
      'visit_location': [
        'Travel to the marked location',
        'Reach the destination',
        'Arrive at the meeting point'
      ],
      'explore_area': [
        'Thoroughly explore the area',
        'Search for hidden passages',
        'Map the surrounding region'
      ],
      'defeat_entity': [
        'Defeat the guardian',
        'Overcome the obstacle',
        'Eliminate the threat'
      ],
      'solve_puzzle': [
        'Decipher the ancient riddle',
        'Unlock the mechanism',
        'Solve the mystery'
      ],
      'make_choice': [
        'Make a crucial decision',
        'Choose your path',
        'Determine the outcome'
      ],
      'survive_duration': [
        'Survive the ordeal',
        'Endure until dawn',
        'Weather the storm'
      ],
      'escort_npc': [
        'Safely escort your companion',
        'Protect the caravan',
        'Guide them to safety'
      ],
      'collect_item': [
        'Gather the required items',
        'Collect the artifacts',
        'Obtain the necessary supplies'
      ],
      'deliver_item': [
        'Deliver the package',
        'Transport the goods',
        'Bring the message'
      ],
      'talk_to_npc': [
        'Speak with the contact',
        'Negotiate with the leader',
        'Consult the expert'
      ],
      'reach_destination': [
        'Reach the final destination',
        'Arrive at journey\'s end',
        'Complete the pilgrimage'
      ]
    };

    const options = descriptions[type] || ['Complete the objective'];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Generate rewards based on stage
   */
  private generateStageRewards(stageIndex: number, difficultyModifier: number): QuestReward[] {
    const baseRewards: QuestReward[] = [];

    // Gold reward scaling with stage
    const goldAmount = Math.floor((50 + stageIndex * 50) * difficultyModifier);
    baseRewards.push({
      type: 'money',
      value: goldAmount,
      description: `${goldAmount} gold`,
      guaranteed: true
    });

    // Reputation scaling with stage
    const repAmount = Math.floor((10 + stageIndex * 10) * difficultyModifier);
    baseRewards.push({
      type: 'reputation',
      value: repAmount,
      description: `Reputation +${repAmount}`,
      guaranteed: true
    });

    // Stage-specific rewards
    if (stageIndex >= 1) {
      baseRewards.push({
        type: 'item',
        itemId: stageIndex === 1 ? 'rare_artifact' : 'epic_artifact',
        value: 1,
        description: stageIndex === 1 ? 'Rare artifact' : 'Epic artifact',
        guaranteed: false,
        chance: 0.3 + (stageIndex * 0.1)
      });
    }

    if (stageIndex >= 2) {
      baseRewards.push({
        type: 'knowledge',
        value: stageIndex,
        description: `Ancient knowledge +${stageIndex}`,
        guaranteed: true
      });
    }

    return baseRewards;
  }

  /**
   * Progress quest chain when a quest is completed
   */
  progressChain(questId: string): void {
    // Find which chain this quest belongs to
    for (const [chainId, chain] of this.activeChains) {
      const questIndex = chain.quests.findIndex(q => q.id === questId);
      
      if (questIndex !== -1 && questIndex === chain.currentQuestIndex) {
        const quest = chain.quests[questIndex];
        
        if (quest.status === 'completed') {
          console.log(`[QuestChainService] Progressing chain ${chainId} from stage ${questIndex}`);
          
          // Check if chain is complete
          if (questIndex === chain.quests.length - 1) {
            // Check if there are more stages in the template
            const template = this.chainTemplates.get(chainId);
            if (template && questIndex < template.questTemplates.length - 1) {
              // Generate next quest in chain
              const nextStageTemplate = template.questTemplates[questIndex + 1];
              const variant = template.culturalVariants[quest.culturalZone || 'EUROPEAN'];
              
              const nextQuest = this.generateChainQuest(
                template,
                nextStageTemplate,
                variant,
                quest.startLocation || { x: 0, y: 0 },
                quest.culturalZone || 'EUROPEAN',
                quest.era as any || 'MEDIEVAL',
                chainId,
                questIndex + 1
              );

              if (nextQuest) {
                chain.quests.push(nextQuest);
                chain.currentQuestIndex++;
                questService.addQuest(nextQuest);
                
                console.log(`[QuestChainService] Added next quest in chain: ${nextQuest.title}`);
                
                // Notify listeners
                this.notifyProgressListeners(nextQuest);
              }
            } else {
              // Chain complete!
              this.completeChain(chainId);
            }
          }
          
          this.saveChains();
        }
      }
    }
  }

  /**
   * Complete a quest chain
   */
  private completeChain(chainId: string): void {
    const chain = this.activeChains.get(chainId);
    if (!chain) return;

    chain.completed = true;
    this.completedChains.add(chainId);
    this.activeChains.delete(chainId);

    console.log(`[QuestChainService] Completed quest chain: ${chain.name}`);

    // Process final rewards
    const template = this.chainTemplates.get(chainId);
    if (template && template.finalRewards) {
      const lastQuest = chain.quests[chain.quests.length - 1];
      const rewardResult = lootService.processQuestRewards(
        template.finalRewards,
        lastQuest.culturalZone,
        lastQuest.era as any
      );
      
      console.log(`[QuestChainService] Final chain rewards:`, rewardResult);
    }

    // Trigger completion event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('questChainCompleted', {
        detail: { chain, rewards: template?.finalRewards }
      }));
    }

    this.saveChains();
  }

  /**
   * Add progress listener
   */
  addProgressListener(listener: (quest: Quest) => void): void {
    this.questProgressListeners.add(listener);
  }

  /**
   * Remove progress listener
   */
  removeProgressListener(listener: (quest: Quest) => void): void {
    this.questProgressListeners.delete(listener);
  }

  /**
   * Notify progress listeners
   */
  private notifyProgressListeners(quest: Quest): void {
    this.questProgressListeners.forEach(listener => listener(quest));
  }

  /**
   * Get active chains
   */
  getActiveChains(): QuestChain[] {
    return Array.from(this.activeChains.values());
  }

  /**
   * Get available chain templates
   */
  getAvailableChains(culturalZone: string): QuestChainTemplate[] {
    return Array.from(this.chainTemplates.values()).filter(template => 
      template.culturalVariants[culturalZone] !== undefined ||
      template.culturalVariants['EUROPEAN'] !== undefined // Fallback
    );
  }

  /**
   * Save chains to localStorage
   */
  private saveChains(): void {
    const chainsData = Array.from(this.activeChains.entries());
    localStorage.setItem('activeQuestChains', JSON.stringify(chainsData));
    localStorage.setItem('completedQuestChains', JSON.stringify(Array.from(this.completedChains)));
  }

  /**
   * Load saved chains
   */
  private loadSavedChains(): void {
    try {
      const savedActive = localStorage.getItem('activeQuestChains');
      if (savedActive) {
        const chainsData = JSON.parse(savedActive);
        chainsData.forEach(([id, chain]: [string, QuestChain]) => {
          this.activeChains.set(id, chain);
        });
      }

      const savedCompleted = localStorage.getItem('completedQuestChains');
      if (savedCompleted) {
        const completed = JSON.parse(savedCompleted);
        completed.forEach((id: string) => this.completedChains.add(id));
      }
    } catch (e) {
      console.error('[QuestChainService] Failed to load saved chains:', e);
    }
  }

  /**
   * Clear all chains (for new game)
   */
  clearAllChains(): void {
    this.activeChains.clear();
    this.completedChains.clear();
    localStorage.removeItem('activeQuestChains');
    localStorage.removeItem('completedQuestChains');
  }
}

// Export singleton instance
export const questChainService = new QuestChainService();