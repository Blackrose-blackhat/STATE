import { PlayerResult } from './types';
import { Architecture } from './schema';

export interface ScoreBreakdown {
  total: number;

  survivalScore: number;
  degradationPenalty: number;
  inefficiencyPenalty: number;
}
function computeSurvivalScore(
  result: PlayerResult
): number {
  return result.survivedTicks * 10;
}
function computeDegradationPenalty(
  result: PlayerResult
): number {
  const basePenalty = result.degradedTicks * 5;

  if (result.firstDegradedAtRps === null) {
    return 0;
  }

  // early pain multiplier
  const earlyPainMultiplier =
    result.firstDegradedAtRps < 200 ? 1.5 : 1.0;

  return Math.floor(basePenalty * earlyPainMultiplier);
}
function computeInefficiencyPenalty(
  arch: Architecture
): number {
  let penalty = 0;

  // penalize over-provisioning
  if (arch.compute.instances > 5) {
    penalty += (arch.compute.instances - 5) * 10;
  }

  // autoscaling has a small cost (complexity, cold starts)
  if (arch.compute.autoscale) {
    penalty += 10;
  }

  return penalty;
}
export function computeScore(
  result: PlayerResult,
  arch: Architecture
): ScoreBreakdown {
  const survivalScore = computeSurvivalScore(result);
  const degradationPenalty =
    computeDegradationPenalty(result);
  const inefficiencyPenalty =
    computeInefficiencyPenalty(arch);

  return {
    survivalScore,
    degradationPenalty,
    inefficiencyPenalty,
    total:
      survivalScore -
      degradationPenalty -
      inefficiencyPenalty,
  };
}
