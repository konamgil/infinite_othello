// Zenith 엔진과 워커를 함께 빌드하는 스크립트
import { build } from 'vite';
import { dirname, resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';

// ESM에서 __dirname 대체
const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildZenith() {
  try {
    console.log('🚀 Zenith 엔진 빌드 시작...');
    
    // 1. Zenith 엔진 빌드
    await build({
      build: {
        lib: {
          entry: resolvePath(__dirname, './src/engine/zenith/index.ts'),
          name: 'EngineZenith',
          fileName: 'engine-zenith',
          formats: ['es', 'umd']
        },
        rollupOptions: {
          external: [],
          output: {
            globals: {}
          }
        },
        outDir: 'public',
        emptyOutDir: false
      }
    });
    
    console.log('✅ Zenith 엔진 빌드 완료!');
    
    // 2. 워커 빌드
    console.log('🚀 워커 빌드 시작...');
    
    await build({
      build: {
        lib: {
          entry: resolvePath(__dirname, './src/engine/core/search-worker.ts'),
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
    
    // 3. SearchWorkerManager 빌드
    console.log('🚀 SearchWorkerManager 빌드 시작...');
    
    await build({
      build: {
        lib: {
          entry: resolvePath(__dirname, './src/engine/core/SearchWorkerManager.ts'),
          name: 'SearchWorkerManager',
          fileName: 'SearchWorkerManager',
          formats: ['es']
        },
        rollupOptions: {
          external: [],
          output: {
            globals: {}
          }
        },
        outDir: 'public',
        emptyOutDir: false
      }
    });
    
    console.log('✅ SearchWorkerManager 빌드 완료!');
    console.log('📁 생성된 파일:');
    console.log('  - public/engine-zenith.js (ES)');
    console.log('  - public/engine-zenith.umd.cjs (UMD)');
    console.log('  - public/search-worker.js (워커)');
    console.log('  - public/SearchWorkerManager.js (매니저)');
    
  } catch (error) {
    console.error('❌ 빌드 실패:', error);
    throw error;
  }
}

buildZenith();
