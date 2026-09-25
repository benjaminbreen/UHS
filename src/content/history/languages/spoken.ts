import type { LanguageWindow } from ".";

// Once a language is written, the model knows which one it is; what it gets
// wrong is the stage, and the learned register in place of the spoken one.
type Box = [number, number, number, number];
const ITALY: Box = [6.5, 37.8, 18.6, 47];
// Two boxes so the Channel stays between Gaul and Britain.
const GAUL: Box = [-5, 42.3, 8, 49.8];
const NORTH_GAUL: Box = [1.5, 49.8, 8, 51.1];
const IBERIA: Box = [-10, 36, 3.3, 43.8];
const ENGLAND: Box = [-6, 49.8, 2, 55.8];
const IRELAND: Box = [-10.7, 51.3, -5.4, 55.5];
const GERMANY: Box = [7.2, 47, 15, 55];
const NORTH: Box = [4, 55, 32, 71];
const AEGEAN: Box = [19.5, 34.5, 28.5, 41];
const ANATOLIA: Box = [26, 36, 45, 42];
const LEVANT: Box = [34, 29, 42, 37.5];
const MESOPOTAMIA: Box = [42, 29, 49, 37.5];
const EGYPT: Box = [24, 22, 36, 32];
const MAGHREB: Box = [-17, 27, 24, 37.5];
const IRAN: Box = [44, 25, 63, 40];
const NORTH_CHINA: Box = [100, 30, 125, 42];
const SOUTH_CHINA: Box = [100, 18, 122, 30];
const JAPAN: Box = [129, 30, 146, 46];
const KOREA: Box = [124, 33, 131, 43];
const VIETNAM: Box = [102, 16, 110, 23.5];
const KHMER: Box = [99, 9, 108, 16];
const ISLANDS: Box = [95, -11, 141, 6];
const CENTRAL_MEXICO: Box = [-100.5, 18, -97, 20.5];
const SWAHILI: Box = [38, -12, 45, 0];

