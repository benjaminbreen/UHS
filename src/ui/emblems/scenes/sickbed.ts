import type { Pal } from "../kit";
import { room } from "./cradle";

export default function sickbed(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  room(ctx, pal, t, ending, true);
}
