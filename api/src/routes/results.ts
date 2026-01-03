import { FastifyInstance } from "fastify";
import { getMatch } from "../repo/matchRepo";
import { getResult } from "../repo/resultRepo";

export async function resultRoutes(app: FastifyInstance) {
  app.get("/matches/:id/result", async (req, reply) => {
    const { id } = req.params as { id: string };

    const match = await getMatch(id);
    if (!match) {
      return reply.status(404).send({
        error: "Match not found",
      });
    }

    // The ONLY source of truth for FINISHED
    const result = await getResult(id);

    if (!result) {
      return reply.send({
        id,
        state: "RUNNING",
      });
    }

    return reply.send({
      id,
      state: "FINISHED",
      result,
    });
  });
}

