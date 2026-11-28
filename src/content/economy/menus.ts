import type { CharacterScope } from "../characters/context-types";
import { matchesCharacterScope } from "../characters/resolve";
import type { WorldSetting } from "../geography/types";

/**
 * What a café, bar, diner, taproom or teahouse offers, by its `styles.bar`,
 * place and date. Prices are the menu's own, in `unit`s; `coin` of them make
 * one of the game's coins (`moneyFor`), and an order is paid in whole coins.
 * Educated guesses from price lists, menus and diaries of the time, rounded:
 * what a customer would have expected to pay, not a price history.
 */
export type Dish = {
  name: string;
  price: number;
  /** Hunger it takes away, out of 100. */
  fills?: number;
  /** Fatigue it takes away: coffee, tea, maté. */
  wakes?: number;
  /** Strong drink. */
  strong?: true;
  /** A gloss for a period word. */
  note?: string;
  from?: number;
  to?: number;
};
export type Menu = {
  id: string;
  bars: readonly string[];
  scope: CharacterScope;
  /** What the board or card says at the top. */
  heading: string;
  coin: number;
  /** A price as the menu writes it. Absent where the menu shows none. */
  money?: (n: number) => string;
  dishes: readonly Dish[];
};

const USA: CharacterScope["bounds"] = [-125, 24, -66, 50];
const BRITAIN: CharacterScope["bounds"] = [-8, 49.5, 2, 59];
const FRANCE: CharacterScope["bounds"] = [-5, 42, 8, 51];
const EUROPE: CharacterScope["bounds"] = [-11, 34, 45, 72];
const ANATOLIA: CharacterScope["bounds"] = [26, 36, 45, 42.5];
const JAPAN: CharacterScope["bounds"] = [128, 30, 146, 46];
const CHINA: CharacterScope["bounds"] = [97, 18, 125, 45];
const STEPPE: CharacterScope["bounds"] = [50, 25, 100, 48];

const dollars = (n: number) => (n < 1 ? `${Math.round(n * 100)}¢` : `$${n.toFixed(2)}`);
/** Pence as a British menu wrote them: 9d, 1s 1d, 2/6. */
const pence = (n: number) => (n < 12 ? `${n}d` : n % 12 ? `${Math.floor(n / 12)}s ${n % 12}d` : `${n / 12}s`);
const pounds = (n: number) => `£${n.toFixed(2)}`;
const sous = (n: number) => `${n} sous`;
const francs = (n: number) => (n < 1 ? `${Math.round(n * 100)} c.` : `${n} F`);
const euros = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;
const cash = (n: number) => `${n} cash`;
const mon = (n: number) => `${n} mon`;
const akce = (n: number) => (n < 1 ? "½ akçe" : `${n} akçe`);

