export type HomeAnchor = {
  mapSeed: number;
  worldX: number;
  worldY: number;
  mapAreaName: string;
  zone: string;
  region: string;
  x: number;
  y: number;
  kind: 'urban' | 'structure' | 'encampment';
  label: string;
};
