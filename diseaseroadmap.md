# Disease System Roadmap

## Overview
A comprehensive, historically accurate disease system that adds depth and challenge to the historical simulation while teaching players about the reality of disease in different eras and regions.

## Core Design Principles

### Historical Accuracy
- **Columbian Exchange Awareness**: No syphilis in Europe pre-1493, no smallpox in Americas pre-contact
- **Era-Appropriate Diseases**: Black Death in 14th century, not 20th; Spanish Flu in 1918-1920
- **Regional Specificity**: Malaria in tropical zones, tuberculosis in industrial cities
- **Transmission Vectors**: Accurate disease spread (airborne, waterborne, vector-borne, contact)

### Educational Value
- Teaches about historical pandemics and their impact
- Shows how disease shaped human history
- Demonstrates evolution of medical understanding
- Illustrates public health challenges across eras

## Disease Taxonomy

### Disease Types & Categories

#### 1. Respiratory Diseases
**Transmission**: Airborne, close proximity
**Symptoms**: Coughing, wheezing, fatigue
**Examples**:
- Common Cold (all eras, all regions)
- Influenza (seasonal, all eras)
- Tuberculosis (urban, medieval-industrial)
- Pneumonic Plague (medieval)
- Spanish Flu (1918-1920 only)
- COVID-19 (2020+ only)

#### 2. Gastrointestinal Diseases
**Transmission**: Contaminated food/water
**Symptoms**: Vomiting, weakness, dehydration
**Examples**:
- Dysentery (all eras, poor sanitation)
- Cholera (19th century pandemics)
- Typhoid (urban, pre-modern)
- Food Poisoning (all eras)

#### 3. Vector-Borne Diseases
**Transmission**: Insect/animal bites
**Symptoms**: Fever, rash, joint pain
**Examples**:
- Malaria (tropical/subtropical)
- Yellow Fever (tropical Africa/Americas)
- Bubonic Plague (medieval, flea-borne)
- Typhus (louse-borne, war/poverty)
- Dengue (tropical, modern era)

#### 4. Contact Diseases
**Transmission**: Direct contact, bodily fluids
**Symptoms**: Skin lesions, fever, scarring
**Examples**:
- Smallpox (pre-1980 eradication)
- Measles (pre-vaccination eras)
- Leprosy (ancient-medieval)
- Syphilis (post-1493 in Old World)

#### 5. Parasitic Infections
**Transmission**: Contaminated water, poor hygiene
**Symptoms**: Fatigue, digestive issues
**Examples**:
- Intestinal Worms (all eras, poor sanitation)
- Schistosomiasis (tropical freshwater)
- Guinea Worm (Africa, Asia)

#### 6. Zoonotic Diseases
**Transmission**: Animal contact
**Symptoms**: Variable
**Examples**:
- Rabies (animal bites, all eras)
- Anthrax (livestock, all eras)
- Swine Flu (pig contact)
- Avian Flu (bird contact)

## Disease Data Structure

```typescript
interface Disease {
  id: string;
  name: string;
  type: DiseaseType;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  
  // Historical constraints
  availableEras: HistoricalEra[];
  availableRegions: CulturalZone[];
  startYear?: number;  // First appearance
  endYear?: number;    // Eradication/control
  
  // Transmission
  transmissionVector: 'airborne' | 'waterborne' | 'vector' | 'contact' | 'zoonotic';
  baseTransmissionRate: number; // 0-1
  proximityMultiplier: number;  // How much closer contact increases risk
  
  // Symptoms & Effects
  symptoms: Symptom[];
  incubationDays: number;
  durationDays: number;
  mortalityRate: number; // 0-1, modified by stats
  
  // Stat modifiers when infected
  statEffects: {
    health: number;
    fatigue: number;
    strength: number;
    intelligence: number;
    charisma: number;
    speed: number;
  };
  
  // Recovery & Immunity
  recoveryChance: number; // Daily check
  grantsImmunity: boolean;
  immunityDuration: number; // Days, -1 for permanent
  
  // Visual & Narrative
  narrativeHints: {
    npcSymptoms: string[];  // "is coughing loudly"
    animalSymptoms: string[]; // "appears lethargic"
    playerSymptoms: string[]; // "You feel feverish"
  };
  badgeIcon: string;
  outlineColor: string; // Player circle color when infected
}

interface CharacterHealth {
  currentDiseases: ActiveDisease[];
  immunities: Immunity[];
  exposureHistory: ExposureEvent[];
  overallHealthStatus: 'healthy' | 'mild' | 'sick' | 'critical';
}

interface ActiveDisease {
  disease: Disease;
  contractedDate: GameDate;
  stage: 'incubating' | 'symptomatic' | 'recovering';
  daysRemaining: number;
  severity: number; // 0-1, modified by constitution
}
```

