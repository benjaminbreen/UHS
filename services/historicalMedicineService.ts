/**
 * Historical Medicine Service
 * Provides historically accurate medical information and treatments for diseases
 */

import { Disease, DiseaseSeverity } from '../types/diseaseTypes';
import { HistoricalEra } from '../types';
import { CulturalZone } from '../types/characterData';

interface HistoricalMedicalContext {
  era: HistoricalEra;
  zone: CulturalZone;
  year: number;
  disease: Disease;
}

interface MedicalUnderstanding {
  causeBelief: string;
  symptomsDescription: string[];
  culturalName: string;
  socialResponse: string;
}

interface HistoricalTreatment {
  method: string;
  practitioner: string;
  effectiveness: 'harmful' | 'ineffective' | 'placebo' | 'partially_effective' | 'effective';
  description: string;
  ingredients?: string[];
}

class HistoricalMedicineService {
  /**
   * Get how a disease was understood in a specific historical context
   */
  getDiseaseUnderstanding(context: HistoricalMedicalContext): MedicalUnderstanding {
    const { era, zone, disease } = context;
    
    // Base understanding templates by era and disease type
    const understandings = this.getEraSpecificUnderstandings(era, zone);
    const diseaseType = disease.type;
    
    // Generate culturally appropriate disease name
    const culturalName = this.getCulturalDiseaseName(disease, era, zone);
    
    // Get cause belief based on era and culture
    const causeBelief = this.getCauseBelief(diseaseType, era, zone);
    
    // Convert modern symptoms to historical descriptions
    const symptomsDescription = this.convertSymptomsToHistorical(disease.symptoms, era);
    
    // Get social response
    const socialResponse = this.getSocialResponse(disease.severity, era, zone);
    
    return {
      culturalName,
      causeBelief,
      symptomsDescription,
      socialResponse
    };
  }

  /**
   * Get available treatments for a disease in a specific historical context
   */
  getHistoricalTreatments(context: HistoricalMedicalContext): HistoricalTreatment[] {
    const { era, zone, disease } = context;
    const treatments: HistoricalTreatment[] = [];
    
    // Add era-specific treatments
    switch (era) {
      case 'PREHISTORIC':
        treatments.push(...this.getPrehistoricTreatments(disease, zone));
        break;
      case 'ANCIENT':
        treatments.push(...this.getAncientTreatments(disease, zone));
        break;
      case 'MEDIEVAL':
        treatments.push(...this.getMedievalTreatments(disease, zone));
        break;
      case 'EARLY_MODERN':
        treatments.push(...this.getEarlyModernTreatments(disease, zone));
        break;
      case 'INDUSTRIAL':
        treatments.push(...this.getIndustrialTreatments(disease, zone));
        break;
      case 'MODERN':
        treatments.push(...this.getModernTreatments(disease, zone));
        break;
    }
    
    return treatments;
  }

  private getCulturalDiseaseName(disease: Disease, era: HistoricalEra, zone: CulturalZone): string {
    // Map modern disease names to historical/cultural equivalents
    const nameMap: Record<string, Record<HistoricalEra, Record<CulturalZone, string>>> = {
      'Tularemia (Rabbit Fever)': {
        PREHISTORIC: {
          EUROPEAN: 'Hunter\'s Curse',
          NORTH_AMERICAN_PRE_COLUMBIAN: 'Rabbit Sickness',
          EAST_ASIAN: 'Wild Hare Disease',
          MENA: 'Desert Fever',
          SOUTH_ASIAN: 'Forest Affliction',
          AFRICAN: 'Bush Fever',
          MESOAMERICAN: 'Conejo Disease',
          ANDEAN: 'Mountain Rabbit Illness',
          OCEANIC: 'Island Fever'
        },
        ANCIENT: {
          EUROPEAN: 'Lepus Morbus',
          MENA: 'Arnab Fever',
          EAST_ASIAN: 'Tù Bìng',
          SOUTH_ASIAN: 'Vanya Jwara',
          AFRICAN: 'Sungura Sickness'
        },
        MEDIEVAL: {
          EUROPEAN: 'Hare Pestilence',
          MENA: 'Humma al-Arnab',
          EAST_ASIAN: 'Usagi no Yamai',
          SOUTH_ASIAN: 'Khargosh Rog'
        },
        EARLY_MODERN: {
          EUROPEAN: 'Rabbit Plague',
          NORTH_AMERICAN_COLONIAL: 'Trapper\'s Disease',
          EAST_ASIAN: 'Hare Fever'
        },
        INDUSTRIAL: {
          EUROPEAN: 'Francis Disease',
          NORTH_AMERICAN_COLONIAL: 'Deer-fly Fever'
        },
        MODERN: {
          EUROPEAN: 'Tularemia',
          NORTH_AMERICAN_COLONIAL: 'Tularemia'
        }
      }
    };
    
    // Return culturally appropriate name or fallback
    const diseaseNames = nameMap[disease.name];
    if (diseaseNames && diseaseNames[era] && diseaseNames[era][zone]) {
      return diseaseNames[era][zone];
    }
    
    // Fallback to generic historical naming
    return this.generateGenericHistoricalName(disease, era, zone);
  }

