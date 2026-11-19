import { formatHistoricalYear as formatYear } from "../../core/calendar";
import type { InteriorProfile, Observance, RoomTemplate, WorshipAct } from "./types";
import { aarti, ashemVohu, lesson, lotus, nembutsu, opening, psalm, refuges, torah, type Passage } from "./scripture";

const act = (label: string, room: WorshipAct["room"], sound?: WorshipAct["sound"], at?: WorshipAct["at"], passage?: Passage): WorshipAct => ({label, room, sound, at, passage});
const church: Observance = {
  weekday: 4, gathering: act("Singing the responses", "sanctum", "unison"),
  visit: act("Praying quietly", "sanctum"), service: act("Reading the lesson", "sanctum", "recitation", "altar", lesson),
};
const mosque: Observance = {
  weekday: 2, hours:[5,12,15,18,20], layLeader:"man", gathering: {...act("Standing in the prayer row", "sanctum"),row:true},
  visit: act("Washing before prayer", "entry", "wash", "basin"), service: act("Reciting the prayer", "sanctum", "recitation", "altar", opening),
};
const buddhist: Observance = {
  tradition:"Buddhism",
  hours:[6,17],
  gathering: act("Reciting a verse together", "sanctum", "unison", undefined, lotus), visit: act("Bowing before the image", "sanctum"),
  service: act("Keeping time for the recitation", "sanctum", "woodbeat", "altar"),
};
const shrine: Observance = {
  tradition:"Hindu",
  gathering: act("Waiting for a view of the image", "entry"), visit: act("Bringing flowers to the shrine", "entry", "cloth"),
  service: act("Ringing the bell for the offering", "sanctum", "handbell", "altar"),
};
const offering: Observance = {
  gathering: act("Waiting with an offering", "entry"), visit: act("Standing at the threshold", "entry"),
  service: act("Setting out an offering", "sanctum", "cup", "altar"),
};
const reading: Observance = {
  weekday: 3, hours:[7,17], layLeader:"man", gathering: act("Following the reading", "sanctum"),
  visit: act("Studying together", "work", "recitation"), service: act("Reading aloud", "sanctum", "recitation", "lectern", torah),
};
const court: RoomTemplate = {id:"court", label:"Entrance court", role:"entry", size:[11,8], shapes:["courtyard"],
  program:"passage", furnish:[], pole:false, styles:{fountain:"none"}, clutter:[]};
const porch: RoomTemplate = {id:"porch", label:"Entrance porch", role:"entry", size:[7,4], program:"passage",
  windowStyle:"none", furnish:[], clutter:[], pole:false};
