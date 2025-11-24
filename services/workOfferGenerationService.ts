/**
 * services/workOfferGenerationService.ts
 *
 * Centralized service for generating contextual work offers with cultural authenticity.
 * Integrates with the cultural item mapping system for historically-accurate content.
 *
 * Created: December 2024 (Phase 2 of quest system refactor)
 */

import { WorkOffer, WorkTaskType } from '../types/workOffer';
import { NpcEntity } from '../types';
import { CulturalZone } from '../types/characterData';
import { HistoricalEra } from '../types/enums';
import { getCulturalItem, getItemHistoricalContext } from '../constants/gameData/culturalItemMapping';

export interface WorkGenerationContext {
  npc: NpcEntity;
  culturalZone: CulturalZone;
  era: HistoricalEra;
  location: { x: number; y: number };
  mapSeed?: string;
  locationType?: 'marketplace' | 'city' | 'ruins' | 'encounter' | 'government';
  gameTimeHours?: number;
}

export interface WorkTemplate {
  id: string;
  taskType: WorkTaskType;
  weight: number; // Probability weight
  minReputation?: number;
  requiredProfessions?: string[]; // Which NPC professions can offer this
  generateTitle: (context: WorkGenerationContext) => string;
  generateDescription: (context: WorkGenerationContext) => string;
  generateRequirements: (context: WorkGenerationContext) => Partial<WorkOffer>;
  basePayment: number;
  paymentMultiplier?: (context: WorkGenerationContext) => number;
}

/**
 * Generate a work offer from a template and context
 */
export function generateWorkOfferFromTemplate(
  template: WorkTemplate,
  context: WorkGenerationContext
): WorkOffer {
  const id = `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const requirements = template.generateRequirements(context);
  const paymentMultiplier = template.paymentMultiplier?.(context) || 1;
  const payment = Math.round(template.basePayment * paymentMultiplier);

  return {
    id,
    npcId: context.npc.id,
    npcName: context.npc.name,
    npcLocation: {
      x: context.location.x,
      y: context.location.y,
      mapSeed: context.mapSeed
    },
    taskType: template.taskType,
    description: template.generateDescription(context),
    payment,
    offerTime: context.gameTimeHours || 0,
    accepted: false,
    completed: false,
    failed: false,
    ...requirements
  };
}

/**
 * Select appropriate templates based on NPC profession and location
 */
export function getAppropriateTemplates(
  templates: WorkTemplate[],
  context: WorkGenerationContext
): WorkTemplate[] {
  const npcProfession = (context.npc.role || context.npc.profession || '').toLowerCase();

  return templates.filter(template => {
    // Check if NPC profession matches
    if (template.requiredProfessions && template.requiredProfessions.length > 0) {
      const matches = template.requiredProfessions.some(prof =>
        npcProfession.includes(prof.toLowerCase())
      );
      if (!matches) return false;
    }

    // Could add more filtering here (reputation, location type, etc.)

    return true;
  });
}

/**
 * Randomly select a template based on weights
 */
export function selectWeightedTemplate(templates: WorkTemplate[]): WorkTemplate | null {
  if (templates.length === 0) return null;

  const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;

  for (const template of templates) {
    random -= template.weight;
    if (random <= 0) {
      return template;
    }
  }

  return templates[0]; // Fallback
}

/**
 * Generate a work offer for an NPC based on context
 */
export function generateWorkOffer(
  context: WorkGenerationContext,
  availableTemplates: WorkTemplate[]
): WorkOffer | null {
  // Filter templates appropriate for this NPC/location
  const appropriate = getAppropriateTemplates(availableTemplates, context);

  if (appropriate.length === 0) {
    console.log(`[WorkGen] No appropriate templates for ${context.npc.name} (${context.npc.role})`);
    return null;
  }

  // Select one template randomly based on weights
  const template = selectWeightedTemplate(appropriate);

  if (!template) return null;

  // Generate the work offer
  const offer = generateWorkOfferFromTemplate(template, context);

  console.log(`[WorkGen] Generated ${offer.taskType} work for ${context.npc.name}: ${offer.description}`);

  return offer;
}

/**
 * Helper: Generate a culturally-appropriate item name
 */
export function getCulturalItemForWork(
  genericItem: string,
  context: WorkGenerationContext
): string {
  return getCulturalItem(genericItem, context.culturalZone, context.era);
}

/**
 * Helper: Get historical context for educational notes
 */
export function getEducationalContext(itemName: string): string | undefined {
  return getItemHistoricalContext(itemName);
}

/**
 * Helper: Generate delivery distance-based payment multiplier
 */
export function getDistanceMultiplier(context: WorkGenerationContext, targetLocation: { x: number; y: number }): number {
  const distance = Math.sqrt(
    Math.pow(targetLocation.x - context.location.x, 2) +
    Math.pow(targetLocation.y - context.location.y, 2)
  );

  // Base 1x for nearby (< 10 tiles), up to 2x for far (50+ tiles)
  return 1 + Math.min(1, distance / 50);
}

/**
 * Helper: Check if NPC profession matches any in a list
 */
export function npcHasProfession(npc: NpcEntity, professions: string[]): boolean {
  const npcProfession = (npc.role || npc.profession || '').toLowerCase();
  return professions.some(prof => npcProfession.includes(prof.toLowerCase()));
}

/**
 * Helper: Generate random nearby location for delivery/exploration tasks
 */
export function generateNearbyLocation(
  context: WorkGenerationContext,
  minDistance: number = 10,
  maxDistance: number = 30
): { x: number; y: number; name: string } {
  const angle = Math.random() * Math.PI * 2;
  const distance = minDistance + Math.random() * (maxDistance - minDistance);

  const x = Math.round(context.location.x + Math.cos(angle) * distance);
  const y = Math.round(context.location.y + Math.sin(angle) * distance);

  // Generate a simple location name based on direction
  const direction = angle < Math.PI / 4 ? 'East' :
                   angle < 3 * Math.PI / 4 ? 'North' :
                   angle < 5 * Math.PI / 4 ? 'West' : 'South';

  return {
    x,
    y,
    name: `${direction} ${Math.round(distance)} tiles away`
  };
}
