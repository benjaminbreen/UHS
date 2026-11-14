import type { ItemDef } from "../../core/types";

const def = (id: string, name: string, sprite: string, value: number, description: string, more: Partial<ItemDef> = {}): [string, ItemDef] =>
  [id, { id, name, sprite, value, description, ...more }];

/** What turns up under a motor-age town and is not sold above it. */
export const sewerItems: Record<string, ItemDef> = Object.fromEntries([
  def("wristwatch", "Wristwatch", "coin", 25, "A watch on a broken strap, its glass fogged. It may still go if it dries out."),
  def("false-teeth", "False teeth", "pebble", 2, "A plate of teeth that went down a toilet and kept smiling."),
  def("key-ring", "Bunch of keys", "nails", 1, "Keys on a ring, to doors somewhere overhead."),
  def("wallet", "Wallet", "satchel", 6, "A leather wallet, swollen with water. Cards and papers inside, glued together."),
  def("mobile-phone", "Mobile phone", "obsidian", 30, "A phone with a cracked screen. It will not switch on."),
  def("lost-toy", "Lost toy", "pebble", 3, "A child's toy that went through a grating in the rain."),
  def("clay-pipe", "Clay pipe", "pebble", 2, "The white bowl of a cheap tobacco pipe, thrown away when the stem broke."),
  def("old-bottle", "Old bottle", "beer-bottle", 4, "A glass bottle with a stamped maker's name: ink, medicine, soda water or beer."),
  def("pilgrim-badge", "Pilgrim badge", "coin", 22, "A small cast pewter badge of a saint, bought at a shrine and lost on the way home."),
  def("terracotta-lamp", "Roman lamp", "clay-pot", 28, "A moulded clay oil lamp with a picture on its top and soot at the nozzle."),
  def("letters", "Bundle of letters", "papyrus", 3, "Letters tied with string, the ink run but some lines still clear."),
  def("street-plaque", "Enamel street plate", "ledger", 14, "A blue enamel plate with a street name and house numbers, unscrewed from a sewer wall."),
  def("waders", "Waders", "hide", 12, "Rubber thigh boots that strap to a belt. The water stays out to the waist."),
  def("gas-mask", "Gas mask", "hide", 8, "A rubber face mask with a filter canister. It smells of old rubber."),
  def("first-aid-kit", "First-aid kit", "doctor-bag", 10, "Bandages, iodine, eye wash and tetanus advice in a tin box."),
  def("spray-paint", "Spray paint", "beer-bottle", 2, "A can of paint with a nozzle. Shake it and it rattles."),
  def("tunnel-map", "Hand-drawn tunnel map", "papyrus", 10, "Somebody's map of the drains: entrances, dead ends, which shafts have ladders."),
  def("flask-tea", "Flask of tea", "jug", 3, "Hot sweet tea in a vacuum flask.", { edible: 6 }),
  def("vodka", "Bottle of vodka", "beer-bottle", 4, "Half a bottle of vodka. The cold down here makes it a currency.", { edible: 1 }),
  def("scrap-copper", "Scrap copper", "nails", 6, "Stripped copper cable. Scrap dealers pay by the kilo and ask nothing."),
  def("carbide", "Carbide", "rock", 2, "Grey lumps of calcium carbide that give off lamp gas when wetted."),
  def("dispatch", "Courier's dispatch", "papyrus", 5, "Orders and reports folded small and wrapped against the wet."),
  def("penicillin", "Black-market penicillin", "beer-bottle", 50, "A vial sold as penicillin. Nobody can tell from looking whether it has been watered down."),
  def("gold-scrapings", "Gold scrapings", "coin", 15, "A pinch of gold dust and filings washed out of jewellers' drains, panned out of the silt."),
]);
