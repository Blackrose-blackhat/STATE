import { Architecture } from "../schema/architecture";
import { Match, MatchState } from "../schema/match";
import { randomUUID } from "crypto";

const matches = new Map<string, Match>();

export async function createMatch(
  mode: "SOLO" | "DUEL"
): Promise<Match> {
const match: Match = {
    id: randomUUID(),
    mode,
    state: "CREATED",
    createdAt: Date.now(),
    players: {
      A: {},
      B: {},
    },
  };

  matches.set(match.id, match);
  return match;
}

export async function getMatch(
  id: string
): Promise<Match | null> {
  return matches.get(id) ?? null;
}
export async function submitArchitecture(
  matchId: string,
  player: "A" | "B",
  architecture: Architecture
): Promise<Match> {
  const match = matches.get(matchId);
  if (!match) {
    throw new Error("Match not found");
  }

  if (!["CREATED", "DESIGNING"].includes(match.state)) {
    throw new Error("Cannot submit architecture at this stage");
  }

  match.players[player].architecture = architecture;

  // move to DESIGNING once first architecture arrives
  if (match.state === "CREATED") {
    match.state = "DESIGNING";
  }

  matches.set(matchId, match);
  return match;
}
export async function lockMatch(matchId: string): Promise<Match> {
  const match = matches.get(matchId);
  if (!match) {
    throw new Error("Match not found");
  }

  if (!["CREATED", "DESIGNING"].includes(match.state)) {
    throw new Error("Match cannot be locked in current state");
  }

  // Preconditions
  if (!match.players.A.architecture) {
    throw new Error("Player A architecture not submitted");
  }

  if (match.mode === "DUEL" && !match.players.B.architecture) {
    throw new Error("Player B architecture not submitted");
  }

  // Transition to LOCKED (idempotent-safe for API calls)
  match.state = "LOCKED";
  matches.set(matchId, match);

  return match;
}
