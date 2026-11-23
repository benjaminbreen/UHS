/** What a unit has been told to do. `loose` stands and shoots; `skirmish`
 * shoots and keeps its distance. */
export type Order = "hold" | "advance" | "charge" | "loose" | "skirmish" | "fallback";
export type Ground = "grass" | "dirt" | "sand" | "mud" | "snow";
export type TerrainKind = "trench" | "wire" | "mud" | "stakes" | "wall";
export type Terrain = { kind: TerrainKind; x: number; y: number; w: number; h: number };

export type UnitSpec = {
  name: string;
  kit: string;
  count: number;
  /** Ranks deep; the files follow from the count. */
  ranks: number;
  /** Centre, in tiles. Side 0 faces east and side 1 west. */
  at: [number, number];
  /** Tiles between men. A pike block is 0.8, skirmishers 2. */
  gap?: number;
  order: Order;
  /** Orders that follow, by the second they are given. */
  then?: [number, Order][];
};
export type Battle = {
  id: string;
  name: string;
  when: string;
  note: string;
  ground: Ground;
  size: [number, number];
  sides: [UnitSpec[], UnitSpec[]];
  sideNames: [string, string];
  terrain?: Terrain[];
  /** Shells on a zone: from a second, one every so many seconds. */
  barrage?: { from: number; every: number; until: number; zone: [number, number, number, number] };
  /** The unit the player stands in, as [side, index]. */
  player: [0 | 1, number];
};

const u = (name: string, kit: string, count: number, ranks: number, at: [number, number], order: Order, rest: Partial<UnitSpec> = {}): UnitSpec =>
  ({ name, kit, count, ranks, at, order, ...rest });

