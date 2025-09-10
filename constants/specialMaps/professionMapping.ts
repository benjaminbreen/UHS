/**
 * constants/specialMaps/professionMapping.ts
 * Maps professions from professions.ts to categories for special map NPC placement
 */

import { ProfessionCategory } from '../../types/specialMapTypes';
import { HistoricalEra, CulturalZone } from '../../types';
import { PROFESSIONS } from '../characterData/professions';

// Map specific profession names to categories
export const PROFESSION_CATEGORIES: Record<string, ProfessionCategory> = {
  // NOBILITY
  'Knight': ProfessionCategory.NOBILITY,
  'Duke': ProfessionCategory.NOBILITY,
  'Duchess': ProfessionCategory.NOBILITY,
  'Baron': ProfessionCategory.NOBILITY,
  'Count': ProfessionCategory.NOBILITY,
  'Earl': ProfessionCategory.NOBILITY,
  'King': ProfessionCategory.NOBILITY,
  'Queen': ProfessionCategory.NOBILITY,
  'Queen Mother': ProfessionCategory.NOBILITY,
  'Prince': ProfessionCategory.NOBILITY,
  'Princess': ProfessionCategory.NOBILITY,
  'Noble': ProfessionCategory.NOBILITY,
  'Courtier': ProfessionCategory.NOBILITY,
  'Aristocrat': ProfessionCategory.NOBILITY,
  'Patrician': ProfessionCategory.NOBILITY,
  'Senator': ProfessionCategory.NOBILITY,
  'Daimyo': ProfessionCategory.NOBILITY,
  'Samurai': ProfessionCategory.NOBILITY,
  'Sultan': ProfessionCategory.NOBILITY,
  'Emir': ProfessionCategory.NOBILITY,
  'Pasha': ProfessionCategory.NOBILITY,
  'Sheikh': ProfessionCategory.NOBILITY,
  'Vizier': ProfessionCategory.NOBILITY,
  'Mandarin': ProfessionCategory.NOBILITY,
  'Oba': ProfessionCategory.NOBILITY,
  'Chief': ProfessionCategory.NOBILITY,
  'Elder': ProfessionCategory.NOBILITY,
  'Priest-King': ProfessionCategory.NOBILITY,
  
  // CLERGY
  'Priest': ProfessionCategory.CLERGY,
  'High Priest': ProfessionCategory.CLERGY,
  'Monk': ProfessionCategory.CLERGY,
  'Buddhist Monk': ProfessionCategory.CLERGY,
  'Shinto Priest': ProfessionCategory.CLERGY,
  'Hindu Priest': ProfessionCategory.CLERGY,
  'Bishop': ProfessionCategory.CLERGY,
  'Archbishop': ProfessionCategory.CLERGY,
  'Cardinal': ProfessionCategory.CLERGY,
  'Pope': ProfessionCategory.CLERGY,
  'Imam': ProfessionCategory.CLERGY,
  'Muezzin': ProfessionCategory.CLERGY,
  'Rabbi': ProfessionCategory.CLERGY,
  'Chaplain': ProfessionCategory.CLERGY,
  'Abbot': ProfessionCategory.CLERGY,
  'Nun': ProfessionCategory.CLERGY,
  'Friar': ProfessionCategory.CLERGY,
  'Augur': ProfessionCategory.CLERGY,
  'Oracle': ProfessionCategory.CLERGY,
  'Shaman': ProfessionCategory.CLERGY,
  'Druid': ProfessionCategory.CLERGY,
  'Islamic Scholar': ProfessionCategory.CLERGY,
  
  // MILITARY
  'Soldier': ProfessionCategory.MILITARY,
  'Guard': ProfessionCategory.MILITARY,
  'City Guard': ProfessionCategory.MILITARY,
  'Border Guard': ProfessionCategory.MILITARY,
  'Royal Guard': ProfessionCategory.MILITARY,
  'Imperial Guard': ProfessionCategory.MILITARY,
  'Palace Guard': ProfessionCategory.MILITARY,
  'Guard Captain': ProfessionCategory.MILITARY,
  'Captain': ProfessionCategory.MILITARY,
  'General': ProfessionCategory.MILITARY,
  'Admiral': ProfessionCategory.MILITARY,
  'Colonel': ProfessionCategory.MILITARY,
  'Lieutenant': ProfessionCategory.MILITARY,
  'Sergeant': ProfessionCategory.MILITARY,
  'Warrior': ProfessionCategory.MILITARY,
  'Archer': ProfessionCategory.MILITARY,
  'Cavalry': ProfessionCategory.MILITARY,
  'Janissary': ProfessionCategory.MILITARY,
  'Mamluk': ProfessionCategory.MILITARY,
  'Praetorian': ProfessionCategory.MILITARY,
  'Legionnaire': ProfessionCategory.MILITARY,
  'Centurion': ProfessionCategory.MILITARY,
  'Hoplite': ProfessionCategory.MILITARY,
  'Presidio Soldier': ProfessionCategory.MILITARY,
  'Security Guard': ProfessionCategory.MILITARY,
  'Security Chief': ProfessionCategory.MILITARY,
  'Security Officer': ProfessionCategory.MILITARY,
  'Police Officer': ProfessionCategory.MILITARY,
  'Policeman': ProfessionCategory.MILITARY,
  
  // MERCHANT
  'Merchant': ProfessionCategory.MERCHANT,
  'Trader': ProfessionCategory.MERCHANT,
  'Silk Merchant': ProfessionCategory.MERCHANT,
  'Spice Merchant': ProfessionCategory.MERCHANT,
  'Salt Merchant': ProfessionCategory.MERCHANT,
  'Wool Merchant': ProfessionCategory.MERCHANT,
  'Rice Merchant': ProfessionCategory.MERCHANT,
  'Carpet Merchant': ProfessionCategory.MERCHANT,
  'Tea Merchant': ProfessionCategory.MERCHANT,
  'Coffee Merchant': ProfessionCategory.MERCHANT,
  'Wine Merchant': ProfessionCategory.MERCHANT,
  'Cloth Merchant': ProfessionCategory.MERCHANT,
  'Grain Merchant': ProfessionCategory.MERCHANT,
  'Fur Trader': ProfessionCategory.MERCHANT,
  'Slave Trader': ProfessionCategory.MERCHANT,
  'Arms Dealer': ProfessionCategory.MERCHANT,
  'Jeweler': ProfessionCategory.MERCHANT,
  'Goldsmith': ProfessionCategory.MERCHANT,
  'Banker': ProfessionCategory.MERCHANT,
  'Money Changer': ProfessionCategory.MERCHANT,
  'Merchant Prince': ProfessionCategory.MERCHANT,
  'Shopkeeper': ProfessionCategory.MERCHANT,
  'Small Business Owner': ProfessionCategory.MERCHANT,
  'Salesman': ProfessionCategory.MERCHANT,
  
  // SCHOLAR
  'Scholar': ProfessionCategory.SCHOLAR,
  'Philosopher': ProfessionCategory.SCHOLAR,
  'Scientist': ProfessionCategory.SCHOLAR,
  'Astronomer': ProfessionCategory.SCHOLAR,
  'Mathematician': ProfessionCategory.SCHOLAR,
  'Alchemist': ProfessionCategory.SCHOLAR,
  'Historian': ProfessionCategory.SCHOLAR,
  'Geographer': ProfessionCategory.SCHOLAR,
  'Librarian': ProfessionCategory.SCHOLAR,
  'Scribe': ProfessionCategory.SCHOLAR,
  'Teacher': ProfessionCategory.SCHOLAR,
  'Professor': ProfessionCategory.SCHOLAR,
  'University Professor': ProfessionCategory.SCHOLAR,
  'Student': ProfessionCategory.SCHOLAR,
  'Calligrapher': ProfessionCategory.SCHOLAR,
  'Poet': ProfessionCategory.SCHOLAR,
  'Court Scholar': ProfessionCategory.SCHOLAR,
  'Confucian Scholar': ProfessionCategory.SCHOLAR,
  
  // ARTISAN
  'Artisan': ProfessionCategory.ARTISAN,
  'Craftsman': ProfessionCategory.ARTISAN,
  'Blacksmith': ProfessionCategory.ARTISAN,
  'Carpenter': ProfessionCategory.ARTISAN,
  'Mason': ProfessionCategory.ARTISAN,
  'Potter': ProfessionCategory.ARTISAN,
  'Weaver': ProfessionCategory.ARTISAN,
  'Tailor': ProfessionCategory.ARTISAN,
  'Cobbler': ProfessionCategory.ARTISAN,
  'Tanner': ProfessionCategory.ARTISAN,
  'Brewer': ProfessionCategory.ARTISAN,
  'Baker': ProfessionCategory.ARTISAN,
  'Butcher': ProfessionCategory.ARTISAN,
  'Artist': ProfessionCategory.ARTISAN,
  'Painter': ProfessionCategory.ARTISAN,
  'Sculptor': ProfessionCategory.ARTISAN,
  'Musician': ProfessionCategory.ARTISAN,
  'Court Musician': ProfessionCategory.ARTISAN,
  'Court Painter': ProfessionCategory.ARTISAN,
  'Bard': ProfessionCategory.ARTISAN,
  'Griot': ProfessionCategory.ARTISAN,
  'Silversmith': ProfessionCategory.ARTISAN,
  'Glassblower': ProfessionCategory.ARTISAN,
  'Perfumer': ProfessionCategory.ARTISAN,
  'Tea Master': ProfessionCategory.ARTISAN,
  
  // SERVANT
  'Servant': ProfessionCategory.SERVANT,
  'Butler': ProfessionCategory.SERVANT,
  'Maid': ProfessionCategory.SERVANT,
  'Cook': ProfessionCategory.SERVANT,
  'Chef': ProfessionCategory.SERVANT,
  'Gardener': ProfessionCategory.SERVANT,
  'Stable Boy': ProfessionCategory.SERVANT,
  'Groom': ProfessionCategory.SERVANT,
  'Chamberlain': ProfessionCategory.SERVANT,
  'Steward': ProfessionCategory.SERVANT,
  'Valet': ProfessionCategory.SERVANT,
  'Lady-in-Waiting': ProfessionCategory.SERVANT,
  'Page': ProfessionCategory.SERVANT,
  'Squire': ProfessionCategory.SERVANT,
  'Eunuch': ProfessionCategory.SERVANT,
  'Concubine': ProfessionCategory.SERVANT,
  'Harem Guard': ProfessionCategory.SERVANT,
  'Janitor': ProfessionCategory.SERVANT,
  'Cleaner': ProfessionCategory.SERVANT,
  
  // OFFICIAL
  'Bureaucrat': ProfessionCategory.OFFICIAL,
  'Administrator': ProfessionCategory.OFFICIAL,
  'Magistrate': ProfessionCategory.OFFICIAL,
  'County Magistrate': ProfessionCategory.OFFICIAL,
  'Judge': ProfessionCategory.OFFICIAL,
  'Bailiff': ProfessionCategory.OFFICIAL,
  'Clerk': ProfessionCategory.OFFICIAL,
  'Notary': ProfessionCategory.OFFICIAL,
  'Tax Collector': ProfessionCategory.OFFICIAL,
  'Census Taker': ProfessionCategory.OFFICIAL,
  'Ambassador': ProfessionCategory.OFFICIAL,
  'Diplomat': ProfessionCategory.OFFICIAL,
  'Minister': ProfessionCategory.OFFICIAL,
  'Chancellor': ProfessionCategory.OFFICIAL,
  'Secretary': ProfessionCategory.OFFICIAL,
  'Advisor': ProfessionCategory.OFFICIAL,
  'Counselor': ProfessionCategory.OFFICIAL,
  'Town Crier': ProfessionCategory.OFFICIAL,
  'Herald': ProfessionCategory.OFFICIAL,
  'Advocate': ProfessionCategory.OFFICIAL,
  'Lawyer': ProfessionCategory.OFFICIAL,
  'Attorney': ProfessionCategory.OFFICIAL,
  'Civil Servant': ProfessionCategory.OFFICIAL,
  'Office Manager': ProfessionCategory.OFFICIAL,
  'Politician': ProfessionCategory.OFFICIAL,
  'Governor': ProfessionCategory.OFFICIAL,
  'Mayor': ProfessionCategory.OFFICIAL,
  'Party Official': ProfessionCategory.OFFICIAL,
  'Modernizer': ProfessionCategory.OFFICIAL,
  'Reformer': ProfessionCategory.OFFICIAL,
  
  // COMMONER (default for any not categorized above)
  'Farmer': ProfessionCategory.COMMONER,
  'Peasant': ProfessionCategory.COMMONER,
  'Laborer': ProfessionCategory.COMMONER,
  'Worker': ProfessionCategory.COMMONER,
  'Farm Worker': ProfessionCategory.COMMONER,
  'Factory Worker': ProfessionCategory.COMMONER,
  'Construction Worker': ProfessionCategory.COMMONER,
  'Miner': ProfessionCategory.COMMONER,
  'Fisherman': ProfessionCategory.COMMONER,
  'Hunter': ProfessionCategory.COMMONER,
  'Shepherd': ProfessionCategory.COMMONER,
  'Herder': ProfessionCategory.COMMONER,
  'Pilgrim': ProfessionCategory.COMMONER,
  'Citizen': ProfessionCategory.COMMONER,
  'Commoner': ProfessionCategory.COMMONER,
  'Villager': ProfessionCategory.COMMONER,
  'Townsman': ProfessionCategory.COMMONER,
  'Beggar': ProfessionCategory.COMMONER,
  'Peddler': ProfessionCategory.COMMONER,
  'Porter': ProfessionCategory.COMMONER,
  'Messenger': ProfessionCategory.COMMONER,
  'Courier': ProfessionCategory.COMMONER,
  'Driver': ProfessionCategory.COMMONER,
  'Truck Driver': ProfessionCategory.COMMONER,
  'Cashier': ProfessionCategory.COMMONER,
  'Waiter': ProfessionCategory.COMMONER,
  'Bartender': ProfessionCategory.COMMONER,
  'Innkeeper': ProfessionCategory.COMMONER,
  'Nurse': ProfessionCategory.COMMONER,
  'Midwife': ProfessionCategory.COMMONER,
  'Barber': ProfessionCategory.COMMONER,
  'Accountant': ProfessionCategory.COMMONER,
  'Journalist': ProfessionCategory.COMMONER,
  'Writer': ProfessionCategory.COMMONER,
  'Mechanic': ProfessionCategory.COMMONER,
  'Engineer': ProfessionCategory.COMMONER,
  'Civil Engineer': ProfessionCategory.COMMONER,
  'Doctor': ProfessionCategory.COMMONER,
  'Surgeon': ProfessionCategory.COMMONER,
  'Healer': ProfessionCategory.COMMONER,
  'Apothecary': ProfessionCategory.COMMONER,
  'Entertainer': ProfessionCategory.COMMONER,
  'Actor': ProfessionCategory.COMMONER,
  'Dancer': ProfessionCategory.COMMONER,
  'Prostitute': ProfessionCategory.COMMONER,
  'Courtesan': ProfessionCategory.COMMONER,
  'Spy': ProfessionCategory.COMMONER,
  'Assassin': ProfessionCategory.COMMONER,
  'Thief': ProfessionCategory.COMMONER,
  'Smuggler': ProfessionCategory.COMMONER,
  'Pirate': ProfessionCategory.COMMONER,
  'Mercenary': ProfessionCategory.COMMONER,
  'Gladiator': ProfessionCategory.COMMONER,
  'Athlete': ProfessionCategory.COMMONER,
  'Sailor': ProfessionCategory.COMMONER,
  'Navigator': ProfessionCategory.COMMONER,
  'Ship Captain': ProfessionCategory.COMMONER,
  'Explorer': ProfessionCategory.COMMONER,
  'Interpreter': ProfessionCategory.COMMONER,
  'Guide': ProfessionCategory.COMMONER
};

