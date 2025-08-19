/**
 * Game Mode Definitions
 * Defines all 8 game modes with their event archetypes and victory conditions
 */

import { 
  GameMode, 
  EventArchetype, 
  VictoryCondition,
  EventTrigger,
  EventOutcome,
  EventEffect
} from '../../types/eventTypes';

/**
 * Helper to create a stat check outcome
 */
function createOutcome(
  id: string,
  buttonText: string,
  effects: EventEffect[],
  statCheck?: { stat: string, min: number },
  historicalNote?: string
): EventOutcome {
  return {
    id,
    buttonText,
    description: buttonText,
    effects,
    weight: 1,
    statChecks: statCheck ? [{
      stat: statCheck.stat as any,
      minimum: statCheck.min,
      description: `${statCheck.stat} ${statCheck.min}+`
    }] : undefined,
    historicalNote
  };
}

// ============================================
// SURVIVAL MODE
// ============================================
export const SURVIVAL_MODE: GameMode = {
  id: 'survival',
  name: 'Survival Mode',
  description: 'Overcome existential threats through resourcefulness',
  defaultWeight: 0.8,
  victoryConditions: [
    { id: 'survive_days', description: 'Survive 30 days', type: 'survival_days', target: 30, progress: 0 },
    { id: 'reach_safety', description: 'Reach a safe location', type: 'reach_location', target: 'city', progress: 0 },
    { id: 'maintain_health', description: 'Keep health above 30', type: 'custom', progress: 0 }
  ],
  eventArchetypes: [
    {
      id: 'resource_crisis',
      template: 'Your [RESOURCE] supplies are dangerously low during [SEASON]. [SEASONAL_HAZARD] makes the situation worse.',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.3 },
        { type: 'time_based', condition: 'day % 3 == 0', probability: 0.5 }
      ],
      variables: [
        { key: 'RESOURCE', options: ['food', 'water', 'fuel', 'medicine'], contextual: true },
        { key: 'CONTEXT', options: ['The weather makes things worse.', 'Others are also desperate.', 'Supplies are scarce everywhere.'] }
      ],
      outcomes: [
        createOutcome('forage', 'Forage for supplies', 
          [{ type: 'health', target: 'health', value: 10 }],
          { stat: 'wisdom', min: 10 },
          'Foraging was a daily necessity for most throughout history'
        ),
        createOutcome('trade', 'Trade your [TRADE_ITEM]',
          [{ type: 'item_remove', target: 'trade_item', value: 'remove' }],
          { stat: 'charisma', min: 8 }
        ),
        createOutcome('endure', 'Go without',
          [{ type: 'health', target: 'health', value: -15 }, { type: 'fatigue', target: 'fatigue', value: -20 }]
        )
      ]
    },
    {
      id: 'environmental_threat',
      template: '[HAZARD] threatens your survival in this [BIOME]. The [WEATHER_CONDITION] makes escape difficult.',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.2 }
      ],
      variables: [
        { key: 'HAZARD', options: ['A violent storm', 'Extreme cold', 'Dangerous wildlife', 'Flash flooding'], contextual: true }
      ],
      outcomes: [
        createOutcome('shelter', 'Seek shelter',
          [{ type: 'fatigue', target: 'fatigue', value: -10 }],
          { stat: 'intelligence', min: 9 }
        ),
        createOutcome('flee', 'Flee the area',
          [{ type: 'location', target: 'move', value: 'random' }, { type: 'fatigue', target: 'fatigue', value: -20 }],
          { stat: 'constitution', min: 10 }
        ),
        createOutcome('endure_threat', 'Weather the danger',
          [{ type: 'health', target: 'health', value: -20 }]
        )
      ]
    },
    {
      id: 'health_emergency',
      template: 'You are suffering from [CONDITION]. [SYMPTOMS]',
      triggers: [
        { type: 'low_resource', condition: 'health < 40', probability: 0.4 }
      ],
      variables: [
        { key: 'CONDITION', options: ['fever', 'infection', 'exhaustion', 'malnutrition'], contextual: false },
        { key: 'SYMPTOMS', options: ['You feel weak.', 'Movement is difficult.', 'Your vision blurs.'] }
      ],
      outcomes: [
        createOutcome('find_healer', 'Seek a healer',
          [{ type: 'health', target: 'health', value: 25 }],
          undefined,
          'Folk healers were the primary medical care for most people'
        ),
        createOutcome('rest', 'Rest and recover',
          [{ type: 'health', target: 'health', value: 15 }, { type: 'fatigue', target: 'fatigue', value: 30 }]
        ),
        createOutcome('push_through', 'Push through',
          [{ type: 'health', target: 'health', value: -10 }, { type: 'stat_change', target: 'constitution', value: 1 }]
        )
      ]
    }
  ]
};

