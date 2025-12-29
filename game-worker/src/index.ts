import { startMatchWorker } from './worker';
import { loadMatch, updateMatchState } from './repo/matchRepo';
import { saveResult } from './repo/resultRepo';


startMatchWorker({
  loadMatch,
  updateMatchState,
  saveResult,
});
