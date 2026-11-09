import type { Pal } from "../kit";
import { path } from "./path";

export default function fieldpath(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  path(ctx, pal, t, ending, true);
}
