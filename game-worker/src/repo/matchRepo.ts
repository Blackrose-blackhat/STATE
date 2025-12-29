// src/repo/matchRepo.ts
import { MatchSchema, Match } from './matchSchema';

export type MatchState =
  | 'CREATED'
  | 'WAITING_FOR_PLAYER'
  | 'DESIGNING'
  | 'LOCKED'
  | 'RUNNING'
  | 'FINISHED'
  | 'FAILED';

export async function loadMatch(matchId: string): Promise<Match> {
  const raw = {
    id: matchId,
    state: 'LOCKED',
    trafficProfile: {
      warmupRps: 50,
      rampToRps: 200,
      spikeRps: 400,
      sustainRps: 250,
    },
    playerA: {
      architecture: {
        loadBalancer: 'round_robin',
        compute: {
          type: 'stateless',
          instances: 4,
          autoscale: false,
        },
        database: {
          type: 'replicated',
          consistency: 'eventual',
        },
        cache: {
          strategy: 'read_through',
        },
      },
    },
    playerB: {
      architecture: {
        loadBalancer: 'round_robin',
        compute: {
          type: 'stateful',
          instances: 2,
          autoscale: false,
        },
        database: {
          type: 'single',
          consistency: 'strong',
        },
        cache: {
          strategy: 'off',
        },
      },
    },
  };

  const parsed = MatchSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Invalid match data: ${parsed.error.message}`);
  }

  return parsed.data;
}

// 👇 THIS WAS MISSING
// src/repo/matchRepo.ts

const matchStateStore = new Map<string, MatchState>(); // TEMP in-memory

export async function updateMatchState(
  matchId: string,
  next: MatchState
): Promise<boolean> {
  const current = matchStateStore.get(matchId) ?? 'LOCKED';

  // terminal states are final
  if (current === 'FINISHED' || current === 'FAILED') {
    return false;
  }

  // illegal transitions
  if (
    (current === 'LOCKED' && next !== 'RUNNING') ||
    (current === 'RUNNING' && !['FINISHED', 'FAILED'].includes(next))
  ) {
    throw new Error(
      `Illegal state transition ${current} → ${next}`
    );
  }

  // idempotent write
  if (current === next) {
    return true;
  }

  matchStateStore.set(matchId, next);
  return true;
}
