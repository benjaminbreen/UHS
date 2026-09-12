/**
 * constants/characterData/commonProfessions.ts
 *
 * The ordinary work.
 *
 * `professions.ts` holds sixty-four zone-and-era tables with a median of
 * nineteen roles each, and they were written by asking what is *interesting*
 * about a time and place. That is the right question for a game and the wrong
 * one for a population, and what comes out is a labour market composed
 * entirely of its own exceptions. Measured across all sixty-four:
 *
 *   petty commerce      absent from 46
 *   domestic service    absent from 45
 *   mining and quarrying absent from 45
 *   food trades         absent from 39
 *   crafts              absent from 34
 *   carrying and carting absent from 28
 *   food production     absent from 18
 *
 * So the European early-modern table offered Alchemist, Witch, Plague Doctor,
 * Lens Grinder, Tapestry Weaver and Silk Merchant, and no farmer, no servant,
 * no carter, no baker and nobody selling anything in a street. Nine in ten
 * lives in that society are not in the table at all.
 *
 * This file is the substrate: the work that was done nearly everywhere people
 * farmed, built, ate, carried things and looked after each other. The zone
 * tables keep their distinctive top layer — a Pochteca is a real and specific
 * thing and belongs where it is — and this supplies the base underneath it.
 *
 * **How it stays honest across sixty-four tables.** Every role declares the
 * society capabilities it presupposes, and is filtered against
 * `societyCapabilities` at generation time for the actual year, zone and place.
 * A smith needs metallurgy, a market seller needs `market_exchange`, an
 * innkeeper needs `urban_settlement`, a scribe needs writing, a factory hand
 * needs `wage_labor`. That is what lets one authored list serve every table
 * without putting a blacksmith in a society with no smelting or a wage
 * labourer in one with no wages — and it means the list degrades correctly in
 * places the era label alone would get wrong, like antiquity in Oceania.
 *
 * Everything lands in `COMMONER`. The industrial-era draw filters social
 * classes against a `ProfessionContext`, and `COMMONER` is one of the two names
 * that always survives it; a more descriptive class name would be silently
 * dropped in exactly the tables that need this most.
 */

import { HistoricalEra } from '../../types';
import { hasCapability, type SocietyCapability } from '../societyCapabilities';
import { textureRolesFor, type TextureContext } from './textureProfessions';
import type { CulturalZone, ProfessionData, ProfessionDefinition, RoleMap } from './professions';

/** A role plus the conditions under which the society could contain it. */
interface CommonRole {
  role: string;
  def: ProfessionDefinition;
  /** Every one of these must hold for the role to appear. */
  needs?: SocietyCapability[];
  /** At least one of these must hold. For work with more than one basis. */
  needsAny?: SocietyCapability[];
  /** None of these may hold. For work a later capability puts an end to. */
  excludes?: SocietyCapability[];
}

// Shorthand for the stat profiles that recur. A field hand needs a back, not a
// biography, and most of these roles should not be gated hard on a random roll.
const HEAVY = { minStrength: 5, minStamina: 4 };
const STEADY = { minStamina: 3 };
const DEFT = { minDexterity: 4 };
const CAREFUL = { minDexterity: 4, minPerception: 4 };

const r = (
  role: string,
  emoji: string,
  keywords: string,
  extra: Partial<ProfessionDefinition> = {},
  gate: { needs?: SocietyCapability[]; needsAny?: SocietyCapability[] } = {},
): CommonRole => ({
  role,
  def: { statRequirements: STEADY, keywords, emoji, ...extra },
  ...gate,
});

/* ======================================================================== */
/*  PREHISTORY — foraging, early horticulture, no standing specialists      */
/* ======================================================================== */