// ============================================
// EXPLORATION MODE
// ============================================
export const EXPLORATION_MODE: GameMode = {
  id: 'exploration',
  name: 'Exploration Mode',
  description: 'Document and understand new places and peoples',
  defaultWeight: 0.6,
  victoryConditions: [
    { id: 'map_tiles', description: 'Map 50 new tiles', type: 'custom', target: 50, progress: 0 },
    { id: 'major_discovery', description: 'Make a major discovery', type: 'custom', progress: 0 },
    { id: 'complete_expedition', description: 'Complete expedition goals', type: 'complete_quest', progress: 0 }
  ],
  eventArchetypes: [
    {
      id: 'discovery_opportunity',
      template: 'You notice [SIGNS] indicating [DISCOVERY] nearby.',
      triggers: [
        { type: 'near_location', condition: 'near_unexplored', probability: 0.4 }
      ],
      variables: [
        { key: 'SIGNS', options: ['unusual formations', 'ancient markings', 'wildlife trails', 'smoke in the distance'] },
        { key: 'DISCOVERY', options: ['ruins', 'a settlement', 'valuable resources', 'a natural wonder'] }
      ],
      outcomes: [
        createOutcome('investigate', 'Investigate thoroughly',
          [{ type: 'quest', target: 'discovery', value: 'new' }],
          { stat: 'wisdom', min: 11 }
        ),
        createOutcome('quick_survey', 'Quick survey',
          [{ type: 'reputation', target: 'reputation', value: 5 }]
        ),
        createOutcome('mark_continue', 'Mark and continue',
          []
        )
      ]
    },
    {
      id: 'navigation_challenge',
      template: 'Your path is blocked by [OBSTACLE]. [DESCRIPTION]',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.3 }
      ],
      variables: [
        { key: 'OBSTACLE', options: ['a raging river', 'steep cliffs', 'dense forest', 'treacherous swamp'] },
        { key: 'DESCRIPTION', options: ['It looks dangerous.', 'Progress seems impossible.', 'You must choose carefully.'] }
      ],
      outcomes: [
        createOutcome('find_route', 'Find alternate route',
          [{ type: 'fatigue', target: 'fatigue', value: -15 }],
          { stat: 'wisdom', min: 12 }
        ),
        createOutcome('force_through', 'Force through',
          [{ type: 'health', target: 'health', value: -10 }, { type: 'fatigue', target: 'fatigue', value: -20 }],
          { stat: 'strength', min: 12 }
        ),
        createOutcome('turn_back', 'Turn back',
          [{ type: 'location', target: 'move', value: 'back' }]
        )
      ]
    },
    {
      id: 'local_encounter',
      template: '[GROUP] approach your expedition. They appear [DEMEANOR].',
      triggers: [
        { type: 'near_location', condition: 'near_settlement', probability: 0.5 }
      ],
      variables: [
        { key: 'GROUP', options: ['Local hunters', 'Traveling merchants', 'Armed scouts', 'Religious pilgrims'] },
        { key: 'DEMEANOR', options: ['curious', 'suspicious', 'friendly', 'cautious'] }
      ],
      outcomes: [
        createOutcome('trade_info', 'Trade and learn',
          [{ type: 'reputation', target: 'reputation', value: 10 }],
          { stat: 'charisma', min: 10 }
        ),
        createOutcome('share_knowledge', 'Share knowledge',
          [{ type: 'reputation', target: 'reputation', value: 15 }],
          { stat: 'intelligence', min: 11 }
        ),
        createOutcome('avoid', 'Avoid contact',
          [],
          { stat: 'dexterity', min: 9 }
        )
      ]
    }
  ]
};

// ============================================
// COMMERCE MODE
// ============================================
export const COMMERCE_MODE: GameMode = {
  id: 'commerce',
  name: 'Commerce Mode',
  description: 'Build prosperity through trade and business',
  defaultWeight: 0.7,
  victoryConditions: [
    { id: 'accumulate_wealth', description: 'Accumulate 1000 coins', type: 'accumulate_wealth', target: 1000, progress: 0 },
    { id: 'trade_monopoly', description: 'Establish trade monopoly', type: 'custom', progress: 0 },
    { id: 'successful_business', description: 'Build successful business', type: 'custom', progress: 0 }
  ],
  eventArchetypes: [
    {
      id: 'market_opportunity',
      template: '[GOODS] prices have [CHANGED] due to [REASON].',
      triggers: [
        { type: 'near_location', condition: 'near_city', probability: 0.4 },
        { type: 'time_based', condition: 'day % 7 == 0', probability: 0.3 }
      ],
      variables: [
        { key: 'GOODS', options: ['grain', 'cloth', 'spices', 'metals', 'livestock'], contextual: true },
        { key: 'CHANGED', options: ['risen sharply', 'fallen dramatically', 'become volatile'] },
        { key: 'REASON', options: ['war', 'poor harvest', 'new trade route', 'political changes'] }
      ],
      outcomes: [
        createOutcome('buy_bulk', 'Buy in bulk',
          [{ type: 'item_add', target: 'trade_goods', value: 'bulk' }]
        ),
        createOutcome('modest_investment', 'Modest investment',
          [{ type: 'item_add', target: 'trade_goods', value: 'some' }]
        ),
        createOutcome('wait_observe', 'Wait and observe',
          [{ type: 'stat_change', target: 'wisdom', value: 1 }]
        )
      ]
    },
    {
      id: 'competition',
      template: 'A rival merchant [ACTION] affecting your business.',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.25 }
      ],
      variables: [
        { key: 'ACTION', options: ['undercuts your prices', 'spreads rumors about you', 'blocks your suppliers', 'poaches your customers'] }
      ],
      outcomes: [
        createOutcome('compete', 'Compete directly',
          [{ type: 'reputation', target: 'reputation', value: -5 }]
        ),
        createOutcome('cooperate', 'Form alliance',
          [{ type: 'reputation', target: 'reputation', value: 10 }],
          { stat: 'charisma', min: 12 }
        ),
        createOutcome('new_market', 'Find new market',
          [],
          { stat: 'intelligence', min: 10 }
        )
      ]
    },
    {
      id: 'investment_offer',
      template: 'Opportunity to invest in [VENTURE]. [RISK_LEVEL] risk.',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.2 }
      ],
      variables: [
        { key: 'VENTURE', options: ['a new caravan', 'a workshop', 'a ship', 'mining operation'], contextual: true },
        { key: 'RISK_LEVEL', options: ['Low', 'Moderate', 'High', 'Very high'] }
      ],
      outcomes: [
        createOutcome('full_invest', 'Full investment',
          []
        ),
        createOutcome('partial_invest', 'Partial investment',
          []
        ),
        createOutcome('decline_invest', 'Decline',
          []
        )
      ]
    },
    {
      id: 'regulatory_issue',
      template: 'Authorities demand [REQUIREMENT] for your [BUSINESS_ASPECT].',
      triggers: [
        { type: 'time_based', condition: 'day % 14 == 0', probability: 0.3 }
      ],
      variables: [
        { key: 'REQUIREMENT', options: ['higher taxes', 'special permits', 'guild membership', 'inspection fees'] },
        { key: 'BUSINESS_ASPECT', options: ['goods', 'trade route', 'shop', 'workers'] }
      ],
      outcomes: [
        createOutcome('comply', 'Full compliance',
          [{ type: 'reputation', target: 'reputation', value: 5 }]
        ),
        createOutcome('negotiate', 'Negotiate',
          [],
          { stat: 'charisma', min: 11 }
        ),
        createOutcome('relocate', 'Relocate business',
          [{ type: 'location', target: 'move', value: 'new_city' }]
        )
      ]
    }
  ]
};

