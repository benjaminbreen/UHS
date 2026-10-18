import boats from "./boats.generated.json" with { type: "json" };
import worksites from "./worksites.json" with { type: "json" };
import models from "./models.generated.json" with { type: "json" };
/** Compiled from content recipes by npm run art; shared by generator, game and lab. */
export type BuildingModel = (typeof models)[keyof typeof models];
export const buildingModels: Record<string, BuildingModel> = models;
export const waterborneFrames = new Set(Object.entries(worksites)
  .filter(([,s])=>"waterborne" in s && s.waterborne)
  .flatMap(([name])=>[name,...["north","east","west"].map(f=>`${name}-${f}`)])
  .concat(Object.entries(boats).flatMap(([name,spec])=>spec.finishes.flatMap(finish=>
    Array.from({length:8},(_,f)=>["","-back","-front"].map(layer=>`boat-${name}${finish}-${f}${layer}`)).flat()))));
export function buildingModel(frame: string): BuildingModel {
  const model = buildingModels[frame];
  if (!model) throw new Error(`Missing building model: ${frame}`);
  return model;
}

/** World tiles above a building footprint occupied by its drawn roof and
 * upper wall. Props behind the house keep out of these cells so they do not
 * read as sitting on the roof. */
export function buildingRoofCells(
  frame: string,
  rect: { x: number; y: number; w: number; h: number },
) {
  const model = buildingModel(frame);
  const drawX = rect.x * 16 + rect.w * 8 - model.anchor[0];
  const drawY = rect.y * 16 + rect.h * 16 - model.anchor[1];
  const left = Math.floor(drawX / 16);
  const right = Math.ceil((drawX + model.bounds[2]) / 16);
  const top = Math.floor(drawY / 16);
  const cells: { x: number; y: number }[] = [];
  for (let y = top; y < rect.y; y++)
    for (let x = left; x < right; x++) cells.push({ x, y });
  return cells;
}
