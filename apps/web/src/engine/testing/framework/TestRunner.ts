import type { Engine } from '../../types';
import type {
  EngineTestSuite,
  EngineTestReport,
  TestResult,
  ComparisonReport
} from './EngineTestSuite';

export class EngineTestRunner {
  private testSuites: EngineTestSuite[] = [];

  constructor(private engine: Engine) {}

  addTestSuite(suite: EngineTestSuite): void {
    this.testSuites.push(suite);
  }

  addTestSuites(suites: EngineTestSuite[]): void {
    this.testSuites.push(...suites);
  }

  async runAllTests(): Promise<EngineTestReport> {
    const startTime = performance.now();
    const results: TestResult[] = [];

    console.log(`🧪 Running tests for ${this.engine.name}...`);

    for (const suite of this.testSuites) {
      try {
        console.log(`  📋 ${suite.name}...`);
        const result = await suite.runTest(this.engine);
        results.push(result);

        const status = result.passed ? '✅' : '❌';
        console.log(`  ${status} ${suite.name}: ${result.score.toFixed(1)}%`);
      } catch (error) {
        console.error(`  ❌ ${suite.name}: Error -`, error);
        results.push({
          passed: false,
          score: 0,
          metrics: {},
          details: {
            errors: [error instanceof Error ? error.message : 'Unknown error']
          },
          timestamp: Date.now(),
          engineName: this.engine.name,
          suiteName: suite.name
        });
      }
    }

    const totalTime = performance.now() - startTime;
    return this.generateReport(results, totalTime);
  }

  async runTestSuite(suiteName: string): Promise<TestResult | null> {
    const suite = this.testSuites.find(s => s.name === suiteName);
    if (!suite) {
      console.error(`Test suite not found: ${suiteName}`);
      return null;
    }

    console.log(`🧪 Running ${suite.name} for ${this.engine.name}...`);
    return await suite.runTest(this.engine);
  }

  private generateReport(results: TestResult[], totalTime: number): EngineTestReport {
    const passedTests = results.filter(r => r.passed).length;
    const avgScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length
      : 0;

    return {
      engineName: this.engine.name,
      engineVersion: this.engine.version || '1.0.0',
      timestamp: Date.now(),
      overallScore: avgScore,
      overallPassed: passedTests === results.length && avgScore >= 75,
      testResults: results,
      summary: {
        totalTests: results.length,
        passedTests,
        failedTests: results.length - passedTests,
        avgScore,
        totalTime
      }
    };
  }

  static async compareEngines(
    engines: Engine[],
    testSuites: EngineTestSuite[]
  ): Promise<ComparisonReport> {
    const results: ComparisonReport['results'] = [];

    console.log('🏆 Running engine comparison...');

    for (const suite of testSuites) {
      console.log(`  📋 ${suite.name}...`);

      const scores: Record<string, number> = {};
      let highestScore = -1;
      let winner: string | undefined;

      for (const engine of engines) {
        try {
          const result = await suite.runTest(engine);
          scores[engine.name] = result.score;

          if (result.score > highestScore) {
            highestScore = result.score;
            winner = engine.name;
          }
        } catch (error) {
          console.error(`    ❌ ${engine.name} failed:`, error);
          scores[engine.name] = 0;
        }
      }

      results.push({
        suiteName: suite.name,
        scores,
        winner
      });

      console.log(`    🏆 Winner: ${winner} (${highestScore.toFixed(1)}%)`);
    }

    // Determine overall winner
    const engineScores: Record<string, number> = {};
    for (const engine of engines) {
      engineScores[engine.name] = 0;
    }

    for (const result of results) {
      for (const [engineName, score] of Object.entries(result.scores)) {
        engineScores[engineName] += score;
      }
    }

    const overallWinner = Object.entries(engineScores)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    console.log('📊 Overall Results:');
    Object.entries(engineScores)
      .sort(([,a], [,b]) => b - a)
      .forEach(([name, score], index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        console.log(`  ${medal} ${name}: ${(score / testSuites.length).toFixed(1)}% avg`);
      });

    return {
      engines: engines.map(e => e.name),
      timestamp: Date.now(),
      results,
      overallWinner
    };
  }

  getTestSuites(): EngineTestSuite[] {
    return [...this.testSuites];
  }

  clearTestSuites(): void {
    this.testSuites = [];
  }
}