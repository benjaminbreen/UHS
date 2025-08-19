/**
 * Event Template Utilities
 * Functions for filling event templates with contextually appropriate variables
 */

import { EventContext } from '../types/eventTypes';
import { HistoricalEra } from '../constants/historicalEras';
import { CulturalZone } from '../constants/geography';

/**
 * Fill a template string with context-appropriate variables
 */
export function fillTemplate(
  template: string, 
  variables: Record<string, string[]>,
  context?: EventContext
): string {
  let filled = template;
  
  // Get context-enhanced variables if context provided
  const enhancedVariables = context 
    ? { ...variables, ...getContextVariables(context) }
    : variables;
  
  // Replace each [VARIABLE] with random selection from options
  Object.entries(enhancedVariables).forEach(([key, options]) => {
    if (!options || options.length === 0) return;
    
    const regex = new RegExp(`\\[${key}\\]`, 'g');
    const randomOption = options[Math.floor(Math.random() * options.length)];
    filled = filled.replace(regex, randomOption);
  });
  
  return filled;
}

/**
 * Get context-specific variables based on era, culture, and environment
 */
export function getContextVariables(context: EventContext): Record<string, string[]> {
  const variables: Record<string, string[]> = {};
  
  // Season
  variables.SEASON = [context.season || 'the season'];
  
  // Get era-specific variables
  const eraVars = getEraVariables(context.era);
  Object.assign(variables, eraVars);
  
  // Get culture-specific variables
  const cultureVars = getCultureVariables(context.culturalZone, context.era);
  Object.assign(variables, cultureVars);
  
  // Get biome-specific variables if applicable
  if (context.biome) {
    const biomeVars = getBiomeVariables(context.biome);
    Object.assign(variables, biomeVars);
  }
  
  // Get profession-specific variables if applicable
  if (context.playerProfession) {
    const professionVars = getProfessionVariables(context.playerProfession, context.era);
    Object.assign(variables, professionVars);
  }
  
  // Get season-specific variables if applicable
  if (context.season) {
    const seasonVars = getSeasonVariables(context.season);
    Object.assign(variables, seasonVars);
  }
  
  // Get wealth-specific variables if applicable
  if (context.playerWealth) {
    const wealthVars = getWealthVariables(context.playerWealth);
    Object.assign(variables, wealthVars);
  }
  
  return variables;
}

/**
 * Get era-specific variable options
 */