const PREHISTORIC_WORK: CommonRole[] = [
  r('Forager', '🌿', 'foraging'),
  r('Hunter', '🏹', 'hunting', { statRequirements: HEAVY }),
  r('Fisher', '🐟', 'fishing', { statRequirements: STEADY }),
  r('Trapper', '🪤', 'hunting', { statRequirements: CAREFUL }),
  r('Fowler', '🦆', 'hunting', { statRequirements: CAREFUL }),
  r('Shellfish Gatherer', '🐚', 'foraging'),
  r('Root Digger', '🥕', 'foraging'),
  r('Flintknapper', '🪨', 'toolmaking', { statRequirements: DEFT }),
  r('Toolmaker', '🪓', 'toolmaking', { statRequirements: DEFT }),
  r('Hide Worker', '🦌', 'hides', { statRequirements: STEADY }),
  r('Cordage Maker', '🪢', 'fibre', { statRequirements: DEFT }),
  r('Basket Weaver', '🧺', 'weaving', { statRequirements: DEFT }),
  r('Firekeeper', '🔥', 'fire'),
  r('Water Carrier', '🪣', 'water', { statRequirements: { minStrength: 4 } }),
  r('Wood Gatherer', '🪵', 'fuel', { statRequirements: { minStrength: 4 } }),
  r('Healer', '🌱', 'medicine', { statRequirements: { minPerception: 5 } }),
  r('Child Minder', '👶', 'household', { genderBias: 'Female' }),
];

/* ======================================================================== */
/*  THE SETTLED SUBSTRATE — everything below presupposes farming            */
/* ======================================================================== */

