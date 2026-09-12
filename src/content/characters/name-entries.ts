/*
 * What may not appear in a personal-name pool.
 *
 * The ported name sets were built by pulling words out of reference material,
 * and a lot of what came back is not a name: archaeological site names filed as
 * Predynastic Egyptians, the six Haudenosaunee nations filed as surnames, an
 * Ojibwe greeting, "Anorak" and "Parka" as Inuit family names, the Lewis and
 * Clark expedition filed as Shoshone women. These are the rules that catch that
 * class, so a rebuilt pool cannot quietly acquire the same contents again.
 *
 * A rule fires on an exact, case-insensitive match of a whole entry. Anything
 * listed here is barred as a *personal name*; several are perfectly good labels
 * elsewhere. Additions want a one-line reason, not a category.
 */

/** Ethnonyms and language names used as if they were personal names. */
const ETHNONYMS = [
  "shoshone", "bannock", "paiute", "ute", "goshute", "washoe", "kwakwaka",
  "haida", "tlingit", "tsimshian", "nootka", "salish", "chinook", "klamath",
  "modoc", "yurok", "karuk", "hupa", "coos", "umpqua", "siuslaw", "miwok",
  "pomo", "ohlone", "chumash", "yokuts", "maidu", "wintu", "cahuilla",
  "anishinaabe", "oneida", "onondaga", "cayuga", "seneca", "mohawk",
  "tuscarora", "wampanoag", "pequot", "lenape", "shawnee", "ojibwe", "sauk",
  "fox", "miami", "koori", "tiwi", "bidjigal", "taqbaylit", "aqvayli",
  "tamazight", "tamil", "bilagáana", "bilagaana", "anishinabe",
  "tillamook", "kalapuya", "siletz", "wiyot", "tolowa", "achomawi",
  "atsugewi", "shasta", "serrano", "taskigi",
];

/** Settlements, sites, regions and physical features. */
const PLACES = [
  "abydos", "hierakonpolis", "naqada", "badari", "merimde", "fayum", "omari",
  "maadi", "tasian", "nampa", "weiser", "bruneau", "owyhee", "humboldt",
  "reese", "alameda", "topanga", "olathe", "sikyatki", "awatovi", "kawaika",
  "hano", "etowah", "ocmulgee", "nikwasi", "kituwah", "hiawassee", "hiwassee",
  "ocoee", "coosa", "talisi", "wetumpka", "abihka", "atasi", "kealedji",
  "kolomi", "okchai", "tukabahchi", "sawokli", "osochi", "pakana", "chehaw",
  "caguas", "humacao", "jayuya", "loíza", "loiza", "yabucoa", "bairoa",
  "orocovis", "arasibo", "guatavita", "ubaque", "turmequé", "turmeque",
  "firavitoba", "sugamuxi", "wakokai", "nanih", "chelan", "tallulah",
  "uluru", "wagga", "kalgoorlie", "warrnambool",
  "narrandera", "queanbeyan", "ulladulla", "papunya", "poolamacca", "tarkine",
  "brindabella", "djarragun", "jundah", "merinda", "coolah", "kankan",
  "djenné", "djenne", "azemour", "tilantongo", "tututepec", "kiva", "kotyiti",
  "gichigami",
];

/** Deities, spirits and personified forces. */
const DEITIES = [
  "marduk", "enlil", "shamash", "nabu", "nergal", "ninurta", "adad", "ishtar",
  "inanna", "sedna", "sila", "ogun", "shango", "obatala", "orunmila", "eshu",
  "kokopelli", "masauwu", "tawa", "sotuknang", "eototo", "epona", "sulis",
  "coventina", "rosmerta", "brigantia", "andraste", "chía", "chia", "sua",
  "sié", "sie", "fiba", "gata", "nüwa", "nuwa", "manidoo", "goorialla",
];

/** Titles, ranks and offices worn as whole names. */
const TITLES = [
  "mansa", "askia", "sonni", "ras", "rana", "maharana", "rao", "raja",
  "kunwar", "thakur", "rawat", "micco", "harjo", "emathla", "yahola", "hadjo",
  "fixico", "holata", "tustunnuggee", "beg", "khan", "tegin", "yabgu", "shad",
  "elteber", "tarkan", "baghatur", "boyla", "tudun", "maripgan", "wonhwa",
  "cacica", "angakok", "hosteen", "hastiin", "nguyen", "selassie", "mariam",
  "nahnken", "hopoithle", "hillis",
];