function getEraVariables(era: HistoricalEra): Record<string, string[]> {
  const vars: Record<string, string[]> = {};
  
  switch(era) {
    case 'ancient':
      vars.RESOURCE = ['grain', 'water', 'olive oil', 'wine', 'salt', 'barley', 'wheat', 'wood', 'stone', 'clay', 'copper', 'bronze', 'wool', 'flax', 'honey', 'wax', 'milk', 'cheese', 'fish', 'meat'];
      vars.GOODS = ['amphorae', 'pottery', 'bronze tools', 'wool cloth', 'grain sacks', 'oil jars', 'wine vessels', 'leather goods', 'wooden furniture', 'stone sculptures', 'jewelry', 'weapons', 'shields', 'sandals', 'cloaks'];
      vars.HAZARD = ['raiders', 'drought', 'flooding', 'barbarian invasion', 'plague', 'earthquake', 'volcanic eruption', 'crop failure', 'wild beasts', 'storms at sea', 'tribal warfare', 'slave revolts', 'civil war', 'foreign conquest'];
      vars.GROUP = ['citizens', 'slaves', 'foreigners', 'soldiers', 'craftsmen', 'farmers', 'merchants', 'priests', 'patricians', 'plebeians', 'barbarians', 'allies', 'servants', 'gladiators', 'scribes'];
      vars.AUTHORITY = ['the consul', 'the emperor', 'the senate', 'the king', 'the priests', 'the council', 'the magistrate', 'the pharaoh', 'the satrap', 'the tribal chief'];
      vars.ANIMAL = ['ox', 'donkey', 'horse', 'goat', 'sheep', 'pig', 'chicken', 'duck', 'goose', 'dog', 'cat', 'dove'];
      vars.TOOL = ['plow', 'scythe', 'hoe', 'hammer', 'chisel', 'saw', 'loom', 'spindle', 'millstone', 'anvil', 'tongs', 'bellows'];
      vars.BUILDING = ['temple', 'forum', 'amphitheater', 'aqueduct', 'villa', 'insulae', 'granary', 'bath house', 'library', 'market', 'palace', 'fortress'];
      vars.FOOD = ['bread', 'porridge', 'olives', 'figs', 'dates', 'honey cakes', 'cheese', 'yogurt', 'roasted meat', 'fish sauce', 'wine', 'beer'];
      break;
      
    case 'medieval':
      vars.RESOURCE = ['grain', 'ale', 'firewood', 'wool', 'salt', 'oats', 'barley', 'rye', 'peat', 'charcoal', 'iron ore', 'limestone', 'clay', 'hemp', 'flax', 'beeswax', 'tallow', 'fish', 'venison', 'mutton'];
      vars.GOODS = ['woolen cloth', 'iron tools', 'leather goods', 'grain sacks', 'timber planks', 'stone blocks', 'parchment', 'vellum', 'candles', 'soap', 'rope', 'horseshoes', 'nails', 'pottery', 'tapestries'];
      vars.HAZARD = ['plague', 'war', 'famine', 'harsh winter', 'bandits', 'Viking raids', 'Mongol invasion', 'crop blight', 'wolves', 'bears', 'flooding', 'fire', 'heresy accusations', 'excommunication'];
      vars.GROUP = ['peasants', 'nobles', 'clergy', 'merchants', 'soldiers', 'serfs', 'freemen', 'knights', 'monks', 'nuns', 'pilgrims', 'minstrels', 'craftsmen', 'apprentices', 'journeymen'];
      vars.AUTHORITY = ['the lord', 'the church', 'the guild', 'the king', 'the bishop', 'the abbot', 'the sheriff', 'the bailiff', 'the pope', 'the emperor'];
      vars.ANIMAL = ['ox', 'horse', 'donkey', 'mule', 'cow', 'sheep', 'goat', 'pig', 'chicken', 'goose', 'falcon', 'hound'];
      vars.TOOL = ['plow', 'scythe', 'flail', 'hammer', 'anvil', 'bellows', 'loom', 'spinning wheel', 'quill', 'inkwell', 'crossbow', 'sword'];
      vars.BUILDING = ['castle', 'cathedral', 'monastery', 'mill', 'manor house', 'village church', 'guildhall', 'market square', 'inn', 'stable', 'granary', 'dovecote'];
      vars.FOOD = ['bread', 'pottage', 'ale', 'mead', 'cheese', 'bacon', 'salt pork', 'dried fish', 'honey', 'apples', 'cabbage', 'turnips'];
      break;
      
    case 'earlyModern':
      vars.RESOURCE = ['grain', 'coal', 'cotton', 'sugar', 'tobacco', 'coffee', 'tea', 'spices', 'silk', 'silver', 'gold', 'timber', 'furs', 'whale oil', 'gunpowder', 'iron', 'copper', 'lead', 'salt', 'rum'];
      vars.GOODS = ['textiles', 'spices', 'sugar loaves', 'firearms', 'books', 'maps', 'telescopes', 'clocks', 'furniture', 'porcelain', 'jewelry', 'paintings', 'musical instruments', 'scientific instruments', 'ships'];
      vars.HAZARD = ['revolution', 'economic crisis', 'colonial conflict', 'disease epidemic', 'piracy', 'religious war', 'witch trials', 'famine', 'hurricane', 'earthquake', 'fire', 'invasion', 'rebellion', 'inquisition'];
      vars.GROUP = ['colonists', 'natives', 'merchants', 'laborers', 'officials', 'sailors', 'soldiers', 'planters', 'slaves', 'indentured servants', 'artisans', 'burgesses', 'clergy', 'nobles', 'revolutionaries'];
      vars.AUTHORITY = ['the governor', 'the company', 'the crown', 'the parliament', 'the viceroy', 'the admiral', 'the bishop', 'the magistrate', 'the mayor', 'the council'];
      vars.ANIMAL = ['horse', 'ox', 'cow', 'pig', 'sheep', 'chicken', 'turkey', 'llama', 'alpaca', 'buffalo', 'camel', 'elephant'];
      vars.TOOL = ['musket', 'cannon', 'printing press', 'compass', 'astrolabe', 'telescope', 'pendulum clock', 'plow', 'loom', 'spinning wheel', 'saw', 'hammer'];
      vars.BUILDING = ['plantation', 'fort', 'church', 'courthouse', 'warehouse', 'shipyard', 'mill', 'factory', 'observatory', 'university', 'palace', 'townhouse'];
      vars.FOOD = ['bread', 'sugar', 'coffee', 'tea', 'chocolate', 'potatoes', 'corn', 'tomatoes', 'rice', 'beef', 'pork', 'fish'];
      break;
      
    case 'modern':
      vars.RESOURCE = ['fuel', 'electricity', 'food', 'medicine', 'money', 'oil', 'coal', 'steel', 'aluminum', 'rubber', 'plastic', 'chemicals', 'water', 'natural gas', 'uranium', 'rare earth metals', 'silicon', 'cotton', 'wheat', 'corn'];
      vars.GOODS = ['electronics', 'automobiles', 'pharmaceuticals', 'consumer goods', 'machinery', 'computers', 'televisions', 'radios', 'appliances', 'clothing', 'furniture', 'books', 'newspapers', 'films', 'recordings'];
      vars.HAZARD = ['economic recession', 'pandemic', 'climate disaster', 'conflict', 'nuclear accident', 'terrorism', 'cyber attack', 'stock market crash', 'unemployment', 'inflation', 'environmental pollution', 'natural disaster', 'political instability', 'social unrest'];
      vars.GROUP = ['workers', 'management', 'government', 'activists', 'corporations', 'unions', 'students', 'professionals', 'technicians', 'scientists', 'artists', 'journalists', 'politicians', 'military', 'civilians'];
      vars.AUTHORITY = ['the government', 'the corporation', 'the union', 'the court', 'the president', 'the congress', 'the supreme court', 'the mayor', 'the police', 'the military'];
      vars.ANIMAL = ['horse', 'cow', 'pig', 'chicken', 'dog', 'cat', 'fish', 'shrimp', 'lobster', 'beef cattle', 'dairy cows', 'sheep'];
      vars.TOOL = ['computer', 'telephone', 'automobile', 'airplane', 'tractor', 'bulldozer', 'crane', 'drill', 'welding torch', 'microscope', 'x-ray machine', 'calculator'];
      vars.BUILDING = ['factory', 'office building', 'hospital', 'school', 'university', 'apartment complex', 'shopping mall', 'airport', 'train station', 'power plant', 'stadium', 'laboratory'];
      vars.FOOD = ['bread', 'rice', 'pasta', 'vegetables', 'fruits', 'meat', 'fish', 'dairy products', 'processed foods', 'frozen foods', 'canned goods', 'fast food'];
      break;
      
    default:
      vars.RESOURCE = ['food', 'water', 'materials', 'tools'];
      vars.GOODS = ['trade goods', 'crafts', 'supplies', 'equipment'];
      vars.HAZARD = ['danger', 'crisis', 'threat', 'disaster'];
      vars.GROUP = ['locals', 'travelers', 'authorities', 'workers'];
      vars.AUTHORITY = ['the authorities', 'the leaders', 'the council'];
      vars.ANIMAL = ['livestock', 'animals', 'beasts', 'creatures'];
      vars.TOOL = ['tools', 'implements', 'instruments', 'equipment'];
      vars.BUILDING = ['structures', 'buildings', 'constructions', 'facilities'];
      vars.FOOD = ['food', 'sustenance', 'provisions', 'nourishment'];
  }
  
  return vars;
}

