import type { Engine, EngineRequest, EngineResponse } from "shared-types";
import engineA from "engine-a";

// Placeholder: reuse engine A logic for now (WASM target in the future)
const engine: Engine = {
  async analyze(req: EngineRequest): Promise<EngineResponse> {
    return engineA.analyze(req);
  },
};

export default engine;

