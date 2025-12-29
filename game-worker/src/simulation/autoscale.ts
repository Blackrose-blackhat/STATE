import { Architecture } from './schema';
import { RuntimeComputeState } from './runtime';
import { computeCapacity } from './capacity';
import {
  AUTOSCALE_THRESHOLD,
  AUTOSCALE_DELAY_TICKS,
  AUTOSCALE_COOLDOWN,
  MAX_INSTANCES,
} from './constants';

export function maybeAutoscale(
  rps: number,
  arch: Architecture,
  runtime: RuntimeComputeState,
  sustainedHighLoadTicks: number
): { runtime: RuntimeComputeState; scaled: boolean } {
  if (!arch.compute.autoscale) {
    return { runtime, scaled: false };
  }

  if (runtime.scaleCooldown > 0) {
    return {
      runtime: {
        ...runtime,
        scaleCooldown: runtime.scaleCooldown - 1,
      },
      scaled: false,
    };
  }

  const capacity = computeCapacity({
    ...arch,
    compute: {
      ...arch.compute,
      instances: runtime.instances,
    },
  });

  const load = rps / capacity;

  if (
    load > AUTOSCALE_THRESHOLD &&
    sustainedHighLoadTicks >= AUTOSCALE_DELAY_TICKS &&
    runtime.instances < MAX_INSTANCES
  ) {
    return {
      runtime: {
        instances: runtime.instances + 1,
        scaleCooldown: AUTOSCALE_COOLDOWN,
      },
      scaled: true,
    };
  }

  return { runtime, scaled: false };
}
