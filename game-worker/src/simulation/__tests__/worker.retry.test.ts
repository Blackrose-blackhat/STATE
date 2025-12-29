import { describe, it, expect } from "bun:test";
import { Queue } from "bullmq";
import { redis } from "../../infra/redis";
import { startMatchWorker } from "../../worker";
import { Architecture } from "../../simulation/schema";

const TRAFFIC = {
  warmupRps: 50,
  rampToRps: 200,
  spikeRps: 400,
  sustainRps: 250,
};

const GOOD_ARCH: Architecture = {
  loadBalancer: "round_robin",
  compute: {
    type: "stateless",
    instances: 3,
    autoscale: true,
  },
  database: {
    type: "replicated",
    consistency: "eventual",
  },
  cache: {
    strategy: "read_through",
  },
};

describe("match worker retry safety", () => {
  it("recovers from crash and saves result exactly once", async () => {
    let saveCount = 0;
    let crashOnce = true;
    const states: string[] = [];

    startMatchWorker({
      loadMatch: async () => ({
        id: "m2",
        state: "LOCKED",
        trafficProfile: TRAFFIC,
        playerA: { architecture: GOOD_ARCH },
        playerB: { architecture: GOOD_ARCH },
      }),

      updateMatchState: async (_, state) => {
        states.push(state);
        return true;
      },

      beforeSaveResult: async () => {
        if (crashOnce) {
          crashOnce = false;
          throw new Error("💥 simulated crash");
        }
      },

      saveResult: async () => {
        saveCount++;
        return true;
      },
    });

    const q = new Queue("match-simulation", { connection: redis });

    await q.add(
      "run",
      { matchId: "m2" },
      {
        attempts: 2, // allow retry
        backoff: { type: "fixed", delay: 50 },
      }
    );

    await new Promise((r) => setTimeout(r, 600));

    expect(saveCount).toBe(1);
    expect(states).toContain("RUNNING");
    expect(states).toContain("FINISHED");
  });
});
