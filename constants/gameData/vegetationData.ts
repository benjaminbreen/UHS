/**
 * constants/gameData/vegetationData.ts - Enhanced data for procedural species generation.
 */
import { ClimateType, VegetationBaseType, VegetationSpecies } from '../../types';

// Enhanced species interface for trading/economic value
interface EnhancedVegetationSpecies extends VegetationSpecies {
  tradeValue?: 'none' | 'low' | 'medium' | 'high' | 'legendary'; // Economic importance
  uses?: string[]; // What the plant is used for (medicine, dye, food, etc.)
  biomePreference?: string[]; // Specific biomes where this is more likely
  drops?: { name: string; chance: number; }[]; // What can be foraged
}

export const VEGETATION_SPECIES_DATA: Partial<Record<VegetationBaseType, Partial<Record<ClimateType, { 
  common: EnhancedVegetationSpecies[], 
  rare: EnhancedVegetationSpecies[], 
  superRare: EnhancedVegetationSpecies[], 
  ultraRare: EnhancedVegetationSpecies[] 
}>>>> = {
    deciduous_tree: {
        [ClimateType.TEMPERATE]: {
            common: [
                { name: 'Oak', linnaeanName: 'Quercus robur', emoji: '🌳', tradeValue: 'low', uses: ['timber', 'acorns'], drops: [{name: 'ACORNS', chance: 0.6}, {name: 'TREE_BARK', chance: 0.2}] }, 
                { name: 'Maple', linnaeanName: 'Acer platanoides', emoji: '🍁', tradeValue: 'medium', uses: ['syrup', 'timber'], drops: [{name: 'STICK', chance: 0.5}] },
                { name: 'Birch', linnaeanName: 'Betula pendula', emoji: '🌳', tradeValue: 'low', uses: ['bark', 'timber'], drops: [{name: 'TREE_BARK', chance: 0.4}] },
                { name: 'Beech', linnaeanName: 'Fagus sylvatica', emoji: '🌳', tradeValue: 'low', uses: ['nuts', 'timber'], drops: [{name: 'MUSHROOM', chance: 0.15}] },
                { name: 'Ash', linnaeanName: 'Fraxinus excelsior', emoji: '🌳', tradeValue: 'medium', uses: ['tools', 'weapons'], drops: [{name: 'STICK', chance: 0.7}] },
                { name: 'Elm', linnaeanName: 'Ulmus minor', emoji: '🌳', tradeValue: 'low', uses: ['timber'], drops: [{name: 'TREE_BARK', chance: 0.15}] },
                { name: 'Linden', linnaeanName: 'Tilia cordata', emoji: '🌳', tradeValue: 'low', uses: ['fiber', 'honey'], drops: [{name: 'HERB_BUNDLE', chance: 0.2}] }
            ],
            rare: [
                { name: 'Ginkgo', linnaeanName: 'Ginkgo biloba', emoji: '🍃', tradeValue: 'high', uses: ['medicine'], drops: [{name: 'MEDICINAL_HERBS', chance: 0.3}] },
                { name: 'Sweet Chestnut', linnaeanName: 'Castanea sativa', emoji: '🌰', tradeValue: 'medium', uses: ['food', 'timber'], drops: [{name: 'MUSHROOM', chance: 0.7}] },
                { name: 'Walnut', linnaeanName: 'Juglans regia', emoji: '🥜', tradeValue: 'high', uses: ['food', 'dye', 'timber'], drops: [{name: 'MUSHROOM', chance: 0.6}] },
                { name: 'Cherry', linnaeanName: 'Prunus avium', emoji: '🍒', tradeValue: 'medium', uses: ['food', 'timber'], drops: [{name: 'WILD_BERRIES', chance: 0.8}] }
            ],
            superRare: [
                { name: 'European Yew', linnaeanName: 'Taxus baccata', emoji: '🏹', tradeValue: 'legendary', uses: ['longbows', 'medicine'], drops: [{name: 'STICK', chance: 0.9}] },
                { name: 'Cork Oak', linnaeanName: 'Quercus suber', emoji: '🍾', tradeValue: 'high', uses: ['cork'], drops: [{name: 'TREE_BARK', chance: 0.8}] },
                { name: 'Mulberry', linnaeanName: 'Morus alba', emoji: '🐛', tradeValue: 'high', uses: ['silk', 'fruit'], drops: [{name: 'WILD_BERRIES', chance: 0.9}] }
            ],
            ultraRare: [
                { name: 'European Hornbeam', linnaeanName: 'Carpinus betulus', emoji: '⚒️', tradeValue: 'high', uses: ['tools', 'charcoal'], drops: [{name: 'STICK', chance: 0.8}] },
                { name: 'Service Tree', linnaeanName: 'Sorbus domestica', emoji: '🍯', tradeValue: 'medium', uses: ['fruit', 'medicine'], drops: [{name: 'WILD_BERRIES', chance: 0.7}] }
            ]
        },
        [ClimateType.SEMITROPICAL]: {
            common: [
                { name: 'Live Oak', linnaeanName: 'Quercus virginiana', emoji: '🌳', tradeValue: 'medium', uses: ['shipbuilding'], drops: [{name: 'ACORNS', chance: 0.5}, {name: 'TREE_BARK', chance: 0.2}] },
                { name: 'Southern Magnolia', linnaeanName: 'Magnolia grandiflora', emoji: '🌸', tradeValue: 'low', uses: ['ornamental'], drops: [{name: 'HERB_BUNDLE', chance: 0.3}] },
                { name: 'Sweet Gum', linnaeanName: 'Liquidambar styraciflua', emoji: '🌳', tradeValue: 'low', uses: ['resin'], drops: [{name: 'PINE_RESIN', chance: 0.5}] },
                { name: 'Bald Cypress', linnaeanName: 'Taxodium distichum', emoji: '🌲', tradeValue: 'medium', uses: ['swamp lumber'], biomePreference: ['wetlands'], drops: [{name: 'STICK', chance: 0.4}] }
            ],
            rare: [
                { name: 'Brazilwood', linnaeanName: 'Paubrasilia echinata', emoji: '🔴', tradeValue: 'legendary', uses: ['red dye'], drops: [{name: 'TREE_BARK', chance: 0.5}] },
                { name: 'Jacaranda', linnaeanName: 'Jacaranda mimosifolia', emoji: '💜', tradeValue: 'medium', uses: ['ornamental', 'timber'], drops: [{name: 'HERB_BUNDLE', chance: 0.2}] },
                { name: 'Flame Tree', linnaeanName: 'Delonix regia', emoji: '🔥', tradeValue: 'low', uses: ['ornamental'], drops: [] },
                { name: 'Avocado', linnaeanName: 'Persea americana', emoji: '🥑', tradeValue: 'medium', uses: ['food', 'oil'], drops: [{name: 'STRANGE_FRUIT', chance: 0.6}] }
            ],
            superRare: [
                { name: 'Camphor Tree', linnaeanName: 'Cinnamomum camphora', emoji: '💨', tradeValue: 'high', uses: ['medicine', 'preservative'], drops: [{name: 'MEDICINAL_HERBS', chance: 0.4}] },
                { name: 'Sweet Bay', linnaeanName: 'Laurus nobilis', emoji: '🍃', tradeValue: 'high', uses: ['spice', 'medicine'], drops: [{name: 'HERB_BUNDLE', chance: 0.7}] },
                { name: 'Carob Tree', linnaeanName: 'Ceratonia siliqua', emoji: '🫘', tradeValue: 'medium', uses: ['food', 'fodder'], drops: [{name: 'WILD_BERRIES', chance: 0.5}] }
            ],
            ultraRare: [
                { name: 'Cinchona Tree', linnaeanName: 'Cinchona officinalis', emoji: '💊', tradeValue: 'legendary', uses: ['quinine', 'medicine'], drops: [{name: 'MEDICINAL_HERBS', chance: 0.8}] },
                { name: 'Balsa Tree', linnaeanName: 'Ochroma pyramidale', emoji: '🪶', tradeValue: 'high', uses: ['lightweight timber'], drops: [{name: 'STICK', chance: 0.3}] }
            ]
        },
        [ClimateType.TROPICAL]: {
            common: [
                { name: 'Mahogany', linnaeanName: 'Swietenia mahagoni', emoji: '🌳', tradeValue: 'high', uses: ['luxury timber'], drops: [{name: 'STICK', chance: 0.3}] },
                { name: 'Teak', linnaeanName: 'Tectona grandis', emoji: '🌳', tradeValue: 'high', uses: ['shipbuilding', 'furniture'], drops: [{name: 'STICK', chance: 0.4}] },
                { name: 'Rubber Tree', linnaeanName: 'Hevea brasiliensis', emoji: '🌳', tradeValue: 'high', uses: ['rubber'], drops: [{name: 'PINE_RESIN', chance: 0.2}] },
                { name: 'Mango', linnaeanName: 'Mangifera indica', emoji: '🥭', tradeValue: 'medium', uses: ['food'], drops: [{name: 'STRANGE_FRUIT', chance: 0.7}] }
            ],
            rare: [
                { name: 'Rainbow Eucalyptus', linnaeanName: 'Eucalyptus deglupta', emoji: '🌈', tradeValue: 'medium', uses: ['ornamental', 'pulp'], drops: [{name: 'TREE_BARK', chance: 0.4}] },
                { name: 'Baobab', linnaeanName: 'Adansonia digitata', emoji: '🌳', tradeValue: 'medium', uses: ['food', 'fiber', 'medicine'], drops: [{name: 'STRANGE_FRUIT', chance: 0.5}] },
                { name: 'Breadfruit', linnaeanName: 'Artocarpus altilis', emoji: '🍞', tradeValue: 'medium', uses: ['food'], drops: [{name: 'BREAD', chance: 0.1}] },
                { name: 'Cacao Tree', linnaeanName: 'Theobroma cacao', emoji: '🍫', tradeValue: 'legendary', uses: ['chocolate', 'currency'], drops: [{name: 'WILD_BERRIES', chance: 0.6}] }
            ],
            superRare: [
                { name: 'Ebony Tree', linnaeanName: 'Diospyros ebenum', emoji: '⚫', tradeValue: 'legendary', uses: ['luxury timber', 'instruments'], drops: [] },
                { name: 'Rosewood', linnaeanName: 'Dalbergia nigra', emoji: '🌹', tradeValue: 'legendary', uses: ['luxury furniture', 'instruments'], drops: [] },
                { name: 'Cashew Tree', linnaeanName: 'Anacardium occidentale', emoji: '🥜', tradeValue: 'high', uses: ['nuts', 'cashew apple'], drops: [{name: 'ACORNS', chance: 0.5}] }
            ],
            ultraRare: [
                { name: 'Lignum Vitae', linnaeanName: 'Guaiacum officinale', emoji: '💎', tradeValue: 'legendary', uses: ['medicine', 'sacred wood'], drops: [{name: 'MEDICINAL_HERBS', chance: 0.5}] },
                { name: 'Sandalwood', linnaeanName: 'Santalum album', emoji: '🪵', tradeValue: 'legendary', uses: ['perfume', 'incense', 'medicine'], drops: [{name: 'HERB_BUNDLE', chance: 0.6}] }
            ]
        },
        [ClimateType.COLD]: {
            common: [
                { name: 'Paper Birch', linnaeanName: 'Betula papyrifera', emoji: '📜', tradeValue: 'medium', uses: ['bark paper', 'canoes'], drops: [{name: 'TREE_BARK', chance: 0.7}] },
                { name: 'Aspen', linnaeanName: 'Populus tremuloides', emoji: '🌳', tradeValue: 'low', uses: ['pulp'], drops: [{name: 'STICK', chance: 0.5}] },
                { name: 'Mountain Ash', linnaeanName: 'Sorbus aucuparia', emoji: '🔴', tradeValue: 'low', uses: ['food', 'medicine'], drops: [{name: 'WILD_BERRIES', chance: 0.4}] }
            ],
            rare: [
                { name: 'Arctic Willow Tree', linnaeanName: 'Salix arctica', emoji: '🌿', tradeValue: 'low', uses: ['medicine', 'baskets'], drops: [{name: 'STICK', chance: 0.6}] },
                { name: 'Downy Birch', linnaeanName: 'Betula pubescens', emoji: '🌳', tradeValue: 'low', uses: ['timber'], drops: [{name: 'TREE_BARK', chance: 0.3}] }
            ],
            superRare: [
                { name: 'Rowan', linnaeanName: 'Sorbus aucuparia', emoji: '🔴', tradeValue: 'medium', uses: ['protection charms', 'food'], drops: [{name: 'WILD_BERRIES', chance: 0.5}] }
            ],
            ultraRare: [
                { name: 'Arctic Poplar', linnaeanName: 'Populus balsamifera', emoji: '❄️', tradeValue: 'medium', uses: ['medicine', 'resin'], drops: [{name: 'PINE_RESIN', chance: 0.3}] }
            ]
        }
    },
    coniferous_tree: {
        [ClimateType.COLD]: {
            common: [
                { name: 'Scots Pine', linnaeanName: 'Pinus sylvestris', emoji: '🌲', tradeValue: 'medium', uses: ['timber', 'resin'], drops: [{name: 'PINE_CONE', chance: 0.7}, {name: 'PINE_RESIN', chance: 0.3}] },
                { name: 'White Spruce', linnaeanName: 'Picea glauca', emoji: '🌲', tradeValue: 'medium', uses: ['timber', 'pulp'], drops: [{name: 'PINE_CONE', chance: 0.6}, {name: 'PINE_RESIN', chance: 0.2}] },
                { name: 'Balsam Fir', linnaeanName: 'Abies balsamea', emoji: '🌲', tradeValue: 'medium', uses: ['timber', 'resin'], drops: [{name: 'PINE_CONE', chance: 0.5}, {name: 'PINE_RESIN', chance: 0.4}] },
                { name: 'Black Spruce', linnaeanName: 'Picea mariana', emoji: '🌲', tradeValue: 'medium', uses: ['pulp'], drops: [{name: 'PINE_CONE', chance: 0.6}] }
            ],
            rare: [
                { name: 'Siberian Larch', linnaeanName: 'Larix sibirica', emoji: '🌲', tradeValue: 'high', uses: ['durable timber'], drops: [{name: 'PINE_CONE', chance: 0.8}] },
                { name: 'Stone Pine', linnaeanName: 'Pinus cembra', emoji: '🌰', tradeValue: 'high', uses: ['pine nuts', 'timber'], drops: [{name: 'PINE_CONE', chance: 0.9}] },
                { name: 'Mountain Pine', linnaeanName: 'Pinus mugo', emoji: '🏔️', tradeValue: 'medium', uses: ['timber'], biomePreference: ['mountain', 'hills'], drops: [{name: 'PINE_CONE', chance: 0.7}] }
            ],
            superRare: [
                { name: 'Arctic Spruce', linnaeanName: 'Picea glauca', emoji: '❄️', tradeValue: 'high', uses: ['cold-resistant timber'], drops: [{name: 'PINE_CONE', chance: 0.6}] }
            ],
            ultraRare: [
                { name: 'Whitebark Pine', linnaeanName: 'Pinus albicaulis', emoji: '⚪', tradeValue: 'high', uses: ['pine nuts', 'sacred tree'], drops: [{name: 'PINE_CONE', chance: 0.9}] }
            ]
        },
        [ClimateType.TEMPERATE]: {
            common: [
                { name: 'Norway Spruce', linnaeanName: 'Picea abies', emoji: '🌲', tradeValue: 'medium', uses: ['timber', 'instruments'], drops: [{name: 'PINE_CONE', chance: 0.7}, {name: 'PINE_RESIN', chance: 0.2}] },
                { name: 'Douglas Fir', linnaeanName: 'Pseudotsuga menziesii', emoji: '🌲', tradeValue: 'high', uses: ['construction timber'], drops: [{name: 'PINE_CONE', chance: 0.6}, {name: 'PINE_RESIN', chance: 0.3}] },
                { name: 'Eastern White Pine', linnaeanName: 'Pinus strobus', emoji: '🌲', tradeValue: 'high', uses: ['ship masts', 'timber'], drops: [{name: 'PINE_CONE', chance: 0.8}, {name: 'PINE_RESIN', chance: 0.4}] },
                { name: 'European Larch', linnaeanName: 'Larix decidua', emoji: '🌲', tradeValue: 'high', uses: ['durable timber'], drops: [{name: 'PINE_CONE', chance: 0.7}] }
            ],
            rare: [
                { name: 'Giant Sequoia', linnaeanName: 'Sequoiadendron giganteum', emoji: '🌲', tradeValue: 'legendary', uses: ['massive timber'], drops: [{name: 'PINE_CONE', chance: 0.9}] },
                { name: 'Coast Redwood', linnaeanName: 'Sequoia sempervirens', emoji: '🌲', tradeValue: 'legendary', uses: ['rot-resistant timber'], drops: [{name: 'PINE_CONE', chance: 0.9}] },
                { name: 'Cedar of Lebanon', linnaeanName: 'Cedrus libani', emoji: '🏛️', tradeValue: 'legendary', uses: ['sacred timber', 'shipbuilding'], drops: [{name: 'PINE_CONE', chance: 0.5}] }
            ],
            superRare: [
                { name: 'Monkey Puzzle', linnaeanName: 'Araucaria araucana', emoji: '🧩', tradeValue: 'high', uses: ['ornamental', 'pine nuts'], drops: [{name: 'PINE_CONE', chance: 0.8}] },
                { name: 'Deodar Cedar', linnaeanName: 'Cedrus deodara', emoji: '🏔️', tradeValue: 'high', uses: ['sacred timber'], drops: [{name: 'PINE_CONE', chance: 0.6}] }
            ],
            ultraRare: [
                { name: 'Wollemi Pine', linnaeanName: 'Wollemia nobilis', emoji: '🦕', tradeValue: 'legendary', uses: ['living fossil', 'sacred'], drops: [{name: 'PINE_CONE', chance: 0.3}] }
            ]
        },
        [ClimateType.SEMITROPICAL]: {
            common: [
                { name: 'Loblolly Pine', linnaeanName: 'Pinus taeda', emoji: '🌲', tradeValue: 'medium', uses: ['pulp', 'timber'], drops: [{name: 'PINE_CONE', chance: 0.7}] },
                { name: 'Slash Pine', linnaeanName: 'Pinus elliottii', emoji: '🌲', tradeValue: 'medium', uses: ['resin', 'timber'], drops: [{name: 'PINE_CONE', chance: 0.6}, {name: 'PINE_RESIN', chance: 0.5}] },
                { name: 'Pond Cypress', linnaeanName: 'Taxodium ascendens', emoji: '🌲', tradeValue: 'medium', uses: ['swamp timber'], biomePreference: ['wetlands'], drops: [{name: 'PINE_CONE', chance: 0.4}] }
            ],
            rare: [
                { name: 'Kauri', linnaeanName: 'Agathis australis', emoji: '🌲', tradeValue: 'legendary', uses: ['ship timber', 'resin'], drops: [{name: 'PINE_RESIN', chance: 0.6}] },
                { name: 'Longleaf Pine', linnaeanName: 'Pinus palustris', emoji: '🌲', tradeValue: 'high', uses: ['naval stores', 'resin'], drops: [{name: 'PINE_RESIN', chance: 0.7}] }
            ],
            superRare: [
                { name: 'Norfolk Pine', linnaeanName: 'Araucaria heterophylla', emoji: '🏝️', tradeValue: 'high', uses: ['ship masts'], drops: [] }
            ],
            ultraRare: [
                { name: 'Bunya Pine', linnaeanName: 'Araucaria bidwillii', emoji: '🌰', tradeValue: 'high', uses: ['pine nuts', 'sacred ceremonies'], drops: [{name: 'PINE_CONE', chance: 0.8}] }
            ]
        },
        [ClimateType.TROPICAL]: {
            common: [
                { name: 'Tropical Pine', linnaeanName: 'Pinus caribaea', emoji: '🌲', tradeValue: 'medium', uses: ['timber', 'resin'], drops: [{name: 'PINE_CONE', chance: 0.5}, {name: 'PINE_RESIN', chance: 0.3}] }
            ],
            rare: [
                { name: 'Hoop Pine', linnaeanName: 'Araucaria cunninghamii', emoji: '🌲', tradeValue: 'high', uses: ['quality timber'], drops: [] }
            ],
            superRare: [
                { name: 'Cook Pine', linnaeanName: 'Araucaria columnaris', emoji: '🌲', tradeValue: 'high', uses: ['ship timber'], drops: [] }
            ],
            ultraRare: [
                { name: 'Kauri Pine', linnaeanName: 'Agathis robusta', emoji: '💎', tradeValue: 'legendary', uses: ['premium timber', 'amber resin'], drops: [{name: 'PINE_RESIN', chance: 0.5}] }
            ]
        }
    },
    palm_tree: {
        [ClimateType.SEMITROPICAL]: {
            common: [
                { name: 'Sabal Palm', linnaeanName: 'Sabal palmetto', emoji: '🌴', tradeValue: 'low', uses: ['fiber', 'thatch'], drops: [{name: 'WILD_BERRIES', chance: 0.3}] },
                { name: 'Mexican Fan Palm', linnaeanName: 'Washingtonia robusta', emoji: '🌴', tradeValue: 'low', uses: ['ornamental'], drops: [] },
                { name: 'Queen Palm', linnaeanName: 'Syagrus romanzoffiana', emoji: '👑', tradeValue: 'medium', uses: ['ornamental', 'fruit'], drops: [{name: 'WILD_BERRIES', chance: 0.4}] }
            ],
            rare: [
                { name: 'Canary Island Date Palm', linnaeanName: 'Phoenix canariensis', emoji: '🌴', tradeValue: 'medium', uses: ['dates', 'sap'], drops: [{name: 'STRANGE_FRUIT', chance: 0.5}] },
                { name: 'Bismarck Palm', linnaeanName: 'Bismarckia nobilis', emoji: '🌴', tradeValue: 'high', uses: ['ornamental', 'thatch'], drops: [] },
                { name: 'Chilean Wine Palm', linnaeanName: 'Jubaea chilensis', emoji: '🍷', tradeValue: 'legendary', uses: ['palm wine', 'palm honey'], drops: [] }
            ],
            superRare: [
                { name: 'Jelly Palm', linnaeanName: 'Butia capitata', emoji: '🍯', tradeValue: 'medium', uses: ['fruit', 'jelly'], drops: [{name: 'WILD_BERRIES', chance: 0.6}] },
                { name: 'Mediterranean Fan Palm', linnaeanName: 'Chamaerops humilis', emoji: '🌴', tradeValue: 'medium', uses: ['fiber'], drops: [] }
            ],
            ultraRare: [
                { name: 'Coco de Mer', linnaeanName: 'Lodoicea maldivica', emoji: '🥥', tradeValue: 'legendary', uses: ['sacred nuts', 'aphrodisiac'], drops: [{name: 'STRANGE_FRUIT', chance: 0.8}] }
            ]
        },
        [ClimateType.TROPICAL]: {
            common: [
                { name: 'Coconut Palm', linnaeanName: 'Cocos nucifera', emoji: '🥥', tradeValue: 'high', uses: ['food', 'oil', 'fiber'], biomePreference: ['beach'], drops: [{name: 'STRANGE_FRUIT', chance: 0.6}] },
                { name: 'African Oil Palm', linnaeanName: 'Elaeis guineensis', emoji: '🌴', tradeValue: 'legendary', uses: ['palm oil'], drops: [{name: 'WILD_BERRIES', chance: 0.4}] },
                { name: 'Açaí Palm', linnaeanName: 'Euterpe oleracea', emoji: '🫐', tradeValue: 'high', uses: ['superfood', 'hearts of palm'], drops: [{name: 'WILD_BERRIES', chance: 0.8}] },
                { name: 'Betel Nut Palm', linnaeanName: 'Areca catechu', emoji: '🌴', tradeValue: 'high', uses: ['stimulant', 'medicine'], drops: [{name: 'ACORNS', chance: 0.5}] }
            ],
            rare: [
                { name: 'Royal Palm', linnaeanName: 'Roystonea regia', emoji: '👑', tradeValue: 'medium', uses: ['ornamental', 'hearts of palm'], drops: [] },
                { name: 'Sugar Palm', linnaeanName: 'Arenga pinnata', emoji: '🍯', tradeValue: 'high', uses: ['palm sugar', 'sap wine'], drops: [] },
                { name: 'Peach Palm', linnaeanName: 'Bactris gasipaes', emoji: '🍑', tradeValue: 'medium', uses: ['food', 'timber'], drops: [{name: 'STRANGE_FRUIT', chance: 0.6}] },
                { name: 'Doum Palm', linnaeanName: 'Hyphaene thebaica', emoji: '🌴', tradeValue: 'medium', uses: ['fruit', 'fiber'], drops: [{name: 'STRANGE_FRUIT', chance: 0.5}] }
            ],
            superRare: [
                { name: 'Rattan Palm', linnaeanName: 'Calamus rotang', emoji: '🪢', tradeValue: 'high', uses: ['furniture', 'baskets'], drops: [{name: 'VINE', chance: 0.8}] },
                { name: 'Sago Palm', linnaeanName: 'Metroxylon sagu', emoji: '🌾', tradeValue: 'high', uses: ['starch', 'food staple'], drops: [{name: 'HERB_BUNDLE', chance: 0.4}] }
            ],
            ultraRare: [
                { name: 'Double Coconut', linnaeanName: 'Lodoicea maldivica', emoji: '🥥', tradeValue: 'legendary', uses: ['sacred', 'royal gifts'], drops: [{name: 'STRANGE_FRUIT', chance: 0.9}] },
                { name: 'Ivory Nut Palm', linnaeanName: 'Phytelephas macrocarpa', emoji: '🦴', tradeValue: 'legendary', uses: ['vegetable ivory', 'buttons'], drops: [] }
            ]
        },
        [ClimateType.ARID]: {
            common: [
                { name: 'Date Palm', linnaeanName: 'Phoenix dactylifera', emoji: '🌴', tradeValue: 'high', uses: ['dates', 'sap', 'fiber'], biomePreference: ['oasis'], drops: [{name: 'STRANGE_FRUIT', chance: 0.8}] },
                { name: 'Desert Fan Palm', linnaeanName: 'Washingtonia filifera', emoji: '🌴', tradeValue: 'low', uses: ['fiber', 'thatch'], biomePreference: ['oasis'], drops: [{name: 'DRY_LEAVES', chance: 0.7}] }
            ],
            rare: [
                { name: 'Doum Palm', linnaeanName: 'Hyphaene thebaica', emoji: '🌴', tradeValue: 'medium', uses: ['fruit', 'fiber'], biomePreference: ['oasis'], drops: [{name: 'STRANGE_FRUIT', chance: 0.5}] },
                { name: 'Wild Date Palm', linnaeanName: 'Phoenix sylvestris', emoji: '🌴', tradeValue: 'medium', uses: ['sap wine'], biomePreference: ['oasis'], drops: [{name: 'STRANGE_FRUIT', chance: 0.6}] }
            ],
            superRare: [
                { name: 'Silver Date Palm', linnaeanName: 'Phoenix sylvestris', emoji: '🥈', tradeValue: 'high', uses: ['ornamental dates'], biomePreference: ['oasis'], drops: [{name: 'STRANGE_FRUIT', chance: 0.7}] }
            ],
            ultraRare: [
                { name: 'Dwarf Date Palm', linnaeanName: 'Phoenix roebelenii', emoji: '🌴', tradeValue: 'high', uses: ['ornamental'], biomePreference: ['oasis'], drops: [] }
            ]
        },
    },
    cactus: {
        [ClimateType.ARID]: {
            common: [
                { name: 'Saguaro', linnaeanName: 'Carnegiea gigantea', emoji: '🌵', tradeValue: 'medium', uses: ['fruit', 'construction'], drops: [{name: 'CACTUS_FRUIT', chance: 0.4}] },
                { name: 'Barrel Cactus', linnaeanName: 'Ferocactus cylindraceus', emoji: '🌵', tradeValue: 'low', uses: ['water storage', 'medicine'], drops: [{name: 'CACTUS_FRUIT', chance: 0.2}] },
                { name: 'Cholla', linnaeanName: 'Cylindropuntia fulgida', emoji: '🌵', tradeValue: 'low', uses: ['medicine'], drops: [] },
                { name: 'Prickly Pear', linnaeanName: 'Opuntia engelmannii', emoji: '🌵', tradeValue: 'medium', uses: ['food', 'dye', 'medicine'], drops: [{name: 'CACTUS_FRUIT', chance: 0.7}] }
            ],
            rare: [
                { name: 'Organ Pipe Cactus', linnaeanName: 'Stenocereus thurberi', emoji: '🌵', tradeValue: 'medium', uses: ['fruit', 'construction'], drops: [{name: 'CACTUS_FRUIT', chance: 0.5}] },
                { name: 'Fishhook Barrel', linnaeanName: 'Ferocactus wislizeni', emoji: '🪝', tradeValue: 'medium', uses: ['fish hooks', 'medicine'], drops: [] },
                { name: 'Agave', linnaeanName: 'Agave americana', emoji: '🌿', tradeValue: 'high', uses: ['fiber', 'alcohol', 'soap'], drops: [] }
            ],
            superRare: [
                { name: 'Century Plant', linnaeanName: 'Agave americana', emoji: '💯', tradeValue: 'high', uses: ['tequila', 'fiber'], drops: [] },
                { name: 'Night-blooming Cereus', linnaeanName: 'Epiphyllum oxypetalum', emoji: '🌙', tradeValue: 'high', uses: ['medicine', 'rare blooms'], drops: [] }
            ],
            ultraRare: [
                { name: 'Welwitschia', linnaeanName: 'Welwitschia mirabilis', emoji: '🏜️', tradeValue: 'legendary', uses: ['sacred plant', 'longevity symbol'], drops: [] },
                { name: 'Living Rock Cactus', linnaeanName: 'Ariocarpus fissuratus', emoji: '🪨', tradeValue: 'legendary', uses: ['hallucinogenic', 'sacred rituals'], drops: [] }
            ]
        },
        [ClimateType.SEMITROPICAL]: {
            common: [
                { name: 'Prickly Pear', linnaeanName: 'Opuntia stricta', emoji: '🌵', tradeValue: 'low', uses: ['food', 'fodder'], drops: [{name: 'CACTUS_FRUIT', chance: 0.6}] },
                { name: 'Christmas Cactus', linnaeanName: 'Schlumbergera truncata', emoji: '🎄', tradeValue: 'low', uses: ['ornamental'], drops: [] }
            ],
            rare: [
                { name: 'Golden Barrel', linnaeanName: 'Echinocactus grusonii', emoji: '🟡', tradeValue: 'medium', uses: ['ornamental'], drops: [] },
                { name: 'Dragon Fruit', linnaeanName: 'Hylocereus undatus', emoji: '🐉', tradeValue: 'high', uses: ['exotic fruit'], drops: [{name: 'CACTUS_FRUIT', chance: 0.7}] }
            ],
            superRare: [
                { name: 'Old Man Cactus', linnaeanName: 'Cephalocereus senilis', emoji: '👴', tradeValue: 'high', uses: ['ornamental', 'fiber'], drops: [] }
            ],
            ultraRare: [
                { name: 'Aztekium', linnaeanName: 'Aztekium ritteri', emoji: '🏛️', tradeValue: 'legendary', uses: ['sacred to Aztecs'], drops: [] }
            ]
        },
        [ClimateType.TEMPERATE]: {
            common: [
                { name: 'Eastern Prickly Pear', linnaeanName: 'Opuntia humifusa', emoji: '🌵', tradeValue: 'low', uses: ['food'], drops: [{name: 'CACTUS_FRUIT', chance: 0.4}] }
            ],
            rare: [
                { name: 'Hardy Prickly Pear', linnaeanName: 'Opuntia fragilis', emoji: '🌵', tradeValue: 'low', uses: ['food'], drops: [{name: 'CACTUS_FRUIT', chance: 0.3}] }
            ],
            superRare: [],
            ultraRare: []
        }
    },
    generic_bush: {
        [ClimateType.ARID]: {
            common: [
                { name: 'Creosote Bush', linnaeanName: 'Larrea tridentata', emoji: '🌿', tradeValue: 'medium', uses: ['medicine', 'preservative'], drops: [{name: 'HERB_BUNDLE', chance: 0.4}] },
                { name: 'Sagebrush', linnaeanName: 'Artemisia tridentata', emoji: '🌿', tradeValue: 'high', uses: ['ceremony', 'medicine', 'incense'], drops: [{name: 'HERB_BUNDLE', chance: 0.6}] },
                { name: 'Desert Broom', linnaeanName: 'Baccharis sarothroides', emoji: '🧹', tradeValue: 'low', uses: ['brooms', 'baskets'], drops: [{name: 'STICK', chance: 0.5}] },
                { name: 'Brittlebush', linnaeanName: 'Encelia farinosa', emoji: '🌼', tradeValue: 'low', uses: ['medicine'], drops: [{name: 'MEDICINAL_HERBS', chance: 0.2}] }
            ],
            rare: [
                { name: 'Ocotillo', linnaeanName: 'Fouquieria splendens', emoji: '🔥', tradeValue: 'medium', uses: ['medicine', 'fencing'], drops: [{name: 'STICK', chance: 0.6}] },
                { name: 'Jojoba', linnaeanName: 'Simmondsia chinensis', emoji: '🫒', tradeValue: 'legendary', uses: ['cosmetic oil', 'lubricant'], drops: [{name: 'WILD_BERRIES', chance: 0.4}] },
                { name: 'Frankincense Bush', linnaeanName: 'Boswellia sacra', emoji: '💨', tradeValue: 'legendary', uses: ['incense', 'medicine'], drops: [{name: 'PINE_RESIN', chance: 0.5}] }
            ],
            superRare: [
                { name: 'Desert Sage', linnaeanName: 'Artemisia tridentata', emoji: '🧿', tradeValue: 'high', uses: ['sacred ceremonies'], drops: [{name: 'HERB_BUNDLE', chance: 0.8}] },
                { name: 'Myrrh Bush', linnaeanName: 'Commiphora myrrha', emoji: '✨', tradeValue: 'legendary', uses: ['incense', 'embalming'], drops: [{name: 'PINE_RESIN', chance: 0.6}] }
            ],
            ultraRare: [
                { name: 'Resurrection Plant', linnaeanName: 'Selaginella lepidophylla', emoji: '✨', tradeValue: 'legendary', uses: ['miracle plant', 'medicine'], drops: [{name: 'MEDICINAL_HERBS', chance: 0.3}] },
                { name: 'Desert Rose', linnaeanName: 'Adenium obesum', emoji: '🌹', tradeValue: 'high', uses: ['ornamental', 'poison'], drops: [] }
            ]
        },
        [ClimateType.COLD]: {
            common: [
                { name: 'Arctic Willow', linnaeanName: 'Salix arctica', emoji: '🌿', tradeValue: 'medium', uses: ['medicine', 'baskets'], drops: [{name: 'STICK', chance: 0.5}] },
                { name: 'Lingonberry', linnaeanName: 'Vaccinium vitis-idaea', emoji: '🔴', tradeValue: 'high', uses: ['preserves', 'medicine'], drops: [{name: 'WILD_BERRIES', chance: 0.7}] },
                { name: 'Crowberry', linnaeanName: 'Empetrum nigrum', emoji: '⚫', tradeValue: 'medium', uses: ['food', 'dye'], drops: [{name: 'WILD_BERRIES', chance: 0.6}] },
                { name: 'Labrador Tea', linnaeanName: 'Rhododendron groenlandicum', emoji: '🍃', tradeValue: 'high', uses: ['tea', 'medicine'], drops: [{name: 'HERB_BUNDLE', chance: 0.5}] }
            ],
            rare: [
                { name: 'Cloudberry', linnaeanName: 'Rubus chamaemorus', emoji: '☁️', tradeValue: 'legendary', uses: ['Arctic gold fruit'], drops: [{name: 'WILD_BERRIES', chance: 0.8}] },
                { name: 'Arctic Bearberry', linnaeanName: 'Arctostaphylos alpina', emoji: '🐻', tradeValue: 'high', uses: ['food', 'medicine'], drops: [{name: 'WILD_BERRIES', chance: 0.7}] },
                { name: 'Bog Bilberry', linnaeanName: 'Vaccinium uliginosum', emoji: '🫐', tradeValue: 'high', uses: ['food'], drops: [{name: 'WILD_BERRIES', chance: 0.8}] }
            ],
            superRare: [
                { name: 'Mountain Avens', linnaeanName: 'Geum montanum', emoji: '⛰️', tradeValue: 'medium', uses: ['medicine'], drops: [{name: 'MEDICINAL_HERBS', chance: 0.3}] },
                { name: 'Alpine Azalea', linnaeanName: 'Loiseleuria procumbens', emoji: '🌸', tradeValue: 'high', uses: ['ornamental'], drops: [] }
            ],
            ultraRare: [
                { name: 'Arctic Poppy', linnaeanName: 'Papaver radicatum', emoji: '🌸', tradeValue: 'high', uses: ['medicine', 'sacred'], drops: [{name: 'MEDICINAL_HERBS', chance: 0.2}] },
                { name: 'Purple Saxifrage', linnaeanName: 'Saxifraga oppositifolia', emoji: '💜', tradeValue: 'medium', uses: ['medicine'], drops: [{name: 'HERB_BUNDLE', chance: 0.3}] }
            ]
        },
        [ClimateType.TEMPERATE]: {
            common: [
                { name: 'Blackberry', linnaeanName: 'Rubus fruticosus', emoji: '🫐', tradeValue: 'medium', uses: ['food', 'medicine'], drops: [{name: 'WILD_BERRIES', chance: 0.8}] },
                { name: 'Elderberry', linnaeanName: 'Sambucus nigra', emoji: '🫐', tradeValue: 'high', uses: ['medicine', 'dye'], drops: [{name: 'WILD_BERRIES', chance: 0.7}] },
                { name: 'Hawthorn', linnaeanName: 'Crataegus monogyna', emoji: '🔴', tradeValue: 'high', uses: ['heart medicine'], drops: [{name: 'WILD_BERRIES', chance: 0.6}] },
                { name: 'Wild Rose', linnaeanName: 'Rosa canina', emoji: '🌹', tradeValue: 'high', uses: ['perfume', 'medicine'], drops: [{name: 'HERB_BUNDLE', chance: 0.5}] }
            ],
            rare: [
                { name: 'Mountain Laurel', linnaeanName: 'Kalmia latifolia', emoji: '🌸', tradeValue: 'medium', uses: ['ornamental', 'poison'], drops: [] },
                { name: 'Juniper', linnaeanName: 'Juniperus communis', emoji: '🌿', tradeValue: 'high', uses: ['gin flavoring', 'medicine'], drops: [{name: 'WILD_BERRIES', chance: 0.7}] },
                { name: 'Wild Indigo', linnaeanName: 'Baptisia australis', emoji: '🔵', tradeValue: 'legendary', uses: ['blue dye'], drops: [] },
                { name: 'Madder Root', linnaeanName: 'Rubia tinctorum', emoji: '🔴', tradeValue: 'legendary', uses: ['red dye'], drops: [] }
            ],
            superRare: [
                { name: 'Woad', linnaeanName: 'Isatis tinctoria', emoji: '🔵', tradeValue: 'legendary', uses: ['blue war paint', 'dye'], drops: [] },
                { name: 'Ginseng', linnaeanName: 'Panax ginseng', emoji: '🌿', tradeValue: 'legendary', uses: ['longevity medicine'], drops: [{name: 'MEDICINAL_HERBS', chance: 0.5}] }
            ],
            ultraRare: [
                { name: 'Goldenseal', linnaeanName: 'Hydrastis canadensis', emoji: '💛', tradeValue: 'legendary', uses: ['powerful medicine'], drops: [{name: 'MEDICINAL_HERBS', chance: 0.6}] },
                { name: 'Wild Ginger', linnaeanName: 'Asarum canadense', emoji: '🫚', tradeValue: 'high', uses: ['spice', 'medicine'], drops: [{name: 'HERB_BUNDLE', chance: 0.4}] }
            ]
        },
        [ClimateType.SEMITROPICAL]: {
            common: [
                { name: 'Hibiscus', linnaeanName: 'Hibiscus rosa-sinensis', emoji: '🌺', tradeValue: 'medium', uses: ['tea', 'ornamental'], drops: [{name: 'HERB_BUNDLE', chance: 0.3}] },
                { name: 'Bougainvillea', linnaeanName: 'Bougainvillea spectabilis', emoji: '🌸', tradeValue: 'low', uses: ['ornamental'], drops: [] },
                { name: 'Lantana', linnaeanName: 'Lantana camara', emoji: '🌼', tradeValue: 'low', uses: ['ornamental'], drops: [{name: 'WILD_BERRIES', chance: 0.2}] },
                { name: 'Oleander', linnaeanName: 'Nerium oleander', emoji: '🌸', tradeValue: 'medium', uses: ['ornamental', 'poison'], drops: [] }
            ],
            rare: [
                { name: 'Bird of Paradise', linnaeanName: 'Strelitzia reginae', emoji: '🦜', tradeValue: 'high', uses: ['exotic ornamental'], drops: [] },
                { name: 'Gardenia', linnaeanName: 'Gardenia jasminoides', emoji: '🤍', tradeValue: 'high', uses: ['perfume'], drops: [] },
                { name: 'Jasmine', linnaeanName: 'Jasminum officinale', emoji: '🌼', tradeValue: 'legendary', uses: ['perfume', 'tea'], drops: [{name: 'HERB_BUNDLE', chance: 0.7}] },
                { name: 'Azalea', linnaeanName: 'Rhododendron simsii', emoji: '🌸', tradeValue: 'medium', uses: ['ornamental'], drops: [] }
            ],
            superRare: [
                { name: 'Tea Bush', linnaeanName: 'Camellia sinensis', emoji: '🍃', tradeValue: 'legendary', uses: ['tea trade'], drops: [{name: 'DRY_LEAVES', chance: 0.8}] },
                { name: 'Coffee Bush', linnaeanName: 'Coffea arabica', emoji: '☕', tradeValue: 'legendary', uses: ['coffee beans'], drops: [{name: 'WILD_BERRIES', chance: 0.6}] },
                { name: 'Pepper Bush', linnaeanName: 'Piper nigrum', emoji: '🌶️', tradeValue: 'legendary', uses: ['black pepper spice'], drops: [{name: 'WILD_BERRIES', chance: 0.5}] }
            ],
            ultraRare: [
                { name: 'Vanilla Orchid', linnaeanName: 'Vanilla planifolia', emoji: '🍦', tradeValue: 'legendary', uses: ['vanilla spice'], drops: [] },
                { name: 'Nutmeg Bush', linnaeanName: 'Myristica fragrans', emoji: '🌰', tradeValue: 'legendary', uses: ['nutmeg spice'], drops: [{name: 'ACORNS', chance: 0.3}] }
            ]
        },
        [ClimateType.TROPICAL]: {
            common: [
                { name: 'Frangipani', linnaeanName: 'Plumeria rubra', emoji: '🌺', tradeValue: 'medium', uses: ['perfume', 'ornamental'], drops: [] },
                { name: 'Heliconia', linnaeanName: 'Heliconia bihai', emoji: '🌺', tradeValue: 'low', uses: ['ornamental'], drops: [] },
                { name: 'Croton', linnaeanName: 'Codiaeum variegatum', emoji: '🌿', tradeValue: 'low', uses: ['ornamental'], drops: [] },
                { name: 'Ixora', linnaeanName: 'Ixora coccinea', emoji: '🔴', tradeValue: 'low', uses: ['ornamental'], drops: [] }
            ],
            rare: [
                { name: 'Torch Ginger', linnaeanName: 'Etlingera elatior', emoji: '🔥', tradeValue: 'medium', uses: ['spice', 'medicine'], drops: [{name: 'HERB_BUNDLE', chance: 0.6}] },
                { name: 'Anthurium', linnaeanName: 'Anthurium andraeanum', emoji: '❤️', tradeValue: 'high', uses: ['ornamental'], drops: [] },
                { name: 'Ylang-Ylang', linnaeanName: 'Cananga odorata', emoji: '💛', tradeValue: 'legendary', uses: ['perfume oil'], drops: [] }
            ],
            superRare: [
                { name: 'Allspice Bush', linnaeanName: 'Pimenta dioica', emoji: '🌶️', tradeValue: 'legendary', uses: ['allspice'], drops: [{name: 'WILD_BERRIES', chance: 0.7}] },
                { name: 'Clove Bush', linnaeanName: 'Syzygium aromaticum', emoji: '🌿', tradeValue: 'legendary', uses: ['clove spice'], drops: [{name: 'HERB_BUNDLE', chance: 0.8}] },
                { name: 'Cinnamon Bush', linnaeanName: 'Cinnamomum verum', emoji: '🤎', tradeValue: 'legendary', uses: ['cinnamon bark'], drops: [{name: 'TREE_BARK', chance: 0.7}] }
            ],
            ultraRare: [
                { name: 'Cardamom Plant', linnaeanName: 'Elettaria cardamomum', emoji: '🌿', tradeValue: 'legendary', uses: ['cardamom spice'], drops: [{name: 'HERB_BUNDLE', chance: 0.9}] },
                { name: 'Saffron Crocus', linnaeanName: 'Crocus sativus', emoji: '🟡', tradeValue: 'legendary', uses: ['saffron - worth its weight in gold'], drops: [{name: 'MEDICINAL_HERBS', chance: 0.3}] }
            ]
        }
    }
};

