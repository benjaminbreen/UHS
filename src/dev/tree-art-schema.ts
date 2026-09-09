import { z } from "zod";

const hex = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, "Expected a six-digit hex color");
const pixelRow = z
  .string()
  .regex(/^[.0-9a-z]+$/i, "Expected . for transparent or a palette index");

const frame = z.object({
  source: z.enum(["nature", "ecology", "atlas"]),
  frame: z.object({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    w: z.number().int().positive(),
    h: z.number().int().positive(),
  }),
  palette: z.array(hex).min(1).max(36),
  pixels: z.array(pixelRow).min(1),
});

export const treeArtRecipeSchema = z.object({
  version: z.literal(1),
  target: z.literal("tree"),
  assets: z.record(z.string().min(1), frame),
});
