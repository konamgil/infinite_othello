import type { Engine } from 'shared-types';

export interface TestMetrics {
  accuracy?: number;
  avgTime?: number;
  totalTime?: number;
  nodesPerSecond?: number;
  memoryUsage?: number;
  totalPositions?: number;
  correctMoves?: number;
}

export interface TestDetails {
  positions?: Array<{
    id: string;
    expected?: any;
    actual?: any;
    correct?: boolean;
    time?: number;
  }>;
  errors?: string[];
  warnings?: string[];
}

export interface TestResult {
  passed: boolean;
  score: number;
  metrics: TestMetrics;
  details: TestDetails;
  timestamp: number;
  engineName: string;
  suiteName: string;
}

export interface EngineTestSuite {
  name: string;
  description: string;
  category: 'accuracy' | 'performance' | 'endgame' | 'tactical' | 'stability';
  runTest(engine: Engine): Promise<TestResult>;
}

export interface EngineTestReport {
  engineName: string;
  engineVersion: string;
  timestamp: number;
  overallScore: number;
  overallPassed: boolean;
  testResults: TestResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    avgScore: number;
    totalTime: number;
  };
}

export interface ComparisonReport {
  engines: string[];
  timestamp: number;
  results: Array<{
    suiteName: string;
    scores: Record<string, number>;
    winner?: string;
  }>;
  overallWinner?: string;
}