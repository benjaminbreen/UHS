import type { NameKit } from "../context-types";

/**
 * Name examples are reusable input lists, not claims that every person in a
 * place had one of these names.  The people generated from them are fictional.
 */
const romanEpigraphy = "https://edh.ub.uni-heidelberg.de/";
const dmnes = "https://dmnes.org/";
const londonLives = "https://www.londonlives.org/";
const virginiaMuster =
  "https://www.nps.gov/jame/learn/historyculture/the-first-residents-of-jamestown.htm";

const attestedNames = (note: string, sources: string[]) => ({
  sources,
  note,
});

export const nameKits: NameKit[] = [
  {
    id: "names-roman-italy-100bce-476ce",
    label: "Roman Italy · 100 BCE–476 CE",
    scope: {
      years: [-99, 476],
      cultures: ["european"],
      bounds: [8, 36, 19, 47],
    },
    masculine: ["Marcus", "Lucius", "Gaius", "Quintus", "Publius", "Titus", "Gnaeus", "Aulus", "Sextus", "Decimus", "Aurelius", "Cornelius", "Julius", "Claudius", "Antonius", "Flavius", "Valerius", "Aemilius"],
    feminine: ["Livia", "Julia", "Aurelia", "Cornelia", "Claudia", "Antonia", "Octavia", "Tullia", "Valeria", "Flavia"],
    // Greek cognomina run high in Italian epitaphs, above all among freedmen.
    alongside: [{ tradition: "ancient-greek", weight: 0.25 }],
    ...attestedNames("Roman personal-name forms and gentilicia are represented in the Epigraphic Database Heidelberg's searchable corpus of Latin inscriptions; this kit is scoped to a Roman-Italy setting as a bounded gameplay sample.", [romanEpigraphy]),
  },
  {
    id: "names-medieval-england-1100-1600",
    label: "England · medieval to early modern sample, 1100–1600",
    scope: {
      years: [1100, 1600],
      cultures: ["european"],
      bounds: [-6, 50.2, 2, 56],
    },
    masculine: ["William", "John", "Thomas", "Richard", "Robert", "Henry", "Geoffrey", "Hugh", "Walter", "Roger", "Simon", "Adam", "Nicholas", "Peter"],
    feminine: ["Alice", "Agnes", "Joan", "Margaret", "Matilda", "Isabel", "Katherine", "Cecily", "Eleanor", "Emma", "Ela", "Christina"],
    ...attestedNames("DMNES documents given names in European sources through 1600, including English forms; this is an inferred regional English sample whose display spellings are modernized for readability and should not be mistaken for a complete medieval name register.", [dmnes]),
  },
  {
    id: "names-early-modern-england-1600-1750",
    label: "England · early modern continuity sample, 1600–1750",
    scope: {
      years: [1600, 1750],
      cultures: ["european"],
      bounds: [-6, 50.2, 2, 56],
    },
    masculine: ["John", "William", "Thomas", "Richard", "Henry", "Edward", "George", "James", "Robert", "Charles", "Francis", "Samuel", "Joseph"],
    feminine: ["Elizabeth", "Mary", "Anne", "Alice", "Margaret", "Dorothy", "Susan", "Jane", "Katherine", "Joan", "Frances", "Eleanor"],
    ...attestedNames("DMNES documents European given names through 1600, while London Lives publishes primary London records beginning in 1690. The intervening and post-1600 use here is an inferred continuity sample; display spellings are modernized and this is not a frequency table.", [dmnes, londonLives]),
  },
  {
    id: "names-english-virginia-1607-1750",
    label: "English Virginia · 1607–1750",
    scope: {
      years: [1607, 1750],
      cultures: ["european"],
      bounds: [-84, 36, -75, 40],
      communities: ["english-colonial"],
    },
    masculine: ["John", "William", "Thomas", "Richard", "George", "Edward", "Henry", "James", "Robert", "Francis", "Samuel", "Joseph"],
    feminine: ["Elizabeth", "Anne", "Mary", "Margaret", "Alice", "Jane", "Katherine", "Joan", "Sarah", "Martha"],
    ...attestedNames("The National Park Service reproduces a source-based list of the known 104 English settlers who remained at Jamestown in 1607; male forms use that roster; female forms extend the English sample from DMNES. Regional use and continuity through 1750 are inferred.", [virginiaMuster, dmnes]),
  },
  {
    id: "names-medieval-italy-1200-1500",
    label: "Italy · medieval, 1200–1500",
    scope: {
      years: [1200, 1500],
      cultures: ["european"],
      bounds: [8, 36, 19, 47],
    },
    masculine: ["Giovanni", "Francesco", "Pietro", "Matteo", "Lorenzo", "Niccolò", "Antonio", "Domenico", "Jacopo", "Simone", "Andrea", "Bartolomeo"],
    feminine: ["Caterina", "Francesca", "Maria", "Giovanna", "Margherita", "Lucia", "Beatrice", "Agnes", "Costanza"],
    ...attestedNames("The Dictionary of Medieval Names from European Sources gathers documented medieval name forms, including Italian evidence, and records their source attestations; this kit is a regional sample rather than a claim about all Italian communities.", [dmnes]),
  },
  {
    id: "names-early-modern-italy-1500-1750",
    label: "Italy · early modern, 1500–1750",
    scope: {
      years: [1500, 1750],
      cultures: ["european"],
      bounds: [8, 36, 19, 47],
    },
    masculine: ["Giovanni", "Francesco", "Giuseppe", "Antonio", "Pietro", "Lorenzo", "Carlo", "Domenico", "Matteo", "Paolo", "Marco", "Alessandro"],
    feminine: ["Maria", "Caterina", "Francesca", "Lucia", "Giovanna", "Beatrice", "Angela", "Isabella", "Maddalena"],
    ...attestedNames("DMNES documents European given names in sources written through 1600, including Italian forms. Applying the continuing forms to 1600–1750 is an explicitly inferred continuity sample for regional play.", [dmnes]),
  },
  {
    id: "names-medieval-france-1100-1500",
    label: "France · medieval, 1100–1500",
    scope: {
      years: [1100, 1500],
      cultures: ["european"],
      bounds: [-5, 42, 6, 50],
    },
    masculine: ["Jean", "Pierre", "Guillaume", "Étienne", "Philippe", "Jacques", "Martin", "Hugues", "Louis", "Gérard", "Robert", "Bernard"],
    feminine: ["Jeanne", "Marguerite", "Catherine", "Marie", "Isabelle", "Anne", "Agnès", "Perrine", "Madeleine"],
    ...attestedNames("DMNES documents medieval French name forms with dated source references; the selected forms are a small regional sample and do not represent every language or community within medieval France.", [dmnes]),
  },
  {
    id: "names-early-modern-france-1500-1750",
    label: "France · early modern, 1500–1750",
    scope: {
      years: [1500, 1750],
      cultures: ["european"],
      bounds: [-5, 42, 6, 50],
    },
    masculine: ["Jean", "Pierre", "François", "Jacques", "Louis", "Charles", "Henri", "Antoine", "Nicolas", "Michel", "Paul", "Étienne"],
    feminine: ["Marie", "Jeanne", "Marguerite", "Catherine", "Anne", "Isabelle", "Louise", "Madeleine", "Françoise", "Charlotte"],
    ...attestedNames("DMNES documents European given names in sources written through 1600, including French forms. Applying the continuing forms to 1600–1750 is an explicitly inferred continuity sample for regional play.", [dmnes]),
  },
];

