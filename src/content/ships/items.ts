import type { ItemDef } from "../../core/types";

const def = (id: string, name: string, sprite: string, value: number, description: string, more: Partial<ItemDef> = {}): [string, ItemDef] =>
  [id, { id, name, sprite, value, description, ...more }];

/** Rations and cargo aboard ship. */
export const shipItems: Record<string, ItemDef> = Object.fromEntries([
  def("steel-coil", "Steel coil", "harbor-steel-coil", 30, "A banded roll of sheet steel, carried on timber chocks."),
  def("ferry-ticket", "Ferry ticket", "papyrus", 0, "A printed passenger ticket with a numbered stub and a space for the conductor’s punch."),
  def("ships-biscuit", "Ship's biscuit", "bread", 1, "Hard flat bread baked twice so it keeps for years. Knock it on the table before you bite.", { edible: 14 }),
  def("salt-meat", "Salt meat", "meat", 2, "Beef or pork packed in brine in a cask. Soak it first or it will make you thirsty all day.", { edible: 22 }),
  def("ship-rice", "Rice and salt fish", "grain", 1, "A bowl of rice with a strip of salted fish on top.", { edible: 24 }),
  def("dates", "Dates", "ecology-fruit-item", 2, "Pressed dates from the Gulf, sticky and sweet. They keep for months.", { edible: 16 }),
  def("pepper", "Black pepper", "ecology-berries-item", 9, "Dried peppercorns from the Malabar coast, worth their weight in silver in some ports."),
  def("cloves", "Cloves", "flowers", 10, "Dried flower buds of the clove tree, from the Moluccas and later Zanzibar."),
]);
