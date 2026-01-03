import { TrafficProfile } from './types';

export function buildTrafficTimeline(
  profile: TrafficProfile
): number[] {
  const timeline: number[] = [];

  // warmup
  for (let rps = 10; rps <= profile.warmupRps; rps += 10) {
    timeline.push(rps);
  }

  // ramp
  for (let rps = profile.warmupRps; rps <= profile.rampToRps; rps += 40) {
    timeline.push(rps);
  }

  // spike
  timeline.push(profile.spikeRps);

  // sustain (fixed duration)
  for (let i = 0; i < 10; i++) {
    timeline.push(profile.sustainRps);
  }

  return timeline;
}