/**
 * Get professions by category for a specific culture/era
 */
export function getProfessionsByCategory(
  category: ProfessionCategory,
  culturalZone: CulturalZone,
  era: HistoricalEra
): string[] {
  const cultureProfessions = PROFESSIONS[culturalZone]?.[era];
  if (!cultureProfessions) return [];
  
  const results: string[] = [];
  
  // Search through all social classes in that culture/era
  for (const socialClass of Object.values(cultureProfessions)) {
    if (typeof socialClass === 'object' && socialClass !== null) {
      for (const [profName] of Object.entries(socialClass)) {
        if (PROFESSION_CATEGORIES[profName] === category) {
          results.push(profName);
        }
      }
    }
  }
  
  // If no results, return some defaults based on category
  if (results.length === 0) {
    switch (category) {
      case ProfessionCategory.NOBILITY:
        return ['Noble', 'Aristocrat'];
      case ProfessionCategory.CLERGY:
        return ['Priest', 'Monk'];
      case ProfessionCategory.MILITARY:
        return ['Guard', 'Soldier'];
      case ProfessionCategory.MERCHANT:
        return ['Merchant', 'Trader'];
      case ProfessionCategory.SCHOLAR:
        return ['Scholar'];
      case ProfessionCategory.ARTISAN:
        return ['Craftsman', 'Artisan'];
      case ProfessionCategory.SERVANT:
        return ['Servant'];
      case ProfessionCategory.OFFICIAL:
        return ['Clerk', 'Bureaucrat'];
      case ProfessionCategory.COMMONER:
        return ['Citizen', 'Worker'];
    }
  }
  
  return results;
}