export const worship: InteriorProfile[] = [
  {
    id: "romanesque-church", institution: "worship", observance: church,
    uses: ["religious.romanesque-parish", "venue.churchyard"],
    rooms: [porch, {id:"hall", label:"Nave", role:"sanctum", shapes:["apse"], size:[11,12], program:"rows",looks:[{wall:"round-arched"},{wall:"round-arched"},{wall:"round-arched"}]}],
    program: "rows",
    regulars: { hours: [8, 11], fill: 0.6 },
    styles: { altar: "romanesque", pole: "stone" },
    label: "Romanesque parish church",
    region: "Latin Christendom",
    period: "900 – 1150",
    when: { start: { year: 900 }, end: { year: 1150 } },
    basis: "archaeological",
    note: "Thick-walled naves with round-arched arcades and an apse painted with Christ in Majesty, as at Sant Climent de Taüll and Saint-Savin. No seating: the congregation stood, the old and sick at the walls.",
    shapes: ["apse"],
    size: [11, 15],
    door: "door",
    windowStyle: "stained",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    pole: true,
    trades: ["household"],
    furnish: ["font"],
    looks: [
      { wall: "stone", floor: "earth", wear: 0.4, soot: 0.4 },
      { wall: "plaster", floor: "flag", wear: 0.3, soot: 0.3 },
      { wall: "plaster", dado: "stripe", floor: "flag", wear: 0.15, soot: 0.2 },
    ],
    colorways: [
      { name: "Limewash and ochre", wall: "#d8ccb4", trim: "#5a4a3a", floor: "#9a8c78", wood: "#5a3e2a", accent: "#a83a2a" },
      { name: "Grey ashlar", wall: "#a8a49c", trim: "#4a4640", floor: "#8a8478", wood: "#4a3626", accent: "#3a5a8a" },
    ],
  },
  {
    id: "orthodox-church", institution: "worship", observance: church,
    uses: ["religious.romanesque-parish", "religious.gothic-parish", "venue.churchyard", "religious.byzantine-church", "religious.rus-church", "religious.muscovite-church", "religious.muscovite-church-south", "religious.muscovite-church-volga", "religious.caucasian-church", "religious.orthodox-monastery", "religious.ethiopian-church", "religious.coptic-church", "religious.nubian-church"],
    rooms: [porch, {id:"hall", label:"Nave", role:"sanctum", shapes:["rect"], size:[13,12], program:"rows"}],
    program: "rows",
    regulars: { hours: [8, 11], fill: 0.7 },
    styles: { altar: "screen-iconostasis", pole: "stone" },
    label: "Orthodox church",
    region: "Byzantium, the Balkans and Rus'",
    period: "500 – present",
    when: { start: { year: 500 }, end: { year: 2100 } },
    basis: "documented",
    note: "The Byzantine and Orthodox church: the iconostasis across the sanctuary with the Royal Doors between the Theotokos and Christ, rows of feasts and the Deesis above; walls frescoed with saints over painted marble; candles banked before the icons; the congregation standing. Before about 1000 the screen was the lower, open templon.",
    shapes: ["rect"],
    size: [13, 14],
    door: "door",
    windowStyle: "lattice",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    pole: true,
    trades: ["household"],
    furnish: ["tapers", "tapers", "tapers"],
    looks: [
      { wall: "plaster", floor: "flag", wear: 0.3, soot: 0.5 },
      { wall: "fresco", floor: "flag", wear: 0.2, soot: 0.4 },
      { wall: "fresco", floor: "tile", wear: 0.1, soot: 0.3 },
    ],
    colorways: [
      { name: "Lapis and ochre", wall: "#d8c49a", trim: "#5a3a26", floor: "#a89a84", wood: "#5a3e2a", accent: "#a8302a" },
      { name: "Smoke and gold", wall: "#a8946a", trim: "#3a2618", floor: "#8a8070", wood: "#4a3222", accent: "#2a4a8a" },
    ],
  },
  {
    id: "gothic-church", institution: "worship", observance: church,
    uses: ["religious.gothic-parish", "religious.romanesque-parish", "venue.churchyard"],
    rooms: [porch, {id:"hall", label:"Nave", role:"sanctum", shapes:["apse"], size:[12,14], program:"rows",looks:[{wall:"pointed"},{wall:"pointed"},{wall:"pointed"}]}],
    program: "rows",
    regulars: { hours: [8, 11], fill: 0.6 },
    styles: { altar: "gothic", pole: "stone" },
    label: "Gothic parish church",
    region: "Latin Christendom",
    period: "1150 – 1540",
    when: { start: { year: 1150 }, end: { year: 1540 } },
    basis: "documented",
    note: "The late medieval parish church of churchwardens' accounts and surviving fabric: pointed arcades, glass in the windows, a painted triptych over the high altar, a font by the door. Pews came only in the fifteenth century; before them the nave was open floor.",
    shapes: ["apse"],
    size: [11, 16],
    door: "door",
    windowStyle: "stained",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    pole: true,
    trades: ["household"],
    furnish: ["font", "pulpit"],
    looks: [
      { wall: "plaster", floor: "flag", wear: 0.4, soot: 0.3 },
      { wall: "plaster", floor: "tile", wear: 0.25, soot: 0.2 },
      { wall: "plaster", dado: "panel", floor: "tile", wear: 0.1, soot: 0.1 },
    ],
    colorways: [
      { name: "Limewash and gilt", wall: "#e0d6c2", trim: "#5a4a3a", floor: "#a89a84", wood: "#5a3e2a", accent: "#a8302a" },
      { name: "Painted stone", wall: "#c8bca4", trim: "#3a3430", floor: "#8a8070", wood: "#4a3222", accent: "#2f4a8a" },
    ],
  },
  {
    id: "reformed-church", institution: "worship", observance: {...church, gathering: act("Singing a psalm", "sanctum", "unison", undefined, psalm), service: act("Preaching from the pulpit", "sanctum", "recitation", "pulpit")},
    uses: ["religious.gothic-parish", "venue.churchyard"],
    rooms: [porch, {id:"hall", label:"Nave", role:"sanctum", shapes:["apse"], size:[11,13], program:"rows",looks:[{wall:"pointed"},{wall:"pointed"},{wall:"pointed"}]}],
    program: "rows",
    regulars: { hours: [9, 12], fill: 0.6 },
    styles: { altar: "reformed", pew: "box", pole: "stone" },
    label: "Reformed parish church",
    region: "Britain, the Low Countries, northern Germany and Scandinavia",
    period: "1540 – 1900",
    when: { start: { year: 1540 }, end: { year: 1900 } },
    basis: "documented",
    note: "A medieval nave refitted for preaching after the Reformation: whitewashed walls, box pews, a pulpit with its sounding board, the communion table under boards of the Commandments, Creed and Lord's Prayer, clear leaded glass.",
    shapes: ["apse"],
    size: [11, 16],
    door: "door",
    windowStyle: "lattice",
    fire: "none",
    smokehole: false,
    seating: "chair",
    sleep: "none",
    pole: true,
    trades: ["household"],
    furnish: ["font", "pulpit"],
    looks: [
      { wall: "plaster", floor: "flag", wear: 0.4, soot: 0.2 },
      { wall: "plaster", floor: "flag", wear: 0.25, soot: 0.1 },
      { wall: "plaster", dado: "panel", floor: "tile", wear: 0.1, soot: 0.05 },
    ],
    colorways: [
      { name: "Whitewash and oak", wall: "#ece6d8", trim: "#4a3a2a", floor: "#a8a090", wood: "#6a4a30", accent: "#2f3a5a" },
      { name: "Dutch grey", wall: "#e4e2da", trim: "#2a2a2a", floor: "#b0aaa0", wood: "#4a3a2e", accent: "#5a2a2a" },
    ],
  },
  {
    id: "baroque-church", institution: "worship", observance: church,
    uses: ["religious.gothic-parish", "religious.spanish-american-church", "venue.churchyard"],
    rooms: [porch, {id:"hall", label:"Nave", role:"sanctum", shapes:["apse"], size:[12,13], program:"rows"}],
    program: "rows",
    regulars: { hours: [7, 11], fill: 0.6 },
    styles: { altar: "baroque", pole: "stone" },
    label: "Baroque Catholic church",
    region: "Catholic Europe and Spanish America",
    period: "1520 – 1900",
    when: { start: { year: 1520 }, end: { year: 1900 } },
    basis: "documented",
    note: "The Counter-Reformation church of Spain, Italy and the viceroyalties: a gilded retablo filling the head of the nave with saints in niches and the Virgin at its heart, benches for the congregation, painted walls and a marble or tiled floor.",
    shapes: ["apse"],
    size: [11, 16],
    door: "door",
    windowStyle: "lattice",
    fire: "none",
    smokehole: false,
    seating: "chair",
    sleep: "none",
    pole: true,
    trades: ["household"],
    furnish: ["font", "pulpit"],
    looks: [
      { wall: "plaster", floor: "flag", wear: 0.35, soot: 0.2 },
      { wall: "plaster", dado: "panel", floor: "tile", wear: 0.2, soot: 0.15 },
      { wall: "plaster", dado: "panel", floor: "tile", wear: 0.05, soot: 0.05 },
    ],
    colorways: [
      { name: "Whitewash and gold", wall: "#ece2cc", trim: "#6a4a2a", floor: "#c8b8a0", wood: "#5a3a22", accent: "#8a1e2a" },
      { name: "Colonial blue", wall: "#d4dce0", trim: "#3a3a4a", floor: "#b8a890", wood: "#4a3020", accent: "#2a4a8a" },
    ],
  },
  {
    id: "mosque", institution: "worship", observance: mosque,
    uses: ["venue.mosque-court", "religious.ottoman-mosque", "religious.london-mosque", "religious.arab-mosque", "religious.maghrebi-mosque", "religious.persian-mosque", "religious.ottoman-mosque-istanbul", "religious.ottoman-mosque-edirne", "religious.ottoman-mosque-sarajevo", "religious.ottoman-mosque-skopje", "religious.central-asian-mosque", "religious.indo-islamic-mosque", "religious.sahel-mosque", "religious.sahel-mosque-south", "religious.swahili-mosque"],
    regulars: { hours: [12, 14], fill: 0.7 },
    rooms: [
      { id: "sahn", label: "Ablution court", role: "entry", size: [11, 9], shapes: ["courtyard"], fire: "none", pole: false, program: "passage", furnish: ["basin"], clutter: ["shoes", "shoes", "shoes"], looks: [{ floor: "flag" }, { floor: "flag" }, { floor: "tile" }] },
      { id: "haram", label: "Prayer hall", role: "sanctum", program: "rows", size: [13, 10], fire: "none", furnish: ["prayer", "pulpit", "lamp"], clutter: ["book"], looks: [{ floor: "mat" }, { floor: "flag" }, { floor: "carpet" }] },
    ],
    styles: { altar: "mihrab", pulpit: "minbar", pole: "stone" },
    label: "Congregational mosque",
    region: "Islamic world",
    period: "650 – present",
    when: { start: { year: 650 }, end: { year: 2100 } },
    basis: "documented",
    note: "An open court leads to rows facing the prayer niche. The pulpit stands beside it. The Ottoman hall is broader, the Maghrebi hall has glazed tilework, and the earthen and coral-stone mosques have plain niches and woven mats.",
    shapes: ["rect"],
    size: [11, 9],
    door: "door",
    windowStyle: "lattice",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    pole: true,
    trades: ["household"],
    furnish: [],
    looks: [
      { wall: "plaster", floor: "flag", wear: 0.3, soot: 0.1 },
      { wall: "plaster", dado: "zellige", floor: "carpet", wear: 0.2, soot: 0.05 },
      { wall: "plaster", dado: "zellige", floor: "carpet", wear: 0.05, soot: 0.05 },
    ],
    colorways: [
      { name: "Limewash and turquoise", wall: "#e8e0d0", trim: "#5a4a38", floor: "#c8b8a0", wood: "#5a3e2a", accent: "#2a7a8a" },
      { name: "Red carpet and gilt", wall: "#e0d8c8", trim: "#4a3a2a", floor: "#b8a890", wood: "#4a3020", accent: "#a8302a" },
    ],
  },
  {
    id: "chinese-temple", institution: "worship", observance: buddhist,
    uses: ["venue.temple-court-east", "religious.chinese-temple", "religious.korean-temple"],
    rooms: [court, {id:"hall", label:"Main image hall", role:"sanctum", shapes:["rect"], size:[13,10], program:"rows",looks:[{wall:"painted-brackets"},{wall:"painted-brackets"},{wall:"painted-brackets"}]}],
    program: "rows",
    regulars: { hours: [7, 17], fill: 0.3 },
    styles: { altar: "buddha", pole: "red" },
    label: "Buddhist hall",
    region: "China, Korea and Vietnam",
    period: "500 – present",
    when: { start: { year: 500 }, end: { year: 2100 } },
    basis: "documented",
    note: "The main hall of a Chinese monastery as at Nanchan and Foguang: red lacquered columns, the gilded Buddha on a lotus throne behind an altar of incense, candles and flowers, kneeling cushions before it, a silk valance above.",
    shapes: ["rect"],
    size: [13, 11],
    door: "door",
    windowStyle: "lattice",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    pole: true,
    trades: ["household"],
    furnish: ["cushions", "lantern", "lantern"],
    looks: [
      { wall: "plaster", floor: "flag", wear: 0.3, soot: 0.3 },
      { wall: "plaster", floor: "flag", wear: 0.2, soot: 0.2 },
      { wall: "plaster", floor: "tile", wear: 0.05, soot: 0.1 },
    ],
    colorways: [
      { name: "Vermilion and gold", wall: "#c8a07a", trim: "#5a1a14", floor: "#8a8478", wood: "#6a2a1e", accent: "#c8902a" },
      { name: "Ochre and green", wall: "#d0b48a", trim: "#2a3a2a", floor: "#8a8070", wood: "#5a2a1e", accent: "#2a6a4a" },
    ],
  },
  {
    id: "japanese-temple", institution: "worship", observance: buddhist,
    uses: ["venue.temple-court-east", "religious.japanese-temple"],
    rooms: [court, {id:"hall", label:"Main hall", role:"sanctum", shapes:["rect"], size:[13,10], program:"rows",looks:[{wall:"bracketed"},{wall:"bracketed"},{wall:"bracketed"}]}],
    program: "rows",
    regulars: { hours: [6, 17], fill: 0.3 },
    styles: { altar: "buddha-jp", pole: "timber" },
    label: "Hondō",
    region: "Japan",
    period: "600 – present",
    when: { start: { year: 600 }, end: { year: 2100 } },
    basis: "documented",
    note: "The main hall of a Japanese temple: unpainted timber posts, a dark lacquered altar, the gilded Buddha before a flame mandorla, incense and offering lamps, worshippers kneeling on the boards.",
    shapes: ["rect"],
    size: [13, 11],
    door: "door",
    windowStyle: "shoji",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    pole: true,
    trades: ["household"],
    furnish: ["cushions", "lantern", "lantern"],
    looks: [
      { wall: "plaster", floor: "plank", wear: 0.3, soot: 0.3 },
      { wall: "shoji", floor: "plank", wear: 0.15, soot: 0.2 },
      { wall: "shoji", floor: "mat", wear: 0.05, soot: 0.1 },
    ],
    colorways: [
      { name: "Aged cypress", wall: "#d8c8a8", trim: "#3a2a1e", floor: "#9a7a52", wood: "#6a4a30", accent: "#7a2a2a" },
      { name: "Black lacquer", wall: "#c8bca0", trim: "#1a1210", floor: "#7a6040", wood: "#4a3020", accent: "#a8802a" },
    ],
  },
  {
    id: "hindu-temple", institution: "worship", observance: shrine,
    uses: ["venue.temple-court-south", "religious.london-mandir", "religious.nagara-temple", "religious.dravida-temple", "religious.newar-temple", "religious.khmer-temple", "religious.cham-tower", "religious.javanese-candi", "religious.balinese-pura"],
    regulars: { hours: [6, 12], fill: 0.4 },
    rooms: [
      { id: "mandapa", label: "Mandapa", role: "entry", program: "rows", size: [11, 10], fire: "none", furnish: ["lamp", "lamp"], clutter: ["flowers", "flowers", "shoes"] },
      { id: "garbhagriha", label: "Garbhagriha", role: "sanctum", program: "rows", size: [7, 5], fire: "none", windowStyle: "none", furnish: [], styles: { altar: "hindu" }, clutter: ["flowers"] },
    ],
    styles: { pole: "stone" },
    label: "Hindu temple",
    region: "South Asia",
    period: "500 – present",
    when: { start: { year: 500 }, end: { year: 2100 } },
    basis: "documented",
    note: "From the Gupta temples on: a pillared hall, the mandapa, leading to the small dark garbhagriha where the god stands garlanded, lit by oil lamps, bells hung at the door.",
    shapes: ["rect"],
    size: [11, 10],
    door: "door",
    windowStyle: "lattice",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    pole: true,
    trades: ["household"],
    furnish: [],
    looks: [
      { wall: "stone", floor: "flag", wear: 0.3, soot: 0.4 },
      { wall: "plaster", dado: "stripe", floor: "flag", wear: 0.2, soot: 0.3 },
      { wall: "plaster", dado: "stripe", floor: "tile", wear: 0.1, soot: 0.2 },
    ],
    colorways: [
      { name: "Sandstone", wall: "#c89a6a", trim: "#5a3a26", floor: "#a88a6a", wood: "#5a3a22", accent: "#d06a1a" },
      { name: "Granite", wall: "#9a948a", trim: "#3a3630", floor: "#8a847a", wood: "#4a3626", accent: "#c0302a" },
    ],
  },
  {
    id: "wat", institution: "worship", observance: {...buddhist, gathering: {...buddhist.gathering, passage:refuges}, service: act("Leading the recitation", "sanctum", "recitation", "altar", refuges)},
    uses: ["venue.wat", "religious.wat", "religious.pala-vihara"],
    program: "rows",
    regulars: { hours: [6, 12], fill: 0.4 },
    styles: { altar: "buddha", pole: "red" },
    label: "Ubosot",
    region: "Mainland Southeast Asia",
    period: "1250 – present",
    when: { start: { year: 1250 }, end: { year: 2100 } },
    basis: "documented",
    note: "The ordination hall of a Thai, Lao or Khmer monastery: a great gilded Buddha at the end of a long hall, red and gold columns, worshippers kneeling on mats. The walls would be covered in murals of the Buddha's lives; here they are plain.",
    shapes: ["rect"],
    size: [11, 13],
    door: "door",
    windowStyle: "shutter",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    pole: true,
    trades: ["household"],
    furnish: ["cushions", "lantern"],
    looks: [
      { wall: "plaster", floor: "tile", wear: 0.3, soot: 0.2 },
      { wall: "plaster", floor: "tile", wear: 0.2, soot: 0.1 },
      { wall: "plaster", dado: "stripe", floor: "carpet", wear: 0.05, soot: 0.05 },
    ],
    colorways: [
      { name: "Red and gold", wall: "#c8584a", trim: "#3a1a14", floor: "#a89078", wood: "#5a2a1a", accent: "#e0a830" },
      { name: "Lime and lacquer", wall: "#e0d4b8", trim: "#2a1a14", floor: "#a8987e", wood: "#4a2a1a", accent: "#a8302a" },
    ],
  },
  {
    id: "classical-temple", institution: "worship", observance: offering,
    uses: ["venue.temple-precinct", "religious.roman-temple", "religious.greek-temple", "religious.greek-temple-ionia", "religious.roman-temple-africa", "religious.hellenistic-egypt-shrine", "religious.hellenistic-levant-shrine"],
    rooms: [court, {id:"hall", label:"Cella", role:"sanctum", shapes:["rect"], size:[9,8], program:"rows"}],
    program: "rows",
    regulars: { hours: [8, 12], fill: 0.15 },
    styles: { altar: "classical", pole: "stone" },
    label: "Temple cella",
    region: "Greek and Roman Mediterranean",
    period: "600 BCE – 400 CE",
    when: { start: { year: -600 }, end: { year: 400 } },
    basis: "archaeological",
    note: "The cella that housed the god's image, as at the Parthenon and the Maison Carrée: an inner colonnade, the statue on its base, a small altar for incense. Sacrifice was at the great altar outside; few came in.",
    shapes: ["rect"],
    size: [9, 13],
    door: "door",
    windowStyle: "none",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    pole: true,
    trades: ["household"],
    furnish: ["lamp", "lamp"],
    looks: [
      { wall: "plaster", floor: "flag", wear: 0.3, soot: 0.3 },
      { wall: "plaster", dado: "panel", floor: "tile", wear: 0.2, soot: 0.2 },
      { wall: "plaster", dado: "panel", floor: "tile", wear: 0.05, soot: 0.1 },
    ],
    colorways: [
      { name: "Marble and red", wall: "#b04a32", trim: "#e8dcc4", floor: "#d8ccb4", wood: "#6a4a30", accent: "#e0b040" },
      { name: "White marble", wall: "#e4dcd0", trim: "#7a6e64", floor: "#dcd4c8", wood: "#6a5040", accent: "#2a4a8a" },
    ],
  },
  {
    id: "mesopotamian-temple", institution: "worship", observance: offering,
    uses: ["religious.mesopotamian-temple", "religious.hittite-temple"],
    program: "rows",
    regulars: { hours: [7, 11], fill: 0.15 },
    styles: { altar: "mesopotamian" },
    label: "Temple cella",
    region: "Mesopotamia and Anatolia",
    period: "3000 – 500 BCE",
    when: { start: { year: -3000 }, end: { year: -500 } },
    basis: "archaeological",
    note: "The broad cella of a Mesopotamian temple, as at Tell Asmar and Ur: buttressed mudbrick, the god's statue in a niche with its horned crown, an offering table of bread and beer. The worshipper statues that stood along the benches are not drawn.",
    shapes: ["rect"],
    size: [11, 8],
    door: "door",
    windowStyle: "none",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    trades: ["household"],
    furnish: ["lamp"],
    looks: [
      { wall: "mud", floor: "earth", wear: 0.4, soot: 0.4 },
      { wall: "mud", floor: "flag", wear: 0.3, soot: 0.3 },
      { wall: "plaster", dado: "stripe", floor: "flag", wear: 0.1, soot: 0.2 },
    ],
    colorways: [
      { name: "Mudbrick", wall: "#b8946a", trim: "#5a3a26", floor: "#9a7a58", wood: "#5a3e2a", accent: "#2a4a9a" },
      { name: "Whitewash", wall: "#ddd0b8", trim: "#5a4030", floor: "#a88a68", wood: "#5a3e2a", accent: "#a8402a" },
    ],
  },
  {
    id: "maya-temple", institution: "worship", observance: offering,
    uses: ["religious.maya-temple-pyramid", "religious.mesoamerican-temple-pyramid"],
    program: "rows",
    regulars: { hours: [6, 9], fill: 0.1 },
    styles: { altar: "maya" },
    label: "Temple shrine",
    region: "Mesoamerica",
    period: "250 – 1550",
    when: { start: { year: 250 }, end: { year: 1550 } },
    basis: "archaeological",
    note: "The small dark room on a pyramid's summit, as at Tikal and Palenque: plastered walls painted red, a carved and painted image, copal smoking in an effigy censer. Only priests went in.",
    shapes: ["rect"],
    size: [7, 6],
    door: "curtain",
    windowStyle: "none",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    trades: ["household"],
    furnish: [],
    looks: [
      { wall: "plaster", floor: "flag", wear: 0.3, soot: 0.5 },
      { wall: "plaster", floor: "flag", wear: 0.2, soot: 0.4 },
      { wall: "plaster", dado: "band", floor: "flag", wear: 0.1, soot: 0.3 },
    ],
    colorways: [
      { name: "Maya red", wall: "#a8402a", trim: "#3a1a14", floor: "#b8a88a", wood: "#5a3a22", accent: "#2a7a8a" },
      { name: "Lime white", wall: "#ddd4c0", trim: "#5a3a26", floor: "#a8987e", wood: "#5a3a22", accent: "#a8302a" },
    ],
  },
  {
    id: "chavin-gallery", institution: "worship", observance: offering,
    uses: ["religious.andean-platform-temple"],
    program: "rows",
    regulars: { hours: [5, 8], fill: 0.1 },
    styles: { altar: "lanzon" },
    label: "Temple gallery",
    region: "Andes",
    period: "1000 – 200 BCE",
    when: { start: { year: -1000 }, end: { year: -200 } },
    basis: "archaeological",
    note: "The Old Temple at Chavín de Huántar: narrow galleries of dressed stone in the dark of the platform, and where two cross, the Lanzón, a granite blade carved with a fanged god whose eyes look up, rising through the roof. Water ran through channels under the floor and could be made to roar.",
    shapes: ["rect"],
    size: [7, 7],
    door: "opening",
    windowStyle: "none",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    trades: ["household"],
    furnish: [],
    looks: [
      { wall: "stone", floor: "flag", wear: 0.3, soot: 0.5 },
      { wall: "stone", floor: "flag", wear: 0.2, soot: 0.4 },
      { wall: "stone", floor: "flag", wear: 0.1, soot: 0.3 },
    ],
    colorways: [
      { name: "Granite and shadow", wall: "#6a665c", trim: "#2a2622", floor: "#7a7468", wood: "#4a3a2a", accent: "#8a3a2a" },
      { name: "Grey limestone", wall: "#8a867a", trim: "#3a3630", floor: "#8a8478", wood: "#4a3a2a", accent: "#3a6a7a" },
    ],
  },
  {
    id: "moche-huaca", institution: "worship", observance: offering,
    uses: ["religious.andean-platform-temple"],
    program: "rows",
    regulars: { hours: [6, 10], fill: 0.15 },
    styles: { altar: "ai-apaec" },
    label: "Huaca shrine",
    region: "Andes",
    period: "200 BCE – 1400",
    when: { start: { year: -200 }, end: { year: 1400 } },
    basis: "archaeological",
    note: "A room on an adobe platform painted in relief, after the Moche Huaca de la Luna: registers of the fanged god's face in stepped diamonds and of stepped waves, red, yellow, white and black, stirrup-spout bottles set before him. The coast's later huacas, Chimú and others, are drawn from the same building.",
    shapes: ["rect"],
    size: [9, 7],
    door: "opening",
    windowStyle: "none",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    trades: ["household"],
    furnish: ["jars"],
    looks: [
      { wall: "frieze", floor: "earth", wear: 0.3, soot: 0.2 },
      { wall: "frieze", floor: "earth", wear: 0.2, soot: 0.1 },
      { wall: "frieze", floor: "flag", wear: 0.1, soot: 0.05 },
    ],
    colorways: [
      { name: "Adobe", wall: "#b89a78", trim: "#3a2418", floor: "#a88a68", wood: "#5a3a22", accent: "#a83a24" },
      { name: "Sun-dried", wall: "#c8aa84", trim: "#4a2e1e", floor: "#b8987a", wood: "#5a3a22", accent: "#e0b040" },
    ],
  },
  {
    id: "inca-temple", institution: "worship", observance: offering,
    uses: ["religious.andean-platform-temple"],
    program: "rows",
    regulars: { hours: [6, 10], fill: 0.2 },
    styles: { altar: "inca-sun" },
    label: "Temple of the Sun",
    region: "Inca Andes",
    period: "1400 – 1600",
    when: { start: { year: 1400 }, end: { year: 1600 } },
    basis: "documented",
    note: "An Inca temple as the chroniclers saw the Coricancha in Cusco: walls of fitted ashlar with trapezoidal niches, sheathed in gold in the greatest of them, the Punchao, a gold sun with a face, in its niche, and maize, chicha in gold keros and silver llamas offered before it.",
    shapes: ["rect"],
    size: [10, 7],
    door: "opening",
    windowStyle: "none",
    fire: "none",
    smokehole: false,
    seating: "floor",
    sleep: "none",
    trades: ["household"],
    furnish: ["jars"],
    looks: [
      { wall: "ashlar", floor: "flag", wear: 0.2, soot: 0.2 },
      { wall: "ashlar", floor: "flag", wear: 0.1, soot: 0.1 },
      { wall: "ashlar", floor: "flag", wear: 0.05, soot: 0.05 },
    ],
    colorways: [
      { name: "Andesite", wall: "#8a8478", trim: "#2a2622", floor: "#8a8274", wood: "#4a3424", accent: "#a83a24" },
      { name: "Limestone", wall: "#b0a896", trim: "#3a342c", floor: "#a09682", wood: "#4a3424", accent: "#2a6a8a" },
    ],
  },
  {
    id: "mound-temple", institution: "worship", observance: offering,
    uses: ["religious.mississippian-platform-mound", "religious.cahokia-great-mound"],
    program: "gather",
    regulars: { hours: [5, 9], fill: 0.2 },
    styles: { altar: "etowah", ledge: "platform" },
    label: "Mound temple",
    region: "Mississippian Southeast",
    period: "800 – 1600",
    when: { start: { year: 800 }, end: { year: 1600 } },
    basis: "archaeological",
    note: "The temple on a platform mound, as at Etowah and as the Natchez kept theirs for the French: a sacred fire never let out in the middle, cane benches round the wall, and the ancestors, a pair of painted marble figures, a man cross-legged and a woman kneeling, under a copper plate of the falcon dancer.",
    shapes: ["rect"],
    size: [10, 9],
    door: "opening",
    windowStyle: "none",
    fire: "firepit",
    smokehole: true,
    seating: "chair",
    sleep: "none",
    trades: ["household"],
    furnish: ["basket"],
    looks: [
      { wall: "reed", floor: "earth", wear: 0.3, soot: 0.5 },
      { wall: "mud", floor: "earth", wear: 0.2, soot: 0.4 },
      { wall: "mud", floor: "earth", wear: 0.1, soot: 0.3 },
    ],
    colorways: [
      { name: "Daub and cane", wall: "#a88a64", trim: "#3a2a1c", floor: "#8a6a48", wood: "#5a3e26", accent: "#a83a2a" },
      { name: "Whitewashed clay", wall: "#d0c4a8", trim: "#3a2a1c", floor: "#9a7a58", wood: "#5a3e26", accent: "#2a2a2a" },
    ],
  },
];

