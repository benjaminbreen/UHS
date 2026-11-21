import type { WorksiteProfile } from "./types";

// Bounds: west, south, east, north.
const EUROPE = [-11,36,30,61] as const, SOUTH_ASIA = [66,6,92,34] as const, CHINA = [98,18,123,42] as const;
const EAST_ASIA = [98,18,146,44] as const, MESOAMERICA = [-106,14,-86,23] as const, ANDES = [-80,-22,-64,2] as const;
const WEST_AFRICA = [-18,4,16,16] as const, WEST_ASIA = [30,24,63,42] as const;
const common = { revision: 2, basis: "reconstructed", capacity: 3 } as const;
const salt = [{prop:"liddedBasket",label:"Baskets of dried salt"},{prop:"crate",label:"Salt-raking tools"}];
const iron = [{prop:"woodpile",label:"Charcoal and fuel"},{prop:"bench",label:"Smith's bench"}];
const oil = [{prop:"pot",label:"Oil jars"},{prop:"crate",label:"Press bags and baskets"}];
const cane = [{prop:"woodpile",label:"Cut cane and bagasse fuel"},{prop:"pot",label:"Sugar moulds"}];
const timber = [{prop:"woodpile",label:"Seasoned timber"},{prop:"crate",label:"Joiner's tools"}];
const stone = [{prop:"fieldStone",label:"Rough quarry blocks"},{prop:"crate",label:"Chisels and mallets"}];
const brew = [{prop:"grainSacks",label:"Malted grain"},{prop:"barrel",label:"Brewing casks"}];
const paper = [{prop:"crate",label:"Stacked paper reams"},{prop:"washTub",label:"Pulp rinsing tub"}];
const rope = [{prop:"crate",label:"Spun hemp yarn"},{prop:"barrel",label:"Pine tar cask"}];
const bronze = [{prop:"woodpile",label:"Furnace charcoal"},{prop:"crate",label:"Casting moulds and copper"}];
const soap = [{prop:"pot",label:"Olive oil jars"},{prop:"crate",label:"Cured soap bars"}];
const silk = [{prop:"liddedBasket",label:"Mulberry leaves and cocoons"},{prop:"crate",label:"Raw silk skeins"}];
const charcoal = [{prop:"woodpile",label:"Split cordwood"},{prop:"crate",label:"Charcoal sacks"}];

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
  {...common,id:"west-asian-smithy",kind:"forge",roles:["smith","blacksmith","ironworker","bronze-caster"],essential:true,siting:"urban",
    label:"Smithy and foundry",scope:{years:[-500,1920],bounds:WEST_ASIA},frame:"worksite-forge-europe",
    outbuilding:{frame:"worksite-masonry-store",label:"Charcoal and iron store"},supplies:iron,
    sources:["https://en.wikipedia.org/wiki/Damascus_steel"],
    note:"A hearth and anvil yard working imported crucible steel and wrought iron into blades, ploughshares, and hardware. West Asian metalworkers clustered in dedicated bazaar quarters."},
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
  {...common,id:"mesoamerican-weavers-yard",kind:"weaving",roles:["weaver"],essential:true,siting:"urban",
    label:"Weavers' courtyard",scope:{years:[-500,1950],bounds:MESOAMERICA},frame:"worksite-store-meso",
    outbuilding:{frame:"worksite-adobe-store",label:"Dyed yarn store"},supplies:[{prop:"liddedBasket",label:"Cochineal-dyed yarn"},{prop:"pot",label:"Dye jars"}],
    sources:["https://en.wikipedia.org/wiki/Oaxacan_textiles"],
    note:"An open adobe courtyard where cotton and wool are warped, dyed with cochineal and indigo, and woven on backstrap and treadle looms. In Oaxaca and central Mexico, woven cloth served as tribute, market staple, and ceremonial dress."},
  {...common,id:"andean-weavers-yard",kind:"weaving",roles:["weaver"],essential:true,siting:"urban",
    label:"Weavers' yard",scope:{years:[-500,1950],bounds:ANDES},frame:"worksite-store-andes",
    outbuilding:{frame:"worksite-adobe-store",label:"Wool and dye store"},supplies:[{prop:"liddedBasket",label:"Spun alpaca and cotton"},{prop:"pot",label:"Dye pots"}],
    sources:["https://en.wikipedia.org/wiki/Andean_textiles"],
    note:"A sheltered courtyard for spinning camelid wool and weaving patterned cloth on staked and upright looms. Fine textiles carried political rank across the Andes from Tiwanaku through Inca and colonial obrajes."},
];

