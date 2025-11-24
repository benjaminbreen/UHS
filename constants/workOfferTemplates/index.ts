/**
 * constants/workOfferTemplates/index.ts
 *
 * Central export for all work offer templates.
 * Provides convenience functions for getting templates by location type.
 *
 * Created: December 2024 (Phase 2 of work system expansion)
 */

import { WorkTemplate } from '../../services/workOfferGenerationService';
import { MARKETPLACE_TEMPLATES } from './marketplaceTemplates';
import { CITY_TEMPLATES } from './cityTemplates';

/**
 * All available work templates
 */
export const ALL_WORK_TEMPLATES: WorkTemplate[] = [
  ...MARKETPLACE_TEMPLATES,
  ...CITY_TEMPLATES
];

/**
 * Get templates appropriate for a specific location type
 */
export function getTemplatesForLocationType(locationType: string): WorkTemplate[] {
  switch (locationType) {
    case 'marketplace':
      return MARKETPLACE_TEMPLATES;

    case 'city':
    case 'government':
      return CITY_TEMPLATES;

    case 'encounter':
      // Encounter modal has its own system - don't interfere
      return [];

    case 'ruins':
      // Could add ruin-specific templates in the future
      return [];

    default:
      // Return general templates (marketplace + city combined)
      return [...MARKETPLACE_TEMPLATES, ...CITY_TEMPLATES];
  }
}

/**
 * Get all marketplace templates
 */
export function getMarketplaceTemplates(): WorkTemplate[] {
  return MARKETPLACE_TEMPLATES;
}

/**
 * Get all city/government templates
 */
export function getCityTemplates(): WorkTemplate[] {
  return CITY_TEMPLATES;
}

/**
 * Export individual template collections
 */
export { MARKETPLACE_TEMPLATES, CITY_TEMPLATES };
