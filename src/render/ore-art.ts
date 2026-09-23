import type Phaser from "phaser";
import type { Metal, OreGrade } from "../content/ecology/metals";

const METAL: Record<Metal, [string, string, string]> = {
  copper: ["#6a3a22", "#b86a3c", "#e8a070"],
  tin: ["#4a4a48", "#a8a8a0", "#e0e0d8"],
  iron: ["#4a2618", "#9a5634", "#c87a4c"],
  silver: ["#4a4c54", "#c0c4cc", "#f4f6fa"],
  gold: ["#6a4a10", "#d8a830", "#fff0a0"],
};
/** Where the nuggets sit on a boulder, rich veins showing more of them. */
const SPOTS: Record<OreGrade, [number, number][]> = {
  poor: [[6, 4]],
  fair: [
    [3, 3],
    [9, 5],
  ],
  rich: [
    [2, 4],
    [7, 1],
    [11, 5],
  ],
};
const NUGGET = [".oo.", "oRso", "orRo", ".oo."];

/** The vein showing through a boulder, drawn over the rock art: a few
 * outlined nuggets, lit from the upper left like everything else. */
export function oreOverlay(scene: Phaser.Scene, metal: Metal, grade: OreGrade) {
  const key = `ore:${metal}:${grade}`;
  if (scene.textures.exists(key)) return key;
  const texture = scene.textures.createCanvas(key, 16, 10)!;
  const ctx = texture.context;
  const [dark, mid, light] = METAL[metal];
  const ink: Record<string, string> = { o: dark, r: mid, R: light, s: "#fffbe8" };
  for (const [x, y] of SPOTS[grade])
    NUGGET.forEach((row, dy) =>
      [...row].forEach((ch, dx) => {
        if (ch === ".") return;
        ctx.fillStyle = ink[ch];
        ctx.fillRect(x + dx, y + dy, 1, 1);
      }),
    );
  texture.refresh();
  return key;
}
