// 통합 엔진 빌드 스크립트
import { build } from 'vite';
import { resolve } from 'path';

const engines = [
  { name: 'a', entry: './src/engine/a/index.ts' },
  { name: 'neo', entry: './src/engine/neo/index.ts' },
  { name: 'zenith', entry: './src/engine/zenith/index.ts' },
  { name: 'harang', entry: './src/engine/harang/index.ts' },
  { name: 'core', entry: './src/engine/core/index.ts' }
];

async function buildEngine(engine) {
  try {
    console.log(`🚀 ${engine.name} 엔진 빌드 시작...`);
    
    await build({
      build: {
        lib: {
          entry: resolve(engine.entry),
          name: `Engine${engine.name.charAt(0).toUpperCase() + engine.name.slice(1)}`,
          fileName: `engine-${engine.name}`,
          formats: ['es', 'umd']
        },
        rollupOptions: {
          external: [], // core는 번들에 포함
          output: {
            globals: {}
          }
        },
        outDir: 'public',
        emptyOutDir: false
      }
    });
    
    console.log(`✅ ${engine.name} 엔진 빌드 완료!`);
    console.log(`📁 생성된 파일: public/engine-${engine.name}.es.js, public/engine-${engine.name}.umd.js`);
    
  } catch (error) {
    console.error(`❌ ${engine.name} 엔진 빌드 실패:`, error);
  }
}

async function buildAllEngines() {
  console.log('🎯 모든 엔진 빌드 시작...');
  
  for (const engine of engines) {
    await buildEngine(engine);
  }
  
  console.log('🎉 모든 엔진 빌드 완료!');
}

// 개별 엔진 빌드
if (process.argv[2]) {
  const engineName = process.argv[2];
  const engine = engines.find(e => e.name === engineName);
  
  if (engine) {
    buildEngine(engine);
  } else {
    console.error(`❌ 알 수 없는 엔진: ${engineName}`);
    console.log('사용 가능한 엔진:', engines.map(e => e.name).join(', '));
  }
} else {
  // 모든 엔진 빌드
  buildAllEngines();
}

