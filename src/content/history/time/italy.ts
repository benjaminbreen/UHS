import type { WorldSetting } from "../../geography/types";
export function italianTimeContext(s: WorldSetting) {
  const naples = Math.hypot(s.lon - 14.268, s.lat - 40.852) < 0.18;
  if (!naples || s.year < -469) return undefined;
  const sources = [
    {
      title: "UNESCO · Historic Centre of Naples",
      url: "https://whc.unesco.org/en/list/726/",
    },
  ];
  if (s.year < -326)
    return { name: "Neapolis", community: "Greek communities of Neapolis",
      text: "Neapolis is a Greek city on the Bay of Naples. Its streets and inhabited quarters will leave a lasting imprint on the ground beneath later generations.", sources };
  if (s.year < 300)
    return {
      name: "Neapolis",
      community: "Greek and Roman urban communities",
      text: "Neapolis belongs to the Roman world, while its Greek inheritance remains part of the city's life. Streets laid out in antiquity form the enduring framework of the settlement.",
      sources,
    };
  if (s.year < 600)
    return {
      name: "Neapolis",
      community: "Late antique Christian communities",
      text: "Christian institutions have become part of the city's public life. Older streets and buildings remain in use amid the political upheavals of late antiquity.",
      sources,
    };
  if (s.year < 1139)
    return {
      name: "Napoli",
      community: "Christian communities of the Duchy of Naples",
      text: "Napoli is a Christian city shaped by Byzantine connections and its own dukes. Ancient street alignments endure as buildings are repaired, replaced and put to new uses.",
      sources,
    };
  if (s.year < 1266)
    return {
      name: "Napoli",
      community: "Christian communities under Norman and then Swabian rule",
      text: "The city belongs to the southern Italian kingdom. Churches and inhabited quarters occupy an urban fabric whose street pattern still reaches back to antiquity.",
      sources,
    };
  if (s.year < 1442)
    return {
      name: "Napoli",
      community: "Communities of Angevin Naples",
      text: "Napoli is an Angevin capital. Religious and royal building has added new layers to the ancient city, while ordinary households continue to reuse older sites.",
      sources,
    };
  return {
    name: "Napoli",
    community: s.community,
    text: "The old city's street pattern preserves its Greek and Roman inheritance beneath successive generations of religious, civic and domestic construction.",
    sources,
  };
}
