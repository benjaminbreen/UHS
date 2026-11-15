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
  teddy: /\bteddy (boy|girl)s?\b/,
  stilyagi: /\bstilyag[ai]\b/,
  rocker: /\b(rockers?|greasers?|ton-up boys?)\b/,
  mod: /\bmods?\b/,
  hippie: /\b(hippies?|hippy|flower child(ren)?)\b/,
  afro: /\bafro\b/,
  skinhead: /\bskinheads?\b/,
  punk: /\bpunks?\b/,
  goth: /\bgoths?\b/,
  "hip-hop": /\b(hip[- ]?hop|rappers?|b-?boys?|b-?girls?|breakdancers?|mcs?)\b/,
  grunge: /\bgrunge\b/,
  emo: /\bemos?\b/,
  hipster: /\bhipsters?\b/,
  rasta: /\b(rastas?|rastafarians?|rastafari)\b/,
  sapeur: /\b(sapeurs?|sapeuses?|la sape)\b/,
  cholo: /\b(cholos?|cholas?)\b/,
  bosozoku: /\bb[oō]s[oō]zoku\b/,
  ganguro: /\b(ganguro|gyaru)\b/,
  lolita: /\blolitas?\b/,
  gentleman: /\b(gentleman|gentlewoman|dandy)\b/,
  geisha: /\b(geisha|geiko|maiko)\b/,
  pilot: /\b(pilot|aviator|airman)\b/,
  mountaineer: /\b(mountaineer|climber|expedition member)\b/,
  // Not the Arctic "skin sewer", who sews.
  sewerman: /(?<!skin )\b(sewers?|sewerm[ae]n|flushers?|kanalarbeiter|drain clearers?|sanitation workers?|rat[- ]catchers?|rodent operatives?|toshers?|collector fitters?)\b/,
  pitman: /\b(pitm[ae]n|colliers?|coal ?(miners?|bearers?|carriers?)|hewers?|hurriers?|onsetters?|shotfirers?|pony drivers?|tributers?|tutworkers?|kajchas?|barreteros?|mita workers?|bergm[ae]nn|salt miners?|(gold|silver|tin|copper|hard-rock|cooperative|slave) miners?|miners?|mine workers?|trapper boys?|atoyama|water bailers?|shock workers?)\b/,
  urbex: /\b(urban explorers?|urbex|cataphiles?|drainers?|graffiti writers?)\b/,
  astronaut:
    /\b(astronaut|cosmonaut|taikonaut|spacer|space ?(crew|pilot|marine)|flight engineer)\b/,
  soldier:
    /\b(soldier|infantry|infantryman|trooper|private|corporal|sergeant|rifleman|legionary|legionnaire|hoplite|musketeer|grenadier|conscript|marine|warrior|men-at-arms|man-at-arms|guardsman)\b/,
  // Anyone who stands watch or fights, so the guard kits can arm them.
  guard:
    /\b(guard|guardsman|watchman|watchmen|gate[- ]?keeper|sentry|sentinel|warrior|retainer|soldier|legionary|hoplite|halberdier|musketeer|pikeman|man-at-arms|men-at-arms|samurai|ashigaru|janissary|mamluk|sepoy|bannerman|spearman|archer|peltast|phalangite|mercenary|auxiliary|praetorian|crossbowman|longbowman|arquebusier|landsknecht|fusilier|grenadier|dragoon|redcoat|strelets|sipahi|ghulam|qizilbash|tufangchi|paik|sowar|barqandaz|horseman|moran)\b/,
  // Islamic clergy by title, so a qazi in Delhi dresses as one and not as a brahmin.
  imam: /\b(imam|qadi|qazi|kadi|mullah|mufti|muezzin|dervish|sufi)\b/,
  // Clergy by office, so a deacon, a monk and a bishop of one church dress apart.
  cleric: /\b(priest|deacon|monk|friar|nun|bishop|abbot|abbess|hieromonk|metropolitan|patriarch|debtera|archimandrite)\b/,
  deacon: /\b(deacon|deaconess)\b/,
  bishop: /\b(bishop|archbishop|metropolitan|patriarch|abuna)\b/,
  monastic: /\b(monk|friar|nun|abbot|abbess|hieromonk|archimandrite|bhikkhu|bhikkhuni|monastic)\b/,
  "plague-doctor": /\b(plague doctors?|plague physicians?|medico della peste|médecin de peste)\b/,
  janissary: /\b(janissary|janissaries|yeniçeri)\b/,
  grenadier: /\bgrenadiers?\b/,
  samurai: /\b(samurai|r[oō]nin|hatamoto|gokenin|daimyo|bushi)\b/,
  sikh: /\b(sikhs?|khalsa|akali|nihang|granthi)\b/,
  // Latin religious orders, so a habit says which rule its wearer keeps.
  franciscan: /\b(franciscans?|grey ?friars?|gray ?friars?|capuchins?|poor clares?|minorites?|friars? minor)\b/,
  dominican: /\b(dominicans?|black ?friars?|friars? preachers?)\b/,
  benedictine: /\b(benedictines?|black monks?|cluniacs?)\b/,
  cistercian: /\b(cistercians?|trappists?|white monks?|bernardines?)\b/,
  jain: /\bjain\b/,
  granthi: /\b(granthi|guru)\b/,
  mobad: /\b(mobad|herbad|dastur|magus|magi|fire priest|keeper of fire)\b/,
  brahmin: /\b(brahmin|purohita?|pujari|archaka)\b/,
  sailor:
    /\b(sailor|seaman|seafarer|mariner|deckhand|boatswain|bosun|able seaman|whaler|navigator|helmsman|ship'?s? (boy|mate|cook)|crewman|lascar|stoker|bluejacket)\b/,
  harpooner: /\b(whaler|harpooner|whale hunter)\b/,
  tradesman:
    /\b(boilermaker|welder|mechanic|machinist|plumber|electrician|pipefitter|ironworker|steelworker|roofer|mason|bricklayer|labou?rer|construction|longshoreman|dockworker|trucker|truck driver|lineman|miner|carpenter|roughneck|factory worker)\b/,
  office:
    /\b(clerk|accountant|lawyer|attorney|banker|manager|executive|secretary|receptionist|teacher|professor|analyst|salesman|saleswoman|realtor|insurance|administrator|consultant|doctor|pharmacist)\b/,
  // Who wears regalia, and who wears the dress of a court office.
  monarch: /\b(emperor|empress|king|queen|pharaoh|sultan|sultana|shah|shahanshah|khan|khagan|tsar|tsarina|mansa|negus|tlatoani|ajaw|ahau|sapa inca|maharaja|maharani|raja|rajah|rani|basileus|tenno|monarch|sovereign|chieftain|sachem|cacique|ariki|alii|ali'i)\b/,
  official: /\b(vizier|minister|chancellor|mandarin|governor|satrap|nomarch|daimyo|kuge|scribe of the king|grand secretary)\b/,
  "high-priest": /\b(high priest|high priestess|chief priest|first prophet)\b/,
  // Roman office, for the dress that marked it.
  senator: /\b(senator|senatorial|conscript fathers?)\b/,
  magistrate: /\b(consul|proconsul|praetor|propraetor|aedile|quaestor|censor|dictator|magistrate)\b/,
  princeps: /\b(emperor|empress|augustus|augusta|caesar|princeps)\b/,
  eques: /\b(eques|equites|equestrian|procurator|prefect|praefectus)\b/,
  general: /\b(general|imperator|legate|legatus|commander)\b/,
  pontifex: /\b(pontifex|pontiff|flamen|augur|haruspex|rex sacrorum)\b/,
  aristocrat:
    /\b(emperor|empress|king|queen|prince|princess|duke|duchess|earl|count|countess|marquess|marquis|baron|baroness|viscount|noble|nobleman|noblewoman|aristocrat|courtier|patrician|grandee|lord|lady|boyar|yangban|zamindar|nawab|emir|amir|shogun|maharaja|maharani|sultan|sultana|tsar|tsarina|khan|pharaoh)\b/,
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
