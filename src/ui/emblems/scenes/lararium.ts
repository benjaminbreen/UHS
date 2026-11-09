import type { Pal } from "../kit";
import { rite } from "./rite";

export default function lararium(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  rite(ctx, pal, t, ending, "lararium");
}