const prayerHouse = worship.find(p => p.id === "reformed-church")!;
for (const [id, label, region, start, end] of [
  ["london-synagogue","Neighbourhood synagogue","London",2016,2026],
  ["galilean-synagogue","Galilean synagogue","Galilee",250,550],
  ["sephardi-synagogue","Sephardi synagogue","Ottoman Mediterranean",1500,1923],
  ["ashkenazi-synagogue","Ashkenazi synagogue","Polish-Lithuanian borderlands",1700,1940],
] as const) {
  const ancient = id === "galilean-synagogue";
  worship.push({...prayerHouse, id, label, region, uses:["religious."+id], period:`${start} – ${end}`,
    when:{start:{year:start},end:{year:end-1}}, basis:ancient ? "archaeological" : "documented",
    note:ancient ? "A Galilean assembly hall with stone benches around its walls and a place for the scrolls." :
      "A reader’s platform stands apart from the ark. Benches face inward, and a side room serves for study.",
    shapes:["rect"], observance:reading, regulars:{hours:[7,11],fill:.5}, windowStyle:ancient ? "none" : "lattice",
    styles:{altar:ancient ? "torah-niche" : "torah-ark", lectern:ancient ? "reader" : "bimah", ledge:ancient ? "marble" : "bench"}, pole:false,
    rooms:[id === "sephardi-synagogue" ? court : porch,
      {id:"prayer",label:"Prayer hall",role:"sanctum",size:[13,10],shapes:["rect"],program:"gather",furnish:["lectern"]},
      {id:"study",label:"Study room",role:"work",size:[7,5],program:"passage",furnish:["bench","lowtable",...(ancient ? [] : ["shelf" as const])]}],
    colorways:ancient ? [{name:"Galilean limestone",wall:"#d8ccb1",trim:"#897962",floor:"#bdad91",wood:"#775c43",accent:"#935744"},{name:"Galilean basalt",wall:"#978f81",trim:"#605a52",floor:"#8e897c",wood:"#795d46",accent:"#845143"}] :
      [{name:"Madder and indigo",wall:"#e4cfa6",trim:"#75503b",floor:"#bb9c79",wood:"#77452e",accent:"#972e46"},
       {name:"Blue velvet",wall:"#dbcfad",trim:"#6d5440",floor:"#b39c7b",wood:"#714631",accent:"#344d78"}],
    looks:prayerHouse.looks.map(l=>({...l,wall:ancient ? "ashlar" : "plaster",dado:undefined,floor:"flag"})) as InteriorProfile["looks"],
  });
}

