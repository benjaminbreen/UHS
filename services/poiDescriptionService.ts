/**
 * services/poiDescriptionService.ts - Procedural description generation for POI interactions
 */
import { TerrainStructure, BiomeType, HistoricalEra } from '../types';
import { CulturalZone } from '../types/characterData';

export interface POIDescriptionTemplate {
  type: 'mine' | 'quarry' | 'mill' | 'factory' | 'fortress' | 'woodcutter';
  culturalZone: CulturalZone;
  era: HistoricalEra;
  templates: {
    setting: string[];      // Base location description
    materials: string[];    // What's being processed
    atmosphere: string[];   // Environmental details
    workers: string[];      // NPC descriptions
    approach: string[];     // How the place looks as you arrive
  };
}

export interface POIContext {
  materialType: string;
  biomeType: BiomeType;
  terrain: string;
  workerType: string;
  clothing: string;
  color: string;
  tools: string[];
}

// Description templates organized by culture/era/type
const DESCRIPTION_TEMPLATES: POIDescriptionTemplate[] = [
  // North America - Antiquity
  {
    type: 'quarry',
    culturalZone: 'North America',
    era: HistoricalEra.ANTIQUITY,
    templates: {
      setting: [
        "This {materialType} quarry, nestled amid {biomeDescription}, is a series of trenches dug into the {terrain}",
        "A {materialType} extraction site carved into the {terrain}, surrounded by {biomeDescription}",
        "Ancient workings where {materialType} is carefully extracted from the {terrain}",
        "Sacred stone workings cut deep into the {terrain}, where {materialType} has been gathered for generations"
      ],
      materials: [
        "Glittering flakes of {materialType} are everywhere, and the {color} rock can be seen jutting from the ground",
        "Scattered {materialType} fragments catch the light, revealing veins of {color} stone beneath",
        "Fresh cuts in the rock expose rich deposits of {materialType}, gleaming {color} in the sunlight",
        "The earth here is littered with {color} chips of {materialType}, evidence of skilled workmanship"
      ],
      atmosphere: [
        "The sound of stone-on-stone echoes across the worksite",
        "Dust motes dance in shafts of sunlight filtering through the canopy",
        "The air is thick with rock dust and the earthy scent of disturbed soil",
        "A rhythmic tapping sound carries on the wind as workers shape the stone"
      ],
      workers: [
        "A skilled {workerType} wearing {clothing} looks up at you as you approach",
        "Several {workerType}s pause their work to observe your arrival with curious eyes",
        "An elderly {workerType} in weathered {clothing} nods respectfully in greeting",
        "A {workerType} carefully examines a piece of {materialType}, then glances your way"
      ],
      approach: [
        "You notice tool marks and scattered stone chips leading to the quarry",
        "The path here is well-worn by countless feet carrying loads of stone",
        "Piles of sorted {materialType} indicate this is an active and organized operation",
        "Stone cairns mark the way to this important source of {materialType}"
      ]
    }
  },
  {
    type: 'mine',
    culturalZone: 'North America',
    era: HistoricalEra.ANTIQUITY,
    templates: {
      setting: [
        "A {materialType} mine carved into the {terrain}, where tunnels disappear into the earth",
        "This ancient {materialType} working consists of several shafts descending into the {terrain}",
        "A network of {materialType} extraction sites, with fresh earth piled beside dark openings",
        "Sacred earth-wounds where the ancestors first discovered {materialType} beneath the {terrain}"
      ],
      materials: [
        "Rich veins of {materialType} streak the exposed rock faces in bands of {color}",
        "Baskets filled with raw {materialType} sit ready for processing, the {color} ore gleaming",
        "The telltale {color} staining of {materialType} marks the walls of the excavation",
        "Chunks of {materialType}-bearing rock lie sorted by color and quality"
      ],
      atmosphere: [
        "The earthy smell of deep soil mingles with the metallic scent of {materialType}",
        "Water seeps from some of the tunnels, forming small pools that reflect the sky",
        "The ground trembles slightly as workers extract ore from deep within",
        "Smoke rises from small fires used to heat and work the {materialType}"
      ],
      workers: [
        "A weathered {workerType} emerges from a tunnel, hands stained {color} from handling the ore",
        "An experienced {workerType} in {clothing} tests the quality of freshly extracted {materialType}",
        "Several {workerType}s work together, their {clothing} marked with the dust of their labor",
        "A young {workerType} learning the trade watches as elders demonstrate proper technique"
      ],
      approach: [
        "The path is marked by ore carts and the tracks of many workers",
        "Discarded rock and tailings form distinctive piles around the workings",
        "You can hear the sounds of digging and the clink of metal on stone",
        "A well-established camp surrounds the mine, with shelters and work areas"
      ]
    }
  },
  // Europe - Antiquity
  {
    type: 'quarry',
    culturalZone: 'Europe',
    era: HistoricalEra.ANTIQUITY,
    templates: {
      setting: [
        "This Roman {materialType} quarry stretches across the {terrain} in organized terraces",
        "A well-engineered {materialType} extraction site carved systematically into the {terrain}",
        "Imperial stoneworks where {materialType} is quarried with military precision from the {terrain}",
        "Ancient quarry operations, their {materialType} blocks destined for great constructions"
      ],
      materials: [
        "Precisely cut blocks of {materialType} are stacked in neat rows, the {color} stone perfectly squared",
        "The quarry face reveals layers of {color} {materialType}, each stratum carefully mapped",
        "Finished {materialType} blocks bear the marks of skilled Roman masons, ready for transport",
        "Raw {materialType} and finished stones create a landscape of {color} geometric forms"
      ],
      atmosphere: [
        "The crack of chisel on stone rings out in steady rhythm across the quarry",
        "Dust clouds rise as massive blocks are split and moved by teams of workers",
        "The organized bustle of Roman engineering fills the air with purpose",
        "Cart wheels creak as they transport heavy loads of {materialType} along stone roads"
      ],
      workers: [
        "A Roman {workerType} in practical {clothing} supervises the cutting of a massive block",
        "Skilled {workerType}s work alongside slaves, all focused on extracting perfect {materialType}",
        "A weathered {workerType} wearing {clothing} examines the quality of freshly cut stone",
        "Teams of {workerType}s coordinate to move heavy blocks using ropes and wooden levers"
      ],
      approach: [
        "Roman roads lead directly to the quarry, built to handle heavy stone transport",
        "Engineering works - ramps, pulleys, and derricks - mark this as a major operation",
        "Stone markers indicate different grades and destinations for the {materialType}",
        "The systematic organization reveals the hand of Roman planning"
      ]
    }
  },
  // Medieval Europe
  {
    type: 'mill',
    culturalZone: 'Europe',
    era: HistoricalEra.MEDIEVAL,
    templates: {
      setting: [
        "This watermill, positioned beside a swift stream, processes {materialType} with the power of flowing water",
        "A sturdy stone mill building straddles a brook, its wheel turning steadily to grind {materialType}",
        "The mill's wooden wheel churns constantly, powered by the {terrain}'s natural waters",
        "A well-built mill complex where {materialType} is transformed by water-driven millstones"
      ],
      materials: [
        "Sacks of {materialType} await processing, while fine {color} flour dusts every surface",
        "The distinctive {color} powder of ground {materialType} coats the mill's interior",
        "Fresh {materialType} and finished meal are sorted into different containers",
        "The sweet smell of {materialType} being processed fills the mill with its {color} dust"
      ],
      atmosphere: [
        "The constant rumble of the millwheel creates a steady, hypnotic rhythm",
        "Water splashes and gurgles as it powers the great wooden wheel",
        "The creak of wooden gears and the grinding of stone on stone fills the air",
        "Motes of {color} flour dance in beams of sunlight streaming through small windows"
      ],
      workers: [
        "The {workerType} wears {clothing} dusted with flour, checking the quality of the grind",
        "A skilled {workerType} in practical {clothing} adjusts the millstones for finer grinding",
        "The mill's {workerType} monitors the water flow while tending to customers' grain",
        "An experienced {workerType} wearing {clothing} tests the fineness of freshly ground {materialType}"
      ],
      approach: [
        "The sound of the waterwheel announces the mill long before you see it",
        "A well-worn path leads from the village to this essential community resource",
        "Carts loaded with grain and sacks of flour indicate regular commerce",
        "The mill race and dam works show careful engineering to harness water power"
      ]
    }
  },
  // Asia - Antiquity
  {
    type: 'quarry',
    culturalZone: 'Asia',
    era: HistoricalEra.ANTIQUITY,
    templates: {
      setting: [
        "This ancient {materialType} quarry follows the mountain's natural contours in the {terrain}",
        "Stone terraces carved by generations of workers extract {materialType} from the {terrain}",
        "A harmonious quarry operation where {materialType} is carefully removed respecting the mountain spirits"
      ],
      materials: [
        "Veins of {color} {materialType} run through the rock like frozen rivers",
        "The {materialType} here gleams with a {color} luster, prized for temple construction",
        "Carefully selected {materialType} blocks show the distinctive {color} patterns valued by artisans"
      ],
      atmosphere: [
        "The rhythmic chanting of workers accompanies the steady tap of hammers",
        "Incense burns at small shrines placed throughout the quarry",
        "The mountain echoes with the ancient songs of stone workers"
      ],
      workers: [
        "A {workerType} in {clothing} bows respectfully before addressing you",
        "The quarry's {workerType} sets down jade-tipped tools to greet you properly",
        "An experienced {workerType} wearing {clothing} offers you tea before discussing business"
      ],
      approach: [
        "Stone lanterns mark the path to this ancient quarry",
        "Carved steps wind up the mountainside to the extraction site",
        "Prayer flags flutter above piles of sorted {materialType}"
      ]
    }
  },
  {
    type: 'mill',
    culturalZone: 'Asia',
    era: HistoricalEra.MEDIEVAL,
    templates: {
      setting: [
        "This water-powered mill uses an ingenious horizontal wheel to process {materialType}",
        "A elegant mill building with upturned eaves spans a babbling brook, grinding {materialType}",
        "The mill's wooden mechanisms turn smoothly, powered by a diverted mountain stream"
      ],
      materials: [
        "Sacks of {materialType} are stacked neatly, while {color} powder dusts the millstones",
        "The sweet aroma of ground {materialType} fills the air with its {color} dust",
        "Fresh {materialType} arrives by ox-cart to be transformed into fine {color} meal"
      ],
      atmosphere: [
        "The gentle splash of the waterwheel mingles with the grinding of stones",
        "Birds nest in the eaves while the mill wheel turns in endless rhythm",
        "The mill keeper's cat sleeps peacefully despite the constant rumbling"
      ],
      workers: [
        "The {workerType} in {clothing} checks the grain quality with practiced expertise",
        "A diligent {workerType} wearing {clothing} maintains the complex gear mechanisms",
        "The mill's {workerType} proudly shows you the finely ground {materialType}"
      ],
      approach: [
        "A small bridge crosses the mill race leading to the entrance",
        "Cherry trees shade the path to this prosperous mill",
        "Stone markers indicate the mill's long history of honest dealings"
      ]
    }
  },
  // Africa - Medieval
  {
    type: 'mine',
    culturalZone: 'Africa',
    era: HistoricalEra.MEDIEVAL,
    templates: {
      setting: [
        "Deep shafts descend into the {terrain} where {materialType} has been extracted for centuries",
        "This {materialType} mine follows ancient traditions, with offerings to earth spirits at each entrance",
        "A complex of mining tunnels extends beneath the {terrain}, rich with {materialType} deposits"
      ],
      materials: [
        "The {color} gleam of {materialType} ore illuminates the tunnel walls",
        "Baskets of {materialType} bearing rock show rich {color} veins throughout",
        "Pure {materialType} nuggets glitter {color} in the lamplight"
      ],
      atmosphere: [
        "Drums echo through the tunnels, coordinating the work and honoring ancestors",
        "Smoke from protective herbs drifts through the mine shafts",
        "The earth hums with the energy of careful extraction"
      ],
      workers: [
        "A {workerType} marked with traditional {clothing} emerges from the depths",
        "The mine's {workerType} wears {clothing} blessed by the village elder",
        "Young {workerType}s learning the trade watch as masters demonstrate proper technique"
      ],
      approach: [
        "Carved totems protect the mine entrance from evil spirits",
        "The path is marked by stones painted with traditional symbols",
        "A sacred baobab tree shades the miners' rest area"
      ]
    }
  },
  {
    type: 'factory',
    culturalZone: 'Africa',
    era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
    templates: {
      setting: [
        "This workshop complex processes {materialType} using both traditional and imported techniques",
        "A bustling factory where {materialType} is transformed through skilled craftsmanship",
        "The manufacturing compound combines age-old methods with new innovations"
      ],
      materials: [
        "Raw {materialType} is sorted by quality, the {color} materials set aside for special orders",
        "Finished goods of {color} {materialType} await transport to distant markets",
        "The workshop produces fine {materialType} items renowned for their {color} finish"
      ],
      atmosphere: [
        "The compound resonates with hammering, cutting, and the songs of workers",
        "Apprentices learn their trade while masters oversee production",
        "The air is thick with the scent of worked {materialType} and burning charcoal"
      ],
      workers: [
        "The {workerType} in {clothing} demonstrates mastery of both old and new techniques",
        "A guild {workerType} wearing {clothing} inspects the quality of finished goods",
        "Skilled {workerType}s collaborate on a complex {materialType} commission"
      ],
      approach: [
        "The factory's reputation draws traders from across the continent",
        "Guard posts protect the valuable {materialType} inventory",
        "The compound entrance bears the marks of the craft guild"
      ]
    }
  },
  // Middle East - Various Eras
  {
    type: 'quarry',
    culturalZone: 'Middle East',
    era: HistoricalEra.ANTIQUITY,
    templates: {
      setting: [
        "This ancient {materialType} quarry has supplied pharaohs and kings from the {terrain}",
        "Massive {materialType} blocks are extracted from the {terrain} using bronze tools and clever engineering",
        "The desert {terrain} yields precious {materialType} under the scorching sun"
      ],
      materials: [
        "The {color} {materialType} here is prized for monumental construction",
        "Hieroglyphs mark the finest {color} {materialType} blocks for royal projects",
        "Veins of {materialType} run through the quarry face in bands of {color}"
      ],
      atmosphere: [
        "The desert heat shimmers off the exposed rock faces",
        "Workers sing ancient songs to maintain rhythm in the crushing heat",
        "The quarry bustles with activity in the cool morning hours"
      ],
      workers: [
        "An overseer {workerType} in {clothing} directs the extraction with military precision",
        "Skilled {workerType}s in {clothing} mark the stone for cutting",
        "The quarry {workerType} consults papyrus plans before ordering the next cut"
      ],
      approach: [
        "Ramps and sledges show how massive blocks are moved",
        "Water jars line the path for workers in the desert heat",
        "Hieroglyphic inscriptions record the quarry's ancient history"
      ]
    }
  },
  {
    type: 'mill',
    culturalZone: 'Middle East',
    era: HistoricalEra.MEDIEVAL,
    templates: {
      setting: [
        "This windmill harnesses desert breezes to grind {materialType} day and night",
        "An ingenious mill design uses both wind and animal power to process {materialType}",
        "The fortified mill serves the entire district, grinding {materialType} for the community"
      ],
      materials: [
        "Aromatic {materialType} fills sacks while {color} flour dusts every surface",
        "The mill produces the finest {color} flour from premium {materialType}",
        "Merchants haggle over the quality of ground {materialType} with its distinctive {color} hue"
      ],
      atmosphere: [
        "The mill's sails creak in the desert wind while stones grind below",
        "Calls to prayer echo across the mill yard five times daily",
        "The bustle of commerce fills the air as farmers bring their {materialType}"
      ],
      workers: [
        "The {workerType} in {clothing} ensures honest weights and measures",
        "A learned {workerType} wearing {clothing} calculates optimal grinding speeds",
        "The mill's {workerType} maintains both the mechanism and accounting ledgers"
      ],
      approach: [
        "Date palms provide shade for those waiting to use the mill",
        "A fountain offers refreshment to travelers and workers",
        "The mill's distinctive tower is visible from great distances"
      ]
    }
  },
  // Oceania - Various Eras
  {
    type: 'quarry',
    culturalZone: 'Oceania',
    era: HistoricalEra.ANTIQUITY,
    templates: {
      setting: [
        "This sacred {materialType} quarry on the {terrain} provides stone for ceremonial structures",
        "Island workers extract {materialType} from the {terrain} following ancestral protocols",
        "The coastal quarry yields {materialType} blessed by ocean spirits"
      ],
      materials: [
        "The volcanic {materialType} here has a distinctive {color} grain perfect for carving",
        "Sacred {color} {materialType} is reserved for important monuments",
        "Coral-encrusted {materialType} shows beautiful {color} patterns when polished"
      ],
      atmosphere: [
        "Ocean waves crash nearby as workers shape the stone",
        "Seabirds circle overhead while traditional songs guide the work",
        "The quarry is alive with the sound of stone on stone and ocean breezes"
      ],
      workers: [
        "A master {workerType} in {clothing} demonstrates the proper way to split stone",
        "The {workerType} wearing {clothing} performs rituals before each extraction",
        "Young {workerType}s learn the sacred aspects of working with {materialType}"
      ],
      approach: [
        "Tiki torches mark the path to this sacred site",
        "Shell offerings lie at the quarry entrance",
        "Ancient petroglyphs tell the story of the first stone workers"
      ]
    }
  },
  // South America - Various Eras
  {
    type: 'mine',
    culturalZone: 'South America',
    era: HistoricalEra.ANTIQUITY,
    templates: {
      setting: [
        "High in the {terrain}, this {materialType} mine follows veins deep into the mountain",
        "Sacred tunnels extract {materialType} from the living rock of the {terrain}",
        "The mine complex includes shrines to Pachamama who provides the {materialType}"
      ],
      materials: [
        "Rich deposits of {color} {materialType} sparkle in the torchlight",
        "The {materialType} here has a unique {color} quality prized by metalworkers",
        "Offerings of coca leaves lie beside piles of {color} {materialType} ore"
      ],
      atmosphere: [
        "The thin mountain air makes work difficult but the {materialType} is worth it",
        "Echoes of picks and hammers resonate through the ancient tunnels",
        "Llamas wait patiently to carry {materialType} down the mountain"
      ],
      workers: [
        "A {workerType} in traditional {clothing} makes offerings before entering the mine",
        "The mine's {workerType} wears {clothing} woven with protective symbols",
        "Experienced {workerType}s teach younger ones to respect the mountain's gifts"
      ],
      approach: [
        "Stone cairns mark the safe path up the mountainside",
        "Colorful weavings at the entrance ward off evil spirits",
        "The altitude leaves you breathless before you even begin work"
      ]
    }
  },
  {
    type: 'factory',
    culturalZone: 'South America',
    era: HistoricalEra.INDUSTRIAL_ERA,
    templates: {
      setting: [
        "This modern factory processes {materialType} using steam-powered machinery",
        "The industrial complex transforms raw {materialType} into finished goods for export",
        "Smokestacks rise above workshops where {materialType} undergoes modern processing"
      ],
      materials: [
        "Conveyor belts carry {color} {materialType} through various stages of refinement",
        "Quality {materialType} products with distinctive {color} finish await shipment",
        "The factory specializes in {color} {materialType} goods for international markets"
      ],
      atmosphere: [
        "Steam whistles mark shift changes while machines hum continuously",
        "The industrial symphony of gears, pistons, and hammers fills the air",
        "Workers move efficiently through the organized chaos of production"
      ],
      workers: [
        "A uniformed {workerType} in {clothing} oversees the production line",
        "The factory {workerType} wearing {clothing} maintains strict quality standards",
        "Skilled {workerType}s operate complex machinery with practiced ease"
      ],
      approach: [
        "Railway sidings bring raw materials and carry away finished products",
        "The factory gate bears the company seal and motto",
        "Workers' housing surrounds the industrial complex"
      ]
    }
  },
  
  // ==================== WOODCUTTER TEMPLATES ====================
  // North America - Various Eras
  {
    type: 'woodcutter',
    culturalZone: 'North America',
    era: HistoricalEra.ANTIQUITY,
    templates: {
      setting: [
        "A clearing in the {biomeDescription} where ancient trees are carefully harvested",
        "This woodland camp sits amid towering {materialType} trees in the {terrain}",
        "Sacred groves border this forestry site where {materialType} is gathered with reverence",
        "Smoke rises from a bark lodge at the center of this {materialType} harvesting ground"
      ],
      materials: [
        "Freshly cut {materialType} logs lie stacked, their {color} wood fragrant with sap",
        "The air is thick with the scent of {materialType} shavings and fresh sawdust",
        "Bundles of {color} {materialType} bark are piled for various uses",
        "Split {materialType} timbers reveal the beautiful {color} grain within"
      ],
      atmosphere: [
        "The rhythmic sound of stone axes echoes through the trees",
        "Birds call warnings as another {materialType} giant begins to fall",
        "Sunlight filters through the canopy onto piles of stripped bark",
        "The forest spirits are honored with offerings before each tree is taken"
      ],
      workers: [
        "{workerType} in {clothing} carefully selects the next tree to harvest",
        "Young apprentices learn to read the grain of {materialType} wood",
        "An elder {workerType} teaches the proper ceremonies for tree-taking",
        "Workers in {clothing} strip bark using traditional {tools}"
      ],
      approach: [
        "Wood chips and sawdust mark the path to this forest workplace",
        "The sweet smell of {materialType} sap guides you to the cutting site",
        "Stacked logs create natural walls around the work area"
      ]
    }
  },
  {
    type: 'woodcutter',
    culturalZone: 'Europe',
    era: HistoricalEra.MEDIEVAL,
    templates: {
      setting: [
        "A woodcutter's cottage sits at the edge of the {biomeDescription}, surrounded by {materialType} timber",
        "This forest clearing serves as a timber yard for the nearby manor's {materialType} needs",
        "Deep in the {terrain}, axes ring against ancient {materialType} trunks",
        "A crude shelter of woven branches marks this {materialType} felling site"
      ],
      materials: [
        "Massive {materialType} logs await transport, their {color} heartwood exposed",
        "Piles of {color} {materialType} branches are bundled for firewood",
        "The ground is carpeted with {materialType} shavings and fresh sawdust",
        "Stacks of split {materialType} dry under rough-hewn shelters"
      ],
      atmosphere: [
        "The forest echoes with the steady thunk of iron axes",
        "Oxen low as they strain to drag massive {materialType} trunks",
        "Smoke from the charcoal burner's mound drifts through the trees",
        "The forester's horn signals the end of the day's cutting"
      ],
      workers: [
        "A burly {workerType} in {clothing} swings a two-handed axe with practiced ease",
        "Young boys gather {materialType} branches for kindling bundles",
        "The master forester in {clothing} marks trees with his special blaze",
        "Sawyers work in pairs, pulling their great saw through {materialType} logs"
      ],
      approach: [
        "Rutted tracks from timber sledges lead into the forest",
        "The woodward's horn and the sound of axes guide you deeper into the woods",
        "Fresh stumps and piles of bark mark recent felling activity"
      ]
    }
  },
  {
    type: 'woodcutter',
    culturalZone: 'Asia',
    era: HistoricalEra.CLASSICAL,
    templates: {
      setting: [
        "Bamboo scaffolding surrounds the giant {materialType} trees selected for harvest",
        "This mountain forestry camp harvests {materialType} according to ancient principles",
        "Terraced slopes hold stacks of {materialType} timber awaiting transport to the valley",
        "A small shrine honors the forest deity at this {materialType} cutting ground"
      ],
      materials: [
        "Perfectly straight {materialType} logs are sorted by size and {color} grain quality",
        "Aromatic {materialType} wood fills the air with its distinctive {color} scent",
        "Bundles of bamboo and {materialType} are prepared for construction",
        "The prized {color} heartwood of old {materialType} trees is carefully preserved"
      ],
      atmosphere: [
        "Incense burns at the forest shrine before the day's cutting begins",
        "The singing of work songs accompanies the rhythm of sawing",
        "Mountain mists swirl around stacks of seasoning timber",
        "Each tree's spirit is thanked with a small ceremony"
      ],
      workers: [
        "A {workerType} in {clothing} demonstrates the proper angle for felling",
        "Teams of workers use ropes and pulleys to guide falling giants",
        "The master carpenter selects only the finest {materialType} grain",
        "Young monks from the temple help during the harvest season"
      ],
      approach: [
        "Prayer flags mark the path to this mountain timber operation",
        "The scent of incense mingles with fresh {materialType} sawdust",
        "Carved boundary stones show the extent of the cutting area"
      ]
    }
  },
  {
    type: 'woodcutter',
    culturalZone: 'Africa',
    era: HistoricalEra.MEDIEVAL,
    templates: {
      setting: [
        "This woodland camp in the {biomeDescription} harvests valuable {materialType} timber",
        "Carved totems mark this {materialType} cutting area in the {terrain}",
        "Seasonal camps follow the best {materialType} groves through the forest",
        "A collection of temporary shelters surrounds the {materialType} work site"
      ],
      materials: [
        "Dark {materialType} wood with its distinctive {color} grain is highly prized",
        "Logs of iron-hard {materialType} await special treatment",
        "The valuable {color} wood of {materialType} is destined for royal workshops",
        "Medicinal bark from {materialType} trees is carefully preserved"
      ],
      atmosphere: [
        "Drums coordinate the efforts of teams working on large trees",
        "Smoke from curing fires helps preserve the cut timber",
        "The forest resounds with work songs and rhythmic chopping",
        "Sacred groves nearby remain untouched by agreement"
      ],
      workers: [
        "Skilled {workerType} in {clothing} direct the controlled fall of giants",
        "Women and children strip valuable bark using {tools}",
        "The head forester wears {clothing} marking his authority",
        "Teams work together to process massive {materialType} trunks"
      ],
      approach: [
        "Talking drums announce your arrival at the cutting site",
        "Well-worn paths wind between protected and harvestable trees",
        "The sweet smoke of curing wood guides visitors to the camp"
      ]
    }
  },
  {
    type: 'woodcutter',
    culturalZone: 'Oceania',
    era: HistoricalEra.CLASSICAL,
    templates: {
      setting: [
        "This coastal forest camp harvests {materialType} for boat building",
        "Sacred {materialType} groves are managed according to ancestral wisdom",
        "The {terrain} provides both timber and spiritual guidance for harvesting",
        "Traditional boundaries mark where {materialType} may be taken"
      ],
      materials: [
        "Specially selected {materialType} curves will become boat ribs",
        "The flexible {color} wood of young {materialType} is prized for tools",
        "Massive {materialType} trunks will be hollowed into ocean-going vessels",
        "Aromatic {color} {materialType} is reserved for ceremonial uses"
      ],
      atmosphere: [
        "Chants accompany the felling of trees chosen for canoes",
        "The forest is alive with birdsong and the sound of stone on wood",
        "Ocean breezes carry the scent of {materialType} sawdust",
        "Each tree's genealogy is recited before cutting begins"
      ],
      workers: [
        "Master boat builders in {clothing} select perfect {materialType} specimens",
        "Young {workerType} learn the songs that guide proper cutting",
        "Women prepare {tools} for stripping and preparing bark",
        "The chief's representative ensures traditions are followed"
      ],
      approach: [
        "Shell markers on trees indicate which may be harvested",
        "The sound of conch horns signals active cutting ahead",
        "Carved posts mark the entrance to this managed forest"
      ]
    }
  },
  {
    type: 'woodcutter',
    culturalZone: 'South America',
    era: HistoricalEra.CLASSICAL,
    templates: {
      setting: [
        "This {biomeDescription} camp carefully harvests precious {materialType} wood",
        "Elevated platforms allow workers to reach the canopy for {materialType} cutting",
        "A riverside station where {materialType} logs are prepared for floating",
        "Traditional forest management ensures sustainable {materialType} harvesting"
      ],
      materials: [
        "The deep {color} wood of {materialType} is worth its weight in silver",
        "Latex tapped from {materialType} trees is collected in gourds",
        "Straight {materialType} poles perfect for construction lie ready",
        "The prized {color} heartwood gleams with natural oils"
      ],
      atmosphere: [
        "Howler monkeys protest the disturbance to their territory",
        "The humid air is thick with the scent of cut {materialType}",
        "Colorful birds flee as another forest giant falls",
        "Rain drums on the leaf canopy above the work site"
      ],
      workers: [
        "Skilled {workerType} in {clothing} navigate the canopy with ease",
        "River men prepare log rafts for the journey downstream",
        "The shaman blesses each tree before cutting begins",
        "Young workers learn to identify the best {materialType} specimens"
      ],
      approach: [
        "Blazed trees mark the trail to the cutting area",
        "The sound of axes echoes through the humid forest",
        "Dugout canoes rest at the riverside loading point"
      ]
    }
  },
  {
    type: 'woodcutter',
    culturalZone: 'Europe',
    era: HistoricalEra.INDUSTRIAL,
    templates: {
      setting: [
        "A steam-powered sawmill processes {materialType} from the surrounding {terrain}",
        "This lumber camp feeds the endless appetite of growing cities for {materialType}",
        "Railroad spurs reach deep into the forest to extract {materialType} timber",
        "Company housing surrounds the mill where {materialType} is processed"
      ],
      materials: [
        "Massive {materialType} logs await the screaming sawblades",
        "Mountains of {color} sawdust will be sold for various uses",
        "Stacks of cut {materialType} lumber dry in orderly rows",
        "The mill specializes in {color} {materialType} for fine furniture"
      ],
      atmosphere: [
        "Steam whistles mark the shift changes at the mill",
        "The shriek of sawblades cuts through the forest silence",
        "Locomotives haul endless loads of {materialType} to market",
        "The acrid smell of coal smoke mixes with fresh sawdust"
      ],
      workers: [
        "Lumberjacks in {clothing} work with crosscut saws and axes",
        "Mill workers in {clothing} guide logs through spinning blades",
        "The foreman in his bowler hat oversees operations",
        "Log drivers use {tools} to prevent jams in the river"
      ],
      approach: [
        "The mill's smokestack is visible for miles around",
        "Rail tracks and logging roads crisscross the forest",
        "The roar of machinery grows louder as you approach"
      ]
    }
  },
  
  // ==================== FORTRESS TEMPLATES ====================
  // Basic fortress templates - keep them simple and universal
  {
    type: 'fortress',
    culturalZone: 'Europe',
    era: HistoricalEra.ANTIQUITY,
    templates: {
      setting: [
        "A military {materialType} fortress commands the {terrain}, its walls weathered by countless seasons",
        "This fortified position overlooks the {biomeDescription}, built from local {materialType}"
      ],
      materials: [
        "The {color} {materialType} walls show signs of recent repair work",
        "Defensive positions built from {materialType} line the ramparts"
      ],
      atmosphere: [
        "Guards patrol the walls with practiced vigilance",
        "The sound of military drills echoes from the courtyard"
      ],
      workers: [
        "A gruff {workerType} in {clothing} barely acknowledges your presence",
        "The {workerType} eyes you with suspicion before returning to their duties"
      ],
      approach: [
        "Armed sentries watch your approach with professional interest",
        "The fortress gate stands partially open, guards visible within"
      ]
    }
  },
  {
    type: 'fortress',
    culturalZone: 'Asia',
    era: HistoricalEra.ANTIQUITY,
    templates: {
      setting: [
        "This {materialType} fortress guards the strategic {terrain} position",
        "Military fortifications of {materialType} dominate the {biomeDescription}"
      ],
      materials: [
        "Walls of {color} {materialType} rise imposingly above",
        "The fortress is built from solid {materialType} blocks"
      ],
      atmosphere: [
        "The fortress maintains an air of watchful readiness",
        "Military discipline is evident in every aspect of the fortress"
      ],
      workers: [
        "A stern {workerType} in {clothing} watches you carefully",
        "The {workerType} gives you a hard look before looking away"
      ],
      approach: [
        "Guards at the gate eye all visitors with suspicion",
        "The fortress entrance is heavily guarded"
      ]
    }
  }
];

