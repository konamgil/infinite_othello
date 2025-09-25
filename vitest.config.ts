import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/?(*.)+(spec|test).ts']
  },
  resolve: {
    alias: {
      'shared-types': resolve(__dirname, 'packages/shared-types/src/index.ts'),
      core: resolve(__dirname, 'packages/core/src/index.ts'),
      'engine-neo': resolve(__dirname, 'packages/engine-neo/src/index.ts'),
      'engine-a': resolve(__dirname, 'packages/engine-a/src/index.ts'),
      render: resolve(__dirname, 'packages/render/src/index.ts')
    }
  }
});
