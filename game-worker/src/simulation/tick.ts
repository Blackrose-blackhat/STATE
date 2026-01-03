import { Architecture } from "./schema";
import { computeCapacity, databaseCapacity, cacheHitRate } from "./capacity";
import { TickOutcome } from "./types";
import {
  HEALTHY_LOAD,
  DEGRADED_LOAD,
  FAILURE_LOAD,
  MAX_ACCEPTABLE_ERROR_RATE,
  MAX_ACCEPTABLE_LATENCY_MS,
  COMPUTE_FAILURE_LOAD,
  DB_FAILURE_LOAD,
} from "./threshold";
export function simulateTick(
  rps: number,
  arch: Architecture,
  runtimeInstances: number
): TickOutcome {
  // 🔑 derive effective architecture for THIS tick
  const effectiveArch: Architecture = {
    ...arch,
    compute: {
      ...arch.compute,
      instances: runtimeInstances,
    },
  };

  const computeCap = computeCapacity(effectiveArch);
  const dbCap = databaseCapacity(effectiveArch);
  const cacheHit = cacheHitRate(effectiveArch);
  const dbRps = rps * (1 - cacheHit);
  const dbLoad = dbRps / dbCap;

  const computeLoad = rps / computeCap;
  const computeOver = computeLoad / COMPUTE_FAILURE_LOAD;
  const dbOver = dbLoad / DB_FAILURE_LOAD;
  if (Math.max(computeOver, dbOver) > 1) {
    if (computeOver > dbOver) {
      return {
        ok: false,
        degraded: true,
        latencyMs: Infinity,
        errorRate: 1,
        failureReason: "Compute saturated",
      };
    }

    return {
      ok: false,
      degraded: true,
      latencyMs: Infinity,
      errorRate: 1,
      failureReason: "Database overloaded",
    };
  }

const latency =
  30 +
  Math.max(0, computeLoad - HEALTHY_LOAD) * 200 +
  Math.max(0, dbLoad - HEALTHY_LOAD) * 600;

const errorRate =
  Math.max(0, computeLoad - DEGRADED_LOAD) * 0.3 +
  Math.max(0, dbLoad - DEGRADED_LOAD) * 0.15;


  const degraded =
    latency > MAX_ACCEPTABLE_LATENCY_MS ||
    errorRate > MAX_ACCEPTABLE_ERROR_RATE;

  return {
    ok: true,
    degraded,
    latencyMs: latency,
    errorRate,
  };
}