  private generateGenericHistoricalName(disease: Disease, era: HistoricalEra, zone: CulturalZone): string {
    const severityTerms = {
      mild: ['Minor', 'Common', 'Light'],
      moderate: ['Troublesome', 'Persistent', 'Wearing'],
      severe: ['Grave', 'Terrible', 'Great'],
      critical: ['Mortal', 'Fatal', 'Death-bringing']
    };
    
    const typeTerms = {
      respiratory: ['Lung', 'Breathing', 'Coughing'],
      gastrointestinal: ['Belly', 'Flux', 'Griping'],
      vector_borne: ['Insect', 'Bite', 'Sting'],
      contact: ['Touch', 'Spreading', 'Catching'],
      parasitic: ['Worm', 'Creeping', 'Internal'],
      zoonotic: ['Animal', 'Beast', 'Creature']
    };
    
    const suffix = ['Sickness', 'Disease', 'Affliction', 'Malady', 'Fever', 'Plague'];
    
    const severity = severityTerms[disease.severity][0];
    const type = typeTerms[disease.type as keyof typeof typeTerms]?.[0] || 'Unknown';
    const end = suffix[Math.floor(Math.random() * suffix.length)];
    
    return `${severity} ${type} ${end}`;
  }

  private getCauseBelief(diseaseType: string, era: HistoricalEra, zone: CulturalZone): string {
    const beliefs: Record<HistoricalEra, Record<string, string[]>> = {
      PREHISTORIC: {
        default: [
          'Evil spirits have entered your body',
          'You have violated a taboo',
          'The ancestors are displeased',
          'A curse has been placed upon you'
        ]
      },
      ANCIENT: {
        EUROPEAN: [
          'The four humors have become imbalanced',
          'The gods have sent this affliction',
          'Miasmic vapors have corrupted your blood'
        ],
        MENA: [
          'The balance of hot and cold has been disrupted',
          'Divine punishment for transgressions',
          'Evil eye has fallen upon you'
        ],
        EAST_ASIAN: [
          'Your qi flow has been disrupted',
          'Yin and yang are imbalanced',
          'Wind-evil has invaded your body'
        ],
        SOUTH_ASIAN: [
          'Your doshas are imbalanced',
          'Karmic consequences manifest',
          'Impure substances have entered your body'
        ]
      },
      MEDIEVAL: {
        EUROPEAN: [
          'Corrupt air and pestilential miasma',
          'Punishment for sins',
          'Astrological misalignment',
          'Imbalance of bodily humors'
        ],
        MENA: [
          'Disruption of the body\'s natural heat',
          'Test from the divine',
          'Consumption of improper foods'
        ]
      },
      EARLY_MODERN: {
        default: [
          'Foul airs and miasmatic vapors',
          'Contagion spread by corrupted matter',
          'Constitutional weakness',
          'Exposure to diseased persons'
        ]
      },
      INDUSTRIAL: {
        default: [
          'Bacterial infection from contaminated sources',
          'Poor sanitation and overcrowding',
          'Germs transmitted through contact',
          'Weakened constitution from poor living conditions'
        ]
      },
      MODERN: {
        default: [
          'Bacterial infection (Francisella tularensis)',
          'Zoonotic transmission from infected animals',
          'Vector-borne transmission via arthropods'
        ]
      }
    };
    
    const eraBeliefs = beliefs[era];
    const zoneBeliefs = eraBeliefs[zone] || eraBeliefs.default || ['Unknown causes'];
    return zoneBeliefs[Math.floor(Math.random() * zoneBeliefs.length)];
  }