/** Work that exists in any village with fields, from antiquity onward. */
const VILLAGE_WORK: CommonRole[] = [
  r('Potter', '🏺', 'pottery', { statRequirements: DEFT }),
  r('Weaver', '🧶', 'textiles', { statRequirements: DEFT }),
  r('Spinner', '🧵', 'textiles', { statRequirements: DEFT, genderBias: 'Female' }),
  r('Dyer', '🎨', 'textiles', { statRequirements: DEFT }),
  r('Tanner', '🧴', 'leather', { statRequirements: HEAVY }),
  r('Leatherworker', '👝', 'leather', { statRequirements: DEFT }),
  r('Carpenter', '🪚', 'woodwork', { statRequirements: { minStrength: 4, minDexterity: 5 } }),
  r('Woodcutter', '🪓', 'forestry', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Charcoal Burner', '🪵', 'charcoal', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Thatcher', '🏚️', 'roofing', { statRequirements: STEADY, genderBias: 'Male' }),
  r('Rope Maker', '🪢', 'fibre', { statRequirements: DEFT }),
  r('Net Maker', '🕸️', 'fishing', { statRequirements: DEFT }),
  r('Basket Maker', '🧺', 'weaving', { statRequirements: DEFT }),
  r('Beekeeper', '🐝', 'honey'),
  r('Water Carrier', '🪣', 'water', { statRequirements: { minStrength: 4 } }),
  r('Wet Nurse', '🍼', 'household', { genderBias: 'Female' }),
  r('Midwife', '🤲', 'medicine', { statRequirements: CAREFUL, genderBias: 'Female' }),
  r('Herbalist', '🌿', 'medicine', { statRequirements: { minPerception: 5 } }),
  r('Laundress', '🧺', 'household', { genderBias: 'Female' }),
  r('Servant', '🧹', 'household', {}, { needsAny: ['heritable_land', 'urban_settlement', 'market_exchange'] }),
  r('Housemaid', '🧹', 'household', { genderBias: 'Female' }, { needsAny: ['heritable_land', 'urban_settlement'] }),
  r('Cook', '🍲', 'food', {}, { needsAny: ['heritable_land', 'urban_settlement'] }),
  r('Porter', '📦', 'carrying', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Mason', '🧱', 'stonework', { statRequirements: HEAVY }, { needsAny: ['urban_settlement', 'heritable_land'] }),
  r('Brickmaker', '🧱', 'brick', { statRequirements: HEAVY }, { needsAny: ['urban_settlement', 'settled_agriculture'] }),
  r('Quarryman', '⛏️', 'stone', { statRequirements: HEAVY, genderBias: 'Male' }, { needsAny: ['urban_settlement', 'metallurgy'] }),
  r('Lime Burner', '🔥', 'lime', { statRequirements: HEAVY, genderBias: 'Male' }, { needsAny: ['urban_settlement', 'metallurgy'] }),
  r('Salt Worker', '🧂', 'salt', { statRequirements: HEAVY }),
  r('Baker', '🥖', 'food', { statRequirements: STEADY }, { needs: ['settled_agriculture'] }),
  r('Miller', '⚙️', 'grain', { statRequirements: { minStrength: 5 } }, { needs: ['settled_agriculture'] }),
  r('Brewer', '🍺', 'drink', {}, { needs: ['settled_agriculture'] }),
  r('Butcher', '🔪', 'food', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Oil Presser', '🫒', 'oil', { statRequirements: { minStrength: 4 } }),
  r('Smith', '🔨', 'metalwork', { statRequirements: { minStrength: 6, minDexterity: 5 } }, { needs: ['metallurgy'] }),
  r('Miner', '⛏️', 'mining', { statRequirements: HEAVY, genderBias: 'Male' }, { needs: ['metallurgy'] }),
  r('Carter', '🛒', 'transport', { genderBias: 'Male' }, { needs: ['draft_animals'] }),
  r('Drover', '🐂', 'herding', { genderBias: 'Male' }, { needs: ['draft_animals'] }),
  r('Boatman', '🛶', 'transport', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Ferryman', '⛴️', 'transport', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Market Seller', '🧺', 'trade', { genderBias: 'Female' }, { needs: ['market_exchange'] }),
  r('Pedlar', '🎒', 'trade', {}, { needs: ['market_exchange'] }),
  r('Hawker', '📢', 'trade', {}, { needs: ['market_exchange'] }),
  r('Innkeeper', '🍺', 'hospitality', {}, { needs: ['urban_settlement'] }),
  r('Scribe', '📜', 'writing', { statRequirements: { minIntelligence: 6 } }, { needs: ['writing'] }),
  r('Barber', '💈', 'grooming', { statRequirements: DEFT }, { needs: ['urban_settlement'] }),
  r('Sweeper', '🧹', 'sanitation', {}, { needs: ['urban_settlement'] }),
  r('Night Soil Collector', '🪣', 'sanitation', { genderBias: 'Male' }, { needs: ['urban_settlement'] }),
];

/** Trades that come in with guilds, coin and larger towns. */
const TOWN_WORK: CommonRole[] = [
  r('Blacksmith', '🔨', 'metalwork', { statRequirements: { minStrength: 6, minDexterity: 5 } }, { needs: ['metallurgy'] }),
  r('Cooper', '🛢️', 'barrels', { statRequirements: { minStrength: 5, minDexterity: 5 }, genderBias: 'Male' }),
  r('Cobbler', '👞', 'shoes', { statRequirements: DEFT }),
  r('Tailor', '🧵', 'clothing', { statRequirements: DEFT }),
  r('Seamstress', '🪡', 'clothing', { statRequirements: DEFT, genderBias: 'Female' }),
  r('Fuller', '🧼', 'textiles', { statRequirements: HEAVY }),
  r('Wool Comber', '🐑', 'textiles', { statRequirements: STEADY }),
  r('Saddler', '🐴', 'leather', { statRequirements: DEFT }, { needs: ['draft_animals'] }),
  r('Wheelwright', '🛞', 'woodwork', { statRequirements: { minStrength: 5, minDexterity: 5 } }, { needs: ['draft_animals'] }),
  r('Candle Maker', '🕯️', 'candles', { statRequirements: DEFT }),
  r('Soap Boiler', '🧼', 'soap', { statRequirements: HEAVY }),
  r('Glazier', '🪟', 'glass', { statRequirements: DEFT }, { needs: ['urban_settlement'] }),
  r('Sawyer', '🪚', 'timber', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Ostler', '🐴', 'stables', { genderBias: 'Male' }, { needs: ['draft_animals'] }),
  r('Muleteer', '🫏', 'transport', { genderBias: 'Male' }, { needs: ['draft_animals'] }),
  r('Chapman', '🎒', 'trade', {}, { needs: ['market_exchange'] }),
  r('Alewife', '🍺', 'drink', { genderBias: 'Female' }, { needs: ['market_exchange'] }),
  r('Washerwoman', '🧺', 'household', { genderBias: 'Female' }),
  r('Scullion', '🍽️', 'household'),
  r('Sexton', '⛪', 'church', { genderBias: 'Male' }, { needs: ['urban_settlement'] }),
  r('Dock Labourer', '⚓', 'docks', { statRequirements: HEAVY, genderBias: 'Male' }, { needs: ['urban_settlement'] }),
  r('Peat Cutter', '🟫', 'fuel', { statRequirements: HEAVY }),
];

/** The nineteenth-century additions: wage work at scale. */
const INDUSTRIAL_WORK: CommonRole[] = [
  r('Factory Hand', '🏭', 'factory', {}, { needs: ['wage_labor'] }),
  r('Mill Worker', '🧵', 'textiles', { genderBias: 'Female' }, { needs: ['wage_labor'] }),
  r('Power Loom Weaver', '🧶', 'textiles', { genderBias: 'Female' }, { needs: ['wage_labor'] }),
  r('Coal Miner', '⛏️', 'mining', { statRequirements: HEAVY, genderBias: 'Male' }, { needs: ['metallurgy'] }),
  r('Ironworker', '🔩', 'metalwork', { statRequirements: HEAVY, genderBias: 'Male' }, { needs: ['metallurgy'] }),
  r('Navvy', '⛏️', 'construction', { statRequirements: HEAVY, genderBias: 'Male' }, { needs: ['wage_labor'] }),
  r('Railway Labourer', '🚂', 'railway', { statRequirements: HEAVY, genderBias: 'Male' }, { needs: ['wage_labor'] }),
  r('Dock Worker', '⚓', 'docks', { statRequirements: HEAVY, genderBias: 'Male' }, { needs: ['wage_labor'] }),
  r('Carter', '🛒', 'transport', { genderBias: 'Male' }),
  r('Cabman', '🐴', 'transport', { genderBias: 'Male' }, { needs: ['urban_settlement'] }),
  r('Street Hawker', '📢', 'trade', {}, { needs: ['market_exchange'] }),
  r('Costermonger', '🍎', 'trade', {}, { needs: ['market_exchange'] }),
  r('Charwoman', '🧹', 'household', { genderBias: 'Female' }),
  r('Domestic Servant', '🧹', 'household', { genderBias: 'Female' }),
  r('Laundress', '🧺', 'household', { genderBias: 'Female' }),
  r('Seamstress', '🪡', 'clothing', { statRequirements: DEFT, genderBias: 'Female' }),
  r('Chimney Sweep', '🧹', 'sanitation', { genderBias: 'Male' }, { needs: ['urban_settlement'] }),
  r('Brickmaker', '🧱', 'brick', { statRequirements: HEAVY }),
  r('Stonemason', '🧱', 'stonework', { statRequirements: HEAVY }),
  r('Baker', '🥖', 'food'),
  r('Butcher', '🔪', 'food', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Publican', '🍺', 'hospitality', {}, { needs: ['urban_settlement'] }),
  r('Shop Assistant', '🛍️', 'retail', {}, { needs: ['market_exchange'] }),
  r('Errand Boy', '🏃', 'errands', { genderBias: 'Male' }, { needs: ['urban_settlement'] }),
  r('Nurse', '🩺', 'medicine', { genderBias: 'Female' }),
  r('Sailor', '⚓', 'seafaring', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Boilermaker', '🔧', 'metalwork', { statRequirements: HEAVY, genderBias: 'Male' }, { needs: ['metallurgy'] }),
  r('Match Worker', '🔥', 'factory', { genderBias: 'Female' }, { needs: ['wage_labor'] }),
];

/** The twentieth-century base is heavy on offices; this is the rest of it. */
const MODERN_WORK: CommonRole[] = [
  r('Cleaner', '🧹', 'cleaning', { genderBias: 'Female' }),
  r('Care Worker', '🩺', 'care', { genderBias: 'Female', decadeRange: [1950, 2029] }),
  r('Hospital Orderly', '🏥', 'hospital', { decadeRange: [1920, 2029] }),
  r('Kitchen Porter', '🍽️', 'kitchen', { decadeRange: [1950, 2029] }),
  r('Shop Assistant', '🛍️', 'retail'),
  r('Bus Driver', '🚌', 'transport', { decadeRange: [1920, 2029] }),
  r('Lorry Driver', '🚚', 'transport', { genderBias: 'Male', decadeRange: [1920, 2029] }),
  r('Security Guard', '🛡️', 'security', { genderBias: 'Male', decadeRange: [1950, 2029] }),
  r('Refuse Collector', '🗑️', 'sanitation', { statRequirements: HEAVY, genderBias: 'Male', decadeRange: [1930, 2029] }),
  r('Construction Labourer', '🏗️', 'construction', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Machine Operator', '⚙️', 'factory', { decadeRange: [1930, 2029] }),
  r('Plumber', '🔧', 'trades', { genderBias: 'Male' }),
  r('Electrician', '💡', 'trades', { genderBias: 'Male', decadeRange: [1900, 2029] }),
  r('Hairdresser', '💇', 'grooming', { genderBias: 'Female' }),
  r('Childminder', '👶', 'care', { genderBias: 'Female', decadeRange: [1950, 2029] }),
  r('Fisherman', '🐟', 'fishing', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Miner', '⛏️', 'mining', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Street Vendor', '🛒', 'trade'),
  r('Laundry Worker', '🧺', 'laundry', { genderBias: 'Female' }),
  r('Night Watchman', '🔦', 'security', { genderBias: 'Male' }),
  // The building and food trades did not stop existing in 1900. The modern
  // base table is almost entirely offices and services, so without these a
  // twentieth-century society has nobody who can lay a brick or bake a loaf.
  r('Carpenter', '🪚', 'woodwork', { statRequirements: DEFT, genderBias: 'Male' }),
  r('Bricklayer', '🧱', 'construction', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Painter and Decorator', '🎨', 'trades', { genderBias: 'Male' }),
  r('Welder', '🔥', 'metalwork', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Motor Mechanic', '🔧', 'trades', { statRequirements: DEFT, genderBias: 'Male', decadeRange: [1910, 2029] }),
  r('Tailor', '🧵', 'clothing', { statRequirements: DEFT }),
  r('Baker', '🥖', 'food'),
  r('Butcher', '🔪', 'food', { statRequirements: HEAVY, genderBias: 'Male' }),
  r('Cook', '🍲', 'food'),
  r('Waiter', '🍽️', 'hospitality'),
  r('Barber', '💈', 'grooming', { statRequirements: DEFT, genderBias: 'Male' }),
];

/**
 * Which substrate each era draws on.
 *
 * Antiquity through the early modern share the village and town lists because
 * the work genuinely did not change much — a fifteenth-century cooper and a
 * first-century one are doing the same job — and the capability gates do the
 * discriminating that the era label cannot.
 */
/**
 * Foraging as a living, for the antiquity-era societies still doing it.
 *
 * The antiquity list used to take the first eight prehistoric roles wholesale
 * and ungated, and because hunting and foraging count as food production they
 * collected the full subsistence boost on top. The commonest occupation in the
 * city of Rome came out **hunter**, at nineteen per cent, with flintknappers
 * under Hadrian. Antiquity is not one economy: it is imperial Italy and it is
 * also the Australian interior, and the difference between them is exactly
 * whether the society farms.
 *
 * People in farming societies still hunted, fished and snared — but as a way
 * to eat, not as the answer to what they did. Where the trade genuinely was
 * someone's living, it comes back through the texture layer: a lord's
 * huntsman, a warrener, a fowler on the marsh.
 */
const FORAGING_WORK: CommonRole[] = PREHISTORIC_WORK.slice(0, 8).map(entry => ({
  ...entry,
  excludes: ['settled_agriculture'],
}));

const BY_ERA: Partial<Record<HistoricalEra, CommonRole[]>> = {
  [HistoricalEra.PREHISTORY]: PREHISTORIC_WORK,
  [HistoricalEra.ANTIQUITY]: [...FORAGING_WORK, ...VILLAGE_WORK],
  [HistoricalEra.MEDIEVAL]: [...VILLAGE_WORK, ...TOWN_WORK],
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [...VILLAGE_WORK, ...TOWN_WORK],
  [HistoricalEra.INDUSTRIAL_ERA]: [...VILLAGE_WORK, ...TOWN_WORK, ...INDUSTRIAL_WORK],
  [HistoricalEra.MODERN_ERA]: MODERN_WORK,
  [HistoricalEra.FUTURE_ERA]: MODERN_WORK,
};

/* ======================================================================== */
/*  FOOD PRODUCTION — the eighteen tables that had none                     */
/* ======================================================================== */

const LABOURING = { minStrength: 4, minStamina: 4 };
const LIGHT = { minStamina: 3 };

const CORE_FARMING: RoleMap = {
  'Farmer': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🌾' },
  'Farm Labourer': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.35 }, keywords: 'agriculture', emoji: '🌾' },
  'Tenant Farmer': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.5 }, keywords: 'agriculture', emoji: '🌾' },
  'Shepherd': { statRequirements: LIGHT, keywords: 'herding', emoji: '🐑' },
  'Thresher': { statRequirements: LABOURING, keywords: 'harvest', emoji: '🌾' },
};

export const AGRARIAN_BACKFILL: ProfessionData = {
  EUROPEAN: {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      COMMONER: {
        ...CORE_FARMING,
        'Ploughman': { statRequirements: { minStrength: 5, minStamina: 5 }, genderBias: 'Male', keywords: 'agriculture', emoji: '🐂' },
        'Cottager': { statRequirements: LIGHT, socialRequirements: { maxPrivilege: 0.25 }, keywords: 'smallholding', emoji: '🏚️' },
        'Vine Dresser': { statRequirements: LIGHT, keywords: 'viticulture', emoji: '🍇' },
        'Dairymaid': { statRequirements: LIGHT, genderBias: 'Female', keywords: 'dairy', emoji: '🥛' },
        'Swineherd': { statRequirements: LIGHT, keywords: 'herding', emoji: '🐖' },
        'Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
      },
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      COMMONER: {
        ...CORE_FARMING,
        'Agricultural Labourer': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.3 }, keywords: 'agriculture', emoji: '🌾' },
        'Crofter': { statRequirements: LIGHT, socialRequirements: { maxPrivilege: 0.3 }, keywords: 'smallholding', emoji: '🏚️' },
        'Dairymaid': { statRequirements: LIGHT, genderBias: 'Female', keywords: 'dairy', emoji: '🥛' },
        'Market Gardener': { statRequirements: LIGHT, keywords: 'horticulture', emoji: '🥕' },
        'Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
      },
    },
  },

  EAST_ASIAN: {
    [HistoricalEra.INDUSTRIAL_ERA]: {
      COMMONER: {
        'Rice Farmer': { statRequirements: LABOURING, keywords: 'agriculture rice', emoji: '🌾' },
        'Tenant Farmer': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.4 }, keywords: 'agriculture', emoji: '🌾' },
        'Field Labourer': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.3 }, keywords: 'agriculture', emoji: '🌾' },
        'Tea Grower': { statRequirements: LIGHT, keywords: 'tea', emoji: '🍵' },
        'Silk Farmer': { statRequirements: LIGHT, keywords: 'sericulture', emoji: '🧵' },
        'Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
        'Herder': { statRequirements: LIGHT, keywords: 'herding', emoji: '🐄' },
      },
    },
  },

  SOUTH_ASIAN: {
    [HistoricalEra.PREHISTORY]: {
      COMMONER: {
        'Forager': { statRequirements: LIGHT, keywords: 'foraging', emoji: '🌿' },
        'Hunter': { statRequirements: LABOURING, keywords: 'hunting', emoji: '🏹' },
        'Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
        'Herder': { statRequirements: LIGHT, keywords: 'herding', emoji: '🐐' },
      },
    },
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      COMMONER: {
        'Cultivator': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🌾' },
        'Tenant Cultivator': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.4 }, keywords: 'agriculture', emoji: '🌾' },
        'Field Labourer': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.3 }, keywords: 'agriculture', emoji: '🌾' },
        'Cotton Grower': { statRequirements: LIGHT, keywords: 'cotton', emoji: '🌱' },
        'Herder': { statRequirements: LIGHT, keywords: 'herding', emoji: '🐐' },
        'Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
        'Milkmaid': { statRequirements: LIGHT, genderBias: 'Female', keywords: 'dairy', emoji: '🥛' },
      },
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      COMMONER: {
        'Cultivator': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🌾' },
        'Sharecropper': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.25 }, keywords: 'agriculture', emoji: '🌾' },
        'Field Labourer': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.25 }, keywords: 'agriculture', emoji: '🌾' },
        'Tea Picker': { statRequirements: LIGHT, genderBias: 'Female', keywords: 'tea', emoji: '🍵' },
        'Jute Grower': { statRequirements: LABOURING, keywords: 'jute', emoji: '🌱' },
        'Herder': { statRequirements: LIGHT, keywords: 'herding', emoji: '🐐' },
        'Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
      },
    },
  },

  MENA: {
    [HistoricalEra.INDUSTRIAL_ERA]: {
      COMMONER: {
        'Fellah': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.3 }, keywords: 'agriculture', emoji: '🌾' },
        'Field Labourer': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.3 }, keywords: 'agriculture', emoji: '🌾' },
        'Date Cultivator': { statRequirements: LIGHT, keywords: 'dates', emoji: '🌴' },
        'Shepherd': { statRequirements: LIGHT, keywords: 'herding', emoji: '🐑' },
        'Goatherd': { statRequirements: LIGHT, keywords: 'herding', emoji: '🐐' },
        'Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
      },
    },
  },

  OCEANIA: {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      COMMONER: {
        'Taro Cultivator': { statRequirements: LABOURING, keywords: 'horticulture', emoji: '🌱' },
        'Yam Grower': { statRequirements: LABOURING, keywords: 'horticulture', emoji: '🍠' },
        'Reef Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
        'Pig Keeper': { statRequirements: LIGHT, keywords: 'husbandry', emoji: '🐖' },
        'Forager': { statRequirements: LIGHT, keywords: 'foraging', emoji: '🌿' },
        'Canoe Builder': { statRequirements: DEFT, genderBias: 'Male', keywords: 'woodwork', emoji: '🛶' },
        'Bark Cloth Beater': { statRequirements: LIGHT, genderBias: 'Female', keywords: 'textiles', emoji: '🧵' },
      },
    },
  },

  SOUTH_AMERICAN: {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      COMMONER: {
        'Farm Worker': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.35 }, keywords: 'agriculture', emoji: '🌾' },
        'Maize Cultivator': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🌽' },
        'Potato Farmer': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🥔' },
        'Llama Herder': { statRequirements: LIGHT, keywords: 'herding', emoji: '🦙' },
        'Coca Grower': { statRequirements: LIGHT, keywords: 'coca', emoji: '🌿' },
        'Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
      },
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      COMMONER: {
        'Farm Worker': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.35 }, keywords: 'agriculture', emoji: '🌾' },
        'Coffee Picker': { statRequirements: LABOURING, keywords: 'coffee', emoji: '☕' },
        'Cattle Hand': { statRequirements: LABOURING, genderBias: 'Male', keywords: 'herding', emoji: '🐄' },
        'Llama Herder': { statRequirements: LIGHT, keywords: 'herding', emoji: '🦙' },
        'Maize Cultivator': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🌽' },
        'Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
      },
    },
  },

  NORTH_AMERICAN_COLONIAL: {
    [HistoricalEra.INDUSTRIAL_ERA]: {
      COMMONER: {
        'Farmer': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🌾' },
        'Farm Hand': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.35 }, keywords: 'agriculture', emoji: '🌾' },
        'Sharecropper': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.25 }, keywords: 'agriculture', emoji: '🌾' },
        'Homesteader': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🏚️' },
        'Ranch Hand': { statRequirements: LABOURING, genderBias: 'Male', keywords: 'herding', emoji: '🐄' },
        'Dairy Farmer': { statRequirements: LIGHT, keywords: 'dairy', emoji: '🥛' },
        'Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
      },
    },
  },

  SUB_SAHARAN_AFRICAN: {
    [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
      COMMONER: {
        'Cultivator': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🌾' },
        'Millet Farmer': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🌾' },
        'Yam Grower': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🍠' },
        'Cattle Herder': { statRequirements: LIGHT, keywords: 'herding', emoji: '🐄' },
        'Goatherd': { statRequirements: LIGHT, keywords: 'herding', emoji: '🐐' },
        'Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
      },
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      COMMONER: {
        'Cultivator': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🌾' },
        'Field Labourer': { statRequirements: LABOURING, socialRequirements: { maxPrivilege: 0.3 }, keywords: 'agriculture', emoji: '🌾' },
        'Cattle Herder': { statRequirements: LIGHT, keywords: 'herding', emoji: '🐄' },
        'Groundnut Grower': { statRequirements: LABOURING, keywords: 'agriculture', emoji: '🥜' },
        'Palm Tapper': { statRequirements: LIGHT, genderBias: 'Male', keywords: 'palm', emoji: '🌴' },
        'Fisher': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
      },
    },
  },
};