/**
 * Get culture-specific variable options
 */
function getCultureVariables(zone: CulturalZone, era: HistoricalEra): Record<string, string[]> {
  const vars: Record<string, string[]> = {};
  
  // European cultures
  if (zone === 'european') {
    if (era === 'ancient') {
      vars.TRADE_ITEM = ['amphora of oil', 'wine jars', 'wool fleece', 'pottery', 'bronze tools', 'grain stores', 'honey', 'leather goods', 'carved bone items', 'iron weapons'];
      vars.VALUABLE = ['family altar', 'bronze cauldron', 'fine pottery', 'land rights', 'citizenship papers', 'ancestral weapons', 'gold jewelry', 'marble statue', 'rare books', 'sacred relics'];
      vars.DIFFICULT_TASK = ['construct aqueduct', 'organize gladiator games', 'defend the forum', 'harvest olives', 'prepare for winter siege', 'negotiate with barbarians', 'build road section', 'copy manuscripts'];
      vars.FESTIVAL = ['Saturnalia', 'harvest festival', 'wine festival', 'spring planting', 'midsummer celebration', 'winter solstice', 'victory games', 'religious procession'];
    } else if (era === 'medieval') {
      vars.TRADE_ITEM = ['milk cow', 'wool fleece', 'iron tools', 'winter grain stores', 'ale barrels', 'cheese wheels', 'leather goods', 'timber planks', 'salt pork', 'honey mead'];
      vars.VALUABLE = ['family plow', 'breeding livestock', 'winter grain', 'iron sword', 'land charter', 'religious relic', 'illuminated manuscript', 'stone cottage', 'mill rights', 'church tithe'];
      vars.DIFFICULT_TASK = ['forge new horseshoes', 'repair mill wheel', 'build new barn', 'harvest before frost', 'defend village', 'pay lord\'s taxes', 'attend church court', 'prepare for pilgrimage'];
      vars.FESTIVAL = ['harvest festival', 'Christmas feast', 'Easter celebration', 'May Day', 'Michaelmas', 'saint\'s day', 'village fair', 'wedding feast'];
    } else if (era === 'earlyModern') {
      vars.TRADE_ITEM = ['printed books', 'clockwork', 'fine textiles', 'spices', 'sugar', 'coffee', 'tobacco', 'firearms', 'navigational instruments', 'paintings'];
      vars.VALUABLE = ['printing press', 'land deed', 'merchant ship', 'noble title', 'university degree', 'scientific instruments', 'art collection', 'trade patents', 'colonial plantation', 'government bonds'];
      vars.DIFFICULT_TASK = ['navigate by stars', 'negotiate trade treaty', 'establish colonial outpost', 'defend against pirates', 'survive ocean voyage', 'translate ancient texts', 'invent new machine', 'survive religious war'];
      vars.FESTIVAL = ['coronation', 'harvest thanksgiving', 'Christmas market', 'spring fair', 'royal wedding', 'peace celebration', 'guild festival', 'university graduation'];
    }
  }
  
  // East Asian cultures
  else if (zone === 'eastAsian') {
    if (era === 'ancient') {
      vars.TRADE_ITEM = ['silk cloth', 'jade ornaments', 'bronze vessels', 'tea leaves', 'porcelain', 'lacquerware', 'rice wine', 'calligraphy scrolls', 'medicinal herbs', 'bamboo goods'];
      vars.VALUABLE = ['ancestral tablets', 'imperial seal', 'rare books', 'silk robes', 'jade collection', 'tea plantation', 'rice paddies', 'family tomb', 'scholarly degrees', 'court position'];
      vars.DIFFICULT_TASK = ['pass imperial exams', 'manage irrigation', 'negotiate with nomads', 'prepare for monsoon', 'conduct ancestor rituals', 'translate classics', 'design palace gardens', 'organize grain tribute'];
      vars.FESTIVAL = ['New Year celebration', 'Dragon Boat Festival', 'Moon Festival', 'Qingming', 'harvest celebration', 'emperor\'s birthday', 'spring planting', 'ancestor worship'];
    } else if (era === 'medieval') {
      vars.TRADE_ITEM = ['rice stores', 'silk cloth', 'lacquerware', 'tea leaves', 'porcelain bowls', 'paper', 'ink stones', 'bamboo crafts', 'medicinal herbs', 'bronze mirrors'];
      vars.VALUABLE = ['ancestral scrolls', 'farming tools', 'seed rice', 'silk loom', 'scholarly library', 'tea garden', 'porcelain kiln', 'calligraphy set', 'family shrine', 'rice terraces'];
      vars.DIFFICULT_TASK = ['repair irrigation channels', 'prepare for monsoon', 'craft ceremonial items', 'pass scholarly exam', 'negotiate trade rights', 'conduct tea ceremony', 'maintain family honor', 'survive dynastic change'];
      vars.FESTIVAL = ['Lunar New Year', 'Lantern Festival', 'Qingming Festival', 'Dragon Boat Festival', 'Mid-Autumn Festival', 'harvest celebration', 'scholarly examination', 'temple fair'];
    }
  }
  
  // MENA cultures
  else if (zone === 'mena') {
    if (era === 'ancient') {
      vars.TRADE_ITEM = ['frankincense', 'myrrh', 'spices', 'precious stones', 'silk', 'ivory', 'gold', 'silver', 'cedar wood', 'purple dye'];
      vars.VALUABLE = ['caravan routes', 'oasis rights', 'spice monopoly', 'royal seal', 'temple treasures', 'trade contacts', 'water rights', 'desert guides', 'camels', 'rare manuscripts'];
      vars.DIFFICULT_TASK = ['cross desert safely', 'negotiate with nomads', 'find water source', 'avoid sandstorm', 'establish trade post', 'survive siege', 'interpret omens', 'manage caravan'];
      vars.FESTIVAL = ['harvest celebration', 'spring equinox', 'royal coronation', 'religious pilgrimage', 'trade fair', 'victory celebration', 'new year festival', 'temple dedication'];
    } else if (era === 'medieval') {
      vars.TRADE_ITEM = ['date harvest', 'copper vessels', 'carpets', 'frankincense', 'spices', 'perfumes', 'silk', 'cotton', 'manuscripts', 'astronomical instruments'];
      vars.VALUABLE = ['water rights', 'caravan animals', 'trade contacts', 'manuscript collection', 'irrigation system', 'date palm groves', 'pilgrimage route', 'astronomical tools', 'mosque endowment', 'scholarly reputation'];
      vars.DIFFICULT_TASK = ['dig new wells', 'guide caravan', 'negotiate water rights', 'survive sandstorm', 'translate Greek texts', 'calculate prayer times', 'design irrigation', 'manage hajj pilgrimage'];
      vars.FESTIVAL = ['Eid al-Fitr', 'Eid al-Adha', 'Mawlid', 'Ashura', 'Laylat al-Qadr', 'harvest festival', 'trade fair', 'scholarly gathering'];
    }
  }
  
  // North American Pre-Columbian
  else if (zone === 'northAmerican') {
    if (era === 'ancient') {
      vars.TRADE_ITEM = ['dried corn', 'fur pelts', 'woven baskets', 'turquoise', 'obsidian tools', 'pottery', 'shell ornaments', 'medicinal plants', 'tobacco', 'deer hide'];
      vars.VALUABLE = ['seed corn', 'hunting grounds', 'sacred items', 'totem poles', 'medicine bundles', 'ceremonial masks', 'trading relationships', 'seasonal camps', 'fishing rights', 'tribal regalia'];
      vars.DIFFICULT_TASK = ['prepare for winter hunt', 'build longhouse', 'preserve meat', 'conduct vision quest', 'negotiate with other tribes', 'find new hunting grounds', 'prepare for seasonal migration', 'craft sacred items'];
      vars.FESTIVAL = ['harvest ceremony', 'winter solstice', 'spring planting', 'first hunt', 'coming of age', 'peace council', 'seasonal gathering', 'spiritual ceremony'];
    } else if (era === 'earlyModern') {
      vars.TRADE_ITEM = ['fur pelts', 'corn', 'tobacco', 'deer hide', 'maple syrup', 'wampum', 'canoes', 'snowshoes', 'medicinal herbs', 'dried fish'];
      vars.VALUABLE = ['hunting territories', 'trade alliances', 'European goods', 'horses', 'metal tools', 'firearms', 'sacred bundles', 'seasonal camps', 'treaty rights', 'clan leadership'];
      vars.DIFFICULT_TASK = ['negotiate with Europeans', 'adapt to new diseases', 'maintain tribal unity', 'learn new technologies', 'defend territory', 'preserve traditions', 'manage changing alliances', 'survive colonial pressure'];
      vars.FESTIVAL = ['harvest gathering', 'winter ceremony', 'spring renewal', 'treaty council', 'trade gathering', 'seasonal migration', 'spiritual ceremony', 'peace council'];
    }
  }
  
  // Generic fallbacks for other combinations
  else {
    vars.TRADE_ITEM = ['valuable goods', 'livestock', 'tools', 'stored food', 'crafted items', 'raw materials', 'textiles', 'pottery', 'metalwork', 'preserved foods'];
    vars.VALUABLE = ['essential tools', 'food stores', 'shelter materials', 'family heirlooms', 'land rights', 'trade relationships', 'specialized knowledge', 'religious items', 'social status', 'productive assets'];
    vars.DIFFICULT_TASK = ['complex work', 'urgent repairs', 'seasonal preparations', 'social obligations', 'religious duties', 'trade negotiations', 'survival challenges', 'family responsibilities'];
    vars.FESTIVAL = ['harvest celebration', 'seasonal festival', 'religious ceremony', 'community gathering', 'coming of age', 'trade fair', 'cultural celebration', 'spiritual observance'];
  }
  
  return vars;
}

