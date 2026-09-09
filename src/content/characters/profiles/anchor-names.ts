import type { NameKit } from "../context-types";

/*
 * Place-led additions belong here rather than in a culture-wide fallback.
 * A generated name is always fictional.  In the sparsely attested cases the
 * *shape* of the name is the reconstruction, never a claim that an individual
 * or a fully recoverable language has been recovered.
 */
const sources = {
  earlyChina:
    "https://academic.oup.com/book/58672/chapter/485387630",
  shang: "https://books.google.com/books?id=mAwIEAAAQBAJ",
  mesopotamia: "https://cdli.ucla.edu/",
  egypt: "https://www.metmuseum.org/toah/hd/egna/hd_egna.htm",
  greek: "https://www.perseus.tufts.edu/hopper/",
  japanese: "https://doi.org/10.1093/acrefore/9780190201098.013.274",
  javanese: "https://sealang.net/oldjava/",
  mongolian: "https://www.degruyterbrill.com/document/doi/10.1515/9783110819724/html",
  indoAryan: "https://doi.org/10.1017/9781139013318",
  nahuatl: "https://florentinecodex.getty.edu/",
  quechua: "https://doi.org/10.1017/CBO9780511621048",
  mande: "https://www.metmuseum.org/art/collection/search/310416",
  bantu: "https://doi.org/10.1017/9781316334755",
  ethiopic: "https://doi.org/10.1017/9781108672003",
  oceanic: "https://doi.org/10.1515/9783110883091",
  australia: "https://aiatsis.gov.au/explore/aboriginal-australia-map",
  haiti: "https://www.loc.gov/item/2018667598/",
  haitiCivil: "https://www.familysearch.org/mg/search/catalog/1171012",
  icelandic: "https://island.is/en/name-giving/icelandic-naming-convention-surnames",
  manao: "https://glottolog.org/resource/languoid/id/mana1297",
} as const;

const evidence = (
  status: "documented" | "inferred" | "hypothesis",
  claim: string,
  sources: readonly string[],
  limitation: string,
): NameKit["evidence"] => ({ status, claim, sources: [...sources], limitation });

const generatedLimit =
  "These are components for fictional generated people, not a register of historical residents. A name source supports name forms and naming practice, not appearance, ancestry, occupation, social rank, or a particular household.";

