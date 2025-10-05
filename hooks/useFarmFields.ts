/**
 * hooks/useFarmFields.ts
 * Handle field operations (plant/water/harvest)
 *
 * Phase 2 of Farm Panel refactoring - extracts field management logic
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Season, CulturalZone, HistoricalEra } from '../types';
import { FarmState, updateFarmState, getValidCrops } from '../services/farmService';
import { FieldPlan, ResourceAllocation } from '../components/farm/types';

interface UseFarmFieldsOptions {
  farmState: FarmState | null;
  setFarmState: (state: FarmState | null) => void;
  culturalZone: CulturalZone;
  era: HistoricalEra;
  season: Season;
  currentGameDay?: number;
}

interface UseFarmFieldsReturn {
  // Field selection
  selectedField: number | null;
  setSelectedField: (field: number | null) => void;
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;

  // Harvest ledger
  harvestLedger: Record<string, number>;
  setHarvestLedger: (ledger: Record<string, number>) => void;
  addHarvestToLedger: (crop: string, qty: number) => void;

  // Valid crops
  validCrops: string[];

  // Field actions
  plantAll: () => void;
  waterAll: () => void;
  harvestAll: () => void;
  handleFieldAction: (fieldId: number, action: string, cropToPlant?: string) => void;
  persistFields: (fields: FarmState['fields']) => void;

  // Resource allocation
  handleResourceAllocation: (fieldId: number, type: 'water' | 'manure', amount: number) => void;
  resources: ResourceAllocation;
  setResources: (resources: ResourceAllocation) => void;

  // Worker planning
  fieldPlans: Map<number, FieldPlan>;
  setFieldPlans: (plans: Map<number, FieldPlan>) => void;
  showPlanningModal: boolean;
  setShowPlanningModal: (show: boolean) => void;
  workQualityScore: number | null;
  isAssessing: boolean;
  handleWorkerSubmit: () => Promise<void>;

  // Field inspection
  inspectedField: number | null;
  setInspectedField: (field: number | null) => void;
}

export function useFarmFields({
  farmState,
  setFarmState,
  culturalZone,
  era,
  season,
  currentGameDay,
}: UseFarmFieldsOptions): UseFarmFieldsReturn {
  // Field selection
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('');

  // Harvest ledger
  const [harvestLedger, setHarvestLedger] = useState<Record<string, number>>({});

  // Worker planning
  const [fieldPlans, setFieldPlans] = useState<Map<number, FieldPlan>>(new Map());
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [workQualityScore, setWorkQualityScore] = useState<number | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  // Resource allocation
  const [resources, setResources] = useState<ResourceAllocation>({
    water: { available: 20, allocated: new Map() },
    manure: { available: 8, allocated: new Map() },
    seeds: [],
  });

  // Field inspection
  const [inspectedField, setInspectedField] = useState<number | null>(null);

  // Valid crops based on cultural zone, era, season
  const validCrops = useMemo(
    () => getValidCrops({ culturalZone, era, season }),
    [culturalZone, era, season]
  );

  // Track last processed day to avoid infinite loop
  const lastProcessedDayRef = useRef<number | null>(null);

  // Livestock health decay and disease spread effect - runs when game day changes
  useEffect(() => {
    if (!farmState || !currentGameDay) return;

    // Only process if day actually changed
    if (lastProcessedDayRef.current === currentGameDay) return;
    lastProcessedDayRef.current = currentGameDay;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    let needsUpdate = false;

    // Handle livestock health decay
    const updatedLivestock = farmState.livestock.map(animal => {
      // Check if animal hasn't been fed in 2+ days
      const daysSinceLastFed = (now - animal.lastFed) / oneDayMs;

      if (daysSinceLastFed >= 2) {
        needsUpdate = true;
        // Decrease health by 5% per day after 2 days unfed
        const healthDecay = Math.floor((daysSinceLastFed - 2) * 5);
        const newHealth = Math.max(0, animal.health - healthDecay);

        // Also decrease productivity when hungry
        const productivityDecay = Math.floor((daysSinceLastFed - 2) * 3);
        const newProductivity = Math.max(0, animal.productivity - productivityDecay);

        return {
          ...animal,
          health: newHealth,
          productivity: newProductivity,
        };
      }

      return animal;
    });

    // Handle disease spread across fields
    const updatedFields = farmState.fields.map((field, idx) => {
      let newField = { ...field };

      // Check for disease spread from adjacent fields
      const adjacentIndices = [idx - 1, idx + 1]; // Simple left/right adjacency
      const hasDiseasedNeighbor = adjacentIndices.some(adjIdx => {
        const adjField = farmState.fields[adjIdx];
        return adjField && adjField.diseaseSeverity > 50;
      });

      // 10% chance to spread from diseased neighbor
      if (hasDiseasedNeighbor && Math.random() < 0.1) {
        needsUpdate = true;
        newField.diseaseSeverity = Math.min(100, newField.diseaseSeverity + 20);
        // Set disease type if not already diseased
        if (newField.diseaseType === 'none') {
          const diseaseTypes = ['fungal_blight', 'rust', 'wilt', 'rot'] as const;
          newField.diseaseType = diseaseTypes[Math.floor(Math.random() * diseaseTypes.length)];
        }
      }

      // If disease reaches 85+, crop dies
      if (newField.diseaseSeverity >= 85 && newField.crop) {
        needsUpdate = true;
        newField.crop = null;
        newField.growthStage = 'fallow';
        newField.daysToHarvest = 0;
        newField.health = 0;
        // Reset disease after crop death
        newField.diseaseSeverity = 0;
        newField.diseaseType = 'none';
      }

      return newField;
    });

    if (needsUpdate) {
      const updatedState = {
        ...farmState,
        livestock: updatedLivestock,
        fields: updatedFields,
      };
      setFarmState(updatedState);
      updateFarmState(farmState.tileKey, updatedState);
    }
  }, [currentGameDay, farmState, setFarmState]);

  // Persist fields to farm state
  const persistFields = useCallback(
    (fields: FarmState['fields']) => {
      if (!farmState) return;
      const updated = { ...farmState, fields };
      setFarmState(updated);
      updateFarmState(farmState.id, updated);
    },
    [farmState, setFarmState]
  );

  // Add harvest to ledger
  const addHarvestToLedger = useCallback((crop: string, qty: number) => {
    setHarvestLedger(prev => ({
      ...prev,
      [crop]: (prev[crop] || 0) + qty,
    }));
  }, []);

  // Plant all fields
  const plantAll = useCallback(() => {
    if (!farmState?.fields || validCrops.length === 0) return;

    const defaultCrop = validCrops[0];
    const updatedFields = farmState.fields.map(field => ({
      ...field,
      crop: defaultCrop,
      growthStage: 'planted' as const,
      daysToHarvest: 30,
    }));

    persistFields(updatedFields);
  }, [farmState, validCrops, persistFields]);

  // Water all fields
  const waterAll = useCallback(() => {
    if (!farmState?.fields) return;

    // Check for drought - watering is less effective during drought
    const isDrought = farmState.activeWeather?.event === 'drought';
    const targetMoisture = isDrought ? 'moist' : 'wet';

    const updatedFields = farmState.fields.map(field => ({
      ...field,
      moisture: targetMoisture as const,
      lastWatered: Date.now(),
    }));

    persistFields(updatedFields);
  }, [farmState, persistFields]);

  // Harvest all mature fields
  const harvestAll = useCallback(() => {
    if (!farmState?.fields) return;

    // Check for heavy rain - harvests spoil 30% faster
    const isHeavyRain = farmState.activeWeather?.event === 'heavy_rain';
    const spoilageRate = isHeavyRain ? 0.7 : 1.0; // 30% reduction in heavy rain

    const updatedFields = farmState.fields.map(field => {
      if (field.crop && field.growthStage === 'mature') {
        // Calculate harvest quantity with weather penalty
        const baseHarvestQty = Math.floor(10 + Math.random() * 15);
        const harvestQty = Math.floor(baseHarvestQty * spoilageRate);

        addHarvestToLedger(field.crop, harvestQty);

        return {
          ...field,
          crop: null,
          growthStage: 'fallow' as const,
          daysToHarvest: 0,
        };
      }
      return field;
    });

    persistFields(updatedFields);
  }, [farmState, persistFields, addHarvestToLedger]);

  // Feed all livestock
  const feedLivestock = useCallback(() => {
    if (!farmState) return;

    const currentDay = Date.now(); // Using timestamp as game day equivalent
    const updatedLivestock = farmState.livestock.map(animal => ({
      ...animal,
      lastFed: currentDay,
      health: Math.min(100, animal.health + 5), // Slight health boost from feeding
    }));

    const updatedState = {
      ...farmState,
      livestock: updatedLivestock,
    };

    setFarmState(updatedState);
    updateFarmState(farmState.tileKey, updatedState);
  }, [farmState, setFarmState]);

  // Progress time on fields - called when time advances
  const progressFieldTime = useCallback((monthsPassed: number) => {
    if (!farmState?.fields) return;

    const daysPassed = monthsPassed * 30; // Approximate days per month

    const updatedFields = farmState.fields.map(field => {
      let newField = { ...field };

      // Update growing crops
      if (field.crop && (field.growthStage === 'planted' || field.growthStage === 'growing')) {
        newField.daysToHarvest = Math.max(0, field.daysToHarvest - daysPassed);

        // Update growth stage based on days remaining
        if (newField.daysToHarvest === 0) {
          newField.growthStage = 'mature';
        } else if (field.growthStage === 'planted' && daysPassed >= 3) {
          newField.growthStage = 'growing';
        }
      }

      // Moisture decay over time
      if (daysPassed >= 7) {
        // After a week, moisture decreases one level
        const moistureLevels: Array<'dry' | 'moist' | 'wet' | 'flooded'> = ['dry', 'moist', 'wet', 'flooded'];
        const currentIndex = moistureLevels.indexOf(field.moisture);
        const decaySteps = Math.floor(daysPassed / 7);
        const newIndex = Math.max(0, currentIndex - decaySteps);
        newField.moisture = moistureLevels[newIndex];
      }

      // Soil nutrient depletion for growing crops
      if (field.crop && field.growthStage === 'growing') {
        newField.soilNitrogen = Math.max(0, field.soilNitrogen - (daysPassed * 0.5));
        newField.soilPhosphorus = Math.max(0, field.soilPhosphorus - (daysPassed * 0.3));
        newField.soilPotassium = Math.max(0, field.soilPotassium - (daysPassed * 0.2));
      }

      return newField;
    });

    const updatedState = {
      ...farmState,
      fields: updatedFields,
    };

    setFarmState(updatedState);
    updateFarmState(farmState.tileKey, updatedState);
  }, [farmState, setFarmState]);

  // Handle field action
  const handleFieldAction = useCallback(
    (fieldId: number, action: string, cropToPlant?: string) => {
      if (!farmState?.fields) return;

      const updatedFields = [...farmState.fields];
      const field = updatedFields[fieldId];
      if (!field) return;

      switch (action) {
        case 'plant':
          if (cropToPlant) {
            updatedFields[fieldId] = {
              ...field,
              crop: cropToPlant,
              growthStage: 'planted' as const,
              daysToHarvest: 30,
            };
          }
          break;

        case 'water':
          updatedFields[fieldId] = {
            ...field,
            moisture: 'wet' as const,
            lastWatered: Date.now(),
          };
          break;

        case 'harvest':
          if (field.crop && field.growthStage === 'mature') {
            const harvestQty = Math.floor(10 + Math.random() * 15);
            addHarvestToLedger(field.crop, harvestQty);

            updatedFields[fieldId] = {
              ...field,
              crop: null,
              growthStage: 'fallow' as const,
              daysToHarvest: 0,
            };
          }
          break;

        case 'manure':
          updatedFields[fieldId] = {
            ...field,
            health: Math.min(100, field.health + 10),
          };
          break;

        case 'fallow':
          updatedFields[fieldId] = {
            ...field,
            crop: null,
            growthStage: 'fallow' as const,
            daysToHarvest: 0,
          };
          break;

        case 'treat':
          // Treat disease - reduces disease severity by 40%
          updatedFields[fieldId] = {
            ...field,
            diseaseSeverity: Math.max(0, field.diseaseSeverity - 40),
            diseaseType: field.diseaseSeverity <= 40 ? 'none' : field.diseaseType,
            // Also reduce pest severity slightly
            pestSeverity: Math.max(0, field.pestSeverity - 20),
          };
          break;
      }

      persistFields(updatedFields);
    },
    [farmState, persistFields, addHarvestToLedger]
  );

  // Handle resource allocation
  const handleResourceAllocation = useCallback(
    (fieldId: number, type: 'water' | 'manure', amount: number) => {
      setResources(prev => {
        const newResources = { ...prev };
        if (type === 'water') {
          newResources.water.allocated.set(fieldId, amount);
        } else {
          newResources.manure.allocated.set(fieldId, amount);
        }
        return newResources;
      });
    },
    []
  );

  // Handle worker submit (planning)
  const handleWorkerSubmit = useCallback(async () => {
    setIsAssessing(true);

    // Simulate assessment (in real app, this would call LLM)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calculate quality score based on resource allocation
    let totalScore = 0;
    let planCount = 0;

    fieldPlans.forEach((plan, fieldId) => {
      planCount++;
      if (plan.action === 'plant' && plan.crop) totalScore += 20;
      if (plan.action === 'water') totalScore += 15;
      if (plan.action === 'manure') totalScore += 25;
      if (plan.resourcesAllocated?.water) totalScore += 10;
      if (plan.resourcesAllocated?.manure) totalScore += 15;
    });

    const finalScore = planCount > 0 ? Math.min(100, totalScore / planCount) : 0;
    setWorkQualityScore(finalScore);
    setIsAssessing(false);
  }, [fieldPlans]);

  return {
    // Field selection
    selectedField,
    setSelectedField,
    selectedCrop,
    setSelectedCrop,

    // Harvest ledger
    harvestLedger,
    setHarvestLedger,
    addHarvestToLedger,

    // Valid crops
    validCrops,

    // Field actions
    plantAll,
    waterAll,
    harvestAll,
    handleFieldAction,
    persistFields,

    // Livestock actions
    feedLivestock,

    // Time progression
    progressFieldTime,

    // Resource allocation
    handleResourceAllocation,
    resources,
    setResources,

    // Worker planning
    fieldPlans,
    setFieldPlans,
    showPlanningModal,
    setShowPlanningModal,
    workQualityScore,
    isAssessing,
    handleWorkerSubmit,

    // Field inspection
    inspectedField,
    setInspectedField,
  };
}
