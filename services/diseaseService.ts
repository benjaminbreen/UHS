/**
 * services/diseaseService.ts - Core disease system logic and mechanics
 */

import { 
  Disease, 
  ActiveDisease, 
  CharacterHealth, 
  DiseaseTransmissionContext,
  DiseaseSpreadParameters,
  ExposureEvent,
  Immunity,
  OverallHealthStatus,
  DiseaseStage,
  DiseaseProgressionStage
} from '../types/diseaseTypes';
import { NpcEntity } from '../types/npcTypes';
import { AnimalEntity } from '../types/animalTypes';
import { GameDate, PlayerCharacter } from '../types/index';
import { HistoricalEra } from '../types/ambiance';
import { CulturalZone } from '../types/characterData';
// Lazy load disease data to improve startup performance
let diseaseModule: any = null;
let diseaseModulePromise: Promise<any> | null = null;

const ensureDiseaseModule = async (): Promise<any> => {
  if (diseaseModule) {
    return diseaseModule;
  }

  // If module hasn't been loaded yet and no promise exists, start loading
  if (!diseaseModulePromise) {
    diseaseModulePromise = import('../constants/gameData/diseases').then(module => {
      diseaseModule = module;
      console.log('[DiseaseService] Disease module loaded successfully with', module?.DISEASE_DATABASE?.diseases?.length, 'diseases');
      diseaseModulePromise = null; // Clear promise after loading
      return module;
    }).catch(error => {
      console.error('[DiseaseService] Failed to load disease module:', error);
      diseaseModulePromise = null;
      return null;
    });
  }

  // Wait for the module to load
  return await diseaseModulePromise;
};

// Synchronous version for backwards compatibility - tries to use cached module
const ensureDiseaseModuleSync = () => {
  if (!diseaseModule) {
    console.warn('[DiseaseService] Disease module not yet loaded, starting async load...');
    ensureDiseaseModule(); // Start loading but don't wait
  }
  return diseaseModule;
};

type CharacterEntity = PlayerCharacter | NpcEntity | AnimalEntity;

class DiseaseService {
  private static instance: DiseaseService;
  private diseaseCache: Map<string, Disease> = new Map();
  private proximityCheckRadius = 1.0; // tiles
  private initialized = false;

  constructor() {
    // Don't initialize disease cache in constructor to avoid circular dependency issues
    // Cache will be initialized lazily on first access
    // Start preloading the disease module
    this.preloadDiseaseModule();
  }

  public static getInstance(): DiseaseService {
    if (!DiseaseService.instance) {
      DiseaseService.instance = new DiseaseService();
    }
    return DiseaseService.instance;
  }

  /**
   * Preload disease module - call this early in app initialization
   */
  public async preloadDiseaseModule(): Promise<void> {
    if (this.initialized) return;
    console.log('[DiseaseService] Preloading disease module...');
    await ensureDiseaseModule();
    this.initialized = true;
    console.log('[DiseaseService] Disease module preloaded');
  }

  private initializeDiseaseCache(): void {
    if (this.diseaseCache.size > 0) return; // Already initialized

    const module = ensureDiseaseModule();
    if (module) {
      (module?.DISEASE_DATABASE?.diseases || []).forEach(disease => {
        this.diseaseCache.set(disease.id, disease);
      });
    }
  }

  /**
   * Assign diseases to NPCs and animals on spawn based on historical context
   */
  public assignDiseasesToEntity(
    entity: NpcEntity | AnimalEntity,
    era: HistoricalEra,
    region: CulturalZone,
    currentYear: number
  ): CharacterHealth {
    const availableDiseases = this.getAvailableDiseasesForContext(era, region, currentYear);
    
    const currentDiseases: ActiveDisease[] = [];
    const immunities: Immunity[] = [];

    // Check if this is an animal (has speciesName property)
    const isAnimal = 'speciesName' in entity;
    
    // Animals have higher disease chance (50%), humans have 33%
    const diseaseChance = isAnimal ? 0.5 : 0.33;
    const hasDisease = Math.random() < diseaseChance;
    
    if (hasDisease && availableDiseases.length > 0) {
      let disease: Disease;
      
      if (isAnimal) {
        // For animals, prioritize animal diseases (80% chance)
        const animalDiseases = availableDiseases.filter(d => 
          (d as any).isAnimalDisease === true || 
          d.type === 'zoonotic' || 
          d.id === 'RABIES' || 
          d.id === 'ANTHRAX' ||
          d.id === 'GLANDERS' ||
          d.id === 'BRUCELLOSIS' ||
          d.id === 'TULAREMIA'
        );
        
        if (animalDiseases.length > 0 && Math.random() < 0.8) {
          disease = animalDiseases[Math.floor(Math.random() * animalDiseases.length)];
        } else {
          // 20% chance of regular disease
          disease = availableDiseases[Math.floor(Math.random() * availableDiseases.length)];
        }
      } else {
        // For humans: Check for epidemic diseases first
        const epidemicDisease = this.getEpidemicDisease(availableDiseases, era, region, currentYear);
        
        if (epidemicDisease) {
          // During epidemics, 80% chance of epidemic disease
          disease = Math.random() < 0.8 ? epidemicDisease : 
                    availableDiseases[Math.floor(Math.random() * availableDiseases.length)];
        } else {
          // Normal times: common cold is most likely (50%), other diseases share remaining 50%
          const commonCold = availableDiseases.find(d => d.id === 'COMMON_COLD');
          disease = commonCold && Math.random() < 0.5 ? commonCold : 
                    availableDiseases[Math.floor(Math.random() * availableDiseases.length)];
        }
      }
      
      const activeDisease = this.createActiveDisease(disease, currentYear);
      currentDiseases.push(activeDisease);
      
      const entityType = isAnimal ? 'Animal' : 'NPC';
      console.log(`[DiseaseService] ${entityType} spawned with ${disease.name} in year ${currentYear}`);
    }

    // Chance for immunity from previous exposure
    for (const disease of availableDiseases) {
      if (disease.grantsImmunity && Math.random() < 0.1) {
        immunities.push(this.createImmunity(disease.id, currentYear));
      }
    }

    const health: CharacterHealth = {
      currentDiseases,
      immunities,
      exposureHistory: [],
      overallHealthStatus: this.calculateOverallHealthStatus(currentDiseases),
      lastHealthUpdate: this.createGameDate(currentYear)
    };

    return health;
  }

