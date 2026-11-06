import { over, type ReligiousRule } from "./types";

// The atlas has tagged Hawaii and Tahiti with American families; these rules
// key on bounds alone.
export const pacificReligious: ReligiousRule[] = [
  {
    id: "heiau",
    faith: "Hawaiian",
    recipe: "heiau",
    labels: { small: "Heiau", medium: "Heiau", large: "Luakini heiau" },
    from: 1000,
    to: 1820,
    bounds: [-161, 18.5, -154, 22.5],
    side: "north",
    about:
      "The heiau, a platform of piled stone: the priests' house, the tower where the chief priest hears the gods, the carved images, and kapu that kills anyone who breaks it.",
    forecourt: 2,
    warded: true,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Dry-laid lava platforms with the anu'u oracle tower wrapped in kapa and carved ki'i, after Pu'ukohola, Mo'okini and the drawings made on Cook's and later voyages. The kapu system was abolished in 1819.",
    },
  },
  ...over(
    {
      id: "marae",
      faith: "East Polynesian",
      recipe: "marae",
      labels: { small: "Marae", medium: "Marae", large: "Great marae" },
      from: 1000,
      to: 1830,
      side: "north",
      about:
        "The marae, the paved court of the gods and the ancestors: the stepped stone platform at its head, upright stones for the chiefs, and the priests' chants at the offerings.",
      forecourt: 2,
      warded: true,
      evidence: {
        status: "inferred",
        sources: [],
        note: "The stepped ahu of Mahaiatea (drawn in 1769) and the marae of Taputapuatea; Cook Islands and Marquesan me'ae share the court and platform.",
      },
    },
    [-152.5, -18, -148, -16],
    [-160.5, -22, -157, -18.5],
    [-140.5, -10.6, -138.5, -7.8],
  ),
  {
    id: "wharenui",
    faith: "Māori",
    recipe: "wharenui",
    labels: { small: "Meeting house", medium: "Meeting house", large: "Meeting house" },
    from: 1300,
    to: 2100,
    bounds: [166, -47.5, 179, -34],
    side: "north",
    about:
      "The marae and its meeting house, carved with the ancestors: visitors are called on with a chant, speeches are made on the open ground before it, and the dead lie there before burial.",
    forecourt: 3,
    evidence: {
      status: "inferred",
      sources: [],
      note: "The carved wharenui, its bargeboards and ancestor figures, took its classic form in the nineteenth century; earlier chiefs' houses were smaller and less carved. Older Māori ritual centred on the tūāhu, a plain sacred place, which this does not draw.",
    },
  },
];