  private convertSymptomsToHistorical(symptoms: any[], era: HistoricalEra): string[] {
    const historicalDescriptions: string[] = [];
    
    const symptomMap: Record<string, Record<HistoricalEra, string>> = {
      'Skin Ulcer': {
        PREHISTORIC: 'Evil sores appear on the skin',
        ANCIENT: 'Putrid wounds manifest',
        MEDIEVAL: 'Corrupt flesh emerges',
        EARLY_MODERN: 'Ulcerous sores develop',
        INDUSTRIAL: 'Skin lesions form',
        MODERN: 'Cutaneous ulceration at infection site'
      },
      'Swollen Glands': {
        PREHISTORIC: 'Painful lumps under the skin',
        ANCIENT: 'The body swells with bad humors',
        MEDIEVAL: 'Buboes appear in the neck and groin',
        EARLY_MODERN: 'Glandular swellings manifest',
        INDUSTRIAL: 'Lymphatic inflammation',
        MODERN: 'Lymphadenopathy'
      },
      'High Fever': {
        PREHISTORIC: 'The body burns with inner fire',
        ANCIENT: 'Hot disease overtakes the body',
        MEDIEVAL: 'Burning fever consumes you',
        EARLY_MODERN: 'Febrile heat rises',
        INDUSTRIAL: 'High temperature and chills',
        MODERN: 'Pyrexia (38.5°C+)'
      }
    };
    
    for (const symptom of symptoms) {
      const mapping = symptomMap[symptom.name];
      if (mapping && mapping[era]) {
        historicalDescriptions.push(mapping[era]);
      } else {
        // Fallback to generic historical description
        historicalDescriptions.push(this.genericHistoricalSymptom(symptom.name, era));
      }
    }
    
    return historicalDescriptions;
  }

  private genericHistoricalSymptom(symptomName: string, era: HistoricalEra): string {
    if (era === 'PREHISTORIC' || era === 'ANCIENT') {
      return `The body shows signs of ${symptomName.toLowerCase()}`;
    } else if (era === 'MEDIEVAL') {
      return `${symptomName} manifests as divine punishment`;
    } else {
      return symptomName;
    }
  }

  private getSocialResponse(severity: DiseaseSeverity, era: HistoricalEra, zone: CulturalZone): string {
    const responses: Record<HistoricalEra, Record<DiseaseSeverity, string[]>> = {
      PREHISTORIC: {
        mild: ['The tribe continues to accept you'],
        moderate: ['Some tribe members avoid you'],
        severe: ['You are isolated from the group'],
        critical: ['The shaman performs emergency rituals']
      },
      ANCIENT: {
        mild: ['Citizens give you wide berth'],
        moderate: ['You are barred from public spaces'],
        severe: ['Quarantine is enforced'],
        critical: ['Priests are summoned for last rites']
      },
      MEDIEVAL: {
        mild: ['Neighbors whisper about your condition'],
        moderate: ['The church offers prayers for your recovery'],
        severe: ['You are shunned as unclean'],
        critical: ['Last rites are administered']
      },
      EARLY_MODERN: {
        mild: ['Local physicians are consulted'],
        moderate: ['Quarantine measures are suggested'],
        severe: ['Authorities are notified'],
        critical: ['Preparations for death begin']
      },
      INDUSTRIAL: {
        mild: ['Work continues despite illness'],
        moderate: ['Medical leave is grudgingly granted'],
        severe: ['Hospital admission is required'],
        critical: ['Isolation ward placement']
      },
      MODERN: {
        mild: ['Outpatient treatment prescribed'],
        moderate: ['Antibiotic therapy initiated'],
        severe: ['Hospitalization required'],
        critical: ['ICU admission necessary']
      }
    };
    
    const eraResponses = responses[era];
    const severityResponses = eraResponses[severity];
    return severityResponses[Math.floor(Math.random() * severityResponses.length)];
  }