// ============================================
// SCHOLARSHIP MODE
// ============================================
export const SCHOLARSHIP_MODE: GameMode = {
  id: 'scholarship',
  name: 'Scholarship Mode',
  description: 'Advance human knowledge and understanding',
  defaultWeight: 0.5,
  victoryConditions: [
    { id: 'major_discovery', description: 'Make significant discovery', type: 'custom', progress: 0 },
    { id: 'publish_work', description: 'Publish influential work', type: 'custom', progress: 0 },
    { id: 'establish_school', description: 'Establish school or library', type: 'custom', progress: 0 }
  ],
  eventArchetypes: [
    {
      id: 'research_progress',
      template: 'Your study of [SUBJECT] reveals [FINDING]. This could be [SIGNIFICANCE].',
      triggers: [
        { type: 'time_based', condition: 'day % 5 == 0', probability: 0.4 }
      ],
      variables: [
        { key: 'SUBJECT', options: ['astronomy', 'medicine', 'mathematics', 'natural philosophy', 'history'], contextual: true },
        { key: 'FINDING', options: ['unexpected patterns', 'new connections', 'contradictions', 'confirmations'] },
        { key: 'SIGNIFICANCE', options: ['revolutionary', 'controversial', 'profitable', 'dangerous'] }
      ],
      outcomes: [
        createOutcome('pursue_further', 'Pursue further',
          [{ type: 'stat_change', target: 'intelligence', value: 1 }]
        ),
        createOutcome('publish_now', 'Publish immediately',
          [{ type: 'reputation', target: 'reputation', value: 20 }]
        ),
        createOutcome('keep_secret', 'Keep secret',
          []
        )
      ]
    },
    {
      id: 'academic_politics',
      template: 'A colleague [INTERACTION] regarding your work on [TOPIC].',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.3 }
      ],
      variables: [
        { key: 'INTERACTION', options: ['offers collaboration', 'challenges your findings', 'steals your ideas', 'seeks your mentorship'] },
        { key: 'TOPIC', options: ['your latest research', 'ancient texts', 'experimental methods', 'theoretical principles'] }
      ],
      outcomes: [
        createOutcome('collaborate', 'Collaborate',
          [{ type: 'reputation', target: 'reputation', value: 10 }]
        ),
        createOutcome('compete', 'Compete',
          [{ type: 'stat_change', target: 'intelligence', value: 1 }]
        ),
        createOutcome('ignore', 'Ignore them',
          []
        )
      ]
    },
    {
      id: 'funding_crisis',
      template: 'Your patron [SITUATION]. Your research funding is [STATUS].',
      triggers: [
        { type: 'time_based', condition: 'day % 10 == 0', probability: 0.25 }
      ],
      variables: [
        { key: 'SITUATION', options: ['has died', 'loses interest', 'demands results', 'faces financial troubles'] },
        { key: 'STATUS', options: ['threatened', 'reduced', 'withdrawn', 'under review'] }
      ],
      outcomes: [
        createOutcome('new_patron', 'Find new patron',
          [],
          { stat: 'charisma', min: 11 }
        ),
        createOutcome('commercialize', 'Commercialize research',
          [{ type: 'reputation', target: 'reputation', value: -10 }]
        ),
        createOutcome('continue_unfunded', 'Continue unfunded',
          [{ type: 'fatigue', target: 'fatigue', value: -25 }]
        )
      ]
    }
  ]
};

