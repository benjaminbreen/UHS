export type ShorePolish = {
  coastScallop?: number;
  coastBeachWidth?: number;
  coastScale?: number;
  beachVariation?: number;
  offshoreCalm?: number;
  enabled: boolean;
  blend: number;
  plants: number;
  rocks: number;
  ripples: number;
};
export const shorePolishDefaults: ShorePolish = {
  coastScallop: 1.4,
  coastBeachWidth: 8,
  coastScale: 18,
  beachVariation: 0.5,
  offshoreCalm: 0.95,
  enabled: true,
  blend: 0.7,
  plants: 0.85,
  rocks: 0.75,
  ripples: 0.8,
};