/**
 * Get biome-specific variables
 */
function getBiomeVariables(biome: string): Record<string, string[]> {
  const vars: Record<string, string[]> = {};
  
  switch(biome.toUpperCase()) {
    case 'DESERT':
      vars.HAZARD = ['sandstorm', 'extreme heat', 'water shortage', 'desert raiders', 'mirages', 'dehydration', 'scorching sun', 'venomous snakes', 'flash floods', 'getting lost'];
      vars.RESOURCE = ['water', 'shade', 'oasis', 'camel', 'date palms', 'shelter materials', 'navigation tools', 'sun protection', 'preserved food', 'salt deposits'];
      vars.ANIMAL = ['camel', 'desert fox', 'scorpion', 'snake', 'lizard', 'desert bird', 'jackal', 'antelope', 'desert rat', 'vulture'];
      vars.SHELTER = ['tent', 'cave', 'oasis shelter', 'rock overhang', 'buried shelter', 'caravanserai', 'adobe house', 'palm frond hut'];
      vars.WEATHER = ['scorching heat', 'sandstorm', 'clear skies', 'desert wind', 'rare rain', 'cool night', 'blazing sun', 'dust devils'];
      break;
      
    case 'TUNDRA':
      vars.HAZARD = ['blizzard', 'extreme cold', 'wolf pack', 'ice break', 'frostbite', 'hypothermia', 'white-out', 'polar bears', 'avalanche', 'ice storm'];
      vars.RESOURCE = ['fuel', 'warm furs', 'preserved food', 'shelter', 'ice fishing', 'seal oil', 'whale blubber', 'caribou', 'firewood', 'winter clothing'];
      vars.ANIMAL = ['caribou', 'wolf', 'polar bear', 'seal', 'walrus', 'arctic fox', 'snowy owl', 'musk ox', 'ptarmigan', 'whale'];
      vars.SHELTER = ['igloo', 'snow cave', 'fur tent', 'ice house', 'underground shelter', 'windbreak', 'lean-to', 'log cabin'];
      vars.WEATHER = ['blizzard', 'freezing cold', 'ice storm', 'clear frozen sky', 'wind chill', 'snow squall', 'arctic wind', 'frost'];
      break;
      
    case 'JUNGLE':
    case 'RAINFOREST':
      vars.HAZARD = ['disease', 'venomous creatures', 'flooding', 'getting lost', 'poisonous plants', 'malaria', 'jaguars', 'quicksand', 'falling branches', 'insect swarms'];
      vars.RESOURCE = ['clean water', 'medicinal plants', 'tropical fruits', 'dry shelter', 'vines for rope', 'bamboo', 'palm leaves', 'fish from streams', 'edible roots', 'tree sap'];
      vars.ANIMAL = ['jaguar', 'monkey', 'parrot', 'snake', 'frog', 'insect', 'sloth', 'toucan', 'river fish', 'crocodile'];
      vars.SHELTER = ['tree house', 'palm leaf hut', 'elevated platform', 'cave', 'bamboo shelter', 'canopy refuge', 'hollow tree', 'cliff overhang'];
      vars.WEATHER = ['heavy rain', 'humidity', 'thunderstorm', 'brief sunshine', 'mist', 'downpour', 'muggy heat', 'dripping canopy'];
      break;
      
    case 'MOUNTAIN':
    case 'ALPINE':
      vars.HAZARD = ['avalanche', 'altitude sickness', 'rockslide', 'exposure', 'falling rocks', 'steep cliffs', 'ice slides', 'mountain lions', 'sudden storms', 'getting lost'];
      vars.RESOURCE = ['warm clothing', 'rope', 'climbing gear', 'fuel', 'mountain streams', 'game animals', 'pine nuts', 'stone for tools', 'shelter caves', 'medicinal herbs'];
      vars.ANIMAL = ['mountain goat', 'eagle', 'bear', 'mountain lion', 'marmot', 'elk', 'bighorn sheep', 'snow leopard', 'yak', 'llama'];
      vars.SHELTER = ['cave', 'rock shelter', 'stone hut', 'mountain cabin', 'cliff dwelling', 'snow cave', 'lean-to', 'monastery'];
      vars.WEATHER = ['mountain storm', 'clear mountain air', 'snow', 'high winds', 'sudden fog', 'temperature drop', 'hail', 'brilliant sunshine'];
      break;
      
    case 'COASTAL':
    case 'BEACH':
      vars.HAZARD = ['storm surge', 'pirates', 'shipwreck', 'tidal changes', 'sea monsters', 'rough seas', 'hurricanes', 'coral reefs', 'rip currents', 'salt water poisoning'];
      vars.RESOURCE = ['fresh water', 'fishing equipment', 'boat repairs', 'trade goods', 'shellfish', 'seaweed', 'driftwood', 'salt', 'fish', 'navigation tools'];
      vars.ANIMAL = ['fish', 'crab', 'seabird', 'seal', 'whale', 'dolphin', 'sea turtle', 'lobster', 'oyster', 'shark'];
      vars.SHELTER = ['beach hut', 'driftwood shelter', 'cave', 'pier house', 'lighthouse', 'fishing village', 'harbor town', 'coastal fort'];
      vars.WEATHER = ['sea breeze', 'storm surge', 'calm seas', 'hurricane', 'fog', 'high tide', 'low tide', 'salt spray'];
      break;
      
    case 'GRASSLAND':
    case 'PRAIRIE':
      vars.HAZARD = ['prairie fire', 'drought', 'flash floods', 'tornadoes', 'stampeding herds', 'grass hoppers', 'extreme weather', 'getting lost', 'wild animals', 'lightning strikes'];
      vars.RESOURCE = ['grazing land', 'wild game', 'prairie grass', 'water holes', 'bison', 'wild plants', 'fertile soil', 'seasonal fruits', 'medicinal herbs', 'building materials'];
      vars.ANIMAL = ['bison', 'antelope', 'prairie dog', 'hawk', 'coyote', 'rabbit', 'deer', 'elk', 'wild horse', 'ground squirrel'];
      vars.SHELTER = ['sod house', 'tepee', 'earth lodge', 'grass hut', 'dugout', 'lean-to', 'windbreak', 'cave'];
      vars.WEATHER = ['prairie wind', 'thunderstorm', 'drought', 'tornado', 'clear skies', 'hailstorm', 'lightning', 'seasonal rain'];
      break;
      
    case 'FOREST':
    case 'WOODLAND':
      vars.HAZARD = ['wild animals', 'forest fire', 'getting lost', 'falling trees', 'poisonous plants', 'bears', 'wolves', 'deep ravines', 'thick underbrush', 'hunting accidents'];
      vars.RESOURCE = ['timber', 'game animals', 'nuts and berries', 'medicinal herbs', 'mushrooms', 'fresh water streams', 'firewood', 'tree sap', 'edible roots', 'shelter materials'];
      vars.ANIMAL = ['deer', 'bear', 'wolf', 'rabbit', 'squirrel', 'bird', 'fox', 'wild boar', 'elk', 'beaver'];
      vars.SHELTER = ['log cabin', 'tree house', 'forest hut', 'cave', 'lean-to', 'hollowed tree', 'branch shelter', 'woodland lodge'];
      vars.WEATHER = ['dappled sunlight', 'forest rain', 'mist', 'wind through trees', 'seasonal changes', 'morning dew', 'autumn colors', 'winter snow'];
      break;
      
    default:
      vars.HAZARD = ['bad weather', 'wild animals', 'illness', 'accident', 'natural disaster', 'getting lost', 'injury', 'exposure'];
      vars.RESOURCE = ['food', 'water', 'shelter', 'medicine', 'tools', 'fuel', 'building materials', 'clothing'];
      vars.ANIMAL = ['local wildlife', 'domesticated animals', 'birds', 'small game', 'livestock', 'working animals'];
      vars.SHELTER = ['house', 'hut', 'shelter', 'building', 'dwelling', 'refuge', 'temporary shelter'];
      vars.WEATHER = ['fair weather', 'rain', 'wind', 'storms', 'seasonal weather', 'changing conditions'];
  }
  
  return vars;
}

