import { supabase } from "../infra/supabase";
import { MatchResult } from "../simulation/types";

export async function persistFinalResult(
  matchId: string,
  result: MatchResult
): Promise<boolean> {
  // Insert final result exactly once
  const { error } = await supabase
    .from("match_results")
    .insert({
      match_id: matchId,
      result,
    });

  if (error) {
    // Unique violation => already persisted (retry-safe)
    if (error.code === "23505") {
      return false;
    }
    throw error;
  }

  // Update match metadata (best effort)
  await supabase
    .from("matches")
    .upsert({
      id: matchId,
      state: "FINISHED",
      finished_at: new Date().toISOString(),
    });

  return true;
}