const carpentry: WorksiteProfile[] = [
  {...common,id:"european-carpentry-yard",kind:"carpentry",roles:["carpenter","cooper","wheelwright"],siting:"fringe",
    label:"Carpenter's and wheelwright's yard",scope:{years:[800,1940],bounds:EUROPE},frame:"worksite-timber-store",
    outbuilding:{frame:"worksite-timber-store",label:"Timber drying shed"},supplies:timber,
    sources:["https://en.wikipedia.org/wiki/Wheelwright"],
    note:"An open timber yard for seasoning planks, hewing beams, hooping casks, and assembling spoked cartwheels. Carpenters, coopers, and wheelwrights worked outdoors whenever the weather held."},
  {...common,id:"east-asian-carpentry-yard",kind:"carpentry",roles:["carpenter","cooper","wheelwright"],siting:"fringe",
    label:"Timber and joinery yard",scope:{years:[600,1940],bounds:EAST_ASIA},frame:"worksite-eastasian-store",
    outbuilding:{frame:"worksite-eastasian-store",label:"Seasoned cedar shed"},supplies:timber,
    sources:["https://en.wikipedia.org/wiki/Japanese_carpentry"],
    note:"A timber yard where beams, floorboards, and wooden tubs are planed and mortised without iron nails. Joiners and coopers stacked seasoned cypress and cedar beside their benches."},
];

const stoneworks: WorksiteProfile[] = [
  {...common,id:"european-masons-yard",kind:"stoneworks",roles:["mason","stonemason"],siting:"fringe",
    label:"Stonemason's yard",scope:{years:[800,1940],bounds:EUROPE},frame:"worksite-masonry-store",
    outbuilding:{frame:"worksite-timber-store",label:"Tool and template lodge"},supplies:stone,
    sources:["https://en.wikipedia.org/wiki/Stonemasonry"],
    note:"A mason's banker yard strewn with stone chips where rough quarry blocks are squared with chisels, mallets, and wooden templates before going to the scaffold."},
  {...common,id:"west-asian-masons-yard",kind:"stoneworks",roles:["mason","stonemason"],siting:"fringe",
    label:"Stone-carving yard",scope:{years:[-800,1940],bounds:WEST_ASIA},frame:"worksite-masonry-store",
    outbuilding:{frame:"worksite-adobe-store",label:"Mortar and tool store"},supplies:stone,
    sources:["https://en.wikipedia.org/wiki/Ashlar"],
    note:"An open yard for dressing limestone and sandstone ashlar blocks, lintels, and column drums for mosques, khans, and civic walls."},
];

const brewhouses: WorksiteProfile[] = [
  {...common,id:"european-brewhouse",kind:"brewhouse",roles:["brewer","baker"],siting:"urban",
    label:"Brewhouse and bakehouse yard",scope:{years:[900,1940],bounds:EUROPE},frame:"worksite-timber-store",
    outbuilding:{frame:"worksite-masonry-store",label:"Malt and cask store"},supplies:brew,
    sources:["https://en.wikipedia.org/wiki/History_of_beer"],
    note:"A yard beside the brew-kettle and bake-oven where malted grain is mashed in wooden tuns, racked into oak barrels, and stacked in sacks for the town's daily ale and bread."},
];