// ============================================
// LEADERSHIP MODE
// ============================================
export const LEADERSHIP_MODE: GameMode = {
  id: 'leadership',
  name: 'Leadership Mode',
  description: 'Guide a community through challenges',
  defaultWeight: 0.6,
  victoryConditions: [
    { id: 'survive_crisis', description: 'Community survives crisis', type: 'custom', progress: 0 },
    { id: 'implement_reforms', description: 'Implement 5 reforms', type: 'custom', target: 5, progress: 0 },
    { id: 'maintain_peace', description: 'Maintain peace for 20 days', type: 'survival_days', target: 20, progress: 0 }
  ],
  eventArchetypes: [
    {
      id: 'crisis_decision',
      template: 'Your community faces [CRISIS]. The people look to you for guidance.',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.3 }
      ],
      variables: [
        { key: 'CRISIS', options: ['famine', 'disease outbreak', 'external threat', 'natural disaster', 'internal conflict'] }
      ],
      outcomes: [
        createOutcome('authoritarian', 'Use force',
          [{ type: 'reputation', target: 'reputation', value: -15 }],
          { stat: 'strength', min: 12 }
        ),
        createOutcome('democratic', 'Consult the people',
          [{ type: 'fatigue', target: 'fatigue', value: -20 }]
        ),
        createOutcome('sacrifice', 'Personal sacrifice',
          [{ type: 'health', target: 'health', value: -20 }, { type: 'reputation', target: 'reputation', value: 25 }]
        )
      ]
    },
    {
      id: 'resource_allocation',
      template: '[GROUP] demands more [RESOURCE]. Others will suffer if you agree.',
      triggers: [
        { type: 'time_based', condition: 'day % 4 == 0', probability: 0.35 }
      ],
      variables: [
        { key: 'GROUP', options: ['The farmers', 'The soldiers', 'The clergy', 'The merchants', 'The craftsmen'] },
        { key: 'RESOURCE', options: ['food', 'funds', 'labor', 'land', 'privileges'] }
      ],
      outcomes: [
        createOutcome('grant', 'Grant request',
          [{ type: 'reputation', target: 'reputation', value: 10 }]
        ),
        createOutcome('refuse', 'Refuse',
          [{ type: 'reputation', target: 'reputation', value: -10 }]
        ),
        createOutcome('compromise', 'Compromise',
          [{ type: 'reputation', target: 'reputation', value: -5 }]
        )
      ]
    },
    {
      id: 'external_threat',
      template: '[EXTERNAL_FORCE] threatens your people. They demand [DEMAND].',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.2 }
      ],
      variables: [
        { key: 'EXTERNAL_FORCE', options: ['A rival city', 'Raiders', 'An empire', 'Barbarians', 'Pirates'] },
        { key: 'DEMAND', options: ['tribute', 'submission', 'territory', 'hostages', 'trade rights'] }
      ],
      outcomes: [
        createOutcome('resist', 'Military resistance',
          [{ type: 'health', target: 'health', value: -15 }],
          { stat: 'strength', min: 13 }
        ),
        createOutcome('diplomacy', 'Diplomatic solution',
          [],
          { stat: 'charisma', min: 12 }
        ),
        createOutcome('retreat', 'Strategic retreat',
          [{ type: 'location', target: 'move', value: 'safe_area' }],
          { stat: 'wisdom', min: 11 }
        )
      ]
    },
    {
      id: 'internal_conflict',
      template: '[FACTION] challenges your authority over [ISSUE].',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.25 }
      ],
      variables: [
        { key: 'FACTION', options: ['The nobles', 'The clergy', 'The merchants', 'The military', 'The common folk'] },
        { key: 'ISSUE', options: ['taxes', 'laws', 'succession', 'religion', 'trade rights'] }
      ],
      outcomes: [
        createOutcome('suppress', 'Suppress dissent',
          [{ type: 'reputation', target: 'reputation', value: -20 }]
        ),
        createOutcome('accommodate', 'Accommodate demands',
          [{ type: 'reputation', target: 'reputation', value: 5 }]
        ),
        createOutcome('unity', 'Call for unity',
          [],
          { stat: 'charisma', min: 13 }
        )
      ]
    }
  ]
};

// ============================================
// LIVELIHOOD MODE
// ============================================
export const LIVELIHOOD_MODE: GameMode = {
  id: 'livelihood',
  name: 'Livelihood Mode',
  description: 'Excel at your profession and support your household',
  defaultWeight: 0.9,
  victoryConditions: [
    { id: 'master_craft', description: 'Master your craft', type: 'custom', progress: 0 },
    { id: 'support_family', description: 'Support family for 30 days', type: 'survival_days', target: 30, progress: 0 },
    { id: 'complete_masterwork', description: 'Complete masterwork', type: 'custom', progress: 0 }
  ],
  eventArchetypes: [
    {
      id: 'work_challenge',
      template: 'A client requests [DIFFICULT_TASK] by [DEADLINE]. The pay is [QUALITY] but you need your [WORK_TOOL].',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.4 }
      ],
      variables: [
        { key: 'DIFFICULT_TASK', options: ['complex work', 'dangerous job', 'rare service', 'urgent task'], contextual: true },
        { key: 'DEADLINE', options: ['tomorrow', 'this week', 'the season end', 'the festival'] },
        { key: 'QUALITY', options: ['excellent', 'fair', 'poor', 'uncertain'] }
      ],
      outcomes: [
        createOutcome('accept', 'Accept challenge',
          [{ type: 'fatigue', target: 'fatigue', value: -30 }]
        ),
        createOutcome('negotiate_work', 'Negotiate terms',
          [],
          { stat: 'charisma', min: 10 }
        ),
        createOutcome('refer_colleague', 'Refer to colleague',
          [{ type: 'reputation', target: 'reputation', value: 5 }]
        )
      ]
    },
    {
      id: 'professional_advancement',
      template: 'Opportunity to [ADVANCE] in your profession. [REQUIREMENT] required.',
      triggers: [
        { type: 'time_based', condition: 'day % 15 == 0', probability: 0.3 }
      ],
      variables: [
        { key: 'ADVANCE', options: ['join the guild', 'get promoted', 'learn new technique', 'gain apprentice'] },
        { key: 'REQUIREMENT', options: ['Fee payment', 'Skills test', 'Sponsor', 'Masterwork'] }
      ],
      outcomes: [
        createOutcome('pursue_now', 'Pursue immediately',
          [{ type: 'reputation', target: 'reputation', value: 15 }]
        ),
        createOutcome('prepare', 'Prepare further',
          [{ type: 'stat_change', target: 'intelligence', value: 1 }]
        ),
        createOutcome('decline_advance', 'Decline',
          []
        )
      ]
    },
    {
      id: 'work_life_balance',
      template: 'Your [FAMILY_COMMUNITY] needs you for [OBLIGATION], but work demands [CONFLICT].',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.3 }
      ],
      variables: [
        { key: 'FAMILY_COMMUNITY', options: ['family', 'spouse', 'children', 'elderly parents', 'community'] },
        { key: 'OBLIGATION', options: ['harvest help', 'religious ceremony', 'family emergency', 'important celebration'] },
        { key: 'CONFLICT', options: ['urgent deadline', 'important client', 'guild meeting', 'critical work'] }
      ],
      outcomes: [
        createOutcome('prioritize_work', 'Prioritize work',
          [{ type: 'reputation', target: 'reputation', value: 10 }, { type: 'fatigue', target: 'fatigue', value: -20 }]
        ),
        createOutcome('prioritize_family', 'Prioritize family',
          [{ type: 'reputation', target: 'reputation', value: -5 }, { type: 'health', target: 'health', value: 10 }]
        ),
        createOutcome('attempt_both', 'Try to do both',
          [{ type: 'fatigue', target: 'fatigue', value: -35 }]
        )
      ]
    }
  ]
};