export const menus: readonly Menu[] = [
  {
    id: "us-coffee-shop",
    bars: ["cafe"],
    scope: { years: [1990, 10001], bounds: USA },
    heading: "Coffee · Food",
    coin: 10,
    money: dollars,
    dishes: [
      { name: "Drip coffee", price: 2.75, wakes: 12 },
      { name: "Latte", price: 5.25, wakes: 12, fills: 4 },
      { name: "Cold brew", price: 4.75, wakes: 14 },
      { name: "Chai latte", price: 5, wakes: 6, fills: 4 },
      { name: "Blueberry muffin", price: 3.75, fills: 15 },
      { name: "Croissant", price: 4.25, fills: 12 },
      { name: "Breakfast burrito", price: 9.5, fills: 35 },
      { name: "Avocado toast", price: 11, fills: 25 },
    ],
  },
  {
    id: "us-lunch-counter",
    bars: ["cafe", "diner"],
    scope: { years: [1905, 1950], bounds: USA },
    heading: "Lunch",
    coin: 1,
    money: dollars,
    dishes: [
      { name: "Cup of coffee", price: 0.05, wakes: 10 },
      { name: "Doughnut", price: 0.05, fills: 10 },
      { name: "Ham sandwich", price: 0.15, fills: 25 },
      { name: "Blue plate special", price: 0.35, fills: 45, note: "The day's meat and two vegetables on one divided plate" },
      { name: "Slice of apple pie", price: 0.1, fills: 15 },
      { name: "Ice-cream soda", price: 0.15, fills: 8, from: 1910 },
    ],
  },
  {
    id: "us-diner",
    bars: ["cafe", "diner"],
    scope: { years: [1950, 1990], bounds: USA },
    heading: "Breakfast all day",
    coin: 10,
    money: dollars,
    dishes: [
      { name: "Coffee", price: 0.25, wakes: 10, note: "Refills free" },
      { name: "Two eggs, bacon and toast", price: 1.25, fills: 35 },
      { name: "Stack of pancakes", price: 0.95, fills: 30 },
      { name: "Cheeseburger and fries", price: 1.5, fills: 40 },
      { name: "Grilled cheese", price: 0.65, fills: 25 },
      { name: "Slice of pie", price: 0.45, fills: 15 },
      { name: "Chocolate milkshake", price: 0.55, fills: 12 },
    ],
  },
  {
    id: "us-diner-now",
    bars: ["diner"],
    scope: { years: [1990, 10001], bounds: USA },
    heading: "Breakfast all day",
    coin: 10,
    money: dollars,
    dishes: [
      { name: "Bottomless coffee", price: 2.5, wakes: 12 },
      { name: "Two eggs any style", price: 9.5, fills: 30 },
      { name: "Buttermilk pancakes", price: 8.99, fills: 30 },
      { name: "Cheeseburger and fries", price: 12.5, fills: 40 },
      { name: "BLT", price: 9.5, fills: 28, note: "Bacon, lettuce and tomato sandwich" },
      { name: "Slice of pie", price: 5.5, fills: 15 },
      { name: "Milkshake", price: 6.5, fills: 12 },
    ],
  },
  {
    id: "us-saloon",
    bars: ["beer", "ale"],
    scope: { years: [1850, 1920], bounds: USA },
    heading: "Saloon",
    coin: 1,
    money: dollars,
    dishes: [
      { name: "Glass of lager", price: 0.05, strong: true },
      { name: "Shot of whiskey", price: 0.15, strong: true },
      { name: "Free lunch", price: 0, fills: 20, note: "Ham, pickles and rye bread on the bar, free with a drink" },
      { name: "Oysters", price: 0.1, fills: 15 },
    ],
  },
  {
    id: "us-prohibition",
    bars: ["beer"],
    scope: { years: [1920, 1933], bounds: USA },
    heading: "Soft drinks",
    coin: 1,
    money: dollars,
    dishes: [
      { name: "Near beer", price: 0.1, note: "Beer brewed to under half a percent alcohol, legal under Prohibition" },
      { name: "Root beer", price: 0.05 },
      { name: "Coffee", price: 0.05, wakes: 10 },
      { name: "Ham on rye", price: 0.15, fills: 25 },
    ],
  },
  {
    id: "us-tavern",
    bars: ["beer"],
    scope: { years: [1933, 1990], bounds: USA },
    heading: "Bar",
    coin: 10,
    money: dollars,
    dishes: [
      { name: "Draft beer", price: 0.25, strong: true },
      { name: "Highball", price: 0.75, strong: true, note: "Whiskey and soda over ice" },
      { name: "Pickled egg", price: 0.1, fills: 8 },
      { name: "Hamburger", price: 0.5, fills: 30 },
      { name: "Pretzels", price: 0.1, fills: 6 },
    ],
  },
  {
    id: "us-bar",
    bars: ["beer"],
    scope: { years: [1990, 10001], bounds: USA },
    heading: "On tap",
    coin: 10,
    money: dollars,
    dishes: [
      { name: "Domestic draft", price: 5, strong: true },
      { name: "IPA", price: 7.5, strong: true, note: "A strong, hoppy pale ale" },
      { name: "Bourbon, neat", price: 8, strong: true },
      { name: "Buffalo wings", price: 13, fills: 30 },
      { name: "Loaded nachos", price: 12, fills: 30 },
      { name: "Soda", price: 3 },
    ],
  },
  {
    id: "english-alehouse",
    bars: ["ale"],
    scope: { years: [1500, 1850], bounds: BRITAIN },
    heading: "Ale and victuals",
    coin: 12,
    money: pence,
    dishes: [
      { name: "Quart of ale", price: 1, strong: true },
      { name: "Small beer", price: 1, note: "Weak beer, drunk all day by everyone" },
      { name: "Pint of porter", price: 2, strong: true, from: 1730 },
      { name: "Dram of gin", price: 1, strong: true, from: 1690 },
      { name: "Bread and cheese", price: 2, fills: 20 },
      { name: "The ordinary", price: 6, fills: 45, note: "The set dinner, at one table at one hour" },
      { name: "Pipe of tobacco", price: 1, from: 1600 },
    ],
  },
  {
    id: "victorian-pub",
    bars: ["beer"],
    scope: { years: [1850, 1939], bounds: BRITAIN },
    heading: "Public bar",
    coin: 12,
    money: pence,
    dishes: [
      { name: "Pint of mild", price: 2, strong: true },
      { name: "Pint of bitter", price: 3, strong: true },
      { name: "Glass of gin", price: 2, strong: true },
      { name: "Pork pie", price: 2, fills: 20 },
      { name: "Bread, cheese and pickle", price: 3, fills: 25 },
    ],
  },
  {
    id: "postwar-pub",
    bars: ["beer"],
    scope: { years: [1939, 1971], bounds: BRITAIN },
    heading: "Public bar",
    coin: 12,
    money: pence,
    dishes: [
      { name: "Pint of bitter", price: 13, strong: true },
      { name: "Pint of mild", price: 11, strong: true },
      { name: "Gin and tonic", price: 30, strong: true },
      { name: "Packet of crisps", price: 4, fills: 6 },
      { name: "Pork pie", price: 9, fills: 20 },
      { name: "Ploughman's lunch", price: 24, fills: 35, from: 1956, note: "Bread, cheese, pickle and an apple" },
    ],
  },
  {
    id: "british-pub",
    bars: ["beer"],
    scope: { years: [1971, 10001], bounds: BRITAIN },
    heading: "Food served all day",
    coin: 10,
    money: pounds,
    dishes: [
      { name: "Pint of lager", price: 5.8, strong: true },
      { name: "Pint of real ale", price: 5.2, strong: true, note: "Cask beer pulled by handpump" },
      { name: "Gin and tonic", price: 8.5, strong: true },
      { name: "Packet of crisps", price: 1.5, fills: 6 },
      { name: "Fish and chips", price: 16, fills: 45 },
      { name: "Sunday roast", price: 18, fills: 45 },
    ],
  },
  {
    id: "paris-cafe-old",
    bars: ["cafe"],
    scope: { years: [1680, 1795], bounds: FRANCE },
    heading: "Café",
    coin: 1,
    money: sous,
    dishes: [
      { name: "Cup of coffee", price: 3, wakes: 12 },
      { name: "Chocolate", price: 4, wakes: 6, fills: 8, note: "Hot drinking chocolate" },
      { name: "Lemonade", price: 2 },
      { name: "Ice", price: 4, note: "A sorbet, the café's speciality" },
      { name: "Brioche", price: 1, fills: 12 },
    ],
  },
  {
    id: "paris-cafe",
    bars: ["cafe"],
    scope: { years: [1795, 1960], bounds: FRANCE },
    heading: "Consommations",
    coin: 1,
    money: francs,
    dishes: [
      { name: "Café noir", price: 0.2, wakes: 12 },
      { name: "Café crème", price: 0.25, wakes: 10, fills: 4 },
      { name: "Glass of red wine", price: 0.15, strong: true },
      { name: "Absinthe", price: 0.3, strong: true, from: 1840, to: 1915 },
      { name: "Croissant", price: 0.1, fills: 12, from: 1850 },
      { name: "Croque-monsieur", price: 0.6, fills: 28, from: 1910, note: "Toasted ham and cheese sandwich" },
    ],
  },
  {
    id: "french-cafe",
    bars: ["cafe", "beer"],
    scope: { years: [1960, 2002], bounds: FRANCE },
    heading: "Tarifs",
    coin: 100,
    money: francs,
    dishes: [
      { name: "Express", price: 5, wakes: 12 },
      { name: "Café crème", price: 9, wakes: 10, fills: 4 },
      { name: "Demi pression", price: 12, strong: true, note: "A quarter litre of draught beer" },
      { name: "Croissant", price: 4, fills: 12 },
      { name: "Croque-monsieur", price: 22, fills: 28 },
      { name: "Steak frites", price: 55, fills: 45 },
    ],
  },
  {
    id: "euro-cafe",
    bars: ["cafe", "beer"],
    scope: { years: [2002, 10001], bounds: EUROPE, cultures: ["european"] },
    heading: "Carte",
    coin: 20,
    money: euros,
    dishes: [
      { name: "Espresso", price: 2.2, wakes: 12 },
      { name: "Cappuccino", price: 4.5, wakes: 10, fills: 4 },
      { name: "Small draught beer", price: 5.5, strong: true },
      { name: "Glass of wine", price: 6, strong: true },
      { name: "Croissant", price: 1.6, fills: 12 },
      { name: "Toasted sandwich", price: 9, fills: 28 },
      { name: "Plat du jour", price: 15, fills: 45, note: "The dish of the day" },
    ],
  },
  {
    id: "ottoman-kahvehane",
    bars: ["coffee"],
    scope: { years: [1510, 1844], bounds: ANATOLIA },
    heading: "Kahve",
    coin: 1,
    money: akce,
    dishes: [
      { name: "Cup of coffee", price: 1, wakes: 14 },
      { name: "Sherbet", price: 1, note: "Fruit syrup cooled with snow" },
      { name: "Nargile", price: 1, from: 1600, note: "A water pipe" },
      { name: "Simit", price: 0.5, fills: 12, note: "A sesame bread ring" },
      { name: "Lokum", price: 0.5, fills: 6, from: 1777, note: "Turkish delight" },
    ],
  },
  {
    id: "chinese-teahouse",
    bars: ["tea"],
    scope: { years: [800, 1912], bounds: CHINA, cultures: ["east-asian"] },
    heading: "Teas and small eats",
    coin: 100,
    money: cash,
    dishes: [
      { name: "Pot of green tea", price: 10, wakes: 10 },
      { name: "Jasmine tea", price: 15, wakes: 10, from: 1300 },
      { name: "Steamed buns", price: 5, fills: 15 },
      { name: "Sesame cakes", price: 4, fills: 10 },
      { name: "Bowl of noodles", price: 12, fills: 30 },
      { name: "Melon seeds", price: 3, fills: 4 },
    ],
  },
  {
    id: "edo-chaya",
    bars: ["tea", "sake"],
    scope: { years: [1636, 1871], bounds: JAPAN },
    heading: "Oshinagaki",
    coin: 100,
    money: mon,
    dishes: [
      { name: "Cup of tea", price: 4, wakes: 10 },
      { name: "Dango", price: 4, fills: 10, note: "Rice dumplings on a skewer" },
      { name: "Bowl of soba", price: 16, fills: 30, note: "Buckwheat noodles" },
      { name: "Oden", price: 4, fills: 15, note: "Things simmered in broth" },
      { name: "Flask of warm sake", price: 20, strong: true },
      { name: "Grilled eel on rice", price: 100, fills: 40 },
    ],
  },
  {
    id: "chaikhana",
    bars: ["chai"],
    scope: { years: [1400, 10001], bounds: STEPPE },
    heading: "Chaikhana",
    coin: 1,
    dishes: [
      { name: "Pot of green tea", price: 0.2, wakes: 10 },
      { name: "Plov", price: 0.6, fills: 40, note: "Rice cooked with mutton, carrots and onion" },
      { name: "Samsa", price: 0.3, fills: 18, note: "Baked pastry filled with meat" },
      { name: "Non", price: 0.1, fills: 12, note: "Round flatbread" },
      { name: "Lagman", price: 0.5, fills: 35, note: "Pulled noodles in broth" },
    ],
  },
  // Wherever nobody has written a menu, the house serves what its bar is for, priced in the game's coin.
  ...([
    ["ale", "Ale and food", [["Ale", 0.3, 0, 0, true], ["Bread and cheese", 0.3, 20], ["Stew", 0.6, 40]]],
    ["beer", "Bar", [["Beer", 0.3, 0, 0, true], ["Spirits", 0.4, 0, 0, true], ["Something to eat", 0.4, 25]]],
    ["cafe", "Café", [["Coffee", 0.3, 0, 12], ["Tea", 0.3, 0, 10], ["Pastry", 0.3, 12], ["Sandwich", 0.6, 28]]],
    ["diner", "Diner", [["Coffee", 0.3, 0, 12], ["Breakfast plate", 0.8, 35], ["Burger", 0.8, 40], ["Pie", 0.4, 15]]],
    ["tea", "Tea", [["Tea", 0.2, 0, 10], ["Sweets", 0.2, 10], ["Noodles", 0.5, 30]]],
    ["coffee", "Coffee", [["Coffee", 0.3, 0, 14], ["Sherbet", 0.3], ["Bread", 0.2, 12]]],
    ["chai", "Tea", [["Tea", 0.2, 0, 10], ["Bread", 0.2, 12], ["Rice and meat", 0.6, 40]]],
    ["sake", "Sake", [["Sake", 0.3, 0, 0, true], ["Tea", 0.2, 0, 10], ["Grilled fish", 0.5, 25], ["Rice", 0.3, 20]]],
  ] as const).map(([bar, heading, dishes]): Menu => ({
    id: `plain-${bar}`,
    bars: [bar],
    scope: { years: [-10000, 10001] },
    heading,
    coin: 1,
    dishes: dishes.map(([name, price, fills, wakes, strong]) => ({ name, price, fills, wakes, ...(strong ? { strong: true as const } : {}) })),
  })),
];

/** The menu of a house serving `bar` here and now: a written one where there is one, the plain one otherwise. */
export function menuFor(setting: WorldSetting, bar: string) {
  const menu = menus.find((m) => m.bars.includes(bar) && matchesCharacterScope(m.scope, setting));
  return menu && { ...menu, dishes: menu.dishes.filter((d) => setting.year >= (d.from ?? -Infinity) && setting.year < (d.to ?? Infinity)) };
}

/** What a list of dishes costs in the game's coin: always at least one, the change kept. */
export const coinsFor = (menu: Menu, dishes: readonly Dish[]) =>
  Math.max(1, Math.ceil(dishes.reduce((n, d) => n + d.price, 0) / menu.coin - 1e-9));
