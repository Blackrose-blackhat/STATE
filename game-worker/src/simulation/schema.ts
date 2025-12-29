import { z } from 'zod';

export const ArchitectureSchema = z
  .object({
    loadBalancer: z.enum(['round_robin', 'least_connections']),

    compute: z.object({
      type: z.enum(['stateless', 'stateful']),
      instances: z.number().int().min(1).max(10),
      autoscale: z.boolean(),
    }),

    database: z.object({
      type: z.enum(['single', 'replicated']),
      consistency: z.enum(['strong', 'eventual']),
    }),

    cache: z.object({
      strategy: z.enum(['off', 'read_through', 'write_through']),
    }),
  })
  .superRefine((arch, ctx) => {
    // Rule 1: Stateful systems cannot autoscale
    if (arch.compute.type === 'stateful' && arch.compute.autoscale) {
      ctx.addIssue({
        path: ['compute', 'autoscale'],
        code: z.ZodIssueCode.custom,
        message: 'Stateful compute cannot autoscale safely',
      });
    }

    // Rule 2: Eventual consistency requires replication
    if (
      arch.database.type === 'single' &&
      arch.database.consistency === 'eventual'
    ) {
      ctx.addIssue({
        path: ['database', 'consistency'],
        code: z.ZodIssueCode.custom,
        message: 'Eventual consistency requires replicated databases',
      });
    }
  });

export type Architecture = z.infer<typeof ArchitectureSchema>;
