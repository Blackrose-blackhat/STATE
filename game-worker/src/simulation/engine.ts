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
function runForPlayer(
  arch: Architecture,
  timeline: number[]
): RawPlayerResult {
  let survivedTicks = 0;
  let maxLatency = 0;
  let maxErrorRate = 0;
  let degradedTicks = 0;
  let firstDegradedAtRps: number | null = null;

  let runtime: RuntimeComputeState = {
    instances: arch.compute.instances,
    scaleCooldown: 0,
  };

  let sustainedHighLoadTicks = 0;

  for (const rps of timeline) {
    const tick = simulateTick(rps, arch, runtime.instances);

    if (tick.degraded) {
      degradedTicks++;
      if (firstDegradedAtRps === null) {
        firstDegradedAtRps = rps;
      }
    }

    if (!tick.ok) {
      return {
        survivedTicks,
        failedAtRps: rps,
        failureReason: tick.failureReason!,
        maxLatencyMs: maxLatency,
        maxErrorRate,
        degradedTicks,
        firstDegradedAtRps,
      };
    }

    survivedTicks++;
    maxLatency = Math.max(maxLatency, tick.latencyMs);
    maxErrorRate = Math.max(maxErrorRate, tick.errorRate);
  }

  return {
    survivedTicks,
    failedAtRps: null,
    failureReason: null,
    maxLatencyMs: maxLatency,
    maxErrorRate,
    degradedTicks,
    firstDegradedAtRps,
  };
}


export function runMatchSimulation(input: {
  playerA: Architecture;
  playerB: Architecture;
  trafficProfile: TrafficProfile;
  seed: string;
}): MatchResult {
  const timeline = buildTrafficTimeline(input.trafficProfile);

  const rawA = runForPlayer(input.playerA, timeline);
  const rawB = runForPlayer(input.playerB, timeline);

  const playerA = {
    ...rawA,
    postMortem: buildPostMortem(input.playerA, rawA),
  };

  const playerB = {
    ...rawB,
    postMortem: buildPostMortem(input.playerB, rawB),
  };

  const scoreA = computeScore(playerA, input.playerA);
  const scoreB = computeScore(playerB, input.playerB);

  let winner: MatchResult['winner'] = 'DRAW';

  if (scoreA.total > scoreB.total) winner = 'A';
  if (scoreB.total > scoreA.total) winner = 'B';

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