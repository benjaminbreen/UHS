import { over, type Box, type ReligiousRule } from "./types";

const church = { small: "Chapel", medium: "Church", large: "Cathedral" };
const about =
  "The church, where the town hears the liturgy on Sundays and feast days, has its children baptised and buries its dead; the icons on the screen stand between the people and the altar.";

const byzantine: Omit<ReligiousRule, "bounds" | "from" | "to"> = {
  id: "byzantine-church",
  faith: "Orthodox Christian",
  recipe: "byzantine-church",
  labels: church,
  side: "north",
  about,
  forecourt: 2,
  evidence: {
    status: "inferred",
    sources: [],
    note: "The domed cross-in-square church of the middle Byzantine centuries (Hosios Loukas, the Thessaloniki and Constantinople parish churches), with its Serbian and post-Byzantine village descendants. Earlier basilicas and Justinian's domed basilicas are drawn in the later form.",
  },
};

export const orthodoxReligious: ReligiousRule[] = [
  ...over({ ...byzantine, culture: "european", from: 392, to: 10001 }, [19.5, 34, 30, 42]),
  // Bulgaria took baptism in 864 and Serbia within the decade.
  ...over({ ...byzantine, culture: "european", from: 864, to: 10001 }, [19, 40, 29.5, 46]),
  ...over({ ...byzantine, culture: "european", from: 900, to: 10001 }, [22, 43.5, 30, 48.5]),
  // Byzantine Asia Minor: the west coast held until about 1300, the plateau until Manzikert.
  ...over({ ...byzantine, culture: "north-african-west-asian", from: 330, to: 1300 }, [26, 35.5, 31, 42.5]),
  ...over({ ...byzantine, culture: "north-african-west-asian", from: 330, to: 1071 }, [31, 35.5, 41.4, 42.5]),
  ...over({ ...byzantine, culture: "north-african-west-asian", from: 330, to: 640 }, [34, 29, 44, 37.5]),
  ...over({ ...byzantine, culture: ["european", "north-african-west-asian"], from: 330, to: 1571 }, [32, 34.5, 34.6, 35.7]),
  ...over(
    {
      id: "rus-church",
      faith: "Orthodox Christian",
      recipe: "rus-church",
      labels: church,
      culture: ["european", "inner-eurasian"],
      from: 988,
      to: 1450,
      side: "north",
      about,
      forecourt: 2,
      evidence: {
        status: "inferred",
        sources: [],
        note: "Kievan and Novgorodian churches: the cross-domed church in white limestone or plastered brick, its wall heads in round zakomary, a helmet dome on a drum, after St Sophia in Novgorod and the Vladimir churches; most parishes were of logs, with a tented roof.",
      },
    },
    [28.5, 48.5, 44, 70],
    [24.5, 48.5, 28.5, 54],
  ),
  ...over(
    {
      id: "muscovite-church",
      faith: "Orthodox Christian",
      recipe: "muscovite-church",
      labels: church,
      culture: ["european", "inner-eurasian"],
      from: 1450,
      to: 10001,
      side: "north",
      about,
      forecourt: 2,
      evidence: {
        status: "inferred",
        sources: [],
        note: "Onion domes, tiers of kokoshnik gables and tented bell towers from the late fifteenth century on, in painted brick or in logs (Kizhi), after the Moscow and Yaroslavl parish churches. Middle Volga towns join after Kazan falls in 1552.",
      },
    },
    [28.5, 48.5, 44, 70],
    [24.5, 48.5, 28.5, 54],
  ),
  ...over(
    {
      id: "muscovite-church-south",
      faith: "Orthodox Christian",
      recipe: "muscovite-church",
      labels: church,
      culture: ["european", "inner-eurasian"],
      from: 1783,
      to: 10001,
      side: "north",
      about,
      forecourt: 2,
      evidence: {
        status: "inferred",
        sources: [],
        note: "New Russia and the Crimea, settled with Russian churches after the annexation of 1783.",
      },
    },
    [30, 44, 44, 48.5],
  ),
  ...over(
    {
      id: "muscovite-church-volga",
      faith: "Orthodox Christian",
      recipe: "muscovite-church",
      labels: church,
      culture: ["european", "inner-eurasian"],
      from: 1552,
      to: 10001,
      side: "north",
      about,
      forecourt: 2,
      evidence: {
        status: "inferred",
        sources: [],
        note: "Russian churches on the middle Volga after the conquest of Kazan in 1552; the Tatar towns kept their mosques beside them.",
      },
    },
    [44, 48.5, 60, 62],
  ),
  // Split by date so Georgia and Armenia keep their churches against the
  // Ottoman rule, whose box reaches the Caucasus: narrower dates win.
  ...[
    [301, 1400],
    [1400, 1900],
    [1900, 2100],
  ].flatMap(([from, to]) =>
    over(
      {
        id: "caucasian-church",
        faith: "Orthodox and Armenian Christian",
        recipe: "caucasian-church",
        labels: church,
        culture: ["north-african-west-asian", "inner-eurasian", "european"],
        from,
        to,
        side: "north",
        about:
          "The church of dressed stone, where the town hears the liturgy, has its children baptised and buries its dead; carved crosses stand in the churchyard.",
        forecourt: 2,
        evidence: {
          status: "inferred",
          sources: [],
          note: "Armenia took Christianity in 301 and Georgia in the 330s. The cross-domed church with a tall drum and conical stone roof, blind arcades and carved crosses follows Jvari, Svetitskhoveli, Etchmiadzin and Ani; Armenian and Georgian churches are told apart by stone, not plan.",
        },
      },
      [41.4, 38.5, 46, 43.6],
    ),
  ),
  ...(<{ box: Box; from: number }[]>[
    { box: [23.9, 39.9, 24.45, 40.45], from: 963 },
    { box: [21.55, 39.65, 21.7, 39.8], from: 1340 },
    { box: [33.9, 28.5, 34.05, 28.6], from: 548 },
    { box: [38.0, 56.25, 38.25, 56.4], from: 1337 },
    { box: [38.3, 59.8, 38.45, 59.9], from: 1397 },
    { box: [35.6, 64.98, 35.8, 65.1], from: 1436 },
  ]).map(
    ({ box, from }): ReligiousRule => ({
      id: "orthodox-monastery",
      faith: "Orthodox Christian",
      recipe: "orthodox-monastery",
      labels: { small: "Skete", medium: "Monastery", large: "Lavra" },
      from,
      to: 10001,
      bounds: box,
      side: "north",
      about:
        "The monastery: the monks' cells and refectory round the church inside a wall, the gate kept by a porter, the bell or the wooden semantron calling the hours day and night.",
      forecourt: 2,
      warded: true,
      evidence: {
        status: "inferred",
        sources: [],
        note: "Walled monasteries round their katholikon: Athos (963), the Meteora (1340s), St Catherine's at Sinai (548), and the Trinity-Sergius, Kirillo-Belozersky and Solovetsky lavras in Russia.",
      },
    }),
  ),
];
