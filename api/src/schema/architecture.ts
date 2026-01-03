import { z } from "zod";

export const ArchitectureSchema = z.object({
  loadBalancer: z.enum(["round_robin", "least_connections"]),
  compute: z.object({
    type: z.enum(["stateless", "stateful"]),
    instances: z.number().int().min(1),
    autoscale: z.boolean(),
  }),
  database: z.object({
    type: z.enum(["replicated", "single"]),
    consistency: z.enum(["eventual", "strong"]),
  }),
  cache: z.object({
    strategy: z.enum(["read_through", "write_through", "off"]),
  }),
});

export type Architecture = z.infer<typeof ArchitectureSchema>;
