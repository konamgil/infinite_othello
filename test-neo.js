// Quick test script for Neo engine
import { engineNeo } from './packages/engine-neo/dist/index.js';
import { testEngine } from './packages/engine-testing/dist/index.js';

async function main() {
  console.log('🚀 Testing Neo AI Engine...\n');

  try {
    const report = await testEngine(engineNeo);

    console.log('\n🎯 Detailed Results:');
    for (const result of report.testResults) {
      console.log(`\n📋 ${result.suiteName}:`);
      console.log(`   Score: ${result.score.toFixed(1)}%`);
      console.log(`   Status: ${result.passed ? '✅' : '❌'}`);

      if (result.metrics.accuracy) {
        console.log(`   Accuracy: ${(result.metrics.accuracy * 100).toFixed(1)}%`);
      }
      if (result.metrics.avgTime) {
        console.log(`   Avg Time: ${result.metrics.avgTime.toFixed(0)}ms`);
      }
      if (result.metrics.nodesPerSecond) {
        console.log(`   Speed: ${result.metrics.nodesPerSecond.toLocaleString()} NPS`);
      }
    }

    process.exit(report.overallPassed ? 0 : 1);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();