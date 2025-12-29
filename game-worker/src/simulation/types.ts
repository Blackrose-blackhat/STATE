import { PostMortem } from "./postmortem";
import { ScoreBreakdown } from "./scoring";

export interface TrafficProfile {
  warmupRps: number;
  rampToRps: number;
  spikeRps: number;
  sustainRps: number;
}

export interface TickOutcome {
  ok: boolean;        // system is still up
  degraded: boolean; // user-visible pain
  latencyMs: number;
  errorRate: number;
  failureReason?: string;
}

export interface PlayerResult {
  survivedTicks: number;
  failedAtRps: number | null;
  failureReason: string | null;

  maxLatencyMs: number;
  maxErrorRate: number;

  degradedTicks: number;
  firstDegradedAtRps: number | null;

  postMortem: PostMortem;
}

export interface MatchResult {
  winner: 'A' | 'B' | 'DRAW';
  playerA: PlayerResult & { score: ScoreBreakdown };
  playerB: PlayerResult & { score: ScoreBreakdown };
}


export interface RawPlayerResult {
  survivedTicks: number;
  failedAtRps: number | null;
  failureReason: string | null;
  maxLatencyMs: number;
  maxErrorRate: number;
  degradedTicks: number;
  firstDegradedAtRps: number | null;
}
