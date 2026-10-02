import type { CharacterScope } from "../characters/context-types";

/** News of the wider world as it might have reached an ordinary household:
 * one sentence, true for the whole span, with at most one term glossed.
 * `{here}` is the settlement's name; braces mark the glossed term. */
export type Tiding = {
  scope: CharacterScope;
  text: string;
  note?: string;
};

/** Astronomical year for a BCE date, since scopes count 1 BCE as 0. */
const B = (year: number) => 1 - year;

const LEVANT = [33.5, 29, 38.5, 37] as const;
const EGYPT = [29, 22, 34, 31.6] as const;
const AEGEAN = [19.5, 34.8, 28.5, 41.5] as const;
const ITALY = [6.5, 36.5, 18.6, 47] as const;
const MESOPOTAMIA = [38, 29, 50, 38] as const;
const BRITAIN = [-8, 49.5, 2, 59] as const;
const FRANCE = [-5, 42, 8, 51.2] as const;
const CHINA = [100, 20, 125, 42] as const;
const JAPAN = [129, 30, 146, 46] as const;
const INDIA = [68, 6, 92, 35] as const;
const MEXICO = [-100, 14, -86, 22] as const;
const ANDES = [-81, -26, -65, -8] as const;
const CARIBBEAN = [-86, 10, -59, 27] as const;
const ANATOLIA = [26, 36, 45, 42.5] as const;
const RUS = [22, 45, 45, 60] as const;
const SAHEL_WEST = [-12, 10, 0, 18] as const;
/** Everywhere that heard of Alexander. */
const ALEXANDER = [18, 22, 75, 45] as const;
/** Europe, North Africa and western Asia: the plague's and the volcano's reach. */
const WEST_EURASIA = [-12, 25, 50, 62] as const;