## Implementation Phases

### Phase 1: Core Disease System (Week 1)

#### 1.1 Disease Database
- Create comprehensive disease definitions by era/region
- Implement Columbian Exchange logic
- Set up disease type categories
- Define transmission mechanics

#### 1.2 NPC/Animal Disease Assignment
```typescript
// On NPC/Animal spawn
function assignDiseases(character: NPC | Animal) {
  const availableDiseases = getDiseasesByEraAndRegion(era, region);
  const diseaseChance = calculateDiseaseChance(character.stats);
  
  const diseases = [];
  for (let i = 0; i < 3; i++) {
    if (Math.random() < diseaseChance) {
      diseases.push(selectRandomDisease(availableDiseases));
    }
  }
  
  character.health = { ...character.health, currentDiseases: diseases };
}

function calculateDiseaseChance(stats: CharacterStats): number {
  // Lower health, constitution = higher disease chance
  const healthFactor = (100 - stats.health) / 100;
  const constitutionFactor = (20 - stats.constitution) / 20;
  const wanderlustFactor = stats.wanderlust / 20; // Travelers more exposed
  
  return Math.min(0.8, (healthFactor + constitutionFactor + wanderlustFactor) / 3);
}
```

#### 1.3 Proximity Detection System
```typescript
// In movement update loop
function checkDiseaseProximity(player: Player, npcs: NPC[], animals: Animal[]) {
  const nearbyEntities = [...npcs, ...animals].filter(
    entity => getDistance(player, entity) <= 1 // Within 1 tile
  );
  
  nearbyEntities.forEach(entity => {
    if (entity.health.currentDiseases.length > 0) {
      // Add narrative hint
      addNarrationHint(generateProximityHint(entity));
      
      // Check transmission
      entity.health.currentDiseases.forEach(disease => {
        checkTransmission(player, entity, disease, 'proximity');
      });
    }
  });
}
```

#### 1.4 Narrative Generation
```typescript
function generateProximityHint(entity: NPC | Animal, disease: Disease): string {
  if (entity.type === 'npc') {
    return `You walked near ${entity.name}. ${selectRandom(disease.narrativeHints.npcSymptoms)}`;
  } else {
    return `You walked near a ${entity.species}. ${selectRandom(disease.narrativeHints.animalSymptoms)}`;
  }
}
```

#### 1.5 Visual Indicators
- Player outline color change (amber → greenish when sick)
- Disease badge in character panel
- Status text updates
- NPC/Animal visual markers (optional subtle indicators)

### Phase 2: Advanced Features & Integration (Week 2)

#### 2.1 Encounter Modal Integration
```typescript
// In encounter modal interaction
function handleEncounterDisease(player: Player, npc: NPC) {
  if (npc.health.currentDiseases.length > 0) {
    // Much higher transmission chance for direct interaction
    npc.health.currentDiseases.forEach(disease => {
      checkTransmission(player, npc, disease, 'direct_contact');
    });
    
    // Add visible symptoms to dialogue
    addSymptomDescription(npc, modalText);
  }
}
```

#### 2.2 Disease Progression System
```typescript
function updateDiseaseProgression(character: Character) {
  character.health.currentDiseases.forEach(activeDisease => {
    activeDisease.daysRemaining--;
    
    // Stage transitions
    if (activeDisease.stage === 'incubating' && 
        activeDisease.daysRemaining <= disease.durationDays - disease.incubationDays) {
      activeDisease.stage = 'symptomatic';
      applySymptoms(character, activeDisease);
    }
    
    // Recovery check
    if (activeDisease.daysRemaining <= 0) {
      if (Math.random() < calculateRecoveryChance(character, activeDisease)) {
        recoverFromDisease(character, activeDisease);
      } else {
        // Extend illness or worsen
        activeDisease.daysRemaining = Math.ceil(disease.durationDays / 2);
        activeDisease.severity = Math.min(1, activeDisease.severity + 0.1);
      }
    }
    
    // Mortality check for severe diseases
    if (activeDisease.severity > 0.8 && disease.mortalityRate > 0) {
      checkMortality(character, activeDisease);
    }
  });
}
```

