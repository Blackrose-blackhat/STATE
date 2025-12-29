export interface RuntimeComputeState {
  instances: number;
  scaleCooldown: number; // ticks until next scale allowed
}
