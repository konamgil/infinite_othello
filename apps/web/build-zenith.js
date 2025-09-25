// Zenith 엔진을 브라우저용으로 빌드하는 스크립트
import { build } from 'vite';
import { resolve } from 'path';

async function buildZenith() {
  try {
    console.log('🚀 Zenith 엔진 빌드 시작...');
    
    await build({
      build: {
        lib: {
          entry: resolve('./src/engine/zenith/index.ts'),
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
    console.log('📁 생성된 파일: public/engine-zenith.es.js, public/engine-zenith.umd.js');
    
  } catch (error) {
    console.error('❌ Zenith 엔진 빌드 실패:', error);
  }
}

buildZenith();