const mandapa = worship.find(p => p.id === "hindu-temple")!;
worship.push({...worship.find(p=>p.id==="mesopotamian-temple")!, id:"nile-temple", label:"Nile temple",region:"Egypt and Kush",
  uses:["religious.pharaonic-temple","religious.kushite-temple"],period:"third millennium BCE – fourth century CE",when:{start:{year:-3000},end:{year:350}},
  note:"The outer court receives offerings. Beyond it a columned hall ends at the closed shrine of the cult image. The painted capitals and cornice draw on surviving Nile temples.",
  styles:{altar:"naos",pole:"papyrus"},regulars:{hours:[5,8],fill:.2},observance:{
    gathering:act("Waiting in the outer court","entry"),visit:act("Bringing bread to the temple","entry","cloth"),
    service:act("Laying out linen for the morning offering","sanctum","cloth","altar")},
  rooms:[{...court,label:"Offering court"}, {id:"hall",label:"Columned hall",role:"sanctum",size:[13,10],program:"rows",pole:true,furnish:[],clutter:[]}],
  looks:[0,1,2].map(i=>({wall:"ashlar",floor:"flag",wear:.23-.06*i,soot:.12})) as InteriorProfile["looks"],
  colorways:[{name:"Painted limestone",wall:"#dfcba5",trim:"#a99066",floor:"#c5b08d",wood:"#795338",accent:"#477c79"},
    {name:"Red sandstone",wall:"#c9a27b",trim:"#856444",floor:"#b39470",wood:"#714c33",accent:"#a4583c"}],
});
worship.push({...mandapa, id:"jain-temple",label:"Jain temple",uses:["religious.jain-temple"],region:"Western India",
  note:"A pillared hall faces a seated Jina in an inner shrine. The pale stone and carved niches draw on temples of western India.",
  rooms:[mandapa.rooms![0],{...mandapa.rooms![1],label:"Shrine of the Jina",styles:{altar:"jina"}}],
  colorways:[{name:"Carved marble",wall:"#e2d7be",trim:"#908171",floor:"#cfc5ae",wood:"#815f45",accent:"#b98648"},{name:"Warm limestone",wall:"#dcc399",trim:"#967855",floor:"#b89f7b",wood:"#77604a",accent:"#a85636"}],
  observance:{gathering:act("Standing before the Jina","entry"),visit:act("Bringing flowers","entry","cloth")},
}, {...mandapa, id:"gurdwara",label:"Gurdwara",uses:["religious.gurdwara","religious.london-gurdwara"],region:"Punjab",period:"1600 – present",
  when:{start:{year:1600},end:{year:2100}},note:"The scripture rests beneath a canopy in the assembly hall. The congregation sits on the floor. Volunteers prepare and share a meal in the adjoining langar.",
  regulars:{hours:[6,12],fill:.45},observance:{layLeader:"adult",gathering:act("Singing a hymn together","sanctum","unison",undefined,aarti),visit:act("Serving the shared meal","kitchen","cup"),diner:act("Eating in the langar","kitchen"),service:act("Leading the hymn","sanctum","strings","altar",aarti)},
  rooms:[porch,{id:"darbar",label:"Assembly hall",role:"sanctum",size:[13,11],program:"rows",furnish:["cushions"],styles:{altar:"palki",cushions:"durrie"},looks:[{wall:"round-arched"},{wall:"round-arched"},{wall:"round-arched"}]},
    {id:"langar",label:"Langar · community kitchen",role:"kitchen",size:[8,7],program:"passage",fire:"firepit",seating:"floor",pole:false,furnish:["jars","potrack","sacks"],styles:{firepit:"cooking-pot"}}],
}, {...mandapa,id:"fire-temple",label:"Fire temple",uses:["religious.iranian-fire-temple","religious.sogdian-fire-temple","religious.parsi-fire-temple"],
  period:"Sasanian Iran and later Parsi communities",region:"Iran, Sogdiana and Gujarat",when:{start:{year:200},end:{year:2100}},
  note:"A prayer hall faces the enclosed fire sanctuary. The older Iranian fire stands on a stepped stone support. In the Parsi temple the priest tends a metal fire vessel.",
  regulars:{hours:[6,19],fill:.12},observance:{gathering:act("Praying before the fire","sanctum","recitation",undefined,ashemVohu),visit:act("Praying quietly","sanctum"),service:act("Preparing wood for the fire","store","wood")},
  rooms:[porch,{id:"prayer",label:"Prayer hall",role:"sanctum",size:[10,9],program:"rows",furnish:[],windowStyle:"none",styles:{altar:"fire-sanctuary"}},
    {id:"fuel",label:"Fuel store",role:"store",size:[5,5],program:"passage",furnish:["crate"],clutter:[]}],
});

