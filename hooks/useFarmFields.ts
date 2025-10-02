/**
 * hooks/useFarmFields.ts
 * Handle field operations (plant/water/harvest)
 *
 * Phase 2 of Farm Panel refactoring - extracts field management logic
 */

import { useState, useCallback, useMemo } from 'react';
import { Season, CulturalZone, HistoricalEra } from '../types';
import { FarmState, updateFarmState, getValidCrops } from '../services/farmService';
import { FieldPlan, ResourceAllocation } from '../components/farm/types';

interface UseFarmFieldsOptions {
  farmState: FarmState | null;
  setFarmState: (state: FarmState | null) => void;
  culturalZone: CulturalZone;
  era: HistoricalEra;
  season: Season;
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

    const updatedFields = farmState.fields.map(field => ({
      ...field,
      moisture: 'wet' as const,
      lastWatered: Date.now(),
    }));

    persistFields(updatedFields);
  }, [farmState, persistFields]);

  // Harvest all mature fields
  const harvestAll = useCallback(() => {
    if (!farmState?.fields) return;

    const updatedFields = farmState.fields.map(field => {
      if (field.crop && field.growthStage === 'mature') {
        // Add to harvest ledger
        const harvestQty = Math.floor(10 + Math.random() * 15);
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
