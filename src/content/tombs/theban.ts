import type { TombFind, TombStyle } from "./types";

const f = (id: string, name: string, art: TombFind["art"], tier: TombFind["tier"], verb: string, look: string, text: string, more: Partial<TombFind> = {}): TombFind =>
  ({ id, name, art, on: art === "painting" || art === "stela" || art === "niche" || art === "sketch" ? "wall" : "floor", tier, verb, look, text, basis: "documented", ...more });

/** Rock-cut tombs of the New Kingdom in the hills west of Thebes. What robbers
 * took, and how, follows the confessions in the tomb-robbery papyri of about
 * 1110 BCE and the state Tutankhamun's tomb was found in. */
export const theban: TombStyle = {
  id: "theban",
  name: "a rock-cut tomb in the Theban hills",
  where: [32.4, 25.5, 32.9, 25.9],
  years: [-1500, 2100],
  names: {
    entrance: ["the entrance stair"],
    corridor: ["the first corridor", "the second corridor", "the third corridor", "a lower corridor"],
    well: ["the well room", "a second well room"],
    hall: ["the pillared hall", "the antechamber", "a lower hall"],
    store: ["a side room", "a storeroom", "the treasury", "a small annexe", "a store of jars", "a far storeroom"],
    cutting: ["an unfinished room", "an abandoned cutting", "a rough-cut room"],
    burial: ["the burial chamber"],
  },
  enter: "You squeeze through the gap under the lintel and go down the stair. The air is dry and warm and smells of resin.",
  note: "A stair, corridors on one axis, a well shaft, a pillared hall and a burial chamber with side rooms: the plan of Eighteenth to Twentieth Dynasty royal and high officials' tombs. Which rooms a given tomb has is drawn from the seed.",
  basis: "inferred",
  finds: [
    f("blocked-doorway", "Blocked doorway", "blocking", "seal", "Break through", "A doorway walled up with rough stones and plastered over. Seal stamps are pressed all over the plaster.", "You pull the blocking down stone by stone. The stamp in the plaster is a jackal lying over nine bound prisoners, the seal of the necropolis.", { time: 900 }),
    f("sarcophagus", "Stone sarcophagus", "sarcophagus", "prize", "Lever the lid aside", "A box of red quartzite as long as a cart, with a goddess carved at each corner, her wings spread along the sides.", "It takes everything you have to shift the lid a hand's width. Inside is one coffin inside another. You strip the gold from them and from the mummy, and cut the amulets from its neck.", { roles: ["burial"], w: 3, h: 2, keeps: true, time: 2400, loot: { "gold-foil": [2, 4], "heart-scarab": 1, "bead-collar": [0, 1], "mummy-linen": [1, 2] } }),
    f("gilded-shrine", "Gilded shrine", "shrine", "prize", "Strip the gold", "A wooden shrine as tall as you are, covered in gold leaf worked with figures of gods. Its doors are tied shut with cord and sealed with mud.", "You break the cord and work the gold off the wood with a copper blade. It comes away in sheets you can fold.", { roles: ["burial", "store"], w: 2, h: 2, keeps: true, time: 1500, loot: { "gold-foil": [3, 5] } }),
    f("coffin", "Painted coffin", "coffin", "notable", "Open the coffin", "A wooden coffin shaped like a wrapped body, with a painted face and a wig of blue stripes. A relative buried beside the tomb's owner.", "The lid is pegged and you split it. A few rings on the hands, a row of amulets, and linen stiff with resin.", { roles: ["store", "burial"], w: 2, keeps: true, time: 600, loot: { "gold-ring": [0, 2], faience: [1, 3], "mummy-linen": [1, 2] } }),
    f("canopic-chest", "Canopic chest", "canopic", "notable", "Open the chest", "A stone chest on a sledge. Inside are four jars with stoppers carved as heads, holding the dead man's liver, lungs, stomach and intestines.", "The stoppers have gilded faces. You knock the gold off and leave the rest.", { roles: ["burial", "store"], keeps: true, time: 300, loot: { "gold-foil": [0, 1] } }),
    f("guardian-statue", "Guardian statue", "statue", "notable", "Strip the gold leaf", "A life-size wooden figure of the dead man, painted black, striding forward with a staff. The kilt, headcloth and sandals are gilded.", "The gold comes off the kilt in strips. The black face watches you do it.", { roles: ["hall", "burial"], keeps: true, time: 600, loot: { "gold-foil": [1, 2] } }),
    f("jewel-box", "Jewel box", "chest", "notable", "Force the box", "A small chest of dark wood inlaid with ivory. The knobs on lid and side are tied together with cord and sealed.", "Rings, earrings and a collar of beads, wrapped in a linen scarf.", { roles: ["store", "burial"], time: 120, loot: { "bead-collar": [0, 1], "gold-ring": [1, 2], faience: [1, 3] } }),
    f("copper-vessels", "Copper vessels", "vessels", "notable", "Take the copper", "Basins, jugs and a brazier of copper, stacked inside each other.", "Metal can be melted down and nobody can say where it came from. You take what you can carry.", { roles: ["store"], time: 120, loot: { "copper-vessel": [1, 3] } }),
    f("bed-and-chairs", "Bed and chairs", "bed", "notable", "Prise off the gold", "A bed with lions' feet, two chairs and a folding stool, stacked against the wall.", "The gilding on the chair arms is thin, but it is gold.", { roles: ["store", "hall"], w: 2, keeps: true, time: 600, loot: { "gold-foil": [0, 1] } }),
    f("unguent-jars", "Jars of scented oil", "jars", "common", "Empty the jars", "Stone jars of perfumed fat and oil, their mouths tied over with cloth.", "This is what robbers take first. Oil has no owner's name on it. You scoop it into your own skin bag.", { roles: ["store", "burial", "hall"], weight: 2, time: 180, loot: { "unguent-jar": [1, 2] } }),
    f("linen-chest", "Chest of linen", "chest", "common", "Go through the chest", "A plain painted chest packed with folded sheets and shirts.", "Good cloth, some of it as fine as anything woven now.", { roles: ["store"], weight: 2, time: 120, loot: { "fine-linen": [1, 3] } }),
    f("shabti-box", "Box of servant figures", "baskets", "common", "Take some figures", "A box of small glazed figures holding hoes. Each is there to do one day's work for the dead man in the next world.", "You take a handful. Someone will buy them as charms.", { weight: 2, time: 60, loot: { ushabti: [2, 5] } }),
    f("food-boxes", "Boxes of food", "baskets", "common", "Look in the boxes", "Egg-shaped boxes painted white, each holding a joint of beef or a duck, dried hard.", "Meat for a meal that was never going to be eaten. It is as hard as wood.", { roles: ["store", "hall"], keeps: true }),
    f("wine-jars", "Wine jars", "jars", "common", "Read the labels", "Tall jars with pointed feet leaning in a row. Each has a note in ink on the shoulder.", "The notes give the vineyard, the year of the king's reign and the vintner's name. The wine is a brown stain.", { roles: ["store", "corridor"], keeps: true }),
    f("workmens-lamp", "Lamp and wicks", "lamp", "common", "Take the oil", "A pottery lamp, a jar of oil and a bundle of twisted linen wicks, left by the men who cut the tomb.", "The oil is still good. You fill your own lamp.", { roles: ["corridor", "entrance", "cutting", "well", "hall"], weight: 2, fuel: 1800, basis: "inferred" }),
    f("robbers-leavings", "Other robbers' leavings", "debris", "common", "Look through it", "Torn linen, a broken box, the burnt end of a torch.", "Somebody was here before you, and left in a hurry.", { flat: true, keeps: true, weight: 1.5, basis: "inferred" }),
    f("painted-wall", "Painted wall", "painting", "notable", "Look at the paintings", "Figures in red, blue and gold on a yellow ground, as bright as the day they were painted.", "The dead man and his wife stand before Osiris. Further along, his heart is weighed against a feather while a monster waits to eat it if it is heavy.", { roles: ["hall", "burial"], w: 2, keeps: true, weight: 2 }),
    f("book-of-gates", "Painted night journey", "painting", "notable", "Follow the scenes", "A long strip of scenes: a boat, a snake as long as the wall, rows of small figures with their arms tied.", "The sun's boat is pulled through the twelve hours of the night, past a gate and its guardian for each hour, to rise again in the morning.", { roles: ["corridor", "hall", "burial"], w: 2, keeps: true }),
    f("false-door", "False door", "stela", "common", "Look at the door", "A door carved in the rock that does not open, with the dead man's name and titles down each side.", "The dead man's spirit was meant to come out through it to take the food left for him.", { roles: ["hall", "store", "burial"], keeps: true }),
    f("magic-brick", "Niche with a mud brick", "niche", "common", "Take the figure", "A small niche in the wall, plastered over and broken open. Inside is a mud brick with a spell scratched on it and a little figure standing on it.", "One brick was set in each wall of the burial chamber to guard that side. You take the figure.", { roles: ["burial", "corridor"], time: 60, loot: { faience: 1 } }),
    f("draughtsmans-sketch", "Unfinished drawing", "sketch", "common", "Look at the drawing", "A grid of red lines on the bare rock with figures sketched on it in red, corrected here and there in black.", "The apprentice drew in red, the master corrected in black, and then the work stopped. The tomb's owner died too soon.", { roles: ["cutting", "corridor"], keeps: true, weight: 3 }),
  ],
};

/** What comes out of a tomb: [name, sprite, value, description]. */
export const tombItems: Record<string, readonly [string, string, number, string]> = {
  "gold-foil": ["Gold foil", "coin", 45, "Sheet gold stripped from a coffin or a shrine and folded small. It can be melted and nobody can say where it came from."],
  "bead-collar": ["Bead collar", "beads", 40, "A broad collar of glazed and gold beads in rows, made to lie on the chest."],
  "heart-scarab": ["Heart scarab", "pebble", 50, "A green stone beetle set in gold, laid over the heart of the dead with a spell asking it not to speak against them."],
  "unguent-jar": ["Scented oil", "clay-pot", 14, "Perfumed oil and fat from a tomb's stone jars."],
  "fine-linen": ["Fine linen", "cloth-bolt", 10, "Folded sheets of linen, some so fine the hand shows through."],
  "copper-vessel": ["Copper vessel", "clay-pot", 12, "A basin or jug of hammered copper."],
};
