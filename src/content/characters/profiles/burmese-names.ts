import type { NameKit } from "../context-types";

const surveyPdf =
  "https://ajba.um.edu.my/index.php/JIIE/article/download/26967/12343/60324";
const perséeNames =
  "https://www.persee.fr/doc/asean_0859-9009_1998_num_1_1_1571";
const oxfordTerms =
  "https://academic.oup.com/cornell-scholarship-online/book/60129/chapter-abstract/519885067";
const burmeseHistory =
  "https://www.cambridge.org/core/books/abs/burma/observations-on-some-of-the-indigenous-sources-for-burmese-history-down-to-1886/1E1A08A01E5E024442BDC127F78214A6";

const myanmarMainland: readonly [number, number, number, number] = [
  93, 15, 98, 25,
];

export const burmeseNameKits: NameKit[] = [
  {
    id: "names-burmese-modern-1885-2026",
    label: "Burmese personal names · Myanmar mainland, 1885–2026",
    scope: {
      years: [1885, 2027],
      cultures: ["southeast-asian"],
      bounds: myanmarMainland,
    },
    format: "personal",
    masculine: ["Ba", "Zaw", "Than", "Thant", "Soe", "Thein", "Thaw", "Htun", "Aung", "Po", "Tha", "Han", "Maw", "Nyunt", "Ba Than", "Aung Aung", "Tin Oo", "Aung San"],
    feminine: ["Ni", "Mya", "Hla", "Ngwe", "Cho", "Aye", "Swe", "Yi", "Kyi", "Kyin", "Yin", "May", "Su", "Mar", "Hla Hla", "Khin Khin", "Khin Kyi", "Aye Aye", "Mya Mya"],
    unisex: ["Sein", "San", "Min", "Lin", "Win", "Khin", "Thin", "Ohn", "Shwe", "Yu", "Tin"],
    sources: [surveyPdf, perséeNames, oxfordTerms],
    note: "Burmese names carry no hereditary surname: the whole sequence, commonly two or three syllables, is one person's name. Honorifics such as U, Daw, Ko and Ma are titles and are omitted here.",
  },
  {
    id: "names-burmese-precolonial-continuity-1100-1885",
    label: "Burmese personal names · precolonial reconstruction, 1100–1885",
    scope: {
      years: [1100, 1885],
      cultures: ["southeast-asian"],
      bounds: myanmarMainland,
    },
    format: "personal",
    masculine: ["Aung", "Ba", "Soe", "Than", "Thant", "Thein", "Zaw", "Aung Aung", "Tin Oo", "Ba Than", "Aung San"],
    feminine: ["Aye", "Hla", "Mya", "Su", "Yi", "Hla Hla", "Khin Khin", "Mya Mya", "Aye Aye", "Khin Kyi"],
    unisex: ["Khin", "Lin", "Ohn", "San", "Sein", "Shwe", "Thin", "Tin", "Win"],
    sources: [surveyPdf, perséeNames, oxfordTerms, burmeseHistory],
    note: "Burmese naming practice is described in surveys from the twentieth century onward; these forms are carried back to the Pagan period on the strength of that continuity. Regnal and monastic names follow separate conventions not represented here.",
  },
];
