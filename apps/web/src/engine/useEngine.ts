import type { Engine, EngineRequest, EngineResponse } from "shared-types";

let current: Engine | null = null;

/**
 * Dynamically imports and selects an Othello game engine based on the specified tier.
 *
 * The engines are lazy-loaded, meaning they are only imported when first requested.
 * The selected engine is stored in the `current` module-level variable.
 *
 * @param {'A' | 'B' | 'C' | 'D'} tier - The tier of the engine to select.
 * @returns {Promise<void>} A promise that resolves when the engine has been imported and selected.
 */
export async function selectEngine(tier: "A" | "B" | "C" | "D"): Promise<void> {
  switch (tier) {
    case "A":
      current = (await import("engine-a")).default;
      break;
    case "B":
      current = (await import("engine-b")).default;
      break;
    case "C":
      current = (await import("engine-c")).default;
      break;
    case "D":
      current = (await import("engine-d")).default;
      break;
    default:
      current = (await import("engine-a")).default;
  }
}

/**
 * Calculates the best move for a given game state using the currently selected engine.
 *
 * If no engine is currently selected, it defaults to selecting the 'A' tier engine.
 * It then calls the `analyze` method of the engine to determine the best move.
 *
 * @param {EngineRequest} req - The request object containing the game state to analyze.
 * @returns {Promise<EngineResponse>} A promise that resolves with the engine's response, including the best move.
 */
export async function bestMove(req: EngineRequest): Promise<EngineResponse> {
  if (!current) await selectEngine("A");
  return current!.analyze(req);
}

