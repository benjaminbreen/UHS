import { z } from "zod";
import { ecologies } from "../content/ecology/profiles";
import { grassPaletteRoles } from "../content/graphics/grass-art";

const hex = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, "Expected a six-digit hex color");
const row = z.string().regex(/^[0-3]+$/, "Expected pixel values 0–3");
const tickRow = z.string().regex(/^[01]+$/, "Expected pixel values 0–1");

export const grassArtRecipeSchema = z.object({
  version: z.literal(1),
  target: z.literal("grass"),
  palettes: z.record(
    z.enum(ecologies),
    z.record(z.enum(grassPaletteRoles), hex),
  ),
  motifs: z.object({
    turf: z.array(z.array(row).min(1)).min(1),
    ticks: z.array(z.array(tickRow).min(1)).min(1),
  }),
});
