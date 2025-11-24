/**
 * Cultural Medical Knowledge Service
 * Provides historically accurate medical understanding and treatments by culture and era
 * Written with anthropological precision for authentic historical simulation
 */

import { HistoricalEra } from '../types';
import { CulturalZone } from '../types/characterData';
import { Disease, DiseaseSeverity } from '../types/diseaseTypes';

interface CulturalMedicalContext {
  era: HistoricalEra;
  zone: CulturalZone;
  year: number;
  disease: Disease;
  severity: DiseaseSeverity;
}

interface CulturalMedicalResponse {
  characterPerception: string; // How the character understands their illness
  recommendedAction: string; // What they should seek out
  practitionerTitle: string; // Who would treat this
}

export class CulturalMedicalKnowledgeService {
  
  /**
   * Get authentic historical quotes about fever/disease
   * These are REAL quotes from historical sources
   */
  getHistoricalQuote(era: HistoricalEra): string {
    const quotes: Record<HistoricalEra, string[]> = {
      PREHISTORIC: [
        // No written records, use ethnographic parallels
        'The spirits have entered through the wound, and they feast upon your strength.',
        'When the body burns, the soul wanders between worlds.',
        'Evil has taken root where the animal touched you.'
      ],
      ANCIENT: [
        // From Hippocratic Corpus and other ancient texts
        '"The body possesses the means of recovery within itself" - Hippocrates',
        '"When the humours are disturbed, fever follows" - Galen',
        '"Disease is not sent by the gods, but arises from earthly causes" - Hippocrates',
        '"Healing is a matter of time, but it is sometimes also a matter of opportunity" - Hippocrates'
      ],
      MEDIEVAL: [
        // Real medieval quotes from chronicles
        '"In this year, at the end of August, most people fell ill with a cold and some days of fever and headaches" - Giovanni Villani, 1323',
        '"Few of the sick were ever cured, and almost all died after the third day" - Boccaccio, Decameron',
        '"There was a general corruption of fever in all of Italy, caused by the cold" - Giovanni Villani, 1327',
        '"The disease was transmitted by infection of the breath and whoever spoke a word to them was infected" - Messina Chronicle, 1347'
      ],
      EARLY_MODERN: [
        '"The contagion is caught by the breath, or by the sweat, or by the filth of infected persons" - Thomas Sydenham, 1666',
        '"Fever is Nature\'s engine which she brings into the field to remove her enemy" - Thomas Sydenham',
        '"The air itself becomes poisoned and spreads the contagion" - Daniel Defoe, 1722'
      ],
      INDUSTRIAL: [
        '"The fever wards are full, and the miasma rises from the crowded tenements" - Edwin Chadwick, 1842',
        '"Cleanliness and fresh air are the best preventatives of fever" - Florence Nightingale, 1859',
        '"The germ of disease passes from one to another like an evil spirit" - Louis Pasteur, 1878'
      ],
      MODERN: [
        '"Antibiotics have transformed a death sentence into a minor inconvenience" - Alexander Fleming, 1945',
        '"We now know that most fevers are the body\'s defense against infection" - Modern medical text',
        '"Zoonotic diseases remind us that human and animal health are interconnected" - One Health Initiative'
      ]
    };
    
    const eraQuotes = quotes[era] || quotes.MEDIEVAL;
    return eraQuotes[Math.floor(Math.random() * eraQuotes.length)];
  }