#### 2.3 Treatment & Medicine System
```typescript
interface Medicine {
  id: string;
  name: string;
  availableEras: HistoricalEra[];
  effectiveness: Record<DiseaseType, number>; // 0-1
  sideEffects?: StatModifier[];
}

// Historical remedies
const MEDICINES = {
  HERBAL_REMEDY: {
    name: 'Herbal Remedy',
    availableEras: ['all'],
    effectiveness: { respiratory: 0.2, gastrointestinal: 0.3 }
  },
  BLOODLETTING: {
    name: 'Bloodletting',
    availableEras: ['medieval', 'renaissance'],
    effectiveness: { all: 0.1 }, // Often harmful!
    sideEffects: [{ health: -10 }]
  },
  ANTIBIOTICS: {
    name: 'Antibiotics',
    availableEras: ['modern'],
    effectiveness: { bacterial: 0.9 }
  }
};
```

#### 2.4 New Game Mode: Healer Mode
```typescript
const HEALER_MODE: GameMode = {
  id: 'healer',
  name: 'Healer Mode',
  description: 'Practice medicine and combat disease in your community',
  
  eventArchetypes: [
    {
      id: 'outbreak',
      template: 'A [DISEASE] outbreak threatens [LOCATION]. [URGENCY]',
      triggers: [{ type: 'disease_proximity', probability: 0.3 }],
      outcomes: [
        { description: 'Treat the sick', statChecks: ['intelligence > 12'] },
        { description: 'Quarantine', statChecks: ['charisma > 10'] },
        { description: 'Flee', effects: [{ type: 'reputation', value: -10 }] }
      ]
    },
    {
      id: 'medical_discovery',
      template: 'You observe that [TREATMENT] seems to help with [SYMPTOM]',
      triggers: [{ type: 'treat_success', probability: 0.1 }],
      outcomes: [
        { description: 'Document findings', effects: [{ type: 'knowledge', value: 1 }] },
        { description: 'Share freely', effects: [{ type: 'reputation', value: 10 }] },
        { description: 'Keep secret', effects: [{ type: 'wealth', value: 5 }] }
      ]
    }
  ],
  
  victoryConditions: [
    { description: 'Cure 50 patients', type: 'heal_count', target: 50 },
    { description: 'Prevent an epidemic', type: 'prevent_outbreak' },
    { description: 'Discover new treatment', type: 'medical_discovery' }
  ]
};
```

#### 2.5 Event System Integration
- Disease-related random events
- Epidemic/pandemic events for certain eras
- Quest chains for finding cures
- Trade events for medicine/herbs

## Era-Specific Disease Lists

### Prehistoric (< 3000 BCE)
- Parasitic infections (universal)
- Zoonotic diseases from newly domesticated animals
- No epidemic diseases (population too sparse)

### Ancient (3000 BCE - 500 CE)
- **Mediterranean**: Malaria, tuberculosis, leprosy
- **East Asia**: Smallpox (earliest), intestinal parasites
- **Americas**: Chagas disease, no Old World diseases
- **Africa**: Malaria, sleeping sickness, yellow fever

### Medieval (500 - 1450)
- **Europe**: Black Death (1347-1351), leprosy, ergotism
- **Islamic World**: Preserved medical knowledge, fewer epidemics
- **Asia**: Smallpox endemic, plague origins
- **Americas**: Still isolated from Old World diseases

### Early Modern (1450 - 1750)
- **Columbian Exchange**: Catastrophic disease transfer
- **Americas Post-Contact**: 90% mortality from smallpox, measles, typhus
- **Europe**: Syphilis arrives from Americas
- **Global**: First pandemic spread via trade routes