export const anchorNameKits: NameKit[] = [
  {
    id: "names-north-china-prewriting-3000-1200bce",
    label: "North China · pre-writing early-Sinitic-style reconstruction, 3000–1200 BCE",
    scope: { years: [-2999, -1200], cultures: ["east-asian"], bounds: [105, 30, 122, 42] },
    names: ["Kəŋ", "Təŋ", "Nək", "Ləŋ", "Məŋ", "Pək", "Səŋ", "Wək", "Kəp", "Tək", "Nəŋ", "Rəŋ", "Kə", "Tə", "Mə", "Lə"],
    evidence: evidence(
      "hypothesis",
      "Before the oracle-bone record, this north-China scenario uses short, original display names constrained to a conservative early-Sinitic-like consonant-and-vowel inventory, rather than projecting modern Mandarin names backward. It is intended for cases such as c. 2000 BCE north China.",
      [sources.earlyChina, sources.shang],
      "No personal-name corpus survives for 2000 BCE north China, and the language(s) of individual communities are unresolved. These spellings are not reconstructed lexemes, Old Chinese readings, or attested names; ə and final stops make the display visibly exploratory. Competing Sino-Tibetan homeland, branching, and contact hypotheses materially affect any deeper reconstruction.",
    ),
  },
  {
    id: "names-north-china-shang-1200-221bce",
    label: "North China · Shang/Zhou-style personal-name sample, 1200–221 BCE",
    scope: { years: [-1200, -221], cultures: ["east-asian"], bounds: [105, 30, 122, 42] },
    names: ["Wu", "Ding", "Hao", "Fu", "Zu", "Geng", "Xin", "Ren", "Gui", "Jia", "Yi", "Bing", "Qiang", "Qiu", "Xue", "Jing"],
    evidence: evidence(
      "inferred",
      "Oracle-bone and bronze-inscription scholarship preserves Shang and Zhou personal-name elements; this kit samples normalized character readings as short fictional personal names.",
      [sources.shang, sources.earlyChina],
      "Pinyin is a modern display convention and does not reproduce Old Chinese pronunciation. Surviving inscriptions are elite and ritual records, so they cannot establish ordinary-name frequencies or a uniform Shang/Zhou naming system.",
    ),
  },
  {
    id: "names-north-china-qin-han-221bce-1000",
    label: "North China · Qin–Han to early medieval family-first sample, 221 BCE–1000 CE",
    scope: { years: [-221, 1000], cultures: ["east-asian"], bounds: [105, 30, 122, 42] },
    format: "family-personal",
    names: ["Ying", "An", "Ping", "Zhao", "Qing", "Xian", "Yong", "Ning", "Liang", "Xiu", "Wen", "Zhi", "De", "Shun", "Jun", "Yan"],
    familyNames: ["Wang", "Li", "Zhang", "Liu", "Zhao", "Chen", "Yang", "Sun", "Zhou", "Wu", "Xu", "Ma"],
    evidence: evidence(
      "inferred",
      "Written Chinese sources after unification document family names and family-before-personal display; this is a deliberately broad Qin–Han to early-medieval component sample for fictional people.",
      [sources.earlyChina],
      `${generatedLimit} The spread and social use of hereditary surnames varied, and this modern Pinyin rendering does not recover period pronunciation, courtesy names, clan practice, or regional non-Sinitic naming traditions.`,
    ),
  },
  {
    id: "names-egypt-new-kingdom",
    label: "Nile Valley · New Kingdom Egyptian-style sample, 1550–1070 BCE",
    scope: { years: [-1549, -1069], places: ["nile"], cultures: ["north-african-west-asian"] },
    names: ["Amenemhat", "Ahmose", "Ramose", "Nakht", "Khaemwaset", "Horemheb", "Sennefer", "Djehuty", "Ipu", "Tia", "Nefertari", "Meryt", "Satiah", "Iset", "Mutnodjmet", "Henuttawy"],
    evidence: evidence(
      "inferred",
      "New Kingdom monuments and objects preserve Egyptian personal-name forms; the names here are a bounded Nile-Valley sample suitable for a fictional household around 1300 BCE.",
      [sources.egypt],
      "Transliterations are conventional English display forms, vowels are partly supplied by convention, and surviving evidence disproportionately reflects literate and elite contexts. This does not assign a religion, class, or exact village language.",
    ),
  },
  {
    id: "names-mesopotamia-early-second-millennium",
    label: "Southern Mesopotamia · early second-millennium sample, 2100–1600 BCE",
    scope: { years: [-2099, -1599], places: ["mesopotamia"], cultures: ["north-african-west-asian"] },
    names: ["Ibbi-Sin", "Ur-Ninurta", "Lu-Nanna", "Warad-Sin", "Ilu-shu", "Shu-Enlil", "Naram", "Beli", "Amat-Shamash", "Inanna-iddin", "Taram", "Geme-Sin", "Ninlil", "Lamassi", "Beltani", "Shat-Eresh"],
    evidence: evidence(
      "inferred",
      "Cuneiform tablets record Sumerian and Akkadian personal-name elements in southern Mesopotamia; this mixed display sample reflects a multilingual early-second-millennium setting rather than a single ethnicity.",
      [sources.mesopotamia],
      "Names are normalized Latin transliterations and are not a frequency sample. The kit intentionally does not decide whether a given invented resident spoke Sumerian, Akkadian, or another local language, and it omits social-status and theophoric nuance.",
    ),
  },
  {
    id: "names-athens-classical-greek",
    label: "Athens · Classical Greek sample, 500–300 BCE",
    scope: { years: [-499, -299], places: ["athens"], cultures: ["european"] },
    names: ["Nikias", "Demosthenes", "Lysias", "Themistokles", "Sokrates", "Kleon", "Damon", "Philon", "Aristokles", "Thaleia", "Myrrhine", "Phanostrate", "Timarete", "Kleoboule", "Xanthippe", "Eirene"],
    evidence: evidence("documented", "Greek literary and epigraphic corpora preserve these Classical Greek forms; this kit supplies fictional Athenians rather than named historical characters.", [sources.greek], `${generatedLimit} Attestation is not a local demographic sample; citizenship, metic, enslaved, and regional naming practices are not modeled.`),
  },
  {
    id: "names-alexandria-hellenistic",
    label: "Alexandria · Hellenistic Greek/Egyptian contact sample, 332–30 BCE",
    scope: { years: [-331, -29], places: ["alexandria"], cultures: ["north-african-west-asian"] },
    names: ["Apollonios", "Demetrios", "Herakleides", "Ptolemaios", "Zenon", "Arsinoe", "Berenike", "Eirene", "Isidora", "Thais", "Psenamounis", "Petosiris", "Taimhotep", "Tasenet", "Harpais", "Pakhom"],
    evidence: evidence("inferred", "Hellenistic Alexandria was a Greek- and Egyptian-writing contact setting; the kit combines attested-style Greek and Egyptian display forms to avoid treating the city as linguistically uniform.", [sources.greek, sources.egypt], "This is not a census or a claim that every household was bilingual. Transliterations and the balance of Greek/Egyptian components are authored scenario choices; Jewish, other Egyptian, and wider Mediterranean traditions remain incomplete."),
  },
  {
    id: "names-konya-neolithic-anatolian-hypothesis",
    label: "Konya Plain · Neolithic Anatolian-farmer phonotactic hypothesis, 7500–5500 BCE",
    scope: { years: [-7499, -5499], places: ["konya"], cultures: ["north-african-west-asian"] },
    names: ["Aru", "Nawa", "Tara", "Mika", "Kalu", "Sana", "Wara", "Tima", "Luka", "Nari", "Pala", "Muna", "Kari", "Yawa", "Tanu", "Mara"],
    evidence: evidence("hypothesis", "For the Konya early-farmer scenario, short open-syllable fictional names are an exploratory Anatolian-farming/early-Indo-European-compatible phonotactic treatment, kept separate from much later Hittite.", ["https://www.mpg.de/research/indo-european-languages-origins"], "There is no readable Çatalhöyük name record and no secure identification of its language. These are not Proto-Indo-European reconstructions, Hittite names, or attestations; unclassified and alternative language-history interpretations remain fully viable."),
  },
  {
    id: "names-siberia-upper-paleolithic-hypothesis",
    label: "Siberian interior · Upper Paleolithic phonotactic hypothesis, 30000–10000 BCE",
    scope: { years: [-29999, -9999], places: ["siberia"], cultures: ["inner-eurasian"] },
    names: ["Aka", "Nuru", "Kama", "Tala", "Muku", "Sana", "Wari", "Kanu", "Luma", "Tari", "Naka", "Mira"],
    evidence: evidence("hypothesis", "This remote Paleolithic scenario uses a restrained, original CV/CVC name shape as a gameplay reconstruction attempt, without attributing it to a recovered Siberian language or macrofamily.", ["https://pubmed.ncbi.nlm.nih.gov/23650390/"], "No personal names, community language, or sound system can be recovered for a Siberian interior group around 15000 BCE. The cited macrofamily proposal is contested and does not license these strings as cognates or evidence; these names are explicit fictional gap-fillers informed only by a deliberately broad phonotactic scenario."),
  },
  {
    id: "names-mongolia-medieval",
    label: "Mongolian steppe · medieval Mongolian sample, 1100–1500",
    scope: { years: [1100, 1500], places: ["mongolia"], cultures: ["inner-eurasian"] },
    names: ["Temüjin", "Jochi", "Möngke", "Khasar", "Bo'orchu", "Qorchi", "Altani", "Sorkhaqtani", "Börte", "Yesügen", "Alaqai", "Qulan", "Chabi", "Kököchin"],
    evidence: evidence("inferred", "Medieval Mongol historical and linguistic scholarship preserves personal-name forms from the imperial period; this sample makes fictional steppe residents more locally grounded than generic Inner-Eurasian names.", [sources.mongolian], `${generatedLimit} Surviving sources favor elite and court contexts, and transliteration varies. Clan names, title use, neighboring Turkic speakers, and the social distribution of forms are out of scope.`),
  },
  {
    id: "names-japan-classical-medieval",
    label: "Kyoto region · classical/medieval Japanese sample, 800–1600",
    scope: { years: [800, 1600], places: ["kyoto"], cultures: ["east-asian"] },
    names: ["Fujiwara no Aki", "Taira no Tada", "Minamoto no Yori", "Kiyomori", "Yoshitsune", "Tomoe", "Akiko", "Masako", "Shigeko", "Tokiko", "Kame", "Chiyo", "Kiku", "Ume"],
    evidence: evidence("inferred", "Japanese historical sources preserve court, warrior, and common-name practices; this compact Kyoto-oriented set permits multiword personal displays without imposing a modern Western surname model.", [sources.japanese], "The list mixes social registers and display conventions across eight centuries. It does not determine which name elements were hereditary, rank-bound, gendered, or appropriate to a particular fictional resident; Japanese scripts and period readings are not rendered."),
  },
  {
    id: "names-central-java-old-javanese",
    label: "Central Java · Old Javanese-style sample, 800–1100",
    scope: { years: [800, 1100], places: ["java"], cultures: ["southeast-asian"] },
    names: ["Rakryan", "Balitung", "Daksha", "Wawa", "Sindok", "Pikatan", "Lokapala", "Pramodhawardhani", "Isanatunggawijaya", "Kalyani", "Sri Kahulunnan", "Mpu Sindu"],
    evidence: evidence("inferred", "Old Javanese inscriptions and lexicographic resources preserve courtly and personal-name elements; the kit supplies fictional names for a central-Java setting around 950.", [sources.javanese], "Epigraphic material is strongly elite and Sanskritized. These normalized Latin forms do not establish village-name frequency, pronunciation, status, religion, or the many languages of the archipelago."),
  },
  {
    id: "names-bengal-late-medieval",
    label: "Bengal delta · late-medieval Bengali/Sanskritic sample, 1200–1600",
    scope: { years: [1200, 1600], places: ["bengal"], cultures: ["south-asian"] },
    names: ["Ananda", "Govinda", "Madhava", "Raghava", "Narayana", "Keshava", "Kamala", "Padma", "Malati", "Sundari", "Chandra", "Bimala", "Haripada", "Radhika"],
    evidence: evidence("inferred", "Indo-Aryan historical linguistics supports a Bengali vernacular setting alongside Sanskritic naming resources; these are fictional display forms appropriate only as a broad late-medieval hypothesis.", [sources.indoAryan], "This does not settle the religious, caste, linguistic, or political identity of any person. Persianate, Tibeto-Burman, Austroasiatic, and local naming traditions are incomplete, and later Bengali pronunciations/spellings are anachronistic display aids."),
  },
  {
    id: "names-delhi-late-medieval",
    label: "Delhi region · late-medieval Hindavi/Persianate contact sample, 1200–1600",
    scope: { years: [1200, 1600], places: ["delhi"], cultures: ["south-asian"] },
    names: ["Devadatta", "Harish", "Madhava", "Ratan", "Chanda", "Kamala", "Sundari", "Gauri", "Zayn", "Hasan", "Yusuf", "Amina", "Fatima", "Nizam"],
    evidence: evidence("inferred", "Delhi's late-medieval setting included Indo-Aryan and Persianate naming traditions; this mixed fictional sample resists a single-language portrayal.", [sources.indoAryan], "The list is intentionally not a population ratio or a proxy for religious affiliation. It omits many communities, language forms, titles, and patronymic practices, and names alone do not establish social position."),
  },
  {
    id: "names-haiti-nineteenth-century",
    label: "Haiti · nineteenth-century Haitian Creole/French display sample, 1800–1900",
    scope: { years: [1800, 1900], places: ["haiti"], cultures: ["west-central-african"] },
    format: "personal-family",
    names: ["Jean", "Jean-Baptiste", "Jean-Pierre", "Jean-Louis", "Pierre", "Joseph", "Charles", "Louis", "Marie", "Marie-Louise", "Rose", "Céleste", "Suzanne", "Adeline", "Victoire", "Élise"],
    familyNames: ["Cazeau", "Dumon", "Montès", "Dubois", "Gingin", "Paret", "Féry", "Lépine", "Léandre", "Riché", "Boyer", "Hyppolite", "Chéry", "Pierre-Louis", "Jean-Baptiste", "Joseph"],
    evidence: evidence("inferred", "Port-au-Prince civil registration begins in 1794, and nineteenth-century Haitian archival material preserves French- and Creole-context given and family-name forms. This kit now renders fictional residents as a given name followed by a family name.", [sources.haitiCivil, sources.haiti], `${generatedLimit} Civil-record coverage, spelling, family-name formation, and access to registration varied. The set cannot represent the full linguistic, regional, or class diversity of Haiti, and generated combinations are not documentary identities.`),
  },
  {
    id: "names-virginia-algonquian-1607-1750",
    label: "Tsenacommacah / Virginia · Algonquian-style personal-name sample, 1607–1750",
    scope: { years: [1607, 1750], places: ["virginia"], cultures: ["european"], communities: ["indigenous-local"] },
    names: ["Wahunsenacawh", "Opechancanough", "Opitchapam", "Nantauquas", "Kocoum", "Pochahuntas", "Matoaka", "Cleopatre", "Appamattuck", "Chanco", "Nicketti", "Oholasc"],
    evidence: evidence("inferred", "Early Virginia sources preserve Powhatan/Algonquian personal-name spellings. This kit uses a bounded sample as complete fictional personal displays when the Virginia scenario explicitly selects the Indigenous-local community.", ["https://encyclopediavirginia.org/entries/powhatan-c-1547-1618/", "https://www.nps.gov/jame/learn/historyculture/pocahontas-her-life-and-legend.htm"], "English colonial spellings mediate every surviving form and frequently concern political elites. The kit does not recover pronunciation, meanings, kin names, local Nation-specific naming practice, or the identity of an ordinary generated resident; it must not be generalized beyond this narrow scenario."),
  },
  {
    id: "names-icelandic-patronymic",
    label: "Iceland · personal name plus patronymic display, 1200–2027",
    scope: { years: [1200, 2027], cultures: ["european"], bounds: [-25, 63, -13, 67] },
    format: "personal-patronymic",
    names: ["Jón", "Guðrún", "Sigríður", "Þórður", "Katrín", "Ólafur", "Helga", "Magnús", "Ragnheiður", "Einar", "Ingibjörg", "Snorri"],
    patronymics: ["Jónsson", "Jónsdóttir", "Sigurðsson", "Sigurðardóttir", "Guðmundsson", "Guðmundsdóttir", "Ólafsson", "Ólafsdóttir", "Björnsson", "Björnsdóttir", "Þórðarson", "Þórðardóttir"],
    evidence: evidence("inferred", "Icelandic convention derives a person's usual surname from a parent's given name with -son or -dóttir rather than treating it as a fixed hereditary surname; this kit renders a personal name plus a complete patronymic display.", [sources.icelandic], "The source describes modern convention, while application back to 1200 is a deliberately broad continuity inference. The generator samples complete patronymics rather than modeling parent gender, genitive formation, metronymics, or a historically exact legal regime; no displayed patronymic is inherited by a child as a family name."),
  },
  {
    id: "names-mexico-nahuatl-late-postclassic",
    label: "Valley of Mexico · Nahuatl-style sample, 1300–1521",
    scope: { years: [1300, 1521], places: ["mexico"], cultures: ["mesoamerican"] },
    names: ["Xochitl", "Citlali", "Miahuaxochitl", "Tlaltecuhtli", "Cuauhtli", "Itzcóatl", "Mazatl", "Tochtli", "Tenoch", "Yaotl", "Tecpatl", "Chimalma", "Atotoztli", "Malinalxochitl"],
    evidence: evidence("inferred", "Nahuatl colonial-era textual traditions preserve Classical Nahuatl name elements with roots in late-postclassic central Mexico; this kit is a fictional Valley-of-Mexico sample.", [sources.nahuatl], "Sixteenth-century manuscripts mediate pre-conquest practice and often preserve elite contexts. Normalized Latin spellings do not reproduce Nahuatl vowel length, local dialects, calendar-name rules, or the diversity of non-Nahuatl residents."),
  },
  {
    id: "names-cusco-quechua-late-horizon",
    label: "Cusco highlands · late-Horizon Quechua-style sample, 1200–1532",
    scope: { years: [1200, 1532], places: ["cusco"], cultures: ["andean"] },
    names: ["Atawallpa", "Waskar", "Tupaq", "Rumi", "Inti", "Kusi", "Sumaq", "Chaska", "Killa", "Ocllo", "Anahuarque", "Mama Anawarki", "Puma", "Wayna"],
    evidence: evidence("inferred", "Quechua documentation and Inka-period traditions preserve name elements used here for fictional Cusco-region residents.", [sources.quechua], "Colonial spelling and elite Inka traditions strongly shape the record. These names do not imply Inka nobility, native Quechua fluency, a fixed gender system, or a uniform Cusco population; Aymara and other local traditions are not represented adequately."),
  },
  {
    id: "names-central-amazon-manao-oriented-hypothesis",
    label: "Central Amazon · Manaus-region Arawakan-oriented phonotactic hypothesis, 1000–1600",
    scope: { years: [1000, 1600], places: ["amazon"], cultures: ["other-indigenous-american"] },
    names: ["Aju", "Aru", "Mairi", "Uara", "Kuri", "Munu", "Tari", "Wana", "Iri", "Maku", "Nari", "Pira"],
    evidence: evidence("hypothesis", "The anchor lies near the Manaus/Negro confluence, where historical linguistic catalogues record the poorly documented Manao language as Arawakan. This kit therefore uses short, original Arawakan-oriented fictional display forms instead of a global fantasy syllable pool.", [sources.manao], "The pre-1600 language geography of this exact generated site is unresolved, Manao documentation is sparse, and no personal-name corpus justifies these strings. They are not Manao words, reconstructions, or attestations; Tupian, Arawakan, other local, and multilingual-contact possibilities remain open."),
  },
  {
    id: "names-timbuktu-late-medieval",
    label: "Niger bend · late-medieval Songhay/Mande/Arabic contact sample, 1200–1600",
    scope: { years: [1200, 1600], places: ["timbuktu"], cultures: ["west-central-african"] },
    names: ["Ali", "Muhammad", "Mahmud", "Ahmad", "Boubacar", "Musa", "Fari", "Koi", "Sira", "Fanta", "Aminata", "Kadi", "Hawa", "Mariama"],
    evidence: evidence("inferred", "Scholarship and material collections for the medieval Niger bend document trans-Saharan Islamic and local West African contexts; this mixed display sample avoids treating Timbuktu as only Arabic-speaking.", [sources.mande], "The precise historical distribution, pronunciation, and social use of these forms require more local manuscript and linguistic work. The kit is not a census, and a name does not identify language, religion, ethnicity, or status."),
  },
  {
    id: "names-congo-basin-bantu-continuity",
    label: "Congo Basin · Bantu-style continuity hypothesis, 1000–1800",
    scope: { years: [1000, 1800], places: ["congo"], cultures: ["west-central-african"] },
    names: ["Kiala", "Lukeni", "Nsaku", "Mbanza", "Kasa", "Boma", "Nsimba", "Mavungu", "Mpemba", "Kongo", "Lemba", "Nzuzi", "Mwana", "Sunga"],
    evidence: evidence("hypothesis", "Bantu comparative and Central-African historical research supports a linguistically diverse Bantu setting in parts of the Congo Basin; this kit uses cautious short Bantu-style fictional forms for the existing 1000–1800 scenario.", [sources.bantu], "The Congo Basin is not one language community, and these strings are not claimed as reconstructed proto-Bantu personal names or as forms attested at this generated location/date. Local language, meaning, tone, and naming ceremony remain unresolved."),
  },
  {
    id: "names-ethiopia-solomonic",
    label: "Ethiopian highlands · Geʽez/Amharic-style sample, 1200–1600",
    scope: { years: [1200, 1600], places: ["ethiopia"], cultures: ["east-southern-african"] },
    names: ["Amda Seyon", "Zara Yaqob", "Baeda Maryam", "Yishaq", "Gabra", "Fasil", "Martha", "Elene", "Seble", "Wizero", "Mekdes", "Tewodros", "Kassahun", "Hirut"],
    evidence: evidence("inferred", "Ethiopic historical scholarship preserves Geʽez and Ethiopian Semitic naming evidence; this fictional highland sample includes multiword forms without treating modern spellings as medieval pronunciation.", [sources.ethiopic], "Sources heavily favor royal, ecclesiastical, and literate contexts. Oromo, Agaw, Somali, Jewish Ethiopian, Muslim, and many local traditions are not represented; no name assigns faith, class, or language."),
  },
  {
    id: "names-australian-interior-pama-nyungan-hypothesis",
    label: "Australian interior · Central Desert phonotactic hypothesis, before 1788",
    scope: { years: [-100000, 1788], places: ["australia"], cultures: ["australian-pacific"] },
    names: ["Kuru", "Tjalu", "Wari", "Marlu", "Punu", "Ninti", "Kali", "Yara", "Maku", "Tali", "Wiya", "Pira"],
    evidence: evidence("hypothesis", "For the precise central-interior anchor, this kit uses original short forms constrained by broad Pama-Nyungan-like phonotactic tendencies as an explicit attempt at a local alternative to generic invented names.", [sources.australia], "Australia contains hundreds of distinct language traditions; no pan-Aboriginal naming system exists. These are not words, names, or reconstructions from any named Aboriginal language, and should never be read as identifying a Nation, kin category, or Country. Consultation with the relevant community is required for a true local naming kit."),
  },
  {
    id: "names-polynesia-eastern-oceanic",
    label: "Society Islands · Eastern Polynesian-style sample, 1000–1800",
    scope: { years: [1000, 1800], places: ["polynesia"], cultures: ["australian-pacific"] },
    names: ["Tupaia", "Tu", "Hiro", "Ariʻi", "Teriʻi", "Māhina", "Tehaʻapapa", "Purea", "Vairaʻatoa", "Pōmare", "Tāne", "Hina"],
    evidence: evidence("inferred", "Oceanic historical linguistics and Tahitian traditions support an Eastern Polynesian setting for this Society-Islands anchor; the names are fictional sampled displays.", [sources.oceanic], "Glottal stops and long vowels are retained where practical, but spellings and historical readings vary. The list is not a reconstruction for all Polynesia or a statement about rank, island, genealogy, or pre-contact frequency."),
  },
  {
    id: "names-melbourne-mid-century",
    label: "Melbourne · mid-twentieth-century Australian English sample, 1945–1990",
    scope: { years: [1945, 1990], places: ["melbourne"], cultures: ["european"] },
    names: ["John", "Peter", "Robert", "David", "Michael", "James", "Margaret", "Helen", "Jennifer", "Susan", "Judith", "Barbara", "Anne", "Kathleen"],
    evidence: evidence("inferred", "A restrained Australian-English personal-name sample grounds the 1950 Melbourne anchor without exporting a medieval European kit into a modern setting.", ["https://www.abs.gov.au/ausstats/abs@.nsf/mf/3310.0"], "This is a narrow English-language scenario sample, not a demographic portrait of postwar Melbourne. It omits surnames and the city's Aboriginal, migrant, and multilingual naming traditions."),
  },
];
