import type { Engine, EngineRequest, EngineResponse } from "shared-types";

let current: Engine | null = null;

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

export async function bestMove(req: EngineRequest): Promise<EngineResponse> {
  if (!current) await selectEngine("A");
  return current!.analyze(req);
}