// Cultural context data for variable substitution
const CULTURAL_POI_DATA = {
  'North America': {
    [HistoricalEra.ANTIQUITY]: {
      quarry: {
        materials: ['obsidian', 'flint', 'chert', 'sandstone', 'pipestone'],
        workers: ['stone-knapper', 'hunter', 'craftsman', 'tribal elder', 'medicine worker'],
        clothing: ['deerskin wrappings', 'woven grass cloaks', 'hide garments', 'feathered bands'],
        tools: ['bone picks', 'antler hammers', 'stone wedges', 'wooden levers'],
        colors: ['black', 'gray', 'brown', 'red', 'white']
      },
      mine: {
        materials: ['copper', 'clay', 'ochre', 'salt', 'mica'],
        workers: ['earth-worker', 'miner', 'clan member', 'spirit-keeper'],
        clothing: ['leather aprons', 'mud-stained wraps', 'simple breechcloths', 'work tunics'],
        tools: ['digging sticks', 'stone hammers', 'wooden scoops', 'hide buckets'],
        colors: ['red', 'green', 'brown', 'yellow', 'blue']
      },
      woodcutter: {
        materials: ['oak', 'pine', 'cedar', 'birch', 'maple', 'hickory'],
        workers: ['woodcutter', 'tree-keeper', 'bark-stripper', 'lodge builder'],
        clothing: ['deerskin leggings', 'bark capes', 'fur wraps', 'woven fiber shirts'],
        tools: ['stone axes', 'bone wedges', 'fire starters', 'bark peelers'],
        colors: ['brown', 'golden', 'red', 'silver', 'dark']
      }
    }
  },
  'Europe': {
    [HistoricalEra.ANTIQUITY]: {
      quarry: {
        materials: ['marble', 'limestone', 'granite', 'slate', 'travertine'],
        workers: ['slave', 'stonemason', 'overseer', 'engineer', 'foreman'],
        clothing: ['rough tunics', 'leather straps', 'linen wrappings', 'bronze buckles'],
        tools: ['iron chisels', 'wooden wedges', 'rope pulleys', 'bronze picks'],
        colors: ['white', 'gray', 'pink', 'black', 'cream']
      },
      fortress: {
        materials: ['stone', 'brick', 'timber', 'limestone', 'granite'],
        workers: ['guard', 'sentry', 'garrison soldier', 'watchman', 'centurion'],
        clothing: ['worn armor', 'military tunics', 'leather gear', 'iron helmets'],
        tools: ['spears', 'shields', 'crossbows', 'signal horns'],
        colors: ['gray', 'brown', 'weathered', 'dark', 'stained']
      }
    },
    [HistoricalEra.MEDIEVAL]: {
      mill: {
        materials: ['wheat', 'barley', 'oats', 'rye', 'peas'],
        workers: ['miller', 'mill-hand', 'grain merchant', 'village worker'],
        clothing: ['flour-dusted aprons', 'woolen tunics', 'linen caps', 'leather boots'],
        tools: ['wooden paddles', 'grain scoops', 'sieves', 'measuring cups'],
        colors: ['golden', 'brown', 'cream', 'tan', 'white']
      }
    }
  },
  'Asia': {
    [HistoricalEra.ANTIQUITY]: {
      quarry: {
        materials: ['jade', 'limestone', 'sandstone', 'basalt', 'granite'],
        workers: ['stone-carver', 'mason', 'quarry master', 'artisan'],
        clothing: ['silk robes', 'hemp tunics', 'leather aprons', 'bamboo hats'],
        tools: ['bronze chisels', 'jade hammers', 'bamboo wedges', 'water saws'],
        colors: ['green', 'white', 'gray', 'black', 'yellow']
      },
      fortress: {
        materials: ['stone', 'rammed earth', 'brick', 'timber', 'tile'],
        workers: ['guard', 'soldier', 'watchman', 'garrison commander', 'sentry'],
        clothing: ['lamellar armor', 'military robes', 'leather guards', 'iron helmets'],
        tools: ['halberds', 'crossbows', 'signal drums', 'watchtower bells'],
        colors: ['gray', 'earthen', 'dark', 'weathered', 'red']
      }
    },
    [HistoricalEra.MEDIEVAL]: {
      mill: {
        materials: ['rice', 'millet', 'wheat', 'buckwheat', 'soybeans'],
        workers: ['miller', 'grain master', 'mill keeper', 'apprentice'],
        clothing: ['cotton robes', 'straw sandals', 'cloth aprons', 'conical hats'],
        tools: ['wooden gears', 'stone wheels', 'bamboo scoops', 'silk sieves'],
        colors: ['white', 'golden', 'brown', 'gray', 'yellow']
      }
    }
  },
  'Africa': {
    [HistoricalEra.MEDIEVAL]: {
      mine: {
        materials: ['gold', 'copper', 'iron', 'salt', 'ivory'],
        workers: ['master miner', 'ore finder', 'tunnel digger', 'apprentice'],
        clothing: ['kente cloth', 'leather wraps', 'cowrie shells', 'tribal marks'],
        tools: ['iron picks', 'wooden supports', 'fiber ropes', 'clay lamps'],
        colors: ['golden', 'reddish', 'black', 'white', 'brown']
      },
      factory: {
        materials: ['iron', 'brass', 'ivory', 'wood', 'leather'],
        workers: ['master craftsman', 'smith', 'carver', 'apprentice'],
        clothing: ['woven robes', 'leather aprons', 'beaded ornaments', 'head wraps'],
        tools: ['forge hammers', 'carving knives', 'brass molds', 'polishing stones'],
        colors: ['black', 'golden', 'brown', 'red', 'white']
      }
    }
  },
  'Middle East': {
    [HistoricalEra.ANTIQUITY]: {
      quarry: {
        materials: ['limestone', 'alabaster', 'granite', 'sandstone', 'basalt'],
        workers: ['overseer', 'stone cutter', 'slave', 'engineer'],
        clothing: ['linen kilts', 'leather sandals', 'head cloths', 'bronze ornaments'],
        tools: ['copper saws', 'dolerite pounders', 'wooden levers', 'bronze chisels'],
        colors: ['white', 'pink', 'red', 'yellow', 'black']
      }
    },
    [HistoricalEra.MEDIEVAL]: {
      mill: {
        materials: ['wheat', 'barley', 'dates', 'lentils', 'chickpeas'],
        workers: ['master miller', 'grain merchant', 'mill hand', 'apprentice'],
        clothing: ['cotton robes', 'turbans', 'leather belts', 'pointed shoes'],
        tools: ['millstones', 'wind sails', 'measuring cups', 'grain sacks'],
        colors: ['golden', 'brown', 'tan', 'green', 'red']
      }
    }
  },
  'Oceania': {
    [HistoricalEra.ANTIQUITY]: {
      quarry: {
        materials: ['volcanic rock', 'coral stone', 'basalt', 'obsidian', 'sandstone'],
        workers: ['master carver', 'stone priest', 'apprentice', 'hauler'],
        clothing: ['tapa cloth', 'grass skirts', 'shell necklaces', 'feather capes'],
        tools: ['basalt hammers', 'coral abraders', 'wooden wedges', 'fiber ropes'],
        colors: ['black', 'gray', 'red', 'white', 'brown']
      }
    }
  },
  'South America': {
    [HistoricalEra.ANTIQUITY]: {
      mine: {
        materials: ['silver', 'copper', 'tin', 'gold', 'emeralds'],
        workers: ['mine priest', 'tunnel master', 'ore carrier', 'apprentice'],
        clothing: ['alpaca wool tunics', 'woven belts', 'leather sandals', 'coca pouches'],
        tools: ['bronze picks', 'llama-hide bags', 'stone hammers', 'reed torches'],
        colors: ['silver', 'green', 'gold', 'copper', 'gray']
      }
    },
    [HistoricalEra.INDUSTRIAL_ERA]: {
      factory: {
        materials: ['rubber', 'copper', 'nitrates', 'coffee', 'sugar'],
        workers: ['foreman', 'machinist', 'laborer', 'engineer'],
        clothing: ['cotton uniforms', 'leather boots', 'cloth caps', 'work gloves'],
        tools: ['steam engines', 'conveyor belts', 'hydraulic presses', 'rail carts'],
        colors: ['brown', 'black', 'white', 'red', 'green']
      }
    }
  }
};

