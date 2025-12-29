import { z } from 'zod';
import { ArchitectureSchema } from '../simulation/schema';

export const TrafficProfileSchema = z.object({
  warmupRps: z.number().min(1),
  rampToRps: z.number().min(1),
  spikeRps: z.number().min(1),
  sustainRps: z.number().min(1),
});

export const MatchSchema = z.object({
  id: z.string(),
  state: z.enum([
    'CREATED',
    'WAITING_FOR_PLAYER',
    'DESIGNING',
    'LOCKED',
    'RUNNING',
    'FINISHED',
  ]),
  trafficProfile: TrafficProfileSchema,
  playerA: z.object({
    architecture: ArchitectureSchema,
  }),
  playerB: z.object({
    architecture: ArchitectureSchema,
  }),
});

export type Match = z.infer<typeof MatchSchema>;
