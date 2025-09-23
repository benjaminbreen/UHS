/**
 * Profession to Game Mode Mappings
 * Maps professions to their appropriate game modes with weighted probabilities
 */

import { GameModeType } from '../../types/eventTypes';

export interface GameModeWeight {
  mode: GameModeType;
  weight: number;
}

/**
 * Comprehensive mapping of professions to their suggested game modes
 * Weights determine the probability of each mode being selected
 */
export const PROFESSION_MODE_MAPPINGS: Record<string, GameModeWeight[]> = {
  // ===== LEADERSHIP & NOBILITY =====
  'King': [{mode: 'leadership', weight: 70}, {mode: 'diplomacy', weight: 20}, {mode: 'legal', weight: 10}],
  'Queen Mother': [{mode: 'leadership', weight: 60}, {mode: 'diplomacy', weight: 30}, {mode: 'legal', weight: 10}],
  'Sultan': [{mode: 'leadership', weight: 70}, {mode: 'diplomacy', weight: 20}, {mode: 'legal', weight: 10}],
  'Sapa Inca': [{mode: 'leadership', weight: 80}, {mode: 'diplomacy', weight: 20}],
  'Oba': [{mode: 'leadership', weight: 70}, {mode: 'diplomacy', weight: 20}, {mode: 'legal', weight: 10}],
  'Chief': [{mode: 'leadership', weight: 60}, {mode: 'diplomacy', weight: 25}, {mode: 'livelihood', weight: 15}],
  'War Chief': [{mode: 'leadership', weight: 50}, {mode: 'survival', weight: 30}, {mode: 'diplomacy', weight: 20}],
  'War Leader': [{mode: 'leadership', weight: 50}, {mode: 'survival', weight: 30}, {mode: 'diplomacy', weight: 20}],
  'Village Chief': [{mode: 'leadership', weight: 50}, {mode: 'diplomacy', weight: 30}, {mode: 'livelihood', weight: 20}],
  'Paramount Chief': [{mode: 'leadership', weight: 60}, {mode: 'diplomacy', weight: 30}, {mode: 'legal', weight: 10}],
  'Village Elder': [{mode: 'leadership', weight: 40}, {mode: 'legal', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Village Headman': [{mode: 'leadership', weight: 45}, {mode: 'diplomacy', weight: 25}, {mode: 'livelihood', weight: 30}],
  'Lady': [{mode: 'diplomacy', weight: 40}, {mode: 'leadership', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Knight': [{mode: 'leadership', weight: 40}, {mode: 'exploration', weight: 30}, {mode: 'survival', weight: 30}],
  'Samurai': [{mode: 'leadership', weight: 40}, {mode: 'legal', weight: 30}, {mode: 'survival', weight: 30}],
  'Ronin': [{mode: 'survival', weight: 40}, {mode: 'exploration', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Squire': [{mode: 'livelihood', weight: 50}, {mode: 'leadership', weight: 25}, {mode: 'exploration', weight: 25}],
  'Page': [{mode: 'livelihood', weight: 60}, {mode: 'diplomacy', weight: 40}],

  // ===== GOVERNMENT & ADMINISTRATION =====
  'Colonial Governor': [{mode: 'leadership', weight: 50}, {mode: 'diplomacy', weight: 30}, {mode: 'commerce', weight: 20}],
  'Spanish Viceroy': [{mode: 'leadership', weight: 60}, {mode: 'diplomacy', weight: 25}, {mode: 'legal', weight: 15}],
  'Provincial Governor': [{mode: 'leadership', weight: 50}, {mode: 'legal', weight: 30}, {mode: 'diplomacy', weight: 20}],
  'Local Governor': [{mode: 'leadership', weight: 45}, {mode: 'legal', weight: 35}, {mode: 'livelihood', weight: 20}],
  'County Magistrate': [{mode: 'legal', weight: 60}, {mode: 'leadership', weight: 25}, {mode: 'scholarship', weight: 15}],
  'Local Magistrate': [{mode: 'legal', weight: 55}, {mode: 'leadership', weight: 30}, {mode: 'livelihood', weight: 15}],
  'Judge': [{mode: 'legal', weight: 80}, {mode: 'scholarship', weight: 20}],
  'Lawyer': [{mode: 'legal', weight: 70}, {mode: 'scholarship', weight: 20}, {mode: 'commerce', weight: 10}],
  'Politician': [{mode: 'leadership', weight: 40}, {mode: 'diplomacy', weight: 40}, {mode: 'legal', weight: 20}],
  'President': [{mode: 'leadership', weight: 70}, {mode: 'diplomacy', weight: 30}],
  'CEO': [{mode: 'leadership', weight: 40}, {mode: 'commerce', weight: 50}, {mode: 'diplomacy', weight: 10}],
  'Tech CEO': [{mode: 'leadership', weight: 35}, {mode: 'commerce', weight: 55}, {mode: 'exploration', weight: 10}],

  // ===== COMMERCE & TRADE =====
  'Merchant': [{mode: 'commerce', weight: 70}, {mode: 'diplomacy', weight: 20}, {mode: 'livelihood', weight: 10}],
  'Trader': [{mode: 'commerce', weight: 60}, {mode: 'exploration', weight: 30}, {mode: 'livelihood', weight: 10}],
  'Silk Merchant': [{mode: 'commerce', weight: 75}, {mode: 'diplomacy', weight: 25}],
  'Silk Trader': [{mode: 'commerce', weight: 70}, {mode: 'exploration', weight: 20}, {mode: 'diplomacy', weight: 10}],
  'Silk Road Trader': [{mode: 'commerce', weight: 50}, {mode: 'exploration', weight: 35}, {mode: 'diplomacy', weight: 15}],
  'Spice Merchant': [{mode: 'commerce', weight: 70}, {mode: 'exploration', weight: 20}, {mode: 'diplomacy', weight: 10}],
  'Spice Trader': [{mode: 'commerce', weight: 65}, {mode: 'exploration', weight: 25}, {mode: 'diplomacy', weight: 10}],
  'Salt Merchant': [{mode: 'commerce', weight: 70}, {mode: 'livelihood', weight: 30}],
  'Salt Trader': [{mode: 'commerce', weight: 65}, {mode: 'exploration', weight: 25}, {mode: 'livelihood', weight: 10}],
  'Tea Trader': [{mode: 'commerce', weight: 70}, {mode: 'diplomacy', weight: 20}, {mode: 'livelihood', weight: 10}],
  'Gold Trader': [{mode: 'commerce', weight: 75}, {mode: 'diplomacy', weight: 25}],
  'Rice Merchant': [{mode: 'commerce', weight: 70}, {mode: 'livelihood', weight: 30}],
  'Wool Merchant': [{mode: 'commerce', weight: 70}, {mode: 'livelihood', weight: 30}],
  'Carpet Merchant': [{mode: 'commerce', weight: 75}, {mode: 'diplomacy', weight: 25}],
  'Porcelain Dealer': [{mode: 'commerce', weight: 70}, {mode: 'scholarship', weight: 20}, {mode: 'diplomacy', weight: 10}],
  'Market Vendor': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Street Vendor': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],
  'Market Woman': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Shopkeeper': [{mode: 'commerce', weight: 50}, {mode: 'livelihood', weight: 50}],
  'Peddler': [{mode: 'livelihood', weight: 50}, {mode: 'exploration', weight: 30}, {mode: 'commerce', weight: 20}],
  'Money Changer': [{mode: 'commerce', weight: 80}, {mode: 'livelihood', weight: 20}],
  'Banker': [{mode: 'commerce', weight: 80}, {mode: 'legal', weight: 20}],
  'Bank President': [{mode: 'leadership', weight: 30}, {mode: 'commerce', weight: 60}, {mode: 'legal', weight: 10}],
  'Investment Banker': [{mode: 'commerce', weight: 80}, {mode: 'legal', weight: 20}],
  'Mestizo Trader': [{mode: 'commerce', weight: 50}, {mode: 'diplomacy', weight: 30}, {mode: 'livelihood', weight: 20}],

  // ===== MEDICAL & HEALING =====
  'Healer': [{mode: 'healer', weight: 80}, {mode: 'livelihood', weight: 20}],
  'Medicine Man': [{mode: 'healer', weight: 70}, {mode: 'scholarship', weight: 20}, {mode: 'livelihood', weight: 10}],
  'Medicine Woman': [{mode: 'healer', weight: 70}, {mode: 'scholarship', weight: 20}, {mode: 'livelihood', weight: 10}],
  'Medicine Person': [{mode: 'healer', weight: 70}, {mode: 'scholarship', weight: 20}, {mode: 'livelihood', weight: 10}],
  'Bush Medicine Woman': [{mode: 'healer', weight: 75}, {mode: 'livelihood', weight: 25}],
  'Physician': [{mode: 'healer', weight: 70}, {mode: 'scholarship', weight: 30}],
  'Doctor': [{mode: 'healer', weight: 75}, {mode: 'scholarship', weight: 25}],
  'Surgeon': [{mode: 'healer', weight: 80}, {mode: 'scholarship', weight: 20}],
  'Barber Surgeon': [{mode: 'healer', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Plague Doctor': [{mode: 'healer', weight: 60}, {mode: 'survival', weight: 30}, {mode: 'exploration', weight: 10}],
  'Midwife': [{mode: 'healer', weight: 70}, {mode: 'livelihood', weight: 30}],
  'Wet Nurse': [{mode: 'livelihood', weight: 70}, {mode: 'healer', weight: 30}],
  'Birth Attendant': [{mode: 'healer', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Herbalist': [{mode: 'healer', weight: 60}, {mode: 'scholarship', weight: 20}, {mode: 'livelihood', weight: 20}],
  'Herbatero': [{mode: 'healer', weight: 65}, {mode: 'livelihood', weight: 35}],
  'Herbal Pharmacist': [{mode: 'healer', weight: 60}, {mode: 'commerce', weight: 20}, {mode: 'livelihood', weight: 20}],
  'Apothecary': [{mode: 'healer', weight: 50}, {mode: 'commerce', weight: 30}, {mode: 'scholarship', weight: 20}],
  'Pharmacist': [{mode: 'healer', weight: 50}, {mode: 'commerce', weight: 30}, {mode: 'livelihood', weight: 20}],
  'Bone Setter': [{mode: 'healer', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Snake Doctor': [{mode: 'healer', weight: 65}, {mode: 'livelihood', weight: 35}],
  'Curandero': [{mode: 'healer', weight: 70}, {mode: 'livelihood', weight: 30}],
  'Mganga': [{mode: 'healer', weight: 60}, {mode: 'scholarship', weight: 20}, {mode: 'livelihood', weight: 20}],
  'Sangoma': [{mode: 'healer', weight: 60}, {mode: 'diplomacy', weight: 20}, {mode: 'livelihood', weight: 20}],
  'Ticitl': [{mode: 'healer', weight: 70}, {mode: 'scholarship', weight: 30}],
  'Hakim': [{mode: 'healer', weight: 65}, {mode: 'scholarship', weight: 35}],
  'Tabib': [{mode: 'healer', weight: 65}, {mode: 'scholarship', weight: 35}],
  'Vaidya': [{mode: 'healer', weight: 60}, {mode: 'scholarship', weight: 30}, {mode: 'livelihood', weight: 10}],
  'Kampo Practitioner': [{mode: 'healer', weight: 65}, {mode: 'scholarship', weight: 25}, {mode: 'livelihood', weight: 10}],
  'Nurse': [{mode: 'healer', weight: 60}, {mode: 'livelihood', weight: 40}],

  // ===== SCHOLARS & ACADEMICS =====
  'Scholar': [{mode: 'scholarship', weight: 80}, {mode: 'legal', weight: 10}, {mode: 'diplomacy', weight: 10}],
  'Islamic Scholar': [{mode: 'scholarship', weight: 70}, {mode: 'legal', weight: 20}, {mode: 'diplomacy', weight: 10}],
  'Scribe': [{mode: 'scholarship', weight: 40}, {mode: 'legal', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Court Scribe': [{mode: 'scholarship', weight: 35}, {mode: 'legal', weight: 35}, {mode: 'diplomacy', weight: 30}],
  'Teacher': [{mode: 'scholarship', weight: 50}, {mode: 'livelihood', weight: 50}],
  'Village Teacher': [{mode: 'scholarship', weight: 40}, {mode: 'livelihood', weight: 60}],
  'Mission Teacher': [{mode: 'scholarship', weight: 45}, {mode: 'diplomacy', weight: 25}, {mode: 'livelihood', weight: 30}],
  'University Professor': [{mode: 'scholarship', weight: 80}, {mode: 'legal', weight: 20}],
  'Librarian': [{mode: 'scholarship', weight: 70}, {mode: 'livelihood', weight: 30}],
  'Mathematician': [{mode: 'scholarship', weight: 85}, {mode: 'livelihood', weight: 15}],
  'Astronomer': [{mode: 'scholarship', weight: 80}, {mode: 'exploration', weight: 20}],
  'Astrologer': [{mode: 'scholarship', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Alchemist': [{mode: 'scholarship', weight: 70}, {mode: 'healer', weight: 20}, {mode: 'commerce', weight: 10}],
  'Translator': [{mode: 'scholarship', weight: 40}, {mode: 'diplomacy', weight: 40}, {mode: 'livelihood', weight: 20}],
  'Interpreter': [{mode: 'diplomacy', weight: 50}, {mode: 'scholarship', weight: 30}, {mode: 'livelihood', weight: 20}],
  'Court Interpreter': [{mode: 'diplomacy', weight: 60}, {mode: 'scholarship', weight: 30}, {mode: 'legal', weight: 10}],

  // ===== RELIGIOUS =====
  'Priest': [{mode: 'scholarship', weight: 40}, {mode: 'diplomacy', weight: 30}, {mode: 'healer', weight: 20}, {mode: 'livelihood', weight: 10}],
  'High Priest': [{mode: 'leadership', weight: 40}, {mode: 'scholarship', weight: 30}, {mode: 'diplomacy', weight: 30}],
  'Priest-King': [{mode: 'leadership', weight: 60}, {mode: 'scholarship', weight: 25}, {mode: 'legal', weight: 15}],
  'Bishop': [{mode: 'leadership', weight: 40}, {mode: 'scholarship', weight: 30}, {mode: 'diplomacy', weight: 30}],
  'Monk': [{mode: 'scholarship', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Buddhist Monk': [{mode: 'scholarship', weight: 65}, {mode: 'diplomacy', weight: 20}, {mode: 'livelihood', weight: 15}],
  'Nun': [{mode: 'scholarship', weight: 50}, {mode: 'healer', weight: 25}, {mode: 'livelihood', weight: 25}],
  'Friar': [{mode: 'scholarship', weight: 40}, {mode: 'exploration', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Missionary': [{mode: 'diplomacy', weight: 40}, {mode: 'exploration', weight: 30}, {mode: 'scholarship', weight: 30}],
  'Imam': [{mode: 'scholarship', weight: 50}, {mode: 'legal', weight: 30}, {mode: 'diplomacy', weight: 20}],
  'Muezzin': [{mode: 'livelihood', weight: 70}, {mode: 'scholarship', weight: 30}],
  'Hindu Priest': [{mode: 'scholarship', weight: 50}, {mode: 'diplomacy', weight: 25}, {mode: 'livelihood', weight: 25}],
  'Shinto Priest': [{mode: 'scholarship', weight: 45}, {mode: 'diplomacy', weight: 30}, {mode: 'livelihood', weight: 25}],
  'Shaman': [{mode: 'healer', weight: 40}, {mode: 'scholarship', weight: 30}, {mode: 'diplomacy', weight: 30}],
  'Oracle': [{mode: 'scholarship', weight: 50}, {mode: 'diplomacy', weight: 30}, {mode: 'livelihood', weight: 20}],
  'Diviner': [{mode: 'scholarship', weight: 40}, {mode: 'livelihood', weight: 60}],
  'Spirit Medium': [{mode: 'diplomacy', weight: 40}, {mode: 'healer', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Temple Keeper': [{mode: 'livelihood', weight: 60}, {mode: 'scholarship', weight: 40}],
  'Temple Servant': [{mode: 'livelihood', weight: 80}, {mode: 'scholarship', weight: 20}],
  'Temple Dancer': [{mode: 'livelihood', weight: 70}, {mode: 'diplomacy', weight: 30}],
  'Ascetic': [{mode: 'scholarship', weight: 60}, {mode: 'survival', weight: 40}],
  'Hermit': [{mode: 'survival', weight: 50}, {mode: 'scholarship', weight: 50}],
  'Cave Hermit': [{mode: 'survival', weight: 60}, {mode: 'scholarship', weight: 40}],
  'Pilgrim': [{mode: 'exploration', weight: 50}, {mode: 'scholarship', weight: 30}, {mode: 'survival', weight: 20}],
  'Quranic Teacher': [{mode: 'scholarship', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Zen Master': [{mode: 'scholarship', weight: 60}, {mode: 'diplomacy', weight: 40}],

  // ===== MILITARY =====
  'Soldier': [{mode: 'survival', weight: 40}, {mode: 'leadership', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Infantry': [{mode: 'survival', weight: 50}, {mode: 'livelihood', weight: 50}],
  'Cavalry': [{mode: 'survival', weight: 40}, {mode: 'exploration', weight: 30}, {mode: 'leadership', weight: 30}],
  'Warrior': [{mode: 'survival', weight: 50}, {mode: 'leadership', weight: 25}, {mode: 'exploration', weight: 25}],
  'Guard': [{mode: 'livelihood', weight: 60}, {mode: 'survival', weight: 40}],
  'City Guard': [{mode: 'livelihood', weight: 50}, {mode: 'legal', weight: 30}, {mode: 'survival', weight: 20}],
  'Border Guard': [{mode: 'survival', weight: 40}, {mode: 'diplomacy', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Mercenary': [{mode: 'survival', weight: 50}, {mode: 'exploration', weight: 30}, {mode: 'commerce', weight: 20}],
  'Legionary': [{mode: 'survival', weight: 40}, {mode: 'exploration', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Auxiliary': [{mode: 'survival', weight: 45}, {mode: 'livelihood', weight: 55}],
  'Centurion': [{mode: 'leadership', weight: 50}, {mode: 'survival', weight: 30}, {mode: 'legal', weight: 20}],
  'Janissary': [{mode: 'survival', weight: 40}, {mode: 'leadership', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Ashigaru': [{mode: 'survival', weight: 45}, {mode: 'livelihood', weight: 55}],
  'Sepoy': [{mode: 'survival', weight: 45}, {mode: 'livelihood', weight: 55}],
  'Gladiator': [{mode: 'survival', weight: 70}, {mode: 'livelihood', weight: 30}],
  'Retainer': [{mode: 'livelihood', weight: 50}, {mode: 'leadership', weight: 25}, {mode: 'survival', weight: 25}],
  'Presidio Soldier': [{mode: 'survival', weight: 40}, {mode: 'exploration', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Musket Bearer': [{mode: 'survival', weight: 45}, {mode: 'livelihood', weight: 55}],

  // ===== EXPLORATION & TRAVEL =====
  'Explorer': [{mode: 'exploration', weight: 80}, {mode: 'commerce', weight: 10}, {mode: 'survival', weight: 10}],
  'Navigator': [{mode: 'exploration', weight: 70}, {mode: 'commerce', weight: 20}, {mode: 'scholarship', weight: 10}],
  'Master Navigator': [{mode: 'exploration', weight: 75}, {mode: 'scholarship', weight: 15}, {mode: 'commerce', weight: 10}],
  'Scout': [{mode: 'exploration', weight: 60}, {mode: 'survival', weight: 30}, {mode: 'livelihood', weight: 10}],
  'Sailor': [{mode: 'exploration', weight: 40}, {mode: 'commerce', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Navy Sailor': [{mode: 'exploration', weight: 35}, {mode: 'survival', weight: 35}, {mode: 'livelihood', weight: 30}],
  'Ship Owner': [{mode: 'commerce', weight: 60}, {mode: 'exploration', weight: 30}, {mode: 'leadership', weight: 10}],
  'Boatman': [{mode: 'livelihood', weight: 60}, {mode: 'exploration', weight: 40}],
  'Whaler': [{mode: 'exploration', weight: 40}, {mode: 'commerce', weight: 30}, {mode: 'survival', weight: 30}],
  'Voyageur': [{mode: 'exploration', weight: 60}, {mode: 'commerce', weight: 30}, {mode: 'survival', weight: 10}],
  'Coureur de Bois': [{mode: 'exploration', weight: 50}, {mode: 'commerce', weight: 30}, {mode: 'survival', weight: 20}],
  'Mountain Man': [{mode: 'exploration', weight: 40}, {mode: 'survival', weight: 40}, {mode: 'commerce', weight: 20}],
  'Fur Trapper': [{mode: 'exploration', weight: 35}, {mode: 'commerce', weight: 35}, {mode: 'survival', weight: 30}],
  'Caravan Guide': [{mode: 'exploration', weight: 50}, {mode: 'commerce', weight: 30}, {mode: 'diplomacy', weight: 20}],
  'Courier': [{mode: 'exploration', weight: 40}, {mode: 'livelihood', weight: 60}],
  'Chasqui Runner': [{mode: 'exploration', weight: 45}, {mode: 'livelihood', weight: 55}],

  // ===== CRAFTS & ARTISANS =====
  'Blacksmith': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Goldsmith': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Silversmith': [{mode: 'livelihood', weight: 65}, {mode: 'commerce', weight: 35}],
  'Weaponsmith': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Swordsmith': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Gunsmith': [{mode: 'livelihood', weight: 65}, {mode: 'commerce', weight: 35}],
  'Carpenter': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Builder': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Master Builder': [{mode: 'livelihood', weight: 60}, {mode: 'leadership', weight: 20}, {mode: 'commerce', weight: 20}],
  'Mason': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Stonemason': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Stone Carver': [{mode: 'livelihood', weight: 75}, {mode: 'scholarship', weight: 25}],
  'Sculptor': [{mode: 'livelihood', weight: 60}, {mode: 'scholarship', weight: 40}],
  'Potter': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Pottery Maker': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Porcelain Potter': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Glassblower': [{mode: 'livelihood', weight: 75}, {mode: 'commerce', weight: 25}],
  'Jeweler': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Weaver': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Silk Weaver': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Textile Weaver': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Tapestry Weaver': [{mode: 'livelihood', weight: 70}, {mode: 'scholarship', weight: 30}],
  'Basket Maker': [{mode: 'livelihood', weight: 90}, {mode: 'commerce', weight: 10}],
  'Tanner': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Cobbler': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Tailor': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Seamstress': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Dyer': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Textile Dyer': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Miller': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Baker': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Brewer': [{mode: 'livelihood', weight: 75}, {mode: 'commerce', weight: 25}],
  'Vintner': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Butcher': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Cook': [{mode: 'livelihood', weight: 90}, {mode: 'commerce', weight: 10}],
  'Shipwright': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Canoe Builder': [{mode: 'livelihood', weight: 80}, {mode: 'exploration', weight: 20}],
  'Canoe Carver': [{mode: 'livelihood', weight: 80}, {mode: 'exploration', weight: 20}],
  'Architect': [{mode: 'scholarship', weight: 40}, {mode: 'livelihood', weight: 40}, {mode: 'commerce', weight: 20}],
  'Engineer': [{mode: 'scholarship', weight: 40}, {mode: 'livelihood', weight: 40}, {mode: 'commerce', weight: 20}],
  'Civil Engineer': [{mode: 'scholarship', weight: 35}, {mode: 'livelihood', weight: 45}, {mode: 'leadership', weight: 20}],
  'Clockmaker': [{mode: 'livelihood', weight: 60}, {mode: 'scholarship', weight: 30}, {mode: 'commerce', weight: 10}],
  'Printer': [{mode: 'livelihood', weight: 50}, {mode: 'scholarship', weight: 35}, {mode: 'commerce', weight: 15}],
  'Woodblock Printer': [{mode: 'livelihood', weight: 55}, {mode: 'scholarship', weight: 30}, {mode: 'commerce', weight: 15}],
  'Paper Maker': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Calligrapher': [{mode: 'livelihood', weight: 50}, {mode: 'scholarship', weight: 50}],
  'Illuminator': [{mode: 'livelihood', weight: 45}, {mode: 'scholarship', weight: 55}],
  'Painter': [{mode: 'livelihood', weight: 60}, {mode: 'scholarship', weight: 40}],
  'Court Painter': [{mode: 'livelihood', weight: 40}, {mode: 'diplomacy', weight: 30}, {mode: 'scholarship', weight: 30}],
  'Musician': [{mode: 'livelihood', weight: 70}, {mode: 'diplomacy', weight: 30}],
  'Court Musician': [{mode: 'livelihood', weight: 40}, {mode: 'diplomacy', weight: 40}, {mode: 'scholarship', weight: 20}],
  'Dancer': [{mode: 'livelihood', weight: 70}, {mode: 'diplomacy', weight: 30}],
  'Perfumer': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Incense Maker': [{mode: 'livelihood', weight: 65}, {mode: 'commerce', weight: 35}],
  'Chandler': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],

  // ===== AGRICULTURE & FARMING =====
  'Farmer': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],
  'Rice Farmer': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Maize Farmer': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Corn Farmer': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Millet Farmer': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Vegetable Farmer': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Taro Farmer': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Terrace Farmer': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],
  'Cotton Farmer': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Tobacco Farmer': [{mode: 'livelihood', weight: 65}, {mode: 'commerce', weight: 35}],
  'Coffee Planter': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Tea Grower': [{mode: 'livelihood', weight: 65}, {mode: 'commerce', weight: 35}],
  'Tea Picker': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Silk Farmer': [{mode: 'livelihood', weight: 65}, {mode: 'commerce', weight: 35}],
  'Spice Grower': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Cacao Grower': [{mode: 'livelihood', weight: 65}, {mode: 'commerce', weight: 35}],
  'Coca Cultivator': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Date Farmer': [{mode: 'livelihood', weight: 75}, {mode: 'commerce', weight: 25}],
  'Cash Crop Farmer': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Chinampero': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Reservation Farmer': [{mode: 'livelihood', weight: 60}, {mode: 'survival', weight: 40}],
  'Homesteader': [{mode: 'survival', weight: 50}, {mode: 'livelihood', weight: 50}],
  'Sod Buster': [{mode: 'livelihood', weight: 60}, {mode: 'survival', weight: 40}],
  'Farm Worker': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Plantation Worker': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],
  'Hacienda Peon': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],

  // ===== LIVESTOCK & HERDING =====
  'Shepherd': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],
  'Goat Herder': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],
  'Cattle Herder': [{mode: 'livelihood', weight: 65}, {mode: 'commerce', weight: 20}, {mode: 'survival', weight: 15}],
  'Camel Herder': [{mode: 'livelihood', weight: 60}, {mode: 'exploration', weight: 25}, {mode: 'survival', weight: 15}],
  'Llama Herder': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 20}, {mode: 'survival', weight: 10}],
  'Horse Trainer': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Cowherd': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Vaquero': [{mode: 'livelihood', weight: 60}, {mode: 'exploration', weight: 25}, {mode: 'survival', weight: 15}],
  'Cowboy': [{mode: 'livelihood', weight: 55}, {mode: 'exploration', weight: 30}, {mode: 'survival', weight: 15}],
  'Ranchero': [{mode: 'livelihood', weight: 50}, {mode: 'leadership', weight: 30}, {mode: 'commerce', weight: 20}],
  'Duck Herder': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],

  // ===== HUNTING & GATHERING =====
  'Hunter': [{mode: 'survival', weight: 50}, {mode: 'exploration', weight: 30}, {mode: 'livelihood', weight: 20}],
  'Buffalo Hunter': [{mode: 'survival', weight: 45}, {mode: 'exploration', weight: 35}, {mode: 'livelihood', weight: 20}],
  'Whale Hunter': [{mode: 'exploration', weight: 40}, {mode: 'survival', weight: 35}, {mode: 'livelihood', weight: 25}],
  'Gatherer': [{mode: 'survival', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Medicine Gatherer': [{mode: 'healer', weight: 40}, {mode: 'survival', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Honey Gatherer': [{mode: 'livelihood', weight: 60}, {mode: 'survival', weight: 40}],

  // ===== FISHING & MARITIME =====
  'Fisherman': [{mode: 'livelihood', weight: 60}, {mode: 'survival', weight: 40}],
  'Fisher': [{mode: 'livelihood', weight: 60}, {mode: 'survival', weight: 40}],
  'Salmon Fisher': [{mode: 'livelihood', weight: 65}, {mode: 'survival', weight: 35}],
  'Pearl Diver': [{mode: 'livelihood', weight: 50}, {mode: 'commerce', weight: 35}, {mode: 'survival', weight: 15}],
  'Shell Diver': [{mode: 'livelihood', weight: 60}, {mode: 'survival', weight: 40}],
  'Beche-de-mer Diver': [{mode: 'livelihood', weight: 55}, {mode: 'commerce', weight: 30}, {mode: 'survival', weight: 15}],
  'Fish Weir Builder': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],

  // ===== MINING & EXTRACTION =====
  'Miner': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],
  'Silver Miner': [{mode: 'livelihood', weight: 65}, {mode: 'commerce', weight: 25}, {mode: 'survival', weight: 10}],
  'Gold Prospector': [{mode: 'exploration', weight: 40}, {mode: 'commerce', weight: 35}, {mode: 'survival', weight: 25}],
  'Coal Miner': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Mine Worker': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Mita Worker': [{mode: 'livelihood', weight: 60}, {mode: 'survival', weight: 40}],
  'Guano Digger': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],
  'Nitrate Worker': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],
  'Oil Worker': [{mode: 'livelihood', weight: 65}, {mode: 'commerce', weight: 35}],
  'Rubber Tapper': [{mode: 'livelihood', weight: 60}, {mode: 'exploration', weight: 25}, {mode: 'survival', weight: 15}],
  'Woodcutter': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Lumberjack': [{mode: 'livelihood', weight: 70}, {mode: 'exploration', weight: 20}, {mode: 'survival', weight: 10}],
  'Charcoal Burner': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Charcoal Maker': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],

  // ===== SERVICE & HOSPITALITY =====
  'Innkeeper': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 30}, {mode: 'diplomacy', weight: 10}],
  'Tavern Keeper': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 30}, {mode: 'diplomacy', weight: 10}],
  'Coffeehouse Keeper': [{mode: 'livelihood', weight: 55}, {mode: 'commerce', weight: 30}, {mode: 'diplomacy', weight: 15}],
  'Tea House Servant': [{mode: 'livelihood', weight: 85}, {mode: 'diplomacy', weight: 15}],
  'Bathhouse Attendant': [{mode: 'livelihood', weight: 80}, {mode: 'diplomacy', weight: 20}],
  'Barista': [{mode: 'livelihood', weight: 90}, {mode: 'commerce', weight: 10}],
  'Bartender': [{mode: 'livelihood', weight: 80}, {mode: 'diplomacy', weight: 20}],
  'Waiter': [{mode: 'livelihood', weight: 90}, {mode: 'survival', weight: 10}],
  'Hotel Clerk': [{mode: 'livelihood', weight: 80}, {mode: 'diplomacy', weight: 20}],
  'Domestic Servant': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Washerwoman': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Governess': [{mode: 'livelihood', weight: 60}, {mode: 'scholarship', weight: 40}],

  // ===== CLERICAL & ADMINISTRATIVE =====
  'Clerk': [{mode: 'livelihood', weight: 70}, {mode: 'legal', weight: 20}, {mode: 'scholarship', weight: 10}],
  'Secretary': [{mode: 'livelihood', weight: 70}, {mode: 'diplomacy', weight: 30}],
  'Accountant': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 30}, {mode: 'legal', weight: 10}],
  'Tax Collector': [{mode: 'legal', weight: 40}, {mode: 'livelihood', weight: 40}, {mode: 'commerce', weight: 20}],
  'Tax Assessor': [{mode: 'legal', weight: 45}, {mode: 'livelihood', weight: 40}, {mode: 'commerce', weight: 15}],
  'Tax Farmer': [{mode: 'commerce', weight: 50}, {mode: 'legal', weight: 30}, {mode: 'livelihood', weight: 20}],
  'Census Taker': [{mode: 'livelihood', weight: 60}, {mode: 'legal', weight: 40}],
  'Postal Worker': [{mode: 'livelihood', weight: 80}, {mode: 'exploration', weight: 20}],
  'Telegraph Operator': [{mode: 'livelihood', weight: 75}, {mode: 'diplomacy', weight: 25}],
  'Telephone Operator': [{mode: 'livelihood', weight: 75}, {mode: 'diplomacy', weight: 25}],
  'Office Manager': [{mode: 'livelihood', weight: 50}, {mode: 'leadership', weight: 30}, {mode: 'commerce', weight: 20}],

  // ===== TRANSPORTATION & LOGISTICS =====
  'Porter': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Muleteer': [{mode: 'livelihood', weight: 60}, {mode: 'exploration', weight: 30}, {mode: 'commerce', weight: 10}],
  'Coach Driver': [{mode: 'livelihood', weight: 70}, {mode: 'exploration', weight: 30}],
  'Stagecoach Driver': [{mode: 'livelihood', weight: 65}, {mode: 'exploration', weight: 35}],
  'Rickshaw Puller': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Chariot Driver': [{mode: 'livelihood', weight: 60}, {mode: 'survival', weight: 40}],
  'Canal Worker': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Dock Worker': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Docker': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Stevedore': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Railroad Worker': [{mode: 'livelihood', weight: 70}, {mode: 'exploration', weight: 20}, {mode: 'survival', weight: 10}],
  'Railway Worker': [{mode: 'livelihood', weight: 70}, {mode: 'exploration', weight: 20}, {mode: 'survival', weight: 10}],
  'Railway Engineer': [{mode: 'livelihood', weight: 50}, {mode: 'exploration', weight: 30}, {mode: 'scholarship', weight: 20}],
  'Railway Investor': [{mode: 'commerce', weight: 70}, {mode: 'leadership', weight: 30}],
  'Streetcar Conductor': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Taxi Driver': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Cab Driver': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Truck Driver': [{mode: 'livelihood', weight: 80}, {mode: 'exploration', weight: 20}],
  'Delivery Driver': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Uber Driver': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],

  // ===== INDUSTRIAL & FACTORY =====
  'Factory Worker': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Factory Owner': [{mode: 'leadership', weight: 40}, {mode: 'commerce', weight: 50}, {mode: 'legal', weight: 10}],
  'Mill Worker': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Textile Worker': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Smelter Worker': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Machinist': [{mode: 'livelihood', weight: 75}, {mode: 'scholarship', weight: 25}],
  'Welder': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Mechanic': [{mode: 'livelihood', weight: 75}, {mode: 'scholarship', weight: 25}],

  // ===== MODERN PROFESSIONS =====
  'Software Developer': [{mode: 'scholarship', weight: 50}, {mode: 'livelihood', weight: 40}, {mode: 'commerce', weight: 10}],
  'Content Creator': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Marketing Manager': [{mode: 'commerce', weight: 60}, {mode: 'leadership', weight: 30}, {mode: 'diplomacy', weight: 10}],
  'Personal Trainer': [{mode: 'livelihood', weight: 70}, {mode: 'healer', weight: 30}],
  'Physical Therapist': [{mode: 'healer', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Dental Hygienist': [{mode: 'healer', weight: 50}, {mode: 'livelihood', weight: 50}],
  'Real Estate Agent': [{mode: 'commerce', weight: 70}, {mode: 'diplomacy', weight: 20}, {mode: 'livelihood', weight: 10}],
  'Small Business Owner': [{mode: 'commerce', weight: 50}, {mode: 'leadership', weight: 30}, {mode: 'livelihood', weight: 20}],
  'Customer Service Rep': [{mode: 'livelihood', weight: 80}, {mode: 'diplomacy', weight: 20}],
  'Call Center Worker': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Security Guard': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],
  'Janitor': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Cashier': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Grocery Clerk': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Warehouse Worker': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Construction Worker': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Police Officer': [{mode: 'legal', weight: 40}, {mode: 'survival', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Firefighter': [{mode: 'survival', weight: 40}, {mode: 'healer', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Photographer': [{mode: 'livelihood', weight: 60}, {mode: 'scholarship', weight: 30}, {mode: 'exploration', weight: 10}],
  'Journalist': [{mode: 'scholarship', weight: 40}, {mode: 'exploration', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Newspaper Editor': [{mode: 'scholarship', weight: 40}, {mode: 'leadership', weight: 30}, {mode: 'livelihood', weight: 30}],

  // ===== CRIMINAL & OUTLAW =====
  'Thief': [{mode: 'survival', weight: 60}, {mode: 'exploration', weight: 25}, {mode: 'livelihood', weight: 15}],
  'Pickpocket': [{mode: 'survival', weight: 65}, {mode: 'livelihood', weight: 35}],
  'Cutpurse': [{mode: 'survival', weight: 65}, {mode: 'livelihood', weight: 35}],
  'Footpad': [{mode: 'survival', weight: 70}, {mode: 'exploration', weight: 30}],
  'Highwayman': [{mode: 'survival', weight: 60}, {mode: 'exploration', weight: 40}],
  'Brigand': [{mode: 'survival', weight: 65}, {mode: 'exploration', weight: 35}],
  'Raider': [{mode: 'survival', weight: 70}, {mode: 'exploration', weight: 30}],
  'Smuggler': [{mode: 'commerce', weight: 40}, {mode: 'exploration', weight: 35}, {mode: 'survival', weight: 25}],
  'Opium Smuggler': [{mode: 'commerce', weight: 45}, {mode: 'exploration', weight: 30}, {mode: 'survival', weight: 25}],
  'Drug Dealer': [{mode: 'commerce', weight: 40}, {mode: 'survival', weight: 60}],
  'Fentanyl Dealer': [{mode: 'commerce', weight: 35}, {mode: 'survival', weight: 65}],
  'Cartel Member': [{mode: 'survival', weight: 60}, {mode: 'commerce', weight: 30}, {mode: 'leadership', weight: 10}],
  'Triad Member': [{mode: 'survival', weight: 50}, {mode: 'commerce', weight: 30}, {mode: 'leadership', weight: 20}],
  'Yakuza': [{mode: 'survival', weight: 40}, {mode: 'commerce', weight: 30}, {mode: 'leadership', weight: 30}],
  'Mobster': [{mode: 'survival', weight: 50}, {mode: 'commerce', weight: 30}, {mode: 'leadership', weight: 20}],
  'Desperado': [{mode: 'survival', weight: 70}, {mode: 'exploration', weight: 30}],
  'Cybercriminal': [{mode: 'commerce', weight: 40}, {mode: 'scholarship', weight: 30}, {mode: 'survival', weight: 30}],
  'Crypto Scammer': [{mode: 'commerce', weight: 50}, {mode: 'survival', weight: 50}],
  'Human Trafficker': [{mode: 'survival', weight: 80}, {mode: 'commerce', weight: 20}],

  // ===== ENSLAVED & FORCED LABOR =====
  'Slave': [{mode: 'survival', weight: 80}, {mode: 'livelihood', weight: 20}],
  'Enslaved Person': [{mode: 'survival', weight: 80}, {mode: 'livelihood', weight: 20}],
  'Serf': [{mode: 'livelihood', weight: 60}, {mode: 'survival', weight: 40}],
  'Indentured Servant': [{mode: 'livelihood', weight: 55}, {mode: 'survival', weight: 45}],
  'Indentured Labourer': [{mode: 'livelihood', weight: 55}, {mode: 'survival', weight: 45}],
  'Indigenous Laborer': [{mode: 'livelihood', weight: 50}, {mode: 'survival', weight: 50}],
  'War Captive': [{mode: 'survival', weight: 90}, {mode: 'exploration', weight: 10}],

  // ===== FAMILY & HOUSEHOLD =====
  'Mother': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Father': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Wife': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Husband': [{mode: 'livelihood', weight: 75}, {mode: 'survival', weight: 25}],
  'Daughter': [{mode: 'livelihood', weight: 90}, {mode: 'survival', weight: 10}],
  'Son': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Parent': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Child': [{mode: 'livelihood', weight: 90}, {mode: 'survival', weight: 10}],
  'Housewife': [{mode: 'livelihood', weight: 90}, {mode: 'survival', weight: 10}],
  'Householder': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Elder': [{mode: 'livelihood', weight: 70}, {mode: 'scholarship', weight: 20}, {mode: 'diplomacy', weight: 10}],
  'Matriarch': [{mode: 'leadership', weight: 40}, {mode: 'livelihood', weight: 40}, {mode: 'diplomacy', weight: 20}],
  'Patriarch': [{mode: 'leadership', weight: 40}, {mode: 'livelihood', weight: 40}, {mode: 'legal', weight: 20}],

  // ===== MISCELLANEOUS & SPECIAL =====
  'Traveler': [{mode: 'exploration', weight: 50}, {mode: 'livelihood', weight: 30}, {mode: 'survival', weight: 20}],
  'Nomad': [{mode: 'exploration', weight: 50}, {mode: 'survival', weight: 40}, {mode: 'livelihood', weight: 10}],
  'Beggar': [{mode: 'survival', weight: 90}, {mode: 'livelihood', weight: 10}],
  'Outcast': [{mode: 'survival', weight: 80}, {mode: 'exploration', weight: 20}],
  'Witch': [{mode: 'healer', weight: 40}, {mode: 'survival', weight: 30}, {mode: 'scholarship', weight: 30}],
  'Clever Woman': [{mode: 'healer', weight: 40}, {mode: 'scholarship', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Pardoner': [{mode: 'diplomacy', weight: 40}, {mode: 'commerce', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Jester': [{mode: 'diplomacy', weight: 50}, {mode: 'livelihood', weight: 50}],
  'Executioner': [{mode: 'legal', weight: 40}, {mode: 'livelihood', weight: 60}],
  'Resurrectionist': [{mode: 'survival', weight: 50}, {mode: 'healer', weight: 30}, {mode: 'commerce', weight: 20}],

  // ===== REVOLUTIONARY & ACTIVIST =====
  'Anarchist': [{mode: 'survival', weight: 40}, {mode: 'leadership', weight: 30}, {mode: 'diplomacy', weight: 30}],
  'Boxer Rebel': [{mode: 'survival', weight: 50}, {mode: 'leadership', weight: 30}, {mode: 'diplomacy', weight: 20}],
  'Taiping Soldier': [{mode: 'survival', weight: 45}, {mode: 'leadership', weight: 35}, {mode: 'scholarship', weight: 20}],
  'Fenian': [{mode: 'survival', weight: 50}, {mode: 'leadership', weight: 30}, {mode: 'diplomacy', weight: 20}],
  'IRA Member': [{mode: 'survival', weight: 50}, {mode: 'leadership', weight: 30}, {mode: 'diplomacy', weight: 20}],
  'Guerrilla Fighter': [{mode: 'survival', weight: 60}, {mode: 'exploration', weight: 25}, {mode: 'leadership', weight: 15}],
  'ISIS Fighter': [{mode: 'survival', weight: 70}, {mode: 'leadership', weight: 30}],
  'Black Flag Fighter': [{mode: 'survival', weight: 60}, {mode: 'leadership', weight: 40}],
  'Luddite': [{mode: 'survival', weight: 40}, {mode: 'livelihood', weight: 40}, {mode: 'leadership', weight: 20}],
  'Chartist': [{mode: 'leadership', weight: 40}, {mode: 'legal', weight: 30}, {mode: 'diplomacy', weight: 30}],
  'Red Brigade': [{mode: 'survival', weight: 50}, {mode: 'leadership', weight: 30}, {mode: 'diplomacy', weight: 20}],
  'Black Panther': [{mode: 'leadership', weight: 40}, {mode: 'survival', weight: 30}, {mode: 'legal', weight: 30}],
  'BLM Activist': [{mode: 'leadership', weight: 35}, {mode: 'legal', weight: 35}, {mode: 'diplomacy', weight: 30}],
  'Antifa Member': [{mode: 'survival', weight: 40}, {mode: 'leadership', weight: 30}, {mode: 'diplomacy', weight: 30}],
  'Climate Activist': [{mode: 'leadership', weight: 35}, {mode: 'diplomacy', weight: 35}, {mode: 'exploration', weight: 30}],
  'Proud Boy': [{mode: 'survival', weight: 50}, {mode: 'leadership', weight: 50}],

  // ===== CULTURAL SPECIFIC =====
  'Griot': [{mode: 'scholarship', weight: 40}, {mode: 'diplomacy', weight: 35}, {mode: 'livelihood', weight: 25}],
  'Tohunga': [{mode: 'healer', weight: 35}, {mode: 'scholarship', weight: 35}, {mode: 'diplomacy', weight: 30}],
  'Kahuna Lapaʻau': [{mode: 'healer', weight: 60}, {mode: 'scholarship', weight: 40}],
  'Taulasea': [{mode: 'healer', weight: 50}, {mode: 'scholarship', weight: 50}],
  'Paqo': [{mode: 'healer', weight: 40}, {mode: 'scholarship', weight: 30}, {mode: 'diplomacy', weight: 30}],
  'Quipu Keeper': [{mode: 'scholarship', weight: 60}, {mode: 'legal', weight: 25}, {mode: 'livelihood', weight: 15}],
  'Curaca': [{mode: 'leadership', weight: 50}, {mode: 'diplomacy', weight: 30}, {mode: 'livelihood', weight: 20}],
  'Coya': [{mode: 'leadership', weight: 50}, {mode: 'diplomacy', weight: 50}],
  'Ayllu Member': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],
  'Habitant': [{mode: 'livelihood', weight: 70}, {mode: 'survival', weight: 30}],
  'Encomendero': [{mode: 'leadership', weight: 40}, {mode: 'commerce', weight: 40}, {mode: 'legal', weight: 20}],

  // ===== SPECIALIZED CRAFTS =====
  'Bone Carver': [{mode: 'livelihood', weight: 80}, {mode: 'scholarship', weight: 20}],
  'Bone Oracle': [{mode: 'scholarship', weight: 50}, {mode: 'diplomacy', weight: 30}, {mode: 'livelihood', weight: 20}],
  'Bone Singer': [{mode: 'scholarship', weight: 40}, {mode: 'diplomacy', weight: 40}, {mode: 'livelihood', weight: 20}],
  'Cave Painter': [{mode: 'scholarship', weight: 50}, {mode: 'livelihood', weight: 50}],
  'Rock Painter': [{mode: 'scholarship', weight: 50}, {mode: 'livelihood', weight: 50}],
  'Totem Carver': [{mode: 'livelihood', weight: 60}, {mode: 'scholarship', weight: 40}],
  'Wampum Maker': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Featherworker': [{mode: 'livelihood', weight: 70}, {mode: 'scholarship', weight: 30}],
  'Feather Worker': [{mode: 'livelihood', weight: 70}, {mode: 'scholarship', weight: 30}],
  'Jade Carver': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Ivory Carver': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Obsidian Knapper': [{mode: 'livelihood', weight: 75}, {mode: 'commerce', weight: 25}],
  'Toolmaker': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Tapa Maker': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Tipi Maker': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Tatami Maker': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Lacquerware Maker': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Lacquerware Artisan': [{mode: 'livelihood', weight: 65}, {mode: 'scholarship', weight: 20}, {mode: 'commerce', weight: 15}],
  'Fan Maker': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Noodle Maker': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Tofu Maker': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Inkstick Maker': [{mode: 'livelihood', weight: 75}, {mode: 'scholarship', weight: 25}],
  'Seal Carver': [{mode: 'livelihood', weight: 60}, {mode: 'scholarship', weight: 40}],
  'Instrument Maker': [{mode: 'livelihood', weight: 70}, {mode: 'scholarship', weight: 30}],
  'Bell Founder': [{mode: 'livelihood', weight: 75}, {mode: 'scholarship', weight: 25}],
  'Tile Maker': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Brick Maker': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Lens Grinder': [{mode: 'scholarship', weight: 50}, {mode: 'livelihood', weight: 50}],

  // Add any remaining professions with sensible defaults
  'Ball Court Player': [{mode: 'livelihood', weight: 50}, {mode: 'diplomacy', weight: 50}],
  'Kava Preparer': [{mode: 'livelihood', weight: 70}, {mode: 'diplomacy', weight: 30}],
  'Palm Wine Tapper': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Sandalwood Cutter': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Coconut Harvester': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Breadfruit Cultivator': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Maple Sugar Maker': [{mode: 'livelihood', weight: 75}, {mode: 'commerce', weight: 25}],
  'Cliff Dweller': [{mode: 'survival', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Trading Post Worker': [{mode: 'commerce', weight: 50}, {mode: 'diplomacy', weight: 30}, {mode: 'livelihood', weight: 20}],
  'Trading Post Clerk': [{mode: 'commerce', weight: 45}, {mode: 'livelihood', weight: 40}, {mode: 'diplomacy', weight: 15}],
  'Mission Indian': [{mode: 'livelihood', weight: 60}, {mode: 'scholarship', weight: 20}, {mode: 'survival', weight: 20}],
  'Indian Agent': [{mode: 'diplomacy', weight: 50}, {mode: 'legal', weight: 30}, {mode: 'leadership', weight: 20}],
  'Native Constable': [{mode: 'legal', weight: 40}, {mode: 'livelihood', weight: 40}, {mode: 'diplomacy', weight: 20}],
  'Portuguese Factor': [{mode: 'commerce', weight: 60}, {mode: 'diplomacy', weight: 40}],
  'Hut Tax Payer': [{mode: 'livelihood', weight: 60}, {mode: 'survival', weight: 40}],
  'British Engineer': [{mode: 'scholarship', weight: 40}, {mode: 'leadership', weight: 30}, {mode: 'commerce', weight: 30}],
  'Boarding School Student': [{mode: 'scholarship', weight: 60}, {mode: 'survival', weight: 40}],
  'Peaky Blinder': [{mode: 'survival', weight: 60}, {mode: 'commerce', weight: 25}, {mode: 'leadership', weight: 15}],
  'Anonymous Hacker': [{mode: 'scholarship', weight: 40}, {mode: 'survival', weight: 40}, {mode: 'commerce', weight: 20}],

  // Additional specialized roles
  'Rain Maker': [{mode: 'diplomacy', weight: 40}, {mode: 'scholarship', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Fire Keeper': [{mode: 'livelihood', weight: 60}, {mode: 'survival', weight: 40}],
  'Granary Keeper': [{mode: 'livelihood', weight: 60}, {mode: 'leadership', weight: 40}],
  'Water Carrier': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Ship Provisioner': [{mode: 'commerce', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Street Sweeper': [{mode: 'livelihood', weight: 85}, {mode: 'survival', weight: 15}],
  'Gas Lamp Lighter': [{mode: 'livelihood', weight: 90}, {mode: 'survival', weight: 10}],
  'Chimney Sweep': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Rag Picker': [{mode: 'survival', weight: 70}, {mode: 'livelihood', weight: 30}],
  'Newsboy': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Fireman': [{mode: 'survival', weight: 40}, {mode: 'livelihood', weight: 60}],
  'Handyman': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Tattoo Artist': [{mode: 'livelihood', weight: 70}, {mode: 'scholarship', weight: 30}],
  'Hair Stylist': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Flower Seller': [{mode: 'livelihood', weight: 85}, {mode: 'commerce', weight: 15}],
  'Salesman': [{mode: 'commerce', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Guild Master': [{mode: 'leadership', weight: 50}, {mode: 'commerce', weight: 30}, {mode: 'legal', weight: 20}],
  'Landowner': [{mode: 'leadership', weight: 40}, {mode: 'commerce', weight: 40}, {mode: 'livelihood', weight: 20}],
  'Surveyor': [{mode: 'exploration', weight: 40}, {mode: 'scholarship', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Poison Maker': [{mode: 'survival', weight: 40}, {mode: 'scholarship', weight: 30}, {mode: 'commerce', weight: 30}],
  'Falconer': [{mode: 'livelihood', weight: 50}, {mode: 'diplomacy', weight: 30}, {mode: 'exploration', weight: 20}],
  'Fuller': [{mode: 'livelihood', weight: 90}, {mode: 'commerce', weight: 10}],
  'Police Constable': [{mode: 'legal', weight: 40}, {mode: 'survival', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Slave Trader': [{mode: 'commerce', weight: 60}, {mode: 'survival', weight: 40}],
  'Traditional Crafter': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],

  // Cultural-specific additional roles
  'Bamboo Worker': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Cedar Worker': [{mode: 'livelihood', weight: 75}, {mode: 'commerce', weight: 25}],
  'Canoe Paddler': [{mode: 'exploration', weight: 50}, {mode: 'livelihood', weight: 50}],
  'Cowrie Counter': [{mode: 'commerce', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Dai': [{mode: 'healer', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Gold Worker': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Hide Processor': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Hide Dresser': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Ishihori': [{mode: 'livelihood', weight: 80}, {mode: 'scholarship', weight: 20}],
  'Iron Smelter': [{mode: 'livelihood', weight: 75}, {mode: 'commerce', weight: 25}],
  'Bronze Caster': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Brass Caster': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Kahhal': [{mode: 'healer', weight: 50}, {mode: 'livelihood', weight: 50}],
  'Carpet Weaver': [{mode: 'livelihood', weight: 75}, {mode: 'commerce', weight: 25}],
  'Carpet Maker': [{mode: 'livelihood', weight: 75}, {mode: 'commerce', weight: 25}],
  'Coca Chewer': [{mode: 'livelihood', weight: 80}, {mode: 'survival', weight: 20}],
  'Maqla': [{mode: 'livelihood', weight: 70}, {mode: 'commerce', weight: 30}],
  'Metalsmith': [{mode: 'livelihood', weight: 75}, {mode: 'commerce', weight: 25}],
  'Metalworker': [{mode: 'livelihood', weight: 75}, {mode: 'commerce', weight: 25}],
  'Moxibustion Specialist': [{mode: 'healer', weight: 70}, {mode: 'livelihood', weight: 30}],
  'Nadi Vaidya': [{mode: 'healer', weight: 65}, {mode: 'scholarship', weight: 35}],
  'Pueblo Healer': [{mode: 'healer', weight: 70}, {mode: 'scholarship', weight: 30}],
  'Pulse Diagnostician': [{mode: 'healer', weight: 60}, {mode: 'scholarship', weight: 40}],
  'Skin Dresser': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Sobador': [{mode: 'healer', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Tribute Collector': [{mode: 'legal', weight: 40}, {mode: 'commerce', weight: 30}, {mode: 'livelihood', weight: 30}],
  'Jadi Booti Wala': [{mode: 'healer', weight: 50}, {mode: 'commerce', weight: 30}, {mode: 'livelihood', weight: 20}],
  'Jarrah': [{mode: 'healer', weight: 60}, {mode: 'livelihood', weight: 40}],
  'Attar': [{mode: 'livelihood', weight: 60}, {mode: 'commerce', weight: 40}],
  'Bead Maker': [{mode: 'livelihood', weight: 80}, {mode: 'commerce', weight: 20}],
  'Funditor': [{mode: 'survival', weight: 50}, {mode: 'livelihood', weight: 50}],
};

/**
 * Select a game mode for a given profession using weighted random selection
 * @param profession The profession name
 * @returns A GameModeType based on weighted probability
 */
export function selectGameModeForProfession(profession: string): GameModeType {
  const mapping = PROFESSION_MODE_MAPPINGS[profession];

  if (!mapping) {
    // Fallback: 60% livelihood, 40% survival for unmapped professions
    return Math.random() < 0.6 ? 'livelihood' : 'survival';
  }

  // Calculate total weight
  const totalWeight = mapping.reduce((sum, m) => sum + m.weight, 0);

  // Weighted random selection
  let random = Math.random() * totalWeight;

  for (const {mode, weight} of mapping) {
    random -= weight;
    if (random <= 0) return mode;
  }

  // Fallback (should never reach here)
  return 'livelihood';
}

/**
 * Get all possible game modes for a profession with their weights
 * Useful for debugging or showing probabilities to users
 */
export function getProfessionModeWeights(profession: string): GameModeWeight[] | null {
  return PROFESSION_MODE_MAPPINGS[profession] || null;
}

/**
 * Get the most likely game mode for a profession (highest weight)
 * Useful for showing default/expected mode
 */
export function getMostLikelyMode(profession: string): GameModeType {
  const mapping = PROFESSION_MODE_MAPPINGS[profession];

  if (!mapping) {
    return 'livelihood';
  }

  // Find the mode with highest weight
  let bestMode: GameModeType = 'livelihood';
  let bestWeight = 0;

  for (const {mode, weight} of mapping) {
    if (weight > bestWeight) {
      bestWeight = weight;
      bestMode = mode;
    }
  }

  return bestMode;
}