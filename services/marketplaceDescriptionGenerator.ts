/**
 * services/marketplaceDescriptionGenerator.ts - Enhanced procedural text for marketplaces.
 */
import { HistoricalEra, ClimateType, MapData, BiomeType, CulturalZone } from '../types';

export type Condition = 'humble' | 'prosperous';
export type CitySize = 'smaller_city' | 'big_city';

interface MarketplaceContext {
    era: HistoricalEra;
    culturalZone: CulturalZone;
    condition: Condition;
    climate: ClimateType;
    mapData: MapData;
    size: CitySize;
    gameTimeHours: number;
}

const fragments = {
    condition: {
        humble: [
            "A humble but functional marketplace serves the local community with essential goods.",
            "This modest collection of stalls sees a steady but quiet stream of trade.",
            "Though not grand, the marketplace is the heart of local commerce and daily life.",
            "Simple wooden stalls and canvas awnings create a practical trading space.",
            "Local farmers and craftsmen gather here to sell their honest wares.",
            "The marketplace bustles with the quiet energy of neighborhood commerce.",
            "Weathered stalls and familiar faces make this market feel like home to locals.",
            "Basic goods and fair prices draw steady customers from the surrounding area."
        ],
        prosperous: [
            "This is a bustling, prosperous marketplace, overflowing with exotic goods and wealthy merchants.",
            "The air crackles with the energy of international commerce in this wealthy market square.",
            "From the fine awnings to the sheer variety of goods, this marketplace radiates prosperity.",
            "Ornate stalls display treasures from distant lands, their owners dressed in fine silks.",
            "The marketplace thrums with the sounds of haggling, laughter, and clinking coins.",
            "Elaborate decorations and quality construction speak to the wealth flowing through here.",
            "Merchants from far-off lands compete for space in this coveted trading hub.",
            "The scent of luxury goods and foreign spices perfumes the air of this grand bazaar."
        ]
    },
    
    era: {
        [HistoricalEra.PREHISTORY]: [
            "Primitive trading takes place in clearings, with goods laid out on animal hides and woven mats.",
            "Stone tools, carved bone implements, and dried meats change hands through barter.",
            "Tribal elders oversee the exchange of precious flint, shells, and rare pigments."
        ],
        [HistoricalEra.ANTIQUITY]: [
            "The architecture is simple yet sturdy, with stalls of wood and canvas under the open sky.",
            "Clay amphorae and bronze vessels gleam in the sunlight alongside bolts of rough-woven cloth.",
            "Merchants count coins of silver and copper while scribes record transactions on clay tablets.",
            "The sound of hammer on anvil rings out as blacksmiths work nearby forges."
        ],
        [HistoricalEra.MEDIEVAL]: [
            "The air is thick with the smell of livestock, spices, and humanity pressing together.",
            "Timber-framed stalls are built to last, their heavy beams darkened by years of smoke and weather.",
            "Guild banners flutter above specialized quarters where craftsmen ply their ancient trades.",
            "The steady clip-clop of horses and the creak of wagon wheels provide a constant backdrop.",
            "Monastery bells toll the hours, regulating the rhythm of trade and prayer."
        ],
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
            "Merchants in fine doublets and hose hawk exotic goods brought from newly discovered lands.",
            "There is a sense of burgeoning global trade, with maps and navigation instruments on display.",
            "Banking houses and money-changers conduct business from elaborately carved wooden booths.",
            "The latest innovations in printing, clockwork, and optics draw curious crowds.",
            "Paintings and sculptures reflect the artistic flowering of the age."
        ],
        [HistoricalEra.INDUSTRIAL_ERA]: [
            "The marketplace is a chaotic mix of old and new, with the clang of metalwork echoing nearby.",
            "Steam engines chuff and hiss in the distance, while factories belch smoke into the sky.",
            "Mass-produced goods compete with traditional handicrafts for customers' attention.",
            "Railway schedules and telegraph messages coordinate commerce across vast distances.",
            "Gas lamps begin to illuminate the darker corners, extending trading hours."
        ],
        [HistoricalEra.MODERN_ERA]: [
            "Clean, orderly stalls line the square, though the shouting of vendors remains timeless.",
            "Electric lighting bathes the marketplace in bright, even illumination.",
            "Telephone wires and early radio broadcasts coordinate supply and demand.",
            "Automobiles compete with horse-drawn carts for space on the surrounding streets.",
            "Modern hygiene standards and refrigeration allow for a greater variety of perishable goods."
        ]
    },
    
    culture: {
        // Pre-modern eras (Prehistory through early Renaissance)
        premodern: {
            EUROPEAN: [
                "The scent of baking bread and roasting meats mingles with the chatter of many languages.",
                "Wool merchants from the north trade alongside wine sellers from sunny southern vineyards.",
                "Apprentices in leather aprons hurry between stalls carrying bundles for their masters.",
                "Stone crosses and religious imagery remind all of the spiritual dimension of honest trade.",
                "The local dialect mixes with the Latin of educated merchants and traveling clergy."
            ],
            EAST_ASIAN: [
                "Intricate paper lanterns hang from the eaves of stalls selling silks, teas, and fine porcelain.",
                "The delicate clink of jade ornaments accompanies the rustle of silk robes in the breeze.",
                "Calligraphy scrolls bearing poetry and wisdom are displayed alongside practical goods.",
                "The aroma of jasmine tea and burning incense creates an atmosphere of refined culture.",
                "Merchants bow respectfully to customers, conducting business with formal ceremony."
            ],
            MENA: [
                "The air is perfumed with exotic spices, frankincense, and the strong aroma of coffee.",
                "Colorful, hand-woven carpets are displayed prominently, their intricate patterns catching the eye.",
                "Water sellers move through the crowds, their brass cups gleaming in the desert sun.",
                "The call to prayer echoes across the marketplace, briefly stilling the busy commerce.",
                "Merchants in flowing robes conduct business in the shade of colorful awnings."
            ],
            NORTH_AMERICAN_PRE_COLUMBIAN: [
                "Trade is conducted in valuable pelts, intricate beadwork, and practical tools of stone and bone.",
                "Shamans and elders oversee exchanges, ensuring that spiritual customs are observed.",
                "The smoke of sacred fires mingles with the earthy scents of tanned leather and dried corn.",
                "Tribal representatives from distant regions bring unique local specialties and news.",
                "Ceremonial objects and medicine bundles are traded with great reverence and care."
            ],
            OCEANIA: [
                "Stalls are piled high with vibrant tropical fruits, pearls, and goods carved from wood and shell.",
                "The sound of waves nearby provides a rhythmic backdrop to the calls of vendors.",
                "Intricate tattoos and traditional clothing mark the diverse island origins of the traders.",
                "Coconut shells, tapa cloth, and carved tikis represent the artistic heritage of the islands.",
                "Fishing nets and outrigger canoe parts speak to the maritime culture of the region."
            ],
            SOUTH_ASIAN: [
                "The market is a riot of color, with vendors selling bright fabrics and fragrant flower garlands.",
                "A dazzling array of spices creates a rainbow of colors and an intoxicating blend of aromas.",
                "Temple bells and religious chanting add a spiritual dimension to the commercial activity.",
                "Silk saris flutter in the breeze while merchants display precious gems and metals.",
                "The complex social hierarchies are reflected in the arrangement and quality of the stalls."
            ],
            SOUTH_AMERICAN: [
                "Potatoes, maize, and quinoa are traded alongside beautifully crafted pottery and jewelry.",
                "Llamas and alpacas provide wool for the intricate textiles that are the region's pride.",
                "Gold and silver ornaments glint in the mountain sunlight, drawing admiring crowds.",
                "Coca leaves and other medicinal plants are sold by traditional healers and herbalists.",
                "The high altitude gives the marketplace a crisp, clean atmosphere."
            ],
            SUB_SAHARAN_AFRICAN: [
                "The sounds of drumming and lively bartering fill the air with infectious energy.",
                "Stalls offer salt, gold, ivory, and vibrant textiles dyed in brilliant earth tones.",
                "Griots and storytellers entertain crowds while business is conducted around them.",
                "Carved masks and fetish objects represent the spiritual traditions of the region.",
                "The red dust of the savanna coats everything, giving the marketplace its distinctive character."
            ]
        },
        
        // Modern eras (Industrial Era and Modern Era)
        modern: {
            EUROPEAN: [
                "Well-dressed shoppers browse organized stalls selling manufactured goods and imported luxuries.",
                "The marketplace reflects European colonial wealth, with exotic goods from around the globe.",
                "Newspapers and printed advertisements compete for attention alongside traditional vendor calls.",
                "The influence of industrial production is evident in the standardized packaging and mass-produced items.",
                "Coffee houses and tea shops provide gathering places for business discussions and social exchange."
            ],
            EAST_ASIAN: [
                "Modern vendors in contemporary clothing sell both traditional crafts and manufactured goods.",
                "The marketplace blends ancient traditions with modern commerce and technology.",
                "Bicycles and motor vehicles have replaced traditional transport methods.",
                "Western influence mingles with local customs in the architecture and business practices.",
                "Mass-produced items from local factories compete with traditional handicrafts for customers."
            ],
            MENA: [
                "The marketplace adapts traditional Middle Eastern commerce to modern realities.",
                "Oil wealth and international trade have transformed the local economy and available goods.",
                "Traditional crafts are sold alongside imported manufactured items and modern conveniences.",
                "The blend of traditional Islamic culture with global commerce creates a unique atmosphere.",
                "Modern transportation and communication have expanded the reach of local merchants."
            ],
            NORTH_AMERICAN_PRE_COLUMBIAN: [
                "American entrepreneurial spirit is evident in the diverse and competitive marketplace.",
                "Mass production and standardized goods reflect the industrial might of North America.",
                "The melting pot of cultures is reflected in the variety of vendors and merchandise.",
                "Advertisements and brand names compete for attention in the bustling commercial environment.",
                "The efficiency and scale of American commerce is apparent in every aspect of the market."
            ],
            OCEANIA: [
                "Island traders have adapted to modern commerce while maintaining their maritime traditions.",
                "Tourism and global trade have brought new opportunities and challenges to local markets.",
                "Traditional crafts are sold alongside imported goods to both locals and visiting travelers.",
                "The influence of larger Pacific powers is evident in the available products and business methods.",
                "Modern transportation has connected these island markets to global trade networks."
            ],
            SOUTH_ASIAN: [
                "The marketplace reflects the complex blend of tradition and modernity characteristic of the region.",
                "British colonial influence has shaped the commercial practices and available goods.",
                "Traditional spices and crafts are sold alongside manufactured items and imported luxuries.",
                "The caste system and social hierarchies continue to influence the organization of trade.",
                "Railway and telegraph connections have expanded the market's reach across the subcontinent."
            ],
            SOUTH_AMERICAN: [
                "The marketplace reflects the region's struggle between tradition and modernization.",
                "Coffee, rubber, and other export crops have brought new wealth and international connections.",
                "Indigenous traditions persist alongside European colonial influence and modern innovations.",
                "Political instability and economic change are reflected in the cautious nature of commerce.",
                "The influence of North American and European powers is evident in available manufactured goods."
            ],
            SUB_SAHARAN_AFRICAN: [
                "The marketplace reflects the impact of European colonialism on traditional African commerce.",
                "Traditional crafts and foods are sold alongside imported manufactured goods.",
                "The extraction of natural resources has created new economic opportunities and challenges.",
                "Tribal traditions persist despite the overlay of colonial administrative and commercial systems.",
                "The mixing of indigenous, Arab, and European influences creates a unique commercial atmosphere."
            ]
        }
    },
    
    climate: {
        [ClimateType.ARID]: [
            "Dust kicks up from the dry ground, and merchants seek precious shade under canvas awnings.",
            "Water is a precious commodity, sold by vendors with glazed clay jugs and copper cups.",
            "The harsh sun beats down mercilessly, driving most activity to the early morning and evening hours.",
            "Camels and donkeys provide the only reliable transport across the sun-baked landscape.",
            "Mirages dance on the horizon while the marketplace provides a welcome oasis of activity."
        ],
        [ClimateType.COLD]: [
            "Braziers burn at the corners of stalls, and shoppers are bundled in thick furs and wool.",
            "Breath steams in the crisp air as merchants and customers huddle around warming fires.",
            "Ice crystals form on the goods, requiring careful storage in insulated containers.",
            "The marketplace provides welcome shelter from the biting wind and driving snow.",
            "Sleds and sturdy boots are essential for navigating the frozen ground."
        ],
        [ClimateType.TEMPERATE]: [
            "The weather is mild and pleasant, perfect for a leisurely day of browsing the varied goods.",
            "A gentle breeze carries the mingled scents of the marketplace across the surrounding area.",
            "The changing seasons bring different products and festivities to the trading square.",
            "Comfortable temperatures encourage customers to linger and examine goods carefully.",
            "The moderate climate supports a diverse range of crops and crafts for trade."
        ],
        [ClimateType.TROPICAL]: [
            "The humid air is thick with the sweet smell of ripe fruit and exotic tropical flowers.",
            "Intermittent downpours send everyone scrambling for cover under palm-thatched roofs.",
            "Colorful birds and butterflies add their own beauty to the already vibrant marketplace.",
            "The intense heat is broken by sudden, refreshing rain showers that steam on the hot ground.",
            "Monsoon winds bring both challenges and opportunities for trade with distant ports."
        ],
        [ClimateType.SEMITROPICAL]: [
            "Awnings provide welcome shade from the strong sun, while the air buzzes with insects.",
            "The warm, humid atmosphere encourages a relaxed pace of business and social interaction.",
            "Sudden afternoon thunderstorms briefly cool the air and settle the dust.",
            "Palm trees and flowering vines add natural beauty to the commercial environment.",
            "The long growing season ensures a steady supply of fresh produce year-round."
        ]
    },
    
    timeOfDay: {
        day: [
            "Bright sunlight illuminates every corner of the bustling marketplace.",
            "The morning rush brings eager customers seeking the best selection of goods.",
            "Midday heat drives many to seek shade while conducting their business.",
            "Children dart between the stalls, playing games while their parents trade.",
            "The afternoon sun slants through the canvas awnings, creating patterns of light and shadow."
        ],
        night: [
            "Flickering torches and oil lamps cast dancing shadows across the market stalls.",
            "The mysterious atmosphere of night transforms ordinary goods into treasures.",
            "Lanterns sway gently in the evening breeze, their light drawing customers like moths.",
            "The cooler night air provides relief from the day's heat and renewed energy for trade.",
            "Stars overhead witness the ancient dance of commerce that continues after dark."
        ]
    },
    
    seasons: {
        spring: [
            "Fresh spring produce brings new energy and optimism to the marketplace.",
            "Flower vendors add color and fragrance to the awakening commercial district.",
            "Young animals and their mothers appear in the livestock sections.",
            "The renewal of life is reflected in the variety and quality of available goods."
        ],
        summer: [
            "The peak growing season floods the market with an abundance of fresh produce.",
            "Long days extend trading hours, allowing for maximum commercial activity.",
            "Travelers and merchants flock here during the favorable weather for transport.",
            "The heat encourages the sale of cooling drinks and light, airy fabrics."
        ],
        fall: [
            "Harvest season brings a cornucopia of preserved goods and winter preparations.",
            "The crisp air energizes both merchants and customers for the busy trading season.",
            "Autumnal colors in the decorations and produce create a warm, inviting atmosphere.",
            "Preparations for winter drive brisk sales of warm clothing and preserved foods."
        ],
        winter: [
            "The marketplace provides a welcome gathering place during the cold, isolated months.",
            "Preserved and stored goods from the harvest season sustain the community.",
            "Warm drinks and hearty foods draw customers seeking comfort from the cold.",
            "The slower pace allows for more careful examination of crafted goods and luxury items."
        ]
    },
    
    sounds: [
        "The rhythmic hammering of metalworkers creates a steady percussion.",
        "Customers haggle loudly over prices in a dozen different languages.",
        "The lowing of cattle and bleating of goats adds to the rural atmosphere.",
        "Children's laughter mingles with the serious business of adult commerce.",
        "Cart wheels rumble across cobblestones, announcing new arrivals.",
        "The musical calls of vendors advertising their wares echo through the square.",
        "Coins clink and jingle as transactions are completed throughout the day.",
        "The creak of leather harnesses and wooden wheels provides a constant backdrop."
    ],
    
    smells: [
        "The yeasty aroma of fresh bread wafts from the bakers' quarter.",
        "Exotic spices create an intoxicating blend of scents that carry on the wind.",
        "The earthy smell of fresh produce mingles with the musk of livestock.",
        "Woodsmoke from cooking fires adds warmth to the aromatic atmosphere.",
        "The metallic scent of coins and the oil used to preserve leather goods.",
        "Perfumes and incense from luxury vendors create clouds of exotic fragrance.",
        "The sharp tang of vinegar and pickled foods cuts through the other odors.",
        "Fresh flowers and herbs add their delicate perfume to the sensory mix."
    ],
    
    activities: [
        "Street performers entertain crowds while subtly advertising nearby stalls.",
        "Apprentices scurry between workshops, delivering materials and messages.",
        "Customers examine goods carefully, testing quality with experienced hands.",
        "Merchants keep careful tallies of their sales in leather-bound ledgers.",
        "Porters and pack animals constantly move goods to and from storage areas.",
        "Food vendors prepare meals for hungry traders and travelers.",
        "Craftsmen demonstrate their skills to attract customers and apprentices.",
        "Guards patrol discreetly, maintaining order and preventing theft."
    ],
    
    localGoods: {
        FOREST: [
            "Nearby forests supply a steady stream of lumber, game, and wild medicinal herbs.",
            "Hunters bring fresh venison and wild fowl to supplement domesticated meats.",
            "The scent of pine resin and cedar wood permeates the timber merchants' quarter.",
            "Mushrooms, berries, and nuts gathered from the woodland add variety to the food stalls."
        ],
        MOUNTAIN: [
            "Miners from the surrounding peaks bring precious ore and rough-hewn gems to trade.",
            "The crisp mountain air carries down the sound of pickaxes and the rumble of ore carts.",
            "Stone masons display their finest work, carved from the local granite and marble.",
            "Hardy mountain folk trade in sturdy boots, warm clothing, and climbing equipment."
        ],
        COAST: [
            "The scent of salt and fish hangs heavy in the air, testament to the sea's bounty.",
            "Fishing boats arrive daily with their catch, still glistening with seawater.",
            "Merchants trade in pearls, coral, and exotic goods from across the ocean.",
            "The rhythm of the tides influences the ebb and flow of commercial activity."
        ],
        FARMLAND: [
            "The market overflows with the bounty of surrounding farms: grains, vegetables, and livestock.",
            "Farmers arrive before dawn with carts loaded with produce still damp with morning dew.",
            "The agricultural wealth of the region is displayed in the quality and variety of food available.",
            "Seasonal festivals celebrate the harvest and bring extra crowds to the marketplace."
        ],
        RIVER: [
            "River barges constantly arrive and depart, their holds full of goods from upstream settlements.",
            "The sound of flowing water provides a peaceful backdrop to the commercial bustle.",
            "Fresh fish and river transport make this marketplace a vital hub for inland trade.",
            "Water mills nearby provide flour and power for various crafts and industries."
        ]
    }
};

