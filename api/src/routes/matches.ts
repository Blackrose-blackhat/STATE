import { FastifyInstance } from "fastify";
import { CreateMatchSchema } from "../schema/match";
import {
  createMatch,
  getMatch,
  lockMatch,
  submitArchitecture,
} from "../repo/matchRepo";
import { ArchitectureSchema } from "../schema/architecture";
import z from "zod";
import { matchQueue } from "../infra/queue";
import { getResult } from "../repo/resultRepo";

export async function matchRoutes(app: FastifyInstance) {
  // Create match
  app.post("/matches", async (req, reply) => {
    const parsed = CreateMatchSchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    const match = await createMatch(parsed.data.mode);

    return reply.status(201).send(match);
  });

  // Get match
  app.get("/matches/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    const match = await getMatch(id);

    if (!match) {
      return reply.status(404).send({
        error: "Match not found",
      });
    }
    if (match.state !== "LOCKED") {
      return reply.send({
        ...match,
        executionState: match.state,
      });
    }
    const result = await getResult(id);

    return reply.send({
      ...match,
      executionState: result ? "FINISHED" : "RUNNING",
    });

    return reply.send(match);
  });

  app.post("/matches/:id/architecture", async (req, reply) => {
    const { id } = req.params as { id: string };

    const bodySchema = z.object({
      player: z.enum(["A", "B"]),
      architecture: ArchitectureSchema,
    });

    const parsed = bodySchema.safeParse(req.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    try {
      const match = await submitArchitecture(
        id,
        parsed.data.player,
        parsed.data.architecture
      );

      return reply.send({
        id: match.id,
        state: match.state,
        players: {
          A: { submitted: !!match.players.A.architecture },
          B: { submitted: !!match.players.B.architecture },
        },
        locked: match.state !== "CREATED" && match.state != "DESIGNING",
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: err.message,
      });
    }
  });

  app.post("/matches/:id/lock", async (req, reply) => {
    const { id } = req.params as { id: string };

    try {
      const match = await lockMatch(id);

      // Enqueue exactly once from API perspective
      await matchQueue.add(
        "run",
        { matchId: id },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 500 },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      return reply.send({
        id: match.id,
        state: match.state,
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: err.message,
      });
    }
  });
}
