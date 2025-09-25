import { EngineNeo } from './engine-neo.browser.js';

const engine = new EngineNeo({ level: 18 });
let stopRequested = false;

const cloneGameCore = (core) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(core);
  }
  return JSON.parse(JSON.stringify(core));
};

self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};

  if (type === 'start') {
    stopRequested = false;

    const {
      gameCore,
      skill = 85,
      interval = 1000,
      maxTime = 10000
    } = payload || {};

    if (!gameCore) {
      self.postMessage({ type: 'error', payload: { message: 'Missing gameCore' } });
      return;
    }

    let elapsed = 0;
    let iteration = 0;
    let bestResult = null;
    let bestEval = -Infinity;

    while (!stopRequested && elapsed < maxTime) {
      iteration += 1;
      const remaining = maxTime - elapsed;
      const timeLimit = Math.min(interval, remaining);

      const request = {
        gameCore: cloneGameCore(gameCore),
        timeLimit,
        skill
      };

      const sliceStart = performance.now();
      try {
        const result = await engine.analyze(request);
        const sliceTime = performance.now() - sliceStart;
        elapsed += sliceTime;

        if (typeof result.evaluation === 'number') {
          if (result.evaluation > bestEval) {
            bestEval = result.evaluation;
            bestResult = result;
          }
        } else if (!bestResult) {
          bestResult = result;
        }

        self.postMessage({
          type: 'progress',
          payload: {
            iteration,
            elapsed,
            result,
            bestResult
          }
        });

        if (stopRequested || elapsed >= maxTime) {
          break;
        }
      } catch (error) {
        self.postMessage({
          type: 'error',
          payload: {
            message: error instanceof Error ? error.message : String(error),
            iteration,
            elapsed
          }
        });
        break;
      }
    }

    self.postMessage({
      type: stopRequested ? 'stopped' : 'done',
      payload: {
        elapsed,
        iterations: iteration,
        bestResult
      }
    });
  }

  if (type === 'stop') {
    stopRequested = true;
  }
});