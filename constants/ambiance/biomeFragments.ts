import { BiomeType } from '../../types';

type TimeOfDayKey = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night' | 'general';

export const AMBIANCE_BIOME_FRAGMENTS: Partial<Record<BiomeType, Partial<Record<TimeOfDayKey, string[]>>>> = {
  [BiomeType.DEEP_OCEAN]: {
    general: ["The deep ocean stretches endlessly.", "Waves roll across the vast expanse."],
    night: ["The inky black ocean reflects the stars.", "A profound silence hangs over the dark waters."]
  },
  [BiomeType.SHALLOW_OCEAN]: {
    general: ["Sunlight glints off the shallow waters.", "The seabed is visible in places."],
    morning: ["Gentle waves lap the shore.", "Seabirds cry overhead in the morning light."]
  },
  [BiomeType.BEACH]: {
    general: ["Sand stretches along the water's edge.", "The sound of waves is constant."],
    midday: ["The sun beats down on the hot sand."]
  },
  [BiomeType.GRASSLAND]: {
    general: ["Open plains of grass sway in the breeze.", "The horizon seems far away."],
    dusk: ["The grassland is painted gold by the setting sun."]
  },
  [BiomeType.FOREST]: {
    general: ["Trees stand tall, their leaves rustling.", "The forest floor is dappled with light."],
    night: ["Shadows lengthen among the trees.", "Mysterious sounds echo through the woods."]
  },
  [BiomeType.DENSE_FOREST]: {
    general: ["A thick canopy blocks out much of the light.", "The air is still and heavy here."],
    midday: ["Only slivers of sunlight penetrate the dense foliage."]
  },
  [BiomeType.HILLS]: {
    general: ["Rolling hills rise and fall across the landscape.", "A gentle breeze blows over the slopes."],
  },
  [BiomeType.MOUNTAIN]: {
    general: ["Majestic mountains dominate the skyline.", "The air is thin and crisp."],
    dawn: ["The mountain peaks catch the first rays of dawn."]
  },
  [BiomeType.HIGH_PEAK]: {
    general: ["Barren rock and biting winds define this high peak.", "The world stretches out below."],
  },
  [BiomeType.SNOW]: {
    general: ["A blanket of snow covers everything.", "The silence is broken only by the wind."],
  },
  [BiomeType.RIVER]: {
    general: ["A river flows steadily through the land.", "The sound of running water is soothing."],
  },
  [BiomeType.MAJOR_RIVER]: {
    general: ["The wide river moves with a powerful current.", "This waterway looks navigable."],
  },
  [BiomeType.RIVERBANK]: {
    general: ["Lush vegetation lines the river's edge.", "The soil here seems fertile."],
  },
  [BiomeType.HAMLET]: {
    general: ["A small collection of houses huddle together.", "Smoke rises from a chimney."],
  },
  [BiomeType.LOW_DENSITY_CITY]: {
    general: ["Neat houses and wider streets mark this settlement.", "There's a sense of quiet activity."],
  },
  [BiomeType.DENSE_CITY]: {
    general: ["Buildings are packed tightly in this bustling city.", "The sounds of commerce fill the air."],
  },
  [BiomeType.JUNGLE]: {
    general: ["The air is thick with humidity and the sounds of unseen creatures.", "Dense foliage makes passage difficult."],
  },
  [BiomeType.DESERT]: {
    general: ["Endless sand dunes stretch to the horizon.", "The heat is oppressive."],
    night: ["The desert cools rapidly under a starry sky."]
  },
  [BiomeType.OASIS]: {
    general: ["A welcome sight of water and greenery in the arid land.", "Life clusters around this precious resource."],
  },
  [BiomeType.WETLANDS]: {
    general: ["The ground is soft and waterlogged.", "Strange birds call from the reeds."],
  },
  [BiomeType.REEF]: {
    general: ["Colorful coral formations are visible beneath the clear water.", "Fish dart among the reef."],
  },
  [BiomeType.SCRUB]: {
    general: ["Hardy shrubs and sparse grasses cover the dry land.", "The air is often dusty."],
  },
  [BiomeType.TUNDRA]: {
    general: ["The ground is frozen and barren.", "A biting wind sweeps across the treeless plain."],
  },
  [BiomeType.STEPPE]: {
    general: ["Vast, open grasslands stretch out under a wide sky.", "Herds of animals might roam here."],
  },
  [BiomeType.MANGROVE]: {
    general: ["Twisted roots of mangrove trees rise from the brackish water.", "The air is salty and still."],
  },
  [BiomeType.VOLCANIC_SOIL]: {
    general: ["Dark, rich soil hints at past volcanic activity.", "The land feels strangely fertile."],
  },
  [BiomeType.VOLCANIC_ROCK]: {
    general: ["Jagged volcanic rock covers the landscape.", "It is difficult to find a path here."],
  },
  [BiomeType.ACTIVE_LAVA]: {
    general: ["The ground glows with intense heat.", "Molten rock flows slowly, consuming everything in its path."],
  },
  [BiomeType.SHOALS_TILE]: {
    general: ["Shallow water barely covers submerged land.", "This area looks treacherous for ships."],
  },
  [BiomeType.SALT_FLATS]: {
    general: ["A vast, flat expanse of white salt stretches to the horizon.", "The air is dry and stings the eyes."],
  },
  [BiomeType.HOT_SPRINGS]: {
    general: ["Steam rises from pools of geothermally heated water.", "The smell of sulfur hangs in the air."],
  },
  [BiomeType.FARMLAND]: {
    general: ["Cultivated fields show signs of human labor.", "Crops grow in neat rows."],
  },
  [BiomeType.RUINS]: {
    general: ["Crumbling stones hint at a forgotten past.", "A sense of mystery pervades these ancient ruins."],
  },
  [BiomeType.ESTUARY]: {
    general: ["Freshwater meets the sea, creating a rich, murky environment.", "The tide ebbs and flows here."],
  },
  [BiomeType.FRESHWATER_LAKE]: {
    general: ["A large expanse of calm freshwater lies before you.", "The shores of the lake are varied."],
  },
  [BiomeType.CLIFF]: {
    general: ["Sheer cliffs drop dramatically.", "The cliff face is rugged and imposing.", "Waves crash against the base of the cliffs if near water."],
    dusk: ["The cliffs are cast in long shadows as the sun sets."]
  },
};