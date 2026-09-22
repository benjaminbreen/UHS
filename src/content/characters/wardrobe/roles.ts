/**
 * Tags read off whatever a person's role says. This is the path a world-weaver
 * prompt takes to the wardrobe: the prompt names a soldier or an astronaut,
 * that text lands on the actor's role, and the tag pulls in the right kit.
 *
 * Matched on words rather than on an enum, because the role is free text —
 * "22nd century farmer", "able seaman", "Empress of Brazil" — and nothing
 * upstream normalises it.
 */
const patterns: Record<string, RegExp> = {
  pilot: /\b(pilot|aviator|airman)\b/,
  mountaineer: /\b(mountaineer|climber|expedition member)\b/,
  astronaut:
    /\b(astronaut|cosmonaut|taikonaut|spacer|space ?(crew|pilot|marine)|flight engineer)\b/,
  soldier:
    /\b(soldier|infantry|infantryman|trooper|private|corporal|sergeant|rifleman|legionary|legionnaire|hoplite|musketeer|grenadier|conscript|marine|warrior|men-at-arms|man-at-arms|guardsman)\b/,
  sailor:
    /\b(sailor|seaman|seafarer|mariner|deckhand|boatswain|bosun|able seaman|whaler|navigator|helmsman|ship'?s? (boy|mate|cook)|crewman)\b/,
  tradesman:
    /\b(boilermaker|welder|mechanic|machinist|plumber|electrician|pipefitter|ironworker|steelworker|roofer|mason|bricklayer|labou?rer|construction|longshoreman|dockworker|trucker|truck driver|lineman|miner|carpenter|roughneck|factory worker)\b/,
  office:
    /\b(clerk|accountant|lawyer|attorney|banker|manager|executive|secretary|receptionist|teacher|professor|analyst|salesman|saleswoman|realtor|insurance|administrator|consultant|doctor|pharmacist)\b/,
  aristocrat:
    /\b(emperor|empress|king|queen|prince|princess|duke|duchess|earl|count|countess|marquess|marquis|baron|baroness|viscount|noble|nobleman|noblewoman|aristocrat|courtier|patrician|grandee|lord|lady|shogun|maharaja|maharani|sultan|sultana|tsar|tsarina|khan|pharaoh)\b/,
};
/** Every tag that this person's stated role earns them. */
export function rolesFrom(
  ...text: readonly (string | undefined)[]
): readonly string[] {
  const words = text.filter(Boolean).join(" ").toLowerCase();
  if (!words) return [];
  return Object.entries(patterns)
    .filter(([, re]) => re.test(words))
    .map(([tag]) => tag);
}
