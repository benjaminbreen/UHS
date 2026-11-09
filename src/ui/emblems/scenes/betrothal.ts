import type { Pal } from "../kit";
import { pair } from "./pair";

export default function betrothal(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  pair(ctx, pal, t, ending, "gifts");
}