// Trade value scoring for economic simulation
export const TRADE_VALUE_MULTIPLIERS = {
    none: 0,
    low: 1,
    medium: 2,
    high: 5,
    legendary: 20
};

// Get species by trade value for economic queries
export function getSpeciesByTradeValue(tradeValue: 'none' | 'low' | 'medium' | 'high' | 'legendary'): EnhancedVegetationSpecies[] {
    const result: EnhancedVegetationSpecies[] = [];
    
    for (const baseTypeData of Object.values(VEGETATION_SPECIES_DATA)) {
        if (!baseTypeData) continue;
        for (const climateData of Object.values(baseTypeData)) {
            if (!climateData) continue;
            for (const rarityArray of Object.values(climateData)) {
                for (const species of rarityArray) {
                    if (species.tradeValue === tradeValue) {
                        result.push(species);
                    }
                }
            }
        }
    }
    
    return result;
}

// Enhanced validation with trade value checks
export function validateVegetationData(): boolean {
    try {
        const requiredRarityTiers = ['common', 'rare', 'superRare', 'ultraRare'];
        let totalSpecies = 0;
        let tradableSpecies = 0;
        
        for (const [baseType, climateData] of Object.entries(VEGETATION_SPECIES_DATA)) {
            if (!climateData) continue;
            
            // Verify no trees in arid climate (except palms in oasis)
            if (baseType === 'deciduous_tree' || baseType === 'coniferous_tree') {
                if (climateData[ClimateType.ARID]) {
                    console.error(`ERROR: ${baseType} should not exist in arid climate!`);
                    return false;
                }
            }
            
            for (const [climate, rarityData] of Object.entries(climateData)) {
                if (!rarityData) continue;
                
                for (const tier of requiredRarityTiers) {
                    const species = rarityData[tier as keyof typeof rarityData] as EnhancedVegetationSpecies[];
                    if (!Array.isArray(species)) continue;
                    
                    for (const spec of species) {
                        totalSpecies++;
                        if (spec.tradeValue && spec.tradeValue !== 'none') {
                            tradableSpecies++;
                        }
                        
                        if (!spec.name || !spec.linnaeanName) {
                            console.warn(`Invalid species data in ${baseType}/${climate}/${tier}:`, spec);
                            return false;
                        }
                    }
                }
            }
        }
        
        console.log(`[Vegetation] Data validation successful: ${totalSpecies} total species, ${tradableSpecies} tradable (${((tradableSpecies/totalSpecies)*100).toFixed(1)}%)`);
        return true;
    } catch (error) {
        console.error('[Vegetation] Data validation failed:', error);
        return false;
    }
}