/** Common nouns, adjectives and greetings. */
const NOUNS = [
  "boozhoo", "miigwech", "migwech", "ishkode", "waaboos", "giiwedin",
  "nokomis", "iglu", "kayak", "umiak", "anorak", "parka", "mukluk", "kamik",
  "qiviut", "tupik", "vaka", "fanua", "niu", "lagi", "vai", "moana", "manu",
  "fetu", "savi", "yuku", "ita", "yuta", "koo", "tachi", "ñuhu", "nuhu",
  "mana", "tihu", "ulac", "tamurt", "azegzaw", "amellal", "azelmad", "furaha",
  "uzuri", "wema", "malkia", "dada", "quandong", "gidgee", "ceiba", "jagua",
  "selu", "atsila", "yona", "kamama", "quyca", "guasgua", "dibe", "gad",
  "chitto", "kono", "nokose", "isfaha", "lowak", "fuswa", "takosa",
];

/** Documented individuals who died in the twentieth century or later. */
const MODERN_PEOPLE = [
  "namatjira", "oodgeroo", "mandawuy", "matoub", "nampeyo", "zitkala-sha",
  "zitkala-ša", "pocahontas", "sacajawea", "charbonneau", "drouillard",
  "colter", "potts", "ogden", "mckenzie", "tabeau", "dorion", "cameahwait",
  "bazil", "rabuka", "bainimarama", "somare", "namaliu", "wingti", "sogavare",
  "lini", "kalpokas", "natapei", "kessai", "litokwa", "amata", "anote",
  "teburoro", "taneti", "jurelang", "manny", "redley", "zidane", "benzema",
  "mahrez", "benatia", "slimani", "feghouli", "boudebouz", "kipchoge",
  "cheruiyot", "jeptoo", "kiplagat", "rotich", "kibet", "mandela", "sisulu",
  "tutu", "mbeki", "sobukwe", "forough", "simin", "parvin", "tahereh",
  "gemayel", "aoun", "hariri", "jumblatt", "frangieh", "charbel",
  "tatanka-iyotanka", "mahpiya-luta", "tashunka-witco", "hehaka-sapa",
  "ishi", "sequoyah", "numaga", "winnemucca", "ouray", "walkara",
  "pocatello", "washakie", "tendoy", "tahgee", "opothleyahola", "menawa",
  "apushimataha", "porivo", "tourtotte", "poivier", "bourdeau", "wadze",
  "wadzewipe", "loeak", "wakanda",
];

const REASONS: readonly [string, readonly string[]][] = [
  ["an ethnonym or language name", ETHNONYMS],
  ["a place name", PLACES],
  ["a deity", DEITIES],
  ["a title or office", TITLES],
  ["a common noun or greeting", NOUNS],
  ["a person who died after 1900", MODERN_PEOPLE],
];

const index = new Map<string, string>();
for (const [reason, words] of REASONS)
  for (const w of words) index.set(w, reason);

/*
 * A word barred in one tradition can be an ordinary name in another: Rana is a
 * Rajput rank and a common Levantine given name. Rules are matched on the word,
 * so collisions like that are listed here rather than weakening the rule.
 */
const ALLOWED = new Set(["levantine:rana", "arabic-levant:rana"]);

/** Why this entry may not be used as a personal name, if it may not be. */
export function barredNameEntry(
  entry: string,
  tradition?: string,
): string | undefined {
  const key = entry.trim().toLowerCase();
  if (tradition && ALLOWED.has(`${tradition}:${key}`)) return undefined;
  const reason = index.get(key);
  if (reason) return reason;
  // English glosses reached the family-name lists as "Wolf-Clan", "Blue-Corn".
  if (/-(clan|corn|moon|sky|star|shell|bird|serpent)$/i.test(key))
    return "an English gloss, not a name";
  return undefined;
}

/** Every barred entry in a pool, as `entry: reason`. */
export function barredNameEntries(
  entries: readonly string[],
  tradition?: string,
) {
  return entries.flatMap((e) => {
    const reason = barredNameEntry(e, tradition);
    return reason ? [`${e}: ${reason}`] : [];
  });
}