  private getEraSpecificUnderstandings(era: HistoricalEra, zone: CulturalZone): any {
    // Placeholder for era-specific medical understanding systems
    return {};
  }

  private getPrehistoricTreatments(disease: Disease, zone: CulturalZone): HistoricalTreatment[] {
    return [
      {
        method: 'Herbal Poultice',
        practitioner: 'Tribal Healer',
        effectiveness: 'placebo',
        description: 'Crushed herbs and mud applied to affected areas',
        ingredients: ['Wild herbs', 'Clay', 'Animal fat']
      },
      {
        method: 'Spirit Cleansing',
        practitioner: 'Shaman',
        effectiveness: 'ineffective',
        description: 'Ritual dancing and chanting to expel evil spirits',
        ingredients: ['Sacred smoke', 'Bone rattles']
      },
      {
        method: 'Bloodletting',
        practitioner: 'Elder',
        effectiveness: 'harmful',
        description: 'Cutting to release bad blood',
        ingredients: ['Sharp stone', 'Herbs for wound']
      }
    ];
  }

  private getAncientTreatments(disease: Disease, zone: CulturalZone): HistoricalTreatment[] {
    const treatments: HistoricalTreatment[] = [];
    
    switch (zone) {
      case 'EUROPEAN':
        treatments.push({
          method: 'Humoral Balancing',
          practitioner: 'Greek Physician',
          effectiveness: 'ineffective',
          description: 'Purging and bloodletting to restore balance',
          ingredients: ['Hellebore', 'Wine', 'Honey']
        });
        break;
      case 'MENA':
        treatments.push({
          method: 'Cooling Treatment',
          practitioner: 'Hakim',
          effectiveness: 'partially_effective',
          description: 'Cool compresses and dietary restrictions',
          ingredients: ['Rose water', 'Cucumber', 'Barley water']
        });
        break;
      case 'EAST_ASIAN':
        treatments.push({
          method: 'Acupuncture',
          practitioner: 'Traditional Healer',
          effectiveness: 'placebo',
          description: 'Needles placed to restore qi flow',
          ingredients: ['Bronze needles', 'Moxa', 'Herbal tea']
        });
        break;
      case 'SOUTH_ASIAN':
        treatments.push({
          method: 'Ayurvedic Treatment',
          practitioner: 'Vaidya',
          effectiveness: 'partially_effective',
          description: 'Herbal preparations to balance doshas',
          ingredients: ['Turmeric', 'Neem', 'Ghee', 'Sacred basil']
        });
        break;
      default:
        treatments.push({
          method: 'Temple Healing',
          practitioner: 'Priest',
          effectiveness: 'placebo',
          description: 'Prayer and temple sleep for divine cure',
          ingredients: ['Sacred water', 'Incense']
        });
    }
    
    return treatments;
  }

  private getMedievalTreatments(disease: Disease, zone: CulturalZone): HistoricalTreatment[] {
    return [
      {
        method: 'Bloodletting',
        practitioner: 'Barber-Surgeon',
        effectiveness: 'harmful',
        description: 'Leeches or lancets to remove corrupt blood',
        ingredients: ['Leeches', 'Lancet', 'Basin']
      },
      {
        method: 'Herbal Remedy',
        practitioner: 'Wise Woman',
        effectiveness: 'partially_effective',
        description: 'Willow bark tea and poultices',
        ingredients: ['Willow bark', 'Feverfew', 'Honey', 'Wine']
      },
      {
        method: 'Prayer and Pilgrimage',
        practitioner: 'Priest',
        effectiveness: 'placebo',
        description: 'Holy relics and blessed water',
        ingredients: ['Holy water', 'Blessed oil', 'Saints\' relics']
      },
      {
        method: 'Theriac',
        practitioner: 'Apothecary',
        effectiveness: 'ineffective',
        description: 'Complex mixture believed to cure all ailments',
        ingredients: ['Viper flesh', 'Opium', '60+ herbs', 'Honey']
      }
    ];
  }

