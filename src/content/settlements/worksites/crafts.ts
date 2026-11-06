import type { WorksiteProfile } from "./types";

// Bounds: west, south, east, north.
const EUROPE = [-11,36,30,61] as const, SOUTH_ASIA = [66,6,92,34] as const, CHINA = [98,18,123,42] as const;
const WEST_AFRICA = [-18,4,16,16] as const, WEST_ASIA = [30,24,63,42] as const;
const common = { revision: 2, basis: "reconstructed", capacity: 3 } as const;
const salt = [{prop:"liddedBasket",label:"Baskets of dried salt"},{prop:"crate",label:"Salt-raking tools"}];
const iron = [{prop:"woodpile",label:"Charcoal and fuel"},{prop:"bench",label:"Smith's bench"}];
const oil = [{prop:"pot",label:"Oil jars"},{prop:"crate",label:"Press bags and baskets"}];
const cane = [{prop:"woodpile",label:"Cut cane and bagasse fuel"},{prop:"pot",label:"Sugar moulds"}];

const saltworks: WorksiteProfile[] = [
  {...common,id:"mediterranean-saltworks",kind:"saltworks",roles:["salt-worker","salt-panner"],waterSupply:"sea",siting:"fringe",
    label:"Salt pans",scope:{years:[-500,1950],bounds:[-10,35,30,48]},frame:"worksite-saltpans-europe",
    outbuilding:{frame:"worksite-masonry-store",label:"Salt store"},supplies:salt,
    sources:["https://en.wikipedia.org/wiki/Salt_evaporation_pond"],
    note:"Seawater let into shallow clay-floored pans and left to the sun, the crust raked into heaps. Coastal pans like these are documented from Roman times round the Mediterranean and Atlantic coasts; this yard is not a surveyed saltern."},
  {...common,id:"chinese-salt-boiling",kind:"saltworks",roles:["salt-worker","salt-panner"],waterSupply:"sea",siting:"fringe",
    label:"Salt yard and boiling hearth",scope:{years:[-200,1950],bounds:[108,18,123,41]},frame:"worksite-saltpans-sinitic",
    outbuilding:{frame:"worksite-eastasian-store",label:"Salt store"},supplies:salt,
    sources:["https://en.wikipedia.org/wiki/Tiangong_Kaiwu"],
    note:"Brine concentrated in pans and finished by boiling in a wide iron pan over a hearth, as the Tiangong Kaiwu (1637) describes for the coast. The state salt monopoly governed who could sell it."},
  {...common,id:"gujarat-salt-pans",kind:"saltworks",roles:["salt-worker","salt-panner"],waterSupply:"sea",siting:"fringe",
    label:"Salt pans",scope:{years:[-500,1950],bounds:SOUTH_ASIA},frame:"worksite-saltpans-india",
    outbuilding:{frame:"worksite-store-india",label:"Salt store"},supplies:salt,
    sources:["https://en.wikipedia.org/wiki/Agariya"],
    note:"Solar pans on the coast and the Rann of Kutch, worked by salt-making families such as the Agariya. Under British rule salt was taxed and its making licensed, which Gandhi's Salt March of 1930 defied."},
  {...common,id:"west-african-salt-boiling",kind:"saltworks",roles:["salt-worker","salt-panner"],waterSupply:"sea",siting:"fringe",
    label:"Salt pans and boiling hearth",scope:{years:[500,1950],bounds:[-17.5,4,8,15]},frame:"worksite-saltpans-westafrica",
    outbuilding:{frame:"worksite-store-westafrica",label:"Salt store"},supplies:salt,
    sources:["https://en.wikipedia.org/wiki/Songor_Lagoon"],
    note:"Lagoon and coastal salt, dried in pans or boiled down over fires, traded inland for kola, cloth and gold. The Ada salt of the Songor lagoon is the best-recorded case; this yard is inferred."},
  {...common,id:"maras-salt-terraces",kind:"saltworks",roles:["salt-worker","salt-panner"],siting:"fringe",
    label:"Terraced salt pans",scope:{years:[1000,1950],bounds:[-73,-14.5,-71,-12.5]},frame:"worksite-saltpans-andes",
    outbuilding:{frame:"worksite-store-andes",label:"Salt store"},supplies:salt,
    sources:["https://en.wikipedia.org/wiki/Salineras_de_Maras"],
    note:"A salt spring fed into hundreds of small terraced pans on the hillside near Cusco, worked since before the Inca. Each family worked its own pans."},
  {...common,id:"hawaiian-salt-pans",kind:"saltworks",roles:["salt-worker","salt-panner"],waterSupply:"sea",siting:"fringe",
    label:"Salt pans",scope:{years:[1200,1950],bounds:[-161,18.5,-154,22.5]},frame:"worksite-saltpans-pacific",
    outbuilding:{frame:"worksite-store-pacific",label:"Salt store"},supplies:salt,
    sources:["https://en.wikipedia.org/wiki/Hanapepe,_Hawaii"],
    note:"Seawater dried in clay-lined beds by the shore, as families still make paʻakai at Hanapēpē on Kauaʻi. The pans belonged to particular families."},
];