// Biome descriptors for environmental context
const BIOME_DESCRIPTORS = {
  [BiomeType.HILLS]: {
    terrain: 'hillside',
    biomeDescription: 'rolling hills dotted with ancient oaks'
  },
  [BiomeType.MOUNTAINS]: {
    terrain: 'mountainside', 
    biomeDescription: 'towering peaks and rocky slopes'
  },
  [BiomeType.FOREST]: {
    terrain: 'forest floor',
    biomeDescription: 'dense woodlands filled with birdsong'
  },
  [BiomeType.GRASSLAND]: {
    terrain: 'prairie ground',
    biomeDescription: 'endless grasslands swaying in the wind'
  },
  [BiomeType.DESERT]: {
    terrain: 'desert floor',
    biomeDescription: 'sun-baked dunes and sparse vegetation'
  },
  [BiomeType.RIVER]: {
    terrain: 'riverbank',
    biomeDescription: 'flowing waters and fertile banks'
  },
  [BiomeType.COAST]: {
    terrain: 'coastal bluff',
    biomeDescription: 'sea cliffs and salt-touched air'
  }
};

class POIDescriptionService {
  private mapCulturalZone(zone: CulturalZone): string {
    const mapping: Record<CulturalZone, string> = {
      'EUROPEAN': 'Europe',
      'EAST_ASIAN': 'Asia', 
      'MENA': 'Middle East',
      'NORTH_AMERICAN_PRE_COLUMBIAN': 'North America',
      'NORTH_AMERICAN_COLONIAL': 'North America',
      'OCEANIA': 'Oceania',
      'SOUTH_ASIAN': 'Asia',
      'SOUTH_AMERICAN': 'South America',
      'SUB_SAHARAN_AFRICAN': 'Africa'
    };
    return mapping[zone] || 'Europe'; // Fallback to Europe
  }

