// Framework
export * from './framework/EngineTestSuite';
export * from './framework/TestRunner';

// Test Suites
export * from './suites/PerformanceTestSuite';
export * from './suites/BasicAccuracyTestSuite';

// Convenience function to create a test runner with standard suites
import { EngineTestRunner } from './framework/TestRunner';
import { PerformanceTestSuite } from './suites/PerformanceTestSuite';
import { BasicAccuracyTestSuite } from './suites/BasicAccuracyTestSuite';
import type { Engine } from 'shared-types';

/**
 * Create a test runner with all standard test suites
 */
export function createStandardTestRunner(engine: Engine): EngineTestRunner {
  const runner = new EngineTestRunner(engine);

  runner.addTestSuites([
    new BasicAccuracyTestSuite(),
    new PerformanceTestSuite()
  ]);

  return runner;
}

/**
 * Quick test function for easy engine evaluation
 */
export async function testEngine(engine: Engine) {
  console.log(`🧪 Testing ${engine.name}...`);

  const runner = createStandardTestRunner(engine);
  const report = await runner.runAllTests();

  console.log('\n📊 Test Results:');
  console.log(`Overall Score: ${report.overallScore.toFixed(1)}%`);
  console.log(`Tests Passed: ${report.summary.passedTests}/${report.summary.totalTests}`);
  console.log(`Status: ${report.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);

  return report;
}