const sugarworks: WorksiteProfile[] = [
  {...common,id:"caribbean-sugar-works",kind:"sugarworks",roles:["sugar-boiler"],siting:"fringe",capacity:6,
    label:"Sugar mill and boiling house",scope:{years:[1640,1880],bounds:[-86,10,-59,24]},frame:"worksite-sugarworks-colonial",
    outbuilding:{frame:"worksite-adobe-store",label:"Curing house"},supplies:cane,
    sources:["https://en.wikipedia.org/wiki/Sugar_plantations_in_the_Caribbean"],
    note:"An animal-driven three-roller mill and a boiling house with its copper train and chimney. On Caribbean estates this work was done by enslaved Africans until emancipation (1834 to 1886, by colony); the yard is reconstructed, not a surveyed estate."},
  {...common,id:"brazilian-engenho",kind:"sugarworks",roles:["sugar-boiler"],siting:"fringe",capacity:6,
    label:"Engenho (sugar mill)",scope:{years:[1550,1888],bounds:[-52,-24,-34,-3]},frame:"worksite-sugarworks-colonial",
    outbuilding:{frame:"worksite-adobe-store",label:"Purging house"},supplies:cane,
    sources:["https://en.wikipedia.org/wiki/Engenho"],
    note:"The engenho's mill and boiling house, the centre of north-eastern Brazil's sugar economy. Its labour was enslaved, first Indigenous and then African, until abolition in 1888."},
  {...common,id:"hawaiian-sugar-mill",kind:"sugarworks",roles:["sugar-boiler"],siting:"fringe",capacity:6,
    label:"Sugar mill and boiling house",scope:{years:[1835,1950],bounds:[-161,18.5,-154,22.5]},frame:"worksite-sugarworks-colonial",
    outbuilding:{frame:"worksite-brick-store",label:"Sugar store"},supplies:cane,
    sources:["https://en.wikipedia.org/wiki/Sugar_plantations_in_Hawaii"],
    note:"Plantation sugar on Hawaiʻi began at Kōloa in 1835 and grew on contract labour from China, Japan, Portugal and the Philippines. This small mill stands for the early works, not the later steam factories."},
  {...common,id:"indian-gur-works",kind:"sugarworks",roles:["sugar-boiler"],siting:"fringe",
    label:"Cane press and gur hearth",scope:{years:[300,1950],bounds:SOUTH_ASIA},frame:"worksite-sugarworks-india",
    outbuilding:{frame:"worksite-store-india",label:"Gur store"},supplies:cane,
    sources:["https://en.wikipedia.org/wiki/Jaggery"],
    note:"Cane crushed in a roller press and the juice boiled down in wide pans to gur (jaggery). India is where sugar was first crystallised; most of it was made like this, in the village, after the harvest."},
  {...common,id:"chinese-sugar-works",kind:"sugarworks",roles:["sugar-boiler"],siting:"fringe",
    label:"Cane press and sugar hearth",scope:{years:[1000,1950],bounds:[104,18,122,27]},frame:"worksite-sugarworks-sinitic",
    outbuilding:{frame:"worksite-eastasian-store",label:"Sugar store"},supplies:cane,
    sources:["https://en.wikipedia.org/wiki/Tiangong_Kaiwu"],
    note:"Two or three upright rollers turned by an ox, and a row of pans for boiling, as the Tiangong Kaiwu illustrates for Fujian and Guangdong. Fujianese sugar was carried to Taiwan in the seventeenth century."},
];

