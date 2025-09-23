/**
 * Educational Scenarios Service
 * Provides curated historical scenarios for educational use
 */

import { LearningObjective } from './learningObjectivesService';

export interface EducationalScenario {
  id: string;
  title: string;
  description: string;
  year: number;
  mapArea: string;
  zone: string;
  gameMode: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: '15-30min' | '30-60min' | '1-2hrs' | '2+hrs';
  learningObjectives: LearningObjective[];
  historicalContext: string;
  suggestedProfession?: string;
  suggestedAge?: { min: number; max: number };
  keyTopics: string[];
  primarySources?: string[];
  assessmentFocus?: string[];
}

class EducationalScenariosService {
  private static instance: EducationalScenariosService;
  private scenarios: EducationalScenario[];

  private constructor() {
    this.scenarios = [
      // Ancient & Classical Scenarios
      {
        id: 'ancient-egypt-farmer',
        title: 'Life Along the Nile',
        description: 'Experience the seasonal rhythms of ancient Egyptian agriculture during the Old Kingdom period.',
        year: -2500,
        mapArea: 'nile-delta',
        zone: 'MENA',
        gameMode: 'livelihood',
        difficulty: 'easy',
        duration: '30-60min',
        learningObjectives: ['geographic-impact', 'social-structures', 'economic-systems'],
        historicalContext: 'The Nile River\'s annual flooding cycle determined the rhythm of Egyptian life, creating one of history\'s most stable civilizations.',
        suggestedProfession: 'Farmer',
        suggestedAge: { min: 20, max: 40 },
        keyTopics: ['irrigation', 'agriculture', 'social hierarchy', 'religion'],
        primarySources: ['Pyramid Texts', 'Instructions of Amenemhope'],
        assessmentFocus: ['Understanding of irrigation systems', 'Social class dynamics', 'Religious practices']
      },
      {
        id: 'roman-merchant-200',
        title: 'Trade Routes of the Roman Empire',
        description: 'Navigate the complex trade networks of the Roman Empire at its height.',
        year: 200,
        mapArea: 'italian-peninsula',
        zone: 'EUROPEAN',
        gameMode: 'commerce',
        difficulty: 'medium',
        duration: '1-2hrs',
        learningObjectives: ['economic-systems', 'cultural-comparison', 'geographic-impact'],
        historicalContext: 'The Roman Empire\'s vast trade network connected Europe, Africa, and Asia, facilitating unprecedented cultural and economic exchange.',
        suggestedProfession: 'Merchant',
        suggestedAge: { min: 25, max: 45 },
        keyTopics: ['trade routes', 'currency', 'cultural exchange', 'Roman law'],
        primarySources: ['Pliny the Elder\'s Natural History', 'Diocletian\'s Edict on Prices'],
        assessmentFocus: ['Trade route knowledge', 'Understanding of Roman economy', 'Cultural interactions']
      },
      {
        id: 'athens-democracy-450bc',
        title: 'Democracy in Ancient Athens',
        description: 'Participate in the world\'s first democracy during the Golden Age of Athens.',
        year: -450,
        mapArea: 'greek-peninsula',
        zone: 'EUROPEAN',
        gameMode: 'leadership',
        difficulty: 'hard',
        duration: '1-2hrs',
        learningObjectives: ['social-structures', 'historical-thinking', 'primary-sources'],
        historicalContext: 'Athens developed the world\'s first democratic system, though limited to male citizens, influencing political thought for millennia.',
        suggestedProfession: 'Citizen',
        suggestedAge: { min: 30, max: 50 },
        keyTopics: ['democracy', 'citizenship', 'philosophy', 'city-states'],
        primarySources: ['Aristotle\'s Constitution of Athens', 'Thucydides\' History'],
        assessmentFocus: ['Democratic processes', 'Citizenship concepts', 'Political participation']
      },

      // Medieval Scenarios
      {
        id: 'black-death-1347',
        title: 'Surviving the Black Death',
        description: 'Navigate the devastating plague pandemic that transformed European society.',
        year: 1347,
        mapArea: 'western-europe',
        zone: 'EUROPEAN',
        gameMode: 'survival',
        difficulty: 'hard',
        duration: '30-60min',
        learningObjectives: ['historical-thinking', 'geographic-impact', 'social-structures'],
        historicalContext: 'The Black Death killed 30-60% of Europe\'s population, fundamentally restructuring society and economy.',
        suggestedProfession: 'Physician',
        suggestedAge: { min: 30, max: 50 },
        keyTopics: ['plague', 'medicine', 'social upheaval', 'religious response'],
        primarySources: ['Boccaccio\'s Decameron', 'Chronicle of Jean de Venette'],
        assessmentFocus: ['Disease spread patterns', 'Social impacts', 'Medieval medicine']
      },
      {
        id: 'silk-road-1200',
        title: 'The Silk Road Journey',
        description: 'Travel the legendary trade route connecting East and West during the Mongol Peace.',
        year: 1200,
        mapArea: 'central-asia',
        zone: 'EAST_ASIAN',
        gameMode: 'exploration',
        difficulty: 'medium',
        duration: '1-2hrs',
        learningObjectives: ['cultural-comparison', 'economic-systems', 'geographic-impact'],
        historicalContext: 'The Mongol Empire\'s protection enabled unprecedented trade and cultural exchange across Eurasia.',
        suggestedProfession: 'Caravan Leader',
        suggestedAge: { min: 25, max: 45 },
        keyTopics: ['trade', 'cultural exchange', 'Mongol Empire', 'geography'],
        primarySources: ['Marco Polo\'s Travels', 'Ibn Battuta\'s Rihla'],
        assessmentFocus: ['Trade goods knowledge', 'Cultural interactions', 'Geographic challenges']
      },
      {
        id: 'viking-expansion-900',
        title: 'Viking Age Exploration',
        description: 'Join Norse expeditions during the height of Viking expansion and settlement.',
        year: 900,
        mapArea: 'scandinavian-peninsula',
        zone: 'EUROPEAN',
        gameMode: 'exploration',
        difficulty: 'medium',
        duration: '1-2hrs',
        learningObjectives: ['geographic-impact', 'cultural-comparison', 'economic-systems'],
        historicalContext: 'Viking expeditions reached from Greenland to Constantinople, establishing trade networks and settlements.',
        suggestedProfession: 'Viking Warrior',
        suggestedAge: { min: 20, max: 35 },
        keyTopics: ['exploration', 'trade', 'settlement', 'navigation'],
        primarySources: ['Icelandic Sagas', 'Anglo-Saxon Chronicle'],
        assessmentFocus: ['Navigation skills', 'Trade networks', 'Cultural adaptation']
      },

      // Early Modern Scenarios
      {
        id: 'columbian-exchange-1492',
        title: 'The Columbian Exchange',
        description: 'Witness the transformative exchange of goods, diseases, and cultures between Old and New Worlds.',
        year: 1492,
        mapArea: 'caribbean-islands',
        zone: 'SOUTH_AMERICAN',
        gameMode: 'exploration',
        difficulty: 'medium',
        duration: '1-2hrs',
        learningObjectives: ['cultural-comparison', 'economic-systems', 'historical-thinking'],
        historicalContext: 'The Columbian Exchange reshaped global demographics, agriculture, and ecology permanently.',
        suggestedProfession: 'Explorer',
        suggestedAge: { min: 25, max: 40 },
        keyTopics: ['exploration', 'colonization', 'disease exchange', 'agricultural revolution'],
        primarySources: ['Columbus\'s Letters', 'Bartolomé de las Casas writings'],
        assessmentFocus: ['Exchange impacts', 'Cultural encounters', 'Ecological changes']
      },
      {
        id: 'reformation-1517',
        title: 'The Protestant Reformation',
        description: 'Experience the religious upheaval that divided European Christianity.',
        year: 1517,
        mapArea: 'german-states',
        zone: 'EUROPEAN',
        gameMode: 'diplomacy',
        difficulty: 'hard',
        duration: '1-2hrs',
        learningObjectives: ['historical-thinking', 'social-structures', 'primary-sources'],
        historicalContext: 'Martin Luther\'s 95 Theses sparked religious reform that reshaped European politics and society.',
        suggestedProfession: 'Monk',
        suggestedAge: { min: 30, max: 50 },
        keyTopics: ['religion', 'reform', 'printing press', 'political conflict'],
        primarySources: ['Luther\'s 95 Theses', 'Augsburg Confession'],
        assessmentFocus: ['Religious disputes', 'Political implications', 'Social changes']
      },
      {
        id: 'ming-china-1600',
        title: 'Ming Dynasty Scholarship',
        description: 'Pursue the imperial examinations in late Ming China.',
        year: 1600,
        mapArea: 'yangtze-river-valley',
        zone: 'EAST_ASIAN',
        gameMode: 'scholarship',
        difficulty: 'hard',
        duration: '1-2hrs',
        learningObjectives: ['social-structures', 'cultural-comparison', 'primary-sources'],
        historicalContext: 'The Chinese examination system created the world\'s first meritocratic bureaucracy.',
        suggestedProfession: 'Scholar',
        suggestedAge: { min: 20, max: 30 },
        keyTopics: ['Confucianism', 'bureaucracy', 'education', 'social mobility'],
        primarySources: ['Confucian Classics', 'Ming Dynasty Records'],
        assessmentFocus: ['Examination system', 'Confucian values', 'Social hierarchy']
      },

      // Industrial Era Scenarios
      {
        id: 'industrial-revolution-1820',
        title: 'Industrial Revolution Manchester',
        description: 'Experience the dramatic social changes of early industrialization in England.',
        year: 1820,
        mapArea: 'british-isles',
        zone: 'EUROPEAN',
        gameMode: 'livelihood',
        difficulty: 'medium',
        duration: '1-2hrs',
        learningObjectives: ['economic-systems', 'social-structures', 'historical-thinking'],
        historicalContext: 'The Industrial Revolution transformed human society more rapidly than any previous change.',
        suggestedProfession: 'Factory Worker',
        suggestedAge: { min: 16, max: 30 },
        keyTopics: ['industrialization', 'urbanization', 'labor', 'technology'],
        primarySources: ['Engels\' Condition of the Working Class', 'Parliamentary Reports'],
        assessmentFocus: ['Working conditions', 'Social changes', 'Technological impact']
      },
      {
        id: 'american-frontier-1850',
        title: 'American Westward Expansion',
        description: 'Join the westward migration during America\'s Manifest Destiny period.',
        year: 1850,
        mapArea: 'great-plains',
        zone: 'NORTH_AMERICAN_COLONIAL',
        gameMode: 'exploration',
        difficulty: 'medium',
        duration: '1-2hrs',
        learningObjectives: ['geographic-impact', 'cultural-comparison', 'historical-thinking'],
        historicalContext: 'Westward expansion displaced Native peoples while creating new American identities.',
        suggestedProfession: 'Pioneer',
        suggestedAge: { min: 25, max: 40 },
        keyTopics: ['migration', 'Native relations', 'frontier life', 'Manifest Destiny'],
        primarySources: ['Pioneer diaries', 'Native American testimonies'],
        assessmentFocus: ['Migration motivations', 'Cultural conflicts', 'Environmental challenges']
      },
      {
        id: 'meiji-japan-1870',
        title: 'Meiji Restoration Japan',
        description: 'Witness Japan\'s rapid modernization and westernization.',
        year: 1870,
        mapArea: 'japanese-archipelago',
        zone: 'EAST_ASIAN',
        gameMode: 'diplomacy',
        difficulty: 'hard',
        duration: '1-2hrs',
        learningObjectives: ['cultural-comparison', 'historical-thinking', 'economic-systems'],
        historicalContext: 'Japan transformed from feudal isolation to industrial power in just decades.',
        suggestedProfession: 'Government Official',
        suggestedAge: { min: 30, max: 50 },
        keyTopics: ['modernization', 'westernization', 'industrialization', 'cultural change'],
        primarySources: ['Imperial Rescript on Education', 'Fukuzawa Yukichi\'s writings'],
        assessmentFocus: ['Modernization strategies', 'Cultural preservation', 'International relations']
      },

      // Modern Era Scenarios
      {
        id: 'great-depression-1932',
        title: 'The Great Depression',
        description: 'Survive the worst economic crisis of the 20th century.',
        year: 1932,
        mapArea: 'eastern-woodlands',
        zone: 'NORTH_AMERICAN_COLONIAL',
        gameMode: 'survival',
        difficulty: 'hard',
        duration: '30-60min',
        learningObjectives: ['economic-systems', 'social-structures', 'historical-thinking'],
        historicalContext: 'The Great Depression reshaped government\'s role in economy and society worldwide.',
        suggestedProfession: 'Unemployed Worker',
        suggestedAge: { min: 25, max: 45 },
        keyTopics: ['economic collapse', 'unemployment', 'New Deal', 'social programs'],
        primarySources: ['Dorothea Lange photography', 'FDR\'s Fireside Chats'],
        assessmentFocus: ['Economic causes', 'Social impacts', 'Government responses']
      },
      {
        id: 'decolonization-india-1947',
        title: 'Indian Independence',
        description: 'Participate in India\'s struggle for independence and partition.',
        year: 1947,
        mapArea: 'ganges-plain',
        zone: 'SOUTH_ASIAN',
        gameMode: 'diplomacy',
        difficulty: 'hard',
        duration: '1-2hrs',
        learningObjectives: ['historical-thinking', 'cultural-comparison', 'social-structures'],
        historicalContext: 'India\'s independence marked the beginning of decolonization worldwide.',
        suggestedProfession: 'Activist',
        suggestedAge: { min: 25, max: 45 },
        keyTopics: ['independence', 'partition', 'non-violence', 'nationalism'],
        primarySources: ['Gandhi\'s writings', 'Nehru\'s speeches'],
        assessmentFocus: ['Independence movements', 'Partition impacts', 'Nation building']
      },
      {
        id: 'cold-war-berlin-1961',
        title: 'Divided Berlin',
        description: 'Navigate life in a divided city at the height of the Cold War.',
        year: 1961,
        mapArea: 'german-states',
        zone: 'EUROPEAN',
        gameMode: 'survival',
        difficulty: 'medium',
        duration: '30-60min',
        learningObjectives: ['historical-thinking', 'social-structures', 'geographic-impact'],
        historicalContext: 'Berlin became the symbolic center of Cold War tensions between East and West.',
        suggestedProfession: 'Journalist',
        suggestedAge: { min: 25, max: 40 },
        keyTopics: ['Cold War', 'division', 'ideology', 'escape attempts'],
        primarySources: ['Stasi files', 'Escape testimonies'],
        assessmentFocus: ['Cold War dynamics', 'Daily life impacts', 'Ideological differences']
      }
    ];
  }

