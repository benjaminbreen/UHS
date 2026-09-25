import type { LanguageWindow } from ".";

// Before -10000 the comparative method has run out everywhere. These windows
// say which long-range proposal to build from, not what anyone knows.
const build =
  "No language this old is recoverable. Build one anyway: pick a phonology and word order typical of the region's later families, shape core words on the long-range roots proposed for it, keep it internally consistent, and name what it rests on in the explanation, not the line.";

export const paleolithic: LanguageWindow[] = [
  {
    id: "paleo-west-eurasia",
    years: [-1000000, -10000],
    box: [[-25, 25, 65, 72]],
    hypotheses: [
      { label: "Late Paleolithic western Eurasian (hypothetical)", probability: 0.6, confidence: "conjectural",
        note: build, draw: "Nostratic and Eurasiatic proposals (Dolgopolsky, Greenberg, Bomhard); Pagel 2013's ultraconserved words (*ma 'I/me', *kʷi 'who', *tu 'you', *ma 'mother', *h₂eg 'hand')." },
      { label: "Pre-Afroasiatic (hypothetical)", probability: 0.25, confidence: "conjectural",
        note: build, draw: "Ehret's deepest Afroasiatic reconstructions; Natufian-era Levant." },
      { label: "Unrelated lost family (hypothetical)", probability: 0.15, confidence: "conjectural", note: build },
    ],
  },
  {
    id: "paleo-north-asia",
    years: [-1000000, -10000],
    box: [[65, 30, 180, 78]],
    hypotheses: [
      { label: "Ancient North Eurasian language (hypothetical)", probability: 0.5, confidence: "conjectural",
        note: `The Mal'ta boy's people were ancestral to both Native Americans and Botai. ${build}`,
        draw: "Dene-Yeniseian (Vajda) and Eurasiatic roots; Ket and Na-Dene shared typology." },
      { label: "Pre-Sino-Tibetan or East Asian forager language (hypothetical)", probability: 0.3, confidence: "conjectural", note: build },
      { label: "Unrelated lost family (hypothetical)", probability: 0.2, confidence: "conjectural", note: build },
    ],
  },
  {
    id: "paleo-anywhere",
    years: [-1000000, -10000],
    box: [[-180, -90, 180, 90]],
    hypotheses: [
      { label: "Late Paleolithic language of the region (hypothetical)", probability: 1, confidence: "conjectural",
        note: build, draw: "The deepest reconstructed family of the region, and its typology." },
    ],
  },
];