// ============================================
// DIPLOMACY MODE
// ============================================
export const DIPLOMACY_MODE: GameMode = {
  id: 'diplomacy',
  name: 'Diplomacy Mode',
  description: 'Build bridges between peoples and navigate cultural differences',
  defaultWeight: 0.5,
  victoryConditions: [
    { id: 'broker_peace', description: 'Broker major peace', type: 'custom', progress: 0 },
    { id: 'establish_alliance', description: 'Establish lasting alliance', type: 'custom', progress: 0 },
    { id: 'prevent_war', description: 'Prevent war', type: 'custom', progress: 0 }
  ],
  eventArchetypes: [
    {
      id: 'cultural_misunderstanding',
      template: 'Your [ACTION] has offended [GROUP]. They interpret it as [MEANING].',
      triggers: [
        { type: 'near_location', condition: 'near_settlement', probability: 0.4 }
      ],
      variables: [
        { key: 'ACTION', options: ['gesture', 'gift', 'words', 'behavior', 'clothing choice'] },
        { key: 'GROUP', options: ['the locals', 'the nobility', 'the clergy', 'the merchants', 'the common folk'] },
        { key: 'MEANING', options: ['an insult', 'a threat', 'disrespect', 'mockery', 'aggression'] }
      ],
      outcomes: [
        createOutcome('apologize', 'Apologize sincerely',
          [{ type: 'reputation', target: 'reputation', value: 5 }]
        ),
        createOutcome('explain', 'Explain your intent',
          [],
          { stat: 'intelligence', min: 10 }
        ),
        createOutcome('stand_firm', 'Stand by your action',
          [{ type: 'reputation', target: 'reputation', value: -15 }]
        )
      ]
    },
    {
      id: 'negotiation_round',
      template: '[PARTY] proposes [TERMS]. Your side expects you to [EXPECTATION].',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.3 }
      ],
      variables: [
        { key: 'PARTY', options: ['The foreign delegation', 'The trade guild', 'The military', 'The religious order'] },
        { key: 'TERMS', options: ['trade agreement', 'territorial exchange', 'marriage alliance', 'tribute arrangement'] },
        { key: 'EXPECTATION', options: ['accept', 'reject firmly', 'counter-propose', 'delay decision'] }
      ],
      outcomes: [
        createOutcome('accept_terms', 'Accept terms',
          [{ type: 'reputation', target: 'reputation', value: 10 }]
        ),
        createOutcome('counter', 'Counter-propose',
          [],
          { stat: 'charisma', min: 11 }
        ),
        createOutcome('walk_away', 'Walk away',
          [{ type: 'reputation', target: 'reputation', value: -10 }]
        )
      ]
    },
    {
      id: 'trust_test',
      template: '[PARTY] requests [PROOF] of good faith before proceeding.',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.25 }
      ],
      variables: [
        { key: 'PARTY', options: ['Your negotiating partner', 'The local ruler', 'The merchant guild', 'The military commander'] },
        { key: 'PROOF', options: ['a hostage', 'advance payment', 'public declaration', 'valuable collateral', 'sworn oath'] }
      ],
      outcomes: [
        createOutcome('provide_proof', 'Provide proof',
          [{ type: 'reputation', target: 'reputation', value: 20 }]
        ),
        createOutcome('refuse_proof', 'Refuse',
          [{ type: 'reputation', target: 'reputation', value: -10 }]
        ),
        createOutcome('deceive', 'Attempt deception',
          [],
          { stat: 'dexterity', min: 12 }
        )
      ]
    }
  ]
};

