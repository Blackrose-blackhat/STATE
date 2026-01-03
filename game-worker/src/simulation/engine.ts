import { Architecture } from "./schema";
import { TrafficProfile, MatchResult, RawPlayerResult } from "./types";
import { buildTrafficTimeline } from "./traffic";
import { simulateTick } from "./tick";
import { RuntimeComputeState } from "./runtime";
import {
  deriveBottlenecks,
  generateRecommendations,
  PostMortem,
} from './postmortem';
import { computeScore } from "./scoring";



export function runMatchSimulation(input: {
  playerA: Architecture;
  playerB: Architecture;
  trafficProfile: TrafficProfile;
  seed: string;
}): MatchResult {
  const timeline = buildTrafficTimeline(input.trafficProfile);

  // Runtime state
  let runtimeA: RuntimeComputeState = {
    instances: input.playerA.compute.instances,
    scaleCooldown: 0,
  };

  let runtimeB: RuntimeComputeState = {
    instances: input.playerB.compute.instances,
    scaleCooldown: 0,
  };

  // Metrics
  const metricsA = initMetrics();
  const metricsB = initMetrics();

  for (const rps of timeline) {
    const tickA = metricsA.failed
      ? null
      : simulateTick(rps, input.playerA, runtimeA.instances);

    const tickB = metricsB.failed
      ? null
      : simulateTick(rps, input.playerB, runtimeB.instances);

    if (tickA) {
      applyTick(metricsA, rps, tickA);
      advanceRuntime(runtimeA, input.playerA, tickA);
    }

    if (tickB) {
      applyTick(metricsB, rps, tickB);
      advanceRuntime(runtimeB, input.playerB, tickB);
    }
    console.log('tick A',tickA);
    console.log('tickB', tickB);

    if (metricsA.failed || metricsB.failed) break;
  }

  const postMortemA = buildPostMortem(input.playerA, metricsA);
  const postMortemB = buildPostMortem(input.playerB, metricsB);

  const playerA = finalizePlayer(input.playerA, metricsA, postMortemA);
  const playerB = finalizePlayer(input.playerB, metricsB, postMortemB);

  const scoreA = computeScore(playerA, input.playerA);
  const scoreB = computeScore(playerB, input.playerB);

  let winner: MatchResult["winner"] = "DRAW";

  console.log(scoreA.total);
  console.log(scoreB.total);

  if (scoreA.total > scoreB.total) winner = "A";
  if (scoreB.total > scoreA.total) winner = "B";

  return {
    winner,
    playerA: {
      ...playerA,
      score: scoreA,
    },
    playerB: {
      ...playerB,
      score: scoreB,
    },
  };
}


function buildPostMortem(
  arch: Architecture,
  result: any
): PostMortem {
  const bottlenecks = deriveBottlenecks({
    failureReason: result.failureReason,
    firstDegradedAtRps: result.firstDegradedAtRps,
  });

  return {
    summary: result.failureReason
      ? `System failed due to ${result.failureReason.toLowerCase()}`
      : 'System survived the entire traffic profile',

    timeline: {
      firstDegradedAtRps: result.firstDegradedAtRps,
      failedAtRps: result.failedAtRps,
      survivedTicks: result.survivedTicks,
    },

    bottlenecks,

    keyMetrics: {
      maxLatencyMs: result.maxLatencyMs,
      maxErrorRate: result.maxErrorRate,
      degradedTicks: result.degradedTicks,
    },

    recommendations: generateRecommendations(
      arch,
      result.failureReason
    ),
  };
}
function initMetrics() {
  return {
    survivedTicks: 0,
    degradedTicks: 0,
    firstDegradedAtRps: null as number | null,
    failedAtRps: null as number | null,
    failureReason: null as string | null,
    maxLatencyMs: 0,
    maxErrorRate: 0,
    failed: false,
  };
}

function applyTick(metrics: any, rps: number, tick: any) {
  if (metrics.failed) return;

  metrics.survivedTicks++;
  metrics.maxLatencyMs = Math.max(metrics.maxLatencyMs, tick.latencyMs);
  metrics.maxErrorRate = Math.max(metrics.maxErrorRate, tick.errorRate);

  if (tick.degraded) {
    metrics.degradedTicks++;
    if (metrics.firstDegradedAtRps === null) {
      metrics.firstDegradedAtRps = rps;
    }
  }

  if (!tick.ok) {
    metrics.failed = true;
    metrics.failedAtRps = rps;
    metrics.failureReason = tick.failureReason ?? "Unknown failure";
  }
}

function advanceRuntime(
  runtime: RuntimeComputeState,
  arch: Architecture,
  tick: any
) {
  if (!arch.compute.autoscale) return;
  if (runtime.scaleCooldown > 0) {
    runtime.scaleCooldown--;
    return;
  }

  if (tick.degraded && !tick.failureReason) {
    runtime.instances += 1;
    runtime.scaleCooldown = 2;
  }
}

function finalizePlayer(
  arch: Architecture,
  metrics: any,
  postMortem: PostMortem
) {
  return {
    survivedTicks: metrics.survivedTicks,
    failedAtRps: metrics.failedAtRps,
    failureReason: metrics.failureReason,
    degradedTicks: metrics.degradedTicks,
    firstDegradedAtRps: metrics.firstDegradedAtRps,
    maxLatencyMs: metrics.maxLatencyMs,
    maxErrorRate: metrics.maxErrorRate,
    postMortem,
  };
}
