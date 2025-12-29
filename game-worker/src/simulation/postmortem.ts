import { Architecture } from './schema';
export interface Bottleneck {
  component: 'compute' | 'database' | 'cache';
  reason: string;
  firstSeenAtRps: number;
}

export interface PostMortem {
  summary: string;

  timeline: {
    firstDegradedAtRps: number | null;
    failedAtRps: number | null;
    survivedTicks: number;
  };

  bottlenecks: Bottleneck[];

  keyMetrics: {
    maxLatencyMs: number;
    maxErrorRate: number;
    degradedTicks: number;
  };

  recommendations: string[];
}
export function deriveBottlenecks(input: {
  failureReason: string | null;
  firstDegradedAtRps: number | null;
}): Bottleneck[] {
  if (!input.failureReason) return [];

  if (input.failureReason.includes('Compute')) {
    return [{
      component: 'compute',
      reason: 'Compute capacity could not keep up with incoming load',
      firstSeenAtRps: input.firstDegradedAtRps ?? 0,
    }];
  }

  if (input.failureReason.includes('Database')) {
    return [{
      component: 'database',
      reason: 'Database throughput became the limiting factor',
      firstSeenAtRps: input.firstDegradedAtRps ?? 0,
    }];
  }

  return [];
}
export function generateRecommendations(
  arch: Architecture,
  failureReason: string | null
): string[] {
  const recs: string[] = [];

  if (!failureReason) return recs;

  if (
    failureReason.includes('Compute') &&
    arch.compute.type === 'stateful'
  ) {
    recs.push(
      'Move toward stateless compute to enable horizontal scaling'
    );
  }

  if (
    failureReason.includes('Database') &&
    arch.cache.strategy === 'off'
  ) {
    recs.push(
      'Introduce a cache to reduce database load'
    );
  }

  if (
    failureReason.includes('Database') &&
    arch.database.consistency === 'strong'
  ) {
    recs.push(
      'Consider eventual consistency to improve write throughput'
    );
  }

  if (!arch.compute.autoscale) {
    recs.push(
      'Enable autoscaling to handle sustained traffic growth'
    );
  }

  return recs;
}