// ============================================
// HEALER MODE
// ============================================
export const HEALER_MODE: GameMode = {
  id: 'healer',
  name: 'Healer Mode',
  description: 'Practice medicine and help the sick in your community',
  defaultWeight: 0.3,
  victoryConditions: [
    { id: 'save_lives', description: 'Successfully treat 10 patients', type: 'custom', target: 10, progress: 0 },
    { id: 'discover_cure', description: 'Discover new medical treatment', type: 'custom', progress: 0 },
    { id: 'stop_epidemic', description: 'Stop a disease outbreak', type: 'custom', progress: 0 }
  ],
  eventArchetypes: [
    {
      id: 'patient_consultation',
      template: 'A [PATIENT_TYPE] comes to you suffering from [SYMPTOMS]. They appear [CONDITION].',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.4 }
      ],
      variables: [
        { key: 'PATIENT_TYPE', options: ['young child', 'pregnant woman', 'elderly man', 'traveling merchant', 'local farmer'] },
        { key: 'SYMPTOMS', options: ['fever and chills', 'persistent cough', 'stomach pain', 'skin lesions', 'difficulty breathing'] },
        { key: 'CONDITION', options: ['very ill', 'desperate', 'afraid', 'in pain', 'near death'] }
      ],
      outcomes: [
        createOutcome('examine_carefully', 'Examine thoroughly',
          [{ type: 'reputation', target: 'reputation', value: 5 }],
          { stat: 'wisdom', min: 11 },
          'Careful examination was the foundation of historical medicine'
        ),
        createOutcome('apply_remedy', 'Apply standard remedy',
          [{ type: 'health', target: 'patient_health', value: 15 }],
          { stat: 'intelligence', min: 10 }
        ),
        createOutcome('experimental_treatment', 'Try experimental treatment',
          [],
          { stat: 'intelligence', min: 13 }
        )
      ]
    },
    {
      id: 'disease_outbreak',
      template: 'Reports arrive of [DISEASE] spreading through [LOCATION]. The authorities request your help.',
      triggers: [
        { type: 'time_based', condition: 'day % 15 == 0', probability: 0.3 }
      ],
      variables: [
        { key: 'DISEASE', options: ['the plague', 'cholera', 'smallpox', 'dysentery', 'mysterious fever'] },
        { key: 'LOCATION', options: ['the market district', 'the poor quarters', 'nearby villages', 'the port', 'military barracks'] }
      ],
      outcomes: [
        createOutcome('organize_response', 'Organize medical response',
          [{ type: 'reputation', target: 'reputation', value: 20 }],
          { stat: 'charisma', min: 12 }
        ),
        createOutcome('investigate_source', 'Investigate disease source',
          [{ type: 'stat_change', target: 'intelligence', value: 1 }],
          { stat: 'wisdom', min: 13 }
        ),
        createOutcome('quarantine_measures', 'Implement quarantine',
          [{ type: 'reputation', target: 'reputation', value: -5 }]
        )
      ]
    },
    {
      id: 'medical_discovery',
      template: 'While treating patients, you notice [OBSERVATION] that contradicts traditional medicine.',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.2 }
      ],
      variables: [
        { key: 'OBSERVATION', options: ['a pattern in symptoms', 'an unexpected recovery', 'a new treatment effect', 'unusual disease progression'] }
      ],
      outcomes: [
        createOutcome('document_findings', 'Document your findings',
          [{ type: 'stat_change', target: 'intelligence', value: 2 }]
        ),
        createOutcome('test_theory', 'Test your theory',
          [],
          { stat: 'intelligence', min: 14 }
        ),
        createOutcome('consult_colleagues', 'Consult other healers',
          [{ type: 'reputation', target: 'reputation', value: 10 }],
          { stat: 'charisma', min: 11 }
        )
      ]
    },
    {
      id: 'medicine_shortage',
      template: 'Your supply of [MEDICINE] is running low, but patients desperately need treatment.',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.25 }
      ],
      variables: [
        { key: 'MEDICINE', options: ['willow bark', 'opium', 'mercury', 'bloodletting equipment', 'medicinal herbs'], contextual: true }
      ],
      outcomes: [
        createOutcome('find_alternatives', 'Search for alternatives',
          [{ type: 'stat_change', target: 'wisdom', value: 1 }],
          { stat: 'intelligence', min: 12 }
        ),
        createOutcome('ration_supplies', 'Ration existing supplies',
          [{ type: 'reputation', target: 'reputation', value: -5 }]
        ),
        createOutcome('seek_merchants', 'Find traveling merchants',
          [],
          { stat: 'charisma', min: 10 }
        )
      ]
    },
    {
      id: 'ethical_dilemma',
      template: '[PATIENT] can only afford [PAYMENT], but needs expensive treatment to survive.',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.3 }
      ],
      variables: [
        { key: 'PATIENT', options: ['A poor widow', 'A beggar child', 'An elderly peasant', 'A desperate mother', 'A homeless veteran'] },
        { key: 'PAYMENT', options: ['a few copper coins', 'a promise of future payment', 'their family heirloom', 'manual labor'] }
      ],
      outcomes: [
        createOutcome('treat_anyway', 'Treat for free',
          [{ type: 'reputation', target: 'reputation', value: 15 }, { type: 'health', target: 'health', value: -5 }]
        ),
        createOutcome('partial_treatment', 'Provide basic care',
          [{ type: 'reputation', target: 'reputation', value: 5 }]
        ),
        createOutcome('refuse_patient', 'Demand full payment',
          [{ type: 'reputation', target: 'reputation', value: -15 }]
        )
      ]
    },
    {
      id: 'competing_healer',
      template: 'Another healer [ACTION] regarding your methods. The community watches.',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.2 }
      ],
      variables: [
        { key: 'ACTION', options: ['publicly challenges you', 'questions your techniques', 'claims superior knowledge', 'accuses you of quackery'] }
      ],
      outcomes: [
        createOutcome('public_demonstration', 'Demonstrate your methods',
          [{ type: 'reputation', target: 'reputation', value: 10 }],
          { stat: 'intelligence', min: 13 }
        ),
        createOutcome('seek_collaboration', 'Propose collaboration',
          [{ type: 'reputation', target: 'reputation', value: 5 }],
          { stat: 'charisma', min: 12 }
        ),
        createOutcome('ignore_challenger', 'Ignore the challenge',
          [{ type: 'reputation', target: 'reputation', value: -5 }]
        )
      ]
    }
  ]
};

