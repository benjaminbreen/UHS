/**
 * What a building is, said plainly, for the focus card. The art pipeline's
 * descriptions carry notes on the evidence and on how the sprite was built;
 * those stay in models.generated.json, and the card says what the thing is.
 */
const FORM: Record<string, string> = {
  row: "A narrow {m} house in a row, sharing its side walls with its neighbours, with a yard at the back.",
  shop: "A {m} house with a shop opening onto the street on the ground floor and rooms above.",
  wide: "A broad {m} house on the street, with a yard behind.",
  tall: "A tall {m} house of several floors, squeezed onto a narrow plot.",
  cottage: "A small {m} house standing on its own plot.",
  hut: "A small one-room {m} house.",
  stall: "A little {m} booth where goods are sold to the street.",
  inn: "An inn: a {m} house where travellers eat, drink and sleep.",
  hall: "A big {m} hall on the street, used for meetings, storage or trade.",
  colonnade: "A {m} building fronted by a row of columns, with shade to trade and talk in.",
  midrise: "A block of flats several floors high.",
  office: "An office building.",
};
const WALL: [RegExp, string][] = [
  [/brick|stock|brownstone/, "brick"],
  [/glass|concrete|modern/, "concrete"],
  [/mud|earth/, "mudbrick"],
  [/plaster|stucco|whitewash|lime/, "plastered"],
  [/stone|andesite/, "stone"],
  [/timber|board|half/, "timber"],
];
const FAMILY: Record<string, string> = {
  "house-cottage-thatch-gold": "A large farmhouse under a thatched roof.",
  "house-cottage-timber-gold": "A large timber-framed house.",
  "house-early-brick-gold": "A substantial brick house with mullioned windows.",
  "house-early-stucco-gold": "A large plastered house with sash windows and a plain, formal front.",
  "house-round-gold": "A round house of wattle and daub under a tall cone of thatch.",
  "house-mudbrick-ob-gold": "A mudbrick house with a flat roof. People come and go by a ladder and a hatch, and work and sleep on the roof in summer.",
  "house-longhouse-gold": "A long timber farmhouse, its walls daubed with clay between the posts, under a deep thatched roof. People and animals may share it.",
  "house-cottage-thatch": "A cottage under a thatched roof.",
  "europe-service": "A small outbuilding: a store, a workshop or a shed.",
  "neolithic-service": "A small raised store or work shed, with bundles hung up to dry.",
  "house-dome-expanded": "A large domed house of bent saplings covered with bark or mats.",
  "house-tent-expanded": "A large tent of sewn hides over a cone of poles, with flaps at the top to let the smoke out.",
  "house-pit-expanded": "A large house dug down into the ground under a roof of reed or turf. It keeps warm in winter.",
  "house-round-stone-expanded": "A round house with drystone walls under a roof of reed or turf.",
  "house-rondavel-expanded": "A round house of daub, painted with bands of lime and ochre, under thatch.",
  "house-aegean-expanded": "A flat-roofed house of rubble stone, partly plastered.",
  "roman-domus": "A Roman house built round an open courtyard, with the rooms for guests, work and sleep opening off it.",
  "roman-insula": "A block of shops and workshops on the street, with rented rooms on the floors above.",
  "westasian-courtyard": "A house turned inward round a courtyard, with blank walls to the street and a roof terrace to sleep on in the heat.",
  "eastasian-courtyard": "A walled compound of halls and rooms round an open courtyard.",
  "eastasian-row": "A long building on the street with a shop at the front, and workrooms, stores and living rooms behind and above.",
  "eastasian-service": "A small building: a store, a workshop, a gatehouse or a little shrine.",
  "southasian-courtyard": "A town house built round a courtyard, with rooms and work space on every side and more rooms upstairs.",
  "southasian-monsoon": "A house built for heavy rain, with deep eaves and openings to let the air through.",
  "southasian-service": "A small building: a granary, a weaving or craft shed, a market pavilion or a shrine.",
  "house-cottage-timber": "A timber-framed cottage.",
  "hall-hammam": "A bath house. People come to wash, sweat in the hot rooms and talk.",
  "hall-thermae": "The public baths, with hot, warm and cold rooms. People come to wash, exercise and meet.",
  "hall-sento": "A public bath house, where the neighbourhood comes to wash and soak in hot water.",
  "hall-town-hall": "The town hall. The council meets upstairs; the market's weights and measures are kept below.",
  "hall-madrasa": "A madrasa, a school where students learn the Quran and Islamic law.",
  "hall-union-hall": "A meeting hall, hired by a trade or a society for its gatherings.",
  "hall-sweat-lodge": "A sweat lodge. Water is poured on stones heated in the fire, and people sit in the steam to pray and cleanse themselves.",
  "hall-kiva": "A kiva, a round room dug into the ground where men gather for ceremonies and councils. You climb in through the roof.",
  "hall-open-shelter": "An open-sided shelter where people sit in the shade to talk, work and settle disputes.",
  "hall-carved-gable": "The meeting house, where the community gathers and keeps its history.",
  "hall-moot-hall": "The market hall. Traders set up under the open ground floor on market days, and the town's officers meet above.",
  "hall-rathaus": "The town hall, where the council meets and the town's business is done.",
  "hall-grammar-hall": "A grammar school, where boys learn Latin.",
  "hall-charity-school": "A charity school, where poor children are taught to read and write for free.",
  "hall-stew": "A stew: a bath house where people pay to wash and sweat. Some have a bad name.",
  "hall-bagnio": "A bath house with hot baths and rooms to rest in.",
  "theatre-opera-house": "An opera house, where music and plays are performed.",
  "theatre-playhouse": "A playhouse. Crowds stand in the open yard or sit in the galleries to watch plays.",
  "theatre-noh-stage": "A Noh stage, where masked actors perform slow plays to music and chanting.",
  "theatre-kabuki": "A kabuki theatre, where actors put on plays full of song, dance and spectacle.",
  "theatre-picture-house": "A cinema, where people pay to watch films.",
  "theatre-globe": "A playhouse, open to the sky in the middle, where crowds come to watch plays.",
  "theatre-court-opera": "A court theatre, where opera and plays are staged.",
  "study-": "A house.",
};
const families = Object.keys(FAMILY).sort((a, b) => b.length - a.length);
const META =
  /illustrat|reconstruct|procedural|generated|vocabulary|profile|study|dimensions|surveyed|excavat|deliberately|subordinate|selected|seeded|resolved|informed type|recipe|layout and supplies/i;

export function aboutBuilding(frame: string, wall: string, description: string) {
  const form = /-urban-([a-z]+)/.exec(frame)?.[1];
  if (form && FORM[form]) {
    const m = WALL.find(([r]) => r.test(wall))?.[1] ?? "";
    return FORM[form].replace("{m} ", m ? `${m} ` : "");
  }
  const family = families.find((f) => frame.startsWith(f));
  if (family) return FAMILY[family];
  const plain = description
    .replace(/ candidate\b/g, "")
    .split(/(?<=\.)\s+/)
    .filter((s) => !META.test(s))
    .join(" ");
  return plain || "A building.";
}