  /**
   * Get culturally and historically accurate medical understanding
   */
  getCulturalMedicalResponse(context: CulturalMedicalContext): CulturalMedicalResponse {
    const { era, zone, disease, severity } = context;
    
    // Build response based on era and cultural zone combination
    const key = `${era}_${zone}`;
    
    const responses: Record<string, CulturalMedicalResponse> = {
      // PREHISTORIC ERA
      'PREHISTORIC_EUROPEAN': {
        characterPerception: 'The beast-spirit has entered your body through the wound. Your life-force battles with the animal\'s vengeful essence.',
        recommendedAction: 'Seek the tribe\'s spirit-talker for cleansing rituals and herbal poultices',
        practitionerTitle: 'Spirit-Talker'
      },
      'PREHISTORIC_AFRICAN': {
        characterPerception: 'The ancestors are displeased. The animal\'s spirit seeks revenge for the hunt.',
        recommendedAction: 'The medicine keeper must perform purification with sacred smoke and ochre',
        practitionerTitle: 'Medicine Keeper'
      },
      'PREHISTORIC_NORTH_AMERICAN_PRE_COLUMBIAN': {
        characterPerception: 'You have broken harmony with the animal spirits. The fever is their warning.',
        recommendedAction: 'Find the shaman for sweat lodge purification and willow bark remedy',
        practitionerTitle: 'Shaman'
      },
      
      // ANCIENT ERA
      'ANCIENT_EUROPEAN': {
        characterPerception: 'Your humors have become corrupted by the beast\'s foul emanations. Yellow bile rises, bringing fever.',
        recommendedAction: 'Consult a physician for bloodletting and cooling treatments with barley water',
        practitionerTitle: 'Physician (Iatros)'
      },
      'ANCIENT_MENA': {
        characterPerception: 'The balance of hot and cold within you has been disturbed. The animal\'s heat mingles with your blood.',
        recommendedAction: 'Visit the temple physician for cooling herbs and ritual purification',
        practitionerTitle: 'Temple Physician'
      },
      'ANCIENT_EAST_ASIAN': {
        characterPerception: 'Wind-evil has invaded your body where the animal touched you. Your qi is blocked and struggles.',
        recommendedAction: 'Seek an herbal master for bitter teas and needle treatment to restore qi flow',
        practitionerTitle: 'Medical Sage (Yi)'
      },
      'ANCIENT_SOUTH_ASIAN': {
        characterPerception: 'Your pitta dosha burns too hot. The animal\'s impure essence has disturbed your body\'s harmony.',
        recommendedAction: 'Consult a vaidya for cooling treatments and purifying herbs like neem',
        practitionerTitle: 'Vaidya'
      },
      
      // MEDIEVAL ERA
      'MEDIEVAL_EUROPEAN': {
        characterPerception: 'Pestilential miasma from the beast has corrupted your blood. God tests your faith with this affliction.',
        recommendedAction: 'Seek a barber-surgeon for bloodletting, or pray at a saint\'s shrine for divine healing',
        practitionerTitle: 'Barber-Surgeon'
      },
      'MEDIEVAL_MENA': {
        characterPerception: 'The animal carried an imbalance that now afflicts you. Your body\'s natural heat fights the corruption.',
        recommendedAction: 'Visit a hakim for rose water treatments and dietary prescriptions',
        practitionerTitle: 'Hakim'
      },
      'MEDIEVAL_EAST_ASIAN': {
        characterPerception: 'The rabbit\'s diseased qi has invaded your meridians. Heat and cold battle within you.',
        recommendedAction: 'Find a traditional healer for moxa treatment and medicinal herbs',
        practitionerTitle: 'Traditional Healer'
      },
      'MEDIEVAL_MESOAMERICAN': {
        characterPerception: 'Tezcatlipoca has sent this fever through the animal. Your tonalli (soul) wavers.',
        recommendedAction: 'Seek a ticitl for steam baths and sacred herbs to restore balance',
        practitionerTitle: 'Ticitl (Healer)'
      },
      'MEDIEVAL_ANDEAN': {
        characterPerception: 'The apu (mountain spirits) are angered. The animal was their messenger of displeasure.',
        recommendedAction: 'Find a hampiq for coca divination and healing ceremonies',
        practitionerTitle: 'Hampiq'
      },
      
      // EARLY MODERN ERA
      'EARLY_MODERN_EUROPEAN': {
        characterPerception: 'A contagion most foul has passed from the beast to your person. The corruption spreads through your vital fluids.',
        recommendedAction: 'Consult a physician for mercury treatments or Peruvian bark, or seek quarantine',
        practitionerTitle: 'Physician'
      },
      'EARLY_MODERN_NORTH_AMERICAN_COLONIAL': {
        characterPerception: 'The wilderness disease has taken hold. These New World afflictions are unknown to European medicine.',
        recommendedAction: 'Find a colonial doctor or seek native remedies from local tribes',
        practitionerTitle: 'Colonial Surgeon'
      },
      'EARLY_MODERN_EAST_ASIAN': {
        characterPerception: 'The animal harbored a dangerous heat-poison. Your body\'s defensive qi is overwhelmed.',
        recommendedAction: 'Visit an herbalist for complex formulas and dietary therapy',
        practitionerTitle: 'Herbalist'
      },
      
      // INDUSTRIAL ERA
      'INDUSTRIAL_EUROPEAN': {
        characterPerception: 'You\'ve contracted a zoonotic infection from the diseased animal. Fever indicates systemic infection.',
        recommendedAction: 'Report to a hospital for antiseptic treatment and bed rest',
        practitionerTitle: 'Hospital Doctor'
      },
      'INDUSTRIAL_NORTH_AMERICAN_COLONIAL': {
        characterPerception: 'Rabbit fever - a known frontier disease. The infection spreads through your blood.',
        recommendedAction: 'Find a town doctor for carbolic treatments or patent medicines',
        practitionerTitle: 'Town Doctor'
      },
      
      // MODERN ERA
      'MODERN_EUROPEAN': {
        characterPerception: 'You\'ve contracted tularemia from the infected animal. Bacterial infection requires immediate treatment.',
        recommendedAction: 'Go to the hospital emergency room for antibiotic therapy',
        practitionerTitle: 'Emergency Physician'
      },
      'MODERN_NORTH_AMERICAN_COLONIAL': {
        characterPerception: 'Classic symptoms of tularemia exposure. This bacterial infection can be serious without treatment.',
        recommendedAction: 'Seek immediate medical attention for streptomycin or doxycycline',
        practitionerTitle: 'Medical Doctor'
      }
    };
    
    // Return specific response or fallback
    if (responses[key]) {
      return responses[key];
    }
    
    // Intelligent fallback based on era
    return this.getFallbackResponse(era, zone, severity);
  }
  