// ============================================
// LEGAL MODE
// ============================================
export const LEGAL_MODE: GameMode = {
  id: 'legal',
  name: 'Legal Mode',
  description: 'Navigate justice systems and resolve moral dilemmas',
  defaultWeight: 0.4,
  victoryConditions: [
    { id: 'win_case', description: 'Win landmark case', type: 'custom', progress: 0 },
    { id: 'reform_law', description: 'Reform unjust law', type: 'custom', progress: 0 },
    { id: 'achieve_justice', description: 'Achieve justice', type: 'custom', progress: 0 }
  ],
  eventArchetypes: [
    {
      id: 'case_dilemma',
      template: 'Evidence in the [CASE_TYPE] case suggests [CONFLICT]. The law says [LAW], but justice might require [ALTERNATIVE].',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.35 }
      ],
      variables: [
        { key: 'CASE_TYPE', options: ['theft', 'assault', 'contract dispute', 'inheritance', 'blasphemy'] },
        { key: 'CONFLICT', options: ['conflicting testimony', 'hidden motives', 'political pressure', 'moral complexity'] },
        { key: 'LAW', options: ['harsh punishment', 'clear guilt', 'strict precedent', 'mandatory sentence'] },
        { key: 'ALTERNATIVE', options: ['mercy', 'deeper investigation', 'flexibility', 'reform'] }
      ],
      outcomes: [
        createOutcome('follow_law', 'Follow letter of law',
          [{ type: 'reputation', target: 'reputation', value: 5 }]
        ),
        createOutcome('seek_justice', 'Seek true justice',
          [{ type: 'reputation', target: 'reputation', value: -10 }],
          { stat: 'wisdom', min: 12 }
        ),
        createOutcome('find_compromise', 'Find compromise',
          [],
          { stat: 'intelligence', min: 11 }
        )
      ]
    },
    {
      id: 'ethical_challenge',
      template: '[PARTY] offers [INDUCEMENT] to influence the [CASE_ASPECT].',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.2 }
      ],
      variables: [
        { key: 'PARTY', options: ['A noble', 'A merchant', 'An official', 'A desperate parent', 'A political faction'] },
        { key: 'INDUCEMENT', options: ['gold', 'political favor', 'threats', 'information', 'future support'] },
        { key: 'CASE_ASPECT', options: ['verdict', 'evidence', 'witness testimony', 'sentencing', 'procedure'] }
      ],
      outcomes: [
        createOutcome('accept_bribe', 'Accept offer',
          [{ type: 'reputation', target: 'reputation', value: -25 }]
        ),
        createOutcome('refuse_bribe', 'Refuse firmly',
          [{ type: 'reputation', target: 'reputation', value: 10 }]
        ),
        createOutcome('report_corruption', 'Report attempt',
          [{ type: 'reputation', target: 'reputation', value: 15 }]
        )
      ]
    },
    {
      id: 'precedent_decision',
      template: 'Your ruling on [ISSUE] will affect [SCOPE]. There is no clear precedent.',
      triggers: [
        { type: 'random', condition: 'true', probability: 0.25 }
      ],
      variables: [
        { key: 'ISSUE', options: ['inheritance rights', 'trade disputes', 'criminal punishment', 'religious matters', 'property rights'] },
        { key: 'SCOPE', options: ['the entire city', 'the region', 'future cases', 'social order', 'economic system'] }
      ],
      outcomes: [
        createOutcome('conservative', 'Conservative ruling',
          [{ type: 'reputation', target: 'reputation', value: 5 }]
        ),
        createOutcome('progressive', 'Progressive ruling',
          [{ type: 'reputation', target: 'reputation', value: -5 }]
        ),
        createOutcome('defer', 'Defer decision',
          []
        )
      ]
    },
    {
      id: 'reform_opportunity',
      template: 'You have chance to change [LAW_PRACTICE]. [SUPPORTERS] support you, [OPPONENTS] resist.',
      triggers: [
        { type: 'time_based', condition: 'day % 20 == 0', probability: 0.2 }
      ],
      variables: [
        { key: 'LAW_PRACTICE', options: ['punishment methods', 'trial procedures', 'evidence standards', 'sentencing guidelines'] },
        { key: 'SUPPORTERS', options: ['Reformers', 'The common folk', 'Young officials', 'Religious leaders'] },
        { key: 'OPPONENTS', options: ['Conservatives', 'The nobility', 'Old guard', 'Vested interests'] }
      ],
      outcomes: [
        createOutcome('push_hard', 'Push hard for change',
          [{ type: 'reputation', target: 'reputation', value: -15 }]
        ),
        createOutcome('incremental', 'Incremental change',
          [{ type: 'reputation', target: 'reputation', value: 5 }]
        ),
        createOutcome('status_quo', 'Maintain status quo',
          []
        )
      ]
    }
  ]
};

// ============================================
// EXPORT ALL MODES
// ============================================
export const GAME_MODES = [
  SURVIVAL_MODE,
  EXPLORATION_MODE,
  COMMERCE_MODE,
  SCHOLARSHIP_MODE,
  LEADERSHIP_MODE,
  LIVELIHOOD_MODE,
  DIPLOMACY_MODE,
  HEALER_MODE,
  LEGAL_MODE
];

/**
 * Get a game mode by ID
 */
export function getGameModeById(id: string): GameMode | undefined {
  return GAME_MODES.find(mode => mode.id === id);
}

/**
 * Determine best game mode based on player context with weighted probabilities
 */
