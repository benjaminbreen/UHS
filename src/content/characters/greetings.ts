import type { CharacterPose } from "../../render/characters/poses";
import type { WorldSetting } from "../geography/types";
import type { CharacterScope } from "./context-types";
import { matchesCharacterScope } from "./resolve";

/** How an ordinary person greets someone they know a little: the first match
 * wins, so narrow scopes come first. A nod everywhere else. */
type Greeting = { scope: CharacterScope; pose: CharacterPose; women?: CharacterPose; note: string };

const JAPAN_KOREA: CharacterScope["bounds"] = [124, 30, 146, 46];
const MEDITERRANEAN: CharacterScope["bounds"] = [-10, 28, 40, 47];

const greetings: readonly Greeting[] = [
  { scope: { years: [600, 1950], cultures: ["east-asian"], bounds: JAPAN_KOREA }, pose: "bow",
    note: "Documented: the standing bow in Heian court etiquette and Joseon ritual manuals; its depth by rank is not drawn." },
  { scope: { years: [-1000, 1950], cultures: ["east-asian"] }, pose: "fist-salute",
    note: "Documented: the yi of the Zhou ritual texts, the gongshou of Ming and Qing; worn into an everyday greeting." },
  { scope: { years: [-300, 1950], cultures: ["south-asian"] }, pose: "palms",
    note: "Documented in sculpture from the Bharhut and Sanchi railings on; earlier use is inference." },
  { scope: { years: [500, 1950], cultures: ["southeast-asian"] }, pose: "palms",
    note: "The wai and the sampeah; anjali figures on the Angkor and Borobudur reliefs. Its everyday use before 1800 is inference." },
  { scope: { years: [650, 1950], cultures: ["north-african-west-asian", "inner-eurasian"] }, pose: "salaam",
    note: "Documented: the hand to the heart with as-salamu alaykum; the Ottoman temenna touched lips and brow as well." },
  { scope: { years: [-3500, 650], cultures: ["north-african-west-asian"] }, pose: "raise-hand",
    note: "Inference from the raised hand of greeting and petition on Mesopotamian seals and Egyptian reliefs." },
  { scope: { years: [-800, 500], cultures: ["european"], bounds: MEDITERRANEAN }, pose: "raise-hand",
    note: "Inference from the raised right hand of Greek and Roman reliefs; the handshake is also attested." },
  { scope: { years: [1550, 1950], cultures: ["european"] }, pose: "doff", women: "curtsy",
    note: "Documented: hat honour, which Quakers made a point of refusing in the 1650s; the curtsy is the women's bob of the knee." },
  { scope: { years: [500, 1550], cultures: ["european"] }, pose: "bow",
    note: "Inference: a bow of the head and shoulders; the full courtly reverence is not drawn." },
  { scope: { years: [1000, 1950], cultures: ["west-central-african"], bounds: [-17, 11, 16, 21] }, pose: "salaam",
    note: "Inference: the Muslim greeting in the towns of the Sahel from Ibn Battuta's Mali on; country people may have kept older forms." },
  { scope: { years: [-500, 1950], cultures: ["west-central-african", "east-southern-african"] }, pose: "clap",
    note: "Documented in 17th-century accounts of Kongo and in Shona kuombera; its spread across the whole region is inference." },
  { scope: { years: [-1200, 1600], cultures: ["mesoamerican"] }, pose: "bow",
    note: "Inference from Sahagún's commoners bowing to lords; the touch of earth to the lips was for the gods and the great." },
];

export function greetingFor(setting: WorldSetting | undefined, woman = false): CharacterPose {
  const g = setting && greetings.find((x) => matchesCharacterScope(x.scope, setting, "*"));
  return (woman && g?.women) || g?.pose || "nod";
}

/** Greetings that need both hands free. */
export const twoHanded = new Set<CharacterPose>(["fist-salute", "palms", "clap"]);