const oilpresses: WorksiteProfile[] = [
  {...common,id:"mediterranean-olive-mill",kind:"oilpress",roles:["oil-presser"],siting:"fringe",
    label:"Olive mill and press",scope:{years:[-800,1950],bounds:[-10,30,30,46]},frame:"worksite-oilpress-mediterranean",
    outbuilding:{frame:"worksite-masonry-store",label:"Oil store"},supplies:oil,
    sources:["https://en.wikipedia.org/wiki/Olive_oil_extraction"],
    note:"An edge-runner stone crushes the olives in a round basin; the paste is pressed in stacked baskets under a weighted lever. Both machines are known from the classical Mediterranean and stayed in use for two thousand years."},
  {...common,id:"levantine-olive-press",kind:"oilpress",roles:["oil-presser"],siting:"fringe",
    label:"Olive press",scope:{years:[-1200,1950],bounds:[30,29,40,38]},frame:"worksite-oilpress-levant",
    outbuilding:{frame:"worksite-masonry-store",label:"Oil store"},supplies:oil,
    sources:["https://en.wikipedia.org/wiki/Tel_Miqne"],
    note:"A crushing basin and lever-and-weight press, the arrangement excavated by the hundred at Iron Age Ekron (Tel Miqne). The olive oil of Palestine and Syria was also boiled into Nablus soap."},
  {...common,id:"indian-ghani",kind:"oilpress",roles:["oil-presser"],siting:"fringe",
    label:"Oil mill (ghani)",scope:{years:[-200,1950],bounds:SOUTH_ASIA},frame:"worksite-oilpress-india",
    outbuilding:{frame:"worksite-store-india",label:"Seed and oil store"},supplies:oil,
    sources:["https://en.wikipedia.org/wiki/Teli"],
    note:"A bullock walks round a deep wooden mortar, dragging the pestle that grinds mustard, sesame or linseed. The oil pressers (Teli) were a caste of their own across northern India."},
  {...common,id:"west-african-palm-oil",kind:"oilpress",roles:["oil-presser"],siting:"fringe",
    label:"Palm-oil yard",scope:{years:[800,1950],bounds:[-14,4,12,10]},frame:"worksite-oilpress-westafrica",
    outbuilding:{frame:"worksite-store-westafrica",label:"Oil store"},supplies:oil,
    sources:["https://en.wikipedia.org/wiki/Palm_oil"],
    note:"Palm fruit boiled in large pots and pounded in a trough to free the oil, mostly women's work. After 1807 palm oil became West Africa's great export to industrial Britain."},
];

const forges: WorksiteProfile[] = [
  {...common,id:"west-african-bloomery",kind:"forge",roles:["smith","blacksmith","ironworker","bronze-caster"],essential:true,siting:"urban",
    label:"Smithy and smelting furnace",scope:{years:[-500,1920],bounds:WEST_AFRICA},frame:"worksite-forge-westafrica",
    outbuilding:{frame:"worksite-store-westafrica",label:"Charcoal and ore store"},supplies:iron,
    sources:["https://en.wikipedia.org/wiki/Iron_metallurgy_in_Africa"],
    note:"A clay shaft furnace with tuyeres round its base, blown by pot bellows, beside the smith's anvil. Iron was smelted this way in West Africa from the first millennium BCE; smiths often formed a distinct, respected and feared group."},
  {...common,id:"indian-smithy",kind:"forge",roles:["smith","blacksmith","ironworker","bronze-caster"],essential:true,siting:"urban",
    label:"Smithy and smelting furnace",scope:{years:[-800,1900],bounds:SOUTH_ASIA},frame:"worksite-forge-india",
    outbuilding:{frame:"worksite-store-india",label:"Charcoal and iron store"},supplies:iron,
    sources:["https://en.wikipedia.org/wiki/Wootz_steel"],
    note:"A small clay furnace and a smith's hearth. South Indian smiths made crucible steel (wootz) that was traded as far as Damascus; most village smiths worked plain iron for tools."},
  {...common,id:"chinese-smithy",kind:"forge",roles:["smith","blacksmith","ironworker","bronze-caster"],essential:true,siting:"urban",
    label:"Smithy",scope:{years:[-300,1950],bounds:CHINA},frame:"worksite-forge-sinitic",
    outbuilding:{frame:"worksite-eastasian-store",label:"Iron and charcoal store"},supplies:iron,
    sources:["https://en.wikipedia.org/wiki/Tiangong_Kaiwu"],
    note:"A low hearth blown by the double-acting box bellows that Chinese smiths used for centuries, as the Tiangong Kaiwu shows. Cast iron came from blast furnaces elsewhere; the smith forged it."},
];

