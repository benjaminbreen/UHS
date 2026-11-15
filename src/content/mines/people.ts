import type { Box, SewerPerson } from "../sewers/types";

const BRITAIN: Box = [-8, 49.8, 2, 59];
const SCOTLAND: Box = [-6.5, 54.6, -1.5, 58.7];
const SOUTH_WALES: Box = [-4.6, 51.4, -2.6, 52];
const CORNWALL: Box = [-6, 49.9, -4.1, 50.9];
const GERMANY: Box = [5.8, 47.2, 15.1, 55.1];
const ANDES: Box = [-80, -35, -63, 5];
const POTOSI: Box = [-66.2, -20, -65.4, -19.2];
const HUANCAVELICA: Box = [-75.5, -13.2, -74.6, -12.4];
const MEXICO: Box = [-118, 14, -86, 33];
const SADO: Box = [138.2, 37.8, 138.6, 38.3];
const JAPAN: Box = [129, 30, 146, 46];
const WEST_AFRICA: Box = [-17.5, 4, 3, 16];
const ZIMBABWE: Box = [25, -23, 34, -15];
const LAURION: Box = [23.6, 37.5, 24.3, 38];
const FALUN: Box = [15.4, 60.4, 15.8, 60.7];
const WIELICZKA: Box = [19.8, 49.8, 20.3, 50.2];
const HALLSTATT: Box = [13.3, 47.3, 13.9, 47.8];
const WITWATERSRAND: Box = [26.5, -27, 29, -25.5];
const KOLAR: Box = [78, 12.8, 78.5, 13.2];
const INDIA: Box = [68, 6, 97, 36];
const CHINA: Box = [97, 18, 125, 46];
const DONBAS: Box = [36.5, 47, 40.5, 49.3];
const APPALACHIA: Box = [-85, 35, -75, 42];
const NEVADA_MONTANA: Box = [-120.5, 37, -104, 49];
const RUHR: Box = [6.4, 51.2, 8, 51.8];

/** Who is met underground in a mine, by kind of mine, place and date. Lines
 * are plain modern English; the facts in them carry the period. */
