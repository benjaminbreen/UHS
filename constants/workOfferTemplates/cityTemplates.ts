/**
 * constants/workOfferTemplates/cityTemplates.ts
 *
 * Work offer templates for city officials, administrators, and urban NPCs.
 * More formal/administrative tasks compared to marketplace trading.
 *
 * Created: December 2024 (Phase 2 of work system expansion)
 */

import { WorkTemplate } from '../../services/workOfferGenerationService';
import { getCulturalItemForWork, generateNearbyLocation, getDistanceMultiplier } from '../../services/workOfferGenerationService';

export const CITY_TEMPLATES: WorkTemplate[] = [
  // ===== ADMINISTRATIVE DELIVERY TASKS =====
  {
    id: 'city_document_delivery',
    taskType: 'deliver_to_location',
    weight: 10,
    requiredProfessions: ['official', 'administrator', 'scribe', 'clerk', 'bureaucrat'],
    generateTitle: (context) => {
      const writingMaterial = getCulturalItemForWork('writing_material', context);
      return `Deliver official documents`;
    },
    generateDescription: (context) => {
      const target = generateNearbyLocation(context, 10, 30);
      return `These documents must reach the official ${target.name}. Handle them carefully.`;
    },
    generateRequirements: (context) => {
      const target = generateNearbyLocation(context, 10, 30);
      return {
        acceptedCategories: ['Document'],
        requiredQuantity: 1,
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 3
        }
      };
    },
    basePayment: 55,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 10, 30);
      return getDistanceMultiplier(context, target) * 1.1;
    }
  },

  {
    id: 'city_supply_delivery',
    taskType: 'deliver_to_location',
    weight: 8,
    requiredProfessions: ['official', 'quartermaster', 'supply officer'],
    generateTitle: (context) => {
      const grain = getCulturalItemForWork('grain', context);
      return `Deliver supplies to outpost`;
    },
    generateDescription: (context) => {
      const grain = getCulturalItemForWork('grain', context);
      const target = generateNearbyLocation(context, 20, 50);
      return `An outpost ${target.name} needs ${grain}. Deliver these supplies on behalf of the city.`;
    },
    generateRequirements: (context) => {
      const grain = getCulturalItemForWork('grain', context);
      const target = generateNearbyLocation(context, 20, 50);
      return {
        requiredItem: grain,
        requiredQuantity: 6,
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 4
        }
      };
    },
    basePayment: 70,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 20, 50);
      return getDistanceMultiplier(context, target);
    }
  },

  // ===== FETCH TASKS FOR CITY =====
  {
    id: 'city_fetch_incense',
    taskType: 'fetch_item',
    weight: 7,
    requiredProfessions: ['official', 'priest', 'temple keeper', 'religious official'],
    generateTitle: (context) => {
      const incense = getCulturalItemForWork('incense', context);
      return `Acquire ${incense} for ceremonies`;
    },
    generateDescription: (context) => {
      const incense = getCulturalItemForWork('incense', context);
      return `We need ${incense} for upcoming ceremonies. Bring some to the city and you'll be compensated.`;
    },
    generateRequirements: (context) => {
      const incense = getCulturalItemForWork('incense', context);
      return {
        requiredItem: incense,
        requiredQuantity: 3
      };
    },
    basePayment: 65
  },

  {
    id: 'city_fetch_writing_materials',
    taskType: 'fetch_item',
    weight: 9,
    requiredProfessions: ['official', 'scribe', 'clerk', 'administrator', 'scholar'],
    generateTitle: (context) => {
      const writingMaterial = getCulturalItemForWork('writing_material', context);
      return `Need ${writingMaterial}`;
    },
    generateDescription: (context) => {
      const writingMaterial = getCulturalItemForWork('writing_material', context);
      return `The administrative office is running low on ${writingMaterial}. Bring us some.`;
    },
    generateRequirements: (context) => {
      const writingMaterial = getCulturalItemForWork('writing_material', context);
      return {
        requiredItem: writingMaterial,
        requiredQuantity: 4
      };
    },
    basePayment: 50
  },

  {
    id: 'city_fetch_building_materials',
    taskType: 'fetch_item',
    weight: 8,
    requiredProfessions: ['official', 'architect', 'builder', 'construction overseer'],
    generateTitle: (context) => {
      const material = getCulturalItemForWork('building_material', context);
      return `Acquire ${material} for repairs`;
    },
    generateDescription: (context) => {
      const material = getCulturalItemForWork('building_material', context);
      return `City buildings need repairs. We need ${material}. Bring some and we'll pay.`;
    },
    generateRequirements: (context) => {
      const material = getCulturalItemForWork('building_material', context);
      return {
        requiredItem: material,
        requiredQuantity: 5
      };
    },
    basePayment: 55
  },

  // ===== PURCHASE TASKS =====
  {
    id: 'city_purchase_alcohol',
    taskType: 'buy_from_location',
    weight: 6,
    requiredProfessions: ['official', 'steward', 'quartermaster'],
    generateTitle: (context) => {
      const alcohol = getCulturalItemForWork('alcohol', context);
      return `Purchase ${alcohol} for event`;
    },
    generateDescription: (context) => {
      const alcohol = getCulturalItemForWork('alcohol', context);
      const target = generateNearbyLocation(context, 15, 40);
      return `An official event requires ${alcohol}. Purchase some from the supplier ${target.name}.`;
    },
    generateRequirements: (context) => {
      const alcohol = getCulturalItemForWork('alcohol', context);
      const target = generateNearbyLocation(context, 15, 40);
      return {
        requiredItem: alcohol,
        requiredQuantity: 4,
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 5
        }
      };
    },
    basePayment: 60,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 15, 40);
      return getDistanceMultiplier(context, target) * 1.2;
    }
  },

  {
    id: 'city_purchase_cloth',
    taskType: 'buy_from_location',
    weight: 7,
    requiredProfessions: ['official', 'steward', 'quartermaster', 'tailor'],
    generateTitle: (context) => {
      const cloth = getCulturalItemForWork('cloth', context);
      return `Purchase ${cloth} for uniforms`;
    },
    generateDescription: (context) => {
      const cloth = getCulturalItemForWork('cloth', context);
      const target = generateNearbyLocation(context, 20, 45);
      return `We need ${cloth} for official garments. Buy from the supplier ${target.name}.`;
    },
    generateRequirements: (context) => {
      const cloth = getCulturalItemForWork('cloth', context);
      const target = generateNearbyLocation(context, 20, 45);
      return {
        requiredItem: cloth,
        requiredQuantity: 5,
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 4
        }
      };
    },
    basePayment: 65,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 20, 45);
      return getDistanceMultiplier(context, target);
    }
  },

  // ===== EXPLORATION TASKS =====
  {
    id: 'city_explore_route',
    taskType: 'explore_location',
    weight: 7,
    requiredProfessions: ['official', 'surveyor', 'scout', 'road inspector'],
    generateTitle: () => 'Survey new route',
    generateDescription: (context) => {
      const target = generateNearbyLocation(context, 25, 60);
      return `We're planning a new route ${target.name}. Explore the area and report back on conditions.`;
    },
    generateRequirements: (context) => {
      const target = generateNearbyLocation(context, 25, 60);
      return {
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 5
        }
      };
    },
    basePayment: 75,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 25, 60);
      return getDistanceMultiplier(context, target) * 1.1;
    }
  },

  {
    id: 'city_explore_border',
    taskType: 'explore_location',
    weight: 6,
    requiredProfessions: ['official', 'surveyor', 'scout', 'border guard'],
    generateTitle: () => 'Check border area',
    generateDescription: (context) => {
      const target = generateNearbyLocation(context, 30, 70);
      return `Survey the border region ${target.name} and report what you find.`;
    },
    generateRequirements: (context) => {
      const target = generateNearbyLocation(context, 30, 70);
      return {
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 6
        }
      };
    },
    basePayment: 80,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 30, 70);
      return getDistanceMultiplier(context, target) * 1.15;
    }
  },

  // ===== INVESTIGATE TASKS =====
  {
    id: 'city_investigate_reports',
    taskType: 'investigate_and_report',
    weight: 8,
    requiredProfessions: ['official', 'inspector', 'investigator', 'magistrate'],
    generateTitle: () => 'Investigate local reports',
    generateDescription: (context) => {
      const target = generateNearbyLocation(context, 15, 35);
      return `There are reports of unusual activity ${target.name}. Investigate and report your findings.`;
    },
    generateRequirements: (context) => {
      const target = generateNearbyLocation(context, 15, 35);
      return {
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 4
        },
        requiresDialogue: true,
        conversationCount: 2
      };
    },
    basePayment: 70,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 15, 35);
      return getDistanceMultiplier(context, target) * 1.1;
    }
  },

  {
    id: 'city_investigate_complaints',
    taskType: 'investigate_and_report',
    weight: 7,
    requiredProfessions: ['official', 'inspector', 'magistrate', 'clerk'],
    generateTitle: () => 'Investigate complaints',
    generateDescription: (context) => {
      const target = generateNearbyLocation(context, 10, 25);
      return `Citizens ${target.name} have filed complaints. Speak with them and report back.`;
    },
    generateRequirements: (context) => {
      const target = generateNearbyLocation(context, 10, 25);
      return {
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 3
        },
        requiresDialogue: true,
        conversationCount: 3
      };
    },
    basePayment: 65,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 10, 25);
      return getDistanceMultiplier(context, target);
    }
  },

  // ===== GATHER TASKS =====
  {
    id: 'city_gather_tool_handles',
    taskType: 'gather_resource',
    weight: 6,
    requiredProfessions: ['official', 'quartermaster', 'carpenter', 'tool maker'],
    generateTitle: (context) => {
      const handle = getCulturalItemForWork('tool_handle', context);
      return `Gather ${handle}`;
    },
    generateDescription: (context) => {
      const handle = getCulturalItemForWork('tool_handle', context);
      return `City workshops need ${handle} for tool repairs. Gather some from the surrounding area.`;
    },
    generateRequirements: (context) => {
      const handle = getCulturalItemForWork('tool_handle', context);
      return {
        requiredItem: handle,
        requiredQuantity: 6,
        acceptedCategories: ['Material']
      };
    },
    basePayment: 45
  },

  // ===== CATEGORY-BASED TASKS =====
  {
    id: 'city_any_food',
    taskType: 'fetch_item',
    weight: 7,
    requiredProfessions: ['official', 'quartermaster', 'steward'],
    generateTitle: () => 'Provide food supplies',
    generateDescription: () => 'The city stores need replenishing. Bring any food supplies you can find.',
    generateRequirements: () => ({
      acceptsAnyItem: true,
      acceptedCategories: ['Food'],
      requiredQuantity: 3
    }),
    basePayment: 50
  },

  {
    id: 'city_any_tools',
    taskType: 'fetch_item',
    weight: 6,
    requiredProfessions: ['official', 'quartermaster', 'tool maker'],
    generateTitle: () => 'Acquire tools',
    generateDescription: () => 'City workers need tools. Bring any tools you come across.',
    generateRequirements: () => ({
      acceptsAnyItem: true,
      acceptedCategories: ['Tool'],
      requiredQuantity: 2
    }),
    basePayment: 55
  }
];
