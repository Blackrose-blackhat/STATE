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

let saved = false;
let states: string[] = [];
let currentState: "LOCKED" | "RUNNING" | "FINISHED" = "LOCKED";

describe("match worker", () => {
  it("processes a match exactly once", async () => {
    let saved = false;
    const states: string[] = [];

 startMatchWorker({
  loadMatch: async () => ({
    id: 'm1',
    state: 'LOCKED',
    trafficProfile: TRAFFIC,
    playerA: { architecture: GOOD_ARCH },
    playerB: { architecture: GOOD_ARCH },
  }),

updateMatchState: async (_, next) => {
  if (currentState === "FINISHED") return false;

  if (currentState === "LOCKED" && next === "RUNNING") {
    currentState = "RUNNING";
    states.push(next);
    return true;
  }

  if (currentState === "RUNNING" && next === "FINISHED") {
    currentState = "FINISHED";
    states.push(next);
    return true;
  }

  return false;
},

  saveResult: async () => {
    saved = true;
    return true;
  },
});


    const q = new Queue("match-simulation", { connection: redis });
    await q.add("run", { matchId: "m1" });

    await new Promise((r) => setTimeout(r, 300));

    expect(saved).toBe(true);
    expect(states).toEqual(["RUNNING", "FINISHED"]);
  });
});
