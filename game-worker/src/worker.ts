// worker.ts
import { Worker } from "bullmq";
import { redis } from "./infra/redis";
import { runMatchSimulation } from "./simulation/engine";
import { MatchState } from "./repo/matchRepo";

/**
 * Idempotency rules:
 *
 * 1. A match may only produce one persisted result.
 *    - saveResult must be idempotent by matchId.
 *
 * 2. Match state transitions are monotonic:
 *    LOCKED -> RUNNING -> FINISHED | FAILED
 *    Terminal states are final.
 *
 * 3. Worker execution is at-least-once.
 *    Retries must not cause duplicate results or invalid transitions.
 *
 * 4. Simulation is deterministic.
 *    Retrying a job must produce the same result.
 */

export function startMatchWorker(deps: {
  loadMatch: (id: string) => Promise<any>;
  updateMatchState: (id: string, state: MatchState) => Promise<boolean>;
beforeSaveResult?: (matchId: string) => Promise<void>;
saveResult: (
  id: string,
  result: unknown
) => Promise<boolean>;

}) {
  return new Worker(
    "match-simulation",
    async (job) => {
      const { matchId } = job.data;

      const match = await deps.loadMatch(matchId);
if (!match) return;

if (match.state === "FINISHED" || match.state === "FAILED") {
  return;
}

      const didStart = await deps.updateMatchState(matchId, "RUNNING");

      // if we didn't transition, someone else did or it's terminal
      if (!didStart) return;

      const result = runMatchSimulation({
        playerA: match.playerA.architecture,
        playerB: match.playerB.architecture,
        trafficProfile: match.trafficProfile,
        seed: matchId,
      });

      await deps.saveResult(matchId, result);

      // only move to FINISHED if still RUNNING
      await deps.updateMatchState(matchId, "FINISHED");
      if (deps.beforeSaveResult) {
  await deps.beforeSaveResult(matchId);
}

await deps.saveResult(matchId, result);
await deps.updateMatchState(matchId, "FINISHED");

    },
    { connection: redis }
  );
}
