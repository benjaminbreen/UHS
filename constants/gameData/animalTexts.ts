/**
 * constants/gameData/animalTexts.ts - Custom encounter and combat text for animals
 */

export interface AnimalTexts {
  encounterText: string; // What animals do in EncounterModal
  combatText: string;    // Combat initiation text for CombatModal
}

// Animal text mappings organized by type/family
export const ANIMAL_TEXTS: Record<string, AnimalTexts> = {
  // === BIRDS ===
  EAGLE: {
    encounterText: "The eagle circles overhead, its keen eyes scanning the ground below.",
    combatText: "The eagle spreads its magnificent wings, talons gleaming as it prepares to dive."
  },
  CHICKEN: {
    encounterText: "The chicken pecks nervously at the ground, occasionally looking up with bright eyes.",
    combatText: "The chicken fluffs its feathers and lets out an indignant squawk, ready to defend itself."
  },
  DUCK: {
    encounterText: "The duck paddles quietly in the shallow water, occasionally dipping its head beneath the surface.",
    combatText: "The duck beats its wings frantically, creating a spray of water as it prepares for confrontation."
  },
  FLAMINGO: {
    encounterText: "The flamingo stands gracefully on one leg, filtering algae through its specialized beak.",
    combatText: "The flamingo stretches to its full height, neck curved in an elegant but defensive posture."
  },
  PEACOCK: {
    encounterText: "The peacock struts regally, its iridescent tail feathers catching the light.",
    combatText: "The peacock fans out its spectacular tail display, using its beauty as intimidation."
  },
  TURKEY: {
    encounterText: "The turkey scratches through fallen leaves, searching for insects and seeds.",
    combatText: "The turkey puffs up its feathers and spreads its tail, gobbling loudly in warning."
  },
  PARROT: {
    encounterText: "The colorful parrot preens its vibrant feathers while chattering to its companions.",
    combatText: "The parrot screeches loudly and spreads its wings, showing off its brilliant plumage defiantly."
  },
  PENGUIN: {
    encounterText: "The penguin waddles along the shoreline, occasionally sliding on its belly across the ice.",
    combatText: "The penguin stands upright and flaps its flippers, ready to defend its territory with surprising courage."
  },
  BAT: {
    encounterText: "The bat hangs upside down from a rocky outcrop, wings folded around its small body.",
    combatText: "The bat spreads its leathery wings wide, emitting high-pitched screeches as it prepares to strike."
  },

  // === BIG CATS ===
  LION: {
    encounterText: "The lion lies in the shade, golden eyes alert while its tail flicks lazily.",
    combatText: "The lion rises to its full height, mane bristling as it lets out a thunderous roar."
  },
  TIGER: {
    encounterText: "The tiger paces silently through tall grass, orange and black stripes providing perfect camouflage.",
    combatText: "The tiger crouches low, muscles coiled like springs as it fixes you with predatory focus."
  },
  LEOPARD: {
    encounterText: "The leopard rests on a high branch, spotted coat dappled by shadows and sunlight.",
    combatText: "The leopard drops into a hunting crouch, yellow eyes gleaming with calculated menace."
  },
  CHEETAH: {
    encounterText: "The cheetah surveys the savanna from atop a termite mound, built for speed rather than power.",
    combatText: "The cheetah's lean frame tenses, black tear marks framing eyes that promise swift violence."
  },
  JAGUAR: {
    encounterText: "The jaguar emerges from the dense foliage, rosette-patterned coat glistening with moisture.",
    combatText: "The jaguar's powerful jaw opens in a snarl, revealing teeth capable of crushing bone."
  },
  PUMA: {
    encounterText: "The puma moves like a shadow across rocky terrain, tawny coat blending with stone.",
    combatText: "The puma's ears flatten against its skull as it prepares to unleash mountain lion fury."
  },

  // === DEER FAMILY (All deer species) ===
  DEER: {
    encounterText: "The deer grazes peacefully in the meadow, ears constantly swiveling to detect danger.",
    combatText: "The deer's eyes go wide with alarm, ready to flee or fight with surprising desperation."
  },
  MOOSE: {
    encounterText: "The massive moose wades through marshy waters, antlers like tree branches above its head.",
    combatText: "The moose snorts angrily and lowers its enormous antlers, an unstoppable force of wilderness rage."
  },
  ELK: {
    encounterText: "The elk bugle echoes across the valley as it calls to its herd, antlers held high.",
    combatText: "The elk stamps its hooves and tosses its magnificent rack, every inch the forest monarch."
  },
  CARIBOU: {
    encounterText: "The caribou travels in formation with its herd, following ancient migration routes.",
    combatText: "The caribou lowers its head, showing that even gentle creatures will fight when cornered."
  },
  ANTELOPE: {
    encounterText: "The antelope bounds gracefully across open terrain, built for speed and endurance.",
    combatText: "The antelope's nostrils flare as it prepares to either flee or make a desperate stand."
  },

  // === BEARS ===
  BEAR: {
    encounterText: "The bear shuffles through the underbrush, occasionally standing on hind legs to survey its domain.",
    combatText: "The bear rears up to its full, terrifying height and lets out a bone-chilling roar."
  },
  PANDA: {
    encounterText: "The panda sits peacefully among bamboo stalks, methodically chewing on fresh shoots.",
    combatText: "The panda's docile expression hardens—even gentle giants can become formidable when threatened."
  },

  // === WOLVES AND CANINES ===
  WOLF: {
    encounterText: "The wolf moves with predatory grace, yellow eyes constantly assessing threats and opportunities.",
    combatText: "The wolf bares its fangs in a vicious snarl, hackles raised for battle."
  },
  FOX: {
    encounterText: "The fox sits with perfect poise, bushy tail wrapped around its feet as it observes with intelligent eyes.",
    combatText: "The fox's clever eyes narrow as it weighs its options—fight, flight, or cunning."
  },
  DOG: {
    encounterText: "The dog wags its tail tentatively, torn between loyalty to humans and natural caution.",
    combatText: "The dog's loyalty wars with fear as it prepares to defend its territory with fierce devotion."
  },

  // === PRIMATES ===
  GORILLA: {
    encounterText: "The gorilla beats its chest rhythmically while watching you with dark, intelligent eyes.",
    combatText: "The gorilla pounds its massive fists against its chest, a display of raw power and dominance."
  },
  MONKEY: {
    encounterText: "The monkey chatters excitedly to its troopmates, swinging from branch to branch with acrobatic ease.",
    combatText: "The monkey chatters nervously while planning an escape route—it seems to be plotting something clever."
  },
  BABOON: {
    encounterText: "The baboon grooms its troop member while keeping watchful eyes on the surroundings.",
    combatText: "The baboon bares its impressive canine teeth and barks aggressively, ready to defend its position."
  },
  ORANGUTAN: {
    encounterText: "The orangutan swings slowly through the canopy, long arms carrying it with surprising grace.",
    combatText: "The orangutan's calm demeanor shifts to one of protective determination—wisdom meets strength."
  },

  // === LARGE HERBIVORES ===
  ELEPHANT: {
    encounterText: "The elephant sprays dust on its back with its trunk while the matriarch keeps vigilant watch.",
    combatText: "The elephant raises its trunk high and trumpets a warning that echoes for miles."
  },
  RHINOCEROS: {
    encounterText: "The rhinoceros wallows in the mud, ancient armor-like skin glistening in the sun.",
    combatText: "The rhinoceros seems resigned about the battle to come, but its horn promises devastating consequences."
  },
  HIPPOPOTAMUS: {
    encounterText: "The hippopotamus lounges in shallow water, only its eyes and nostrils visible above the surface.",
    combatText: "The hippopotamus opens its massive jaws, revealing teeth like ivory daggers and territorial fury."
  },
  GIRAFFE: {
    encounterText: "The giraffe stretches its impossibly long neck to reach the highest acacia leaves.",
    combatText: "The giraffe's gentle nature gives way to surprising determination—those hooves can be lethal."
  },

  // === CATTLE AND BOVINES ===
  BISON: {
    encounterText: "The bison grazes in the vast grassland, its massive head crowned by curved horns.",
    combatText: "The bison snorts and paws the ground, ready to charge with the fury of the American plains."
  },
  WATER_BUFFALO: {
    encounterText: "The water buffalo stands knee-deep in the rice paddy, chewing cud with patient contentment.",
    combatText: "The water buffalo lowers its massive horns, showing why farmers respect these gentle giants."
  },
  YAK: {
    encounterText: "The yak stands stoically against mountain winds, thick coat rippling in the harsh breeze.",
    combatText: "The yak's mountain-hardened resolve shows—it won't back down from any challenge."
  },
  GAUR: {
    encounterText: "The gaur, largest of wild cattle, stands majestically among the forest shadows.",
    combatText: "The gaur's massive bulk and curved horns make it clear this forest giant means business."
  },
  WILDEBEEST: {
    encounterText: "The wildebeest follows the great migration, driven by ancient instincts across vast distances.",
    combatText: "The wildebeest snorts and stamps, herd mentality giving way to individual survival."
  },
  COW: {
    encounterText: "The cow chews cud peacefully in the pasture, occasionally lowing to her companions.",
    combatText: "The cow's docile nature shifts to maternal protection—even farm animals will fight when pressed."
  },
  MUSK_OX: {
    encounterText: "The musk ox stands resilient against arctic winds, thick coat providing perfect insulation.",
    combatText: "The musk ox forms a defensive stance, showing why it survives where others cannot."
  },

  // === HORSES ===
  WILD_HORSE: {
    encounterText: "The wild horse gallops freely across open steppes, mane flowing like a banner in the wind.",
    combatText: "The wild horse rears up on its hind legs, hooves flashing like weapons in the sunlight."
  },

  // === SWINE ===
  BOAR: {
    encounterText: "The boar roots through the forest floor, using its snout to uncover hidden delicacies.",
    combatText: "The boar's tusks gleam as it prepares to charge—wild pigs are far more dangerous than they appear."
  },
  WARTHOG: {
    encounterText: "The warthog wallows in mud to cool itself, warty face giving it a comical appearance.",
    combatText: "The warthog's tusks and bad temper make it clear this is no laughing matter."
  },
  PIG: {
    encounterText: "The pig rolls contentedly in the mud, intelligent eyes belying its reputation for slovenliness.",
    combatText: "The pig's surprising intelligence shows as it prepares to defend itself with unexpected cunning."
  },
  PECCARY: {
    encounterText: "The peccary travels in a small band, marking territory with their distinctive scent glands.",
    combatText: "The peccary's razor-sharp tusks and pack mentality make it a formidable jungle opponent."
  },

  // === SMALL MAMMALS ===
  RABBIT: {
    encounterText: "The rabbit sits motionless, relying on camouflage before bolting at the first sign of danger.",
    combatText: "The rabbit's powerful hind legs prepare for a desperate escape—but cornered prey fights hardest."
  },
  SQUIRREL: {
    encounterText: "The squirrel scampers up tree trunks with acrobatic skill, cheeks bulging with stored nuts.",
    combatText: "The squirrel chatters angrily from its perch, ready to defend its territory with surprising ferocity."
  },
  HEDGEHOG: {
    encounterText: "The hedgehog shuffles through undergrowth, snuffling for insects and small prey.",
    combatText: "The hedgehog curls into a spiky ball—sometimes the best defense is an impenetrable offense."
  },
  BADGER: {
    encounterText: "The badger emerges from its burrow, powerful claws perfect for digging and defense.",
    combatText: "The badger's reputation for tenacity is well-earned—it will fight anything, anywhere."
  },

  // === AQUATIC MAMMALS ===
  OTTER: {
    encounterText: "The otter floats on its back in the stream, using a stone to crack open shellfish on its belly.",
    combatText: "The otter's playful demeanor vanishes—those teeth and claws aren't just for catching fish."
  },
  WHALE: {
    encounterText: "The whale breaches the ocean surface, sending massive sprays of water in all directions.",
    combatText: "The whale's song carries through the water—a gentle giant that could end the fight with one movement."
  },
  WALRUS: {
    encounterText: "The walrus basks on ice floes, using its massive tusks to haul itself from the frigid water.",
    combatText: "The walrus's tusks and bulk make it clear this arctic veteran won't go down easily."
  },

  // === REPTILES ===
  CROCODILE: {
    encounterText: "The crocodile lies perfectly still in the water, only its eyes visible above the surface.",
    combatText: "The crocodile's ancient predator instincts kick in—those jaws have crushed prey for millions of years."
  },
  SNAKE: {
    encounterText: "The snake coils in dappled sunlight, tongue flicking to taste chemical traces in the air.",
    combatText: "The snake rears back in an S-curve, fangs glistening with venom as old as evolution itself."
  },

  // === SMALL CREATURES ===
  CAT: {
    encounterText: "The cat stretches languidly in a sunny spot, purring contentedly while remaining alert.",
    combatText: "The cat arches its back and hisses, claws extended—feline grace becomes feline fury."
  },
  FISH: {
    encounterText: "Schools of fish dart through the water in perfect synchronization, silver scales flashing.",
    combatText: "The fish swims in erratic patterns, sensing danger but trapped in its aquatic world."
  },
  JELLYFISH: {
    encounterText: "The jellyfish pulses through the water with hypnotic grace, translucent bell contracting rhythmically.",
    combatText: "The jellyfish's stinging tentacles trail behind it—beauty concealing deadly purpose."
  },
  LOBSTER: {
    encounterText: "The lobster scuttles across the ocean floor, claws clicking against rocks and shells.",
    combatText: "The lobster raises its claws defensively, armored shell ready for underwater combat."
  },
  OCTOPUS: {
    encounterText: "The octopus camouflages itself among coral, skin patterns shifting like living art.",
    combatText: "The octopus changes color rapidly—intelligence and eight arms make for a formidable opponent."
  },

  // === UNIQUE CREATURES ===
  BUTTERFLY: {
    encounterText: "The butterfly flutters from flower to flower, delicate wings catching the morning light.",
    combatText: "The butterfly's fragile beauty seems almost mocking—how did things come to this?"
  },
  FLOTSAM: {
    encounterText: "Debris floats on the water's surface, remnants of some distant shipwreck or storm.",
    combatText: "The floating wreckage bobs ominously—sometimes the sea itself seems hostile."
  },

  // === DOMESTIC ANIMALS ===
  SHEEP: {
    encounterText: "The sheep grazes peacefully in the pasture, woolly coat thick and well-maintained.",
    combatText: "The sheep bleats nervously—even the gentlest creatures have survival instincts."
  },
  GOAT: {
    encounterText: "The goat picks its way carefully across rocky terrain, sure-footed and confident.",
    combatText: "The goat's horns lower as it prepares to ram—mountain animals know how to fight."
  },
  MULE: {
    encounterText: "The mule stands patiently with its heavy pack, long ears swiveling to catch every sound.",
    combatText: "The mule's reputation for stubbornness extends to combat—it won't yield easily."
  },
  DONKEY: {
    encounterText: "The donkey carries its burden without complaint, steady and reliable as always.",
    combatText: "The donkey's ears flatten back—even pack animals have their breaking point."
  },
  CAMEL: {
    encounterText: "The camel chews thoughtfully while surveying the desert, perfectly adapted to harsh conditions.",
    combatText: "The camel spits disdainfully—desert survival has made it tough and uncompromising."
  },

  // === EXOTIC/REGIONAL ===
  KANGAROO: {
    encounterText: "The kangaroo bounds across the outback in powerful leaps, joey peering from its pouch.",
    combatText: "The kangaroo rears back on its powerful tail, hind legs ready to deliver devastating kicks."
  },
  KOALA: {
    encounterText: "The koala clings sleepily to its eucalyptus tree, munching leaves with drowsy contentment.",
    combatText: "The koala's claws dig deeper into bark—even sleepy marsupials will defend their territory."
  },
  ZEBRA: {
    encounterText: "The zebra grazes with the herd, black and white stripes creating a dazzling confusion of patterns.",
    combatText: "The zebra's stripes blur with movement—natural camouflage and powerful kicks await."
  },
  LLAMA: {
    encounterText: "The llama carries its pack up mountain paths, sure-footed and uncomplaining in thin air.",
    combatText: "The llama spits with surprising accuracy—Andean animals are tougher than they look."
  },
  SLOTH: {
    encounterText: "The sloth moves with deliberate slowness through the canopy, conserving every precious calorie.",
    combatText: "The sloth's claws extend—even the slowest creatures have natural weapons when pressed."
  },
  TAPIR: {
    encounterText: "The tapir snuffles through jungle undergrowth, flexible trunk exploring for tender shoots.",
    combatText: "The tapir's bulk and determination show—forest browsers can become forest fighters."
  },

  // === HYENAS ===
  HYENA: {
    encounterText: "The hyena circles at a distance, cackling to its pack with sounds that chill the blood.",
    combatText: "The hyena's laugh turns into a snarl—scavenger becomes predator when opportunity calls."
  }
};

