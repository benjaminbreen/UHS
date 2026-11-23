import { tombFindOf as f, type TombStyle } from "./types";

/** The vaulted room under the east end of a church, built round a saint's
 * grave from Carolingian times on, with the burials of clergy and patrons and,
 * where the churchyard was full, a charnel of dug-up bones. */
export const crypt: TombStyle = {
  id: "crypt",
  name: "the crypt under the church",
  where: [-10, 35, 30, 60],
  years: [800, 2100],
  names: {
    entrance: ["the crypt stair"],
    corridor: ["a passage", "the ambulatory", "a low passage"],
    well: ["a stair down"],
    hall: ["the crypt", "the lower crypt"],
    store: ["a side chapel", "the charnel", "a burial vault", "a family vault"],
    cutting: ["a bricked-up bay", "an unfinished vault"],
    burial: ["the saint's tomb"],
  },
  enter: "You go down the worn steps under the choir. Low vaults, squat columns, and the smell of wax and old stone.",
  leave: "You climb the steps back into the church.",
  surface: "the church",
  look: "crypt",
  roles: [[800, "Sexton"]],
  place: ["paris", 1250],
  plan: { shafts: false, pillars: true, axis: [1, 1], side: { corridor: 0.4, hall: 0.6, burial: 0.7 }, litter: ["dust", "dust", "bone"] },
  note: "A stair down from the choir, a passage or ambulatory, a columned hall, side chapels and vaults, and the saint's tomb at the east end, where pilgrims could come close to the relics.",
  basis: "inferred",
  finds: [
    f("bricked-vault", "Bricked-up vault", "blocking", "seal", "Break through", "A doorway closed with brick, and a date scratched in the mortar.", "The bricks come out one by one. Behind them a family vault has been shut up for a long time.", { time: 900 }),
    f("reliquary", "Reliquary", "shrine", "prize", "Open the reliquary", "A little gilded house of wood and copper on the saint's tomb, its roof set with blue enamel and coloured stones.", "Inside, in silk, are a skull and some long bones, with a strip of parchment naming the saint. You prise the stones from the roof.", { roles: ["burial"], w: 2, h: 2, keeps: true, time: 900, loot: { relic: 1, "gold-foil": [1, 2] } }),
    f("effigy-tomb", "Tomb with an effigy", "sarcophagus", "prize", "Lever up the slab", "A stone chest with a bishop lying on the lid, carved in his robes, his hands together and a lion at his feet.", "It takes a crowbar and an hour. Inside is a skeleton in a rotted cope, a chalice and paten laid on the chest, and a gold ring on one finger.", { roles: ["burial", "hall", "store"], w: 3, h: 2, keeps: true, time: 2400, loot: { "burial-chalice": 1, "gold-ring": 1 } }),
    f("lead-coffin", "Lead coffin", "coffin", "notable", "Cut it open", "A coffin of lead shaped roughly to the body, with a name and a date punched into the lid.", "A merchant's widow, from her plate. There is a ring and a string of beads in the coffin with her.", { roles: ["store", "burial"], w: 2, keeps: true, time: 900, loot: { "gold-ring": [0, 1], beads: [0, 1] } }),
    f("priests-chalice", "Priest's grave", "stela", "notable", "Lift the ledger stone", "A slab in the wall with a chalice cut on it: a priest's grave.", "Priests were buried with a chalice and paten, usually pewter. This one is pewter too, but it is old.", { roles: ["hall", "corridor", "store"], time: 900, loot: { "burial-chalice": 1 } }),
    f("charnel", "Charnel", "bones", "common", "Look at the bones", "Skulls and long bones stacked against the wall, dug up from the churchyard to make room for new graves.", "Some of the skulls have names and dates painted on them.", { roles: ["store", "corridor"], keeps: true, weight: 3 }),
    f("wall-painting", "Wall painting", "painting", "notable", "Look at the painting", "Saints in red and ochre under a painted arch, faded where the damp has got in.", "The saint of the church, and the story of how he died. Pilgrims came down here to pray close to him.", { roles: ["hall", "burial"], w: 2, keeps: true, weight: 2 }),
    f("candles", "Votive candles", "lamp", "common", "Take some candles", "A stand of candles left by people who came to pray, most burned down.", "Wax is wax. You take a handful.", { roles: ["burial", "hall"], fuel: 1500 }),
    f("memorial", "Memorial tablet", "stela", "common", "Read the tablet", "A small stone tablet with a name, a date and a prayer.", "\"Pray for the soul of John Ashe, who paid for this altar.\"", { keeps: true, weight: 2 }),
    f("old-debris", "Builders' rubbish", "debris", "common", "Look through it", "Broken tiles, a cracked lamp, a mason's chisel.", "Somebody rebuilt part of this and did not clear up.", { flat: true, keeps: true, basis: "inferred" }),
  ],
};

export const cryptItems: Record<string, readonly [string, string, number, string]> = {
  "burial-chalice": ["Burial chalice", "clay-pot", 25, "A small chalice and paten of pewter or silver, buried with a priest."],
};