  public static getInstance(): EducationalScenariosService {
    if (!EducationalScenariosService.instance) {
      EducationalScenariosService.instance = new EducationalScenariosService();
    }
    return EducationalScenariosService.instance;
  }

  /**
   * Get all scenarios
   */
  public getAllScenarios(): EducationalScenario[] {
    return this.scenarios;
  }

  /**
   * Get scenarios by difficulty
   */
  public getScenariosByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): EducationalScenario[] {
    return this.scenarios.filter(s => s.difficulty === difficulty);
  }

  /**
   * Get scenarios by learning objective
   */
  public getScenariosByObjective(objective: LearningObjective): EducationalScenario[] {
    return this.scenarios.filter(s => s.learningObjectives.includes(objective));
  }

  /**
   * Get scenarios by duration
   */
  public getScenariosByDuration(duration: string): EducationalScenario[] {
    return this.scenarios.filter(s => s.duration === duration);
  }

  /**
   * Get scenario by ID
   */
  public getScenarioById(id: string): EducationalScenario | undefined {
    return this.scenarios.find(s => s.id === id);
  }

  /**
   * Search scenarios by keyword
   */
  public searchScenarios(keyword: string): EducationalScenario[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.scenarios.filter(s =>
      s.title.toLowerCase().includes(lowerKeyword) ||
      s.description.toLowerCase().includes(lowerKeyword) ||
      s.keyTopics.some(topic => topic.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * Get recommended scenarios based on selected learning objectives
   */
  public getRecommendedScenarios(objectives: LearningObjective[]): EducationalScenario[] {
    // Score scenarios by how many of the selected objectives they cover
    const scoredScenarios = this.scenarios.map(scenario => {
      const matchingObjectives = scenario.learningObjectives.filter(obj =>
        objectives.includes(obj)
      ).length;
      return { scenario, score: matchingObjectives };
    });

    // Sort by score and return top scenarios
    return scoredScenarios
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.scenario);
  }
}

export const educationalScenariosService = EducationalScenariosService.getInstance();