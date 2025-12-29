// src/repo/resultRepo.ts

const resultStore = new Map<string, unknown>(); // TEMP in-memory

export async function saveResult(
  matchId: string,
  result: unknown
): Promise<boolean> {
  const existing = resultStore.get(matchId);

  if (!existing) {
    resultStore.set(matchId, result);
    return true;
  }

  // if result already exists, ensure determinism
  const same =
    JSON.stringify(existing) === JSON.stringify(result);

  if (!same) {
    throw new Error(
      `Non-deterministic result for match ${matchId}`
    );
  }

  // idempotent no-op
  return false;
}