### Industrial (1750 - 1900)
- **Urban**: Cholera pandemics, tuberculosis, typhoid
- **Colonial**: Tropical diseases meet European colonizers
- **Medical Revolution Beginning**: Germ theory, sanitation

### Modern (1900+)
- **1918**: Spanish Flu pandemic
- **Mid-century**: Antibiotics reduce bacterial diseases
- **Late century**: HIV/AIDS, emerging viruses
- **2020+**: COVID-19 pandemic

## User Interface

### Player Character Panel Additions
```
┌─────────────────────────────┐
│ Health Status: [INFECTED 🦠] │
│ ────────────────────       │
│ Current Ailments:          │
│ • Influenza (Day 3/7)      │
│   Symptoms: Fever, Cough   │
│   [-5 STR] [-3 INT]       │
│                            │
│ Immunities:                │
│ • Smallpox (Permanent)     │
│ • Measles (120 days)       │
└─────────────────────────────┘
```

### Narrator Panel Disease Hints
```
[Pale yellow background for disease hints]
"You passed near a merchant. They were 
coughing violently and looked feverish."

[Red background for infection]
"You feel a fever coming on. Your throat 
is sore and body aches."
```

### Visual Indicators
- **Healthy**: Amber outline (current)
- **Mild illness**: Pale yellow outline
- **Moderate illness**: Yellow-green outline
- **Severe illness**: Sickly green outline
- **Critical**: Dark green with red tinge

## Performance Considerations

### Optimization Strategies
1. **Lazy Disease Checking**: Only check transmission when player moves
2. **Batch NPC Updates**: Update all NPC diseases once per game day
3. **Proximity Grid**: Spatial indexing for efficient proximity checks
4. **Disease Pool**: Pre-filter diseases by era/region on map load

### Save System Integration
```typescript
interface SaveGameHealth {
  playerDiseases: CompressedDisease[];
  npcDiseaseMap: Map<string, string[]>; // NPC ID -> Disease IDs
  globalEpidemics: ActiveEpidemic[];
}
```

## Balancing Considerations

### Difficulty Scaling
- **Easy**: Lower transmission rates, higher recovery chances
- **Normal**: Historical accuracy
- **Hard**: Higher transmission, longer recovery, more severe effects
- **Hardcore**: Permanent death from severe diseases

### Stat Integration
- **Constitution**: Reduces severity, increases recovery
- **Intelligence**: Better treatment choices, recognize symptoms
- **Charisma**: Convince others to quarantine, get medical help
- **Wealth**: Access to better medicine, cleaner environments

## Educational Content

### Primary Source Integration
- Link to historical accounts of epidemics
- Medical texts from different eras
- Survivor testimonies
- Public health documents

### Historical Context
- Explain why certain diseases were devastating
- Show evolution of medical understanding
- Demonstrate impact on historical events
- Illustrate development of public health

## Future Expansions

### Potential Features
1. **Epidemic Spreading**: Visual disease spread across map
2. **Quarantine Mechanics**: Isolate areas to prevent spread
3. **Medical Research**: Discover treatments through gameplay
4. **Vaccination**: Available in appropriate eras
5. **Sanitation Systems**: Build infrastructure to reduce disease
6. **Animal Disease**: Livestock epidemics affecting food supply
7. **Biological Warfare**: Historical use of disease as weapon
8. **Traditional Medicine**: Culture-specific healing practices

## Testing Strategy

### Test Scenarios
1. Walk past infected NPC - verify hint generation
2. Direct encounter with sick NPC - verify higher transmission
3. Disease progression over multiple days
4. Recovery and immunity acquisition
5. Era-appropriate disease spawning
6. Columbian Exchange disease barriers
7. Save/load with active diseases
8. Performance with 100+ diseased NPCs

## Success Metrics

### Gameplay
- Disease adds strategic depth without frustration
- Players learn about historical health challenges
- Transmission feels realistic but not overwhelming
- Recovery is achievable but challenging

### Educational
- Players understand disease's role in history
- Accurate representation of medical evolution
- Respect for historical suffering
- Understanding of public health importance

### Technical
- No performance impact with disease system
- Smooth integration with existing systems
- Clear visual/narrative feedback
- Bug-free save/load functionality