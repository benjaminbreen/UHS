/**
 * constants/workOfferTemplates/marketplaceTemplates.ts
 *
 * Work offer templates for marketplace merchants and traders.
 * Uses cultural item mapping for historically-accurate content.
 *
 * Created: December 2024 (Phase 2 of work system expansion)
 */

import { WorkTemplate } from '../../services/workOfferGenerationService';
import { getCulturalItemForWork, generateNearbyLocation, getDistanceMultiplier } from '../../services/workOfferGenerationService';

export const MARKETPLACE_TEMPLATES: WorkTemplate[] = [
  // ===== DELIVERY TASKS =====
  {
    id: 'marketplace_grain_delivery',
    taskType: 'deliver_to_location',
    weight: 10,
    requiredProfessions: ['merchant', 'trader', 'shopkeeper', 'grain seller'],
    generateTitle: (context) => {
      const grain = getCulturalItemForWork('grain', context);
      return `Deliver ${grain} to nearby settlement`;
    },
    generateDescription: (context) => {
      const grain = getCulturalItemForWork('grain', context);
      const target = generateNearbyLocation(context, 15, 40);
      return `I need someone to deliver a shipment of ${grain} to ${target.name}. The buyer is waiting and will confirm receipt.`;
    },
    generateRequirements: (context) => {
      const grain = getCulturalItemForWork('grain', context);
      const target = generateNearbyLocation(context, 15, 40);
      return {
        requiredItem: grain,
        requiredQuantity: 5,
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 3
        }
      };
    },
    basePayment: 50,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 15, 40);
      return getDistanceMultiplier(context, target);
    }
  },

  {
    id: 'marketplace_cloth_delivery',
    taskType: 'deliver_to_location',
    weight: 8,
    requiredProfessions: ['merchant', 'trader', 'cloth seller', 'weaver'],
    generateTitle: (context) => {
      const cloth = getCulturalItemForWork('cloth', context);
      return `Deliver ${cloth} to customer`;
    },
    generateDescription: (context) => {
      const cloth = getCulturalItemForWork('cloth', context);
      const target = generateNearbyLocation(context, 10, 30);
      return `A customer ${target.name} ordered ${cloth}. Can you deliver it? They'll be expecting you.`;
    },
    generateRequirements: (context) => {
      const cloth = getCulturalItemForWork('cloth', context);
      const target = generateNearbyLocation(context, 10, 30);
      return {
        requiredItem: cloth,
        requiredQuantity: 3,
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 3
        }
      };
    },
    basePayment: 40,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 10, 30);
      return getDistanceMultiplier(context, target);
    }
  },

  {
    id: 'marketplace_spice_delivery',
    taskType: 'deliver_to_location',
    weight: 7,
    requiredProfessions: ['merchant', 'trader', 'spice seller'],
    generateTitle: (context) => {
      const spice = getCulturalItemForWork('spice', context);
      return `Deliver ${spice} to chef`;
    },
    generateDescription: (context) => {
      const spice = getCulturalItemForWork('spice', context);
      const target = generateNearbyLocation(context, 5, 20);
      return `A cook ${target.name} needs ${spice} urgently. Deliver it and they'll pay well.`;
    },
    generateRequirements: (context) => {
      const spice = getCulturalItemForWork('spice', context);
      const target = generateNearbyLocation(context, 5, 20);
      return {
        requiredItem: spice,
        requiredQuantity: 2,
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 2
        }
      };
    },
    basePayment: 60,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 5, 20);
      return getDistanceMultiplier(context, target) * 1.2; // Spices pay better
    }
  },

  // ===== FETCH TASKS =====
  {
    id: 'marketplace_fetch_oil',
    taskType: 'fetch_item',
    weight: 9,
    requiredProfessions: ['merchant', 'trader', 'shopkeeper', 'oil seller'],
    generateTitle: (context) => {
      const oil = getCulturalItemForWork('oil', context);
      return `Bring me ${oil}`;
    },
    generateDescription: (context) => {
      const oil = getCulturalItemForWork('oil', context);
      return `I'm running low on ${oil}. If you can bring me some, I'll pay you for it.`;
    },
    generateRequirements: (context) => {
      const oil = getCulturalItemForWork('oil', context);
      return {
        requiredItem: oil,
        requiredQuantity: 3
      };
    },
    basePayment: 45
  },

  {
    id: 'marketplace_fetch_rope',
    taskType: 'fetch_item',
    weight: 8,
    requiredProfessions: ['merchant', 'trader', 'rope maker'],
    generateTitle: (context) => {
      const rope = getCulturalItemForWork('rope', context);
      return `Need ${rope}`;
    },
    generateDescription: (context) => {
      const rope = getCulturalItemForWork('rope', context);
      return `My supply of ${rope} is exhausted. Bring me some and I'll make it worth your while.`;
    },
    generateRequirements: (context) => {
      const rope = getCulturalItemForWork('rope', context);
      return {
        requiredItem: rope,
        requiredQuantity: 2
      };
    },
    basePayment: 35
  },

  {
    id: 'marketplace_fetch_preserved_fish',
    taskType: 'fetch_item',
    weight: 7,
    requiredProfessions: ['merchant', 'trader', 'food seller', 'fishmonger'],
    generateTitle: (context) => {
      const fish = getCulturalItemForWork('preserved_fish', context);
      return `Bring me ${fish}`;
    },
    generateDescription: (context) => {
      const fish = getCulturalItemForWork('preserved_fish', context);
      return `I need ${fish} for my shop. Bring some and I'll pay you.`;
    },
    generateRequirements: (context) => {
      const fish = getCulturalItemForWork('preserved_fish', context);
      return {
        requiredItem: fish,
        requiredQuantity: 4
      };
    },
    basePayment: 40
  },

  {
    id: 'marketplace_fetch_dye',
    taskType: 'fetch_item',
    weight: 6,
    requiredProfessions: ['merchant', 'trader', 'dyer', 'cloth seller'],
    generateTitle: (context) => {
      const dye = getCulturalItemForWork('dye', context);
      return `Need ${dye} urgently`;
    },
    generateDescription: (context) => {
      const dye = getCulturalItemForWork('dye', context);
      return `I have cloth orders but no ${dye}. Bring me some quickly.`;
    },
    generateRequirements: (context) => {
      const dye = getCulturalItemForWork('dye', context);
      return {
        requiredItem: dye,
        requiredQuantity: 2
      };
    },
    basePayment: 55
  },

  // ===== BUY FROM LOCATION TASKS =====
  {
    id: 'marketplace_buy_sweetener',
    taskType: 'buy_from_location',
    weight: 8,
    requiredProfessions: ['merchant', 'trader', 'food seller'],
    generateTitle: (context) => {
      const sweetener = getCulturalItemForWork('sweetener', context);
      return `Purchase ${sweetener} from supplier`;
    },
    generateDescription: (context) => {
      const sweetener = getCulturalItemForWork('sweetener', context);
      const target = generateNearbyLocation(context, 20, 45);
      return `There's a supplier ${target.name} selling ${sweetener}. Buy some for me and I'll reimburse you plus extra.`;
    },
    generateRequirements: (context) => {
      const sweetener = getCulturalItemForWork('sweetener', context);
      const target = generateNearbyLocation(context, 20, 45);
      return {
        requiredItem: sweetener,
        requiredQuantity: 3,
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 5
        }
      };
    },
    basePayment: 50,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 20, 45);
      return getDistanceMultiplier(context, target) * 1.1;
    }
  },

  {
    id: 'marketplace_buy_medicine',
    taskType: 'buy_from_location',
    weight: 7,
    requiredProfessions: ['merchant', 'trader', 'healer', 'medicine seller'],
    generateTitle: (context) => {
      const medicine = getCulturalItemForWork('medicine', context);
      return `Purchase ${medicine}`;
    },
    generateDescription: (context) => {
      const medicine = getCulturalItemForWork('medicine', context);
      const target = generateNearbyLocation(context, 15, 35);
      return `I need ${medicine} from a supplier ${target.name}. Buy it and bring it back.`;
    },
    generateRequirements: (context) => {
      const medicine = getCulturalItemForWork('medicine', context);
      const target = generateNearbyLocation(context, 15, 35);
      return {
        requiredItem: medicine,
        requiredQuantity: 2,
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
      const target = generateNearbyLocation(context, 15, 35);
      return getDistanceMultiplier(context, target) * 1.3; // Medicine pays well
    }
  },

  // ===== GATHER RESOURCE TASKS =====
  {
    id: 'marketplace_gather_fuel',
    taskType: 'gather_resource',
    weight: 9,
    requiredProfessions: ['merchant', 'trader', 'fuel seller'],
    generateTitle: (context) => {
      const fuel = getCulturalItemForWork('fuel', context);
      return `Gather ${fuel}`;
    },
    generateDescription: (context) => {
      const fuel = getCulturalItemForWork('fuel', context);
      return `I need ${fuel} for heating. Gather some from the surrounding area and I'll buy it from you.`;
    },
    generateRequirements: (context) => {
      const fuel = getCulturalItemForWork('fuel', context);
      return {
        requiredItem: fuel,
        requiredQuantity: 8,
        acceptedCategories: ['Material']
      };
    },
    basePayment: 35
  },

  {
    id: 'marketplace_gather_building_material',
    taskType: 'gather_resource',
    weight: 7,
    requiredProfessions: ['merchant', 'trader', 'carpenter', 'builder'],
    generateTitle: (context) => {
      const material = getCulturalItemForWork('building_material', context);
      return `Gather ${material}`;
    },
    generateDescription: (context) => {
      const material = getCulturalItemForWork('building_material', context);
      return `I have construction projects that need ${material}. Gather some and bring it here.`;
    },
    generateRequirements: (context) => {
      const material = getCulturalItemForWork('building_material', context);
      return {
        requiredItem: material,
        requiredQuantity: 5,
        acceptedCategories: ['Material']
      };
    },
    basePayment: 45
  },

  // ===== MIXED CATEGORY FETCH TASKS =====
  {
    id: 'marketplace_any_tool',
    taskType: 'fetch_item',
    weight: 6,
    requiredProfessions: ['merchant', 'trader', 'tool seller'],
    generateTitle: () => 'Bring me any tool',
    generateDescription: () => 'I buy and sell tools. Bring me any tool you can find and I\'ll purchase it.',
    generateRequirements: () => ({
      acceptsAnyItem: true,
      acceptedCategories: ['Tool'],
      requiredQuantity: 1
    }),
    basePayment: 40
  },

  {
    id: 'marketplace_any_weapon',
    taskType: 'fetch_item',
    weight: 5,
    requiredProfessions: ['merchant', 'trader', 'weapons dealer', 'armorer'],
    generateTitle: () => 'Bring me weapons',
    generateDescription: () => 'I deal in weapons. Bring me any weapons you come across and I\'ll make an offer.',
    generateRequirements: () => ({
      acceptsAnyItem: true,
      acceptedCategories: ['Weapon'],
      requiredQuantity: 1
    }),
    basePayment: 50
  },

  {
    id: 'marketplace_any_document',
    taskType: 'fetch_item',
    weight: 4,
    requiredProfessions: ['merchant', 'trader', 'scribe', 'scholar'],
    generateTitle: () => 'Acquire documents',
    generateDescription: () => 'I collect written materials. Bring me any documents, scrolls, or books you find.',
    generateRequirements: () => ({
      acceptsAnyItem: true,
      acceptedCategories: ['Document'],
      requiredQuantity: 1
    }),
    basePayment: 60
  },

  // ===== GENERIC TASKS (NO PROFESSION REQUIRED) =====
  // These can be offered by any NPC in the marketplace

  {
    id: 'generic_help_moving',
    taskType: 'deliver_to_location',
    weight: 12,
    // No requiredProfessions - anyone can offer this
    generateTitle: () => 'Help move supplies',
    generateDescription: (context) => {
      const target = generateNearbyLocation(context, 5, 15);
      return `I need help moving some things ${target.name}. Can you deliver this for me?`;
    },
    generateRequirements: (context) => {
      const target = generateNearbyLocation(context, 5, 15);
      return {
        acceptedCategories: ['Material'],
        requiredQuantity: 2,
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 2
        }
      };
    },
    basePayment: 30,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 5, 15);
      return getDistanceMultiplier(context, target);
    }
  },

  {
    id: 'generic_fetch_food',
    taskType: 'fetch_item',
    weight: 15,
    // No requiredProfessions - anyone needs food
    generateTitle: () => 'Bring me food',
    generateDescription: () => 'I need something to eat. Bring me any food you can spare.',
    generateRequirements: () => ({
      acceptsAnyItem: true,
      acceptedCategories: ['Food'],
      requiredQuantity: 2
    }),
    basePayment: 25
  },

  {
    id: 'generic_deliver_message',
    taskType: 'deliver_to_location',
    weight: 14,
    // No requiredProfessions - anyone can send a message
    generateTitle: () => 'Deliver a message',
    generateDescription: (context) => {
      const target = generateNearbyLocation(context, 8, 20);
      return `I need you to deliver a message to someone ${target.name}. It's urgent.`;
    },
    generateRequirements: (context) => {
      const target = generateNearbyLocation(context, 8, 20);
      return {
        acceptedCategories: ['Document'],
        requiredQuantity: 1,
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 2
        }
      };
    },
    basePayment: 35,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 8, 20);
      return getDistanceMultiplier(context, target) * 1.15;
    }
  },

  {
    id: 'generic_gather_materials',
    taskType: 'gather_resource',
    weight: 13,
    // No requiredProfessions - anyone can gather
    generateTitle: (context) => {
      const material = getCulturalItemForWork('building_material', context);
      return `Gather ${material}`;
    },
    generateDescription: (context) => {
      const material = getCulturalItemForWork('building_material', context);
      return `I need ${material} for a project. Gather some from around here and I'll pay you.`;
    },
    generateRequirements: (context) => {
      const material = getCulturalItemForWork('building_material', context);
      return {
        requiredItem: material,
        requiredQuantity: 3,
        acceptedCategories: ['Material']
      };
    },
    basePayment: 30
  },

  {
    id: 'generic_find_tool',
    taskType: 'fetch_item',
    weight: 10,
    // No requiredProfessions - anyone might need a tool
    generateTitle: () => 'Find me a tool',
    generateDescription: () => 'I lost my tools. If you have any to spare, I can pay you for one.',
    generateRequirements: () => ({
      acceptsAnyItem: true,
      acceptedCategories: ['Tool'],
      requiredQuantity: 1
    }),
    basePayment: 40
  },

  {
    id: 'generic_exploration',
    taskType: 'explore_location',
    weight: 8,
    // No requiredProfessions - anyone can explore
    generateTitle: () => 'Scout the area',
    generateDescription: (context) => {
      const target = generateNearbyLocation(context, 15, 35);
      return `I heard something might be ${target.name}. Go check it out and report back.`;
    },
    generateRequirements: (context) => {
      const target = generateNearbyLocation(context, 15, 35);
      return {
        targetLocation: {
          x: target.x,
          y: target.y,
          name: target.name,
          radius: 4
        }
      };
    },
    basePayment: 45,
    paymentMultiplier: (context) => {
      const target = generateNearbyLocation(context, 15, 35);
      return getDistanceMultiplier(context, target);
    }
  }
];
