import { TileQualities } from '../../types';

type QualityFragment = {
  high?: string[];
  low?: string[];
};

export const AMBIANCE_QUALITY_FRAGMENTS: Record<keyof TileQualities, QualityFragment> = {
  flammability: {
    high: ["The dry undergrowth crackles underfoot.", "A spark could easily ignite this place.", "The air smells faintly of smoke or tinder."],
    low: ["Everything feels damp and resistant to fire.", "The area seems naturally protected from flames."],
  },
  biodiversity: {
    high: ["The air buzzes with unseen life.", "A rich tapestry of flora and fauna thrives here.", "Tracks and signs of diverse wildlife are abundant."],
    low: ["Life seems scarce in this desolate spot.", "Only the hardiest creatures could survive here.", "A stark silence hangs in the air, devoid of animal calls."],
  },
  healthiness: {
    high: ["The air is clean and invigorating.", "A sense of vitality permeates the surroundings.", "This place feels restorative and pure."],
    low: ["A faint, unpleasant odor taints the air.", "The environment feels stagnant and unwelcoming.", "There's an undercurrent of unease regarding well-being here."],
  },
  sacrality: {
    high: ["A profound sense of peace and reverence fills this place.", "Ancient energies seem to linger here.", "One feels a connection to something greater."],
    low: ["The area feels mundane and unremarkable.", "There's a distinct lack of spiritual resonance.", "This ground holds no special significance."],
  },
  safety: {
    high: ["It feels remarkably safe here.", "A sense of security and calm prevails.", "One can rest easy in this haven."],
    low: ["An unsettling feeling of danger lurks nearby.", "Every shadow seems to hide a potential threat.", "Caution is advised in this perilous area."],
  },
  geologicalStress: {
    high: ["You feel a faint tremor in the ground.", "The land feels unstable, as if under immense pressure.", "The rocks here are fractured and sharp."],
    low: ["The ground feels solid and ancient.", "The bedrock here is stable and deep."],
  },
  thermalActivity: {
    high: ["The air shimmers with heat rising from the ground.", "A smell of sulfur hangs in the air.", "The ground is warm to the touch."],
    low: ["The ground is cool and still.", "There's no hint of geothermal activity here."],
  },
};