  private findTemplate(
    poiType: string, 
    culturalZone: CulturalZone, 
    era: HistoricalEra
  ): POIDescriptionTemplate | null {
    const mappedZone = this.mapCulturalZone(culturalZone);
    
    console.log('[POI Description] Searching for template:', {
      poiType,
      originalZone: culturalZone,
      mappedZone,
      era
    });
    
    // Convert era to string to ensure comparison works
    const eraString = typeof era === 'string' ? era : (era ? era.toString() : 'MEDIEVAL');
    
    const template = DESCRIPTION_TEMPLATES.find(
      template => {
        const templateEraString = typeof template.era === 'string' ? template.era : (template.era ? template.era.toString() : 'MEDIEVAL');
        return (
          template.type === poiType &&
          template.culturalZone === mappedZone &&
          templateEraString === eraString
        );
      }
    );
    
    if (!template) {
      console.log('[POI Description] No exact match found. Debugging info:');
      console.log('Looking for:', { type: poiType, zone: mappedZone, era: era });
      console.log('Era comparison:', { searchEra: era, eraType: typeof era });
      
      // Check first quarry template specifically
      const firstQuarry = DESCRIPTION_TEMPLATES.find(t => t.type === 'quarry');
      if (firstQuarry) {
        console.log('First quarry template:', {
          type: firstQuarry.type,
          zone: firstQuarry.culturalZone,
          era: firstQuarry.era,
          eraType: typeof firstQuarry.era,
          eraValue: JSON.stringify(firstQuarry.era)
        });
        console.log('Comparisons:', {
          typeMatch: firstQuarry.type === poiType,
          zoneMatch: firstQuarry.culturalZone === mappedZone,
          eraMatch: firstQuarry.era === era,
          eraComparison: `"${firstQuarry.era}" === "${era}"`
        });
      }
    }
    
    return template || null;
  }