  /**
   * Check if a specific disease is available in a given era/region/year
   */
  private isDiseaseAvailable(
    disease: Disease,
    era: HistoricalEra,
    region: CulturalZone,
    currentYear: number
  ): boolean {
    const legacyEraName = this.mapEraToLegacyName(era);

    // Check era availability
    if (!disease.availableEras.includes(legacyEraName as any)) return false;

    // Check region availability
    if (!disease.availableRegions.includes(region)) return false;

    // Check year constraints
    if (disease.startYear && currentYear < disease.startYear) return false;
    if (disease.endYear && currentYear > disease.endYear) return false;

    // Apply Columbian Exchange restrictions
    if (!diseaseModule) return false;
    const restrictions = diseaseModule.COLUMBIAN_EXCHANGE_RESTRICTIONS || {
      exchangeYear: 1492,
      preContactNewWorld: [],
      preContactOldWorld: []
    };

    if (currentYear < restrictions.exchangeYear) {
      const isNewWorld = ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN'].includes(region);
      const isOldWorld = !isNewWorld;

      if (isNewWorld && restrictions.preContactNewWorld.includes(disease.id)) {
        return false;
      }
      if (isOldWorld && restrictions.preContactOldWorld.includes(disease.id)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Assign a specific disease to an entity (used by WorldWeaver)
   */
  public assignSpecificDisease(
    entity: NpcEntity | AnimalEntity | any,
    diseaseId: string,
    era: HistoricalEra,
    region: CulturalZone,
    currentYear: number
  ): CharacterHealth | undefined {
    // Check if module is loaded - if not, it means preload wasn't called
    if (!diseaseModule) {
      console.error(`[DiseaseService] Cannot assign disease - module not loaded. Call preloadDiseaseModule() first.`);
      return undefined;
    }

    // Find the disease by ID
    const disease = (diseaseModule.DISEASE_DATABASE?.diseases || []).find(d => d.id === diseaseId);

    if (!disease) {
      console.error(`[DiseaseService] Disease ${diseaseId} not found in database`);
      return undefined;
    }

    // Check if disease is available in this era/region
    const isAvailable = this.isDiseaseAvailable(disease, era, region, currentYear);

    if (!isAvailable) {
      console.warn(`[DiseaseService] Disease ${diseaseId} not available in ${era} ${region} ${currentYear}`);
      console.warn(`[DiseaseService] Assigning anyway as specifically requested by WorldWeaver`);
    }

    const activeDisease = this.createActiveDisease(disease, currentYear);

    const health: CharacterHealth = {
      currentDiseases: [activeDisease],
      immunities: [],
      exposureHistory: [],
      overallHealthStatus: this.calculateOverallHealthStatus([activeDisease]),
      lastHealthUpdate: this.createGameDate(currentYear)
    };

    console.log(`[DiseaseService] Assigned ${disease.name} to entity via WorldWeaver request`);
    return health;
  }

  /**
   * Check for disease transmission when entities are in proximity
   */
  public checkProximityTransmission(
    sourceEntity: NpcEntity | AnimalEntity,
    targetEntity: PlayerCharacter | NpcEntity | AnimalEntity,
    distance: number,
    currentYear: number
  ): {
    transmitted: boolean;
    exposures: ExposureEvent[];
    narrativeHints: string[];
  } {
    const exposures: ExposureEvent[] = [];
    const narrativeHints: string[] = [];
    let transmitted = false;

    if (distance > this.proximityCheckRadius || !sourceEntity.health?.currentDiseases) {
      return { transmitted: false, exposures: [], narrativeHints: [] };
    }

    for (const activeDisease of sourceEntity.health.currentDiseases) {
      if (activeDisease.stage !== 'symptomatic') continue;

      const disease = this.diseaseCache.get(activeDisease.disease.id);
      if (!disease) continue;

      // Generate narrative hint for proximity
      if (activeDisease.stage === 'symptomatic') {
        const hint = this.generateProximityNarrativeHint(sourceEntity, disease);
        if (hint) narrativeHints.push(hint);
      }

      // Check transmission
      const exposureEvent = this.createExposureEvent(
        disease.id,
        currentYear,
        sourceEntity.id,
        distance <= 0.5 ? 'close' : 'nearby',
        disease.transmissionVector
      );

      exposures.push(exposureEvent);

      const transmissionResult = this.attemptTransmission(
        sourceEntity,
        targetEntity,
        disease,
        'proximity',
        exposureEvent.exposureStrength,
        currentYear
      );

      if (transmissionResult.transmitted) {
        transmitted = true;
        // Player character uses diseaseHealth, NPCs use health
        const healthField = 'diseaseHealth' in targetEntity ? 'diseaseHealth' : 'health';
        const healthData = (targetEntity as any)[healthField];
        
        if (healthData) {
          healthData.currentDiseases.push(transmissionResult.newDisease!);
          healthData.exposureHistory.push(exposureEvent);
          healthData.overallHealthStatus = this.calculateOverallHealthStatus(
            healthData.currentDiseases
          );
        }
      }
    }

    return { transmitted, exposures, narrativeHints };
  }

  /**
   * Check for disease transmission during direct contact (encounters)
   */
  public checkDirectContactTransmission(
    sourceEntity: NpcEntity | AnimalEntity,
    targetEntity: PlayerCharacter | NpcEntity | AnimalEntity,
    currentYear: number
  ): {
    transmitted: boolean;
    exposures: ExposureEvent[];
    symptomDescriptions: string[];
  } {
    const exposures: ExposureEvent[] = [];
    const symptomDescriptions: string[] = [];
    let transmitted = false;

    // Check both health and diseaseHealth fields (NPCs use health, animals use diseaseHealth)
    const healthData = sourceEntity.health || (sourceEntity as any).diseaseHealth;
    if (!healthData?.currentDiseases) {
      return { transmitted: false, exposures: [], symptomDescriptions: [] };
    }

    for (const activeDisease of healthData.currentDiseases) {
      const disease = this.diseaseCache.get(activeDisease.disease.id);
      if (!disease) continue;

      // Add visible symptoms to encounter
      if (activeDisease.stage === 'symptomatic') {
        const symptoms = this.generateVisibleSymptomDescription(sourceEntity, disease);
        symptomDescriptions.push(...symptoms);
      }

      // Check transmission with higher rate for direct contact
      const exposureEvent = this.createExposureEvent(
        disease.id,
        currentYear,
        sourceEntity.id,
        'direct_contact',
        disease.transmissionVector
      );

      exposures.push(exposureEvent);

      const transmissionResult = this.attemptTransmission(
        sourceEntity,
        targetEntity,
        disease,
        'direct_contact',
        exposureEvent.exposureStrength,
        currentYear
      );

      if (transmissionResult.transmitted) {
        transmitted = true;
        // Player character uses diseaseHealth, NPCs use health
        const healthField = 'diseaseHealth' in targetEntity ? 'diseaseHealth' : 'health';
        const healthData = (targetEntity as any)[healthField];
        
        if (healthData) {
          healthData.currentDiseases.push(transmissionResult.newDisease!);
          healthData.exposureHistory.push(exposureEvent);
          healthData.overallHealthStatus = this.calculateOverallHealthStatus(
            healthData.currentDiseases
          );
        }
      }
    }

    return { transmitted, exposures, symptomDescriptions };
  }

  /**
   * Check for terrain-based disease transmission
   */
  public checkTerrainTransmission(
    terrain: string,
    playerCharacter: PlayerCharacter,
    currentYear: number
  ): {
    transmitted: boolean;
    disease?: Disease;
    message?: string;
  } {
    let transmissionChance = 0;
    let diseaseId = '';
    let message = '';

    // Wetlands - Malaria (25% chance)
    if (terrain === 'wetlands' || terrain === 'swamp' || terrain === 'marsh') {
      transmissionChance = 0.25;
      diseaseId = 'malaria';
      message = 'The humid, mosquito-infested wetlands have given you malaria!';
    }
    // Urban areas - Smallpox or Plague (10% chance)
    else if (terrain === 'city' || terrain === 'urban' || terrain === 'city_center') {
      transmissionChance = 0.1;
      // 50/50 chance of smallpox or plague
      diseaseId = Math.random() < 0.5 ? 'smallpox' : 'plague';
      message = `The crowded, unsanitary city conditions have given you ${diseaseId}!`;
    }

    if (transmissionChance > 0 && Math.random() < transmissionChance) {
      // Check if already has this disease
      if (playerCharacter.health?.currentDiseases?.some(d => d.disease.id === diseaseId)) {
        return { transmitted: false };
      }

      const disease = this.diseaseCache.get(diseaseId);
      if (!disease) {
        // Create the disease if it doesn't exist
        const newDisease = this.createDiseaseForTerrain(diseaseId, currentYear);
        this.diseaseCache.set(diseaseId, newDisease);
        
        if (playerCharacter.health) {
          const activeDisease = this.createActiveDisease(newDisease, currentYear);
          playerCharacter.health.currentDiseases = playerCharacter.health.currentDiseases || [];
          playerCharacter.health.currentDiseases.push(activeDisease);
          playerCharacter.health.overallHealthStatus = this.calculateOverallHealthStatus(
            playerCharacter.health.currentDiseases
          );
        }
        
        return { transmitted: true, disease: newDisease, message };
      }

      if (playerCharacter.health) {
        const activeDisease = this.createActiveDisease(disease, currentYear);
        playerCharacter.health.currentDiseases = playerCharacter.health.currentDiseases || [];
        playerCharacter.health.currentDiseases.push(activeDisease);
        playerCharacter.health.overallHealthStatus = this.calculateOverallHealthStatus(
          playerCharacter.health.currentDiseases
        );
      }

      return { transmitted: true, disease, message };
    }

    return { transmitted: false };
  }

  private createDiseaseForTerrain(diseaseId: string, currentYear: number): Disease {
    const diseaseTemplates: Record<string, Disease> = {
      malaria: {
        id: 'malaria',
        name: 'Malaria',
        type: 'parasitic',
        severity: 0.7,
        baseTransmissionRate: 0.3,
        proximityMultiplier: 0.1,
        directContactMultiplier: 0.5,
        transmissionVector: 'vector',
        symptoms: ['fever', 'chills', 'fatigue', 'sweating'],
        complications: ['organ_failure', 'cerebral_malaria'],
        mortalityRate: 0.15,
        baseDuration: 14,
        badgeIcon: '🦟',
        historicalPrevalence: { ancient: 0.4, medieval: 0.4, earlyModern: 0.3, industrial: 0.2, modern: 0.1 }
      },
      smallpox: {
        id: 'smallpox',
        name: 'Smallpox',
        type: 'viral',
        severity: 0.9,
        baseTransmissionRate: 0.8,
        proximityMultiplier: 0.6,
        directContactMultiplier: 0.9,
        transmissionVector: 'airborne',
        symptoms: ['fever', 'rash', 'pustules', 'scarring'],
        complications: ['blindness', 'encephalitis'],
        mortalityRate: 0.3,
        baseDuration: 21,
        badgeIcon: '🦠',
        historicalPrevalence: { ancient: 0.3, medieval: 0.4, earlyModern: 0.5, industrial: 0.3, modern: 0 }
      },
      plague: {
        id: 'plague',
        name: 'Bubonic Plague',
        type: 'bacterial',
        severity: 0.95,
        baseTransmissionRate: 0.6,
        proximityMultiplier: 0.4,
        directContactMultiplier: 0.7,
        transmissionVector: 'vector',
        symptoms: ['fever', 'buboes', 'chills', 'weakness'],
        complications: ['sepsis', 'pneumonic_plague'],
        mortalityRate: 0.5,
        baseDuration: 7,
        badgeIcon: '☠️',
        historicalPrevalence: { ancient: 0.2, medieval: 0.6, earlyModern: 0.3, industrial: 0.1, modern: 0.01 }
      }
    };

    return diseaseTemplates[diseaseId] || diseaseTemplates.plague;
  }

  /**
   * Update disease progression for all entities (call daily)
   */
  public updateDiseaseProgression(
    entity: PlayerCharacter | NpcEntity | AnimalEntity,
    currentYear: number
  ): {
    progressionEvents: string[];
    recoveryEvents: string[];
    mortalityRisk: boolean;
    isDead: boolean;
  } {
    const progressionEvents: string[] = [];
    const recoveryEvents: string[] = [];
    let mortalityRisk = false;
    let isDead = false;

    if (!entity.health?.currentDiseases) {
      return { progressionEvents, recoveryEvents, mortalityRisk, isDead };
    }

    const updatedDiseases: ActiveDisease[] = [];

    for (const activeDisease of entity.health.currentDiseases) {
      const disease = this.diseaseCache.get(activeDisease.disease.id);
      if (!disease) continue;

      // Progress disease stages
      activeDisease.daysRemaining--;

      // Stage transitions
      if (activeDisease.stage === 'incubating' && 
          activeDisease.daysRemaining <= disease.durationDays - disease.incubationDays) {
        activeDisease.stage = 'symptomatic';
        progressionEvents.push(this.generateProgressionEvent(entity, disease, 'symptomatic'));
        this.applyDiseaseEffects(entity, disease);
      }

      // Recovery check
      if (activeDisease.daysRemaining <= 0) {
        const recoveryChance = this.calculateRecoveryChance(entity, activeDisease);
        
        if (Math.random() < recoveryChance) {
          // Recovered
          this.removeDiseaseEffects(entity, disease);
          recoveryEvents.push(this.generateRecoveryEvent(entity, disease));
          
          // Grant immunity if applicable
          if (disease.grantsImmunity && entity.health) {
            entity.health.immunities.push(this.createImmunity(disease.id, currentYear));
          }
        } else {
          // Disease continues
          activeDisease.daysRemaining = Math.ceil(disease.durationDays / 2);
          activeDisease.severity = Math.min(1, activeDisease.severity + 0.1);
          updatedDiseases.push(activeDisease);
        }
      } else {
        updatedDiseases.push(activeDisease);
      }

      // Mortality check for severe diseases
      if (activeDisease.severity > 0.8 && disease.mortalityRate > 0) {
        const mortalityChance = this.calculateMortalityChance(entity, activeDisease);
        if (Math.random() < mortalityChance) {
          mortalityRisk = true;
          isDead = true;
        }
      }
    }

    entity.health.currentDiseases = updatedDiseases;
    entity.health.overallHealthStatus = this.calculateOverallHealthStatus(updatedDiseases);
    entity.health.lastHealthUpdate = this.createGameDate(currentYear);

    return { progressionEvents, recoveryEvents, mortalityRisk, isDead };
  }

  /**
   * Apply treatment to a character's disease
   */
  public applyTreatment(
    entity: PlayerCharacter | NpcEntity | AnimalEntity,
    diseaseId: string,
    medicineId: string,
    currentYear: number
  ): {
    success: boolean;
    message: string;
    newSeverity?: number;
  } {
    if (!entity.health?.currentDiseases) {
      return { success: false, message: 'No diseases to treat' };
    }

    const activeDisease = entity.health.currentDiseases.find(d => d.disease.id === diseaseId);
    if (!activeDisease) {
      return { success: false, message: 'Disease not found' };
    }

    ensureDiseaseModule();
    const medicine = (diseaseModule?.DISEASE_DATABASE?.medicines || []).find(m => m.id === medicineId);
    if (!medicine) {
      return { success: false, message: 'Medicine not found' };
    }

    // Check if medicine is effective against this disease type
    const effectiveness = medicine.effectiveness[activeDisease.disease.type as keyof typeof medicine.effectiveness] || 0;
    
    if (effectiveness === 0) {
      return { success: false, message: `${medicine.name} is not effective against ${activeDisease.disease.type} diseases` };
    }

    // Apply treatment effects
    const severityReduction = effectiveness * 0.5; // Reduce severity by up to 50% of effectiveness
    const durationReduction = Math.floor(activeDisease.disease.durationDays * effectiveness * 0.3); // Reduce duration

    activeDisease.severity = Math.max(0.1, activeDisease.severity - severityReduction);
    activeDisease.daysRemaining = Math.max(1, activeDisease.daysRemaining - durationReduction);

    // Apply side effects if any
    if (medicine.sideEffects && 'stats' in entity && entity.stats) {
      Object.entries(medicine.sideEffects).forEach(([stat, value]) => {
        if (entity.stats && stat in entity.stats) {
          (entity.stats as any)[stat] = Math.max(1, (entity.stats as any)[stat] + value);
        }
      });
    }

    // Update overall health status
    entity.health.overallHealthStatus = this.calculateOverallHealthStatus(entity.health.currentDiseases);

    return {
      success: true,
      message: `Applied ${medicine.name}. ${activeDisease.disease.name} severity reduced.`,
      newSeverity: activeDisease.severity
    };
  }

  /**
   * Force disease progression for testing/gameplay
   */
  public forceDiseaseProgression(
    entity: PlayerCharacter | NpcEntity | AnimalEntity,
    diseaseId: string
  ): {
    progressed: boolean;
    newStage?: string;
    message: string;
  } {
    if (!entity.health?.currentDiseases) {
      return { progressed: false, message: 'No diseases found' };
    }

    const activeDisease = entity.health.currentDiseases.find(d => d.disease.id === diseaseId);
    if (!activeDisease) {
      return { progressed: false, message: 'Disease not found' };
    }

    let message = '';
    let progressed = false;

    // Force stage progression
    if (activeDisease.stage === 'incubating') {
      activeDisease.stage = 'symptomatic';
      this.applyDiseaseEffects(entity, activeDisease.disease);
      message = `${activeDisease.disease.name} has progressed to symptomatic stage`;
      progressed = true;
    } else if (activeDisease.stage === 'symptomatic') {
      activeDisease.stage = 'recovering';
      activeDisease.severity = Math.max(0.1, activeDisease.severity - 0.3);
      message = `${activeDisease.disease.name} has entered recovery stage`;
      progressed = true;
    }

    // Update overall health
    entity.health.overallHealthStatus = this.calculateOverallHealthStatus(entity.health.currentDiseases);

    return {
      progressed,
      newStage: activeDisease.stage,
      message
    };
  }

  /**
   * Get available treatments for a disease
   */
  public getAvailableTreatments(
    diseaseType: string,
    era: string,
    region: string
  ): any[] {
    ensureDiseaseModule();
    return (diseaseModule?.DISEASE_DATABASE?.medicines || []).filter(medicine => {
      // Check era availability
      if (!medicine.availableEras.includes(era as any)) return false;
      // Check region availability
      if (!medicine.availableRegions.includes(region as any)) return false;
      // Check if effective against disease type
      return medicine.effectiveness[diseaseType as keyof typeof medicine.effectiveness] > 0;
    });
  }

  /**
   * Generate narrative hints for diseases visible to player
   */
  public generateDiseaseNarrativeHints(
    entities: (NpcEntity | AnimalEntity)[],
    playerPosition: { x: number; y: number }
  ): string[] {
    const hints: string[] = [];

    for (const entity of entities) {
      if (!entity.health?.currentDiseases) continue;

      const distance = Math.sqrt(
        Math.pow(entity.x - playerPosition.x, 2) + 
        Math.pow(entity.y - playerPosition.y, 2)
      );

      if (distance <= this.proximityCheckRadius) {
        for (const activeDisease of entity.health.currentDiseases) {
          if (activeDisease.stage === 'symptomatic') {
            const disease = this.diseaseCache.get(activeDisease.disease.id);
            if (disease) {
              const hint = this.generateProximityNarrativeHint(entity, disease);
              if (hint) hints.push(hint);
            }
          }
        }
      }
    }

    return hints;
  }

  /**
   * Check if there's an active epidemic for any available diseases
   */
  public getEpidemicDisease(
    availableDiseases: Disease[],
    era: HistoricalEra,
    region: CulturalZone,
    currentYear: number
  ): Disease | null {
    // Check each available disease for epidemic status
    for (const disease of availableDiseases) {
      ensureDiseaseModule();
      const prevalenceData = (diseaseModule?.DISEASE_PREVALENCE || []).find(p =>
        p.diseaseId === disease.id && p.era === era && p.region === region
      );
      
      if (prevalenceData?.epidemicYears?.includes(currentYear)) {
        console.log(`[DiseaseService] Epidemic detected: ${disease.name} in ${currentYear}`);
        return disease;
      }
    }
    
    return null;
  }

  /**
   * Map modern era enum values to legacy disease database era names
   */
  private mapEraToLegacyName(era: HistoricalEra): string {
    const mapping: Record<string, string> = {
      'PREHISTORY': 'PREHISTORIC',
      'ANTIQUITY': 'ANCIENT',
      'MEDIEVAL': 'MEDIEVAL',
      'RENAISSANCE_EARLY_MODERN': 'EARLY_MODERN',
      'INDUSTRIAL_ERA': 'INDUSTRIAL',
      'MODERN_ERA': 'MODERN',
      'FUTURE_ERA': 'FUTURE'
    };
    return mapping[era] || era;
  }

  /**
   * Get available diseases for a given context (synchronous - uses preloaded module)
   */
  public getAvailableDiseasesForContext(
    era: HistoricalEra,
    region: CulturalZone,
    currentYear: number
  ): Disease[] {
    // If module isn't loaded yet, return empty array with warning
    if (!diseaseModule) {
      console.warn('[DiseaseService] Disease module not yet loaded, returning empty array');
      return [];
    }

    const legacyEraName = this.mapEraToLegacyName(era);
    console.log(`[DiseaseService] Getting diseases for era: ${era} (mapped to: ${legacyEraName}), region: ${region}, year: ${currentYear}`);
    console.log(`[DiseaseService] diseaseModule exists:`, !!diseaseModule);
    console.log(`[DiseaseService] DISEASE_DATABASE exists:`, !!diseaseModule?.DISEASE_DATABASE);
    console.log(`[DiseaseService] Total diseases in database:`, diseaseModule?.DISEASE_DATABASE?.diseases?.length || 0);

    const filtered = (diseaseModule?.DISEASE_DATABASE?.diseases || []).filter(disease => {
      // Check era availability (using legacy era names from diseases.ts)
      if (!disease.availableEras.includes(legacyEraName as any)) return false;

      // Check region availability
      if (!disease.availableRegions.includes(region)) return false;

      // Check year constraints
      if (disease.startYear && currentYear < disease.startYear) return false;
      if (disease.endYear && currentYear > disease.endYear) return false;

      // Apply Columbian Exchange restrictions
      const restrictions = diseaseModule?.COLUMBIAN_EXCHANGE_RESTRICTIONS || { exchangeYear: 1492, preContactNewWorld: [], preContactOldWorld: [] };
      if (currentYear < restrictions.exchangeYear) {
        const isNewWorld = ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN'].includes(region);
        const isOldWorld = !isNewWorld;

        if (isNewWorld && restrictions.preContactNewWorld.includes(disease.id)) {
          return false;
        }
        if (isOldWorld && restrictions.preContactOldWorld.includes(disease.id)) {
          return false;
        }
      }

      return true;
    });

    console.log(`[DiseaseService] Found ${filtered.length} available diseases`);
    return filtered;
  }

  /**
   * Async version for cases where you need to ensure module is loaded
   */
  public async getAvailableDiseasesForContextAsync(
    era: HistoricalEra,
    region: CulturalZone,
    currentYear: number
  ): Promise<Disease[]> {
    await ensureDiseaseModule();
    return this.getAvailableDiseasesForContext(era, region, currentYear);
  }

  private calculateDiseaseChance(entity: NpcEntity | AnimalEntity): number {
    const constitution = 'stats' in entity ? (entity.stats?.constitution || 10) : 10;
    const health = entity.health?.currentDiseases ? 
      Math.max(0, entity.maxHealth - (entity.health.currentDiseases.length * 10)) : 
      entity.maxHealth || 100;

    // Lower health and constitution = higher disease chance
    const healthFactor = (100 - health) / 100;
    const constitutionFactor = (20 - constitution) / 20;
    
    // NPCs with high wanderlust (travelers) have higher exposure
    const wanderlustFactor = 'stats' in entity && entity.stats?.wanderlust ? 
      entity.stats.wanderlust / 20 : 0.1;

    return Math.min(0.8, (healthFactor + constitutionFactor + wanderlustFactor) / 3);
  }

  private getDiseasePrevalence(
    diseaseId: string,
    era: HistoricalEra,
    region: CulturalZone,
    currentYear: number
  ): number {
    const prevalenceData = DISEASE_PREVALENCE.find(p =>
      p.diseaseId === diseaseId && p.era === era && p.region === region
    );

    if (!prevalenceData) return 0.05; // Base chance

    let prevalence = prevalenceData.baseIncidence;

    // Check for epidemic years
    if (prevalenceData.epidemicYears?.includes(currentYear)) {
      prevalence *= 3; // Triple incidence during epidemic years
    }

    // Check for endemic regions
    if (prevalenceData.endemicRegions?.includes(region)) {
      prevalence *= 1.5; // 50% higher in endemic regions
    }

    return Math.min(1, prevalence);
  }

  private attemptTransmission(
    source: NpcEntity | AnimalEntity,
    target: PlayerCharacter | NpcEntity | AnimalEntity,
    disease: Disease,
    contactType: 'proximity' | 'direct_contact',
    exposureStrength: number,
    currentYear: number
  ): { transmitted: boolean; newDisease?: ActiveDisease } {
    // Check if target is immune
    if (target.health?.immunities?.some(immunity => 
      immunity.diseaseId === disease.id && this.isImmunityActive(immunity)
    )) {
      return { transmitted: false };
    }

    // GUARANTEED TRANSMISSION for direct contact (talking to NPCs/animals)
    if (contactType === 'direct_contact') {
      const newDisease = this.createActiveDisease(disease, currentYear);
      return { transmitted: true, newDisease };
    }

    // Calculate transmission chance for proximity only
    let transmissionChance = disease.baseTransmissionRate * exposureStrength;

    if (contactType === 'proximity') {
      transmissionChance *= disease.proximityMultiplier;
    }

    // Apply target's constitution modifier
    const constitution = 'stats' in target ? (target.stats?.constitution || 10) : 10;
    const constitutionModifier = 1 - ((constitution - 10) / 20); // Higher constitution reduces transmission
    transmissionChance *= constitutionModifier;

    if (Math.random() < transmissionChance) {
      const newDisease = this.createActiveDisease(disease, currentYear);
      return { transmitted: true, newDisease };
    }

    return { transmitted: false };
  }

  private createActiveDisease(disease: Disease, currentYear: number): ActiveDisease {
    return {
      disease,
      contractedDate: this.createGameDate(currentYear),
      stage: 'incubating',
      daysRemaining: disease.durationDays,
      severity: 0.5 // Base severity, modified by constitution
    };
  }

  private createImmunity(diseaseId: string, currentYear: number): Immunity {
    const disease = this.diseaseCache.get(diseaseId);
    const expirationDate = disease && disease.immunityDuration > 0 ?
      this.createGameDate(currentYear + Math.floor(disease.immunityDuration / 365)) :
      undefined;

    return {
      diseaseId,
      acquiredDate: this.createGameDate(currentYear),
      expirationDate
    };
  }

  private createExposureEvent(
    diseaseId: string,
    currentYear: number,
    sourceEntityId: string,
    proximityType: 'distant' | 'nearby' | 'close' | 'direct_contact',
    transmissionVector: string
  ): ExposureEvent {
    const strengthMap = {
      'distant': 0.1,
      'nearby': 0.3,
      'close': 0.6,
      'direct_contact': 1.0
    };

    return {
      diseaseId,
      exposureDate: this.createGameDate(currentYear),
      transmissionVector: transmissionVector as any,
      sourceEntityId,
      exposureStrength: strengthMap[proximityType],
      proximityType
    };
  }

  private generateProximityNarrativeHint(
    entity: NpcEntity | AnimalEntity,
    disease: Disease
  ): string {
    const isNpc = 'role' in entity;
    const symptoms = isNpc ? disease.narrativeHints.npcSymptoms : disease.narrativeHints.animalSymptoms;
    
    if (symptoms.length === 0) return '';

    const symptom = symptoms[Math.floor(Math.random() * symptoms.length)];
    const entityName = isNpc ? 
      (entity as NpcEntity).name || 'a stranger' : 
      (entity as AnimalEntity).speciesName;

    return `You passed near ${entityName}. They ${symptom}.`;
  }

  private generateVisibleSymptomDescription(
    entity: NpcEntity | AnimalEntity,
    disease: Disease
  ): string[] {
    const isNpc = 'role' in entity;
    const symptoms = isNpc ? disease.narrativeHints.npcSymptoms : disease.narrativeHints.animalSymptoms;
    
    // Return 1-2 visible symptoms
    const numSymptoms = Math.min(symptoms.length, Math.random() > 0.5 ? 2 : 1);
    const selectedSymptoms: string[] = [];
    
    for (let i = 0; i < numSymptoms; i++) {
      const symptom = symptoms[Math.floor(Math.random() * symptoms.length)];
      if (!selectedSymptoms.includes(symptom)) {
        selectedSymptoms.push(`They ${symptom}.`);
      }
    }

    return selectedSymptoms;
  }

  public calculateOverallHealthStatus(diseases: ActiveDisease[]): OverallHealthStatus {
    if (diseases.length === 0) return 'healthy';

    let totalSeverity = 0;
    let maxSeverity = 0;

    for (const disease of diseases) {
      const severity = disease.severity;
      totalSeverity += severity;
      maxSeverity = Math.max(maxSeverity, severity);
    }

    if (maxSeverity >= 0.8) return 'critical';
    if (totalSeverity >= 1.5) return 'sick';
    if (totalSeverity >= 0.5) return 'mild';
    return 'healthy';
  }

  private calculateRecoveryChance(
    entity: PlayerCharacter | NpcEntity | AnimalEntity,
    activeDisease: ActiveDisease
  ): number {
    const disease = activeDisease.disease;
    let recoveryChance = disease.recoveryChance;

    // Constitution modifier
    const constitution = 'stats' in entity ? (entity.stats?.constitution || 10) : 10;
    const constitutionModifier = 1 + ((constitution - 10) / 20);
    recoveryChance *= constitutionModifier;

    // Severity modifier
    recoveryChance *= (1 - activeDisease.severity * 0.5);

    return Math.min(0.95, Math.max(0.01, recoveryChance));
  }

  private calculateMortalityChance(
    entity: PlayerCharacter | NpcEntity | AnimalEntity,
    activeDisease: ActiveDisease
  ): number {
    const disease = activeDisease.disease;
    let mortalityChance = disease.mortalityRate * 0.01; // Daily mortality check

    // Constitution modifier
    const constitution = 'stats' in entity ? (entity.stats?.constitution || 10) : 10;
    const constitutionModifier = 1 - ((constitution - 10) / 30);
    mortalityChance *= constitutionModifier;

    // Severity modifier
    mortalityChance *= activeDisease.severity;

    return Math.min(0.1, Math.max(0, mortalityChance));
  }

  private applyDiseaseEffects(entity: PlayerCharacter | NpcEntity | AnimalEntity, disease: Disease): void {
    if ('stats' in entity && entity.stats) {
      // Apply stat penalties (these should be temporary)
      // This would integrate with the character's temporary stat modifier system
      console.log(`Applying disease effects for ${disease.name} to entity`);
    }
  }

  private removeDiseaseEffects(entity: PlayerCharacter | NpcEntity | AnimalEntity, disease: Disease): void {
    if ('stats' in entity && entity.stats) {
      // Remove stat penalties
      console.log(`Removing disease effects for ${disease.name} from entity`);
    }
  }

  private generateProgressionEvent(
    entity: PlayerCharacter | NpcEntity | AnimalEntity,
    disease: Disease,
    stage: DiseaseStage
  ): string {
    const isPlayer = 'role' in entity || 'name' in entity;
    
    if (stage === 'symptomatic') {
      if (isPlayer) {
        const playerSymptoms = disease.narrativeHints.playerSymptoms;
        return playerSymptoms[Math.floor(Math.random() * playerSymptoms.length)];
      } else {
        return `${entity.id} is showing symptoms of ${disease.name}`;
      }
    }

    return `Disease progression: ${disease.name} stage ${stage}`;
  }

  private generateRecoveryEvent(
    entity: PlayerCharacter | NpcEntity | AnimalEntity,
    disease: Disease
  ): string {
    const isPlayer = 'role' in entity || 'name' in entity;
    
    if (isPlayer) {
      return `You have recovered from ${disease.name}.`;
    } else {
      return `${entity.id} has recovered from ${disease.name}`;
    }
  }

  private isImmunityActive(immunity: Immunity): boolean {
    if (!immunity.expirationDate) return true; // Permanent immunity
    
    // TODO: Compare with current game date
    return true; // Simplified for now
  }

  private createGameDate(year: number): GameDate {
    return {
      year,
      month: 1,
      day: 1
    };
  }

  private getCurrentProgressionStage(
    activeDisease: ActiveDisease,
    disease: Disease
  ): DiseaseProgressionStage | null {
    if (!disease.progressionStages || disease.progressionStages.length === 0) {
      return null;
    }

    // Find the current stage based on days since contraction
    let currentStage: DiseaseProgressionStage | null = null;
    for (const stage of disease.progressionStages) {
      if (activeDisease.daysSinceContraction >= stage.day) {
        currentStage = stage;
      } else {
        break;
      }
    }
    return currentStage;
  }

  private getProgressionStageAtTime(
    daysElapsed: number,
    disease: Disease
  ): DiseaseProgressionStage | null {
    if (!disease.progressionStages || disease.progressionStages.length === 0) {
      return null;
    }

    let stage: DiseaseProgressionStage | null = null;
    for (const s of disease.progressionStages) {
      if (daysElapsed >= s.day) {
        stage = s;
      } else {
        break;
      }
    }
    return stage;
  }

  private generateStageProgressionDescription(
    entity: PlayerCharacter | NpcEntity | AnimalEntity,
    disease: Disease,
    stage: DiseaseProgressionStage
  ): string {
    const isPlayer = !('role' in entity);
    const symptomDesc = stage.symptoms.join(', ');
    
    if (isPlayer) {
      if (stage.severity >= 0.9) {
        return `Your ${disease.name} has reached a critical stage. You experience ${symptomDesc}.`;
      } else if (stage.severity >= 0.6) {
        return `Your ${disease.name} worsens. You now have ${symptomDesc}.`;
      } else if (stage.severity <= 0.3) {
        return `Your ${disease.name} seems to be improving. You feel ${symptomDesc}.`;
      } else {
        return `Your ${disease.name} progresses. You experience ${symptomDesc}.`;
      }
    } else {
      const entityName = 'name' in entity ? entity.name : entity.id;
      return `${entityName}'s ${disease.name} has progressed: ${symptomDesc}`;
    }
  }

  private applyStageEffects(
    entity: PlayerCharacter | NpcEntity | AnimalEntity,
    statModifiers: DiseaseProgressionStage['statModifiers']
  ): void {
    if ('stats' in entity && entity.stats && statModifiers) {
      Object.entries(statModifiers).forEach(([stat, value]) => {
        if (value !== undefined && stat in entity.stats!) {
          (entity.stats as any)[stat] = Math.max(1, (entity.stats as any)[stat] + value);
        }
      });
    }
  }

  private generateDeathEvent(
    entity: PlayerCharacter | NpcEntity | AnimalEntity,
    disease: Disease
  ): string {
    const isPlayer = !('role' in entity);
    
    if (isPlayer) {
      return `You have succumbed to ${disease.name}. The disease has claimed your life.`;
    } else {
      const entityName = 'name' in entity ? entity.name : entity.id;
      return `${entityName} has died from ${disease.name}`;
    }
  }
}

// Export singleton instance for easier use
export const diseaseService = new DiseaseService();

// Also export the class for type usage if needed
export default DiseaseService;