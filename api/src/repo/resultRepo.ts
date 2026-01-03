import { MatchResult } from "../../../game-worker/src/simulation/types";
import { redis } from "../infra/redis";
import { supabase } from "../infra/supabase";
// TEMP in-memory store
const results = new Map<string, MatchResult>();

export async function getResult(matchId: string) {
  // 1. Redis (fast path)
  const cached = await redis.get(`match:result:${matchId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. DB fallback (source of truth)
  const { data, error } = await supabase
    .from("match_results")
    .select("result")
    .eq("match_id", matchId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.result;
}

/**
 * TEMP hook for local testing.
 * In real deployment:
 * - worker writes to DB
 * - API reads from DB
 */
export async function _saveResultForApi(
  matchId: string,
  result: MatchResult
) {
  results.set(matchId, result);
}
