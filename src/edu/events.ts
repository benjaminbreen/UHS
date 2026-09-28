import { z } from "zod";

export const eduEventSchema = z.object({
  seq: z.number().int().positive(),
  kind: z.enum(["world", "command", "text", "note", "selection", "dialogue"]),
  wallTime: z.string().datetime(),
  simTime: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative(),
  data: z.record(z.string(), z.unknown()),
}).strict();

export type EduEvent = z.infer<typeof eduEventSchema>;
export type EduSession = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  eventCount: number;
};
