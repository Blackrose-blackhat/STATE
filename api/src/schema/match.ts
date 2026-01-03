import { z } from "zod";
import { ArchitectureSchema } from "./architecture";

export const MatchStateSchema = z.enum([
  "CREATED",
  "DESIGNING",
  "LOCKED",
]);


export type MatchState = z.infer<typeof MatchStateSchema>;

export const CreateMatchSchema = z.object({
  mode: z.enum(["SOLO", "DUEL"]),
});

export type CreateMatchInput = z.infer<typeof CreateMatchSchema>;



export const MatchSchema = z.object({
  id: z.string(),
  mode: z.enum(["SOLO", "DUEL"]),
  state: MatchStateSchema,
  createdAt: z.number(),

  players: z.object({
    A: z.object({
      architecture: ArchitectureSchema.optional(),
    }),
    B: z.object({
      architecture: ArchitectureSchema.optional(),
    }),
  }),
});


export type Match = z.infer<typeof MatchSchema>;
