import { startMatchWorker } from './worker';
import { loadMatch, updateMatchState } from './repo/matchRepo';
import { saveResult } from './repo/resultRepo';
console.log('worker started');

startMatchWorker({
  loadMatch,
  updateMatchState,
  saveResult,
});