/**
 * Get profession-specific variables
 */
function getProfessionVariables(profession: string, era: HistoricalEra): Record<string, string[]> {
  const vars: Record<string, string[]> = {};
  const prof = profession.toLowerCase();
  
  // Farming professions
  if (prof.includes('farmer') || prof.includes('peasant') || prof.includes('agricultural')) {
    vars.DIFFICULT_TASK = ['plow new field', 'repair barn', 'prepare for harvest', 'dig irrigation', 'thresh grain', 'tend livestock', 'clear new land', 'store winter provisions', 'repair tools', 'manage crop rotation'];
    vars.WORK_TOOL = ['plow', 'scythe', 'hoe', 'seed stores', 'ox', 'millstone', 'sickle', 'pitchfork', 'threshing flail', 'water wheel'];
    vars.WORKPLACE = ['field', 'barn', 'farmhouse', 'granary', 'pasture', 'mill', 'orchard', 'garden', 'stable', 'silo'];
    vars.PRODUCT = ['grain', 'vegetables', 'livestock', 'dairy', 'wool', 'eggs', 'fruit', 'hay', 'meat', 'leather'];
  }
  
  // Merchant/trader professions
  else if (prof.includes('merchant') || prof.includes('trader') || prof.includes('commerce')) {
    vars.DIFFICULT_TASK = ['negotiate bulk deal', 'arrange caravan', 'secure warehouse', 'find new suppliers', 'establish trade route', 'survive bandit attack', 'navigate foreign customs', 'manage currency exchange', 'assess market conditions', 'maintain trade relationships'];
    vars.WORK_TOOL = ['scales', 'ledgers', 'storage', 'contacts', 'caravan', 'ship', 'warehouse', 'coins', 'trade permits', 'samples'];
    vars.WORKPLACE = ['marketplace', 'warehouse', 'trading post', 'caravan route', 'ship', 'counting house', 'guild hall', 'port', 'fair grounds', 'shop'];
    vars.PRODUCT = ['spices', 'textiles', 'metals', 'luxury goods', 'everyday items', 'raw materials', 'finished goods', 'exotic items', 'tools', 'food products'];
  }
  
  // Craftsman professions
  else if (prof.includes('craft') || prof.includes('smith') || prof.includes('artisan') || prof.includes('maker')) {
    vars.DIFFICULT_TASK = ['complete masterwork', 'train apprentice', 'fulfill large order', 'repair complex item', 'create custom piece', 'meet guild standards', 'source rare materials', 'perfect new technique', 'satisfy demanding client', 'compete with rivals'];
    vars.WORK_TOOL = ['forge', 'anvil', 'hammer', 'raw materials', 'molds', 'bellows', 'tongs', 'files', 'measuring tools', 'finishing tools'];
    vars.WORKPLACE = ['workshop', 'forge', 'studio', 'guild hall', 'marketplace', 'home workshop', 'apprentice quarters', 'tool shed', 'kiln', 'workbench'];
    vars.PRODUCT = ['tools', 'weapons', 'jewelry', 'pottery', 'furniture', 'decorative items', 'household goods', 'religious items', 'artistic works', 'practical items'];
  }
  
  // Scholar/scribe professions
  else if (prof.includes('scholar') || prof.includes('scribe') || prof.includes('teacher') || prof.includes('academic')) {
    vars.DIFFICULT_TASK = ['translate ancient texts', 'copy manuscripts', 'teach students', 'complete research', 'debate theological points', 'preserve knowledge', 'calculate calendar', 'interpret law', 'write treatise', 'establish school'];
    vars.WORK_TOOL = ['writing materials', 'reference texts', 'workspace', 'lamp oil', 'quills', 'ink', 'parchment', 'books', 'instruments', 'measuring devices'];
    vars.WORKPLACE = ['library', 'scriptorium', 'school', 'monastery', 'university', 'court', 'study', 'temple', 'palace', 'private chamber'];
    vars.PRODUCT = ['manuscripts', 'translations', 'letters', 'legal documents', 'educational materials', 'religious texts', 'scientific works', 'historical records', 'maps', 'calculations'];
  }
  
  // Military professions
  else if (prof.includes('soldier') || prof.includes('guard') || prof.includes('warrior') || prof.includes('knight')) {
    vars.DIFFICULT_TASK = ['night watch', 'escort duty', 'training recruits', 'fortification work', 'patrol borders', 'siege defense', 'cavalry charge', 'maintain discipline', 'strategic planning', 'diplomatic mission'];
    vars.WORK_TOOL = ['weapons', 'armor', 'rations', 'equipment', 'horses', 'siege engines', 'shields', 'banners', 'maps', 'communication tools'];
    vars.WORKPLACE = ['barracks', 'fortress', 'battlefield', 'training ground', 'watchtower', 'castle', 'camp', 'garrison', 'palace guard', 'border post'];
    vars.PRODUCT = ['security', 'defense', 'order', 'trained soldiers', 'military intelligence', 'conquered territory', 'peace treaties', 'strategic advantage', 'loyalty', 'protection'];
  }
  
  // Religious professions
  else if (prof.includes('priest') || prof.includes('clergy') || prof.includes('monk') || prof.includes('religious')) {
    vars.DIFFICULT_TASK = ['conduct ceremony', 'settle dispute', 'organize festival', 'maintain temple', 'provide spiritual guidance', 'manage monastery', 'copy sacred texts', 'care for poor', 'mediate conflicts', 'preserve traditions'];
    vars.WORK_TOOL = ['sacred texts', 'ceremonial items', 'offerings', 'vestments', 'altar', 'religious symbols', 'incense', 'chalice', 'prayer books', 'holy relics'];
    vars.WORKPLACE = ['temple', 'church', 'monastery', 'shrine', 'cathedral', 'prayer hall', 'sacred grove', 'pilgrimage site', 'religious school', 'holy mountain'];
    vars.PRODUCT = ['spiritual guidance', 'religious ceremonies', 'community harmony', 'sacred texts', 'moral education', 'charity work', 'religious art', 'preserved knowledge', 'social services', 'cultural traditions'];
  }
  
  // Healer professions
  else if (prof.includes('healer') || prof.includes('doctor') || prof.includes('physician') || prof.includes('medicine')) {
    vars.DIFFICULT_TASK = ['treat plague victims', 'perform surgery', 'find rare herbs', 'diagnose illness', 'prepare medicines', 'assist childbirth', 'treat battle wounds', 'prevent epidemic', 'train apprentices', 'research new treatments'];
    vars.WORK_TOOL = ['medicinal herbs', 'surgical tools', 'bandages', 'potions', 'medical texts', 'scales', 'mortar and pestle', 'diagnostic tools', 'treatment supplies', 'protective equipment'];
    vars.WORKPLACE = ['healing house', 'herb garden', 'monastery infirmary', 'palace', 'patient homes', 'battlefield', 'market stall', 'temple', 'private practice', 'traveling clinic'];
    vars.PRODUCT = ['health', 'medical treatments', 'herbal remedies', 'surgical procedures', 'medical knowledge', 'disease prevention', 'pain relief', 'healing services', 'medical training', 'public health'];
  }
  
  // Default for other professions
  else {
    vars.DIFFICULT_TASK = ['complete urgent work', 'meet deadline', 'handle difficult client', 'learn new skill', 'solve complex problem', 'manage resources', 'train others', 'innovate methods', 'satisfy demands', 'maintain quality'];
    vars.WORK_TOOL = ['tools', 'materials', 'workspace', 'supplies', 'equipment', 'instruments', 'resources', 'references', 'contacts', 'expertise'];
    vars.WORKPLACE = ['workshop', 'office', 'field', 'home', 'market', 'building site', 'travel', 'community', 'institution', 'various locations'];
    vars.PRODUCT = ['services', 'goods', 'solutions', 'expertise', 'crafted items', 'completed work', 'knowledge', 'results', 'improvements', 'achievements'];
  }
  
  return vars;
}