export function suggestGameMode(
  playerProfession?: string,
  startLocation?: string,
  era?: string,
  playerStats?: {
    health?: number;
    intelligence?: number;
    charisma?: number;
    strength?: number;
    privilege?: number;
    constitution?: number;
  }
): GameMode {
  // Weight system for different modes
  const weights: Record<string, number> = {
    survival: 0,
    exploration: 10, // Base weight for exploration
    commerce: 5,
    scholarship: 5,
    leadership: 5,
    livelihood: 20, // Default weight for ordinary people
    diplomacy: 5,
    healer: 5,
    legal: 5
  };

  // Adjust weights based on player stats
  if (playerStats) {
    // Low health or constitution = higher survival weight
    if ((playerStats.health && playerStats.health < 30) || 
        (playerStats.constitution && playerStats.constitution < 8)) {
      weights.survival += 40;
      weights.livelihood -= 10;
    }
    
    // High intelligence = scholarship
    if (playerStats.intelligence && playerStats.intelligence >= 15) {
      weights.scholarship += 25;
      weights.exploration += 10;
    }
    
    // High charisma = diplomacy, leadership, commerce
    if (playerStats.charisma && playerStats.charisma >= 14) {
      weights.diplomacy += 20;
      weights.leadership += 15;
      weights.commerce += 10;
    }
    
    // High privilege = leadership, legal, commerce
    if (playerStats.privilege && playerStats.privilege >= 14) {
      weights.leadership += 20;
      weights.legal += 15;
      weights.commerce += 10;
      weights.survival -= 10; // Less likely to be in survival mode
    } else if (playerStats.privilege && playerStats.privilege < 8) {
      // Low privilege = survival, livelihood
      weights.survival += 15;
      weights.livelihood += 15;
      weights.leadership -= 10;
    }
    
    // High strength = exploration, survival (can handle challenges)
    if (playerStats.strength && playerStats.strength >= 14) {
      weights.exploration += 15;
      weights.survival += 5; // Can handle survival situations
    }
  }

  // Adjust weights based on profession
  if (playerProfession) {
    const profession = playerProfession.toLowerCase();
    
    // Merchant/Trader professions
    if (profession.includes('merchant') || profession.includes('trader') || 
        profession.includes('vendor') || profession.includes('shopkeep')) {
      weights.commerce += 40;
      weights.livelihood += 10;
    }
    
    // Scholar/Academic professions
    if (profession.includes('scholar') || profession.includes('scribe') || 
        profession.includes('sage') || profession.includes('teacher') ||
        profession.includes('philosopher') || profession.includes('historian')) {
      weights.scholarship += 40;
      weights.exploration += 10;
    }
    
    // Leadership professions
    if (profession.includes('chief') || profession.includes('mayor') || 
        profession.includes('lord') || profession.includes('noble') ||
        profession.includes('governor') || profession.includes('king') ||
        profession.includes('queen') || profession.includes('prince')) {
      weights.leadership += 50;
      weights.diplomacy += 20;
      weights.survival -= 20; // Unlikely to be in survival mode
    }
    
    // Legal professions
    if (profession.includes('judge') || profession.includes('lawyer') || 
        profession.includes('magistrate') || profession.includes('bailiff')) {
      weights.legal += 40;
      weights.leadership += 10;
    }
    
    // Diplomatic professions
    if (profession.includes('ambassador') || profession.includes('diplomat') || 
        profession.includes('envoy') || profession.includes('emissary')) {
      weights.diplomacy += 40;
      weights.commerce += 10;
    }
    
    // Explorer professions
    if (profession.includes('explorer') || profession.includes('captain') || 
        profession.includes('navigator') || profession.includes('cartographer') ||
        profession.includes('scout')) {
      weights.exploration += 40;
      weights.commerce += 5;
    }
    
    // Religious professions
    if (profession.includes('priest') || profession.includes('monk') || 
        profession.includes('imam') || profession.includes('rabbi') ||
        profession.includes('shaman') || profession.includes('cleric')) {
      weights.scholarship += 20;
      weights.diplomacy += 15;
      weights.leadership += 10;
    }
    
    // Medical/Healer professions
    if (profession.includes('healer') || profession.includes('physician') || 
        profession.includes('surgeon') || profession.includes('apothecary') ||
        profession.includes('midwife') || profession.includes('medicine') ||
        profession.includes('doctor') || profession.includes('herbalist')) {
      weights.healer += 40;
      weights.scholarship += 15;
      weights.livelihood += 10;
    }
    
    // Military professions
    if (profession.includes('soldier') || profession.includes('warrior') || 
        profession.includes('guard') || profession.includes('knight')) {
      weights.leadership += 10;
      weights.exploration += 15;
      weights.survival += 10;
    }
    
    // Labor professions
    if (profession.includes('farmer') || profession.includes('shepherd') || 
        profession.includes('miner') || profession.includes('blacksmith') ||
        profession.includes('carpenter') || profession.includes('mason') ||
        profession.includes('peasant') || profession.includes('laborer')) {
      weights.livelihood += 30;
      weights.survival += 10;
    }
    
    // Criminal/Outlaw professions
    if (profession.includes('thief') || profession.includes('outlaw') || 
        profession.includes('bandit') || profession.includes('pirate')) {
      weights.survival += 20;
      weights.exploration += 15;
      weights.livelihood += 10;
      weights.leadership -= 20; // Unlikely to be in official leadership
    }
  }

  // Adjust based on era
  if (era) {
    if (era === 'ancient') {
      weights.survival += 10;
      weights.exploration += 15;
      weights.scholarship += 5;
    } else if (era === 'medieval') {
      weights.livelihood += 10;
      weights.leadership += 5;
      weights.legal += 5;
    } else if (era === 'early_modern') {
      weights.commerce += 10;
      weights.exploration += 10;
      weights.diplomacy += 5;
    } else if (era === 'modern') {
      weights.commerce += 15;
      weights.legal += 10;
      weights.survival -= 5;
    }
  }

  // Remove negative weights
  Object.keys(weights).forEach(key => {
    if (weights[key] < 0) weights[key] = 0;
  });

  // Calculate total weight
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  
  // Random selection based on weights
  let random = Math.random() * totalWeight;
  
  // Select mode based on weighted random
  for (const [mode, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      switch(mode) {
        case 'survival': return SURVIVAL_MODE;
        case 'exploration': return EXPLORATION_MODE;
        case 'commerce': return COMMERCE_MODE;
        case 'scholarship': return SCHOLARSHIP_MODE;
        case 'leadership': return LEADERSHIP_MODE;
        case 'diplomacy': return DIPLOMACY_MODE;
        case 'legal': return LEGAL_MODE;
        case 'healer': return HEALER_MODE;
        case 'livelihood': 
        default: return LIVELIHOOD_MODE;
      }
    }
  }
  
  // Fallback to livelihood
  return LIVELIHOOD_MODE;
}