export const minePeople: readonly SewerPerson[] = [
  // Coal.
  {
    id: "hewer", scope: { years: [1600, 1995] }, kinds: ["coal"], depths: ["workings"],
    label: "Hewer", dress: "miner", doing: "Cutting coal at the face", manner: "work",
    lines: [
      "Two feet of seam here. You lie on your side and cut under it, then bring it down.",
      "We're paid by the ton that reaches the top. Stone in the tub doesn't count, and they dock you for it.",
      "Listen to the roof. When the props start creaking, you get out and you don't stop for your tools.",
      "My father worked this seam, and his father. The coal's no thinner, the men are.",
    ],
    party: [0.4, 0.45, 0.15], women: 0, ages: [16, 60], lit: true, goods: ["coal"], weight: 5,
    note: "Hand hewing by undercutting ('holing') and bringing down the coal, paid by weight of clean coal: documented across British, European and American coalfields until mechanised cutting.", basis: "documented",
  },
  {
    id: "hurrier", scope: { years: [1700, 1843], bounds: BRITAIN }, kinds: ["coal"], depths: ["level", "workings"],
    label: "Hurrier", dress: "miner", doing: "Pushing a loaded corf", manner: "crew",
    lines: [
      "I push the corf from the face to the main road. Head down, both hands, there and back all day.",
      "The roads are lower than I am, so I go bent double. My back's bald where it rubs the roof.",
      "My brother's the trapper. He's six, so he sits in the dark while I do the running.",
    ],
    party: [0.5, 0.4, 0.1], women: 0.4, ages: [8, 17], lit: false, weight: 3,
    note: "Children and women pulled and pushed coal tubs ('corves') underground until the Mines and Collieries Act 1842 barred women and boys under ten; the 1842 Children's Employment Commission recorded their testimony.", basis: "documented",
  },
  {
    id: "trapper", scope: { years: [1750, 1843], bounds: BRITAIN }, kinds: ["coal"], depths: ["level"],
    label: "Trapper boy", dress: "miner", doing: "Minding a ventilation door", manner: "work",
    lines: [
      "I open the door when I hear the tubs coming and shut it after them. It keeps the air going round the pit.",
      "I sit here twelve hours. If I've a candle I sing. Mostly I haven't got one.",
      "If I fall asleep and the door stays open, the gas gathers up the far end. So I don't.",
    ],
    party: [1, 0, 0], women: 0.25, ages: [5, 10], lit: false, weight: 2,
    note: "Trappers, often five to eight years old, opened and shut ventilation doors in the dark; Sarah Gooder, eight, told the 1842 Commission she was afraid without a light and sometimes sang.", basis: "documented",
  },
  {
    id: "bearer", scope: { years: [1600, 1843], bounds: SCOTLAND }, kinds: ["coal"], depths: ["level", "workings"],
    label: "Coal bearer", dress: "miner", doing: "Carrying coal in a creel", manner: "crew",
    lines: [
      "I carry the coal up the ladders in a creel on my back. Two hundredweight, twenty trips a day.",
      "The strap goes round my forehead. Slip on a wet rung and you take the woman under you with you.",
      "Until a few years ago we belonged to the pit. Bound to it, mother and daughter.",
    ],
    party: [0.4, 0.4, 0.2], women: 0.9, ages: [10, 45], lit: false, weight: 3,
    note: "In east Scottish pits women and girls carried coal to the surface in creels up ladders; Scottish colliers were legally bound to their pits until Acts of 1775 and 1799. Both are documented, the 1842 report most vividly.", basis: "documented",
  },
  {
    id: "pony-driver", scope: { years: [1760, 1995] }, kinds: ["coal", "salt"], depths: ["level"],
    label: "Pony driver", dress: "miner", doing: "Leading a pit pony and its tubs", manner: "crew",
    lines: [
      "He knows the road better than me. He stops dead before a bad bit of roof, and I've learned to stop with him.",
      "The ponies live down here, in the stables by the shaft. They come up for a fortnight in the summer holiday.",
      "He'll pull six tubs and not one more. Hook on a seventh and he just stands.",
    ],
    party: [1, 0, 0], women: 0, ages: [14, 22], lit: true, weight: 3,
    note: "Pit ponies hauled tubs on underground roads from the 18th century; they were stabled below ground and in British pits brought up for annual holidays. The last British pit pony retired in 1999.", basis: "documented",
  },
  {
    id: "deputy", scope: { years: [1816, 1995] }, kinds: ["coal"], depths: ["level", "workings", "old"],
    label: "Deputy", dress: "miner", doing: "Testing for gas", manner: "explore",
    lines: [
      "I test for gas before every shift. Watch the flame. If it stretches and grows a blue cap, that's firedamp.",
      "Never take a naked light past this door. One spark in the wrong place and the whole district goes up.",
      "Blackdamp lies low and puts your lamp out. Firedamp lies high and blows you to pieces. Both kill you.",
    ],
    party: [1, 0, 0], women: 0, ages: [30, 60], lit: true, weight: 2.5,
    note: "Firemen, later deputies, inspected workings for gas with a flame safety lamp before each shift: the height and colour of the 'cap' on the flame showed the methane. Documented from the Davy lamp (1816) on.", basis: "documented",
  },
  {
    id: "fireman-penitent", scope: { years: [1600, 1816] }, kinds: ["coal"], depths: ["workings", "old"],
    label: "Fireman", dress: "miner", doing: "Burning off the gas", manner: "explore",
    lines: [
      "Before the shift I crawl in under the gas in wet sacking, with a candle on a long pole, and fire it.",
      "Keep low. When it goes, it rolls over you along the roof like a wave.",
      "They call us penitents, for the hood. I call it a living.",
    ],
    party: [1, 0, 0], women: 0, ages: [20, 50], lit: true, weight: 1,
    note: "Before safety lamps, a 'fireman' or 'penitent' in wet clothing ignited accumulations of firedamp with a candle on a pole, lying flat as it burned: documented in English and French coalfields.", basis: "documented",
  },
  {
    id: "onsetter", scope: { years: [1840, 1995] }, kinds: ["coal", "metal", "salt"], depths: ["level"],
    label: "Onsetter", dress: "miner", doing: "Loading the cage at the pit bottom", manner: "work",
    lines: [
      "I load the tubs into the cage and ring it away. One bell to stop, two to lower, three to raise.",
      "Mind the shaft. It's half a mile to the top and the cage doesn't wait.",
      "Men ride up at the end of the shift, twelve to a deck. No pushing.",
    ],
    party: [0.7, 0.3, 0], women: 0, ages: [25, 60], lit: true, weight: 1.5,
    note: "The onsetter worked the cage at the shaft bottom and signalled to the winding engineman by bell; codes varied by coalfield and were set by regulation.", basis: "documented",
  },
  {
    id: "shotfirer", scope: { years: [1870, 1995] }, kinds: ["coal", "metal"], depths: ["workings"],
    label: "Shotfirer", dress: "miner", doing: "Charging a shot hole", manner: "work",
    lines: [
      "Stand back past the corner and shout 'firing'. Then wait for the dust before you go back in.",
      "Count the shots. If you hear five and you set six, nobody goes near the face till I say so.",
      "Permitted explosives only, in a gassy pit. They burn cool, so the gas doesn't catch.",
    ],
    party: [1, 0, 0], women: 0, ages: [28, 60], lit: true, weight: 1.5,
    note: "Shot-firing with explosives was restricted to certified men in many coalfields; 'permitted' low-flame explosives were developed from the 1890s to reduce firedamp ignitions. Counting shots and treating misfires is standard practice.", basis: "documented",
  },
  {
    id: "rescue-man", scope: { years: [1900, 1990] }, kinds: ["coal"], depths: ["level", "workings", "old"],
    label: "Mine rescue man", dress: "miner", doing: "Carrying a canary in a cage", manner: "explore",
    lines: [
      "The canary goes in first. If it falls off its perch, we turn round.",
      "Afterdamp is what kills most of them, after an explosion. The blast is only the start.",
      "This is the breathing set. Two hours of oxygen, if you don't run.",
    ],
    party: [0.3, 0.4, 0.3], women: 0, ages: [25, 50], lit: true, goods: ["canary"], weight: 1,
    note: "Canaries were carried by rescue teams to detect carbon monoxide (afterdamp), following J. S. Haldane's work; British pits used them until 1986. Organised rescue brigades with breathing apparatus date from the 1900s.", basis: "documented",
  },
  {
    id: "welsh-collier", scope: { years: [1850, 1990], bounds: SOUTH_WALES }, kinds: ["coal"], depths: ["workings"],
    label: "Collier", dress: "miner", doing: "Filling a dram at the face", manner: "work",
    lines: [
      "Steam coal, this. The best in the world, they say. The navies run on it.",
      "Senghenydd, 1913. Four hundred and thirty-nine men. My uncle among them.",
      "We sing on the way down. Not for fun. It's what you do.",
    ],
    party: [0.4, 0.4, 0.2], women: 0, ages: [16, 60], lit: true, goods: ["coal"], weight: 3,
    note: "South Wales steam coal fuelled navies and steamships; the Senghenydd explosion of 14 October 1913 killed 439, Britain's worst mining disaster. Welsh mining villages' choirs are well documented.", basis: "documented",
  },
  {
    id: "ruhr-bergmann", scope: { years: [1850, 2018], bounds: RUHR }, kinds: ["coal"], depths: ["workings", "level"],
    label: "Bergmann", dress: "miner", doing: "Cutting coal at the face", manner: "work",
    lines: [
      "Glück auf! That's how we greet each other down here. It means: may the way up open for you.",
      "Half the men on this shift came from Poland, and half the rest from Turkey. Under the ground nobody cares.",
      "The coal is in a steep seam here. You work it from below and let it fall.",
    ],
    party: [0.4, 0.4, 0.2], women: 0, ages: [16, 60], lit: true, weight: 3,
    note: "'Glück auf' is the German miners' greeting; Ruhr mining drew Polish-speaking 'Ruhrpolen' from the 1870s and Turkish workers after the 1961 recruitment agreement.", basis: "documented",
  },
  {
    id: "appalachian-miner", scope: { years: [1880, 1990], bounds: APPALACHIA }, kinds: ["coal"], depths: ["workings"],
    label: "Coal miner", dress: "miner", doing: "Loading coal by hand", manner: "work",
    lines: [
      "They pay us in scrip. It's good at the company store and nowhere else.",
      "I load sixteen tons a shift and still owe them money for the powder and the lamp oil.",
      "The union man came through last month. Next week two of the men who listened were let go.",
    ],
    party: [0.4, 0.4, 0.2], women: 0, ages: [14, 60], lit: true, goods: ["coal"], weight: 3,
    note: "Company towns, scrip wages and charges for powder and tools are documented across Appalachian coal camps; the mine wars of 1912 to 1921 and 1930s Harlan County turned on unionising.", basis: "documented",
  },
  {
    id: "stakhanovite", scope: { years: [1935, 1991], bounds: DONBAS }, kinds: ["coal"], depths: ["workings"],
    label: "Shock worker", dress: "miner", doing: "Working the face with a pneumatic pick", manner: "work",
    lines: [
      "Stakhanov cut a hundred and two tons in one shift, here in the Donbas. Now they want it from all of us.",
      "Two men prop the roof while one cuts. That's how he did it. The papers left that part out.",
      "Make the norm and there's a bonus, and your photograph on the board.",
    ],
    party: [0.3, 0.5, 0.2], women: 0.1, ages: [18, 55], lit: true, weight: 3,
    note: "Aleksei Stakhanov's record of 102 tons in a shift on 31 August 1935 at the Tsentralnaya-Irmino mine was achieved with a reorganised team; it launched the Stakhanovite movement.", basis: "documented",
  },
  {
    id: "jharia-woman", scope: { years: [1894, 1937], bounds: INDIA }, kinds: ["coal"], depths: ["workings", "level"],
    label: "Coal carrier", dress: "miner", doing: "Carrying coal in a basket", manner: "crew",
    lines: [
      "My husband cuts and I carry. We're paid as one, so we work as one.",
      "The basket goes on my head. The steps up are cut in the coal and they're slippery.",
      "They say a new law will send the women out of the pits. Then what do we eat?",
    ],
    party: [0.4, 0.4, 0.2], women: 0.85, ages: [14, 45], lit: false, weight: 4,
    note: "In the Jharia and Raniganj coalfields families worked as units, women carrying coal cut by men; the Indian Mines Act regulations of 1929 phased women out of underground work by 1937.", basis: "documented",
  },
  {
    id: "atoyama", scope: { years: [1870, 1933], bounds: JAPAN }, kinds: ["coal"], depths: ["workings"],
    label: "Atoyama", dress: "miner", doing: "Hauling coal from the face in a basket", manner: "crew",
    lines: [
      "He's the sakiyama, the one who cuts. I'm the atoyama: I drag it out behind him.",
      "We go down together and come up together. Married couples mostly work as a pair.",
      "Down here it's so hot we work in a loincloth and nothing else.",
    ],
    party: [0.3, 0.7, 0], women: 0.6, ages: [16, 45], lit: true, weight: 4,
    note: "In Chikuho and Miike coal mines, couples worked as sakiyama (cutter) and atoyama (hauler) until women were barred underground in 1928, with exceptions to 1933; Yamamoto Sakubei's paintings record it.", basis: "documented",
  },
  {
    id: "chinese-collier", scope: { years: [1878, 1990], bounds: CHINA }, kinds: ["coal"], depths: ["workings", "level"],
    label: "Coal miner", dress: "miner", doing: "Dragging coal on a sledge", manner: "crew",
    lines: [
      "The foreign engineers sank the shafts. The work under them is the same as it ever was.",
      "The gang boss takes a cut of every man's pay before he gets it.",
      "We work by headlamp now, but my grandfather worked these hills by oil light, in little pits.",
    ],
    party: [0.3, 0.4, 0.3], women: 0, ages: [14, 55], lit: true, weight: 3,
    note: "Kaiping (from 1878) and Fushun were early mechanised Chinese collieries; labour contractors ('gang bosses') hired and paid miners. Small traditional coal pits long predated them.", basis: "documented",
  },
  // Metal.
  {
    id: "tributer", scope: { years: [1700, 1914], bounds: CORNWALL }, kinds: ["metal"], depths: ["workings"],
    label: "Tributer", dress: "miner", doing: "Breaking ore in a stope", manner: "work",
    lines: [
      "We bid for a pitch on setting day. Take a low share and pray the lode turns rich before the month's out.",
      "Leave the crust of your pasty for the knockers. They knock where the good ore is. Or where the roof's coming in.",
      "Seven hundred feet down, and the man-engine to climb back up. An hour, on a bad day.",
    ],
    party: [0.3, 0.5, 0.2], women: 0, ages: [16, 55], lit: true, goods: ["pasty"], weight: 4,
    note: "Cornish tributers contracted for a share of the value of ore raised from a pitch, bidding at 'setting day'; tutworkers were paid by the fathom driven. Knocker beliefs and man-engines (from 1842) are documented.", basis: "documented",
  },
  {
    id: "tutworker", scope: { years: [1700, 1914], bounds: CORNWALL }, kinds: ["metal"], depths: ["level"],
    label: "Tutworker", dress: "miner", doing: "Driving a new level", manner: "work",
    lines: [
      "Tutwork is by the fathom. Ore or no ore, I'm paid for the rock I move.",
      "Hand drill, single jack. Turn the steel a quarter each blow and keep your rhythm.",
      "Granite this, and hard. Two feet a week if we're lucky.",
    ],
    party: [0.3, 0.5, 0.2], women: 0, ages: [16, 55], lit: true, weight: 2,
    note: "Tutwork paid a fixed rate per fathom of ground driven, for development rather than ore; hand drilling by 'single jack' and 'double jack' is documented.", basis: "documented",
  },
  {
    id: "mitayo", scope: { years: [1573, 1813], bounds: POTOSI }, kinds: ["metal"], depths: ["level", "workings"],
    label: "Mita worker", dress: "miner", doing: "Carrying ore up the ladders", manner: "crew",
    lines: [
      "The mita brought me here from my village, a month's walk away. One year in seven, they say. Many don't go home.",
      "I carry the ore up on my back, up the rawhide ladders, a candle tied to my thumb.",
      "We give the Tío coca and a little to drink, so the mountain doesn't eat us.",
    ],
    party: [0.3, 0.4, 0.3], women: 0, ages: [16, 50], lit: true, goods: ["coca"], weight: 5,
    note: "Viceroy Toledo's mita (1573) drafted Andean men to Potosí for a year in seven; apiris carried ore up ladders by candlelight. Offerings to 'El Tío' are documented in Cerro Rico's mines; their colonial origins are inferred.", basis: "documented",
  },
  {
    id: "kajcha", scope: { years: [1750, 1900], bounds: POTOSI }, kinds: ["metal"], depths: ["old"],
    label: "Kajcha", dress: "miner", doing: "Taking ore from the old workings", manner: "scavenge",
    lines: [
      "Weekends the mine is ours. Whatever we take out of the old workings, we sell ourselves.",
      "The owners call it theft. We call it our wages.",
      "Keep your voice down. The guards come through on Sunday afternoons.",
    ],
    party: [0.4, 0.4, 0.2], women: 0.1, ages: [16, 45], lit: true, weight: 2,
    note: "Kajchas worked Potosí's mines on their own account at weekends from the mid-18th century, a contested practice the owners called theft.", basis: "documented",
  },
  {
    id: "barretero", scope: { years: [1546, 1910], bounds: MEXICO }, kinds: ["metal"], depths: ["workings"],
    label: "Barretero", dress: "miner", doing: "Breaking ore with a bar", manner: "work",
    lines: [
      "I break the rock. The tenateros carry it up in sacks on their backs. A barretero is worth three of them, they say.",
      "Our pay is half in silver ore, the partido. Whatever's in the sack I fill for myself is mine.",
      "Our Lady at the shaft mouth hears us both ways, in and out.",
    ],
    party: [0.4, 0.4, 0.2], women: 0, ages: [18, 55], lit: true, weight: 4,
    note: "In New Spain's silver mines barreteros broke ore and tenateros carried it; the partido, a share of ore taken as pay, was fought over through the 18th century.", basis: "documented",
  },
  {
    id: "mercury-miner", scope: { years: [1564, 1820], bounds: HUANCAVELICA }, kinds: ["metal"], depths: ["workings", "level"],
    label: "Mita worker", dress: "miner", doing: "Digging cinnabar", manner: "work",
    lines: [
      "Quicksilver gets into you. First your gums go, then your teeth, then your hands shake.",
      "They call this the mine of death. They still send us.",
      "The red ore is cinnabar. Roast it and the quicksilver runs out of it like sweat.",
    ],
    party: [0.3, 0.4, 0.3], women: 0, ages: [16, 45], lit: true, weight: 4,
    note: "Santa Bárbara at Huancavelica supplied mercury for Andean silver refining under the mita; mercury poisoning and the name 'mina de la muerte' are documented.", basis: "documented",
  },
  {
    id: "mizukae", scope: { years: [1778, 1868], bounds: SADO }, kinds: ["metal"], depths: ["old", "workings"],
    label: "Water bailer", dress: "miner", doing: "Bailing water from a sump", manner: "work",
    lines: [
      "They rounded us up off the streets of Edo for having no home and sent us here to bail.",
      "Bucket to bucket, up the shaft, all day. If the water wins, the mine floods and the gold is lost.",
      "Most men here last three years. I've done two.",
    ],
    party: [0.2, 0.4, 0.4], women: 0, ages: [16, 50], lit: false, weight: 4,
    note: "From 1778 the shogunate sent homeless men from Edo to Sado as mizukae-ninsoku, water drainers, under harsh conditions; it is documented in Sado's records and the museum at Aikawa.", basis: "documented",
  },
  {
    id: "gold-digger-west-africa", scope: { years: [700, 1950], bounds: WEST_AFRICA }, kinds: ["metal"], ores: ["gold"], depths: ["level", "workings"],
    label: "Gold digger", dress: "miner", doing: "Filling calabashes with gold-bearing earth", manner: "crew",
    lines: [
      "The men dig the shaft and the women wash what comes up. The gold goes in a quill, a little at a time.",
      "The nuggets belong to the chief. The dust is ours.",
      "We dig in the dry season. When the rains come, the shafts fall in.",
    ],
    party: [0.3, 0.4, 0.3], women: 0.4, ages: [14, 50], lit: false, weight: 4,
    note: "Bambuk, Bure and Akan gold was dug from shallow shafts in the dry season and washed largely by women; rulers' claim to nuggets is documented for Asante and Mali.", basis: "documented",
  },
  {
    id: "zimbabwe-miner", scope: { years: [1000, 1700], bounds: ZIMBABWE }, kinds: ["metal"], ores: ["gold"], depths: ["workings", "level"],
    label: "Gold miner", dress: "miner", doing: "Fire-setting a narrow stope", manner: "work",
    lines: [
      "Build a fire against the rock, then throw water on it when it's hot. It cracks, and you pick it out.",
      "The reef is narrow. Only a child or a small woman fits in the end of it.",
      "The gold goes to the zimbabwe, and to the traders at the coast.",
    ],
    party: [0.3, 0.4, 0.3], women: 0.3, ages: [10, 45], lit: true, weight: 3,
    note: "Pre-colonial gold workings on the Zimbabwe plateau followed narrow reefs by fire-setting; skeletal finds suggest small-bodied workers, possibly women and children, in the narrowest stopes.", basis: "inferred",
  },
  {
    id: "laurion-slave", scope: { years: [-600, -100], bounds: LAURION }, kinds: ["metal"], depths: ["level", "workings", "old"],
    label: "Slave miner", dress: "miner", doing: "Working a gallery by lamplight", manner: "work",
    lines: [
      "The galleries are a yard high. You work on your side with a little clay lamp that burns ten hours.",
      "Nikias owns a thousand of us and rents us out by the day. An obol each.",
      "The silver from here built their ships. None of it comes down here.",
    ],
    party: [0.3, 0.4, 0.3], women: 0, ages: [12, 45], lit: true, weight: 5,
    note: "Laurion's silver mines were worked by enslaved people, thousands at a time; Xenophon records Nikias hiring out a thousand at an obol a day. Low galleries and clay lamps are found in the workings.", basis: "documented",
  },
  {
    id: "falun-miner", scope: { years: [1600, 1992], bounds: FALUN }, kinds: ["metal"], depths: ["workings", "old"],
    label: "Miner", dress: "miner", doing: "Fire-setting the copper ore", manner: "work",
    lines: [
      "In 1719 they found a miner in an old drift, kept perfect by the vitriol water. An old woman knew him: her betrothed, lost forty-two years before.",
      "The Great Pit fell in on Midsummer's Day, 1687. Everyone was at the feast, so nobody died.",
      "This mine roofed half the churches in Europe in copper.",
    ],
    party: [0.3, 0.5, 0.2], women: 0, ages: [16, 55], lit: true, weight: 3,
    note: "Falun's 1687 collapse and the 1719 discovery of 'Fet-Mats', Mats Israelsson, preserved by vitriol and recognised by his former fiancée, are documented.", basis: "documented",
  },
  {
    id: "rand-miner", scope: { years: [1886, 1994], bounds: WITWATERSRAND }, kinds: ["metal"], depths: ["workings", "level"],
    label: "Mine worker", dress: "miner", doing: "Running a rock drill", manner: "work",
    lines: [
      "I came from Mozambique on a contract. Eighteen months, then home, then back again.",
      "We sleep in the compound, twenty to a room. Down here we speak Fanakalo, so every man understands the boss.",
      "It's two miles down. The rock is hot to touch, and they pump in cold air so we don't cook.",
    ],
    party: [0.3, 0.4, 0.3], women: 0, ages: [18, 50], lit: true, weight: 4,
    note: "Rand gold mines relied on migrant contract labour, much from Mozambique, housed in compounds; Fanakalo served as a mine lingua franca. The deepest mines reached rock temperatures needing refrigerated ventilation.", basis: "documented",
  },
  {
    id: "kolar-miner", scope: { years: [1880, 2001], bounds: KOLAR }, kinds: ["metal"], ores: ["gold"], depths: ["workings"],
    label: "Mine worker", dress: "miner", doing: "Shoring up after a rockburst", manner: "crew",
    lines: [
      "This is one of the deepest mines in the world. Sometimes the rock just bursts, with no warning.",
      "My people came from Tamil country to work here. Three generations under Kolar.",
      "The town had electric light before Bangalore, because of the mine.",
    ],
    party: [0.3, 0.4, 0.3], women: 0, ages: [18, 55], lit: true, weight: 3,
    note: "Kolar Gold Fields reached over 3 km deep with frequent rockbursts; its workforce was largely Tamil, and it was electrified from the Shivanasamudra plant in 1902.", basis: "documented",
  },
  {
    id: "hardrock-miner", scope: { years: [1859, 1990], bounds: NEVADA_MONTANA }, kinds: ["metal"], depths: ["workings", "level"],
    label: "Hard-rock miner", dress: "miner", doing: "Single-jacking a drill hole", manner: "work",
    lines: [
      "Down at the two-thousand-foot level the water's hot enough to scald. We get ice by the bucket and chew it.",
      "Square-set timbering. You fill the hole in the mountain with a forest, one box at a time.",
      "Cousin Jacks run the shifts. Cornish, every one. They know the rock.",
    ],
    party: [0.3, 0.5, 0.2], women: 0, ages: [18, 55], lit: true, weight: 3,
    note: "Comstock mines met scalding water and heat at depth, eased with ice rations; Philip Deidesheimer's square-set timbering (1860) began there. Cornish miners ('Cousin Jacks') were prominent across the US West.", basis: "documented",
  },
  // Salt.
  {
    id: "salt-miner", scope: { years: [1250, 1996], bounds: WIELICZKA }, kinds: ["salt"], depths: ["level", "workings"],
    label: "Salt miner", dress: "miner", doing: "Cutting a salt block", manner: "work",
    lines: [
      "Lick the wall if you don't believe me. It's all salt, every chamber of it.",
      "In our spare time we carve. There's a whole chapel down here, chandeliers and all, cut out of the rock.",
      "The horses never see daylight once they come down. They're lowered in a sling.",
    ],
    party: [0.3, 0.5, 0.2], women: 0, ages: [16, 60], lit: true, goods: ["salt"], weight: 5,
    note: "Wieliczka's miners carved chapels and statues from rock salt, St Kinga's Chapel from 1896; horses worked underground there from the 16th century to 2002.", basis: "documented",
  },
  {
    id: "hallstatt-miner", scope: { years: [-1500, -400], bounds: HALLSTATT }, kinds: ["salt"], depths: ["level", "workings"],
    label: "Salt miner", dress: "miner", doing: "Hacking salt with a bronze pick", manner: "work",
    lines: [
      "We hack the salt into hearts and slabs and carry them up in leather packs.",
      "Pine spills for light. Bundles of them, burnt down to the fingers and dropped where you stand.",
      "We eat down here. Beans and barley stew from the big pot. Mind where you squat after.",
    ],
    party: [0.3, 0.5, 0.2], women: 0.3, ages: [10, 45], lit: true, goods: ["salt"], weight: 5,
    note: "Hallstatt's Bronze and Iron Age salt mines preserved leather backpacks, bronze picks, burnt pine spills, a bean-and-barley stew and human coprolites; women and children worked there, inferred from wear on skeletons.", basis: "documented",
  },
  // Anywhere.
  {
    id: "surveyor", scope: { years: [1700, 2030] }, depths: ["level", "workings", "old"],
    label: "Mine surveyor", dress: "miner", doing: "Taking bearings with a dial", manner: "explore",
    lines: [
      "If I'm a few feet out, the next level breaks into old flooded workings and drowns the lot of us.",
      "Every road in the mine goes on the plan. This plan is the most valuable thing in the place.",
      "The compass is no good near the rails, so I hang the dial on a string.",
    ],
    party: [0.6, 0.4, 0], women: 0, ages: [22, 60], lit: true, weight: 1,
    note: "Mine surveyors kept the underground plans; holing into old flooded workings caused disasters such as Heaton Main Colliery in 1815. The miner's dial hung on a cord is documented.", basis: "documented",
  },
  {
    id: "inspector", scope: { years: [1850, 2030] }, depths: ["level", "workings"],
    label: "Mines inspector", dress: "miner", doing: "Writing up the ventilation", manner: "explore",
    lines: [
      "I go where the men say the air is bad, not where the manager takes me.",
      "Half of what I find, the owners have known about for months.",
      "The law says a second way out from every pit. This one hasn't got it.",
    ],
    party: [0.6, 0.4, 0], women: 0, ages: [35, 65], lit: true, weight: 0.8,
    note: "Government mines inspectorates date from 1850 in Britain; the requirement for two shafts followed the Hartley disaster of 1862.", basis: "documented",
  },
  {
    id: "mine-explorer", scope: { years: [1970, 2030] }, depths: ["old"],
    label: "Mine explorer", dress: "construction-labourer", doing: "Photographing old workings", manner: "explore",
    lines: [
      "Don't touch the timber. A hundred years old and it looks fine until it isn't.",
      "Bad air sits in the low spots. If your head starts aching, turn round.",
      "We log every find and leave it where it is. Mostly.",
    ],
    party: [0.2, 0.5, 0.3], women: 0.3, ages: [20, 55], lit: true, weight: 1.2,
    note: "Mine exploration as a hobby, with an ethic of recording and leaving finds, is documented in Britain and the US from the 1970s; hazards of bad air and failing timber are standard warnings.", basis: "documented",
  },
  {
    id: "germany-bergmann-old", scope: { years: [1450, 1850], bounds: GERMANY }, kinds: ["metal"], depths: ["workings", "level"],
    label: "Bergmann", dress: "miner", doing: "Driving a gallery with hammer and gad", manner: "work",
    lines: [
      "Glück auf! The mine master reads the vein by the stones in the stream. Agricola wrote it all in a book.",
      "We wear the leather apron behind, to sit on. You'll see why when you've slid down a ladder.",
      "The water wheels pump day and night. If they stop, the deep levels drown by morning.",
    ],
    party: [0.3, 0.5, 0.2], women: 0, ages: [14, 55], lit: true, weight: 3,
    note: "Saxon and Harz mining is documented in Agricola's De re metallica (1556): hammer-and-gad work, the leather 'Arschleder', and water-wheel pumping.", basis: "documented",
  },
  {
    id: "andean-miner-modern", scope: { years: [1900, 2030], bounds: ANDES }, kinds: ["metal"], depths: ["workings", "level", "old"],
    label: "Cooperative miner", dress: "miner", doing: "Chewing coca before the shift", manner: "crew",
    lines: [
      "We chew coca for three hours before we go in. It keeps the hunger off and tells you when the air is bad.",
      "The cooperative works the old levels the companies gave up on.",
      "Every Friday we bring the Tío cigarettes and alcohol. He owns everything down here.",
    ],
    party: [0.3, 0.4, 0.3], women: 0.05, ages: [14, 55], lit: true, goods: ["coca"], weight: 3,
    note: "Bolivian cooperative miners work Cerro Rico and other old mines; chewing coca and Friday offerings to El Tío are documented ethnographically.", basis: "documented",
  },
];