/**
 * Get the category for a specific profession
 */
export function getCategoryForProfession(profession: string): ProfessionCategory {
  return PROFESSION_CATEGORIES[profession] || ProfessionCategory.COMMONER;
}

/**
 * Get the social class for a profession in a specific culture/era
 */
export function getSocialClassForProfession(
  profession: string,
  culturalZone: CulturalZone,
  era: HistoricalEra
): string | null {
  const cultureProfessions = PROFESSIONS[culturalZone]?.[era];
  if (!cultureProfessions) return null;
  
  for (const [socialClass, roles] of Object.entries(cultureProfessions)) {
    if (typeof roles === 'object' && roles !== null) {
      if (profession in roles) {
        return socialClass;
      }
    }
  }
  
  return null;
}

/**
 * Comprehensive culture-profession mappings by room type
 * These provide fallbacks when specific professions aren't defined
 */
export const CULTURE_PROFESSION_DEFAULTS: Record<string, Record<string, string[]>> = {
  // Native American cultures
  'NORTH_AMERICAN_PRE_COLUMBIAN': {
    'sanctuary': ['Shaman', 'Elder', 'Vision_Seeker', 'Medicine_Woman', 'Warrior'],
    'council': ['Chief', 'Elder', 'Warrior', 'Hunter', 'Scout'],
    'marketplace': ['Trader', 'Craftsman', 'Hunter', 'Farmer', 'Weaver'],
    'hall': ['Elder', 'Warrior', 'Villager', 'Hunter', 'Gatherer'],
    'throne_room': ['Chief', 'Elder', 'Shaman', 'Warrior'],
    'courtyard': ['Hunter', 'Scout', 'Gatherer', 'Youth'],
    'library': ['Storyteller', 'Elder', 'Keeper_of_Records'],
    'barracks': ['Warrior', 'Scout', 'Hunter'],
    'default': ['Villager', 'Hunter', 'Gatherer']
  },
  
  'NORTH_AMERICAN_COLONIAL': {
    'sanctuary': ['Shaman', 'Elder', 'Medicine_Man', 'Healer'],
    'council': ['Chief', 'Elder', 'Warrior', 'Hunter'],
    'marketplace': ['Trader', 'Trapper', 'Craftsman', 'Farmer'],
    'hall': ['Elder', 'Warrior', 'Settler', 'Hunter'],
    'default': ['Villager', 'Hunter', 'Farmer']
  },
  
  'NATIVE_AMERICAN': {
    'sanctuary': ['Shaman', 'Elder', 'Healer', 'Vision_Seeker'],
    'council': ['Chief', 'Elder', 'Warrior', 'Scout'],
    'marketplace': ['Trader', 'Craftsman', 'Hunter'],
    'hall': ['Elder', 'Warrior', 'Villager'],
    'default': ['Villager', 'Hunter', 'Gatherer']
  },
  
  // African cultures
  'SUB_SAHARAN_AFRICAN': {
    'sanctuary': ['Priest', 'Griot', 'Healer', 'Diviner', 'Elder'],
    'council': ['Chief', 'Elder', 'Warrior', 'Noble', 'Griot'],
    'marketplace': ['Trader', 'Craftsman', 'Farmer', 'Herder', 'Merchant'],
    'hall': ['Noble', 'Warrior', 'Citizen', 'Craftsman'],
    'throne_room': ['King', 'Queen_Mother', 'Noble', 'Griot', 'Warrior'],
    'courtyard': ['Warrior', 'Craftsman', 'Farmer', 'Youth'],
    'library': ['Griot', 'Scholar', 'Scribe'],
    'barracks': ['Warrior', 'Guard', 'Scout'],
    'default': ['Citizen', 'Farmer', 'Herder']
  },
  
  // Asian cultures
  'EAST_ASIAN': {
    'sanctuary': ['Monk', 'Priest', 'Abbot', 'Pilgrim', 'Acolyte'],
    'council': ['Mandarin', 'Scholar', 'Official', 'Magistrate'],
    'marketplace': ['Merchant', 'Trader', 'Craftsman', 'Customer', 'Porter'],
    'hall': ['Scholar', 'Official', 'Citizen', 'Servant'],
    'throne_room': ['Emperor', 'Mandarin', 'Eunuch', 'Court_Lady', 'Guard'],
    'courtyard': ['Scholar', 'Student', 'Gardener', 'Servant'],
    'library': ['Scholar', 'Scribe', 'Librarian', 'Student'],
    'barracks': ['Samurai', 'Soldier', 'Guard', 'Captain'],
    'default': ['Citizen', 'Farmer', 'Merchant']
  },
  
  'SOUTH_ASIAN': {
    'sanctuary': ['Priest', 'Brahmin', 'Sadhu', 'Pilgrim', 'Devotee'],
    'council': ['Raja', 'Minister', 'Advisor', 'Noble'],
    'marketplace': ['Merchant', 'Trader', 'Craftsman', 'Customer'],
    'hall': ['Noble', 'Scholar', 'Citizen', 'Servant'],
    'throne_room': ['Raja', 'Rani', 'Minister', 'Guard', 'Courtier'],
    'courtyard': ['Merchant', 'Craftsman', 'Citizen'],
    'library': ['Pandit', 'Scholar', 'Scribe', 'Student'],
    'barracks': ['Warrior', 'Guard', 'Soldier'],
    'default': ['Citizen', 'Farmer', 'Merchant']
  },
  
  // Middle Eastern cultures
  'MENA': {
    'sanctuary': ['Imam', 'Muezzin', 'Scholar', 'Pilgrim', 'Dervish'],
    'council': ['Vizier', 'Emir', 'Qadi', 'Sheikh', 'Merchant'],
    'marketplace': ['Merchant', 'Trader', 'Craftsman', 'Customer', 'Porter'],
    'hall': ['Official', 'Scholar', 'Citizen', 'Guard'],
    'throne_room': ['Sultan', 'Vizier', 'Emir', 'Guard', 'Eunuch'],
    'courtyard': ['Merchant', 'Craftsman', 'Scholar', 'Citizen'],
    'library': ['Scholar', 'Scribe', 'Astronomer', 'Student'],
    'barracks': ['Mamluk', 'Janissary', 'Guard', 'Soldier'],
    'default': ['Citizen', 'Merchant', 'Craftsman']
  },
  
  // European cultures
  'EUROPEAN': {
    'sanctuary': ['Priest', 'Monk', 'Bishop', 'Pilgrim', 'Nun'],
    'council': ['Senator', 'Magistrate', 'Councilor', 'Noble'],
    'marketplace': ['Merchant', 'Trader', 'Craftsman', 'Customer', 'Guard'],
    'hall': ['Noble', 'Knight', 'Citizen', 'Servant'],
    'throne_room': ['King', 'Queen', 'Duke', 'Knight', 'Courtier'],
    'courtyard': ['Knight', 'Squire', 'Citizen', 'Servant'],
    'library': ['Scholar', 'Scribe', 'Monk', 'Student'],
    'barracks': ['Knight', 'Soldier', 'Guard', 'Captain'],
    'default': ['Citizen', 'Peasant', 'Merchant']
  },
  
  // South American cultures
  'SOUTH_AMERICAN': {
    'sanctuary': ['Priest', 'Shaman', 'Oracle', 'Acolyte'],
    'council': ['Inca', 'Noble', 'Priest', 'General'],
    'marketplace': ['Trader', 'Craftsman', 'Farmer', 'Porter'],
    'hall': ['Noble', 'Warrior', 'Citizen', 'Servant'],
    'throne_room': ['Inca', 'Queen', 'Priest', 'Noble', 'Guard'],
    'courtyard': ['Warrior', 'Craftsman', 'Farmer'],
    'library': ['Quipu_Keeper', 'Scribe', 'Priest'],
    'barracks': ['Warrior', 'Guard', 'Scout'],
    'default': ['Citizen', 'Farmer', 'Porter']
  },
  
  // Oceanic cultures
  'OCEANIA': {
    'sanctuary': ['Kahuna', 'Priest', 'Elder', 'Healer'],
    'council': ['Chief', 'Elder', 'Navigator', 'Warrior'],
    'marketplace': ['Trader', 'Fisherman', 'Craftsman', 'Farmer'],
    'hall': ['Elder', 'Warrior', 'Islander', 'Fisherman'],
    'throne_room': ['Chief', 'Queen', 'Elder', 'Warrior'],
    'courtyard': ['Warrior', 'Fisherman', 'Craftsman'],
    'library': ['Navigator', 'Storyteller', 'Elder'],
    'barracks': ['Warrior', 'Guard', 'Scout'],
    'default': ['Islander', 'Fisherman', 'Farmer']
  },
  
  'OCEANIC': {
    'sanctuary': ['Kahuna', 'Priest', 'Elder', 'Healer'],
    'council': ['Chief', 'Elder', 'Navigator', 'Warrior'],
    'marketplace': ['Trader', 'Fisherman', 'Craftsman'],
    'hall': ['Elder', 'Warrior', 'Islander'],
    'default': ['Islander', 'Fisherman', 'Farmer']
  }
};