const papermills: WorksiteProfile[] = [
  {...common,id:"east-asian-papermill",kind:"papermill",roles:["scribe","printer"],waterSupply:true,siting:"waterside",
    label:"Papermaking yard",scope:{years:[100,1940],bounds:EAST_ASIA},frame:"worksite-eastasian-store",
    outbuilding:{frame:"worksite-eastasian-store",label:"Bark and paper store"},supplies:paper,
    sources:["https://en.wikipedia.org/wiki/Washi","https://en.wikipedia.org/wiki/History_of_paper"],
    note:"Inner mulberry and bamboo bast boiled, beaten into pulp, lifted on bamboo screens, and brushed onto slanted pine boards to dry in the sun. East Asian papermakers supplied state offices, monasteries, and woodblock printers."},
  {...common,id:"islamic-papermill",kind:"papermill",roles:["scribe"],waterSupply:true,siting:"waterside",
    label:"Paper yard and beating trough",scope:{years:[750,1940],bounds:[30,24,72,43]},frame:"worksite-masonry-store",
    outbuilding:{frame:"worksite-adobe-store",label:"Rag and paper store"},supplies:paper,
    sources:["https://en.wikipedia.org/wiki/Samarkand_paper"],
    note:"Linen and hemp rags retted, pounded in stone troughs, dipped in vats, and hung to dry in sheets before burnishing with agate. Samarkand, Baghdad, and Damascus carried papermaking across the Islamic world."},
  {...common,id:"european-papermill",kind:"papermill",roles:["printer","scribe"],waterSupply:true,siting:"waterside",
    label:"Paper mill and drying yard",scope:{years:[1250,1900],bounds:EUROPE},frame:"worksite-timber-store",
    outbuilding:{frame:"worksite-masonry-store",label:"Rag loft and paper store"},supplies:paper,
    sources:["https://en.wikipedia.org/wiki/Fabriano_paper"],
    note:"A rag-paper yard with its dipping vat, wooden screw press squeezing wet sheets between woolen felts, and open drying rails. Fabriano, Amalfi, and Dutch mills made the paper that powered Europe's printing presses."},
];

const ropewalks: WorksiteProfile[] = [
  {...common,id:"european-ropewalk",kind:"ropewalk",roles:["rope-maker","cordage-maker"],waterSupply:true,siting:"fringe",
    label:"Ropewalk and cordage yard",scope:{years:[1000,1940],bounds:EUROPE},frame:"worksite-timber-store",
    outbuilding:{frame:"worksite-timber-store",label:"Hemp and tar store"},supplies:rope,
    sources:["https://en.wikipedia.org/wiki/Ropewalk"],
    note:"A long open stake-line where combed hemp is spun from a spoked wheel into multi-strand hawsers and dipped in hot pine tar for ships' rigging and river barges."},
  {...common,id:"east-asian-ropewalk",kind:"ropewalk",roles:["rope-maker","cordage-maker"],waterSupply:true,siting:"fringe",
    label:"Cordage and cable yard",scope:{years:[500,1940],bounds:EAST_ASIA},frame:"worksite-eastasian-store",
    outbuilding:{frame:"worksite-eastasian-store",label:"Hemp and bamboo fiber store"},supplies:rope,
    sources:["https://en.wikipedia.org/wiki/Rope"],
    note:"An open twisting yard laying hemp, palm coir, and split bamboo fiber into heavy tow-ropes, anchor cables, and fishing lines."},
  {...common,id:"south-asian-ropewalk",kind:"ropewalk",roles:["rope-maker","cordage-maker"],waterSupply:true,siting:"fringe",
    label:"Coir ropewalk",scope:{years:[200,1940],bounds:SOUTH_ASIA},frame:"worksite-store-india",
    outbuilding:{frame:"worksite-store-india",label:"Coir fiber store"},supplies:rope,
    sources:["https://en.wikipedia.org/wiki/Coir"],
    note:"Retted coconut husk fiber spun and laid into salt-resistant coir cables and stitching cordage for Indian Ocean dhows and coastal craft."},
];

