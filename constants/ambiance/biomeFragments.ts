import { BiomeType } from '../../types';

type TimeOfDayKey = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night' | 'general';

export const AMBIANCE_BIOME_FRAGMENTS: Partial<Record<BiomeType, Partial<Record<TimeOfDayKey, string[]>>>> = {
  [BiomeType.DEEP_OCEAN]: {
    general: [
      "The ocean's surface undulates in long, slow swells that speak of unfathomable depths below.",
      "Salt spray mists the air, carrying the primal scent of the open sea.",
      "The horizon forms a perfect line where endless water meets infinite sky.",
      "Deep currents create patterns on the surface that shift and reform continuously.",
      "The water here is a profound blue-black, suggesting tremendous depth."
    ],
    night: [
      "Phosphorescent plankton trace ghostly patterns in the dark water.",
      "Stars reflect on the ocean's surface like scattered diamonds on black velvet.",
      "The sea breathes slowly in the darkness, each swell a massive inhalation."
    ],
    dawn: [
      "The first light turns the ocean's surface to burnished copper.",
      "Dawn reveals the ocean's true colors - deep indigo shifting to sapphire."
    ]
  },
  [BiomeType.SHALLOW_OCEAN]: {
    general: [
      "Sunlight penetrates the clear water, revealing sandy patches and dark shadows of reefs below.",
      "The water shifts between turquoise and emerald as clouds pass overhead.",
      "Small fish create fleeting silver flashes just beneath the surface.",
      "Gentle swells roll through, their crests occasionally breaking into foam."
    ],
    morning: [
      "Morning light transforms the shallows into a mosaic of blues and greens.",
      "Seabirds wheel overhead, their cries mixing with the whisper of waves."
    ]
  },
  [BiomeType.BEACH]: {
    general: [
      "Fine sand shifts underfoot, still cool in the shadows, burning hot in the sun.",
      "Shells and fragments of coral lie scattered where the last tide left them.",
      "The rhythmic rush and retreat of waves creates a hypnotic soundtrack.",
      "Sandpipers dart along the waterline, chasing invisible prey.",
      "The boundary between land and sea blurs with each incoming wave."
    ],
    midday: [
      "Heat shimmers rise from the sand, distorting the view down the beach.",
      "The sun blazes overhead, turning the sand almost white with intensity."
    ],
    dawn: [
      "The beach is pristine, marked only by the tracks of nocturnal crabs.",
      "Early morning mist hangs over the water, softening all edges."
    ]
  },
  [BiomeType.GRASSLAND]: {
    general: [
      "Tall grasses ripple like a golden-green sea in the constant breeze.",
      "The sweet scent of grass seed and wildflowers drifts on the air.",
      "Small creatures rustle unseen through the dense grass stems.",
      "The land rolls gently, each rise revealing more of the same endless prairie.",
      "Wind patterns create ever-shifting waves across the grassland."
    ],
    dusk: [
      "The setting sun turns the grass to burnished gold and copper.",
      "Long shadows stretch across the prairie, darkening the hollows."
    ],
    morning: [
      "Dew sparkles on every blade of grass like a field of diamonds.",
      "Morning mist clings to the low places between the gentle hills."
    ]
  },
  [BiomeType.FOREST]: {
    general: [
      "Shafts of sunlight filter through the canopy, creating pools of golden light.",
      "The air is rich with the scent of decomposing leaves and fresh growth.",
      "Birds call from hidden perches, their songs echoing between the trunks.",
      "Moss grows thick on the northern sides of the ancient trees.",
      "The forest floor is soft with decades of fallen needles and leaves."
    ],
    night: [
      "Nocturnal creatures stir, their calls strange and haunting in the darkness.",
      "Moonlight barely penetrates the canopy, leaving the forest floor in deep shadow.",
      "Every small sound seems amplified in the nighttime stillness."
    ],
    dawn: [
      "The forest awakens slowly, bird by bird, until the dawn chorus fills the air.",
      "Morning mist weaves between the tree trunks like ghostly fingers."
    ]
  },
  [BiomeType.DENSE_FOREST]: {
    general: [
      "The canopy overhead is so thick that perpetual twilight reigns below.",
      "Massive tree trunks rise like columns in a natural cathedral.",
      "The air is heavy with moisture and the earthy smell of rot and renewal.",
      "Vines hang in thick curtains, creating walls within the forest.",
      "Sound seems muffled here, absorbed by the dense vegetation."
    ],
    midday: [
      "Even at noon, only the faintest dappling of light reaches the forest floor.",
      "The heat becomes oppressive, trapped beneath the thick canopy."
    ]
  },
  [BiomeType.HILLS]: {
    general: [
      "The landscape undulates in gentle waves, each crest offering a new vista.",
      "Patches of exposed rock break through the grass-covered slopes.",
      "Wind funnels between the hills, carrying the scent of distant places.",
      "Sheep paths crisscross the hillsides in meandering lines.",
      "The play of light and shadow constantly shifts across the rolling terrain."
    ],
    afternoon: [
      "Afternoon sun warms the southern slopes while shadows pool in the valleys.",
      "Hawks circle on thermals rising from the sun-warmed hillsides."
    ]
  },
  [BiomeType.MOUNTAIN]: {
    general: [
      "Massive peaks thrust skyward, their faces scarred by ages of wind and weather.",
      "The air grows noticeably thinner, each breath requiring more effort.",
      "Loose scree clatters down the slopes at the slightest disturbance.",
      "Eagles soar at eye level, riding the mountain updrafts.",
      "Ancient glacial valleys carve deep grooves between the peaks."
    ],
    dawn: [
      "The peaks glow pink and gold as they catch the first light of dawn.",
      "Morning reveals fresh snow dusting the highest elevations."
    ],
    dusk: [
      "The mountains cast vast shadows across the valleys below.",
      "Alpenglow bathes the peaks in an otherworldly rose light."
    ]
  },
  [BiomeType.HIGH_PEAK]: {
    general: [
      "The wind howls constantly at this elevation, cutting through any protection.",
      "Ice crystals glitter in the thin air, creating brief rainbows.",
      "The world below looks miniature from this dizzying height.",
      "Breathing becomes labored in the oxygen-poor atmosphere.",
      "Nothing grows here but the hardiest lichens clinging to the rocks."
    ]
  },
  [BiomeType.SNOW]: {
    general: [
      "Fresh powder crunches underfoot with a distinctive squeaking sound.",
      "The landscape is muffled and transformed, all harsh edges softened.",
      "Snow-laden branches creak ominously overhead.",
      "Animal tracks crisscross the pristine surface, telling stories of the night.",
      "The cold is sharp and clean, burning the nostrils with each breath."
    ],
    night: [
      "Starlight reflects off the snow, creating enough light to see clearly.",
      "The silence is absolute, every sound absorbed by the blanket of white."
    ]
  },
  [BiomeType.RIVER]: {
    general: [
      "The river murmurs constantly, its voice changing with every rock and bend.",
      "Dragonflies dart above the water, their wings catching the light.",
      "The current carries leaves and twigs in an endless procession downstream.",
      "Fish occasionally break the surface, sending ripples across the flow.",
      "The air is cool and fresh near the water, heavy with moisture."
    ],
    morning: [
      "Morning mist rises from the river's surface like smoke.",
      "Water birds begin their day's fishing in the shallows."
    ]
  },
  [BiomeType.MAJOR_RIVER]: {
    general: [
      "The river's power is evident in its relentless, muscular flow.",
      "Whole trees float past, testament to the water's erosive force upstream.",
      "The far bank seems distant, the water between deep and dangerous.",
      "Eddies and whirlpools mark places where the current fights itself.",
      "Barges and boats navigate carefully, respecting the river's might."
    ]
  },
  [BiomeType.RIVERBANK]: {
    general: [
      "Willows trail their branches in the water, creating green curtains.",
      "Rich mud squelches underfoot, fertile and dark.",
      "Herons stand motionless in the shallows, waiting for unwary fish.",
      "Cattails and reeds rustle with the movement of hidden creatures.",
      "The boundary between water and land is unclear, constantly shifting."
    ]
  },
  [BiomeType.HAMLET]: {
    general: [
      "Wisps of smoke from cooking fires carry the scent of burning wood and food.",
      "Children's laughter echoes between the modest dwellings.",
      "Chickens peck in the dirt paths between houses.",
      "Laundry flaps on lines, adding splashes of color to weathered walls.",
      "Dogs bark in the distance, answered by others across the settlement."
    ],
    morning: [
      "The hamlet wakes slowly, doors opening one by one to the new day.",
      "The smell of baking bread drifts from the communal oven."
    ],
    dusk: [
      "Families gather for evening meals, warm light spilling from windows.",
      "The day's work done, villagers sit outside their doors in quiet conversation."
    ]
  },
  [BiomeType.LOW_DENSITY_CITY]: {
    general: [
      "Wide streets allow carriages and carts to pass without crowding.",
      "Market gardens and small orchards break up the clusters of buildings.",
      "The pace of life seems measured, neither rushed nor stagnant.",
      "Church bells or temple gongs mark the passage of hours.",
      "Shopkeepers call out their wares from neat storefronts."
    ],
    morning: [
      "The town comes alive with the opening of shutters and shops.",
      "Fresh goods arrive from the countryside, filling the air with varied scents."
    ]
  },
  [BiomeType.DENSE_CITY]: {
    general: [
      "The cacophony of urban life - wheels on cobblestones, hawkers' cries, arguments and laughter.",
      "Buildings lean toward each other across narrow streets, nearly touching at the top.",
      "The air carries a complex mix of cooking, humanity, animals, and industry.",
      "Every available space teems with activity and commerce.",
      "Layers of history are visible in the patchwork of architectural styles."
    ],
    night: [
      "Lamplight or torchlight creates pools of orange glow in the darkness.",
      "The city never truly sleeps, always some movement in the shadows.",
      "Night soil men make their rounds, a necessary evil of urban life."
    ],
    morning: [
      "The city erupts into activity as shops open and crowds fill the streets.",
      "Morning brings fresh chaos as country folk arrive to trade."
    ]
  },
  [BiomeType.JUNGLE]: {
    general: [
      "The air is so humid it feels like breathing through wet cloth.",
      "Insect noise creates a constant high-pitched whine that penetrates everything.",
      "Vines and creepers turn every tree into a vertical garden.",
      "Brightly colored birds flash between the trees like living jewels.",
      "The canopy above seethes with hidden life - rustling, calling, moving.",
      "Fungal growth covers everything, breaking down the constant rain of dead matter."
    ],
    midday: [
      "The heat becomes absolutely stifling, even in the shade.",
      "A brief afternoon downpour provides momentary relief from the oppressive humidity."
    ]
  },
  [BiomeType.DESERT]: {
    general: [
      "Heat mirages shimmer on the horizon, creating phantom lakes.",
      "Sand gets into everything - clothes, food, eyes, equipment.",
      "The silence is profound, broken only by the whisper of shifting sand.",
      "Rocky outcrops provide the only landmarks in the sea of dunes.",
      "The sun is a merciless hammer, beating down without respite."
    ],
    night: [
      "The temperature plummets, turning the furnace into an icebox.",
      "Stars crowd the sky in numbers impossible to see elsewhere.",
      "Night hunters emerge - snakes, scorpions, and other adapted predators."
    ],
    dawn: [
      "The desert is transformed in the cool dawn light, almost beautiful.",
      "Dew forms briefly on rocks before the sun burns it away."
    ]
  },
  [BiomeType.OASIS]: {
    general: [
      "Date palms provide blessed shade around the life-giving spring.",
      "The contrast with surrounding desert makes this spot seem paradisiacal.",
      "Birds and insects congregate here in numbers unseen in the wasteland.",
      "The water is cool and clear, bubbling up from deep underground.",
      "Greenery clusters thick around the water, desperately lush."
    ]
  },
  [BiomeType.WETLANDS]: {
    general: [
      "The ground squelches with every step, neither fully land nor water.",
      "Clouds of mosquitoes rise from the stagnant pools.",
      "Strange bird calls echo across the marsh - booms, rattles, and screams.",
      "Methane bubbles occasionally break the surface, releasing swamp gas.",
      "Cypress knees and mangrove roots create a maze of woody obstacles."
    ],
    dusk: [
      "Fireflies begin their ethereal dance above the dark water.",
      "The chorus of frogs and insects reaches a deafening crescendo."
    ]
  },
  [BiomeType.REEF]: {
    general: [
      "The water is so clear you can see every detail of the coral gardens below.",
      "Parrotfish crunch audibly on coral, adding to the reef's soundtrack.",
      "Schools of tropical fish move as one entity, flashing silver then blue.",
      "The reef drops away into deep blue depths at its edge.",
      "Wave action has sculpted the coral into fantastic formations."
    ]
  },
  [BiomeType.SCRUB]: {
    general: [
      "Thorny bushes snag at clothing and skin with every movement.",
      "The vegetation is gray-green, adapted to conserve every drop of moisture.",
      "Dust devils spin across the open spaces between shrub clusters.",
      "Lizards dart between sparse shadows, the land's most visible inhabitants.",
      "The soil is hard-packed and cracked, baked by the relentless sun."
    ]
  },
  [BiomeType.TUNDRA]: {
    general: [
      "The landscape is desolate, a frozen desert of ice and stone.",
      "Permafrost makes the ground rock-hard just inches below the surface.",
      "Arctic winds cut through clothing like it isn't there.",
      "In summer, clouds of mosquitoes emerge from temporary pools.",
      "The horizon seems impossibly distant across the flat expanse."
    ]
  },
  [BiomeType.STEPPE]: {
    general: [
      "The grassland stretches endlessly under an enormous dome of sky.",
      "Wild horses or their ancestors might have galloped across these plains.",
      "The wind is constant, bringing the smell of distant rain or dust.",
      "Hawks and eagles patrol the skies, riding the reliable thermals.",
      "The grass is shorter here than prairie, adapted to less rainfall."
    ]
  },
  [BiomeType.MANGROVE]: {
    general: [
      "Aerial roots create a tangled maze above the brackish water.",
      "Mud skippers and fiddler crabs scuttle across exposed mudflats.",
      "The tide's rhythm controls life here, covering and revealing the root systems.",
      "Salt crystals glitter on leaves adapted to excrete excess minerals.",
      "The air is thick with the smell of salt and decomposing vegetation."
    ]
  },
  [BiomeType.VOLCANIC_SOIL]: {
    general: [
      "The earth is black and rich, almost unnaturally fertile.",
      "Plants grow with unusual vigor in the mineral-rich soil.",
      "Old lava flows are still visible as ripples in the landscape.",
      "Steam vents occasionally remind you of the fire below.",
      "The soil feels warm to the touch, retaining the earth's heat."
    ]
  },
  [BiomeType.VOLCANIC_ROCK]: {
    general: [
      "Razor-sharp aa lava makes every step treacherous.",
      "The rock is porous and light, crunching underfoot.",
      "Nothing grows except in cracks where soil has accumulated.",
      "The landscape is alien, all sharp edges and twisted formations.",
      "Heat radiates from black rock surfaces under the sun."
    ]
  },
  [BiomeType.ACTIVE_LAVA]: {
    general: [
      "The heat is overwhelming, forcing you to stay at a distance.",
      "Molten rock glows cherry-red to orange, mesmerizing in its slow movement.",
      "The air shimmers violently from the intense heat.",
      "Sulfurous gases make breathing difficult and dangerous.",
      "The ground cracks and shifts, unstable and threatening."
    ]
  },
  [BiomeType.SHOALS_TILE]: {
    general: [
      "Sandbars and hidden rocks make these waters treacherous.",
      "The water depth changes dramatically with each tide.",
      "Seabirds congregate on exposed sand, diving for trapped fish.",
      "Currents swirl unpredictably around the underwater obstacles.",
      "Ships' remains occasionally surface, warning of the danger here."
    ]
  },
  [BiomeType.SALT_FLATS]: {
    general: [
      "The white expanse is blinding under the sun, painful to look at directly.",
      "Geometric patterns of dried salt create natural tessellations.",
      "The horizon blurs, sky and ground merging in the white glare.",
      "Your footsteps crunch on the salt crust, breaking through to mud below.",
      "Mirages are constant, making distance and direction hard to judge."
    ]
  },
  [BiomeType.HOT_SPRINGS]: {
    general: [
      "Mineral deposits color the rocks in yellows, oranges, and greens.",
      "Steam creates a perpetual fog, limiting visibility.",
      "The water bubbles and churns, heated from deep within the earth.",
      "Sulfur and other minerals give the air a distinct, medicinal smell.",
      "Thermophilic bacteria create rainbow mats in the cooler pools."
    ]
  },
  [BiomeType.FARMLAND]: {
    general: [
      "Neat furrows stretch to the field's edge, evidence of careful cultivation.",
      "The smell of turned earth and growing things fills the air.",
      "Scarecrows stand sentinel against the birds.",
      "Farm equipment lies ready for the next day's labor.",
      "The rhythm of agricultural life is evident in every ordered row."
    ],
    morning: [
      "Dew makes the crops glisten in the early light.",
      "Workers head to the fields as the day begins."
    ]
  },
  [BiomeType.RUINS]: {
    general: [
      "Broken columns and crumbled walls hint at former grandeur.",
      "Vines and moss claim the stonework, nature reclaiming civilization.",
      "Strange acoustics make whispers carry and shouts echo oddly.",
      "Carved symbols and faded frescoes tell incomprehensible stories.",
      "The silence here feels heavy, weighted with lost history."
    ],
    night: [
      "Shadows pool in ancient doorways and collapsed chambers.",
      "Owls and bats have made homes in the crumbling architecture."
    ]
  },
  [BiomeType.ESTUARY]: {
    general: [
      "The water is brackish, neither fully salt nor fresh.",
      "Tidal mudflats expose rich feeding grounds for wading birds.",
      "The mixing of waters creates visible currents and color changes.",
      "Fish move between environments here, following the tides.",
      "Marsh grasses wave in the constant breeze off the water."
    ]
  },
  [BiomeType.FRESHWATER_LAKE]: {
    general: [
      "The lake's surface mirrors the sky perfectly on calm days.",
      "Gentle wavelets lap at the shoreline with a peaceful rhythm.",
      "Water plants create green margins around the edges.",
      "Fish jump occasionally, sending rings rippling outward.",
      "The water has a clean, mineral taste distinct from river or sea."
    ],
    dawn: [
      "Mist rises from the lake's surface as cool night meets warming air.",
      "The first light turns the water to molten silver."
    ]
  },
  [BiomeType.CLIFF]: {
    general: [
      "Vertical rock faces drop away dizzyingly to the base far below.",
      "Seabirds nest in impossible locations on the cliff face.",
      "Wind updrafts carry the constant cries of gulls and terns.",
      "The rock is stratified, showing eons of geological history.",
      "One false step here would be fatal."
    ],
    dusk: [
      "The setting sun paints the cliff face in shades of orange and red.",
      "Shadows deepen the crevices, making the cliff seem even more imposing."
    ]
  },
  // Urban tile types
  [BiomeType.MARKETPLACE]: {
    general: [
      "Vendors hawk their wares in a dozen languages and dialects.",
      "The air is thick with competing smells - spices, leather, livestock, and cooking food.",
      "Coins change hands constantly, the clink of commerce never ceasing.",
      "Colorful awnings and displays create a riot of visual stimulation."
    ]
  },
  [BiomeType.GOVERNMENT_DISTRICT]: {
    general: [
      "Imposing buildings of stone and marble speak of power and permanence.",
      "Guards stand at attention, their presence a reminder of authority.",
      "Clerks and officials hurry past with important documents.",
      "The architecture is designed to impress and intimidate visitors."
    ]
  },
  [BiomeType.PALACE]: {
    general: [
      "Ornate decorations and precious materials display wealth and power.",
      "Courtiers move through the halls with practiced grace.",
      "Gardens are manicured to perfection, nature tamed and ordered.",
      "The luxury here contrasts sharply with the world beyond the walls."
    ]
  },
  [BiomeType.HOLY_SITE]: {
    general: [
      "An aura of reverence pervades this sacred space.",
      "Incense or sacred smoke creates a mystical atmosphere.",
      "Pilgrims and worshippers move with purpose and devotion.",
      "Ancient rituals continue here as they have for generations."
    ]
  },
  [BiomeType.HARBOR_DISTRICT]: {
    general: [
      "The smell of tar, salt, and fish dominates everything.",
      "Sailors from distant lands bring exotic goods and stories.",
      "Ships creak at their moorings, waiting for the next tide.",
      "Seabirds fight over scraps, their cries constant."
    ]
  },
  [BiomeType.INDUSTRIAL_DISTRICT]: {
    general: [
      "The clang of metal on metal rings out from workshops.",
      "Smoke and steam rise from countless chimneys and vents.",
      "Workers covered in soot and sweat labor at their trades.",
      "The air tastes of coal smoke and hot metal."
    ]
  },
  [BiomeType.PARK]: {
    general: [
      "Carefully tended paths wind between groomed lawns and flower beds.",
      "People seek respite from urban life in this green oasis.",
      "Birds sing from ornamental trees, a touch of nature in the city.",
      "Children's laughter echoes from play areas."
    ]
  },
  [BiomeType.PLAZA]: {
    general: [
      "The open space serves as a crossroads of city life.",
      "Street performers compete for the attention of passersby.",
      "Fountains provide a cooling mist and pleasant background sound.",
      "People gather here to meet, trade news, and watch the world."
    ]
  },
  [BiomeType.ROAD]: {
    general: [
      "The thoroughfare shows the wear of countless travelers.",
      "Dust rises with each passing cart or footstep.",
      "Mile markers and waystones mark the distance to distant places.",
      "The road represents possibility, leading to unknown destinations."
    ]
  }
};