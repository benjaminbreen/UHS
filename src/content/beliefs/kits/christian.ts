import type { Power } from "../types";

export const orthodoxTrinity: readonly Power[] = [
  {
    name: "God the Father",
    wiki: "https://en.wikipedia.org/wiki/God_the_Father",
    domain: "creator, source of divine life",
    rank: "paramount",
  },
  {
    name: "Jesus Christ, the Son",
    wiki: "https://en.wikipedia.org/wiki/Jesus",
    domain: "incarnation, salvation, resurrection",
    rank: "paramount",
  },
  {
    name: "The Holy Spirit",
    wiki: "https://en.wikipedia.org/wiki/Holy_Spirit_in_Christianity",
    domain: "divine presence, life, sanctification",
    rank: "paramount",
  },
];

export const russianOrthodoxHolyFigures: readonly Power[] = [
  {
    name: "The Theotokos",
    wiki: "https://en.wikipedia.org/wiki/Theotokos",
    domain: "the Mother of God, mercy, intercession",
    rank: "major",
    relations: [{ kind: "intercedes-before", of: "Jesus Christ, the Son" }],
  },
  {
    name: "Saint Nicholas",
    wiki: "https://en.wikipedia.org/wiki/Saint_Nicholas",
    domain: "travelers, children, protection",
    rank: "major",
    relations: [{ kind: "intercedes-before", of: "Jesus Christ, the Son" }],
  },
  {
    name: "Peter and Paul",
    wiki: "https://en.wikipedia.org/wiki/Feast_of_Saints_Peter_and_Paul",
    domain: "the apostles, teaching, the Church",
    rank: "major",
    relations: [{ kind: "intercedes-before", of: "Jesus Christ, the Son" }],
  },
  {
    name: "Saint George",
    wiki: "https://en.wikipedia.org/wiki/Saint_George",
    domain: "soldiers, herds, protection",
    rank: "major",
    relations: [{ kind: "intercedes-before", of: "Jesus Christ, the Son" }],
  },
  {
    name: "Archangel Michael",
    wiki: "https://en.wikipedia.org/wiki/Michael_(archangel)",
    domain: "heavenly armies, protection, the hour of death",
    rank: "major",
    relations: [{ kind: "serves", of: "God the Father" }],
  },
];

export const russianOrthodoxPatronOptions = russianOrthodoxHolyFigures.map(
  (power) => power.name,
);

export const latinChristianHolyFigures: readonly Power[] = [
  {
    name: "The Virgin Mary",
    wiki: "https://en.wikipedia.org/wiki/Mary,_mother_of_Jesus",
    domain: "the Mother of God, mercy, intercession",
    rank: "major",
    relations: [{ kind: "intercedes-before", of: "Jesus Christ, the Son" }],
  },
  {
    name: "Saint Peter",
    wiki: "https://en.wikipedia.org/wiki/Saint_Peter",
    domain: "the Church, the keys of heaven",
    rank: "major",
    relations: [{ kind: "intercedes-before", of: "Jesus Christ, the Son" }],
  },
  {
    name: "Saint Paul",
    wiki: "https://en.wikipedia.org/wiki/Paul_the_Apostle",
    domain: "mission, conversion, teaching",
    rank: "major",
    relations: [{ kind: "intercedes-before", of: "Jesus Christ, the Son" }],
  },
  {
    name: "Archangel Michael",
    wiki: "https://en.wikipedia.org/wiki/Michael_(archangel)",
    domain: "protection, judgement, the heavenly host",
    rank: "major",
    relations: [{ kind: "serves", of: "God the Father" }],
  },
  {
    name: "The local patron saint",
    wiki: "https://en.wikipedia.org/wiki/Patron_saint",
    domain: "the parish, town, trade, or household",
    rank: "major",
    relations: [{ kind: "intercedes-before", of: "Jesus Christ, the Son" }],
  },
];

export const latinChristianPatronOptions = latinChristianHolyFigures.map(
  (power) => power.name,
);