// Helper function to get text for an animal, with fallbacks
export const getAnimalTexts = (animalName: string): AnimalTexts => {
  const upperName = animalName.toUpperCase();
  
  // Direct match first
  if (ANIMAL_TEXTS[upperName]) {
    return ANIMAL_TEXTS[upperName];
  }
  
  // Fallback patterns for similar animals
  const fallbacks: Record<string, string> = {
    // Cats
    'TIGER': 'BIG_CAT',
    'LION': 'BIG_CAT', 
    'LEOPARD': 'BIG_CAT',
    'CHEETAH': 'BIG_CAT',
    'JAGUAR': 'BIG_CAT',
    'PUMA': 'BIG_CAT',
    
    // Deer family
    'ELK': 'DEER',
    'MOOSE': 'DEER',
    'CARIBOU': 'DEER',
    'ANTELOPE': 'DEER',
    
    // Birds
    'EAGLE': 'BIRD',
    'CHICKEN': 'BIRD',
    'DUCK': 'BIRD',
    'TURKEY': 'BIRD',
    'PARROT': 'BIRD',
    'PEACOCK': 'BIRD',
    'FLAMINGO': 'BIRD',
    'PENGUIN': 'BIRD',
    'BAT': 'BIRD',
    
    // Generic fallback
    'UNKNOWN': 'GENERIC'
  };
  
  // Check if we can find the animal in our fallback mapping
  if (ANIMAL_TEXTS[fallbacks[upperName]]) {
    return ANIMAL_TEXTS[fallbacks[upperName]];
  }
  
  // Ultimate fallback
  return {
    encounterText: `The ${animalName.toLowerCase()} watches you warily.`,
    combatText: `The ${animalName.toLowerCase()} prepares for battle with instinctive determination.`
  };
};