const wat = worship.find(p => p.id === "wat")!;
worship.push({...wat,id:"stupa-court",label:"Processional terrace",region:"South and Southeast Asia",period:"third century BCE – present",
  when:{start:{year:-250},end:{year:2100}},uses:["religious.early-stupa","religious.early-sea-stupa","religious.lanka-dagoba","religious.burmese-pagoda"],
  note:"Devotees approach the relic mound along an open terrace and keep it on their right. The relic chamber is sealed.",
  colorways:[{name:"Weathered sandstone",wall:"#a18d73",trim:"#755f49",floor:"#928370",wood:"#725a44",accent:"#a85b40"},{name:"Grey paving",wall:"#b0a899",trim:"#645d55",floor:"#857f75",wood:"#705c49",accent:"#92583e"}],
  looks:wat.looks.map(l=>({...l,floor:"flag",dado:undefined})) as InteriorProfile["looks"],
  program:"passage",size:[13,12],windowStyle:"none",shapes:["terrace"],pole:false,furnish:[],clutter:[],styles:{altar:"stupa"},
  observance:{gathering:act("Pausing on the path around the relic mound","entry"),visit:act("Laying flowers beside the path","entry","cloth")},
});

worship.push({...prayerHouse,id:"modern-parish",label:"Parish church",region:"Western Europe",period:"twentieth century – present",
  when:{start:{year:1900},end:{year:10001}},uses:["religious.gothic-parish","religious.anglican-parish","venue.churchyard"],
  note:"A parish using an older nave, with a reading desk and open benches. The furnishings are a reconstruction of an ordinary modern parish.",
  basis:"reconstructed",windowStyle:"stained",styles:{altar:"communion-table",pole:"stone"},
  rooms:[porch,{id:"nave",label:"Nave",role:"sanctum",size:[12,12],shapes:["apse"],program:"rows",furnish:["font","lectern"]}],
  observance:{...church,gathering:act("Singing from the hymn book","sanctum","unison"),service:act("Reading the lesson","sanctum","recitation","lectern",lesson)},
});