export const FUTURE_FARMING: RoleMap = {
  'Farm Technician': { statRequirements: LIGHT, keywords: 'agriculture', emoji: '🌾' },
  'Hydroponics Worker': { statRequirements: LIGHT, keywords: 'agriculture', emoji: '🌱' },
  'Vertical Farm Worker': { statRequirements: LIGHT, keywords: 'agriculture', emoji: '🏢' },
  'Fishery Worker': { statRequirements: LABOURING, keywords: 'fishing', emoji: '🐟' },
};

/* ======================================================================== */

/**
 * The zone-and-era table, with the ordinary work merged in.
 *
 * The substrate is filtered against what this society could actually contain,
 * so the same authored list yields a flintknapper on the Palaeolithic Plains, a
 * cooper in fifteenth-century Flanders and neither in the wrong one. Existing
 * roles win: a zone table that already names a trade keeps its own definition
 * and its own social class.
 */
export function professionsFor(
  base: Record<string, RoleMap> | undefined,
  zone: CulturalZone,
  era: HistoricalEra,
  ctx: TextureContext,
): Record<string, RoleMap> | undefined {
  const merged: Record<string, RoleMap> = {};
  for (const [socialClass, roles] of Object.entries(base ?? {})) {
    merged[socialClass] = { ...roles };
  }

  const already = new Set(
    Object.values(merged).flatMap(roles => Object.keys(roles).map(k => k.toLowerCase())),
  );

  const commoner: RoleMap = { ...(merged.COMMONER ?? {}) };

  for (const entry of BY_ERA[era] ?? []) {
    if (already.has(entry.role.toLowerCase())) continue;
    if (entry.needs && !entry.needs.every(c => hasCapability(c, ctx))) continue;
    if (entry.needsAny && !entry.needsAny.some(c => hasCapability(c, ctx))) continue;
    if (entry.excludes?.some(c => hasCapability(c, ctx))) continue;
    commoner[entry.role] = entry.def;
  }

  for (const [socialClass, roles] of Object.entries(AGRARIAN_BACKFILL[zone]?.[era] ?? {})) {
    if (socialClass === 'COMMONER') Object.assign(commoner, roles);
    else merged[socialClass] = { ...(merged[socialClass] ?? {}), ...roles };
  }

  if (era === HistoricalEra.FUTURE_ERA) Object.assign(commoner, FUTURE_FARMING);

  // The distinctive tail. Added last and never overriding an authored role, so
  // a zone table that already names a trade keeps its own definition.
  for (const [role, def] of Object.entries(textureRolesFor(zone, era, ctx))) {
    if (already.has(role.toLowerCase())) continue;
    commoner[role] = def;
  }

  if (Object.keys(commoner).length > 0) merged.COMMONER = commoner;
  collapseSynonyms(merged);
  return Object.keys(merged).length > 0 ? merged : base;
}