  private buildContext(
    structure: TerrainStructure,
    biome: BiomeType,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    poiType: string
  ): POIContext {
    const culturalData = CULTURAL_POI_DATA[culturalZone]?.[era]?.[poiType as keyof typeof CULTURAL_POI_DATA[typeof culturalZone][typeof era]];
    const biomeData = BIOME_DESCRIPTORS[biome] || { terrain: 'ground', biomeDescription: 'the surrounding landscape' };

    if (!culturalData) {
      // Fallback context
      return {
        materialType: 'stone',
        biomeType: biome,
        terrain: biomeData.terrain,
        workerType: 'worker',
        clothing: 'simple garments',
        color: 'gray',
        tools: ['basic tools']
      };
    }

    // Select random elements from arrays for variety
    return {
      materialType: this.pickRandom(culturalData.materials),
      biomeType: biome,
      terrain: biomeData.terrain,
      biomeDescription: biomeData.biomeDescription,
      workerType: this.pickRandom(culturalData.workers),
      clothing: this.pickRandom(culturalData.clothing),
      color: this.pickRandom(culturalData.colors),
      tools: culturalData.tools
    };
  }

  private pickRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private substituteVariables(text: string, context: POIContext): string {
    return text
      .replace(/\{materialType\}/g, context.materialType)
      .replace(/\{biomeDescription\}/g, context.biomeDescription || 'the area')
      .replace(/\{terrain\}/g, context.terrain)
      .replace(/\{workerType\}/g, context.workerType)
      .replace(/\{clothing\}/g, context.clothing)
      .replace(/\{color\}/g, context.color);
  }

