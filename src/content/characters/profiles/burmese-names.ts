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

const limitation =
  "These are complete personal-name sequences, not family names, and honorifics such as U, Daw, Ko, and Ma are omitted. The sources describe naming practice and attest examples, but do not provide a population frequency table or authorize assigning a name by gender, class, religion, or ethnicity. Generated people are fictional; Roman spellings vary between sources and are normalized here for readability. Applying this modern evidence before its collection is a continuity inference; these bounds are a central Burmese scenario, not all ethnic communities of Myanmar. A name source supports name use only, not appearance.";

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
    names: [
      "Ba",
      "Ni",
      "Mya",
      "Sein",
      "Zaw",
      "Hla",
      "Than",
      "Thant",
      "San",
      "Soe",
      "Min",
      "Thein",
      "Lin",
      "Thaw",
      "Htun",
      "Ngwe",
      "Win",
      "Aung",
      "Po",
      "Khin",
      "Tha",
      "Cho",
      "Han",
      "Thin",
      "Ohn",
      "Aye",
      "Shwe",
      "Swe",
      "Yi",
      "Yu",
      "Kyi",
      "Maw",
      "Kyin",
      "Tin",
      "Yin",
      "May",
      "Su",
      "Nyunt",
      "Mar",
      "Ba Than",
      "Hla Hla",
      "Aung Aung",
      "Khin Khin",
      "Tin Oo",
      "Aung San",
      "Khin Kyi",
      "Aye Aye",
      "Mya Mya",
    ],
    evidence: {
      status: "inferred",
      claim:
        "A University of Malaya study of Myanmar personal names gives one-, two-, and three-element examples and describes the absence of hereditary surnames; Robinne's study likewise describes Burmese personal names as one person's full name, commonly two or three syllables.",
      sources: [surveyPdf, perséeNames, oxfordTerms],
      limitation,
    },
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
    names: [
      "Aung",
      "Aye",
      "Ba",
      "Hla",
      "Khin",
      "Lin",
      "Mya",
      "Ohn",
      "San",
      "Sein",
      "Shwe",
      "Soe",
      "Su",
      "Than",
      "Thant",
      "Thein",
      "Thin",
      "Tin",
      "Win",
      "Yi",
      "Zaw",
      "Aung Aung",
      "Hla Hla",
      "Khin Khin",
      "Mya Mya",
      "Aye Aye",
      "Tin Oo",
      "Ba Than",
      "Aung San",
      "Khin Kyi",
    ],
    evidence: {
      status: "hypothesis",
      claim:
        "Burmese naming conventions documented in twentieth- and twenty-first-century surveys are used here as an exploratory continuity hypothesis for the precolonial interior. Burmese historical writing is documented from the Pagan period onward, but the cited naming surveys do not establish that this exact modernized list or its frequencies applied across 1100–1885 households.",
      sources: [surveyPdf, perséeNames, oxfordTerms, burmeseHistory],
      limitation:
        "This is an explicit continuity hypothesis, not a recovered household register. Earlier dates have substantially weaker support; these are plausible invented names rather than claimed medieval attestations. The Cambridge history source supports the existence and chronology of indigenous Burmese historical sources, while the naming studies are later evidence; royal regnal names, monastic names, ethnic minority systems, and local spelling conventions are not represented comprehensively. Names remain complete personal sequences with no hereditary surname or honorific, and generated people are fictional. Roman spellings are normalized for display and do not establish pronunciation or appearance.",
    },
  },
];
