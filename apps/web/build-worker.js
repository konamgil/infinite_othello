import { build } from 'vite';
import { resolve } from 'path';

async function buildWorker() {
  try {
    console.log('🚀 워커 빌드 시작...');
    
    await build({
      build: {
        lib: {
          entry: resolve('./src/engine/core/search-worker.ts'),
          name: 'SearchWorker',
          fileName: 'search-worker',
          formats: ['es']
        },
        rollupOptions: {
          external: [],
          output: {
            globals: {}
          }
        },
        // Allow dynamic imports for runtime engine loading
        target: 'esnext',
        minify: false,
        outDir: 'public',
        emptyOutDir: false
      }
    });
    
    console.log('✅ 워커 빌드 완료!');
    console.log('📁 생성된 파일: public/search-worker.js');
    
  } catch (error) {
    console.error('❌ 워커 빌드 실패:', error);
    throw error;
  }
}

buildWorker();