const glassworks: WorksiteProfile[] = [
  {...common,id:"european-glasshouse",kind:"glassworks",roles:["glassblower"],siting:"fringe",
    label:"Glasshouse",scope:{years:[1200,1900],bounds:EUROPE},frame:"worksite-glassworks-europe",
    outbuilding:{frame:"worksite-timber-store",label:"Sand, ash and fuel store"},supplies:[{prop:"woodpile",label:"Furnace fuel"},{prop:"crate",label:"Packed glassware"}],
    sources:["https://en.wikipedia.org/wiki/Murano_glass"],
    note:"A round furnace with its working holes and an annealing oven beside it. Venice moved its glassmakers to Murano in 1291; forest glasshouses in Bohemia and the Weald moved with their fuel."},
  {...common,id:"west-asian-glasshouse",kind:"glassworks",roles:["glassblower"],siting:"fringe",
    label:"Glasshouse",scope:{years:[700,1900],bounds:WEST_ASIA},frame:"worksite-glassworks-westasia",
    outbuilding:{frame:"worksite-masonry-store",label:"Sand, ash and fuel store"},supplies:[{prop:"woodpile",label:"Furnace fuel"},{prop:"crate",label:"Packed glassware"}],
    sources:["https://en.wikipedia.org/wiki/Islamic_glass","https://en.wikipedia.org/wiki/Hebron_glass"],
    note:"A domed furnace and annealing oven. Syria and Egypt made the finest glass of the medieval world; Hebron's glassblowers kept the craft into modern times."},
];

const weaving: WorksiteProfile[] = [
  {...common,id:"indian-weavers-shed",kind:"weaving",roles:["weaver"],essential:true,siting:"fringe",
    label:"Weavers' shed",scope:{years:[500,1950],bounds:SOUTH_ASIA},frame:"worksite-weaving-india",
    outbuilding:{frame:"worksite-store-india",label:"Yarn store"},supplies:[{prop:"bench",label:"Warping frame"},{prop:"liddedBasket",label:"Spun yarn"}],
    sources:["https://en.wikipedia.org/wiki/Dhaka_muslin"],
    note:"Pit looms under an open roof and a warp laid out along the ground outside. Indian cotton cloth, from Bengal muslin to Coromandel chintz, clothed much of the world before 1800."},
  {...common,id:"west-african-strip-looms",kind:"weaving",roles:["weaver"],essential:true,siting:"fringe",
    label:"Strip-loom weavers' shed",scope:{years:[1000,1950],bounds:WEST_AFRICA},frame:"worksite-weaving-westafrica",
    outbuilding:{frame:"worksite-store-westafrica",label:"Yarn store"},supplies:[{prop:"bench",label:"Loom bench"},{prop:"liddedBasket",label:"Spun cotton"}],
    sources:["https://en.wikipedia.org/wiki/Kente_cloth"],
    note:"Narrow treadle looms weaving long strips that are later sewn edge to edge, the warp stretched far out in front to a weighted sledge. Strip cloth was currency as well as clothing in parts of the Sahel."},
];

export const craftProfiles: readonly WorksiteProfile[] = [...saltworks, ...sugarworks, ...oilpresses, ...forges, ...glassworks, ...weaving];