export const battles: readonly Battle[] = [
  {
    id: "agincourt", name: "Agincourt", when: "France, 1415", ground: "mud", size: [44, 24], sideNames: ["English", "French"], player: [0, 0],
    note: "Archers behind stakes, a ploughed field after a night of rain, and knights who charge anyway. Watch what the mud and the stakes do to the charge.",
    terrain: [{ kind: "mud", x: 15, y: 2, w: 16, h: 20 }, { kind: "stakes", x: 11, y: 2, w: 1, h: 7 }, { kind: "stakes", x: 11, y: 15, w: 1, h: 7 }],
    sides: [
      [u("Archers, left", "longbowman", 9, 2, [8, 5.5], "loose"), u("Men-at-arms", "man-at-arms", 8, 2, [9, 12], "hold"), u("Archers, right", "longbowman", 9, 2, [8, 18.5], "loose")],
      [u("Knights, left wing", "knight", 4, 1, [35, 5.5], "hold", { gap: 1.5, then: [[1.5, "charge"]] }), u("Knights, right wing", "knight", 5, 1, [35, 18.5], "hold", { gap: 1.5, then: [[1.5, "charge"]] }), u("Dismounted men-at-arms", "man-at-arms", 15, 2, [38, 12], "hold", { then: [[4, "advance"]] }), u("Crossbowmen", "crossbowman", 6, 1, [41, 12], "hold", { then: [[4, "advance"]] })],
    ],
  },
  {
    id: "hastings", name: "Hastings", when: "England, 1066", ground: "grass", size: [44, 24], sideNames: ["Saxons", "Normans"], player: [0, 0],
    note: "A shield wall on foot against archers and knights. It holds while it stands still.",
    sides: [
      [u("Huscarls", "huscarl", 9, 1, [11, 12], "hold", { gap: 0.9 }), u("Fyrd, left", "fyrd", 10, 2, [10, 6], "hold", { gap: 0.9 }), u("Fyrd, right", "fyrd", 9, 2, [10, 18], "hold", { gap: 0.9 })],
      [u("Archers", "longbowman", 8, 1, [30, 12], "loose", { gap: 1.6 }), u("Knights", "norman-knight", 7, 1, [36, 12], "hold", { gap: 1.5, then: [[6, "charge"]] }), u("Spearmen", "warband", 10, 2, [34, 5], "hold", { then: [[3, "advance"]] })],
    ],
  },
  {
    id: "thermopylae", name: "The pass", when: "Greece, 480 BCE", ground: "dirt", size: [40, 20], sideNames: ["Greeks", "Persians"], player: [0, 0],
    note: "Bronze and long spears in a place too narrow to be outflanked. The Persians have more men and shorter spears.",
    terrain: [{ kind: "wall", x: 12, y: 0, w: 8, h: 7 }, { kind: "wall", x: 12, y: 13, w: 8, h: 7 }],
    sides: [
      [u("Hoplites", "hoplite", 12, 2, [16, 10], "hold", { gap: 0.95 })],
      [u("Immortals", "immortal", 10, 2, [29, 10], "advance", { then: [[9, "charge"]] }), u("More Immortals", "immortal", 10, 2, [35, 10], "hold", { then: [[16, "charge"]] })],
    ],
  },
  {
    id: "teutoburg", name: "Legion and war band", when: "Germany, 9 CE", ground: "grass", size: [40, 22], sideNames: ["Romans", "Germans"], player: [0, 0],
    note: "Javelins first, then the short sword behind the big shield, against a rush of spearmen.",
    sides: [
      [u("Legionaries", "legionary", 12, 2, [11, 11], "hold")],
      [u("War band", "warband", 7, 2, [29, 7], "charge"), u("War band", "warband", 7, 2, [30, 15], "charge")],
    ],
  },
  {
    id: "mohi", name: "Knights and horse archers", when: "Hungary, 1241", ground: "grass", size: [52, 28], sideNames: ["Mongols", "Knights"], player: [0, 0],
    note: "The knights can beat anything they catch. The horse archers do not mean to be caught.",
    sides: [
      [u("Horse archers", "horse-archer", 12, 1, [12, 14], "skirmish", { gap: 2 }), u("Heavy lancers", "mongol-lancer", 5, 1, [5, 14], "hold", { gap: 1.6, then: [[18, "charge"]] })],
      [u("Knights", "norman-knight", 7, 1, [40, 14], "charge", { gap: 1.6 }), u("Crossbowmen", "crossbowman", 6, 1, [45, 14], "loose"), u("Spearmen", "fyrd", 8, 2, [44, 7], "hold")],
    ],
  },
  {
    id: "pavia", name: "Pike and shot", when: "Italy, 1525", ground: "grass", size: [46, 24], sideNames: ["Imperial", "French"], player: [0, 0],
    note: "Pikes keep the horse off the guns; the guns kill the horse. Neither is safe without the other.",
    sides: [
      [u("Pike block", "pikeman", 12, 3, [12, 12], "hold", { gap: 0.8 }), u("Arquebusiers", "arquebusier", 8, 2, [10, 5.5], "loose"), u("Arquebusiers", "arquebusier", 8, 2, [10, 18.5], "loose")],
      [u("Gendarmes", "knight", 7, 1, [36, 12], "hold", { gap: 1.5, then: [[2, "charge"]] }), u("Swiss pikes", "pikeman", 12, 3, [38, 6], "advance", { gap: 0.8 }), u("Landsknechts", "landsknecht", 5, 1, [38, 18], "advance")],
    ],
  },
  {
    id: "otumba", name: "Otumba", when: "Mexico, 1520", ground: "dirt", size: [44, 24], sideNames: ["Spanish", "Mexica"], player: [0, 0],
    note: "Obsidian against steel plate, and men who have never seen a horse charged by horses.",
    sides: [
      [u("Sword and buckler men", "rodelero", 7, 1, [11, 12], "hold"), u("Horsemen", "jinete", 4, 1, [6, 12], "hold", { gap: 1.6, then: [[4, "charge"]] }), u("Crossbowmen", "crossbowman", 3, 1, [8, 6], "loose")],
      [u("Jaguar warriors", "jaguar", 14, 2, [30, 12], "charge"), u("Commoners", "aztec-levy", 11, 2, [34, 6], "skirmish"), u("Commoners", "aztec-levy", 11, 2, [34, 18], "skirmish")],
    ],
  },
  {
    id: "nagashino", name: "Nagashino", when: "Japan, 1575", ground: "grass", size: [46, 24], sideNames: ["Oda", "Takeda"], player: [0, 0],
    note: "The best cavalry in Japan rides at matchlocks behind a palisade.",
    terrain: [{ kind: "stakes", x: 13, y: 3, w: 1, h: 18 }],
    sides: [
      [u("Gunners", "teppo", 11, 2, [10, 12], "loose"), u("Spearmen", "ashigaru", 8, 1, [7, 12], "hold")],
      [u("Takeda horse", "mounted-samurai", 11, 1, [36, 12], "hold", { gap: 1.5, then: [[2, "charge"]] }), u("Samurai on foot", "samurai", 8, 1, [40, 12], "hold", { then: [[5, "charge"]] })],
    ],
  },
  {
    id: "culloden", name: "The Highland charge", when: "Scotland, 1746", ground: "grass", size: [58, 22], sideNames: ["Government", "Jacobites"], player: [0, 0],
    terrain: [{ kind: "mud", x: 24, y: 1, w: 14, h: 20 }],
    note: "A musket line gets two volleys, perhaps three, before broadswords reach it.",
    sides: [
      [u("Redcoat line", "redcoat", 18, 2, [10, 11], "loose")],
      [u("Clansmen", "highlander", 11, 2, [50, 6], "charge"), u("Clansmen", "highlander", 11, 2, [50, 16], "charge")],
    ],
  },
  {
    id: "isandlwana", name: "Isandlwana", when: "Zululand, 1879", ground: "sand", size: [62, 28], sideNames: ["British", "Zulu"], player: [0, 0],
    note: "Breech-loaders in a thin line against an army that runs in from three sides at once.",
    sides: [
      [u("Firing line", "redcoat-1879", 14, 1, [14, 14], "loose", { gap: 1.3 })],
      [u("The chest", "zulu", 17, 2, [56, 14], "charge"), u("Left horn", "zulu", 10, 2, [48, 3], "charge"), u("Right horn", "zulu", 10, 2, [48, 25], "charge")],
    ],
  },
  {
    id: "somme", name: "Over the top", when: "France, 1916", ground: "mud", size: [52, 26], sideNames: ["British", "German"], player: [0, 0],
    note: "Mud, wire, shellfire and a machine gun. Go to ground when the gun swings your way, and move when it stops.",
    terrain: [{ kind: "trench", x: 4, y: 1, w: 2, h: 24 }, { kind: "trench", x: 44, y: 1, w: 2, h: 24 }, { kind: "wire", x: 37, y: 1, w: 2, h: 10 }, { kind: "wire", x: 37, y: 14, w: 2, h: 11 }, { kind: "mud", x: 14, y: 4, w: 16, h: 18 }],
    barrage: { from: 3, every: 2.2, until: 40, zone: [12, 2, 34, 24] },
    sides: [
      [u("First wave", "tommy", 16, 1, [5, 13], "hold", { gap: 1.6, then: [[2, "advance"], [9, "charge"]] }), u("Second wave", "tommy", 16, 1, [3, 13], "hold", { gap: 1.6, then: [[7, "advance"], [14, "charge"]] })],
      [u("Trench garrison", "landser", 6, 1, [45, 13], "loose", { gap: 2.6 }), u("Machine gun", "machine-gunner", 1, 1, [45, 13], "loose")],
    ],
  },
  {
    id: "taua", name: "War party", when: "Aotearoa, 1600", ground: "grass", size: [36, 20], sideNames: ["Your taua", "Their taua"], player: [0, 0],
    note: "No missiles and no armour: single combat many times over, with the taiaha and the mere.",
    sides: [[u("Toa", "toa", 7, 1, [10, 10], "charge", { gap: 1.6 })], [u("Toa", "toa", 8, 1, [26, 10], "charge", { gap: 1.6 })]],
  },
  {
    id: "tavern", name: "Tavern brawl", when: "Anywhere, any year", ground: "dirt", size: [26, 16], sideNames: ["Your table", "Their table"], player: [0, 0],
    note: "Fists and shoves. Nobody dies of it, usually.",
    sides: [[u("Your table", "brawler", 5, 1, [9, 8], "charge", { gap: 1.6 })], [u("Their table", "brawler", 5, 1, [17, 8], "charge", { gap: 1.6 })]],
  },
];