const foundries: WorksiteProfile[] = [
  {...common,id:"west-african-bronze-foundry",kind:"foundry",roles:["bronze-caster"],siting:"urban",
    label:"Brass and bronze foundry",scope:{years:[900,1900],bounds:WEST_AFRICA},frame:"worksite-store-westafrica",
    outbuilding:{frame:"worksite-store-westafrica",label:"Wax, clay and brass store"},supplies:bronze,
    sources:["https://en.wikipedia.org/wiki/Benin_Bronzes"],
    note:"A guild casting yard melting copper and brass ingots in clay furnaces for lost-wax plaques, bells, and ceremonial vessels, as practised at Ife, Igbo-Ukwu, and Benin City."},
  {...common,id:"east-asian-bronze-foundry",kind:"foundry",roles:["bronze-caster"],siting:"fringe",
    label:"Bronze and bell foundry",scope:{years:[-1500,1940],bounds:EAST_ASIA},frame:"worksite-eastasian-store",
    outbuilding:{frame:"worksite-eastasian-store",label:"Clay mould and ingot store"},supplies:bronze,
    sources:["https://en.wikipedia.org/wiki/Chinese_ritual_bronzes"],
    note:"A sand-pit and clay-mould foundry casting bronze temple bells, incense cauldrons, mirrors, and coinage."},
  {...common,id:"european-bell-foundry",kind:"foundry",roles:["bronze-caster"],siting:"fringe",
    label:"Bell and bronze foundry",scope:{years:[800,1940],bounds:EUROPE},frame:"worksite-masonry-store",
    outbuilding:{frame:"worksite-timber-store",label:"Copper, tin and loam store"},supplies:bronze,
    sources:["https://en.wikipedia.org/wiki/Bell_founding"],
    note:"A casting yard building loam-and-clay bell moulds, smelting bell-metal bronze, and finishing church bells, mortars, and ordnance."},
  {...common,id:"west-asian-metal-foundry",kind:"foundry",roles:["bronze-caster"],siting:"fringe",
    label:"Brass and bronze foundry",scope:{years:[-2000,1940],bounds:WEST_ASIA},frame:"worksite-masonry-store",
    outbuilding:{frame:"worksite-adobe-store",label:"Ingot and crucible store"},supplies:bronze,
    sources:["https://en.wikipedia.org/wiki/Islamic_metalwork"],
    note:"A metal-casting yard pouring brass ewers, basins, astrolabe plates, and candlesticks for urban workshops."},
  {...common,id:"south-asian-bronze-foundry",kind:"foundry",roles:["bronze-caster"],siting:"fringe",
    label:"Lost-wax bronze foundry",scope:{years:[-500,1940],bounds:SOUTH_ASIA},frame:"worksite-store-india",
    outbuilding:{frame:"worksite-store-india",label:"Wax and metal store"},supplies:bronze,
    sources:["https://en.wikipedia.org/wiki/Chola_art_and_architecture"],
    note:"A lost-wax casting yard shaping clay-jacketed moulds for temple lamps, ritual vessels, and bronze sculptures."},
];

const soapworks: WorksiteProfile[] = [
  {...common,id:"levantine-soapworks",kind:"soapworks",roles:["soap-boiler"],siting:"fringe",
    label:"Olive-oil soapworks",scope:{years:[900,1950],bounds:[30,29,44,38]},frame:"worksite-masonry-store",
    outbuilding:{frame:"worksite-masonry-store",label:"Oil and alkali ash store"},supplies:soap,
    sources:["https://en.wikipedia.org/wiki/Nablus_soap","https://en.wikipedia.org/wiki/Aleppo_soap"],
    note:"Olive oil and laurel oil boiled with desert barilla ash, poured onto a stone floor to be scored into cubes, and cross-stacked in hollow curing towers, as in Nablus, Aleppo, and Damascus."},
  {...common,id:"mediterranean-soapworks",kind:"soapworks",roles:["soap-boiler"],siting:"fringe",
    label:"Soapworks and curing yard",scope:{years:[1100,1940],bounds:[-8,35,20,45]},frame:"worksite-masonry-store",
    outbuilding:{frame:"worksite-masonry-store",label:"Olive oil and barilla store"},supplies:soap,
    sources:["https://en.wikipedia.org/wiki/Marseille_soap","https://en.wikipedia.org/wiki/Castile_soap"],
    note:"Cauldrons of olive oil and soda ash poured into cutting beds and stacked in open air to cure into hard white Castile and Marseille soap."},
];