  private getEarlyModernTreatments(disease: Disease, zone: CulturalZone): HistoricalTreatment[] {
    return [
      {
        method: 'Mercury Treatment',
        practitioner: 'Physician',
        effectiveness: 'harmful',
        description: 'Mercury compounds prescribed',
        ingredients: ['Mercury', 'Sulfur', 'Lead compounds']
      },
      {
        method: 'Cinchona Bark',
        practitioner: 'Apothecary',
        effectiveness: 'partially_effective',
        description: 'Peruvian bark for fevers',
        ingredients: ['Cinchona bark', 'Wine', 'Spices']
      },
      {
        method: 'Quarantine',
        practitioner: 'Health Officer',
        effectiveness: 'effective',
        description: 'Isolation to prevent spread',
        ingredients: []
      }
    ];
  }

  private getIndustrialTreatments(disease: Disease, zone: CulturalZone): HistoricalTreatment[] {
    return [
      {
        method: 'Carbolic Acid',
        practitioner: 'Hospital Doctor',
        effectiveness: 'partially_effective',
        description: 'Antiseptic treatment of wounds',
        ingredients: ['Carbolic acid', 'Bandages', 'Laudanum']
      },
      {
        method: 'Bed Rest',
        practitioner: 'Family Doctor',
        effectiveness: 'partially_effective',
        description: 'Complete rest and nutritious diet',
        ingredients: ['Beef tea', 'Fresh air', 'Clean linens']
      },
      {
        method: 'Patent Medicine',
        practitioner: 'Traveling Salesman',
        effectiveness: 'ineffective',
        description: 'Miracle cure-all tonic',
        ingredients: ['Alcohol', 'Cocaine', 'Herbs', 'Sugar']
      }
    ];
  }

  private getModernTreatments(disease: Disease, zone: CulturalZone): HistoricalTreatment[] {
    return [
      {
        method: 'Antibiotic Therapy',
        practitioner: 'Medical Doctor',
        effectiveness: 'effective',
        description: 'Streptomycin or doxycycline treatment',
        ingredients: ['Streptomycin', 'Doxycycline', 'Saline IV']
      },
      {
        method: 'Supportive Care',
        practitioner: 'Nurse',
        effectiveness: 'effective',
        description: 'Fluid management and monitoring',
        ingredients: ['IV fluids', 'Electrolytes', 'Oxygen']
      }
    ];
  }

  /**
   * Generate a historically appropriate quote about the disease
   */
  generateHistoricalQuote(context: HistoricalMedicalContext): string {
    const { era, zone, disease, year } = context;
    
    const quotes: Record<HistoricalEra, string[]> = {
      PREHISTORIC: [
        'The spirits speak of great suffering ahead',
        'The tribal elder shakes his head gravely',
        'Evil has entered your body through the wound'
      ],
      ANCIENT: [
        'The physician examines you: "The humors are gravely disturbed"',
        'The temple priest warns: "The gods are displeased"',
        '"This affliction comes from touching unclean beasts"'
      ],
      MEDIEVAL: [
        'The barber-surgeon declares: "Bad blood must be let"',
        'The monk whispers: "Pray for divine mercy"',
        '"This pestilence spreads through corrupt air"'
      ],
      EARLY_MODERN: [
        'The doctor notes: "A contagion most foul"',
        'The apothecary suggests: "Mercury may purge this evil"',
        '"Quarantine is the only sure prevention"'
      ],
      INDUSTRIAL: [
        'The physician states: "Complete bed rest is essential"',
        'The nurse warns: "This disease spreads rapidly in crowds"',
        '"Modern medicine offers some hope"'
      ],
      MODERN: [
        'The doctor explains: "Antibiotics should clear this infection"',
        'The CDC guidelines recommend immediate treatment',
        '"With proper care, recovery is expected"'
      ]
    };
    
    const eraQuotes = quotes[era];
    return eraQuotes[Math.floor(Math.random() * eraQuotes.length)];
  }
}

export const historicalMedicineService = new HistoricalMedicineService();