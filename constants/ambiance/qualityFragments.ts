import { TileQualities } from '../../types';

type QualityFragment = {
  high?: string[];
  low?: string[];
};

export const AMBIANCE_QUALITY_FRAGMENTS: Record<keyof TileQualities, QualityFragment> = {
  flammability: {
    high: ["The dry undergrowth crackles underfoot.", "A spark could easily ignite this place.", "The air smells faintly of smoke."],
    low: ["It's humid here.", "You hear a sound of water dripping."],
  },
  biodiversity: {
    high: ["The air buzzes with unseen life.", "A rich tapestry of flora and fauna thrives here.", "Tracks of wildlife are abundant."],
    low: ["Life seems scarce in this desolate spot.", "Only the hardiest creatures could survive here.", "A stark silence hangs in the air."],
  },
  healthiness: {
    high: ["The air is clean and invigorating.", "A sense of vitality permeates the surroundings.", "This place is beautiful."],
    low: ["A faint, unpleasant odor taints the air.", "The environment feels stagnant and unwelcoming.", "You feel a spine-tingling undercurrent of unease."],
  },
  sacrality: {
    high: ["A profound sense of peace fills this place.", "You have the distinct sense you are bearing watched.", "It is peaceful here."],
    low: ["You feel uncomfortable here, for some reason.", "This is a rather unremarkable place."],
  },
  safety: {
    high: ["It is very tranquil here.", "A sense of calm prevails.", "This would be a good place to camp."],
    low: ["An unsettling feeling of danger lurks nearby.", "This would not be a good place to linger.", "This area seems perilous."],
  },
  geologicalStress: {
    high: ["You feel a faint tremor in the ground.", "The land feels unstable.", "The rocks here are fractured and sharp."],
    low: ["The stones here are worn smooth.", "The bedrock here is stable and deep."],
  },
  thermalActivity: {
    high: ["The air shimmers with heat rising from the ground.", "A smell of sulfur hangs in the air.", "The ground is warm to the touch."],
    low: [""],
  },
};