const sericulture: WorksiteProfile[] = [
  {...common,id:"east-asian-sericulture",kind:"sericulture",roles:["silk-farmer"],siting:"fringe",
    label:"Sericulture and silk-reeling yard",scope:{years:[-500,1940],bounds:EAST_ASIA},frame:"worksite-eastasian-store",
    outbuilding:{frame:"worksite-eastasian-store",label:"Mulberry and cocoon shed"},supplies:silk,
    sources:["https://en.wikipedia.org/wiki/Sericulture"],
    note:"Bamboo rearing trays of mulberry leaves and white cocoons beside simmering reeling basins and wooden swifts drawing continuous raw-silk thread."},
  {...common,id:"persian-sericulture",kind:"sericulture",roles:["silk-farmer"],siting:"fringe",
    label:"Silk-reeling yard",scope:{years:[600,1940],bounds:[44,28,63,41]},frame:"worksite-adobe-store",
    outbuilding:{frame:"worksite-masonry-store",label:"Cocoon and raw-silk store"},supplies:silk,
    sources:["https://en.wikipedia.org/wiki/Silk_production_in_Iran"],
    note:"A courtyard of cocoon trays, boiling kettles, and reeling wheels turning Caspian and highland mulberry silk into skeins for Safavid and regional looms."},
  {...common,id:"italian-sericulture",kind:"sericulture",roles:["silk-farmer"],siting:"fringe",
    label:"Silk-reeling courtyard",scope:{years:[1200,1940],bounds:[6,38,16,46.5]},frame:"worksite-masonry-store",
    outbuilding:{frame:"worksite-timber-store",label:"Cocoon drying loft"},supplies:silk,
    sources:["https://en.wikipedia.org/wiki/Silk_industry_of_Lucca"],
    note:"Open-air cocoon basins and wooden reeling swifts supplying raw silk thread to the weaving cities of northern Italy."},
  {...common,id:"bengal-sericulture",kind:"sericulture",roles:["silk-farmer"],siting:"fringe",
    label:"Silk-reeling yard",scope:{years:[500,1940],bounds:[82,20,92,27]},frame:"worksite-store-india",
    outbuilding:{frame:"worksite-store-india",label:"Cocoon and yarn store"},supplies:silk,
    sources:["https://en.wikipedia.org/wiki/Murshidabad_silk"],
    note:"Woven trays of golden and white cocoons boiled in clay basins and reeled onto bamboo swifts for Bengal's silk trade."},
];

const charcoalYards: WorksiteProfile[] = [
  {...common,id:"european-charcoal-yard",kind:"charcoal",roles:["charcoal-burner","sawyer","woodcutter"],siting:"fringe",
    label:"Charcoal-burner's and sawyer's yard",scope:{years:[-500,1920],bounds:EUROPE},frame:"worksite-timber-store",
    outbuilding:{frame:"worksite-timber-store",label:"Charcoal and plank shed"},supplies:charcoal,
    sources:["https://en.wikipedia.org/wiki/Charcoal_burner"],
    note:"Turf-covered charcoal clamps smouldering slowly beside timber saw-trestles and stacked billets, supplying smithies, bakers, and builders."},
  {...common,id:"east-asian-charcoal-yard",kind:"charcoal",roles:["charcoal-burner","sawyer","woodcutter"],siting:"fringe",
    label:"Charcoal and timber-sawing yard",scope:{years:[200,1940],bounds:EAST_ASIA},frame:"worksite-eastasian-store",
    outbuilding:{frame:"worksite-eastasian-store",label:"Charcoal and board store"},supplies:charcoal,
    sources:["https://en.wikipedia.org/wiki/Binch%C5%8Dtan"],
    note:"Smouldering earth-covered kilns firing oak charcoal for braziers and forges beside open saw-trestles ripping fresh cedar logs."},
  {...common,id:"mesoamerican-charcoal-yard",kind:"charcoal",roles:["charcoal-burner","sawyer","woodcutter"],siting:"fringe",
    label:"Charcoal and timber yard",scope:{years:[-500,1940],bounds:MESOAMERICA},frame:"worksite-store-meso",
    outbuilding:{frame:"worksite-adobe-store",label:"Charcoal and wood store"},supplies:charcoal,
    sources:["https://en.wikipedia.org/wiki/Charcoal"],
    note:"Earth-banked charcoal mounds and split-wood stacks supplying highland kitchens, lime kilns, and metalworkers."},
];

export const craftProfiles: readonly WorksiteProfile[] = [
  ...saltworks, ...sugarworks, ...oilpresses, ...forges, ...glassworks, ...weaving,
  ...carpentry, ...stoneworks, ...brewhouses,
  ...papermills, ...ropewalks, ...foundries, ...soapworks, ...sericulture, ...charcoalYards,
];