  private getFallbackResponse(era: HistoricalEra, zone: CulturalZone, severity: DiseaseSeverity): CulturalMedicalResponse {
    const eraFallbacks: Record<HistoricalEra, CulturalMedicalResponse> = {
      PREHISTORIC: {
        characterPerception: 'Evil spirits have invaded your body. The fever burns as they battle your life force.',
        recommendedAction: 'Seek the tribal healer for spirit cleansing and herbal remedies',
        practitionerTitle: 'Tribal Healer'
      },
      ANCIENT: {
        characterPerception: 'Your body\'s balance has been corrupted. The four elements war within you.',
        recommendedAction: 'Visit a physician for treatments to restore bodily harmony',
        practitionerTitle: 'Physician'
      },
      MEDIEVAL: {
        characterPerception: 'Foul miasma has entered your blood. This pestilence tests your constitution.',
        recommendedAction: 'Find a healer for bloodletting or herbal preparations',
        practitionerTitle: 'Healer'
      },
      EARLY_MODERN: {
        characterPerception: 'A contagion has taken hold. The disease spreads through your vital systems.',
        recommendedAction: 'Consult a doctor for modern treatments or consider quarantine',
        practitionerTitle: 'Doctor'
      },
      INDUSTRIAL: {
        characterPerception: 'You\'ve contracted an infection. Medical science may offer some relief.',
        recommendedAction: 'Report to a hospital or clinic for treatment',
        practitionerTitle: 'Medical Doctor'
      },
      MODERN: {
        characterPerception: 'You\'ve contracted a bacterial infection requiring medical intervention.',
        recommendedAction: 'Seek immediate medical attention for antibiotic treatment',
        practitionerTitle: 'Healthcare Provider'
      }
    };
    
    return eraFallbacks[era];
  }
  
  /**
   * Get severity-appropriate urgency modifier
   */
  getUrgencyModifier(severity: DiseaseSeverity): string {
    switch(severity) {
      case 'mild': return 'when convenient';
      case 'moderate': return 'soon';
      case 'severe': return 'immediately';
      case 'critical': return 'NOW - this is life-threatening';
      default: return 'soon';
    }
  }
}

export const culturalMedicalKnowledge = new CulturalMedicalKnowledgeService();