const englishFamilies = ["Smith", "Baker", "Miller", "Taylor", "Cooper", "Fletcher", "Wright", "Clark", "Brown", "White", "Green", "Hill", "Wood", "Ward", "Turner", "Carter", "Hall", "King", "Parker", "Walker", "Warren", "Webb", "Cook", "Sutton"];
const englishByNames = ["the baker", "the miller", "the smith", "the cooper", "atte Wood", "atte Hill", "the elder", "the younger", "Long", "Short", "White", "Brown"];
const italianFamilies = ["Rossi", "Bianchi", "Russo", "Ferrari", "Esposito", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "Costa", "Mancini", "Lombardi", "Moretti", "Barbieri", "Fontana", "Rinaldi", "Martini", "Serra"];
const frenchFamilies = ["Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Durand", "Moreau", "Simon", "Laurent", "Lefèvre", "Michel", "Roux", "Fournier", "Girard", "André", "Mercier", "Dupont", "Legrand", "Garnier"];
const richer: Record<string, Partial<NameKit>> = {
  "names-roman-italy-100bce-476ce": {
    format: "family-personal",
    masculine: ["Felix", "Severus", "Rufus", "Vitalis", "Fortunatus", "Priscus", "Secundus", "Primus", "Maximus", "Celer", "Marcellus", "Sabinus", "Victor", "Paulinus", "Clemens", "Faustus"],
    feminine: ["Felicia", "Severa", "Rufina", "Vitalis", "Fortunata", "Prisca", "Secunda", "Prima", "Maxima", "Celerina", "Marcellina", "Sabina", "Victoria", "Paulina", "Clementina", "Fausta"],
    familyNames: ["Aurelius", "Cornelius", "Julius", "Claudius", "Antonius", "Flavius", "Valerius", "Aemilius", "Livius", "Octavius", "Tullius", "Caecilius", "Pompeius", "Licinius", "Fabius", "Manilius"],
    feminineFamilyNames: { Aurelius: "Aurelia", Cornelius: "Cornelia", Julius: "Julia", Claudius: "Claudia", Antonius: "Antonia", Flavius: "Flavia", Valerius: "Valeria", Aemilius: "Aemilia", Livius: "Livia", Octavius: "Octavia", Tullius: "Tullia", Caecilius: "Caecilia", Pompeius: "Pompeia", Licinius: "Licinia", Fabius: "Fabia", Manilius: "Manilia" },
    sources: [romanEpigraphy, "https://romaninscriptionsofbritain.org/epindex/cognomina", "https://latininscriptions.ashmus.ox.ac.uk/resources/resources/AshLI-RomanNames2-TeachersNotes.pdf"],
    note: "A simplified nomen-plus-cognomen display, with feminine forms of the inherited nomen. The components are inscription-based samples; combinations and frequencies are fictional. Praenomina, status changes and the changing full Roman naming system are not modelled; applying this display across the whole date range is an inference.",
  },
  "names-medieval-england-1100-1600": {
    format: "personal-family", familyNames: englishFamilies, familyNamesFrom: 1250, byNames: englishByNames,
    note: "Modernized English personal names with occupational or descriptive bynames before 1250 and a bounded surname sample thereafter. The cutoff simplifies gradual, uneven inheritance; combinations and frequencies are fictional, not recovered individuals or a population register.",
  },
  "names-early-modern-england-1600-1750": {
    format: "personal-family", familyNames: englishFamilies,
    note: "Modernized English given and family names drawn as fictional combinations. DMNES and London Lives supply naming context; regional continuity and the selected frequencies are inferred rather than measured.",
  },
  "names-english-virginia-1607-1750": {
    format: "personal-family",
    familyNames: ["Archer", "Bruster", "Brookes", "Browne", "Clarke", "Cooper", "Crofts", "Dixon", "Dowman", "Edward", "Fenton", "Gosnold", "Johnson", "Kendall", "Martin", "Morris", "Robinson", "Smith", "Snarsbrough", "Stevens", "White", "Wingfield"],
    note: "English given and family-name components sampled from the 1607 Jamestown roster, with female given names extended from DMNES. Combinations are fictional and continuity through 1750 is inferred; an NPC is not identified with a historical settler.",
  },
  "names-medieval-italy-1200-1500": {
    format: "personal-family", familyNames: italianFamilies, familyNamesFrom: 1300,
    byNames: ["da Siena", "da Lucca", "da Pisa", "da Parma", "da Arezzo", "da Perugia"],
    note: "Modernized personal names with a schematic place byname before 1300 and an Italian family-name sample thereafter. The cutoff and national pool simplify uneven regional adoption; combinations, spellings and frequencies are inferred gameplay displays.",
  },
  "names-early-modern-italy-1500-1750": {
    format: "personal-family", familyNames: italianFamilies,
    note: "Italian given and family-name components combined for fictional people. Regional use, modernized spelling and continuity beyond DMNES's 1600 endpoint are inferred; the pool is not a historical frequency table.",
  },
  "names-medieval-france-1100-1500": {
    format: "personal-family", familyNames: frenchFamilies, familyNamesFrom: 1300,
    byNames: ["de Paris", "de Rouen", "de Tours", "de Lyon", "de Dijon", "de Reims"],
    note: "Modernized French given names with place bynames before 1300 and a bounded family-name sample thereafter. Adoption varied by region and household; the cutoff, combinations and frequencies are inferred gameplay choices.",
  },
  "names-early-modern-france-1500-1750": {
    format: "personal-family", familyNames: frenchFamilies,
    note: "French given and family-name components combined for fictional people. Modernized spelling and continuity beyond DMNES's 1600 endpoint are inferred; no national frequency or complete naming register is claimed.",
  },
};

export const richerNameKits: NameKit[] = nameKits.map((kit) => ({ ...kit, ...richer[kit.id] }));