  public generateDescription(
    poiType: string,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    biome: BiomeType,
    structure: TerrainStructure
  ): string {
    try {
      console.log('[POI Description] Service called with params:', {
        poiType: typeof poiType + ':' + JSON.stringify(poiType),
        culturalZone: typeof culturalZone + ':' + JSON.stringify(culturalZone),
        era: typeof era + ':' + JSON.stringify(era),
        biome: typeof biome + ':' + JSON.stringify(biome),
        structureName: structure?.name,
        structureType: structure?.structureType,
        structureAnyType: structure?.type,
        totalTemplates: DESCRIPTION_TEMPLATES.length
      });
    } catch (debugError) {
      console.error('[POI Description] Error in debug logging:', debugError);
    }
    
    const template = this.findTemplate(poiType, culturalZone, era);
    
    console.log('[POI Description] Template found:', template ? 'YES' : 'NO');
    if (!template) {
      console.log('[POI Description] Available templates for debugging:', 
        DESCRIPTION_TEMPLATES.map(t => `${t.type}/${t.culturalZone}/${t.era}`).slice(0, 5)
      );
      return `This ${poiType} shows signs of recent activity. Workers here process materials according to local customs and available resources.`;
    }

    const context = this.buildContext(structure, biome, culturalZone, era, poiType);
    
    // Pick one template from each category (not all - keep it concise for toast)
    const setting = this.pickRandom(template.templates.setting);
    const materials = this.pickRandom(template.templates.materials);
    const workers = this.pickRandom(template.templates.workers);
    
    // Create a 2-3 sentence description
    return [setting, materials, workers]
      .map(text => this.substituteVariables(text, context))
      .join('. ') + '.';
  }

  public getAvailableCombinations(): Array<{
    type: string;
    culturalZone: CulturalZone;
    era: HistoricalEra;
  }> {
    return DESCRIPTION_TEMPLATES.map(template => ({
      type: template.type,
      culturalZone: template.culturalZone,
      era: template.era
    }));
  }
}

export const poiDescriptionService = new POIDescriptionService();