export const spoken: LanguageWindow[] = [
  // Europe
  {
    id: "latin-italy",
    years: [-300, 200],
    box: [ITALY],
    hypotheses: [
      { label: "Spoken Latin (attested)", probability: 0.8, confidence: "attested",
        note: "The Latin of the street and the farm, not Cicero's: dropped final -m, ae already drifting to e, diminutives, plain parataxis.",
        draw: "Pompeian graffiti, Plautus, the freedmen in Petronius, the Appendix Probi." },
      { label: "Oscan, Umbrian or Greek (attested)", probability: 0.2, confidence: "attested",
        note: "Oscan in the south until the Social War; Greek in Naples and Sicily." },
    ],
  },
  {
    id: "latin-provinces",
    years: [-100, 450],
    box: [GAUL, NORTH_GAUL, IBERIA],
    hypotheses: [
      { label: "Provincial spoken Latin (attested)", probability: 0.65, confidence: "attested",
        note: "Towns, roads and the army spoke Latin with local colour.",
        draw: "Vindolanda-style letters, curse tablets, Pompeian graffiti; regional words from the Romance descendants." },
      { label: "Gaulish or Celtiberian (attested)", probability: 0.35, confidence: "attested",
        note: "The countryside kept its language: Gaulish is still spoken into the fifth century.",
        draw: "Gaulish from Larzac, Chamalières and La Graufesenque; Delamarre's dictionary." },
    ],
  },
  {
    id: "late-latin",
    years: [450, 750],
    box: [ITALY, GAUL, NORTH_GAUL, IBERIA],
    hypotheses: [
      { label: "Late spoken Latin, proto-Romance (inferred)", probability: 0.85, confidence: "inferred",
        note: "Cases collapsing into prepositions, ille and unus becoming articles, habeo forming new futures. Classical Latin is for priests and notaries.",
        draw: "The Reichenau glosses, Gregory of Tours' 'errors', and back-projection from the Romance languages." },
      { label: "Frankish, Gothic or Lombard (attested in names)", probability: 0.15, confidence: "inferred",
        note: "The Germanic ruling class, bilingual within a few generations." },
    ],
  },
  {
    id: "early-romance",
    years: [750, 1100],
    box: [ITALY, GAUL, NORTH_GAUL, IBERIA],
    hypotheses: [
      { label: "Early Romance vernacular (attested)", probability: 0.75, confidence: "attested",
        note: "Old French in the north (the Strasbourg Oaths of 842), Old Occitan in the south, Italo- and Ibero-Romance dialects. Latin is only for church and charters.",
        draw: "The Strasbourg Oaths, the Sequence of Saint Eulalia, the Glosas Emilianenses, the Placiti Cassinesi, as fits the place." },
      { label: "Andalusi Arabic or Mozarabic (attested)", probability: 0.2, confidence: "attested",
        note: "In al-Andalus after 711; Romance survives in the kharjas.", draw: "Corriente's Andalusi Arabic; the kharjas." },
      { label: "Basque or Breton (attested)", probability: 0.05, confidence: "attested" },
    ],
  },
  {
    id: "medieval-romance",
    years: [1100, 1500],
    box: [ITALY, GAUL, NORTH_GAUL, IBERIA],
    hypotheses: [
      { label: "Medieval Romance vernacular (attested)", probability: 0.9, confidence: "attested",
        note: "Old or Middle French, Occitan, Catalan, Castilian, Galician-Portuguese, Tuscan, Venetian or another regional vernacular, as the place gives. The spoken dialect, not the literary standard.",
        draw: "Chrétien, the troubadours, the Cid, Dante's and Boccaccio's dialogue, notarial records of the region." },
      { label: "Andalusi Arabic (attested)", probability: 0.1, confidence: "attested", note: "Granada until 1492." },
    ],
  },
  {
    id: "old-irish",
    years: [500, 1200],
    box: [IRELAND],
    hypotheses: [
      { label: "Old Irish, then Middle Irish (attested)", probability: 0.95, confidence: "attested",
        note: "Primitive Irish becomes Old Irish around 600 and Middle Irish around 900.",
        draw: "Thurneysen's grammar; the Würzburg and Milan glosses; the eDIL dictionary." },
      { label: "Latin (attested)", probability: 0.05, confidence: "attested", note: "Monks only." },
    ],
  },
  {
    id: "old-english",
    years: [450, 1100],
    box: [ENGLAND],
    hypotheses: [
      { label: "Old English (attested)", probability: 0.8, confidence: "attested",
        note: "West Saxon, Mercian, Northumbrian or Kentish by region; Norse-coloured in the Danelaw after 870.",
        draw: "Ælfric's Colloquy for everyday talk; Bosworth-Toller; regional forms." },
      { label: "Common Brittonic, then Old Welsh (attested)", probability: 0.15, confidence: "attested", note: "The west, early in the window." },
      { label: "Old Norse (attested)", probability: 0.05, confidence: "attested", note: "The Danelaw." },
    ],
  },
  {
    id: "middle-english",
    years: [1100, 1500],
    box: [ENGLAND],
    hypotheses: [
      { label: "Middle English (attested)", probability: 0.85, confidence: "attested",
        note: "The regional dialect: Kentish, Midland, Northern. Early Middle English still has inflections; Chaucer's London English is late.",
        draw: "The Peterborough Chronicle, the Ormulum, Ancrene Wisse, Chaucer, the Paston letters, the MED." },
      { label: "Anglo-Norman French (attested)", probability: 0.15, confidence: "attested", note: "The gentry and the courts, fading after 1350." },
    ],
  },
  {
    id: "early-modern-english",
    years: [1500, 1700],
    box: [ENGLAND],
    hypotheses: [
      { label: "Early Modern English, spoken (attested)", probability: 1, confidence: "attested",
        note: "Thou and you still distinct by intimacy and rank, -th giving way to -s, oaths everywhere. Not the stately prose of the King James Bible.",
        draw: "Court depositions, Shakespeare's and Dekker's low characters, Machyn's diary." },
    ],
  },
  {
    id: "old-high-german",
    years: [750, 1350],
    box: [GERMANY],
    hypotheses: [
      { label: "Old High German, then Middle High German (attested)", probability: 0.8, confidence: "attested",
        note: "Old High German until about 1050, then Middle High German; Old Saxon and then Middle Low German in the north.",
        draw: "Braune's Old High German grammar, the Kassel Glosses (a traveller's phrasebook), Lexer's Middle High German dictionary." },
      { label: "Slavic (attested)", probability: 0.15, confidence: "attested", note: "East of the Elbe." },
      { label: "Latin (attested)", probability: 0.05, confidence: "attested" },
    ],
  },
  {
    id: "old-norse",
    years: [750, 1350],
    box: [NORTH],
    hypotheses: [
      { label: "Old Norse (attested)", probability: 0.85, confidence: "attested",
        note: "Old East Norse in Denmark and Sweden, Old West Norse in Norway; runic Norse before the sagas.",
        draw: "Runic inscriptions early, saga dialogue later; Zoëga and Cleasby-Vigfusson." },
      { label: "Proto-Sámi or Finnic (reconstructed)", probability: 0.15, confidence: "reconstructed", note: "The north and east." },
    ],
  },
  // Greek world
  {
    id: "classical-greek",
    years: [-800, -300],
    box: [AEGEAN],
    hypotheses: [
      { label: "Ancient Greek, local dialect (attested)", probability: 0.95, confidence: "attested",
        note: "Attic in Athens, Doric in Sparta and Corinth, Ionic on the islands and Asian coast, Aeolic in Lesbos and Boeotia. Speech is plainer than Thucydides.",
        draw: "Aristophanes for Attic talk, inscriptions for the local dialect; Smyth; LSJ." },
      { label: "Thracian or Illyrian (attested in names)", probability: 0.05, confidence: "inferred", note: "The northern edge." },
    ],
  },
  {
    id: "anatolia-iron",
    years: [-1180, -300],
    box: [ANATOLIA],
    hypotheses: [
      { label: "Phrygian, Lydian or Luwian descendants (attested)", probability: 0.6, confidence: "attested",
        note: "Phrygian on the plateau, Lydian at Sardis, Lycian, Carian and late Luwian in the south.",
        draw: "Old Phrygian and Lydian inscriptions (Brixhe, Melchert's Lydian corpus)." },
      { label: "Greek (attested)", probability: 0.25, confidence: "attested", note: "The Aegean coast." },
      { label: "Urartian or Aramaic (attested)", probability: 0.15, confidence: "attested", note: "The east." },
    ],
  },
  {
    id: "koine",
    years: [-300, 600],
    box: [AEGEAN, ANATOLIA],
    hypotheses: [
      { label: "Koine Greek, spoken (attested)", probability: 0.85, confidence: "attested",
        note: "Itacism well under way, the dative fading, the optative gone from speech.",
        draw: "Documentary papyri and the Gospel of Mark, not Atticizing authors." },
      { label: "Anatolian or Celtic survivals (attested)", probability: 0.15, confidence: "attested",
        note: "Phrygian and Isaurian in the interior, Galatian around Ancyra." },
    ],
  },
  {
    id: "medieval-greek",
    years: [600, 1453],
    box: [AEGEAN, ANATOLIA],
    hypotheses: [
      { label: "Medieval vernacular Greek (attested)", probability: 0.8, confidence: "attested",
        note: "Close to modern Greek in sound; churchmen and chroniclers wrote an Atticizing Greek nobody spoke.",
        draw: "The Ptochoprodromic poems, the Chronicle of Morea, Digenis Akritas." },
      { label: "Old Anatolian Turkish (attested)", probability: 0.2, confidence: "attested", note: "Anatolia after 1071, rising." },
    ],
  },
  // Near East and North Africa
  {
    id: "mesopotamia-late-akkadian",
    years: [-2000, -600],
    box: [MESOPOTAMIA],
    hypotheses: [
      { label: "Babylonian or Assyrian Akkadian, spoken stage (attested)", probability: 0.75, confidence: "attested",
        note: "Old, Middle or Neo-Babylonian in the south and Assyrian in the north, by date. Sumerian is dead as speech after about 1800 BCE; Aramaic spreads after 800.",
        draw: "Letters, not royal inscriptions: the Old Babylonian and Neo-Assyrian correspondence; CAD." },
      { label: "Aramaic (attested)", probability: 0.25, confidence: "attested", note: "From about 900 BCE, fast." },
    ],
  },
  {
    id: "aramaic",
    years: [-600, 700],
    box: [LEVANT, MESOPOTAMIA],
    hypotheses: [
      { label: "Spoken Aramaic dialect (attested)", probability: 0.75, confidence: "attested",
        note: "Imperial, then Galilean, Palestinian, Syriac or Babylonian Jewish Aramaic by place. Hebrew is liturgical; Greek is for cities and officials.",
        draw: "Galilean Aramaic of the Palestinian Talmud, Syriac of Edessa, Jewish Babylonian Aramaic; Sokoloff's dictionaries." },
      { label: "Greek (attested)", probability: 0.15, confidence: "attested", note: "Cities after Alexander." },
      { label: "Arabic or Nabataean (attested)", probability: 0.1, confidence: "attested", note: "Desert margins." },
    ],
  },
  {
    id: "persian",
    years: [-600, 1500],
    box: [IRAN],
    hypotheses: [
      { label: "Persian of the period (attested)", probability: 0.85, confidence: "attested",
        note: "Old Persian and Median until about 300 BCE, Middle Persian or Parthian until the 700s, then early New Persian (Dari).",
        draw: "Achaemenid inscriptions; Middle Persian texts (MacKenzie); early New Persian of Ferdowsi and Bal'ami." },
      { label: "Other Iranian or Arabic (attested)", probability: 0.15, confidence: "attested", note: "Kurdish, Baluch, Sogdian; Arabic in cities after 650." },
    ],
  },
  {
    id: "egypt-pharaonic",
    years: [-3200, -700],
    box: [EGYPT],
    hypotheses: [
      { label: "Egyptian, spoken stage (attested)", probability: 0.95, confidence: "attested",
        note: "Old Egyptian to about 2000 BCE, then Middle Egyptian, then Late Egyptian from about 1300. Middle Egyptian stays the written classic long after nobody speaks it.",
        draw: "Vocalised with Coptic evidence and Loprieno's reconstructions; Late Egyptian letters and the Tale of Wenamun for late speech." },
      { label: "Nubian, Libyan or Semitic (attested)", probability: 0.05, confidence: "attested" },
    ],
  },
  {
    id: "egypt-demotic-coptic",
    years: [-700, 1000],
    box: [EGYPT],
    hypotheses: [
      { label: "Demotic, then Coptic Egyptian (attested)", probability: 0.7, confidence: "attested",
        note: "Coptic is the first stage written with its vowels. Sahidic in the south, Bohairic in the Delta.",
        draw: "Crum's Coptic Dictionary; Layton's Sahidic grammar." },
      { label: "Greek, then Arabic (attested)", probability: 0.3, confidence: "attested", note: "Greek in Alexandria; Arabic after 641, spreading slowly." },
    ],
  },
  {
    id: "arabic-vernacular",
    years: [700, 1600],
    box: [LEVANT, MESOPOTAMIA, EGYPT, MAGHREB],
    hypotheses: [
      { label: "Spoken regional Arabic (attested)", probability: 0.75, confidence: "attested",
        note: "The local dialect: Levantine, Iraqi, Egyptian or Maghrebi, not the Qur'anic classical register.",
        draw: "Middle Arabic documents from the Cairo Geniza; Ibn Quzman's zajals; Blau's grammar." },
      { label: "Berber, Coptic, Aramaic or Greek (attested)", probability: 0.25, confidence: "attested",
        note: "Berber across the Maghreb countryside; Coptic villages till about 1000; Aramaic in the hills." },
    ],
  },
  // East and Southeast Asia
  {
    id: "old-chinese",
    years: [-1250, -200],
    box: [NORTH_CHINA],
    hypotheses: [
      { label: "Old Chinese (reconstructed)", probability: 0.9, confidence: "reconstructed",
        note: "The spoken language behind the oracle bones and the Shijing; consonant clusters, no tones yet.",
        draw: "Baxter-Sagart Old Chinese in their notation (*ŋˤajʔ 'I', *mə 'not', *mə-lək 'eat'), not modern pinyin." },
      { label: "Non-Sinitic neighbours (hypothetical)", probability: 0.1, confidence: "conjectural", note: "Rong and Di peoples at the edges." },
    ],
  },
  {
    id: "middle-chinese",
    years: [-200, 1300],
    box: [NORTH_CHINA, SOUTH_CHINA],
    hypotheses: [
      { label: "Eastern Han, then Middle Chinese, spoken (reconstructed)", probability: 0.8, confidence: "reconstructed",
        note: "The vernacular, not Literary Chinese: Middle Chinese has four tones and final -p -t -k -m. Early Mandarin rises in the north after 1000.",
        draw: "Schuessler's Eastern Han; Baxter's transcription of the Qieyun for Middle Chinese (ngaX 'I', nyiX 'you', tsyhit 'eat', mjuw 'not have'); Buddhist bianwen and Chan dialogues for colloquial usage." },
      { label: "Min, Yue or Tai-Kadai (reconstructed)", probability: 0.2, confidence: "reconstructed", note: "The south, especially early." },
    ],
  },
  {
    id: "early-mandarin",
    years: [1300, 1700],
    box: [NORTH_CHINA],
    hypotheses: [
      { label: "Early Mandarin, spoken (attested)", probability: 1, confidence: "attested",
        note: "Entering tone lost in the north; the language of Yuan drama dialogue and the vernacular novels.",
        draw: "The Zhongyuan Yinyun; Yuan zaju dialogue; the Laoqida and Piao Tongshi phrasebooks." },
    ],
  },
  {
    id: "old-japanese",
    years: [700, 1600],
    box: [JAPAN],
    hypotheses: [
      { label: "Old, then Middle Japanese (attested)", probability: 0.9, confidence: "attested",
        note: "Old Japanese to about 800 with its eight vowels; Early Middle Japanese of the Heian court; Late Middle Japanese after 1200.",
        draw: "The Man'yōshū (Frellesvig's transcription), Heian monogatari dialogue, kyōgen dialogue and the Jesuit Nippo Jisho for the 1500s." },
      { label: "Ainu (inferred)", probability: 0.1, confidence: "inferred", note: "The north." },
    ],
  },
  {
    id: "old-korean",
    years: [700, 1600],
    box: [KOREA],
    hypotheses: [
      { label: "Old, then Middle Korean (attested)", probability: 1, confidence: "attested",
        note: "Silla Old Korean in hyangga; Middle Korean with pitch accent after about 1000.",
        draw: "Hyangga readings; fifteenth-century Hangul texts (Lee and Ramsey)." },
    ],
  },
  {
    id: "old-vietnamese",
    years: [900, 1600],
    box: [VIETNAM],
    hypotheses: [
      { label: "Proto-Viet-Muong, then Old Vietnamese (reconstructed)", probability: 0.8, confidence: "reconstructed",
        note: "Consonant clusters still present; heavy Sino-Vietnamese vocabulary for learned things.",
        draw: "Ferlus's reconstructions; de Rhodes' 1651 dictionary as the late anchor." },
      { label: "Literary Chinese (attested)", probability: 0.2, confidence: "attested", note: "Officials only." },
    ],
  },
  {
    id: "old-khmer",
    years: [600, 1500],
    box: [KHMER],
    hypotheses: [
      { label: "Old Khmer (attested)", probability: 0.7, confidence: "attested",
        note: "The language of Angkor's inscriptions; Sanskrit for the gods and kings.", draw: "Jenner's Old Khmer dictionary." },
      { label: "Mon, Cham or Tai (attested)", probability: 0.3, confidence: "attested", note: "West, east, and after 1200 north." },
    ],
  },
  {
    id: "old-malay-javanese",
    years: [600, 1500],
    box: [ISLANDS],
    hypotheses: [
      { label: "Old Malay or Old Javanese (attested)", probability: 0.75, confidence: "attested",
        note: "Old Malay in Sumatra and the Straits (Srivijaya), Old Javanese in Java; Sanskrit loans in every sentence of court speech.",
        draw: "The Srivijaya inscriptions; Zoetmulder's Old Javanese dictionary." },
      { label: "Other Austronesian (attested)", probability: 0.25, confidence: "attested", note: "Balinese, Sundanese, and the Philippines." },
    ],
  },
  // Americas and Africa
  {
    id: "nahuatl",
    years: [900, 1600],
    box: [CENTRAL_MEXICO],
    hypotheses: [
      { label: "Nahuatl (attested)", probability: 0.8, confidence: "attested",
        note: "Classical Nahuatl of the Valley of Mexico; vowel length and the glottal stop matter.",
        draw: "The Florentine Codex; Molina's dictionary; Andrews's or Launey's grammar, with Karttunen's spellings." },
      { label: "Otomí or Matlatzinca (attested)", probability: 0.2, confidence: "attested", note: "The valley's older population." },
    ],
  },
  {
    id: "swahili-coast",
    years: [800, 1600],
    box: [SWAHILI],
    hypotheses: [
      { label: "Early Swahili (reconstructed)", probability: 0.8, confidence: "reconstructed",
        note: "Bantu (Sabaki) at its core; Arabic loans grow over the window.",
        draw: "Nurse and Hinnebusch's Proto-Sabaki; early Swahili poetry for the late end." },
      { label: "Arabic or Persian (attested)", probability: 0.2, confidence: "attested", note: "Merchants in the stone towns." },
    ],
  },
];
