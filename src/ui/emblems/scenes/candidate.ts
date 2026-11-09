import type { Pal } from "../kit";
import { rite } from "./rite";

export default function candidate(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  rite(ctx, pal, t, ending, "desk");
}
