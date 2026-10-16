import type { CharacterScope } from "./context-types";

/*
 * The work a city was known for. Without this every town draws the same
 * urban list: Manchester in 1840 had more clerks than mill hands, Baghdad no
 * paper makers, Tenochtitlan no canoes. `boost` multiplies a role's share;
 * `labels` adds the local name, weighted against the role's other names.
 */
export type CitySignature = {
  id: string;
  scope: CharacterScope;
  boost: Readonly<Record<string, number>>;
  labels?: Readonly<Record<string, readonly { label: string; weight: number }[]>>;
  evidence: string;
};

export const citySignatures: readonly CitySignature[] = [
  {
    id: "rome-imperial",
    scope: { years: [-100, 450], places: ["rome"] },
    boost: { porter: 4, "dock-labourer": 3, boatman: 2, baker: 3, miller: 2, "household-slave": 2 },
    labels: {
      porter: [{ label: "Grain Porter", weight: 4 }],
      boatman: [{ label: "Tiber Bargeman", weight: 4 }],
      clerk: [{ label: "Grain Measurer", weight: 2 }],
    },
    evidence: "The annona fed a million people from Egyptian and African grain landed at Portus and hauled up the Tiber; the saccarii, caudicarii and mensores frumentarii had their own guilds, and Rome had some 250 bakeries.",
  },
  {
    id: "baghdad-abbasid",
    scope: { years: [762, 1258], places: ["mesopotamia"] },
    boost: { craftsperson: 1.5, scribe: 3, boatman: 3, "money-changer": 3, "dock-labourer": 2 },
    labels: {
      craftsperson: [
        { label: "Paper Maker", weight: 2 },
        { label: "Copyist and Stationer", weight: 2 },
      ],
      boatman: [{ label: "Tigris Boatman", weight: 3 }],
      "money-changer": [{ label: "Banker", weight: 1 }],
    },
    evidence: "Paper was made in Baghdad from 794; the Suq al-Warraqin held over a hundred stationers' and booksellers' shops. The city lived on the Tigris and its canals, and its sarrafs issued bills of credit honoured across the caliphate.",
  },
  {
    id: "timbuktu",
    scope: { years: [1300, 1900], places: ["timbuktu"] },
    boost: { scribe: 4, schoolteacher: 2, boatman: 3, mason: 3, trader: 3, tailor: 2 },
    labels: {
      scribe: [{ label: "Manuscript Copyist", weight: 4 }],
      boatman: [{ label: "Niger Boatman", weight: 3 }],
      mason: [{ label: "Mud Mason", weight: 4 }],
      tailor: [{ label: "Embroiderer", weight: 2 }],
    },
    evidence: "Timbuktu's scholars and copyists, its Bozo and Somono boatmen on the Niger, and its masons' guild, which rebuilt the mud mosques every year; tailoring and embroidery of robes was a trade of the Qur'an school students.",
  },
  {
    id: "benin-city",
    scope: { years: [1300, 1897], places: ["city-benin-city"] },
    boost: { craftsperson: 1.5, carver: 2, retainer: 3, warrior: 2, "market-seller": 2 },
    labels: {
      craftsperson: [{ label: "Brass Caster", weight: 3 }],
      carver: [{ label: "Ivory Carver", weight: 3 }],
      retainer: [{ label: "Palace Attendant", weight: 3 }],
      "market-seller": [{ label: "Market Woman", weight: 2 }],
    },
    evidence: "The palace guilds lived in their own wards: Igun Eronmwon cast the brass, Igbesanmwan carved the ivory. The palace societies of the Oba's household were the city's largest employer.",
  },
  {
    id: "tenochtitlan",
    scope: { years: [1325, 1521], places: ["mexico"] },
    boost: { boatman: 5, porter: 4, farmer: 2, "market-seller": 3, craftsperson: 2 },
    labels: {
      boatman: [{ label: "Canoe Paddler", weight: 4 }],
      porter: [{ label: "Carrier", weight: 3 }],
      farmer: [{ label: "Chinampa Farmer", weight: 5 }],
      fisher: [{ label: "Lake Fisher", weight: 5 }],
      "market-seller": [{ label: "Tlatelolco Market Seller", weight: 2 }],
    },
    evidence: "An island city with no draught animals: goods came by canoe, tens of thousands of them on the lake, or on the backs of tlameme carriers. Chinampa beds fed it, and the Tlatelolco market drew sixty thousand a day by Cortés's count.",
  },
  {
    id: "cusco-inca",
    scope: { years: [1438, 1533], places: ["cusco-city"] },
    boost: { stonemason: 4, mason: 3, weaver: 3, retainer: 2, porter: 2 },
    labels: {
      weaver: [{ label: "Fine-cloth Weaver", weight: 3 }],
      retainer: [{ label: "Yanacona Servant", weight: 3 }],
      mason: [{ label: "Stone Fitter", weight: 3 }],
    },
    evidence: "Cusco was rebuilt in fitted stone by mit'a labour from 1438; aqllakuna and qumpikamayuq wove the cumbi cloth that the state valued above gold; yanakuna served the royal lineages.",
  },
  {
    id: "mughal-delhi",
    scope: { years: [1639, 1857], places: ["delhi"] },
    boost: { craftsperson: 2, warrior: 3, retainer: 3, servant: 2, weaver: 2 },
    labels: {
      craftsperson: [
        { label: "Court Workshop Artisan", weight: 3 },
        { label: "Jeweller", weight: 2 },
      ],
      warrior: [{ label: "Trooper", weight: 3 }],
      retainer: [{ label: "Household Retainer", weight: 2 }],
    },
    evidence: "Shahjahanabad was built round the court: the imperial karkhanas employed thousands of artisans, and the mansabdars' cavalry and households filled the city whenever the emperor was in residence.",
  },
  {
    id: "london-early-modern",
    scope: { years: [1550, 1800], places: ["london"] },
    boost: { servant: 3, housemaid: 2, porter: 2, boatman: 3, tailor: 2, "dock-labourer": 2, apprentice: 2 },
    labels: { boatman: [{ label: "Waterman", weight: 4 }] },
    evidence: "Domestic service was the largest single occupation in early modern London; thousands of Thames watermen were the city's taxis; apprentices were perhaps a tenth of the adult men.",
  },
  {
    id: "london-victorian",
    scope: { years: [1800, 1914], places: ["london"] },
    boost: { "domestic-servant": 4, "dock-labourer": 3, "dock-worker": 3, seamstress: 2, costermonger: 2, clerk: 1.5 },
    evidence: "In 1851 domestic service was London's largest occupation, about a third of working women; the docks hired casual labour by the day.",
  },
  {
    id: "manchester-cotton",
    scope: { years: [1780, 1914], places: ["city-manchester"] },
    boost: { "mill-worker": 14, "power-loom-weaver": 6, "factory-hand": 4, weaver: 3, dyer: 2, clerk: 0.5, shopkeeper: 0.5, grocer: 0.5 },
    labels: {
      "mill-worker": [
        { label: "Cotton Spinner", weight: 3 },
        { label: "Piecer", weight: 2 },
        { label: "Card-room Hand", weight: 1 },
      ],
      weaver: [{ label: "Handloom Weaver", weight: 4 }],
      dyer: [{ label: "Calico Printer", weight: 2 }],
    },
    evidence: "Cottonopolis: cotton was by far the largest employer, and handloom weavers were still numerous, and starving, into the 1840s.",
  },
  {
    id: "beijing-ming-qing",
    scope: { years: [1420, 1911], places: ["beijing"] },
    boost: { clerk: 1.5, servant: 2, warrior: 3, porter: 2, carter: 2 },
    labels: {
      warrior: [
        { label: "Bannerman", weight: 4 },
        { label: "Capital Guard", weight: 1 },
      ],
      porter: [{ label: "Water Carrier", weight: 3 }],
    },
    evidence: "The capital of the bureaucracy and its garrison: under the Qing the Inner City was given over to the Eight Banners, and water was sold door to door by carriers from the sweet-water wells.",
  },
  {
    id: "istanbul-ottoman",
    scope: { years: [1453, 1922], places: ["city-istanbul"] },
    boost: { boatman: 4, porter: 3, baker: 2, warrior: 2, "household-slave": 2 },
    labels: {
      boatman: [{ label: "Caique Rower", weight: 4 }],
      warrior: [{ label: "Janissary", weight: 4 }],
    },
    evidence: "The city was crossed by thousands of caiques; its porters' guilds carried everything up the hills; the Janissaries garrisoned it until 1826, and the state fixed and policed the price of bread.",
  },
  {
    id: "alexandria-hellenistic-roman",
    scope: { years: [-300, 642], places: ["alexandria"] },
    boost: { "dock-labourer": 3, sailor: 3, weaver: 3, scribe: 2 },
    labels: {
      weaver: [{ label: "Linen Weaver", weight: 4 }],
      craftsperson: [{ label: "Glassblower", weight: 4 }, { label: "Papyrus Maker", weight: 3 }],
      scribe: [{ label: "Copyist", weight: 2 }],
    },
    evidence: "The grain port of Egypt and the Mediterranean's maker of linen, papyrus and glass; the Museum and Library kept copyists at work for centuries.",
  },
  {
    id: "athens-classical",
    scope: { years: [-600, -86], places: ["athens"] },
    boost: { potter: 4, stonemason: 3, quarryman: 2, sailor: 2, "household-slave": 2 },
    labels: {
      potter: [{ label: "Vase Painter", weight: 2 }],
      stonemason: [{ label: "Marble Carver", weight: 3 }],
      sailor: [{ label: "Trireme Rower", weight: 4 }],
    },
    evidence: "The Kerameikos potters, the Pentelic marble of the Parthenon building accounts, and a navy of some two hundred triremes rowed largely by poorer citizens.",
  },
  {
    id: "saint-domingue",
    scope: { years: [1697, 1793], places: ["haiti"] },
    boost: { "field-slave": 6, "household-slave": 2 },
    labels: {
      "field-slave": [
        { label: "Cane Cutter", weight: 4 },
        { label: "Sugar Boiler", weight: 1 },
        { label: "Coffee Picker", weight: 3 },
      ],
    },
    evidence: "By 1789 Saint-Domingue held some 465,000 enslaved people against about thirty thousand whites, on some eight thousand sugar, coffee and indigo plantations.",
  },
  {
    id: "kyoto-edo-period",
    scope: { years: [1600, 1868], places: ["kyoto"] },
    boost: { weaver: 4, dyer: 3, craftsperson: 3, printer: 2 },
    labels: {
      weaver: [{ label: "Nishijin Silk Weaver", weight: 4 }],
      craftsperson: [{ label: "Lacquerer", weight: 2 }, { label: "Fan Maker", weight: 2 }],
    },
    evidence: "Nishijin's brocade looms, the Yuzen dyers and the luxury crafts of the old capital; Kyoto was Japan's first centre of commercial printing.",
  },
  {
    id: "venice-republic",
    scope: { years: [1100, 1797], places: ["city-venice"] },
    boost: { boatman: 4, boatwright: 4, sailor: 3, "dock-labourer": 2 },
    labels: {
      boatman: [{ label: "Gondolier", weight: 3 }],
      boatwright: [{ label: "Arsenal Shipwright", weight: 4 }],
      craftsperson: [{ label: "Glassblower", weight: 3 }],
    },
    evidence: "The Arsenal employed some sixteen thousand at its height; glassmaking was moved to Murano in 1291; the city moved by water.",
  },
  {
    id: "florence-wool",
    scope: { years: [1250, 1600], places: ["city-florence"] },
    boost: { "wool-comber": 4, weaver: 3, dyer: 3, spinner: 3, "money-changer": 2 },
    labels: {
      "wool-comber": [{ label: "Wool Carder", weight: 3 }],
      "money-changer": [{ label: "Banker", weight: 2 }],
    },
    evidence: "Villani reckoned thirty thousand people lived by the Arte della Lana in the 1330s, a third of the city; the ciompi who rose in 1378 were its carders and combers.",
  },
  {
    id: "paris-old-regime",
    scope: { years: [1600, 1789], places: ["paris"] },
    boost: { servant: 3, "domestic-servant": 2, porter: 2, seamstress: 2, tailor: 2, "water-carrier": 3 },
    labels: { seamstress: [{ label: "Linen Maid", weight: 1 }] },
    evidence: "Servants were about one Parisian in fourteen before the Revolution; Mercier counted twenty thousand water carriers brought the Seine to its upper floors.",
  },
  {
    id: "kano-emirate",
    scope: { years: [1400, 1903], places: ["city-kano"] },
    boost: { dyer: 5, weaver: 3, leatherworker: 3, trader: 3, "field-slave": 2 },
    labels: {
      dyer: [{ label: "Indigo Dyer", weight: 5 }],
      leatherworker: [{ label: "Tanner of Goatskin", weight: 2 }],
    },
    evidence: "Barth found Kano's indigo cloth sold from the Atlantic to Lake Chad in 1851; its dye pits and red goatskin leather ('Morocco') were its fame.",
  },
  {
    id: "lima-viceroyalty",
    scope: { years: [1535, 1821], places: ["city-lima"] },
    boost: { "household-slave": 3, servant: 2, clerk: 1.5, porter: 2 },
    evidence: "The viceregal capital: the 1614 census counted people of African descent as about two in five of its population, most in domestic service.",
  },
  {
    id: "nagasaki-trade",
    scope: { years: [1571, 1859], places: ["city-nagasaki"] },
    boost: { "dock-labourer": 3, porter: 3, clerk: 2, trader: 2 },
    labels: { clerk: [{ label: "Dutch Interpreter", weight: 1 }] },
    evidence: "Japan's only window on Europe after 1641: the Dutch at Dejima and the Chinese quarter were served by licensed interpreters, warehousemen and porters.",
  },
  {
    id: "damascus-mamluk-ottoman",
    scope: { years: [1250, 1918], places: ["city-damascus"] },
    boost: { weaver: 3, craftsperson: 3, trader: 2 },
    labels: {
      weaver: [{ label: "Silk Weaver", weight: 3 }],
      craftsperson: [{ label: "Swordsmith", weight: 1 }, { label: "Inlayer", weight: 3 }],
    },
    evidence: "Damask silk, inlaid brass and the hajj caravan that assembled outside the walls each year.",
  },
  {
    id: "samarkand-timurid",
    scope: { years: [1370, 1500], places: ["city-samarkand"] },
    boost: { craftsperson: 3, mason: 3, weaver: 2, trader: 3 },
    labels: { craftsperson: [{ label: "Tile Maker", weight: 4 }, { label: "Paper Maker", weight: 2 }] },
    evidence: "Timur carried off artisans from Damascus to Delhi to build Samarkand; its tile-workers faced the Registan, and Samarkand paper was famous since the eighth century.",
  },
  {
    id: "hangzhou-song",
    scope: { years: [1138, 1279], places: ["city-hangzhou"] },
    boost: { boatman: 3, porter: 2, "market-seller": 3, innkeeper: 2, printer: 2, weaver: 2 },
    labels: { weaver: [{ label: "Silk Weaver", weight: 4 }] },
    evidence: "The Southern Song capital, perhaps a million people: Wu Zimu's record of the city lists its hundreds of trades, the teahouses, the printing shops and the canal traffic.",
  },
  {
    id: "seville-indies",
    scope: { years: [1503, 1717], places: ["city-seville"] },
    boost: { sailor: 2, "dock-labourer": 3, boatwright: 2, clerk: 1.5, "household-slave": 2 },
    evidence: "The Casa de Contratación made Seville the only port for the Indies fleets; one in fourteen of its people was enslaved in 1565.",
  },
  {
    id: "lisbon-empire",
    scope: { years: [1500, 1755], places: ["city-lisbon"] },
    boost: { sailor: 3, "dock-labourer": 3, "household-slave": 2, porter: 2 },
    evidence: "The Casa da Índia and the Carreira; in 1550 a tenth of Lisbon was enslaved, many as water carriers and porters.",
  },
  {
    id: "amsterdam-golden-age",
    scope: { years: [1585, 1795], places: ["city-amsterdam"] },
    boost: { sailor: 4, boatwright: 3, "dock-labourer": 3, printer: 2, clerk: 1.5 },
    evidence: "The VOC and the Baltic trade; the shipyards on the IJ, and the presses of Europe's freest book trade.",
  },
  {
    id: "boston-colonial",
    scope: { years: [1630, 1800], places: ["city-boston"] },
    boost: { sailor: 4, boatwright: 3, "rope-maker": 3, "dock-labourer": 2, cooper: 2 },
    evidence: "A shipbuilding and carrying port whose ropewalks and wharves employed much of the town; the Massacre began in a brawl with ropewalk workers.",
  },
  {
    id: "new-york-immigrant",
    scope: { years: [1880, 1930], places: ["city-new-york"] },
    boost: { seamstress: 4, "machine-operator": 3, "street-vendor": 3, "dock-worker": 3, "construction-labourer": 3, "domestic-servant": 2 },
    labels: {
      seamstress: [{ label: "Garment Worker", weight: 4 }],
      "street-vendor": [{ label: "Pushcart Peddler", weight: 3 }],
    },
    evidence: "The Lower East Side's needle trades made most of America's ready-made clothing; the 1911 Triangle fire killed 146 garment workers.",
  },
];