/**
 * Get season-specific variables
 */
function getSeasonVariables(season: string): Record<string, string[]> {
  const vars: Record<string, string[]> = {};
  
  switch(season.toLowerCase()) {
    case 'spring':
      vars.SEASONAL_ACTIVITY = ['planting crops', 'tending gardens', 'preparing fields', 'breeding livestock', 'repairing winter damage', 'cleaning and organizing', 'planning for the year', 'celebrating new life'];
      vars.SEASONAL_RESOURCE = ['fresh water', 'young animals', 'early vegetables', 'spring herbs', 'tree sap', 'bird eggs', 'wildflowers', 'fresh fish'];
      vars.SEASONAL_HAZARD = ['flooding', 'late frost', 'muddy roads', 'disease outbreaks', 'food shortage before harvest', 'storms', 'animal predators', 'crop pests'];
      vars.WEATHER_CONDITION = ['warming temperatures', 'spring rain', 'melting snow', 'muddy conditions', 'fresh breezes', 'longer days', 'occasional frost', 'changing weather'];
      break;
      
    case 'summer':
      vars.SEASONAL_ACTIVITY = ['harvesting early crops', 'tending fields', 'trading and travel', 'festivals and celebrations', 'construction work', 'fishing', 'military campaigns', 'long-distance journeys'];
      vars.SEASONAL_RESOURCE = ['fresh produce', 'abundant water', 'fish', 'wild berries', 'medicinal herbs', 'building materials', 'travel opportunities', 'long daylight'];
      vars.SEASONAL_HAZARD = ['drought', 'extreme heat', 'crop disease', 'insect swarms', 'bandits on roads', 'food spoilage', 'water shortage', 'wildfires'];
      vars.WEATHER_CONDITION = ['hot sun', 'warm nights', 'thunderstorms', 'clear skies', 'humid air', 'long days', 'occasional rain', 'dry conditions'];
      break;
      
    case 'autumn':
    case 'fall':
      vars.SEASONAL_ACTIVITY = ['harvesting main crops', 'preserving food', 'preparing for winter', 'hunting', 'gathering fuel', 'making repairs', 'paying taxes and dues', 'celebrating harvest'];
      vars.SEASONAL_RESOURCE = ['grain harvest', 'preserved foods', 'nuts and seeds', 'game animals', 'firewood', 'wool from sheep', 'winter preparations', 'stored supplies'];
      vars.SEASONAL_HAZARD = ['early frost', 'crop failure', 'food shortage', 'preparation delays', 'illness', 'storms', 'raiding before winter', 'resource competition'];
      vars.WEATHER_CONDITION = ['cooling temperatures', 'shorter days', 'autumn storms', 'morning frost', 'changing leaves', 'harvest weather', 'unpredictable conditions', 'crisp air'];
      break;
      
    case 'winter':
      vars.SEASONAL_ACTIVITY = ['indoor crafts', 'storytelling', 'maintaining livestock', 'religious observances', 'planning next year', 'repairing tools', 'staying warm', 'community gatherings'];
      vars.SEASONAL_RESOURCE = ['stored food', 'firewood', 'warm clothing', 'preserved meat', 'dried goods', 'indoor shelter', 'animal products', 'winter fuel'];
      vars.SEASONAL_HAZARD = ['severe cold', 'food shortage', 'illness', 'isolation', 'fuel shortage', 'roof collapse', 'frozen water', 'vitamin deficiency'];
      vars.WEATHER_CONDITION = ['freezing cold', 'snow and ice', 'short days', 'bitter winds', 'blizzards', 'frozen ground', 'long nights', 'harsh conditions'];
      break;
      
    default:
      vars.SEASONAL_ACTIVITY = ['daily work', 'routine tasks', 'seasonal preparations', 'community activities'];
      vars.SEASONAL_RESOURCE = ['available resources', 'seasonal items', 'local materials', 'community support'];
      vars.SEASONAL_HAZARD = ['weather challenges', 'seasonal difficulties', 'resource limitations', 'environmental threats'];
      vars.WEATHER_CONDITION = ['typical weather', 'seasonal conditions', 'local climate', 'changing weather'];
  }
  
  return vars;
}