const terrace = worship.find(p=>p.id==="stupa-court")!;
for (const [id,label,region,from,to] of [
  ["heiau","Heiau terrace","Hawaiian Islands",1000,1820],["marae","Marae court","Eastern Polynesia",1000,1830],
  ["sacred-grove","Grove clearing","West and Central Africa",-500,1900],
  ["orisha-shrine","Shrine courtyard","Gulf of Guinea",1000,1900],["asante-shrine","Shrine house","Asante",1600,1900],
] as const) {
  const house = id.endsWith("shrine"), grove = id === "sacred-grove";
  worship.push({...terrace,id,label,region,uses:["religious."+id],period:`${formatYear(from)} – ${to}`,
    when:{start:{year:from},end:{year:to-1}},basis:"reconstructed",regulars:{hours:[7,12],fill:.09},
    note:house ? "Visitors approach an open-sided shrine from the court. Local shrine houses supply its earthen walls, vessels and timber supports." :
      grove ? "An open clearing at the edge of the sacred grove. Visitors leave offerings at its threshold." : "An open court of dark stones leads up to a raised place for offerings. The sacred platform and its approaches remain open to the sky.",
    observance:{gathering:act("Waiting at the edge of the court","entry"),visit:act("Bringing an offering","entry","cloth")},
    styles:house ? {pole:"timber",fountain:"none"} : grove ? {} : {altar:"ahu"},
    rooms:house ? [{...court,label:"Shrine courtyard"}, {id:"shrine",label:"Offering room",role:"sanctum",size:[8,6],program:"passage",furnish:["jars","lowtable"],windowStyle:"none"}] : undefined,
    looks:terrace.looks.map(l=>({...l,wall:house ? "mud" : "ashlar",floor:house || grove ? "earth" : "flag",dado:house ? "band" : undefined})) as InteriorProfile["looks"],
    furnish:grove ? ["jars","plant","plant"] : [],colorways:[
      {name:"Earth and dark stone",wall:"#c2a47d",trim:"#605340",floor:"#887866",wood:"#7a4a33",accent:"#8e4229"},
      {name:"Clay and lime",wall:"#d9c9a2",trim:"#705744",floor:"#8e8573",wood:"#744f37",accent:"#ad5134"}],
  });
}