export const TIDINGS: readonly Tiding[] = [
  { scope: { years: [B(1760), B(1750)], bounds: MESOPOTAMIA }, text: "King Hammurabi has had his laws cut into stone and set up for anyone to read, which is to say for the scribes." },
  { scope: { years: [B(587), B(580)], bounds: LEVANT }, text: "The {Babylonians} have burned Jerusalem and carried its leading families off to Babylon.", note: "Nebuchadnezzar II took Jerusalem in 587 or 586 BCE and destroyed the Temple." },
  { scope: { years: [B(539), B(537)], bounds: MESOPOTAMIA }, text: "{Cyrus} the Persian has taken Babylon, and the city opened its gates to him.", note: "Cyrus II of Persia entered Babylon in October 539 BCE." },
  { scope: { years: [B(538), B(520)], bounds: LEVANT }, text: "{Cyrus} the Persian has let the exiles in Babylon go home, and some of them have come.", note: "Cyrus II of Persia, conqueror of Babylon in 539 BCE." },
  { scope: { years: [B(480), B(478)], bounds: AEGEAN }, text: "The Persian king {Xerxes} has crossed into Greece with an army nobody can count.", note: "Xerxes I invaded Greece in 480 BCE; his fleet was beaten at Salamis that autumn." },
  { scope: { years: [B(431), B(404)], bounds: AEGEAN }, text: "Athens and Sparta are at war, and there is no sign of it ending." },
  { scope: { years: [B(399), B(398)], bounds: AEGEAN }, text: "In Athens they have put the philosopher {Socrates} to death.", note: "Socrates was tried for impiety and executed by hemlock in 399 BCE." },
  { scope: { years: [B(338), B(336)], bounds: AEGEAN }, text: "{Philip} of Macedon has beaten Athens and Thebes at Chaeronea.", note: "Philip II, father of Alexander, won at Chaeronea in 338 BCE." },
  { scope: { years: [B(332), B(330)], bounds: LEVANT }, text: "{Alexander} of Macedon has taken Tyre and Gaza, and the Persian governors are gone.", note: "Alexander III besieged Tyre for seven months and Gaza for two in 332 BCE." },
  { scope: { years: [B(332), B(330)], bounds: EGYPT }, text: "{Alexander} of Macedon has come to Egypt, been made pharaoh, and gone again.", note: "Alexander III took Egypt from the Persians in 332 BCE and founded Alexandria." },
  { scope: { years: [B(323), B(322)], bounds: ALEXANDER }, text: "Word has come from Babylon that {Alexander} is dead, and nobody knows who rules now.", note: "Alexander III died in Babylon in June 323 BCE, aged thirty-two." },
  { scope: { years: [B(319), B(315)], bounds: LEVANT }, text: "{Ptolemy} of Egypt has taken the coast from Laomedon, though nobody in {here} has laid eyes on either of them.", note: "Ptolemy I, Alexander's general and ruler of Egypt, seized Syria and Phoenicia in 319 BCE." },
  { scope: { years: [B(261), B(259)], bounds: INDIA }, text: "King {Ashoka} has conquered Kalinga, and is said to be sorry for it.", note: "Ashoka's thirteenth rock edict records his remorse for the dead of Kalinga." },
  { scope: { years: [B(221), B(218)], bounds: CHINA }, text: "The king of Qin has conquered the last of the other kingdoms, and calls himself the {First Emperor}.", note: "Ying Zheng, Qin Shi Huang, unified China in 221 BCE." },
  { scope: { years: [B(218), B(215)], bounds: ITALY }, text: "{Hannibal} has crossed the Alps with an army and elephants, and beaten every army sent against him.", note: "Hannibal Barca of Carthage invaded Italy in 218 BCE and won at Cannae in 216." },
  { scope: { years: [B(167), B(160)], bounds: LEVANT }, text: "In the hills the sons of {Mattathias} are fighting the king's soldiers.", note: "The Maccabees, whose revolt against Antiochus IV began in 167 BCE." },
  { scope: { years: [B(146), B(145)], bounds: AEGEAN }, text: "The Romans have sacked Corinth and sold its people." },
  { scope: { years: [B(63), B(61)], bounds: LEVANT }, text: "{Pompey} has taken Jerusalem for Rome, and walked into the holy of holies.", note: "Gnaeus Pompeius Magnus took the Temple Mount in 63 BCE." },
  { scope: { years: [B(44), B(43)], bounds: ITALY }, text: "{Caesar} has been stabbed to death in the senate house.", note: "Gaius Julius Caesar was killed on the Ides of March, 44 BCE." },
  { scope: { years: [B(30), B(28)], bounds: EGYPT }, text: "{Cleopatra} is dead, and Egypt belongs to Rome.", note: "Cleopatra VII died in August 30 BCE, after Octavian took Alexandria." },
  { scope: { years: [43, 45], bounds: BRITAIN }, text: "The Romans have landed in the south, and their emperor came with elephants." },
  { scope: { years: [60, 62], bounds: BRITAIN }, text: "{Boudica} of the Iceni has burned Londinium, and the Romans have had their revenge.", note: "Boudica led the revolt of 60 or 61 CE and was defeated in the Midlands." },
  { scope: { years: [66, 70], bounds: LEVANT }, text: "Judea is at war with Rome." },
  { scope: { years: [70, 74], bounds: LEVANT }, text: "The Romans under {Titus} have taken Jerusalem and burned the Temple.", note: "Titus, son of the emperor Vespasian, took the city in 70 CE." },
  { scope: { years: [79, 81], bounds: [13.8, 40.5, 15.2, 41.2] }, text: "The mountain has buried Pompeii and Herculaneum in ash." },
  { scope: { years: [184, 186], bounds: CHINA }, text: "The {Yellow Turbans} have risen, and the countryside is in arms.", note: "A millenarian Daoist rebellion against the Han, from 184 CE." },
  { scope: { years: [410, 411], bounds: ITALY }, text: "The Goths under {Alaric} have sacked Rome.", note: "Alaric's Visigoths took the city in August 410, the first time in eight hundred years." },
  { scope: { years: [476, 477], bounds: ITALY }, text: "In Ravenna a German general has sent the last emperor in the west into retirement, and hardly anyone has noticed." },
  { scope: { years: [536, 538], bounds: WEST_EURASIA }, text: "All year the sun has been as dim as the moon, and the harvest is failing." },
  { scope: { years: [636, 640], bounds: LEVANT }, text: "The Arab armies have beaten the Romans at the {Yarmuk}, and the Roman governors have gone.", note: "The Battle of the Yarmuk, August 636 CE." },
  { scope: { years: [641, 643], bounds: EGYPT }, text: "The Arabs under {Amr} have taken Alexandria.", note: "Amr ibn al-As conquered Egypt between 639 and 642 CE." },
  { scope: { years: [755, 763], bounds: CHINA }, text: "The general {An Lushan} has rebelled, and the emperor has fled the capital.", note: "The An Lushan rebellion against the Tang, 755–763 CE." },
  { scope: { years: [969, 972], bounds: EGYPT }, text: "The {Fatimids} have taken Egypt and are building a new city beside Fustat.", note: "The Fatimid general Jawhar founded Cairo in 969 CE." },
  { scope: { years: [1066, 1068], bounds: BRITAIN }, text: "Duke {William} of Normandy has killed King Harold and taken the kingdom.", note: "William I won at Hastings on 14 October 1066." },
  { scope: { years: [1099, 1101], bounds: LEVANT }, text: "Franks from the west have taken Jerusalem and killed most of the people in it." },
  { scope: { years: [1127, 1129], bounds: CHINA }, text: "The {Jurchen} have taken Kaifeng and carried the emperor off to the north.", note: "The Jin took the Song capital in the Jingkang incident of 1127." },
  { scope: { years: [1187, 1189], bounds: LEVANT }, text: "{Saladin} has beaten the Franks at Hattin and taken Jerusalem back.", note: "Salah ad-Din won at Hattin in July 1187 and entered Jerusalem in October." },
  { scope: { years: [1215, 1216], bounds: BRITAIN }, text: "The barons have made King John put his seal to a {charter} at Runnymede.", note: "Magna Carta, sealed in June 1215 and annulled by the Pope within months." },
  { scope: { years: [1240, 1242], bounds: RUS }, text: "The Mongols have burned Kiev." },
  { scope: { years: [1258, 1260], bounds: MESOPOTAMIA }, text: "The Mongols have taken Baghdad and killed the caliph." },
  { scope: { years: [1279, 1281], bounds: CHINA }, text: "The last Song emperor has drowned, and the Mongols hold all of China." },
  { scope: { years: [1324, 1327], bounds: SAHEL_WEST }, text: "{Mansa Musa} has gone to Mecca with so much gold that he has spoiled its price in Cairo.", note: "The pilgrimage of Musa I of Mali, 1324–1325." },
  { scope: { years: [1347, 1352], bounds: WEST_EURASIA }, text: "A {sickness} is moving along the roads from the ports, and where it comes it kills half the people.", note: "The Black Death, plague, which reached the Mediterranean in 1347." },
  { scope: { years: [1381, 1382], bounds: BRITAIN }, text: "The commons of Kent and Essex have risen and marched on London." },
  { scope: { years: [1453, 1455], bounds: ANATOLIA }, text: "The sultan {Mehmed} has taken Constantinople.", note: "Mehmed II took the city on 29 May 1453." },
  { scope: { years: [1492, 1494], bounds: CARIBBEAN }, text: "Strange ships have come to the islands from the east, full of hungry men." },
  { scope: { years: [1516, 1518], bounds: LEVANT }, text: "The Ottoman sultan {Selim} has beaten the Mamluks, and the country has a new master.", note: "Selim I won at Marj Dabiq in 1516 and took Cairo in 1517." },
  { scope: { years: [1519, 1521], bounds: MEXICO }, text: "Strangers with metal clothes and deer as big as houses have landed on the coast." },
  { scope: { years: [1521, 1523], bounds: MEXICO }, text: "Tenochtitlan has fallen to the Spaniards and their allies." },
  { scope: { years: [1526, 1528], bounds: INDIA }, text: "{Babur} has beaten the sultan of Delhi at Panipat.", note: "Zahir-ud-din Babur founded the Mughal empire in 1526." },
  { scope: { years: [1527, 1528], bounds: ITALY }, text: "The emperor's unpaid soldiers have sacked Rome." },
  { scope: { years: [1532, 1534], bounds: ANDES }, text: "The Spaniards have seized the Inca {Atahualpa} at Cajamarca.", note: "Atahualpa was taken in November 1532 and killed the next July." },
  { scope: { years: [1600, 1602], bounds: JAPAN }, text: "{Tokugawa Ieyasu} has won at Sekigahara, and the wars are said to be over.", note: "The battle of October 1600 led to the Tokugawa shogunate." },
  { scope: { years: [1644, 1646], bounds: CHINA }, text: "Beijing has fallen, and the last Ming emperor has hanged himself." },
  { scope: { years: [1649, 1650], bounds: BRITAIN }, text: "The king has been beheaded at Whitehall." },
  { scope: { years: [1666, 1667], bounds: BRITAIN }, text: "Most of the City of London has burned." },
  { scope: { years: [1789, 1790], bounds: FRANCE }, text: "In Paris the people have taken the Bastille." },
  { scope: { years: [1793, 1794], bounds: FRANCE }, text: "The king has been guillotined in Paris." },
  { scope: { years: [1815, 1816], bounds: BRITAIN }, text: "{Wellington} has beaten Bonaparte at Waterloo.", note: "Arthur Wellesley, Duke of Wellington, 18 June 1815." },
  { scope: { years: [1816, 1817], bounds: [-100, 25, 40, 62] }, text: "Summer has not come this year, and nobody can say why." },
  { scope: { years: [1853, 1855], bounds: JAPAN }, text: "Black ships from America have anchored off Edo and will not leave." },
  { scope: { years: [1853, 1865], bounds: CHINA }, text: "The {Taiping} rebels hold Nanjing.", note: "The Taiping Heavenly Kingdom, led by Hong Xiuquan, 1851–1864." },
  { scope: { years: [1857, 1859], bounds: INDIA }, text: "The sepoys have risen against the Company." },
];