/**
 * Get wealth-level specific variables
 */
function getWealthVariables(wealth: 'poor' | 'modest' | 'wealthy'): Record<string, string[]> {
  const vars: Record<string, string[]> = {};
  
  switch(wealth) {
    case 'poor':
      vars.POSSESSION = ['few belongings', 'essential tools', 'worn clothing', 'simple shelter', 'basic cooking pot', 'patch-work items', 'shared resources', 'borrowed tools'];
      vars.CONCERN = ['finding food', 'paying debts', 'staying warm', 'avoiding illness', 'keeping shelter', 'finding work', 'surviving hardship', 'protecting family'];
      vars.ASPIRATION = ['steady meals', 'basic security', 'warm shelter', 'healthy family', 'honest work', 'small savings', 'community respect', 'simple comfort'];
      vars.SOCIAL_STATUS = ['common laborer', 'struggling farmer', 'street vendor', 'servant', 'beggar', 'refugee', 'unemployed worker', 'debt servant'];
      vars.DWELLING = ['shack', 'shared room', 'simple hut', 'temporary shelter', 'rented space', 'communal housing', 'basic cottage', 'lean-to'];
      break;
      
    case 'modest':
      vars.POSSESSION = ['basic furniture', 'working tools', 'decent clothing', 'small savings', 'modest home', 'few luxuries', 'practical items', 'reliable equipment'];
      vars.CONCERN = ['maintaining income', 'family health', 'home repairs', 'seasonal challenges', 'business competition', 'community standing', "children's future", 'modest growth'];
      vars.ASPIRATION = ['prosperity', 'better home', "children's education", 'business expansion', 'social advancement', 'comfortable retirement', 'respect', 'stability'];
      vars.SOCIAL_STATUS = ['skilled craftsman', 'small merchant', 'successful farmer', 'minor official', 'guild member', 'respectable citizen', 'property owner', 'local leader'];
      vars.DWELLING = ['comfortable house', 'workshop with home', 'small farm', 'town residence', 'guild quarters', 'family home', 'modest estate', 'well-built cottage'];
      break;
      
    case 'wealthy':
      vars.POSSESSION = ['fine furnishings', 'luxury items', 'extensive properties', 'valuable collections', 'multiple homes', 'servants', 'expensive clothing', 'rare goods'];
      vars.CONCERN = ['political intrigue', 'business investments', 'family reputation', 'property management', 'social obligations', 'inheritance planning', 'maintaining power', 'avoiding scandals'];
      vars.ASPIRATION = ['political influence', 'lasting legacy', 'family dynasty', 'cultural patronage', 'expanded empire', 'historical significance', 'divine favor', 'ultimate success'];
      vars.SOCIAL_STATUS = ['noble', 'wealthy merchant', 'landowner', 'court official', 'guild master', 'religious leader', 'military commander', 'influential citizen'];
      vars.DWELLING = ['mansion', 'palace', 'castle', 'country estate', 'luxury residence', 'multiple properties', 'grand hall', 'fortified compound'];
      break;
  }
  
  return vars;
}

/**
 * Generate a contextual event description
 */
export function generateEventDescription(
  template: string,
  context: EventContext,
  customVariables?: Record<string, string[]>
): string {
  const contextVars = getContextVariables(context);
  const allVars = customVariables 
    ? { ...contextVars, ...customVariables }
    : contextVars;
    
  return fillTemplate(template, allVars, context);
}

/**
 * Get appropriate items for trading based on context
 */
export function getTradableItems(context: EventContext): string[] {
  const vars = getContextVariables(context);
  return vars.TRADE_ITEM || ['goods', 'supplies', 'materials'];
}

/**
 * Get appropriate resources for the context
 */
export function getContextResources(context: EventContext): string[] {
  const vars = getContextVariables(context);
  return vars.RESOURCE || ['food', 'water', 'supplies'];
}

/**
 * Get appropriate hazards for the context
 */
export function getContextHazards(context: EventContext): string[] {
  const vars = getContextVariables(context);
  return vars.HAZARD || ['danger', 'threat', 'crisis'];
}