export function localWorship(profile: InteriorProfile, use: string, year: number, school?: string): InteriorProfile {
  if (use === "venue.churchyard" && profile.observance) {
    const tradition = profile.id === "orthodox-church" ? "Orthodox Christian" : profile.id === "reformed-church" ? "Protestant" :
      profile.id === "modern-parish" ? "Christian" : "Latin Christian";
    return {...profile,observance:{...profile.observance,tradition}};
  }
  if (profile.id === "nile-temple" && year < -1550)
    return {...profile,styles:{altar:"naos",pole:"timber"},rooms:profile.rooms!.map(r=>r.role==="sanctum" ? {...r,label:"Offering hall",size:[8,6]} : r)};
  if (use.startsWith("religious.london-")) {
    return {...profile, pole:false, windowStyle:"glazed",
      looks:profile.looks.map(l => ({...l,wall:"plaster",dado:undefined})) as InteriorProfile["looks"],
      rooms:profile.rooms?.map(r => {
        if (r.id === "sahn") return {...porch, label:"Entrance and washing area", furnish:["basin"], clutter:["shoes"]};
        if (r.role === "kitchen") return {...r, fire:"stove", styles:undefined};
        return {...r, looks:undefined, ...(r.id === "haram" ? {looks:[{floor:"carpet"},{floor:"carpet"},{floor:"carpet"}]} : {})};
      })};
  }
  if (profile.id === "mosque") {
    const earth = use.includes("sahel"), coral = use.includes("swahili");
    const ornament = earth ? "earth" : coral ? "coral" : use.includes("maghrebi") ? "horseshoe" :
      /persian|central-asian/.test(use) ? "tile-arch" : "arcade";
    return {...profile,styles:{...profile.styles, pole:earth ? "earth" : "stone", prayer:earth || coral ? "reed" : "wool", altar:earth || coral ? "plain-mihrab" : "mihrab"},
      looks:profile.looks.map(l=>({...l, wall:earth ? "mud" : coral ? "plaster" : ornament === "horseshoe" || ornament === "tile-arch" ? ornament : "round-arched", dado:ornament === "horseshoe" ? l.dado : undefined})) as InteriorProfile["looks"],
      rooms:profile.rooms!.map(r=>r.role === "sanctum" ? {...r,size:use.includes("ottoman") ? [15,10] : [12,12],
        ...(earth || coral ? {looks:[{floor:"mat"},{floor:"mat"},{floor:"mat"}]} : {})} : {...r,styles:{fountain:earth || coral ? "none" : "basin"}})};
  }
  if (profile.id === "orthodox-church" && (year < 1000 || /ethiopian|coptic|nubian/.test(use)))
    return {...profile,styles:{...profile.styles,altar:use.includes("ethiopian") ? "sanctuary-curtain" : "screen-templon"}};
  if (profile.id === "japanese-temple" && school === "pure-land")
    return {...profile,observance:{...buddhist,gathering:act("Reciting the nembutsu","sanctum","unison",undefined,nembutsu),
      service:act("Leading the nembutsu","sanctum","recitation","altar",nembutsu)}};
  if (profile.id === "japanese-temple" && school === "lotus")
    return {...profile,observance:{...buddhist,service:act("Leading the recitation","sanctum","recitation","altar",lotus)}};
  if (profile.id === "japanese-temple")
    return {...profile,observance:{...buddhist,gathering:act("Listening to the recitation","sanctum"),
      service:year < 1600 ? act("Leading the recitation","sanctum","recitation","altar") : buddhist.service}};
  if (profile.id === "chinese-temple" && use.includes("korean"))
    return {...profile,styles:{...profile.styles,pole:year >= 900 ? "dancheong" : "timber"},rooms:profile.rooms!.map(r=>r.role === "sanctum" && year < 900 ? {...r,looks:[{wall:"bracketed"},{wall:"bracketed"},{wall:"bracketed"}]} : r)};
  if (profile.id === "fire-temple" && use.includes("parsi"))
    return {...profile,rooms:profile.rooms!.map(r=>r.role === "sanctum" ? {...r,styles:{altar:"fire-urn"}} : r)};
  if (profile.id === "stupa-court" && /dagoba|pagoda/.test(use))
    return {...profile,styles:{altar:use.includes("dagoba") ? "dagoba" : "zedi"}};
  return profile;
}


export function worshipAct(rite: Observance | undefined, label: string | undefined, clock: number) {
  const activity = rite && [rite.visit, rite.gathering, rite.service, rite.diner].find(a => a && a.label === label);
  if (activity && rite?.gathering.row && activity === rite.service) {
    const hour = Math.floor(clock / 3600) % 24, day = Math.floor(clock / 86400) % 7;
    // Afternoon and ordinary noon prayers are recited quietly.
    if (hour === 15 || (hour === 12 && day !== rite.weekday)) return {...activity, sound:undefined, passage:undefined};
  }
  return activity;
}

export function worshipHours(rite: Observance, day: number, hour: number, hours: [number,number]) {
  const peak = rite.hours ? rite.hours.includes(hour) : hour >= hours[0] && hour < hours[1];
  const weekly = rite.weekday === undefined || (day % 7 === rite.weekday && (!rite.hours || hour === hours[0]));
  return {peak, fill:peak ? (weekly ? 1 : .24) : hour >= 6 && hour < 19 ? .10 : 0};
}