/**
 * Get culture-appropriate default professions for a room type
 */
export function getCultureDefaultProfessions(
  culture: string,
  roomType: string
): string[] {
  // Check for exact culture match
  const cultureProfessions = CULTURE_PROFESSION_DEFAULTS[culture];
  if (cultureProfessions) {
    // Check for exact room type match
    if (cultureProfessions[roomType]) {
      return cultureProfessions[roomType];
    }
    // Fall back to default for this culture
    if (cultureProfessions['default']) {
      return cultureProfessions['default'];
    }
  }
  
  // Universal fallbacks by room type
  const universalDefaults: Record<string, string[]> = {
    'sanctuary': ['Priest', 'Pilgrim', 'Worshipper', 'Acolyte'],
    'council': ['Elder', 'Official', 'Guard', 'Noble'],
    'marketplace': ['Merchant', 'Customer', 'Guard', 'Trader'],
    'hall': ['Citizen', 'Worker', 'Visitor', 'Guard'],
    'throne_room': ['Noble', 'Guard', 'Courtier', 'Servant'],
    'courtyard': ['Citizen', 'Guard', 'Worker'],
    'library': ['Scholar', 'Scribe', 'Student'],
    'barracks': ['Soldier', 'Guard', 'Captain'],
    'assembly': ['Official', 'Elder', 'Citizen'],
    'forum': ['Senator', 'Citizen', 'Merchant']
  };
  
  return universalDefaults[roomType] || ['Citizen', 'Worker', 'Visitor'];
}