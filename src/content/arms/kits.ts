import type { CharacterAppearance } from "../../core/character";

/** One kind of fighter: who they are dressed as, what is in their hands, and
 * how well they use it. `place`, `year` and `role` go to the wardrobe, which
 * dresses them as it would in the game; `wear` pins what must not vary. */
export type Kit = {
  id: string;
  name: string;
  region: string;
  place: string;
  year: number;
  role: string;
  main: string;
  side?: string;
  /** Carried besides: X goes round all of them. */
  more?: string[];
  wear?: Partial<CharacterAppearance["wearing"]>;
  mounted?: boolean;
  /** 0 a frightened levy, 1 a lifetime of training. Sets reactions, aim and nerve. */
  skill: number;
  note: string;
};

const NONE = { armour: "none", shield: "none" } as const;
const k = (region: string, id: string, name: string, place: string, year: number, role: string, main: string, skill: number, note: string, rest: Partial<Kit> = {}): Kit =>
  ({ id, name, region, place, year, role, main, skill, note, ...rest });

export const kits: readonly Kit[] = [
  k("Anywhere", "brawler", "Brawler", "london", 1750, "labourer", "fist", 0.35, "No weapon and no training: fists, a shove, a throw.", { wear: NONE }),
  k("Anywhere", "robber", "Road robber", "york", 1300, "Outlaw", "cudgel", 0.4, "A cudgel and a knife, and no wish for a fair fight.", { side: "dagger", wear: NONE }),
  k("Anywhere", "hunter", "Stone Age hunter", "great-plains-early", -8000, "hunter", "spear", 0.5, "A fire-hardened or stone-tipped spear, thrown or thrust.", { side: "assegai", wear: NONE }),

  k("Europe", "hoplite", "Hoplite", "athens", -400, "hoplite", "dory", 0.65, "Bronze, a three-foot shield and a spear. Fights shoulder to shoulder or not at all.", { side: "sword", wear: { armour: "cuirass", shield: "round", headwear: "helmet" } }),
  k("Europe", "phalangite", "Macedonian phalangite", "athens", -330, "phalangite", "sarissa", 0.6, "Both hands on an eighteen-foot pike, a small shield slung from the neck.", { side: "dagger", wear: { armour: "quilted", shield: "none", headwear: "helmet" } }),
  k("Europe", "legionary", "Roman legionary", "rome", 100, "legionary", "gladius", 0.7, "Throws the pilum, then closes behind the big shield and stabs.", { side: "pilum", more: ["dagger"], wear: { armour: "mail", shield: "tall", headwear: "helmet" } }),
  k("Europe", "warband", "Germanic warrior", "york", 500, "warrior", "spear", 0.45, "A spear, a round shield, and courage that comes and goes with the war leader.", { side: "war-axe", wear: { armour: "none", shield: "round" } }),
  k("Europe", "huscarl", "Huscarl", "york", 1066, "warrior", "dane-axe", 0.75, "A household man in mail with the two-handed axe.", { side: "sword", wear: { armour: "mail", shield: "none", headwear: "nasal" } }),
  k("Europe", "fyrd", "Shield-wall spearman", "york", 1066, "warrior", "spear", 0.45, "A farmer called out for the season, safe only while the wall holds.", { wear: { armour: "quilted", shield: "round" } }),
  k("Europe", "norman-knight", "Norman knight", "london", 1100, "man-at-arms", "lance", 0.75, "Mail to the knee, a kite shield, and a horse trained to charge.", { side: "sword", mounted: true, wear: { armour: "mail", shield: "tall", headwear: "nasal" } }),
  k("Europe", "longbowman", "English longbowman", "london", 1415, "longbowman", "longbow", 0.7, "Trained from boyhood. Ten arrows a minute, and a mallet for the knights stuck in the mud.", { side: "dagger", wear: { armour: "quilted", shield: "none", headwear: "kettle" } }),
  k("Europe", "man-at-arms", "Man-at-arms on foot", "paris", 1415, "man-at-arms", "poleaxe", 0.75, "Full plate, on foot, with the weapon made to open it.", { side: "longsword", wear: { armour: "cuirass", shield: "none", headwear: "helmet" } }),
  k("Europe", "knight", "French knight", "paris", 1415, "man-at-arms", "lance", 0.8, "Plate harness, a couched lance and three generations of certainty that nothing on foot can stand.", { side: "sword", mounted: true, wear: { armour: "cuirass", shield: "none", headwear: "helmet" } }),
  k("Europe", "crossbowman", "Genoese crossbowman", "paris", 1415, "crossbowman", "crossbow", 0.55, "A hired professional who shoots from behind a big standing shield.", { side: "sword", wear: { armour: "quilted", shield: "none", headwear: "kettle" } }),
  k("Europe", "pikeman", "Swiss pikeman", "city-zurich", 1500, "pikeman", "pike", 0.7, "A block of pikes that moved fast and took no prisoners.", { side: "dagger", wear: { armour: "none", shield: "none" } }),
  k("Europe", "landsknecht", "Landsknecht", "city-zurich", 1525, "soldier", "zweihander", 0.7, "A double-pay man with a two-handed sword, sent to break into the pikes.", { wear: { armour: "cuirass", shield: "none" } }),
  k("Europe", "halberdier", "Halberdier", "city-zurich", 1500, "halberdier", "halberd", 0.65, "Stands inside the pike block and comes out when the lines lock.", { wear: { armour: "cuirass", shield: "none", headwear: "kettle" } }),
  k("Europe", "arquebusier", "Arquebusier", "city-seville", 1525, "arquebusier", "arquebus", 0.5, "One shot that plate cannot stop, then a long time doing nothing useful.", { side: "sword", wear: { armour: "none", shield: "none" } }),
  k("Europe", "rodelero", "Conquistador", "city-seville", 1520, "soldier", "sword", 0.75, "Steel sword, steel cap and a round shield: almost untouchable by obsidian.", { wear: { armour: "cuirass", shield: "round", headwear: "kettle" } }),
  k("Europe", "jinete", "Spanish horseman", "city-seville", 1520, "soldier", "lance", 0.75, "Sixteen of these were worth more to Cortés than five hundred foot.", { side: "sword", mounted: true, wear: { armour: "cuirass", shield: "none", headwear: "kettle" } }),
  k("Europe", "duellist", "Duellist", "paris", 1650, "gentleman", "rapier", 0.8, "No armour and no shield: everything is distance and timing.", { side: "dagger", wear: NONE }),
  k("Europe", "highlander", "Highland clansman", "york", 1745, "warrior", "sword", 0.6, "Broadsword and targe. One volley to get through, then the charge.", { wear: { armour: "none", shield: "round", headwear: "tam" } }),
  k("Europe", "redcoat", "Redcoat", "london", 1750, "musketeer", "musket", 0.6, "Three volleys a minute in line, then the bayonet.", { side: "sword", wear: { ...NONE, color: "#a8362c" } }),
  k("Europe", "cuirassier", "Cuirassier", "paris", 1810, "dragoon", "sabre", 0.7, "A big man on a big horse in a steel breastplate, for breaking squares that have already wavered.", { side: "pistol", mounted: true, wear: { armour: "cuirass", shield: "none" } }),
  k("Europe", "redcoat-1879", "British rifleman, 1879", "london", 1879, "soldier", "rifle", 0.6, "A single-shot breech-loader: twelve rounds a minute until the cartridges run short.", { wear: { ...NONE, color: "#a8362c", headwear: "pith-helmet" } }),
  k("Europe", "tommy", "British infantryman, 1916", "london", 1916, "soldier", "rifle", 0.55, "Rifle, bayonet, grenades and sixty pounds of kit.", { side: "grenade", more: ["cudgel"], wear: { ...NONE, headwear: "helmet" } }),
  k("Europe", "landser", "German infantryman, 1916", "city-berlin", 1916, "soldier", "rifle", 0.6, "Dug in, with the wire in front and the guns registered on it.", { side: "grenade", wear: { ...NONE, headwear: "helmet" } }),
  k("Europe", "machine-gunner", "Machine-gunner", "city-berlin", 1916, "soldier", "machine-gun", 0.65, "Sweeps a fixed arc. The men in front of it never see him.", { side: "pistol", wear: { ...NONE, headwear: "helmet" } }),

  k("West Asia and the steppe", "egyptian", "New Kingdom soldier", "nile", -1300, "soldier", "khopesh", 0.55, "A sickle-sword and an oxhide shield, behind the chariots.", { wear: { armour: "none", shield: "tall", headwear: "nemes" } }),
  k("West Asia and the steppe", "immortal", "Persian Immortal", "city-isfahan", -480, "spearman", "spear", 0.6, "A spear, a bow and a wicker shield. Good at range, short-armed against hoplites.", { side: "bow", wear: { armour: "quilted", shield: "tall" } }),
  k("West Asia and the steppe", "mamluk", "Mamluk", "konya", 1260, "mamluk", "composite-bow", 0.85, "A slave soldier trained for years in the bow, the lance and the sabre, all from the saddle.", { side: "sabre", mounted: true, wear: { armour: "mail", shield: "round" } }),
  k("West Asia and the steppe", "janissary", "Janissary", "city-istanbul", 1600, "janissary", "arquebus", 0.7, "The sultan's standing infantry, early and expert with the matchlock.", { side: "sabre", wear: NONE }),
  k("West Asia and the steppe", "horse-archer", "Mongol horse archer", "mongolia", 1250, "horseman", "composite-bow", 0.8, "Shoots at the gallop, forward or back, and never stays to be hit.", { side: "sabre", mounted: true, wear: { armour: "none", shield: "none" } }),
  k("West Asia and the steppe", "mongol-lancer", "Mongol heavy lancer", "mongolia", 1250, "horseman", "lance", 0.8, "Lamellar for man and horse. Goes in once the arrows have opened the ranks.", { side: "sabre", mounted: true, wear: { armour: "lamellar", shield: "none" } }),

  k("South and East Asia", "rajput", "Rajput swordsman", "delhi", 1500, "warrior", "talwar", 0.75, "Talwar and a small steel-bossed shield.", { wear: { armour: "mail", shield: "round" } }),
  k("South and East Asia", "ming-spearman", "Ming spearman", "beijing", 1400, "spearman", "spear", 0.55, "The spear was called the king of weapons, and most soldiers carried one.", { wear: { armour: "lamellar", shield: "none" } }),
  k("South and East Asia", "guandao", "Glaive guard", "beijing", 1400, "guard", "glaive", 0.65, "A heavy blade on a pole, as much a test of strength as a weapon.", { wear: { armour: "lamellar", shield: "none" } }),
  k("South and East Asia", "samurai", "Samurai", "kyoto", 1560, "samurai", "katana", 0.85, "Lacquered lamellar and two swords. Trained in the bow before the sword.", { side: "yumi", more: ["dagger"], wear: { armour: "lamellar", shield: "none", headwear: "kabuto" } }),
  k("South and East Asia", "mounted-samurai", "Mounted samurai", "kyoto", 1575, "samurai", "yari", 0.85, "The Takeda horsemen were thought the best in Japan, until Nagashino.", { side: "katana", mounted: true, wear: { armour: "lamellar", shield: "none", headwear: "kabuto" } }),
  k("South and East Asia", "ashigaru", "Ashigaru spearman", "kyoto", 1560, "ashigaru", "yari", 0.5, "A foot soldier in a loaned breastplate and a conical hat.", { wear: { armour: "lamellar", shield: "none", headwear: "conical" } }),
  k("South and East Asia", "teppo", "Ashigaru gunner", "kyoto", 1575, "ashigaru", "arquebus", 0.5, "Japan made more matchlocks than any country in Europe within a generation of first seeing one.", { side: "katana", wear: { armour: "lamellar", shield: "none", headwear: "conical" } }),
  k("South and East Asia", "ronin", "Ronin", "kyoto", 1750, "samurai", "katana", 0.8, "No lord and no armour. The sword is drawn and cutting in one movement.", { wear: NONE }),
  k("South and East Asia", "kris-warrior", "Javanese warrior", "java", 1600, "warrior", "spear", 0.6, "A spear and a long shield, with the kris in the sash.", { side: "kris", wear: { armour: "none", shield: "tall" } }),

  k("Africa", "zulu", "Zulu warrior", "ethiopia", 1820, "warrior", "iklwa", 0.7, "Runs barefoot at the enemy, hooks the shield aside and stabs underarm.", { side: "assegai", wear: { armour: "none", shield: "tall", shieldMark: "cowhide", shieldColor: "#e6dccb", headwear: "band" } }),
  k("Africa", "sahel-cavalry", "Sahel cavalryman", "timbuktu", 1450, "horseman", "lance", 0.7, "Quilted cotton for horse and rider: the armoured cavalry of Mali and Songhai.", { side: "sword", mounted: true, wear: { armour: "quilted", shield: "round" } }),
  k("Africa", "ethiopian", "Ethiopian spearman", "ethiopia", 1500, "warrior", "spear", 0.55, "Two spears and a round hide shield.", { side: "assegai", wear: { armour: "none", shield: "round" } }),

  k("Americas and the Pacific", "jaguar", "Jaguar warrior", "mexico", 1500, "warrior", "macuahuitl", 0.75, "Wins rank by taking captives alive, so he strikes to stun as well as to kill.", { side: "atlatl", wear: { armour: "quilted", shield: "round", headwear: "jaguar" } }),
  k("Americas and the Pacific", "aztec-levy", "Aztec commoner", "mexico", 1500, "warrior", "atlatl", 0.45, "A sling or a dart-thrower and no armour, behind the men of rank.", { side: "cudgel", wear: { armour: "none", shield: "round" } }),
  k("Americas and the Pacific", "inca", "Inca soldier", "cusco", 1450, "warrior", "star-mace", 0.55, "A star-headed mace, a quilted tunic and a sling.", { side: "sling", wear: { armour: "quilted", shield: "round" } }),
  k("Americas and the Pacific", "plains", "Plains horseman", "great-plains-early", 1780, "warrior", "bow", 0.75, "A short bow shot from a running horse, and a lance for counting coup.", { side: "lance", mounted: true, wear: NONE }),
  k("Americas and the Pacific", "toa", "Maori toa", "polynesia", 1600, "warrior", "taiaha", 0.75, "Fights with the taiaha in constant movement and finishes with the mere.", { side: "mere", wear: NONE }),
];
export const kitById = new Map(kits.map((kit) => [kit.id, kit]));
