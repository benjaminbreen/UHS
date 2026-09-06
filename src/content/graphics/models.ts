import models from "./models.generated.json" with { type: "json" };
/** Compiled from content recipes by npm run art; shared by generator, game and lab. */
export type BuildingModel = (typeof models)[keyof typeof models];
export const buildingModels: Record<string, BuildingModel> = models;
export function buildingModel(frame: string): BuildingModel {
  const model = buildingModels[frame];
  if (!model) throw new Error(`Missing building model: ${frame}`);
  return model;
}