const getRandomFragment = (arr: string[] | undefined): string => {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
};

const getRandomFragments = (arr: string[] | undefined, count: number): string[] => {
    if (!arr || arr.length === 0) return [];
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
};

export function generateMarketplaceDescription(context: MarketplaceContext): string {
    const { era, culturalZone, condition, climate, size, mapData, gameTimeHours } = context;
    const sentences: string[] = [];

    // Determine if this is a premodern or modern era
    const isModernEra = era === HistoricalEra.INDUSTRIAL_ERA || era === HistoricalEra.MODERN_ERA;
    const cultureKey = isModernEra ? 'modern' : 'premodern';

    // 1. Main condition description (always include)
    sentences.push(getRandomFragment(fragments.condition[condition]));

    // 2. Era-specific details
    const eraFragments = fragments.era[era] || fragments.era[HistoricalEra.MEDIEVAL];
    if (Array.isArray(eraFragments)) {
        sentences.push(getRandomFragment(eraFragments));
    } else {
        sentences.push(eraFragments);
    }

    // 3. Cultural elements (era-appropriate)
    const cultureFragments = fragments.culture[cultureKey][culturalZone] || fragments.culture[cultureKey].EUROPEAN;
    sentences.push(getRandomFragment(cultureFragments));

    // 4. Climate effects
    const climateFragments = fragments.climate[climate];
    if (climateFragments) {
        sentences.push(getRandomFragment(climateFragments));
    }

    // 5. Time of day (if available in context)
    const timeOfDay = gameTimeHours >= 6 && gameTimeHours < 19 ? 'day' : 'night';
    const timeFragments = fragments.timeOfDay[timeOfDay];
    if (timeFragments && Math.random() > 0.5) { // 50% chance to include
        sentences.push(getRandomFragment(timeFragments));
    }

    // 6. Seasonal elements (if available in context)
    // This would need to be passed from the context
    // const seasonFragments = fragments.seasons[season];
    // if (seasonFragments && Math.random() > 0.7) {
    //     sentences.push(getRandomFragment(seasonFragments));
    // }

    // 7. Sensory details (sounds, smells) - randomly include some
    if (Math.random() > 0.6) { // 40% chance for sounds
        sentences.push(getRandomFragment(fragments.sounds));
    }
    if (Math.random() > 0.6) { // 40% chance for smells
        sentences.push(getRandomFragment(fragments.smells));
    }

    // 8. Activities (30% chance)
    if (Math.random() > 0.7) {
        sentences.push(getRandomFragment(fragments.activities));
    }
    
    // 9. Local goods based on surrounding biomes
    const localBiomes = new Set<BiomeType>();
    const checkRadius = 15;
    const centerX = Math.floor(mapData.width / 2);
    const centerY = Math.floor(mapData.height / 2);
    
    for(let y = Math.max(0, centerY - checkRadius); y < Math.min(mapData.height, centerY + checkRadius); y++) {
        for(let x = Math.max(0, centerX - checkRadius); x < Math.min(mapData.width, centerX + checkRadius); x++) {
             if (mapData.tiles[y] && mapData.tiles[y][x]) {
                 localBiomes.add(mapData.tiles[y][x].biome);
             }
        }
    }
    
    // Add local goods based on dominant biomes
    if (localBiomes.has(BiomeType.FOREST) || localBiomes.has(BiomeType.DENSE_FOREST)) {
        sentences.push(getRandomFragment(fragments.localGoods.FOREST));
    } else if (localBiomes.has(BiomeType.MOUNTAIN) || localBiomes.has(BiomeType.HILLS)) {
        sentences.push(getRandomFragment(fragments.localGoods.MOUNTAIN));
    } else if (localBiomes.has(BiomeType.FARMLAND)) {
        sentences.push(getRandomFragment(fragments.localGoods.FARMLAND));
    } else if (localBiomes.has(BiomeType.SHALLOW_OCEAN)) {
        sentences.push(getRandomFragment(fragments.localGoods.COAST));
    } else if (localBiomes.has(BiomeType.RIVER)) {
        sentences.push(getRandomFragment(fragments.localGoods.RIVER));
    }
    
    // Remove duplicates and limit to 4-5 sentences for readability
    const uniqueSentences = [...new Set(sentences.filter(s => s.length > 0))];
    const finalDescription = uniqueSentences.slice(0, Math.min(5, uniqueSentences.length)).join(' ');

    return finalDescription;
}