/**
 * Pairs of names for one job, and which of the two to keep.
 *
 * The substrate lists were written era by era, so a medieval draw offered
 * Smith from the village list and Blacksmith from the town one. Two entries
 * for one occupation is two chances to draw it, and the player sees the same
 * result twice under two names — as with Fisher and Fisherman, which between
 * them were 11% of Rome until the tables were made to agree on one word.
 */
const SYNONYMS: Array<[drop: string, keep: string]> = [
  ['Smith', 'Blacksmith'],
  ['Basket Weaver', 'Basket Maker'],
  ['Washerwoman', 'Laundress'],
  ['Domestic Servant', 'Servant'],
  ['Mason', 'Stonemason'],
  ['Child Minder', 'Childminder'],
  ['Dock Labourer', 'Dock Worker'],
  ['Street Hawker', 'Hawker'],
];

function collapseSynonyms(tables: Record<string, RoleMap>): void {
  // Across classes, not within them: the zone tables file a fisherman under
  // WORKING_CLASS while the substrate adds a fisher to COMMONER, and both are
  // reachable from the same draw.
  const present = new Set(Object.values(tables).flatMap(roles => Object.keys(roles)));
  for (const [drop, keep] of SYNONYMS) {
    if (!present.has(drop) || !present.has(keep)) continue;
    for (const roles of Object.values(tables)) delete roles[drop];
  }
}
